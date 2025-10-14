-- ==============================================
-- CHECK ACTIVE FOCUS SESSIONS
-- ==============================================
-- Este script verifica sessões de foco ativas
-- e fornece informações para diagnóstico
-- ==============================================

-- 1. LISTAR TODAS AS SESSÕES ATIVAS
SELECT 
    fs.id AS session_id,
    fs.hyperfocus_id,
    h.title AS hyperfocus_title,
    h.user_id,
    fs.started_at,
    fs.planned_duration_minutes,
    fs.ended_at,
    EXTRACT(EPOCH FROM (NOW() - fs.started_at)) / 60 AS minutes_elapsed
FROM focus_sessions fs
JOIN hyperfocus h ON fs.hyperfocus_id = h.id
WHERE fs.ended_at IS NULL
ORDER BY fs.started_at DESC;

-- 2. CONTAR SESSÕES ATIVAS POR USUÁRIO
SELECT 
    h.user_id,
    COUNT(*) AS active_sessions_count
FROM focus_sessions fs
JOIN hyperfocus h ON fs.hyperfocus_id = h.id
WHERE fs.ended_at IS NULL
GROUP BY h.user_id;

-- 3. IDENTIFICAR SESSÕES "ÓRFÃS" (sem ended_at há mais de 24 horas)
SELECT 
    fs.id AS session_id,
    fs.hyperfocus_id,
    h.title AS hyperfocus_title,
    h.user_id,
    fs.started_at,
    fs.planned_duration_minutes,
    EXTRACT(EPOCH FROM (NOW() - fs.started_at)) / 3600 AS hours_elapsed
FROM focus_sessions fs
JOIN hyperfocus h ON fs.hyperfocus_id = h.id
WHERE fs.ended_at IS NULL
  AND fs.started_at < NOW() - INTERVAL '24 hours'
ORDER BY fs.started_at ASC;

-- ==============================================
-- AÇÕES CORRETIVAS (comentadas por segurança)
-- ==============================================

-- OPÇÃO A: Finalizar TODAS as sessões ativas para um usuário específico
-- DESCOMENTE E SUBSTITUA '<USER_ID>' pelo ID do usuário
/*
UPDATE focus_sessions
SET ended_at = NOW()
WHERE ended_at IS NULL
  AND hyperfocus_id IN (
    SELECT id FROM hyperfocus WHERE user_id = '<USER_ID>'
  )
RETURNING id, hyperfocus_id, started_at, ended_at;
*/

-- OPÇÃO B: Finalizar UMA sessão específica
-- DESCOMENTE E SUBSTITUA '<SESSION_ID>' pelo ID da sessão
/*
UPDATE focus_sessions
SET ended_at = NOW()
WHERE id = '<SESSION_ID>'
  AND ended_at IS NULL
RETURNING id, hyperfocus_id, started_at, ended_at;
*/

-- OPÇÃO C: Finalizar sessões órfãs (abandonadas há mais de 24h)
/*
UPDATE focus_sessions
SET ended_at = started_at + (planned_duration_minutes * INTERVAL '1 minute')
WHERE ended_at IS NULL
  AND started_at < NOW() - INTERVAL '24 hours'
RETURNING id, hyperfocus_id, started_at, ended_at;
*/
