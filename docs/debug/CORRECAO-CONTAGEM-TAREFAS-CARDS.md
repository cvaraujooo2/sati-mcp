# Correção: Contagem de Tarefas nos Cards de Hiperfocos

**Data:** 14 de Outubro, 2025  
**Status:** ✅ Corrigido  
**Arquivo:** `src/app/components/hyperfocus/HyperfocusGrid.tsx`

## Problema Identificado

Os cards de hiperfocos estavam exibindo **"0 tarefas"** mesmo quando existiam tarefas associadas ao hiperfoco. Por exemplo, o hiperfoco "Estudar Teoria da História" tinha 5 tarefas, mas o card mostrava 0.

### Causa Raiz

Na **linha 233** do arquivo `HyperfocusGrid.tsx`, a contagem de tarefas estava **hardcoded** (codificada estaticamente):

```tsx
<span>0 tarefas</span>
```

O componente não estava:
1. Buscando as tarefas do banco de dados
2. Contando o total de tarefas
3. Contando quantas estavam completas
4. Exibindo a contagem real

## Solução Implementada

### 1. Adicionar Imports Necessários

```tsx
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
```

### 2. Adicionar Estado para Contagem

```tsx
const [taskCounts, setTaskCounts] = useState<Record<string, { total: number; completed: number }>>({})
```

Este estado armazena para cada hiperfoco:
- `total`: número total de tarefas
- `completed`: número de tarefas completadas

### 3. Buscar Contagens do Supabase

```tsx
useEffect(() => {
  const fetchTaskCounts = async () => {
    if (hyperfocuses.length === 0) return

    const supabase = createClient()
    const counts: Record<string, { total: number; completed: number }> = {}

    // Buscar tarefas para cada hiperfoco
    for (const hyperfocus of hyperfocuses) {
      try {
        const { data: tasks, error } = await supabase
          .from('tasks')
          .select('id, completed')
          .eq('hyperfocus_id', hyperfocus.id)

        if (!error && tasks) {
          counts[hyperfocus.id] = {
            total: tasks.length,
            completed: tasks.filter(t => t.completed).length,
          }
        } else {
          counts[hyperfocus.id] = { total: 0, completed: 0 }
        }
      } catch (err) {
        console.error(`Error fetching tasks for hyperfocus ${hyperfocus.id}:`, err)
        counts[hyperfocus.id] = { total: 0, completed: 0 }
      }
    }

    setTaskCounts(counts)
  }

  fetchTaskCounts()
}, [hyperfocuses])
```

**Funcionamento:**
- Executa quando `hyperfocuses` muda
- Para cada hiperfoco, busca suas tarefas do Supabase
- Conta total e completadas
- Armazena no estado

### 4. Exibir Contagem Real no Card

**Antes:**
```tsx
<span>0 tarefas</span>
```

**Depois:**
```tsx
<span>
  {taskCounts[hyperfocus.id]
    ? `${taskCounts[hyperfocus.id].completed}/${taskCounts[hyperfocus.id].total} tarefas`
    : '0 tarefas'}
</span>
```

**Formato de Exibição:**
- Se houver tarefas: `"3/5 tarefas"` (3 de 5 concluídas)
- Se não houver tarefas: `"0 tarefas"`

## Resultado

### Antes da Correção
```
Estudar Teoria da História
📄 120 min  ✓ 0 tarefas
```

### Depois da Correção
```
Estudar Teoria da História
📄 120 min  ✓ 0/5 tarefas
```

Agora mostra corretamente:
- **0** tarefas completadas
- **5** tarefas totais

## Benefícios

1. ✅ **Informação Precisa**: Usuários veem a contagem real de tarefas
2. ✅ **Progresso Visível**: Formato "X/Y" mostra progresso das tarefas
3. ✅ **Integração Supabase**: Dados vêm diretamente do banco de dados
4. ✅ **Atualização Automática**: Recarrega quando hiperfocos mudam
5. ✅ **Error Handling**: Tratamento de erros com fallback para 0

## Performance

### Otimização Aplicada:
- Busca apenas `id` e `completed` (campos mínimos necessários)
- Usa `useEffect` com dependência para evitar buscas desnecessárias
- Error handling para não quebrar UI em caso de falha

### Possíveis Melhorias Futuras:
- [ ] Adicionar debounce se houver muitos hiperfocos
- [ ] Implementar cache das contagens
- [ ] Usar single query com agregação em vez de loop
- [ ] Adicionar loading indicator durante fetch

## Teste Manual

Para verificar a correção:

1. Acesse a página de Hiperfocos
2. Verifique que os cards mostram contagem correta
3. Crie uma nova tarefa em um hiperfoco
4. Atualize a página ou volte à lista
5. Confirme que a contagem aumentou
6. Complete uma tarefa
7. Confirme que mostra "1/X tarefas"

## Arquivos Modificados

- ✅ `src/app/components/hyperfocus/HyperfocusGrid.tsx`

## Commits Relacionados

- Correção de contagem de tarefas nos cards de hiperfocos
- Integração com Supabase para buscar contagens reais

---

**Status:** ✅ Implementado e Funcional  
**Prioridade:** Alta (Bug visível ao usuário)  
**Complexidade:** Baixa  
**Tempo de Implementação:** ~10 minutos



