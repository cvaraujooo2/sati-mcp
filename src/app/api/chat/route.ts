import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { OpenAI } from 'openai'
import { streamText, tool, type CoreMessage } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createClient } from '@/lib/supabase/server'
import { TOOL_REGISTRY, listAllToolMetadata, getToolHandler } from '@/lib/mcp/tools'
import { 
  handleToolError, 
  executeWithTimeout, 
  validateToolPermission,
  logToolError 
} from '@/lib/mcp/error-handler'
import { 
  ConversationHistoryManager, 
  type ConversationMessage,
  hasUnresolvedToolCallsInConversation,
  buildContextFromConversation
} from '@/lib/supabase/conversation-history'
import { 
  OptimizedToolExecutor,
  createToolExecutionContext,
  type ToolExecutionContext
} from '@/lib/mcp/optimized-executor'
import { 
  globalToolRegistry,
  type ToolMetadata
} from '@/lib/mcp/optimized-registry'

// Types baseados no MCPJam/inspector
interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  toolCalls?: ToolCall[]
  toolResults?: ToolResult[]
}

interface ToolCall {
  id: string
  name: string
  parameters: Record<string, any>
  timestamp: Date
  status: 'pending' | 'executing' | 'completed' | 'error'
}

interface ToolResult {
  id: string
  toolCallId: string
  result?: any
  error?: string
  timestamp: Date
}

interface ChatRequest {
  messages: ChatMessage[]
  model?: string
  temperature?: number
  systemPrompt?: string
  conversationId?: string
  continueFromHistory?: boolean
}

// Streaming context para controlar o estado da conversa
interface StreamingContext {
  controller: ReadableStreamDefaultController
  encoder: TextEncoder
  toolCallId: number
  lastEmittedToolCallId?: number
  stepIndex: number
  toolCallIdToName: Map<number, string>
  messageHistory: CoreMessage[]
}

// Constants baseados no MCPJam/inspector
const MAX_AGENT_STEPS = 10
const TOOL_EXECUTION_TIMEOUT = 30000

// Schema validation
const ChatRequestSchema = z.object({
  messages: z.array(z.object({
    id: z.string(),
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
    timestamp: z.union([z.string(), z.date()]).transform(val => 
      typeof val === 'string' ? new Date(val) : val
    ),
    toolCalls: z.array(z.object({
      id: z.string(),
      name: z.string(),
      parameters: z.record(z.any()),
      timestamp: z.union([z.string(), z.date()]).transform(val => 
        typeof val === 'string' ? new Date(val) : val
      ),
      status: z.enum(['pending', 'executing', 'completed', 'error'])
    })).optional(),
    toolResults: z.array(z.object({
      id: z.string(),
      toolCallId: z.string(),
      result: z.any().optional(),
      error: z.string().optional(),
      timestamp: z.union([z.string(), z.date()]).transform(val => 
        typeof val === 'string' ? new Date(val) : val
      )
    })).optional()
  })),
  model: z.string().default('gpt-4o-mini'),
  temperature: z.number().min(0).max(2).default(0.7),
  systemPrompt: z.string().optional(),
  conversationId: z.string().optional(),
  continueFromHistory: z.boolean().default(false),
})

