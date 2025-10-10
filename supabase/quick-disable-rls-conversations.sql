-- Script rápido para desabilitar RLS da tabela conversations
-- Para desenvolvimento e testes

-- Desabilitar RLS temporariamente
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;

-- Verificar se foi desabilitado
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables t
LEFT JOIN pg_class c ON c.relname = t.tablename
WHERE t.tablename = 'conversations';

-- Para reabilitar rapidamente:
-- ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;