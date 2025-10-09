/**
 * 🧪 Testes de Metadata - MCP Tools
 * 
 * Valida que todas as tools seguem as diretrizes da OpenAI Apps SDK
 * e têm metadata completa e consistente.
 */

import { describe, it, expect } from 'vitest';
import { TOOL_REGISTRY } from '@/lib/mcp/tools';
import { validateToolMetadata } from '@/lib/mcp/types/metadata';

describe('MCP Tool Metadata - Completude', () => {
  it('todas as tools devem ter metadata completa', () => {
    Object.entries(TOOL_REGISTRY).forEach(([toolName, { metadata }]) => {
      // Nome
      expect(metadata.name, `Tool ${toolName}: deve ter nome`).toBeTruthy();
      expect(metadata.name, `Tool ${toolName}: nome deve corresponder à chave`).toBe(toolName);

      // Descrição
      expect(metadata.description, `Tool ${toolName}: deve ter descrição`).toBeTruthy();
      expect(
        metadata.description.includes('Use this'),
        `Tool ${toolName}: descrição deve conter "Use this when..."`
      ).toBe(true);

      // Input Schema
      expect(metadata.inputSchema, `Tool ${toolName}: deve ter inputSchema`).toBeTruthy();
      expect(metadata.inputSchema.type, `Tool ${toolName}: inputSchema deve ser object`).toBe('object');
      expect(metadata.inputSchema.properties, `Tool ${toolName}: deve ter properties`).toBeTruthy();

      // Metadata (_meta)
      expect(metadata._meta, `Tool ${toolName}: deve ter _meta`).toBeTruthy();
    });
  });

  it('todas as tools devem ter auth requirements definidos', () => {
    Object.entries(TOOL_REGISTRY).forEach(([toolName, { metadata }]) => {
      expect(
        metadata._meta.requiresAuth,
        `Tool ${toolName}: deve ter requiresAuth definido`
      ).toBeDefined();
      expect(
        metadata._meta.allowAnonymous,
        `Tool ${toolName}: deve ter allowAnonymous definido`
      ).toBeDefined();
      expect(
        metadata._meta.authScopes,
        `Tool ${toolName}: deve ter authScopes`
      ).toBeTruthy();
      expect(
        Array.isArray(metadata._meta.authScopes),
        `Tool ${toolName}: authScopes deve ser array`
      ).toBe(true);
      expect(
        metadata._meta.authScopes!.length,
        `Tool ${toolName}: deve ter pelo menos 1 authScope`
      ).toBeGreaterThan(0);
    });
  });

  it('todas as tools devem ter output template', () => {
    Object.entries(TOOL_REGISTRY).forEach(([toolName, { metadata }]) => {
      expect(
        metadata._meta['openai/outputTemplate'],
        `Tool ${toolName}: deve ter openai/outputTemplate`
      ).toBeTruthy();
    });
  });

  it('todas as tools devem ter category', () => {
    const validCategories = ['productivity', 'analysis', 'management', 'timer'];

    Object.entries(TOOL_REGISTRY).forEach(([toolName, { metadata }]) => {
      expect(
        metadata._meta.category,
        `Tool ${toolName}: deve ter category`
      ).toBeTruthy();
      expect(
        validCategories,
        `Tool ${toolName}: category deve ser válida`
      ).toContain(metadata._meta.category);
    });
  });

  it('todas as tools devem ter tags', () => {
    Object.entries(TOOL_REGISTRY).forEach(([toolName, { metadata }]) => {
      expect(
        metadata._meta.tags,
        `Tool ${toolName}: deve ter tags`
      ).toBeTruthy();
      expect(
        Array.isArray(metadata._meta.tags),
        `Tool ${toolName}: tags deve ser array`
      ).toBe(true);
      expect(
        metadata._meta.tags!.length,
        `Tool ${toolName}: deve ter pelo menos 1 tag`
      ).toBeGreaterThan(0);
    });
  });

  it('todas as tools devem ter rate limit tier', () => {
    const validTiers = ['low', 'medium', 'high'];

    Object.entries(TOOL_REGISTRY).forEach(([toolName, { metadata }]) => {
      expect(
        metadata._meta.rateLimitTier,
        `Tool ${toolName}: deve ter rateLimitTier`
      ).toBeTruthy();
      expect(
        validTiers,
        `Tool ${toolName}: rateLimitTier deve ser válido`
      ).toContain(metadata._meta.rateLimitTier);
    });
  });

  it('validação completa com helper validateToolMetadata', () => {
    Object.entries(TOOL_REGISTRY).forEach(([toolName, { metadata }]) => {
      const isValid = validateToolMetadata(metadata);
      expect(isValid, `Tool ${toolName}: deve passar validação completa`).toBe(true);
    });
  });
});

