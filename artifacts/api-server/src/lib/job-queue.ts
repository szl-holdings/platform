export {
  InProcessJobQueue,
  jobQueue,
  JOB_TYPES,
  type Job,
  type JobStatus,
  type WsPublishFn,
} from "@szl-holdings/workflow-engine";

import { jobQueue, JOB_TYPES } from "@szl-holdings/workflow-engine";
import { logger } from "./logger";
import { publish, WS_CHANNELS } from "./websocket";
import { serverTelemetry } from "@szl-holdings/observability";

jobQueue.setPublishFn(publish);

jobQueue.register(JOB_TYPES.WEBHOOK_DELIVERY, async (job) => {
  const { url, payload, headers } = job.payload as { url: string; payload: unknown; headers?: Record<string, string> };
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`Webhook delivery failed: HTTP ${response.status}`);
  }
});

jobQueue.register(JOB_TYPES.REPORT_GENERATION, async (job) => {
  const { reportType } = job.payload as { reportType: string };
  logger.info({ jobId: job.id, reportType }, "Report generation job started");
  await new Promise(r => setTimeout(r, 100));
  logger.info({ jobId: job.id, reportType }, "Report generation completed");
});

jobQueue.register(JOB_TYPES.NOTIFICATION_DISPATCH, async (job) => {
  const { userId, message, channel } = job.payload as { userId: number; message: string; channel: string };
  logger.info({ jobId: job.id, userId, channel }, "Notification dispatch job");
  publish(WS_CHANNELS.NOTIFICATIONS, "notification", { userId, message, channel });
});

jobQueue.register(JOB_TYPES.EMAIL_SEND, async (job) => {
  const { to, subject } = job.payload as { to: string; subject: string };
  logger.info({ jobId: job.id, to, subject }, "Email send job (no-op in demo mode)");
});

jobQueue.register(JOB_TYPES.DAILY_DIGEST, async (job) => {
  const { domains = [] } = job.payload as { domains?: string[] };
  logger.info({ jobId: job.id, domains }, "Daily digest generation started");
  const snapshot = serverTelemetry.getSnapshot();
  serverTelemetry.recordBusinessEvent({
    type: "daily_digest_generated",
    metadata: {
      requestCount: snapshot.requestCount,
      errorRate: snapshot.errorRate,
      jobFailures: snapshot.jobFailures,
      workflowCompletions: snapshot.workflowCompletions,
      domains,
    },
  });
  logger.info({ jobId: job.id, snapshot: { requestCount: snapshot.requestCount, errorRate: snapshot.errorRate } }, "Daily digest complete");
});

jobQueue.register(JOB_TYPES.HEALTH_SCAN, async (job) => {
  const { services: serviceList = [] } = job.payload as { services?: string[] };
  logger.info({ jobId: job.id, services: serviceList }, "Health scan started");
  const snapshot = serverTelemetry.getSnapshot();
  const errorRateHigh = snapshot.errorRate > 5;
  const p95High = snapshot.p95Latency > 2000;

  if (errorRateHigh) {
    serverTelemetry.raiseAlert({
      type: "high_error_rate",
      message: `API error rate is ${snapshot.errorRate.toFixed(1)}% — exceeds 5% threshold`,
      severity: "critical",
      metadata: { errorRate: snapshot.errorRate, threshold: 5 },
    });
    logger.warn({ errorRate: snapshot.errorRate }, "Alert: high error rate detected");
  }

  if (p95High) {
    serverTelemetry.raiseAlert({
      type: "high_latency",
      message: `API P95 latency is ${snapshot.p95Latency.toFixed(0)}ms — exceeds 2000ms threshold`,
      severity: "warning",
      metadata: { p95Latency: snapshot.p95Latency, threshold: 2000 },
    });
    logger.warn({ p95Latency: snapshot.p95Latency }, "Alert: high P95 latency detected");
  }

  if (snapshot.jobFailures > 3) {
    serverTelemetry.raiseAlert({
      type: "job_failure_spike",
      message: `${snapshot.jobFailures} job failures detected in the last 5 minutes`,
      severity: "warning",
      metadata: { jobFailures: snapshot.jobFailures, threshold: 3 },
    });
  }

  serverTelemetry.recordBusinessEvent({
    type: "health_scan_completed",
    success: !errorRateHigh,
    metadata: { services: serviceList, alertsRaised: errorRateHigh || p95High ? 1 : 0 },
  });
  logger.info({ jobId: job.id }, "Health scan completed");
});

jobQueue.register(JOB_TYPES.ALERT_CHECK, async (job) => {
  const activeAlerts = serverTelemetry.getActiveAlerts();
  logger.info({ jobId: job.id, alertCount: activeAlerts.length }, "Alert check completed");
  serverTelemetry.recordBusinessEvent({
    type: "alert_check_completed",
    count: activeAlerts.length,
    metadata: { activeAlerts: activeAlerts.map((a) => a.type) },
  });
  return;
});

