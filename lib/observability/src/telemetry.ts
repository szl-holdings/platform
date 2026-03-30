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

export interface BusinessEvent {
  type: string;
  domain?: string;
  count?: number;
  durationMs?: number;
  success?: boolean;
  severity?: string;
  metadata?: Record<string, unknown>;
  timestamp: number;
}

export interface AlertRecord {
  id: string;
  type: string;
  message: string;
  severity: "warning" | "critical";
  triggeredAt: number;
  resolvedAt?: number;
  resolved: boolean;
  metadata?: Record<string, unknown>;
}

const WINDOW_SIZE = 300_000;

const MAX_BUSINESS_EVENTS = 1000;
const MAX_ALERTS = 50;

export class ServerTelemetryCollector {
  private requests: RequestTelemetry[] = [];
  private errorCounts = new Map<string, number>();
  private startTime = Date.now();
  private businessEvents: BusinessEvent[] = [];
  private activeAlerts: AlertRecord[] = [];

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

  recordBusinessEvent(event: Omit<BusinessEvent, "timestamp">) {
    this.businessEvents.push({ ...event, timestamp: Date.now() });
    if (this.businessEvents.length > MAX_BUSINESS_EVENTS) {
      this.businessEvents.splice(0, this.businessEvents.length - MAX_BUSINESS_EVENTS);
    }
  }

  getBusinessEventCounts(windowMs = WINDOW_SIZE): Record<string, number> {
    const cutoff = Date.now() - windowMs;
    const counts: Record<string, number> = {};
    for (const event of this.businessEvents) {
      if (event.timestamp >= cutoff) {
        counts[event.type] = (counts[event.type] ?? 0) + 1;
      }
    }
    return counts;
  }

  getBusinessEventsByDomain(windowMs = WINDOW_SIZE): Record<string, number> {
    const cutoff = Date.now() - windowMs;
    const counts: Record<string, number> = {};
    for (const event of this.businessEvents) {
      if (event.timestamp >= cutoff && event.domain) {
        counts[event.domain] = (counts[event.domain] ?? 0) + 1;
      }
    }
    return counts;
  }

  getJobFailureCount(windowMs = WINDOW_SIZE): number {
    const cutoff = Date.now() - windowMs;
    return this.businessEvents.filter(
      (e) => e.timestamp >= cutoff && e.type === "job_failed"
    ).length;
  }

  getWorkflowCompletionCount(windowMs = WINDOW_SIZE): number {
    const cutoff = Date.now() - windowMs;
    return this.businessEvents.filter(
      (e) => e.timestamp >= cutoff && e.type === "workflow_completed"
    ).length;
  }

  raiseAlert(alert: Omit<AlertRecord, "id" | "triggeredAt" | "resolved">) {
    const id = `alert_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    this.activeAlerts.unshift({ ...alert, id, triggeredAt: Date.now(), resolved: false });
    if (this.activeAlerts.length > MAX_ALERTS) {
      this.activeAlerts.length = MAX_ALERTS;
    }
    return id;
  }

  resolveAlert(id: string) {
    const alert = this.activeAlerts.find((a) => a.id === id);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
    }
  }

  getActiveAlerts(): AlertRecord[] {
    return this.activeAlerts.filter((a) => !a.resolved);
  }

  getAllAlerts(): AlertRecord[] {
    return [...this.activeAlerts];
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
      businessEvents: this.getBusinessEventCounts(),
      eventsByDomain: this.getBusinessEventsByDomain(),
      jobFailures: this.getJobFailureCount(),
      workflowCompletions: this.getWorkflowCompletionCount(),
      activeAlerts: this.getActiveAlerts().length,
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
