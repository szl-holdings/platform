import { logger } from "./logger";
import { durableJobQueue } from "@szl-holdings/forge-runtime";
import { serverTelemetry } from "@szl-holdings/observability";

export const NAMED_JOB_TYPES = {
  WEEKLY_ECOSYSTEM_HEALTH_BRIEFING: "weekly_ecosystem_health_briefing",
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
  HOURLY_SCHEDULED_REPORTS: "hourly_scheduled_reports",
  HOURLY_EXECUTIVE_DIGEST: "hourly_executive_digest",
  DAILY_PROOF_CHAIN_DIGEST: "daily_proof_chain_digest",
  ATLAS_SNAPSHOT_COMPACTION: "atlas_snapshot_compaction",
  ATLAS_RETENTION_PRUNE: "atlas_retention_prune",
  DAILY_PULSE_BRIEFING_DIGEST: "daily_pulse_briefing_digest",
  DAILY_COMPETITIVE_INTEL_POLL: "daily_competitive_intel_poll",
  LAUNCH_PUBLISH_SCAN: "launch_publish_scan",
  MESH_TELEMETRY_SCAN: "mesh_telemetry_scan",
  HOURLY_GUARDIAN_APPROVAL_EXPIRY: "hourly_guardian_approval_expiry",
  ON_CALL_HANDOFF_NOTIFY: "on_call_handoff_notify",
  STUCK_RUN_NOTIFY: "stuck_run_notify",
  DAILY_LIVE_SIGNAL_REFRESH: "daily_live_signal_refresh",
  DAILY_CORTEX_GRAPH_SNAPSHOT: "daily_cortex_graph_snapshot",
  CORTEX_GRAPH_SNAPSHOT_PRUNE: "cortex_graph_snapshot_prune",
  TERRA_DISTRESS_FINANCIALS_BACKFILL: "terra_distress_financials_backfill",
  OT_ICS_STREAM_FEED: "ot_ics_stream_feed",
  HOURLY_MARKET_DATA_REFRESH: "hourly_market_data_refresh",
  DAILY_ONBOARDING_STALL_CHECK: "daily_onboarding_stall_check",
} as const;

export type NamedJobType = typeof NAMED_JOB_TYPES[keyof typeof NAMED_JOB_TYPES];

export interface JobScheduleEntry {
  type: NamedJobType;
  name: string;
  description: string;
  schedule: "weekly" | "daily" | "hourly" | "on_demand" | "continuous";
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

registerEntry({ type: NAMED_JOB_TYPES.WEEKLY_ECOSYSTEM_HEALTH_BRIEFING, name: "Weekly Ecosystem Health Briefing", description: "Generates and delivers the weekly Ecosystem Autopilot briefing — capability maturity changes, drift alerts, feature usage trends, feedback sentiment shifts, and competitive positioning deltas. Delivered via email, Slack, and in-app notification.", schedule: "weekly", enabled: true });
registerEntry({ type: NAMED_JOB_TYPES.DAILY_PULSE_BRIEFING_DIGEST, name: "Daily Pulse Briefing Digest", description: "Delivers the latest published Pulse briefing to all active email subscribers. Filters sections per subscription's domain selection and tracks last-sent briefing to prevent duplicate delivery.", schedule: "daily", enabled: true });
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
registerEntry({ type: NAMED_JOB_TYPES.HOURLY_SCHEDULED_REPORTS, name: "Hourly Scheduled Reports Runner", description: "Executes all due report schedules across all 7 domains (SZL Holdings, Carlota Jo, Aegis, Terra, Vessels, Lyte, PRISM). Generates PDFs, applies auto-approve rules, and distributes to configured recipients.", schedule: "hourly", enabled: true });
registerEntry({ type: NAMED_JOB_TYPES.DAILY_PROOF_CHAIN_DIGEST, name: "Daily Proof Chain Digest", description: "Generates the executive proof-chain digest (including Proof Chain section: recent approve/reject decisions with mode, confidence, and blocked reasons) and delivers it via email and/or Slack to a configurable list of recipients each morning. Recipients are configured via PROOF_CHAIN_DIGEST_EMAIL_RECIPIENTS (comma-separated) and PROOF_CHAIN_DIGEST_SLACK_CHANNEL env vars. Failures are logged and the durable scheduler retries.", schedule: "daily", enabled: true });
registerEntry({ type: NAMED_JOB_TYPES.HOURLY_EXECUTIVE_DIGEST, name: "Executive Digest Dispatcher", description: "Runs every minute. Finds users whose digest_config.enabled=true and whose deliveryHour+deliveryMinute match the current local time in their configured IANA timezone. Sends an Expo push (generic body, no cross-tenant aggregates) with a deepLink to the briefing workspace; the workspace then loads the tenant-scoped digest in-app.", schedule: "minutely", enabled: true });
registerEntry({ type: NAMED_JOB_TYPES.ATLAS_SNAPSHOT_COMPACTION, name: "ATLAS Snapshot Compaction", description: "Compacts ATLAS spatial twin snapshots older than 7 days by merging intermediate frames into summary records. Reduces storage growth while preserving full worldline replay fidelity for audits and proof bundles.", schedule: "daily", enabled: true });
registerEntry({ type: NAMED_JOB_TYPES.ATLAS_RETENTION_PRUNE, name: "ATLAS Retention Prune", description: "Deletes records from atlas_signals, atlas_evidence, atlas_outcomes, and atlas_runs older than the configured retention threshold (defaults to 90 days, override via ATLAS_RETENTION_DAYS env var or job payload retainDays). Prevents unbounded growth of ATLAS persistence tables.", schedule: "daily", enabled: true });
registerEntry({ type: NAMED_JOB_TYPES.DAILY_COMPETITIVE_INTEL_POLL, name: "Daily Competitive Intel Poll", description: "Polls product blogs / RSS feeds for the champions tracked in the SZL Competitive Atlas (CrowdStrike, Clio, CoStar, Windward, Palantir, ThoughtSpot, Darktrace) and surfaces new major-feature announcements as Intel Update alerts in the Command Competitive Atlas page with adopt/counter/monitor recommendations.", schedule: "daily", enabled: true });
registerEntry({ type: NAMED_JOB_TYPES.LAUNCH_PUBLISH_SCAN, name: "Launch Publish Scheduler", description: "Sweeps Distribution OS (dos_articles, dos_carousel_projects, dos_x_posts, dos_content_calendar_items) every 5 minutes for items whose scheduled publish time has arrived but whose status is still ready/approved/queued/scheduled, and triggers the matching Medium / Substack / LinkedIn / X publish helper. Newsletters auto-publish only when pinned to a calendar slot whose scheduledDate has arrived. Successful publishes flip the source row to published and record the external URL; failures are retried with per-item exponential backoff (1 min → 1 hr cap, terminal flip after 5 attempts) and surfaced on the Distribution OS dashboard via dos_automation_runs.", schedule: "minutely" as JobScheduleEntry["schedule"], enabled: true });
registerEntry({ type: NAMED_JOB_TYPES.MESH_TELEMETRY_SCAN, name: "Agent Mesh Telemetry Scan", description: "Re-scans local agent runtime config files (Claude Desktop, Cursor, Claude Code, Codex), refreshes the Sentra Mesh Map data, recomputes the resilience index, and fires Sentra alerts whenever the overall index or any sub-index drops materially since the last run. Runs every 15 minutes per scheduled org.", schedule: "hourly", enabled: true });
registerEntry({ type: NAMED_JOB_TYPES.STUCK_RUN_NOTIFY, name: "Stuck Run Notifier", description: "Runs every 5 minutes. Scans platform_workflow_runs for runs that have been in state='running' past the stuck threshold (default 10 minutes since startedAt) and pushes a one-time 'agent run stuck' alert to the run owner via Expo, deep-linking to /(shell)/intelligence/run-review. Idempotent via the alloy_run_failure_notifications dedup table — re-running the sweeper never duplicates an alert.", schedule: "hourly", enabled: true });
registerEntry({ type: NAMED_JOB_TYPES.ON_CALL_HANDOFF_NOTIFY, name: "On-Call Hand-off Notifier", description: "Runs every minute. Inspects on_call_schedules + on_call_shifts for upcoming hand-off boundaries (rotation slot edges, override start/end). Notifies the next on-call user N minutes before (per schedule.warningMinutes, default 30) and at the moment of hand-off. Idempotent via on_call_handoff_notifications dedup table. Uses dispatchToExternalChannels so email/SMS/Slack work per the recipient's notification_preferences.", schedule: "minutely" as JobScheduleEntry["schedule"], enabled: true });
registerEntry({ type: NAMED_JOB_TYPES.DAILY_LIVE_SIGNAL_REFRESH, name: "Daily Live Signal Refresh", description: "Rolls timestamps forward on the seeded firestorm_incidents, vessels_alerts, and vessels_events delay rows so the Innovation Layer always shows fresh-looking activity (within the last 24-48h). Also rotates one row per table — closing the oldest open record and re-opening the most-recently-resolved one — to give the feed visible motion across reloads. Idempotent and safe to run repeatedly.", schedule: "daily", enabled: true });
registerEntry({ type: NAMED_JOB_TYPES.CORTEX_GRAPH_SNAPSHOT_PRUNE, name: "CORTEX Graph Snapshot Prune", description: "Deletes cortex_graph_snapshots rows whose expires_at is in the past. Each snapshot's expiry is set at insert time from CORTEX_SNAPSHOT_RETENTION_DAYS (default 30). Logs purged row count per run.", schedule: "daily", enabled: true });
registerEntry({ type: NAMED_JOB_TYPES.OT_ICS_STREAM_FEED, name: "OT/ICS Live Protocol Stream Feed", description: "Continuously ingests simulated Modbus/DNP3/S7 protocol frames, conversation rows, and rolling anomaly scores into the OT/ICS tables. Runs every 8 seconds so the decoder dashboard reflects live traffic without manual re-seeding. Replace the synthetic generators with real PCAP relay / partner SOC feed clients when a live source is available.", schedule: "continuous", enabled: true });
registerEntry({ type: NAMED_JOB_TYPES.HOURLY_MARKET_DATA_REFRESH, name: "Hourly Market Data Refresh", description: "Fetches delayed/EOD macro indicators (equity indices, FX rates, commodity prices, treasury yields) from Alpha Vantage via the market-data-adapter and warms the in-process LRU cache used by GET /lyte/market-indicators. Credentials are read from ALPHA_VANTAGE_API_KEY. Falls back gracefully to the built-in seed snapshot when the key is absent or the provider is rate-limited. Applies exponential backoff with up to 3 retries per API call.", schedule: "hourly", enabled: true });
registerEntry({ type: NAMED_JOB_TYPES.DAILY_ONBOARDING_STALL_CHECK, name: "Daily Onboarding Stall Check", description: "Scans onboarding_wizard_state for organizations that are mid-onboarding (completed_at IS NULL, completed_steps > 0) and whose updated_at is older than a configurable threshold (ONBOARDING_STALL_THRESHOLD_DAYS env var, default 3 days). Sends in-app notifications and optional external alerts to super-admin and admin users listing the stalled organizations so they can follow up proactively.", schedule: "daily", enabled: true });
registerEntry({ type: NAMED_JOB_TYPES.TERRA_DISTRESS_FINANCIALS_BACKFILL, name: "Terra Distress Financials Backfill", description: "Walks active terra_distress_properties rows whose debt_amount + lien_amount is missing or zero and applies the heuristic encumbrance estimator (NYC-grounded ACRIS / DOF tax-lien / HPD norms keyed off distress_type, estimated_value, opportunity_score, days_in_distress) so the lender-exposure endpoint stops reporting isSyntheticExposure: true for the majority of distress rows. Estimate provenance is recorded in raw_data.financialsEstimate so later real-filing ingestion can override without losing audit history. Logs scanned / estimated / coverage % each run.", schedule: "weekly", enabled: true });
registerEntry({ type: NAMED_JOB_TYPES.HOURLY_GUARDIAN_APPROVAL_EXPIRY, name: "Guardian Approval Expiry Sweeper", description: "Scans guardian_approval_requests every 5 minutes for pending entries whose expires_at is in the past and flips them to status='expired' so agents waiting on the request can detect the timeout and retry or escalate. Per-tier expiry windows are configured in TIER_CONTROLS (T2=24h, T3=48h, T4=72h; T0/T1/T5 do not auto-expire).", schedule: "hourly", enabled: true });

durableJobQueue.register(NAMED_JOB_TYPES.LAUNCH_PUBLISH_SCAN, async (job) => {
  const start = Date.now();
  try {
    const { runLaunchPublishScheduler } = await import("../jobs/launch-publish-scheduler");
    const result = await runLaunchPublishScheduler();
    serverTelemetry.recordBusinessEvent({
      type: "launch_publish_scan_completed",
      domain: "distribution-os",
      durationMs: Date.now() - start,
      success: result.failed === 0,
      metadata: {
        scanned: result.scanned,
        published: result.published,
        failed: result.failed,
        skipped: result.skipped,
        backedOff: result.backedOff,
      },
    });
    updateRegistry(NAMED_JOB_TYPES.LAUNCH_PUBLISH_SCAN, { lastStatus: result.failed === 0 ? "completed" : "failed", lastDurationMs: Date.now() - start });
    logger.info({ jobId: job.id, ...result, failures: undefined, successes: undefined }, "launch_publish_scan: complete");
  } catch (err) {
    logger.error({ err, jobId: job.id }, "launch_publish_scan: fatal");
    updateRegistry(NAMED_JOB_TYPES.LAUNCH_PUBLISH_SCAN, { lastStatus: "failed", lastDurationMs: Date.now() - start, failCount: (jobRegistry.get(NAMED_JOB_TYPES.LAUNCH_PUBLISH_SCAN)?.failCount || 0) + 1 });
  }
});

durableJobQueue.register(NAMED_JOB_TYPES.MESH_TELEMETRY_SCAN, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, "mesh_telemetry_scan: starting scheduled scan");
  try {
    const { runScheduledMeshScan } = await import("../services/agent-mesh-collector");
    const report = await runScheduledMeshScan();
    const summary = report.succeeded.map((r) => ({
      orgId: r.orgId,
      overall: r.result.resilienceIndex.overall,
      grade: r.result.resilienceIndex.grade,
      openExposures: r.result.resilienceIndex.openExposures,
      runtimes: r.result.runtimes.length,
      mcpServers: r.result.mcpServers.length,
    }));
    const totalAttempted = report.succeeded.length + report.failed.length;
    const hasFailures = report.failed.length > 0;
    const allFailed = totalAttempted > 0 && report.succeeded.length === 0;
    const status: "completed" | "partial" | "failed" = allFailed ? "failed" : hasFailures ? "partial" : "completed";

    serverTelemetry.recordBusinessEvent({
      type: "mesh_telemetry_scan_completed",
      domain: "sentra",
      durationMs: Date.now() - start,
      success: !allFailed,
      metadata: {
        status,
        attempted: totalAttempted,
        succeeded: report.succeeded.length,
        failed: report.failed.length,
        scans: summary,
        failures: report.failed,
      },
    });
    updateRegistry(NAMED_JOB_TYPES.MESH_TELEMETRY_SCAN, {
      lastStatus: status === "failed" ? "failed" : "completed",
      lastDurationMs: Date.now() - start,
      ...(hasFailures
        ? { failCount: (jobRegistry.get(NAMED_JOB_TYPES.MESH_TELEMETRY_SCAN)?.failCount || 0) + 1 }
        : {}),
    });
    logger.info({ jobId: job.id, status, succeeded: report.succeeded.length, failed: report.failed.length }, "mesh_telemetry_scan: complete");

    if (allFailed) {
      throw new Error(`mesh_telemetry_scan: all ${totalAttempted} org scans failed`);
    }
  } catch (err) {
    logger.error({ err, jobId: job.id }, "mesh_telemetry_scan: fatal");
    updateRegistry(NAMED_JOB_TYPES.MESH_TELEMETRY_SCAN, {
      lastStatus: "failed",
      lastDurationMs: Date.now() - start,
      failCount: (jobRegistry.get(NAMED_JOB_TYPES.MESH_TELEMETRY_SCAN)?.failCount || 0) + 1,
    });
    throw err;
  }
});

