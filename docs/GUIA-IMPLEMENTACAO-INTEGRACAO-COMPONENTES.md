# 📚 Guia de Implementação: Integração Componentes + Supabase

> **Para desenvolvedores júnior/intermediário**  
> **Data:** 13 de outubro de 2025  
> **Objetivo:** Conectar componentes UI ao Supabase para persistência real de dados

---

## 🎯 Visão Geral do Problema

### Situação Atual (❌ PROBLEMA)

```
Usuário clica em "Concluir Tarefa"
        ↓
Componente atualiza estado local (React)
        ↓
Componente chama window.openai.callTool()
        ↓
Espera ChatGPT chamar a MCP Tool
        ↓
MCP Tool salva no Supabase
```

**Problemas:**
- ❌ Se ChatGPT falhar, nada é salvo
- ❌ Delay na resposta (latência)
- ❌ Usuário não vê feedback imediato
- ❌ Sem sincronização em tempo real

### Situação Desejada (✅ SOLUÇÃO)

```
Usuário clica em "Concluir Tarefa"
        ↓
Componente chama hook direto (ex: useTasks)
        ↓
Hook salva imediatamente no Supabase
        ↓
UI atualiza instantaneamente
        ↓
Supabase Realtime notifica outros clients
```

**Benefícios:**
- ✅ Persistência garantida
- ✅ Feedback instantâneo
- ✅ Sincronização em tempo real
- ✅ Funciona offline (com retry)

---

## 📋 Plano de Implementação

### FASE 1: Criar Hooks de Integração (2-3 horas)
### FASE 2: Refatorar Componentes (3-4 horas)
### FASE 3: Escrever Testes (2-3 horas)
### FASE 4: Documentar e Revisar (1 hora)

---

# 🚀 FASE 1: Criar Hooks de Integração

## 1.1 - Hook `useHyperfocus` (45 min)

### Objetivo
Criar um hook React que gerencia CRUD de Hiperfocos com Supabase.

### Pré-requisitos
✅ Já existe: `HyperfocusService` (`src/lib/services/hyperfocus.service.ts`)  
✅ Já existe: `queries.ts` com funções do Supabase

### Passo a Passo

#### **Passo 1: Criar arquivo do hook**

📁 Criar: `/src/lib/hooks/useHyperfocus.ts`

