import type { PillarId } from "./types.js";

export interface TelemetryEvent {
  metricId: string;
  value: number;
  timestamp: number;
  labels?: Record<string, string>;
}

export interface RequestTelemetry {
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  timestamp: number;
  correlationId?: string;
}

const WINDOW_SIZE = 300_000;

export class ServerTelemetryCollector {
  private requests: RequestTelemetry[] = [];
  private errorCounts = new Map<string, number>();
  private startTime = Date.now();

  recordRequest(data: RequestTelemetry) {
    this.requests.push(data);
    this.pruneOldEntries();

    if (data.statusCode >= 500) {
      const key = `${data.method}:${data.path}`;
      this.errorCounts.set(key, (this.errorCounts.get(key) || 0) + 1);
    }
  }

  private pruneOldEntries() {
    const cutoff = Date.now() - WINDOW_SIZE;
    while (this.requests.length > 0 && this.requests[0].timestamp < cutoff) {
      this.requests.shift();
    }
  }

  getApiLatencyP50(): number {
    if (this.requests.length === 0) return 0;
    const sorted = this.requests.map((r) => r.responseTime).sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length * 0.5)] || 0;
  }

  getApiLatencyP95(): number {
    if (this.requests.length === 0) return 0;
    const sorted = this.requests.map((r) => r.responseTime).sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length * 0.95)] || 0;
  }

  getApiLatencyP99(): number {
    if (this.requests.length === 0) return 0;
    const sorted = this.requests.map((r) => r.responseTime).sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length * 0.99)] || 0;
  }

  getErrorRate(): number {
    if (this.requests.length === 0) return 0;
    const errors = this.requests.filter((r) => r.statusCode >= 500).length;
    return (errors / this.requests.length) * 100;
  }

  getThroughput(): number {
    this.pruneOldEntries();
    const windowSec = Math.min(WINDOW_SIZE, Date.now() - this.startTime) / 1000;
    if (windowSec <= 0) return 0;
    return (this.requests.length / windowSec) * 3600;
  }

  getRequestCount(): number {
    return this.requests.length;
  }

  get4xxRate(): number {
    if (this.requests.length === 0) return 0;
    const clientErrors = this.requests.filter((r) => r.statusCode >= 400 && r.statusCode < 500).length;
    return (clientErrors / this.requests.length) * 100;
  }

  getAvgResponseTime(): number {
    if (this.requests.length === 0) return 0;
    const total = this.requests.reduce((s, r) => s + r.responseTime, 0);
    return total / this.requests.length;
  }

  getUptimeSeconds(): number {
    return (Date.now() - this.startTime) / 1000;
  }

  getSnapshot() {
    this.pruneOldEntries();
    return {
      requestCount: this.requests.length,
      avgResponseTime: this.getAvgResponseTime(),
      p50Latency: this.getApiLatencyP50(),
      p95Latency: this.getApiLatencyP95(),
      p99Latency: this.getApiLatencyP99(),
      errorRate: this.getErrorRate(),
      clientErrorRate: this.get4xxRate(),
      throughputPerHour: this.getThroughput(),
      uptimeSeconds: this.getUptimeSeconds(),
      windowMs: WINDOW_SIZE,
    };
  }
}

export interface WebVitalsReport {
  appSlug: string;
  lcp?: number;
  fid?: number;
  cls?: number;
  fcp?: number;
  ttfb?: number;
  inp?: number;
  timestamp: number;
  userAgent?: string;
  pathname?: string;
}

const MAX_VITALS = 500;

export class ClientTelemetryCollector {
  private vitals: WebVitalsReport[] = [];

  recordVitals(report: WebVitalsReport) {
    this.vitals.push(report);
    if (this.vitals.length > MAX_VITALS) {
      this.vitals.splice(0, this.vitals.length - MAX_VITALS);
    }
  }

  getVitalsForApp(appSlug: string): WebVitalsReport[] {
    return this.vitals.filter((v) => v.appSlug === appSlug);
  }

  getAggregatedVitals(appSlug?: string) {
    const data = appSlug ? this.getVitalsForApp(appSlug) : this.vitals;
    if (data.length === 0) return null;

    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : null;

    return {
      count: data.length,
      lcp: avg(data.filter((v) => v.lcp != null).map((v) => v.lcp!)),
      fid: avg(data.filter((v) => v.fid != null).map((v) => v.fid!)),
      cls: avg(data.filter((v) => v.cls != null).map((v) => v.cls!)),
      fcp: avg(data.filter((v) => v.fcp != null).map((v) => v.fcp!)),
      ttfb: avg(data.filter((v) => v.ttfb != null).map((v) => v.ttfb!)),
      inp: avg(data.filter((v) => v.inp != null).map((v) => v.inp!)),
    };
  }
}

export const serverTelemetry = new ServerTelemetryCollector();
export const clientTelemetry = new ClientTelemetryCollector();
