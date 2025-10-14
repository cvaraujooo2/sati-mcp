'use client'

/**
 * Sessions Page
 * Página para visualizar histórico de sessões de foco
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks'
import { useFocusSession } from '@/lib/hooks/useFocusSession'
import { SessionFilters as Filters } from '@/lib/supabase/queries'
import { Clock } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import {
  SessionStats,
  SessionFilters,
  SessionList,
  HyperfocusSessionsTab,
} from '@/app/components/sessions'

export default function SessionsPage() {
  const { user } = useAuth()
  const {
    sessions,
    loading,
    error,
    statistics,
    listAllSessions,
    addSessionNote,
    deleteSession,
  } = useFocusSession(user?.id || '')

  const [filters, setFilters] = useState<Filters>({
    period: 'all',
    status: 'all',
    sortBy: 'recent',
  })

  const [activeTab, setActiveTab] = useState<'all' | 'by-hyperfocus'>('all')

  // Carregar todas as sessões quando a tab "all" está ativa
  useEffect(() => {
    if (user?.id && activeTab === 'all') {
      listAllSessions(filters)
    }
  }, [user?.id, activeTab, filters, listAllSessions])

  const handleFiltersChange = (newFilters: Filters) => {
    setFilters(newFilters)
  }

  const handleRetry = () => {
    if (user?.id) {
      listAllSessions(filters)
    }
  }

  const handleAddNote = async (sessionId: string, note: string) => {
    await addSessionNote(sessionId, note)
    // Recarregar lista após adicionar nota
    if (user?.id) {
      listAllSessions(filters)
    }
  }

  const handleDelete = async (sessionId: string) => {
    await deleteSession(sessionId)
    // Lista será atualizada automaticamente pelo hook
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <Clock className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
          Sessões de Foco
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mt-2">
          Visualize seu histórico de sessões e estatísticas de produtividade
        </p>
      </div>

      {/* Tabs: Todas as Sessões | Por Hiperfoco */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="all">Todas as Sessões</TabsTrigger>
          <TabsTrigger value="by-hyperfocus">Por Hiperfoco</TabsTrigger>
        </TabsList>

        {/* Tab 1: Todas as Sessões */}
        <TabsContent value="all" className="space-y-6">
          {/* Estatísticas Globais */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Estatísticas Gerais</h2>
            <SessionStats statistics={statistics} loading={loading} />
          </div>

          {/* Filtros */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Filtros</h2>
            <SessionFilters filters={filters} onFiltersChange={handleFiltersChange} />
          </div>

          {/* Lista de Sessões */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Histórico de Sessões</h2>
            <SessionList
              sessions={sessions}
              loading={loading}
              error={error}
              emptyMessage="Nenhuma sessão encontrada no período selecionado"
              onRetry={handleRetry}
              onAddNote={handleAddNote}
              onDelete={handleDelete}
            />
          </div>
        </TabsContent>

        {/* Tab 2: Por Hiperfoco */}
        <TabsContent value="by-hyperfocus">
          <HyperfocusSessionsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

