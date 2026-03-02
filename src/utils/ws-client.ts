import { config } from '../config/index.ts';
import type { FigmaCommand, FigmaResponse, PendingRequest } from '../types/index.ts';
import { logger } from './logger.ts';

// ==================== State ====================

let ws: WebSocket | null = null;
let mcpChannel: string | null = null;
const pendingRequests = new Map<string, PendingRequest>();
let reconnectTimer: Timer | null = null;

// ==================== Connection ====================

function getWsUrl(): string {
  return `ws://${config.socketHost}:${config.socketPort}`;
}

function handleMessage(event: MessageEvent): void {
  try {
    const data = JSON.parse(event.data as string);

    if (data.type === 'broadcast' && data.channel === mcpChannel && data.message) {
      const response = data.message as FigmaResponse;
      const pending = pendingRequests.get(response.id);
      if (pending) {
        clearTimeout(pending.timeout);
        pendingRequests.delete(response.id);
        pending.resolve(response);
      }
    } else if (data.type === 'ping') {
      ws?.send(JSON.stringify({ type: 'pong' }));
    }
  } catch (err) {
    logger.error('Failed to parse WS message', err);
  }
}

export function connectWsClient(): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = getWsUrl();
    logger.info(`Connecting to external WebSocket server at ${url}`);

    ws = new WebSocket(url);

    ws.onopen = () => {
      logger.info('Connected to external WebSocket server');
      resolve();
    };

    ws.onmessage = handleMessage;

    ws.onclose = () => {
      logger.warn('WebSocket connection closed');
      ws = null;
      // Auto-reconnect after 3s
      if (!reconnectTimer) {
        reconnectTimer = setTimeout(() => {
          reconnectTimer = null;
          connectWsClient().catch((err) => logger.error('Reconnect failed', err));
        }, 3000);
      }
    };

    ws.onerror = (err) => {
      logger.error('WebSocket connection error', err);
      reject(new Error(`Failed to connect to WebSocket server at ${url}`));
    };
  });
}

export function stopWsClient(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (ws) {
    ws.onclose = null; // prevent reconnect
    ws.close();
    ws = null;
  }
}

// ==================== MCP Client Functions ====================

export function getWebSocketUrl(): string {
  return getWsUrl();
}

export function isConnected(): boolean {
  if (!mcpChannel || !ws || ws.readyState !== WebSocket.OPEN) return false;
  return true;
}

export function getChannel(): string | null {
  return mcpChannel;
}

export function connectToFigma(channel: string): void {
  mcpChannel = channel;

  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'join', channel }));
  }

  logger.info('MCP connected to channel (client mode)', { channel });
}

export function disconnect(): void {
  if (mcpChannel && ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'leave', channel: mcpChannel }));
  }
  mcpChannel = null;
  logger.info('MCP disconnected from channel');
}

export function sendCommand(command: string, params: Record<string, unknown> = {}): Promise<FigmaResponse> {
  if (!mcpChannel) {
    throw new Error('Not connected to Figma. Use pilot_connect first.');
  }

  if (!ws || ws.readyState !== WebSocket.OPEN) {
    throw new Error('WebSocket not connected to server.');
  }

  const id = crypto.randomUUID();
  const figmaCommand: FigmaCommand = { id, command, params };

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingRequests.delete(id);
      reject(new Error(`Command timeout: ${command}`));
    }, config.requestTimeout);

    pendingRequests.set(id, { resolve, reject, timeout });

    ws!.send(
      JSON.stringify({
        type: 'message',
        channel: mcpChannel,
        message: figmaCommand,
      }),
    );

    logger.debug('Sent command (client mode)', { command, id });
  });
}
