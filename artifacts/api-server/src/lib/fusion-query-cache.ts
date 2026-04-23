interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class FusionQueryCache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private readonly ttlMs: number;
  private readonly maxSize: number;
  private pruneTimer: ReturnType<typeof setInterval> | null = null;

  constructor(opts: { ttlSeconds: number; maxSize?: number }) {
    this.ttlMs = opts.ttlSeconds * 1000;
    this.maxSize = opts.maxSize ?? 500;
    this.pruneTimer = setInterval(() => this.prune(), 30_000);
    if (this.pruneTimer.unref) this.pruneTimer.unref();
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T): void {
    if (this.store.size >= this.maxSize) {
      this.evictOldest();
    }
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  get size(): number {
    return this.store.size;
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestExp = Infinity;
    for (const [key, entry] of this.store) {
      if (entry.expiresAt < oldestExp) {
        oldestExp = entry.expiresAt;
        oldestKey = key;
      }
    }
    if (oldestKey) this.store.delete(oldestKey);
  }

  private prune(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) this.store.delete(key);
    }
  }

  destroy(): void {
    if (this.pruneTimer) clearInterval(this.pruneTimer);
    this.store.clear();
  }
}

export function normalizeQuery(raw: string): string {
  return raw.toLowerCase().trim().replace(/\s+/g, ' ');
}

export function buildSignalFingerprint(live: {
  aegis: { criticalIncidents: number; openIncidents: number; criticalAlerts: number };
  vessels: { activeAlerts: number; delayEvents: number; highAlerts: number };
  terra: { distressCount: number };
  market: {
    activeVentures: number;
    totalVentures: number;
    sunsetVentures: number;
    latestNavCents: number | null;
  };
  prism: { openMatters: number; totalActive: number; trialReady: number; lowHealthMatters: number };
}): string {
  return [
    live.aegis.criticalIncidents,
    live.aegis.openIncidents,
    live.aegis.criticalAlerts,
    live.vessels.activeAlerts,
    live.vessels.delayEvents,
    live.vessels.highAlerts,
    live.terra.distressCount,
    live.market.activeVentures,
    live.market.totalVentures,
    live.market.sunsetVentures,
    live.market.latestNavCents ?? 0,
    live.prism.openMatters,
    live.prism.totalActive,
    live.prism.trialReady,
    live.prism.lowHealthMatters,
  ].join(':');
}

export function buildCacheKey(userId: string, normalizedQuery: string, fingerprint: string): string {
  return `${userId}|${normalizedQuery}|${fingerprint}`;
}
