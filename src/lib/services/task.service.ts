/**
 * Task Service
 * Lógica de negócio para tarefas
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import * as queries from '@/lib/supabase/queries';
import {
  CreateTaskInput,
  UpdateTaskInput,
  ReorderTasksInput,
} from '@/lib/mcp/schemas';
import { serviceLogger, logBusinessEvent } from '@/lib/utils/logger';
import { NotFoundError, BusinessLogicError } from '@/lib/utils/errors';

type Task = Database['public']['Tables']['tasks']['Row'];

export class TaskService {
  constructor(private client: SupabaseClient<Database>) {}

  /**
   * Cria nova tarefa
   */
  async create(userId: string, input: CreateTaskInput): Promise<Task> {
    serviceLogger.info(
      { userId, hyperfocusId: input.hyperfocus_id, title: input.title },
      'Creating task'
    );

    // Validar se hiperfoco existe e pertence ao usuário
    await this.validateHyperfocusOwnership(userId, input.hyperfocus_id);

    // Validações de negócio
    this.validateTitle(input.title);

    const task = await queries.createTask(this.client, {
      hyperfocus_id: input.hyperfocus_id,
      title: input.title,
      description: input.description || null,
      estimated_minutes: input.estimated_minutes || null,
      order_index: input.order_index,
      completed: false,
    });

    logBusinessEvent('task_created', {
      taskId: task.id,
      hyperfocusId: input.hyperfocus_id,
    }, userId);

    return task;
  }

  /**
   * Lista tarefas de um hiperfoco
   */
  async list(userId: string, hyperfocusId: string, completed?: boolean): Promise<Task[]> {
    serviceLogger.debug({ userId, hyperfocusId, completed }, 'Listing tasks');

    // Validar ownership
    await this.validateHyperfocusOwnership(userId, hyperfocusId);

    return await queries.listTasks(this.client, hyperfocusId, completed);
  }

  /**
   * Busca tarefa por ID
   */
  async getById(userId: string, id: string): Promise<Task> {
    serviceLogger.debug({ userId, taskId: id }, 'Getting task by ID');

    const task = await queries.getTaskById(this.client, id);

    // Validar ownership do hiperfoco pai
    await this.validateHyperfocusOwnership(userId, task.hyperfocus_id);

    return task;
  }

  /**
   * Atualiza tarefa
   */
  async update(userId: string, id: string, input: UpdateTaskInput): Promise<Task> {
    serviceLogger.info({ userId, taskId: id }, 'Updating task');

    // Validar ownership
    const existingTask = await this.getById(userId, id);

    // Validar título se fornecido
    if (input.title) {
      this.validateTitle(input.title);
    }

    const task = await queries.updateTask(this.client, id, {
      ...(input.title && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.completed !== undefined && { completed: input.completed }),
      ...(input.estimated_minutes !== undefined && {
        estimated_minutes: input.estimated_minutes,
      }),
      ...(input.order_index !== undefined && { order_index: input.order_index }),
    });

    // Log evento de conclusão se aplicável
    if (input.completed === true && !existingTask.completed) {
      logBusinessEvent('task_completed', {
        taskId: id,
        hyperfocusId: task.hyperfocus_id,
      }, userId);
    } else if (input.completed === false && existingTask.completed) {
      logBusinessEvent('task_uncompleted', {
        taskId: id,
        hyperfocusId: task.hyperfocus_id,
      }, userId);
    }

    return task;
  }

  /**
   * Toggle status de tarefa
   */
  async toggle(userId: string, id: string, completed?: boolean): Promise<Task> {
    serviceLogger.info({ userId, taskId: id, completed }, 'Toggling task');

    // Validar ownership
    await this.getById(userId, id);

    const task = await queries.toggleTask(this.client, id, completed);

    logBusinessEvent(
      task.completed ? 'task_completed' : 'task_uncompleted',
      {
        taskId: id,
        hyperfocusId: task.hyperfocus_id,
      },
      userId
    );

    return task;
  }

  /**
   * Reordena tarefas
   */
  async reorder(userId: string, input: ReorderTasksInput): Promise<Task[]> {
    serviceLogger.info(
      { userId, hyperfocusId: input.hyperfocus_id, taskCount: input.task_ids.length },
      'Reordering tasks'
    );

    // Validar ownership
    await this.validateHyperfocusOwnership(userId, input.hyperfocus_id);

    // Validar que todas as tarefas pertencem ao hiperfoco
    const existingTasks = await queries.listTasks(this.client, input.hyperfocus_id);
    const existingIds = new Set(existingTasks.map((t) => t.id));

    const invalidIds = input.task_ids.filter((id) => !existingIds.has(id));
    if (invalidIds.length > 0) {
      throw new BusinessLogicError(
        `Tarefas não pertencem ao hiperfoco: ${invalidIds.join(', ')}`
      );
    }

    const tasks = await queries.reorderTasks(
      this.client,
      input.hyperfocus_id,
      input.task_ids
    );

    logBusinessEvent('tasks_reordered', {
      hyperfocusId: input.hyperfocus_id,
      taskCount: input.task_ids.length,
    }, userId);

    return tasks;
  }

  /**
   * Deleta tarefa
   */
  async delete(userId: string, id: string): Promise<void> {
    serviceLogger.warn({ userId, taskId: id }, 'Deleting task');

    // Validar ownership
    const task = await this.getById(userId, id);

    await queries.deleteTask(this.client, id);

    logBusinessEvent('task_deleted', {
      taskId: id,
      hyperfocusId: task.hyperfocus_id,
    }, userId);
  }

  /**
   * Criar múltiplas tarefas de uma vez (batch)
   */
  async createBatch(
    userId: string,
    hyperfocusId: string,
    tasks: Array<{ title: string; description?: string; estimated_minutes?: number }>
  ): Promise<Task[]> {
    serviceLogger.info(
      { userId, hyperfocusId, count: tasks.length },
      'Creating tasks in batch'
    );

    // Validar ownership
    await this.validateHyperfocusOwnership(userId, hyperfocusId);

    // Validar títulos
    tasks.forEach((task) => this.validateTitle(task.title));

    // Criar tarefas
    const createdTasks: Task[] = [];
    for (let i = 0; i < tasks.length; i++) {
      const task = await queries.createTask(this.client, {
        hyperfocus_id: hyperfocusId,
        title: tasks[i].title,
        description: tasks[i].description || null,
        estimated_minutes: tasks[i].estimated_minutes || null,
        order_index: i,
        completed: false,
      });
      createdTasks.push(task);
    }

    logBusinessEvent('tasks_batch_created', {
      hyperfocusId,
      count: tasks.length,
    }, userId);

    return createdTasks;
  }

  /**
   * Completa todas as tarefas de um hiperfoco
   */
  async completeAll(userId: string, hyperfocusId: string): Promise<Task[]> {
    serviceLogger.info({ userId, hyperfocusId }, 'Completing all tasks');

    // Validar ownership
    await this.validateHyperfocusOwnership(userId, hyperfocusId);

    // Buscar tarefas não completadas
    const tasks = await queries.listTasks(this.client, hyperfocusId, false);

    // Completar todas
    const completedTasks: Task[] = [];
    for (const task of tasks) {
      const completed = await queries.updateTask(this.client, task.id, { completed: true });
      completedTasks.push(completed);
    }

    logBusinessEvent('tasks_all_completed', {
      hyperfocusId,
      count: completedTasks.length,
    }, userId);

    return completedTasks;
  }

  /**
   * Estatísticas de tarefas
   */
  async getStatistics(userId: string, hyperfocusId: string) {
    serviceLogger.debug({ userId, hyperfocusId }, 'Getting task statistics');

    // Validar ownership
    await this.validateHyperfocusOwnership(userId, hyperfocusId);

    const allTasks = await queries.listTasks(this.client, hyperfocusId);

    const total = allTasks.length;
    const completed = allTasks.filter((t) => t.completed).length;
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const totalEstimatedMinutes = allTasks.reduce(
      (sum, task) => sum + (task.estimated_minutes || 0),
      0
    );

    return {
      total,
      completed,
      pending,
      completionRate,
      totalEstimatedMinutes,
    };
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private async validateHyperfocusOwnership(
    userId: string,
    hyperfocusId: string
  ): Promise<void> {
    const hyperfocus = await queries.getHyperfocusById(this.client, userId, hyperfocusId);

    if (!hyperfocus) {
      throw new NotFoundError('Hiperfoco', hyperfocusId);
    }

    if (hyperfocus.user_id !== userId) {
      throw new BusinessLogicError('Você não tem permissão para acessar este hiperfoco');
    }
  }

  private validateTitle(title: string): void {
    if (title.trim().length === 0) {
      throw new BusinessLogicError('Título da tarefa não pode ser vazio');
    }

    if (title.length > 200) {
      throw new BusinessLogicError('Título da tarefa deve ter no máximo 200 caracteres');
    }
  }
}