```typescript
/**
 * Hook: useHyperfocus
 * Gerencia operações CRUD de Hiperfocos com Supabase
 */

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { HyperfocusService } from '@/lib/services/hyperfocus.service';
import { Database } from '@/types/database';

// Type alias para facilitar
type Hyperfocus = Database['public']['Tables']['hyperfocus']['Row'];

// Interface do hook (o que ele retorna)
interface UseHyperfocusReturn {
  // Estado
  hyperfocus: Hyperfocus | null;
  hyperfocusList: Hyperfocus[];
  loading: boolean;
  error: string | null;
  
  // Ações
  createHyperfocus: (data: CreateHyperfocusData) => Promise<Hyperfocus | null>;
  updateHyperfocus: (id: string, data: UpdateHyperfocusData) => Promise<Hyperfocus | null>;
  deleteHyperfocus: (id: string) => Promise<boolean>;
  loadHyperfocus: (id: string) => Promise<void>;
  loadHyperfocusList: () => Promise<void>;
  clearError: () => void;
}

// Dados necessários para criar hiperfoco
interface CreateHyperfocusData {
  title: string;
  description?: string;
  color?: string;
  estimated_time_minutes?: number;
}

// Dados necessários para atualizar hiperfoco
interface UpdateHyperfocusData {
  title?: string;
  description?: string;
  color?: string;
  estimated_time_minutes?: number;
  archived?: boolean;
}

export function useHyperfocus(userId: string): UseHyperfocusReturn {
  // ===== ESTADOS =====
  const [hyperfocus, setHyperfocus] = useState<Hyperfocus | null>(null);
  const [hyperfocusList, setHyperfocusList] = useState<Hyperfocus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ===== AÇÃO 1: Criar Hiperfoco =====
  const createHyperfocus = useCallback(
    async (data: CreateHyperfocusData): Promise<Hyperfocus | null> => {
      // 1. Iniciar loading
      setLoading(true);
      setError(null);

      try {
        // 2. Criar cliente Supabase
        const supabase = createClient();
        
        // 3. Criar instância do service
        const service = new HyperfocusService(supabase);
        
        // 4. Chamar método do service
        const newHyperfocus = await service.create(userId, data);
        
        // 5. Atualizar estado local
        setHyperfocus(newHyperfocus);
        setHyperfocusList((prev) => [newHyperfocus, ...prev]);
        
        // 6. Log de sucesso
        console.log('[useHyperfocus] Created:', newHyperfocus.id);
        
        // 7. Retornar resultado
        return newHyperfocus;
      } catch (err) {
        // 8. Tratar erro
        const errorMessage = err instanceof Error ? err.message : 'Erro ao criar hiperfoco';
        setError(errorMessage);
        console.error('[useHyperfocus] Error:', err);
        return null;
      } finally {
        // 9. Finalizar loading
        setLoading(false);
      }
    },
    [userId]
  );

  // ===== AÇÃO 2: Atualizar Hiperfoco =====
  const updateHyperfocus = useCallback(
    async (id: string, data: UpdateHyperfocusData): Promise<Hyperfocus | null> => {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const service = new HyperfocusService(supabase);
        
        const updated = await service.update(userId, id, data);
        
        // Atualizar no estado único
        if (hyperfocus?.id === id) {
          setHyperfocus(updated);
        }
        
        // Atualizar na lista
        setHyperfocusList((prev) =>
          prev.map((h) => (h.id === id ? updated : h))
        );
        
        console.log('[useHyperfocus] Updated:', id);
        return updated;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar hiperfoco';
        setError(errorMessage);
        console.error('[useHyperfocus] Error:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [userId, hyperfocus]
  );

  // ===== AÇÃO 3: Deletar Hiperfoco =====
  const deleteHyperfocus = useCallback(
    async (id: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const service = new HyperfocusService(supabase);
        
        await service.delete(userId, id);
        
        // Remover do estado
        if (hyperfocus?.id === id) {
          setHyperfocus(null);
        }
        
        setHyperfocusList((prev) => prev.filter((h) => h.id !== id));
        
        console.log('[useHyperfocus] Deleted:', id);
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar hiperfoco';
        setError(errorMessage);
        console.error('[useHyperfocus] Error:', err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [userId, hyperfocus]
  );

  // ===== AÇÃO 4: Carregar Hiperfoco por ID =====
  const loadHyperfocus = useCallback(
    async (id: string): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const service = new HyperfocusService(supabase);
        
        const data = await service.getById(userId, id);
        setHyperfocus(data);
        
        console.log('[useHyperfocus] Loaded:', id);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar hiperfoco';
        setError(errorMessage);
        console.error('[useHyperfocus] Error:', err);
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  // ===== AÇÃO 5: Carregar Lista de Hiperfocos =====
  const loadHyperfocusList = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const service = new HyperfocusService(supabase);
      
      const list = await service.list(userId, {
        archived: false,
        limit: 50,
      });
      
      setHyperfocusList(list);
      console.log('[useHyperfocus] List loaded:', list.length);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar lista';
      setError(errorMessage);
      console.error('[useHyperfocus] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // ===== AÇÃO 6: Limpar Erro =====
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ===== RETORNAR INTERFACE DO HOOK =====
  return {
    hyperfocus,
    hyperfocusList,
    loading,
    error,
    createHyperfocus,
    updateHyperfocus,
    deleteHyperfocus,
    loadHyperfocus,
    loadHyperfocusList,
    clearError,
  };
}
```

#### **Passo 2: Testar o hook manualmente**

📁 Criar: `/src/app/test-hook/page.tsx` (temporário)

