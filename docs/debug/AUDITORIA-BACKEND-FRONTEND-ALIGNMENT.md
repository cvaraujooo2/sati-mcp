# 🔍 Auditoria: Alinhamento Backend ↔ Frontend

**Data:** 12 de outubro de 2025  
**Componentes Analisados:** AlternancyFlow, ContextAnalysis, FocusSessionSummary, FocusTimer, HyperfocusCard, HyperfocusList, SubtaskSuggestions, TaskBreakdown  
**Status:** 🔴 **CRÍTICO - Múltiplas inconsistências detectadas**

---

## 📊 Resumo Executivo

### Problemas Identificados
- **6 Tools chamadas no Frontend que NÃO EXISTEM no Backend**
- **3 Componentes com interfaces desalinhadas**
- **2 Tools com schema de input/output incompatível**
- **1 Componente com lógica duplicada (cliente/servidor)**

### Impacto
- ❌ Botões que não funcionam (falham silenciosamente)
- ❌ Usuários clicam e nada acontece
- ❌ Experiência quebrada em funcionalidades críticas
- ❌ Falta de feedback de erro adequado

---

## 🚨 TOOLS FALTANTES NO BACKEND (CRÍTICO)

### 1. **`startAlternancy`** ❌
**Frontend:** `AlternancyFlow.tsx:121`
```typescript
await window.openai.callTool('startAlternancy', {
  sessionId: toolOutput.sessionId,
});
```

**Backend:** ❌ **NÃO EXISTE**
- Apenas `createAlternancy` existe
- Falta handler para iniciar sessão já criada
- Componente assume que pode iniciar, mas backend não suporta

**Impacto:** Botão "Começar" não funciona  
**Prioridade:** 🔴 ALTA

---

### 2. **`completeAlternancy`** ❌
**Frontend:** `AlternancyFlow.tsx:167`
```typescript
await window.openai.callTool('completeAlternancy', {
  sessionId: toolOutput.sessionId,
});
```

**Backend:** ❌ **NÃO EXISTE**
- Falta handler para marcar alternância como completa
- Sem forma de finalizar sessão adequadamente

**Impacto:** Sessões ficam "penduradas" no banco  
**Prioridade:** 🔴 ALTA

---

### 3. **`extendFocusTimer`** ❌
**Frontend:** `FocusTimer.tsx:123`
```typescript
await window.openai.callTool('extendFocusTimer', {
  sessionId: toolOutput.sessionId,
  additionalMinutes: 15,
});
```

**Backend:** ❌ **NÃO EXISTE**
- Apenas `startFocusTimer` e `endFocusTimer` existem
- Impossível estender sessão ativa

**Impacto:** Botão "+15 min" não funciona  
**Prioridade:** 🟡 MÉDIA

---

### 4. **`createTaskBatch`** ❌
**Frontend:** `SubtaskSuggestions.tsx:84`
```typescript
await window.openai.callTool('createTaskBatch', {
  hyperfocusId: toolOutput.hyperfocusId,
  tasks: tasksToCreate.map(task => ({
    title: task.title,
    description: task.description,
    estimatedMinutes: task.estimatedMinutes,
  })),
});
```

**Backend:** ❌ **NÃO EXISTE**
- Apenas `createTask` (singular) existe
- Frontend tentando criar múltiplas tarefas de uma vez

**Impacto:** Criação em batch falha, forçando loop de `createTask`  
**Prioridade:** 🟡 MÉDIA

---

### 5. **`updateTaskStatus`** ⚠️ SCHEMA INCOMPATÍVEL
**Frontend:** `TaskBreakdown.tsx:150`
```typescript
await window.openai.callTool('updateTaskStatus', {
  hyperfocusId,
  taskId,
  completed: nextCompleted,
});
```

**Backend:** `updateTaskStatus.ts` ✅ EXISTE mas:
```typescript
// Backend espera:
{
  taskId: string;
  completed: boolean;
  // NÃO precisa de hyperfocusId
}
```

**Problema:** Frontend envia `hyperfocusId` desnecessário  
**Impacto:** Funciona, mas com parâmetro extra ignorado  
**Prioridade:** 🟢 BAIXA (funcional, mas não semântico)

---

