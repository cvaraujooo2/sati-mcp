import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { OpenAI } from 'openai'
import { streamText, tool, type CoreMessage } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
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
import { usageLimitsService } from '@/lib/services/usageLimits.service'
import { userPreferencesService } from '@/lib/services/userPreferences.service'
import { modelRegistry } from '@/lib/services/modelRegistry.service'

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
  // Garante compatibilidade com ModelMessage[]:
  // - Remove quaisquer 'tool-call' e 'tool-result' do input do modelo
  // - Força content a ser string (ou texto derivado) para todas as mensagens
  const toText = (val: any): string => {
    if (typeof val === 'string') return val
    if (Array.isArray(val)) {
      // Extrai somente pedaços de texto, ignorando tipos não-textuais
      const texts = val
        .filter((c: any) => c && typeof c === 'object' && c.type === 'text' && typeof c.text === 'string')
        .map((c: any) => c.text)
      if (texts.length > 0) return texts.join('')
      // Fallback seguro
      try {
        return JSON.stringify(val)
      } catch {
        return String(val)
      }
    }
    if (val && typeof val === 'object') {
      if (typeof (val as any).text === 'string') return (val as any).text
      try {
        return JSON.stringify(val)
      } catch {
        return String(val)
      }
    }
    return val != null ? String(val) : ''
  }

  const coreMessages: CoreMessage[] = []

  for (const msg of messages) {
    // Sempre mantemos apenas texto no histórico de entrada do modelo
    coreMessages.push({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: toText(msg.content)
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

    // 2. Autenticação: Obter usuário da sessão
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[Auth Error]', authError)
      return NextResponse.json({
        error: 'Unauthorized - Please log in to continue'
      }, { status: 401 })
    }

    const userId = user.id
    console.log('[Chat API] Authenticated user:', userId)

    // 3. Buscar preferências do usuário (provider e modelo preferido)
    const preferences = await userPreferencesService.getPreferences()
    const preferredProvider = preferences?.preferred_provider || 'openai'
    const preferredModelId = preferences?.preferred_model || 'gpt-40-mini'

    console.log('[Chat API] User preferences:', {
      provider: preferredProvider,
      model: preferredModelId
    })

    // 4. Buscar API key do usuário para o provider preferido
    const { data: apiKeyData, error: keyError } = await supabase
      .from('user_api_keys')
      .select('encrypted_key')
      .eq('user_id', userId)
      .eq('provider', preferredProvider)
      .single()

    console.log('[API Key Query]', { userId, provider: preferredProvider, hasData: !!apiKeyData })

    // 5. Sistema de Fallback para usuários sem API key (Free Tier)
    let apiKey: string | undefined = apiKeyData?.encrypted_key
    let usingFallback = false
    let usageInfo: { remainingDaily: number; remainingMonthly: number } | null = null

    if (!apiKey) {
      console.log('[Chat API] No user API key found, checking fallback eligibility')

      // Verificar limites de uso
      const limitCheck = await usageLimitsService.checkUserLimit(userId)

      if (!limitCheck.canUse) {
        console.error('[Chat API] Free tier limit reached:', limitCheck.reason)
        return NextResponse.json({
          error: 'Limite de uso gratuito atingido. Configure sua API key em Settings para uso ilimitado.',
          errorCode: 'LIMIT_REACHED',
          usageInfo: {
            remainingDaily: limitCheck.remainingDaily,
            remainingMonthly: limitCheck.remainingMonthly
          }
        }, { status: 429 })
      }

      // Usar API key do sistema (apenas OpenAI no fallback)
      apiKey = process.env.SYSTEM_OPENAI_KEY
      usingFallback = true
      usageInfo = {
        remainingDaily: limitCheck.remainingDaily,
        remainingMonthly: limitCheck.remainingMonthly
      }

      console.log('[Chat API] Using system fallback API key', {
        remainingDaily: limitCheck.remainingDaily,
        remainingMonthly: limitCheck.remainingMonthly
      })
    }

    if (!apiKey) {
      return NextResponse.json({
        error: 'Sistema temporariamente indisponível. Configure sua API key em Settings.',
        errorCode: 'NO_API_KEY'
      }, { status: 503 })
    }

    // 6. Validar e obter modelo correto
    const model = modelRegistry.getValidModelOrDefault(
      preferredModelId,
      usingFallback ? 'openai' : preferredProvider
    )

    console.log('[Chat API] Using model:', {
      id: model.id,
      name: model.name,
      provider: model.provider,
      usingFallback
    })

    // 7. Configurar provider client baseado no tipo
    let providerClient: any

    if (usingFallback || preferredProvider === 'openai') {
      providerClient = createOpenAI({
        apiKey: apiKey,
      })
    } else if (preferredProvider === 'anthropic') {
      providerClient = createAnthropic({
        apiKey: apiKey,
      })
    } else if (preferredProvider === 'google') {
      providerClient = createGoogleGenerativeAI({
        apiKey: apiKey,
      })
    } else {
      return NextResponse.json({
        error: `Provider ${preferredProvider} não suportado`,
        errorCode: 'UNSUPPORTED_PROVIDER'
      }, { status: 400 })
    }

    // 8. Gerenciador de histórico de conversas
    const historyManager = new ConversationHistoryManager(supabase)

    // 9. Carregar contexto de conversa anterior se necessário
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

🎯 REGRAS PARA CRIAÇÃO DE SUBTAREFAS (CRÍTICO):

Ao criar subtarefas, siga estas diretrizes rigorosas:

1. **TAREFAS ACIONÁVEIS**: Cada subtarefa deve começar com um VERBO DE AÇÃO claro
   ✅ BOM: "Instalar Django via pip", "Criar arquivo models.py", "Escrever função de autenticação"
   ❌ RUIM: "Django instalado", "Models", "Autenticação"

2. **TÍTULOS CONCRETOS E ESPECÍFICOS**: Use linguagem precisa e objetiva
   ✅ BOM: "Configurar banco PostgreSQL localmente"
   ❌ RUIM: "Configurar banco de dados"

3. **DESCRIÇÕES DETALHADAS**: Sempre forneça uma descrição clara do QUE fazer e COMO fazer
   ✅ BOM: "Executar 'pip install django' no terminal para instalar o framework Django versão 4.x"
   ❌ RUIM: "Instalar Django" (sem descrição ou descrição vaga)

4. **GRANULARIDADE ADEQUADA**: 
   - Tarefas de 15-30 min para ADHD (foco curto)
   - Tarefas de 30-60 min para autismo (foco profundo)
   - NUNCA criar tarefas genéricas ou muito amplas

5. **ORDEM LÓGICA**: Subtarefas devem seguir uma sequência natural de execução
   Exemplo: Instalar → Configurar → Criar estrutura → Implementar → Testar

6. **ESTIMATIVA REALISTA**: Considere o tempo real necessário, não o ideal
   ✅ BOM: 45 min para "Implementar autenticação JWT completa"
   ❌ RUIM: 15 min para "Implementar autenticação JWT completa"

7. **EVITE JARGÃO EXCESSIVO**: Use termos técnicos quando necessário, mas explique na descrição
   ✅ BOM: Título: "Criar serializer REST" | Descrição: "Criar arquivo serializers.py com classe para converter modelos em JSON"
   ❌ RUIM: "DRF serialization layer setup"

8. **PARALELIZAÇÃO QUANDO POSSÍVEL**: Identifique tarefas independentes que podem ser feitas em qualquer ordem

EXEMPLOS DE SUBTAREFAS BEM ESTRUTURADAS:

📚 Exemplo: Hiperfoco "Aprender Django REST Framework"
1. ✅ "Instalar Django e DRF via pip" (15 min)
   Descrição: "Execute 'pip install django djangorestframework' no ambiente virtual para instalar as dependências"

2. ✅ "Criar projeto Django inicial" (20 min)
   Descrição: "Execute 'django-admin startproject myapi' e configure settings.py para incluir rest_framework em INSTALLED_APPS"

3. ✅ "Criar app de usuários" (15 min)
   Descrição: "Execute 'python manage.py startapp users' e registre o app em settings.py"

4. ✅ "Modelar entidade User customizada" (30 min)
   Descrição: "Crie modelo customizado em users/models.py extendendo AbstractUser com campos adicionais necessários"

5. ✅ "Implementar serializer de User" (25 min)
   Descrição: "Crie users/serializers.py com ModelSerializer para validar e converter User para JSON"

6. ✅ "Criar viewset e endpoints REST" (40 min)
   Descrição: "Implemente UserViewSet em users/views.py e configure rotas em urls.py para CRUD completo"

7. ✅ "Testar endpoints com Postman" (30 min)
   Descrição: "Crie coleção no Postman testando GET, POST, PUT, DELETE para /api/users/ e valide respostas"

💡 Exemplo: Hiperfoco "Estudar para Prova de Cálculo"
1. ✅ "Revisar conceitos de derivadas" (30 min)
   Descrição: "Reler capítulo 3 do livro, focando nas regras de derivação (produto, quociente, cadeia)"

2. ✅ "Resolver 10 exercícios de derivadas básicas" (45 min)
   Descrição: "Completar exercícios 1-10 da lista 3, verificando respostas no gabarito"

3. ✅ "Assistir videoaula sobre integrais" (25 min)
   Descrição: "Ver vídeo 'Introdução às Integrais' do canal Professor Ferreto, fazer anotações"

4. ✅ "Resolver 5 problemas de integrais" (35 min)
   Descrição: "Praticar exercícios 1-5 da lista 4, focando em integrais por substituição"

5. ✅ "Fazer simulado cronometrado" (60 min)
   Descrição: "Resolver simulado completo em 60 min, sem consultas, marcando dúvidas para revisar depois"

REGRAS CRÍTICAS DE COMUNICAÇÃO:
1. SEMPRE responda ao usuário após usar ferramentas
2. SEMPRE explique o que você fez e os resultados obtidos
3. SEMPRE ofereça próximos passos ou pergunte se o usuário precisa de mais ajuda
4. NUNCA termine a conversa sem dar feedback ao usuário sobre as ações executadas
5. Se você criou tarefas, liste-as de forma clara e resumida (título + tempo estimado)
6. Se você executou múltiplas ferramentas, resuma o que foi feito em uma resposta coesa
7. IMPORTANTE: Quando criar um hiperfoco, SEMPRE use o hyperfocusId retornado (UUID) para criar tarefas relacionadas
8. NUNCA use o título do hiperfoco como hyperfocusId - sempre use o campo 'hyperfocusId' retornado pela ferramenta createHyperfocus
9. CRÍTICO: Se o usuário mencionar um hiperfoco por nome, SEMPRE liste hiperfocos primeiro para obter o UUID correto
10. JAMAIS assuma que um título é um UUID válido - sempre busque o ID real

FLUXOS DE TRABALHO PRINCIPAIS:

📊 GESTÃO DE HIPERFOCO:
1. Novo projeto: createHyperfocus → breakIntoSubtasks (ou createTask manual) → startFocusTimer
2. Projeto existente: listHyperfocus → getHyperfocus → analyzeContext
3. Editar projeto: updateHyperfocus (título, descrição, cor, tempo, arquivar)
4. Deletar projeto: deleteHyperfocus (com confirmação e validações de segurança)
5. Múltiplos projetos: createAlternancy para rotação estruturada

✅ GESTÃO DE TAREFAS:
1. Criar: sempre use hyperfocusId (UUID) retornado por createHyperfocus
2. Quebrar: use breakIntoSubtasks para tarefas complexas (auto-cria subtarefas seguindo as regras acima)
3. Completar: use updateTaskStatus quando concluídas
4. Analisar: use analyzeContext para tarefas confusas ou complexas
5. IMPORTANTE: Ao usar breakIntoSubtasks, a ferramenta já cria as subtarefas automaticamente - você não precisa criar manualmente depois

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

🎯 Novo Hiperfoco (com subtarefas detalhadas):
"Criei o hiperfoco 'Aprender Django REST Framework' 🚀 e quebrei em 7 subtarefas acionáveis:

1. **Instalar Django e DRF via pip** (15 min)  
   Execute no ambiente virtual para instalar dependências

2. **Criar projeto Django inicial** (20 min)  
   Configure settings.py com rest_framework

3. **Criar app de usuários** (15 min)  
   Registre o novo app em settings.py

4. **Modelar entidade User customizada** (30 min)  
   Estenda AbstractUser com campos necessários

5. **Implementar serializer de User** (25 min)  
   Valide e converta dados para JSON

6. **Criar viewset e endpoints REST** (40 min)  
   Configure CRUD completo em urls.py

7. **Testar endpoints com Postman** (30 min)  
   Valide GET, POST, PUT, DELETE

📊 Total estimado: ~3 horas | Primeira tarefa leva só 15 minutos!

Quer começar? Posso iniciar um timer de 15 minutos para instalação!"

⏱️ Gestão de Timer:
"Timer iniciado! 🎯 Foque em 'Instalar Django e DRF via pip' por 15 minutos.

💡 **O que fazer agora:**
1. Abra seu terminal
2. Ative o ambiente virtual
3. Execute: \`pip install django djangorestframework\`
4. Aguarde a instalação completar

Sem distrações - só esta tarefa! Você receberá um alerta quando terminar. 🔔"

✅ Conclusão de Tarefa:
"Parabéns! ✨ Você completou 'Instalar Django e DRF via pip'!

**Progresso:** 1/7 tarefas concluídas (14%)

**Próxima tarefa:** 'Criar projeto Django inicial' (20 min)  
Você vai configurar a estrutura base do projeto.

Quer fazer uma pausa de 5 minutos ou continuar no embalo? 🚀"

🔄 Alternância Múltipla:
"Criei uma sessão de alternância estruturada com seus 3 hiperfocos:

🎯 **Rotação de 100 minutos:**
1. Estudar Python (45 min) - Foco técnico intenso
2. Exercitar-se (30 min) - Break ativo, recarga mental  
3. Ler ficção (25 min) - Relaxamento criativo

A rotação manterá você engajado sem burnout! Começamos pelo Python? ⚡"

🚨 Feedback de Erro (UUID inválido):
"Ops! Não encontrei um hiperfoco com esse nome. 

Deixa eu buscar seus hiperfocos ativos... ✨

[lista os hiperfocos]

Qual desses você quer trabalhar agora?"
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
    const toolExecutor = new OptimizedToolExecutor(supabase)

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
            providerClient(model.id),
            tools,
            streamingContext,
            validatedData.temperature,
            userId,
            usingFallback,
            usageInfo
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
      userId: string,
      usingFallback: boolean = false,
      usageInfo: { remainingDaily: number; remainingMonthly: number } | null = null
    ): Promise<ConversationMessage[]> {
      let steps = 0
      const generatedMessages: ConversationMessage[] = []
      let currentAssistantMessage: ConversationMessage | null = null

      while (steps < MAX_AGENT_STEPS) {
        console.log(`[SATI] Starting conversation step ${steps + 1}/${MAX_AGENT_STEPS}`)
        let accumulatedText = ""
        const iterationToolCalls: ToolCall[] = []
        const iterationToolResults: ToolResult[] = []

        // Logs de validação para garantir compatibilidade com ModelMessage[]
        try {
          console.log('[Messages][Validation] Preparing to call streamText with', streamingContext.messageHistory.length, 'messages')
          const summary = streamingContext.messageHistory.map((m, i) => {
            const c: any = (m as any).content
            return {
              idx: i,
              role: (m as any).role,
              contentType: typeof c,
              isArray: Array.isArray(c),
              textPreview: typeof c === 'string' ? c.slice(0, 160) : undefined
            }
          })
          console.log('[Messages][Validation] Summary:', summary)
        } catch (e) {
          console.warn('[Messages][Validation] Failed to summarize messages:', e)
        }

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

      // Se estiver usando fallback, incrementar contador de uso
      if (usingFallback) {
        await usageLimitsService.incrementUsage(userId)
        console.log('[SATI] Incremented fallback usage counter for user:', userId)
      }

      // Enviar informações de uso para o cliente
      if (usingFallback && usageInfo) {
        sendSseEvent(streamingContext.controller, streamingContext.encoder, {
          type: 'usage_info',
          usingFallback: true,
          remainingDaily: usageInfo.remainingDaily - 1, // -1 porque já incrementamos
          remainingMonthly: usageInfo.remainingMonthly - 1,
          tier: 'free'
        })
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