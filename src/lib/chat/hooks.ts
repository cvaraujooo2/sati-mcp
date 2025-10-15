import { useCallback, useEffect, useRef, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { 
  ChatMessage, 
  ChatState, 
  ModelDefinition, 
  UseChatOptions,
  ToolCall,
  ToolResult,
  ChatStreamEvent,
  UsageInfo
} from "./types"
import { 
  createMessage, 
  generateId, 
  parseSSEStream, 
  mapToolToComponent,
  saveMessageToStorage,
  loadMessagesFromStorage
} from "./utils"

// Importar registry de modelos
import { modelRegistry } from '@/lib/services/modelRegistry.service'
import { userPreferencesService } from '@/lib/services/userPreferences.service'
import { apiKeyService } from '@/lib/services/apiKey.service'

// Modelos suportados vêm agora do registry
const SUPPORTED_MODELS: ModelDefinition[] = modelRegistry.getAllModels()

interface ElicitationRequest {
  requestId: string
  message: string
  schema?: any
}

export function useChat(options: UseChatOptions = {}) {
  const {
    initialMessages = [],
    systemPrompt = "",
    temperature = 0.7,
    onMessageSent,
    onMessageReceived, 
    onError,
    onToolCall,
    onToolResult,
    onModelChange,
  } = options

  // State
  const [state, setState] = useState<ChatState>({
    messages: initialMessages,
    isLoading: false,
    connectionStatus: "disconnected",
  })

  const [input, setInput] = useState("")
  const [model, setModel] = useState<ModelDefinition | null>(null) // Carregado das preferências
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null)
  const [elicitationRequest, setElicitationRequest] = useState<ElicitationRequest | null>(null)
  const [elicitationLoading, setElicitationLoading] = useState(false)
  const [userPreferencesLoaded, setUserPreferencesLoaded] = useState(false)

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null)
  const messagesRef = useRef<ChatMessage[]>(state.messages)

  // Sync messages ref
  useEffect(() => {
    messagesRef.current = state.messages
  }, [state.messages])

  // Supabase client (memoizado para evitar múltiplas instâncias)
  const supabase = useMemo(() => createClient(), [])

  // Check if user has API key and load preferences
  const [hasApiKey, setHasApiKey] = useState(false)
  
  useEffect(() => {
    async function loadUserPreferencesAndApiKeys() {
      try {
        // Verificar autenticação
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setHasApiKey(false)
          setUserPreferencesLoaded(true)
          return
        }
        
        // Carregar preferências do usuário
        const preferences = await userPreferencesService.getPreferences()
        
        if (preferences) {
          // Buscar modelo preferido
          const preferredModel = modelRegistry.getModelById(preferences.preferred_model)
          
          if (preferredModel && !preferredModel.deprecated) {
            setModel(preferredModel)
          } else {
            // Fallback para modelo default do provider
            const defaultModel = modelRegistry.getDefaultModelForProvider(preferences.preferred_provider)
            setModel(defaultModel || null)
          }
        } else {
          // Se não tem preferências, usar GPT-4.0 Mini
          const defaultModel = modelRegistry.getDefaultModelForProvider('openai')
          setModel(defaultModel || null)
        }
        
        // Verificar se tem API key para algum provider
        const availableProviders = await apiKeyService.getAvailableProviders()
        setHasApiKey(availableProviders.length > 0)
        
        setUserPreferencesLoaded(true)
        
      } catch (error) {
        console.error("Error loading user preferences:", error)
        setHasApiKey(false)
        setUserPreferencesLoaded(true)
        
        // Fallback para modelo default
        const defaultModel = modelRegistry.getDefaultModelForProvider('openai')
        setModel(defaultModel || null)
      }
    }

    loadUserPreferencesAndApiKeys()
  }, [supabase])

  // Available models based on API keys
  const [availableProviders, setAvailableProviders] = useState<string[]>([])

  useEffect(() => {
    async function loadAvailableProviders() {
      const providers = await apiKeyService.getAvailableProviders()
      setAvailableProviders(providers)
    }
    if (hasApiKey) {
      loadAvailableProviders()
    }
  }, [hasApiKey])

  const availableModels = useMemo(() => {
    // Sempre mostrar modelos OpenAI (podem usar fallback)
    const openaiModels = modelRegistry.getActiveModelsByProvider('openai')
    
    if (!hasApiKey) {
      // Modo beta/free tier: apenas OpenAI com fallback
      return openaiModels
    }
    
    // Filtrar modelos baseado nos providers disponíveis (quando tem API key)
    const models = SUPPORTED_MODELS.filter(m => 
      !m.disabled && 
      !m.deprecated &&
      availableProviders.includes(m.provider)
    )
    
    return models.length > 0 ? models : openaiModels
  }, [hasApiKey, availableProviders])  // Auto-select first available model
  useEffect(() => {
    if (availableModels.length > 0 && !model) {
      setModel(availableModels[0])
    }
  }, [availableModels, model])

  // Handle model change
  const handleModelChange = useCallback(async (newModel: ModelDefinition) => {
    setModel(newModel)
    
    // Persistir no backend
    try {
      await userPreferencesService.updatePreferredModel(
        newModel.provider as 'openai' | 'anthropic' | 'google',
        newModel.id
      )
      console.log('[useChat] Model preference saved:', newModel.id)
    } catch (error) {
      console.error('[useChat] Failed to save model preference:', error)
    }
    
    onModelChange?.(newModel)
  }, [onModelChange])

  // Send message function
  const sendMessage = useCallback(async (
    content: string, 
    attachments: any[] = []
  ) => {
    if (!content.trim() || state.isLoading) return
    
    // Validar apenas se o modelo está selecionado
    // API key não é obrigatória (modo beta/fallback)
    if (!model) {
      onError?.("Modelo não selecionado")
      return
    }

    // Create user message
    const userMessage = createMessage("user", content, attachments)
    
    // Add user message to state
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: undefined,
    }))

    // Save to storage
    saveMessageToStorage(userMessage)
    onMessageSent?.(userMessage)

    // Create assistant message placeholder
    const assistantMessage = createMessage("assistant", "")
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, assistantMessage],
    }))

    try {
      // Create abort controller
      abortControllerRef.current = new AbortController()

      // Verificar autenticação
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error("Usuário não autenticado")
      }

      // Prepare messages for API
      const apiMessages = [...messagesRef.current, userMessage].map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp,
        toolCalls: msg.toolCalls?.filter(tc => tc && tc.id && tc.name).map(tc => ({
          id: tc.id,
          name: tc.name,
          parameters: tc.parameters || {},
          timestamp: tc.timestamp instanceof Date ? tc.timestamp.toISOString() : tc.timestamp,
          status: tc.status
        })),
        toolResults: msg.toolResults?.filter(tr => tr && tr.id && tr.toolCallId).map(tr => ({
          id: tr.id,
          toolCallId: tr.toolCallId,
          result: tr.result,
          error: tr.error,
          timestamp: tr.timestamp instanceof Date ? tr.timestamp.toISOString() : tr.timestamp
        })),
      }))

      const requestBody = {
        messages: apiMessages,
        model: model.id,
        temperature,
        systemPrompt,
      }
      
      console.log('[Chat API Request]', JSON.stringify(requestBody, null, 2))

      // Call chat API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('[Chat API Error]', errorData)
        const errorMessage = errorData.message || errorData.error || "Erro na requisição"
        throw new Error(errorMessage)
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("Erro ao ler resposta")
      }

      let assistantContent = ""
      const toolCalls: ToolCall[] = []
      const toolResults: ToolResult[] = []

      // Parse stream
      for await (const event of parseSSEStream(reader)) {
        console.log('[SSE Event]', event.type, event)
        
        if (event.type === "text") {
          assistantContent += event.content || ""
          
          // Update assistant message in real-time
          setState(prev => ({
            ...prev,
            messages: prev.messages.map(msg => 
              msg.id === assistantMessage.id
                ? { ...msg, content: assistantContent }
                : msg
            ),
          }))
        } 
        else if (event.type === "tool_call") {
          const toolCall: ToolCall = {
            id: event.toolCall?.id?.toString() || event.toolCallId,
            name: event.toolCall?.name || event.toolName,
            parameters: event.toolCall?.parameters || event.args || {},
            timestamp: event.toolCall?.timestamp ? new Date(event.toolCall.timestamp) : new Date(),
            status: "executing",
          }
          
          toolCalls.push(toolCall)
          onToolCall?.(toolCall)
          
          // Update assistant message with tool call AND preserve content
          setState(prev => ({
            ...prev,
            messages: prev.messages.map(msg => 
              msg.id === assistantMessage.id
                ? { 
                    ...msg, 
                    content: assistantContent,
                    toolCalls: [...(msg.toolCalls || []), toolCall] 
                  }
                : msg
            ),
          }))
        }
        else if (event.type === "tool_result") {
          const toolCallId = event.toolResult?.toolCallId || event.toolCallId
          const toolResult: ToolResult = {
            id: event.toolResult?.id || `result_${toolCallId}`,
            toolCallId: toolCallId,
            result: event.toolResult?.result || event.result,
            error: event.toolResult?.error || event.error,
            timestamp: event.toolResult?.timestamp ? new Date(event.toolResult.timestamp) : new Date(),
          }
          
          toolResults.push(toolResult)
          onToolResult?.(toolResult)
          
          // Update tool call status to completed AND preserve content
          setState(prev => ({
            ...prev,
            messages: prev.messages.map(msg => 
              msg.id === assistantMessage.id
                ? { 
                    ...msg, 
                    content: assistantContent,
                    toolCalls: msg.toolCalls?.map(tc => 
                      tc.id === toolCallId 
                        ? { ...tc, status: "completed" as const }
                        : tc
                    ),
                    toolResults: [...(msg.toolResults || []), toolResult]
                  }
                : msg
            ),
          }))
        }
        else if (event.type === "tool_error") {
          const toolCallId = event.toolResult?.toolCallId || event.toolCallId
          const toolResult: ToolResult = {
            id: generateId(),
            toolCallId: toolCallId,
            error: event.toolResult?.error || event.error,
            timestamp: new Date(event.toolResult?.timestamp || event.timestamp),
          }
          
          toolResults.push(toolResult)
          
          // Update tool call status to error AND preserve content
          setState(prev => ({
            ...prev,
            messages: prev.messages.map(msg => 
              msg.id === assistantMessage.id
                ? { 
                    ...msg, 
                    content: assistantContent,
                    toolCalls: msg.toolCalls?.map(tc => 
                      tc.id === toolCallId 
                        ? { ...tc, status: "error" as const }
                        : tc
                    ),
                    toolResults: [...(msg.toolResults || []), toolResult]
                  }
                : msg
            ),
          }))
        }
        else if (event.type === "error") {
          throw new Error(event.error || "Erro no streaming")
        }
        else if (event.type === "usage_info") {
          // Capturar informações de uso (free tier, fallback, etc.)
          if (event.usageInfo) {
            setUsageInfo(event.usageInfo)
          }
        }
      }

      // Final update of assistant message - preserve the updated toolCalls with status
      setState(prev => {
        const updatedMessages = prev.messages.map(msg => 
          msg.id === assistantMessage.id 
            ? { 
                ...msg, 
                content: assistantContent,
                // Keep the toolCalls and toolResults that were updated during streaming
                // Don't override with the original arrays that don't have status updates
              }
            : msg
        )
        
        // Get the final message for storage
        const finalAssistantMessage = updatedMessages.find(msg => msg.id === assistantMessage.id)
        
        // Save to storage
        if (finalAssistantMessage) {
          saveMessageToStorage(finalAssistantMessage)
          onMessageReceived?.(finalAssistantMessage)
        }
        
        return {
          ...prev,
          messages: updatedMessages,
          isLoading: false,
        }
      })

    } catch (error: any) {
      // Não tratar AbortError como erro real (é cancelamento intencional)
      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        console.log("Chat request was aborted")
        return
      }
      
      console.error("Chat error:", error)
      
      // Remove placeholder assistant message
      setState(prev => ({
        ...prev,
        messages: prev.messages.filter(msg => msg.id !== assistantMessage.id),
        isLoading: false,
        error: error.message,
      }))

      onError?.(error.message)
    } finally {
      abortControllerRef.current = null
    }
  }, [
    state.isLoading,
    model,
    hasApiKey,
    temperature,
    systemPrompt,
    onMessageSent,
    onMessageReceived,
    onError,
    onToolCall,
    onToolResult,
    supabase
  ])

  // Stop generation
  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    
    setState(prev => ({
      ...prev,
      isLoading: false,
    }))
  }, [])

  // Clear chat
  const clearChat = useCallback(() => {
    setState(prev => ({
      ...prev,
      messages: [],
      error: undefined,
    }))
  }, [])

  // Regenerate message
  const regenerateMessage = useCallback(async (messageId: string) => {
    const messageIndex = state.messages.findIndex(msg => msg.id === messageId)
    if (messageIndex === -1) return

    // Find the user message before this assistant message
    const userMessageIndex = messageIndex - 1
    if (userMessageIndex < 0 || state.messages[userMessageIndex].role !== "user") return

    const userMessage = state.messages[userMessageIndex]
    
    // Remove messages from this point forward
    setState(prev => ({
      ...prev,
      messages: prev.messages.slice(0, userMessageIndex + 1),
    }))

    // Resend the user message
    await sendMessage(userMessage.content, userMessage.attachments)
  }, [state.messages, sendMessage])

  // Handle elicitation response (se necessário futuramente)
  const handleElicitationResponse = useCallback(async (response: any) => {
    if (!elicitationRequest) return

    setElicitationLoading(true)
    try {
      // Handle elicitation response logic here
      // For now, just clear the request
      setElicitationRequest(null)
    } catch (error: any) {
      onError?.(error.message)
    } finally {
      setElicitationLoading(false)
    }
  }, [elicitationRequest, onError])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    // State
    messages: state.messages,
    isLoading: state.isLoading,
    error: state.error,
    connectionStatus: state.connectionStatus,
    input,
    setInput,
    model,
    availableModels,
    hasApiKey,
    usageInfo,
    elicitationRequest,
    elicitationLoading,

    // Actions
    sendMessage,
    stopGeneration,
    clearChat,
    regenerateMessage,
    handleModelChange,
    handleElicitationResponse,

    // Utils
    setModel: handleModelChange,
  }
}

// Default model picker helper
function pickDefaultModel(available: ModelDefinition[]): ModelDefinition | null {
  // Prefer GPT-4o Mini for cost efficiency
  const preferred = available.find(m => m.id === "gpt-4o-mini")
  if (preferred) return preferred

  // Fallback to first available
  return available[0] || null
}