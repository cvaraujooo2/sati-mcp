'use client'

/**
 * SessionCard Component
 * Card individual para uma sessão de foco
 */

import { useState } from 'react'
import { FocusSessionWithHyperfocus } from '@/lib/supabase/queries'
import { Card, CardContent } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import { Textarea } from '@/app/components/ui/textarea'
import { Label } from '@/app/components/ui/label'
import { Clock, Target, Calendar, MoreVertical, FileText, Trash2, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SessionCardProps {
  session: FocusSessionWithHyperfocus
  onAddNote?: (sessionId: string, note: string) => Promise<void>
  onDelete?: (sessionId: string) => Promise<void>
}

const colorClasses = {
  red: 'bg-red-500',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  orange: 'bg-orange-500',
  purple: 'bg-purple-500',
  pink: 'bg-pink-500',
  brown: 'bg-amber-700',
  gray: 'bg-gray-500',
} as const

export function SessionCard({ session, onAddNote, onDelete }: SessionCardProps) {
  const [showNoteDialog, setShowNoteDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [note, setNote] = useState(session.notes || '')
  const [loading, setLoading] = useState(false)

  const colorClass = colorClasses[session.hyperfocus.color as keyof typeof colorClasses] || colorClasses.blue

  const handleSaveNote = async () => {
    if (!onAddNote) return
    setLoading(true)
    try {
      await onAddNote(session.id, note)
      setShowNoteDialog(false)
    } catch (error) {
      console.error('Error saving note:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    setLoading(true)
    try {
      await onDelete(session.id)
      setShowDeleteDialog(false)
    } catch (error) {
      console.error('Error deleting session:', error)
    } finally {
      setLoading(false)
    }
  }

  // Formato de data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const isYesterday = date.toDateString() === yesterday.toDateString()

    const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

    if (isToday) {
      return `Hoje às ${timeStr}`
    } else if (isYesterday) {
      return `Ontem às ${timeStr}`
    } else {
      return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  // Formato de duração
  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '0min'
    if (minutes < 60) return `${minutes}min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
  }

  const isCompleted = session.ended_at && !session.interrupted
  const isInterrupted = session.interrupted
  const isActive = !session.ended_at

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          {/* Header com título e cor */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className={`w-3 h-3 rounded-full ${colorClass} mt-1.5 flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{session.hyperfocus.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  {formatDate(session.started_at)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Badge de status */}
              {isActive && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  Ativa
                </Badge>
              )}
              {isCompleted && (
                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                  Completa
                </Badge>
              )}
              {isInterrupted && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                  Interrompida
                </Badge>
              )}

              {/* Menu de ações (apenas para sessões finalizadas) */}
              {!isActive && (onAddNote || onDelete) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onAddNote && (
                      <DropdownMenuItem onClick={() => setShowNoteDialog(true)}>
                        <FileText className="mr-2 h-4 w-4" />
                        {session.notes ? 'Editar Nota' : 'Adicionar Nota'}
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => setShowDeleteDialog(true)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Deletar
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

        {/* Duração planejada vs real */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Target className="w-4 h-4" />
            <span>{formatDuration(session.planned_duration_minutes)}</span>
          </div>
          
          {session.actual_duration_minutes && (
            <>
              <span className="text-muted-foreground">→</span>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span className={cn(
                  "font-medium",
                  isCompleted && "text-green-600 dark:text-green-400",
                  isInterrupted && "text-yellow-600 dark:text-yellow-400"
                )}>
                  {formatDuration(session.actual_duration_minutes)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Barra de progresso para sessões completas */}
        {session.actual_duration_minutes && session.planned_duration_minutes && (
          <div className="mt-3">
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all",
                  isCompleted && "bg-green-500",
                  isInterrupted && "bg-yellow-500"
                )}
                style={{
                  width: `${Math.min(100, (session.actual_duration_minutes / session.planned_duration_minutes) * 100)}%`
                }}
              />
            </div>
          </div>
        )}

        {/* Nota (se existir) */}
        {session.notes && (
          <div className="mt-3 p-2 bg-muted/50 rounded text-xs">
            <div className="flex items-start gap-1.5">
              <FileText className="w-3 h-3 mt-0.5 text-muted-foreground" />
              <p className="text-muted-foreground line-clamp-2">{session.notes}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>

      {/* Dialog de Nota */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {session.notes ? 'Editar Nota' : 'Adicionar Nota'}
            </DialogTitle>
            <DialogDescription>
              Adicione observações sobre esta sessão de foco
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="note">Nota</Label>
              <Textarea
                id="note"
                placeholder="Ex: Consegui terminar o primeiro capítulo..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={5}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoteDialog(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSaveNote} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Nota'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Deletar Sessão
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar esta sessão? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? 'Deletando...' : 'Deletar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}



