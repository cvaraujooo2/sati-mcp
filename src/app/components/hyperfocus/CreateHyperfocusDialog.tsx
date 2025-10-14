'use client'

/**
 * CreateHyperfocusDialog Component
 * Dialog para criar novo hiperfoco
 */

import { useState, FormEvent } from 'react'
import { useAuth } from '@/lib/hooks'
import { useHyperfocus } from '@/lib/hooks/useHyperfocus'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Textarea } from '@/app/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/app/components/ui/alert'

interface CreateHyperfocusDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
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

export function CreateHyperfocusDialog({ open, onOpenChange, onSuccess }: CreateHyperfocusDialogProps) {
  const { user } = useAuth()
  const { createHyperfocus, loading, error } = useHyperfocus(user?.id || '')
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState<string>('purple')
  const [estimatedTime, setEstimatedTime] = useState('')
  const [localError, setLocalError] = useState('')
  const [success, setSuccess] = useState(false)

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

    // Criar hiperfoco
    const result = await createHyperfocus({
      title: title.trim(),
      description: description.trim() || undefined,
      color: color as any,
      estimated_time_minutes: estimatedMinutes,
    })

    if (result) {
      setSuccess(true)
      
      // Resetar formulário
      setTimeout(() => {
        setTitle('')
        setDescription('')
        setColor('purple')
        setEstimatedTime('')
        setSuccess(false)
        onOpenChange(false)
        
        // Callback de sucesso
        if (onSuccess) {
          onSuccess()
        }
      }, 1000)
    }
  }

  const handleCancel = () => {
    setTitle('')
    setDescription('')
    setColor('purple')
    setEstimatedTime('')
    setLocalError('')
    setSuccess(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Criar Novo Hiperfoco</DialogTitle>
            <DialogDescription>
              Defina um projeto ou interesse de alto impacto para organizar seu tempo e energia.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Título <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
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
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
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
              <Label htmlFor="estimatedTime">Tempo Estimado (minutos)</Label>
              <Input
                id="estimatedTime"
                type="number"
                placeholder="Ex: 60"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
                disabled={loading}
                min="1"
                max="9999"
              />
              <p className="text-xs text-muted-foreground">
                Quanto tempo você estima para este projeto?
              </p>
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
                  ✅ Hiperfoco criado com sucesso!
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !title.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Hiperfoco'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

