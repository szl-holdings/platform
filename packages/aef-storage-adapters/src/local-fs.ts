import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import type {
  ChunkRecord,
  ChunkStore,
  EvalFixtureRecord,
  EvalFixtureStore,
  MetadataIndexRecord,
  MetadataIndexStore,
  RawDocRecord,
  RawDocStore,
  StorageBundle,
  VectorRecord,
  VectorStore,
} from './interfaces.js';

function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function readJson<T>(filePath: string): T | undefined {
  if (!existsSync(filePath)) return undefined;
  try {
    return JSON.parse(readFileSync(filePath, 'utf8')) as T;
  } catch {
    return undefined;
  }
}

function writeJson(filePath: string, data: unknown): void {
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += (a[i] ?? 0) * (b[i] ?? 0);
    normA += (a[i] ?? 0) ** 2;
    normB += (b[i] ?? 0) ** 2;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function keywordScore(text: string, terms: string): number {
  const words = terms.toLowerCase().split(/\s+/);
  const lowerText = text.toLowerCase();
  let matches = 0;
  for (const word of words) {
    if (word.length > 0 && lowerText.includes(word)) matches++;
  }
  return words.length > 0 ? matches / words.length : 0;
}

export class LocalFsRawDocStore implements RawDocStore {
  private readonly baseDir: string;

  constructor(baseDir: string) {
    this.baseDir = join(baseDir, 'raw-docs');
    ensureDir(this.baseDir);
  }

  private filePath(sourceId: string, tenantId: string): string {
    return join(this.baseDir, `${tenantId}__${encodeURIComponent(sourceId)}.json`);
  }

  async upsert(doc: RawDocRecord): Promise<void> {
    writeJson(this.filePath(doc.sourceId, doc.tenantId), doc);
  }

  async get(sourceId: string, tenantId: string): Promise<RawDocRecord | undefined> {
    return readJson<RawDocRecord>(this.filePath(sourceId, tenantId));
  }

  async list(tenantId: string, profileId?: string): Promise<RawDocRecord[]> {
    const prefix = `${tenantId}__`;
    const files = readdirSync(this.baseDir).filter((f) => f.startsWith(prefix));
    const results: RawDocRecord[] = [];
    for (const file of files) {
      const rec = readJson<RawDocRecord>(join(this.baseDir, file));
      if (rec && (!profileId || rec.profileId === profileId)) {
        results.push(rec);
      }
    }
    return results;
  }

  async delete(sourceId: string, tenantId: string): Promise<boolean> {
    const path = this.filePath(sourceId, tenantId);
    if (!existsSync(path)) return false;
    unlinkSync(path);
    return true;
  }

  async count(tenantId: string): Promise<number> {
    const prefix = `${tenantId}__`;
    return readdirSync(this.baseDir).filter((f) => f.startsWith(prefix)).length;
  }
}

export class LocalFsChunkStore implements ChunkStore {
  private readonly baseDir: string;

  constructor(baseDir: string) {
    this.baseDir = join(baseDir, 'chunks');
    ensureDir(this.baseDir);
  }

  private filePath(chunkId: string): string {
    return join(this.baseDir, `${encodeURIComponent(chunkId)}.json`);
  }

  async upsert(chunk: ChunkRecord): Promise<void> {
    writeJson(this.filePath(chunk.chunkId), chunk);
  }

  async get(chunkId: string): Promise<ChunkRecord | undefined> {
    return readJson<ChunkRecord>(this.filePath(chunkId));
  }

  async listBySource(sourceId: string, tenantId: string): Promise<ChunkRecord[]> {
    const files = readdirSync(this.baseDir);
    const results: ChunkRecord[] = [];
    for (const file of files) {
      const rec = readJson<ChunkRecord>(join(this.baseDir, file));
      if (rec && rec.sourceId === sourceId && rec.tenantId === tenantId) {
        results.push(rec);
      }
    }
    return results.sort((a, b) => a.chunkIndex - b.chunkIndex);
  }

  async listByTenant(tenantId: string, limit = 100): Promise<ChunkRecord[]> {
    const files = readdirSync(this.baseDir);
    const results: ChunkRecord[] = [];
    for (const file of files) {
      if (results.length >= limit) break;
      const rec = readJson<ChunkRecord>(join(this.baseDir, file));
      if (rec && rec.tenantId === tenantId) {
        results.push(rec);
      }
    }
    return results;
  }

  async delete(chunkId: string): Promise<boolean> {
    const path = this.filePath(chunkId);
    if (!existsSync(path)) return false;
    unlinkSync(path);
    return true;
  }

  async deleteBySource(sourceId: string, tenantId: string): Promise<number> {
    const files = readdirSync(this.baseDir);
    let count = 0;
    for (const file of files) {
      const path = join(this.baseDir, file);
      const rec = readJson<ChunkRecord>(path);
      if (rec && rec.sourceId === sourceId && rec.tenantId === tenantId) {
        unlinkSync(path);
        count++;
      }
    }
    return count;
  }

  async count(tenantId: string): Promise<number> {
    const files = readdirSync(this.baseDir);
    let count = 0;
    for (const file of files) {
      const rec = readJson<ChunkRecord>(join(this.baseDir, file));
      if (rec && rec.tenantId === tenantId) count++;
    }
    return count;
  }
}

export class LocalFsVectorStore implements VectorStore {
  private readonly baseDir: string;

  constructor(baseDir: string) {
    this.baseDir = join(baseDir, 'vectors');
    ensureDir(this.baseDir);
  }

  private filePath(chunkId: string): string {
    return join(this.baseDir, `${encodeURIComponent(chunkId)}.json`);
  }

  async upsert(record: VectorRecord): Promise<void> {
    writeJson(this.filePath(record.chunkId), record);
  }

  async get(chunkId: string): Promise<VectorRecord | undefined> {
    return readJson<VectorRecord>(this.filePath(chunkId));
  }

  async similaritySearch(opts: {
    vector: number[];
    topK: number;
    tenantId: string;
    profileId?: string;
    metadataFilter?: Record<string, unknown>;
  }): Promise<
    Array<{ chunkId: string; sourceId: string; score: number; metadata: Record<string, unknown> }>
  > {
    const files = readdirSync(this.baseDir);
    const candidates: Array<{
      chunkId: string;
      sourceId: string;
      score: number;
      metadata: Record<string, unknown>;
    }> = [];

    for (const file of files) {
      const rec = readJson<VectorRecord>(join(this.baseDir, file));
      if (!rec) continue;
      if (rec.tenantId !== opts.tenantId) continue;
      if (opts.profileId && rec.profileId !== opts.profileId) continue;

      if (opts.metadataFilter) {
        let match = true;
        for (const [k, v] of Object.entries(opts.metadataFilter)) {
          if (rec.metadata[k] !== v) {
            match = false;
            break;
          }
        }
        if (!match) continue;
      }

      const score = cosineSimilarity(opts.vector, rec.vector);
      candidates.push({
        chunkId: rec.chunkId,
        sourceId: rec.sourceId,
        score,
        metadata: rec.metadata,
      });
    }

    candidates.sort((a, b) => b.score - a.score);
    return candidates.slice(0, opts.topK);
  }

  async delete(chunkId: string): Promise<boolean> {
    const path = this.filePath(chunkId);
    if (!existsSync(path)) return false;
    unlinkSync(path);
    return true;
  }

  async deleteBySource(sourceId: string, tenantId: string): Promise<number> {
    const files = readdirSync(this.baseDir);
    let count = 0;
    for (const file of files) {
      const path = join(this.baseDir, file);
      const rec = readJson<VectorRecord>(path);
      if (rec && rec.sourceId === sourceId && rec.tenantId === tenantId) {
        unlinkSync(path);
        count++;
      }
    }
    return count;
  }

  async count(tenantId: string): Promise<number> {
    const files = readdirSync(this.baseDir);
    let count = 0;
    for (const file of files) {
      const rec = readJson<VectorRecord>(join(this.baseDir, file));
      if (rec && rec.tenantId === tenantId) count++;
    }
    return count;
  }
}

export class LocalFsMetadataIndexStore implements MetadataIndexStore {
  private readonly baseDir: string;

  constructor(baseDir: string) {
    this.baseDir = join(baseDir, 'metadata-index');
    ensureDir(this.baseDir);
  }

  private filePath(chunkId: string): string {
    return join(this.baseDir, `${encodeURIComponent(chunkId)}.json`);
  }

  async upsert(record: MetadataIndexRecord): Promise<void> {
    writeJson(this.filePath(record.chunkId), record);
  }

  async get(chunkId: string): Promise<MetadataIndexRecord | undefined> {
    return readJson<MetadataIndexRecord>(this.filePath(chunkId));
  }

  async keywordSearch(opts: {
    terms: string;
    topK: number;
    tenantId: string;
    metadataFilter?: Record<string, unknown>;
  }): Promise<
    Array<{
      chunkId: string;
      sourceId: string;
      score: number;
      highlights: string[];
      metadata: Record<string, unknown>;
    }>
  > {
    const files = readdirSync(this.baseDir);
    const candidates: Array<{
      chunkId: string;
      sourceId: string;
      score: number;
      highlights: string[];
      metadata: Record<string, unknown>;
    }> = [];

    for (const file of files) {
      const rec = readJson<MetadataIndexRecord>(join(this.baseDir, file));
      if (!rec) continue;
      if (rec.tenantId !== opts.tenantId) continue;

      if (opts.metadataFilter) {
        let match = true;
        for (const [k, v] of Object.entries(opts.metadataFilter)) {
          if (rec.metadata[k] !== v) {
            match = false;
            break;
          }
        }
        if (!match) continue;
      }

      const textContent = [
        rec.title,
        rec.section,
        ...Object.values(rec.metadata).map((v) => String(v)),
      ]
        .filter(Boolean)
        .join(' ');

      const score = keywordScore(textContent, opts.terms);
      if (score > 0) {
        const words = opts.terms.toLowerCase().split(/\s+/).filter(Boolean);
        const highlights = words.filter((w) => textContent.toLowerCase().includes(w));
        candidates.push({
          chunkId: rec.chunkId,
          sourceId: rec.sourceId,
          score,
          highlights,
          metadata: rec.metadata,
        });
      }
    }

    candidates.sort((a, b) => b.score - a.score);
    return candidates.slice(0, opts.topK);
  }

  async delete(chunkId: string): Promise<boolean> {
    const path = this.filePath(chunkId);
    if (!existsSync(path)) return false;
    unlinkSync(path);
    return true;
  }

  async deleteBySource(sourceId: string, tenantId: string): Promise<number> {
    const files = readdirSync(this.baseDir);
    let count = 0;
    for (const file of files) {
      const path = join(this.baseDir, file);
      const rec = readJson<MetadataIndexRecord>(path);
      if (rec && rec.sourceId === sourceId && rec.tenantId === tenantId) {
        unlinkSync(path);
        count++;
      }
    }
    return count;
  }

  async count(tenantId: string): Promise<number> {
    const files = readdirSync(this.baseDir);
    let count = 0;
    for (const file of files) {
      const rec = readJson<MetadataIndexRecord>(join(this.baseDir, file));
      if (rec && rec.tenantId === tenantId) count++;
    }
    return count;
  }
}

export class LocalFsEvalFixtureStore implements EvalFixtureStore {
  private readonly baseDir: string;

  constructor(baseDir: string) {
    this.baseDir = join(baseDir, 'eval-fixtures');
    ensureDir(this.baseDir);
  }

  private filePath(fixtureId: string): string {
    return join(this.baseDir, `${encodeURIComponent(fixtureId)}.json`);
  }

  async upsert(fixture: EvalFixtureRecord): Promise<void> {
    writeJson(this.filePath(fixture.fixtureId), fixture);
  }

  async get(fixtureId: string): Promise<EvalFixtureRecord | undefined> {
    return readJson<EvalFixtureRecord>(this.filePath(fixtureId));
  }

  async listByProfile(profileId: string): Promise<EvalFixtureRecord[]> {
    const files = readdirSync(this.baseDir);
    const results: EvalFixtureRecord[] = [];
    for (const file of files) {
      const rec = readJson<EvalFixtureRecord>(join(this.baseDir, file));
      if (rec && rec.profileId === profileId) {
        results.push(rec);
      }
    }
    return results;
  }

  async delete(fixtureId: string): Promise<boolean> {
    const path = this.filePath(fixtureId);
    if (!existsSync(path)) return false;
    unlinkSync(path);
    return true;
  }

  async count(profileId: string): Promise<number> {
    const files = readdirSync(this.baseDir);
    let count = 0;
    for (const file of files) {
      const rec = readJson<EvalFixtureRecord>(join(this.baseDir, file));
      if (rec && rec.profileId === profileId) count++;
    }
    return count;
  }
}

export function createLocalFsStorageBundle(
  baseDir: string,
): import('./interfaces.js').StorageBundle {
  return {
    rawDocs: new LocalFsRawDocStore(baseDir),
    chunks: new LocalFsChunkStore(baseDir),
    vectors: new LocalFsVectorStore(baseDir),
    metadataIndex: new LocalFsMetadataIndexStore(baseDir),
    evalFixtures: new LocalFsEvalFixtureStore(baseDir),
  };
}
