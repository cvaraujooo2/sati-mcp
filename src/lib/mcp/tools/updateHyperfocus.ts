import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { ValidationError, DatabaseError, NotFoundError } from '@/lib/utils/errors';
import { toolLogger } from '@/lib/utils/logger';
import { McpToolMetadata, AUTH_SCOPES } from '../types/metadata';

const log = toolLogger.child({ tool: 'updateHyperfocus' });

// Schema de validação
export const updateHyperfocusSchema = z.object({
  hyperfocusId: z.string().uuid('hyperfocusId inválido'),
  title: z.string()
    .min(1, 'Título é obrigatório')
    .max(100, 'Título muito longo (máximo 100 caracteres)')
    .optional(),
  description: z.string()
    .max(500, 'Descrição muito longa (máximo 500 caracteres)')
    .optional(),
  color: z.enum([
    'red', 'green', 'blue', 'orange', 
    'purple', 'pink', 'brown', 'gray'
  ]).optional(),
  estimatedTimeMinutes: z.number()
    .min(5, 'Tempo mínimo é 5 minutos')
    .max(480, 'Tempo máximo é 480 minutos (8 horas)')
    .optional(),
  archived: z.boolean().optional()
});

export type UpdateHyperfocusInput = z.infer<typeof updateHyperfocusSchema>;

// Handler da tool
export async function updateHyperfocusHandler(
  input: UpdateHyperfocusInput,
  userId: string
) {
  log.info({ userId, input }, 'Updating hyperfocus');
  
  try {
    const supabase = await createClient();

    // 1. Validar input
    const validated = updateHyperfocusSchema.parse(input);
    
    // 2. Verificar se hiperfoco existe e pertence ao usuário
    const { data: existing, error: fetchError } = await supabase
      .from('hyperfocus')
      .select('*')
      .eq('id', validated.hyperfocusId)
      .eq('user_id', userId)
      .single();
    
    if (fetchError || !existing) {
      log.warn({ hyperfocusId: validated.hyperfocusId, userId }, 'Hyperfocus not found');
      throw new NotFoundError('Hiperfoco não encontrado');
    }
    
    // 3. Preparar dados para update (apenas campos fornecidos)
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    if (validated.title !== undefined) updateData.title = validated.title;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.color !== undefined) updateData.color = validated.color;
    if (validated.estimatedTimeMinutes !== undefined) updateData.estimated_time_minutes = validated.estimatedTimeMinutes;
    if (validated.archived !== undefined) updateData.archived = validated.archived;
    
    // 4. Atualizar no banco
    const { data: hyperfocus, error } = await supabase
      .from('hyperfocus')
      .update(updateData)
      .eq('id', validated.hyperfocusId)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      log.error({ error, userId }, 'Database error updating hyperfocus');
      throw new DatabaseError(`Falha ao atualizar hiperfoco: ${error.message}`);
    }
    
    log.info({ hyperfocusId: hyperfocus.id, userId }, 'Hyperfocus updated successfully');
    
    // 5. Retornar structured content para MCP
    const action = validated.archived === true ? 'archived' : 
                  validated.archived === false ? 'unarchived' : 'updated';
    
    return {
      structuredContent: {
        type: 'hyperfocus_updated',
        action,
        hyperfocusId: hyperfocus.id,
        title: hyperfocus.title,
        description: hyperfocus.description,
        color: hyperfocus.color,
        estimatedTimeMinutes: hyperfocus.estimated_time_minutes,
        archived: hyperfocus.archived,
        updatedAt: hyperfocus.updated_at,
        changes: Object.keys(updateData).filter(key => key !== 'updated_at')
      },
      component: {
        type: 'inline',
        name: 'HyperfocusCard',
        props: {
          hyperfocus: {
            id: hyperfocus.id,
            title: hyperfocus.title,
            description: hyperfocus.description,
            color: hyperfocus.color,
            estimatedTimeMinutes: hyperfocus.estimated_time_minutes,
            archived: hyperfocus.archived,
            taskCount: 0 // TODO: Get task count if needed
          },
          showArchived: validated.archived
        }
      }
    };
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(e => e.message).join(', ');
      log.warn({ errors: error.errors, userId }, 'Validation error');
      throw new ValidationError(`Dados inválidos: ${errorMessages}`);
    }
    
    throw error;
  }
}

// Metadata para discovery do ChatGPT
export const updateHyperfocusMetadata: McpToolMetadata = {
  name: 'updateHyperfocus',
  description: `Updates an existing hyperfocus with new information or archives/unarchives it.

Use this tool when:
- User wants to edit a hyperfocus title, description, or settings
- User wants to archive a completed or paused hyperfocus
- User wants to unarchive a previously archived hyperfocus
- User wants to change the color or time estimate

Perfect for maintaining organization and keeping hyperfocus list current.

Examples:
- "Archive my React project" → Set archived=true
- "Rename my project to 'Advanced React'" → Update title
- "Change my study time to 3 hours" → Update estimatedTimeMinutes`,
  inputSchema: {
    type: 'object',
    properties: {
      hyperfocusId: {
        type: 'string',
        description: 'UUID of the hyperfocus to update',
        format: 'uuid'
      },
      title: {
        type: 'string',
        description: 'New title for the hyperfocus (1-100 characters)',
        minLength: 1,
        maxLength: 100
      },
      description: {
        type: 'string',
        description: 'New description for the hyperfocus (max 500 characters)',
        maxLength: 500
      },
      color: {
        type: 'string',
        enum: ['red', 'green', 'blue', 'orange', 'purple', 'pink', 'brown', 'gray'],
        description: 'New color for visual identification'
      },
      estimatedTimeMinutes: {
        type: 'number',
        description: 'New estimated total time in minutes (5-480)',
        minimum: 5,
        maximum: 480
      },
      archived: {
        type: 'boolean',
        description: 'Archive (true) or unarchive (false) the hyperfocus'
      }
    },
    required: ['hyperfocusId']
  },
  _meta: {
    readOnly: false,
    requiresConfirmation: true,
    requiresAuth: true,
    allowAnonymous: false,
    authScopes: [AUTH_SCOPES.HYPERFOCUS_WRITE],
    'openai/outputTemplate': 'HyperfocusCard',
    category: 'management',
    tags: ['hyperfocus', 'update', 'archive', 'edit'],
    rateLimitTier: 'medium'
  }
};