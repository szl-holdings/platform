import type { EmbeddingDomain } from './domain-config.js';
import type { EmbeddingProviderType } from './provider.js';

interface LatencySample {
  value: number;
  timestamp: number;
}

interface ProviderStats {
  totalRequests: number;
  successRequests: number;
  successLatencyMs: number;
  latencySamples: LatencySample[];
  modelUsage: Record<string, number>;
  domainUsage: Record<string, number>;
  cacheHits: number;
}

const MAX_LATENCY_SAMPLES = 200;
const _STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000;

class EmbeddingAnalyticsTracker {
  private providerStats = new Map<EmbeddingProviderType, ProviderStats>();
  private globalCacheHits = 0;
  private globalCacheMisses = 0;
  private readonly startTime = Date.now();

  private getOrCreateStats(provider: EmbeddingProviderType): ProviderStats {
    if (!this.providerStats.has(provider)) {
      this.providerStats.set(provider, {
        totalRequests: 0,
        successRequests: 0,
        successLatencyMs: 0,
        latencySamples: [],
        modelUsage: {},
        domainUsage: {},
        cacheHits: 0,
      });
    }
    return this.providerStats.get(provider)!;
  }

  recordEmbedding(
    provider: EmbeddingProviderType,
    model: string,
    latencyMs: number,
    success: boolean,
    domain?: EmbeddingDomain,
  ): void {
    const stats = this.getOrCreateStats(provider);
    stats.totalRequests++;

    if (success) {
      stats.successRequests++;
      stats.successLatencyMs += latencyMs;
      stats.latencySamples.push({ value: latencyMs, timestamp: Date.now() });
      if (stats.latencySamples.length > MAX_LATENCY_SAMPLES) {
        stats.latencySamples.shift();
      }
    }

    stats.modelUsage[model] = (stats.modelUsage[model] ?? 0) + 1;
    if (domain) {
      stats.domainUsage[domain] = (stats.domainUsage[domain] ?? 0) + 1;
    }

    this.globalCacheMisses++;
  }

  recordCacheHit(provider: EmbeddingProviderType, model: string): void {
    const stats = this.getOrCreateStats(provider);
    stats.cacheHits++;
    stats.modelUsage[model] = (stats.modelUsage[model] ?? 0) + 1;
    this.globalCacheHits++;
  }

  getCacheStats() {
    const total = this.globalCacheHits + this.globalCacheMisses;
    return {
      hits: this.globalCacheHits,
      misses: this.globalCacheMisses,
      total,
      hitRate: total > 0 ? `${((this.globalCacheHits / total) * 100).toFixed(1)}%` : '0%',
    };
  }

  private computePercentiles(samples: LatencySample[]): { p50: number; p90: number; p99: number } {
    if (samples.length === 0) return { p50: 0, p90: 0, p99: 0 };
    const sorted = [...samples].sort((a, b) => a.value - b.value);
    const at = (pct: number) => sorted[Math.floor((pct / 100) * (sorted.length - 1))]?.value ?? 0;
    return { p50: at(50), p90: at(90), p99: at(99) };
  }

  getAnalyticsReport(): EmbeddingAnalyticsReport {
    const providerReports: EmbeddingAnalyticsReport['providers'] = {};

    for (const [provider, stats] of this.providerStats.entries()) {
      const successRate = stats.totalRequests > 0 ? stats.successRequests / stats.totalRequests : 0;
      const avgLatency =
        stats.successRequests > 0 ? stats.successLatencyMs / stats.successRequests : 0;
      const percentiles = this.computePercentiles(stats.latencySamples);
      const totalCacheOps = stats.cacheHits + stats.totalRequests;
      const cacheHitRate =
        totalCacheOps > 0 ? `${((stats.cacheHits / totalCacheOps) * 100).toFixed(1)}%` : '0%';

      const topModels = Object.entries(stats.modelUsage)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([model, count]) => ({ model, count }));

      const topDomains = Object.entries(stats.domainUsage)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([domain, count]) => ({ domain, count }));

      providerReports[provider] = {
        totalRequests: stats.totalRequests,
        successRequests: stats.successRequests,
        successRate: `${(successRate * 100).toFixed(1)}%`,
        avgLatencyMs: Math.round(avgLatency),
        latencyPercentiles: percentiles,
        cacheHitRate,
        topModels,
        topDomains,
      };
    }

    const cacheStats = this.getCacheStats();
    const uptimeSec = Math.floor((Date.now() - this.startTime) / 1000);

    return {
      timestamp: new Date().toISOString(),
      uptimeSeconds: uptimeSec,
      globalCacheStats: cacheStats,
      providers: providerReports,
    };
  }

  reset(): void {
    this.providerStats.clear();
    this.globalCacheHits = 0;
    this.globalCacheMisses = 0;
  }
}

export interface EmbeddingAnalyticsReport {
  timestamp: string;
  uptimeSeconds: number;
  globalCacheStats: {
    hits: number;
    misses: number;
    total: number;
    hitRate: string;
  };
  providers: Record<
    string,
    {
      totalRequests: number;
      successRequests: number;
      successRate: string;
      avgLatencyMs: number;
      latencyPercentiles: { p50: number; p90: number; p99: number };
      cacheHitRate: string;
      topModels: Array<{ model: string; count: number }>;
      topDomains: Array<{ domain: string; count: number }>;
    }
  >;
}

export const embeddingAnalytics = new EmbeddingAnalyticsTracker();
