/**
 * MCP Server Configuration
 * Configura o servidor MCP com todas as tools registradas
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { TOOL_REGISTRY, TOOL_NAMES } from './tools/index';
import { logger, toolLogger, PerformanceTimer } from '@/lib/utils/logger';
import { toMcpError, formatToolError } from '@/lib/utils/errors';

// ============================================================================
// SERVER INSTANCE
// ============================================================================

/**
 * Instância do servidor MCP
 */
export const mcpServer = new Server(
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

// ============================================================================
// TOOL REGISTRATION
// ============================================================================

/**
 * Registra todas as tools no servidor MCP
 */
export function registerAllTools() {
  logger.info({ toolCount: TOOL_NAMES.length }, 'Registering MCP tools');

  for (const toolName of TOOL_NAMES) {
    const tool = TOOL_REGISTRY[toolName];

    // Registrar tool com MCP SDK
    mcpServer.setRequestHandler(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { method: `tools/${toolName}` } as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (request: any) => {
        const timer = new PerformanceTimer();
        const log = toolLogger.child({ tool: toolName });

        try {
          // Extrair userId do contexto (implementar auth)
          const params = request.params as Record<string, unknown> & { userId?: string };
          const userId = params?.userId;

          if (!userId) {
            throw new Error('Authentication required: userId not found');
          }

          log.info({ userId }, `Tool ${toolName} called`);

          // Executar handler da tool
          const result = await tool.handler(params, userId);

          const duration = timer.duration();
          log.info({ userId, duration }, `Tool ${toolName} completed successfully`);

          return result;
        } catch (error) {
          const duration = timer.duration();
          log.error(
            {
              error: toMcpError(error).toLogObject(),
              duration,
            },
            `Tool ${toolName} failed`
          );

          return formatToolError(error);
        }
      }
    );

    logger.debug({ toolName }, 'Tool registered');
  }

  logger.info({ toolCount: TOOL_NAMES.length }, 'All tools registered successfully');
}

/**
 * Lista metadados de todas as tools (para discovery)
 */
mcpServer.setRequestHandler(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { method: 'tools/list' } as any,
  async () => {
    const tools = TOOL_NAMES.map((toolName) => {
      const metadata = TOOL_REGISTRY[toolName].metadata;
      return {
        name: metadata.name,
        description: metadata.description,
        inputSchema: metadata.inputSchema,
      };
    });

    return {
      tools,
    };
  }
);

// ============================================================================
// SERVER LIFECYCLE
// ============================================================================

/**
 * Inicia o servidor MCP
 */
export async function startMcpServer() {
  try {
    logger.info('Starting MCP server...');

    // Registrar todas as tools
    registerAllTools();

    // Criar transport (stdio para comunicação com ChatGPT)
    const transport = new StdioServerTransport();

    // Conectar servidor ao transport
    await mcpServer.connect(transport);

    logger.info('MCP server started successfully');

    // Handler de shutdown gracioso
    const shutdown = async () => {
      logger.info('Shutting down MCP server...');
      await mcpServer.close();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    logger.error({ error }, 'Failed to start MCP server');
    process.exit(1);
  }
}

/**
 * Para o servidor MCP
 */
export async function stopMcpServer() {
  logger.info('Stopping MCP server...');
  await mcpServer.close();
  logger.info('MCP server stopped');
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Valida que o servidor está pronto
 */
export function isServerReady(): boolean {
  return mcpServer !== null;
}

/**
 * Busca informações do servidor
 */
export function getServerInfo() {
  return {
    name: 'sati-mcp',
    version: '1.0.0',
    toolCount: TOOL_NAMES.length,
    tools: TOOL_NAMES,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default mcpServer;

