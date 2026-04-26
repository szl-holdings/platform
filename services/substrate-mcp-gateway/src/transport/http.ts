/**
 * Substrate MCP Gateway — Streamable HTTP Transport (2025-11-25)
 *
 * Implements MCP 2025-11-25 Streamable HTTP transport on a single endpoint:
 *
 *   POST /mcp   — JSON-RPC 2.0 request/notification/response bodies
 *                 Returns application/json (single) or text/event-stream (streamed)
 *   GET  /mcp   — Server-sent events for server-initiated messages
 *   DELETE /mcp — Session teardown
 *   GET  /mcp/sse — Legacy SSE alias (backward compat with 2024-11-05 clients)
 *
 * Security:
 *   - Origin header validation (DNS rebinding protection)
 *   - CORS with configurable allowed origins
 *   - Helmet-equivalent security headers
 *   - Sliding-window rate limiting
 *
 * OAuth 2.1 + PKCE:
 *   POST /mcp/authorize — authorization endpoint
 *   POST /mcp/token     — token endpoint
 *   POST /mcp/register  — RFC 7591 dynamic client registration
 *
 * Session management:
 *   - MCP-Session-Id issued on initialize, forwarded by client on subsequent requests
 *   - Sessions expire after SESSION_TTL_MS of inactivity
 *   - DELETE /mcp terminates a session; subsequent requests return 404
 *
 * Extension negotiation:
 *   - initialize request may include extensions; server returns accepted set
 *   - stored per session
 */

import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { runtimeEventBus, type SubstrateRuntimeEvent } from '@szl/substrate';
import express, { type NextFunction, type Request, type Response } from 'express';
import { authMiddleware, resolveAuthContext } from '../auth.js';
import {
  CAPABILITIES,
  SERVER_INFO,
  SUBSTRATE_PROMPTS,
  SUBSTRATE_RESOURCES,
  SUBSTRATE_TOOLS,
} from '../descriptor.js';
import { getAvailableTools, handlePromptGet, handleResourceRead, handleToolCall } from '../handlers.js';
import { type RunLifecycleEvent, runEventBus } from '../run-events.js';

// ─── JSON-RPC Helpers ─────────────────────────────────────────────────────────

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcNotification {
  jsonrpc: '2.0';
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

function rpcOk(id: string | number | null, result: unknown): JsonRpcResponse {
  return { jsonrpc: '2.0', id, result };
}

function rpcErr(
  id: string | number | null,
  code: number,
  message: string,
  data?: unknown,
): JsonRpcResponse {
  return { jsonrpc: '2.0', id, error: { code, message, ...(data ? { data } : {}) } };
}

function isNotification(body: unknown): body is JsonRpcNotification {
  return (
    typeof body === 'object' &&
    body !== null &&
    (body as Record<string, unknown>).jsonrpc === '2.0' &&
    typeof (body as Record<string, unknown>).method === 'string' &&
    !('id' in (body as Record<string, unknown>))
  );
}

// ─── Session Management ────────────────────────────────────────────────────────

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 min
const EVENT_BUFFER_MAX = 500; // per-session replay buffer size

interface SessionState {
  sessionId: string;
  createdAt: number;
  lastAccessAt: number;
  clientCapabilities: unknown;
  clientInfo: unknown;
  negotiatedExtensions: Record<string, unknown>;
  eventCounter: number;
  eventBuffer: Array<{ id: string; eventType: string; data: unknown }>;
  activeStreamRes: Set<Response>;
  terminated: boolean;
}

const sessions = new Map<string, SessionState>();

function createSession(params: {
  clientCapabilities?: unknown;
  clientInfo?: unknown;
  extensions?: Record<string, unknown>;
}): SessionState {
  const sessionId = randomUUID();
  const session: SessionState = {
    sessionId,
    createdAt: Date.now(),
    lastAccessAt: Date.now(),
    clientCapabilities: params.clientCapabilities ?? {},
    clientInfo: params.clientInfo ?? {},
    negotiatedExtensions: params.extensions ?? {},
    eventCounter: 0,
    eventBuffer: [],
    activeStreamRes: new Set(),
    terminated: false,
  };
  sessions.set(sessionId, session);
  return session;
}

function getSession(id: string): SessionState | null {
  const s = sessions.get(id);
  if (!s) return null;
  if (s.terminated) return null;
  if (Date.now() - s.lastAccessAt > SESSION_TTL_MS) {
    sessions.delete(id);
    return null;
  }
  s.lastAccessAt = Date.now();
  return s;
}

function terminateSession(id: string): boolean {
  const s = sessions.get(id);
  if (!s) return false;
  s.terminated = true;
  for (const res of s.activeStreamRes) {
    try {
      res.write('event: session_terminated\ndata: {}\n\n');
      res.end();
    } catch {}
  }
  sessions.delete(id);
  return true;
}

// Session TTL cleanup every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (session.terminated || now - session.lastAccessAt > SESSION_TTL_MS) {
      sessions.delete(id);
    }
  }
}, 5 * 60 * 1000);

