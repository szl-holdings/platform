import { logger } from "./logger";
import { pool } from "@szl-holdings/db";
import { serverTelemetry } from "@szl-holdings/observability";

export interface NormalizedSignal {
  source: "datadog" | "pagerduty" | "sentry" | "cloudwatch" | "synthetic";
  externalId: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  status: "open" | "resolved" | "acknowledged";
  environment: string;
  service?: string;
  owner?: string;
  url?: string;
  tags: string[];
  occurredAt: string;
  resolvedAt?: string;
  rawData: unknown;
}

export interface EscalationChainResult {
  signalId: string;
  severity: string;
  escalated: boolean;
  reason: string;
  notifiedChannels: string[];
}

async function ensureSignalTables(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS lyte_normalized_signals (
      id BIGSERIAL PRIMARY KEY,
      source TEXT NOT NULL,
      external_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      severity TEXT NOT NULL,
      status TEXT NOT NULL,
      environment TEXT NOT NULL DEFAULT 'production',
      service TEXT,
      owner TEXT,
      url TEXT,
      tags JSONB DEFAULT '[]',
      occurred_at TIMESTAMPTZ NOT NULL,
      resolved_at TIMESTAMPTZ,
      raw_data JSONB,
      ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(source, external_id)
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_lyte_signals_severity ON lyte_normalized_signals(severity);
    CREATE INDEX IF NOT EXISTS idx_lyte_signals_status ON lyte_normalized_signals(status);
    CREATE INDEX IF NOT EXISTS idx_lyte_signals_occurred ON lyte_normalized_signals(occurred_at DESC);
    CREATE INDEX IF NOT EXISTS idx_lyte_signals_source ON lyte_normalized_signals(source);
  `);
}

async function fetchDatadogAlerts(): Promise<NormalizedSignal[]> {
  const apiKey = process.env["DATADOG_API_KEY"];
  const appKey = process.env["DATADOG_APP_KEY"];

  if (!apiKey || !appKey) {
    logger.debug("Datadog credentials not configured — skipping live fetch");
    return [];
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(
      "https://api.datadoghq.com/api/v1/monitor?with_downtimes=false&page=0&page_size=25&monitor_tags=env:production",
      {
        headers: {
          "DD-API-KEY": apiKey,
          "DD-APPLICATION-KEY": appKey,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      }
    );

    if (!res.ok) {
      logger.warn({ status: res.status }, "Datadog API fetch failed");
      return [];
    }

    const monitors = (await res.json()) as Array<Record<string, unknown>>;
    const signals: NormalizedSignal[] = [];

    for (const monitor of monitors) {
      const overallState = String(monitor.overall_state ?? "").toLowerCase();
      if (overallState === "ok" || overallState === "no data") continue;

      const severity: NormalizedSignal["severity"] =
        overallState === "alert" ? "critical" :
        overallState === "warn" ? "high" : "medium";

      signals.push({
        source: "datadog",
        externalId: String(monitor.id ?? ""),
        title: String(monitor.name ?? "Datadog Monitor Alert"),
        description: String(monitor.message ?? ""),
        severity,
        status: "open",
        environment: "production",
        service: extractTagValue(monitor.tags as string[], "service"),
        owner: extractTagValue(monitor.tags as string[], "team"),
        url: `https://app.datadoghq.com/monitors/${monitor.id}`,
        tags: (monitor.tags as string[]) ?? [],
        occurredAt: new Date().toISOString(),
        rawData: monitor,
      });
    }

    logger.info({ count: signals.length }, "Datadog alerts fetched");
    return signals;
  } catch (err) {
    logger.warn({ err }, "Datadog fetch error");
    return [];
  } finally {
    clearTimeout(timer);
  }
}

async function fetchPagerDutyIncidents(): Promise<NormalizedSignal[]> {
  const apiKey = process.env["PAGERDUTY_API_KEY"];

  if (!apiKey) {
    logger.debug("PagerDuty API key not configured — skipping live fetch");
    return [];
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(
      "https://api.pagerduty.com/incidents?statuses[]=triggered&statuses[]=acknowledged&limit=25&sort_by=created_at:desc",
      {
        headers: {
          "Authorization": `Token token=${apiKey}`,
          "Accept": "application/vnd.pagerduty+json;version=2",
        },
        signal: controller.signal,
      }
    );

    if (!res.ok) {
      logger.warn({ status: res.status }, "PagerDuty API fetch failed");
      return [];
    }

    const data = (await res.json()) as { incidents?: Array<Record<string, unknown>> };
    const incidents = data.incidents ?? [];
    const signals: NormalizedSignal[] = [];

    for (const incident of incidents) {
      const urgency = String(incident.urgency ?? "").toLowerCase();
      const severity: NormalizedSignal["severity"] = urgency === "high" ? "critical" : "high";
      const pdStatus = String(incident.status ?? "").toLowerCase();

      signals.push({
        source: "pagerduty",
        externalId: String(incident.id ?? ""),
        title: String(incident.title ?? "PagerDuty Incident"),
        description: String(incident.description ?? incident.summary ?? ""),
        severity,
        status: pdStatus === "resolved" ? "resolved" : pdStatus === "acknowledged" ? "acknowledged" : "open",
        environment: "production",
        service: (incident.service as Record<string, unknown>)?.summary as string ?? undefined,
        url: String(incident.html_url ?? ""),
        tags: ["pagerduty"],
        occurredAt: String(incident.created_at ?? new Date().toISOString()),
        resolvedAt: incident.resolved_at ? String(incident.resolved_at) : undefined,
        rawData: incident,
      });
    }

    logger.info({ count: signals.length }, "PagerDuty incidents fetched");
    return signals;
  } catch (err) {
    logger.warn({ err }, "PagerDuty fetch error");
    return [];
  } finally {
    clearTimeout(timer);
  }
}

