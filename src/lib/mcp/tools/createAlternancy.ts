/**
 * Create Alternancy Tool
 * Cria uma sessão de alternância entre múltiplos hiperfocos
 */

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { DatabaseError, NotFoundError, ValidationError, BusinessLogicError } from '@/lib/utils/errors';
import { toolLogger } from '@/lib/utils/logger';
import { McpToolMetadata, AUTH_SCOPES } from '../types/metadata';

const log = toolLogger.child({ tool: 'createAlternancy' });

// Templates pré-configurados de alternância
export const ALTERNANCY_TEMPLATES = {
  pomodoro_classic: {
    name: 'Pomodoro Clássico',
    description: 'Ciclo tradicional: 25min foco + 5min break, com break longo a cada 4 ciclos',
    pattern: [25, 5, 25, 5, 25, 5, 25, 15], // 4 pomodoros + breaks
    totalMinutes: 120,
    bestFor: 'ADHD - Mantém foco com breaks frequentes',
  },
  extended_focus: {
    name: 'Foco Estendido',
    description: 'Sessões de 45min para projetos que requerem concentração profunda',
    pattern: [45, 15, 45, 15, 45], // 3 sessões + breaks
    totalMinutes: 180,
    bestFor: 'Tarefas complexas que precisam de contexto mantido',
  },
  adhd_balanced: {
    name: 'ADHD Balanceado',
    description: 'Alternância rápida para manter engajamento e prevenir burnout',
    pattern: [25, 10, 25, 10, 25, 20], // 3 sessões + breaks progressivos
    totalMinutes: 110,
    bestFor: 'ADHD - Variação mantém interesse, breaks progressivos recarregam',
  },
  autism_deep_work: {
    name: 'Trabalho Profundo (Autismo)',
    description: 'Sessões longas para hiperfoco intenso com breaks estratégicos',
    pattern: [90, 20, 90, 20], // 2 sessões longas
    totalMinutes: 220,
    bestFor: 'Autismo - Permite mergulho profundo em interesse especial',
  },
  quick_rotation: {
    name: 'Rotação Rápida',
    description: 'Para múltiplos projetos pequenos, mantém variedade',
    pattern: [15, 5, 15, 5, 15, 5, 15], // 4 mini-sessões
    totalMinutes: 75,
    bestFor: 'Múltiplas tarefas pequenas, baixa energia executiva',
  },
  energy_aware: {
    name: 'Consciente de Energia',
    description: 'Adapta duração baseado em nível de energia (spoons)',
    pattern: [30, 15, 20, 10, 15], // Sessões decrescentes
    totalMinutes: 90,
    bestFor: 'Dias de baixa energia, respeita limites neurodivergentes',
  },
};

const createAlternancySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  template: z.enum([
    'pomodoro_classic',
    'extended_focus', 
    'adhd_balanced',
    'autism_deep_work',
    'quick_rotation',
    'energy_aware',
    'custom'
  ]).optional(),
  hyperfocusSessions: z
    .array(
      z.object({
        hyperfocusId: z.string().uuid('hyperfocusId inválido'),
        durationMinutes: z
          .number()
          .int()
          .min(5, 'Duração mínima é 5 minutos')
          .max(180, 'Duração máxima é 180 minutos'),
      })
    )
    .min(2, 'Alternância deve ter pelo menos 2 hiperfocos')
    .max(5, 'Alternância deve ter no máximo 5 hiperfocos'),
  autoStart: z.boolean().optional().default(false),
});

export type CreateAlternancyInput = z.infer<typeof createAlternancySchema>;

/**
 * Aplica template de duração a uma lista de hiperfocos
 */
function applyTemplate(
  hyperfocusSessions: Array<{ hyperfocusId: string; durationMinutes: number }>,
  templateKey?: string
): Array<{ hyperfocusId: string; durationMinutes: number }> {
  if (!templateKey || templateKey === 'custom') {
    return hyperfocusSessions;
  }

  const template = ALTERNANCY_TEMPLATES[templateKey as keyof typeof ALTERNANCY_TEMPLATES];
  if (!template) {
    return hyperfocusSessions;
  }

  // Aplicar padrão do template aos hiperfocos fornecidos
  // Cicla pelos hiperfocos se o padrão for maior que a quantidade
  return template.pattern.map((duration, index) => ({
    hyperfocusId: hyperfocusSessions[index % hyperfocusSessions.length].hyperfocusId,
    durationMinutes: duration,
  }));
}

