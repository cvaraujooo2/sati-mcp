# 🔧 Troubleshooting - MCP Server Sati

Soluções para problemas comuns ao executar o MCP Server.

---

## ❌ Erro: "Missing Supabase environment variables"

### **Sintoma:**
```json
{
  "method": "notifications/message",
  "params": {
    "level": "error",
    "logger": "stdio",
    "data": {
      "message": "ERROR: Missing Supabase environment variables!"
    }
  }
}
```

### **Causa:**
O `mcp-server.mjs` não consegue carregar as variáveis do `.env.local`.

### **Solução:**

#### 1. Verificar se `.env.local` existe
```bash
cat .env.local
```

Deve mostrar:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

#### 2. Instalar `dotenv`
```bash
npm install dotenv
```

#### 3. Verificar se `mcp-server.mjs` carrega dotenv
No início do arquivo `mcp-server.mjs`, deve ter:
```javascript
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
```

#### 4. Testar manualmente
```bash
node mcp-server.mjs
```

Deve mostrar:
```
[dotenv@17.2.3] injecting env (2) from .env.local
🚀 Sati MCP Server (Real Backend)
```

---

## ❌ Erro: "relation 'hyperfocus' does not exist"

### **Sintoma:**
Ao chamar uma tool, recebe erro do PostgreSQL:
```
relation "public.hyperfocus" does not exist
```

### **Causa:**
O schema SQL não foi executado no Supabase.

### **Solução:**

#### 1. Abrir Supabase SQL Editor
- Acesse https://supabase.com/dashboard
- Abra seu projeto
- Vá em **SQL Editor**

#### 2. Executar o schema
- Copie todo o conteúdo de `supabase/sql.sql`
- Cole no SQL Editor
- Clique em **Run**

#### 3. Verificar tabelas criadas
- Vá em **Table Editor**
- Deve ver as tabelas:
  - ✅ hyperfocus
  - ✅ tasks
  - ✅ focus_sessions
  - ✅ alternancy_sessions
  - ✅ alternancy_hyperfocus
  - ✅ hyperfocus_context

---

## ❌ Erro: "permission denied for table hyperfocus"

### **Sintoma:**
```
permission denied for table hyperfocus
```

### **Causa:**
RLS (Row Level Security) está bloqueando acesso sem autenticação.

### **Solução (Temporária para Testes):**

#### Desabilitar RLS temporariamente:
```sql
ALTER TABLE hyperfocus DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE focus_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE alternancy_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE alternancy_hyperfocus DISABLE ROW LEVEL SECURITY;
ALTER TABLE hyperfocus_context DISABLE ROW LEVEL SECURITY;
```

**⚠️ ATENÇÃO:** Isso remove a segurança! Use apenas em ambiente de desenvolvimento.

---

## ❌ Inspector não conecta ao servidor

### **Sintoma:**
Inspector fica "Loading..." infinitamente ou mostra erro de conexão.

### **Causa:**
Servidor MCP não está iniciando corretamente.

### **Solução:**

#### 1. Testar comando manualmente
```bash
cd /home/ester/Documentos/docs/sati-mcp
./run-mcp.sh
```

Ou:
```bash
node mcp-server.mjs
```

#### 2. Verificar erros
Se aparecer erro, corrigir antes de usar o Inspector.

#### 3. Verificar permissões do run-mcp.sh
```bash
chmod +x run-mcp.sh
```

#### 4. Usar caminho absoluto no Inspector
No MCP Inspector, usar caminho completo:
```
/home/ester/Documentos/docs/sati-mcp/run-mcp.sh
```

---

## ❌ Tools não aparecem no Inspector

### **Sintoma:**
Inspector conecta mas não mostra nenhuma tool na sidebar.

### **Causa:**
Servidor não está retornando a lista de tools.

### **Solução:**

#### 1. Verificar logs do servidor
Procurar por mensagens de erro no terminal do Inspector.

#### 2. Testar listar tools manualmente
No Inspector, na aba **Raw**, enviar:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}
```

Deve retornar lista com 10 tools.

#### 3. Verificar versão do SDK
```bash
npm list @modelcontextprotocol/sdk
```

Deve ser v1.19.1 ou superior.

---

## ❌ Node.js version warning

### **Sintoma:**
```
⚠️  Node.js 18 and below are deprecated
```

### **Causa:**
Você está usando Node.js 18, mas Supabase recomenda 20+.

### **Solução (Opcional):**

#### Atualizar Node.js:
```bash
# Usando nvm (recomendado)
nvm install 20
nvm use 20

# Verificar versão
node --version
```

**Nota:** Isso é um warning, não um erro. O servidor funciona no Node.js 18.

---

## ❌ Erro ao criar hiperfoco: UUID inválido

### **Sintoma:**
```
invalid input syntax for type uuid
```

### **Causa:**
O `TEST_USER_ID` não é um UUID válido.

### **Solução:**

#### Opção 1: Usar UUID fixo (temporário)
Editar `mcp-server.mjs`:
```javascript
// Mudar de:
const TEST_USER_ID = 'test-user-' + Date.now();

// Para:
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';
```

#### Opção 2: Desabilitar RLS (ver solução acima)

---

## ❌ Dados não aparecem no Supabase

### **Sintoma:**
Tool retorna sucesso mas não vejo dados no Table Editor.

### **Causa Possível 1:** RLS está filtrando por user_id
**Solução:** Desabilitar RLS temporariamente (ver acima).

### **Causa Possível 2:** Refresh necessário
**Solução:** Atualizar página do Table Editor (F5).

### **Causa Possível 3:** Filtros ativos
**Solução:** Remover filtros no Table Editor.

---

## 🔍 Debug Avançado

### **Ver logs detalhados do servidor:**
```bash
LOG_LEVEL=debug node mcp-server.mjs
```

### **Ver variáveis de ambiente carregadas:**
```bash
node -e "import('dotenv').then(d => {d.default.config({path:'.env.local'}); console.log(process.env)})"
```

### **Testar conexão Supabase:**
```bash
node -e "import('dotenv').then(d => d.default.config({path:'.env.local'})); import('@supabase/supabase-js').then(s => {const c = s.createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY); c.from('hyperfocus').select('count').then(r => console.log('✅ Connected!', r))})"
```

---

## 📞 Ainda com Problemas?

Se nenhuma solução acima funcionou:

1. **Coletar informações:**
   - Output completo do `node mcp-server.mjs`
   - Logs do MCP Inspector
   - Versão do Node.js: `node --version`
   - Versão do npm: `npm --version`

2. **Verificar arquivos:**
   - `.env.local` existe e tem conteúdo?
   - `supabase/sql.sql` foi executado?
   - `dotenv` está instalado?

3. **Testar cada componente:**
   - ✅ Supabase: Acessar via browser
   - ✅ Node.js: `node --version`
   - ✅ Variáveis: `cat .env.local`
   - ✅ Servidor: `node mcp-server.mjs`
   - ✅ Inspector: `npm run mcp:inspect`

---

## ✅ Checklist de Validação

Antes de reportar um bug, verifique:

- [ ] `.env.local` existe e tem `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `dotenv` está instalado (`npm list dotenv`)
- [ ] Schema SQL foi executado no Supabase
- [ ] Tabelas existem no Supabase Table Editor
- [ ] `node mcp-server.mjs` inicia sem erros
- [ ] Servidor mostra "🚀 Sati MCP Server (Real Backend)"
- [ ] Servidor lista 10 tools disponíveis
- [ ] MCP Inspector conecta com sucesso
- [ ] Tools aparecem na sidebar do Inspector

---

**Última atualização:** 2025-01-09

