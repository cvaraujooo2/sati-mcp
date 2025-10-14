# 📋 Lista de Tarefas: Correção Backend ↔ Frontend

**Data:** 12 de outubro de 2025  
**Referência:** [AUDITORIA-BACKEND-FRONTEND-ALIGNMENT.md](./AUDITORIA-BACKEND-FRONTEND-ALIGNMENT.md)  
**Status Geral:** 🔴 6 tools faltantes | 3 schemas desalinhados | 2 outputs incompletos

---

## 🔴 SPRINT 1 - CRÍTICO (Implementar Imediatamente)

### Task 1.1: Criar `startAlternancy` Tool
**Prioridade:** 🔴 CRÍTICA  
**Estimativa:** 2-3 horas  
**Arquivos:**
- [ ] Criar `src/lib/mcp/tools/startAlternancy.ts`
- [ ] Adicionar ao `src/lib/mcp/tools/index.ts` (registry)
- [ ] Adicionar testes em `tests/unit/startAlternancy.test.ts`

**Especificação:**
```typescript
// src/lib/mcp/tools/startAlternancy.ts

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { McpToolMetadata, AUTH_SCOPES } from '../types/metadata';

const startAlternancySchema = z.object({
  sessionId: z.string().uuid('sessionId inválido'),
});

export type StartAlternancyInput = z.infer<typeof startAlternancySchema>;

export async function startAlternancyHandler(
  input: StartAlternancyInput,
  userId: string
) {
  const supabase = await createClient();
  const validated = startAlternancySchema.parse(input);

  // 1. Buscar sessão de alternância
  const { data: session, error: sessionError } = await supabase
    .from('alternancy_sessions')
    .select('*, hyperfocus(*)')
    .eq('id', validated.sessionId)
    .maybeSingle();

  if (sessionError || !session) {
    throw new NotFoundError('Sessão de alternância');
  }

  // 2. Validar ownership (via primeiro hyperfocus)
  const firstHyperfocusId = session.hyperfocus_sequence[0]?.hyperfocusId;
  const { data: hyperfocus } = await supabase
    .from('hyperfocus')
    .select('user_id')
    .eq('id', firstHyperfocusId)
    .maybeSingle();

  if (hyperfocus?.user_id !== userId) {
    throw new BusinessLogicError('Sessão não pertence ao usuário');
  }

  // 3. Verificar se já está ativa
  if (session.status === 'active') {
    throw new BusinessLogicError('Sessão já está ativa');
  }

  // 4. Atualizar status para 'active'
  const { error: updateError } = await supabase
    .from('alternancy_sessions')
    .update({
      status: 'active',
      started_at: new Date().toISOString(),
      current_index: 0,
    })
    .eq('id', validated.sessionId);

  if (updateError) {
    throw new DatabaseError('Falha ao iniciar alternância');
  }

  // 5. Retornar estado atualizado
  return {
    structuredContent: {
      type: 'alternancy_started',
      sessionId: validated.sessionId,
      status: 'active',
      startedAt: new Date().toISOString(),
      currentIndex: 0,
    },
    component: {
      type: 'expanded',
      name: 'AlternancyFlow',
      props: {
        sessionId: validated.sessionId,
        status: 'active',
        currentIndex: 0,
        startedAt: new Date().toISOString(),
        sequence: session.hyperfocus_sequence,
        transitionBreakMinutes: session.transition_break_minutes,
      },
    },
    textContent: '✅ Sessão de alternância iniciada! Timer ativo.',
  };
}

export const startAlternancyMetadata: McpToolMetadata = {
  name: 'startAlternancy',
  description: 'Inicia uma sessão de alternância previamente criada',
  inputSchema: startAlternancySchema,
  category: 'focus',
  requiredScope: AUTH_SCOPES.FOCUS_WRITE,
};
```

**Critérios de Aceitação:**
- [ ] Tool registrada no TOOL_REGISTRY
- [ ] Validação de ownership funcional
- [ ] Retorna componente AlternancyFlow com status 'active'
- [ ] Testes unitários passando

---

### Task 1.2: Criar `completeAlternancy` Tool
**Prioridade:** 🔴 CRÍTICA  
**Estimativa:** 2-3 horas  
**Arquivos:**
- [ ] Criar `src/lib/mcp/tools/completeAlternancy.ts`
- [ ] Adicionar ao `src/lib/mcp/tools/index.ts` (registry)
- [ ] Adicionar testes em `tests/unit/completeAlternancy.test.ts`

