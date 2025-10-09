/**
 * List Hyperfocus Tool
 * Lista todos os hiperfocos do usuário
 */

import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';
import { DatabaseError, ValidationError } from '@/lib/utils/errors';
import { toolLogger } from '@/lib/utils/logger';
import { McpToolMetadata, AUTH_SCOPES } from '../types/metadata';

const log = toolLogger.child({ tool: 'listHyperfocus' });

const listHyperfocusSchema = z.object({
  archived: z.boolean().optional().default(false),
  color: z
    .enum(['red', 'green', 'blue', 'orange', 'purple', 'pink', 'brown', 'gray'])
    .optional(),
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
});

export type ListHyperfocusInput = z.infer<typeof listHyperfocusSchema>;

export async function listHyperfocusHandler(input: ListHyperfocusInput, userId: string) {
  log.info({ userId, input }, 'Listando hiperfocos');

  try {
    const validated = listHyperfocusSchema.parse(input);

    // Query base
    let query = supabase
      .from('hyperfocus')
      .select(
        `
        id,
        title,
        description,
        color,
        estimated_time_minutes,
        created_at,
        updated_at,
        archived
      `
      )
      .eq('user_id', userId)
      .eq('archived', validated.archived);

    // Filtro por cor se especificado
    if (validated.color) {
      query = query.eq('color', validated.color);
    }

    // Ordenar por mais recente
    query = query.order('created_at', { ascending: false });

    // Paginação
    query = query.range(validated.offset, validated.offset + validated.limit - 1);

    const { data: hyperfocusList, error } = await query;

    if (error) {
      log.error({ error }, 'Erro ao listar hiperfocos');
      throw new DatabaseError('Falha ao carregar hiperfocos');
    }

    // Buscar contagem de tarefas para cada hiperfoco
    const hyperfocusWithTasks = await Promise.all(
      (hyperfocusList || []).map(async (hf) => {
        const { count, error: countError } = await supabase
          .from('tasks')
          .select('id', { count: 'exact', head: true })
          .eq('hyperfocus_id', hf.id);

        if (countError) {
          log.warn({ hyperfocusId: hf.id, error: countError }, 'Erro ao contar tarefas');
        }

        return {
          id: hf.id,
          title: hf.title,
          description: hf.description,
          color: hf.color,
          estimatedTimeMinutes: hf.estimated_time_minutes,
          createdAt: hf.created_at,
          updatedAt: hf.updated_at,
          archived: hf.archived,
          taskCount: count || 0,
        };
      })
    );

    log.info(
      { userId, count: hyperfocusWithTasks.length, archived: validated.archived },
      'Hiperfocos listados com sucesso'
    );

    return {
      structuredContent: {
        type: 'hyperfocus_list',
        count: hyperfocusWithTasks.length,
        hyperfocusList: hyperfocusWithTasks,
        filters: {
          archived: validated.archived,
          color: validated.color,
        },
      },
      component: {
        type: 'inline',
        name: 'HyperfocusList',
        props: {
          hyperfocusList: hyperfocusWithTasks,
          showArchived: validated.archived,
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

export const listHyperfocusMetadata: McpToolMetadata = {
  name: 'listHyperfocus',
  description: `Lists all hyperfocus areas for the user, with filtering options.

Use this tool when:
- User asks "what are my hyperfocuses?" or "show my projects"
- User wants to see all their organized interests
- User asks to review their active or archived hyperfocuses
- Starting a conversation to show context of existing work

Perfect for helping users navigate their multiple interests and projects.

Examples:
- "Show me all my hyperfocuses" → List all active hyperfocuses
- "What projects do I have?" → List active hyperfocuses
- "Show my archived hyperfocuses" → List with archived=true`,
  inputSchema: {
    type: 'object',
    properties: {
      archived: {
        type: 'boolean',
        description: 'Filter by archived status (default: false)',
        default: false,
      },
      color: {
        type: 'string',
        enum: ['red', 'green', 'blue', 'orange', 'purple', 'pink', 'brown', 'gray'],
        description: 'Filter by color',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results (1-100, default: 20)',
        minimum: 1,
        maximum: 100,
        default: 20,
      },
      offset: {
        type: 'number',
        description: 'Pagination offset (default: 0)',
        minimum: 0,
        default: 0,
      },
    },
    required: [],
  },
  _meta: {
    readOnly: true,
    requiresConfirmation: false,
    requiresAuth: true,
    allowAnonymous: false,
    authScopes: [AUTH_SCOPES.HYPERFOCUS_READ],
    'openai/outputTemplate': 'HyperfocusList',
    category: 'management',
    tags: ['hyperfocus', 'list', 'read'],
    rateLimitTier: 'low'
  },
};

