import { createHash, randomUUID } from 'node:crypto';

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

export function buildEnvelope(opts: {
  envelopeId: string;
  rationale: Record<string, unknown>;
  timestamp?: string;
  nonce?: string;
}): RationaleEnvelope {
  const timestamp = opts.timestamp ?? new Date().toISOString();
  const nonce = opts.nonce ?? randomUUID().slice(0, 8);
  const canonical = canonicalize({ envelopeId: opts.envelopeId, rationale: opts.rationale, timestamp, nonce });
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

interface RationaleSeed {
  envelopeId: string;
  rationale: Record<string, unknown>;
  timestamp: string;
  nonce: string;
}

const RATIONALE_SEEDS: RationaleSeed[] = [
  {
    envelopeId: 'env-chain-001-n3',
    timestamp: '2026-04-25T03:52:30Z',
    nonce: 'a8f3c2b1',
    rationale: {
      chainId: 'chain-001',
      nodeId: 'n3',
      domain: 'Maritime',
      actor: 'Cascade Navigator',
      summary: 'Recommend port standby at anchorage 1.28N 103.67E for MV Cascade.',
      reasoningTrace: [
        { type: 'premise', content: 'MV Cascade ETA delayed 18h due to Tanjung Pelepas port congestion (AIS feed confirmed)', confidence: 0.98 },
        { type: 'premise', content: 'Demurrage contract clause 4.2: $14,200/day rate applies after 24h delay', confidence: 0.99 },
        { type: 'premise', content: 'Historical standby at alternative anchorage saves avg $42,000 per event (12 prior cases)', confidence: 0.94 },
        { type: 'inference', content: 'Port standby at anchorage 1.28N 103.67E reduces demurrage exposure by ~$42K vs. waiting at berth', confidence: 0.96 },
        { type: 'inference', content: 'No alternative port within 6h offers lower total cost when factoring fuel + port charges', confidence: 0.92 },
        { type: 'conclusion', content: 'Recommend port standby at anchorage 1.28N 103.67E. Expected savings: $42,000. MirrorEval: 94%.', confidence: 0.945 },
      ],
      evidenceRefs: ['action-brief-cascade'],
    },
  },
  {
    envelopeId: 'env-chain-002-n3',
    timestamp: '2026-04-24T18:44:30Z',
    nonce: 'b7e2d1c0',
    rationale: {
      chainId: 'chain-002',
      nodeId: 'n3',
      domain: 'Defense',
      actor: 'Guardian',
      summary: 'Escalate TG-Ember to ORANGE; apply 14 perimeter hardening rules.',
      reasoningTrace: [
        { type: 'premise', content: 'TG-Ember C2 beacons detected on ports 443 and 8080 from 3 internal hosts', confidence: 0.97 },
        { type: 'premise', content: 'TG-Ember TTPs match known APT campaign (MITRE ATT&CK T1071, T1041)', confidence: 0.95 },
        { type: 'inference', content: 'Confidence-weighted threat score exceeds ORANGE threshold (0.92 > 0.90)', confidence: 0.96 },
        { type: 'conclusion', content: 'Escalate to ORANGE. Apply 14 perimeter hardening rules. Notify CISO.', confidence: 0.96 },
      ],
      evidenceRefs: ['guardian-brief-01'],
    },
  },
  {
    envelopeId: 'env-chain-003-n3',
    timestamp: '2026-04-24T08:05:00Z',
    nonce: 'c6d3e2f1',
    rationale: {
      chainId: 'chain-003',
      nodeId: 'n3',
      domain: 'Legal',
      actor: 'Counsel Sentinel',
      summary: 'Immediate escalation to lead counsel + co-counsel for Talbot discovery.',
      reasoningTrace: [
        { type: 'premise', content: '340 documents remain outstanding with T-48h discovery deadline', confidence: 0.99 },
        { type: 'premise', content: 'Opposing counsel has filed late in 3 of 5 prior cases — adverse inference motion risk is HIGH', confidence: 0.94 },
        { type: 'inference', content: 'Production rate of 15 docs/hour requires 22.7h — exceeds available time by 4.7h', confidence: 0.97 },
        { type: 'conclusion', content: 'Immediate escalation to lead counsel + co-counsel required. Risk: adverse inference motion.', confidence: 0.97 },
      ],
      evidenceRefs: ['counsel-brief-001'],
    },
  },
];

const ROUTING_WEIGHT_SEEDS: Array<Pick<RoutingWeight, 'dimension' | 'category' | 'label' | 'weight'>> = [
  { dimension: 'model:fast_triage',        category: 'Model Tier', label: 'Fast Triage (sub-500ms)',   weight: 0.85 },
  { dimension: 'model:deep_reasoning',     category: 'Model Tier', label: 'Deep Reasoning',            weight: 0.78 },
  { dimension: 'model:long_context',       category: 'Model Tier', label: 'Long Context (>64k)',       weight: 0.62 },
  { dimension: 'model:code_analysis',      category: 'Model Tier', label: 'Code Analysis',             weight: 0.55 },
  { dimension: 'model:document_analysis',  category: 'Model Tier', label: 'Document Analysis',         weight: 0.60 },
  { dimension: 'model:eval_judge',         category: 'Model Tier', label: 'Eval Judge (deterministic)',weight: 0.95 },
  { dimension: 'model:board_packet',       category: 'Model Tier', label: 'Board Packet Synthesis',    weight: 0.50 },
  { dimension: 'model:proof_reconstruction', category: 'Model Tier', label: 'Proof Reconstruction',    weight: 0.70 },

  { dimension: 'agent:auto',               category: 'Agent Class', label: 'Auto (no human)',          weight: 0.30 },
  { dimension: 'agent:operator',           category: 'Agent Class', label: 'Operator-tier',            weight: 0.55 },
  { dimension: 'agent:executive',          category: 'Agent Class', label: 'Executive-tier',           weight: 0.75 },
  { dimension: 'agent:board',              category: 'Agent Class', label: 'Board-tier',               weight: 0.90 },

  { dimension: 'tool:mesh',                category: 'Tool Family', label: 'Tool Mesh',                weight: 0.65 },
  { dimension: 'tool:connector',           category: 'Tool Family', label: 'Connector Hub',            weight: 0.55 },
  { dimension: 'tool:mcp',                 category: 'Tool Family', label: 'MCP Gateway',              weight: 0.50 },

  { dimension: 'vertical:lyte-revenue',    category: 'Vertical', label: 'Lyte Revenue',                weight: 0.60 },
  { dimension: 'vertical:vessels-maritime',category: 'Vertical', label: 'Vessels Maritime',            weight: 0.70 },
  { dimension: 'vertical:terra-real-estate',category: 'Vertical', label: 'Terra Real Estate',          weight: 0.65 },
  { dimension: 'vertical:aegis-defense',   category: 'Vertical', label: 'Aegis Defense',               weight: 0.80 },
  { dimension: 'vertical:prism-counsel',   category: 'Vertical', label: 'Prism Counsel',               weight: 0.75 },
  { dimension: 'vertical:carlota-jo',      category: 'Vertical', label: 'Carlota Jo',                  weight: 0.45 },
  { dimension: 'vertical:alloy-core',      category: 'Vertical', label: 'Alloy Core',                  weight: 0.50 },
];

function seedStores(): void {
  envelopes.clear();
  for (const seed of RATIONALE_SEEDS) {
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
  weightSeed = ROUTING_WEIGHT_SEEDS.map(s => ({
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
