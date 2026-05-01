import { logger } from './logger';

export type InferenceProvider =
  | 'openai'
  | 'anthropic'
  | 'replit-proxy'
  | 'gemini'
  | 'huggingface'
  | 'qclaw'
  | 'mock';

export interface InferenceRecord {
  id: string;
  timestamp: number;
  provider: InferenceProvider;
  model: string;
  agentId: string;
  domain: string;
  orgId?: string;
  latencyMs: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  success: boolean;
  errorType?: string;
  routingStrategy: 'fastest' | 'cheapest' | 'preferred' | 'fallback' | 'direct';
  retryCount: number;
  cached: boolean;
}

export interface ProviderStats {
  provider: InferenceProvider;
  totalRequests: number;
  successCount: number;
  failureCount: number;
  avgLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  totalTokens: number;
  totalCostUsd: number;
  errorRate: number;
  lastRequestAt: number | null;
  uptimeRatio: number;
}

export interface ModelStats {
  model: string;
  provider: InferenceProvider;
  totalRequests: number;
  avgLatencyMs: number;
  avgTokensPerRequest: number;
  totalCostUsd: number;
  errorRate: number;
}

export interface TelemetrySummary {
  windowMs: number;
  totalInferences: number;
  totalTokens: number;
  totalCostUsd: number;
  avgLatencyMs: number;
  successRate: number;
  providerBreakdown: ProviderStats[];
  modelBreakdown: ModelStats[];
  topAgents: Array<{
    agentId: string;
    domain: string;
    count: number;
    avgLatencyMs: number;
    totalCostUsd: number;
  }>;
  recentErrors: Array<{
    timestamp: number;
    provider: InferenceProvider;
    model: string;
    errorType: string;
    agentId: string;
  }>;
  throughputPerMinute: number;
}

const COST_PER_1K_TOKENS: Record<string, { input: number; output: number }> = {
  'gpt-5.2': { input: 0.005, output: 0.015 },
  'gpt-4o': { input: 0.0025, output: 0.01 },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'claude-sonnet-4-6': { input: 0.003, output: 0.015 },
  'claude-sonnet-4-20250514': { input: 0.003, output: 0.015 },
  'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },
  'Qwen/Qwen3-8B': { input: 0.0001, output: 0.0001 },
  'Qwen/Qwen3-0.6B': { input: 0.00002, output: 0.00002 },
  'Qwen/Qwen2.5-VL-7B-Instruct': { input: 0.0001, output: 0.0001 },
  'LakoMoor/QClaw-4B': { input: 0.00004, output: 0.00008 },
};

export function estimateCost(
  model: string,
  promptTokens: number,
  completionTokens: number,
): number {
  const rates = COST_PER_1K_TOKENS[model];
  if (!rates) return 0;
  return (promptTokens / 1000) * rates.input + (completionTokens / 1000) * rates.output;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)]!;
}

const MAX_RECORDS = 5000;
const DEFAULT_WINDOW_MS = 60 * 60 * 1000;

class InferenceTelemetryStore {
  private records: InferenceRecord[] = [];
  private idCounter = 0;

  record(
    partial: Omit<InferenceRecord, 'id' | 'timestamp' | 'totalTokens' | 'estimatedCostUsd'>,
  ): InferenceRecord {
    const totalTokens = partial.promptTokens + partial.completionTokens;
    const entry: InferenceRecord = {
      ...partial,
      id: `inf-${Date.now()}-${++this.idCounter}`,
      timestamp: Date.now(),
      totalTokens,
      estimatedCostUsd: estimateCost(partial.model, partial.promptTokens, partial.completionTokens),
    };

    this.records.unshift(entry);
    if (this.records.length > MAX_RECORDS) {
      this.records.length = MAX_RECORDS;
    }

    logger.debug(
      {
        id: entry.id,
        provider: entry.provider,
        model: entry.model,
        latencyMs: entry.latencyMs,
        success: entry.success,
      },
      'Inference telemetry recorded',
    );
    return entry;
  }

