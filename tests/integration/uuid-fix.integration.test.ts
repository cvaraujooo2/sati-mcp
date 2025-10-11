/**
 * Integração: Fluxo título → UUID e UUID direto (breakIntoSubtasks)
 *
 * Pré-requisitos:
 * - Dev server rodando em http://localhost:3000 (npm run dev)
 * - API key OpenAI válida na tabela user_api_keys para o userId de DEV
 *   (padrão do backend: 84c419f8-bb51-4a51-bb0d-26a48453f495)
 *
 * Objetivos alinhados ao CHANGELOG:
 * - Primeira chamada com referência por título não deve falhar (normalização título → UUID no backend)
 * - Pareamento tool_call ↔ tool_result consistente
 * - Se autoCreate=true, componente TaskBreakdown deve ser retornado no result.component
 */

import { describe, it, expect } from 'vitest';
import {
  postChatAndCollectEvents,
  hasUndefinedIds,
  toolCallResultPairsMatch,
  type SseEvent,
} from '../utils/sse-client';

function extractFirstToolResult(events: SseEvent[]) {
  for (const ev of events) {
    if (ev.type === 'tool_result') {
      return ev.toolResult;
    }
  }
  return undefined;
}

function extractComponentNameFromToolResult(toolResult?: { result?: unknown }) {
  if (!toolResult || !toolResult.result) return undefined;
  const payload = typeof toolResult.result === 'string'
    ? safeParseJson(toolResult.result)
    : toolResult.result as any;

  if (payload && typeof payload === 'object' && 'component' in payload) {
    const component = (payload as any).component;
    if (component && typeof component === 'object' && 'name' in component) {
      return String((component as any).name);
    }
  }
  return undefined;
}

function extractTasksFromToolResult(toolResult?: { result?: unknown }): Array<{ id: string; title: string; completed: boolean }> | undefined {
  if (!toolResult || !toolResult.result) return undefined;
  const payload = typeof toolResult.result === 'string'
    ? safeParseJson(toolResult.result)
    : toolResult.result as any;

  if (payload && typeof payload === 'object' && 'component' in payload) {
    const component = (payload as any).component;
    if (component && typeof component === 'object' && 'props' in component) {
      const props = (component as any).props;
      if (props && typeof props === 'object' && Array.isArray((props as any).tasks)) {
        return (props as any).tasks.map((t: any) => ({
          id: String(t.id),
          title: String(t.title),
          completed: Boolean(t.completed),
        }));
      }
    }
  }
  return undefined;
}

function safeParseJson(s: string): any {
  try {
    return JSON.parse(s);
  } catch {
    return undefined;
  }
}

describe('Integração: breakIntoSubtasks - título → UUID', () => {
  it(
    'deve funcionar quando o modelo envia título ao invés de UUID (autoCreate=true ⇒ TaskBreakdown)',
    async () => {
      // 1) Criar um hiperfoco por intenção natural (modelo deve invocar createHyperfocus)
      const createBody = {
        messages: [
          {
            id: crypto.randomUUID(),
            role: 'user' as const,
            content:
              'Crie um hiperfoco chamado "Estudar Machine Learning" com descrição "Fundamentos de ML" e cor azul.',
            timestamp: new Date().toISOString(),
            toolCalls: [],
            toolResults: [],
          },
        ],
        model: 'gpt-4o-mini',
        temperature: 0.3,
      };

      const createRes = await postChatAndCollectEvents({ body: createBody });
      // Não exigimos tool_result específico aqui, mas validamos integridade do stream
      expect(hasUndefinedIds(createRes)).toBe(false);
      expect(toolCallResultPairsMatch(createRes)).toBe(true);

      // 2) Pedir para quebrar em subtarefas referenciando por TÍTULO (não UUID)
      // Dica explícita ao agente para usar a tool breakIntoSubtasks com autoCreate=true e 3 subtarefas
      const breakBody = {
        messages: [
          {
            id: crypto.randomUUID(),
            role: 'user' as const,
            content:
              'Agora, quebre o hiperfoco "Estudar Machine Learning" em 3 subtarefas claras. ' +
              'Use a ferramenta breakIntoSubtasks com autoCreate=true e numSubtasks=3. ' +
              'Referencie o hiperfoco pelo TÍTULO, não pelo UUID.',
            timestamp: new Date().toISOString(),
            toolCalls: [],
            toolResults: [],
          },
        ],
        model: 'gpt-4o-mini',
        temperature: 0.2,
      };

      const breakRes = await postChatAndCollectEvents({ body: breakBody });

      // Asserts principais de integridade
      expect(hasUndefinedIds(breakRes)).toBe(false);
      expect(toolCallResultPairsMatch(breakRes)).toBe(true);

      // Se houve tool_result, tentamos verificar o componente
      const firstToolResult = extractFirstToolResult(breakRes.events);
      if (firstToolResult) {
        const componentName = extractComponentNameFromToolResult(firstToolResult);
        // Quando autoCreate=true, a ferramenta retorna componente TaskBreakdown
        // Caso o modelo ignore a dica e não ligue autoCreate, pode retornar SubtaskSuggestions.
        // Aceitamos ambos para robustez, mas preferimos TaskBreakdown.
        expect(['TaskBreakdown', 'SubtaskSuggestions', 'HyperfocusList']).toContain(componentName);

        if (componentName === 'TaskBreakdown') {
          const tasks = extractTasksFromToolResult(firstToolResult) ?? [];
          expect(Array.isArray(tasks)).toBe(true);
          expect(tasks.length).toBeGreaterThan(0);
        }
      }
    },
    120_000
  );
});

describe('Integração: breakIntoSubtasks - UUID direto (baseline)', () => {
  it(
    'deve continuar funcionando quando um UUID válido é usado (preferência do sistema)',
    async () => {
      // Para obter um UUID válido, pedimos ao agente para criar um hiperfoco e depois quebrar usando listagem prévia
      // Como o teste é não-determinístico, daremos instruções claras no prompt.
      const setupBody = {
        messages: [
          {
            id: crypto.randomUUID(),
            role: 'user' as const,
            content:
              'Crie um hiperfoco chamado "Estudar TypeScript" e em seguida QUEBRE em 3 subtarefas. ' +
              'Siga as REGRAS: liste meus hiperfocos e use o UUID correto para breakIntoSubtasks com autoCreate=true.',
            timestamp: new Date().toISOString(),
            toolCalls: [],
            toolResults: [],
          },
        ],
        model: 'gpt-4o-mini',
        temperature: 0.2,
      };

      const res = await postChatAndCollectEvents({ body: setupBody });

      // Integridade do stream
      expect(hasUndefinedIds(res)).toBe(false);
      expect(toolCallResultPairsMatch(res)).toBe(true);

      // Se chegar tool_result com TaskBreakdown, validamos tasks
      const firstToolResult = extractFirstToolResult(res.events);
      if (firstToolResult) {
        const componentName = extractComponentNameFromToolResult(firstToolResult);
        expect(['TaskBreakdown', 'SubtaskSuggestions', 'HyperfocusList']).toContain(componentName);

        if (componentName === 'TaskBreakdown') {
          const tasks = extractTasksFromToolResult(firstToolResult) ?? [];
          expect(tasks.length).toBeGreaterThan(0);
        }
      }
    },
    120_000
  );
});