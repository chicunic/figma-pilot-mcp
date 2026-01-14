#!/usr/bin/env bun
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SERVER_NAME, SERVER_VERSION } from './config/index.ts';
import { registerPrompts } from './prompts/index.ts';
import { registerTools } from './tools/index.ts';
import { logger } from './utils/logger.ts';
import { startWebSocketServer } from './utils/websocket.ts';

async function main() {
  logger.info(`Starting ${SERVER_NAME} v${SERVER_VERSION}`);

  // Start built-in WebSocket server
  const wsServer = startWebSocketServer();

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

  // Graceful shutdown
  let isShuttingDown = false;
  const cleanup = (reason: string, exitCode = 0) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    logger.info(`Shutting down (${reason})...`);
    wsServer.stop();
    process.exit(exitCode);
  };

  // Handle process exit signals
  process.on('SIGINT', () => cleanup('SIGINT'));
  process.on('SIGTERM', () => cleanup('SIGTERM'));
  process.on('SIGHUP', () => cleanup('SIGHUP'));

  // Handle stdin close (when parent process exits)
  process.stdin.on('close', () => cleanup('stdin close'));
  process.stdin.on('end', () => cleanup('stdin end'));

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', error);
    cleanup('uncaughtException', 1);
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', reason);
    cleanup('unhandledRejection', 1);
  });

  // Connect server
  await server.connect(transport);

  logger.info('MCP server started successfully');
}

main().catch((error) => {
  logger.error('Failed to start server', error);
  process.exit(1);
});
