"use client";

import { useState, useMemo } from "react";
import { ChatInterface } from "@/app/components/chat/ChatInterface";
import { ChatMessage } from "@/lib/chat/types";

// Importar componentes SATI
import { HyperfocusCard } from "@/app/components/HyperfocusCard";
import { HyperfocusList } from "@/app/components/HyperfocusList";
import { TaskBreakdown } from "@/app/components/TaskBreakdown";
import { FocusTimer } from "@/app/components/FocusTimer";
import { SubtaskSuggestions } from "@/app/components/SubtaskSuggestions";
import { ContextAnalysis } from "@/app/components/ContextAnalysis";
import { AlternancyFlow } from "@/app/components/AlternancyFlow";
import { FocusSessionSummary } from "@/app/components/FocusSessionSummary";

// Definir tipos
interface ToolDemoConfig {
  label: string;
  description: string;
  component: React.JSX.Element;
}

// Definir tipo Message para o simulador
interface Message extends Omit<ChatMessage, 'timestamp'> {
  timestamp: Date; // Manter consistência com ChatMessage
  component?: React.JSX.Element;
}

// Função helper para criar mensagens
function createSimulatorMessage(
  role: "user" | "assistant" | "system",
  content: string,
  component?: React.JSX.Element
): Message {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    timestamp: new Date(),
    attachments: [],
    toolCalls: [],
    toolResults: [],
    contentBlocks: [],
    component,
  };
}

const TOOL_DEMOS: Record<string, ToolDemoConfig> = {
  create_hyperfocus: {
    label: "Hyperfocus Card",
    description: "Visualiza o card criado após a tool create_hyperfocus.",
    component: <HyperfocusCard />,
  },
  list_hyperfocus: {
    label: "Lista de Hyperfocos",
    description: "Simula a listagem de hiperfocos com tarefas e ações.",
    component: <HyperfocusList />,
  },
  task_breakdown: {
    label: "Quebra de Tarefas",
    description: "Mostra a visão TaskBreakdown com progresso e tarefas.",
    component: <TaskBreakdown />,
  },
  focus_timer: {
    label: "Timer de Foco",
    description: "Renderiza o componente de timer completo da sessão.",
    component: <FocusTimer />,
  },
  subtask_suggestions: {
    label: "Sugestões de Subtarefas",
    description: "Visualiza as sugestões de subtarefas selecionáveis.",
    component: <SubtaskSuggestions />,
  },
  context_analysis: {
    label: "Análise de Contexto",
    description: "Mostra o componente de análise contextual gerado pela tool.",
    component: <ContextAnalysis />,
  },
  alternancy_flow: {
    label: "Alternância",
    description: "Simula o fluxo de alternância entre hiperfocos.",
    component: <AlternancyFlow />,
  },
  focus_summary: {
    label: "Resumo da Sessão",
    description: "Renderiza o resumo pós-foco com estatísticas.",
    component: <FocusSessionSummary />,
  },
};

const INITIAL_MESSAGES: Message[] = [
  createSimulatorMessage("assistant", `Olá! 👋 Eu sou o **SATI**, seu assistente de produtividade especializado em neurodivergentes.

🎯 **O que posso fazer por você:**

• **Criar hiperfocos** - Projetos intensos e focados
• **Quebrar tarefas** - Dividir trabalho complexo em partes menores  
• **Gerenciar timer** - Sessões de foco com alternância
• **Análise de contexto** - Sugestões personalizadas
• **Fluxos de alternância** - Estratégias para manter o foco

Experimente me perguntar algo como:
- "Crie um hiperfoco para estudar React"
- "Quebre esta tarefa em partes menores: desenvolver uma API"
- "Inicie um timer de 25 minutos"
- "Analise meu contexto atual"`),
  createSimulatorMessage("user", "Quero me concentrar em criar o simulador do SATI."),
  createSimulatorMessage("assistant", "Posso ajudar com um plano e iniciar uma sessão de foco. Deseja visualizar algum componente?"),
];

