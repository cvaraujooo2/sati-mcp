import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/settings/validate-key
 * 
 * Valida uma API key no backend de forma segura.
 * A key nunca é exposta no cliente após a validação.
 */

interface ValidateKeyRequest {
  provider: 'openai' | 'anthropic' | 'google' | 'deepseek'
  apiKey: string
}

interface ValidateKeyResponse {
  isValid: boolean
  error?: string
  model?: string
  organization?: string
}

export async function POST(req: NextRequest) {
  try {
    // 1. Verificar autenticação
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Validar request body
    const body: ValidateKeyRequest = await req.json()
    const { provider, apiKey } = body

    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: 'Missing provider or apiKey' },
        { status: 400 }
      )
    }

    // 3. Validar API key baseado no provider
    let result: ValidateKeyResponse

    switch (provider) {
      case 'openai':
        result = await validateOpenAIKey(apiKey)
        break
      
      case 'anthropic':
        result = await validateAnthropicKey(apiKey)
        break
      
      case 'google':
        result = await validateGoogleKey(apiKey)
        break
      
      case 'deepseek':
        result = await validateDeepSeekKey(apiKey)
        break
      
      default:
        return NextResponse.json(
          { error: 'Unsupported provider' },
          { status: 400 }
        )
    }

    // 4. Retornar resultado (SEM a key)
    return NextResponse.json({
      isValid: result.isValid,
      error: result.error,
      model: result.model,
      organization: result.organization,
    })

  } catch (error) {
    console.error('[Validate Key API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Valida uma API key da OpenAI
 */
async function validateOpenAIKey(apiKey: string): Promise<ValidateKeyResponse> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[OpenAI Validation] Error:', response.status, errorText)
      
      if (response.status === 401) {
        return {
          isValid: false,
          error: 'API key inválida. Verifique se copiou corretamente.',
        }
      }
      
      if (response.status === 429) {
        return {
          isValid: false,
          error: 'Muitas requisições. Aguarde um momento e tente novamente.',
        }
      }

      return {
        isValid: false,
        error: `Erro ao validar: ${response.status}`,
      }
    }

    const data = await response.json()
    
    // Verificar se tem acesso aos modelos necessários
    const hasGPT4 = data.data?.some((model: any) => 
      model.id.includes('gpt-4') || model.id.includes('gpt-3.5')
    )

    if (!hasGPT4) {
      return {
        isValid: false,
        error: 'API key não tem acesso aos modelos GPT-4 ou GPT-3.5',
      }
    }

    // Pegar primeiro modelo GPT-4 disponível
    const gpt4Model = data.data?.find((model: any) => 
      model.id.includes('gpt-4')
    )

    return {
      isValid: true,
      model: gpt4Model?.id || data.data?.[0]?.id || 'gpt-4',
    }

  } catch (error) {
    console.error('[OpenAI Validation] Network error:', error)
    return {
      isValid: false,
      error: 'Erro de conexão. Verifique sua internet.',
    }
  }
}

/**
 * Valida uma API key da Anthropic
 */
async function validateAnthropicKey(apiKey: string): Promise<ValidateKeyResponse> {
  try {
    // Endpoint mínimo para validar a key
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    })

    if (response.status === 401) {
      return {
        isValid: false,
        error: 'API key inválida',
      }
    }

    if (response.ok || response.status === 400) {
      // 400 é ok, significa que a key é válida mas a requisição tem problema
      return {
        isValid: true,
        model: 'claude-3-5-sonnet-20241022',
      }
    }

    return {
      isValid: false,
      error: `Erro ${response.status}`,
    }

  } catch (error) {
    return {
      isValid: false,
      error: 'Erro de conexão',
    }
  }
}

/**
 * Valida uma API key do Google AI
 */
async function validateGoogleKey(apiKey: string): Promise<ValidateKeyResponse> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`,
      {
        method: 'GET',
      }
    )

    if (!response.ok) {
      return {
        isValid: false,
        error: response.status === 401 ? 'API key inválida' : `Erro ${response.status}`,
      }
    }

    const data = await response.json()
    const hasGemini = data.models?.some((model: any) => 
      model.name.includes('gemini')
    )

    if (!hasGemini) {
      return {
        isValid: false,
        error: 'API key não tem acesso aos modelos Gemini',
      }
    }

    return {
      isValid: true,
      model: 'gemini-pro',
    }

  } catch (error) {
    return {
      isValid: false,
      error: 'Erro de conexão',
    }
  }
}

/**
 * Valida uma API key da DeepSeek
 */
async function validateDeepSeekKey(apiKey: string): Promise<ValidateKeyResponse> {
  try {
    const response = await fetch('https://api.deepseek.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      return {
        isValid: false,
        error: response.status === 401 ? 'API key inválida' : `Erro ${response.status}`,
      }
    }

    return {
      isValid: true,
      model: 'deepseek-chat',
    }

  } catch (error) {
    return {
      isValid: false,
      error: 'Erro de conexão',
    }
  }
}
