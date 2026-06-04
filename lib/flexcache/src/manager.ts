/**
 * FlexCacheManager — orchestrates tiers + profiler + strategy.
 *
 * The public surface is small on purpose: `get`, `put`, `invalidate`,
 * `clear`, `stats`, plus a few profile-persistence helpers. Most clients
 * only ever need `get(key, loader)`.
 */

import {
  defaultConfig,
  isManagedKey,
  mergeConfig,
} from './config';
import { Profiler } from './profiler';
import { getStrategy } from './strategy';
import {
  HotTier,
  MemoryWarmTier,
  type Tier as TierStore,
  createWarmTier,
} from './tiers';
import type {
  CacheEntry,
  CacheStats,
  FlexCacheConfig,
  KeyProfile,
  Listener,
  Tier,
  TierDecisionEvent,
} from './types';

export interface GetResult<T> {
  value: T;
  tier: Tier;
  /** True when the loader had to be invoked (cold load). */
  cold: boolean;
  /** Total wall-clock time for this `get`, ms. */
  latencyMs: number;
}

export interface ManagerOptions {
  /** IndexedDB database name when the warm backend is auto/idb. */
  dbName?: string;
  /** Replace the warm tier with a custom implementation. */
  warmTier?: TierStore;
}

export class FlexCacheManager {
  readonly config: FlexCacheConfig;
  private readonly hot: HotTier;
  private readonly warm: TierStore;
  private readonly profiler = new Profiler();
  private readonly strategy;
  private readonly listeners = new Set<Listener>();

  // Counters
  private hits = 0;
  private misses = 0;
  private hotHits = 0;
  private warmHits = 0;
  private coldLoads = 0;
  private promotions = 0;
  private demotions = 0;
  private evictions = 0;
  private totalLoaderMs = 0;

  /**
   * In-flight loader promises, keyed by cache key. When N concurrent callers
   * request the same cold key, only the first one fires the loader; the rest
   * `await` the same promise. Prevents the thundering-herd on cache misses
   * that otherwise defeats the whole point of having a cache.
   */
  private readonly inflight = new Map<string, Promise<unknown>>();

  constructor(
    configPatch: Partial<FlexCacheConfig> = {},
    options: ManagerOptions = {},
  ) {
    this.config = mergeConfig(defaultConfig(), configPatch);
    this.hot = new HotTier(this.config.maxHotEntries);
    this.warm =
      options.warmTier ??
      createWarmTier(
        this.config.warmBackend,
        options.dbName ?? 'szl-flexcache',
        this.config.maxWarmEntries,
      );
    this.strategy = getStrategy(this.config.strategy);
  }

