import nodeHttp from 'node:http';
import v8 from 'node:v8';
import * as Sentry from '@sentry/node';
import { resolveRuntimeMode } from '@szl-holdings/platform-registry';
import { initializeOpenTelemetry } from '@szl-holdings/observability';
import { createAefRouter } from '@workspace/alloy-embedding-api';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { randomBytes } from 'node:crypto';
import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import { readFileSync } from 'node:fs';
import helmet from 'helmet';
import { buildHelmetOptions } from '@szl-holdings/security-headers';
import { dirname, join } from 'node:path';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { sendError, sendForbidden, sendNotFound, sendUnauthorized } from './lib/api-response';
import { checkInferenceGates, getGateSummary } from './a11oy/runtime/router/model-router';
import { setInferenceGateChecker } from '@szl-holdings/ai-engine/providers/inference-gates';
import {
  ensureLexiconEntryAndEnqueueReview,
  seedLexiconFromRegistry,
} from './routes/a11oy-lexicon-api';

// Register the registry-aware 5-gate checker so every HF entry point in
// lib/ai-engine (hf-client, connector adapter) enforces the SAME gates as
// the in-process router. Defense in depth: fails closed without this.
//
// Lexicon hook (#4763): when the registry-side `license_approved` gate
// fails — typically because the model is not in the operator registry — we
// fire-and-forget enqueue a Lexicon review request so an operator can
// approve/deny it. The gate stays failed for THIS call (fails closed) but
// the next call after operator approval will pass.
setInferenceGateChecker((modelId) => {
  const r = checkInferenceGates(modelId);
  if (!r.gates.license_approved || !r.gates.registry_exists) {
    void ensureLexiconEntryAndEnqueueReview({
      targetId: modelId,
      context: { source: 'inference_gate_checker', failedGates: r.failedGates },
    }).catch(() => {});
  }
  return { allowed: r.allowed, model: r.model, failedGates: r.failedGates, gates: r.gates };
});

// Seed the Lexicon catalog at boot so the dashboard renders something on a
// fresh DB and the inference-gate hook always finds a row to update.
void seedLexiconFromRegistry().catch(() => {});

// Rehydrate the orchestration proof ledger from the durable proof_ledger
// table (task #4879) so /api/a11oy/fabric/proofs returns the historical
// audit trail across restarts instead of an empty list. Use the .js
// specifier — the api-server is built as ESM and dynamic imports must
// include the extension at runtime (see other dynamic imports in this
// file, e.g. './lib/health-probes.js'). Errors are logged so a silent
// hydration regression is observable in the boot logs.
import { hydrateProofsFromDb } from './services/orchestration-store.js';
void hydrateProofsFromDb().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[orchestration-store] proof ledger hydrate failed at boot', err);
});
import { assertInternalTokenPolicy } from './lib/internal-tokens';
import { logger } from './lib/logger';
import { ENV_SPECS } from './lib/startup-validation';
import { apiVersionMiddleware } from './middlewares/api-version';
import { appModeMiddleware } from './middlewares/app-mode.js';
import { authMiddleware } from './middlewares/auth';
import { brotliMiddleware } from './middlewares/brotli';
import { correlationMiddleware } from './middlewares/correlation';
import { csrfMiddleware } from './middlewares/csrf';
import { globalAuthEnforcer } from './middlewares/global-auth-enforcer';
import { meshCallLogger } from './middlewares/mesh-call-logger';
import { etagMiddleware } from './middlewares/optimistic-concurrency';
import { otelSpanMiddleware } from './middlewares/otel-span';
import { globalLimiter } from './middlewares/rate-limiters';
import { adaptiveLoadShedder, startLoadMetricsSampling } from './middlewares/load-shedder';
import { sessionRefreshPolicy } from './middlewares/session-policy';
import { telemetryMiddleware } from './middlewares/telemetry';
import { traceEmitMiddleware } from './middlewares/trace-emit';
import { createHonoApp, createHonoExpressHandler } from './hono/index';
import router from './routes';
import demoResetRouter from './routes/demo-reset';
import a11oyOrchestrationRouter from './routes/a11oy-orchestration-api';
import payloadRouter from './routes/payload';
import a11oyLexiconRouter from './routes/a11oy-lexicon-api';
import psycheRouter from './routes/psyche';
import { sentraProbeDetectionMiddleware } from './middlewares/sentra-probe-detection';

const app: Express = express();

