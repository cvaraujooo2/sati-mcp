"use client"

import { useState, Suspense } from "react"
import { formatTimestamp, cn } from "@/lib/chat/utils"
import { Button } from "@/components/ui/button"
import { 
  Copy, 
  RotateCcw, 
  Edit3, 
  User, 
  Bot,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  Loader2
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { MessageProps } from "@/lib/chat/types"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import dynamic from "next/dynamic"

// Dynamic imports dos componentes SATI (usando named exports)
const HyperfocusCard = dynamic(() => import("@/components/HyperfocusCard").then(mod => mod.HyperfocusCard), {
  loading: () => <ComponentLoading />,
  ssr: false
})

const HyperfocusList = dynamic(() => import("@/components/HyperfocusList").then(mod => mod.HyperfocusList), {
  loading: () => <ComponentLoading />,
  ssr: false
})

const TaskBreakdown = dynamic(() => import("@/components/TaskBreakdown").then(mod => mod.TaskBreakdown), {
  loading: () => <ComponentLoading />,
  ssr: false
})

const SubtaskSuggestions = dynamic(() => import("@/components/SubtaskSuggestions").then(mod => mod.SubtaskSuggestions), {
  loading: () => <ComponentLoading />,
  ssr: false
})

const FocusTimer = dynamic(() => import("@/components/FocusTimer").then(mod => mod.FocusTimer), {
  loading: () => <ComponentLoading />,
  ssr: false
})

const FocusSessionSummary = dynamic(() => import("@/components/FocusSessionSummary").then(mod => mod.FocusSessionSummary), {
  loading: () => <ComponentLoading />,
  ssr: false
})

const ContextAnalysis = dynamic(() => import("@/components/ContextAnalysis").then(mod => mod.ContextAnalysis), {
  loading: () => <ComponentLoading />,
  ssr: false
})

const AlternancyFlow = dynamic(() => import("@/components/AlternancyFlow").then(mod => mod.AlternancyFlow), {
  loading: () => <ComponentLoading />,
  ssr: false
})

// Loading component
function ComponentLoading() {
  return (
    <div className="flex items-center gap-2 p-4 bg-muted/30 rounded-lg">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm text-muted-foreground">Carregando componente...</span>
    </div>
  )
}

// Mapa de componentes
const COMPONENT_MAP: Record<string, React.ComponentType<any>> = {
  HyperfocusCard,
  HyperfocusList,
  TaskBreakdown,
  SubtaskSuggestions,
  FocusTimer,
  FocusSessionSummary,
  ContextAnalysis,
  AlternancyFlow,
}

// Component renderer for SATI tools
function SATIComponentRenderer({ 
  toolName, 
  toolResult, 
  toolCall 
}: { 
  toolName: string
  toolResult?: any
  toolCall?: any 
}) {
  // Extrair o resultado real do toolResult.result se existir
  const actualResult = toolResult?.result || toolResult
  
  // Detectar qual componente renderizar baseado no resultado da tool
  const componentName = actualResult?.component?.name
  const componentProps = actualResult?.component?.props
  
  // Se temos um componente específico para renderizar
  if (componentName && COMPONENT_MAP[componentName]) {
    const Component = COMPONENT_MAP[componentName]
    
    return (
      <div className="my-3">
        <Suspense fallback={<ComponentLoading />}>
          <Component {...componentProps} />
        </Suspense>
      </div>
    )
  }
  
  // Fallback: mostrar dados estruturados
  if (actualResult?.structuredContent) {
    return (
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 my-3">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
            {toolName}
          </p>
        </div>
        <div className="text-sm">
          {renderStructuredContent(actualResult.structuredContent)}
        </div>
      </div>
    )
  }
  
  // Fallback final: mostrar dados de forma segura
  return (
    <div className="bg-muted/50 border border-border rounded-lg p-4 my-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 bg-blue-500 rounded-full" />
        <p className="text-sm font-medium">
          {toolName}
        </p>
      </div>
      {actualResult && (
        <div className="text-xs" key={`tool-result-${toolName}`}>
          {renderContentSafely(actualResult)}
        </div>
      )}
    </div>
  )
}

// Helper para renderizar arrays com keys
function renderArraySafely(items: any[], keyPrefix: string = 'item'): React.ReactNode {
  if (!Array.isArray(items) || items.length === 0) return null
  
  return (
    <div className="space-y-1">
      {items.map((item, index) => (
        <div key={`${keyPrefix}-${index}`} className="text-xs">
          {typeof item === 'object' && item !== null ? (
            <pre className="overflow-x-auto">{JSON.stringify(item, null, 2)}</pre>
          ) : (
            <span>{String(item)}</span>
          )}
        </div>
      ))}
    </div>
  )
}

// Helper para renderizar qualquer conteúdo de forma segura
function renderContentSafely(content: any): React.ReactNode {
  if (content === null || content === undefined) return null
  
  if (Array.isArray(content)) {
    return renderArraySafely(content, 'content')
  }
  
  if (typeof content === 'object') {
    // Verificar se o objeto contém arrays que possam causar problemas
    const entries = Object.entries(content)
    const hasArrays = entries.some(([, value]) => Array.isArray(value))
    
    if (hasArrays || entries.length > 1) {
      // Renderizar propriedades individualmente para evitar problemas de key
      return (
        <div className="space-y-2">
          {entries.map(([key, value], index) => (
            <div key={`prop-${key}-${index}`} className="text-xs">
              <span className="font-medium text-muted-foreground">{key}: </span>
              {Array.isArray(value) ? (
                renderArraySafely(value, `${key}-item`)
              ) : typeof value === 'object' && value !== null ? (
                <pre className="inline">{JSON.stringify(value, null, 2)}</pre>
              ) : (
                <span>{String(value)}</span>
              )}
            </div>
          ))}
        </div>
      )
    }
    
    return (
      <pre className="text-xs overflow-x-auto">
        {JSON.stringify(content, null, 2)}
      </pre>
    )
  }
  
  return <span>{String(content)}</span>
}

// Helper para renderizar conteúdo estruturado
function renderStructuredContent(content: any): React.ReactNode {
  if (!content) return null
  
  const { type, ...data } = content
  
  switch (type) {
    case 'hyperfocus_created':
      return (
        <div className="space-y-2">
          <p className="font-medium text-base">{data.title}</p>
          {data.description && (
            <p className="text-sm text-muted-foreground">{data.description}</p>
          )}
          <div className="flex gap-2 text-xs text-muted-foreground">
            <span>Cor: {data.color}</span>
            {data.estimatedTimeMinutes && (
              <span>• {data.estimatedTimeMinutes} min</span>
            )}
          </div>
        </div>
      )
    
    case 'task_created':
      return (
        <div className="space-y-1">
          <p className="font-medium">{data.title}</p>
          {data.description && (
            <p className="text-sm text-muted-foreground">{data.description}</p>
          )}
        </div>
      )
    
    default:
      return renderContentSafely(data)
  }
}

// Tool call display
function ToolCallDisplay({ 
  toolCall, 
  toolResult,
  onCallTool,
  showExpanded = false 
}: {
  toolCall: {
    id: string
    name: string
    parameters?: Record<string, unknown>
    timestamp: Date | string
    status: string
  }
  toolResult?: {
    error?: string
    result?: unknown
  }
  onCallTool?: (toolName: string, params: Record<string, unknown>) => Promise<unknown>
  showExpanded?: boolean
}) {
  const [isExpanded, setIsExpanded] = useState(showExpanded)

  const getStatusIcon = () => {
    switch (toolCall.status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "executing":
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = () => {
    switch (toolCall.status) {
      case "completed":
        return "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20"
      case "error":
        return "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20"
      case "executing":
      case "pending":
        return "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20"
      default:
        return "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/20"
    }
  }

  return (
    <div className={cn("border rounded-lg overflow-hidden my-2", getStatusColor())}>
      {/* Tool header */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="font-medium text-sm">{toolCall.name}</span>
          <span className="text-xs text-muted-foreground">
            {formatTimestamp(toolCall.timestamp)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {toolCall.status === "executing" && (
            <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full" />
          )}
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </div>
      </div>

      {/* Tool details */}
      {isExpanded && (
        <div className="border-t px-3 py-2">
          {/* Parameters */}
          {Object.keys(toolCall.parameters || {}).length > 0 && (
            <div className="mb-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-2">
                Parâmetros:
              </h4>
              <div className="text-xs bg-muted/50 p-2 rounded overflow-x-auto">
                {renderContentSafely(toolCall.parameters)}
              </div>
            </div>
          )}

          {/* Result */}
          {toolResult && (
            <div className="mb-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-2">
                Resultado:
              </h4>
              {toolResult.error ? (
                <div className="text-xs text-red-600 bg-red-50 dark:bg-red-950/20 p-2 rounded">
                  {toolResult.error}
                </div>
              ) : (
                <SATIComponentRenderer
                  toolName={toolCall.name}
                  toolResult={toolResult}
                  toolCall={toolCall}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function Message({
  message,
  isLast = false,
  onEdit,
  onRegenerate,
  onCopy,
  onCallTool,
  onSendFollowup,
  showActions = true,
}: MessageProps) {
  const [isHovered, setIsHovered] = useState(false)

  const isUser = message.role === "user"
  const isAssistant = message.role === "assistant"
  const isSystem = message.role === "system"

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      onCopy?.(message.content)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  return (
    <div
      className={cn(
        "group flex gap-4 p-4 transition-colors",
        isUser && "bg-muted/30",
        isLast && "mb-4"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar */}
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        isUser ? "bg-primary text-primary-foreground" : "bg-muted"
      )}>
        {isUser ? (
          <User className="h-4 w-4" />
        ) : isSystem ? (
          <Bot className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Message header */}
        <div className="flex items-center gap-2 mb-2">
          <span className="font-semibold text-sm">
            {isUser ? "Você" : isSystem ? "Sistema" : "SATI"}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatTimestamp(message.timestamp)}
          </span>
        </div>

        {/* Message content */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {message.content ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Custom renderers for better styling
                code: ({ children, className, ...props }) => {
                  const isInline = !className
                  return isInline ? (
                    <code 
                      className="bg-muted px-1 py-0.5 rounded text-sm font-mono" 
                      {...props}
                    >
                      {children}
                    </code>
                  ) : (
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                      <code className="text-sm font-mono" {...props}>
                        {children}
                      </code>
                    </pre>
                  )
                },
                a: ({ children, href, ...props }) => (
                  <a 
                    href={href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                    {...props}
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          ) : (
            <div className="text-muted-foreground text-sm italic">
              Pensando...
            </div>
          )}
        </div>

        {/* Tool calls */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-4 space-y-2">
            {message.toolCalls.map((toolCall, index) => {
              const toolResult = message.toolResults?.find(
                result => result.toolCallId === toolCall.id
              )
              return (
                <ToolCallDisplay
                  key={`${toolCall.id}-${index}-${toolCall.status}`}
                  toolCall={toolCall}
                  toolResult={toolResult}
                  onCallTool={onCallTool}
                  showExpanded={true}
                />
              )
            })}
          </div>
        )}

        {/* Actions */}
        {showActions && (isHovered || isLast) && (
          <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={handleCopy}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copiar</TooltipContent>
            </Tooltip>

            {isAssistant && onRegenerate && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => onRegenerate(message.id)}
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Regenerar</TooltipContent>
              </Tooltip>
            )}

            {isUser && onEdit && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => onEdit(message.id, message.content)}
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Editar</TooltipContent>
              </Tooltip>
            )}
          </div>
        )}
      </div>
    </div>
  )
}