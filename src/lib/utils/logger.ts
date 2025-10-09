/**
 * Sistema de Logging centralizado usando Pino
 * Performance otimizada + Pretty print em dev
*/

import { createRequire } from 'module';
import pino from 'pino';

// =========================================================================
// BUNDLER OVERRIDES (Thread-stream worker path)
// =========================================================================

const require = createRequire(import.meta.url);

type GlobalWithPinoOverrides = typeof globalThis & {
  __bundlerPathsOverrides?: Record<string, string>;
};

const globalWithOverrides = globalThis as GlobalWithPinoOverrides;

if (!globalWithOverrides.__bundlerPathsOverrides) {
  globalWithOverrides.__bundlerPathsOverrides = {};
}

if (!globalWithOverrides.__bundlerPathsOverrides['thread-stream-worker']) {
  globalWithOverrides.__bundlerPathsOverrides['thread-stream-worker'] = require.resolve(
    'thread-stream/lib/worker.js'
  );
}

// ============================================================================
// LOGGER CONFIGURATION
// ============================================================================

const isDevelopment = process.env.NODE_ENV === 'development';
const logLevel = (process.env.LOG_LEVEL as pino.Level) || 'info';

/**
 * Logger principal do sistema
 */
export const logger = pino({
  level: logLevel,
  base: {
    env: process.env.NODE_ENV,
    app: 'sati-mcp',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  // Pretty print apenas em desenvolvimento
  ...(isDevelopment && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
        singleLine: false,
        messageFormat: '{levelLabel} - {msg}',
      },
    },
  }),
  // Em produção, log estruturado para parsing
  ...(!isDevelopment && {
    serializers: pino.stdSerializers,
  }),
});

// ============================================================================
// CHILD LOGGERS (Contextuais)
// ============================================================================

/**
 * Logger para MCP Tools
 */
export const toolLogger = logger.child({ module: 'mcp-tool' });

/**
 * Logger para Services
 */
export const serviceLogger = logger.child({ module: 'service' });

/**
 * Logger para Database operations
 */
export const dbLogger = logger.child({ module: 'database' });

/**
 * Logger para Auth operations
 */
export const authLogger = logger.child({ module: 'auth' });

/**
 * Logger para API routes
 */
export const apiLogger = logger.child({ module: 'api' });

// ============================================================================
// LOGGING HELPERS
// ============================================================================

/**
 * Log de chamada de tool MCP
 */
export function logToolCall(
  toolName: string,
  userId: string | undefined,
  params: unknown,
  duration?: number
) {
  toolLogger.info(
    {
      tool: toolName,
      userId,
      params: isDevelopment ? params : undefined, // Não loga params em produção (privacidade)
      duration,
    },
    `MCP Tool called: ${toolName}`
  );
}

/**
 * Log de sucesso de tool
 */
export function logToolSuccess(toolName: string, userId: string | undefined, duration: number) {
  toolLogger.info(
    {
      tool: toolName,
      userId,
      duration,
      success: true,
    },
    `MCP Tool succeeded: ${toolName} (${duration}ms)`
  );
}

/**
 * Log de erro de tool
 */
export function logToolError(
  toolName: string,
  userId: string | undefined,
  error: Error,
  duration: number
) {
  toolLogger.error(
    {
      tool: toolName,
      userId,
      error: {
        name: error.name,
        message: error.message,
        stack: isDevelopment ? error.stack : undefined,
      },
      duration,
      success: false,
    },
    `MCP Tool failed: ${toolName}`
  );
}

/**
 * Log de query de banco de dados
 */
export function logDbQuery(
  operation: string,
  table: string,
  duration: number,
  rowCount?: number
) {
  dbLogger.debug(
    {
      operation,
      table,
      duration,
      rowCount,
    },
    `DB Query: ${operation} on ${table} (${duration}ms)`
  );
}

/**
 * Log de erro de banco de dados
 */
export function logDbError(operation: string, table: string, error: Error) {
  dbLogger.error(
    {
      operation,
      table,
      error: {
        name: error.name,
        message: error.message,
        stack: isDevelopment ? error.stack : undefined,
      },
    },
    `DB Error: ${operation} on ${table}`
  );
}

/**
 * Log de autenticação
 */
export function logAuthAttempt(method: string, userId?: string, success = true) {
  authLogger.info(
    {
      method,
      userId,
      success,
    },
    `Auth attempt: ${method} - ${success ? 'SUCCESS' : 'FAILED'}`
  );
}

