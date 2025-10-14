'use client'

/**
 * FocusTimerModal Component
 * Modal fullscreen para exibir o timer de foco
 */

import { Database } from '@/types/database'
import { Dialog, DialogContent } from '@/app/components/ui/dialog'
import { FocusTimer } from './FocusTimer'
import { SessionManagementMenu } from './sessions/SessionManagementMenu'
import { useAuth } from '@/lib/hooks/useAuth'
import { useFocusSession } from '@/lib/hooks/useFocusSession'
import { X } from 'lucide-react'
import { Button } from '@/app/components/ui/button'

type FocusSession = Database['public']['Tables']['focus_sessions']['Row']
type Hyperfocus = Database['public']['Tables']['hyperfocus']['Row']

interface FocusTimerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: FocusSession | null
  hyperfocus: Hyperfocus | null
  onSessionUpdate?: () => void
}

export function FocusTimerModal({
  open,
  onOpenChange,
  session,
  hyperfocus,
  onSessionUpdate,
}: FocusTimerModalProps) {
  const { user } = useAuth()
  const { 
    pauseSession, 
    addSessionNote, 
    deleteSession, 
    updateSessionDuration 
  } = useFocusSession(user?.id || '')

  if (!session || !hyperfocus) return null

  // Calcular endsAt com base em started_at + duration
  const startedAt = new Date(session.started_at)
  const endsAt = new Date(startedAt.getTime() + session.planned_duration_minutes * 60 * 1000)

  const timerProps = {
    sessionId: session.id,
    hyperfocus: {
      id: hyperfocus.id,
      title: hyperfocus.title,
      color: hyperfocus.color || 'blue',
    },
    durationMinutes: session.planned_duration_minutes,
    startedAt: session.started_at,
    endsAt: endsAt.toISOString(),
    status: 'active' as const,
    playSound: true,
    alarmSound: 'gentle-bell' as const,
    gentleEnd: true,
  }

  // Handlers de gerenciamento da sessão
  const handlePause = async () => {
    const success = await pauseSession(session.id)
    if (success) {
      onSessionUpdate?.()
      onOpenChange(false)
    }
  }

  const handleAddNote = async (note: string) => {
    await addSessionNote(session.id, note)
    onSessionUpdate?.()
  }

  const handleDelete = async () => {
    const success = await deleteSession(session.id)
    if (success) {
      onSessionUpdate?.()
      onOpenChange(false)
    }
  }

  const handleExtendTime = async (minutes: number) => {
    const newDuration = session.planned_duration_minutes + minutes
    await updateSessionDuration(session.id, newDuration)
    onSessionUpdate?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[100vw] w-full h-screen p-0 gap-0 bg-background border-0">
        {/* Header com botões de ação */}
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
          {/* Menu de Gerenciamento */}
          <div className="bg-background/80 backdrop-blur-sm rounded-full shadow-lg">
            <SessionManagementMenu
              sessionId={session.id}
              currentNote={session.notes}
              onPause={handlePause}
              onAddNote={handleAddNote}
              onDelete={handleDelete}
              onExtendTime={handleExtendTime}
            />
          </div>

          {/* Botão Fechar */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="rounded-full bg-background/80 backdrop-blur-sm hover:bg-background shadow-lg"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Timer centralizado */}
        <div className="w-full h-full flex items-center justify-center p-4 md:p-8">
          <div className="w-full max-w-2xl">
            <FocusTimer {...timerProps} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

