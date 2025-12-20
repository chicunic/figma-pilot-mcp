import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { sendCommand } from "../utils/websocket.ts";

// Single command definition for batch commands
const batchCommandSchema = z.object({
  command: z.string().describe("Command name (e.g., 'create_frame', 'set_fill_color')"),
  params: z.record(z.string(), z.unknown()).describe("Command parameters. Use $0, $1, etc. to reference previous results"),
});

export function registerBatchTools(server: McpServer): void {
  server.tool(
    "pilot_batch",
    "Execute multiple commands in sequence. Use $N to reference previous result (e.g., $0.id). [WRITE]",
    {
      commands: z.array(batchCommandSchema).min(1).max(20).describe("Commands to execute in order"),
      stopOnError: z.boolean().default(true).describe("Stop execution on first error"),
    },
    async (params) => {
      const { commands, stopOnError } = params;
      const results: unknown[] = [];
      const errors: { index: number; command: string; error: string }[] = [];

      for (let i = 0; i < commands.length; i++) {
        const cmd = commands[i]!;

        // Parse references in parameters ($0, $1, $0.id, $1.name, etc.)
        const resolvedParams = resolveReferences(cmd.params, results);

        try {
          const result = await sendCommand(cmd.command, resolvedParams);
          if (result.success) {
            results.push(result.result);
          } else {
            errors.push({ index: i, command: cmd.command, error: result.error || "Unknown error" });
            if (stopOnError) break;
            results.push(null); // Keep index consistent
          }
        } catch (err) {
          errors.push({ index: i, command: cmd.command, error: (err as Error).message });
          if (stopOnError) break;
          results.push(null);
        }
      }

      const responseData = {
        success: errors.length === 0,
        results,
        errors: errors.length > 0 ? errors : undefined,
        executed: results.length,
        total: commands.length,
      };

      return {
        content: [{ type: "text", text: JSON.stringify(responseData) }],
        isError: errors.length > 0 && stopOnError,
      };
    }
  );
}

// Parse references in parameters
function resolveReferences(
  params: Record<string, unknown>,
  results: unknown[]
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(params)) {
    resolved[key] = resolveValue(value, results);
  }

  return resolved;
}

// Recursively parse references in values
function resolveValue(value: unknown, results: unknown[]): unknown {
  if (typeof value === "string") {
    // Match $N or $N.path.to.prop
    const match = value.match(/^\$(\d+)(\..*)?$/);
    if (match) {
      const index = parseInt(match[1]!, 10);
      if (index >= results.length) {
        throw new Error(`Reference $${index} not available (only ${results.length} results)`);
      }
      let result = results[index];

      // 如果有路径，解析嵌套属性
      if (match[2]) {
        const path = match[2].slice(1).split(".");
        for (const prop of path) {
          if (result && typeof result === "object" && prop in result) {
            result = (result as Record<string, unknown>)[prop];
          } else {
            throw new Error(`Cannot resolve path ${match[2]} on result $${index}`);
          }
        }
      }
      return result;
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((v) => resolveValue(v, results));
  }

  if (value && typeof value === "object") {
    const resolved: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      resolved[k] = resolveValue(v, results);
    }
    return resolved;
  }

  return value;
}