**Especificação:**
```typescript
// src/lib/mcp/tools/completeAlternancy.ts

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { McpToolMetadata, AUTH_SCOPES } from '../types/metadata';

const completeAlternancySchema = z.object({
  sessionId: z.string().uuid('sessionId inválido'),
  feedback: z.string().max(500).optional(),
});

export type CompleteAlternancyInput = z.infer<typeof completeAlternancySchema>;

export async function completeAlternancyHandler(
  input: CompleteAlternancyInput,
  userId: string
) {
  const supabase = await createClient();
  const validated = completeAlternancySchema.parse(input);

  // 1. Buscar sessão
  const { data: session, error: sessionError } = await supabase
    .from('alternancy_sessions')
    .select('*, hyperfocus_sequence')
    .eq('id', validated.sessionId)
    .maybeSingle();

  if (sessionError || !session) {
    throw new NotFoundError('Sessão de alternância');
  }

  // 2. Validar ownership
  const firstHyperfocusId = session.hyperfocus_sequence[0]?.hyperfocusId;
  const { data: hyperfocus } = await supabase
    .from('hyperfocus')
    .select('user_id')
    .eq('id', firstHyperfocusId)
    .maybeSingle();

  if (hyperfocus?.user_id !== userId) {
    throw new BusinessLogicError('Sessão não pertence ao usuário');
  }

  // 3. Calcular estatísticas
  const completedAt = new Date().toISOString();
  const startedAt = new Date(session.started_at);
  const actualDurationMinutes = Math.round(
    (new Date(completedAt).getTime() - startedAt.getTime()) / 1000 / 60
  );

  // 4. Atualizar status
  const { error: updateError } = await supabase
    .from('alternancy_sessions')
    .update({
      status: 'completed',
      completed_at: completedAt,
      actual_duration_minutes: actualDurationMinutes,
      feedback: validated.feedback,
    })
    .eq('id', validated.sessionId);

  if (updateError) {
    throw new DatabaseError('Falha ao completar alternância');
  }

  // 5. Calcular métricas de desempenho
  const plannedDuration = session.hyperfocus_sequence.reduce(
    (sum, h) => sum + h.durationMinutes,
    0
  );
  const efficiency = Math.round(
    (actualDurationMinutes / plannedDuration) * 100
  );

  return {
    structuredContent: {
      type: 'alternancy_completed',
      sessionId: validated.sessionId,
      status: 'completed',
      completedAt,
      actualDurationMinutes,
      plannedDurationMinutes: plannedDuration,
      efficiency,
      hyperfocusCount: session.hyperfocus_sequence.length,
    },
    component: {
      type: 'inline',
      name: 'AlternancyFlow',
      props: {
        sessionId: validated.sessionId,
        status: 'completed',
        completedAt,
        actualDurationMinutes,
        sequence: session.hyperfocus_sequence,
      },
    },
    textContent: `🎉 Sessão de alternância completada! ${actualDurationMinutes}min de foco em ${session.hyperfocus_sequence.length} hiperfocos.`,
  };
}

export const completeAlternancyMetadata: McpToolMetadata = {
  name: 'completeAlternancy',
  description: 'Marca uma sessão de alternância como completada e calcula estatísticas',
  inputSchema: completeAlternancySchema,
  category: 'focus',
  requiredScope: AUTH_SCOPES.FOCUS_WRITE,
};
```

**Critérios de Aceitação:**
- [ ] Tool registrada no TOOL_REGISTRY
- [ ] Calcula estatísticas de desempenho
- [ ] Atualiza status para 'completed'
- [ ] Testes unitários passando

---

### Task 1.3: Enriquecer Output de `endFocusTimer`
**Prioridade:** 🔴 CRÍTICA  
**Estimativa:** 3-4 horas  
**Arquivos:**
- [ ] Modificar `src/lib/mcp/tools/endFocusTimer.ts`
- [ ] Atualizar testes existentes

