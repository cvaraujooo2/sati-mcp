/**
 * Model Registry Service
 * 
 * Gerencia a lista de modelos disponíveis (OpenAI, Anthropic, Google)
 * com suporte a detecção de modelos deprecados e novos.
 */

import { ModelDefinition, ModelWarning } from '@/lib/chat/types'

// ============================================================================
// LISTA BASE DE MODELOS (Hardcoded)
// ============================================================================

const OPENAI_MODELS: ModelDefinition[] = [
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    deprecated: false,
    maxTokens: 128000,
    supportsFunctions: true,
    description: 'Modelo rápido e econômico para tarefas gerais',
    releaseDate: '2024-07-01'
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    deprecated: false,
    maxTokens: 128000,
    supportsFunctions: true,
    description: 'Modelo mais recente e capaz da OpenAI',
    releaseDate: '2024-05-13'
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    deprecated: false,
    maxTokens: 128000,
    supportsFunctions: true,
    description: 'Modelo GPT-4 otimizado para velocidade',
    releaseDate: '2024-04-09'
  },
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'openai',
    deprecated: false,
    maxTokens: 8192,
    supportsFunctions: true,
    description: 'Modelo GPT-4 original',
    releaseDate: '2023-03-14'
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    deprecated: false,
    maxTokens: 16384,
    supportsFunctions: true,
    description: 'Modelo econômico e rápido',
    releaseDate: '2023-03-01'
  }
]

const ANTHROPIC_MODELS: ModelDefinition[] = [
  {
    id: 'claude-35-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    deprecated: false,
    maxTokens: 200000,
    supportsFunctions: true,
    description: 'Equilibrado entre velocidade e qualidade',
    releaseDate: '2024-10-22'
  },
  {
    id: 'claude-35-haiku-20241029',
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    deprecated: false,
    maxTokens: 200000,
    supportsFunctions: true,
    description: 'Modelo rápido e eficiente',
    releaseDate: '2024-10-29'
  },
  {
    id: 'claude-sonnet-4',
    name: 'Claude Sonnet 4',
    provider: 'anthropic',
    deprecated: false,
    maxTokens: 200000,
    supportsFunctions: true,
    description: 'Nova geração de raciocínio avançado',
    releaseDate: '2025-04-01'
  },
  {
    id: 'claude-opus-4',
    name: 'Claude Opus 4',
    provider: 'anthropic',
    deprecated: false,
    maxTokens: 200000,
    supportsFunctions: true,
    description: 'Máxima capacidade para tarefas complexas',
    releaseDate: '2025-05-15'
  },
  {
    id: 'claude-sonnet-4.5',
    name: 'Claude Sonnet 4.5',
    provider: 'anthropic',
    deprecated: false,
    maxTokens: 200000,
    supportsFunctions: true,
    description: 'Lançado em setembro 2025, com foco em codificação e uso de ferramentas',
    releaseDate: '2025-09-01'
  }
]

const GOOGLE_MODELS: ModelDefinition[] = [
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'google',
    deprecated: false,
    maxTokens: 1000000,
    supportsFunctions: true,
    description: 'Modelo mais capaz do Google com grande janela de contexto',
    releaseDate: '2024-02-15'
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'google',
    deprecated: false,
    maxTokens: 1000000,
    supportsFunctions: true,
    description: 'Velocidade extrema com janela de contexto ampla',
    releaseDate: '2024-05-14'
  },
  {
    id: 'gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash (Experimental)',
    provider: 'google',
    deprecated: false,
    maxTokens: 1000000,
    supportsFunctions: true,
    description: 'Nova geração experimental de velocidade e eficiência',
    releaseDate: '2024-12-11'
  }
]

// ============================================================================
// MODEL REGISTRY SERVICE
// ============================================================================

export class ModelRegistryService {
  private allModels: ModelDefinition[]

  constructor() {
    this.allModels = [
      ...OPENAI_MODELS,
      ...ANTHROPIC_MODELS,
      ...GOOGLE_MODELS
    ]
  }

  /**
   * Retorna todos os modelos disponíveis
   */
  getAllModels(): ModelDefinition[] {
    return this.allModels
  }

  /**
   * Retorna modelos de um provider específico
   */
  getModelsByProvider(provider: 'openai' | 'anthropic' | 'google'): ModelDefinition[] {
    return this.allModels.filter(m => m.provider === provider)
  }

  /**
   * Retorna apenas modelos não deprecados
   */
  getActiveModels(): ModelDefinition[] {
    return this.allModels.filter(m => !m.deprecated)
  }

  /**
   * Retorna apenas modelos não deprecados de um provider
   */
  getActiveModelsByProvider(provider: 'openai' | 'anthropic' | 'google'): ModelDefinition[] {
    return this.allModels.filter(m => m.provider === provider && !m.deprecated)
  }

