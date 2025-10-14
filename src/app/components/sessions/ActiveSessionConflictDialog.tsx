'use client'

/**
 * ActiveSessionConflictDialog Component
 * Dialog exibido quando usuário tenta criar sessão mas já existe uma ativa
 */

import { Database } from '@/types/database'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import { Button } from '@/app/components/ui/button'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { AlertTriangle, Play, StopCircle, Trash2 } from 'lucide-react'

type FocusSession = Database['public']['Tables']['focus_sessions']['Row']
type Hyperfocus = Database['public']['Tables']['hyperfocus']['Row']

interface ActiveSessionConflictDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeSession: FocusSession | null
  activeSessionHyperfocus: Hyperfocus | null
  newHyperfocus: Hyperfocus | null
  onContinueActive: () => void
  onFinishAndCreateNew: () => void
  onCancelAndCreateNew: () => void
}

export function ActiveSessionConflictDialog({
  open,
  onOpenChange,
  activeSession,
  activeSessionHyperfocus,
  newHyperfocus,
  onContinueActive,
  onFinishAndCreateNew,
  onCancelAndCreateNew,
}: ActiveSessionConflictDialogProps) {
  if (!activeSession || !activeSessionHyperfocus || !newHyperfocus) return null

  // Calcular tempo decorrido da sessão ativa
  const startedAt = new Date(activeSession.started_at)
  const now = new Date()
  const elapsedMinutes = Math.floor((now.getTime() - startedAt.getTime()) / 1000 / 60)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Sessão de Foco Ativa
          </DialogTitle>
          <DialogDescription>
            Você já tem uma sessão de foco em andamento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Sessão Ativa Atual */}
          <Alert>
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-semibold">Sessão Ativa:</div>
                <div className="text-sm">
                  <div>📍 <strong>{activeSessionHyperfocus.title}</strong></div>
                  <div className="text-muted-foreground mt-1">
                    ⏱️ {elapsedMinutes} min de {activeSession.planned_duration_minutes} min
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Nova Sessão Desejada */}
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-sm">
              <div className="font-semibold mb-1">Você quer iniciar:</div>
              <div>🎯 <strong>{newHyperfocus.title}</strong></div>
            </div>
          </div>

          {/* Explicação */}
          <p className="text-sm text-muted-foreground">
            Escolha uma das opções abaixo para continuar:
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          {/* Continuar sessão ativa */}
          <Button
            onClick={() => {
              onContinueActive()
              onOpenChange(false)
            }}
            variant="outline"
            className="w-full"
          >
            <Play className="w-4 h-4 mr-2" />
            Continuar Sessão Atual
          </Button>

          {/* Finalizar como completa e criar nova */}
          <Button
            onClick={() => {
              onFinishAndCreateNew()
              onOpenChange(false)
            }}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <StopCircle className="w-4 h-4 mr-2" />
            Finalizar Completa e Iniciar Nova
          </Button>

          {/* Cancelar/Interromper e criar nova */}
          <Button
            onClick={() => {
              onCancelAndCreateNew()
              onOpenChange(false)
            }}
            variant="destructive"
            className="w-full"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Cancelar Sessão Atual e Iniciar Nova
          </Button>

          {/* Cancelar tudo */}
          <Button
            onClick={() => onOpenChange(false)}
            variant="ghost"
            className="w-full"
          >
            Voltar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}



