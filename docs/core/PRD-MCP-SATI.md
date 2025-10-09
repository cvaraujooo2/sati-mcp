# PRD - MCP Sati
## Product Requirements Document

**Versão:** 1.0  
**Data:** 08 de Outubro de 2025  
**Autor:** Equipe Sati  
**Status:** Draft Inicial  

---

## 📋 Sumário Executivo

**Sati** é um aplicativo MCP (Model Context Protocol) para ChatGPT que ajuda pessoas neurodivergentes a organizar e gerenciar seus hiperfocos, transformando conversas caóticas em estruturas acionáveis de tarefas e projetos.

### Problema
Pessoas neurodivergentes (TDAH, autismo, etc.) frequentemente experimentam hiperfocos intensos em múltiplos interesses simultaneamente, resultando em:
- Sobrecarga cognitiva ao tentar gerenciar tudo mentalmente
- Perda de progresso ao mudar entre contextos
- Dificuldade em quebrar interesses em passos acionáveis
- Frustração com ferramentas de produtividade tradicionais que não entendem seu workflow

### Solução
Sati detecta quando o usuário está mencionando múltiplos interesses ou projetos no ChatGPT e automaticamente:
1. Estrutura cada hiperfoco em um projeto claro
2. Decompõe em subtarefas gerenciáveis
3. Oferece sistema de alternância para minimizar impacto de mudança de contexto
4. Mantém timer de foco adaptável às necessidades do usuário
5. Persiste todo o contexto para retomada posterior

### Visão de Produto
"Transformar o ChatGPT no assistente definitivo para gerenciamento de hiperfocos neurodivergentes"

---

## 🎯 Objetivos do Produto

### Objetivos de Negócio
1. **Lançamento:** Ser aceito no diretório de apps ChatGPT até Q1 2026
2. **Adoção:** Alcançar 1.000 usuários ativos nos primeiros 3 meses
3. **Engajamento:** 60% dos usuários retornam semanalmente
4. **Validação:** NPS > 50 com comunidade neurodivergente

### Objetivos de Usuário
1. Reduzir tempo de organização mental de ideias em 70%
2. Aumentar taxa de conclusão de tarefas em hiperfocos em 40%
3. Diminuir ansiedade relacionada a múltiplos interesses simultâneos
4. Facilitar retomada de hiperfocos pausados sem perda de contexto

---

## 👥 Personas

### Persona Primária: "Alex, o Multifocado"
- **Idade:** 28 anos
- **Neurodivergência:** TDAH + Autismo (AuDHD)
- **Ocupação:** Desenvolvedor full-stack freelancer
- **Comportamento:**
  - Tem 5-8 projetos/interesses simultâneos ativos
  - Hiperfoca intensamente por 2-6 horas, depois muda
  - Usa ChatGPT para brainstorming, learning, coding
  - Frustrado com Notion/Trello (muito overhead de organização)
- **Necessidades:**
  - Capturar ideias rapidamente sem sair do fluxo
  - Ver estrutura visual dos hiperfocos
  - Alternar entre contextos sem perder progresso
  - Timer que respeita hiperfoco (não interrompe bruscamente)

### Persona Secundária: "Maria, a Exploradora Criativa"
- **Idade:** 35 anos
- **Neurodivergência:** TDAH
- **Ocupação:** Designer e artista digital
- **Comportamento:**
  - Hiperfocos em técnicas artísticas, tools, projetos clientes
  - Usa ChatGPT para aprender novas ferramentas e obter feedback
  - Precisa de lembretes gentis sobre deadlines
- **Necessidades:**
  - Visualização criativa/colorida de projetos
  - Sistema que entenda ciclos de energia criativa
  - Integração com workflow de pesquisa no ChatGPT

---

## 🎨 Funcionalidades

### Core Features (MVP)

#### F1: Análise Automática de Contexto
**Descrição:** Sati analisa a conversa atual e identifica automaticamente quando o usuário está mencionando múltiplos interesses ou projetos.

**User Story:**
> Como usuário neurodivergente, quando eu estiver conversando sobre vários interesses no ChatGPT, quero que Sati detecte e sugira estruturar esses interesses em hiperfocos, para que eu não precise me preocupar em organizar manualmente.

**Critérios de Aceitação:**
- [ ] Detecta 2+ interesses/projetos mencionados na conversa
- [ ] Identifica palavras-chave relacionadas a tarefas ("quero aprender", "preciso fazer", "tenho que")
- [ ] Oferece sugestão de estruturação sem ser intrusivo
- [ ] Funciona em português e inglês

**Discovery Metadata:**
```json
{
  "name": "analyzeContext",
  "description": "Use when user mentions multiple projects, interests, or tasks and seems overwhelmed or needs help organizing their thoughts. Ideal for neurodivergent users managing hyperfocus areas.",
  "_meta": {
    "readOnly": true,
    "confidence": "high"
  }
}
```

---

#### F2: Criação de Hiperfocos
**Descrição:** Permite criar e estruturar um novo hiperfoco a partir de um interesse identificado.

**User Story:**
> Como usuário, quando eu confirmar que quero organizar meus interesses, quero criar um hiperfoco com título, descrição e cor personalizada, para que eu possa categorizar visualmente meus projetos.

