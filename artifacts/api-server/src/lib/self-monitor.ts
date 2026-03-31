import { db, lyteSignalsTable } from "@workspace/db";
import { publish, WS_CHANNELS } from "./websocket";
import { logger } from "./logger";

const POLL_INTERVAL_MS = 60_000;
const SIGNAL_COOLDOWN_MS = 10 * 60_000;
const HEALTH_URL = "http://localhost:" + (process.env.PORT ?? "3000") + "/api/health/detailed";

interface HealthCheck {
  status: string;
  latencyMs?: number;
  details?: string;
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
}

let monitorInterval: ReturnType<typeof setInterval> | null = null;

const lastSignalAt = new Map<string, number>();

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
      const res = await fetch(HEALTH_URL, {
        signal: controller.signal,
        headers: { "User-Agent": "Lyte-SelfMonitor/1.0" },
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
      appName: "Lyte Command Center",
      title: params.title,
      message: params.body,
      severity: params.severity === "critical" ? "critical" : params.severity === "high" ? "warning" : "info",
      actionUrl: "/lyte-command-center/signals",
      isRead: false,
      createdAt: new Date().toISOString(),
      type: params.severity === "critical" ? "error" : params.severity === "high" ? "warning" : "info",
      signal,
    });

    logger.info({ signalId: signal.id, severity: params.severity, title: params.title }, "Self-monitor: signal created");
  } catch (err) {
    logger.warn({ err }, "Self-monitor: failed to create signal");
  }
}

async function runMonitoringCycle(): Promise<void> {
  logger.debug("Self-monitoring: polling /api/health/detailed");

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

  lastSignalAt.delete("health-unreachable");

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
  } else {
    lastSignalAt.delete("db-unreachable");
    if (dbCheck?.latencyMs != null && dbCheck.latencyMs > 500) {
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
    } else {
      lastSignalAt.delete("db-latency");
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
    } else {
      lastSignalAt.delete("api-latency");
      lastSignalAt.delete("api-error-rate");
    }
  } else {
    lastSignalAt.delete("api-latency");
    lastSignalAt.delete("api-error-rate");
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
  } else {
    lastSignalAt.delete("job-queue-backpressure");
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
    } else {
      lastSignalAt.delete("heap-critical");
      if (heapPct > 75) {
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
      } else {
        lastSignalAt.delete("heap-elevated");
      }
    }
  }

  if (overallStatus === "healthy" && dbCheck?.status === "connected") {
    logger.debug({ uptime: Math.round(uptime) }, "Self-monitoring: health check passed — all systems nominal");
  }
}

export function startSelfMonitoring(): void {
  if (monitorInterval) {
    logger.warn("Self-monitoring: already running, skipping start");
    return;
  }

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
