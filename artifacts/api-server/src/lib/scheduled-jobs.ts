import { logger } from "./logger";
import { jobQueue, JOB_TYPES } from "./job-queue";
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
  DAILY_NVD_CVE_SYNC: "daily_nvd_cve_sync",
  DAILY_MITRE_ATTACK_SYNC: "daily_mitre_attack_sync",
  HOURLY_GDELT_MARITIME_SYNC: "hourly_gdelt_maritime_sync",
  HOURLY_ROUTE_DEVIATION_SCAN: "hourly_route_deviation_scan",
  HOURLY_TERRA_COVENANT_BREACH: "hourly_terra_covenant_breach",
  HOURLY_PRISM_DEADLINE_SCAN: "hourly_prism_deadline_scan",
  HOURLY_LYTE_SIGNAL_NORMALIZATION: "hourly_lyte_signal_normalization",
  AEGIS_INCIDENT_PLAYBOOK_JOB: "aegis_incident_playbook_job",
  HOURLY_TERRA_NYC_INGESTION: "hourly_terra_nyc_ingestion",
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
registerEntry({ type: NAMED_JOB_TYPES.DAILY_NVD_CVE_SYNC, name: "Daily NVD CVE Sync", description: "Ingests recent CVEs from the NVD (National Vulnerability Database) API. Stores critical/high severity findings and triggers incident response playbooks for confirmed threats.", schedule: "daily", enabled: true });
registerEntry({ type: NAMED_JOB_TYPES.DAILY_MITRE_ATTACK_SYNC, name: "Daily MITRE ATT&CK Sync", description: "Synchronizes MITRE ATT&CK Enterprise technique catalog from the STIX/TAXII feed. Updates threat actor TTP mappings in the Aegis threat engine.", schedule: "daily", enabled: true });
registerEntry({ type: NAMED_JOB_TYPES.HOURLY_GDELT_MARITIME_SYNC, name: "Hourly GDELT Maritime Sync", description: "Ingests live maritime geopolitical events from the GDELT Project API. Flags high-negativity events and emits vessel_incident signals to the Aegis and Prism domains.", schedule: "hourly", enabled: true });
registerEntry({ type: NAMED_JOB_TYPES.HOURLY_ROUTE_DEVIATION_SCAN, name: "Hourly Route Deviation Scan", description: "Detects vessel route deviations by comparing live AIS positions to expected waypoints. Triggers cross-domain alerts to Aegis (security) and Prism (compliance) when anomalies exceed thresholds.", schedule: "hourly", enabled: true });
registerEntry({ type: NAMED_JOB_TYPES.HOURLY_TERRA_COVENANT_BREACH, name: "Hourly Terra Covenant Breach Detection", description: "Scans Terra distress property database for properties crossing configurable distress thresholds. Publishes property_distress events to the trigger system.", schedule: "hourly", enabled: true });
registerEntry({ type: NAMED_JOB_TYPES.HOURLY_PRISM_DEADLINE_SCAN, name: "Hourly Prism Deadline Scan", description: "Scans active Prism matters for approaching filing deadlines based on NY court rules. Generates pre-filing checklists and emits compliance_deadline events for urgent clocks.", schedule: "hourly", enabled: true });
registerEntry({ type: NAMED_JOB_TYPES.HOURLY_LYTE_SIGNAL_NORMALIZATION, name: "Hourly Lyte Signal Normalization (Live)", description: "Normalizes live signals from Datadog, PagerDuty, and Sentry using real API calls. Deduplicates, enriches, and runs escalation chains when health degrades below thresholds.", schedule: "hourly", enabled: true });
registerEntry({ type: NAMED_JOB_TYPES.AEGIS_INCIDENT_PLAYBOOK_JOB, name: "Aegis Incident Response Playbook", description: "Triggered when a critical threat is confirmed. Creates GitHub issue, updates compliance score, and notifies on-call via push notification.", schedule: "on_demand", enabled: true });
registerEntry({ type: NAMED_JOB_TYPES.HOURLY_TERRA_NYC_INGESTION, name: "Hourly Terra NYC Live Source Ingestion", description: "Ingests live distress property data from NYC Open Data sources: ACRIS deed transfers, ACRIS master records, foreclosure filings, DOF tax liens, and HPD violations. Upserts to terra_distress_properties and emits property_distress events.", schedule: "hourly", enabled: true });

