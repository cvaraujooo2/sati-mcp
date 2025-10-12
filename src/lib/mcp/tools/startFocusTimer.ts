/**
 * Start Focus Timer Tool
 * Inicia uma sessão de foco cronometrada para um hiperfoco
 */

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { DatabaseError, NotFoundError, ValidationError, BusinessLogicError } from '@/lib/utils/errors';
import { toolLogger } from '@/lib/utils/logger';
import { McpToolMetadata, AUTH_SCOPES } from '../types/metadata';

const log = toolLogger.child({ tool: 'startFocusTimer' });

const startFocusTimerSchema = z.object({
  hyperfocusId: z.string().uuid('hyperfocusId inválido'),
  durationMinutes: z
    .number()
    .int('Duração deve ser um número inteiro')
    .min(1, 'Duração mínima é 1 minuto')
    .max(180, 'Duração máxima é 180 minutos (3 horas)'),
  playSound: z.boolean().optional().default(true),
});

export type StartFocusTimerInput = z.infer<typeof startFocusTimerSchema>;

export async function startFocusTimerHandler(
  input: StartFocusTimerInput,
  userId: string
) {
  log.info({ userId, input }, 'Iniciando timer de foco');

  try {
    const supabase = await createClient();

    const validated = startFocusTimerSchema.parse(input);

    // Validar que hiperfoco existe e pertence ao usuário
    const { data: hyperfocus, error: hyperfocusError } = await supabase
      .from('hyperfocus')
      .select('id, title, color')
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

    // Verificar se já existe sessão ativa
    const { data: activeSessions, error: activeError } = await supabase
      .from('focus_sessions')
      .select('id, hyperfocus_id')
      .is('ended_at', null)
      .limit(1);

    if (activeError) {
      log.error({ error: activeError }, 'Erro ao verificar sessões ativas');
      throw new DatabaseError('Falha ao verificar sessões ativas');
    }

    if (activeSessions && activeSessions.length > 0) {
      // Verificar se a sessão ativa pertence ao usuário
      const { data: activeHyperfocus } = await supabase
        .from('hyperfocus')
        .select('user_id')
        .eq('id', activeSessions[0].hyperfocus_id)
        .maybeSingle();

      if (activeHyperfocus && activeHyperfocus.user_id === userId) {
        log.warn({ userId, activeSessionId: activeSessions[0].id }, 'Já existe sessão ativa');
        throw new BusinessLogicError(
          'Você já tem uma sessão de foco ativa. Finalize-a antes de iniciar outra.'
        );
      }
    }

    // Criar nova sessão de foco
    const { data: session, error: sessionError } = await supabase
      .from('focus_sessions')
      .insert({
        hyperfocus_id: validated.hyperfocusId,
        planned_duration_minutes: validated.durationMinutes,
        started_at: new Date().toISOString(),
      })
      .select('id, started_at, planned_duration_minutes')
      .single();

    if (sessionError) {
      log.error({ error: sessionError }, 'Erro ao criar sessão de foco');
      throw new DatabaseError('Falha ao iniciar sessão de foco');
    }

    // Calcular horário de término
    const endTime = new Date(
      new Date(session.started_at).getTime() + validated.durationMinutes * 60 * 1000
    );

    log.info(
      {
        sessionId: session.id,
        hyperfocusId: validated.hyperfocusId,
        duration: validated.durationMinutes,
      },
      'Timer de foco iniciado com sucesso'
    );

    return {
      structuredContent: {
        type: 'focus_timer_started',
        session: {
          id: session.id,
          hyperfocusId: validated.hyperfocusId,
          hyperfocusTitle: hyperfocus.title,
          startedAt: session.started_at,
          plannedDurationMinutes: session.planned_duration_minutes,
          estimatedEndTime: endTime.toISOString(),
        },
        timer: {
          durationMinutes: validated.durationMinutes,
          durationSeconds: validated.durationMinutes * 60,
          playSound: validated.playSound,
        },
      },
      component: {
        type: 'fullscreen',
        name: 'FocusTimer',
        props: {
          sessionId: session.id,
          hyperfocus: {
            id: hyperfocus.id,
            title: hyperfocus.title,
            color: hyperfocus.color,
          },
          durationMinutes: validated.durationMinutes,
          startedAt: session.started_at,
          playSound: validated.playSound,
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

export const startFocusTimerMetadata: McpToolMetadata = {
  name: 'startFocusTimer',
  description: `Starts a focused work session with a timer for a specific hyperfocus.

Use this tool when:
- User wants to start working on something
- User says "start timer" or "let's focus on X"
- User needs help maintaining focus (time-boxing technique)
- User asks to work on a hyperfocus for a specific duration

Perfect for ADHD users who benefit from time-boxing and structured focus periods.

Examples:
- "Start a 25 minute focus session on React learning" → Start timer with Pomodoro technique
- "I want to work on my book for 1 hour" → Start 60-minute timer
- "Help me focus on music production" → Start timer (default duration)`,
  inputSchema: {
    type: 'object',
    properties: {
      hyperfocusId: {
        type: 'string',
        description: 'UUID of the hyperfocus to focus on',
      },
      durationMinutes: {
        type: 'number',
        description: 'Duration of focus session in minutes (1-180)',
        minimum: 1,
        maximum: 180,
      },
      playSound: {
        type: 'boolean',
        description: 'Play alarm sound when timer ends (default: true)',
        default: true,
      },
    },
    required: ['hyperfocusId', 'durationMinutes'],
  },
  _meta: {
    readOnly: false,
    requiresConfirmation: false,
    requiresAuth: true,
    allowAnonymous: false,
    authScopes: [AUTH_SCOPES.TIMER_WRITE],
    'openai/outputTemplate': 'FocusTimer',
    category: 'timer',
    tags: ['timer', 'focus', 'pomodoro', 'adhd'],
    rateLimitTier: 'low'
  },
};

