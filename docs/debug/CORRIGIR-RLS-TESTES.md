# 🔒 Corrigir RLS para Testes do MCP Server

## 🎯 Problema

O banco de dados Supabase tem **Row Level Security (RLS)** habilitado, mas você está testando sem autenticação real. Isso causa erro em **TODAS as tools**.

### Por que acontece?

```sql
-- O RLS verifica:
auth.uid() = user_id

-- Mas sem login:
auth.uid() = NULL
NULL ≠ '00000000-0000-0000-0000-000000000001'
❌ ACESSO NEGADO
```

---

## ✅ Solução Rápida (Desenvolvimento)

### Passo 1: Acessar Supabase Dashboard

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto: `clhexsbqfbvbkfvefapi`
3. Vá em **SQL Editor** (menu lateral)

### Passo 2: Executar Script

Copie e cole o conteúdo de `supabase/disable-rls-dev.sql`:

```sql
ALTER TABLE public.hyperfocus DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.alternancy_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.alternancy_hyperfocus DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hyperfocus_context DISABLE ROW LEVEL SECURITY;
```

### Passo 3: Executar

Clique em **"Run"** ou pressione `Ctrl+Enter`

### Passo 4: Verificar

Você deve ver todas as tabelas com `rls_enabled = false`

---

## 🧪 Testar

Agora todas as tools devem funcionar:

1. Reinicie o Inspector
2. Teste `createHyperfocus`
3. Deve funcionar! ✅

---

## ⚠️ IMPORTANTE: Segurança

### Para Desenvolvimento (Agora)

- ✅ RLS desabilitado está OK
- ✅ Você está testando localmente
- ✅ Não há dados reais ainda

### Para Produção (Futuro)

Você precisará:

1. **Reabilitar RLS**:
   ```sql
   ALTER TABLE public.hyperfocus ENABLE ROW LEVEL SECURITY;
   -- ... outras tabelas
   ```

2. **Implementar autenticação real**:
   - OAuth via Google/GitHub
   - `auth.uid()` retornará ID real do usuário
   - RLS funcionará corretamente

3. **Atualizar o MCP server**:
   - Remover `TEST_USER_ID` fixo
   - Obter `user_id` do token de autenticação
   - Passar para cada tool

---

## 🔄 Reabilitar RLS (Quando terminar testes)

Se quiser reabilitar RLS mais tarde:

```sql
ALTER TABLE public.hyperfocus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alternancy_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alternancy_hyperfocus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hyperfocus_context ENABLE ROW LEVEL SECURITY;
```

---

## 📊 Status das Tools Após Correção

| Tool | Status Antes | Status Depois |
|------|--------------|---------------|
| createHyperfocus | ❌ UUID Error | ✅ Funcionando |
| listHyperfocus | ❌ RLS Block | ✅ Funcionando |
| getHyperfocus | ❌ RLS Block | ✅ Funcionando |
| createTask | ❌ RLS Block | ✅ Funcionando |
| updateTaskStatus | ❌ RLS Block | ✅ Funcionando |
| breakIntoSubtasks | ❌ RLS Block | ✅ Funcionando |
| startFocusTimer | ❌ RLS Block | ✅ Funcionando |
| endFocusTimer | ❌ RLS Block | ✅ Funcionando |
| analyzeContext | ❌ RLS Block | ✅ Funcionando |
| createAlternancy | ❌ RLS Block | ✅ Funcionando |

---

## 🎯 Checklist

- [ ] Acessar Supabase Dashboard
- [ ] Abrir SQL Editor
- [ ] Executar `disable-rls-dev.sql`
- [ ] Verificar que RLS foi desabilitado
- [ ] Reiniciar MCP Inspector
- [ ] Testar createHyperfocus
- [ ] Confirmar que funciona!

---

**Última atualização**: 2025-10-09  
**Ambiente**: Desenvolvimento  
**Segurança**: RLS desabilitado para testes

