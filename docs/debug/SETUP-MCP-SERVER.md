# 🚀 Setup do MCP Server Sati

## 📋 Pré-requisitos

- Node.js 20+
- Conta no Supabase
- MCP Inspector (para testes)

---

## 1️⃣ Configurar Supabase

### 1.1 Criar Projeto no Supabase
1. Acesse https://supabase.com
2. Crie um novo projeto
3. Aguarde a criação do banco de dados

### 1.2 Executar Schema SQL
1. No Dashboard do Supabase, vá em **SQL Editor**
2. Copie o conteúdo de `supabase/sql.sql`
3. Execute o script completo
4. Verifique se as tabelas foram criadas:
   - `hyperfocus`
   - `tasks`
   - `focus_sessions`
   - `alternancy_sessions`
   - `alternancy_hyperfocus`
   - `hyperfocus_context`

### 1.3 Copiar Credenciais
1. Vá em **Settings → API**
2. Copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 2️⃣ Configurar Variáveis de Ambiente

### 2.1 Criar arquivo `.env.local`
```bash
cp .env.example .env.local
```

### 2.2 Preencher as variáveis
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**IMPORTANTE:** Certifique-se de que as variáveis estão corretas!

---

## 3️⃣ Instalar Dependências

```bash
npm install

# Instalar dotenv (necessário para carregar .env.local)
npm install dotenv
```

**Nota:** O `dotenv` é necessário para que o `mcp-server.mjs` carregue as variáveis do `.env.local` automaticamente.

---

## 4️⃣ Testar Conexão com Supabase

### Teste via Next.js
```bash
npm run dev

# Em outro terminal
curl http://localhost:3000/api/test-db
```

Você deve ver:
```json
{
  "success": true,
  "message": "Connected to Supabase!",
  "timestamp": "..."
}
```

---

## 5️⃣ Executar MCP Server (Standalone)

### Opção 1: Via Script
```bash
chmod +x run-mcp.sh
./run-mcp.sh
```

### Opção 2: Via Node Direto
```bash
node mcp-server.mjs
```

### Opção 3: Via npm (adicionar ao package.json)
```json
{
  "scripts": {
    "mcp:start": "node mcp-server.mjs"
  }
}
```

```bash
npm run mcp:start
```

---

## 6️⃣ Testar com MCP Inspector

### 6.1 Instalar MCP Inspector
```bash
npx @modelcontextprotocol/inspector
```

### 6.2 Configurar Inspector
1. **Transport Type:** STDIO
2. **Command:** `node mcp-server.mjs`
3. **Working Directory:** `/home/ester/Documentos/docs/sati-mcp`

Ou via `run-mcp.sh`:
1. **Transport Type:** STDIO
2. **Command:** `./run-mcp.sh`
3. **Working Directory:** `/home/ester/Documentos/docs/sati-mcp`

### 6.3 Conectar
Clique em "Connect" e você deverá ver:
- ✅ 10 tools disponíveis
- ✅ Server info: sati-mcp v1.0.0

### 6.4 Testar Tools

#### Teste 1: Criar Hiperfoco
```json
{
  "tool": "createHyperfocus",
  "arguments": {
    "title": "Aprender React",
    "description": "Dominar React e seus hooks",
    "color": "blue",
    "estimatedTimeMinutes": 120
  }
}
```

**Resultado esperado:**
```json
{
  "structuredContent": {
    "type": "hyperfocus_created",
    "hyperfocusId": "uuid-aqui",
    "title": "Aprender React",
    ...
  }
}
```

#### Teste 2: Listar Hiperfocos
```json
{
  "tool": "listHyperfocus",
  "arguments": {
    "archived": false,
    "limit": 10
  }
}
```

#### Teste 3: Criar Tarefa
```json
{
  "tool": "createTask",
  "arguments": {
    "hyperfocusId": "uuid-do-hiperfoco",
    "title": "Estudar hooks básicos",
    "estimatedMinutes": 30
  }
}
```

