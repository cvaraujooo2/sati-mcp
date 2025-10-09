# 🚀 Guia Rápido - Metadata MCP Tools

**Para:** Desenvolvedores  
**Tempo de leitura:** 5 minutos

---

## 📋 Quando Criar uma Nova Tool

### 1️⃣ Crie o Handler

```typescript
// src/lib/mcp/tools/minhaNovaToolts
import { z } from 'zod';
import { McpToolMetadata, AUTH_SCOPES } from '../types/metadata';

// Schema de validação
export const minhaNovaToolSchema = z.object({
  param1: z.string(),
  param2: z.number().min(1).max(100),
});

export type MinhaNovaToolInput = z.infer<typeof minhaNovaToolSchema>;

// Handler
export async function minhaNovaToolHandler(
  input: MinhaNovaToolInput,
  userId: string
) {
  // Implementação aqui
  return {
    structuredContent: { /* ... */ },
    component: { /* ... */ }
  };
}
```

---

### 2️⃣ Defina a Metadata

```typescript
export const minhaNovaToolMetadata: McpToolMetadata = {
  name: 'minhaNovaТool',
  
  // ⚠️ IMPORTANTE: Sempre começar com "Use this when:"
  description: `Breve descrição da tool.

Use this tool when:
- Situação 1
- Situação 2
- Situação 3

Contexto neurodivergente (se aplicável).

Examples:
- "Prompt exemplo 1" → Resultado esperado
- "Prompt exemplo 2" → Resultado esperado`,

  inputSchema: {
    type: 'object',
    properties: {
      param1: {
        type: 'string',
        description: 'Descrição clara do parâmetro',
      },
      param2: {
        type: 'number',
        description: 'Outro parâmetro com limites',
        minimum: 1,
        maximum: 100,
      },
    },
    required: ['param1'],
  },

  _meta: {
    // === Operação ===
    readOnly: false,              // true se só ler dados
    requiresConfirmation: true,   // true para criações importantes
    
    // === Auth ===
    requiresAuth: true,           // Sempre true (por enquanto)
    allowAnonymous: false,        // Sempre false (por enquanto)
    authScopes: [AUTH_SCOPES.HYPERFOCUS_WRITE], // Escopos necessários
    
    // === Output ===
    'openai/outputTemplate': 'MeuComponente',  // Nome do componente React
    
    // === Categorização ===
    category: 'management',       // management | analysis | timer | productivity
    tags: ['tag1', 'tag2', 'tag3'], // 3-5 tags descritivas
    
    // === Rate Limiting ===
    rateLimitTier: 'medium',      // low | medium | high
  },
};
```

---

### 3️⃣ Registre no TOOL_REGISTRY

```typescript
// src/lib/mcp/tools/index.ts
import { minhaNovaToolHandler, minhaNovaToolMetadata } from './minhaNovaТool';

export const TOOL_REGISTRY = {
  // ... outras tools
  minhaNovaТool: {
    handler: minhaNovaToolHandler,
    metadata: minhaNovaToolMetadata,
  },
} as const;
```

---

## 🎯 Escolha os Valores Corretos

### `readOnly`
- ✅ `true` → Tool **só lê** dados (GET, LIST)
- ✅ `false` → Tool **modifica** dados (CREATE, UPDATE, DELETE)

### `requiresConfirmation`
- ✅ `true` → Operações importantes (criar, deletar, AI)
- ✅ `false` → Operações simples e reversíveis (marcar como concluído, iniciar timer)

### `category`
| Categoria | Quando Usar | Exemplos |
|-----------|-------------|----------|
| **management** | Gestão de dados (CRUD) | createHyperfocus, listTasks |
| **analysis** | Análise com AI ou lógica complexa | analyzeContext, breakIntoSubtasks |
| **timer** | Timers e sessões de foco | startTimer, endTimer |
| **productivity** | Ferramentas de produtividade | createAlternancy |

### `rateLimitTier`
| Tier | Quando Usar | Exemplos |
|------|-------------|----------|
| **low** | Leitura simples, operações leves | list, get, update simples |
| **medium** | Criação de dados, escrita | create, delete |
| **high** | AI, processamento pesado | analyzeContext, breakIntoSubtasks |

### `authScopes`
```typescript
// Leitura
[AUTH_SCOPES.HYPERFOCUS_READ]
[AUTH_SCOPES.TASKS_READ]

// Escrita
[AUTH_SCOPES.HYPERFOCUS_WRITE]
[AUTH_SCOPES.TASKS_WRITE]

// AI
[AUTH_SCOPES.AI_ANALYZE]

// Múltiplos
[AUTH_SCOPES.HYPERFOCUS_READ, AUTH_SCOPES.TASKS_READ]
```

---

## ✍️ Escreva Boas Descrições

### ✅ BOM
```typescript
description: `Creates a new hyperfocus area to help neurodivergent users organize an intense interest or project.

