import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';
import { ValidationError, DatabaseError, NotFoundError, BusinessLogicError } from '@/lib/utils/errors';
import { toolLogger } from '@/lib/utils/logger';
import { McpToolMetadata, AUTH_SCOPES } from '../types/metadata';

const log = toolLogger.child({ tool: 'deleteHyperfocus' });

// Schema de validação
export const deleteHyperfocusSchema = z.object({
  hyperfocusId: z.string().uuid('hyperfocusId inválido'),
  force: z.boolean().default(false).optional(),
  confirmation: z.boolean().default(false)
});

export type DeleteHyperfocusInput = z.infer<typeof deleteHyperfocusSchema>;

// Handler da tool
export async function deleteHyperfocusHandler(
  input: DeleteHyperfocusInput,
  userId: string
) {
  log.info({ userId, input }, 'Deleting hyperfocus');
  
  try {
    // 1. Validar input
    const validated = deleteHyperfocusSchema.parse(input);
    
    // 2. Verificar se hiperfoco existe e pertence ao usuário
    const { data: hyperfocus, error: fetchError } = await supabase
      .from('hyperfocus')
      .select(`
        *,
        tasks:tasks(id, title, completed)
      `)
      .eq('id', validated.hyperfocusId)
      .eq('user_id', userId)
      .single();
    
    if (fetchError || !hyperfocus) {
      log.warn({ hyperfocusId: validated.hyperfocusId, userId }, 'Hyperfocus not found');
      throw new NotFoundError('Hiperfoco não encontrado');
    }
    
    // 3. Verificar se há tarefas pendentes (não completadas)
    const tasks = hyperfocus.tasks || [];
    const pendingTasks = tasks.filter(task => !task.completed);
    
    if (pendingTasks.length > 0 && !validated.force) {
      log.warn({ 
        hyperfocusId: validated.hyperfocusId, 
        pendingTasksCount: pendingTasks.length 
      }, 'Cannot delete hyperfocus with pending tasks');
      
      return {
        structuredContent: {
          type: 'deletion_blocked',
          reason: 'pending_tasks',
          hyperfocusId: hyperfocus.id,
          title: hyperfocus.title,
          pendingTasksCount: pendingTasks.length,
          pendingTasks: pendingTasks.map(task => ({
            id: task.id,
            title: task.title
          })),
          suggestion: 'archive_instead'
        },
        component: {
          type: 'inline',
          name: 'DeletionWarning',
          props: {
            hyperfocus: {
              id: hyperfocus.id,
              title: hyperfocus.title
            },
            pendingTasks: pendingTasks,
            canForce: true
          }
        }
      };
    }
    
    // 4. Verificar confirmação para deletar
    if (!validated.confirmation) {
      log.info({ hyperfocusId: validated.hyperfocusId }, 'Requesting deletion confirmation');
      
      return {
        structuredContent: {
          type: 'deletion_confirmation_required',
          hyperfocusId: hyperfocus.id,
          title: hyperfocus.title,
          taskCount: tasks.length,
          completedTasks: tasks.filter(task => task.completed).length,
          warning: 'Esta ação não pode ser desfeita'
        },
        component: {
          type: 'inline',
          name: 'DeletionConfirmation',
          props: {
            hyperfocus: {
              id: hyperfocus.id,
              title: hyperfocus.title,
              taskCount: tasks.length
            },
            hasPendingTasks: pendingTasks.length > 0
          }
        }
      };
    }
    
    // 5. Executar deleção em transação
    const { error: deleteError } = await supabase
      .from('hyperfocus')
      .delete()
      .eq('id', validated.hyperfocusId)
      .eq('user_id', userId);
    
    if (deleteError) {
      log.error({ error: deleteError, userId }, 'Database error deleting hyperfocus');
      throw new DatabaseError(`Falha ao deletar hiperfoco: ${deleteError.message}`);
    }
    
    log.info({ 
      hyperfocusId: validated.hyperfocusId, 
      userId,
      deletedTasksCount: tasks.length 
    }, 'Hyperfocus deleted successfully');
    
    // 6. Retornar confirmação de deleção
    return {
      structuredContent: {
        type: 'hyperfocus_deleted',
        hyperfocusId: validated.hyperfocusId,
        title: hyperfocus.title,
        deletedTasksCount: tasks.length,
        deletedAt: new Date().toISOString(),
        message: `Hiperfoco "${hyperfocus.title}" foi deletado permanentemente`
      },
      component: {
        type: 'inline',
        name: 'DeletionSuccess',
        props: {
          title: hyperfocus.title,
          deletedTasksCount: tasks.length
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
export const deleteHyperfocusMetadata: McpToolMetadata = {
  name: 'deleteHyperfocus',
  description: `Permanently deletes a hyperfocus and all its associated tasks.

⚠️ WARNING: This action cannot be undone!

Use this tool when:
- User explicitly asks to delete/remove a hyperfocus permanently
- User confirms they want to delete after being warned
- User understands the consequences (all tasks will be deleted)

The tool has safety mechanisms:
- Requires explicit confirmation
- Warns about pending tasks
- Offers archiving as alternative
- Can force delete with pending tasks if needed

Examples:
- "Delete my old project permanently" → Requires confirmation
- "Remove React study hyperfocus" → Checks for pending tasks first`,
  inputSchema: {
    type: 'object',
    properties: {
      hyperfocusId: {
        type: 'string',
        description: 'UUID of the hyperfocus to delete permanently',
        format: 'uuid'
      },
      force: {
        type: 'boolean',
        description: 'Force deletion even with pending tasks (use with caution)',
        default: false
      },
      confirmation: {
        type: 'boolean',
        description: 'User confirmed they want to delete permanently',
        default: false
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
    'openai/outputTemplate': 'DeletionConfirmation',
    category: 'management',
    tags: ['hyperfocus', 'delete', 'remove', 'dangerous'],
    rateLimitTier: 'high' // Higher tier due to destructive nature
  }
};