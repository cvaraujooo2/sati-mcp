import React, { useState, useCallback } from 'react';
import { ChevronDown, ChevronRight, Circle, CheckCircle, Clock, Plus, Zap } from 'lucide-react';
import { useToolOutput, useTheme } from './hooks/useOpenAi';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  estimatedMinutes?: number;
}

interface Hyperfocus {
  id: string;
  title: string;
  description?: string;
  color: string;
  taskCount: number;
  completedCount: number;
  estimatedTimeMinutes?: number;
  tasks?: Task[];
}

interface HyperfocusListOutput {
  hyperfocuses: Hyperfocus[];
  total: number;
  showArchived?: boolean;
}

const colorClasses = {
  red: 'bg-red-500',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  orange: 'bg-orange-500',
  purple: 'bg-purple-500',
  pink: 'bg-pink-500',
  brown: 'bg-amber-700',
  gray: 'bg-gray-500',
} as const;

const colorEmojis = {
  red: '🔴',
  green: '🟢',
  blue: '🔵',
  orange: '🟠',
  purple: '🟣',
  pink: '🩷',
  brown: '🟤',
  gray: '⚪',
} as const;

export function HyperfocusList(props?: HyperfocusListOutput) {
  // Tentar obter dados de props primeiro, depois de toolOutput
  const toolOutput = useToolOutput<HyperfocusListOutput>();
  const theme = useTheme();

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Usar props se fornecido, senão toolOutput
  const data = props || toolOutput;
  const hyperfocuses = data?.hyperfocuses ?? [];
  const total = data?.total ?? hyperfocuses.length;

  // Debug logs
  console.log('[HyperfocusList] Props:', props);
  console.log('[HyperfocusList] ToolOutput:', toolOutput);
  console.log('[HyperfocusList] Data:', data);
  console.log('[HyperfocusList] Hyperfocuses:', hyperfocuses);
  console.log('[HyperfocusList] Total:', total);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleToggleTask = useCallback(async (hyperfocusId: string, taskId: string) => {
    if (window.openai?.callTool) {
      await window.openai.callTool('updateTaskStatus', {
        hyperfocusId,
        taskId,
        completed: true,
      });
    }
  }, []);

  const handleStartFocus = useCallback(async (hyperfocus: Hyperfocus) => {
    if (window.openai?.callTool) {
      await window.openai.callTool('startFocusTimer', {
        hyperfocusId: hyperfocus.id,
        hyperfocusTitle: hyperfocus.title,
        durationMinutes: hyperfocus.estimatedTimeMinutes ?? 30,
      });
    }
  }, []);

  const handleCreateTask = useCallback(async (hyperfocusId: string) => {
    if (window.openai?.sendFollowUpMessage) {
      await window.openai.sendFollowUpMessage({
        prompt: `Crie tarefas para o hiperfoco ${hyperfocusId}`,
      });
    }
  }, []);

  const handleCreateHyperfocus = useCallback(async () => {
    if (window.openai?.sendFollowUpMessage) {
      await window.openai.sendFollowUpMessage({
        prompt: 'Quero criar um novo hiperfoco',
      });
    }
  }, []);

  const handleCreateAlternancy = useCallback(async () => {
    if (window.openai?.sendFollowUpMessage) {
      await window.openai.sendFollowUpMessage({
        prompt: 'Criar uma sessão de alternância entre meus hiperfocos',
      });
    }
  }, []);

  const cardBg = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const hoverBg = theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100';
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const mutedColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const borderColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-300';

  if (hyperfocuses.length === 0) {
    return (
      <div className={`${cardBg} rounded-lg p-8 border ${borderColor} max-w-2xl`}>
        <div className="text-center">
          <div className="text-5xl mb-4">🎯</div>
          <h3 className={`text-xl font-semibold mb-2 ${textColor}`}>
            Nenhum hiperfoco criado ainda
          </h3>
          <p className={`${mutedColor} mb-6`}>
            Comece criando seu primeiro hiperfoco para organizar seus interesses e projetos!
          </p>
          <button
            onClick={handleCreateHyperfocus}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            ✨ Criar Primeiro Hiperfoco
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${cardBg} rounded-lg p-6 border ${borderColor} max-w-3xl`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className={`text-lg font-semibold ${textColor}`}>
            🎯 Meus Hiperfocos Ativos
          </h3>
          <p className={`text-sm ${mutedColor} mt-1`}>
            {total} {total === 1 ? 'hiperfoco' : 'hiperfocos'} no total
          </p>
        </div>
      </div>

      {/* Lista de hiperfocos */}
      <div className="space-y-3 mb-4">
        {hyperfocuses.map((hyperfocus) => {
          const isExpanded = expandedIds.has(hyperfocus.id);
          const taskCount = hyperfocus.taskCount || 0;
          const completedCount = hyperfocus.completedCount || 0;
          const progressPercent =
            taskCount > 0
              ? Math.round((completedCount / taskCount) * 100)
              : 0;

          return (
            <div
              key={hyperfocus.id}
              className={`${cardBg} border ${borderColor} rounded-lg overflow-hidden`}
            >
              {/* Header do hiperfoco */}
              <div className="p-4">
                <button
                  onClick={() => toggleExpanded(hyperfocus.id)}
                  className={`w-full flex items-start gap-3 ${hoverBg} transition-colors text-left rounded-lg p-2 -m-2`}
                >
                  <div className="flex-shrink-0 mt-1">
                    {isExpanded ? (
                      <ChevronDown size={20} className={mutedColor} />
                    ) : (
                      <ChevronRight size={20} className={mutedColor} />
                    )}
                  </div>

                  <div
                    className={`w-3 h-3 rounded-full ${colorClasses[hyperfocus.color as keyof typeof colorClasses] || colorClasses.blue} flex-shrink-0 mt-1.5`}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`font-semibold ${textColor}`}>{hyperfocus.title}</h4>
                      <span className="text-xl">
                        {colorEmojis[hyperfocus.color as keyof typeof colorEmojis] || '🔵'}
                      </span>
                    </div>

                    {hyperfocus.description && (
                      <p className={`text-sm ${mutedColor} mb-2`}>{hyperfocus.description}</p>
                    )}

                    {/* Metadados */}
                    <div className={`flex items-center gap-4 text-sm ${mutedColor}`}>
                      <span className="flex items-center gap-1">
                        <CheckCircle size={16} />
                        {completedCount}/{taskCount} tarefas
                      </span>
                      {hyperfocus.estimatedTimeMinutes && (
                        <span className="flex items-center gap-1">
                          <Clock size={16} />
                          {hyperfocus.estimatedTimeMinutes} min
                        </span>
                      )}
                    </div>

                    {/* Barra de progresso */}
                    {taskCount > 0 && (
                      <div className="mt-3">
                        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </button>

                {/* Botões sempre visíveis (quando contraído) */}
                {!isExpanded && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleStartFocus(hyperfocus)}
                      className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Clock size={16} />
                      Iniciar Foco
                    </button>
                    <button
                      onClick={() => handleCreateTask(hyperfocus.id)}
                      className={`flex-1 px-3 py-2 ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${textColor} rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2`}
                    >
                      <Plus size={16} />
                      Criar Tarefas
                    </button>
                  </div>
                )}
              </div>

              {/* Lista de tarefas expandida */}
              {isExpanded && hyperfocus.tasks && hyperfocus.tasks.length > 0 && (
                <div className={`border-t ${borderColor} px-4 py-3 space-y-2`}>
                  {hyperfocus.tasks.map((task, index) => (
                    <button
                      key={task.id}
                      onClick={() => handleToggleTask(hyperfocus.id, task.id)}
                      className={`w-full flex items-start gap-3 p-2 rounded ${hoverBg} transition-colors text-left`}
                    >
                      <span className="mt-0.5">
                        {task.completed ? (
                          <CheckCircle className="text-green-500" size={18} />
                        ) : (
                          <Circle className={mutedColor} size={18} />
                        )}
                      </span>
                      <span
                        className={`flex-1 text-sm ${
                          task.completed
                            ? `${mutedColor} line-through`
                            : textColor
                        }`}
                      >
                        {index + 1}. {task.title}
                      </span>
                      {task.estimatedMinutes && (
                        <span className={`text-xs ${mutedColor}`}>
                          {task.estimatedMinutes}min
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Ações do hiperfoco */}
              {isExpanded && (
                <div className={`border-t ${borderColor} p-3 flex gap-2`}>
                  <button
                    onClick={() => handleStartFocus(hyperfocus)}
                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Clock size={16} />
                    Iniciar Foco
                  </button>
                  <button
                    onClick={() => handleCreateTask(hyperfocus.id)}
                    className={`flex-1 px-3 py-2 ${cardBg} border ${borderColor} ${hoverBg} rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2`}
                  >
                    <Plus size={16} />
                    Criar Tarefas
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer com ações gerais */}
      <div className="flex gap-2 pt-4 border-t border-gray-700">
        <button
          onClick={handleCreateHyperfocus}
          className={`flex-1 px-4 py-2 border-2 border-dashed ${borderColor} ${hoverBg} rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2`}
        >
          <Plus size={16} />
          Novo Hiperfoco
        </button>
        <button
          onClick={handleCreateAlternancy}
          className={`flex-1 px-4 py-2 border-2 border-dashed ${borderColor} ${hoverBg} rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2`}
        >
          <Zap size={16} />
          Alternância
        </button>
      </div>
    </div>
  );
}

