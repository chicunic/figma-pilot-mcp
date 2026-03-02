import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { colorSchema, parseColor, type RGBAInput } from '../utils/color.ts';
import { registerToolsFromDefs, type ToolDef } from './registry.ts';

const gradientStopSchema = z.object({
  position: z.number().min(0).max(1).describe('Stop position (0-1)'),
  color: z
    .object({
      r: z.number().min(0).max(1).describe('Red (0-1)'),
      g: z.number().min(0).max(1).describe('Green (0-1)'),
      b: z.number().min(0).max(1).describe('Blue (0-1)'),
      a: z.number().min(0).max(1).optional().describe('Alpha (0-1)'),
    })
    .describe('Stop color'),
});

const gradientTypeSchema = z
  .enum(['GRADIENT_LINEAR', 'GRADIENT_RADIAL', 'GRADIENT_ANGULAR', 'GRADIENT_DIAMOND'])
  .describe('Gradient type');

const imageFiltersSchema = z
  .object({
    exposure: z.number().min(-1).max(1).optional().describe('Exposure (-1 to 1)'),
    contrast: z.number().min(-1).max(1).optional().describe('Contrast (-1 to 1)'),
    saturation: z.number().min(-1).max(1).optional().describe('Saturation (-1 to 1)'),
    temperature: z.number().min(-1).max(1).optional().describe('Temperature (-1 to 1)'),
    tint: z.number().min(-1).max(1).optional().describe('Tint (-1 to 1)'),
    highlights: z.number().min(-1).max(1).optional().describe('Highlights (-1 to 1)'),
    shadows: z.number().min(-1).max(1).optional().describe('Shadows (-1 to 1)'),
  })
  .describe('Image filters');