// ─── Event ID + Replay ────────────────────────────────────────────────────────

function allocEventId(session: SessionState, eventType: string, data: unknown): string {
  const id = `${session.sessionId.slice(0, 8)}-${++session.eventCounter}`;
  session.eventBuffer.push({ id, eventType, data });
  if (session.eventBuffer.length > EVENT_BUFFER_MAX) {
    session.eventBuffer.shift();
  }
  return id;
}

function getEventsAfter(session: SessionState, lastEventId: string): Array<{ id: string; eventType: string; data: unknown }> {
  const idx = session.eventBuffer.findIndex((e) => e.id === lastEventId);
  if (idx === -1) return [];
  return session.eventBuffer.slice(idx + 1);
}

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

function securityHeaders(req: Request, res: Response, next: NextFunction): void {
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
  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, MCP-Session-Id, Last-Event-ID, Accept');
    res.setHeader('Access-Control-Expose-Headers', 'MCP-Session-Id');
  }
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
    res.status(403).json(rpcErr(null, -32000, 'FORBIDDEN', { reason: 'Origin not allowed' }));
    return;
  }
  next();
}

// ─── Rate Limiting ────────────────────────────────────────────────────────────

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = parseInt(process.env.MCP_RATE_LIMIT ?? '200', 10);

interface RateLimitEntry { count: number; windowStart: number }
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
    res.status(429).json(rpcErr(null, -32000, 'RATE_LIMITED', {
      reason: 'Too many requests. Retry after 60 seconds.',
    }));
    return;
  }
  next();
}

// ─── Extension Negotiation ────────────────────────────────────────────────────

const SERVER_EXTENSIONS = (CAPABILITIES as unknown as Record<string, unknown>).extensions as Record<string, unknown>;

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

// ─── MCP Method Router ────────────────────────────────────────────────────────