**Critérios de Aceitação:**
- [ ] Cria hiperfoco com título (obrigatório)
- [ ] Aceita descrição opcional
- [ ] Permite escolher cor (8 opções padrão)
- [ ] Gera ID único e persistente
- [ ] Retorna componente visual de confirmação
- [ ] Salva no Supabase vinculado ao usuário autenticado

**UI Component:** `HyperfocusCard` (inline)

**Tool Schema:**
```typescript
{
  name: "createHyperfocus",
  description: "Creates a new hyperfocus area to help the user organize an intense interest or project. Use when user wants to structure a specific topic they're passionate about.",
  inputSchema: {
    type: "object",
    properties: {
      title: { type: "string", description: "Short, clear title for the hyperfocus" },
      description: { type: "string", description: "Optional details about what this hyperfocus involves" },
      color: { 
        type: "string", 
        enum: ["red", "green", "blue", "orange", "purple", "brown", "gray"],
        default: "blue"
      },
      estimatedTime: { type: "number", description: "Optional time limit in minutes" }
    },
    required: ["title"]
  },
  _meta: { readOnly: false, requiresConfirmation: true }
}
```

---

#### F3: Decomposição em Subtarefas
**Descrição:** Quebra um hiperfoco em subtarefas específicas e gerenciáveis.

**User Story:**
> Como usuário, quando eu criar um hiperfoco, quero que ele seja automaticamente decomposto em subtarefas claras e acionáveis, para que eu não fique paralisado pelo escopo do projeto.

**Critérios de Aceitação:**
- [ ] Gera 3-7 subtarefas por hiperfoco
- [ ] Tarefas são específicas e acionáveis (verbos de ação)
- [ ] Permite adicionar/editar/remover tarefas
- [ ] Mostra progresso visual (X de Y completas)
- [ ] Persiste estado de conclusão

**UI Component:** `TaskBreakdown` (inline card)

---

#### F4: Temporizador de Foco
**Descrição:** Timer personalizável que respeita o ritmo de hiperfoco do usuário.

**User Story:**
> Como usuário em hiperfoco, quero um timer que me lembre gentilmente de fazer pausas sem interromper meu fluxo abruptamente, para que eu mantenha saúde mental e produtividade.

**Critérios de Aceitação:**
- [ ] Timer configurável (5-120 minutos)
- [ ] Som de alarme customizável ou vibração
- [ ] Opção "continuar por +15min" quando timer termina
- [ ] Não interrompe processo do ChatGPT
- [ ] Funciona em background (web e mobile)
- [ ] Salva histórico de sessões de foco

**UI Component:** `FocusTimer` (fullscreen modal)

**Design Especial:**
- Modo "gentle end": fade gradual de cor/som em vez de alarme abrupto
- Opção "deep focus": sem notificações, apenas indicador visual discreto

---

#### F5: Sistema de Alternância
**Descrição:** Gerencia transições suaves entre diferentes hiperfocos.

**User Story:**
> Como usuário que precisa mudar entre hiperfocos, quero um sistema que me ajude a fazer essa transição preservando o contexto de onde parei, para que eu possa retomar sem perder o fio da meada.

**Critérios de Aceitação:**
- [ ] Lista hiperfocos disponíveis
- [ ] Mostra último estado de cada um
- [ ] Permite criar "sessão de alternância" com 2+ hiperfocos
- [ ] Sugere tempo de transição (5min de pausa entre mudanças)
- [ ] Salva snapshot do contexto ao pausar
- [ ] Restaura contexto ao retomar

**UI Component:** `AlternancyManager` (inline card)

---

### Future Features (Pós-MVP)

#### F6: Energia e Spoons Tracking
- Sistema para rastrear nível de energia cognitiva
- Sugere hiperfocos baseado em energia disponível
- Integração com "spoon theory"

#### F7: Padrões de Hiperfoco
- Aprende padrões individuais (quando você hiperfoca em quê)
- Sugere melhores horários para cada tipo de hiperfoco
- Analytics de produtividade personalizado

#### F8: Integração com Calendário
- Bloqueia tempo para hiperfocos no Google Calendar
- Considera compromissos ao sugerir sessões de foco

#### F9: Modo Colaborativo
- Compartilha hiperfocos com accountability partner
- Co-working virtual em hiperfocos

---

## 🏗️ Arquitetura Técnica

### Stack Tecnológica

**Frontend (MCP Components)**
- **Framework:** React 18+ com TypeScript
- **Build:** Vite para bundle rápido dos componentes
- **Styling:** Tailwind CSS (alinhado com design system ChatGPT)
- **State:** Zustand para estado local dos componentes

**Backend (MCP Server)**
- **Runtime:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **MCP Library:** `@modelcontextprotocol/sdk`
- **Validação:** Zod para schemas

**Database & Auth**
- **BaaS:** Supabase
  - PostgreSQL para dados persistentes
  - Auth com OAuth (Google, GitHub)
  - Realtime subscriptions
  - Row Level Security (RLS)

**Hosting**
- **App:** Vercel (Next.js native hosting)
- **Database:** Supabase Cloud
- **CDN:** Vercel Edge Network para componentes

### Arquitetura de Dados

#### Database Schema (Supabase)

