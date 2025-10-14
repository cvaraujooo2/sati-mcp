'use client'

/**
 * SessionList Component
 * Lista de sessões com loading, empty e error states
 */

import { FocusSessionWithHyperfocus } from '@/lib/supabase/queries'
import { SessionCard } from './SessionCard'
import { Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Alert, AlertDescription } from '@/app/components/ui/alert'

interface SessionListProps {
  sessions: FocusSessionWithHyperfocus[]
  loading: boolean
  error: string | null
  emptyMessage?: string
  onRetry?: () => void
  onAddNote?: (sessionId: string, note: string) => Promise<void>
  onDelete?: (sessionId: string) => Promise<void>
}

export function SessionList({
  sessions,
  loading,
  error,
  emptyMessage = 'Nenhuma sessão encontrada',
  onRetry,
  onAddNote,
  onDelete,
}: SessionListProps) {
  // Loading state
  if (loading && sessions.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-muted rounded-lg h-32" />
          </div>
        ))}
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="w-4 h-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="ml-4"
            >
              Tentar Novamente
            </Button>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  // Empty state
  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-semibold mb-2">{emptyMessage}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Comece uma sessão de foco para ver seu histórico aqui
        </p>
        <Button variant="outline" onClick={() => window.location.href = '/hyperfocus'}>
          Ver Hiperfocos
        </Button>
      </div>
    )
  }

  // Lista de sessões
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sessions.map((session) => (
          <SessionCard 
            key={session.id} 
            session={session}
            onAddNote={onAddNote}
            onDelete={onDelete}
          />
        ))}
      </div>

      {/* Indicador de loading ao carregar mais */}
      {loading && sessions.length > 0 && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  )
}



