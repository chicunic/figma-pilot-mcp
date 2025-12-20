# figma-pilot-mcp

An MCP server that gives AI full control over Figma — read, create, and modify designs with ease.

## Features

- **Full Figma Control**: Create, read, modify, and delete design elements
- **WebSocket Communication**: Real-time bidirectional communication between MCP server and Figma plugin
- **Batch Operations**: Execute multiple commands in sequence with result references
- **Two Modes**: Write-only (default) or read-write mode

## Installation

```bash
bun install
```

## Quick Start

1. **Build the Figma plugin**:

   ```bash
   bun run build:plugin
   ```

2. **Import plugin into Figma Desktop**:

   - Open Figma Desktop app
   - Click the menu in the top-left corner
   - Go to **Plugins** → **Development** → **Import plugin from manifest...**
   - Navigate to the project directory and select `dist/plugin/manifest.json`
   - The plugin is now installed for development

   > **Note**: You need the Figma Desktop app. The web version does not support local plugin development.

3. **Configure your MCP client** (e.g., Claude Desktop):

   ```jsonc
   {
     "mcpServers": {
       "figma-pilot": {
         "command": "bun",
         "args": ["run", "/path/to/figma-pilot-mcp/src/server.ts"]
       }
     }
   }
   ```

4. **Run the plugin and connect**:

   - In Figma, open a design file
   - Go to **Plugins** → **Development** → **Figma Pilot MCP**
   - The plugin UI will show a channel name (e.g., `figma-pilot-abc123`)
   - In your MCP client, use `pilot_connect` with the channel name to establish connection

   > **Tip**: After modifying plugin code, rebuild with `bun run build:plugin` and re-run the plugin in Figma to see changes.

## Configuration

Environment variables:

| Variable                | Default      | Description                        |
| ----------------------- | ------------ | ---------------------------------- |
| `FIGMA_WS_PORT`         | `3846`       | WebSocket server port              |
| `FIGMA_WS_HOST`         | `localhost`  | WebSocket server host              |
| `FIGMA_REQUEST_TIMEOUT` | `30000`      | Request timeout (ms)               |
| `FIGMA_PILOT_MODE`      | `write-only` | Mode: `write-only` or `read-write` |

## Available Tools

### Connection

| Tool               | Description                           |
| ------------------ | ------------------------------------- |
| `pilot_connect`    | Connect to Figma plugin via WebSocket |
| `pilot_disconnect` | Disconnect from Figma plugin          |
| `pilot_status`     | Get WebSocket connection status       |

### Creation

| Tool                               | Description                           |
| ---------------------------------- | ------------------------------------- |
| `pilot_create_frame`               | Create a frame                        |
| `pilot_create_rectangle`           | Create a rectangle                    |
| `pilot_create_ellipse`             | Create an ellipse                     |
| `pilot_create_polygon`             | Create a polygon                      |
| `pilot_create_star`                | Create a star                         |
| `pilot_create_line`                | Create a line                         |
| `pilot_create_vector`              | Create a vector with path data        |
| `pilot_create_text`                | Create a text node                    |
| `pilot_create_component`           | Create an empty component             |
| `pilot_create_component_from_node` | Create a component from existing node |
| `pilot_create_instance`            | Create an instance of a component     |
| `pilot_create_page`                | Create a new page                     |
| `pilot_create_section`             | Create a section                      |
| `pilot_create_slice`               | Create a slice for export             |
| `pilot_create_from_svg`            | Create node from SVG string           |
| `pilot_create_image`               | Create image from base64              |
| `pilot_create_table`               | Create a table (FigJam)               |

### Modification

