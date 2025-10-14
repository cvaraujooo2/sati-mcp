'use client'

/**
 * HyperfocusSessionsTab Component
 * Tab para visualizar sessões de um hiperfoco específico
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks'
import { useFocusSession } from '@/lib/hooks/useFocusSession'
import { useHyperfocus } from '@/lib/hooks/useHyperfocus'
import { SessionFilters as Filters } from '@/lib/supabase/queries'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import { SessionStats } from './SessionStats'
import { SessionFilters } from './SessionFilters'
import { SessionList } from './SessionList'
import { Target } from 'lucide-react'

export function HyperfocusSessionsTab() {
  const { user } = useAuth()
  const { hyperfocusList, loading: hyperfocusLoading, loadHyperfocusList } = useHyperfocus(user?.id || '')
  const {
    sessions,
    loading: sessionsLoading,
    error,
    statistics,
    listSessionsByHyperfocus,
    addSessionNote,
    deleteSession,
  } = useFocusSession(user?.id || '')

  const [selectedHyperfocusId, setSelectedHyperfocusId] = useState<string>('')
  const [filters, setFilters] = useState<Filters>({
    period: 'all',
    status: 'all',
    sortBy: 'recent',
  })

  // Carregar hiperfocos ao montar
  useEffect(() => {
    if (user?.id) {
      loadHyperfocusList()
    }
  }, [user?.id, loadHyperfocusList])

  // Selecionar primeiro hiperfoco automaticamente
  useEffect(() => {
    if (hyperfocusList.length > 0 && !selectedHyperfocusId) {
      setSelectedHyperfocusId(hyperfocusList[0].id)
    }
  }, [hyperfocusList, selectedHyperfocusId])

  // Carregar sessões quando hiperfoco ou filtros mudam
  useEffect(() => {
    if (selectedHyperfocusId) {
      listSessionsByHyperfocus(selectedHyperfocusId, filters)
    }
  }, [selectedHyperfocusId, filters, listSessionsByHyperfocus])

  const handleHyperfocusChange = (value: string) => {
    setSelectedHyperfocusId(value)
  }

  const handleFiltersChange = (newFilters: Filters) => {
    setFilters(newFilters)
  }

  const handleRetry = () => {
    if (selectedHyperfocusId) {
      listSessionsByHyperfocus(selectedHyperfocusId, filters)
    }
  }

  const handleAddNote = async (sessionId: string, note: string) => {
    await addSessionNote(sessionId, note)
    // Recarregar lista após adicionar nota
    if (selectedHyperfocusId) {
      listSessionsByHyperfocus(selectedHyperfocusId, filters)
    }
  }

  const handleDelete = async (sessionId: string) => {
    await deleteSession(sessionId)
    // Lista será atualizada automaticamente pelo hook
  }

  const selectedHyperfocus = hyperfocusList.find(h => h.id === selectedHyperfocusId)

  return (
    <div className="space-y-6">
      {/* Seletor de Hiperfoco */}
      <div>
        <label className="text-sm font-medium mb-2 block">Selecione um Hiperfoco</label>
        {hyperfocusLoading ? (
          <div className="h-10 bg-muted rounded-md animate-pulse" />
        ) : hyperfocusList.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Nenhum hiperfoco criado ainda</p>
            <p className="text-xs mt-1">Crie um hiperfoco para começar</p>
          </div>
        ) : (
          <Select value={selectedHyperfocusId} onValueChange={handleHyperfocusChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione um hiperfoco" />
            </SelectTrigger>
            <SelectContent>
              {hyperfocusList.map((hyperfocus) => (
                <SelectItem key={hyperfocus.id} value={hyperfocus.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className={`w-3 h-3 rounded-full`}
                      style={{ backgroundColor: hyperfocus.color || '#3b82f6' }}
                    />
                    <span>{hyperfocus.title}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Conteúdo apenas se um hiperfoco está selecionado */}
      {selectedHyperfocusId && selectedHyperfocus && (
        <>
          {/* Estatísticas */}
          <div>
            <h3 className="text-lg font-semibold mb-3">
              Estatísticas de {selectedHyperfocus.title}
            </h3>
            <SessionStats statistics={statistics} loading={sessionsLoading} />
          </div>

          {/* Filtros */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Filtros</h3>
            <SessionFilters filters={filters} onFiltersChange={handleFiltersChange} />
          </div>

          {/* Lista de Sessões */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Histórico de Sessões</h3>
            <SessionList
              sessions={sessions}
              loading={sessionsLoading}
              error={error}
              emptyMessage="Nenhuma sessão encontrada para este hiperfoco"
              onRetry={handleRetry}
              onAddNote={handleAddNote}
              onDelete={handleDelete}
            />
          </div>
        </>
      )}
    </div>
  )
}



