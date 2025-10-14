/**
 * Hook: useAuth
 * Gerencia autenticação e usuário atual
 */

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Obter usuário atual
    const getUser = async () => {
      try {
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        
        setUser(currentUser);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar usuário';
        setError(errorMessage);
        console.error('[useAuth] Error:', err);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    loading,
    error,
  };
}
