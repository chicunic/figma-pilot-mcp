import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Register all prompts with the MCP server
 * Prompts provide reusable templates for common Figma design tasks
 */
export function registerPrompts(server: McpServer): void {
  // Quick Start Guide
  server.prompt(
    "quick_start",
    "Get started with Figma Pilot MCP",
    () => ({
      messages: [
        {
          role: "assistant",
          content: {
            type: "text",
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
- Most modification tools support batch operations`,
          },
        },
      ],
    })
  );

  // Design System Setup
  server.prompt(
    "design_system",
    "Create a basic design system structure",
    () => ({
      messages: [
        {
          role: "assistant",
          content: {
            type: "text",
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
    })
  );

  // Auto Layout Guide
  server.prompt(
    "auto_layout",
    "Master Auto Layout in Figma",
    () => ({
      messages: [
        {
          role: "assistant",
          content: {
            type: "text",
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
    })
  );

  // Component Workflow
  server.prompt(
    "component_workflow",
    "Best practices for working with components",
    () => ({
      messages: [
        {
          role: "assistant",
          content: {
            type: "text",
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
    })
  );

  // Batch Operations Guide
  server.prompt(
    "batch_operations",
    "Efficient batch operations for bulk changes",
    () => ({
      messages: [
        {
          role: "assistant",
          content: {
            type: "text",
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
    })
  );

  // Prototyping Guide
  server.prompt(
    "prototyping",
    "Add prototype interactions and flows",
    () => ({
      messages: [
        {
          role: "assistant",
          content: {
            type: "text",
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
    })
  );
}
