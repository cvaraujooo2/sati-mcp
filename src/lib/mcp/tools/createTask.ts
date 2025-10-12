import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
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

/**
 * Valida se o título da tarefa é acionável (começa com verbo de ação)
 */
function validateActionableTitle(title: string): {
  isActionable: boolean;
  suggestion?: string;
  detectedVerb?: string;
} {
  // Lista de verbos de ação comuns em português
  const actionVerbs = [
    'criar', 'instalar', 'configurar', 'implementar', 'escrever', 'desenvolver',
    'testar', 'validar', 'verificar', 'revisar', 'estudar', 'aprender',
    'praticar', 'ler', 'assistir', 'fazer', 'executar', 'completar',
    'definir', 'planejar', 'organizar', 'estruturar', 'documentar',
    'refatorar', 'otimizar', 'debugar', 'corrigir', 'atualizar',
    'adicionar', 'remover', 'modificar', 'melhorar', 'analisar'
  ];

  const lowerTitle = title.toLowerCase().trim();
  
  // Verifica se começa com algum verbo de ação
  const detectedVerb = actionVerbs.find(verb => lowerTitle.startsWith(verb));
  
  if (detectedVerb) {
    return {
      isActionable: true,
      detectedVerb,
    };
  }

  // Se não começou com verbo, sugerir alguns verbos relevantes
  const suggestedVerbs = actionVerbs.slice(0, 5).join(', ');
  
  return {
    isActionable: false,
    suggestion: `Para melhor clareza, considere iniciar com um verbo de ação como: ${suggestedVerbs}. Exemplo: "Criar ${title.slice(0, 50)}"`,
  };
}

export async function createTaskHandler(input: CreateTaskInput, userId: string) {
  log.info({ userId, input }, 'Criando nova tarefa');

  try {
    const validated = createTaskSchema.parse(input);

    // Obter cliente Supabase com sessão do servidor
    const supabase = await createClient();

    // Validar se o título é acionável e gerar sugestão se não for
    const titleValidation = validateActionableTitle(validated.title);
    
    if (!titleValidation.isActionable) {
      log.warn(
        { title: validated.title, suggestion: titleValidation.suggestion },
        'Título da tarefa não é acionável'
      );
    } else {
      log.info(
        { title: validated.title, verb: titleValidation.detectedVerb },
        'Título acionável detectado'
      );
    }

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
        // Incluir feedback sobre qualidade do título
        titleQuality: {
          isActionable: titleValidation.isActionable,
          detectedVerb: titleValidation.detectedVerb,
          suggestion: titleValidation.suggestion,
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
  description: `Creates a new task within a hyperfocus area.

IMPORTANT - ACTIONABLE TASKS:
This tool is designed to help neurodivergent users create CLEAR and ACTIONABLE tasks.

RULES FOR EFFECTIVE TASKS:
1. ✅ Start with ACTION VERBS: "Instalar", "Criar", "Escrever", "Testar", "Configurar"
2. ✅ Be SPECIFIC: "Configurar PostgreSQL localmente" not just "Banco de dados"
3. ✅ Include HOW in description: Detail the steps or method
4. ✅ Realistic time estimates: 15-60 minutes for most tasks

Use this tool when:
- User wants to add a specific task to a hyperfocus
- User needs to create a single task (not breaking down a complex one - use breakIntoSubtasks for that)
- User mentions a concrete action they need to take

Perfect for neurodivergent users who need clear, unambiguous task definitions.

Examples of GOOD tasks:
- Title: "Instalar Django via pip" | Description: "Execute 'pip install django' no terminal"
- Title: "Criar arquivo models.py" | Description: "Criar novo arquivo na pasta app/ com estrutura básica de modelo"
- Title: "Escrever função de autenticação" | Description: "Implementar função login() que valida credenciais via JWT"

Examples of BAD tasks (avoid):
- ❌ "Django" (not actionable)
- ❌ "Models" (too vague)
- ❌ "Autenticação" (what about it?)`,
  inputSchema: {
    type: 'object',
    properties: {
      hyperfocusId: {
        type: 'string',
        description: 'UUID of the hyperfocus',
      },
      title: {
        type: 'string',
        description: `Title of the task (1-200 characters).
        
CRITICAL: Use ACTION VERBS at the start for clarity!

✅ GOOD EXAMPLES:
- "Instalar Django via pip"
- "Criar arquivo models.py"  
- "Escrever testes unitários"
- "Configurar banco PostgreSQL"
- "Estudar capítulo 3 do livro"

❌ BAD EXAMPLES (avoid):
- "Django instalado" (passive voice)
- "Models" (not actionable)
- "Autenticação" (too vague)
- "Banco de dados" (what action?)

For neurodivergent users, actionable language reduces executive dysfunction and makes it clear what to do next.`,
        minLength: 1,
        maxLength: 200,
      },
      description: {
        type: 'string',
        description: `Optional detailed description of HOW to complete the task.

Best practice: Explain the METHOD or STEPS needed.

Examples:
- "Execute 'pip install django' no ambiente virtual"
- "Criar users/models.py com classe User extendendo AbstractUser"
- "Implementar função em auth.py que valida JWT tokens"`,
        maxLength: 500,
      },
      estimatedMinutes: {
        type: 'number',
        description: `Estimated time in minutes (1-480).

Guidelines for neurodivergent users:
- Simple tasks: 15-30 minutes
- Moderate tasks: 30-60 minutes
- Complex tasks: 60-120 minutes
- If >120 minutes, consider breaking into subtasks

Remember: Real time often takes 1.5x-2x your estimate (time blindness).`,
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


