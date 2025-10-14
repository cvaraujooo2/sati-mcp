/**
 * Queries otimizadas do Supabase
 * Centralizadas para reutilização e manutenibilidade
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { logDbQuery, logDbError } from '@/lib/utils/logger';
import { DatabaseError, NotFoundError } from '@/lib/utils/errors';
import { PerformanceTimer } from '@/lib/utils/logger';

// Types do banco
type Hyperfocus = Database['public']['Tables']['hyperfocus']['Row'];
type HyperfocusInsert = Database['public']['Tables']['hyperfocus']['Insert'];
type HyperfocusUpdate = Database['public']['Tables']['hyperfocus']['Update'];

type Task = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

type FocusSession = Database['public']['Tables']['focus_sessions']['Row'];
type FocusSessionInsert = Database['public']['Tables']['focus_sessions']['Insert'];

type AlternancySession = Database['public']['Tables']['alternancy_sessions']['Row'];

type HyperfocusContext = Database['public']['Tables']['hyperfocus_context']['Row'];

// ============================================================================
// HYPERFOCUS QUERIES
// ============================================================================

/**
 * Cria novo hiperfoco
 */
export async function createHyperfocus(
  client: SupabaseClient<Database>,
  userId: string,
  data: Omit<HyperfocusInsert, 'user_id'>
): Promise<Hyperfocus> {
  const timer = new PerformanceTimer();

  try {
    const { data: hyperfocus, error } = await client
      .from('hyperfocus')
      .insert({ ...data, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    if (!hyperfocus) throw new Error('Hiperfoco não foi criado');

    logDbQuery('INSERT', 'hyperfocus', timer.duration(), 1);
    return hyperfocus;
  } catch (error) {
    logDbError('INSERT', 'hyperfocus', error as Error);
    throw new DatabaseError('Erro ao criar hiperfoco', { originalError: error });
  }
}

/**
 * Lista hiperfocos do usuário
 */
export async function listHyperfocus(
  client: SupabaseClient<Database>,
  userId: string,
  options: {
    archived?: boolean;
    color?: string;
    limit?: number;
    offset?: number;
    sortBy?: 'created_at' | 'updated_at' | 'title';
    sortOrder?: 'asc' | 'desc';
  } = {}
): Promise<Hyperfocus[]> {
  const timer = new PerformanceTimer();
  const {
    archived = false,
    color,
    limit = 20,
    offset = 0,
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = options;

  try {
    let query = client
      .from('hyperfocus')
      .select('*')
      .eq('user_id', userId)
      .eq('archived', archived);

    if (color) {
      query = query.eq('color', color);
    }

    query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) throw error;

    logDbQuery('SELECT', 'hyperfocus', timer.duration(), data?.length);
    return data || [];
  } catch (error) {
    logDbError('SELECT', 'hyperfocus', error as Error);
    throw new DatabaseError('Erro ao listar hiperfocos', { originalError: error });
  }
}

/**
 * Busca hiperfoco por ID
 */
export async function getHyperfocusById(
  client: SupabaseClient<Database>,
  userId: string,
  id: string
): Promise<Hyperfocus> {
  const timer = new PerformanceTimer();

  try {
    const { data, error } = await client
      .from('hyperfocus')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    if (!data) throw new NotFoundError('Hiperfoco', id);

    logDbQuery('SELECT', 'hyperfocus', timer.duration(), 1);
    return data;
  } catch (error) {
    if ((error as Record<string, unknown>)?.code === 'PGRST116') {
      throw new NotFoundError('Hiperfoco', id);
    }
    logDbError('SELECT', 'hyperfocus', error as Error);
    throw new DatabaseError('Erro ao buscar hiperfoco', { originalError: error });
  }
}

/**
 * Atualiza hiperfoco
 */
export async function updateHyperfocus(
  client: SupabaseClient<Database>,
  userId: string,
  id: string,
  data: HyperfocusUpdate
): Promise<Hyperfocus> {
  const timer = new PerformanceTimer();

  try {
    const { data: updated, error } = await client
      .from('hyperfocus')
      .update(data)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    if (!updated) throw new NotFoundError('Hiperfoco', id);

    logDbQuery('UPDATE', 'hyperfocus', timer.duration(), 1);
    return updated;
  } catch (error) {
    logDbError('UPDATE', 'hyperfocus', error as Error);
    throw new DatabaseError('Erro ao atualizar hiperfoco', { originalError: error });
  }
}

/**
 * Arquiva/desarquiva hiperfoco
 */
export async function archiveHyperfocus(
  client: SupabaseClient<Database>,
  userId: string,
  id: string,
  archived = true
): Promise<Hyperfocus> {
  return updateHyperfocus(client, userId, id, { archived });
}

/**
 * Deleta hiperfoco (soft delete via archive)
 */
export async function deleteHyperfocus(
  client: SupabaseClient<Database>,
  userId: string,
  id: string
): Promise<void> {
  const timer = new PerformanceTimer();

  try {
    const { error } = await client
      .from('hyperfocus')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    logDbQuery('DELETE', 'hyperfocus', timer.duration(), 1);
  } catch (error) {
    logDbError('DELETE', 'hyperfocus', error as Error);
    throw new DatabaseError('Erro ao deletar hiperfoco', { originalError: error });
  }
}

// ============================================================================
// TASK QUERIES
// ============================================================================

/**
 * Cria nova tarefa
 */
export async function createTask(
  client: SupabaseClient<Database>,
  data: TaskInsert
): Promise<Task> {
  const timer = new PerformanceTimer();

  try {
    // Se order_index não fornecido, buscar próximo
    if (data.order_index === undefined) {
      const { count } = await client
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('hyperfocus_id', data.hyperfocus_id);

      data.order_index = count || 0;
    }

    const { data: task, error } = await client
      .from('tasks')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    if (!task) throw new Error('Tarefa não foi criada');

    logDbQuery('INSERT', 'tasks', timer.duration(), 1);
    return task;
  } catch (error) {
    logDbError('INSERT', 'tasks', error as Error);
    throw new DatabaseError('Erro ao criar tarefa', { originalError: error });
  }
}

/**
 * Lista tarefas de um hiperfoco
 */
export async function listTasks(
  client: SupabaseClient<Database>,
  hyperfocusId: string,
  completed?: boolean
): Promise<Task[]> {
  const timer = new PerformanceTimer();

  try {
    let query = client
      .from('tasks')
      .select('*')
      .eq('hyperfocus_id', hyperfocusId)
      .order('order_index', { ascending: true });

    if (completed !== undefined) {
      query = query.eq('completed', completed);
    }

    const { data, error } = await query;

    if (error) throw error;

    logDbQuery('SELECT', 'tasks', timer.duration(), data?.length);
    return data || [];
  } catch (error) {
    logDbError('SELECT', 'tasks', error as Error);
    throw new DatabaseError('Erro ao listar tarefas', { originalError: error });
  }
}

/**
 * Busca tarefa por ID
 */
export async function getTaskById(
  client: SupabaseClient<Database>,
  id: string
): Promise<Task> {
  const timer = new PerformanceTimer();

  try {
    const { data, error } = await client
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) throw new NotFoundError('Tarefa', id);

    logDbQuery('SELECT', 'tasks', timer.duration(), 1);
    return data;
  } catch (error) {
    if ((error as Record<string, unknown>)?.code === 'PGRST116') {
      throw new NotFoundError('Tarefa', id);
    }
    logDbError('SELECT', 'tasks', error as Error);
    throw new DatabaseError('Erro ao buscar tarefa', { originalError: error });
  }
}

/**
 * Atualiza tarefa
 */
export async function updateTask(
  client: SupabaseClient<Database>,
  id: string,
  data: TaskUpdate
): Promise<Task> {
  const timer = new PerformanceTimer();

  try {
    // Se completando tarefa, adicionar timestamp
    if (data.completed === true) {
      data.completed_at = new Date().toISOString();
    } else if (data.completed === false) {
      data.completed_at = null;
    }

    const { data: updated, error } = await client
      .from('tasks')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!updated) throw new NotFoundError('Tarefa', id);

    logDbQuery('UPDATE', 'tasks', timer.duration(), 1);
    return updated;
  } catch (error) {
    logDbError('UPDATE', 'tasks', error as Error);
    throw new DatabaseError('Erro ao atualizar tarefa', { originalError: error });
  }
}

