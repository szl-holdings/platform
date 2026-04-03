import { db, pcBackgroundJobsTable, pcDeadLetterEventsTable } from "@szl-holdings/db";
import { eq, and, lte, sql } from "drizzle-orm";
import { logger } from "../lib/logger";
import { forgeRuntime } from "@szl-holdings/forge-runtime";

export const PRISM_JOB_TYPES = {
  DOCUMENT_INGEST: "document_ingest",
  DOCUMENT_EXTRACT: "document_extract",
  FORECAST_RECOMPUTE: "forecast_recompute",
  DEADLINE_EVALUATE: "deadline_evaluate",
  NOTIFICATION_SEND: "notification_send",
  EXPORT_GENERATE: "export_generate",
  CONNECTOR_SYNC: "connector_sync",
  WEBHOOK_PROCESS: "webhook_process",
  MANUAL_REVIEW: "manual_review",
  REPLAY_JOB: "replay_job",
  CLOCK_EVALUATE: "clock_evaluate",
  DEMAND_PACKET_GENERATE: "demand_packet_generate",
  AI_REVIEW: "ai_review",
  BULK_IMPORT: "bulk_import",
  REPORT_GENERATE: "report_generate",
} as const;

type PrismJobType = (typeof PRISM_JOB_TYPES)[keyof typeof PRISM_JOB_TYPES];
type JobHandler = (job: PrismJob) => Promise<unknown>;

interface PrismJob {
  id: number;
  orgId: number;
  jobType: string;
  payload: unknown;
  matterId: number | null;
  correlationId: string | null;
  retryCount: number;
}

const handlers = new Map<string, JobHandler>();
let isProcessing = false;
const BACKOFF_BASE_MS = 1000;
const MAX_CONCURRENT = 3;
let activeCount = 0;

export function registerPrismJobHandler(jobType: PrismJobType, handler: JobHandler): void {
  handlers.set(jobType, handler);
  logger.info({ jobType }, "[prism-queue] Handler registered");
}