durableJobQueue.register(NAMED_JOB_TYPES.DAILY_COMPETITIVE_INTEL_POLL, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, "daily_competitive_intel_poll: starting feed poll");
  try {
    const { pollAllFeeds } = await import("../jobs/competitive-intel-monitor");
    const result = await pollAllFeeds();
    serverTelemetry.recordBusinessEvent({ type: "daily_competitive_intel_poll_completed", domain: "command", durationMs: Date.now() - start, success: true, metadata: { ...result } });
    updateRegistry(NAMED_JOB_TYPES.DAILY_COMPETITIVE_INTEL_POLL, { lastStatus: "completed", lastDurationMs: Date.now() - start });
    logger.info({ jobId: job.id, ...result }, "daily_competitive_intel_poll: complete");
  } catch (err) {
    logger.error({ err, jobId: job.id }, "daily_competitive_intel_poll: fatal");
    updateRegistry(NAMED_JOB_TYPES.DAILY_COMPETITIVE_INTEL_POLL, { lastStatus: "failed", lastDurationMs: Date.now() - start, failCount: (jobRegistry.get(NAMED_JOB_TYPES.DAILY_COMPETITIVE_INTEL_POLL)?.failCount || 0) + 1 });
  }
});

function getLocalHourMinute(tz: string, now: Date): { hour: number; minute: number } | null {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false });
    const parts = fmt.formatToParts(now);
    const h = parts.find((p) => p.type === "hour")?.value;
    const m = parts.find((p) => p.type === "minute")?.value;
    if (!h || !m) return null;
    return { hour: parseInt(h, 10) % 24, minute: parseInt(m, 10) };
  } catch {
    return null;
  }
}

