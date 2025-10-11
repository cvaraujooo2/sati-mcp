/* @vitest-environment jsdom */

/**
 * UI: TaskBreakdown - fallback por props, sincronização via toolOutput e interações
 *
 * Objetivos:
 * - Renderizar com props (sem toolOutput) e validar contagem/progresso
 * - Simular mudança de toolOutput via evento SET_GLOBALS_EVENT_TYPE e validar sincronização
 * - Mockar window.openai.callTool para toggle de tarefas e validar atualização
 */

import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { TaskBreakdown } from '@/components/TaskBreakdown';
import { SET_GLOBALS_EVENT_TYPE } from '@/components/hooks/useOpenAi';

type Task = { id: string; title: string; completed: boolean };

function dispatchSetGlobals(partial: Partial<{ toolOutput: unknown; theme: 'light' | 'dark' }>) {
  // Garante window.openai com campos mínimos
  (window as any).openai = {
    ...(window as any).openai,
    theme: partial.theme ?? ((window as any).openai?.theme ?? 'light'),
    userAgent: (window as any).openai?.userAgent ?? {
      device: { type: 'desktop' },
      capabilities: { hover: true, touch: false },
    },
    locale: (window as any).openai?.locale ?? 'pt-BR',
    maxHeight: (window as any).openai?.maxHeight ?? 600,
    displayMode: (window as any).openai?.displayMode ?? 'inline',
    safeArea: (window as any).openai?.safeArea ?? {
      insets: { top: 0, bottom: 0, left: 0, right: 0 },
    },
    toolInput: (window as any).openai?.toolInput ?? {},
    toolOutput: partial.toolOutput ?? ((window as any).openai?.toolOutput ?? null),
    toolResponseMetadata: (window as any).openai?.toolResponseMetadata ?? null,
    widgetState: (window as any).openai?.widgetState ?? null,
    // callTool será definido/mocado nos testes conforme necessário
    callTool: (window as any).openai?.callTool ?? (async () => ({ result: {} })),
  };

  const event = new CustomEvent(SET_GLOBALS_EVENT_TYPE, {
    detail: { globals: { toolOutput: (window as any).openai.toolOutput, theme: (window as any).openai.theme } },
  });
  window.dispatchEvent(event);
}

describe('UI: TaskBreakdown - fallback via props', () => {
  it('renderiza lista e progresso com props sem depender de toolOutput', () => {
    const propsTasks: Task[] = [
      { id: 't1', title: 'Configurar ambiente', completed: false },
      { id: 't2', title: 'Ler documentação', completed: false },
    ];

    render(<TaskBreakdown hyperfocusId="hf-1" hyperfocusTitle="Estudo React" tasks={propsTasks} />);

    // Header e progresso
    expect(screen.getByText(/Estudo React - Tarefas/i)).toBeInTheDocument();
    // Progresso esperado: 0/2 (0%)
    expect(screen.getByText(/Progresso/i)).toBeInTheDocument();
    expect(screen.getByText(/0\/2 \(0%\)/)).toBeInTheDocument();

    // Itens da lista
    expect(screen.getByText(/1\. Configurar ambiente/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. Ler documentação/i)).toBeInTheDocument();
  });
});

describe('UI: TaskBreakdown - sincronização via toolOutput', () => {
  it('sincroniza quando toolOutput.tasks é atualizado via evento SET_GLOBALS', () => {
    const initialProps: Task[] = [{ id: 't1', title: 'Inicial', completed: false }];

    // Inicialmente sem toolOutput
    render(<TaskBreakdown hyperfocusId="hf-1" hyperfocusTitle="Projeto X" tasks={initialProps} />);

    // Confere estado inicial
    expect(screen.getByText(/Projeto X - Tarefas/i)).toBeInTheDocument();
    expect(screen.getByText(/0\/1 \(0%\)/)).toBeInTheDocument();
    expect(screen.getByText(/1\. Inicial/i)).toBeInTheDocument();

    // Atualiza toolOutput com 3 tarefas
    const toolOutput = {
      hyperfocusId: 'hf-1',
      hyperfocusTitle: 'Projeto X',
      tasks: [
        { id: 'a', title: 'Tarefa A', completed: false },
        { id: 'b', title: 'Tarefa B', completed: true },
        { id: 'c', title: 'Tarefa C', completed: false },
      ],
    };
    dispatchSetGlobals({ toolOutput });

    // Deve sincronizar: agora 1/3 (33%)
    expect(screen.getByText(/1\/3 \(33%\)/)).toBeInTheDocument();
    expect(screen.getByText(/1\. Tarefa A/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. Tarefa B/i)).toBeInTheDocument();
    expect(screen.getByText(/3\. Tarefa C/i)).toBeInTheDocument();
  });
});