```typescript
'use client';

import { useHyperfocus } from '@/lib/hooks/useHyperfocus';
import { useEffect } from 'react';

export default function TestHookPage() {
  const userId = 'test-user-id'; // Substituir por ID real
  const { hyperfocusList, loading, error, loadHyperfocusList, createHyperfocus } = useHyperfocus(userId);

  useEffect(() => {
    loadHyperfocusList();
  }, [loadHyperfocusList]);

  const handleCreate = async () => {
    await createHyperfocus({
      title: 'Teste Manual',
      description: 'Criado pelo hook',
      color: 'blue',
    });
  };

  return (
    <div className="p-8">
      <h1>Test useHyperfocus Hook</h1>
      
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      
      <button onClick={handleCreate} className="bg-blue-500 text-white px-4 py-2 rounded">
        Create Test Hyperfocus
      </button>
      
      <ul>
        {hyperfocusList.map((h) => (
          <li key={h.id}>{h.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

#### **Passo 3: Testar no navegador**

1. Rodar o projeto: `npm run dev`
2. Acessar: `http://localhost:3000/test-hook`
3. Verificar:
   - ✅ Lista carrega sem erros
   - ✅ Botão cria novo hiperfoco
   - ✅ Lista atualiza automaticamente

---

## 1.2 - Hook `useTasks` (45 min)

### Objetivo
Criar hook para gerenciar CRUD de Tarefas.

### Passo a Passo

📁 Criar: `/src/lib/hooks/useTasks.ts`

```typescript
/**
 * Hook: useTasks
 * Gerencia operações CRUD de Tarefas com Supabase
 */

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TaskService } from '@/lib/services/task.service';
import { Database } from '@/types/database';

type Task = Database['public']['Tables']['tasks']['Row'];

interface UseTasksReturn {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  
  loadTasks: (hyperfocusId: string) => Promise<void>;
  createTask: (data: CreateTaskData) => Promise<Task | null>;
  updateTask: (id: string, data: UpdateTaskData) => Promise<Task | null>;
  toggleTaskComplete: (id: string) => Promise<boolean>;
  deleteTask: (id: string) => Promise<boolean>;
  clearError: () => void;
}

interface CreateTaskData {
  hyperfocus_id: string;
  title: string;
  description?: string;
  estimated_minutes?: number;
}

interface UpdateTaskData {
  title?: string;
  description?: string;
  completed?: boolean;
  estimated_minutes?: number;
}

export function useTasks(userId: string): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar tarefas de um hiperfoco
  const loadTasks = useCallback(
    async (hyperfocusId: string): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const service = new TaskService(supabase);
        
        const list = await service.list(userId, hyperfocusId);
        setTasks(list);
        
        console.log('[useTasks] Loaded:', list.length);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar tarefas';
        setError(errorMessage);
        console.error('[useTasks] Error:', err);
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  // Criar tarefa
  const createTask = useCallback(
    async (data: CreateTaskData): Promise<Task | null> => {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const service = new TaskService(supabase);
        
        const newTask = await service.create(userId, data);
        setTasks((prev) => [...prev, newTask]);
        
        console.log('[useTasks] Created:', newTask.id);
        return newTask;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao criar tarefa';
        setError(errorMessage);
        console.error('[useTasks] Error:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  // Atualizar tarefa
  const updateTask = useCallback(
    async (id: string, data: UpdateTaskData): Promise<Task | null> => {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const service = new TaskService(supabase);
        
        const updated = await service.update(userId, id, data);
        setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
        
        console.log('[useTasks] Updated:', id);
        return updated;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar tarefa';
        setError(errorMessage);
        console.error('[useTasks] Error:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  // Toggle completed (ação mais comum)
  const toggleTaskComplete = useCallback(
    async (id: string): Promise<boolean> => {
      // 1. Otimistic update (atualiza UI antes de salvar)
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, completed: !t.completed } : t
        )
      );

      try {
        const supabase = createClient();
        const service = new TaskService(supabase);
        
        const task = tasks.find((t) => t.id === id);
        if (!task) return false;
        
        await service.update(userId, id, { completed: !task.completed });
        
        console.log('[useTasks] Toggled:', id);
        return true;
      } catch (err) {
        // 2. Reverter otimistic update em caso de erro
        setTasks((prev) =>
          prev.map((t) =>
            t.id === id ? { ...t, completed: !t.completed } : t
          )
        );
        
        const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar tarefa';
        setError(errorMessage);
        console.error('[useTasks] Error:', err);
        return false;
      }
    },
    [userId, tasks]
  );

  // Deletar tarefa
  const deleteTask = useCallback(
    async (id: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const service = new TaskService(supabase);
        
        await service.delete(userId, id);
        setTasks((prev) => prev.filter((t) => t.id !== id));
        
        console.log('[useTasks] Deleted:', id);
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar tarefa';
        setError(errorMessage);
        console.error('[useTasks] Error:', err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    tasks,
    loading,
    error,
    loadTasks,
    createTask,
    updateTask,
    toggleTaskComplete,
    deleteTask,
    clearError,
  };
}
```

