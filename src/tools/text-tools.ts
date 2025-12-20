import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { type ToolDef, registerToolsFromDefs } from "./registry.ts";
import { colorSchema, parseColor, type RGBAInput } from "../utils/color.ts";

const tools: ToolDef[] = [
  {
    name: "pilot_set_text_content",
    description: "Set text content. [WRITE]",
    schema: z.object({
      nodeId: z.string().describe("Target text node ID"),
      characters: z.string().describe("New text content"),
    }),
    command: "set_text_content",
    type: "write",
  },
  {
    name: "pilot_set_font_size",
    description: "Set font size. Supports batch. [WRITE]",
    schema: z.object({
      nodeId: z.string().describe("Target text node ID"),
      fontSize: z.number().min(1).describe("Font size (px)"),
    }),
    command: "set_font_size",
    type: "write",
    supportsBatch: true,
  },
  {
    name: "pilot_set_font_name",
    description: "Set font family and style. Supports batch. [WRITE]",
    schema: z.object({
      nodeId: z.string().describe("Target text node ID"),
      family: z.string().describe("Font family (e.g., 'Inter')"),
      style: z.string().default("Regular").describe("Font style (e.g., 'Bold')"),
    }),
    command: "set_font_name",
    type: "write",
    supportsBatch: true,
  },
  {
    name: "pilot_set_font_weight",
    description: "Set font weight. Supports batch. [WRITE]",
    schema: z.object({
      nodeId: z.string().describe("Target text node ID"),
      fontWeight: z.number().describe("Font weight (100-900)"),
    }),
    command: "set_font_weight",
    type: "write",
    supportsBatch: true,
  },
  {
    name: "pilot_set_text_color",
    description: "Set text color. Accepts HEX or RGBA. Supports batch. [WRITE]",
    schema: z.object({
      nodeId: z.string().describe("Target text node ID"),
      color: colorSchema.describe("Color: '#FF0000' or {r,g,b,a}"),
    }),
    command: "set_text_color",
    type: "write",
    supportsBatch: true,
    transform: (params) => ({
      nodeId: params.nodeId,
      ...parseColor(params.color as string | RGBAInput),
    }),
  },
  {
    name: "pilot_set_line_height",
    description: "Set line height. Supports batch. [WRITE]",
    schema: z.object({
      nodeId: z.string().describe("Target text node ID"),
      lineHeight: z.number().min(0).describe("Line height value"),
      unit: z.enum(["PIXELS", "PERCENT", "AUTO"]).default("PIXELS").describe("Unit"),
    }),
    command: "set_line_height",
    type: "write",
    supportsBatch: true,
  },
  {
    name: "pilot_set_letter_spacing",
    description: "Set letter spacing. Supports batch. [WRITE]",
    schema: z.object({
      nodeId: z.string().describe("Target text node ID"),
      letterSpacing: z.number().describe("Letter spacing value"),
      unit: z.enum(["PIXELS", "PERCENT"]).default("PIXELS").describe("Unit"),
    }),
    command: "set_letter_spacing",
    type: "write",
    supportsBatch: true,
  },
  {
    name: "pilot_set_text_align",
    description: "Set text alignment. Supports batch. [WRITE]",
    schema: z.object({
      nodeId: z.string().describe("Target text node ID"),
      horizontal: z.enum(["LEFT", "CENTER", "RIGHT", "JUSTIFIED"]).optional().describe("Horizontal alignment"),
      vertical: z.enum(["TOP", "CENTER", "BOTTOM"]).optional().describe("Vertical alignment"),
    }),
    command: "set_text_align",
    type: "write",
    supportsBatch: true,
  },
  {
    name: "pilot_set_text_decoration",
    description: "Set text decoration. Supports batch. [WRITE]",
    schema: z.object({
      nodeId: z.string().describe("Target text node ID"),
      decoration: z.enum(["NONE", "UNDERLINE", "STRIKETHROUGH"]).describe("Text decoration"),
    }),
    command: "set_text_decoration",
    type: "write",
    supportsBatch: true,
  },
  {
    name: "pilot_set_text_case",
    description: "Set text case. Supports batch. [WRITE]",
    schema: z.object({
      nodeId: z.string().describe("Target text node ID"),
      textCase: z.enum(["ORIGINAL", "UPPER", "LOWER", "TITLE", "SMALL_CAPS", "SMALL_CAPS_FORCED"]).describe("Text case"),
    }),
    command: "set_text_case",
    type: "write",
    supportsBatch: true,
  },
];

export function registerTextTools(server: McpServer): void {
  registerToolsFromDefs(server, tools);
}