app.set('trust proxy', 1);

const isProduction = process.env.NODE_ENV === 'production';

// GAP-016: refuse to boot in production when only the legacy
// ALLOY_INTERNAL_TOKEN is configured. See docs/SECRETS_POLICY.md.
assertInternalTokenPolicy({ isProduction });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function resolveOtlpEndpoint(): string | undefined {
  const raw = process.env.OTLP_ENDPOINT ?? process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!raw) return undefined;
  try {
    const u = new URL(raw);
    if (!u.protocol.startsWith('http')) return undefined;
    return raw;
  } catch {
    logger.debug(
      { raw },
      '[observability] OTLP_ENDPOINT is not a valid URL — OTel export disabled. Set a valid https:// endpoint to enable.',
    );
    return undefined;
  }
}

export const otelReady = initializeOpenTelemetry({
  serviceName: process.env.OTEL_SERVICE_NAME ?? 'szl-api-server',
  serviceVersion: process.env.npm_package_version ?? '0.0.0',
  otlpEndpoint: resolveOtlpEndpoint(),
  exportToConsole: process.env.OTEL_CONSOLE_EXPORT === 'true',
}).catch((_e) => {});

app.use(correlationMiddleware);
app.use(otelSpanMiddleware);
app.use(apiVersionMiddleware);
app.use(appModeMiddleware);

app.use(
  helmet(
    buildHelmetOptions({ isProduction }) as Parameters<typeof helmet>[0],
  ),
);

app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
  );
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  if (isProduction) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }
  next();
});

const rawCorsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
  : undefined;

if (isProduction && !rawCorsOrigins) {
  logger.warn(
    'CORS_ORIGINS not set in production — CORS will reject cross-origin requests with credentials',
  );
}

function originToPattern(origin: string): RegExp | string {
  if (origin.includes('*')) {
    const escaped = origin.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '.*');
    return new RegExp(`^${escaped}$`);
  }
  return origin;
}

const corsOriginList = rawCorsOrigins?.map(originToPattern);

function corsOriginFn(
  requestOrigin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
) {
  if (!requestOrigin) return callback(null, true);
  if (!corsOriginList) return callback(null, !isProduction);
  const allowed = corsOriginList.some((pattern) =>
    pattern instanceof RegExp ? pattern.test(requestOrigin) : pattern === requestOrigin,
  );
  callback(null, allowed);
}

app.use(
  cors({
    origin: corsOriginFn,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Correlation-Id',
      'X-SZL-Correlation-ID',
      'X-Request-Id',
      'X-CSRF-Token',
      'X-Api-Version',
      'traceparent',
      'tracestate',
    ],
    exposedHeaders: [
      'X-Correlation-Id',
      'X-SZL-Correlation-ID',
      'X-Request-Id',
      'X-Api-Version',
      'X-Api-Versions-Supported',
      'Deprecation',
      'Sunset',
      'X-Api-Deprecated',
      'X-Api-Deprecation-Notice',
      'traceparent',
    ],
    maxAge: 86400,
  }),
);

app.use(
  compression({
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    },
  }),
);

// Brotli compression runs BEFORE gzip. Clients that advertise `Accept-Encoding: br`
// receive Brotli-compressed responses (typically 15-25% smaller than gzip at
// equivalent CPU cost). Clients without `br` support fall through to the
// gzip `compression` middleware above.
app.use(brotliMiddleware);

app.use(telemetryMiddleware);
app.use(traceEmitMiddleware);

