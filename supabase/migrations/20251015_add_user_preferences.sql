-- ============================================================================
-- SATI - MIGRATION: USER PREFERENCES TABLE
-- ============================================================================
-- Tabela para armazenar preferências do usuário (modelo/provider preferido, etc)

CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Provider e modelo preferido
    preferred_provider TEXT DEFAULT 'openai'
        CHECK (preferred_provider IN ('openai', 'anthropic', 'google')),
    preferred_model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
    
    -- Avisos de modelos já vistos/dismissados
    model_warnings_dismissed JSONB DEFAULT '[]'::jsonb,
    
    -- Metadados
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraint: um registro por usuário
    UNIQUE(user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_provider ON public.user_preferences(preferred_provider);

-- RLS Policies
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see/manage their own preferences
CREATE POLICY "user_preferences_user_access" ON public.user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.user_preferences IS 'Stores user preferences for AI models and providers';
COMMENT ON COLUMN public.user_preferences.preferred_provider IS 'User preferred AI provider (openai, anthropic, google)';
COMMENT ON COLUMN public.user_preferences.preferred_model IS 'User preferred model ID';
COMMENT ON COLUMN public.user_preferences.model_warnings_dismissed IS 'Array of dismissed model warning IDs';


