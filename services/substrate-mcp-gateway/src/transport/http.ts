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
import { authMiddleware, resolveAuthContext } from '../auth.js';
import {
  CAPABILITIES,
  SERVER_INFO,
  SUBSTRATE_PROMPTS,
  SUBSTRATE_RESOURCES,
  SUBSTRATE_TOOLS,
} from '../descriptor.js';
import {
  getEnterpriseToken,
  getEnterpriseIdpByIssuer,
  handleRevocationWebhook,
  issueEnterpriseToken,
  linkOrProvisionUser,
  listEnterpriseIdps,
  registerEnterpriseIdp,
  unregisterEnterpriseIdp,
  resolveEnterpriseAuthContext,
  validateIdJag,
  type EnterpriseIdpConfig,
  type RevocationWebhookPayload,
} from '../enterprise-auth.js';
import { getAvailableTools } from '../handlers.js';
import { lookupProof, getRecentProofs } from '../nexus-fabric.js';
import { actorIdToTenantId, runWithRequestContext } from '../request-context.js';
import { type RunLifecycleEvent, runEventBus } from '../run-events.js';
import { getGatewayServer, createGatewayServer } from '../nexus-gateway-server.js';

// ─── Security ─────────────────────────────────────────────────────────────────

function isProd(): boolean {
  return process.env.NODE_ENV === 'production';
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
  clientSecret?: string;
  redirectUris: string[];
  grantTypes: string[];
  responseTypes: string[];
  clientName?: string;
  scope?: string;
  registeredAt: number;
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
}

interface OAuthToken {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  scope: string;
  issuedAt: number;
}

const oauthClients = new Map<string, OAuthClient>();
const authCodes = new Map<string, AuthorizationCode>();
const issuedTokens = new Map<string, OAuthToken>();

function sha256Base64Url(input: string): string {
  return createHash('sha256').update(input).digest('base64url');
}

// ─── Session Registries (SDK-managed) ────────────────────────────────────────

// Legacy SSE transport (MCP 2024-11-05)
const sseSessions = new Map<string, SSEServerTransport>();

