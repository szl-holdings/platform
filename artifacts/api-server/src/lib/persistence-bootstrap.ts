import { db } from "@szl-holdings/db";
import {
  jobQueueTable,
  deadLetterJobsTable,
  scheduledJobRunsTable,
  agentEventsTable,
  platformJobRunsTable,
} from "@szl-holdings/db";
import { eq, desc, and, inArray } from "drizzle-orm";
import { jobQueue, type Job } from "./job-queue";
import { agentEventBus, type AgentEvent } from "./event-bus";
import { WorkflowStateMachine, type WorkflowContext } from "@szl-holdings/workflow-engine";
import { logger } from "./logger";

function persistJobToDb(job: Job, action: "enqueue" | "start" | "complete" | "fail" | "dead_letter", extra?: { error?: string; errorHistory?: string[] }): void {
  if (action === "enqueue") {
    db.insert(jobQueueTable).values({
      jobId: job.id,
      type: job.type,
      payload: job.payload as Record<string, unknown>,
      status: "pending",
      maxRetries: job.maxRetries,
      scheduledAt: new Date(job.createdAt),
      createdAt: new Date(job.createdAt),
    }).onConflictDoNothing().catch(err => {
      logger.debug({ err, jobId: job.id }, "Job queue DB insert conflict (non-fatal)");
    });
    return;
  }

  if (action === "start") {
    db.update(jobQueueTable)
      .set({ status: "running", startedAt: job.startedAt ? new Date(job.startedAt) : new Date() })
      .where(eq(jobQueueTable.jobId, job.id))
      .catch(err => logger.debug({ err, jobId: job.id }, "Job queue DB start update (non-fatal)"));
    return;
  }

  if (action === "complete") {
    db.update(jobQueueTable)
      .set({ status: "completed", completedAt: job.completedAt ? new Date(job.completedAt) : new Date() })
      .where(eq(jobQueueTable.jobId, job.id))
      .catch(err => logger.debug({ err, jobId: job.id }, "Job queue DB complete update (non-fatal)"));
    return;
  }

  if (action === "fail") {
    db.update(jobQueueTable)
      .set({ status: "failed", error: job.error, retryCount: job.retries, completedAt: job.completedAt ? new Date(job.completedAt) : new Date() })
      .where(eq(jobQueueTable.jobId, job.id))
      .catch(err => logger.debug({ err, jobId: job.id }, "Job queue DB fail update (non-fatal)"));
    return;
  }

  if (action === "dead_letter") {
    db.insert(deadLetterJobsTable).values({
      jobId: job.id,
      type: job.type,
      payload: job.payload as Record<string, unknown>,
      errorHistory: (extra?.errorHistory ?? []) as unknown as Record<string, unknown>[],
      finalError: extra?.error ?? job.error,
      retryCount: job.retries,
      updatedAt: new Date(),
    }).onConflictDoNothing().catch(err => {
      logger.debug({ err, jobId: job.id }, "DLQ DB insert (non-fatal)");
    });

    db.update(jobQueueTable)
      .set({ status: "failed", error: extra?.error ?? job.error, retryCount: job.retries, completedAt: new Date() })
      .where(eq(jobQueueTable.jobId, job.id))
      .catch(() => {});
  }
}

function persistEventToDb(event: AgentEvent): void {
  db.insert(agentEventsTable).values({
    eventId: event.id,
    eventType: event.type,
    sourceAgent: event.sourceAgent,
    sourceDomain: event.sourceDomain,
    severity: event.severity,
    dataJson: event.payload as Record<string, unknown>,
    correlationId: event.correlationId,
    createdAt: new Date(event.timestamp),
  }).onConflictDoNothing().catch(err => {
    logger.debug({ err, eventId: event.id }, "Agent event DB insert (non-fatal)");
  });
}

function persistWorkflowStateToDb(ctx: WorkflowContext): void {
  const statusMap: Record<string, "pending" | "running" | "completed" | "completed_with_warnings" | "failed"> = {
    pending: "pending",
    running: "running",
    paused: "running",
    completed: "completed",
    failed: "failed",
    cancelled: "failed",
  };
  const dbStatus = statusMap[ctx.status] ?? "pending";

  db.insert(platformJobRunsTable).values({
    runId: ctx.id,
    workflowType: (ctx.metadata.workflowType as string) ?? "workflow",
    status: dbStatus,
    domain: (ctx.metadata.domain as string) ?? "platform",
    triggeredBy: (ctx.metadata.triggeredBy as string) ?? "system",
    payload: ctx.metadata as Record<string, unknown>,
    error: ctx.error ?? null,
    startedAt: ctx.startedAt ?? null,
    completedAt: ctx.completedAt ?? ctx.failedAt ?? null,
  }).onConflictDoUpdate({
    target: platformJobRunsTable.runId,
    set: {
      status: dbStatus,
      error: ctx.error ?? null,
      startedAt: ctx.startedAt ?? undefined,
      completedAt: ctx.completedAt ?? ctx.failedAt ?? undefined,
    },
  }).catch(err => {
    logger.debug({ err, workflowId: ctx.id }, "Workflow state DB persist (non-fatal)");
  });
}

