import type { Reflection } from "./types.js";

export interface ReflectionStoreQuery {
  traceId?: string;
  failureMode?: string;
  limit?: number;
  offset?: number;
}

export interface ReflectionStore {
  put(reflection: Reflection): void;
  get(reflectionId: string): Reflection | undefined;
  getByTrace(traceId: string): Reflection | undefined;
  list(query?: ReflectionStoreQuery): Reflection[];
  count(query?: Omit<ReflectionStoreQuery, "limit" | "offset">): number;
}

export class InMemoryReflectionStore implements ReflectionStore {
  private readonly entries = new Map<string, Reflection>();

  put(reflection: Reflection): void {
    this.entries.set(reflection.reflectionId, reflection);
  }

  get(reflectionId: string): Reflection | undefined {
    return this.entries.get(reflectionId);
  }

  getByTrace(traceId: string): Reflection | undefined {
    for (const r of this.entries.values()) {
      if (r.traceId === traceId) return r;
    }
    return undefined;
  }

  list(query?: ReflectionStoreQuery): Reflection[] {
    let results = Array.from(this.entries.values());

    if (query?.traceId) {
      results = results.filter((r) => r.traceId === query.traceId);
    }
    if (query?.failureMode) {
      results = results.filter((r) => r.failureMode === query.failureMode);
    }

    results.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const offset = query?.offset ?? 0;
    const limit = query?.limit ?? 50;
    return results.slice(offset, offset + limit);
  }

  count(query?: Omit<ReflectionStoreQuery, "limit" | "offset">): number {
    if (!query?.traceId && !query?.failureMode) return this.entries.size;
    let results = Array.from(this.entries.values());
    if (query.traceId) results = results.filter((r) => r.traceId === query.traceId);
    if (query.failureMode) results = results.filter((r) => r.failureMode === query.failureMode);
    return results.length;
  }
}

export const defaultReflectionStore = new InMemoryReflectionStore();
