import type { RAGChunk } from "./types.js";

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    dot += a[i]! * b[i]!;
    magA += a[i]! * a[i]!;
    magB += b[i]! * b[i]!;
  }
  return magA > 0 && magB > 0 ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
}

export function chunkText(text: string, chunkSize = 400): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(" "));
  }
  return chunks.length ? chunks : [text];
}

export class RAGPipeline {
  private chunks: RAGChunk[] = [];

  ingest(content: string, metadata?: Record<string, unknown>, chunkSize = 400): RAGChunk[] {
    const textChunks = chunkText(content, chunkSize);
    const newChunks: RAGChunk[] = textChunks.map((c, i) => ({
      id: `chunk-${Date.now()}-${i}`,
      content: c,
      metadata,
    }));
    this.chunks.push(...newChunks);
    return newChunks;
  }

  setEmbedding(chunkId: string, embedding: number[]): void {
    const chunk = this.chunks.find(c => c.id === chunkId);
    if (chunk) chunk.embedding = embedding;
  }

  retrieve(queryEmbedding: number[], topK = 5): RAGChunk[] {
    const scored = this.chunks
      .filter(c => c.embedding)
      .map(c => ({ chunk: c, score: cosineSimilarity(queryEmbedding, c.embedding!) }))
      .sort((a, b) => b.score - a.score);
    return scored.slice(0, topK).map(s => s.chunk);
  }

  retrieveByKeyword(query: string, topK = 5): RAGChunk[] {
    const lower = query.toLowerCase();
    const scored = this.chunks
      .map(c => {
        const words = lower.split(/\s+/);
        const matches = words.filter(w => c.content.toLowerCase().includes(w)).length;
        return { chunk: c, score: matches };
      })
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score);
    return scored.slice(0, topK).map(s => s.chunk);
  }

  clear(): void {
    this.chunks = [];
  }

  getStats() {
    return {
      totalChunks: this.chunks.length,
      withEmbeddings: this.chunks.filter(c => c.embedding).length,
    };
  }
}