```sql
-- Usuários (gerenciado pelo Supabase Auth)
-- Extends auth.users automaticamente

-- Hiperfocos
CREATE TABLE hyperfocus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT 'blue',
  estimated_time_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  archived BOOLEAN DEFAULT FALSE
);

-- Tarefas
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hyperfocus_id UUID REFERENCES hyperfocus(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  order_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Sessões de Foco
CREATE TABLE focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hyperfocus_id UUID REFERENCES hyperfocus(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  planned_duration_minutes INTEGER,
  actual_duration_minutes INTEGER,
  interrupted BOOLEAN DEFAULT FALSE
);

-- Sessões de Alternância
CREATE TABLE alternancy_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  active BOOLEAN DEFAULT TRUE
);

CREATE TABLE alternancy_hyperfocus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alternancy_session_id UUID REFERENCES alternancy_sessions(id) ON DELETE CASCADE,
  hyperfocus_id UUID REFERENCES hyperfocus(id) ON DELETE CASCADE,
  order_index INTEGER,
  duration_minutes INTEGER
);

-- Contexto salvo (snapshot ao pausar)
CREATE TABLE hyperfocus_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hyperfocus_id UUID REFERENCES hyperfocus(id) ON DELETE CASCADE,
  context_data JSONB, -- Armazena estado do componente
  saved_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE hyperfocus ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alternancy_sessions ENABLE ROW LEVEL SECURITY;

-- Policies (usuários só veem seus próprios dados)
CREATE POLICY "Users can view own hyperfocus" ON hyperfocus
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own hyperfocus" ON hyperfocus
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own hyperfocus" ON hyperfocus
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own hyperfocus" ON hyperfocus
  FOR DELETE USING (auth.uid() = user_id);

-- Similar policies para outras tabelas...
```

---

## 🔧 Especificação de Tools MCP

### Tool 1: `analyzeContext`

**Tipo:** Read-only  
**Propósito:** Analisa snippets da conversa e identifica potenciais hiperfocos  

```typescript
{
  name: "analyzeContext",
  description: "Analyzes the current conversation to identify potential hyperfocus areas. Use when user mentions multiple projects, interests, or tasks that could benefit from structure. Perfect for neurodivergent users who need help organizing their thoughts.",
  inputSchema: {
    type: "object",
    properties: {
      conversationSnippets: {
        type: "array",
        items: { type: "string" },
        description: "Relevant messages from the conversation mentioning interests or tasks"
      },
      userIntent: {
        type: "string",
        description: "What the user seems to be trying to accomplish",
        optional: true
      }
    },
    required: ["conversationSnippets"]
  },
  outputSchema: {
    type: "object",
    properties: {
      identifiedHyperfocus: {
        type: "array",
        items: {
          type: "object",
          properties: {
            suggestedTitle: { type: "string" },
            confidence: { type: "number" },
            keywords: { type: "array", items: { type: "string" } }
          }
        }
      },
      recommendation: { type: "string" }
    }
  },
  _meta: {
    readOnly: true,
    component: {
      type: "inline",
      name: "AnalysisResult"
    }
  }
}
```

**Comportamento:**
1. Recebe snippets do modelo
2. Usa NLP simples para detectar padrões ("quero", "preciso", "vou", "tenho que")
3. Agrupa por tema/domínio
4. Retorna sugestões estruturadas
5. Renderiza card com análise visual

---

### Tool 2: `createHyperfocus`

**Tipo:** Write (requer confirmação)  
**Propósito:** Cria novo hiperfoco estruturado  

```typescript
{
  name: "createHyperfocus",
  description: "Creates a new hyperfocus project to help organize an intense interest. Use after analyzing context or when user explicitly wants to structure a specific topic.",
  inputSchema: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "Clear, concise title (e.g., 'Learn React Hooks', 'Compose Symphony No. 1')"
      },
      description: {
        type: "string",
        description: "Optional details about what this hyperfocus involves"
      },
      color: {
        type: "string",
        enum: ["red", "green", "blue", "orange", "purple", "brown", "gray", "pink"],
        default: "blue",
        description: "Color for visual categorization"
      },
      estimatedTimeMinutes: {
        type: "number",
        description: "How long user expects to spend (optional)",
        minimum: 5,
        maximum: 480
      }
    },
    required: ["title"]
  },
  outputSchema: {
    type: "object",
    properties: {
      hyperfocusId: { type: "string" },
      title: { type: "string" },
      createdAt: { type: "string" },
      taskCount: { type: "number" }
    }
  },
  _meta: {
    readOnly: false,
    requiresConfirmation: true,
    component: {
      type: "inline",
      name: "HyperfocusCard"
    }
  }
}
```

**Fluxo:**
1. Usuário confirma criação via ChatGPT UI
2. Sati cria registro no Supabase
3. Retorna structured content + component
4. Renderiza HyperfocusCard inline com detalhes

---

### Tool 3: `breakIntoSubtasks`

**Tipo:** Write  
**Propósito:** Decompõe hiperfoco em subtarefas acionáveis  

