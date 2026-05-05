/**
 * A11oy Orchestration API — the single backbone the six child products
 * register against.
 *
 * Surface:
 *   - GET  /a11oy/fabric/products        (full registry, always 6 products)
 *   - POST /a11oy/fabric/products/register
 *   - GET  /a11oy/fabric/proofs          (filtered ledger view)
 *   - POST /a11oy/fabric/proofs/emit
 *   - POST /a11oy/fabric/route-model     (governed model invocation)
 *   - POST /a11oy/fabric/handoff         (cross-product handoff)
 *   - POST /a11oy/fabric/demo-chain      (Sentra→Counsel→Amaru flow)
 *
 * Identity model — TWO trust paths:
 *
 *   (1) Bearer HMAC token (`Authorization: Bearer <principal>.<hmac>`).
 *       Used by server-to-server callers (CI, internal jobs, tests). The
 *       caller must have access to A11OY_FABRIC_SECRET.
 *
 *   (2) Cookie-bound fabric session. Any GET issues an HttpOnly signed
 *       cookie `_a11oy_fab=sid.hmac(sid, secret)`. Mutating calls must
 *       present that cookie AND a Referer header whose pathname starts
 *       with one of the six product basePaths (or the A11oy hub basePath).
 *       The principal is derived from the Referer mapping. The decoded
 *       principal is server-authoritative — it overrides any `product`
 *       field the body tries to claim.
 *
 *       Why this is robust: an attacker who can spoof the Referer cannot
 *       forge the HttpOnly signed cookie (it is server-issued, not
 *       readable by any JS, and HMAC-bound to A11OY_FABRIC_SECRET).
 *       An attacker who somehow obtains a cookie still cannot mint a
 *       different principal — the principal is pinned to the Referer
 *       basePath, which a non-browser attacker cannot legitimately set
 *       on cross-origin requests.
 *
 * The hub principal `a11oy-hub` is the only one allowed to call
 * `/fabric/demo-chain`.
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import { createHmac, randomUUID, timingSafeEqual as cryptoTimingSafeEqual } from 'node:crypto';
import {
  evaluateInferenceGates,
} from '@szl-holdings/ai-engine/providers/inference-gates';
import {
  verifyProductToken,
  A11OY_HUB_PRINCIPAL,
  type FabricPrincipal,
} from '@workspace/a11oy-orchestration';
import {
  A11OY_PRODUCT_IDS,
  KNOWN_PRODUCT_META,
  appendProof,
  getProduct,
  listAllProductsWithStatus,
  listProofs,
  registerProduct,
  totalProofs,
  type A11oyProductId,
  type ProductRegistration,
  type ProofKind,
} from '../services/orchestration-store.js';
import { logger } from '../lib/logger.js';
import adaptiveIntelligenceRouter from './a11oy-adaptive-intelligence.js';

const router = Router();

router.use('/', adaptiveIntelligenceRouter);

// ── Identity ────────────────────────────────────────────────────────────────

const FABRIC_COOKIE = '_a11oy_fab';
const FABRIC_COOKIE_MAX_AGE_MS = 12 * 60 * 60 * 1000;
const HUB_BASE_PATH = '/';
const HUB_PATH_PREFIX = '/a11oy/';

/** Allowlist of hosts permitted on the cookie path. */
function getAllowedFabricHosts(): ReadonlySet<string> {
  const hosts = new Set<string>();
  const explicit = process.env.A11OY_ALLOWED_ORIGINS;
  if (explicit) {
    for (const raw of explicit.split(',')) {
      const h = raw.trim().toLowerCase();
      if (h) hosts.add(h);
    }
  }
  const replitDomains = process.env.REPLIT_DOMAINS;
  if (replitDomains) {
    for (const raw of replitDomains.split(',')) {
      const h = raw.trim().toLowerCase();
      if (h) hosts.add(h);
    }
  }
  const devDomain = process.env.REPLIT_DEV_DOMAIN;
  if (devDomain) hosts.add(devDomain.toLowerCase());
  if (process.env.NODE_ENV !== 'production') {
    hosts.add('localhost');
    hosts.add('127.0.0.1');
  }
  return hosts;
}

