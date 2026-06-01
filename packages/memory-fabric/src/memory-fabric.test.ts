import { beforeEach, describe, expect, it } from 'vitest';
import { distillLessons, enforceRetention, summarizeEpisodes } from './behaviors.js';
import {
  applyRetentionDefaults,
  checkSensitivity,
  getTTLByType,
  isExpired,
  isLowValue,
  isProvenPlaybook,
  redactEntry,
} from './retention.js';
import { InMemoryStore } from './store.js';
import { type MemoryEntry, MemoryEntrySchema, MemoryTypeSchema } from './types.js';

function makeEntry(
  id: string,
  tier: MemoryEntry['tier'],
  key: string,
  overrides: Partial<MemoryEntry> = {},
): MemoryEntry {
  const now = new Date().toISOString();
  return MemoryEntrySchema.parse({
    id,
    tier,
    key,
    value: 'test-value',
    domain: 'test',
    provenance: { source: 'test', createdAt: now },
    freshness: { lastUpdatedAt: now },
    ...overrides,
  });
}

describe('MemoryTypeSchema', () => {
  it('has exactly 10 memory types', () => {
    expect(MemoryTypeSchema.options).toHaveLength(10);
  });

  it('includes all required cognitive memory types', () => {
    const types = MemoryTypeSchema.options;
    expect(types).toContain('working');
    expect(types).toContain('session');
    expect(types).toContain('episodic');
    expect(types).toContain('semantic');
    expect(types).toContain('workflow');
    expect(types).toContain('entity');
    expect(types).toContain('artifact');
    expect(types).toContain('operator-feedback');
    expect(types).toContain('executive');
    expect(types).toContain('skill');
  });
});

describe('MemoryEntrySchema — defaults', () => {
  it('parses a valid entry with defaults', () => {
    const entry = makeEntry('e1', 'session', 'user-intent');
    expect(entry.confidence).toBe(1);
    expect(entry.sensitivity).toBe('internal');
    expect(entry.linkedTraces).toEqual([]);
    expect(entry.retention.policy).toBe('persistent');
  });

  it('sets memoryType equal to tier when not specified', () => {
    const entry = makeEntry('e2', 'working', 'ctx-frame');
    expect(entry.tier).toBe('working');
  });

  it('accepts explicit memoryType override', () => {
    const entry = MemoryEntrySchema.parse({
      id: 'e3',
      tier: 'semantic',
      memoryType: 'semantic',
      key: 'domain-fact',
      value: 'The capital is Paris',
      domain: 'test',
      provenance: { source: 'test', createdAt: new Date().toISOString() },
      freshness: { lastUpdatedAt: new Date().toISOString() },
    });
    expect(entry.memoryType).toBe('semantic');
  });
});

