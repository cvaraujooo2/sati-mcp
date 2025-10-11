/**
 * Integração: Evento conversation_saved após o streaming
 *
 * Objetivo:
 * - Verificar que o backend emite o evento 'conversation_saved' com conversationId válido
 *
 * Base:
 * - Emissão ocorre após salvar a conversa no Supabase dentro do fluxo de streaming
 *   (ver POST handler e envio do evento conversation_saved).
 */

import { describe, it, expect } from 'vitest';
import { postChatAndCollectEvents } from '../utils/sse-client';

describe('Integração: conversation_saved', () => {
  it(
    'deve receber evento conversation_saved com conversationId após o stream',
    async () => {
      const body = {
        messages: [
          {
            id: crypto.randomUUID(),
            role: 'user' as const,
            content: 'Explique rapidamente como posso organizar um estudo de TypeScript.',
            timestamp: new Date().toISOString(),
            toolCalls: [],
            toolResults: [],
          },
        ],
        model: 'gpt-4o-mini',
        temperature: 0.5,
      };

      const result = await postChatAndCollectEvents({ body });

      // Valida que conversationId foi populado em algum momento do stream
      expect(result.conversationId).toBeTruthy();
      expect(typeof result.conversationId).toBe('string');
      expect((result.conversationId as string).length).toBeGreaterThan(10);
    },
    120_000
  );
});