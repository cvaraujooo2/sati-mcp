/**
 * Schemas Zod para validação de dados do MCP Sati
 * Centralizados para reutilização em tools e services
 */

import { z } from 'zod';

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export const HyperfocusColor = z.enum([
  'red',
  'green',
  'blue',
  'orange',
  'purple',
  'brown',
  'gray',
  'pink',
]);

export const TaskStatus = z.enum(['pending', 'in_progress', 'completed']);

export const SessionStatus = z.enum(['active', 'paused', 'completed', 'interrupted']);

// ============================================================================
// HYPERFOCUS SCHEMAS
// ============================================================================

export const createHyperfocusSchema = z.object({
  title: z
    .string()
    .min(1, 'Título é obrigatório')
    .max(100, 'Título deve ter no máximo 100 caracteres')
    .trim(),
  description: z
    .string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .trim()
    .optional(),
  color: HyperfocusColor.default('blue'),
  estimated_time_minutes: z
    .number()
    .int('Tempo deve ser um número inteiro')
    .min(5, 'Tempo mínimo é 5 minutos')
    .max(480, 'Tempo máximo é 480 minutos (8 horas)')
    .optional(),
});

export const updateHyperfocusSchema = createHyperfocusSchema.partial().extend({
  archived: z.boolean().optional(),
});