  /** Subscribe to tier-decision events for live UIs. */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: TierDecisionEvent): void {
    for (const l of this.listeners) {
      try {
        l(event);
      } catch {
        // Listener exceptions must never break cache plumbing.
      }
    }
  }

  /**
   * Fetch a value. If hot or warm has it (and TTL is fresh), serve from cache.
   * Otherwise call the loader, profile the latency, and let the strategy
   * decide where to place the result.
   */
  async get<T>(key: string, loader: () => Promise<T>): Promise<GetResult<T>> {
    const start = now();

    if (!this.config.enabled || !isManaged(key, this.config)) {
      const value = await loader();
      const latencyMs = now() - start;
      this.coldLoads += 1;
      this.totalLoaderMs += latencyMs;
      return { value, tier: 'cold', cold: true, latencyMs };
    }

    // Hot lookup
    const hotHit = await this.hot.get<T>(key);
    if (hotHit) {
      if (this.isFresh(hotHit)) {
        hotHit.accessCount += 1;
        hotHit.lastAccessAt = Date.now();
        this.hits += 1;
        this.hotHits += 1;
        const latencyMs = now() - start;
        this.profiler.observe(key, {
          servedTier: 'hot',
          bytes: hotHit.bytes,
        });
        return { value: hotHit.value, tier: 'hot', cold: false, latencyMs };
      }
      // Stale — actively purge so we don't keep paying memory for it.
      await this.hot.delete(key);
    }

    // Warm lookup
    const warmHit = await this.warm.get<T>(key);
    if (warmHit && !this.isFresh(warmHit)) {
      // Stale — purge before falling through to cold.
      await this.warm.delete(key);
    } else if (warmHit) {
      warmHit.accessCount += 1;
      warmHit.lastAccessAt = Date.now();
      await this.warm.put(warmHit); // re-write to bump LRU
      this.hits += 1;
      this.warmHits += 1;
      this.profiler.observe(key, {
        servedTier: 'warm',
        bytes: warmHit.bytes,
      });
      this.maybePromote(key, warmHit);
      const latencyMs = now() - start;
      return { value: warmHit.value, tier: 'warm', cold: false, latencyMs };
    }

    // Cold path — invoke loader (or await an in-flight loader for this key).
    this.misses += 1;

    const existing = this.inflight.get(key) as Promise<T> | undefined;
    let loaderMs: number;
    let value: T;
    if (existing) {
      // Single-flight: piggy-back on the in-flight loader. We don't sample
      // latency here because the original caller already does.
      value = await existing;
      loaderMs = 0;
    } else {
      this.coldLoads += 1;
      const loaderStart = now();
      const loaderPromise = loader();
      this.inflight.set(key, loaderPromise as Promise<unknown>);
      try {
        value = await loaderPromise;
      } finally {
        this.inflight.delete(key);
      }
      loaderMs = now() - loaderStart;
      this.totalLoaderMs += loaderMs;
    }

    const bytes = (this.config.estimateBytes ?? (() => 0))(value);
    // Honour `profilingIters`: only contribute latency to the profile while
    // we're still inside the profiling window. This mirrors FlexTensor's
    // discovery_iters / profiling_iters split — once profiling closes we
    // still count calls, but we stop biasing the score with new latency
    // samples (the average has stabilised).
    const inProfilingWindow =
      this.profiler.globalIterations() <
      this.config.discoveryIters + this.config.profilingIters;
    const profile = this.profiler.observe(key, {
      loaderLatencyMs: inProfilingWindow ? loaderMs : undefined,
      servedTier: 'cold',
      bytes,
    });

    const entry: CacheEntry<T> = {
      key,
      value,
      tier: 'cold',
      storedAt: Date.now(),
      lastAccessAt: Date.now(),
      accessCount: 1,
      bytes,
    };
    await this.placeByStrategy(entry, profile);
    const latencyMs = now() - start;
    return { value, tier: entry.tier, cold: true, latencyMs };
  }

  /** Forcibly insert/refresh a value. Strategy picks the tier. */
  async put<T>(key: string, value: T): Promise<void> {
    if (!this.config.enabled || !isManaged(key, this.config)) return;
    const bytes = (this.config.estimateBytes ?? (() => 0))(value);
    const profile = this.profiler.observe(key, {
      servedTier: 'cold',
      bytes,
    });
    const entry: CacheEntry<T> = {
      key,
      value,
      tier: 'cold',
      storedAt: Date.now(),
      lastAccessAt: Date.now(),
      accessCount: 1,
      bytes,
    };
    await this.placeByStrategy(entry, profile);
  }

  async invalidate(key: string): Promise<void> {
    await this.hot.delete(key);
    await this.warm.delete(key);
    this.profiler.forget(key);
  }

  async clear(): Promise<void> {
    await this.hot.clear();
    await this.warm.clear();
    this.profiler.resetProfiles();
    this.hits = 0;
    this.misses = 0;
    this.hotHits = 0;
    this.warmHits = 0;
    this.coldLoads = 0;
    this.promotions = 0;
    this.demotions = 0;
    this.evictions = 0;
    this.totalLoaderMs = 0;
  }

  async stats(): Promise<CacheStats> {
    const hotKeys = await this.hot.keys();
    const warmKeys = await this.warm.keys();
    const totalRequests = this.hits + this.misses;
    const approxBytes = (await this.collectEntries()).reduce(
      (sum, e) => sum + e.bytes,
      0,
    );
    return {
      hits: this.hits,
      misses: this.misses,
      hotHits: this.hotHits,
      warmHits: this.warmHits,
      coldLoads: this.coldLoads,
      promotions: this.promotions,
      demotions: this.demotions,
      evictions: this.evictions,
      hotSize: hotKeys.length,
      warmSize: warmKeys.length,
      totalKeysProfiled: this.profiler.size(),
      hitRate: totalRequests > 0 ? this.hits / totalRequests : 0,
      avgLoaderMs:
        this.coldLoads > 0 ? this.totalLoaderMs / this.coldLoads : 0,
      approxBytes,
    };
  }

  /** All currently-tracked profiles, sorted by score descending. */
  profiles(): KeyProfile[] {
    return this.profiler.all().sort((a, b) => b.score - a.score);
  }

  exportProfile(): KeyProfile[] {
    return this.profiler.exportProfile();
  }

  importProfile(profiles: KeyProfile[]): void {
    this.profiler.importProfile(profiles);
  }

  /** Internal: collect every entry across both tiers (for stats). */
  private async collectEntries(): Promise<CacheEntry<unknown>[]> {
    const out: CacheEntry<unknown>[] = [];
    for (const k of await this.hot.keys()) {
      const e = await this.hot.get(k);
      if (e) out.push(e);
    }
    for (const k of await this.warm.keys()) {
      const e = await this.warm.get(k);
      if (e) out.push(e);
    }
    return out;
  }

  private isFresh(entry: CacheEntry<unknown>): boolean {
    if (this.config.ttlMs == null) return true;
    return Date.now() - entry.storedAt < this.config.ttlMs;
  }

  /**
   * Apply the configured strategy to decide where the (possibly newly
   * loaded) entry lives. Handles demotions and emits decision events.
   */
  private async placeByStrategy<T>(
    entry: CacheEntry<T>,
    profile: KeyProfile,
  ): Promise<void> {
    const hotKeys = await this.hot.keys();
    const warmKeys = await this.warm.keys();
    const decision = this.strategy({
      hotCapacity: this.config.maxHotEntries,
      hotKeys,
      warmKeys,
      profile,
      allProfiles: this.profiler.all(),
      inDiscoveryWindow:
        this.profiler.globalIterations() <= this.config.discoveryIters,
    });

    // Process demotions first (so we have room before admitting).
    for (const k of decision.demoteFromHot) {
      const demoted = await this.hot.get(k);
      if (demoted) {
        demoted.tier = 'warm';
        await this.warm.put(demoted);
        await this.hot.delete(k);
        this.demotions += 1;
        this.emit({ key: k, from: 'hot', to: 'warm', reason: 'demote', at: Date.now() });
      }
    }

    if (decision.targetTier === 'hot') {
      entry.tier = 'hot';
      await this.hot.put(entry);
      const evicted = this.hot.evictIfNeeded();
      for (const k of evicted) {
        this.evictions += 1;
        this.emit({ key: k, from: 'hot', to: 'cold', reason: 'evict', at: Date.now() });
      }
      this.emit({
        key: entry.key,
        from: 'cold',
        to: 'hot',
        reason: 'admit',
        at: Date.now(),
      });
    } else if (decision.targetTier === 'warm') {
      entry.tier = 'warm';
      await this.warm.put(entry);
      this.emit({
        key: entry.key,
        from: 'cold',
        to: 'warm',
        reason: 'admit',
        at: Date.now(),
      });
    }
    // targetTier === 'cold' → don't store at all (let it stay loaderable).
  }

  /** Try to promote a warm hit to hot if the strategy now wants it there. */
  private async maybePromote(
    key: string,
    entry: CacheEntry<unknown>,
  ): Promise<void> {
    const profile = this.profiler.get(key);
    if (!profile) return;
    const hotKeys = await this.hot.keys();
    const warmKeys = await this.warm.keys();
    const decision = this.strategy({
      hotCapacity: this.config.maxHotEntries,
      hotKeys,
      warmKeys,
      profile,
      allProfiles: this.profiler.all(),
      inDiscoveryWindow:
        this.profiler.globalIterations() <= this.config.discoveryIters,
    });
    if (decision.targetTier !== 'hot') return;

    for (const k of decision.demoteFromHot) {
      const demoted = await this.hot.get(k);
      if (demoted) {
        demoted.tier = 'warm';
        await this.warm.put(demoted);
        await this.hot.delete(k);
        this.demotions += 1;
        this.emit({ key: k, from: 'hot', to: 'warm', reason: 'demote', at: Date.now() });
      }
    }

    entry.tier = 'hot';
    await this.hot.put(entry);
    await this.warm.delete(key);
    this.promotions += 1;
    const evicted = this.hot.evictIfNeeded();
    for (const k of evicted) {
      this.evictions += 1;
      this.emit({ key: k, from: 'hot', to: 'cold', reason: 'evict', at: Date.now() });
    }
    this.emit({
      key,
      from: 'warm',
      to: 'hot',
      reason: 'promote',
      at: Date.now(),
    });
  }
}

function isManaged(key: string, cfg: FlexCacheConfig): boolean {
  return isManagedKey(key, cfg.includePatterns, cfg.excludePatterns);
}

function now(): number {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}

/** Convenience: a manager with no warm tier (Node tests, ephemeral usage). */
export function memoryOnlyManager(
  configPatch: Partial<FlexCacheConfig> = {},
): FlexCacheManager {
  return new FlexCacheManager(
    { ...configPatch, warmBackend: 'memory' },
    { warmTier: new MemoryWarmTier(configPatch.maxWarmEntries ?? 256) },
  );
}
