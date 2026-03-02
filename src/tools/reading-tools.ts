import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { registerToolsFromDefs, type ToolDef } from './registry.ts';

const tools: ToolDef[] = [
  // ==================== Node Query ====================
  {
    name: 'pilot_get_node',
    description: 'Get node info by ID [READ]',
    schema: z.object({
      nodeId: z.string().describe('Node ID'),
    }),
    command: 'get_node',
    type: 'read',
  },
  {
    name: 'pilot_get_selection',
    description: 'Get current selection [READ]',
    schema: z.object({}),
    command: 'get_selection',
    type: 'read',
  },
  {
    name: 'pilot_find_nodes',
    description: 'Find nodes by type/name pattern [READ]',
    schema: z.object({
      type: z
        .enum([
          'FRAME',
          'RECTANGLE',
          'ELLIPSE',
          'TEXT',
          'COMPONENT',
          'INSTANCE',
          'GROUP',
          'VECTOR',
          'LINE',
          'POLYGON',
          'STAR',
        ])
        .optional()
        .describe('Node type filter'),
      name: z.string().optional().describe('Name pattern (supports *)'),
      parentId: z.string().optional().describe('Search within parent'),
      limit: z.number().default(20).describe('Max results'),
    }),
    command: 'find_nodes',
    type: 'read',
  },
  {
    name: 'pilot_get_children',
    description: 'Get children of node [READ]',
    schema: z.object({
      nodeId: z.string().describe('Parent node ID'),
      depth: z.number().default(1).describe('Depth'),
      includeDetails: z.boolean().default(false).describe('Include details'),
    }),
    command: 'get_children',
    type: 'read',
  },
  {
    name: 'pilot_get_top_frame',
    description: 'Get top-level frame containing node [READ]',
    schema: z.object({
      nodeId: z.string().describe('Node ID'),
    }),
    command: 'get_top_frame',
    type: 'read',
  },

  // ==================== Page Query ====================
  {
    name: 'pilot_get_current_page',
    description: 'Get current page info [READ]',
    schema: z.object({}),
    command: 'get_current_page',
    type: 'read',
  },
  {
    name: 'pilot_get_pages',
    description: 'Get all pages [READ]',
    schema: z.object({}),
    command: 'get_pages',
    type: 'read',
  },

  // ==================== Style Query ====================
  {
    name: 'pilot_get_local_styles',
    description: 'Get local styles [READ]',
    schema: z.object({
      type: z.enum(['PAINT', 'TEXT', 'EFFECT', 'GRID']).optional().describe('Style type filter'),
    }),
    command: 'get_local_styles',
    type: 'read',
  },
  {
    name: 'pilot_get_local_components',
    description: 'Get local components [READ]',
    schema: z.object({
      allPages: z.boolean().optional().describe('Search all pages'),
    }),
    command: 'get_local_components',
    type: 'read',
  },

  // ==================== Variable Query ====================
  {
    name: 'pilot_get_local_variables',
    description: 'Get local variables [READ]',
    schema: z.object({
      type: z.enum(['BOOLEAN', 'FLOAT', 'STRING', 'COLOR']).optional().describe('Variable type filter'),
    }),
    command: 'get_local_variables',
    type: 'read',
  },
  {
    name: 'pilot_get_variable_collections',
    description: 'Get variable collections [READ]',
    schema: z.object({}),
    command: 'get_variable_collections',
    type: 'read',
  },

  // ==================== Viewport Query ====================
  {
    name: 'pilot_get_viewport',
    description: 'Get current viewport [READ]',
    schema: z.object({}),
    command: 'get_viewport',
    type: 'read',
  },

  // ==================== Export ====================
  {
    name: 'pilot_export_node',
    description: 'Export node as PNG/JPG/SVG/PDF [READ]',
    schema: z.object({
      nodeId: z.string().describe('Node ID'),
      format: z.enum(['PNG', 'JPG', 'SVG', 'PDF']).default('PNG').describe('Format'),
      scale: z.number().default(1).describe('Scale'),
    }),
    command: 'export_node',
    type: 'read',
  },

  // ==================== Component Properties Query ====================
  {
    name: 'pilot_get_component_properties',
    description: 'Get component/instance properties [READ]',
    schema: z.object({
      nodeId: z.string().describe('Node ID'),
    }),
    command: 'get_component_properties',
    type: 'read',
  },

  // ==================== Export Settings Query ====================
  {
    name: 'pilot_get_export_settings',
    description: 'Get export settings of node [READ]',
    schema: z.object({
      nodeId: z.string().describe('Node ID'),
    }),
    command: 'get_export_settings',
    type: 'read',
  },

  // ==================== Prototype Interactions Query ====================
  {
    name: 'pilot_get_reactions',
    description: 'Get prototype reactions of node [READ]',
    schema: z.object({
      nodeId: z.string().describe('Node ID'),
    }),
    command: 'get_reactions',
    type: 'read',
  },

  // ==================== Team Library Query ====================
  {
    name: 'pilot_get_library_variable_collections',
    description: 'Get library variable collections [READ]',
    schema: z.object({}),
    command: 'get_library_variable_collections',
    type: 'read',
  },
  {
    name: 'pilot_get_library_variables',
    description: 'Get library variables by collection [READ]',
    schema: z.object({
      collectionKey: z.string().describe('Collection key'),
    }),
    command: 'get_library_variables',
    type: 'read',
  },

  // ==================== Library Import (merged 6→1) ====================
  {
    name: 'pilot_import_library',
    description: 'Import component/style/variable from library [READ]',
    schema: z.object({
      type: z.enum(['COMPONENT', 'COMPONENT_SET', 'STYLE', 'VARIABLE']).describe('Import type'),
      key: z.string().describe('Library item key'),
    }),
    commandResolver: (params) => {
      const commandMap: Record<string, string> = {
        COMPONENT: 'import_component',
        COMPONENT_SET: 'import_component_set',
        STYLE: 'import_style',
        VARIABLE: 'import_variable',
      };
      const type = params.type as string;
      const keyParam: Record<string, string> = {
        COMPONENT: 'componentKey',
        COMPONENT_SET: 'componentSetKey',
        STYLE: 'styleKey',
        VARIABLE: 'variableKey',
      };
      return {
        command: commandMap[type]!,
        params: { [keyParam[type]!]: params.key },
      };
    },
    type: 'read',
  },

  // ==================== Component Set Variants ====================
  {
    name: 'pilot_get_component_set_variants',
    description: 'Get variants of library component set [READ]',
    schema: z.object({
      componentSetKey: z.string().describe('Component set key'),
    }),
    command: 'get_component_set_variants',
    type: 'read',
  },

  // ==================== Image Query (merged 2→1) ====================
  {
    name: 'pilot_get_image',
    description: 'Get image info/bytes by hash [READ]',
    schema: z.object({
      hash: z.string().describe('Image hash'),
      includeBytes: z.boolean().default(false).describe('Include base64 bytes'),
    }),
    commandResolver: (params) => {
      const command = params.includeBytes ? 'get_image_bytes' : 'get_image_by_hash';
      return { command, params: { hash: params.hash } };
    },
    type: 'read',
  },

  // ==================== Font Query ====================
  {
    name: 'pilot_list_available_fonts',
    description: 'List available fonts [READ]',
    schema: z.object({
      search: z.string().optional().describe('Filter by font name'),
      limit: z.number().default(50).describe('Max results'),
    }),
    command: 'list_available_fonts',
    type: 'read',
  },

  // ==================== Selection Colors ====================
  {
    name: 'pilot_get_selection_colors',
    description: 'Get colors from selection [READ]',
    schema: z.object({}),
    command: 'get_selection_colors',
    type: 'read',
  },

  // ==================== Color Parse (merged 2→1) ====================
  {
    name: 'pilot_parse_color',
    description: 'Parse color string to RGB/RGBA [READ]',
    schema: z.object({
      color: z.string().describe("Color string (e.g. '#FF0000', 'red')"),
      includeAlpha: z.boolean().default(false).describe('Return RGBA instead of RGB'),
    }),
    commandResolver: (params) => {
      const command = params.includeAlpha ? 'parse_color_rgba' : 'parse_color';
      return { command, params: { color: params.color } };
    },
    type: 'read',
  },

  // ==================== Event Subscriptions ====================
  {
    name: 'pilot_get_event_subscriptions',
    description: 'Get event subscription status [READ]',
    schema: z.object({}),
    command: 'get_event_subscriptions',
    type: 'read',
  },
];

export function registerReadingTools(server: McpServer): void {
  registerToolsFromDefs(server, tools);
}
