import { logger } from "./logger";
import { publish, WS_CHANNELS } from "./websocket";
import { serverTelemetry } from "@workspace/observability";

export type JobStatus = "pending" | "running" | "completed" | "failed";

export interface Job<T = unknown> {
  id: string;
  type: string;
  payload: T;
  status: JobStatus;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
  retries: number;
  maxRetries: number;
}

type JobHandler<T = unknown> = (job: Job<T>) => Promise<void>;

class InProcessJobQueue {
  private handlers = new Map<string, JobHandler>();
  private queue: Job[] = [];
  private running = new Set<string>();
  private completed: Job[] = [];
  private isShuttingDown = false;
  private maxCompleted = 100;
  private maxConcurrent: number;

  constructor(maxConcurrent = 5) {
    this.maxConcurrent = maxConcurrent;
  }

  register<T>(type: string, handler: JobHandler<T>): void {
    this.handlers.set(type, handler as JobHandler);
    logger.debug({ type }, "Job handler registered");
  }

  async enqueue<T>(
    type: string,
    payload: T,
    options: { maxRetries?: number } = {},
  ): Promise<Job<T>> {
    if (!this.handlers.has(type)) {
      throw new Error(`No handler registered for job type: ${type}`);
    }

    const job: Job<T> = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type,
      payload,
      status: "pending",
      createdAt: Date.now(),
      retries: 0,
      maxRetries: options.maxRetries ?? 3,
    };

    this.queue.push(job as Job);
    logger.debug({ jobId: job.id, type }, "Job enqueued");

    publish(WS_CHANNELS.JOB_QUEUE, "enqueued", {
      id: job.id,
      type: job.type,
      status: job.status,
    });

    setImmediate(() => this.processNext());

    return job;
  }

  private async processNext(): Promise<void> {
    if (this.isShuttingDown) return;
    if (this.running.size >= this.maxConcurrent) return;

    const job = this.queue.shift();
    if (!job) return;

    const handler = this.handlers.get(job.type);
    if (!handler) {
      job.status = "failed";
      job.error = `No handler for type: ${job.type}`;
      this.archiveJob(job);
      return;
    }

    this.running.add(job.id);
    job.status = "running";
    job.startedAt = Date.now();

    try {
      await handler(job);
      job.status = "completed";
      job.completedAt = Date.now();
      const durationMs = job.completedAt - (job.startedAt ?? job.completedAt);
      logger.debug({ jobId: job.id, type: job.type, ms: durationMs }, "Job completed");
      serverTelemetry.recordBusinessEvent({
        type: "job_completed",
        domain: job.type,
        durationMs,
        success: true,
        metadata: { jobId: job.id },
      });
    } catch (err) {
      job.retries++;
      const errorMsg = err instanceof Error ? err.message : String(err);

      if (job.retries <= job.maxRetries) {
        logger.warn({ jobId: job.id, type: job.type, attempt: job.retries, err }, "Job failed — retrying");
        job.status = "pending";
        const delay = Math.min(1000 * 2 ** job.retries, 30_000);
        setTimeout(() => {
          this.queue.unshift(job);
          this.processNext();
        }, delay);
        this.running.delete(job.id);
        serverTelemetry.recordBusinessEvent({
          type: "job_retry",
          domain: job.type,
          success: false,
          metadata: { jobId: job.id, attempt: job.retries, error: errorMsg },
        });
        return;
      }

      job.status = "failed";
      job.error = errorMsg;
      job.completedAt = Date.now();
      logger.error({ jobId: job.id, type: job.type, err }, "Job permanently failed");
      serverTelemetry.recordBusinessEvent({
        type: "job_failed",
        domain: job.type,
        success: false,
        metadata: { jobId: job.id, error: errorMsg, retries: job.retries },
      });
    }

    this.running.delete(job.id);
    this.archiveJob(job);

    publish(WS_CHANNELS.JOB_QUEUE, "updated", {
      id: job.id,
      type: job.type,
      status: job.status,
      error: job.error,
    });

    setImmediate(() => this.processNext());
  }

  private archiveJob(job: Job): void {
    this.completed.unshift(job);
    if (this.completed.length > this.maxCompleted) {
      this.completed.length = this.maxCompleted;
    }
  }

  getStats() {
    return {
      pending: this.queue.length,
      running: this.running.size,
      completed: this.completed.filter(j => j.status === "completed").length,
      failed: this.completed.filter(j => j.status === "failed").length,
    };
  }

  getRecentJobs(limit = 20): Job[] {
    return this.completed.slice(0, limit);
  }

  async shutdown(): Promise<void> {
    this.isShuttingDown = true;
    const maxWait = 5_000;
    const start = Date.now();

    while (this.running.size > 0 && Date.now() - start < maxWait) {
      await new Promise(r => setTimeout(r, 100));
    }

    if (this.running.size > 0) {
      logger.warn({ remaining: this.running.size }, "Job queue shutdown with running jobs");
    }
  }
}

export const jobQueue = new InProcessJobQueue();

export const JOB_TYPES = {
  WEBHOOK_DELIVERY: "webhook_delivery",
  REPORT_GENERATION: "report_generation",
  NOTIFICATION_DISPATCH: "notification_dispatch",
  EMAIL_SEND: "email_send",
  DAILY_DIGEST: "daily_digest",
  HEALTH_SCAN: "health_scan",
  ALERT_CHECK: "alert_check",
  READINESS_CHECK: "readiness_check",
} as const;

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
      await jobQueue.enqueue(JOB_TYPES.DAILY_DIGEST, { domains: ["vessels", "firestorm", "lyte", "inca", "terra", "msp"] }, { maxRetries: 2 });
    } catch (err) {
      logger.warn({ err }, "Failed to enqueue daily digest");
    }
    setInterval(async () => {
      try {
        await jobQueue.enqueue(JOB_TYPES.DAILY_DIGEST, { domains: ["vessels", "firestorm", "lyte", "inca", "terra", "msp"] }, { maxRetries: 2 });
      } catch (err) {
        logger.warn({ err }, "Failed to enqueue daily digest");
      }
    }, DAY_MS);
  }, msUntilDigest);

  logger.info("Scheduled jobs initialized: health scan (5m), alert check (15m), daily digest (24h)");
}
