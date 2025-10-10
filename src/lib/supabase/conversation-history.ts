import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  toolCalls?: ToolCall[]
  toolResults?: ToolResult[]
  metadata?: Record<string, any>
}

export interface ToolCall {
  id: string
  name: string
  parameters: Record<string, any>
  timestamp: Date
  status: 'pending' | 'executing' | 'completed' | 'error'
}

export interface ToolResult {
  id: string
  toolCallId: string
  result?: any
  error?: string
  timestamp: Date
}

export interface Conversation {
  id: string
  userId: string
  title: string
  createdAt: Date
  updatedAt: Date
  messages: ConversationMessage[]
}

/**
 * Gerenciamento de histórico de conversas integrado com Supabase
 * Baseado nos padrões do MCPJam/inspector
 */
export class ConversationHistoryManager {
  private supabase: SupabaseClient

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || createClient()
  }

  /**
   * Salva uma conversa completa no Supabase
   */
  async saveConversation(
    userId: string, 
    messages: ConversationMessage[],
    conversationId?: string
  ): Promise<string> {
    try {
      const now = new Date()
      
      // Gerar título baseado na primeira mensagem do usuário
      const firstUserMessage = messages.find(m => m.role === 'user')
      const title = firstUserMessage?.content.substring(0, 50) + '...' || 'Nova Conversa'
      
      const conversationData = {
        id: conversationId || crypto.randomUUID(),
        user_id: userId,
        title,
        messages: JSON.stringify(messages),
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      }

      if (conversationId) {
        // Update existing conversation
        const { error } = await this.supabase
          .from('conversations')
          .update({
            messages: conversationData.messages,
            updated_at: conversationData.updated_at
          })
          .eq('id', conversationId)
          .eq('user_id', userId)

        if (error) throw error
        return conversationId
      } else {
        // Create new conversation
        const { data, error } = await this.supabase
          .from('conversations')
          .insert(conversationData)
          .select('id')
          .single()

        if (error) throw error
        return data.id
      }
    } catch (error) {
      console.error('[ConversationHistory] Error saving conversation:', error)
      throw new Error('Failed to save conversation')
    }
  }

  /**
   * Carrega uma conversa específica
   */
  async loadConversation(conversationId: string, userId: string): Promise<Conversation | null> {
    try {
      const { data, error } = await this.supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single()

      if (error || !data) return null

      return {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        messages: JSON.parse(data.messages)
      }
    } catch (error) {
      console.error('[ConversationHistory] Error loading conversation:', error)
      return null
    }
  }

  /**
   * Lista conversas do usuário
   */
  async listConversations(userId: string, limit: number = 20): Promise<Conversation[]> {
    try {
      const { data, error } = await this.supabase
        .from('conversations')
        .select('id, title, created_at, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return data.map(item => ({
        id: item.id,
        userId,
        title: item.title,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
        messages: [] // Não carrega mensagens na lista
      }))
    } catch (error) {
      console.error('[ConversationHistory] Error listing conversations:', error)
      return []
    }
  }

  /**
   * Deleta uma conversa
   */
  async deleteConversation(conversationId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', userId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('[ConversationHistory] Error deleting conversation:', error)
      return false
    }
  }

  /**
   * Adiciona uma nova mensagem a uma conversa existente
   */
  async addMessageToConversation(
    conversationId: string,
    userId: string,
    message: ConversationMessage
  ): Promise<boolean> {
    try {
      // Load current conversation
      const conversation = await this.loadConversation(conversationId, userId)
      if (!conversation) return false

      // Add new message
      conversation.messages.push(message)
      conversation.updatedAt = new Date()

      // Save updated conversation
      await this.saveConversation(userId, conversation.messages, conversationId)
      return true
    } catch (error) {
      console.error('[ConversationHistory] Error adding message:', error)
      return false
    }
  }

  /**
   * Busca conversas por conteúdo (para contexto e continuidade)
   */
  async searchConversations(
    userId: string,
    query: string,
    limit: number = 10
  ): Promise<Conversation[]> {
    try {
      const { data, error } = await this.supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .textSearch('messages', query, { type: 'websearch' })
        .order('updated_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return data.map(item => ({
        id: item.id,
        userId: item.user_id,
        title: item.title,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
        messages: JSON.parse(item.messages)
      }))
    } catch (error) {
      console.error('[ConversationHistory] Error searching conversations:', error)
      return []
    }
  }
}

/**
 * Função helper para detectar tool calls não resolvidos
 * Baseada no MCPJam/inspector
 */
export function hasUnresolvedToolCallsInConversation(messages: ConversationMessage[]): boolean {
  const toolCallIds = new Set<string>()
  const toolResultIds = new Set<string>()

  for (const msg of messages) {
    if (msg.role === 'assistant' && msg.toolCalls) {
      for (const toolCall of msg.toolCalls) {
        toolCallIds.add(toolCall.id)
      }
    }
    
    if (msg.toolResults) {
      for (const toolResult of msg.toolResults) {
        toolResultIds.add(toolResult.toolCallId)
      }
    }
  }

  // Verifica se há tool calls sem resultados
  for (const id of toolCallIds) {
    if (!toolResultIds.has(id)) return true
  }
  
  return false
}

/**
 * Função helper para restaurar contexto de uma conversa anterior
 */
export function buildContextFromConversation(conversation: Conversation): string {
  const recentMessages = conversation.messages.slice(-10) // Últimas 10 mensagens
  
  let context = `Contexto da conversa anterior (${conversation.title}):\n\n`
  
  for (const msg of recentMessages) {
    context += `${msg.role === 'user' ? 'Usuário' : 'Assistente'}: ${msg.content}\n`
    
    if (msg.toolCalls?.length) {
      context += `Ferramentas usadas: ${msg.toolCalls.map(tc => tc.name).join(', ')}\n`
    }
  }
  
  return context + '\n---\n'
}