**Especificação:**
```typescript
// Adicionar ao final do endFocusTimerHandler, antes do return:

// Buscar tarefas do hiperfoco
const { data: allTasks } = await supabase
  .from('tasks')
  .select('id, title, completed')
  .eq('hyperfocus_id', session.hyperfocus_id);

const totalTasks = allTasks?.length || 0;
const completedTasks = allTasks?.filter(t => t.completed) || [];
const tasksCompleted = completedTasks.length;

// Calcular streak (sessões consecutivas nos últimos N dias)
const { data: recentSessions } = await supabase
  .from('focus_sessions')
  .select('ended_at')
  .eq('hyperfocus_id', session.hyperfocus_id)
  .not('ended_at', 'is', null)
  .order('ended_at', { ascending: false })
  .limit(10);

let streak = 0;
if (recentSessions) {
  const today = new Date().toISOString().split('T')[0];
  let currentDate = today;
  
  for (const s of recentSessions) {
    const sessionDate = new Date(s.ended_at).toISOString().split('T')[0];
    if (sessionDate === currentDate) {
      streak++;
      // Retroceder um dia
      const date = new Date(currentDate);
      date.setDate(date.getDate() - 1);
      currentDate = date.toISOString().split('T')[0];
    } else {
      break;
    }
  }
}

// Calcular tempo total de foco hoje
const todayStart = new Date();
todayStart.setHours(0, 0, 0, 0);

const { data: todaySessions } = await supabase
  .from('focus_sessions')
  .select('actual_duration_minutes')
  .gte('ended_at', todayStart.toISOString())
  .not('ended_at', 'is', null);

const totalFocusTimeToday = (todaySessions || []).reduce(
  (sum, s) => sum + (s.actual_duration_minutes || 0),
  0
);

// Gerar feedback baseado em desempenho
const efficiency = Math.round(
  (actualDuration / session.planned_duration_minutes) * 100
);

let feedback = '';
if (efficiency >= 95 && tasksCompleted >= totalTasks * 0.8) {
  feedback = '🌟 Sessão excepcional! Você manteve foco e completou a maioria das tarefas.';
} else if (efficiency >= 80) {
  feedback = '✨ Ótima sessão! Continue assim.';
} else if (efficiency >= 60) {
  feedback = '👍 Boa sessão! Há espaço para melhorar o tempo de foco.';
} else {
  feedback = '💪 Sessão desafiadora. Tente quebrar em sessões menores na próxima vez.';
}

// Retornar com dados enriquecidos
return {
  structuredContent: {
    // ... campos existentes
    tasksCompleted,
    totalTasks,
    streak,
    totalFocusTimeToday,
    feedback,
  },
  component: {
    type: 'expanded',
    name: 'FocusSessionSummary',
    props: {
      sessionId: validated.sessionId,
      hyperfocusId: session.hyperfocus_id,
      hyperfocusTitle: hyperfocus.title,
      startedAt: session.started_at,
      endedAt: new Date().toISOString(),
      plannedDurationMinutes: session.planned_duration_minutes,
      actualDurationMinutes: actualDuration,
      interrupted: validated.interrupted,
      tasksCompleted,
      totalTasks,
      completedTasks: completedTasks.map(t => ({
        id: t.id,
        title: t.title,
        completed: t.completed,
      })),
      feedback,
      streak,
      totalFocusTimeToday,
    },
  },
  textContent: `✅ Sessão finalizada: ${actualDuration}min de foco. ${tasksCompleted}/${totalTasks} tarefas completas.`,
};
```

**Critérios de Aceitação:**
- [ ] Output inclui `tasksCompleted`, `totalTasks`
- [ ] Output inclui `completedTasks` (array)
- [ ] Output inclui `feedback` (string motivacional)
- [ ] Output inclui `streak` (número de dias consecutivos)
- [ ] Output inclui `totalFocusTimeToday`
- [ ] Componente FocusSessionSummary renderiza corretamente
- [ ] Testes atualizados

---

### Task 1.4: Adicionar Error Handling em Componentes
**Prioridade:** 🔴 CRÍTICA  
**Estimativa:** 2 horas  
**Arquivos:**
- [ ] `src/components/AlternancyFlow.tsx`
- [ ] `src/components/FocusTimer.tsx`
- [ ] `src/components/SubtaskSuggestions.tsx`
- [ ] `src/components/TaskBreakdown.tsx`

