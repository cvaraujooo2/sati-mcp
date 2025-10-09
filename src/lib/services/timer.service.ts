/**
 * Timer Service
 * Lógica de negócio para sessões de foco e timer
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import * as queries from '@/lib/supabase/queries';
import { StartFocusTimerInput, EndFocusTimerInput } from '@/lib/mcp/schemas';
import { serviceLogger, logBusinessEvent } from '@/lib/utils/logger';
import { NotFoundError, BusinessLogicError } from '@/lib/utils/errors';

type FocusSession = Database['public']['Tables']['focus_sessions']['Row'];

export class TimerService {
  constructor(private client: SupabaseClient<Database>) {}

  /**
   * Inicia sessão de foco
   */
  async startSession(userId: string, input: StartFocusTimerInput): Promise<FocusSession> {
    serviceLogger.info(
      {
        userId,
        hyperfocusId: input.hyperfocus_id,
        duration: input.planned_duration_minutes,
      },
      'Starting focus session'
    );

    // Validar se hiperfoco existe e pertence ao usuário
    await this.validateHyperfocusOwnership(userId, input.hyperfocus_id);

    // Verificar se já existe sessão ativa
    const activeSessions = await this.getActiveSessions(userId, input.hyperfocus_id);
    if (activeSessions.length > 0) {
      throw new BusinessLogicError(
        'Já existe uma sessão de foco ativa para este hiperfoco. Finalize-a antes de iniciar outra.'
      );
    }

    // Criar sessão
    const session = await queries.startFocusSession(this.client, {
      hyperfocus_id: input.hyperfocus_id,
      planned_duration_minutes: input.planned_duration_minutes,
      started_at: new Date().toISOString(),
    });

    logBusinessEvent('focus_session_started', {
      sessionId: session.id,
      hyperfocusId: input.hyperfocus_id,
      plannedDuration: input.planned_duration_minutes,
    }, userId);

    return session;
  }

  /**
   * Finaliza sessão de foco
   */
  async endSession(userId: string, input: EndFocusTimerInput): Promise<FocusSession> {
    serviceLogger.info(
      {
        userId,
        sessionId: input.session_id,
        interrupted: input.interrupted,
      },
      'Ending focus session'
    );

    // Buscar sessão
    const session = await this.getSessionById(input.session_id);

    // Validar ownership
    await this.validateHyperfocusOwnership(userId, session.hyperfocus_id);

    // Verificar se já foi finalizada
    if (session.ended_at) {
      throw new BusinessLogicError('Esta sessão de foco já foi finalizada');
    }

    // Calcular duração real se não fornecida
    let actualDuration = input.actual_duration_minutes;
    if (actualDuration === undefined) {
      const startTime = new Date(session.started_at).getTime();
      const endTime = Date.now();
      actualDuration = Math.round((endTime - startTime) / 1000 / 60);
    }

    // Finalizar sessão
    const endedSession = await queries.endFocusSession(
      this.client,
      input.session_id,
      actualDuration,
      input.interrupted || false
    );

    logBusinessEvent(
      input.interrupted ? 'focus_session_interrupted' : 'focus_session_completed',
      {
        sessionId: input.session_id,
        hyperfocusId: session.hyperfocus_id,
        plannedDuration: session.planned_duration_minutes,
        actualDuration,
      },
      userId
    );

    return endedSession;
  }

  /**
   * Busca sessão por ID
   */
  async getSessionById(sessionId: string): Promise<FocusSession> {
    const { data, error } = await this.client
      .from('focus_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error || !data) {
      throw new NotFoundError('Sessão de foco', sessionId);
    }

    return data;
  }

  /**
   * Lista todas as sessões de um hiperfoco
   */
  async listSessions(userId: string, hyperfocusId: string): Promise<FocusSession[]> {
    serviceLogger.debug({ userId, hyperfocusId }, 'Listing focus sessions');

    // Validar ownership
    await this.validateHyperfocusOwnership(userId, hyperfocusId);

    return await queries.listFocusSessions(this.client, hyperfocusId);
  }

  /**
   * Busca sessões ativas (não finalizadas)
   */
  async getActiveSessions(userId: string, hyperfocusId: string): Promise<FocusSession[]> {
    serviceLogger.debug({ userId, hyperfocusId }, 'Getting active focus sessions');

    const allSessions = await this.listSessions(userId, hyperfocusId);

    return allSessions.filter((session) => !session.ended_at);
  }

  /**
   * Cancela/interrompe sessão ativa
   */
  async cancelSession(userId: string, sessionId: string): Promise<FocusSession> {
    serviceLogger.warn({ userId, sessionId }, 'Canceling focus session');

    return await this.endSession(userId, {
      session_id: sessionId,
      interrupted: true,
    });
  }

  /**
   * Estatísticas de sessões de foco
   */
  async getStatistics(userId: string, hyperfocusId: string) {
    serviceLogger.debug({ userId, hyperfocusId }, 'Getting focus session statistics');

    // Validar ownership
    await this.validateHyperfocusOwnership(userId, hyperfocusId);

    const sessions = await queries.listFocusSessions(this.client, hyperfocusId);

    const total = sessions.length;
    const completed = sessions.filter((s) => s.ended_at && !s.interrupted).length;
    const interrupted = sessions.filter((s) => s.interrupted).length;
    const active = sessions.filter((s) => !s.ended_at).length;

    const totalPlannedMinutes = sessions.reduce(
      (sum, s) => sum + s.planned_duration_minutes,
      0
    );

    const totalActualMinutes = sessions
      .filter((s) => s.actual_duration_minutes !== null)
      .reduce((sum, s) => sum + (s.actual_duration_minutes || 0), 0);

    const averageCompletionRate =
      completed > 0
        ? Math.round(
            (sessions
              .filter((s) => s.ended_at && !s.interrupted)
              .reduce((sum, s) => {
                const planned = s.planned_duration_minutes;
                const actual = s.actual_duration_minutes || 0;
                return sum + (actual / planned) * 100;
              }, 0) /
              completed)
          )
        : 0;

    return {
      total,
      completed,
      interrupted,
      active,
      totalPlannedMinutes,
      totalActualMinutes,
      averageCompletionRate,
    };
  }

  /**
   * Verifica se há sessão ativa para o usuário (qualquer hiperfoco)
   */
  async hasAnyActiveSession(userId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('focus_sessions')
      .select('id, hyperfocus_id')
      .is('ended_at', null)
      .limit(1);

    if (error) {
      serviceLogger.error({ userId, error }, 'Error checking for active sessions');
      return false;
    }

    if (!data || data.length === 0) {
      return false;
    }

    // Verificar ownership do hiperfoco
    try {
      await this.validateHyperfocusOwnership(userId, data[0].hyperfocus_id);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Busca sessão ativa atual do usuário
   */
  async getCurrentActiveSession(userId: string): Promise<FocusSession | null> {
    const { data, error } = await this.client
      .from('focus_sessions')
      .select('*')
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    // Verificar ownership
    try {
      await this.validateHyperfocusOwnership(userId, data.hyperfocus_id);
      return data;
    } catch {
      return null;
    }
  }

  /**
   * Calcula tempo restante de uma sessão ativa
   */
  getRemainingTime(session: FocusSession): number {
    if (session.ended_at) {
      return 0;
    }

    const startTime = new Date(session.started_at).getTime();
    const plannedEndTime = startTime + session.planned_duration_minutes * 60 * 1000;
    const now = Date.now();

    const remainingMs = plannedEndTime - now;
    return Math.max(0, Math.round(remainingMs / 1000 / 60));
  }

  /**
   * Calcula tempo decorrido de uma sessão
   */
  getElapsedTime(session: FocusSession): number {
    const startTime = new Date(session.started_at).getTime();
    const endTime = session.ended_at ? new Date(session.ended_at).getTime() : Date.now();

    return Math.round((endTime - startTime) / 1000 / 60);
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
}

