import { logger } from "./logger.js";
import { serverTelemetry } from "@szl-holdings/observability";

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

export type WsPublishFn = (channel: string, event: string, data: unknown) => void;

export class InProcessJobQueue {
  private handlers = new Map<string, JobHandler>();
  private queue: Job[] = [];
  private running = new Set<string>();
  private completed: Job[] = [];
  private isShuttingDown = false;
  private maxCompleted = 100;
  private maxConcurrent: number;
  private publishFn?: WsPublishFn;

  constructor(maxConcurrent = 5) {
    this.maxConcurrent = maxConcurrent;
  }

  setPublishFn(fn: WsPublishFn): void {
    this.publishFn = fn;
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

    this.publishFn?.("job-queue", "enqueued", {
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

    this.publishFn?.("job-queue", "updated", {
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
  DAILY_CERTIFICATION_TASK_DIGEST: "daily_certification_task_digest",
  DAILY_CAPITAL_READINESS_DIGEST: "daily_capital_readiness_digest",
  LENDER_PACKET_GENERATE: "lender_packet_generate_job",
  INVESTOR_PACKET_GENERATE: "investor_packet_generate_job",
  HOURLY_MLS_LISTING_SYNC: "hourly_mls_listing_sync",
  DAILY_COMMERCIAL_DATA_REFRESH: "daily_commercial_data_refresh",
  METRICS_AGGREGATION: "metrics_aggregation",
  ANOMALY_SCAN: "anomaly_scan",
  ANALYTICS_EXPORT: "analytics_export",
  AI_INFERENCE: "ai_inference",
  EXTERNAL_ALERT: "external_alert",
} as const;
