import { randomUUID } from "crypto";
import { MEMORY_DOMAIN_UNKNOWN } from "./types.js";
import type { MemoryEntry } from "./types.js";
import type { MemoryStore } from "./store.js";
import { isExpired, isLowValue, isProvenPlaybook, markStale } from "./retention.js";

export interface SummarizationResult {
  summary: MemoryEntry;
  collapsedIds: string[];
}

export interface DistillationResult {
  lesson: MemoryEntry;
  sourceIds: string[];
}

export interface RetentionEnforcementResult {
  evicted: number;
  pinned: number;
  markedStale: number;
}

export function summarizeEpisodes(
  store: MemoryStore,
  scopeId: string,
  options: { minEpisodes?: number; summarizeFn?: (entries: MemoryEntry[]) => string } = {}
): SummarizationResult | null {
  const { minEpisodes = 3, summarizeFn } = options;

  const episodes = store.list({ tier: "episodic", scopeId, includeStale: false });

  if (episodes.length < minEpisodes) return null;

  const now = new Date().toISOString();
  const summarize = summarizeFn ?? defaultEpisodeSummarizer;
  const summaryText = summarize(episodes);

  const summaryEntry: MemoryEntry = {
    id: randomUUID(),
    tier: "semantic",
    memoryType: "semantic",
    key: `episode-summary:${scopeId}:${Date.now()}`,
    value: summaryText,
    summary: summaryText,
    provenance: {
      source: "memory-fabric:summarizer",
      method: "derived",
      createdAt: now,
    },
    freshness: {
      lastUpdatedAt: now,
      isStale: false,
    },
    confidence: Math.min(...episodes.map((e) => e.confidence)),
    retention: { policy: "persistent", pinned: false },
    sensitivity: highestSensitivity(episodes.map((e) => e.sensitivity)),
    linkedEntities: unique(episodes.flatMap((e) => e.linkedEntities)),
    linkedTraces: unique(episodes.flatMap((e) => e.linkedTraces)),
    linkedActions: unique(episodes.flatMap((e) => e.linkedActions)),
    tags: ["episodic-summary", ...(scopeId ? [`scope:${scopeId}`] : [])],
    scopeId,
    domain: dominantDomain(episodes),
    metadata: { collapsedCount: episodes.length, collapsedIds: episodes.map((e) => e.id) },
  };

  store.put(summaryEntry);

  for (const ep of episodes) {
    store.put(markStale(ep));
  }

  return { summary: summaryEntry, collapsedIds: episodes.map((e) => e.id) };
}

export function distillLessons(
  store: MemoryStore,
  options: { minFeedback?: number; distillFn?: (entries: MemoryEntry[]) => string } = {}
): DistillationResult | null {
  const { minFeedback = 2, distillFn } = options;

  const feedbackEntries = store.list({ tier: "operator-feedback", includeStale: false });
  const highValueFeedback = feedbackEntries.filter((e) => e.confidence >= 0.7);

  if (highValueFeedback.length < minFeedback) return null;

  const now = new Date().toISOString();
  const distill = distillFn ?? defaultLessonDistiller;
  const lessonText = distill(highValueFeedback);

  const lessonEntry: MemoryEntry = {
    id: randomUUID(),
    tier: "skill",
    memoryType: "skill",
    key: `lesson:${Date.now()}`,
    value: lessonText,
    summary: lessonText,
    provenance: {
      source: "memory-fabric:distiller",
      method: "derived",
      createdAt: now,
    },
    freshness: {
      lastUpdatedAt: now,
      isStale: false,
    },
    confidence: average(highValueFeedback.map((e) => e.confidence)),
    retention: { policy: "persistent", pinned: true },
    sensitivity: highestSensitivity(highValueFeedback.map((e) => e.sensitivity)),
    linkedEntities: unique(highValueFeedback.flatMap((e) => e.linkedEntities)),
    linkedTraces: unique(highValueFeedback.flatMap((e) => e.linkedTraces)),
    linkedActions: unique(highValueFeedback.flatMap((e) => e.linkedActions)),
    tags: ["distilled-lesson", "skill"],
    domain: dominantDomain(highValueFeedback),
    metadata: { sourceIds: highValueFeedback.map((e) => e.id) },
  };

  store.put(lessonEntry);

  return { lesson: lessonEntry, sourceIds: highValueFeedback.map((e) => e.id) };
}