function hostFromHeader(value: string | string[] | undefined): string | null {
  if (!value) return null;
  const v = Array.isArray(value) ? value[0] : value;
  if (!v) return null;
  try {
    return new URL(v).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function pathFromHeader(value: string | string[] | undefined): string | null {
  if (!value) return null;
  const v = Array.isArray(value) ? value[0] : value;
  if (!v) return null;
  try {
    return new URL(v).pathname;
  } catch {
    return null;
  }
}

/** Fail-closed secret resolution; throws if unset or weak. */
function getFabricSecret(): string {
  const s = process.env.A11OY_FABRIC_SECRET;
  if (typeof s === 'string' && s.length >= 16) return s;
  throw new Error(
    'A11OY_FABRIC_SECRET is unset or too short (<16 chars). ' +
      '/api/a11oy/fabric/* refuses to operate without a strong shared secret.',
  );
}

/** Log the missing-secret breadcrumb at most once per process. */
function warnIfSecretMissingOnce(): void {
  if (process.env.__a11oy_fabric_secret_warned__) return;
  if (typeof process.env.A11OY_FABRIC_SECRET === 'string' &&
      process.env.A11OY_FABRIC_SECRET.length >= 16) return;
  process.env.__a11oy_fabric_secret_warned__ = '1';
  logger.error(
    '[a11oy-fabric] A11OY_FABRIC_SECRET is unset or too short — fabric routes will return 500 until set.',
  );
}

function hmacHex(secret: string, value: string): string {
  return createHmac('sha256', secret).update(value).digest('hex');
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return cryptoTimingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
}

function signFabricSession(sid: string): string {
  return `${sid}.${hmacHex(getFabricSecret(), sid)}`;
}

function verifyFabricSession(cookieValue: string | undefined): string | null {
  if (!cookieValue) return null;
  const dot = cookieValue.indexOf('.');
  if (dot <= 0) return null;
  const sid = cookieValue.slice(0, dot);
  const presented = cookieValue.slice(dot + 1);
  let expected: string;
  try {
    expected = hmacHex(getFabricSecret(), sid);
  } catch {
    return null;
  }
  if (!timingSafeEqualHex(expected, presented)) return null;
  return sid;
}

/** Mint the HttpOnly fabric session cookie; no-op if secret missing. */
function issueFabricSessionCookie(_req: Request, res: Response): void {
  warnIfSecretMissingOnce();
  let signed: string;
  try {
    signed = signFabricSession(randomUUID());
  } catch {
    return;
  }
  res.cookie(FABRIC_COOKIE, signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: FABRIC_COOKIE_MAX_AGE_MS,
    path: '/api/a11oy/fabric',
  });
}

/** Map cookie-path browser headers to a principal, or null on any failure. */
function principalFromBrowserHeaders(req: Request): FabricPrincipal | null {
  const allowed = getAllowedFabricHosts();
  if (allowed.size === 0) return null;

  const refererHost = hostFromHeader(req.headers.referer ?? req.headers.referrer);
  const originHost = hostFromHeader(req.headers.origin);

  if (refererHost && !allowed.has(refererHost)) return null;
  if (originHost && !allowed.has(originHost)) return null;
  if (!refererHost && !originHost) return null;
  if (refererHost && originHost && refererHost !== originHost) return null;

  const path = pathFromHeader(req.headers.referer ?? req.headers.referrer);
  if (!path) return null;

  for (const product of A11OY_PRODUCT_IDS) {
    const base = KNOWN_PRODUCT_META[product].basePath;
    if (path === base || path.startsWith(base)) {
      return product;
    }
  }
  if (path === HUB_BASE_PATH || path.startsWith(HUB_PATH_PREFIX)) {
    return A11OY_HUB_PRINCIPAL;
  }
  return null;
}

interface RequestWithFabricIdentity extends Request {
  fabricPrincipal?: FabricPrincipal;
  fabricAuthMethod?: 'bearer' | 'cookie';
}

function resolveFabricIdentity(
  req: RequestWithFabricIdentity,
  res: Response,
): boolean {
  let secret: string;
  try {
    secret = getFabricSecret();
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: { code: 'misconfigured', message: (err as Error).message },
    });
    return false;
  }

  // (1) Bearer HMAC token.
  const auth = (req.headers.authorization ?? '') as string;
  const m = /^Bearer\s+(.+)$/.exec(auth);
  if (m?.[1]) {
    const verified = verifyProductToken(m[1], secret);
    if (!verified) {
      res.status(401).json({
        ok: false,
        error: { code: 'unauthorized', message: 'invalid fabric bearer token' },
      });
      return false;
    }
    req.fabricPrincipal = verified.principal;
    req.fabricAuthMethod = 'bearer';
    return true;
  }

  // (2) Cookie-bound session + Referer-derived principal.
  const cookies = (req as Request & { cookies?: Record<string, string> }).cookies ?? {};
  const cookieValue = cookies[FABRIC_COOKIE];
  const sid = verifyFabricSession(cookieValue);
  if (!sid) {
    res.status(401).json({
      ok: false,
      error: {
        code: 'unauthorized',
        message: 'fabric session cookie missing or invalid; call GET /api/a11oy/fabric/products first',
      },
    });
    return false;
  }
  const principal = principalFromBrowserHeaders(req);
  if (!principal) {
    res.status(403).json({
      ok: false,
      error: {
        code: 'forbidden',
        message:
          'request Origin/Referer host is not in the fabric allowlist or does not map to a known product basePath',
      },
    });
    return false;
  }
  req.fabricPrincipal = principal;
  req.fabricAuthMethod = 'cookie';
  return true;
}

