# 📊 Diagramas e Fluxos - Integração Componentes + Supabase

> **Guia visual para entender a arquitetura**  
> **Use para apresentações e onboarding**

---

## 🏗️ ARQUITETURA ATUAL vs. NOVA ARQUITETURA

### Arquitetura Atual (❌ Problemas)

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO ATUAL (LENTO)                          │
└─────────────────────────────────────────────────────────────────┘

   Usuário clica                Chat Interface
   em "Completar"                    │
        │                            │
        ▼                            ▼
   ┌──────────┐              ┌──────────────┐
   │Component │─────────────▶│window.openai │
   │  (UI)    │ callTool()   │ .callTool()  │
   └──────────┘              └──────────────┘
        │                            │
        │ Aguarda...                 │
        │ (500ms - 2s)               │
        ▼                            ▼
   ┌──────────┐              ┌──────────────┐
   │ Loading  │              │   ChatGPT    │
   │  State   │              │   Process    │
   └──────────┘              └──────────────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │   MCP Tool   │
                              │  (Backend)   │
                              └──────────────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │   Supabase   │
                              │   Database   │
                              └──────────────┘
                                     │
        ┌────────────────────────────┘
        │ Resposta (500ms - 2s)
        ▼
   ┌──────────┐
   │Component │
   │ Updates  │
   └──────────┘

PROBLEMAS:
❌ Latência total: 1-4 segundos
❌ Se ChatGPT falhar, nada é salvo
❌ Usuário aguarda sem feedback
❌ Não funciona offline
```

### Nova Arquitetura (✅ Solução)

```
┌─────────────────────────────────────────────────────────────────┐
│                  NOVO FLUXO (INSTANTÂNEO)                       │
└─────────────────────────────────────────────────────────────────┘

   Usuário clica
   em "Completar"
        │
        ▼
   ┌──────────┐
   │Component │
   │  (UI)    │
   └──────────┘
        │
        │ usa hook
        ▼
   ┌──────────────┐
   │ useHyperfocus│◄──────┐
   │   useTasks   │       │
   │useSession    │       │ Optimistic Update
   └──────────────┘       │ (UI atualiza ANTES)
        │                 │
        │ direct call     │
        ▼                 │
   ┌──────────────┐       │
   │   Service    │       │
   │  (Business)  │       │
   └──────────────┘       │
        │                 │
        ▼                 │
   ┌──────────────┐       │
   │   Supabase   │       │
   │   (Direct)   │───────┘
   └──────────────┘
        │
        │ Realtime subscription
        ▼
   ┌──────────────┐
   │  Component   │
   │   Updates    │
   └──────────────┘

BENEFÍCIOS:
✅ Latência: < 200ms
✅ Persistência garantida
✅ Feedback instantâneo
✅ Funciona offline (com queue)
✅ Sincronização realtime
```

---

## 🔄 FLUXO DETALHADO: Toggle de Tarefa

### Passo a Passo com Código

```
┌─────────────────────────────────────────────────────────────────┐
│  EXEMPLO: Usuário marca tarefa como completa                   │
└─────────────────────────────────────────────────────────────────┘

ETAPA 1: Usuário Clica no Checkbox
════════════════════════════════════
   ┌────────────────┐
   │  TaskBreakdown │
   │   Component    │
   └────────────────┘
          │
          │ onClick={handleToggle}
          ▼
   
   const handleToggle = (taskId) => {
     toggleTaskComplete(taskId);
   }


ETAPA 2: Hook Faz Optimistic Update
════════════════════════════════════
   ┌────────────────┐
   │   useTasks     │
   │     Hook       │
   └────────────────┘
          │
          │ 1. Atualiza UI IMEDIATAMENTE
          ▼
   
   setTasks(prev => prev.map(t => 
     t.id === id 
       ? { ...t, completed: !t.completed }  ← UI atualiza
       : t
   ))
   
   ⏱️ Tempo decorrido: ~10ms
   ✅ Usuário VÊ mudança instantânea


ETAPA 3: Hook Persiste no Supabase
════════════════════════════════════
          │
          │ 2. Salva no banco
          ▼
   
   const supabase = createClient();
   const service = new TaskService(supabase);
   await service.update(userId, id, { 
     completed: true 
   });
   
   ⏱️ Tempo decorrido: ~10ms + 100-200ms (network)
   ✅ Dados SALVOS no Supabase


ETAPA 4: Se Falhar, Reverte UI
════════════════════════════════════
   
   Se erro:
     │
     │ 3. Reverte UI
     ▼
   
   catch (err) {
     setTasks(prev => prev.map(t => 
       t.id === id 
         ? { ...t, completed: !t.completed }  ← Volta ao estado anterior
         : t
     ))
     setError('Erro ao atualizar tarefa');
   }
   
   ⏱️ Tempo total: ~300ms (se falhar)
   ✅ Usuário VÊ erro e estado original


