-- ============================================================================
-- SETUP USUÁRIO DE TESTE COM API KEY
-- ============================================================================
-- Este script cria um usuário de teste e insere uma API key OpenAI
-- para permitir testes do chat sem precisar implementar auth completo
-- ============================================================================

-- 1. Criar usuário de teste no auth.users
-- IMPORTANTE: Substitua 'sua-senha-aqui' por uma senha real
-- IMPORTANTE: Substitua 'seu-email@example.com' por seu email real
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
  gen_random_uuid(), -- ID gerado automaticamente
  '00000000-0000-0000-0000-000000000000', -- Instance ID padrão
  'teste@sati.dev', -- ⚠️ ALTERE PARA SEU EMAIL
  crypt('senha123', gen_salt('bf')), -- ⚠️ ALTERE A SENHA
  now(), -- Email já confirmado
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

-- 2. Buscar o ID do usuário criado (para usar no próximo passo)
-- Execute este SELECT e copie o UUID retornado
SELECT id, email FROM auth.users WHERE email = 'teste@sati.dev';

-- 3. Inserir API Key OpenAI
-- IMPORTANTE: Substitua 'USER_ID_AQUI' pelo UUID retornado acima
-- IMPORTANTE: Substitua 'sk-...' pela sua API key real da OpenAI
INSERT INTO public.user_api_keys (
  id,
  user_id,
  encrypted_key, -- Por enquanto, armazenando em texto plano (OK para dev)
  provider,
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'USER_ID_AQUI'::uuid, -- ⚠️ COLE O UUID DO USUÁRIO AQUI
  'sk-proj-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', -- ⚠️ COLE SUA API KEY AQUI
  'openai',
  true,
  now(),
  now()
)
ON CONFLICT (user_id, provider) DO UPDATE
SET 
  encrypted_key = EXCLUDED.encrypted_key,
  is_active = true,
  updated_at = now();

-- 4. Verificar se foi criado corretamente
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

-- ============================================================================
-- SCRIPT ALTERNATIVO: Tudo em uma única transação
-- ============================================================================
-- Use este se preferir fazer tudo de uma vez (mais seguro)

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Criar usuário
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
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'teste@sati.dev', -- ⚠️ ALTERE
    crypt('senha123', gen_salt('bf')), -- ⚠️ ALTERE
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Usuário Teste SATI"}',
    false,
    'authenticated',
    'authenticated'
  )
  ON CONFLICT (email) DO UPDATE
  SET email_confirmed_at = now()
  RETURNING id INTO v_user_id;

  -- Inserir API Key
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
    v_user_id,
    'sk-proj-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', -- ⚠️ COLE SUA API KEY
    'openai',
    true,
    now(),
    now()
  )
  ON CONFLICT (user_id, provider) DO UPDATE
  SET 
    encrypted_key = EXCLUDED.encrypted_key,
    is_active = true,
    updated_at = now();

  -- Mostrar resultado
  RAISE NOTICE 'Usuário criado com ID: %', v_user_id;
END $$;

-- Verificar resultado final
SELECT 
  u.id,
  u.email,
  k.provider,
  LEFT(k.encrypted_key, 10) || '...' as api_key_preview
FROM auth.users u
JOIN public.user_api_keys k ON k.user_id = u.id
WHERE u.email = 'teste@sati.dev';




