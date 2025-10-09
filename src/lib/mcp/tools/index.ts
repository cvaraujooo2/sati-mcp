/**
 * MCP Tools Barrel Export
 * Centraliza exports de todas as tools
 */

// Hyperfocus Management
export * from './createHyperfocus';
export * from './listHyperfocus';
export * from './getHyperfocus';

// Task Management
export * from './createTask';
export * from './updateTaskStatus';
export * from './breakIntoSubtasks';

// Focus Timer
export * from './startFocusTimer';
export * from './endFocusTimer';

// Context & Analysis
export * from './analyzeContext';

// Alternancy
export * from './createAlternancy';

// ============================================================================
// TOOL REGISTRY
// ============================================================================

import type { ToolHandler, McpToolMetadata } from '../types/metadata';
import {
  createHyperfocusHandler,
  createHyperfocusMetadata,
} from './createHyperfocus';
import {
  listHyperfocusHandler,
  listHyperfocusMetadata,
} from './listHyperfocus';
import {
  getHyperfocusHandler,
  getHyperfocusMetadata,
} from './getHyperfocus';
import {
  createTaskHandler,
  createTaskMetadata,
} from './createTask';
import {
  updateTaskStatusHandler,
  updateTaskStatusMetadata,
} from './updateTaskStatus';
import {
  breakIntoSubtasksHandler,
  breakIntoSubtasksMetadata,
} from './breakIntoSubtasks';
import {
  startFocusTimerHandler,
  startFocusTimerMetadata,
} from './startFocusTimer';
import {
  endFocusTimerHandler,
  endFocusTimerMetadata,
} from './endFocusTimer';
import {
  analyzeContextHandler,
  analyzeContextMetadata,
} from './analyzeContext';
import {
  createAlternancyHandler,
  createAlternancyMetadata,
} from './createAlternancy';

/**
 * Registro central de todas as MCP Tools
 */
export const TOOL_REGISTRY: Record<string, { handler: ToolHandler; metadata: McpToolMetadata }> = {
  createHyperfocus: {
    handler: createHyperfocusHandler,
    metadata: createHyperfocusMetadata,
  },
  listHyperfocus: {
    handler: listHyperfocusHandler,
    metadata: listHyperfocusMetadata,
  },
  getHyperfocus: {
    handler: getHyperfocusHandler,
    metadata: getHyperfocusMetadata,
  },
  createTask: {
    handler: createTaskHandler,
    metadata: createTaskMetadata,
  },
  updateTaskStatus: {
    handler: updateTaskStatusHandler,
    metadata: updateTaskStatusMetadata,
  },
  breakIntoSubtasks: {
    handler: breakIntoSubtasksHandler,
    metadata: breakIntoSubtasksMetadata,
  },
  startFocusTimer: {
    handler: startFocusTimerHandler,
    metadata: startFocusTimerMetadata,
  },
  endFocusTimer: {
    handler: endFocusTimerHandler,
    metadata: endFocusTimerMetadata,
  },
  analyzeContext: {
    handler: analyzeContextHandler,
    metadata: analyzeContextMetadata,
  },
  createAlternancy: {
    handler: createAlternancyHandler,
    metadata: createAlternancyMetadata,
  },
};

/**
 * Lista de nomes de tools disponíveis
 */
export const TOOL_NAMES = Object.keys(TOOL_REGISTRY);

/**
 * Tipo para os nomes das tools
 */
export type ToolName = string;

/**
 * Busca handler de uma tool pelo nome
 */
export function getToolHandler(toolName: string) {
  if (toolName in TOOL_REGISTRY) {
    return TOOL_REGISTRY[toolName].handler;
  }
  return null;
}

/**
 * Busca metadata de uma tool pelo nome
 */
export function getToolMetadata(toolName: string) {
  if (toolName in TOOL_REGISTRY) {
    return TOOL_REGISTRY[toolName].metadata;
  }
  return null;
}

/**
 * Lista todos os metadados das tools
 */
export function listAllToolMetadata() {
  return TOOL_NAMES.map((name) => TOOL_REGISTRY[name].metadata);
}

