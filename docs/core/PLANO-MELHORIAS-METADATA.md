# 🔧 Plano de Melhorias - Metadata MCP Tools

**Data:** 09/10/2025  
**Versão:** 1.0  
**Status:** 📋 Planejamento

---

## 🎯 Objetivo

Alinhar 100% com as diretrizes OpenAI Apps SDK adicionando:
1. ✅ Auth requirements na metadata
2. ✅ Output templates para ChatGPT
3. ✅ Golden prompts para testes

**Tempo estimado:** 3-4 horas  
**Impacto:** 🟢 Baixo risco, alto benefício

---

## 📝 Checklist de Implementação

### Fase 1: Atualizar Metadatas (1-2h)

#### 1.1 Definir Auth Metadata Standard

**Criar:** `src/lib/mcp/types/metadata.ts`

```typescript
/**
 * Metadata padrão para MCP Tools seguindo OpenAI Apps SDK
 */

export interface McpToolMetadata {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  _meta: {
    // Existing
    readOnly: boolean;
    requiresConfirmation: boolean;
    
    // New - Auth requirements
    requiresAuth: boolean;
    allowAnonymous: boolean;
    authScopes?: string[];
    
    // New - Output hints
    'openai/outputTemplate'?: string;
    
    // New - Rate limiting hints
    rateLimitTier?: 'low' | 'medium' | 'high';
    
    // New - Categories for discovery
    category?: 'productivity' | 'analysis' | 'management' | 'timer';
    tags?: string[];
  };
}
```

#### 1.2 Atualizar Cada Tool Metadata

**Template padrão:**

```typescript
export const [TOOL_NAME]Metadata: McpToolMetadata = {
  name: '[toolName]',
  description: `[Description starting with "Use this when..."]`,
  inputSchema: { ... },
  _meta: {
    // Read/Write
    readOnly: [true/false],
    requiresConfirmation: [true/false],
    
    // Auth (✅ NOVO)
    requiresAuth: true,
    allowAnonymous: false,
    authScopes: ['hyperfocus:read', 'hyperfocus:write'],
    
    // Output (✅ NOVO)
    'openai/outputTemplate': '[ComponentName]',
    
    // Categorization (✅ NOVO)
    category: '[category]',
    tags: ['[tag1]', '[tag2]'],
    
    // Rate limiting (✅ NOVO)
    rateLimitTier: 'medium',
  }
};
```

---

### Fase 1.1: Tools de Hiperfoco

#### ✅ createHyperfocus.ts

```typescript
export const createHyperfocusMetadata: McpToolMetadata = {
  name: 'createHyperfocus',
  description: `Creates a new hyperfocus area to help neurodivergent users organize an intense interest or project.

Use this tool when:
- User mentions wanting to start a new project or learn something
- User has multiple interests and needs to structure one of them
- User says "organize this" or "help me focus on X"
- User seems overwhelmed and needs to break down a passion into manageable parts

Perfect for ADHD/autistic users managing multiple passionate interests.

Examples:
- "I want to learn React" → Create hyperfocus "Aprender React"
- "Help me organize my music production project" → Create hyperfocus "Produção Musical"
- "I need to focus on writing my book" → Create hyperfocus "Escrever Livro"`,
  inputSchema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'The title/name of the hyperfocus (1-100 characters)',
        minLength: 1,
        maxLength: 100
      },
      description: {
        type: 'string',
        description: 'Optional description of what this hyperfocus is about (max 500 characters)',
        maxLength: 500
      },
      color: {
        type: 'string',
        enum: ['red', 'green', 'blue', 'orange', 'purple', 'pink', 'brown', 'gray'],
        description: 'Color to identify this hyperfocus visually',
        default: 'blue'
      },
      estimatedTimeMinutes: {
        type: 'number',
        description: 'Estimated total time needed for this hyperfocus in minutes (5-480)',
        minimum: 5,
        maximum: 480
      }
    },
    required: ['title']
  },
  _meta: {
    readOnly: false,
    requiresConfirmation: true,
    requiresAuth: true,              // ✅ NOVO
    allowAnonymous: false,            // ✅ NOVO
    authScopes: ['hyperfocus:write'], // ✅ NOVO
    'openai/outputTemplate': 'HyperfocusCard', // ✅ NOVO
    category: 'management',           // ✅ NOVO
    tags: ['hyperfocus', 'create', 'adhd', 'neurodivergent'], // ✅ NOVO
    rateLimitTier: 'medium'          // ✅ NOVO
  }
};
```

