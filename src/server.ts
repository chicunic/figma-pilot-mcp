#!/usr/bin/env bun
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SERVER_NAME, SERVER_VERSION } from "./config/index.ts";
import { registerTools } from "./tools/index.ts";
import { registerPrompts } from "./prompts/index.ts";
import { startWebSocketServer } from "./utils/websocket.ts";
import { logger } from "./utils/logger.ts";

async function main() {
  logger.info(`Starting ${SERVER_NAME} v${SERVER_VERSION}`);

  // Start built-in WebSocket server
  startWebSocketServer();

  // Create MCP server
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  // Register all tools
  registerTools(server);

  // Register all prompts
  registerPrompts(server);

  // Use stdio transport
  const transport = new StdioServerTransport();

  // Connect server
  await server.connect(transport);

  logger.info("MCP server started successfully");
}

main().catch((error) => {
  logger.error("Failed to start server", error);
  process.exit(1);
});
