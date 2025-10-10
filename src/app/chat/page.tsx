"use client";

import { ChatInterface } from "@/components/chat/ChatInterface";

export default function MCPSimulatorPage() {
  const handleMessageSent = (message: unknown) => {
    console.log("Message sent:", message);
  };

  const handleError = (error: string) => {
    console.error("Chat error:", error);
    // TODO: Show toast notification
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-semibold text-foreground">
            SATI • Chat Interface
          </h1>
          <p className="text-sm text-muted-foreground">
            Assistente de produtividade para neurodivergentes
          </p>
        </div>
      </header>

      {/* Chat Interface */}
      <div className="flex-1">
        <ChatInterface
          onMessageSent={handleMessageSent}
          onError={handleError}
          systemPrompt="Você é o SATI, um assistente especializado em produtividade para pessoas neurodivergentes (ADHD/Autismo). Use suas ferramentas MCP para ajudar com hiperfocos, tarefas, timers e análise de contexto."
        />
      </div>
    </div>
  );
}