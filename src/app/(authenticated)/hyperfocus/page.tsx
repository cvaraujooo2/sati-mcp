'use client'

/**
 * Hyperfocus Page
 * Página para gerenciar hiperfocos do usuário
 */

import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/lib/hooks'
import { useHyperfocus } from '@/lib/hooks/useHyperfocus'
import { Zap, Plus, TrendingUp, Target, Clock, Search } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu'
import { HyperfocusGrid } from '@/app/components/hyperfocus/HyperfocusGrid'
import { CreateHyperfocusDialog } from '@/app/components/hyperfocus/CreateHyperfocusDialog'

type SortOption = 'recent' | 'oldest' | 'progress' | 'time'
type FilterTab = 'active' | 'archived' | 'all'

export default function HyperfocusPage() {
  const { user } = useAuth()
  const { hyperfocusList, loading, error, loadHyperfocusList } = useHyperfocus(user?.id || '')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTab, setFilterTab] = useState<FilterTab>('active')
  const [sortBy, setSortBy] = useState<SortOption>('recent')

  // Carregar lista ao montar
  useEffect(() => {
    if (user?.id) {
      loadHyperfocusList()
    }
  }, [user?.id, loadHyperfocusList])

  // Filtrar e ordenar hiperfocos
  const filteredHyperfocuses = useMemo(() => {
    let filtered = [...hyperfocusList]

    // Filtrar por tab
    if (filterTab === 'active') {
      filtered = filtered.filter(h => !h.archived)
    } else if (filterTab === 'archived') {
      filtered = filtered.filter(h => h.archived)
    }

    // Filtrar por busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(h =>
        h.title.toLowerCase().includes(query) ||
        h.description?.toLowerCase().includes(query)
      )
    }

    // Ordenar
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case 'time':
        filtered.sort((a, b) => (b.estimated_time_minutes || 0) - (a.estimated_time_minutes || 0))
        break
      case 'progress':
        // TODO: Implementar quando tivermos tarefas
        break
    }

    return filtered
  }, [hyperfocusList, filterTab, searchQuery, sortBy])

  // Calcular estatísticas
  const stats = {
    total: hyperfocusList.length,
    active: hyperfocusList.filter(h => !h.archived).length,
    totalTimeEstimated: hyperfocusList
      .filter(h => !h.archived)
      .reduce((sum, h) => sum + (h.estimated_time_minutes || 0), 0),
  }

  const sortLabels: Record<SortOption, string> = {
    recent: 'Mais Recentes',
    oldest: 'Mais Antigos',
    progress: 'Por Progresso',
    time: 'Por Tempo Estimado',
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <Zap className="w-6 h-6 md:w-8 md:h-8 text-purple-600" />
            Meus Hiperfocos
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            Organize e gerencie seus projetos de alto interesse
          </p>
        </div>
        
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          size="lg"
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Hiperfoco
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Total de Hiperfocos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {stats.total}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Projetos criados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Hiperfocos Ativos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {stats.active}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Em andamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Tempo Estimado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {Math.floor(stats.totalTimeEstimated / 60)}h {stats.totalTimeEstimated % 60}m
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total planejado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <div className="mb-6 space-y-4">
        {/* Tabs de Filtro */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <Tabs value={filterTab} onValueChange={(v) => setFilterTab(v as FilterTab)}>
            <TabsList>
              <TabsTrigger value="active">
                Ativos ({hyperfocusList.filter(h => !h.archived).length})
              </TabsTrigger>
              <TabsTrigger value="archived">
                Arquivados ({hyperfocusList.filter(h => h.archived).length})
              </TabsTrigger>
              <TabsTrigger value="all">
                Todos ({hyperfocusList.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Dropdown de Ordenação */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Ordenar: {sortLabels[sortBy]}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortBy('recent')}>
                Mais Recentes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('oldest')}>
                Mais Antigos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('time')}>
                Por Tempo Estimado
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('progress')} disabled>
                Por Progresso (em breve)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar hiperfocos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Grid de Hiperfocos */}
      <HyperfocusGrid
        hyperfocuses={filteredHyperfocuses}
        loading={loading}
        error={error}
        onRefresh={loadHyperfocusList}
      />

      {/* Dialog de Criação */}
      <CreateHyperfocusDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={loadHyperfocusList}
      />
    </div>
  )
}
