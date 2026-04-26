import { CatalogSearch } from './catalog-search.js';
import type { ToolManifest } from './manifest.js';

export interface ToolSearchResult {
  toolId: string;
  name: string;
  description: string;
  domainTags: string[];
  score: number;
}

export interface SearchToolsOptions {
  limit?: number;
  domainTag?: string;
}

export interface ToolRegistry {
  register(manifest: ToolManifest): void;
  get(toolId: string): ToolManifest | undefined;
  list(filter?: { domainTag?: string; policyTier?: string; enabled?: boolean }): ToolManifest[];
  unregister(toolId: string): boolean;
  count(): number;
  search(query: string, limit?: number): ToolManifest[];
  searchTools(query: string, options?: SearchToolsOptions): ToolSearchResult[];
  getToolDetails(toolId: string): ToolManifest | undefined;
  onToolsChanged?: (listener: () => void) => () => void;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9_\-. ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function bm25Score(
  queryTokens: string[],
  docTokens: string[],
  docLength: number,
  avgDocLength: number,
  k1 = 1.5,
  b = 0.75,
): number {
  const tf = new Map<string, number>();
  for (const t of docTokens) tf.set(t, (tf.get(t) ?? 0) + 1);

  let score = 0;
  for (const qt of queryTokens) {
    const freq = tf.get(qt) ?? 0;
    if (freq === 0) continue;
    const tfScore = (freq * (k1 + 1)) / (freq + k1 * (1 - b + b * (docLength / avgDocLength)));
    score += tfScore;
  }
  return score;
}

export class InMemoryToolRegistry implements ToolRegistry {
  private readonly manifests = new Map<string, ToolManifest>();
  private readonly catalogSearch = new CatalogSearch();
  private readonly changeListeners = new Set<() => void>();

  register(manifest: ToolManifest): void {
    this.manifests.set(manifest.id, manifest);
    this.catalogSearch.addDocument(manifest);
    this.notifyChanged();
  }

  get(toolId: string): ToolManifest | undefined {
    return this.manifests.get(toolId);
  }

  getToolDetails(toolId: string): ToolManifest | undefined {
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

  searchTools(query: string, options: SearchToolsOptions = {}): ToolSearchResult[] {
    const { limit = 10, domainTag } = options;
    const queryTokens = tokenize(query);

    if (queryTokens.length === 0) {
      const all = this.list({ enabled: true, ...(domainTag ? { domainTag } : {}) });
      return all.slice(0, limit).map((m) => ({
        toolId: m.id,
        name: m.name,
        description: m.description,
        domainTags: m.domainTags,
        score: 0,
      }));
    }

    let candidates = this.list({ enabled: true });
    if (domainTag) {
      candidates = candidates.filter((m) =>
        m.domainTags.includes(domainTag as ToolManifest['domainTags'][0]),
      );
    }

    const docTexts = candidates.map((m) => {
      const text = [m.name, m.description, ...m.domainTags].join(' ');
      return { manifest: m, tokens: tokenize(text) };
    });

    const avgDocLength =
      docTexts.length === 0
        ? 1
        : docTexts.reduce((sum, d) => sum + d.tokens.length, 0) / docTexts.length;

    const scored = docTexts
      .map(({ manifest: m, tokens }) => ({
        toolId: m.id,
        name: m.name,
        description: m.description,
        domainTags: m.domainTags,
        score: bm25Score(queryTokens, tokens, tokens.length, avgDocLength),
      }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored;
  }

  unregister(toolId: string): boolean {
    const deleted = this.manifests.delete(toolId);
    if (deleted) {
      this.catalogSearch.removeDocument(toolId);
      this.notifyChanged();
    }
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

  onToolsChanged(listener: () => void): () => void {
    this.changeListeners.add(listener);
    return () => {
      this.changeListeners.delete(listener);
    };
  }

  private notifyChanged(): void {
    for (const listener of this.changeListeners) {
      try {
        listener();
      } catch {
        // listeners must not break the registry
      }
    }
  }
}

export const defaultToolRegistry = new InMemoryToolRegistry();