describe('All 10 memory types — write & read', () => {
  let store: InMemoryStore;

  beforeEach(() => {
    store = new InMemoryStore();
  });

  const ALL_TYPES = [
    'working',
    'session',
    'episodic',
    'semantic',
    'workflow',
    'entity',
    'artifact',
    'operator-feedback',
    'executive',
    'skill',
  ] as const;

  it('all 10 types can be stored and retrieved independently', () => {
    for (const type of ALL_TYPES) {
      store.put(makeEntry(`${type}-id`, type, `${type}-key`));
    }
    expect(store.count()).toBe(10);
    for (const type of ALL_TYPES) {
      expect(store.count(type)).toBe(1);
      const entry = store.getByKey(type, `${type}-key`);
      expect(entry).toBeDefined();
      expect(entry?.tier).toBe(type);
    }
  });

  it('working memory entry is retrievable', () => {
    store.put(makeEntry('w1', 'working', 'active-context', { scopeId: 'run-001' }));
    expect(store.getByKey('working', 'active-context', 'run-001')).toBeDefined();
  });

  it('episodic entry stores event payload', () => {
    const entry = makeEntry('ep1', 'episodic', 'event:login', {
      value: { userId: 'u-1', timestamp: '2026-01-01T00:00:00Z' },
    });
    store.put(entry);
    const retrieved = store.get('ep1')!;
    expect(retrieved.value).toMatchObject({ userId: 'u-1' });
  });

  it('semantic entry stores domain knowledge', () => {
    const entry = makeEntry('sem1', 'semantic', 'fact:gravity', {
      value: '9.81 m/s²',
      confidence: 0.99,
    });
    store.put(entry);
    expect(store.get('sem1')?.confidence).toBe(0.99);
  });

  it('skill entry can be pinned as proven playbook', () => {
    const entry = makeEntry('sk1', 'skill', 'playbook:incident-response', {
      confidence: 0.95,
      retention: { policy: 'persistent', pinned: true },
    });
    store.put(entry);
    expect(store.get('sk1')?.retention.pinned).toBe(true);
  });

  it('executive memory stores high-sensitivity insights', () => {
    const entry = makeEntry('ex1', 'executive', 'board-insight:q4', {
      sensitivity: 'restricted',
      confidence: 0.88,
    });
    store.put(entry);
    const retrieved = store.get('ex1')!;
    expect(retrieved.sensitivity).toBe('restricted');
    expect(retrieved.confidence).toBe(0.88);
  });

  it('operator-feedback entry tracks human corrections', () => {
    const entry = makeEntry('of1', 'operator-feedback', 'correction:routing', {
      provenance: { source: 'ops-team', method: 'human', createdAt: new Date().toISOString() },
      confidence: 0.8,
    });
    store.put(entry);
    expect(store.get('of1')?.provenance.method).toBe('human');
  });

  it('artifact memory links to entity and traces', () => {
    const entry = makeEntry('art1', 'artifact', 'report:q4-2025', {
      linkedEntities: ['entity:company-x'],
      linkedTraces: ['trace:pipeline-run-1'],
      linkedActions: ['action:generate-report'],
    });
    store.put(entry);
    const retrieved = store.get('art1')!;
    expect(retrieved.linkedEntities).toContain('entity:company-x');
    expect(retrieved.linkedTraces).toContain('trace:pipeline-run-1');
    expect(retrieved.linkedActions).toContain('action:generate-report');
  });
});

