/**
 * Per-key access profiler. Inspired by FlexTensor's discovery + profiling
 * iteration model: observe first, then make tiering decisions backed by data.
 */

import type { KeyProfile, Tier } from './types';

export interface ProfilerSample {
  loaderLatencyMs?: number;
  servedTier: Tier;
  bytes?: number;
}

export class Profiler {
  private readonly profiles = new Map<string, KeyProfile>();
  /** Total `recordCall` invocations across every key — the global iteration counter. */
  private globalIters = 0;

  observe(key: string, sample: ProfilerSample): KeyProfile {
    const now = Date.now();
    const existing = this.profiles.get(key);
    const profile: KeyProfile = existing
      ? { ...existing }
      : {
          key,
          calls: 0,
          loaderInvocations: 0,
          loaderLatencyMs: 0,
          lastServedTier: sample.servedTier,
          lastBytes: sample.bytes ?? 0,
          score: 0,
          firstSeenAt: now,
          lastSeenAt: now,
        };

    profile.calls += 1;
    profile.lastSeenAt = now;
    profile.lastServedTier = sample.servedTier;
    if (sample.bytes != null) profile.lastBytes = sample.bytes;

    if (sample.loaderLatencyMs != null) {
      profile.loaderInvocations += 1;
      profile.loaderLatencyMs += sample.loaderLatencyMs;
    }

    profile.score = computeScore(profile);
    this.profiles.set(key, profile);
    this.globalIters += 1;
    return profile;
  }

  get(key: string): KeyProfile | undefined {
    return this.profiles.get(key);
  }

  size(): number {
    return this.profiles.size;
  }

  globalIterations(): number {
    return this.globalIters;
  }

  /** Snapshot — caller may not mutate. */
  all(): KeyProfile[] {
    return Array.from(this.profiles.values());
  }

  /** Reset profile data while preserving the global iteration counter. */
  resetProfiles(): void {
    this.profiles.clear();
  }

  /** Drop a single key's profile. */
  forget(key: string): void {
    this.profiles.delete(key);
  }

  /** Serializable export for profile persistence (FlexTensor parallel). */
  exportProfile(): KeyProfile[] {
    return this.all();
  }

  /** Restore from a previously exported profile. */
  importProfile(profiles: KeyProfile[]): void {
    for (const p of profiles) {
      this.profiles.set(p.key, { ...p, score: computeScore(p) });
    }
  }
}

/**
 * Tier-decision score.
 *
 * The intuition: high call count + high loader latency + small payload means
 * "this key is expensive to recompute and cheap to keep — keep it hot". Low
 * call count + small latency means "evict it".
 *
 * - calls               → recency/frequency signal
 * - avg loader latency  → how expensive a miss is
 * - bytes               → cost of keeping it hot (penalty)
 *
 * Bytes penalty is logarithmic so that very large entries are discouraged
 * but not absolutely forbidden.
 */
export function computeScore(p: KeyProfile): number {
  const avgLatency =
    p.loaderInvocations > 0 ? p.loaderLatencyMs / p.loaderInvocations : 1;
  const sizePenalty = Math.log2(Math.max(p.lastBytes, 1)) + 1;
  return (p.calls * (avgLatency + 1)) / sizePenalty;
}
