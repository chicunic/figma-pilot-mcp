import { config } from '../config/index.ts';
import type { FigmaCommand, FigmaResponse, PendingRequest } from '../types/index.ts';
import { logger } from './logger.ts';

// WebSocket server state
type ServerWebSocket = {
  send(data: string): void;
  close(): void;
  readyState: number;
  data: unknown;
};

interface Client {
  ws: ServerWebSocket;
  channels: Set<string>;
  lastPing: number;
}

const clients = new Map<ServerWebSocket, Client>();
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const HEARTBEAT_TIMEOUT = 10000; // 10 seconds to respond
const channels = new Map<string, Set<ServerWebSocket>>();
const pendingRequests = new Map<string, PendingRequest>();

// MCP connection channel (auto-managed)
let mcpChannel: string | null = null;

// ========== WebSocket Server ==========

function joinChannel(ws: ServerWebSocket, channel: string) {
  const client = clients.get(ws);
  if (!client) return;

  client.channels.add(channel);

  if (!channels.has(channel)) {
    channels.set(channel, new Set());
  }
  channels.get(channel)!.add(ws);

  logger.info('Client joined channel', { channel });
}

function leaveChannel(ws: ServerWebSocket, channel: string) {
  const client = clients.get(ws);
  if (!client) return;

  client.channels.delete(channel);
  channels.get(channel)?.delete(ws);

  if (channels.get(channel)?.size === 0) {
    channels.delete(channel);
  }

  logger.info('Client left channel', { channel });
}

function handleMessage(ws: ServerWebSocket, message: string | Buffer) {
  try {
    const data = JSON.parse(message.toString());

    switch (data.type) {
      case 'join':
        joinChannel(ws, data.channel);
        break;

      case 'leave':
        leaveChannel(ws, data.channel);
        break;

      case 'message': {
        // Broadcast message to channel
        const channelClients = channels.get(data.channel);
        if (channelClients) {
          const broadcastData = JSON.stringify({
            type: 'broadcast',
            channel: data.channel,
            message: data.message,
          });
          for (const client of channelClients) {
            if (client.readyState === WebSocket.OPEN) {
              client.send(broadcastData);
            }
          }
        }
        break;
      }

      case 'broadcast': {
        // Handle response from Figma plugin
        if (data.channel === mcpChannel && data.message) {
          const response = data.message as FigmaResponse;
          const pending = pendingRequests.get(response.id);
          if (pending) {
            clearTimeout(pending.timeout);
            pendingRequests.delete(response.id);
            pending.resolve(response);
          }
        }
        break;
      }

      case 'ping': {
        // Reply pong
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
      }

      case 'pong': {
        // Update last heartbeat time
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

function startHeartbeat() {
  setInterval(() => {
    const now = Date.now();
    for (const [ws, client] of clients) {
      // Check if timeout
      if (now - client.lastPing > HEARTBEAT_INTERVAL + HEARTBEAT_TIMEOUT) {
        logger.warn('Client heartbeat timeout, closing connection');
        ws.close();
        continue;
      }
      // Send ping
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    }
  }, HEARTBEAT_INTERVAL);
}

export function startWebSocketServer() {
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

    // Start heartbeat detection
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

// ========== MCP Client Functions ==========

export function getWebSocketUrl(): string {
  return `ws://${config.socketHost}:${config.socketPort}`;
}

export function isConnected(): boolean {
  return mcpChannel !== null && channels.has(mcpChannel) && channels.get(mcpChannel)!.size > 0;
}

export function getChannel(): string | null {
  return mcpChannel;
}

export async function connectToFigma(channel: string): Promise<void> {
  mcpChannel = channel;

  // Check if Figma plugin is already connected to this channel
  if (!channels.has(channel) || channels.get(channel)!.size === 0) {
    logger.warn('No Figma plugin connected to channel yet', { channel });
  }

  logger.info('MCP connected to channel', { channel });
}

export function disconnect(): void {
  mcpChannel = null;
  logger.info('MCP disconnected from channel');
}

export async function sendCommand(command: string, params: Record<string, unknown> = {}): Promise<FigmaResponse> {
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

    // 发送给频道内所有客户端
    const message = JSON.stringify({
      type: 'broadcast',
      channel: mcpChannel,
      message: figmaCommand,
    });

    for (const client of channelClients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }

    logger.debug('Sent command', { command, id });
  });
}
