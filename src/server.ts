#!/usr/bin/env bun
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SERVER_NAME, SERVER_VERSION } from './config/index.ts';
import { registerPrompts } from './prompts/index.ts';
import { registerTools } from './tools/index.ts';
import { logger } from './utils/logger.ts';
import { startWebSocketServer } from './utils/websocket.ts';

interface WebSocketServer {
  stop(): void;
}

function setupShutdownHandlers(wsServer: WebSocketServer): void {
  let isShuttingDown = false;

  function cleanup(reason: string, exitCode = 0): void {
    if (isShuttingDown) return;
    isShuttingDown = true;
    logger.info(`Shutting down (${reason})...`);
    wsServer.stop();
    process.exit(exitCode);
  }

  const signals = ['SIGINT', 'SIGTERM', 'SIGHUP'] as const;
  for (const signal of signals) {
    process.on(signal, () => cleanup(signal));
  }

  process.stdin.on('close', () => cleanup('stdin close'));
  process.stdin.on('end', () => cleanup('stdin end'));

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', error);
    cleanup('uncaughtException', 1);
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', reason);
    cleanup('unhandledRejection', 1);
  });
}

async function main(): Promise<void> {
  logger.info(`Starting ${SERVER_NAME} v${SERVER_VERSION}`);

  const wsServer = startWebSocketServer();

  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  registerTools(server);
  registerPrompts(server);

  setupShutdownHandlers(wsServer);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info('MCP server started successfully');
}

main().catch((error) => {
  logger.error('Failed to start server', error);
  process.exit(1);
});
