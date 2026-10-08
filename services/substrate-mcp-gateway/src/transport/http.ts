/**
 * Substrate MCP Gateway — HTTP Transport (SDK-Based)
 *
 * Implements both:
 *   - Streamable HTTP transport (MCP 2025 spec) — POST /mcp (stateful session)
 *   - Legacy SSE transport (MCP 2024-11-05) — GET /mcp/sse + POST /mcp/message
 *
 * Both transports share the same PRAXISMcpServer instance (same tool surface,
 * same governance layer). The SDK handles session isolation internally.
 *
 * REST convenience endpoints (/health, /tools, /resources, /prompts) are
 * preserved so existing monitoring infrastructure continues to work.
 *
 * OAuth 2.1 + PKCE endpoints (/authorize, /token, /register) are preserved
 * for MCP clients that require dynamic client registration.
 */

import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  InitializeRequestSchema,
  LATEST_PROTOCOL_VERSION,
  SUPPORTED_PROTOCOL_VERSIONS,
} from '@modelcontextprotocol/sdk/types.js';
import { runtimeEventBus, type SubstrateRuntimeEvent } from '@szl/substrate';
import express, { type NextFunction, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import { authMiddleware, type GatewayAuthContext, resolveAuthContext } from '../auth.js';
import {
  CAPABILITIES,
  SERVER_INFO,
  SUBSTRATE_PROMPTS,
  SUBSTRATE_RESOURCES,
  SUBSTRATE_TOOLS,
} from '../descriptor.js';
import {
  type EnterpriseIdpConfig,
  getEnterpriseIdpByIssuer,
  getRevocationSyncReadiness,
  handleRevocationWebhook,
  issueEnterpriseToken,
  linkOrProvisionUser,
  listEnterpriseIdps,
  type RevocationWebhookPayload,
  registerEnterpriseIdp,
  unregisterEnterpriseIdp,
  validateIdJag,
} from '../enterprise-auth.js';
import { getAvailableTools } from '../handlers.js';
import {
  getNexusRuntimeCapabilities,
  getProofCapabilityStatus,
  getRecentProofs,
  lookupProof,
} from '../nexus-fabric.js';
import { createGatewayServer } from '../nexus-gateway-server.js';
import { issueLocalOAuthToken, revokeLocalOAuthTokensForActor } from '../oauth-token-store.js';
import {
  actorIdToTenantId,
  getCurrentTenantId,
  runWithRequestContext,
} from '../request-context.js';
import { type RunLifecycleEvent, runEventBus } from '../run-events.js';
import { getRunTenantId } from '../run-store.js';
import { getExecutionCapabilityStatus, isProductionRuntime } from '../runtime-config.js';
import { getEnterpriseAccessRequirement, type ToolAccessRequirement } from '../tool-access.js';

export { getEnterpriseAccessRequirement } from '../tool-access.js';

// ─── Security ─────────────────────────────────────────────────────────────────

function isProd(): boolean {
  return isProductionRuntime();
}

function enterpriseScopeAllows(scope: string, requirement: ToolAccessRequirement): boolean {
  const grants = new Set(
    scope
      .split(/\s+/)
      .map((entry) => entry.trim())
      .filter(Boolean),
  );
  if (grants.has('mcp:admin')) return true;
  if (requirement === 'admin') return false;
  if (requirement === 'approve') return grants.has('mcp:approve');
  if (requirement === 'write') return grants.has('mcp:write');
  return grants.has('mcp:read');
}

function scopeContainsEveryGrant(scope: string, requestedGrants: readonly string[]): boolean {
  const grants = new Set(
    scope
      .split(/\s+/)
      .map((entry) => entry.trim())
      .filter(Boolean),
  );
  return grants.has('mcp:admin') || requestedGrants.every((grant) => grants.has(grant));
}

function requestContextFromAuth(authContext: GatewayAuthContext | undefined): {
  actorId: string;
  tenantId: string;
} {
  const actorId = authContext?.actorId ?? 'anonymous';
  return {
    actorId,
    tenantId: authContext?.tenantId ?? actorIdToTenantId(actorId),
  };
}

function getAllowedOrigins(): Set<string> {
  const raw = process.env.MCP_ALLOWED_ORIGINS ?? '';
  const set = new Set<string>();
  if (raw) {
    for (const o of raw.split(',')) {
      const t = o.trim();
      if (t) set.add(t);
    }
  }
  if (!isProd()) {
    set.add('http://localhost');
    set.add('http://127.0.0.1');
    set.add('null');
  }
  return set;
}

function isOriginAllowed(origin: string | undefined): boolean {
  if (!isProd()) return true;
  if (!origin) return false;
  const allowed = getAllowedOrigins();
  if (allowed.has(origin)) return true;
  try {
    const url = new URL(origin);
    return allowed.has(url.origin) || url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

// Resolve the response's Access-Control-Allow-Origin to an exact, pre-configured
// allowlist entry (never the raw request header) so it can't be attacker-tainted
// (CWE-346) — a prerequisite for safely combining it with Allow-Credentials: true.
function resolveAllowedOrigin(origin: string | undefined): string | undefined {
  if (!origin || !isOriginAllowed(origin)) return undefined;
  // Exact match → echo the trusted allowlist entry (a constant), never the raw
  // request header, so nothing attacker-controlled reaches Access-Control-Allow-Origin.
  for (const allowed of getAllowedOrigins()) {
    if (allowed === origin) return allowed;
  }
  // Non-production convenience: accept any localhost / 127.0.0.1 dev origin. The
  // returned value is rebuilt from a literal scheme/host plus a numerically-laundered
  // port, so it carries no attacker-controlled substring (keeps the CWE-346 barrier).
  if (!isProd()) {
    try {
      const url = new URL(origin);
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        const scheme = url.protocol === 'https:' ? 'https' : 'http';
        const host = url.hostname === 'localhost' ? 'localhost' : '127.0.0.1';
        const portNum = Number(url.port);
        const port =
          Number.isInteger(portNum) && portNum > 0 && portNum <= 65535 ? `:${portNum}` : '';
        return `${scheme}://${host}${port}`;
      }
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  if (isProd()) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
}

function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers.origin;
  const allowedOrigin = resolveAllowedOrigin(origin);
  // Credentialed CORS is only granted to a resolved, trusted origin (never the raw
  // request header) so Access-Control-Allow-Origin can't be attacker-tainted (CWE-346).
  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  // These headers carry no credential/origin trust, so it is safe — and required for
  // preflight discovery — to advertise them regardless of origin resolution.
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, MCP-Session-Id, Last-Event-ID, Accept',
  );
  res.setHeader('Access-Control-Expose-Headers', 'MCP-Session-Id');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
}

function originValidation(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers.origin;
  if (origin === undefined) {
    next();
    return;
  }
  if (!isOriginAllowed(origin)) {
    res.status(403).json({ error: 'FORBIDDEN', reason: 'Origin not allowed' });
    return;
  }
  next();
}

// ─── Rate Limiting ────────────────────────────────────────────────────────────

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = parseInt(process.env.MCP_RATE_LIMIT ?? '200', 10);

interface RateLimitEntry {
  count: number;
  windowStart: number;
}
const rateLimitMap = new Map<string, RateLimitEntry>();

function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const key = (req.ip ?? req.socket?.remoteAddress ?? 'unknown') as string;
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(key, { count: 1, windowStart: now });
    next();
    return;
  }
  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) {
    res.setHeader('Retry-After', '60');
    res
      .status(429)
      .json({ error: 'RATE_LIMITED', reason: 'Too many requests. Retry after 60 seconds.' });
    return;
  }
  next();
}