---

## 1.3 - Hook `useFocusSession` (30 min)

### Objetivo
Gerenciar sessões de foco (timer).

📁 Criar: `/src/lib/hooks/useFocusSession.ts`

```typescript
/**
 * Hook: useFocusSession
 * Gerencia sessões de foco e timer
 */

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TimerService } from '@/lib/services/timer.service';
import { Database } from '@/types/database';

type FocusSession = Database['public']['Tables']['focus_sessions']['Row'];

interface UseFocusSessionReturn {
  session: FocusSession | null;
  loading: boolean;
  error: string | null;
  
  startSession: (hyperfocusId: string, durationMinutes: number) => Promise<FocusSession | null>;
  endSession: (sessionId: string, completed: boolean) => Promise<boolean>;
  loadActiveSession: () => Promise<void>;
  clearError: () => void;
}

export function useFocusSession(userId: string): UseFocusSessionReturn {
  const [session, setSession] = useState<FocusSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startSession = useCallback(
    async (hyperfocusId: string, durationMinutes: number): Promise<FocusSession | null> => {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const service = new TimerService(supabase);
        
        const newSession = await service.start(userId, hyperfocusId, durationMinutes);
        setSession(newSession);
        
        console.log('[useFocusSession] Started:', newSession.id);
        return newSession;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao iniciar sessão';
        setError(errorMessage);
        console.error('[useFocusSession] Error:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  const endSession = useCallback(
    async (sessionId: string, completed: boolean): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const service = new TimerService(supabase);
        
        await service.end(userId, sessionId, completed);
        setSession(null);
        
        console.log('[useFocusSession] Ended:', sessionId);
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao finalizar sessão';
        setError(errorMessage);
        console.error('[useFocusSession] Error:', err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  const loadActiveSession = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      
      // Buscar sessão ativa do usuário
      const { data, error: queryError } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', userId)
        .is('ended_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (queryError) throw queryError;
      
      setSession(data);
      console.log('[useFocusSession] Active session:', data?.id || 'none');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar sessão';
      setError(errorMessage);
      console.error('[useFocusSession] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    session,
    loading,
    error,
    startSession,
    endSession,
    loadActiveSession,
    clearError,
  };
}
```

---

# 🔄 FASE 2: Refatorar Componentes

## 2.1 - Refatorar `HyperfocusCard.tsx` (30 min)

### Objetivo
Adicionar persistência direta ao clicar em ações.

### Antes (❌ Problema)
```typescript
// Apenas dispara mensagem para ChatGPT
await window.openai.sendFollowUpMessage({
  prompt: `Criar tarefas para o hiperfoco "${hyperfocus.title}"`,
});
```

### Depois (✅ Solução)

📁 Editar: `/src/components/HyperfocusCard.tsx`

Adicionar no início do componente:

