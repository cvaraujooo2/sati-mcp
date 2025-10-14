-- Migration: Add notes field to focus_sessions table
-- Date: 2025-10-14
-- Description: Adiciona campo notes para permitir que usuários adicionem observações nas sessões

-- Add notes column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'focus_sessions' 
    AND column_name = 'notes'
  ) THEN
    ALTER TABLE focus_sessions 
    ADD COLUMN notes TEXT NULL;
    
    COMMENT ON COLUMN focus_sessions.notes IS 'Observações e notas do usuário sobre a sessão de foco';
  END IF;
END $$;

