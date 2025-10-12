# 🔐 Sprint de Autenticação - SATI Beta

**Status**: 🚀 PRIORIDADE MÁXIMA  
**Objetivo**: Implementar autenticação completa Next.js + Supabase para lançamento beta  
**Data Início**: 11 de Outubro de 2025  
**Duração Estimada**: 2-3 dias  

---

## 📋 Contexto do Pivot

### Estratégia Anterior ❌
- Foco em integração com ChatGPT/OpenAI Apps SDK
- OAuth 2.1 completo para Apps SDK
- Authorization server complexo

### Nova Estratégia ✅
1. **Fase Beta (ATUAL)**: Web app Next.js + Supabase com autenticação tradicional
2. **Fase Mobile (FUTURO)**: App Flutter com widgets nativos para neurodivergentes
3. **Foco**: Usuários externos usando aplicação web completa

### Decisões Tomadas
- ✅ **Autenticação**: Supabase Auth (OAuth Google + Email/Password)
- ✅ **Sessões**: Server-Side cookies (Next.js middleware)
- ✅ **Proteção**: Middleware Next.js + RLS Supabase habilitado
- ✅ **Frontend**: Páginas de login/signup customizadas
- ✅ **UX**: Magic link opcional para neurodivergentes (menos fricção)

---

## 🎯 Objetivos do Sprint

### Objetivo Geral
Implementar sistema de autenticação completo para permitir que usuários externos:
- Criem contas no SATI
- Façam login seguro
- Gerenciem suas próprias API keys
- Acessem apenas seus próprios dados (RLS habilitado)

### Objetivos Específicos
1. ✅ Remover DEV BYPASS do código
2. ✅ Criar páginas de Login/Signup
3. ✅ Implementar middleware Next.js para proteção de rotas
4. ✅ Habilitar RLS no Supabase (todas as tabelas)
5. ✅ Criar componente de AuthGuard
6. ✅ Implementar logout e gestão de sessão
7. ✅ Adicionar loading states e error handling
8. ✅ Testar fluxos completos

---

## 📦 Estrutura de Tarefas

### 🟢 Tarefa 1: Configurar Supabase Auth Providers
**Estimativa**: 30 minutos  
**Prioridade**: ALTA  

**Subtarefas**:
1. Configurar Google OAuth no Supabase Dashboard
   - Acessar Authentication > Providers > Google
   - Criar OAuth app no Google Cloud Console
   - Configurar redirect URLs: `https://[PROJECT_ID].supabase.co/auth/v1/callback`
   - Copiar Client ID e Secret para Supabase
   
2. Configurar Email Authentication
   - Habilitar Email provider no Supabase
   - Configurar email templates customizados
   - Definir redirect URLs

3. (Opcional) Configurar Magic Link
   - Habilitar no Supabase
   - Customizar email template

**Resultado esperado**:
- OAuth Google funcional
- Email/password funcional
- Magic link opcional configurado

**Como testar**:
```bash
# Testar OAuth callback
curl https://[PROJECT_ID].supabase.co/auth/v1/callback?code=test

# Verificar providers habilitados
Supabase Dashboard > Authentication > Providers
```

---

### 🟡 Tarefa 2: Criar Páginas de Autenticação
**Estimativa**: 2 horas  
**Prioridade**: ALTA  

**Arquivos a criar**:
```
src/app/
  (auth)/
    layout.tsx          # Layout para páginas de auth (sem sidebar)
    login/
      page.tsx          # Página de login
    signup/
      page.tsx          # Página de signup
    reset-password/
      page.tsx          # Recuperar senha
    verify-email/
      page.tsx          # Verificação de email
```

**Subtarefas**:

#### 2.1 Criar `(auth)/layout.tsx`
```tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="w-full max-w-md p-8">
        {/* Logo SATI */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-purple-600">SATI</h1>
          <p className="text-gray-600 mt-2">Assistente para neurodivergentes</p>
        </div>
        
        {children}
      </div>
    </div>
  )
}
```

#### 2.2 Criar `login/page.tsx`
**Features**:
- Formulário com email + senha
- Botão "Continuar com Google"
- Link para "Esqueci minha senha"
- Link para "Criar conta"
- Validação de erros
- Loading states
- Redirect após login bem-sucedido