/**
 * Log de erro de autenticação
 */
export function logAuthError(method: string, error: Error) {
  authLogger.error(
    {
      method,
      error: {
        name: error.name,
        message: error.message,
      },
    },
    `Auth error: ${method}`
  );
}

/**
 * Log de request HTTP/API
 */
export function logApiRequest(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  userId?: string
) {
  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

  apiLogger[level](
    {
      method,
      path,
      statusCode,
      duration,
      userId,
    },
    `${method} ${path} - ${statusCode} (${duration}ms)`
  );
}

/**
 * Log de erro de API
 */
export function logApiError(method: string, path: string, error: Error, duration: number) {
  apiLogger.error(
    {
      method,
      path,
      error: {
        name: error.name,
        message: error.message,
        stack: isDevelopment ? error.stack : undefined,
      },
      duration,
    },
    `API Error: ${method} ${path}`
  );
}

// ============================================================================
// PERFORMANCE MEASUREMENT
// ============================================================================

/**
 * Timer para medir duração de operações
 */
export class PerformanceTimer {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Retorna duração em milissegundos
   */
  duration(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Loga duração e retorna o valor
   */
  log(operation: string, context?: Record<string, unknown>): number {
    const duration = this.duration();
    logger.debug(
      {
        operation,
        duration,
        ...context,
      },
      `Performance: ${operation} (${duration}ms)`
    );
    return duration;
  }
}

/**
 * Decorator para medir performance de funções
 */
export function measurePerformance<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  operationName: string
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const timer = new PerformanceTimer();
    try {
      const result = await fn(...args);
      const duration = timer.duration();

      if (duration > 1000) {
        // Alerta se operação demorar mais de 1s
        logger.warn(
          {
            operation: operationName,
            duration,
          },
          `Slow operation detected: ${operationName} (${duration}ms)`
        );
      }

      return result as ReturnType<T>;
    } catch (error) {
      timer.log(operationName, { error: true });
      throw error;
    }
  }) as T;
}

// ============================================================================
// STRUCTURED LOGGING UTILITIES
// ============================================================================

/**
 * Log estruturado de evento de negócio
 */
export function logBusinessEvent(
  event: string,
  data: Record<string, unknown>,
  userId?: string
) {
  logger.info(
    {
      event,
      userId,
      ...data,
    },
    `Business Event: ${event}`
  );
}

/**
 * Log de segurança (tentativas suspeitas, etc)
 */
export function logSecurityEvent(
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  data: Record<string, unknown>
) {
  const level = severity === 'critical' || severity === 'high' ? 'error' : 'warn';

  logger[level](
    {
      event,
      severity,
      category: 'security',
      ...data,
    },
    `Security Event: ${event} [${severity.toUpperCase()}]`
  );
}

/**
 * Log de métricas customizadas
 */
export function logMetric(
  metric: string,
  value: number,
  unit?: string,
  tags?: Record<string, string>
) {
  logger.info(
    {
      metric,
      value,
      unit,
      tags,
      category: 'metric',
    },
    `Metric: ${metric} = ${value}${unit ? ` ${unit}` : ''}`
  );
}

// ============================================================================
// ERROR CONTEXT ENRICHMENT
// ============================================================================

/**
 * Adiciona contexto a um erro antes de logar
 */
export function enrichError(error: Error, context: Record<string, unknown>): Error {
  const errorWithContext = error as Error & { context?: Record<string, unknown> };
  errorWithContext.context = {
    ...errorWithContext.context,
    ...context,
  };
  return error;
}

/**
 * Loga erro com contexto enriquecido
 */
export function logEnrichedError(error: Error, message?: string) {
  const errorWithContext = error as Error & { context?: Record<string, unknown> };
  logger.error(
    {
      error: {
        name: error.name,
        message: error.message,
        stack: isDevelopment ? error.stack : undefined,
        context: errorWithContext.context,
      },
    },
    message || error.message
  );
}

// ============================================================================
// SAMPLING (Para reduzir volume de logs em produção)
// ============================================================================

/**
 * Log apenas X% das vezes (útil para operações de alto volume)
 */
export function sampledLog(
  percentage: number,
  logFn: () => void
): void {
  if (Math.random() * 100 < percentage) {
    logFn();
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default logger;

// Re-export types
export type { Logger } from 'pino';