app.use(
  pinoHttp({
    logger,
    genReqId: (req) => (req as Request).requestId || (req as Request).correlationId || req.id,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split('?')[0],
          requestId: req.id,
          correlationId: (req.raw as Request).correlationId ?? req.id,
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
    customLogLevel: (_req, res) => {
      if (res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
  }),
);

app.use(cookieParser());
app.use(
  express.json({
    limit: '512kb',
    verify: (req: Request, _res, buf) => {
      (req as Request & { rawBody?: Buffer }).rawBody = buf;
    },
  }),
);
app.use(
  express.urlencoded({
    extended: true,
    limit: '512kb',
    verify: (req: Request, _res, buf) => {
      if (!(req as Request & { rawBody?: Buffer }).rawBody) {
        (req as Request & { rawBody?: Buffer }).rawBody = buf;
      }
    },
  }),
);
app.get('/', (_req: Request, res: Response) => {
  res.status(200).send('OK');
});

// Aegis deprecation redirect — /aegis/* → /sentra/*
// Aegis was consolidated into Sentra as the single cyber/defense surface.
// All legacy /aegis/* paths issue a permanent (301) redirect to the
// equivalent /sentra/* path so bookmarks and external links continue to work.
app.use('/aegis', (req: Request, res: Response) => {
  const remainder = req.path === '/' ? '' : req.path;
  const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  res.redirect(301, `/sentra${remainder}${qs}`);
});

// ROSIE deprecation redirect — /rosie/* → /sentra/brain/*
// ROSIE was folded into Sentra as the "Guard Dog Brain" subsurface. The legacy
// standalone artifact has been removed; all bookmarks and external links are
// permanently redirected to the equivalent Sentra brain route. Old ROSIE
// slugs are translated to their new Sentra brain equivalents:
//   /             → /optimizer   (primary landing)
//   /identity     → /constitution (the constitutional clauses page)
//   /fabric       → /evolution    (the brain-evolution surface)
//   /proof        → /proofs       (singular legacy → plural ledger page)
//   /proof/:id    → /proofs/:id
// All other slugs pass through 1:1 (e.g. /optimizer, /research, /bench).
const ROSIE_SLUG_MAP: Record<string, string> = {
  '': '/optimizer',
  '/': '/optimizer',
  '/identity': '/constitution',
  '/fabric': '/evolution',
  '/proof': '/proofs',
};
app.use('/rosie', (req: Request, res: Response) => {
  const remainder = req.path === '/' ? '' : req.path;
  const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  let target: string;
  if (remainder in ROSIE_SLUG_MAP) {
    target = ROSIE_SLUG_MAP[remainder];
  } else if (remainder.startsWith('/proof/')) {
    target = `/proofs/${remainder.slice('/proof/'.length)}`;
  } else {
    target = remainder;
  }
  res.redirect(301, `/sentra/brain${target}${qs}`);
});

// --- Substrate MCP gateway proxy ---------------------------------------------
// Proxies /mcp/* to the substrate-mcp-gateway sidecar (started by start.sh).
// Mounted before session/csrf middleware so MCP traffic authenticates via
// SUBSTRATE_GATEWAY_API_KEY bearer token rather than the api-server session.
// When the API key is configured (production), unauthenticated callers are
// rejected here before reaching the sidecar — preventing anonymous enumeration
// of tools, resources, prompts, and live run events.
{
  const mcpGatewayPort = parseInt(process.env.SUBSTRATE_GATEWAY_PORT ?? '8099', 10);
  const mcpApiKey = process.env.SUBSTRATE_GATEWAY_API_KEY;
  app.use('/mcp', (req: Request, res: Response) => {
    // Gate: when SUBSTRATE_GATEWAY_API_KEY is configured, require a matching
    // Bearer token. Health probes to /mcp/health are exempt so orchestration
    // infrastructure can check liveness without a token.
    if (mcpApiKey && req.path !== '/health') {
      const authHeader = req.headers.authorization ?? '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
      if (!token || token !== mcpApiKey) {
        res.status(401).json({
          error: 'mcp_unauthorized',
          detail: 'A valid SUBSTRATE_GATEWAY_API_KEY Bearer token is required.',
        });
        return;
      }
    }
    const proxyReq = nodeHttp.request(
      {
        host: '127.0.0.1',
        port: mcpGatewayPort,
        method: req.method,
        path: `/mcp${req.url === '/' ? '' : req.url}`,
        headers: { ...req.headers, host: `127.0.0.1:${mcpGatewayPort}` },
      },
      (proxyRes) => {
        res.status(proxyRes.statusCode ?? 502);
        for (const [k, v] of Object.entries(proxyRes.headers)) {
          if (v !== undefined) res.setHeader(k, v as string | string[]);
        }
        proxyRes.pipe(res);
      },
    );
    proxyReq.on('error', (err) => {
      if (!res.headersSent) {
        res.status(502).json({ error: 'mcp_gateway_unreachable', detail: err.message });
      } else {
        res.end();
      }
    });
    req.pipe(proxyReq);
  });
}
// -----------------------------------------------------------------------------

// AEF — Alloy Embedding Fabric API
// Mounted before CSRF/auth because AEF uses its own bearer-token auth.
// The AEF router is a pure API surface (no cookies/sessions) and safe to
// exempt from CSRF protection.
// Mounted at both /alloy-embedding-api (direct curl access) and
// /api/alloy-embedding-api (Replit preview pane which keeps the /api prefix).
const _aefRouter = createAefRouter();
app.use('/alloy-embedding-api', _aefRouter);
app.use('/api/alloy-embedding-api', _aefRouter);

// A11oy Orchestration Backbone (#4748) — single conductor for the six child
// products. Mounted BEFORE csrf/auth/globalAuthEnforcer because it is a public
// fabric API: child products register from public boots and the demo-chain
// endpoint must run without a session for the demo flow.
app.use('/api/a11oy', a11oyOrchestrationRouter);
app.use('/api/payload', payloadRouter);

// PSYCHE — Emergent Sentience Observatory (#4856). Mounted as a public read
// surface alongside the orchestration backbone so the A11oy PSYCHE pages
// (Anima, Genesis, Selfhood, Volition, Dreams, Voice) can fetch live data
// without a session. The seed data lives under `src/seed/psyche/` and is
// mirrored on the frontend as fallback/mock data.
app.use('/api/a11oy/psyche', psycheRouter);

app.use(csrfMiddleware);
app.use(authMiddleware({ required: false }));

// Lexicon — License Intelligence Catalog (#4763). Mounted AFTER authMiddleware
// so `req.user` is populated for the inline admin checks on
// approve/deny/risk-flag, while read endpoints remain accessible to anyone.
app.use('/api/a11oy/lexicon', a11oyLexiconRouter);
app.use(sessionRefreshPolicy());
app.use(sentraProbeDetectionMiddleware);
// Adaptive load shedder — runs before auth/rate-limit heavy paths so that
// low-priority background traffic (syncs, analytics) is rejected first under
// high event-loop lag or pool saturation, before user-facing traffic is shed.
app.use(adaptiveLoadShedder);
// Global rate limiter runs AFTER auth so req.user is populated and authenticated
// traffic is keyed by user/org ID rather than falling back to IP.
app.use(globalLimiter);
// Start background sampling of event-loop lag and DB pool saturation for load shedder.
startLoadMetricsSampling();

app.get('/api/health', async (_req: Request, res: Response) => {
  const memUsage = process.memoryUsage();
  const uptimeSeconds = Math.floor(process.uptime());

  const { getDetailedHealth } = await import('./lib/health-probes.js');
  const probes = await getDetailedHealth();

  const dbLatencyMs: number | null = probes.database.latencyMs ?? null;
  const queueDepth = probes.queue.depth ?? 0;
  const hasSessionSecret = !!process.env.SESSION_SECRET;
  const aiLatencyMs: number | null = probes.ai.latencyMs ?? null;
  const aiMode =
    process.env.AI_INTEGRATIONS_OPENAI_API_KEY ||
    process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY ||
    process.env.AI_INTEGRATIONS_GEMINI_API_KEY
      ? 'live'
      : 'mock';

  const isUnhealthy = (s: string) => s === 'error' || s === 'degraded';
  const overallStatus =
    isUnhealthy(probes.database.status) || isUnhealthy(probes.auth.status) ? 'degraded' : 'healthy';

  const platformApps = [
    { slug: 'szl-holdings', name: 'SZL Holdings Dashboard', type: 'command_surface' },
    { slug: 'a11oy', name: 'A11oy — Governed AI Platform', type: 'command_surface' },
    { slug: 'sentra', name: 'Sentra — Cyber Resilience Command', type: 'domain_pack' },
    { slug: 'terra', name: 'Terra — Real Estate Intelligence', type: 'domain_pack' },
    { slug: 'vessels', name: 'Vessels — Maritime Intelligence', type: 'domain_pack' },
    { slug: 'counsel', name: 'Counsel — Legal Matter Command', type: 'domain_pack' },
    { slug: 'conduit', name: 'Conduit — Reverse ETL', type: 'domain_pack' },
    { slug: 'carlota-jo', name: 'Carlota Jo Consulting', type: 'domain_pack' },
    { slug: 'szl-holdings-mobile', name: 'APEX — Mobile Command', type: 'mobile' },
    { slug: 'api-server', name: 'API Server', type: 'backend' },
  ];

  let runtimeMode: string;
  try {
    runtimeMode = resolveRuntimeMode();
  } catch {
    runtimeMode = process.env.NODE_ENV === 'production' ? 'production' : 'local-dev';
  }

  res.status(overallStatus === 'healthy' ? 200 : 503).json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: uptimeSeconds,
    uptime_human: `${Math.floor(uptimeSeconds / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m ${uptimeSeconds % 60}s`,
    version: process.env.npm_package_version || '0.0.0',
    environment: process.env.NODE_ENV || 'development',
    mode: runtimeMode,
    node: process.version,
    memory: (() => {
      // Use V8's heap_size_limit (the real OOM ceiling) as the denominator,
      // not process.memoryUsage().heapTotal (V8's currently-allocated heap,
      // which grows on demand and produces meaningless 90+% ratios when V8
      // hasn't yet expanded the heap to its limit).
      const heapLimit = v8.getHeapStatistics().heap_size_limit;
      return {
        heapUsedMb: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(heapLimit / 1024 / 1024),
        rssMb: Math.round(memUsage.rss / 1024 / 1024),
        heapUsedPct: Math.round((memUsage.heapUsed / heapLimit) * 100),
      };
    })(),
    services: {
      server: { status: 'ok' },
      database: { status: probes.database.status, latencyMs: dbLatencyMs },
      job_queue: { status: probes.queue.status, depth: queueDepth },
      storage: { status: 'ok', mode: process.env.OBJECT_STORAGE_BUCKET_ID ? 'cloud' : 'local' },
      auth: {
        status: probes.auth.status,
        mode: hasSessionSecret ? 'configured' : 'missing_secret',
      },
      ai: { status: probes.ai.status, latencyMs: aiLatencyMs, mode: aiMode },
      huggingface: (() => {
        const hfToken = !!(process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY);
        const gates = getGateSummary();
        const hfGateResult = checkInferenceGates(process.env.HF_PRIMARY_LLM || 'Qwen/Qwen3-8B');
        return {
          status: hfToken && hfGateResult.allowed ? 'ok' : hfToken ? 'gates_blocked' : 'unconfigured',
          tokenConfigured: gates.hfTokenConfigured,
          liveInferenceEnabled: gates.liveInferenceEnabled,
          productionApproved: gates.productionApproved,
          failedGates: hfGateResult.failedGates,
        };
      })(),
    },
    platform: {
      apps: platformApps,
      totalApps: platformApps.length,
    },
  });
});

