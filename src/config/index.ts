import packageJson from '../../package.json';
import type { ServerConfig, ToolMode } from '../types/index.ts';

export const SERVER_NAME = packageJson.name;
export const SERVER_VERSION = packageJson.version;

function parseIntWithDefault(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? defaultValue : parsed;
}

export const config: ServerConfig = {
  socketPort: parseIntWithDefault(process.env.FIGMA_WS_PORT, 3846),
  socketHost: process.env.FIGMA_WS_HOST || 'localhost',
  requestTimeout: parseIntWithDefault(process.env.FIGMA_REQUEST_TIMEOUT, 30000),
  mode: (process.env.FIGMA_PILOT_MODE || 'write-only') as ToolMode,
};
