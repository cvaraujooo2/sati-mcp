# 🚀 Como Testar o SATI Agora (Com DEV Bypass)

## ✅ O que foi feito

Implementei um **bypass temporário de autenticação** para desenvolvimento. Em modo dev, o sistema usa automaticamente o usuário `00000000-0000-0000-0000-000000000001`.

## 📋 Pré-requisitos

1. ✅ API key da OpenAI inserida no banco
2. ✅ Dev server rodando

---

## 🏃 Passo a Passo Rápido

### 1. Inserir API Key (se ainda não fez)

Execute no Supabase SQL Editor:

```sql
INSERT INTO public.user_api_keys (
  user_id, 
  encrypted_key, 
  provider
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'sk-proj-SUA_API_KEY_AQUI', -- ⚠️ COLE SUA API KEY
  'openai'
)
ON CONFLICT (user_id, provider) DO UPDATE 
SET encrypted_key = EXCLUDED.encrypted_key;
```

### 2. Iniciar Dev Server

```bash
npm run dev
```

Você deve ver no console:
```
✓ Ready in 1.5s
○ Compiling /chat ...
[DEV MODE] Using fixed user ID: 00000000-0000-0000-0000-000000000001
```

### 3. Acessar o Chat

Abra no navegador:
```
http://localhost:3000/chat
```

### 4. Testar!

Digite no chat:
```
Crie um hiperfoco chamado "Aprender React"
```

---

## 🧪 Testes Sugeridos

### Teste 1: Chat Básico ✅
```
Você: Olá! Como você pode me ajudar?
```
**Esperado:** SATI responde explicando suas capacidades

### Teste 2: Criar Hiperfoco 🎯
```
Você: Crie um hiperfoco chamado "Estudar TypeScript" com descrição "Aprender types avançados" e cor azul
```
**Esperado:** 
- Vê nos logs: `[SATI] Executing tool: createHyperfocus`
- Vê nos logs: `[SATI] Tool executed successfully: createHyperfocus`
- Vê um card azul renderizado no chat com o hiperfoco

### Teste 3: Listar Hiperfocos 📋
```
Você: Liste todos os meus hiperfocos
```
**Esperado:**
- Tool: `listHyperfocus`
- Componente: `HyperfocusList` renderiza

### Teste 4: Adicionar Tarefa ✏️
```
Você: No hiperfoco de TypeScript, adicione uma tarefa "Estudar Generics"
```
**Esperado:**
- Tool: `createTask`
- Tarefa criada e exibida

### Teste 5: Iniciar Timer ⏱️
```
Você: Inicie um timer de 25 minutos para estudar TypeScript
```
**Esperado:**
- Tool: `startFocusTimer`
- Componente: `FocusTimer` renderiza com countdown

---

## 🔍 Como Debugar

### Verificar Logs do Backend

Olhe o terminal onde está rodando `npm run dev`:

```bash
# Logs de sucesso:
[DEV MODE] Using fixed user ID: 00000000-0000-0000-0000-000000000001
[SATI] Executing tool: createHyperfocus { title: 'Estudar TypeScript', ... }
[SATI] Tool executed successfully: createHyperfocus

# Logs de erro:
[SATI Tool Error] createHyperfocus {
  errorType: 'validation',
  message: '...',
  userId: '00000000-0000-0000-0000-000000000001'
}
```

### Verificar Network Tab

1. Abra DevTools (F12)
2. Vá na aba **Network**
3. Filtre por `chat`
4. Clique na requisição POST `/api/chat`
5. Vá na aba **Response** ou **EventStream**

Você deve ver eventos SSE chegando:
```json
data: {"type":"text","content":"Claro"}
data: {"type":"tool_call","toolName":"createHyperfocus",...}
data: {"type":"tool_result","result":{...}}
```

### Verificar Estado do React

Use React DevTools:
1. Selecione o componente `ChatInterface`
2. Veja o estado `messages`
3. Cada mensagem do assistant deve ter:
   - `toolCalls`: Array com as tools chamadas
   - `toolResults`: Array com os resultados

