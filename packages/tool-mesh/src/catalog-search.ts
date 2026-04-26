/**
 * Tool + Skill Catalog — Keyword/BM25 Search
 *
 * Exports two classes:
 *
 * • `CatalogSearch` — original tool-only BM25 index with addDocument/removeDocument API.
 *   Used by CodeSandbox and existing tests.
 *
 * • `CatalogSearchEngine` — extended index that handles both ToolManifest records and
 *   free-form skill entries via indexTools()/indexSkills() API.
 *   Used by the PRAXIS catalog-search bridge tool and the API catalog-search route.
 *
 * Both use BM25 (Robertson-Sparck Jones, b=0.75). `CatalogSearch` uses k1=1.2 with
 * stop-word filtering; `CatalogSearchEngine` uses k1=1.5 (TREC default).
 *
 * The exported `defaultCatalogSearch` singleton is a `CatalogSearchEngine` instance.
 */

import type { ToolManifest } from './manifest.js';

// ─── Shared BM25 constant ─────────────────────────────────────────────────────

const BM25_B = 0.75;

// ─── CatalogSearch — original tool-only implementation ───────────────────────

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'by', 'for', 'from',
  'has', 'have', 'in', 'is', 'it', 'its', 'of', 'on', 'or', 'that', 'the',
  'this', 'to', 'was', 'were', 'will', 'with',
]);

const CATALOG_SEARCH_K1 = 1.2;

function tokenizeWithStopWords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

function fieldTokens(manifest: ToolManifest): string[] {
  const parts: string[] = [manifest.name, manifest.description, ...manifest.domainTags];
  return parts.flatMap(tokenizeWithStopWords);
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

    const queryTerms = tokenizeWithStopWords(query);
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
        const tfNorm =
          (tf * (CATALOG_SEARCH_K1 + 1)) /
          (tf + CATALOG_SEARCH_K1 * (1 - BM25_B + BM25_B * (dl / avgdl)));
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

  getManifests(): ToolManifest[] {
    return Array.from(this.manifests.values());
  }
}

// ─── CatalogSearchEngine types (tool + skill) ─────────────────────────────────

export interface CatalogSkillEntry {
  id: string;
  name: string;
  description: string;
  tags?: string[];
  domain?: string;
  primitiveType?: string;
  enabled?: boolean;
  [key: string]: unknown;
}

export type CatalogEntryKind = 'tool' | 'skill';

export interface CatalogSearchHit {
  id: string;
  kind: CatalogEntryKind;
  name: string;
  description: string;
  score: number;
  tags: string[];
  domain?: string;
  enabled: boolean;
  metadata: Record<string, unknown>;
}

export interface CatalogSearchOptions {
  query: string;
  topK?: number;
  kinds?: CatalogEntryKind[];
  domain?: string;
  enabledOnly?: boolean;
}

// ─── CatalogSearchEngine — extended tool + skill implementation ───────────────

const CATALOG_ENGINE_K1 = 1.5;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function termFrequency(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const t of tokens) {
    tf.set(t, (tf.get(t) ?? 0) + 1);
  }
  return tf;
}

interface IndexedDoc {
  id: string;
  kind: CatalogEntryKind;
  name: string;
  description: string;
  tags: string[];
  domain?: string;
  enabled: boolean;
  tokens: string[];
  tf: Map<string, number>;
  metadata: Record<string, unknown>;
}

export class CatalogSearchEngine {
  private docs: IndexedDoc[] = [];

  indexTools(manifests: ToolManifest[]): void {
    for (const m of manifests) {
      const existing = this.docs.findIndex((d) => d.id === m.id && d.kind === 'tool');
      const doc = this.buildToolDoc(m);
      if (existing >= 0) {
        this.docs[existing] = doc;
      } else {
        this.docs.push(doc);
      }
    }
  }

  indexSkills(skills: CatalogSkillEntry[]): void {
    for (const s of skills) {
      const existing = this.docs.findIndex((d) => d.id === s.id && d.kind === 'skill');
      const doc = this.buildSkillDoc(s);
      if (existing >= 0) {
        this.docs[existing] = doc;
      } else {
        this.docs.push(doc);
      }
    }
  }

