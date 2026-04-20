import { beforeEach, describe, expect, it } from 'vitest';
import { fuseConfidence } from '../confidence-fusion.js';
import { detectContradictions } from '../contradiction-detection.js';
import { domainReachability, findMultiDomainEntities, queryCrossDomain } from '../cross-domain.js';
import { mergeNodes, resolveAlias, resolveEntity } from '../entity-resolution.js';
import { rankEvidence, topEvidence } from '../evidence-ranking.js';
import { applyFreshnessDecay, freshnessScore } from '../freshness-decay.js';
import { inferCrossDomainSimilarity, inferTransitiveEdges } from '../relationship-inference.js';
import type { ConstellationEdge, ConstellationNode } from '../schema.js';
import { InMemoryGraphStore } from '../store.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeNode(overrides: Partial<ConstellationNode> & { id: string }): ConstellationNode {
  const now = new Date().toISOString();
  return {
    type: 'entity',
    label: 'Test Node',
    domain: 'terra',
    aliases: [],
    properties: {},
    provenance: {
      source: 'test',
      ingestedAt: now,
      method: 'api',
      confidence: 1,
    },
    freshness: {
      lastUpdatedAt: now,
      isStale: false,
    },
    confidence: 1,
    sensitivityTier: 'internal',
    linkedTraces: [],
    linkedActions: [],
    tags: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeEdge(
  overrides: Partial<ConstellationEdge> & { id: string; fromNodeId: string; toNodeId: string },
): ConstellationEdge {
  const now = new Date().toISOString();
  return {
    type: 'relates-to',
    weight: 1,
    provenance: {
      source: 'test',
      ingestedAt: now,
      method: 'api',
      confidence: 1,
    },
    confidence: 1,
    evidenceLinks: [],
    activeStatus: true,
    properties: {},
    linkedTraces: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// ─── Schema: new node types ────────────────────────────────────────────────────

describe('Schema — extended node types', () => {
  it('accepts all required spec node types', async () => {
    const { NodeTypeSchema } = await import('../schema.js');
    const requiredTypes = [
      'organization',
      'user',
      'vendor',
      'account',
      'property',
      'parcel',
      'lender',
      'matter',
      'filing',
      'clause',
      'obligation',
      'vessel',
      'voyage',
      'port',
      'counterparty',
      'sanctions_entity',
      'cyber_asset',
      'identity',
      'control',
      'incident',
      'workflow',
      'approval',
      'agent',
      'prompt',
      'model',
      'tool',
      'trace',
      'memory',
      'recommendation',
      'action',
      'evidence',
      'citation',
    ];
    for (const type of requiredTypes) {
      expect(NodeTypeSchema.safeParse(type).success, `type "${type}" should be valid`).toBe(true);
    }
  });

  it('accepts evidenceLinks and activeStatus on edges', async () => {
    const { ConstellationEdgeSchema } = await import('../schema.js');
    const now = new Date().toISOString();
    const result = ConstellationEdgeSchema.safeParse({
      id: 'e1',
      type: 'owns',
      fromNodeId: 'n1',
      toNodeId: 'n2',
      weight: 1,
      provenance: { source: 'test', ingestedAt: now, method: 'api', confidence: 1 },
      confidence: 0.9,
      evidenceLinks: ['ev-001'],
      activeStatus: true,
      properties: {},
      linkedTraces: [],
      createdAt: now,
      updatedAt: now,
    });
    expect(result.success).toBe(true);
    expect(result.data?.evidenceLinks).toEqual(['ev-001']);
    expect(result.data?.activeStatus).toBe(true);
  });

  it('accepts aliases on nodes', async () => {
    const { ConstellationNodeSchema } = await import('../schema.js');
    const now = new Date().toISOString();
    const result = ConstellationNodeSchema.safeParse(
      makeNode({
        id: 'n1',
        aliases: [{ aliasType: 'imo', aliasValue: 'IMO1234567', isPrimary: true }],
      }),
    );
    expect(result.success).toBe(true);
    expect(result.data?.aliases).toHaveLength(1);
  });

  it('accepts impactScore on nodes', async () => {
    const { ConstellationNodeSchema } = await import('../schema.js');
    const now = new Date().toISOString();
    const result = ConstellationNodeSchema.safeParse(makeNode({ id: 'n1', impactScore: 8.5 }));
    expect(result.success).toBe(true);
    expect(result.data?.impactScore).toBe(8.5);
  });
});

// ─── Store: alias index ────────────────────────────────────────────────────────

describe('InMemoryGraphStore — alias index', () => {
  let store: InMemoryGraphStore;

  beforeEach(() => {
    store = new InMemoryGraphStore();
  });

  it('indexes aliases on upsert', () => {
    const node = makeNode({
      id: 'n1',
      aliases: [{ aliasType: 'imo', aliasValue: 'IMO1234567', isPrimary: true }],
    });
    store.upsertNode(node);
    const found = store.lookupByAlias('imo', 'IMO1234567');
    expect(found?.id).toBe('n1');
  });

  it('removes alias index on deleteNode', () => {
    const node = makeNode({
      id: 'n1',
      aliases: [{ aliasType: 'imo', aliasValue: 'IMO9999999', isPrimary: true }],
    });
    store.upsertNode(node);
    store.deleteNode('n1');
    expect(store.lookupByAlias('imo', 'IMO9999999')).toBeUndefined();
  });

  it('returns undefined for unknown alias', () => {
    expect(store.lookupByAlias('imo', 'NOPE')).toBeUndefined();
  });

  it('removes stale alias key when aliases change on update', () => {
    const node = makeNode({
      id: 'n1',
      aliases: [{ aliasType: 'imo', aliasValue: 'OLD_IMO', isPrimary: true }],
    });
    store.upsertNode(node);
    expect(store.lookupByAlias('imo', 'OLD_IMO')?.id).toBe('n1');

    const updated = {
      ...node,
      aliases: [{ aliasType: 'imo', aliasValue: 'NEW_IMO', isPrimary: true }],
    };
    store.upsertNode(updated);

    expect(store.lookupByAlias('imo', 'OLD_IMO')).toBeUndefined();
    expect(store.lookupByAlias('imo', 'NEW_IMO')?.id).toBe('n1');
  });
});

// ─── Entity Resolution ────────────────────────────────────────────────────────

describe('Entity Resolution', () => {
  let store: InMemoryGraphStore;

  beforeEach(() => {
    store = new InMemoryGraphStore();
    store.upsertNode(
      makeNode({
        id: 'vessel-1',
        label: 'MV Atlantic',
        domain: 'vessels',
        type: 'vessel',
        aliases: [
          { aliasType: 'imo', aliasValue: 'IMO9876543', isPrimary: true },
          { aliasType: 'mmsi', aliasValue: '123456789', isPrimary: false },
        ],
      }),
    );
  });

  it('resolves by alias type + value', () => {
    const result = resolveAlias(store, 'imo', 'IMO9876543');
    expect(result).not.toBeNull();
    expect(result!.canonical.id).toBe('vessel-1');
    expect(result!.resolvedFromAlias).toBe(true);
  });

  it('resolves by direct node id', () => {
    const result = resolveEntity(store, 'vessel-1');
    expect(result!.resolvedFromAlias).toBe(false);
    expect(result!.canonical.id).toBe('vessel-1');
  });

  it('resolves by alias value without specifying type', () => {
    const result = resolveEntity(store, 'IMO9876543');
    expect(result).not.toBeNull();
    expect(result!.canonical.id).toBe('vessel-1');
  });

  it('returns null for unknown entity', () => {
    expect(resolveEntity(store, 'unknown-xyz')).toBeNull();
  });

  it('merges two nodes: absorbs source aliases into target', () => {
    store.upsertNode(
      makeNode({
        id: 'vessel-2',
        label: 'MV Atlantic Duplicate',
        domain: 'vessels',
        type: 'vessel',
        aliases: [{ aliasType: 'imo', aliasValue: 'IMO9876543-dup', isPrimary: false }],
        confidence: 0.7,
      }),
    );

    const result = mergeNodes(store, 'vessel-1', 'vessel-2');
    expect(result).not.toBeNull();
    expect(result!.absorbedId).toBe('vessel-2');
    expect(store.getNode('vessel-2')).toBeUndefined();
    const merged = store.getNode('vessel-1');
    expect(merged!.aliases.some((a) => a.aliasValue === 'IMO9876543-dup')).toBe(true);
    expect(merged!.aliases.some((a) => a.aliasValue === 'vessel-2')).toBe(true);
    expect(merged!.confidence).toBeCloseTo((1.0 + 0.7) / 2);
  });

  it('mergeNodes rewires source edges to target, no dangling edges', () => {
    const now = new Date().toISOString();
    store.upsertNode(makeNode({ id: 'third-party', domain: 'prism', label: 'Legal Matter' }));
    store.upsertEdge(
      makeEdge({ id: 'src-edge', fromNodeId: 'vessel-2-id', toNodeId: 'third-party' }),
    );

    store.upsertNode(
      makeNode({
        id: 'vessel-2-id',
        label: 'MV Dup',
        domain: 'vessels',
        type: 'vessel',
        aliases: [],
        confidence: 0.8,
      }),
    );

    mergeNodes(store, 'vessel-1', 'vessel-2-id');

    const remaining = store.listEdges();
    const danglers = remaining.filter(
      (e) => e.fromNodeId === 'vessel-2-id' || e.toNodeId === 'vessel-2-id',
    );
    expect(danglers).toHaveLength(0);
    const rewired = remaining.filter(
      (e) => e.fromNodeId === 'vessel-1' || e.toNodeId === 'vessel-1',
    );
    expect(rewired.length).toBeGreaterThan(0);
  });
});

// ─── Relationship Inference ───────────────────────────────────────────────────

describe('Relationship Inference', () => {
  let store: InMemoryGraphStore;

  beforeEach(() => {
    store = new InMemoryGraphStore();
    ['n1', 'n2', 'n3'].forEach((id) => store.upsertNode(makeNode({ id })));
    store.upsertEdge(makeEdge({ id: 'e1', fromNodeId: 'n1', toNodeId: 'n2', type: 'owns' }));
    store.upsertEdge(makeEdge({ id: 'e2', fromNodeId: 'n2', toNodeId: 'n3', type: 'owns' }));
  });

  it('infers transitive owns edge n1→n3', () => {
    const inferred = inferTransitiveEdges(store, 'owns');
    expect(inferred.some((e) => e.fromNodeId === 'n1' && e.toNodeId === 'n3')).toBe(true);
  });

  it('does not duplicate existing edges', () => {
    store.upsertEdge(makeEdge({ id: 'e3', fromNodeId: 'n1', toNodeId: 'n3', type: 'owns' }));
    const inferred = inferTransitiveEdges(store, 'owns');
    expect(inferred.some((e) => e.fromNodeId === 'n1' && e.toNodeId === 'n3')).toBe(false);
  });

  it('infers cross-domain similarity via shared alias value', () => {
    store.upsertNode(
      makeNode({
        id: 'xa',
        domain: 'aegis',
        aliases: [{ aliasType: 'external_id', aliasValue: 'SHARED-001', isPrimary: false }],
      }),
    );
    store.upsertNode(
      makeNode({
        id: 'xb',
        domain: 'vessels',
        aliases: [{ aliasType: 'external_id', aliasValue: 'SHARED-001', isPrimary: false }],
      }),
    );

    const inferred = inferCrossDomainSimilarity(store);
    expect(
      inferred.some(
        (e) =>
          new Set([e.fromNodeId, e.toNodeId]).size === 2 &&
          [e.fromNodeId, e.toNodeId].includes('xa') &&
          [e.fromNodeId, e.toNodeId].includes('xb'),
      ),
    ).toBe(true);
  });
});

// ─── Contradiction Detection ──────────────────────────────────────────────────

describe('Contradiction Detection', () => {
  let store: InMemoryGraphStore;

  beforeEach(() => {
    store = new InMemoryGraphStore();
  });

  it('detects contradictory edge types between same pair', () => {
    store.upsertNode(makeNode({ id: 'a' }));
    store.upsertNode(makeNode({ id: 'b' }));
    store.upsertEdge(makeEdge({ id: 'e1', fromNodeId: 'a', toNodeId: 'b', type: 'owns' }));
    store.upsertEdge(makeEdge({ id: 'e2', fromNodeId: 'a', toNodeId: 'b', type: 'managed-by' }));

    const contradictions = detectContradictions(store);
    expect(contradictions.some((c) => c.type === 'edge')).toBe(true);
  });

  it('detects duplicate alias claimed by multiple nodes', () => {
    store.upsertNode(
      makeNode({
        id: 'p1',
        aliases: [{ aliasType: 'ein', aliasValue: '12-3456789', isPrimary: true }],
      }),
    );
    store.upsertNode(
      makeNode({
        id: 'p2',
        aliases: [{ aliasType: 'ein', aliasValue: '12-3456789', isPrimary: false }],
      }),
    );

    const contradictions = detectContradictions(store);
    expect(contradictions.some((c) => c.type === 'property')).toBe(true);
  });

  it('detects supersession contradiction', () => {
    const now = new Date().toISOString();
    store.upsertNode(makeNode({ id: 'old', freshness: { lastUpdatedAt: now, isStale: false } }));
    store.upsertNode(makeNode({ id: 'new', freshness: { lastUpdatedAt: now, isStale: false } }));
    store.upsertEdge(
      makeEdge({ id: 'sup', fromNodeId: 'new', toNodeId: 'old', type: 'supersedes' }),
    );

    const contradictions = detectContradictions(store);
    expect(contradictions.some((c) => c.type === 'supersession')).toBe(true);
  });
});

// ─── Evidence Ranking ─────────────────────────────────────────────────────────

describe('Evidence Ranking', () => {
  it('ranks higher-confidence evidence first', () => {
    const now = new Date().toISOString();
    const items = [
      { id: 'e1', edgeId: 'x', evidenceType: 'doc', confidence: 0.6, recordedAt: now },
      { id: 'e2', edgeId: 'x', evidenceType: 'doc', confidence: 0.95, recordedAt: now },
      { id: 'e3', edgeId: 'x', evidenceType: 'doc', confidence: 0.3, recordedAt: now },
    ];
    const ranked = rankEvidence(items);
    expect(ranked[0]!.id).toBe('e2');
    expect(ranked[ranked.length - 1]!.id).toBe('e3');
  });

  it('returns correct rank indices', () => {
    const now = new Date().toISOString();
    const items = [
      { id: 'e1', edgeId: 'x', evidenceType: 'doc', confidence: 0.5, recordedAt: now },
      { id: 'e2', edgeId: 'x', evidenceType: 'doc', confidence: 0.9, recordedAt: now },
    ];
    const ranked = rankEvidence(items);
    expect(ranked.find((r) => r.id === 'e2')!.rank).toBe(1);
    expect(ranked.find((r) => r.id === 'e1')!.rank).toBe(2);
  });

  it('prefers API source over manual source', () => {
    const now = new Date().toISOString();
    const items = [
      {
        id: 'api',
        edgeId: 'x',
        evidenceType: 'doc',
        confidence: 0.7,
        recordedAt: now,
        sourceType: 'api',
      },
      {
        id: 'manual',
        edgeId: 'x',
        evidenceType: 'doc',
        confidence: 0.7,
        recordedAt: now,
        sourceType: 'manual',
      },
    ];
    const ranked = rankEvidence(items);
    expect(ranked[0]!.id).toBe('api');
  });

  it('topEvidence returns null for empty input', () => {
    expect(topEvidence([])).toBeNull();
  });
});

// ─── Freshness Decay ──────────────────────────────────────────────────────────

describe('Freshness Decay', () => {
  let store: InMemoryGraphStore;

  beforeEach(() => {
    store = new InMemoryGraphStore();
  });

  it('marks a node stale when TTL has elapsed', () => {
    const past = new Date(Date.now() - 10 * 3600 * 1000).toISOString();
    store.upsertNode(
      makeNode({
        id: 'stale-node',
        freshness: { lastUpdatedAt: past, ttlSeconds: 3600, isStale: false },
        confidence: 1.0,
      }),
    );

    const result = applyFreshnessDecay(store);
    expect(result.markedStale).toBe(1);
    const node = store.getNode('stale-node')!;
    expect(node.freshness.isStale).toBe(true);
    expect(node.confidence).toBeLessThan(1.0);
  });

  it('does not mark a fresh node stale', () => {
    store.upsertNode(
      makeNode({
        id: 'fresh-node',
        freshness: { lastUpdatedAt: new Date().toISOString(), ttlSeconds: 3600, isStale: false },
      }),
    );

    const result = applyFreshnessDecay(store);
    expect(result.markedStale).toBe(0);
  });

  it('un-marks a stale node when freshness is restored', () => {
    const recent = new Date().toISOString();
    store.upsertNode(
      makeNode({
        id: 'was-stale',
        freshness: { lastUpdatedAt: recent, ttlSeconds: 3600, isStale: true },
      }),
    );

    const result = applyFreshnessDecay(store);
    expect(result.refreshed).toBe(1);
    expect(store.getNode('was-stale')!.freshness.isStale).toBe(false);
  });

  it('freshnessScore returns ~1 for a brand-new node', () => {
    const node = makeNode({
      id: 'new',
      freshness: { lastUpdatedAt: new Date().toISOString(), ttlSeconds: 3600, isStale: false },
    });
    const score = freshnessScore(node);
    expect(score).toBeGreaterThan(0.99);
  });

  it('freshnessScore returns 0 for fully expired node', () => {
    const node = makeNode({
      id: 'exp',
      freshness: {
        lastUpdatedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        ttlSeconds: 3600,
        isStale: true,
      },
    });
    const score = freshnessScore(node);
    expect(score).toBe(0);
  });
});

// ─── Confidence Fusion ────────────────────────────────────────────────────────

describe('Confidence Fusion', () => {
  it('weighted_average fuses correctly', () => {
    const { fused } = fuseConfidence([
      { value: 1.0, weight: 2 },
      { value: 0.0, weight: 2 },
    ]);
    expect(fused).toBeCloseTo(0.5);
  });

  it('bayesian fusion increases overall confidence', () => {
    const { fused } = fuseConfidence([{ value: 0.6 }, { value: 0.8 }], 'bayesian');
    expect(fused).toBeGreaterThan(0.8);
  });

  it('min strategy returns the smallest value', () => {
    const { fused } = fuseConfidence([{ value: 0.9 }, { value: 0.3 }, { value: 0.7 }], 'min');
    expect(fused).toBeCloseTo(0.3);
  });

  it('max strategy returns the largest value', () => {
    const { fused } = fuseConfidence([{ value: 0.9 }, { value: 0.3 }, { value: 0.7 }], 'max');
    expect(fused).toBeCloseTo(0.9);
  });

  it('returns 0 for empty signals', () => {
    expect(fuseConfidence([]).fused).toBe(0);
  });

  it('clamps output to [0, 1]', () => {
    const { fused } = fuseConfidence([{ value: 2.0 }]);
    expect(fused).toBe(1);
  });
});

// ─── Cross-Domain Queries ─────────────────────────────────────────────────────

describe('Cross-Domain Queries', () => {
  let store: InMemoryGraphStore;

  beforeEach(() => {
    store = new InMemoryGraphStore();
    store.upsertNode(makeNode({ id: 'v1', domain: 'vessels', type: 'vessel', label: 'MV Seed' }));
    store.upsertNode(
      makeNode({ id: 'l1', domain: 'prism', type: 'matter', label: 'Legal Matter' }),
    );
    store.upsertNode(
      makeNode({ id: 'a1', domain: 'aegis', type: 'incident', label: 'Cyber Incident' }),
    );
    store.upsertEdge(makeEdge({ id: 'e1', fromNodeId: 'v1', toNodeId: 'l1', type: 'relates-to' }));
    store.upsertEdge(makeEdge({ id: 'e2', fromNodeId: 'l1', toNodeId: 'a1', type: 'affects' }));
  });

  it('queryCrossDomain returns nodes in different domains', () => {
    const result = queryCrossDomain(store, 'v1', { maxHops: 2 });
    expect(result.domainsCovered).toContain('prism');
    expect(result.domainsCovered).toContain('aegis');
    expect(result.nodes.some((n) => n.node.id === 'l1')).toBe(true);
    expect(result.nodes.some((n) => n.node.id === 'a1')).toBe(true);
  });

  it('queryCrossDomain filters by targetDomains', () => {
    const result = queryCrossDomain(store, 'v1', { maxHops: 2, targetDomains: ['aegis'] });
    expect(result.nodes.every((n) => n.domain === 'aegis')).toBe(true);
  });

  it('queryCrossDomain returns empty for unknown seed', () => {
    const result = queryCrossDomain(store, 'nonexistent', {});
    expect(result.nodes).toHaveLength(0);
  });

  it('findMultiDomainEntities finds shared alias values across domains', () => {
    store.upsertNode(
      makeNode({
        id: 'mx1',
        domain: 'terra',
        aliases: [{ aliasType: 'ein', aliasValue: 'SHARED', isPrimary: false }],
      }),
    );
    store.upsertNode(
      makeNode({
        id: 'mx2',
        domain: 'vessels',
        aliases: [{ aliasType: 'ein', aliasValue: 'SHARED', isPrimary: false }],
      }),
    );

    const results = findMultiDomainEntities(store);
    expect(results.some((r) => r.aliasValue === 'SHARED')).toBe(true);
  });

  it('domainReachability returns counts per domain', () => {
    const counts = domainReachability(store, 'v1', 3);
    expect(counts['prism']).toBeGreaterThanOrEqual(1);
    expect(counts['aegis']).toBeGreaterThanOrEqual(1);
  });
});
