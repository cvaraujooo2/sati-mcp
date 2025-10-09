# 🚀 Quick Start - MCP Inspector

Guia rápido para testar o servidor MCP do Sati com o Inspector.

## ⚡ Início Rápido (3 passos)

### 1️⃣ Verificar mcp.json

O arquivo `mcp.json` já está configurado com as variáveis de ambiente necessárias.

```bash
cat mcp.json
```

### 2️⃣ Iniciar Inspector

```bash
npx @mcpjam/inspector@latest --config mcp.json
```

### 3️⃣ Abrir no navegador

Acesse: **http://localhost:3000**

---

## ✅ Checklist de Conexão

Quando o Inspector abrir, você deve ver:

- ✅ Servidor "sati" na lista
- ✅ Status: **Connected** (verde)
- ✅ **10 tools** disponíveis
- ✅ Server info: `sati-mcp v1.0.0`

---

## 🧪 Teste Rápido das Tools

### 1. createHyperfocus

Na aba **"Tools"**, selecione `createHyperfocus` e teste:

```json
{
  "title": "Teste MCP Inspector",
  "description": "Validando integração do servidor",
  "color": "blue",
  "estimatedTimeMinutes": 60
}
```

**Resultado esperado**: Retorna um objeto com `hyperfocusId` (UUID)

### 2. listHyperfocus

```json
{
  "archived": false,
  "limit": 10
}
```

**Resultado esperado**: Lista com o hyperfocus criado acima

### 3. createTask

Use o `hyperfocusId` retornado no passo 1:

```json
{
  "hyperfocusId": "cole-o-uuid-aqui",
  "title": "Primeira tarefa de teste",
  "estimatedMinutes": 15
}
```

**Resultado esperado**: Task criada + componente `TaskBreakdown`

---

## 🎮 Teste com LLM (Opcional)

### Opção 1: Com Ollama (Local)

```bash
# Parar Inspector atual
# Ctrl+C no terminal

# Iniciar com Ollama
npx @mcpjam/inspector@latest --config mcp.json --ollama llama3.2
```

### Opção 2: Com OpenAI/Anthropic

1. Vá em **Settings** no Inspector
2. Adicione sua API key
3. Use a aba **LLM Playground**

Teste prompts como:
- "Crie um hyperfocus chamado 'Estudar Python'"
- "Liste meus hyperfocus"
- "Adicione 3 tarefas ao hyperfocus de Python"

---

## 🐛 Problemas Comuns

### ❌ Erro: "Connection closed"

**Causa**: Variáveis de ambiente não configuradas no `mcp.json`

**Solução**: Verifique se o `mcp.json` contém:
```json
"env": {
  "NEXT_PUBLIC_SUPABASE_URL": "...",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY": "..."
}
```

### ❌ Erro: "Port 3000 is already in use"

**Solução**:
```bash
# Liberar porta
lsof -ti:3000 | xargs kill -9

# Ou usar porta diferente
npx @mcpjam/inspector@latest --config mcp.json --port 4000
```

### ❌ Servidor não aparece conectado

**Solução**:
```bash
# Testar servidor standalone primeiro
node mcp-server.mjs

# Deve mostrar:
# ✅ Server ready! Listening on stdio...
```

---

## 📊 Validação de Sucesso

Seu setup está correto se:

- ✅ Inspector abre sem erros
- ✅ Servidor "sati" conecta automaticamente
- ✅ 10 tools aparecem na lista
- ✅ `createHyperfocus` retorna um UUID válido
- ✅ Dados aparecem no Supabase

---

## 🔄 Reiniciar Inspector

Se fizer mudanças no servidor:

```bash
# 1. Parar Inspector (Ctrl+C no terminal)

# 2. Reiniciar
npx @mcpjam/inspector@latest --config mcp.json
```

O Inspector recarrega automaticamente o servidor a cada conexão.

---

## 📚 Documentação Completa

Para mais detalhes, consulte:
- `docs/debug/TESTE-MCP-INSPECTOR.md` - Guia completo
- `docs/debug/TROUBLESHOOTING.md` - Solução de problemas
- `docs/core/PRD-MCP-SATI.md` - Especificação do projeto

---

## 🎯 Próximos Passos

Após validar com Inspector:

1. ✅ Testar todas as 10 tools
2. ✅ Validar persistência no Supabase
3. ✅ Testar fluxos completos (criar → listar → atualizar)
4. ✅ Integrar com Claude Desktop (opcional)
5. ✅ Implementar testes automatizados

---

**Última atualização**: 2025-10-09  
**Versão**: 1.0.0  
**Inspector**: @mcpjam/inspector@latest