export function createPersistedWorkflowStateMachine(id: string, metadata: Record<string, unknown> = {}) {
  const sm = new WorkflowStateMachine(id, metadata);
  sm.setDbPersistFn(persistWorkflowStateToDb);
  return sm;
}

export function bootstrapPersistence(): void {
  jobQueue.setDbPersistFn(persistJobToDb);
  agentEventBus.setDbPersistFn(persistEventToDb);
  logger.info("DB persistence wired to job queue and event bus");
}

export async function restoreJobsFromDb(): Promise<void> {
  try {
    const stuckJobs = await db.select().from(jobQueueTable)
      .where(inArray(jobQueueTable.status, ["pending", "running"]))
      .limit(200);

    if (stuckJobs.length === 0) {
      logger.debug("No stuck jobs found in DB to restore");
      return;
    }

    const stuckIds = stuckJobs.map(j => j.jobId);
    await db.update(jobQueueTable)
      .set({ status: "failed", error: "Server restarted — job interrupted", completedAt: new Date() })
      .where(inArray(jobQueueTable.jobId, stuckIds));

    logger.info({ count: stuckJobs.length }, "Marked stuck pending/running jobs as failed on startup (safe recovery)");
  } catch (err) {
    logger.debug({ err }, "restoreJobsFromDb (non-fatal)");
  }
}

export async function updateScheduledJobRun(
  jobName: string,
  status: "completed" | "failed",
  nextRunAt?: Date,
  error?: string,
): Promise<void> {
  try {
    const existing = await db.select().from(scheduledJobRunsTable)
      .where(eq(scheduledJobRunsTable.jobName, jobName)).limit(1);

    const now = new Date();
    if (existing.length === 0) {
      await db.insert(scheduledJobRunsTable).values({
        jobName,
        lastRunAt: now,
        nextRunAt: nextRunAt ?? null,
        status,
        lastError: error ?? null,
        runCount: 1,
        updatedAt: now,
      }).onConflictDoNothing();
    } else {
      await db.update(scheduledJobRunsTable)
        .set({
          lastRunAt: now,
          nextRunAt: nextRunAt ?? null,
          status,
          lastError: error ?? null,
          runCount: (existing[0]?.runCount ?? 0) + 1,
          updatedAt: now,
        })
        .where(eq(scheduledJobRunsTable.jobName, jobName));
    }
  } catch (err) {
    logger.debug({ err, jobName }, "Scheduled job run update (non-fatal)");
  }
}

export async function getScheduledJobLastRun(jobName: string): Promise<Date | null> {
  try {
    const [row] = await db.select().from(scheduledJobRunsTable)
      .where(eq(scheduledJobRunsTable.jobName, jobName)).limit(1);
    return row?.lastRunAt ?? null;
  } catch {
    return null;
  }
}

export async function getScheduledJobNextRunMs(
  jobName: string,
  fallbackIntervalMs: number,
  fallbackNextRun?: Date,
): Promise<number> {
  try {
    const [row] = await db.select().from(scheduledJobRunsTable)
      .where(eq(scheduledJobRunsTable.jobName, jobName)).limit(1);

    if (row?.nextRunAt) {
      const msUntilNext = row.nextRunAt.getTime() - Date.now();
      if (msUntilNext > 0 && msUntilNext < fallbackIntervalMs * 2) {
        logger.debug({ jobName, msUntilNext }, "Recovered scheduled job timing from DB");
        return msUntilNext;
      }
    }
  } catch {
    /* fall through to default */
  }
  return fallbackNextRun ? Math.max(0, fallbackNextRun.getTime() - Date.now()) : fallbackIntervalMs;
}

export async function listDeadLetterJobs(limit = 50) {
  try {
    return await db.select().from(deadLetterJobsTable)
      .orderBy(desc(deadLetterJobsTable.createdAt))
      .limit(limit);
  } catch {
    return [];
  }
}

export async function replayDeadLetterJob(id: number): Promise<{ success: boolean; newJobId?: string; error?: string }> {
  try {
    const [row] = await db.select().from(deadLetterJobsTable)
      .where(eq(deadLetterJobsTable.id, id)).limit(1);

    if (!row) return { success: false, error: "Dead letter job not found" };

    const reEnqueued = await jobQueue.enqueue(row.type, row.payload, { maxRetries: 3 });

    await db.update(deadLetterJobsTable)
      .set({ replayedAt: new Date(), replayJobId: reEnqueued.id, updatedAt: new Date() })
      .where(eq(deadLetterJobsTable.id, id));

    return { success: true, newJobId: reEnqueued.id };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

export async function getEventBusHistory(options: {
  limit?: number;
  type?: string;
  sourceDomain?: string;
  since?: Date;
} = {}) {
  try {
    const conditions = [];
    if (options.type) conditions.push(eq(agentEventsTable.eventType, options.type));
    if (options.sourceDomain) conditions.push(eq(agentEventsTable.sourceDomain, options.sourceDomain));

    const query = db.select().from(agentEventsTable)
      .orderBy(desc(agentEventsTable.createdAt))
      .limit(options.limit ?? 50);

    if (conditions.length > 0) {
      return await query.where(and(...conditions));
    }
    return await query;
  } catch {
    return [];
  }
}
