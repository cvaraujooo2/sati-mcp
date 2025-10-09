-- ============================================================================
-- INFORMAÇÕES BÁSICAS DO BANCO DE DADOS - SATI MCP (SAFE VERSION)
-- ============================================================================
-- 
-- Script simplificado que não vai quebrar mesmo se tabelas não existirem
--
-- Execute este script no Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/clhexsbqfbvbkfvefapi/sql
-- ============================================================================

-- ============================================================================
-- 📋 RESUMO RÁPIDO
-- ============================================================================

SELECT 
  '🗂️  TABELAS' as categoria,
  COUNT(*)::text as quantidade
FROM pg_tables
WHERE schemaname = 'public'

UNION ALL

SELECT 
  '🔑 PRIMARY KEYS' as categoria,
  COUNT(*)::text as quantidade
FROM information_schema.table_constraints
WHERE constraint_type = 'PRIMARY KEY'
  AND table_schema = 'public'

UNION ALL

SELECT 
  '🔗 FOREIGN KEYS' as categoria,
  COUNT(*)::text as quantidade
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
  AND table_schema = 'public'

UNION ALL

SELECT 
  '📊 ÍNDICES' as categoria,
  COUNT(*)::text as quantidade
FROM pg_indexes
WHERE schemaname = 'public'

UNION ALL

SELECT 
  '🔒 RLS ATIVO' as categoria,
  COUNT(*)::text as quantidade
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true

UNION ALL

SELECT 
  '💾 TAMANHO TOTAL' as categoria,
  pg_size_pretty(SUM(pg_total_relation_size(schemaname||'.'||tablename)))::text as quantidade
FROM pg_tables
WHERE schemaname = 'public';

-- ============================================================================
-- 📊 TODAS AS TABELAS DO SCHEMA PUBLIC
-- ============================================================================

SELECT 
  tablename as "📋 Tabela",
  tableowner as "👤 Owner",
  CASE 
    WHEN rowsecurity THEN '🔒 Ativo'
    ELSE '🔓 Desativado'
  END as "RLS",
  pg_size_pretty(pg_total_relation_size('public.' || tablename)) as "💾 Tamanho"
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- 🏗️  ESTRUTURA DE CADA TABELA
-- ============================================================================

SELECT 
  table_name as "📋 Tabela",
  column_name as "📝 Coluna",
  data_type as "🔤 Tipo",
  CASE 
    WHEN character_maximum_length IS NOT NULL 
    THEN '(' || character_maximum_length::text || ')'
    ELSE ''
  END as "📏 Tamanho",
  CASE 
    WHEN is_nullable = 'YES' THEN '✅'
    ELSE '❌'
  END as "Null?",
  COALESCE(column_default, '-') as "🔧 Default"
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- ============================================================================
-- 🔑 PRIMARY KEYS
-- ============================================================================

SELECT 
  tc.table_name as "📋 Tabela",
  kcu.column_name as "🔑 Coluna PK",
  tc.constraint_name as "🏷️  Nome Constraint"
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'PRIMARY KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- ============================================================================
-- 🔗 FOREIGN KEYS (RELACIONAMENTOS)
-- ============================================================================

SELECT 
  tc.table_name as "📋 Tabela Origem",
  kcu.column_name as "📝 Coluna Origem",
  ccu.table_name AS "🎯 Tabela Destino",
  ccu.column_name AS "🔑 Coluna Destino",
  tc.constraint_name as "🏷️  Nome Constraint"
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- ============================================================================
-- 📊 ÍNDICES
-- ============================================================================

SELECT 
  tablename as "📋 Tabela",
  indexname as "🔍 Nome Índice",
  indexdef as "📝 Definição"
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================================================
-- 🔒 STATUS DO RLS (ROW LEVEL SECURITY)
-- ============================================================================

SELECT 
  tablename as "📋 Tabela",
  CASE 
    WHEN rowsecurity THEN '🔒 ATIVO'
    ELSE '🔓 DESATIVADO'
  END as "Status RLS"
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- 📜 POLÍTICAS RLS (se houver)
-- ============================================================================

SELECT 
  tablename as "📋 Tabela",
  policyname as "📜 Nome Política",
  CASE 
    WHEN permissive = 'PERMISSIVE' THEN '✅ Permissiva'
    ELSE '❌ Restritiva'
  END as "Tipo",
  cmd as "🎯 Comando",
  roles::text as "👥 Roles"
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- 📈 CONTAGEM DE REGISTROS (DINÂMICA - SÓ TABELAS EXISTENTES)
-- ============================================================================

DO $$
DECLARE
  r RECORD;
  sql TEXT;
  cnt BIGINT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔═══════════════════════════════════════════════════════╗';
  RAISE NOTICE '║                                                       ║';
  RAISE NOTICE '║         📊 CONTAGEM DE REGISTROS POR TABELA           ║';
  RAISE NOTICE '║                                                       ║';
  RAISE NOTICE '╚═══════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  
  FOR r IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  LOOP
    sql := format('SELECT COUNT(*) FROM public.%I', r.table_name);
    EXECUTE sql INTO cnt;
    RAISE NOTICE '  📋 % : % registros', RPAD(r.table_name, 25), cnt;
  END LOOP;
  
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- 🎨 DIAGRAMA ER (FORMATO TEXTO)
-- ============================================================================

SELECT 
  '📋 ' || tc.table_name || ' ──[' || kcu.column_name || ']──> 🎯 ' || 
  ccu.table_name || ' [' || ccu.column_name || ']' as "🔗 Relacionamentos"
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- ============================================================================
-- 🔍 VERIFICAR QUAIS TABELAS DO SATI EXISTEM
-- ============================================================================

SELECT 
  t.expected_table as "📋 Tabela Esperada",
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name = t.expected_table
    ) THEN '✅ Existe'
    ELSE '❌ Não existe'
  END as "Status"
FROM (
  VALUES 
    ('hyperfocus'),
    ('tasks'),
    ('focus_sessions'),
    ('alternancies')
) AS t(expected_table)
ORDER BY expected_table;

-- ============================================================================
-- ✅ FIM DA INSPEÇÃO BÁSICA
-- ============================================================================