---

#### ✅ listHyperfocus.ts

```typescript
_meta: {
  readOnly: true,                    // ✅ READ ONLY
  requiresConfirmation: false,
  requiresAuth: true,
  allowAnonymous: false,
  authScopes: ['hyperfocus:read'],
  'openai/outputTemplate': 'HyperfocusList',
  category: 'management',
  tags: ['hyperfocus', 'list', 'read'],
  rateLimitTier: 'low'
}
```

---

#### ✅ getHyperfocus.ts

```typescript
_meta: {
  readOnly: true,
  requiresConfirmation: false,
  requiresAuth: true,
  allowAnonymous: false,
  authScopes: ['hyperfocus:read', 'tasks:read'],
  'openai/outputTemplate': 'HyperfocusDetail',
  category: 'management',
  tags: ['hyperfocus', 'details', 'read'],
  rateLimitTier: 'low'
}
```

---

### Fase 1.2: Tools de Tarefas

#### ✅ createTask.ts

```typescript
_meta: {
  readOnly: false,
  requiresConfirmation: true,
  requiresAuth: true,
  allowAnonymous: false,
  authScopes: ['tasks:write'],
  'openai/outputTemplate': 'TaskBreakdown',
  category: 'management',
  tags: ['tasks', 'create', 'subtasks'],
  rateLimitTier: 'medium'
}
```

---

#### ✅ updateTaskStatus.ts

```typescript
_meta: {
  readOnly: false,
  requiresConfirmation: false,      // Toggle não precisa confirmação
  requiresAuth: true,
  allowAnonymous: false,
  authScopes: ['tasks:write'],
  'openai/outputTemplate': 'TaskBreakdown',
  category: 'management',
  tags: ['tasks', 'update', 'complete'],
  rateLimitTier: 'low'
}
```

---

#### ✅ breakIntoSubtasks.ts

```typescript
_meta: {
  readOnly: false,                  // Pode criar tarefas se autoCreate=true
  requiresConfirmation: true,
  requiresAuth: true,
  allowAnonymous: false,
  authScopes: ['tasks:write', 'ai:analyze'],
  'openai/outputTemplate': 'SubtaskSuggestions',
  category: 'analysis',
  tags: ['tasks', 'ai', 'breakdown', 'intelligent'],
  rateLimitTier: 'high'            // Análise AI consome mais recursos
}
```

---

### Fase 1.3: Tools de Timer

#### ✅ startFocusTimer.ts

```typescript
_meta: {
  readOnly: false,
  requiresConfirmation: false,      // Timer pode começar imediatamente
  requiresAuth: true,
  allowAnonymous: false,
  authScopes: ['timer:write'],
  'openai/outputTemplate': 'FocusTimer',
  category: 'timer',
  tags: ['timer', 'focus', 'pomodoro', 'adhd'],
  rateLimitTier: 'low'
}
```

---

#### ✅ endFocusTimer.ts

```typescript
_meta: {
  readOnly: false,
  requiresConfirmation: false,
  requiresAuth: true,
  allowAnonymous: false,
  authScopes: ['timer:write'],
  'openai/outputTemplate': 'FocusSessionSummary',
  category: 'timer',
  tags: ['timer', 'focus', 'summary', 'statistics'],
  rateLimitTier: 'low'
}
```

---

### Fase 1.4: Tools de Análise

#### ✅ analyzeContext.ts

```typescript
_meta: {
  readOnly: true,                   // Só analisa, não muda dados
  requiresConfirmation: false,
  requiresAuth: true,
  allowAnonymous: false,
  authScopes: ['ai:analyze', 'hyperfocus:read'],
  'openai/outputTemplate': 'ContextAnalysis',
  category: 'analysis',
  tags: ['ai', 'analysis', 'intelligent', 'complexity', 'time-estimate'],
  rateLimitTier: 'high'
}
```

---

#### ✅ createAlternancy.ts

```typescript
_meta: {
  readOnly: false,
  requiresConfirmation: true,
  requiresAuth: true,
  allowAnonymous: false,
  authScopes: ['alternancy:write', 'hyperfocus:read'],
  'openai/outputTemplate': 'AlternancyFlow',
  category: 'productivity',
  tags: ['alternancy', 'flow', 'adhd', 'context-switching'],
  rateLimitTier: 'medium'
}
```

---

## 📊 Tabela Resumo de Metadatas

