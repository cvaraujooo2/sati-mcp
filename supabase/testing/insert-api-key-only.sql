-- INSERIR API KEY PARA USUÁRIO EXISTENTE (VERSÃO SANITIZADA)
-- Esta versão NÃO contém chaves reais. Substitua em seu ambiente local para testes.

INSERT INTO public.user_api_keys (
  id,
  user_id,
  encrypted_key,
  provider,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001'::uuid,
  'REDACTED_OPENAI_KEY', -- chave removida por segurança
  'openai',
  now(),
  now()
)
ON CONFLICT (user_id, provider)
DO UPDATE SET
  encrypted_key = EXCLUDED.encrypted_key,
  updated_at = now();

SELECT 
  user_id,
  provider,
  LEFT(encrypted_key, 10) || '...' as api_key_preview,
  last_used_at,
  created_at,
  updated_at
FROM public.user_api_keys
WHERE user_id = '00000000-0000-0000-0000-000000000001';
