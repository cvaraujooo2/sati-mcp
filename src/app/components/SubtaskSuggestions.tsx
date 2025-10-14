import React, { useState, useCallback } from 'react';
import { Check, Plus, Sparkles, X } from 'lucide-react';
import { useToolInput, useToolOutput, useTheme } from './hooks/useOpenAi';

interface SubtaskSuggestion {
  title: string;
  description?: string;
  estimatedMinutes?: number;
}

interface SubtaskSuggestionsInput {
  hyperfocusId: string;
  hyperfocusTitle: string;
  description: string;
  suggestedTasks?: SubtaskSuggestion[];
  complexity?: 'low' | 'medium' | 'high';
  totalEstimatedMinutes?: number;
  autoCreate?: boolean;
}

interface SubtaskSuggestionsOutput {
  hyperfocusId: string;
  hyperfocusTitle: string;
  suggestedTasks: SubtaskSuggestion[];
  complexity: 'low' | 'medium' | 'high';
  totalEstimatedMinutes: number;
}

// Props podem vir diretamente do componente Message.tsx
interface SubtaskSuggestionsProps extends Partial<SubtaskSuggestionsInput> {}

const complexityEmojis = {
  low: '🟢',
  medium: '🟡',
  high: '🔴',
};

const complexityLabels = {
  low: 'Baixa complexidade',
  medium: 'Complexidade média',
  high: 'Alta complexidade',
};

