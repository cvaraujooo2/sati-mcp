/**
 * Get Hyperfocus Tool
 * Busca detalhes de um hiperfoco específico com suas tarefas
 */

import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';
import { DatabaseError, NotFoundError, ValidationError } from '@/lib/utils/errors';
import { toolLogger } from '@/lib/utils/logger';
import { McpToolMetadata, AUTH_SCOPES } from '../types/metadata';

const log = toolLogger.child({ tool: 'getHyperfocus' });

const getHyperfocusSchema = z.object({
  hyperfocusId: z.string().uuid('hyperfocusId inválido'),
  includeTasks: z.boolean().optional().default(true),
  includeSessions: z.boolean().optional().default(false),
});

export type GetHyperfocusInput = z.infer<typeof getHyperfocusSchema>;

export async function getHyperfocusHandler(input: GetHyperfocusInput, userId: string) {
  log.info({ userId, input }, 'Buscando hiperfoco');

  try {
    const validated = getHyperfocusSchema.parse(input);

    // Buscar hiperfoco
    const { data: hyperfocus, error: hyperfocusError } = await supabase
      .from('hyperfocus')
      .select('*')
      .eq('id', validated.hyperfocusId)
      .eq('user_id', userId)
      .maybeSingle();

    if (hyperfocusError) {
      log.error({ error: hyperfocusError }, 'Erro ao buscar hiperfoco');
      throw new DatabaseError('Falha ao carregar hiperfoco');
    }

    if (!hyperfocus) {
      log.warn({ hyperfocusId: validated.hyperfocusId, userId }, 'Hiperfoco não encontrado');
      throw new NotFoundError('Hiperfoco');
    }

    // Buscar tarefas se solicitado
    let tasks: Array<{
      id: string;
      title: string;
      description: string | null;
      completed: boolean;
      estimatedMinutes: number | null;
      orderIndex: number;
      createdAt: string;
      completedAt: string | null;
    }> = [];
    let completedCount = 0;
    if (validated.includeTasks) {
      const { data: tasksList, error: tasksError } = await supabase
        .from('tasks')
        .select('id, title, description, completed, estimated_minutes, order_index, created_at, completed_at')
        .eq('hyperfocus_id', validated.hyperfocusId)
        .order('order_index', { ascending: true });

      if (tasksError) {
        log.error({ error: tasksError }, 'Erro ao buscar tarefas');
        throw new DatabaseError('Falha ao carregar tarefas');
      }

      tasks = (tasksList || []).map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        completed: Boolean(task.completed),
        estimatedMinutes: task.estimated_minutes,
        orderIndex: task.order_index,
        createdAt: task.created_at,
        completedAt: task.completed_at,
      }));

      completedCount = tasks.filter((t) => t.completed).length;
    }

    // Buscar sessões de foco se solicitado
    let sessions: Array<{
      id: string;
      startedAt: string;
      endedAt: string | null;
      plannedDurationMinutes: number;
      actualDurationMinutes: number | null;
      interrupted: boolean | null;
    }> = [];
    let totalFocusMinutes = 0;
    if (validated.includeSessions) {
      const { data: sessionsList, error: sessionsError } = await supabase
        .from('focus_sessions')
        .select('id, started_at, ended_at, planned_duration_minutes, actual_duration_minutes, interrupted')
        .eq('hyperfocus_id', validated.hyperfocusId)
        .order('started_at', { ascending: false });

      if (sessionsError) {
        log.error({ error: sessionsError }, 'Erro ao buscar sessões');
        throw new DatabaseError('Falha ao carregar sessões de foco');
      }

      sessions = (sessionsList || []).map((session) => ({
        id: session.id,
        startedAt: session.started_at,
        endedAt: session.ended_at,
        plannedDurationMinutes: session.planned_duration_minutes,
        actualDurationMinutes: session.actual_duration_minutes,
        interrupted: session.interrupted,
      }));

      totalFocusMinutes = sessions
        .filter((s) => s.actualDurationMinutes)
        .reduce((sum, s) => sum + (s.actualDurationMinutes || 0), 0);
    }

    // Calcular estatísticas
    const taskCompletionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

    log.info(
      {
        hyperfocusId: validated.hyperfocusId,
        taskCount: tasks.length,
        sessionsCount: sessions.length,
      },
      'Hiperfoco carregado com sucesso'
    );

    return {
      structuredContent: {
        type: 'hyperfocus_details',
        hyperfocus: {
          id: hyperfocus.id,
          title: hyperfocus.title,
          description: hyperfocus.description,
          color: hyperfocus.color,
          estimatedTimeMinutes: hyperfocus.estimated_time_minutes,
          createdAt: hyperfocus.created_at,
          updatedAt: hyperfocus.updated_at,
          archived: hyperfocus.archived,
        },
        tasks: validated.includeTasks ? tasks : undefined,
        sessions: validated.includeSessions ? sessions : undefined,
        statistics: {
          taskCount: tasks.length,
          completedTaskCount: completedCount,
          taskCompletionRate,
          totalFocusMinutes,
          sessionCount: sessions.length,
        },
      },
      component: {
        type: 'inline',
        name: 'HyperfocusDetail',
        props: {
          hyperfocus: {
            id: hyperfocus.id,
            title: hyperfocus.title,
            description: hyperfocus.description,
            color: hyperfocus.color,
            estimatedTimeMinutes: hyperfocus.estimated_time_minutes,
          },
          tasks,
          statistics: {
            taskCount: tasks.length,
            completedCount,
            completionRate: taskCompletionRate,
            totalFocusMinutes,
          },
        },
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      log.warn({ issues: error.issues }, 'Erro de validação');
      throw new ValidationError(error.issues.map((issue) => issue.message).join(', '));
    }

    throw error;
  }
}

export const getHyperfocusMetadata: McpToolMetadata = {
  name: 'getHyperfocus',
  description: `Gets detailed information about a specific hyperfocus, including tasks and focus sessions.

Use this tool when:
- User wants to see details of a specific hyperfocus
- User asks about progress on a project
- User wants to review tasks in a hyperfocus
- Need to show current state before making changes

Examples:
- "Show me details of my React learning hyperfocus"
- "How's my book writing project going?"
- "What tasks do I have in my music production hyperfocus?"`,
  inputSchema: {
    type: 'object',
    properties: {
      hyperfocusId: {
        type: 'string',
        description: 'UUID of the hyperfocus to retrieve',
      },
      includeTasks: {
        type: 'boolean',
        description: 'Include tasks in response (default: true)',
        default: true,
      },
      includeSessions: {
        type: 'boolean',
        description: 'Include focus sessions in response (default: false)',
        default: false,
      },
    },
    required: ['hyperfocusId'],
  },
  _meta: {
    readOnly: true,
    requiresConfirmation: false,
    requiresAuth: true,
    allowAnonymous: false,
    authScopes: [AUTH_SCOPES.HYPERFOCUS_READ, AUTH_SCOPES.TASKS_READ],
    'openai/outputTemplate': 'HyperfocusDetail',
    category: 'management',
    tags: ['hyperfocus', 'details', 'read'],
    rateLimitTier: 'low'
  },
};