/**
 * Toggle status de tarefa
 */
export async function toggleTask(
  client: SupabaseClient<Database>,
  id: string,
  completed?: boolean
): Promise<Task> {
  try {
    // Se completed não fornecido, buscar estado atual e inverter
    if (completed === undefined) {
      const task = await getTaskById(client, id);
      completed = !task.completed;
    }

    return await updateTask(client, id, { completed });
  } catch (error) {
    logDbError('UPDATE', 'tasks', error as Error);
    throw new DatabaseError('Erro ao alternar tarefa', { originalError: error });
  }
}

/**
 * Reordena tarefas
 */
export async function reorderTasks(
  client: SupabaseClient<Database>,
  hyperfocusId: string,
  taskIds: string[]
): Promise<Task[]> {
  const timer = new PerformanceTimer();

  try {
    // Atualiza order_index de cada tarefa
    const updates = taskIds.map((taskId, index) =>
      client
        .from('tasks')
        .update({ order_index: index })
        .eq('id', taskId)
        .eq('hyperfocus_id', hyperfocusId)
    );

    await Promise.all(updates);

    // Retorna lista atualizada
    const result = await listTasks(client, hyperfocusId);

    logDbQuery('UPDATE', 'tasks', timer.duration(), taskIds.length);
    return result;
  } catch (error) {
    logDbError('UPDATE', 'tasks', error as Error);
    throw new DatabaseError('Erro ao reordenar tarefas', { originalError: error });
  }
}