// Helper: Converter JSON Schema para Zod Schema
function convertJsonSchemaToZod(jsonSchema: any): z.ZodTypeAny {
  const type = jsonSchema.type
  
  if (type === 'string') {
    // Se tem enum, retorna ZodEnum diretamente
    if (jsonSchema.enum) {
      const enumSchema = z.enum(jsonSchema.enum as [string, ...string[]])
      return jsonSchema.default !== undefined 
        ? (enumSchema.default(jsonSchema.default) as z.ZodTypeAny)
        : (enumSchema as z.ZodTypeAny)
    }
    
    // Caso contrário, ZodString normal
    let schema: z.ZodTypeAny = z.string()
    if (jsonSchema.minLength) schema = (schema as z.ZodString).min(jsonSchema.minLength)
    if (jsonSchema.maxLength) schema = (schema as z.ZodString).max(jsonSchema.maxLength)
    if (jsonSchema.default !== undefined) schema = (schema as z.ZodString).default(jsonSchema.default)
    return schema
  }
  
  if (type === 'number' || type === 'integer') {
    let schema: z.ZodTypeAny = type === 'integer' ? z.number().int() : z.number()
    if (jsonSchema.minimum !== undefined) schema = (schema as z.ZodNumber).min(jsonSchema.minimum)
    if (jsonSchema.maximum !== undefined) schema = (schema as z.ZodNumber).max(jsonSchema.maximum)
    if (jsonSchema.default !== undefined) schema = (schema as z.ZodNumber).default(jsonSchema.default)
    return schema
  }
  
  if (type === 'boolean') {
    let schema: z.ZodTypeAny = z.boolean()
    if (jsonSchema.default !== undefined) schema = (schema as z.ZodBoolean).default(jsonSchema.default)
    return schema
  }
  
  if (type === 'array') {
    const itemSchema = jsonSchema.items ? convertJsonSchemaToZod(jsonSchema.items) : z.any()
    let schema: z.ZodTypeAny = z.array(itemSchema)
    if (jsonSchema.minItems) schema = (schema as z.ZodArray<any>).min(jsonSchema.minItems)
    if (jsonSchema.maxItems) schema = (schema as z.ZodArray<any>).max(jsonSchema.maxItems)
    return schema
  }
  
  if (type === 'object') {
    const properties = jsonSchema.properties || {}
    const shape = Object.entries(properties).reduce((acc, [key, value]) => {
      acc[key] = convertJsonSchemaToZod(value)
      return acc
    }, {} as Record<string, z.ZodTypeAny>)
    return z.object(shape) as z.ZodTypeAny
  }
  
  // Fallback para any
  return z.any()
}

// Helper functions baseadas no MCPJam/inspector - VERSÃO SIMPLIFICADA
function sendSseEvent(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  event: any
): boolean {
  // Verificação ÚNICA e simples
  if (!controller || controller.desiredSize === null) {
    return false // Silently skip - controller closed
  }
  
  try {
    const payload = event === "[DONE]" ? "[DONE]" : JSON.stringify(event)
    controller.enqueue(encoder.encode(`data: ${payload}\n\n`))
    return true
  } catch (error) {
    // Controller was closed during enqueue
    return false
  }
}

function safeCloseController(controller: ReadableStreamDefaultController) {
  try {
    if (controller && controller.desiredSize !== null) {
      controller.close()
    }
  } catch (error) {
    // Ignore close errors - controller might already be closed
  }
}

function hasUnresolvedToolCalls(messages: CoreMessage[]): boolean {
  const toolCallIds = new Set<string>()
  const toolResultIds = new Set<string>()

  for (const msg of messages) {
    if (!msg) continue
    
    if (msg.role === "assistant" && Array.isArray(msg.content)) {
      for (const c of msg.content) {
        if (c?.type === "tool-call") toolCallIds.add(c.toolCallId)
      }
    } else if (msg.role === "tool" && Array.isArray(msg.content)) {
      for (const c of msg.content) {
        if (c?.type === "tool-result") toolResultIds.add(c.toolCallId)
      }
    }
  }
  
  // Verifica se há tool calls sem resultados
  for (const id of toolCallIds) {
    if (!toolResultIds.has(id)) return true
  }
  return false
}

function buildMessageHistory(messages: ChatMessage[]): CoreMessage[] {
  const coreMessages: CoreMessage[] = []
  
  for (const msg of messages) {
    // Mensagem básica sem tool calls/results
    if (!msg.toolCalls?.length && !msg.toolResults?.length) {
      coreMessages.push({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content
      })
      continue
    }
    
    // Mensagem do assistant com tool calls
    if (msg.role === 'assistant' && msg.toolCalls?.length) {
      const content: any[] = []
      
      // Adicionar texto se existir
      if (msg.content?.trim()) {
        content.push({
          type: 'text',
          text: msg.content
        })
      }
      
      // Adicionar tool calls
      msg.toolCalls.forEach(toolCall => {
        content.push({
          type: 'tool-call',
          toolCallId: toolCall.id,
          toolName: toolCall.name,
          args: toolCall.parameters
        })
      })
      
      coreMessages.push({
        role: 'assistant',
        content: content.length > 0 ? content : msg.content
      })
      
      // Se há tool results, adicionar como mensagem 'tool' separada
      if (msg.toolResults?.length) {
        const toolContent: any[] = []
        
        msg.toolResults.forEach(toolResult => {
          // Simplificar o resultado para evitar estruturas complexas
          let resultValue = toolResult.result
          
          // Se o resultado tem estruturas complexas, simplificar
          if (resultValue && typeof resultValue === 'object') {
            // Remover propriedades que causam problemas de validação
            if (resultValue.structuredContent) {
              resultValue = JSON.stringify(resultValue.structuredContent)
            } else if (resultValue.component) {
              resultValue = JSON.stringify(resultValue.component)
            } else {
              resultValue = JSON.stringify(resultValue)
            }
          }
          
          toolContent.push({
            type: 'tool-result',
            toolCallId: toolResult.toolCallId,
            toolName: msg.toolCalls?.find(tc => tc.id === toolResult.toolCallId)?.name || 'unknown',
            result: resultValue,
            isError: !!toolResult.error
          })
        })
        
        if (toolContent.length > 0) {
          coreMessages.push({
            role: 'tool',
            content: toolContent
          })
        }
      }
      
      continue
    }
    
    // Fallback para mensagem simples
    coreMessages.push({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content || ''
    })
  }
  
  return coreMessages
}

