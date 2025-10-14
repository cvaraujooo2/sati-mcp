"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronRight, 
  ChevronLeft, 
  Zap, 
  List, 
  Clock, 
  Lightbulb,
  Settings,
  BarChart3,
  ArrowUpDown,
  CheckCircle,
  Palette,
  Send,
  X
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import { Input } from "@/app/components/ui/input";
import { cn } from "@/lib/utils";

interface SATITool {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'Organização' | 'Foco' | 'Análise';
  demoPrompt: string;
  isPopular?: boolean;
}

interface SATIToolPaletteProps {
  onToolDemo: (toolName: string, prompt: string) => void;
  isExpanded: boolean;
  onToggle: (expanded: boolean) => void;
  className?: string;
}

const SATI_TOOLS: SATITool[] = [
  {
    id: 'createHyperfocus',
    label: 'Criar Hiperfoco',
    description: 'Cria um novo projeto de foco intenso',
    icon: Zap,
    category: 'Organização',
    demoPrompt: 'Crie um hiperfoco para dominar Next.js 14 com App Router e React Server Components, estimando 2 horas',
    isPopular: true
  },
  {
    id: 'listHyperfocus',
    label: 'Listar Hiperfocos',
    description: 'Mostra todos os hiperfocos ativos',
    icon: List,
    category: 'Organização',
    demoPrompt: 'Mostre meus hiperfocos ativos e suas tarefas',
  },
  {
    id: 'breakIntoSubtasks',
    label: 'Quebrar Tarefas',
    description: 'Divide tarefas complexas em partes menores',
    icon: Lightbulb,
    category: 'Organização',
    demoPrompt: 'Quebre a tarefa "Desenvolver sistema de autenticação completo" em subtarefas menores e gerenciáveis',
    isPopular: true
  },
  {
    id: 'startFocusTimer',
    label: 'Timer de Foco',
    description: 'Inicia uma sessão de foco cronometrada',
    icon: Clock,
    category: 'Foco',
    demoPrompt: 'Inicie um timer de foco de 25 minutos para estudar TypeScript avançado',
    isPopular: true
  },
  {
    id: 'analyzeContext',
    label: 'Análise de Contexto',
    description: 'Analisa situação atual e sugere ações',
    icon: Settings,
    category: 'Análise',
    demoPrompt: 'Analise meu contexto atual de produtividade e sugira o que fazer agora para ser mais eficiente'
  },
  {
    id: 'createAlternancy',
    label: 'Fluxo de Alternância',
    description: 'Cria estratégias de alternância entre tarefas',
    icon: ArrowUpDown,
    category: 'Foco',
    demoPrompt: 'Crie um fluxo de alternância entre estudar programação e fazer exercícios físicos'
  },
  {
    id: 'endFocusTimer',
    label: 'Resumo da Sessão',
    description: 'Finaliza sessão e mostra estatísticas',
    icon: BarChart3,
    category: 'Análise',
    demoPrompt: 'Finalize minha sessão de foco atual e mostre um resumo com estatísticas detalhadas'
  }
];

const CATEGORIES = ['Organização', 'Foco', 'Análise'] as const;

interface ToolDemoButtonProps {
  tool: SATITool;
  onClick: () => void;
  isSelected?: boolean;
}

