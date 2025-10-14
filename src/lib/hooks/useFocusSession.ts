/**
 * Hook: useFocusSession
 * Gerencia sessões de foco e timer
 */

import { useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TimerService } from '@/lib/services/timer.service';
import { Database } from '@/types/database';
import * as queries from '@/lib/supabase/queries';
import type { SessionFilters, FocusSessionWithHyperfocus } from '@/lib/supabase/queries';

type FocusSession = Database['public']['Tables']['focus_sessions']['Row'];

export interface SessionStatistics {
  total: number;
  completed: number;
  interrupted: number;
  totalMinutes: number;
  completionRate: number;
  averageDuration: number;
}

interface UseFocusSessionReturn {
  session: FocusSession | null;
  sessions: FocusSessionWithHyperfocus[];
  loading: boolean;
  error: string | null;
  statistics: SessionStatistics | null;
  
  startSession: (hyperfocusId: string, durationMinutes: number) => Promise<FocusSession | null>;
  endSession: (sessionId: string, completed: boolean) => Promise<boolean>;
  loadActiveSession: () => Promise<void>;
  getActiveSessionForHyperfocus: (hyperfocusId: string) => Promise<FocusSession | null>;
  listAllSessions: (filters?: SessionFilters) => Promise<void>;
  listSessionsByHyperfocus: (hyperfocusId: string, filters?: SessionFilters) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<boolean>;
  pauseSession: (sessionId: string) => Promise<boolean>;
  addSessionNote: (sessionId: string, note: string) => Promise<boolean>;
  updateSessionDuration: (sessionId: string, durationMinutes: number) => Promise<boolean>;
  clearError: () => void;
}

