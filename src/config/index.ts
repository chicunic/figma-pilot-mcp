import type { ServerConfig, ToolMode } from '../types/index.ts';

export const config: ServerConfig = {
  socketPort: parseInt(process.env.FIGMA_WS_PORT || '3846', 10),
  socketHost: process.env.FIGMA_WS_HOST || 'localhost',
  requestTimeout: parseInt(process.env.FIGMA_REQUEST_TIMEOUT || '30000', 10),
  mode: (process.env.FIGMA_PILOT_MODE || 'write-only') as ToolMode,
};

export const SERVER_NAME = 'figma-pilot-mcp';
export const SERVER_VERSION = '0.1.0';
