# 🔐 Decisões de Arquitetura: Sistema de Autenticação

**Status**: ✅ DECIDIDO - Implementação em andamento  
**Prioridade**: 🔥 ALTA - Sprint iniciado  
**Data Atualização**: 2025-10-11  
**Data Original**: 2025-10-09

---

## 🎯 PIVOT ESTRATÉGICO (11 de Outubro de 2025)

### Estratégia Anterior (DESCARTADA)
- ❌ Foco em integração com ChatGPT/OpenAI Apps SDK
- ❌ OAuth 2.1 completo para Apps SDK
- ❌ Authorization server complexo
- ❌ Compatibilidade com ChatGPT como prioridade

### Nova Estratégia (ATUAL)
1. ✅ **Fase Beta (PRIORIDADE)**: Web app Next.js + Supabase com autenticação tradicional
2. ✅ **Fase Mobile (FUTURO)**: App Flutter com widgets nativos para neurodivergentes
3. ✅ **Foco**: Usuários externos usando aplicação web completa

**Justificativa do Pivot**:
- Flutter permite widgets nativos extremamente úteis para neurodivergentes (timers visuais, notificações adaptativas)
- Web app como MVP/beta é mais rápido de lançar
- ChatGPT integration pode ser fase 3 (depois de validar mercado)

---

## 📋 Contexto Atual

### Implementação Temporária (A SER REMOVIDA)
```typescript
// src/app/api/chat/route.ts (linha 286)
const isDev = process.env.NODE_ENV === 'development'
if (isDev) {
  userId = '84c419f8-bb51-4a51-bb0d-26a48453f495' // DEV BYPASS
}
```

### Estado do Banco
- ✅ RLS criado mas DESABILITADO em desenvolvimento
- ✅ Políticas RLS definidas (ver `supabase/security/enable-rls.sql`)
- ⏳ Supabase Auth configurado mas não em uso

### Próximos Passos
Sprint de autenticação em andamento (2-3 dias) - ver `docs/core/SPRINT-AUTENTICACAO.md`

---

## ✅ DECISÕES FINAIS (11 de Outubro de 2025)

### 1. Padrão de Autenticação: Supabase Auth + OAuth Google

**DECISÃO**: ✅ Opção híbrida - Email/Password + Google OAuth (via Supabase Auth)

**Justificativa**:
- ✅ Supabase Auth é robusto e battle-tested
- ✅ Google OAuth é familiar para usuários
- ✅ Email/password como fallback
- ✅ Magic link opcional para neurodivergentes (menos fricção)
- ✅ Preparado para escalar (sessões via cookies)
- ✅ Base sólida para app Flutter futuro

**Implementação**:
```typescript
// Login via email/password
await supabase.auth.signInWithPassword({ email, password })

// Login via Google OAuth
await supabase.auth.signInWithOAuth({ 
  provider: 'google',
  options: { redirectTo: '/auth/callback' }
})

// Magic link (opcional)
await supabase.auth.signInWithOtp({ email })
```

**Opções DESCARTADAS**:
- ❌ OAuth 2.1 Apps SDK: Complexidade desnecessária para web app
- ❌ Authorization server custom: Over-engineering para MVP/beta

---

### 2. Escopo do Sistema: Web App Next.js (Beta) + Flutter (Futuro)

**DECISÃO**: ✅ Fase 1: Web-only | Fase 2: Mobile Flutter

**Justificativa**:
- ✅ Web app é mais rápido para lançar beta
- ✅ Validação de mercado antes de investir em mobile
- ✅ Flutter permite widgets nativos poderosos (timers, notificações adaptativas)
- ✅ Arquitetura preparada para ambos (API REST compartilhada)

**Roadmap**:
1. **Fase Beta (Atual)**: Web Next.js + Supabase Auth
2. **Fase Mobile (Q1 2026)**: App Flutter + Deep links
3. **Fase Enterprise (Q2 2026)**: ChatGPT integration (opcional)

---

### 3. Token Verification: Middleware Next.js + RLS Supabase

**DECISÃO**: ✅ Middleware server-side + Row Level Security

**Implementação**:
```typescript
// middleware.ts (raiz do projeto)
export async function middleware(request: NextRequest) {
  const supabase = createServerClient(...)
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user && isPrivateRoute(pathname)) {
    return NextResponse.redirect('/login')
  }
  
  return response
}
```

**Camadas de Segurança**:
1. **Middleware**: Protege rotas Next.js (redirecionamento)
2. **API Routes**: Valida `getAuthenticatedUser()` em cada endpoint
3. **RLS**: Isola dados no Supabase (políticas SQL)

**Opções DESCARTADAS**:
- ❌ JWT Bearer token verification: Desnecessário para web app
- ❌ Frontend-only validation: Inseguro