| Tool | readOnly | requiresAuth | Confirmation | Output Template | Category | Rate Limit |
|------|----------|--------------|--------------|-----------------|----------|------------|
| createHyperfocus | ❌ | ✅ | ✅ | HyperfocusCard | management | medium |
| listHyperfocus | ✅ | ✅ | ❌ | HyperfocusList | management | low |
| getHyperfocus | ✅ | ✅ | ❌ | HyperfocusDetail | management | low |
| createTask | ❌ | ✅ | ✅ | TaskBreakdown | management | medium |
| updateTaskStatus | ❌ | ✅ | ❌ | TaskBreakdown | management | low |
| breakIntoSubtasks | ❌ | ✅ | ✅ | SubtaskSuggestions | analysis | high |
| startFocusTimer | ❌ | ✅ | ❌ | FocusTimer | timer | low |
| endFocusTimer | ❌ | ✅ | ❌ | FocusSessionSummary | timer | low |
| analyzeContext | ✅ | ✅ | ❌ | ContextAnalysis | analysis | high |
| createAlternancy | ❌ | ✅ | ✅ | AlternancyFlow | productivity | medium |

---

## 🧪 Fase 2: Golden Prompts (1h)

### Criar `tests/golden-prompts.md`

```markdown
# 🧪 Golden Prompts - Sati MCP

Casos de teste para validar discovery de tools pelo ChatGPT.

## ✅ Prompts Diretos (devem funcionar)

### Hiperfoco
1. **"Crie um hiperfoco chamado Aprender TypeScript"**
   - Tool esperada: `createHyperfocus`
   - Args: `{ title: "Aprender TypeScript" }`

2. **"Liste meus hiperfocos"**
   - Tool esperada: `listHyperfocus`
   - Args: `{}`

3. **"Mostre detalhes do hiperfoco X"**
   - Tool esperada: `getHyperfocus`
   - Args: `{ id: "..." }`

### Tarefas
4. **"Adicione uma tarefa 'Estudar interfaces' ao hiperfoco X"**
   - Tool esperada: `createTask`
   - Args: `{ hyperfocusId: "...", title: "Estudar interfaces" }`

5. **"Marque a tarefa Y como concluída"**
   - Tool esperada: `updateTaskStatus`
   - Args: `{ id: "...", completed: true }`

6. **"Quebre esta tarefa em subtarefas: Criar um app React completo"**
   - Tool esperada: `breakIntoSubtasks`
   - Args: `{ taskDescription: "Criar um app React completo" }`

### Timer
7. **"Inicie um timer de 25 minutos para o hiperfoco X"**
   - Tool esperada: `startFocusTimer`
   - Args: `{ hyperfocusId: "...", plannedDurationMinutes: 25 }`

8. **"Finalize o timer atual"**
   - Tool esperada: `endFocusTimer`
   - Args: `{ sessionId: "..." }`

### Análise
9. **"Analise a complexidade do hiperfoco X"**
   - Tool esperada: `analyzeContext`
   - Args: `{ hyperfocusId: "...", analysisType: "complexity" }`

### Alternância
10. **"Crie uma alternância entre hiperfoco A e B"**
    - Tool esperada: `createAlternancy`
    - Args: `{ hyperfocusSessions: [...] }`

---

## 🤔 Prompts Indiretos (contexto guia)

1. **"Estou perdido com esse projeto de React"**
   - Sugestões esperadas: 
     - `createHyperfocus` (criar hiperfoco "Projeto React")
     - `analyzeContext` (analisar complexidade)
     - `breakIntoSubtasks` (quebrar em subtarefas)

2. **"Preciso organizar minhas ideias sobre música"**
   - Tool esperada: `createHyperfocus`
   - ChatGPT deve sugerir criar hiperfoco "Produção Musical"

3. **"Não sei por onde começar nesta tarefa complexa"**
   - Tool esperada: `breakIntoSubtasks`
   - Ou: `analyzeContext` com `analysisType: 'breakdown'`

4. **"Quero focar por meia hora nisso"**
   - Tool esperada: `startFocusTimer`
   - Args: `{ plannedDurationMinutes: 30 }`

---

## ❌ Prompts Negativos (não devem ativar)

1. **"Qual a previsão do tempo?"**
   - Nenhuma tool deve ser chamada
   - ChatGPT deve responder sem usar Sati

2. **"Conte uma piada"**
   - Nenhuma tool deve ser chamada

3. **"Traduza isso para inglês"**
   - Nenhuma tool deve ser chamada

4. **"Pesquise sobre história da Grécia"**
   - Nenhuma tool deve ser chamada
   - A menos que usuário explicitamente mencione "criar hiperfoco sobre isso"

---

## 🎭 Casos Edge

1. **"Crie um hiperfoco sem nome"**
   - Tool: `createHyperfocus`
   - Deve falhar com ValidationError (title obrigatório)

2. **"Inicie timer de 500 minutos"**
   - Tool: `startFocusTimer`
   - Deve falhar (máximo 180 minutos)

3. **"Liste hiperfocos de outro usuário"**
   - Deve retornar vazio (auth scope correto)

4. **"Quebre tarefa muito curta: 'Test'"**
   - Tool: `breakIntoSubtasks`
   - Deve falhar (mínimo 10 caracteres)
```

