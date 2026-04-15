import type { AnalyticsEvent, AnalyticsMetricSnapshot, AnalyticsAnomaly } from "@szl-holdings/db";

// ---------------------------------------------------------------------------
// Export format types
// ---------------------------------------------------------------------------

export type ExportFormat = "csv" | "json" | "parquet";

export interface ExportOptions {
  format: ExportFormat;
  domain: string;
  exportType: "events" | "metric_snapshots" | "funnel" | "cohort" | "anomalies";
  filterParams?: Record<string, unknown>;
  from?: Date;
  to?: Date;
  maxRows?: number;
}

// ---------------------------------------------------------------------------
// CSV serialization
// ---------------------------------------------------------------------------

function toCSVRow(row: Record<string, unknown>): string {
  return Object.values(row)
    .map(val => {
      if (val === null || val === undefined) return "";
      const str = typeof val === "object" ? JSON.stringify(val) : String(val);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    })
    .join(",");
}

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]!).join(",");
  const body = rows.map(toCSVRow).join("\n");
  return `${headers}\n${body}`;
}

// ---------------------------------------------------------------------------
// JSON Lines serialization
// ---------------------------------------------------------------------------

function toJSONLines(rows: Record<string, unknown>[]): string {
  return rows.map(row => JSON.stringify(row)).join("\n");
}

// ---------------------------------------------------------------------------
// Parquet-like serialization (column-oriented JSON for downstream tools)
// ---------------------------------------------------------------------------

function toParquetJSON(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return JSON.stringify({ schema: [], rows: 0, columns: {} });
  const schema = Object.keys(rows[0]!).map(key => ({ name: key, type: inferType(rows[0]![key]) }));
  const columns: Record<string, unknown[]> = {};
  for (const col of schema) {
    columns[col.name] = rows.map(r => r[col.name] ?? null);
  }
  return JSON.stringify({ schema, rows: rows.length, columns }, null, 2);
}

function inferType(value: unknown): string {
  if (typeof value === "number") return "float64";
  if (typeof value === "boolean") return "bool";
  if (value instanceof Date) return "timestamp";
  if (typeof value === "object") return "json";
  return "string";
}

// ---------------------------------------------------------------------------
// Event export serialization
// ---------------------------------------------------------------------------

export function serializeAnalyticsEvents(events: AnalyticsEvent[], format: ExportFormat): string {
  const rows: Record<string, unknown>[] = events.map(e => ({
    id: e.id,
    eventId: e.eventId,
    eventName: e.eventName,
    domain: e.domain,
    sourceApp: e.sourceApp,
    sessionId: e.sessionId,
    userId: e.userId,
    organizationId: e.organizationId,
    tenantId: e.tenantId,
    deviceType: e.deviceType,
    platform: e.platform,
    url: e.url,
    country: e.country,
    numericValue: e.numericValue,
    properties: JSON.stringify(e.properties),
    dimensions: JSON.stringify(e.dimensions),
    occurredAt: e.occurredAt?.toISOString(),
    serverSide: e.serverSide,
  }));

  return serialize(rows, format);
}

// ---------------------------------------------------------------------------
// Metric snapshot export serialization
// ---------------------------------------------------------------------------

export function serializeMetricSnapshots(snapshots: AnalyticsMetricSnapshot[], format: ExportFormat): string {
  const rows: Record<string, unknown>[] = snapshots.map(s => ({
    id: s.id,
    metricId: s.metricId,
    granularity: s.granularity,
    periodStart: s.periodStart?.toISOString(),
    periodEnd: s.periodEnd?.toISOString(),
    value: s.value,
    sampleCount: s.sampleCount,
    dimensions: JSON.stringify(s.dimensions),
    domain: s.domain,
    computedAt: s.computedAt?.toISOString(),
  }));

  return serialize(rows, format);
}

// ---------------------------------------------------------------------------
// Anomaly export serialization
// ---------------------------------------------------------------------------

export function serializeAnomalies(anomalies: AnalyticsAnomaly[], format: ExportFormat): string {
  const rows: Record<string, unknown>[] = anomalies.map(a => ({
    anomalyId: a.anomalyId,
    metricId: a.metricId,
    domain: a.domain,
    anomalyType: a.anomalyType,
    severity: a.severity,
    detectedAt: a.detectedAt?.toISOString(),
    periodStart: a.periodStart?.toISOString(),
    observedValue: a.observedValue,
    expectedValue: a.expectedValue,
    deviationPercent: a.deviationPercent,
    zScore: a.zScore,
    potentialCauses: JSON.stringify(a.potentialCauses),
    isResolved: a.isResolved,
    resolvedAt: a.resolvedAt?.toISOString(),
  }));

  return serialize(rows, format);
}

// ---------------------------------------------------------------------------
// Generic serializer
// ---------------------------------------------------------------------------

export function serialize(rows: Record<string, unknown>[], format: ExportFormat): string {
  switch (format) {
    case "csv": return toCSV(rows);
    case "json": return toJSONLines(rows);
    case "parquet": return toParquetJSON(rows);
  }
}

// ---------------------------------------------------------------------------
// Content-type helpers
// ---------------------------------------------------------------------------

export function getContentType(format: ExportFormat): string {
  switch (format) {
    case "csv": return "text/csv";
    case "json": return "application/x-ndjson";
    case "parquet": return "application/json";
  }
}

export function getFileExtension(format: ExportFormat): string {
  switch (format) {
    case "csv": return ".csv";
    case "json": return ".jsonl";
    case "parquet": return ".json";
  }
}

// ---------------------------------------------------------------------------
// Scheduled export planning
// ---------------------------------------------------------------------------

export interface ScheduledExportJob {
  exportId: string;
  domain: string;
  exportType: string;
  format: ExportFormat;
  scheduleFrequency: "daily" | "weekly" | "monthly";
  filterParams: Record<string, unknown>;
  webhookUrl?: string;
}

export function computeNextRunAt(frequency: "once" | "daily" | "weekly" | "monthly"): Date | null {
  const now = new Date();
  switch (frequency) {
    case "once": return null;
    case "daily": {
      const next = new Date(now);
      next.setDate(next.getDate() + 1);
      next.setHours(2, 0, 0, 0);
      return next;
    }
    case "weekly": {
      const next = new Date(now);
      next.setDate(next.getDate() + 7);
      next.setHours(2, 0, 0, 0);
      return next;
    }
    case "monthly": {
      const next = new Date(now);
      next.setMonth(next.getMonth() + 1);
      next.setDate(1);
      next.setHours(2, 0, 0, 0);
      return next;
    }
  }
}
