/**
 * @szl-holdings/flexcache
 *
 * Tiered, self-profiling cache for browser & Node runtimes. The design is
 * conceptually adapted from the NVIDIA FlexTensor offloading library
 * (Apache-2.0). See NOTICE and ATTRIBUTIONS.md for details.
 */

export {
  defaultConfig,
  defaultEstimateBytes,
  isManagedKey,
  matchesAny,
  mergeConfig,
  patternToRegExp,
} from './config';
export {
  FlexCacheManager,
  memoryOnlyManager,
  type GetResult,
  type ManagerOptions,
} from './manager';
export { Profiler, computeScore } from './profiler';
export {
  adaptiveStrategy,
  getStrategy,
  greedyStrategy,
  knapsackStrategy,
  type Strategy,
  type StrategyContext,
  type TierDecision,
} from './strategy';
export {
  HotTier,
  IndexedDBWarmTier,
  MemoryWarmTier,
  createWarmTier,
  type Tier as TierStore,
} from './tiers';
export type {
  CacheEntry,
  CacheStats,
  FlexCacheConfig,
  KeyProfile,
  Listener,
  StrategyName,
  Tier,
  TierDecisionEvent,
} from './types';