**Exemplo de estrutura**:
```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      router.push('/chat') // Redireciona para chat após login
      router.refresh()
    } catch (error: any) {
      setError(error.message || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
    } catch (error: any) {
      setError(error.message || 'Erro ao fazer login com Google')
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bem-vindo de volta</CardTitle>
        <CardDescription>Entre na sua conta SATI</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Formulário email/senha */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          {/* ... campos de input ... */}
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-muted-foreground">ou</span>
          </div>
        </div>

        {/* Google OAuth */}
        <Button 
          onClick={handleGoogleLogin} 
          variant="outline" 
          className="w-full"
          disabled={loading}
        >
          {/* Google icon + text */}
        </Button>

        {/* Links */}
        <div className="mt-6 text-center space-y-2">
          <a href="/reset-password" className="text-sm text-blue-600 hover:underline">
            Esqueci minha senha
          </a>
          <div className="text-sm text-gray-600">
            Não tem conta?{' '}
            <a href="/signup" className="text-blue-600 hover:underline">
              Criar conta
            </a>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
```

#### 2.3 Criar `signup/page.tsx`
**Features**:
- Formulário com nome, email, senha, confirmar senha
- Validação de senha forte
- Botão "Continuar com Google"
- Link para "Já tenho conta"
- Termos de uso e privacidade
- Email de verificação após signup

#### 2.4 Criar `reset-password/page.tsx`
**Features**:
- Formulário com email
- Envio de magic link para redefinir senha
- Feedback de sucesso

---

### 🟢 Tarefa 3: Implementar Middleware de Proteção de Rotas
**Estimativa**: 1 hora  
**Prioridade**: ALTA  

**Arquivo**: `middleware.ts` (raiz do projeto)

**Objetivo**: Proteger rotas privadas e redirecionar usuários não autenticados

**Implementação**:
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Rotas públicas (não requerem autenticação)
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/reset-password',
  '/verify-email',
  '/auth/callback',
  '/auth/logout',
]

