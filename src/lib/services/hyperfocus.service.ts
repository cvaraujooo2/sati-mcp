/**
 * Hyperfocus Service
 * Lógica de negócio para hiperfocos
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import * as queries from '@/lib/supabase/queries';
import {
  CreateHyperfocusInput,
  UpdateHyperfocusInput,
  ListHyperfocusInput,
} from '@/lib/mcp/schemas';
import { serviceLogger, logBusinessEvent } from '@/lib/utils/logger';
import { NotFoundError, BusinessLogicError } from '@/lib/utils/errors';

type Hyperfocus = Database['public']['Tables']['hyperfocus']['Row'];

export class HyperfocusService {
  constructor(private client: SupabaseClient<Database>) {}

  /**
   * Cria novo hiperfoco
   */
  async create(userId: string, input: CreateHyperfocusInput): Promise<Hyperfocus> {
    serviceLogger.info({ userId, title: input.title }, 'Creating hyperfocus');

    // Validações de negócio
    this.validateTitle(input.title);

    const hyperfocus = await queries.createHyperfocus(this.client, userId, {
      title: input.title,
      description: input.description || null,
      color: input.color || 'blue',
      estimated_time_minutes: input.estimated_time_minutes || null,
    });

    logBusinessEvent('hyperfocus_created', {
      hyperfocusId: hyperfocus.id,
      color: hyperfocus.color,
    }, userId);

    return hyperfocus;
  }

  /**
   * Lista hiperfocos do usuário
   */
  async list(userId: string, options: ListHyperfocusInput): Promise<Hyperfocus[]> {
    serviceLogger.debug({ userId, options }, 'Listing hyperfocus');

    return await queries.listHyperfocus(this.client, userId, {
      archived: options.archived,
      color: options.color,
      limit: options.limit,
      offset: options.offset,
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
    });
  }

  /**
   * Busca hiperfoco por ID
   */
  async getById(userId: string, id: string): Promise<Hyperfocus> {
    serviceLogger.debug({ userId, hyperfocusId: id }, 'Getting hyperfocus by ID');

    const hyperfocus = await queries.getHyperfocusById(this.client, userId, id);

    if (!hyperfocus) {
      throw new NotFoundError('Hiperfoco', id);
    }

    return hyperfocus;
  }

  /**
   * Atualiza hiperfoco
   */
  async update(
    userId: string,
    id: string,
    input: UpdateHyperfocusInput
  ): Promise<Hyperfocus> {
    serviceLogger.info({ userId, hyperfocusId: id }, 'Updating hyperfocus');

    // Validar título se fornecido
    if (input.title) {
      this.validateTitle(input.title);
    }

    const hyperfocus = await queries.updateHyperfocus(this.client, userId, id, {
      ...(input.title && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.color && { color: input.color }),
      ...(input.estimated_time_minutes !== undefined && {
        estimated_time_minutes: input.estimated_time_minutes,
      }),
      ...(input.archived !== undefined && { archived: input.archived }),
    });

    logBusinessEvent('hyperfocus_updated', { hyperfocusId: id }, userId);

    return hyperfocus;
  }

  /**
   * Arquiva hiperfoco
   */
  async archive(userId: string, id: string, archived = true): Promise<Hyperfocus> {
    serviceLogger.info({ userId, hyperfocusId: id, archived }, 'Archiving hyperfocus');

    const hyperfocus = await queries.archiveHyperfocus(this.client, userId, id, archived);

    logBusinessEvent(
      archived ? 'hyperfocus_archived' : 'hyperfocus_unarchived',
      { hyperfocusId: id },
      userId
    );

    return hyperfocus;
  }

  /**
   * Deleta hiperfoco permanentemente
   */
  async delete(userId: string, id: string): Promise<void> {
    serviceLogger.warn({ userId, hyperfocusId: id }, 'Deleting hyperfocus permanently');

    // Verificar se existe
    await this.getById(userId, id);

    await queries.deleteHyperfocus(this.client, userId, id);

    logBusinessEvent('hyperfocus_deleted', { hyperfocusId: id }, userId);
  }

  /**
   * Busca hiperfocos com tarefas (join)
   */
  async getWithTasks(userId: string, id: string) {
    const hyperfocus = await this.getById(userId, id);
    const tasks = await queries.listTasks(this.client, id);

    return {
      ...hyperfocus,
      tasks,
    };
  }

  /**
   * Estatísticas de hiperfocos
   */
  async getStatistics(userId: string, startDate?: string, endDate?: string) {
    serviceLogger.debug({ userId, startDate, endDate }, 'Getting hyperfocus statistics');

    return await queries.getHyperfocusStatistics(this.client, userId, startDate, endDate);
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private validateTitle(title: string): void {
    if (title.trim().length === 0) {
      throw new BusinessLogicError('Título não pode ser vazio');
    }

    if (title.length > 100) {
      throw new BusinessLogicError('Título deve ter no máximo 100 caracteres');
    }

    // Validar caracteres proibidos (opcional)
    const forbiddenChars = ['<', '>', '{', '}', '|', '\\', '^', '~', '[', ']', '`'];
    const hasForbidden = forbiddenChars.some((char) => title.includes(char));

    if (hasForbidden) {
      throw new BusinessLogicError('Título contém caracteres inválidos');
    }
  }
}