### 6. **`requestDisplayMode`** e **`sendFollowUpMessage`** ⚠️
**Frontend:** Múltiplos componentes
```typescript
// Usado em TODOS os componentes
await window.openai.requestDisplayMode({ mode: 'inline' });
await window.openai.sendFollowUpMessage({ prompt: '...' });
```

**Backend:** ❓ **API DO CHATGPT (não MCP Tool)**
- Essas são APIs do cliente OpenAI, não tools
- Precisam estar disponíveis via `window.openai`
- Não são tools do servidor MCP

**Status:** ✅ OK se implementado no cliente  
**Prioridade:** 🟢 VERIFICAR IMPLEMENTAÇÃO CLIENT-SIDE

---

## 📋 ANÁLISE POR COMPONENTE

### **AlternancyFlow.tsx**
| Método | Backend Existe? | Status | Ação Requerida |
|--------|----------------|--------|----------------|
| `startAlternancy` | ❌ NÃO | 🔴 CRÍTICO | Criar tool |
| `completeAlternancy` | ❌ NÃO | 🔴 CRÍTICO | Criar tool |
| `requestDisplayMode` | ✅ Cliente | ✅ OK | Verificar client |
| `sendFollowUpMessage` | ✅ Cliente | ✅ OK | Verificar client |

**Inputs esperados:**
```typescript
interface AlternancyInput {
  name?: string;
  hyperfocusSequence: HyperfocusInSequence[];
  transitionBreakMinutes?: number;
  autoStart?: boolean;
}
```

**Output atual do backend (`createAlternancy`):**
```typescript
{
  sessionId: string;
  name: string;
  sequence: Array<{
    hyperfocusId: string;
    hyperfocusTitle: string;
    color: string;
    durationMinutes: number;
  }>;
  transitionBreakMinutes: number;
  status: 'planned' | 'active' | 'completed';
  totalDurationMinutes: number;
  template?: string;
}
```

**Desalinhamento:**
- Backend retorna `status: 'planned'` mas componente espera `'not_started'`
- Falta campo `currentIndex` no output
- Falta campo `startedAt` no output

---

### **FocusTimer.tsx**
| Método | Backend Existe? | Status | Ação Requerida |
|--------|----------------|--------|----------------|
| `startFocusTimer` | ✅ SIM | ✅ OK | - |
| `endFocusTimer` | ✅ SIM | ✅ OK | - |
| `extendFocusTimer` | ❌ NÃO | 🟡 DESEJÁVEL | Criar tool |

**Input esperado:**
```typescript
interface FocusTimerInput {
  hyperfocusId: string;
  hyperfocusTitle: string;
  durationMinutes: number;
  alarmSound?: 'gentle-bell' | 'soft-chime' | 'vibrate' | 'none';
  gentleEnd?: boolean;
}
```

**Backend aceita:**
```typescript
{
  hyperfocusId: string;
  durationMinutes: number;
  playSound?: boolean; // ❌ Diferente do frontend!
}
```

**Desalinhamento:**
- Backend não aceita `alarmSound` (apenas `playSound` boolean)
- Backend não aceita `gentleEnd`
- Backend não retorna `hyperfocusTitle` diretamente (precisa join)

---

### **SubtaskSuggestions.tsx**
| Método | Backend Existe? | Status | Ação Requerida |
|--------|----------------|--------|----------------|
| `createTaskBatch` | ❌ NÃO | 🟡 DESEJÁVEL | Criar tool ou loop |
| `sendFollowUpMessage` | ✅ Cliente | ✅ OK | - |

**Workaround atual:** Poderia fazer loop de `createTask`, mas seria ineficiente

---

### **TaskBreakdown.tsx**
| Método | Backend Existe? | Status | Ação Requerida |
|--------|----------------|--------|----------------|
| `updateTaskStatus` | ✅ SIM | ⚠️ SCHEMA | Remover `hyperfocusId` extra |
| `createTask` | ✅ SIM | ✅ OK | - |

**Lógica de sincronização:**
```typescript
// TaskBreakdown tem lógica client-side para optimistic updates
setTasks((prevTasks) =>
  prevTasks.map((task) =>
    task.id === taskId ? { ...task, completed: nextCompleted } : task
  )
);
```

**Problema:** Se o backend falhar, estado local fica inconsistente temporariamente  
**Solução atual:** Rollback manual em catch ✅

