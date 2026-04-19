import { logger } from "./logger";
import { getDetailedHealth, type ProbeStatus, type DetailedHealthSnapshot } from "./health-probes";
import { dispatchExternalAlert } from "./notification-dispatch";
import { queueExternalAlert } from "./queued-jobs";
import { captureServerException } from "./sentry";
import type { NotifSeverity } from "./domain-notifications";

type AlertChannel = "notification" | "sentry" | "both" | "none";

const DEFAULT_THRESHOLD_MS = 60_000;
const DEFAULT_INTERVAL_MS = 20_000;
const DEFAULT_REALERT_MS = 10 * 60_000;

function intFromEnv(name: string, fallback: number, min = 1_000): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < min) return fallback;
  return parsed;
}

function channelFromEnv(): AlertChannel {
  const raw = (process.env.HEALTH_DEGRADED_ALERT_CHANNEL ?? "both").toLowerCase();
  if (raw === "notification" || raw === "sentry" || raw === "both" || raw === "none") {
    return raw;
  }
  return "both";
}

function severityFromEnv(): NotifSeverity {
  const raw = (process.env.HEALTH_DEGRADED_ALERT_SEVERITY ?? "warning").toLowerCase();
  if (raw === "critical" || raw === "warning" || raw === "info") return raw;
  return "warning";
}

interface DegradationState {
  status: ProbeStatus;
  firstSeenAt: number;
  lastAlertAt: number | null;
  lastLatencyMs: number | undefined;
  lastDetails: string | undefined;
}

const probeState = new Map<string, DegradationState>();

let watcherInterval: ReturnType<typeof setInterval> | null = null;
let inflight = false;

type ProbeName = Exclude<keyof DetailedHealthSnapshot, "cachedAt">;

function listProbeNames(snapshot: DetailedHealthSnapshot): ProbeName[] {
  const record = snapshot as unknown as Record<string, { status?: unknown }>;
  return (Object.keys(snapshot) as Array<keyof DetailedHealthSnapshot>).filter(
    (k): k is ProbeName =>
      k !== "cachedAt" &&
      typeof record[k as string] === "object" &&
      record[k as string]?.status !== undefined,
  );
}

function isUnhealthy(status: ProbeStatus): boolean {
  return status === "degraded" || status === "error";
}

async function fireAlert(params: {
  probe: ProbeName;
  status: ProbeStatus;
  durationMs: number;
  latencyMs: number | undefined;
  details: string | undefined;
  channel: AlertChannel;
  severity: NotifSeverity;
}): Promise<void> {
  const { probe, status, durationMs, latencyMs, details, channel, severity } = params;
  const durationSec = Math.round(durationMs / 1_000);
  const latencyLabel = latencyMs != null ? `${latencyMs}ms` : "n/a";
  const title = `Health probe ${probe} sustained ${status} (${durationSec}s)`;
  const message =
    `Probe "${probe}" has been ${status} for ${durationSec}s. ` +
    `Current latency: ${latencyLabel}.` +
    (details ? ` Details: ${details}` : "");

  logger.warn(
    { probe, status, durationMs, latencyMs, details, channel, severity },
    "[health-watcher] sustained probe degradation — dispatching alert",
  );

  const jobs: Promise<unknown>[] = [];

  if (channel === "notification" || channel === "both") {
    // GAP-017: queue durably so an alert from a degraded watcher tick is
    // delivered even if the API server crashes between detection and fanout.
    // Falls back to inline dispatch if the durable queue is unavailable
    // (e.g. tests, early bootstrap) so we never silently drop critical alerts.
    jobs.push(
      queueExternalAlert({
        appName: "API Health",
        title,
        message,
        severity,
        actionUrl: "/command/operations/prism/signals",
      })
        .catch(async (err) => {
          logger.warn({ err, probe }, "[health-watcher] queueExternalAlert failed — falling back to inline dispatch");
          try {
            await dispatchExternalAlert({
              appName: "API Health",
              title,
              message,
              severity,
              actionUrl: "/command/operations/prism/signals",
            });
          } catch (innerErr) {
            logger.warn({ err: innerErr, probe }, "[health-watcher] inline notification dispatch fallback failed");
          }
        }),
    );
  }

  if (channel === "sentry" || channel === "both") {
    try {
      const err = new Error(`${title}: ${message}`);
      err.name = "HealthProbeDegraded";
      captureServerException(err, {
        probe,
        status,
        durationMs,
        latencyMs,
        details,
      });
    } catch (err) {
      logger.warn({ err, probe }, "[health-watcher] sentry capture failed");
    }
  }

  if (jobs.length > 0) await Promise.allSettled(jobs);
}