ETAPA 5: Realtime Sync (Opcional)
════════════════════════════════════
   
   Supabase Realtime:
     │
     │ 4. Notifica outros clients
     ▼
   
   supabase
     .channel('tasks')
     .on('postgres_changes', 
       { event: 'UPDATE', table: 'tasks' },
       payload => {
         // Atualizar UI em outros tabs/devices
       }
     )
   
   ⏱️ Latência realtime: ~50-100ms
   ✅ Sincronização automática
```

---

## 🗂️ ESTRUTURA DE ARQUIVOS

```
src/
├── lib/
│   ├── hooks/                    ← NOVO: Custom hooks
│   │   ├── useHyperfocus.ts     🆕 CRIAR
│   │   ├── useTasks.ts          🆕 CRIAR
│   │   ├── useFocusSession.ts   🆕 CRIAR
│   │   └── useRealtime.ts       🆕 CRIAR (opcional)
│   │
│   ├── services/                 ✅ JÁ EXISTE
│   │   ├── hyperfocus.service.ts
│   │   ├── task.service.ts
│   │   └── timer.service.ts
│   │
│   └── supabase/                 ✅ JÁ EXISTE
│       ├── client.ts
│       └── queries.ts
│
├── components/                   🔧 REFATORAR
│   ├── HyperfocusCard.tsx       ← Adicionar useHyperfocus
│   ├── TaskBreakdown.tsx        ← Adicionar useTasks
│   ├── FocusTimer.tsx           ← Adicionar useFocusSession
│   └── HyperfocusList.tsx       ← Adicionar realtime
│
└── app/
    ├── chat/
    │   └── page.tsx              ← Já usa componentes
    │
    └── test-hooks/               🆕 CRIAR (temporário)
        └── page.tsx              ← Para testar hooks

tests/
├── integration/                  🆕 CRIAR
│   ├── use-hyperfocus.test.ts
│   ├── use-tasks.test.ts
│   └── use-focus-session.test.ts
│
├── ui/                           🔧 EXPANDIR
│   ├── task-breakdown.test.tsx  ✅ Já existe
│   ├── hyperfocus-card.test.tsx 🆕 CRIAR
│   └── focus-timer.test.tsx     🆕 CRIAR
│
└── e2e/                          🆕 CRIAR
    └── complete-flow.test.tsx

docs/
├── GUIA-IMPLEMENTACAO-INTEGRACAO-COMPONENTES.md  ✅ Criado
├── CHECKLIST-IMPLEMENTACAO-RAPIDA.md             ✅ Criado
└── DIAGRAMAS-FLUXOS.md                           ✅ Este arquivo
```

---

## 🎯 MAPEAMENTO: Service → Hook → Component

```
┌─────────────────────────────────────────────────────────────────┐
│                      CAMADAS DA APLICAÇÃO                       │
└─────────────────────────────────────────────────────────────────┘

Layer 1: DATABASE (Supabase)
═══════════════════════════════
┌─────────────────┐
│  hyperfocus     │
│  tasks          │
│  focus_sessions │
└─────────────────┘
        ▲
        │ SQL queries
        │
Layer 2: QUERIES (queries.ts)
═══════════════════════════════
┌─────────────────┐
│ createHyperfocus│  ✅ JÁ EXISTE
│ listTasks       │
│ startSession    │
└─────────────────┘
        ▲
        │ usa
        │
Layer 3: SERVICES (Business Logic)
═══════════════════════════════════
┌─────────────────┐
│HyperfocusService│  ✅ JÁ EXISTE
│ TaskService     │
│ TimerService    │
└─────────────────┘
        ▲
        │ usa
        │
Layer 4: HOOKS (React Integration)
═══════════════════════════════════
┌─────────────────┐
│ useHyperfocus   │  🆕 CRIAR
│ useTasks        │  🆕 CRIAR
│ useFocusSession │  🆕 CRIAR
└─────────────────┘
        ▲
        │ usa
        │
Layer 5: COMPONENTS (UI)
════════════════════════
┌─────────────────┐
│ HyperfocusCard  │  🔧 REFATORAR
│ TaskBreakdown   │  🔧 REFATORAR
│ FocusTimer      │  🔧 REFATORAR
└─────────────────┘
        ▲
        │ renderiza
        │