#### Opção A: Validação JWT per-tool (Apps SDK)
```typescript
---

### 4. Segurança de Dados: Row Level Security (RLS)

**DECISÃO**: ✅ RLS habilitado em TODAS as tabelas

**Tabelas Protegidas**:
- `hyperfocus` - ownership via `user_id`
- `tasks` - ownership via `hyperfocus.user_id`
- `focus_sessions` - ownership via `hyperfocus.user_id`
- `alternancy_sessions` - ownership via `user_id`
- `alternancy_hyperfocus` - ownership via `alternancy_sessions.user_id`
- `user_api_keys` - ownership via `user_id`

**Políticas Implementadas**:
```sql
-- Exemplo: hyperfocus
CREATE POLICY "Users can view their own hyperfocus"
  ON hyperfocus FOR SELECT
  USING (auth.uid() = user_id);

-- Exemplo: tasks (através de hyperfocus)
CREATE POLICY "Users can view their own tasks"
  ON tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM hyperfocus
      WHERE hyperfocus.id = tasks.hyperfocus_id
      AND hyperfocus.user_id = auth.uid()
    )
  );
```

**Script Completo**: `supabase/security/enable-rls.sql`

---

## 🔧 Arquitetura Final

### Fluxo de Autenticação

```
┌─────────────┐
│   Usuário   │
└──────┬──────┘
       │
       │ 1. Acessa /chat (sem auth)
       ▼
┌─────────────────┐
│   Middleware    │ → Verifica sessão (cookies)
│   (Next.js)     │ → Sessão inválida? Redirect /login
└──────┬──────────┘
       │
       │ 2. Login via email/Google
       ▼
┌─────────────────┐
│  Supabase Auth  │ → Cria sessão
│                 │ → Seta cookies
└──────┬──────────┘
       │
       │ 3. Redirect para /chat (com cookies)
       ▼
┌─────────────────┐
│   Middleware    │ → Valida cookies ✅
│   (Next.js)     │ → Permite acesso
└──────┬──────────┘
       │
       │ 4. API request (criar hiperfoco)
       ▼
┌─────────────────┐
│  API Route      │ → getAuthenticatedUser()
│  /api/chat      │ → Extrai userId da sessão
└──────┬──────────┘
       │
       │ 5. Query database
       ▼
┌─────────────────┐
│  Supabase RLS   │ → Filtra por auth.uid()
│  (PostgreSQL)   │ → Retorna apenas dados do usuário
└─────────────────┘
```

### Camadas de Proteção

| Camada | Tipo | Função | Bypass? |
|--------|------|--------|---------|
| 1. Middleware | Server-side | Protege rotas Next.js | ❌ Não |
| 2. API Routes | Server-side | Valida usuário em cada request | ❌ Não |
| 3. RLS Policies | Database | Isola dados no PostgreSQL | ⚠️ Service role only |

**Nota**: Service role key bypassa RLS (usar apenas em migrations/admin)

---
```

**Prós**:
- Padrão Apps SDK
- Stateless
- Escalável

**Contras**:
- Precisa implementar verificação JWT
- JWKS, audience, issuer, etc.

#### Opção B: Frontend valida, passa user_id
```typescript
// Frontend Next.js
const session = await getSession();
const result = await callMCPTool('createHyperfocus', {
  ...args,
  _userId: session.user.id // implícito
});
```

**Prós**:
- MCP server mais simples
- Sem lógica de auth no MCP

**Contras**:
- Confia no frontend (menos seguro)
- Não funciona com ChatGPT

#### Opção C: Híbrido
```typescript
async function getUserId(request: Request): Promise<string> {
  // Tentar JWT primeiro (ChatGPT)
  const bearer = request.headers.get('Authorization');
  if (bearer) return verifyJWT(bearer);
  
  // Fallback: session cookie (Web)
  const session = await getSessionFromCookie(request);
  if (session) return session.user.id;
  
  throw new UnauthorizedError();
}
```

**Decisão pendente**: Baseado no escopo escolhido

---

### 4. Authorization Server

Se escolhermos OAuth 2.1 completo:

#### Opção A: Auth0
**Prós**:
- Já mencionado na doc OpenAI
- RBAC built-in
- Dynamic client registration
- Token introspection

**Contras**:
- Custo adicional
- Vendor lock-in

#### Opção B: Supabase como Authorization Server
**Prós**:
- Já estamos usando
- Sem custo adicional
- Integração mais simples

**Contras**:
- Precisa configurar endpoints custom
- Supabase não é authorization server completo
- Pode não ter todos os recursos necessários

#### Opção C: Custom (Next.js API Routes)
**Prós**:
- Controle total
- Sem custos externos
- Totalmente customizável

**Contras**:
- Implementação complexa
- Manutenção de segurança
- Precisa implementar JWKS, introspection, etc.

**Decisão pendente**: Avaliar custo vs complexidade

---

## 🔧 Implementação Técnica

### Endpoints Necessários (se OAuth 2.1)