**Especificação:**
```typescript
// Pattern a aplicar em TODOS os callTool:

const handleStart = useCallback(async () => {
  if (!window.openai?.callTool) {
    console.error('[AlternancyFlow] OpenAI client not initialized');
    // TODO: Adicionar toast de erro
    return;
  }

  if (!toolOutput?.sessionId) {
    console.error('[AlternancyFlow] Missing sessionId');
    return;
  }

  try {
    await window.openai.callTool('startAlternancy', {
      sessionId: toolOutput.sessionId,
    });
    
    // Update local state optimistically
    setWidgetState({
      currentIndex: 0,
      status: 'in_progress',
      timeLeftInCurrentPhase: (sequence[0]?.durationMinutes ?? 0) * 60,
    });
  } catch (error) {
    console.error('[AlternancyFlow] Failed to start alternancy:', error);
    
    // TODO: Adicionar toast de erro
    // toast.error('Falha ao iniciar alternância. Tente novamente.');
    
    // Rollback optimistic update se necessário
  }
}, [toolOutput?.sessionId, sequence, setWidgetState]);
```

**Critérios de Aceitação:**
- [ ] Todos os `callTool` têm try/catch
- [ ] Logs com prefixo `[ComponentName]` para debug
- [ ] Validação de `window.openai` antes de chamar
- [ ] Comentários `// TODO:` para adicionar toasts depois

---

## 🟡 SPRINT 2 - MÉDIA (Próxima Semana)

### Task 2.1: Criar `extendFocusTimer` Tool
**Prioridade:** 🟡 MÉDIA  
**Estimativa:** 2 horas  
**Arquivos:**
- [ ] Criar `src/lib/mcp/tools/extendFocusTimer.ts`
- [ ] Adicionar ao `src/lib/mcp/tools/index.ts` (registry)
- [ ] Adicionar testes

**Especificação:**
```typescript
// src/lib/mcp/tools/extendFocusTimer.ts

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { McpToolMetadata, AUTH_SCOPES } from '../types/metadata';

const extendFocusTimerSchema = z.object({
  sessionId: z.string().uuid('sessionId inválido'),
  additionalMinutes: z
    .number()
    .int()
    .min(1, 'Mínimo 1 minuto')
    .max(60, 'Máximo 60 minutos por extensão'),
});

export type ExtendFocusTimerInput = z.infer<typeof extendFocusTimerSchema>;

export async function extendFocusTimerHandler(
  input: ExtendFocusTimerInput,
  userId: string
) {
  const supabase = await createClient();
  const validated = extendFocusTimerSchema.parse(input);

  // 1. Buscar sessão ativa
  const { data: session, error: sessionError } = await supabase
    .from('focus_sessions')
    .select('id, hyperfocus_id, started_at, planned_duration_minutes, ended_at')
    .eq('id', validated.sessionId)
    .maybeSingle();

  if (sessionError || !session) {
    throw new NotFoundError('Sessão de foco');
  }

  // 2. Validar ownership
  const { data: hyperfocus } = await supabase
    .from('hyperfocus')
    .select('user_id, title')
    .eq('id', session.hyperfocus_id)
    .maybeSingle();

  if (hyperfocus?.user_id !== userId) {
    throw new BusinessLogicError('Sessão não pertence ao usuário');
  }

  // 3. Verificar se ainda está ativa
  if (session.ended_at) {
    throw new BusinessLogicError('Sessão já foi finalizada');
  }

  // 4. Calcular novo tempo total
  const newPlannedDuration =
    session.planned_duration_minutes + validated.additionalMinutes;

  // 5. Atualizar sessão
  const { error: updateError } = await supabase
    .from('focus_sessions')
    .update({
      planned_duration_minutes: newPlannedDuration,
    })
    .eq('id', validated.sessionId);

  if (updateError) {
    throw new DatabaseError('Falha ao estender timer');
  }

  // 6. Calcular novo endsAt
  const startedAt = new Date(session.started_at);
  const endsAt = new Date(
    startedAt.getTime() + newPlannedDuration * 60 * 1000
  ).toISOString();

  return {
    structuredContent: {
      type: 'timer_extended',
      sessionId: validated.sessionId,
      additionalMinutes: validated.additionalMinutes,
      newPlannedDuration,
      endsAt,
    },
    component: {
      type: 'expanded',
      name: 'FocusTimer',
      props: {
        sessionId: validated.sessionId,
        hyperfocusId: session.hyperfocus_id,
        hyperfocusTitle: hyperfocus.title,
        durationMinutes: newPlannedDuration,
        startedAt: session.started_at,
        endsAt,
        status: 'active',
      },
    },
    textContent: `⏰ Timer estendido em +${validated.additionalMinutes} minutos. Novo total: ${newPlannedDuration}min.`,
  };
}

export const extendFocusTimerMetadata: McpToolMetadata = {
  name: 'extendFocusTimer',
  description: 'Estende o tempo de uma sessão de foco ativa',
  inputSchema: extendFocusTimerSchema,
  category: 'focus',
  requiredScope: AUTH_SCOPES.FOCUS_WRITE,
};
```

