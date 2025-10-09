import React, { useCallback, useMemo } from 'react';
import { Trophy, Clock, CheckCircle, Target, TrendingUp, Share2 } from 'lucide-react';
import { useToolOutput, useTheme } from './hooks/useOpenAi';

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

interface FocusSessionSummaryOutput {
  sessionId: string;
  hyperfocusId: string;
  hyperfocusTitle: string;
  startedAt: string;
  endedAt: string;
  plannedDurationMinutes: number;
  actualDurationMinutes: number;
  interrupted: boolean;
  tasksCompleted: number;
  totalTasks: number;
  completedTasks?: Task[];
  feedback: string;
  streak?: number;
  totalFocusTimeToday?: number;
}

const encouragingMessages = [
  'Excelente trabalho! 🎉',
  'Você está no caminho certo! 🚀',
  'Progresso incrível! ⭐',
  'Continue assim! 💪',
  'Cada passo conta! 🎯',
];

export function FocusSessionSummary() {
  const toolOutput = useToolOutput<FocusSessionSummaryOutput>();
  const theme = useTheme();

  const handleContinue = useCallback(async () => {
    if (window.openai?.callTool && toolOutput?.hyperfocusId) {
      await window.openai.callTool('startFocusTimer', {
        hyperfocusId: toolOutput.hyperfocusId,
        hyperfocusTitle: toolOutput.hyperfocusTitle,
        durationMinutes: toolOutput.plannedDurationMinutes,
      });
    }
  }, [toolOutput]);

  const handleViewTasks = useCallback(async () => {
    if (window.openai?.sendFollowUpMessage && toolOutput?.hyperfocusTitle) {
      await window.openai.sendFollowUpMessage({
        prompt: `Mostre as tarefas do hiperfoco "${toolOutput.hyperfocusTitle}"`,
      });
    }
  }, [toolOutput]);

  const handleShareProgress = useCallback(async () => {
    const summary = `Acabei de completar ${toolOutput?.actualDurationMinutes}min de foco em "${toolOutput?.hyperfocusTitle}"! ${toolOutput?.tasksCompleted}/${toolOutput?.totalTasks} tarefas concluídas. 🎯`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Meu Progresso no Sati',
          text: summary,
        });
      } catch {
        console.log('Compartilhamento cancelado');
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(summary);
      alert('Progresso copiado para a área de transferência!');
    }
  }, [toolOutput]);

  const handleClose = useCallback(async () => {
    if (window.openai?.requestDisplayMode) {
      await window.openai.requestDisplayMode({ mode: 'inline' });
    }
  }, []);

  // Calcular estatísticas
  const stats = useMemo(() => {
    if (!toolOutput) return null;

    const completion =
      toolOutput.totalTasks > 0
        ? Math.round((toolOutput.tasksCompleted / toolOutput.totalTasks) * 100)
        : 0;

    const efficiency =
      toolOutput.plannedDurationMinutes > 0
        ? Math.round(
            (toolOutput.actualDurationMinutes / toolOutput.plannedDurationMinutes) * 100
          )
        : 100;

    const isOnTime = efficiency >= 90 && efficiency <= 110;
    const isHighCompletion = completion >= 75;

    return {
      completion,
      efficiency,
      isOnTime,
      isHighCompletion,
      performanceScore: Math.round((completion + (isOnTime ? 100 : efficiency)) / 2),
    };
  }, [toolOutput]);

  const cardBg = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const mutedColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const borderColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-300';

  if (!toolOutput || !stats) {
    return (
      <div className={`${cardBg} rounded-lg p-6 border ${borderColor} max-w-2xl`}>
        <div className="text-center">
          <Clock className={`mx-auto mb-4 ${mutedColor}`} size={48} />
          <p className={mutedColor}>Carregando resumo...</p>
        </div>
      </div>
    );
  }

  const randomMessage =
    encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];

  return (
    <div className={`${cardBg} rounded-lg p-6 border ${borderColor} max-w-3xl`}>
      {/* Header com emoji e título */}
      <div className="text-center mb-8">
        <div className="text-7xl mb-4">
          {toolOutput.interrupted ? '⏸️' : stats.performanceScore >= 80 ? '🎉' : '✅'}
        </div>
        <h2 className={`text-3xl font-bold ${textColor} mb-2`}>
          {toolOutput.interrupted ? 'Sessão Pausada' : 'Sessão Completa!'}
        </h2>
        <p className={`text-lg ${mutedColor}`}>{toolOutput.hyperfocusTitle}</p>
        <p className={`text-sm ${mutedColor} mt-2`}>{randomMessage}</p>
      </div>

      {/* Cards de estatísticas principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<Clock size={20} />}
          label="Tempo de Foco"
          value={`${toolOutput.actualDurationMinutes}min`}
          subtext={`de ${toolOutput.plannedDurationMinutes}min`}
          theme={theme}
        />
        <StatCard
          icon={<CheckCircle size={20} />}
          label="Tarefas"
          value={`${toolOutput.tasksCompleted}/${toolOutput.totalTasks}`}
          subtext={`${stats.completion}% completas`}
          theme={theme}
        />
        <StatCard
          icon={<Target size={20} />}
          label="Eficiência"
          value={`${stats.efficiency}%`}
          subtext={stats.isOnTime ? 'No tempo!' : 'Do planejado'}
          theme={theme}
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          label="Performance"
          value={`${stats.performanceScore}%`}
          subtext="Score geral"
          theme={theme}
        />
      </div>

      {/* Streak e tempo total do dia */}
      {(toolOutput.streak !== undefined || toolOutput.totalFocusTimeToday !== undefined) && (
        <div className={`${cardBg} border ${borderColor} rounded-lg p-4 mb-6`}>
          <div className="flex items-center justify-around">
            {toolOutput.streak !== undefined && toolOutput.streak > 0 && (
              <div className="text-center">
                <div className="text-3xl mb-1">🔥</div>
                <p className={`text-2xl font-bold ${textColor}`}>{toolOutput.streak}</p>
                <p className={`text-xs ${mutedColor}`}>
                  {toolOutput.streak === 1 ? 'dia' : 'dias'} de sequência
                </p>
              </div>
            )}
            {toolOutput.totalFocusTimeToday !== undefined && (
              <div className="text-center">
                <div className="text-3xl mb-1">⏰</div>
                <p className={`text-2xl font-bold ${textColor}`}>
                  {Math.floor(toolOutput.totalFocusTimeToday / 60)}h
                  {toolOutput.totalFocusTimeToday % 60}min
                </p>
                <p className={`text-xs ${mutedColor}`}>tempo de foco hoje</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tarefas completadas */}
      {toolOutput.completedTasks && toolOutput.completedTasks.length > 0 && (
        <div className={`${cardBg} border ${borderColor} rounded-lg p-4 mb-6`}>
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="text-yellow-500" size={20} />
            <h3 className={`font-semibold ${textColor}`}>Tarefas Completadas</h3>
          </div>
          <div className="space-y-2">
            {toolOutput.completedTasks.map((task, index) => (
              <div key={task.id} className="flex items-start gap-2">
                <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                <span className={`text-sm ${textColor}`}>
                  {index + 1}. {task.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feedback personalizado */}
      {toolOutput.feedback && (
        <div className={`${cardBg} border border-blue-600/30 bg-blue-600/10 rounded-lg p-4 mb-6`}>
          <p className={`text-sm ${textColor}`}>💬 {toolOutput.feedback}</p>
        </div>
      )}

      {/* Badges de conquista */}
      <div className="flex flex-wrap gap-2 justify-center mb-6">
        {stats.isHighCompletion && (
          <Badge emoji="⭐" text="Alta Conclusão" theme={theme} />
        )}
        {stats.isOnTime && <Badge emoji="⏰" text="No Tempo" theme={theme} />}
        {!toolOutput.interrupted && (
          <Badge emoji="💪" text="Foco Completo" theme={theme} />
        )}
        {toolOutput.actualDurationMinutes >= 60 && (
          <Badge emoji="🎯" text="Deep Focus" theme={theme} />
        )}
        {toolOutput.streak && toolOutput.streak >= 3 && (
          <Badge emoji="🔥" text="Em Chamas" theme={theme} />
        )}
      </div>

      {/* Ações */}
      <div className="flex flex-col sm:flex-row gap-3">
        {!toolOutput.interrupted && (
          <button
            onClick={handleContinue}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Clock size={20} />
            Focar Mais 15min
          </button>
        )}
        <button
          onClick={handleViewTasks}
          className={`flex-1 px-6 py-3 ${cardBg} border ${borderColor} hover:bg-gray-700 rounded-lg transition-colors font-medium flex items-center justify-center gap-2`}
        >
          <CheckCircle size={20} />
          Ver Tarefas
        </button>
        <button
          onClick={handleShareProgress}
          className={`px-6 py-3 ${cardBg} border ${borderColor} hover:bg-gray-700 rounded-lg transition-colors font-medium flex items-center justify-center gap-2`}
        >
          <Share2 size={20} />
        </button>
      </div>

      {/* Botão de fechar */}
      <button
        onClick={handleClose}
        className={`w-full mt-4 px-6 py-2 text-sm ${mutedColor} hover:${textColor} transition-colors`}
      >
        Voltar à conversa
      </button>
    </div>
  );
}

// Componente helper para cards de estatística
function StatCard({
  icon,
  label,
  value,
  subtext,
  theme,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
  theme: string;
}) {
  const cardBg = theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100';
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const mutedColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';

  return (
    <div className={`${cardBg} rounded-lg p-4 text-center`}>
      <div className={`${mutedColor} mb-2 flex justify-center`}>{icon}</div>
      <p className={`text-xs ${mutedColor} mb-1`}>{label}</p>
      <p className={`text-xl font-bold ${textColor}`}>{value}</p>
      <p className={`text-xs ${mutedColor} mt-1`}>{subtext}</p>
    </div>
  );
}

// Componente helper para badges
function Badge({ emoji, text, theme }: { emoji: string; text: string; theme: string }) {
  const cardBg = theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200';
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 ${cardBg} rounded-full text-xs font-medium ${textColor}`}>
      <span>{emoji}</span>
      <span>{text}</span>
    </span>
  );
}

