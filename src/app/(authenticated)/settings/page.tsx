'use client'

/**
 * Settings Page
 * 
 * Página de configurações do SATI onde o usuário pode:
 * - Gerenciar suas API keys
 * - Configurar preferências (tema, etc)
 * - Ver informações da conta
 * 
 * Baseado na implementação do MCPJam SettingsTab.tsx
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { Separator } from "@/app/components/ui/separator"
import { Badge } from "@/app/components/ui/badge"
import { Button } from "@/app/components/ui/button"
import { Label } from "@/app/components/ui/label"
import { 
  Settings, 
  Key, 
  User, 
  Shield, 
  Palette,
  Bell,
  HelpCircle,
  ExternalLink,
  Sun,
  Moon,
  Monitor
} from "lucide-react"

import { ApiKeyForm } from '@/app/components/settings/ApiKeyForm'
import { ModelWarningsBanner } from '@/app/components/settings/ModelWarningsBanner'
import { apiKeyService, type ApiProvider, type UserApiKey } from '@/lib/services/apiKey.service'
import { userPreferencesService } from '@/lib/services/userPreferences.service'
import { ModelWarning } from '@/lib/chat/types'
import { useTheme } from '@/lib/hooks/useTheme'

export default function SettingsPage() {
  const [apiKeys, setApiKeys] = useState<UserApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [warnings, setWarnings] = useState<ModelWarning[]>([])
  const { theme, setTheme } = useTheme()
  
  // Carregar API keys do usuário
  useEffect(() => {
    async function loadApiKeys() {
      try {
        const keys = await apiKeyService.listApiKeys()
        setApiKeys(keys)
      } catch (error) {
        console.error('Error loading API keys:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadApiKeys()
  }, [])

  // Carregar warnings de modelos
  useEffect(() => {
    async function loadWarnings() {
      try {
        const activeWarnings = await userPreferencesService.getActiveWarnings()
        setWarnings(activeWarnings)
      } catch (error) {
        console.error('Error loading warnings:', error)
      }
    }
    
    loadWarnings()
  }, [])

  // Callback quando uma API key é atualizada
  const handleApiKeyUpdated = async () => {
    const keys = await apiKeyService.listApiKeys()
    setApiKeys(keys)
  }

  // Callback quando um warning é dismissado
  const handleWarningDismissed = (warningId: string) => {
    setWarnings(prev => prev.filter(w => w.id !== warningId))
  }

  // Providers suportados
  const providers: Array<{
    id: ApiProvider
    name: string
    description: string
    placeholder: string
    getKeyUrl: string
    icon: string
  }> = [
    {
      id: 'openai',
      name: 'OpenAI',
      description: 'GPT-4o, GPT-4o Mini, GPT-4 Turbo para chat e MCP tools',
      placeholder: 'sk-...',
      getKeyUrl: 'https://platform.openai.com/api-keys',
      icon: '🤖'
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      description: 'Claude 3.5 Sonnet, Claude 3 Opus e outros modelos da família Claude',
      placeholder: 'sk-ant-...',
      getKeyUrl: 'https://console.anthropic.com/',
      icon: '🧠'
    },
    {
      id: 'google',
      name: 'Google AI',
      description: 'Gemini Pro, Gemini Flash e outros modelos do Google',
      placeholder: 'AI...',
      getKeyUrl: 'https://aistudio.google.com/app/apikey',
      icon: '🔍'
    }
  ]

  const hasApiKey = (provider: ApiProvider) => {
    return apiKeys.some(key => key.provider === provider)
  }

  const getApiKeyInfo = (provider: ApiProvider) => {
    return apiKeys.find(key => key.provider === provider)
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-5xl">
      {/* Warnings Banner */}
      {warnings.length > 0 && (
        <div className="mb-6">
          <ModelWarningsBanner 
            warnings={warnings}
            onWarningDismissed={handleWarningDismissed}
          />
        </div>
      )}

      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <Settings className="w-6 h-6 md:w-8 md:h-8 text-primary" />
          Configurações
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mt-2">
          Configure suas API keys, preferências e personalize sua experiência no SATI
        </p>
      </div>

      <Tabs defaultValue="api-keys" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="api-keys" className="flex items-center gap-2 text-xs md:text-sm">
            <Key className="w-4 h-4" />
            <span className="hidden sm:inline">API Keys</span>
            <span className="sm:hidden">Keys</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2 text-xs md:text-sm">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Preferências</span>
            <span className="sm:hidden">Prefs</span>
          </TabsTrigger>
          <TabsTrigger value="account" disabled className="flex items-center gap-2 text-xs md:text-sm">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Conta</span>
          </TabsTrigger>
          <TabsTrigger value="help" disabled className="flex items-center gap-2 text-xs md:text-sm">
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Ajuda</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="api-keys" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                API Keys do LLM
              </CardTitle>
              <CardDescription>
                Configure suas chaves de API para usar os modelos de IA. Suas chaves são armazenadas 
                de forma segura e criptografadas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Aviso importante */}
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      BYOK - Bring Your Own Key
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      O SATI usa o modelo BYOK (Bring Your Own Key). Você paga diretamente 
                      para o provedor (OpenAI, etc.) pelos tokens utilizados. Isso garante 
                      transparência total nos custos e privacidade dos seus dados.
                    </p>
                  </div>
                </div>
              </div>

              {/* Lista de providers */}
              <div className="space-y-4">
                {providers.map((provider) => {
                  const keyInfo = getApiKeyInfo(provider.id)
                  const hasKey = hasApiKey(provider.id)

                  return (
                    <Card key={provider.id} className="relative">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{provider.icon}</span>
                            <div>
                              <CardTitle className="text-lg">{provider.name}</CardTitle>
                              <CardDescription className="text-sm">
                                {provider.description}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {hasKey && (
                              <Badge variant="secondary" className="text-xs">
                                Configurado
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {/* Informações da key se existir */}
                        {keyInfo && (
                          <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Adicionado em:</span>
                              <span>{new Date(keyInfo.created_at).toLocaleDateString('pt-BR')}</span>
                            </div>
                            {keyInfo.last_used_at && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Último uso:</span>
                                <span>{new Date(keyInfo.last_used_at).toLocaleDateString('pt-BR')}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Form de API key */}
                        <ApiKeyForm
                          provider={provider.id}
                          placeholder={provider.placeholder}
                          onApiKeyUpdated={handleApiKeyUpdated}
                          hasApiKey={hasKey}
                        />

                        {/* Link para obter API key */}
                        <div className="flex items-center justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(provider.getKeyUrl, '_blank')}
                            className="flex items-center gap-2"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Obter API Key do {provider.name}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              <Separator />

              {/* Informações adicionais */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Sobre as API Keys</h3>
                <div className="grid gap-4 text-sm text-muted-foreground">
                  <div>
                    <strong>🔐 Segurança:</strong> Suas API keys são criptografadas antes de serem 
                    armazenadas e nunca são compartilhadas com terceiros.
                  </div>
                  <div>
                    <strong>💰 Custos:</strong> Você paga diretamente ao provedor (OpenAI, etc.) 
                    pelos tokens utilizados. O SATI não cobra taxas adicionais.
                  </div>
                  <div>
                    <strong>🛡️ Privacidade:</strong> Suas conversas e dados ficam entre você 
                    e o provedor de IA. O SATI não armazena conteúdo das mensagens.
                  </div>
                  <div>
                    <strong>⚡ Performance:</strong> Conexão direta com a API do provedor 
                    garante a melhor velocidade e latência.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Preferências - AGORA HABILITADA */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Aparência
              </CardTitle>
              <CardDescription>
                Personalize o tema e a aparência do SATI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Seletor de Tema */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Tema da Interface</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Escolha o tema que melhor se adapta ao seu ambiente e preferências visuais
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Light Theme */}
                  <button
                    onClick={() => setTheme('light')}
                    className={`
                      relative p-4 rounded-lg border-2 transition-all
                      ${theme === 'light' 
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/20' 
                        : 'border-border hover:border-purple-300'
                      }
                    `}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                        <Sun className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium">Claro</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Ideal para ambientes bem iluminados
                        </p>
                      </div>
                      {theme === 'light' && (
                        <Badge variant="secondary" className="text-xs">Ativo</Badge>
                      )}
                    </div>
                  </button>

                  {/* Dark Theme */}
                  <button
                    onClick={() => setTheme('dark')}
                    className={`
                      relative p-4 rounded-lg border-2 transition-all
                      ${theme === 'dark' 
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/20' 
                        : 'border-border hover:border-purple-300'
                      }
                    `}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-900 to-blue-900 flex items-center justify-center">
                        <Moon className="w-6 h-6 text-purple-300" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium">Escuro</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Reduz fadiga visual em ambientes escuros
                        </p>
                      </div>
                      {theme === 'dark' && (
                        <Badge variant="secondary" className="text-xs">Ativo</Badge>
                      )}
                    </div>
                  </button>

                  {/* System Theme */}
                  <button
                    onClick={() => setTheme('system')}
                    className={`
                      relative p-4 rounded-lg border-2 transition-all
                      ${theme === 'system' 
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/20' 
                        : 'border-border hover:border-purple-300'
                      }
                    `}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                        <Monitor className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium">Sistema</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Segue as preferências do sistema
                        </p>
                      </div>
                      {theme === 'system' && (
                        <Badge variant="secondary" className="text-xs">Ativo</Badge>
                      )}
                    </div>
                  </button>
                </div>
              </div>

              <Separator />

              {/* Paleta de Cores (Preview) */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Paleta de Cores</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Cores principais do tema SATI (Purple/Blue Gradient)
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <div className="w-full h-16 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600" />
                    <p className="text-xs font-medium">Primary Gradient</p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-16 rounded-lg bg-purple-600" />
                    <p className="text-xs font-medium">Purple</p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-16 rounded-lg bg-blue-600" />
                    <p className="text-xs font-medium">Blue</p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-16 rounded-lg bg-purple-100 dark:bg-purple-900" />
                    <p className="text-xs font-medium">Accent</p>
                  </div>
                </div>
              </div>

              {/* Info para neurodivergentes */}
              <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💜</span>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                      Design para Neurodivergentes
                    </p>
                    <p className="text-xs text-purple-700 dark:text-purple-300">
                      O tema do SATI foi cuidadosamente projetado para reduzir sobrecarga sensorial 
                      e melhorar o foco. As cores purple/blue promovem calma e concentração.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Outras abas desabilitadas por enquanto */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Configurações da Conta</CardTitle>
              <CardDescription>
                Em breve: gerenciamento de perfil, preferências de notificação, etc.
              </CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>

        <TabsContent value="help">
          <Card>
            <CardHeader>
              <CardTitle>Ajuda & Suporte</CardTitle>
              <CardDescription>
                Em breve: FAQ, tutoriais, documentação, etc.
              </CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