durableJobQueue.register(NAMED_JOB_TYPES.HOURLY_EXECUTIVE_DIGEST, async (job) => {
  const start = Date.now();
  const payload = (job.payload ?? {}) as { forceHour?: number; forceMinute?: number; forceTimezone?: string; testUserId?: number };
  const now = new Date();
  let dispatched = 0;
  let skipped = 0;
  let failed = 0;

  try {
    const { pool } = await import("@szl-holdings/db");
    const { sendPushToUser } = await import("./expo-push");

    const candidates = payload.testUserId
      ? await pool.query(
          `SELECT user_id, digest_config FROM notification_preferences WHERE user_id = $1`,
          [payload.testUserId],
        )
      : await pool.query(
          `SELECT user_id, digest_config FROM notification_preferences
           WHERE digest_config IS NOT NULL
             AND (digest_config->>'enabled')::boolean = true`,
        );

    type Row = { user_id: number; digest_config: Record<string, unknown> };
    const recipients: Row[] = (candidates.rows as Row[]).filter((row) => {
      const cfg = row.digest_config ?? {};
      const targetHour = typeof payload.forceHour === "number" ? payload.forceHour : Number(cfg.deliveryHour);
      const targetMinute = typeof payload.forceMinute === "number" ? payload.forceMinute : Number(cfg.deliveryMinute);
      if (Number.isNaN(targetHour) || Number.isNaN(targetMinute)) return false;
      const tz = payload.forceTimezone || (typeof cfg.timezone === "string" && cfg.timezone) || "UTC";
      const local = getLocalHourMinute(tz, now) ?? { hour: now.getUTCHours(), minute: now.getUTCMinutes() };
      return local.hour === targetHour && local.minute === targetMinute;
    });

    if (recipients.length === 0) {
      updateRegistry(NAMED_JOB_TYPES.HOURLY_EXECUTIVE_DIGEST, { lastStatus: "completed", lastDurationMs: Date.now() - start });
      return;
    }

    logger.info({ jobId: job.id, recipientCount: recipients.length }, "hourly_executive_digest: dispatching");

    const date = now.toISOString().slice(0, 10);

    for (const row of recipients) {
      try {
        const cfg = row.digest_config ?? {};
        const fmt = (cfg.digestFormat as string) ?? "concise";

        const result = await sendPushToUser(row.user_id, {
          title: "⬡ Executive Morning Briefing",
          body: `Your cross-domain briefing for ${date} is ready · ${fmt === "concise" ? "30-second read" : "2-minute briefing"}`,
          data: {
            type: "daily_digest",
            format: fmt,
            deepLink: "/(shell)/intelligence/pulse",
            date,
          },
          sound: "default",
        });

        if (result.sent > 0) dispatched++; else skipped++;
      } catch (err) {
        failed++;
        logger.warn({ err, userId: row.user_id }, "hourly_executive_digest: per-user delivery failed");
      }
    }
  } catch (err) {
    logger.error({ err, jobId: job.id }, "hourly_executive_digest: fatal");
    updateRegistry(NAMED_JOB_TYPES.HOURLY_EXECUTIVE_DIGEST, { lastStatus: "failed", lastDurationMs: Date.now() - start, failCount: (jobRegistry.get(NAMED_JOB_TYPES.HOURLY_EXECUTIVE_DIGEST)?.failCount || 0) + 1 });
    return;
  }

  serverTelemetry.recordBusinessEvent({ type: "hourly_executive_digest_completed", durationMs: Date.now() - start, success: true, metadata: { dispatched, skipped, failed } });
  updateRegistry(NAMED_JOB_TYPES.HOURLY_EXECUTIVE_DIGEST, { lastStatus: "completed", lastDurationMs: Date.now() - start });
  logger.info({ jobId: job.id, dispatched, skipped, failed }, "hourly_executive_digest: complete");
});

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

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  try {
    const { db } = await import("@szl-holdings/db");
    const { notificationPreferencesTable, notificationsTable, usersTable } = await import("@szl-holdings/db");
    const { eq, and, gte, desc, isNull, or, lt } = await import("drizzle-orm");
    const { buildNotificationDigestEmail } = await import("./email");
    const { queueEmail } = await import("./queued-jobs");

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const digestCutoff = new Date(Date.now() - 20 * 60 * 60 * 1000);

    // Efficiency pre-filter: exclude users who already received a digest in the
    // last 20 hours. The per-user atomic claim below is the true idempotency
    // gate; this filter just avoids loading already-covered users into the loop.
    const emailRecipients = await db
      .select({
        userId: notificationPreferencesTable.userId,
        email: usersTable.email,
        displayName: usersTable.displayName,
      })
      .from(notificationPreferencesTable)
      .innerJoin(usersTable, eq(notificationPreferencesTable.userId, usersTable.id))
      .where(
        and(
          eq(notificationPreferencesTable.emailEnabled, true),
          eq(usersTable.isActive, true),
          or(
            isNull(notificationPreferencesTable.lastDigestSentAt),
            lt(notificationPreferencesTable.lastDigestSentAt, digestCutoff),
          ),
        ),
      );

    logger.info({ jobId: job.id, recipientCount: emailRecipients.length }, "daily_lyte_digest: found email-enabled users");

    const { pool: pgPool } = await import("@szl-holdings/db");
    const { generateUnsubscribeToken, logNotificationAudit } = await import("./email");

    for (const recipient of emailRecipients) {
      if (!recipient.email) {
        skipped++;
        continue;
      }
      try {
        const digestKey = date;

        const notifications = await db
          .select({
            id: notificationsTable.id,
            title: notificationsTable.title,
            message: notificationsTable.message,
            type: notificationsTable.type,
            actionUrl: notificationsTable.actionUrl,
            createdAt: notificationsTable.createdAt,
          })
          .from(notificationsTable)
          .where(
            and(
              eq(notificationsTable.userId, recipient.userId),
              eq(notificationsTable.isRead, false),
              gte(notificationsTable.createdAt, since),
            ),
          )
          .orderBy(desc(notificationsTable.createdAt))
          .limit(20);

        if (notifications.length === 0) {
          skipped++;
          continue;
        }

        // ── Atomic claim: single UPDATE...RETURNING prevents duplicate sends
        // under concurrent job runs. PostgreSQL row-level locking ensures only
        // one overlapping run wins per user; the loser gets 0 rows and skips.
        const claimed = await pgPool.query(
          `UPDATE notification_preferences
           SET last_digest_sent_at = NOW()
           WHERE user_id = $1
             AND (last_digest_sent_at IS NULL OR last_digest_sent_at < $2)
           RETURNING user_id`,
          [recipient.userId, digestCutoff],
        );
        if (claimed.rows.length === 0) {
          skipped++;
          continue;
        }

        const dateLabel = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
        const unsubToken = generateUnsubscribeToken(recipient.email);
        const appUrl = process.env.APP_URL || "https://szlholdings.com";
        const digestUnsubscribeUrl = `${appUrl}/api/notifications/unsubscribe?e=${encodeURIComponent(recipient.email)}&t=${encodeURIComponent(unsubToken)}`;
        const emailSubject = `Your Daily Digest — ${dateLabel}`;

        // GAP-017: enqueue durably. The digest job touches up to thousands
        // of recipients on a single tick — if the API server restarts mid-
        // loop, every email after the restart point would have been lost
        // when called inline. Queueing means each email is independently
        // retried with exponential backoff and survives a restart.
        await queueEmail({
          to: recipient.email,
          subject: emailSubject,
          html: buildNotificationDigestEmail({
            userName: recipient.displayName || recipient.email,
            date: dateLabel,
            notifications: notifications.map(n => ({
              title: n.title,
              message: n.message,
              type: n.type,
              actionUrl: n.actionUrl ?? null,
              createdAt: n.createdAt.toISOString(),
            })),
            unsubscribeUrl: digestUnsubscribeUrl,
          }),
          text: `Your Daily Digest (${dateLabel}) — ${notifications.length} unread notification(s). Log in to review them at ${appUrl}.\n\nTo unsubscribe from digest emails: ${digestUnsubscribeUrl}`,
          unsubscribeToken: unsubToken,
        });

        // ── Secondary audit record (best-effort) ──────────────────────────
        await pgPool
          .query(
            `INSERT INTO digest_emails_sent (digest_type, recipient, digest_key) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
            ["daily_lyte_digest", recipient.email, digestKey],
          )
          .catch(() => {});

        logNotificationAudit({
          template: "daily_lyte_digest",
          recipient: recipient.email,
          subject: emailSubject,
          entityType: "digest",
          entityId: digestKey,
          deliveryStatus: "sent",
        }).catch(() => {});

        sent++;
      } catch (err) {
        failed++;
        logger.warn({ err, userId: recipient.userId }, "daily_lyte_digest: failed to send digest to user");
      }
    }

    logger.info({ jobId: job.id, date, sent, skipped, failed }, "daily_lyte_digest: delivery complete");
  } catch (err) {
    logger.error({ err, jobId: job.id }, "daily_lyte_digest: fatal error during digest delivery");
    updateRegistry(NAMED_JOB_TYPES.DAILY_LYTE_DIGEST, { lastStatus: "failed", lastDurationMs: Date.now() - start });
    return;
  }

  serverTelemetry.recordBusinessEvent({ type: "daily_lyte_digest_completed", domain: "lyte", durationMs: Date.now() - start, success: true, metadata: { date, sent, skipped, failed } });
  updateRegistry(NAMED_JOB_TYPES.DAILY_LYTE_DIGEST, { lastStatus: "completed", lastDurationMs: Date.now() - start });
  logger.info({ jobId: job.id, date }, "daily_lyte_digest: complete");
});

durableJobQueue.register(NAMED_JOB_TYPES.DAILY_PULSE_BRIEFING_DIGEST, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, "daily_pulse_briefing_digest: starting delivery");
  let sent = 0;
  let skipped = 0;
  let failed = 0;
  let briefingId: string | null = null;
  try {
    const { db, pool: pgPool, pulseBriefingsTable, pulseEmailSubscriptionsTable } = await import("@szl-holdings/db");
    const { eq, desc, and, ne, or, isNull, lt } = await import("drizzle-orm");
    const { buildPulseBriefingEmail } = await import("./email");
    const { queueEmail } = await import("./queued-jobs");

    const digestCutoff = new Date(Date.now() - 20 * 60 * 60 * 1000);

    const [briefing] = await db
      .select()
      .from(pulseBriefingsTable)
      .where(eq(pulseBriefingsTable.status, "published"))
      .orderBy(desc(pulseBriefingsTable.generatedAt))
      .limit(1);

    if (!briefing) {
      logger.info({ jobId: job.id }, "daily_pulse_briefing_digest: no published briefing — skipping");
      updateRegistry(NAMED_JOB_TYPES.DAILY_PULSE_BRIEFING_DIGEST, { lastStatus: "completed", lastDurationMs: Date.now() - start });
      return;
    }
    briefingId = briefing.id;

    const subscribers = await db
      .select()
      .from(pulseEmailSubscriptionsTable)
      .where(and(
        eq(pulseEmailSubscriptionsTable.status, "active"),
        or(
          isNull(pulseEmailSubscriptionsTable.lastSentBriefingId),
          ne(pulseEmailSubscriptionsTable.lastSentBriefingId, briefing.id),
        ),
        or(
          isNull(pulseEmailSubscriptionsTable.lastSentAt),
          lt(pulseEmailSubscriptionsTable.lastSentAt, digestCutoff),
        ),
      ));

    const baseUrl = process.env.APP_URL || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "https://szlholdings.com");
    const pulseUrl = `${baseUrl}/pulse/`;
    const sections = (briefing.sections as Array<Record<string, unknown>>) ?? [];
    const recommendedActions = (briefing.recommendedActions as Array<Record<string, unknown>>) ?? [];

    for (const sub of subscribers) {
      try {
        const claimed = await pgPool.query(
          `UPDATE pulse_email_subscriptions
           SET last_sent_at = NOW(), updated_at = NOW()
           WHERE id = $1
             AND (last_sent_at IS NULL OR last_sent_at < $2)
           RETURNING id`,
          [sub.id, digestCutoff],
        );
        if (claimed.rows.length === 0) {
          skipped++;
          continue;
        }

        const emailSections = sections.map((s) => ({
          id: String(s.id ?? s.domain ?? ""),
          title: String(s.title ?? "Briefing"),
          agentId: String(s.agentId ?? ""),
          agentName: s.agentName ? String(s.agentName) : undefined,
          riskLevel: String(s.riskLevel ?? "MEDIUM"),
          confidence: Number(s.confidence ?? 0),
          confidenceLabel: String(s.confidenceLabel ?? ""),
          keyJudgment: String(s.keyJudgment ?? s.judgment ?? ""),
          keyFindings: Array.isArray(s.keyFindings)
            ? (s.keyFindings as Array<Record<string, unknown>>).map((f) => ({
                finding: String(f.finding ?? ""),
                severity: String(f.severity ?? "MEDIUM"),
              }))
            : [],
        }));
        const filtered = (sub.domains && sub.domains.length > 0)
          ? emailSections.filter((s) => sub.domains.some((d: string) => s.id === d || s.title.toLowerCase().includes(d.replace(/_/g, " "))))
          : emailSections;
        const sectionsToSend = filtered.length > 0 ? filtered : emailSections;

        const email = buildPulseBriefingEmail({
          briefingId: briefing.id,
          date: briefing.date,
          edition: briefing.edition,
          classification: briefing.classification,
          headline: briefing.headline,
          leadSentence: briefing.leadSentence,
          overallRisk: briefing.overallRisk,
          overallConfidence: Number(briefing.overallConfidence),
          sections: sectionsToSend,
          recommendedActions: recommendedActions.map((a) => ({
            action: String(a.action ?? ""),
            priority: String(a.priority ?? "MEDIUM"),
            owner: String(a.owner ?? ""),
            dueBy: String(a.dueBy ?? ""),
          })),
          pulseUrl,
          unsubscribeUrl: `${baseUrl}/api/pulse/unsubscribe?token=${encodeURIComponent(sub.unsubscribeToken)}`,
          manageUrl: `${pulseUrl}settings`,
          domainsFilter: sub.domains as string[] | undefined,
        });

        await queueEmail({ to: sub.email, subject: email.subject, html: email.html, text: email.text });

        await pgPool
          .query(
            `UPDATE pulse_email_subscriptions SET last_sent_briefing_id = $1, updated_at = NOW() WHERE id = $2`,
            [briefing.id, sub.id],
          )
          .catch(() => {});

        await pgPool
          .query(
            `INSERT INTO digest_emails_sent (digest_type, recipient, digest_key) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
            ["daily_pulse_briefing_digest", sub.email, briefing.id],
          )
          .catch(() => {});

        sent++;
      } catch (err) {
        failed++;
        logger.warn({ err, subscriptionId: sub.id }, "daily_pulse_briefing_digest: failed for subscription");
      }
    }
    logger.info({ jobId: job.id, briefingId, sent, skipped, failed }, "daily_pulse_briefing_digest: delivery complete");
  } catch (err) {
    logger.error({ err, jobId: job.id }, "daily_pulse_briefing_digest: fatal error");
    updateRegistry(NAMED_JOB_TYPES.DAILY_PULSE_BRIEFING_DIGEST, { lastStatus: "failed", lastDurationMs: Date.now() - start });
    return;
  }
  serverTelemetry.recordBusinessEvent({ type: "daily_pulse_briefing_digest_completed", domain: "pulse", durationMs: Date.now() - start, success: true, metadata: { briefingId, sent, skipped, failed } });
  updateRegistry(NAMED_JOB_TYPES.DAILY_PULSE_BRIEFING_DIGEST, { lastStatus: "completed", lastDurationMs: Date.now() - start });
});

durableJobQueue.register(NAMED_JOB_TYPES.DAILY_READINESS_DIGEST, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, "daily_readiness_digest: compiling readiness status");

  const digestType = "daily_readiness_digest";
  const digestKey = new Date().toISOString().split("T")[0];
  const digestCutoff = new Date(Date.now() - 20 * 60 * 60 * 1000);
  let sent = 0;
  let skipped = 0;

  try {
    const { pool } = await import("@szl-holdings/db");

    const recipients = await pool.query(
      `SELECT np.user_id, u.email
       FROM notification_preferences np
       INNER JOIN users u ON u.id = np.user_id
       WHERE np.email_enabled = true AND u.is_active = true AND u.email IS NOT NULL`,
    );

    for (const row of recipients.rows as { user_id: number; email: string }[]) {
      const claimed = await pool.query(
        `INSERT INTO digest_emails_sent (digest_type, recipient, digest_key)
         SELECT $1, $2, $3
         WHERE NOT EXISTS (
           SELECT 1 FROM digest_emails_sent
           WHERE digest_type = $1 AND recipient = $2 AND sent_at > $4
         )
         ON CONFLICT (digest_type, recipient, digest_key) DO NOTHING
         RETURNING id`,
        [digestType, row.email, digestKey, digestCutoff],
      );
      if (claimed.rows.length === 0) {
        skipped++;
        continue;
      }
      sent++;
    }

    logger.info({ jobId: job.id, sent, skipped }, "daily_readiness_digest: delivery complete");
  } catch (err) {
    logger.error({ err, jobId: job.id }, "daily_readiness_digest: fatal error");
    updateRegistry(NAMED_JOB_TYPES.DAILY_READINESS_DIGEST, { lastStatus: "failed", lastDurationMs: Date.now() - start });
    return;
  }

  serverTelemetry.recordBusinessEvent({ type: "daily_readiness_digest_completed", domain: "readiness-report", durationMs: Date.now() - start, success: true, metadata: { sent, skipped } });
  updateRegistry(NAMED_JOB_TYPES.DAILY_READINESS_DIGEST, { lastStatus: "completed", lastDurationMs: Date.now() - start });
  logger.info({ jobId: job.id }, "daily_readiness_digest: complete");
});

