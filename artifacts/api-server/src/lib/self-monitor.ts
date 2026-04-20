import { db, lyteSignalsTable, getLongRunningCheckouts, getCheckoutWarnThresholdMs } from "@szl-holdings/db";
import { lt, sql } from "drizzle-orm";
import { LRUCache } from "lru-cache";
import { publish, WS_CHANNELS } from "./websocket";
import { logger } from "./logger";
import { sendEmail, hasEmailProviderConfigured } from "./email";
import { serverTelemetry } from "@szl-holdings/observability";
import {
  startRemediation,
  advanceRemediation,
  completeRemediation,
  failRemediation,
  hasActiveRun,
  isExecutionExpired,
  listActiveRuns,
  ensurePatternsSeeded,
  recoverActiveRuns,
} from "./self-healing-runtime";

const POLL_INTERVAL_MS = 5 * 60_000;
const SIGNAL_COOLDOWN_MS = 10 * 60_000;
const AUTH_FAILURE_RATE_THRESHOLD_PER_MIN = 10;
const DB_POOL_SATURATION_PCT = 80;
let lastTenantViolationCheckAt = Date.now();
// OBS-007: track consecutive cycles where DB pool usage exceeded the
// threshold so we only alert after sustained pressure (avoids paging on a
// single transient burst).
let dbPoolHighCycles = 0;
const SIGNAL_MAX_AGE_DAYS = 30;
const SIGNAL_MAX_COUNT = 200;
let pruneCounter = 0;
const HEALTH_URL = process.env.REPLIT_DEV_DOMAIN
  ? `https://${process.env.REPLIT_DEV_DOMAIN}/api/health/detailed`
  : `http://localhost:${process.env.PORT ?? "3000"}/api/health/detailed`;

interface HealthCheck {
  status: string;
  latencyMs?: number;
  details?: string;
}

interface DbPoolStats {
  total: number;
  idle: number;
  active: number;
  waiting: number;
  max: number;
  usedPct: number;
  status: "ok" | "elevated" | "saturated";
}

interface HealthDetailedResponse {
  status: string;
  uptime: number;
  memory: {
    heapUsedMb: number;
    heapTotalMb: number;
    rssMb: number;
  };
  checks: Record<string, HealthCheck>;
  dbPool?: DbPoolStats;
}

let monitorInterval: ReturnType<typeof setInterval> | null = null;

const lastSignalAt = new LRUCache<string, number>({ max: 500 });

function shouldEmitSignal(key: string): boolean {
  const now = Date.now();
  const last = lastSignalAt.get(key) ?? 0;
  if (now - last >= SIGNAL_COOLDOWN_MS) {
    lastSignalAt.set(key, now);
    return true;
  }
  return false;
}

async function fetchHealth(): Promise<HealthDetailedResponse | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    try {
      const internalToken = process.env.ALLOY_INTERNAL_TOKEN;
      const res = await fetch(HEALTH_URL, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Lyte-SelfMonitor/1.0",
          ...(internalToken ? { "x-internal-token": internalToken } : {}),
        },
      });
      clearTimeout(timer);
      if (!res.ok) {
        logger.warn({ status: res.status }, "Self-monitor: health endpoint returned non-200");
        return null;
      }
      return res.json() as Promise<HealthDetailedResponse>;
    } finally {
      clearTimeout(timer);
    }
  } catch (err) {
    logger.warn({ err }, "Self-monitor: failed to fetch health endpoint");
    return null;
  }
}