describe('UI: TaskBreakdown - interações com toggle usando window.openai.callTool', () => {
  it('alternar tarefa chama callTool e sincroniza com resposta', async () => {
    const initialTasks: Task[] = [
      { id: 't1', title: 'Ler artigo', completed: false },
      { id: 't2', title: 'Fazer resumo', completed: false },
    ];

    // Mock de callTool: retorna lista atualizada com t1.completed invertido
    const mockCallTool = vi.fn(async (_name: string, args: Record<string, unknown>) => {
      const completed = Boolean(args.completed);
      const updated: Task[] = [
        { id: 't1', title: 'Ler artigo', completed },
        { id: 't2', title: 'Fazer resumo', completed: false },
      ];
      return {
        result: {
          component: {
            name: 'TaskBreakdown',
            props: {
              hyperfocusId: args.hyperfocusId,
              hyperfocusTitle: 'Estudo',
              tasks: updated,
            },
          },
        },
      };
    });

    // Inicializa window.openai com mock
    dispatchSetGlobals({ toolOutput: null });
    (window as any).openai.callTool = mockCallTool;

    render(<TaskBreakdown hyperfocusId="hf-1" hyperfocusTitle="Estudo" tasks={initialTasks} />);

    // Estado inicial
    expect(screen.getByText(/0\/2 \(0%\)/)).toBeInTheDocument();

    // Clique no primeiro item para alternar completed
    const item = screen.getByText(/1\. Ler artigo/i).closest('button');
    expect(item).toBeTruthy();
    if (item) {
      fireEvent.click(item);
    }

    // Após toggle, progresso deve ser 1/2 (50%)
    expect(await screen.findByText(/1\/2 \(50%\)/)).toBeInTheDocument();

    // Verifica que callTool foi chamado com nome e args esperados
    expect(mockCallTool).toHaveBeenCalledTimes(1);
    const args = mockCallTool.mock.calls[0][1];
    expect(args).toMatchObject({
      hyperfocusId: 'hf-1',
      taskId: 't1',
      completed: true,
    });
  });
});

describe('UI: TaskBreakdown - adicionar tarefa via callTool', () => {
  it('adiciona tarefa e sincroniza com resposta do callTool', async () => {
    const initialTasks: Task[] = [{ id: 't1', title: 'Base', completed: false }];

    // Mock de createTask: adiciona nova tarefa 'Nova'
    const mockCallTool = vi.fn(async (name: string, args: Record<string, unknown>) => {
      if (name !== 'createTask') {
        return { result: {} };
      }
      const updated: Task[] = [
        { id: 't1', title: 'Base', completed: false },
        { id: 't-new', title: String(args.title ?? 'Nova'), completed: false },
      ];
      return {
        result: {
          component: {
            name: 'TaskBreakdown',
            props: {
              hyperfocusId: args.hyperfocusId,
              hyperfocusTitle: 'Estudo',
              tasks: updated,
            },
          },
        },
      };
    });

    // Inicializa window.openai
    dispatchSetGlobals({ toolOutput: null });
    (window as any).openai.callTool = mockCallTool;

    render(<TaskBreakdown hyperfocusId="hf-1" hyperfocusTitle="Estudo" tasks={initialTasks} />);

    // Abrir UI de adicionar tarefa
    const addButton = screen.getByRole('button', { name: /Adicionar tarefa/i });
    fireEvent.click(addButton);

    // Preencher input e confirmar
    const input = screen.getByPlaceholderText(/Nome da tarefa\.\.\./i);
    fireEvent.change(input, { target: { value: 'Nova' } });

    const confirm = screen.getByRole('button', { name: /Adicionar/i });
    fireEvent.click(confirm);

    // Deve aparecer 2/2 (100%)? Não, ambas incompletas, então 0/2 (0%).
    // Mas validamos que a nova tarefa aparece.
    expect(await screen.findByText(/2\. Nova/i)).toBeInTheDocument();

    // callTool chamado com createTask e args esperados
    const call = mockCallTool.mock.calls.find((c: any[]) => c[0] === 'createTask');
    expect(call).toBeTruthy();
    if (call) {
      expect(call[1]).toMatchObject({
        hyperfocusId: 'hf-1',
        title: 'Nova',
      });
    }
  });
});