export function enforceRetention(store: MemoryStore): RetentionEnforcementResult {
  const all = store.list({ includeStale: true });
  let evicted = 0;
  let pinned = 0;
  let markedStale = 0;

  for (const entry of all) {
    if (isProvenPlaybook(entry) && !entry.retention.pinned) {
      store.put({ ...entry, retention: { ...entry.retention, pinned: true } });
      pinned++;
      continue;
    }

    if (isExpired(entry)) {
      if (!entry.retention.pinned) {
        store.delete(entry.id);
        evicted++;
      }
      continue;
    }

    if (isLowValue(entry) && !entry.retention.pinned) {
      store.delete(entry.id);
      evicted++;
      continue;
    }

    if (!entry.freshness.isStale && entry.retention.expiresAt) {
      const expiry = new Date(entry.retention.expiresAt);
      const now = new Date();
      const halfLife = entry.retention.maxAgeDays
        ? entry.retention.maxAgeDays * 0.5 * 24 * 60 * 60 * 1000
        : null;
      if (halfLife && expiry.getTime() - now.getTime() < halfLife) {
        store.put(markStale(entry));
        markedStale++;
      }
    }
  }

  return { evicted, pinned, markedStale };
}

export interface FreshnessDecayResult {
  decayed: number;
  markedStale: number;
}

/**
 * Apply time-based freshness decay to all in-store entries.
 *
 * An entry's freshness decreases linearly from 1.0 (at creation) to 0.0
 * (at maxAgeDays). Entries whose freshness drops below `staleThreshold`
 * are marked stale. Pinned entries are skipped.
 *
 * @param halfLifeDays  Age (in days) at which freshness reaches 0.5 (default: 7)
 * @param staleThreshold  Freshness below this value marks an entry stale (default: 0.2)
 */
export function applyFreshnessDecay(
  store: MemoryStore,
  options: { halfLifeDays?: number; staleThreshold?: number } = {}
): FreshnessDecayResult {
  const { halfLifeDays = 7, staleThreshold = 0.2 } = options;
  const now = new Date();
  const halfLifeMs = halfLifeDays * 24 * 60 * 60 * 1000;

  const all = store.list({ includeStale: true });
  let decayed = 0;
  let markedStale = 0;

  for (const entry of all) {
    if (entry.retention.pinned) continue;

    const lastUpdated = new Date(entry.freshness.lastUpdatedAt);
    const ageMs = now.getTime() - lastUpdated.getTime();

    if (ageMs <= 0) continue;

    const decayFactor = Math.pow(0.5, ageMs / halfLifeMs);
    const newConfidence = Math.max(0, Math.min(1, entry.confidence * decayFactor));

    if (Math.abs(newConfidence - entry.confidence) < 0.001) continue;

    const willBeStale = newConfidence < staleThreshold;
    const updated: MemoryEntry = {
      ...entry,
      confidence: newConfidence,
      freshness: {
        ...entry.freshness,
        isStale: willBeStale || entry.freshness.isStale,
      },
    };

    store.put(updated);
    decayed++;
    if (willBeStale && !entry.freshness.isStale) markedStale++;
  }

  return { decayed, markedStale };
}

function defaultEpisodeSummarizer(entries: MemoryEntry[]): string {
  const keys = entries.map((e) => e.key).join(", ");
  return `Episodic summary of ${entries.length} episodes: ${keys}`;
}

function defaultLessonDistiller(entries: MemoryEntry[]): string {
  const keys = entries.map((e) => e.key).join(", ");
  return `Distilled lesson from ${entries.length} operator feedback items: ${keys}`;
}

function highestSensitivity(levels: MemoryEntry["sensitivity"][]): MemoryEntry["sensitivity"] {
  const order: MemoryEntry["sensitivity"][] = ["public", "internal", "confidential", "restricted"];
  let max = 0;
  for (const lvl of levels) {
    const idx = order.indexOf(lvl);
    if (idx > max) max = idx;
  }
  return order[max] ?? "internal";
}

function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

/**
 * Pick the most-common `domain` value from a set of source entries so derived
 * memories (summaries, distilled lessons) inherit the dominant domain rather
 * than silently defaulting to "unknown".
 */
function dominantDomain(entries: MemoryEntry[]): string {
  const counts = new Map<string, number>();
  for (const e of entries) {
    if (typeof e.domain === "string" && e.domain.length > 0) {
      counts.set(e.domain, (counts.get(e.domain) ?? 0) + 1);
    }
  }
  let best: string = MEMORY_DOMAIN_UNKNOWN;
  let bestCount = 0;
  for (const [d, c] of counts) {
    if (c > bestCount) {
      best = d;
      bestCount = c;
    }
  }
  return best;
}

function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}
