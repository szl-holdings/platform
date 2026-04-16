import type { GraphStore } from "./store.js";
import type { ConstellationNode, ConstellationEdge } from "./schema.js";
import { defaultGraphStore } from "./store.js";

export interface GraphQueryOptions {
  store?: GraphStore;
}

export function findNeighbors(
  nodeId: string,
  direction: "outgoing" | "incoming" | "both" = "both",
  opts: GraphQueryOptions = {}
): { nodes: ConstellationNode[]; edges: ConstellationEdge[] } {
  const store = opts.store ?? defaultGraphStore;
  const edges: ConstellationEdge[] = [];

  if (direction === "outgoing" || direction === "both") {
    edges.push(...store.listEdges({ fromNodeId: nodeId }));
  }
  if (direction === "incoming" || direction === "both") {
    edges.push(...store.listEdges({ toNodeId: nodeId }));
  }

  const uniqueEdges = Array.from(new Map(edges.map((e) => [e.id, e])).values());
  const neighborIds = new Set<string>();
  for (const edge of uniqueEdges) {
    if (edge.fromNodeId !== nodeId) neighborIds.add(edge.fromNodeId);
    if (edge.toNodeId !== nodeId) neighborIds.add(edge.toNodeId);
  }

  const nodes = Array.from(neighborIds)
    .map((id) => store.getNode(id))
    .filter((n): n is ConstellationNode => n !== undefined);

  return { nodes, edges: uniqueEdges };
}

export function findPath(
  fromId: string,
  toId: string,
  maxDepth = 5,
  opts: GraphQueryOptions = {}
): ConstellationNode[] | null {
  const store = opts.store ?? defaultGraphStore;
  const visited = new Set<string>();
  const queue: Array<{ id: string; path: string[] }> = [{ id: fromId, path: [fromId] }];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    if (current.id === toId) {
      return current.path
        .map((id) => store.getNode(id))
        .filter((n): n is ConstellationNode => n !== undefined);
    }
    if (current.path.length >= maxDepth || visited.has(current.id)) continue;
    visited.add(current.id);

    const outgoing = store.listEdges({ fromNodeId: current.id });
    for (const edge of outgoing) {
      if (!visited.has(edge.toNodeId)) {
        queue.push({ id: edge.toNodeId, path: [...current.path, edge.toNodeId] });
      }
    }
  }

  return null;
}

export function subgraph(
  rootId: string,
  depth = 2,
  opts: GraphQueryOptions = {}
): { nodes: ConstellationNode[]; edges: ConstellationEdge[] } {
  const store = opts.store ?? defaultGraphStore;
  const visitedNodes = new Set<string>([rootId]);
  const visitedEdges = new Set<string>();
  let frontier = [rootId];

  for (let d = 0; d < depth; d++) {
    const nextFrontier: string[] = [];
    for (const nodeId of frontier) {
      const edges = store.listEdges({ fromNodeId: nodeId });
      for (const edge of edges) {
        visitedEdges.add(edge.id);
        if (!visitedNodes.has(edge.toNodeId)) {
          visitedNodes.add(edge.toNodeId);
          nextFrontier.push(edge.toNodeId);
        }
      }
    }
    frontier = nextFrontier;
  }

  const nodes = Array.from(visitedNodes)
    .map((id) => store.getNode(id))
    .filter((n): n is ConstellationNode => n !== undefined);
  const edges = Array.from(visitedEdges)
    .map((id) => store.getEdge(id))
    .filter((e): e is ConstellationEdge => e !== undefined);

  return { nodes, edges };
}

export function searchNodes(
  query: string,
  opts: GraphQueryOptions & { domain?: string; type?: string } = {}
): ConstellationNode[] {
  const store = opts.store ?? defaultGraphStore;
  const lq = query.toLowerCase();
  return store
    .listNodes({ domain: opts.domain as ConstellationNode["domain"] | undefined, type: opts.type as ConstellationNode["type"] | undefined })
    .filter(
      (n) =>
        n.label.toLowerCase().includes(lq) ||
        n.id.toLowerCase().includes(lq) ||
        n.tags.some((t) => t.toLowerCase().includes(lq))
    );
}
