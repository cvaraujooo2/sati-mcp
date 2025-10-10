# 🚀 SATI - Estratégia Web App/PWA

**Data:** 09/10/2025  
**Versão:** 1.0  
**Status:** 🎯 Em Planejamento

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Análise de Recursos Existentes](#análise-de-recursos-existentes)
3. [Integração com MCPJam](#integração-com-mcpjam)
4. [Arquitetura Proposta](#arquitetura-proposta)
5. [Roadmap de Implementação](#roadmap-de-implementação)
6. [Diferencial Competitivo](#diferencial-competitivo)
7. [Próximos Passos](#próximos-passos)

---

## 🎯 Visão Geral

### Objetivo

Transformar o **SATI MCP Server** em uma **aplicação web/PWA** completa, onde usuários podem:

- ✅ Inserir sua própria API key da OpenAI (BYOK - Bring Your Own Key)
- ✅ Interagir via chat conversacional com AI
- ✅ Usar todas as 10 MCP tools de forma visual
- ✅ Ter seus dados persistidos de forma segura
- ✅ Acessar offline (PWA)
- ✅ Sincronizar entre dispositivos

### Por Que Fazer Isso?

1. **Infraestrutura 90% Pronta**
   - Backend robusto com 10 MCP tools
   - Database production-ready
   - 8 componentes React implementados
   - Hooks OpenAI já existentes

2. **Modelo de Negócio Sustentável**
   - BYOK → Zero custos de API
   - Freemium viável
   - Escalável sem overhead

3. **Diferencial de Mercado**
   - Foco em neurodivergentes (ADHD/Autismo)
   - Metodologia única (hiperfoco + alternância)
   - Sem concorrentes diretos nesse nicho

4. **Experiência Superior**
   - Chat conversacional natural
   - Componentes visuais ricos
   - Offline-first
   - Multi-device sync

---

## ✅ Análise de Recursos Existentes

### O Que Já Temos (90% Pronto)

#### 1. Backend Completo

```
📂 src/lib/mcp/tools/
├── createHyperfocus.ts      (150 linhas) ✅
├── listHyperfocus.ts        (143 linhas) ✅
├── getHyperfocus.ts         (188 linhas) ✅
├── createTask.ts            (167 linhas) ✅
├── updateTaskStatus.ts      (149 linhas) ✅
├── breakIntoSubtasks.ts     (284 linhas) ✅
├── startFocusTimer.ts       (145 linhas) ✅
├── endFocusTimer.ts         (189 linhas) ✅
├── analyzeContext.ts        (292 linhas) ✅
└── createAlternancy.ts      (248 linhas) ✅

Total: 10 tools implementadas e testadas
```

**Features:**
- ✅ Validação Zod completa
- ✅ Error handling robusto
- ✅ Type-safety end-to-end
- ✅ Metadata OpenAI Apps SDK compliant
- ✅ Score 5/5 nas diretrizes OpenAI

#### 2. Services Layer

```
📂 src/lib/services/
├── hyperfocus.service.ts    (147 linhas) ✅
├── task.service.ts          (255 linhas) ✅
├── timer.service.ts         (212 linhas) ✅
├── auth.service.ts          (231 linhas) ✅
└── context.service.ts       (268 linhas) ✅

Total: 5 services com lógica de negócio
```

**Features:**
- ✅ CRUD completo
- ✅ Business logic encapsulada
- ✅ Validações de negócio
- ✅ Estatísticas e analytics

#### 3. Database Production-Ready

```sql
-- Schema V2.0
📄 supabase/schema-v2-production.sql (562 linhas)

Estrutura:
├── 6 tabelas principais
├── 25+ índices otimizados
├── 6 RLS policies completas
├── 3 functions helper
├── 3 triggers automáticos
└── 1 view de analytics
```

**Features:**
- ✅ PostgreSQL com constraints robustas
- ✅ RLS para segurança
- ✅ Índices otimizados para queries reais
- ✅ Foreign keys com CASCADE
- ✅ Triggers para automação

#### 4. Componentes React

```
📂 src/components/
├── HyperfocusCard.tsx       ✅
├── HyperfocusList.tsx       ✅
├── TaskBreakdown.tsx        ✅
├── SubtaskSuggestions.tsx   ✅
├── FocusTimer.tsx           ✅ (fullscreen)
├── FocusSessionSummary.tsx  ✅
├── ContextAnalysis.tsx      ✅
└── AlternancyFlow.tsx       ✅

Total: 8 componentes prontos
```

**Features:**
- ✅ OpenAI Apps SDK compliant
- ✅ Display modes (inline/fullscreen/pip)
- ✅ Widget state persistente
- ✅ Theme-aware (light/dark)
- ✅ Mobile-friendly (safe area)

#### 5. Hooks OpenAI

```typescript
// src/components/hooks/useOpenAi.ts (208 linhas)

Hooks implementados:
✅ useToolInput<T>()
✅ useToolOutput<T>()
✅ useToolResponseMetadata<T>()
✅ useWidgetState<T>()
✅ useTheme()
✅ useDisplayMode()
✅ useMaxHeight()
✅ useUserAgent()
✅ useSafeArea()

Baseado em window.openai API oficial
```

#### 6. MCP Server

```
📄 mcp-server.mjs (funcional via STDIO)
📄 src/app/mcp/route.ts (Next.js API endpoint)

Features:
✅ Tool discovery
✅ Tool execution
✅ Error handling
✅ Performance logging
✅ Auth middleware
```

#### 7. Simulador Base

```
📄 src/app/mcp-simulator/page.tsx

Features atuais:
✅ Chat interface básica
✅ Message list
✅ Tool rendering
✅ Componentes inline

→ BASE PERFEITA PARA CHAT REAL!
```

---

## 💎 Integração com MCPJam

### Contexto

O **MCPJam Inspector** é uma ferramenta open-source para testar MCP servers. Como é código aberto, podemos aproveitar partes úteis.

**Repositório:** https://github.com/mcpjam/inspector

### O Que Podemos Aproveitar

#### 1. 🎨 UI/UX do Chat

**Eles têm:**
- Layout de chat limpo e profissional
- Bubble messages com estilos polidos
- Markdown rendering com syntax highlighting
- Animações suaves de mensagens

**Podemos pegar:**
- ✅ Estilos CSS/Tailwind do chat
- ✅ Layout responsivo (mobile-first)
- ✅ Animações de entrada/saída
- ✅ Estrutura de componentes

**Adaptar para:**
- ⚠️ Design ADHD-friendly (cores, contraste, foco)
- ⚠️ Componentes customizados (nossos são únicos)

#### 2. 🔄 Streaming Implementation

**Eles têm:**
- OpenAI SDK com streaming
- Parse de chunks em tempo real
- Detecção de tool calls
- Buffer de mensagens
- Error recovery

**Podemos pegar:**
- ✅ Lógica de streaming (referência)
- ✅ Parser de tool calls
- ✅ Buffer strategy
- ✅ Error handling patterns

**Adaptar para:**
- ⚠️ Integração com nosso backend
- ⚠️ Nossos 10 tools específicos

#### 3. 📋 Settings UI

**Eles têm:**
- Settings modal/page
- API key input
- Theme toggle
- Model selection

**Podemos pegar:**
- ✅ Layout da settings page
- ✅ Input components
- ✅ Validation feedback UI

**Expandir com:**
- ⚠️ Preferências ADHD (sons, notificações)
- ⚠️ Configurações de alternância
- ⚠️ Customização visual

#### 4. 🎯 Tool Invocation UI

**Eles têm:**
- Loading states visuais
- Tool call indicators
- Error messages com retry

**Podemos pegar:**
- ✅ Loading spinners
- ✅ Tool badges/tags
- ✅ Error toast/alert components

**Nossos já são melhores:**
- ✅ Componentes customizados
- ✅ Renderização rich (cards, timers)

#### 5. 📱 Responsive Layout

**Eles têm:**
- Mobile-first design
- Sidebar collapse
- Touch-friendly buttons
- Responsive breakpoints

**Podemos pegar:**
- ✅ Breakpoints Tailwind
- ✅ Mobile menu pattern
- ✅ Touch gestures

**Expandir para:**
- ⚠️ PWA features (offline, install)
- ⚠️ Notificações push

### 🚫 O Que NÃO Usar do MCPJam

#### 1. ❌ API Key Storage (Inseguro)

**MCPJam:**
```javascript
// ❌ Inseguro - salva no localStorage
localStorage.setItem('openai_key', apiKey);
```

**Nossa solução (MELHOR):**
```sql
-- ✅ Seguro - Supabase Vault encrypted
CREATE TABLE user_api_keys (
  user_id UUID REFERENCES auth.users(id),
  encrypted_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. ❌ No User Authentication

**MCPJam:**
- Sem login/contas
- Sem ownership de dados
- Tudo local

**Nossa solução:**
- ✅ Supabase Auth completo
- ✅ Email + OAuth
- ✅ RLS policies
- ✅ Multi-device sync

#### 3. ❌ No Data Persistence

**MCPJam:**
- Dados só em memória
- Perde tudo ao recarregar
- Sem histórico

**Nossa solução:**
- ✅ PostgreSQL persistente
- ✅ Histórico completo
- ✅ Analytics
- ✅ Backup automático

#### 4. ❌ Generic Design

**MCPJam:**
- Design genérico para desenvolvedores
- Sem foco em acessibilidade específica

**Nossa solução:**
- ✅ Design ADHD-friendly
- ✅ Cores cuidadosas
- ✅ Redução de distrações
- ✅ Foco em neurodivergentes

#### 5. ❌ No Offline Mode

**MCPJam:**
- Só funciona online
- Sem service worker
- Sem cache

**Nossa solução:**
- ✅ PWA completo
- ✅ Offline-first
- ✅ Background sync
- ✅ Cache strategies

---

## 🏗️ Arquitetura Proposta

### Stack Técnico

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                     🌐 SATI WEB/PWA                             │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                                                           │ │
│  │  CAMADA 1: Frontend (Next.js 15 + React 19)              │ │
│  │                                                           │ │
│  │  ┌──────────────────┐  ┌──────────────────┐             │ │
│  │  │  Chat Interface  │  │  Components      │             │ │
│  │  │                  │  │                  │             │ │
│  │  │  • User input    │  │  • HyperfocusCard│             │ │
│  │  │  • Streaming     │  │  • FocusTimer    │             │ │
│  │  │  • Tool calls    │  │  • TaskBreakdown │             │ │
│  │  │  • Markdown      │  │  • + 5 outros    │             │ │
│  │  └──────────────────┘  └──────────────────┘             │ │
│  │                                                           │ │
│  │  Base: src/app/mcp-simulator/page.tsx                    │ │
│  │  Hooks: src/components/hooks/useOpenAi.ts                │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                               ↕                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                                                           │ │
│  │  CAMADA 2: API Layer (Next.js API Routes)                │ │
│  │                                                           │ │
│  │  📄 /api/chat                                             │ │
│  │     • Recebe mensagens do usuário                        │ │
│  │     • Busca API key (Supabase Vault)                     │ │
│  │     • Chama OpenAI com streaming                         │ │
│  │     • Detecta tool calls                                 │ │
│  │     • Executa MCP tools                                  │ │
│  │     • Retorna resposta + componentes                     │ │
│  │                                                           │ │
│  │  📄 /api/mcp (já existe!)                                │ │
│  │     • Tool discovery                                     │ │
│  │     • Tool execution                                     │ │
│  │                                                           │ │
│  │  📄 /api/auth (Supabase)                                 │ │
│  │     • Login/Signup                                       │ │
│  │     • OAuth callbacks                                    │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                               ↕                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                                                           │ │
│  │  CAMADA 3: MCP Tools (já implementado!)                  │ │
│  │                                                           │ │
│  │  • 10 tools funcionais                                   │ │
│  │  • Services + Queries otimizadas                         │ │
│  │  • Type-safe end-to-end                                  │ │
│  │  • Error handling robusto                                │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                               ↕                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                                                           │ │
│  │  CAMADA 4: Supabase (já configurado!)                    │ │
│  │                                                           │ │
│  │  • PostgreSQL com RLS                                    │ │
│  │  • Auth (email + OAuth)                                  │ │
│  │  • Vault (API keys encrypted)                            │ │
│  │  • Realtime subscriptions                                │ │
│  │  • Storage (futuro)                                      │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Dependências Necessárias

```json
{
  "dependencies": {
    "openai": "^4.x",              // ⭕ Adicionar
    "ai": "^3.x",                  // ⭕ Adicionar (Vercel AI SDK)
    "react-markdown": "^9.x",      // ⭕ Adicionar
    "remark-gfm": "^4.x",          // ⭕ Adicionar
    "date-fns": "^3.x",            // ⭕ Adicionar
    "@dnd-kit/core": "^6.x",       // ⭕ Adicionar (drag & drop)
    
    // Já temos:
    "next": "^15.x",               // ✅ Instalado
    "react": "^19.x",              // ✅ Instalado
    "@supabase/supabase-js": "^2.x", // ✅ Instalado
    "zod": "^3.x",                 // ✅ Instalado
    "tailwindcss": "^3.x"          // ✅ Instalado
  }
}
```

---

## 🚀 Roadmap de Implementação

### Fase 1: MVP Core (3-4 dias)

**Objetivo:** Chat funcional com OpenAI + MCP tools

#### Dia 1: Setup & Chat Interface

**Tempo estimado:** 6-8 horas

**Tasks:**
1. ⭕ Instalar dependências
   ```bash
   npm install openai ai react-markdown remark-gfm date-fns
   ```

2. ⭕ Criar estrutura de pastas
   ```
   src/
   ├── components/
   │   └── chat/
   │       ├── ChatInterface.tsx
   │       ├── Message.tsx
   │       ├── MessageList.tsx
   │       └── ChatInput.tsx
   ├── lib/
   │   └── chat/
   │       ├── streaming.ts
   │       └── types.ts
   └── app/
       └── api/
           └── chat/
               └── route.ts
   ```

3. ⭕ Implementar API route `/api/chat`
   - Integração OpenAI SDK
   - Streaming responses
   - Tool call detection
   - Error handling

4. ⭕ Criar componentes de chat
   - ChatInterface (base do mcp-simulator)
   - Message (markdown + componentes)
   - MessageList (scroll + virtualization)
   - ChatInput (textarea auto-resize)

**Entregável:**
✅ Chat funcional com streaming
✅ Renderização de markdown
✅ Componentes inline (nossos 8)

#### Dia 2: API Key Management

**Tempo estimado:** 4-5 horas

**Tasks:**
1. ⭕ Criar migration de API keys
   ```sql
   -- supabase/migrations/add_api_keys.sql
   CREATE TABLE user_api_keys (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     encrypted_key TEXT NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     last_used_at TIMESTAMPTZ,
     UNIQUE(user_id)
   );
   ```

2. ⭕ Implementar ApiKeyService
   - Salvar key (Supabase Vault)
   - Buscar key (decrypt)
   - Validar key (test OpenAI)
   - Revogar key

3. ⭕ Criar Settings page
   - Input de API key
   - Test connection button
   - Status indicator
   - Instruções (como obter key)

4. ⭕ Onboarding de API key
   - Welcome screen
   - Step-by-step guide
   - Link para OpenAI
   - Validação em tempo real

**Entregável:**
✅ API key storage seguro
✅ Settings page funcional
✅ Onboarding guiado

#### Dia 3: Layout & Dashboard

**Tempo estimado:** 6-7 horas

**Tasks:**
1. ⭕ Criar app layout
   ```
   src/app/(authenticated)/
   ├── layout.tsx
   ├── dashboard/
   │   └── page.tsx
   ├── chat/
   │   └── page.tsx
   └── settings/
       └── page.tsx
   ```

2. ⭕ Implementar Sidebar
   - Navegação principal
   - User menu
   - Hiperfocos recentes
   - Collapse/expand

3. ⭕ Implementar Header
   - Breadcrumbs
   - Search (futuro)
   - Notificações (futuro)
   - User avatar + menu

4. ⭕ Dashboard page
   - Overview de hiperfocos
   - Estatísticas rápidas
   - Sessões recentes
   - Quick actions

**Entregável:**
✅ Layout completo
✅ Navegação funcional
✅ Dashboard com overview

#### Dia 4: Auth & Polish

**Tempo estimado:** 5-6 horas

**Tasks:**
1. ⭕ Criar auth pages
   - Login (email + password)
   - Signup
   - Forgot password
   - OAuth (Google) - opcional

2. ⭕ Integrar chat com MCP tools
   - Tool call execution
   - Component rendering
   - Error feedback
   - Loading states

3. ⭕ Polish & fixes
   - Responsive mobile
   - Dark mode
   - Loading states
   - Error boundaries

4. ⭕ README & docs
   - Setup instructions
   - Environment variables
   - Deploy guide

**Entregável:**
✅ Auth completo
✅ MVP funcional end-to-end
✅ Pronto para testes

---

### Fase 2: Features Avançadas (1-2 semanas)

**Objetivo:** PWA + Features premium

#### Features

1. ⭕ PWA Configuration
   - Service worker
   - Offline mode
   - Install prompt
   - Cache strategies

2. ⭕ Hyperfocus Detail Page
   - Lista de tasks (drag & drop)
   - Timer integration
   - Chat contextual
   - Estatísticas

3. ⭕ Notificações Push
   - Timer alerts
   - Daily reminders
   - Achievement notifications

4. ⭕ Analytics Dashboard
   - Tempo de foco
   - Tasks completadas
   - Streaks
   - Gráficos

5. ⭕ Onboarding Interativo
   - Tutorial guiado
   - Primeiro hiperfoco
   - Tooltips contextuais

---

### Fase 3: Launch (1 semana)

**Objetivo:** Beta testing + Launch público

#### Tasks

1. ⭕ Beta Privado
   - Convidar 20-50 users
   - Coletar feedback
   - Iterar rapidamente

2. ⭕ Landing Page
   - Hero section
   - Features showcase
   - Pricing (se aplicável)
   - FAQ

3. ⭕ SEO & Marketing
   - Meta tags
   - OpenGraph
   - Sitemap
   - Submit to ProductHunt

4. ⭕ Deploy Production
   - Vercel
   - Supabase Production
   - Domain setup
   - Analytics

---

## 🎯 Diferencial Competitivo

### SATI vs MCPJam

| Feature | MCPJam | SATI |
|---------|--------|------|
| **Chat Interface** | ✅ | ✅ |
| **Tool Calls** | ✅ | ✅ |
| **Streaming** | ✅ | ✅ |
| **User Auth** | ❌ | ✅ Supabase |
| **Secure API Keys** | ❌ localStorage | ✅ Vault encrypted |
| **Data Persistence** | ❌ | ✅ PostgreSQL |
| **Offline Mode** | ❌ | ✅ PWA |
| **ADHD-specific** | ❌ | ✅ Core feature |
| **Custom Components** | ❌ | ✅ 8 ready |
| **Analytics** | ❌ | ✅ |
| **Multi-device Sync** | ❌ | ✅ |
| **Notifications** | ❌ | ✅ |
| **Alternância Flow** | ❌ | ✅ Único |

### SATI vs Concorrentes

**Notion AI / ClickUp Brain:**
- ❌ Genéricos (não focados em ADHD)
- ❌ Sem metodologia de alternância
- ❌ Sem timer Pomodoro integrado
- ✅ SATI é especializado

**Apps ADHD (Tiimo, Focus@Will):**
- ❌ Sem AI conversacional
- ❌ Sem breakdown inteligente
- ❌ Sem análise de contexto
- ✅ SATI combina os dois

---

## 📊 Modelo de Negócio

### Freemium (Recomendado)

#### FREE Tier
- ✅ BYOK (traz sua API key OpenAI)
- ✅ Até 3 hiperfocos ativos
- ✅ 50 tasks por hyperfocus
- ✅ Estatísticas básicas
- ✅ Timer Pomodoro

#### PRO ($9.99/mês)
- ✅ Hiperfocos ilimitados
- ✅ Tasks ilimitadas
- ✅ Analytics avançado
- ✅ Templates premium
- ✅ Temas customizados
- ✅ Prioridade no suporte
- ✅ Alternância avançada

#### TEAM ($29.99/mês)
- ✅ Tudo do PRO
- ✅ Múltiplos usuários
- ✅ Compartilhamento
- ✅ Admin dashboard
- ✅ API access

---

## 📝 Próximos Passos

### Imediato (Esta Semana)

1. ✅ **Documentar estratégia** (este doc)
2. ⭕ **Decidir sobre início da implementação**
3. ⭕ **Instalar dependências**
4. ⭕ **Começar Fase 1 - Dia 1**

### Curto Prazo (2-3 semanas)

1. ⭕ **Completar MVP Core**
2. ⭕ **Beta testing interno**
3. ⭕ **Ajustes baseados em feedback**

### Médio Prazo (1-2 meses)

1. ⭕ **Features avançadas (PWA, notificações)**
2. ⭕ **Beta público (20-50 users)**
3. ⭕ **Landing page + marketing**
4. ⭕ **Launch público**

### Longo Prazo (3-6 meses)

1. ⭕ **Iteração baseada em feedback**
2. ⭕ **Features premium**
3. ⭕ **Mobile app nativo (opcional)**
4. ⭕ **B2B/Enterprise features**

---

## 🎉 Conclusão

### Por Que Isso Vai Funcionar

1. **✅ 90% Pronto**
   - Backend implementado
   - Database configurado
   - Componentes prontos
   - Hooks existentes

2. **✅ Diferencial Claro**
   - Foco em neurodivergentes
   - Metodologia única
   - AI-powered
   - BYOK (sem lock-in)

3. **✅ Viabilidade Técnica**
   - Stack moderno
   - Code reuse
   - MCPJam como referência
   - Supabase free tier generoso

4. **✅ Modelo Sustentável**
   - BYOK = zero custos de API
   - Freemium escalável
   - B2C e B2B potential

### Estimativa Final

**Tempo para MVP funcional:** 3-4 dias de trabalho focado  
**Tempo para Beta público:** 2-3 semanas  
**Tempo para Launch:** 1-2 meses  

---

**Documentado por:** AI Assistant  
**Última atualização:** 09/10/2025  
**Próxima revisão:** Após implementação do MVP

---

## 📚 Referências

- [OpenAI Apps SDK](https://developers.openai.com/apps-sdk)
- [MCPJam Inspector](https://github.com/mcpjam/inspector)
- [Supabase Docs](https://supabase.com/docs)
- [Next.js 15](https://nextjs.org/docs)
- [docs/changelog/BACKEND-COMPLETO.md](../changelog/BACKEND-COMPLETO.md)
- [docs/changelog/MELHORIAS-METADATA-IMPLEMENTADAS.md](../changelog/MELHORIAS-METADATA-IMPLEMENTADAS.md)
- [docs/core/PRD-MCP-SATI.md](./PRD-MCP-SATI.md)

