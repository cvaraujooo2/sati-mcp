import React, { useMemo, useState, useEffect } from 'react';
import { Check, Circle, Plus } from 'lucide-react';
import { useToolOutput, useTheme } from './hooks/useOpenAi';

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

interface TaskBreakdownOutput {
  hyperfocusId: string;
  hyperfocusTitle: string;
  tasks: Task[];
}

function extractTasksFromToolResponse(response: unknown): Task[] | null {
  if (!response || typeof response !== 'object') {
    return null;
  }

  const payload =
    'result' in response &&
    response.result &&
    typeof response.result === 'object'
      ? (response as { result: unknown }).result
      : response;

  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const component = 'component' in payload ? (payload as { component?: unknown }).component : undefined;
  if (!component || typeof component !== 'object') {
    return null;
  }

  const props = 'props' in component ? (component as { props?: unknown }).props : undefined;
  if (!props || typeof props !== 'object') {
    return null;
  }

  const tasksCandidate = (props as { tasks?: unknown }).tasks;
  if (!Array.isArray(tasksCandidate)) {
    return null;
  }

  return tasksCandidate
    .filter((item): item is Task => {
      return (
        !!item &&
        typeof item === 'object' &&
        'id' in item &&
        'title' in item &&
        'completed' in item
      );
    })
    .map((item) => ({
      id: String((item as Task).id),
      title: String((item as Task).title),
      completed: Boolean((item as Task).completed),
    }));
}

export function TaskBreakdown() {
  const toolOutput = useToolOutput<TaskBreakdownOutput>();
  const theme = useTheme();

  const hyperfocusId = toolOutput?.hyperfocusId ?? '';
  const hyperfocusTitle = toolOutput?.hyperfocusTitle ?? '';
  const initialTasks = toolOutput?.tasks ?? [];

  const [tasks, setTasks] = useState<Task[]>(() => [...initialTasks]);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Sincronizar quando toolOutput mudar
  useEffect(() => {
    if (toolOutput?.tasks) {
      setTasks(toolOutput.tasks);
    }
  }, [toolOutput?.tasks]);

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

  const handleToggleTask = async (taskId: string) => {
    const currentTask = tasks.find((task) => task.id === taskId);
    if (!currentTask) {
      return;
    }

    const nextCompleted = !currentTask.completed;

    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              completed: nextCompleted,
            }
          : task
      )
    );

    if (!window.openai) {
      return;
    }

    try {
      const response = await window.openai.callTool('updateTaskStatus', {
        hyperfocusId,
        taskId,
        completed: nextCompleted,
      });

      const updatedTasks = extractTasksFromToolResponse(response);
      if (updatedTasks) {
        setTasks(updatedTasks);
      }
    } catch (error) {
      console.error('Erro ao atualizar status da tarefa', error);
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                completed: currentTask.completed,
              }
            : task
        )
      );
    }
  };

  const handleAddTask = async () => {
    const title = newTaskTitle.trim();
    if (!title) return;

    const tempId = `temp-${Date.now()}`;
    const newTask: Task = {
      id: tempId,
      title,
      completed: false,
    };

    setTasks((prev) => [...prev, newTask]);
    setNewTaskTitle('');
    setIsAddingTask(false);

    if (!window.openai) {
      return;
    }

    try {
      const response = await window.openai.callTool('createTask', {
        hyperfocusId,
        title,
      });

      const updatedTasks = extractTasksFromToolResponse(response);
      if (updatedTasks) {
        setTasks(updatedTasks);
      }
    } catch (error) {
      console.error('Erro ao criar tarefa', error);
      setTasks((prev) => prev.filter((task) => task.id !== tempId));
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
        </h3>

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
              className={`flex-1 text-sm ${
                task.completed ? `${mutedColor} line-through` : textColor
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


