import { describe, it, expect, beforeEach } from 'vitest';
import { CatalogSearch } from '../catalog-search.js';
import { InMemoryToolRegistry } from '../registry.js';
import type { ToolManifest } from '../manifest.js';

function makeManifest(overrides: Partial<ToolManifest> & Pick<ToolManifest, 'id' | 'name' | 'description'>): ToolManifest {
  return {
    version: '1.0.0',
    domainTags: [],
    policyTier: 'internal-workflow',
    allowedEnvironments: ['development', 'staging', 'production'],
    rateLimits: {},
    timeoutMs: 30000,
    failureModes: [],
    approvalRequired: false,
    observabilityHooks: { emitTrace: true, emitMetrics: true, sensitiveFields: [] },
    enabled: true,
    ...overrides,
  };
}

const MARITIME_DATA = makeManifest({
  id: 'maritime_data',
  name: 'Maritime Data Tool',
  description: 'Fetches vessel positions and maritime traffic intelligence for sanctioned port monitoring',
  domainTags: ['data', 'security'],
});

const THREAT_FEEDS = makeManifest({
  id: 'threat_feeds',
  name: 'Threat Intelligence Feeds',
  description: 'Aggregates threat feeds including sanctions watchlists and maritime risk advisories',
  domainTags: ['security'],
});

const CONTENT_STRATEGY = makeManifest({
  id: 'content_strategy',
  name: 'Content Strategy Tool',
  description: 'Generates marketing content plans and editorial calendars for brand campaigns',
  domainTags: ['communication'],
});

const GRAPH_QUERY = makeManifest({
  id: 'graph_query',
  name: 'Graph Query Tool',
  description: 'Executes graph traversal queries across entity relationship networks',
  domainTags: ['graph', 'data'],
});

describe('CatalogSearch — BM25', () => {
  let search: CatalogSearch;

  beforeEach(() => {
    search = new CatalogSearch();
    search.addDocument(MARITIME_DATA);
    search.addDocument(THREAT_FEEDS);
    search.addDocument(CONTENT_STRATEGY);
    search.addDocument(GRAPH_QUERY);
  });

  it('returns results ranked by relevance for maritime sanctions query', () => {
    const results = search.search('maritime sanctions');
    expect(results.length).toBeGreaterThan(0);

    const ids = results.map((r) => r.manifest.id);
    const maritimeIdx = ids.indexOf('maritime_data');
    const threatIdx = ids.indexOf('threat_feeds');

    expect(maritimeIdx).not.toBe(-1);
    expect(threatIdx).not.toBe(-1);
  });

  it('scores maritime_data and threat_feeds higher than content_strategy for maritime sanctions', () => {
    const results = search.search('maritime sanctions');
    const byId = Object.fromEntries(results.map((r) => [r.manifest.id, r.score]));

    const maritimeScore = byId['maritime_data'] ?? 0;
    const threatScore = byId['threat_feeds'] ?? 0;
    const contentScore = byId['content_strategy'] ?? 0;

    expect(maritimeScore).toBeGreaterThan(contentScore);
    expect(threatScore).toBeGreaterThan(contentScore);
  });

  it('returns correct tool for domain-specific query', () => {
    const results = search.search('graph traversal entity');
    expect(results[0]?.manifest.id).toBe('graph_query');
  });

  it('returns empty array for empty query', () => {
    const results = search.search('');
    expect(results).toEqual([]);
  });

  it('returns empty array when no documents registered', () => {
    const empty = new CatalogSearch();
    expect(empty.search('maritime')).toEqual([]);
  });

  it('respects limit parameter', () => {
    const results = search.search('tool data', 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it('removes document and updates index', () => {
    search.removeDocument('maritime_data');
    const results = search.search('maritime vessel port');
    const ids = results.map((r) => r.manifest.id);
    expect(ids).not.toContain('maritime_data');
  });

  it('re-indexes on document update (add+remove)', () => {
    const updated = makeManifest({
      ...MARITIME_DATA,
      description: 'Updated: tracks cargo shipments for supply chain logistics',
    });
    search.removeDocument('maritime_data');
    search.addDocument(updated);

    const maritimeResults = search.search('vessel sanctioned port');
    const ids = maritimeResults.map((r) => r.manifest.id);
    expect(ids).not.toContain('maritime_data');

    const supplyResults = search.search('cargo logistics supply chain');
    const supplyIds = supplyResults.map((r) => r.manifest.id);
    expect(supplyIds[0]).toBe('maritime_data');
  });

  it('all scores are positive numbers', () => {
    const results = search.search('data');
    for (const r of results) {
      expect(r.score).toBeGreaterThan(0);
    }
  });
});

describe('InMemoryToolRegistry — catalog search integration', () => {
  it('search() returns results after register()', () => {
    const registry = new InMemoryToolRegistry();
    registry.register(MARITIME_DATA);
    registry.register(CONTENT_STRATEGY);

    const results = registry.search('maritime vessel sanctions');
    expect(results[0]?.id).toBe('maritime_data');
  });

  it('search() excludes unregistered tools', () => {
    const registry = new InMemoryToolRegistry();
    registry.register(MARITIME_DATA);
    registry.register(CONTENT_STRATEGY);
    registry.unregister('maritime_data');

    const results = registry.search('maritime vessel');
    const ids = results.map((r) => r.id);
    expect(ids).not.toContain('maritime_data');
  });
});