  getRecords(
    options: {
      windowMs?: number;
      provider?: InferenceProvider;
      agentId?: string;
      model?: string;
      orgId?: string;
      limit?: number;
    } = {},
  ): InferenceRecord[] {
    const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
    const cutoff = Date.now() - windowMs;
    let results = this.records.filter((r) => r.timestamp >= cutoff);
    if (options.provider) results = results.filter((r) => r.provider === options.provider);
    if (options.agentId) results = results.filter((r) => r.agentId === options.agentId);
    if (options.model) results = results.filter((r) => r.model === options.model);
    if (options.orgId) results = results.filter((r) => r.orgId === options.orgId);
    return results.slice(0, options.limit ?? 200);
  }

  getProviderStats(windowMs = DEFAULT_WINDOW_MS, orgId?: string): ProviderStats[] {
    const cutoff = Date.now() - windowMs;
    let recent = this.records.filter((r) => r.timestamp >= cutoff);
    if (orgId) recent = recent.filter((r) => r.orgId === orgId);
    const byProvider = new Map<InferenceProvider, InferenceRecord[]>();

    for (const r of recent) {
      const arr = byProvider.get(r.provider) ?? [];
      arr.push(r);
      byProvider.set(r.provider, arr);
    }

    const stats: ProviderStats[] = [];
    for (const [provider, recs] of byProvider) {
      const latencies = recs
        .filter((r) => r.success)
        .map((r) => r.latencyMs)
        .sort((a, b) => a - b);
      const successes = recs.filter((r) => r.success).length;
      const failures = recs.filter((r) => !r.success).length;

      stats.push({
        provider,
        totalRequests: recs.length,
        successCount: successes,
        failureCount: failures,
        avgLatencyMs:
          latencies.length > 0
            ? Math.round(latencies.reduce((s, l) => s + l, 0) / latencies.length)
            : 0,
        p50LatencyMs: percentile(latencies, 50),
        p95LatencyMs: percentile(latencies, 95),
        p99LatencyMs: percentile(latencies, 99),
        totalTokens: recs.reduce((s, r) => s + r.totalTokens, 0),
        totalCostUsd: parseFloat(recs.reduce((s, r) => s + r.estimatedCostUsd, 0).toFixed(6)),
        errorRate: recs.length > 0 ? parseFloat((failures / recs.length).toFixed(4)) : 0,
        lastRequestAt: recs.length > 0 ? recs[0]?.timestamp : null,
        uptimeRatio: recs.length > 0 ? parseFloat((successes / recs.length).toFixed(4)) : 1,
      });
    }

    return stats.sort((a, b) => b.totalRequests - a.totalRequests);
  }

  getModelStats(windowMs = DEFAULT_WINDOW_MS, orgId?: string): ModelStats[] {
    const cutoff = Date.now() - windowMs;
    let recent = this.records.filter((r) => r.timestamp >= cutoff);
    if (orgId) recent = recent.filter((r) => r.orgId === orgId);
    const byModel = new Map<string, InferenceRecord[]>();

    for (const r of recent) {
      const key = `${r.model}::${r.provider}`;
      const arr = byModel.get(key) ?? [];
      arr.push(r);
      byModel.set(key, arr);
    }

    const stats: ModelStats[] = [];
    for (const [, recs] of byModel) {
      const first = recs[0]!;
      const latencies = recs.filter((r) => r.success).map((r) => r.latencyMs);
      const failures = recs.filter((r) => !r.success).length;

      stats.push({
        model: first.model,
        provider: first.provider,
        totalRequests: recs.length,
        avgLatencyMs:
          latencies.length > 0
            ? Math.round(latencies.reduce((s, l) => s + l, 0) / latencies.length)
            : 0,
        avgTokensPerRequest: Math.round(recs.reduce((s, r) => s + r.totalTokens, 0) / recs.length),
        totalCostUsd: parseFloat(recs.reduce((s, r) => s + r.estimatedCostUsd, 0).toFixed(6)),
        errorRate: recs.length > 0 ? parseFloat((failures / recs.length).toFixed(4)) : 0,
      });
    }

    return stats.sort((a, b) => b.totalRequests - a.totalRequests);
  }

