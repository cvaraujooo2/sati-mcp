/**
 * Auth Middleware
 * Protege routes e valida autenticação
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { authLogger, logAuthAttempt, logSecurityEvent } from '@/lib/utils/logger';
import { AuthenticationError, AuthorizationError } from '@/lib/utils/errors';

// ============================================================================
// SUPABASE SSR CLIENT
// ============================================================================

/**
 * Cria cliente Supabase para Server-Side Rendering
 */
export function createSupabaseServerClient(request: NextRequest) {
  const response = NextResponse.next();

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: Record<string, unknown>) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  return { supabase, response };
}

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

/**
 * Middleware que requer autenticação
 */
export async function requireAuth(request: NextRequest) {
  const { supabase, response } = createSupabaseServerClient(request);

  try {
    // Buscar usuário da sessão
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      authLogger.error({ error: error.message }, 'Auth error in middleware');
      throw new AuthenticationError('Sessão inválida');
    }

    if (!user) {
      authLogger.warn({ path: request.nextUrl.pathname }, 'Unauthenticated access attempt');
      throw new AuthenticationError('Autenticação necessária');
    }

    // Log successful auth
    logAuthAttempt('middleware_check', user.id, true);

    return {
      user,
      response,
      supabase,
    };
  } catch (error) {
    authLogger.error({ error, path: request.nextUrl.pathname }, 'Auth middleware failed');

    // Redirecionar para login se não autenticado
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);

    return NextResponse.redirect(loginUrl);
  }
}

/**
 * Middleware opcional de autenticação (não obrigatório)
 */
export async function optionalAuth(request: NextRequest) {
  const { supabase, response } = createSupabaseServerClient(request);

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return {
      user: user || null,
      response,
      supabase,
    };
  } catch (error) {
    authLogger.debug({ error }, 'Optional auth check failed');

    return {
      user: null,
      response: NextResponse.next(),
      supabase,
    };
  }
}

// ============================================================================
// AUTHORIZATION HELPERS
// ============================================================================

/**
 * Verifica se usuário tem permissão para acessar recurso
 */
export async function checkResourceOwnership(
  supabase: SupabaseClient<Database>,
  userId: string,
  resourceType: 'hyperfocus' | 'task' | 'focus_session' | 'alternancy_session',
  resourceId: string
): Promise<boolean> {
  try {
    let query;

    switch (resourceType) {
      case 'hyperfocus':
        query = supabase
          .from('hyperfocus')
          .select('user_id')
          .eq('id', resourceId)
          .single();
        break;

      case 'task':
        query = supabase
          .from('tasks')
          .select('hyperfocus_id')
          .eq('id', resourceId)
          .single();
        break;

      case 'focus_session':
        query = supabase
          .from('focus_sessions')
          .select('hyperfocus_id')
          .eq('id', resourceId)
          .single();
        break;

      case 'alternancy_session':
        query = supabase
          .from('alternancy_sessions')
          .select('user_id')
          .eq('id', resourceId)
          .single();
        break;

      default:
        throw new Error(`Unknown resource type: ${resourceType}`);
    }

    const { data, error } = await query;

    if (error || !data) {
      authLogger.warn(
        { resourceType, resourceId, error },
        'Resource not found during ownership check'
      );
      return false;
    }

    // Verificar ownership
    if (resourceType === 'hyperfocus' || resourceType === 'alternancy_session') {
      return 'user_id' in data && data.user_id === userId;
    } else {
      // Para tasks e focus_sessions, verificar ownership do hyperfocus pai
      if (!('hyperfocus_id' in data)) {
        return false;
      }
      
      const { data: hyperfocus, error: hfError } = await supabase
        .from('hyperfocus')
        .select('user_id')
        .eq('id', data.hyperfocus_id)
        .single();

      if (hfError || !hyperfocus) {
        return false;
      }

      return hyperfocus.user_id === userId;
    }
  } catch (error) {
    authLogger.error({ error, resourceType, resourceId }, 'Error checking resource ownership');
    return false;
  }
}

/**
 * Assert que usuário tem permissão
 */
export async function assertResourceOwnership(
  supabase: SupabaseClient<Database>,
  userId: string,
  resourceType: 'hyperfocus' | 'task' | 'focus_session' | 'alternancy_session',
  resourceId: string
): Promise<void> {
  const hasAccess = await checkResourceOwnership(supabase, userId, resourceType, resourceId);

  if (!hasAccess) {
    logSecurityEvent('unauthorized_resource_access', 'medium', {
      userId,
      resourceType,
      resourceId,
    });

    throw new AuthorizationError(
      `Você não tem permissão para acessar este ${resourceType}`
    );
  }
}

// ============================================================================
// RATE LIMITING (Placeholder)
// ============================================================================

/**
 * Middleware de rate limiting simples
 * TODO: Implementar com Upstash Redis
 */
export async function checkRateLimit(
  userId: string,
  limit: number = 100,
  windowMinutes: number = 15
): Promise<boolean> {
  // Por enquanto, sempre permitir
  // Em produção, usar Upstash Redis para tracking

  authLogger.debug(
    { userId, limit, windowMinutes },
    'Rate limit check (stub - always allows)'
  );

  return true;
}

/**
 * Middleware que aplica rate limiting
 */
export async function withRateLimit(
  request: NextRequest,
  userId: string,
  limit: number = 100
) {
  const allowed = await checkRateLimit(userId, limit);

  if (!allowed) {
    logSecurityEvent('rate_limit_exceeded', 'low', {
      userId,
      path: request.nextUrl.pathname,
    });

    return NextResponse.json(
      {
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Muitas requisições. Tente novamente em alguns minutos.',
        },
      },
      { status: 429 }
    );
  }

  return null; // null = allowed, continue
}

// ============================================================================
// CORS MIDDLEWARE
// ============================================================================

/**
 * Headers CORS para MCP
 */
export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
    'Access-Control-Allow-Credentials': 'true',
  };
}

/**
 * Handle preflight requests
 */
export function handlePreflight() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

// ============================================================================
// MIDDLEWARE COMPOSER
// ============================================================================

/**
 * Combina múltiplos middlewares
 */
export function composeMiddleware(
  ...middlewares: Array<(request: NextRequest) => Promise<NextResponse | null>>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    for (const middleware of middlewares) {
      const result = await middleware(request);
      if (result) {
        return result;
      }
    }

    return NextResponse.next();
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

const authMiddleware = {
  requireAuth,
  optionalAuth,
  checkResourceOwnership,
  assertResourceOwnership,
  withRateLimit,
  corsHeaders,
  handlePreflight,
  composeMiddleware,
};

export default authMiddleware;
