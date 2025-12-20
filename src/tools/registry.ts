import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z, type ZodRawShape } from "zod";
import { sendCommand } from "../utils/websocket.ts";
import { formatErrorResponse, parsePluginError } from "../utils/errors.ts";

// Tool definition
export interface ToolDef {
  name: string;
  description: string;
  schema: z.ZodObject<ZodRawShape>;
  command: string;
  type: "read" | "write";
  // Optional: parameter transform function
  transform?: (params: Record<string, unknown>) => Record<string, unknown>;
  // Whether batch node operations are supported (automatically changes nodeId to nodeIds)
  supportsBatch?: boolean;
}

// Pick specified fields from object
function pickFields(obj: Record<string, unknown>, fields: string[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    if (field in obj) {
      result[field] = obj[field];
    }
  }
  return result;
}

// Register single tool
export function registerTool(server: McpServer, tool: ToolDef) {
  // Build extended schema
  const extendedShape = { ...tool.schema.shape } as Record<string, z.ZodTypeAny>;

  // Add fields parameter
  extendedShape.fields = z.array(z.string()).optional().describe("Fields to return (reduces response size)");

  // If batch operations supported and has nodeId field, replace with array-supporting version
  if (tool.supportsBatch && "nodeId" in tool.schema.shape) {
    extendedShape.nodeId = z.union([
      z.string(),
      z.array(z.string()),
    ]).describe("Target node ID(s) - single string or array");
  }

  server.tool(
    tool.name,
    tool.description,
    extendedShape,
    async (params) => {
      const { fields, ...restParams } = params as Record<string, unknown> & { fields?: string[] };

      // Check if this is a batch node operation
      const nodeIdValue = restParams.nodeId;
      const isBatchNodes = tool.supportsBatch && Array.isArray(nodeIdValue);

      if (isBatchNodes) {
        // Batch node operation: execute command for each nodeId
        const nodeIds = nodeIdValue as string[];
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

        const responseData = {
          success: errors.length === 0,
          results,
          errors: errors.length > 0 ? errors : undefined,
          count: { total: nodeIds.length, success: results.length, failed: errors.length },
        };

        return {
          content: [{ type: "text", text: JSON.stringify(responseData) }],
          isError: errors.length === nodeIds.length, // Only count as error if all failed
        };
      }

      // Single node operation
      try {
        const transformedParams = tool.transform ? tool.transform(restParams) : restParams;
        const result = await sendCommand(tool.command, transformedParams);

        // If command failed, parse the error
        if (!result.success && result.error) {
          const pilotError = parsePluginError(result.error);
          return {
            content: [{ type: "text", text: JSON.stringify({
              error: true,
              code: pilotError.code,
              message: pilotError.message,
            }) }],
            isError: true,
          };
        }

        // If fields specified, only return specified fields
        let responseData = result;
        if (fields && fields.length > 0 && result.result && typeof result.result === "object") {
          responseData = {
            ...result,
            result: pickFields(result.result as Record<string, unknown>, fields),
          };
        }

        return {
          content: [{ type: "text", text: JSON.stringify(responseData) }],
          isError: false,
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: formatErrorResponse(err) }],
          isError: true,
        };
      }
    }
  );
}

// Batch register tools
export function registerToolsFromDefs(server: McpServer, tools: ToolDef[]) {
  for (const tool of tools) {
    registerTool(server, tool);
  }
}
