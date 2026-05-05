/**
 * A11oy Orchestration backbone — in-memory store.
 *
 * Tracks live product registrations from the six child apps and the unified
 * proof ledger they emit into. No data is pre-seeded: the registry is empty
 * until a real product calls `POST /api/a11oy/fabric/products/register` (the
 * child apps do this on boot from their `main.tsx`). The hub UI shows an
 * explicit "not yet registered" state until that happens.
 *
 * `KNOWN_PRODUCT_META` is *catalog* metadata only — display name, basePath,
 * accent color — used to enrich registrations and to validate which basePath
 * a Bootstrap caller may mint a token from. It is NOT loaded into the live
 * registry.
 */

import { randomUUID } from 'node:crypto';

export type A11oyProductId =
  | 'amaru'
  | 'sentra'
  | 'counsel'
  | 'terra'
  | 'carlota-jo'
  | 'vessels';

export const A11OY_PRODUCT_IDS: readonly A11oyProductId[] = [
  'amaru',
  'sentra',
  'counsel',
  'terra',
  'carlota-jo',
  'vessels',
] as const;

export interface ProductCapability {
  id: string;
  label: string;
  governanceClass: 'observation' | 'recommendation' | 'mutation' | 'external_action';
}

export interface ProductRegistration {
  product: A11oyProductId;
  displayName: string;
  basePath: string;
  accentColor: string;
  capabilities: ProductCapability[];
  version?: string;
  bootedAt?: string;
}

export type ProductHealthStatus = 'healthy' | 'degraded' | 'unknown' | 'offline' | 'unregistered';

export interface RegisteredProduct extends ProductRegistration {
  registeredAt: string;
  lastSeen: string;
  health: ProductHealthStatus;
  recentProofCount: number;
  lastProofAt?: string;
  lastAction?: string;
  modelsUsed: string[];
}

export type ProofKind =
  | 'signal_ingested'
  | 'recommendation_emitted'
  | 'action_approved'
  | 'action_executed'
  | 'cross_product_handoff'
  | 'governance_block'
  | 'model_invocation';

export interface ProofLedgerEntry {
  id: string;
  product: A11oyProductId;
  kind: ProofKind;
  summary: string;
  deepLink?: string;
  relatedProduct?: A11oyProductId;
  payload?: Record<string, unknown>;
  ts: string;
}

const PROOF_LIMIT = 500;
const HEALTH_DEGRADED_MS = 5 * 60_000;
const HEALTH_OFFLINE_MS = 30 * 60_000;

const products = new Map<A11oyProductId, RegisteredProduct>();
const proofs: ProofLedgerEntry[] = [];

/**
 * Catalog metadata for the six known products. Used by the registry endpoint
 * to validate caller Referer paths and to provide UI enrichment when a
 * registration omits cosmetic fields. THIS IS NOT A REGISTRY — products do
 * not appear in `listProducts()` until they actually call /register.
 */
export const KNOWN_PRODUCT_META: Readonly<
  Record<A11oyProductId, { displayName: string; basePath: string; accentColor: string }>
> = {
  amaru: {
    displayName: 'Amaru — The Andean Ouroboros',
    basePath: '/conduit/',
    accentColor: '#c9b787',
  },
  sentra: {
    displayName: 'Sentra — Cyber Resilience Command',
    basePath: '/sentra/',
    accentColor: '#22c55e',
  },
  counsel: {
    displayName: 'Counsel — Legal Matter Command',
    basePath: '/counsel/',
    accentColor: '#8b5cf6',
  },
  terra: {
    displayName: 'Terra — Real Estate Intelligence',
    basePath: '/terra/',
    accentColor: '#d4a054',
  },
  'carlota-jo': {
    displayName: 'Carlota Jo Consulting',
    basePath: '/carlota-jo/',
    accentColor: '#8b7ac8',
  },
  vessels: {
    displayName: 'Vessels — Maritime Intelligence',
    basePath: '/vessels/',
    accentColor: '#c9b787',
  },
};

function deriveHealth(lastSeen: string): ProductHealthStatus {
  const age = Date.now() - new Date(lastSeen).getTime();
  if (age > HEALTH_OFFLINE_MS) return 'offline';
  if (age > HEALTH_DEGRADED_MS) return 'degraded';
  return 'healthy';
}

export function registerProduct(reg: ProductRegistration): RegisteredProduct {
  const now = new Date().toISOString();
  const existing = products.get(reg.product);
  // Defensive: SDK callers may pass capabilities as bare strings; coerce them
  // into the ProductCapability shape so UI rendering (key={c.id}, c.label)
  // never sees undefined fields.
  const normalizedCapabilities: ProductCapability[] = (reg.capabilities ?? []).map((c) => {
    if (typeof c === 'string') {
      return { id: c, label: c, governanceClass: 'observation' };
    }
    return {
      id: c.id ?? c.label ?? 'capability',
      label: c.label ?? c.id ?? 'Capability',
      governanceClass: c.governanceClass ?? 'observation',
    };
  });
  // Merge in any capabilities buffered by sub-modules that registered before
  // this product booted (see `addProductCapability`).
  const buffered = pendingCapabilities.get(reg.product) ?? [];
  for (const c of buffered) {
    if (!normalizedCapabilities.some((n) => n.id === c.id)) {
      normalizedCapabilities.push(c);
    }
  }
  // Preserve capabilities previously attached to the existing record (so
  // re-registering a product doesn't drop sub-module advertisements).
  for (const c of existing?.capabilities ?? []) {
    if (!normalizedCapabilities.some((n) => n.id === c.id)) {
      normalizedCapabilities.push(c);
    }
  }
  const next: RegisteredProduct = {
    ...reg,
    capabilities: normalizedCapabilities,
    bootedAt: reg.bootedAt ?? now,
    registeredAt: existing?.registeredAt ?? now,
    lastSeen: now,
    health: 'healthy',
    recentProofCount: existing?.recentProofCount ?? 0,
    lastProofAt: existing?.lastProofAt,
    lastAction: existing?.lastAction,
    modelsUsed: existing?.modelsUsed ?? [],
  };
  products.set(reg.product, next);
  return next;
}

