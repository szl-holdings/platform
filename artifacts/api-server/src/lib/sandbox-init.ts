/**
 * Sandbox Runtime — startup initialiser for api-server.
 *
 * Registers the governed sandbox tools (shell, fs.read, fs.write, fs.list,
 * session.create, session.snapshot, session.destroy) in the Tool Mesh gateway
 * and tool registry.
 *
 * This module is imported as a side-effect in `index.ts` so that registration
 * happens at server start-up — before any MCP client connects or any route
 * handler is called. This is required for MCP clients to discover sandbox tools
 * via standard capability negotiation.
 *
 * The route handler (`routes/tool-mesh.ts`) must NOT duplicate this call;
 * it imports this module and relies on the idempotency guard.
 */

import { logger } from './logger.js';

let _initialized = false;

export async function initSandboxRuntime(): Promise<void> {
  if (_initialized) return;
  _initialized = true;

  const { defaultGateway, defaultToolRegistry } = await import('@workspace/tool-mesh');
  const { registerSandboxTools } = await import('@workspace/sandbox-runtime/tool-registrations');
  registerSandboxTools(defaultGateway, defaultToolRegistry);
  logger.info('[sandbox-init] Sandbox tools registered in Tool Mesh gateway (MCP bridge ready)');
}
