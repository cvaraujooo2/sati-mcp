import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Play, Pause, SkipForward, X, Edit2, Coffee } from 'lucide-react';
import { useToolInput, useToolOutput, useTheme, useWidgetState } from './hooks/useOpenAi';

interface HyperfocusInSequence {
  hyperfocusId: string;
  hyperfocusTitle: string;
  color: string;
  durationMinutes: number;
}

interface AlternancyInput {
  name?: string;
  hyperfocusSequence: HyperfocusInSequence[];
  transitionBreakMinutes?: number;
  autoStart?: boolean;
}

interface AlternancyOutput {
  sessionId: string;
  name: string;
  sequence: HyperfocusInSequence[];
  transitionBreakMinutes: number;
  currentIndex: number;
  status: 'not_started' | 'in_progress' | 'on_break' | 'completed';
  startedAt?: string;
}

interface AlternancyWidgetState {
  currentIndex: number;
  status: 'not_started' | 'in_progress' | 'on_break' | 'completed';
  timeLeftInCurrentPhase: number;
}

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

export function AlternancyFlow() {
  const toolInput = useToolInput<AlternancyInput>();
  const toolOutput = useToolOutput<AlternancyOutput>();
  const theme = useTheme();

  const [widgetState, setWidgetState] = useWidgetState<AlternancyWidgetState & Record<string, unknown>>({
    currentIndex: toolOutput?.currentIndex ?? 0,
    status: toolOutput?.status ?? 'not_started',
    timeLeftInCurrentPhase: 0,
  });

  const [isPaused, setIsPaused] = useState(false);

  const sessionName = toolOutput?.name || toolInput?.name || 'Sessão de Alternância';
  const sequence = toolOutput?.sequence || toolInput?.hyperfocusSequence || [];
  const transitionBreak = toolOutput?.transitionBreakMinutes ?? toolInput?.transitionBreakMinutes ?? 5;

  const currentIndex = widgetState?.currentIndex ?? 0;
  const status = widgetState?.status ?? 'not_started';
  const timeLeft = widgetState?.timeLeftInCurrentPhase ?? 0;

  // Timer countdown
  useEffect(() => {
    if (status === 'not_started' || status === 'completed' || isPaused) {
      return;
    }

    const interval = setInterval(() => {
      setWidgetState((prev) => {
        if (!prev) return prev;

        const newTimeLeft = prev.timeLeftInCurrentPhase - 1;

        if (newTimeLeft <= 0) {
          // Avançar para próxima fase
          if (prev.status === 'in_progress') {
            // Ir para break
            return {
              ...prev,
              status: 'on_break',
              timeLeftInCurrentPhase: transitionBreak * 60,
            };
          } else if (prev.status === 'on_break') {
            const nextIndex = prev.currentIndex + 1;
            if (nextIndex >= sequence.length) {
              // Completou toda a sessão
              handleComplete();
              return {
                ...prev,
                status: 'completed',
                timeLeftInCurrentPhase: 0,
              };
            } else {
              // Próximo hiperfoco
              return {
                currentIndex: nextIndex,
                status: 'in_progress',
                timeLeftInCurrentPhase: sequence[nextIndex].durationMinutes * 60,
              };
            }
          }
        }

        return {
          ...prev,
          timeLeftInCurrentPhase: newTimeLeft,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status, isPaused, sequence, transitionBreak, setWidgetState]);

  const handleStart = useCallback(async () => {
    if (!window.openai?.callTool) {
      console.error('[AlternancyFlow] OpenAI client not initialized');
      // TODO: Adicionar toast de erro
      return;
    }

    if (!toolOutput?.sessionId) {
      console.error('[AlternancyFlow] Missing sessionId');
      return;
    }

    try {
      await window.openai.callTool('startAlternancy', {
        sessionId: toolOutput.sessionId,
      });

      setWidgetState({
        currentIndex: 0,
        status: 'in_progress',
        timeLeftInCurrentPhase: (sequence[0]?.durationMinutes ?? 0) * 60,
      });
    } catch (error) {
      console.error('[AlternancyFlow] Failed to start alternancy:', error);
      // TODO: Adicionar toast de erro
      // toast.error('Falha ao iniciar alternância. Tente novamente.');
    }
  }, [toolOutput?.sessionId, sequence, setWidgetState]);

  const handlePauseResume = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  const handleSkip = useCallback(() => {
    setWidgetState((prev) => {
      if (!prev) return prev;

      if (prev.status === 'in_progress') {
        // Pular para break
        return {
          ...prev,
          status: 'on_break',
          timeLeftInCurrentPhase: transitionBreak * 60,
        };
      } else if (prev.status === 'on_break') {
        // Pular para próximo hiperfoco
        const nextIndex = prev.currentIndex + 1;
        if (nextIndex >= sequence.length) {
          return { ...prev, status: 'completed', timeLeftInCurrentPhase: 0 };
        }
        return {
          currentIndex: nextIndex,
          status: 'in_progress',
          timeLeftInCurrentPhase: sequence[nextIndex].durationMinutes * 60,
        };
      }

      return prev;
    });
  }, [sequence, transitionBreak, setWidgetState]);

  const handleComplete = useCallback(async () => {
    if (!window.openai?.callTool) {
      console.error('[AlternancyFlow] OpenAI client not initialized');
      return;
    }

    if (!toolOutput?.sessionId) {
      console.error('[AlternancyFlow] Missing sessionId');
      return;
    }

    try {
      await window.openai.callTool('completeAlternancy', {
        sessionId: toolOutput.sessionId,
      });
    } catch (error) {
      console.error('[AlternancyFlow] Failed to complete alternancy:', error);
      // TODO: Adicionar toast de erro
      // toast.error('Falha ao completar alternância. Tente novamente.');
    }
  }, [toolOutput?.sessionId]);

  const handleClose = useCallback(async () => {
    if (window.openai?.requestDisplayMode) {
      await window.openai.requestDisplayMode({ mode: 'inline' });
    }
  }, []);

  const handleEdit = useCallback(async () => {
    if (!window.openai?.sendFollowUpMessage) {
      console.error('[AlternancyFlow] OpenAI client not initialized');
      return;
    }

    try {
      await window.openai.sendFollowUpMessage({
        prompt: 'Editar a ordem dos hiperfocos nesta sessão de alternância',
      });
    } catch (error) {
      console.error('[AlternancyFlow] Failed to send follow-up message:', error);
    }
  }, []);

  // Calcular duração total
  const totalDuration = useMemo(() => {
    const focusTime = sequence.reduce((sum, item) => sum + item.durationMinutes, 0);
    const breakTime = (sequence.length - 1) * transitionBreak;
    return focusTime + breakTime;
  }, [sequence, transitionBreak]);

  // Formatar tempo restante
  const { minutes, seconds } = useMemo(() => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return { minutes: mins, seconds: secs };
  }, [timeLeft]);

  const cardBg = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const mutedColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const borderColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-300';

  const currentItem = sequence[currentIndex];

  return (
    <div className={`${cardBg} rounded-lg p-6 border ${borderColor} max-w-3xl`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h2 className={`text-xl font-semibold ${textColor} mb-1`}>
            🔄 {sessionName}
          </h2>
          <p className={`text-sm ${mutedColor}`}>
            Duração total: ~{Math.floor(totalDuration / 60)}h{totalDuration % 60}min
          </p>
        </div>
        <button
          onClick={handleClose}
          className={`p-2 rounded-lg hover:bg-gray-700/50 transition-colors ${mutedColor}`}
        >
          <X size={20} />
        </button>
      </div>

      {/* Timeline visual */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-4">
          {sequence.map((item, index) => {
            const isActive = index === currentIndex && status === 'in_progress';
            const isPast = index < currentIndex;
            const isBreak = index === currentIndex && status === 'on_break';

            return (
              <React.Fragment key={index}>
                {/* Hiperfoco */}
                <div className="flex flex-col items-center min-w-[100px]">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-2 transition-all ${
                      isActive
                        ? 'ring-4 ring-blue-500 scale-110'
                        : isPast
                          ? 'opacity-50'
                          : ''
                    } ${cardBg} border-2 ${borderColor}`}
                  >
                    {colorEmojis[item.color as keyof typeof colorEmojis] || '🔵'}
                  </div>
                  <p
                    className={`text-xs text-center font-medium ${isActive ? textColor : mutedColor}`}
                  >
                    {item.hyperfocusTitle}
                  </p>
                  <p className={`text-xs ${mutedColor}`}>{item.durationMinutes}min</p>
                </div>

                {/* Seta de transição */}
                {index < sequence.length - 1 && (
                  <div className="flex flex-col items-center mx-2">
                    <div className={`w-12 h-0.5 ${borderColor}`} />
                    <Coffee
                      size={16}
                      className={`${isBreak ? 'text-orange-500' : mutedColor} mt-1`}
                    />
                    <p className={`text-xs ${mutedColor}`}>{transitionBreak}min</p>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Status atual */}
      {status !== 'not_started' && status !== 'completed' && currentItem && (
        <div className={`${cardBg} border ${borderColor} rounded-lg p-6 mb-6`}>
          <div className="text-center mb-4">
            <div className="text-5xl mb-3">
              {status === 'on_break' ? '☕' : colorEmojis[currentItem.color as keyof typeof colorEmojis] || '🔵'}
            </div>
            <h3 className={`text-2xl font-semibold ${textColor} mb-2`}>
              {status === 'on_break' ? 'Pausa de Transição' : currentItem.hyperfocusTitle}
            </h3>
            <p className={mutedColor}>
              {status === 'on_break'
                ? 'Relaxe antes do próximo hiperfoco'
                : `Foco ${currentIndex + 1} de ${sequence.length}`}
            </p>
          </div>

          {/* Timer */}
          <div className={`text-center text-6xl font-bold tabular-nums ${isPaused ? 'text-yellow-500' : 'text-blue-500'} mb-6`}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>

          {/* Controles */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={handlePauseResume}
              className={`px-6 py-3 ${cardBg} border ${borderColor} hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2`}
            >
              {isPaused ? (
                <>
                  <Play size={20} />
                  Retomar
                </>
              ) : (
                <>
                  <Pause size={20} />
                  Pausar
                </>
              )}
            </button>
            <button
              onClick={handleSkip}
              className={`px-6 py-3 ${cardBg} border ${borderColor} hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2`}
            >
              <SkipForward size={20} />
              Pular
            </button>
          </div>
        </div>
      )}

      {/* Estado: Não iniciado */}
      {status === 'not_started' && (
        <div className="text-center py-8">
          <p className={`${mutedColor} mb-6`}>
            Esta sessão está pronta para começar. Você alternará entre {sequence.length}{' '}
            hiperfocos com pausas de {transitionBreak} minutos entre eles.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleStart}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
            >
              <Play size={20} />
              Iniciar Sessão
            </button>
            <button
              onClick={handleEdit}
              className={`px-6 py-3 ${cardBg} border ${borderColor} hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2`}
            >
              <Edit2 size={18} />
              Editar Ordem
            </button>
          </div>
        </div>
      )}

      {/* Estado: Completado */}
      {status === 'completed' && (
        <div className={`${cardBg} border ${borderColor} rounded-lg p-8 text-center`}>
          <div className="text-6xl mb-4">🎉</div>
          <h3 className={`text-2xl font-semibold ${textColor} mb-2`}>
            Sessão de Alternância Concluída!
          </h3>
          <p className={`${mutedColor} mb-6`}>
            Você completou {sequence.length} hiperfocos em ~{Math.floor(totalDuration / 60)}h
            {totalDuration % 60}min
          </p>
          <button
            onClick={handleClose}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            Voltar à Conversa
          </button>
        </div>
      )}

      {/* Progresso geral */}
      {status !== 'not_started' && status !== 'completed' && (
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span className={mutedColor}>Progresso geral</span>
            <span className={mutedColor}>
              {currentIndex + 1}/{sequence.length} hiperfocos
            </span>
          </div>
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{
                width: `${((currentIndex + (status === 'on_break' ? 0.5 : 0)) / sequence.length) * 100}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

