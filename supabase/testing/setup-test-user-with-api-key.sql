-- SETUP USUÁRIO DE TESTE COM API KEY (VERSÃO SANITIZADA)
-- Esta versão NÃO contém chaves reais. Substitua em seu ambiente local para testes.

-- 1. Criar usuário de teste no auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud
) VALUES (
  '84c419f8-bb51-4a51-bb0d-26a48453f495',
  '00000000-0000-0000-0000-000000000000',
  'teste@sati.dev',
  crypt('senha123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Usuário Teste SATI"}',
  false,
  'authenticated',
  'authenticated'
)
ON CONFLICT (email) DO NOTHING
RETURNING id, email;

-- 3. Inserir API Key OpenAI (SANITIZADA)
INSERT INTO public.user_api_keys (
  id,
  user_id,
  encrypted_key,
  provider,
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '84c419f8-bb51-4a51-bb0d-26a48453f495'::uuid,
  'REDACTED_OPENAI_KEY', -- chave removida por segurança
  true,
  now(),
  now()
)
ON CONFLICT (user_id, provider) DO UPDATE
SET 
  encrypted_key = EXCLUDED.encrypted_key,
  is_active = true,
  updated_at = now();

SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  k.provider,
  k.is_active,
  LEFT(k.encrypted_key, 10) || '...' as api_key_preview,
  k.created_at
FROM auth.users u
LEFT JOIN public.user_api_keys k ON k.user_id = u.id
WHERE u.email = 'teste@sati.dev';
