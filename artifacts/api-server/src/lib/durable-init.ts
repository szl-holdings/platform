import { logger } from "./logger";
import { durableJobQueue, type ScheduleDefinition } from "@szl-holdings/forge-runtime";
import { durableScheduler, seedDefaultSchedules } from "@szl-holdings/forge-runtime";
import { publish, WS_CHANNELS } from "./websocket";
import { serverTelemetry } from "@szl-holdings/observability";
import { JOB_TYPES } from "./job-queue";
import { NAMED_JOB_TYPES } from "./scheduled-jobs";
import { PLATFORM_JOB_TYPES } from "./platform-jobs";
import { db, pool, dataRetentionPoliciesTable, dataRetentionAuditLogTable } from "@szl-holdings/db";
import { eq, and } from "drizzle-orm";
import { NYC_INGESTION_JOB_TYPE } from "./terra-nyc-ingestion";
import { NYC_EXTENDED_INGESTION_JOB_TYPE } from "./terra-nyc-extended-ingestion";

durableJobQueue.setPublishFn(publish);

durableJobQueue.configureQueue("critical", { concurrency: 10, pollIntervalMs: 500 });
durableJobQueue.configureQueue("high", { concurrency: 8, pollIntervalMs: 1000 });
durableJobQueue.configureQueue("default", { concurrency: 5, pollIntervalMs: 2000 });
durableJobQueue.configureQueue("low", { concurrency: 2, pollIntervalMs: 5000 });
durableJobQueue.configureQueue("agents", { concurrency: 3, pollIntervalMs: 2000 });

