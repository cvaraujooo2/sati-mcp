/**
 * User Preferences Service
 * 
 * Gerencia preferências do usuário (modelo preferido, provider, avisos dismissados)
 */

import { createClient } from '@/lib/supabase/client'
import { UserPreferences } from '@/lib/chat/types'
import { modelRegistry } from './modelRegistry.service'

export class UserPreferencesService {
  private supabase = createClient()

  /**
   * Busca as preferências do usuário
   * Cria automaticamente com valores default se não existir
   */
  async getPreferences(): Promise<UserPreferences | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await this.supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) {
        // Se não existe, cria com defaults
        if (error.code === 'PGRST116') {
          return await this.createDefaultPreferences(user.id)
        }
        
        // Se a tabela não existe (406) ou outro erro, retornar defaults sem persistir
        if (error.code === 'PGRST301' || error.message?.includes('406')) {
          console.warn('[UserPreferences] Table not migrated yet, using defaults')
          return this.getDefaultPreferences(user.id)
        }
        
        console.error('[UserPreferences] Error fetching:', error)
        return null
      }

      return data as UserPreferences
    } catch (error) {
      console.error('[UserPreferences] Exception:', error)
      // Em caso de erro, retornar defaults
      const { data: { user } } = await this.supabase.auth.getUser()
      if (user) {
        return this.getDefaultPreferences(user.id)
      }
      return null
    }
  }

  /**
   * Retorna preferências default sem persistir no banco
   */
  private getDefaultPreferences(userId: string): UserPreferences {
    const defaultModel = modelRegistry.getDefaultModelForProvider('openai')
    return {
      id: 'temp-' + userId,
      user_id: userId,
      preferred_provider: 'openai',
      preferred_model: defaultModel?.id || 'gpt-4o-mini',
      model_warnings_dismissed: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  /**
   * Cria preferências default para um novo usuário
   */
  private async createDefaultPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const defaultModel = modelRegistry.getDefaultModelForProvider('openai')
      
      const newPreferences = {
        user_id: userId,
        preferred_provider: 'openai' as const,
        preferred_model: defaultModel?.id || 'gpt-4o-mini',
        model_warnings_dismissed: []
      }

      const { data, error } = await this.supabase
        .from('user_preferences')
        .insert(newPreferences)
        .select()
        .single()

      if (error) {
        console.error('[UserPreferences] Error creating default:', error)
        return null
      }

      return data as UserPreferences
    } catch (error) {
      console.error('[UserPreferences] Exception creating default:', error)
      return null
    }
  }

  /**
   * Atualiza o modelo e provider preferido
   */
  async updatePreferredModel(
    provider: 'openai' | 'anthropic' | 'google',
    modelId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      // Validar se o modelo existe e está ativo
      const model = modelRegistry.getModelById(modelId)
      if (!model) {
        return { success: false, error: 'Invalid model ID' }
      }

      if (model.provider !== provider) {
        return { success: false, error: 'Model does not belong to specified provider' }
      }

      if (model.deprecated) {
        return { 
          success: false, 
          error: `Model ${model.name} is deprecated. Please choose another model.` 
        }
      }

      // Atualizar preferências
      const { error } = await this.supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          preferred_provider: provider,
          preferred_model: modelId,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (error) {
        console.error('[UserPreferences] Error updating:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('[UserPreferences] Exception updating:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Marca um aviso de modelo como dismissado
   */
  async dismissModelWarning(warningId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      // Buscar preferências atuais
      const preferences = await this.getPreferences()
      if (!preferences) {
        return { success: false, error: 'Preferences not found' }
      }

      // Adicionar warning ID à lista de dismissados (se não estiver já)
      const dismissedWarnings = preferences.model_warnings_dismissed || []
      if (!dismissedWarnings.includes(warningId)) {
        dismissedWarnings.push(warningId)
      }

      // Atualizar
      const { error } = await this.supabase
        .from('user_preferences')
        .update({
          model_warnings_dismissed: dismissedWarnings,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (error) {
        console.error('[UserPreferences] Error dismissing warning:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('[UserPreferences] Exception dismissing warning:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Retorna warnings que ainda não foram dismissados pelo usuário
   */
  async getActiveWarnings(): Promise<any[]> {
    try {
      const preferences = await this.getPreferences()
      if (!preferences) return []

      // Buscar todos os warnings disponíveis
      const allWarnings = modelRegistry.getAllWarnings(preferences.preferred_model)

      // Filtrar os que já foram dismissados
      const dismissedIds = preferences.model_warnings_dismissed || []
      return allWarnings.filter(warning => !dismissedIds.includes(warning.id))
    } catch (error) {
      console.error('[UserPreferences] Exception getting warnings:', error)
      return []
    }
  }

  /**
   * Reseta avisos dismissados (útil para testes ou quando houver novos avisos importantes)
   */
  async resetDismissedWarnings(): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      const { error } = await this.supabase
        .from('user_preferences')
        .update({
          model_warnings_dismissed: [],
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (error) {
        console.error('[UserPreferences] Error resetting warnings:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('[UserPreferences] Exception resetting warnings:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Singleton instance
export const userPreferencesService = new UserPreferencesService()


