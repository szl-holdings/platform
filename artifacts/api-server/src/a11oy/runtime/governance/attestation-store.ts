import { createHash, randomUUID } from 'node:crypto';
import { SEED_RATIONALE_ENVELOPES, SEED_ROUTING_WEIGHTS } from '@workspace/a11oy-fabric/seed';

export interface RationaleEnvelope {
  envelopeId: string;
  contentHash: string;
  signer: string;
  timestamp: string;
  nonce: string;
  rationale: Record<string, unknown>;
  structural: true;
}

export interface RoutingWeight {
  dimension: string;
  category: string;
  label: string;
  weight: number;
  seed: number;
  updatedBy: string;
  updatedAt: string;
}

const SIGNER = 'spiffe://a11oy.szl/verifier';

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonicalize).join(',') + ']';
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalize(obj[k])).join(',') + '}';
}

/**
 * Build a structural rationale envelope.
 *
 * `contentHash` is content-addressed over the canonicalized rationale
 * payload only (not envelopeId/timestamp/nonce). Two envelopes with the
 * same rationale body produce the same `contentHash` regardless of when
 * they were created or what id they were assigned — that is the
 * attestation contract.
 */
export function buildEnvelope(opts: {
  envelopeId: string;
  rationale: Record<string, unknown>;
  timestamp?: string;
  nonce?: string;
}): RationaleEnvelope {
  const timestamp = opts.timestamp ?? new Date().toISOString();
  const nonce = opts.nonce ?? randomUUID().slice(0, 8);
  const canonical = canonicalize(opts.rationale);
  const contentHash = 'sha256:' + createHash('sha256').update(canonical).digest('hex');
  return {
    envelopeId: opts.envelopeId,
    contentHash,
    signer: SIGNER,
    timestamp,
    nonce,
    rationale: opts.rationale,
    structural: true,
  };
}

const envelopes = new Map<string, RationaleEnvelope>();
const routingWeights = new Map<string, RoutingWeight>();
let weightSeed: RoutingWeight[] = [];

/**
 * Initialize envelopes and routing weights from the canonical seed sources
 * in `lib/a11oy-fabric/src/seed/`. The seed modules are the single source
 * of truth — the api-server only wraps them with hashing/audit metadata.
 */
function seedStores(): void {
  envelopes.clear();
  for (const seed of SEED_RATIONALE_ENVELOPES) {
    const env = buildEnvelope({
      envelopeId: seed.envelopeId,
      rationale: seed.rationale,
      timestamp: seed.timestamp,
      nonce: seed.nonce,
    });
    envelopes.set(env.envelopeId, env);
  }

  routingWeights.clear();
  const seedTs = new Date().toISOString();
  weightSeed = SEED_ROUTING_WEIGHTS.map(s => ({
    ...s,
    seed: s.weight,
    updatedBy: 'system:seed',
    updatedAt: seedTs,
  }));
  for (const w of weightSeed) routingWeights.set(w.dimension, { ...w });
}

seedStores();

export function getEnvelope(envelopeId: string): RationaleEnvelope | undefined {
  return envelopes.get(envelopeId);
}

export function listEnvelopes(): RationaleEnvelope[] {
  return [...envelopes.values()];
}

/** Re-builds the envelope deterministically using the current canonicalization
 * (used by Routing Weights demo so a fresh contentHash reflects any rationale
 * regeneration). The seed timestamp/nonce are preserved so contentHash stays stable
 * across reads — only the underlying rationale would shift it. */
export function regenerateEnvelope(envelopeId: string): RationaleEnvelope | undefined {
  const existing = envelopes.get(envelopeId);
  if (!existing) return undefined;
  const env = buildEnvelope({
    envelopeId: existing.envelopeId,
    rationale: existing.rationale,
    timestamp: existing.timestamp,
    nonce: existing.nonce,
  });
  envelopes.set(env.envelopeId, env);
  return env;
}

export function listRoutingWeights(): RoutingWeight[] {
  return [...routingWeights.values()].sort((a, b) => {
    if (a.category === b.category) return a.label.localeCompare(b.label);
    return a.category.localeCompare(b.category);
  });
}

export function updateRoutingWeight(dimension: string, weight: number, updatedBy: string): RoutingWeight | undefined {
  const existing = routingWeights.get(dimension);
  if (!existing) return undefined;
  if (!Number.isFinite(weight) || weight < 0 || weight > 1) return undefined;
  const next: RoutingWeight = {
    ...existing,
    weight,
    updatedBy: updatedBy || 'operator',
    updatedAt: new Date().toISOString(),
  };
  routingWeights.set(dimension, next);
  return next;
}

export function resetRoutingWeights(updatedBy: string): RoutingWeight[] {
  const ts = new Date().toISOString();
  for (const seed of weightSeed) {
    routingWeights.set(seed.dimension, {
      ...seed,
      weight: seed.seed,
      updatedBy: updatedBy || 'operator',
      updatedAt: ts,
    });
  }
  return listRoutingWeights();
}
