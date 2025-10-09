import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';
import { ValidationError, DatabaseError } from '@/lib/utils/errors';
import { toolLogger } from '@/lib/utils/logger';
import { McpToolMetadata, AUTH_SCOPES } from '../types/metadata';

const log = toolLogger.child({ tool: 'createHyperfocus' });

// Schema de validação
export const createHyperfocusSchema = z.object({
  title: z.string()
    .min(1, 'Título é obrigatório')
    .max(100, 'Título muito longo (máximo 100 caracteres)'),
  description: z.string()
    .max(500, 'Descrição muito longa (máximo 500 caracteres)')
    .optional(),
  color: z.enum([
    'red', 'green', 'blue', 'orange', 
    'purple', 'pink', 'brown', 'gray'
  ]).default('blue'),
  estimatedTimeMinutes: z.number()
    .min(5, 'Tempo mínimo é 5 minutos')
    .max(480, 'Tempo máximo é 480 minutos (8 horas)')
    .optional()
});

export type CreateHyperfocusInput = z.infer<typeof createHyperfocusSchema>;

// Handler da tool
export async function createHyperfocusHandler(
  input: CreateHyperfocusInput,
  userId: string
) {
  log.info({ userId, input }, 'Creating hyperfocus');
  
  try {
    // 1. Validar input
    const validated = createHyperfocusSchema.parse(input);
    
    // 2. Inserir no banco
    const { data: hyperfocus, error } = await supabase
      .from('hyperfocus')
      .insert({
        user_id: userId,
        title: validated.title,
        description: validated.description,
        color: validated.color,
        estimated_time_minutes: validated.estimatedTimeMinutes
      })
      .select()
      .single();
    
    if (error) {
      log.error({ error, userId }, 'Database error creating hyperfocus');
      throw new DatabaseError(`Falha ao criar hiperfoco: ${error.message}`);
    }
    
    log.info({ hyperfocusId: hyperfocus.id, userId }, 'Hyperfocus created successfully');
    
    // 3. Retornar structured content para MCP
    return {
      structuredContent: {
        type: 'hyperfocus_created',
        hyperfocusId: hyperfocus.id,
        title: hyperfocus.title,
        description: hyperfocus.description,
        color: hyperfocus.color,
        estimatedTimeMinutes: hyperfocus.estimated_time_minutes,
        createdAt: hyperfocus.created_at,
        taskCount: 0
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
            taskCount: 0
          }
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
export const createHyperfocusMetadata: McpToolMetadata = {
  name: 'createHyperfocus',
  description: `Creates a new hyperfocus area to help neurodivergent users organize an intense interest or project.

Use this tool when:
- User mentions wanting to start a new project or learn something
- User has multiple interests and needs to structure one of them
- User says "organize this" or "help me focus on X"
- User seems overwhelmed and needs to break down a passion into manageable parts

Perfect for ADHD/autistic users managing multiple passionate interests.

Examples:
- "I want to learn React" → Create hyperfocus "Aprender React"
- "Help me organize my music production project" → Create hyperfocus "Produção Musical"
- "I need to focus on writing my book" → Create hyperfocus "Escrever Livro"`,
  inputSchema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'The title/name of the hyperfocus (1-100 characters)',
        minLength: 1,
        maxLength: 100
      },
      description: {
        type: 'string',
        description: 'Optional description of what this hyperfocus is about (max 500 characters)',
        maxLength: 500
      },
      color: {
        type: 'string',
        enum: ['red', 'green', 'blue', 'orange', 'purple', 'pink', 'brown', 'gray'],
        description: 'Color to identify this hyperfocus visually',
        default: 'blue'
      },
      estimatedTimeMinutes: {
        type: 'number',
        description: 'Estimated total time needed for this hyperfocus in minutes (5-480)',
        minimum: 5,
        maximum: 480
      }
    },
    required: ['title']
  },
  _meta: {
    readOnly: false,
    requiresConfirmation: true,
    requiresAuth: true,
    allowAnonymous: false,
    authScopes: [AUTH_SCOPES.HYPERFOCUS_WRITE],
    'openai/outputTemplate': 'HyperfocusCard',
    category: 'management',
    tags: ['hyperfocus', 'create', 'adhd', 'neurodivergent'],
    rateLimitTier: 'medium'
  }
};

