/**
 * Hook: useHyperfocus
 * Gerencia operações CRUD de Hiperfocos com Supabase
 */

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { HyperfocusService } from '@/lib/services/hyperfocus.service';
import { Database } from '@/types/database';

// Type alias para facilitar
type Hyperfocus = Database['public']['Tables']['hyperfocus']['Row'];

// Interface do hook (o que ele retorna)
interface UseHyperfocusReturn {
  // Estado
  hyperfocus: Hyperfocus | null;
  hyperfocusList: Hyperfocus[];
  loading: boolean;
  error: string | null;
  
  // Ações
  createHyperfocus: (data: CreateHyperfocusData) => Promise<Hyperfocus | null>;
  updateHyperfocus: (id: string, data: UpdateHyperfocusData) => Promise<Hyperfocus | null>;
  deleteHyperfocus: (id: string) => Promise<boolean>;
  loadHyperfocus: (id: string) => Promise<void>;
  loadHyperfocusList: () => Promise<void>;
  clearError: () => void;
}

// Cores permitidas para hiperfocos
type HyperfocusColor = 'red' | 'green' | 'blue' | 'orange' | 'purple' | 'brown' | 'gray' | 'pink';

// Dados necessários para criar hiperfoco
interface CreateHyperfocusData {
  title: string;
  description?: string;
  color?: HyperfocusColor;
  estimated_time_minutes?: number;
}

// Dados necessários para atualizar hiperfoco
interface UpdateHyperfocusData {
  title?: string;
  description?: string;
  color?: HyperfocusColor;
  estimated_time_minutes?: number;
  archived?: boolean;
}

export function useHyperfocus(userId: string): UseHyperfocusReturn {
  // ===== ESTADOS =====
  const [hyperfocus, setHyperfocus] = useState<Hyperfocus | null>(null);
  const [hyperfocusList, setHyperfocusList] = useState<Hyperfocus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ===== AÇÃO 1: Criar Hiperfoco =====
  const createHyperfocus = useCallback(
    async (data: CreateHyperfocusData): Promise<Hyperfocus | null> => {
      // 1. Iniciar loading
      setLoading(true);
      setError(null);

      try {
        // 2. Criar cliente Supabase
        const supabase = createClient();
        
        // 3. Criar instância do service
        const service = new HyperfocusService(supabase);
        
        // 4. Chamar método do service com defaults
        const newHyperfocus = await service.create(userId, {
          title: data.title,
          description: data.description,
          color: data.color || 'blue', // Default explícito
          estimated_time_minutes: data.estimated_time_minutes,
        });
        
        // 5. Atualizar estado local
        setHyperfocus(newHyperfocus);
        setHyperfocusList((prev) => [newHyperfocus, ...prev]);
        
        // 6. Log de sucesso
        console.log('[useHyperfocus] Created:', newHyperfocus.id);
        
        // 7. Retornar resultado
        return newHyperfocus;
      } catch (err) {
        // 8. Tratar erro
        const errorMessage = err instanceof Error ? err.message : 'Erro ao criar hiperfoco';
        setError(errorMessage);
        console.error('[useHyperfocus] Error:', err);
        return null;
      } finally {
        // 9. Finalizar loading
        setLoading(false);
      }
    },
    [userId]
  );

  // ===== AÇÃO 2: Atualizar Hiperfoco =====
  const updateHyperfocus = useCallback(
    async (id: string, data: UpdateHyperfocusData): Promise<Hyperfocus | null> => {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const service = new HyperfocusService(supabase);
        
        const updated = await service.update(userId, id, data);
        
        // Atualizar no estado único
        if (hyperfocus?.id === id) {
          setHyperfocus(updated);
        }
        
        // Atualizar na lista
        setHyperfocusList((prev) =>
          prev.map((h) => (h.id === id ? updated : h))
        );
        
        console.log('[useHyperfocus] Updated:', id);
        return updated;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar hiperfoco';
        setError(errorMessage);
        console.error('[useHyperfocus] Error:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [userId, hyperfocus]
  );

  // ===== AÇÃO 3: Deletar Hiperfoco =====
  const deleteHyperfocus = useCallback(
    async (id: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const service = new HyperfocusService(supabase);
        
        await service.delete(userId, id);
        
        // Remover do estado
        if (hyperfocus?.id === id) {
          setHyperfocus(null);
        }
        
        setHyperfocusList((prev) => prev.filter((h) => h.id !== id));
        
        console.log('[useHyperfocus] Deleted:', id);
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar hiperfoco';
        setError(errorMessage);
        console.error('[useHyperfocus] Error:', err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [userId, hyperfocus]
  );

  // ===== AÇÃO 4: Carregar Hiperfoco por ID =====
  const loadHyperfocus = useCallback(
    async (id: string): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const service = new HyperfocusService(supabase);
        
        const data = await service.getById(userId, id);
        setHyperfocus(data);
        
        console.log('[useHyperfocus] Loaded:', id);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar hiperfoco';
        setError(errorMessage);
        console.error('[useHyperfocus] Error:', err);
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  // ===== AÇÃO 5: Carregar Lista de Hiperfocos =====
  const loadHyperfocusList = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const service = new HyperfocusService(supabase);
      
      const list = await service.list(userId, {
        archived: false,
        limit: 50,
        offset: 0,
        sortBy: 'created_at',
        sortOrder: 'desc',
      });
      
      setHyperfocusList(list);
      console.log('[useHyperfocus] List loaded:', list.length);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar lista';
      setError(errorMessage);
      console.error('[useHyperfocus] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // ===== AÇÃO 6: Limpar Erro =====
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ===== RETORNAR INTERFACE DO HOOK =====
  return {
    hyperfocus,
    hyperfocusList,
    loading,
    error,
    createHyperfocus,
    updateHyperfocus,
    deleteHyperfocus,
    loadHyperfocus,
    loadHyperfocusList,
    clearError,
  };
}