// ─── Extension Negotiation ────────────────────────────────────────────────────

const SERVER_EXTENSIONS = (CAPABILITIES as unknown as Record<string, unknown>).extensions as Record<
  string,
  unknown
>;

function negotiateExtensions(clientExtensions: unknown): Record<string, unknown> {
  if (!clientExtensions || typeof clientExtensions !== 'object') return {};
  const accepted: Record<string, unknown> = {};
  for (const key of Object.keys(clientExtensions as Record<string, unknown>)) {
    if (key in SERVER_EXTENSIONS) {
      accepted[key] = SERVER_EXTENSIONS[key];
    }
  }
  return accepted;
}

// ─── OAuth 2.1 + PKCE ─────────────────────────────────────────────────────────

interface OAuthClient {
  clientId: string;
  ownerKey: string;
  redirectUris: string[];
  grantTypes: string[];
  responseTypes: string[];
  clientName?: string;
  scope?: string;
  registeredAt: number;
  expiresAt: number;
}

interface AuthorizationCode {
  code: string;
  clientId: string;
  redirectUri: string;
  scope: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  expiresAt: number;
  used: boolean;
  actorId: string;
  tenantId: string;
}

const oauthClients = new Map<string, OAuthClient>();
const authCodes = new Map<string, AuthorizationCode>();

const OAUTH_CLIENT_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_OAUTH_CLIENTS = 512;
const MAX_OAUTH_CLIENTS_PER_PRINCIPAL = 16;
const MAX_OAUTH_REDIRECT_URIS = 10;
const MAX_OAUTH_REDIRECT_URI_LENGTH = 2_048;
const MAX_OAUTH_CLIENT_NAME_LENGTH = 128;
const MAX_OAUTH_SCOPE_LENGTH = 512;

interface OAuthClientRegistryPrincipal {
  actorId: string;
  tenantId?: string;
}

function oauthClientOwnerKey(principal: OAuthClientRegistryPrincipal): string {
  return JSON.stringify([principal.tenantId ?? '', principal.actorId]);
}

function pruneExpiredOAuthClients(now = Date.now()): void {
  for (const [clientId, client] of oauthClients) {
    if (client.expiresAt <= now) oauthClients.delete(clientId);
  }
}

function countOAuthClientsForOwner(ownerKey: string): number {
  let count = 0;
  for (const client of oauthClients.values()) {
    if (client.ownerKey === ownerKey) count++;
  }
  return count;
}

function isValidOAuthRedirectUri(value: unknown): value is string {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > MAX_OAUTH_REDIRECT_URI_LENGTH
  ) {
    return false;
  }
  try {
    const parsed = new URL(value);
    return parsed.protocol.length > 1 && parsed.hash === '' && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}

/**
 * Bounded registry diagnostics. Supplying `now` also performs the same expiry
 * sweep used by registration and authorization; this keeps deterministic
 * expiry behavior directly testable without exposing client metadata.
 */
export function getOAuthClientRegistryStats(
  principal?: OAuthClientRegistryPrincipal,
  now = Date.now(),
): {
  activeClients: number;
  activeForPrincipal: number | null;
  maxClients: number;
  maxClientsPerPrincipal: number;
  ttlMs: number;
} {
  pruneExpiredOAuthClients(now);
  return {
    activeClients: oauthClients.size,
    activeForPrincipal: principal
      ? countOAuthClientsForOwner(oauthClientOwnerKey(principal))
      : null,
    maxClients: MAX_OAUTH_CLIENTS,
    maxClientsPerPrincipal: MAX_OAUTH_CLIENTS_PER_PRINCIPAL,
    ttlMs: OAUTH_CLIENT_TTL_MS,
  };
}

function revokeAuthorizationCodesForActor(actorId: string): number {
  let revoked = 0;
  for (const [code, authCode] of authCodes) {
    if (authCode.actorId !== actorId) continue;
    authCodes.delete(code);
    revoked++;
  }
  return revoked;
}
function sha256Base64Url(input: string): string {
  return createHash('sha256').update(input).digest('base64url');
}

// ─── Session Registries (SDK-managed) ────────────────────────────────────────

interface SessionOwner {
  actorId: string;
  tenantId: string;
}

interface OwnedSession<T> extends SessionOwner {
  transport: T;
  eventStreams: Set<Response>;
}

// Legacy SSE transport (MCP 2024-11-05)
const sseSessions = new Map<string, OwnedSession<SSEServerTransport>>();

// Streamable HTTP transport (MCP 2025 spec)
const streamableSessions = new Map<string, OwnedSession<StreamableHTTPServerTransport>>();

function sessionOwner(req: Request): SessionOwner {
  const authContext = (req as Request & { authCtx?: GatewayAuthContext }).authCtx;
  return requestContextFromAuth(authContext);
}

function isSessionOwner(session: SessionOwner, requestOwner: SessionOwner): boolean {
  return session.tenantId === requestOwner.tenantId && session.actorId === requestOwner.actorId;
}

function sendSessionNotFound(res: Response, jsonRpcId?: string | number | null): void {
  if (jsonRpcId !== undefined) {
    res.status(404).json({
      jsonrpc: '2.0',
      id: jsonRpcId,
      error: {
        code: -32001,
        message: 'Session not found',
        data: { reason: 'Session terminated, unknown, or unavailable to this principal.' },
      },
    });
    return;
  }
  res.status(404).json({ error: 'SESSION_NOT_FOUND', reason: 'Session not found' });
}

function closeSessionsForActor(actorId: string): void {
  for (const [sessionId, session] of sseSessions) {
    if (session.actorId !== actorId) continue;
    sseSessions.delete(sessionId);
    void session.transport.close();
  }
  for (const [sessionId, session] of streamableSessions) {
    if (session.actorId !== actorId) continue;
    streamableSessions.delete(sessionId);
    for (const response of session.eventStreams) response.end();
    session.eventStreams.clear();
    void session.transport.close();
  }
}

function eventTenantId(event: { tenantId?: string; runId?: string }): string | undefined {
  return (
    event.tenantId ??
    (event.runId ? getRunTenantId(event.runId) : undefined) ??
    getCurrentTenantId()
  );
}

