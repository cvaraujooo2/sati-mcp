'use client'

/**
 * Model Warnings Banner Component
 * 
 * Banner que aparece na página de Settings mostrando:
 * - Modelos deprecados que o usuário está usando
 * - Novos modelos disponíveis
 * - Mudanças importantes
 */

import { useState, useEffect } from 'react'
import { ModelWarning } from '@/lib/chat/types'
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { Separator } from '@/app/components/ui/separator'
import { AlertCircle, Sparkles, Info, X, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { userPreferencesService } from '@/lib/services/userPreferences.service'

interface ModelWarningsBannerProps {
  warnings: ModelWarning[]
  onWarningDismissed?: (warningId: string) => void
  onActionClick?: (warning: ModelWarning) => void
  className?: string
}

export function ModelWarningsBanner({
  warnings,
  onWarningDismissed,
  onActionClick,
  className
}: ModelWarningsBannerProps) {
  const [visibleWarnings, setVisibleWarnings] = useState<string[]>(
    warnings.map(w => w.id)
  )

  useEffect(() => {
    setVisibleWarnings(warnings.map(w => w.id))
  }, [warnings])

  const handleDismiss = async (warningId: string) => {
    // Remover da UI imediatamente
    setVisibleWarnings(prev => prev.filter(id => id !== warningId))

    // Salvar no backend
    await userPreferencesService.dismissModelWarning(warningId)

    // Notificar parent component
    onWarningDismissed?.(warningId)
  }

  const handleAction = (warning: ModelWarning) => {
    onActionClick?.(warning)
  }

  const getIcon = (type: ModelWarning['type']) => {
    switch (type) {
      case 'deprecated':
        return <AlertCircle className="w-5 h-5" />
      case 'new_model':
        return <Sparkles className="w-5 h-5" />
      case 'name_change':
        return <Info className="w-5 h-5" />
    }
  }

  const getVariantStyles = (severity: ModelWarning['severity']) => {
    switch (severity) {
      case 'critical':
        return {
          container: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
          icon: 'text-red-600 dark:text-red-400',
          title: 'text-red-900 dark:text-red-100',
          description: 'text-red-700 dark:text-red-300'
        }
      case 'warning':
        return {
          container: 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800',
          icon: 'text-orange-600 dark:text-orange-400',
          title: 'text-orange-900 dark:text-orange-100',
          description: 'text-orange-700 dark:text-orange-300'
        }
      case 'info':
        return {
          container: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
          icon: 'text-blue-600 dark:text-blue-400',
          title: 'text-blue-900 dark:text-blue-100',
          description: 'text-blue-700 dark:text-blue-300'
        }
    }
  }

  const getSeverityBadge = (severity: ModelWarning['severity']) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive" className="text-xs">Crítico</Badge>
      case 'warning':
        return <Badge variant="outline" className="text-xs border-orange-500 text-orange-600">Aviso</Badge>
      case 'info':
        return <Badge variant="outline" className="text-xs border-blue-500 text-blue-600">Info</Badge>
    }
  }

  const activeWarnings = warnings.filter(w => visibleWarnings.includes(w.id))

  if (activeWarnings.length === 0) {
    return null
  }

  return (
    <div className={cn("space-y-3", className)}>
      <AnimatePresence mode="popLayout">
        {activeWarnings.map((warning) => {
          const styles = getVariantStyles(warning.severity)

          return (
            <motion.div
              key={warning.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.2 }}
            >
              <Alert className={cn("border-2", styles.container)}>
                <div className="flex items-start gap-3">
                  {/* Ícone */}
                  <div className={cn("flex-shrink-0 mt-0.5", styles.icon)}>
                    {getIcon(warning.type)}
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <AlertTitle className={cn("text-sm font-semibold m-0", styles.title)}>
                          {warning.modelName}
                        </AlertTitle>
                        {getSeverityBadge(warning.severity)}
                      </div>

                      {/* Botão de fechar */}
                      {warning.dismissible && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDismiss(warning.id)}
                          className={cn(
                            "h-6 w-6 p-0 flex-shrink-0",
                            styles.icon
                          )}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <AlertDescription className={cn("text-xs", styles.description)}>
                      {warning.message}
                    </AlertDescription>

                    {/* Ação */}
                    {warning.actionLabel && (
                      <div className="pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAction(warning)}
                          className="text-xs h-8"
                        >
                          {warning.actionLabel}
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Alert>
            </motion.div>
          )
        })}
      </AnimatePresence>

      {/* Separador se houver avisos */}
      {activeWarnings.length > 0 && (
        <Separator className="my-4" />
      )}
    </div>
  )
}


