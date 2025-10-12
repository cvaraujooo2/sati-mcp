/**
 * Next.js Middleware
 * Protege rotas e gerencia autenticação em nível de aplicação
 * 
 * Este middleware intercepta TODAS as requisições antes que cheguem às páginas/APIs
 * e aplica lógica de autenticação e redirecionamento
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Configuração de rotas
 */
const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/reset-password',
  '/auth/callback',
  '/api/auth/callback',
]

const AUTH_ROUTES = [
  '/login',
  '/signup',
  '/reset-password',
]

// Rotas públicas que não requerem autenticação (assets, etc)
const PUBLIC_FILE_PATTERNS = [
  '/_next',
  '/favicon.ico',
  '/public',
  '/sounds',
  '/.well-known',
]

/**
 * Middleware principal
 * Executa em TODAS as requisições (exceto assets estáticos)
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log('[Middleware] INTERCEPTED REQUEST:', pathname)

  // 1. Ignorar arquivos estáticos
  if (PUBLIC_FILE_PATTERNS.some(pattern => pathname.startsWith(pattern))) {
    console.log('[Middleware] Ignoring static file:', pathname)
    return NextResponse.next()
  }

  // 2. Criar Supabase client para SSR
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: Record<string, unknown>) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // 3. Verificar sessão do usuário
  console.log('[Middleware] Creating Supabase client...')
  
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  console.log('[Middleware] Auth check result:', { 
    hasUser: !!user, 
    error: authError?.message,
    userId: user?.id 
  })

  const isAuthenticated = !!user && !authError
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname)
  const isAuthRoute = AUTH_ROUTES.includes(pathname)

  console.log('[Middleware]', {
    pathname,
    isAuthenticated,
    isPublicRoute,
    isAuthRoute,
    userId: user?.id,
  })

  // 4. Lógica de redirecionamento

  // Se está em rota de auth e JÁ está autenticado -> redirecionar para /chat
  if (isAuthRoute && isAuthenticated) {
    console.log('[Middleware] User already authenticated, redirecting to /chat')
    return NextResponse.redirect(new URL('/chat', request.url))
  }

  // Se NÃO está autenticado e tenta acessar rota protegida -> redirecionar para /login
  if (!isAuthenticated && !isPublicRoute) {
    console.log('[Middleware] Unauthenticated access to protected route, redirecting to /login')
    const loginUrl = new URL('/login', request.url)
    
    // Adicionar redirect parameter para voltar após login
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname)
    }
    
    return NextResponse.redirect(loginUrl)
  }

  // 5. Permitir acesso
  return response
}

/**
 * Configuração do matcher
 * Define quais rotas o middleware deve interceptar
 * 
 * IMPORTANTE: Não incluir arquivos estáticos para performance
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - API routes that handle their own auth
     */
    '/((?!_next/static|_next/image|favicon.ico|public|sounds|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
