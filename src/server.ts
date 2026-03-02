#!/usr/bin/env bun
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SERVER_NAME, SERVER_VERSION } from './config/index.ts';
import { registerPrompts } from './prompts/index.ts';
import { registerTools } from './tools/index.ts';
import { logger } from './utils/logger.ts';
import { setBridge } from './utils/ws-bridge.ts';

// ==================== Run Mode ====================

type RunMode = 'all' | 'mcp' | 'ws';

function parseRunMode(): RunMode {
  // Check CLI args: --mode=all|mcp|ws
  const modeArg = process.argv.find((a) => a.startsWith('--mode='));
  if (modeArg) {
    const value = modeArg.split('=')[1] as string;
    if (value === 'all' || value === 'mcp' || value === 'ws') return value;
    logger.error(`Invalid mode: ${value}. Use all|mcp|ws`);
    process.exit(1);
  }
  // Check env var
  const envMode = process.env.FIGMA_RUN_MODE;
  if (envMode) {
    if (envMode === 'all' || envMode === 'mcp' || envMode === 'ws') return envMode;
    logger.error(`Invalid FIGMA_RUN_MODE: ${envMode}. Use all|mcp|ws`);
    process.exit(1);
  }
  return 'all';
}

// ==================== Shutdown ====================

function setupShutdownHandlers(cleanup: () => void): void {
  let isShuttingDown = false;

  function shutdown(reason: string, exitCode = 0): void {
    if (isShuttingDown) return;
    isShuttingDown = true;
    logger.info(`Shutting down (${reason})...`);
    cleanup();
    process.exit(exitCode);
  }

  for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP'] as const) {
    process.on(signal, () => shutdown(signal));
  }

  process.stdin.on('close', () => shutdown('stdin close'));
  process.stdin.on('end', () => shutdown('stdin end'));

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', error);
    shutdown('uncaughtException', 1);
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', reason);
    shutdown('unhandledRejection', 1);
  });
}

// ==================== Mode: WS Only ====================

async function startWsOnly(): Promise<void> {
  const { startWebSocketServer } = await import('./utils/websocket.ts');
  const wsServer = startWebSocketServer();

  setupShutdownHandlers(() => wsServer.stop());
  logger.info('Running in WS-only mode. Waiting for connections...');

  // Keep process alive
  await new Promise(() => {});
}

// ==================== Mode: MCP Only ====================

async function startMcpOnly(): Promise<void> {
  const wsClient = await import('./utils/ws-client.ts');

  // Wire bridge to use WS client
  setBridge({
    sendCommand: wsClient.sendCommand,
    connectToFigma: wsClient.connectToFigma,
    disconnect: wsClient.disconnect,
    isConnected: wsClient.isConnected,
    getChannel: wsClient.getChannel,
    getWebSocketUrl: wsClient.getWebSocketUrl,
  });

  // Connect to external WS server
  await wsClient.connectWsClient();

  const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION });
  registerTools(server);
  registerPrompts(server);

  setupShutdownHandlers(() => wsClient.stopWsClient());

  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info('MCP server started (client mode, connected to external WS)');
}

// ==================== Mode: All (default) ====================

async function startAll(): Promise<void> {
  const wsModule = await import('./utils/websocket.ts');
  const wsServer = wsModule.startWebSocketServer();

  // Wire bridge to use built-in WS server
  setBridge({
    sendCommand: wsModule.sendCommand,
    connectToFigma: wsModule.connectToFigma,
    disconnect: wsModule.disconnect,
    isConnected: wsModule.isConnected,
    getChannel: wsModule.getChannel,
    getWebSocketUrl: wsModule.getWebSocketUrl,
  });

  const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION });
  registerTools(server);
  registerPrompts(server);

  setupShutdownHandlers(() => wsServer.stop());

  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info('MCP server started (all-in-one mode)');
}

// ==================== Main ====================

async function main(): Promise<void> {
  const mode = parseRunMode();
  logger.info(`Starting ${SERVER_NAME} v${SERVER_VERSION} (mode: ${mode})`);

  switch (mode) {
    case 'ws':
      await startWsOnly();
      break;
    case 'mcp':
      await startMcpOnly();
      break;
    case 'all':
      await startAll();
      break;
  }
}

main().catch((error) => {
  logger.error('Failed to start server', error);
  process.exit(1);
});