```typescript
import { useHyperfocus } from '@/lib/hooks/useHyperfocus';
import { useAuth } from '@/lib/hooks/useAuth'; // assumindo que existe

export function HyperfocusCard() {
  const toolOutput = useToolOutput<HyperfocusCardOutput>();
  const theme = useTheme();
  
  // NOVO: Adicionar hooks
  const { user } = useAuth(); // ou pegar userId de outra forma
  const { updateHyperfocus, loading: saving } = useHyperfocus(user?.id || '');

  const hyperfocus = toolOutput?.hyperfocus;

  // MODIFICAR: handleStartTimer para salvar direto
  const handleStartTimer = useCallback(async () => {
    if (!hyperfocus?.id || !user?.id) return;

    // 1. Salvar no Supabase ANTES de chamar ChatGPT
    const updated = await updateHyperfocus(hyperfocus.id, {
      // Marcar como "em foco" ou atualizar timestamp
    });

    if (!updated) {
      // Mostrar erro
      return;
    }

    // 2. Depois chamar ChatGPT para criar o timer visual
    if (window.openai?.callTool) {
      await window.openai.callTool('startFocusTimer', {
        hyperfocusId: hyperfocus.id,
        hyperfocusTitle: hyperfocus.title,
        durationMinutes: hyperfocus.estimatedTimeMinutes ?? 30,
      });
    }
  }, [hyperfocus, user, updateHyperfocus]);

  // ... resto do componente
}
```

---

## 2.2 - Refatorar `TaskBreakdown.tsx` (45 min)

### Objetivo
Toggle de tarefas salva direto no Supabase.

📁 Editar: `/src/components/TaskBreakdown.tsx`

```typescript
import { useTasks } from '@/lib/hooks/useTasks';
import { useAuth } from '@/lib/hooks/useAuth';
import { useEffect } from 'react';

export function TaskBreakdown(props: TaskBreakdownProps = {}) {
  const toolInput = useToolInput<TaskBreakdownInput>();
  const toolOutput = useToolOutput<TaskBreakdownOutput>();
  const theme = useTheme();

  const data = {
    ...toolInput,
    ...toolOutput,
    ...props,
  };

  const hyperfocusId = data?.hyperfocusId ?? '';
  
  // NOVO: Hooks
  const { user } = useAuth();
  const { 
    tasks: tasksFromHook, 
    loading: loadingTasks, 
    toggleTaskComplete,
    loadTasks 
  } = useTasks(user?.id || '');

  // Usar tasks do hook se disponível, senão fallback para toolOutput
  const tasks = tasksFromHook.length > 0 ? tasksFromHook : (data?.tasks ?? []);

  // Carregar tasks quando montar
  useEffect(() => {
    if (hyperfocusId && user?.id) {
      loadTasks(hyperfocusId);
    }
  }, [hyperfocusId, user?.id, loadTasks]);

  // MODIFICAR: handleToggle para salvar direto
  const handleToggle = useCallback(
    async (taskId: string) => {
      if (!user?.id) return;

      // Salvar direto no Supabase (com optimistic update)
      const success = await toggleTaskComplete(taskId);

      if (!success) {
        // Mostrar toast de erro
        console.error('Falha ao atualizar tarefa');
      }

      // OPCIONAL: Ainda chamar ChatGPT para feedback
      if (window.openai?.callTool) {
        await window.openai.callTool('updateTaskStatus', {
          taskId,
          completed: !tasks.find(t => t.id === taskId)?.completed,
        });
      }
    },
    [user, toggleTaskComplete, tasks]
  );

  // ... resto do componente
}
```

---

## 2.3 - Refatorar `FocusTimer.tsx` (60 min)

### Objetivo
Persistir estado do timer (pausas, conclusão).

📁 Editar: `/src/components/FocusTimer.tsx`