/**
 * Deleta tarefa
 */
export async function deleteTask(
  client: SupabaseClient<Database>,
  id: string
): Promise<void> {
  const timer = new PerformanceTimer();

  try {
    const { error } = await client.from('tasks').delete().eq('id', id);

    if (error) throw error;

    logDbQuery('DELETE', 'tasks', timer.duration(), 1);
  } catch (error) {
    logDbError('DELETE', 'tasks', error as Error);
    throw new DatabaseError('Erro ao deletar tarefa', { originalError: error });
  }
}

// ============================================================================
// FOCUS SESSION QUERIES
// ============================================================================

/**
 * Inicia sessão de foco
 */
export async function startFocusSession(
  client: SupabaseClient<Database>,
  data: FocusSessionInsert
): Promise<FocusSession> {
  const timer = new PerformanceTimer();

  try {
    const { data: session, error } = await client
      .from('focus_sessions')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    if (!session) throw new Error('Sessão não foi criada');

    logDbQuery('INSERT', 'focus_sessions', timer.duration(), 1);
    return session;
  } catch (error) {
    logDbError('INSERT', 'focus_sessions', error as Error);
    throw new DatabaseError('Erro ao iniciar sessão de foco', { originalError: error });
  }
}

/**
 * Finaliza sessão de foco
 */
