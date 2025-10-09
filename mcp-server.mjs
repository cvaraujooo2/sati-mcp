#!/usr/bin/env node

/**
 * MCP Server STDIO para Sati (Versão com Tools Reais)
 * 
 * Este servidor MCP conecta as tools TypeScript reais via STDIO
 * Para usar com MCP Inspector:
 * Transport Type: STDIO
 * Command: node mcp-server.mjs
 * 
 * Ou via run-mcp.sh
 */

// Carregar variáveis de ambiente do .env.local
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Importar Supabase client
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERROR: Missing Supabase environment variables!');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  console.error('');
  console.error('Current environment:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL || 'NOT SET');
  console.error('  NEXT_PUBLIC_SUPABASE_ANON_KEY:', SUPABASE_KEY ? 'SET (hidden)' : 'NOT SET');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// User ID temporário para testes (em produção viria da auth)
// Usando UUID fixo para testes - em produção viria do sistema de auth
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';

// ============================================================================
// TOOL METADATA (deve sincronizar com src/lib/mcp/tools/)
// ============================================================================

const TOOL_DEFINITIONS = [
  {
    name: 'createHyperfocus',
    description: `Creates a new hyperfocus area to help neurodivergent users organize an intense interest or project.

Use this tool when:
- User mentions wanting to start a new project or learn something
- User has multiple interests and needs to structure one of them
- User says "organize this" or "help me focus on X"

Perfect for ADHD/autistic users managing multiple passionate interests.`,
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'The title/name of the hyperfocus (1-100 characters)',
          minLength: 1,
          maxLength: 100,
        },
        description: {
          type: 'string',
          description: 'Optional description of what this hyperfocus is about (max 500 characters)',
          maxLength: 500,
        },
        color: {
          type: 'string',
          enum: ['red', 'green', 'blue', 'orange', 'purple', 'pink', 'brown', 'gray'],
          description: 'Color to identify this hyperfocus visually',
          default: 'blue',
        },
        estimatedTimeMinutes: {
          type: 'number',
          description: 'Estimated total time needed for this hyperfocus in minutes (5-480)',
          minimum: 5,
          maximum: 480,
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'listHyperfocus',
    description: `Lists all hyperfocus areas for the user, with filtering options.

Use this tool when:
- User asks "what are my hyperfocuses?" or "show my projects"
- User wants to see all their organized interests
- Starting a conversation to show context of existing work`,
    inputSchema: {
      type: 'object',
      properties: {
        archived: {
          type: 'boolean',
          description: 'Filter by archived status (default: false)',
          default: false,
        },
        color: {
          type: 'string',
          enum: ['red', 'green', 'blue', 'orange', 'purple', 'pink', 'brown', 'gray'],
          description: 'Filter by color',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (1-100, default: 20)',
          minimum: 1,
          maximum: 100,
          default: 20,
        },
      },
      required: [],
    },
  },
  {
    name: 'getHyperfocus',
    description: `Gets detailed information about a specific hyperfocus, including tasks and focus sessions.

Use when user wants to see details of a specific project.`,
    inputSchema: {
      type: 'object',
      properties: {
        hyperfocusId: {
          type: 'string',
          description: 'UUID of the hyperfocus to retrieve',
        },
        includeTasks: {
          type: 'boolean',
          description: 'Include tasks in response (default: true)',
          default: true,
        },
      },
      required: ['hyperfocusId'],
    },
  },
  {
    name: 'createTask',
    description: 'Creates a new task inside an existing hyperfocus.',
    inputSchema: {
      type: 'object',
      properties: {
        hyperfocusId: {
          type: 'string',
          description: 'Identifier of the hyperfocus',
        },
        title: {
          type: 'string',
          description: 'Task title (1-200 characters)',
        },
        description: {
          type: 'string',
          description: 'Optional task description',
        },
        estimatedMinutes: {
          type: 'number',
          description: 'Estimated time in minutes (1-480)',
        },
      },
      required: ['hyperfocusId', 'title'],
    },
  },
  {
    name: 'updateTaskStatus',
    description: 'Updates the completion status of a task.',
    inputSchema: {
      type: 'object',
      properties: {
        hyperfocusId: {
          type: 'string',
          description: 'Identifier of the hyperfocus',
        },
        taskId: {
          type: 'string',
          description: 'Identifier of the task',
        },
        completed: {
          type: 'boolean',
          description: 'New completion status',
        },
      },
      required: ['hyperfocusId', 'taskId', 'completed'],
    },
  },
  {
    name: 'breakIntoSubtasks',
    description: `Analyzes a task description and suggests or automatically creates subtasks.

Perfect for neurodivergent users who struggle with task initiation.`,
    inputSchema: {
      type: 'object',
      properties: {
        hyperfocusId: {
          type: 'string',
          description: 'UUID of the hyperfocus where subtasks will be created',
        },
        taskDescription: {
          type: 'string',
          description: 'Description of the task to break down (10-2000 characters)',
        },
        numSubtasks: {
          type: 'number',
          description: 'Number of subtasks to generate (2-10, default: 5)',
          minimum: 2,
          maximum: 10,
          default: 5,
        },
        autoCreate: {
          type: 'boolean',
          description: 'Automatically create the suggested tasks (default: false)',
          default: false,
        },
      },
      required: ['hyperfocusId', 'taskDescription'],
    },
  },
  {
    name: 'startFocusTimer',
    description: `Starts a focused work session with a timer for a specific hyperfocus.

Perfect for ADHD users who benefit from time-boxing.`,
    inputSchema: {
      type: 'object',
      properties: {
        hyperfocusId: {
          type: 'string',
          description: 'UUID of the hyperfocus to focus on',
        },
        durationMinutes: {
          type: 'number',
          description: 'Duration of focus session in minutes (1-180)',
          minimum: 1,
          maximum: 180,
        },
        playSound: {
          type: 'boolean',
          description: 'Play alarm sound when timer ends (default: true)',
          default: true,
        },
      },
      required: ['hyperfocusId', 'durationMinutes'],
    },
  },
  {
    name: 'endFocusTimer',
    description: 'Ends an active focus session and records the results.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: {
          type: 'string',
          description: 'UUID of the focus session to end',
        },
        interrupted: {
          type: 'boolean',
          description: 'Whether the session was interrupted (default: false)',
          default: false,
        },
      },
      required: ['sessionId'],
    },
  },
  {
    name: 'analyzeContext',
    description: `Analyzes the context of a hyperfocus and provides intelligent insights.

Helps users break through analysis paralysis.`,
    inputSchema: {
      type: 'object',
      properties: {
        hyperfocusId: {
          type: 'string',
          description: 'UUID of the hyperfocus to analyze',
        },
        userInput: {
          type: 'string',
          description: 'User context or question (10-2000 characters)',
        },
        analysisType: {
          type: 'string',
          enum: ['complexity', 'time_estimate', 'dependencies', 'breakdown', 'priority'],
          description: 'Type of analysis to perform (default: complexity)',
          default: 'complexity',
        },
      },
      required: ['hyperfocusId', 'userInput'],
    },
  },
  {
    name: 'createAlternancy',
    description: `Creates an alternancy session that rotates between multiple hyperfocuses.

Perfect for neurodivergent users who benefit from structured variety.`,
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name for this alternancy session (optional)',
        },
        hyperfocusSessions: {
          type: 'array',
          description: 'Array of hyperfocuses with their durations (2-5 items)',
          items: {
            type: 'object',
            properties: {
              hyperfocusId: { type: 'string' },
              durationMinutes: { type: 'number', minimum: 5, maximum: 120 },
            },
            required: ['hyperfocusId', 'durationMinutes'],
          },
          minItems: 2,
          maxItems: 5,
        },
        autoStart: {
          type: 'boolean',
          description: 'Automatically start the first session (default: false)',
          default: false,
        },
      },
      required: ['hyperfocusSessions'],
    },
  },
];

