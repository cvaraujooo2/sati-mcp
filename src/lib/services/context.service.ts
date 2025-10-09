/**
 * Context Service
 * Análise de contexto e inteligência artificial
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import * as queries from '@/lib/supabase/queries';
import { AnalyzeContextInput } from '@/lib/mcp/schemas';
import { serviceLogger, logBusinessEvent } from '@/lib/utils/logger';
import { BusinessLogicError } from '@/lib/utils/errors';

export class ContextService {
  constructor(private client: SupabaseClient<Database>) {}

  /**
   * Analisa contexto de um hiperfoco
   */
  async analyze(userId: string, input: AnalyzeContextInput) {
    serviceLogger.info(
      {
        userId,
        hyperfocusId: input.hyperfocus_id,
        analysisType: input.analysis_type,
      },
      'Analyzing context'
    );

    // Validar ownership
    await this.validateHyperfocusOwnership(userId, input.hyperfocus_id);

    // Buscar hiperfoco e tarefas existentes
    const hyperfocus = await queries.getHyperfocusById(
      this.client,
      userId,
      input.hyperfocus_id
    );
    const tasks = await queries.listTasks(this.client, input.hyperfocus_id);

    // Executar análise baseada no tipo
    let analysis;
    switch (input.analysis_type) {
      case 'complexity':
        analysis = this.analyzeComplexity(input.user_input, hyperfocus, tasks);
        break;
      case 'time_estimate':
        analysis = this.analyzeTimeEstimate(input.user_input, hyperfocus, tasks);
        break;
      case 'dependencies':
        analysis = this.analyzeDependencies(input.user_input, tasks);
        break;
      case 'breakdown':
        analysis = this.analyzeBreakdown(input.user_input);
        break;
      case 'priority':
        analysis = this.analyzePriority(input.user_input, tasks);
        break;
      default:
        analysis = this.analyzeComplexity(input.user_input, hyperfocus, tasks);
    }

    logBusinessEvent('context_analyzed', {
      hyperfocusId: input.hyperfocus_id,
      analysisType: input.analysis_type,
    }, userId);

    return analysis;
  }

  /**
   * Salva contexto de um hiperfoco
   */
  async save(userId: string, hyperfocusId: string, contextData: Record<string, unknown>) {
    serviceLogger.info({ userId, hyperfocusId }, 'Saving context');

    // Validar ownership
    await this.validateHyperfocusOwnership(userId, hyperfocusId);

    // Sanitizar dados sensíveis antes de salvar
    const sanitizedData = this.sanitizeContext(contextData);

    const context = await queries.saveHyperfocusContext(
      this.client,
      hyperfocusId,
      sanitizedData
    );

    logBusinessEvent('context_saved', { hyperfocusId }, userId);

    return context;
  }

  /**
   * Busca contexto salvo de um hiperfoco
   */
  async get(userId: string, hyperfocusId: string) {
    serviceLogger.debug({ userId, hyperfocusId }, 'Getting context');

    // Validar ownership
    await this.validateHyperfocusOwnership(userId, hyperfocusId);

    return await queries.getHyperfocusContext(this.client, hyperfocusId);
  }

  /**
   * Gera sugestões de subtarefas baseado em contexto
   */
  async suggestSubtasks(
    userId: string,
    hyperfocusId: string,
    taskDescription: string,
    numSubtasks = 5
  ): Promise<Array<{ title: string; description: string; estimated_minutes: number }>> {
    serviceLogger.info(
      { userId, hyperfocusId, numSubtasks },
      'Suggesting subtasks'
    );

    // Validar ownership
    await this.validateHyperfocusOwnership(userId, hyperfocusId);

    // Análise heurística para gerar subtarefas
    // Em produção, isso seria feito por um LLM (GPT-4, Claude, etc)
    const suggestions = this.generateSubtaskSuggestions(taskDescription, numSubtasks);

    logBusinessEvent('subtasks_suggested', {
      hyperfocusId,
      count: suggestions.length,
    }, userId);

    return suggestions;
  }

  // ============================================================================
  // ANÁLISES HEURÍSTICAS
  // ============================================================================

  private analyzeComplexity(
    userInput: string,
    hyperfocus: Record<string, unknown>,
    tasks: Array<Record<string, unknown>>
  ) {
    // Heurísticas simples de complexidade
    const wordCount = userInput.split(/\s+/).length;
    const taskCount = tasks.length;

    let complexity: 'low' | 'medium' | 'high';
    let score = 0;

    // Fatores de complexidade
    if (wordCount > 100) score += 2;
    else if (wordCount > 50) score += 1;

    if (taskCount > 10) score += 2;
    else if (taskCount > 5) score += 1;

    // Palavras-chave que indicam alta complexidade
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

    // Classificar
    if (score >= 4) complexity = 'high';
    else if (score >= 2) complexity = 'medium';
    else complexity = 'low';

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
          ? 'Considere quebrar em subtarefas menores e mais gerenciáveis'
          : complexity === 'medium'
          ? 'Complexidade moderada. Pode ser útil definir marcos intermediários'
          : 'Tarefa bem definida. Pode ser executada diretamente',
    };
  }

  private analyzeTimeEstimate(
    userInput: string,
    hyperfocus: Record<string, unknown>,
    tasks: Array<Record<string, unknown>>
  ) {
    // Estimativa baseada em heurísticas
    const taskCount = tasks.length;
    const estimatedMinutesPerTask = 30; // Padrão
    const totalEstimated = taskCount * estimatedMinutesPerTask;

    const breakdown = tasks.map((task) => ({
      task: task.title,
      estimated: task.estimated_minutes || estimatedMinutesPerTask,
    }));

    return {
      total_estimated_minutes: totalEstimated,
      total_estimated_hours: Math.round((totalEstimated / 60) * 10) / 10,
      breakdown,
      recommendation:
        totalEstimated > 240
          ? 'Considere dividir em múltiplas sessões de foco'
          : totalEstimated > 120
          ? 'Planeje pausas regulares'
          : 'Pode ser concluído em uma sessão de foco',
    };
  }

  private analyzeDependencies(userInput: string, tasks: Array<Record<string, unknown>>) {
    // Análise simples de dependências
    // Em produção, usar NLP para detectar relações

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

    return {
      has_dependencies: hasDependencies,
      task_count: tasks.length,
      recommendation: hasDependencies
        ? 'Identifique e ordene as tarefas por dependências'
        : 'Tarefas parecem independentes. Pode executar em qualquer ordem',
      suggested_order: tasks.map((task, index) => ({
        position: index + 1,
        task: task.title,
      })),
    };
  }

  private analyzeBreakdown(userInput: string) {
    // Sugere como quebrar a tarefa
    const sentences = userInput.split(/[.!?]+/).filter((s) => s.trim().length > 0);

    const breakdown = sentences.slice(0, 5).map((sentence, index) => ({
      step: index + 1,
      description: sentence.trim(),
      estimated_minutes: 20 + Math.floor(Math.random() * 20), // 20-40 min
    }));

    return {
      total_steps: breakdown.length,
      breakdown,
      recommendation: 'Use estes passos como guia para criar subtarefas',
    };
  }

  private analyzePriority(userInput: string, tasks: Array<Record<string, unknown>>) {
    // Análise de prioridade baseada em palavras-chave
    const urgencyKeywords = ['urgente', 'imediato', 'crítico', 'importante', 'prioridade'];
    const hasUrgency = urgencyKeywords.some((keyword) =>
      userInput.toLowerCase().includes(keyword)
    );

    const priorityScore = hasUrgency ? 'high' : 'medium';

    const taskPriorities = tasks.map((task, index) => ({
      task: task.title,
      priority: index === 0 ? 'high' : index === 1 ? 'medium' : 'low',
      reason: index === 0 ? 'Primeira tarefa listada' : 'Ordem sequencial',
    }));

    return {
      overall_priority: priorityScore,
      has_urgency_indicators: hasUrgency,
      task_priorities: taskPriorities,
      recommendation:
        priorityScore === 'high'
          ? 'Comece esta tarefa o quanto antes'
          : 'Planeje dentro do seu cronograma normal',
    };
  }

  private generateSubtaskSuggestions(
    description: string,
    numSubtasks: number
  ): Array<{ title: string; description: string; estimated_minutes: number }> {
    // Geração heurística de subtarefas
    // Em produção, usar LLM para gerar sugestões contextuais

    const verbs = ['Pesquisar', 'Planejar', 'Implementar', 'Testar', 'Documentar'];
    const suggestions: Array<{
      title: string;
      description: string;
      estimated_minutes: number;
    }> = [];

    for (let i = 0; i < Math.min(numSubtasks, 5); i++) {
      suggestions.push({
        title: `${verbs[i] || 'Executar'} - ${description.slice(0, 30)}...`,
        description: `Passo ${i + 1} para completar: ${description}`,
        estimated_minutes: 20 + i * 10,
      });
    }

    return suggestions;
  }

  private sanitizeContext(contextData: Record<string, unknown>): Record<string, unknown> {
    // Remove dados sensíveis antes de salvar
    const sanitized = { ...contextData };

    // Lista de chaves sensíveis para remover
    const sensitiveKeys = [
      'password',
      'token',
      'secret',
      'api_key',
      'private_key',
      'credit_card',
    ];

    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))) {
        delete sanitized[key];
      }
    }

    return sanitized;
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private async validateHyperfocusOwnership(
    userId: string,
    hyperfocusId: string
  ): Promise<void> {
    const hyperfocus = await queries.getHyperfocusById(this.client, userId, hyperfocusId);

    if (hyperfocus.user_id !== userId) {
      throw new BusinessLogicError('Você não tem permissão para acessar este hiperfoco');
    }
  }
}