async function evaluateOnce(): Promise<void> {
  if (inflight) return;
  inflight = true;
  try {
    const thresholdMs = intFromEnv("HEALTH_DEGRADED_THRESHOLD_MS", DEFAULT_THRESHOLD_MS);
    const realertMs = intFromEnv("HEALTH_DEGRADED_REALERT_MS", DEFAULT_REALERT_MS);
    const channel = channelFromEnv();
    const severity = severityFromEnv();

    if (channel === "none") return;

    let snapshot: DetailedHealthSnapshot;
    try {
      snapshot = await getDetailedHealth();
    } catch (err) {
      logger.warn({ err }, "[health-watcher] failed to fetch health snapshot");
      return;
    }

    const now = Date.now();

    const probes = listProbeNames(snapshot);
    for (const probe of probes) {
      const result = snapshot[probe];
      const status = result.status;

      if (!isUnhealthy(status)) {
        if (probeState.has(probe)) {
          logger.info({ probe, status }, "[health-watcher] probe recovered — clearing degradation state");
          probeState.delete(probe);
        }
        continue;
      }

      const existing = probeState.get(probe);
      if (!existing) {
        probeState.set(probe, {
          status,
          firstSeenAt: now,
          lastAlertAt: null,
          lastLatencyMs: result.latencyMs,
          lastDetails: result.details,
        });
        continue;
      }

      existing.status = status;
      existing.lastLatencyMs = result.latencyMs;
      existing.lastDetails = result.details;

      const durationMs = now - existing.firstSeenAt;
      if (durationMs < thresholdMs) continue;

      const sinceLast = existing.lastAlertAt == null ? Infinity : now - existing.lastAlertAt;
      if (sinceLast < realertMs) continue;

      existing.lastAlertAt = now;
      await fireAlert({
        probe,
        status,
        durationMs,
        latencyMs: result.latencyMs,
        details: result.details,
        channel,
        severity,
      });
    }
  } finally {
    inflight = false;
  }
}

export function startHealthDegradationWatcher(): void {
  if (watcherInterval) {
    logger.warn("[health-watcher] already running, skipping start");
    return;
  }
  const intervalMs = intFromEnv("HEALTH_DEGRADED_WATCH_INTERVAL_MS", DEFAULT_INTERVAL_MS);
  const thresholdMs = intFromEnv("HEALTH_DEGRADED_THRESHOLD_MS", DEFAULT_THRESHOLD_MS);
  const channel = channelFromEnv();

  if (channel === "none") {
    logger.info("[health-watcher] disabled via HEALTH_DEGRADED_ALERT_CHANNEL=none");
    return;
  }

  watcherInterval = setInterval(() => {
    evaluateOnce().catch((err) =>
      logger.warn({ err }, "[health-watcher] evaluation cycle failed"),
    );
  }, intervalMs);
  watcherInterval.unref();

  logger.info(
    { intervalMs, thresholdMs, channel },
    "[health-watcher] started — alerting on sustained probe degradation",
  );
}

export function stopHealthDegradationWatcher(): void {
  if (watcherInterval) {
    clearInterval(watcherInterval);
    watcherInterval = null;
    probeState.clear();
    logger.info("[health-watcher] stopped");
  }
}

export function _getDegradationStateForTests(): ReadonlyMap<string, DegradationState> {
  return probeState;
}

export async function _evaluateOnceForTests(): Promise<void> {
  await evaluateOnce();
}

export function _resetForTests(): void {
  probeState.clear();
  inflight = false;
}