app.get('/api/health/live', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Standard Kubernetes probe aliases: /healthz (liveness) and /readyz (readiness).
// Mirrors /api/health/live and /api/health/ready respectively so Kubernetes
// liveness/readiness probe configs can use the canonical /healthz + /readyz
// paths without the /api prefix.
app.get('/healthz', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Codex-Kernel deployment_contract endpoint. The payload v1.6.0
// declares: { path: '/api/healthz', expected_status: 200, ...}. The
// response includes the same version_lineage block the kernel runner
// embeds in its run_summary so a probe can verify (a) the api-server is
// up, (b) the deployed code matches the expected payload + repo commit.
app.get('/api/healthz', (_req: Request, res: Response) => {
  const repo_commit = process.env.GIT_COMMIT_SHA ?? process.env.REPL_SLUG_COMMIT ?? 'unknown';
  res.status(200).json({
    ok: true,
    status: 'ok',
    contract: 'codex-kernel-deployment-contract-v1',
    payload_version: process.env.CODEX_PAYLOAD_VERSION ?? '1.6.0-private-szl',
    kernel_version: 'codex-kernel-runner-1.0.0',
    repo_commit,
    model_provider: process.env.MODEL_PROVIDER ?? 'proxy_or_offline_emulator',
    model_version: process.env.MODEL_VERSION ?? 'deterministic',
    timestamp: new Date().toISOString(),
  });
});

app.get('/readyz', handleReadiness);

async function handleReadiness(_req: Request, res: Response) {
  // Gate 1: startup phase (migrations + critical hydration).
  // Import lazily to avoid a circular-module issue at app-module load time
  // (boot-orchestrator has no dependency on app, but app loads before index.ts
  // calls markStartupReady, so the flag starts false and flips during boot).
  const { isStartupReady } = await import('./lib/boot-orchestrator.js');
  if (!isStartupReady()) {
    res.status(503).json({
      status: 'starting',
      message: 'Server is still initialising (migrations or critical hydration in progress). Retry shortly.',
      timestamp: new Date().toISOString(),
      checks: {
        startup: 'pending',
        database: 'pending',
        uptime: process.uptime(),
      },
    });
    return;
  }

  // Gate 2: DB reachability (post-startup, ongoing health).
  const dbUrl = process.env.DATABASE_URL;
  let dbStatus = 'not_configured';

  if (dbUrl) {
    try {
      const { db } = await import('@szl-holdings/db');
      const { sql } = await import('drizzle-orm');
      await Promise.race([
        db.execute(sql`SELECT 1`),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
      ]);
      dbStatus = 'connected';
    } catch {
      dbStatus = 'unreachable';
    }
  }

  const allOk = dbStatus !== 'unreachable';

  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'ready' : 'degraded',
    timestamp: new Date().toISOString(),
    checks: {
      startup: 'ready',
      server: 'ok',
      database: dbStatus,
      uptime: process.uptime(),
    },
  });
}

