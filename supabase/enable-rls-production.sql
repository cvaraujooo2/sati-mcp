-- ============================================================================
-- REABILITAR RLS - PARA PRODUÇÃO
-- ============================================================================
-- 
-- ✅ Este script REABILITA Row Level Security em todas as tabelas
-- 
-- USO: Antes de fazer deploy para produção
-- 
-- Execute no Supabase SQL Editor:
-- https://supabase.com/dashboard/project/clhexsbqfbvbkfvefapi/sql
-- 
-- ============================================================================

-- ============================================================================
-- 1️⃣  REABILITAR RLS EM TODAS AS TABELAS
-- ============================================================================

-- Reabilitar RLS em todas as 6 tabelas do SATI MCP
ALTER TABLE public.hyperfocus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alternancy_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alternancy_hyperfocus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hyperfocus_context ENABLE ROW LEVEL SECURITY;

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
        WHEN rowsecurity THEN '✅ RLS habilitado com sucesso'
        ELSE '❌ RLS ainda desabilitado!'
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
-- 3️⃣  VERIFICAR POLÍTICAS RLS ATIVAS
-- ============================================================================

SELECT 
    tablename as "📋 Tabela",
    policyname as "📜 Nome da Política",
    cmd as "🎯 Comando",
    CASE 
        WHEN permissive = 'PERMISSIVE' THEN '✅ Permissiva'
        ELSE '❌ Restritiva'
    END as "Tipo",
    '✅ ATIVA' as "Status"
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- 4️⃣  RESULTADO ESPERADO
-- ============================================================================
-- 
-- Todas as 6 tabelas devem mostrar RLS ATIVO:
-- 
-- ┌─────────────────────────┬─────────────────┬────────────────────────────────┐
-- │ 📋 Tabela               │ Status RLS      │ Resultado                      │
-- ├─────────────────────────┼─────────────────┼────────────────────────────────┤
-- │ alternancy_hyperfocus   │ 🔒 ATIVO        │ ✅ RLS habilitado com sucesso  │
-- │ alternancy_sessions     │ 🔒 ATIVO        │ ✅ RLS habilitado com sucesso  │
-- │ focus_sessions          │ 🔒 ATIVO        │ ✅ RLS habilitado com sucesso  │
-- │ hyperfocus              │ 🔒 ATIVO        │ ✅ RLS habilitado com sucesso  │
-- │ hyperfocus_context      │ 🔒 ATIVO        │ ✅ RLS habilitado com sucesso  │
-- │ tasks                   │ 🔒 ATIVO        │ ✅ RLS habilitado com sucesso  │
-- └─────────────────────────┴─────────────────┴────────────────────────────────┘
-- 
-- E 6 políticas devem estar ativas (uma por tabela)
-- 
-- ============================================================================

-- ============================================================================
-- 5️⃣  TESTE DE SEGURANÇA (OPCIONAL)
-- ============================================================================

-- Testar se RLS está funcionando corretamente
-- Esta query deve retornar apenas hiperfocos do usuário autenticado
-- (Se não houver usuário autenticado, deve retornar vazio)

SELECT 
    id,
    title,
    user_id,
    created_at
FROM public.hyperfocus
ORDER BY created_at DESC
LIMIT 5;

-- Se você NÃO estiver autenticado e esta query retornar resultados,
-- significa que RLS NÃO está funcionando corretamente!

-- ============================================================================
-- 6️⃣  NOTAS IMPORTANTES
-- ============================================================================
-- 
-- ✅ COM RLS HABILITADO:
-- 
-- • Usuários só podem ver/editar seus próprios dados
-- • Todas as queries são filtradas por auth.uid()
-- • Segurança garantida a nível de banco de dados
-- • Pronto para produção
-- 
-- 🔒 SEGURANÇA:
-- 
-- • RLS deve SEMPRE estar habilitado em produção
-- • Cada tabela tem sua política RLS específica
-- • Policies estão definidas no schema-v2-production.sql
-- 
-- 📋 POLÍTICAS ATIVAS:
-- 
-- 1. hyperfocus: user ownership direto
-- 2. tasks: via ownership do hyperfocus
-- 3. focus_sessions: via ownership do hyperfocus
-- 4. alternancy_sessions: user ownership direto
-- 5. alternancy_hyperfocus: via ownership da session + hyperfocus
-- 6. hyperfocus_context: via ownership do hyperfocus
-- 
-- ============================================================================

-- ============================================================================
-- ✅ CONCLUÍDO
-- ============================================================================
-- 
-- RLS habilitado com sucesso em todas as 6 tabelas!
-- 
-- Seu banco está seguro e pronto para produção! 🔒
-- 
-- ============================================================================