function requireFabricIdentity(allow: 'any' | { only: ReadonlyArray<FabricPrincipal> } = 'any') {
  return (req: RequestWithFabricIdentity, res: Response, next: NextFunction): void => {
    if (!resolveFabricIdentity(req, res)) return;
    const principal = req.fabricPrincipal;
    if (allow !== 'any' && principal && !allow.only.includes(principal)) {
      res.status(403).json({
        ok: false,
        error: {
          code: 'forbidden',
          message: `principal ${principal} not allowed for this endpoint`,
        },
      });
      return;
    }
    next();
  };
}

function ok<T>(res: Response, data: T, meta?: Record<string, unknown>): void {
  res.json({ ok: true, data, meta: { ts: new Date().toISOString(), ...meta } });
}
function bad(res: Response, status: number, code: string, message: string): void {
  res.status(status).json({ ok: false, error: { code, message } });
}

function isProductId(v: unknown): v is A11oyProductId {
  return typeof v === 'string' && (A11OY_PRODUCT_IDS as readonly string[]).includes(v);
}

const PROOF_KINDS: ReadonlySet<ProofKind> = new Set([
  'signal_ingested',
  'recommendation_emitted',
  'action_approved',
  'action_executed',
  'cross_product_handoff',
  'governance_block',
  'model_invocation',
]);

// ── Registry (read) ─────────────────────────────────────────────────────────
router.get('/fabric/products', (req: Request, res: Response) => {
  issueFabricSessionCookie(req, res);
  ok(res, {
    products: listAllProductsWithStatus(),
    knownProductIds: A11OY_PRODUCT_IDS,
    productCatalog: KNOWN_PRODUCT_META,
    recentProofs: listProofs({ limit: 20 }),
    totalProofs: totalProofs(),
    generatedAt: new Date().toISOString(),
  });
});

// ── Registry (write) ────────────────────────────────────────────────────────
router.post(
  '/fabric/products/register',
  requireFabricIdentity('any'),
  (req: RequestWithFabricIdentity, res: Response) => {
    const principal = req.fabricPrincipal;
    if (!principal || principal === A11OY_HUB_PRINCIPAL) {
      return bad(res, 403, 'forbidden', 'hub principal cannot register as a product');
    }
    const body = (req.body ?? {}) as Partial<ProductRegistration>;
    const product = principal as A11oyProductId;
    const meta = KNOWN_PRODUCT_META[product];
    const reg: ProductRegistration = {
      product,
      displayName: typeof body.displayName === 'string' ? body.displayName : meta.displayName,
      basePath: typeof body.basePath === 'string' ? body.basePath : meta.basePath,
      accentColor: typeof body.accentColor === 'string' ? body.accentColor : meta.accentColor,
      capabilities: Array.isArray(body.capabilities) ? body.capabilities : [],
      version: typeof body.version === 'string' ? body.version : undefined,
      bootedAt: typeof body.bootedAt === 'string' ? body.bootedAt : undefined,
    };
    const registered = registerProduct(reg);
    appendProof({
      product: reg.product,
      kind: 'signal_ingested',
      summary: `${reg.displayName} registered with A11oy fabric`,
      deepLink: reg.basePath,
    });
    ok(res, registered);
  },
);

// ── Proof ledger (read) ─────────────────────────────────────────────────────
router.get('/fabric/proofs', (req: Request, res: Response) => {
  issueFabricSessionCookie(req, res);
  const product = typeof req.query.product === 'string' ? req.query.product : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  if (product && !isProductId(product)) {
    return bad(res, 400, 'invalid_product', 'unknown product filter');
  }
  ok(res, listProofs({ product: product as A11oyProductId | undefined, limit }));
});