  removeDoc(id: string, kind: CatalogEntryKind): void {
    this.docs = this.docs.filter((d) => !(d.id === id && d.kind === kind));
  }

  search(opts: CatalogSearchOptions): CatalogSearchHit[] {
    const { query, topK = 10, kinds, domain, enabledOnly = false } = opts;

    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) return [];

    let candidates = this.docs;
    if (kinds && kinds.length > 0) {
      candidates = candidates.filter((d) => kinds.includes(d.kind));
    }
    if (domain) {
      candidates = candidates.filter((d) => d.domain === domain);
    }
    if (enabledOnly) {
      candidates = candidates.filter((d) => d.enabled);
    }

    if (candidates.length === 0) return [];

    const avgDocLen = candidates.reduce((s, d) => s + d.tokens.length, 0) / candidates.length;

    const idf = new Map<string, number>();
    for (const term of queryTokens) {
      const df = candidates.filter((d) => d.tf.has(term)).length;
      idf.set(term, Math.log((candidates.length - df + 0.5) / (df + 0.5) + 1));
    }

    const scored = candidates.map((doc) => {
      let score = 0;
      for (const term of queryTokens) {
        const tf = doc.tf.get(term) ?? 0;
        if (tf === 0) continue;
        const termIdf = idf.get(term) ?? 0;
        const numerator = tf * (CATALOG_ENGINE_K1 + 1);
        const denominator =
          tf + CATALOG_ENGINE_K1 * (1 - BM25_B + BM25_B * (doc.tokens.length / avgDocLen));
        score += termIdf * (numerator / denominator);
      }
      return { doc, score };
    });

    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(({ doc, score }) => ({
        id: doc.id,
        kind: doc.kind,
        name: doc.name,
        description: doc.description,
        score: Math.round(score * 1000) / 1000,
        tags: doc.tags,
        domain: doc.domain,
        enabled: doc.enabled,
        metadata: doc.metadata,
      }));
  }

  count(): { tools: number; skills: number } {
    return {
      tools: this.docs.filter((d) => d.kind === 'tool').length,
      skills: this.docs.filter((d) => d.kind === 'skill').length,
    };
  }

  private buildToolDoc(m: ToolManifest): IndexedDoc {
    const textParts = [m.name, m.description, ...m.domainTags, m.policyTier, m.owner ?? ''];
    const tokens = tokenize(textParts.join(' '));
    return {
      id: m.id,
      kind: 'tool',
      name: m.name,
      description: m.description,
      tags: m.domainTags,
      domain: m.domainTags[0],
      enabled: m.enabled,
      tokens,
      tf: termFrequency(tokens),
      metadata: {
        policyTier: m.policyTier,
        version: m.version,
        approvalRequired: m.approvalRequired,
        timeoutMs: m.timeoutMs,
        owner: m.owner,
      },
    };
  }

  private buildSkillDoc(s: CatalogSkillEntry): IndexedDoc {
    const textParts = [
      s.name,
      s.description,
      ...(s.tags ?? []),
      s.domain ?? '',
      s.primitiveType ?? '',
    ];
    const tokens = tokenize(textParts.join(' '));
    return {
      id: s.id,
      kind: 'skill',
      name: s.name,
      description: s.description,
      tags: s.tags ?? [],
      domain: s.domain,
      enabled: s.enabled !== false,
      tokens,
      tf: termFrequency(tokens),
      metadata: {
        primitiveType: s.primitiveType,
        ...Object.fromEntries(
          Object.entries(s).filter(
            ([k]) =>
              !['id', 'name', 'description', 'tags', 'domain', 'primitiveType', 'enabled'].includes(
                k,
              ),
          ),
        ),
      },
    };
  }
}

// ─── Singleton exports ────────────────────────────────────────────────────────

export const defaultCatalogSearch = new CatalogSearchEngine();
