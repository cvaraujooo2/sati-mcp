/**
 * Sistema de Error Handling centralizado para MCP Sati
 * Inspirado em melhores práticas de API design
 */

import { ZodError } from 'zod';

// ============================================================================
// BASE ERROR CLASS
// ============================================================================

export class McpError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;
  public readonly timestamp: string;

  constructor(
    code: string,
    message: string,
    statusCode: number = 500,
    details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();

    // Mantém stack trace correto
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Serializa erro para JSON (MCP response)
   */
  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
        details: this.details,
        timestamp: this.timestamp,
      },
    };
  }

  /**
   * Formato para logs
   */
  toLogObject() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      stack: this.stack,
      timestamp: this.timestamp,
    };
  }
}

// ============================================================================
// SPECIFIC ERROR TYPES
// ============================================================================

/**
 * Erro de validação (400 Bad Request)
 */
export class ValidationError extends McpError {
  constructor(message: string, details?: unknown) {
    super('VALIDATION_ERROR', message, 400, details);
  }

  static fromZod(error: ZodError): ValidationError {
    const details = error.errors.map((err) => ({
      path: err.path.join('.'),
      message: err.message,
      code: err.code,
    }));

    return new ValidationError('Dados inválidos fornecidos', details);
  }
}

/**
 * Erro de autenticação (401 Unauthorized)
 */
export class AuthenticationError extends McpError {
  constructor(message: string = 'Autenticação necessária', details?: unknown) {
    super('AUTH_ERROR', message, 401, details);
  }
}

/**
 * Erro de autorização (403 Forbidden)
 */
export class AuthorizationError extends McpError {
  constructor(
    message: string = 'Você não tem permissão para acessar este recurso',
    details?: unknown
  ) {
    super('AUTHORIZATION_ERROR', message, 403, details);
  }
}

/**
 * Recurso não encontrado (404 Not Found)
 */
export class NotFoundError extends McpError {
  constructor(resource: string = 'Recurso', id?: string) {
    const message = id
      ? `${resource} com ID ${id} não encontrado`
      : `${resource} não encontrado`;
    super('NOT_FOUND', message, 404, { resource, id });
  }
}

/**
 * Conflito (409 Conflict)
 */
export class ConflictError extends McpError {
  constructor(message: string, details?: unknown) {
    super('CONFLICT', message, 409, details);
  }
}

/**
 * Rate limit excedido (429 Too Many Requests)
 */
export class RateLimitError extends McpError {
  constructor(
    retryAfter?: number,
    message: string = 'Muitas requisições. Tente novamente em alguns segundos.'
  ) {
    super('RATE_LIMIT_EXCEEDED', message, 429, { retryAfter });
  }
}

/**
 * Erro de banco de dados (500 Internal Server Error)
 */
export class DatabaseError extends McpError {
  constructor(message: string = 'Erro ao acessar banco de dados', details?: unknown) {
    super('DATABASE_ERROR', message, 500, details);
  }
}

/**
 * Erro externo (502 Bad Gateway)
 */
export class ExternalServiceError extends McpError {
  constructor(
    service: string,
    message: string = 'Serviço externo indisponível',
    details?: unknown
  ) {
    super('EXTERNAL_SERVICE_ERROR', message, 502, { 
      service, 
      ...(typeof details === 'object' && details !== null ? details : {}) 
    });
  }
}

/**
 * Erro de configuração (500 Internal Server Error)
 */
export class ConfigurationError extends McpError {
  constructor(message: string, details?: unknown) {
    super('CONFIGURATION_ERROR', message, 500, details);
  }
}

/**
 * Timeout (504 Gateway Timeout)
 */
export class TimeoutError extends McpError {
  constructor(
    operation: string,
    timeout: number,
    message: string = 'Operação excedeu tempo limite'
  ) {
    super('TIMEOUT', message, 504, { operation, timeout });
  }
}

/**
 * Erro de negócio (422 Unprocessable Entity)
 */
export class BusinessLogicError extends McpError {
  constructor(message: string, details?: unknown) {
    super('BUSINESS_LOGIC_ERROR', message, 422, details);
  }
}

// ============================================================================
// ERROR HANDLER UTILITIES
// ============================================================================

