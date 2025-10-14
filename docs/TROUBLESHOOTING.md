# 🔧 Troubleshooting Guide - Resolução Rápida de Problemas

> **Guia de solução de problemas para desenvolvedores**  
> **Use quando encontrar erros durante implementação**

---

## 🚨 PROBLEMAS COMUNS E SOLUÇÕES

### 1. Erro: "Cannot read property 'id' of undefined"

#### 🔴 Erro Completo
```
TypeError: Cannot read property 'id' of undefined
  at useHyperfocus (useHyperfocus.ts:45)
```

#### 🔍 Causa
O objeto `user` está `undefined` ou `null`.

#### ✅ Solução
```typescript
// ❌ ERRADO
const { id } = user;
const hook = useHyperfocus(id);

// ✅ CORRETO - Opção 1: Optional chaining
const hook = useHyperfocus(user?.id || '');

// ✅ CORRETO - Opção 2: Early return
if (!user?.id) {
  return <div>Por favor, faça login</div>;
}
const hook = useHyperfocus(user.id);

// ✅ CORRETO - Opção 3: Default value
const userId = user?.id ?? 'anonymous';
const hook = useHyperfocus(userId);
```

---

### 2. Erro: "Hooks can only be called inside the body of a function component"

#### 🔴 Erro Completo
```
Error: Invalid hook call. Hooks can only be called inside the body of a function component.
```

#### 🔍 Causas Possíveis

**Causa A: Hook dentro de condição**
```typescript
// ❌ ERRADO
if (userId) {
  const { data } = useHyperfocus(userId);
}

// ✅ CORRETO
const { data } = useHyperfocus(userId || '');
```

**Causa B: Hook dentro de loop**
```typescript
// ❌ ERRADO
hyperfocusList.map(h => {
  const { deleteHyperfocus } = useHyperfocus(userId);
  return <div onClick={() => deleteHyperfocus(h.id)} />;
});

// ✅ CORRETO - Hook fora do loop
const { deleteHyperfocus } = useHyperfocus(userId);
return hyperfocusList.map(h => (
  <div onClick={() => deleteHyperfocus(h.id)} />
));
```

**Causa C: Hook em função regular (não component)**
```typescript
// ❌ ERRADO
function deleteItem(id) {
  const { deleteHyperfocus } = useHyperfocus(userId);
  deleteHyperfocus(id);
}

// ✅ CORRETO - Hook no componente
function MyComponent() {
  const { deleteHyperfocus } = useHyperfocus(userId);
  
  const handleDelete = (id) => {
    deleteHyperfocus(id);
  };
  
  return <button onClick={() => handleDelete(id)}>Delete</button>;
}
```

---

### 3. Erro: "setState on unmounted component"

#### 🔴 Erro Completo
```
Warning: Can't perform a React state update on an unmounted component.
```

#### 🔍 Causa
Componente foi desmontado mas ainda tentou atualizar estado.

#### ✅ Solução
```typescript
// ❌ ERRADO
useEffect(() => {
  async function loadData() {
    const data = await fetchHyperfocus();
    setHyperfocus(data); // Pode ser chamado após unmount
  }
  loadData();
}, []);

// ✅ CORRETO - Adicionar cleanup
useEffect(() => {
  let isMounted = true;
  
  async function loadData() {
    const data = await fetchHyperfocus();
    
    // Só atualiza se ainda montado
    if (isMounted) {
      setHyperfocus(data);
    }
  }
  
  loadData();
  
  // Cleanup function
  return () => {
    isMounted = false;
  };
}, []);
```

---

### 4. Erro: "createClient is not a function"

#### 🔴 Erro Completo
```
TypeError: createClient is not a function
  at useHyperfocus (useHyperfocus.ts:23)
```

#### 🔍 Causa
Import incorreto do Supabase client.

#### ✅ Solução
```typescript
// ❌ ERRADO - Import default
import createClient from '@/lib/supabase/client';

// ❌ ERRADO - Import named mas arquivo exporta default
import { createClient } from '@/lib/supabase/client';
// Arquivo: export default function createClient() {...}

// ✅ CORRETO - Verificar o arquivo client.ts
// Se arquivo tem: export function createClient() {...}
import { createClient } from '@/lib/supabase/client';

// Se arquivo tem: export default function createClient() {...}
import createClient from '@/lib/supabase/client';
```

#### 🔧 Verificar arquivo `/src/lib/supabase/client.ts`
```typescript
// Deve ter uma dessas estruturas:

// Opção A: Named export
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Opção B: Default export
export default function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

---

### 5. Erro: "HyperfocusService is not a constructor"

#### 🔴 Erro Completo
```
TypeError: HyperfocusService is not a constructor
  at useHyperfocus (useHyperfocus.ts:30)
