/**
 * 🔧 MCP Tool Metadata Types
 * 
 * Tipos padronizados para metadata de MCP Tools seguindo as diretrizes
 * da OpenAI Apps SDK para garantir discovery preciso e UX consistente.
 * 
 * @see https://developers.openai.com/apps-sdk/plan/tools
 */

/**
 * Categorias de tools para organização e discovery
 */
export type ToolCategory = 
  | 'productivity'  // Ferramentas de produtividade (alternância, etc)
  | 'analysis'      // Ferramentas de análise (AI, contexto)
  | 'management'    // Ferramentas de gestão (hiperfoco, tarefas)
  | 'timer';        // Ferramentas de timer/foco

/**
 * Níveis de rate limiting baseados em consumo de recursos
 */
export type RateLimitTier = 
  | 'low'    // Operações simples de leitura
  | 'medium' // Operações de escrita padrão
  | 'high';  // Operações que consomem AI/recursos pesados

/**
 * Schema de entrada seguindo JSON Schema
 */
export interface InputSchema {
  type: 'object';
  properties: Record<string, Record<string, unknown>>;
  required?: string[];
}

/**
 * Metadata estendida para MCP Tools
 * 
 * Inclui hints para ChatGPT sobre autenticação, confirmação,
 * rate limiting e templates de output.
 */
export interface ToolMeta {
  // === Operação ===
  /** Tool não modifica estado (hint para ChatGPT) */
  readOnly: boolean;
  
  /** Requer confirmação do usuário antes de executar */
  requiresConfirmation: boolean;
  
  // === Autenticação (✅ NOVO) ===
  /** Requer usuário autenticado */
  requiresAuth: boolean;
  
  /** Permite acesso anônimo (sem auth) */
  allowAnonymous: boolean;
  
  /** Escopos de permissão necessários */
  authScopes?: string[];
  
  // === Output & UX (✅ NOVO) ===
  /** Nome do componente React para renderizar output */
  'openai/outputTemplate'?: string;
  
  // === Categorização (✅ NOVO) ===
  /** Categoria para organização e discovery */
  category?: ToolCategory;
  
  /** Tags para busca e agrupamento */
  tags?: string[];
  
  // === Rate Limiting (✅ NOVO) ===
  /** Tier de rate limiting baseado em consumo de recursos */
  rateLimitTier?: RateLimitTier;
}

/**
 * Metadata completa de uma MCP Tool
 * 
 * Segue as melhores práticas da OpenAI:
 * - Nome action-oriented
 * - Descrição começa com "Use this when..."
 * - Schema de entrada explícito
 * - Metadata rica para discovery
 */
export interface McpToolMetadata {
  /** Nome da tool (camelCase, action-oriented) */
  name: string;
  
  /** 
   * Descrição detalhada incluindo:
   * - "Use this when..." guidelines
   * - Exemplos de uso
   * - Contexto neurodivergente (quando aplicável)
   */
  description: string;
  
  /** Schema de entrada (JSON Schema format) */
  inputSchema: InputSchema;
  
  /** Metadata estendida com hints para ChatGPT */
  _meta: ToolMeta;
}

/**
 * Helper type: Tool Handler function signature
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ToolHandler = (args: any, context: string) => Promise<any>;

/**
 * Tool Registry Entry
 */
export interface ToolRegistryEntry {
  handler: ToolHandler;
  metadata: McpToolMetadata;
}

/**
 * Constantes úteis
 */
export const AUTH_SCOPES = {
  HYPERFOCUS_READ: 'hyperfocus:read',
  HYPERFOCUS_WRITE: 'hyperfocus:write',
  TASKS_READ: 'tasks:read',
  TASKS_WRITE: 'tasks:write',
  TIMER_WRITE: 'timer:write',
  AI_ANALYZE: 'ai:analyze',
  ALTERNANCY_WRITE: 'alternancy:write',
} as const;

/**
 * Helper para validar metadata completa
 */
export function validateToolMetadata(metadata: McpToolMetadata): boolean {
  const hasName = !!metadata.name;
  const hasDescription = metadata.description && metadata.description.length > 0;
  const hasInputSchema = !!metadata.inputSchema;
  const hasMeta = !!metadata._meta;
  const hasAuthInfo = Boolean(metadata._meta?.requiresAuth === true || metadata._meta?.requiresAuth === false);
  const hasCategory = !!metadata._meta?.category;
  
  return Boolean(hasName && hasDescription && hasInputSchema && hasMeta && hasAuthInfo && hasCategory);
}