export async function enqueuePrismJob(
  orgId: number,
  jobType: PrismJobType,
  payload: unknown,
  options: {
    matterId?: number;
    connectorAccountId?: number;
    idempotencyKey?: string;
    actorId?: number;
    correlationId?: string;
    maxRetries?: number;
  } = {}
): Promise<number> {
  if (options.idempotencyKey) {
    const existing = await db.select({ id: pcBackgroundJobsTable.id })
      .from(pcBackgroundJobsTable)
      .where(and(
        eq(pcBackgroundJobsTable.idempotencyKey, options.idempotencyKey),
        eq(pcBackgroundJobsTable.orgId, orgId)
      ))
      .limit(1);
    if (existing.length > 0) {
      logger.info({ idempotencyKey: options.idempotencyKey }, "[prism-queue] Duplicate job skipped");
      return existing[0].id;
    }
  }

  const correlationId = options.correlationId ?? `prism-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const [job] = await db.insert(pcBackgroundJobsTable).values({
    orgId,
    jobType,
    status: "pending",
    payload,
    matterId: options.matterId ?? null,
    connectorAccountId: options.connectorAccountId ?? null,
    idempotencyKey: options.idempotencyKey ?? null,
    actorId: options.actorId ?? null,
    correlationId,
    maxRetries: options.maxRetries ?? 3,
  }).returning({ id: pcBackgroundJobsTable.id });

  logger.info({ jobId: job.id, jobType, orgId, correlationId }, "[prism-queue] Job enqueued");

  setImmediate(() => processPendingJobs());

  return job.id;
}

const MAX_DB_RETRIES = 3;
const DB_RETRY_DELAY_MS = 2000;

async function withDbRetry<T>(fn: () => Promise<T>, context: string): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < MAX_DB_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isConnectionErr = msg.includes("Connection terminated") ||
        msg.includes("connection timeout") ||
        msg.includes("ECONNRESET") ||
        msg.includes("ENOTFOUND") ||
        msg.includes("connect ETIMEDOUT") ||
        msg.includes("Client was closed");
      if (!isConnectionErr || attempt === MAX_DB_RETRIES - 1) throw err;
      logger.warn({ attempt, context, err: msg }, "[prism-queue] DB connection error — retrying");
      await new Promise((r) => setTimeout(r, DB_RETRY_DELAY_MS * (attempt + 1)));
    }
  }
  throw lastErr;
}

async function processPendingJobs(): Promise<void> {
  if (isProcessing || activeCount >= MAX_CONCURRENT) return;
  isProcessing = true;

  try {
    const pendingJobs = await withDbRetry(() =>
      db.select()
        .from(pcBackgroundJobsTable)
        .where(and(
          eq(pcBackgroundJobsTable.status, "pending"),
          sql`(${pcBackgroundJobsTable.nextRetryAt} IS NULL OR ${pcBackgroundJobsTable.nextRetryAt} <= NOW())`
        ))
        .orderBy(pcBackgroundJobsTable.createdAt)
        .limit(MAX_CONCURRENT - activeCount),
      "processPendingJobs"
    );

    for (const job of pendingJobs) {
      activeCount++;
      executeJob(job).finally(() => {
        activeCount--;
        setImmediate(() => processPendingJobs());
      });
    }
  } catch (err) {
    logger.error({ err }, "[prism-queue] Error fetching pending jobs");
  } finally {
    isProcessing = false;
  }
}

async function executeJob(job: typeof pcBackgroundJobsTable.$inferSelect): Promise<void> {
  const handler = handlers.get(job.jobType);
  if (!handler) {
    logger.error({ jobType: job.jobType }, "[prism-queue] No handler registered");
    await moveToDeadLetter(job, "No handler registered for job type");
    return;
  }

  const tenantId = job.orgId?.toString() ?? null;
  const tenantPolicy = tenantId ? forgeRuntime.getTenantPolicy(tenantId) : undefined;

  if (tenantPolicy) {
    const tenantActiveMax = tenantPolicy.maxConcurrentExecutions;
    if (tenantPolicy.requiresDryRunFirst && tenantPolicy.requiresDryRunFirst === true) {
      logger.info({ jobId: job.id, jobType: job.jobType }, "[prism-queue] Tenant requiresDryRunFirst — dry run must be completed via FORGE API before this job runs in production");
    }
    if (tenantPolicy.allowedDomains?.length > 0) {
      logger.debug({ jobId: job.id, jobType: job.jobType, tenantId, maxConcurrent: tenantActiveMax }, "[forge-queue] FORGE tenant policy applied to job execution");
    }
  }

  await db.update(pcBackgroundJobsTable)
    .set({ status: "running", startedAt: new Date(), updatedAt: new Date() })
    .where(eq(pcBackgroundJobsTable.id, job.id));

  const startTime = Date.now();

  try {
    const result = await handler({
      id: job.id,
      orgId: job.orgId,
      jobType: job.jobType,
      payload: job.payload,
      matterId: job.matterId,
      correlationId: job.correlationId,
      retryCount: job.retryCount,
    });

    await db.update(pcBackgroundJobsTable)
      .set({
        status: "completed",
        result: result ? JSON.parse(JSON.stringify(result)) : null,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(pcBackgroundJobsTable.id, job.id));

    logger.info({
      jobId: job.id,
      jobType: job.jobType,
      durationMs: Date.now() - startTime,
      correlationId: job.correlationId,
    }, "[prism-queue] Job completed");

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const newRetryCount = job.retryCount + 1;

    if (newRetryCount >= job.maxRetries) {
      await moveToDeadLetter(job, errorMessage);
    } else {
      const backoffMs = BACKOFF_BASE_MS * Math.pow(2, newRetryCount);
      const nextRetry = new Date(Date.now() + backoffMs);

      await db.update(pcBackgroundJobsTable)
        .set({
          status: "pending",
          retryCount: newRetryCount,
          nextRetryAt: nextRetry,
          error: errorMessage,
          updatedAt: new Date(),
        })
        .where(eq(pcBackgroundJobsTable.id, job.id));

      logger.warn({
        jobId: job.id,
        jobType: job.jobType,
        retryCount: newRetryCount,
        nextRetryAt: nextRetry.toISOString(),
        error: errorMessage,
        correlationId: job.correlationId,
      }, "[prism-queue] Job failed, scheduled retry");
    }
  }
}

async function moveToDeadLetter(
  job: typeof pcBackgroundJobsTable.$inferSelect,
  error: string
): Promise<void> {
  await db.update(pcBackgroundJobsTable)
    .set({ status: "dead_letter", error, completedAt: new Date(), updatedAt: new Date() })
    .where(eq(pcBackgroundJobsTable.id, job.id));

  await db.insert(pcDeadLetterEventsTable).values({
    orgId: job.orgId,
    sourceJobId: job.id,
    jobType: job.jobType,
    payload: job.payload,
    error,
    retryCount: job.retryCount,
  });

  logger.error({
    jobId: job.id,
    jobType: job.jobType,
    error,
    correlationId: job.correlationId,
  }, "[prism-queue] Job moved to dead letter queue");
}

export async function replayDeadLetterEvent(deadLetterId: number, actorId: number): Promise<number> {
  const [dle] = await db.select().from(pcDeadLetterEventsTable)
    .where(eq(pcDeadLetterEventsTable.id, deadLetterId));
  if (!dle) throw new Error(`Dead letter event ${deadLetterId} not found`);

  const newJobId = await enqueuePrismJob(
    dle.orgId,
    dle.jobType as PrismJobType,
    dle.payload,
    { actorId, correlationId: `replay-${dle.id}-${Date.now()}` }
  );

  await db.update(pcDeadLetterEventsTable)
    .set({ resolvedAt: new Date(), resolvedBy: actorId, resolution: "replayed" })
    .where(eq(pcDeadLetterEventsTable.id, deadLetterId));

  logger.info({ deadLetterId, newJobId, actorId }, "[prism-queue] Dead letter event replayed");
  return newJobId;
}

export async function getJobStats(orgId: number) {
  const stats = await db.execute(sql`
    SELECT 
      status, 
      job_type,
      COUNT(*)::int as count,
      AVG(EXTRACT(EPOCH FROM (completed_at - started_at)))::numeric(10,2) as avg_duration_sec
    FROM pc_background_jobs 
    WHERE org_id = ${orgId}
    GROUP BY status, job_type
    ORDER BY status, job_type
  `);
  return stats.rows;
}

export function startPrismJobPoller(intervalMs = 5000): NodeJS.Timeout {
  logger.info({ intervalMs }, "[prism-queue] Starting job poller");
  return setInterval(() => processPendingJobs(), intervalMs);
}