**Critérios de Aceitação:**
- [ ] Tool registrada no TOOL_REGISTRY
- [ ] Valida sessão ativa
- [ ] Atualiza `planned_duration_minutes`
- [ ] Retorna novo `endsAt` calculado
- [ ] Testes passando

---

### Task 2.2: Criar `createTaskBatch` Tool
**Prioridade:** 🟡 MÉDIA  
**Estimativa:** 3 horas  
**Arquivos:**
- [ ] Criar `src/lib/mcp/tools/createTaskBatch.ts`
- [ ] Adicionar ao `src/lib/mcp/tools/index.ts` (registry)
- [ ] Adicionar testes

**Especificação:**
```typescript
// src/lib/mcp/tools/createTaskBatch.ts

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { McpToolMetadata, AUTH_SCOPES } from '../types/metadata';

const taskInputSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  estimatedMinutes: z.number().int().positive().max(480).optional(),
});

const createTaskBatchSchema = z.object({
  hyperfocusId: z.string().uuid('hyperfocusId inválido'),
  tasks: z
    .array(taskInputSchema)
    .min(1, 'Pelo menos uma tarefa é necessária')
    .max(20, 'Máximo 20 tarefas por lote'),
});

export type CreateTaskBatchInput = z.infer<typeof createTaskBatchSchema>;

export async function createTaskBatchHandler(
  input: CreateTaskBatchInput,
  userId: string
) {
  const supabase = await createClient();
  const validated = createTaskBatchSchema.parse(input);

  // 1. Validar hiperfoco
  const { data: hyperfocus, error: hyperfocusError } = await supabase
    .from('hyperfocus')
    .select('id, title, user_id')
    .eq('id', validated.hyperfocusId)
    .eq('user_id', userId)
    .maybeSingle();

  if (hyperfocusError || !hyperfocus) {
    throw new NotFoundError('Hiperfoco');
  }

  // 2. Buscar próximo order_index
  const { data: maxOrderResult } = await supabase
    .from('tasks')
    .select('order_index')
    .eq('hyperfocus_id', validated.hyperfocusId)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle();

  let nextOrder = (maxOrderResult?.order_index ?? -1) + 1;

  // 3. Preparar array de inserts
  const tasksToInsert = validated.tasks.map((task, index) => ({
    hyperfocus_id: validated.hyperfocusId,
    title: task.title,
    description: task.description,
    estimated_minutes: task.estimatedMinutes,
    order_index: nextOrder + index,
    completed: false,
  }));

  // 4. Inserir todas as tarefas em uma transação
  const { data: createdTasks, error: insertError } = await supabase
    .from('tasks')
    .insert(tasksToInsert)
    .select('id, title, description, estimated_minutes, completed, order_index');

  if (insertError) {
    throw new DatabaseError('Falha ao criar tarefas em lote');
  }

  // 5. Buscar todas as tarefas do hiperfoco (para retornar lista completa)
  const { data: allTasks } = await supabase
    .from('tasks')
    .select('id, title, completed')
    .eq('hyperfocus_id', validated.hyperfocusId)
    .order('order_index', { ascending: true });

  return {
    structuredContent: {
      type: 'tasks_batch_created',
      hyperfocusId: validated.hyperfocusId,
      hyperfocusTitle: hyperfocus.title,
      createdCount: createdTasks?.length || 0,
      createdTasks: createdTasks?.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        estimatedMinutes: t.estimated_minutes,
        completed: t.completed,
      })),
    },
    component: {
      type: 'inline',
      name: 'TaskBreakdown',
      props: {
        hyperfocusId: validated.hyperfocusId,
        hyperfocusTitle: hyperfocus.title,
        tasks: allTasks?.map(t => ({
          id: t.id,
          title: t.title,
          completed: t.completed,
        })) || [],
      },
    },
    textContent: `✅ ${createdTasks?.length || 0} tarefas criadas para "${hyperfocus.title}"`,
  };
}

export const createTaskBatchMetadata: McpToolMetadata = {
  name: 'createTaskBatch',
  description: 'Cria múltiplas tarefas de uma vez para um hiperfoco',
  inputSchema: createTaskBatchSchema,
  category: 'tasks',
  requiredScope: AUTH_SCOPES.TASKS_WRITE,
};
```

