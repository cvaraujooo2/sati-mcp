'use client'

/**
 * Settings Page
 * 
 * Página de configurações do SATI onde o usuário pode:
 * - Gerenciar suas API keys
 * - Configurar preferências
 * - Ver informações da conta
 * 
 * Baseado na implementação do MCPJam SettingsTab.tsx
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Settings, 
  Key, 
  User, 
  Shield, 
  Palette,
  Bell,
  HelpCircle,
  ExternalLink
} from "lucide-react"

import { ApiKeyForm } from '@/components/settings/ApiKeyForm'
import { apiKeyService, type ApiProvider, type UserApiKey } from '@/lib/services/apiKey.service'

export default function SettingsPage() {
  const [apiKeys, setApiKeys] = useState<UserApiKey[]>([])
  const [loading, setLoading] = useState(true)
  
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

  // Callback quando uma API key é atualizada
  const handleApiKeyUpdated = async () => {
    const keys = await apiKeyService.listApiKeys()
    setApiKeys(keys)
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
      description: 'Claude 3.5 Sonnet (em breve)',
      placeholder: 'sk-ant-...',
      getKeyUrl: 'https://console.anthropic.com/',
      icon: '🧠'
    },
    {
      id: 'google',
      name: 'Google AI',
      description: 'Gemini models (em breve)',
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
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="w-8 h-8 text-primary" />
          Configurações
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure suas API keys, preferências e personalize sua experiência no SATI
        </p>
      </div>

      <Tabs defaultValue="api-keys" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="api-keys" className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="account" disabled className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Conta
          </TabsTrigger>
          <TabsTrigger value="preferences" disabled className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Preferências
          </TabsTrigger>
          <TabsTrigger value="help" disabled className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            Ajuda
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
                  <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
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
                            {provider.id !== 'openai' && (
                              <Badge variant="outline" className="text-xs">
                                Em breve
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

                        {/* Form de API key ou botão para obter */}
                        {provider.id === 'openai' ? (
                          <ApiKeyForm
                            provider={provider.id}
                            placeholder={provider.placeholder}
                            onApiKeyUpdated={handleApiKeyUpdated}
                            hasApiKey={hasKey}
                          />
                        ) : (
                          <div className="text-center py-4 text-muted-foreground">
                            Suporte para {provider.name} chegará em breve
                          </div>
                        )}

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

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Preferências</CardTitle>
              <CardDescription>
                Em breve: temas, sons, configurações de alternância, etc.
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