# 🔧 GUIA DE CORREÇÕES RÁPIDAS: Integração ChatGPT ↔ Components

**Para desenvolvedores que querem corrigir os problemas identificados**

---

## 🎯 Quick Fixes (Aplicar Agora)

### 1. SubtaskSuggestions.tsx

**Problema:** Sem fallback para `toolInput`

**Correção:** Linha ~40

```typescript
// ❌ ANTES:
const toolOutput = useToolOutput<SubtaskSuggestionsOutput>();

const suggestedTasks = toolOutput?.suggestedTasks ?? [];

// ✅ DEPOIS:
const toolInput = useToolInput<SubtaskSuggestionsInput>();
const toolOutput = useToolOutput<SubtaskSuggestionsOutput>();

const suggestedTasks = toolOutput?.suggestedTasks || toolInput?.suggestedTasks || [];
```

---

### 2. TaskBreakdown.tsx

**Problema:** Não usa `useToolInput`

**Correção:** Linha ~66

```typescript
// ❌ ANTES:
import { useToolOutput, useTheme } from './hooks/useOpenAi';

const toolOutput = useToolOutput<TaskBreakdownOutput>();

// ✅ DEPOIS:
import { useToolInput, useToolOutput, useTheme } from './hooks/useOpenAi';

interface TaskBreakdownInput {
  hyperfocusId: string;
  hyperfocusTitle: string;
  tasks: Task[];
}

const toolInput = useToolInput<TaskBreakdownInput>();
const toolOutput = useToolOutput<TaskBreakdownOutput>();

const tasks = toolOutput?.tasks || toolInput?.tasks || [];
```

---

### 3. breakIntoSubtasks.ts (Backend)

**Problema:** Não retorna `suggestedTasks` nos props

**Correção:** Linha ~195

```typescript
// ❌ ANTES:
component: validated.autoCreate
  ? { type: 'expanded', name: 'TaskBreakdown', props: { ... } }
  : { type: 'expanded', name: 'SubtaskSuggestions', props: {} }

// ✅ DEPOIS:
component: validated.autoCreate
  ? { 
      type: 'expanded', 
      name: 'TaskBreakdown', 
      props: { 
        hyperfocusId: validated.hyperfocusId,
        hyperfocusTitle: hyperfocus.title,
        tasks: createdTasks.map(t => ({
          id: t.id,
          title: t.title,
          completed: false
        }))
      } 
    }
  : { 
      type: 'expanded', 
      name: 'SubtaskSuggestions', 
      props: {
        hyperfocusId: validated.hyperfocusId,
        hyperfocusTitle: hyperfocus.title,
        description: validated.taskDescription,
        suggestedTasks: suggestedTasks,
        complexity: analysis.complexity,
        totalEstimatedMinutes: totalMinutes
      }
    }
```

---

### 4. analyzeContext.ts (Backend)

**Problema:** Props incompletos

**Correção:** Linha ~91

```typescript
// ❌ ANTES:
props: {
  hyperfocusTitle: hyperfocus.title,
  analysisType: validated.analysisType,
  analysis,
}

// ✅ DEPOIS:
props: {
  contextDescription: validated.userInput,
  analysisType: validated.analysisType,
  result: analysis,
  insights: [
    `Análise de ${validated.analysisType} concluída`,
    `Baseado em: ${validated.userInput.substring(0, 100)}...`
  ]
}
```

---

## 🔴 FocusTimer (Aguardando Debug)

**Status:** ⏳ Logs de debug adicionados, aguardando teste do usuário

**Próximos passos:**
1. Usuário testa com DevTools aberto
2. Enviamos logs do console
3. Identificamos se problema é:
   - `window.openai.toolInput` vazio
   - `endsAt` não parseado corretamente
   - Race condition no render
   - Timezone issue

**Não alterar até ter logs!**

---

## ✅ Checklist de Validação

Após aplicar correções, verificar:

```typescript
// Para cada componente:
- [ ] Importa useToolInput E useToolOutput
- [ ] Define interfaces Input E Output
- [ ] Usa fallback: toolOutput || toolInput || default
- [ ] Valida props essenciais antes de usar
- [ ] Early return se dados críticos faltarem

// Para cada tool (backend):
- [ ] Sempre retorna component.props completo
- [ ] Props incluem TODOS os dados que o componente precisa
- [ ] Timestamps estão em ISO 8601 format
- [ ] Arrays não podem ser undefined (usar [])
```

---

## 🧪 Teste Rápido

Após correções, testar cada componente:

```bash
# 1. SubtaskSuggestions
"Sugira subtarefas para aprender TypeScript avançado"

# 2. TaskBreakdown
"Criar tarefas para dominar Next.js"

# 3. ContextAnalysis
"Analise a complexidade de construir um sistema de autenticação completo"

# 4. FocusTimer (após debug)
"Inicie um timer de 5 minutos para testar React hooks"
```

---

## 📚 Padrão de Referência

**Template para novos componentes:**

```typescript
// ComponentName.tsx
import { useToolInput, useToolOutput, useTheme } from './hooks/useOpenAi';

interface ComponentInput {
  // Props iniciais do component.props (backend)
  id: string;
  title: string;
  // ...
}

interface ComponentOutput {
  // Resultados do callback (se houver)
  success: boolean;
  data: any;
  // ...
}

export function ComponentName() {
  const toolInput = useToolInput<ComponentInput>();
  const toolOutput = useToolOutput<ComponentOutput>();
  const theme = useTheme();

  // Fallback para props essenciais
  const title = toolOutput?.title || toolInput?.title || 'Default';
  const data = toolOutput?.data || toolInput?.data || [];

  // Early return se dados críticos faltarem
  if (!toolInput?.id) {
    return null;
  }

  // Renderizar componente...
}
```

**Template para nova tool:**

```typescript
// toolName.ts
export async function toolNameHandler(input: Input, userId: string) {
  // ... lógica ...

  return {
    structuredContent: { /* ... */ },
    component: {
      type: 'expanded', // ou 'fullscreen'
      name: 'ComponentName',
      props: {
        // SEMPRE incluir TODOS os dados que o componente precisa:
        id: result.id,
        title: result.title,
        items: result.items || [],  // Arrays nunca undefined
        timestamp: new Date().toISOString(),  // ISO 8601
        // ... todos os campos da interface ComponentInput
      }
    },
    textContent: '...'
  };
}
```

---

## 🚀 Aplicar Correções

```bash
# 1. Fazer backup
git add .
git commit -m "backup antes de aplicar correções de integração"

# 2. Aplicar correções nos arquivos listados acima

# 3. Testar cada componente

# 4. Commit se tudo funcionar
git add .
git commit -m "fix: corrigir integração ChatGPT ↔ Components (SubtaskSuggestions, TaskBreakdown, ContextAnalysis)"

# 5. Aguardar debug do FocusTimer
```

---

**Última atualização:** 12 de outubro de 2025  
**Autor:** AI Assistant  
**Reviewed by:** Aguardando code review