| Tool                           | Description                                  |
| ------------------------------ | -------------------------------------------- |
| `pilot_set_fill`               | Set fill color (supports batch)              |
| `pilot_set_stroke`             | Set stroke color (supports batch)            |
| `pilot_set_corner_radius`      | Set corner radius (supports batch)           |
| `pilot_set_individual_corners` | Set individual corner radii (supports batch) |
| `pilot_move_node`              | Move node to position                        |
| `pilot_resize_node`            | Resize a node (supports batch)               |
| `pilot_set_rotation`           | Set node rotation (supports batch)           |
| `pilot_set_opacity`            | Set node opacity (supports batch)            |
| `pilot_set_blend_mode`         | Set blend mode (supports batch)              |
| `pilot_set_visible`            | Set node visibility (supports batch)         |
| `pilot_set_locked`             | Set node locked state (supports batch)       |
| `pilot_set_name`               | Set node name                                |
| `pilot_add_drop_shadow`        | Add drop shadow effect (supports batch)      |
| `pilot_add_blur`               | Add blur effect (supports batch)             |
| `pilot_clear_effects`          | Clear all effects (supports batch)           |
| `pilot_set_auto_layout`        | Set auto layout on a frame (supports batch)  |
| `pilot_set_constraints`        | Set node constraints (supports batch)        |
| `pilot_delete_node`            | Delete a node (supports batch)               |
| `pilot_clone_node`             | Clone a node                                 |
| `pilot_group_nodes`            | Group multiple nodes                         |
| `pilot_ungroup_node`           | Ungroup a group node                         |
| `pilot_flatten_nodes`          | Flatten nodes into single vector             |
| `pilot_boolean_union`          | Union multiple nodes                         |
| `pilot_boolean_subtract`       | Subtract nodes (first minus rest)            |
| `pilot_boolean_intersect`      | Intersect multiple nodes                     |
| `pilot_boolean_exclude`        | Exclude overlapping areas                    |
| `pilot_set_current_page`       | Set current page                             |
| `pilot_set_viewport`           | Set viewport center and zoom                 |
| `pilot_scroll_to_node`         | Scroll viewport to show node                 |
| `pilot_set_selection`          | Set current selection                        |
| `pilot_notify`                 | Show notification in Figma                   |

### Layout

| Tool                           | Description                                      |
| ------------------------------ | ------------------------------------------------ |
| `pilot_set_layout_sizing`      | Set FILL/HUG/FIXED sizing mode (supports batch)  |
| `pilot_set_min_max_size`       | Set min/max width/height (supports batch)        |
| `pilot_set_layout_align`       | Set layout align and grow (supports batch)       |
| `pilot_set_layout_positioning` | Set AUTO/ABSOLUTE positioning (supports batch)   |
| `pilot_set_layout_wrap`        | Set wrap mode for auto-layout frame              |
| `pilot_set_clips_content`      | Set whether frame clips content (supports batch) |
| `pilot_set_overflow`           | Set overflow/scroll direction (supports batch)   |
| `pilot_set_guides`             | Set guides on frame or page                      |

### Node Hierarchy

| Tool                  | Description                     |
| --------------------- | ------------------------------- |
| `pilot_append_child`  | Append node as child of another |
| `pilot_insert_child`  | Insert node at specific index   |
| `pilot_reorder_child` | Reorder child within parent     |

### Instance Operations

| Tool                    | Description                          |
| ----------------------- | ------------------------------------ |
| `pilot_detach_instance` | Detach instance from component       |
| `pilot_reset_overrides` | Reset all overrides on instance      |
| `pilot_swap_component`  | Swap instance to different component |

### Styles

| Tool                        | Description                   |
| --------------------------- | ----------------------------- |
| `pilot_create_paint_style`  | Create a paint style          |
| `pilot_create_text_style`   | Create a text style           |
| `pilot_create_effect_style` | Create an effect style        |
| `pilot_create_grid_style`   | Create a grid style           |
| `pilot_apply_paint_style`   | Apply paint style to node     |
| `pilot_apply_text_style`    | Apply text style to text node |
| `pilot_apply_effect_style`  | Apply effect style to node    |
| `pilot_apply_grid_style`    | Apply grid style to frame     |

### Variables & Properties

| Tool                             | Description                          |
| -------------------------------- | ------------------------------------ |
| `pilot_set_bound_variable`       | Bind variable to node property       |
| `pilot_set_component_properties` | Set properties on component instance |

### Export & Prototype

| Tool                        | Description                          |
| --------------------------- | ------------------------------------ |
| `pilot_set_export_settings` | Set export settings on node          |
| `pilot_set_reactions`       | Set prototype reactions/interactions |

### Text

| Tool                        | Description                                |
| --------------------------- | ------------------------------------------ |
| `pilot_set_text_content`    | Set text content                           |
| `pilot_set_font_size`       | Set font size (supports batch)             |
| `pilot_set_font_name`       | Set font family and style (supports batch) |
| `pilot_set_font_weight`     | Set font weight (supports batch)           |
| `pilot_set_text_color`      | Set text color (supports batch)            |
| `pilot_set_line_height`     | Set line height (supports batch)           |
| `pilot_set_letter_spacing`  | Set letter spacing (supports batch)        |
| `pilot_set_text_align`      | Set text alignment (supports batch)        |
| `pilot_set_text_decoration` | Set text decoration (supports batch)       |
| `pilot_set_text_case`       | Set text case (supports batch)             |

