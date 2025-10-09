import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, X, Plus } from 'lucide-react';
import {
  useToolInput,
  useToolOutput,
  useTheme,
  useSafeArea,
  useUserAgent,
} from './hooks/useOpenAi';

interface FocusTimerInput {
  hyperfocusId: string;
  hyperfocusTitle: string;
  durationMinutes: number;
  alarmSound?: 'gentle-bell' | 'soft-chime' | 'vibrate' | 'none';
  gentleEnd?: boolean;
}

interface FocusTimerOutput {
  sessionId: string;
  startedAt: string;
  endsAt: string;
  status: 'active' | 'paused' | 'completed';
}

export function FocusTimer() {
  const toolInput = useToolInput<FocusTimerInput>();
  const toolOutput = useToolOutput<FocusTimerOutput>();
  const theme = useTheme();
  const safeArea = useSafeArea();
  const userAgent = useUserAgent();

  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(
    toolInput?.alarmSound !== 'none' && toolInput?.alarmSound !== 'vibrate'
  );
  const [isCompleted, setIsCompleted] = useState(false);

  const initialDuration = toolInput?.durationMinutes ?? 25;
  const hyperfocusTitle = toolInput?.hyperfocusTitle ?? 'Foco';

  // Calcula tempo restante baseado no endsAt
  useEffect(() => {
    if (!toolOutput?.endsAt || toolOutput.status === 'completed') {
      setIsCompleted(true);
      return;
    }

    const endsAt = new Date(toolOutput.endsAt);
    const updateTimeLeft = () => {
      const now = new Date();
      const diff = endsAt.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft(0);
        setIsCompleted(true);
        handleTimerComplete();
      } else {
        setTimeLeft(Math.floor(diff / 1000));
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [handleTimerComplete, toolOutput?.endsAt, toolOutput?.status]);

  const handleTimerComplete = useCallback(() => {
    // Tocar som se habilitado
    if (isSoundEnabled && toolInput?.alarmSound && toolInput.alarmSound !== 'none') {
      playAlarmSound(toolInput.alarmSound, toolInput.gentleEnd ?? true);
    }

    // Vibrar se disponível
    if (
      toolInput?.alarmSound === 'vibrate' &&
      'vibrate' in navigator &&
      userAgent?.device.type === 'mobile'
    ) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }

    // Chamar tool para finalizar sessão
    if (window.openai?.callTool) {
      window.openai.callTool('endFocusTimer', {
        sessionId: toolOutput?.sessionId,
      });
    }
  }, [isSoundEnabled, toolInput, toolOutput?.sessionId, userAgent]);

  const handlePauseResume = useCallback(async () => {
    setIsPaused((prev) => !prev);
    // TODO: Implementar pause/resume no backend
  }, []);

  const handleReset = useCallback(async () => {
    if (window.openai?.callTool && toolOutput?.sessionId) {
      await window.openai.callTool('endFocusTimer', {
        sessionId: toolOutput.sessionId,
        interrupted: true,
      });
      // Reiniciar timer
      await window.openai.callTool('startFocusTimer', {
        hyperfocusId: toolInput?.hyperfocusId,
        durationMinutes: initialDuration,
      });
    }
  }, [toolOutput?.sessionId, toolInput?.hyperfocusId, initialDuration]);

  const handleExtend = useCallback(async () => {
    if (window.openai?.callTool && toolOutput?.sessionId) {
      await window.openai.callTool('extendFocusTimer', {
        sessionId: toolOutput.sessionId,
        additionalMinutes: 15,
      });
    }
  }, [toolOutput?.sessionId]);

  const handleClose = useCallback(async () => {
    // Retornar ao modo inline
    if (window.openai?.requestDisplayMode) {
      await window.openai.requestDisplayMode({ mode: 'inline' });
    }
  }, []);

  const { minutes, seconds, progress } = useMemo(() => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const totalSeconds = initialDuration * 60;
    const elapsed = totalSeconds - timeLeft;
    const prog = totalSeconds > 0 ? (elapsed / totalSeconds) * 100 : 0;

    return { minutes: mins, seconds: secs, progress: prog };
  }, [timeLeft, initialDuration]);

  // Determinar cor baseado no progresso
  const timerColor = useMemo(() => {
    if (isCompleted) return 'text-green-500';
    if (progress > 90) return 'text-red-500';
    if (progress > 70) return 'text-orange-500';
    if (progress > 40) return 'text-yellow-500';
    return 'text-blue-500';
  }, [progress, isCompleted]);

  const bgColor = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50';
  const cardBg = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const mutedColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';

  // Calcular padding para safe area (importante no mobile)
  const safeInsets = safeArea?.insets ?? { top: 0, bottom: 0, left: 0, right: 0 };

  return (
    <div
      className={`${bgColor} ${textColor} min-h-screen flex flex-col items-center justify-center p-4`}
      style={{
        paddingTop: `max(1rem, ${safeInsets.top}px)`,
        paddingBottom: `max(1rem, ${safeInsets.bottom}px)`,
        paddingLeft: `max(1rem, ${safeInsets.left}px)`,
        paddingRight: `max(1rem, ${safeInsets.right}px)`,
      }}
    >
      {/* Header com botão de fechar */}
      <div className="w-full max-w-md flex justify-end mb-8">
        <button
          onClick={handleClose}
          className={`p-2 rounded-lg hover:bg-gray-700/50 transition-colors ${mutedColor}`}
          aria-label="Fechar"
        >
          <X size={24} />
        </button>
      </div>

      {/* Título do hiperfoco */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold mb-2">{hyperfocusTitle}</h1>
        <p className={`text-sm ${mutedColor}`}>
          {isCompleted ? 'Sessão concluída!' : isPaused ? 'Pausado' : 'Em foco'}
        </p>
      </div>

      {/* Timer circular */}
      <div className="relative w-80 h-80 mb-12">
        {/* Background circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="160"
            cy="160"
            r="140"
            stroke={theme === 'dark' ? '#374151' : '#e5e7eb'}
            strokeWidth="12"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="160"
            cy="160"
            r="140"
            stroke="currentColor"
            strokeWidth="12"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 140}`}
            strokeDashoffset={`${2 * Math.PI * 140 * (1 - progress / 100)}`}
            strokeLinecap="round"
            className={`${timerColor} transition-all duration-1000`}
          />
        </svg>

        {/* Tempo no centro */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`text-6xl font-bold tabular-nums ${timerColor}`}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          {!isCompleted && (
            <div className={`text-sm mt-2 ${mutedColor}`}>
              {Math.round(progress)}% concluído
            </div>
          )}
        </div>
      </div>

      {/* Controles */}
      <div className="flex gap-4 mb-8">
        {!isCompleted && (
          <>
            <button
              onClick={handlePauseResume}
              className={`p-4 rounded-full ${cardBg} hover:bg-gray-700 transition-colors shadow-lg`}
              aria-label={isPaused ? 'Retomar' : 'Pausar'}
            >
              {isPaused ? <Play size={24} /> : <Pause size={24} />}
            </button>
            <button
              onClick={handleReset}
              className={`p-4 rounded-full ${cardBg} hover:bg-gray-700 transition-colors shadow-lg`}
              aria-label="Reiniciar"
            >
              <RotateCcw size={24} />
            </button>
          </>
        )}
        <button
          onClick={() => setIsSoundEnabled((prev) => !prev)}
          className={`p-4 rounded-full ${cardBg} hover:bg-gray-700 transition-colors shadow-lg`}
          aria-label={isSoundEnabled ? 'Desativar som' : 'Ativar som'}
        >
          {isSoundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
        </button>
      </div>

      {/* Botão de estender (aparece quando <5min) */}
      {!isCompleted && timeLeft < 300 && timeLeft > 0 && (
        <button
          onClick={handleExtend}
          className={`flex items-center gap-2 px-6 py-3 ${cardBg} hover:bg-gray-700 rounded-lg transition-colors shadow-lg`}
        >
          <Plus size={20} />
          <span>Estender +15 minutos</span>
        </button>
      )}

      {/* Mensagem de conclusão */}
      {isCompleted && (
        <div className={`${cardBg} rounded-lg p-6 max-w-md text-center shadow-xl`}>
          <div className="text-4xl mb-4">🎉</div>
          <h2 className="text-xl font-semibold mb-2">Sessão de foco concluída!</h2>
          <p className={`${mutedColor} mb-4`}>
            Você focou por {initialDuration} minutos em {hyperfocusTitle}
          </p>
          <button
            onClick={handleClose}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Voltar à conversa
          </button>
        </div>
      )}
    </div>
  );
}

// Função helper para tocar som de alarme
function playAlarmSound(sound: string, gentleEnd: boolean) {
  const audio = new Audio(`/sounds/${sound}.mp3`);
  audio.volume = gentleEnd ? 0.3 : 0.7;

  if (gentleEnd) {
    // Fade in gradual
    audio.volume = 0;
    audio.play();
    const fadeIn = setInterval(() => {
      if (audio.volume < 0.3) {
        audio.volume = Math.min(0.3, audio.volume + 0.05);
      } else {
        clearInterval(fadeIn);
      }
    }, 100);
  } else {
    audio.play();
  }
}