export default function MCPSimulatorPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const availableTools = useMemo(() => Object.entries(TOOL_DEMOS), []);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMessage = createSimulatorMessage("user", trimmed);

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    simulateAssistantResponse(trimmed);
  };

  const simulateToolRun = (toolId: string) => {
    const tool = TOOL_DEMOS[toolId];
    if (!tool) return;

    const toolMessage = createSimulatorMessage(
      "assistant", 
      `SATI renderizou o componente "${tool.label}".`,
      tool.component
    );

    setMessages((prev) => [...prev, toolMessage]);
  };

  const simulateAssistantResponse = (prompt: string) => {
    setIsThinking(true);

    const normalized = prompt.toLowerCase();
    const key = normalized.includes("lista")
      ? "list_hyperfocus"
      : normalized.includes("timer")
      ? "focus_timer"
      : normalized.includes("altern\u00e2ncia")
      ? "alternancy_flow"
      : normalized.includes("resumo")
      ? "focus_summary"
      : normalized.includes("an\u00e1lise")
      ? "context_analysis"
      : normalized.includes("subtarefa")
      ? "subtask_suggestions"
      : normalized.includes("quebrar")
      ? "task_breakdown"
      : "create_hyperfocus";

    const tool = TOOL_DEMOS[key];

    const assistantMessage = createSimulatorMessage(
      "assistant",
      `Aqui está uma visualização simulada: ${tool.label}.`,
      tool.component
    );

    setTimeout(() => {
      setMessages((prev) => [...prev, assistantMessage]);
      setIsThinking(false);
    }, 600);
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-4 px-6 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-foreground">SATI • MCP Simulator</h1>
        <p className="text-sm text-muted-foreground">
          Visualize componentes SATI renderizados como o ChatGPT Apps faria.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-[2fr,1fr]">
        <div className="flex flex-col rounded-lg border border-border bg-background/70 shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Conversa simulada
            </h2>
            {isThinking && (
              <span className="text-xs text-muted-foreground">SATI está respondendo...</span>
            )}
          </div>

          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
            {messages.map((message) => (
              <article
                key={message.id}
                className={`flex flex-col gap-3 rounded-md border px-4 py-3 ${
                  message.role === "user"
                    ? "border-primary/40 bg-primary/10"
                    : message.role === "assistant"
                    ? "border-accent/40 bg-accent/10"
                    : "border-muted/60 bg-muted/10"
                }`}
              >
                <header className="flex items-center justify-between text-xs uppercase text-muted-foreground">
                  <span>
                    {message.role === "user"
                      ? "Você"
                      : message.role === "assistant"
                      ? "SATI"
                      : "Tool"}
                  </span>
                  <time>{new Date(message.timestamp).toLocaleTimeString()}</time>
                </header>
                <p className="whitespace-pre-wrap text-sm text-foreground">
                  {message.content}
                </p>

                {message.component && (
                  <div className="rounded-md border border-border bg-background px-4 py-4 shadow-sm">
                    {message.component}
                  </div>
                )}
              </article>
            ))}
          </div>

          <footer className="border-t border-border bg-muted/20 px-4 py-3">
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                handleSend();
              }}
            >
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Digite a próxima mensagem do usuário..."
                className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                Enviar
              </button>
            </form>
          </footer>
        </div>

        <aside className="flex flex-col gap-4 rounded-lg border border-border bg-background/70 p-4 shadow-sm">
          <header>
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Componentes SATI
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Clique para injetar o componente correspondente na conversa.
            </p>
          </header>

          <div className="flex flex-col gap-3">
            {availableTools.map(([toolId, info]) => (
              <button
                key={toolId}
                type="button"
                onClick={() => simulateToolRun(toolId)}
                className="rounded-md border border-border bg-muted px-3 py-2 text-left text-sm transition hover:border-primary hover:bg-primary/10"
              >
                <span className="font-semibold text-foreground">{info.label}</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {info.description}
                </span>
              </button>
            ))}
          </div>

          <div className="rounded-md border border-dashed border-border/70 bg-muted/20 px-3 py-3 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Dicas de validação rápida</p>
            <ul className="mt-2 list-disc space-y-2 pl-4">
              <li>Teste mensagens do usuário que acionam componentes diferentes.</li>
              <li>Ajuste os hooks para mockar dados conforme o cenário.</li>
              <li>Compare com vídeos/prints do ChatGPT Apps para refinar estilos.</li>
            </ul>
          </div>
        </aside>
      </section>
    </main>
  );
}