**Critérios de Aceitação:**
- [ ] Tool registrada no TOOL_REGISTRY
- [ ] Insere todas as tarefas em uma transação
- [ ] Mantém order_index sequencial
- [ ] Retorna TaskBreakdown com lista completa
- [ ] Testes passando

---

### Task 2.3: Alinhar Input de `startFocusTimer`
**Prioridade:** 🟡 MÉDIA  
**Estimativa:** 1 hora  
**Arquivos:**
- [ ] Modificar `src/lib/mcp/tools/startFocusTimer.ts`

**Especificação:**
```typescript
// Substituir o schema atual por:

const startFocusTimerSchema = z.object({
  hyperfocusId: z.string().uuid('hyperfocusId inválido'),
  hyperfocusTitle: z.string().optional(), // Aceitar mas não usar (legacy)
  durationMinutes: z
    .number()
    .int('Duração deve ser um número inteiro')
    .min(1, 'Duração mínima é 1 minuto')
    .max(180, 'Duração máxima é 180 minutos (3 horas)'),
  alarmSound: z
    .enum(['gentle-bell', 'soft-chime', 'vibrate', 'none'])
    .optional()
    .default('soft-chime'),
  gentleEnd: z.boolean().optional().default(true),
});

// No handler, usar alarmSound no output:
return {
  structuredContent: {
    // ...
    alarmSound: validated.alarmSound,
    gentleEnd: validated.gentleEnd,
  },
  component: {
    type: 'expanded',
    name: 'FocusTimer',
    props: {
      // ...
      alarmSound: validated.alarmSound,
      gentleEnd: validated.gentleEnd,
    },
  },
};
```

**Critérios de Aceitação:**
- [ ] Schema aceita `alarmSound` e `gentleEnd`
- [ ] Output inclui esses campos
- [ ] Backward compatible (campos opcionais)
- [ ] Testes atualizados

---

### Task 2.4: Padronizar Enums de Status
**Prioridade:** 🟡 MÉDIA  
**Estimativa:** 2 horas  
**Arquivos:**
- [ ] Criar `src/types/components.ts`
- [ ] Atualizar `src/lib/mcp/tools/createAlternancy.ts`
- [ ] Atualizar `src/components/AlternancyFlow.tsx`

**Especificação:**
```typescript
// src/types/components.ts

/**
 * Status de uma sessão de alternância ou foco
 */
export type SessionStatus =
  | 'not_started' // Frontend-friendly
  | 'active'      // Durante execução
  | 'on_break'    // Em pausa/break
  | 'completed'   // Finalizado
  | 'cancelled';  // Cancelado

/**
 * Status de backend (para compatibilidade)
 * @deprecated Use SessionStatus instead
 */
export type LegacySessionStatus = 'planned' | 'active' | 'completed';

/**
 * Converte status de backend para frontend
 */
export function normalizeSessionStatus(
  status: SessionStatus | LegacySessionStatus
): SessionStatus {
  if (status === 'planned') return 'not_started';
  return status as SessionStatus;
}

/**
 * Tipos de sons de alarme
 */
export type AlarmSound =
  | 'gentle-bell'
  | 'soft-chime'
  | 'vibrate'
  | 'none';

/**
 * Complexidade de tarefas
 */
export type ComplexityLevel = 'low' | 'medium' | 'high' | 'very_high';

/**
 * Prioridade de tarefas
 */
export type PriorityLevel = 'urgent' | 'high' | 'medium' | 'low';
```

**Critérios de Aceitação:**
- [ ] Types compartilhados criados
- [ ] Função `normalizeSessionStatus` implementada
- [ ] Backend usa 'not_started' em vez de 'planned'
- [ ] Frontend importa types compartilhados
- [ ] Testes passando

---

## 🟢 SPRINT 3 - REFACTOR (Quando Possível)

### Task 3.1: Remover `hyperfocusId` de `updateTaskStatus`
**Prioridade:** 🟢 BAIXA  
**Estimativa:** 30 minutos  
**Arquivos:**
- [ ] `src/components/TaskBreakdown.tsx`
- [ ] `src/components/HyperfocusList.tsx`