```typescript
{
  name: "breakIntoSubtasks",
  description: "Breaks down a hyperfocus into manageable, specific subtasks. Use after creating a hyperfocus or when user needs help making a project actionable.",
  inputSchema: {
    type: "object",
    properties: {
      hyperfocusId: {
        type: "string",
        description: "ID of the hyperfocus to break down"
      },
      suggestedTasks: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            estimatedMinutes: { type: "number" }
          }
        },
        description: "List of suggested tasks with action verbs",
        minItems: 3,
        maxItems: 8
      }
    },
    required: ["hyperfocusId", "suggestedTasks"]
  },
  _meta: {
    readOnly: false,
    requiresConfirmation: true
  }
}
```

**Regras de Negócio:**
- Mínimo 3 tarefas, máximo 8 (evitar sobrecarga)
- Cada tarefa deve começar com verbo de ação
- Tarefas devem ser específicas, não vagas
- Ordenadas por dependência lógica

---

### Tool 4: `startFocusTimer`

**Tipo:** Write  
**Propósito:** Inicia sessão de foco temporizada  

```typescript
{
  name: "startFocusTimer",
  description: "Starts a focus timer session for a specific hyperfocus. Helps neurodivergent users maintain healthy work patterns with gentle reminders.",
  inputSchema: {
    type: "object",
    properties: {
      hyperfocusId: {
        type: "string",
        description: "Which hyperfocus to focus on"
      },
      durationMinutes: {
        type: "number",
        description: "How long to focus (recommended: 25-45 min for ADHD)",
        default: 30,
        minimum: 5,
        maximum: 120
      },
      alarmSound: {
        type: "string",
        enum: ["gentle-bell", "soft-chime", "vibrate", "none"],
        default: "gentle-bell"
      },
      gentleEnd: {
        type: "boolean",
        description: "Fade out gradually instead of abrupt alarm",
        default: true
      }
    },
    required: ["hyperfocusId"]
  },
  _meta: {
    readOnly: false,
    component: {
      type: "fullscreen",
      name: "FocusTimer"
    }
  }
}
```

**Comportamento:**
- Renderiza modal fullscreen com timer circular
- Atualiza a cada segundo
- Ao terminar: notificação + opção de estender
- Registra sessão no histórico

---

### Tool 5: `createAlternancySession`

**Tipo:** Write  
**Propósito:** Cria sessão de alternância entre múltiplos hiperfocos  

```typescript
{
  name: "createAlternancySession",
  description: "Creates a session to manage transitions between multiple hyperfocus areas, reducing context-switching cognitive load. Use when user wants to work on multiple interests in one period.",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Optional name for this session (e.g., 'Morning creative block')"
      },
      hyperfocusSequence: {
        type: "array",
        items: {
          type: "object",
          properties: {
            hyperfocusId: { type: "string" },
            durationMinutes: { type: "number" }
          }
        },
        minItems: 2,
        maxItems: 5
      },
      transitionBreakMinutes: {
        type: "number",
        default: 5,
        description: "Break time between hyperfocus switches"
      }
    },
    required: ["hyperfocusSequence"]
  },
  _meta: {
    readOnly: false,
    component: {
      type: "inline",
      name: "AlternancyFlow"
    }
  }
}
```

---

### Tool 6: `listHyperfocus`

**Tipo:** Read-only  
**Propósito:** Lista todos os hiperfocos ativos do usuário  

```typescript
{
  name: "listHyperfocus",
  description: "Shows all active hyperfocus areas for the user. Use when user asks 'what am I working on?', 'show my projects', or needs to see overview.",
  inputSchema: {
    type: "object",
    properties: {
      filter: {
        type: "string",
        enum: ["all", "active", "archived"],
        default: "active"
      },
      sortBy: {
        type: "string",
        enum: ["recent", "alphabetical", "mostTasks"],
        default: "recent"
      }
    }
  },
  _meta: {
    readOnly: true,
    component: {
      type: "inline",
      name: "HyperfocusTreeView"
    }
  }
}
```

---

### Tool 7: `updateTaskStatus`

**Tipo:** Write  
**Propósito:** Marca tarefa como completa/incompleta  

```typescript
{
  name: "updateTaskStatus",
  description: "Marks a task as complete or incomplete. Use when user says they finished something or wants to uncheck a task.",
  inputSchema: {
    type: "object",
    properties: {
      taskId: { type: "string" },
      completed: { type: "boolean" }
    },
    required: ["taskId", "completed"]
  },
  _meta: {
    readOnly: false,
    requiresConfirmation: false // Low-risk operation
  }
}
```

---

## 🎨 Componentes UI

### 1. HyperfocusTreeView (Inline Card)

**Layout:**
```
┌─────────────────────────────────────────────┐
│ 🎯 Meus Hiperfocos Ativos (3)               │
├─────────────────────────────────────────────┤
│ 📚 Aprender React                   [Blue]  │
│    ├─ ✅ Completar tutorial oficial          │
│    ├─ ⏳ Construir app To-Do (2/5h)          │
│    └─ ⏸️ Estudar hooks                       │
│                                               │
│ 🎵 Compor Música                  [Purple]  │
│    ├─ ⏳ Melodia principal (1/2h)            │
│    └─ ⏸️ Adicionar harmonia                  │
│                                               │
│ 🎮 Estudar Game Design             [Orange] │
│    └─ ⏸️ Ler "Theory of Fun"                │
│                                               │
│ [+ Novo Hiperfoco]   [⚙️ Alternância]       │
└─────────────────────────────────────────────┘
```

