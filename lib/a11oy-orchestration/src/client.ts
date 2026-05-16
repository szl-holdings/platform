/**
 * Browser/server SDK for talking to A11oy's orchestration backbone.
 *
 * Each child product imports these helpers, calls `registerWithA11oy` on
 * boot, and uses `routeModel` / `emitProof` / `crossProductHandoff` for any
 * cross-product orchestration. The helpers are isomorphic — they use the
 * global `fetch` and never touch the DOM.
 *
 * Identity (browser path): mutating calls rely on a server-issued HttpOnly
 * fabric session cookie (`_a11oy_fab`). The server mints/refreshes the
 * cookie on every GET to /a11oy/fabric/*. The principal is derived
 * server-side from the request Referer; the SDK does not need a token
 * dance and never has access to the cookie itself.
 *
 * Identity (server path): callers may pass an HMAC product token via
 * `opts.token`. The api-server verifies it against A11OY_FABRIC_SECRET.
 *
 * The SDK always issues a GET to /a11oy/fabric/products before its first
 * mutating call so the cookie is in place; subsequent mutations reuse it.
 */

import type {
  CrossProductHandoffRequest,
  CrossProductHandoffResult,
  GovernedModelCallRequest,
  GovernedModelCallResult,
  ProductRegistration,
  ProductRegistryResponse,
  ProofKind,
  ProofLedgerEntry,
  A11oyProductId,
} from './types.js';

export interface A11oyClientOptions {
  /** Base URL for the A11oy orchestration endpoints. Defaults to `/api`. */
  baseUrl?: string;
  /** Optional fetch override (testing). */
  fetchImpl?: typeof fetch;
  /**
   * Optional HMAC product token (`<principal>.<hex>`). Server-to-server
   * callers (CI, internal jobs) sign their own; browser callers leave this
   * unset and let the cookie path authenticate them.
   */
  token?: string;
}

const DEFAULT_BASE = '/api';

let sessionPrimed = false;

function getFetch(opts?: A11oyClientOptions): typeof fetch {
  if (opts?.fetchImpl) return opts.fetchImpl;
  if (typeof fetch === 'undefined') {
    throw new Error('a11oy-orchestration: global fetch is not available');
  }
  return fetch;
}

function url(opts: A11oyClientOptions | undefined, path: string): string {
  const base = opts?.baseUrl ?? DEFAULT_BASE;
  return `${base.replace(/\/$/, '')}${path}`;
}

/**
 * Ensure a fabric session cookie has been minted by the server. Safe to
 * call repeatedly — only the first call actually hits the network.
 */
async function primeFabricSession(opts?: A11oyClientOptions): Promise<void> {
  if (sessionPrimed) return;
  if (opts?.token) {
    sessionPrimed = true;
    return;
  }
  try {
    const f = getFetch(opts);
    await f(url(opts, '/a11oy/fabric/products'), {
      credentials: 'include' as RequestCredentials,
    });
  } catch {
    /* non-fatal — caller will see 401 if identity is required */
  }
  sessionPrimed = true;
}

async function postJson<T>(
  endpoint: string,
  body: unknown,
  opts?: A11oyClientOptions,
): Promise<T> {
  await primeFabricSession(opts);
  const f = getFetch(opts);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts?.token) headers['Authorization'] = `Bearer ${opts.token}`;
  const res = await f(url(opts, endpoint), {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    credentials: 'include' as RequestCredentials,
  });
  if (!res.ok) {
    throw new Error(`a11oy-orchestration: ${endpoint} returned ${res.status}`);
  }
  const data = (await res.json()) as { ok: boolean; data: T; error?: { message?: string } };
  if (!data.ok) throw new Error(data.error?.message ?? 'orchestration_call_failed');
  return data.data;
}

async function getJson<T>(endpoint: string, opts?: A11oyClientOptions): Promise<T> {
  const f = getFetch(opts);
  const res = await f(url(opts, endpoint), { credentials: 'include' as RequestCredentials });
  if (!res.ok) throw new Error(`a11oy-orchestration: ${endpoint} returned ${res.status}`);
  const data = (await res.json()) as { ok: boolean; data: T };
  sessionPrimed = true;
  return data.data;
}

/**
 * Register the calling product with A11oy. Safe to call from a browser on
 * boot — failures are swallowed and logged so a missing API server never
 * blocks the child product UI.
 */
export async function registerWithA11oy(
  registration: ProductRegistration,
  opts?: A11oyClientOptions,
): Promise<{ ok: boolean }> {
  try {
    await postJson<{ ok: boolean }>(
      '/a11oy/fabric/products/register',
      { ...registration, bootedAt: registration.bootedAt ?? new Date().toISOString() },
      opts,
    );
    return { ok: true };
  } catch (err) {
    // Intentional fail-open per SDK contract: child products must boot even
    // when the fabric is unreachable (cross-port dev, api-server cold start,
    // 401 before cookie mint). Demoted from warn → debug so the dev console
    // isn't permanently red over an expected condition.
    if (typeof console !== 'undefined') {
      console.debug(`[a11oy-orchestration] register skipped for ${registration.product}:`, err);
    }
    return { ok: false };
  }
}

export async function emitProof(
  entry: {
    product: A11oyProductId;
    kind: ProofKind;
    summary: string;
    deepLink?: string;
    relatedProduct?: A11oyProductId;
    payload?: Record<string, unknown>;
  },
  opts?: A11oyClientOptions,
): Promise<ProofLedgerEntry> {
  return postJson<ProofLedgerEntry>('/a11oy/fabric/proofs/emit', entry, opts);
}

export async function routeModel(
  req: GovernedModelCallRequest,
  opts?: A11oyClientOptions,
): Promise<GovernedModelCallResult> {
  return postJson<GovernedModelCallResult>('/a11oy/fabric/route-model', req, opts);
}

export async function crossProductHandoff(
  req: CrossProductHandoffRequest,
  opts?: A11oyClientOptions,
): Promise<CrossProductHandoffResult> {
  return postJson<CrossProductHandoffResult>('/a11oy/fabric/handoff', req, opts);
}

export async function listFabricProducts(
  opts?: A11oyClientOptions,
): Promise<ProductRegistryResponse> {
  return getJson<ProductRegistryResponse>('/a11oy/fabric/products', opts);
}

export async function listFabricProofs(
  opts?: A11oyClientOptions & { product?: A11oyProductId; limit?: number },
): Promise<ProofLedgerEntry[]> {
  const params = new URLSearchParams();
  if (opts?.product) params.set('product', opts.product);
  if (opts?.limit) params.set('limit', String(opts.limit));
  const qs = params.toString();
  return getJson<ProofLedgerEntry[]>(`/a11oy/fabric/proofs${qs ? `?${qs}` : ''}`, opts);
}

export async function runDemoCrossProductChain(
  opts?: A11oyClientOptions,
): Promise<{ chainId: string; proofs: ProofLedgerEntry[] }> {
  return postJson('/a11oy/fabric/demo-chain', {}, opts);
}
