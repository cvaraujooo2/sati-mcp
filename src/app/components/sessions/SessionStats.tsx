'use client'

/**
 * SessionStats Component
 * Cards de estatísticas de sessões
 */

import { SessionStatistics } from '@/lib/hooks/useFocusSession'
import { Card, CardContent } from '@/app/components/ui/card'
import { Clock, Target, TrendingUp, CheckCircle } from 'lucide-react'

interface SessionStatsProps {
  statistics: SessionStatistics | null
  loading?: boolean
}

export function SessionStats({ statistics, loading }: SessionStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded w-20 mb-2" />
              <div className="h-8 bg-muted rounded w-16 mb-1" />
              <div className="h-3 bg-muted rounded w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!statistics) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="text-muted-foreground text-sm">---</div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Total de Sessões */}
      <StatCard
        icon={<Target className="w-5 h-5" />}
        label="Total de Sessões"
        value={statistics.total.toString()}
        description={`${statistics.completed} completas`}
        color="blue"
      />

      {/* Tempo Total */}
      <StatCard
        icon={<Clock className="w-5 h-5" />}
        label="Tempo Total"
        value={formatTime(statistics.totalMinutes)}
        description="de foco"
        color="purple"
      />

      {/* Taxa de Conclusão */}
      <StatCard
        icon={<CheckCircle className="w-5 h-5" />}
        label="Taxa de Conclusão"
        value={`${statistics.completionRate}%`}
        description={
          <div className="w-full mt-2">
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${statistics.completionRate}%` }}
              />
            </div>
          </div>
        }
        color="green"
      />

      {/* Média por Sessão */}
      <StatCard
        icon={<TrendingUp className="w-5 h-5" />}
        label="Média por Sessão"
        value={formatTime(statistics.averageDuration)}
        description="tempo médio"
        color="orange"
      />
    </div>
  )
}

// Componente helper para card individual
interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string
  description: string | React.ReactNode
  color: 'blue' | 'purple' | 'green' | 'orange'
}

function StatCard({ icon, label, value, description, color }: StatCardProps) {
  const colorClasses = {
    blue: 'text-blue-600 dark:text-blue-400',
    purple: 'text-purple-600 dark:text-purple-400',
    green: 'text-green-600 dark:text-green-400',
    orange: 'text-orange-600 dark:text-orange-400',
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className={`${colorClasses[color]} mb-2`}>{icon}</div>
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-2xl font-bold mb-1">{value}</p>
        {typeof description === 'string' ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : (
          description
        )}
      </CardContent>
    </Card>
  )
}