Segundo a [documentação do Apps SDK](https://developers.openai.com/apps-sdk/build/auth):

1. **Resource Server Metadata**
   ```
   GET /.well-known/oauth-protected-resource
   ```
   Retorna:
   ```json
   {
     "resource": "https://sati.app/mcp",
     "authorization_servers": ["https://auth.sati.app"],
     "scopes_supported": ["user", "hyperfocus.read", "hyperfocus.write"]
   }
   ```

2. **OpenID Configuration**
   ```
   GET /.well-known/openid-configuration
   ```
   Deve incluir:
   - `authorization_endpoint`
   - `token_endpoint`
   - `jwks_uri`
   - `registration_endpoint`

3. **Token Endpoint**
   ```
   POST /oauth/token
   ```
   Code + PKCE exchange

4. **Registration Endpoint**
   ```
   POST /oauth/register
   ```
   Dynamic client registration para ChatGPT

### MCP Server Changes

```typescript
// Adicionar em TOOL_DEFINITIONS
{
  name: 'createHyperfocus',
  securitySchemes: [
    { type: 'oauth2', scopes: ['hyperfocus.write'] }
  ],
  // ...
}

// Handler com auth
async function handleCreateHyperfocus(args, context) {
  const userId = context.userId; // do token verificado
  const { data } = await supabase
    .from('hyperfocus')
    .insert({
      user_id: userId, // agora dinâmico!
      title: args.title,
      // ...
    });
}
```

---

## 📊 Impacto nas Tools

Todas as 10 tools serão afetadas:

| Tool | Requer Auth | Escopo Sugerido |
|------|-------------|-----------------|
| createHyperfocus | Sim | `hyperfocus.write` |
| listHyperfocus | Sim | `hyperfocus.read` |
| getHyperfocus | Sim | `hyperfocus.read` |
| createTask | Sim | `tasks.write` |
| updateTaskStatus | Sim | `tasks.write` |
| breakIntoSubtasks | Sim | `tasks.write` |
| startFocusTimer | Sim | `sessions.write` |
| endFocusTimer | Sim | `sessions.write` |
| analyzeContext | Sim | `hyperfocus.read` |
| createAlternancy | Sim | `alternancy.write` |

Potencialmente adicionar:
- Algumas tools podem ser `noauth` + `oauth2` (opcional)
- Exemplo: `listHyperfocus` pode funcionar sem auth mas retornar mais dados com auth

---

## 🚀 Roadmap Sugerido

### Fase 1: Desenvolvimento Local (ATUAL)
- [x] RLS desabilitado
- [x] TEST_USER_ID fixo
- [x] Todas tools funcionando no Inspector
- [ ] Testes completos das 10 tools

### Fase 2: Auth Básica (Web)
- [ ] Supabase Auth implementado (Magic Link ou Email/Senha)
- [ ] Páginas de login/cadastro
- [ ] Middleware para proteger rotas
- [ ] MCP server lê session cookies
- [ ] RLS reabilitado com auth real

### Fase 3: OAuth 2.1 (ChatGPT)
- [ ] Escolher authorization server
- [ ] Implementar endpoints required
- [ ] Token verification no MCP server
- [ ] `securitySchemes` nas tools
- [ ] Dynamic client registration
- [ ] Testes com ChatGPT

### Fase 4: Produção
- [ ] Migrar de TEST_USER_ID para user real
- [ ] RLS policies refinadas
- [ ] Rate limiting por usuário
- [ ] Monitoring e logs de auth
- [ ] Documentação para usuários

---

## 🔗 Referências

1. **OpenAI Apps SDK - Authentication**
   https://developers.openai.com/apps-sdk/build/auth
   
2. **MCP Authorization Spec**
   (Precisa verificar documentação oficial do MCP)
   
3. **Supabase Auth Docs**
   https://supabase.com/docs/guides/auth
   
4. **OAuth 2.1 Spec**
   https://oauth.net/2.1/

5. **Supabase Row Level Security**
   https://supabase.com/docs/guides/auth/row-level-security

---

## ❓ Perguntas em Aberto

1. **Timing**: Quando implementar auth? Antes ou depois do MVP funcional?
2. **Escopo inicial**: Começar só com web ou já pensar em ChatGPT?
3. **Provider**: Auth0, Supabase, ou custom?
4. **UX**: Como será o fluxo de onboarding?
5. **Testes**: Como testar OAuth flow localmente?
6. **Custos**: Auth0 tem custo, quanto impacta o orçamento?

---

## 💡 Recomendação Preliminar

Para começar (ordem de complexidade):

1. **Curto prazo** (próximas 2-4 semanas):
   - Continuar com RLS desabilitado
   - Focar em funcionalidade das tools
   - Testar tudo no Inspector

2. **Médio prazo** (1-2 meses):
   - Implementar Supabase Auth básico (Magic Link)
   - Frontend com login/logout
   - MCP server lê session
   - RLS reabilitado

3. **Longo prazo** (3-6 meses):
   - OAuth 2.1 se for publicar no ChatGPT
   - Authorization server (provavelmente Auth0)
   - Compliance com Apps SDK
   - Publicação oficial

---

**Próxima revisão**: Após completar testes com RLS desabilitado  
**Owner**: Ester  
**Stakeholders**: Usuários neurodivergentes do Sati

