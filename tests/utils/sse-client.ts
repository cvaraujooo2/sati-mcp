/**
 * SSE Client Util para testes de integração do SATI
 * Lê o stream SSE do endpoint /api/chat e retorna eventos tipados.
 *
 * Uso principal: postChatAndCollectEvents({ body })
 *
 * Referências:
 * - Emissão de eventos SSE no backend: ver sendSseEvent em src/app/api/chat/route.ts
 * - Tipos de eventos usados no stream: 'text', 'tool_call', 'tool_result', 'conversation_saved'
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string | Date;
  toolCalls?: Array<{
    id: string;
    name: string;
    parameters: Record<string, unknown>;
    timestamp: string | Date;
    status: 'pending' | 'executing' | 'completed' | 'error';
  }>;
  toolResults?: Array<{
    id: string;
    toolCallId: string;
    result?: unknown;
    error?: string;
    timestamp: string | Date;
  }>;
}

export interface ChatRequestBody {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  systemPrompt?: string;
  conversationId?: string;
  continueFromHistory?: boolean;
}

export type SseEvent =
  | {
    type: 'text';
    content: string;
  }
  | {
    type: 'tool_call';
    toolCall: {
      id: number;
      name: string;
      parameters: Record<string, unknown>;
      timestamp: string;
      status: 'executing' | 'pending' | 'completed' | 'error';
    };
  }
  | {
    type: 'tool_result';
    toolResult: {
      id: string;
      toolCallId: string;
      result?: unknown;
      error?: string;
      timestamp: string;
    };
  }
  | {
    type: 'conversation_saved';
    conversationId: string;
    timestamp: string;
  }
  | {
    type: 'error';
    error: string;
  };

export interface PostChatOptions {
  body: ChatRequestBody;
  baseUrl?: string; // default: http://localhost:3000
  path?: string; // default: /api/chat
  headers?: Record<string, string>;
  timeoutMs?: number; // timeout de leitura do stream
}

export interface SseResult {
  events: SseEvent[];
  textEvents: string[];
  toolCalls: Array<{
    id: number;
    name: string;
    status: string;
    parameters?: Record<string, unknown>;
  }>;
  toolResults: Array<{
    id: string;
    toolCallId: string;
    hasResult: boolean;
    hasError: boolean;
  }>;
  conversationId?: string;
}

/**
 * Faz POST para /api/chat e coleta os eventos SSE até receber [DONE] ou o stream encerrar.
 */
export async function postChatAndCollectEvents(options: PostChatOptions): Promise<SseResult> {
  const {
    body,
    baseUrl = 'http://localhost:3000',
    path = '/api/chat',
    headers = { 'Content-Type': 'application/json' },
    timeoutMs = 60000,
  } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok || !response.body) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = '';
    const events: SseEvent[] = [];
    const textEvents: string[] = [];
    const toolCalls: SseResult['toolCalls'] = [];
    const toolResults: SseResult['toolResults'] = [];
    let conversationId: string | undefined;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;

        const data = line.substring(6);
        if (data === '[DONE]') {
          // stream encerrado pelo servidor
          continue;
        }

        try {
          const event = JSON.parse(data) as SseEvent;
          events.push(event);

          if (event.type === 'text') {
            textEvents.push(event.content);
          } else if (event.type === 'tool_call') {
            toolCalls.push({
              id: event.toolCall.id,
              name: event.toolCall.name,
              status: event.toolCall.status,
              parameters: event.toolCall.parameters,
            });
          } else if (event.type === 'tool_result') {
            toolResults.push({
              id: event.toolResult.id,
              toolCallId: event.toolResult.toolCallId,
              hasResult: !!event.toolResult.result,
              hasError: !!event.toolResult.error,
            });
          } else if (event.type === 'conversation_saved') {
            conversationId = event.conversationId;
          }
        } catch {
          // Ignora erros de parse e continua
        }
      }
    }

    return {
      events,
      textEvents,
      toolCalls,
      toolResults,
      conversationId,
    };
  } finally {
    clearTimeout(timeout);
    controller.abort();
  }
}

/**
 * Helpers para facilitar asserts nos testes
 */
export function getLastToolCallName(result: SseResult): string | undefined {
  return result.toolCalls.length ? result.toolCalls[result.toolCalls.length - 1].name : undefined;
}

export function hasUndefinedIds(result: SseResult): boolean {
  return result.toolResults.some(
    (r) => r.id.includes('undefined') || r.toolCallId.includes('undefined'),
  );
}

export function toolCallResultPairsMatch(result: SseResult): boolean {
  const min = Math.min(result.toolCalls.length, result.toolResults.length);
  for (let i = 0; i < min; i++) {
    const call = result.toolCalls[i];
    const res = result.toolResults[i];
    if (String(call.id) !== String(res.toolCallId)) {
      return false;
    }
  }
  return true;
}