import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { connectToFigma, disconnect, getChannel, getWebSocketUrl, isConnected } from '../utils/websocket.ts';

export function registerConnectionTools(server: McpServer): void {
  // Connect to Figma
  server.tool(
    'pilot_connect',
    'Connect to Figma plugin via WebSocket. Required before other operations.',
    {
      channel: z.string().describe("Channel name (e.g., 'figma-pilot-xxx')"),
    },
    async ({ channel }) => {
      try {
        await connectToFigma(channel);
        return {
          content: [
            {
              type: 'text',
              text: `Connected to Figma on channel: ${channel}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to connect: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Disconnect
  server.tool('pilot_disconnect', 'Disconnect from Figma plugin.', {}, async () => {
    disconnect();
    return {
      content: [{ type: 'text', text: 'Disconnected from Figma' }],
    };
  });

  // Get connection status
  server.tool('pilot_status', 'Get WebSocket connection status.', {}, async () => {
    const connected = isConnected();
    const channel = getChannel();
    const url = getWebSocketUrl();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ connected, channel, url }, null, 2),
        },
      ],
    };
  });
}