async function createSignal(params: {
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  body: string;
  metadata: Record<string, unknown>;
}): Promise<void> {
  const now = new Date().toISOString();
  const signalsUrl = `${process.env.APP_URL ?? "https://szlholdings.com"}/command/operations/prism/signals`;

  if (params.severity === "critical" || params.severity === "high") {
    const severityLabel = params.severity === "critical" ? "🚨 CRITICAL" : "⚠️ HIGH";
    const recommendedAction = (params.metadata["recommendedAction"] as string | undefined) ?? "Review logs and take corrective action immediately.";

    if (hasEmailProviderConfigured()) {
      const founderEmail = process.env.FOUNDER_ALERT_EMAIL ?? process.env.SZL_INTERNAL_EMAIL ?? "team@szlholdings.com";
      sendEmail({
        to: founderEmail,
        subject: `[${severityLabel}] ${params.title}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <div style="background:${params.severity === "critical" ? "#dc2626" : "#d97706"};color:#fff;padding:16px 24px;border-radius:8px 8px 0 0">
              <h1 style="margin:0;font-size:18px">${severityLabel}: Platform Alert</h1>
              <p style="margin:4px 0 0;font-size:13px;opacity:0.85">${now}</p>
            </div>
            <div style="background:#1e1e2e;color:#e2e8f0;padding:24px;border-radius:0 0 8px 8px">
              <h2 style="margin:0 0 12px;font-size:16px;color:#f8f8f8">${params.title}</h2>
              <p style="margin:0 0 16px;line-height:1.6;color:#cbd5e1">${params.body}</p>
              <div style="background:#2d2d3d;border-radius:6px;padding:12px 16px;margin-bottom:16px">
                <p style="margin:0;font-size:13px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">Recommended Action</p>
                <p style="margin:6px 0 0;color:#e2e8f0;font-size:14px">${recommendedAction}</p>
              </div>
              <a href="${signalsUrl}" style="display:inline-block;background:#6366f1;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px">View in Command Center →</a>
            </div>
          </div>`,
        text: `${severityLabel}: ${params.title}\n\n${params.body}\n\nRecommended Action: ${recommendedAction}\n\nTime: ${now}`,
      }).catch((err: unknown) => logger.warn({ err }, "Self-monitor: failed to send founder email alert"));
    }

    const slackWebhook = process.env.SLACK_WEBHOOK_URL;
    if (slackWebhook) {
      fetch(slackWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `*${severityLabel}: ${params.title}*\n${params.body}\n\n*Recommended Action:* ${recommendedAction}\n<${signalsUrl}|View in Command Center>`,
        }),
      }).catch((err: unknown) => logger.warn({ err }, "Self-monitor: failed to post Slack founder alert"));
    }
  }

  try {
    const [signal] = await db.insert(lyteSignalsTable).values({
      source: "Lyte Self-Monitor",
      sourceType: "monitoring",
      severity: params.severity,
      title: params.title,
      body: params.body,
      status: "new",
      metadata: params.metadata,
      receivedAt: new Date(),
    }).returning();

    publish(WS_CHANNELS.NOTIFICATIONS, "new_signal", {
      id: `signal-${signal.id}-${Date.now()}`,
      appId: "lyte",
      appName: "Command",
      title: params.title,
      message: params.body,
      severity: params.severity === "critical" ? "critical" : params.severity === "high" ? "warning" : "info",
      actionUrl: "/command/operations/prism/signals",
      isRead: false,
      createdAt: now,
      type: params.severity === "critical" ? "error" : params.severity === "high" ? "warning" : "info",
      signal,
    });

    logger.info({ signalId: signal.id, severity: params.severity, title: params.title }, "Self-monitor: signal created");
  } catch (err) {
    logger.warn({ err }, "Self-monitor: DB persistence failed for signal (alerts already dispatched)");
  }
}

async function pruneOldSignals(): Promise<void> {
  try {
    const cutoff = new Date(Date.now() - SIGNAL_MAX_AGE_DAYS * 24 * 60 * 60 * 1000);
    const { rowCount: aged } = await db
      .delete(lyteSignalsTable)
      .where(lt(lyteSignalsTable.receivedAt, cutoff));
    if (aged && aged > 0) {
      logger.info({ count: aged, maxAgeDays: SIGNAL_MAX_AGE_DAYS }, "Self-monitor: pruned old signals by age");
    }

    const [{ cnt }] = await db
      .select({ cnt: sql<number>`count(*)::int` })
      .from(lyteSignalsTable);
    if (cnt > SIGNAL_MAX_COUNT) {
      const excess = cnt - SIGNAL_MAX_COUNT;
      const { rowCount: pruned } = await db.execute(sql`
        DELETE FROM ${lyteSignalsTable}
        WHERE id IN (
          SELECT id FROM ${lyteSignalsTable}
          ORDER BY received_at ASC
          LIMIT ${excess}
        )
      `);
      if (pruned && pruned > 0) {
        logger.info({ count: pruned, maxCount: SIGNAL_MAX_COUNT }, "Self-monitor: pruned excess signals by count");
      }
    }
  } catch (err) {
    logger.warn({ err }, "Self-monitor: signal prune failed (non-fatal)");
  }
}