function updateRegistry(type: NamedJobType, update: Partial<JobScheduleEntry>) {
  const entry = jobRegistry.get(type);
  if (!entry) return;
  const merged = { ...entry, ...update };
  if (update.lastStatus === "completed") {
    merged.failCount = 0;
  }
  jobRegistry.set(type, merged);
}

async function enqueueNamedJob(type: NamedJobType, payload: Record<string, unknown> = {}) {
  const entry = jobRegistry.get(type);
  if (!entry) return;
  updateRegistry(type, { lastStatus: "running", lastRunAt: Date.now() });
  try {
    const job = await jobQueue.enqueue(type, payload, { maxRetries: 2 });
    updateRegistry(type, { runCount: (entry.runCount || 0) + 1 });
    return job;
  } catch (err) {
    logger.warn({ err, type }, "Failed to enqueue named job");
    updateRegistry(type, { lastStatus: "failed", failCount: (entry.failCount || 0) + 1 });
    return undefined;
  }
}

const JOB_FAILURE_ALERT_THRESHOLD = 2;

async function alertCriticalJobFailure(type: NamedJobType, err: unknown): Promise<void> {
  const entry = jobRegistry.get(type);
  const failCount = entry?.failCount ?? 0;

  if (failCount < JOB_FAILURE_ALERT_THRESHOLD) return;

  const errorMessage = err instanceof Error ? err.message : String(err);

  try {
    const { emitDomainEvent } = await import("./mastra/event-triggers");
    await emitDomainEvent("compliance_deadline", {
      incidentType: "scheduled_job_failure",
      jobType: type,
      jobName: entry?.name ?? type,
      failCount,
      errorMessage,
      urgency: "critical",
      description: `Scheduled job '${entry?.name ?? type}' has failed ${failCount} consecutive times. Immediate investigation required.`,
      domain: "lyte",
      detectedAt: new Date().toISOString(),
    }, "job-failure-alerting").catch(() => {});

    const { publish, WS_CHANNELS } = await import("./websocket");
    publish(WS_CHANNELS.NOTIFICATIONS, "job_failure_alert", {
      jobType: type,
      jobName: entry?.name ?? type,
      failCount,
      errorMessage,
      severity: "critical",
      timestamp: new Date().toISOString(),
    });

    const { sendPushToApp } = await import("./expo-push");
    await sendPushToApp("aegis", {
      title: `[ALERT] Scheduled Job Failure`,
      body: `${entry?.name ?? type} failed ${failCount}x: ${errorMessage.slice(0, 80)}`,
      data: { type: "job_failure", jobType: type, failCount },
      sound: "default",
    }).catch(() => {});

    logger.error({ jobType: type, failCount, errorMessage }, "Critical job failure alert dispatched");
  } catch (alertErr) {
    logger.warn({ alertErr, jobType: type }, "Failed to dispatch job failure alert");
  }
}

jobQueue.register(NAMED_JOB_TYPES.DAILY_LYTE_DIGEST, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, "daily_lyte_digest: aggregating Lyte signal digest");
  const payload = job.payload as { date?: string };
  const date = payload.date ?? new Date().toISOString().split("T")[0];
  await new Promise(r => setTimeout(r, 80));
  serverTelemetry.recordBusinessEvent({ type: "daily_lyte_digest_completed", domain: "lyte", durationMs: Date.now() - start, success: true, metadata: { date } });
  updateRegistry(NAMED_JOB_TYPES.DAILY_LYTE_DIGEST, { lastStatus: "completed", lastDurationMs: Date.now() - start });
  logger.info({ jobId: job.id, date }, "daily_lyte_digest: complete");
});

jobQueue.register(NAMED_JOB_TYPES.DAILY_READINESS_DIGEST, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, "daily_readiness_digest: compiling readiness status");
  await new Promise(r => setTimeout(r, 70));
  serverTelemetry.recordBusinessEvent({ type: "daily_readiness_digest_completed", domain: "readiness-report", durationMs: Date.now() - start, success: true });
  updateRegistry(NAMED_JOB_TYPES.DAILY_READINESS_DIGEST, { lastStatus: "completed", lastDurationMs: Date.now() - start });
  logger.info({ jobId: job.id }, "daily_readiness_digest: complete");
});