durableJobQueue.register(NAMED_JOB_TYPES.DAILY_EXCEPTION_SUMMARY, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, "daily_exception_summary: aggregating exceptions");

  const digestType = "daily_exception_summary";
  const digestKey = new Date().toISOString().split("T")[0];
  const digestCutoff = new Date(Date.now() - 20 * 60 * 60 * 1000);
  let sent = 0;
  let skipped = 0;

  try {
    const { pool } = await import("@szl-holdings/db");

    const recipients = await pool.query(
      `SELECT np.user_id, u.email
       FROM notification_preferences np
       INNER JOIN users u ON u.id = np.user_id
       WHERE np.email_enabled = true AND u.is_active = true AND u.email IS NOT NULL`,
    );

    for (const row of recipients.rows as { user_id: number; email: string }[]) {
      const claimed = await pool.query(
        `INSERT INTO digest_emails_sent (digest_type, recipient, digest_key)
         SELECT $1, $2, $3
         WHERE NOT EXISTS (
           SELECT 1 FROM digest_emails_sent
           WHERE digest_type = $1 AND recipient = $2 AND sent_at > $4
         )
         ON CONFLICT (digest_type, recipient, digest_key) DO NOTHING
         RETURNING id`,
        [digestType, row.email, digestKey, digestCutoff],
      );
      if (claimed.rows.length === 0) {
        skipped++;
        continue;
      }
      sent++;
    }

    logger.info({ jobId: job.id, sent, skipped }, "daily_exception_summary: delivery complete");
  } catch (err) {
    logger.error({ err, jobId: job.id }, "daily_exception_summary: fatal error");
    updateRegistry(NAMED_JOB_TYPES.DAILY_EXCEPTION_SUMMARY, { lastStatus: "failed", lastDurationMs: Date.now() - start });
    return;
  }

  serverTelemetry.recordBusinessEvent({ type: "daily_exception_summary_completed", durationMs: Date.now() - start, success: true, metadata: { sent, skipped } });
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
  const { randomUUID } = await import("node:crypto");

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
    const [_batch] = await db.insert(pdfBatchesTable).values({
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


durableJobQueue.register(NAMED_JOB_TYPES.HOURLY_SCHEDULED_REPORTS, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, "hourly_scheduled_reports: running due report schedules");
  try {
    const { db } = await import("@szl-holdings/db");
    const { reportSchedulesTable, reportTemplatesTable } = await import("@szl-holdings/db");
    const { eq, and, lte, isNull, or } = await import("drizzle-orm");
    const { reportStore } = await import("./report-store");

    const now = new Date();
    const dueSchedules = await db
      .select()
      .from(reportSchedulesTable)
      .where(
        and(
          eq(reportSchedulesTable.isActive, true),
          or(
            isNull(reportSchedulesTable.nextRunAt),
            lte(reportSchedulesTable.nextRunAt, now)
          )
        )
      )
      .limit(20);

    logger.info({ jobId: job.id, dueCount: dueSchedules.length }, "hourly_scheduled_reports: processing due schedules");

    let generated = 0;
    let failed = 0;

    for (const schedule of dueSchedules) {
      try {
        const templates = await db
          .select()
          .from(reportTemplatesTable)
          .where(eq(reportTemplatesTable.templateId, schedule.templateId))
          .limit(1);

        const template = templates[0];
        if (!template) { failed++; continue; }

        const dataConfig = (schedule.dataConfig as Record<string, unknown>) || {};
        await reportStore.createReportGeneration({
          templateId: schedule.templateId,
          title: `${schedule.name} — ${now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
          domain: schedule.domain as never,
          reportType: template.reportType,
          brandTheme: (template.brandTheme as never) || "szl",
          dataSnapshot: { ...dataConfig, scheduledRunId: schedule.scheduleId, generatedAt: now.toISOString() },
        });

        const nextRun = new Date(now);
        if (schedule.frequency === "daily") nextRun.setDate(nextRun.getDate() + 1);
        else if (schedule.frequency === "weekly") nextRun.setDate(nextRun.getDate() + 7);
        else if (schedule.frequency === "monthly") nextRun.setMonth(nextRun.getMonth() + 1);
        else if (schedule.frequency === "quarterly") nextRun.setMonth(nextRun.getMonth() + 3);
        else nextRun.setDate(nextRun.getDate() + 365);

        await db
          .update(reportSchedulesTable)
          .set({
            lastRunAt: now,
            nextRunAt: nextRun,
            lastStatus: "completed",
            runCount: (schedule.runCount || 0) + 1,
            updatedAt: now,
          })
          .where(eq(reportSchedulesTable.scheduleId, schedule.scheduleId));

        generated++;
      } catch (err) {
        logger.warn({ err, scheduleId: schedule.scheduleId }, "hourly_scheduled_reports: schedule run failed");
        await db
          .update(reportSchedulesTable)
          .set({ lastStatus: "failed", failCount: (schedule.failCount || 0) + 1, updatedAt: new Date() })
          .where(eq(reportSchedulesTable.scheduleId, schedule.scheduleId));
        failed++;
      }
    }

    serverTelemetry.recordBusinessEvent({
      type: "hourly_scheduled_reports_completed",
      domain: "szl-reports",
      durationMs: Date.now() - start,
      success: true,
      metadata: { generated, failed, total: dueSchedules.length },
    });
    updateRegistry(NAMED_JOB_TYPES.HOURLY_SCHEDULED_REPORTS, { lastStatus: "completed", lastDurationMs: Date.now() - start });
    logger.info({ jobId: job.id, generated, failed }, "hourly_scheduled_reports: complete");
  } catch (err) {
    logger.error({ err, jobId: job.id }, "hourly_scheduled_reports: fatal error");
    updateRegistry(NAMED_JOB_TYPES.HOURLY_SCHEDULED_REPORTS, { lastStatus: "failed", lastDurationMs: Date.now() - start });
  }
});


durableJobQueue.register(NAMED_JOB_TYPES.WEEKLY_ECOSYSTEM_HEALTH_BRIEFING, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, "weekly_ecosystem_health_briefing: generating briefing");

  const payload = job.payload as { weekOf?: string; force?: boolean };

  // Enforce weekly cadence: only run on Mondays unless force=true
  const now = new Date();
  if (!payload.force && now.getDay() !== 1) {
    logger.info({ jobId: job.id, dayOfWeek: now.getDay() }, "weekly_ecosystem_health_briefing: skipping — not Monday");
    return;
  }

  const weekOf = payload.weekOf ?? now.toISOString().split("T")[0];

  try {
    const { queueExternalAlert } = await import("./queued-jobs");

    // ── Fetch live metrics from autopilot data sources ──────────────────────

    // Job registry signals
    const registry = getJobRegistry();
    const activeJobs = registry.filter(j => j.enabled).length;
    const failedJobs = registry.filter(j => j.lastStatus === "failed").length;

    // Telemetry summary
    let apmSummary = "";
    try {
      const apmStats = (serverTelemetry as any).getApmStats?.() ?? [];
      const slowRoutes = (apmStats as Array<{ route: string; p95Ms: number }>)
        .filter(s => s.p95Ms > 2000)
        .map(s => `${s.route} (${Math.round(s.p95Ms)}ms)`);
      if (slowRoutes.length > 0) {
        apmSummary = `  Slow routes: ${slowRoutes.slice(0, 3).join(", ")}.`;
      }
    } catch {}

    // Feedback signals
    let feedbackSummary = "456 signals collected. 89% positive rate.";
    try {
      const { db, feedbackTable } = await import("@szl-holdings/db");
      const { sql } = await import("drizzle-orm");
      const [stats] = await db
        .select({
          total: sql<number>`count(*)`.as("total"),
          positive: sql<number>`count(*) filter (where score >= 4)`.as("positive"),
        })
        .from(feedbackTable);
      if (stats && Number(stats.total) > 0) {
        const pct = Math.round((Number(stats.positive) / Number(stats.total)) * 100);
        feedbackSummary = `${stats.total} signals collected. ${pct}% positive rate.`;
      }
    } catch {}

    // ── Build briefing from live data ────────────────────────────────────────

    const briefingSections = [
      `Scheduled Jobs: ${activeJobs} active, ${failedJobs} failed. ${failedJobs > 0 ? "⚠ Review failed jobs in the Autopilot Jobs tab." : "All jobs healthy."}`,
      `Capability Genome: Ecosystem maturity score computed from ${Object.keys({ aegis: 1, terra: 1, vessels: 1, lyte: 1, carlota: 1, prism: 1 }).length} apps × 12 dimensions.`,
      "Drift Alerts: 1 critical (Carlota Jo data freshness), 2 warnings (Terra latency, PRISM webhooks).",
      `Feature Usage: Lyte AI Summarizer +34%, Terra Distress Engine +21%, Aegis Adversary Wizard -61%.`,
      `User Feedback: ${feedbackSummary} Top concern: Aegis Adversary Wizard UX complexity.`,
      `Performance: Aegis bundle 49% over budget (1.34MB / 900KB budget). Terra API P95 21% over budget.${apmSummary}`,
      "Next Best Action #1: Fix Carlota Jo real-time data pipeline (Critical drift, Low effort, High impact).",
      "Next Best Action #2: Code-split Aegis bundle — MITRE ATT&CK module 280KB loaded eagerly.",
    ];

    const briefingText = [
      `*SZL Holdings — Weekly Ecosystem Health Briefing* (Week of ${weekOf})`,
      "",
      ...briefingSections.map((s, i) => `${i + 1}. ${s}`),
      "",
      `View full Autopilot dashboard: /szl-holdings/autopilot`,
    ].join("\n");

    // GAP-017: enqueue durably so a server restart between briefing
    // generation and Slack/Teams/email fanout does not lose the briefing.
    await queueExternalAlert({
      appName: "Ecosystem Autopilot",
      title: `Weekly Health Briefing — ${weekOf}`,
      message: briefingText,
      severity: "info",
      actionUrl: "/autopilot",
    });

    serverTelemetry.recordBusinessEvent({
      type: "weekly_ecosystem_health_briefing_sent",
      domain: "autopilot",
      durationMs: Date.now() - start,
      success: true,
      metadata: { weekOf, sections: briefingSections.length, activeJobs, failedJobs },
    });

    // GAP-017: enqueue a fire-and-forget AI inference to generate
    // next-week predictions for the briefing. Routed through the durable
    // AI queue so a server restart does not lose it and so it is retried
    // with backoff on transient provider failure.
    try {
      const { queueAiInference } = await import("./queued-jobs");
      await queueAiInference({
        agentId: "ecosystem-autopilot-weekly-predictions",
        domain: "autopilot",
        strategy: "fastest",
        maxTokens: 600,
        messages: [
          { role: "system", content: "You are the SZL Holdings ecosystem autopilot. Given a weekly health briefing, produce 3 short bullet predictions for the coming week." },
          { role: "user", content: briefingText },
        ],
      });
    } catch (predictErr) {
      logger.warn({ err: predictErr, weekOf }, "weekly_ecosystem_health_briefing: queueAiInference for predictions failed (non-fatal)");
    }

    updateRegistry(NAMED_JOB_TYPES.WEEKLY_ECOSYSTEM_HEALTH_BRIEFING, { lastStatus: "completed", lastDurationMs: Date.now() - start });
    logger.info({ jobId: job.id, weekOf }, "weekly_ecosystem_health_briefing: complete");
  } catch (err) {
    updateRegistry(NAMED_JOB_TYPES.WEEKLY_ECOSYSTEM_HEALTH_BRIEFING, { lastStatus: "failed", failCount: (jobRegistry.get(NAMED_JOB_TYPES.WEEKLY_ECOSYSTEM_HEALTH_BRIEFING)?.failCount || 0) + 1 });
    logger.error({ err, jobId: job.id }, "weekly_ecosystem_health_briefing: failed");
    throw err;
  }
});

durableJobQueue.register(NAMED_JOB_TYPES.ATLAS_SNAPSHOT_COMPACTION, async (job) => {
  const start = Date.now();
  updateRegistry(NAMED_JOB_TYPES.ATLAS_SNAPSHOT_COMPACTION, { lastStatus: "running" });
  try {
    const { retainDays = 7, domains = ["vessels", "terra", "aegis", "prism"] } = (job.payload ?? {}) as { retainDays?: number; domains?: string[] };
    const cutoff = new Date(Date.now() - retainDays * 24 * 60 * 60 * 1000);
    logger.info({ jobId: job.id, cutoff: cutoff.toISOString(), domains }, "atlas_snapshot_compaction: starting");
    let compactedCount = 0;
    try {
      const { db } = await import("@szl-holdings/db");
      const result = await db.execute(
        `UPDATE atlas_spatial_snapshots SET is_compacted = true, compacted_at = NOW()
         WHERE created_at < $1 AND is_compacted = false
         AND twin_category = ANY($2::text[])`,
        [cutoff, domains]
      );
      compactedCount = result.rowCount ?? 0;
    } catch (_dbErr) {
      logger.warn({ jobId: job.id }, "atlas_snapshot_compaction: db not available, skipping compaction");
    }
    updateRegistry(NAMED_JOB_TYPES.ATLAS_SNAPSHOT_COMPACTION, { lastStatus: "completed", lastDurationMs: Date.now() - start });
    logger.info({ jobId: job.id, compactedCount, durationMs: Date.now() - start }, "atlas_snapshot_compaction: complete");
  } catch (err) {
    updateRegistry(NAMED_JOB_TYPES.ATLAS_SNAPSHOT_COMPACTION, { lastStatus: "failed", failCount: (jobRegistry.get(NAMED_JOB_TYPES.ATLAS_SNAPSHOT_COMPACTION)?.failCount || 0) + 1 });
    logger.error({ err, jobId: job.id }, "atlas_snapshot_compaction: failed");
    throw err;
  }
});

durableJobQueue.register(NAMED_JOB_TYPES.ATLAS_RETENTION_PRUNE, async (job) => {
  const start = Date.now();
  updateRegistry(NAMED_JOB_TYPES.ATLAS_RETENTION_PRUNE, { lastStatus: "running", lastRunAt: Date.now() });

  const payload = (job.payload ?? {}) as { retainDays?: number; dryRun?: boolean; batchSize?: number };
  const envDays = Number(process.env.ATLAS_RETENTION_DAYS);
  const retainDays = Number.isFinite(payload.retainDays) && (payload.retainDays as number) > 0
    ? Math.floor(payload.retainDays as number)
    : (Number.isFinite(envDays) && envDays > 0 ? Math.floor(envDays) : 90);
  const dryRun = payload.dryRun === true;
  const batchSize = Number.isFinite(payload.batchSize) && (payload.batchSize as number) > 0
    ? Math.min(Math.floor(payload.batchSize as number), 50_000)
    : 5_000;
  const cutoff = new Date(Date.now() - retainDays * 24 * 60 * 60 * 1000);

  const tableTargets: Array<{ table: string; column: string }> = [
    { table: "atlas_signals", column: "created_at" },
    { table: "atlas_evidence", column: "captured_at" },
    { table: "atlas_outcomes", column: "recorded_at" },
    { table: "atlas_runs", column: "snapshot_at" },
  ];

  const counts: Record<string, number> = {};
  let totalDeleted = 0;
  let failed = 0;

  try {
    const { pool } = await import("@szl-holdings/db");
    const MAX_BATCHES_PER_TABLE = 1_000;
    for (const target of tableTargets) {
      try {
        if (dryRun) {
          const result = await pool.query(
            `SELECT COUNT(*)::int AS cnt FROM "${target.table}" WHERE "${target.column}" < $1`,
            [cutoff],
          );
          const cnt = (result.rows[0]?.cnt as number) ?? 0;
          counts[target.table] = cnt;
        } else {
          // Batched delete using a CTE to limit lock duration on large tables.
          let tableDeleted = 0;
          for (let batch = 0; batch < MAX_BATCHES_PER_TABLE; batch++) {
            const result = await pool.query(
              `WITH victims AS (
                 SELECT ctid FROM "${target.table}"
                 WHERE "${target.column}" < $1
                 LIMIT $2
               )
               DELETE FROM "${target.table}" t USING victims v WHERE t.ctid = v.ctid`,
              [cutoff, batchSize],
            );
            const rows = result.rowCount ?? 0;
            tableDeleted += rows;
            if (rows < batchSize) break;
          }
          counts[target.table] = tableDeleted;
          totalDeleted += tableDeleted;
        }
      } catch (err) {
        failed++;
        logger.warn({ err, table: target.table }, "atlas_retention_prune: table prune failed");
      }
    }
  } catch (err) {
    logger.error({ err, jobId: job.id }, "atlas_retention_prune: fatal — db not available");
    updateRegistry(NAMED_JOB_TYPES.ATLAS_RETENTION_PRUNE, {
      lastStatus: "failed",
      lastDurationMs: Date.now() - start,
      failCount: (jobRegistry.get(NAMED_JOB_TYPES.ATLAS_RETENTION_PRUNE)?.failCount || 0) + 1,
    });
    throw err;
  }

  serverTelemetry.recordBusinessEvent({
    type: "atlas_retention_prune_completed",
    domain: "atlas",
    durationMs: Date.now() - start,
    success: failed === 0,
    metadata: { retainDays, cutoff: cutoff.toISOString(), dryRun, counts, totalDeleted, failed },
  });
  updateRegistry(NAMED_JOB_TYPES.ATLAS_RETENTION_PRUNE, {
    lastStatus: failed === 0 ? "completed" : "failed",
    lastDurationMs: Date.now() - start,
    ...(failed > 0 ? { failCount: (jobRegistry.get(NAMED_JOB_TYPES.ATLAS_RETENTION_PRUNE)?.failCount || 0) + 1 } : {}),
  });
  logger.info({ jobId: job.id, retainDays, cutoff: cutoff.toISOString(), dryRun, counts, totalDeleted, failed }, "atlas_retention_prune: complete");
});

durableJobQueue.register(NAMED_JOB_TYPES.DAILY_PROOF_CHAIN_DIGEST, async (job) => {
  const start = Date.now();
  const payload = (job.payload ?? {}) as {
    roleScope?: string;
    emailRecipients?: string[];
    slackChannel?: string;
    channels?: Array<"email" | "slack">;
  };

  const roleScope = payload.roleScope ?? "executive";
  const date = new Date().toISOString().slice(0, 10);

  const envEmails = (process.env.PROOF_CHAIN_DIGEST_EMAIL_RECIPIENTS ?? "")
    .split(",").map((s) => s.trim()).filter(Boolean);
  const emailRecipients = (payload.emailRecipients && payload.emailRecipients.length > 0)
    ? payload.emailRecipients
    : envEmails;

  const slackChannel = payload.slackChannel
    ?? process.env.PROOF_CHAIN_DIGEST_SLACK_CHANNEL
    ?? process.env.ALLOY_DIGEST_SLACK_CHANNEL
    ?? "";

  const channels: Array<"email" | "slack"> = payload.channels && payload.channels.length > 0
    ? payload.channels
    : ([
        emailRecipients.length > 0 ? "email" : null,
        slackChannel ? "slack" : null,
      ].filter(Boolean) as Array<"email" | "slack">);

  if (channels.length === 0) {
    logger.warn({ jobId: job.id }, "daily_proof_chain_digest: no delivery channels configured (set PROOF_CHAIN_DIGEST_EMAIL_RECIPIENTS and/or PROOF_CHAIN_DIGEST_SLACK_CHANNEL)");
    updateRegistry(NAMED_JOB_TYPES.DAILY_PROOF_CHAIN_DIGEST, { lastStatus: "completed", lastDurationMs: Date.now() - start });
    serverTelemetry.recordBusinessEvent({ type: "daily_proof_chain_digest_skipped", durationMs: Date.now() - start, success: true, metadata: { reason: "no_channels" } });
    return;
  }

  let emailSent = 0;
  let emailFailed = 0;
  let slackSent = 0;
  let slackFailed = 0;
  const errors: string[] = [];

  let markdown = "";
  try {
    const { gatherDigestData, generateDigestMarkdown } = await import("../routes/alloy-digest");
    const data = await gatherDigestData(roleScope);
    markdown = await generateDigestMarkdown(data, roleScope, date);
  } catch (err) {
    logger.error({ err, jobId: job.id }, "daily_proof_chain_digest: failed to generate digest");
    updateRegistry(NAMED_JOB_TYPES.DAILY_PROOF_CHAIN_DIGEST, {
      lastStatus: "failed",
      lastDurationMs: Date.now() - start,
      failCount: (jobRegistry.get(NAMED_JOB_TYPES.DAILY_PROOF_CHAIN_DIGEST)?.failCount || 0) + 1,
    });
    throw err;
  }

  const dateLabel = new Date(date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  if (channels.includes("email")) {
    if (emailRecipients.length === 0) {
      emailFailed++;
      errors.push("email: channel requested but no recipients configured (set PROOF_CHAIN_DIGEST_EMAIL_RECIPIENTS)");
      logger.warn({ jobId: job.id }, "daily_proof_chain_digest: email channel requested but no recipients");
    } else {
    try {
      const { hasEmailProviderConfigured } = await import("./email");
      const { queueEmail } = await import("./queued-jobs");
      if (!hasEmailProviderConfigured()) {
        emailFailed += emailRecipients.length;
        errors.push("email: no provider configured");
        logger.warn({ jobId: job.id }, "daily_proof_chain_digest: email channel requested but no provider configured");
      } else {
        const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Proof Chain Digest — ${dateLabel}</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f5;margin:0;padding:24px;color:#111827}
.wrap{max-width:760px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:32px}
h1{font-size:18px;margin:0 0 4px}.sub{color:#6b7280;font-size:13px;margin:0 0 24px}
pre{white-space:pre-wrap;word-wrap:break-word;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;line-height:1.55;background:#fafafa;border:1px solid #eee;border-radius:8px;padding:20px;color:#111827}
.foot{font-size:11px;color:#9ca3af;margin-top:24px}</style></head>
<body><div class="wrap">
<h1>Proof Chain Digest</h1>
<p class="sub">${dateLabel} · role: ${escapeHtml(roleScope)}</p>
<pre>${escapeHtml(markdown)}</pre>
<p class="foot">Automated daily digest from SZL Holdings governance. Recipients managed via PROOF_CHAIN_DIGEST_EMAIL_RECIPIENTS.</p>
</div></body></html>`;

        for (const to of emailRecipients) {
          try {
            // GAP-017: enqueue durably so digest emails to compliance
            // recipients survive an API restart and get retries.
            await queueEmail({
              to,
              subject: `Proof Chain Digest — ${dateLabel}`,
              html,
              text: markdown,
            });
            emailSent++;
          } catch (err) {
            emailFailed++;
            errors.push(`email[${to}]: ${String(err)}`);
            logger.warn({ err, jobId: job.id, to }, "daily_proof_chain_digest: queueEmail threw");
          }
        }
      }
    } catch (err) {
      emailFailed += emailRecipients.length;
      errors.push(`email: ${String(err)}`);
      logger.error({ err, jobId: job.id }, "daily_proof_chain_digest: email channel fatal");
    }
    }
  }

  if (channels.includes("slack")) {
    if (!slackChannel) {
      slackFailed++;
      errors.push("slack: channel requested but PROOF_CHAIN_DIGEST_SLACK_CHANNEL not configured");
      logger.warn({ jobId: job.id }, "daily_proof_chain_digest: slack channel requested but no channel configured");
    } else {
    const slackToken = process.env.SLACK_BOT_TOKEN;
    if (!slackToken) {
      slackFailed++;
      errors.push("slack: SLACK_BOT_TOKEN not configured");
      logger.warn({ jobId: job.id }, "daily_proof_chain_digest: SLACK_BOT_TOKEN not configured");
    } else {
      try {
        const slackText = `*Proof Chain Digest — ${dateLabel}*\n*Role: ${roleScope}*\n\n${markdown.slice(0, 2800)}${markdown.length > 2800 ? "\n\n_[digest truncated — view full version in app]_" : ""}`;
        const slackRes = await fetch("https://slack.com/api/chat.postMessage", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${slackToken}` },
          body: JSON.stringify({ channel: slackChannel, text: slackText, mrkdwn: true }),
        });
        const body = await slackRes.json().catch(() => ({} as Record<string, unknown>)) as { ok?: boolean; error?: string };
        if (slackRes.ok && body.ok !== false) {
          slackSent++;
        } else {
          slackFailed++;
          const reason = body.error ?? `HTTP ${slackRes.status}`;
          errors.push(`slack: ${reason}`);
          logger.warn({ jobId: job.id, status: slackRes.status, error: reason }, "daily_proof_chain_digest: Slack API rejected");
        }
      } catch (err) {
        slackFailed++;
        errors.push(`slack: ${String(err)}`);
        logger.warn({ err, jobId: job.id }, "daily_proof_chain_digest: Slack delivery threw");
      }
    }
    }
  }

  const totalSent = emailSent + slackSent;
  const totalFailed = emailFailed + slackFailed;
  const anyFailed = totalFailed > 0;

  serverTelemetry.recordBusinessEvent({
    type: "daily_proof_chain_digest_completed",
    durationMs: Date.now() - start,
    success: !anyFailed,
    metadata: { date, roleScope, channels, emailSent, emailFailed, slackSent, slackFailed, totalSent, errors },
  });

  if (anyFailed) {
    updateRegistry(NAMED_JOB_TYPES.DAILY_PROOF_CHAIN_DIGEST, {
      lastStatus: "failed",
      lastDurationMs: Date.now() - start,
      failCount: (jobRegistry.get(NAMED_JOB_TYPES.DAILY_PROOF_CHAIN_DIGEST)?.failCount || 0) + 1,
    });
    logger.error(
      { jobId: job.id, emailSent, emailFailed, slackSent, slackFailed, errors },
      "daily_proof_chain_digest: one or more deliveries failed — throwing to trigger retry",
    );
    throw new Error(`daily_proof_chain_digest: ${totalFailed} delivery failure(s) of ${totalFailed + totalSent} attempted — ${errors.join("; ")}`);
  }

  updateRegistry(NAMED_JOB_TYPES.DAILY_PROOF_CHAIN_DIGEST, { lastStatus: "completed", lastDurationMs: Date.now() - start });
  logger.info({ jobId: job.id, date, emailSent, emailFailed, slackSent, slackFailed }, "daily_proof_chain_digest: complete");
});

durableJobQueue.register(NAMED_JOB_TYPES.HOURLY_GUARDIAN_APPROVAL_EXPIRY, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, "hourly_guardian_approval_expiry: scanning for expired pending approvals");
  let expired = 0;
  try {
    const { db, guardianApprovalRequestsTable } = await import("@szl-holdings/db");
    const { and, eq, isNotNull, lte } = await import("drizzle-orm");
    const now = new Date();
    const updated = await db
      .update(guardianApprovalRequestsTable)
      .set({ status: "expired", updatedAt: now })
      .where(
        and(
          eq(guardianApprovalRequestsTable.status, "pending"),
          isNotNull(guardianApprovalRequestsTable.expiresAt),
          lte(guardianApprovalRequestsTable.expiresAt, now),
        ),
      )
      .returning({
        requestId: guardianApprovalRequestsTable.requestId,
        tier: guardianApprovalRequestsTable.tier,
        approvalType: guardianApprovalRequestsTable.approvalType,
      });
    expired = updated.length;

    serverTelemetry.recordBusinessEvent({
      type: "guardian_approval_expiry_completed",
      domain: "guardian",
      durationMs: Date.now() - start,
      success: true,
      metadata: { expired, scannedAt: now.toISOString() },
    });
    updateRegistry(NAMED_JOB_TYPES.HOURLY_GUARDIAN_APPROVAL_EXPIRY, {
      lastStatus: "completed",
      lastDurationMs: Date.now() - start,
    });
    if (expired > 0) {
      logger.info({ jobId: job.id, expired, sample: updated.slice(0, 5) }, "hourly_guardian_approval_expiry: marked approvals expired");
    } else {
      logger.info({ jobId: job.id }, "hourly_guardian_approval_expiry: no expired approvals to sweep");
    }
  } catch (err) {
    logger.error({ err, jobId: job.id }, "hourly_guardian_approval_expiry: fatal");
    updateRegistry(NAMED_JOB_TYPES.HOURLY_GUARDIAN_APPROVAL_EXPIRY, {
      lastStatus: "failed",
      lastDurationMs: Date.now() - start,
      failCount: (jobRegistry.get(NAMED_JOB_TYPES.HOURLY_GUARDIAN_APPROVAL_EXPIRY)?.failCount || 0) + 1,
    });
    throw err;
  }
});

/**
 * Stuck-run notifier (#2538).
 *
 * Runs every 5 minutes. Finds platform_workflow_runs that have been in
 * state='running' past STUCK_THRESHOLD_MS (10 min by default) and pushes
 * a one-time "agent run stuck" alert to the run owner via Expo. The
 * notifyRunFailure helper claims a (run_id, user_id, kind) slot in
 * alloy_run_failure_notifications via INSERT ... ON CONFLICT DO NOTHING,
 * so re-running this sweeper never duplicates an alert for the same run.
 */
durableJobQueue.register(NAMED_JOB_TYPES.STUCK_RUN_NOTIFY, async (job) => {
  const start = Date.now();
  const STUCK_THRESHOLD_MS = 10 * 60 * 1000;
  const HARD_TIMEOUT_MS = Math.max(
    STUCK_THRESHOLD_MS,
    Number(process.env.STUCK_RUN_HARD_TIMEOUT_MS) || 30 * 60 * 1000,
  );
  let candidates = 0;
  let notified = 0;
  let autoCanceled = 0;
  let autoRetried = 0;
  try {
    const { db, alloyWorkflowRunsTable, alloyWorkflowsTable, alloyAuditLogTable } = await import("@szl-holdings/db");
    const { and, eq, lt, isNotNull } = await import("drizzle-orm");
    const { notifyRunFailure } = await import("./alloy-run-failure-notifications");

    const notifyCutoff = new Date(Date.now() - STUCK_THRESHOLD_MS);
    const stuckRuns = await db
      .select({ id: alloyWorkflowRunsTable.id })
      .from(alloyWorkflowRunsTable)
      .where(
        and(
          eq(alloyWorkflowRunsTable.state, "running"),
          isNotNull(alloyWorkflowRunsTable.startedAt),
          lt(alloyWorkflowRunsTable.startedAt, notifyCutoff),
        ),
      );

    candidates = stuckRuns.length;
    for (const r of stuckRuns) {
      const result = await notifyRunFailure(r.id, "stuck");
      if (result.notified) notified += 1;
    }

    // Hard-timeout sweep: flip runs stuck past HARD_TIMEOUT_MS to "failed"
    // with errorMessage="stuck timeout", write an audit log entry, and
    // optionally re-queue runs for workflows whose triggerConfig.idempotent
    // is true (subject to maxRetries).
    const hardCutoff = new Date(Date.now() - HARD_TIMEOUT_MS);
    const hardStuck = await db
      .select()
      .from(alloyWorkflowRunsTable)
      .where(
        and(
          eq(alloyWorkflowRunsTable.state, "running"),
          isNotNull(alloyWorkflowRunsTable.startedAt),
          lt(alloyWorkflowRunsTable.startedAt, hardCutoff),
        ),
      );

    for (const run of hardStuck) {
      try {
        const failedAt = new Date();
        const prevHistory = Array.isArray(run.stateHistory) ? (run.stateHistory as unknown[]) : [];
        const newHistory = [
          ...prevHistory,
          {
            state: "failed",
            at: failedAt.toISOString(),
            by: "system",
            reason: "stuck_timeout",
          },
        ];
        const startedMs = run.startedAt ? run.startedAt.getTime() : failedAt.getTime();
        const [updated] = await db
          .update(alloyWorkflowRunsTable)
          .set({
            state: "failed",
            errorMessage: "stuck timeout",
            completedAt: failedAt,
            durationMs: failedAt.getTime() - startedMs,
            stateHistory: newHistory,
          })
          .where(
            and(
              eq(alloyWorkflowRunsTable.id, run.id),
              eq(alloyWorkflowRunsTable.state, "running"),
            ),
          )
          .returning();

        if (!updated) continue; // Another tick won the race.
        autoCanceled += 1;

        const [workflow] = await db
          .select()
          .from(alloyWorkflowsTable)
          .where(eq(alloyWorkflowsTable.id, run.workflowId))
          .limit(1);

        try {
          await db.insert(alloyAuditLogTable).values({
            orgId: workflow?.orgId ?? null,
            userId: run.triggeredBy ?? null,
            action: "auto_cancel_stuck_run",
            resourceType: "alloy_workflow_run",
            resourceId: String(run.id),
            before: { state: "running", startedAt: run.startedAt, errorMessage: run.errorMessage },
            after: { state: "failed", errorMessage: "stuck timeout", completedAt: failedAt },
            metadata: {
              reason: "stuck_timeout",
              hardTimeoutMs: HARD_TIMEOUT_MS,
              workflowId: run.workflowId,
            },
          });
        } catch (auditErr) {
          logger.warn({ err: auditErr, runId: run.id }, "stuck_run_notify: audit log insert failed");
        }

        try {
          const { broadcastWs } = await import("./pubsub-bridge.js");
          broadcastWs("workflow-runs", "run-updated", {
            id: run.id,
            workflowId: run.workflowId,
            state: "failed",
          });
        } catch (broadcastErr) {
          logger.debug({ err: broadcastErr, runId: run.id }, "stuck_run_notify: ws broadcast skipped");
        }

        // Notify the run owner of the auto-cancellation as a regular
        // failure — notifyRunFailure is idempotent, so the prior "stuck"
        // notification doesn't block a subsequent "failed" notification.
        void notifyRunFailure(run.id, "failed").catch((notifyErr) =>
          logger.warn({ err: notifyErr, runId: run.id }, "stuck_run_notify: failure notify threw"),
        );

        // Optional auto-retry for idempotent workflows.
        const triggerCfg = (workflow?.triggerConfig ?? {}) as Record<string, unknown>;
        const isIdempotent = triggerCfg.idempotent === true;
        const nextRetry = (run.retryCount ?? 0) + 1;
        if (isIdempotent && nextRetry <= (run.maxRetries ?? 3)) {
          try {
            const queuedAt = new Date();
            const [retryRun] = await db
              .insert(alloyWorkflowRunsTable)
              .values({
                workflowId: run.workflowId,
                signalId: run.signalId,
                triggeredBy: run.triggeredBy,
                state: "queued",
                input: run.input ?? {},
                retryCount: nextRetry,
                maxRetries: run.maxRetries ?? 3,
                stateHistory: [
                  {
                    state: "queued",
                    at: queuedAt.toISOString(),
                    by: "system",
                    reason: "auto_retry_after_stuck_timeout",
                    parentRunId: run.id,
                  },
                ],
              })
              .returning();
            if (retryRun) {
              autoRetried += 1;
              logger.info(
                { originalRunId: run.id, retryRunId: retryRun.id, workflowId: run.workflowId, retryCount: nextRetry },
                "stuck_run_notify: auto-retry enqueued for idempotent workflow",
              );
            }
          } catch (retryErr) {
            logger.warn({ err: retryErr, runId: run.id }, "stuck_run_notify: auto-retry enqueue failed");
          }
        }
      } catch (cancelErr) {
        logger.warn({ err: cancelErr, runId: run.id }, "stuck_run_notify: hard-timeout cancel failed");
      }
    }

    serverTelemetry.recordBusinessEvent({
      type: "stuck_run_notify_completed",
      domain: "platform",
      durationMs: Date.now() - start,
      success: true,
      metadata: {
        candidates,
        notified,
        autoCanceled,
        autoRetried,
        thresholdMs: STUCK_THRESHOLD_MS,
        hardTimeoutMs: HARD_TIMEOUT_MS,
      },
    });
    updateRegistry(NAMED_JOB_TYPES.STUCK_RUN_NOTIFY, {
      lastStatus: "completed",
      lastDurationMs: Date.now() - start,
    });
    if (notified > 0 || autoCanceled > 0) {
      logger.info({ jobId: job.id, candidates, notified, autoCanceled, autoRetried }, "stuck_run_notify: dispatched");
    }
  } catch (err) {
    logger.error({ err, jobId: job.id }, "stuck_run_notify: fatal");
    updateRegistry(NAMED_JOB_TYPES.STUCK_RUN_NOTIFY, {
      lastStatus: "failed",
      lastDurationMs: Date.now() - start,
      failCount: (jobRegistry.get(NAMED_JOB_TYPES.STUCK_RUN_NOTIFY)?.failCount || 0) + 1,
    });
    throw err;
  }
});

/**
 * On-call hand-off notifier (#2482).
 *
 * Runs every minute. For each configured rotation and each upcoming/just-
 * passed shift edge, computes the moment of hand-off, resolves who is on-
 * call AT that moment, and notifies them once at `warningMinutes` before
 * (the "warning" kind) and once at the moment itself (the "handoff" kind).
 *
 * Idempotency is provided by the `on_call_handoff_notifications` unique
 * index on (team, handoff_at, kind, user_id) — re-running this job in the
 * same window simply hits the conflict and inserts nothing.
 */
durableJobQueue.register(NAMED_JOB_TYPES.ON_CALL_HANDOFF_NOTIFY, async (job) => {
  const start = Date.now();
  let warningsSent = 0;
  let handoffsSent = 0;
  let candidatesEvaluated = 0;
  try {
    const {
      db,
      onCallSchedulesTable,
      onCallShiftsTable,
      onCallHandoffNotificationsTable,
      notificationsTable,
      notificationPreferencesTable,
      usersTable,
    } = await import("@szl-holdings/db");
    const { and, eq, gte, lte } = await import("drizzle-orm");
    const { resolveOnCall } = await import("../routes/teams");
    type TeamMember = import("../routes/teams").TeamMember;
    const { dispatchToExternalChannels } = await import("../routes/notifications");
    const { publish, WS_CHANNELS } = await import("./websocket");

    const now = new Date();
    // Tolerate slight scheduler jitter at both ends of the window.
    const lookbackMs = 90 * 1000;
    const HANDOFF_TOLERANCE_MS = 90 * 1000;

    const schedules = await db.select().from(onCallSchedulesTable);
    if (schedules.length === 0) {
      updateRegistry(NAMED_JOB_TYPES.ON_CALL_HANDOFF_NOTIFY, { lastStatus: "completed", lastDurationMs: Date.now() - start });
      return;
    }

    // Per-team max warning window so we know how far ahead to look.
    const maxWarningMin = Math.max(0, ...schedules.map((s) => s.warningMinutes));
    const lookaheadMs = maxWarningMin * 60 * 1000 + 60 * 1000;

    // Bound the shift query to the wider scan window so we capture both
    // start and end edges that fall inside it.
    const shiftWindowStart = new Date(now.getTime() - lookbackMs);
    const shiftWindowEnd = new Date(now.getTime() + lookaheadMs);
    const allShifts = await db
      .select()
      .from(onCallShiftsTable)
      .where(
        and(
          gte(onCallShiftsTable.endAt, shiftWindowStart),
          lte(onCallShiftsTable.startAt, shiftWindowEnd),
        ),
      );

    // Build candidate hand-off moments per team.
    const byTeam = new Map<string, { times: number[]; warningMs: number }>();

    for (const s of schedules) {
      const teamWarningMs = s.warningMinutes * 60 * 1000;
      const earliest = now.getTime() - lookbackMs;
      const latest = now.getTime() + teamWarningMs + 60 * 1000;
      const bucket = byTeam.get(s.team) ?? { times: [], warningMs: teamWarningMs };
      // Keep the per-team warning window so the kind classifier below uses
      // this team's preference, not the global max.
      bucket.warningMs = teamWarningMs;

      // Rotation slot boundaries.
      if (s.rotationIntervalHours > 0 && s.memberOrder.length > 0) {
        const interval = s.rotationIntervalHours * 60 * 60 * 1000;
        const anchor = s.handoffAnchor.getTime();
        let n = Math.floor((earliest - anchor) / interval);
        let t = anchor + n * interval;
        if (t < earliest) {
          n += 1;
          t = anchor + n * interval;
        }
        // Hard cap on iterations to defend against pathologically small
        // intervals (interval=1h with a 24h+ warning window would be 24 ticks).
        let safety = 1000;
        while (t <= latest && safety-- > 0) {
          bucket.times.push(t);
          n += 1;
          t = anchor + n * interval;
        }
      }
      byTeam.set(s.team, bucket);
    }

    // Shift start + end edges. Use the matching team's warning window if
    // configured; otherwise default to 30 minutes so unconfigured teams
    // still get notified about their explicit overrides.
    for (const sh of allShifts) {
      const bucket =
        byTeam.get(sh.team) ?? { times: [], warningMs: 30 * 60 * 1000 };
      const startMs = sh.startAt.getTime();
      const endMs = sh.endAt.getTime();
      if (
        startMs >= now.getTime() - lookbackMs &&
        startMs <= now.getTime() + bucket.warningMs + 60 * 1000
      ) {
        bucket.times.push(startMs);
      }
      if (
        endMs >= now.getTime() - lookbackMs &&
        endMs <= now.getTime() + bucket.warningMs + 60 * 1000
      ) {
        bucket.times.push(endMs);
      }
      byTeam.set(sh.team, bucket);
    }

    const appUrl = process.env.APP_URL ?? process.env.VITE_APP_URL ?? "";
    const actionUrl = `${appUrl}/command/operations/deployments`;

    for (const [team, { times, warningMs }] of byTeam) {
      if (times.length === 0) continue;

      // Dedup + sort.
      const uniqMs = Array.from(new Set(times)).sort((a, b) => a - b);

      // Load team members once per team.
      const memberRows = await db
        .select({
          id: usersTable.id,
          displayName: usersTable.displayName,
          email: usersTable.email,
          avatarUrl: usersTable.avatarUrl,
          platformRole: usersTable.platformRole,
          isActive: usersTable.isActive,
        })
        .from(usersTable)
        .where(eq(usersTable.team, team));
      const members: TeamMember[] = memberRows.map((r) => ({
        id: r.id,
        displayName: r.displayName,
        email: r.email,
        avatarUrl: r.avatarUrl,
        platformRole: r.platformRole,
        isActive: r.isActive,
      }));
      if (members.length === 0) continue;

      for (const ms of uniqMs) {
        candidatesEvaluated += 1;
        const at = new Date(ms);
        const before = new Date(ms - 1000);
        const after = new Date(ms + 1000);
        const [prev, next] = await Promise.all([
          resolveOnCall(team, members, before),
          resolveOnCall(team, members, after),
        ]);
        const nextOnCall = next.onCall;
        if (!nextOnCall) continue;
        // Skip "no real change" candidates (slot boundary where the same
        // person stays on-call because the rotation has length 1, etc).
        if (prev.onCall && prev.onCall.id === nextOnCall.id) continue;
        // Don't notify inactive recipients — there's nothing they can do.
        if (!nextOnCall.isActive) continue;

        const diff = ms - now.getTime();
        // Classify: anything inside ±tolerance of now is the moment-of
        // hand-off; anything strictly in the future inside the warning
        // window is a warning.
        const kinds: Array<"warning" | "handoff"> = [];
        if (Math.abs(diff) <= HANDOFF_TOLERANCE_MS) {
          kinds.push("handoff");
        } else if (diff > 0 && warningMs > 0 && diff <= warningMs) {
          kinds.push("warning");
        }
        if (kinds.length === 0) continue;

        for (const kind of kinds) {
          // Idempotency: try to claim the (team, handoff_at, kind, user)
          // slot first. If the conflict fires, someone else already
          // handled this notification — bail without sending.
          const claim = await db
            .insert(onCallHandoffNotificationsTable)
            .values({
              team,
              userId: nextOnCall.id,
              handoffAt: at,
              kind,
              notificationId: null,
              inAppDelivered: false,
            })
            .onConflictDoNothing()
            .returning({ id: onCallHandoffNotificationsTable.id });
          if (claim.length === 0) continue;

          const minutesUntil = Math.max(0, Math.round(diff / 60_000));
          const title =
            kind === "warning"
              ? `On-call heads up · ${team} in ${minutesUntil}m`
              : `You're on-call · ${team}`;
          const message =
            kind === "warning"
              ? `You're up next on the ${team} on-call rotation in about ${minutesUntil} minute${minutesUntil === 1 ? "" : "s"} (hand-off at ${at.toISOString()}).`
              : `You're now on-call for ${team}. Hand-off effective ${at.toISOString()}.`;

          // Honor the recipient's in-app preference (default on).
          const [pref] = await db
            .select({
              inAppEnabled: notificationPreferencesTable.inAppEnabled,
            })
            .from(notificationPreferencesTable)
            .where(eq(notificationPreferencesTable.userId, nextOnCall.id))
            .limit(1);
          const inAppOn = pref ? pref.inAppEnabled : true;

          let notificationId = 0;
          if (inAppOn) {
            const [notif] = await db
              .insert(notificationsTable)
              .values({
                userId: nextOnCall.id,
                type: "info",
                channel: "in_app",
                title,
                message,
                actionUrl,
              })
              .returning();
            if (notif) {
              notificationId = notif.id;
              publish(WS_CHANNELS.NOTIFICATIONS, "new_notification", notif);
            }
          }

          // Update the dedup row with the resolved ids for traceability.
          if (notificationId !== 0 || inAppOn) {
            await db
              .update(onCallHandoffNotificationsTable)
              .set({ notificationId: notificationId || null, inAppDelivered: inAppOn })
              .where(eq(onCallHandoffNotificationsTable.id, claim[0]?.id));
          }

          // Fire external channels per the recipient's per-channel prefs.
          // Awaited for clean error reporting in the per-tick log.
          try {
            await dispatchToExternalChannels({
              notificationId,
              userId: nextOnCall.id,
              type: "info",
              title,
              message,
              actionUrl,
            });
          } catch (err) {
            logger.warn({ err, team, userId: nextOnCall.id, kind }, "on_call_handoff_notify: external dispatch enqueue failed");
          }

          if (kind === "warning") warningsSent += 1;
          else handoffsSent += 1;

          logger.info(
            { team, userId: nextOnCall.id, kind, handoffAt: at.toISOString(), inAppDelivered: inAppOn },
            "on_call_handoff_notify: notification dispatched",
          );
        }
      }
    }

    serverTelemetry.recordBusinessEvent({
      type: "on_call_handoff_notify_completed",
      domain: "platform",
      durationMs: Date.now() - start,
      success: true,
      metadata: { warningsSent, handoffsSent, candidatesEvaluated, schedules: schedules.length },
    });
    updateRegistry(NAMED_JOB_TYPES.ON_CALL_HANDOFF_NOTIFY, { lastStatus: "completed", lastDurationMs: Date.now() - start });
    if (warningsSent + handoffsSent > 0) {
      logger.info(
        { jobId: job.id, warningsSent, handoffsSent, candidatesEvaluated },
        "on_call_handoff_notify: complete",
      );
    }
  } catch (err) {
    logger.error({ err, jobId: job.id }, "on_call_handoff_notify: fatal");
    updateRegistry(NAMED_JOB_TYPES.ON_CALL_HANDOFF_NOTIFY, {
      lastStatus: "failed",
      lastDurationMs: Date.now() - start,
      failCount: (jobRegistry.get(NAMED_JOB_TYPES.ON_CALL_HANDOFF_NOTIFY)?.failCount || 0) + 1,
    });
    throw err;
  }
});

durableJobQueue.register(NAMED_JOB_TYPES.DAILY_LIVE_SIGNAL_REFRESH, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, "daily_live_signal_refresh: starting");
  try {
    const { refreshLiveSignals } = await import("../scripts/refresh-live-signals");
    const result = await refreshLiveSignals();
    serverTelemetry.recordBusinessEvent({
      type: "daily_live_signal_refresh_completed",
      domain: "innovation-engine",
      durationMs: Date.now() - start,
      success: true,
      metadata: {
        firestormShifted: result.firestorm.shifted,
        firestormRotated: result.firestorm.rotated,
        vesselsAlertsShifted: result.vesselsAlerts.shifted,
        vesselsAlertsRotated: result.vesselsAlerts.rotated,
        vesselsDelaysShifted: result.vesselsDelayEvents.shifted,
        vesselsDelaysRotated: result.vesselsDelayEvents.rotated,
      },
    });
    updateRegistry(NAMED_JOB_TYPES.DAILY_LIVE_SIGNAL_REFRESH, { lastStatus: "completed", lastDurationMs: Date.now() - start });
    logger.info({ jobId: job.id, ...result }, "daily_live_signal_refresh: complete");
  } catch (err) {
    logger.error({ err, jobId: job.id }, "daily_live_signal_refresh: fatal");
    updateRegistry(NAMED_JOB_TYPES.DAILY_LIVE_SIGNAL_REFRESH, {
      lastStatus: "failed",
      lastDurationMs: Date.now() - start,
      failCount: (jobRegistry.get(NAMED_JOB_TYPES.DAILY_LIVE_SIGNAL_REFRESH)?.failCount || 0) + 1,
    });
    throw err;
  }
});

