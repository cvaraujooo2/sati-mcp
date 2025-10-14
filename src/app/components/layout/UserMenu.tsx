'use client'

/**
 * UserMenu Component
 * Menu dropdown com informações do usuário e opções de conta
 */

import { useRouter } from 'next/navigation'
import { User as UserIcon, Settings, LogOut, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { User } from '@supabase/supabase-js'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu'

interface UserMenuProps {
  user: User
}

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter()
  const supabase = createClient()

  // Obter iniciais do usuário
  const getInitials = (email: string) => {
    const name = email.split('@')[0]
    return name
      .split(/[\s._-]/)
      .slice(0, 2)
      .map(part => part[0])
      .join('')
      .toUpperCase()
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      // Forçar refresh para limpar cookies
      window.location.href = '/login'
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  const userEmail = user.email || 'Usuário'
  const initials = getInitials(userEmail)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg",
            "hover:bg-accent transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          )}
        >
          {/* Avatar com iniciais */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
            {initials}
          </div>
          
          {/* Nome do usuário (hidden no mobile) */}
          <span className="hidden md:block text-sm font-medium text-foreground max-w-[150px] truncate">
            {userEmail.split('@')[0]}
          </span>
          
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64" align="end" forceMount>
        {/* Header do menu */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium text-foreground truncate">
              {userEmail}
            </p>
            <p className="text-xs text-muted-foreground">
              Conta SATI
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Opções do menu */}
        <DropdownMenuItem
          onClick={() => router.push('/settings?tab=account')}
          className="cursor-pointer"
        >
          <UserIcon className="w-4 h-4 mr-2" />
          <span>Meu Perfil</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => router.push('/settings')}
          className="cursor-pointer"
        >
          <Settings className="w-4 h-4 mr-2" />
          <span>Configurações</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Logout */}
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="w-4 h-4 mr-2" />
          <span>Sair</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Footer info */}
        <div className="px-2 py-1.5">
          <p className="text-xs text-muted-foreground text-center">
            💜 SATI para neurodivergentes
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

