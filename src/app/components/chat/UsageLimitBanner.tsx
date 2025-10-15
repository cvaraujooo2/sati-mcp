'use client'

/**
 * Usage Limit Banner Component
 * 
 * Banner que aparece no chat quando o usuário está usando o free tier (fallback API).
 * Mostra quantas mensagens restam e encoraja a configurar API key própria.
 */

import { useState } from 'react'
import Link from 'next/link'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Gift, Sparkles, Key, X, TrendingUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface UsageLimitBannerProps {
  remainingDaily: number
  remainingMonthly: number
  dailyLimit?: number
  monthlyLimit?: number
  onDismiss?: () => void
  className?: string
}

export function UsageLimitBanner({
  remainingDaily,
  remainingMonthly,
  dailyLimit = 10,
  monthlyLimit = 100,
  onDismiss,
  className
}: UsageLimitBannerProps) {
  const [isVisible, setIsVisible] = useState(true)

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  const dailyUsagePercent = ((dailyLimit - remainingDaily) / dailyLimit) * 100
  const monthlyUsagePercent = ((monthlyLimit - remainingMonthly) / monthlyLimit) * 100

  // Determinar variante baseado no uso
  const getVariant = () => {
    if (remainingDaily <= 2 || remainingMonthly <= 10) {
      return 'critical' // Quase no limite
    }
    if (remainingDaily <= 5 || remainingMonthly <= 30) {
      return 'warning' // Aviso moderado
    }
    return 'info' // Modo teste grátis
  }

  const variant = getVariant()

  const variantStyles = {
    info: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
    warning: 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800',
    critical: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
  }

  const variantTextStyles = {
    info: 'text-blue-900 dark:text-blue-100',
    warning: 'text-orange-900 dark:text-orange-100',
    critical: 'text-red-900 dark:text-red-100'
  }

  const variantIconStyles = {
    info: 'text-blue-600 dark:text-blue-400',
    warning: 'text-orange-600 dark:text-orange-400',
    critical: 'text-red-600 dark:text-red-400'
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className={cn("w-full", className)}
        >
          <Alert className={cn(
            "relative border-2",
            variantStyles[variant]
          )}>
            <div className="flex items-start gap-3">
              {/* Ícone */}
              <div className={cn(
                "flex-shrink-0 mt-0.5",
                variantIconStyles[variant]
              )}>
                {variant === 'info' && <Gift className="w-5 h-5" />}
                {variant === 'warning' && <TrendingUp className="w-5 h-5" />}
                {variant === 'critical' && <Sparkles className="w-5 h-5" />}
              </div>

              {/* Conteúdo */}
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className={cn(
                      "text-sm font-semibold",
                      variantTextStyles[variant]
                    )}>
                      {variant === 'info' && '🎉 Teste Grátis Ativo!'}
                      {variant === 'warning' && '⚡ Chegando ao Limite'}
                      {variant === 'critical' && '🔥 Últimas Mensagens Grátis!'}
                    </h4>
                    <AlertDescription className={cn(
                      "text-xs mt-1",
                      variantTextStyles[variant]
                    )}>
                      {variant === 'info' && (
                        <>
                          Você está no modo gratuito. Configure sua API key para uso ilimitado!
                        </>
                      )}
                      {variant === 'warning' && (
                        <>
                          Você está usando muitas mensagens. Configure sua API key para continuar sem limites.
                        </>
                      )}
                      {variant === 'critical' && (
                        <>
                          Quase no limite! Configure sua API key agora para não perder acesso.
                        </>
                      )}
                    </AlertDescription>
                  </div>

                  {/* Botão de fechar */}
                  {onDismiss && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDismiss}
                      className={cn(
                        "h-6 w-6 p-0 flex-shrink-0",
                        variantIconStyles[variant]
                      )}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* Estatísticas de uso */}
                <div className="space-y-2">
                  {/* Uso diário */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className={variantTextStyles[variant]}>
                        Hoje: {remainingDaily}/{dailyLimit} mensagens restantes
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {dailyUsagePercent.toFixed(0)}%
                      </Badge>
                    </div>
                    <Progress 
                      value={dailyUsagePercent} 
                      className="h-2"
                      indicatorClassName={cn(
                        variant === 'info' && 'bg-blue-500',
                        variant === 'warning' && 'bg-orange-500',
                        variant === 'critical' && 'bg-red-500'
                      )}
                    />
                  </div>

                  {/* Uso mensal */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className={variantTextStyles[variant]}>
                        Este mês: {remainingMonthly}/{monthlyLimit} mensagens restantes
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {monthlyUsagePercent.toFixed(0)}%
                      </Badge>
                    </div>
                    <Progress 
                      value={monthlyUsagePercent} 
                      className="h-2"
                      indicatorClassName={cn(
                        variant === 'info' && 'bg-blue-500',
                        variant === 'warning' && 'bg-orange-500',
                        variant === 'critical' && 'bg-red-500'
                      )}
                    />
                  </div>
                </div>

                {/* CTA Button */}
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    variant={variant === 'critical' ? 'default' : 'outline'}
                    asChild
                    className={cn(
                      "text-xs",
                      variant === 'critical' && "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    )}
                  >
                    <a href="/settings">
                      <Key className="w-3 h-3 mr-1" />
                      Configurar API Key
                    </a>
                  </Button>

                  {variant === 'info' && (
                    <span className="text-xs text-muted-foreground">
                      💡 Grátis: apenas para teste. Use sua key para ilimitado!
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

