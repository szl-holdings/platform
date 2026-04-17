import type { ConstellationNode, ConstellationEdge } from "./schema.js";

export interface GraphStore {
  upsertNode(node: ConstellationNode): void;
  upsertEdge(edge: ConstellationEdge): void;
  getNode(id: string): ConstellationNode | undefined;
  getEdge(id: string): ConstellationEdge | undefined;
  deleteNode(id: string): boolean;
  deleteEdge(id: string): boolean;
  listNodes(filter?: Partial<Pick<ConstellationNode, "type" | "domain">>): ConstellationNode[];
  listEdges(filter?: { fromNodeId?: string; toNodeId?: string; type?: string }): ConstellationEdge[];
  lookupByAlias(aliasType: string, aliasValue: string): ConstellationNode | undefined;
  nodeCount(): number;
  edgeCount(): number;
  clear(): void;
}

export class InMemoryGraphStore implements GraphStore {
  private nodes = new Map<string, ConstellationNode>();
  private edges = new Map<string, ConstellationEdge>();
  /** aliasType:aliasValue → canonical node id */
  private aliasIndex = new Map<string, string>();

  upsertNode(node: ConstellationNode): void {
    const existing = this.nodes.get(node.id);
    if (existing) {
      for (const alias of existing.aliases ?? []) {
        const key = `${alias.aliasType}:${alias.aliasValue}`;
        if (this.aliasIndex.get(key) === node.id) {
          this.aliasIndex.delete(key);
        }
      }
    }
    this.nodes.set(node.id, node);
    for (const alias of node.aliases ?? []) {
      const key = `${alias.aliasType}:${alias.aliasValue}`;
      this.aliasIndex.set(key, node.id);
    }
  }

  upsertEdge(edge: ConstellationEdge): void {
    this.edges.set(edge.id, edge);
  }

  getNode(id: string): ConstellationNode | undefined {
    return this.nodes.get(id);
  }

  getEdge(id: string): ConstellationEdge | undefined {
    return this.edges.get(id);
  }

  deleteNode(id: string): boolean {
    const node = this.nodes.get(id);
    if (node) {
      for (const alias of node.aliases ?? []) {
        this.aliasIndex.delete(`${alias.aliasType}:${alias.aliasValue}`);
      }
    }
    return this.nodes.delete(id);
  }

  deleteEdge(id: string): boolean {
    return this.edges.delete(id);
  }

  listNodes(filter?: Partial<Pick<ConstellationNode, "type" | "domain">>): ConstellationNode[] {
    let results = Array.from(this.nodes.values());
    if (filter?.type) results = results.filter((n) => n.type === filter.type);
    if (filter?.domain) results = results.filter((n) => n.domain === filter.domain);
    return results;
  }

  listEdges(filter?: { fromNodeId?: string; toNodeId?: string; type?: string }): ConstellationEdge[] {
    let results = Array.from(this.edges.values());
    if (filter?.fromNodeId) results = results.filter((e) => e.fromNodeId === filter.fromNodeId);
    if (filter?.toNodeId) results = results.filter((e) => e.toNodeId === filter.toNodeId);
    if (filter?.type) results = results.filter((e) => e.type === filter.type);
    return results;
  }

  lookupByAlias(aliasType: string, aliasValue: string): ConstellationNode | undefined {
    const nodeId = this.aliasIndex.get(`${aliasType}:${aliasValue}`);
    if (!nodeId) return undefined;
    return this.nodes.get(nodeId);
  }

  nodeCount(): number {
    return this.nodes.size;
  }

  edgeCount(): number {
    return this.edges.size;
  }

  clear(): void {
    this.nodes.clear();
    this.edges.clear();
    this.aliasIndex.clear();
  }
}

export const defaultGraphStore = new InMemoryGraphStore();
