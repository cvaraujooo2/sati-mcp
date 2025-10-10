import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

export interface ToolExecutionContext {
  userId: string
  requestId: string
  toolName: string
  parameters: Record<string, any>
  metadata?: Record<string, any>
}

export interface ToolExecutionResult {
  result?: any
  error?: string
  metadata?: Record<string, any>
  executionTimeMs: number
  cached?: boolean
}

export interface CachedToolResult {
  toolName: string
  parametersHash: string
  result: any
  createdAt: Date
  expiresAt: Date
}

/**
 * Gerenciador otimizado de execução de ferramentas
 * Baseado no MCPJam/inspector com melhorias para Supabase
 */
export class OptimizedToolExecutor {
  private supabase: SupabaseClient
  private cache: Map<string, CachedToolResult> = new Map()
  private executionQueue: Map<string, Promise<ToolExecutionResult>> = new Map()
  
  // Cache settings
  private static readonly CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutos
  private static readonly MAX_CACHE_SIZE = 1000

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || createClient()
    
    // Cleanup cache periodicamente
    setInterval(() => this.cleanupExpiredCache(), 60000) // 1 minuto
  }

  /**
   * Executa uma tool com otimizações (cache, deduplicação, etc.)
   */
  async executeToolOptimized(
    context: ToolExecutionContext,
    handler: (params: Record<string, any>, userId: string) => Promise<any>
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now()
    const cacheKey = this.generateCacheKey(context.toolName, context.parameters)
    
    try {
      // 1. Verificar cache primeiro
      const cachedResult = this.getCachedResult(cacheKey)
      if (cachedResult && this.isCacheValid(cachedResult)) {
        console.log(`[ToolExecutor] Cache hit for ${context.toolName}`)
        return {
          result: cachedResult.result,
          executionTimeMs: Date.now() - startTime,
          cached: true
        }
      }

      // 2. Verificar se já está em execução (deduplicação)
      const existingExecution = this.executionQueue.get(cacheKey)
      if (existingExecution) {
        console.log(`[ToolExecutor] Deduplicating execution for ${context.toolName}`)
        return await existingExecution
      }

      // 3. Executar tool
      const executionPromise = this.executeToolInternal(context, handler, startTime)
      this.executionQueue.set(cacheKey, executionPromise)

      const result = await executionPromise
      
      // 4. Cache do resultado se foi bem-sucedido
      if (!result.error && this.shouldCacheResult(context.toolName)) {
        this.setCachedResult(cacheKey, {
          toolName: context.toolName,
          parametersHash: cacheKey,
          result: result.result,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + OptimizedToolExecutor.CACHE_TTL_MS)
        })
      }

      return result
    } finally {
      // Limpar da queue de execução
      this.executionQueue.delete(cacheKey)
    }
  }

  /**
   * Executa múltiplas tools em paralelo quando possível
   */
  async executeToolsParallel(
    contexts: ToolExecutionContext[],
    handlers: Map<string, (params: Record<string, any>, userId: string) => Promise<any>>
  ): Promise<Map<string, ToolExecutionResult>> {
    console.log(`[ToolExecutor] Executing ${contexts.length} tools in parallel`)
    
    const executions = contexts.map(async (context) => {
      const handler = handlers.get(context.toolName)
      if (!handler) {
        return {
          context,
          result: {
            error: `Handler not found for tool: ${context.toolName}`,
            executionTimeMs: 0
          }
        }
      }

      const result = await this.executeToolOptimized(context, handler)
      return { context, result }
    })

    const results = await Promise.allSettled(executions)
    const resultMap = new Map<string, ToolExecutionResult>()

    results.forEach((promiseResult, index) => {
      const context = contexts[index]
      if (promiseResult.status === 'fulfilled') {
        resultMap.set(context.requestId, promiseResult.value.result)
      } else {
        resultMap.set(context.requestId, {
          error: promiseResult.reason?.message || 'Unknown execution error',
          executionTimeMs: 0
        })
      }
    })

    return resultMap
  }

  /**
   * Log detalhado de execução para debugging
   */
  async logToolExecution(
    context: ToolExecutionContext,
    result: ToolExecutionResult
  ): Promise<void> {
    try {
      await this.supabase
        .from('tool_execution_logs')
        .insert({
          user_id: context.userId,
          tool_name: context.toolName,
          tool_call_id: context.requestId,
          parameters: context.parameters,
          result: result.result,
          error_message: result.error,
          status: result.error ? 'error' : 'completed',
          execution_time_ms: result.executionTimeMs,
          completed_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('[ToolExecutor] Failed to log execution:', error)
      // Não falha a execução se o log falhar
    }
  }

  /**
   * Obter estatísticas de uso de ferramentas
   */
  async getToolUsageStats(userId: string): Promise<Record<string, any>> {
    try {
      const { data, error } = await this.supabase
        .from('tool_usage_stats')
        .select('*')
        .eq('user_id', userId)

      if (error) throw error
      
      return data.reduce((stats, row) => {
        stats[row.tool_name] = {
          totalExecutions: row.total_executions,
          successfulExecutions: row.successful_executions,
          failedExecutions: row.failed_executions,
          avgExecutionTime: row.avg_execution_time_ms,
          lastUsed: row.last_used
        }
        return stats
      }, {} as Record<string, any>)
    } catch (error) {
      console.error('[ToolExecutor] Failed to get usage stats:', error)
      return {}
    }
  }

  // Métodos privados

  private async executeToolInternal(
    context: ToolExecutionContext,
    handler: (params: Record<string, any>, userId: string) => Promise<any>,
    startTime: number
  ): Promise<ToolExecutionResult> {
    try {
      console.log(`[ToolExecutor] Executing ${context.toolName} with params:`, context.parameters)
      
      const result = await handler(context.parameters, context.userId)
      const executionTimeMs = Date.now() - startTime
      
      console.log(`[ToolExecutor] Tool ${context.toolName} completed in ${executionTimeMs}ms`)
      
      // Log da execução
      await this.logToolExecution(context, { result, executionTimeMs })
      
      return {
        result,
        executionTimeMs,
        metadata: {
          toolName: context.toolName,
          userId: context.userId,
          timestamp: new Date().toISOString()
        }
      }
    } catch (error) {
      const executionTimeMs = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      console.error(`[ToolExecutor] Tool ${context.toolName} failed:`, errorMessage)
      
      // Log do erro
      await this.logToolExecution(context, { error: errorMessage, executionTimeMs })
      
      return {
        error: errorMessage,
        executionTimeMs,
        metadata: {
          toolName: context.toolName,
          userId: context.userId,
          timestamp: new Date().toISOString(),
          errorType: error instanceof Error ? error.constructor.name : 'UnknownError'
        }
      }
    }
  }

  private generateCacheKey(toolName: string, parameters: Record<string, any>): string {
    // Gerar hash dos parâmetros para cache
    const sortedParams = Object.keys(parameters)
      .sort()
      .reduce((result, key) => {
        result[key] = parameters[key]
        return result
      }, {} as Record<string, any>)
    
    return `${toolName}:${JSON.stringify(sortedParams)}`
  }

  private getCachedResult(cacheKey: string): CachedToolResult | undefined {
    return this.cache.get(cacheKey)
  }

  private setCachedResult(cacheKey: string, result: CachedToolResult): void {
    // Remover items mais antigos se o cache estiver cheio
    if (this.cache.size >= OptimizedToolExecutor.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }
    
    this.cache.set(cacheKey, result)
  }

  private isCacheValid(cachedResult: CachedToolResult): boolean {
    return new Date() < cachedResult.expiresAt
  }

  private shouldCacheResult(toolName: string): boolean {
    // Ferramentas que fazem sentido cachear (não têm side effects)
    const cacheableTools = [
      'analyzeContext',
      'suggestSubtasks', 
      'getTaskBreakdown'
    ]
    
    return cacheableTools.includes(toolName)
  }

  private cleanupExpiredCache(): void {
    const now = new Date()
    let cleanedCount = 0
    
    for (const [key, cached] of this.cache.entries()) {
      if (now >= cached.expiresAt) {
        this.cache.delete(key)
        cleanedCount++
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`[ToolExecutor] Cleaned up ${cleanedCount} expired cache entries`)
    }
  }
}

/**
 * Schema para validação de tool execution context
 */
export const ToolExecutionContextSchema = z.object({
  userId: z.string().uuid(),
  requestId: z.string(),
  toolName: z.string().min(1),
  parameters: z.record(z.any()),
  metadata: z.record(z.any()).optional()
})

/**
 * Helper para criar contexto de execução
 */
export function createToolExecutionContext(
  userId: string,
  toolName: string,
  parameters: Record<string, any>,
  requestId?: string
): ToolExecutionContext {
  return {
    userId,
    requestId: requestId || crypto.randomUUID(),
    toolName,
    parameters,
    metadata: {
      createdAt: new Date().toISOString(),
      userAgent: 'SATI-MCP'
    }
  }
}