'use client'

/**
 * TaskList Component  
 * Lista de tarefas de um hiperfoco com checkboxes
 */

import { Database } from '@/types/database'
import { Button } from '@/app/components/ui/button'
import { Checkbox } from '@/app/components/ui/checkbox'
import { Badge } from '@/app/components/ui/badge'
import {
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  Loader2,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Task = Database['public']['Tables']['tasks']['Row']

interface TaskListProps {
  tasks: Task[]
  loading: boolean
  onToggle: (taskId: string) => void
  onDelete: (taskId: string) => void
  onCreateClick: () => void
}

export function TaskList({
  tasks,
  loading,
  onToggle,
  onDelete,
  onCreateClick,
}: TaskListProps) {
  // Calcular estatísticas
  const total = tasks.length
  const completed = tasks.filter((t) => t.completed).length
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

  if (loading && tasks.length === 0) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 animate-pulse">
            <div className="w-5 h-5 rounded bg-muted" />
            <div className="flex-1">
              <div className="h-4 bg-muted rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header com estatísticas */}
      {total > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {completed} de {total} concluídas
            </span>
          </div>
          {completionRate > 0 && (
            <Badge variant="secondary" className="text-xs">
              {completionRate}%
            </Badge>
          )}
        </div>
      )}

      {/* Barra de progresso */}
      {total > 0 && (
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      )}

      {/* Lista de tarefas */}
      <div className="space-y-2">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Circle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Nenhuma tarefa criada ainda</p>
            <p className="text-xs mt-1">Clique no botão abaixo para adicionar</p>
          </div>
        ) : (
          tasks.map((task, index) => (
            <TaskItem
              key={task.id}
              task={task}
              index={index}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          ))
        )}
      </div>

      {/* Botão adicionar tarefa */}
      <Button
        onClick={onCreateClick}
        variant="outline"
        className="w-full"
        size="sm"
      >
        <Plus className="w-4 h-4 mr-2" />
        Adicionar Tarefa
      </Button>
    </div>
  )
}

// Componente para item individual de tarefa
function TaskItem({
  task,
  index,
  onToggle,
  onDelete,
}: {
  task: Task
  index: number
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <div
      className={cn(
        'group flex items-start gap-3 p-3 rounded-lg transition-colors',
        'hover:bg-muted/50',
        task.completed && 'opacity-60'
      )}
    >
      {/* Checkbox */}
      <Checkbox
        checked={!!task.completed}
        onCheckedChange={() => onToggle(task.id)}
        className="mt-0.5"
      />

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p
              className={cn(
                'text-sm font-medium',
                task.completed && 'line-through text-muted-foreground'
              )}
            >
              {index + 1}. {task.title}
            </p>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {task.description}
              </p>
            )}
          </div>

          {/* Botão deletar (aparece no hover) */}
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
            onClick={() => onDelete(task.id)}
          >
            <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
          </Button>
        </div>

        {/* Metadados */}
        {task.estimated_minutes && (
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{task.estimated_minutes} min</span>
          </div>
        )}
      </div>
    </div>
  )
}