app.get('/api/ready', handleReadiness);
app.get('/api/health/ready', handleReadiness);

app.get('/api/health/detailed', async (req: Request, res: Response) => {
  if (isProduction) {
    // GAP-016: route through the scoped-token registry so the same
    // policy (HMAC-digest constant-time compare, scope catalog) applies
    // here as everywhere else. Requires `health:read` scope.
    const { verifyInternalHeader, tokenHasScope } = await import('./lib/internal-tokens');
    const providedToken = req.headers['x-internal-token'] as string | undefined;
    const match = verifyInternalHeader(providedToken, req.originalUrl || req.url);
    const hasInternalAccess = match !== null && tokenHasScope(match.context, 'health:read');
    if (!hasInternalAccess) {
      if (!req.isAuthenticated()) {
        sendUnauthorized(res, 'Detailed health information is restricted to authenticated users');
        return;
      }
      const userRoles: string[] = (req.user as { roles?: string[] })?.roles ?? [];
      const hasAdminRole = userRoles.some((r) => ['ops', 'super_admin'].includes(r));
      if (!hasAdminRole) {
        sendForbidden(res, 'Detailed health information requires ops or super_admin role');
        return;
      }
    }
  }

  const { getDetailedHealth, getCacheAge } = await import('./lib/health-probes.js');
  const probes = await getDetailedHealth();

  const telemetry: { status: string; details?: string } = { status: 'unavailable' };
  try {
    const { serverTelemetry } = await import('@szl-holdings/observability');
    const snapshot = serverTelemetry.getSnapshot();
    telemetry.status = snapshot.errorRate > 10 ? 'elevated_errors' : 'ok';
    telemetry.details = `p95=${snapshot.p95Latency.toFixed(0)}ms error_rate=${snapshot.errorRate.toFixed(1)}% active_alerts=${snapshot.activeAlerts}`;
  } catch {
    /* telemetry not available */
  }

  const dbStatus =
    probes.database.status === 'ok'
      ? 'connected'
      : probes.database.status === 'error'
        ? 'unreachable'
        : probes.database.status;

  const queueCheckStatus =
    probes.queue.status === 'ok'
      ? 'ok'
      : probes.queue.status === 'degraded'
        ? 'backpressure'
        : probes.queue.status === 'error'
          ? 'error'
          : 'not_configured';

  const checks: Record<string, { status: string; latencyMs?: number; details?: string }> = {
    database: {
      status: dbStatus,
      latencyMs: probes.database.latencyMs,
      details: probes.database.details,
    },
    auth: {
      status: probes.auth.status,
      latencyMs: probes.auth.latencyMs,
      details: probes.auth.details,
    },
    ai: { status: probes.ai.status, latencyMs: probes.ai.latencyMs, details: probes.ai.details },
    job_queue: {
      status: queueCheckStatus,
      latencyMs: probes.queue.latencyMs,
      details: probes.queue.details,
    },
    telemetry,
  };

  const allStatuses = Object.values(checks).map((c) => c.status);
  const overallStatus = allStatuses.some((s) => s === 'unreachable' || s === 'error')
    ? 'degraded'
    : allStatuses.some(
          (s) =>
            s === 'backpressure' ||
            s === 'elevated_errors' ||
            s === 'degraded' ||
            s === 'unavailable',
        )
      ? 'warning'
      : 'healthy';

  const services = {
    server: { status: 'ok' as const, latencyMs: 0 },
    database: { status: probes.database.status, latencyMs: probes.database.latencyMs ?? null },
    auth: { status: probes.auth.status, latencyMs: probes.auth.latencyMs ?? null },
    ai: { status: probes.ai.status, latencyMs: probes.ai.latencyMs ?? null },
    job_queue: {
      status: probes.queue.status,
      latencyMs: probes.queue.latencyMs ?? null,
      depth: probes.queue.depth ?? 0,
    },
  };

  res.status(overallStatus === 'degraded' ? 503 : 200).json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version ?? '0.0.0',
    environment: process.env.NODE_ENV ?? 'development',
    mode: (() => {
      try {
        return resolveRuntimeMode();
      } catch {
        return process.env.NODE_ENV === 'production' ? 'production' : 'local-dev';
      }
    })(),
    cacheAgeMs: getCacheAge(),
    checks,
    services,
    memory: (() => {
      const m = process.memoryUsage();
      // Use V8's heap_size_limit (real OOM ceiling), not m.heapTotal
      // (V8's currently-allocated heap, which grows on demand).
      const heapLimit = v8.getHeapStatistics().heap_size_limit;
      return {
        heapUsedMb: Math.round(m.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(heapLimit / 1024 / 1024),
        rssMb: Math.round(m.rss / 1024 / 1024),
      };
    })(),
  });
});