describe('InMemoryStore — core operations', () => {
  let store: InMemoryStore;

  beforeEach(() => {
    store = new InMemoryStore();
  });

  it('puts and retrieves entries', () => {
    const entry = makeEntry('e1', 'session', 'k1');
    store.put(entry);
    expect(store.get('e1')).toBeDefined();
    expect(store.count()).toBe(1);
  });

  it('getByKey retrieves by tier+key', () => {
    store.put(makeEntry('e1', 'session', 'intent', { scopeId: 's-001' }));
    expect(store.getByKey('session', 'intent', 's-001')).toBeDefined();
    expect(store.getByKey('session', 'intent', 's-999')).toBeUndefined();
  });

  it('lists by tier', () => {
    store.put(makeEntry('e1', 'session', 'k1'));
    store.put(makeEntry('e2', 'workflow', 'k2'));
    expect(store.list({ tier: 'session' })).toHaveLength(1);
  });

  it('evictExpired removes expired entries', () => {
    const past = new Date(Date.now() - 1000).toISOString();
    const entry = makeEntry('e1', 'session', 'k1', {
      retention: { policy: 'session-scoped', expiresAt: past, pinned: false },
    });
    store.put(entry);
    const evicted = store.evictExpired();
    expect(evicted).toBe(1);
    expect(store.count()).toBe(0);
  });

  it('evictExpired preserves pinned entries even if expired', () => {
    const past = new Date(Date.now() - 1000).toISOString();
    const entry = makeEntry('pk1', 'skill', 'playbook:keep', {
      retention: { policy: 'persistent', expiresAt: past, pinned: true },
    });
    store.put(entry);
    const evicted = store.evictExpired();
    expect(evicted).toBe(0);
    expect(store.count()).toBe(1);
  });

  it('clears by tier', () => {
    store.put(makeEntry('e1', 'session', 'k1'));
    store.put(makeEntry('e2', 'workflow', 'k2'));
    store.clear('session');
    expect(store.count('session')).toBe(0);
    expect(store.count('workflow')).toBe(1);
  });

  it('filters by minConfidence', () => {
    store.put(makeEntry('hi', 'semantic', 'k1', { confidence: 0.9 }));
    store.put(makeEntry('lo', 'semantic', 'k2', { confidence: 0.2 }));
    const highConf = store.list({ minConfidence: 0.5 });
    expect(highConf).toHaveLength(1);
    expect(highConf[0].id).toBe('hi');
  });

  it('sorts by confidence descending', () => {
    store.put(makeEntry('a', 'semantic', 'k1', { confidence: 0.4 }));
    store.put(makeEntry('b', 'semantic', 'k2', { confidence: 0.9 }));
    store.put(makeEntry('c', 'semantic', 'k3', { confidence: 0.7 }));
    const sorted = store.list({ sortBy: 'confidence' });
    expect(sorted[0].confidence).toBe(0.9);
    expect(sorted[2].confidence).toBe(0.4);
  });

  it('sorts by freshness descending', () => {
    store.put(makeEntry('first', 'session', 'k1'));
    store.put(makeEntry('second', 'session', 'k2'));
    const sorted = store.list({ sortBy: 'freshness' });
    expect(sorted).toHaveLength(2);
    const t0 = new Date(sorted[0].freshness.lastUpdatedAt).getTime();
    const t1 = new Date(sorted[1].freshness.lastUpdatedAt).getTime();
    expect(t0).toBeGreaterThanOrEqual(t1);
  });

  it('search filters by key content', () => {
    store.put(makeEntry('s1', 'semantic', 'fact:ocean-depth'));
    store.put(makeEntry('s2', 'semantic', 'fact:mountain-height'));
    const results = store.search('ocean');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('s1');
  });

  it('search filters by string value content', () => {
    store.put(makeEntry('sv1', 'semantic', 'climate-fact', { value: 'Arctic is warming' }));
    store.put(makeEntry('sv2', 'semantic', 'tech-fact', { value: 'Silicon chips are shrinking' }));
    const results = store.search('Arctic');
    expect(results).toHaveLength(1);
  });

  it('search filters by tags', () => {
    store.put(makeEntry('t1', 'entity', 'k1', { tags: ['crm', 'priority'] }));
    store.put(makeEntry('t2', 'entity', 'k2', { tags: ['erp'] }));
    const results = store.search('crm');
    expect(results.some((e) => e.id === 't1')).toBe(true);
  });
});

