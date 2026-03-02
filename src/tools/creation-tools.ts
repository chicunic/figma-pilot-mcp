import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { colorSchema, parseColor, type RGBAInput } from '../utils/color.ts';
import { registerToolsFromDefs, type ToolDef } from './registry.ts';

const tools: ToolDef[] = [
  // ==================== Shape Creation (merged 7→1) ====================
  {
    name: 'pilot_create_shape',
    description: 'Create shape: frame/rect/ellipse/polygon/star/line/vector [WRITE]',
    schema: z.object({
      type: z.enum(['FRAME', 'RECTANGLE', 'ELLIPSE', 'POLYGON', 'STAR', 'LINE', 'VECTOR']).describe('Shape type'),
      name: z.string().optional().describe('Name'),
      x: z.number().default(0).describe('X'),
      y: z.number().default(0).describe('Y'),
      width: z.number().default(100).describe('Width'),
      height: z.number().default(100).describe('Height'),
      parentId: z.string().optional().describe('Parent node ID'),
      // POLYGON/STAR specific
      pointCount: z.number().optional().describe('Sides (polygon) or points (star)'),
      // STAR specific
      innerRadius: z.number().optional().describe('Star inner radius ratio (0-1)'),
      // LINE specific
      length: z.number().optional().describe('Line length'),
      rotation: z.number().optional().describe('Rotation angle'),
      // VECTOR specific
      vectorPaths: z
        .array(
          z.object({
            windingRule: z.enum(['EVENODD', 'NONZERO']),
            data: z.string(),
          }),
        )
        .optional()
        .describe('Vector path data'),
    }),
    commandResolver: (params) => {
      const typeMap: Record<string, string> = {
        FRAME: 'create_frame',
        RECTANGLE: 'create_rectangle',
        ELLIPSE: 'create_ellipse',
        POLYGON: 'create_polygon',
        STAR: 'create_star',
        LINE: 'create_line',
        VECTOR: 'create_vector',
      };
      const type = params.type as string;
      const { type: _, ...rest } = params;
      return { command: typeMap[type]!, params: rest };
    },
    type: 'write',
  },

  // ==================== Text ====================
  {
    name: 'pilot_create_text',
    description: 'Create text node [WRITE]',
    schema: z.object({
      characters: z.string().default('').describe('Text content'),
      x: z.number().default(0).describe('X'),
      y: z.number().default(0).describe('Y'),
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
    description: 'Create empty component [WRITE]',
    schema: z.object({
      name: z.string().optional().describe('Name'),
      x: z.number().default(0).describe('X'),
      y: z.number().default(0).describe('Y'),
      width: z.number().default(100).describe('Width'),
      height: z.number().default(100).describe('Height'),
      parentId: z.string().optional().describe('Parent node ID'),
    }),
    command: 'create_component',
    type: 'write',
  },
  {
    name: 'pilot_create_component_from_node',
    description: 'Convert node to component [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Node ID'),
    }),
    command: 'create_component_from_node',
    type: 'write',
  },
  {
    name: 'pilot_create_instance',
    description: 'Create component instance [WRITE]',
    schema: z.object({
      componentKey: z.string().describe('Component key'),
      x: z.number().default(0).describe('X'),
      y: z.number().default(0).describe('Y'),
      parentId: z.string().optional().describe('Parent node ID'),
    }),
    command: 'create_component_instance',
    type: 'write',
  },

  // ==================== Pages and Structure ====================
  {
    name: 'pilot_create_page',
    description: 'Create new page [WRITE]',
    schema: z.object({
      name: z.string().optional().describe('Page name'),
    }),
    command: 'create_page',
    type: 'write',
  },
  {
    name: 'pilot_create_section',
    description: 'Create section [WRITE]',
    schema: z.object({
      name: z.string().optional().describe('Name'),
      x: z.number().default(0).describe('X'),
      y: z.number().default(0).describe('Y'),
      width: z.number().default(400).describe('Width'),
      height: z.number().default(400).describe('Height'),
    }),
    command: 'create_section',
    type: 'write',
  },
  {
    name: 'pilot_create_slice',
    description: 'Create export slice [WRITE]',
    schema: z.object({
      name: z.string().optional().describe('Name'),
      x: z.number().default(0).describe('X'),
      y: z.number().default(0).describe('Y'),
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
    description: 'Create node from SVG string [WRITE]',
    schema: z.object({
      svg: z.string().describe('SVG string'),
      name: z.string().optional().describe('Name'),
      x: z.number().default(0).describe('X'),
      y: z.number().default(0).describe('Y'),
      parentId: z.string().optional().describe('Parent node ID'),
    }),
    command: 'create_from_svg',
    type: 'write',
  },

  // ==================== Image Creation (merged 2→1) ====================
  {
    name: 'pilot_create_image',
    description: 'Create image from base64 or URL [WRITE]',
    schema: z.object({
      base64: z.string().optional().describe('Base64 image data'),
      url: z.string().optional().describe('Image URL'),
      name: z.string().optional().describe('Name'),
      x: z.number().default(0).describe('X'),
      y: z.number().default(0).describe('Y'),
      width: z.number().optional().describe('Width'),
      height: z.number().optional().describe('Height'),
      scaleMode: z.enum(['FILL', 'FIT', 'CROP', 'TILE']).default('FILL').describe('Scale mode'),
      parentId: z.string().optional().describe('Parent node ID'),
      filters: z
        .object({
          exposure: z.number().min(-1).max(1).optional(),
          contrast: z.number().min(-1).max(1).optional(),
          saturation: z.number().min(-1).max(1).optional(),
          temperature: z.number().min(-1).max(1).optional(),
          tint: z.number().min(-1).max(1).optional(),
          highlights: z.number().min(-1).max(1).optional(),
          shadows: z.number().min(-1).max(1).optional(),
        })
        .optional()
        .describe('Image filters'),
    }),
    commandResolver: (params) => {
      const { base64, url, ...rest } = params as Record<string, unknown>;
      if (url) {
        return { command: 'create_image_from_url', params: { url, ...rest } };
      }
      return {
        command: 'create_image',
        params: {
          base64,
          ...rest,
          width: rest.width ?? 100,
          height: rest.height ?? 100,
        },
      };
    },
    type: 'write',
  },

  // ==================== Table ====================
  {
    name: 'pilot_create_table',
    description: 'Create table (FigJam) [WRITE]',
    schema: z.object({
      numRows: z.number().min(1).describe('Rows'),
      numColumns: z.number().min(1).describe('Columns'),
      name: z.string().optional().describe('Name'),
      x: z.number().optional().describe('X'),
      y: z.number().optional().describe('Y'),
      parentId: z.string().optional().describe('Parent node ID'),
    }),
    command: 'create_table',
    type: 'write',
  },

  // ==================== FigJam ====================
  {
    name: 'pilot_create_sticky',
    description: 'Create FigJam sticky note [WRITE]',
    schema: z.object({
      text: z.string().optional().describe('Sticky text'),
      x: z.number().default(0).describe('X'),
      y: z.number().default(0).describe('Y'),
      color: colorSchema.optional().describe('Background color'),
      authorVisible: z.boolean().optional().describe('Show author'),
      parentId: z.string().optional().describe('Parent node ID'),
    }),
    command: 'create_sticky',
    type: 'write',
    transform: (params) => {
      const result: Record<string, unknown> = { ...params };
      if (params.color) {
        result.color = parseColor(params.color as string | RGBAInput);
      }
      return result;
    },
  },
  {
    name: 'pilot_create_connector',
    description: 'Create FigJam connector between nodes [WRITE]',
    schema: z.object({
      name: z.string().optional().describe('Name'),
      startNodeId: z.string().optional().describe('Start node ID'),
      endNodeId: z.string().optional().describe('End node ID'),
      startMagnet: z.enum(['AUTO', 'TOP', 'BOTTOM', 'LEFT', 'RIGHT']).optional().describe('Start magnet'),
      endMagnet: z.enum(['AUTO', 'TOP', 'BOTTOM', 'LEFT', 'RIGHT']).optional().describe('End magnet'),
      strokeColor: colorSchema.optional().describe('Stroke color'),
      strokeWeight: z.number().optional().describe('Stroke weight'),
      connectorLineType: z.enum(['STRAIGHT', 'ELBOWED']).optional().describe('Line type'),
      connectorStartStrokeCap: z
        .enum(['NONE', 'ARROW_LINES', 'ARROW_EQUILATERAL', 'TRIANGLE_FILLED', 'DIAMOND_FILLED', 'CIRCLE_FILLED'])
        .optional()
        .describe('Start cap'),
      connectorEndStrokeCap: z
        .enum(['NONE', 'ARROW_LINES', 'ARROW_EQUILATERAL', 'TRIANGLE_FILLED', 'DIAMOND_FILLED', 'CIRCLE_FILLED'])
        .optional()
        .describe('End cap'),
    }),
    command: 'create_connector',
    type: 'write',
    transform: (params) => {
      const result: Record<string, unknown> = { ...params };
      if (params.strokeColor) {
        result.strokeColor = parseColor(params.strokeColor as string | RGBAInput);
      }
      return result;
    },
  },
  {
    name: 'pilot_create_shape_with_text',
    description: 'Create FigJam shape with text [WRITE]',
    schema: z.object({
      shapeType: z
        .enum([
          'SQUARE',
          'ELLIPSE',
          'ROUNDED_RECTANGLE',
          'DIAMOND',
          'TRIANGLE_UP',
          'TRIANGLE_DOWN',
          'PARALLELOGRAM_RIGHT',
          'PARALLELOGRAM_LEFT',
          'ENG_DATABASE',
          'ENG_QUEUE',
          'ENG_FILE',
          'ENG_FOLDER',
        ])
        .default('ROUNDED_RECTANGLE')
        .describe('Shape type'),
      text: z.string().optional().describe('Text content'),
      name: z.string().optional().describe('Name'),
      x: z.number().default(0).describe('X'),
      y: z.number().default(0).describe('Y'),
      width: z.number().optional().describe('Width'),
      height: z.number().optional().describe('Height'),
      color: colorSchema.optional().describe('Fill color'),
      parentId: z.string().optional().describe('Parent node ID'),
    }),
    command: 'create_shape_with_text',
    type: 'write',
    transform: (params) => {
      const result: Record<string, unknown> = { ...params };
      if (params.color) {
        result.color = parseColor(params.color as string | RGBAInput);
      }
      return result;
    },
  },

  // ==================== Node Tree ====================
  {
    name: 'pilot_create_node_tree',
    description: 'Create nested node tree in one call [WRITE]',
    schema: z.object({
      tree: z
        .object({
          type: z
            .enum(['FRAME', 'RECTANGLE', 'ELLIPSE', 'POLYGON', 'STAR', 'LINE', 'VECTOR', 'TEXT', 'COMPONENT'])
            .describe('Node type'),
          name: z.string().optional().describe('Name'),
          x: z.number().optional().describe('X'),
          y: z.number().optional().describe('Y'),
          width: z.number().optional().describe('Width'),
          height: z.number().optional().describe('Height'),
          fills: z.array(z.any()).optional().describe('Fills'),
          strokes: z.array(z.any()).optional().describe('Strokes'),
          strokeWeight: z.number().optional().describe('Stroke weight'),
          cornerRadius: z.number().optional().describe('Corner radius'),
          opacity: z.number().optional().describe('Opacity (0-1)'),
          rotation: z.number().optional().describe('Rotation'),
          visible: z.boolean().optional().describe('Visible'),
          locked: z.boolean().optional().describe('Locked'),
          characters: z.string().optional().describe('Text content'),
          fontSize: z.number().optional().describe('Font size'),
          fontFamily: z.string().optional().describe('Font family'),
          fontStyle: z.string().optional().describe('Font style'),
          textAlignHorizontal: z.enum(['LEFT', 'CENTER', 'RIGHT', 'JUSTIFIED']).optional().describe('Text align'),
          layoutMode: z.enum(['NONE', 'HORIZONTAL', 'VERTICAL']).optional().describe('Auto layout'),
          primaryAxisAlignItems: z
            .enum(['MIN', 'CENTER', 'MAX', 'SPACE_BETWEEN'])
            .optional()
            .describe('Main axis align'),
          counterAxisAlignItems: z.enum(['MIN', 'CENTER', 'MAX', 'BASELINE']).optional().describe('Cross axis align'),
          itemSpacing: z.number().optional().describe('Item spacing'),
          paddingTop: z.number().optional().describe('Padding top'),
          paddingRight: z.number().optional().describe('Padding right'),
          paddingBottom: z.number().optional().describe('Padding bottom'),
          paddingLeft: z.number().optional().describe('Padding left'),
          children: z.array(z.any()).optional().describe('Children'),
        })
        .describe('Root node'),
      parentId: z.string().optional().describe('Parent node ID'),
    }),
    command: 'create_node_tree',
    type: 'write',
  },
];

export function registerCreationTools(server: McpServer): void {
  registerToolsFromDefs(server, tools);
}