interface RemediationTrigger {
  patternKey: string;
  service: string;
  triggerSignal: string;
  plannedSteps: { id: string; action: string }[];
  requireApproval?: boolean;
  approver?: string;
}

function detectRemediationTriggers(health: HealthDetailedResponse): RemediationTrigger[] {
  const triggers: RemediationTrigger[] = [];

  const dbCheck = health.checks["database"];
  if (dbCheck?.status === "unreachable" || dbCheck?.status === "unavailable") {
    triggers.push({
      patternKey: "p3",
      service: "postgres-primary",
      triggerSignal: `Primary DB ${dbCheck.status} via /api/health/detailed`,
      plannedSteps: [
        { id: "s1", action: "Promote replica to primary" },
        { id: "s2", action: "Update DNS records" },
        { id: "s3", action: "Validate connection pool" },
      ],
      requireApproval: true,
      approver: "ops-manager",
    });
  }

  const jobQueueCheck = health.checks["job_queue"];
  if (jobQueueCheck?.status === "backpressure") {
    triggers.push({
      patternKey: "p4",
      service: "job-queue",
      triggerSignal: `Job queue backpressure: ${jobQueueCheck.details ?? "details unavailable"}`,
      plannedSteps: [
        { id: "s1", action: "Pause message producers" },
        { id: "s2", action: "Drain backlog queue" },
        { id: "s3", action: "Flush dead letter queue" },
        { id: "s4", action: "Resume producers & validate" },
      ],
    });
  }

  const memory = health.memory;
  if (memory && memory.heapTotalMb > 0) {
    const heapPct = (memory.heapUsedMb / memory.heapTotalMb) * 100;
    if (heapPct > 90) {
      triggers.push({
        patternKey: "p1",
        service: "api-server",
        triggerSignal: `Heap critical at ${heapPct.toFixed(0)}% (${memory.heapUsedMb}MB / ${memory.heapTotalMb}MB)`,
        plannedSteps: [
          { id: "s1", action: "Drain existing connections" },
          { id: "s2", action: "Signal graceful shutdown" },
          { id: "s3", action: "Restart pod & await ready state" },
          { id: "s4", action: "Run health check suite" },
          { id: "s5", action: "Re-route traffic and verify" },
        ],
        requireApproval: true,
        approver: "ops-manager",
      });
    }
  }

  const telemetryCheck = health.checks["telemetry"];
  if (telemetryCheck?.status === "elevated_errors") {
    const details = telemetryCheck.details ?? "";
    const p95Match = details.match(/p95=(\d+)ms/);
    const p95 = p95Match ? parseInt(p95Match[1]) : null;
    if (p95 != null && p95 > 1000) {
      triggers.push({
        patternKey: "p2",
        service: "api-server",
        triggerSignal: `Sustained API p95 latency at ${p95}ms (>1000ms threshold)`,
        plannedSteps: [
          { id: "s1", action: "Scale +2 replicas via HPA" },
          { id: "s2", action: "Verify pod readiness" },
          { id: "s3", action: "Alert on-call engineer" },
        ],
        requireApproval: true,
        approver: "ops-manager",
      });
    }
  }

  return triggers;
}

