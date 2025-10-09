import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';
import { DatabaseError, NotFoundError, ValidationError } from '@/lib/utils/errors';
import { toolLogger } from '@/lib/utils/logger';
import { McpToolMetadata, AUTH_SCOPES } from '../types/metadata';

const log = toolLogger.child({ tool: 'updateTaskStatus' });

const updateTaskStatusSchema = z.object({
  hyperfocusId: z.string().uuid('hyperfocusId inválido'),
  taskId: z.string().uuid('taskId inválido'),
  completed: z.boolean(),
});

export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;

export async function updateTaskStatusHandler(
  input: UpdateTaskStatusInput,
  userId: string
) {
  log.info({ userId, input }, 'Atualizando status da tarefa');

  try {
    const parsed = updateTaskStatusSchema.parse(input);

    const { data: hyperfocus, error: hyperfocusError } = await supabase
      .from('hyperfocus')
      .select('id, title')
      .eq('id', parsed.hyperfocusId)
      .eq('user_id', userId)
      .maybeSingle();

    if (hyperfocusError) {
      log.error({ hyperfocusError }, 'Erro ao buscar hyperfocus');
      throw new DatabaseError('Falha ao validar hyperfocus');
    }

    if (!hyperfocus) {
      log.warn({ hyperfocusId: parsed.hyperfocusId, userId }, 'Hyperfocus não encontrado');
      throw new NotFoundError('Hyperfocus');
    }

    const { data: task, error: taskSelectError } = await supabase
      .from('tasks')
      .select('id, title, completed')
      .eq('id', parsed.taskId)
      .eq('hyperfocus_id', parsed.hyperfocusId)
      .maybeSingle();

    if (taskSelectError) {
      log.error({ taskSelectError }, 'Erro ao buscar tarefa');
      throw new DatabaseError('Falha ao validar tarefa');
    }

    if (!task) {
      log.warn({ taskId: parsed.taskId, userId }, 'Tarefa não encontrada');
      throw new NotFoundError('Task');
    }

    const { error: updateError } = await supabase
      .from('tasks')
      .update({
        completed: parsed.completed,
        completed_at: parsed.completed ? new Date().toISOString() : null,
      })
      .eq('id', parsed.taskId)
      .eq('hyperfocus_id', parsed.hyperfocusId);

    if (updateError) {
      log.error({ updateError }, 'Erro ao atualizar tarefa');
      throw new DatabaseError('Falha ao atualizar status da tarefa');
    }

    const { data: tasksList, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, completed, order_index')
      .eq('hyperfocus_id', parsed.hyperfocusId)
      .order('order_index', { ascending: true });

    if (tasksError) {
      log.error({ tasksError }, 'Erro ao recarregar tarefas');
      throw new DatabaseError('Falha ao carregar tarefas atualizadas');
    }

    const orderedTasks = tasksList?.map((item) => ({
      id: item.id,
      title: item.title,
      completed: Boolean(item.completed),
    })) ?? [];

    log.info({ taskId: parsed.taskId, completed: parsed.completed }, 'Status da tarefa atualizado com sucesso');

    return {
      structuredContent: {
        type: 'task_status_updated',
        task: {
          id: parsed.taskId,
          title: task.title,
          completed: parsed.completed,
        },
      },
      component: {
        type: 'inline',
        name: 'TaskBreakdown',
        props: {
          hyperfocusId: parsed.hyperfocusId,
          hyperfocusTitle: hyperfocus.title,
          tasks: orderedTasks,
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

export const updateTaskStatusMetadata: McpToolMetadata = {
  name: 'updateTaskStatus',
  description: `Updates the completion status of a task.

Use this tool when:
- User completes a task and wants to mark it as done
- User says "mark X as complete" or "I finished Y"
- User wants to uncomplete a task
- Celebrating task completion with neurodivergent user

Examples:
- "Mark task X as complete"
- "I finished the research task"
- "Unmark task Y, I need to redo it"`,
  inputSchema: {
    type: 'object',
    properties: {
      hyperfocusId: {
        type: 'string',
        description: 'UUID of the hyperfocus',
      },
      taskId: {
        type: 'string',
        description: 'UUID of the task',
      },
      completed: {
        type: 'boolean',
        description: 'New completion status (true = completed, false = not completed)',
      },
    },
    required: ['hyperfocusId', 'taskId', 'completed'],
  },
  _meta: {
    readOnly: false,
    requiresConfirmation: false,
    requiresAuth: true,
    allowAnonymous: false,
    authScopes: [AUTH_SCOPES.TASKS_WRITE],
    'openai/outputTemplate': 'TaskBreakdown',
    category: 'management',
    tags: ['tasks', 'update', 'complete'],
    rateLimitTier: 'low'
  },
};


