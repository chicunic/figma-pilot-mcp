import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { connectToFigma, disconnect, getChannel, getWebSocketUrl, isConnected } from '../utils/websocket.ts';

export function registerConnectionTools(server: McpServer): void {
  server.registerTool(
    'pilot_connect',
    {
      description: 'Connect to Figma plugin via WebSocket. Required before other operations.',
      inputSchema: { channel: z.string().describe("Channel name (e.g., 'figma-pilot-xxx')") },
    },
    ({ channel }) => {
      connectToFigma(channel);
      return {
        content: [{ type: 'text', text: `Connected to Figma on channel: ${channel}` }],
      };
    },
  );

  server.registerTool('pilot_disconnect', { description: 'Disconnect from Figma plugin.' }, () => {
    disconnect();
    return {
      content: [{ type: 'text', text: 'Disconnected from Figma' }],
    };
  });

  server.registerTool('pilot_status', { description: 'Get WebSocket connection status.' }, () => {
    const status = {
      connected: isConnected(),
      channel: getChannel(),
      url: getWebSocketUrl(),
    };
    return {
      content: [{ type: 'text', text: JSON.stringify(status, null, 2) }],
    };
  });
}
