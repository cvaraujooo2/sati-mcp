"use client"

import { useEffect, useRef, useState } from "react"
import { useChat } from "@/lib/chat/hooks"
import { ChatInput } from "./ChatInput"
import { Message } from "./Message"
import { ModelSelector } from "./ModelSelector"
import { UsageLimitBanner } from "./UsageLimitBanner"
import { TooltipProvider } from "@/app/components/ui/tooltip"
import { Button } from "@/app/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, Sparkles, Settings, Zap } from "lucide-react"
import { ChatInterfaceProps, UsageInfo } from "@/lib/chat/types"
import { cn } from "@/lib/chat/utils"

// Quick start prompts específicos para SATI
const QUICK_START_PROMPTS = [
  {
    label: "Criar Hiperfoco",
    value: "Quero criar um novo hiperfoco para estudar React com TypeScript",
    icon: Zap,
  },
  {
    label: "Quebrar Tarefa",
    value: "Preciso quebrar esta tarefa em partes menores: Desenvolver um sistema de autenticação completo",
    icon: Sparkles,
  },
  {
    label: "Iniciar Timer",
    value: "Vou começar a trabalhar agora, me ajude a configurar um timer de foco",
    icon: MessageCircle,
  },
  {
    label: "Análise de Contexto", 
    value: "Analise meu contexto atual e sugira o que fazer agora",
    icon: Settings,
  },
]