function ToolDemoButton({ tool, onClick, isSelected = false }: ToolDemoButtonProps) {
  const IconComponent = tool.icon;
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={`w-full text-left p-3 rounded-lg border transition-all duration-200 group ${
            isSelected 
              ? 'border-primary bg-primary/5 shadow-md' 
              : 'border-border/60 hover:border-border hover:bg-muted/40'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex-shrink-0">
              <IconComponent className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-sm truncate">{tool.label}</p>
                {tool.isPopular && (
                  <Badge variant="secondary" className="text-xs px-1 py-0">
                    Popular
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {tool.description}
              </p>
            </div>
          </div>
        </button>
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-xs">
        <div className="space-y-1">
          <p className="font-medium">{tool.label}</p>
          <p className="text-xs text-muted-foreground">{tool.description}</p>
          <p className="text-xs italic">"/{tool.demoPrompt.slice(0, 50)}..."</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

interface CategorySectionProps {
  category: string;
  tools: SATITool[];
  onToolSelect: (tool: SATITool) => void;
  selectedTool: SATITool | null;
}

function CategorySection({ category, tools, onToolSelect, selectedTool }: CategorySectionProps) {
  if (tools.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {category}
      </h4>
      <div className="space-y-2">
        {tools.map((tool) => (
          <ToolDemoButton
            key={tool.id}
            tool={tool}
            onClick={() => onToolSelect(tool)}
            isSelected={selectedTool?.id === tool.id}
          />
        ))}
      </div>
    </div>
  );
}

export function SATIToolPalette({ 
  onToolDemo, 
  isExpanded, 
  onToggle, 
  className 
}: SATIToolPaletteProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<SATITool | null>(null);
  const [toolInput, setToolInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);

  const handleToolSelect = (tool: SATITool) => {
    setSelectedTool(tool);
    setToolInput(tool.demoPrompt); // Usar demoPrompt como placeholder
  };

  const handleExecuteTool = () => {
    if (selectedTool && toolInput.trim()) {
      setIsExecuting(true);
      
      // Executa a tool com o input
      onToolDemo(selectedTool.id, toolInput);
      
      // Limpa o estado imediatamente após o envio
      setTimeout(() => {
        setSelectedTool(null);
        setToolInput('');
        setIsExecuting(false);
      }, 100); // Pequeno delay para feedback visual
    }
  };

  const handleCancelTool = () => {
    setSelectedTool(null);
    setToolInput('');
  };

  const filteredTools = selectedCategory 
    ? SATI_TOOLS.filter(tool => tool.category === selectedCategory)
    : SATI_TOOLS;

  const toolsByCategory = CATEGORIES.reduce((acc, category) => {
    acc[category] = filteredTools.filter(tool => tool.category === category);
    return acc;
  }, {} as Record<string, SATITool[]>);

  return (
    <motion.aside 
      initial={false}
      animate={{ 
        width: isExpanded ? 320 : 48,
        opacity: 1 
      }}
      transition={{ 
        duration: 0.3, 
        ease: [0.4, 0, 0.2, 1] 
      }}
      className={cn(
        "border-l bg-background/95 backdrop-blur overflow-hidden flex flex-col",
        className
      )}
    >
      {/* Toggle Button */}
      <div className="border-b border-border/60">
        <Button
          variant="ghost" 
          size="sm"
          onClick={() => onToggle(!isExpanded)}
          className="w-full h-12 rounded-none justify-center"
          aria-label={isExpanded ? "Recolher palette" : "Expandir palette"}
        >
          {isExpanded ? (
            <>
              <ChevronRight className="h-4 w-4 mr-2" />
              <span className="text-xs">Tools</span>
            </>
          ) : (
            <Palette className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Tool Content */}
      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.div
            key="palette-content"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-border/60">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-primary" />
                <h3 className="font-medium text-sm">Tools SATI</h3>
              </div>
              
              {/* Category Filter */}
              <div className="flex flex-wrap gap-1">
                <Button
                  variant={selectedCategory === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                  className="text-xs h-7"
                >
                  Todas
                </Button>
                {CATEGORIES.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="text-xs h-7"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            {/* Tool List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedCategory ? (
                <CategorySection
                  category={selectedCategory}
                  tools={toolsByCategory[selectedCategory]}
                  onToolSelect={handleToolSelect}
                  selectedTool={selectedTool}
                />
              ) : (
                CATEGORIES.map((category) => (
                  <CategorySection
                    key={category}
                    category={category}
                    tools={toolsByCategory[category]}
                    onToolSelect={handleToolSelect}
                    selectedTool={selectedTool}
                  />
                ))
              )}

              {filteredTools.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma tool encontrada</p>
                </div>
              )}
            </div>

            {/* Tool Input Panel */}
            <AnimatePresence>
              {selectedTool && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-border/60 overflow-hidden"
                >
                  <div className="p-4 space-y-3 bg-muted/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <selectedTool.icon className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">{selectedTool.label}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelTool}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <Input
                        placeholder={`Digite seu prompt para ${selectedTool.label}...`}
                        value={toolInput}
                        onChange={(e) => setToolInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey && !isExecuting) {
                            e.preventDefault();
                            handleExecuteTool();
                          }
                          if (e.key === 'Escape' && !isExecuting) {
                            handleCancelTool();
                          }
                        }}
                        className="text-sm"
                        disabled={isExecuting}
                      />
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={handleExecuteTool}
                          disabled={!toolInput.trim() || isExecuting}
                          size="sm"
                          className="flex-1"
                        >
                          <Send className={`h-3 w-3 mr-1 ${isExecuting ? 'animate-pulse' : ''}`} />
                          {isExecuting ? 'Enviando...' : 'Executar'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCancelTool}
                          size="sm"
                          disabled={isExecuting}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      💡 {selectedTool.description} | ⏎ Executar | Esc Cancelar
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer */}
            <div className="p-4 border-t border-border/60 space-y-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Dispatch event to clear chat
                  const event = new CustomEvent('sati-clear-chat');
                  window.dispatchEvent(event);
                }}
                className="w-full text-xs"
              >
                🧹 Limpar Chat
              </Button>
              
              <div className="text-xs text-muted-foreground text-center space-y-1">
                <p>💡 Dica: Clique em uma tool para demonstração</p>
                <p>⌘ + Shift + P para toggle</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}