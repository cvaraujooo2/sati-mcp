/**
 * Create Alternancy Tool
 * Cria uma sessão de alternância entre múltiplos hiperfocos
 */

import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';
import { DatabaseError, NotFoundError, ValidationError, BusinessLogicError } from '@/lib/utils/errors';
import { toolLogger } from '@/lib/utils/logger';
import { McpToolMetadata, AUTH_SCOPES } from '../types/metadata';

const log = toolLogger.child({ tool: 'createAlternancy' });

const createAlternancySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  hyperfocusSessions: z
    .array(
      z.object({
        hyperfocusId: z.string().uuid('hyperfocusId inválido'),
        durationMinutes: z
          .number()
          .int()
          .min(5, 'Duração mínima é 5 minutos')
          .max(120, 'Duração máxima é 120 minutos'),
      })
    )
    .min(2, 'Alternância deve ter pelo menos 2 hiperfocos')
    .max(5, 'Alternância deve ter no máximo 5 hiperfocos'),
  autoStart: z.boolean().optional().default(false),
});

export type CreateAlternancyInput = z.infer<typeof createAlternancySchema>;

export async function createAlternancyHandler(
  input: CreateAlternancyInput,
  userId: string
) {
  log.info({ userId, input }, 'Criando sessão de alternância');

  try {
    const validated = createAlternancySchema.parse(input);

    // Validar que todos os hiperfocos existem e pertencem ao usuário
    const hyperfocusIds = validated.hyperfocusSessions.map((hs) => hs.hyperfocusId);

    const { data: hyperfocusList, error: hyperfocusError } = await supabase
      .from('hyperfocus')
      .select('id, title, color')
      .in('id', hyperfocusIds)
      .eq('user_id', userId);

    if (hyperfocusError) {
      log.error({ error: hyperfocusError }, 'Erro ao buscar hiperfocos');
      throw new DatabaseError('Falha ao validar hiperfocos');
    }

    if (!hyperfocusList || hyperfocusList.length !== hyperfocusIds.length) {
      const foundIds = new Set(hyperfocusList?.map((h) => h.id) || []);
      const missingIds = hyperfocusIds.filter((id) => !foundIds.has(id));
      log.warn({ missingIds, userId }, 'Alguns hiperfocos não encontrados');
      throw new NotFoundError(`Hiperfocos não encontrados: ${missingIds.join(', ')}`);
    }

    // Verificar se há sessão ativa
    const { data: activeSessions } = await supabase
      .from('alternancy_sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('active', true)
      .limit(1);

    if (activeSessions && activeSessions.length > 0) {
      log.warn({ userId }, 'Usuário já tem sessão de alternância ativa');
      throw new BusinessLogicError(
        'Você já tem uma sessão de alternância ativa. Finalize-a antes de criar outra.'
      );
    }

    // Criar sessão de alternância
    const { data: alternancySession, error: sessionError } = await supabase
      .from('alternancy_sessions')
      .insert({
        user_id: userId,
        name: validated.name || 'Sessão de Alternância',
        active: true,
      })
      .select('id, name, created_at')
      .single();

    if (sessionError) {
      log.error({ error: sessionError }, 'Erro ao criar sessão de alternância');
      throw new DatabaseError('Falha ao criar sessão de alternância');
    }

    // Criar vínculos com hiperfocos
    const hyperfocusLinks = validated.hyperfocusSessions.map((hs, index) => ({
      alternancy_session_id: alternancySession.id,
      hyperfocus_id: hs.hyperfocusId,
      duration_minutes: hs.durationMinutes,
      order_index: index,
    }));

    const { error: linksError } = await supabase
      .from('alternancy_hyperfocus')
      .insert(hyperfocusLinks);

    if (linksError) {
      log.error({ error: linksError }, 'Erro ao criar vínculos de alternância');
      // Rollback: deletar sessão criada
      await supabase.from('alternancy_sessions').delete().eq('id', alternancySession.id);
      throw new DatabaseError('Falha ao configurar alternância');
    }

    // Montar response com detalhes dos hiperfocos
    const hyperfocusMap = new Map(hyperfocusList.map((h) => [h.id, h]));

    const sessions = validated.hyperfocusSessions.map((hs, index) => {
      const hf = hyperfocusMap.get(hs.hyperfocusId);
      return {
        order: index + 1,
        hyperfocus: {
          id: hs.hyperfocusId,
          title: hf?.title || 'Unknown',
          color: hf?.color || 'blue',
        },
        durationMinutes: hs.durationMinutes,
      };
    });

    const totalDuration = validated.hyperfocusSessions.reduce(
      (sum, hs) => sum + hs.durationMinutes,
      0
    );

    log.info(
      {
        alternancyId: alternancySession.id,
        sessionCount: sessions.length,
        totalDuration,
      },
      'Sessão de alternância criada com sucesso'
    );

    // Se autoStart, iniciar primeira sessão
    let firstFocusSession = null;
    if (validated.autoStart && sessions.length > 0) {
      const firstSession = sessions[0];
      const { data: focusSession } = await supabase
        .from('focus_sessions')
        .insert({
          hyperfocus_id: firstSession.hyperfocus.id,
          planned_duration_minutes: firstSession.durationMinutes,
          started_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      firstFocusSession = focusSession;
    }

    return {
      structuredContent: {
        type: 'alternancy_created',
        alternancy: {
          id: alternancySession.id,
          name: alternancySession.name,
          createdAt: alternancySession.created_at,
          active: true,
        },
        sessions,
        totalDurationMinutes: totalDuration,
        autoStarted: validated.autoStart,
        currentSession: firstFocusSession
          ? {
              focusSessionId: firstFocusSession.id,
              hyperfocus: sessions[0].hyperfocus,
              durationMinutes: sessions[0].durationMinutes,
            }
          : null,
      },
      component: validated.autoStart && firstFocusSession
        ? {
            type: 'fullscreen',
            name: 'AlternancyFlow',
            props: {
              alternancyId: alternancySession.id,
              alternancyName: alternancySession.name,
              sessions,
              currentIndex: 0,
              focusSessionId: firstFocusSession.id,
            },
          }
        : {
            type: 'inline',
            name: 'AlternancyPreview',
            props: {
              alternancyId: alternancySession.id,
              alternancyName: alternancySession.name,
              sessions,
              totalDuration,
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

export const createAlternancyMetadata: McpToolMetadata = {
  name: 'createAlternancy',
  description: `Creates an alternancy session that rotates between multiple hyperfocuses.

Use this tool when:
- User has multiple interests they want to work on
- User struggles with monotony and needs variety (ADHD)
- User wants structured task-switching
- User says "rotate between X and Y" or "alternate my work"

Perfect for neurodivergent users who benefit from structured variety and task-switching.

Examples:
- "Alternate between React learning (30 min) and music production (25 min)" → Creates rotation
- "I want to work on 3 projects today, rotating every 20 minutes" → Sets up alternancy
- "Help me switch between coding and writing" → Creates structured alternation`,
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name for this alternancy session (optional)',
        maxLength: 100,
      },
      hyperfocusSessions: {
        type: 'array',
        description: 'Array of hyperfocuses with their durations (2-5 items)',
        minItems: 2,
        maxItems: 5,
        items: {
          type: 'object',
          properties: {
            hyperfocusId: {
              type: 'string',
              description: 'UUID of the hyperfocus',
            },
            durationMinutes: {
              type: 'number',
              description: 'Duration for this hyperfocus session (5-120 minutes)',
              minimum: 5,
              maximum: 120,
            },
          },
          required: ['hyperfocusId', 'durationMinutes'],
        },
      },
      autoStart: {
        type: 'boolean',
        description: 'Automatically start the first session (default: false)',
        default: false,
      },
    },
    required: ['hyperfocusSessions'],
  },
  _meta: {
    readOnly: false,
    requiresConfirmation: true,
    requiresAuth: true,
    allowAnonymous: false,
    authScopes: [AUTH_SCOPES.ALTERNANCY_WRITE, AUTH_SCOPES.HYPERFOCUS_READ],
    'openai/outputTemplate': 'AlternancyFlow',
    category: 'productivity',
    tags: ['alternancy', 'flow', 'adhd', 'context-switching'],
    rateLimitTier: 'medium'
  },
};

