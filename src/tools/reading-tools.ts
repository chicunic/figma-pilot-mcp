import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { type ToolDef, registerToolsFromDefs } from "./registry.ts";

const tools: ToolDef[] = [
  // ==================== Node Query ====================
  {
    name: "pilot_get_node",
    description: "Get detailed node info by ID. [READ]",
    schema: z.object({
      nodeId: z.string().describe("Node ID"),
    }),
    command: "get_node",
    type: "read",
  },
  {
    name: "pilot_get_selection",
    description: "Get current selection. [READ]",
    schema: z.object({}),
    command: "get_selection",
    type: "read",
  },
  {
    name: "pilot_find_nodes",
    description: "Find nodes by type or name pattern (supports *). [READ]",
    schema: z.object({
      type: z.enum(["FRAME", "RECTANGLE", "ELLIPSE", "TEXT", "COMPONENT", "INSTANCE", "GROUP", "VECTOR", "LINE", "POLYGON", "STAR"]).optional().describe("Node type filter"),
      name: z.string().optional().describe("Name pattern (supports *)"),
      parentId: z.string().optional().describe("Search within parent"),
      limit: z.number().default(100).describe("Max results"),
    }),
    command: "find_nodes",
    type: "read",
  },
  {
    name: "pilot_get_children",
    description: "Get children of a node. [READ]",
    schema: z.object({
      nodeId: z.string().describe("Parent node ID"),
      depth: z.number().default(1).describe("Depth (1=direct children)"),
      includeDetails: z.boolean().default(false).describe("Include visibility, opacity, etc."),
    }),
    command: "get_children",
    type: "read",
  },
  {
    name: "pilot_get_top_frame",
    description: "Get the top-level frame containing a node (direct child of Page). [READ]",
    schema: z.object({
      nodeId: z.string().describe("Node ID"),
    }),
    command: "get_top_frame",
    type: "read",
  },

  // ==================== Page Query ====================
  {
    name: "pilot_get_current_page",
    description: "Get current page info. [READ]",
    schema: z.object({}),
    command: "get_current_page",
    type: "read",
  },
  {
    name: "pilot_get_pages",
    description: "Get all pages in document. [READ]",
    schema: z.object({}),
    command: "get_pages",
    type: "read",
  },

  // ==================== Style Query ====================
  {
    name: "pilot_get_local_styles",
    description: "Get local styles. [READ]",
    schema: z.object({
      type: z.enum(["PAINT", "TEXT", "EFFECT", "GRID"]).optional().describe("Style type filter"),
    }),
    command: "get_local_styles",
    type: "read",
  },
  {
    name: "pilot_get_local_components",
    description: "Get local components. [READ]",
    schema: z.object({}),
    command: "get_local_components",
    type: "read",
  },

  // ==================== Variable Query ====================
  {
    name: "pilot_get_local_variables",
    description: "Get local variables. [READ]",
    schema: z.object({
      type: z.enum(["BOOLEAN", "FLOAT", "STRING", "COLOR"]).optional().describe("Variable type filter"),
    }),
    command: "get_local_variables",
    type: "read",
  },
  {
    name: "pilot_get_variable_collections",
    description: "Get variable collections. [READ]",
    schema: z.object({}),
    command: "get_variable_collections",
    type: "read",
  },

  // ==================== Viewport Query ====================
  {
    name: "pilot_get_viewport",
    description: "Get current viewport (center, zoom, bounds). [READ]",
    schema: z.object({}),
    command: "get_viewport",
    type: "read",
  },

  // ==================== Export ====================
  {
    name: "pilot_export_node",
    description: "Export node as PNG/JPG/SVG/PDF (returns base64). [READ]",
    schema: z.object({
      nodeId: z.string().describe("Node ID to export"),
      format: z.enum(["PNG", "JPG", "SVG", "PDF"]).default("PNG").describe("Export format"),
      scale: z.number().default(1).describe("Scale (for PNG/JPG)"),
    }),
    command: "export_node",
    type: "read",
  },

  // ==================== Component Properties Query ====================
  {
    name: "pilot_get_component_properties",
    description: "Get component properties (for instances) or property definitions (for components). [READ]",
    schema: z.object({
      nodeId: z.string().describe("Component or Instance node ID"),
    }),
    command: "get_component_properties",
    type: "read",
  },

  // ==================== Export Settings Query ====================
  {
    name: "pilot_get_export_settings",
    description: "Get export settings of a node. [READ]",
    schema: z.object({
      nodeId: z.string().describe("Node ID"),
    }),
    command: "get_export_settings",
    type: "read",
  },

  // ==================== Prototype Interactions Query ====================
  {
    name: "pilot_get_reactions",
    description: "Get prototype reactions/interactions of a node. [READ]",
    schema: z.object({
      nodeId: z.string().describe("Node ID"),
    }),
    command: "get_reactions",
    type: "read",
  },
];

export function registerReadingTools(server: McpServer): void {
  registerToolsFromDefs(server, tools);
}
