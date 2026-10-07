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

import {
  aegisThreatTriageWorkflow,
  carlotaJoTaskRoutingWorkflow,
  crossSystemReconciliationWorkflow,
  evidenceBasedRecommendationWorkflow,
  executiveBriefWorkflow,
  listWorkflows,
  lyteOperationalDriftWorkflow,
  opportunityAuditWorkflow,
  prismCounselEvidencePackagingWorkflow,
  registerWorkflow,
  riskEscalationWorkflow,
  terraPortfolioAnomalyWorkflow,
  vesselsVoyageAnomalyWorkflow,
} from '@szl/substrate';
import express from 'express';
import { SERVER_INFO } from './descriptor.js';
import {
  getRevocationSyncReadiness,
  syncIdpConfigsFromDb,
  syncRevokedSubjectsFromDb,
} from './enterprise-auth.js';
import { getNexusRuntimeCapabilities } from './nexus-fabric.js';
import { assertProductionGatewayConfig, getExecutionCapabilityStatus } from './runtime-config.js';
import {
  createAuthorizationServerMetadata,
  createDiscoveryHandler,
  createHttpTransport,
} from './transport/http.js';
import { startStdioTransport } from './transport/stdio.js';

const IS_STDIO = process.argv.includes('--stdio');
const PORT = parseInt(process.env.SUBSTRATE_GATEWAY_PORT ?? process.env.PORT ?? '3700', 10);

// ─── Register all vertical and reference workflows ────────────────────────────
// These must be registered before the server begins accepting connections so
// that every substrate_submit_run call can resolve a workflow definition via
// lookupWorkflow(). Omitting any entry here causes silent run failures.
registerWorkflow(aegisThreatTriageWorkflow);
registerWorkflow(carlotaJoTaskRoutingWorkflow);
registerWorkflow(crossSystemReconciliationWorkflow);
registerWorkflow(evidenceBasedRecommendationWorkflow);
registerWorkflow(executiveBriefWorkflow);
registerWorkflow(lyteOperationalDriftWorkflow);
registerWorkflow(opportunityAuditWorkflow);
registerWorkflow(prismCounselEvidencePackagingWorkflow);
registerWorkflow(riskEscalationWorkflow);
registerWorkflow(terraPortfolioAnomalyWorkflow);
registerWorkflow(vesselsVoyageAnomalyWorkflow);

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

// Fail before either transport starts if production auth or evidence signing is
// not configured with durable, non-blank key material.
assertProductionGatewayConfig();

async function initializeEnterpriseState(): Promise<void> {
  const [revocationResult, idpResult] = await Promise.allSettled([
    syncRevokedSubjectsFromDb(),
    syncIdpConfigsFromDb(),
  ]);
  if (idpResult.status === 'rejected') {
    console.warn('[substrate-mcp-gateway] Enterprise IdP configuration sync failed');
  }
  if (revocationResult.status === 'rejected') {
    console.error('[substrate-mcp-gateway] Persisted revocation sync failed; readiness is closed');
  }
}

async function startHttpServer(): Promise<void> {
  // Complete the first persistence attempt before opening the listener. A failed
  // attempt still starts liveness endpoints, but readiness and protected MCP
  // traffic remain closed until a clean restart can synchronize state.
  await initializeEnterpriseState();
  warnIfRegistryEmpty((_msg) => {});
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  // MCP gateway mounted at /mcp
  app.use('/mcp', createHttpTransport());

  // MCP discovery endpoint (2025-11-25 spec)
  app.get('/.well-known/mcp', createDiscoveryHandler());

  // OAuth Authorization Server Metadata (RFC 8414)
  // Advertises enterprise-managed-authorization extension and ID-JAG grant type support.
  app.get('/.well-known/oauth-authorization-server', createAuthorizationServerMetadata());

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
        streamableHttp: 'POST /mcp (MCP 2025)',
        sse: 'GET /mcp/sse (MCP 2024-11-05)',
        sseMessage: 'POST /mcp/message (MCP 2024-11-05)',
      },
    });
  });

  // Standard Kubernetes probe aliases (alias /mcp/health)
  app.get('/healthz', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.get('/readyz', (_req, res) => {
    const revocationSync = getRevocationSyncReadiness();
    const execution = getExecutionCapabilityStatus();
    const ready = revocationSync.ready && execution.ready;
    res.status(ready ? 200 : 503).json({
      ready,
      status: ready ? 'ready' : execution.ready ? 'not-ready' : 'execution-held',
      revocationSync,
      execution,
      optionalCapabilities: getNexusRuntimeCapabilities(),
    });
  });

  const server = app.listen(PORT, '0.0.0.0');

  // Graceful shutdown
  process.on('SIGTERM', () => {
    server.close(() => process.exit(0));
  });

  process.on('SIGINT', () => {
    server.close(() => process.exit(0));
  });
}

async function main(): Promise<void> {
  if (IS_STDIO) {
    // A stdio process has no readiness endpoint, so a failed production sync
    // must prevent the transport from accepting any requests.
    await initializeEnterpriseState();
    if (!getRevocationSyncReadiness().ready) {
      throw new Error('Persisted enterprise revocation state is unavailable');
    }
    warnIfRegistryEmpty((_msg) => {});
    await startStdioTransport();
    return;
  }
  await startHttpServer();
}

void main().catch((error: unknown) => {
  console.error(
    `[substrate-mcp-gateway] Startup failed: ${error instanceof Error ? error.message : 'unknown error'}`,
  );
  process.exitCode = 1;
});