### Reading (read-write mode only)

| Tool                             | Description                               |
| -------------------------------- | ----------------------------------------- |
| `pilot_get_node`                 | Get detailed node info by ID              |
| `pilot_get_selection`            | Get current selection                     |
| `pilot_find_nodes`               | Find nodes by type or name pattern        |
| `pilot_get_children`             | Get children of a node                    |
| `pilot_get_top_frame`            | Get the top-level frame containing a node |
| `pilot_get_current_page`         | Get current page info                     |
| `pilot_get_pages`                | Get all pages in document                 |
| `pilot_get_local_styles`         | Get local styles                          |
| `pilot_get_local_components`     | Get local components                      |
| `pilot_get_local_variables`      | Get local variables                       |
| `pilot_get_variable_collections` | Get variable collections                  |
| `pilot_get_viewport`             | Get current viewport                      |
| `pilot_export_node`              | Export node as PNG/JPG/SVG/PDF            |
| `pilot_get_component_properties` | Get component/instance properties         |
| `pilot_get_export_settings`      | Get export settings of a node             |
| `pilot_get_reactions`            | Get prototype reactions of a node         |

### Batch

| Tool          | Description                           |
| ------------- | ------------------------------------- |
| `pilot_batch` | Execute multiple commands in sequence |

## Using Batch Operations

The `pilot_batch` tool allows executing multiple commands in sequence, with the ability to reference previous results:

```json
{
  "commands": [
    { "command": "create_frame", "params": { "name": "Container", "width": 200, "height": 200 } },
    { "command": "create_rectangle", "params": { "parentId": "$0.id", "width": 100, "height": 100 } },
    { "command": "set_fill_color", "params": { "nodeId": "$1.id", "r": 1, "g": 0, "b": 0 } }
  ]
}
```

Use `$N` to reference the result of the Nth command (0-indexed), and `$N.property` to access nested properties.

## MCP Prompts

Figma Pilot includes built-in prompts to help you get started:

| Prompt               | Description                                 |
| -------------------- | ------------------------------------------- |
| `quick_start`        | Get started with Figma Pilot MCP            |
| `design_system`      | Create a basic design system structure      |
| `auto_layout`        | Master Auto Layout in Figma                 |
| `component_workflow` | Best practices for working with components  |
| `batch_operations`   | Efficient batch operations for bulk changes |
| `prototyping`        | Add prototype interactions and flows        |

## Error Handling

Errors are returned with structured error codes for easier debugging:

```json
{
  "error": true,
  "code": 2001,
  "message": "Node not found."
}
```

| Code Range | Category          |
| ---------- | ----------------- |
| 1xxx       | Connection errors |
| 2xxx       | Node errors       |
| 3xxx       | Command errors    |
| 4xxx       | Permission errors |
| 5xxx       | Resource errors   |
| 6xxx       | Plugin errors     |

## Development

```bash
bun run dev          # Start server with watch mode
bun run start        # Start server
bun run build        # Build server for production
bun run build:plugin # Build Figma plugin
bun run typecheck    # Type check server code
bun run typecheck:plugin  # Type check plugin code
bun run lint         # Run ESLint
bun run lint:fix     # Fix lint errors
```

## Project Structure

```text
src/
├── server.ts        # MCP server entry point
├── config/          # Configuration
├── prompts/         # MCP prompt templates
│   └── index.ts
├── tools/           # MCP tool definitions
│   ├── connection-tools.ts
│   ├── creation-tools.ts
│   ├── modification-tools.ts
│   ├── text-tools.ts
│   ├── reading-tools.ts
│   ├── batch-tools.ts
│   └── registry.ts
├── plugin/          # Figma plugin
│   ├── code.ts      # Plugin main code
│   ├── ui.html      # Plugin UI
│   └── manifest.json
├── types/           # TypeScript types
└── utils/           # Utilities
    ├── websocket.ts # WebSocket client
    ├── color.ts     # Color parsing
    ├── errors.ts    # Error handling
    └── logger.ts    # Logging
```

## License

MIT
