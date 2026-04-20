/**
 * In-memory graph utility functions for Constellation's GraphStore.
 *
 * These are pure, synchronous helpers that operate directly on a GraphStore
 * instance. They are distinct from the async, DB-backed functions in query.ts.
 *
 * Use these in tests and when working with InMemoryGraphStore.
 */

import type { ConstellationEdge, ConstellationNode } from './schema.js';
import type { GraphStore } from './store.js';

/**
 * Returns all nodes that are directly connected to `nodeId` via any edge
 * (in either direction).
 */
export function findNeighbors(store: GraphStore, nodeId: string): ConstellationNode[] {
  const edges = store.listEdges();
  const neighborIds = new Set<string>();
  for (const e of edges) {
    if (e.fromNodeId === nodeId) neighborIds.add(e.toNodeId);
    if (e.toNodeId === nodeId) neighborIds.add(e.fromNodeId);
  }
  return store.listNodes().filter((n) => neighborIds.has(n.id));
}

/**
 * Returns the shortest path from `fromId` to `toId` as an ordered array of
 * nodes. Returns an empty array if no path exists.
 */
export function findPath(store: GraphStore, fromId: string, toId: string): ConstellationNode[] {
  if (fromId === toId) {
    const node = store.getNode(fromId);
    return node ? [node] : [];
  }

  const queue: string[][] = [[fromId]];
  const visited = new Set<string>([fromId]);

  while (queue.length > 0) {
    const path = queue.shift()!;
    const current = path[path.length - 1]!;
    const edges = store.listEdges();

    for (const e of edges) {
      let next: string | undefined;
      if (e.fromNodeId === current) next = e.toNodeId;
      else if (e.toNodeId === current) next = e.fromNodeId;

      if (next && !visited.has(next)) {
        const newPath = [...path, next];
        if (next === toId) {
          return newPath.map((id) => store.getNode(id)!).filter(Boolean);
        }
        visited.add(next);
        queue.push(newPath);
      }
    }
  }

  return [];
}

/**
 * Returns the nodes and internal edges induced by the given node IDs.
 * Only edges where BOTH endpoints are in `nodeIds` are included.
 */
export function subgraph(
  store: GraphStore,
  nodeIds: string[],
): { nodes: ConstellationNode[]; edges: ConstellationEdge[] } {
  const idSet = new Set(nodeIds);
  const nodes = store.listNodes().filter((n) => idSet.has(n.id));
  const edges = store.listEdges().filter((e) => idSet.has(e.fromNodeId) && idSet.has(e.toNodeId));
  return { nodes, edges };
}

/**
 * Returns all nodes whose label contains `query` (case-insensitive).
 */
export function searchNodes(store: GraphStore, query: string): ConstellationNode[] {
  const lq = query.toLowerCase();
  return store.listNodes().filter((n) => n.label.toLowerCase().includes(lq));
}