### Inspecionar Banco de Dados

Verifique se os dados foram salvos:

```sql
-- Ver hiperfocos criados
SELECT * FROM hyperfocus 
WHERE user_id = '00000000-0000-0000-0000-000000000001'
ORDER BY created_at DESC;

-- Ver tarefas
SELECT * FROM tasks 
WHERE hyperfocus_id IN (
  SELECT id FROM hyperfocus 
  WHERE user_id = '00000000-0000-0000-0000-000000000001'
);

-- Ver sessões de foco
SELECT * FROM focus_sessions 
WHERE user_id = '00000000-0000-0000-0000-000000000001'
ORDER BY created_at DESC;
```

---

## ⚠️ Troubleshooting

### Erro: "API key not found"

**Solução:**
```sql
-- Verificar se API key existe
SELECT * FROM user_api_keys 
WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- Se não retornar nada, inserir
INSERT INTO user_api_keys (user_id, encrypted_key, provider)
VALUES ('00000000-0000-0000-0000-000000000001', 'sk-proj-XXX', 'openai');
```

### Chat não responde

**Causas possíveis:**
1. API key inválida → Verificar no OpenAI Dashboard
2. Quota excedida → Verificar billing OpenAI
3. Erro de rede → Ver console do navegador

**Debug:**
```bash
# Ver logs detalhados
npm run dev

# Testar API key diretamente
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer sk-proj-XXX"
```

### Tool não executa

**Sintomas:** Chat responde mas tool não é chamada

**Soluções:**
1. Ser mais explícito:
   ```
   ❌ "Crie hiperfoco React"
   ✅ "Use a ferramenta createHyperfocus para criar um hiperfoco chamado React"
   ```

2. Verificar se tools estão carregadas:
   - Ver logs: Deve aparecer as 10 tools ao iniciar

3. Testar com modelo mais capaz:
   - Trocar `gpt-4o-mini` por `gpt-4o` (mais caro mas melhor)

### Componente não renderiza

**Sintomas:** Tool executa mas não aparece o componente visual

**Debug:**
1. Ver console do navegador:
   ```javascript
   // Deve mostrar o resultado da tool
   console.log(toolResult)
   ```

2. Verificar se `component.name` está presente:
   ```javascript
   // No resultado da tool deve ter:
   {
     component: {
       name: 'HyperfocusCard',
       props: { ... }
     }
   }
   ```

3. Ver se o componente está importado:
   - Abrir `src/components/chat/Message.tsx`
   - Verificar `COMPONENT_MAP`

---

## 🎯 Checklist de Validação

Marque conforme testar:

- [ ] Chat abre sem erros
- [ ] Envia mensagem e recebe resposta
- [ ] Vê logs `[DEV MODE]` no terminal
- [ ] Tool call aparece nos logs
- [ ] Tool executa (vê `Tool executed successfully`)
- [ ] Resultado chega no frontend (Network tab)
- [ ] Componente renderiza no chat
- [ ] Dados salvam no Supabase
- [ ] Error handling funciona (testar com API key inválida)

---

## 🔐 Lembrete de Segurança

⚠️ **IMPORTANTE:** O bypass de auth está ativo apenas em `development`!

Em produção (`NODE_ENV=production`), a autenticação real será exigida.

Para remover o bypass mais tarde, procure por:
```typescript
// TODO: REMOVER EM PRODUÇÃO!
const isDev = process.env.NODE_ENV === 'development'
```

---

## 🎉 Próximos Passos

Depois de validar que tudo funciona:

1. **Implementar Auth Real**
   - Criar páginas de login/signup
   - Remover bypass de dev

2. **Polish UI**
   - Melhorar loading states
   - Adicionar animações
   - Mobile responsive

3. **Deploy**
   - Vercel + Supabase production
   - Configurar variáveis de ambiente

---

**💡 Dica:** Deixe o terminal aberto para ver os logs em tempo real. Isso facilita MUITO o debug!

**🚀 Agora é só testar e ver a mágica acontecer!**