```

#### 🔍 Causa
Import incorreto do Service.

#### ✅ Solução
```typescript
// ❌ ERRADO
import HyperfocusService from '@/lib/services/hyperfocus.service';

// ✅ CORRETO
import { HyperfocusService } from '@/lib/services/hyperfocus.service';

// Uso correto
const service = new HyperfocusService(supabase);
```

#### 🔧 Verificar arquivo do Service
```typescript
// Arquivo deve exportar como:
export class HyperfocusService {
  constructor(private client: SupabaseClient<Database>) {}
  // ...
}

// ❌ NÃO usar default export para classes
// export default class HyperfocusService {...}
```

---

### 6. Loading Infinito

#### 🔴 Sintoma
Loading spinner nunca desaparece, componente fica travado.

#### 🔍 Possíveis Causas

**Causa A: Falta `finally` no try-catch**
```typescript
// ❌ ERRADO
const loadData = async () => {
  setLoading(true);
  try {
    const data = await service.list();
    setData(data);
  } catch (err) {
    setError(err.message);
  }
  // setLoading(false); ← Nunca executa se houver erro!
};

// ✅ CORRETO
const loadData = async () => {
  setLoading(true);
  try {
    const data = await service.list();
    setData(data);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false); // ← SEMPRE executa
  }
};
```

**Causa B: useEffect sem dependencies**
```typescript
// ❌ ERRADO - Loop infinito
useEffect(() => {
  loadHyperfocusList(); // Chama função que atualiza estado
}); // ← Sem array de dependências = executa em todo render

// ✅ CORRETO
useEffect(() => {
  loadHyperfocusList();
}, []); // ← Array vazio = executa só uma vez
```

---

### 7. Erro: "Row Level Security Policy Violated"

#### 🔴 Erro Completo
```
PostgrestError: new row violates row-level security policy for table "hyperfocus"
```

#### 🔍 Causa
RLS (Row Level Security) está bloqueando a operação.

#### ✅ Soluções

**Opção 1: Verificar autenticação**
```typescript
// Verificar se usuário está autenticado
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user); // Deve retornar usuário

if (!user) {
  // Redirecionar para login
  router.push('/login');
}
```

**Opção 2: Verificar políticas RLS no Supabase**
```sql
-- No Supabase Dashboard > SQL Editor
-- Verificar políticas existentes
SELECT * FROM pg_policies WHERE tablename = 'hyperfocus';

-- Criar política de INSERT se não existir
CREATE POLICY "Users can insert their own hyperfocus"
  ON hyperfocus
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Criar política de SELECT se não existir
CREATE POLICY "Users can view their own hyperfocus"
  ON hyperfocus
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
```

**Opção 3: Temporariamente desabilitar RLS (APENAS DESENVOLVIMENTO!)**
```sql
-- ⚠️ APENAS PARA TESTES LOCAIS!
ALTER TABLE hyperfocus DISABLE ROW LEVEL SECURITY;

-- ✅ SEMPRE reabilitar depois
ALTER TABLE hyperfocus ENABLE ROW LEVEL SECURITY;
```

---

### 8. Dados não aparecem na UI

#### 🔴 Sintoma
API retorna dados, mas componente não mostra.

#### 🔍 Debug Checklist

```typescript
// 1. Adicionar console.logs
const { hyperfocusList, loading, error } = useHyperfocus(userId);

useEffect(() => {
  console.log('DEBUG:', {
    hyperfocusList,
    length: hyperfocusList.length,
    loading,
    error,
  });
}, [hyperfocusList, loading, error]);

// 2. Verificar condições de renderização
if (loading) {
  console.log('Showing loading state');
  return <div>Loading...</div>;
}

if (error) {
  console.log('Showing error state:', error);
  return <div>Error: {error}</div>;
}

if (hyperfocusList.length === 0) {
  console.log('List is empty');
  return <div>Nenhum hiperfoco encontrado</div>;
}

// 3. Verificar renderização do map
return (
  <div>
    {hyperfocusList.map((h, index) => {
      console.log(`Rendering item ${index}:`, h);
      return <div key={h.id}>{h.title}</div>;
    })}
  </div>
);
```

---

### 9. Optimistic Update não reverte ao falhar

#### 🔴 Sintoma
UI atualiza, request falha, mas UI não volta ao estado anterior.

#### ✅ Solução
```typescript
// ❌ ERRADO - Não guarda valor anterior
const toggleTask = async (id) => {
  setTasks(prev => prev.map(t => 
    t.id === id ? { ...t, completed: !t.completed } : t
  ));
  
  try {
    await service.update(id, { completed: true }); // ← valor hardcoded!
  } catch (err) {
    // Como reverter? Não sabemos o valor anterior!
  }
};

