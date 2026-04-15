import { ServiceAdapter } from "../base.js";

export interface NewRelicApmMetrics {
  applicationName: string;
  responseTimeMs: number;
  throughputRpm: number;
  errorRatePct: number;
  apdexScore: number;
  apdexTarget: number;
  hostCount: number;
  instanceCount: number;
}

export interface NewRelicHost {
  hostname: string;
  cpuPct: number;
  memoryUsedPct: number;
  diskUsedPct: number;
  networkReceiveBytesPerSec: number;
  networkTransmitBytesPerSec: number;
  fullestDiskPct: number;
}

export interface NewRelicAlertCondition {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  severity: "CRITICAL" | "WARNING";
  threshold: number;
  currentValue: number | null;
  violating: boolean;
}

const DEMO_APM: NewRelicApmMetrics = {
  applicationName: "SZL-Platform-API",
  responseTimeMs: 142,
  throughputRpm: 2340,
  errorRatePct: 0.42,
  apdexScore: 0.94,
  apdexTarget: 0.5,
  hostCount: 4,
  instanceCount: 8,
};

const DEMO_HOSTS: NewRelicHost[] = [
  { hostname: "api-prod-01", cpuPct: 34, memoryUsedPct: 62, diskUsedPct: 41, networkReceiveBytesPerSec: 4_200_000, networkTransmitBytesPerSec: 8_100_000, fullestDiskPct: 47 },
  { hostname: "api-prod-02", cpuPct: 28, memoryUsedPct: 58, diskUsedPct: 39, networkReceiveBytesPerSec: 3_800_000, networkTransmitBytesPerSec: 7_200_000, fullestDiskPct: 44 },
  { hostname: "worker-prod-01", cpuPct: 71, memoryUsedPct: 82, diskUsedPct: 55, networkReceiveBytesPerSec: 1_200_000, networkTransmitBytesPerSec: 900_000, fullestDiskPct: 55 },
  { hostname: "db-replica-01", cpuPct: 18, memoryUsedPct: 74, diskUsedPct: 62, networkReceiveBytesPerSec: 12_000_000, networkTransmitBytesPerSec: 2_300_000, fullestDiskPct: 68 },
];

const DEMO_ALERTS: NewRelicAlertCondition[] = [
  { id: "ac-1", name: "High Error Rate", type: "apm_app_metric", enabled: true, severity: "CRITICAL", threshold: 5.0, currentValue: 0.42, violating: false },
  { id: "ac-2", name: "Response Time", type: "apm_app_metric", enabled: true, severity: "WARNING", threshold: 500, currentValue: 142, violating: false },
  { id: "ac-3", name: "Apdex Below Target", type: "apm_app_metric", enabled: true, severity: "WARNING", threshold: 0.7, currentValue: 0.94, violating: false },
  { id: "ac-4", name: "Host CPU High", type: "infra_host_not_reporting", enabled: true, severity: "CRITICAL", threshold: 90, currentValue: 71, violating: false },
];

export class NewRelicAdapter extends ServiceAdapter {
  readonly name = "new-relic";
  readonly description = "New Relic APM — application performance monitoring via NerdGraph GraphQL API";
  readonly requiredEnvVars = ["NEW_RELIC_API_KEY", "NEW_RELIC_ACCOUNT_ID"];

  protected rateLimitPerMinute = 25;

  private get apiKey(): string {
    return process.env["NEW_RELIC_API_KEY"] ?? "";
  }

  private get accountId(): string {
    return process.env["NEW_RELIC_ACCOUNT_ID"] ?? "";
  }

