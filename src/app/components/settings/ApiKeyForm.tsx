'use client'

/**
 * API Key Form Component
 * 
 * Form para inserção e validação de API keys.
 * Baseado na implementação do MCPJam com adaptações para o SATI.
 */

import { useState, useEffect } from 'react'
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { 
  AlertCircle, 
  CheckCircle, 
  Eye, 
  EyeOff, 
  Loader2,
  Trash2,
  TestTube
} from "lucide-react"

import { apiKeyService, type ApiProvider, type ApiKeyValidationResult } from '@/lib/services/apiKey.service'

interface ApiKeyFormProps {
  provider: ApiProvider
  placeholder: string
  onApiKeyUpdated: () => void
  hasApiKey: boolean
}

export function ApiKeyForm({ provider, placeholder, onApiKeyUpdated, hasApiKey }: ApiKeyFormProps) {
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [validationResult, setValidationResult] = useState<ApiKeyValidationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Estados da validação
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [lastValidatedKey, setLastValidatedKey] = useState<string>('')

  // Limpar estados quando mudar provider ou resetar
  useEffect(() => {
    setApiKey('')
    setValidationResult(null)
    setError(null)
    setIsValid(null)
    setLastValidatedKey('')
  }, [provider])

  // Validar API key em tempo real (debounced)
  useEffect(() => {
    if (!apiKey || apiKey.length < 10) {
      setValidationResult(null)
      setIsValid(null)
      return
    }

    // Se já validamos essa key, não validar novamente
    if (lastValidatedKey === apiKey && isValid !== null) {
      return
    }

    const timeoutId = setTimeout(async () => {
      setIsValidating(true)
      setError(null)

      try {
        const result = await apiKeyService.validateApiKey(provider, apiKey)
        setValidationResult(result)
        setIsValid(result.isValid)
        setLastValidatedKey(apiKey)
        
        if (!result.isValid) {
          setError(result.error || 'API key inválida')
        }
      } catch (error) {
        setError('Erro ao validar API key')
        setIsValid(false)
      } finally {
        setIsValidating(false)
      }
    }, 1000) // Debounce de 1 segundo

    return () => clearTimeout(timeoutId)
  }, [apiKey, provider, lastValidatedKey, isValid])

  const handleSave = async () => {
    if (!apiKey || !isValid) return

    setIsSaving(true)
    setError(null)

    try {
      const result = await apiKeyService.saveApiKey(provider, apiKey)
      
      if (result.success) {
        setApiKey('')
        setValidationResult(null)
        setIsValid(null)
        setLastValidatedKey('')
        onApiKeyUpdated()
      } else {
        setError(result.error || 'Erro ao salvar API key')
      }
    } catch (error) {
      setError('Erro inesperado ao salvar API key')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemove = async () => {
    setIsRemoving(true)
    setError(null)

    try {
      const result = await apiKeyService.removeApiKey(provider)
      
      if (result.success) {
        onApiKeyUpdated()
      } else {
        setError(result.error || 'Erro ao remover API key')
      }
    } catch (error) {
      setError('Erro inesperado ao remover API key')
    } finally {
      setIsRemoving(false)
    }
  }

  const handleTest = async () => {
    if (!hasApiKey) return

    setIsValidating(true)
    setError(null)

    try {
      const storedKey = await apiKeyService.getApiKey(provider)
      if (!storedKey) {
        setError('Nenhuma API key encontrada')
        return
      }

      const result = await apiKeyService.validateApiKey(provider, storedKey)
      setValidationResult(result)
      
      if (!result.isValid) {
        setError(result.error || 'API key inválida')
      }
    } catch (error) {
      setError('Erro ao testar API key')
    } finally {
      setIsValidating(false)
    }
  }

  // Renderização do status de validação
  const renderValidationStatus = () => {
    if (isValidating) {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Validando API key...
        </div>
      )
    }

    if (validationResult && isValid) {
      return (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <CheckCircle className="w-4 h-4" />
          API key válida
          {validationResult.model && (
            <span className="text-xs bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
              {validationResult.model}
            </span>
          )}
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )
    }

    return null
  }

  if (hasApiKey) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <CheckCircle className="w-4 h-4" />
            API key configurada
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTest}
              disabled={isValidating}
              className="flex items-center gap-2"
            >
              {isValidating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <TestTube className="w-4 h-4" />
              )}
              Testar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              disabled={isRemoving}
              className="flex items-center gap-2"
            >
              {isRemoving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Remover
            </Button>
          </div>
        </div>
        
        {renderValidationStatus()}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`api-key-${provider}`}>
          API Key do {provider.charAt(0).toUpperCase() + provider.slice(1)}
        </Label>
        <div className="relative">
          <Input
            id={`api-key-${provider}`}
            type={showApiKey ? "text" : "password"}
            placeholder={placeholder}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowApiKey(!showApiKey)}
          >
            {showApiKey ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {renderValidationStatus()}

      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Sua API key é criptografada antes de ser armazenada
        </div>
        <Button
          onClick={handleSave}
          disabled={!apiKey || !isValid || isSaving}
          className="flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar API Key'
          )}
        </Button>
      </div>
    </div>
  )
}