```typescript
import { useFocusSession } from '@/lib/hooks/useFocusSession';
import { useAuth } from '@/lib/hooks/useAuth';

export function FocusTimer(props: FocusTimerProps = {}) {
  const toolInput = useToolInput<FocusTimerInput>();
  const toolOutput = useToolOutput<FocusTimerOutput>();
  const theme = useTheme();

  const data = { ...toolInput, ...toolOutput, ...props };
  
  // NOVO: Hooks
  const { user } = useAuth();
  const { 
    session: activeSession, 
    endSession,
    loadActiveSession 
  } = useFocusSession(user?.id || '');

  const sessionId = data?.sessionId || activeSession?.id;

  // Carregar sessão ativa ao montar
  useEffect(() => {
    if (user?.id && !sessionId) {
      loadActiveSession();
    }
  }, [user?.id, sessionId, loadActiveSession]);

  // MODIFICAR: handleComplete para salvar no Supabase
  const handleComplete = useCallback(async () => {
    if (!sessionId || !user?.id) return;

    // 1. Salvar conclusão no Supabase
    const success = await endSession(sessionId, true);

    if (!success) {
      console.error('Erro ao finalizar sessão');
      return;
    }

    // 2. Tocar som
    if (isSoundEnabled) {
      playAlarmSound('gentle-bell', true);
    }

    // 3. Atualizar UI
    setIsCompleted(true);

    // 4. OPCIONAL: Notificar ChatGPT
    if (window.openai?.callTool) {
      await window.openai.callTool('endFocusTimer', {
        sessionId,
        completed: true,
      });
    }
  }, [sessionId, user, endSession, isSoundEnabled]);

  // ... resto do componente
}
```

---

# 🧪 FASE 3: Escrever Testes

## 3.1 - Testes de Integração para Hooks (60 min)

📁 Criar: `/tests/integration/hooks-integration.test.ts`

```typescript
/**
 * Testes de Integração: Hooks + Supabase
 * Valida que hooks persistem dados corretamente
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useHyperfocus } from '@/lib/hooks/useHyperfocus';
import { createClient } from '@/lib/supabase/client';

describe('Integration: useHyperfocus + Supabase', () => {
  const TEST_USER_ID = 'test-user-integration';

  beforeEach(async () => {
    // Limpar dados de teste
    const supabase = createClient();
    await supabase
      .from('hyperfocus')
      .delete()
      .eq('user_id', TEST_USER_ID);
  });

  it('deve criar hiperfoco e persistir no Supabase', async () => {
    const { result } = renderHook(() => useHyperfocus(TEST_USER_ID));

    // Criar hiperfoco
    const hyperfocus = await result.current.createHyperfocus({
      title: 'Test Hyperfocus',
      description: 'Integration test',
      color: 'blue',
    });

    // Validar retorno
    expect(hyperfocus).toBeDefined();
    expect(hyperfocus?.title).toBe('Test Hyperfocus');

    // Validar persistência
    await waitFor(() => {
      expect(result.current.hyperfocusList).toHaveLength(1);
    });

    // Buscar direto no Supabase para confirmar
    const supabase = createClient();
    const { data } = await supabase
      .from('hyperfocus')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .single();

    expect(data?.title).toBe('Test Hyperfocus');
  });

  it('deve atualizar hiperfoco', async () => {
    // 1. Criar
    const { result } = renderHook(() => useHyperfocus(TEST_USER_ID));
    const created = await result.current.createHyperfocus({
      title: 'Original Title',
    });

    // 2. Atualizar
    const updated = await result.current.updateHyperfocus(created!.id, {
      title: 'Updated Title',
    });

    // 3. Validar
    expect(updated?.title).toBe('Updated Title');
  });

  it('deve deletar hiperfoco', async () => {
    // 1. Criar
    const { result } = renderHook(() => useHyperfocus(TEST_USER_ID));
    const created = await result.current.createHyperfocus({
      title: 'To Delete',
    });

    // 2. Deletar
    const success = await result.current.deleteHyperfocus(created!.id);
    expect(success).toBe(true);

    // 3. Validar que não existe mais
    await waitFor(() => {
      expect(result.current.hyperfocusList).toHaveLength(0);
    });
  });
});
```

---

## 3.2 - Testes E2E de Componentes (60 min)

📁 Criar: `/tests/e2e/hyperfocus-flow.e2e.test.tsx`