export async function createAlternancyHandler(
  input: CreateAlternancyInput,
  userId: string
) {
  log.info({ userId, input }, 'Criando sessão de alternância');

  try {
    const supabase = await createClient();

    const validated = createAlternancySchema.parse(input);

    // Aplicar template se fornecido
    const sessionsWithTemplate = validated.template 
      ? applyTemplate(validated.hyperfocusSessions, validated.template)
      : validated.hyperfocusSessions;

    const templateInfo = validated.template && validated.template !== 'custom'
      ? ALTERNANCY_TEMPLATES[validated.template as keyof typeof ALTERNANCY_TEMPLATES]
      : null;

    // Validar que todos os hiperfocos existem e pertencem ao usuário
    const hyperfocusIds = sessionsWithTemplate.map((hs) => hs.hyperfocusId);

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
    const hyperfocusLinks = sessionsWithTemplate.map((hs, index) => ({
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

    const sessions = sessionsWithTemplate.map((hs, index) => {
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

    const totalDuration = sessionsWithTemplate.reduce(
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
        // Informações sobre template aplicado
        template: templateInfo ? {
          name: templateInfo.name,
          description: templateInfo.description,
          bestFor: templateInfo.bestFor,
        } : null,
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

TEMPLATES AVAILABLE:
Use pre-configured templates optimized for neurodivergent productivity:

1. **pomodoro_classic** - Ciclo tradicional 25/5 com break longo
   Pattern: [25, 5, 25, 5, 25, 5, 25, 15] (120 min total)
   Best for: ADHD - Mantém foco com breaks frequentes

2. **extended_focus** - Sessões de 45min para concentração profunda
   Pattern: [45, 15, 45, 15, 45] (180 min total)
   Best for: Tarefas complexas que requerem contexto mantido

3. **adhd_balanced** - Alternância rápida para manter engajamento
   Pattern: [25, 10, 25, 10, 25, 20] (110 min total)
   Best for: ADHD - Variação mantém interesse, breaks progressivos

4. **autism_deep_work** - Sessões longas para hiperfoco intenso
   Pattern: [90, 20, 90, 20] (220 min total)
   Best for: Autismo - Permite mergulho profundo em interesse especial

5. **quick_rotation** - Para múltiplos projetos pequenos
   Pattern: [15, 5, 15, 5, 15, 5, 15] (75 min total)
   Best for: Múltiplas tarefas pequenas, baixa energia executiva

6. **energy_aware** - Adapta duração baseado em energia
   Pattern: [30, 15, 20, 10, 15] (90 min total)
   Best for: Dias de baixa energia, respeita limites neurodivergentes

Use this tool when:
- User has multiple interests they want to work on
- User struggles with monotony and needs variety (ADHD)
- User wants structured task-switching
- User says "rotate between X and Y" or "alternate my work"
- User wants to try Pomodoro or similar techniques

Perfect for neurodivergent users who benefit from structured variety and task-switching.

Examples:
- "Use pomodoro_classic template with my React and Writing hyperfocuses"
- "Create adhd_balanced alternation between 3 projects"
- "Alternate between React learning (30 min) and music production (25 min)" → Custom durations
- "Help me switch between coding and writing using the autism_deep_work template"`,
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name for this alternancy session (optional)',
        maxLength: 100,
      },
      template: {
        type: 'string',
        enum: [
          'pomodoro_classic',
          'extended_focus',
          'adhd_balanced',
          'autism_deep_work',
          'quick_rotation',
          'energy_aware',
          'custom'
        ],
        description: `Pre-configured template to use (optional, default: custom).
        
Templates automatically set durations based on research-backed patterns for neurodivergent productivity.
If you provide custom durations, use 'custom' or omit this field.`,
        default: 'custom',
      },
      hyperfocusSessions: {
        type: 'array',
        description: `Array of hyperfocuses with their durations (2-5 items).
        
If using a template, durations will be overridden by the template pattern.
If using custom, specify exact durations for each hyperfocus.`,
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
              description: 'Duration for this hyperfocus session (5-180 minutes)',
              minimum: 5,
              maximum: 180,
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

