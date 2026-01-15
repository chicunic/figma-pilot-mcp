import { config } from '../config/index.ts';
import type { FigmaCommand, FigmaResponse, PendingRequest } from '../types/index.ts';
import { logger } from './logger.ts';

// ==================== Types ====================

interface ServerWebSocket {
  send(data: string): void;
  close(): void;
  readyState: number;
  data: unknown;
}

interface Client {
  ws: ServerWebSocket;
  channels: Set<string>;
  lastPing: number;
}

// ==================== Constants ====================

const HEARTBEAT_INTERVAL = 30000;
const HEARTBEAT_TIMEOUT = 10000;

// ==================== State ====================

const clients = new Map<ServerWebSocket, Client>();
const channels = new Map<string, Set<ServerWebSocket>>();
const pendingRequests = new Map<string, PendingRequest>();
let mcpChannel: string | null = null;

// ==================== Channel Management ====================

function joinChannel(ws: ServerWebSocket, channel: string): void {
  const client = clients.get(ws);
  if (!client) return;

  client.channels.add(channel);

  const channelClients = channels.get(channel) ?? new Set<ServerWebSocket>();
  channelClients.add(ws);
  channels.set(channel, channelClients);

  logger.info('Client joined channel', { channel });
}

function leaveChannel(ws: ServerWebSocket, channel: string): void {
  const client = clients.get(ws);
  if (!client) return;

  client.channels.delete(channel);
  channels.get(channel)?.delete(ws);

  if (channels.get(channel)?.size === 0) {
    channels.delete(channel);
  }

  logger.info('Client left channel', { channel });
}

// ==================== Message Handling ====================

function broadcastToChannel(channel: string, data: unknown): void {
  const channelClients = channels.get(channel);
  if (!channelClients) return;

  const message = JSON.stringify(data);
  for (const client of channelClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

function handleBroadcastResponse(channel: string, message: unknown): void {
  if (channel !== mcpChannel || !message) return;

  const response = message as FigmaResponse;
  const pending = pendingRequests.get(response.id);
  if (pending) {
    clearTimeout(pending.timeout);
    pendingRequests.delete(response.id);
    pending.resolve(response);
  }
}

function handleMessage(ws: ServerWebSocket, message: string | Buffer): void {
  try {
    const data = JSON.parse(message.toString());

    switch (data.type) {
      case 'join':
        joinChannel(ws, data.channel);
        break;

      case 'leave':
        leaveChannel(ws, data.channel);
        break;

      case 'message':
        broadcastToChannel(data.channel, {
          type: 'broadcast',
          channel: data.channel,
          message: data.message,
        });
        break;

      case 'broadcast':
        handleBroadcastResponse(data.channel, data.message);
        break;

      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;

      case 'pong': {
        const client = clients.get(ws);
        if (client) {
          client.lastPing = Date.now();
        }
        break;
      }

      default:
        logger.warn('Unknown message type', { type: data.type });
    }
  } catch (err) {
    logger.error('Failed to parse message', err);
  }
}

// ==================== Heartbeat ====================

function startHeartbeat(): void {
  setInterval(() => {
    const now = Date.now();
    for (const [ws, client] of clients) {
      if (now - client.lastPing > HEARTBEAT_INTERVAL + HEARTBEAT_TIMEOUT) {
        logger.warn('Client heartbeat timeout, closing connection');
        ws.close();
        continue;
      }
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    }
  }, HEARTBEAT_INTERVAL);
}

// ==================== WebSocket Server ====================

interface WebSocketServer {
  stop(): void;
  port: number | undefined;
}

export function startWebSocketServer(): WebSocketServer {
  try {
    const server = Bun.serve({
      port: config.socketPort,
      fetch(req, server) {
        if (server.upgrade(req, { data: {} })) {
          return;
        }
        return new Response('Figma Pilot WebSocket Server', { status: 200 });
      },
      websocket: {
        open(ws: ServerWebSocket) {
          clients.set(ws, { ws, channels: new Set(), lastPing: Date.now() });
          logger.info('Client connected', { total: clients.size });
        },
        message: handleMessage,
        close(ws: ServerWebSocket) {
          const client = clients.get(ws);
          if (client) {
            for (const channel of client.channels) {
              leaveChannel(ws, channel);
            }
            clients.delete(ws);
          }
          logger.info('Client disconnected', { total: clients.size });
        },
      },
    });

    startHeartbeat();
    logger.info(`WebSocket server running on ws://localhost:${server.port}`);

    return server;
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code === 'EADDRINUSE') {
      throw new Error(
        `Port ${config.socketPort} is already in use. Please stop the other process or change FIGMA_WS_PORT.`,
      );
    }
    throw error;
  }
}

// ==================== MCP Client Functions ====================

export function getWebSocketUrl(): string {
  return `ws://${config.socketHost}:${config.socketPort}`;
}

export function isConnected(): boolean {
  if (!mcpChannel) return false;
  const channelClients = channels.get(mcpChannel);
  return channelClients ? channelClients.size > 0 : false;
}

export function getChannel(): string | null {
  return mcpChannel;
}

export function connectToFigma(channel: string): void {
  mcpChannel = channel;

  const channelClients = channels.get(channel);
  if (!channelClients || channelClients.size === 0) {
    logger.warn('No Figma plugin connected to channel yet', { channel });
  }

  logger.info('MCP connected to channel', { channel });
}

export function disconnect(): void {
  mcpChannel = null;
  logger.info('MCP disconnected from channel');
}

export function sendCommand(command: string, params: Record<string, unknown> = {}): Promise<FigmaResponse> {
  if (!mcpChannel) {
    throw new Error('Not connected to Figma. Use pilot_connect first.');
  }

  const channelClients = channels.get(mcpChannel);
  if (!channelClients || channelClients.size === 0) {
    throw new Error('No Figma plugin connected to this channel.');
  }

  const id = crypto.randomUUID();
  const figmaCommand: FigmaCommand = { id, command, params };

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingRequests.delete(id);
      reject(new Error(`Command timeout: ${command}`));
    }, config.requestTimeout);

    pendingRequests.set(id, { resolve, reject, timeout });

    broadcastToChannel(mcpChannel!, {
      type: 'broadcast',
      channel: mcpChannel,
      message: figmaCommand,
    });

    logger.debug('Sent command', { command, id });
  });
}
