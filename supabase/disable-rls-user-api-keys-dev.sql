-- ============================================================================
-- ⚠️ DESENVOLVIMENTO: Desabilitar RLS em user_api_keys
-- ============================================================================
-- 
-- Motivo: Permitir acesso sem autenticação durante desenvolvimento
-- 
-- ⚠️ ATENÇÃO: Apenas para ambiente de desenvolvimento!
-- ⚠️ NUNCA execute em produção!
-- ============================================================================

-- Desabilitar RLS temporariamente para user_api_keys
ALTER TABLE public.user_api_keys DISABLE ROW LEVEL SECURITY;

-- Verificar status
SELECT 
    schemaname,
    tablename,
    rowsecurity AS "RLS Enabled"
FROM pg_tables
WHERE tablename = 'user_api_keys';


