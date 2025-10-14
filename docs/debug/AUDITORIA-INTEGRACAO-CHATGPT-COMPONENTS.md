# 🔍 Auditoria: Integração ChatGPT ↔ React Components

**Data:** 12 de outubro de 2025  
**Status:** 🔴 **CRÍTICO** - Inconsistências detectadas

---

## 📊 Visão Geral

Esta auditoria analisa a integração entre:
- **Backend (MCP Tools):** Retorna `component.props` com dados iniciais
- **Frontend (React Components):** Usa `useToolInput()` para ler props e `useToolOutput()` para resultados
- **Bridge (ChatGPT):** Popula `window.openai.toolInput` e `window.openai.toolOutput`

---

## 🚨 PROBLEMA CRÍTICO IDENTIFICADO

### FocusTimer - Bug de Integração

**Componente:** `src/components/FocusTimer.tsx`  
**Tool:** `src/lib/mcp/tools/startFocusTimer.ts`  
**Severidade:** 🔴 CRÍTICO

#### Sintomas
- Timer mostra **00:00** imediatamente
- Status mostra **"Sessão concluída!"** ao invés de "Em foco"
- Backend funciona perfeitamente (logs confirmam)
- Props corretos retornados pelo backend

#### Causa Raiz (SUSPEITA)
```typescript
// Tool retorna props corretos:
component: {
  type: 'fullscreen',
  name: 'FocusTimer',
  props: {
    sessionId: '...',
    endsAt: '2025-10-12T18:30:00.000Z',  // ✅ Correto
    status: 'active',                     // ✅ Correto
    durationMinutes: 15                   // ✅ Correto
  }
}

// Componente lê de toolInput:
const toolInput = useToolInput<FocusTimerInput>();
const endsAt = toolInput?.endsAt;  // ❓ undefined ou string vazia?
const status = toolInput?.status;   // ❓ undefined ou 'completed'?
```

**Hipóteses:**
1. ❌ `window.openai.toolInput` não está sendo populado pelo ChatGPT
2. ❌ Componente renderiza antes do ChatGPT popular `toolInput`
3. ❌ Serialização de Date ISO string falha silenciosamente
4. ❌ Re-render limpa `toolInput` antes do timer iniciar

#### Status
⏳ **EM INVESTIGAÇÃO** - Logs de debug adicionados, aguardando teste do usuário

---

## ✅ COMPONENTES AUDITADOS

### 1. AlternancyFlow ✅ PROVÁVEL OK

**Arquivo:** `src/components/AlternancyFlow.tsx`  
**Tool:** `startAlternancy.ts`  
**Display Mode:** `expanded`

#### Backend (Tool Props)
```typescript
props: {
  sessionId: string,
  name: string,
  status: 'in_progress',
  currentIndex: 0,
  startedAt: string,
  sequence: HyperfocusInSequence[],
  transitionBreakMinutes: number
}
```

#### Frontend (Component)
```typescript
const toolInput = useToolInput<AlternancyInput>();
const toolOutput = useToolOutput<AlternancyOutput>();

// ✅ Usa AMBOS corretamente:
const sessionName = toolOutput?.name || toolInput?.name || 'Sessão de Alternância';
const sequence = toolOutput?.sequence || toolInput?.hyperfocusSequence || [];
```

**Avaliação:** ✅ **CORRETO**
- Usa fallback `toolOutput || toolInput`
- Não depende de timestamps sensíveis
- Componente `expanded` (não fullscreen)

**Risco:** 🟢 BAIXO

---

### 2. SubtaskSuggestions ⚠️ RISCO MÉDIO

**Arquivo:** `src/components/SubtaskSuggestions.tsx`  
**Tool:** `breakIntoSubtasks.ts`  
**Display Mode:** `expanded`

#### Backend (Tool Props)
```typescript
// Tool não retorna component.props consistentemente
component: validated.autoCreate
  ? { type: 'expanded', name: 'TaskBreakdown', props: {...} }
  : { type: 'expanded', name: 'SubtaskSuggestions', props: {...} }
```

#### Frontend (Component)
```typescript
const toolInput = useToolInput<SubtaskSuggestionsInput>();
const toolOutput = useToolOutput<SubtaskSuggestionsOutput>();

// ⚠️ Usa AMBOS mas prefere toolOutput:
const hyperfocusTitle = toolOutput?.hyperfocusTitle || toolInput?.hyperfocusTitle || '';
const suggestedTasks = toolOutput?.suggestedTasks ?? [];  // ⚠️ SÓ toolOutput
```

**Problemas Potenciais:**
- ⚠️ `suggestedTasks` depende 100% de `toolOutput`
- ⚠️ Se `toolOutput` estiver vazio, lista fica vazia
- ⚠️ Não há fallback para `toolInput?.suggestedTasks`