  getSummary(windowMs = DEFAULT_WINDOW_MS, orgId?: string): TelemetrySummary {
    const cutoff = Date.now() - windowMs;
    let recent = this.records.filter((r) => r.timestamp >= cutoff);
    if (orgId) recent = recent.filter((r) => r.orgId === orgId);
    const successes = recent.filter((r) => r.success);
    const latencies = successes.map((r) => r.latencyMs);
    const totalTokens = recent.reduce((s, r) => s + r.totalTokens, 0);
    const totalCostUsd = parseFloat(recent.reduce((s, r) => s + r.estimatedCostUsd, 0).toFixed(6));

    const agentMap = new Map<
      string,
      { domain: string; count: number; totalLatency: number; totalCost: number }
    >();
    for (const r of recent) {
      const existing = agentMap.get(r.agentId);
      if (existing) {
        existing.count++;
        existing.totalLatency += r.latencyMs;
        existing.totalCost += r.estimatedCostUsd;
      } else {
        agentMap.set(r.agentId, {
          domain: r.domain,
          count: 1,
          totalLatency: r.latencyMs,
          totalCost: r.estimatedCostUsd,
        });
      }
    }

    const topAgents = Array.from(agentMap.entries())
      .map(([agentId, data]) => ({
        agentId,
        domain: data.domain,
        count: data.count,
        avgLatencyMs: Math.round(data.totalLatency / data.count),
        totalCostUsd: parseFloat(data.totalCost.toFixed(6)),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const recentErrors = recent
      .filter((r) => !r.success)
      .slice(0, 20)
      .map((r) => ({
        timestamp: r.timestamp,
        provider: r.provider,
        model: r.model,
        errorType: r.errorType ?? 'unknown',
        agentId: r.agentId,
      }));

    const windowMinutes = windowMs / 60000;
    const throughputPerMinute =
      windowMinutes > 0 ? parseFloat((recent.length / windowMinutes).toFixed(2)) : 0;

    return {
      windowMs,
      totalInferences: recent.length,
      totalTokens,
      totalCostUsd,
      avgLatencyMs:
        latencies.length > 0
          ? Math.round(latencies.reduce((s, l) => s + l, 0) / latencies.length)
          : 0,
      successRate:
        recent.length > 0 ? parseFloat((successes.length / recent.length).toFixed(4)) : 1,
      providerBreakdown: this.getProviderStats(windowMs, orgId),
      modelBreakdown: this.getModelStats(windowMs, orgId),
      topAgents,
      recentErrors,
      throughputPerMinute,
    };
  }

  getProviderLatencyForModel(
    provider: InferenceProvider,
    model: string,
    windowMs = DEFAULT_WINDOW_MS,
  ): number {
    const cutoff = Date.now() - windowMs;
    const matching = this.records.filter(
      (r) => r.timestamp >= cutoff && r.provider === provider && r.model === model && r.success,
    );
    if (matching.length === 0) return Infinity;
    return matching.reduce((s, r) => s + r.latencyMs, 0) / matching.length;
  }

  getProviderErrorRate(provider: InferenceProvider, windowMs = DEFAULT_WINDOW_MS): number {
    const cutoff = Date.now() - windowMs;
    const matching = this.records.filter((r) => r.timestamp >= cutoff && r.provider === provider);
    if (matching.length === 0) return 0;
    return matching.filter((r) => !r.success).length / matching.length;
  }

  clear(): void {
    this.records = [];
    this.idCounter = 0;
  }
}

export const inferenceTelemetry = new InferenceTelemetryStore();
