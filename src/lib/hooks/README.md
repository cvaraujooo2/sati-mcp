# 🪝 Hooks de Integração SATI

Hooks React para integração direta com Supabase, eliminando dependência exclusiva do ChatGPT para persistência de dados.

---

## 📦 Hooks Disponíveis

### 1. `useAuth()`
Gerencia autenticação e usuário atual.

```typescript
const { user, loading, error } = useAuth();
```

**Retorna:**
- `user: User | null` - Usuário Supabase autenticado
- `loading: boolean` - Estado de carregamento inicial
- `error: string | null` - Mensagem de erro

---

### 2. `useHyperfocus(userId)`
Gerencia CRUD de hiperfocos.

```typescript
const {
  hyperfocus,
  hyperfocusList,
  loading,
  error,
  createHyperfocus,
  updateHyperfocus,
  deleteHyperfocus,
  loadHyperfocus,
  loadHyperfocusList,
  clearError,
} = useHyperfocus(user?.id || '');
```

**Métodos:**
- `createHyperfocus(data)` - Criar novo hiperfoco
- `updateHyperfocus(id, data)` - Atualizar hiperfoco
- `deleteHyperfocus(id)` - Deletar hiperfoco
- `loadHyperfocus(id)` - Carregar hiperfoco específico
- `loadHyperfocusList()` - Carregar lista de hiperfocos
- `clearError()` - Limpar mensagem de erro

---

### 3. `useTasks(userId)`
Gerencia CRUD de tarefas com optimistic updates.

```typescript
const {
  tasks,
  loading,
  error,
  loadTasks,
  createTask,
  updateTask,
  toggleTaskComplete, // ⚡ Com optimistic update!
  deleteTask,
  clearError,
} = useTasks(user?.id || '');
```

**Métodos:**
- `loadTasks(hyperfocusId)` - Carregar tarefas de um hiperfoco
- `createTask(data)` - Criar nova tarefa
- `updateTask(id, data)` - Atualizar tarefa
- `toggleTaskComplete(id)` - Toggle com optimistic update ⚡
- `deleteTask(id)` - Deletar tarefa
- `clearError()` - Limpar mensagem de erro

**Destaque:** `toggleTaskComplete` implementa **optimistic update** para feedback instantâneo!

---

### 4. `useFocusSession(userId)`
Gerencia sessões de foco e timer.

```typescript
const {
  session,
  loading,
  error,
  startSession,
  endSession,
  loadActiveSession,
  clearError,
} = useFocusSession(user?.id || '');
```

**Métodos:**
- `startSession(hyperfocusId, durationMinutes)` - Iniciar sessão
- `endSession(sessionId, completed)` - Finalizar sessão
- `loadActiveSession()` - Carregar sessão ativa
- `clearError()` - Limpar mensagem de erro

---

## 🚀 Quick Start

### 1. Importar
```typescript
import { useAuth, useHyperfocus, useTasks, useFocusSession } from '@/lib/hooks';
```

### 2. Usar no Componente
```typescript
'use client';

import { useAuth, useTasks } from '@/lib/hooks';
import { useEffect } from 'react';

export function MeuComponente() {
  const { user } = useAuth();
  const { tasks, loadTasks, toggleTaskComplete, loading, error } = useTasks(user?.id || '');

  // Carregar tarefas ao montar
  useEffect(() => {
    if (user?.id) {
      loadTasks('hyperfocus-id');
    }
  }, [user?.id, loadTasks]);

  return (
    <div>
      {loading && <p>Carregando...</p>}
      {error && <p className="error">{error}</p>}
      {tasks.map(task => (
        <div key={task.id}>
          <input
            type="checkbox"
            checked={task.completed || false}
            onChange={() => toggleTaskComplete(task.id)}
          />
          <span>{task.title}</span>
        </div>
      ))}
    </div>
  );
}
```

---

## 🎯 Pattern de Uso

Todos os hooks seguem o mesmo pattern:

```typescript
// 1. Importar hook
import { useAuth, useSpecificHook } from '@/lib/hooks';

// 2. Usar no componente
const { user } = useAuth();
const { action, loading, error } = useSpecificHook(user?.id || '');

// 3. Handler
const handleAction = async () => {
  // a) Persistir no Supabase
  const result = await action(data);
  
  // b) Tratar erro
  if (!result) {
    console.error(error);
    return;
  }
  
  // c) ChatGPT opcional (para contexto)
  if (window.openai?.callTool) {
    await window.openai.callTool('action', {...});
  }
};

// 4. UI com feedback
return (
  <div>
    {loading && <p>Carregando...</p>}
    {error && <div className="error">{error}</div>}
    <button disabled={loading} onClick={handleAction}>
      {loading ? 'Salvando...' : 'Ação'}
    </button>
  </div>
);
```

---

## ⚡ Optimistic Updates

O hook `useTasks` implementa optimistic updates no método `toggleTaskComplete`:

```typescript
const toggleTaskComplete = async (taskId: string) => {
  // 1. Atualiza UI IMEDIATAMENTE (optimistic)
  setTasks(prev => prev.map(t => 
    t.id === taskId ? { ...t, completed: !t.completed } : t
  ));

  // 2. Salva no Supabase em background
  try {
    await service.update(userId, taskId, { completed: !task.completed });
  } catch (err) {
    // 3. Reverte em caso de erro
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    ));
    setError(err.message);
  }
};
```

**Resultado:** Feedback instantâneo para o usuário! ⚡

---

## 🧪 Testar

### Página de Testes
```bash
npm run dev
# Abrir: http://localhost:3000/test-hooks
```

A página de testes permite:
- ✅ Ver hiperfocos
- ✅ Criar hiperfocos
- ✅ Ver tarefas
- ✅ Toggle de tarefas (optimistic!)
- ✅ Ver sessão ativa

---

## 🛠️ Arquitetura

```
Component
    ↓
  Hook (este arquivo)
    ↓
 Service
    ↓
Supabase Client
    ↓
PostgreSQL
```

---

## 📖 Documentação Completa

- **Guia de Implementação:** `/docs/GUIA-IMPLEMENTACAO-INTEGRACAO-COMPONENTES.md`
- **Quick Start:** `/docs/QUICK-START-HOOKS.md`
- **Fase 1 Completa:** `/docs/IMPLEMENTACAO-FASE-1-HOOKS.md`
- **Fase 2 Completa:** `/docs/IMPLEMENTACAO-FASE-2-REFATORACAO.md`

---

## 🤝 Contribuindo

Ao criar novos hooks:

1. Seguir o pattern estabelecido
2. Incluir tratamento de erro robusto
3. Adicionar loading states
4. Documentar métodos
5. Adicionar testes

---

**Criado:** 13 de outubro de 2025  
**Status:** ✅ Produção