function subscribeTenantEvents(
  tenantId: string,
  writeEvent: (eventName: string, data: unknown) => void,
): () => void {
  const unsubscribeRun = runEventBus.subscribe((event: RunLifecycleEvent) => {
    if (event.type === 'tool_list_changed') {
      writeEvent(event.type, event);
      return;
    }
    if (eventTenantId(event) !== tenantId) return;
    writeEvent(event.type, event);
    if (event.type === 'stage_complete') writeEvent('stage:complete', event);
    else if (event.type === 'run_started') {
      writeEvent('run:start', event);
      writeEvent('stage:start', event);
    } else if (event.type === 'run_complete') writeEvent('run:complete', event);
    else if (event.type === 'run_failed') writeEvent('run:failed', event);
  });
  const unsubscribeRuntime = runtimeEventBus.subscribe((event: SubstrateRuntimeEvent) => {
    if (eventTenantId(event) === tenantId) writeEvent(event.type, event);
  });
  return () => {
    unsubscribeRun();
    unsubscribeRuntime();
  };
}

// ─── Streamable GET helper ────────────────────────────────────────────────────
//
// Called from the GET / index route when MCP-Session-Id is present, routing to
// the correct Streamable transport for server-initiated SSE frames.

function handleStreamableGet(req: Request, res: Response): void {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId) {
    res.status(400).json({ error: 'Mcp-Session-Id header required' });
    return;
  }
  const session = streamableSessions.get(sessionId);
  if (!session || !isSessionOwner(session, sessionOwner(req))) {
    sendSessionNotFound(res);
    return;
  }

  // MCP 2025-11-25 Streamable HTTP SSE listener. Bypass the SDK transport for
  // GET so we can emit `$/ready` + substrate run-lifecycle and runtime events
  // directly over the wire as named SSE frames.
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Mcp-Session-Id', sessionId);
  res.flushHeaders?.();
  session.eventStreams.add(res);

  const writeEvent = (eventName: string, data: unknown): void => {
    try {
      res.write(`event: ${eventName}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch {
      /* closed */
    }
  };

  writeEvent('$/ready', { sessionId, serverInfo: SERVER_INFO, timestamp: Date.now() });

  const keepAlive = setInterval(() => {
    try {
      res.write(`: keepalive ${Date.now()}\n\n`);
    } catch {
      /* closed */
    }
  }, 25_000);

  const unsubscribe = subscribeTenantEvents(session.tenantId, writeEvent);

  req.on('close', () => {
    clearInterval(keepAlive);
    unsubscribe();
    session.eventStreams.delete(res);
    try {
      res.end();
    } catch {
      /* already ended */
    }
  });
}

// ─── Express Router Factory ───────────────────────────────────────────────────

export function createHttpTransport(): express.Router {
  const router = express.Router();

  router.use(express.json({ limit: '4mb' }));
  router.use(securityHeaders);
  // Defense-in-depth: standard express-rate-limit (IP-scoped, applied first).
  // Tunables:
  //   MCP_GLOBAL_RATE_LIMIT_WINDOW_MS  default 60_000 (1 minute)
  //   MCP_GLOBAL_RATE_LIMIT_MAX        default 600 requests / window / IP
  router.use(
    rateLimit({
      windowMs: Number(process.env.MCP_GLOBAL_RATE_LIMIT_WINDOW_MS ?? 60_000),
      limit: Number(process.env.MCP_GLOBAL_RATE_LIMIT_MAX ?? 600),
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: {
        error: 'RATE_LIMITED',
        reason: 'Too many requests from this IP. Retry after the window resets.',
      },
    }),
  );
  router.use(corsMiddleware);
  router.use(originValidation);
  router.use(rateLimiter);
  router.use(authMiddleware);

  // ── Index (public) ────────────────────────────────────────────────────────
  router.get('/', (req: Request, res: Response) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (sessionId) {
      handleStreamableGet(req, res);
      return;
    }
    res.json({
      service: SERVER_INFO.name,
      version: SERVER_INFO.version,
      protocol: SERVER_INFO.protocolVersion,
      sdkVersion: '1.29.0',
      endpoints: {
        health: 'GET /mcp/health',
        tools: 'GET /mcp/tools',
        resources: 'GET /mcp/resources',
        prompts: 'GET /mcp/prompts',
        jsonrpc: 'POST /mcp (Streamable HTTP — MCP 2025)',
        sse: 'GET /mcp/sse (Legacy SSE — MCP 2024-11-05)',
        sseMessage: 'POST /mcp/message (Legacy SSE message endpoint)',
        authorize: 'POST /mcp/authorize',
        token: 'POST /mcp/token',
        register: 'POST /mcp/register',
        revoke: 'POST /mcp/revoke (Enterprise revocation webhook)',
        enterpriseIdps: 'GET /mcp/enterprise/idps',
        metadata: 'GET /.well-known/oauth-authorization-server',
      },
    });
  });

  // ── Health ────────────────────────────────────────────────────────────────
  router.get('/health', (_req, res) => {
    const liveTools = getAvailableTools();
    const revocationSync = getRevocationSyncReadiness();
    const execution = getExecutionCapabilityStatus();
    const ready = revocationSync.ready && execution.ready;
    res.status(ready ? 200 : 503).json({
      status: ready ? 'ok' : 'degraded',
      service: SERVER_INFO.name,
      version: SERVER_INFO.version,
      protocol: SERVER_INFO.protocolVersion,
      sdkVersion: '1.29.0',
      capabilities: CAPABILITIES,
      toolCount: liveTools.length,
      resourceCount: SUBSTRATE_RESOURCES.length,
      promptCount: SUBSTRATE_PROMPTS.length,
      activeSseConnections: sseSessions.size,
      activeStreamableSessions: streamableSessions.size,
      optionalCapabilities: getNexusRuntimeCapabilities(),
      revocationSync,
      execution,
      timestamp: new Date().toISOString(),
    });
  });

  // ── Tool inventory ────────────────────────────────────────────────────────
  router.get('/tools', (_req, res) => {
    res.json({ tools: getAvailableTools() });
  });

  // ── Resource inventory ────────────────────────────────────────────────────
  router.get('/resources', (_req, res) => {
    res.json({ resources: SUBSTRATE_RESOURCES });
  });

  // ── Prompt inventory ──────────────────────────────────────────────────────
  router.get('/prompts', (_req, res) => {
    res.json({ prompts: SUBSTRATE_PROMPTS });
  });

  // ── Legacy SSE stream (MCP 2024-11-05) ───────────────────────────────────
  //
  // The SSEServerTransport creates a persistent SSE connection over GET /mcp/sse.
  // Clients send messages back via POST /mcp/message?sessionId=<id>.

  router.get('/sse', async (req: Request, res: Response) => {
    const owner = sessionOwner(req);
    const transport = new SSEServerTransport('/mcp/message', res);
    const sessionId = transport.sessionId;

    // The SDK owns the MCP endpoint/message frames. Additional lifecycle frames
    // are written to the same stream only after the transport is connected.
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('X-Session-Id', sessionId);
    res.setHeader('Mcp-Session-Id', sessionId);
    // CORS for SSE — required for browser EventSource consumers.
    const reqOrigin = req.headers.origin;
    const allowedOrigin = resolveAllowedOrigin(reqOrigin as string | undefined);
    if (allowedOrigin) {
      res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    const writeEvent = (eventName: string, data: unknown): void => {
      try {
        res.write(`event: ${eventName}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch {
        /* connection closed mid-write */
      }
    };

    let unsubscribe = (): void => {};
    let keepAlive: NodeJS.Timeout | undefined;
    const cleanup = (): void => {
      if (keepAlive) clearInterval(keepAlive);
      unsubscribe();
      sseSessions.delete(sessionId);
    };

    transport.onclose = cleanup;
    sseSessions.set(sessionId, { transport, eventStreams: new Set(), ...owner });

    try {
      const sessionServer = createGatewayServer();
      await runWithRequestContext(owner, () => sessionServer.connect(transport));
    } catch {
      cleanup();
      if (!res.headersSent) {
        res.status(500).json({ error: 'SSE_TRANSPORT_FAILED' });
      } else {
        res.end();
      }
      return;
    }

    writeEvent('$/ready', { sessionId, serverInfo: SERVER_INFO, timestamp: Date.now() });

    // Keep-alive ping every 25s to defeat intermediary buffers.
    keepAlive = setInterval(() => {
      try {
        res.write(`: keepalive ${Date.now()}\n\n`);
      } catch {
        /* socket closed */
      }
    }, 25_000);

    unsubscribe = subscribeTenantEvents(owner.tenantId, writeEvent);

    req.on('close', () => {
      cleanup();
    });
  });

  // ── Legacy SSE message endpoint ───────────────────────────────────────────
  //
  // Clients connected via GET /mcp/sse POST their JSON-RPC messages here.

  router.post('/message', async (req: Request, res: Response) => {
    const sessionId = String(req.query['sessionId'] ?? '');
    const session = sseSessions.get(sessionId);

    if (!session || !isSessionOwner(session, sessionOwner(req))) {
      sendSessionNotFound(
        res,
        (req.body as { id?: string | number | null } | undefined)?.id ?? null,
      );
      return;
    }

    // Wire per-request tenant context from the authenticated actor so that
    // resource and tool handlers can enforce tenant-scoped signal delivery.
    await runWithRequestContext(session, () =>
      session.transport.handlePostMessage(req, res, req.body),
    );
  });

  // ── POST /mcp — Streamable HTTP JSON-RPC ──────────────────────────────────
  //
  // A single POST endpoint handles all MCP 2025 traffic. The SDK creates a new
  // StreamableHTTPServerTransport per session (identified by Mcp-Session-Id).

  router.post('/', async (req: Request, res: Response) => {
    // Wire per-request tenant context from the authenticated actor identity.
    const postAuthCtx = (req as Request & { authCtx?: GatewayAuthContext }).authCtx;
    const reqCtx = requestContextFromAuth(postAuthCtx);

    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    // Enforce enterprise token scope on tool calls
    // Enterprise tokens carry a scope string (e.g. "mcp:read", "mcp:read mcp:write").
    // Require at minimum mcp:read for tool/resource access; return 403 if scope is empty.
    const mcpBody = req.body as { method?: string; params?: Record<string, unknown> } | undefined;
    const requestedMethod = mcpBody?.method;
    {
      const authCtx = resolveAuthContext(req);
      if (authCtx.enterprise || authCtx.oauth) {
        const scope = authCtx.enterpriseScope ?? '';
        const requirement = getEnterpriseAccessRequirement(
          typeof requestedMethod === 'string' ? requestedMethod : '',
          mcpBody?.params,
        );
        if (!enterpriseScopeAllows(scope, requirement)) {
          const requiredScope = `mcp:${requirement}`;
          res.status(403).json({
            jsonrpc: '2.0',
            id: null,
            error: {
              code: -32000,
              message: 'FORBIDDEN',
              data: {
                reason: `Enterprise token scope does not permit this MCP operation. Required scope: ${requiredScope}`,
              },
            },
          });
          return;
        }
      }
    }

    if (sessionId) {
      const session = streamableSessions.get(sessionId);
      if (!session || !isSessionOwner(session, reqCtx)) {
        sendSessionNotFound(
          res,
          (req.body as { id?: string | number | null } | undefined)?.id ?? null,
        );
        return;
      }
      await runWithRequestContext(session, () =>
        session.transport.handleRequest(req, res, req.body),
      );
      return;
    }

    // New session — create a fresh transport and a fresh per-session server.
    // The MCP SDK's Protocol.connect() throws "Already connected to a transport"
    // when called a second time on the same McpServer instance. Using a factory
    // that builds a new PRAXISMcpServer per session prevents that error while
    // keeping the singleton alive for SSE list-changed bridge notifications.
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (id: string) => {
        streamableSessions.set(id, { transport, eventStreams: new Set(), ...reqCtx });
      },
    });

    transport.onclose = () => {
      if (transport.sessionId) {
        streamableSessions.delete(transport.sessionId);
      }
      // sessionServer is GC'd naturally — do NOT call sessionServer.close() here
      // because the SDK's close() calls transport.close() which calls onclose again
      // → infinite recursion and stack overflow.
    };

    const sessionServer = createGatewayServer();

    // Extension negotiation: the MCP SDK's default initialize handler returns
    // { protocolVersion, capabilities, serverInfo, instructions? } but ignores
    // client-supplied `extensions`. Override the InitializeRequestSchema handler
    // BEFORE connecting the transport so it intersects client-requested with
    // server-supported extensions and includes them in the response.
    {
      // PRAXISMcpServer.sdk → McpServer; McpServer.server → low-level Server
      // that owns setRequestHandler / _oninitialize. Reach in and override the
      // initialize handler so it includes negotiated `extensions` in the result.
      //
      // We read extensions from `req.body` directly because the SDK's zod
      // parser strips top-level `extensions` (it is only defined inside
      // ClientCapabilitiesSchema). Reading from `req.body` lets us accept
      // BOTH `params.extensions` (top-level, used by some clients) and the
      // canonical `params.capabilities.extensions`.
      const rawInit = req.body as
        | {
            method?: string;
            params?: { extensions?: unknown; capabilities?: { extensions?: unknown } };
          }
        | undefined;
      const clientExtensions =
        rawInit?.params?.extensions ?? rawInit?.params?.capabilities?.extensions;
      const sdkServer = (sessionServer as unknown as { sdk: { server: unknown } }).sdk.server;
      const serverAny = sdkServer as unknown as {
        setRequestHandler: (
          schema: typeof InitializeRequestSchema,
          handler: (request: unknown) => Promise<Record<string, unknown>>,
        ) => void;
        _clientCapabilities?: unknown;
        _clientVersion?: unknown;
        _serverInfo: unknown;
        _instructions?: string;
        getCapabilities: () => unknown;
      };
      serverAny.setRequestHandler(InitializeRequestSchema, async (rawRequest) => {
        const request = rawRequest as {
          params: { protocolVersion: string; capabilities?: unknown; clientInfo?: unknown };
        };
        const requestedVersion = request.params.protocolVersion;
        serverAny._clientCapabilities = request.params.capabilities;
        serverAny._clientVersion = request.params.clientInfo;
        const protocolVersion = SUPPORTED_PROTOCOL_VERSIONS.includes(requestedVersion as never)
          ? requestedVersion
          : LATEST_PROTOCOL_VERSION;
        const negotiated = negotiateExtensions(clientExtensions);
        return {
          protocolVersion,
          capabilities: serverAny.getCapabilities(),
          serverInfo: serverAny._serverInfo,
          extensions: negotiated,
          ...(serverAny._instructions ? { instructions: serverAny._instructions } : {}),
        };
      });
    }

    await sessionServer.connect(transport);

    await runWithRequestContext(reqCtx, () => transport.handleRequest(req, res, req.body));
  });

  // ── GET /mcp/stream — SSE listener for active Streamable sessions ─────────

  router.get('/stream', async (req: Request, res: Response) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId) {
      res.status(400).json({ error: 'Mcp-Session-Id header required' });
      return;
    }
    const session = streamableSessions.get(sessionId);
    if (!session || !isSessionOwner(session, sessionOwner(req))) {
      sendSessionNotFound(res);
      return;
    }
    await runWithRequestContext(session, () => session.transport.handleRequest(req, res));
  });

  // ── DELETE /mcp — Streamable session termination ──────────────────────────

  router.delete('/', (req: Request, res: Response) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId) {
      res
        .status(400)
        .json({ error: 'INVALID_REQUEST', reason: 'MCP-Session-Id header required for DELETE' });
      return;
    }
    const session = streamableSessions.get(sessionId);
    if (!session || !isSessionOwner(session, sessionOwner(req))) {
      sendSessionNotFound(res);
      return;
    }
    streamableSessions.delete(sessionId);
    void session.transport.close();
    res.status(200).json({ ok: true, sessionId, terminated: true });
  });

  // ── OAuth 2.1 + PKCE endpoints ────────────────────────────────────────────

  // POST /mcp/authorize — issue an authorization code
  router.post('/authorize', (req: Request, res: Response) => {
    const body = req.body as Record<string, unknown>;
    const {
      client_id,
      redirect_uri,
      response_type,
      scope,
      code_challenge,
      code_challenge_method,
      state,
    } = body;

    if (!client_id || !redirect_uri || response_type !== 'code' || !code_challenge) {
      res.status(400).json({
        error: 'invalid_request',
        error_description:
          'Missing required parameters: client_id, redirect_uri, response_type=code, code_challenge',
      });
      return;
    }

    pruneExpiredOAuthClients();
    const client = oauthClients.get(String(client_id));
    if (!client) {
      res.status(400).json({ error: 'invalid_client', error_description: 'Unknown client_id' });
      return;
    }

    if (code_challenge_method !== 'S256') {
      res.status(400).json({
        error: 'invalid_request',
        error_description: 'code_challenge_method must be S256',
      });
      return;
    }

    const authorizingPrincipal = resolveAuthContext(req);
    if (!authorizingPrincipal.authenticated || !authorizingPrincipal.tenantId) {
      res.status(403).json({
        error: 'access_denied',
        error_description: 'An authenticated tenant principal is required',
      });
      return;
    }

    const requestedScope =
      String(scope ?? 'mcp:read') === 'mcp' ? 'mcp:read' : String(scope ?? 'mcp:read');
    const requestedGrants = requestedScope.split(/\s+/).filter(Boolean);
    const supportedGrants = new Set(['mcp:read', 'mcp:write', 'mcp:approve', 'mcp:admin']);
    if (
      requestedGrants.length === 0 ||
      requestedGrants.some((grant) => !supportedGrants.has(grant))
    ) {
      res.status(400).json({ error: 'invalid_scope' });
      return;
    }
    if (
      authorizingPrincipal.enterpriseScope !== undefined &&
      !scopeContainsEveryGrant(authorizingPrincipal.enterpriseScope, requestedGrants)
    ) {
      res.status(400).json({ error: 'invalid_scope' });
      return;
    }

    const redirectUriStr = String(redirect_uri);
    if (!client.redirectUris.includes(redirectUriStr)) {
      res
        .status(400)
        .json({ error: 'invalid_request', error_description: 'redirect_uri mismatch' });
      return;
    }

    const code = randomBytes(32).toString('base64url');
    const authCode: AuthorizationCode = {
      code,
      clientId: String(client_id),
      redirectUri: redirectUriStr,
      scope: requestedScope,
      codeChallenge: String(code_challenge),
      codeChallengeMethod: 'S256',
      expiresAt: Date.now() + 5 * 60 * 1000,
      used: false,
      actorId: authorizingPrincipal.actorId,
      tenantId: authorizingPrincipal.tenantId,
    };
    authCodes.set(code, authCode);

    const redirectUrl = new URL(redirectUriStr);
    redirectUrl.searchParams.set('code', code);
    if (state) redirectUrl.searchParams.set('state', String(state));

    res.status(302).setHeader('Location', redirectUrl.toString()).end();
  });

  // POST /mcp/token — exchange code or ID-JAG assertion for access token
  router.post('/token', async (req: Request, res: Response) => {
    const body = req.body as Record<string, unknown>;
    const { grant_type } = body;
    if (
      grant_type !== 'authorization_code' &&
      grant_type !== 'urn:ietf:params:oauth:grant-type:jwt-bearer'
    ) {
      res.status(400).json({ error: 'unsupported_grant_type' });
      return;
    }

    // ── ID-JAG grant: urn:ietf:params:oauth:grant-type:jwt-bearer ────────────
    if (grant_type === 'urn:ietf:params:oauth:grant-type:jwt-bearer') {
      const assertion = body.assertion as string | undefined;
      if (!assertion || typeof assertion !== 'string') {
        res.status(400).json({
          error: 'invalid_request',
          error_description: 'assertion parameter is required for jwt-bearer grant type',
        });
        return;
      }

      const validation = await validateIdJag(assertion, req.ip ?? undefined);
      if (!validation.valid) {
        const statusCode = validation.errorCode === 'server_error' ? 500 : 400;
        res.status(statusCode).json({
          error: validation.errorCode ?? 'invalid_grant',
          error_description: validation.error ?? 'ID-JAG assertion validation failed',
        });
        return;
      }

      // Account linking / auto-provisioning — AUTHORITATIVE for token issuance.
      // A resolved platform user identity is required before an enterprise token is issued.
      // If no linked user exists and autoProvisionUsers is disabled, the request is denied
      // with an OAuth-compliant access_denied error so the IdP can surface a clear message.
      if (validation.issuer && validation.subject) {
        const idp = getEnterpriseIdpByIssuer(validation.issuer);
        if (idp) {
          const platformUserId = await linkOrProvisionUser(
            idp,
            validation.subject,
            validation.email,
            validation.mappedRole ?? idp.defaultRole,
            req.ip ?? undefined,
          ).catch(() => null);

          if (platformUserId === null) {
            res.status(400).json({
              error: 'access_denied',
              error_description: idp.autoProvisionUsers
                ? 'Enterprise user provisioning failed. Please retry or contact your administrator.'
                : 'No platform account is linked to this enterprise identity. Contact your administrator to have your account linked before accessing MCP.',
            });
            return;
          }
        }
      }

      const token = await issueEnterpriseToken(validation, req.ip ?? undefined);
      res.json({
        access_token: token.accessToken,
        token_type: token.tokenType,
        expires_in: token.expiresIn,
        scope: token.scope,
        issued_at: Math.floor(token.issuedAt / 1000),
        enterprise: true,
        mapped_role: token.mappedRole,
        subject: token.subject,
      });
      return;
    }

    // ── Standard authorization_code grant ────────────────────────────────────
    const { code, redirect_uri, code_verifier, client_id } = body;

    if (grant_type !== 'authorization_code') {
      res.status(400).json({ error: 'unsupported_grant_type' });
      return;
    }

    pruneExpiredOAuthClients();
    const client = oauthClients.get(String(client_id ?? ''));
    if (!client) {
      res.status(400).json({ error: 'invalid_client' });
      return;
    }

    const authCode = authCodes.get(String(code ?? ''));
    if (!authCode || authCode.used || Date.now() > authCode.expiresAt) {
      res.status(400).json({
        error: 'invalid_grant',
        error_description: 'Authorization code invalid or expired',
      });
      return;
    }

    if (authCode.clientId !== String(client_id ?? '')) {
      res.status(400).json({ error: 'invalid_client' });
      return;
    }

    if (authCode.redirectUri !== String(redirect_uri ?? '')) {
      res.status(400).json({ error: 'invalid_grant', error_description: 'redirect_uri mismatch' });
      return;
    }

    if (authCode.codeChallengeMethod !== 'S256') {
      res
        .status(400)
        .json({ error: 'invalid_grant', error_description: 'Unsupported PKCE method' });
      return;
    }
    const computed = sha256Base64Url(String(code_verifier ?? ''));
    if (computed !== authCode.codeChallenge) {
      res.status(400).json({ error: 'invalid_grant', error_description: 'code_verifier mismatch' });
      return;
    }

    authCode.used = true;

    const token = issueLocalOAuthToken({
      actorId: authCode.actorId,
      tenantId: authCode.tenantId,
      scope: authCode.scope,
    });

    res.json({
      access_token: token.accessToken,
      token_type: token.tokenType,
      expires_in: token.expiresIn,
      scope: token.scope,
    });
  });

  // POST /mcp/revoke — Enterprise revocation webhook
  // Enterprise IdPs call this endpoint to immediately invalidate all MCP access
  // tokens for a given subject (employee who was deprovisioned / had access revoked).
  // Protected by a shared secret (MCP_REVOCATION_WEBHOOK_SECRET env var).
  router.post('/revoke', async (req: Request, res: Response) => {
    const secret = process.env.MCP_REVOCATION_WEBHOOK_SECRET;
    if (!secret) {
      res.status(503).json({
        error: 'revocation_disabled',
        error_description:
          'MCP_REVOCATION_WEBHOOK_SECRET is not configured — revocation webhook is disabled',
      });
      return;
    }
    const providedSecret = req.headers['x-revocation-secret'] as string | undefined;
    if (!providedSecret) {
      res
        .status(401)
        .json({ error: 'unauthorized', error_description: 'x-revocation-secret header required' });
      return;
    }
    const { timingSafeEqual, createHash: ch } = await import('node:crypto');
    const expected = ch('sha256').update(secret).digest();
    const provided = ch('sha256').update(providedSecret).digest();
    if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
      res
        .status(401)
        .json({ error: 'unauthorized', error_description: 'Invalid revocation secret' });
      return;
    }

    const body = req.body as Partial<RevocationWebhookPayload>;
    if (!body.issuer || !body.subject) {
      res.status(400).json({
        error: 'invalid_request',
        error_description: 'issuer and subject are required',
      });
      return;
    }

    let result: { revoked: number };
    try {
      result = await handleRevocationWebhook(
        {
          issuer: body.issuer,
          subject: body.subject,
          reason: body.reason,
          revokedBy: body.revokedBy,
        },
        req.ip ?? undefined,
      );
    } catch {
      res.status(503).json({
        error: 'revocation_persistence_unavailable',
        error_description:
          'Revocation was applied locally but could not be durably synchronized. Retry the request.',
      });
      return;
    } finally {
      const revokedActor = `enterprise:${body.issuer}:${body.subject}`;
      revokeAuthorizationCodesForActor(revokedActor);
      revokeLocalOAuthTokensForActor(revokedActor);
      closeSessionsForActor(revokedActor);
      closeSessionsForActor(`oauth:${revokedActor}`);
    }

    res.json({
      ok: true,
      tokensRevoked: result.revoked,
      issuer: body.issuer,
      subject: body.subject,
    });
  });

  // GET /mcp/enterprise/idps — List registered enterprise IdP configurations
  // Admin endpoint — requires a gateway API key. Enterprise bearer tokens are rejected
  // to prevent privilege escalation (regular enterprise users must not access IdP config).
  router.get('/enterprise/idps', (req: Request, res: Response) => {
    const ctx = resolveAuthContext(req);
    if (!ctx.authenticated || ctx.enterprise || ctx.oauth) {
      res.status(401).json({
        error: 'unauthorized',
        error_description: 'Gateway API key required for admin IdP management',
      });
      return;
    }

    const idps = listEnterpriseIdps().map((idp) => ({
      id: idp.id,
      tenantId: idp.tenantId,
      name: idp.name,
      issuerUrl: idp.issuerUrl,
      jwksUri: idp.jwksUri,
      expectedAudience: idp.expectedAudience,
      autoProvisionUsers: idp.autoProvisionUsers,
      defaultRole: idp.defaultRole,
      enabled: idp.enabled,
      jwksCacheTtlSeconds: idp.jwksCacheTtlSeconds,
      requireEmailVerified: idp.requireEmailVerified,
    }));

    res.json({ idps, count: idps.length });
  });

  // POST /mcp/enterprise/idps — Register an enterprise IdP at runtime
  // Admin endpoint — requires a gateway API key. Enterprise bearer tokens are rejected.
  router.post('/enterprise/idps', (req: Request, res: Response) => {
    const ctx = resolveAuthContext(req);
    if (!ctx.authenticated || ctx.enterprise || ctx.oauth) {
      res.status(401).json({
        error: 'unauthorized',
        error_description: 'Gateway API key required for admin IdP management',
      });
      return;
    }

    const body = req.body as Partial<EnterpriseIdpConfig>;
    const { issuerUrl, jwksUri, expectedAudience, name } = body;
    if (!issuerUrl || !jwksUri || !expectedAudience || !name) {
      res.status(400).json({
        error: 'invalid_request',
        error_description: 'name, issuerUrl, jwksUri, and expectedAudience are required',
      });
      return;
    }

    const idpConfig: EnterpriseIdpConfig = {
      id: body.id ?? randomUUID(),
      tenantId: body.tenantId ?? 'unknown',
      name,
      issuerUrl,
      jwksUri,
      expectedAudience,
      claimsToRoleMapping: body.claimsToRoleMapping ?? {},
      autoProvisionUsers: body.autoProvisionUsers ?? false,
      defaultRole: body.defaultRole ?? 'viewer',
      enabled: body.enabled !== false,
      jwksCacheTtlSeconds: body.jwksCacheTtlSeconds ?? 3600,
      requireEmailVerified: body.requireEmailVerified !== false,
      notes: body.notes,
    };

    registerEnterpriseIdp(idpConfig);
    res.status(201).json({
      ok: true,
      idp: { id: idpConfig.id, name: idpConfig.name, issuerUrl: idpConfig.issuerUrl },
    });
  });

  // DELETE /mcp/enterprise/idps — Unregister an enterprise IdP from the gateway in-memory registry.
  // Called by the api-server when an IdP is deleted from DB so the gateway stops
  // trusting tokens from that issuer without requiring a full restart.
  // Admin endpoint — requires gateway API key.
  router.delete('/enterprise/idps', (req: Request, res: Response) => {
    const ctx = resolveAuthContext(req);
    if (!ctx.authenticated || ctx.enterprise || ctx.oauth) {
      res
        .status(401)
        .json({ error: 'unauthorized', error_description: 'Gateway API key required' });
      return;
    }
    const body = req.body as Record<string, unknown>;
    const issuerUrl = body.issuerUrl as string | undefined;
    if (!issuerUrl) {
      res
        .status(400)
        .json({ error: 'invalid_request', error_description: 'issuerUrl is required' });
      return;
    }
    unregisterEnterpriseIdp(issuerUrl);
    res.json({ ok: true, issuerUrl, unregistered: true });
  });

  // POST /mcp/register — RFC 7591 dynamic client registration
  router.post('/register', (req: Request, res: Response) => {
    const registrationPrincipal = (req as Request & { authCtx?: GatewayAuthContext }).authCtx;
    if (!registrationPrincipal?.authenticated) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const {
      client_name,
      redirect_uris,
      grant_types,
      response_types,
      scope,
      token_endpoint_auth_method,
    } = body;

    if (
      !Array.isArray(redirect_uris) ||
      redirect_uris.length === 0 ||
      redirect_uris.length > MAX_OAUTH_REDIRECT_URIS ||
      !redirect_uris.every(isValidOAuthRedirectUri)
    ) {
      res.status(400).json({
        error: 'invalid_client_metadata',
        error_description: `redirect_uris must contain 1-${MAX_OAUTH_REDIRECT_URIS} valid, fragment-free URIs no longer than ${MAX_OAUTH_REDIRECT_URI_LENGTH} characters`,
      });
      return;
    }

    if (
      grant_types !== undefined &&
      (!Array.isArray(grant_types) ||
        grant_types.length !== 1 ||
        grant_types[0] !== 'authorization_code')
    ) {
      res.status(400).json({
        error: 'invalid_client_metadata',
        error_description: 'Only grant_types=["authorization_code"] is supported',
      });
      return;
    }
    if (
      response_types !== undefined &&
      (!Array.isArray(response_types) ||
        response_types.length !== 1 ||
        response_types[0] !== 'code')
    ) {
      res.status(400).json({
        error: 'invalid_client_metadata',
        error_description: 'Only response_types=["code"] is supported',
      });
      return;
    }
    if (
      client_name !== undefined &&
      (typeof client_name !== 'string' || client_name.length > MAX_OAUTH_CLIENT_NAME_LENGTH)
    ) {
      res.status(400).json({
        error: 'invalid_client_metadata',
        error_description: `client_name must be at most ${MAX_OAUTH_CLIENT_NAME_LENGTH} characters`,
      });
      return;
    }
    if (
      scope !== undefined &&
      (typeof scope !== 'string' || scope.length > MAX_OAUTH_SCOPE_LENGTH)
    ) {
      res.status(400).json({
        error: 'invalid_client_metadata',
        error_description: `scope must be at most ${MAX_OAUTH_SCOPE_LENGTH} characters`,
      });
      return;
    }

    // This endpoint registers OAuth 2.1 public clients protected by S256 PKCE.
    // Confidential-client authentication is not implemented, so reject rather
    // than issue inert secrets or advertise unsupported authentication methods.
    if (token_endpoint_auth_method !== undefined && token_endpoint_auth_method !== 'none') {
      res.status(400).json({
        error: 'invalid_client_metadata',
        error_description: 'Only token_endpoint_auth_method=none is supported',
      });
      return;
    }

    pruneExpiredOAuthClients();
    const ownerKey = oauthClientOwnerKey(registrationPrincipal);
    if (
      oauthClients.size >= MAX_OAUTH_CLIENTS ||
      countOAuthClientsForOwner(ownerKey) >= MAX_OAUTH_CLIENTS_PER_PRINCIPAL
    ) {
      res.status(429).json({
        error: 'registration_limit_exceeded',
        error_description: 'Active OAuth client registration limit reached',
      });
      return;
    }

    const clientId = randomUUID();
    const registeredAt = Date.now();

    const client: OAuthClient = {
      clientId,
      ownerKey,
      redirectUris: [...new Set(redirect_uris)],
      grantTypes: Array.isArray(grant_types)
        ? (grant_types as string[]).map(String)
        : ['authorization_code'],
      responseTypes: Array.isArray(response_types)
        ? (response_types as string[]).map(String)
        : ['code'],
      clientName: client_name ? String(client_name) : undefined,
      scope: scope ? String(scope) : 'mcp',
      registeredAt,
      expiresAt: registeredAt + OAUTH_CLIENT_TTL_MS,
    };

    oauthClients.set(clientId, client);

    res.status(201).json({
      client_id: client.clientId,
      token_endpoint_auth_method: 'none',
      client_name: client.clientName,
      redirect_uris: client.redirectUris,
      grant_types: client.grantTypes,
      response_types: client.responseTypes,
      scope: client.scope,
      client_id_issued_at: Math.floor(client.registeredAt / 1000),
      client_id_expires_at: Math.floor(client.expiresAt / 1000),
    });
  });

  // ── PRAXIS Governance Receipt Endpoints ────────────────────────────────────────

  // GET /mcp/nexus/verify/:hash — tenant-scoped lookup of an unverified receipt.
  router.get('/nexus/verify/:hash', (req: Request, res: Response) => {
    const hash = String(req.params['hash'] ?? '');
    if (!/^[0-9a-f]{64}$/i.test(hash)) {
      res.status(400).json({
        verified: false,
        error: 'INVALID_HASH_FORMAT',
        message: 'Receipt hash must be a 64-character SHA-256 hex string.',
      });
      return;
    }

    if (isProd()) {
      res.status(503).json({
        verified: false,
        evidenceState: 'UNAVAILABLE',
        error: 'PROOF_VERIFICATION_UNAVAILABLE',
        capability: getProofCapabilityStatus(),
      });
      return;
    }

    const authCtx = (req as Request & { authCtx?: GatewayAuthContext }).authCtx;
    const record = lookupProof(hash, authCtx?.tenantId);
    if (!record) {
      res.status(404).json({
        verified: false,
        recorded: false,
        evidenceState: 'UNAVAILABLE',
        error: 'RECEIPT_NOT_FOUND',
        message: 'Governance receipt not found.',
        lookupAttemptedAt: new Date().toISOString(),
      });
      return;
    }

    res.json({
      verified: false,
      recorded: true,
      evidenceState: 'UNAVAILABLE',
      capability: getProofCapabilityStatus(),
      proofHash: record.proofHash,
      toolName: record.toolName,
      actor: record.actor,
      issuedAt: record.issuedAt,
      confidence: record.confidence,
      covenantAllowed: record.covenantAllowed,
      covenantReason: record.covenantReason,
      responseDigest: record.responseDigest,
      lookedUpAt: new Date().toISOString(),
      _nexusNote:
        'This is tenant-scoped correlation metadata, not a cryptographic verification. The responseDigest is an unkeyed SHA-256 digest of the response payload.',
    });
  });

  // GET /mcp/nexus/proofs — list recent receipts for the authenticated tenant.
  router.get('/nexus/proofs', authMiddleware, (req: Request, res: Response) => {
    const limit = Math.min(100, parseInt(String(req.query['limit'] ?? '20'), 10));
    const authCtx = (req as Request & { authCtx?: GatewayAuthContext }).authCtx;
    const proofs = getRecentProofs(limit, authCtx?.tenantId);
    res.json({
      count: proofs.length,
      limit,
      generatedAt: new Date().toISOString(),
      proofs,
      capability: getProofCapabilityStatus(),
    });
  });

  return router;
}

