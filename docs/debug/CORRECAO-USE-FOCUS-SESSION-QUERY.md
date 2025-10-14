# 🐛 Correção: useFocusSession Query Error

## Data: 13 de outubro de 2025

## 🔍 Problema Identificado

```
Error: column focus_sessions.user_id does not exist
```

### Causa
O hook `useFocusSession` estava tentando buscar sessões ativas usando:
```typescript
.eq('user_id', userId)
```

Porém, a tabela `focus_sessions` **não possui coluna `user_id`**.

### Estrutura Real
```sql
CREATE TABLE focus_sessions (
    id UUID,
    hyperfocus_id UUID REFERENCES hyperfocus(id), -- ✅ Relação via hyperfocus
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    planned_duration_minutes INTEGER,
    actual_duration_minutes INTEGER,
    interrupted BOOLEAN
    -- ❌ NÃO TEM user_id
);
```

A relação com o usuário é **indireta**, através de:
```
focus_sessions → hyperfocus → user_id
```

---

## ✅ Solução Aplicada

### Mudança no Hook

**ANTES (❌ Incorreto):**
```typescript
const { data, error: queryError } = await supabase
  .from('focus_sessions')
  .select('*')
  .eq('user_id', userId)  // ❌ Coluna não existe!
  .is('ended_at', null)
  .order('started_at', { ascending: false })
  .limit(1)
  .maybeSingle();
```

**DEPOIS (✅ Correto):**
```typescript
const { data, error: queryError } = await supabase
  .from('focus_sessions')
  .select(`
    *,
    hyperfocus!inner(user_id)
  `)
  .eq('hyperfocus.user_id', userId)  // ✅ JOIN com hyperfocus!
  .is('ended_at', null)
  .order('started_at', { ascending: false })
  .limit(1)
  .maybeSingle();
```

### Como Funciona

1. **`hyperfocus!inner(user_id)`**: Faz um INNER JOIN com a tabela `hyperfocus` e seleciona apenas `user_id`
2. **`.eq('hyperfocus.user_id', userId)`**: Filtra pelo usuário através da tabela relacionada
3. **Resultado**: Retorna apenas sessões que pertencem a hiperfocos do usuário

---

## 🧪 Validação

### Teste Manual
```bash
npm run dev
# Abrir: http://localhost:3000/test-hooks
# Verificar seção "Sessão de Foco Ativa"
# Não deve mais mostrar erro
```

### Query SQL Equivalente
```sql
SELECT fs.*
FROM focus_sessions fs
INNER JOIN hyperfocus h ON fs.hyperfocus_id = h.id
WHERE h.user_id = 'user-id-here'
  AND fs.ended_at IS NULL
ORDER BY fs.started_at DESC
LIMIT 1;
```

---

## 📝 Lições Aprendidas

### 1. **Sempre Verificar o Schema Real**
Não assumir estrutura de tabelas - consultar:
- `/supabase/schemas/schema-v2-production.sql`
- `/src/types/database.d.ts`

### 2. **JOINs em Supabase**
Sintaxe para JOIN:
```typescript
.select(`
  *,
  related_table!inner(columns)
`)
.eq('related_table.column', value)
```

### 3. **Testing com Dados Reais**
Sempre testar queries com banco real para pegar erros de schema.

---

## 🔄 Impacto

### Arquivos Modificados
- ✅ `/src/lib/hooks/useFocusSession.ts` (linha ~95-105)

### Breaking Changes
- ❌ Nenhum - apenas correção de bug

### Testes Afetados
- ⚠️ Se houver testes mockando `focus_sessions`, precisam ser atualizados para incluir `hyperfocus` no mock

---

## ✅ Status

- [x] Bug identificado
- [x] Correção aplicada
- [x] Sem erros de compilação
- [x] Documentado
- [ ] Testado manualmente (aguardando usuário)

---

## 📚 Referências

- **Schema SQL**: `/supabase/schemas/schema-v2-production.sql` (linhas 150-200)
- **Types**: `/src/types/database.d.ts` (linhas 104-140)
- **Hook**: `/src/lib/hooks/useFocusSession.ts` (linha 89-115)
- **Supabase Joins**: https://supabase.com/docs/reference/javascript/select#query-foreign-tables

---

**Criado:** 13 de outubro de 2025  
**Status:** ✅ Corrigido
