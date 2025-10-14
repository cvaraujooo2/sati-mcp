"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/chat/utils"
import { Button } from "@/app/components/ui/button"
import { Textarea } from "@/app/components/ui/textarea"
import { ArrowUp, Paperclip, Square, ArrowDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip"
import { ModelDefinition, ChatInputProps, Attachment } from "@/lib/chat/types"

export function ChatInput({
  value,
  onChange,
  onSubmit,
  onStop,
  disabled = false,
  isLoading = false,
  placeholder = "Digite sua mensagem...",
  className,
  showScrollToBottom = false,
  onScrollToBottom,
  currentModel,
  availableModels = [],
  onModelChange,
  systemPrompt,
  onSystemPromptChange,
  temperature,
  onTemperatureChange,
  hasMessages = false,
  onClearChat,
}: ChatInputProps) {
  // Local state
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [uploadQueue, setUploadQueue] = useState<string[]>([])
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = "auto"
    const newHeight = Math.min(textarea.scrollHeight, 200) // Max 200px
    textarea.style.height = `${newHeight}px`
  }, [])

  useEffect(() => {
    adjustTextareaHeight()
  }, [value, adjustTextareaHeight])

  // Handle submit
  const handleSubmit = useCallback(() => {
    if (!value.trim() || disabled || isLoading || uploadQueue.length > 0) return
    
    onSubmit(value, attachments)
    
    // Clear input and attachments after submit
    onChange("")
    setAttachments([])
    
    // Reset textarea height
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    }, 50)
  }, [value, disabled, isLoading, uploadQueue.length, onSubmit, attachments, onChange])

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // Handle file upload (mock implementation)
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      if (files.length === 0) return

      // Validate files
      const validFiles = files.filter(file => {
        const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf", "text/plain"]
        return allowedTypes.includes(file.type) && file.size < 10 * 1024 * 1024 // 10MB
      })

      if (validFiles.length !== files.length) {
        // TODO: Show toast error for invalid files
        console.warn("Some files were rejected (invalid type or too large)")
      }

      setUploadQueue(validFiles.map(f => f.name))

      try {
        // Mock file upload - in production, upload to Supabase Storage
        const uploadedFiles: Attachment[] = await Promise.all(
          validFiles.map(async (file) => {
            // Simulate upload delay
            await new Promise(resolve => setTimeout(resolve, 1000))

            return {
              id: Math.random().toString(36).substring(2),
              name: file.name,
              url: URL.createObjectURL(file), // Temporary URL for demo
              contentType: file.type,
              size: file.size,
            }
          })
        )

        setAttachments(prev => [...prev, ...uploadedFiles])
      } catch (error) {
        console.error("Error uploading files:", error)
      } finally {
        setUploadQueue([])
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      }
    },
    []
  )

  // Remove attachment
  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id))
  }

  return (
    <div className="relative w-full">
      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollToBottom && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute left-1/2 bottom-full mb-4 -translate-x-1/2 z-50"
          >
            <Button
              size="sm"
              variant="outline"
              className="rounded-full shadow-lg cursor-pointer"
              onClick={onScrollToBottom}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
        accept="image/*,.pdf,.txt,.json,.csv"
      />

      {/* Attachments preview */}
      {(attachments.length > 0 || uploadQueue.length > 0) && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg text-sm"
            >
              <span className="truncate max-w-[200px]">{attachment.name}</span>
              <button
                onClick={() => removeAttachment(attachment.id)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                ×
              </button>
            </div>
          ))}
          {uploadQueue.map((filename) => (
            <div
              key={filename}
              className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/20 px-3 py-2 rounded-lg text-sm"
            >
              <span className="truncate max-w-[200px]">{filename}</span>
              <div className="animate-spin h-3 w-3 border border-blue-500 border-t-transparent rounded-full" />
            </div>
          ))}
        </div>
      )}

      {/* Main input area */}
      <div className="relative border border-border rounded-lg bg-background shadow-sm">
        {/* Textarea */}
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          className={cn(
            "min-h-12 max-h-48 border-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0",
            "pr-24 pl-12", // Space for buttons
            disabled ? "cursor-not-allowed bg-muted/30 text-muted-foreground" : "",
            className
          )}
          rows={1}
          autoFocus={!disabled}
        />

        {/* Attachment button - left side */}
        <div className="absolute bottom-3 left-4 flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full hover:bg-muted/80 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isLoading}
              >
                <Paperclip size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Anexar arquivo</TooltipContent>
          </Tooltip>
        </div>

        {/* Submit/Stop button - right side */}
        <div className="absolute bottom-3 right-4 flex items-center gap-1">
          {isLoading ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0 rounded-full border-border/30 hover:border-border/50 transition-colors cursor-pointer"
                  onClick={onStop}
                >
                  <Square size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Parar geração</TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="sm"
                  className={cn(
                    "h-8 w-8 p-0 rounded-full transition-all duration-200 cursor-pointer",
                    value.trim() && !disabled && uploadQueue.length === 0
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                  onClick={handleSubmit}
                  disabled={!value.trim() || disabled || uploadQueue.length > 0}
                >
                  <ArrowUp size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Enviar mensagem</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Bottom row - Model selector and actions */}
      <div className="flex items-center justify-between mt-3">
        {/* Model info */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {currentModel && (
            <span>
              {currentModel.name} • {currentModel.provider}
            </span>
          )}
          {hasMessages && onClearChat && (
            <>
              <span>•</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearChat}
                className="h-6 px-2 text-xs hover:text-foreground"
              >
                Limpar chat
              </Button>
            </>
          )}
        </div>

        {/* Advanced settings */}
        <div className="flex items-center gap-2">
          {/* TODO: Add model selector, system prompt selector, temperature slider */}
          {temperature !== undefined && (
            <span className="text-xs text-muted-foreground">
              Temp: {temperature}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}