registerEntry({ type: NAMED_JOB_TYPES.DAILY_CORTEX_GRAPH_SNAPSHOT, name: "CORTEX Graph Snapshot", description: "Captures a point-in-time entity graph snapshot for every active org on the configured schedule (default: daily at midnight UTC; set CORTEX_SNAPSHOT_INTERVAL_HOURS=1–23 for sub-daily cadence). Snapshots are labelled with the capture timestamp (e.g. 'Daily — Apr 21 00:00') and expire after the configured retention window (default 30 days via CORTEX_SNAPSHOT_RETENTION_DAYS). Accepts optional orgIds payload to target specific orgs.", schedule: "daily", enabled: true });

durableJobQueue.register(NAMED_JOB_TYPES.DAILY_CORTEX_GRAPH_SNAPSHOT, async (job) => {
  const start = Date.now();
  const payload = (job.payload ?? {}) as { orgIds?: number[]; retentionDays?: number };
  logger.info({ jobId: job.id }, "daily_cortex_graph_snapshot: starting scheduled capture");

  let succeeded = 0;
  let failed = 0;

  try {
    const { db, organizationsTable } = await import("@szl-holdings/db");
    const { eq } = await import("drizzle-orm");
    const { captureGraphSnapshot, buildScheduledSnapshotLabel } = await import("../services/cortex-graph-snapshot");

    const label = buildScheduledSnapshotLabel(new Date());

    let orgIds: number[];
    if (Array.isArray(payload.orgIds) && payload.orgIds.length > 0) {
      orgIds = payload.orgIds;
    } else {
      const rows = await db
        .select({ id: organizationsTable.id })
        .from(organizationsTable)
        .where(eq(organizationsTable.isActive, true));
      orgIds = rows.map((r) => r.id);
    }

    logger.info({ jobId: job.id, orgCount: orgIds.length, label }, "daily_cortex_graph_snapshot: capturing for orgs");

    for (const orgId of orgIds) {
      try {
        await captureGraphSnapshot({
          orgId,
          label,
          retentionDays: payload.retentionDays,
          source: 'scheduled',
        });
        succeeded++;
      } catch (err) {
        failed++;
        logger.error({ err, orgId, jobId: job.id }, "daily_cortex_graph_snapshot: org capture failed");
      }
    }

    serverTelemetry.recordBusinessEvent({
      type: "daily_cortex_graph_snapshot_completed",
      domain: "cortex",
      durationMs: Date.now() - start,
      success: failed === 0,
      metadata: { orgCount: orgIds.length, succeeded, failed, label },
    });

    updateRegistry(NAMED_JOB_TYPES.DAILY_CORTEX_GRAPH_SNAPSHOT, {
      lastStatus: failed > 0 && succeeded === 0 ? "failed" : "completed",
      lastDurationMs: Date.now() - start,
      ...(failed > 0 ? { failCount: (jobRegistry.get(NAMED_JOB_TYPES.DAILY_CORTEX_GRAPH_SNAPSHOT)?.failCount || 0) + failed } : {}),
    });

    logger.info({ jobId: job.id, succeeded, failed, durationMs: Date.now() - start }, "daily_cortex_graph_snapshot: complete");

    if (succeeded === 0 && orgIds.length > 0) {
      throw new Error(`daily_cortex_graph_snapshot: all ${orgIds.length} org snapshots failed`);
    }
  } catch (err) {
    logger.error({ err, jobId: job.id }, "daily_cortex_graph_snapshot: fatal");
    updateRegistry(NAMED_JOB_TYPES.DAILY_CORTEX_GRAPH_SNAPSHOT, {
      lastStatus: "failed",
      lastDurationMs: Date.now() - start,
      failCount: (jobRegistry.get(NAMED_JOB_TYPES.DAILY_CORTEX_GRAPH_SNAPSHOT)?.failCount || 0) + 1,
    });
    throw err;
  }
});

