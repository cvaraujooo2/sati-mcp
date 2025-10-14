import React, { useMemo, useState, useEffect } from 'react';
import { Check, Circle, Plus } from 'lucide-react';
import { useToolInput, useToolOutput, useTheme } from './hooks/useOpenAi';
import { useAuth, useTasks } from '@/lib/hooks';

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

interface TaskBreakdownInput {
  hyperfocusId: string;
  hyperfocusTitle: string;
  tasks: Task[];
}

interface TaskBreakdownOutput {
  hyperfocusId: string;
  hyperfocusTitle: string;
  tasks: Task[];
}

// Props podem vir diretamente do componente Message.tsx
interface TaskBreakdownProps extends Partial<TaskBreakdownInput> {}

export function TaskBreakdown(props: TaskBreakdownProps = {}) {
  const toolInput = useToolInput<TaskBreakdownInput>();
  const toolOutput = useToolOutput<TaskBreakdownOutput>();
  const theme = useTheme();
  
  // Novos hooks de integração
  const { user } = useAuth();
  const { 
    tasks: tasksFromHook, 
    loading: loadingTasks, 
    error: tasksError,
    toggleTaskComplete,
    createTask,
    loadTasks 
  } = useTasks(user?.id || '');

  // Merge props: props diretos > toolOutput > toolInput
  const data = {
    ...toolInput,
    ...toolOutput,
    ...props,
  };

  // Debug logs to validate data flow
  try {
    console.log('[UI][TaskBreakdown] Init', {
      source: 'TaskBreakdown',
      hasToolInput: !!toolInput,
      hasToolOutput: !!toolOutput,
      hasProps: Object.keys(props).length > 0,
      mergedData: data,
      tasksFromHookCount: tasksFromHook.length,
    });
  } catch (e) {
    console.warn('[UI][TaskBreakdown] Init log failed', e);
  }

  const hyperfocusId = data?.hyperfocusId ?? '';
  const hyperfocusTitle = data?.hyperfocusTitle ?? '';
  const initialTasks = data?.tasks ?? [];

  // Usar tasks do hook se disponível, senão fallback para toolOutput
  const [tasks, setTasks] = useState<Task[]>(() => 
    tasksFromHook.length > 0 ? tasksFromHook.map(t => ({
      id: t.id,
      title: t.title,
      completed: t.completed || false,
    })) : [...initialTasks]
  );
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const { completedCount, totalCount, progressPercent } = useMemo(() => {
    const completed = tasks.filter((task) => task.completed).length;
    const total = tasks.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      completedCount: completed,
      totalCount: total,
      progressPercent: percent,
    };
  }, [tasks]);

  // Carregar tasks quando montar ou quando hyperfocusId mudar
  useEffect(() => {
    if (hyperfocusId && user?.id) {
      loadTasks(hyperfocusId);
    }
  }, [hyperfocusId, user?.id, loadTasks]);

  // Sincronizar tasks do hook com estado local
  useEffect(() => {
    if (tasksFromHook.length > 0) {
      setTasks(tasksFromHook.map(t => ({
        id: t.id,
        title: t.title,
        completed: t.completed || false,
      })));
    }
  }, [tasksFromHook]);

  // Também sincronizar via data merged
  useEffect(() => {
    if (data?.tasks && Array.isArray(data.tasks)) {
      console.log('[UI][TaskBreakdown] Sync data.tasks', {
        count: data.tasks.length,
        sample: data.tasks.slice(0, 2),
      });
      // Só sincronizar se não tivermos tasks do hook
      if (tasksFromHook.length === 0) {
        setTasks(data.tasks);
      }
    }
  }, [data?.tasks, tasksFromHook.length]);

  const handleToggleTask = async (taskId: string) => {
    if (!user?.id) {
      console.warn('[TaskBreakdown] User not authenticated');
      return;
    }

    const currentTask = tasks.find((task) => task.id === taskId);
    if (!currentTask) {
      console.warn('[TaskBreakdown] Task not found:', taskId);
      return;
    }

    // Salvar direto no Supabase (com optimistic update do hook)
    const success = await toggleTaskComplete(taskId);

    if (!success) {
      console.error('[TaskBreakdown] Failed to toggle task:', tasksError);
      // O hook já reverteu o optimistic update
      return;
    }

    // OPCIONAL: Ainda chamar ChatGPT para feedback contextual
    if (window.openai?.callTool) {
      try {
        await window.openai.callTool('updateTaskStatus', {
          taskId,
          completed: !currentTask.completed,
        });
      } catch (error) {
        // Não é crítico se ChatGPT falhar, dados já estão salvos
        console.warn('[TaskBreakdown] ChatGPT notification failed:', error);
      }
    }
  };

  const handleAddTask = async () => {
    if (!user?.id) {
      console.warn('[TaskBreakdown] User not authenticated');
      return;
    }

    const title = newTaskTitle.trim();
    if (!title) {
      console.warn('[TaskBreakdown] Empty task title');
      return;
    }

    if (!hyperfocusId) {
      console.error('[TaskBreakdown] No hyperfocusId available');
      return;
    }

    // Salvar direto no Supabase
    const newTask = await createTask({
      hyperfocus_id: hyperfocusId,
      title,
    });

    if (!newTask) {
      console.error('[TaskBreakdown] Failed to create task:', tasksError);
      // Mostrar erro ao usuário
      return;
    }

    // Limpar input
    setNewTaskTitle('');
    setIsAddingTask(false);

    // OPCIONAL: Notificar ChatGPT
    if (window.openai?.callTool) {
      try {
        await window.openai.callTool('createTask', {
          hyperfocusId,
          title,
        });
      } catch (error) {
        // Não é crítico se ChatGPT falhar, dados já estão salvos
        console.warn('[TaskBreakdown] ChatGPT notification failed:', error);
      }
    }
  };

  const bgColor = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const mutedColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const borderColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-300';
  const hoverBg = theme === 'dark' ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100';
  const inputBg = theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100';

  return (
    <div className={`${bgColor} rounded-lg p-6 shadow-lg border ${borderColor}`}>
      {/* Header */}
      <div className="mb-4">
        <h3 className={`text-lg font-semibold ${textColor} mb-2`}>
          📚 {hyperfocusTitle} - Tarefas
          {loadingTasks && <span className="ml-2 text-sm text-gray-500">Carregando...</span>}
        </h3>

        {/* Error message */}
        {tasksError && (
          <div className="mb-3 p-2 bg-red-900/30 border border-red-700 rounded text-red-400 text-sm">
            ⚠️ {tasksError}
          </div>
        )}

        {/* Progress bar */}
        <div className="space-y-1">
          <div className={`flex justify-between text-sm ${mutedColor}`}>
            <span>Progresso</span>
            <span>
              {completedCount}/{totalCount} ({progressPercent}%)
            </span>
          </div>
          <div
            className={`w-full h-2 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden`}
          >
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Task list */}
      <div className="space-y-2 mb-4">
        {tasks.map((task, index) => (
          <button
            type="button"
            key={task.id}
            className={`flex w-full items-start gap-3 p-3 rounded-lg ${hoverBg} transition-colors text-left`}
            onClick={() => handleToggleTask(task.id)}
          >
            <span className="mt-0.5">
              {task.completed ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <Circle className={`w-5 h-5 ${mutedColor}`} />
              )}
            </span>

            <span
              className={`flex-1 text-sm ${task.completed ? `${mutedColor} line-through` : textColor
                }`}
            >
              {index + 1}. {task.title}
            </span>
          </button>
        ))}
        {tasks.length === 0 && (
          <p className={`text-sm ${mutedColor} italic`}>
            Nenhuma tarefa cadastrada ainda. Comece adicionando a primeira!
          </p>
        )}
      </div>

      {/* Add task */}
      {isAddingTask ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(event) => setNewTaskTitle(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && handleAddTask()}
            placeholder="Nome da tarefa..."
            className={`flex-1 ${inputBg} ${textColor} px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
            autoFocus
          />
          <button
            type="button"
            onClick={handleAddTask}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
          >
            Adicionar
          </button>
          <button
            type="button"
            onClick={() => setIsAddingTask(false)}
            className={`px-4 py-2 ${inputBg} hover:${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'} ${textColor} rounded-lg text-sm`}
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsAddingTask(true)}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed ${borderColor} hover:border-${theme === 'dark' ? 'gray-500' : 'gray-400'} ${mutedColor} hover:${textColor} rounded-lg text-sm font-medium transition-colors`}
        >
          <Plus size={16} />
          Adicionar tarefa
        </button>
      )}
    </div>
  );
}


