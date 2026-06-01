/**
 * Relationship Inference — derive implicit edges from existing graph structure.
 *
 * Rules:
 *  - Transitivity: if A→B and B→C with the same edgeType, infer A→C.
 *  - Ownership chain: if A owns B and B owns C, infer A owns C.
 *  - Cross-domain co-occurrence: if two nodes share the same alias value
 *    across different domains, suggest a "similar-to" edge.
 */

import type { ConstellationEdge } from './schema.js';
import type { GraphStore } from './store.js';

export interface InferredEdge {
  fromNodeId: string;
  toNodeId: string;
  type: ConstellationEdge['type'];
  confidence: number;
  reason: string;
}

/**
 * Run transitive closure inference for the given edge type up to `maxHops`.
 * Returns candidate edges that do NOT already exist in the store.
 */
export function inferTransitiveEdges(
  store: GraphStore,
  edgeType: ConstellationEdge['type'],
  maxHops = 2,
): InferredEdge[] {
  const existing = new Set(
    store.listEdges({ type: edgeType }).map((e) => `${e.fromNodeId}→${e.toNodeId}`),
  );

  const results: InferredEdge[] = [];
  const edges = store.listEdges({ type: edgeType });

  for (const edgeA of edges) {
    for (const edgeB of store.listEdges({ fromNodeId: edgeA.toNodeId, type: edgeType })) {
      const key = `${edgeA.fromNodeId}→${edgeB.toNodeId}`;
      if (!existing.has(key) && edgeA.fromNodeId !== edgeB.toNodeId) {
        const inferredConf = edgeA.confidence * edgeB.confidence * 0.9;
        results.push({
          fromNodeId: edgeA.fromNodeId,
          toNodeId: edgeB.toNodeId,
          type: edgeType,
          confidence: Math.min(1, inferredConf),
          reason: `transitive:${edgeType}:hop2`,
        });
        existing.add(key);
      }
    }
  }

  if (maxHops >= 3) {
    const hop2Keys = new Set(results.map((r) => `${r.fromNodeId}→${r.toNodeId}`));
    for (const inferred of [...results]) {
      for (const edgeC of store.listEdges({ fromNodeId: inferred.toNodeId, type: edgeType })) {
        const key = `${inferred.fromNodeId}→${edgeC.toNodeId}`;
        if (!existing.has(key) && !hop2Keys.has(key) && inferred.fromNodeId !== edgeC.toNodeId) {
          results.push({
            fromNodeId: inferred.fromNodeId,
            toNodeId: edgeC.toNodeId,
            type: edgeType,
            confidence: Math.min(1, inferred.confidence * edgeC.confidence * 0.9),
            reason: `transitive:${edgeType}:hop3`,
          });
          existing.add(key);
        }
      }
    }
  }

  return results;
}

/**
 * Infer cross-domain "similar-to" edges for nodes that share an alias value
 * but live in different domains.
 */
export function inferCrossDomainSimilarity(store: GraphStore): InferredEdge[] {
  const aliasValueIndex = new Map<string, string[]>();

  for (const node of store.listNodes()) {
    for (const alias of node.aliases ?? []) {
      const key = alias.aliasValue;
      const ids = aliasValueIndex.get(key) ?? [];
      ids.push(node.id);
      aliasValueIndex.set(key, ids);
    }
  }

  const existingKeys = new Set(
    store.listEdges({ type: 'similar-to' }).map((e) => `${e.fromNodeId}→${e.toNodeId}`),
  );

  const results: InferredEdge[] = [];
  const seen = new Set<string>();

  for (const [, nodeIds] of aliasValueIndex) {
    if (nodeIds.length < 2) continue;
    for (let i = 0; i < nodeIds.length; i++) {
      for (let j = i + 1; j < nodeIds.length; j++) {
        const a = nodeIds[i]!;
        const b = nodeIds[j]!;
        const nodeA = store.getNode(a);
        const nodeB = store.getNode(b);
        if (!nodeA || !nodeB) continue;
        if (nodeA.domain === nodeB.domain) continue;
        const key = [a, b].sort().join('↔');
        if (seen.has(key)) continue;
        seen.add(key);
        const fwd = `${a}→${b}`;
        const rev = `${b}→${a}`;
        if (!existingKeys.has(fwd) && !existingKeys.has(rev)) {
          results.push({
            fromNodeId: a,
            toNodeId: b,
            type: 'similar-to',
            confidence: 0.7,
            reason: 'cross-domain-alias-match',
          });
        }
      }
    }
  }

  return results;
}
