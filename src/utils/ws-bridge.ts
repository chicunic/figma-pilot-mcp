import type { FigmaResponse } from '../types/index.ts';

// ==================== Bridge Interface ====================
// This module provides a switchable backend for WebSocket communication.
// In "all" mode (default), it uses the built-in WS server.
// In "mcp" mode, it uses a WS client connecting to an external server.

type SendCommandFn = (command: string, params: Record<string, unknown>) => Promise<FigmaResponse>;
type ConnectFn = (channel: string) => void;
type DisconnectFn = () => void;
type IsConnectedFn = () => boolean;
type GetChannelFn = () => string | null;
type GetUrlFn = () => string;

let _sendCommand: SendCommandFn;
let _connectToFigma: ConnectFn;
let _disconnect: DisconnectFn;
let _isConnected: IsConnectedFn;
let _getChannel: GetChannelFn;
let _getWebSocketUrl: GetUrlFn;

export function setBridge(bridge: {
  sendCommand: SendCommandFn;
  connectToFigma: ConnectFn;
  disconnect: DisconnectFn;
  isConnected: IsConnectedFn;
  getChannel: GetChannelFn;
  getWebSocketUrl: GetUrlFn;
}): void {
  _sendCommand = bridge.sendCommand;
  _connectToFigma = bridge.connectToFigma;
  _disconnect = bridge.disconnect;
  _isConnected = bridge.isConnected;
  _getChannel = bridge.getChannel;
  _getWebSocketUrl = bridge.getWebSocketUrl;
}

export function sendCommand(command: string, params: Record<string, unknown> = {}): Promise<FigmaResponse> {
  return _sendCommand(command, params);
}

export function connectToFigma(channel: string): void {
  _connectToFigma(channel);
}

export function disconnect(): void {
  _disconnect();
}

export function isConnected(): boolean {
  return _isConnected();
}

export function getChannel(): string | null {
  return _getChannel();
}

export function getWebSocketUrl(): string {
  return _getWebSocketUrl();
}