Layer 6: PAGES (Routes)
═══════════════════════
┌─────────────────┐
│ /chat           │  ✅ JÁ EXISTE
│ /settings       │
└─────────────────┘
```

---

## 🔀 FLUXO DE DADOS: Estado e Sincronização

```
┌─────────────────────────────────────────────────────────────────┐
│           FLUXO DE DADOS BIDIRECIONAL                           │
└─────────────────────────────────────────────────────────────────┘

                    ┌─────────────┐
                    │  Supabase   │
                    │  Database   │
                    └─────────────┘
                          ▲ │
                  write   │ │ realtime
                    (1)   │ │  (4)
                          │ ▼
                    ┌─────────────┐
                    │   Service   │
                    │  (business) │
                    └─────────────┘
                          ▲ │
                          │ │
                          │ ▼
                    ┌─────────────┐
         ┌─────────▶│    Hook     │◄─────────┐
         │          │  (useState) │          │
         │          └─────────────┘          │
         │                │ │                │
    setState              │ │           useEffect
      (2)                 │ │              (5)
         │                │ ▼                │
         │          ┌─────────────┐          │
         │          │  Component  │          │
         │          │    (UI)     │          │
         │          └─────────────┘          │
         │                │                  │
         └────────────────┘                  │
            onClick (3)                      │
                                             │
                                             │
                    Outros clients/tabs ─────┘
                    (sincronização)


LEGENDA:
(1) Usuário clica → Hook salva no DB
(2) Hook atualiza estado local (useState)
(3) Component re-renderiza com novo estado
(4) Supabase Realtime notifica mudanças
(5) useEffect atualiza estado com dados realtime
```

---

## 🧪 ESTRATÉGIA DE TESTES

```
┌─────────────────────────────────────────────────────────────────┐
│                    PIRÂMIDE DE TESTES                           │
└─────────────────────────────────────────────────────────────────┘

                         ▲
                        ╱ ╲
                       ╱   ╲       E2E Tests (5%)
                      ╱     ╲      • Fluxo completo
                     ╱  E2E  ╲     • User journey
                    ╱─────────╲    • Cypress/Playwright
                   ╱           ╲   
                  ╱             ╲  
                 ╱               ╲ Integration Tests (20%)
                ╱   INTEGRATION  ╲• Hooks + Services
               ╱─────────────────╲• API calls
              ╱                   ╲• Database queries
             ╱                     ╲
            ╱                       ╲
           ╱          UNIT           ╲ Unit Tests (75%)
          ╱───────────────────────────╲• Functions puras
         ╱                             ╲• Lógica de negócio
        ╱_______________________________╲• Validações


DISTRIBUIÇÃO DE TESTES:

┌──────────────────┬─────────┬──────────────────────────┐
│      Tipo        │ Qtd.    │      O que testar        │
├──────────────────┼─────────┼──────────────────────────┤
│ Unit             │  15-20  │ • Services               │
│                  │         │ • Utilities              │
│                  │         │ • Helpers                │
├──────────────────┼─────────┼──────────────────────────┤
│ Integration      │   5-8   │ • Hooks + Supabase       │
│                  │         │ • CRUD operations        │
│                  │         │ • Error handling         │
├──────────────────┼─────────┼──────────────────────────┤
│ UI/Component     │   8-12  │ • Renderização           │
│                  │         │ • Interações             │
│                  │         │ • Props/States           │
├──────────────────┼─────────┼──────────────────────────┤
│ E2E              │   2-3   │ • Fluxo completo         │
│                  │         │ • User journey           │
│                  │         │ • Critical paths         │
└──────────────────┴─────────┴──────────────────────────┘
```

---

## 🎨 EXEMPLO VISUAL: Before/After

### ANTES: HyperfocusCard (❌ Dependente de ChatGPT)

```typescript
┌─────────────────────────────────────────────────────────────┐
│  HyperfocusCard.tsx                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  export function HyperfocusCard() {                         │
│    const toolOutput = useToolOutput();  ← Só lê dados      │
│                                                             │
│    const handleStartTimer = async () => {                  │
│      // ❌ Apenas envia mensagem para ChatGPT              │
│      await window.openai.callTool('startFocusTimer', {     │
│        hyperfocusId: hyperfocus.id                         │
│      });                                                    │
│                                                             │
│      // ❌ Espera ChatGPT chamar MCP Tool                  │
│      // ❌ Espera MCP Tool salvar no Supabase              │
│      // ❌ Espera resposta voltar                          │
│    };                                                       │
│                                                             │
│    return (                                                 │
│      <div>                                                  │
│        <button onClick={handleStartTimer}>                 │
│          Iniciar Timer                                     │
│        </button>                                            │
│      </div>                                                 │
│    );                                                       │
│  }                                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### DEPOIS: HyperfocusCard (✅ Integrado com Supabase)

