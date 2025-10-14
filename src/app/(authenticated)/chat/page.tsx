"use client";

import { useState, useCallback } from "react";
import { ChatInterface } from "@/app/components/chat/ChatInterface";
import { SATIToolPalette } from "@/app/components/chat/SATIToolPalette";
import { DemoExecutionFeedback } from "@/app/components/chat/DemoExecutionFeedback";
import { useHotkeys } from "@/lib/hooks/useHotkeys";
import { Button } from "@/app/components/ui/button";
import { Palette, Info } from "lucide-react";
import { TooltipProvider } from "@/app/components/ui/tooltip";

export default function ChatPage() {
  const [showToolPalette, setShowToolPalette] = useState(false);
  const [isExecutingDemo, setIsExecutingDemo] = useState(false);
  const [demoMessage, setDemoMessage] = useState<string | null>(null);
  const [currentDemoTool, setCurrentDemoTool] = useState<string | null>(null);

  const handleMessageSent = (message: unknown) => {
    console.log("Message sent:", message);
    // Limpar demo message após envio
    if (demoMessage) {
      setDemoMessage(null);
      setIsExecutingDemo(false);
      setCurrentDemoTool(null);
    }
  };

  const handleError = (error: string) => {
    console.error("Chat error:", error);
    setIsExecutingDemo(false);
    setCurrentDemoTool(null);
    // TODO: Show toast notification
  };

  const handleToolDemo = useCallback(async (toolName: string, prompt: string) => {
    console.log(`[Demo] Executing tool: ${toolName}`);
    console.log(`[Demo] Prompt: ${prompt}`);

    setIsExecutingDemo(true);
    setCurrentDemoTool(toolName);
    
    // Usar estado para comunicar com ChatInterface
    setDemoMessage(prompt);

    // Auto-clear demo state após timeout se não for processado
    setTimeout(() => {
      if (demoMessage === prompt) {
        setDemoMessage(null);
        setIsExecutingDemo(false);
        setCurrentDemoTool(null);
      }
    }, 8000); // Aumentar timeout para 8s
  }, [demoMessage]);

  // Keyboard shortcuts
  useHotkeys('cmd+shift+p', () => {
    setShowToolPalette(prev => !prev);
  });

  useHotkeys('ctrl+shift+p', () => {
    setShowToolPalette(prev => !prev);
  });

  // Quick tool shortcuts
  useHotkeys('cmd+1', () => {
    handleToolDemo('createHyperfocus', 'Crie um hiperfoco para dominar Next.js 14 com App Router e React Server Components, estimando 2 horas');
  });

  useHotkeys('cmd+2', () => {
    handleToolDemo('startFocusTimer', 'Inicie um timer de foco de 25 minutos para estudar TypeScript avançado');
  });

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col">
        {/* Toolbar - Controles do Chat */}
        <div className="border-b bg-background/95 backdrop-blur px-4 md:px-6 py-3">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground">
                Chat SATI
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground">
                Assistente de produtividade para neurodivergentes
              </p>
            </div>
            
            {/* Controls */}
            <div className="flex items-center gap-2 md:gap-3">
              {isExecutingDemo && (
                <DemoExecutionFeedback
                  isExecuting={isExecutingDemo}
                  toolName={currentDemoTool || 'Tool'}
                  status="executing"
                />
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowToolPalette(!showToolPalette)}
                className="gap-2"
              >
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {showToolPalette ? 'Ocultar Tools' : 'Mostrar Tools'}
                </span>
                <span className="sm:hidden">Tools</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                asChild
              >
                <a 
                  href="/mcp-simulator" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gap-2"
                >
                  <Info className="h-4 w-4" />
                  <span className="hidden sm:inline">Simulador</span>
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat Interface */}
          <div className="flex-1 flex flex-col">
            <ChatInterface
              demoMessage={demoMessage}
              onMessageSent={handleMessageSent}
              onError={handleError}
              onDemoMessageProcessed={() => setDemoMessage(null)}
              systemPrompt="Você é o SATI, um assistente especializado em produtividade para pessoas neurodivergentes (ADHD/Autismo). Use suas ferramentas MCP para ajudar com hiperfocos, tarefas, timers e análise de contexto."
            />
          </div>
          
          {/* SATI Tool Palette */}
          <SATIToolPalette
            onToolDemo={handleToolDemo}
            isExpanded={showToolPalette}
            onToggle={setShowToolPalette}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}

