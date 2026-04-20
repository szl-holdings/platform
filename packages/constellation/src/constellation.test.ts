import { beforeEach, describe, expect, it } from 'vitest';
import { adapterRegistry, projectDomain } from './adapter.js';
import { findNeighbors, findPath, searchGraphNodes, subgraph } from './query.js';
import type { ConstellationNode } from './schema.js';
import { ConstellationEdgeSchema, ConstellationNodeSchema } from './schema.js';
import { InMemoryGraphStore } from './store.js';

function makeNode(id: string, label: string, domain = 'test'): ConstellationNode {
  const now = new Date().toISOString();
  return ConstellationNodeSchema.parse({
    id,
    type: 'entity',
    label,
    domain,
    provenance: { source: 'test', ingestedAt: now },
    freshness: { lastUpdatedAt: now },
    createdAt: now,
    updatedAt: now,
  });
}

describe('ConstellationNodeSchema', () => {
  it('parses a valid node', () => {
    const node = makeNode('n1', 'Test Node');
    expect(node.id).toBe('n1');
    expect(node.sensitivityTier).toBe('internal');
    expect(node.confidence).toBe(1);
    expect(node.linkedTraces).toEqual([]);
  });

  it('validates sensitivity tier enum', () => {
    expect(() =>
      ConstellationNodeSchema.parse({ ...makeNode('n1', 'x'), sensitivityTier: 'ultra-secret' }),
    ).toThrow();
  });
});

describe('ConstellationEdgeSchema', () => {
  it('parses a valid edge', () => {
    const now = new Date().toISOString();
    const edge = ConstellationEdgeSchema.parse({
      id: 'e1',
      type: 'relates-to',
      fromNodeId: 'n1',
      toNodeId: 'n2',
      provenance: { source: 'test', ingestedAt: now },
      createdAt: now,
      updatedAt: now,
    });
    expect(edge.weight).toBe(1);
    expect(edge.confidence).toBe(1);
  });
});

describe('InMemoryGraphStore', () => {
  let store: InMemoryGraphStore;

  beforeEach(() => {
    store = new InMemoryGraphStore();
  });

  it('upserts and retrieves nodes', () => {
    const node = makeNode('n1', 'Test');
    store.upsertNode(node);
    expect(store.getNode('n1')).toEqual(node);
    expect(store.nodeCount()).toBe(1);
  });

  it('filters nodes by domain', () => {
    store.upsertNode(makeNode('n1', 'A', 'terra'));
    store.upsertNode(makeNode('n2', 'B', 'vessels'));
    expect(store.listNodes({ domain: 'terra' })).toHaveLength(1);
  });

  it('deletes nodes', () => {
    store.upsertNode(makeNode('n1', 'Test'));
    expect(store.deleteNode('n1')).toBe(true);
    expect(store.getNode('n1')).toBeUndefined();
  });
});

describe('Query helpers', () => {
  let store: InMemoryGraphStore;

  beforeEach(() => {
    store = new InMemoryGraphStore();
    const now = new Date().toISOString();
    store.upsertNode(makeNode('a', 'Alpha'));
    store.upsertNode(makeNode('b', 'Beta'));
    store.upsertNode(makeNode('c', 'Gamma'));
    store.upsertEdge(
      ConstellationEdgeSchema.parse({
        id: 'e-ab',
        type: 'relates-to',
        fromNodeId: 'a',
        toNodeId: 'b',
        provenance: { source: 'test', ingestedAt: now },
        createdAt: now,
        updatedAt: now,
      }),
    );
    store.upsertEdge(
      ConstellationEdgeSchema.parse({
        id: 'e-bc',
        type: 'relates-to',
        fromNodeId: 'b',
        toNodeId: 'c',
        provenance: { source: 'test', ingestedAt: now },
        createdAt: now,
        updatedAt: now,
      }),
    );
  });

  it('findNeighbors returns correct neighbors', () => {
    const { nodes } = findNeighbors('a', 'outgoing', { store });
    expect(nodes.map((n) => n.id)).toContain('b');
  });

  it('findPath finds a path between nodes', () => {
    const path = findPath('a', 'c', 5, { store });
    expect(path).not.toBeNull();
    expect(path?.map((n) => n.id)).toEqual(['a', 'b', 'c']);
  });

  it('findPath returns null when no path exists', () => {
    const path = findPath('c', 'a', 5, { store });
    expect(path).toBeNull();
  });

  it('subgraph returns correct nodes at depth 1', () => {
    const { nodes } = subgraph('a', 1, { store });
    expect(nodes.map((n) => n.id).sort()).toEqual(['a', 'b']);
  });

  it('searchNodes finds by label', () => {
    const results = searchGraphNodes('beta', { store });
    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe('b');
  });
});

describe('Adapter interface', () => {
  it('registers and retrieves adapters', () => {
    adapterRegistry.register({
      domain: 'test-domain',
      sourceType: 'record',
      projectNode: (s: { id: string; name: string }) => makeNode(s.id, s.name, 'test-domain'),
    });
    const adapter = adapterRegistry.get('test-domain', 'record');
    expect(adapter).toBeDefined();
    expect(adapter?.domain).toBe('test-domain');
  });

  it('projectDomain maps sources to nodes', () => {
    const adapter = {
      domain: 'terra',
      sourceType: 'parcel',
      projectNode: (s: { id: string; address: string }) => makeNode(s.id, s.address, 'terra'),
    };
    const { nodes } = projectDomain(adapter, [
      { id: 'parcel-1', address: '123 Main St' },
      { id: 'parcel-2', address: '456 Oak Ave' },
    ]);
    expect(nodes).toHaveLength(2);
    expect(nodes[0]?.label).toBe('123 Main St');
  });
});