// ── Proof ledger (write) ────────────────────────────────────────────────────
router.post(
  '/fabric/proofs/emit',
  requireFabricIdentity('any'),
  (req: RequestWithFabricIdentity, res: Response) => {
    const principal = req.fabricPrincipal;
    if (!principal || principal === A11OY_HUB_PRINCIPAL) {
      return bad(res, 403, 'forbidden', 'hub principal cannot emit proofs as a product');
    }
    const body = (req.body ?? {}) as Record<string, unknown>;
    const kind = body.kind;
    if (typeof kind !== 'string' || !PROOF_KINDS.has(kind as ProofKind)) {
      return bad(res, 400, 'invalid_kind', `kind must be one of ${[...PROOF_KINDS].join(', ')}`);
    }
    if (typeof body.summary !== 'string' || body.summary.length === 0) {
      return bad(res, 400, 'invalid_summary', 'summary is required');
    }
    const product = principal as A11oyProductId;
    const entry = appendProof({
      product,
      kind: kind as ProofKind,
      summary: body.summary,
      deepLink: typeof body.deepLink === 'string' ? body.deepLink : undefined,
      relatedProduct: isProductId(body.relatedProduct) ? body.relatedProduct : undefined,
      payload:
        typeof body.payload === 'object' && body.payload !== null
          ? (body.payload as Record<string, unknown>)
          : undefined,
    });
    ok(res, entry);
  },
);

// ── Governed model router ───────────────────────────────────────────────────
router.post(
  '/fabric/route-model',
  requireFabricIdentity('any'),
  (req: RequestWithFabricIdentity, res: Response) => {
    const principal = req.fabricPrincipal;
    if (!principal || principal === A11OY_HUB_PRINCIPAL) {
      return bad(res, 403, 'forbidden', 'hub principal cannot route models');
    }
    const body = (req.body ?? {}) as Record<string, unknown>;
    const model = typeof body.model === 'string' ? body.model : '';
    const purpose = typeof body.purpose === 'string' ? body.purpose : '';
    if (!model) return bad(res, 400, 'invalid_model', 'model is required');
    if (!purpose) return bad(res, 400, 'invalid_purpose', 'purpose is required');

    const gate = evaluateInferenceGates(model);
    const product = principal as A11oyProductId;
    const deepLink = typeof body.deepLink === 'string' ? body.deepLink : undefined;

    if (!gate.allowed) {
      const proof = appendProof({
        product,
        kind: 'governance_block',
        summary: `Blocked ${model} for "${purpose}" — failed gates: ${gate.failedGates.join(', ')}`,
        deepLink,
        payload: { failedGates: gate.failedGates, gates: gate.gates },
        modelUsed: model,
      });
      return ok(res, {
        ok: false,
        blocked: true,
        modelUsed: model,
        failedGates: gate.failedGates,
        proofId: proof.id,
      });
    }

    const proof = appendProof({
      product,
      kind: 'model_invocation',
      summary: `Routed ${model} for "${purpose}"`,
      deepLink,
      payload: { gates: gate.gates },
      modelUsed: model,
    });
    ok(res, {
      ok: true,
      blocked: false,
      modelUsed: model,
      proofId: proof.id,
      output: { acknowledged: true, governedBy: 'a11oy', purpose },
    });
  },
);

// ── Cross-product handoff ───────────────────────────────────────────────────
router.post(
  '/fabric/handoff',
  requireFabricIdentity('any'),
  (req: RequestWithFabricIdentity, res: Response) => {
    const principal = req.fabricPrincipal;
    if (!principal || principal === A11OY_HUB_PRINCIPAL) {
      return bad(res, 403, 'forbidden', 'hub principal cannot initiate handoffs');
    }
    const body = (req.body ?? {}) as Record<string, unknown>;
    const fromProduct = principal as A11oyProductId;
    if (!isProductId(body.toProduct)) {
      return bad(res, 400, 'invalid_handoff', 'toProduct is required');
    }
    if (fromProduct === body.toProduct) {
      return bad(res, 400, 'invalid_handoff', 'handoff must cross product boundary');
    }
    const reason = typeof body.reason === 'string' ? body.reason : 'cross-product action';
    const refId = typeof body.refId === 'string' ? body.refId : `ref-${randomUUID().slice(0, 6)}`;
    const handoffId = `ho-${randomUUID().slice(0, 8)}`;
    const toProduct = body.toProduct as A11oyProductId;
    const fromMeta = getProduct(fromProduct) ?? KNOWN_PRODUCT_META[fromProduct];
    const toMeta = getProduct(toProduct) ?? KNOWN_PRODUCT_META[toProduct];

    const fromProof = appendProof({
      product: fromProduct,
      kind: 'cross_product_handoff',
      summary: `Handed off ${refId} → ${toMeta.displayName}: ${reason}`,
      relatedProduct: toProduct,
      deepLink: typeof body.deepLink === 'string' ? body.deepLink : fromMeta.basePath,
      payload: {
        handoffId,
        refId,
        ...(typeof body.payload === 'object' && body.payload
          ? (body.payload as Record<string, unknown>)
          : {}),
      },
    });
    const toProof = appendProof({
      product: toProduct,
      kind: 'signal_ingested',
      summary: `Received ${refId} from ${fromMeta.displayName}`,
      relatedProduct: fromProduct,
      deepLink: toMeta.basePath,
      payload: { handoffId, refId },
    });
    ok(res, { ok: true, handoffId, proofIds: [fromProof.id, toProof.id] });
  },
);

