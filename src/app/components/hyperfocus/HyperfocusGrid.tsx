'use client'

/**
 * HyperfocusGrid Component
 * Grid responsivo para exibir cards de hiperfocos
 */

import { useState, useEffect } from 'react'
import { Database } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { 
  Zap, 
  Clock, 
  CheckCircle, 
  RefreshCw, 
  MoreVertical,
  Play,
  Edit,
  Archive,
  Trash2
} from 'lucide-react'
import { Loader2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu'
import { HyperfocusDetailDrawer } from './HyperfocusDetailDrawer'

type Hyperfocus = Database['public']['Tables']['hyperfocus']['Row']

interface HyperfocusGridProps {
  hyperfocuses: Hyperfocus[]
  loading: boolean
  error: string | null
  onRefresh: () => void
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

export function HyperfocusGrid({ hyperfocuses, loading, error, onRefresh }: HyperfocusGridProps) {
  const [selectedHyperfocus, setSelectedHyperfocus] = useState<Hyperfocus | null>(null)
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [taskCounts, setTaskCounts] = useState<Record<string, { total: number; completed: number }>>({})

  // Buscar contagem de tarefas para cada hiperfoco
  useEffect(() => {
    const fetchTaskCounts = async () => {
      if (hyperfocuses.length === 0) return

      const supabase = createClient()
      const counts: Record<string, { total: number; completed: number }> = {}

      // Buscar tarefas para cada hiperfoco
      for (const hyperfocus of hyperfocuses) {
        try {
          const { data: tasks, error } = await supabase
            .from('tasks')
            .select('id, completed')
            .eq('hyperfocus_id', hyperfocus.id)

          if (!error && tasks) {
            counts[hyperfocus.id] = {
              total: tasks.length,
              completed: tasks.filter(t => t.completed).length,
            }
          } else {
            counts[hyperfocus.id] = { total: 0, completed: 0 }
          }
        } catch (err) {
          console.error(`Error fetching tasks for hyperfocus ${hyperfocus.id}:`, err)
          counts[hyperfocus.id] = { total: 0, completed: 0 }
        }
      }

      setTaskCounts(counts)
    }

    fetchTaskCounts()
  }, [hyperfocuses])

  // Loading state
  if (loading && hyperfocuses.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className="border-red-200 dark:border-red-800">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="text-4xl">⚠️</div>
            <div>
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
                Erro ao carregar hiperfocos
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {error}
              </p>
            </div>
            <Button onClick={onRefresh} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Empty state
  if (hyperfocuses.length === 0) {
    return (
      <Card>
        <CardContent className="pt-12 pb-12">
          <div className="text-center space-y-4">
            <div className="text-6xl">🎯</div>
            <div>
              <h3 className="text-xl font-semibold">
                Nenhum hiperfoco criado ainda
              </h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                Comece criando seu primeiro hiperfoco para organizar seus interesses 
                e projetos de alto impacto!
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
              <Button
                onClick={() => {
                  // O botão "Novo Hiperfoco" no header já abre o dialog
                  const createButton = document.querySelector('button:has(svg + *:contains("Novo Hiperfoco"))') as HTMLButtonElement
                  createButton?.click()
                }}
                size="lg"
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Zap className="w-5 h-5 mr-2" />
                Criar Primeiro Hiperfoco
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Grid with cards
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {hyperfocuses.map((hyperfocus) => {
        const colorClass = colorClasses[hyperfocus.color as keyof typeof colorClasses] || colorClasses.blue
        
        return (
          <Card
            key={hyperfocus.id}
            className="group hover:shadow-lg transition-all duration-200 cursor-pointer relative"
            onClick={() => {
              setSelectedHyperfocus(hyperfocus)
              setDetailDrawerOpen(true)
            }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`w-3 h-3 rounded-full ${colorClass} mt-1.5 flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">
                      {hyperfocus.title}
                    </CardTitle>
                    {hyperfocus.description && (
                      <CardDescription className="line-clamp-2 mt-1">
                        {hyperfocus.description}
                      </CardDescription>
                    )}
                  </div>
                </div>

                {/* Menu de ações */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation()
                      setSelectedHyperfocus(hyperfocus)
                      setDetailDrawerOpen(true)
                    }}>
                      <Play className="w-4 h-4 mr-2" />
                      Iniciar Foco
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation()
                      setSelectedHyperfocus(hyperfocus)
                      setDetailDrawerOpen(true)
                    }}>
                      <Edit className="w-4 h-4 mr-2" />
                      Ver Detalhes
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation()
                      setSelectedHyperfocus(hyperfocus)
                      setDetailDrawerOpen(true)
                    }}>
                      <Archive className="w-4 h-4 mr-2" />
                      {hyperfocus.archived ? 'Desarquivar' : 'Arquivar'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedHyperfocus(hyperfocus)
                        setDetailDrawerOpen(true)
                      }}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Deletar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Metadados */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {hyperfocus.estimated_time_minutes && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>{hyperfocus.estimated_time_minutes} min</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    {taskCounts[hyperfocus.id]
                      ? `${taskCounts[hyperfocus.id].completed}/${taskCounts[hyperfocus.id].total} tarefas`
                      : '0 tarefas'}
                  </span>
                </div>
              </div>

              {/* Status badges */}
              <div className="flex flex-wrap gap-2">
                {!hyperfocus.archived && (
                  <Badge variant="secondary" className="text-xs">
                    Ativo
                  </Badge>
                )}
                {hyperfocus.archived && (
                  <Badge variant="outline" className="text-xs">
                    Arquivado
                  </Badge>
                )}
              </div>

              {/* Botão de ação rápida */}
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedHyperfocus(hyperfocus)
                  setDetailDrawerOpen(true)
                }}
                className="w-full mt-2 bg-purple-600 hover:bg-purple-700 opacity-0 group-hover:opacity-100 transition-opacity"
                size="sm"
              >
                <Play className="w-4 h-4 mr-2" />
                Iniciar Foco
              </Button>
            </CardContent>
          </Card>
        )
      })}

      {/* Detail Drawer */}
      <HyperfocusDetailDrawer
        hyperfocus={selectedHyperfocus}
        open={detailDrawerOpen}
        onOpenChange={setDetailDrawerOpen}
        onUpdate={() => {
          onRefresh()
          setDetailDrawerOpen(false)
        }}
      />
    </div>
  )
}