jobQueue.register(JOB_TYPES.READINESS_CHECK, async (job) => {
  const { program } = job.payload as { program?: string };
  logger.info({ jobId: job.id, program }, "Readiness check job started");
  serverTelemetry.recordBusinessEvent({
    type: "readiness_check_completed",
    metadata: { program },
  });
});

jobQueue.register(JOB_TYPES.DAILY_CERTIFICATION_TASK_DIGEST, async (job) => {
  logger.info({ jobId: job.id }, "Daily certification task digest started");
  serverTelemetry.recordBusinessEvent({
    type: "daily_certification_task_digest",
    metadata: { jobId: job.id },
  });
});

jobQueue.register(JOB_TYPES.DAILY_CAPITAL_READINESS_DIGEST, async (job) => {
  logger.info({ jobId: job.id }, "Daily capital readiness digest started");
  serverTelemetry.recordBusinessEvent({
    type: "daily_capital_readiness_digest",
    metadata: { jobId: job.id },
  });
});

jobQueue.register(JOB_TYPES.LENDER_PACKET_GENERATE, async (job) => {
  const { packetId, lenderType } = job.payload as { packetId?: number; lenderType?: string };
  logger.info({ jobId: job.id, packetId, lenderType }, "Lender packet generate job started");
  await new Promise(r => setTimeout(r, 50));
  serverTelemetry.recordBusinessEvent({
    type: "lender_packet_generated",
    metadata: { jobId: job.id, packetId, lenderType },
  });
  logger.info({ jobId: job.id, packetId }, "Lender packet generate job complete");
});

jobQueue.register(JOB_TYPES.INVESTOR_PACKET_GENERATE, async (job) => {
  const { packetId, investorType } = job.payload as { packetId?: number; investorType?: string };
  logger.info({ jobId: job.id, packetId, investorType }, "Investor packet generate job started");
  await new Promise(r => setTimeout(r, 50));
  serverTelemetry.recordBusinessEvent({
    type: "investor_packet_generated",
    metadata: { jobId: job.id, packetId, investorType },
  });
  logger.info({ jobId: job.id, packetId }, "Investor packet generate job complete");
});

jobQueue.register(JOB_TYPES.HOURLY_MLS_LISTING_SYNC, async (job) => {
  logger.info({ jobId: job.id }, "Hourly MLS listing sync started");
  try {
    const { runMlsListingSync } = await import("./terra-enterprise-ingestion");
    const result = await runMlsListingSync();
    serverTelemetry.recordBusinessEvent({
      type: "mls_listing_sync_completed",
      count: result.upserted,
      metadata: { fetched: result.fetched, upserted: result.upserted, errors: result.errors, demoMode: result.demoMode },
    });
    logger.info({ jobId: job.id, ...result }, "Hourly MLS listing sync completed");
  } catch (err) {
    logger.error({ jobId: job.id, err }, "Hourly MLS listing sync failed");
    throw err;
  }
});

jobQueue.register(JOB_TYPES.DAILY_COMMERCIAL_DATA_REFRESH, async (job) => {
  logger.info({ jobId: job.id }, "Daily commercial data refresh started");
  try {
    const { runCommercialDataRefresh } = await import("./terra-enterprise-ingestion");
    const result = await runCommercialDataRefresh();
    serverTelemetry.recordBusinessEvent({
      type: "commercial_data_refresh_completed",
      metadata: { costar: result.costar, compstak: result.compstak },
    });
    logger.info({ jobId: job.id, ...result }, "Daily commercial data refresh completed");
  } catch (err) {
    logger.error({ jobId: job.id, err }, "Daily commercial data refresh failed");
    throw err;
  }
});

let scheduledJobsStarted = false;

