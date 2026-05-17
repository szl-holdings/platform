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

import { createHash, randomUUID } from 'node:crypto';
import {
  LambdaSpanEmitter,
  type LambdaAxes,
  type VspLicense,
} from '@szl-holdings/vsp-otel';
import { logger } from '../lib/logger.js';

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
  // If hydrate-on-boot ran before this product registered, replay its
  // historical aggregates (recentProofCount / lastProofAt / lastAction /
  // modelsUsed) from the side-map populated in `hydrateProofsFromDb`. This
  // preserves the audit-trail continuity across restarts even when the
  // product re-registers AFTER hydrate.
  const hydrated = !existing ? hydratedProductStats.get(reg.product) : undefined;
  const next: RegisteredProduct = {
    ...reg,
    capabilities: normalizedCapabilities,
    bootedAt: reg.bootedAt ?? now,
    registeredAt: existing?.registeredAt ?? now,
    lastSeen: now,
    health: 'healthy',
    recentProofCount: existing?.recentProofCount ?? hydrated?.recentProofCount ?? 0,
    lastProofAt: existing?.lastProofAt ?? hydrated?.lastProofAt,
    lastAction: existing?.lastAction ?? hydrated?.lastAction,
    modelsUsed: existing?.modelsUsed ?? hydrated?.modelsUsed ?? [],
  };
  products.set(reg.product, next);
  // Once the live product record absorbs the hydrated aggregates, drop the
  // side-map entry so subsequent appendProof calls flow through the live
  // record (avoiding double-counting).
  hydratedProductStats.delete(reg.product);
  return next;
}

interface HydratedProductStats {
  recentProofCount: number;
  lastProofAt?: string;
  lastAction?: string;
  modelsUsed: string[];
}

const hydratedProductStats = new Map<A11oyProductId, HydratedProductStats>();

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

  applyProofToProduct(entry, input.modelUsed);

  // Fire-and-forget durable write to the proof_ledger table (task #4879).
  // We deliberately do NOT await — appendProof is a hot synchronous call
  // path used by every orchestration route. The DB layer is loaded lazily
  // so unit tests that mount only this module without a DATABASE_URL keep
  // working (see a11oy-orchestration.test.ts).
  void persistProof(entry, input.modelUsed);

  // Fire-and-forget VSP span emission (task #5053). Every proof that flows
  // through the A11oy fabric becomes a verifiable OTel span whose traceId
  // is derived from the receipt hash. Failures are logged and swallowed
  // like `persistProof` so we never block (or break) the orchestration hot
  // path on observability concerns.
  emitProofSpan(entry, input.modelUsed);

  return entry;
}

const proofSpanEmitter = new LambdaSpanEmitter({ tracerName: 'a11oy-orchestration' });

/**
 * Build the deterministic SHA-256 hash that anchors a proof's VSP receipt.
 * Hashes a stable canonical form of the proof so the same proof always
 * produces the same traceId — auditors can independently re-derive it from
 * the durable `proof_ledger` row.
 */
function receiptHashForProof(entry: ProofLedgerEntry, modelUsed: string | undefined): string {
  const canonical = JSON.stringify({
    id: entry.id,
    product: entry.product,
    kind: entry.kind,
    summary: entry.summary,
    deepLink: entry.deepLink ?? null,
    relatedProduct: entry.relatedProduct ?? null,
    modelUsed: modelUsed ?? null,
    ts: entry.ts,
  });
  return createHash('sha256').update(canonical).digest('hex');
}

/**
 * Pull any Λ-axis scores that callers happened to drop into the proof
 * payload under a `lambdaAxes` key. Unknown / non-finite values are
 * ignored; missing payload yields `undefined` so the emitter doesn't
 * stamp empty axis attributes.
 */
function extractLambdaAxes(payload: Record<string, unknown> | undefined): LambdaAxes | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const raw = (payload as { lambdaAxes?: unknown }).lambdaAxes;
  if (!raw || typeof raw !== 'object') return undefined;
  const axisKeys: readonly (keyof LambdaAxes)[] = [
    'cleanliness',
    'horizon',
    'resonance',
    'frustum',
    'gaussClosure',
    'invariance',
    'moralGrounding',
    'ontologicalGrounding',
    'measurabilityHonesty',
  ];
  const out: LambdaAxes = {};
  let any = false;
  for (const k of axisKeys) {
    const v = (raw as Record<string, unknown>)[k];
    if (typeof v === 'number' && Number.isFinite(v)) {
      out[k] = v;
      any = true;
    }
  }
  return any ? out : undefined;
}

