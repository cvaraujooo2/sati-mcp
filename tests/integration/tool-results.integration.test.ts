/**
 * Integração: Pareamento tool_call ↔ tool_result e IDs válidos
 *
 * Objetivo:
 * - Verificar que nenhum ID "undefined" é emitido
 * - Confirmar correspondência de pares: toolCall.id === toolResult.toolCallId
 * - Assegurar pelo menos um tool_result no fluxo
 *
 * Estratégia:
 * - Solicitar explicitamente o uso de uma ferramenta (createHyperfocus)
 * - Usar o cliente SSE reutilizável para coletar eventos do stream
 */

import { describe, it, expect } from 'vitest';
import {
  postChatAndCollectEvents,
  hasUndefinedIds,
  toolCallResultPairsMatch,
  type SseEvent
} from '../utils/sse-client';

function countToolResults(events: SseEvent[]): number {
  return events.filter((e) => e.type === 'tool_result').length;
}

describe('Integração: Pareamento de tool_call ↔ tool_result', () => {
  it(
    'deve emitir IDs válidos e parear corretamente os eventos',
    async () => {
      const body = {
        messages: [
          {
            id: crypto.randomUUID(),
            role: 'user' as const,
            // Instruções explícitas para o agente usar a ferramenta createHyperfocus.
            content:
              'Use a ferramenta createHyperfocus para criar um hiperfoco chamado "Debug Pareamento" ' +
              'com descrição "Validar pareamento tool_call/result" e cor verde. ' +
              'Em seguida responda ao usuário resumindo a criação.',
            timestamp: new Date().toISOString(),
            toolCalls: [],
            toolResults: []
          }
        ],
        model: 'gpt-4o-mini',
        temperature: 0.2
      };

      const result = await postChatAndCollectEvents({ body });

      // Deve haver pelo menos um resultado de ferramenta no stream
      const toolResultCount = countToolResults(result.events);
      expect(toolResultCount).toBeGreaterThan(0);

      // IDs nunca devem estar "undefined"
      expect(hasUndefinedIds(result)).toBe(false);

      // Correspondência entre chamadas e resultados deve ser verdadeira
      expect(toolCallResultPairsMatch(result)).toBe(true);
    },
    120_000
  );
});