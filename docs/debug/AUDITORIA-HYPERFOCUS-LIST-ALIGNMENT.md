# 🔍 Auditoria: Alinhamento Backend ↔ Frontend - HyperfocusList

**Data:** 12 de outubro de 2025  
**Componente:** `HyperfocusList.tsx`  
**Tool Backend:** `listHyperfocus.ts`  
**Status:** 🔴 **CRÍTICO - DESALINHAMENTO DETECTADO**

---

## 📊 Resumo Executivo

O componente `HyperfocusList` espera uma estrutura de dados diferente da que o backend `listHyperfocus` está retornando, causando:
- ❌ Dados não sendo exibidos corretamente
- ❌ `completedCount` undefined (erro na barra de progresso)
- ❌ `tasks` array não está sendo retornado
- ❌ Diferença entre nomes de propriedades (camelCase vs. API)

---

## 🔴 Problemas Identificados

### 1. **Propriedade `completedCount` Faltando** (CRÍTICO)

**Frontend espera:**
```typescript
interface Hyperfocus {
  completedCount: number; // ❌ NÃO EXISTE no backend
  taskCount: number;
}

// Usado em:
const progressPercent = Math.round((hyperfocus.completedCount / hyperfocus.taskCount) * 100);
```

**Backend retorna:**
```typescript
{
  taskCount: count || 0,  // ✅ Existe
  // completedCount: ???  // ❌ NÃO É RETORNADO
}
```

**Impacto:**
- `progressPercent` = `NaN` (divisão por undefined)
- Barra de progresso não funciona
- Contador `{completedCount}/{taskCount}` mostra `undefined/X`

---

### 2. **Array `tasks` Não Retornado** (ALTO)

**Frontend espera:**
```typescript
interface Hyperfocus {
  tasks?: Task[]; // Array de tarefas
}

// Usado para expandir e mostrar tarefas:
{isExpanded && hyperfocus.tasks && hyperfocus.tasks.length > 0 && (
  <div>
    {hyperfocus.tasks.map((task) => ...)}
  </div>
)}
```

**Backend retorna:**
```typescript
{
  taskCount: count || 0,  // Apenas a contagem, não as tarefas
  // tasks: []            // ❌ NÃO RETORNA O ARRAY
}
```

**Impacto:**
- Expansão do hiperfoco não mostra tarefas (sempre vazio)
- Usuário não consegue ver/marcar tarefas
- Botão "Criar Tarefas" aparece mesmo com tarefas existentes

---

### 3. **Interface de Dados do Backend Inconsistente** (MÉDIO)

**Frontend espera:**
```typescript
interface HyperfocusListOutput {
  hyperfocuses: Hyperfocus[]; // ❌ Nome diferente
  total: number;
}
```

**Backend retorna:**
```typescript
{
  component: {
    props: {
      hyperfocusList: [...],  // ✅ Mas chama "hyperfocusList", não "hyperfocuses"
      showArchived: boolean
    }
  }
}
```

**Hook extrai assim:**
```typescript
const toolOutput = useToolOutput<HyperfocusListOutput>();
const hyperfocuses = toolOutput?.hyperfocuses ?? []; // ❌ Acessa "hyperfocuses"
const total = toolOutput?.total ?? 0;                 // ❌ "total" não existe
```

**Impacto:**
- `hyperfocuses` = `undefined` (array vazio exibido)
- `total` = `0` sempre (contador incorreto)
- "Nenhum hiperfoco criado ainda" mesmo com dados

---

### 4. **Query Não Busca `completedCount`** (CRÍTICO)

**Query atual:**
```typescript
.select(`
  id,
  title,
  description,
  color,
  estimated_time_minutes,
  created_at,
  updated_at,
  archived
`)
// ❌ NÃO BUSCA tarefas completadas
```

**Query necessária:**
```typescript
// Precisa contar tarefas completadas:
const { count: completedCount } = await supabase
  .from('tasks')
  .select('id', { count: 'exact', head: true })
  .eq('hyperfocus_id', hf.id)
  .eq('completed', true); // ← ADICIONAR ESTE FILTRO
```

---

### 5. **Array de Tarefas Não Carregado** (ALTO)

**Código atual:**
```typescript
// Busca apenas COUNT, não as tarefas
const { count, error: countError } = await supabase
  .from('tasks')
  .select('id', { count: 'exact', head: true }) // ← head: true = não retorna dados
  .eq('hyperfocus_id', hf.id);
```

**Necessário:**
```typescript
// Buscar as tarefas completas
const { data: tasks } = await supabase
  .from('tasks')
  .select('id, title, completed, estimated_minutes')
  .eq('hyperfocus_id', hf.id)
  .order('created_at', { ascending: false })
  .limit(10); // Limitar para performance
```

---

## ✅ Correções Necessárias

### Correção 1: Estrutura de Retorno do Backend

**Arquivo:** `src/lib/mcp/tools/listHyperfocus.ts`

**Mudar:**
```typescript
return {
  component: {
    props: {
      hyperfocusList: hyperfocusWithTasks, // ❌ Nome errado
      showArchived: validated.archived,
    }
  }
};
```

**Para:**
```typescript
return {
  component: {
    props: {
      hyperfocuses: hyperfocusWithTasks,    // ✅ Nome correto
      total: hyperfocusWithTasks.length,    // ✅ Adicionar total
      showArchived: validated.archived,
    }
  }
};
```

---

### Correção 2: Buscar `completedCount` e `tasks`

**Arquivo:** `src/lib/mcp/tools/listHyperfocus.ts`  
**Linhas:** ~68-90

