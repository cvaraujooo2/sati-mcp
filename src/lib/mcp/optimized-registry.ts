import { z } from 'zod'

export interface ToolMetadata {
  name: string
  description: string
  inputSchema: z.ZodTypeAny
  outputSchema?: z.ZodTypeAny
  serverId?: string
  category?: string
  tags?: string[]
  cacheable?: boolean
  timeout?: number
  rateLimit?: {
    maxCalls: number
    windowMs: number
  }
}

export interface ToolHandler {
  (params: Record<string, any>, userId: string): Promise<any>
}

/**
 * Registry otimizado de ferramentas com roteamento por servidor
 * Baseado no padrão MCPJam/inspector
 */
export class OptimizedToolRegistry {
  private tools: Map<string, ToolMetadata> = new Map()
  private handlers: Map<string, ToolHandler> = new Map()
  private aliases: Map<string, string> = new Map()
  private serverTools: Map<string, string[]> = new Map() // serverId -> toolNames[]
  
  /**
   * Registra uma ferramenta no registry
   */
  registerTool(
    metadata: ToolMetadata,
    handler: ToolHandler,
    aliases?: string[]
  ): void {
    const toolName = metadata.name
    
    // Registrar ferramenta principal
    this.tools.set(toolName, metadata)
    this.handlers.set(toolName, handler)
    
    // Registrar aliases se fornecidos
    if (aliases) {
      aliases.forEach(alias => {
        this.aliases.set(alias, toolName)
      })
    }
    
    // Agrupar por servidor se especificado
    if (metadata.serverId) {
      const serverTools = this.serverTools.get(metadata.serverId) || []
      serverTools.push(toolName)
      this.serverTools.set(metadata.serverId, serverTools)
    }
    
    console.log(`[ToolRegistry] Registered tool: ${toolName}${metadata.serverId ? ` (server: ${metadata.serverId})` : ''}`)
  }

  /**
   * Obter ferramenta por nome (com suporte a aliases)
   */
  getTool(nameOrAlias: string): ToolMetadata | undefined {
    // Verificar nome direto primeiro
    let tool = this.tools.get(nameOrAlias)
    if (tool) return tool
    
    // Verificar aliases
    const resolvedName = this.aliases.get(nameOrAlias)
    if (resolvedName) {
      return this.tools.get(resolvedName)
    }
    
    return undefined
  }

  /**
   * Obter handler por nome (com suporte a aliases)
   */
  getHandler(nameOrAlias: string): ToolHandler | undefined {
    // Verificar nome direto primeiro
    let handler = this.handlers.get(nameOrAlias)
    if (handler) return handler
    
    // Verificar aliases
    const resolvedName = this.aliases.get(nameOrAlias)
    if (resolvedName) {
      return this.handlers.get(resolvedName)
    }
    
    return undefined
  }

  /**
   * Listar todas as ferramentas
   */
  listAllTools(): ToolMetadata[] {
    return Array.from(this.tools.values())
  }

  /**
   * Listar ferramentas por servidor
   */
  listToolsByServer(serverId: string): ToolMetadata[] {
    const toolNames = this.serverTools.get(serverId) || []
    return toolNames
      .map(name => this.tools.get(name))
      .filter(Boolean) as ToolMetadata[]
  }

  /**
   * Listar ferramentas por categoria
   */
  listToolsByCategory(category: string): ToolMetadata[] {
    return Array.from(this.tools.values())
      .filter(tool => tool.category === category)
  }

  /**
   * Buscar ferramentas por tags
   */
  searchToolsByTags(tags: string[]): ToolMetadata[] {
    return Array.from(this.tools.values())
      .filter(tool => 
        tool.tags && tool.tags.some(tag => tags.includes(tag))
      )
  }

  /**
   * Obter estatísticas do registry
   */
  getStats(): {
    totalTools: number
    serverCount: number
    categoryStats: Record<string, number>
  } {
    const tools = Array.from(this.tools.values())
    const categoryStats: Record<string, number> = {}
    
    tools.forEach(tool => {
      if (tool.category) {
        categoryStats[tool.category] = (categoryStats[tool.category] || 0) + 1
      }
    })
    
    return {
      totalTools: tools.length,
      serverCount: this.serverTools.size,
      categoryStats
    }
  }

