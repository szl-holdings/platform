/**
 * Substrate MCP Gateway — HTTP Transport (SDK-Based)
 *
 * Implements both:
 *   - Streamable HTTP transport (MCP 2025 spec) — POST /mcp (stateful session)
 *   - Legacy SSE transport (MCP 2024-11-05) — GET /mcp/sse + POST /mcp/message
 *
 * Both transports share the same NexusMcpServer instance (same tool surface,
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
import { getAvailableTools } from '../handlers.js';
import { lookupProof, getRecentProofs } from '../nexus-fabric.js';
import { actorIdToTenantId, runWithRequestContext } from '../request-context.js';
import { type RunLifecycleEvent, runEventBus } from '../run-events.js';
import { getGatewayServer } from '../nexus-gateway-server.js';

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
    res.status(403).json({ error: 'FORBIDDEN', reason: 'Origin not allowed' });
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
    res.status(429).json({ error: 'RATE_LIMITED', reason: 'Too many requests. Retry after 60 seconds.' });
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
  const transport = streamableSessions.get(sessionId);
  if (!transport) {
    res.status(404).json({ error: `Session '${sessionId}' not found` });
    return;
  }
  void transport.handleRequest(req, res);
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

    const transport = new SSEServerTransport(`/mcp/message`, res);
    sseSessions.set(sessionId, transport);

    // Bridge substrate runtime events to the SDK SSE session.
    const unsubscribeRunEvents = runEventBus.subscribe((event: RunLifecycleEvent) => {
      if (event.type === 'tool_list_changed') {
        void getGatewayServer().notifyListChanged('tools/list_changed');
      }
    });

    const unsubscribeRuntimeEvents = runtimeEventBus.subscribe((_event: SubstrateRuntimeEvent) => {
      // Runtime events are surfaced via the SDK's notification mechanism.
      // More granular progress is handled via the Tasks capability.
    });

    req.on('close', () => {
      unsubscribeRunEvents();
      unsubscribeRuntimeEvents();
      sseSessions.delete(sessionId);
    });

    res.setHeader('X-Session-Id', sessionId);
    void ctx; // auth context available for future per-session tenant injection

    const gatewayServer = getGatewayServer();
    await gatewayServer.connect(transport);
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

    if (sessionId && streamableSessions.has(sessionId)) {
      const transport = streamableSessions.get(sessionId)!;
      await runWithRequestContext(reqCtx, () => transport.handleRequest(req, res, req.body));
      return;
    }

    // New session — create a fresh transport and connect the NexusMcpServer
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
    };

    const gatewayServer = getGatewayServer();
    await gatewayServer.connect(transport);
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
      res.status(400).json({ error: 'INVALID_REQUEST', reason: 'MCP-Session-Id header required for DELETE' });
      return;
    }
    const transport = streamableSessions.get(sessionId);
    if (!transport) {
      res.status(404).json({ error: 'SESSION_NOT_FOUND', reason: `Session '${sessionId}' not found` });
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

  // ── NEXUS Proof Verification Endpoints ────────────────────────────────────────

  // GET /mcp/nexus/verify/:hash — verify a NEXUS proof by its SHA-256 hash
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
      _nexusNote: 'This proof was generated by the PRAXIS Intelligence Fabric and is cryptographically bound to the tool response content. The responseDigest is the SHA-256 hex (first 16 chars) of the full response payload.',
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
      },
      nexus: {
        description: 'PRAXIS Intelligence Fabric — every tool response includes x-nexus-consciousness and x-nexus-proof envelopes',
        features: [
          'consciousness_envelope',
          'proof_chain',
          'convergence_intelligence',
          'prism_bus_bridge',
          'nuromesh_federation',
          'evidence_graph',
        ],
        resourcePrefixes: ['nexus://convergence/', 'nexus://signals/', 'nexus://agents/', 'nexus://evidence/', 'nexus://proof/'],
      },
      authMethods: ['bearer_token', 'oauth2_pkce'],
      extensions: SERVER_EXTENSIONS,
    });
  };
}

// Keep negotiateExtensions available for external callers
export { negotiateExtensions };