export async function endFocusSession(
  client: SupabaseClient<Database>,
  sessionId: string,
  actualDurationMinutes?: number,
  interrupted = false
): Promise<FocusSession> {
  const timer = new PerformanceTimer();

  try {
    const { data: session, error } = await client
      .from('focus_sessions')
      .update({
        ended_at: new Date().toISOString(),
        actual_duration_minutes: actualDurationMinutes,
        interrupted,
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    if (!session) throw new NotFoundError('Sessão de foco', sessionId);

    logDbQuery('UPDATE', 'focus_sessions', timer.duration(), 1);
    return session;
  } catch (error) {
    logDbError('UPDATE', 'focus_sessions', error as Error);
    throw new DatabaseError('Erro ao finalizar sessão de foco', { originalError: error });
  }
}

/**
 * Lista sessões de foco de um hiperfoco
 */
export async function listFocusSessions(
  client: SupabaseClient<Database>,
  hyperfocusId: string
): Promise<FocusSession[]> {
  const timer = new PerformanceTimer();

  try {
    const { data, error } = await client
      .from('focus_sessions')
      .select('*')
      .eq('hyperfocus_id', hyperfocusId)
      .order('started_at', { ascending: false });

    if (error) throw error;

    logDbQuery('SELECT', 'focus_sessions', timer.duration(), data?.length);
    return data || [];
  } catch (error) {
    logDbError('SELECT', 'focus_sessions', error as Error);
    throw new DatabaseError('Erro ao listar sessões de foco', { originalError: error });
  }
}

/**
 * Filtros para sessões
 */
export interface SessionFilters {
  period?: 'today' | 'week' | 'month' | 'all';
  status?: 'completed' | 'interrupted' | 'all';
  sortBy?: 'recent' | 'oldest' | 'duration';
  limit?: number;
}

/**
 * Tipo estendido com dados do hiperfoco
 */
export type FocusSessionWithHyperfocus = FocusSession & {
  hyperfocus: {
    id: string;
    title: string;
    color: string;
    user_id: string;
  };
};

/**
 * Lista todas as sessões de foco de um usuário
 */
export async function listAllUserSessions(
  client: SupabaseClient<Database>,
  userId: string,
  filters: SessionFilters = {}
): Promise<FocusSessionWithHyperfocus[]> {
  const timer = new PerformanceTimer();

  try {
    let query = client
      .from('focus_sessions')
      .select(`
        *,
        hyperfocus!inner(
          id,
          title,
          color,
          user_id
        )
      `)
      .eq('hyperfocus.user_id', userId);

    // Filtro de período
    if (filters.period && filters.period !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (filters.period) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setDate(now.getDate() - 30));
          break;
        default:
          startDate = new Date(0);
      }

      query = query.gte('started_at', startDate.toISOString());
    }

    // Filtro de status
    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'completed') {
        query = query.not('ended_at', 'is', null).eq('interrupted', false);
      } else if (filters.status === 'interrupted') {
        query = query.eq('interrupted', true);
      }
    }

    // Ordenação
    const sortOrder = filters.sortBy === 'oldest' ? 'asc' : 'desc';
    const sortColumn = filters.sortBy === 'duration' ? 'actual_duration_minutes' : 'started_at';
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

    // Limite
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;

    logDbQuery('SELECT', 'focus_sessions', timer.duration(), data?.length);
    return (data || []) as FocusSessionWithHyperfocus[];
  } catch (error) {
    logDbError('SELECT', 'focus_sessions', error as Error);
    throw new DatabaseError('Erro ao listar sessões do usuário', { originalError: error });
  }
}

// ============================================================================
// ALTERNANCY QUERIES
// ============================================================================

/**
 * Cria sessão de alternância
 */
export async function createAlternancySession(
  client: SupabaseClient<Database>,
  userId: string,
  name: string | null,
  hyperfocusSessions: Array<{ hyperfocus_id: string; duration_minutes: number }>
): Promise<AlternancySession> {
  const timer = new PerformanceTimer();

  try {
    // Criar sessão
    const { data: session, error: sessionError } = await client
      .from('alternancy_sessions')
      .insert({ user_id: userId, name })
      .select()
      .single();

    if (sessionError) throw sessionError;
    if (!session) throw new Error('Sessão de alternância não foi criada');

    // Criar vínculos com hiperfocos
    const hyperfocusLinks = hyperfocusSessions.map((hs, index) => ({
      alternancy_session_id: session.id,
      hyperfocus_id: hs.hyperfocus_id,
      duration_minutes: hs.duration_minutes,
      order_index: index,
    }));

    const { error: linksError } = await client
      .from('alternancy_hyperfocus')
      .insert(hyperfocusLinks);

    if (linksError) throw linksError;

    logDbQuery('INSERT', 'alternancy_sessions', timer.duration(), 1);
    return session;
  } catch (error) {
    logDbError('INSERT', 'alternancy_sessions', error as Error);
    throw new DatabaseError('Erro ao criar sessão de alternância', { originalError: error });
  }
}

