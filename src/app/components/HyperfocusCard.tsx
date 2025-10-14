import React, { useCallback, useState } from 'react';
import { CheckCircle, Clock, Edit2 } from 'lucide-react';
import { useToolOutput, useTheme } from './hooks/useOpenAi';
import { useAuth, useHyperfocus } from '@/lib/hooks';

interface Hyperfocus {
  id: string;
  title: string;
  description?: string;
  color: string;
  estimatedTimeMinutes?: number;
  taskCount: number;
}

interface HyperfocusCardOutput {
  hyperfocus: Hyperfocus;
}

export function HyperfocusCard() {
  const toolOutput = useToolOutput<HyperfocusCardOutput>();
  const theme = useTheme();
  
  // Novos hooks de integração
  const { user } = useAuth();
  const { updateHyperfocus, loading: saving, error } = useHyperfocus(user?.id || '');
  
  const [showSuccess, setShowSuccess] = useState(false);

  const hyperfocus = toolOutput?.hyperfocus;

  const handleCreateTasks = useCallback(async () => {
    if (!hyperfocus?.id) return;

    if (window.openai?.sendFollowUpMessage) {
      await window.openai.sendFollowUpMessage({
        prompt: `Criar tarefas para o hiperfoco "${hyperfocus.title}"`,
      });
    }
  }, [hyperfocus]);

  const handleStartTimer = useCallback(async () => {
    if (!hyperfocus?.id || !user?.id) return;

    // 1. Salvar no Supabase ANTES de chamar ChatGPT
    // Atualizar timestamp ou marcar como "em foco"
    const updated = await updateHyperfocus(hyperfocus.id, {
      // Aqui podemos adicionar um campo "last_focused_at" no futuro
      // Por enquanto, apenas garantimos que existe no banco
      title: hyperfocus.title,
      color: hyperfocus.color as any,
    });

    if (!updated) {
      console.error('Erro ao atualizar hiperfoco:', error);
      // Poderia mostrar um toast de erro aqui
      return;
    }

    // 2. Depois chamar ChatGPT para criar o timer visual
    if (window.openai?.callTool) {
      await window.openai.callTool('startFocusTimer', {
        hyperfocusId: hyperfocus.id,
        hyperfocusTitle: hyperfocus.title,
        durationMinutes: hyperfocus.estimatedTimeMinutes ?? 30,
      });
    }
    
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  }, [hyperfocus, user, updateHyperfocus, error]);

  if (!hyperfocus) {
    return null;
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

  const colorClass =
    colorClasses[hyperfocus.color as keyof typeof colorClasses] ?? colorClasses.blue;

  const bgColor = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const mutedColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const borderColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-300';

  return (
    <div className={`${bgColor} rounded-lg p-6 shadow-lg border ${borderColor} max-w-2xl`}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className={`w-3 h-3 rounded-full ${colorClass} mt-1.5 flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <h3 className={`text-xl font-semibold ${textColor} mb-1`}>
            {hyperfocus.title}
          </h3>
          {hyperfocus.description && (
            <p className={`${mutedColor} text-sm leading-relaxed`}>
              {hyperfocus.description}
            </p>
          )}
        </div>
      </div>

      {/* Meta info */}
      <div className={`flex items-center gap-4 text-sm ${mutedColor} mb-4 flex-wrap`}>
        {hyperfocus.estimatedTimeMinutes && (
          <div className="flex items-center gap-1.5">
            <Clock size={16} className="flex-shrink-0" />
            <span>{hyperfocus.estimatedTimeMinutes} min estimados</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <CheckCircle size={16} className="flex-shrink-0" />
          <span>0/{hyperfocus.taskCount} tarefas</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mb-4 flex-col sm:flex-row">
        <button
          onClick={handleCreateTasks}
          disabled={saving}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Edit2 size={16} />
          {saving ? 'Salvando...' : 'Criar Tarefas'}
        </button>
        <button
          onClick={handleStartTimer}
          disabled={saving}
          className={`flex-1 ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors`}
        >
          ⏰ {saving ? 'Salvando...' : 'Iniciar Timer'}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg">
          <p className="text-red-400 text-sm flex items-start gap-2">
            <span className="text-lg">⚠️</span>
            <span className="flex-1">{error}</span>
          </p>
        </div>
      )}

      {/* Success message */}
      {showSuccess && (
        <div className="p-3 bg-green-900/30 border border-green-700 rounded-lg">
          <p className="text-green-400 text-sm flex items-start gap-2">
            <span className="text-lg">✅</span>
            <span className="flex-1">
              Timer iniciado com sucesso!
            </span>
          </p>
        </div>
      )}

      {/* Default success message */}
      {!showSuccess && (
        <div className="p-3 bg-green-900/30 border border-green-700 rounded-lg">
          <p className="text-green-400 text-sm flex items-start gap-2">
            <span className="text-lg">✨</span>
            <span className="flex-1">
              Hiperfoco criado com sucesso! Pronto para estruturar em tarefas e começar a focar.
            </span>
          </p>
        </div>
      )}
    </div>
  );
}