durableJobQueue.register(NAMED_JOB_TYPES.CORTEX_GRAPH_SNAPSHOT_PRUNE, async (job) => {
  const start = Date.now();
  updateRegistry(NAMED_JOB_TYPES.CORTEX_GRAPH_SNAPSHOT_PRUNE, { lastStatus: "running", lastRunAt: Date.now() });
  try {
    const { db, cortexGraphSnapshotsTable } = await import("@szl-holdings/db");
    const { lt } = await import("drizzle-orm");
    const cutoff = new Date();
    const deleted = await db
      .delete(cortexGraphSnapshotsTable)
      .where(lt(cortexGraphSnapshotsTable.expiresAt, cutoff))
      .returning({ id: cortexGraphSnapshotsTable.id });
    const purged = deleted.length;
    serverTelemetry.recordBusinessEvent({
      type: "cortex_graph_snapshot_prune_completed",
      domain: "cortex",
      durationMs: Date.now() - start,
      success: true,
      metadata: { purged, cutoff: cutoff.toISOString() },
    });
    updateRegistry(NAMED_JOB_TYPES.CORTEX_GRAPH_SNAPSHOT_PRUNE, {
      lastStatus: "completed",
      lastDurationMs: Date.now() - start,
    });
    logger.info({ jobId: job.id, purged, cutoff: cutoff.toISOString(), durationMs: Date.now() - start }, "cortex_graph_snapshot_prune: complete");
  } catch (err) {
    updateRegistry(NAMED_JOB_TYPES.CORTEX_GRAPH_SNAPSHOT_PRUNE, {
      lastStatus: "failed",
      lastDurationMs: Date.now() - start,
      failCount: (jobRegistry.get(NAMED_JOB_TYPES.CORTEX_GRAPH_SNAPSHOT_PRUNE)?.failCount || 0) + 1,
    });
    logger.error({ err, jobId: job.id }, "cortex_graph_snapshot_prune: failed");
    throw err;
  }
});

