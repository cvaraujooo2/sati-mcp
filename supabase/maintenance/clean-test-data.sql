-- ============================================================================
-- LIMPAR DADOS DE TESTE - SATI MCP
-- ============================================================================
-- 
-- Este script limpa dados de testes antigos e garante que apenas
-- dados associados ao usuário de teste válido permaneçam.
--
-- Execute este script no Supabase SQL Editor antes de testar novamente
--
-- URL: https://supabase.com/dashboard/project/clhexsbqfbvbkfvefapi/sql
-- ============================================================================

-- ============================================================================
-- 1️⃣  VERIFICAR DADOS EXISTENTES
-- ============================================================================

-- Ver todos os hyperfocus e seus user_ids
SELECT 
  id, 
  title, 
  user_id,
  created_at
FROM public.hyperfocus
ORDER BY created_at DESC;

-- Ver todas as tasks
SELECT 
  id, 
  title, 
  hyperfocus_id,
  created_at
FROM public.tasks
ORDER BY created_at DESC;

-- ============================================================================
-- 2️⃣  LIMPAR DADOS ANTIGOS (EXECUTE ESTE BLOCO)
-- ============================================================================

-- Limpar todas as tasks (por causa da foreign key)
DELETE FROM public.tasks;

-- Limpar todos os hyperfocus
DELETE FROM public.hyperfocus;

-- Limpar focus_sessions se existir
DELETE FROM public.focus_sessions;

-- Limpar alternancies se existir
DELETE FROM public.alternancies;

-- ============================================================================
-- 3️⃣  VERIFICAR LIMPEZA
-- ============================================================================

-- Deve retornar 0 linhas
SELECT COUNT(*) as hyperfocus_count FROM public.hyperfocus;
SELECT COUNT(*) as tasks_count FROM public.tasks;
SELECT COUNT(*) as sessions_count FROM public.focus_sessions;

-- ============================================================================
-- 4️⃣  VERIFICAR USUÁRIO DE TESTE
-- ============================================================================

-- Confirmar que o usuário de teste existe
SELECT 
  id, 
  email, 
  raw_user_meta_data->>'name' as name,
  created_at
FROM auth.users
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Se retornar vazio, execute primeiro: supabase/create-test-user.sql

-- ============================================================================
-- ✅ APÓS EXECUTAR ESTE SCRIPT:
-- ============================================================================
-- 
-- 1. Reinicie o MCP Inspector:
--    pkill -f "inspector" && ./start-inspector.sh
-- 
-- 2. No Playground, teste criar um novo hyperfocus:
--    "Crie um hyperfocus chamado 'Concurso INSS 2025' cor azul"
-- 
-- 3. Depois teste criar tasks:
--    "Adicione uma task 'Estudar Português' neste hyperfocus"
-- 
-- 4. Deve funcionar! 🎉
-- 
-- ============================================================================

-- ============================================================================
-- 🔍 QUERY PARA DEBUG (se ainda tiver erro)
-- ============================================================================

-- Ver qual user_id está sendo usado no hyperfocus criado
SELECT 
  id, 
  title, 
  user_id,
  CASE 
    WHEN user_id = '00000000-0000-0000-0000-000000000001' THEN '✅ Match!'
    ELSE '❌ Diferente!'
  END as status
FROM public.hyperfocus
ORDER BY created_at DESC
LIMIT 5;

