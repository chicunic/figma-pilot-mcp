import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { config } from '../config/index.ts';
import { registerBatchTools } from './batch-tools.ts';
import { registerConnectionTools } from './connection-tools.ts';
import { registerCreationTools } from './creation-tools.ts';
import { registerModificationTools } from './modification-tools.ts';
import { registerReadingTools } from './reading-tools.ts';
import { registerTextTools } from './text-tools.ts';

export function registerTools(server: McpServer): void {
  // Connection tools (always registered)
  registerConnectionTools(server);

  // Write tools (always registered)
  registerCreationTools(server);
  registerModificationTools(server);
  registerTextTools(server);
  registerBatchTools(server);

  // Read tools (read-write mode only)
  if (config.mode === 'read-write') {
    registerReadingTools(server);
  }
}
