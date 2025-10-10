/**
 * Error Handler para MCP Tools
 * Tratamento centralizado de erros com mensagens amigáveis
 */

import { z } from 'zod'
import { ValidationError, DatabaseError } from '@/lib/utils/errors'

export interface ToolError {
  type: 'validation' | 'database' | 'timeout' | 'not_found' | 'permission' | 'unknown'
  message: string
  details?: any
  userMessage: string // Mensagem amigável para o usuário
}

/**
 * Processa erros de execução de tools e retorna erro formatado
 */
export function handleToolError(error: unknown, toolName: string): ToolError {
  // Erro de validação Zod
  if (error instanceof z.ZodError) {
    const fieldErrors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
    return {
      type: 'validation',
      message: `Validation error in ${toolName}: ${fieldErrors}`,
      details: error.errors,
      userMessage: `Ops! Os dados fornecidos não estão corretos. ${fieldErrors}`
    }
  }

  // Erro de validação customizado
  if (error instanceof ValidationError) {
    return {
      type: 'validation',
      message: error.message,
      userMessage: `Dados inválidos: ${error.message}`
    }
  }

  // Erro de banco de dados
  if (error instanceof DatabaseError) {
    return {
      type: 'database',
      message: error.message,
      userMessage: 'Não consegui salvar no banco de dados. Tente novamente em alguns segundos.'
    }
  }

  // Erro de timeout
  if (error instanceof Error && error.message.includes('timeout')) {
    return {
      type: 'timeout',
      message: `Timeout executing ${toolName}`,
      userMessage: 'A operação demorou muito. Tente novamente com dados menores.'
    }
  }

  // Erro de permissão
  if (error instanceof Error && (
    error.message.includes('permission') || 
    error.message.includes('unauthorized') ||
    error.message.includes('forbidden')
  )) {
    return {
      type: 'permission',
      message: error.message,
      userMessage: 'Você não tem permissão para fazer isso. Verifique sua conta.'
    }
  }

  // Erro genérico
  if (error instanceof Error) {
    return {
      type: 'unknown',
      message: error.message,
      userMessage: `Algo deu errado: ${error.message}. Tente novamente.`
    }
  }

  // Erro desconhecido
  return {
    type: 'unknown',
    message: String(error),
    userMessage: 'Algo inesperado aconteceu. Tente novamente.'
  }
}

/**
 * Wrapper para executar tool com timeout
 */
export async function executeWithTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number = 30000 // 30 segundos padrão
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Operation timeout')), timeoutMs)
    )
  ])
}

/**
 * Valida se usuário tem permissão para executar tool
 */
export function validateToolPermission(
  toolName: string,
  userId: string,
  requiredScopes?: string[]
): boolean {
  // Por enquanto, apenas verifica se tem userId
  // TODO: Implementar sistema de scopes quando necessário
  if (!userId) {
    return false
  }

  // Se tool requer scopes específicos, validar aqui
  if (requiredScopes && requiredScopes.length > 0) {
    // TODO: Implementar validação de scopes
    console.warn(`[SATI] Tool ${toolName} requires scopes:`, requiredScopes)
  }

  return true
}

/**
 * Log estruturado de erros
 */
export function logToolError(
  toolName: string,
  userId: string,
  error: ToolError,
  context?: any
) {
  console.error(`[SATI Tool Error] ${toolName}`, {
    userId,
    errorType: error.type,
    message: error.message,
    userMessage: error.userMessage,
    details: error.details,
    context,
    timestamp: new Date().toISOString()
  })
}




