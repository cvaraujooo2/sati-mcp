/**
 * Auth Helpers
 * Funções utilitárias para autenticação
 */

import { createClient } from '@/lib/supabase/server'
import { User } from '@supabase/supabase-js'
import { authLogger } from '@/lib/utils/logger'

/**
 * Busca usuário autenticado da sessão
 * Lança erro se não autenticado
 */
export async function getAuthenticatedUser(): Promise<User> {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    authLogger.error({ error: error.message }, 'Failed to get authenticated user')
    throw new Error('Authentication error')
  }
  
  if (!user) {
    authLogger.warn('Attempted to access protected resource without authentication')
    throw new Error('Unauthorized')
  }
  
  authLogger.debug({ userId: user.id }, 'User authenticated successfully')
  return user
}

/**
 * Busca usuário autenticado (retorna null se não autenticado)
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    authLogger.error({ error: error.message }, 'Failed to get current user')
    return null
  }
  
  return user
}

/**
 * Verifica se usuário está autenticado
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return user !== null
}

/**
 * Busca ID do usuário autenticado
 */
export async function getAuthenticatedUserId(): Promise<string> {
  const user = await getAuthenticatedUser()
  return user.id
}

/**
 * Verifica se email do usuário foi verificado
 */
export async function isEmailVerified(): Promise<boolean> {
  const user = await getCurrentUser()
  
  if (!user) return false
  
  return user.email_confirmed_at !== null
}

/**
 * Busca metadata do usuário
 */
export async function getUserMetadata(): Promise<Record<string, any> | null> {
  const user = await getCurrentUser()
  
  if (!user) return null
  
  return user.user_metadata || {}
}

/**
 * Valida se usuário tem acesso a um recurso específico
 * (Wrapper para uso em API routes)
 */
export async function requireUserAccess(userId: string): Promise<void> {
  const currentUser = await getAuthenticatedUser()
  
  if (currentUser.id !== userId) {
    authLogger.warn(
      { currentUserId: currentUser.id, requestedUserId: userId },
      'User attempted to access another user\'s resource'
    )
    throw new Error('Forbidden')
  }
}
