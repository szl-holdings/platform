/**
 * Freshness Decay — compute staleness and apply TTL-based decay to nodes.
 *
 * A node is considered stale when:
 *  - Its `ttlSeconds` has elapsed since `lastUpdatedAt`, OR
 *  - It has no TTL and its `lastUpdatedAt` is older than the default max age.
 *
 * The decay job mutates nodes in the provided GraphStore, marking stale nodes
 * with `freshness.isStale = true` and reducing their confidence by a
 * configurable decay factor.
 */

import type { ConstellationNode } from './schema.js';
import type { GraphStore } from './store.js';

export interface DecayOptions {
  /** Default max age in seconds before a node is considered stale (72 h). */
  defaultTtlSeconds?: number;
  /** Multiplier applied to confidence when a node becomes stale (0–1). */
  confidenceDecayFactor?: number;
  /** Optional fixed "now" timestamp for testing. */
  now?: number;
}

export interface DecayResult {
  processed: number;
  markedStale: number;
  refreshed: number;
  nodes: Array<{ id: string; wasStale: boolean; nowStale: boolean; confidence: number }>;
}

const DEFAULT_TTL_SECONDS = 72 * 60 * 60;
const DEFAULT_DECAY_FACTOR = 0.85;

/**
 * Run the freshness decay job across all nodes in the store.
 * Nodes whose TTL has elapsed are marked stale; their confidence is decayed.
 * Nodes that were previously stale but have been refreshed are un-marked.
 */
export function applyFreshnessDecay(store: GraphStore, options: DecayOptions = {}): DecayResult {
  const {
    defaultTtlSeconds = DEFAULT_TTL_SECONDS,
    confidenceDecayFactor = DEFAULT_DECAY_FACTOR,
    now = Date.now(),
  } = options;

  const result: DecayResult = {
    processed: 0,
    markedStale: 0,
    refreshed: 0,
    nodes: [],
  };

  for (const node of store.listNodes()) {
    result.processed++;

    const ttl = node.freshness.ttlSeconds ?? defaultTtlSeconds;
    const lastUpdatedMs = new Date(node.freshness.lastUpdatedAt).getTime();
    const ageSeconds = (now - lastUpdatedMs) / 1000;
    const shouldBeStale = ageSeconds > ttl;
    const wasStale = node.freshness.isStale;

    if (shouldBeStale === wasStale) {
      result.nodes.push({
        id: node.id,
        wasStale,
        nowStale: shouldBeStale,
        confidence: node.confidence,
      });
      continue;
    }

    let newConfidence = node.confidence;
    if (shouldBeStale && !wasStale) {
      newConfidence = Math.max(0, node.confidence * confidenceDecayFactor);
      result.markedStale++;
    } else if (!shouldBeStale && wasStale) {
      result.refreshed++;
    }

    const updated: ConstellationNode = {
      ...node,
      confidence: newConfidence,
      freshness: {
        ...node.freshness,
        isStale: shouldBeStale,
      },
      updatedAt: new Date(now).toISOString(),
    };

    store.upsertNode(updated);
    result.nodes.push({
      id: node.id,
      wasStale,
      nowStale: shouldBeStale,
      confidence: newConfidence,
    });
  }

  return result;
}

/**
 * Compute the effective freshness score [0, 1] for a node without mutating it.
 * 1.0 = perfectly fresh, 0.0 = completely expired (TTL exceeded by a wide margin).
 */
export function freshnessScore(
  node: ConstellationNode,
  options: Pick<DecayOptions, 'defaultTtlSeconds' | 'now'> = {},
): number {
  const ttl = node.freshness.ttlSeconds ?? options.defaultTtlSeconds ?? DEFAULT_TTL_SECONDS;
  const lastUpdatedMs = new Date(node.freshness.lastUpdatedAt).getTime();
  const nowMs = options.now ?? Date.now();
  const ageSeconds = (nowMs - lastUpdatedMs) / 1000;
  return Math.max(0, 1 - ageSeconds / ttl);
}