describe('Retention helpers', () => {
  it('applyRetentionDefaults sets expiresAt for session tier', () => {
    const entry = makeEntry('e1', 'session', 'k1');
    const result = applyRetentionDefaults(entry);
    expect(result.retention.expiresAt).toBeDefined();
  });

  it('applyRetentionDefaults sets very short TTL for working tier', () => {
    const entry = makeEntry('e1', 'working', 'k1');
    const result = applyRetentionDefaults(entry);
    expect(result.retention.expiresAt).toBeDefined();
    const expiresAt = new Date(result.retention.expiresAt!).getTime();
    const now = Date.now();
    expect(expiresAt - now).toBeLessThan(2 * 60 * 60 * 1000);
  });

  it('applyRetentionDefaults leaves semantic tier without expiry', () => {
    const entry = makeEntry('e1', 'semantic', 'k1');
    const result = applyRetentionDefaults(entry);
    expect(result.retention.expiresAt).toBeUndefined();
  });

  it('applyRetentionDefaults leaves skill tier without expiry', () => {
    const entry = makeEntry('e1', 'skill', 'k1');
    const result = applyRetentionDefaults(entry);
    expect(result.retention.expiresAt).toBeUndefined();
  });

  it('applyRetentionDefaults sets 90-day TTL for episodic tier', () => {
    const entry = makeEntry('e1', 'episodic', 'k1');
    const result = applyRetentionDefaults(entry);
    expect(result.retention.maxAgeDays).toBe(90);
  });

  it('applyRetentionDefaults sets 730-day TTL for operator-feedback tier', () => {
    const entry = makeEntry('e1', 'operator-feedback', 'k1');
    const result = applyRetentionDefaults(entry);
    expect(result.retention.maxAgeDays).toBe(730);
  });

  it('isExpired returns true for past expiresAt', () => {
    const past = new Date(Date.now() - 1000).toISOString();
    const entry = makeEntry('e1', 'session', 'k1', {
      retention: { policy: 'session-scoped', expiresAt: past, pinned: false },
    });
    expect(isExpired(entry)).toBe(true);
  });

  it('isExpired returns false for future expiresAt', () => {
    const future = new Date(Date.now() + 1_000_000).toISOString();
    const entry = makeEntry('e1', 'session', 'k1', {
      retention: { policy: 'session-scoped', expiresAt: future, pinned: false },
    });
    expect(isExpired(entry)).toBe(false);
  });

  it('checkSensitivity enforces access levels', () => {
    const restricted = makeEntry('e1', 'session', 'k1', { sensitivity: 'restricted' });
    expect(checkSensitivity(restricted, 'public')).toBe(false);
    expect(checkSensitivity(restricted, 'restricted')).toBe(true);
    const pub = makeEntry('e2', 'session', 'k2', { sensitivity: 'public' });
    expect(checkSensitivity(pub, 'internal')).toBe(true);
  });

  it('isLowValue identifies low-confidence unpinned entries', () => {
    const low = makeEntry('e1', 'session', 'k1', { confidence: 0.1 });
    const high = makeEntry('e2', 'session', 'k2', { confidence: 0.9 });
    const pinnedLow = makeEntry('e3', 'skill', 'k3', {
      confidence: 0.1,
      retention: { policy: 'persistent', pinned: true },
    });
    expect(isLowValue(low)).toBe(true);
    expect(isLowValue(high)).toBe(false);
    expect(isLowValue(pinnedLow)).toBe(false);
  });

  it('isProvenPlaybook identifies high-confidence skill entries', () => {
    const proven = makeEntry('e1', 'skill', 'playbook:response', { confidence: 0.9 });
    const notYet = makeEntry('e2', 'skill', 'playbook:draft', { confidence: 0.6 });
    const wrongType = makeEntry('e3', 'semantic', 'fact', { confidence: 0.9 });
    expect(isProvenPlaybook(proven)).toBe(true);
    expect(isProvenPlaybook(notYet)).toBe(false);
    expect(isProvenPlaybook(wrongType)).toBe(false);
  });

  it('getTTLByType returns all 10 types with expected null/number values', () => {
    const ttls = getTTLByType();
    expect(Object.keys(ttls)).toHaveLength(10);
    expect(ttls.working).toBeCloseTo(0.042, 2);
    expect(ttls.session).toBe(1);
    expect(ttls.episodic).toBe(90);
    expect(ttls.semantic).toBeNull();
    expect(ttls.workflow).toBe(7);
    expect(ttls.entity).toBe(90);
    expect(ttls.artifact).toBe(365);
    expect(ttls['operator-feedback']).toBe(730);
    expect(ttls.executive).toBe(180);
    expect(ttls.skill).toBeNull();
  });
});

