# 🚀 Quick Start: Usando os Novos Hooks

## 📚 Importação

```typescript
import { useAuth, useHyperfocus, useTasks, useFocusSession } from '@/lib/hooks';
```

---

## 1️⃣ useAuth - Autenticação

### Uso Básico
```typescript
'use client';

import { useAuth } from '@/lib/hooks';

export function MeuComponente() {
  const { user, loading, error } = useAuth();

  if (loading) return <p>Carregando...</p>;
  if (!user) return <p>Faça login</p>;

  return <p>Olá, {user.email}!</p>;
}
```

### Estados Disponíveis
- `user: User | null` - Usuário Supabase atual
- `loading: boolean` - Carregando estado inicial
- `error: string | null` - Mensagem de erro

---

## 2️⃣ useHyperfocus - Gerenciar Hiperfocos

### Uso Básico
```typescript
'use client';

import { useAuth, useHyperfocus } from '@/lib/hooks';

export function ListaHiperfocos() {
  const { user } = useAuth();
  const { 
    hyperfocusList, 
    loading, 
    error,
    loadHyperfocusList,
    createHyperfocus 
  } = useHyperfocus(user?.id || '');

  // Carregar lista ao montar
  useEffect(() => {
    if (user?.id) {
      loadHyperfocusList();
    }
  }, [user?.id, loadHyperfocusList]);

  // Criar novo hiperfoco
  const handleCreate = async () => {
    const result = await createHyperfocus({
      title: 'Meu Hiperfoco',
      description: 'Descrição opcional',
      color: 'blue', // 'red' | 'green' | 'blue' | 'orange' | 'purple' | 'brown' | 'gray' | 'pink'
      estimated_time_minutes: 30,
    });

    if (result) {
      console.log('✅ Criado:', result.id);
    } else {
      console.error('❌ Erro:', error);
    }
  };

  return (
    <div>
      <button onClick={handleCreate}>Criar Hiperfoco</button>
      {loading && <p>Carregando...</p>}
      {error && <p>Erro: {error}</p>}
      <ul>
        {hyperfocusList.map(h => (
          <li key={h.id}>{h.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Métodos Disponíveis
```typescript
// Criar
const hyperfocus = await createHyperfocus({ title, description, color, estimated_time_minutes });

// Atualizar
const updated = await updateHyperfocus(id, { title: 'Novo título' });

// Deletar
const success = await deleteHyperfocus(id);

// Carregar um específico
await loadHyperfocus(id); // Armazena em `hyperfocus`

// Carregar lista
await loadHyperfocusList(); // Armazena em `hyperfocusList`

// Limpar erro
clearError();
```

---

## 3️⃣ useTasks - Gerenciar Tarefas

### Uso Básico
```typescript
'use client';

import { useAuth, useTasks } from '@/lib/hooks';

export function ListaTarefas({ hyperfocusId }: { hyperfocusId: string }) {
  const { user } = useAuth();
  const { 
    tasks, 
    loading, 
    error,
    loadTasks,
    toggleTaskComplete 
  } = useTasks(user?.id || '');

  // Carregar tarefas do hiperfoco
  useEffect(() => {
    if (hyperfocusId && user?.id) {
      loadTasks(hyperfocusId);
    }
  }, [hyperfocusId, user?.id, loadTasks]);

  // Toggle com optimistic update
  const handleToggle = async (taskId: string) => {
    const success = await toggleTaskComplete(taskId);
    if (!success) {
      console.error('Erro ao atualizar tarefa');
    }
  };

  return (
    <div>
      {tasks.map(task => (
        <div key={task.id}>
          <input
            type="checkbox"
            checked={task.completed || false}
            onChange={() => handleToggle(task.id)}
          />
          <span className={task.completed ? 'line-through' : ''}>
            {task.title}
          </span>
        </div>
      ))}
    </div>
  );
}
```

### Métodos Disponíveis
```typescript
// Carregar tarefas de um hiperfoco
await loadTasks(hyperfocusId);

// Criar tarefa
const task = await createTask({
  hyperfocus_id: 'uuid',
  title: 'Minha tarefa',
  description: 'Opcional',
  estimated_minutes: 15,
});

// Atualizar tarefa
const updated = await updateTask(id, { title: 'Novo título' });

// Toggle completed (com optimistic update!)
const success = await toggleTaskComplete(id);

// Deletar tarefa
const success = await deleteTask(id);

// Limpar erro
clearError();
```

### ⚡ Optimistic Update
O `toggleTaskComplete` usa **optimistic update**:
1. ✅ UI atualiza **imediatamente**
2. 🔄 Salva no Supabase em background
3. ↩️ Reverte se houver erro

Resultado: **Feedback instantâneo para o usuário!**

---

## 4️⃣ useFocusSession - Gerenciar Sessões de Foco

### Uso Básico
```typescript
'use client';

import { useAuth, useFocusSession } from '@/lib/hooks';

