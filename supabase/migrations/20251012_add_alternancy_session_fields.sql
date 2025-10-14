-- Migration: Add fields to alternancy_sessions table
-- Data: 2025-10-12
-- Descrição: Adiciona campos necessários para gerenciar sessões de alternância

-- Adicionar campos de controle de sessão
ALTER TABLE alternancy_sessions
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'on_break', 'completed', 'cancelled')),
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS current_index INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS transition_break_minutes INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS hyperfocus_sequence JSONB NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS actual_duration_minutes INTEGER,
ADD COLUMN IF NOT EXISTS feedback TEXT;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_alternancy_sessions_status ON alternancy_sessions(status);
CREATE INDEX IF NOT EXISTS idx_alternancy_sessions_user_id_status ON alternancy_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_alternancy_sessions_started_at ON alternancy_sessions(started_at);

-- Atualizar campo active baseado no novo status
UPDATE alternancy_sessions
SET status = CASE
  WHEN active = true THEN 'active'
  ELSE 'planned'
END
WHERE status IS NULL;

-- Comentários para documentação
COMMENT ON COLUMN alternancy_sessions.status IS 'Status da sessão: planned, active, on_break, completed, cancelled';
COMMENT ON COLUMN alternancy_sessions.started_at IS 'Timestamp de início da sessão';
COMMENT ON COLUMN alternancy_sessions.completed_at IS 'Timestamp de conclusão da sessão';
COMMENT ON COLUMN alternancy_sessions.current_index IS 'Índice atual no array hyperfocus_sequence';
COMMENT ON COLUMN alternancy_sessions.transition_break_minutes IS 'Duração em minutos do break entre hiperfocos';
COMMENT ON COLUMN alternancy_sessions.hyperfocus_sequence IS 'Array JSON de hiperfocos e suas durações';
COMMENT ON COLUMN alternancy_sessions.actual_duration_minutes IS 'Duração real da sessão em minutos';
COMMENT ON COLUMN alternancy_sessions.feedback IS 'Feedback opcional do usuário sobre a sessão';