// ─── Discovery Endpoint Handler (mounted at app level) ────────────────────────

export function createDiscoveryHandler(): express.RequestHandler {
  return (_req, res) => {
    res.json({
      name: SERVER_INFO.name,
      version: SERVER_INFO.version,
      protocolVersion: SERVER_INFO.protocolVersion,
      description: SERVER_INFO.description,
      capabilities: CAPABILITIES,
      toolCount: SUBSTRATE_TOOLS.length,
      resourceCount: SUBSTRATE_RESOURCES.length,
      promptCount: SUBSTRATE_PROMPTS.length,
      endpoints: {
        mcp: '/mcp',
        health: '/mcp/health',
        sse: '/mcp/sse',
        authorize: '/mcp/authorize',
        token: '/mcp/token',
        register: '/mcp/register',
        nexusVerify: '/mcp/nexus/verify/:hash',
        nexusProofs: '/mcp/nexus/proofs',
        revoke: '/mcp/revoke',
        enterpriseIdps: '/mcp/enterprise/idps',
        metadata: '/.well-known/oauth-authorization-server',
      },
      nexus: {
        version: '1.0',
        discovery: 'enabled',
        consciousness: 'unavailable',
        description:
          'PRAXIS governance metadata — calibrated response assessment and cryptographic verification are unavailable',
        features: [
          'heuristic_assessment_unvalidated',
          'governance_receipt_unverified',
          'convergence_fixtures',
          'evidence_graph_fixtures',
          'id_jag_enterprise_auth',
        ],
        optionalCapabilities: getNexusRuntimeCapabilities(),
        resourcePrefixes: [
          'nexus://convergence/',
          'nexus://signals/',
          'nexus://agents/',
          'nexus://evidence/',
          'nexus://proof/',
        ],
      },
      execution: getExecutionCapabilityStatus(),
      authMethods: ['bearer_token', 'oauth2_pkce', 'enterprise_idjag'],
      extensions: SERVER_EXTENSIONS,
    });
  };
}