export const listHyperfocusSchema = z.object({
  archived: z.boolean().optional().default(false),
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
  color: HyperfocusColor.optional(),
  sortBy: z.enum(['created_at', 'updated_at', 'title']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const getHyperfocusSchema = z.object({
  id: z.string().uuid('ID inválido'),
});

export const archiveHyperfocusSchema = z.object({
  id: z.string().uuid('ID inválido'),
  archived: z.boolean().default(true),
});

// ============================================================================
// TASK SCHEMAS
// ============================================================================

export const createTaskSchema = z.object({
  hyperfocus_id: z.string().uuid('ID do hiperfoco inválido'),
  title: z
    .string()
    .min(1, 'Título é obrigatório')
    .max(200, 'Título deve ter no máximo 200 caracteres')
    .trim(),
  description: z.string().trim().optional(),
  estimated_minutes: z
    .number()
    .int()
    .min(1, 'Tempo estimado mínimo é 1 minuto')
    .max(240, 'Tempo estimado máximo é 240 minutos')
    .optional(),
  order_index: z.number().int().min(0).optional(),
});

export const updateTaskSchema = z.object({
  id: z.string().uuid('ID inválido'),
  title: z.string().min(1).max(200).trim().optional(),
  description: z.string().trim().optional(),
  completed: z.boolean().optional(),
  estimated_minutes: z.number().int().min(1).max(240).optional(),
  order_index: z.number().int().min(0).optional(),
});

export const toggleTaskSchema = z.object({
  id: z.string().uuid('ID inválido'),
  completed: z.boolean().optional(),
});

export const reorderTasksSchema = z.object({
  hyperfocus_id: z.string().uuid('ID do hiperfoco inválido'),
  task_ids: z.array(z.string().uuid()).min(1, 'Deve ter pelo menos 1 tarefa'),
});

export const deleteTaskSchema = z.object({
  id: z.string().uuid('ID inválido'),
});

export const listTasksSchema = z.object({
  hyperfocus_id: z.string().uuid('ID do hiperfoco inválido'),
  completed: z.boolean().optional(),
});

// ============================================================================
// BREAKDOWN SCHEMAS
// ============================================================================

export const breakIntoSubtasksSchema = z.object({
  hyperfocus_id: z.string().uuid('ID do hiperfoco inválido'),
  task_description: z
    .string()
    .min(10, 'Descrição muito curta para análise')
    .max(1000, 'Descrição muito longa'),
  num_subtasks: z
    .number()
    .int()
    .min(2, 'Mínimo de 2 subtarefas')
    .max(10, 'Máximo de 10 subtarefas')
    .optional()
    .default(5),
  context: z
    .object({
      user_skills: z.array(z.string()).optional(),
      time_available: z.number().int().min(1).optional(),
      difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    })
    .optional(),
});

// ============================================================================
// FOCUS TIMER SCHEMAS
// ============================================================================

export const startFocusTimerSchema = z.object({
  hyperfocus_id: z.string().uuid('ID do hiperfoco inválido'),
  planned_duration_minutes: z
    .number()
    .int('Duração deve ser um número inteiro')
    .min(1, 'Duração mínima é 1 minuto')
    .max(180, 'Duração máxima é 180 minutos (3 horas)'),
});

export const endFocusTimerSchema = z.object({
  session_id: z.string().uuid('ID da sessão inválido'),
  interrupted: z.boolean().optional().default(false),
  actual_duration_minutes: z.number().int().min(0).optional(),
});

export const pauseFocusTimerSchema = z.object({
  session_id: z.string().uuid('ID da sessão inválido'),
});

export const resumeFocusTimerSchema = z.object({
  session_id: z.string().uuid('ID da sessão inválido'),
});

// ============================================================================
// ALTERNANCY SCHEMAS
// ============================================================================

export const createAlternancySchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  hyperfocus_sessions: z
    .array(
      z.object({
        hyperfocus_id: z.string().uuid('ID do hiperfoco inválido'),
        duration_minutes: z
          .number()
          .int()
          .min(5, 'Duração mínima é 5 minutos')
          .max(120, 'Duração máxima é 120 minutos'),
      })
    )
    .min(2, 'Alternância deve ter pelo menos 2 hiperfocos')
    .max(5, 'Alternância deve ter no máximo 5 hiperfocos'),
});

export const updateAlternancySchema = z.object({
  id: z.string().uuid('ID inválido'),
  name: z.string().min(1).max(100).trim().optional(),
  active: z.boolean().optional(),
});

export const listAlternancySchema = z.object({
  active: z.boolean().optional(),
  limit: z.number().int().min(1).max(50).optional().default(10),
});

// ============================================================================
// CONTEXT ANALYSIS SCHEMAS
// ============================================================================

export const analyzeContextSchema = z.object({
  hyperfocus_id: z.string().uuid('ID do hiperfoco inválido'),
  user_input: z
    .string()
    .min(10, 'Contexto muito curto para análise')
    .max(2000, 'Contexto muito longo'),
  analysis_type: z
    .enum([
      'complexity', // Análise de complexidade
      'time_estimate', // Estimativa de tempo
      'dependencies', // Análise de dependências
      'breakdown', // Quebrar em subtarefas
      'priority', // Análise de prioridade
    ])
    .optional()
    .default('complexity'),
});

export const saveContextSchema = z.object({
  hyperfocus_id: z.string().uuid('ID do hiperfoco inválido'),
  context_data: z.record(z.unknown()), // JSONB flexível
});

export const getContextSchema = z.object({
  hyperfocus_id: z.string().uuid('ID do hiperfoco inválido'),
});

// ============================================================================
// STATISTICS SCHEMAS
// ============================================================================

export const getStatisticsSchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year', 'all']).optional().default('week'),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreateHyperfocusInput = z.infer<typeof createHyperfocusSchema>;
export type UpdateHyperfocusInput = z.infer<typeof updateHyperfocusSchema>;
export type ListHyperfocusInput = z.infer<typeof listHyperfocusSchema>;
export type GetHyperfocusInput = z.infer<typeof getHyperfocusSchema>;
export type ArchiveHyperfocusInput = z.infer<typeof archiveHyperfocusSchema>;

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ToggleTaskInput = z.infer<typeof toggleTaskSchema>;
export type ReorderTasksInput = z.infer<typeof reorderTasksSchema>;
export type DeleteTaskInput = z.infer<typeof deleteTaskSchema>;
export type ListTasksInput = z.infer<typeof listTasksSchema>;

export type BreakIntoSubtasksInput = z.infer<typeof breakIntoSubtasksSchema>;

export type StartFocusTimerInput = z.infer<typeof startFocusTimerSchema>;
export type EndFocusTimerInput = z.infer<typeof endFocusTimerSchema>;
export type PauseFocusTimerInput = z.infer<typeof pauseFocusTimerSchema>;
export type ResumeFocusTimerInput = z.infer<typeof resumeFocusTimerSchema>;

export type CreateAlternancyInput = z.infer<typeof createAlternancySchema>;
export type UpdateAlternancyInput = z.infer<typeof updateAlternancySchema>;
export type ListAlternancyInput = z.infer<typeof listAlternancySchema>;

export type AnalyzeContextInput = z.infer<typeof analyzeContextSchema>;
export type SaveContextInput = z.infer<typeof saveContextSchema>;
export type GetContextInput = z.infer<typeof getContextSchema>;

export type GetStatisticsInput = z.infer<typeof getStatisticsSchema>;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Valida e sanitiza input de forma segura
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Valida sem lançar erro, retorna resultado
 */
export function safeValidateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

