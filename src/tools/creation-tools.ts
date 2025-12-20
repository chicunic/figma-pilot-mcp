import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { type ToolDef, registerToolsFromDefs } from "./registry.ts";

const tools: ToolDef[] = [
  // ==================== Basic Shapes ====================
  {
    name: "pilot_create_frame",
    description: "Create a frame. [WRITE]",
    schema: z.object({
      name: z.string().optional().describe("Frame name"),
      x: z.number().default(0).describe("X position"),
      y: z.number().default(0).describe("Y position"),
      width: z.number().default(100).describe("Width"),
      height: z.number().default(100).describe("Height"),
      parentId: z.string().optional().describe("Parent node ID"),
    }),
    command: "create_frame",
    type: "write",
  },
  {
    name: "pilot_create_rectangle",
    description: "Create a rectangle. [WRITE]",
    schema: z.object({
      name: z.string().optional().describe("Rectangle name"),
      x: z.number().default(0).describe("X position"),
      y: z.number().default(0).describe("Y position"),
      width: z.number().default(100).describe("Width"),
      height: z.number().default(100).describe("Height"),
      parentId: z.string().optional().describe("Parent node ID"),
    }),
    command: "create_rectangle",
    type: "write",
  },
  {
    name: "pilot_create_ellipse",
    description: "Create an ellipse. [WRITE]",
    schema: z.object({
      name: z.string().optional().describe("Ellipse name"),
      x: z.number().default(0).describe("X position"),
      y: z.number().default(0).describe("Y position"),
      width: z.number().default(100).describe("Width"),
      height: z.number().default(100).describe("Height"),
      parentId: z.string().optional().describe("Parent node ID"),
    }),
    command: "create_ellipse",
    type: "write",
  },
  {
    name: "pilot_create_polygon",
    description: "Create a polygon. [WRITE]",
    schema: z.object({
      name: z.string().optional().describe("Polygon name"),
      x: z.number().default(0).describe("X position"),
      y: z.number().default(0).describe("Y position"),
      width: z.number().default(100).describe("Width"),
      height: z.number().default(100).describe("Height"),
      pointCount: z.number().default(3).describe("Number of sides"),
      parentId: z.string().optional().describe("Parent node ID"),
    }),
    command: "create_polygon",
    type: "write",
  },
  {
    name: "pilot_create_star",
    description: "Create a star. [WRITE]",
    schema: z.object({
      name: z.string().optional().describe("Star name"),
      x: z.number().default(0).describe("X position"),
      y: z.number().default(0).describe("Y position"),
      width: z.number().default(100).describe("Width"),
      height: z.number().default(100).describe("Height"),
      pointCount: z.number().default(5).describe("Number of points"),
      innerRadius: z.number().default(0.4).describe("Inner radius ratio (0-1)"),
      parentId: z.string().optional().describe("Parent node ID"),
    }),
    command: "create_star",
    type: "write",
  },
  {
    name: "pilot_create_line",
    description: "Create a line. [WRITE]",
    schema: z.object({
      name: z.string().optional().describe("Line name"),
      x: z.number().default(0).describe("X position"),
      y: z.number().default(0).describe("Y position"),
      length: z.number().default(100).describe("Line length"),
      rotation: z.number().default(0).describe("Rotation angle"),
      parentId: z.string().optional().describe("Parent node ID"),
    }),
    command: "create_line",
    type: "write",
  },
  {
    name: "pilot_create_vector",
    description: "Create a vector with path data. [WRITE]",
    schema: z.object({
      name: z.string().optional().describe("Vector name"),
      x: z.number().default(0).describe("X position"),
      y: z.number().default(0).describe("Y position"),
      vectorPaths: z.array(z.object({
        windingRule: z.enum(["EVENODD", "NONZERO"]),
        data: z.string(),
      })).optional().describe("Vector path data"),
      parentId: z.string().optional().describe("Parent node ID"),
    }),
    command: "create_vector",
    type: "write",
  },

  // ==================== Text ====================
  {
    name: "pilot_create_text",
    description: "Create a text node. [WRITE]",
    schema: z.object({
      characters: z.string().default("").describe("Text content"),
      x: z.number().default(0).describe("X position"),
      y: z.number().default(0).describe("Y position"),
      fontSize: z.number().optional().describe("Font size"),
      fontFamily: z.string().default("Inter").describe("Font family"),
      fontStyle: z.string().default("Regular").describe("Font style"),
      parentId: z.string().optional().describe("Parent node ID"),
    }),
    command: "create_text",
    type: "write",
  },

  // ==================== Components ====================
  {
    name: "pilot_create_component",
    description: "Create an empty component. [WRITE]",
    schema: z.object({
      name: z.string().optional().describe("Component name"),
      x: z.number().default(0).describe("X position"),
      y: z.number().default(0).describe("Y position"),
      width: z.number().default(100).describe("Width"),
      height: z.number().default(100).describe("Height"),
      parentId: z.string().optional().describe("Parent node ID"),
    }),
    command: "create_component",
    type: "write",
  },
  {
    name: "pilot_create_component_from_node",
    description: "Create a component from existing node. [WRITE]",
    schema: z.object({
      nodeId: z.string().describe("Node ID to convert"),
    }),
    command: "create_component_from_node",
    type: "write",
  },
  {
    name: "pilot_create_instance",
    description: "Create an instance of a component. [WRITE]",
    schema: z.object({
      componentKey: z.string().describe("Component key"),
      x: z.number().default(0).describe("X position"),
      y: z.number().default(0).describe("Y position"),
      parentId: z.string().optional().describe("Parent node ID"),
    }),
    command: "create_component_instance",
    type: "write",
  },

  // ==================== Pages and Structure ====================
  {
    name: "pilot_create_page",
    description: "Create a new page. [WRITE]",
    schema: z.object({
      name: z.string().optional().describe("Page name"),
    }),
    command: "create_page",
    type: "write",
  },
  {
    name: "pilot_create_section",
    description: "Create a section. [WRITE]",
    schema: z.object({
      name: z.string().optional().describe("Section name"),
      x: z.number().default(0).describe("X position"),
      y: z.number().default(0).describe("Y position"),
      width: z.number().default(400).describe("Width"),
      height: z.number().default(400).describe("Height"),
    }),
    command: "create_section",
    type: "write",
  },
  {
    name: "pilot_create_slice",
    description: "Create a slice for export. [WRITE]",
    schema: z.object({
      name: z.string().optional().describe("Slice name"),
      x: z.number().default(0).describe("X position"),
      y: z.number().default(0).describe("Y position"),
      width: z.number().default(100).describe("Width"),
      height: z.number().default(100).describe("Height"),
      parentId: z.string().optional().describe("Parent node ID"),
    }),
    command: "create_slice",
    type: "write",
  },

  // ==================== Advanced Creation ====================
  {
    name: "pilot_create_from_svg",
    description: "Create node from SVG string. [WRITE]",
    schema: z.object({
      svg: z.string().describe("SVG string"),
      name: z.string().optional().describe("Node name"),
      x: z.number().default(0).describe("X position"),
      y: z.number().default(0).describe("Y position"),
      parentId: z.string().optional().describe("Parent node ID"),
    }),
    command: "create_from_svg",
    type: "write",
  },
  {
    name: "pilot_create_image",
    description: "Create image from base64. [WRITE]",
    schema: z.object({
      base64: z.string().describe("Base64 encoded image data"),
      name: z.string().optional().describe("Image name"),
      x: z.number().default(0).describe("X position"),
      y: z.number().default(0).describe("Y position"),
      width: z.number().default(100).describe("Width"),
      height: z.number().default(100).describe("Height"),
      scaleMode: z.enum(["FILL", "FIT", "CROP", "TILE"]).default("FILL").describe("Scale mode"),
      parentId: z.string().optional().describe("Parent node ID"),
    }),
    command: "create_image",
    type: "write",
  },

  // ==================== Table ====================
  {
    name: "pilot_create_table",
    description: "Create a table (FigJam). [WRITE]",
    schema: z.object({
      numRows: z.number().min(1).describe("Number of rows"),
      numColumns: z.number().min(1).describe("Number of columns"),
      name: z.string().optional().describe("Table name"),
      x: z.number().optional().describe("X position"),
      y: z.number().optional().describe("Y position"),
      parentId: z.string().optional().describe("Parent node ID"),
    }),
    command: "create_table",
    type: "write",
  },
];

export function registerCreationTools(server: McpServer): void {
  registerToolsFromDefs(server, tools);
}