async function handleMcpMethod(
  req: JsonRpcRequest,
  actorId: string,
  session: SessionState | null,
): Promise<JsonRpcResponse> {
  const { method, params = {}, id } = req;

  try {
    switch (method) {
      case 'initialize': {
        const clientCaps = params.capabilities;
        const clientInfo = params.clientInfo;
        const clientExtensions = (params as Record<string, unknown>).extensions;
        const accepted = negotiateExtensions(clientExtensions);

        if (session) {
          session.clientCapabilities = clientCaps;
          session.clientInfo = clientInfo;
          session.negotiatedExtensions = accepted;
        }

        return rpcOk(id, {
          protocolVersion: SERVER_INFO.protocolVersion,
          capabilities: CAPABILITIES,
          serverInfo: {
            name: SERVER_INFO.name,
            version: SERVER_INFO.version,
          },
          extensions: accepted,
        });
      }

      case 'ping':
        return rpcOk(id, {});

      case 'tools/list':
        // Use the live tool set — changes when enable_server / disable_server is called.
        return rpcOk(id, {
          tools: getAvailableTools().map((t) => ({
            name: t.name,
            description: t.description,
            inputSchema: t.inputSchema,
          })),
        });

      case 'tools/call': {
        const toolName = String(params.name ?? '');
        const toolArgs = (params.arguments ?? {}) as Record<string, unknown>;

        if (!toolName) {
          return rpcErr(id, -32602, 'INVALID_PARAMS', {
            reason: 'Missing tool name in params.name',
          });
        }

        const liveTools = getAvailableTools();
        const known = liveTools.find((t) => t.name === toolName);
        if (!known) {
          return rpcErr(id, -32601, 'METHOD_NOT_FOUND', { reason: `No tool named '${toolName}'` });
        }

        const result = await handleToolCall(toolName, toolArgs, actorId);
        return rpcOk(id, result);
      }

      case 'resources/list':
        return rpcOk(id, {
          resources: SUBSTRATE_RESOURCES.map((r) => ({
            uri: r.uri,
            name: r.name,
            description: r.description,
            mimeType: r.mimeType,
          })),
        });

      case 'resources/read': {
        const uri = String(params.uri ?? '');
        if (!uri) {
          return rpcErr(id, -32602, 'INVALID_PARAMS', { reason: 'Missing resource URI in params.uri' });
        }
        const result = await handleResourceRead(uri);
        if ('error' in result) {
          return rpcErr(id, -32001, 'NOT_FOUND', { reason: result.error });
        }
        return rpcOk(id, result);
      }

      case 'prompts/list':
        return rpcOk(id, {
          prompts: SUBSTRATE_PROMPTS.map((p) => ({
            name: p.name,
            description: p.description,
            arguments: p.arguments ?? [],
          })),
        });

      case 'prompts/get': {
        const name = String(params.name ?? '');
        const promptArgs = (params.arguments ?? {}) as Record<string, string>;
        if (!name) {
          return rpcErr(id, -32602, 'INVALID_PARAMS', { reason: 'Missing prompt name in params.name' });
        }
        const result = handlePromptGet(name, promptArgs);
        if ('error' in result) {
          return rpcErr(id, -32001, 'NOT_FOUND', { reason: result.error });
        }
        return rpcOk(id, result);
      }

      default:
        return rpcErr(id, -32601, 'METHOD_NOT_FOUND', { method });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return rpcErr(id, -32603, 'INTERNAL_ERROR', { reason: msg });
  }
}

// ─── Notification Handler ─────────────────────────────────────────────────────

function handleNotification(notification: JsonRpcNotification, session: SessionState | null): void {
  switch (notification.method) {
    case 'notifications/initialized':
      break;
    case 'notifications/cancelled': {
      const requestId = (notification.params as Record<string, unknown> | undefined)?.requestId;
      void requestId;
      break;
    }
    case 'notifications/roots/list_changed':
      break;
    default:
      break;
  }
}

// ─── SSE Session Registry (legacy GET /sse) ───────────────────────────────────

const sseClients = new Map<string, Response>();

function sseId(): string {
  return `sse-${Date.now()}-${randomBytes(3).toString('hex')}`;
}

function writeSseEvent(res: Response, eventType: string, data: unknown, id?: string): void {
  try {
    let frame = '';
    if (id) frame += `id: ${id}\n`;
    frame += `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    res.write(frame);
  } catch {}
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

// ─── Express Router Factory ───────────────────────────────────────────────────

export function createHttpTransport(): express.Router {
  const router = express.Router();

  router.use(express.json({ limit: '4mb' }));
  router.use(securityHeaders);
  router.use(corsMiddleware);
  router.use(originValidation);
  router.use(rateLimiter);
  router.use(authMiddleware);

  // ── CORS preflight pass-through ───────────────────────────────────────────
  router.options(/.*/, (_req, res) => {
    res.status(204).end();
  });

  // ── Index (public) ────────────────────────────────────────────────────────
  router.get('/', (req: Request, res: Response, next: NextFunction) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (sessionId) {
      handleStreamableGet(req, res);
      return;
    }
    const acceptsEventStream = (req.headers.accept ?? '').includes('text/event-stream');
    if (acceptsEventStream) {
      handleStreamableGet(req, res);
      return;
    }
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
        sse: 'GET /mcp (Accept: text/event-stream) or GET /mcp/sse',
        authorize: 'POST /mcp/authorize',
        token: 'POST /mcp/token',
        register: 'POST /mcp/register',
      },
    });
  });

  // ── Health ────────────────────────────────────────────────────────────────
  router.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: SERVER_INFO.name,
      version: SERVER_INFO.version,
      protocol: SERVER_INFO.protocolVersion,
      capabilities: CAPABILITIES,
      toolCount: SUBSTRATE_TOOLS.length,
      resourceCount: SUBSTRATE_RESOURCES.length,
      promptCount: SUBSTRATE_PROMPTS.length,
      activeSessions: sessions.size,
      activeSseConnections: sseClients.size,
      timestamp: new Date().toISOString(),
    });
  });

  // ── Tool inventory ────────────────────────────────────────────────────────
  router.get('/tools', (_req, res) => {
    res.json({ tools: SUBSTRATE_TOOLS });
  });

  // ── Resource inventory ────────────────────────────────────────────────────
  router.get('/resources', (_req, res) => {
    res.json({ resources: SUBSTRATE_RESOURCES });
  });

  // ── Prompt inventory ──────────────────────────────────────────────────────
  router.get('/prompts', (_req, res) => {
    res.json({ prompts: SUBSTRATE_PROMPTS });
  });

  // ── Legacy SSE stream (GET /mcp/sse) ──────────────────────────────────────
  router.get('/sse', (req: Request, res: Response) => {
    const id = sseId();
    const ctx = resolveAuthContext(req);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    sseClients.set(id, res);

    function writeEvent(eventType: string, data: unknown): void {
      writeSseEvent(res, eventType, data);
    }

    writeEvent('$/ready', {
      endpoint: '/mcp',
      sessionId: id,
      serverInfo: SERVER_INFO,
      capabilities: CAPABILITIES,
      actorId: ctx.actorId,
    });

    const unsubscribeRunEvents = runEventBus.subscribe((event: RunLifecycleEvent) => {
      if (event.type === 'tool_list_changed') {
        writeEvent('notification', {
          jsonrpc: '2.0',
          method: 'notifications/tools/list_changed',
          params: {},
        });
      } else {
        writeEvent(event.type, event);
      }
    });

    const unsubscribeRuntimeEvents = runtimeEventBus.subscribe((event: SubstrateRuntimeEvent) => {
      writeEvent(event.type, event);
    });

    const keepalive = setInterval(() => {
      writeEvent('$/ping', { timestamp: Date.now() });
    }, 30_000);

    req.on('close', () => {
      clearInterval(keepalive);
      unsubscribeRunEvents();
      unsubscribeRuntimeEvents();
      sseClients.delete(id);
    });
  });

  // ── DELETE /mcp — Session termination ─────────────────────────────────────
  router.delete('/', (req: Request, res: Response) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId) {
      res.status(400).json(rpcErr(null, -32600, 'INVALID_REQUEST', {
        reason: 'MCP-Session-Id header required for DELETE',
      }));
      return;
    }
    const terminated = terminateSession(sessionId);
    if (!terminated) {
      res.status(404).json(rpcErr(null, -32001, 'SESSION_NOT_FOUND', {
        reason: `Session '${sessionId}' not found or already expired`,
      }));
      return;
    }
    res.status(200).json({ ok: true, sessionId, terminated: true });
  });

  // ── POST /mcp — Streamable HTTP JSON-RPC ──────────────────────────────────
  router.post('/', async (req: Request, res: Response) => {
    const ctx = (req as Request & { authCtx?: { authenticated: boolean; actorId: string } }).authCtx;
    const actorId = ctx?.actorId ?? 'anonymous';

    const body = req.body as unknown;

    let session: SessionState | null = null;
    const sessionIdHeader = req.headers['mcp-session-id'] as string | undefined;

    if (sessionIdHeader) {
      session = getSession(sessionIdHeader);
      if (!session) {
        res.status(404).json(rpcErr(null, -32001, 'SESSION_NOT_FOUND', {
          reason: `Session '${sessionIdHeader}' not found or expired. Call initialize to create a new session.`,
        }));
        return;
      }
    }

    // Handle notification (no id field)
    if (isNotification(body)) {
      handleNotification(body, session);
      res.status(202).end();
      return;
    }

    // Handle batch request
    if (Array.isArray(body)) {
      if (body.length > 20) {
        res.status(400).json(
          rpcErr(null, -32600, 'INVALID_REQUEST', { reason: 'Batch size limit is 20 requests' }),
        );
        return;
      }

      const results = await Promise.all(
        body.map((item: unknown) => {
          if (isNotification(item as JsonRpcNotification)) {
            handleNotification(item as JsonRpcNotification, session);
            return null;
          }
          const rpcReq = item as JsonRpcRequest;
          if (!rpcReq.jsonrpc || !rpcReq.method) {
            return rpcErr(rpcReq.id ?? null, -32600, 'INVALID_REQUEST');
          }
          return handleMcpMethod(rpcReq, actorId, session);
        }),
      );

      const responses = results.filter((r): r is JsonRpcResponse => r !== null);
      res.json(responses);
      return;
    }

    const rpcReq = body as JsonRpcRequest;
    if (!rpcReq || typeof rpcReq !== 'object' || !rpcReq.jsonrpc || !rpcReq.method) {
      res.status(400).json(rpcErr(null, -32600, 'INVALID_REQUEST'));
      return;
    }

    const result = await handleMcpMethod(rpcReq, actorId, session);

    // On initialize: create a new session and attach session ID to response
    if (rpcReq.method === 'initialize' && !sessionIdHeader) {
      const clientExtensions = (rpcReq.params as Record<string, unknown> | undefined)?.extensions;
      const newSession = createSession({
        clientCapabilities: rpcReq.params?.capabilities,
        clientInfo: rpcReq.params?.clientInfo,
        extensions: negotiateExtensions(clientExtensions) as Record<string, unknown>,
      });
      res.setHeader('MCP-Session-Id', newSession.sessionId);
    }

    res.json(result);
  });

  // ── Streamable GET /mcp — SSE listener for active sessions ────────────────
  function handleStreamableGet(req: Request, res: Response): void {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const ctx = resolveAuthContext(req);
    const legacyId = sseId();

    let session: SessionState | null = null;
    if (sessionId) {
      session = getSession(sessionId);
      if (!session) {
        writeSseEvent(res, 'error', {
          code: -32001,
          message: 'SESSION_NOT_FOUND',
          reason: `Session '${sessionId}' not found or expired`,
        });
        res.end();
        return;
      }
      session.activeStreamRes.add(res);

      // Replay missed events if Last-Event-ID is present
      const lastEventId = req.headers['last-event-id'] as string | undefined;
      if (lastEventId) {
        const missed = getEventsAfter(session, lastEventId);
        for (const ev of missed) {
          writeSseEvent(res, ev.eventType, ev.data, ev.id);
        }
      }
    } else {
      sseClients.set(legacyId, res);
    }

    writeSseEvent(res, '$/ready', {
      endpoint: '/mcp',
      sessionId: session?.sessionId ?? legacyId,
      serverInfo: SERVER_INFO,
      capabilities: CAPABILITIES,
      actorId: ctx.actorId,
    });

    function broadcastEvent(eventType: string, data: unknown): void {
      if (session) {
        const id = allocEventId(session, eventType, data);
        writeSseEvent(res, eventType, data, id);
      } else {
        writeSseEvent(res, eventType, data);
      }
    }

    const unsubscribeRunEvents = runEventBus.subscribe((event: RunLifecycleEvent) => {
      broadcastEvent(event.type, event);
    });

    const unsubscribeRuntimeEvents = runtimeEventBus.subscribe((event: SubstrateRuntimeEvent) => {
      broadcastEvent(event.type, event);
    });

    const keepalive = setInterval(() => {
      broadcastEvent('$/ping', { timestamp: Date.now() });
    }, 30_000);

    req.on('close', () => {
      clearInterval(keepalive);
      unsubscribeRunEvents();
      unsubscribeRuntimeEvents();
      if (session) {
        session.activeStreamRes.delete(res);
      } else {
        sseClients.delete(legacyId);
      }
    });
  }

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
        error_description: 'Missing required parameters: client_id, redirect_uri, response_type=code, code_challenge',
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
      res.status(400).json({ error: 'invalid_request', error_description: 'redirect_uri mismatch' });
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

  // POST /mcp/token — exchange code for access token
  router.post('/token', (req: Request, res: Response) => {
    const body = req.body as Record<string, unknown>;
    const { grant_type, code, redirect_uri, code_verifier, client_id } = body;

    if (grant_type !== 'authorization_code') {
      res.status(400).json({ error: 'unsupported_grant_type' });
      return;
    }

    const authCode = authCodes.get(String(code ?? ''));
    if (!authCode || authCode.used || Date.now() > authCode.expiresAt) {
      res.status(400).json({ error: 'invalid_grant', error_description: 'Authorization code invalid or expired' });
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
        res.status(400).json({ error: 'invalid_grant', error_description: 'code_verifier mismatch' });
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

  // POST /mcp/register — RFC 7591 dynamic client registration
  router.post('/register', (req: Request, res: Response) => {
    const body = req.body as Record<string, unknown>;
    const {
      client_name,
      redirect_uris,
      grant_types,
      response_types,
      scope,
    } = body;

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
      grantTypes: Array.isArray(grant_types) ? (grant_types as string[]).map(String) : ['authorization_code'],
      responseTypes: Array.isArray(response_types) ? (response_types as string[]).map(String) : ['code'],
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
        authorize: '/mcp/authorize',
        token: '/mcp/token',
        register: '/mcp/register',
      },
      authMethods: ['bearer_token', 'oauth2_pkce'],
      extensions: SERVER_EXTENSIONS,
    });
  };
}

// ─── Export session helpers for testing ──────────────────────────────────────
export { sessions, getSession, createSession, terminateSession };
