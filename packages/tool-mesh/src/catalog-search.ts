import type { ToolManifest } from './manifest.js';

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'by', 'for', 'from',
  'has', 'have', 'in', 'is', 'it', 'its', 'of', 'on', 'or', 'that', 'the',
  'this', 'to', 'was', 'were', 'will', 'with',
]);

const BM25_K1 = 1.2;
const BM25_B = 0.75;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

function fieldTokens(manifest: ToolManifest): string[] {
  const parts: string[] = [manifest.name, manifest.description, ...manifest.domainTags];
  return parts.flatMap(tokenize);
}

interface PostingEntry {
  tf: number;
}

export interface CatalogSearchResult {
  manifest: ToolManifest;
  score: number;
}

export class CatalogSearch {
  private readonly manifests = new Map<string, ToolManifest>();
  private readonly invertedIndex = new Map<string, Map<string, PostingEntry>>();
  private readonly docLengths = new Map<string, number>();
  private totalTokens = 0;

  addDocument(manifest: ToolManifest): void {
    this.removeDocument(manifest.id);

    const tokens = fieldTokens(manifest);
    this.manifests.set(manifest.id, manifest);
    this.docLengths.set(manifest.id, tokens.length);
    this.totalTokens += tokens.length;

    const tfMap = new Map<string, number>();
    for (const token of tokens) {
      tfMap.set(token, (tfMap.get(token) ?? 0) + 1);
    }

    for (const [term, tf] of tfMap) {
      if (!this.invertedIndex.has(term)) {
        this.invertedIndex.set(term, new Map());
      }
      this.invertedIndex.get(term)!.set(manifest.id, { tf });
    }
  }

  removeDocument(docId: string): void {
    if (!this.manifests.has(docId)) return;

    const manifest = this.manifests.get(docId)!;
    const tokens = fieldTokens(manifest);
    const docLen = this.docLengths.get(docId) ?? 0;
    this.totalTokens -= docLen;

    const seenTerms = new Set(tokens);
    for (const term of seenTerms) {
      const postings = this.invertedIndex.get(term);
      if (postings) {
        postings.delete(docId);
        if (postings.size === 0) this.invertedIndex.delete(term);
      }
    }

    this.manifests.delete(docId);
    this.docLengths.delete(docId);
  }

  search(query: string, limit = 10): CatalogSearchResult[] {
    const N = this.manifests.size;
    if (N === 0) return [];

    const queryTerms = tokenize(query);
    if (queryTerms.length === 0) return [];

    const avgdl = this.totalTokens / N;
    const scores = new Map<string, number>();

    for (const term of queryTerms) {
      const postings = this.invertedIndex.get(term);
      if (!postings) continue;

      const df = postings.size;
      const idf = Math.log((N - df + 0.5) / (df + 0.5) + 1);

      for (const [docId, { tf }] of postings) {
        const dl = this.docLengths.get(docId) ?? 0;
        const tfNorm = (tf * (BM25_K1 + 1)) / (tf + BM25_K1 * (1 - BM25_B + BM25_B * (dl / avgdl)));
        scores.set(docId, (scores.get(docId) ?? 0) + idf * tfNorm);
      }
    }

    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([docId, score]) => ({ manifest: this.manifests.get(docId)!, score }))
      .filter((r) => r.manifest !== undefined);
  }

  size(): number {
    return this.manifests.size;
  }

  /**
   * Return a shallow array of all indexed manifests.
   * Used to serialize a snapshot to worker threads at execution time.
   */
  getManifests(): ToolManifest[] {
    return Array.from(this.manifests.values());
  }
}

export const defaultCatalogSearch = new CatalogSearch();
