'use client';

import { useAuth, useHyperfocus, useTasks, useFocusSession } from '@/lib/hooks';
import { useEffect, useState } from 'react';

export default function TestHooksPage() {
  const { user, loading: authLoading } = useAuth();
  const { 
    hyperfocusList, 
    loading: hyperfocusLoading, 
    error: hyperfocusError,
    loadHyperfocusList, 
    createHyperfocus 
  } = useHyperfocus(user?.id || '');

  const {
    tasks,
    loading: tasksLoading,
    error: tasksError,
    loadTasks,
    toggleTaskComplete,
  } = useTasks(user?.id || '');

  const {
    session,
    loading: sessionLoading,
    error: sessionError,
    loadActiveSession,
  } = useFocusSession(user?.id || '');

  const [selectedHyperfocusId, setSelectedHyperfocusId] = useState<string>('');

  // Carregar dados quando usuário estiver disponível
  useEffect(() => {
    if (user?.id) {
      loadHyperfocusList();
      loadActiveSession();
    }
  }, [user?.id, loadHyperfocusList, loadActiveSession]);

  // Carregar tarefas quando hiperfoco for selecionado
  useEffect(() => {
    if (selectedHyperfocusId && user?.id) {
      loadTasks(selectedHyperfocusId);
    }
  }, [selectedHyperfocusId, user?.id, loadTasks]);

  const handleCreateHyperfocus = async () => {
    const result = await createHyperfocus({
      title: `Teste Manual ${new Date().toLocaleTimeString()}`,
      description: 'Criado pelo hook de teste',
      color: 'blue',
      estimated_time_minutes: 30,
    });

    if (result) {
      alert('Hiperfoco criado com sucesso!');
    }
  };

  const handleToggleTask = async (taskId: string) => {
    const success = await toggleTaskComplete(taskId);
    if (success) {
      console.log('✅ Tarefa atualizada!');
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Carregando autenticação...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg mb-4">Você precisa estar autenticado para testar os hooks.</p>
          <a href="/auth/login" className="text-blue-500 underline">
            Fazer login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">🧪 Test Hooks Page</h1>

      {/* User Info */}
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-2">👤 Usuário Autenticado</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <strong>ID:</strong> {user.id}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <strong>Email:</strong> {user.email}
        </p>
      </div>

      {/* Hyperfocus Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">🎯 Hiperfocos</h2>
          <button 
            onClick={handleCreateHyperfocus}
            disabled={hyperfocusLoading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {hyperfocusLoading ? 'Criando...' : '+ Criar Hiperfoco'}
          </button>
        </div>

        {hyperfocusError && (
          <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-3 rounded mb-4">
            ❌ {hyperfocusError}
          </div>
        )}

        {hyperfocusLoading && <p className="text-gray-500">Carregando hiperfocos...</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hyperfocusList.map((h) => (
            <div 
              key={h.id}
              onClick={() => setSelectedHyperfocusId(h.id)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedHyperfocusId === h.id 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: h.color || 'gray' }}
                />
                <h3 className="font-semibold">{h.title}</h3>
              </div>
              {h.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{h.description}</p>
              )}
              {h.estimated_time_minutes && (
                <p className="text-xs text-gray-500 mt-2">
                  ⏱️ {h.estimated_time_minutes} minutos
                </p>
              )}
            </div>
          ))}
        </div>

        {hyperfocusList.length === 0 && !hyperfocusLoading && (
          <p className="text-gray-500 text-center py-8">
            Nenhum hiperfoco encontrado. Crie um para começar!
          </p>
        )}
      </div>

      {/* Tasks Section */}
      {selectedHyperfocusId && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">✅ Tarefas</h2>

          {tasksError && (
            <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-3 rounded mb-4">
              ❌ {tasksError}
            </div>
          )}

          {tasksLoading && <p className="text-gray-500">Carregando tarefas...</p>}

          <div className="space-y-2">
            {tasks.map((task) => (
              <div 
                key={task.id}
                className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <input
                  type="checkbox"
                  checked={task.completed || false}
                  onChange={() => handleToggleTask(task.id)}
                  className="w-5 h-5 cursor-pointer"
                />
                <span className={task.completed ? 'line-through text-gray-500' : ''}>
                  {task.title}
                </span>
                {task.estimated_minutes && (
                  <span className="ml-auto text-xs text-gray-500">
                    {task.estimated_minutes} min
                  </span>
                )}
              </div>
            ))}
          </div>

          {tasks.length === 0 && !tasksLoading && (
            <p className="text-gray-500 text-center py-8">
              Nenhuma tarefa encontrada para este hiperfoco.
            </p>
          )}
        </div>
      )}

      {/* Focus Session Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">⏱️ Sessão de Foco Ativa</h2>

        {sessionError && (
          <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-3 rounded mb-4">
            ❌ {sessionError}
          </div>
        )}

        {sessionLoading && <p className="text-gray-500">Carregando sessão...</p>}

        {session ? (
          <div className="bg-green-100 dark:bg-green-900/20 p-4 rounded-lg">
            <p className="font-semibold">✅ Sessão ativa encontrada</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              <strong>ID:</strong> {session.id}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Iniciada em:</strong> {new Date(session.started_at).toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Duração planejada:</strong> {session.planned_duration_minutes} minutos
            </p>
          </div>
        ) : (
          !sessionLoading && (
            <p className="text-gray-500">Nenhuma sessão ativa no momento.</p>
          )
        )}
      </div>

      {/* Debug Info */}
      <details className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
        <summary className="cursor-pointer font-semibold">🔍 Debug Info</summary>
        <pre className="mt-4 text-xs overflow-auto">
          {JSON.stringify({
            user: { id: user.id, email: user.email },
            hyperfocusCount: hyperfocusList.length,
            tasksCount: tasks.length,
            activeSession: session?.id || null,
          }, null, 2)}
        </pre>
      </details>
    </div>
  );
}
