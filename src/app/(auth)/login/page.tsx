'use client'

/**
 * Login Page
 * Página de autenticação do SATI
 */

import { useState, FormEvent, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { Loader2, Mail, Lock, AlertCircle } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirecionar para página original após login (se houver)
  const redirectTo = searchParams.get('redirect') || '/chat'
  
  // Controle de providers habilitados
  const GOOGLE_OAUTH_ENABLED = false // Mudar para true após configurar no Supabase

  async function handleEmailLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      console.log('[Login] Attempting login with email:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('[Login] Response:', { 
        hasUser: !!data?.user, 
        hasSession: !!data?.session,
        error: error?.message 
      })

      if (error) {
        throw error
      }

      if (data.user && data.session) {
        console.log('[Login] Login successful! User:', data.user.id)
        console.log('[Login] Session expires at:', data.session.expires_at)
        
        // Aguardar um momento para garantir que o cookie foi salvo
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Forçar refresh da página para atualizar o middleware
        window.location.href = redirectTo
      }
    } catch (error: any) {
      console.error('Login error:', error)
      
      // Mensagens de erro amigáveis
      if (error.message.includes('Invalid login credentials')) {
        setError('Email ou senha incorretos. Verifique suas credenciais.')
      } else if (error.message.includes('Email not confirmed')) {
        setError('Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada.')
      } else {
        setError(error.message || 'Erro ao fazer login. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=${redirectTo}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        throw error
      }

      // OAuth irá redirecionar automaticamente
    } catch (error: any) {
      console.error('Google login error:', error)
      setError(error.message || 'Erro ao fazer login com Google. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Bem-vindo de volta</CardTitle>
        <CardDescription>
          Entre na sua conta SATI para continuar
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Formulário de Login */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="pl-10"
                autoComplete="email"
              />
            </div>
          </div>

          {/* Senha */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <Link
                href="/reset-password"
                className="text-sm text-purple-600 hover:underline"
              >
                Esqueceu?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="pl-10"
                autoComplete="current-password"
              />
            </div>
          </div>

          {/* Botão de Submit */}
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </Button>
        </form>

        {/* Divider - Só mostrar se Google OAuth estiver habilitado */}
        {GOOGLE_OAUTH_ENABLED && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">
                  Ou continue com
                </span>
              </div>
            </div>

            {/* Google OAuth */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              Continuar com Google
            </Button>
          </>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Signup Link */}
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            Não tem uma conta?{' '}
            <Link
              href="/signup"
              className="text-purple-600 hover:underline font-medium"
            >
              Criar conta
            </Link>
          </p>
          
          {/* Info para neurodivergentes */}
          <p className="text-xs text-gray-500 mt-4 px-4">
            💜 O SATI é um assistente especialmente desenvolvido para pessoas neurodivergentes
            (ADHD/Autismo). Seus dados são privados e seguros.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
