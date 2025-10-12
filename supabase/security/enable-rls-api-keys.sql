-- ============================================================================
-- ENABLE RLS (Row Level Security) para user_api_keys
-- ============================================================================
-- Este script habilita Row Level Security na tabela user_api_keys para
-- garantir que usuários só possam acessar suas próprias API keys.
--
-- EXECUTAR NO SUPABASE SQL EDITOR
-- ============================================================================

-- 1. Habilitar RLS na tabela
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Users can only view their own API keys" ON user_api_keys;
DROP POLICY IF EXISTS "Users can only insert their own API keys" ON user_api_keys;
DROP POLICY IF EXISTS "Users can only update their own API keys" ON user_api_keys;
DROP POLICY IF EXISTS "Users can only delete their own API keys" ON user_api_keys;

-- 3. Criar políticas de segurança

-- Política SELECT: Usuário só pode ver suas próprias keys
CREATE POLICY "Users can only view their own API keys"
  ON user_api_keys
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política INSERT: Usuário só pode inserir suas próprias keys
CREATE POLICY "Users can only insert their own API keys"
  ON user_api_keys
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política UPDATE: Usuário só pode atualizar suas próprias keys
CREATE POLICY "Users can only update their own API keys"
  ON user_api_keys
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política DELETE: Usuário só pode deletar suas próprias keys
CREATE POLICY "Users can only delete their own API keys"
  ON user_api_keys
  FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Verificar políticas criadas
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
WHERE tablename = 'user_api_keys';

-- Resultado esperado: 4 políticas (SELECT, INSERT, UPDATE, DELETE)

-- ============================================================================
-- TESTES DE VALIDAÇÃO
-- ============================================================================

-- Teste 1: Tentar visualizar todas as keys (deve falhar se não for admin)
-- SELECT * FROM user_api_keys;

-- Teste 2: Tentar visualizar apenas suas keys (deve funcionar)
-- SELECT * FROM user_api_keys WHERE user_id = auth.uid();

-- Teste 3: Tentar inserir key de outro usuário (deve falhar)
-- INSERT INTO user_api_keys (user_id, provider, encrypted_key) 
-- VALUES ('00000000-0000-0000-0000-000000000000', 'openai', 'test');

-- ============================================================================
-- ROLLBACK (SE NECESSÁRIO)
-- ============================================================================
-- Se precisar desabilitar RLS temporariamente:
-- ALTER TABLE user_api_keys DISABLE ROW LEVEL SECURITY;
