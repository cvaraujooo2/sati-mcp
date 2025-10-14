'use client'

/**
 * Sidebar Component
 * Barra lateral com navegação principal do SATI
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { 
  MessageSquare, 
  Zap, 
  Clock, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  isMobile: boolean
}

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
  description: string
}

const navItems: NavItem[] = [
  {
    name: 'Chat',
    href: '/chat',
    icon: MessageSquare,
    description: 'Converse com o SATI'
  },
  {
    name: 'Hiperfocos',
    href: '/hyperfocus',
    icon: Zap,
    description: 'Gerencie seus hiperfocos'
  },
  {
    name: 'Sessões',
    href: '/sessions',
    icon: Clock,
    description: 'Histórico de sessões'
  },
  {
    name: 'Configurações',
    href: '/settings',
    icon: Settings,
    description: 'Ajuste suas preferências'
  }
]

export function Sidebar({ isOpen, onToggle, isMobile }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Backdrop para mobile */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:static inset-y-0 left-0 z-50",
          "flex flex-col",
          "bg-sidebar border-r border-sidebar-border",
          "transition-all duration-300 ease-in-out",
          isMobile
            ? isOpen
              ? "translate-x-0 w-64"
              : "-translate-x-full w-64"
            : isOpen
            ? "w-64"
            : "w-16",
          "h-screen"
        )}
      >
        {/* Header com Logo */}
        <div className={cn(
          "flex items-center gap-3 px-4 py-5 border-b border-sidebar-border",
          !isOpen && !isMobile && "justify-center px-2"
        )}>
          <div className="relative w-10 h-10 flex-shrink-0">
            <Image
              src="/sati_logo.png"
              alt="SATI Logo"
              width={40}
              height={40}
              className="rounded-lg"
            />
          </div>
          {(isOpen || isMobile) && (
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                SATI
              </h2>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                Assistente Neurodivergente
              </p>
            </div>
          )}
          {isMobile && isOpen && (
            <button
              onClick={onToggle}
              className="md:hidden p-1 hover:bg-sidebar-accent rounded-md"
              aria-label="Fechar menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navegação */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => isMobile && onToggle()}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg",
                      "transition-colors duration-200",
                      "group relative",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                      !isOpen && !isMobile && "justify-center"
                    )}
                    title={!isOpen && !isMobile ? item.name : undefined}
                  >
                    <Icon className={cn(
                      "w-5 h-5 flex-shrink-0",
                      isActive && "text-purple-600 dark:text-purple-400"
                    )} />
                    {(isOpen || isMobile) && (
                      <span className="flex-1 truncate">{item.name}</span>
                    )}
                    
                    {/* Tooltip para sidebar colapsado */}
                    {!isOpen && !isMobile && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                        {item.name}
                      </div>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer com botão de collapse (apenas desktop) */}
        {!isMobile && (
          <div className="border-t border-sidebar-border p-2">
            <button
              onClick={onToggle}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg",
                "text-sidebar-foreground hover:bg-sidebar-accent/50",
                "transition-colors duration-200",
                !isOpen && "justify-center"
              )}
              aria-label={isOpen ? "Recolher sidebar" : "Expandir sidebar"}
            >
              {isOpen ? (
                <>
                  <ChevronLeft className="w-5 h-5" />
                  <span className="text-sm">Recolher</span>
                </>
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
            </button>
          </div>
        )}
      </aside>
    </>
  )
}