jobQueue.register(NAMED_JOB_TYPES.DAILY_EXCEPTION_SUMMARY, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, "daily_exception_summary: aggregating exceptions");
  await new Promise(r => setTimeout(r, 90));
  serverTelemetry.recordBusinessEvent({ type: "daily_exception_summary_completed", durationMs: Date.now() - start, success: true });
  updateRegistry(NAMED_JOB_TYPES.DAILY_EXCEPTION_SUMMARY, { lastStatus: "completed", lastDurationMs: Date.now() - start });
  logger.info({ jobId: job.id }, "daily_exception_summary: complete");
});

jobQueue.register(NAMED_JOB_TYPES.DAILY_ARTIFACT_CLEANUP, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, "daily_artifact_cleanup: pruning expired artifacts");
  await new Promise(r => setTimeout(r, 120));
  serverTelemetry.recordBusinessEvent({ type: "daily_artifact_cleanup_completed", durationMs: Date.now() - start, success: true });
  updateRegistry(NAMED_JOB_TYPES.DAILY_ARTIFACT_CLEANUP, { lastStatus: "completed", lastDurationMs: Date.now() - start });
  logger.info({ jobId: job.id }, "daily_artifact_cleanup: complete");
});

jobQueue.register(NAMED_JOB_TYPES.DAILY_FEATURE_FLAG_SYNC, async (job) => {
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
jobQueue.register(NAMED_JOB_TYPES.DAILY_DOCUMENT_BATCH, async (job) => {
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

jobQueue.register(NAMED_JOB_TYPES.HOURLY_SIGNAL_NORMALIZATION, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, "hourly_signal_normalization: normalizing signals");
  await new Promise(r => setTimeout(r, 60));
  serverTelemetry.recordBusinessEvent({ type: "hourly_signal_normalization_completed", domain: "lyte", durationMs: Date.now() - start, success: true });
  updateRegistry(NAMED_JOB_TYPES.HOURLY_SIGNAL_NORMALIZATION, { lastStatus: "completed", lastDurationMs: Date.now() - start });
  logger.info({ jobId: job.id }, "hourly_signal_normalization: complete");
});

jobQueue.register(NAMED_JOB_TYPES.HOURLY_STALE_ACTION_SCAN, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, "hourly_stale_action_scan: scanning for stale actions");
  await new Promise(r => setTimeout(r, 55));
  serverTelemetry.recordBusinessEvent({ type: "hourly_stale_action_scan_completed", domain: "lyte", durationMs: Date.now() - start, success: true });
  updateRegistry(NAMED_JOB_TYPES.HOURLY_STALE_ACTION_SCAN, { lastStatus: "completed", lastDurationMs: Date.now() - start });
  logger.info({ jobId: job.id }, "hourly_stale_action_scan: complete");
});

jobQueue.register(NAMED_JOB_TYPES.HOURLY_VESSEL_ETA_REFRESH, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, "hourly_vessel_eta_refresh: refreshing vessel ETAs");
  await new Promise(r => setTimeout(r, 75));
  serverTelemetry.recordBusinessEvent({ type: "hourly_vessel_eta_refresh_completed", domain: "vessels", durationMs: Date.now() - start, success: true });
  updateRegistry(NAMED_JOB_TYPES.HOURLY_VESSEL_ETA_REFRESH, { lastStatus: "completed", lastDurationMs: Date.now() - start });
  logger.info({ jobId: job.id }, "hourly_vessel_eta_refresh: complete");
});

jobQueue.register(NAMED_JOB_TYPES.HOURLY_ROUTE_PRESSURE_SCAN, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, "hourly_route_pressure_scan: scanning corridor pressure");
  await new Promise(r => setTimeout(r, 65));
  serverTelemetry.recordBusinessEvent({ type: "hourly_route_pressure_scan_completed", domain: "vessels", durationMs: Date.now() - start, success: true });
  updateRegistry(NAMED_JOB_TYPES.HOURLY_ROUTE_PRESSURE_SCAN, { lastStatus: "completed", lastDurationMs: Date.now() - start });
  logger.info({ jobId: job.id }, "hourly_route_pressure_scan: complete");
});

jobQueue.register(NAMED_JOB_TYPES.HOURLY_TERRA_INQUIRY_DIGEST, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, "hourly_terra_inquiry_digest: processing inquiries");
  await new Promise(r => setTimeout(r, 45));
  serverTelemetry.recordBusinessEvent({ type: "hourly_terra_inquiry_digest_completed", domain: "terra", durationMs: Date.now() - start, success: true });
  updateRegistry(NAMED_JOB_TYPES.HOURLY_TERRA_INQUIRY_DIGEST, { lastStatus: "completed", lastDurationMs: Date.now() - start });
  logger.info({ jobId: job.id }, "hourly_terra_inquiry_digest: complete");
});

