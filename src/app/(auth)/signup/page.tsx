'use client'

/**
 * Signup Page
 * Página de registro de novos usuários do SATI
 */

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Controle de providers habilitados
  const GOOGLE_OAUTH_ENABLED = false // Mudar para true após configurar no Supabase

  // Validação de senha
  const passwordsMatch = password === confirmPassword
  const passwordStrong = password.length >= 8
  const showPasswordError = confirmPassword.length > 0 && !passwordsMatch

  async function handleEmailSignup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validações
    if (!passwordsMatch) {
      setError('As senhas não coincidem.')
      setLoading(false)
      return
    }

    if (!passwordStrong) {
      setError('A senha deve ter no mínimo 8 caracteres.')
      setLoading(false)
      return
    }

    try {
      // 1. Criar conta no Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signUpError) {
        throw signUpError
      }

      if (data.user) {
        // Sucesso! O Supabase Auth gerencia automaticamente o perfil do usuário
        setSuccess(true)
        
        // Verificar se email precisa ser confirmado
        if (data.user.identities?.length === 0) {
          // Email precisa ser confirmado
          setTimeout(() => {
            router.push('/auth/login?message=check-email')
          }, 3000)
        } else {
          // Email já confirmado ou OAuth
          setTimeout(() => {
            router.push('/chat')
            router.refresh()
          }, 2000)
        }
      }
    } catch (error: any) {
      console.error('Signup error:', error)
      
      // Mensagens de erro amigáveis
      if (error.message.includes('User already registered')) {
        setError('Este email já está cadastrado. Tente fazer login.')
      } else if (error.message.includes('Password should be')) {
        setError('A senha não atende aos requisitos de segurança.')
      } else {
        setError(error.message || 'Erro ao criar conta. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSignup() {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=/chat`,
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
      console.error('Google signup error:', error)
      setError(error.message || 'Erro ao criar conta com Google. Tente novamente.')
      setLoading(false)
    }
  }

  // Se sucesso, mostrar mensagem
  if (success) {
    return (
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold">Conta criada com sucesso!</CardTitle>
          <CardDescription>
            Verifique seu email para confirmar sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              Enviamos um link de confirmação para <strong>{email}</strong>. 
              Clique no link para ativar sua conta.
            </AlertDescription>
          </Alert>
          <div className="mt-4 text-center text-sm text-gray-600">
            Redirecionando em alguns segundos...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Criar conta SATI</CardTitle>
        <CardDescription>
          Comece sua jornada de produtividade com TDAH
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Formulário de Signup */}
        <form onSubmit={handleEmailSignup} className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome completo</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="name"
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
                className="pl-10"
                autoComplete="name"
              />
            </div>
          </div>

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
            <Label htmlFor="password">Senha</Label>
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
                autoComplete="new-password"
              />
            </div>
            {password.length > 0 && !passwordStrong && (
              <p className="text-xs text-amber-600">
                A senha deve ter no mínimo 8 caracteres
              </p>
            )}
          </div>

          {/* Confirmar Senha */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                className="pl-10"
                autoComplete="new-password"
              />
            </div>
            {showPasswordError && (
              <p className="text-xs text-red-600">
                As senhas não coincidem
              </p>
            )}
          </div>

          {/* Botão de Submit */}
          <Button
            type="submit"
            className="w-full"
            disabled={loading || !passwordsMatch || !passwordStrong}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando conta...
              </>
            ) : (
              'Criar conta'
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
              onClick={handleGoogleSignup}
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

        {/* Link para Login */}
        <div className="text-center text-sm">
          Já tem uma conta?{' '}
          <Link
            href="/login"
            className="text-purple-600 hover:underline font-medium"
          >
            Faça login
          </Link>
        </div>

        {/* Termos */}
        <p className="text-xs text-center text-gray-500">
          Ao criar uma conta, você concorda com nossos{' '}
          <Link href="/terms" className="underline">
            Termos de Uso
          </Link>{' '}
          e{' '}
          <Link href="/privacy" className="underline">
            Política de Privacidade
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
