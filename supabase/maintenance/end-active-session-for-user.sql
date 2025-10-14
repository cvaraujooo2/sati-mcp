-- ==============================================
-- END ACTIVE FOCUS SESSION FOR SPECIFIC USER
-- ==============================================
-- Este script finaliza a sessão ativa de um usuário específico
-- ID do usuário: 0d3b44a4-717a-43df-914c-faf0836cfa38
-- ==============================================

-- ANTES: Verificar qual sessão será finalizada
SELECT 
    fs.id AS session_id,
    fs.hyperfocus_id,
    h.title AS hyperfocus_title,
    fs.started_at,
    fs.planned_duration_minutes,
    EXTRACT(EPOCH FROM (NOW() - fs.started_at)) / 60 AS minutes_elapsed,
    '⚠️ Esta sessão será finalizada' AS status
FROM focus_sessions fs
JOIN hyperfocus h ON fs.hyperfocus_id = h.id
WHERE fs.ended_at IS NULL
  AND h.user_id = '0d3b44a4-717a-43df-914c-faf0836cfa38';

-- AÇÃO: Finalizar todas as sessões ativas do usuário
UPDATE focus_sessions
SET ended_at = NOW()
WHERE ended_at IS NULL
  AND hyperfocus_id IN (
    SELECT id FROM hyperfocus WHERE user_id = '0d3b44a4-717a-43df-914c-faf0836cfa38'
  )
RETURNING 
    id AS session_id,
    hyperfocus_id,
    started_at,
    ended_at,
    EXTRACT(EPOCH FROM (ended_at - started_at)) / 60 AS actual_duration_minutes,
    '✅ Sessão finalizada com sucesso' AS status;

-- DEPOIS: Confirmar que não há mais sessões ativas
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Nenhuma sessão ativa restante'
        ELSE '⚠️ Ainda existem ' || COUNT(*) || ' sessões ativas'
    END AS verification_status
FROM focus_sessions fs
JOIN hyperfocus h ON fs.hyperfocus_id = h.id
WHERE fs.ended_at IS NULL
  AND h.user_id = '0d3b44a4-717a-43df-914c-faf0836cfa38';
