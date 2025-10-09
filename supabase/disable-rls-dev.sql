-- ============================================================================
-- DESABILITAR RLS - APENAS PARA DESENVOLVIMENTO/TESTES
-- ============================================================================
-- 
-- ⚠️  ATENÇÃO: Este script desabilita Row Level Security
-- 
-- USO: Apenas para testes locais com MCP Inspector
-- 
-- NÃO USE EM PRODUÇÃO!
-- 
-- Execute no Supabase SQL Editor:
-- https://supabase.com/dashboard/project/clhexsbqfbvbkfvefapi/sql
-- 
-- Para REABILITAR RLS, execute o schema-v2-production.sql novamente
-- ou use o script enable-rls-production.sql
-- 
-- ============================================================================

-- ============================================================================
-- 1️⃣  DESABILITAR RLS EM TODAS AS TABELAS
-- ============================================================================

-- Desabilitar RLS em todas as 6 tabelas do SATI MCP
ALTER TABLE public.hyperfocus DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.alternancy_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.alternancy_hyperfocus DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hyperfocus_context DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2️⃣  VERIFICAR STATUS DO RLS
-- ============================================================================

SELECT 
    tablename as "📋 Tabela",
    CASE 
        WHEN rowsecurity THEN '🔒 ATIVO'
        ELSE '🔓 DESATIVADO'
    END as "Status RLS",
    CASE 
        WHEN rowsecurity THEN '❌ RLS ainda ativo!'
        ELSE '✅ RLS desabilitado com sucesso'
    END as "Resultado"
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'hyperfocus',
    'tasks', 
    'focus_sessions',
    'alternancy_sessions',
    'alternancy_hyperfocus',
    'hyperfocus_context'
)
ORDER BY tablename;

-- ============================================================================
-- 3️⃣  RESULTADO ESPERADO
-- ============================================================================
-- 
-- Todas as 6 tabelas devem mostrar:
-- 
-- ┌─────────────────────────┬─────────────────┬────────────────────────────────┐
-- │ 📋 Tabela               │ Status RLS      │ Resultado                      │
-- ├─────────────────────────┼─────────────────┼────────────────────────────────┤
-- │ alternancy_hyperfocus   │ 🔓 DESATIVADO   │ ✅ RLS desabilitado com sucesso│
-- │ alternancy_sessions     │ 🔓 DESATIVADO   │ ✅ RLS desabilitado com sucesso│
-- │ focus_sessions          │ 🔓 DESATIVADO   │ ✅ RLS desabilitado com sucesso│
-- │ hyperfocus              │ 🔓 DESATIVADO   │ ✅ RLS desabilitado com sucesso│
-- │ hyperfocus_context      │ 🔓 DESATIVADO   │ ✅ RLS desabilitado com sucesso│
-- │ tasks                   │ 🔓 DESATIVADO   │ ✅ RLS desabilitado com sucesso│
-- └─────────────────────────┴─────────────────┴────────────────────────────────┘
-- 
-- ============================================================================

-- ============================================================================
-- 4️⃣  LISTAR POLÍTICAS RLS (OPCIONAL - APENAS INFORMATIVO)
-- ============================================================================

-- Ver quais políticas existem (mas estão inativas agora)
SELECT 
    tablename as "📋 Tabela",
    policyname as "📜 Nome da Política",
    cmd as "🎯 Comando",
    CASE 
        WHEN permissive = 'PERMISSIVE' THEN '✅ Permissiva'
        ELSE '❌ Restritiva'
    END as "Tipo",
    '⚠️  INATIVA (RLS desabilitado)' as "Status"
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- 5️⃣  NOTAS IMPORTANTES
-- ============================================================================
-- 
-- ✅ COM RLS DESABILITADO:
-- 
-- • Você pode testar as MCP tools sem autenticação
-- • O TEST_USER_ID será usado livremente
-- • Nenhuma validação de ownership será feita
-- • Todas as queries funcionarão sem filtro de user_id
-- 
-- ⚠️  IMPORTANTE:
-- 
-- • Use apenas em ambiente de desenvolvimento/teste local
-- • NUNCA desabilite RLS em produção
-- • Sempre reabilite RLS antes de fazer deploy
-- 
-- 🔒 PARA REABILITAR RLS:
-- 
-- Opção 1: Execute o schema-v2-production.sql completo
-- Opção 2: Execute o script enable-rls-production.sql
-- Opção 3: Execute manualmente:
-- 
--   ALTER TABLE public.hyperfocus ENABLE ROW LEVEL SECURITY;
--   ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
--   ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
--   ALTER TABLE public.alternancy_sessions ENABLE ROW LEVEL SECURITY;
--   ALTER TABLE public.alternancy_hyperfocus ENABLE ROW LEVEL SECURITY;
--   ALTER TABLE public.hyperfocus_context ENABLE ROW LEVEL SECURITY;
-- 
-- ============================================================================

-- ============================================================================
-- ✅ CONCLUÍDO
-- ============================================================================
-- 
-- RLS desabilitado com sucesso em todas as 6 tabelas!
-- 
-- Você já pode:
-- 1. ✅ Executar clean-test-data.sql (limpar dados antigos)
-- 2. ✅ Executar create-test-user.sql (criar usuário teste)
-- 3. ✅ Reiniciar o MCP Inspector
-- 4. ✅ Testar todas as 10 MCP tools
-- 
-- ============================================================================