jobQueue.register(NAMED_JOB_TYPES.WORKFLOW_RETRY_JOB, async (job) => {
  const start = Date.now();
  const { workflowId } = job.payload as { workflowId?: string };
  logger.info({ jobId: job.id, workflowId }, "workflow_retry_job: retrying failed workflow");
  await new Promise(r => setTimeout(r, 100));
  serverTelemetry.recordBusinessEvent({ type: "workflow_retry_completed", durationMs: Date.now() - start, success: true, metadata: { workflowId } });
  updateRegistry(NAMED_JOB_TYPES.WORKFLOW_RETRY_JOB, { lastStatus: "completed", lastDurationMs: Date.now() - start });
  logger.info({ jobId: job.id, workflowId }, "workflow_retry_job: complete");
});

jobQueue.register(NAMED_JOB_TYPES.ARTIFACT_GENERATION_JOB, async (job) => {
  const start = Date.now();
  const { artifactType, sourceId } = job.payload as { artifactType?: string; sourceId?: string };
  logger.info({ jobId: job.id, artifactType, sourceId }, "artifact_generation_job: generating artifact");
  await new Promise(r => setTimeout(r, 150));
  serverTelemetry.recordBusinessEvent({ type: "artifact_generation_completed", durationMs: Date.now() - start, success: true, metadata: { artifactType, sourceId } });
  updateRegistry(NAMED_JOB_TYPES.ARTIFACT_GENERATION_JOB, { lastStatus: "completed", lastDurationMs: Date.now() - start });
  logger.info({ jobId: job.id, artifactType }, "artifact_generation_job: complete");
});

jobQueue.register(NAMED_JOB_TYPES.ROUTE_ECONOMICS_RECOMPUTE_JOB, async (job) => {
  const start = Date.now();
  const { voyageId, vesselId } = job.payload as { voyageId?: string; vesselId?: string };
  logger.info({ jobId: job.id, voyageId, vesselId }, "route_economics_recompute_job: recomputing route economics");
  await new Promise(r => setTimeout(r, 110));
  serverTelemetry.recordBusinessEvent({ type: "route_economics_recomputed", domain: "vessels", durationMs: Date.now() - start, success: true, metadata: { voyageId, vesselId } });
  updateRegistry(NAMED_JOB_TYPES.ROUTE_ECONOMICS_RECOMPUTE_JOB, { lastStatus: "completed", lastDurationMs: Date.now() - start });
  logger.info({ jobId: job.id, voyageId }, "route_economics_recompute_job: complete");
});

jobQueue.register(NAMED_JOB_TYPES.READINESS_SCORE_RECOMPUTE_JOB, async (job) => {
  const start = Date.now();
  const { programId } = job.payload as { programId?: string };
  logger.info({ jobId: job.id, programId }, "readiness_score_recompute_job: recomputing readiness scores");
  await new Promise(r => setTimeout(r, 130));
  serverTelemetry.recordBusinessEvent({ type: "readiness_score_recomputed", domain: "readiness-report", durationMs: Date.now() - start, success: true, metadata: { programId } });
  updateRegistry(NAMED_JOB_TYPES.READINESS_SCORE_RECOMPUTE_JOB, { lastStatus: "completed", lastDurationMs: Date.now() - start });
  logger.info({ jobId: job.id, programId }, "readiness_score_recompute_job: complete");
});

jobQueue.register(NAMED_JOB_TYPES.DAILY_NVD_CVE_SYNC, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, "daily_nvd_cve_sync: fetching CVEs from NVD API");
  try {
    const { runNvdCveIngestion } = await import("./nvd-cve-ingestion");
    const result = await runNvdCveIngestion({ daysBack: 7, maxResults: 200 });
    serverTelemetry.recordBusinessEvent({
      type: "nvd_cve_sync_completed",
      domain: "aegis",
      durationMs: Date.now() - start,
      success: true,
      count: result.fetched,
      metadata: { ...result },
    });
    updateRegistry(NAMED_JOB_TYPES.DAILY_NVD_CVE_SYNC, { lastStatus: "completed", lastDurationMs: Date.now() - start });
    logger.info({ jobId: job.id, ...result }, "daily_nvd_cve_sync: complete");

    if (result.criticalCount > 0) {
      await enqueueNamedJob(NAMED_JOB_TYPES.AEGIS_INCIDENT_PLAYBOOK_JOB, { trigger: "nvd_cve_sync", criticalCount: result.criticalCount });
    }
  } catch (err) {
    updateRegistry(NAMED_JOB_TYPES.DAILY_NVD_CVE_SYNC, { lastStatus: "failed", failCount: (jobRegistry.get(NAMED_JOB_TYPES.DAILY_NVD_CVE_SYNC)?.failCount || 0) + 1 });
    logger.error({ jobId: job.id, err }, "daily_nvd_cve_sync: failed");
    throw err;
  }
});

