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

import { createPublicKey, randomUUID } from 'node:crypto';
import {
  createServer as createHttpServer,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';
import { probeApprovalWorkflow, probeTemporalClientAvailability } from './approval-readiness.js';
import { probeOpaDecision } from './authz.js';
import { listCapabilities } from './enforce.js';
import { AgentGateway, requireTargetEnvironment } from './gateway.js';
import { probeEvidenceLedger } from './persistence.js';
import { isDevelopmentOrTestRuntime, isProductionRuntime } from './runtime-environment.js';
import type { GatewayConfig, TargetEnvironment } from './types.js';

// ---------------------------------------------------------------------------
// Config from environment
// ---------------------------------------------------------------------------

export function loadConfig(): GatewayConfig {
  const requestedExecutionMode = process.env['GATEWAY_EXECUTION_MODE'];
  if (
    requestedExecutionMode !== undefined &&
    requestedExecutionMode !== 'live' &&
    requestedExecutionMode !== 'stub'
  ) {
    throw new Error('GATEWAY_EXECUTION_MODE must be either live or stub');
  }
  const executionMode = requestedExecutionMode ?? 'live';
  const configuredOpenAiKey = process.env['OPENAI_API_KEY']?.trim();
  const developmentMode = isDevelopmentOrTestRuntime();
  if (executionMode === 'stub' && !developmentMode) {
    throw new Error('GATEWAY_EXECUTION_MODE=stub is permitted only in development or test');
  }
  if (!configuredOpenAiKey && executionMode !== 'stub') {
    throw new Error(
      'OPENAI_API_KEY is required unless the explicit development/test stub is enabled',
    );
  }
  const configuredOpaEndpoint = process.env['OPA_ENDPOINT']?.trim();
  const configuredTemporalEndpoint = process.env['TEMPORAL_ENDPOINT']?.trim();
  if (executionMode !== 'stub' && !configuredOpaEndpoint) {
    throw new Error(
      'OPA_ENDPOINT is required unless the explicit development/test stub is enabled',
    );
  }
  if (executionMode !== 'stub' && !configuredTemporalEndpoint) {
    throw new Error(
      'TEMPORAL_ENDPOINT is required unless the explicit development/test stub is enabled',
    );
  }

  const jwtAlgorithm = process.env['JWT_ALGORITHM']?.trim();
  let jwt: GatewayConfig['jwt'];
  if (executionMode === 'stub') {
    if (jwtAlgorithm !== undefined && jwtAlgorithm !== 'HS256') {
      throw new Error('The development/test stub permits only JWT_ALGORITHM=HS256');
    }
    const jwtSecret = process.env['JWT_SECRET']?.trim();
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is required for the explicit development/test stub');
    }
    jwt = { algorithm: 'HS256', secret: jwtSecret };
  } else {
    if (jwtAlgorithm !== 'RS256') {
      throw new Error('Live mode requires explicit JWT_ALGORITHM=RS256');
    }
    if (process.env['JWT_SECRET']?.trim()) {
      throw new Error(
        'JWT_SECRET is forbidden in live mode; configure asymmetric RS256 verification',
      );
    }
    const publicKey = process.env['JWT_PUBLIC_KEY']?.replace(/\\n/g, '\n').trim();
    const issuer = process.env['JWT_ISSUER']?.trim();
    const audience = process.env['JWT_AUDIENCE']?.trim();
    const orgId = process.env['JWT_ORG_ID']?.trim();
    if (!publicKey || !issuer || !audience || !orgId) {
      throw new Error(
        'Live mode requires JWT_PUBLIC_KEY, JWT_ISSUER, JWT_AUDIENCE, and JWT_ORG_ID',
      );
    }
    try {
      const key = createPublicKey(publicKey);
      if (
        key.asymmetricKeyType !== 'rsa' ||
        (key.asymmetricKeyDetails?.modulusLength ?? 0) < 2_048
      ) {
        throw new Error('not an RSA key of at least 2048 bits');
      }
    } catch (error) {
      throw new Error(
        `JWT_PUBLIC_KEY must be a valid RSA public key of at least 2048 bits: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
    jwt = { algorithm: 'RS256', publicKey, issuer, audience, orgId };
  }

  let evidenceLedger: GatewayConfig['evidenceLedger'] = null;
  if (executionMode === 'live') {
    const endpoint = process.env['EVIDENCE_LEDGER_ENDPOINT']?.trim();
    const token = process.env['EVIDENCE_LEDGER_TOKEN']?.trim();
    if (!endpoint || !token) {
      throw new Error(
        'Live mode is on HOLD until EVIDENCE_LEDGER_ENDPOINT and EVIDENCE_LEDGER_TOKEN configure the required durable tamper-evident ledger',
      );
    }
    let parsedEndpoint: URL;
    try {
      parsedEndpoint = new URL(endpoint);
    } catch {
      throw new Error('EVIDENCE_LEDGER_ENDPOINT must be a valid HTTPS URL');
    }
    if (parsedEndpoint.protocol !== 'https:') {
      throw new Error('EVIDENCE_LEDGER_ENDPOINT must use HTTPS in live mode');
    }
    evidenceLedger = { endpoint: endpoint.replace(/\/$/, ''), token };
  }

  let approvalWorkflow: GatewayConfig['approvalWorkflow'] = null;
  if (executionMode === 'live') {
    const namespace = process.env['TEMPORAL_NAMESPACE']?.trim();
    const taskQueue = process.env['TEMPORAL_APPROVAL_TASK_QUEUE']?.trim();
    const proofEndpoint = process.env['TEMPORAL_APPROVAL_PROOF_ENDPOINT']?.trim();
    const proofToken = process.env['TEMPORAL_APPROVAL_PROOF_TOKEN']?.trim();
    if (!namespace || !taskQueue || !proofEndpoint || !proofToken) {
      throw new Error(
        'Live mode is on HOLD until TEMPORAL_NAMESPACE, TEMPORAL_APPROVAL_TASK_QUEUE, TEMPORAL_APPROVAL_PROOF_ENDPOINT, and TEMPORAL_APPROVAL_PROOF_TOKEN configure a deployed approvalWorkflow round-trip proof',
      );
    }
    let parsedProofEndpoint: URL;
    try {
      parsedProofEndpoint = new URL(proofEndpoint);
    } catch {
      throw new Error('TEMPORAL_APPROVAL_PROOF_ENDPOINT must be a valid HTTPS URL');
    }
    if (parsedProofEndpoint.protocol !== 'https:') {
      throw new Error('TEMPORAL_APPROVAL_PROOF_ENDPOINT must use HTTPS in live mode');
    }
    approvalWorkflow = {
      namespace,
      taskQueue,
      proofEndpoint: proofEndpoint.replace(/\/$/, ''),
      proofToken,
    };
  }

  const approvalTimeoutMs = Number(process.env['APPROVAL_TIMEOUT_MS'] ?? '300000');
  if (!Number.isSafeInteger(approvalTimeoutMs) || approvalTimeoutMs < 1) {
    throw new Error('APPROVAL_TIMEOUT_MS must be a positive integer');
  }
  return {
    jwt,
    opaEndpoint: executionMode === 'stub' ? 'local' : (configuredOpaEndpoint as string),
    temporalEndpoint: executionMode === 'stub' ? 'local' : (configuredTemporalEndpoint as string),
    openAiApiKey: executionMode === 'stub' ? 'local' : (configuredOpenAiKey as string),
    approvalWorkflow,
    evidenceLedger,
    auditLogPath: process.env['AUDIT_LOG_PATH'] ?? '/tmp/agent-gateway-development-evidence.ndjson',
    approvalTimeoutMs,
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
  // Validate the explicit platform marker even when tests or embedders inject
  // a config object instead of going through loadConfig().
  isProductionRuntime();
  const cfg = config ?? loadConfig();
  const gateway = new AgentGateway(cfg);

  const basePath = (process.env['BASE_PATH'] ?? '').replace(/\/$/, '');

  return createHttpServer(async (req: IncomingMessage, res: ServerResponse) => {
    const rawCorrelationId =
      (req.headers['x-correlation-id'] as string | undefined) ?? randomUUID();
    // Confine the caller-supplied id before it reaches any log line or response
    // body: first strip CR/LF so it cannot forge log entries (CWE-117), then
    // restrict to a safe charset. Fall back to a fresh id if nothing safe remains.
    const correlationId =
      rawCorrelationId
        .replace(/[\r\n]/g, '')
        .replace(/[^A-Za-z0-9._-]/g, '')
        .slice(0, 128) || randomUUID();
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
        const [opaReady, approvalProofReady, temporalClientReady, evidenceLedgerReady] =
          await Promise.all([
            probeOpaDecision(cfg.opaEndpoint),
            probeApprovalWorkflow(cfg),
            probeTemporalClientAvailability(cfg),
            probeEvidenceLedger(cfg),
          ]);
        const approvalWorkflowReady = approvalProofReady && temporalClientReady;
        const ready = opaReady && approvalWorkflowReady && evidenceLedgerReady;
        const developmentStub =
          isDevelopmentOrTestRuntime() &&
          cfg.opaEndpoint === 'local' &&
          cfg.temporalEndpoint === 'local' &&
          cfg.openAiApiKey === 'local';
        return sendJson(res, ready ? 200 : 503, {
          status: ready ? 'ready' : 'not_ready',
          service: 'agent-gateway',
          mode: developmentStub ? 'development-stub' : 'live',
          evidenceState: developmentStub ? 'UNAVAILABLE' : 'CONFIGURED',
          dependencies: {
            opa: opaReady,
            temporal: approvalWorkflowReady,
            evidenceLedger: evidenceLedgerReady,
          },
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

        if (!body.capability || !body.target || !body.domain || !body.targetEnvironment) {
          return sendJson(res, 400, {
            correlationId,
            status: 'error',
            message: 'Missing required fields: capability, target, domain, targetEnvironment',
            auditId: 'n/a',
          });
        }

        let targetEnvironment: TargetEnvironment;
        try {
          targetEnvironment = requireTargetEnvironment(body.targetEnvironment);
        } catch {
          return sendJson(res, 400, {
            correlationId,
            status: 'error',
            message: 'targetEnvironment must be development, staging, or production',
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
            targetEnvironment,
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
      process.stderr.write(
        `${JSON.stringify({
          level: 'ERROR',
          timestamp: new Date().toISOString(),
          correlationId,
          message: 'Gateway request failed',
          error: err instanceof Error ? err.message : String(err),
        })}\n`,
      );
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

export async function startServer(config = loadConfig()): Promise<ReturnType<typeof createServer>> {
  const [opaReady, approvalProofReady, temporalClientReady, evidenceLedgerReady] =
    await Promise.all([
      probeOpaDecision(config.opaEndpoint),
      probeApprovalWorkflow(config),
      probeTemporalClientAvailability(config),
      probeEvidenceLedger(config),
    ]);
  const approvalWorkflowReady = approvalProofReady && temporalClientReady;
  if (!opaReady) {
    throw new Error(
      'Agent Gateway startup HOLD: OPA did not return the exact pinned production decision contract',
    );
  }
  if (!approvalWorkflowReady) {
    throw new Error(
      'Agent Gateway startup HOLD: deployed Temporal approvalWorkflow group/count round trip was not proven',
    );
  }
  if (!evidenceLedgerReady) {
    throw new Error(
      'Agent Gateway startup HOLD: durable tamper-evident evidence ledger did not pass its readiness contract',
    );
  }
  const port = Number(process.env['PORT'] ?? '8090');
  if (!Number.isSafeInteger(port) || port < 1 || port > 65_535) {
    throw new Error('PORT must be an integer from 1 through 65535');
  }
  const server = createServer(config);
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '0.0.0.0', resolve);
  });
  process.stdout.write(
    `${JSON.stringify({
      level: 'INFO',
      timestamp: new Date().toISOString(),
      message: 'Agent Gateway server started',
      port,
      opaEndpoint: config.opaEndpoint,
      temporalEndpoint: config.temporalEndpoint,
      evidenceBackend: config.evidenceLedger ? 'durable-ledger' : 'development-file',
    })}\n`,
  );
  return server;
}

if (process.env['NODE_ENV'] !== 'test') {
  void startServer().catch((error) => {
    process.stderr.write(
      `${JSON.stringify({
        level: 'FATAL',
        timestamp: new Date().toISOString(),
        message: 'Agent Gateway startup failed closed',
        error: error instanceof Error ? error.message : String(error),
      })}\n`,
    );
    process.exitCode = 1;
  });
}