**Interações:**
- Click em hiperfoco → expande/colapsa tarefas
- Click em tarefa → marca como completa
- Click em "+ Novo" → trigger `createHyperfocus`
- Click em "Alternância" → trigger `createAlternancySession`

**Estados:**
- Loading (skeleton)
- Empty state (sem hiperfocos)
- Active (mostra árvore)
- Error (com retry)

---

### 2. FocusTimer (Fullscreen)

**Layout:**
```
┌─────────────────────────────────────────────┐
│                    [×]                       │
│                                               │
│         📚 Aprender React                    │
│                                               │
│              ⏰                               │
│          ╱         ╲                         │
│        ╱             ╲                       │
│       │      25:30     │                     │
│        ╲             ╱                       │
│          ╲         ╱                         │
│                                               │
│    [▶️ Pausar]  [🔄 Resetar]  [🔕 Alarme]  │
│                                               │
│  Tarefa atual: Construir app To-Do           │
│  Sessão: 1 de 3 pomodoros                    │
│                                               │
│            [+ 15min]                         │
└─────────────────────────────────────────────┘
```

**Features:**
- Timer circular animado (SVG com CSS)
- Cores mudam conforme tempo passa (verde → amarelo → vermelho)
- Botão "+ 15min" quando < 5min restantes
- Som/vibração customizável
- Modo "gentle end" com fade gradual

---

### 3. TaskBreakdown (Inline Card)

**Layout:**
```
┌─────────────────────────────────────────────┐
│ 📚 Aprender React - Tarefas                 │
├─────────────────────────────────────────────┤
│ Progresso: ███████░░░ 3/5 (60%)            │
│                                               │
│ ✅ 1. Completar tutorial oficial             │
│    └─ Concluído em 2h30min                   │
│                                               │
│ ⏳ 2. Construir aplicativo To-Do             │
│    └─ Estimado: 3h | Gasto: 2h               │
│    [Continuar] [Pausar]                      │
│                                               │
│ ⏸️ 3. Estudar React Hooks                    │
│    └─ Estimado: 2h                           │
│                                               │
│ ⏸️ 4. Fazer projeto pessoal                  │
│                                               │
│ ⏸️ 5. Contribuir open source                 │
│                                               │
│ [+ Adicionar tarefa] [✏️ Editar]            │
└─────────────────────────────────────────────┘
```

---

### 4. AlternancyFlow (Inline Card)

**Layout:**
```
┌─────────────────────────────────────────────┐
│ 🔄 Sessão de Alternância: Manhã Criativa    │
├─────────────────────────────────────────────┤
│                                               │
│  [📚 React]  →  [5min]  →  [🎵 Música]     │
│    45min         pausa        30min          │
│                                               │
│         →  [5min]  →  [🎮 Game Design]      │
│            pausa         45min               │
│                                               │
│ Status: ⏸️ Não iniciada                      │
│ Duração total: ~2h10min                      │
│                                               │
│ [▶️ Iniciar Sessão]  [✏️ Editar Ordem]      │
└─────────────────────────────────────────────┘
```

**Comportamento:**
- Mostra sequência visual de hiperfocos
- Indica tempo de transição entre cada um
- Timer automático que muda de hiperfoco
- Notifica antes de mudar (2min de aviso)
- Permite pular ou estender tempo

---

### 5. HyperfocusCard (Inline Card)

**Layout (Criação):**
```
┌─────────────────────────────────────────────┐
│ ✨ Novo Hiperfoco Criado!                   │
├─────────────────────────────────────────────┤
│                                               │
│  🎵  Compor Música Eletrônica                │
│                                               │
│  "Explorar produção de synthwave usando     │
│   Ableton Live e sintetizadores modulares"   │
│                                               │
│  ⏱️  Tempo estimado: 60 minutos              │
│  🎨  Cor: Purple                             │
│                                               │
│  [📝 Criar Tarefas] [⏰ Iniciar Timer]      │
└─────────────────────────────────────────────┘
```

---

### 6. AnalysisResult (Inline Card)

**Layout:**
```
┌─────────────────────────────────────────────┐
│ 🔍 Análise de Contexto                      │
├─────────────────────────────────────────────┤
│ Identifiquei 3 possíveis hiperfocos:         │
│                                               │
│ 1. 📚 Aprender React (confiança: 95%)       │
│    Palavras-chave: tutorial, hooks, projeto  │
│    [✨ Criar Hiperfoco]                      │
│                                               │
│ 2. 🎵 Produção Musical (confiança: 87%)     │
│    Palavras-chave: compor, melodia, Ableton  │
│    [✨ Criar Hiperfoco]                      │
│                                               │
│ 3. 📖 Estudar para Prova (confiança: 78%)   │
│    Palavras-chave: estudar, prova, revisar   │
│    [✨ Criar Hiperfoco]                      │
│                                               │
│ [✨ Criar Todos] [❌ Descartar]              │
└─────────────────────────────────────────────┘
```

---

## 🔐 Autenticação e Segurança

### Fluxo de Autenticação OAuth

