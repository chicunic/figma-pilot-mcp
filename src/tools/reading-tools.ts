import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { registerToolsFromDefs, type ToolDef } from './registry.ts';

const tools: ToolDef[] = [
  // ==================== Node Query ====================
  {
    name: 'pilot_get_node',
    description: 'Get detailed node info by ID. [READ]',
    schema: z.object({
      nodeId: z.string().describe('Node ID'),
    }),
    command: 'get_node',
    type: 'read',
  },
  {
    name: 'pilot_get_selection',
    description: 'Get current selection. [READ]',
    schema: z.object({}),
    command: 'get_selection',
    type: 'read',
  },
  {
    name: 'pilot_find_nodes',
    description: 'Find nodes by type or name pattern (supports *). [READ]',
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
      limit: z.number().default(100).describe('Max results'),
    }),
    command: 'find_nodes',
    type: 'read',
  },
  {
    name: 'pilot_get_children',
    description: 'Get children of a node. [READ]',
    schema: z.object({
      nodeId: z.string().describe('Parent node ID'),
      depth: z.number().default(1).describe('Depth (1=direct children)'),
      includeDetails: z.boolean().default(false).describe('Include visibility, opacity, etc.'),
    }),
    command: 'get_children',
    type: 'read',
  },
  {
    name: 'pilot_get_top_frame',
    description: 'Get the top-level frame containing a node (direct child of Page). [READ]',
    schema: z.object({
      nodeId: z.string().describe('Node ID'),
    }),
    command: 'get_top_frame',
    type: 'read',
  },

  // ==================== Page Query ====================
  {
    name: 'pilot_get_current_page',
    description: 'Get current page info. [READ]',
    schema: z.object({}),
    command: 'get_current_page',
    type: 'read',
  },
  {
    name: 'pilot_get_pages',
    description: 'Get all pages in document. [READ]',
    schema: z.object({}),
    command: 'get_pages',
    type: 'read',
  },

  // ==================== Style Query ====================
  {
    name: 'pilot_get_local_styles',
    description: 'Get local styles. [READ]',
    schema: z.object({
      type: z.enum(['PAINT', 'TEXT', 'EFFECT', 'GRID']).optional().describe('Style type filter'),
    }),
    command: 'get_local_styles',
    type: 'read',
  },
  {
    name: 'pilot_get_local_components',
    description: 'Get local components. [READ]',
    schema: z.object({
      allPages: z.boolean().optional().describe('Search all pages in the document (requires loading all pages)'),
    }),
    command: 'get_local_components',
    type: 'read',
  },

  // ==================== Variable Query ====================
  {
    name: 'pilot_get_local_variables',
    description: 'Get local variables. [READ]',
    schema: z.object({
      type: z.enum(['BOOLEAN', 'FLOAT', 'STRING', 'COLOR']).optional().describe('Variable type filter'),
    }),
    command: 'get_local_variables',
    type: 'read',
  },
  {
    name: 'pilot_get_variable_collections',
    description: 'Get variable collections. [READ]',
    schema: z.object({}),
    command: 'get_variable_collections',
    type: 'read',
  },

  // ==================== Viewport Query ====================
  {
    name: 'pilot_get_viewport',
    description: 'Get current viewport (center, zoom, bounds). [READ]',
    schema: z.object({}),
    command: 'get_viewport',
    type: 'read',
  },

  // ==================== Export ====================
  {
    name: 'pilot_export_node',
    description: 'Export node as PNG/JPG/SVG/PDF (returns base64). [READ]',
    schema: z.object({
      nodeId: z.string().describe('Node ID to export'),
      format: z.enum(['PNG', 'JPG', 'SVG', 'PDF']).default('PNG').describe('Export format'),
      scale: z.number().default(1).describe('Scale (for PNG/JPG)'),
    }),
    command: 'export_node',
    type: 'read',
  },

  // ==================== Component Properties Query ====================
  {
    name: 'pilot_get_component_properties',
    description: 'Get component properties (for instances) or property definitions (for components). [READ]',
    schema: z.object({
      nodeId: z.string().describe('Component or Instance node ID'),
    }),
    command: 'get_component_properties',
    type: 'read',
  },

  // ==================== Export Settings Query ====================
  {
    name: 'pilot_get_export_settings',
    description: 'Get export settings of a node. [READ]',
    schema: z.object({
      nodeId: z.string().describe('Node ID'),
    }),
    command: 'get_export_settings',
    type: 'read',
  },

  // ==================== Prototype Interactions Query ====================
  {
    name: 'pilot_get_reactions',
    description: 'Get prototype reactions/interactions of a node. [READ]',
    schema: z.object({
      nodeId: z.string().describe('Node ID'),
    }),
    command: 'get_reactions',
    type: 'read',
  },

  // ==================== Team Library Query ====================
  {
    name: 'pilot_get_library_variable_collections',
    description: 'Get available variable collections from enabled team libraries. [READ]',
    schema: z.object({}),
    command: 'get_library_variable_collections',
    type: 'read',
  },
  {
    name: 'pilot_get_library_variables',
    description: 'Get variables from a team library collection. [READ]',
    schema: z.object({
      collectionKey: z.string().describe('Library variable collection key'),
    }),
    command: 'get_library_variables',
    type: 'read',
  },

  // ==================== Team Library Import ====================
  {
    name: 'pilot_import_component',
    description: 'Import a component from team library by key. [READ]',
    schema: z.object({
      componentKey: z.string().describe('Component key from team library'),
    }),
    command: 'import_component',
    type: 'read',
  },
  {
    name: 'pilot_import_component_set',
    description: 'Import a component set (variants) from team library by key. [READ]',
    schema: z.object({
      componentSetKey: z.string().describe('Component set key from team library'),
    }),
    command: 'import_component_set',
    type: 'read',
  },
  {
    name: 'pilot_import_style',
    description: 'Import a style from team library by key. [READ]',
    schema: z.object({
      styleKey: z.string().describe('Style key from team library'),
    }),
    command: 'import_style',
    type: 'read',
  },
  {
    name: 'pilot_import_variable',
    description: 'Import a variable from team library by key. [READ]',
    schema: z.object({
      variableKey: z.string().describe('Variable key from team library'),
    }),
    command: 'import_variable',
    type: 'read',
  },

  // ==================== Component Set Variants ====================
  {
    name: 'pilot_get_component_set_variants',
    description:
      'Import a component set by key and get all its variants. Use this to explore variants of a library component set. [READ]',
    schema: z.object({
      componentSetKey: z.string().describe('Component set key from team library'),
    }),
    command: 'get_component_set_variants',
    type: 'read',
  },

  // ==================== Image Query ====================
  {
    name: 'pilot_get_image_by_hash',
    description: 'Get image info by hash. [READ]',
    schema: z.object({
      hash: z.string().describe('Image hash'),
    }),
    command: 'get_image_by_hash',
    type: 'read',
  },
  {
    name: 'pilot_get_image_bytes',
    description: 'Get image bytes as base64 by hash. [READ]',
    schema: z.object({
      hash: z.string().describe('Image hash'),
    }),
    command: 'get_image_bytes',
    type: 'read',
  },

  // ==================== Font Query ====================
  {
    name: 'pilot_list_available_fonts',
    description: 'List all available fonts. [READ]',
    schema: z.object({}),
    command: 'list_available_fonts',
    type: 'read',
  },

  // ==================== Selection Colors ====================
  {
    name: 'pilot_get_selection_colors',
    description: 'Get colors from current selection. [READ]',
    schema: z.object({}),
    command: 'get_selection_colors',
    type: 'read',
  },

  // ==================== Utility Functions ====================
  {
    name: 'pilot_parse_color',
    description: "Parse color string to RGB using Figma's util.rgb. [READ]",
    schema: z.object({
      color: z.string().describe("Color string (e.g., '#FF0000', 'red', 'rgb(255,0,0)')"),
    }),
    command: 'parse_color',
    type: 'read',
  },
  {
    name: 'pilot_parse_color_rgba',
    description: "Parse color string to RGBA using Figma's util.rgba. [READ]",
    schema: z.object({
      color: z.string().describe("Color string (e.g., '#FF0000', 'red', 'rgba(255,0,0,0.5)')"),
    }),
    command: 'parse_color_rgba',
    type: 'read',
  },

  // ==================== Event Subscriptions ====================
  {
    name: 'pilot_get_event_subscriptions',
    description: 'Get current event subscription status. [READ]',
    schema: z.object({}),
    command: 'get_event_subscriptions',
    type: 'read',
  },
];

export function registerReadingTools(server: McpServer): void {
  registerToolsFromDefs(server, tools);
}