**Avaliação:** ⚠️ **RISCO MÉDIO**

**Recomendação:** Adicionar props ao `component.props` do backend:
```typescript
component: {
  type: 'expanded',
  name: 'SubtaskSuggestions',
  props: {
    hyperfocusId: validated.hyperfocusId,
    hyperfocusTitle: hyperfocus.title,
    suggestedTasks: suggestedTasks,  // ← ADICIONAR ISSO
    complexity: analysis.complexity,
    totalEstimatedMinutes: totalMinutes
  }
}
```

---

### 3. TaskBreakdown ⚠️ RISCO MÉDIO

**Arquivo:** `src/components/TaskBreakdown.tsx`  
**Tool:** `createTask.ts` / `breakIntoSubtasks.ts`  
**Display Mode:** `expanded`

#### Frontend (Component)
```typescript
const toolOutput = useToolOutput<TaskBreakdownOutput>();

// ❌ NÃO USA toolInput!
// ⚠️ Depende 100% de toolOutput
```

**Problemas:**
- ❌ Se `toolOutput` estiver vazio, componente renderiza vazio
- ❌ Não há fallback para props iniciais
- ⚠️ Usa lógica complexa de extração: `extractTasksFromToolResponse()`

**Avaliação:** ⚠️ **RISCO MÉDIO**

**Recomendação:**
1. Adicionar `useToolInput` com fallback
2. Backend deve sempre retornar `component.props` com tasks

---

### 4. HyperfocusCard ✅ OK

**Arquivo:** `src/components/HyperfocusCard.tsx`  
**Tool:** `createHyperfocus.ts` / `getHyperfocus.ts`  
**Display Mode:** `expanded`

#### Frontend
```typescript
const toolOutput = useToolOutput<HyperfocusCardOutput>();
const hyperfocus = toolOutput?.hyperfocus;

if (!hyperfocus) {
  return null;  // ✅ Early return se vazio
}
```

**Avaliação:** ✅ **CORRETO**
- Componente simples e read-only
- Não depende de timestamps ou estados mutáveis
- Graceful degradation com `null` return

**Risco:** 🟢 BAIXO

---

### 5. FocusSessionSummary ✅ OK

**Arquivo:** `src/components/FocusSessionSummary.tsx`  
**Tool:** `endFocusTimer.ts`  
**Display Mode:** `expanded`

#### Backend (Tool Props)
```typescript
props: {
  sessionId: string,
  hyperfocusId: string,
  hyperfocusTitle: string,
  startedAt: string,
  endedAt: string,
  plannedDurationMinutes: number,
  actualDurationMinutes: number,
  interrupted: boolean,
  tasksCompleted: number,
  totalTasks: number,
  completedTasks: Task[],
  feedback: string,
  streak: number
}
```

#### Frontend
```typescript
const toolOutput = useToolOutput<FocusSessionSummaryOutput>();

// ✅ Usa toolOutput corretamente
// ✅ Não depende de timestamps para countdown
// ✅ Display de dados estáticos (resumo)
```

**Avaliação:** ✅ **CORRETO**
- Dados estáticos (não muda após renderização)
- Usa apenas `toolOutput` (correto para resultados finais)
- Timestamps são display-only (não para lógica)

**Risco:** 🟢 BAIXO

---

### 6. HyperfocusList ✅ OK

**Arquivo:** `src/components/HyperfocusList.tsx`  
**Tool:** `listHyperfocus.ts`  
**Display Mode:** `expanded`

#### Frontend
```typescript
const toolOutput = useToolOutput<HyperfocusListOutput>();
const hyperfocusList = toolOutput?.hyperfocusList ?? [];

// ✅ Usa fallback para array vazio
// ✅ Componente read-only de listagem
```

**Avaliação:** ✅ **CORRETO**

**Risco:** 🟢 BAIXO

---

### 7. ContextAnalysis 🔍 NÃO AUDITADO

**Arquivo:** `src/components/ContextAnalysis.tsx`  
**Tool:** `analyzeContext.ts`  
**Status:** ⏸️ Precisa auditoria detalhada

---

## 📋 PADRÕES IDENTIFICADOS

### ✅ Padrão Correto (RECOMENDADO)

```typescript
// 1. Backend sempre retorna component.props completos
return {
  component: {
    type: 'expanded' | 'fullscreen',
    name: 'ComponentName',
    props: {
      // TODOS os dados necessários para renderizar
      id: '...',
      title: '...',
      items: [...],
      timestamp: new Date().toISOString()
    }
  }
}

// 2. Frontend usa toolInput com fallback para toolOutput
const toolInput = useToolInput<MyInput>();
const toolOutput = useToolOutput<MyOutput>();

const data = toolOutput?.data || toolInput?.data || defaultValue;
```

