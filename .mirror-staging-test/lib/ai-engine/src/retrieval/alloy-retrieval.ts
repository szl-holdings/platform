import type { EvidenceItem } from "../schemas/action-decision.js";

export interface RetrievalChunk {
  id: string;
  content: string;
  source: string;
  sourceType: EvidenceItem["sourceType"];
  objectId: string | null;
  timestamp: string | null;
  sensitivityClass: "public" | "internal" | "confidential" | "restricted";
  embedding?: number[];
  metadata: Record<string, unknown>;
}

export interface RetrievalResult {
  chunks: ScoredChunk[];
  query: string;
  method: "semantic" | "keyword" | "hybrid";
  totalIndexed: number;
  latencyMs: number;
}

export interface ScoredChunk extends RetrievalChunk {
  score: number;
  matchType: "semantic" | "keyword";
}

export interface RerankResult {
  chunks: ScoredChunk[];
  model: string;
  latencyMs: number;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    dot += a[i]! * b[i]!;
    magA += a[i]! * a[i]!;
    magB += b[i]! * b[i]!;
  }
  return magA > 0 && magB > 0 ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
}

export class AlloyRetrievalEngine {
  private chunks: RetrievalChunk[] = [];
  private static readonly MAX_CHUNKS = 10000;

  get indexedCount(): number {
    return this.chunks.length;
  }

  ingest(content: string, source: string, sourceType: RetrievalChunk["sourceType"], metadata?: Record<string, unknown>): RetrievalChunk[] {
    const paragraphs = content.split(/\n{2,}/);
    const words = content.split(/\s+/);
    const chunkTexts: string[] = [];
    if (paragraphs.length > 1 && paragraphs.every(p => p.length < 2000)) {
      let current = "";
      for (const p of paragraphs) {
        if (current.length + p.length > 1500 && current.length > 0) {
          chunkTexts.push(current.trim());
          current = p;
        } else {
          current += (current ? "\n\n" : "") + p;
        }
      }
      if (current.trim()) chunkTexts.push(current.trim());
    } else {
      for (let i = 0; i < words.length; i += 300) {
        chunkTexts.push(words.slice(i, i + 350).join(" "));
      }
    }

    const newChunks: RetrievalChunk[] = chunkTexts.map((text, idx) => ({
      id: `chunk-${source}-${Date.now()}-${idx}`,
      content: text,
      source,
      sourceType,
      objectId: (metadata?.objectId as string) || null,
      timestamp: (metadata?.timestamp as string) || new Date().toISOString(),
      sensitivityClass: (metadata?.sensitivityClass as RetrievalChunk["sensitivityClass"]) || "internal",
      metadata: metadata || {},
    }));

    this.chunks.push(...newChunks);
    if (this.chunks.length > AlloyRetrievalEngine.MAX_CHUNKS) {
      this.chunks.splice(0, this.chunks.length - AlloyRetrievalEngine.MAX_CHUNKS);
    }
    return newChunks;
  }

  setEmbedding(chunkId: string, embedding: number[]): void {
    const chunk = this.chunks.find(c => c.id === chunkId);
    if (chunk) chunk.embedding = embedding;
  }

  retrieveSemantic(queryEmbedding: number[], topK: number = 12): ScoredChunk[] {
    return this.chunks
      .filter(c => c.embedding)
      .map(c => ({ ...c, score: cosineSimilarity(queryEmbedding, c.embedding!), matchType: "semantic" as const }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  retrieveKeyword(query: string, topK: number = 12): ScoredChunk[] {
    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    return this.chunks
      .map(c => {
        const lower = c.content.toLowerCase();
        const matched = terms.filter(t => lower.includes(t)).length;
        return { ...c, score: terms.length > 0 ? matched / terms.length : 0, matchType: "keyword" as const };
      })
      .filter(c => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  retrieveHybrid(query: string, queryEmbedding: number[] | null, topK: number = 12): RetrievalResult {
    const start = Date.now();
    const semanticResults = queryEmbedding ? this.retrieveSemantic(queryEmbedding, topK * 2) : [];
    const keywordResults = this.retrieveKeyword(query, topK * 2);

    const merged = new Map<string, ScoredChunk>();
    for (const chunk of semanticResults) {
      merged.set(chunk.id, { ...chunk, score: chunk.score * 0.7 });
    }
    for (const chunk of keywordResults) {
      const existing = merged.get(chunk.id);
      if (existing) {
        existing.score += chunk.score * 0.3;
      } else {
        merged.set(chunk.id, { ...chunk, score: chunk.score * 0.3 });
      }
    }

    const results = [...merged.values()].sort((a, b) => b.score - a.score).slice(0, topK);

    return {
      chunks: results,
      query,
      method: queryEmbedding ? "hybrid" : "keyword",
      totalIndexed: this.chunks.length,
      latencyMs: Date.now() - start,
    };
  }

  toEvidenceItems(chunks: ScoredChunk[]): EvidenceItem[] {
    return chunks.map(c => ({
      source: c.source,
      sourceType: c.sourceType,
      content: c.content.slice(0, 500),
      relevanceScore: c.score,
      timestamp: c.timestamp,
      objectId: c.objectId,
    }));
  }

  getStats() {
    return {
      totalChunks: this.chunks.length,
      withEmbeddings: this.chunks.filter(c => c.embedding).length,
      bySources: Object.fromEntries(
        [...new Set(this.chunks.map(c => c.sourceType))].map(st => [
          st,
          this.chunks.filter(c => c.sourceType === st).length,
        ])
      ),
    };
  }

  clear(): void {
    this.chunks = [];
  }
}

export const alloyRetrieval = new AlloyRetrievalEngine();