**Especificação:**
```typescript
// Substituir:
await window.openai.callTool('updateTaskStatus', {
  hyperfocusId,
  taskId,
  completed: nextCompleted,
});

// Por:
await window.openai.callTool('updateTaskStatus', {
  taskId,
  completed: nextCompleted,
});
```

**Critérios de Aceitação:**
- [ ] Parâmetro `hyperfocusId` removido de todas as chamadas
- [ ] Funcionalidade mantida
- [ ] Testes passando

---

### Task 3.2: Criar Documentação de API Contracts
**Prioridade:** 🟢 BAIXA  
**Estimativa:** 2 horas  
**Arquivos:**
- [ ] Criar `docs/API-CONTRACTS.md`

**Especificação:**
```markdown
# API Contracts: Backend ↔ Frontend

## Tools Overview

| Tool Name | Input | Output | Component |
|-----------|-------|--------|-----------|
| createHyperfocus | ... | ... | HyperfocusCard |
| startFocusTimer | ... | ... | FocusTimer |
| ... | ... | ... | ... |

## Detailed Contracts

### `startFocusTimer`

**Input:**
```typescript
{
  hyperfocusId: string;        // UUID
  durationMinutes: number;     // 1-180
  alarmSound?: AlarmSound;     // optional
  gentleEnd?: boolean;         // optional
}
```

**Output:**
```typescript
{
  sessionId: string;
  startedAt: string;           // ISO 8601
  endsAt: string;              // ISO 8601
  status: 'active';
}
```

**Component:** FocusTimer (expanded mode)

---

... (documentar todas as tools)
```

**Critérios de Aceitação:**
- [ ] Todas as tools documentadas
- [ ] Inputs e outputs com tipos TypeScript
- [ ] Exemplos de uso
- [ ] Links para componentes

---

### Task 3.3: Criar Script de Validação
**Prioridade:** 🟢 BAIXA  
**Estimativa:** 3 horas  
**Arquivos:**
- [ ] Criar `scripts/validate-backend-frontend.sh`
- [ ] Criar `scripts/audit-api-alignment.ts`
- [ ] Adicionar ao `package.json` como script

**Especificação:**
```bash
#!/bin/bash
# scripts/validate-backend-frontend.sh

echo "🔍 Validando alinhamento Backend ↔ Frontend..."

# Buscar todos os callTool no frontend
echo "\n📱 Tools chamadas no Frontend:"
grep -rh "callTool(" src/components/*.tsx | \
  sed "s/.*callTool('\([^']*\)'.*/\1/" | \
  sort -u > /tmp/frontend-tools.txt

# Buscar todos os handlers no backend
echo "\n🔧 Tools registradas no Backend:"
grep ":" src/lib/mcp/tools/index.ts | \
  grep -v "^//" | \
  grep -v "handler:" | \
  grep -v "metadata:" | \
  sed 's/[: {].*//g' | \
  sed 's/^[[:space:]]*//' | \
  grep -v "^$" | \
  sort -u > /tmp/backend-tools.txt

# Comparar
echo "\n❌ Tools faltantes no backend:"
comm -23 /tmp/frontend-tools.txt /tmp/backend-tools.txt

echo "\n⚠️  Tools no backend não usadas no frontend:"
comm -13 /tmp/frontend-tools.txt /tmp/backend-tools.txt

echo "\n✅ Tools alinhadas:"
comm -12 /tmp/frontend-tools.txt /tmp/backend-tools.txt

# Cleanup
rm /tmp/frontend-tools.txt /tmp/backend-tools.txt
```

```json
// Adicionar ao package.json:
{
  "scripts": {
    "validate:api": "bash scripts/validate-backend-frontend.sh",
    "audit:api": "tsx scripts/audit-api-alignment.ts"
  }
}
```

**Critérios de Aceitação:**
- [ ] Script identifica tools faltantes
- [ ] Script roda via npm/yarn
- [ ] Saída formatada e clara
- [ ] Retorna exit code != 0 se encontrar problemas

---

### Task 3.4: Adicionar Testes de Integração E2E
**Prioridade:** 🟢 BAIXA  
**Estimativa:** 4 horas  
**Arquivos:**
- [ ] Criar `tests/e2e/alternancy-flow.e2e.test.ts`
- [ ] Criar `tests/e2e/focus-timer.e2e.test.ts`
- [ ] Criar `tests/e2e/task-management.e2e.test.ts`