---

### **HyperfocusList.tsx**
| Método | Backend Existe? | Status | Ação Requerida |
|--------|----------------|--------|----------------|
| `updateTaskStatus` | ✅ SIM | ✅ OK | - |
| `startFocusTimer` | ✅ SIM | ✅ OK | - |
| `sendFollowUpMessage` | ✅ Cliente | ✅ OK | - |

**Status:** ✅ Bem alinhado

---

### **ContextAnalysis.tsx**
| Método | Backend Existe? | Status | Ação Requerida |
|--------|----------------|--------|----------------|
| `analyzeContext` | ✅ SIM | ✅ OK | - |
| `sendFollowUpMessage` | ✅ Cliente | ✅ OK | - |

**Status:** ✅ Bem alinhado

---

### **FocusSessionSummary.tsx**
| Método | Backend Existe? | Status | Ação Requerida |
|--------|----------------|--------|----------------|
| `startFocusTimer` | ✅ SIM | ✅ OK | - |
| `sendFollowUpMessage` | ✅ Cliente | ✅ OK | - |
| `requestDisplayMode` | ✅ Cliente | ✅ OK | - |

**Input esperado:**
```typescript
interface FocusSessionSummaryOutput {
  sessionId: string;
  hyperfocusId: string;
  hyperfocusTitle: string;
  startedAt: string;
  endedAt: string;
  plannedDurationMinutes: number;
  actualDurationMinutes: number;
  interrupted: boolean;
  tasksCompleted: number;
  totalTasks: number;
  completedTasks?: Task[];
  feedback: string;
  streak?: number;
  totalFocusTimeToday?: number;
}
```

**Backend (`endFocusTimer`) retorna:**
```typescript
{
  sessionId: string;
  hyperfocusId: string;
  hyperfocusTitle: string;
  startedAt: string;
  endedAt: string;
  plannedDurationMinutes: number;
  actualDurationMinutes: number;
  interrupted: boolean;
  completionRate: number; // ❌ Não existe no frontend
  // ❌ Falta tasksCompleted, totalTasks, completedTasks, feedback, streak
}
```

**Desalinhamento:** Output do backend está incompleto

---

## 🎯 MATRIZ DE PRIORIDADES

### 🔴 PRIORIDADE CRÍTICA (Implementar Imediatamente)
1. **`startAlternancy`** - Sessões de alternância não iniciam
2. **`completeAlternancy`** - Sessões ficam incompletas no banco
3. **Alinhar output de `endFocusTimer`** - Summary incompleto

### 🟡 PRIORIDADE MÉDIA (Próxima Sprint)
4. **`extendFocusTimer`** - UX melhorada mas não bloqueante
5. **`createTaskBatch`** - Performance (pode fazer loop temporário)
6. **Alinhar input de `startFocusTimer`** - `alarmSound` ignorado

### 🟢 PRIORIDADE BAIXA (Refactor)
7. Remover `hyperfocusId` de `updateTaskStatus` call
8. Padronizar status enums (`not_started` vs `planned`)
9. Documentar APIs do cliente (`window.openai`)

---

## 📝 RECOMENDAÇÕES

### 1. **Criar Tools Faltantes**
```typescript
// src/lib/mcp/tools/startAlternancy.ts
export async function startAlternancyHandler(
  input: { sessionId: string },
  userId: string
) {
  // Atualizar status de 'planned' para 'active'
  // Registrar startedAt timestamp
  // Retornar estado atualizado
}

// src/lib/mcp/tools/completeAlternancy.ts
export async function completeAlternancyHandler(
  input: { sessionId: string },
  userId: string
) {
  // Atualizar status para 'completed'
  // Calcular estatísticas finais
  // Retornar summary
}

// src/lib/mcp/tools/extendFocusTimer.ts
export async function extendFocusTimerHandler(
  input: { sessionId: string; additionalMinutes: number },
  userId: string
) {
  // Atualizar endsAt timestamp
  // Retornar novo endsAt
}

// src/lib/mcp/tools/createTaskBatch.ts
export async function createTaskBatchHandler(
  input: { hyperfocusId: string; tasks: Array<TaskInput> },
  userId: string
) {
  // Criar múltiplas tarefas em uma transação
  // Retornar array de tarefas criadas
}
```

