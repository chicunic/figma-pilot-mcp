import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { colorSchema, parseColor, type RGBAInput } from '../utils/color.ts';
import { registerToolsFromDefs, type ToolDef } from './registry.ts';

const tools: ToolDef[] = [
  // ==================== Basic Modifications ====================
  {
    name: 'pilot_set_fill',
    description: 'Set fill color. Accepts HEX or RGBA. Supports batch. [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Target node ID'),
      color: colorSchema.describe("Color: '#FF0000' or {r,g,b,a}"),
    }),
    command: 'set_fill_color',
    type: 'write',
    supportsBatch: true,
    transform: (params) => ({
      nodeId: params.nodeId,
      ...parseColor(params.color as string | RGBAInput),
    }),
  },
  {
    name: 'pilot_set_stroke',
    description: 'Set stroke color. Accepts HEX or RGBA. Supports batch. [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Target node ID'),
      color: colorSchema.describe("Color: '#FF0000' or {r,g,b,a}"),
      strokeWeight: z.number().default(1).describe('Stroke weight (px)'),
    }),
    command: 'set_stroke_color',
    type: 'write',
    supportsBatch: true,
    transform: (params) => ({
      nodeId: params.nodeId,
      ...parseColor(params.color as string | RGBAInput),
      strokeWeight: params.strokeWeight,
    }),
  },
  {
    name: 'pilot_set_corner_radius',
    description: 'Set corner radius. Supports batch. [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Target node ID'),
      radius: z.number().min(0).describe('Corner radius (px)'),
    }),
    command: 'set_corner_radius',
    type: 'write',
    supportsBatch: true,
  },
  {
    name: 'pilot_set_individual_corners',
    description: 'Set individual corner radii. Supports batch. [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Target node ID'),
      topLeft: z.number().min(0).optional().describe('Top-left radius'),
      topRight: z.number().min(0).optional().describe('Top-right radius'),
      bottomLeft: z.number().min(0).optional().describe('Bottom-left radius'),
      bottomRight: z.number().min(0).optional().describe('Bottom-right radius'),
    }),
    command: 'set_individual_corner_radius',
    type: 'write',
    supportsBatch: true,
  },

  // ==================== Position and Size ====================
  {
    name: 'pilot_move_node',
    description: 'Move node to position. [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Target node ID'),
      x: z.number().describe('X position'),
      y: z.number().describe('Y position'),
    }),
    command: 'move_node',
    type: 'write',
  },
  {
    name: 'pilot_resize_node',
    description: 'Resize a node. Supports batch. [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Target node ID'),
      width: z.number().min(0).describe('Width'),
      height: z.number().min(0).describe('Height'),
    }),
    command: 'resize_node',
    type: 'write',
    supportsBatch: true,
  },
  {
    name: 'pilot_set_rotation',
    description: 'Set node rotation. Supports batch. [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Target node ID'),
      rotation: z.number().describe('Rotation angle (degrees)'),
    }),
    command: 'set_rotation',
    type: 'write',
    supportsBatch: true,
  },

  // ==================== Appearance ====================
  {
    name: 'pilot_set_opacity',
    description: 'Set node opacity. Supports batch. [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Target node ID'),
      opacity: z.number().min(0).max(1).describe('Opacity (0-1)'),
    }),
    command: 'set_opacity',
    type: 'write',
    supportsBatch: true,
  },
  {
    name: 'pilot_set_blend_mode',
    description: 'Set blend mode. Supports batch. [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Target node ID'),
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
    description: 'Set node visibility. Supports batch. [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Target node ID'),
      visible: z.boolean().describe('Visibility'),
    }),
    command: 'set_visible',
    type: 'write',
    supportsBatch: true,
  },
  {
    name: 'pilot_set_locked',
    description: 'Set node locked state. Supports batch. [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Target node ID'),
      locked: z.boolean().describe('Locked state'),
    }),
    command: 'set_locked',
    type: 'write',
    supportsBatch: true,
  },
  {
    name: 'pilot_set_name',
    description: 'Set node name. [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Target node ID'),
      name: z.string().describe('New name'),
    }),
    command: 'set_name',
    type: 'write',
  },

  // ==================== Effects ====================
  {
    name: 'pilot_add_drop_shadow',
    description: 'Add drop shadow effect. Supports batch. [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Target node ID'),
      r: z.number().default(0).describe('Shadow color R (0-1)'),
      g: z.number().default(0).describe('Shadow color G (0-1)'),
      b: z.number().default(0).describe('Shadow color B (0-1)'),
      a: z.number().default(0.25).describe('Shadow opacity (0-1)'),
      offsetX: z.number().default(0).describe('X offset'),
      offsetY: z.number().default(4).describe('Y offset'),
      radius: z.number().default(4).describe('Blur radius'),
      spread: z.number().default(0).describe('Spread'),
    }),
    command: 'add_drop_shadow',
    type: 'write',
    supportsBatch: true,
  },
  {
    name: 'pilot_add_blur',
    description: 'Add blur effect. Supports batch. [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Target node ID'),
      type: z.enum(['LAYER_BLUR', 'BACKGROUND_BLUR']).default('LAYER_BLUR').describe('Blur type'),
      radius: z.number().default(10).describe('Blur radius'),
    }),
    command: 'add_blur',
    type: 'write',
    supportsBatch: true,
  },
  {
    name: 'pilot_clear_effects',
    description: 'Clear all effects from node. Supports batch. [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Target node ID'),
    }),
    command: 'clear_effects',
    type: 'write',
    supportsBatch: true,
  },

  // ==================== Layout ====================
  {
    name: 'pilot_set_auto_layout',
    description: 'Set auto layout on a frame. Supports batch. [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Target frame ID'),
      mode: z.enum(['HORIZONTAL', 'VERTICAL', 'NONE']).describe('Layout direction'),
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
      primaryAxisAlignItems: z
        .enum(['MIN', 'CENTER', 'MAX', 'SPACE_BETWEEN'])
        .default('MIN')
        .describe('Main axis alignment'),
      counterAxisAlignItems: z
        .enum(['MIN', 'CENTER', 'MAX', 'BASELINE'])
        .default('MIN')
        .describe('Cross axis alignment'),
      primaryAxisSizingMode: z.enum(['FIXED', 'AUTO']).optional().describe('Main axis sizing'),
      counterAxisSizingMode: z.enum(['FIXED', 'AUTO']).optional().describe('Cross axis sizing'),
    }),
    command: 'set_auto_layout',
    type: 'write',
    supportsBatch: true,
  },
  {
    name: 'pilot_set_constraints',
    description: 'Set node constraints. Supports batch. [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Target node ID'),
      horizontal: z.enum(['MIN', 'CENTER', 'MAX', 'STRETCH', 'SCALE']).default('MIN').describe('Horizontal constraint'),
      vertical: z.enum(['MIN', 'CENTER', 'MAX', 'STRETCH', 'SCALE']).default('MIN').describe('Vertical constraint'),
    }),
    command: 'set_constraints',
    type: 'write',
    supportsBatch: true,
  },

  // ==================== Node Operations ====================
  {
    name: 'pilot_delete_node',
    description: 'Delete a node. Supports batch. [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Node ID to delete'),
    }),
    command: 'delete_node',
    type: 'write',
    supportsBatch: true,
  },
  {
    name: 'pilot_clone_node',
    description: 'Clone a node. [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Node ID to clone'),
      x: z.number().optional().describe('New X position'),
      y: z.number().optional().describe('New Y position'),
      name: z.string().optional().describe('New name'),
    }),
    command: 'clone_node',
    type: 'write',
  },

  // ==================== Grouping ====================
  {
    name: 'pilot_group_nodes',
    description: 'Group multiple nodes. [WRITE]',
    schema: z.object({
      nodeIds: z.array(z.string()).describe('Node IDs to group'),
      name: z.string().optional().describe('Group name'),
    }),
    command: 'group_nodes',
    type: 'write',
  },
  {
    name: 'pilot_ungroup_node',
    description: 'Ungroup a group node. [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Group node ID'),
    }),
    command: 'ungroup_node',
    type: 'write',
  },
  {
    name: 'pilot_flatten_nodes',
    description: 'Flatten nodes into single vector. [WRITE]',
    schema: z.object({
      nodeIds: z.array(z.string()).describe('Node IDs to flatten'),
    }),
    command: 'flatten_node',
    type: 'write',
  },

  // ==================== Boolean Operations ====================
  {
    name: 'pilot_boolean_union',
    description: 'Union multiple nodes. [WRITE]',
    schema: z.object({
      nodeIds: z.array(z.string()).min(2).describe('Node IDs (at least 2)'),
    }),
    command: 'boolean_union',
    type: 'write',
  },
  {
    name: 'pilot_boolean_subtract',
    description: 'Subtract nodes (first minus rest). [WRITE]',
    schema: z.object({
      nodeIds: z.array(z.string()).min(2).describe('Node IDs (at least 2)'),
    }),
    command: 'boolean_subtract',
    type: 'write',
  },
  {
    name: 'pilot_boolean_intersect',
    description: 'Intersect multiple nodes. [WRITE]',
    schema: z.object({
      nodeIds: z.array(z.string()).min(2).describe('Node IDs (at least 2)'),
    }),
    command: 'boolean_intersect',
    type: 'write',
  },
  {
    name: 'pilot_boolean_exclude',
    description: 'Exclude overlapping areas. [WRITE]',
    schema: z.object({
      nodeIds: z.array(z.string()).min(2).describe('Node IDs (at least 2)'),
    }),
    command: 'boolean_exclude',
    type: 'write',
  },

  // ==================== Pages and Viewport ====================
  {
    name: 'pilot_set_current_page',
    description: 'Set current page. [WRITE]',
    schema: z.object({
      pageId: z.string().describe('Page ID'),
    }),
    command: 'set_current_page',
    type: 'write',
  },
  {
    name: 'pilot_set_viewport',
    description: 'Set viewport center and zoom. [WRITE]',
    schema: z.object({
      center: z.object({ x: z.number(), y: z.number() }).optional().describe('Viewport center'),
      zoom: z.number().optional().describe('Zoom level'),
    }),
    command: 'set_viewport',
    type: 'write',
  },
  {
    name: 'pilot_scroll_to_node',
    description: 'Scroll viewport to show node. [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Node ID to scroll to'),
    }),
    command: 'scroll_to_node',
    type: 'write',
  },

  // ==================== Selection ====================
  {
    name: 'pilot_set_selection',
    description: 'Set current selection. [WRITE]',
    schema: z.object({
      nodeIds: z.array(z.string()).describe('Node IDs to select'),
    }),
    command: 'set_selection',
    type: 'write',
  },

  // ==================== Styles ====================
  {
    name: 'pilot_create_paint_style',
    description: 'Create a paint style. [WRITE]',
    schema: z.object({
      name: z.string().describe('Style name'),
      color: z
        .object({
          r: z.number().min(0).max(1),
          g: z.number().min(0).max(1),
          b: z.number().min(0).max(1),
          a: z.number().min(0).max(1).optional(),
        })
        .optional()
        .describe('Style color'),
    }),
    command: 'create_paint_style',
    type: 'write',
  },
  {
    name: 'pilot_create_text_style',
    description: 'Create a text style. [WRITE]',
    schema: z.object({
      name: z.string().describe('Style name'),
      fontFamily: z.string().default('Inter').describe('Font family'),
      fontStyle: z.string().default('Regular').describe('Font style'),
      fontSize: z.number().optional().describe('Font size'),
    }),
    command: 'create_text_style',
    type: 'write',
  },
  {
    name: 'pilot_apply_paint_style',
    description: 'Apply paint style to node. [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Target node ID'),
      styleId: z.string().describe('Paint style ID'),
    }),
    command: 'apply_paint_style',
    type: 'write',
  },
  {
    name: 'pilot_apply_text_style',
    description: 'Apply text style to text node. [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Target text node ID'),
      styleId: z.string().describe('Text style ID'),
    }),
    command: 'apply_text_style',
    type: 'write',
  },

  // ==================== Notifications ====================
  {
    name: 'pilot_notify',
    description: 'Show notification in Figma. [WRITE]',
    schema: z.object({
      message: z.string().describe('Notification message'),
      timeout: z.number().optional().describe('Timeout in ms'),
      error: z.boolean().optional().describe('Show as error'),
    }),
    command: 'notify',
    type: 'write',
  },

  // ==================== Layout Sizing ====================
  {
    name: 'pilot_set_layout_sizing',
    description: 'Set layout sizing mode (FILL/HUG/FIXED) for auto-layout children. Supports batch. [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Target node ID'),
      horizontal: z.enum(['FIXED', 'HUG', 'FILL']).optional().describe('Horizontal sizing'),
      vertical: z.enum(['FIXED', 'HUG', 'FILL']).optional().describe('Vertical sizing'),
    }),
    command: 'set_layout_sizing',
    type: 'write',
    supportsBatch: true,
  },
  {
    name: 'pilot_set_min_max_size',
    description: 'Set min/max width/height constraints. Supports batch. [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Target node ID'),
      minWidth: z.number().nullable().optional().describe('Min width (null to remove)'),
      maxWidth: z.number().nullable().optional().describe('Max width (null to remove)'),
      minHeight: z.number().nullable().optional().describe('Min height (null to remove)'),
      maxHeight: z.number().nullable().optional().describe('Max height (null to remove)'),
    }),
    command: 'set_min_max_size',
    type: 'write',
    supportsBatch: true,
  },
  {
    name: 'pilot_set_layout_align',
    description: 'Set layout align and grow for auto-layout children. Supports batch. [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Target node ID'),
      layoutAlign: z.enum(['INHERIT', 'STRETCH']).optional().describe('Layout align'),
      layoutGrow: z.number().min(0).max(1).optional().describe('Layout grow (0 or 1)'),
    }),
    command: 'set_layout_align',
    type: 'write',
    supportsBatch: true,
  },
  {
    name: 'pilot_set_layout_positioning',
    description: 'Set layout positioning (AUTO/ABSOLUTE) for auto-layout children. Supports batch. [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Target node ID'),
      positioning: z.enum(['AUTO', 'ABSOLUTE']).describe('Positioning mode'),
    }),
    command: 'set_layout_positioning',
    type: 'write',
    supportsBatch: true,
  },

  // ==================== Node Hierarchy ====================
  {
    name: 'pilot_append_child',
    description: 'Append a node as child of another node. [WRITE]',
    schema: z.object({
      parentId: z.string().describe('Parent node ID'),
      childId: z.string().describe('Child node ID to append'),
    }),
    command: 'append_child',
    type: 'write',
  },
  {
    name: 'pilot_insert_child',
    description: 'Insert a node at specific index in parent. [WRITE]',
    schema: z.object({
      parentId: z.string().describe('Parent node ID'),
      childId: z.string().describe('Child node ID to insert'),
      index: z.number().min(0).describe('Index position'),
    }),
    command: 'insert_child',
    type: 'write',
  },
  {
    name: 'pilot_reorder_child',
    description: 'Reorder a child node within its parent. [WRITE]',
    schema: z.object({
      parentId: z.string().describe('Parent node ID'),
      childId: z.string().describe('Child node ID to reorder'),
      index: z.number().min(0).describe('New index position'),
    }),
    command: 'reorder_child',
    type: 'write',
  },

  // ==================== Instance Operations ====================
  {
    name: 'pilot_detach_instance',
    description: 'Detach an instance from its component. [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Instance node ID'),
    }),
    command: 'detach_instance',
    type: 'write',
  },
  {
    name: 'pilot_reset_overrides',
    description: 'Reset all overrides on an instance. [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Instance node ID'),
    }),
    command: 'reset_overrides',
    type: 'write',
  },
  {
    name: 'pilot_swap_component',
    description: 'Swap an instance to a different component. [WRITE]',
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
    description: 'Set whether frame clips its content. Supports batch. [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Frame node ID'),
      clipsContent: z.boolean().describe('Clips content'),
    }),
    command: 'set_clips_content',
    type: 'write',
    supportsBatch: true,
  },
  {
    name: 'pilot_set_layout_wrap',
    description: 'Set layout wrap mode for auto-layout frame. [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Frame node ID'),
      wrap: z.enum(['NO_WRAP', 'WRAP']).describe('Wrap mode'),
      counterAxisSpacing: z.number().optional().describe('Spacing between wrapped rows'),
      counterAxisAlignContent: z.enum(['AUTO', 'SPACE_BETWEEN']).optional().describe('Wrapped content alignment'),
    }),
    command: 'set_layout_wrap',
    type: 'write',
  },
  {
    name: 'pilot_set_overflow',
    description: 'Set overflow/scroll direction. Supports batch. [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Frame node ID'),
      direction: z.enum(['NONE', 'HORIZONTAL', 'VERTICAL', 'BOTH']).describe('Overflow direction'),
    }),
    command: 'set_overflow',
    type: 'write',
    supportsBatch: true,
  },
  {
    name: 'pilot_set_guides',
    description: 'Set guides on a frame or page. [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Frame or Page ID'),
      guides: z
        .array(
          z.object({
            axis: z.enum(['X', 'Y']).describe('Guide axis'),
            offset: z.number().describe('Guide position'),
          }),
        )
        .describe('Guides array'),
    }),
    command: 'set_guides',
    type: 'write',
  },

  // ==================== Styles (Additional) ====================
  {
    name: 'pilot_create_effect_style',
    description: 'Create an effect style. [WRITE]',
    schema: z.object({
      name: z.string().describe('Style name'),
      effects: z.array(z.record(z.string(), z.unknown())).optional().describe('Effects array'),
    }),
    command: 'create_effect_style',
    type: 'write',
  },
  {
    name: 'pilot_create_grid_style',
    description: 'Create a grid style. [WRITE]',
    schema: z.object({
      name: z.string().describe('Style name'),
      layoutGrids: z.array(z.record(z.string(), z.unknown())).optional().describe('Layout grids array'),
    }),
    command: 'create_grid_style',
    type: 'write',
  },
  {
    name: 'pilot_apply_effect_style',
    description: 'Apply effect style to node. [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Target node ID'),
      styleId: z.string().describe('Effect style ID'),
    }),
    command: 'apply_effect_style',
    type: 'write',
  },
  {
    name: 'pilot_apply_grid_style',
    description: 'Apply grid style to frame. [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Frame node ID'),
      styleId: z.string().describe('Grid style ID'),
    }),
    command: 'apply_grid_style',
    type: 'write',
  },

  // ==================== Variable Binding ====================
  {
    name: 'pilot_set_bound_variable',
    description: 'Bind a variable to a node property. [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Target node ID'),
      field: z.string().describe("Field to bind (e.g., 'fills', 'opacity', 'visible')"),
      variableId: z.string().describe('Variable ID'),
    }),
    command: 'set_bound_variable',
    type: 'write',
  },

  // ==================== Component Properties ====================
  {
    name: 'pilot_set_component_properties',
    description: 'Set properties on a component instance. [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Instance node ID'),
      properties: z.record(z.string(), z.union([z.string(), z.boolean()])).describe('Properties to set'),
    }),
    command: 'set_component_properties',
    type: 'write',
  },

  // ==================== Export Settings ====================
  {
    name: 'pilot_set_export_settings',
    description: 'Set export settings on a node. [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Target node ID'),
      settings: z
        .array(
          z.object({
            format: z.enum(['PNG', 'JPG', 'SVG', 'PDF']).describe('Export format'),
            suffix: z.string().optional().describe('File suffix'),
            constraint: z
              .object({
                type: z.enum(['SCALE', 'WIDTH', 'HEIGHT']),
                value: z.number(),
              })
              .optional()
              .describe('Size constraint'),
          }),
        )
        .describe('Export settings'),
    }),
    command: 'set_export_settings',
    type: 'write',
  },

  // ==================== Prototype Interactions ====================
  {
    name: 'pilot_set_reactions',
    description: 'Set prototype reactions/interactions on a node. [WRITE]',
    schema: z.object({
      nodeId: z.string().describe('Target node ID'),
      reactions: z.array(z.record(z.string(), z.unknown())).describe('Reactions array'),
    }),
    command: 'set_reactions',
    type: 'write',
  },

  // ==================== Variable Creation ====================
  {
    name: 'pilot_create_variable_collection',
    description: 'Create a variable collection. [WRITE]',
    schema: z.object({
      name: z.string().describe('Collection name'),
    }),
    command: 'create_variable_collection',
    type: 'write',
  },
  {
    name: 'pilot_create_variable',
    description: 'Create a variable in a collection. [WRITE]',
    schema: z.object({
      name: z.string().describe('Variable name'),
      collectionId: z.string().describe('Variable collection ID'),
      resolvedType: z.enum(['BOOLEAN', 'FLOAT', 'STRING', 'COLOR']).describe('Variable type'),
    }),
    command: 'create_variable',
    type: 'write',
  },
  {
    name: 'pilot_set_variable_value',
    description: "Set a variable's value for a specific mode. [WRITE]",
    schema: z.object({
      variableId: z.string().describe('Variable ID'),
      modeId: z.string().describe('Mode ID'),
      value: z.unknown().describe('Variable value (type depends on resolvedType)'),
    }),
    command: 'set_variable_value',
    type: 'write',
  },
  {
    name: 'pilot_create_variable_alias',
    description: 'Create an alias to another variable. [WRITE]',
    schema: z.object({
      variableId: z.string().describe('Variable ID to alias'),
    }),
    command: 'create_variable_alias',
    type: 'write',
  },
  {
    name: 'pilot_set_bound_variable_for_paint',
    description: "Bind a color variable to a node's fill paint. [WRITE]",
    schema: z.object({
      nodeId: z.string().describe('Target node ID'),
      variableId: z.string().describe('Color variable ID'),
      fillIndex: z.number().default(0).describe('Fill index (default 0)'),
    }),
    command: 'set_bound_variable_for_paint',
    type: 'write',
  },
  {
    name: 'pilot_set_bound_variable_for_effect',
    description: "Bind a variable to a node's effect. [WRITE]",
    schema: z.object({
      nodeId: z.string().describe('Target node ID'),
      variableId: z.string().describe('Variable ID'),
      effectIndex: z.number().default(0).describe('Effect index (default 0)'),
      field: z.string().describe("Effect field to bind (e.g., 'color', 'radius')"),
    }),
    command: 'set_bound_variable_for_effect',
    type: 'write',
  },
  {
    name: 'pilot_set_bound_variable_for_layout_grid',
    description: "Bind a variable to a frame's layout grid property. [WRITE]",
    schema: z.object({
      nodeId: z.string().describe('Target frame node ID'),
      variableId: z.string().describe('Variable ID'),
      gridIndex: z.number().default(0).describe('Grid index (default 0)'),
      field: z.string().describe("Grid field to bind (e.g., 'gutterSize', 'count', 'offset', 'sectionSize')"),
    }),
    command: 'set_bound_variable_for_layout_grid',
    type: 'write',
  },

  // ==================== Team Library ====================
  {
    name: 'pilot_import_style_by_key',
    description: 'Import a style from a team library by its key. [WRITE]',
    schema: z.object({
      key: z.string().describe('Style key from published team library'),
    }),
    command: 'import_style_by_key',
    type: 'write',
  },
  {
    name: 'pilot_import_variable_by_key',
    description: 'Import a variable from a team library by its key. [WRITE]',
    schema: z.object({
      key: z.string().describe('Variable key from published team library'),
    }),
    command: 'import_variable_by_key',
    type: 'write',
  },

  // ==================== Combine As Variants ====================
  {
    name: 'pilot_combine_as_variants',
    description: 'Combine multiple components as variants into a component set. [WRITE]',
    schema: z.object({
      nodeIds: z.array(z.string()).min(2).describe('Component node IDs (at least 2)'),
    }),
    command: 'combine_as_variants',
    type: 'write',
  },

  // ==================== Style Ordering ====================
  {
    name: 'pilot_move_paint_style_after',
    description: 'Move a paint style after another in the list. [WRITE]',
    schema: z.object({
      targetStyleId: z.string().describe('Style ID to move'),
      referenceStyleId: z.string().nullable().optional().describe('Style ID to place after (null for beginning)'),
    }),
    command: 'move_paint_style_after',
    type: 'write',
  },
  {
    name: 'pilot_move_text_style_after',
    description: 'Move a text style after another in the list. [WRITE]',
    schema: z.object({
      targetStyleId: z.string().describe('Style ID to move'),
      referenceStyleId: z.string().nullable().optional().describe('Style ID to place after (null for beginning)'),
    }),
    command: 'move_text_style_after',
    type: 'write',
  },
  {
    name: 'pilot_move_effect_style_after',
    description: 'Move an effect style after another in the list. [WRITE]',
    schema: z.object({
      targetStyleId: z.string().describe('Style ID to move'),
      referenceStyleId: z.string().nullable().optional().describe('Style ID to place after (null for beginning)'),
    }),
    command: 'move_effect_style_after',
    type: 'write',
  },
  {
    name: 'pilot_move_grid_style_after',
    description: 'Move a grid style after another in the list. [WRITE]',
    schema: z.object({
      targetStyleId: z.string().describe('Style ID to move'),
      referenceStyleId: z.string().nullable().optional().describe('Style ID to place after (null for beginning)'),
    }),
    command: 'move_grid_style_after',
    type: 'write',
  },

  // ==================== Utility ====================
  {
    name: 'pilot_create_solid_paint',
    description: "Create a solid paint object using Figma's util.solidPaint. [WRITE]",
    schema: z.object({
      color: z.string().describe("Color string (e.g., '#FF0000', 'red')"),
      overrides: z.record(z.string(), z.unknown()).optional().describe('Optional paint overrides'),
    }),
    command: 'create_solid_paint',
    type: 'write',
  },

  // ==================== Event Subscription ====================
  {
    name: 'pilot_subscribe_event',
    description: 'Subscribe to a Figma event. Events will be pushed via WebSocket. [WRITE]',
    schema: z.object({
      eventType: z
        .enum(['selectionchange', 'currentpagechange', 'documentchange', 'stylechange'])
        .describe('Event type to subscribe'),
    }),
    command: 'subscribe_event',
    type: 'write',
  },
  {
    name: 'pilot_unsubscribe_event',
    description: 'Unsubscribe from a Figma event. [WRITE]',
    schema: z.object({
      eventType: z
        .enum(['selectionchange', 'currentpagechange', 'documentchange', 'stylechange'])
        .describe('Event type to unsubscribe'),
    }),
    command: 'unsubscribe_event',
    type: 'write',
  },
];

export function registerModificationTools(server: McpServer): void {
  registerToolsFromDefs(server, tools);
}