async function fetchSentryIssues(): Promise<NormalizedSignal[]> {
  const authToken = process.env["SENTRY_AUTH_TOKEN"];
  const orgSlug = process.env["SENTRY_ORG"] ?? "";
  const projectSlug = process.env["SENTRY_PROJECT"] ?? "";

  if (!authToken || !orgSlug) {
    logger.debug("Sentry credentials not configured — skipping live fetch");
    return [];
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const projectFilter = projectSlug ? `project=${projectSlug}&` : "";
    const res = await fetch(
      `https://sentry.io/api/0/organizations/${orgSlug}/issues/?${projectFilter}is:unresolved&limit=25&sort=date`,
      {
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      }
    );

    if (!res.ok) {
      logger.warn({ status: res.status }, "Sentry API fetch failed");
      return [];
    }

    const issues = (await res.json()) as Array<Record<string, unknown>>;
    const signals: NormalizedSignal[] = [];

    for (const issue of issues) {
      const level = String(issue.level ?? "error").toLowerCase();
      const severity: NormalizedSignal["severity"] =
        level === "fatal" ? "critical" :
        level === "error" ? "high" :
        level === "warning" ? "medium" : "low";

      signals.push({
        source: "sentry",
        externalId: String(issue.id ?? ""),
        title: String(issue.title ?? "Sentry Issue"),
        description: String(issue.culprit ?? (issue.metadata as Record<string, unknown> | undefined)?.["value"] ?? ""),
        severity,
        status: issue.status === "resolved" ? "resolved" : "open",
        environment: String(
          Array.isArray(issue.environments) && issue.environments.length > 0
            ? issue.environments[0]
            : "production"
        ),
        service: String((issue.project as Record<string, unknown> | undefined)?.["slug"] ?? projectSlug ?? ""),
        url: String(issue.permalink ?? ""),
        tags: (issue.tags as string[]) ?? [],
        occurredAt: String(issue.firstSeen ?? new Date().toISOString()),
        rawData: issue,
      });
    }

    logger.info({ count: signals.length }, "Sentry issues fetched");
    return signals;
  } catch (err) {
    logger.warn({ err }, "Sentry fetch error");
    return [];
  } finally {
    clearTimeout(timer);
  }
}

function extractTagValue(tags: string[] | undefined, key: string): string | undefined {
  if (!Array.isArray(tags)) return undefined;
  const tag = tags.find(t => t.startsWith(`${key}:`));
  return tag ? tag.split(":").slice(1).join(":") : undefined;
}

async function upsertSignal(signal: NormalizedSignal): Promise<boolean> {
  const result = await pool.query(
    `INSERT INTO lyte_normalized_signals
     (source, external_id, title, description, severity, status, environment,
      service, owner, url, tags, occurred_at, resolved_at, raw_data, ingested_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW())
     ON CONFLICT (source, external_id) DO UPDATE SET
       title = EXCLUDED.title,
       description = EXCLUDED.description,
       severity = EXCLUDED.severity,
       status = EXCLUDED.status,
       resolved_at = EXCLUDED.resolved_at,
       raw_data = EXCLUDED.raw_data
     RETURNING (xmax = 0) AS inserted`,
    [
      signal.source,
      signal.externalId,
      signal.title,
      signal.description,
      signal.severity,
      signal.status,
      signal.environment,
      signal.service ?? null,
      signal.owner ?? null,
      signal.url ?? null,
      JSON.stringify(signal.tags),
      signal.occurredAt,
      signal.resolvedAt ?? null,
      JSON.stringify(signal.rawData),
    ]
  );
  return result.rows[0]?.inserted === true;
}

const ESCALATION_THRESHOLDS = {
  critical: { minCount: 1, windowMinutes: 60 },
  high: { minCount: 3, windowMinutes: 60 },
  medium: { minCount: 10, windowMinutes: 60 },
};