export function useFocusSession(userId: string): UseFocusSessionReturn {
  const [session, setSession] = useState<FocusSession | null>(null);
  const [sessions, setSessions] = useState<FocusSessionWithHyperfocus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startSession = useCallback(
    async (hyperfocusId: string, durationMinutes: number): Promise<FocusSession | null> => {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const service = new TimerService(supabase);
        
        const newSession = await service.startSession(userId, {
          hyperfocus_id: hyperfocusId,
          planned_duration_minutes: durationMinutes,
        });
        
        setSession(newSession);
        
        console.log('[useFocusSession] Started:', newSession.id);
        return newSession;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao iniciar sessão';
        setError(errorMessage);
        console.error('[useFocusSession] Error:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  const endSession = useCallback(
    async (sessionId: string, completed: boolean): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const service = new TimerService(supabase);
        
        await service.endSession(userId, {
          session_id: sessionId,
          interrupted: !completed, // interrupted é o oposto de completed
        });
        
        setSession(null);
        
        console.log('[useFocusSession] Ended:', sessionId);
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao finalizar sessão';
        setError(errorMessage);
        console.error('[useFocusSession] Error:', err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  const loadActiveSession = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      
      // Buscar sessão ativa do usuário através do JOIN com hyperfocus
      const { data, error: queryError } = await supabase
        .from('focus_sessions')
        .select(`
          *,
          hyperfocus!inner(user_id)
        `)
        .eq('hyperfocus.user_id', userId)
        .is('ended_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (queryError) throw queryError;
      
      setSession(data);
      console.log('[useFocusSession] Active session:', data?.id || 'none');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar sessão';
      setError(errorMessage);
      console.error('[useFocusSession] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Deletar sessão
  const deleteSession = useCallback(
    async (sessionId: string): Promise<boolean> => {
      try {
        const supabase = createClient();
        
        const { error } = await supabase
          .from('focus_sessions')
          .delete()
          .eq('id', sessionId);

        if (error) {
          console.error('[useFocusSession] Error deleting session:', error);
          setError('Erro ao deletar sessão');
          return false;
        }

        // Atualizar estado local
        if (session?.id === sessionId) {
          setSession(null);
        }
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));

        return true;
      } catch (err) {
        console.error('[useFocusSession] Exception:', err);
        setError('Erro ao deletar sessão');
        return false;
      }
    },
    [session]
  );

  // Pausar/Interromper sessão
  const pauseSession = useCallback(
    async (sessionId: string): Promise<boolean> => {
      try {
        const supabase = createClient();
        
        const { data, error } = await supabase
          .from('focus_sessions')
          .update({
            ended_at: new Date().toISOString(),
            completed: false,
          })
          .eq('id', sessionId)
          .select()
          .single();

        if (error) {
          console.error('[useFocusSession] Error pausing session:', error);
          setError('Erro ao pausar sessão');
          return false;
        }

        // Atualizar estado local
        if (session?.id === sessionId) {
          setSession(data);
        }

        return true;
      } catch (err) {
        console.error('[useFocusSession] Exception:', err);
        setError('Erro ao pausar sessão');
        return false;
      }
    },
    [session]
  );

  // Adicionar nota à sessão
  const addSessionNote = useCallback(
    async (sessionId: string, note: string): Promise<boolean> => {
      try {
        const supabase = createClient();
        
        const { data, error } = await supabase
          .from('focus_sessions')
          .update({ notes: note })
          .eq('id', sessionId)
          .select()
          .single();

        if (error) {
          console.error('[useFocusSession] Error adding note:', error);
          setError('Erro ao adicionar nota');
          return false;
        }

        // Atualizar estado local
        if (session?.id === sessionId) {
          setSession(data);
        }

        return true;
      } catch (err) {
        console.error('[useFocusSession] Exception:', err);
        setError('Erro ao adicionar nota');
        return false;
      }
    },
    [session]
  );

  // Atualizar duração planejada
  const updateSessionDuration = useCallback(
    async (sessionId: string, durationMinutes: number): Promise<boolean> => {
      try {
        const supabase = createClient();
        
        const { data, error } = await supabase
          .from('focus_sessions')
          .update({ planned_duration_minutes: durationMinutes })
          .eq('id', sessionId)
          .select()
          .single();

        if (error) {
          console.error('[useFocusSession] Error updating duration:', error);
          setError('Erro ao atualizar duração');
          return false;
        }

        // Atualizar estado local
        if (session?.id === sessionId) {
          setSession(data);
        }

        return true;
      } catch (err) {
        console.error('[useFocusSession] Exception:', err);
        setError('Erro ao atualizar duração');
        return false;
      }
    },
    [session]
  );

  // Buscar sessão ativa de um hiperfoco específico
  const getActiveSessionForHyperfocus = useCallback(
    async (hyperfocusId: string): Promise<FocusSession | null> => {
      try {
        const supabase = createClient();
        
        const { data, error } = await supabase
          .from('focus_sessions')
          .select('*')
          .eq('hyperfocus_id', hyperfocusId)
          .is('ended_at', null)
          .order('started_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('[useFocusSession] Error getting active session:', error);
          return null;
        }

        return data;
      } catch (err) {
        console.error('[useFocusSession] Exception:', err);
        return null;
      }
    },
    []
  );

  // Listar todas as sessões do usuário
  const listAllSessions = useCallback(
    async (filters?: SessionFilters): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const allSessions = await queries.listAllUserSessions(supabase, userId, filters);
        setSessions(allSessions);
        
        console.log('[useFocusSession] Loaded all sessions:', allSessions.length);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar sessões';
        setError(errorMessage);
        console.error('[useFocusSession] Error:', err);
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  // Listar sessões de um hiperfoco específico
  const listSessionsByHyperfocus = useCallback(
    async (hyperfocusId: string, filters?: SessionFilters): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const service = new TimerService(supabase);
        
        const hyperfocusSessions = await service.listSessions(userId, hyperfocusId);
        
        // Transformar para o formato com hyperfocus
        // Precisamos buscar o hyperfocus para ter os dados completos
        const { data: hyperfocus } = await supabase
          .from('hyperfocus')
          .select('id, title, color, user_id')
          .eq('id', hyperfocusId)
          .single();

        if (hyperfocus) {
          const sessionsWithHyperfocus: FocusSessionWithHyperfocus[] = hyperfocusSessions.map(s => ({
            ...s,
            hyperfocus: hyperfocus as any
          }));

          // Aplicar filtros manualmente (já que o service não suporta filtros)
          let filtered = sessionsWithHyperfocus;

          if (filters?.status && filters.status !== 'all') {
            if (filters.status === 'completed') {
              filtered = filtered.filter(s => s.ended_at && !s.interrupted);
            } else if (filters.status === 'interrupted') {
              filtered = filtered.filter(s => s.interrupted);
            }
          }

          if (filters?.sortBy) {
            if (filters.sortBy === 'oldest') {
              filtered.sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());
            } else if (filters.sortBy === 'duration') {
              filtered.sort((a, b) => (b.actual_duration_minutes || 0) - (a.actual_duration_minutes || 0));
            }
          }

          setSessions(filtered);
          console.log('[useFocusSession] Loaded hyperfocus sessions:', filtered.length);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar sessões do hiperfoco';
        setError(errorMessage);
        console.error('[useFocusSession] Error:', err);
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  // Calcular estatísticas com base nas sessões carregadas
  const statistics = useMemo<SessionStatistics | null>(() => {
    if (sessions.length === 0) return null;

    const completed = sessions.filter(s => s.ended_at && !s.interrupted).length;
    const interrupted = sessions.filter(s => s.interrupted).length;
    const totalMinutes = sessions.reduce((sum, s) => sum + (s.actual_duration_minutes || 0), 0);
    const completionRate = sessions.length > 0 ? Math.round((completed / sessions.length) * 100) : 0;
    const averageDuration = sessions.length > 0 ? Math.round(totalMinutes / sessions.length) : 0;

    return {
      total: sessions.length,
      completed,
      interrupted,
      totalMinutes,
      completionRate,
      averageDuration,
    };
  }, [sessions]);

  return {
    session,
    sessions,
    loading,
    error,
    statistics,
    startSession,
    endSession,
    loadActiveSession,
    getActiveSessionForHyperfocus,
    listAllSessions,
    listSessionsByHyperfocus,
    deleteSession,
    pauseSession,
    addSessionNote,
    updateSessionDuration,
    clearError,
  };
}