const tools: ToolDef[] = [
  // ==================== Basic Modifications ====================
  {
    name: 'pilot_set_fill',
    description: 'Set fill: solid color or gradient [WRITE] [BATCH]',
    schema: z.object({
      nodeId: z.string().describe('Node ID'),
      color: colorSchema.optional().describe("Solid color: '#FF0000' or {r,g,b,a}"),
      gradientType: gradientTypeSchema.optional(),
      gradientStops: z.array(gradientStopSchema).optional().describe('Gradient color stops'),
      gradientTransform: z.array(z.array(z.number())).optional().describe('2x3 transform matrix'),
    }),
    commandResolver: (params) => {
      if (params.gradientType) {
        return {
          command: 'set_gradient_fill',
          params: {
            nodeId: params.nodeId,
            gradientType: params.gradientType,
            gradientStops: params.gradientStops,
            gradientTransform: params.gradientTransform,
          },
        };
      }
      return {
        command: 'set_fill_color',
        params: {
          nodeId: params.nodeId,
          ...parseColor(params.color as string | RGBAInput),
        },
      };
    },
    type: 'write',
    supportsBatch: true,
  },
  {
    name: 'pilot_set_stroke',
    description: 'Set stroke: solid color or gradient [WRITE] [BATCH]',
    schema: z.object({
      nodeId: z.string().describe('Node ID'),
      color: colorSchema.optional().describe("Solid color: '#FF0000' or {r,g,b,a}"),
      strokeWeight: z.number().default(1).describe('Weight (px)'),
      gradientType: gradientTypeSchema.optional(),
      gradientStops: z.array(gradientStopSchema).optional().describe('Gradient color stops'),
      gradientTransform: z.array(z.array(z.number())).optional().describe('2x3 transform matrix'),
    }),
    commandResolver: (params) => {
      if (params.gradientType) {
        return {
          command: 'set_gradient_stroke',
          params: {
            nodeId: params.nodeId,
            gradientType: params.gradientType,
            gradientStops: params.gradientStops,
            gradientTransform: params.gradientTransform,
            strokeWeight: params.strokeWeight,
          },
        };
      }
      return {
        command: 'set_stroke_color',
        params: {
          nodeId: params.nodeId,
          ...parseColor(params.color as string | RGBAInput),
          strokeWeight: params.strokeWeight,
        },
      };
    },
    type: 'write',
    supportsBatch: true,
  },

  // ==================== Corners (merged 2→1) ====================
  {
    name: 'pilot_set_corners',
    description: 'Set corner radius (uniform or individual) [WRITE] [BATCH]',
    schema: z.object({
      nodeId: z.string().describe('Node ID'),
      radius: z.number().min(0).optional().describe('Uniform radius'),
      topLeft: z.number().min(0).optional().describe('Top-left'),
      topRight: z.number().min(0).optional().describe('Top-right'),
      bottomLeft: z.number().min(0).optional().describe('Bottom-left'),
      bottomRight: z.number().min(0).optional().describe('Bottom-right'),
    }),
    commandResolver: (params) => {
      const { nodeId, radius, topLeft, topRight, bottomLeft, bottomRight } = params as Record<string, unknown>;
      if (radius !== undefined) {
        return { command: 'set_corner_radius', params: { nodeId, radius } };
      }
      return {
        command: 'set_individual_corner_radius',
        params: { nodeId, topLeft, topRight, bottomLeft, bottomRight },
      };
    },
    type: 'write',
    supportsBatch: true,
  },

  // ==================== Position and Size ====================
  {
    name: 'pilot_move_node',
    description: 'Move node to position [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Node ID'),
      x: z.number().describe('X'),
      y: z.number().describe('Y'),
    }),
    command: 'move_node',
    type: 'write',
  },
  {
    name: 'pilot_resize_node',
    description: 'Resize node [WRITE] [BATCH]',
    schema: z.object({
      nodeId: z.string().describe('Node ID'),
      width: z.number().min(0).describe('Width'),
      height: z.number().min(0).describe('Height'),
    }),
    command: 'resize_node',
    type: 'write',
    supportsBatch: true,
  },
  {
    name: 'pilot_set_rotation',
    description: 'Set rotation [WRITE] [BATCH]',
    schema: z.object({
      nodeId: z.string().describe('Node ID'),
      rotation: z.number().describe('Degrees'),
    }),
    command: 'set_rotation',
    type: 'write',
    supportsBatch: true,
  },

  // ==================== Appearance ====================
  {
    name: 'pilot_set_opacity',
    description: 'Set opacity [WRITE] [BATCH]',
    schema: z.object({
      nodeId: z.string().describe('Node ID'),
      opacity: z.number().min(0).max(1).describe('Opacity (0-1)'),
    }),
    command: 'set_opacity',
    type: 'write',
    supportsBatch: true,
  },
  {
    name: 'pilot_set_blend_mode',
    description: 'Set blend mode [WRITE] [BATCH]',
    schema: z.object({
      nodeId: z.string().describe('Node ID'),
      blendMode: z
        .enum([
          'PASS_THROUGH',
          'NORMAL',
          'DARKEN',
          'MULTIPLY',
          'LINEAR_BURN',
          'COLOR_BURN',
          'LIGHTEN',
          'SCREEN',
          'LINEAR_DODGE',
          'COLOR_DODGE',
          'OVERLAY',
          'SOFT_LIGHT',
          'HARD_LIGHT',
          'DIFFERENCE',
          'EXCLUSION',
          'HUE',
          'SATURATION',
          'COLOR',
          'LUMINOSITY',
        ])
        .describe('Blend mode'),
    }),
    command: 'set_blend_mode',
    type: 'write',
    supportsBatch: true,
  },
  {
    name: 'pilot_set_visible',
    description: 'Set visibility [WRITE] [BATCH]',
    schema: z.object({
      nodeId: z.string().describe('Node ID'),
      visible: z.boolean().describe('Visible'),
    }),
    command: 'set_visible',
    type: 'write',
    supportsBatch: true,
  },
  {
    name: 'pilot_set_locked',
    description: 'Set locked state [WRITE] [BATCH]',
    schema: z.object({
      nodeId: z.string().describe('Node ID'),
      locked: z.boolean().describe('Locked'),
    }),
    command: 'set_locked',
    type: 'write',
    supportsBatch: true,
  },
  {
    name: 'pilot_set_name',
    description: 'Set node name [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Node ID'),
      name: z.string().describe('Name'),
    }),
    command: 'set_name',
    type: 'write',
  },

  // ==================== Effects (merged 3→1) ====================
  {
    name: 'pilot_set_effect',
    description: 'Add shadow/blur or clear effects [WRITE] [BATCH]',
    schema: z.object({
      nodeId: z.string().describe('Node ID'),
      action: z.enum(['ADD_SHADOW', 'ADD_BLUR', 'CLEAR']).describe('Effect action'),
      // Shadow params
      r: z.number().optional().describe('Shadow R (0-1)'),
      g: z.number().optional().describe('Shadow G (0-1)'),
      b: z.number().optional().describe('Shadow B (0-1)'),
      a: z.number().optional().describe('Shadow opacity (0-1)'),
      offsetX: z.number().optional().describe('Shadow X offset'),
      offsetY: z.number().optional().describe('Shadow Y offset'),
      radius: z.number().optional().describe('Blur/shadow radius'),
      spread: z.number().optional().describe('Shadow spread'),
      // Blur params
      blurType: z.enum(['LAYER_BLUR', 'BACKGROUND_BLUR']).optional().describe('Blur type'),
    }),
    commandResolver: (params) => {
      const { action, nodeId, ...rest } = params as Record<string, unknown>;
      switch (action) {
        case 'ADD_SHADOW':
          return {
            command: 'add_drop_shadow',
            params: {
              nodeId,
              r: rest.r ?? 0,
              g: rest.g ?? 0,
              b: rest.b ?? 0,
              a: rest.a ?? 0.25,
              offsetX: rest.offsetX ?? 0,
              offsetY: rest.offsetY ?? 4,
              radius: rest.radius ?? 4,
              spread: rest.spread ?? 0,
            },
          };
        case 'ADD_BLUR':
          return {
            command: 'add_blur',
            params: { nodeId, type: rest.blurType ?? 'LAYER_BLUR', radius: rest.radius ?? 10 },
          };
        case 'CLEAR':
          return { command: 'clear_effects', params: { nodeId } };
        default:
          return { command: 'clear_effects', params: { nodeId } };
      }
    },
    type: 'write',
    supportsBatch: true,
  },

  // ==================== Layout ====================
  {
    name: 'pilot_set_auto_layout',
    description: 'Set auto layout on frame [WRITE] [BATCH]',
    schema: z.object({
      nodeId: z.string().describe('Frame ID'),
      mode: z.enum(['HORIZONTAL', 'VERTICAL', 'NONE']).describe('Direction'),
      padding: z
        .object({
          top: z.number().default(0),
          right: z.number().default(0),
          bottom: z.number().default(0),
          left: z.number().default(0),
        })
        .optional()
        .describe('Padding'),
      itemSpacing: z.number().default(0).describe('Item spacing'),
      primaryAxisAlignItems: z.enum(['MIN', 'CENTER', 'MAX', 'SPACE_BETWEEN']).default('MIN').describe('Main axis'),
      counterAxisAlignItems: z.enum(['MIN', 'CENTER', 'MAX', 'BASELINE']).default('MIN').describe('Cross axis'),
      primaryAxisSizingMode: z.enum(['FIXED', 'AUTO']).optional().describe('Main sizing'),
      counterAxisSizingMode: z.enum(['FIXED', 'AUTO']).optional().describe('Cross sizing'),
    }),
    command: 'set_auto_layout',
    type: 'write',
    supportsBatch: true,
  },
  {
    name: 'pilot_set_constraints',
    description: 'Set constraints [WRITE] [BATCH]',
    schema: z.object({
      nodeId: z.string().describe('Node ID'),
      horizontal: z.enum(['MIN', 'CENTER', 'MAX', 'STRETCH', 'SCALE']).default('MIN').describe('Horizontal'),
      vertical: z.enum(['MIN', 'CENTER', 'MAX', 'STRETCH', 'SCALE']).default('MIN').describe('Vertical'),
    }),
    command: 'set_constraints',
    type: 'write',
    supportsBatch: true,
  },

  // ==================== Node Operations ====================
  {
    name: 'pilot_delete_node',
    description: 'Delete node [WRITE] [BATCH]',
    schema: z.object({
      nodeId: z.string().describe('Node ID'),
    }),
    command: 'delete_node',
    type: 'write',
    supportsBatch: true,
  },
  {
    name: 'pilot_clone_node',
    description: 'Clone node [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Node ID'),
      x: z.number().optional().describe('X'),
      y: z.number().optional().describe('Y'),
      name: z.string().optional().describe('Name'),
    }),
    command: 'clone_node',
    type: 'write',
  },

  // ==================== Grouping ====================
  {
    name: 'pilot_group_nodes',
    description: 'Group nodes [WRITE]',
    schema: z.object({
      nodeIds: z.array(z.string()).describe('Node IDs'),
      name: z.string().optional().describe('Group name'),
    }),
    command: 'group_nodes',
    type: 'write',
  },
  {
    name: 'pilot_ungroup_node',
    description: 'Ungroup node [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Group node ID'),
    }),
    command: 'ungroup_node',
    type: 'write',
  },
  {
    name: 'pilot_flatten_nodes',
    description: 'Flatten to single vector [WRITE]',
    schema: z.object({
      nodeIds: z.array(z.string()).describe('Node IDs'),
    }),
    command: 'flatten_node',
    type: 'write',
  },

  // ==================== Boolean Operations (merged 4→1) ====================
  {
    name: 'pilot_boolean',
    description: 'Boolean operation on nodes [WRITE]',
    schema: z.object({
      operation: z.enum(['UNION', 'SUBTRACT', 'INTERSECT', 'EXCLUDE']).describe('Operation'),
      nodeIds: z.array(z.string()).min(2).describe('Node IDs (min 2)'),
    }),
    commandResolver: (params) => {
      const opMap: Record<string, string> = {
        UNION: 'boolean_union',
        SUBTRACT: 'boolean_subtract',
        INTERSECT: 'boolean_intersect',
        EXCLUDE: 'boolean_exclude',
      };
      return { command: opMap[params.operation as string]!, params: { nodeIds: params.nodeIds } };
    },
    type: 'write',
  },

  // ==================== Pages and Viewport ====================
  {
    name: 'pilot_set_current_page',
    description: 'Set current page [WRITE]',
    schema: z.object({
      pageId: z.string().describe('Page ID'),
    }),
    command: 'set_current_page',
    type: 'write',
  },
  {
    name: 'pilot_set_viewport',
    description: 'Set viewport center/zoom [WRITE]',
    schema: z.object({
      center: z.object({ x: z.number(), y: z.number() }).optional().describe('Center'),
      zoom: z.number().optional().describe('Zoom'),
    }),
    command: 'set_viewport',
    type: 'write',
  },
  {
    name: 'pilot_scroll_to_node',
    description: 'Scroll to node [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Node ID'),
    }),
    command: 'scroll_to_node',
    type: 'write',
  },

  // ==================== Selection ====================
  {
    name: 'pilot_set_selection',
    description: 'Set selection [WRITE]',
    schema: z.object({
      nodeIds: z.array(z.string()).describe('Node IDs'),
    }),
    command: 'set_selection',
    type: 'write',
  },

  // ==================== Style Create (merged 4→1) ====================
  {
    name: 'pilot_create_style',
    description: 'Create paint/text/effect/grid style [WRITE]',
    schema: z.object({
      styleType: z.enum(['PAINT', 'TEXT', 'EFFECT', 'GRID']).describe('Style type'),
      name: z.string().describe('Style name'),
      // PAINT specific
      color: z
        .object({
          r: z.number().min(0).max(1),
          g: z.number().min(0).max(1),
          b: z.number().min(0).max(1),
          a: z.number().min(0).max(1).optional(),
        })
        .optional()
        .describe('Paint color'),
      // TEXT specific
      fontFamily: z.string().optional().describe('Font family'),
      fontStyle: z.string().optional().describe('Font style'),
      fontSize: z.number().optional().describe('Font size'),
      // EFFECT specific
      effects: z.array(z.record(z.string(), z.unknown())).optional().describe('Effects'),
      // GRID specific
      layoutGrids: z.array(z.record(z.string(), z.unknown())).optional().describe('Layout grids'),
    }),
    commandResolver: (params) => {
      const { styleType, name, color, fontFamily, fontStyle, fontSize, effects, layoutGrids } = params as Record<
        string,
        unknown
      >;
      switch (styleType) {
        case 'PAINT':
          return { command: 'create_paint_style', params: { name, color } };
        case 'TEXT':
          return {
            command: 'create_text_style',
            params: { name, fontFamily: fontFamily ?? 'Inter', fontStyle: fontStyle ?? 'Regular', fontSize },
          };
        case 'EFFECT':
          return { command: 'create_effect_style', params: { name, effects } };
        case 'GRID':
          return { command: 'create_grid_style', params: { name, layoutGrids } };
        default:
          return { command: 'create_paint_style', params: { name } };
      }
    },
    type: 'write',
  },

  // ==================== Style Apply (merged 4→1) ====================
  {
    name: 'pilot_apply_style',
    description: 'Apply style to node [WRITE]',
    schema: z.object({
      styleType: z.enum(['PAINT', 'TEXT', 'EFFECT', 'GRID']).describe('Style type'),
      nodeId: z.string().describe('Node ID'),
      styleId: z.string().describe('Style ID'),
    }),
    commandResolver: (params) => {
      const cmdMap: Record<string, string> = {
        PAINT: 'apply_paint_style',
        TEXT: 'apply_text_style',
        EFFECT: 'apply_effect_style',
        GRID: 'apply_grid_style',
      };
      return {
        command: cmdMap[params.styleType as string]!,
        params: { nodeId: params.nodeId, styleId: params.styleId },
      };
    },
    type: 'write',
  },

  // ==================== Notifications ====================
  {
    name: 'pilot_notify',
    description: 'Show notification [WRITE]',
    schema: z.object({
      message: z.string().describe('Message'),
      timeout: z.number().optional().describe('Timeout (ms)'),
      error: z.boolean().optional().describe('Error style'),
    }),
    command: 'notify',
    type: 'write',
  },

  // ==================== Layout Child (merged 4→1) ====================
  {
    name: 'pilot_set_layout_child',
    description: 'Set layout sizing/align/positioning for child [WRITE] [BATCH]',
    schema: z.object({
      nodeId: z.string().describe('Node ID'),
      // sizing
      horizontalSizing: z.enum(['FIXED', 'HUG', 'FILL']).optional().describe('Horizontal sizing'),
      verticalSizing: z.enum(['FIXED', 'HUG', 'FILL']).optional().describe('Vertical sizing'),
      // min/max
      minWidth: z.number().nullable().optional().describe('Min width'),
      maxWidth: z.number().nullable().optional().describe('Max width'),
      minHeight: z.number().nullable().optional().describe('Min height'),
      maxHeight: z.number().nullable().optional().describe('Max height'),
      // align
      layoutAlign: z.enum(['INHERIT', 'STRETCH']).optional().describe('Layout align'),
      layoutGrow: z.number().min(0).max(1).optional().describe('Layout grow (0 or 1)'),
      // positioning
      positioning: z.enum(['AUTO', 'ABSOLUTE']).optional().describe('Positioning mode'),
    }),
    commandResolver: (params) => {
      // Dispatch to multiple commands sequentially via the first applicable one.
      // For simplicity, we pick the primary command based on which params are set.
      const {
        nodeId,
        horizontalSizing,
        verticalSizing,
        minWidth,
        maxWidth,
        minHeight,
        maxHeight,
        layoutAlign,
        layoutGrow,
        positioning,
      } = params as Record<string, unknown>;

      // Priority: positioning > sizing > min/max > align
      if (positioning !== undefined) {
        return { command: 'set_layout_positioning', params: { nodeId, positioning } };
      }
      if (horizontalSizing !== undefined || verticalSizing !== undefined) {
        return {
          command: 'set_layout_sizing',
          params: { nodeId, horizontal: horizontalSizing, vertical: verticalSizing },
        };
      }
      if (minWidth !== undefined || maxWidth !== undefined || minHeight !== undefined || maxHeight !== undefined) {
        return { command: 'set_min_max_size', params: { nodeId, minWidth, maxWidth, minHeight, maxHeight } };
      }
      if (layoutAlign !== undefined || layoutGrow !== undefined) {
        return { command: 'set_layout_align', params: { nodeId, layoutAlign, layoutGrow } };
      }
      // fallback
      return { command: 'set_layout_sizing', params: { nodeId } };
    },
    type: 'write',
    supportsBatch: true,
  },

  // ==================== Node Hierarchy (merged 3→1) ====================
  {
    name: 'pilot_move_child',
    description: 'Append/insert/reorder child in parent [WRITE]',
    schema: z.object({
      parentId: z.string().describe('Parent node ID'),
      childId: z.string().describe('Child node ID'),
      index: z.number().min(0).optional().describe('Index (omit to append)'),
      reorder: z.boolean().optional().describe('Reorder existing child'),
    }),
    commandResolver: (params) => {
      const { parentId, childId, index, reorder } = params as Record<string, unknown>;
      if (reorder) {
        return { command: 'reorder_child', params: { parentId, childId, index: index ?? 0 } };
      }
      if (index !== undefined) {
        return { command: 'insert_child', params: { parentId, childId, index } };
      }
      return { command: 'append_child', params: { parentId, childId } };
    },
    type: 'write',
  },

  // ==================== Instance Operations ====================
  {
    name: 'pilot_detach_instance',
    description: 'Detach instance from component [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Instance node ID'),
    }),
    command: 'detach_instance',
    type: 'write',
  },
  {
    name: 'pilot_reset_overrides',
    description: 'Reset instance overrides [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Instance node ID'),
    }),
    command: 'reset_overrides',
    type: 'write',
  },
  {
    name: 'pilot_swap_component',
    description: 'Swap instance to different component [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Instance node ID'),
      componentKey: z.string().describe('New component key'),
    }),
    command: 'swap_component',
    type: 'write',
  },

  // ==================== Additional Properties ====================
  {
    name: 'pilot_set_clips_content',
    description: 'Set frame clips content [WRITE] [BATCH]',
    schema: z.object({
      nodeId: z.string().describe('Frame ID'),
      clipsContent: z.boolean().describe('Clips'),
    }),
    command: 'set_clips_content',
    type: 'write',
    supportsBatch: true,
  },
  {
    name: 'pilot_set_layout_wrap',
    description: 'Set layout wrap mode [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Frame ID'),
      wrap: z.enum(['NO_WRAP', 'WRAP']).describe('Wrap'),
      counterAxisSpacing: z.number().optional().describe('Row spacing'),
      counterAxisAlignContent: z.enum(['AUTO', 'SPACE_BETWEEN']).optional().describe('Content align'),
    }),
    command: 'set_layout_wrap',
    type: 'write',
  },
  {
    name: 'pilot_set_overflow',
    description: 'Set overflow direction [WRITE] [BATCH]',
    schema: z.object({
      nodeId: z.string().describe('Frame ID'),
      direction: z.enum(['NONE', 'HORIZONTAL', 'VERTICAL', 'BOTH']).describe('Direction'),
    }),
    command: 'set_overflow',
    type: 'write',
    supportsBatch: true,
  },
  {
    name: 'pilot_set_guides',
    description: 'Set guides on frame/page [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Frame/Page ID'),
      guides: z
        .array(z.object({ axis: z.enum(['X', 'Y']).describe('Axis'), offset: z.number().describe('Position') }))
        .describe('Guides'),
    }),
    command: 'set_guides',
    type: 'write',
  },

  // ==================== Variable Binding (merged 4→1) ====================
  {
    name: 'pilot_bind_variable',
    description: 'Bind variable to property/paint/effect/grid [WRITE]',
    schema: z.object({
      target: z.enum(['PROPERTY', 'PAINT', 'EFFECT', 'LAYOUT_GRID']).describe('Bind target'),
      nodeId: z.string().describe('Node ID'),
      variableId: z.string().describe('Variable ID'),
      // PROPERTY specific
      field: z.string().optional().describe("Property field (e.g. 'fills', 'opacity')"),
      // PAINT specific
      fillIndex: z.number().optional().describe('Fill index'),
      // EFFECT specific
      effectIndex: z.number().optional().describe('Effect index'),
      // LAYOUT_GRID specific
      gridIndex: z.number().optional().describe('Grid index'),
    }),
    commandResolver: (params) => {
      const { target, nodeId, variableId, field, fillIndex, effectIndex, gridIndex } = params as Record<
        string,
        unknown
      >;
      switch (target) {
        case 'PROPERTY':
          return { command: 'set_bound_variable', params: { nodeId, field, variableId } };
        case 'PAINT':
          return { command: 'set_bound_variable_for_paint', params: { nodeId, variableId, fillIndex: fillIndex ?? 0 } };
        case 'EFFECT':
          return {
            command: 'set_bound_variable_for_effect',
            params: { nodeId, variableId, effectIndex: effectIndex ?? 0, field },
          };
        case 'LAYOUT_GRID':
          return {
            command: 'set_bound_variable_for_layout_grid',
            params: { nodeId, variableId, gridIndex: gridIndex ?? 0, field },
          };
        default:
          return { command: 'set_bound_variable', params: { nodeId, field, variableId } };
      }
    },
    type: 'write',
  },

  // ==================== Component Properties ====================
  {
    name: 'pilot_set_component_properties',
    description: 'Set instance properties [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Instance node ID'),
      properties: z.record(z.string(), z.union([z.string(), z.boolean()])).describe('Properties'),
    }),
    command: 'set_component_properties',
    type: 'write',
  },

  // ==================== Export Settings ====================
  {
    name: 'pilot_set_export_settings',
    description: 'Set export settings [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Node ID'),
      settings: z
        .array(
          z.object({
            format: z.enum(['PNG', 'JPG', 'SVG', 'PDF']).describe('Format'),
            suffix: z.string().optional().describe('Suffix'),
            constraint: z
              .object({ type: z.enum(['SCALE', 'WIDTH', 'HEIGHT']), value: z.number() })
              .optional()
              .describe('Constraint'),
          }),
        )
        .describe('Settings'),
    }),
    command: 'set_export_settings',
    type: 'write',
  },

  // ==================== Prototype Interactions ====================
  {
    name: 'pilot_set_reactions',
    description: 'Set prototype reactions [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Node ID'),
      reactions: z.array(z.record(z.string(), z.unknown())).describe('Reactions'),
    }),
    command: 'set_reactions',
    type: 'write',
  },

  // ==================== Variable Creation ====================
  {
    name: 'pilot_create_variable_collection',
    description: 'Create variable collection [WRITE]',
    schema: z.object({
      name: z.string().describe('Name'),
    }),
    command: 'create_variable_collection',
    type: 'write',
  },
  {
    name: 'pilot_create_variable',
    description: 'Create variable [WRITE]',
    schema: z.object({
      name: z.string().describe('Name'),
      collectionId: z.string().describe('Collection ID'),
      resolvedType: z.enum(['BOOLEAN', 'FLOAT', 'STRING', 'COLOR']).describe('Type'),
    }),
    command: 'create_variable',
    type: 'write',
  },
  {
    name: 'pilot_set_variable_value',
    description: 'Set variable value for mode [WRITE]',
    schema: z.object({
      variableId: z.string().describe('Variable ID'),
      modeId: z.string().describe('Mode ID'),
      value: z.unknown().describe('Value'),
    }),
    command: 'set_variable_value',
    type: 'write',
  },
  {
    name: 'pilot_create_variable_alias',
    description: 'Create variable alias [WRITE]',
    schema: z.object({
      variableId: z.string().describe('Variable ID'),
    }),
    command: 'create_variable_alias',
    type: 'write',
  },

  // ==================== Team Library (merged imports into reading-tools) ====================
  {
    name: 'pilot_import_style_by_key',
    description: 'Import style by key [WRITE]',
    schema: z.object({
      key: z.string().describe('Style key'),
    }),
    command: 'import_style_by_key',
    type: 'write',
  },
  {
    name: 'pilot_import_variable_by_key',
    description: 'Import variable by key [WRITE]',
    schema: z.object({
      key: z.string().describe('Variable key'),
    }),
    command: 'import_variable_by_key',
    type: 'write',
  },

  // ==================== Combine As Variants ====================
  {
    name: 'pilot_combine_as_variants',
    description: 'Combine components as variants [WRITE]',
    schema: z.object({
      nodeIds: z.array(z.string()).min(2).describe('Component IDs (min 2)'),
    }),
    command: 'combine_as_variants',
    type: 'write',
  },

  // ==================== Style Ordering (merged 4→1) ====================
  {
    name: 'pilot_move_style',
    description: 'Reorder style in list [WRITE]',
    schema: z.object({
      styleType: z.enum(['PAINT', 'TEXT', 'EFFECT', 'GRID']).describe('Style type'),
      targetStyleId: z.string().describe('Style ID to move'),
      referenceStyleId: z.string().nullable().optional().describe('Place after (null=beginning)'),
    }),
    commandResolver: (params) => {
      const cmdMap: Record<string, string> = {
        PAINT: 'move_paint_style_after',
        TEXT: 'move_text_style_after',
        EFFECT: 'move_effect_style_after',
        GRID: 'move_grid_style_after',
      };
      return {
        command: cmdMap[params.styleType as string]!,
        params: { targetStyleId: params.targetStyleId, referenceStyleId: params.referenceStyleId },
      };
    },
    type: 'write',
  },

  // ==================== Utility ====================
  {
    name: 'pilot_create_solid_paint',
    description: 'Create solid paint object [WRITE]',
    schema: z.object({
      color: z.string().describe("Color string (e.g. '#FF0000')"),
      overrides: z.record(z.string(), z.unknown()).optional().describe('Overrides'),
    }),
    command: 'create_solid_paint',
    type: 'write',
  },

  // ==================== Event Subscription (merged 2→1) ====================
  {
    name: 'pilot_event',
    description: 'Subscribe/unsubscribe to events [WRITE]',
    schema: z.object({
      action: z.enum(['subscribe', 'unsubscribe']).describe('Action'),
      eventType: z
        .enum(['selectionchange', 'currentpagechange', 'documentchange', 'stylechange'])
        .describe('Event type'),
    }),
    commandResolver: (params) => {
      const command = params.action === 'subscribe' ? 'subscribe_event' : 'unsubscribe_event';
      return { command, params: { eventType: params.eventType } };
    },
    type: 'write',
  },

  // ==================== Image Fill/Filters ====================
  {
    name: 'pilot_set_image_fill',
    description: 'Set image fill on node (by hash, base64, or URL) [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Node ID'),
      imageHash: z.string().optional().describe('Existing image hash'),
      base64: z.string().optional().describe('Base64 image data'),
      url: z.string().optional().describe('Image URL'),
      scaleMode: z.enum(['FILL', 'FIT', 'CROP', 'TILE']).default('FILL').describe('Scale mode'),
      filters: imageFiltersSchema.optional(),
    }),
    command: 'set_image_fill',
    type: 'write',
  },
  {
    name: 'pilot_set_image_filters',
    description: 'Set filters on existing IMAGE fill [WRITE] [BATCH]',
    schema: z.object({
      nodeId: z.string().describe('Node ID'),
      filters: imageFiltersSchema,
      fillIndex: z.number().default(0).describe('Fill index (0-based)'),
    }),
    command: 'set_image_filters',
    type: 'write',
    supportsBatch: true,
  },
];

export function registerModificationTools(server: McpServer): void {
  registerToolsFromDefs(server, tools);
}
