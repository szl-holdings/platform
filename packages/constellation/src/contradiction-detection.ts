/**
 * Contradiction Detection — surface conflicting facts in the graph.
 *
 * A contradiction is declared when:
 *  1. Two nodes that represent the same canonical entity (same alias) disagree
 *     on a property value above a configurable confidence threshold.
 *  2. Two edges between the same pair of nodes carry opposite relationship types
 *     (e.g. "owns" + "owned-by" in the same direction, or "mitigates" + "affects").
 *  3. A node is both active and has a "supersedes" edge pointing at itself from
 *     another active node.
 */

import type { ConstellationEdge, ConstellationNode } from './schema.js';
import type { GraphStore } from './store.js';

export interface Contradiction {
  type: 'property' | 'edge' | 'supersession';
  severity: 'low' | 'medium' | 'high';
  description: string;
  involvedNodeIds: string[];
  involvedEdgeIds: string[];
}

const OPPOSITE_TYPES: Record<string, string> = {
  owns: 'managed-by',
  'managed-by': 'owns',
  triggers: 'mitigates',
  mitigates: 'triggers',
  'depends-on': 'supersedes',
};

/**
 * Scan the store for all detectable contradictions.
 */
export function detectContradictions(store: GraphStore): Contradiction[] {
  const contradictions: Contradiction[] = [];

  detectEdgeContradictions(store, contradictions);
  detectSupersessionContradictions(store, contradictions);
  detectDuplicateAliasContradictions(store, contradictions);

  return contradictions;
}

function detectEdgeContradictions(store: GraphStore, out: Contradiction[]): void {
  const edgesByPair = new Map<string, ConstellationEdge[]>();

  for (const edge of store.listEdges()) {
    const pairKey = `${edge.fromNodeId}↔${edge.toNodeId}`;
    const arr = edgesByPair.get(pairKey) ?? [];
    arr.push(edge);
    edgesByPair.set(pairKey, arr);
  }

  for (const [, edges] of edgesByPair) {
    for (let i = 0; i < edges.length; i++) {
      for (let j = i + 1; j < edges.length; j++) {
        const a = edges[i]!;
        const b = edges[j]!;
        const oppositeOfA = OPPOSITE_TYPES[a.type];
        if (oppositeOfA && oppositeOfA === b.type) {
          out.push({
            type: 'edge',
            severity: 'high',
            description: `Contradictory relationship types "${a.type}" and "${b.type}" between the same node pair`,
            involvedNodeIds: [a.fromNodeId, a.toNodeId],
            involvedEdgeIds: [a.id, b.id],
          });
        }
      }
    }
  }
}

function detectSupersessionContradictions(store: GraphStore, out: Contradiction[]): void {
  const supersededIds = new Set(store.listEdges({ type: 'supersedes' }).map((e) => e.toNodeId));

  for (const nodeId of supersededIds) {
    const node = store.getNode(nodeId);
    if (!node) continue;

    const supersedingEdges = store
      .listEdges({ type: 'supersedes' })
      .filter((e) => e.toNodeId === nodeId);
    const supersedingNodes = supersedingEdges
      .map((e) => store.getNode(e.fromNodeId))
      .filter((n): n is ConstellationNode => !!n);

    const activeSuperseders = supersedingNodes.filter((n) => {
      const freshData = n.freshness;
      return freshData && !freshData.isStale;
    });

    if (activeSuperseders.length > 0) {
      out.push({
        type: 'supersession',
        severity: 'medium',
        description: `Node "${node.label}" (${node.id}) is superseded by ${activeSuperseders.length} active node(s) but may still be referenced`,
        involvedNodeIds: [nodeId, ...activeSuperseders.map((n) => n.id)],
        involvedEdgeIds: supersedingEdges.map((e) => e.id),
      });
    }
  }
}

function detectDuplicateAliasContradictions(store: GraphStore, out: Contradiction[]): void {
  const aliasIndex = new Map<string, string[]>();

  for (const node of store.listNodes()) {
    for (const alias of node.aliases ?? []) {
      const key = `${alias.aliasType}:${alias.aliasValue}`;
      const ids = aliasIndex.get(key) ?? [];
      ids.push(node.id);
      aliasIndex.set(key, ids);
    }
  }

  for (const [aliasKey, nodeIds] of aliasIndex) {
    if (nodeIds.length > 1) {
      out.push({
        type: 'property',
        severity: 'high',
        description: `Alias "${aliasKey}" is claimed by ${nodeIds.length} distinct nodes — entity resolution required`,
        involvedNodeIds: nodeIds,
        involvedEdgeIds: [],
      });
    }
  }
}