export function startScheduledJobs() {
  if (scheduledJobsStarted) return;
  scheduledJobsStarted = true;

  const HOUR_MS = 60 * 60 * 1000;
  const FIVE_MIN_MS = 5 * 60 * 1000;
  const DAY_MS = 24 * HOUR_MS;

  setTimeout(async () => {
    try {
      await jobQueue.enqueue(JOB_TYPES.HEALTH_SCAN, { services: ["database", "job-queue", "api"] }, { maxRetries: 1 });
    } catch (err) {
      logger.warn({ err }, "Failed to enqueue initial health scan");
    }
  }, 30_000);

  setInterval(async () => {
    try {
      await jobQueue.enqueue(JOB_TYPES.HEALTH_SCAN, { services: ["database", "job-queue", "api"] }, { maxRetries: 1 });
    } catch (err) {
      logger.warn({ err }, "Failed to enqueue scheduled health scan");
    }
  }, FIVE_MIN_MS);

  setInterval(async () => {
    try {
      await jobQueue.enqueue(JOB_TYPES.ALERT_CHECK, {}, { maxRetries: 1 });
    } catch (err) {
      logger.warn({ err }, "Failed to enqueue alert check");
    }
  }, 15 * 60 * 1000);

  const now = new Date();
  const nextDigest = new Date(now);
  nextDigest.setUTCHours(8, 0, 0, 0);
  if (nextDigest <= now) nextDigest.setUTCDate(nextDigest.getUTCDate() + 1);
  const msUntilDigest = nextDigest.getTime() - now.getTime();

  setTimeout(async () => {
    try {
      await jobQueue.enqueue(JOB_TYPES.DAILY_DIGEST, { domains: ["vessels", "firestorm", "lyte", "terra"] }, { maxRetries: 2 });
    } catch (err) {
      logger.warn({ err }, "Failed to enqueue daily digest");
    }
    setInterval(async () => {
      try {
        await jobQueue.enqueue(JOB_TYPES.DAILY_DIGEST, { domains: ["vessels", "firestorm", "lyte", "terra"] }, { maxRetries: 2 });
      } catch (err) {
        logger.warn({ err }, "Failed to enqueue daily digest");
      }
    }, DAY_MS);
  }, msUntilDigest);

  const now2 = new Date();
  const nextCertDigest = new Date(now2);
  nextCertDigest.setUTCHours(7, 30, 0, 0);
  if (nextCertDigest <= now2) nextCertDigest.setUTCDate(nextCertDigest.getUTCDate() + 1);
  const msUntilCertDigest = nextCertDigest.getTime() - now2.getTime();

  setTimeout(async () => {
    try {
      await jobQueue.enqueue(JOB_TYPES.DAILY_CERTIFICATION_TASK_DIGEST, {}, { maxRetries: 2 });
    } catch (err) {
      logger.warn({ err }, "Failed to enqueue certification task digest");
    }
    setInterval(async () => {
      try {
        await jobQueue.enqueue(JOB_TYPES.DAILY_CERTIFICATION_TASK_DIGEST, {}, { maxRetries: 2 });
      } catch (err) {
        logger.warn({ err }, "Failed to enqueue certification task digest");
      }
    }, DAY_MS);
  }, msUntilCertDigest);

  const now3 = new Date();
  const nextCapDigest = new Date(now3);
  nextCapDigest.setUTCHours(8, 15, 0, 0);
  if (nextCapDigest <= now3) nextCapDigest.setUTCDate(nextCapDigest.getUTCDate() + 1);
  const msUntilCapDigest = nextCapDigest.getTime() - now3.getTime();

  setTimeout(async () => {
    try {
      await jobQueue.enqueue(JOB_TYPES.DAILY_CAPITAL_READINESS_DIGEST, {}, { maxRetries: 2 });
    } catch (err) {
      logger.warn({ err }, "Failed to enqueue capital readiness digest");
    }
    setInterval(async () => {
      try {
        await jobQueue.enqueue(JOB_TYPES.DAILY_CAPITAL_READINESS_DIGEST, {}, { maxRetries: 2 });
      } catch (err) {
        logger.warn({ err }, "Failed to enqueue capital readiness digest");
      }
    }, DAY_MS);
  }, msUntilCapDigest);

  setInterval(async () => {
    try {
      await jobQueue.enqueue(JOB_TYPES.HOURLY_MLS_LISTING_SYNC, {}, { maxRetries: 2 });
    } catch (err) {
      logger.warn({ err }, "Failed to enqueue MLS listing sync");
    }
  }, HOUR_MS);

  setTimeout(async () => {
    try {
      await jobQueue.enqueue(JOB_TYPES.HOURLY_MLS_LISTING_SYNC, {}, { maxRetries: 2 });
    } catch (err) {
      logger.warn({ err }, "Failed to enqueue initial MLS listing sync");
    }
  }, 60_000);

  const now4 = new Date();
  const nextCommercialRefresh = new Date(now4);
  nextCommercialRefresh.setUTCHours(3, 0, 0, 0);
  if (nextCommercialRefresh <= now4) nextCommercialRefresh.setUTCDate(nextCommercialRefresh.getUTCDate() + 1);
  const msUntilCommercialRefresh = nextCommercialRefresh.getTime() - now4.getTime();

  setTimeout(async () => {
    try {
      await jobQueue.enqueue(JOB_TYPES.DAILY_COMMERCIAL_DATA_REFRESH, {}, { maxRetries: 2 });
    } catch (err) {
      logger.warn({ err }, "Failed to enqueue commercial data refresh");
    }
    setInterval(async () => {
      try {
        await jobQueue.enqueue(JOB_TYPES.DAILY_COMMERCIAL_DATA_REFRESH, {}, { maxRetries: 2 });
      } catch (err) {
        logger.warn({ err }, "Failed to enqueue commercial data refresh");
      }
    }, DAY_MS);
  }, msUntilCommercialRefresh);

  setTimeout(async () => {
    try {
      await jobQueue.enqueue(JOB_TYPES.DAILY_COMMERCIAL_DATA_REFRESH, {}, { maxRetries: 1 });
    } catch (err) {
      logger.warn({ err }, "Failed to enqueue initial commercial data refresh");
    }
  }, 90_000);

  logger.info("Scheduled jobs initialized: health scan (5m), alert check (15m), daily digest (24h), cert digest (7:30 UTC), capital digest (8:15 UTC), MLS sync (1h), commercial refresh (daily 3 UTC)");
}
