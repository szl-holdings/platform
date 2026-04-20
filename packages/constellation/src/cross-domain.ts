/**
 * Cross-Domain Query Helpers — query the graph across domain boundaries.
 *
 * These helpers operate on an in-memory GraphStore and let cognitive subsystems
 * reason about entities that span multiple domains (e.g. a vessel that is also
 * a sanctioned counterparty in the legal domain and a cyber asset in Aegis).
 */

import type { ConstellationEdge, ConstellationNode } from './schema.js';
import type { GraphStore } from './store.js';

export interface CrossDomainNode {
  node: ConstellationNode;
  domain: string;
  reachableVia: string[];
}

export interface CrossDomainResult {
  seedNodeId: string;
  nodes: CrossDomainNode[];
  edges: ConstellationEdge[];
  domainsCovered: string[];
}

/**
 * Starting from a seed node, collect all reachable nodes that belong to
 * different domains, up to `maxHops` edge hops.  Returns them grouped with
 * the edges that connect them.
 */
export function queryCrossDomain(
  store: GraphStore,
  seedNodeId: string,
  options: { maxHops?: number; targetDomains?: string[] } = {},
): CrossDomainResult {
  const { maxHops = 3, targetDomains } = options;

  const seed = store.getNode(seedNodeId);
  if (!seed) {
    return { seedNodeId, nodes: [], edges: [], domainsCovered: [] };
  }

  const visited = new Map<string, number>(); // id → hop at which first reached
  visited.set(seedNodeId, 0);
  let frontier = [seedNodeId];
  const collectedEdges: ConstellationEdge[] = [];

  for (let hop = 1; hop <= maxHops; hop++) {
    if (frontier.length === 0) break;
    const nextFrontier: string[] = [];

    for (const nodeId of frontier) {
      const outEdges = store.listEdges({ fromNodeId: nodeId });
      const inEdges = store.listEdges({ toNodeId: nodeId });

      for (const edge of [...outEdges, ...inEdges]) {
        const otherId = edge.fromNodeId === nodeId ? edge.toNodeId : edge.fromNodeId;
        if (!visited.has(otherId)) {
          visited.set(otherId, hop);
          nextFrontier.push(otherId);
          collectedEdges.push(edge);
        }
      }
    }

    frontier = nextFrontier;
  }

  const crossDomainNodes: CrossDomainNode[] = [];
  const domainSet = new Set<string>();

  for (const [nodeId] of visited) {
    if (nodeId === seedNodeId) continue;
    const node = store.getNode(nodeId);
    if (!node) continue;
    if (node.domain === seed.domain) continue;
    if (targetDomains && !targetDomains.includes(node.domain)) continue;

    domainSet.add(node.domain);
    const pathEdges = collectedEdges.filter(
      (e) => e.fromNodeId === nodeId || e.toNodeId === nodeId,
    );
    const reachableVia = pathEdges.map((e) => e.id);

    crossDomainNodes.push({ node, domain: node.domain, reachableVia });
  }

  return {
    seedNodeId,
    nodes: crossDomainNodes,
    edges: collectedEdges,
    domainsCovered: Array.from(domainSet),
  };
}

/**
 * Find all nodes in the store that exist in multiple domains (i.e. shared via
 * aliases pointing to nodes with different domain values).
 */
export function findMultiDomainEntities(
  store: GraphStore,
): Array<{ aliasValue: string; nodes: ConstellationNode[] }> {
  const aliasValueToNodes = new Map<string, ConstellationNode[]>();

  for (const node of store.listNodes()) {
    for (const alias of node.aliases ?? []) {
      const key = alias.aliasValue;
      const existing = aliasValueToNodes.get(key) ?? [];
      if (!existing.find((n) => n.id === node.id)) {
        existing.push(node);
        aliasValueToNodes.set(key, existing);
      }
    }
  }

  const results: Array<{ aliasValue: string; nodes: ConstellationNode[] }> = [];
  for (const [aliasValue, nodes] of aliasValueToNodes) {
    const domains = new Set(nodes.map((n) => n.domain));
    if (domains.size > 1) {
      results.push({ aliasValue, nodes });
    }
  }

  return results;
}

/**
 * Summarise how many entities from each domain are reachable from `seedNodeId`
 * within `maxHops`. Useful for quick "impact radius" queries.
 */
export function domainReachability(
  store: GraphStore,
  seedNodeId: string,
  maxHops = 3,
): Record<string, number> {
  const { nodes } = queryCrossDomain(store, seedNodeId, { maxHops });
  const counts: Record<string, number> = {};
  for (const { domain } of nodes) {
    counts[domain] = (counts[domain] ?? 0) + 1;
  }
  return counts;
}
