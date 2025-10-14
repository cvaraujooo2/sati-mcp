/**
 * Start Alternancy Tool
 * Inicia uma sessão de alternância previamente criada
 */

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { DatabaseError, NotFoundError, BusinessLogicError } from '@/lib/utils/errors';
import { toolLogger } from '@/lib/utils/logger';
import { McpToolMetadata, AUTH_SCOPES } from '../types/metadata';

const log = toolLogger.child({ tool: 'startAlternancy' });

const startAlternancySchema = z.object({
  sessionId: z.string().uuid('sessionId inválido'),
});

export type StartAlternancyInput = z.infer<typeof startAlternancySchema>;

export async function startAlternancyHandler(
  input: StartAlternancyInput,
  userId: string
) {
  log.info({ userId, input }, 'Iniciando sessão de alternância');

  try {
    const supabase = await createClient();
    const validated = startAlternancySchema.parse(input);

    // 1. Buscar sessão de alternância
    const { data: session, error: sessionError } = await supabase
      .from('alternancy_sessions')
      .select('*')
      .eq('id', validated.sessionId)
      .maybeSingle();

    if (sessionError) {
      log.error({ error: sessionError }, 'Erro ao buscar sessão de alternância');
      throw new DatabaseError('Falha ao buscar sessão de alternância');
    }

    if (!session) {
      log.warn({ sessionId: validated.sessionId }, 'Sessão não encontrada');
      throw new NotFoundError('Sessão de alternância');
    }

    // 2. Validar ownership (via primeiro hyperfocus)
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

    // 3. Verificar se já está ativa
    if (session.status === 'active') {
      log.warn({ sessionId: validated.sessionId }, 'Sessão já está ativa');
      throw new BusinessLogicError('Sessão já está ativa');
    }

    if (session.status === 'completed') {
      log.warn({ sessionId: validated.sessionId }, 'Sessão já foi completada');
      throw new BusinessLogicError('Sessão já foi completada');
    }

    // 4. Atualizar status para 'active'
    const startedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('alternancy_sessions')
      .update({
        status: 'active',
        started_at: startedAt,
        current_index: 0,
      })
      .eq('id', validated.sessionId);

    if (updateError) {
      log.error({ error: updateError }, 'Erro ao atualizar sessão');
      throw new DatabaseError('Falha ao iniciar alternância');
    }

    log.info(
      { sessionId: validated.sessionId, userId },
      'Sessão de alternância iniciada com sucesso'
    );

    // 5. Retornar estado atualizado
    return {
      structuredContent: {
        type: 'alternancy_started',
        sessionId: validated.sessionId,
        status: 'active',
        startedAt,
        currentIndex: 0,
        sequence: hyperfocusSequence,
      },
      component: {
        type: 'expanded',
        name: 'AlternancyFlow',
        props: {
          sessionId: validated.sessionId,
          name: session.name,
          status: 'in_progress',
          currentIndex: 0,
          startedAt,
          sequence: hyperfocusSequence,
          transitionBreakMinutes: session.transition_break_minutes || 5,
        },
      },
      textContent: `✅ Sessão de alternância "${session.name}" iniciada! Timer ativo.`,
    };
  } catch (error) {
    log.error({ error, userId, input }, 'Erro ao iniciar alternância');
    throw error;
  }
}

export const startAlternancyMetadata: McpToolMetadata = {
  name: 'startAlternancy',
  description: 'Use this tool to start a previously created alternancy session. This begins the focus timer for the first hyperfocus in the sequence. Best for ADHD users who want to maintain engagement through structured rotation between interests.',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: {
        type: 'string',
        format: 'uuid',
        description: 'ID of the alternancy session to start',
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
    tags: ['focus', 'alternancy', 'start', 'timer'],
    rateLimitTier: 'medium',
    'openai/outputTemplate': 'AlternancyFlow',
  },
};