/**
 * Lista sessões de alternância
 */
export async function listAlternancySessions(
  client: SupabaseClient<Database>,
  userId: string,
  active?: boolean
): Promise<AlternancySession[]> {
  const timer = new PerformanceTimer();

  try {
    let query = client
      .from('alternancy_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (active !== undefined) {
      query = query.eq('active', active);
    }

    const { data, error } = await query;

    if (error) throw error;

    logDbQuery('SELECT', 'alternancy_sessions', timer.duration(), data?.length);
    return data || [];
  } catch (error) {
    logDbError('SELECT', 'alternancy_sessions', error as Error);
    throw new DatabaseError('Erro ao listar sessões de alternância', { originalError: error });
  }
}

// ============================================================================
// CONTEXT QUERIES
// ============================================================================

/**
 * Salva contexto de hiperfoco
 */
export async function saveHyperfocusContext(
  client: SupabaseClient<Database>,
  hyperfocusId: string,
  contextData: Record<string, unknown>
): Promise<HyperfocusContext> {
  const timer = new PerformanceTimer();

  try {
    const { data, error } = await client
      .from('hyperfocus_context')
      .upsert(
        {
          hyperfocus_id: hyperfocusId,
          context_data: contextData as unknown as Database['public']['Tables']['hyperfocus_context']['Insert']['context_data'],
        },
        { onConflict: 'hyperfocus_id' }
      )
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Contexto não foi salvo');

    logDbQuery('UPSERT', 'hyperfocus_context', timer.duration(), 1);
    return data;
  } catch (error) {
    logDbError('UPSERT', 'hyperfocus_context', error as Error);
    throw new DatabaseError('Erro ao salvar contexto', { originalError: error });
  }
}

/**
 * Busca contexto de hiperfoco
 */
export async function getHyperfocusContext(
  client: SupabaseClient<Database>,
  hyperfocusId: string
): Promise<HyperfocusContext | null> {
  const timer = new PerformanceTimer();

  try {
    const { data, error } = await client
      .from('hyperfocus_context')
      .select('*')
      .eq('hyperfocus_id', hyperfocusId)
      .single();

    if (error && 'code' in error && error.code !== 'PGRST116') {
      throw error;
    }

    logDbQuery('SELECT', 'hyperfocus_context', timer.duration(), data ? 1 : 0);
    return data || null;
  } catch (error) {
    logDbError('SELECT', 'hyperfocus_context', error as Error);
    throw new DatabaseError('Erro ao buscar contexto', { originalError: error });
  }
}

// ============================================================================
// STATISTICS QUERIES
// ============================================================================

/**
 * Estatísticas de hiperfocos por período
 */
export async function getHyperfocusStatistics(
  client: SupabaseClient<Database>,
  userId: string,
  startDate?: string,
  endDate?: string
) {
  const timer = new PerformanceTimer();

  try {
    let query = client
      .from('hyperfocus')
      .select('id, created_at, color')
      .eq('user_id', userId);

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    logDbQuery('SELECT', 'hyperfocus', timer.duration(), data?.length);

    // Processar estatísticas
    const total = data?.length || 0;
    const byColor = data?.reduce((acc, h) => {
      acc[h.color!] = (acc[h.color!] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, byColor };
  } catch (error) {
    logDbError('SELECT', 'hyperfocus', error as Error);
    throw new DatabaseError('Erro ao buscar estatísticas', { originalError: error });
  }
}