// ============================================================================
// MCP SERVER
// ============================================================================

const server = new Server(
  {
    name: 'sati-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handler: Listar Tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  console.error(`[INFO] Listing ${TOOL_DEFINITIONS.length} tools`);
  return {
    tools: TOOL_DEFINITIONS,
  };
});

// Handler: Chamar Tool
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  console.error(`[INFO] Tool called: ${name}`);
  console.error(`[DEBUG] Arguments:`, JSON.stringify(args, null, 2));

  try {
    let result;

    switch (name) {
      case 'createHyperfocus':
        result = await handleCreateHyperfocus(args);
        break;
      case 'listHyperfocus':
        result = await handleListHyperfocus(args);
        break;
      case 'getHyperfocus':
        result = await handleGetHyperfocus(args);
        break;
      case 'createTask':
        result = await handleCreateTask(args);
        break;
      case 'updateTaskStatus':
        result = await handleUpdateTaskStatus(args);
        break;
      case 'breakIntoSubtasks':
        result = await handleBreakIntoSubtasks(args);
        break;
      case 'startFocusTimer':
        result = await handleStartFocusTimer(args);
        break;
      case 'endFocusTimer':
        result = await handleEndFocusTimer(args);
        break;
      case 'analyzeContext':
        result = await handleAnalyzeContext(args);
        break;
      case 'createAlternancy':
        result = await handleCreateAlternancy(args);
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    console.error(`[SUCCESS] Tool ${name} executed successfully`);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    console.error(`[ERROR] Tool ${name} failed:`, error.message);
    throw error;
  }
});

