// ==================== Tool Configuration ====================

export type ToolMode = 'read-write' | 'write-only';

export interface ServerConfig {
  socketPort: number;
  socketHost: string;
  requestTimeout: number;
  mode: ToolMode;
}

// ==================== Figma Communication ====================

export interface FigmaCommand {
  id: string;
  command: string;
  params: Record<string, unknown>;
}

export interface FigmaResponse {
  id: string;
  success: boolean;
  result?: unknown;
  error?: string;
}

// ==================== WebSocket ====================

export type WebSocketMessage =
  | { type: 'join'; channel: string }
  | { type: 'leave'; channel: string }
  | { type: 'message'; channel: string; message: FigmaCommand }
  | { type: 'broadcast'; channel: string; message: FigmaResponse };

export interface PendingRequest {
  resolve: (value: FigmaResponse) => void;
  reject: (reason: Error) => void;
  timeout: Timer;
}
