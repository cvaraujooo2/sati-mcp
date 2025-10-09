import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';
import { DatabaseError, NotFoundError, ValidationError } from '@/lib/utils/errors';
import { toolLogger } from '@/lib/utils/logger';
import { McpToolMetadata, AUTH_SCOPES } from '../types/metadata';

const log = toolLogger.child({ tool: 'createTask' });

const createTaskSchema = z.object({
  hyperfocusId: z.string().uuid('hyperfocusId inválido'),
  title: z
    .string()
    .min(1, 'Título é obrigatório')
    .max(200, 'Título muito longo (máximo 200 caracteres)'),
  description: z
    .string()
    .max(500, 'Descrição muito longa (máximo 500 caracteres)')
    .optional(),
  estimatedMinutes: z
    .number()
    .int('Tempo estimado deve ser inteiro')
    .positive('Tempo deve ser positivo')
    .max(480, 'Tempo máximo é 480 minutos (8 horas)')
    .optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export async function createTaskHandler(input: CreateTaskInput, userId: string) {
  log.info({ userId, input }, 'Criando nova tarefa');

  try {
    const validated = createTaskSchema.parse(input);

    const { data: hyperfocus, error: hyperfocusError } = await supabase
      .from('hyperfocus')
      .select('id, title')
      .eq('id', validated.hyperfocusId)
      .eq('user_id', userId)
      .maybeSingle();

    if (hyperfocusError) {
      log.error({ hyperfocusError }, 'Erro ao buscar hyperfocus');
      throw new DatabaseError('Falha ao validar hyperfocus');
    }

    if (!hyperfocus) {
      log.warn({ hyperfocusId: validated.hyperfocusId, userId }, 'Hyperfocus não encontrado');
      throw new NotFoundError('Hyperfocus');
    }

    const { data: maxOrderResult, error: orderError } = await supabase
      .from('tasks')
      .select('order_index')
      .eq('hyperfocus_id', validated.hyperfocusId)
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (orderError) {
      log.error({ orderError }, 'Erro ao buscar ordem das tarefas');
      throw new DatabaseError('Falha ao determinar ordem das tarefas');
    }

    const nextOrder = (maxOrderResult?.order_index ?? 0) + 1;

    const { data: task, error: insertError } = await supabase
      .from('tasks')
      .insert({
        hyperfocus_id: validated.hyperfocusId,
        title: validated.title,
        description: validated.description,
        estimated_minutes: validated.estimatedMinutes,
        order_index: nextOrder,
      })
      .select('id, title, completed, created_at, estimated_minutes, description')
      .single();

    if (insertError) {
      log.error({ insertError }, 'Erro ao criar tarefa');
      throw new DatabaseError('Falha ao criar tarefa');
    }

    const { data: tasksList, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, completed, order_index')
      .eq('hyperfocus_id', validated.hyperfocusId)
      .order('order_index', { ascending: true });

    if (tasksError) {
      log.error({ tasksError }, 'Erro ao carregar lista de tarefas');
      throw new DatabaseError('Falha ao carregar tarefas atualizadas');
    }

    const orderedTasks =
      tasksList?.map((item) => ({
        id: item.id,
        title: item.title,
        completed: Boolean(item.completed),
      })) ?? [];

    log.info({ taskId: task.id }, 'Tarefa criada com sucesso');

    return {
      structuredContent: {
        type: 'task_created',
        task: {
          id: task.id,
          title: task.title,
          completed: Boolean(task.completed),
          createdAt: task.created_at,
          estimatedMinutes: task.estimated_minutes ?? undefined,
          description: task.description ?? undefined,
        },
      },
      component: {
        type: 'inline',
        name: 'TaskBreakdown',
        props: {
          hyperfocusId: validated.hyperfocusId,
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

export const createTaskMetadata: McpToolMetadata = {
  name: 'createTask',
  description: `Creates a new task within an existing hyperfocus.

Use this tool when:
- User wants to add a specific task to a project
- User mentions a concrete action they need to take
- User is breaking down a hyperfocus into actionable steps
- User says "add task" or "I need to do X in this project"

Examples:
- "Add task 'Study TypeScript interfaces' to my React hyperfocus"
- "I need to do code review in my project"
- "Add: Research best practices for state management"`,
  inputSchema: {
    type: 'object',
    properties: {
      hyperfocusId: {
        type: 'string',
        description: 'UUID of the hyperfocus',
      },
      title: {
        type: 'string',
        description: 'Title of the task (1-200 characters)',
        minLength: 1,
        maxLength: 200,
      },
      description: {
        type: 'string',
        description: 'Optional description of the task',
        maxLength: 500,
      },
      estimatedMinutes: {
        type: 'number',
        description: 'Estimated time in minutes (1-480)',
        minimum: 1,
        maximum: 480,
      },
    },
    required: ['hyperfocusId', 'title'],
  },
  _meta: {
    readOnly: false,
    requiresConfirmation: true,
    requiresAuth: true,
    allowAnonymous: false,
    authScopes: [AUTH_SCOPES.TASKS_WRITE],
    'openai/outputTemplate': 'TaskBreakdown',
    category: 'management',
    tags: ['tasks', 'create', 'subtasks'],
    rateLimitTier: 'medium'
  },
};