/**
 * Idempotently attach a capability to a product. Used by sub-modules (e.g.
 * Lexicon — task #4763) that want to advertise themselves as a child
 * capability of a parent product without overwriting the product's full
 * registration. Safe to call before the parent product has registered: the
 * capability is buffered and applied on the next register call via the
 * `pendingCapabilities` mechanism.
 */
const pendingCapabilities = new Map<A11oyProductId, ProductCapability[]>();

export function addProductCapability(
  product: A11oyProductId,
  capability: ProductCapability,
): void {
  const existing = products.get(product);
  if (existing) {
    if (!existing.capabilities.some((c) => c.id === capability.id)) {
      existing.capabilities = [...existing.capabilities, capability];
      products.set(product, existing);
    }
    return;
  }
  // Parent not yet registered — buffer and re-apply on next registerProduct.
  const buf = pendingCapabilities.get(product) ?? [];
  if (!buf.some((c) => c.id === capability.id)) {
    pendingCapabilities.set(product, [...buf, capability]);
  }
}

export function listProducts(): RegisteredProduct[] {
  const list: RegisteredProduct[] = [];
  for (const p of products.values()) {
    list.push({ ...p, health: deriveHealth(p.lastSeen) });
  }
  list.sort((a, b) => a.displayName.localeCompare(b.displayName));
  return list;
}

/**
 * Always-six view of the fabric. Live registrations are returned with their
 * full status; products that have never called `/register` show up as
 * `health: 'unregistered'` so the hub can render a six-tile grid that
 * surfaces missing products instead of silently hiding them.
 */
export function listAllProductsWithStatus(): RegisteredProduct[] {
  const out: RegisteredProduct[] = [];
  for (const id of A11OY_PRODUCT_IDS) {
    const live = products.get(id);
    if (live) {
      out.push({ ...live, health: deriveHealth(live.lastSeen) });
      continue;
    }
    const meta = KNOWN_PRODUCT_META[id];
    out.push({
      product: id,
      displayName: meta.displayName,
      basePath: meta.basePath,
      accentColor: meta.accentColor,
      capabilities: [],
      registeredAt: '',
      lastSeen: '',
      health: 'unregistered',
      recentProofCount: 0,
      modelsUsed: [],
    });
  }
  out.sort((a, b) => a.displayName.localeCompare(b.displayName));
  return out;
}

export function getProduct(id: A11oyProductId): RegisteredProduct | undefined {
  const p = products.get(id);
  if (!p) return undefined;
  return { ...p, health: deriveHealth(p.lastSeen) };
}

export interface EmitProofInput {
  product: A11oyProductId;
  kind: ProofKind;
  summary: string;
  deepLink?: string;
  relatedProduct?: A11oyProductId;
  payload?: Record<string, unknown>;
  modelUsed?: string;
}

export function appendProof(input: EmitProofInput): ProofLedgerEntry {
  const entry: ProofLedgerEntry = {
    id: `pf-${randomUUID().slice(0, 8)}`,
    product: input.product,
    kind: input.kind,
    summary: input.summary,
    deepLink: input.deepLink,
    relatedProduct: input.relatedProduct,
    payload: input.payload,
    ts: new Date().toISOString(),
  };
  proofs.unshift(entry);
  if (proofs.length > PROOF_LIMIT) proofs.length = PROOF_LIMIT;

  const p = products.get(input.product);
  if (p) {
    p.recentProofCount += 1;
    p.lastProofAt = entry.ts;
    p.lastAction = `${entry.kind}: ${entry.summary}`;
    p.lastSeen = entry.ts;
    p.health = 'healthy';
    if (input.modelUsed && !p.modelsUsed.includes(input.modelUsed)) {
      p.modelsUsed = [...p.modelsUsed, input.modelUsed].slice(-8);
    }
    products.set(input.product, p);
  }
  return entry;
}

export function listProofs(opts?: { product?: A11oyProductId; limit?: number }): ProofLedgerEntry[] {
  const limit = Math.min(Math.max(opts?.limit ?? 50, 1), PROOF_LIMIT);
  let out = proofs;
  if (opts?.product) out = out.filter((p) => p.product === opts.product);
  return out.slice(0, limit);
}

export function totalProofs(): number {
  return proofs.length;
}

/** Reset is exposed for tests only — avoids carrying state between vitest runs. */
export function __resetForTests(): void {
  products.clear();
  proofs.length = 0;
}