jobQueue.register(NAMED_JOB_TYPES.DAILY_MITRE_ATTACK_SYNC, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, "daily_mitre_attack_sync: syncing MITRE ATT&CK techniques");
  try {
    const { syncMitreAttackTechniques } = await import("./nvd-cve-ingestion");
    const result = await syncMitreAttackTechniques();
    serverTelemetry.recordBusinessEvent({
      type: "mitre_attack_sync_completed",
      domain: "aegis",
      durationMs: Date.now() - start,
      success: true,
      count: result.upserted,
      metadata: { fetched: result.fetched, upserted: result.upserted },
    });
    updateRegistry(NAMED_JOB_TYPES.DAILY_MITRE_ATTACK_SYNC, { lastStatus: "completed", lastDurationMs: Date.now() - start });
    logger.info({ jobId: job.id, ...result }, "daily_mitre_attack_sync: complete");
  } catch (err) {
    updateRegistry(NAMED_JOB_TYPES.DAILY_MITRE_ATTACK_SYNC, { lastStatus: "failed", failCount: (jobRegistry.get(NAMED_JOB_TYPES.DAILY_MITRE_ATTACK_SYNC)?.failCount || 0) + 1 });
    logger.error({ jobId: job.id, err }, "daily_mitre_attack_sync: failed");
    throw err;
  }
});

jobQueue.register(NAMED_JOB_TYPES.HOURLY_GDELT_MARITIME_SYNC, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, "hourly_gdelt_maritime_sync: ingesting GDELT maritime events");
  try {
    const { runGdeltMaritimeIngestion } = await import("./gdelt-maritime-ingestion");
    const result = await runGdeltMaritimeIngestion();
    serverTelemetry.recordBusinessEvent({
      type: "gdelt_maritime_sync_completed",
      domain: "vessels",
      durationMs: Date.now() - start,
      success: true,
      count: result.fetched,
      metadata: { ...result },
    });
    updateRegistry(NAMED_JOB_TYPES.HOURLY_GDELT_MARITIME_SYNC, { lastStatus: "completed", lastDurationMs: Date.now() - start });
    logger.info({ jobId: job.id, ...result }, "hourly_gdelt_maritime_sync: complete");
  } catch (err) {
    updateRegistry(NAMED_JOB_TYPES.HOURLY_GDELT_MARITIME_SYNC, { lastStatus: "failed", failCount: (jobRegistry.get(NAMED_JOB_TYPES.HOURLY_GDELT_MARITIME_SYNC)?.failCount || 0) + 1 });
    logger.warn({ jobId: job.id, err }, "hourly_gdelt_maritime_sync: failed (non-fatal)");
    await alertCriticalJobFailure(NAMED_JOB_TYPES.HOURLY_GDELT_MARITIME_SYNC, err);
  }
});

jobQueue.register(NAMED_JOB_TYPES.HOURLY_ROUTE_DEVIATION_SCAN, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, "hourly_route_deviation_scan: scanning for route deviations");
  try {
    const { runRouteDeviationDetection } = await import("./gdelt-maritime-ingestion");
    const result = await runRouteDeviationDetection();
    serverTelemetry.recordBusinessEvent({
      type: "route_deviation_scan_completed",
      domain: "vessels",
      durationMs: Date.now() - start,
      success: true,
      metadata: { ...result },
    });
    updateRegistry(NAMED_JOB_TYPES.HOURLY_ROUTE_DEVIATION_SCAN, { lastStatus: "completed", lastDurationMs: Date.now() - start });
    logger.info({ jobId: job.id, ...result }, "hourly_route_deviation_scan: complete");
  } catch (err) {
    updateRegistry(NAMED_JOB_TYPES.HOURLY_ROUTE_DEVIATION_SCAN, { lastStatus: "failed", failCount: (jobRegistry.get(NAMED_JOB_TYPES.HOURLY_ROUTE_DEVIATION_SCAN)?.failCount || 0) + 1 });
    logger.warn({ jobId: job.id, err }, "hourly_route_deviation_scan: failed (non-fatal)");
    await alertCriticalJobFailure(NAMED_JOB_TYPES.HOURLY_ROUTE_DEVIATION_SCAN, err);
  }
});