// ✅ CORRETO - Guarda valor anterior
const toggleTask = async (id) => {
  // 1. Encontrar task e guardar valor original
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  
  const originalCompleted = task.completed;
  const newCompleted = !originalCompleted;
  
  // 2. Optimistic update
  setTasks(prev => prev.map(t => 
    t.id === id ? { ...t, completed: newCompleted } : t
  ));
  
  try {
    // 3. Persistir com valor correto
    await service.update(id, { completed: newCompleted });
  } catch (err) {
    // 4. Reverter para valor original
    setTasks(prev => prev.map(t => 
      t.id === id ? { ...t, completed: originalCompleted } : t
    ));
    setError('Erro ao atualizar tarefa');
  }
};
```

---

### 10. Testes falhando

#### 🔴 Erro em Teste
```
Error: Cannot find module '@/lib/hooks/useHyperfocus'
```

#### ✅ Solução 1: Verificar alias no vitest.config.ts
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    // ...
  },
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), './src'), // ← Deve estar presente
    },
  },
});
```

#### ✅ Solução 2: Mock do Supabase
```typescript
// /tests/utils/mocks.ts
import { vi } from 'vitest';

export const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  })),
};

// No teste
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient,
}));
```

---

## 🔍 FERRAMENTAS DE DEBUG

### 1. React DevTools

```bash
# Instalar extensão no navegador
# Chrome: https://chrome.google.com/webstore/detail/react-developer-tools
# Firefox: https://addons.mozilla.org/en-US/firefox/addon/react-devtools/

# Usar para:
# - Ver props e state dos componentes
# - Ver hierarchy de componentes
# - Profiling de performance
```

### 2. Supabase Dashboard

```
1. Abrir: https://supabase.com/dashboard
2. Ir em: Table Editor
3. Verificar dados diretamente nas tabelas
4. SQL Editor para queries manuais
5. Logs para ver erros em tempo real
```

### 3. Console.log Estratégico

```typescript
// Template de debug
function MyComponent() {
  const { data, loading, error } = useHyperfocus(userId);
  
  // Debug mount/unmount
  useEffect(() => {
    console.log('🔵 Component mounted');
    return () => console.log('🔴 Component unmounted');
  }, []);
  
  // Debug data changes
  useEffect(() => {
    console.log('📊 Data changed:', {
      dataLength: data?.length,
      loading,
      error,
      timestamp: new Date().toISOString(),
    });
  }, [data, loading, error]);
  
  // Debug function calls
  const handleClick = () => {
    console.log('🖱️ Button clicked', { userId, data });
    // ... resto da função
  };
  
  return <button onClick={handleClick}>Click</button>;
}
```

### 4. Network Tab

```
1. Abrir DevTools (F12)
2. Ir na aba "Network"
3. Filtrar por "Fetch/XHR"
4. Verificar:
   - Status code (200 = sucesso, 401 = não autenticado, 500 = erro servidor)
   - Request payload (dados enviados)
   - Response (dados recebidos)
   - Tempo de resposta
```

---

## 📞 QUANDO PEDIR AJUDA

Se após tentar as soluções acima o problema persistir:

### 1. Prepare informações
```
- Versão do Node: node --version
- Versão do npm: npm --version
- Sistema operacional
- Mensagem de erro completa
- Stack trace
- Código relevante
```

### 2. Formato para abrir issue

```markdown
## 🐛 Descrição do Bug
[Descrição clara do problema]

## 🔄 Passos para Reproduzir
1. Fazer X
2. Clicar em Y
3. Ver erro Z

## 💻 Código Relevante
```typescript
// Código que causa o erro
```

## 🔴 Erro Completo
```
[Stack trace completo]
```

## 🌍 Ambiente
- Node: v20.0.0
- npm: 10.0.0
- OS: Ubuntu 22.04
- Browser: Chrome 120

## 🔍 O que já tentei
- [x] Tentei solução A
- [x] Tentei solução B
- [ ] Não tentei solução C porque...
```

---

## 📚 Recursos de Ajuda

- **Documentação React:** https://react.dev
- **Documentação Supabase:** https://supabase.com/docs
- **Stack Overflow:** https://stackoverflow.com (tag: reactjs, supabase)
- **Discord SATI:** [link do discord do projeto]
- **GitHub Issues:** [link do repo]/issues

---

**Última atualização:** 13 de outubro de 2025  
**Versão:** 1.0  
**Mantenha este documento atualizado com novos problemas encontrados!**
