/**
 * Substrate MCP Gateway — stdio Transport (SDK-Based)
 *
 * Replaces the hand-rolled stdio JSON-RPC loop with the official SDK's
 * StdioServerTransport. The transport reads from stdin and writes to stdout,
 * following the MCP stdio protocol exactly.
 *
 * The PRAXISMcpServer instance (shared with the HTTP transport) provides the
 * full tool surface plus governance middleware. The SDK transport handles
 * framing, session management, and protocol handshake.
 *
 * Usage:
 *   node dist/index.js --stdio
 *   tsx src/index.ts --stdio
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { runEventBus } from '../run-events.js';
import { getGatewayServer } from '../nexus-gateway-server.js';

/**
 * Start the stdio MCP transport.
 * Connects the singleton PRAXISMcpServer to a StdioServerTransport and
 * subscribes to tool-list-changed events so the host is notified when
 * enable_server / disable_server changes the active tool set.
 */
export async function startStdioTransport(): Promise<void> {
  const transport = new StdioServerTransport();
  const server = getGatewayServer();

  // Forward tool_list_changed events to the connected host as an SDK-standard
  // notifications/tools/list_changed notification (MCP spec §6.5).
  // The host responds by calling tools/list again to refresh its working set.
  runEventBus.subscribe((event) => {
    if (event.type === 'tool_list_changed') {
      void server.notifyListChanged('tools/list_changed');
    }
  });

  await server.connect(transport);

  // Keep the process alive until stdin closes (host terminates)
  await new Promise<void>((resolve) => {
    transport.onclose = () => resolve();
    process.stdin.on('end', () => resolve());
  });
}
