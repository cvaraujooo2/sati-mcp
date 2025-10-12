import Image from 'next/image'

/**
 * Auth Layout
 * Layout para páginas de autenticação (login, signup, etc)
 * Não inclui sidebar ou navigation
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <div className="w-full max-w-md p-6">
        {/* Logo e Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Image
              src="/sati_logo.png"
              alt="SATI Logo"
              width={80}
              height={80}
              className="rounded-lg shadow-md"
            />
          </div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
            SATI
          </h1>
          <p className="text-gray-600 mt-2 text-sm">
            Assistente Inteligente para Neurodivergentes
          </p>
          <p className="text-gray-500 text-xs mt-1">
            ADHD • Autismo • Produtividade Focada
          </p>
        </div>

        {/* Conteúdo da página (login/signup/etc) */}
        {children}

        {/* Footer */}
        <footer className="mt-8 text-center text-xs text-gray-500 space-y-1">
          <p>
            Desenvolvido com 💜 para pessoas neurodivergentes
          </p>
          <div className="flex items-center justify-center gap-4">
            <a
              href="/termos"
              className="hover:text-purple-600 transition-colors"
            >
              Termos de Uso
            </a>
            <span>•</span>
            <a
              href="/privacidade"
              className="hover:text-purple-600 transition-colors"
            >
              Privacidade
            </a>
          </div>
        </footer>
      </div>
    </div>
  )
}
