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
  lastProbeAt?: number;
  lastProbeSuccess?: boolean;
}

export interface HealthSummary {
  providers: ProviderHealthRecord[];
  overallStatus: HealthStatus;
  healthyCount: number;
  degradedCount: number;
  downCount: number;
  lastUpdated: number;
  probeIntervalMs: number;
}

const DEGRADED_THRESHOLD_FAILURES = 3;
const DOWN_THRESHOLD_FAILURES = 8;
const RECOVERY_THRESHOLD_SUCCESSES = 3;
const LATENCY_WINDOW = 20;
const DEGRADED_LATENCY_MS = 5000;
const PROBE_INTERVAL_MS = 120_000;

const KNOWN_PROVIDERS: InferenceProvider[] = ["replit-proxy", "openai", "anthropic", "gemini", "huggingface"];

class ProviderHealthMonitor {
  private providers: Map<InferenceProvider, ProviderHealthRecord> = new Map();
  private probeTimer: ReturnType<typeof setInterval> | null = null;

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
      probeIntervalMs: PROBE_INTERVAL_MS,
    };
  }

  reset(provider: InferenceProvider): void {
    this.providers.delete(provider);
    logger.info({ provider }, "Provider health record reset");
  }

  startActiveProbes(): void {
    if (this.probeTimer) return;

    for (const p of KNOWN_PROVIDERS) {
      this.getOrCreate(p);
    }

    this.probeTimer = setInterval(() => {
      this.runProbes().catch(err => {
        logger.error({ error: String(err) }, "Active health probe cycle failed");
      });
    }, PROBE_INTERVAL_MS);

    logger.info({ intervalMs: PROBE_INTERVAL_MS, providers: KNOWN_PROVIDERS }, "Active health probing started");
  }

  stopActiveProbes(): void {
    if (this.probeTimer) {
      clearInterval(this.probeTimer);
      this.probeTimer = null;
      logger.info("Active health probing stopped");
    }
  }

  private async runProbes(): Promise<void> {
    for (const provider of KNOWN_PROVIDERS) {
      const record = this.getOrCreate(provider);
      try {
        const start = Date.now();
        const ok = await this.probeProvider(provider);
        const latencyMs = Date.now() - start;
        record.lastProbeAt = Date.now();
        record.lastProbeSuccess = ok;

        if (ok) {
          this.recordSuccess(provider, latencyMs);
        } else {
          this.recordFailure(provider, "probe returned not-ok");
        }
      } catch (err) {
        record.lastProbeAt = Date.now();
        record.lastProbeSuccess = false;
        this.recordFailure(provider, `probe error: ${String(err).slice(0, 100)}`);
      }
    }
  }

  private async probeProvider(provider: InferenceProvider): Promise<boolean> {
    const probeEndpoints: Record<string, string | undefined> = {
      "replit-proxy": process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ? `${process.env.AI_INTEGRATIONS_OPENAI_BASE_URL}/models` : undefined,
      "openai": process.env.OPENAI_API_KEY ? "https://api.openai.com/v1/models" : undefined,
      "anthropic": process.env.ANTHROPIC_API_KEY ? "https://api.anthropic.com/v1/messages" : undefined,
      "gemini": process.env.GEMINI_API_KEY ? "https://generativelanguage.googleapis.com/v1beta/models" : undefined,
      "huggingface": process.env.HUGGINGFACE_API_KEY ? "https://api-inference.huggingface.co/status" : undefined,
    };

    const endpoint = probeEndpoints[provider];
    if (!endpoint) return true;

    const headers: Record<string, string> = {};
    if (provider === "replit-proxy" && process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
      headers["Authorization"] = `Bearer ${process.env.AI_INTEGRATIONS_OPENAI_API_KEY}`;
    } else if (provider === "openai" && process.env.OPENAI_API_KEY) {
      headers["Authorization"] = `Bearer ${process.env.OPENAI_API_KEY}`;
    } else if (provider === "anthropic" && process.env.ANTHROPIC_API_KEY) {
      headers["x-api-key"] = process.env.ANTHROPIC_API_KEY;
      headers["anthropic-version"] = "2023-06-01";
    } else if (provider === "gemini" && process.env.GEMINI_API_KEY) {
      headers["x-goog-api-key"] = process.env.GEMINI_API_KEY;
    } else if (provider === "huggingface" && process.env.HUGGINGFACE_API_KEY) {
      headers["Authorization"] = `Bearer ${process.env.HUGGINGFACE_API_KEY}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    try {
      const resp = await fetch(endpoint, {
        method: provider === "anthropic" ? "OPTIONS" : "GET",
        headers,
        signal: controller.signal,
      });
      if (resp.status >= 500) return false;
      if (resp.status === 401 || resp.status === 403) return false;
      return true;
    } finally {
      clearTimeout(timer);
    }
  }
}

export const providerHealth = new ProviderHealthMonitor();
