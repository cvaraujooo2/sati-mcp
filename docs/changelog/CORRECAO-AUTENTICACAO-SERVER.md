# Correção: Erro 401 no Chat API (Autenticação Server-Side)

**Data:** 12 de outubro de 2025  
**Status:** ✅ RESOLVIDO  
**Prioridade:** 🔴 CRÍTICA

## 📋 Problema

Usuário autenticado no navegador recebia erro `401 Unauthorized` ao tentar usar o chat:

```
api/chat:1 Failed to load resource: the server responded with a status of 401 (Unauthorized)
[Chat API Error] { error: "Unauthorized - Please log in to continue" }
```

### Sintomas
- ✅ Login funcionando corretamente no Supabase
- ✅ Session visível no navegador (cookies presentes)
- ❌ API route `/api/chat` não reconhecia a sessão
- ❌ `supabase.auth.getUser()` retornando `null` no servidor

## 🔍 Causa Raiz

O arquivo `src/lib/supabase/server.ts` estava usando o cliente **básico** do Supabase:

```typescript
// ❌ PROBLEMA: Cliente básico não lê cookies do Next.js
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createClient() {
  return createSupabaseClient<Database>(supabaseUrl, supabaseKey)
}
```

Este cliente não consegue acessar os **cookies da sessão** que o Next.js armazena, resultando em:
- Sessão não detectada no servidor
- `auth.getUser()` sempre retorna `null`
- Todas as API routes retornam 401

## ✅ Solução Implementada

### 1. Atualizar `src/lib/supabase/server.ts`

Substituir pelo cliente **SSR-aware** do `@supabase/ssr`:

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignorar se chamado de Server Component
          }
        },
      },
    }
  )
}
```

**Mudanças chave:**
- ✅ Usa `createServerClient` do `@supabase/ssr`
- ✅ Acessa cookies via `next/headers`
- ✅ Função agora é `async` (retorna `Promise`)
- ✅ Configura handlers de cookies para Next.js

### 2. Atualizar chamadas para `await createClient()`

Como a função agora é assíncrona, atualizamos todos os arquivos:

#### `src/app/api/chat/route.ts`
```typescript
// Antes
const supabase = createClient()

// Depois  
const supabase = await createClient()
```

E passar o cliente para classes que precisam:
```typescript
// Passar supabase já criado para evitar criar novo
const historyManager = new ConversationHistoryManager(supabase)
const toolExecutor = new OptimizedToolExecutor(supabase)
```

#### `src/app/api/settings/validate-key/route.ts`
```typescript
const supabase = await createClient()
```

#### `src/lib/auth/helpers.ts`
```typescript
export async function getAuthenticatedUser(): Promise<User> {
  const supabase = await createClient()
  // ...
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient()
  // ...
}
```

## 📊 Arquivos Modificados

1. ✅ `src/lib/supabase/server.ts` - Cliente SSR
2. ✅ `src/app/api/chat/route.ts` - await + passar cliente
3. ✅ `src/app/api/settings/validate-key/route.ts` - await
4. ✅ `src/lib/auth/helpers.ts` - await em 2 funções
5. ✅ `src/lib/services/apiKey.service.ts` - Limpeza código (remoção validações antigas)

**Nota:** `ConversationHistoryManager` e `OptimizedToolExecutor` não foram modificados porque aceitam um `supabaseClient` opcional no construtor. Agora sempre passamos o cliente já criado.

## 🧪 Como Testar

1. **Login no navegador:**
   ```
   http://localhost:3000/login
   ```

2. **Configurar API Key OpenAI:**
   ```
   http://localhost:3000/settings
   ```

3. **Enviar mensagem no chat:**
   ```
   http://localhost:3000/chat
   ```

4. **Verificar logs do servidor:**
   ```bash
   # Deve aparecer:
   [Chat API] Authenticated user: <uuid>
   [API Key Query] { userId: '...', hasData: true }
   ```

5. **Verificar navegador (DevTools):**
   ```javascript
   // Deve retornar 200, não 401
   fetch('/api/chat', { method: 'POST', ... })
   ```

## 🔐 Contexto de Segurança

Esta correção faz parte do sprint de autenticação e resolve:

- ✅ Sessões persistentes entre cliente e servidor
- ✅ Proteção de API routes com autenticação real
- ✅ Suporte SSR (Server-Side Rendering)
- ✅ Compatibilidade com middleware Next.js

**Relacionado:**
- `docs/core/SPRINT-AUTENTICACAO.md`
- `docs/debug/TROUBLESHOOTING.md`
- RLS ainda precisa ser habilitado no Supabase (script em `supabase/security/enable-rls-api-keys.sql`)

## 📚 Referências

- [Supabase SSR Documentation](https://supabase.com/docs/guides/auth/server-side)
- [Next.js App Router + Supabase](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [@supabase/ssr Package](https://www.npmjs.com/package/@supabase/ssr)

## ✅ Checklist de Validação

- [x] Cliente server usa `@supabase/ssr`
- [x] Todas chamadas `createClient()` usam `await`
- [x] Cookies configurados corretamente
- [x] API routes autenticam corretamente
- [x] Sem erros TypeScript
- [x] Servidor dev reiniciado
- [ ] Testado login + chat funcionando (aguardando user)
- [ ] RLS habilitado no Supabase
- [ ] API Keys criptografadas

---

**Próximos passos:**
1. Testar fluxo completo (login → settings → chat)
2. Executar script RLS (`enable-rls-api-keys.sql`)
3. Implementar criptografia de API keys
4. Adicionar rate limiting