async function runEscalationChains(signals: NormalizedSignal[]): Promise<EscalationChainResult[]> {
  const results: EscalationChainResult[] = [];
  const criticalSignals = signals.filter(s => s.severity === "critical" && s.status === "open");
  const highSignals = signals.filter(s => s.severity === "high" && s.status === "open");

  for (const signal of criticalSignals) {
    logger.warn({
      source: signal.source,
      externalId: signal.externalId,
      title: signal.title,
    }, "CRITICAL signal escalation triggered");

    serverTelemetry.raiseAlert({
      type: "critical_signal_escalation",
      message: `CRITICAL: ${signal.source.toUpperCase()} — ${signal.title}`,
      severity: "critical",
      metadata: {
        source: signal.source,
        externalId: signal.externalId,
        url: signal.url,
        service: signal.service,
      },
    });

    results.push({
      signalId: `${signal.source}:${signal.externalId}`,
      severity: "critical",
      escalated: true,
      reason: "Critical severity threshold — immediate escalation",
      notifiedChannels: ["platform-alert", "lyte-metrics"],
    });
  }

  if (highSignals.length >= ESCALATION_THRESHOLDS.high.minCount) {
    logger.warn({ count: highSignals.length }, "High signal count escalation triggered");

    serverTelemetry.raiseAlert({
      type: "high_signal_cluster",
      message: `${highSignals.length} HIGH severity signals detected across monitoring sources`,
      severity: "warning",
      metadata: {
        count: highSignals.length,
        sources: [...new Set(highSignals.map(s => s.source))],
      },
    });

    results.push({
      signalId: `cluster:high:${Date.now()}`,
      severity: "high",
      escalated: true,
      reason: `${highSignals.length} high-severity signals exceed threshold of ${ESCALATION_THRESHOLDS.high.minCount}`,
      notifiedChannels: ["platform-alert"],
    });
  }

  return results;
}

export async function runSignalNormalization(): Promise<{
  fetched: number;
  inserted: number;
  updated: number;
  criticalCount: number;
  highCount: number;
  escalations: number;
  sources: Record<string, number>;
  demoMode: boolean;
}> {
  await ensureSignalTables();

  const [datadogSignals, pagerdutySignals, sentrySignals] = await Promise.all([
    fetchDatadogAlerts(),
    fetchPagerDutyIncidents(),
    fetchSentryIssues(),
  ]);

  const allSignals = [...datadogSignals, ...pagerdutySignals, ...sentrySignals];

  const demoMode = allSignals.length === 0;

  let fetched = allSignals.length;
  let inserted = 0;
  let updated = 0;
  let criticalCount = 0;
  let highCount = 0;

  for (const signal of allSignals) {
    const wasInserted = await upsertSignal(signal);
    if (wasInserted) inserted++;
    else updated++;
    if (signal.severity === "critical") criticalCount++;
    if (signal.severity === "high") highCount++;
  }

  const escalations = await runEscalationChains(allSignals);

  const sources: Record<string, number> = {};
  for (const s of allSignals) {
    sources[s.source] = (sources[s.source] ?? 0) + 1;
  }

  logger.info({
    fetched,
    inserted,
    updated,
    criticalCount,
    highCount,
    escalations: escalations.length,
    demoMode,
    sources,
  }, "Signal normalization complete");

  return {
    fetched,
    inserted,
    updated,
    criticalCount,
    highCount,
    escalations: escalations.length,
    sources,
    demoMode,
  };
}

export async function getSignalSummary(): Promise<{
  total: number;
  bySeverity: Record<string, number>;
  bySource: Record<string, number>;
  openCount: number;
  criticalOpen: number;
}> {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'open') as open_count,
        COUNT(*) FILTER (WHERE severity = 'critical' AND status = 'open') as critical_open,
        json_object_agg(severity, cnt) FILTER (WHERE severity IS NOT NULL) as by_severity,
        json_object_agg(source, src_cnt) FILTER (WHERE source IS NOT NULL) as by_source
      FROM (
        SELECT severity, source, status,
               COUNT(*) OVER (PARTITION BY severity) as cnt,
               COUNT(*) OVER (PARTITION BY source) as src_cnt
        FROM lyte_normalized_signals
        WHERE occurred_at > NOW() - INTERVAL '24 hours'
      ) sub
    `);

    const row = result.rows[0] ?? {};
    return {
      total: parseInt(row.total ?? "0"),
      bySeverity: row.by_severity ?? {},
      bySource: row.by_source ?? {},
      openCount: parseInt(row.open_count ?? "0"),
      criticalOpen: parseInt(row.critical_open ?? "0"),
    };
  } catch {
    return { total: 0, bySeverity: {}, bySource: {}, openCount: 0, criticalOpen: 0 };
  }
}
