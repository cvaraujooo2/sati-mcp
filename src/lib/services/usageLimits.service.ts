/**
 * Usage Limits Service
 * 
 * Gerencia limites de uso para free tier (fallback API do sistema)
 */

import { createClient } from '@/lib/supabase/server'
import { UserUsageLimits } from '@/lib/chat/types'

// Limites configuráveis (podem vir de env vars)
const FREE_TIER_DAILY_LIMIT = parseInt(process.env.FREE_TIER_DAILY_LIMIT || '10')
const FREE_TIER_MONTHLY_LIMIT = parseInt(process.env.FREE_TIER_MONTHLY_LIMIT || '100')

export class UsageLimitsService {
  /**
   * Verifica se um usuário pode fazer uma request (free tier)
   */
  async checkUserLimit(userId: string): Promise<{
    canUse: boolean
    reason?: string
    remainingDaily: number
    remainingMonthly: number
  }> {
    try {
      const supabase = await createClient()
      
      // Buscar ou criar registro de limites
      const limits = await this.getOrCreateLimits(userId)
      if (!limits) {
        return {
          canUse: false,
          reason: 'Failed to load usage limits',
          remainingDaily: 0,
          remainingMonthly: 0
        }
      }

      // Verificar se é BYOK (usuário tem API key própria)
      if (limits.tier === 'byok') {
        return {
          canUse: true, // Ilimitado para BYOK
          remainingDaily: -1, // -1 indica ilimitado
          remainingMonthly: -1
        }
      }

      // Resetar contadores se necessário
      const today = new Date().toISOString().split('T')[0]
      const lastRequestDate = limits.last_request_date?.split('T')[0]
      
      if (lastRequestDate !== today) {
        // Novo dia, resetar daily
        await this.resetDailyLimit(userId)
        limits.daily_requests_used = 0
      }

      // Verificar limites
      const remainingDaily = FREE_TIER_DAILY_LIMIT - limits.daily_requests_used
      const remainingMonthly = FREE_TIER_MONTHLY_LIMIT - limits.monthly_requests_used

      if (remainingDaily <= 0) {
        return {
          canUse: false,
          reason: 'Daily limit reached',
          remainingDaily: 0,
          remainingMonthly: Math.max(0, remainingMonthly)
        }
      }

      if (remainingMonthly <= 0) {
        return {
          canUse: false,
          reason: 'Monthly limit reached',
          remainingDaily: Math.max(0, remainingDaily),
          remainingMonthly: 0
        }
      }

      return {
        canUse: true,
        remainingDaily,
        remainingMonthly
      }
    } catch (error) {
      console.error('[UsageLimits] Error checking limit:', error)
      return {
        canUse: false,
        reason: 'Error checking limits',
        remainingDaily: 0,
        remainingMonthly: 0
      }
    }
  }

  /**
   * Incrementa o contador de uso após uma request bem-sucedida
   */
  async incrementUsage(userId: string): Promise<void> {
    try {
      const supabase = await createClient()
      const today = new Date().toISOString()

      // Buscar limites atuais
      const { data: limits } = await supabase
        .from('user_usage_limits')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (!limits) {
        console.error('[UsageLimits] No limits found for user')
        return
      }

      // Incrementar contadores
      const { error } = await supabase
        .from('user_usage_limits')
        .update({
          daily_requests_used: limits.daily_requests_used + 1,
          monthly_requests_used: limits.monthly_requests_used + 1,
          last_request_date: today,
          updated_at: today
        })
        .eq('user_id', userId)

      if (error) {
        console.error('[UsageLimits] Error incrementing usage:', error)
      }
    } catch (error) {
      console.error('[UsageLimits] Exception incrementing usage:', error)
    }
  }

  /**
   * Busca ou cria registro de limites para um usuário
   */
  private async getOrCreateLimits(userId: string): Promise<UserUsageLimits | null> {
    try {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('user_usage_limits')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        // Se não existe, criar
        if (error.code === 'PGRST116') {
          return await this.createDefaultLimits(userId)
        }
        console.error('[UsageLimits] Error fetching:', error)
        return null
      }

      return data as UserUsageLimits
    } catch (error) {
      console.error('[UsageLimits] Exception getting limits:', error)
      return null
    }
  }

  /**
   * Cria registro de limites default para novo usuário
   */
  private async createDefaultLimits(userId: string): Promise<UserUsageLimits | null> {
    try {
      const supabase = await createClient()
      const today = new Date().toISOString()

      const newLimits = {
        user_id: userId,
        daily_requests_used: 0,
        monthly_requests_used: 0,
        last_request_date: today,
        last_reset_date: today,
        monthly_reset_date: today,
        tier: 'free' as const
      }

      const { data, error } = await supabase
        .from('user_usage_limits')
        .insert(newLimits)
        .select()
        .single()

      if (error) {
        console.error('[UsageLimits] Error creating default:', error)
        return null
      }

      return data as UserUsageLimits
    } catch (error) {
      console.error('[UsageLimits] Exception creating default:', error)
      return null
    }
  }

  /**
   * Reseta contador diário
   */
  private async resetDailyLimit(userId: string): Promise<void> {
    try {
      const supabase = await createClient()
      const today = new Date().toISOString()

      await supabase
        .from('user_usage_limits')
        .update({
          daily_requests_used: 0,
          last_reset_date: today,
          updated_at: today
        })
        .eq('user_id', userId)
    } catch (error) {
      console.error('[UsageLimits] Error resetting daily limit:', error)
    }
  }

  /**
   * Atualiza o tier do usuário (free → byok quando adiciona API key)
   */
  async updateUserTier(
    userId: string,
    tier: 'free' | 'byok'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = await createClient()

      // Garantir que o registro existe
      await this.getOrCreateLimits(userId)

      const { error } = await supabase
        .from('user_usage_limits')
        .update({
          tier,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (error) {
        console.error('[UsageLimits] Error updating tier:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('[UsageLimits] Exception updating tier:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Retorna o tier atual do usuário
   */
  async getUserTier(userId: string): Promise<'free' | 'byok'> {
    try {
      const limits = await this.getOrCreateLimits(userId)
      return limits?.tier || 'free'
    } catch (error) {
      console.error('[UsageLimits] Error getting tier:', error)
      return 'free'
    }
  }

  /**
   * Retorna estatísticas de uso do usuário
   */
  async getUserUsageStats(userId: string): Promise<{
    dailyUsed: number
    monthlyUsed: number
    dailyLimit: number
    monthlyLimit: number
    tier: 'free' | 'byok'
  } | null> {
    try {
      const limits = await this.getOrCreateLimits(userId)
      if (!limits) return null

      return {
        dailyUsed: limits.daily_requests_used,
        monthlyUsed: limits.monthly_requests_used,
        dailyLimit: limits.tier === 'byok' ? -1 : FREE_TIER_DAILY_LIMIT,
        monthlyLimit: limits.tier === 'byok' ? -1 : FREE_TIER_MONTHLY_LIMIT,
        tier: limits.tier
      }
    } catch (error) {
      console.error('[UsageLimits] Error getting stats:', error)
      return null
    }
  }
}

// Singleton instance
export const usageLimitsService = new UsageLimitsService()

// Export constants
export { FREE_TIER_DAILY_LIMIT, FREE_TIER_MONTHLY_LIMIT }

