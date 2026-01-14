// Figma command request
export interface FigmaCommand {
  id: string;
  command: string;
  params: Record<string, unknown>;
}

// Figma response
export interface FigmaResponse {
  id: string;
  success: boolean;
  result?: unknown;
  error?: string;
}

// WebSocket message type
export type WebSocketMessage =
  | { type: 'join'; channel: string }
  | { type: 'leave'; channel: string }
  | { type: 'message'; channel: string; message: FigmaCommand }
  | { type: 'broadcast'; channel: string; message: FigmaResponse };

// Pending request
export interface PendingRequest {
  resolve: (value: FigmaResponse) => void;
  reject: (reason: Error) => void;
  timeout: Timer;
}

// Tool mode
export type ToolMode = 'read-write' | 'write-only';

// Server configuration
export interface ServerConfig {
  socketPort: number;
  socketHost: string;
  requestTimeout: number;
  mode: ToolMode;
}