let _swaggerDocument: Record<string, unknown> | null = null;

try {
  const specPath = join(__dirname, '../../../lib/api-spec/openapi.yaml');
  const specContent = readFileSync(specPath, 'utf-8');
  _swaggerDocument = parse(specContent) as Record<string, unknown>;
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(_swaggerDocument, {
      customSiteTitle: 'SZL Holdings API Docs',
      swaggerOptions: { persistAuthorization: true },
    }),
  );
  app.get('/api/docs.json', (_req: Request, res: Response) => {
    res.json(_swaggerDocument);
  });
  app.get('/api/openapi', (_req: Request, res: Response) => {
    res.json(_swaggerDocument);
  });
  app.get('/api/openapi.json', (_req: Request, res: Response) => {
    res.json(_swaggerDocument);
  });
} catch (err) {
  logger.warn({ err }, 'Failed to load OpenAPI spec — /api/docs will be unavailable');
}

app.get('/api/version', (_req: Request, res: Response) => {
  res.json({
    version: process.env.npm_package_version ?? '0.0.0',
    apiVersion: '2026-04-15',
    supportedApiVersions: ['2025-01-01', '2026-04-15'],
    deprecatedApiVersions: ['2025-01-01'],
    sunsetDates: { '2025-01-01': '2027-01-01' },
    environment: process.env.NODE_ENV ?? 'development',
    build: {
      commitSha: process.env.COMMIT_SHA ?? null,
      builtAt: process.env.BUILD_TIMESTAMP ?? null,
      nodeVersion: process.version,
    },
    docs: '/api/docs',
    openapi: '/api/openapi',
    health: '/api/health',
  });
});