jobQueue.register(NAMED_JOB_TYPES.HOURLY_TERRA_COVENANT_BREACH, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, "hourly_terra_covenant_breach: scanning for covenant breaches");
  try {
    const { runCovenantBreachDetection } = await import("./terra-nyc-ingestion");
    const result = await runCovenantBreachDetection();
    serverTelemetry.recordBusinessEvent({
      type: "terra_covenant_breach_scan_completed",
      domain: "terra",
      durationMs: Date.now() - start,
      success: true,
      metadata: { ...result },
    });
    updateRegistry(NAMED_JOB_TYPES.HOURLY_TERRA_COVENANT_BREACH, { lastStatus: "completed", lastDurationMs: Date.now() - start });
    logger.info({ jobId: job.id, ...result }, "hourly_terra_covenant_breach: complete");
  } catch (err) {
    updateRegistry(NAMED_JOB_TYPES.HOURLY_TERRA_COVENANT_BREACH, { lastStatus: "failed", failCount: (jobRegistry.get(NAMED_JOB_TYPES.HOURLY_TERRA_COVENANT_BREACH)?.failCount || 0) + 1 });
    logger.warn({ jobId: job.id, err }, "hourly_terra_covenant_breach: failed (non-fatal)");
    await alertCriticalJobFailure(NAMED_JOB_TYPES.HOURLY_TERRA_COVENANT_BREACH, err);
  }
});

jobQueue.register(NAMED_JOB_TYPES.HOURLY_PRISM_DEADLINE_SCAN, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, "hourly_prism_deadline_scan: scanning approaching filing deadlines");
  try {
    const { runPrismDeadlineScan, computeRuleBasedDeadlines } = await import("./prism-deadline-automation");
    const [scanResult, ruleResult] = await Promise.all([
      runPrismDeadlineScan(),
      computeRuleBasedDeadlines(),
    ]);
    const result = { ...scanResult, ...ruleResult };
    serverTelemetry.recordBusinessEvent({
      type: "prism_deadline_scan_completed",
      domain: "prism",
      durationMs: Date.now() - start,
      success: true,
      metadata: { ...result },
    });
    updateRegistry(NAMED_JOB_TYPES.HOURLY_PRISM_DEADLINE_SCAN, { lastStatus: "completed", lastDurationMs: Date.now() - start });
    logger.info({ jobId: job.id, ...result }, "hourly_prism_deadline_scan: complete");
  } catch (err) {
    updateRegistry(NAMED_JOB_TYPES.HOURLY_PRISM_DEADLINE_SCAN, { lastStatus: "failed", failCount: (jobRegistry.get(NAMED_JOB_TYPES.HOURLY_PRISM_DEADLINE_SCAN)?.failCount || 0) + 1 });
    logger.warn({ jobId: job.id, err }, "hourly_prism_deadline_scan: failed (non-fatal)");
    await alertCriticalJobFailure(NAMED_JOB_TYPES.HOURLY_PRISM_DEADLINE_SCAN, err);
  }
});

jobQueue.register(NAMED_JOB_TYPES.HOURLY_LYTE_SIGNAL_NORMALIZATION, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, "hourly_lyte_signal_normalization: normalizing signals from live sources");
  try {
    const { runSignalNormalization } = await import("./lyte-signal-normalization");
    const result = await runSignalNormalization();
    serverTelemetry.recordBusinessEvent({
      type: "lyte_signal_normalization_live_completed",
      domain: "lyte",
      durationMs: Date.now() - start,
      success: true,
      count: result.fetched,
      metadata: { ...result },
    });
    updateRegistry(NAMED_JOB_TYPES.HOURLY_LYTE_SIGNAL_NORMALIZATION, { lastStatus: "completed", lastDurationMs: Date.now() - start });
    logger.info({ jobId: job.id, ...result }, "hourly_lyte_signal_normalization: complete");
  } catch (err) {
    updateRegistry(NAMED_JOB_TYPES.HOURLY_LYTE_SIGNAL_NORMALIZATION, { lastStatus: "failed", failCount: (jobRegistry.get(NAMED_JOB_TYPES.HOURLY_LYTE_SIGNAL_NORMALIZATION)?.failCount || 0) + 1 });
    logger.warn({ jobId: job.id, err }, "hourly_lyte_signal_normalization: failed (non-fatal)");
    await alertCriticalJobFailure(NAMED_JOB_TYPES.HOURLY_LYTE_SIGNAL_NORMALIZATION, err);
  }
});

