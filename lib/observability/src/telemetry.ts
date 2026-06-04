

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
  severity: 'warning' | 'critical';
  triggeredAt: number;
  resolvedAt?: number;
  resolved: boolean;
  metadata?: Record<string, unknown>;
}

const WINDOW_SIZE = 300_000;

const MAX_BUSINESS_EVENTS = 1000;
const MAX_ALERTS = 50;
const MAX_APM_SPANS = 500;
const MAX_EXTERNAL_CALLS = 200;
const MAX_REQUESTS = 2000;

export interface ApmSpan {
  route: string;
  method: string;
  statusCode: number;
  totalMs: number;
  dbQueryMs: number;
  externalApiMs: number;
  serializationMs: number;
  timestamp: number;
  correlationId?: string;
}

export interface TenantIsolationViolation {
  timestamp: number;
  userId?: number | null;
  userOrgIds: number[];
  attemptedOrgId: number | null;
  path?: string;
  method?: string;
  reason: string;
}

export interface ExternalCallRecord {
  provider: string;
  durationMs: number;
  timestamp: number;
  success?: boolean;
}

export class ServerTelemetryCollector {
  private requests: RequestTelemetry[] = [];
  private errorCounts = new Map<string, number>();
  private startTime = Date.now();
  private businessEvents: BusinessEvent[] = [];
  private activeAlerts: AlertRecord[] = [];
  private authFailureCount = 0;
  private authFailureTimestamps: number[] = [];
  private tenantIsolationViolations: TenantIsolationViolation[] = [];
  private retryCount = 0;
  private dbQueryLatencies: Array<{ durationMs: number; timestamp: number; query?: string }> = [];
  private apmSpans: ApmSpan[] = [];
  private externalCalls: ExternalCallRecord[] = [];

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
    while (this.requests.length > 0 && this.requests[0]?.timestamp < cutoff) {
      this.requests.shift();
    }
    if (this.requests.length > MAX_REQUESTS) {
      this.requests.splice(0, this.requests.length - MAX_REQUESTS);
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
    const clientErrors = this.requests.filter(
      (r) => r.statusCode >= 400 && r.statusCode < 500,
    ).length;
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

  recordAuthFailure() {
    this.authFailureCount++;
    const now = Date.now();
    this.authFailureTimestamps.push(now);
    const cutoff = now - WINDOW_SIZE;
    while (this.authFailureTimestamps.length > 0 && this.authFailureTimestamps[0]! < cutoff) {
      this.authFailureTimestamps.shift();
    }
  }

  /**
   * Returns the auth failure rate per minute, averaged over the recent window.
   * Backed by the same rolling window used for HTTP request telemetry.
   */
  getAuthFailureRatePerMin(): number {
    const now = Date.now();
    const cutoff = now - WINDOW_SIZE;
    while (this.authFailureTimestamps.length > 0 && this.authFailureTimestamps[0]! < cutoff) {
      this.authFailureTimestamps.shift();
    }
    const windowMin = WINDOW_SIZE / 60_000;
    if (windowMin <= 0) return 0;
    return this.authFailureTimestamps.length / windowMin;
  }

  recordTenantIsolationViolation(details: Omit<TenantIsolationViolation, 'timestamp'>) {
    const entry: TenantIsolationViolation = { ...details, timestamp: Date.now() };
    this.tenantIsolationViolations.push(entry);
    // Cap at the same window the rest of the collector uses; keep generous tail
    // so the self-monitor can pick up bursts even on a slightly delayed cycle.
    const cutoff = Date.now() - WINDOW_SIZE;
    while (
      this.tenantIsolationViolations.length > 0 &&
      this.tenantIsolationViolations[0]?.timestamp < cutoff
    ) {
      this.tenantIsolationViolations.shift();
    }
    if (this.tenantIsolationViolations.length > 500) {
      this.tenantIsolationViolations.splice(0, this.tenantIsolationViolations.length - 500);
    }
  }

  /**
   * Returns tenant isolation violations recorded since the given timestamp.
   * The self-monitor uses this to fire an immediate alert on any new
   * occurrence between polling cycles.
   */
  getTenantIsolationViolationsSince(sinceTimestamp: number): TenantIsolationViolation[] {
    return this.tenantIsolationViolations.filter((v) => v.timestamp > sinceTimestamp);
  }

  getTenantIsolationViolationCount(): number {
    return this.tenantIsolationViolations.length;
  }

  recordRetry() {
    this.retryCount++;
  }

  recordDbQueryLatency(durationMs: number, query?: string) {
    const querySlice = query?.slice(0, 120);
    this.dbQueryLatencies.push({
      durationMs,
      timestamp: Date.now(),
      ...(querySlice !== undefined ? { query: querySlice } : {}),
    });
    const MAX_DB_SAMPLES = 500;
    if (this.dbQueryLatencies.length > MAX_DB_SAMPLES) {
      this.dbQueryLatencies.splice(0, this.dbQueryLatencies.length - MAX_DB_SAMPLES);
    }
  }

  recordDbQuery(data: { durationMs: number; query?: string; timestamp: number }) {
    this.recordDbQueryLatency(data.durationMs, data.query);
  }

  recordApmSpan(span: ApmSpan) {
    this.apmSpans.push(span);
    if (this.apmSpans.length > MAX_APM_SPANS) {
      this.apmSpans.splice(0, this.apmSpans.length - MAX_APM_SPANS);
    }
  }

  recordExternalCall(call: ExternalCallRecord) {
    this.externalCalls.push(call);
    if (this.externalCalls.length > MAX_EXTERNAL_CALLS) {
      this.externalCalls.splice(0, this.externalCalls.length - MAX_EXTERNAL_CALLS);
    }
  }

  getApmSpans(windowMs = WINDOW_SIZE): ApmSpan[] {
    const cutoff = Date.now() - windowMs;
    return this.apmSpans.filter((s) => s.timestamp >= cutoff);
  }

  getApmLatencyBreakdown(windowMs = WINDOW_SIZE): {
    routes: Array<{
      route: string;
      avgTotal: number;
      avgDb: number;
      avgExternal: number;
      avgSerialization: number;
      count: number;
      p99: number;
    }>;
    overallP50: number;
    overallP95: number;
    overallP99: number;
    avgDbFraction: number;
    avgExternalFraction: number;
  } {
    const spans = this.getApmSpans(windowMs);
    if (spans.length === 0) {
      return {
        routes: [],
        overallP50: 0,
        overallP95: 0,
        overallP99: 0,
        avgDbFraction: 0,
        avgExternalFraction: 0,
      };
    }

    const byRoute = new Map<string, ApmSpan[]>();
    for (const s of spans) {
      const key = `${s.method} ${s.route}`;
      if (!byRoute.has(key)) byRoute.set(key, []);
      byRoute.get(key)?.push(s);
    }

    const routes = Array.from(byRoute.entries())
      .map(([route, ss]) => {
        const sorted = ss.map((s) => s.totalMs).sort((a, b) => a - b);
        const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;
        return {
          route,
          avgTotal: avg(ss.map((s) => s.totalMs)),
          avgDb: avg(ss.map((s) => s.dbQueryMs)),
          avgExternal: avg(ss.map((s) => s.externalApiMs)),
          avgSerialization: avg(ss.map((s) => s.serializationMs)),
          count: ss.length,
          p99: sorted[Math.floor(sorted.length * 0.99)] ?? sorted[sorted.length - 1] ?? 0,
        };
      })
      .sort((a, b) => b.avgTotal - a.avgTotal);

    const allTotals = spans.map((s) => s.totalMs).sort((a, b) => a - b);
    const p = (pct: number) => allTotals[Math.floor(allTotals.length * pct)] ?? 0;
    const totalDb = spans.reduce((s, sp) => s + sp.dbQueryMs, 0);
    const totalExt = spans.reduce((s, sp) => s + sp.externalApiMs, 0);
    const totalAll = spans.reduce((s, sp) => s + sp.totalMs, 0) || 1;

    return {
      routes: routes.slice(0, 20),
      overallP50: p(0.5),
      overallP95: p(0.95),
      overallP99: p(0.99),
      avgDbFraction: (totalDb / totalAll) * 100,
      avgExternalFraction: (totalExt / totalAll) * 100,
    };
  }

  getExternalCallStats(
    windowMs = WINDOW_SIZE,
  ): Record<string, { count: number; avgMs: number; p99Ms: number }> {
    const cutoff = Date.now() - windowMs;
    const recent = this.externalCalls.filter((c) => c.timestamp >= cutoff);
    const byProvider = new Map<string, number[]>();
    for (const c of recent) {
      if (!byProvider.has(c.provider)) byProvider.set(c.provider, []);
      byProvider.get(c.provider)?.push(c.durationMs);
    }
    const result: Record<string, { count: number; avgMs: number; p99Ms: number }> = {};
    for (const [provider, durations] of byProvider) {
      const sorted = [...durations].sort((a, b) => a - b);
      result[provider] = {
        count: durations.length,
        avgMs: durations.reduce((s, v) => s + v, 0) / durations.length,
        p99Ms: sorted[Math.floor(sorted.length * 0.99)] ?? sorted[sorted.length - 1] ?? 0,
      };
    }
    return result;
  }

  getDbLatencyP50(): number {
    if (this.dbQueryLatencies.length === 0) return 0;
    const sorted = [...this.dbQueryLatencies].map((r) => r.durationMs).sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length * 0.5)] ?? 0;
  }

  getDbLatencyP95(): number {
    if (this.dbQueryLatencies.length === 0) return 0;
    const sorted = [...this.dbQueryLatencies].map((r) => r.durationMs).sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length * 0.95)] ?? 0;
  }

  getDbSlowQueryCount(thresholdMs = 500): number {
    return this.dbQueryLatencies.filter((r) => r.durationMs >= thresholdMs).length;
  }

  recordBusinessEvent(event: Omit<BusinessEvent, 'timestamp'>) {
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
    return this.businessEvents.filter((e) => e.timestamp >= cutoff && e.type === 'job_failed')
      .length;
  }

  getWorkflowCompletionCount(windowMs = WINDOW_SIZE): number {
    const cutoff = Date.now() - windowMs;
    return this.businessEvents.filter(
      (e) => e.timestamp >= cutoff && e.type === 'workflow_completed',
    ).length;
  }

  raiseAlert(alert: Omit<AlertRecord, 'id' | 'triggeredAt' | 'resolved'>) {
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
      authFailures: this.authFailureCount,
      authFailureRatePerMin: this.getAuthFailureRatePerMin(),
      tenantIsolationViolations: this.tenantIsolationViolations.length,
      retryCount: this.retryCount,
      dbLatency: {
        p50: this.getDbLatencyP50(),
        p95: this.getDbLatencyP95(),
        slowQueryCount: this.getDbSlowQueryCount(),
        sampleCount: this.dbQueryLatencies.length,
      },
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

    const avg = (arr: number[]) =>
      arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : null;

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
