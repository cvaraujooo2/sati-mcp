/**
 * Analyze Context Tool
 * Analisa o contexto de um hiperfoco e fornece insights inteligentes usando LLM
 */

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
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
    const supabase = await createClient();

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

    // Executar análise usando LLM
    const analysis = await analyzeContextWithLLM(
      validated.userInput,
      hyperfocus,
      tasks || [],
      validated.analysisType,
      userId
    );

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

/**
 * Analisa contexto usando LLM (OpenAI GPT-4) para insights inteligentes
 */
async function analyzeContextWithLLM(
  userInput: string,
  hyperfocus: HyperfocusData,
  tasks: TaskData[],
  analysisType: string,
  userId: string
): Promise<any> {
  try {
    // Obter cliente Supabase com sessão do servidor
    const supabase = await createClient();
    
    // Buscar API key do usuário
    const { data: apiKeyData, error: keyError } = await supabase
      .from('user_api_keys')
      .select('encrypted_key')
      .eq('user_id', userId)
      .eq('provider', 'openai')
      .single();

    if (keyError || !apiKeyData) {
      log.warn({ userId }, 'API key não encontrada, usando fallback heurístico');
      return analyzeContextHeuristic(userInput, hyperfocus, tasks, analysisType);
    }

    // Configurar OpenAI client
    const openai = createOpenAI({
      apiKey: apiKeyData.encrypted_key,
    });

    // Preparar contexto das tarefas
    const tasksContext = tasks.length > 0
      ? `\n\nTarefas existentes (${tasks.length} tarefas):
${tasks.map((t, i) => `${i + 1}. ${t.title} ${t.completed ? '✅' : '⬜'} (${t.estimated_minutes || '?'} min)`).join('\n')}`
      : '\n\nNenhuma tarefa criada ainda.';

    // Preparar contexto do hiperfoco
    const hyperfocusContext = `
Hiperfoco: "${hyperfocus.title}"
${hyperfocus.description ? `Descrição: ${hyperfocus.description}` : ''}
${hyperfocus.estimated_time_minutes ? `Tempo estimado total: ${hyperfocus.estimated_time_minutes} minutos` : ''}${tasksContext}`;

    // Prompts especializados por tipo de análise
    const prompts = {
      complexity: {
        system: `Você é um especialista em produtividade para neurodivergentes (ADHD/Autismo).

Analise a COMPLEXIDADE de uma tarefa ou projeto e forneça insights PRÁTICOS.

FOCO EM:
- Complexidade REALISTA (não subestime desafios neurodivergentes)
- Identificação de bloqueadores emocionais/executivos
- Fatores que aumentam dificuldade para ADHD/autistas
- Sugestões ACIONÁVEIS para reduzir complexidade

Retorne um JSON com esta estrutura:
{
  "complexity": "low" | "medium" | "high",
  "score": 0-10,
  "factors": {
    "technical": string,
    "emotional": string,
    "executive": string
  },
  "challenges": string[],
  "recommendation": string,
  "actionableSteps": string[]
}`,
        user: `${hyperfocusContext}

CONTEXTO DO USUÁRIO:
${userInput}

Analise a complexidade desta tarefa/projeto considerando desafios neurodivergentes.`
      },
      time_estimate: {
        system: `Você é um especialista em produtividade para neurodivergentes.

Analise e estime o TEMPO NECESSÁRIO para completar uma tarefa/projeto.

CONSIDERE:
- Time blindness comum em ADHD (adicione buffer de 1.5x-2x)
- Necessidade de breaks regulares
- Sessões de foco realistas (25-45min ADHD, 60-90min autismo)
- Tempo para transição entre tarefas
- Imprevistos e distrações

Retorne um JSON com esta estrutura:
{
  "totalEstimatedMinutes": number,
  "totalEstimatedHours": number,
  "withBuffer": number,
  "sessionsNeeded": number,
  "sessionBreakdown": {
    "task": string,
    "minutes": number
  }[],
  "recommendation": string,
  "consideringNeurodivergence": string
}`,
        user: `${hyperfocusContext}

CONTEXTO DO USUÁRIO:
${userInput}

Estime quanto tempo será necessário, considerando perfil neurodivergente.`
      },
      dependencies: {
        system: `Você é um especialista em planejamento de projetos para neurodivergentes.

Analise DEPENDÊNCIAS entre tarefas e sugira ordem de execução.

FOCO EM:
- Identificar tarefas bloqueadoras
- Sugerir ordem que minimiza fricção executiva
- Identificar tarefas que podem ser feitas em paralelo
- "Quick wins" para gerar momentum

Retorne um JSON com esta estrutura:
{
  "hasDependencies": boolean,
  "orderedTasks": {
    "task": string,
    "order": number,
    "blockedBy": string[],
    "canStartNow": boolean
  }[],
  "quickWins": string[],
  "criticalPath": string[],
  "recommendation": string
}`,
        user: `${hyperfocusContext}

CONTEXTO DO USUÁRIO:
${userInput}

Analise dependências e sugira ordem de execução otimizada.`
      },
      breakdown: {
        system: `Você é um especialista em quebrar tarefas complexas para neurodivergentes.

Analise uma tarefa/projeto e sugira como QUEBRAR em partes menores.

REGRAS:
- Subtarefas de 15-30 min (ADHD) ou 30-60 min (autismo)
- Títulos com verbos de ação
- Ordem lógica de execução
- Descrições claras do QUE e COMO fazer

Retorne um JSON com esta estrutura:
{
  "totalSteps": number,
  "breakdown": {
    "step": number,
    "title": string,
    "description": string,
    "estimatedMinutes": number,
    "difficulty": "easy" | "medium" | "hard"
  }[],
  "recommendation": string
}`,
        user: `${hyperfocusContext}

CONTEXTO DO USUÁRIO:
${userInput}

Sugira como quebrar isso em passos menores e gerenciáveis.`
      },
      priority: {
        system: `Você é um especialista em priorização para neurodivergentes.

Analise e sugira PRIORIDADES de tarefas.

CONSIDERE:
- Urgência vs Importância
- Impacto emocional de deixar algo pendente
- Tarefas que "desbloqueiam" outras
- "Quick wins" para momentum
- Energia/spoons necessários

Retorne um JSON com esta estrutura:
{
  "overallPriority": "low" | "medium" | "high" | "urgent",
  "prioritizedTasks": {
    "task": string,
    "priority": "low" | "medium" | "high",
    "reason": string,
    "energyLevel": "low" | "medium" | "high"
  }[],
  "nextBestAction": string,
  "recommendation": string,
  "emotionalConsideration": string
}`,
        user: `${hyperfocusContext}

CONTEXTO DO USUÁRIO:
${userInput}

Analise prioridades e sugira o que fazer primeiro.`
      }
    };

    const selectedPrompt = prompts[analysisType as keyof typeof prompts] || prompts.complexity;

    log.info({ userId, analysisType }, 'Gerando análise com LLM');

    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      messages: [
        { role: 'system', content: selectedPrompt.system },
        { role: 'user', content: selectedPrompt.user },
      ],
      temperature: 0.7,
      maxRetries: 2,
    });

    // Parse do JSON retornado
    const cleanedText = text.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
    const analysis = JSON.parse(cleanedText);

    log.info({ userId, analysisType }, 'Análise gerada com sucesso via LLM');

    return analysis;
  } catch (error) {
    log.error({ error }, 'Erro ao gerar análise com LLM, usando fallback heurístico');
    return analyzeContextHeuristic(userInput, hyperfocus, tasks, analysisType);
  }
}

/**
 * Fallback: Análise heurística quando LLM não está disponível
 */
function analyzeContextHeuristic(
  userInput: string,
  hyperfocus: HyperfocusData,
  tasks: TaskData[],
  analysisType: string
): any {
  switch (analysisType) {
    case 'complexity':
      return analyzeComplexity(userInput, hyperfocus, tasks);
    case 'time_estimate':
      return analyzeTimeEstimate(userInput, hyperfocus, tasks);
    case 'dependencies':
      return analyzeDependencies(userInput, tasks);
    case 'breakdown':
      return analyzeBreakdown(userInput);
    case 'priority':
      return analyzePriority(userInput, tasks);
    default:
      return analyzeComplexity(userInput, hyperfocus, tasks);
  }
}

/**
 * Funções heurísticas de fallback (mantidas para compatibilidade)
 */

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