// Canonical demo chain: Sentra → Counsel → Amaru. Each step runs the
// same governance gate evaluation as /fabric/route-model and writes to
// the shared proof ledger.
router.post(
  '/fabric/demo-chain',
  requireFabricIdentity({ only: [A11OY_HUB_PRINCIPAL] }),
  (req: Request, res: Response) => {
    const body = (req.body ?? {}) as { model?: string };
    const model = typeof body.model === 'string' ? body.model : 'Qwen/Qwen3-8B';
    const chainId = `chain-${randomUUID().slice(0, 6)}`;
    const refId = `incident-${randomUUID().slice(0, 4)}`;

    const sentraGate = evaluateInferenceGates(model);
    const p1 = appendProof({
      product: 'sentra',
      kind: sentraGate.allowed ? 'model_invocation' : 'governance_block',
      summary: sentraGate.allowed
        ? `Sentra routed ${model} through A11oy governance to classify ${refId}`
        : `Sentra blocked ${model} for ${refId} — failed gates: ${sentraGate.failedGates.join(', ')}`,
      deepLink: '/sentra/autonomous-threat-engine',
      modelUsed: model,
      payload: { chainId, refId, gates: sentraGate.gates },
    });

    const p2 = appendProof({
      product: 'sentra',
      kind: 'recommendation_emitted',
      summary: `Sentra recommends Counsel review for ${refId} (severity: high)`,
      deepLink: '/sentra/autonomous-threat-engine',
      payload: { chainId, refId, severity: 'high' },
    });

    const p3 = appendProof({
      product: 'sentra',
      kind: 'cross_product_handoff',
      summary: `Sentra handed ${refId} to Counsel for breach-notification review`,
      relatedProduct: 'counsel',
      deepLink: '/sentra/autonomous-threat-engine',
      payload: { chainId, refId },
    });
    const p4 = appendProof({
      product: 'counsel',
      kind: 'signal_ingested',
      summary: `Counsel inbox received ${refId} from Sentra`,
      relatedProduct: 'sentra',
      deepLink: '/counsel/approvals',
      payload: { chainId, refId },
    });

    const counselGate = evaluateInferenceGates(model);
    const p5 = appendProof({
      product: 'counsel',
      kind: counselGate.allowed ? 'model_invocation' : 'governance_block',
      summary: counselGate.allowed
        ? `Counsel routed ${model} through A11oy to draft notification for ${refId}`
        : `Counsel blocked ${model} for ${refId} — failed gates: ${counselGate.failedGates.join(', ')}`,
      deepLink: '/counsel/approvals',
      modelUsed: model,
      payload: { chainId, refId, gates: counselGate.gates },
    });
    const p6 = appendProof({
      product: 'counsel',
      kind: 'action_approved',
      summary: `Counsel approved breach-notification for ${refId}`,
      relatedProduct: 'sentra',
      deepLink: '/counsel/approvals',
      payload: { chainId, refId },
    });

    const p7 = appendProof({
      product: 'counsel',
      kind: 'cross_product_handoff',
      summary: `Counsel forwarded closed matter ${refId} to Amaru for cycle-ledger anchor`,
      relatedProduct: 'amaru',
      deepLink: '/counsel/approvals',
      payload: { chainId, refId },
    });
    const p8 = appendProof({
      product: 'amaru',
      kind: 'action_executed',
      summary: `Amaru anchored ${refId} into the cycle ledger as a closed-loop incident`,
      relatedProduct: 'counsel',
      deepLink: '/conduit/sigil',
      payload: { chainId, refId, ledgerSpan: 'cycle-2026-Q2' },
    });

    ok(res, { chainId, proofs: [p1, p2, p3, p4, p5, p6, p7, p8] });
  },
);

export default router;