describe('MCP Tool Metadata - Consistência Read/Write', () => {
  it('tools de escrita devem ter requiresConfirmation=true', () => {
    const writeTools = [
      'createHyperfocus',
      'createTask',
      'createAlternancy',
      'breakIntoSubtasks',
    ];

    writeTools.forEach((toolName) => {
      const metadata = TOOL_REGISTRY[toolName].metadata;
      expect(metadata._meta.readOnly, `${toolName}: readOnly deve ser false`).toBe(false);
      expect(
        metadata._meta.requiresConfirmation,
        `${toolName}: requiresConfirmation deve ser true`
      ).toBe(true);
    });
  });

  it('tools de leitura devem ter readOnly=true', () => {
    const readTools = ['listHyperfocus', 'getHyperfocus', 'analyzeContext'];

    readTools.forEach((toolName) => {
      const metadata = TOOL_REGISTRY[toolName].metadata;
      expect(metadata._meta.readOnly, `${toolName}: deve ser readOnly`).toBe(true);
    });
  });

  it('tools de escrita simples não devem exigir confirmação', () => {
    const simpleWriteTools = ['updateTaskStatus', 'startFocusTimer', 'endFocusTimer'];

    simpleWriteTools.forEach((toolName) => {
      const metadata = TOOL_REGISTRY[toolName].metadata;
      expect(
        metadata._meta.requiresConfirmation,
        `${toolName}: confirmação não necessária para operações simples`
      ).toBe(false);
    });
  });
});

describe('MCP Tool Metadata - Auth Scopes', () => {
  it('todas as tools devem requerer autenticação', () => {
    Object.entries(TOOL_REGISTRY).forEach(([toolName, { metadata }]) => {
      expect(
        metadata._meta.requiresAuth,
        `${toolName}: deve requerer autenticação`
      ).toBe(true);
      expect(
        metadata._meta.allowAnonymous,
        `${toolName}: não deve permitir acesso anônimo`
      ).toBe(false);
    });
  });

  it('tools de hiperfoco devem ter scopes corretos', () => {
    const hyperfocusReadTools = ['listHyperfocus', 'getHyperfocus'];
    const hyperfocusWriteTools = ['createHyperfocus'];

    hyperfocusReadTools.forEach((toolName) => {
      const metadata = TOOL_REGISTRY[toolName].metadata;
      expect(
        metadata._meta.authScopes,
        `${toolName}: deve incluir hyperfocus:read`
      ).toContain('hyperfocus:read');
    });

    hyperfocusWriteTools.forEach((toolName) => {
      const metadata = TOOL_REGISTRY[toolName].metadata;
      expect(
        metadata._meta.authScopes,
        `${toolName}: deve incluir hyperfocus:write`
      ).toContain('hyperfocus:write');
    });
  });

  it('tools de análise devem ter scope ai:analyze', () => {
    const analysisTools = ['analyzeContext', 'breakIntoSubtasks'];

    analysisTools.forEach((toolName) => {
      const metadata = TOOL_REGISTRY[toolName].metadata;
      expect(
        metadata._meta.authScopes,
        `${toolName}: deve incluir ai:analyze`
      ).toContain('ai:analyze');
    });
  });
});