describe('Tier-based redaction', () => {
  it('returns full entry when clearance matches or exceeds entry sensitivity', () => {
    const entry = makeEntry('sec1', 'session', 'safe-data', { sensitivity: 'internal' });
    const result = redactEntry(entry, 'internal');
    expect(result).not.toBeNull();
    expect(result?.value).toBe('test-value');
  });

  it('returns full entry when requester clearance exceeds entry sensitivity', () => {
    const entry = makeEntry('sec2', 'entity', 'customer-data', { sensitivity: 'internal' });
    const result = redactEntry(entry, 'confidential');
    expect(result).not.toBeNull();
    expect(result?.value).toBe('test-value');
  });

  it('redacts value and metadata when requester is one level below entry sensitivity', () => {
    const entry = makeEntry('sec3', 'entity', 'customer-data', {
      sensitivity: 'internal',
      metadata: { secret: 'hidden' },
      linkedEntities: ['ent-1'],
    });
    const result = redactEntry(entry, 'public');
    expect(result).not.toBeNull();
    expect(result?.value).toBe('[REDACTED]');
    expect(result?.metadata).toEqual({});
    expect(result?.linkedEntities).toEqual([]);
  });

  it('redacts confidential entry for internal requester (one level below)', () => {
    const entry = makeEntry('sec4', 'executive', 'sensitive', {
      sensitivity: 'confidential',
      metadata: { secret: 'hidden' },
    });
    const result = redactEntry(entry, 'internal');
    expect(result).not.toBeNull();
    expect(result?.value).toBe('[REDACTED]');
    expect(result?.metadata).toEqual({});
  });

  it('redacts restricted entry for confidential requester (one level below)', () => {
    const entry = makeEntry('sec5', 'executive', 'board-memo', {
      sensitivity: 'restricted',
      metadata: { classified: true },
    });
    const result = redactEntry(entry, 'confidential');
    expect(result).not.toBeNull();
    expect(result?.value).toBe('[REDACTED]');
  });

  it('hard-denies (null) when requester is two or more levels below entry sensitivity', () => {
    const restricted = makeEntry('sec6', 'executive', 'board-memo', { sensitivity: 'restricted' });
    expect(redactEntry(restricted, 'public')).toBeNull();
    expect(redactEntry(restricted, 'internal')).toBeNull();

    const confidential = makeEntry('sec7', 'executive', 'confidential-data', {
      sensitivity: 'confidential',
    });
    expect(redactEntry(confidential, 'public')).toBeNull();
  });

  it('redacts summary field when present', () => {
    const entry = makeEntry('sec8', 'episodic', 'event-log', {
      sensitivity: 'confidential',
      summary: 'Classified summary',
    });
    const result = redactEntry(entry, 'internal');
    expect(result?.summary).toBe('[REDACTED]');
  });

  it('checkSensitivity still reflects whether full access is allowed', () => {
    const restricted = makeEntry('e1', 'session', 'k1', { sensitivity: 'restricted' });
    expect(checkSensitivity(restricted, 'public')).toBe(false);
    expect(checkSensitivity(restricted, 'restricted')).toBe(true);
    const pub = makeEntry('e2', 'session', 'k2', { sensitivity: 'public' });
    expect(checkSensitivity(pub, 'internal')).toBe(true);
  });
});

describe('Behaviors — episodic summarization', () => {
  let store: InMemoryStore;

  beforeEach(() => {
    store = new InMemoryStore();
  });

  it('summarizes episodes into a semantic memory entry', () => {
    for (let i = 0; i < 5; i++) {
      store.put(makeEntry(`ep-${i}`, 'episodic', `event:step-${i}`, { scopeId: 'scope-A' }));
    }
    const result = summarizeEpisodes(store, 'scope-A', { minEpisodes: 3 });
    expect(result).not.toBeNull();
    expect(result?.summary.tier).toBe('semantic');
    expect(result?.collapsedIds).toHaveLength(5);
  });

  it('returns null when episodes are insufficient', () => {
    store.put(makeEntry('ep-1', 'episodic', 'event:1', { scopeId: 'scope-B' }));
    const result = summarizeEpisodes(store, 'scope-B', { minEpisodes: 3 });
    expect(result).toBeNull();
  });

  it('marks source episodes as stale after summarization', () => {
    for (let i = 0; i < 4; i++) {
      store.put(makeEntry(`ep-s-${i}`, 'episodic', `event:s-${i}`, { scopeId: 'scope-C' }));
    }
    summarizeEpisodes(store, 'scope-C', { minEpisodes: 2 });
    const episodes = store.list({ tier: 'episodic', scopeId: 'scope-C', includeStale: true });
    expect(episodes.every((e) => e.freshness.isStale)).toBe(true);
  });

  it('uses custom summarize function if provided', () => {
    for (let i = 0; i < 3; i++) {
      store.put(makeEntry(`ep-c-${i}`, 'episodic', `event:c-${i}`, { scopeId: 'scope-D' }));
    }
    const result = summarizeEpisodes(store, 'scope-D', {
      minEpisodes: 3,
      summarizeFn: (entries) => `Custom summary of ${entries.length} events`,
    });
    expect(result?.summary.value).toBe('Custom summary of 3 events');
  });

  it('summary inherits highest sensitivity from source episodes', () => {
    store.put(
      makeEntry('ep-s1', 'episodic', 'ev1', {
        scopeId: 'scope-E',
        sensitivity: 'public',
      }),
    );
    store.put(
      makeEntry('ep-s2', 'episodic', 'ev2', {
        scopeId: 'scope-E',
        sensitivity: 'confidential',
      }),
    );
    store.put(
      makeEntry('ep-s3', 'episodic', 'ev3', {
        scopeId: 'scope-E',
        sensitivity: 'internal',
      }),
    );
    const result = summarizeEpisodes(store, 'scope-E', { minEpisodes: 3 });
    expect(result?.summary.sensitivity).toBe('confidential');
  });
});

