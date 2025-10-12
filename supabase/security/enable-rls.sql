-- ============================================================================
-- HABILITAR ROW LEVEL SECURITY (RLS) - SATI
-- ============================================================================
-- Este script habilita RLS em todas as tabelas do SATI e cria políticas
-- para garantir que cada usuário acesse apenas seus próprios dados.
--
-- IMPORTANTE: Execute este script no Supabase SQL Editor
-- Data: 11 de Outubro de 2025
-- ============================================================================

-- ============================================================================
-- 1. HABILITAR RLS EM TODAS AS TABELAS
-- ============================================================================

ALTER TABLE hyperfocus ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alternancy_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alternancy_hyperfocus ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. POLÍTICAS RLS - HYPERFOCUS
-- ============================================================================
-- Usuários podem acessar apenas seus próprios hiperfocos

-- SELECT
CREATE POLICY "Users can view their own hyperfocus"
  ON hyperfocus FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT
CREATE POLICY "Users can insert their own hyperfocus"
  ON hyperfocus FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE
CREATE POLICY "Users can update their own hyperfocus"
  ON hyperfocus FOR UPDATE
  USING (auth.uid() = user_id);

-- DELETE
CREATE POLICY "Users can delete their own hyperfocus"
  ON hyperfocus FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 3. POLÍTICAS RLS - TASKS
-- ============================================================================
-- Usuários podem acessar tarefas através do ownership do hyperfocus pai

-- SELECT
CREATE POLICY "Users can view their own tasks"
  ON tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM hyperfocus
      WHERE hyperfocus.id = tasks.hyperfocus_id
      AND hyperfocus.user_id = auth.uid()
    )
  );

-- INSERT
CREATE POLICY "Users can insert their own tasks"
  ON tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hyperfocus
      WHERE hyperfocus.id = tasks.hyperfocus_id
      AND hyperfocus.user_id = auth.uid()
    )
  );

-- UPDATE
CREATE POLICY "Users can update their own tasks"
  ON tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM hyperfocus
      WHERE hyperfocus.id = tasks.hyperfocus_id
      AND hyperfocus.user_id = auth.uid()
    )
  );

-- DELETE
CREATE POLICY "Users can delete their own tasks"
  ON tasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM hyperfocus
      WHERE hyperfocus.id = tasks.hyperfocus_id
      AND hyperfocus.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 4. POLÍTICAS RLS - FOCUS_SESSIONS
-- ============================================================================
-- Usuários podem acessar sessões de foco através do ownership do hyperfocus

-- SELECT
CREATE POLICY "Users can view their own focus sessions"
  ON focus_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM hyperfocus
      WHERE hyperfocus.id = focus_sessions.hyperfocus_id
      AND hyperfocus.user_id = auth.uid()
    )
  );

-- INSERT
CREATE POLICY "Users can insert their own focus sessions"
  ON focus_sessions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hyperfocus
      WHERE hyperfocus.id = focus_sessions.hyperfocus_id
      AND hyperfocus.user_id = auth.uid()
    )
  );

-- UPDATE
CREATE POLICY "Users can update their own focus sessions"
  ON focus_sessions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM hyperfocus
      WHERE hyperfocus.id = focus_sessions.hyperfocus_id
      AND hyperfocus.user_id = auth.uid()
    )
  );

-- DELETE
CREATE POLICY "Users can delete their own focus sessions"
  ON focus_sessions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM hyperfocus
      WHERE hyperfocus.id = focus_sessions.hyperfocus_id
      AND hyperfocus.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 5. POLÍTICAS RLS - ALTERNANCY_SESSIONS
-- ============================================================================
-- Usuários podem acessar apenas suas próprias sessões de alternância

-- SELECT
CREATE POLICY "Users can view their own alternancy sessions"
  ON alternancy_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT
CREATE POLICY "Users can insert their own alternancy sessions"
  ON alternancy_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE
CREATE POLICY "Users can update their own alternancy sessions"
  ON alternancy_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- DELETE
CREATE POLICY "Users can delete their own alternancy sessions"
  ON alternancy_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 6. POLÍTICAS RLS - ALTERNANCY_HYPERFOCUS
-- ============================================================================
-- Usuários podem acessar vínculos alternancy-hyperfocus através do ownership

-- SELECT
CREATE POLICY "Users can view their own alternancy hyperfocus links"
  ON alternancy_hyperfocus FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM alternancy_sessions
      WHERE alternancy_sessions.id = alternancy_hyperfocus.alternancy_session_id
      AND alternancy_sessions.user_id = auth.uid()
    )
  );

-- INSERT
CREATE POLICY "Users can insert their own alternancy hyperfocus links"
  ON alternancy_hyperfocus FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM alternancy_sessions
      WHERE alternancy_sessions.id = alternancy_hyperfocus.alternancy_session_id
      AND alternancy_sessions.user_id = auth.uid()
    )
  );

-- UPDATE
CREATE POLICY "Users can update their own alternancy hyperfocus links"
  ON alternancy_hyperfocus FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM alternancy_sessions
      WHERE alternancy_sessions.id = alternancy_hyperfocus.alternancy_session_id
      AND alternancy_sessions.user_id = auth.uid()
    )
  );

-- DELETE
CREATE POLICY "Users can delete their own alternancy hyperfocus links"
  ON alternancy_hyperfocus FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM alternancy_sessions
      WHERE alternancy_sessions.id = alternancy_hyperfocus.alternancy_session_id
      AND alternancy_sessions.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 7. POLÍTICAS RLS - USER_API_KEYS
-- ============================================================================
-- Usuários podem acessar apenas suas próprias API keys

-- SELECT
CREATE POLICY "Users can view their own API keys"
  ON user_api_keys FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT
CREATE POLICY "Users can insert their own API keys"
  ON user_api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE
CREATE POLICY "Users can update their own API keys"
  ON user_api_keys FOR UPDATE
  USING (auth.uid() = user_id);

-- DELETE
CREATE POLICY "Users can delete their own API keys"
  ON user_api_keys FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 8. VERIFICAÇÃO
-- ============================================================================
-- Query para verificar status do RLS em todas as tabelas

SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'hyperfocus',
  'tasks',
  'focus_sessions',
  'alternancy_sessions',
  'alternancy_hyperfocus',
  'user_api_keys'
)
ORDER BY tablename;

-- Query para listar todas as políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- 9. TESTES
-- ============================================================================
-- Para testar as políticas, você pode usar:

-- Simular usuário específico (substitua pelo UUID real)
-- SET request.jwt.claim.sub = 'user-uuid-aqui';

-- Testar queries
-- SELECT * FROM hyperfocus; -- Deve retornar apenas dados do usuário
-- SELECT * FROM tasks; -- Deve retornar apenas tarefas do usuário
-- SELECT * FROM user_api_keys; -- Deve retornar apenas API keys do usuário

-- Resetar simulação
-- RESET request.jwt.claim.sub;

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
-- 1. Após executar este script, TODOS os acessos ao banco serão filtrados por RLS
-- 2. Certifique-se de que seu código SEMPRE passa auth.uid() corretamente
-- 3. Para operações admin, use service_role key (bypassa RLS)
-- 4. Teste bem antes de ir para produção!
-- 5. Se precisar desabilitar RLS temporariamente: ALTER TABLE [nome] DISABLE ROW LEVEL SECURITY;
-- ============================================================================