// Streamable HTTP transport (MCP 2025 spec)
const streamableSessions = new Map<string, StreamableHTTPServerTransport>();

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
  if (!streamableSessions.has(sessionId)) {
    res.status(404).json({ error: `Session '${sessionId}' not found` });
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

  const unsubscribeRun = runEventBus.subscribe((event: RunLifecycleEvent) => {
    writeEvent(event.type, event);
    if (event.type === 'stage_complete') writeEvent('stage:complete', event);
    else if (event.type === 'run_started') {
      writeEvent('run:start', event);
      writeEvent('stage:start', event);
    } else if (event.type === 'run_complete') writeEvent('run:complete', event);
    else if (event.type === 'run_failed') writeEvent('run:failed', event);
  });
  const unsubscribeRuntime = runtimeEventBus.subscribe((event: SubstrateRuntimeEvent) => {
    writeEvent(event.type, event);
  });

  req.on('close', () => {
    clearInterval(keepAlive);
    unsubscribeRun();
    unsubscribeRuntime();
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
      message: { error: 'RATE_LIMITED', reason: 'Too many requests from this IP. Retry after the window resets.' },
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
    res.json({
      status: 'ok',
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
    const ctx = resolveAuthContext(req);
    const sessionId = randomUUID();

    // Raw SSE headers — independent of the SDK transport so we can emit
    // substrate run-lifecycle events directly to the wire as `event: <type>`.
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
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
    res.flushHeaders?.();

    const writeEvent = (eventName: string, data: unknown): void => {
      try {
        res.write(`event: ${eventName}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch {
        /* connection closed mid-write */
      }
    };

    // Emit a ready frame so clients can confirm the stream is alive.
    writeEvent('$/ready', { sessionId, serverInfo: SERVER_INFO, timestamp: Date.now() });

    // Keep-alive ping every 25s to defeat intermediary buffers.
    const keepAlive = setInterval(() => {
      try {
        res.write(`: keepalive ${Date.now()}\n\n`);
      } catch {
        /* socket closed */
      }
    }, 25_000);

    // Bridge substrate run lifecycle events onto the SSE stream.
    // We emit both the canonical snake_case event name AND a colon-form
    // alias (`stage:start`, `stage:complete`, `run:complete`) so clients
    // that follow the MCP 2025 streaming naming convention also work.
    const unsubscribeRunEvents = runEventBus.subscribe((event: RunLifecycleEvent) => {
      writeEvent(event.type, event);
      if (event.type === 'stage_complete') {
        writeEvent('stage:complete', event);
      } else if (event.type === 'run_started') {
        writeEvent('run:start', event);
        // Surface a synthetic stage:start so multi-stage UIs render progress.
        writeEvent('stage:start', event);
      } else if (event.type === 'run_complete') {
        writeEvent('run:complete', event);
      } else if (event.type === 'run_failed') {
        writeEvent('run:failed', event);
      } else if (event.type === 'tool_list_changed') {
        void getGatewayServer().notifyListChanged('tools/list_changed');
      }
    });

    const unsubscribeRuntimeEvents = runtimeEventBus.subscribe((event: SubstrateRuntimeEvent) => {
      // The substrate runtime already emits colon-form names
      // (`stage:start`, `stage:complete`, `run:complete`, ...). Forward verbatim.
      writeEvent(event.type, event);
    });

    req.on('close', () => {
      clearInterval(keepAlive);
      unsubscribeRunEvents();
      unsubscribeRuntimeEvents();
      sseSessions.delete(sessionId);
      try {
        res.end();
      } catch {
        /* already ended */
      }
    });

    void ctx; // auth context available for future per-session tenant injection
  });

  // ── Legacy SSE message endpoint ───────────────────────────────────────────
  //
  // Clients connected via GET /mcp/sse POST their JSON-RPC messages here.

  router.post('/message', async (req: Request, res: Response) => {
    const sessionId = String(req.query['sessionId'] ?? '');
    const transport = sseSessions.get(sessionId);

    if (!transport) {
      res.status(404).json({
        jsonrpc: '2.0',
        error: { code: -32001, message: 'Session not found', data: { sessionId } },
      });
      return;
    }

    // Wire per-request tenant context from the authenticated actor so that
    // resource and tool handlers can enforce tenant-scoped signal delivery.
    const sseAuthCtx = (req as Request & { authCtx?: { actorId: string } }).authCtx;
    const sseActorId = sseAuthCtx?.actorId ?? 'anonymous';
    await runWithRequestContext(
      { actorId: sseActorId, tenantId: actorIdToTenantId(sseActorId) },
      () => transport.handlePostMessage(req, res, req.body),
    );
  });

  // ── POST /mcp — Streamable HTTP JSON-RPC ──────────────────────────────────
  //
  // A single POST endpoint handles all MCP 2025 traffic. The SDK creates a new
  // StreamableHTTPServerTransport per session (identified by Mcp-Session-Id).

  router.post('/', async (req: Request, res: Response) => {
    // Wire per-request tenant context from the authenticated actor identity.
    const postAuthCtx = (req as Request & { authCtx?: { actorId: string } }).authCtx;
    const postActorId = postAuthCtx?.actorId ?? 'anonymous';
    const reqCtx = { actorId: postActorId, tenantId: actorIdToTenantId(postActorId) };

    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    // Enforce enterprise token scope on tool calls
    // Enterprise tokens carry a scope string (e.g. "mcp:read", "mcp:read mcp:write").
    // Require at minimum mcp:read for tool/resource access; return 403 if scope is empty.
    const mcpBody = req.body as { method?: string; params?: Record<string, unknown> } | undefined;
    const requestedMethod = mcpBody?.method;
    if (requestedMethod) {
      const authCtx = resolveAuthContext(req);
      if (authCtx.enterprise) {
        const scope = authCtx.enterpriseScope ?? '';
        const hasRead = scope.includes('mcp:read') || scope.includes('mcp:admin');
        if (!hasRead) {
          res.status(403).json({
            jsonrpc: '2.0',
            id: null,
            error: {
              code: -32000,
              message: 'FORBIDDEN',
              data: {
                reason:
                  'Enterprise token scope does not permit MCP access. Minimum scope required: mcp:read',
              },
            },
          });
          return;
        }
        // Write operations require mcp:write or mcp:admin
        const isWriteMethod =
          requestedMethod === 'tools/call' &&
          typeof mcpBody?.params === 'object' &&
          mcpBody.params !== null &&
          typeof (mcpBody.params as Record<string, unknown>).name === 'string' &&
          /^(alloy_|lyte_|alloy_launch|alloy_decision|alloy_approve|alloy_veto)/.test(
            (mcpBody.params as Record<string, unknown>).name as string,
          );
        if (isWriteMethod) {
          const hasWrite =
            scope.includes('mcp:write') ||
            scope.includes('mcp:approve') ||
            scope.includes('mcp:admin');
          if (!hasWrite) {
            res.status(403).json({
              jsonrpc: '2.0',
              id: null,
              error: {
                code: -32000,
                message: 'FORBIDDEN',
                data: {
                  reason:
                    'Enterprise token scope does not permit write/mutate operations. Minimum scope required: mcp:write',
                },
              },
            });
            return;
          }
        }
      }
    }

    if (sessionId && streamableSessions.has(sessionId)) {
      const transport = streamableSessions.get(sessionId)!;
      await runWithRequestContext(reqCtx, () => transport.handleRequest(req, res, req.body));
      return;
    }

    // If a session id was supplied but it does not correspond to an active
    // session, the session has been terminated or never existed. Per MCP
    // Streamable HTTP spec, return 404 so clients can re-initialize.
    if (sessionId && !streamableSessions.has(sessionId)) {
      res.status(404).json({
        jsonrpc: '2.0',
        id: (req.body as { id?: string | number | null } | undefined)?.id ?? null,
        error: {
          code: -32001,
          message: 'Session not found',
          data: { sessionId, reason: 'Session terminated or never existed. Re-initialize to obtain a new session.' },
        },
      });
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
        streamableSessions.set(id, transport);
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
        | { method?: string; params?: { extensions?: unknown; capabilities?: { extensions?: unknown } } }
        | undefined;
      const clientExtensions =
        rawInit?.params?.extensions ?? rawInit?.params?.capabilities?.extensions;
      const sdkServer = (sessionServer as unknown as { sdk: { server: unknown } }).sdk.server;
      const serverAny = sdkServer as unknown as {
        setRequestHandler: (schema: typeof InitializeRequestSchema, handler: (request: unknown) => Promise<Record<string, unknown>>) => void;
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
    const transport = streamableSessions.get(sessionId);
    if (!transport) {
      res.status(404).json({ error: `Session '${sessionId}' not found` });
      return;
    }
    await transport.handleRequest(req, res);
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
    const transport = streamableSessions.get(sessionId);
    if (!transport) {
      res
        .status(404)
        .json({ error: 'SESSION_NOT_FOUND', reason: `Session '${sessionId}' not found` });
      return;
    }
    streamableSessions.delete(sessionId);
    void transport.close();
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

    const client = oauthClients.get(String(client_id));
    if (!client) {
      res.status(400).json({ error: 'invalid_client', error_description: 'Unknown client_id' });
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
      scope: String(scope ?? 'mcp'),
      codeChallenge: String(code_challenge),
      codeChallengeMethod: String(code_challenge_method ?? 'S256'),
      expiresAt: Date.now() + 5 * 60 * 1000,
      used: false,
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

    if (authCode.codeChallengeMethod === 'S256') {
      const computed = sha256Base64Url(String(code_verifier ?? ''));
      if (computed !== authCode.codeChallenge) {
        res
          .status(400)
          .json({ error: 'invalid_grant', error_description: 'code_verifier mismatch' });
        return;
      }
    }

    authCode.used = true;

    const accessToken = randomBytes(32).toString('base64url');
    const token: OAuthToken = {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 3600,
      scope: authCode.scope,
      issuedAt: Date.now(),
    };
    issuedTokens.set(accessToken, token);

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

    const result = await handleRevocationWebhook(
      {
        issuer: body.issuer,
        subject: body.subject,
        reason: body.reason,
        revokedBy: body.revokedBy,
      },
      req.ip ?? undefined,
    );

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
    if (!ctx.authenticated || ctx.enterprise) {
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
    if (!ctx.authenticated || ctx.enterprise) {
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
    if (!ctx.authenticated || ctx.enterprise) {
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
    const body = req.body as Record<string, unknown>;
    const { client_name, redirect_uris, grant_types, response_types, scope } = body;

    if (!Array.isArray(redirect_uris) || redirect_uris.length === 0) {
      res.status(400).json({
        error: 'invalid_client_metadata',
        error_description: 'redirect_uris is required and must be a non-empty array',
      });
      return;
    }

    const clientId = randomUUID();
    const clientSecret = randomBytes(32).toString('base64url');

    const client: OAuthClient = {
      clientId,
      clientSecret,
      redirectUris: (redirect_uris as string[]).map(String),
      grantTypes: Array.isArray(grant_types)
        ? (grant_types as string[]).map(String)
        : ['authorization_code'],
      responseTypes: Array.isArray(response_types)
        ? (response_types as string[]).map(String)
        : ['code'],
      clientName: client_name ? String(client_name) : undefined,
      scope: scope ? String(scope) : 'mcp',
      registeredAt: Date.now(),
    };

    oauthClients.set(clientId, client);

    res.status(201).json({
      client_id: client.clientId,
      client_secret: client.clientSecret,
      client_name: client.clientName,
      redirect_uris: client.redirectUris,
      grant_types: client.grantTypes,
      response_types: client.responseTypes,
      scope: client.scope,
      client_id_issued_at: Math.floor(client.registeredAt / 1000),
      client_secret_expires_at: 0,
    });
  });

  // ── PRAXIS Proof Verification Endpoints ────────────────────────────────────────

  // GET /mcp/nexus/verify/:hash — verify a PRAXIS proof by its SHA-256 hash
  router.get('/nexus/verify/:hash', (req: Request, res: Response) => {
    const hash = String(req.params['hash'] ?? '');
    if (!/^[0-9a-f]{64}$/i.test(hash)) {
      res.status(400).json({
        verified: false,
        error: 'INVALID_HASH_FORMAT',
        message: 'Proof hash must be a 64-character SHA-256 hex string.',
        hint: 'Retrieve the proof hash from the x-nexus-proof envelope on any tool response.',
      });
      return;
    }

    const record = lookupProof(hash);
    if (!record) {
      res.status(404).json({
        verified: false,
        error: 'PROOF_NOT_FOUND',
        message: `No proof record found for hash '${hash}'.`,
        hint: 'Proofs are retained for the most recent 2,000 tool calls. Older proofs are evicted from the in-process store.',
        lookupAttemptedAt: new Date().toISOString(),
      });
      return;
    }

    res.json({
      verified: true,
      proofHash: record.proofHash,
      toolName: record.toolName,
      actor: record.actor,
      issuedAt: record.issuedAt,
      confidence: record.confidence,
      covenantAllowed: record.covenantAllowed,
      covenantReason: record.covenantReason,
      responseDigest: record.responseDigest,
      verifiedAt: new Date().toISOString(),
      _nexusNote:
        'This proof was generated by the PRAXIS Intelligence Fabric and is cryptographically bound to the tool response content. The responseDigest is the SHA-256 hex (first 16 chars) of the full response payload.',
    });
  });

  // GET /mcp/nexus/proofs — list recent proofs (audit surface for external auditors)
  router.get('/nexus/proofs', authMiddleware, (req: Request, res: Response) => {
    const limit = Math.min(100, parseInt(String(req.query['limit'] ?? '20'), 10));
    const proofs = getRecentProofs(limit);
    res.json({
      count: proofs.length,
      limit,
      generatedAt: new Date().toISOString(),
      proofs,
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
        consciousness: 'active',
        description:
          'PRAXIS Intelligence Fabric — every tool response includes x-nexus-consciousness and x-nexus-proof envelopes',
        features: [
          'consciousness_envelope',
          'proof_chain',
          'convergence_intelligence',
          'prism_bus_bridge',
          'nuromesh_federation',
          'evidence_graph',
          'id_jag_enterprise_auth',
        ],
        resourcePrefixes: [
          'nexus://convergence/',
          'nexus://signals/',
          'nexus://agents/',
          'nexus://evidence/',
          'nexus://proof/',
        ],
      },
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
      token_endpoint_auth_methods_supported: ['none', 'client_secret_basic', 'private_key_jwt'],
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
