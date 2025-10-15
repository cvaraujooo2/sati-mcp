'use client'

/**
 * Model Selector Component
 * 
 * Seletor de modelo/provider para o chat.
 * Aparece no header do chat, entre o logo e o input.
 */

import { useState } from 'react'
import { ModelDefinition } from '@/lib/chat/types'
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from '@/app/components/ui/select'
import { Badge } from '@/app/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/app/components/ui/tooltip'
import { Bot, AlertCircle, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModelSelectorProps {
  currentModel: ModelDefinition | null
  availableModels: ModelDefinition[]
  onModelChange: (model: ModelDefinition) => void
  disabled?: boolean
  className?: string
}

export function ModelSelector({
  currentModel,
  availableModels,
  onModelChange,
  disabled = false,
  className
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Agrupar modelos por provider
  const modelsByProvider = availableModels.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = []
    }
    acc[model.provider].push(model)
    return acc
  }, {} as Record<string, ModelDefinition[]>)

  const providerNames = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    google: 'Google',
    deepseek: 'DeepSeek',
    ollama: 'Ollama'
  }

  const providerIcons = {
    openai: '🤖',
    anthropic: '🧠',
    google: '🔍',
    deepseek: '🌊',
    ollama: '🦙'
  }

  const handleValueChange = (modelId: string) => {
    const selected = availableModels.find(m => m.id === modelId)
    if (selected) {
      onModelChange(selected)
    }
  }

  if (!currentModel || availableModels.length === 0) {
    return null
  }

  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-2", className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              <Select
                value={currentModel.id}
                onValueChange={handleValueChange}
                disabled={disabled}
                onOpenChange={setIsOpen}
              >
                <SelectTrigger className={cn(
                  "w-[200px] md:w-[250px] border-purple-200 dark:border-purple-800",
                  "focus:ring-purple-500 dark:focus:ring-purple-400",
                  disabled && "opacity-50 cursor-not-allowed"
                )}>
                  <div className="flex items-center gap-2 w-full">
                    <span className="text-base">{providerIcons[currentModel.provider]}</span>
                    <SelectValue>
                      <div className="flex items-center gap-2 justify-between w-full">
                        <span className="truncate text-sm">{currentModel.name}</span>
                        {currentModel.deprecated && (
                          <Badge variant="outline" className="text-xs border-orange-500 text-orange-600 dark:text-orange-400">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Deprecated
                          </Badge>
                        )}
                      </div>
                    </SelectValue>
                  </div>
                </SelectTrigger>

                <SelectContent className="max-h-[400px] overflow-y-auto">
                  {Object.entries(modelsByProvider).map(([provider, models]) => (
                    <SelectGroup key={provider}>
                      <SelectLabel className="flex items-center gap-2 text-sm font-semibold">
                        <span>{providerIcons[provider as keyof typeof providerIcons]}</span>
                        {providerNames[provider as keyof typeof providerNames]}
                      </SelectLabel>
                      {models.map((model) => (
                        <SelectItem
                          key={model.id}
                          value={model.id}
                          className={cn(
                            "cursor-pointer",
                            model.deprecated && "opacity-60"
                          )}
                        >
                          <div className="flex items-center justify-between w-full gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{model.name}</span>
                              {model.deprecated && (
                                <Badge variant="outline" className="text-xs border-orange-500 text-orange-600">
                                  Deprecated
                                </Badge>
                              )}
                              {model.releaseDate && isNewModel(model.releaseDate) && (
                                <Badge variant="outline" className="text-xs border-green-500 text-green-600 dark:text-green-400">
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  Novo
                                </Badge>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-semibold">{currentModel.name}</p>
              {currentModel.description && (
                <p className="text-xs text-muted-foreground">{currentModel.description}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Max tokens: {currentModel.maxTokens?.toLocaleString() || 'N/A'}
              </p>
              {currentModel.deprecated && currentModel.replacementModel && (
                <p className="text-xs text-orange-500 dark:text-orange-400">
                  ⚠️ Use {currentModel.replacementModel} ao invés deste
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}

// Helper: verifica se um modelo é novo (últimos 30 dias)
function isNewModel(releaseDate: string): boolean {
  const release = new Date(releaseDate)
  const now = new Date()
  const diffDays = (now.getTime() - release.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays <= 30
}


