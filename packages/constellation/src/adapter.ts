import type { ConstellationNode, ConstellationEdge } from "./schema.js";
import type { CstDomain, CstNodeTypeRegistration, CreateCstNode, CstNode } from "./types.ts";

export interface DomainAdapter<TSource = unknown> {
  readonly domain: string;
  readonly sourceType: string;
  projectNode(source: TSource): ConstellationNode;
  projectEdges?(source: TSource, allNodes: ConstellationNode[]): ConstellationEdge[];
}

export interface AdapterRegistry {
  register<T>(adapter: DomainAdapter<T>): void;
  get(domain: string, sourceType: string): DomainAdapter | undefined;
  list(): Array<{ domain: string; sourceType: string }>;
}

class InMemoryAdapterRegistry implements AdapterRegistry {
  private readonly adapters = new Map<string, DomainAdapter>();

  register<T>(adapter: DomainAdapter<T>): void {
    const key = `${adapter.domain}:${adapter.sourceType}`;
    this.adapters.set(key, adapter as DomainAdapter);
  }

  get(domain: string, sourceType: string): DomainAdapter | undefined {
    return this.adapters.get(`${domain}:${sourceType}`);
  }

  list(): Array<{ domain: string; sourceType: string }> {
    return Array.from(this.adapters.keys()).map((k) => {
      const [domain, sourceType] = k.split(":");
      return { domain: domain ?? "", sourceType: sourceType ?? "" };
    });
  }
}

export const adapterRegistry: AdapterRegistry = new InMemoryAdapterRegistry();

export function projectDomain<T>(
  adapter: DomainAdapter<T>,
  sources: T[]
): { nodes: ConstellationNode[]; edges: ConstellationEdge[] } {
  const nodes = sources.map((s) => adapter.projectNode(s));
  const edges = sources.flatMap((s) => adapter.projectEdges?.(s, nodes) ?? []);
  return { nodes, edges };
}

export interface ConstellationAdapter {
  readonly domain: CstDomain;
  readonly nodeTypes: CstNodeTypeRegistration[];
  upsertEntity(input: CreateCstNode): Promise<CstNode>;
  lookupByAlias(aliasType: string, aliasValue: string): Promise<CstNode | null>;
}
