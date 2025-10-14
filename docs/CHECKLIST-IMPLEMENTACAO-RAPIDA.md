# ✅ Checklist de Implementação Rápida

> **Para consulta rápida durante desenvolvimento**  
> **Imprima ou mantenha aberto em uma segunda tela**

---

## 🎯 VISÃO GERAL - O que vamos fazer?

```
┌─────────────────────────────────────────────────────────────┐
│  ANTES (Atual)                    DEPOIS (Meta)             │
├─────────────────────────────────────────────────────────────┤
│  UI → ChatGPT → MCP Tool → DB    UI → Hook → DB             │
│  ❌ Lento                        ✅ Instantâneo              │
│  ❌ Pode falhar                  ✅ Confiável                │
│  ❌ Sem feedback                 ✅ Feedback imediato        │
└─────────────────────────────────────────────────────────────┘
```

---

## 📅 PLANEJAMENTO - Estimativas Realistas

### Sprint 1: Hooks (Dia 1 - 4h)
- [ ] **9h-10h:** `useHyperfocus` (1h)
- [ ] **10h-11h:** `useTasks` (1h)
- [ ] **11h-11:30h:** `useFocusSession` (30min)
- [ ] **11:30h-12h:** Testar hooks manualmente (30min)
- [ ] **13h-14h:** Ajustes e correções (1h)

### Sprint 2: Componentes (Dia 2 - 4h)
- [ ] **9h-10h:** Refatorar `HyperfocusCard` (1h)
- [ ] **10h-11:30h:** Refatorar `TaskBreakdown` (1.5h)
- [ ] **11:30h-13h:** Refatorar `FocusTimer` (1.5h)

### Sprint 3: Testes (Dia 3 - 3h)
- [ ] **9h-10:30h:** Testes de integração hooks (1.5h)
- [ ] **10:30h-12h:** Testes E2E componentes (1.5h)

### Sprint 4: Finalização (Dia 3 - 1h)
- [ ] **14h-15h:** Documentação e review (1h)

---

## 🔧 FASE 1: HOOKS - Passo a Passo

### 1.1 - Hook `useHyperfocus`

#### ✅ Estrutura do Arquivo
```typescript
// /src/lib/hooks/useHyperfocus.ts

1. ✅ Imports
2. ✅ Types/Interfaces  
3. ✅ Estados (useState)
4. ✅ Função: createHyperfocus
5. ✅ Função: updateHyperfocus
6. ✅ Função: deleteHyperfocus
7. ✅ Função: loadHyperfocus
8. ✅ Função: loadHyperfocusList
9. ✅ Função: clearError
10. ✅ Return object
```

#### 🧪 Teste Manual
```bash
# 1. Criar página de teste
touch src/app/test-hooks/page.tsx

# 2. Adicionar código de teste (ver guia completo)

# 3. Rodar dev server
npm run dev

# 4. Abrir http://localhost:3000/test-hooks

# 5. Validar:
✅ Lista carrega
✅ Botão de criar funciona
✅ Lista atualiza
✅ Sem erros no console
```

#### 🐛 Troubleshooting Comum
```
Erro: "user_id is required"
→ Verificar se userId não está vazio

Erro: "createClient is not a function"
→ Verificar import: import { createClient } from '@/lib/supabase/client'

Erro: "HyperfocusService is not defined"
→ Verificar import do service

Loading infinito
→ Adicionar console.log para debug
→ Verificar se finally() está sendo chamado
```

---

### 1.2 - Hook `useTasks`

#### ✅ Checklist Específico
- [ ] Import `TaskService` correto
- [ ] Função `toggleTaskComplete` com optimistic update
- [ ] Reverter update se falhar
- [ ] Loading states não bloqueiam UI
- [ ] Error handling com mensagens claras

#### 🎯 Foco: Optimistic Update
```typescript
// PADRÃO CORRETO
const toggleTaskComplete = async (id: string) => {
  // 1. Atualizar UI ANTES
  setTasks(prev => prev.map(t => 
    t.id === id ? { ...t, completed: !t.completed } : t
  ));

  try {
    // 2. Salvar no DB
    await service.update(userId, id, { completed: !oldValue });
  } catch (err) {
    // 3. REVERTER se falhar
    setTasks(prev => prev.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    ));
    setError('Erro ao atualizar');
  }
};
```

---

### 1.3 - Hook `useFocusSession`

#### ✅ Checklist Específico
- [ ] `startSession` retorna session object
- [ ] `endSession` limpa estado local
- [ ] `loadActiveSession` busca apenas sessões não finalizadas
- [ ] Query usa `.maybeSingle()` (pode não ter sessão ativa)
- [ ] Timestamps são tratados corretamente

---

## 🎨 FASE 2: COMPONENTES - Passo a Passo

### 2.1 - Refatorar `HyperfocusCard`

