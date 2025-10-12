/**
 * End Focus Timer Tool
 * Finaliza uma sessão de foco ativa
 */

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { DatabaseError, NotFoundError, ValidationError, BusinessLogicError } from '@/lib/utils/errors';
import { toolLogger } from '@/lib/utils/logger';
import { McpToolMetadata, AUTH_SCOPES } from '../types/metadata';

const log = toolLogger.child({ tool: 'endFocusTimer' });

const endFocusTimerSchema = z.object({
  sessionId: z.string().uuid('sessionId inválido'),
  interrupted: z.boolean().optional().default(false),
  actualDurationMinutes: z
    .number()
    .int('Duração deve ser um número inteiro')
    .min(0)
    .optional(),
});

export type EndFocusTimerInput = z.infer<typeof endFocusTimerSchema>;

export async function endFocusTimerHandler(input: EndFocusTimerInput, userId: string) {
  log.info({ userId, input }, 'Finalizando timer de foco');

  try {
    const supabase = await createClient();

    const validated = endFocusTimerSchema.parse(input);

    // Buscar sessão
    const { data: session, error: sessionError } = await supabase
      .from('focus_sessions')
      .select('id, hyperfocus_id, started_at, ended_at, planned_duration_minutes')
      .eq('id', validated.sessionId)
      .maybeSingle();

    if (sessionError) {
      log.error({ error: sessionError }, 'Erro ao buscar sessão');
      throw new DatabaseError('Falha ao buscar sessão de foco');
    }

    if (!session) {
      log.warn({ sessionId: validated.sessionId }, 'Sessão não encontrada');
      throw new NotFoundError('Sessão de foco');
    }

    // Validar ownership do hiperfoco
    const { data: hyperfocus, error: hyperfocusError } = await supabase
      .from('hyperfocus')
      .select('id, title, user_id')
      .eq('id', session.hyperfocus_id)
      .maybeSingle();

    if (hyperfocusError) {
      log.error({ error: hyperfocusError }, 'Erro ao buscar hiperfoco');
      throw new DatabaseError('Falha ao validar hiperfoco');
    }

    if (!hyperfocus || hyperfocus.user_id !== userId) {
      log.warn({ sessionId: validated.sessionId, userId }, 'Sessão não pertence ao usuário');
      throw new BusinessLogicError('Esta sessão não pertence a você');
    }

    // Verificar se já foi finalizada
    if (session.ended_at) {
      log.warn({ sessionId: validated.sessionId }, 'Sessão já foi finalizada');
      throw new BusinessLogicError('Esta sessão de foco já foi finalizada');
    }

    // Calcular duração real se não fornecida
    let actualDuration = validated.actualDurationMinutes;
    if (actualDuration === undefined) {
      const startTime = new Date(session.started_at).getTime();
      const endTime = Date.now();
      actualDuration = Math.round((endTime - startTime) / 1000 / 60);
    }

    // Finalizar sessão
    const { error: updateError } = await supabase
      .from('focus_sessions')
      .update({
        ended_at: new Date().toISOString(),
        actual_duration_minutes: actualDuration,
        interrupted: validated.interrupted,
      })
      .eq('id', validated.sessionId);

    if (updateError) {
      log.error({ error: updateError }, 'Erro ao finalizar sessão');
      throw new DatabaseError('Falha ao finalizar sessão de foco');
    }

    // Calcular estatísticas
    const completionRate = Math.round(
      (actualDuration / session.planned_duration_minutes) * 100
    );
    const wasSuccessful = !validated.interrupted && completionRate >= 80;

    // Buscar todas as sessões do hiperfoco para estatísticas
    const { data: allSessions } = await supabase
      .from('focus_sessions')
      .select('actual_duration_minutes, interrupted')
      .eq('hyperfocus_id', session.hyperfocus_id)
      .not('ended_at', 'is', null);

    const totalSessions = allSessions?.length || 0;
    const totalMinutes =
      allSessions?.reduce((sum, s) => sum + (s.actual_duration_minutes || 0), 0) || 0;
    const completedSessions = allSessions?.filter((s) => !s.interrupted).length || 0;

    log.info(
      {
        sessionId: validated.sessionId,
        actualDuration,
        interrupted: validated.interrupted,
        completionRate,
      },
      'Timer de foco finalizado com sucesso'
    );

    return {
      structuredContent: {
        type: 'focus_timer_ended',
        session: {
          id: validated.sessionId,
          hyperfocusId: session.hyperfocus_id,
          hyperfocusTitle: hyperfocus.title,
          startedAt: session.started_at,
          endedAt: new Date().toISOString(),
          plannedDurationMinutes: session.planned_duration_minutes,
          actualDurationMinutes: actualDuration,
          interrupted: validated.interrupted,
          completionRate,
          successful: wasSuccessful,
        },
        statistics: {
          totalSessions,
          completedSessions,
          totalMinutesInvested: totalMinutes,
        },
        feedback: wasSuccessful
          ? '🎉 Excelente! Você completou sua sessão de foco com sucesso!'
          : validated.interrupted
          ? '😊 Tudo bem! Até sessões interrompidas são progresso. Continue tentando!'
          : '👍 Boa tentativa! Considere ajustar a duração do timer na próxima vez.',
      },
      component: {
        type: 'inline',
        name: 'FocusSessionSummary',
        props: {
          session: {
            hyperfocusTitle: hyperfocus.title,
            plannedMinutes: session.planned_duration_minutes,
            actualMinutes: actualDuration,
            interrupted: validated.interrupted,
            completionRate,
            successful: wasSuccessful,
          },
          statistics: {
            totalSessions,
            completedSessions,
            totalMinutes,
          },
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

export const endFocusTimerMetadata: McpToolMetadata = {
  name: 'endFocusTimer',
  description: `Ends an active focus session and records the results.

Use this tool when:
- User finishes a focus session
- Timer naturally ends
- User needs to stop early (interruption)
- User wants to see session results

Tracks actual time spent and provides encouraging feedback.

Examples:
- "I'm done with my focus session" → End timer, show results
- "Stop the timer" → End timer (might be interrupted)
- Timer reaches 0 → Automatically end and show summary`,
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: {
        type: 'string',
        description: 'UUID of the focus session to end',
      },
      interrupted: {
        type: 'boolean',
        description: 'Whether the session was interrupted (default: false)',
        default: false,
      },
      actualDurationMinutes: {
        type: 'number',
        description: 'Actual duration in minutes (calculated automatically if not provided)',
        minimum: 0,
      },
    },
    required: ['sessionId'],
  },
  _meta: {
    readOnly: false,
    requiresConfirmation: false,
    requiresAuth: true,
    allowAnonymous: false,
    authScopes: [AUTH_SCOPES.TIMER_WRITE],
    'openai/outputTemplate': 'FocusSessionSummary',
    category: 'timer',
    tags: ['timer', 'focus', 'summary', 'statistics'],
    rateLimitTier: 'low'
  },
};

