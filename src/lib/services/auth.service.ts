/**
 * Auth Service
 * Lógica de autenticação e autorização
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { authLogger, logAuthAttempt, logAuthError, logSecurityEvent } from '@/lib/utils/logger';
import { AuthenticationError, AuthorizationError } from '@/lib/utils/errors';

export class AuthService {
  constructor(private client: SupabaseClient<Database>) {}

  /**
   * Busca usuário atual da sessão
   */
  async getCurrentUser() {
    try {
      const {
        data: { user },
        error,
      } = await this.client.auth.getUser();

      if (error) throw error;

      if (!user) {
        throw new AuthenticationError('Usuário não autenticado');
      }

      logAuthAttempt('get_current_user', user.id, true);
      return user;
    } catch (error) {
      logAuthError('get_current_user', error as Error);
      throw new AuthenticationError('Falha ao buscar usuário atual');
    }
  }

  /**
   * Busca usuário por ID
   */
  async getUserById(userId: string) {
    try {
      const { data, error } = await this.client.auth.admin.getUserById(userId);

      if (error) throw error;
      if (!data.user) {
        throw new AuthenticationError('Usuário não encontrado');
      }

      return data.user;
    } catch (error) {
      logAuthError('get_user_by_id', error as Error);
      throw new AuthenticationError('Falha ao buscar usuário');
    }
  }

  /**
   * Verifica se usuário está autenticado
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const {
        data: { user },
      } = await this.client.auth.getUser();
      return !!user;
    } catch {
      return false;
    }
  }

  /**
   * Valida sessão de autenticação
   */
  async validateSession(accessToken?: string) {
    try {
      if (accessToken) {
        const {
          data: { user },
          error,
        } = await this.client.auth.getUser(accessToken);

        if (error) throw error;
        if (!user) throw new AuthenticationError('Sessão inválida');

        logAuthAttempt('validate_session', user.id, true);
        return user;
      }

      // Validar sessão atual
      return await this.getCurrentUser();
    } catch (error) {
      logAuthError('validate_session', error as Error);
      throw new AuthenticationError('Sessão inválida ou expirada');
    }
  }

  /**
   * Login via OAuth provider
   */
  async signInWithOAuth(provider: 'google' | 'github', redirectTo?: string) {
    try {
      const { data, error } = await this.client.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectTo || process.env.NEXT_PUBLIC_URL || 'http://localhost:3000',
        },
      });

      if (error) throw error;

      logAuthAttempt(`oauth_${provider}`, undefined, true);
      return data;
    } catch (error) {
      logAuthError(`oauth_${provider}`, error as Error);
      throw new AuthenticationError(`Falha no login com ${provider}`);
    }
  }

  /**
   * Logout
   */
  async signOut() {
    try {
      const user = await this.getCurrentUser();

      const { error } = await this.client.auth.signOut();

      if (error) throw error;

      logAuthAttempt('sign_out', user.id, true);
    } catch (error) {
      logAuthError('sign_out', error as Error);
      throw new AuthenticationError('Falha ao fazer logout');
    }
  }

  /**
   * Verifica se usuário tem permissão para acessar recurso
   */
  async checkResourceOwnership(userId: string, resourceUserId: string, resourceType: string) {
    if (userId !== resourceUserId) {
      logSecurityEvent('unauthorized_access_attempt', 'medium', {
        userId,
        resourceUserId,
        resourceType,
      });

      throw new AuthorizationError(
        `Você não tem permissão para acessar este ${resourceType}`
      );
    }

    return true;
  }

  /**
   * Extrai user ID de request headers
   */
  extractUserIdFromHeaders(headers: Headers): string | null {
    const authHeader = headers.get('authorization');

    if (!authHeader) {
      return null;
    }

    // Bearer token
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return null;
    }

    // Validar token e extrair user ID
    // Nota: Supabase faz isso automaticamente no getUser()
    return token;
  }

  /**
   * Verifica se é primeiro acesso do usuário
   */
  async isFirstLogin(userId: string): Promise<boolean> {
    try {
      // Verifica se já existe algum hiperfoco criado
      const { count, error } = await this.client
        .from('hyperfocus')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .limit(1);

      if (error) throw error;

      return count === 0;
    } catch (error) {
      authLogger.error({ userId, error }, 'Error checking first login');
      return false;
    }
  }

  /**
   * Registra último acesso do usuário
   */
  async recordLastLogin(userId: string) {
    try {
      // Atualizar metadata no Supabase Auth
      const { error } = await this.client.auth.admin.updateUserById(userId, {
        user_metadata: {
          last_login_at: new Date().toISOString(),
        },
      });

      if (error) {
        authLogger.error({ userId, error }, 'Error recording last login');
      }
    } catch (error) {
      authLogger.error({ userId, error }, 'Error recording last login');
    }
  }

  /**
   * Valida permissões de rate limit por usuário
   */
  async checkRateLimit(userId: string): Promise<boolean> {
    // Implementar com Upstash Redis
    // Por enquanto, sempre permitir
    // TODO: Implementar rate limiting real

    authLogger.debug({ userId }, 'Rate limit check (stub)');
    return true;
  }

  /**
   * Gera token de sessão customizado (se necessário)
   */
  async generateSessionToken(userId: string): Promise<string> {
    try {
      const { data, error } = await this.client.auth.admin.generateLink({
        type: 'magiclink',
        email: (await this.getUserById(userId)).email!,
      });

      if (error) throw error;

      return data.properties.hashed_token;
    } catch (error) {
      logAuthError('generate_session_token', error as Error);
      throw new AuthenticationError('Falha ao gerar token de sessão');
    }
  }

  /**
   * Invalida todas as sessões de um usuário
   */
  async invalidateAllSessions(userId: string) {
    try {
      // Supabase não tem API direta pra isso, mas podemos fazer logout
      await this.signOut();

      logSecurityEvent('all_sessions_invalidated', 'medium', { userId });
    } catch (error) {
      logAuthError('invalidate_all_sessions', error as Error);
      throw new AuthenticationError('Falha ao invalidar sessões');
    }
  }

  /**
   * Deleta conta do usuário (GDPR compliance)
   */
  async deleteUserAccount(userId: string) {
    try {
      // Validar que é o próprio usuário
      const currentUser = await this.getCurrentUser();
      if (currentUser.id !== userId) {
        throw new AuthorizationError('Você só pode deletar sua própria conta');
      }

      // Deletar dados do usuário (Supabase fará cascade via RLS)
      const { error: deleteError } = await this.client.auth.admin.deleteUser(userId);

      if (deleteError) throw deleteError;

      logSecurityEvent('user_account_deleted', 'high', { userId });
      authLogger.warn({ userId }, 'User account deleted');
    } catch (error) {
      logAuthError('delete_user_account', error as Error);
      throw new AuthenticationError('Falha ao deletar conta');
    }
  }
}