---

## 🧪 Fase 3: Testes Automatizados (2h)

### Criar `tests/unit/metadata.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { TOOL_REGISTRY } from '@/lib/mcp/tools';

describe('MCP Tool Metadata', () => {
  it('todas as tools devem ter metadata completa', () => {
    Object.entries(TOOL_REGISTRY).forEach(([name, { metadata }]) => {
      expect(metadata.name).toBe(name);
      expect(metadata.description).toBeTruthy();
      expect(metadata.description).toContain('Use this');
      expect(metadata.inputSchema).toBeTruthy();
      expect(metadata._meta).toBeTruthy();
      expect(metadata._meta.requiresAuth).toBeDefined();
      expect(metadata._meta.allowAnonymous).toBeDefined();
    });
  });

  it('tools de escrita devem ter requiresConfirmation=true', () => {
    const writeTools = ['createHyperfocus', 'createTask', 'createAlternancy'];
    
    writeTools.forEach(toolName => {
      const metadata = TOOL_REGISTRY[toolName].metadata;
      expect(metadata._meta.readOnly).toBe(false);
      expect(metadata._meta.requiresConfirmation).toBe(true);
    });
  });

  it('tools de leitura devem ter readOnly=true', () => {
    const readTools = ['listHyperfocus', 'getHyperfocus', 'analyzeContext'];
    
    readTools.forEach(toolName => {
      const metadata = TOOL_REGISTRY[toolName].metadata;
      expect(metadata._meta.readOnly).toBe(true);
    });
  });

  it('todas as tools devem ter outputTemplate', () => {
    Object.entries(TOOL_REGISTRY).forEach(([name, { metadata }]) => {
      expect(metadata._meta['openai/outputTemplate']).toBeTruthy();
    });
  });

  it('todas as tools devem ter category', () => {
    const validCategories = ['productivity', 'analysis', 'management', 'timer'];
    
    Object.entries(TOOL_REGISTRY).forEach(([name, { metadata }]) => {
      expect(validCategories).toContain(metadata._meta.category);
    });
  });

  it('todas as tools devem ter tags', () => {
    Object.entries(TOOL_REGISTRY).forEach(([name, { metadata }]) => {
      expect(metadata._meta.tags).toBeInstanceOf(Array);
      expect(metadata._meta.tags.length).toBeGreaterThan(0);
    });
  });
});
```

---

## 📅 Cronograma de Implementação

### Dia 1 (2-3h)
- ✅ Criar `src/lib/mcp/types/metadata.ts`
- ✅ Atualizar 5 primeiras tools (Hiperfoco + Tarefas)
- ✅ Testar mudanças

### Dia 2 (1-2h)
- ✅ Atualizar 5 últimas tools (Timer + Análise)
- ✅ Criar `tests/golden-prompts.md`
- ✅ Revisar consistência

### Dia 3 (1h)
- ✅ Criar testes automatizados
- ✅ Validar com MCP Inspector
- ✅ Documentar no changelog

---

## ✅ Checklist Final

- [ ] Tipo `McpToolMetadata` criado
- [ ] 10/10 tools com metadata completa
- [ ] Golden prompts documentados
- [ ] Testes automatizados funcionando
- [ ] MCP Inspector validado
- [ ] Changelog atualizado
- [ ] PR aberto e revisado

---

## 🎉 Resultado Esperado

Após implementação:
- ✅ Score OpenAI: **5/5** (100%)
- ✅ Discovery mais preciso
- ✅ Auth documentada
- ✅ UX melhorada no ChatGPT
- ✅ Testes automatizados

---

**Criado em:** 09/10/2025  
**Implementar em:** Sprint atual  
**Prioridade:** 🔸 Média (não-bloqueante, mas recomendado)

