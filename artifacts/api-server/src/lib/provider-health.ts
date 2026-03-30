import { logger } from "./logger";
import type { InferenceProvider } from "./inference-telemetry";

export type HealthStatus = "healthy" | "degraded" | "down";

export interface ProviderHealthRecord {
  provider: InferenceProvider;
  status: HealthStatus;
  lastCheckedAt: number;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  avgLatencyMs: number;
  recentLatencies: number[];
  lastErrorMessage?: string;
  lastErrorAt?: number;
  lastSuccessAt?: number;
  degradedSince?: number;
  downSince?: number;
}

export interface HealthSummary {
  providers: ProviderHealthRecord[];
  overallStatus: HealthStatus;
  healthyCount: number;
  degradedCount: number;
  downCount: number;
  lastUpdated: number;
}

const DEGRADED_THRESHOLD_FAILURES = 3;
const DOWN_THRESHOLD_FAILURES = 8;
const RECOVERY_THRESHOLD_SUCCESSES = 3;
const LATENCY_WINDOW = 20;
const DEGRADED_LATENCY_MS = 5000;

class ProviderHealthMonitor {
  private providers: Map<InferenceProvider, ProviderHealthRecord> = new Map();

  private getOrCreate(provider: InferenceProvider): ProviderHealthRecord {
    let record = this.providers.get(provider);
    if (!record) {
      record = {
        provider,
        status: "healthy",
        lastCheckedAt: Date.now(),
        consecutiveFailures: 0,
        consecutiveSuccesses: 0,
        avgLatencyMs: 0,
        recentLatencies: [],
      };
      this.providers.set(provider, record);
    }
    return record;
  }

  recordSuccess(provider: InferenceProvider, latencyMs: number): void {
    const record = this.getOrCreate(provider);
    record.lastCheckedAt = Date.now();
    record.lastSuccessAt = Date.now();
    record.consecutiveSuccesses++;
    record.consecutiveFailures = 0;

    record.recentLatencies.push(latencyMs);
    if (record.recentLatencies.length > LATENCY_WINDOW) {
      record.recentLatencies.shift();
    }
    record.avgLatencyMs = Math.round(
      record.recentLatencies.reduce((s, l) => s + l, 0) / record.recentLatencies.length
    );

    this.evaluateStatus(record);
  }

  recordFailure(provider: InferenceProvider, errorMessage: string): void {
    const record = this.getOrCreate(provider);
    record.lastCheckedAt = Date.now();
    record.lastErrorAt = Date.now();
    record.lastErrorMessage = errorMessage.slice(0, 200);
    record.consecutiveFailures++;
    record.consecutiveSuccesses = 0;

    this.evaluateStatus(record);
    logger.warn({ provider, consecutiveFailures: record.consecutiveFailures, status: record.status }, "Provider failure recorded");
  }

  private evaluateStatus(record: ProviderHealthRecord): void {
    const previousStatus = record.status;

    if (record.consecutiveFailures >= DOWN_THRESHOLD_FAILURES) {
      record.status = "down";
      if (!record.downSince) record.downSince = Date.now();
      record.degradedSince = undefined;
    } else if (
      record.consecutiveFailures >= DEGRADED_THRESHOLD_FAILURES ||
      record.avgLatencyMs > DEGRADED_LATENCY_MS
    ) {
      record.status = "degraded";
      if (!record.degradedSince) record.degradedSince = Date.now();
      record.downSince = undefined;
    } else if (record.consecutiveSuccesses >= RECOVERY_THRESHOLD_SUCCESSES) {
      record.status = "healthy";
      record.degradedSince = undefined;
      record.downSince = undefined;
    }

    if (previousStatus !== record.status) {
      logger.info({ provider: record.provider, from: previousStatus, to: record.status }, "Provider health status changed");
    }
  }

  getStatus(provider: InferenceProvider): ProviderHealthRecord {
    return this.getOrCreate(provider);
  }

  getSummary(): HealthSummary {
    const allProviders = Array.from(this.providers.values());
    const healthy = allProviders.filter(p => p.status === "healthy").length;
    const degraded = allProviders.filter(p => p.status === "degraded").length;
    const down = allProviders.filter(p => p.status === "down").length;

    let overallStatus: HealthStatus = "healthy";
    if (down > 0) overallStatus = "degraded";
    if (healthy === 0 && allProviders.length > 0) overallStatus = "down";

    return {
      providers: allProviders,
      overallStatus,
      healthyCount: healthy,
      degradedCount: degraded,
      downCount: down,
      lastUpdated: Date.now(),
    };
  }

  reset(provider: InferenceProvider): void {
    this.providers.delete(provider);
    logger.info({ provider }, "Provider health record reset");
  }
}

export const providerHealth = new ProviderHealthMonitor();