app.get('/api/env-registry', async (req: Request, res: Response) => {
  if (isProduction) {
    // GAP-016: route through the scoped-token registry. Requires
    // `internal:read` scope (env registry exposes which secrets are
    // configured — not their values, but still operationally sensitive).
    const { verifyInternalHeader, tokenHasScope } = await import('./lib/internal-tokens');
    const providedToken = req.headers['x-internal-token'] as string | undefined;
    const match = verifyInternalHeader(providedToken, req.originalUrl || req.url);
    const hasInternalAccess = match !== null && tokenHasScope(match.context, 'internal:read');
    if (!hasInternalAccess) {
      if (!req.isAuthenticated()) {
        sendUnauthorized(
          res,
          'Environment registry is restricted to authenticated users in production',
        );
        return;
      }
      const userRoles: string[] = (req.user as { roles?: string[] })?.roles ?? [];
      const hasElevatedRole = userRoles.some((r) => ['ops', 'super_admin'].includes(r));
      if (!hasElevatedRole) {
        sendForbidden(res, 'Environment registry requires ops or super_admin role');
        return;
      }
    }
  }
  const groups = ENV_SPECS.reduce<
    Record<
      string,
      Array<{
        key: string;
        required: boolean;
        description: string;
        configured: boolean;
        hasDefault: boolean;
        sensitive: boolean;
      }>
    >
  >((acc, spec) => {
    const group = spec.group ?? 'other';
    if (!acc[group]) acc[group] = [];
    acc[group].push({
      key: spec.key,
      required: spec.required,
      description: spec.description,
      configured: !!process.env[spec.key],
      hasDefault: !!spec.defaultValue,
      sensitive: !!spec.sensitive,
    });
    return acc;
  }, {});
  const totalVars = ENV_SPECS.length;
  const configuredVars = ENV_SPECS.filter((s) => !!process.env[s.key]).length;
  res.json({
    registryVersion: '1.0',
    atlasSchemaVersion: process.env.ATLAS_SCHEMA_VERSION ?? '1.0.0',
    environment: process.env.NODE_ENV ?? 'development',
    summary: {
      total: totalVars,
      configured: configuredVars,
      unconfigured: totalVars - configuredVars,
      coveragePct: Math.round((configuredVars / totalVars) * 100),
    },
    groups,
  });
});

