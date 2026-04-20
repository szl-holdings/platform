/**
 * AEF Ingestion Orchestrator — Dev Storage Implementations
 *
 * Filesystem / in-memory implementations for local development and testing.
 * These satisfy the storage interfaces without requiring external services.
 */

import { randomUUID } from 'crypto';
import type {
  Chunk,
  ChunkStore,
  IndexPointer,
  IndexStore,
  RawDocument,
  RawDocumentStore,
} from './interfaces.js';

// ─── In-Memory Raw Document Store ────────────────────────────────────────────

export class InMemoryRawDocumentStore implements RawDocumentStore {
  private readonly store = new Map<string, RawDocument>();

  private key(sourceId: string, tenantId: string): string {
    return `${tenantId}::${sourceId}`;
  }

  async put(doc: RawDocument): Promise<void> {
    this.store.set(this.key(doc.sourceId, doc.tenantId), { ...doc });
  }

  async get(sourceId: string, tenantId: string): Promise<RawDocument | undefined> {
    return this.store.get(this.key(sourceId, tenantId));
  }

  async list(tenantId: string, profileId?: string): Promise<RawDocument[]> {
    const results: RawDocument[] = [];
    for (const doc of this.store.values()) {
      if (doc.tenantId !== tenantId) continue;
      if (profileId !== undefined && doc.profileId !== profileId) continue;
      results.push(doc);
    }
    return results;
  }

  async delete(sourceId: string, tenantId: string): Promise<boolean> {
    return this.store.delete(this.key(sourceId, tenantId));
  }

  clear(): void {
    this.store.clear();
  }
}

// ─── In-Memory Chunk Store ────────────────────────────────────────────────────

export class InMemoryChunkStore implements ChunkStore {
  private readonly store = new Map<string, Chunk>();

  async put(chunk: Chunk): Promise<void> {
    this.store.set(chunk.chunkId, { ...chunk });
  }

  async get(chunkId: string): Promise<Chunk | undefined> {
    return this.store.get(chunkId);
  }

  async listBySource(sourceId: string, tenantId: string): Promise<Chunk[]> {
    const results: Chunk[] = [];
    for (const chunk of this.store.values()) {
      if (chunk.sourceId === sourceId && chunk.tenantId === tenantId) {
        results.push(chunk);
      }
    }
    return results.sort((a, b) => a.chunkIndex - b.chunkIndex);
  }

  async listByTenant(tenantId: string, profileId?: string): Promise<Chunk[]> {
    const results: Chunk[] = [];
    for (const chunk of this.store.values()) {
      if (chunk.tenantId !== tenantId) continue;
      if (profileId !== undefined && chunk.profileId !== profileId) continue;
      results.push(chunk);
    }
    return results;
  }

  async delete(chunkId: string): Promise<boolean> {
    return this.store.delete(chunkId);
  }

  async deleteBySource(sourceId: string, tenantId: string): Promise<number> {
    let count = 0;
    for (const [id, chunk] of this.store.entries()) {
      if (chunk.sourceId === sourceId && chunk.tenantId === tenantId) {
        this.store.delete(id);
        count++;
      }
    }
    return count;
  }

  async count(tenantId: string, profileId?: string): Promise<number> {
    let n = 0;
    for (const chunk of this.store.values()) {
      if (chunk.tenantId !== tenantId) continue;
      if (profileId !== undefined && chunk.profileId !== profileId) continue;
      n++;
    }
    return n;
  }

  clear(): void {
    this.store.clear();
  }
}

// ─── In-Memory Index Store ────────────────────────────────────────────────────

export class InMemoryIndexStore implements IndexStore {
  private readonly store = new Map<string, IndexPointer>();

  private key(tenantId: string, profileId: string): string {
    return `${tenantId}::${profileId}`;
  }

  async getPointer(tenantId: string, profileId: string): Promise<IndexPointer | undefined> {
    return this.store.get(this.key(tenantId, profileId));
  }

  async upsertPointer(pointer: IndexPointer): Promise<void> {
    this.store.set(this.key(pointer.tenantId, pointer.profileId), { ...pointer });
  }

  async swapPointer(
    tenantId: string,
    profileId: string,
    newVersion: string,
  ): Promise<IndexPointer> {
    const existing = await this.getPointer(tenantId, profileId);
    const updated: IndexPointer = {
      pointerId: existing?.pointerId ?? randomUUID(),
      tenantId,
      profileId,
      activeVersion: newVersion,
      lastRebuiltAt: new Date().toISOString(),
      chunkCount: existing?.chunkCount ?? 0,
      metadata: existing?.metadata ?? {},
    };
    await this.upsertPointer(updated);
    return updated;
  }

  async snapshot(tenantId: string, profileId: string): Promise<string> {
    const existing = await this.getPointer(tenantId, profileId);
    const snapshotVersion = `snapshot-${Date.now()}-${randomUUID().slice(0, 8)}`;
    const pointer: IndexPointer = {
      pointerId: existing?.pointerId ?? randomUUID(),
      tenantId,
      profileId,
      activeVersion: existing?.activeVersion ?? 'initial',
      pendingVersion: snapshotVersion,
      chunkCount: existing?.chunkCount ?? 0,
      metadata: existing?.metadata ?? {},
    };
    await this.upsertPointer(pointer);
    return snapshotVersion;
  }

  clear(): void {
    this.store.clear();
  }
}

// ─── Default Dev Storage ──────────────────────────────────────────────────────

export const devRawDocumentStore = new InMemoryRawDocumentStore();
export const devChunkStore = new InMemoryChunkStore();
export const devIndexStore = new InMemoryIndexStore();