#### 📝 Código Template
```typescript
// Adicionar no topo do componente
import { useHyperfocus } from '@/lib/hooks/useHyperfocus';
import { useAuth } from '@/lib/hooks/useAuth';

export function HyperfocusCard() {
  // Hooks existentes
  const toolOutput = useToolOutput<HyperfocusCardOutput>();
  const theme = useTheme();
  
  // ✅ ADICIONAR: Novos hooks
  const { user } = useAuth();
  const { 
    updateHyperfocus, 
    deleteHyperfocus,
    loading: saving,
    err
    or 
  } = useHyperfocus(user?.id || '');

  // ✅ MODIFICAR: Handlers existentes
  const handleStartTimer = useCallback(async () => {
    if (!hyperfocus?.id || !user?.id) return;

    // 1. Salvar no Supabase
    const updated = await updateHyperfocus(hyperfocus.id, {
      // dados...
    });

    if (!updated) {
      // Mostrar erro
      return;
    }

    // 2. Chamar ChatGPT (opcional)
    if (window.openai?.callTool) {
      await window.openai.callTool('startFocusTimer', {...});
    }
  }, [hyperfocus, user, updateHyperfocus]);

  // ✅ ADICIONAR: UI de feedback
  if (saving) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  // ... resto do componente
}
```

#### ✅ Checklist de Validação
- [ ] Hook `useAuth` implementado ou mock
- [ ] Loading state mostrado
- [ ] Error state mostrado
- [ ] Botões desabilitados durante loading
- [ ] Sucesso mostrado (toast ou mensagem)

---

### 2.2 - Refatorar `TaskBreakdown`

#### 📝 Mudanças Principais
```typescript
export function TaskBreakdown(props: TaskBreakdownProps = {}) {
  // ... existing code ...

  // ✅ ADICIONAR
  const { user } = useAuth();
  const { 
    tasks: tasksFromHook, 
    loading: loadingTasks,
    toggleTaskComplete,
    loadTasks 
  } = useTasks(user?.id || '');

  // ✅ ADICIONAR: Carregar tasks ao montar
  useEffect(() => {
    if (hyperfocusId && user?.id) {
      loadTasks(hyperfocusId);
    }
  }, [hyperfocusId, user?.id, loadTasks]);

  // ✅ MODIFICAR: Usar tasks do hook OU fallback
  const tasks = tasksFromHook.length > 0 
    ? tasksFromHook 
    : (data?.tasks ?? []);

  // ✅ MODIFICAR: handleToggle
  const handleToggle = useCallback(async (taskId: string) => {
    if (!user?.id) return;

    const success = await toggleTaskComplete(taskId);
    
    if (!success) {
      // Mostrar toast de erro
    }
  }, [user, toggleTaskComplete]);
}
```

#### ✅ Checklist de Validação
- [ ] Tasks carregam do Supabase
- [ ] Toggle funciona instantaneamente (optimistic)
- [ ] Se falhar, reverte o toggle
- [ ] Loading não bloqueia interação
- [ ] Funciona com/sem toolOutput

---

### 2.3 - Refatorar `FocusTimer`

#### 🎯 Foco: Persistir Estado do Timer

```typescript
export function FocusTimer(props: FocusTimerProps = {}) {
  // ... existing code ...

  // ✅ ADICIONAR
  const { user } = useAuth();
  const { 
    session: activeSession,
    endSession,
    loadActiveSession 
  } = useFocusSession(user?.id || '');

  // ✅ ADICIONAR: Carregar sessão ativa
  useEffect(() => {
    if (user?.id && !sessionId) {
      loadActiveSession();
    }
  }, [user?.id, sessionId, loadActiveSession]);

  // ✅ MODIFICAR: handleComplete
  const handleComplete = useCallback(async () => {
    if (!sessionId || !user?.id) return;

    // 1. Salvar no Supabase
    const success = await endSession(sessionId, true);

    if (!success) {
      console.error('Erro ao finalizar');
      return;
    }

    // 2. Tocar som
    if (isSoundEnabled) {
      playAlarmSound('gentle-bell', true);
    }

    // 3. Atualizar UI
    setIsCompleted(true);
  }, [sessionId, user, endSession, isSoundEnabled]);
}
```

#### ✅ Checklist de Validação
- [ ] Timer carrega sessão ativa ao montar
- [ ] Pausar persiste no DB
- [ ] Completar persiste no DB
- [ ] Cancelar persiste no DB
- [ ] Timer continua após reload da página

---

## 🧪 FASE 3: TESTES - Templates Prontos

### 3.1 - Teste de Hook

```typescript
// /tests/integration/use-hyperfocus.test.ts

import { renderHook, waitFor } from '@testing-library/react';
import { useHyperfocus } from '@/lib/hooks/useHyperfocus';

describe('useHyperfocus', () => {
  const TEST_USER_ID = 'test-user';

  it('deve criar e listar hiperfoco', async () => {
    const { result } = renderHook(() => useHyperfocus(TEST_USER_ID));

    // Criar
    await result.current.createHyperfocus({
      title: 'Test',
      color: 'blue',
    });

    // Validar
    await waitFor(() => {
      expect(result.current.hyperfocusList).toHaveLength(1);
    });
  });
});
```

### 3.2 - Teste de Componente