**Código atual:**
```typescript
const hyperfocusWithTasks = await Promise.all(
  (hyperfocusList || []).map(async (hf) => {
    const { count, error: countError } = await supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('hyperfocus_id', hf.id);

    return {
      id: hf.id,
      title: hf.title,
      description: hf.description,
      color: hf.color,
      estimatedTimeMinutes: hf.estimated_time_minutes,
      taskCount: count || 0,  // ✅ OK
      // ❌ FALTAM: completedCount, tasks
    };
  })
);
```

**Código correto:**
```typescript
const hyperfocusWithTasks = await Promise.all(
  (hyperfocusList || []).map(async (hf) => {
    // 1. Contar total de tarefas
    const { count: totalTasks } = await supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('hyperfocus_id', hf.id);

    // 2. Contar tarefas completadas
    const { count: completedTasks } = await supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('hyperfocus_id', hf.id)
      .eq('completed', true);

    // 3. Buscar tarefas (limitado para performance)
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, completed, estimated_minutes')
      .eq('hyperfocus_id', hf.id)
      .order('created_at', { ascending: false })
      .limit(20);

    return {
      id: hf.id,
      title: hf.title,
      description: hf.description,
      color: hf.color,
      estimatedTimeMinutes: hf.estimated_time_minutes,
      taskCount: totalTasks || 0,
      completedCount: completedTasks || 0,  // ✅ ADICIONADO
      tasks: tasks || [],                     // ✅ ADICIONADO
      createdAt: hf.created_at,
      updatedAt: hf.updated_at,
      archived: hf.archived,
    };
  })
);
```

---

### Correção 3: Ajustar Hook ou Props

**Opção A:** Ajustar o hook `useToolOutput`

Se o hook extrai automaticamente `component.props`, então o backend já deveria estar retornando correto (ver Correção 1).

**Opção B:** Ajustar o componente

Se não conseguimos mudar o backend, ajustar o componente:

```typescript
// Em HyperfocusList.tsx
const toolOutput = useToolOutput<any>();

// Ajustar extração:
const hyperfocuses = toolOutput?.hyperfocusList || toolOutput?.hyperfocuses || [];
const total = toolOutput?.total ?? hyperfocuses.length;
```

---

## 🔍 Verificação da Query no Supabase

### Schema Esperado da Tabela `tasks`

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  hyperfocus_id UUID REFERENCES hyperfocus(id),
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  estimated_minutes INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);
```

**Verificar:**
1. Coluna `completed` existe?
2. Coluna `estimated_minutes` existe?
3. RLS está configurado corretamente?

---

## 📋 Checklist de Implementação

### Backend (`listHyperfocus.ts`)
- [ ] Buscar `completedCount` com `.eq('completed', true)`
- [ ] Buscar array de `tasks` (não apenas count)
- [ ] Retornar `tasks` no objeto de cada hiperfoco
- [ ] Mudar `hyperfocusList` para `hyperfocuses` no retorno
- [ ] Adicionar `total` no retorno
- [ ] Limitar tasks por hiperfoco (performance)
- [ ] Adicionar testes para a query

### Frontend (`HyperfocusList.tsx`)
- [ ] Verificar se `useToolOutput` extrai corretamente
- [ ] Adicionar fallback para `completedCount` (0 se undefined)
- [ ] Adicionar loading state
- [ ] Adicionar error state
- [ ] Testar com 0 tarefas
- [ ] Testar com tasks undefined
- [ ] Testar com dados mock

### Testes
- [ ] Testar com 0 hiperfocos
- [ ] Testar com hiperfocos sem tarefas
- [ ] Testar com hiperfocos com tarefas
- [ ] Testar expansão/colapso
- [ ] Testar barra de progresso com valores edge case
- [ ] Testar filtros (archived, color)

---

## 🚨 Impacto no Usuário

**Comportamento Atual (RUIM):**
1. Usuário cria hiperfoco
2. Tool `listHyperfocus` é chamado
3. Componente renderiza "Nenhum hiperfoco criado ainda"
4. Ou: Mostra hiperfocos mas sem progresso correto
5. Expansão não mostra tarefas

**Comportamento Esperado (BOM):**
1. Usuário cria hiperfoco
2. Tool retorna dados completos
3. Componente renderiza lista corretamente
4. Progresso mostra X/Y tarefas completadas
5. Expansão mostra lista de tarefas clicáveis

---

## 📚 Arquivos Relacionados

1. `src/lib/mcp/tools/listHyperfocus.ts` - Backend tool
2. `src/components/HyperfocusList.tsx` - Frontend component
3. `src/components/hooks/useOpenAi.ts` - Hook que extrai dados
4. `supabase/schemas/hyperfocus.sql` - Schema da tabela
5. `supabase/schemas/tasks.sql` - Schema da tabela tasks

---

## 🔗 Referências

- [ANALISE-TOOLS-ALIGNMENT.md](./ANALISE-TOOLS-ALIGNMENT.md)
- [IMPLEMENTACOES-TOOLS-ALIGNMENT.md](./IMPLEMENTACOES-TOOLS-ALIGNMENT.md)
- [MCP-TOOLS-IMPLEMENTATION-SUMMARY.md](./MCP-TOOLS-IMPLEMENTATION-SUMMARY.md)

---

**Prioridade:** 🔴 CRÍTICA  
**Tempo Estimado:** 2-3 horas  
**Complexidade:** Média  
**Risco:** Baixo (apenas queries e estrutura de dados)
