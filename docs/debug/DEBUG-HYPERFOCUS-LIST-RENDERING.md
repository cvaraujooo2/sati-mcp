# 🐛 DEBUG: HyperfocusList Não Renderizando Dados

**Data:** 12 de outubro de 2025  
**Status:** 🔧 EM INVESTIGAÇÃO  
**Problema:** Componente mostra "Nenhum hiperfoco criado ainda" mesmo com dados existentes

---

## 🔍 Correção Implementada

### Problema Identificado

O componente `HyperfocusList` estava tentando obter dados através de `useToolOutput()` (que lê de `window.openai.toolOutput`), mas o `SATIComponentRenderer` passa os dados como **props diretas**:

```typescript
// Em SATIComponentRenderer
<Component {...componentProps} />
```

### Solução Aplicada

Modificado `HyperfocusList` para aceitar props:

```typescript
// ANTES
export function HyperfocusList() {
  const toolOutput = useToolOutput<HyperfocusListOutput>();
  const hyperfocuses = toolOutput?.hyperfocuses ?? [];
  //...
}

// DEPOIS
export function HyperfocusList(props?: HyperfocusListOutput) {
  const toolOutput = useToolOutput<HyperfocusListOutput>();
  const data = props || toolOutput; // Props primeiro!
  const hyperfocuses = data?.hyperfocuses ?? [];
  //...
}
```

### Logs de Debug Adicionados

```typescript
console.log('[HyperfocusList] Props:', props);
console.log('[HyperfocusList] ToolOutput:', toolOutput);
console.log('[HyperfocusList] Data:', data);
console.log('[HyperfocusList] Hyperfocuses:', hyperfocuses);
console.log('[HyperfocusList] Total:', total);
```

---

## 🧪 Como Testar Agora

### 1. Limpar Cache e Reiniciar

```bash
# No terminal
rm -rf .next
npm run dev
```

### 2. Fazer Login

Acesse: `http://localhost:3000/login`

### 3. Enviar Comando no Chat

```
Mostre meus hiperfocos
```

### 4. Verificar DevTools Console

**Você deve ver logs assim:**

```javascript
[HyperfocusList] Props: {
  hyperfocuses: [
    {
      id: "uuid-1",
      title: "Estudar Música Japonesa",
      description: "Explorar diferentes gêneros...",
      color: "blue",
      taskCount: 0,
      completedCount: 0,
      tasks: []
    },
    {
      id: "uuid-2",
      title: "Estudar React com TypeScript",
      //...
    }
  ],
  total: 2,
  showArchived: false
}

[HyperfocusList] Hyperfocuses: Array(2)
[HyperfocusList] Total: 2
```

---

## 🔍 Cenários de Debug

### Cenário 1: Props está null/undefined

**Log esperado:**
```javascript
[HyperfocusList] Props: undefined
[HyperfocusList] ToolOutput: null
[HyperfocusList] Hyperfocuses: []
```

**Problema:** Dados não estão chegando do backend  
**Solução:** Verificar logs do servidor para ver se `listHyperfocus` está retornando dados

---

### Cenário 2: Props tem dados mas está vazio

**Log esperado:**
```javascript
[HyperfocusList] Props: { hyperfocuses: [], total: 0 }
```

**Problema:** Backend retornando vazio (query não encontrando dados)  
**Verificar:**
- RLS está bloqueando? (tabela `hyperfocus` tem RLS habilitado?)
- `user_id` correto?
- Hiperfocos realmente existem no banco?

**Teste no Supabase SQL Editor:**
```sql
-- Ver se hiperfocos existem
SELECT * FROM hyperfocus;

-- Ver se RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'hyperfocus';

-- Desabilitar RLS temporariamente para teste
ALTER TABLE hyperfocus DISABLE ROW LEVEL SECURITY;
```

---

### Cenário 3: Props tem dados mas estrutura errada

**Log esperado:**
```javascript
[HyperfocusList] Props: {
  hyperfocusList: [...], // ❌ Nome errado!
  total: 2
}
```