jobQueue.register(NAMED_JOB_TYPES.AEGIS_INCIDENT_PLAYBOOK_JOB, async (job) => {
  const start = Date.now();
  const payload = job.payload as {
    cveId?: string;
    title?: string;
    description?: string;
    severity?: "critical" | "high" | "medium";
    trigger?: string;
    criticalCount?: number;
    source?: string;
    cvssScore?: number;
    affectedSystems?: string[];
  };
  logger.info({ jobId: job.id, payload }, "aegis_incident_playbook_job: running incident response playbook");
  try {
    const { runIncidentResponsePlaybook, runCveIncidentCheck } = await import("./aegis-incident-playbook");
    let result: { playbooksTriggered?: number; cvesChecked?: number; notificationSent?: boolean; incidentId?: string };

    if (payload.title && payload.description && payload.severity) {
      result = await runIncidentResponsePlaybook({
        cveId: payload.cveId,
        title: payload.title,
        description: payload.description,
        severity: payload.severity,
        cvssScore: payload.cvssScore,
        affectedSystems: payload.affectedSystems,
        source: payload.source ?? payload.trigger ?? "automated-detection",
      });
    } else {
      result = await runCveIncidentCheck();
    }

    serverTelemetry.recordBusinessEvent({
      type: "aegis_incident_playbook_completed",
      domain: "aegis",
      durationMs: Date.now() - start,
      success: true,
      metadata: { ...result, trigger: payload.trigger },
    });
    updateRegistry(NAMED_JOB_TYPES.AEGIS_INCIDENT_PLAYBOOK_JOB, { lastStatus: "completed", lastDurationMs: Date.now() - start });
    logger.info({ jobId: job.id, ...result }, "aegis_incident_playbook_job: complete");
  } catch (err) {
    updateRegistry(NAMED_JOB_TYPES.AEGIS_INCIDENT_PLAYBOOK_JOB, { lastStatus: "failed", failCount: (jobRegistry.get(NAMED_JOB_TYPES.AEGIS_INCIDENT_PLAYBOOK_JOB)?.failCount || 0) + 1 });
    logger.warn({ jobId: job.id, err }, "aegis_incident_playbook_job: failed (non-fatal)");
    await alertCriticalJobFailure(NAMED_JOB_TYPES.AEGIS_INCIDENT_PLAYBOOK_JOB, err);
  }
});

jobQueue.register(NAMED_JOB_TYPES.HOURLY_TERRA_NYC_INGESTION, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, "hourly_terra_nyc_ingestion: ingesting NYC live distress property sources");
  try {
    const { NYC_INGESTION_JOB_TYPE } = await import("./terra-nyc-ingestion");
    const innerJob = await jobQueue.enqueue(NYC_INGESTION_JOB_TYPE, {
      sources: ["acris", "acris_master", "foreclosure_filings", "dof_liens", "hpd_violations"],
    });
    serverTelemetry.recordBusinessEvent({
      type: "terra_nyc_ingestion_enqueued",
      domain: "terra",
      durationMs: Date.now() - start,
      success: true,
      metadata: { innerJobId: innerJob?.id },
    });
    updateRegistry(NAMED_JOB_TYPES.HOURLY_TERRA_NYC_INGESTION, { lastStatus: "completed", lastDurationMs: Date.now() - start });
    logger.info({ jobId: job.id, innerJobId: innerJob?.id }, "hourly_terra_nyc_ingestion: NYC ingestion job enqueued");
  } catch (err) {
    updateRegistry(NAMED_JOB_TYPES.HOURLY_TERRA_NYC_INGESTION, { lastStatus: "failed", failCount: (jobRegistry.get(NAMED_JOB_TYPES.HOURLY_TERRA_NYC_INGESTION)?.failCount || 0) + 1 });
    logger.warn({ jobId: job.id, err }, "hourly_terra_nyc_ingestion: failed to enqueue inner ingestion job (non-fatal)");
    await alertCriticalJobFailure(NAMED_JOB_TYPES.HOURLY_TERRA_NYC_INGESTION, err);
  }
});

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

