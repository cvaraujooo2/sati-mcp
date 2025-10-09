# 🧪 Guia de Teste com MCP Inspector

Este guia mostra como testar o servidor MCP do Sati usando o **MCPJam Inspector**.

## 📋 Pré-requisitos

- ✅ Node.js instalado (v18+)
- ✅ Variáveis de ambiente configuradas em `.env.local`
- ✅ Servidor MCP implementado em `mcp-server.mjs`

## 🚀 Método 1: Teste Rápido via STDIO

### Passo 1: Iniciar o MCP Inspector

```bash
npx @mcpjam/inspector@latest
```

O Inspector abrirá automaticamente em `http://localhost:3001`

### Passo 2: Conectar ao Servidor Sati

1. Na interface do Inspector, clique em **"Add Server"**
2. Selecione **"STDIO"** como tipo de transporte
3. Configure:
   - **Command**: `node`
   - **Args**: `/home/ester/Documentos/docs/sati-mcp/mcp-server.mjs`
   - **Name**: `Sati MCP Server`

4. Clique em **"Connect"**

### Passo 3: Verificar Conexão

Você deverá ver:
- ✅ Status: Connected
- ✅ 10 tools disponíveis
- ✅ Server info: `sati-mcp v1.0.0`

## 🧪 Método 2: Teste via Linha de Comando

### Opção A: Usando o script do projeto

```bash
# Iniciar o Inspector apontando para o servidor
npx @mcpjam/inspector@latest node mcp-server.mjs
```

### Opção B: Usando o script helper

```bash
# Dar permissão de execução
chmod +x run-mcp.sh

# Executar
./run-mcp.sh
```

## 🔍 Método 3: Teste com mcp.json (Recomendado)

### Passo 1: Criar arquivo mcp.json

Crie um arquivo `mcp.json` na raiz do projeto:

```json
{
  "mcpServers": {
    "sati": {
      "command": "node",
      "args": ["/caminho/absoluto/para/mcp-server.mjs"],
      "env": {
        "NODE_ENV": "development",
        "NEXT_PUBLIC_SUPABASE_URL": "sua-url-do-supabase",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY": "sua-chave-anon"
      }
    }
  }
}
```

**⚠️ IMPORTANTE**: O Inspector executa o servidor em um processo filho que **não herda** o `.env.local`. Você **DEVE** incluir as variáveis de ambiente do Supabase diretamente no `mcp.json`!

### Passo 2: Iniciar Inspector com config

```bash
npx @mcpjam/inspector@latest --config mcp.json
```

## 🧰 Testando as Tools

### 1. createHyperfocus

**Na aba "Tools" do Inspector:**

```json
{
  "title": "Aprender TypeScript",
  "description": "Dominar TypeScript para desenvolvimento full-stack",
  "color": "blue",
  "estimatedTimeMinutes": 120
}
```

**Resultado Esperado:**
- ✅ Retorna um objeto `hyperfocus_created`
- ✅ Contém `hyperfocusId` (UUID)
- ✅ Inclui componente `HyperfocusCard`

### 2. listHyperfocus

```json
{
  "archived": false,
  "limit": 10
}
```

**Resultado Esperado:**
- ✅ Lista de hyperfocus criados
- ✅ Cada item com `taskCount`

### 3. createTask

```json
{
  "hyperfocusId": "<UUID-do-hyperfocus>",
  "title": "Estudar tipos básicos",
  "description": "string, number, boolean, array",
  "estimatedMinutes": 30
}
```

**Resultado Esperado:**
- ✅ Task criada com sucesso
- ✅ Componente `TaskBreakdown` renderizado

### 4. breakIntoSubtasks

```json
{
  "hyperfocusId": "<UUID-do-hyperfocus>",
  "taskDescription": "Criar um sistema de autenticação completo",
  "numSubtasks": 5,
  "autoCreate": true
}
```

**Resultado Esperado:**
- ✅ 5 subtarefas sugeridas
- ✅ Se `autoCreate: true`, tarefas criadas no banco

### 5. startFocusTimer

