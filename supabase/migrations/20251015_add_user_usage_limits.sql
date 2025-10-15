-- ============================================================================
-- SATI - MIGRATION: USER USAGE LIMITS TABLE (FREE TIER FALLBACK)
-- ============================================================================
-- Tabela para rastrear uso da API gratuita (fallback) do sistema

CREATE TABLE IF NOT EXISTS public.user_usage_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Contadores de uso
    daily_requests_used INTEGER NOT NULL DEFAULT 0,
    monthly_requests_used INTEGER NOT NULL DEFAULT 0,
    
    -- Datas de controle
    last_request_date DATE DEFAULT CURRENT_DATE,
    last_reset_date DATE DEFAULT CURRENT_DATE,
    monthly_reset_date DATE DEFAULT CURRENT_DATE,
    
    -- Tier do usuário
    tier TEXT NOT NULL DEFAULT 'free'
        CHECK (tier IN ('free', 'byok')),
    
    -- Metadados
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraint: um registro por usuário
    UNIQUE(user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_usage_limits_user_id ON public.user_usage_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_limits_tier ON public.user_usage_limits(tier);
CREATE INDEX IF NOT EXISTS idx_user_usage_limits_last_request ON public.user_usage_limits(last_request_date);

-- RLS Policies
ALTER TABLE public.user_usage_limits ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own usage limits
CREATE POLICY "user_usage_limits_read_own" ON public.user_usage_limits
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: System can update all records (para incrementar contadores via API)
CREATE POLICY "user_usage_limits_system_update" ON public.user_usage_limits
    FOR UPDATE USING (true);

-- Policy: System can insert records (auto-create on first use)
CREATE POLICY "user_usage_limits_system_insert" ON public.user_usage_limits
    FOR INSERT WITH CHECK (true);

-- Trigger para updated_at
CREATE TRIGGER update_user_usage_limits_updated_at
    BEFORE UPDATE ON public.user_usage_limits
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function: Auto-reset daily counters (executar via cron job)
CREATE OR REPLACE FUNCTION reset_daily_usage_limits()
RETURNS INTEGER AS $$
DECLARE
    reset_count INTEGER;
BEGIN
    UPDATE public.user_usage_limits
    SET 
        daily_requests_used = 0,
        last_reset_date = CURRENT_DATE,
        updated_at = NOW()
    WHERE last_reset_date < CURRENT_DATE;
    
    GET DIAGNOSTICS reset_count = ROW_COUNT;
    RETURN reset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Auto-reset monthly counters (executar via cron job)
CREATE OR REPLACE FUNCTION reset_monthly_usage_limits()
RETURNS INTEGER AS $$
DECLARE
    reset_count INTEGER;
BEGIN
    UPDATE public.user_usage_limits
    SET 
        monthly_requests_used = 0,
        monthly_reset_date = CURRENT_DATE,
        updated_at = NOW()
    WHERE monthly_reset_date < DATE_TRUNC('month', CURRENT_DATE);
    
    GET DIAGNOSTICS reset_count = ROW_COUNT;
    RETURN reset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE public.user_usage_limits IS 'Tracks usage limits for free tier users (fallback API)';
COMMENT ON COLUMN public.user_usage_limits.daily_requests_used IS 'Number of requests used today';
COMMENT ON COLUMN public.user_usage_limits.monthly_requests_used IS 'Number of requests used this month';
COMMENT ON COLUMN public.user_usage_limits.tier IS 'User tier: free (uses system API) or byok (brings own key)';
COMMENT ON FUNCTION reset_daily_usage_limits() IS 'Cron job: Reset daily usage counters at midnight';
COMMENT ON FUNCTION reset_monthly_usage_limits() IS 'Cron job: Reset monthly usage counters on 1st of month';