  /**
   * Converter para formato AI SDK com metadata preservada
   */
  toAiSdkTools(userId: string): Record<string, any> {
    const aiSdkTools: Record<string, any> = {}
    
    for (const [name, metadata] of this.tools.entries()) {
      const handler = this.handlers.get(name)
      if (!handler) continue
      
      aiSdkTools[name] = {
        type: "dynamic",
        description: metadata.description,
        inputSchema: metadata.inputSchema,
        execute: async (params: any) => {
          // Wrapper que preserva contexto com userId correto
          return await handler(params, userId)
        },
        // Metadata adicional para roteamento
        _metadata: {
          serverId: metadata.serverId,
          category: metadata.category,
          tags: metadata.tags,
          cacheable: metadata.cacheable,
          timeout: metadata.timeout,
          rateLimit: metadata.rateLimit
        }
      }
    }
    
    return aiSdkTools
  }

  /**
   * Construir índice flattened com serverId metadata (padrão MCPJam/inspector)
   */
  buildFlattenedWithServerId(): Record<string, any> {
    const flattened: Record<string, any> = {}
    
    for (const [name, metadata] of this.tools.entries()) {
      const handler = this.handlers.get(name)
      if (!handler) continue
      
      flattened[name] = {
        name,
        description: metadata.description,
        inputSchema: metadata.inputSchema,
        outputSchema: metadata.outputSchema,
        execute: handler,
        // Attach serverId metadata (padrão MCPJam/inspector)
        _serverId: metadata.serverId,
        _category: metadata.category,
        _tags: metadata.tags
      }
    }
    
    return flattened
  }

  /**
   * Resolver nome da tool incluindo prefixo do servidor
   */
  resolveToolName(nameWithPrefix: string): {
    toolName: string
    serverId?: string
    resolved: boolean
  } {
    // Formato: "serverId:toolName" ou apenas "toolName"
    if (nameWithPrefix.includes(':')) {
      const [serverId, toolName] = nameWithPrefix.split(':', 2)
      
      // Verificar se existe na combinação servidor+tool
      const serverTools = this.serverTools.get(serverId) || []
      if (serverTools.includes(toolName)) {
        return {
          toolName,
          serverId,
          resolved: true
        }
      }
    }
    
    // Procurar tool sem prefixo
    const tool = this.getTool(nameWithPrefix)
    if (tool) {
      return {
        toolName: nameWithPrefix,
        serverId: tool.serverId,
        resolved: true
      }
    }
    
    return {
      toolName: nameWithPrefix,
      resolved: false
    }
  }

  /**
   * Validar schema de entrada
   */
  validateInput(toolName: string, params: any): {
    valid: boolean
    errors?: string[]
  } {
    const tool = this.getTool(toolName)
    if (!tool) {
      return {
        valid: false,
        errors: [`Tool '${toolName}' not found`]
      }
    }
    
    try {
      tool.inputSchema.parse(params)
      return { valid: true }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        }
      }
      
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Unknown validation error']
      }
    }
  }
}

// Registry global singleton
export const globalToolRegistry = new OptimizedToolRegistry()

// Schemas comuns para ferramentas SATI
export const CommonSchemas = {
  // Schema básico de resposta
  Response: z.object({
    success: z.boolean(),
    message: z.string(),
    data: z.any().optional(),
    metadata: z.record(z.any()).optional()
  }),
  
  // Schema para tarefas
  Task: z.object({
    id: z.string().uuid(),
    title: z.string(),
    description: z.string().optional(),
    completed: z.boolean().default(false),
    priority: z.enum(['low', 'medium', 'high']).default('medium'),
    dueDate: z.string().datetime().optional(),
    tags: z.array(z.string()).default([])
  }),
  
  // Schema para hiperfoco
  Hyperfocus: z.object({
    id: z.string().uuid(),
    title: z.string(),
    description: z.string().optional(),
    durationMinutes: z.number().int().min(1).max(480),
    strategy: z.enum(['pomodoro', 'timeboxing', 'deep-work']),
    breakInterval: z.number().int().min(5).max(60).optional(),
    createdAt: z.string().datetime()
  }),
  
  // Schema para contexto
  Context: z.object({
    currentTask: z.string().optional(),
    mood: z.enum(['focused', 'distracted', 'overwhelmed', 'energetic']).optional(),
    environment: z.enum(['quiet', 'noisy', 'home', 'office']).optional(),
    timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'night']).optional(),
    energyLevel: z.number().int().min(1).max(10).optional()
  })
}