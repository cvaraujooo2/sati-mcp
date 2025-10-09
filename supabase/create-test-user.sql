-- ============================================================================
-- SQL para Criar Usuário de Teste no Supabase Auth
-- ============================================================================
-- 
-- Este script cria um usuário de teste na tabela auth.users do Supabase
-- para usar durante desenvolvimento sem precisar de autenticação real.
--
-- Execute no Supabase Dashboard → SQL Editor
-- ============================================================================

-- Inserir usuário de teste na tabela auth.users
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user,
    deleted_at
)
VALUES (
    '00000000-0000-0000-0000-000000000000',  -- instance_id (default)
    '00000000-0000-0000-0000-000000000001',  -- id (nosso TEST_USER_ID)
    'authenticated',                          -- aud (audience)
    'authenticated',                          -- role
    'test-user@sati-mcp.dev',                -- email
    '',                                       -- encrypted_password (vazio)
    NOW(),                                    -- email_confirmed_at
    NULL,                                     -- invited_at
    '',                                       -- confirmation_token
    NULL,                                     -- confirmation_sent_at
    '',                                       -- recovery_token
    NULL,                                     -- recovery_sent_at
    '',                                       -- email_change_token_new
    '',                                       -- email_change
    NULL,                                     -- email_change_sent_at
    NOW(),                                    -- last_sign_in_at
    '{"provider":"email","providers":["email"]}',  -- raw_app_meta_data
    '{"name":"Test User","role":"developer"}',     -- raw_user_meta_data
    FALSE,                                    -- is_super_admin
    NOW(),                                    -- created_at
    NOW(),                                    -- updated_at
    NULL,                                     -- phone
    NULL,                                     -- phone_confirmed_at
    '',                                       -- phone_change
    '',                                       -- phone_change_token
    NULL,                                     -- phone_change_sent_at
    '',                                       -- email_change_token_current
    0,                                        -- email_change_confirm_status
    NULL,                                     -- banned_until
    '',                                       -- reauthentication_token
    NULL,                                     -- reauthentication_sent_at
    FALSE,                                    -- is_sso_user
    NULL                                      -- deleted_at
)
ON CONFLICT (id) DO NOTHING;  -- Não falhar se já existir

-- Inserir identidade correspondente na tabela auth.identities
INSERT INTO auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
)
VALUES (
    '00000000-0000-0000-0000-000000000001',  -- provider_id (mesmo que user_id)
    '00000000-0000-0000-0000-000000000001',  -- user_id
    '{"sub":"00000000-0000-0000-0000-000000000001","email":"test-user@sati-mcp.dev"}',  -- identity_data
    'email',                                  -- provider
    NOW(),                                    -- last_sign_in_at
    NOW(),                                    -- created_at
    NOW()                                     -- updated_at
)
ON CONFLICT (provider, provider_id) DO NOTHING;  -- Não falhar se já existir

-- Verificar se o usuário foi criado
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    raw_user_meta_data->>'name' as name
FROM auth.users
WHERE id = '00000000-0000-0000-0000-000000000001';

-- ============================================================================
-- RESULTADO ESPERADO:
-- 
-- id: 00000000-0000-0000-0000-000000000001
-- email: test-user@sati-mcp.dev
-- name: Test User
-- 
-- ✅ Copie este UUID e confirme que é o mesmo usado no mcp-server.mjs!
-- ============================================================================

-- ============================================================================
-- PARA REMOVER O USUÁRIO DE TESTE (quando não precisar mais):
-- ============================================================================
-- 
-- DELETE FROM auth.identities 
-- WHERE user_id = '00000000-0000-0000-0000-000000000001';
-- 
-- DELETE FROM auth.users 
-- WHERE id = '00000000-0000-0000-0000-000000000001';
-- 
-- ============================================================================