app.get('/api/csrf-token', (req: Request, res: Response) => {
  let token = req.cookies?.csrf_token as string | undefined;
  if (!token) {
    token = randomBytes(32).toString('hex');
    res.cookie('csrf_token', token, {
      httpOnly: false,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });
  }
  res.json({ csrfToken: token });
});

app.use('/api', etagMiddleware);
// Demo reset — mounted BEFORE globalAuthEnforcer so the public status endpoint
// (GET /api/demo/reset/status) and the production guard's 404 response can run
// without requiring an authenticated browser session. The mutating
// POST /api/demo/reset endpoint applies its own gates internally:
//   1) `guardSeedInProduction` (404 in production)
//   2) `DEMO_MODE=true` env flag (404 otherwise)
//   3) `authMiddleware({ required: true })` + admin role check (401/403 otherwise)
app.use('/api', demoResetRouter);

// ── Hono Edge Router ─────────────────────────────────────────────────────────
// Hono handles new endpoints in parallel with Express for higher throughput.
// Auth, CORS, and telemetry context set by Express middleware is forwarded
// into Hono via the adapter. If Hono returns a 404 (no matching route),
// the request falls through to the next Express handler.
// New endpoints should be defined in src/hono/index.ts using @hono/zod-openapi
// which auto-generates an OpenAPI 3.1 spec from route definitions.
const _honoApp = createHonoApp();
const _honoHandler = createHonoExpressHandler(_honoApp);
app.use(_honoHandler);

app.use(globalAuthEnforcer);
app.use(meshCallLogger());
app.use('/api', router);

// /nexus/* is now served by A11oy (artifacts/a11oy) via the shared proxy — no static fallback needed here.

let _graphqlHandler:
  | ((req: Request, res: Response, next: import('express').NextFunction) => void)
  | null = null;

export function registerGraphQLHandler(
  handler: (req: Request, res: Response, next: import('express').NextFunction) => void,
): void {
  _graphqlHandler = handler;
}

app.use('/api/graphql', (req: Request, res: Response, next: import('express').NextFunction) => {
  if (_graphqlHandler) {
    _graphqlHandler(req, res, next);
  } else {
    sendError(res, 'GraphQL is still initializing', 503, 'SERVICE_UNAVAILABLE');
  }
});

Sentry.setupExpressErrorHandler(app);

app.use((_req: Request, res: Response) => {
  sendNotFound(res, 'The requested resource');
});

interface HttpError extends Error {
  statusCode?: number;
  code?: string;
}

function isHttpError(err: Error): err is HttpError {
  return typeof (err as HttpError).statusCode === 'number';
}

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode = isHttpError(err) ? (err.statusCode ?? 500) : 500;
  const isServerError = statusCode >= 500;

  if (isServerError) {
    logger.error({ err, statusCode }, 'Unhandled server error');
    // NOTE: Sentry.setupExpressErrorHandler (above) is the primary Sentry capture
    // mechanism for errors that propagate through this handler. captureServerException
    // is reserved for explicit use inside route try/catch blocks where an error is
    // caught and handled without re-throwing — see docs/observability/request-tracing-runbook.md.
  } else {
    logger.warn({ err, statusCode }, 'Client error');
  }

  const typedCode = isHttpError(err) ? err.code : undefined;
  const isTypedServiceError = typeof typedCode === 'string' && typedCode !== 'INTERNAL_ERROR';

  const errorMessage = isTypedServiceError
    ? err.message
    : isServerError
      ? 'Internal Server Error'
      : err.message;
  const errorCode = isTypedServiceError
    ? typedCode
    : isServerError
      ? 'INTERNAL_ERROR'
      : 'CLIENT_ERROR';
  sendError(res, errorMessage, statusCode, errorCode);
});

export default app;
