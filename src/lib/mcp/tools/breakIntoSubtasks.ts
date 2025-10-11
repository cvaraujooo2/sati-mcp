/**
 * Break Into Subtasks Tool
 * Analisa uma descrição e sugere/cria subtarefas automaticamente
 */

import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';
import { DatabaseError, NotFoundError, ValidationError } from '@/lib/utils/errors';
import { toolLogger } from '@/lib/utils/logger';
import { McpToolMetadata, AUTH_SCOPES } from '../types/metadata';

const log = toolLogger.child({ tool: 'breakIntoSubtasks' });

const breakIntoSubtasksSchema = z.object({
  hyperfocusId: z.string().uuid('hyperfocusId inválido'),
  taskDescription: z
    .string()
    .min(10, 'Descrição muito curta para análise')
    .max(2000, 'Descrição muito longa'),
  numSubtasks: z.number().int().min(2).max(10).optional().default(5),
  autoCreate: z.boolean().optional().default(false),
});

export type BreakIntoSubtasksInput = z.infer<typeof breakIntoSubtasksSchema>;

// UUID detector simples
function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function breakIntoSubtasksHandler(
  input: BreakIntoSubtasksInput,
  userId: string
) {
  log.info({ userId, input }, 'Quebrando tarefa em subtarefas');

  try {
    // Normalização defensiva do hyperfocusId: se vier título, tentar resolver para UUID
    let normalizedInput = { ...input };

    if (typeof normalizedInput.hyperfocusId === 'string' && !isUuid(normalizedInput.hyperfocusId)) {
      log.warn(
        { userId, provided: normalizedInput.hyperfocusId },
        'hyperfocusId não parece ser um UUID; tentando resolver por título'
      );

      const { data: byTitle, error: titleErr } = await supabase
        .from('hyperfocus')
        .select('id, title')
        .eq('user_id', userId)
        .eq('title', normalizedInput.hyperfocusId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (titleErr) {
        log.error({ error: titleErr }, 'Erro ao buscar hiperfoco por título');
      }

      if (byTitle?.id) {
        log.info(
          { userId, title: normalizedInput.hyperfocusId, resolvedId: byTitle.id },
          'Resolvido hyperfocusId a partir do título'
        );
        normalizedInput.hyperfocusId = byTitle.id;
      } else {
        log.warn(
          { userId, title: normalizedInput.hyperfocusId },
          'Não foi possível resolver título para UUID; validação Zod deve falhar'
        );
      }
    }

    const validated = breakIntoSubtasksSchema.parse(normalizedInput);

    // Validar que hiperfoco existe e pertence ao usuário
    const { data: hyperfocus, error: hyperfocusError } = await supabase
      .from('hyperfocus')
      .select('id, title')
      .eq('id', validated.hyperfocusId)
      .eq('user_id', userId)
      .maybeSingle();

    if (hyperfocusError) {
      log.error({ error: hyperfocusError }, 'Erro ao buscar hiperfoco');
      throw new DatabaseError('Falha ao validar hiperfoco');
    }

    if (!hyperfocus) {
      log.warn({ hyperfocusId: validated.hyperfocusId, userId }, 'Hiperfoco não encontrado');
      throw new NotFoundError('Hiperfoco');
    }

    // Gerar subtarefas sugeridas usando análise heurística
    const suggestions = generateSubtaskSuggestions(
      validated.taskDescription,
      validated.numSubtasks
    );

    // Se autoCreate=true, criar as tarefas no banco
    const createdTasks = [];
    if (validated.autoCreate) {
      // Buscar próximo order_index
      const { data: maxOrderResult } = await supabase
        .from('tasks')
        .select('order_index')
        .eq('hyperfocus_id', validated.hyperfocusId)
        .order('order_index', { ascending: false })
        .limit(1)
        .maybeSingle();

      let nextOrder = (maxOrderResult?.order_index ?? -1) + 1;

      // Criar cada subtarefa
      for (const suggestion of suggestions) {
        const { data: task, error: insertError } = await supabase
          .from('tasks')
          .insert({
            hyperfocus_id: validated.hyperfocusId,
            title: suggestion.title,
            description: suggestion.description,
            estimated_minutes: suggestion.estimatedMinutes,
            order_index: nextOrder++,
          })
          .select('id, title, description, estimated_minutes, completed')
          .single();

        if (insertError) {
          log.error({ error: insertError }, 'Erro ao criar subtarefa');
          throw new DatabaseError('Falha ao criar subtarefas');
        }

        if (task) {
          createdTasks.push({
            id: task.id,
            title: task.title,
            description: task.description,
            estimatedMinutes: task.estimated_minutes,
            completed: Boolean(task.completed),
          });
        }
      }

      log.info(
        { hyperfocusId: validated.hyperfocusId, count: createdTasks.length },
        'Subtarefas criadas automaticamente'
      );
    }

    // Buscar todas as tarefas atualizadas se auto-criou
    let allTasks: Array<{ id: string; title: string; completed: boolean }> = [];
    if (validated.autoCreate) {
      const { data: tasksList } = await supabase
        .from('tasks')
        .select('id, title, completed, order_index')
        .eq('hyperfocus_id', validated.hyperfocusId)
        .order('order_index', { ascending: true });

      allTasks = (tasksList || []).map((t) => ({
        id: t.id,
        title: t.title,
        completed: Boolean(t.completed),
      }));
    }

    log.info(
      {
        hyperfocusId: validated.hyperfocusId,
        suggestionsCount: suggestions.length,
        autoCreated: validated.autoCreate,
      },
      'Análise de subtarefas concluída'
    );

    return {
      structuredContent: {
        type: 'subtasks_breakdown',
        originalDescription: validated.taskDescription,
        suggestions,
        autoCreated: validated.autoCreate,
        createdTasks: validated.autoCreate ? createdTasks : undefined,
        analysis: {
          complexity: analyzeComplexity(validated.taskDescription),
          estimatedTotalMinutes: suggestions.reduce(
            (sum, s) => sum + s.estimatedMinutes,
            0
          ),
        },
      },
      component: validated.autoCreate
        ? {
          type: 'inline',
          name: 'TaskBreakdown',
          props: {
            hyperfocusId: validated.hyperfocusId,
            hyperfocusTitle: hyperfocus.title,
            tasks: allTasks,
          },
        }
        : {
          type: 'inline',
          name: 'SubtaskSuggestions',
          props: {
            hyperfocusId: validated.hyperfocusId,
            suggestions,
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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Gera sugestões de subtarefas baseado em heurísticas
 * Em produção, isso seria feito por um LLM (GPT-4, Claude, etc)
 */
function generateSubtaskSuggestions(
  description: string,
  numSubtasks: number
): Array<{ title: string; description: string; estimatedMinutes: number }> {
  const suggestions: Array<{
    title: string;
    description: string;
    estimatedMinutes: number;
  }> = [];

  // Palavras-chave para identificar tipo de tarefa
  const researchKeywords = ['pesquisar', 'estudar', 'aprender', 'investigar'];
  const planKeywords = ['planejar', 'organizar', 'estruturar', 'definir'];
  const executeKeywords = ['fazer', 'criar', 'desenvolver', 'implementar'];
  const testKeywords = ['testar', 'validar', 'verificar', 'revisar'];

  const lowerDesc = description.toLowerCase();

  // Template de fases comuns
  const phases = [
    {
      verb: 'Pesquisar',
      desc: 'Pesquisar e coletar informações sobre',
      time: 30,
      condition: () =>
        researchKeywords.some((k) => lowerDesc.includes(k)) || suggestions.length === 0,
    },
    {
      verb: 'Planejar',
      desc: 'Planejar e estruturar',
      time: 25,
      condition: () =>
        planKeywords.some((k) => lowerDesc.includes(k)) || suggestions.length <= 1,
    },
    {
      verb: 'Implementar',
      desc: 'Implementar e desenvolver',
      time: 45,
      condition: () =>
        executeKeywords.some((k) => lowerDesc.includes(k)) || suggestions.length <= 2,
    },
    {
      verb: 'Testar',
      desc: 'Testar e validar',
      time: 20,
      condition: () =>
        testKeywords.some((k) => lowerDesc.includes(k)) || suggestions.length <= 3,
    },
    {
      verb: 'Documentar',
      desc: 'Documentar resultados e aprendizados',
      time: 15,
      condition: () => suggestions.length <= 4,
    },
    {
      verb: 'Revisar',
      desc: 'Revisar e refinar',
      time: 20,
      condition: () => suggestions.length <= 5,
    },
  ];

  // Gerar subtarefas baseadas nas fases
  for (const phase of phases) {
    if (suggestions.length >= numSubtasks) break;
    if (phase.condition()) {
      // Extrair primeiro trecho da descrição (até 50 chars)
      const shortDesc = description.slice(0, 50).trim();
      const contextSuffix = shortDesc.length < description.length ? '...' : '';

      suggestions.push({
        title: `${phase.verb}: ${shortDesc}${contextSuffix}`,
        description: `${phase.desc} "${shortDesc}${contextSuffix}"`,
        estimatedMinutes: phase.time,
      });
    }
  }

  // Se ainda não temos subtarefas suficientes, adicionar genéricas
  const genericVerbs = ['Executar', 'Trabalhar em', 'Avançar com', 'Desenvolver'];
  while (suggestions.length < numSubtasks) {
    const verb = genericVerbs[suggestions.length % genericVerbs.length];
    const shortDesc = description.slice(0, 40).trim();

    suggestions.push({
      title: `${verb}: ${shortDesc}...`,
      description: `Passo ${suggestions.length + 1} para completar a tarefa`,
      estimatedMinutes: 25,
    });
  }

  return suggestions.slice(0, numSubtasks);
}

/**
 * Analisa complexidade da descrição
 */
function analyzeComplexity(description: string): 'low' | 'medium' | 'high' {
  const wordCount = description.split(/\s+/).length;
  const sentenceCount = description.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;

  // Palavras que indicam complexidade
  const complexKeywords = [
    'integração',
    'arquitetura',
    'sistema',
    'complexo',
    'avançado',
    'otimização',
    'escalabilidade',
    'performance',
    'algoritmo',
  ];

  const hasComplexKeywords = complexKeywords.some((keyword) =>
    description.toLowerCase().includes(keyword)
  );

  let score = 0;
  if (wordCount > 100) score += 2;
  else if (wordCount > 50) score += 1;

  if (sentenceCount > 5) score += 1;

  if (hasComplexKeywords) score += 2;

  if (score >= 4) return 'high';
  if (score >= 2) return 'medium';
  return 'low';
}

export const breakIntoSubtasksMetadata: McpToolMetadata = {
  name: 'breakIntoSubtasks',
  description: `Analyzes a task description and suggests or automatically creates subtasks.

Use this tool when:
- User has a complex task that needs to be broken down
- User asks "how do I approach this?" or "help me break this down"
- User seems overwhelmed by a large task
- User wants to organize a multi-step process

Perfect for neurodivergent users who struggle with executive function and task initiation.

Examples:
- "Break down 'learn React' into steps" → Suggests: Research React, Setup project, Build first component, etc.
- "Help me organize my thesis writing" → Creates subtasks for research, outline, writing, editing
- User says a complex goal → Automatically suggest actionable steps`,
  inputSchema: {
    type: 'object',
    properties: {
      hyperfocusId: {
        type: 'string',
        description: 'UUID of the hyperfocus where subtasks will be created',
      },
      taskDescription: {
        type: 'string',
        description: 'Description of the task to break down (10-2000 characters)',
        minLength: 10,
        maxLength: 2000,
      },
      numSubtasks: {
        type: 'number',
        description: 'Number of subtasks to generate (2-10, default: 5)',
        minimum: 2,
        maximum: 10,
        default: 5,
      },
      autoCreate: {
        type: 'boolean',
        description: 'Automatically create the suggested tasks (default: false)',
        default: false,
      },
    },
    required: ['hyperfocusId', 'taskDescription'],
  },
  _meta: {
    readOnly: false,
    requiresConfirmation: true,
    requiresAuth: true,
    allowAnonymous: false,
    authScopes: [AUTH_SCOPES.TASKS_WRITE, AUTH_SCOPES.AI_ANALYZE],
    'openai/outputTemplate': 'SubtaskSuggestions',
    category: 'analysis',
    tags: ['tasks', 'ai', 'breakdown', 'intelligent'],
    rateLimitTier: 'high'
  },
};