describe('MCP Tool Metadata - Categories & Tags', () => {
  it('tools devem estar nas categorias corretas', () => {
    const categoryMapping = {
      management: ['createHyperfocus', 'listHyperfocus', 'getHyperfocus', 'createTask', 'updateTaskStatus'],
      analysis: ['analyzeContext', 'breakIntoSubtasks'],
      timer: ['startFocusTimer', 'endFocusTimer'],
      productivity: ['createAlternancy'],
    };

    Object.entries(categoryMapping).forEach(([category, tools]) => {
      tools.forEach((toolName) => {
        const metadata = TOOL_REGISTRY[toolName].metadata;
        expect(
          metadata._meta.category,
          `${toolName}: deve estar na categoria ${category}`
        ).toBe(category);
      });
    });
  });

  it('tags devem ser relevantes para cada tool', () => {
    // createHyperfocus
    const createHfTags = TOOL_REGISTRY.createHyperfocus.metadata._meta.tags!;
    expect(createHfTags).toContain('hyperfocus');
    expect(createHfTags).toContain('create');

    // analyzeContext
    const analyzeTags = TOOL_REGISTRY.analyzeContext.metadata._meta.tags!;
    expect(analyzeTags).toContain('ai');
    expect(analyzeTags).toContain('analysis');

    // startFocusTimer
    const timerTags = TOOL_REGISTRY.startFocusTimer.metadata._meta.tags!;
    expect(timerTags).toContain('timer');
    expect(timerTags).toContain('focus');
  });
});

describe('MCP Tool Metadata - Rate Limiting', () => {
  it('tools de AI devem ter rate limit high', () => {
    const aiTools = ['analyzeContext', 'breakIntoSubtasks'];

    aiTools.forEach((toolName) => {
      const metadata = TOOL_REGISTRY[toolName].metadata;
      expect(
        metadata._meta.rateLimitTier,
        `${toolName}: deve ter rate limit high (AI consome recursos)`
      ).toBe('high');
    });
  });

  it('tools de leitura devem ter rate limit low', () => {
    const readTools = ['listHyperfocus', 'getHyperfocus', 'updateTaskStatus', 'startFocusTimer', 'endFocusTimer'];

    readTools.forEach((toolName) => {
      const metadata = TOOL_REGISTRY[toolName].metadata;
      expect(
        metadata._meta.rateLimitTier,
        `${toolName}: deve ter rate limit low (operação simples)`
      ).toBe('low');
    });
  });

  it('tools de criação devem ter rate limit medium', () => {
    const createTools = ['createHyperfocus', 'createTask', 'createAlternancy'];

    createTools.forEach((toolName) => {
      const metadata = TOOL_REGISTRY[toolName].metadata;
      expect(
        metadata._meta.rateLimitTier,
        `${toolName}: deve ter rate limit medium (operação de escrita)`
      ).toBe('medium');
    });
  });
});

describe('MCP Tool Metadata - Output Templates', () => {
  it('output templates devem corresponder aos componentes existentes', () => {
    const expectedTemplates = {
      createHyperfocus: 'HyperfocusCard',
      listHyperfocus: 'HyperfocusList',
      getHyperfocus: 'HyperfocusDetail',
      createTask: 'TaskBreakdown',
      updateTaskStatus: 'TaskBreakdown',
      breakIntoSubtasks: 'SubtaskSuggestions',
      startFocusTimer: 'FocusTimer',
      endFocusTimer: 'FocusSessionSummary',
      analyzeContext: 'ContextAnalysis',
      createAlternancy: 'AlternancyFlow',
    };

    Object.entries(expectedTemplates).forEach(([toolName, expectedTemplate]) => {
      const metadata = TOOL_REGISTRY[toolName].metadata;
      expect(
        metadata._meta['openai/outputTemplate'],
        `${toolName}: template deve ser ${expectedTemplate}`
      ).toBe(expectedTemplate);
    });
  });
});