export function Timer({ hyperfocusId }: { hyperfocusId: string }) {
  const { user } = useAuth();
  const { 
    session, 
    loading, 
    error,
    startSession,
    endSession,
    loadActiveSession 
  } = useFocusSession(user?.id || '');

  // Verificar se há sessão ativa
  useEffect(() => {
    if (user?.id) {
      loadActiveSession();
    }
  }, [user?.id, loadActiveSession]);

  // Iniciar nova sessão
  const handleStart = async () => {
    const newSession = await startSession(hyperfocusId, 25); // 25 minutos
    if (newSession) {
      console.log('✅ Sessão iniciada:', newSession.id);
    }
  };

  // Finalizar sessão
  const handleEnd = async (completed: boolean) => {
    if (!session) return;
    
    const success = await endSession(session.id, completed);
    if (success) {
      console.log('✅ Sessão finalizada');
    }
  };

  return (
    <div>
      {session ? (
        <div>
          <p>Sessão ativa: {session.planned_duration_minutes} min</p>
          <button onClick={() => handleEnd(true)}>Completar</button>
          <button onClick={() => handleEnd(false)}>Interromper</button>
        </div>
      ) : (
        <button onClick={handleStart}>Iniciar Foco</button>
      )}
    </div>
  );
}
```

### Métodos Disponíveis
```typescript
// Iniciar sessão
const session = await startSession(hyperfocusId, durationMinutes);

// Finalizar sessão
const success = await endSession(sessionId, completed); // completed = true/false

// Carregar sessão ativa
await loadActiveSession(); // Armazena em `session`

// Limpar erro
clearError();
```

---

## 🎨 Patterns de Uso Comuns

### Pattern 1: Loading States
```typescript
const { data, loading, error } = useAlgumHook(userId);

if (loading) return <Spinner />;
if (error) return <ErrorMessage message={error} />;
return <div>{/* Renderizar data */}</div>;
```

### Pattern 2: Async Operations
```typescript
const { createItem, loading } = useAlgumHook(userId);

const handleCreate = async () => {
  const result = await createItem(data);
  
  if (result) {
    // Sucesso - pode chamar ChatGPT se necessário
    if (window.openai?.callTool) {
      await window.openai.callTool('someAction', { id: result.id });
    }
  } else {
    // Erro já está em `error` do hook
    toast.error('Erro ao criar item');
  }
};

return <button disabled={loading} onClick={handleCreate}>Criar</button>;
```

### Pattern 3: Carregar Dados ao Montar
```typescript
const { loadData } = useAlgumHook(userId);

useEffect(() => {
  if (userId) {
    loadData();
  }
}, [userId, loadData]);
```

---

## 🚨 Error Handling

Todos os hooks seguem o mesmo pattern:

```typescript
const { data, error, clearError } = useAlgumHook(userId);

// Mostrar erro
{error && (
  <div className="alert-error">
    {error}
    <button onClick={clearError}>✕</button>
  </div>
)}

// Ou com toast
useEffect(() => {
  if (error) {
    toast.error(error);
    clearError(); // Limpar após mostrar
  }
}, [error, clearError]);
```

---

## 🔄 Integração com ChatGPT (Opcional)

Os hooks **não substituem** o ChatGPT, eles **complementam**:

```typescript
const { createHyperfocus } = useHyperfocus(userId);

const handleCreate = async () => {
  // 1. PERSISTIR PRIMEIRO (garantido)
  const hyperfocus = await createHyperfocus({ title: 'Novo' });
  
  if (!hyperfocus) return;
  
  // 2. NOTIFICAR CHATGPT (opcional, para contexto)
  if (window.openai?.callTool) {
    await window.openai.callTool('showHyperfocus', {
      hyperfocusId: hyperfocus.id,
    });
  }
};
```

**Vantagens:**
- ✅ Dados salvos **mesmo se ChatGPT falhar**
- ✅ Feedback **instantâneo** na UI
- ✅ ChatGPT mantém **contexto atualizado**

---

## 📦 TypeScript Types

Todos os hooks são fortemente tipados:

```typescript
// Auto-complete completo
const { hyperfocusList } = useHyperfocus(userId);
hyperfocusList[0].title // ✅ TypeScript conhece a estrutura

// Validação em tempo de compilação
await createHyperfocus({
  title: 'Teste',
  color: 'invalid-color' // ❌ TypeScript error!
});

await createHyperfocus({
  title: 'Teste',
  color: 'blue' // ✅ Válido
});
```

---

## 🎯 Quando Usar Cada Hook

| Situação | Hook |
|----------|------|
| Usuário atual | `useAuth()` |
| Criar/editar hiperfoco | `useHyperfocus()` |
| Listar hiperfocos | `useHyperfocus()` |
| Criar/editar tarefa | `useTasks()` |
| Toggle tarefa concluída | `useTasks()` |
| Iniciar timer | `useFocusSession()` |
| Finalizar sessão | `useFocusSession()` |

---

## 🧪 Testar os Hooks

Acesse a página de testes:
```bash
npm run dev
# Abrir: http://localhost:3000/test-hooks
```

---

## 📚 Referências

- [Guia Completo de Implementação](./GUIA-IMPLEMENTACAO-INTEGRACAO-COMPONENTES.md)
- [Relatório Fase 1](./IMPLEMENTACAO-FASE-1-HOOKS.md)
- [React Hooks Docs](https://react.dev/reference/react)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript)

---

**Última atualização:** 13 de outubro de 2025