```typescript
┌─────────────────────────────────────────────────────────────┐
│  HyperfocusCard.tsx                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  export function HyperfocusCard() {                         │
│    const toolOutput = useToolOutput();                     │
│    const { user } = useAuth();            ← 🆕 Auth        │
│    const { startSession } = useFocusSession(user?.id);     │
│                            ↑ 🆕 Hook para sessões          │
│                                                             │
│    const handleStartTimer = async () => {                  │
│      // ✅ Salva DIRETO no Supabase                        │
│      const session = await startSession(                   │
│        hyperfocus.id,                                      │
│        30 // minutos                                       │
│      );                                                     │
│                                                             │
│      if (!session) {                                        │
│        // ✅ Mostra erro imediatamente                     │
│        toast.error('Erro ao iniciar timer');               │
│        return;                                              │
│      }                                                      │
│                                                             │
│      // ✅ Dados já salvos!                                │
│      // ✅ UI atualiza instantaneamente                    │
│      toast.success('Timer iniciado!');                     │
│                                                             │
│      // (Opcional) Notifica ChatGPT                        │
│      window.openai?.callTool('startFocusTimer', {...});    │
│    };                                                       │
│                                                             │
│    // ✅ Loading e Error states                            │
│    if (loading) return <Spinner />;                        │
│    if (error) return <ErrorMessage error={error} />;       │
│                                                             │
│    return (                                                 │
│      <div>                                                  │
│        <button                                              │
│          onClick={handleStartTimer}                        │
│          disabled={loading}  ← ✅ Desabilita durante save │
│        >                                                    │
│          {loading ? 'Iniciando...' : 'Iniciar Timer'}      │
│        </button>                                            │
│      </div>                                                 │
│    );                                                       │
│  }                                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📈 MÉTRICAS DE SUCESSO

### KPIs para Validar Implementação

```
┌─────────────────────────────────────────────────────────────┐
│                    ANTES → DEPOIS                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Latência de Ação:                                         │
│    1-4 segundos  →  < 200ms         ✅ 95% melhoria       │
│                                                             │
│  Taxa de Sucesso:                                          │
│    70-80%  →  99.9%                 ✅ 25% melhoria       │
│                                                             │
│  Feedback ao Usuário:                                      │
│    Após 2-4s  →  Instantâneo        ✅ 100% melhoria      │
│                                                             │
│  Cobertura de Testes:                                      │
│    40%  →  80%+                     ✅ 100% aumento        │
│                                                             │
│  Dependência Externa:                                      │
│    100% ChatGPT  →  0% ChatGPT      ✅ Independente       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗺️ ROADMAP DE MELHORIAS FUTURAS

```
┌─────────────────────────────────────────────────────────────┐
│              FASES FUTURAS (Pós-Implementação)              │
└─────────────────────────────────────────────────────────────┘

FASE 5: Realtime Sync (Semana 2)
═══════════════════════════════════
├─ useRealtime hook
├─ Sincronização cross-tab
├─ Multi-device sync
└─ Conflict resolution

FASE 6: Offline Support (Semana 3)
═══════════════════════════════════
├─ Service Worker
├─ IndexedDB cache
├─ Action queue
└─ Auto-retry com exponential backoff

FASE 7: Performance (Semana 4)
═══════════════════════════════════
├─ React Query integration
├─ Caching strategy
├─ Prefetching
└─ Lazy loading

FASE 8: Advanced Features (Mês 2)
═══════════════════════════════════
├─ Undo/Redo
├─ Bulk operations
├─ Advanced filtering
└─ Data export
```

---

## 🎓 GLOSSÁRIO

```
┌─────────────────────────────────────────────────────────────┐
│                    TERMOS IMPORTANTES                       │
└─────────────────────────────────────────────────────────────┘

Optimistic Update
  Atualizar UI antes de confirmar no servidor.
  Se falhar, reverte a mudança.

Hook
  Função React que gerencia estado e efeitos.
  Ex: useState, useEffect, useHyperfocus

Service
  Classe que contém lógica de negócio.
  Ex: HyperfocusService, TaskService

Query
  Função que interage com o banco de dados.
  Ex: createHyperfocus, listTasks

MCP Tool
  Função que o ChatGPT pode chamar.
  Model Context Protocol tool.

Realtime
  Supabase feature que notifica mudanças em tempo real.
  WebSocket subscription.

E2E Test
  End-to-End test. Testa fluxo completo do usuário.

Integration Test
  Testa integração entre componentes/camadas.

Unit Test
  Testa uma função/unidade isolada.
```

---

**Última atualização:** 13 de outubro de 2025  
**Versão:** 1.0  
**Autor:** SATI Development Team