Use this tool when:
- User mentions wanting to start a new project or learn something
- User has multiple interests and needs to structure one of them
- User says "organize this" or "help me focus on X"

Perfect for ADHD/autistic users managing multiple passionate interests.

Examples:
- "I want to learn React" → Create hyperfocus "Aprender React"
- "Help me organize my music production" → Create hyperfocus "Produção Musical"`
```

### ❌ RUIM
```typescript
description: "Creates a hyperfocus."
```

**Por quê?**
- ❌ Muito curto
- ❌ Sem "Use this when..."
- ❌ Sem exemplos
- ❌ Sem contexto

---

## 🧪 Adicione Golden Prompts

**Arquivo:** `docs/core/GOLDEN-PROMPTS.md`

```markdown
### Minha Nova Tool
**Prompt:** "Exemplo de prompt do usuário"
**Tool esperada:** minhaNovaТool
**Args esperados:**
```json
{
  "param1": "valor",
  "param2": 42
}
```
**Resultado esperado:** Componente X com dados Y
```

---

## ✅ Adicione Testes

**Arquivo:** `tests/unit/metadata.test.ts`

```typescript
it('minhaNovaТool deve ter metadata completa', () => {
  const metadata = TOOL_REGISTRY.minhaNovaТool.metadata;
  
  expect(metadata.name).toBe('minhaNovaТool');
  expect(metadata._meta.category).toBe('management');
  expect(metadata._meta.requiresAuth).toBe(true);
  expect(metadata._meta['openai/outputTemplate']).toBe('MeuComponente');
});
```

---

## 🔍 Valide Sua Tool

### 1. Linting
```bash
npm run lint
```

### 2. Testes
```bash
npm run test:unit
```

### 3. Validação Manual
```typescript
import { validateToolMetadata } from '@/lib/mcp/types/metadata';

const isValid = validateToolMetadata(minhaNovaToolMetadata);
console.log('Metadata válida?', isValid);
```

### 4. MCP Inspector
```bash
npm run mcp:start
mcp-inspector test minhaNovaТool
```

---

## 📊 Checklist

Antes de fazer commit, verifique:

- [ ] Handler implementado com type-safety
- [ ] Metadata completa com todos os campos
- [ ] Descrição começa com "Use this when:"
- [ ] Exemplos incluídos na descrição
- [ ] Category correta escolhida
- [ ] 3-5 tags relevantes
- [ ] Auth scopes definidos
- [ ] Output template especificado
- [ ] Rate limit tier adequado
- [ ] Golden prompt adicionado
- [ ] Teste unitário criado
- [ ] Sem erros de linting
- [ ] Testes passando

---

## 🆘 Problemas Comuns

### "Property X does not exist on type Y"
✅ **Solução:** Importar `McpToolMetadata` do arquivo correto

```typescript
import { McpToolMetadata } from '../types/metadata';
```

---

### "Metadata não válida no teste"
✅ **Solução:** Verificar se todos os campos obrigatórios estão presentes

```typescript
_meta: {
  readOnly: false,
  requiresConfirmation: true,
  requiresAuth: true,           // ⚠️ Obrigatório
  allowAnonymous: false,        // ⚠️ Obrigatório
  authScopes: [...],            // ⚠️ Obrigatório
  'openai/outputTemplate': '...', // ⚠️ Obrigatório
  category: '...',              // ⚠️ Obrigatório
  tags: [...],                  // ⚠️ Obrigatório
  rateLimitTier: '...',         // ⚠️ Obrigatório
}
```

---

### "ChatGPT não está encontrando minha tool"
✅ **Soluções:**
1. Verificar se descrição tem "Use this when:"
2. Adicionar mais exemplos na descrição
3. Verificar se tool está registrada em `TOOL_REGISTRY`
4. Testar com golden prompt específico

---

## 📚 Referências Rápidas

- **Tipos:** `src/lib/mcp/types/metadata.ts`
- **Exemplos:** Qualquer tool em `src/lib/mcp/tools/`
- **Golden Prompts:** `docs/core/GOLDEN-PROMPTS.md`
- **Testes:** `tests/unit/metadata.test.ts`
- **Diretrizes OpenAI:** `docs/core/ANALISE-DIRETRIZES-OPENAI.md`

---

## 💡 Dicas Pro

1. **Copie de uma tool similar** → Menos erros, mais rápido
2. **Teste descrição com ChatGPT** → Veja se ele entende
3. **Priorize clareza** → Melhor longo e claro que curto e confuso
4. **Use emojis nos exemplos** → Mais visual, mais fácil de ler
5. **Adicione contexto neurodivergente** → Nosso diferencial!

---

**Pronto para criar sua tool?** 🚀

Se tiver dúvidas, consulte os exemplos existentes ou o documento completo de melhorias.

---

**Última atualização:** 09/10/2025  
**Mantido por:** Time Sati MCP