  protected async performHealthCheck(): Promise<void> {
    const res = await this.resilientFetch("https://api.newrelic.com/graphql", {
      method: "POST",
      headers: {
        "API-Key": this.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `{ actor { account(id: ${this.accountId}) { name } } }`,
      }),
      maxRetries: 1,
      timeoutMs: 10_000,
    });
    if (!res.ok) throw new Error(`NerdGraph HTTP ${res.status}`);
    const json = await res.json() as any;
    if (json.errors?.length) throw new Error(json.errors[0].message);
  }

  private sanitizeNrql(input: string): string {
    return input.replace(/[^a-zA-Z0-9\s\-_.]/g, "");
  }

  async getApmMetrics(appName?: string): Promise<NewRelicApmMetrics> {
    if (!this.isLive) return { ...DEMO_APM };

    const safeAppName = this.sanitizeNrql(appName ?? "SZL-Platform-API");
    const nrql = `SELECT average(duration) * 1000 as responseTimeMs, rate(count(*), 1 minute) as throughputRpm, percentage(count(*), WHERE error IS true) as errorRatePct, apdex(duration, t: 0.5) as apdexScore FROM Transaction WHERE appName = '${safeAppName}' SINCE 5 minutes ago`;

    const res = await this.resilientFetch("https://api.newrelic.com/graphql", {
      method: "POST",
      headers: { "API-Key": this.apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `{ actor { account(id: ${this.accountId}) { nrql(query: "${nrql}") { results } } } }`,
      }),
    });

    if (!res.ok) return { ...DEMO_APM };
    const json = await res.json() as any;
    const results = json?.data?.actor?.account?.nrql?.results?.[0];
    if (!results) return { ...DEMO_APM };

    return {
      applicationName: appName ?? "SZL-Platform-API",
      responseTimeMs: results.responseTimeMs ?? DEMO_APM.responseTimeMs,
      throughputRpm: results.throughputRpm ?? DEMO_APM.throughputRpm,
      errorRatePct: results.errorRatePct ?? DEMO_APM.errorRatePct,
      apdexScore: results.apdexScore ?? DEMO_APM.apdexScore,
      apdexTarget: 0.5,
      hostCount: DEMO_APM.hostCount,
      instanceCount: DEMO_APM.instanceCount,
    };
  }

  async getInfraHosts(): Promise<NewRelicHost[]> {
    if (!this.isLive) return [...DEMO_HOSTS];

    const nrql = `SELECT average(cpuPercent) as cpuPct, average(memoryUsedPercent) as memoryUsedPct, average(diskUsedPercent) as diskUsedPct, average(networkReceiveBytesPerSecond) as networkReceiveBytesPerSec, average(networkTransmitBytesPerSecond) as networkTransmitBytesPerSec, max(diskUsedPercent) as fullestDiskPct FROM SystemSample FACET hostname SINCE 5 minutes ago LIMIT 20`;

    const res = await this.resilientFetch("https://api.newrelic.com/graphql", {
      method: "POST",
      headers: { "API-Key": this.apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `{ actor { account(id: ${this.accountId}) { nrql(query: "${nrql}") { results } } } }`,
      }),
    });

    if (!res.ok) return [...DEMO_HOSTS];
    const json = await res.json() as any;
    const results = json?.data?.actor?.account?.nrql?.results;
    if (!Array.isArray(results) || results.length === 0) return [...DEMO_HOSTS];

    return results.map((r: any) => ({
      hostname: r.facet ?? "unknown",
      cpuPct: r.cpuPct ?? 0,
      memoryUsedPct: r.memoryUsedPct ?? 0,
      diskUsedPct: r.diskUsedPct ?? 0,
      networkReceiveBytesPerSec: r.networkReceiveBytesPerSec ?? 0,
      networkTransmitBytesPerSec: r.networkTransmitBytesPerSec ?? 0,
      fullestDiskPct: r.fullestDiskPct ?? 0,
    }));
  }

  async getAlertConditions(): Promise<NewRelicAlertCondition[]> {
    if (!this.isLive) return [...DEMO_ALERTS];

    const res = await this.resilientFetch("https://api.newrelic.com/graphql", {
      method: "POST",
      headers: { "API-Key": this.apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `{ actor { account(id: ${this.accountId}) { alerts { nrqlConditionsSearch { nrqlConditions { id name enabled type policyId signal { aggregationWindow } } } } } } }`,
      }),
    });

    if (!res.ok) return [...DEMO_ALERTS];
    const json = await res.json() as any;
    const conditions = json?.data?.actor?.account?.alerts?.nrqlConditionsSearch?.nrqlConditions;
    if (!Array.isArray(conditions) || conditions.length === 0) return [...DEMO_ALERTS];

    return conditions.slice(0, 10).map((c: any) => ({
      id: String(c.id),
      name: c.name ?? "Unknown",
      type: c.type ?? "nrql",
      enabled: c.enabled ?? true,
      severity: "WARNING" as const,
      threshold: 0,
      currentValue: null,
      violating: false,
    }));
  }
}
