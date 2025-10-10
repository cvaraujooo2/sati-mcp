-- ============================================================================
-- INSERIR API KEY PARA USUÁRIO EXISTENTE
-- ============================================================================
-- Use este script quando você já tem um usuário e só precisa adicionar a API key
-- ============================================================================

-- Inserir API Key OpenAI para o usuário
-- IMPORTANTE: Substitua 'sk-proj-XXX...' pela sua API key real da OpenAI
INSERT INTO public.user_api_keys (
  id,
  user_id,
  encrypted_key,
  provider,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001'::uuid, -- Seu usuário
  'sk-proj-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', -- ⚠️ COLE SUA API KEY AQUI
  'openai',
  now(),
  now()
)
ON CONFLICT (user_id, provider) 
DO UPDATE SET 
  encrypted_key = EXCLUDED.encrypted_key,
  updated_at = now();

-- Verificar se foi inserido corretamente
SELECT 
  user_id,
  provider,
  LEFT(encrypted_key, 10) || '...' as api_key_preview,
  last_used_at,
  created_at,
  updated_at
FROM public.user_api_keys
WHERE user_id = '00000000-0000-0000-0000-000000000001';