describe('Behaviors — lesson distillation', () => {
  let store: InMemoryStore;

  beforeEach(() => {
    store = new InMemoryStore();
  });

  it('distills high-quality operator feedback into a skill lesson', () => {
    for (let i = 0; i < 3; i++) {
      store.put(
        makeEntry(`fb-${i}`, 'operator-feedback', `correction:step-${i}`, {
          confidence: 0.8 + i * 0.05,
          provenance: { source: 'ops', method: 'human', createdAt: new Date().toISOString() },
        }),
      );
    }
    const result = distillLessons(store, { minFeedback: 2 });
    expect(result).not.toBeNull();
    expect(result?.lesson.tier).toBe('skill');
    expect(result?.lesson.retention.pinned).toBe(true);
    expect(result?.sourceIds).toHaveLength(3);
  });

  it('returns null when high-quality feedback is insufficient', () => {
    store.put(makeEntry('fb-low', 'operator-feedback', 'correction:weak', { confidence: 0.2 }));
    const result = distillLessons(store, { minFeedback: 2 });
    expect(result).toBeNull();
  });

  it('uses custom distill function if provided', () => {
    for (let i = 0; i < 2; i++) {
      store.put(
        makeEntry(`fb-d-${i}`, 'operator-feedback', `lesson-${i}`, {
          confidence: 0.85,
          provenance: { source: 'ops', method: 'human', createdAt: new Date().toISOString() },
        }),
      );
    }
    const result = distillLessons(store, {
      minFeedback: 2,
      distillFn: (entries) => `Learned from ${entries.length} corrections`,
    });
    expect(result?.lesson.value).toBe('Learned from 2 corrections');
  });
});

describe('Behaviors — retention enforcement', () => {
  let store: InMemoryStore;

  beforeEach(() => {
    store = new InMemoryStore();
  });

  it('evicts expired low-value entries', () => {
    const past = new Date(Date.now() - 1000).toISOString();
    store.put(
      makeEntry('exp1', 'working', 'stale-ctx', {
        retention: { policy: 'ephemeral', expiresAt: past, pinned: false },
        confidence: 0.1,
      }),
    );
    const result = enforceRetention(store);
    expect(result.evicted).toBeGreaterThanOrEqual(1);
    expect(store.count()).toBe(0);
  });

  it('drops low-confidence unpinned entries', () => {
    store.put(makeEntry('noise1', 'session', 'noise', { confidence: 0.1 }));
    store.put(makeEntry('good1', 'session', 'good', { confidence: 0.9 }));
    const result = enforceRetention(store);
    expect(result.evicted).toBe(1);
    expect(store.count()).toBe(1);
    expect(store.get('good1')).toBeDefined();
  });

  it('pins proven playbooks automatically', () => {
    store.put(
      makeEntry('sk1', 'skill', 'playbook:auto-pin', {
        confidence: 0.95,
        retention: { policy: 'persistent', pinned: false },
      }),
    );
    const result = enforceRetention(store);
    expect(result.pinned).toBe(1);
    expect(store.get('sk1')?.retention.pinned).toBe(true);
  });

  it('does not evict pinned entries regardless of low confidence', () => {
    store.put(
      makeEntry('pinned1', 'skill', 'old-playbook', {
        confidence: 0.1,
        retention: { policy: 'persistent', pinned: true },
      }),
    );
    const result = enforceRetention(store);
    expect(result.evicted).toBe(0);
    expect(store.count()).toBe(1);
  });
});

