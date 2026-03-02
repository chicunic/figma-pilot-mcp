import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { colorSchema, parseColor, type RGBAInput } from '../utils/color.ts';
import { formatErrorResponse } from '../utils/errors.ts';
import { sendCommand } from '../utils/ws-bridge.ts';

// Custom registration for pilot_set_text (multi-dispatch tool)

const setTextSchema = z.object({
  nodeId: z.union([z.string(), z.array(z.string())]).describe('Target text node ID(s)'),
  characters: z.string().optional().describe('Text content'),
  fontSize: z.number().min(1).optional().describe('Font size (px)'),
  fontFamily: z.string().optional().describe('Font family'),
  fontStyle: z.string().optional().describe('Font style'),
  fontWeight: z.number().optional().describe('Font weight (100-900)'),
  color: colorSchema.optional().describe("Text color: '#FF0000' or {r,g,b,a}"),
  lineHeight: z.number().min(0).optional().describe('Line height'),
  lineHeightUnit: z.enum(['PIXELS', 'PERCENT', 'AUTO']).optional().describe('Line height unit'),
  letterSpacing: z.number().optional().describe('Letter spacing'),
  letterSpacingUnit: z.enum(['PIXELS', 'PERCENT']).optional().describe('Letter spacing unit'),
  textAlignHorizontal: z.enum(['LEFT', 'CENTER', 'RIGHT', 'JUSTIFIED']).optional().describe('Horizontal align'),
  textAlignVertical: z.enum(['TOP', 'CENTER', 'BOTTOM']).optional().describe('Vertical align'),
  textDecoration: z.enum(['NONE', 'UNDERLINE', 'STRIKETHROUGH']).optional().describe('Decoration'),
  textCase: z
    .enum(['ORIGINAL', 'UPPER', 'LOWER', 'TITLE', 'SMALL_CAPS', 'SMALL_CAPS_FORCED'])
    .optional()
    .describe('Text case'),
  paragraphIndent: z.number().min(0).optional().describe('Paragraph indent (px)'),
  paragraphSpacing: z.number().min(0).optional().describe('Paragraph spacing (px)'),
  fields: z.array(z.string()).optional().describe('Fields to return'),
});

interface TextCommand {
  condition: (params: Record<string, unknown>) => boolean;
  command: string;
  buildParams: (nodeId: string, params: Record<string, unknown>) => Record<string, unknown>;
}

const textCommands: TextCommand[] = [
  {
    condition: (p) => p.characters !== undefined,
    command: 'set_text_content',
    buildParams: (nodeId, p) => ({ nodeId, characters: p.characters }),
  },
  {
    condition: (p) => p.fontSize !== undefined,
    command: 'set_font_size',
    buildParams: (nodeId, p) => ({ nodeId, fontSize: p.fontSize }),
  },
  {
    condition: (p) => p.fontFamily !== undefined,
    command: 'set_font_name',
    buildParams: (nodeId, p) => ({ nodeId, family: p.fontFamily, style: p.fontStyle ?? 'Regular' }),
  },
  {
    condition: (p) => p.fontWeight !== undefined,
    command: 'set_font_weight',
    buildParams: (nodeId, p) => ({ nodeId, fontWeight: p.fontWeight }),
  },
  {
    condition: (p) => p.color !== undefined,
    command: 'set_text_color',
    buildParams: (nodeId, p) => ({ nodeId, ...parseColor(p.color as string | RGBAInput) }),
  },
  {
    condition: (p) => p.lineHeight !== undefined,
    command: 'set_line_height',
    buildParams: (nodeId, p) => ({ nodeId, lineHeight: p.lineHeight, unit: p.lineHeightUnit ?? 'PIXELS' }),
  },
  {
    condition: (p) => p.letterSpacing !== undefined,
    command: 'set_letter_spacing',
    buildParams: (nodeId, p) => ({ nodeId, letterSpacing: p.letterSpacing, unit: p.letterSpacingUnit ?? 'PIXELS' }),
  },
  {
    condition: (p) => p.textAlignHorizontal !== undefined || p.textAlignVertical !== undefined,
    command: 'set_text_align',
    buildParams: (nodeId, p) => ({ nodeId, horizontal: p.textAlignHorizontal, vertical: p.textAlignVertical }),
  },
  {
    condition: (p) => p.textDecoration !== undefined,
    command: 'set_text_decoration',
    buildParams: (nodeId, p) => ({ nodeId, decoration: p.textDecoration }),
  },
  {
    condition: (p) => p.textCase !== undefined,
    command: 'set_text_case',
    buildParams: (nodeId, p) => ({ nodeId, textCase: p.textCase }),
  },
  {
    condition: (p) => p.paragraphIndent !== undefined,
    command: 'set_paragraph_indent',
    buildParams: (nodeId, p) => ({ nodeId, paragraphIndent: p.paragraphIndent }),
  },
  {
    condition: (p) => p.paragraphSpacing !== undefined,
    command: 'set_paragraph_spacing',
    buildParams: (nodeId, p) => ({ nodeId, paragraphSpacing: p.paragraphSpacing }),
  },
];

async function executeTextCommands(
  nodeId: string,
  params: Record<string, unknown>,
): Promise<{ results: unknown[]; errors: string[] }> {
  const results: unknown[] = [];
  const errors: string[] = [];

  for (const cmd of textCommands) {
    if (cmd.condition(params)) {
      try {
        const cmdParams = cmd.buildParams(nodeId, params);
        const result = await sendCommand(cmd.command, cmdParams);
        if (result.success) {
          results.push({ command: cmd.command, ...(result.result as object) });
        } else {
          errors.push(`${cmd.command}: ${result.error}`);
        }
      } catch (err) {
        errors.push(`${cmd.command}: ${(err as Error).message}`);
      }
    }
  }

  return { results, errors };
}

export function registerTextTools(server: McpServer): void {
  const extendedShape = { ...setTextSchema.shape } as Record<string, z.ZodTypeAny>;
  extendedShape.fields = z.array(z.string()).optional().describe('Fields to return');

  server.registerTool(
    'pilot_set_text',
    {
      description: 'Set text properties (content/font/color/spacing/align) [WRITE] [BATCH]',
      inputSchema: extendedShape as Record<string, z.ZodTypeAny>,
    },
    async (params) => {
      const { fields, ...restParams } = params as Record<string, unknown> & { fields?: string[] };
      const nodeIdValue = restParams.nodeId;
      const nodeIds = Array.isArray(nodeIdValue) ? (nodeIdValue as string[]) : [nodeIdValue as string];

      try {
        const allResults: unknown[] = [];
        const allErrors: string[] = [];

        for (const nodeId of nodeIds) {
          const { results, errors } = await executeTextCommands(nodeId, restParams);
          allResults.push(...results);
          allErrors.push(...errors);
        }

        const responseData =
          nodeIds.length === 1
            ? {
                success: allErrors.length === 0,
                results: allResults,
                errors: allErrors.length > 0 ? allErrors : undefined,
              }
            : {
                success: allErrors.length === 0,
                results: allResults,
                errors: allErrors.length > 0 ? allErrors : undefined,
                count: { total: nodeIds.length, success: nodeIds.length - allErrors.length, failed: allErrors.length },
              };

        return {
          content: [{ type: 'text', text: JSON.stringify(responseData) }],
          isError: allErrors.length > 0 && allResults.length === 0,
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: formatErrorResponse(err) }],
          isError: true,
        };
      }
    },
  );
}