  /**
   * Busca um modelo por ID
   */
  getModelById(modelId: string): ModelDefinition | undefined {
    return this.allModels.find(m => m.id === modelId)
  }

  /**
   * Retorna o modelo default para um provider
   */
  getDefaultModelForProvider(provider: 'openai' | 'anthropic' | 'google'): ModelDefinition | undefined {
    const activeModels = this.getActiveModelsByProvider(provider)
    
    // Retorna o primeiro modelo ativo (que geralmente é o mais econômico)
    if (provider === 'openai') {
      return activeModels.find(m => m.id === 'gpt-4o-mini') || activeModels[0]
    } else if (provider === 'anthropic') {
      return activeModels.find(m => m.id === 'claude-35-haiku-20241029') || activeModels[0]
    } else if (provider === 'google') {
      return activeModels.find(m => m.id === 'gemini-1.5-flash') || activeModels[0]
    }
    
    return activeModels[0]
  }

  /**
   * Detecta warnings para um modelo específico
   */
  getModelWarnings(modelId: string): ModelWarning[] {
    const model = this.getModelById(modelId)
    if (!model) return []

    const warnings: ModelWarning[] = []

    // Warning de modelo deprecado
    if (model.deprecated) {
      const replacement = model.replacementModel 
        ? this.getModelById(model.replacementModel)
        : null

      warnings.push({
        id: `deprecated-${modelId}`,
        type: 'deprecated',
        severity: 'warning',
        modelId: model.id,
        modelName: model.name,
        message: replacement
          ? `${model.name} está descontinuado. Recomendamos migrar para ${replacement.name}.`
          : `${model.name} está descontinuado.`,
        actionLabel: replacement ? `Mudar para ${replacement.name}` : undefined,
        replacementModelId: model.replacementModel,
        dismissible: true
      })
    }

    return warnings
  }

  /**
   * Detecta novos modelos lançados recentemente (últimos 60 dias)
   */
  getNewModels(daysThreshold: number = 60): ModelDefinition[] {
    const now = new Date()
    const thresholdDate = new Date(now.getTime() - daysThreshold * 24 * 60 * 60 * 1000)

    return this.allModels.filter(model => {
      if (!model.releaseDate) return false
      const releaseDate = new Date(model.releaseDate)
      return releaseDate >= thresholdDate && !model.deprecated
    })
  }

  /**
   * Gera warnings para novos modelos
   */
  getNewModelWarnings(daysThreshold: number = 60): ModelWarning[] {
    const newModels = this.getNewModels(daysThreshold)
    
    return newModels.map(model => ({
      id: `new-model-${model.id}`,
      type: 'new_model',
      severity: 'info',
      modelId: model.id,
      modelName: model.name,
      message: `Novo: ${model.name} disponível! ${model.description || ''}`,
      actionLabel: `Experimentar ${model.name}`,
      dismissible: true
    }))
  }

  /**
   * Retorna todos os warnings ativos (deprecados + novos)
   */
  getAllWarnings(userModelId?: string): ModelWarning[] {
    const warnings: ModelWarning[] = []

    // Warnings do modelo atual do usuário
    if (userModelId) {
      warnings.push(...this.getModelWarnings(userModelId))
    }

    // Warnings de novos modelos (últimos 30 dias)
    warnings.push(...this.getNewModelWarnings(30))

    return warnings
  }

  /**
   * Valida se um modelId existe e está ativo
   */
  isValidModel(modelId: string): boolean {
    const model = this.getModelById(modelId)
    return model !== undefined && !model.deprecated
  }

  /**
   * Retorna um modelo válido ou fallback para o default
   */
  getValidModelOrDefault(
    modelId: string,
    provider: 'openai' | 'anthropic' | 'google'
  ): ModelDefinition {
    const model = this.getModelById(modelId)
    
    // Se o modelo existe e está ativo, retorna ele
    if (model && !model.deprecated && model.provider === provider) {
      return model
    }

    // Se o modelo está deprecado, tenta retornar o replacement
    if (model?.deprecated && model.replacementModel) {
      const replacement = this.getModelById(model.replacementModel)
      if (replacement && !replacement.deprecated) {
        return replacement
      }
    }

    // Fallback para o modelo default do provider
    const defaultModel = this.getDefaultModelForProvider(provider)
    if (defaultModel) {
      return defaultModel
    }

    // Última opção: retorna o primeiro modelo ativo de qualquer provider
    const firstActive = this.getActiveModels()[0]
    if (firstActive) {
      return firstActive
    }

    // Se tudo falhar, retorna GPT-4.0 Mini (sempre deve existir)
    return OPENAI_MODELS[0]
  }
}

// Singleton instance
export const modelRegistry = new ModelRegistryService()

// Export das listas base para uso externo se necessário
export { OPENAI_MODELS, ANTHROPIC_MODELS, GOOGLE_MODELS }

