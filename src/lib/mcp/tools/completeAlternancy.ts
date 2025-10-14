/**
 * Complete Alternancy Tool
 * Marca uma sessão de alternância como completada e calcula estatísticas
 */

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { DatabaseError, NotFoundError, BusinessLogicError } from '@/lib/utils/errors';
import { toolLogger } from '@/lib/utils/logger';
import { McpToolMetadata, AUTH_SCOPES } from '../types/metadata';

const log = toolLogger.child({ tool: 'completeAlternancy' });

const completeAlternancySchema = z.object({
  sessionId: z.string().uuid('sessionId inválido'),
  feedback: z.string().max(500).optional(),
});

export type CompleteAlternancyInput = z.infer<typeof completeAlternancySchema>;

export async function completeAlternancyHandler(
  input: CompleteAlternancyInput,
  userId: string
) {
  log.info({ userId, input }, 'Completando sessão de alternância');

  try {
    const supabase = await createClient();
    const validated = completeAlternancySchema.parse(input);

    // 1. Buscar sessão
    const { data: session, error: sessionError } = await supabase
      .from('alternancy_sessions')
      .select('*')
      .eq('id', validated.sessionId)
      .maybeSingle();

    if (sessionError) {
      log.error({ error: sessionError }, 'Erro ao buscar sessão');
      throw new DatabaseError('Falha ao buscar sessão de alternância');
    }

    if (!session) {
      log.warn({ sessionId: validated.sessionId }, 'Sessão não encontrada');
      throw new NotFoundError('Sessão de alternância');
    }

    // 2. Validar ownership
    const hyperfocusSequence = session.hyperfocus_sequence as Array<{
      hyperfocusId: string;
      hyperfocusTitle: string;
      color: string;
      durationMinutes: number;
    }>;

    if (!hyperfocusSequence || hyperfocusSequence.length === 0) {
      log.error({ sessionId: validated.sessionId }, 'Sessão sem hiperfocos');
      throw new BusinessLogicError('Sessão de alternância inválida');
    }

    const firstHyperfocusId = hyperfocusSequence[0].hyperfocusId;
    const { data: hyperfocus, error: hyperfocusError } = await supabase
      .from('hyperfocus')
      .select('user_id')
      .eq('id', firstHyperfocusId)
      .maybeSingle();

    if (hyperfocusError) {
      log.error({ error: hyperfocusError }, 'Erro ao validar ownership');
      throw new DatabaseError('Falha ao validar hiperfoco');
    }

    if (!hyperfocus || hyperfocus.user_id !== userId) {
      log.warn({ sessionId: validated.sessionId, userId }, 'Sessão não pertence ao usuário');
      throw new BusinessLogicError('Sessão não pertence ao usuário');
    }

    // 3. Verificar se já foi completada
    if (session.status === 'completed') {
      log.warn({ sessionId: validated.sessionId }, 'Sessão já foi completada');
      throw new BusinessLogicError('Sessão já foi completada');
    }

    // 4. Calcular estatísticas
    const completedAt = new Date().toISOString();
    let actualDurationMinutes = 0;

    if (session.started_at) {
      const startTime = new Date(session.started_at).getTime();
      const endTime = new Date(completedAt).getTime();
      actualDurationMinutes = Math.round((endTime - startTime) / 1000 / 60);
    }

    // Calcular duração planejada total
    const plannedDurationMinutes = hyperfocusSequence.reduce(
      (sum, h) => sum + h.durationMinutes,
      0
    );

    // Adicionar breaks entre hiperfocos
    const transitionBreakMinutes = session.transition_break_minutes || 5;
    const totalPlannedMinutes =
      plannedDurationMinutes + (hyperfocusSequence.length - 1) * transitionBreakMinutes;

    // Calcular eficiência
    const efficiency =
      totalPlannedMinutes > 0
        ? Math.round((actualDurationMinutes / totalPlannedMinutes) * 100)
        : 100;

    // 5. Atualizar sessão
    const { error: updateError } = await supabase
      .from('alternancy_sessions')
      .update({
        status: 'completed',
        completed_at: completedAt,
        actual_duration_minutes: actualDurationMinutes,
        feedback: validated.feedback,
      })
      .eq('id', validated.sessionId);

    if (updateError) {
      log.error({ error: updateError }, 'Erro ao completar sessão');
      throw new DatabaseError('Falha ao completar alternância');
    }

    log.info(
      {
        sessionId: validated.sessionId,
        userId,
        actualDurationMinutes,
        efficiency,
      },
      'Sessão de alternância completada com sucesso'
    );

    // 6. Gerar feedback motivacional baseado na performance
    let performanceFeedback = '';
    if (efficiency >= 95) {
      performanceFeedback =
        '🌟 Excepcional! Você manteve o ritmo planejado perfeitamente.';
    } else if (efficiency >= 80) {
      performanceFeedback = '✨ Ótima sessão! Você ficou muito próximo do planejado.';
    } else if (efficiency >= 60) {
      performanceFeedback =
        '👍 Boa sessão! Continue praticando para melhorar a consistência.';
    } else {
      performanceFeedback =
        '💪 Sessão desafiadora. Considere reduzir a duração ou aumentar os breaks.';
    }

    // 7. Retornar estado completado
    return {
      structuredContent: {
        type: 'alternancy_completed',
        sessionId: validated.sessionId,
        status: 'completed',
        completedAt,
        actualDurationMinutes,
        plannedDurationMinutes: totalPlannedMinutes,
        efficiency,
        hyperfocusCount: hyperfocusSequence.length,
        performanceFeedback,
      },
      component: {
        type: 'inline',
        name: 'AlternancyFlow',
        props: {
          sessionId: validated.sessionId,
          name: session.name,
          status: 'completed',
          completedAt,
          actualDurationMinutes,
          plannedDurationMinutes: totalPlannedMinutes,
          efficiency,
          sequence: hyperfocusSequence,
          transitionBreakMinutes,
        },
      },
      textContent: `🎉 Sessão de alternância "${session.name}" completada! ${actualDurationMinutes}min de foco em ${hyperfocusSequence.length} hiperfocos. ${performanceFeedback}`,
    };
  } catch (error) {
    log.error({ error, userId, input }, 'Erro ao completar alternância');
    throw error;
  }
}

export const completeAlternancyMetadata: McpToolMetadata = {
  name: 'completeAlternancy',
  description: 'Use this tool to mark an alternancy session as completed and calculate performance statistics. Provides encouraging feedback based on efficiency and adherence to planned schedule. Particularly useful for tracking neurodivergent users\' focus patterns.',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: {
        type: 'string',
        format: 'uuid',
        description: 'ID of the alternancy session to complete',
      },
      feedback: {
        type: 'string',
        maxLength: 500,
        description: 'Optional user feedback about the session',
      },
    },
    required: ['sessionId'],
  },
  _meta: {
    readOnly: false,
    requiresConfirmation: false,
    requiresAuth: true,
    allowAnonymous: false,
    authScopes: [AUTH_SCOPES.ALTERNANCY_WRITE],
    category: 'timer',
    tags: ['focus', 'alternancy', 'complete', 'statistics'],
    rateLimitTier: 'medium',
    'openai/outputTemplate': 'AlternancyFlow',
  },
};
