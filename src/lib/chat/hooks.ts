import { useCallback, useEffect, useRef, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { 
  ChatMessage, 
  ChatState, 
  ModelDefinition, 
  UseChatOptions,
  ToolCall,
  ToolResult,
  ChatStreamEvent
} from "./types"
import { 
  createMessage, 
  generateId, 
  parseSSEStream, 
  mapToolToComponent,
  saveMessageToStorage,
  loadMessagesFromStorage
} from "./utils"

// Modelos suportados baseado no MCPJam mas focado no SATI
const SUPPORTED_MODELS: ModelDefinition[] = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    maxTokens: 128000,
    supportsFunctions: true,
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    maxTokens: 128000,
    supportsFunctions: true,
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    provider: "openai",
    maxTokens: 128000,
    supportsFunctions: true,
  },
  {
    id: "claude-3-5-sonnet-20241022",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    maxTokens: 200000,
    supportsFunctions: true,
  },
  {
    id: "claude-3-5-haiku-20241022", 
    name: "Claude 3.5 Haiku",
    provider: "anthropic",
    maxTokens: 200000,
    supportsFunctions: true,
  }
]

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
  const [model, setModel] = useState<ModelDefinition | null>(SUPPORTED_MODELS[1]) // GPT-4o Mini como padrão
  const [elicitationRequest, setElicitationRequest] = useState<ElicitationRequest | null>(null)
  const [elicitationLoading, setElicitationLoading] = useState(false)

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null)
  const messagesRef = useRef<ChatMessage[]>(state.messages)

  // Sync messages ref
  useEffect(() => {
    messagesRef.current = state.messages
  }, [state.messages])

  // Supabase client (memoizado para evitar múltiplas instâncias)
  const supabase = useMemo(() => createClient(), [])

  // Check if user has API key
  const [hasApiKey, setHasApiKey] = useState(false)
  
  useEffect(() => {
    async function checkApiKey() {
      try {
        // Verificar autenticação e API key
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setHasApiKey(false)
          return
        }
        
        const { data, error } = await supabase
          .from("user_api_keys")
          .select("id")
          .eq("user_id", user.id)
          .eq("provider", "openai")
          .single()
          
        if (error && error.code !== 'PGRST116') {
          console.error("Error checking API key:", error)
          setHasApiKey(false)
          return
        }
        
        setHasApiKey(!!data)
      } catch (error) {
        console.error("Error in checkApiKey:", error)
        setHasApiKey(false)
      }
    }

    checkApiKey()
  }, [supabase])

  // Available models based on API keys
  const availableModels = useMemo(() => {
    if (!hasApiKey) return []
    return SUPPORTED_MODELS.filter(m => !m.disabled)
  }, [hasApiKey])

  // Auto-select first available model
  useEffect(() => {
    if (availableModels.length > 0 && !model) {
      setModel(availableModels[0])
    }
  }, [availableModels, model])

  // Handle model change
  const handleModelChange = useCallback((newModel: ModelDefinition) => {
    setModel(newModel)
    onModelChange?.(newModel)
  }, [onModelChange])

  // Send message function
  const sendMessage = useCallback(async (
    content: string, 
    attachments: any[] = []
  ) => {
    if (!content.trim() || state.isLoading) return
    if (!model || !hasApiKey) {
      onError?.("Modelo não selecionado ou API key não configurada")
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