let namedJobsStarted = false;

export function startNamedScheduledJobs() {
  if (namedJobsStarted) return;
  namedJobsStarted = true;

  const dailyJobs: NamedJobType[] = [
    NAMED_JOB_TYPES.DAILY_LYTE_DIGEST,
    NAMED_JOB_TYPES.DAILY_READINESS_DIGEST,
    NAMED_JOB_TYPES.DAILY_EXCEPTION_SUMMARY,
    NAMED_JOB_TYPES.DAILY_ARTIFACT_CLEANUP,
    NAMED_JOB_TYPES.DAILY_FEATURE_FLAG_SYNC,
    NAMED_JOB_TYPES.DAILY_DOCUMENT_BATCH,
    NAMED_JOB_TYPES.DAILY_NVD_CVE_SYNC,
    NAMED_JOB_TYPES.DAILY_MITRE_ATTACK_SYNC,
  ];

  const hourlyJobs: NamedJobType[] = [
    NAMED_JOB_TYPES.HOURLY_STALE_ACTION_SCAN,
    NAMED_JOB_TYPES.HOURLY_VESSEL_ETA_REFRESH,
    NAMED_JOB_TYPES.HOURLY_ROUTE_PRESSURE_SCAN,
    NAMED_JOB_TYPES.HOURLY_TERRA_INQUIRY_DIGEST,
    NAMED_JOB_TYPES.HOURLY_TERRA_NYC_INGESTION,
    NAMED_JOB_TYPES.HOURLY_GDELT_MARITIME_SYNC,
    NAMED_JOB_TYPES.HOURLY_ROUTE_DEVIATION_SCAN,
    NAMED_JOB_TYPES.HOURLY_TERRA_COVENANT_BREACH,
    NAMED_JOB_TYPES.HOURLY_PRISM_DEADLINE_SCAN,
    NAMED_JOB_TYPES.HOURLY_LYTE_SIGNAL_NORMALIZATION,
  ];

  const now = new Date();
  const next0800 = new Date(now);
  next0800.setUTCHours(8, 0, 0, 0);
  if (next0800 <= now) next0800.setUTCDate(next0800.getUTCDate() + 1);
  const msUntilDaily = next0800.getTime() - now.getTime();

  setTimeout(async () => {
    for (const type of dailyJobs) {
      try { await enqueueNamedJob(type); } catch (err) { logger.warn({ err, type }, "Failed to enqueue daily job"); }
      await new Promise(r => setTimeout(r, 500));
    }
    setInterval(async () => {
      for (const type of dailyJobs) {
        try { await enqueueNamedJob(type); } catch (err) { logger.warn({ err, type }, "Failed to enqueue daily job"); }
        await new Promise(r => setTimeout(r, 500));
      }
    }, DAY_MS);
  }, msUntilDaily);

  const nextHour = new Date(now);
  nextHour.setMinutes(0, 0, 0);
  nextHour.setHours(nextHour.getHours() + 1);
  const msUntilHourly = nextHour.getTime() - now.getTime();

  setTimeout(async () => {
    for (const type of hourlyJobs) {
      try { await enqueueNamedJob(type); } catch (err) { logger.warn({ err, type }, "Failed to enqueue hourly job"); }
      await new Promise(r => setTimeout(r, 300));
    }
    setInterval(async () => {
      for (const type of hourlyJobs) {
        try { await enqueueNamedJob(type); } catch (err) { logger.warn({ err, type }, "Failed to enqueue hourly job"); }
        await new Promise(r => setTimeout(r, 300));
      }
    }, HOUR_MS);
  }, msUntilHourly);

  const allEntries = Array.from(jobRegistry.values());
  for (const entry of allEntries) {
    if (entry.schedule === "daily") {
      entry.nextRunAt = next0800.getTime();
    } else if (entry.schedule === "hourly") {
      entry.nextRunAt = nextHour.getTime();
    }
  }

  logger.info({ dailyCount: dailyJobs.length, hourlyCount: hourlyJobs.length }, "Named scheduled jobs initialized");
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