**Problema:** Backend retornando `hyperfocusList` em vez de `hyperfocuses`  
**Já corrigido em:** `src/lib/mcp/tools/listHyperfocus.ts`

---

### Cenário 4: Dados corretos mas componente não re-renderiza

**Log esperado:**
```javascript
[HyperfocusList] Props: { hyperfocuses: [Array(2)], total: 2 }
// Mas UI ainda mostra "Nenhum hiperfoco criado ainda"
```

**Problema:** React não detectando mudança  
**Solução:** Forçar re-render ou verificar se há erro de renderização

---

## 🛠️ Verificações Adicionais

### 1. Verificar Estrutura do Resultado no Backend

**Arquivo:** `src/lib/mcp/tools/listHyperfocus.ts`

**Deve retornar:**
```typescript
return {
  component: {
    type: 'inline',
    name: 'HyperfocusList',
    props: {
      hyperfocuses: hyperfocusWithTasks, // ✅
      total: hyperfocusWithTasks.length,  // ✅
      showArchived: validated.archived
    }
  }
}
```

### 2. Verificar COMPONENT_MAP

**Arquivo:** `src/components/chat/Message.tsx`

**Deve ter:**
```typescript
const COMPONENT_MAP: Record<string, React.ComponentType<any>> = {
  HyperfocusList, // ✅ Deve estar importado e mapeado
  // ...
}
```

### 3. Verificar Logs do Servidor

**Terminal do servidor deve mostrar:**
```
[Tool] listHyperfocus completed
[Tool] Hiperfocos listados com sucesso
[Tool] count: 2, archived: false
```

---

## 📊 Fluxo de Dados Completo

```
1. User: "Mostre meus hiperfocos"
   ↓
2. Chat API recebe mensagem
   ↓
3. LLM decide usar tool: listHyperfocus
   ↓
4. Tool Handler executado:
   const supabase = await createClient()
   query.from('hyperfocus')...
   ↓
5. Backend retorna:
   {
     component: {
       name: 'HyperfocusList',
       props: { hyperfocuses: [...], total: 2 }
     }
   }
   ↓
6. SSE stream envia para frontend:
   type: 'tool_result'
   result: { component: {...} }
   ↓
7. Frontend processa:
   actualResult = toolResult?.result
   componentName = actualResult?.component?.name  // "HyperfocusList"
   componentProps = actualResult?.component?.props // { hyperfocuses: [...] }
   ↓
8. SATIComponentRenderer renderiza:
   <HyperfocusList {...componentProps} />
   ↓
9. HyperfocusList recebe props:
   props = { hyperfocuses: [...], total: 2 }
   ↓
10. Componente renderiza lista ✅
```

---

## 🚨 Possíveis Causas se Ainda Não Funcionar

### 1. RLS Bloqueando Dados

```sql
-- Verificar e desabilitar temporariamente
ALTER TABLE hyperfocus DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
```

### 2. Dados Não Existem

```sql
-- Verificar dados reais
SELECT id, title, user_id, created_at 
FROM hyperfocus 
ORDER BY created_at DESC;
```

### 3. Cliente Supabase Ainda Errado

Verificar se TODAS as tools realmente foram corrigidas:
```bash
grep -r "from '@/lib/supabase/client'" src/lib/mcp/tools/
# Não deve retornar nada!
```

### 4. Cache do Next.js

```bash
rm -rf .next
npm run dev
```

### 5. Session do Supabase Expirada

- Fazer logout
- Fazer login novamente
- Testar

---

## ✅ Checklist de Validação

- [ ] Logs aparecem no console com dados
- [ ] Props não está undefined
- [ ] Props.hyperfocuses é um array com itens
- [ ] Props.total > 0
- [ ] Componente re-renderiza
- [ ] Lista aparece na UI
- [ ] Dados corretos mostrados

---

## 🎯 Próximo Passo

**ABRA O DEVTOOLS CONSOLE** e envie no chat:
```
Mostre meus hiperfocos
```

**Me envie os logs que aparecerem começando com `[HyperfocusList]`!**

Isso vai me dizer exatamente onde está o problema. 🔍
