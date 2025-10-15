-- ============================================================================
-- SATI - DATA MIGRATION: Corrigir IDs de Modelos
-- ============================================================================
-- Atualiza IDs de modelos nas preferências dos usuários para usar IDs oficiais da API

-- Descrição: Os modelos estavam usando IDs customizados (gpt-40-mini, gemini-25-pro, etc)
-- que não correspondem aos IDs oficiais das APIs. Esta migration corrige isso.

-- OPENAI MODELS - Corrigir IDs
UPDATE user_preferences 
SET preferred_model = 'gpt-4o-mini', updated_at = NOW()
WHERE preferred_model = 'gpt-40-mini';

UPDATE user_preferences 
SET preferred_model = 'gpt-4o', updated_at = NOW()
WHERE preferred_model = 'gpt-40';

UPDATE user_preferences 
SET preferred_model = 'gpt-4-turbo', updated_at = NOW()
WHERE preferred_model IN ('gpt-5-instant', 'gpt-5-thinking');

UPDATE user_preferences 
SET preferred_model = 'gpt-4', updated_at = NOW()
WHERE preferred_model = 'gpt-5-pro';

-- GOOGLE MODELS - Corrigir IDs
UPDATE user_preferences 
SET preferred_model = 'gemini-1.5-pro', updated_at = NOW()
WHERE preferred_model IN ('gemini-15-pro', 'gemini-25-pro');

UPDATE user_preferences 
SET preferred_model = 'gemini-1.5-flash', updated_at = NOW()
WHERE preferred_model = 'gemini-15-flash';

UPDATE user_preferences 
SET preferred_model = 'gemini-2.0-flash-exp', updated_at = NOW()
WHERE preferred_model = 'gemini-20-flash';

-- ANTHROPIC MODELS - Já estão corretos, mas verificar
-- (claude-35-sonnet-20241022, claude-35-haiku-20241029, etc já estão corretos)

-- Verificar e logar resultados
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO updated_count 
    FROM user_preferences 
    WHERE updated_at >= NOW() - INTERVAL '1 minute';
    
    RAISE NOTICE 'Migration concluída: % preferências de usuário atualizadas', updated_count;
END $$;

-- Comments
COMMENT ON TABLE user_preferences IS 'ATUALIZADO: IDs de modelos corrigidos para corresponder às APIs oficiais (OpenAI: gpt-4o-mini, Google: gemini-1.5-pro, etc)';