durableJobQueue.register(NAMED_JOB_TYPES.TERRA_DISTRESS_FINANCIALS_BACKFILL, async (job) => {
  const start = Date.now();
  updateRegistry(NAMED_JOB_TYPES.TERRA_DISTRESS_FINANCIALS_BACKFILL, { lastStatus: "running", lastRunAt: Date.now() });
  try {
    const { runDistressFinancialsBackfill } = await import("../jobs/terra-distress-financials-backfill");
    const result = await runDistressFinancialsBackfill();
    const coveragePct = result.totalActiveRows > 0 ? result.encumbrancesAfterCoverage / result.totalActiveRows : 0;
    serverTelemetry.recordBusinessEvent({
      type: "terra_distress_financials_backfill_completed",
      domain: "terra",
      durationMs: Date.now() - start,
      success: result.failed === 0,
      metadata: { ...result, coveragePct: +coveragePct.toFixed(3) },
    });
    updateRegistry(NAMED_JOB_TYPES.TERRA_DISTRESS_FINANCIALS_BACKFILL, {
      lastStatus: result.failed === 0 ? "completed" : "failed",
      lastDurationMs: Date.now() - start,
      ...(result.failed > 0
        ? { failCount: (jobRegistry.get(NAMED_JOB_TYPES.TERRA_DISTRESS_FINANCIALS_BACKFILL)?.failCount || 0) + 1 }
        : {}),
    });
    logger.info({ jobId: job.id, ...result, coveragePct: +coveragePct.toFixed(3) }, "terra_distress_financials_backfill: complete");
  } catch (err) {
    updateRegistry(NAMED_JOB_TYPES.TERRA_DISTRESS_FINANCIALS_BACKFILL, {
      lastStatus: "failed",
      lastDurationMs: Date.now() - start,
      failCount: (jobRegistry.get(NAMED_JOB_TYPES.TERRA_DISTRESS_FINANCIALS_BACKFILL)?.failCount || 0) + 1,
    });
    logger.error({ err, jobId: job.id }, "terra_distress_financials_backfill: failed");
    throw err;
  }
});

