import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

/**
 * Register all prompts with the MCP server
 * Prompts provide reusable templates for common Figma design tasks
 */
export function registerPrompts(server: McpServer): void {
  // Quick Start Guide
  server.registerPrompt('quick_start', { description: 'Get started with Figma Pilot MCP' }, () => ({
    messages: [
      {
        role: 'assistant',
        content: {
          type: 'text',
          text: `# Figma Pilot MCP - Quick Start

## Step 1: Connect to Figma
1. Open a Figma file in Figma Desktop
2. Run the Figma Pilot plugin (Plugins → Development → Figma Pilot MCP)
3. Copy the channel name from the plugin UI
4. Use \`pilot_connect\` with the channel name

\`\`\`
pilot_connect({ channel: "figma-pilot-your-channel" })
\`\`\`

## Step 2: Read the Design
\`\`\`
pilot_get_selection()     // Get selected nodes
pilot_get_current_page()  // Get current page info
pilot_find_nodes({ type: "FRAME" })  // Find all frames
\`\`\`

## Step 3: Create Elements
\`\`\`
pilot_create_frame({ name: "Card", width: 300, height: 200 })
pilot_create_text({ characters: "Hello", x: 10, y: 10 })
pilot_create_rectangle({ width: 100, height: 50 })
\`\`\`

## Step 4: Modify Elements
\`\`\`
pilot_set_fill({ nodeId: "1:23", color: "#FF5500" })
pilot_set_auto_layout({ nodeId: "1:23", mode: "VERTICAL" })
pilot_set_layout_sizing({ nodeId: "1:24", horizontal: "FILL" })
\`\`\`

## Pro Tips
- Use \`pilot_batch\` to run multiple commands at once
- Reference previous results with \`$0.id\`, \`$1.id\`, etc.
- Use \`pilot_create_node_tree\` to create complex nested structures in one call
- Most modification tools support batch operations`,
        },
      },
    ],
  }));

  // Design System Setup
  server.registerPrompt('design_system', { description: 'Create a basic design system structure' }, () => ({
    messages: [
      {
        role: 'assistant',
        content: {
          type: 'text',
          text: `# Design System Setup Guide

## 1. Color Styles
Create reusable color styles for consistency:

\`\`\`
// Primary colors
pilot_create_paint_style({ name: "Primary/500", color: { r: 0.2, g: 0.4, b: 1, a: 1 } })
pilot_create_paint_style({ name: "Primary/100", color: { r: 0.9, g: 0.95, b: 1, a: 1 } })

// Neutral colors
pilot_create_paint_style({ name: "Neutral/900", color: { r: 0.1, g: 0.1, b: 0.1, a: 1 } })
pilot_create_paint_style({ name: "Neutral/100", color: { r: 0.96, g: 0.96, b: 0.96, a: 1 } })
\`\`\`

## 2. Text Styles
\`\`\`
pilot_create_text_style({ name: "Heading/H1", fontFamily: "Inter", fontStyle: "Bold", fontSize: 32 })
pilot_create_text_style({ name: "Heading/H2", fontFamily: "Inter", fontStyle: "SemiBold", fontSize: 24 })
pilot_create_text_style({ name: "Body/Regular", fontFamily: "Inter", fontStyle: "Regular", fontSize: 16 })
pilot_create_text_style({ name: "Body/Small", fontFamily: "Inter", fontStyle: "Regular", fontSize: 14 })
\`\`\`

## 3. Effect Styles
\`\`\`
pilot_create_effect_style({
  name: "Shadow/Small",
  effects: [{ type: "DROP_SHADOW", color: { r: 0, g: 0, b: 0, a: 0.1 }, offset: { x: 0, y: 2 }, radius: 4 }]
})
\`\`\`

## 4. Component Structure
- Create base components first
- Use variants for different states
- Name with clear hierarchy: "Button/Primary/Default"`,
        },
      },
    ],
  }));

  // Auto Layout Guide
  server.registerPrompt('auto_layout', { description: 'Master Auto Layout in Figma' }, () => ({
    messages: [
      {
        role: 'assistant',
        content: {
          type: 'text',
          text: `# Auto Layout Mastery

## Basic Setup
\`\`\`
pilot_set_auto_layout({
  nodeId: "1:23",
  mode: "VERTICAL",        // or "HORIZONTAL"
  padding: { top: 16, right: 16, bottom: 16, left: 16 },
  itemSpacing: 8,
  primaryAxisAlignItems: "CENTER",    // MIN, CENTER, MAX, SPACE_BETWEEN
  counterAxisAlignItems: "CENTER"     // MIN, CENTER, MAX, BASELINE
})
\`\`\`

## Sizing Modes

### Frame Sizing (Parent)
- \`primaryAxisSizingMode: "AUTO"\` → Hug contents
- \`primaryAxisSizingMode: "FIXED"\` → Fixed size

### Child Sizing
\`\`\`
// Make child fill available space
pilot_set_layout_sizing({ nodeId: "1:24", horizontal: "FILL" })

// Make child hug its content
pilot_set_layout_sizing({ nodeId: "1:24", vertical: "HUG" })

// Fixed size
pilot_set_layout_sizing({ nodeId: "1:24", horizontal: "FIXED" })
\`\`\`

## Min/Max Constraints
\`\`\`
pilot_set_min_max_size({
  nodeId: "1:24",
  minWidth: 100,
  maxWidth: 400,
  minHeight: 50
})
\`\`\`

## Wrap Mode
\`\`\`
pilot_set_layout_wrap({
  nodeId: "1:23",
  wrap: "WRAP",
  counterAxisSpacing: 8
})
\`\`\`

## Absolute Positioning (within Auto Layout)
\`\`\`
pilot_set_layout_positioning({
  nodeId: "1:25",
  positioning: "ABSOLUTE"
})
\`\`\``,
        },
      },
    ],
  }));

  // Component Workflow
  server.registerPrompt('component_workflow', { description: 'Best practices for working with components' }, () => ({
    messages: [
      {
        role: 'assistant',
        content: {
          type: 'text',
          text: `# Component Workflow

## Creating Components

### From Scratch
\`\`\`
pilot_create_component({
  name: "Button/Primary",
  width: 120,
  height: 40
})
\`\`\`

### From Existing Node
\`\`\`
pilot_create_component_from_node({ nodeId: "1:23" })
\`\`\`

## Working with Instances

### Create Instance
\`\`\`
pilot_create_instance({
  componentKey: "abc123...",
  x: 100,
  y: 100
})
\`\`\`

### Modify Instance Properties
\`\`\`
pilot_set_component_properties({
  nodeId: "1:50",
  properties: {
    "Label": "Click me",
    "ShowIcon": true
  }
})
\`\`\`

### Swap Component
\`\`\`
pilot_swap_component({
  nodeId: "1:50",
  componentKey: "new-component-key"
})
\`\`\`

### Detach Instance
\`\`\`
pilot_detach_instance({ nodeId: "1:50" })
\`\`\`

### Reset Overrides
\`\`\`
pilot_reset_overrides({ nodeId: "1:50" })
\`\`\`

## Finding Components
\`\`\`
pilot_get_local_components()
pilot_find_nodes({ type: "COMPONENT" })
pilot_find_nodes({ type: "INSTANCE", name: "Button*" })
\`\`\``,
        },
      },
    ],
  }));

  // Batch Operations Guide
  server.registerPrompt('batch_operations', { description: 'Efficient batch operations for bulk changes' }, () => ({
    messages: [
      {
        role: 'assistant',
        content: {
          type: 'text',
          text: `# Batch Operations

## Using pilot_batch
Execute multiple commands with result references:

\`\`\`json
{
  "commands": [
    {
      "command": "create_frame",
      "params": { "name": "Card", "width": 300, "height": 200 }
    },
    {
      "command": "create_text",
      "params": { "parentId": "$0.id", "characters": "Title", "x": 16, "y": 16 }
    },
    {
      "command": "set_fill_color",
      "params": { "nodeId": "$0.id", "r": 1, "g": 1, "b": 1 }
    },
    {
      "command": "set_auto_layout",
      "params": { "nodeId": "$0.id", "mode": "VERTICAL", "itemSpacing": 8 }
    }
  ]
}
\`\`\`

## Reference Syntax
- \`$0\` → Result of first command
- \`$1.id\` → ID from second command's result
- \`$2.name\` → Name from third command's result

## Batch-Enabled Tools
These tools support batch mode directly:
- \`pilot_set_fill\`
- \`pilot_set_stroke\`
- \`pilot_resize_node\`
- \`pilot_set_opacity\`
- \`pilot_set_visible\`
- \`pilot_delete_node\`
- \`pilot_set_layout_sizing\`
- And many more...

## Example: Style Multiple Nodes
\`\`\`json
{
  "commands": [
    { "command": "set_fill_color", "params": { "nodeId": "1:10", "r": 0.2, "g": 0.4, "b": 1 } },
    { "command": "set_fill_color", "params": { "nodeId": "1:11", "r": 0.2, "g": 0.4, "b": 1 } },
    { "command": "set_fill_color", "params": { "nodeId": "1:12", "r": 0.2, "g": 0.4, "b": 1 } }
  ]
}
\`\`\``,
        },
      },
    ],
  }));

  // Prototyping Guide
  server.registerPrompt('prototyping', { description: 'Add prototype interactions and flows' }, () => ({
    messages: [
      {
        role: 'assistant',
        content: {
          type: 'text',
          text: `# Prototyping with Figma Pilot

## Reading Existing Interactions
\`\`\`
pilot_get_reactions({ nodeId: "1:23" })
\`\`\`

## Setting Interactions
\`\`\`
pilot_set_reactions({
  nodeId: "1:23",
  reactions: [
    {
      trigger: { type: "ON_CLICK" },
      action: {
        type: "NODE",
        destinationId: "2:45",
        navigation: "NAVIGATE",
        transition: {
          type: "DISSOLVE",
          duration: 0.3,
          easing: { type: "EASE_OUT" }
        }
      }
    }
  ]
})
\`\`\`

## Common Trigger Types
- \`ON_CLICK\` - Click/tap
- \`ON_HOVER\` - Mouse hover
- \`ON_PRESS\` - Mouse down
- \`ON_DRAG\` - Drag gesture
- \`AFTER_TIMEOUT\` - Auto-advance

## Common Action Types
- \`NODE\` - Navigate to frame
- \`BACK\` - Go back
- \`CLOSE\` - Close overlay
- \`URL\` - Open URL

## Transition Types
- \`DISSOLVE\` - Fade
- \`SMART_ANIMATE\` - Smart animate
- \`MOVE_IN\` / \`MOVE_OUT\` - Slide
- \`PUSH\` - Push
- \`SLIDE_IN\` / \`SLIDE_OUT\` - Slide

## Overflow Scrolling
\`\`\`
pilot_set_overflow({
  nodeId: "1:23",
  direction: "VERTICAL"  // NONE, HORIZONTAL, VERTICAL, BOTH
})
\`\`\``,
        },
      },
    ],
  }));

  // Variables Guide
  server.registerPrompt('variables', { description: 'Work with Figma Variables for design tokens' }, () => ({
    messages: [
      {
        role: 'assistant',
        content: {
          type: 'text',
          text: `# Figma Variables Guide

## Reading Variables

### Get Local Variables
\`\`\`
pilot_get_local_variables()
pilot_get_local_variables({ type: "COLOR" })  // Filter by type: BOOLEAN, FLOAT, STRING, COLOR
\`\`\`

### Get Variable Collections
\`\`\`
pilot_get_variable_collections()
\`\`\`

### Get Library Variables
\`\`\`
pilot_get_library_variable_collections()
pilot_get_library_variables({ collectionKey: "abc123" })
\`\`\`

## Creating Variables

### Create Collection
\`\`\`
pilot_create_variable_collection({ name: "Tokens" })
\`\`\`

### Create Variable
\`\`\`
pilot_create_variable({
  name: "primary-color",
  collectionId: "VariableCollectionId:1:0",
  resolvedType: "COLOR"  // BOOLEAN, FLOAT, STRING, COLOR
})
\`\`\`

### Set Variable Value
\`\`\`
pilot_set_variable_value({
  variableId: "VariableID:1:0",
  modeId: "1:0",
  value: { r: 0.2, g: 0.4, b: 1, a: 1 }  // For COLOR type
})
\`\`\`

### Create Variable Alias
\`\`\`
pilot_create_variable_alias({ variableId: "VariableID:1:0" })
\`\`\`

## Binding Variables

### Bind to Fill
\`\`\`
pilot_set_bound_variable_for_paint({
  nodeId: "1:23",
  variableId: "VariableID:1:0",
  fillIndex: 0
})
\`\`\`

### Bind to Node Property
\`\`\`
pilot_set_bound_variable({
  nodeId: "1:23",
  field: "opacity",  // opacity, visible, etc.
  variableId: "VariableID:1:0"
})
\`\`\`

### Bind to Effect
\`\`\`
pilot_set_bound_variable_for_effect({
  nodeId: "1:23",
  variableId: "VariableID:1:0",
  effectIndex: 0,
  field: "color"
})
\`\`\`

## Import from Library
\`\`\`
pilot_import_variable({ variableKey: "abc123..." })
\`\`\``,
        },
      },
    ],
  }));

  // Events Guide
  server.registerPrompt('events', { description: 'Subscribe to Figma events for real-time updates' }, () => ({
    messages: [
      {
        role: 'assistant',
        content: {
          type: 'text',
          text: `# Figma Events Guide

## Available Events
- \`selectionchange\` - When selection changes
- \`currentpagechange\` - When page switches
- \`documentchange\` - When document is modified
- \`stylechange\` - When styles change

## Subscribe to Events
\`\`\`
pilot_subscribe_event({ eventType: "selectionchange" })
pilot_subscribe_event({ eventType: "documentchange" })
\`\`\`

## Unsubscribe from Events
\`\`\`
pilot_unsubscribe_event({ eventType: "selectionchange" })
\`\`\`

## Check Subscription Status
\`\`\`
pilot_get_event_subscriptions()
\`\`\`

## Event Data

### selectionchange
\`\`\`json
{
  "eventType": "selectionchange",
  "data": {
    "nodes": [
      { "id": "1:23", "name": "Frame", "type": "FRAME" }
    ]
  }
}
\`\`\`

### currentpagechange
\`\`\`json
{
  "eventType": "currentpagechange",
  "data": {
    "id": "0:1",
    "name": "Page 1"
  }
}
\`\`\`

### documentchange
\`\`\`json
{
  "eventType": "documentchange",
  "data": {
    "changes": [
      { "type": "CREATE", "id": "1:50" },
      { "type": "PROPERTY_CHANGE", "id": "1:23", "properties": ["fills"] }
    ]
  }
}
\`\`\`

### stylechange
\`\`\`json
{
  "eventType": "stylechange",
  "data": {
    "changes": [
      { "type": "STYLE_CREATE", "id": "S:abc123" }
    ]
  }
}
\`\`\`

Note: Events are pushed via WebSocket when subscribed.`,
        },
      },
    ],
  }));

  // Images Guide
  server.registerPrompt('images', { description: 'Work with images in Figma' }, () => ({
    messages: [
      {
        role: 'assistant',
        content: {
          type: 'text',
          text: `# Working with Images

## Create Image from Base64
\`\`\`
pilot_create_image({
  base64: "iVBORw0KGgoAAAANS...",
  name: "My Image",
  x: 100,
  y: 100,
  width: 200,
  height: 150,
  scaleMode: "FILL"  // FILL, FIT, CROP, TILE
})
\`\`\`

## Create Image from URL
\`\`\`
pilot_create_image_from_url({
  url: "https://example.com/image.png",
  name: "Remote Image",
  x: 100,
  y: 100,
  scaleMode: "FIT"
})
\`\`\`

## Get Image Info
When a node has an image fill, the imageHash is returned:
\`\`\`
pilot_get_node({ nodeId: "1:23" })
// Returns: { fills: [{ type: "IMAGE", imageHash: "abc123..." }] }
\`\`\`

## Get Image by Hash
\`\`\`
pilot_get_image_by_hash({ hash: "abc123..." })
// Returns: { hash, width, height }
\`\`\`

## Get Image Bytes
\`\`\`
pilot_get_image_bytes({ hash: "abc123..." })
// Returns: { hash, base64, size }
\`\`\`

## Export Node as Image
\`\`\`
pilot_export_node({
  nodeId: "1:23",
  format: "PNG",  // PNG, JPG, SVG, PDF
  scale: 2
})
// Returns: { format, base64, size }
\`\`\``,
        },
      },
    ],
  }));

  // Typography Guide
  server.registerPrompt('typography', { description: 'Master text and typography in Figma' }, () => ({
    messages: [
      {
        role: 'assistant',
        content: {
          type: 'text',
          text: `# Typography Guide

## List Available Fonts
\`\`\`
pilot_list_available_fonts()
// Returns: { count, fonts: [{ family, style }] }
\`\`\`

## Create Text
\`\`\`
pilot_create_text({
  characters: "Hello World",
  x: 100,
  y: 100,
  fontSize: 24,
  fontFamily: "Inter",
  fontStyle: "Bold"
})
\`\`\`

## Text Content
\`\`\`
pilot_set_text_content({
  nodeId: "1:23",
  characters: "New text content"
})
\`\`\`

## Font Properties
\`\`\`
pilot_set_font_size({ nodeId: "1:23", fontSize: 18 })
pilot_set_font_name({ nodeId: "1:23", family: "Inter", style: "Medium" })
pilot_set_font_weight({ nodeId: "1:23", fontWeight: 700 })
pilot_set_text_color({ nodeId: "1:23", color: "#333333" })
\`\`\`

## Text Alignment
\`\`\`
pilot_set_text_align({
  nodeId: "1:23",
  horizontal: "CENTER",  // LEFT, CENTER, RIGHT, JUSTIFIED
  vertical: "TOP"        // TOP, CENTER, BOTTOM
})
\`\`\`

## Line & Letter Spacing
\`\`\`
pilot_set_line_height({
  nodeId: "1:23",
  lineHeight: 1.5,
  unit: "PERCENT"  // PIXELS, PERCENT, AUTO
})

pilot_set_letter_spacing({
  nodeId: "1:23",
  letterSpacing: 0.5,
  unit: "PERCENT"  // PIXELS, PERCENT
})
\`\`\`

## Paragraph Settings
\`\`\`
pilot_set_paragraph_indent({ nodeId: "1:23", paragraphIndent: 24 })
pilot_set_paragraph_spacing({ nodeId: "1:23", paragraphSpacing: 16 })
\`\`\`

## Text Decoration & Case
\`\`\`
pilot_set_text_decoration({
  nodeId: "1:23",
  decoration: "UNDERLINE"  // NONE, UNDERLINE, STRIKETHROUGH
})

pilot_set_text_case({
  nodeId: "1:23",
  textCase: "UPPER"  // ORIGINAL, UPPER, LOWER, TITLE, SMALL_CAPS
})
\`\`\`

## Text Styles
\`\`\`
// Create
pilot_create_text_style({
  name: "Heading/H1",
  fontFamily: "Inter",
  fontStyle: "Bold",
  fontSize: 32
})

// Apply
pilot_apply_text_style({
  nodeId: "1:23",
  styleId: "S:abc123"
})
\`\`\``,
        },
      },
    ],
  }));

  // Variants Guide
  server.registerPrompt('variants', { description: 'Create and manage component variants' }, () => ({
    messages: [
      {
        role: 'assistant',
        content: {
          type: 'text',
          text: `# Component Variants Guide

## Create Components for Variants
First, create multiple components with variant naming:
\`\`\`
// Using batch to create button variants
pilot_batch({
  commands: [
    { "command": "create_component", "params": { "name": "State=Default", "width": 100, "height": 40 } },
    { "command": "create_component", "params": { "name": "State=Hover", "width": 100, "height": 40, "y": 50 } },
    { "command": "create_component", "params": { "name": "State=Pressed", "width": 100, "height": 40, "y": 100 } }
  ]
})
\`\`\`

## Combine as Variants
\`\`\`
pilot_combine_as_variants({
  nodeIds: ["1:10", "1:11", "1:12"]  // Component IDs
})
// Returns: { id, name, key } of the new ComponentSet
\`\`\`

## Explore Library Component Variants
\`\`\`
pilot_get_component_set_variants({
  componentSetKey: "abc123..."
})
// Returns:
// {
//   componentSetId,
//   componentSetName,
//   variantGroupProperties,
//   count,
//   variants: [
//     { id, name, key, variantProperties: { "State": "Default" } }
//   ]
// }
\`\`\`

## Set Instance Variant
\`\`\`
pilot_set_component_properties({
  nodeId: "1:50",  // Instance ID
  properties: {
    "State": "Hover",
    "Size": "Large"
  }
})
\`\`\`

## Get Component Properties
\`\`\`
pilot_get_component_properties({ nodeId: "1:50" })
// For Instance: { properties: { "State": { value: "Default", type: "VARIANT" } } }
// For Component: { propertyDefinitions: { ... } }
\`\`\`

## Swap to Different Variant
\`\`\`
pilot_swap_component({
  nodeId: "1:50",
  componentKey: "variant-component-key"
})
\`\`\``,
        },
      },
    ],
  }));

  // Node Tree Guide
  server.registerPrompt('node_tree', { description: 'Create complex nested structures with a single call' }, () => ({
    messages: [
      {
        role: 'assistant',
        content: {
          type: 'text',
          text: `# Creating Node Trees

## Overview
\`pilot_create_node_tree\` creates complex nested structures in a single call, returning all node IDs.

## Basic Example
\`\`\`json
{
  "tree": {
    "type": "FRAME",
    "name": "Card",
    "width": 300,
    "height": 200,
    "fills": [{ "type": "SOLID", "color": { "r": 1, "g": 1, "b": 1 } }],
    "cornerRadius": 8,
    "children": [
      {
        "type": "TEXT",
        "name": "Title",
        "characters": "Hello World",
        "fontSize": 24,
        "fontFamily": "Inter",
        "fontStyle": "Bold"
      }
    ]
  }
}
\`\`\`

## Supported Node Types
- \`FRAME\` - Container with optional auto layout
- \`RECTANGLE\` - Basic rectangle shape
- \`ELLIPSE\` - Ellipse/circle shape
- \`POLYGON\` - Polygon shape
- \`STAR\` - Star shape
- \`LINE\` - Line
- \`VECTOR\` - Vector path
- \`TEXT\` - Text node
- \`COMPONENT\` - Component

## Common Properties (All Nodes)
\`\`\`json
{
  "name": "Node Name",
  "x": 0,
  "y": 0,
  "width": 100,
  "height": 100,
  "visible": true,
  "locked": false,
  "opacity": 1,
  "rotation": 0
}
\`\`\`

## Style Properties
\`\`\`json
{
  "fills": [{ "type": "SOLID", "color": { "r": 1, "g": 0, "b": 0 } }],
  "strokes": [{ "type": "SOLID", "color": { "r": 0, "g": 0, "b": 0 } }],
  "strokeWeight": 1,
  "cornerRadius": 8
}
\`\`\`

## Text Properties
\`\`\`json
{
  "type": "TEXT",
  "characters": "Hello",
  "fontSize": 16,
  "fontFamily": "Inter",
  "fontStyle": "Regular",
  "textAlignHorizontal": "LEFT"
}
\`\`\`

## Auto Layout (FRAME/COMPONENT)
\`\`\`json
{
  "type": "FRAME",
  "layoutMode": "VERTICAL",
  "primaryAxisAlignItems": "CENTER",
  "counterAxisAlignItems": "CENTER",
  "itemSpacing": 8,
  "paddingTop": 16,
  "paddingRight": 16,
  "paddingBottom": 16,
  "paddingLeft": 16
}
\`\`\`

## Complete Card Example
\`\`\`json
{
  "tree": {
    "type": "FRAME",
    "name": "Card",
    "width": 320,
    "height": 180,
    "layoutMode": "VERTICAL",
    "paddingTop": 20,
    "paddingRight": 20,
    "paddingBottom": 20,
    "paddingLeft": 20,
    "itemSpacing": 12,
    "fills": [{ "type": "SOLID", "color": { "r": 1, "g": 1, "b": 1 } }],
    "cornerRadius": 12,
    "children": [
      {
        "type": "TEXT",
        "name": "Title",
        "characters": "Welcome",
        "fontSize": 24,
        "fontFamily": "Inter",
        "fontStyle": "Bold",
        "fills": [{ "type": "SOLID", "color": { "r": 0.1, "g": 0.1, "b": 0.1 } }]
      },
      {
        "type": "FRAME",
        "name": "Divider",
        "width": 280,
        "height": 1,
        "fills": [{ "type": "SOLID", "color": { "r": 0.9, "g": 0.9, "b": 0.9 } }]
      },
      {
        "type": "TEXT",
        "name": "Description",
        "characters": "Create complex layouts with a single API call.",
        "fontSize": 14,
        "fontFamily": "Inter",
        "fontStyle": "Regular",
        "fills": [{ "type": "SOLID", "color": { "r": 0.4, "g": 0.4, "b": 0.4 } }]
      }
    ]
  }
}
\`\`\`

## Response Structure
Returns node IDs in a tree structure:
\`\`\`json
{
  "id": "1:23",
  "name": "Card",
  "type": "FRAME",
  "children": [
    { "id": "1:24", "name": "Title", "type": "TEXT" },
    { "id": "1:25", "name": "Divider", "type": "FRAME" },
    { "id": "1:26", "name": "Description", "type": "TEXT" }
  ]
}
\`\`\`

## Append to Existing Node
\`\`\`json
{
  "tree": { ... },
  "parentId": "1:10"
}
\`\`\``,
        },
      },
    ],
  }));

  // Utility Functions Guide
  server.registerPrompt('utilities', { description: 'Helpful utility functions' }, () => ({
    messages: [
      {
        role: 'assistant',
        content: {
          type: 'text',
          text: `# Utility Functions

## Color Parsing

### Parse to RGB
\`\`\`
pilot_parse_color({ color: "#FF5500" })
pilot_parse_color({ color: "red" })
pilot_parse_color({ color: "rgb(255, 85, 0)" })
// Returns: { r: 1, g: 0.33, b: 0 }  (values 0-1)
\`\`\`

### Parse to RGBA
\`\`\`
pilot_parse_color_rgba({ color: "#FF550080" })
pilot_parse_color_rgba({ color: "rgba(255, 85, 0, 0.5)" })
// Returns: { r: 1, g: 0.33, b: 0, a: 0.5 }
\`\`\`

## Create Solid Paint
\`\`\`
pilot_create_solid_paint({
  color: "#FF5500",
  overrides: { opacity: 0.8 }
})
// Returns a SolidPaint object ready to use
\`\`\`

## Selection Colors
Get all colors used in current selection:
\`\`\`
pilot_get_selection_colors()
// Returns: { paints: [...], styles: [...] }
\`\`\`

## Style Ordering
Reorder styles in the styles panel:
\`\`\`
// Move style to beginning
pilot_move_paint_style_after({
  targetStyleId: "S:abc123",
  referenceStyleId: null
})

// Move after another style
pilot_move_paint_style_after({
  targetStyleId: "S:abc123",
  referenceStyleId: "S:def456"
})

// Also available for other style types:
pilot_move_text_style_after({ ... })
pilot_move_effect_style_after({ ... })
pilot_move_grid_style_after({ ... })
\`\`\`

## Notify User
\`\`\`
pilot_notify({
  message: "Operation completed!",
  timeout: 3000,
  error: false
})
\`\`\``,
        },
      },
    ],
  }));
}