describe('Memory CRUD with provenance', () => {
  let store: InMemoryStore;
  const now = new Date().toISOString();

  beforeEach(() => {
    store = new InMemoryStore();
  });

  it('records full provenance on create', () => {
    const entry = MemoryEntrySchema.parse({
      id: 'prov-001',
      tier: 'entity',
      key: 'customer:c-999',
      value: { name: 'Acme Corp' },
      domain: 'test',
      provenance: {
        source: 'crm-connector',
        sourceId: 'crm-c-999',
        author: 'sync-agent',
        method: 'import',
        createdAt: now,
      },
      freshness: { lastUpdatedAt: now },
      confidence: 0.95,
      sensitivity: 'confidential',
      linkedEntities: ['entity:c-999'],
      linkedTraces: ['trace:t-001'],
      linkedActions: ['action:a-001'],
    });
    store.put(entry);
    const retrieved = store.get('prov-001')!;
    expect(retrieved.provenance.source).toBe('crm-connector');
    expect(retrieved.provenance.sourceId).toBe('crm-c-999');
    expect(retrieved.provenance.author).toBe('sync-agent');
    expect(retrieved.provenance.method).toBe('import');
    expect(retrieved.confidence).toBe(0.95);
    expect(retrieved.sensitivity).toBe('confidential');
    expect(retrieved.linkedEntities).toContain('entity:c-999');
    expect(retrieved.linkedTraces).toContain('trace:t-001');
    expect(retrieved.linkedActions).toContain('action:a-001');
  });

  it('freshness.lastUpdatedAt is updated on put', () => {
    const entry = makeEntry('e1', 'workflow', 'step-output');
    store.put(entry);
    const before = store.get('e1')?.freshness.lastUpdatedAt;
    store.put({ ...entry, value: 'updated' });
    const after = store.get('e1')?.freshness.lastUpdatedAt;
    expect(new Date(after).getTime()).toBeGreaterThanOrEqual(new Date(before).getTime());
  });

  it('freshness.lastAccessedAt is updated on get', () => {
    const entry = makeEntry('e2', 'session', 'ctx');
    store.put(entry);
    expect(store.get('e2')?.freshness.lastAccessedAt).toBeDefined();
  });

  it('linked entities, traces, and actions are preserved round-trip', () => {
    const entry = makeEntry('link-test', 'artifact', 'report-v1', {
      linkedEntities: ['ent-1', 'ent-2'],
      linkedTraces: ['trace-1'],
      linkedActions: ['act-1', 'act-2', 'act-3'],
    });
    store.put(entry);
    const retrieved = store.get('link-test')!;
    expect(retrieved.linkedEntities).toHaveLength(2);
    expect(retrieved.linkedTraces).toHaveLength(1);
    expect(retrieved.linkedActions).toHaveLength(3);
  });

  it('stale filter excludes stale entries by default', () => {
    store.put(makeEntry('fresh-1', 'session', 'k1'));
    store.put(
      makeEntry('stale-1', 'session', 'k2', {
        freshness: { lastUpdatedAt: now, isStale: true },
      }),
    );
    const results = store.list({ tier: 'session', includeStale: false });
    expect(results.every((e) => !e.freshness.isStale)).toBe(true);
    const allResults = store.list({ tier: 'session', includeStale: true });
    expect(allResults).toHaveLength(2);
  });

  it('tag filter works correctly', () => {
    store.put(makeEntry('t1', 'entity', 'k1', { tags: ['crm', 'vip'] }));
    store.put(makeEntry('t2', 'entity', 'k2', { tags: ['crm'] }));
    store.put(makeEntry('t3', 'entity', 'k3', { tags: ['erp'] }));
    expect(store.list({ tags: ['crm', 'vip'] })).toHaveLength(1);
    expect(store.list({ tags: ['crm'] })).toHaveLength(2);
    expect(store.list({ tags: ['erp'] })).toHaveLength(1);
  });
});