```
1. Usuário instala Sati no ChatGPT
   ↓
2. Primeira chamada a qualquer tool (exceto analyzeContext)
   ↓
3. Sati retorna erro: "Authentication required"
   ↓
4. ChatGPT mostra botão "Conectar"
   ↓
5. Redireciona para /auth/login
   ↓
6. Supabase Auth com provider (Google/GitHub)
   ↓
7. Callback para /auth/callback com token
   ↓
8. Token salvo em sessão segura
   ↓
9. ChatGPT pode chamar tools autenticados
```

### Implementação (Next.js)

```typescript
// app/auth/login/route.ts
export async function GET(request: Request) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_URL}/auth/callback`,
      scopes: 'email profile'
    }
  });
  
  if (error) throw error;
  return Response.redirect(data.url);
}

// app/auth/callback/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  
  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  
  // Redireciona de volta para ChatGPT
  return Response.redirect(process.env.CHATGPT_RETURN_URL!);
}
```

### Segurança de Dados

**Políticas de Privacidade:**
- ✅ Coletar apenas: título/descrição de hiperfocos, tempo de foco, status de tarefas
- ❌ NUNCA coletar: histórico completo de chat, mensagens, dados sensíveis
- ✅ Row Level Security (RLS) no Supabase
- ✅ Dados criptografados em repouso
- ✅ HTTPS obrigatório em produção

**Privacy Policy (resumida):**
```
Sati coleta e armazena:
- Títulos e descrições de hiperfocos que você criar
- Status de conclusão de tarefas
- Tempo gasto em sessões de foco
- Preferências de timer e alarme

Sati NÃO coleta:
- Conteúdo das suas conversas com ChatGPT
- Dados pessoais além de email (para auth)
- Localização ou metadados de dispositivo
- Informações sensíveis (financeiras, saúde, etc.)

Você pode deletar todos os seus dados a qualquer momento.
```

---

## 📱 Experiência do Usuário

### Jornada Completa (Happy Path)

**Sessão 1: Descoberta**
```
1. Usuário conversa no ChatGPT:
   "Quero aprender React, fazer música e estudar..."

2. ChatGPT detecta sobrecarga cognitiva
   → Chama Sati.analyzeContext()

3. Sati renderiza análise:
   "Identifiquei 3 áreas de interesse. Quer estruturar?"

4. Usuário: "Sim, por favor!"

5. ChatGPT chama Sati.createHyperfocus() 3x
   → 3 cards de hiperfoco criados

6. ChatGPT: "Quer que eu decomponha em tarefas?"

7. Usuário: "Sim, começando por React"

8. Sati.breakIntoSubtasks("react-id")
   → TaskBreakdown renderizado com 5 tarefas
```

**Sessão 2: Foco**
```
1. Usuário retorna e diz: "Vou focar em React agora"

2. ChatGPT sugere: "Quer iniciar um timer?"

3. Sati.startFocusTimer("react-id", 45min)
   → Modal fullscreen com timer

4. Usuário trabalha focado por 45min

5. Alarme gentil toca com fade

6. Sati pergunta: "Continuar +15min ou fazer pausa?"

7. Usuário: "Pausa"

8. Sati.updateTaskStatus("build-todo", true)
   → Marca tarefa como completa
```

**Sessão 3: Alternância**
```
1. Usuário: "Quero trabalhar em React e Música hoje"

2. Sati.createAlternancySession({
     sequence: [
       { id: "react", duration: 45 },
       { id: "music", duration: 30 }
     ],
     transitionBreak: 5
   })

3. AlternancyFlow renderizado mostrando timeline