function emitProofSpan(entry: ProofLedgerEntry, modelUsed: string | undefined): void {
  try {
    const hash = receiptHashForProof(entry, modelUsed);
    const license: VspLicense = 'Apache-2.0';
    const span = proofSpanEmitter.emit(
      {
        hash,
        name: `a11oy.proof.${entry.kind}`,
        endpoint: entry.kind,
        license,
        lambdaAxes: extractLambdaAxes(entry.payload),
        ts: entry.ts,
      },
      { endImmediately: false },
    );
    // Stamp proof-shaped attributes so VSP consumers (and the JSON exporter
    // in tests) can correlate the span back to the ledger row without
    // needing to re-query the orchestration store.
    span.setAttribute('a11oy.proof.id', entry.id);
    span.setAttribute('a11oy.product', entry.product);
    span.setAttribute('a11oy.proof.kind', entry.kind);
    span.setAttribute('a11oy.proof.summary', entry.summary);
    if (entry.relatedProduct) {
      span.setAttribute('a11oy.related_product', entry.relatedProduct);
    }
    if (entry.deepLink) {
      span.setAttribute('a11oy.deep_link', entry.deepLink);
    }
    if (modelUsed) {
      span.setAttribute('a11oy.model_used', modelUsed);
    }
    span.end();
  } catch (err) {
    logger.warn({ err, proofId: entry.id }, '[orchestration-store] proof span emit failed');
  }
}

function applyProofToProduct(entry: ProofLedgerEntry, modelUsed: string | undefined): void {
  const p = products.get(entry.product);
  if (!p) return;
  p.recentProofCount += 1;
  p.lastProofAt = entry.ts;
  p.lastAction = `${entry.kind}: ${entry.summary}`;
  p.lastSeen = entry.ts;
  p.health = 'healthy';
  if (modelUsed && !p.modelsUsed.includes(modelUsed)) {
    p.modelsUsed = [...p.modelsUsed, modelUsed].slice(-8);
  }
  products.set(entry.product, p);
}

async function persistProof(entry: ProofLedgerEntry, modelUsed: string | undefined): Promise<void> {
  try {
    const { db, proofLedgerTable } = await import('@szl-holdings/db');
    await db
      .insert(proofLedgerTable)
      .values({
        id: entry.id,
        product: entry.product,
        kind: entry.kind,
        summary: entry.summary,
        deepLink: entry.deepLink,
        relatedProduct: entry.relatedProduct,
        modelUsed,
        payload: entry.payload ?? {},
        ts: new Date(entry.ts),
      })
      .onConflictDoNothing();
  } catch (err) {
    logger.warn({ err, proofId: entry.id }, '[orchestration-store] proof persist failed');
  }
}

/**
 * Restore the in-memory proof ring from the durable `proof_ledger` table
 * (task #4879). Loads the most recent PROOF_LIMIT rows, replaces the
 * in-memory ring, and replays per-product aggregates so any product that
 * subsequently re-registers picks up its prior recentProofCount /
 * lastProofAt / modelsUsed without losing history across restarts.
 *
 * Safe to call multiple times; each call resets the in-memory ring to the
 * authoritative DB state.
 */
export async function hydrateProofsFromDb(): Promise<number> {
  try {
    const dbMod = await import('@szl-holdings/db');
    const { db, proofLedgerTable } = dbMod;
    const { desc } = await import('drizzle-orm');
    const rows = await db
      .select()
      .from(proofLedgerTable)
      .orderBy(desc(proofLedgerTable.ts))
      .limit(PROOF_LIMIT);

    proofs.length = 0;
    // Reset per-product proof aggregates so we don't double-count if hydrate
    // is invoked more than once. The product registration itself is left
    // untouched — products are only added by /register calls.
    for (const p of products.values()) {
      p.recentProofCount = 0;
      p.lastProofAt = undefined;
      p.lastAction = undefined;
      p.modelsUsed = [];
    }
    hydratedProductStats.clear();

    // Rows come back newest-first; the ring also stores newest-first, so
    // push directly. To replay product aggregates correctly (counts +
    // model-usage history) we walk the rows oldest-first via reverse iter.
    for (const r of rows) {
      const entry: ProofLedgerEntry = {
        id: r.id,
        product: r.product as A11oyProductId,
        kind: r.kind as ProofKind,
        summary: r.summary,
        deepLink: r.deepLink ?? undefined,
        relatedProduct: (r.relatedProduct ?? undefined) as A11oyProductId | undefined,
        payload: (r.payload as Record<string, unknown> | null) ?? undefined,
        ts: new Date(r.ts).toISOString(),
      };
      proofs.push(entry);
    }
    for (let i = rows.length - 1; i >= 0; i--) {
      const r = rows[i];
      const entry = proofs[i];
      const modelUsed = r.modelUsed ?? undefined;
      if (products.has(entry.product)) {
        applyProofToProduct(entry, modelUsed);
      } else {
        // Product hasn't registered yet (typical on cold boot — child apps
        // only call /register after the api-server is up). Park the
        // aggregate in the side-map so registerProduct can absorb it later.
        const stats = hydratedProductStats.get(entry.product) ?? {
          recentProofCount: 0,
          modelsUsed: [],
        };
        stats.recentProofCount += 1;
        stats.lastProofAt = entry.ts;
        stats.lastAction = `${entry.kind}: ${entry.summary}`;
        if (modelUsed && !stats.modelsUsed.includes(modelUsed)) {
          stats.modelsUsed = [...stats.modelsUsed, modelUsed].slice(-8);
        }
        hydratedProductStats.set(entry.product, stats);
      }
    }

    logger.info({ count: rows.length }, '[orchestration-store] proof ledger hydrated');
    return rows.length;
  } catch (err) {
    logger.warn({ err }, '[orchestration-store] proof ledger hydrate failed (non-fatal)');
    return 0;
  }
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
  hydratedProductStats.clear();
}
