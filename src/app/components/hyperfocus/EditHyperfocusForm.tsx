'use client'

/**
 * EditHyperfocusForm Component
 * Formulário para editar hiperfoco existente
 */

import { useState, FormEvent, useEffect } from 'react'
import { useAuth } from '@/lib/hooks'
import { useHyperfocus } from '@/lib/hooks/useHyperfocus'
import { Database } from '@/types/database'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Textarea } from '@/app/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/app/components/ui/alert'

type Hyperfocus = Database['public']['Tables']['hyperfocus']['Row']

interface EditHyperfocusFormProps {
  hyperfocus: Hyperfocus
  onSuccess?: () => void
  onCancel?: () => void
}

const colors = [
  { value: 'red', label: 'Vermelho', class: 'bg-red-500', emoji: '🔴' },
  { value: 'green', label: 'Verde', class: 'bg-green-500', emoji: '🟢' },
  { value: 'blue', label: 'Azul', class: 'bg-blue-500', emoji: '🔵' },
  { value: 'orange', label: 'Laranja', class: 'bg-orange-500', emoji: '🟠' },
  { value: 'purple', label: 'Roxo', class: 'bg-purple-500', emoji: '🟣' },
  { value: 'pink', label: 'Rosa', class: 'bg-pink-500', emoji: '🩷' },
  { value: 'brown', label: 'Marrom', class: 'bg-amber-700', emoji: '🟤' },
  { value: 'gray', label: 'Cinza', class: 'bg-gray-500', emoji: '⚪' },
] as const

export function EditHyperfocusForm({ hyperfocus, onSuccess, onCancel }: EditHyperfocusFormProps) {
  const { user } = useAuth()
  const { updateHyperfocus, loading, error } = useHyperfocus(user?.id || '')
  
  const [title, setTitle] = useState(hyperfocus.title)
  const [description, setDescription] = useState(hyperfocus.description || '')
  const [color, setColor] = useState(hyperfocus.color)
  const [estimatedTime, setEstimatedTime] = useState(
    hyperfocus.estimated_time_minutes?.toString() || ''
  )
  const [localError, setLocalError] = useState('')
  const [success, setSuccess] = useState(false)

  // Reset form quando hyperfocus mudar
  useEffect(() => {
    setTitle(hyperfocus.title)
    setDescription(hyperfocus.description || '')
    setColor(hyperfocus.color)
    setEstimatedTime(hyperfocus.estimated_time_minutes?.toString() || '')
  }, [hyperfocus])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLocalError('')
    setSuccess(false)

    // Validações
    if (!title.trim()) {
      setLocalError('O título é obrigatório')
      return
    }

    if (title.length < 3) {
      setLocalError('O título deve ter pelo menos 3 caracteres')
      return
    }

    if (title.length > 100) {
      setLocalError('O título deve ter no máximo 100 caracteres')
      return
    }

    const estimatedMinutes = estimatedTime ? parseInt(estimatedTime, 10) : undefined
    if (estimatedTime && (isNaN(estimatedMinutes!) || estimatedMinutes! <= 0)) {
      setLocalError('Tempo estimado deve ser um número positivo')
      return
    }

    // Atualizar hiperfoco
    const result = await updateHyperfocus(hyperfocus.id, {
      title: title.trim(),
      description: description.trim() || undefined,
      color: color as any,
      estimated_time_minutes: estimatedMinutes,
    })

    if (result) {
      setSuccess(true)
      
      // Callback de sucesso
      setTimeout(() => {
        if (onSuccess) {
          onSuccess()
        }
      }, 500)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Título */}
      <div className="space-y-2">
        <Label htmlFor="edit-title">
          Título <span className="text-red-500">*</span>
        </Label>
        <Input
          id="edit-title"
          placeholder="Ex: Dominar React e Next.js"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={loading}
          maxLength={100}
          autoFocus
        />
        <p className="text-xs text-muted-foreground">
          {title.length}/100 caracteres
        </p>
      </div>

      {/* Descrição */}
      <div className="space-y-2">
        <Label htmlFor="edit-description">Descrição (opcional)</Label>
        <Textarea
          id="edit-description"
          placeholder="Descreva o que você quer alcançar..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
          rows={3}
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground">
          {description.length}/500 caracteres
        </p>
      </div>

      {/* Cor */}
      <div className="space-y-2">
        <Label>Cor</Label>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {colors.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setColor(c.value)}
              disabled={loading}
              className={`
                relative w-10 h-10 rounded-full ${c.class}
                flex items-center justify-center
                transition-all duration-200
                hover:scale-110
                ${color === c.value 
                  ? 'ring-4 ring-purple-600 ring-offset-2 scale-110' 
                  : 'hover:ring-2 hover:ring-gray-300'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              title={c.label}
            >
              <span className="text-xl">{c.emoji}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tempo Estimado */}
      <div className="space-y-2">
        <Label htmlFor="edit-estimatedTime">Tempo Estimado (minutos)</Label>
        <Input
          id="edit-estimatedTime"
          type="number"
          placeholder="Ex: 60"
          value={estimatedTime}
          onChange={(e) => setEstimatedTime(e.target.value)}
          disabled={loading}
          min="1"
          max="9999"
        />
      </div>

      {/* Erro */}
      {(localError || error) && (
        <Alert variant="destructive">
          <AlertDescription>{localError || error}</AlertDescription>
        </Alert>
      )}

      {/* Sucesso */}
      {success && (
        <Alert className="border-green-600 bg-green-50 dark:bg-green-950/20">
          <AlertDescription className="text-green-600 dark:text-green-400">
            ✅ Hiperfoco atualizado com sucesso!
          </AlertDescription>
        </Alert>
      )}

      {/* Botões */}
      <div className="flex gap-2 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="flex-1"
          >
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          disabled={loading || !title.trim()}
          className="flex-1 bg-purple-600 hover:bg-purple-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar Alterações'
          )}
        </Button>
      </div>
    </form>
  )
}

