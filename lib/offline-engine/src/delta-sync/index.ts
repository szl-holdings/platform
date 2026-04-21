import type { StorageAdapter } from "../storage/interface";

export interface DeltaSyncWatermark {
  domain: string;
  lastSyncedAt: number;
  cursor?: string | undefined;
}

export interface DeltaChange<T = unknown> {
  id: string | number;
  updatedAt: string;
  data: T;
  deleted?: boolean | undefined;
}

export interface DeltaSyncResponse<T = unknown> {
  domain: string;
  since: number;
  changes: DeltaChange<T>[];
  nextCursor?: string;
  hasMore: boolean;
  serverTime: number;
}

export interface DeltaSyncOptions {
  storage: StorageAdapter;
  baseUrl: string;
  getHeaders: () => Promise<Record<string, string>>;
  pageSize?: number;
  watermarkStore?: string;
}

const WATERMARK_STORE = "sync-watermarks";

export class DeltaSyncClient {
  private storage: StorageAdapter;
  private baseUrl: string;
  private getHeaders: () => Promise<Record<string, string>>;
  private pageSize: number;
  private watermarkStore: string;

  constructor(options: DeltaSyncOptions) {
    this.storage = options.storage;
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.getHeaders = options.getHeaders;
    this.pageSize = options.pageSize ?? 100;
    this.watermarkStore = options.watermarkStore ?? WATERMARK_STORE;
  }

  async getWatermark(domain: string): Promise<DeltaSyncWatermark> {
    const stored = await this.storage.get<DeltaSyncWatermark>(this.watermarkStore, domain);
    return stored ?? { domain, lastSyncedAt: 0 };
  }

  async setWatermark(domain: string, timestamp: number, cursor?: string): Promise<void> {
    const watermark: DeltaSyncWatermark = { domain, lastSyncedAt: timestamp, cursor };
    await this.storage.put(this.watermarkStore, domain, watermark);
  }

  async fetchDeltas<T = unknown>(
    domain: string,
    since?: number,
    cursor?: string
  ): Promise<DeltaSyncResponse<T>> {
    const watermark: { lastSyncedAt: number; cursor?: string | undefined } = since !== undefined ? { lastSyncedAt: since } : await this.getWatermark(domain);
    const headers = await this.getHeaders();

    const params = new URLSearchParams({
      since: String(watermark.lastSyncedAt),
      limit: String(this.pageSize),
    });
    if (cursor ?? watermark.cursor) {
      params.set("cursor", (cursor ?? watermark.cursor)!);
    }

    const url = `${this.baseUrl}/api/${domain}/sync?${params.toString()}`;
    const res = await fetch(url, { headers });

    if (!res.ok) {
      throw new Error(`Delta sync failed for domain '${domain}': HTTP ${res.status}`);
    }

    return res.json() as Promise<DeltaSyncResponse<T>>;
  }

  async syncDomain<T = unknown>(
    domain: string,
    onChanges: (changes: DeltaChange<T>[], domain: string) => Promise<void>
  ): Promise<{ synced: number; hasMore: boolean }> {
    const watermark = await this.getWatermark(domain);
    let cursor = watermark.cursor;
    let totalSynced = 0;
    let hasMore = false;

    do {
      const response = await this.fetchDeltas<T>(domain, watermark.lastSyncedAt, cursor);
      if (response.changes.length > 0) {
        await onChanges(response.changes, domain);
        totalSynced += response.changes.length;
      }

      hasMore = response.hasMore;
      cursor = response.nextCursor;

      if (!response.hasMore) {
        await this.setWatermark(domain, response.serverTime);
      } else if (response.nextCursor) {
        await this.setWatermark(domain, watermark.lastSyncedAt, response.nextCursor);
      }
    } while (hasMore && cursor);

    return { synced: totalSynced, hasMore };
  }
}
