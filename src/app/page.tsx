'use client'

/**
 * Home Page
 * Redireciona usuários autenticados para /chat
 * Usuários não autenticados são redirecionados para /login pelo middleware
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function checkAuthAndRedirect() {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Usuário autenticado, redirecionar para chat
        router.push('/chat')
      } else {
        // Não autenticado, redirecionar para login
        router.push('/login')
      }
    }

    checkAuthAndRedirect()
  }, [router, supabase.auth])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <div className="text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-purple-600 mx-auto" />
        <p className="text-sm text-gray-600">Carregando SATI...</p>
      </div>
    </div>
  )
}