// Rotas privadas (requerem autenticação)
const PRIVATE_ROUTES = [
  '/chat',
  '/settings',
  '/dashboard',
  '/api/chat',
  '/api/mcp',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Permitir assets e API routes públicas
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Criar Supabase client para SSR
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
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Buscar usuário da sessão
  const { data: { user } } = await supabase.auth.getUser()

  // Verificar se rota é pública
  const isPublicRoute = PUBLIC_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route)
  )

  // Verificar se rota é privada
  const isPrivateRoute = PRIVATE_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route)
  )

  // Se usuário não autenticado tenta acessar rota privada
  if (!user && isPrivateRoute) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Se usuário autenticado tenta acessar página de login/signup
  if (user && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/chat', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Como testar**:
```bash
# Sem autenticação, acessar /chat deve redirecionar para /login
curl -I http://localhost:3001/chat

# Com autenticação, acessar /login deve redirecionar para /chat
curl -I -H "Cookie: sb-access-token=..." http://localhost:3001/login
```

---

### 🟡 Tarefa 4: Remover DEV BYPASS e Implementar Auth Real
**Estimativa**: 1 hora  
**Prioridade**: ALTA  

**Arquivos a modificar**:
1. `src/app/api/chat/route.ts` (linhas 283-296)
2. Todas as API routes que usam `userId`

**Mudanças**:

#### 4.1 Atualizar `api/chat/route.ts`
```typescript
// REMOVER ISTO:
const isDev = process.env.NODE_ENV === 'development'
let userId: string

if (isDev) {
  userId = '84c419f8-bb51-4a51-bb0d-26a48453f495'
  console.log('[DEV MODE] Using fixed user ID:', userId)
} else {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  userId = user.id
}

// SUBSTITUIR POR:
const supabase = createClient()
const { data: { user }, error: authError } = await supabase.auth.getUser()

if (authError || !user) {
  console.error('[Auth] Failed to get user:', authError)
  return NextResponse.json(
    { error: 'Authentication required. Please login.' }, 
    { status: 401 }
  )
}

const userId = user.id
console.log('[Auth] Authenticated user:', userId)
```

#### 4.2 Criar helper `getAuthenticatedUser()`
```typescript
// src/lib/auth/helpers.ts
import { createClient } from '@/lib/supabase/server'

export async function getAuthenticatedUser() {
  const supabase = createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('Unauthorized')
  }
  
  return user
}
```

Usar em todas as API routes:
```typescript
import { getAuthenticatedUser } from '@/lib/auth/helpers'

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    // usar user.id
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
```

---

### 🟢 Tarefa 5: Habilitar RLS no Supabase
**Estimativa**: 1 hora  
**Prioridade**: CRÍTICA  

**Objetivo**: Garantir que usuários só acessem seus próprios dados

**Tabelas a proteger**:
- `hyperfocus`
- `tasks`
- `focus_sessions`
- `alternancy_sessions`
- `alternancy_hyperfocus`
- `user_api_keys`

**Passos**:

#### 5.1 Habilitar RLS em todas as tabelas
```sql
-- Supabase SQL Editor

-- 1. Habilitar RLS
ALTER TABLE hyperfocus ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alternancy_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alternancy_hyperfocus ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;
```

#### 5.2 Criar políticas RLS
```sql
-- HYPERFOCUS
CREATE POLICY "Users can view their own hyperfocus"
  ON hyperfocus FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own hyperfocus"
  ON hyperfocus FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own hyperfocus"
  ON hyperfocus FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hyperfocus"
  ON hyperfocus FOR DELETE
  USING (auth.uid() = user_id);

-- TASKS (através do hyperfocus)
CREATE POLICY "Users can view their own tasks"
  ON tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM hyperfocus
      WHERE hyperfocus.id = tasks.hyperfocus_id
      AND hyperfocus.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own tasks"
  ON tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hyperfocus
      WHERE hyperfocus.id = tasks.hyperfocus_id
      AND hyperfocus.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own tasks"
  ON tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM hyperfocus
      WHERE hyperfocus.id = tasks.hyperfocus_id
      AND hyperfocus.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own tasks"
  ON tasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM hyperfocus
      WHERE hyperfocus.id = tasks.hyperfocus_id
      AND hyperfocus.user_id = auth.uid()
    )
  );

-- FOCUS_SESSIONS (através do hyperfocus)
CREATE POLICY "Users can view their own focus sessions"
  ON focus_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM hyperfocus
      WHERE hyperfocus.id = focus_sessions.hyperfocus_id
      AND hyperfocus.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own focus sessions"
  ON focus_sessions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hyperfocus
      WHERE hyperfocus.id = focus_sessions.hyperfocus_id
      AND hyperfocus.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own focus sessions"
  ON focus_sessions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM hyperfocus
      WHERE hyperfocus.id = focus_sessions.hyperfocus_id
      AND hyperfocus.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own focus sessions"
  ON focus_sessions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM hyperfocus
      WHERE hyperfocus.id = focus_sessions.hyperfocus_id
      AND hyperfocus.user_id = auth.uid()
    )
  );

-- ALTERNANCY_SESSIONS
CREATE POLICY "Users can view their own alternancy sessions"
  ON alternancy_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own alternancy sessions"
  ON alternancy_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alternancy sessions"
  ON alternancy_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alternancy sessions"
  ON alternancy_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- USER_API_KEYS
CREATE POLICY "Users can view their own API keys"
  ON user_api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API keys"
  ON user_api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys"
  ON user_api_keys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys"
  ON user_api_keys FOR DELETE
  USING (auth.uid() = user_id);
```

#### 5.3 Criar script para aplicar RLS
Arquivo: `supabase/security/enable-rls.sql`

**Como testar**:
```sql
-- Testar como usuário específico
SET request.jwt.claim.sub = 'user-uuid-here';

SELECT * FROM hyperfocus; -- Deve retornar apenas dados do usuário
SELECT * FROM tasks; -- Deve retornar apenas tarefas do usuário
```

---

### 🟡 Tarefa 6: Criar Componente AuthGuard
**Estimativa**: 45 minutos  
**Prioridade**: MÉDIA  

**Arquivo**: `src/components/auth/AuthGuard.tsx`

**Objetivo**: Componente wrapper para proteger páginas client-side

**Implementação**:
```tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
  loadingComponent?: React.ReactNode
}

export function AuthGuard({
  children,
  requireAuth = true,
  redirectTo = '/login',
  loadingComponent,
}: AuthGuardProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        setUser(user)

        if (requireAuth && !user) {
          router.push(redirectTo)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        if (requireAuth) {
          router.push(redirectTo)
        }
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        
        if (requireAuth && !session?.user) {
          router.push(redirectTo)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [requireAuth, redirectTo, router, supabase])

  if (loading) {
    return loadingComponent || (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (requireAuth && !user) {
    return null // Middleware vai redirecionar
  }

  return <>{children}</>
}

// Hook personalizado para acessar usuário
export function useAuth() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  return { user, loading }
}
```

**Uso**:
```tsx
// Em uma página
import { AuthGuard } from '@/components/auth/AuthGuard'

export default function ChatPage() {
  return (
    <AuthGuard>
      {/* Conteúdo da página */}
    </AuthGuard>
  )
}
```

---

### 🟢 Tarefa 7: Adicionar Botão de Logout
**Estimativa**: 30 minutos  
**Prioridade**: MÉDIA  

**Arquivos a modificar**:
- `src/components/layout/Header.tsx` (ou sidebar)

**Implementação**:
```tsx
'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthGuard'

export function UserMenu() {
  const router = useRouter()
  const supabase = createClient()
  const { user } = useAuth()

  async function handleLogout() {
    try {
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  if (!user) return null

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-600">
        {user.email}
      </span>
      <Button
        onClick={handleLogout}
        variant="ghost"
        size="sm"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sair
      </Button>
    </div>
  )
}
```

---

### 🟡 Tarefa 8: Criar Página de Onboarding
**Estimativa**: 1.5 horas  
**Prioridade**: MÉDIA  

**Arquivo**: `src/app/(auth)/onboarding/page.tsx`

**Objetivo**: Guiar novo usuário após primeiro login

**Features**:
- Passo 1: Configurar API key OpenAI
- Passo 2: Criar primeiro hiperfoco
- Passo 3: Tour das funcionalidades
- Passo 4: Redirecionar para chat

**Fluxo**:
```
Signup → Email verification → Onboarding → Chat
```

---

### 🟢 Tarefa 9: Testes E2E de Autenticação
**Estimativa**: 1 hora  
**Prioridade**: ALTA  

**Testes a implementar**:

#### 9.1 Teste de Signup
```typescript
describe('Authentication Flow', () => {
  it('should signup new user with email/password', async () => {
    // 1. Acessar /signup
    // 2. Preencher formulário
    // 3. Submeter
    // 4. Verificar redirecionamento para /verify-email
    // 5. Verificar email enviado
  })

  it('should signup with Google OAuth', async () => {
    // 1. Clicar "Continuar com Google"
    // 2. Simular OAuth callback
    // 3. Verificar redirecionamento para /chat
  })
})
```

#### 9.2 Teste de Login
```typescript
it('should login existing user', async () => {
  // 1. Acessar /login
  // 2. Preencher credenciais válidas
  // 3. Submeter
  // 4. Verificar redirecionamento para /chat
  // 5. Verificar session cookie presente
})

it('should show error for invalid credentials', async () => {
  // 1. Acessar /login
  // 2. Preencher credenciais inválidas
  // 3. Verificar mensagem de erro exibida
})
```

#### 9.3 Teste de Proteção de Rotas
```typescript
it('should redirect unauthenticated user to login', async () => {
  // 1. Limpar cookies
  // 2. Acessar /chat
  // 3. Verificar redirecionamento para /login?redirect=/chat
})

it('should allow authenticated user to access protected routes', async () => {
  // 1. Fazer login
  // 2. Acessar /chat
  // 3. Verificar página carregada corretamente
})
```

#### 9.4 Teste de RLS
```typescript
it('should isolate data between users', async () => {
  // 1. Criar user1 e criar hiperfoco
  // 2. Criar user2
  // 3. Tentar acessar hiperfoco de user1 como user2
  // 4. Verificar erro 404 ou empty result
})
```

---

## 📝 Checklist de Implementação

### Configuração Inicial
- [ ] Configurar Google OAuth no Supabase Dashboard
- [ ] Configurar email templates
- [ ] Criar variáveis de ambiente necessárias
- [ ] Testar providers no Supabase

### Frontend
- [ ] Criar layout `(auth)`
- [ ] Criar página `/login`
- [ ] Criar página `/signup`
- [ ] Criar página `/reset-password`
- [ ] Criar componente `AuthGuard`
- [ ] Adicionar botão de logout
- [ ] Criar página de onboarding

### Backend
- [ ] Criar `middleware.ts` na raiz
- [ ] Remover DEV BYPASS de `api/chat/route.ts`
- [ ] Criar helper `getAuthenticatedUser()`
- [ ] Atualizar todas as API routes
- [ ] Testar proteção de rotas

### Banco de Dados
- [ ] Habilitar RLS em todas as tabelas
- [ ] Criar políticas RLS para `hyperfocus`
- [ ] Criar políticas RLS para `tasks`
- [ ] Criar políticas RLS para `focus_sessions`
- [ ] Criar políticas RLS para `alternancy_sessions`
- [ ] Criar políticas RLS para `user_api_keys`
- [ ] Testar isolamento de dados

### Testes
- [ ] Teste de signup com email
- [ ] Teste de signup com Google
- [ ] Teste de login
- [ ] Teste de logout
- [ ] Teste de proteção de rotas
- [ ] Teste de RLS
- [ ] Teste de reset password

### Documentação
- [ ] Atualizar README com instruções de auth
- [ ] Documentar fluxo de autenticação
- [ ] Criar guia de troubleshooting
- [ ] Atualizar CHANGELOG

---

## 🚀 Ordem de Execução Recomendada

### Dia 1 (4-5 horas)
1. ✅ **Configurar Supabase Auth Providers** (30 min)
2. ✅ **Habilitar RLS** (1 hora) - CRÍTICO FAZER PRIMEIRO
3. ✅ **Criar Middleware** (1 hora)
4. ✅ **Criar páginas de Login/Signup** (2 horas)

### Dia 2 (3-4 horas)
5. ✅ **Remover DEV BYPASS** (1 hora)
6. ✅ **Criar AuthGuard** (45 min)
7. ✅ **Adicionar Logout** (30 min)
8. ✅ **Testar fluxos principais** (1 hora)

### Dia 3 (opcional, 2-3 horas)
9. ✅ **Criar página de Onboarding** (1.5 horas)
10. ✅ **Testes E2E** (1 hora)
11. ✅ **Ajustes finais e polish** (30 min)

---

## 🐛 Troubleshooting Comum

### Problema: "Auth session missing"
**Solução**: Verificar se cookies estão sendo setados corretamente no middleware

### Problema: RLS bloqueia queries válidas
**Solução**: Verificar se `auth.uid()` retorna valor correto. Testar com:
```sql
SELECT auth.uid(); -- Deve retornar UUID do usuário
```

### Problema: Redirect loop entre /login e /chat
**Solução**: Verificar lógica de redirecionamento no middleware. Garantir que rotas públicas estão excluídas.

### Problema: OAuth callback retorna erro
**Solução**: Verificar redirect URLs no Google Cloud Console e Supabase Dashboard.

---

## 📊 Métricas de Sucesso

### Funcional
- ✅ Usuário consegue criar conta
- ✅ Usuário consegue fazer login
- ✅ Usuário consegue fazer logout
- ✅ Rotas privadas estão protegidas
- ✅ RLS isola dados entre usuários
- ✅ OAuth Google funciona

### Técnico
- ✅ Zero erros de auth em produção
- ✅ Tempo de login < 2 segundos
- ✅ Taxa de sucesso de signup > 95%
- ✅ Sessões persistem corretamente

### UX
- ✅ Fluxo de auth é intuitivo
- ✅ Mensagens de erro são claras
- ✅ Loading states evitam confusão
- ✅ Onboarding guia novos usuários

---

## 🔗 Recursos Úteis

### Documentação
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)

### Exemplos
- [Supabase Next.js Auth Example](https://github.com/vercel/next.js/tree/canary/examples/with-supabase)
- [Next.js Auth Best Practices](https://nextjs.org/docs/app/building-your-application/authentication)

---

## 📌 Próximos Passos (Pós-Sprint)

### Features Futuras
1. **2FA (Two-Factor Authentication)**
2. **Sessões múltiplas** (gerenciar dispositivos)
3. **OAuth adicional** (GitHub, Microsoft)
4. **Magic link exclusivo** (sem senha)
5. **Perfil de usuário** (avatar, bio, preferências)

### Preparação para Flutter
- Documentar endpoints de auth
- Criar API tokens para mobile
- Planejar deep links
- Considerar refresh tokens

---

**🎯 Meta do Sprint**: Sistema de autenticação completo, seguro e testado, pronto para receber usuários externos no beta do SATI!