#### Teste 4: Quebrar em Subtarefas
```json
{
  "tool": "breakIntoSubtasks",
  "arguments": {
    "hyperfocusId": "uuid-do-hiperfoco",
    "taskDescription": "Criar uma aplicação React completa com autenticação, dashboard e APIs",
    "numSubtasks": 5,
    "autoCreate": true
  }
}
```

#### Teste 5: Iniciar Timer
```json
{
  "tool": "startFocusTimer",
  "arguments": {
    "hyperfocusId": "uuid-do-hiperfoco",
    "durationMinutes": 25,
    "playSound": true
  }
}
```

---

## 7️⃣ Verificar Dados no Supabase

1. Acesse o **Table Editor** no Supabase
2. Verifique as tabelas:
   - `hyperfocus` → Deve ter o hiperfoco criado
   - `tasks` → Deve ter as tarefas criadas
   - `focus_sessions` → Deve ter sessões de foco

---

## 🔍 Troubleshooting

### Erro: "Missing Supabase environment variables"
**Solução:** Verifique se `.env.local` existe e tem as variáveis corretas.

### Erro: "relation 'hyperfocus' does not exist"
**Solução:** Execute o SQL schema (`supabase/sql.sql`) no Supabase.

### Erro: "permission denied for table hyperfocus"
**Solução:** Verifique as RLS policies no Supabase. Pode desabilitar temporariamente para testes:
```sql
ALTER TABLE hyperfocus DISABLE ROW LEVEL SECURITY;
```

### MCP Inspector não conecta
**Solução:**
1. Verifique se o comando está correto
2. Verifique se `run-mcp.sh` tem permissão de execução: `chmod +x run-mcp.sh`
3. Tente executar manualmente: `node mcp-server.mjs` e veja os erros

### Tools não aparecem no Inspector
**Solução:**
1. Verifique os logs do servidor
2. Certifique-se de que o servidor iniciou com sucesso
3. Procure por mensagens de erro no console

---

## 📊 Logs e Debug

### Ver logs do servidor
O servidor MCP imprime logs no `stderr`:
```
=============================================================
🚀 Sati MCP Server (Real Backend)
=============================================================
📦 Version: 1.0.0
🛠️  Tools: 10
🗄️  Database: https://xxxxx.supabase.co
👤 Test User: test-user-1234567890
=============================================================

Available tools:
  1. createHyperfocus
  2. listHyperfocus
  3. getHyperfocus
  4. createTask
  5. updateTaskStatus
  6. breakIntoSubtasks
  7. startFocusTimer
  8. endFocusTimer
  9. analyzeContext
  10. createAlternancy

✅ Server ready! Listening on stdio...
```

### Debug de chamadas
Cada chamada de tool imprime:
```
[INFO] Tool called: createHyperfocus
[DEBUG] Arguments: { "title": "Aprender React", ... }
[SUCCESS] Tool createHyperfocus executed successfully
```

---

## 🎯 Próximos Passos

Depois de testar o MCP Server:

1. **Integrar com Next.js:** Testar via HTTP (`/mcp` route)
2. **Implementar Auth Real:** Substituir `TEST_USER_ID` por auth real
3. **Criar Componentes React:** HyperfocusCard, TaskBreakdown, FocusTimer
4. **Adicionar Testes:** Unit, integration, E2E
5. **Deploy:** Vercel + Supabase

---

## 📚 Referências

- [MCP Specification](https://modelcontextprotocol.io/specification)
- [MCP Inspector](https://github.com/modelcontextprotocol/inspector)
- [Supabase Docs](https://supabase.com/docs)
- [TECH-STACK.md](./docs/TECH-STACK.md)
- [BACKEND-COMPLETO.md](./BACKEND-COMPLETO.md)

---

**Dúvidas?** Consulte `BACKEND-COMPLETO.md` para detalhes da implementação! 🚀