// ─── OAuth Authorization Server Metadata (RFC 8414) ──────────────────────────
//
// Advertises the enterprise-managed-authorization extension and ID-JAG support.
// Mounted at `/.well-known/oauth-authorization-server` at the root Express app.

export function createAuthorizationServerMetadata(): express.RequestHandler {
  return (req, res) => {
    const host = req.headers['x-forwarded-host'] ?? req.headers.host ?? 'localhost';
    const proto = req.headers['x-forwarded-proto'] ?? (req.secure ? 'https' : 'http');
    const issuer = `${proto}://${host}`;

    res.json({
      issuer,
      authorization_endpoint: `${issuer}/mcp/authorize`,
      token_endpoint: `${issuer}/mcp/token`,
      registration_endpoint: `${issuer}/mcp/register`,
      revocation_endpoint: `${issuer}/mcp/revoke`,
      token_endpoint_auth_methods_supported: ['none'],
      grant_types_supported: ['authorization_code', 'urn:ietf:params:oauth:grant-type:jwt-bearer'],
      response_types_supported: ['code'],
      code_challenge_methods_supported: ['S256'],
      scopes_supported: ['mcp', 'mcp:read', 'mcp:write', 'mcp:approve', 'mcp:admin'],
      enterprise_managed_authorization: {
        version: '1.0',
        extension: 'io.modelcontextprotocol/enterprise-managed-authorization',
        idjag_grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        registered_idps: listEnterpriseIdps()
          .filter((idp) => idp.enabled)
          .map((idp) => ({
            id: idp.id,
            name: idp.name,
            issuer: idp.issuerUrl,
            audience: idp.expectedAudience,
          })),
        revocation_endpoint: `${issuer}/mcp/revoke`,
        revocation_webhook_secret_header: 'x-revocation-secret',
      },
      mcp_protocol_version: SERVER_INFO.protocolVersion,
    });
  };
}

// Keep negotiateExtensions available for external callers
export { negotiateExtensions };