```json
{
  "hyperfocusId": "<UUID-do-hyperfocus>",
  "durationMinutes": 25,
  "playSound": true
}
```

**Resultado Esperado:**
- ✅ Sessão de foco iniciada
- ✅ Retorna `sessionId`

### 6. endFocusTimer

```json
{
  "sessionId": "<UUID-da-sessão>",
  "interrupted": false
}
```

## 🎮 Teste com LLM Playground

O Inspector inclui um playground para testar com modelos de LLM:

### Passo 1: Configurar API Key

1. Vá para a aba **"Settings"**
2. Adicione sua chave da OpenAI ou Anthropic
3. Ou use Ollama localmente:

```bash
npx @mcpjam/inspector@latest --ollama llama3.2
```

### Passo 2: Testar Conversação

Na aba **"LLM Playground"**, teste prompts como:

```
Crie um hyperfocus chamado "Aprender React" com estimativa de 2 horas
```

```
Liste todos os meus hyperfocus
```

```
Crie 3 tarefas para o hyperfocus de React
```

## 🐛 Troubleshooting

### Erro: "Missing Supabase environment variables"

**Causa**: O Inspector não carrega automaticamente o `.env.local` quando executa o servidor MCP.

**Solução 1 - Adicionar ao mcp.json (Recomendado):**
```json
{
  "mcpServers": {
    "sati": {
      "command": "node",
      "args": ["/caminho/completo/mcp-server.mjs"],
      "env": {
        "NEXT_PUBLIC_SUPABASE_URL": "https://seu-projeto.supabase.co",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY": "sua-chave-aqui"
      }
    }
  }
}
```

**Solução 2 - Testar servidor standalone:**
```bash
# Verificar se .env.local existe
cat .env.local

# Testar servidor diretamente (carrega .env.local via dotenv)
node mcp-server.mjs
```

### Erro: "Cannot find module '@modelcontextprotocol/sdk'"

**Solução:**
```bash
npm install
```

### Erro: "Database error: relation does not exist"

**Solução:**
```bash
# Executar migrations do Supabase
supabase db push
```

Ou aplicar o SQL manualmente em `supabase/sql.sql`

### Servidor não conecta

**Verificar logs:**
```bash
# O servidor imprime logs em stderr
node mcp-server.mjs 2>&1 | tee mcp-debug.log
```

## 📊 Validação de Sucesso

Seu servidor está funcionando corretamente se:

- ✅ **Handshake**: Conexão estabelecida sem erros
- ✅ **Tools**: Todas as 10 tools aparecem na lista
- ✅ **Schemas**: Cada tool tem `inputSchema` válido
- ✅ **Execution**: Tools retornam dados estruturados
- ✅ **Components**: Metadados de componentes presentes nas respostas
- ✅ **Database**: Dados persistidos no Supabase

## 🔄 Fluxo de Teste Completo

```bash
# 1. Iniciar Inspector
npx @mcpjam/inspector@latest

# 2. Em outra aba, verificar servidor standalone
node mcp-server.mjs

# 3. Testar cada tool individualmente

# 4. Testar fluxo completo:
#    - Criar hyperfocus
#    - Adicionar tasks
#    - Iniciar timer
#    - Finalizar timer
#    - Listar resultados
```

## 📚 Recursos Adicionais

- **Documentação MCP**: https://modelcontextprotocol.io
- **Inspector GitHub**: https://github.com/MCPJam/inspector
- **Discord MCPJam**: https://discord.gg/mcpjam
- **Sati Docs**: `docs/debug/INSTRUCOES-MCP-INSPECTOR.md`

## 🎯 Próximos Passos

Após validar com Inspector:

1. ✅ Testar integração com Claude Desktop
2. ✅ Implementar testes automatizados (evals)
3. ✅ Adicionar mais tools conforme necessário
4. ✅ Otimizar performance das queries
5. ✅ Implementar autenticação real

---

**Última atualização**: 2025-10-09
**Versão do Servidor**: 1.0.0
**Versão do Inspector**: latest