async function reconcileSelfHealing(health: HealthDetailedResponse): Promise<void> {
  try {
    await ensurePatternsSeeded();
  } catch (err) {
    logger.warn({ err }, "Self-monitor: failed to seed self-healing patterns");
    return;
  }

  const triggers = detectRemediationTriggers(health);
  const triggerKeys = new Set(triggers.map(t => `${t.patternKey}::${t.service}`));

  for (const t of triggers) {
    const key = `${t.patternKey}::${t.service}`;
    const wasActive = hasActiveRun(t.patternKey, t.service);
    if (!wasActive) {
      await startRemediation(t);
    } else if (!t.requireApproval) {
      // Condition still present — either advance the next planned step on
      // this cycle, or, if the run has been executing past the timeout,
      // mark it failed so the row reflects a real outcome rather than
      // staying executing forever.
      if (isExecutionExpired(t.patternKey, t.service)) {
        await failRemediation(
          t.patternKey,
          t.service,
          `Remediation exceeded execution window — condition still present after timeout`,
        );
      } else {
        await advanceRemediation(t.patternKey, t.service);
      }
    }
    triggerKeys.add(key);
  }

  // Any active runs whose conditions are no longer present have recovered.
  // We only auto-complete runs that were actually executing — pending-approval
  // runs are left alone so that an operator must explicitly approve, reject, or
  // cancel them. Auto-completing a never-started approval-required run would
  // fabricate success and inflate MTTR/success-rate stats.
  for (const active of listActiveRuns()) {
    const key = `${active.patternKey}::${active.service}`;
    if (triggerKeys.has(key)) continue;
    if (active.awaitingApproval) continue;
    await completeRemediation(active.patternKey, active.service, {
      approver: "self-healing-runtime",
    });
  }
}