4. Sistema automaticamente alterna com avisos
```

### Entrada no ChatGPT

**Via Conversa (Discovery):**
- Usuário menciona múltiplos interesses → Sati é sugerido
- Usuário diz "organize isso" → Sati é chamado
- Usuário menciona "hiperfoco" ou "TDAH" → boost na discovery

**Via Launcher:**
- Usuário clica botão "+" no composer
- Vê Sati na lista com ícone 🎯
- Click → Sugere "O que você quer focar hoje?"

**Via Nome Direto:**
- "Sati, organize meus projetos"
- "Use Sati para estruturar isso"

---

## 📊 Métricas de Sucesso

### Métricas de Produto

**Adoção:**
- Instalações do app
- Taxa de conclusão de onboarding (criar primeiro hiperfoco)
- Usuários ativos diários/semanais/mensais

**Engajamento:**
- Hiperfocos criados por usuário (meta: 3-5)
- Tarefas completadas por semana (meta: 15+)
- Sessões de foco iniciadas (meta: 2+/dia)
- Taxa de retorno (meta: 60% semanal)

**Qualidade:**
- Tempo médio até primeiro hiperfoco (<2min)
- Taxa de sucesso de discovery (modelo chama Sati corretamente)
- Tempo de resposta da tool (<500ms)
- Erros por 1000 requisições (<5)

### Métricas de Impacto

**Validar via Survey Trimestral:**
- "Sati me ajuda a organizar meus hiperfocos?" (meta: 4.5/5)
- "Consigo retomar projetos mais facilmente?" (meta: 4.3/5)
- "Reduziu minha ansiedade com múltiplos interesses?" (meta: 4.0/5)
- NPS geral (meta: >50)

---

## 🚧 Riscos e Mitigações

### Risco 1: Discovery Imprecisa
**Descrição:** Modelo não chama Sati quando deveria, ou chama quando não deveria

**Probabilidade:** Média  
**Impacto:** Alto  

**Mitigação:**
- Investir tempo em metadados de tools bem escritos
- Testar com 20+ golden prompts antes de launch
- Iterar descriptions baseado em telemetria real
- Oferecer menção direta ("use Sati") como fallback

---

### Risco 2: Complexidade para Usuários Neurodivergentes
**Descrição:** Ironicamente, a ferramenta pode ter muitas opções e paralisar usuários

**Probabilidade:** Média  
**Impacto:** Alto  

**Mitigação:**
- Design minimalista (máximo 3 ações por tela)
- Defaults inteligentes (não pedir configuração excessiva)
- Onboarding guiado (primeiro hiperfoco é assistido)
- Permitir uso via linguagem natural (não forçar GUI)

---

### Risco 3: Latência em Mobile
**Descrição:** Componentes podem carregar lentamente em ChatGPT mobile

**Probabilidade:** Baixa  
**Impacto:** Médio  

**Mitigação:**
- Bundle de componentes <100KB (tree-shaking agressivo)
- Lazy loading de features secundárias
- Server-Side Rendering quando possível
- Cache agressivo de dados estáticos

---

### Risco 4: Limite de Token do Contexto
**Descrição:** Em conversas longas, contexto de Sati pode ser perdido

**Probabilidade:** Baixa  
**Impacto:** Médio  

**Mitigação:**
- Usar `structuredContent` eficientemente (apenas IDs e títulos)
- Oferecer tool `listHyperfocus` para recarregar contexto
- Supabase como source of truth (não depender só de chat)
- Explicar no onboarding que dados persistem fora do chat

---

### Risco 5: Rejeição na Review
**Descrição:** App pode ser rejeitado por violar guidelines

**Probabilidade:** Muito Baixa  
**Impacto:** Crítico  

**Mitigação:**
- ✅ Seguir guidelines rigorosamente desde dia 1
- ✅ Metadados claros e honestos (sem gaming do sistema)
- ✅ Privacy policy transparente
- ✅ Testes extensivos antes de submeter
- ✅ Demo account completo para reviewers

---

## 🌍 Go-to-Market

### Fase 1: Private Beta (Semana 1-4)
- Liberar para 10-20 usuários neurodivergentes da comunidade
- Coletar feedback qualitativo via entrevistas
- Iterar features baseado em uso real
- Documentar casos de sucesso

### Fase 2: Developer Mode (Semana 5-8)
- Disponibilizar para qualquer pessoa com developer mode ativado
- Promover em comunidades:
  - r/ADHD
  - r/neurodivergent
  - Discord de TDAH/Autismo
- Criar vídeos de demonstração
- Publicar no Product Hunt

### Fase 3: Public Launch (Semana 9-12)
- Submeter para diretório ChatGPT
- Aguardar aprovação
- Launch marketing coordenado:
  - Thread no Twitter
  - Post no LinkedIn
  - Email para waitlist
- Monitorar métricas de adoção

### Fase 4: Growth (Mês 4+)
- Implementar features avançadas (energia tracking, padrões)
- Parcerias com creators neurodivergentes
- Versão freemium (considerar monetização)

---

## 💰 Modelo de Negócio (Futuro)

### Tier Free (Forever)
- Até 3 hiperfocos ativos
- Timer básico
- Visualização em árvore
- Suporte comunitário

### Tier Pro ($4.99/mês)
- Hiperfocos ilimitados
- Analytics de produtividade
- Sessões de alternância ilimitadas
- Integrações (Google Calendar, Notion)
- Suporte prioritário

### Tier Team ($14.99/mês)
- Tudo do Pro
- Hiperfocos colaborativos
- Co-working virtual
- Admin dashboard

**Nota:** Monetização só após validar product-market fit (6+ meses)

---

## 📚 Referências e Inspirações

### Research Base
- **Spoon Theory** - gerenciamento de energia para neurodivergentes
- **Pomodoro Technique** - mas adaptado para hiperfoco (não rígido)
- **Getting Things Done (GTD)** - captura e organização de tarefas
- **Autistic Burnout** - importância de pausas e transições gentis

### Apps Similares (Análise Competitiva)

| App | Foco | Diferenciais Sati |
|-----|------|-------------------|
| Notion | Organização geral | ❌ Muito complexo para neurodivergentes<br>✅ Sati é zero-setup |
| Todoist | To-do lists | ❌ Não entende hiperfocos<br>✅ Sati detecta automaticamente |
| Forest | Focus timer | ❌ Não estrutura projetos<br>✅ Sati faz ambos |
| Motion | AI scheduling | ❌ Não integrado ao ChatGPT<br>✅ Sati vive onde usuários já estão |

**Posicionamento:** "Sati é a ponte entre suas conversas caóticas no ChatGPT e ação estruturada - feito especificamente para cérebros neurodivergentes"

---

## 🎓 Design Principles

### 1. Zero Friction
- Não pedir configuração antes de valor
- Defaults inteligentes sempre
- Funcionar via linguagem natural primeiro, GUI segundo

### 2. Gentle & Respectful
- Nunca interromper abruptamente (alarmes gentis)
- Respeitar estado de hiperfoco (não forçar pausas)
- Linguagem encorajadora, não julgadora

### 3. Visually Calming
- Paleta de cores suaves (não hiperestimulante)
- Animações sutis (não distrativas)
- Modo dark-first (melhor para sensibilidade sensorial)

### 4. Context-Aware
- Entender que hiperfocos mudam (permitir fácil)
- Não punir por não completar tarefas
- Celebrar pequenas vitórias

### 5. Transparent & Safe
- Sempre mostrar o que será salvo
- Permitir export de dados (JSON)
- Fácil deletar tudo (direito ao esquecimento)

---

## 🔄 Ciclo de Feedback

### Canais de Feedback
1. **In-app:** Botão "Feedback" em cada componente
2. **Discord:** Servidor da comunidade Sati
3. **GitHub:** Issues públicos para bugs/features
4. **Email:** support@sati.app
5. **Surveys:** Trimestrais com usuários ativos

### Processo de Priorização
```
1. Coletar feedback (todas as fontes)
   ↓
