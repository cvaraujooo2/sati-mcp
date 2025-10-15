// Chat types baseados no MCPJam mas adaptados para SATI
export interface ContentBlock {
  id: string
  type: 'text' | 'tool_call' | 'tool_result'
  content?: string
  toolCall?: ToolCall
  toolResult?: ToolResult
  timestamp: Date
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  attachments?: Attachment[]
  toolCalls?: ToolCall[]
  toolResults?: ToolResult[]
  contentBlocks?: ContentBlock[]
  metadata?: MessageMetadata
}

export interface Attachment {
  id: string
  name: string
  url: string
  contentType: string
  size?: number
}

export interface ToolCall {
  id: string
  name: string
  parameters: Record<string, any>
  timestamp: Date
  status: 'pending' | 'executing' | 'completed' | 'error'
}

export interface ToolResult {
  id: string
  toolCallId: string
  result?: any
  error?: string
  timestamp: Date
}

export interface MessageMetadata {
  userId?: string
  sessionId?: string
  model?: string
  temperature?: number
  tokens?: {
    input: number
    output: number
    total: number
  }
}

export interface ChatState {
  messages: ChatMessage[]
  isLoading: boolean
  error?: string
  connectionStatus: 'connected' | 'disconnected' | 'connecting'
}

export interface ChatActions {
  sendMessage: (message: string, attachments?: Attachment[]) => Promise<void>
  stopGeneration: () => void
  clearChat: () => void
  regenerateMessage: (messageId: string) => Promise<void>
  updateMessage: (messageId: string, updates: Partial<ChatMessage>) => void
}

export type ChatStatus = 'idle' | 'typing' | 'streaming' | 'error'

export interface StreamingMessage {
  id: string
  content: string
  isComplete: boolean
}

// SATI-specific types
export interface SATIToolCall extends ToolCall {
  component?: string // Nome do componente React para renderizar
  displayMode?: 'inline' | 'fullscreen' | 'pip' | 'minimal'
}

export interface SATIToolResult extends ToolResult {
  component?: string
  componentProps?: Record<string, any>
  structuredContent?: any
}

// Model types (reaproveitados do MCPJam) - EXPANDIDO
export interface ModelDefinition {
  id: string
  name: string
  provider: 'openai' | 'anthropic' | 'google' | 'deepseek' | 'ollama'
  disabled?: boolean
  disabledReason?: string
  maxTokens?: number
  supportsFunctions?: boolean
  // Novos campos para gerenciamento de modelos
  deprecated?: boolean
  replacementModel?: string // ID do modelo que substitui este
  releaseDate?: string // Data de lançamento (ISO format)
  description?: string // Descrição detalhada do modelo
}

// User Preferences
export interface UserPreferences {
  id: string
  user_id: string
  preferred_provider: 'openai' | 'anthropic' | 'google'
  preferred_model: string
  model_warnings_dismissed: string[] // Array de warning IDs já vistos
  created_at: string
  updated_at: string
}

// Model Warnings
export interface ModelWarning {
  id: string
  type: 'deprecated' | 'new_model' | 'name_change'
  severity: 'info' | 'warning' | 'critical'
  modelId: string
  modelName: string
  message: string
  actionLabel?: string
  actionUrl?: string
  replacementModelId?: string
  dismissible: boolean
}

// Usage Limits
export interface UserUsageLimits {
  id: string
  user_id: string
  daily_requests_used: number
  monthly_requests_used: number
  last_request_date: string
  last_reset_date: string
  monthly_reset_date: string
  tier: 'free' | 'byok'
  created_at: string
  updated_at: string
}

// Usage Info (enviado no chat stream)
export interface UsageInfo {
  usingFallback: boolean
  remainingDailyRequests: number | null
  remainingMonthlyRequests: number | null
  tier: 'free' | 'byok'
}

// Stream events
export interface ChatStreamEvent {
  type: 'text' | 'tool_call' | 'tool_result' | 'error' | 'done' | 'usage_info'
  content?: string
  toolCall?: ToolCall
  toolResult?: ToolResult
  error?: string
  usageInfo?: UsageInfo
  timestamp?: Date
}

// Hook options
export interface UseChatOptions {
  initialMessages?: ChatMessage[]
  systemPrompt?: string
  temperature?: number
  model?: ModelDefinition
  onMessageSent?: (message: ChatMessage) => void
  onMessageReceived?: (message: ChatMessage) => void
  onError?: (error: string) => void
  onToolCall?: (toolCall: ToolCall) => void
  onToolResult?: (toolResult: ToolResult) => void
  onModelChange?: (model: ModelDefinition) => void
}

// UI Component props
export interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (message: string, attachments?: Attachment[]) => void
  onStop?: () => void
  disabled?: boolean
  isLoading?: boolean
  placeholder?: string
  className?: string
  // Model selector
  currentModel?: ModelDefinition | null
  availableModels?: ModelDefinition[]
  onModelChange?: (model: ModelDefinition) => void
  // Advanced settings
  systemPrompt?: string
  onSystemPromptChange?: (prompt: string) => void
  temperature?: number
  onTemperatureChange?: (temperature: number) => void
  // UI state
  showScrollToBottom?: boolean
  onScrollToBottom?: () => void
  hasMessages?: boolean
  onClearChat?: () => void
}

export interface MessageProps {
  message: ChatMessage
  isLast?: boolean
  onEdit?: (messageId: string, newContent: string) => void
  onRegenerate?: (messageId: string) => void
  onCopy?: (content: string) => void
  onCallTool?: (toolName: string, params: Record<string, any>) => Promise<any>
  onSendFollowup?: (message: string) => void
  showActions?: boolean
}

export interface ChatInterfaceProps {
  initialMessages?: ChatMessage[]
  systemPrompt?: string
  className?: string
  demoMessage?: string | null
  onMessageSent?: (message: ChatMessage) => void
  onError?: (error: string) => void
  onDemoMessageProcessed?: () => void
}