# 🧪 Guia de Teste Rápido - SATI MCP Tools

## 🎯 Objetivo

Testar a integração das MCP tools **sem precisar implementar auth completo** agora. Vamos criar um usuário de teste e inserir uma API key diretamente no banco.

---

## 📋 Pré-requisitos

- ✅ Supabase CLI instalado
- ✅ Projeto Supabase configurado
- ✅ API Key da OpenAI (obtenha em https://platform.openai.com/api-keys)

---

## 🚀 Passo a Passo

### 1. Conectar ao Supabase

```bash
# Se ainda não conectou
supabase login

# Linkar ao projeto
supabase link --project-ref SEU_PROJECT_REF
```

### 2. Executar Script SQL

**Opção A: Via Supabase Studio (Recomendado)**

1. Acesse https://supabase.com/dashboard
2. Vá em **SQL Editor**
3. Cole o conteúdo de `supabase/setup-test-user-with-api-key.sql`
4. **IMPORTANTE:** Edite as seguintes linhas:
   ```sql
   email = 'teste@sati.dev', -- Seu email
   crypt('senha123', gen_salt('bf')), -- Sua senha
   encrypted_key = 'sk-proj-XXX...', -- Sua API key OpenAI
   ```
5. Execute o script (botão RUN)

**Opção B: Via CLI**

```bash
# Editar o arquivo primeiro
nano supabase/setup-test-user-with-api-key.sql

# Executar
supabase db execute --file supabase/setup-test-user-with-api-key.sql
```

### 3. Verificar Criação

Execute este SQL para confirmar:

```sql
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  k.provider,
  k.is_active,
  LEFT(k.encrypted_key, 10) || '...' as api_key_preview
FROM auth.users u
LEFT JOIN public.user_api_keys k ON k.user_id = u.id
WHERE u.email = 'teste@sati.dev';
```

Você deve ver:
- ✅ Um usuário com email confirmado
- ✅ Uma API key ativa (preview: `sk-proj-XX...`)

---

## 🧪 Testar o Chat

### 1. Iniciar Dev Server

```bash
npm run dev
```

### 2. Fazer Login Manual (Temporário)

Como não temos páginas de login ainda, vamos usar o Supabase Auth Helper:

**Opção A: Via Console do Navegador**

1. Abra http://localhost:3000
2. Abra DevTools (F12)
3. Cole no Console:

```javascript
// Fazer login
const { data, error } = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'teste@sati.dev',
    password: 'senha123'
  })
}).then(r => r.json())

console.log('Login:', data, error)
```

**Opção B: Criar Endpoint Temporário de Login**

Crie `src/app/api/auth/login/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  
  return NextResponse.json({ success: true, user: data.user })
}
```

Depois faça POST via curl:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@sati.dev","password":"senha123"}'
```

### 3. Acessar o Chat

1. Navegue para http://localhost:3000/chat
2. Você deve ver a interface de chat
3. Digite uma mensagem de teste

---

## 🎯 Testes Sugeridos

### Teste 1: Chat Básico
```
Você: "Olá, como você pode me ajudar?"
SATI: [Deve responder com streaming]
```

### Teste 2: Criar Hiperfoco
```
Você: "Crie um hiperfoco chamado 'Aprender React' com descrição 'Estudar hooks e componentes'"
SATI: [Deve chamar createHyperfocus e renderizar HyperfocusCard]
```

### Teste 3: Listar Hiperfocos
```
Você: "Liste meus hiperfocos"
SATI: [Deve chamar listHyperfocus e renderizar HyperfocusList]
```

### Teste 4: Criar Tarefa
```
Você: "Adicione uma tarefa 'Estudar useState' no hiperfoco de React"
SATI: [Deve chamar createTask]
```

### Teste 5: Iniciar Timer
```
Você: "Inicie um timer de 25 minutos para o hiperfoco de React"
SATI: [Deve chamar startFocusTimer e renderizar FocusTimer]
```

---

## 🔍 Debug

### Verificar Logs do Backend

Abra o terminal onde está rodando `npm run dev` e procure por:

```
[SATI] Executing tool: createHyperfocus
[SATI] Tool executed successfully: createHyperfocus
```

### Verificar Network Tab

1. Abra DevTools → Network
2. Filtre por `/api/chat`
3. Veja os eventos SSE chegando:
   ```json
   {"type":"tool_call","toolName":"createHyperfocus",...}
   {"type":"tool_result","result":{...}}
   ```

### Verificar Estado do React

Use React DevTools para inspecionar o estado do `ChatInterface`:
- `messages` deve ter `toolCalls` e `toolResults`
- Status das tools deve mudar: `executing` → `completed`

---

## 🐛 Troubleshooting

### Erro: "API key not found"

**Causa:** Usuário não está autenticado ou API key não foi inserida

**Solução:**
```sql
-- Verificar se API key existe
SELECT * FROM public.user_api_keys WHERE user_id = 'SEU_USER_ID';

-- Se não existir, inserir
INSERT INTO public.user_api_keys (user_id, encrypted_key, provider)
VALUES ('SEU_USER_ID', 'sk-proj-XXX', 'openai');
```

### Erro: "Unauthorized"

**Causa:** Sessão não está ativa

**Solução:** Fazer login novamente via endpoint temporário

### Tool não executa

**Causa:** OpenAI não está detectando a tool

**Solução:**
1. Verificar logs: `[SATI] Executing tool: ...`
2. Se não aparecer, o OpenAI não chamou a tool
3. Tente ser mais explícito: "Use a ferramenta createHyperfocus para criar..."

### Componente não renderiza

**Causa:** `component.name` não está sendo retornado pela tool

**Solução:**
1. Verificar no Network tab se `result.component.name` existe
2. Ver console: `console.log(toolResult)`
3. Verificar se o handler da tool retorna o formato correto:
   ```typescript
   return {
     component: {
       name: 'HyperfocusCard',
       props: { ... }
     }
   }
   ```

---

## 🎯 Checklist de Teste

- [ ] Dev server rodando sem erros
- [ ] Usuário de teste criado no banco
- [ ] API key OpenAI inserida
- [ ] Login funcionando (sessão ativa)
- [ ] Chat abre e carrega
- [ ] Mensagem básica funciona (streaming)
- [ ] Tool call aparece nos logs
- [ ] Tool result retorna no SSE
- [ ] Componente renderiza no chat
- [ ] Erro handling funciona (testar com API key inválida)

---

## 📊 Resultado Esperado

Ao final, você deve conseguir:

1. ✅ Enviar mensagens e receber respostas com streaming
2. ✅ Ver logs de execução das tools no terminal
3. ✅ Ver componentes React renderizados no chat
4. ✅ Interagir com os componentes (ex: ver detalhes do hiperfoco)

---

## 🚀 Próximos Passos

Depois de validar que tudo funciona:

1. **Implementar Auth Real**
   - Páginas de login/signup
   - Fluxo de recuperação de senha
   - Proteção de rotas

2. **Implementar Settings Page**
   - Permitir usuário inserir/atualizar API key
   - Validação da API key
   - Instruções de como obter

3. **Deploy**
   - Configurar variáveis de ambiente
   - Deploy no Vercel
   - Configurar domínio

---

**💡 Dica:** Mantenha o terminal aberto para ver os logs em tempo real. Isso facilita muito o debug!