2. Categorizar (bug, feature, improvement)
   ↓
3. Scoring (impacto × esforço)
   ↓
4. Review semanal com foco em neurodivergência
   ↓
5. Roadmap atualizado publicamente
```

---

## 📖 Glossário

- **Hiperfoco:** Estado de concentração intensa em um interesse ou atividade, comum em pessoas neurodivergentes
- **Alternância:** Prática de mudar entre hiperfocos de forma estruturada
- **Spoons:** Metáfora para energia/capacidade cognitiva disponível
- **Context-switching tax:** Custo cognitivo de mudar entre tarefas
- **Gentle end:** Transição suave no fim de timer (vs. alarme abrupto)
- **MCP:** Model Context Protocol - padrão para apps ChatGPT
- **Tool:** Função que o ChatGPT pode chamar no MCP server
- **Component:** Interface visual renderizada no ChatGPT

---

## ✅ Critérios de Aceitação do MVP

### Must Have (MVP não lança sem isso)
- [ ] Auth OAuth funcional via Supabase
- [ ] Tool `createHyperfocus` funcionando end-to-end
- [ ] Tool `breakIntoSubtasks` funcionando
- [ ] Tool `startFocusTimer` com timer funcional
- [ ] Componente HyperfocusTreeView renderizando
- [ ] Componente FocusTimer fullscreen
- [ ] Persistência no Supabase
- [ ] Deploy em produção (HTTPS)
- [ ] Privacy policy publicada
- [ ] Testado no ChatGPT developer mode
- [ ] Sem erros no MCP Inspector

### Should Have (Importante mas não blocker)
- [ ] Tool `analyzeContext` com boa precisão
- [ ] Sistema de alternância básico
- [ ] Sincronização realtime entre devices
- [ ] Modo mobile otimizado
- [ ] Onboarding guiado

### Could Have (Nice to have)
- [ ] Analytics de produtividade
- [ ] Export de dados (JSON)
- [ ] Temas de cores customizados
- [ ] Integração com calendário

---

## 🗓️ Timeline Estimado

**Total:** 8-10 semanas até MVP em produção

- **Sprint 1-2:** Setup e infraestrutura (2 semanas)
- **Sprint 3-4:** Core tools e componentes (2 semanas)
- **Sprint 5-6:** Timer e alternância (2 semanas)
- **Sprint 7:** Testes e polish (1 semana)
- **Sprint 8:** Beta privado e iteração (1 semana)
- **Sprint 9-10:** Preparação para launch (2 semanas)

---

## 📞 Stakeholders

**Product Owner:** Ester (você)  
**Developers:** TBD  
**Designers:** TBD (ou você mesma)  
**Beta Testers:** Comunidade neurodivergente (recrutar)  
**Advisors:** Psicólogos especializados em neurodivergência (opcional)  

---

## 🎯 Visão de Longo Prazo (1-2 anos)

1. **Sati se torna referência** para neurodivergentes no ChatGPT
2. **Partnerships** com organizações de TDAH/Autismo
3. **Pesquisa acadêmica** sobre eficácia de Sati
4. **Expansão** para outras plataformas (Claude, Gemini)
5. **Ecossistema** de apps complementares para neurodivergência

---

## 📝 Notas Adicionais

### Nomenclatura "Sati"
- Origem: Budismo (atenção plena, mindfulness)
- Curto, memorável, internacional
- Disponível como domínio (.app, .io)

### Acessibilidade
- WCAG 2.1 AA compliance mínimo
- Suporte a screen readers
- Atalhos de teclado para tudo
- Alto contraste opcional

### Localização (i18n)
- Lançar em: Português (BR), Inglês (US)
- Futuro: Espanhol, Francês, Alemão
- Usar i18next no Next.js

---

## ✍️ Aprovações

| Stakeholder | Status | Data | Comentários |
|-------------|--------|------|-------------|
| Product Owner | ⏳ Pendente | - | - |
| Tech Lead | ⏳ Pendente | - | - |
| Design Lead | ⏳ Pendente | - | - |

---

**Próximos Passos:**
1. Review deste PRD com stakeholders
2. Validar technical feasibility com protótipo
3. Recrutar beta testers neurodivergentes
4. Iniciar Sprint 1

---

*Este documento é vivo e será atualizado conforme aprendemos mais sobre as necessidades dos usuários.*

