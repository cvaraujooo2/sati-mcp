'use client'

/**
 * Header Component
 * Barra superior com título, breadcrumb e menu do usuário
 */

import { Menu } from 'lucide-react'
import { UserMenu } from './UserMenu'
import { cn } from '@/lib/utils'
import type { User } from '@supabase/supabase-js'

interface HeaderProps {
  user: User
  onMenuToggle: () => void
  title?: string
  description?: string
}

export function Header({ user, onMenuToggle, title, description }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Left side - Menu toggle & Title */}
        <div className="flex items-center gap-4">
          {/* Menu toggle para mobile */}
          <button
            onClick={onMenuToggle}
            className="md:hidden p-2 hover:bg-accent rounded-lg transition-colors"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Título da página */}
          <div>
            {title && (
              <h1 className="text-lg md:text-xl font-semibold text-foreground">
                {title}
              </h1>
            )}
            {description && (
              <p className="text-xs md:text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Right side - User menu */}
        <div className="flex items-center gap-4">
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  )
}

