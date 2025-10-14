'use client'

/**
 * CreateTaskDialog Component
 * Dialog para criar nova tarefa
 */

import { useState, FormEvent } from 'react'
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

interface CreateTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { title: string; description?: string; estimated_minutes?: number }) => Promise<void>
  loading?: boolean
  error?: string | null
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  onSubmit,
  loading,
  error,
}: CreateTaskDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [estimatedMinutes, setEstimatedMinutes] = useState('')
  const [localError, setLocalError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLocalError('')

    // Validações
    if (!title.trim()) {
      setLocalError('O título é obrigatório')
      return
    }

    if (title.length < 2) {
      setLocalError('O título deve ter pelo menos 2 caracteres')
      return
    }

    if (title.length > 200) {
      setLocalError('O título deve ter no máximo 200 caracteres')
      return
    }

    const minutes = estimatedMinutes ? parseInt(estimatedMinutes, 10) : undefined
    if (estimatedMinutes && (isNaN(minutes!) || minutes! <= 0)) {
      setLocalError('Tempo estimado deve ser um número positivo')
      return
    }

    // Chamar callback
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        estimated_minutes: minutes,
      })

      // Limpar formulário após sucesso
      setTitle('')
      setDescription('')
      setEstimatedMinutes('')
      onOpenChange(false)
    } catch (err) {
      // Erro tratado pelo componente pai
    }
  }

  const handleCancel = () => {
    setTitle('')
    setDescription('')
    setEstimatedMinutes('')
    setLocalError('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Criar Nova Tarefa</DialogTitle>
            <DialogDescription>
              Adicione uma tarefa ao seu hiperfoco para organizar o trabalho
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="task-title">
                Título <span className="text-red-500">*</span>
              </Label>
              <Input
                id="task-title"
                placeholder="Ex: Estudar componentes React"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
                maxLength={200}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                {title.length}/200 caracteres
              </p>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="task-description">Descrição (opcional)</Label>
              <Textarea
                id="task-description"
                placeholder="Detalhes sobre a tarefa..."
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

            {/* Tempo Estimado */}
            <div className="space-y-2">
              <Label htmlFor="task-time">Tempo Estimado (minutos)</Label>
              <Input
                id="task-time"
                type="number"
                placeholder="Ex: 30"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
                disabled={loading}
                min="1"
                max="9999"
              />
              <p className="text-xs text-muted-foreground">
                Quanto tempo você estima para esta tarefa?
              </p>
            </div>

            {/* Erro */}
            {(localError || error) && (
              <Alert variant="destructive">
                <AlertDescription>{localError || error}</AlertDescription>
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
                'Criar Tarefa'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

