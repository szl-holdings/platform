/**
 * SZL Holdings — Agent Gateway: HTTP Server
 * Phase 11 — Agent Gateway
 *
 * Routes:
 *   POST /v1/agent/action    — execute an agent action through the gateway
 *   GET  /v1/capabilities    — list allowed and forbidden capabilities
 *   GET  /health             — liveness probe
 *   GET  /ready              — readiness probe
 *
 * Uses Node's native http module (no Express) so the gateway has zero
 * runtime dependencies on hoisted workspace packages — important when
 * the surrounding monorepo's pnpm store may dedupe to incompatible
 * versions of express/path-to-regexp.
 */

import { createServer as createHttpServer, type IncomingMessage, type ServerResponse } from 'http';
import { randomUUID } from 'crypto';
import { AgentGateway } from './gateway.js';
import { listCapabilities } from './capabilities/enforce.js';
import type { GatewayConfig } from './types.js';

// ---------------------------------------------------------------------------
// Config from environment
// ---------------------------------------------------------------------------

function loadConfig(): GatewayConfig {
  return {
    jwtSecret: process.env['JWT_SECRET'] ?? 'szl-agent-gateway-dev-secret-do-not-use-in-prod',
    opaEndpoint: process.env['OPA_ENDPOINT'] ?? 'local',
    temporalEndpoint: process.env['TEMPORAL_ENDPOINT'] ?? 'local',
    openAiApiKey: process.env['OPENAI_API_KEY'] ?? 'local',
    auditLogPath: process.env['AUDIT_LOG_PATH'] ?? '/tmp/agent-gateway-audit.ndjson',
    approvalTimeoutMs: parseInt(process.env['APPROVAL_TIMEOUT_MS'] ?? '300000', 10),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload).toString(),
  });
  res.end(payload);
}

async function readJsonBody(req: IncomingMessage, maxBytes = 1_048_576): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let received = 0;
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      received += chunk.length;
      if (received > maxBytes) {
        reject(new Error('Request body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (chunks.length === 0) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf-8')));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

// ---------------------------------------------------------------------------
// Server setup
// ---------------------------------------------------------------------------

export function createServer(config?: GatewayConfig) {
  const cfg = config ?? loadConfig();
  const gateway = new AgentGateway(cfg);

  const basePath = (process.env['BASE_PATH'] ?? '').replace(/\/$/, '');

  return createHttpServer(async (req: IncomingMessage, res: ServerResponse) => {
    const correlationId =
      (req.headers['x-correlation-id'] as string | undefined) ?? randomUUID();
    let url = req.url ?? '/';
    if (basePath && url.startsWith(basePath)) {
      url = url.slice(basePath.length) || '/';
    }
    const method = req.method ?? 'GET';

    try {
      // GET /health
      if (method === 'GET' && url === '/health') {
        return sendJson(res, 200, {
          status: 'ok',
          service: 'agent-gateway',
          timestamp: new Date().toISOString(),
        });
      }

      // GET /ready
      if (method === 'GET' && url === '/ready') {
        return sendJson(res, 200, {
          status: 'ready',
          service: 'agent-gateway',
          timestamp: new Date().toISOString(),
        });
      }

      // GET /v1/capabilities
      if (method === 'GET' && url === '/v1/capabilities') {
        return sendJson(res, 200, listCapabilities());
      }

      // POST /v1/agent/action
      if (method === 'POST' && url === '/v1/agent/action') {
        const body = (await readJsonBody(req)) as {
          capability?: string;
          model?: string;
          target?: string;
          domain?: string;
          targetEnvironment?: string;
          parameters?: Record<string, unknown>;
        };

        if (!body.capability || !body.target || !body.domain) {
          return sendJson(res, 400, {
            correlationId,
            status: 'error',
            message: 'Missing required fields: capability, target, domain',
            auditId: 'n/a',
          });
        }

        const response = await gateway.handleRequest(
          body.capability,
          req.headers['authorization'] as string | undefined,
          body.parameters ?? {},
          {
            model: body.model,
            target: body.target,
            domain: body.domain,
            targetEnvironment:
              (body.targetEnvironment as 'development' | 'staging' | 'production') ??
              'development',
            correlationId,
          },
        );

        const httpStatus =
          response.status === 'success'
            ? 200
            : response.status === 'approval_pending'
              ? 202
              : response.status === 'forbidden'
                ? 403
                : response.status === 'auth_failed'
                  ? 401
                  : response.status === 'authz_denied'
                    ? 403
                    : response.status === 'approval_denied'
                      ? 403
                      : 500;

        return sendJson(res, httpStatus, response);
      }

      // 404
      sendJson(res, 404, { error: 'Not found', path: url, method });
    } catch (err) {
      // Log full error server-side (with correlationId) for ops; return a generic
      // message so internal details are never leaked to the caller (CWE-209).
      console.error(`[gateway] request error (correlationId=${correlationId}):`, err);
      sendJson(res, 500, {
        correlationId,
        status: 'error',
        message: 'Internal server error',
      });
    }
  });
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

if (process.env['NODE_ENV'] !== 'test') {
  const port = parseInt(process.env['PORT'] ?? '8090', 10);
  const server = createServer();
  server.listen(port, '0.0.0.0', () => {
    process.stdout.write(
      JSON.stringify({
        level: 'INFO',
        timestamp: new Date().toISOString(),
        message: 'Agent Gateway server started',
        port,
        opaEndpoint: process.env['OPA_ENDPOINT'] ?? 'local',
        temporalEndpoint: process.env['TEMPORAL_ENDPOINT'] ?? 'local',
      }) + '\n',
    );
  });
}
