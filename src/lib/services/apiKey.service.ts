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
   * Valida uma API key testando uma chamada real à API
   */
  async validateApiKey(provider: ApiProvider, apiKey: string): Promise<ApiKeyValidationResult> {
    try {
      switch (provider) {
        case 'openai':
          return await this.validateOpenAIKey(apiKey)
        case 'anthropic':
          return await this.validateAnthropicKey(apiKey)
        case 'google':
          return await this.validateGoogleKey(apiKey)
        case 'deepseek':
          return await this.validateDeepSeekKey(apiKey)
        default:
          return { isValid: false, error: "Unsupported provider" }
      }
    } catch (error) {
      return { 
        isValid: false, 
        error: error instanceof Error ? error.message : "Validation failed"
      }
    }
  }

  /**
   * Valida uma API key da OpenAI
   */
  private async validateOpenAIKey(apiKey: string): Promise<ApiKeyValidationResult> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const error = await response.text()
        return { 
          isValid: false, 
          error: `OpenAI API error: ${response.status} ${error}`
        }
      }

      const data = await response.json()
      
      // Verificar se tem acesso aos modelos que usamos
      const hasGPT4 = data.data?.some((model: any) => 
        model.id.includes('gpt-4') || model.id.includes('gpt-3.5')
      )

      if (!hasGPT4) {
        return { 
          isValid: false, 
          error: "API key doesn't have access to required models"
        }
      }

      return { 
        isValid: true,
        model: data.data?.[0]?.id || "unknown"
      }
    } catch (error) {
      return { 
        isValid: false, 
        error: `Network error: ${error instanceof Error ? error.message : 'Unknown'}`
      }
    }
  }

  /**
   * Valida uma API key da Anthropic (placeholder)
   */
  private async validateAnthropicKey(apiKey: string): Promise<ApiKeyValidationResult> {
    // TODO: Implementar validação da Anthropic quando necessário
    return { isValid: false, error: "Anthropic validation not implemented yet" }
  }

  /**
   * Valida uma API key da Google (placeholder)
   */
  private async validateGoogleKey(apiKey: string): Promise<ApiKeyValidationResult> {
    // TODO: Implementar validação da Google quando necessário
    return { isValid: false, error: "Google validation not implemented yet" }
  }

  /**
   * Valida uma API key da DeepSeek (placeholder)
   */
  private async validateDeepSeekKey(apiKey: string): Promise<ApiKeyValidationResult> {
    // TODO: Implementar validação da DeepSeek quando necessário
    return { isValid: false, error: "DeepSeek validation not implemented yet" }
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