/**
 * Integração: Sanitização do histórico (mensagens contendo toolCalls/toolResults)
 *
 * Objetivo:
 * - Garantir que o backend aceita mensagens com campos toolCalls/toolResults no corpo
 * - Validar que o streaming ocorre sem erros e eventos 'text' são emitidos
 *
 * Base técnica:
 * - Sanitização em buildMessageHistory: mantém apenas texto (ver [buildMessageHistory()](src/app/api/chat/route.ts:227))
 * - Validações de shape antes de streamText (ver logs em [createMultiStepStreamingResponse()](src/app/api/chat/route.ts:596))
 */

import { describe, it, expect } from 'vitest';
import { postChatAndCollectEvents } from '../utils/sse-client';

describe('Integração: Sanitização do histórico', () => {
  it(
    'deve processar mensagens contendo toolCalls/toolResults sem falhar e emitir eventos de texto',
    async () => {
      const body = {
        messages: [
          {
            id: crypto.randomUUID(),
            role: 'user' as const,
            content: 'Quero ajuda para organizar meu estudo de arquitetura de software.',
            timestamp: new Date().toISOString(),
            // Campos extras simulados no payload (não devem quebrar o streaming)
            toolCalls: [
              {
                id: 'fake-call-1',
                name: 'createHyperfocus',
                parameters: { title: 'Estudar Arquitetura', description: 'Camadas, padrões, DDD' },
                timestamp: new Date().toISOString(),
                status: 'pending' as const,
              },
            ],
            toolResults: [
              {
                id: 'fake-result-1',
                toolCallId: 'fake-call-1',
                result: { ok: true },
                timestamp: new Date().toISOString(),
              },
            ],
          },
        ],
        model: 'gpt-4o-mini',
        temperature: 0.4,
      };

      const result = await postChatAndCollectEvents({ body });

      // Não conseguiríamos detectar HTTP 4xx/5xx aqui porque já teríamos exception.
      // Se chegamos até aqui, o streaming ocorreu. Validar que houve pelo menos um evento de texto.
      expect(result.textEvents.length).toBeGreaterThan(0);
    },
    120_000
  );
});