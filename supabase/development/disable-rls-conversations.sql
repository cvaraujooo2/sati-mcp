-- Desabilitar RLS (Row Level Security) da tabela conversations
-- ATENÇÃO: Use apenas em desenvolvimento ou para debugging
-- Em produção, o RLS é essencial para segurança dos dados

-- 1. Desabilitar RLS na tabela conversations
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;

-- 2. Remover todas as políticas existentes (opcional)
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON conversations;

-- 3. Verificar status do RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    hasrls as has_rls_policies
FROM pg_tables t
LEFT JOIN pg_class c ON c.relname = t.tablename
WHERE t.tablename = 'conversations';

-- 4. Para reabilitar o RLS posteriormente (execute quando necessário):
/*
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Recriar políticas básicas
CREATE POLICY "Users can view own conversations" ON conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations" ON conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON conversations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON conversations
    FOR DELETE USING (auth.uid() = user_id);
*/

-- 5. Verificar se existem dados órfãos após desabilitar RLS
SELECT 
    COUNT(*) as total_conversations,
    COUNT(DISTINCT user_id) as unique_users,
    MIN(created_at) as oldest_conversation,
    MAX(created_at) as newest_conversation
FROM conversations;

COMMENT ON TABLE conversations IS 'RLS DESABILITADO - Tabela acessível por todos os usuários autenticados. USE APENAS EM DESENVOLVIMENTO!';