```typescript
// /tests/ui/hyperfocus-card.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import { HyperfocusCard } from '@/components/HyperfocusCard';

describe('HyperfocusCard', () => {
  it('deve renderizar e interagir', async () => {
    render(<HyperfocusCard />);

    // Simular dados
    window.openai = {
      toolOutput: {
        hyperfocus: { id: '1', title: 'Test', color: 'blue' }
      },
      theme: 'light',
    };

    // Verificar renderização
    expect(screen.getByText('Test')).toBeInTheDocument();

    // Clicar em botão
    const button = screen.getByText('Criar Tarefas');
    fireEvent.click(button);

    // Validar ação
    // ...
  });
});
```

### 3.3 - Rodar Testes

```bash
# Teste único
npm run test -- use-hyperfocus.test.ts

# Todos os testes
npm run test:all

# Watch mode
npm run test:watch

# Com coverage
npm run test:coverage
```

---

## 🐛 DEBUG - Comandos Úteis

### Verificar Estado do Supabase
```typescript
// Adicionar no componente
useEffect(() => {
  console.log('DEBUG:', {
    userId: user?.id,
    hyperfocusList,
    loading,
    error,
  });
}, [user, hyperfocusList, loading, error]);
```

### Verificar Queries SQL
```sql
-- No Supabase Dashboard > SQL Editor

-- Ver hiperfocos de um usuário
SELECT * FROM hyperfocus 
WHERE user_id = 'SEU_USER_ID';

-- Ver sessões ativas
SELECT * FROM focus_sessions 
WHERE ended_at IS NULL;

-- Ver tasks de um hiperfoco
SELECT * FROM tasks 
WHERE hyperfocus_id = 'HYPERFOCUS_ID';
```

### Limpar Dados de Teste
```sql
-- CUIDADO: Só em desenvolvimento!
DELETE FROM focus_sessions WHERE user_id = 'test-user';
DELETE FROM tasks WHERE hyperfocus_id IN (
  SELECT id FROM hyperfocus WHERE user_id = 'test-user'
);
DELETE FROM hyperfocus WHERE user_id = 'test-user';
```

---

## ✅ CHECKLIST FINAL - Antes de Mergear

### Código
- [ ] Todos os hooks criados
- [ ] Todos os componentes refatorados
- [ ] Sem `console.log` desnecessários
- [ ] Sem TODOs críticos
- [ ] Código formatado (`npm run format`)
- [ ] Lint passou (`npm run lint`)
- [ ] Type check passou (`npm run type-check`)

### Testes
- [ ] Unit tests passam (100%)
- [ ] Integration tests passam (100%)
- [ ] UI tests passam (100%)
- [ ] Coverage > 70%
- [ ] Nenhum teste skip ou comentado

### Funcionalidade
- [ ] CRUD de hiperfoco funciona
- [ ] CRUD de tasks funciona
- [ ] Timer persiste estado
- [ ] Optimistic updates funcionam
- [ ] Errors são tratados
- [ ] Loading states aparecem
- [ ] Funciona offline (com erro adequado)

### UX
- [ ] Feedback visual imediato
- [ ] Mensagens de erro claras
- [ ] Loading não bloqueia UI
- [ ] Animações suaves
- [ ] Acessibilidade OK

### Performance
- [ ] Sem re-renders desnecessários
- [ ] Queries otimizadas
- [ ] Debouncing onde necessário
- [ ] Memory leaks verificados

### Documentação
- [ ] README atualizado
- [ ] CHANGELOG atualizado
- [ ] JSDoc em funções complexas
- [ ] Guia de implementação revisado

---

## 🚀 Comandos de Deploy

```bash
# 1. Validar tudo
npm run validate

# 2. Rodar testes completos
npm run test:all

# 3. Build de produção
npm run build

# 4. Testar build local
npm run start

# 5. Se tudo OK, commit e push
git add .
git commit -m "feat: integração componentes + supabase"
git push origin main
```

---

## 📞 Ajuda e Suporte

### Erros Comuns

**"Cannot read property 'id' of undefined"**
```typescript
// ❌ Errado
const { id } = user;

// ✅ Correto
const id = user?.id || '';
```

**"Hook called conditionally"**
```typescript
// ❌ Errado
if (userId) {
  const { data } = useHyperfocus(userId);
}

// ✅ Correto
const { data } = useHyperfocus(userId || '');
```

**"setState on unmounted component"**
```typescript
// ✅ Adicionar cleanup
useEffect(() => {
  let isMounted = true;
  
  async function load() {
    const data = await fetchData();
    if (isMounted) {
      setData(data);
    }
  }
  
  load();
  
  return () => {
    isMounted = false;
  };
}, []);
```

---

## 📚 Recursos Úteis

- **Guia Completo:** `/docs/GUIA-IMPLEMENTACAO-INTEGRACAO-COMPONENTES.md`
- **Documentação Supabase:** https://supabase.com/docs
- **React Hooks:** https://react.dev/reference/react
- **Testing Library:** https://testing-library.com/docs/react-testing-library/intro/

---

**Última atualização:** 13 de outubro de 2025  
**Versão:** 1.0  
**Status:** ✅ Pronto para uso