### 2. **Enriquecer Outputs Existentes**
```typescript
// endFocusTimer.ts - adicionar ao output:
return {
  // ...campos existentes
  tasksCompleted: completedTasksCount,
  totalTasks: totalTasksCount,
  completedTasks: completedTasksList,
  feedback: generateFeedback(session),
  streak: calculateStreak(userId),
  totalFocusTimeToday: calculateDailyTotal(userId),
};
```

### 3. **Padronizar Schemas**
```typescript
// Criar types compartilhados:
// src/types/components.ts
export type SessionStatus = 'not_started' | 'active' | 'on_break' | 'completed';
export type AlarmSound = 'gentle-bell' | 'soft-chime' | 'vibrate' | 'none';

// Usar nos componentes E no backend
```

### 4. **Adicionar Validação Client-Side**
```typescript
// Antes de callTool, verificar se existe:
if (!window.openai?.callTool) {
  console.error('OpenAI client not initialized');
  return;
}

// Adicionar try/catch com feedback visual
try {
  await window.openai.callTool('startAlternancy', { sessionId });
} catch (error) {
  console.error('Failed to start alternancy:', error);
  // Mostrar toast de erro ao usuário
}
```

### 5. **Documentar Contrato de Interface**
Criar arquivo `docs/API-CONTRACTS.md` documentando:
- Input/output de cada tool
- Componentes que consomem cada tool
- Estados esperados em cada fase

---

## 🔧 PLANO DE AÇÃO

### Sprint 1 (Imediato)
- [ ] Criar `startAlternancy` tool
- [ ] Criar `completeAlternancy` tool
- [ ] Enriquecer output de `endFocusTimer`
- [ ] Adicionar try/catch em todos os `callTool`

### Sprint 2 (Próxima)
- [ ] Criar `extendFocusTimer` tool
- [ ] Criar `createTaskBatch` tool
- [ ] Alinhar input de `startFocusTimer` com `alarmSound`
- [ ] Padronizar enums de status

### Sprint 3 (Refactor)
- [ ] Criar types compartilhados
- [ ] Documentar API contracts
- [ ] Remover parâmetros desnecessários
- [ ] Adicionar testes de integração frontend ↔ backend

---

## 📚 FERRAMENTAS DE VERIFICAÇÃO

### Script de Validação (Shell)
```bash
#!/bin/bash
# validate-backend-frontend.sh

echo "🔍 Verificando alinhamento Backend ↔ Frontend..."

# Buscar todos os callTool no frontend
echo "\n📱 Tools chamadas no Frontend:"
grep -r "callTool(" src/components/*.tsx | sed "s/.*callTool('\([^']*\)'.*/\1/" | sort -u

# Buscar todos os handlers no backend
echo "\n🔧 Tools registradas no Backend:"
grep "Handler" src/lib/mcp/tools/index.ts | sed "s/.*: {\|handler:.*//" | grep -v "^$" | sort -u

echo "\n✅ Compare as listas acima manualmente"
```

### Script de Auditoria (TypeScript)
```typescript
// scripts/audit-api-alignment.ts
import { TOOL_REGISTRY } from '@/lib/mcp/tools';

const FRONTEND_CALLS = [
  'startAlternancy',
  'completeAlternancy',
  'extendFocusTimer',
  'createTaskBatch',
  'updateTaskStatus',
  'createTask',
  'startFocusTimer',
  'endFocusTimer',
];

const BACKEND_TOOLS = Object.keys(TOOL_REGISTRY);

const missing = FRONTEND_CALLS.filter(tool => !BACKEND_TOOLS.includes(tool));

console.log('❌ Tools faltantes no backend:', missing);
```

---

## 🎓 LIÇÕES APRENDIDAS

1. **Type Safety End-to-End:** TypeScript deve ser compartilhado entre cliente e servidor
2. **Contract-First Design:** Definir schemas antes de implementar
3. **Validação em Camadas:** Cliente valida UX, servidor valida segurança
4. **Testes de Integração:** Prevenir drift entre camadas

---

**Auditoria realizada por:** GitHub Copilot  
**Última atualização:** 12/10/2025  
**Próxima revisão:** Após implementação das tools faltantes