durableJobQueue.register(JOB_TYPES.WEBHOOK_DELIVERY, async (job) => {
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

durableJobQueue.register(JOB_TYPES.REPORT_GENERATION, async (job) => {
  const { reportType } = job.payload as { reportType: string };
  logger.info({ jobId: job.id, reportType }, "Report generation job started");
  await new Promise(r => setTimeout(r, 100));
  logger.info({ jobId: job.id, reportType }, "Report generation completed");
});

durableJobQueue.register(JOB_TYPES.NOTIFICATION_DISPATCH, async (job) => {
  const { userId, message, channel } = job.payload as { userId: number; message: string; channel: string };
  logger.info({ jobId: job.id, userId, channel }, "Notification dispatch job");
  publish(WS_CHANNELS.NOTIFICATIONS, "notification", { userId, message, channel });
});

durableJobQueue.register(JOB_TYPES.EMAIL_SEND, async (job) => {
  const { to, subject } = job.payload as { to: string; subject: string };
  logger.info({ jobId: job.id, to, subject }, "Email send job (no-op in demo mode)");
});

durableJobQueue.register(JOB_TYPES.DAILY_DIGEST, async (job) => {
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

durableJobQueue.register(JOB_TYPES.HEALTH_SCAN, async (job) => {
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
  }

  if (p95High) {
    serverTelemetry.raiseAlert({
      type: "high_latency",
      message: `API P95 latency is ${snapshot.p95Latency.toFixed(0)}ms — exceeds 2000ms threshold`,
      severity: "warning",
      metadata: { p95Latency: snapshot.p95Latency, threshold: 2000 },
    });
  }

  serverTelemetry.recordBusinessEvent({
    type: "health_scan_completed",
    success: !errorRateHigh,
    metadata: { services: serviceList, alertsRaised: errorRateHigh || p95High ? 1 : 0 },
  });
  logger.info({ jobId: job.id }, "Health scan completed");
});

durableJobQueue.register(JOB_TYPES.ALERT_CHECK, async (job) => {
  const activeAlerts = serverTelemetry.getActiveAlerts();
  logger.info({ jobId: job.id, alertCount: activeAlerts.length }, "Alert check completed");
  serverTelemetry.recordBusinessEvent({
    type: "alert_check_completed",
    count: activeAlerts.length,
    metadata: { activeAlerts: activeAlerts.map((a) => a.type) },
  });
});

durableJobQueue.register(JOB_TYPES.READINESS_CHECK, async (job) => {
  const { program } = job.payload as { program?: string };
  logger.info({ jobId: job.id, program }, "Readiness check job started");
  serverTelemetry.recordBusinessEvent({
    type: "readiness_check_completed",
    metadata: { program },
  });
});

durableJobQueue.register(JOB_TYPES.DAILY_CERTIFICATION_TASK_DIGEST, async (job) => {
  logger.info({ jobId: job.id }, "Daily certification task digest started");
  serverTelemetry.recordBusinessEvent({
    type: "daily_certification_task_digest",
    metadata: { jobId: job.id },
  });
});

durableJobQueue.register(JOB_TYPES.DAILY_CAPITAL_READINESS_DIGEST, async (job) => {
  logger.info({ jobId: job.id }, "Daily capital readiness digest started");
  serverTelemetry.recordBusinessEvent({
    type: "daily_capital_readiness_digest",
    metadata: { jobId: job.id },
  });
});

durableJobQueue.register(JOB_TYPES.LENDER_PACKET_GENERATE, async (job) => {
  const { packetId, lenderType } = job.payload as { packetId?: number; lenderType?: string };
  logger.info({ jobId: job.id, packetId, lenderType }, "Lender packet generate job started");
  await new Promise(r => setTimeout(r, 50));
  serverTelemetry.recordBusinessEvent({
    type: "lender_packet_generated",
    metadata: { jobId: job.id, packetId, lenderType },
  });
  logger.info({ jobId: job.id, packetId }, "Lender packet generate job complete");
});

durableJobQueue.register(JOB_TYPES.INVESTOR_PACKET_GENERATE, async (job) => {
  const { packetId, investorType } = job.payload as { packetId?: number; investorType?: string };
  logger.info({ jobId: job.id, packetId, investorType }, "Investor packet generate job started");
  await new Promise(r => setTimeout(r, 50));
  serverTelemetry.recordBusinessEvent({
    type: "investor_packet_generated",
    metadata: { jobId: job.id, packetId, investorType },
  });
  logger.info({ jobId: job.id, packetId }, "Investor packet generate job complete");
});

durableJobQueue.register(JOB_TYPES.HOURLY_MLS_LISTING_SYNC, async (job) => {
  logger.info({ jobId: job.id }, "Hourly MLS listing sync started");
  const { runMlsListingSync } = await import("./terra-enterprise-ingestion");
  const result = await runMlsListingSync();
  serverTelemetry.recordBusinessEvent({
    type: "mls_listing_sync_completed",
    count: result.upserted,
    metadata: { fetched: result.fetched, upserted: result.upserted, errors: result.errors, demoMode: result.demoMode },
  });
  logger.info({ jobId: job.id, ...result }, "Hourly MLS listing sync completed");
});

durableJobQueue.register(JOB_TYPES.DAILY_COMMERCIAL_DATA_REFRESH, async (job) => {
  logger.info({ jobId: job.id }, "Daily commercial data refresh started");
  const { runCommercialDataRefresh } = await import("./terra-enterprise-ingestion");
  const result = await runCommercialDataRefresh();
  serverTelemetry.recordBusinessEvent({
    type: "commercial_data_refresh_completed",
    metadata: { costar: result.costar, compstak: result.compstak },
  });
  logger.info({ jobId: job.id, ...result }, "Daily commercial data refresh completed");
});

durableJobQueue.register(PLATFORM_JOB_TYPES.DATA_RETENTION_SWEEP, async (job) => {
  logger.info({ jobId: job.id }, "Data retention sweep started");
  const policies = await db
    .select()
    .from(dataRetentionPoliciesTable)
    .where(eq(dataRetentionPoliciesTable.isActive, true));

  let totalProcessed = 0;
  let failed = 0;

  for (const policy of policies) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);
    let affectedRows = 0;
    let status: "success" | "failure" = "success";
    let errorMessage: string | null = null;

    try {
      const TABLE_CONFIG: Record<string, { hasTenantCol: boolean; piiColumns: Record<string, string> | null }> = {
        audit_events: { hasTenantCol: true, piiColumns: null },
        activity_log: { hasTenantCol: true, piiColumns: null },
        usage_events: { hasTenantCol: true, piiColumns: null },
        connector_logs: { hasTenantCol: false, piiColumns: null },
        webhook_events: { hasTenantCol: true, piiColumns: null },
        sessions: { hasTenantCol: false, piiColumns: null },
        notifications: { hasTenantCol: false, piiColumns: null },
        platform_contact_requests: { hasTenantCol: false, piiColumns: { email: "redacted@purged.invalid", name: "Purged User" } },
        support_tickets: { hasTenantCol: true, piiColumns: { submitter_email: "redacted@purged.invalid", submitter_name: "Purged User" } },
      };
      if (!TABLE_CONFIG[policy.tableName]) {
        logger.error({ tableName: policy.tableName, policyId: policy.id }, "Retention sweep: tableName not in allowlist — skipping");
        failed++;
        continue;
      }
      const tableConf = TABLE_CONFIG[policy.tableName]!;
      const TABLES_WITH_ORG_ID = new Set(Object.entries(TABLE_CONFIG).filter(([, v]) => v.hasTenantCol).map(([k]) => k));
      const hasTenantCol = TABLES_WITH_ORG_ID.has(policy.tableName) && policy.orgId != null;
      const tenantFilter = hasTenantCol ? ` AND org_id = $2` : "";
      const params: (string | number)[] = [cutoffDate.toISOString()];
      if (hasTenantCol && policy.orgId != null) params.push(policy.orgId);

      if (policy.purgeStrategy === "delete") {
        const result = await pool.query(
          `DELETE FROM "${policy.tableName}" WHERE created_at < $1${tenantFilter}`,
          params
        );
        affectedRows = result.rowCount ?? 0;
      } else if (policy.purgeStrategy === "anonymize") {
        const piiColumns = tableConf.piiColumns;
        if (!piiColumns || Object.keys(piiColumns).length === 0) {
          const countResult = await pool.query(
            `SELECT COUNT(*)::int AS cnt FROM "${policy.tableName}" WHERE created_at < $1${tenantFilter}`,
            params
          );
          affectedRows = countResult.rows[0]?.cnt ?? 0;
          logger.warn({ tableName: policy.tableName, policyId: policy.id }, "Anonymize: no PII columns defined — skipping data modification");
        } else {
          const setClauses = Object.entries(piiColumns).map(([col, val]) => `"${col}" = '${val}'`).join(", ");
          const whereExtra = Object.keys(piiColumns).map((col) => `"${col}" IS NOT NULL`).join(" OR ");
          const result = await pool.query(
            `UPDATE "${policy.tableName}" SET ${setClauses} WHERE created_at < $1${tenantFilter} AND (${whereExtra})`,
            params
          );
          affectedRows = result.rowCount ?? 0;
        }
      } else if (policy.purgeStrategy === "archive") {
        const countResult = await pool.query(
          `SELECT COUNT(*)::int AS cnt FROM "${policy.tableName}" WHERE created_at < $1${tenantFilter}`,
          params
        );
        affectedRows = countResult.rows[0]?.cnt ?? 0;
        logger.info({ tableName: policy.tableName, policyId: policy.id, affectedRows }, "Archive strategy: rows identified for archival. External archival pipeline required before deletion.");
      }
      totalProcessed += affectedRows;
    } catch (err: unknown) {
      errorMessage = err instanceof Error ? err.message : "Purge failed";
      status = "failure";
      failed++;
      logger.error({ err, tableName: policy.tableName, policyId: policy.id }, "Retention sweep: table purge failed");
    }

    await db.insert(dataRetentionAuditLogTable).values({
      policyId: policy.id,
      orgId: policy.orgId ?? null,
      tableName: policy.tableName,
      action: status === "success" ? "purge_completed" : "purge_failed",
      actorId: null,
      actorName: "Scheduler",
      affectedRows,
      details: { retentionDays: policy.retentionDays, purgeStrategy: policy.purgeStrategy, orgId: policy.orgId, triggeredBy: "scheduler" },
      status,
      errorMessage,
    }).catch((e) => logger.error({ err: e }, "Retention sweep: failed to write audit log"));

    await db.update(dataRetentionPoliciesTable)
      .set({ lastRunAt: new Date(), updatedAt: new Date() })
      .where(eq(dataRetentionPoliciesTable.id, policy.id))
      .catch(() => {});
  }

  logger.info({ jobId: job.id, policies: policies.length, totalProcessed, failed }, "Data retention sweep completed");
  serverTelemetry.recordBusinessEvent({
    type: "data_retention_sweep_completed",
    metadata: { policies: policies.length, totalProcessed, failed },
  });
});

const DEFAULT_SCHEDULES: ScheduleDefinition[] = [
  { name: "health_scan_5m", jobType: JOB_TYPES.HEALTH_SCAN, cronExpression: "*/5 * * * *", payload: { services: ["database", "job-queue", "api"] }, maxRetries: 1 },
  { name: "alert_check_15m", jobType: JOB_TYPES.ALERT_CHECK, cronExpression: "*/15 * * * *", payload: {}, maxRetries: 1 },
  { name: "daily_digest_0800", jobType: JOB_TYPES.DAILY_DIGEST, cronExpression: "0 8 * * *", payload: { domains: ["vessels", "firestorm", "lyte", "inca", "terra", "msp"] }, maxRetries: 2 },
  { name: "cert_digest_0730", jobType: JOB_TYPES.DAILY_CERTIFICATION_TASK_DIGEST, cronExpression: "30 7 * * *", payload: {}, maxRetries: 2 },
  { name: "capital_digest_0815", jobType: JOB_TYPES.DAILY_CAPITAL_READINESS_DIGEST, cronExpression: "15 8 * * *", payload: {}, maxRetries: 2 },
  { name: "mls_sync_hourly", jobType: JOB_TYPES.HOURLY_MLS_LISTING_SYNC, cronExpression: "0 * * * *", payload: {}, maxRetries: 2 },
  { name: "commercial_refresh_0300", jobType: JOB_TYPES.DAILY_COMMERCIAL_DATA_REFRESH, cronExpression: "0 3 * * *", payload: {}, maxRetries: 2 },
  { name: "nyc_ingestion_6h", jobType: NYC_INGESTION_JOB_TYPE, cronExpression: "0 */6 * * *", payload: { sources: ["acris", "acris_master", "foreclosure_filings", "dof_liens", "hpd_violations"] }, maxRetries: 2 },
  { name: "nyc_extended_ingestion_8h", jobType: NYC_EXTENDED_INGESTION_JOB_TYPE, cronExpression: "0 */8 * * *", payload: { sources: ["rolling_sales", "tax_lien_sale_list", "hpd_complaints", "dob_violations", "nyc_311", "acris_parties", "map_pluto"] }, maxRetries: 2 },
  { name: "lyte_digest_daily", jobType: NAMED_JOB_TYPES.DAILY_LYTE_DIGEST, cronExpression: "0 8 * * *", payload: {}, maxRetries: 2 },
  { name: "readiness_digest_daily", jobType: NAMED_JOB_TYPES.DAILY_READINESS_DIGEST, cronExpression: "0 8 * * *", payload: {}, maxRetries: 2 },
  { name: "exception_summary_daily", jobType: NAMED_JOB_TYPES.DAILY_EXCEPTION_SUMMARY, cronExpression: "0 8 * * *", payload: {}, maxRetries: 2 },
  { name: "artifact_cleanup_daily", jobType: NAMED_JOB_TYPES.DAILY_ARTIFACT_CLEANUP, cronExpression: "0 8 * * *", payload: {}, maxRetries: 2 },
  { name: "feature_flag_sync_daily", jobType: NAMED_JOB_TYPES.DAILY_FEATURE_FLAG_SYNC, cronExpression: "0 8 * * *", payload: {}, maxRetries: 2 },
  { name: "document_batch_daily", jobType: NAMED_JOB_TYPES.DAILY_DOCUMENT_BATCH, cronExpression: "0 8 * * *", payload: {}, maxRetries: 2 },
  { name: "signal_normalization_hourly", jobType: NAMED_JOB_TYPES.HOURLY_SIGNAL_NORMALIZATION, cronExpression: "0 * * * *", payload: {}, maxRetries: 2 },
  { name: "stale_action_scan_hourly", jobType: NAMED_JOB_TYPES.HOURLY_STALE_ACTION_SCAN, cronExpression: "0 * * * *", payload: {}, maxRetries: 2 },
  { name: "vessel_eta_refresh_hourly", jobType: NAMED_JOB_TYPES.HOURLY_VESSEL_ETA_REFRESH, cronExpression: "0 * * * *", payload: {}, maxRetries: 2 },
  { name: "route_pressure_scan_hourly", jobType: NAMED_JOB_TYPES.HOURLY_ROUTE_PRESSURE_SCAN, cronExpression: "0 * * * *", payload: {}, maxRetries: 2 },
  { name: "terra_inquiry_digest_hourly", jobType: NAMED_JOB_TYPES.HOURLY_TERRA_INQUIRY_DIGEST, cronExpression: "0 * * * *", payload: {}, maxRetries: 2 },
  { name: "executive_digest_minutely", jobType: NAMED_JOB_TYPES.HOURLY_EXECUTIVE_DIGEST, cronExpression: "* * * * *", payload: {}, maxRetries: 1 },
  { name: "atlas_snapshot_compaction_0200", jobType: NAMED_JOB_TYPES.ATLAS_SNAPSHOT_COMPACTION, cronExpression: "0 2 * * *", payload: { retainDays: 7, domains: ["vessels", "terra", "aegis", "prism"] }, maxRetries: 2 },
  { name: "atlas_retention_prune_0330", jobType: NAMED_JOB_TYPES.ATLAS_RETENTION_PRUNE, cronExpression: "30 3 * * *", payload: {}, maxRetries: 1 },
  { name: "platform_lyte_digest_0700", jobType: PLATFORM_JOB_TYPES.LYTE_DIGEST, cronExpression: "0 7 * * *", payload: { period: "daily" }, maxRetries: 2 },
  { name: "platform_readiness_digest_0700", jobType: PLATFORM_JOB_TYPES.READINESS_DIGEST, cronExpression: "0 7 * * *", payload: {}, maxRetries: 2 },
  { name: "platform_exception_summary_0700", jobType: PLATFORM_JOB_TYPES.EXCEPTION_SUMMARY, cronExpression: "0 7 * * *", payload: { domain: "platform" }, maxRetries: 2 },
  { name: "platform_artifact_cleanup_0700", jobType: PLATFORM_JOB_TYPES.ARTIFACT_CLEANUP, cronExpression: "0 7 * * *", payload: { olderThanDays: 30, dryRun: false }, maxRetries: 1 },
  { name: "platform_feature_flag_sync_0700", jobType: PLATFORM_JOB_TYPES.FEATURE_FLAG_SYNC, cronExpression: "0 7 * * *", payload: {}, maxRetries: 2 },
  { name: "platform_signal_normalization_hourly", jobType: PLATFORM_JOB_TYPES.SIGNAL_NORMALIZATION, cronExpression: "0 * * * *", payload: {}, maxRetries: 2 },
  { name: "platform_stale_action_scan_hourly", jobType: PLATFORM_JOB_TYPES.STALE_ACTION_SCAN, cronExpression: "0 * * * *", payload: { staleAfterHours: 72 }, maxRetries: 1 },
  { name: "platform_vessel_eta_refresh_hourly", jobType: PLATFORM_JOB_TYPES.VESSEL_ETA_REFRESH, cronExpression: "0 * * * *", payload: {}, maxRetries: 2 },
  { name: "platform_route_pressure_scan_hourly", jobType: PLATFORM_JOB_TYPES.ROUTE_PRESSURE_SCAN, cronExpression: "0 * * * *", payload: {}, maxRetries: 1 },
  { name: "platform_salesforce_opportunity_sync_hourly", jobType: PLATFORM_JOB_TYPES.SALESFORCE_OPPORTUNITY_SYNC, cronExpression: "0 * * * *", payload: {}, maxRetries: 2 },
  { name: "platform_jira_sprint_health_scan_hourly", jobType: PLATFORM_JOB_TYPES.JIRA_SPRINT_HEALTH_SCAN, cronExpression: "0 * * * *", payload: {}, maxRetries: 2 },
  { name: "notification_email_digest_daily", jobType: PLATFORM_JOB_TYPES.NOTIFICATION_DIGEST, cronExpression: "0 8 * * *", payload: { since: "24h" }, maxRetries: 2 },
  { name: "data_retention_sweep_weekly", jobType: PLATFORM_JOB_TYPES.DATA_RETENTION_SWEEP, cronExpression: "0 2 * * 0", payload: {}, maxRetries: 1 },
] as const;

export async function startDurableQueue(): Promise<void> {
  await durableJobQueue.start();
  logger.info("Durable job queue started");
}

export async function startDurableScheduler(): Promise<void> {
  await seedDefaultSchedules(DEFAULT_SCHEDULES);
  await durableScheduler.start();
  logger.info("Durable scheduler started with default schedules");
}

export { durableJobQueue, durableScheduler };
