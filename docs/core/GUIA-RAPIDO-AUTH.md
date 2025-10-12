# 🚀 Guia Rápido: Implementar Autenticação

**Tempo estimado**: 2-3 dias  
**Pré-requisitos**: Supabase project criado, Next.js 15 rodando

---

## ⚡ Quick Start (Primeiros Passos)

### 1️⃣ Configurar Supabase Auth (15 min)

#### No Supabase Dashboard:
1. **Authentication > Providers > Email**
   - ✅ Enable Email provider
   - ✅ Confirm email: ENABLED (para produção)
   - ✅ Secure email change: ENABLED

2. **Authentication > Providers > Google**
   - ✅ Enable Google provider
   - 📝 Authorized Client IDs: Pegar do Google Cloud Console
   - 📝 Authorized Client Secret: Pegar do Google Cloud Console

#### No Google Cloud Console:
1. Acessar: https://console.cloud.google.com/apis/credentials
2. Criar novo OAuth 2.0 Client ID
3. **Authorized redirect URIs**:
   ```
   https://[PROJECT_ID].supabase.co/auth/v1/callback
   http://localhost:3001/auth/callback (dev)
   ```
4. Copiar Client ID e Secret para Supabase

### 2️⃣ Criar Middleware (30 min)

**Arquivo**: `middleware.ts` (na raiz do projeto, mesmo nível que `package.json`)

```bash
touch middleware.ts
```

Cole o conteúdo completo do exemplo na tarefa 3 do sprint.

**Testar**:
```bash
npm run dev
# Acessar http://localhost:3001/chat (deve redirecionar para /login)
```

### 3️⃣ Criar Páginas de Auth (1 hora)

```bash
# Criar estrutura
mkdir -p src/app/\(auth\)/{login,signup,reset-password}
touch src/app/\(auth\)/layout.tsx
touch src/app/\(auth\)/login/page.tsx
touch src/app/\(auth\)/signup/page.tsx
```

Copiar exemplos completos do sprint (Tarefa 2).

### 4️⃣ Habilitar RLS (30 min)

1. Acessar Supabase SQL Editor
2. Copiar conteúdo de `supabase/security/enable-rls.sql`
3. Executar script completo
4. Verificar:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables 
   WHERE schemaname = 'public' AND tablename = 'hyperfocus';
   -- rowsecurity deve ser 't' (true)
   ```

### 5️⃣ Remover DEV BYPASS (15 min)

**Arquivo**: `src/app/api/chat/route.ts`

Procurar por:
```typescript
const isDev = process.env.NODE_ENV === 'development'
```

Substituir todo o bloco por:
```typescript
import { getAuthenticatedUser } from '@/lib/auth/helpers'

// ... dentro da função POST
const user = await getAuthenticatedUser()
const userId = user.id
```

Repetir para todas as API routes.

### 6️⃣ Testar Fluxo Completo (30 min)

```bash
# 1. Limpar storage e cookies
# DevTools > Application > Clear site data

# 2. Acessar app
open http://localhost:3001

# 3. Criar conta
# Preencher formulário de signup

# 4. Verificar email (dev: ver logs do Supabase)

# 5. Fazer login

# 6. Verificar sessão persistente
# Recarregar página - deve manter autenticado

# 7. Criar hiperfoco
# Verificar que userId correto está sendo usado

# 8. Fazer logout
# Deve redirecionar para /login
```

---

## 🔥 Comandos Úteis

### Verificar Status RLS
```sql
-- No Supabase SQL Editor
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### Testar Políticas RLS
```sql
-- Simular usuário
SET request.jwt.claim.sub = '84c419f8-bb51-4a51-bb0d-26a48453f495';

-- Testar query
SELECT * FROM hyperfocus;

-- Reset
RESET request.jwt.claim.sub;
```

### Ver Sessão Ativa (Client-side)
```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)
```

