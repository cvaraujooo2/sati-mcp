import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Plus } from 'lucide-react';
import {
  useToolInput,
  useToolOutput,
  useTheme,
  useSafeArea,
  useUserAgent,
} from './hooks/useOpenAi';
import { useAuth, useFocusSession } from '@/lib/hooks';

interface FocusTimerInput {
  sessionId: string;
  hyperfocus: {
    id: string;
    title: string;
    color: string;
  };
  durationMinutes: number;
  startedAt: string;
  endsAt: string;
  status: 'active' | 'paused' | 'completed';
  playSound?: boolean;
  alarmSound?: 'gentle-bell' | 'soft-chime' | 'vibrate' | 'none';
  gentleEnd?: boolean;
}

interface FocusTimerOutput {
  sessionId: string;
  startedAt: string;
  endsAt: string;
  status: 'active' | 'paused' | 'completed';
}

// Props podem vir diretamente do componente Message.tsx
interface FocusTimerProps extends Partial<FocusTimerInput> {}

export function FocusTimer(props: FocusTimerProps = {}) {
  console.log('[FocusTimer] RENDER START');
  
  const toolInput = useToolInput<FocusTimerInput>();
  const toolOutput = useToolOutput<FocusTimerOutput>();
  const theme = useTheme();
  const safeArea = useSafeArea();
  const userAgent = useUserAgent();
  
  // Novos hooks de integração
  const { user } = useAuth();
  const { 
    session: activeSession, 
    loading: sessionLoading,
    error: sessionError,
    endSession,
    loadActiveSession 
  } = useFocusSession(user?.id || '');

  // Merge props: props diretos > toolOutput > toolInput
  const data = {
    ...toolInput,
    ...toolOutput,
    ...props,
  };

  console.log('[FocusTimer] RENDER HOOKS:', {
    hasToolInput: !!toolInput,
    hasToolOutput: !!toolOutput,
    hasProps: Object.keys(props).length > 0,
    hasActiveSession: !!activeSession,
    toolInputKeys: toolInput ? Object.keys(toolInput) : [],
    toolOutputKeys: toolOutput ? Object.keys(toolOutput) : [],
    propsKeys: Object.keys(props),
    mergedData: data,
  });

  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(
    data?.playSound !== false && data?.alarmSound !== 'none'
  );
  const [isCompleted, setIsCompleted] = useState(false);

  const initialDuration = data?.durationMinutes ?? 25;
  const hyperfocusTitle = data?.hyperfocus?.title ?? 'Foco';
  const sessionId = data?.sessionId || activeSession?.id;
  const endsAt = data?.endsAt || activeSession?.ended_at;
  const status = data?.status ?? 'active';

  // Carregar sessão ativa ao montar
  useEffect(() => {
    if (user?.id && !sessionId) {
      loadActiveSession();
    }
  }, [user?.id, sessionId, loadActiveSession]);

  // DEBUG: Log props recebidos
  useEffect(() => {
    console.log('[FocusTimer] DEBUG Props:', {
      data,
      sessionId,
      endsAt,
      status,
      durationMinutes: initialDuration,
      hasEndsAt: !!endsAt,
      endsAtType: typeof endsAt,
    });
  }, [data, sessionId, endsAt, status, initialDuration]);

  // Função para lidar com conclusão do timer
  const handleTimerComplete = useCallback(async () => {
    if (!sessionId || !user?.id) return;

    // 1. Salvar conclusão no Supabase
    const success = await endSession(sessionId, true);

    if (!success) {
      console.error('[FocusTimer] Erro ao finalizar sessão:', sessionError);
      return;
    }

    // 2. Tocar som se habilitado
    if (isSoundEnabled && data?.alarmSound && data.alarmSound !== 'none') {
      playAlarmSound(data.alarmSound, data.gentleEnd ?? true);
    }

    // 3. Vibrar se disponível
    if (
      data?.alarmSound === 'vibrate' &&
      'vibrate' in navigator &&
      userAgent?.device.type === 'mobile'
    ) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }

    // 4. Atualizar UI
    setIsCompleted(true);

    // 5. OPCIONAL: Notificar ChatGPT
    if (window.openai?.callTool) {
      try {
        await window.openai.callTool('endFocusTimer', {
          sessionId: sessionId,
        });
      } catch (error) {
        console.warn('[FocusTimer] ChatGPT notification failed:', error);
      }
    }
  }, [sessionId, user, endSession, sessionError, isSoundEnabled, data, userAgent]);

  // Calcula tempo restante baseado no endsAt
  useEffect(() => {
    console.log('[FocusTimer] useEffect TIMER:', {
      endsAt,
      status,
      endsAtType: typeof endsAt,
      statusType: typeof status,
      isEndsAtValid: !!endsAt,
      isStatusCompleted: status === 'completed',
    });

    if (!endsAt || status === 'completed') {
      console.log('[FocusTimer] EARLY RETURN - Setting completed=true');
      setIsCompleted(true);
      return;
    }

    const endsAtDate = new Date(endsAt);
    console.log('[FocusTimer] Parsed endsAt:', {
      endsAtString: endsAt,
      endsAtDate: endsAtDate.toISOString(),
      endsAtTimestamp: endsAtDate.getTime(),
      isValid: !isNaN(endsAtDate.getTime()),
    });

    const updateTimeLeft = () => {
      const now = new Date();
      const diff = endsAtDate.getTime() - now.getTime();
      
      console.log('[FocusTimer] Tick:', {
        now: now.toISOString(),
        endsAt: endsAtDate.toISOString(),
        diff,
        diffMinutes: (diff / 1000 / 60).toFixed(2),
        diffSeconds: Math.floor(diff / 1000),
      });

      if (diff <= 0) {
        console.log('[FocusTimer] TIMER COMPLETE - diff <= 0');
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
  }, [handleTimerComplete, endsAt, status]);

  const handlePauseResume = useCallback(async () => {
    setIsPaused((prev) => !prev);
    // TODO: Implementar pause/resume no backend
  }, []);

  const handleReset = useCallback(async () => {
    if (!window.openai?.callTool) {
      console.error('[FocusTimer] OpenAI client not initialized');
      return;
    }

    if (!sessionId || !data?.hyperfocus?.id) {
      console.error('[FocusTimer] Missing required IDs');
      return;
    }

    try {
      await window.openai.callTool('endFocusTimer', {
        sessionId: sessionId,
        interrupted: true,
      });
      
      // Reiniciar timer
      await window.openai.callTool('startFocusTimer', {
        hyperfocusId: data.hyperfocus.id,
        durationMinutes: initialDuration,
      });
    } catch (error) {
      console.error('[FocusTimer] Failed to reset timer:', error);
      // TODO: Adicionar toast de erro
    }
  }, [sessionId, data?.hyperfocus?.id, initialDuration]);

  const handleExtend = useCallback(async () => {
    if (!window.openai?.callTool) {
      console.error('[FocusTimer] OpenAI client not initialized');
      return;
    }

    if (!sessionId) {
      console.error('[FocusTimer] Missing sessionId');
      return;
    }

    try {
      await window.openai.callTool('extendFocusTimer', {
        sessionId: sessionId,
        additionalMinutes: 15,
      });
    } catch (error) {
      console.error('[FocusTimer] Failed to extend timer:', error);
      // TODO: Adicionar toast de erro
      // toast.error('Falha ao estender timer. Recurso ainda não disponível.');
    }
  }, [sessionId]);

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

  return (
    <div
      className={`${cardBg} ${textColor} rounded-xl shadow-lg p-6 max-w-md mx-auto`}
    >
      {/* Loading state */}
      {sessionLoading && (
        <div className="text-center mb-4">
          <p className={`text-sm ${mutedColor}`}>Carregando sessão...</p>
        </div>
      )}

      {/* Error message */}
      {sessionError && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg">
          <p className="text-red-400 text-sm">⚠️ {sessionError}</p>
        </div>
      )}

      {/* Título do hiperfoco */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold mb-2">{hyperfocusTitle}</h2>
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
      <div className="flex gap-3 justify-center mb-6">
        {!isCompleted && (
          <>
            <button
              onClick={handlePauseResume}
              className={`p-3 rounded-full ${cardBg} hover:bg-gray-700 transition-colors shadow-md`}
              aria-label={isPaused ? 'Retomar' : 'Pausar'}
            >
              {isPaused ? <Play size={20} /> : <Pause size={20} />}
            </button>
            <button
              onClick={handleReset}
              className={`p-3 rounded-full ${cardBg} hover:bg-gray-700 transition-colors shadow-md`}
              aria-label="Reiniciar"
            >
              <RotateCcw size={20} />
            </button>
          </>
        )}
        <button
          onClick={() => setIsSoundEnabled((prev) => !prev)}
          className={`p-3 rounded-full ${cardBg} hover:bg-gray-700 transition-colors shadow-md`}
          aria-label={isSoundEnabled ? 'Desativar som' : 'Ativar som'}
        >
          {isSoundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </div>

      {/* Botão de estender (aparece quando <5min) */}
      {!isCompleted && timeLeft < 300 && timeLeft > 0 && (
        <button
          onClick={handleExtend}
          className={`flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors mx-auto`}
        >
          <Plus size={18} />
          <span>+15 min</span>
        </button>
      )}

      {/* Mensagem de conclusão */}
      {isCompleted && (
        <div className="text-center mt-4">
          <div className="text-4xl mb-3">🎉</div>
          <h3 className="text-lg font-semibold mb-2">Sessão concluída!</h3>
          <p className={`${mutedColor} text-sm`}>
            {initialDuration} minutos de foco em {hyperfocusTitle}
          </p>
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

