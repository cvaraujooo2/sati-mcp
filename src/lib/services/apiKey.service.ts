/**
 * API Key Service
 * 
 * Responsável por gerenciar as API keys dos usuários no Supabase.
 * Baseado na implementação do MCPJam Inspector com adaptações para o SATI.
 */

import { createClient } from "@/lib/supabase/client"
import { Database } from "@/types/database"

export type UserApiKey = Database['public']['Tables']['user_api_keys']['Row']
export type UserApiKeyInsert = Database['public']['Tables']['user_api_keys']['Insert']
export type UserApiKeyUpdate = Database['public']['Tables']['user_api_keys']['Update']

export type ApiProvider = 'openai' | 'anthropic' | 'google' | 'deepseek'

export interface ApiKeyValidationResult {
  isValid: boolean
  error?: string
  model?: string
  organization?: string
}

/**
 * Service para gerenciamento de API keys
 */
export class ApiKeyService {
  private supabase = createClient()

  /**
   * Salva ou atualiza uma API key para o usuário
   */
  async saveApiKey(provider: ApiProvider, apiKey: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { success: false, error: "User not authenticated" }
      }

      // Por enquanto, salvamos em texto plano (TODO: migrar para Supabase Vault)
      const keyData: UserApiKeyInsert = {
        user_id: user.id,
        provider,
        encrypted_key: apiKey, // TODO: Encrypt using Supabase Vault
        last_used_at: new Date().toISOString()
      }

      const { error } = await this.supabase
        .from("user_api_keys")
        .upsert(keyData, {
          onConflict: 'user_id,provider'
        })

      if (error) {
        console.error("Error saving API key:", error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error("Error in saveApiKey:", error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error"
      }
    }
  }

  /**
   * Busca a API key do usuário para um provider
   */
  async getApiKey(provider: ApiProvider): Promise<string | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await this.supabase
        .from("user_api_keys")
        .select("encrypted_key")
        .eq("user_id", user.id)
        .eq("provider", provider)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found
          return null
        }
        console.error("Error getting API key:", error)
        return null
      }

      // TODO: Decrypt using Supabase Vault
      return data?.encrypted_key || null
    } catch (error) {
      console.error("Error in getApiKey:", error)
      return null
    }
  }

  /**
   * Remove a API key do usuário
   */
  async removeApiKey(provider: ApiProvider): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { success: false, error: "User not authenticated" }
      }

      const { error } = await this.supabase
        .from("user_api_keys")
        .delete()
        .eq("user_id", user.id)
        .eq("provider", provider)

      if (error) {
        console.error("Error removing API key:", error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error("Error in removeApiKey:", error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error"
      }
    }
  }

  /**
   * Lista todas as API keys do usuário
   */
  async listApiKeys(): Promise<UserApiKey[]> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await this.supabase
        .from("user_api_keys")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error listing API keys:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Error in listApiKeys:", error)
      return []
    }
  }

  /**
   * Valida uma API key testando uma chamada via endpoint backend
   * IMPORTANTE: Agora usa endpoint backend para não expor key no cliente
   */
  async validateApiKey(provider: ApiProvider, apiKey: string): Promise<ApiKeyValidationResult> {
    try {
      // Chamar endpoint backend para validação segura
      const response = await fetch('/api/settings/validate-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          apiKey,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          isValid: false,
          error: error.error || 'Erro ao validar API key',
        }
      }

      const result = await response.json()
      return {
        isValid: result.isValid,
        error: result.error,
        model: result.model,
        organization: result.organization,
      }

    } catch (error) {
      console.error('[validateApiKey] Error:', error)
      return { 
        isValid: false, 
        error: 'Erro de conexão. Verifique sua internet.',
      }
    }
  }

  /**
   * Atualiza o timestamp de last_used_at
   */
  async updateLastUsed(provider: ApiProvider): Promise<void> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) return

      await this.supabase
        .from("user_api_keys")
        .update({ last_used_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("provider", provider)
    } catch (error) {
      console.error("Error updating last_used_at:", error)
    }
  }
}

// Instância singleton do service
export const apiKeyService = new ApiKeyService()