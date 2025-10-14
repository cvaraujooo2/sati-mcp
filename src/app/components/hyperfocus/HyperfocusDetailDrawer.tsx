'use client'

/**
 * HyperfocusDetailDrawer Component
 * Drawer para mostrar detalhes completos de um hiperfoco
 */

import { useState, useEffect } from 'react'
import { Database } from '@/types/database'
import { useAuth } from '@/lib/hooks'
import { useHyperfocus } from '@/lib/hooks/useHyperfocus'
import { useFocusSession } from '@/lib/hooks/useFocusSession'
import { useTasks } from '@/lib/hooks/useTasks'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/app/components/ui/sheet'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { Separator } from '@/app/components/ui/separator'
import {
  Play,
  Edit,
  Archive,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { EditHyperfocusForm } from './EditHyperfocusForm'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import { TaskList } from '@/app/components/tasks/TaskList'
import { CreateTaskDialog } from '@/app/components/tasks/CreateTaskDialog'
import { FocusTimerModal } from '@/app/components/FocusTimerModal'
import { ActiveSessionConflictDialog } from '@/app/components/sessions/ActiveSessionConflictDialog'

type Hyperfocus = Database['public']['Tables']['hyperfocus']['Row']
type FocusSession = Database['public']['Tables']['focus_sessions']['Row']

interface HyperfocusDetailDrawerProps {
  hyperfocus: Hyperfocus | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate?: () => void
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

export function HyperfocusDetailDrawer({
  hyperfocus,
  open,
  onOpenChange,
  onUpdate,
}: HyperfocusDetailDrawerProps) {
  const { user } = useAuth()
  const { updateHyperfocus, deleteHyperfocus, loading, error } = useHyperfocus(user?.id || '')
  const { hyperfocusList, loadHyperfocusList } = useHyperfocus(user?.id || '')
  const { startSession, endSession, getActiveSessionForHyperfocus } = useFocusSession(user?.id || '')
  const { tasks, loading: tasksLoading, error: tasksError, loadTasks, createTask, toggleTaskComplete, deleteTask } = useTasks(user?.id || '')
  
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [showTimerModal, setShowTimerModal] = useState(false)
  const [showConflictDialog, setShowConflictDialog] = useState(false)
  const [activeSession, setActiveSession] = useState<FocusSession | null>(null)
  const [conflictSession, setConflictSession] = useState<FocusSession | null>(null)
  const [conflictHyperfocus, setConflictHyperfocus] = useState<Hyperfocus | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  // Carregar tarefas e hiperfocos quando o drawer abre
  useEffect(() => {
    if (open && hyperfocus?.id) {
      loadTasks(hyperfocus.id)
      loadHyperfocusList()
    }
  }, [open, hyperfocus?.id, loadTasks, loadHyperfocusList])

  if (!hyperfocus) return null

  const colorClass = colorClasses[hyperfocus.color as keyof typeof colorClasses] || colorClasses.blue

  const handleStartFocus = async () => {
    if (!hyperfocus.id) return
    
    setActionLoading(true)
    setActionError(null)

    try {
      // Verificar se já existe sessão ativa para este hiperfoco
      const existingSession = await getActiveSessionForHyperfocus(hyperfocus.id)
      
      if (existingSession) {
        // Já há sessão ativa, mostrar dialog de conflito
        setConflictSession(existingSession)
        setConflictHyperfocus(hyperfocus)
        setShowConflictDialog(true)
        setActionLoading(false)
        return
      }

      // Não há sessão ativa, criar nova normalmente
      const duration = hyperfocus.estimated_time_minutes || 25
      const session = await startSession(hyperfocus.id, duration)
      
      if (session) {
        console.log('Sessão iniciada:', session.id)
        setActiveSession(session)
        setShowTimerModal(true)
        onOpenChange(false) // Fecha o drawer
      } else {
        setActionError('Falha ao iniciar sessão de foco')
      }
    } catch (err: any) {
      // Se erro for de sessão ativa, pode ser que outra sessão foi criada entre o check
      if (err?.message?.includes('sessão de foco ativa')) {
        setActionError('Já existe uma sessão ativa. Por favor, finalize-a primeiro.')
      } else {
        setActionError('Erro ao iniciar timer')
      }
      console.error(err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleArchive = async () => {
    if (!hyperfocus.id) return
    
    setActionLoading(true)
    setActionError(null)

    try {
      const result = await updateHyperfocus(hyperfocus.id, {
        archived: !hyperfocus.archived,
      })
      
      if (result) {
        onUpdate?.()
        onOpenChange(false)
      }
    } catch (err) {
      setActionError('Erro ao arquivar hiperfoco')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!hyperfocus.id) return
    
    setActionLoading(true)
    setActionError(null)

    try {
      const success = await deleteHyperfocus(hyperfocus.id)
      
      if (success) {
        onUpdate?.()
        setShowDeleteConfirm(false)
        onOpenChange(false)
      }
    } catch (err) {
      setActionError('Erro ao deletar hiperfoco')
    } finally {
      setActionLoading(false)
    }
  }

  const handleEditSuccess = () => {
    setIsEditing(false)
    onUpdate?.()
  }

  // Handlers para dialog de conflito de sessão
  const handleContinueActiveSession = () => {
    if (conflictSession) {
      setActiveSession(conflictSession)
      setShowTimerModal(true)
      setShowConflictDialog(false)
      onOpenChange(false)
    }
  }

  const handleFinishAndCreateNew = async () => {
    if (!conflictSession || !hyperfocus.id) return

    setActionLoading(true)
    try {
      // Finalizar sessão atual como completa
      await endSession(conflictSession.id, true)

      // Criar nova sessão
      const duration = hyperfocus.estimated_time_minutes || 25
      const newSession = await startSession(hyperfocus.id, duration)

      if (newSession) {
        setActiveSession(newSession)
        setShowTimerModal(true)
        setShowConflictDialog(false)
        onOpenChange(false)
      }
    } catch (err) {
      setActionError('Erro ao finalizar sessão e criar nova')
      console.error(err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelAndCreateNew = async () => {
    if (!conflictSession || !hyperfocus.id) return

    setActionLoading(true)
    try {
      // Cancelar/interromper sessão atual
      await endSession(conflictSession.id, false)

      // Criar nova sessão
      const duration = hyperfocus.estimated_time_minutes || 25
      const newSession = await startSession(hyperfocus.id, duration)

      if (newSession) {
        setActiveSession(newSession)
        setShowTimerModal(true)
        setShowConflictDialog(false)
        onOpenChange(false)
      }
    } catch (err) {
      setActionError('Erro ao cancelar sessão e criar nova')
      console.error(err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreateTask = async (data: { title: string; description?: string; estimated_minutes?: number }) => {
    if (!hyperfocus?.id) return

    await createTask({
      hyperfocus_id: hyperfocus.id,
      ...data,
    })
  }

  const handleToggleTask = async (taskId: string) => {
    await toggleTaskComplete(taskId)
  }

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Tem certeza que deseja deletar esta tarefa?')) {
      await deleteTask(taskId)
    }
  }

  // Calcular estatísticas de tarefas
  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    totalTime: tasks.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0),
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <div className="flex items-start gap-3">
              <div className={`w-4 h-4 rounded-full ${colorClass} mt-1 flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-xl">{hyperfocus.title}</SheetTitle>
                {hyperfocus.description && (
                  <SheetDescription className="mt-2 text-sm">
                    {hyperfocus.description}
                  </SheetDescription>
                )}
              </div>
            </div>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Status badges */}
            <div className="flex flex-wrap gap-2">
              {!hyperfocus.archived ? (
                <Badge variant="secondary">Ativo</Badge>
              ) : (
                <Badge variant="outline">Arquivado</Badge>
              )}
              {hyperfocus.estimated_time_minutes && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {hyperfocus.estimated_time_minutes} min
                </Badge>
              )}
            </div>

            <Separator />

            {/* Metadados */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Informações</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Criado em:</span>
                  <span>{new Date(hyperfocus.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tarefas:</span>
                  <span>{taskStats.completed} de {taskStats.total} concluídas</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tempo estimado:</span>
                  <span>{Math.floor(taskStats.totalTime / 60)}h {taskStats.totalTime % 60}m</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Tarefas */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Tarefas
              </h3>
              <TaskList
                tasks={tasks}
                loading={tasksLoading}
                onToggle={handleToggleTask}
                onDelete={handleDeleteTask}
                onCreateClick={() => setShowCreateTask(true)}
              />
            </div>

            <Separator />

            {/* Error messages */}
            {(actionError || error || tasksError) && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{actionError || error || tasksError}</AlertDescription>
              </Alert>
            )}

            {/* Ações principais */}
            <div className="space-y-2">
              {!hyperfocus.archived && (
                <Button
                  onClick={handleStartFocus}
                  disabled={actionLoading || loading}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  size="lg"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Iniciando...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Iniciar Timer de Foco
                    </>
                  )}
                </Button>
              )}

              <Button
                onClick={() => setIsEditing(true)}
                disabled={actionLoading || loading}
                variant="outline"
                className="w-full"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar Hiperfoco
              </Button>

              <Button
                onClick={handleArchive}
                disabled={actionLoading || loading}
                variant="outline"
                className="w-full"
              >
                <Archive className="w-4 h-4 mr-2" />
                {hyperfocus.archived ? 'Desarquivar' : 'Arquivar'}
              </Button>

              <Button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={actionLoading || loading}
                variant="destructive"
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Deletar Hiperfoco
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialog de Edição */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Hiperfoco</DialogTitle>
            <DialogDescription>
              Atualize as informações do seu hiperfoco
            </DialogDescription>
          </DialogHeader>
          <EditHyperfocusForm
            hyperfocus={hyperfocus}
            onSuccess={handleEditSuccess}
            onCancel={() => setIsEditing(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Deleção */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Deleção</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar o hiperfoco "{hyperfocus.title}"? 
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={actionLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deletando...
                </>
              ) : (
                'Deletar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Criação de Tarefa */}
      <CreateTaskDialog
        open={showCreateTask}
        onOpenChange={setShowCreateTask}
        onSubmit={handleCreateTask}
        loading={tasksLoading}
        error={tasksError}
      />

      {/* Modal do Timer de Foco */}
      <FocusTimerModal
        open={showTimerModal}
        onOpenChange={(open) => {
          setShowTimerModal(open)
          if (!open) {
            setActiveSession(null)
            onUpdate?.() // Atualiza dados após fechar o timer
          }
        }}
        session={activeSession}
        hyperfocus={hyperfocus}
        onSessionUpdate={onUpdate}
      />

      {/* Dialog de Conflito de Sessão Ativa */}
      <ActiveSessionConflictDialog
        open={showConflictDialog}
        onOpenChange={setShowConflictDialog}
        activeSession={conflictSession}
        activeSessionHyperfocus={conflictHyperfocus}
        newHyperfocus={hyperfocus}
        onContinueActive={handleContinueActiveSession}
        onFinishAndCreateNew={handleFinishAndCreateNew}
        onCancelAndCreateNew={handleCancelAndCreateNew}
      />
    </>
  )
}

