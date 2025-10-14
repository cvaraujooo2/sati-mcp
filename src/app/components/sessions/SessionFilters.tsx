'use client'

/**
 * SessionFilters Component
 * Filtros para sessões (período, status, ordenação)
 */

import { SessionFilters as Filters } from '@/lib/supabase/queries'
import { Tabs, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'

interface SessionFiltersProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
}

export function SessionFilters({ filters, onFiltersChange }: SessionFiltersProps) {
  const handlePeriodChange = (period: 'today' | 'week' | 'month' | 'all') => {
    onFiltersChange({ ...filters, period })
  }

  const handleStatusChange = (status: 'completed' | 'interrupted' | 'all') => {
    onFiltersChange({ ...filters, status })
  }

  const handleSortChange = (sortBy: 'recent' | 'oldest' | 'duration') => {
    onFiltersChange({ ...filters, sortBy })
  }

  return (
    <div className="space-y-4">
      {/* Tabs de período */}
      <div>
        <label className="text-sm font-medium mb-2 block">Período</label>
        <Tabs value={filters.period || 'all'} onValueChange={(value) => handlePeriodChange(value as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="today">Hoje</TabsTrigger>
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="month">Mês</TabsTrigger>
            <TabsTrigger value="all">Tudo</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Dropdowns de status e ordenação */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Status */}
        <div>
          <label className="text-sm font-medium mb-2 block">Status</label>
          <Select value={filters.status || 'all'} onValueChange={(value) => handleStatusChange(value as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="completed">Completas</SelectItem>
              <SelectItem value="interrupted">Interrompidas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Ordenação */}
        <div>
          <label className="text-sm font-medium mb-2 block">Ordenar por</label>
          <Select value={filters.sortBy || 'recent'} onValueChange={(value) => handleSortChange(value as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a ordenação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Mais Recentes</SelectItem>
              <SelectItem value="oldest">Mais Antigas</SelectItem>
              <SelectItem value="duration">Maior Duração</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}