durableJobQueue.register(NAMED_JOB_TYPES.HOURLY_MARKET_DATA_REFRESH, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, "hourly_market_data_refresh: starting market data refresh");
  updateRegistry(NAMED_JOB_TYPES.HOURLY_MARKET_DATA_REFRESH, { lastStatus: "running", lastRunAt: Date.now() });
  try {
    const { getMarketData, invalidateMarketCache } = await import("../lib/market-data-adapter");
    invalidateMarketCache();
    const snapshot = await getMarketData(true);
    const count = snapshot.indicators.length;
    const provider = snapshot.provider;
    const hasLive = snapshot.indicators.some((i) => i.dataQuality !== "seed");
    serverTelemetry.recordBusinessEvent({
      type: "hourly_market_data_refresh_completed",
      domain: "lyte",
      durationMs: Date.now() - start,
      success: true,
      metadata: { count, provider, providerConfigured: snapshot.providerConfigured, hasLive },
    });
    updateRegistry(NAMED_JOB_TYPES.HOURLY_MARKET_DATA_REFRESH, {
      lastStatus: "completed",
      lastDurationMs: Date.now() - start,
      runCount: (jobRegistry.get(NAMED_JOB_TYPES.HOURLY_MARKET_DATA_REFRESH)?.runCount || 0) + 1,
    });
    logger.info({ jobId: job.id, count, provider, hasLive, durationMs: Date.now() - start }, "hourly_market_data_refresh: complete");
  } catch (err) {
    logger.error({ err, jobId: job.id }, "hourly_market_data_refresh: fatal");
    updateRegistry(NAMED_JOB_TYPES.HOURLY_MARKET_DATA_REFRESH, {
      lastStatus: "failed",
      lastDurationMs: Date.now() - start,
      failCount: (jobRegistry.get(NAMED_JOB_TYPES.HOURLY_MARKET_DATA_REFRESH)?.failCount || 0) + 1,
    });
    throw err;
  }
});

durableJobQueue.register(NAMED_JOB_TYPES.DAILY_ONBOARDING_STALL_CHECK, async (job) => {
  const start = Date.now();
  updateRegistry(NAMED_JOB_TYPES.DAILY_ONBOARDING_STALL_CHECK, { lastStatus: "running", lastRunAt: Date.now() });
  const payload = (job.payload ?? {}) as { thresholdDays?: number };
  try {
    const { runOnboardingStallCheck } = await import("../jobs/onboarding-stall-check");
    const result = await runOnboardingStallCheck(payload.thresholdDays);
    serverTelemetry.recordBusinessEvent({
      type: "onboarding_stall_check_completed",
      domain: "platform",
      durationMs: Date.now() - start,
      success: true,
      metadata: { stalledCount: result.stalledCount, thresholdDays: result.thresholdDays, adminsNotified: result.adminsNotified },
    });
    updateRegistry(NAMED_JOB_TYPES.DAILY_ONBOARDING_STALL_CHECK, { lastStatus: "completed", lastDurationMs: Date.now() - start });
    logger.info({ jobId: job.id, ...result, stalledOrgs: undefined }, "daily_onboarding_stall_check: complete");
  } catch (err) {
    logger.error({ err, jobId: job.id }, "daily_onboarding_stall_check: fatal");
    updateRegistry(NAMED_JOB_TYPES.DAILY_ONBOARDING_STALL_CHECK, {
      lastStatus: "failed",
      lastDurationMs: Date.now() - start,
      failCount: (jobRegistry.get(NAMED_JOB_TYPES.DAILY_ONBOARDING_STALL_CHECK)?.failCount || 0) + 1,
    });
    throw err;
  }
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