export function ChatInterface({
  initialMessages = [],
  systemPrompt,
  className,
  demoMessage,
  onMessageSent,
  onError,
  onDemoMessageProcessed,
}: ChatInterfaceProps) {
  // Chat state
  const {
    messages,
    isLoading,
    error,
    input,
    setInput,
    model,
    availableModels,
    hasApiKey,
    usageInfo,
    sendMessage,
    stopGeneration,
    clearChat,
    regenerateMessage,
    handleModelChange,
  } = useChat({
    initialMessages,
    systemPrompt,
    onMessageSent,
    onError,
  })

  // UI state
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [showScrollButton, setShowScrollButton] = useState(false)
  
  // Refs
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll logic
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleScroll = () => {
    if (!messagesContainerRef.current) return

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
    const threshold = 100
    const atBottom = scrollHeight - scrollTop - clientHeight < threshold
    
    setIsAtBottom(atBottom)
    setShowScrollButton(!atBottom && messages.length > 0)
  }

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (isAtBottom) {
      setTimeout(scrollToBottom, 50)
    }
  }, [messages, isAtBottom])

  // Listen for clear chat events from tool palette
  useEffect(() => {
    const handleClearChat = () => {
      console.log('[ChatInterface] Clearing chat from palette command');
      clearChat();
    };

    window.addEventListener('sati-clear-chat', handleClearChat);
    
    return () => {
      window.removeEventListener('sati-clear-chat', handleClearChat);
    };
  }, [clearChat])

  // Process demo message from tool palette
  useEffect(() => {
    if (demoMessage && demoMessage.trim() && !isLoading) {
      console.log('[ChatInterface] Processing demo message:', demoMessage);
      
      // Set input first
      setInput(demoMessage);
      
      // Auto-send after a short delay to show the input being set
      const timer = setTimeout(() => {
        try {
          sendMessage(demoMessage);
          // Limpar o input após enviar a mensagem
          setTimeout(() => {
            setInput('');
          }, 100);
          onDemoMessageProcessed?.();
        } catch (error) {
          console.error('[ChatInterface] Error sending demo message:', error);
          // Limpar input mesmo em caso de erro
          setInput('');
          onDemoMessageProcessed?.();
        }
      }, 800); // Increased delay for better UX

      // Cleanup timeout if component unmounts
      return () => clearTimeout(timer);
    }
  }, [demoMessage, isLoading, setInput, sendMessage, onDemoMessageProcessed])

  // Handle message actions
  const handleEdit = (messageId: string, newContent: string) => {
    // TODO: Implement message editing
    console.log("Edit message:", messageId, newContent)
  }

  const handleCopy = (content: string) => {
    // TODO: Show toast notification
    console.log("Copied:", content)
  }

  const handleCallTool = async (toolName: string, params: Record<string, unknown>) => {
    // Tool calls are handled by the chat API
    console.log("Tool call:", toolName, params)
    return null
  }

  const handleSendFollowup = (message: string) => {
    setInput(message)
  }

  // Empty state with quick start
  if (messages.length === 0) {
    return (
      <TooltipProvider>
        <div className={cn("flex flex-col h-full", className)}>
          {/* Beta/Free Tier Banner - mostrar se NÃO tiver API key */}
          {!hasApiKey && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-b border-blue-200 dark:border-blue-800">
              <div className="max-w-4xl mx-auto px-4 py-3">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Modo Beta - Acesso Gratuito Limitado
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      Você está usando nossa API compartilhada. Para acesso ilimitado, configure sua própria API key nas{' '}
                      <a href="/settings" className="underline hover:text-blue-900 dark:hover:text-blue-100">
                        configurações
                      </a>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="w-full max-w-xl space-y-6 text-center"
            >
              {/* SATI Greeting */}
              <div className="space-y-2">
                <div className="w-12 h-12 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-xl font-semibold">
                  Olá! Eu sou o SATI 👋
                </h2>
                <p className="text-muted-foreground">
                  Vou te ajudar a focar, organizar tarefas e gerenciar seus hiperfocos.
                </p>
              </div>

              {/* Quick start prompts */}
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Escolha uma sugestão para começar:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {QUICK_START_PROMPTS.map(({ label, value, icon: Icon }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setInput(value)}
                      className="inline-flex items-center gap-3 rounded-lg border border-border/60 px-4 py-3 text-left text-sm transition hover:border-border hover:bg-muted/40"
                    >
                      <Icon className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="truncate">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Chat input at bottom */}
          <div className="border-t bg-background/95 backdrop-blur">
            {/* Model Selector Header */}
            {model && availableModels.length > 0 && (
              <div className="max-w-4xl mx-auto px-4 pt-3 pb-2">
                <ModelSelector
                  currentModel={model}
                  availableModels={availableModels}
                  onModelChange={handleModelChange}
                  disabled={isLoading}
                />
              </div>
            )}
            
            {/* Input Area */}
            <div className="max-w-4xl mx-auto p-4 pt-2">
              <ChatInput
                value={input}
                onChange={setInput}
                onSubmit={sendMessage}
                onStop={stopGeneration}
                disabled={!model}
                isLoading={isLoading}
                placeholder="Digite sua mensagem ou escolha uma sugestão acima..."
                currentModel={model}
                availableModels={availableModels}
                onModelChange={handleModelChange}
                hasMessages={false}
                onClearChat={clearChat}
              />
            </div>
          </div>
        </div>
      </TooltipProvider>
    )
  }

  // Active chat state
  return (
    <TooltipProvider>
      <div className={cn("flex flex-col h-full", className)}>
        {/* Usage Limit Banner - mostrar se estiver usando fallback */}
        {usageInfo?.usingFallback && (
          <UsageLimitBanner
            remainingDaily={usageInfo.remainingDailyRequests || 0}
            remainingMonthly={usageInfo.remainingMonthlyRequests || 0}
          />
        )}

        {/* Messages area */}
        <div 
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto"
        >
          <div className="max-w-4xl mx-auto">
            {/* Messages */}
            <AnimatePresence initial={false}>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Message
                    message={message}
                    isLast={index === messages.length - 1}
                    onEdit={handleEdit}
                    onRegenerate={regenerateMessage}
                    onCopy={handleCopy}
                    onCallTool={handleCallTool}
                    onSendFollowup={handleSendFollowup}
                    showActions={true}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Loading indicator */}
            {isLoading && messages.length > 0 && messages[messages.length - 1].role === "user" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4"
              >
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 flex items-center rounded-full justify-center bg-muted">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-sm">SATI</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                      <span className="text-sm">Pensando...</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4"
              >
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Chat input */}
        <div className="border-t bg-background/95 backdrop-blur">
          {/* Model Selector Header */}
          {model && availableModels.length > 0 && (
            <div className="max-w-4xl mx-auto px-4 pt-3 pb-2">
              <div className="flex items-center justify-between">
                <ModelSelector
                  currentModel={model}
                  availableModels={availableModels}
                  onModelChange={handleModelChange}
                  disabled={isLoading}
                />
                {messages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearChat}
                    disabled={isLoading}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Limpar conversa
                  </Button>
                )}
              </div>
            </div>
          )}
          
          {/* Input Area */}
          <div className="max-w-4xl mx-auto p-4 pt-2">
            <ChatInput
              value={input}
              onChange={setInput}
              onSubmit={sendMessage}
              onStop={stopGeneration}
              disabled={!model}
              isLoading={isLoading}
              placeholder="Digite sua mensagem..."
              currentModel={model}
              availableModels={availableModels}
              onModelChange={handleModelChange}
              showScrollToBottom={showScrollButton}
              onScrollToBottom={scrollToBottom}
              hasMessages={messages.length > 0}
              onClearChat={clearChat}
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}