describe('MCP Tool Metadata - Descrições', () => {
  it('descrições devem começar com sentença completa', () => {
    Object.entries(TOOL_REGISTRY).forEach(([toolName, { metadata }]) => {
      const firstLine = metadata.description.split('\n')[0];
      expect(
        firstLine.length,
        `${toolName}: primeira linha deve ser significativa`
      ).toBeGreaterThan(20);
    });
  });

  it('descrições devem conter seção "Use this when"', () => {
    Object.entries(TOOL_REGISTRY).forEach(([toolName, { metadata }]) => {
      expect(
        metadata.description.includes('Use this'),
        `${toolName}: deve conter seção "Use this when"`
      ).toBe(true);
    });
  });

  it('descrições devem conter exemplos', () => {
    Object.entries(TOOL_REGISTRY).forEach(([toolName, { metadata }]) => {
      const hasExamples =
        metadata.description.includes('Example') || metadata.description.includes('→');
      expect(hasExamples, `${toolName}: deve conter exemplos de uso`).toBe(true);
    });
  });
});

describe('MCP Tool Metadata - Input Schemas', () => {
  it('todos os parâmetros devem ter description', () => {
    Object.entries(TOOL_REGISTRY).forEach(([toolName, { metadata }]) => {
      const properties = metadata.inputSchema.properties;
      Object.entries(properties).forEach(([paramName, paramSchema]: [string, Record<string, unknown>]) => {
        expect(
          paramSchema.description,
          `${toolName}.${paramName}: deve ter description`
        ).toBeTruthy();
      });
    });
  });

  it('parâmetros numéricos devem ter min/max quando aplicável', () => {
    const numericParams = [
      { tool: 'createHyperfocus', param: 'estimatedTimeMinutes' },
      { tool: 'startFocusTimer', param: 'durationMinutes' },
      { tool: 'breakIntoSubtasks', param: 'numSubtasks' },
    ];

    numericParams.forEach(({ tool, param }) => {
      const schema = TOOL_REGISTRY[tool].metadata.inputSchema.properties[param];
      expect(schema.minimum, `${tool}.${param}: deve ter minimum`).toBeDefined();
      expect(schema.maximum, `${tool}.${param}: deve ter maximum`).toBeDefined();
    });
  });

  it('parâmetros de string devem ter maxLength quando aplicável', () => {
    const stringParams = [
      { tool: 'createHyperfocus', param: 'title' },
      { tool: 'createTask', param: 'title' },
      { tool: 'breakIntoSubtasks', param: 'taskDescription' },
    ];

    stringParams.forEach(({ tool, param }) => {
      const schema = TOOL_REGISTRY[tool].metadata.inputSchema.properties[param];
      expect(
        schema.maxLength || schema.minLength,
        `${tool}.${param}: deve ter length constraints`
      ).toBeDefined();
    });
  });
});

describe('MCP Tool Metadata - Consistência Geral', () => {
  it('deve haver exatamente 10 tools registradas', () => {
    const toolCount = Object.keys(TOOL_REGISTRY).length;
    expect(toolCount, 'Devem existir 10 tools').toBe(10);
  });

  it('todas as tools devem ter handler e metadata', () => {
    Object.entries(TOOL_REGISTRY).forEach(([toolName, entry]) => {
      expect(entry.handler, `${toolName}: deve ter handler`).toBeTruthy();
      expect(entry.metadata, `${toolName}: deve ter metadata`).toBeTruthy();
      expect(typeof entry.handler, `${toolName}: handler deve ser função`).toBe('function');
    });
  });

  it('não deve haver tools duplicadas', () => {
    const names = Object.values(TOOL_REGISTRY).map((entry) => entry.metadata.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size, 'Não deve haver nomes duplicados').toBe(names.length);
  });
});