export async function POST(req: NextRequest) {
  try {
    // 1. Validar request body
    const body = await req.json()
    console.log('[Chat API] Received request with', body.messages?.length || 0, 'messages')
    
    const validatedData = ChatRequestSchema.parse(body)
    
    // 2. DEV BYPASS: Usar usuário fixo para testes
    // TODO: REMOVER EM PRODUÇÃO!
    const isDev = process.env.NODE_ENV === 'development'
    let userId: string
    
    if (isDev) {
      // ⚠️ MODO DESENVOLVIMENTO: Usar usuário fixo
      userId = '00000000-0000-0000-0000-000000000001'
      console.log('[DEV MODE] Using fixed user ID:', userId)
    } else {
      // PRODUÇÃO: Autenticação real
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        return NextResponse.json({ 
          error: 'Unauthorized' 
        }, { status: 401 })
      }
      
      userId = user.id
    }
    
    // 3. Buscar API key do usuário
    const supabase = createClient()
    const { data: apiKeyData, error: keyError } = await supabase
      .from('user_api_keys')
      .select('encrypted_key')
      .eq('user_id', userId)
      .eq('provider', 'openai')
      .single()
    
    console.log('[API Key Query]', { userId, keyError, hasData: !!apiKeyData })
    
    if (keyError || !apiKeyData) {
      console.error('[API Key Error]', keyError)
      return NextResponse.json({ 
        error: 'API key not found. Please configure your OpenAI API key in Settings.' 
      }, { status: 400 })
    }
    
    // 4. Configurar OpenAI client
    const openai = createOpenAI({
      apiKey: apiKeyData.encrypted_key, // TODO: Implementar decrypt se necessário
    })
    
    // 5. Gerenciador de histórico de conversas
    const historyManager = new ConversationHistoryManager()
    
    // 6. Carregar contexto de conversa anterior se necessário
    let contextualSystemPrompt = validatedData.systemPrompt || `
Você é o SATI, um assistente especializado em ajudar pessoas neurodivergentes (ADHD/Autismo) com foco e produtividade.

Suas especialidades incluem:
- Criar e gerenciar hiperfocos (períodos de concentração intensa)
- Quebrar tarefas grandes em subtarefas menores e gerenciar seu progresso
- Iniciar e finalizar timers de foco (técnicas Pomodoro)
- Analisar contexto de tarefas e sugerir estratégias personalizadas
- Gerenciar alternância estruturada entre múltiplas atividades
- Buscar e atualizar informações detalhadas sobre projetos existentes

FERRAMENTAS DISPONÍVEIS:
🎯 Hiperfoco: createHyperfocus, listHyperfocus, getHyperfocus, updateHyperfocus, deleteHyperfocus
📋 Tarefas: createTask, updateTaskStatus, breakIntoSubtasks  
⏱️ Timer: startFocusTimer, endFocusTimer
🧠 Análise: analyzeContext
🔄 Alternância: createAlternancy

ESTRATÉGIAS PARA NEURODIVERGENTES:
- Para ADHD: Sessões curtas (25-45min), breaks regulares, alternância estruturada
- Para Autismo: Rotinas previsíveis, detalhamento claro, progresso visual
- Para Overwhelm: Quebrar em micro-tarefas, análise de complexidade
- Para Procrastinação: Timer immediato, tarefa mais simples primeiro

Seja empático, direto e prático. Use linguagem clara e evite sobrecarga de informações.
Use as ferramentas disponíveis quando apropriado para ajudar o usuário.

REGRAS CRÍTICAS:
1. SEMPRE responda ao usuário após usar ferramentas
2. SEMPRE explique o que você fez e os resultados obtidos
3. SEMPRE ofereça próximos passos ou pergunte se o usuário precisa de mais ajuda
4. NUNCA termine a conversa sem dar feedback ao usuário sobre as ações executadas
5. Se você criou tarefas, liste-as de forma clara e resumida
6. Se você executou múltiplas ferramentas, resuma o que foi feito em uma resposta coesa
7. IMPORTANTE: Quando criar um hiperfoco, SEMPRE use o hyperfocusId retornado (UUID) para criar tarefas relacionadas
8. NUNCA use o título do hiperfoco como hyperfocusId - sempre use o campo 'hyperfocusId' retornado pela ferramenta createHyperfocus
9. CRÍTICO: Se o usuário mencionar um hiperfoco por nome, SEMPRE liste hiperfocos primeiro para obter o UUID correto
10. JAMAIS assuma que um título é um UUID válido - sempre busque o ID real

FLUXOS DE TRABALHO PRINCIPAIS:

📊 GESTÃO DE HIPERFOCO:
1. Novo projeto: createHyperfocus → breakIntoSubtasks → startFocusTimer
2. Projeto existente: listHyperfocus → getHyperfocus → analyzeContext
3. Editar projeto: updateHyperfocus (título, descrição, cor, tempo, arquivar)
4. Deletar projeto: deleteHyperfocus (com confirmação e validações de segurança)
5. Múltiplos projetos: createAlternancy para rotação estruturada

✅ GESTÃO DE TAREFAS:
1. Criar: sempre use hyperfocusId (UUID) retornado por createHyperfocus
2. Quebrar: use breakIntoSubtasks para tarefas complexas (auto-cria subtarefas)
3. Completar: use updateTaskStatus quando concluídas
4. Analisar: use analyzeContext para tarefas confusas ou complexas

⏲️ GESTÃO DE TEMPO:
1. Iniciar foco: startFocusTimer (25-45min para ADHD, até 180min para autismo)
2. Finalizar: SEMPRE use endFocusTimer ao final da sessão
3. Alternância: createAlternancy para trocar entre hiperfocos

🧩 RESOLUÇÃO DE PROBLEMAS:
- Overwhelm: analyzeContext + breakIntoSubtasks
- Procrastinação: listHyperfocus + startFocusTimer na tarefa mais simples  
- Falta de clareza: analyzeContext + getHyperfocus para contexto completo
- Múltiplos interesses: createAlternancy para estruturar rotação
- Projeto pausado/completo: updateHyperfocus com archived=true
- Limpeza de projetos antigos: updateHyperfocus (arquivar) ou deleteHyperfocus (deletar)
- UUID inválido: SEMPRE liste hiperfocos existentes e use UUID válido
- Referência a hiperfoco anterior: use listHyperfocus para encontrar o UUID correto

EXEMPLO CORRETO DE USO:
- Criar hiperfocus → resultado: { "structuredContent": { "hyperfocusId": "abc123-def4-567g-8hij-9klmnop" } }
- Usar UUID em outras ferramentas: hyperfocusId: "abc123-def4-567g-8hij-9klmnop" (NUNCA o título!)

IMPORTANTE: SEMPRE use UUIDs, mesmo quando o usuário menciona títulos
- ❌ ERRADO: hyperfocusId: "Estudar Django" 
- ✅ CORRETO: listHyperfocus → encontrar UUID → usar "61ae848a-7b75-43c9-afda-599e1559db50"

Se uma ferramenta falhar por UUID inválido, IMEDIATAMENTE use listHyperfocus para encontrar IDs válidos.

EXEMPLOS DE BOAS RESPOSTAS:

🎯 Novo Hiperfoco:
"Criei o hiperfoco 'Estudar React com TypeScript' e quebrei em 5 subtarefas:
1. Instalação do Ambiente (30 min)
2. Fundamentos do React (60 min) 
3. Estado e Hooks (60 min)
4. Integração TypeScript (60 min)
5. Projeto Prático (120 min)

Vamos começar? Posso iniciar um timer de 25 minutos para a primeira tarefa!"

⏱️ Gestão de Timer:
"Timer iniciado! 🎯 Foque em 'Instalação do Ambiente' por 25 minutos. 
Você receberá um alerta quando terminar. Lembre-se: sem distrações, apenas esta tarefa!"

✅ Conclusão de Tarefa:
"Parabéns! ✨ Marcou 'Instalação do Ambiente' como concluída. 
Próxima tarefa: 'Fundamentos do React' (60 min). Quer fazer uma pausa de 5 min ou continuar direto?"

🔄 Alternância Múltipla:
"Criei uma sessão de alternância com seus 3 hiperfocos:
- Estudar Python (45 min) 
- Exercitar-se (30 min)
- Ler ficção (25 min)
A rotação manterá você engajado sem burnout. Vamos começar?"
    `.trim()

    // Carregar contexto de conversa anterior se solicitado
    if (validatedData.conversationId && validatedData.continueFromHistory) {
      try {
        const previousConversation = await historyManager.loadConversation(
          validatedData.conversationId, 
          userId
        )
        
        if (previousConversation) {
          const conversationContext = buildContextFromConversation(previousConversation)
          contextualSystemPrompt += '\n\n' + conversationContext
          console.log('[ConversationHistory] Loaded context from conversation:', validatedData.conversationId)
          
          // Verificar se há tool calls não resolvidos
          if (hasUnresolvedToolCallsInConversation(previousConversation.messages)) {
            console.log('[ConversationHistory] Found unresolved tool calls, will continue execution')
          }
        }
      } catch (error) {
        console.error('[ConversationHistory] Failed to load conversation context:', error)
        // Continua sem contexto se falhar
      }
    }
    
    // 7. Construir histórico de mensagens (incluindo tool calls/results)
    const messageHistory = buildMessageHistory(validatedData.messages)
    
    // 7. Configurar sistema otimizado de ferramentas
    const toolExecutor = new OptimizedToolExecutor()
    
    // Registrar todas as ferramentas no registry otimizado
    const toolMetadata = listAllToolMetadata()
    console.log('[Tools] Loading', toolMetadata.length, 'MCP tools into optimized registry')
    
    const handlerMap = new Map<string, (params: Record<string, any>, userId: string) => Promise<any>>()
    
    for (const meta of toolMetadata) {
      try {
        // Converter JSON Schema para Zod
        const inputSchema = meta.inputSchema.type === 'object' 
          ? meta.inputSchema 
          : { type: 'object', properties: meta.inputSchema.properties || {} }
        
        const properties = inputSchema.properties || {}
        const zodProperties: Record<string, z.ZodTypeAny> = {}
        
        for (const [key, value] of Object.entries(properties)) {
          zodProperties[key] = convertJsonSchemaToZod(value as any)
        }
        
        const zodSchema = Object.keys(zodProperties).length > 0
          ? z.object(zodProperties)
          : z.object({})
        
        // Pegar o handler original
        const originalHandler = getToolHandler(meta.name)
        if (!originalHandler) {
          console.error(`[Tool Error] Handler not found for ${meta.name}`)
          continue
        }
        
        // Registrar no registry otimizado
        const optimizedMetadata: ToolMetadata = {
          name: meta.name,
          description: meta.description,
          inputSchema: zodSchema,
          serverId: 'local', // Todas as ferramentas SATI são locais
          category: 'productivity', // Categoria padrão para ferramentas SATI
          cacheable: meta.name.includes('create') || meta.name.includes('update'), // Cache para operações CRUD
          timeout: 30000
        }
        
        globalToolRegistry.registerTool(optimizedMetadata, originalHandler)
        handlerMap.set(meta.name, originalHandler)
        
        console.log(`[Tool] Registered optimized tool: ${meta.name}`)
      } catch (error) {
        console.error(`[Tool Error] Failed to register tool ${meta.name}:`, error)
      }
    }
    
    // Converter para formato AI SDK com otimizações
    const tools = globalToolRegistry.toAiSdkTools(userId)
    
    // 8. Preparar sistema de streaming com multi-step conversation
    console.log('[OpenAI] Calling with', Object.keys(tools).length, 'tools:', Object.keys(tools).join(', '))
    console.log('[Messages] Processing', messageHistory.length, 'messages in history')
    
    // 9. Implementar streaming com multi-step conversation (padrão MCPJam/inspector)
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const streamingContext: StreamingContext = {
            controller,
            encoder,
            toolCallId: 0,
            lastEmittedToolCallId: undefined,
            stepIndex: 0,
            toolCallIdToName: new Map(),
            messageHistory: [
              { role: 'system', content: contextualSystemPrompt },
              ...messageHistory
            ]
          }

          const finalMessages = await createMultiStepStreamingResponse(
            openai(validatedData.model),
            tools,
            streamingContext,
            validatedData.temperature,
            userId
          )
          
          // Salvar conversa no Supabase para continuidade
          try {
            const conversationMessages: ConversationMessage[] = validatedData.messages.map(msg => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              timestamp: msg.timestamp,
              toolCalls: msg.toolCalls,
              toolResults: msg.toolResults
            }))
            
            // Adicionar mensagens geradas durante o streaming
            conversationMessages.push(...finalMessages)
            
            const conversationId = await historyManager.saveConversation(
              userId, 
              conversationMessages,
              validatedData.conversationId
            )
            
            // Enviar ID da conversa para o cliente
            sendSseEvent(controller, encoder, {
              type: 'conversation_saved',
              conversationId,
              timestamp: new Date().toISOString()
            })
            
            console.log('[ConversationHistory] Saved conversation:', conversationId)
          } catch (error) {
            console.error('[ConversationHistory] Failed to save conversation:', error)
            // Não falha o request se não conseguir salvar
          }
          
          sendSseEvent(controller, encoder, "[DONE]")
          safeCloseController(controller)
        } catch (error) {
          console.error('[SATI] Stream error:', error)
          sendSseEvent(controller, encoder, { 
            type: 'error', 
            error: error instanceof Error ? error.message : 'Unknown error' 
          })
          safeCloseController(controller)
        }
      }
    })

