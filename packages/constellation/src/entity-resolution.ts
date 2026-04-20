/**
 * Entity Resolution — alias-to-canonical mapping and node merging.
 *
 * Given a set of nodes with aliases, this module can:
 *  - Resolve an alias (type + value) to its canonical node.
 *  - Merge two nodes where one is discovered to be a duplicate, preserving
 *    provenance from both and fusing their confidence scores.
 */

import type { ConstellationNode } from './schema.js';
import type { GraphStore } from './store.js';

export interface ResolutionResult {
  canonical: ConstellationNode;
  /** true when the query hit an alias rather than the node's own id */
  resolvedFromAlias: boolean;
}

/**
 * Resolve an alias to a canonical node in the store.
 * Returns null when no match is found.
 */
export function resolveAlias(
  store: GraphStore,
  aliasType: string,
  aliasValue: string,
): ResolutionResult | null {
  const node = store.lookupByAlias(aliasType, aliasValue);
  if (!node) return null;
  return { canonical: node, resolvedFromAlias: true };
}

/**
 * Resolve an entity by either its node id or any of its aliases.
 *
 * Priority order:
 *  1. Exact id match
 *  2. Primary alias match
 *  3. Any alias match (first found)
 */
export function resolveEntity(
  store: GraphStore,
  idOrAlias: string,
  aliasType?: string,
): ResolutionResult | null {
  const byId = store.getNode(idOrAlias);
  if (byId) return { canonical: byId, resolvedFromAlias: false };

  if (aliasType) {
    const byAlias = store.lookupByAlias(aliasType, idOrAlias);
    if (byAlias) return { canonical: byAlias, resolvedFromAlias: true };
  }

  for (const node of store.listNodes()) {
    for (const alias of node.aliases ?? []) {
      if (alias.aliasValue === idOrAlias) {
        return { canonical: node, resolvedFromAlias: true };
      }
    }
  }

  return null;
}

export interface MergeResult {
  merged: ConstellationNode;
  /** id of the node that was absorbed */
  absorbedId: string;
}

/**
 * Merge `sourceId` into `targetId`. The target node is kept as canonical;
 * the source node's aliases are folded in, its confidence is fused (average),
 * and its tags are unioned. All edges that referenced `sourceId` are rewired
 * to `targetId` before the source node is removed from the store.
 *
 * Returns the updated merged node, or null if either node is not found.
 */
export function mergeNodes(
  store: GraphStore,
  targetId: string,
  sourceId: string,
  now = new Date().toISOString(),
): MergeResult | null {
  const target = store.getNode(targetId);
  const source = store.getNode(sourceId);
  if (!target || !source) return null;

  const existingAliasKeys = new Set(
    (target.aliases ?? []).map((a) => `${a.aliasType}:${a.aliasValue}`),
  );
  const mergedAliases = [
    ...(target.aliases ?? []),
    ...(source.aliases ?? []).filter(
      (a) => !existingAliasKeys.has(`${a.aliasType}:${a.aliasValue}`),
    ),
    { aliasType: 'merged_from', aliasValue: source.id, isPrimary: false },
  ];

  const mergedTags = Array.from(new Set([...(target.tags ?? []), ...(source.tags ?? [])]));

  const fusedConfidence = (target.confidence + source.confidence) / 2;

  const merged: ConstellationNode = {
    ...target,
    aliases: mergedAliases,
    tags: mergedTags,
    confidence: fusedConfidence,
    updatedAt: now,
    freshness: {
      ...target.freshness,
      lastUpdatedAt: now,
      isStale: false,
    },
  };

  store.upsertNode(merged);

  // Rewire all edges that reference sourceId to point to targetId.
  // Track the canonical (fromNodeId, toNodeId, type) tuples already present
  // on the target so we don't create duplicate edges.
  const existingEdgeKeys = new Set(
    store
      .listEdges()
      .filter((e) => e.fromNodeId === targetId || e.toNodeId === targetId)
      .map((e) => `${e.fromNodeId}→${e.toNodeId}→${e.type}`),
  );

  const sourceEdges = store
    .listEdges()
    .filter((e) => e.fromNodeId === sourceId || e.toNodeId === sourceId);

  for (const edge of sourceEdges) {
    store.deleteEdge(edge.id);
    const newFrom = edge.fromNodeId === sourceId ? targetId : edge.fromNodeId;
    const newTo = edge.toNodeId === sourceId ? targetId : edge.toNodeId;
    if (newFrom === newTo) continue;
    const key = `${newFrom}→${newTo}→${edge.type}`;
    if (existingEdgeKeys.has(key)) continue;
    existingEdgeKeys.add(key);
    store.upsertEdge({ ...edge, fromNodeId: newFrom, toNodeId: newTo, updatedAt: now });
  }

  store.deleteNode(sourceId);

  return { merged, absorbedId: sourceId };
}