async function runMonitoringCycle(): Promise<void> {
  logger.debug("Self-monitoring: polling /api/health/detailed");
  pruneCounter++;
  if (pruneCounter % 10 === 0) {
    await pruneOldSignals();
  }

  const health = await fetchHealth();
  if (!health) {
    if (shouldEmitSignal("health-unreachable")) {
      await createSignal({
        severity: "critical",
        title: "API health endpoint unreachable — self-monitoring loop interrupted",
        body: "The Lyte self-monitoring loop could not reach /api/health/detailed. The API server may be overloaded or experiencing a startup issue.",
        metadata: {
          affectedFunction: "API Infrastructure",
          owner: "Platform Team",
          ownerTeam: "SRE",
          recommendedAction: "Check API server logs. Verify process is running. Restart if unresponsive for > 2 minutes.",
          sourceData: "Lyte self-monitoring — health endpoint",
        },
      });
    }
    return;
  }

  const { memory, checks, uptime, status: overallStatus } = health;

  const dbCheck = checks["database"];
  if (dbCheck?.status === "unreachable" || dbCheck?.status === "unavailable") {
    if (shouldEmitSignal("db-unreachable")) {
      await createSignal({
        severity: "critical",
        title: "Database connection unreachable — all SZL apps impacted",
        body: `The SZL API Server cannot connect to the PostgreSQL database. Status: ${dbCheck.status}. Latency: ${dbCheck.latencyMs ?? "N/A"}ms. All platform features are degraded.`,
        metadata: {
          affectedFunction: "Database Infrastructure",
          owner: "Platform Team",
          ownerTeam: "SRE",
          recommendedAction: "Check DATABASE_URL configuration. Verify PostgreSQL service is running. Check connection pool status.",
          anomaly: `Database status changed to ${dbCheck.status}`,
          sourceData: "/api/health/detailed — database check",
        },
      });
    }
  } else if (dbCheck?.latencyMs != null && dbCheck.latencyMs > 500) {
    if (shouldEmitSignal("db-latency")) {
      await createSignal({
        severity: "high",
        title: `Database query latency elevated — ${dbCheck.latencyMs}ms (threshold: 500ms)`,
        body: `API Server health check detected database query latency of ${dbCheck.latencyMs}ms, exceeding the 500ms warning threshold. This may indicate index degradation or lock contention.`,
        metadata: {
          affectedFunction: "Database Infrastructure",
          owner: "Platform Team",
          ownerTeam: "SRE",
          recommendedAction: "Run EXPLAIN ANALYZE on recent slow queries. Check pg_stat_activity for long-running transactions. Consider VACUUM ANALYZE.",
          anomaly: `DB latency: ${dbCheck.latencyMs}ms (baseline: < 50ms)`,
          sourceData: "/api/health/detailed — database check",
        },
      });
    }
  }

  const telemetryCheck = checks["telemetry"];
  if (telemetryCheck?.status === "elevated_errors") {
    const details = telemetryCheck.details ?? "";
    const p95Match = details.match(/p95=(\d+)ms/);
    const errorRateMatch = details.match(/error_rate=([\d.]+)%/);
    const p95 = p95Match ? parseInt(p95Match[1]) : null;
    const errorRate = errorRateMatch ? parseFloat(errorRateMatch[1]) : null;

    if (p95 != null && p95 > 500) {
      if (shouldEmitSignal("api-latency")) {
        await createSignal({
          severity: p95 > 1000 ? "critical" : "high",
          title: `API p95 latency exceeded threshold — ${p95}ms (threshold: 500ms)`,
          body: `API Server telemetry reports p95 response latency of ${p95}ms. The warning threshold is 500ms. Users may be experiencing degraded performance across all SZL applications.`,
          metadata: {
            affectedFunction: "API Infrastructure",
            owner: "Platform Team",
            ownerTeam: "SRE",
            recommendedAction: "Profile slow endpoints. Check for N+1 query patterns. Review recent deployments for performance regressions.",
            anomaly: `p95 latency: ${p95}ms — ${p95 > 1000 ? "critical" : "elevated"}`,
            sourceData: "/api/health/detailed — telemetry check",
            latencyP95Ms: p95,
            errorRate,
          },
        });
      }
    } else if (errorRate != null && errorRate > 5) {
      if (shouldEmitSignal("api-error-rate")) {
        await createSignal({
          severity: errorRate > 15 ? "critical" : "high",
          title: `API error rate elevated — ${errorRate.toFixed(1)}% (threshold: 5%)`,
          body: `API Server error rate has reached ${errorRate.toFixed(1)}%, exceeding the 5% alert threshold. Structured error logs should be reviewed immediately.`,
          metadata: {
            affectedFunction: "API Infrastructure",
            owner: "Platform Team",
            ownerTeam: "SRE",
            recommendedAction: "Review API error logs for common stack traces. Check for schema or breaking changes in recent deployments.",
            anomaly: `Error rate: ${errorRate.toFixed(1)}% (baseline: < 2%)`,
            sourceData: "/api/health/detailed — telemetry check",
            errorRate,
          },
        });
      }
    }
  }

  const jobQueueCheck = checks["job_queue"];
  if (jobQueueCheck?.status === "backpressure") {
    const details = jobQueueCheck.details ?? "";
    if (shouldEmitSignal("job-queue-backpressure")) {
      await createSignal({
        severity: "high",
        title: "Job queue backpressure detected — background processing degraded",
        body: `The API Server job queue is experiencing backpressure. Queue details: ${details}. Background tasks including report generation and notifications may be delayed.`,
        metadata: {
          affectedFunction: "Background Processing",
          owner: "Platform Team",
          ownerTeam: "SRE",
          recommendedAction: "Identify stuck or long-running jobs. Check for worker thread deadlocks. Consider scaling up worker concurrency.",
          anomaly: `Queue backpressure: ${details}`,
          sourceData: "/api/health/detailed — job queue check",
        },
      });
    }
  }

  if (memory) {
    const heapPct = (memory.heapUsedMb / memory.heapTotalMb) * 100;
    if (heapPct > 90) {
      if (shouldEmitSignal("heap-critical")) {
        await createSignal({
          severity: "critical",
          title: `API Server heap memory critical — ${heapPct.toFixed(0)}% (${memory.heapUsedMb}MB / ${memory.heapTotalMb}MB)`,
          body: `Node.js heap memory is at ${heapPct.toFixed(0)}% capacity (${memory.heapUsedMb}MB used of ${memory.heapTotalMb}MB total). GC pressure is causing latency spikes. OOM crash risk is elevated.`,
          metadata: {
            affectedFunction: "API Infrastructure",
            owner: "Platform Team",
            ownerTeam: "SRE",
            recommendedAction: "Immediate: identify and kill memory-leaking processes. Schedule rolling restart. Investigate large request caches or WebSocket accumulation.",
            anomaly: `Heap at ${heapPct.toFixed(0)}% — OOM risk`,
            sourceData: "process.memoryUsage() — API Server",
            heapUsedMb: memory.heapUsedMb,
            heapTotalMb: memory.heapTotalMb,
          },
        });
      }
    } else if (heapPct > 75) {
      if (shouldEmitSignal("heap-elevated")) {
        await createSignal({
          severity: "medium",
          title: `API Server heap memory elevated — ${heapPct.toFixed(0)}% (${memory.heapUsedMb}MB / ${memory.heapTotalMb}MB)`,
          body: `Node.js heap utilization is at ${heapPct.toFixed(0)}% (${memory.heapUsedMb}MB). No immediate action required, but trend monitoring recommended to prevent GC pressure.`,
          metadata: {
            affectedFunction: "API Infrastructure",
            owner: "Platform Team",
            ownerTeam: "SRE",
            recommendedAction: "Monitor heap trend over next 30 minutes. If crossing 85%, plan a non-disruptive restart.",
            sourceData: "process.memoryUsage() — API Server",
            heapUsedMb: memory.heapUsedMb,
            heapTotalMb: memory.heapTotalMb,
          },
        });
      }
    }
  }

  // OBS-007: DB connection pool saturation alert.
  // Pool stats come from /api/health/detailed (`dbPool`) so the same view
  // operators see is what gates the alert. Usage = active / max. We only
  // fire after two consecutive cycles above 80% so a single momentary
  // burst doesn't page the on-call. `waitingCount > 0` means queries are
  // already queued for a connection and is treated as immediate critical.
  try {
    const dbPool = health.dbPool;
    if (dbPool && dbPool.max > 0) {
      if (dbPool.usedPct > DB_POOL_SATURATION_PCT || dbPool.waiting > 0) {
        dbPoolHighCycles += 1;
      } else {
        dbPoolHighCycles = 0;
      }

      const sustained = dbPoolHighCycles >= 2;
      const queuedWaiters = dbPool.waiting > 0;
      if (sustained || queuedWaiters) {
        if (shouldEmitSignal("db-pool-saturation")) {
          const severity: "critical" | "high" =
            queuedWaiters || dbPool.usedPct >= 95 ? "critical" : "high";
          await createSignal({
            severity,
            title: `DB connection pool near saturation — ${dbPool.usedPct.toFixed(0)}% used (${dbPool.active}/${dbPool.max})`,
            body: `Database connection pool usage has stayed above ${DB_POOL_SATURATION_PCT}% for ${dbPoolHighCycles} consecutive cycle(s). Active: ${dbPool.active}, idle: ${dbPool.idle}, total: ${dbPool.total}, waiting: ${dbPool.waiting}, max: ${dbPool.max}. Sustained pressure causes user-visible 500s when queries time out waiting for a free connection.`,
            metadata: {
              affectedFunction: "Database Infrastructure",
              owner: "Platform Team",
              ownerTeam: "SRE",
              recommendedAction: "Identify long-running transactions via pg_stat_activity. Look for connection leaks (un-released clients) in recent deploys. Consider raising DB_POOL_MAX or scaling read replicas.",
              anomaly: `Pool used ${dbPool.usedPct.toFixed(0)}% (${dbPool.active}/${dbPool.max}); waiters=${dbPool.waiting}`,
              sourceData: "/api/health/detailed — dbPool",
              dbPoolUsedPct: dbPool.usedPct,
              dbPoolActive: dbPool.active,
              dbPoolIdle: dbPool.idle,
              dbPoolWaiting: dbPool.waiting,
              dbPoolMax: dbPool.max,
              consecutiveCycles: dbPoolHighCycles,
              thresholdPct: DB_POOL_SATURATION_PCT,
              obsRef: "OBS-007",
            },
          });
        }
      }
    }
  } catch (err) {
    logger.warn({ err }, "Self-monitor: db pool saturation check failed (non-fatal)");
  }

  // OBS-007 follow-on: per-checkout leak detection.
  // While the aggregate pool saturation alert (above) tells us that the
  // pool is under pressure, this alert pinpoints the offending route by
  // surfacing any single checkout held longer than the configured
  // threshold. The `lib/db` wrapper records each pool.connect() with a
  // captured stack trace and removes the entry on client.release(); we
  // simply read the snapshot here.
  try {
    const threshold = getCheckoutWarnThresholdMs();
    const longCheckouts = getLongRunningCheckouts(threshold);
    if (longCheckouts.length > 0) {
      if (shouldEmitSignal("db-checkout-long")) {
        const oldest = longCheckouts[0];
        const oldestSec = Math.round(oldest.ageMs / 1000);
        const severity: "critical" | "high" =
          oldest.ageMs >= threshold * 4 || longCheckouts.length >= 3 ? "critical" : "high";
        await createSignal({
          severity,
          title: `DB pool checkout held ${oldestSec}s — possible client leak`,
          body: `${longCheckouts.length} pool checkout(s) have been held longer than the ${Math.round(threshold / 1000)}s threshold. The oldest has been open for ${oldestSec}s. A single un-released client (forgotten client.release()) or a runaway transaction is the most common cause and is the leading symptom of pool saturation. Originating stack: ${oldest.stack.split("\n")[0] ?? "<unavailable>"}`,
          metadata: {
            affectedFunction: "Database Infrastructure",
            owner: "Platform Team",
            ownerTeam: "SRE",
            recommendedAction: "Inspect the originating stack trace below to identify the leaking route. Search recent logs for the matching `db.pool.checkout.long` event. Patch the missing client.release() or shorten the transaction; if the client is in active use, raise DB_CHECKOUT_WARN_THRESHOLD_MS only after confirming the workload is legitimate.",
            anomaly: `Longest checkout: ${oldestSec}s (threshold: ${Math.round(threshold / 1000)}s); ${longCheckouts.length} active over threshold`,
            sourceData: "lib/db getLongRunningCheckouts()",
            checkoutCount: longCheckouts.length,
            longestAgeMs: oldest.ageMs,
            thresholdMs: threshold,
            originatingStack: oldest.stack,
            checkouts: longCheckouts.slice(0, 5).map((c) => ({
              id: c.id,
              ageMs: c.ageMs,
              acquiredAt: c.acquiredAt,
              stackHead: c.stack.split("\n").slice(0, 4).join("\n"),
            })),
            obsRef: "OBS-007",
          },
        });
      }
    }
  } catch (err) {
    logger.warn({ err }, "Self-monitor: per-checkout leak check failed (non-fatal)");
  }

  // OBS-006: Auth failure rate alert.
  // We pull the rolling rate from the in-process telemetry collector and
  // alert when failures sustained over the recent telemetry window exceed
  // the per-minute threshold. Cool-down de-dupes repeat alerts inside the
  // same incident window.
  try {
    const authRate = serverTelemetry.getAuthFailureRatePerMin();
    if (authRate > AUTH_FAILURE_RATE_THRESHOLD_PER_MIN) {
      if (shouldEmitSignal("auth-failure-rate")) {
        await createSignal({
          severity: authRate > AUTH_FAILURE_RATE_THRESHOLD_PER_MIN * 5 ? "critical" : "high",
          title: `Auth failure rate elevated — ${authRate.toFixed(1)}/min (threshold: ${AUTH_FAILURE_RATE_THRESHOLD_PER_MIN}/min)`,
          body: `Auth middleware is rejecting ${authRate.toFixed(1)} requests per minute on average. Possible credential-stuffing, token-replay, or expired-session storm. Review auth logs and IP distribution.`,
          metadata: {
            affectedFunction: "Authentication",
            owner: "Security Team",
            ownerTeam: "Security",
            recommendedAction: "Inspect auth.failure logs (org_id, route, reason). Check for IP / UA clustering. If credential stuffing is suspected, enable rate limiting on /api/auth/login or rotate suspect credentials.",
            anomaly: `Auth failure rate: ${authRate.toFixed(1)}/min (threshold: ${AUTH_FAILURE_RATE_THRESHOLD_PER_MIN}/min)`,
            sourceData: "serverTelemetry.getAuthFailureRatePerMin()",
            authFailureRatePerMin: authRate,
            thresholdPerMin: AUTH_FAILURE_RATE_THRESHOLD_PER_MIN,
            obsRef: "OBS-006",
          },
        });
      }
    }
  } catch (err) {
    logger.warn({ err }, "Self-monitor: auth failure rate check failed (non-fatal)");
  }

  // OBS-005: Tenant isolation violation alert.
  // Any cross-tenant access blocked at the middleware or route layer is a
  // P1 security event. We fire an alert for any new violations recorded
  // since the previous monitoring cycle (no threshold — first occurrence
  // is the alert) and bypass the cool-down so a sustained attack continues
  // to surface signals.
  try {
    const checkedAt = Date.now();
    const newViolations = serverTelemetry.getTenantIsolationViolationsSince(lastTenantViolationCheckAt);
    lastTenantViolationCheckAt = checkedAt;
    if (newViolations.length > 0) {
      const sample = newViolations.slice(0, 5);
      const distinctUsers = new Set(newViolations.map((v) => v.userId).filter((id) => id != null)).size;
      const distinctOrgs = new Set(newViolations.map((v) => v.attemptedOrgId).filter((id) => id != null)).size;
      await createSignal({
        severity: "critical",
        title: `Tenant isolation violation detected — ${newViolations.length} blocked attempt(s)`,
        body: `${newViolations.length} cross-tenant access attempt(s) were blocked since the last monitoring cycle (${distinctUsers} distinct user(s), ${distinctOrgs} target org(s)). Sample: ${sample.map((v) => `${v.method ?? "?"} ${v.path ?? "?"} (user=${v.userId ?? "?"} → org=${v.attemptedOrgId ?? "?"})`).join("; ")}. This is treated as a P1 security event regardless of count.`,
        metadata: {
          affectedFunction: "Multi-Tenant Isolation",
          owner: "Security Team",
          ownerTeam: "Security",
          recommendedAction: "Inspect tenant_isolation_violation log entries. Confirm no data crossed tenant boundary. Review the user(s) and IP(s) for compromise; rotate sessions if account takeover is suspected.",
          anomaly: `Cross-tenant access blocked: ${newViolations.length} attempts`,
          sourceData: "serverTelemetry.getTenantIsolationViolationsSince()",
          violationCount: newViolations.length,
          distinctUsers,
          distinctOrgs,
          sample,
          obsRef: "OBS-005",
        },
      });
    }
  } catch (err) {
    logger.warn({ err }, "Self-monitor: tenant isolation violation check failed (non-fatal)");
  }

  if (overallStatus === "healthy" && dbCheck?.status === "connected") {
    logger.debug({ uptime: Math.round(uptime) }, "Self-monitoring: health check passed — all systems nominal");
  }

  await reconcileSelfHealing(health);
}

export function startSelfMonitoring(): void {
  if (monitorInterval) {
    logger.warn("Self-monitoring: already running, skipping start");
    return;
  }

  // Recover any open self-healing runs (executing/pending_approval) that
  // were left in the DB by a previous process so step transitions and
  // completion continue from where they were left.
  recoverActiveRuns().catch((err) =>
    logger.warn({ err }, "Self-monitor: self-healing recovery failed"),
  );

  setTimeout(async () => {
    try {
      await runMonitoringCycle();
    } catch (err) {
      logger.warn({ err }, "Self-monitor: initial cycle error");
    }
  }, 10_000);

  monitorInterval = setInterval(async () => {
    try {
      await runMonitoringCycle();
    } catch (err) {
      logger.warn({ err }, "Self-monitor: cycle error");
    }
  }, POLL_INTERVAL_MS);

  monitorInterval.unref();
  logger.info({ intervalMs: POLL_INTERVAL_MS }, "Self-monitoring started — polling /api/health/detailed");
}

export function stopSelfMonitoring(): void {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
    lastSignalAt.clear();
    logger.info("Self-monitoring stopped");
  }
}