### Forçar Logout (Client-side)
```typescript
const supabase = createClient()
await supabase.auth.signOut()
window.location.href = '/login'
```

---

## 🐛 Problemas Comuns

### ❌ "Auth session missing"

**Causa**: Middleware não está setando cookies corretamente

**Solução**:
```typescript
// Verificar em middleware.ts que está usando createServerClient corretamente
import { createServerClient } from '@supabase/ssr'

const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        // IMPORTANTE: Precisa setar em request E response
        request.cookies.set({ name, value, ...options })
        response.cookies.set({ name, value, ...options })
      },
      // ...
    }
  }
)
```

### ❌ RLS Blocking Valid Queries

**Causa**: `auth.uid()` não retorna valor ou políticas estão incorretas

**Solução**:
```sql
-- Testar auth.uid()
SELECT auth.uid();

-- Se retornar NULL, session não está sendo passada corretamente
-- Verificar se está usando createClient() correto (server-side)
```

### ❌ Redirect Loop (/login ↔ /chat)

**Causa**: Lógica de redirecionamento no middleware conflitando

**Solução**:
```typescript
// Em middleware.ts, garantir que rotas públicas estão excluídas
const PUBLIC_ROUTES = ['/', '/login', '/signup', '/auth/callback']
const isPublicRoute = PUBLIC_ROUTES.some(route => 
  pathname === route || pathname.startsWith(route)
)
```

### ❌ Google OAuth Error "redirect_uri_mismatch"

**Causa**: Redirect URI não configurada no Google Cloud Console

**Solução**:
1. Google Cloud Console > Credentials > OAuth 2.0 Client
2. Adicionar em "Authorized redirect URIs":
   ```
   https://[PROJECT_ID].supabase.co/auth/v1/callback
   ```
3. Aguardar 5 minutos para propagar

### ❌ "Invalid API key" após login

**Causa**: Usuário não tem API key configurada ainda

**Solução**:
```typescript
// Adicionar validação na API route
const { data: apiKey } = await supabase
  .from('user_api_keys')
  .select('encrypted_key')
  .eq('user_id', userId)
  .eq('provider', 'openai')
  .single()

if (!apiKey) {
  return NextResponse.json({
    error: 'API key not configured. Please add your OpenAI API key in Settings.',
    redirectTo: '/settings'
  }, { status: 400 })
}
```

---

## ✅ Checklist Rápido

**Antes de começar**:
- [ ] Supabase project criado
- [ ] Variáveis de ambiente configuradas (`.env.local`)
- [ ] Google OAuth app criado (se usar OAuth)

**Implementação (Dia 1)**:
- [ ] Middleware criado e funcionando
- [ ] RLS habilitado em todas as tabelas
- [ ] Página de login criada
- [ ] Página de signup criada

**Implementação (Dia 2)**:
- [ ] DEV BYPASS removido
- [ ] Todas API routes protegidas
- [ ] Botão de logout funcionando
- [ ] Testes básicos passando

**Validação Final**:
- [ ] Signup cria usuário no Supabase
- [ ] Login autentica corretamente
- [ ] Rotas privadas redirecionam se não autenticado
- [ ] RLS isola dados entre usuários
- [ ] Logout limpa sessão e redireciona
- [ ] OAuth Google funciona (se habilitado)

---

## 📚 Próximos Passos

Após implementar autenticação básica:

1. **Onboarding**: Guiar novo usuário para configurar API key
2. **Email templates**: Customizar emails do Supabase
3. **Reset password**: Implementar recuperação de senha
4. **2FA**: Adicionar autenticação de dois fatores (futuro)
5. **Session management**: Gerenciar múltiplos dispositivos

---

## 🆘 Precisa de Ajuda?

- 📖 [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- 📖 [Next.js Middleware Docs](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- 📖 [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- 💬 [Supabase Discord](https://discord.supabase.com)

**Arquivo de referência completo**: `docs/core/SPRINT-AUTENTICACAO.md`