// ============================================================================
// TOOL HANDLERS (Conectam ao Supabase)
// ============================================================================

async function handleCreateHyperfocus(args) {
  const { data, error } = await supabase
    .from('hyperfocus')
    .insert({
      user_id: TEST_USER_ID,
      title: args.title,
      description: args.description || null,
      color: args.color || 'blue',
      estimated_time_minutes: args.estimatedTimeMinutes || null,
    })
    .select()
    .single();

  if (error) throw new Error(`Database error: ${error.message}`);

  return {
    structuredContent: {
      type: 'hyperfocus_created',
      hyperfocusId: data.id,
      title: data.title,
      description: data.description,
      color: data.color,
      estimatedTimeMinutes: data.estimated_time_minutes,
      createdAt: data.created_at,
      taskCount: 0,
    },
    component: {
      type: 'inline',
      name: 'HyperfocusCard',
      props: {
        hyperfocus: {
          id: data.id,
          title: data.title,
          description: data.description,
          color: data.color,
          estimatedTimeMinutes: data.estimated_time_minutes,
          taskCount: 0,
        },
      },
    },
  };
}

async function handleListHyperfocus(args) {
  const { archived = false, color, limit = 20 } = args;

  let query = supabase
    .from('hyperfocus')
    .select('*')
    .eq('user_id', TEST_USER_ID)
    .eq('archived', archived)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (color) {
    query = query.eq('color', color);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Database error: ${error.message}`);

  const hyperfocusWithCounts = await Promise.all(
    (data || []).map(async (hf) => {
      const { count } = await supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('hyperfocus_id', hf.id);

      return {
        id: hf.id,
        title: hf.title,
        description: hf.description,
        color: hf.color,
        estimatedTimeMinutes: hf.estimated_time_minutes,
        createdAt: hf.created_at,
        taskCount: count || 0,
      };
    })
  );

  return {
    structuredContent: {
      type: 'hyperfocus_list',
      count: hyperfocusWithCounts.length,
      hyperfocusList: hyperfocusWithCounts,
    },
  };
}

async function handleGetHyperfocus(args) {
  const { hyperfocusId, includeTasks = true } = args;

  const { data: hf, error: hfError } = await supabase
    .from('hyperfocus')
    .select('*')
    .eq('id', hyperfocusId)
    .eq('user_id', TEST_USER_ID)
    .single();

  if (hfError) throw new Error(`Hyperfocus not found: ${hfError.message}`);

  let tasks = [];
  if (includeTasks) {
    const { data: taskData } = await supabase
      .from('tasks')
      .select('*')
      .eq('hyperfocus_id', hyperfocusId)
      .order('order_index', { ascending: true });

    tasks = taskData || [];
  }

  return {
    structuredContent: {
      type: 'hyperfocus_details',
      hyperfocus: hf,
      tasks,
      statistics: {
        taskCount: tasks.length,
        completedTaskCount: tasks.filter((t) => t.completed).length,
      },
    },
  };
}

async function handleCreateTask(args) {
  const { hyperfocusId, title, description, estimatedMinutes } = args;

  // Verificar hiperfoco existe
  const { data: hf } = await supabase
    .from('hyperfocus')
    .select('id, title')
    .eq('id', hyperfocusId)
    .eq('user_id', TEST_USER_ID)
    .single();

  if (!hf) throw new Error('Hyperfocus not found');

  // Buscar próximo order_index
  const { data: maxOrder } = await supabase
    .from('tasks')
    .select('order_index')
    .eq('hyperfocus_id', hyperfocusId)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = (maxOrder?.order_index ?? -1) + 1;

  // Criar tarefa
  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      hyperfocus_id: hyperfocusId,
      title,
      description: description || null,
      estimated_minutes: estimatedMinutes || null,
      order_index: nextOrder,
    })
    .select()
    .single();

  if (error) throw new Error(`Database error: ${error.message}`);

  // Buscar todas as tarefas
  const { data: allTasks } = await supabase
    .from('tasks')
    .select('id, title, completed')
    .eq('hyperfocus_id', hyperfocusId)
    .order('order_index', { ascending: true });

  return {
    structuredContent: {
      type: 'task_created',
      task,
    },
    component: {
      type: 'inline',
      name: 'TaskBreakdown',
      props: {
        hyperfocusId,
        hyperfocusTitle: hf.title,
        tasks: allTasks || [],
      },
    },
  };
}

async function handleUpdateTaskStatus(args) {
  const { hyperfocusId, taskId, completed } = args;

  // Verificar hiperfoco existe
  const { data: hf } = await supabase
    .from('hyperfocus')
    .select('id, title')
    .eq('id', hyperfocusId)
    .eq('user_id', TEST_USER_ID)
    .single();

  if (!hf) throw new Error('Hyperfocus not found');

  // Atualizar tarefa
  const { error } = await supabase
    .from('tasks')
    .update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq('id', taskId)
    .eq('hyperfocus_id', hyperfocusId);

  if (error) throw new Error(`Database error: ${error.message}`);

  // Buscar todas as tarefas
  const { data: allTasks } = await supabase
    .from('tasks')
    .select('id, title, completed')
    .eq('hyperfocus_id', hyperfocusId)
    .order('order_index', { ascending: true });

  return {
    structuredContent: {
      type: 'task_status_updated',
      taskId,
      completed,
    },
    component: {
      type: 'inline',
      name: 'TaskBreakdown',
      props: {
        hyperfocusId,
        hyperfocusTitle: hf.title,
        tasks: allTasks || [],
      },
    },
  };
}

async function handleBreakIntoSubtasks(args) {
  const { hyperfocusId, taskDescription, numSubtasks = 5, autoCreate = false } = args;

  // Gerar sugestões (heurísticas simples)
  const suggestions = generateSubtaskSuggestions(taskDescription, numSubtasks);

  if (autoCreate) {
    // Criar tarefas no banco
    const { data: hf } = await supabase
      .from('hyperfocus')
      .select('id, title')
      .eq('id', hyperfocusId)
      .eq('user_id', TEST_USER_ID)
      .single();

    if (!hf) throw new Error('Hyperfocus not found');

    const { data: maxOrder } = await supabase
      .from('tasks')
      .select('order_index')
      .eq('hyperfocus_id', hyperfocusId)
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle();

    let nextOrder = (maxOrder?.order_index ?? -1) + 1;

    for (const suggestion of suggestions) {
      await supabase.from('tasks').insert({
        hyperfocus_id: hyperfocusId,
        title: suggestion.title,
        description: suggestion.description,
        estimated_minutes: suggestion.estimatedMinutes,
        order_index: nextOrder++,
      });
    }
  }

  return {
    structuredContent: {
      type: 'subtasks_breakdown',
      suggestions,
      autoCreated: autoCreate,
    },
  };
}

async function handleStartFocusTimer(args) {
  const { hyperfocusId, durationMinutes, playSound = true } = args;

  const { data: session, error } = await supabase
    .from('focus_sessions')
    .insert({
      hyperfocus_id: hyperfocusId,
      planned_duration_minutes: durationMinutes,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(`Database error: ${error.message}`);

  return {
    structuredContent: {
      type: 'focus_timer_started',
      sessionId: session.id,
      durationMinutes,
      playSound,
    },
  };
}

async function handleEndFocusTimer(args) {
  const { sessionId, interrupted = false } = args;

  const { data: session } = await supabase
    .from('focus_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (!session) throw new Error('Session not found');

  const startTime = new Date(session.started_at).getTime();
  const actualMinutes = Math.round((Date.now() - startTime) / 1000 / 60);

  const { error } = await supabase
    .from('focus_sessions')
    .update({
      ended_at: new Date().toISOString(),
      actual_duration_minutes: actualMinutes,
      interrupted,
    })
    .eq('id', sessionId);

  if (error) throw new Error(`Database error: ${error.message}`);

  return {
    structuredContent: {
      type: 'focus_timer_ended',
      sessionId,
      actualMinutes,
      interrupted,
    },
  };
}

async function handleAnalyzeContext(args) {
  const { hyperfocusId, userInput, analysisType = 'complexity' } = args;

  // Análise heurística simples
  const analysis = {
    type: analysisType,
    result: `Analysis of type ${analysisType} for input: "${userInput.slice(0, 50)}..."`,
    recommendation: 'Consider breaking this down into smaller steps.',
  };

  return {
    structuredContent: {
      type: 'context_analysis',
      hyperfocusId,
      analysisType,
      analysis,
    },
  };
}

async function handleCreateAlternancy(args) {
  const { name, hyperfocusSessions, autoStart = false } = args;

  const { data: session, error } = await supabase
    .from('alternancy_sessions')
    .insert({
      user_id: TEST_USER_ID,
      name: name || 'Sessão de Alternância',
      active: true,
    })
    .select()
    .single();

  if (error) throw new Error(`Database error: ${error.message}`);

  // Criar vínculos
  for (let i = 0; i < hyperfocusSessions.length; i++) {
    await supabase.from('alternancy_hyperfocus').insert({
      alternancy_session_id: session.id,
      hyperfocus_id: hyperfocusSessions[i].hyperfocusId,
      duration_minutes: hyperfocusSessions[i].durationMinutes,
      order_index: i,
    });
  }

  return {
    structuredContent: {
      type: 'alternancy_created',
      alternancyId: session.id,
      hyperfocusSessions,
      autoStarted: autoStart,
    },
  };
}

// Helper: Gerar sugestões de subtarefas
function generateSubtaskSuggestions(description, numSubtasks) {
  const verbs = ['Pesquisar', 'Planejar', 'Implementar', 'Testar', 'Documentar'];
  const suggestions = [];

  for (let i = 0; i < numSubtasks && i < 5; i++) {
    suggestions.push({
      title: `${verbs[i] || 'Executar'}: ${description.slice(0, 40)}...`,
      description: `Passo ${i + 1} para completar a tarefa`,
      estimatedMinutes: 20 + i * 10,
    });
  }

  return suggestions;
}

// ============================================================================
// INICIAR SERVIDOR
// ============================================================================

async function main() {
  console.error('='.repeat(60));
  console.error('🚀 Sati MCP Server (Real Backend)');
  console.error('='.repeat(60));
  console.error(`📦 Version: 1.0.0`);
  console.error(`🛠️  Tools: ${TOOL_DEFINITIONS.length}`);
  console.error(`🗄️  Database: ${SUPABASE_URL}`);
  console.error(`👤 Test User: ${TEST_USER_ID}`);
  console.error('='.repeat(60));
  console.error('');
  console.error('Available tools:');
  TOOL_DEFINITIONS.forEach((tool, i) => {
    console.error(`  ${i + 1}. ${tool.name}`);
  });
  console.error('');
  console.error('✅ Server ready! Listening on stdio...');
  console.error('');

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

