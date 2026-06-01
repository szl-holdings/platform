/**
 * Core type definitions for FlexCache.
 *
 * Conceptually adapted from NVIDIA FlexTensor (Apache-2.0). FlexTensor defines
 * tier semantics for GPU vs. CPU tensors; here we generalise to arbitrary
 * keyed values across hot (RAM), warm (IndexedDB / Map), and cold (loader)
 * tiers.
 */

export type Tier = 'hot' | 'warm' | 'cold';

export type StrategyName = 'greedy' | 'adaptive' | 'knapsack';

export interface FlexCacheConfig {
  /** Master kill switch. When false, every `get` calls the loader directly. */
  enabled: boolean;
  /** Maximum entries kept in the hot (RAM) tier. */
  maxHotEntries: number;
  /** Maximum entries kept in the warm tier. */
  maxWarmEntries: number;
  /**
   * Iterations of pure observation before the manager begins tiering decisions.
   * Mirrors FlexTensor's `discovery_iters`.
   */
  discoveryIters: number;
  /**
   * Iterations during which loader latency is sampled into the per-key profile.
   * Mirrors FlexTensor's `profiling_iters`.
   */
  profilingIters: number;
  /** Glob-style include patterns (e.g. `"graph:*"`). Empty = match all. */
  includePatterns: string[];
  /** Glob-style exclude patterns. */
  excludePatterns: string[];
  /** Tier-promotion strategy. */
  strategy: StrategyName;
  /** Warm-tier backend selection. */
  warmBackend: 'auto' | 'memory' | 'indexeddb';
  /** Optional default TTL for cache entries (ms). */
  ttlMs?: number;
  /** Approximate-byte-size estimator for stored values. */
  estimateBytes?: (value: unknown) => number;
}

export interface CacheEntry<T = unknown> {
  key: string;
  value: T;
  tier: Tier;
  /** When this entry was last written. */
  storedAt: number;
  /** When this entry was last read. */
  lastAccessAt: number;
  /** Total times this key has been read. */
  accessCount: number;
  /** Approximate bytes (best-effort estimate). */
  bytes: number;
}

export interface KeyProfile {
  key: string;
  /** Total `get` calls for this key (includes hits and misses). */
  calls: number;
  /** Number of times the loader was actually invoked (cache misses). */
  loaderInvocations: number;
  /** Cumulative loader latency (ms). */
  loaderLatencyMs: number;
  /** Last observed tier the value was served from. */
  lastServedTier: Tier;
  /** Approximate bytes for the most recent value. */
  lastBytes: number;
  /** Decision score — higher means "keep in a hotter tier". */
  score: number;
  /** When the profile was first opened. */
  firstSeenAt: number;
  /** When the profile was last touched. */
  lastSeenAt: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hotHits: number;
  warmHits: number;
  coldLoads: number;
  promotions: number;
  demotions: number;
  evictions: number;
  hotSize: number;
  warmSize: number;
  totalKeysProfiled: number;
  hitRate: number;
  /** Average loader latency across cold loads (ms). */
  avgLoaderMs: number;
  /** Total bytes-equivalent stored (best-effort). */
  approxBytes: number;
}

export interface TierDecisionEvent {
  key: string;
  from: Tier;
  to: Tier;
  reason: 'promote' | 'demote' | 'evict' | 'admit';
  at: number;
}

export type Listener = (event: TierDecisionEvent) => void;