export function SubtaskSuggestions(props: SubtaskSuggestionsProps = {}) {
  const toolInput = useToolInput<SubtaskSuggestionsInput>();
  const toolOutput = useToolOutput<SubtaskSuggestionsOutput>();
  const theme = useTheme();

  // Merge props: props diretos > toolOutput > toolInput
  const data = {
    ...toolInput,
    ...toolOutput,
    ...props,
  };

  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(
    new Set(data?.suggestedTasks?.map((_, index) => index) ?? [])
  );
  const [isCreating, setIsCreating] = useState(false);

  const hyperfocusTitle = data?.hyperfocusTitle || '';
  const suggestedTasks = data?.suggestedTasks ?? [];
  const complexity = data?.complexity || 'medium';
  const totalMinutes = data?.totalEstimatedMinutes || 0;

  const toggleTaskSelection = useCallback((index: number) => {
    setSelectedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedTasks(new Set(suggestedTasks.map((_, index) => index)));
  }, [suggestedTasks]);

  const deselectAll = useCallback(() => {
    setSelectedTasks(new Set());
  }, []);

  const handleCreateTasks = useCallback(async () => {
    if (!window.openai?.callTool) {
      console.error('[SubtaskSuggestions] OpenAI client not initialized');
      return;
    }

    if (!data?.hyperfocusId || selectedTasks.size === 0) {
      console.error('[SubtaskSuggestions] Missing hyperfocusId or no tasks selected');
      return;
    }

    setIsCreating(true);

    try {
      const tasksToCreate = Array.from(selectedTasks)
        .map((index) => suggestedTasks[index])
        .filter(Boolean);

      await window.openai.callTool('createTaskBatch', {
        hyperfocusId: data.hyperfocusId,
        tasks: tasksToCreate.map((task) => ({
          title: task.title,
          description: task.description,
          estimatedMinutes: task.estimatedMinutes,
        })),
      });

      // Enviar mensagem de sucesso
      if (window.openai.sendFollowUpMessage) {
        await window.openai.sendFollowUpMessage({
          prompt: `Tarefas criadas com sucesso! Mostre o breakdown de tarefas do hiperfoco "${hyperfocusTitle}"`,
        });
      }
    } catch (error) {
      console.error('[SubtaskSuggestions] Failed to create tasks:', error);
      // TODO: Adicionar toast de erro
      // toast.error('Falha ao criar tarefas. Tente novamente.');
    } finally {
      setIsCreating(false);
    }
  }, [data?.hyperfocusId, selectedTasks, suggestedTasks, hyperfocusTitle]);

  const handleDiscard = useCallback(async () => {
    if (window.openai?.sendFollowUpMessage) {
      await window.openai.sendFollowUpMessage({
        prompt: 'Ok, vou criar as tarefas manualmente',
      });
    }
  }, []);

  const cardBg = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const hoverBg = theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100';
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const mutedColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const borderColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-300';
  const selectedBg = theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100';
  const selectedBorder = theme === 'dark' ? 'border-blue-600' : 'border-blue-400';

  const selectedCount = selectedTasks.size;
  const selectedMinutes = Array.from(selectedTasks)
    .map((index) => suggestedTasks[index]?.estimatedMinutes ?? 0)
    .reduce((sum, mins) => sum + mins, 0);

  return (
    <div className={`${cardBg} rounded-lg p-6 border ${borderColor} max-w-3xl`}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <div className="p-3 rounded-lg bg-purple-600/20">
          <Sparkles className="text-purple-500" size={24} />
        </div>
        <div className="flex-1">
          <h3 className={`text-lg font-semibold ${textColor} mb-1`}>
            ✨ Sugestões de Subtarefas
          </h3>
          <p className={`text-sm ${mutedColor}`}>{hyperfocusTitle}</p>
        </div>
      </div>

      {/* Metadados */}
      <div className="flex items-center gap-6 mb-6">
        <div>
          <p className={`text-xs ${mutedColor} mb-1`}>Complexidade</p>
          <p className={`text-sm font-medium ${textColor}`}>
            {complexityEmojis[complexity]} {complexityLabels[complexity]}
          </p>
        </div>
        <div>
          <p className={`text-xs ${mutedColor} mb-1`}>Tempo Total Estimado</p>
          <p className={`text-sm font-medium ${textColor}`}>
            {Math.floor(totalMinutes / 60) > 0 && `${Math.floor(totalMinutes / 60)}h `}
            {totalMinutes % 60}min
          </p>
        </div>
        <div>
          <p className={`text-xs ${mutedColor} mb-1`}>Total de Tarefas</p>
          <p className={`text-sm font-medium ${textColor}`}>{suggestedTasks.length}</p>
        </div>
      </div>

      {/* Controles de seleção */}
      <div className="flex items-center justify-between mb-4">
        <div className={`text-sm ${mutedColor}`}>
          {selectedCount} {selectedCount === 1 ? 'tarefa selecionada' : 'tarefas selecionadas'}
          {selectedCount > 0 && selectedMinutes > 0 && (
            <span> • ~{Math.floor(selectedMinutes / 60) > 0 ? `${Math.floor(selectedMinutes / 60)}h ` : ''}{selectedMinutes % 60}min</span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={selectAll}
            className={`text-xs px-3 py-1 ${hoverBg} rounded transition-colors ${mutedColor}`}
          >
            Selecionar Todas
          </button>
          <button
            onClick={deselectAll}
            className={`text-xs px-3 py-1 ${hoverBg} rounded transition-colors ${mutedColor}`}
          >
            Limpar
          </button>
        </div>
      </div>

      {/* Lista de sugestões */}
      <div className="space-y-2 mb-6">
        {suggestedTasks.map((task, index) => {
          const isSelected = selectedTasks.has(index);

          return (
            <button
              key={index}
              onClick={() => toggleTaskSelection(index)}
              className={`w-full flex items-start gap-3 p-4 rounded-lg border-2 transition-all text-left ${
                isSelected
                  ? `${selectedBg} ${selectedBorder}`
                  : `${cardBg} ${borderColor} ${hoverBg}`
              }`}
            >
              <div
                className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                  isSelected
                    ? 'bg-blue-600 border-blue-600'
                    : `${borderColor} ${cardBg}`
                }`}
              >
                {isSelected && <Check size={14} className="text-white" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className={`font-medium ${textColor}`}>
                    {index + 1}. {task.title}
                  </h4>
                  {task.estimatedMinutes && (
                    <span className={`text-xs ${mutedColor} flex-shrink-0`}>
                      {task.estimatedMinutes}min
                    </span>
                  )}
                </div>
                {task.description && (
                  <p className={`text-sm ${mutedColor}`}>{task.description}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Ações */}
      <div className="flex gap-3">
        <button
          onClick={handleCreateTasks}
          disabled={selectedCount === 0 || isCreating}
          className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
            selectedCount === 0 || isCreating
              ? `${mutedColor} ${cardBg} border ${borderColor} cursor-not-allowed`
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isCreating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Criando...
            </>
          ) : (
            <>
              <Plus size={20} />
              Criar {selectedCount > 0 ? `${selectedCount} ` : ''}Tarefa
              {selectedCount !== 1 ? 's' : ''}
            </>
          )}
        </button>
        <button
          onClick={handleDiscard}
          className={`px-6 py-3 ${cardBg} border ${borderColor} ${hoverBg} rounded-lg font-medium transition-colors flex items-center gap-2`}
        >
          <X size={20} />
          Descartar
        </button>
      </div>

      {/* Dica */}
      <div className={`mt-4 p-3 ${cardBg} border ${borderColor} rounded-lg`}>
        <p className={`text-xs ${mutedColor}`}>
          💡 <strong>Dica:</strong> Você pode desmarcar tarefas que não fazem sentido ou criar
          suas próprias tarefas manualmente depois.
        </p>
      </div>
    </div>
  );
}

