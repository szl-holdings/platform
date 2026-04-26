import { CatalogSearch } from './catalog-search.js';
import type { ToolManifest } from './manifest.js';

export interface ToolRegistry {
  register(manifest: ToolManifest): void;
  get(toolId: string): ToolManifest | undefined;
  list(filter?: { domainTag?: string; policyTier?: string; enabled?: boolean }): ToolManifest[];
  unregister(toolId: string): boolean;
  count(): number;
  search(query: string, limit?: number): ToolManifest[];
}

export class InMemoryToolRegistry implements ToolRegistry {
  private readonly manifests = new Map<string, ToolManifest>();
  private readonly catalogSearch = new CatalogSearch();

  register(manifest: ToolManifest): void {
    this.manifests.set(manifest.id, manifest);
    this.catalogSearch.addDocument(manifest);
  }

  get(toolId: string): ToolManifest | undefined {
    return this.manifests.get(toolId);
  }

  list(filter?: { domainTag?: string; policyTier?: string; enabled?: boolean }): ToolManifest[] {
    let results = Array.from(this.manifests.values());
    if (filter?.domainTag)
      results = results.filter((m) =>
        m.domainTags.includes(filter.domainTag as ToolManifest['domainTags'][0]),
      );
    if (filter?.policyTier) results = results.filter((m) => m.policyTier === filter.policyTier);
    if (filter?.enabled !== undefined)
      results = results.filter((m) => m.enabled === filter.enabled);
    return results;
  }

  unregister(toolId: string): boolean {
    const deleted = this.manifests.delete(toolId);
    if (deleted) this.catalogSearch.removeDocument(toolId);
    return deleted;
  }

  count(): number {
    return this.manifests.size;
  }

  search(query: string, limit = 10): ToolManifest[] {
    return this.catalogSearch.search(query, limit).map((r) => r.manifest);
  }

  /**
   * Expose the internal CatalogSearch instance so consumers (e.g. CodeSandbox)
   * can wire against the same indexed document set as the registry.
   */
  getCatalogSearch(): CatalogSearch {
    return this.catalogSearch;
  }
}

export const defaultToolRegistry = new InMemoryToolRegistry();
