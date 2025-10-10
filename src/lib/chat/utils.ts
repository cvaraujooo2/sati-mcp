import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { ChatMessage, ModelDefinition } from "./types"

// Utility function para classes CSS
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Gerar ID único
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Sanitizar texto
export function sanitizeText(text: string): string {
  return text
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
}

// Formatação de timestamps
export function formatTimestamp(date: Date | string | number): string {
  try {
    const validDate = new Date(date)
    if (isNaN(validDate.getTime())) {
      return "Horário inválido"
    }
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(validDate)
  } catch (error) {
    console.warn('Invalid timestamp:', date)
    return "Horário inválido"
  }
}

export function formatMessageDate(date: Date): string {
  const now = new Date()
  const diffInDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (diffInDays === 0) {
    return "Hoje"
  } else if (diffInDays === 1) {
    return "Ontem"
  } else if (diffInDays < 7) {
    return new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(date)
  } else {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date)
  }
}

// Criar mensagem
export function createMessage(
  role: "user" | "assistant" | "system",
  content: string,
  attachments?: any[]
): ChatMessage {
  return {
    id: generateId(),
    role,
    content,
    timestamp: new Date(),
    attachments: attachments || [],
    toolCalls: [],
    toolResults: [],
    contentBlocks: [],
  }
}

// Validação de arquivos
export function isValidFileType(file: File): boolean {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "text/plain",
    "application/json",
    "text/csv",
  ]
  return allowedTypes.includes(file.type)
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/")
}

export function isImageUrl(url: string): boolean {
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg)$/i
  return imageExtensions.test(url)
}

// Funções de modelo
export function getDefaultTemperatureForModel(model?: ModelDefinition): number {
  if (!model) return 0.7
  
  switch (model.provider) {
    case "anthropic":
      return 1.0
    case "openai":
      return 0.7
    case "google":
      return 0.9
    case "deepseek":
      return 1.0
    default:
      return 0.7
  }
}

export function getModelDisplayName(model: ModelDefinition): string {
  return model.name || model.id
}

export function isModelAvailable(model: ModelDefinition, hasApiKey: boolean): boolean {
  if (model.disabled) return false
  if (model.provider === "ollama") return true // Ollama não precisa de API key
  return hasApiKey
}

// Parsing de streaming
export async function* parseSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>
): AsyncGenerator<any, void, unknown> {
  const decoder = new TextDecoder()
  let buffer = ""

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      const lines = buffer.split("\n")
      buffer = lines.pop() || ""

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue
        
        if (trimmed === "data: [DONE]") {
          return
        }
        
        if (trimmed.startsWith("data: ")) {
          try {
            const data = JSON.parse(trimmed.slice(6))
            yield data
          } catch (e) {
            console.warn("Failed to parse SSE data:", trimmed)
          }
        }
      }
    }
  } catch (error: any) {
    // Se for um AbortError, só lance novamente para ser tratado acima
    if (error.name === 'AbortError' || error.message?.includes('aborted')) {
      throw error
    }
    console.error("Error in parseSSEStream:", error)
    throw error
  } finally {
    try {
      reader.releaseLock()
    } catch {
      // Ignora erros ao fazer unlock, pode já estar liberado
    }
  }
}

// Extração de componentes OpenAI
export function extractOpenAIComponent(result: any): { url: string } | null {
  if (!result) return null

  // Verificar se tem structuredContent
  if (result.structuredContent?.component) {
    return { url: result.structuredContent.component }
  }

  // Verificar se é array (formato AI SDK)
  if (Array.isArray(result) && result[0]?.output?.value?.structuredContent?.component) {
    return { url: result[0].output.value.structuredContent.component }
  }

  return null
}

// Detecção de tool calls em mensagens
export function extractToolCallsFromMessage(message: ChatMessage): any[] {
  const toolCalls = []
  
  // Procurar por tool calls na mensagem
  if (message.toolCalls && message.toolCalls.length > 0) {
    toolCalls.push(...message.toolCalls)
  }

  // Procurar por tool calls nos content blocks
  if (message.contentBlocks) {
    for (const block of message.contentBlocks) {
      if (block.type === "tool_call" && block.toolCall) {
        toolCalls.push(block.toolCall)
      }
    }
  }

  return toolCalls
}

// Mapear tools SATI para componentes
export function mapToolToComponent(toolName: string): string | null {
  const toolComponentMap: Record<string, string> = {
    createHyperfocus: "HyperfocusCard",
    listHyperfocus: "HyperfocusList", 
    getHyperfocus: "HyperfocusCard",
    createTask: "TaskBreakdown",
    updateTaskStatus: "TaskBreakdown",
    breakIntoSubtasks: "SubtaskSuggestions",
    startFocusTimer: "FocusTimer",
    endFocusTimer: "FocusSessionSummary",
    analyzeContext: "ContextAnalysis",
    createAlternancy: "AlternancyFlow",
  }
  
  return toolComponentMap[toolName] || null
}

// Verificar se é tool SATI
export function isSATITool(toolName: string): boolean {
  const satiTools = [
    "createHyperfocus",
    "listHyperfocus", 
    "getHyperfocus",
    "createTask",
    "updateTaskStatus",
    "breakIntoSubtasks",
    "startFocusTimer",
    "endFocusTimer",
    "analyzeContext",
    "createAlternancy",
  ]
  
  return satiTools.includes(toolName)
}

// Formatação de conteúdo de mensagem
export function truncateContent(content: string, maxLength: number = 100): string {
  if (content.length <= maxLength) return content
  return content.slice(0, maxLength) + "..."
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length
}

export function estimateReadingTime(text: string): number {
  const wordsPerMinute = 200
  const wordCount = countWords(text)
  return Math.ceil(wordCount / wordsPerMinute)
}

// Validação de input
export function validateMessageInput(content: string): { isValid: boolean; error?: string } {
  if (!content.trim()) {
    return { isValid: false, error: "Mensagem não pode estar vazia" }
  }
  
  if (content.length > 4000) {
    return { isValid: false, error: "Mensagem muito longa (máximo 4000 caracteres)" }
  }
  
  return { isValid: true }
}

// Storage helpers
export function saveMessageToStorage(message: ChatMessage): void {
  try {
    const stored = localStorage.getItem("sati_chat_messages")
    const messages = stored ? JSON.parse(stored) : []
    messages.push(message)
    
    // Manter apenas os últimos 100 mensagens
    if (messages.length > 100) {
      messages.splice(0, messages.length - 100)
    }
    
    localStorage.setItem("sati_chat_messages", JSON.stringify(messages))
  } catch (error) {
    console.warn("Failed to save message to storage:", error)
  }
}

export function loadMessagesFromStorage(): ChatMessage[] {
  try {
    const stored = localStorage.getItem("sati_chat_messages")
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.warn("Failed to load messages from storage:", error)
    return []
  }
}

export function clearMessagesFromStorage(): void {
  try {
    localStorage.removeItem("sati_chat_messages")
  } catch (error) {
    console.warn("Failed to clear messages from storage:", error)
  }
}