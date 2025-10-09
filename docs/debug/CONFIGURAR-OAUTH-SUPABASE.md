# 🔐 Configurar OAuth no Supabase

Guia para resolver o erro **"Invalid redirect URI"**

---

## 🎯 O Problema

Quando você tenta fazer login, o Supabase retorna:

```
Error: Invalid redirect URI
```

**Causa**: O Supabase não reconhece a URL de callback que sua aplicação está tentando usar.

---

## ✅ Solução (3 Passos)

### 1️⃣ Adicionar NEXT_PUBLIC_URL ao .env.local

✅ **Já feito!** A variável foi adicionada:

```bash
NEXT_PUBLIC_URL=http://localhost:3000
```

### 2️⃣ Configurar Redirect URLs no Supabase Dashboard

1. **Acesse o Supabase Dashboard**:
   - URL: https://supabase.com/dashboard
   - Faça login na sua conta

2. **Selecione seu projeto**:
   - Projeto: `clhexsbqfbvbkfvefapi`

3. **Vá em Authentication → URL Configuration**:
   - Menu lateral: **Authentication**
   - Submenu: **URL Configuration**

4. **Adicione as URLs de Redirect**:

   No campo **"Redirect URLs"**, adicione:

   ```
   http://localhost:3000/auth/callback
   http://127.0.0.1:3000/auth/callback
   ```

   **Importante**: Adicione **ambas** (localhost e 127.0.0.1) para garantir compatibilidade.

5. **Site URL**:
   
   Configure também o **"Site URL"**:
   
   ```
   http://localhost:3000
   ```

6. **Clique em "Save"**

### 3️⃣ Configurar OAuth Providers (Google/GitHub)

Se você planeja usar login social:

#### Google OAuth

1. No Supabase Dashboard → **Authentication** → **Providers**
2. Clique em **Google**
3. **Ative** o provider
4. Adicione suas credenciais do Google Cloud Console:
   - **Client ID**: (do Google Cloud Console)
   - **Client Secret**: (do Google Cloud Console)

**Redirect URI para configurar no Google Cloud Console**:
```
https://clhexsbqfbvbkfvefapi.supabase.co/auth/v1/callback
```

#### GitHub OAuth

1. No Supabase Dashboard → **Authentication** → **Providers**
2. Clique em **GitHub**
3. **Ative** o provider
4. Adicione suas credenciais do GitHub:
   - **Client ID**: (do GitHub OAuth Apps)
   - **Client Secret**: (do GitHub OAuth Apps)

**Redirect URI para configurar no GitHub**:
```
https://clhexsbqfbvbkfvefapi.supabase.co/auth/v1/callback
```

---

## 🧪 Testar a Configuração

### Opção 1: Via Navegador

1. Inicie sua aplicação Next.js:
   ```bash
   npm run dev
   ```

2. Acesse: http://localhost:3000

3. Tente fazer login

### Opção 2: Via cURL (teste rápido)

```bash
# Testar redirect do login
curl -I "http://localhost:3000/auth/login?provider=google"

# Deve retornar um redirect 307 para o Google OAuth
```

---

## 📋 Checklist de Configuração

### Variáveis de Ambiente (.env.local)
- [x] `NEXT_PUBLIC_SUPABASE_URL`
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [x] `NEXT_PUBLIC_URL`

### Supabase Dashboard
- [ ] Site URL configurada: `http://localhost:3000`
- [ ] Redirect URL adicionada: `http://localhost:3000/auth/callback`
- [ ] Redirect URL adicionada: `http://127.0.0.1:3000/auth/callback`
- [ ] Provider OAuth ativado (Google ou GitHub)
- [ ] Credenciais OAuth configuradas

---

## 🚀 Para Produção (Futuro)

Quando fizer deploy, você precisará adicionar as URLs de produção:

### Vercel Deploy

1. **Adicionar variável de ambiente no Vercel**:
   ```
   NEXT_PUBLIC_URL=https://seu-projeto.vercel.app
   ```

2. **Adicionar Redirect URLs no Supabase**:
   ```
   https://seu-projeto.vercel.app/auth/callback
   ```

3. **Atualizar Site URL**:
   ```
   https://seu-projeto.vercel.app
   ```

### Domínio Próprio

Se usar domínio próprio (ex: `sati.app`):

1. **Variável de ambiente**:
   ```
   NEXT_PUBLIC_URL=https://sati.app
   ```

2. **Redirect URLs**:
   ```
   https://sati.app/auth/callback
   ```

---

## 🐛 Troubleshooting

### Erro persiste após configurar

**Solução 1**: Limpar cache do navegador
```bash
# Chrome: Ctrl+Shift+Delete
# Firefox: Ctrl+Shift+Delete
```

**Solução 2**: Reiniciar servidor Next.js
```bash
# Parar (Ctrl+C)
npm run dev
```

**Solução 3**: Verificar se salvou no Supabase
- Às vezes o Supabase não salva automaticamente
- Clique em "Save" novamente
- Aguarde 30 segundos para propagar

### Erro: "OAuth provider not configured"

**Causa**: Provider (Google/GitHub) não está ativado no Supabase

**Solução**:
1. Supabase Dashboard → Authentication → Providers
2. Ative o provider desejado
3. Configure Client ID e Secret

### Erro: "redirect_uri_mismatch" (Google)

**Causa**: URL não configurada no Google Cloud Console

**Solução**:
1. Acesse: https://console.cloud.google.com
2. APIs & Services → Credentials
3. Edite seu OAuth 2.0 Client
4. Adicione em "Authorized redirect URIs":
   ```
   https://clhexsbqfbvbkfvefapi.supabase.co/auth/v1/callback
   ```

---

## 📚 Recursos Úteis

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [OAuth Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- [Google OAuth Setup](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [GitHub OAuth Setup](https://supabase.com/docs/guides/auth/social-login/auth-github)

---

## 🎯 Resumo Rápido

```bash
# 1. Variável já adicionada ✅
cat .env.local | grep NEXT_PUBLIC_URL

# 2. Configurar no Supabase Dashboard:
# - Site URL: http://localhost:3000
# - Redirect URLs: 
#   * http://localhost:3000/auth/callback
#   * http://127.0.0.1:3000/auth/callback

# 3. Testar
npm run dev
# Abrir: http://localhost:3000
```

---

**Última atualização**: 2025-10-09  
**Versão**: 1.0.0

