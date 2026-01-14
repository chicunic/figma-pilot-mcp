import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { registerToolsFromDefs, type ToolDef } from './registry.ts';

const tools: ToolDef[] = [
  // ==================== Basic Shapes ====================
  {
    name: 'pilot_create_frame',
    description: 'Create a frame. [WRITE]',
    schema: z.object({
      name: z.string().optional().describe('Frame name'),
      x: z.number().default(0).describe('X position'),
      y: z.number().default(0).describe('Y position'),
      width: z.number().default(100).describe('Width'),
      height: z.number().default(100).describe('Height'),
      parentId: z.string().optional().describe('Parent node ID'),
    }),
    command: 'create_frame',
    type: 'write',
  },
  {
    name: 'pilot_create_rectangle',
    description: 'Create a rectangle. [WRITE]',
    schema: z.object({
      name: z.string().optional().describe('Rectangle name'),
      x: z.number().default(0).describe('X position'),
      y: z.number().default(0).describe('Y position'),
      width: z.number().default(100).describe('Width'),
      height: z.number().default(100).describe('Height'),
      parentId: z.string().optional().describe('Parent node ID'),
    }),
    command: 'create_rectangle',
    type: 'write',
  },
  {
    name: 'pilot_create_ellipse',
    description: 'Create an ellipse. [WRITE]',
    schema: z.object({
      name: z.string().optional().describe('Ellipse name'),
      x: z.number().default(0).describe('X position'),
      y: z.number().default(0).describe('Y position'),
      width: z.number().default(100).describe('Width'),
      height: z.number().default(100).describe('Height'),
      parentId: z.string().optional().describe('Parent node ID'),
    }),
    command: 'create_ellipse',
    type: 'write',
  },
  {
    name: 'pilot_create_polygon',
    description: 'Create a polygon. [WRITE]',
    schema: z.object({
      name: z.string().optional().describe('Polygon name'),
      x: z.number().default(0).describe('X position'),
      y: z.number().default(0).describe('Y position'),
      width: z.number().default(100).describe('Width'),
      height: z.number().default(100).describe('Height'),
      pointCount: z.number().default(3).describe('Number of sides'),
      parentId: z.string().optional().describe('Parent node ID'),
    }),
    command: 'create_polygon',
    type: 'write',
  },
  {
    name: 'pilot_create_star',
    description: 'Create a star. [WRITE]',
    schema: z.object({
      name: z.string().optional().describe('Star name'),
      x: z.number().default(0).describe('X position'),
      y: z.number().default(0).describe('Y position'),
      width: z.number().default(100).describe('Width'),
      height: z.number().default(100).describe('Height'),
      pointCount: z.number().default(5).describe('Number of points'),
      innerRadius: z.number().default(0.4).describe('Inner radius ratio (0-1)'),
      parentId: z.string().optional().describe('Parent node ID'),
    }),
    command: 'create_star',
    type: 'write',
  },
  {
    name: 'pilot_create_line',
    description: 'Create a line. [WRITE]',
    schema: z.object({
      name: z.string().optional().describe('Line name'),
      x: z.number().default(0).describe('X position'),
      y: z.number().default(0).describe('Y position'),
      length: z.number().default(100).describe('Line length'),
      rotation: z.number().default(0).describe('Rotation angle'),
      parentId: z.string().optional().describe('Parent node ID'),
    }),
    command: 'create_line',
    type: 'write',
  },
  {
    name: 'pilot_create_vector',
    description: 'Create a vector with path data. [WRITE]',
    schema: z.object({
      name: z.string().optional().describe('Vector name'),
      x: z.number().default(0).describe('X position'),
      y: z.number().default(0).describe('Y position'),
      vectorPaths: z
        .array(
          z.object({
            windingRule: z.enum(['EVENODD', 'NONZERO']),
            data: z.string(),
          }),
        )
        .optional()
        .describe('Vector path data'),
      parentId: z.string().optional().describe('Parent node ID'),
    }),
    command: 'create_vector',
    type: 'write',
  },

  // ==================== Text ====================
  {
    name: 'pilot_create_text',
    description: 'Create a text node. [WRITE]',
    schema: z.object({
      characters: z.string().default('').describe('Text content'),
      x: z.number().default(0).describe('X position'),
      y: z.number().default(0).describe('Y position'),
      fontSize: z.number().optional().describe('Font size'),
      fontFamily: z.string().default('Inter').describe('Font family'),
      fontStyle: z.string().default('Regular').describe('Font style'),
      parentId: z.string().optional().describe('Parent node ID'),
    }),
    command: 'create_text',
    type: 'write',
  },

  // ==================== Components ====================
  {
    name: 'pilot_create_component',
    description: 'Create an empty component. [WRITE]',
    schema: z.object({
      name: z.string().optional().describe('Component name'),
      x: z.number().default(0).describe('X position'),
      y: z.number().default(0).describe('Y position'),
      width: z.number().default(100).describe('Width'),
      height: z.number().default(100).describe('Height'),
      parentId: z.string().optional().describe('Parent node ID'),
    }),
    command: 'create_component',
    type: 'write',
  },
  {
    name: 'pilot_create_component_from_node',
    description: 'Create a component from existing node. [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Node ID to convert'),
    }),
    command: 'create_component_from_node',
    type: 'write',
  },
  {
    name: 'pilot_create_instance',
    description: 'Create an instance of a component. [WRITE]',
    schema: z.object({
      componentKey: z.string().describe('Component key'),
      x: z.number().default(0).describe('X position'),
      y: z.number().default(0).describe('Y position'),
      parentId: z.string().optional().describe('Parent node ID'),
    }),
    command: 'create_component_instance',
    type: 'write',
  },

  // ==================== Pages and Structure ====================
  {
    name: 'pilot_create_page',
    description: 'Create a new page. [WRITE]',
    schema: z.object({
      name: z.string().optional().describe('Page name'),
    }),
    command: 'create_page',
    type: 'write',
  },
  {
    name: 'pilot_create_section',
    description: 'Create a section. [WRITE]',
    schema: z.object({
      name: z.string().optional().describe('Section name'),
      x: z.number().default(0).describe('X position'),
      y: z.number().default(0).describe('Y position'),
      width: z.number().default(400).describe('Width'),
      height: z.number().default(400).describe('Height'),
    }),
    command: 'create_section',
    type: 'write',
  },
  {
    name: 'pilot_create_slice',
    description: 'Create a slice for export. [WRITE]',
    schema: z.object({
      name: z.string().optional().describe('Slice name'),
      x: z.number().default(0).describe('X position'),
      y: z.number().default(0).describe('Y position'),
      width: z.number().default(100).describe('Width'),
      height: z.number().default(100).describe('Height'),
      parentId: z.string().optional().describe('Parent node ID'),
    }),
    command: 'create_slice',
    type: 'write',
  },

  // ==================== Advanced Creation ====================
  {
    name: 'pilot_create_from_svg',
    description: 'Create node from SVG string. [WRITE]',
    schema: z.object({
      svg: z.string().describe('SVG string'),
      name: z.string().optional().describe('Node name'),
      x: z.number().default(0).describe('X position'),
      y: z.number().default(0).describe('Y position'),
      parentId: z.string().optional().describe('Parent node ID'),
    }),
    command: 'create_from_svg',
    type: 'write',
  },
  {
    name: 'pilot_create_image',
    description: 'Create image from base64. [WRITE]',
    schema: z.object({
      base64: z.string().describe('Base64 encoded image data'),
      name: z.string().optional().describe('Image name'),
      x: z.number().default(0).describe('X position'),
      y: z.number().default(0).describe('Y position'),
      width: z.number().default(100).describe('Width'),
      height: z.number().default(100).describe('Height'),
      scaleMode: z.enum(['FILL', 'FIT', 'CROP', 'TILE']).default('FILL').describe('Scale mode'),
      parentId: z.string().optional().describe('Parent node ID'),
    }),
    command: 'create_image',
    type: 'write',
  },
  {
    name: 'pilot_create_image_from_url',
    description: 'Create image from URL. [WRITE]',
    schema: z.object({
      url: z.string().describe('Image URL'),
      name: z.string().optional().describe('Image name'),
      x: z.number().default(0).describe('X position'),
      y: z.number().default(0).describe('Y position'),
      width: z.number().optional().describe('Width (defaults to image width)'),
      height: z.number().optional().describe('Height (defaults to image height)'),
      scaleMode: z.enum(['FILL', 'FIT', 'CROP', 'TILE']).default('FILL').describe('Scale mode'),
      parentId: z.string().optional().describe('Parent node ID'),
    }),
    command: 'create_image_from_url',
    type: 'write',
  },

  // ==================== Table ====================
  {
    name: 'pilot_create_table',
    description: 'Create a table (FigJam). [WRITE]',
    schema: z.object({
      numRows: z.number().min(1).describe('Number of rows'),
      numColumns: z.number().min(1).describe('Number of columns'),
      name: z.string().optional().describe('Table name'),
      x: z.number().optional().describe('X position'),
      y: z.number().optional().describe('Y position'),
      parentId: z.string().optional().describe('Parent node ID'),
    }),
    command: 'create_table',
    type: 'write',
  },

  // ==================== Node Tree ====================
  {
    name: 'pilot_create_node_tree',
    description:
      'Create a node tree structure in a single call. Supports nested children. Returns all created node IDs. [WRITE]',
    schema: z.object({
      tree: z
        .object({
          type: z
            .enum(['FRAME', 'RECTANGLE', 'ELLIPSE', 'POLYGON', 'STAR', 'LINE', 'VECTOR', 'TEXT', 'COMPONENT'])
            .describe('Node type'),
          name: z.string().optional().describe('Node name'),
          x: z.number().optional().describe('X position'),
          y: z.number().optional().describe('Y position'),
          width: z.number().optional().describe('Width'),
          height: z.number().optional().describe('Height'),
          fills: z.array(z.any()).optional().describe('Fill paints array'),
          strokes: z.array(z.any()).optional().describe('Stroke paints array'),
          strokeWeight: z.number().optional().describe('Stroke weight'),
          cornerRadius: z.number().optional().describe('Corner radius'),
          opacity: z.number().optional().describe('Opacity (0-1)'),
          rotation: z.number().optional().describe('Rotation angle'),
          visible: z.boolean().optional().describe('Visibility'),
          locked: z.boolean().optional().describe('Locked state'),
          characters: z.string().optional().describe('Text content (for TEXT nodes)'),
          fontSize: z.number().optional().describe('Font size (for TEXT nodes)'),
          fontFamily: z.string().optional().describe('Font family (for TEXT nodes)'),
          fontStyle: z.string().optional().describe('Font style (for TEXT nodes)'),
          textAlignHorizontal: z
            .enum(['LEFT', 'CENTER', 'RIGHT', 'JUSTIFIED'])
            .optional()
            .describe('Text alignment (for TEXT nodes)'),
          layoutMode: z.enum(['NONE', 'HORIZONTAL', 'VERTICAL']).optional().describe('Auto layout mode (for FRAME)'),
          primaryAxisAlignItems: z
            .enum(['MIN', 'CENTER', 'MAX', 'SPACE_BETWEEN'])
            .optional()
            .describe('Primary axis alignment (for FRAME)'),
          counterAxisAlignItems: z
            .enum(['MIN', 'CENTER', 'MAX', 'BASELINE'])
            .optional()
            .describe('Counter axis alignment (for FRAME)'),
          itemSpacing: z.number().optional().describe('Item spacing (for FRAME)'),
          paddingTop: z.number().optional().describe('Padding top (for FRAME)'),
          paddingRight: z.number().optional().describe('Padding right (for FRAME)'),
          paddingBottom: z.number().optional().describe('Padding bottom (for FRAME)'),
          paddingLeft: z.number().optional().describe('Padding left (for FRAME)'),
          children: z.array(z.any()).optional().describe('Child nodes (same structure recursively)'),
        })
        .describe('Root node definition'),
      parentId: z.string().optional().describe('Parent node ID to append to'),
    }),
    command: 'create_node_tree',
    type: 'write',
  },
];

export function registerCreationTools(server: McpServer): void {
  registerToolsFromDefs(server, tools);
}
