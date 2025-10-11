    -- ============================================================================
    -- INSPEÇÃO COMPLETA DA INFRAESTRUTURA DO BANCO DE DADOS - SATI MCP
    -- ============================================================================
    -- 
    -- Este script fornece uma visão completa da estrutura do banco de dados
    -- incluindo tabelas, colunas, tipos, constraints, índices, foreign keys, etc.
    --
    -- Execute este script no Supabase SQL Editor
    -- URL: https://supabase.com/dashboard/project/clhexsbqfbvbkfvefapi/sql
    -- ============================================================================

    -- ============================================================================
    -- 1️⃣  LISTAR TODAS AS TABELAS DO SCHEMA PUBLIC
    -- ============================================================================

    SELECT 
    schemaname as schema,
    tablename as table_name,
    tableowner as owner
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename;

    -- ============================================================================
    -- 2️⃣  ESTRUTURA COMPLETA DE CADA TABELA (COLUNAS E TIPOS)
    -- ============================================================================

    SELECT 
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position;

    -- ============================================================================
    -- 3️⃣  PRIMARY KEYS
    -- ============================================================================

    SELECT 
    tc.table_name, 
    kcu.column_name,
    tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'public'
    ORDER BY tc.table_name;

    -- ============================================================================
    -- 4️⃣  FOREIGN KEYS (RELACIONAMENTOS)
    -- ============================================================================

    SELECT 
    tc.table_name as from_table,
    kcu.column_name as from_column,
    ccu.table_name AS to_table,
    ccu.column_name AS to_column,
    tc.constraint_name
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
    -- 5️⃣  ÍNDICES
    -- ============================================================================

    SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname;

    -- ============================================================================
    -- 6️⃣  CONSTRAINTS (UNIQUE, CHECK, etc)
    -- ============================================================================

    SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
    FROM information_schema.table_constraints tc
    LEFT JOIN information_schema.check_constraints cc
    ON tc.constraint_name = cc.constraint_name
    WHERE tc.table_schema = 'public'
    AND tc.constraint_type IN ('UNIQUE', 'CHECK')
    ORDER BY tc.table_name, tc.constraint_type;

-- ============================================================================
-- 7️⃣  CONTAGEM DE REGISTROS POR TABELA
-- ============================================================================

-- Contagem dinâmica - só conta tabelas que existem
SELECT 
  table_name,
  (
    SELECT COUNT(*) 
    FROM information_schema.tables t2 
    WHERE t2.table_schema = 'public' 
      AND t2.table_name = t.table_name
  ) as table_exists,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.tables t2 
      WHERE t2.table_schema = 'public' 
        AND t2.table_name = t.table_name
    ) THEN (
      SELECT COUNT(*) 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND information_schema.columns.table_name = t.table_name
    )
    ELSE 0
  END as column_count
FROM (
  SELECT 'hyperfocus' as table_name
  UNION ALL SELECT 'tasks'
  UNION ALL SELECT 'focus_sessions'
  UNION ALL SELECT 'alternancies'
) t
ORDER BY table_name;

-- Contagem real de registros (somente tabelas existentes)
DO $$
DECLARE
  r RECORD;
  sql TEXT;
  cnt BIGINT;
BEGIN
  RAISE NOTICE '=== CONTAGEM DE REGISTROS ===';
  
  FOR r IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  LOOP
    sql := format('SELECT COUNT(*) FROM public.%I', r.table_name);
    EXECUTE sql INTO cnt;
    RAISE NOTICE '% : % registros', r.table_name, cnt;
  END LOOP;
END $$;

    -- ============================================================================
    -- 8️⃣  TAMANHO DAS TABELAS (STORAGE)
    -- ============================================================================

    SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

    -- ============================================================================
    -- 9️⃣  VERIFICAR RLS (ROW LEVEL SECURITY)
    -- ============================================================================

    SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename;

    -- ============================================================================
    -- 🔟 POLÍTICAS RLS ATIVAS
    -- ============================================================================

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
    -- 1️⃣1️⃣  TRIGGERS
    -- ============================================================================

    SELECT 
    trigger_schema,
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
    ORDER BY event_object_table, trigger_name;

    -- ============================================================================
    -- 1️⃣2️⃣  VIEWS
    -- ============================================================================

    SELECT 
    table_schema,
    table_name,
    view_definition
    FROM information_schema.views
    WHERE table_schema = 'public'
    ORDER BY table_name;

    -- ============================================================================
    -- 1️⃣3️⃣  SEQUENCES
    -- ============================================================================

    SELECT 
    schemaname,
    sequencename,
    last_value
    FROM pg_sequences
    WHERE schemaname = 'public'
    ORDER BY sequencename;

    -- ============================================================================
    -- 1️⃣4️⃣  FUNÇÕES CUSTOMIZADAS
    -- ============================================================================

    SELECT 
    n.nspname as schema,
    p.proname as function_name,
    pg_get_function_result(p.oid) as return_type,
    pg_get_function_arguments(p.oid) as arguments
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    ORDER BY p.proname;

    -- ============================================================================
    -- 1️⃣5️⃣  SCHEMA VISUAL (MERMAID FORMAT) - PARA DOCUMENTAÇÃO
    -- ============================================================================

    -- Execute este SELECT para gerar um diagrama ER em formato Mermaid
    WITH tables AS (
    SELECT DISTINCT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ),
    columns AS (
    SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ),
    fkeys AS (
    SELECT 
        tc.table_name as from_table,
        kcu.column_name as from_column,
        ccu.table_name AS to_table,
        ccu.column_name AS to_column
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
    )
    SELECT 
    '```mermaid' as mermaid_diagram
    UNION ALL
    SELECT 'erDiagram'
    UNION ALL
    SELECT '  ' || from_table || ' ||--o{ ' || to_table || ' : "has"'
    FROM fkeys
    UNION ALL
    SELECT '```';

    -- ============================================================================
    -- 1️⃣6️⃣  RESUMO EXECUTIVO
    -- ============================================================================

    SELECT 
    (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public') as total_tables,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public') as total_columns,
    (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public') as total_indexes,
    (SELECT COUNT(*) FROM information_schema.table_constraints 
    WHERE table_schema = 'public' AND constraint_type = 'FOREIGN KEY') as total_foreign_keys,
    (SELECT COUNT(*) FROM information_schema.table_constraints 
    WHERE table_schema = 'public' AND constraint_type = 'PRIMARY KEY') as total_primary_keys,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as total_rls_policies,
    (SELECT pg_size_pretty(SUM(pg_total_relation_size(schemaname||'.'||tablename))) 
    FROM pg_tables WHERE schemaname = 'public') as total_database_size;

    -- ============================================================================
    -- 📊 INFORMAÇÕES ESPECÍFICAS DO SATI MCP
    -- ============================================================================

    -- Verificar estrutura da tabela hyperfocus
    SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'hyperfocus'
    ORDER BY ordinal_position;

    -- Verificar estrutura da tabela tasks
    SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'tasks'
    ORDER BY ordinal_position;

    -- Verificar estrutura da tabela focus_sessions
    SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'focus_sessions'
    ORDER BY ordinal_position;

-- Verificar estrutura da tabela alternancies (se existir)
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'alternancies'
  AND EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'alternancies'
  )
ORDER BY ordinal_position;

    -- ============================================================================
    -- ✅ FIM DA INSPEÇÃO
    -- ============================================================================
    -- 
    -- Este script fornece uma visão completa da infraestrutura do banco de dados.
    -- Use os resultados para documentação, debugging ou planejamento de mudanças.
    -- 
    -- ============================================================================