### ❌ Anti-Padrão (EVITAR)

```typescript
// ❌ Backend não retorna props
return {
  component: { type: 'expanded', name: 'MyComponent' }  // SEM props!
}

// ❌ Frontend depende 100% de toolOutput
const toolOutput = useToolOutput<MyOutput>();
const data = toolOutput?.data;  // Se toolOutput vazio, quebra!
```

---

## 🎯 RECOMENDAÇÕES

### 1. 🔴 CRÍTICO - FocusTimer

**Ação:** Investigar logs de debug
```bash
# Usuário deve:
1. Abrir DevTools (F12)
2. Aba Console
3. Iniciar timer
4. Enviar logs que começam com '[FocusTimer]'
```

**Próximos Passos:**
- Se `toolInput` vazio → problema no ChatGPT bridge
- Se `endsAt` undefined → problema de serialização
- Se `endsAt` correto mas diff negativo → problema de timezone

---

### 2. ⚠️ MÉDIO - SubtaskSuggestions

**Ação:** Adicionar props ao backend
```typescript
// Em breakIntoSubtasks.ts
component: {
  type: 'expanded',
  name: 'SubtaskSuggestions',
  props: {
    hyperfocusId: validated.hyperfocusId,
    hyperfocusTitle: hyperfocus.title,
    description: validated.taskDescription,
    suggestedTasks: suggestedTasks,  // ← ADICIONAR
    complexity: analysis.complexity,
    totalEstimatedMinutes: totalMinutes
  }
}
```

**Ação:** Atualizar componente
```typescript
// Em SubtaskSuggestions.tsx
const toolInput = useToolInput<SubtaskSuggestionsInput>();
const toolOutput = useToolOutput<SubtaskSuggestionsOutput>();

// Adicionar fallback:
const suggestedTasks = toolOutput?.suggestedTasks || toolInput?.suggestedTasks || [];
```

---

### 3. ⚠️ MÉDIO - TaskBreakdown

**Ação:** Adicionar useToolInput com fallback
```typescript
// Em TaskBreakdown.tsx
const toolInput = useToolInput<TaskBreakdownInput>();
const toolOutput = useToolOutput<TaskBreakdownOutput>();

const tasks = toolOutput?.tasks || toolInput?.tasks || [];
```

---

### 4. 🟢 BAIXO - Componentes OK

**Ação:** Nenhuma ação necessária para:
- ✅ AlternancyFlow
- ✅ HyperfocusCard
- ✅ FocusSessionSummary
- ✅ HyperfocusList

---

## 📊 RESUMO EXECUTIVO

| Componente | Severidade | Status | Ação |
|------------|-----------|--------|------|
| FocusTimer | 🔴 CRÍTICO | EM INVESTIGAÇÃO | Debug logs adicionados |
| SubtaskSuggestions | ⚠️ MÉDIO | PENDENTE | Adicionar props no backend |
| TaskBreakdown | ⚠️ MÉDIO | PENDENTE | Adicionar useToolInput |
| AlternancyFlow | 🟢 BAIXO | OK | Nenhuma |
| HyperfocusCard | 🟢 BAIXO | OK | Nenhuma |
| FocusSessionSummary | 🟢 BAIXO | OK | Nenhuma |
| HyperfocusList | 🟢 BAIXO | OK | Nenhuma |
| ContextAnalysis | 🔍 NÃO AUDITADO | PENDENTE | Auditoria completa |

---

## 🔬 PRÓXIMOS PASSOS

1. **IMEDIATO:** Aguardar logs do usuário para FocusTimer
2. **CURTO PRAZO:** Corrigir SubtaskSuggestions e TaskBreakdown
3. **MÉDIO PRAZO:** Auditar ContextAnalysis
4. **LONGO PRAZO:** Criar testes de integração ChatGPT ↔ Components

---

## 📚 LIÇÕES APRENDIDAS

### Princípio de Robustez
> **"Seja liberal no que aceita, conservador no que envia"**

**Aplicado:**
- Backend deve sempre retornar `component.props` completos
- Frontend deve sempre ter fallback: `toolOutput || toolInput || default`

### Single Source of Truth
- **Props iniciais** → `toolInput` (de `component.props`)
- **Resultados finais** → `toolOutput` (de callback result)
- **Estado mutável** → `useWidgetState` (sincronizado)

### Fail-Safe Design
```typescript
// ✅ BOM: Múltiplos níveis de fallback
const data = toolOutput?.data || toolInput?.data || defaultValue;

// ❌ RUIM: Depende de uma única fonte
const data = toolOutput?.data;
```

---

**Fim da Auditoria**  
**Próxima revisão:** Após correção do FocusTimer
