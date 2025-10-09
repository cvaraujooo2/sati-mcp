import { NextRequest, NextResponse } from 'next/server';
import { TOOL_NAMES, getToolHandler, listAllToolMetadata } from '@/lib/mcp/tools';
import { requireAuth, handlePreflight } from '@/lib/auth/middleware';
import { formatErrorResponse, toMcpError } from '@/lib/utils/errors';
import { apiLogger, PerformanceTimer } from '@/lib/utils/logger';

const log = apiLogger;

export async function POST(request: NextRequest) {
  const timer = new PerformanceTimer();

  try {
    const body = await request.json();
    const { method, params } = body;

    log.info({ method }, 'MCP request received');

    // Listar tools disponíveis
    if (method === 'tools/list') {
      const metadata = listAllToolMetadata();
      log.info({ toolCount: metadata.length }, 'Listing available tools');

      return NextResponse.json({
        tools: metadata,
      });
    }

    // Chamar tool específica
    if (method === 'tools/call') {
      const { name, arguments: toolArgs } = params;

      log.info({ toolName: name }, 'Tool call requested');

      // Autenticar usuário
      let userId: string;
      try {
        const authResult = await requireAuth(request);
        if (authResult instanceof NextResponse) {
          return authResult;
        }
        userId = authResult.user.id;
      } catch (error) {
        log.warn({ toolName: name, error }, 'Authentication failed for tool call');
        return NextResponse.json(
          formatErrorResponse(error),
          { status: 401 }
        );
      }

      // Buscar handler da tool
      const handler = getToolHandler(name);

      if (!handler) {
        log.warn({ toolName: name }, 'Tool not found');
        return NextResponse.json(
          {
            error: {
              code: 'TOOL_NOT_FOUND',
              message: `Tool '${name}' not found. Available tools: ${TOOL_NAMES.join(', ')}`,
            },
          },
          { status: 404 }
        );
      }

      // Executar tool
      try {
        const result = await handler(toolArgs, userId);

        const duration = timer.duration();
        log.info({ toolName: name, userId, duration }, 'Tool executed successfully');

        return NextResponse.json({ result });
      } catch (error) {
        const duration = timer.duration();
        log.error(
          {
            error: toMcpError(error).toLogObject(),
            toolName: name,
            userId,
            duration,
          },
          'Tool execution failed'
        );

        const mcpError = toMcpError(error);
        return NextResponse.json(formatErrorResponse(error), {
          status: mcpError.statusCode,
        });
      }
    }

    log.warn({ method }, 'Invalid MCP method');
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_METHOD',
          message: `Invalid method: ${method}. Supported methods: tools/list, tools/call`,
        },
      },
      { status: 400 }
    );
  } catch (error) {
    const duration = timer.duration();
    log.error({ error, duration }, 'MCP server error');

    return NextResponse.json(formatErrorResponse(error), { status: 500 });
  }
}

// Suportar OPTIONS para CORS (preflight)
export async function OPTIONS() {
  return handlePreflight();
}

