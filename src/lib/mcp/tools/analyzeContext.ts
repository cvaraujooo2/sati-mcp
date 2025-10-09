/**
 * Analyze Context Tool
 * Analisa o contexto de um hiperfoco e fornece insights inteligentes
 */

import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';
import { DatabaseError, NotFoundError, ValidationError } from '@/lib/utils/errors';
import { toolLogger } from '@/lib/utils/logger';
import { McpToolMetadata, AUTH_SCOPES } from '../types/metadata';

const log = toolLogger.child({ tool: 'analyzeContext' });

const analyzeContextSchema = z.object({
  hyperfocusId: z.string().uuid('hyperfocusId inválido'),
  userInput: z
    .string()
    .min(10, 'Contexto muito curto para análise')
    .max(2000, 'Contexto muito longo'),
  analysisType: z
    .enum(['complexity', 'time_estimate', 'dependencies', 'breakdown', 'priority'])
    .optional()
    .default('complexity'),
});

export type AnalyzeContextInput = z.infer<typeof analyzeContextSchema>;

export async function analyzeContextHandler(input: AnalyzeContextInput, userId: string) {
  log.info({ userId, input }, 'Analisando contexto');

  try {
    const validated = analyzeContextSchema.parse(input);

    // Validar que hiperfoco existe e pertence ao usuário
    const { data: hyperfocus, error: hyperfocusError } = await supabase
      .from('hyperfocus')
      .select('id, title, description, estimated_time_minutes')
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

    // Buscar tarefas existentes
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, completed, estimated_minutes')
      .eq('hyperfocus_id', validated.hyperfocusId)
      .order('order_index', { ascending: true });

    // Executar análise baseada no tipo
    let analysis;
    switch (validated.analysisType) {
      case 'complexity':
        analysis = analyzeComplexity(validated.userInput, hyperfocus, tasks || []);
        break;
      case 'time_estimate':
        analysis = analyzeTimeEstimate(validated.userInput, hyperfocus, tasks || []);
        break;
      case 'dependencies':
        analysis = analyzeDependencies(validated.userInput, tasks || []);
        break;
      case 'breakdown':
        analysis = analyzeBreakdown(validated.userInput);
        break;
      case 'priority':
        analysis = analyzePriority(validated.userInput, tasks || []);
        break;
      default:
        analysis = analyzeComplexity(validated.userInput, hyperfocus, tasks || []);
    }

    log.info(
      {
        hyperfocusId: validated.hyperfocusId,
        analysisType: validated.analysisType,
      },
      'Análise de contexto concluída'
    );

    return {
      structuredContent: {
        type: 'context_analysis',
        hyperfocus: {
          id: hyperfocus.id,
          title: hyperfocus.title,
        },
        analysisType: validated.analysisType,
        analysis,
        userInput: validated.userInput,
      },
      component: {
        type: 'inline',
        name: 'ContextAnalysis',
        props: {
          hyperfocusTitle: hyperfocus.title,
          analysisType: validated.analysisType,
          analysis,
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
// ANALYSIS FUNCTIONS
// ============================================================================

interface HyperfocusData {
  id: string;
  title: string;
  description?: string | null;
  estimated_time_minutes?: number | null;
}

interface TaskData {
  id: string;
  title: string;
  completed: boolean | null;
  estimated_minutes?: number | null;
}

function analyzeComplexity(userInput: string, hyperfocus: HyperfocusData, tasks: TaskData[]) {
  const wordCount = userInput.split(/\s+/).length;
  const taskCount = tasks.length;

  let score = 0;

  // Fatores de complexidade
  if (wordCount > 100) score += 2;
  else if (wordCount > 50) score += 1;

  if (taskCount > 10) score += 2;
  else if (taskCount > 5) score += 1;

  const complexKeywords = [
    'integração',
    'arquitetura',
    'sistema',
    'complexo',
    'avançado',
    'otimização',
    'escalabilidade',
  ];
  const hasComplexKeywords = complexKeywords.some((keyword) =>
    userInput.toLowerCase().includes(keyword)
  );
  if (hasComplexKeywords) score += 2;

  const complexity = score >= 4 ? 'high' : score >= 2 ? 'medium' : 'low';

  return {
    complexity,
    score,
    factors: {
      wordCount,
      taskCount,
      hasComplexKeywords,
    },
    recommendation:
      complexity === 'high'
        ? 'Considere quebrar em subtarefas menores e mais gerenciáveis. Use a ferramenta breakIntoSubtasks para ajudar.'
        : complexity === 'medium'
        ? 'Complexidade moderada. Defina marcos intermediários para manter o progresso visível.'
        : 'Tarefa bem definida. Você pode executá-la diretamente!',
    actionable: complexity === 'high' || complexity === 'medium',
  };
}

function analyzeTimeEstimate(userInput: string, hyperfocus: HyperfocusData, tasks: TaskData[]) {
  const taskCount = tasks.length;
  const existingEstimates = tasks.filter((t) => t.estimated_minutes).length;

  let totalEstimated = 0;
  if (existingEstimates > 0) {
    totalEstimated = tasks.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0);
  } else if (hyperfocus.estimated_time_minutes) {
    totalEstimated = hyperfocus.estimated_time_minutes;
  } else {
    // Estimativa heurística
    const estimatedPerTask = 30;
    totalEstimated = taskCount * estimatedPerTask;
  }

  const totalHours = Math.round((totalEstimated / 60) * 10) / 10;
  const sessionsNeeded = Math.ceil(totalEstimated / 25); // Pomodoros de 25 min

  return {
    totalEstimatedMinutes: totalEstimated,
    totalEstimatedHours: totalHours,
    sessionsNeeded,
    breakdown: tasks.map((task) => ({
      task: task.title,
      estimated: task.estimated_minutes || 30,
      completed: task.completed,
    })),
    recommendation:
      totalEstimated > 240
        ? `Este hiperfoco precisa de ~${totalHours} horas. Divida em múltiplas sessões de foco ao longo de vários dias.`
        : totalEstimated > 120
        ? `Planeje ~${totalHours} horas com pausas regulares. Use 2-3 sessões de foco.`
        : `Pode ser concluído em ${sessionsNeeded} sessão(ões) de foco. Boa escolha para começar hoje!`,
  };
}

function analyzeDependencies(userInput: string, tasks: TaskData[]) {
  const dependencyKeywords = [
    'antes',
    'depois',
    'primeiro',
    'então',
    'após',
    'depende',
    'requer',
  ];

  const hasDependencies = dependencyKeywords.some((keyword) =>
    userInput.toLowerCase().includes(keyword)
  );

  // Tentar identificar ordem lógica
  const suggestedOrder = tasks.map((task, index) => ({
    position: index + 1,
    task: task.title,
    completed: task.completed ?? false,
    canStart: index === 0 || (tasks[index - 1].completed ?? false),
  }));

  const nextActionableTask = suggestedOrder.find((t) => !t.completed && t.canStart);

  return {
    hasDependencies,
    taskCount: tasks.length,
    suggestedOrder,
    nextActionableTask: nextActionableTask || null,
    recommendation: hasDependencies
      ? 'Identifiquei dependências entre tarefas. Siga a ordem sugerida para melhor fluxo.'
      : 'As tarefas parecem independentes. Você pode executá-las em qualquer ordem!',
  };
}

function analyzeBreakdown(userInput: string) {
  const sentences = userInput
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > 10)
    .slice(0, 5);

  const breakdown = sentences.map((sentence, index) => ({
    step: index + 1,
    description: sentence.trim(),
    estimatedMinutes: 20 + Math.floor(Math.random() * 20),
  }));

  return {
    totalSteps: breakdown.length,
    breakdown,
    recommendation:
      'Use estes passos como guia para criar subtarefas. A ferramenta breakIntoSubtasks pode fazer isso automaticamente.',
  };
}

function analyzePriority(userInput: string, tasks: TaskData[]) {
  const urgencyKeywords = ['urgente', 'imediato', 'crítico', 'importante', 'prioridade'];
  const hasUrgency = urgencyKeywords.some((keyword) =>
    userInput.toLowerCase().includes(keyword)
  );

  const priorityScore = hasUrgency ? 'high' : 'medium';

  const taskPriorities = tasks.map((task, index) => {
    let priority = 'low';
    if (index === 0) priority = 'high';
    else if (index === 1) priority = 'medium';

    return {
      task: task.title,
      priority,
      completed: task.completed ?? false,
      reason: index === 0 ? 'Primeira tarefa' : index === 1 ? 'Segunda tarefa' : 'Ordem sequencial',
    };
  });

  const nextHighPriorityTask = taskPriorities.find(
    (t) => !t.completed && t.priority === 'high'
  );

  return {
    overallPriority: priorityScore,
    hasUrgencyIndicators: hasUrgency,
    taskPriorities,
    nextHighPriorityTask: nextHighPriorityTask || null,
    recommendation:
      priorityScore === 'high'
        ? '⚡ Alta prioridade detectada! Comece esta tarefa o quanto antes.'
        : '📋 Prioridade normal. Planeje dentro do seu cronograma.',
  };
}

export const analyzeContextMetadata: McpToolMetadata = {
  name: 'analyzeContext',
  description: `Analyzes the context of a hyperfocus and provides intelligent insights.

Use this tool when:
- User is uncertain how to approach a task
- User asks "how complex is this?" or "how long will this take?"
- User needs help understanding dependencies between tasks
- User wants guidance on prioritization

Provides actionable recommendations to help neurodivergent users break through analysis paralysis.

Examples:
- "How complex is learning React?" → Analyzes complexity, suggests breakdown
- "How long will my thesis take?" → Estimates time, suggests sessions
- "What should I do first?" → Analyzes priorities and dependencies`,
  inputSchema: {
    type: 'object',
    properties: {
      hyperfocusId: {
        type: 'string',
        description: 'UUID of the hyperfocus to analyze',
      },
      userInput: {
        type: 'string',
        description: 'User context or question (10-2000 characters)',
        minLength: 10,
        maxLength: 2000,
      },
      analysisType: {
        type: 'string',
        enum: ['complexity', 'time_estimate', 'dependencies', 'breakdown', 'priority'],
        description: 'Type of analysis to perform (default: complexity)',
        default: 'complexity',
      },
    },
    required: ['hyperfocusId', 'userInput'],
  },
  _meta: {
    readOnly: true,
    requiresConfirmation: false,
    requiresAuth: true,
    allowAnonymous: false,
    authScopes: [AUTH_SCOPES.AI_ANALYZE, AUTH_SCOPES.HYPERFOCUS_READ],
    'openai/outputTemplate': 'ContextAnalysis',
    category: 'analysis',
    tags: ['ai', 'analysis', 'intelligent', 'complexity', 'time-estimate'],
    rateLimitTier: 'high'
  },
};

