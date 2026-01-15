import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { type ZodRawShape, z } from 'zod';
import { formatErrorResponse, parsePluginError } from '../utils/errors.ts';
import { sendCommand } from '../utils/websocket.ts';

// ==================== Types ====================

type TransformFn = (params: Record<string, unknown>) => Record<string, unknown>;

export interface ToolDef {
  name: string;
  description: string;
  schema: z.ZodObject<ZodRawShape>;
  command: string;
  type: 'read' | 'write';
  transform?: TransformFn;
  supportsBatch?: boolean;
}

interface BatchResult {
  success: boolean;
  results: unknown[];
  errors?: string[];
  count: { total: number; success: number; failed: number };
}

// ==================== Helpers ====================

function pickFields(obj: Record<string, unknown>, fields: string[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    if (field in obj) {
      result[field] = obj[field];
    }
  }
  return result;
}

async function executeBatchOperation(
  tool: ToolDef,
  nodeIds: string[],
  restParams: Record<string, unknown>,
): Promise<BatchResult> {
  const results: unknown[] = [];
  const errors: string[] = [];

  for (const nodeId of nodeIds) {
    const singleParams = { ...restParams, nodeId };
    const transformedParams = tool.transform ? tool.transform(singleParams) : singleParams;
    try {
      const result = await sendCommand(tool.command, transformedParams);
      if (result.success) {
        results.push(result.result);
      } else {
        errors.push(`${nodeId}: ${result.error}`);
      }
    } catch (err) {
      errors.push(`${nodeId}: ${(err as Error).message}`);
    }
  }

  return {
    success: errors.length === 0,
    results,
    errors: errors.length > 0 ? errors : undefined,
    count: { total: nodeIds.length, success: results.length, failed: errors.length },
  };
}

function buildExtendedSchema(tool: ToolDef): Record<string, z.ZodTypeAny> {
  const extendedShape = { ...tool.schema.shape } as Record<string, z.ZodTypeAny>;
  extendedShape.fields = z.array(z.string()).optional().describe('Fields to return (reduces response size)');

  if (tool.supportsBatch && 'nodeId' in tool.schema.shape) {
    extendedShape.nodeId = z
      .union([z.string(), z.array(z.string())])
      .describe('Target node ID(s) - single string or array');
  }

  return extendedShape;
}

// ==================== Registration ====================

export function registerTool(server: McpServer, tool: ToolDef): void {
  const extendedShape = buildExtendedSchema(tool);

  server.registerTool(tool.name, { description: tool.description, inputSchema: extendedShape }, async (params) => {
    const { fields, ...restParams } = params as Record<string, unknown> & { fields?: string[] };
    const nodeIdValue = restParams.nodeId;
    const isBatchNodes = tool.supportsBatch && Array.isArray(nodeIdValue);

    if (isBatchNodes) {
      const nodeIds = nodeIdValue as string[];
      const responseData = await executeBatchOperation(tool, nodeIds, restParams);
      return {
        content: [{ type: 'text', text: JSON.stringify(responseData) }],
        isError: nodeIds.length > 0 && responseData.count.success === 0,
      };
    }

    try {
      const transformedParams = tool.transform ? tool.transform(restParams) : restParams;
      const result = await sendCommand(tool.command, transformedParams);

      if (!result.success && result.error) {
        const pilotError = parsePluginError(result.error);
        return {
          content: [
            { type: 'text', text: JSON.stringify({ error: true, code: pilotError.code, message: pilotError.message }) },
          ],
          isError: true,
        };
      }

      let responseData = result;
      if (fields && fields.length > 0 && result.result && typeof result.result === 'object') {
        responseData = {
          ...result,
          result: pickFields(result.result as Record<string, unknown>, fields),
        };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(responseData) }],
        isError: false,
      };
    } catch (err) {
      return {
        content: [{ type: 'text', text: formatErrorResponse(err) }],
        isError: true,
      };
    }
  });
}

export function registerToolsFromDefs(server: McpServer, tools: ToolDef[]): void {
  for (const tool of tools) {
    registerTool(server, tool);
  }
}