```typescript
/**
 * Teste E2E: Fluxo completo de Hiperfoco
 * Simula interação real do usuário
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HyperfocusCard } from '@/components/HyperfocusCard';
import { TaskBreakdown } from '@/components/TaskBreakdown';

describe('E2E: Fluxo de Hiperfoco Completo', () => {
  it('deve criar hiperfoco → tarefas → completar tarefa', async () => {
    // 1. Renderizar HyperfocusCard
    const mockHyperfocus = {
      id: 'test-id',
      title: 'Aprender React',
      color: 'blue',
      taskCount: 0,
    };

    render(<HyperfocusCard />);
    
    // Simular toolOutput
    window.openai = {
      toolOutput: { hyperfocus: mockHyperfocus },
      theme: 'light',
      // ... outros campos necessários
    };

    // 2. Verificar renderização
    expect(screen.getByText('Aprender React')).toBeInTheDocument();

    // 3. Criar tarefas
    const createTasksButton = screen.getByText('Criar Tarefas');
    fireEvent.click(createTasksButton);

    // 4. Verificar que TaskBreakdown aparece
    await waitFor(() => {
      expect(screen.getByText('Tarefas')).toBeInTheDocument();
    });

    // 5. Completar primeira tarefa
    const firstCheckbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(firstCheckbox);

    // 6. Verificar que tarefa foi marcada
    await waitFor(() => {
      expect(firstCheckbox).toBeChecked();
    });

    // 7. Validar persistência no Supabase
    // TODO: Adicionar query para verificar
  });
});
```

---

# 📝 FASE 4: Documentação e Checklist Final

## 4.1 - Checklist de Validação

Antes de considerar concluído, validar:

### ✅ Hooks
- [ ] `useHyperfocus` criado e testado
- [ ] `useTasks` criado e testado
- [ ] `useFocusSession` criado e testado
- [ ] Todos os hooks têm tratamento de erros
- [ ] Todos os hooks têm loading states

### ✅ Componentes
- [ ] `HyperfocusCard` usa hooks
- [ ] `TaskBreakdown` usa hooks
- [ ] `FocusTimer` usa hooks
- [ ] Todos mostram feedback de loading
- [ ] Todos mostram mensagens de erro

### ✅ Testes
- [ ] Testes de integração passam
- [ ] Testes E2E passam
- [ ] Coverage > 70%
- [ ] Todos os testes documentados

### ✅ Performance
- [ ] Optimistic updates funcionam
- [ ] Não há re-renders desnecessários
- [ ] Debouncing em ações rápidas

### ✅ UX
- [ ] Feedback visual imediato
- [ ] Mensagens de erro claras
- [ ] Loading states não bloqueiam UI

---

## 4.2 - Comandos para Executar

```bash
# Rodar testes unitários
npm run test:unit

# Rodar testes de integração
npm run test:integration

# Rodar testes E2E
npm run test:e2e

# Rodar TODOS os testes
npm run test:all

# Ver coverage
npm run test:coverage

# Rodar em modo watch (durante desenvolvimento)
npm run test:watch
```

---

## 📚 Recursos Adicionais

### Documentação de Referência
- [React Hooks](https://react.dev/reference/react)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript)
- [Vitest Testing](https://vitest.dev/)
- [Testing Library](https://testing-library.com/react)

### Padrões do Projeto
- Services: `/src/lib/services/*.service.ts`
- Queries: `/src/lib/supabase/queries.ts`
- Hooks: `/src/lib/hooks/*.ts`
- Components: `/src/components/*.tsx`

### Dúvidas Comuns

**Q: Por que usar hooks ao invés de só `window.openai`?**  
A: Para ter persistência garantida, feedback imediato e funcionar offline.

**Q: Devo sempre chamar `window.openai` depois do hook?**  
A: Depende. Se o ChatGPT precisa saber (para contexto), sim. Se não, não.

**Q: E se o Supabase falhar?**  
A: O hook retorna `error` e você pode mostrar um toast ou retry.

**Q: Optimistic update é sempre melhor?**  
A: Não. Use quando a ação é frequente (toggle) e reversível.

---

## 🎯 Próximos Passos

Após concluir este guia:

1. **Implementar Realtime** - Sincronização automática entre tabs/usuários
2. **Adicionar Offline Support** - Queue de ações quando offline
3. **Melhorar Performance** - React Query ou SWR para caching
4. **Analytics** - Trackear uso dos componentes

---

**Última atualização:** 13 de outubro de 2025  
**Autor:** SATI Development Team  
**Versão:** 1.0
