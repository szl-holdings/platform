/**
 * Tier-promotion strategies. Adapted from FlexTensor's strategy registry
 * (`GreedyStrategy`, `KnapsackStrategy`, `AdaptiveStrategy`) but operating
 * over keyed values instead of tensors.
 */

import type { KeyProfile, StrategyName, Tier } from './types';

export interface StrategyContext {
  hotCapacity: number;
  hotKeys: string[];
  warmKeys: string[];
  profile: KeyProfile;
  /** All key profiles in the system, for global decisions. */
  allProfiles: KeyProfile[];
  /** True while still in the discovery window — strategy should be passive. */
  inDiscoveryWindow: boolean;
}

export interface TierDecision {
  /** Where the caller should place / move this key. */
  targetTier: Tier;
  /** Other keys that should be demoted out of hot to make room (if any). */
  demoteFromHot: string[];
}

export type Strategy = (ctx: StrategyContext) => TierDecision;

/**
 * Greedy: always promote to hot if not already hot. Demote LRU if full.
 * Mirrors FlexTensor's `GreedyStrategy`.
 */
export const greedyStrategy: Strategy = (ctx) => {
  if (ctx.inDiscoveryWindow) {
    return { targetTier: 'cold', demoteFromHot: [] };
  }
  if (ctx.hotKeys.includes(ctx.profile.key)) {
    return { targetTier: 'hot', demoteFromHot: [] };
  }
  if (ctx.hotKeys.length < ctx.hotCapacity) {
    return { targetTier: 'hot', demoteFromHot: [] };
  }
  return { targetTier: 'hot', demoteFromHot: [oldestHotKey(ctx)] };
};

/**
 * Adaptive: promote only if score exceeds the median of currently-hot keys.
 * Mirrors FlexTensor's `AdaptiveStrategy` philosophy: use observed data,
 * not just recency.
 */
export const adaptiveStrategy: Strategy = (ctx) => {
  if (ctx.inDiscoveryWindow) {
    return { targetTier: 'warm', demoteFromHot: [] };
  }

  if (ctx.hotKeys.includes(ctx.profile.key)) {
    return { targetTier: 'hot', demoteFromHot: [] };
  }

  if (ctx.hotKeys.length < ctx.hotCapacity) {
    return { targetTier: 'hot', demoteFromHot: [] };
  }

  const hotProfiles = ctx.allProfiles.filter((p) => ctx.hotKeys.includes(p.key));
  if (hotProfiles.length === 0) {
    return { targetTier: 'hot', demoteFromHot: [] };
  }
  const sorted = hotProfiles.map((p) => p.score).sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  if (ctx.profile.score <= median) {
    return { targetTier: 'warm', demoteFromHot: [] };
  }

  // Find the lowest-scoring hot key and bump it down.
  const weakest = hotProfiles.reduce((a, b) => (a.score <= b.score ? a : b));
  return { targetTier: 'hot', demoteFromHot: [weakest.key] };
};

/**
 * Knapsack-inspired: maximise total score subject to hot-tier capacity.
 * For each new admission, only promote if doing so increases total score
 * (i.e. the new key beats the weakest hot key by enough margin).
 *
 * Margin term penalises thrash — without it, two near-equal keys would
 * keep ping-ponging in/out of hot.
 */
export const knapsackStrategy: Strategy = (ctx) => {
  if (ctx.inDiscoveryWindow) {
    return { targetTier: 'warm', demoteFromHot: [] };
  }

  if (ctx.hotKeys.includes(ctx.profile.key)) {
    return { targetTier: 'hot', demoteFromHot: [] };
  }

  if (ctx.hotKeys.length < ctx.hotCapacity) {
    return { targetTier: 'hot', demoteFromHot: [] };
  }

  const hotProfiles = ctx.allProfiles.filter((p) => ctx.hotKeys.includes(p.key));
  if (hotProfiles.length === 0) {
    return { targetTier: 'hot', demoteFromHot: [] };
  }
  const weakest = hotProfiles.reduce((a, b) => (a.score <= b.score ? a : b));
  const margin = 1.15; // +15% must-beat factor
  if (ctx.profile.score > weakest.score * margin) {
    return { targetTier: 'hot', demoteFromHot: [weakest.key] };
  }
  return { targetTier: 'warm', demoteFromHot: [] };
};

function oldestHotKey(ctx: StrategyContext): string {
  // ctx.hotKeys is provided in insertion order from the Map; the first item
  // is the oldest by insertion. Profile-aware strategies above already use
  // lastSeenAt for better decisions; this helper is only for greedy.
  return ctx.hotKeys[0];
}

export function getStrategy(name: StrategyName): Strategy {
  switch (name) {
    case 'greedy':
      return greedyStrategy;
    case 'adaptive':
      return adaptiveStrategy;
    case 'knapsack':
      return knapsackStrategy;
  }
}