**Especificação:**
```typescript
// tests/e2e/alternancy-flow.e2e.test.ts

import { test, expect } from '@playwright/test';

test.describe('Alternancy Flow E2E', () => {
  test('should create and start alternancy session', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');

    // 2. Navigate to chat
    await page.goto('/chat');

    // 3. Create alternancy
    await page.fill('[data-testid="chat-input"]', 'Criar alternância entre "Projeto A" e "Projeto B"');
    await page.click('[data-testid="send-button"]');

    // 4. Wait for AlternancyFlow component
    await expect(page.locator('[data-component="AlternancyFlow"]')).toBeVisible();

    // 5. Click start button
    await page.click('button:has-text("Começar")');

    // 6. Verify status changed to active
    await expect(page.locator('[data-status="active"]')).toBeVisible();
    await expect(page.locator('[data-testid="timer"]')).toBeVisible();
  });

  test('should complete alternancy session', async ({ page }) => {
    // ... similar flow
    await page.click('button:has-text("Completar")');
    await expect(page.locator('[data-status="completed"]')).toBeVisible();
  });
});
```

**Critérios de Aceitação:**
- [ ] Testes cobrem fluxos críticos
- [ ] Testes rodam com Playwright/Cypress
- [ ] Testes passam no CI/CD
- [ ] Coverage > 70% dos componentes principais

---

## 📊 Checklist Geral de Progresso

### 🔴 Sprint 1 - CRÍTICO ✅ CONCLUÍDO
- [x] Task 1.1: `startAlternancy` tool ✅
- [x] Task 1.2: `completeAlternancy` tool ✅
- [x] Task 1.3: Enriquecer `endFocusTimer` ✅
- [x] Task 1.4: Error handling em componentes ✅

**Status Sprint 1:** ✅ **4/4 tarefas completadas** - Ver [SPRINT-1-CONCLUSAO.md](./SPRINT-1-CONCLUSAO.md)

### 🟡 Sprint 2 - MÉDIA
- [ ] Task 2.1: `extendFocusTimer` tool
- [ ] Task 2.2: `createTaskBatch` tool
- [ ] Task 2.3: Alinhar input `startFocusTimer`
- [ ] Task 2.4: Padronizar enums de status

### 🟢 Sprint 3 - REFACTOR
- [ ] Task 3.1: Remover `hyperfocusId` extra
- [ ] Task 3.2: Documentação API Contracts
- [ ] Task 3.3: Script de validação
- [ ] Task 3.4: Testes E2E

---

## 📈 Métricas de Sucesso

| Métrica | Antes | Meta | Após |
|---------|-------|------|------|
| Tools faltantes | 6 | 0 | __ |
| Schemas desalinhados | 3 | 0 | __ |
| Componentes com error handling | 0 | 8 | __ |
| Coverage de testes | ~40% | >70% | __ |
| Botões quebrados | 5 | 0 | __ |

---

## 🔄 Processo de Implementação

### Para cada task:
1. [ ] Criar branch `fix/task-X-Y`
2. [ ] Implementar código
3. [ ] Adicionar/atualizar testes
4. [ ] Rodar `npm run validate:api`
5. [ ] Commit com mensagem descritiva
6. [ ] Push e criar PR
7. [ ] Code review
8. [ ] Merge após aprovação
9. [ ] Atualizar checklist neste documento

---

## 📝 Notas e Observações

### Ordem de implementação sugerida:
1. **Task 1.1 + 1.2** (startAlternancy + completeAlternancy) → Desbloqueia AlternancyFlow
2. **Task 1.3** (endFocusTimer enriquecido) → Desbloqueia FocusSessionSummary
3. **Task 1.4** (error handling) → Melhora UX em todos os componentes
4. **Task 2.2** (createTaskBatch) → Otimiza SubtaskSuggestions
5. **Task 2.1** (extendFocusTimer) → Feature nice-to-have
6. Sprint 3 conforme tempo disponível

### Dependências entre tasks:
- Task 2.4 deve ser feita antes de refatorar outros componentes
- Task 3.2 (documentação) pode ser feita em paralelo
- Task 3.3 (script validação) ajuda a validar outras tasks

---

**Criado por:** GitHub Copilot  
**Data:** 12/10/2025  
**Última atualização:** 12/10/2025  
**Status:** 📋 Pronto para implementação
