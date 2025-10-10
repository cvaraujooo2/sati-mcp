-- ============================================================================
-- SATI - MIGRATION: ADD USER API KEYS TABLE
-- ============================================================================

-- Criar tabela para armazenar API keys dos usuários
CREATE TABLE IF NOT EXISTS public.user_api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- API Key (por enquanto em texto plano para desenvolvimento)
    -- TODO: Migrar para Supabase Vault encryption
    encrypted_key TEXT NOT NULL,
    
    -- Provider da API key
    provider TEXT NOT NULL DEFAULT 'openai'
        CHECK (provider IN ('openai', 'anthropic', 'google', 'deepseek')),
    
    -- Metadados
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, provider)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON public.user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_provider ON public.user_api_keys(provider);

-- RLS Policies
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see/manage their own API keys
CREATE POLICY "user_api_keys_user_access" ON public.user_api_keys
    FOR ALL USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_api_keys_updated_at
    BEFORE UPDATE ON public.user_api_keys
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.user_api_keys IS 'Stores encrypted API keys for external providers (OpenAI, Anthropic, etc.)';
COMMENT ON COLUMN public.user_api_keys.encrypted_key IS 'Encrypted API key (TODO: migrate to Supabase Vault)';
COMMENT ON COLUMN public.user_api_keys.provider IS 'API provider (openai, anthropic, google, deepseek)';
COMMENT ON COLUMN public.user_api_keys.last_used_at IS 'Timestamp of last successful API call using this key';