"use client"

import { useEffect, useRef, useState } from "react"
import { useChat } from "@/lib/chat/hooks"
import { ChatInput } from "./ChatInput"
import { Message } from "./Message"
import { TooltipProvider } from "@/app/components/ui/tooltip"
import { Button } from "@/app/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, Sparkles, Settings, Zap } from "lucide-react"
import { ChatInterfaceProps } from "@/lib/chat/types"
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

  // Check if we need to show setup
  if (!hasApiKey) {
    return (
      <TooltipProvider>
        <div className={cn("flex flex-col h-full", className)}>
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md space-y-6 text-center"
            >
              {/* SATI Logo/Icon */}
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <Zap className="h-8 w-8 text-white" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">
                  Bem-vindo ao SATI
                </h2>
                <p className="text-muted-foreground">
                  Seu assistente de produtividade para neurodivergentes
                </p>
              </div>

              <div className="space-y-4 text-sm text-muted-foreground">
                <p>
                  Para começar, você precisa configurar sua API key da OpenAI.
                </p>
                <div className="bg-muted/50 border rounded-lg p-4 space-y-2">
                  <p className="font-medium text-foreground">Modelo BYOK:</p>
                  <ul className="space-y-1 text-left">
                    <li>• Você mantém controle total dos seus dados</li>
                    <li>• Sem limites de uso</li>
                    <li>• Suporte a múltiplos modelos</li>
                    <li>• Zero lock-in</li>
                  </ul>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={() => {
                  // TODO: Navigate to settings or show API key modal
                  console.log("Navigate to API key setup")
                }}
              >
                <Settings className="h-4 w-4 mr-2" />
                Configurar API Key
              </Button>
            </motion.div>
          </div>
        </div>
      </TooltipProvider>
    )
  }

  // Empty state with quick start
  if (messages.length === 0) {
    return (
      <TooltipProvider>
        <div className={cn("flex flex-col h-full", className)}>
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
          <div className="border-t bg-background/95 backdrop-blur p-4">
            <div className="max-w-4xl mx-auto">
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
        <div className="border-t bg-background/95 backdrop-blur p-4">
          <div className="max-w-4xl mx-auto">
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