/**
 * Substrate MCP Gateway — Entry Point
 *
 * Starts either:
 *   - HTTP+SSE transport (default)        → node dist/index.js
 *   - stdio transport (for MCP hosts)     → node dist/index.js --stdio
 *
 * Environment variables:
 *   SUBSTRATE_GATEWAY_PORT      — HTTP port (default: 3700; falls back to PORT)
 *   SUBSTRATE_GATEWAY_API_KEY   — Bearer token required for write operations
 *   SUBSTRATE_SIGNING_KEY       — 32-byte hex key for evidence bundle HMAC
 *   NODE_ENV                    — production | development
 */

import { listWorkflows } from '@szl/substrate';
import express from 'express';
import { SERVER_INFO } from './descriptor.js';
import { createHttpTransport } from './transport/http.js';
import { startStdioTransport } from './transport/stdio.js';

const IS_STDIO = process.argv.includes('--stdio');
const PORT = parseInt(process.env.SUBSTRATE_GATEWAY_PORT ?? process.env.PORT ?? '3700', 10);
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Startup check: warn loudly if the workflow registry is empty. Without any
// registerWorkflow() calls in this process, every substrate_submit_run will
// fail because lookupWorkflow() returns undefined for every workflowId.
function warnIfRegistryEmpty(log: (msg: string) => void): void {
  const registered = listWorkflows();
  if (registered.length === 0) {
    log(
      '[substrate-mcp-gateway] WARNING: workflow registry is EMPTY. ' +
        'No workflows have been registered via registerWorkflow(). ' +
        'Every substrate_submit_run call will fail until at least one workflow is registered.',
    );
  } else {
    log(
      `[substrate-mcp-gateway] Workflow registry: ${registered.length} workflow(s) registered ` +
        `(${registered.map((w) => w.id).join(', ')})`,
    );
  }
}

// Fail-fast: refuse to start in production without an API key.
// In development a warning is logged by auth.ts and unauthenticated mode is used.
if (IS_PRODUCTION && !process.env.SUBSTRATE_GATEWAY_API_KEY) {
  process.exit(1);
}

if (IS_STDIO) {
  // stdio transport: stderr is the only safe place for diagnostic logs
  warnIfRegistryEmpty((_msg) => {});
  startStdioTransport();
} else {
  warnIfRegistryEmpty((_msg) => {});
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  // MCP gateway mounted at /mcp
  app.use('/mcp', createHttpTransport());

  // Root redirect for discoverability
  app.get('/', (_req, res) => {
    res.json({
      service: SERVER_INFO.name,
      version: SERVER_INFO.version,
      protocol: SERVER_INFO.protocolVersion,
      endpoints: {
        health: 'GET /mcp/health',
        tools: 'GET /mcp/tools',
        resources: 'GET /mcp/resources',
        prompts: 'GET /mcp/prompts',
        jsonrpc: 'POST /mcp',
        sse: 'GET /mcp/sse',
      },
    });
  });

  // Standard Kubernetes probe aliases (alias /mcp/health)
  app.get('/healthz', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.get('/readyz', (_req, res) => {
    res.status(200).json({ ready: true });
  });

  const server = app.listen(PORT, '0.0.0.0', () => {
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    server.close(() => process.exit(0));
  });

  process.on('SIGINT', () => {
    server.close(() => process.exit(0));
  });
}
