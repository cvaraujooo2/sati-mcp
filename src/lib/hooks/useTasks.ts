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
        
        // TaskService espera o id no input
        const updated = await service.update(userId, id, { id, ...data });
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
      const originalTask = tasks.find((t) => t.id === id);
      if (!originalTask) return false;

      setTasks((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, completed: !t.completed } : t
        )
      );

      try {
        const supabase = createClient();
        const service = new TaskService(supabase);
        
        await service.update(userId, id, { id, completed: !originalTask.completed });
        
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
