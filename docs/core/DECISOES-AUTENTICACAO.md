# 🔐 Decisões de Arquitetura: Sistema de Autenticação

**Status**: PLANEJAMENTO  
**Prioridade**: FUTURO (após testes com RLS desabilitado)  
**Data**: 2025-10-09

---

## 📋 Contexto

Atualmente o sistema está usando:
- `TEST_USER_ID` fixo: `00000000-0000-0000-0000-000000000001`
- RLS desabilitado no Supabase (apenas para desenvolvimento)
- Sem autenticação real implementada

Para produção, precisaremos implementar autenticação completa seguindo padrões do MCP/Apps SDK.

---

## 🎯 Decisões Principais a Tomar

### 1. Padrão de Autenticação

#### Opção A: OAuth 2.1 Completo (Apps SDK)
**Prós**:
- Segue spec oficial do MCP/Apps SDK
- Compatível com ChatGPT
- Suporte a dynamic client registration
- PKCE integrado

**Contras**:
- Complexidade alta
- Requer authorization server (Auth0, Okta, custom)
- Mais endpoints para implementar

**Referência**: 
- https://developers.openai.com/apps-sdk/build/auth
- Requer: `/.well-known/oauth-protected-resource`, `/.well-known/openid-configuration`

#### Opção B: Magic Link via Supabase
**Prós**:
- Simples de implementar
- Supabase já tem suporte nativo
- UX amigável (sem senha)
- Menos código

**Contras**:
- Não segue spec MCP completa
- Pode não funcionar com ChatGPT
- Menos controle sobre fluxo

#### Opção C: Email + Senha (Supabase Auth)
**Prós**:
- Tradicional e familiar
- Supabase já implementa
- Controle total

**Contras**:
- Requer gestão de senhas
- Não é OAuth 2.1
- Pode não integrar com ChatGPT

**Decisão pendente**: Escolher baseado no caso de uso primário

---

### 2. Escopo do MCP Server

#### Opção A: Apenas ChatGPT
**Foco**: Apps SDK oficial, OAuth 2.1, publicação no ChatGPT App Store

**Implica**:
- Implementar authorization server completo
- Endpoints OAuth obrigatórios
- Token verification em cada tool
- `securitySchemes` declarados nas tools

#### Opção B: Apenas Web/Inspector Local
**Foco**: Desenvolvimento local, MCP Inspector, testes rápidos

**Implica**:
- Auth mais simples (Supabase Auth)
- Session cookies
- Middleware Next.js para validação

#### Opção C: Ambos (Híbrido)
**Foco**: Máxima flexibilidade

**Implica**:
- MCP server aceita dois tipos de auth
- JWT Bearer token (ChatGPT) OU
- Session cookie (Web)
- Mais complexidade, mas mais casos de uso

**Decisão pendente**: Definir roadmap (começar web, depois ChatGPT?)

---

### 3. Token Verification no MCP Server

#### Opção A: Validação JWT per-tool (Apps SDK)
```typescript
// Em cada handler de tool
async function handleCreateHyperfocus(args, token: string) {
  const userId = await verifyJWT(token);
  // usar userId real
}
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