/**
 * Verifica se erro é do tipo McpError
 */
export function isMcpError(error: unknown): error is McpError {
  return error instanceof McpError;
}

/**
 * Converte erro desconhecido para McpError
 */
export function toMcpError(error: unknown): McpError {
  // Já é McpError
  if (isMcpError(error)) {
    return error;
  }

  // ZodError (validação)
  if (error instanceof ZodError) {
    return ValidationError.fromZod(error);
  }

  // Error padrão do JS
  if (error instanceof Error) {
    return new McpError('UNKNOWN_ERROR', error.message, 500, {
      originalError: error.name,
      stack: error.stack,
    });
  }

  // Erro desconhecido (string, number, etc)
  return new McpError('UNKNOWN_ERROR', String(error), 500);
}

/**
 * Handler global de erros para try-catch
 */
export async function handleError<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const mcpError = toMcpError(error);

    // Adiciona contexto se fornecido
    if (context && mcpError.details) {
      Object.assign(mcpError.details, { context });
    }

    throw mcpError;
  }
}

/**
 * Safe handler que retorna Result type
 */
export async function safeHandle<T>(
  operation: () => Promise<T>
): Promise<{ success: true; data: T } | { success: false; error: McpError }> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: toMcpError(error) };
  }
}

// ============================================================================
// ERROR RESPONSE FORMATTERS
// ============================================================================

/**
 * Formata erro para resposta HTTP/MCP
 */
export function formatErrorResponse(error: unknown) {
  const mcpError = toMcpError(error);

  return {
    error: {
      code: mcpError.code,
      message: mcpError.message,
      statusCode: mcpError.statusCode,
      ...(process.env.NODE_ENV === 'development' && {
        details: mcpError.details,
        stack: mcpError.stack,
      }),
      timestamp: mcpError.timestamp,
    },
  };
}

/**
 * Formata erro para MCP tool response
 */
export function formatToolError(error: unknown) {
  const mcpError = toMcpError(error);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            success: false,
            error: {
              code: mcpError.code,
              message: mcpError.message,
              details: mcpError.details,
            },
          },
          null,
          2
        ),
      },
    ],
    isError: true,
  };
}

// ============================================================================
// ASSERTIONS & GUARDS
// ============================================================================

/**
 * Assert que valor não é null/undefined
 */
export function assertExists<T>(
  value: T | null | undefined,
  resource: string,
  id?: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new NotFoundError(resource, id);
  }
}

/**
 * Assert autenticação
 */
export function assertAuthenticated(userId: string | null | undefined): asserts userId is string {
  if (!userId) {
    throw new AuthenticationError();
  }
}

/**
 * Assert autorização
 */
export function assertAuthorized(condition: boolean, message?: string): asserts condition {
  if (!condition) {
    throw new AuthorizationError(message);
  }
}

/**
 * Assert validação
 */
export function assertValid(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new ValidationError(message);
  }
}

// ============================================================================
// RETRY LOGIC
// ============================================================================

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoff?: 'linear' | 'exponential';
  retryableErrors?: Array<new (...args: unknown[]) => McpError>;
}

/**
 * Retry com backoff para operações que podem falhar temporariamente
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoff = 'exponential',
    retryableErrors = [DatabaseError, ExternalServiceError, TimeoutError],
  } = options;

  let lastError: McpError | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const mcpError = toMcpError(error);
      lastError = mcpError;

      // Não faz retry se não for erro retryable
      const isRetryable = retryableErrors.some(
        (ErrorClass) => mcpError instanceof ErrorClass
      );

      if (!isRetryable || attempt === maxAttempts) {
        throw mcpError;
      }

      // Calcula delay
      const delay =
        backoff === 'exponential' ? delayMs * Math.pow(2, attempt - 1) : delayMs * attempt;

      // Aguarda antes do próximo retry
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

// ============================================================================
// CIRCUIT BREAKER (Opcional - para serviços externos)
// ============================================================================

export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000 // 1 minuto
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new ExternalServiceError(
          'CircuitBreaker',
          'Circuit breaker está aberto. Serviço temporariamente indisponível.'
        );
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
    };
  }

  reset() {
    this.failures = 0;
    this.state = 'closed';
    this.lastFailureTime = 0;
  }
}