// Função para multi-step streaming baseada no MCPJam/inspector
async function createMultiStepStreamingResponse(
  model: any,
  tools: Record<string, any>,
  streamingContext: StreamingContext,
  temperature: number,
  userId: string
): Promise<ConversationMessage[]> {
  let steps = 0
  const generatedMessages: ConversationMessage[] = []
  let currentAssistantMessage: ConversationMessage | null = null
  
  while (steps < MAX_AGENT_STEPS) {
    console.log(`[SATI] Starting conversation step ${steps + 1}/${MAX_AGENT_STEPS}`)
    let accumulatedText = ""
    const iterationToolCalls: ToolCall[] = []
    const iterationToolResults: ToolResult[] = []

    const streamResult = await streamText({
      model,
      messages: streamingContext.messageHistory,
      temperature,
      tools,
    })

    // Process streaming chunks
    for await (const chunk of streamResult.fullStream) {
      switch (chunk.type) {
        case 'text-delta': {
          const text = chunk.text
          if (text) {
            accumulatedText += text
            
            // Iniciar nova mensagem do assistente se necessário
            if (!currentAssistantMessage) {
              currentAssistantMessage = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: '',
                timestamp: new Date(),
                toolCalls: [],
                toolResults: []
              }
            }
            
            currentAssistantMessage.content += text
            
            sendSseEvent(streamingContext.controller, streamingContext.encoder, {
              type: 'text',
              content: text,
            })
          }
          break
        }
        
        case 'tool-call': {
          const currentToolCallId = ++streamingContext.toolCallId
          streamingContext.lastEmittedToolCallId = currentToolCallId
          const name = chunk.toolName
          const parameters = 'input' in chunk ? chunk.input : 'args' in chunk ? (chunk as any).args : {}

          // Store tool name for later reference
          streamingContext.toolCallIdToName.set(currentToolCallId, name)

          const toolCall: ToolCall = {
            id: currentToolCallId.toString(),
            name,
            parameters: parameters as Record<string, any>,
            timestamp: new Date(),
            status: 'executing'
          }
          
          iterationToolCalls.push(toolCall)
          
          // Adicionar à mensagem atual
          if (!currentAssistantMessage) {
            currentAssistantMessage = {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: '',
              timestamp: new Date(),
              toolCalls: [],
              toolResults: []
            }
          }
          currentAssistantMessage.toolCalls!.push(toolCall)
          
          sendSseEvent(streamingContext.controller, streamingContext.encoder, {
            type: 'tool_call',
            toolCall: {
              id: currentToolCallId,
              name,
              parameters,
              timestamp: new Date().toISOString(),
              status: 'executing',
            },
          })
          break
        }
        
        case 'tool-result': {
          const result = 'output' in chunk ? chunk.output : 'result' in chunk ? (chunk as any).result : chunk
          const currentToolCallId = streamingContext.lastEmittedToolCallId ?? ++streamingContext.toolCallId

          const toolResult: ToolResult = {
            id: crypto.randomUUID(),
            toolCallId: currentToolCallId.toString(),
            result,
            timestamp: new Date()
          }
          
          iterationToolResults.push(toolResult)
          
          // Adicionar à mensagem atual
          if (currentAssistantMessage) {
            currentAssistantMessage.toolResults!.push(toolResult)
            
            // Marcar tool call como completado
            const toolCall = currentAssistantMessage.toolCalls!.find(tc => tc.id === currentToolCallId.toString())
            if (toolCall) {
              toolCall.status = 'completed'
              
              // Log da execução via executor otimizado
              try {
                const toolName = streamingContext.toolCallIdToName.get(currentToolCallId) || toolCall.name
                await toolExecutor.logToolExecution(
                  {
                    userId,
                    requestId: currentToolCallId.toString(),
                    toolName,
                    parameters: toolCall.parameters
                  },
                  {
                    result,
                    executionTimeMs: Date.now() - toolCall.timestamp.getTime()
                  }
                )
              } catch (logError) {
                console.warn('[Tool Executor] Failed to log execution:', logError)
              }
            }
          }
          
          sendSseEvent(streamingContext.controller, streamingContext.encoder, {
            type: 'tool_result',
            toolResult: {
              id: currentToolCallId.toString(),
              toolCallId: currentToolCallId.toString(),
              result,
              timestamp: new Date().toISOString(),
            },
          })
          break
        }
      }
    }

    await streamResult.consumeStream()

    // Finalizar mensagem do assistente da iteração
    if (currentAssistantMessage && (accumulatedText || iterationToolCalls.length)) {
      generatedMessages.push(currentAssistantMessage)
      currentAssistantMessage = null
    }

    // Add response messages to history
    const response = await streamResult.response
    const responseMessages = response?.messages || []
    if (responseMessages.length) {
      streamingContext.messageHistory.push(...(responseMessages as CoreMessage[]))
    }

    steps++
    const finishReason = await streamResult.finishReason
    const shouldContinue = finishReason === "tool-calls" || 
                          (accumulatedText.length === 0 && iterationToolResults.length > 0)

    console.log(`[SATI] Step ${steps} completed. FinishReason: ${finishReason}, AccumulatedText: ${accumulatedText.length} chars, ToolCalls: ${iterationToolCalls.length}, ToolResults: ${iterationToolResults.length}, ShouldContinue: ${shouldContinue}`)

    if (!shouldContinue) break
  }

  if (steps >= MAX_AGENT_STEPS) {
    console.log(`[SATI] Reached maximum steps (${MAX_AGENT_STEPS})`)
  }

  return generatedMessages
}

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
    
  } catch (error) {
    console.error('[SATI Chat API] Error:', error)
    
    if (error instanceof z.ZodError) {
      console.error('[SATI Chat API] Validation errors:', JSON.stringify(error.errors, null, 2))
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: error.errors,
        message: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
      }, { status: 400 })
    }
    
    // Handle OpenAI specific errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json({ 
          error: 'Invalid OpenAI API key. Please check your settings.' 
        }, { status: 400 })
      }
      
      if (error.message.includes('quota') || error.message.includes('billing')) {
        return NextResponse.json({ 
          error: 'OpenAI quota exceeded. Please check your OpenAI billing.' 
        }, { status: 402 })
      }
      
      if (error.message.includes('rate limit')) {
        return NextResponse.json({ 
          error: 'Rate limit exceeded. Please try again in a moment.' 
        }, { status: 429 })
      }
    }
    
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// Método GET para health check
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'SATI Chat API'
  })
}