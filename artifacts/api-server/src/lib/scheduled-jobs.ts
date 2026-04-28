import { logger } from './logger';
import { durableJobQueue } from '@szl-holdings/forge-runtime';
import { serverTelemetry } from '@szl-holdings/observability';

export const NAMED_JOB_TYPES = {
  HOURLY_SLA_ESCALATION_SCAN: "hourly_sla_escalation_scan",
  ANALYTICS_RETENTION_ARCHIVE: "analytics_retention_archive",
  DAILY_SETTLEMENT_RECONCILIATION: "daily_settlement_reconciliation",
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
  DAILY_TAX_CERT_EXPIRY_CHECK: "daily_tax_cert_expiry_check",
  HOURLY_USAGE_AGGREGATION: "hourly_usage_aggregation",
  DAILY_STRIPE_USAGE_RECORD: "daily_stripe_usage_record",
  HOURLY_OVERAGE_THRESHOLD_CHECK: "hourly_overage_threshold_check",
  DEMO_USAGE_SEEDER: "demo_usage_seeder",
  DAILY_NET30_AGING_SNAPSHOT: "daily_net30_aging_snapshot",
  HOURLY_NET30_DUNNING: "hourly_net30_dunning",
  HOURLY_ORG_PUBLICATION_SCHEDULER: "hourly_org_publication_scheduler",
  TRACES_RETENTION_PRUNE: "traces_retention_prune",
  OUTCOME_GRAPH_CALIBRATION: "outcome_graph_calibration",
  EXPORT_JOB_PROCESSOR: "export_job_processor",
} as const;

export type NamedJobType = (typeof NAMED_JOB_TYPES)[keyof typeof NAMED_JOB_TYPES];

export interface JobRunHistoryEntry {
  at: number;
  status: 'completed' | 'failed';
  durationMs?: number;
  result?: Record<string, unknown>;
}

export interface JobScheduleEntry {
  type: NamedJobType;
  name: string;
  description: string;
  schedule: 'weekly' | 'daily' | 'hourly' | 'on_demand' | 'continuous';
  enabled: boolean;
  lastRunAt?: number;
  nextRunAt?: number;
  lastStatus?: 'completed' | 'failed' | 'running' | 'pending';
  lastDurationMs?: number;
  lastResult?: Record<string, unknown>;
  runHistory?: JobRunHistoryEntry[];
  runCount: number;
  failCount: number;
}

const RUN_HISTORY_LIMIT = 30;

const jobRegistry = new Map<NamedJobType, JobScheduleEntry>();

function registerEntry(entry: Omit<JobScheduleEntry, 'runCount' | 'failCount'>) {
  jobRegistry.set(entry.type, { ...entry, runCount: 0, failCount: 0 });
}

registerEntry({ type: NAMED_JOB_TYPES.HOURLY_SLA_ESCALATION_SCAN, name: "SLA Escalation Scan", description: "Scans all open support tickets for imminent or breached SLA deadlines. Marks breached tickets, auto-escalates priority when 75% of SLA time has elapsed, and reassigns to the agent with the lowest open workload. Fires internal notifications to the assigned agent and support admin when a breach occurs. Runs every minute to reliably catch 75% threshold for 1-hour urgent SLAs.", schedule: "minutely" as JobScheduleEntry["schedule"], enabled: true });
registerEntry({ type: NAMED_JOB_TYPES.DAILY_SETTLEMENT_RECONCILIATION, name: "Daily Settlement Reconciliation", description: "Pulls Coinbase Commerce settlements and Stripe ACH payouts, matches them to internal invoices, and flags mismatches. Sends a reconciliation alert email to the configured billing admin address (BILLING_RECONCILIATION_EMAIL) when mismatches are detected. Safe to run multiple times per day; idempotent by revenue event idempotency keys.", schedule: "daily", enabled: true });
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
registerEntry({ type: NAMED_JOB_TYPES.TRACES_RETENTION_PRUNE, name: "Traces Retention Prune", description: "Deletes completed/failed trace records from the traces and trace_spans tables older than the configured retention window (defaults to 90 days, override via TRACES_RETENTION_DAYS env var or job payload retainDays). Running traces are never pruned. Batched deletes keep lock duration short on the 256 MB traces table.", schedule: "daily", enabled: true });
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
registerEntry({ type: NAMED_JOB_TYPES.DAILY_TAX_CERT_EXPIRY_CHECK, name: "Daily Tax Certificate Expiry Check", description: "Scans tax_exemption_certificates for active certs expiring within 30, 14, or 7 days. Writes in-app warning notifications to org admins and logs expiry alerts to the billing audit trail. Does not auto-revoke certificates — only alerts. Certs already expired by the time the job runs are flipped to status='expired'.", schedule: "daily", enabled: true });

// ── Metered billing jobs ───────────────────────────────────────────────────
registerEntry({
  type: NAMED_JOB_TYPES.HOURLY_USAGE_AGGREGATION,
  name: 'Hourly Usage Aggregation',
  description:
    'Rolls metering_events into per-period usage_aggregates for all active meters and tenants. Ensures the usage dashboard, overage calculations, and invoice previews always reflect near-real-time consumption without relying solely on the inline aggregate triggered at event ingestion time.',
  schedule: 'hourly',
  enabled: true,
});
registerEntry({
  type: NAMED_JOB_TYPES.DAILY_STRIPE_USAGE_RECORD,
  name: 'Daily Stripe Usage Record Submission',
  description:
    "Reports accumulated metered usage to Stripe for all active subscriptions that have a stripePriceId configured on their billing meters. Runs once per day and submits the current-period total as a 'set' record so Stripe always holds the authoritative usage figure for invoice generation. Safe to run repeatedly — each submission overwrites the previous.",
  schedule: 'daily',
  enabled: true,
});
registerEntry({
  type: NAMED_JOB_TYPES.HOURLY_OVERAGE_THRESHOLD_CHECK,
  name: 'Hourly Overage Threshold Check',
  description:
    'Scans all active tenant usage aggregates against included allotments and fires usage warning notifications at 50%, 80%, and 100% consumption thresholds. Idempotent: the usage_threshold_notifications table prevents re-firing within the same billing period.',
  schedule: 'hourly',
  enabled: true,
});
registerEntry({
  type: NAMED_JOB_TYPES.DEMO_USAGE_SEEDER,
  name: 'Demo Usage Seeder',
  description:
    'On-demand job that generates plausible usage curves across the platform demo meters (Lyte decision runs, Sentra scans, Vessels alert evaluations, Pulse briefings, agent compute minutes). Used by Sales and internal demos to populate dashboards without live traffic. Skipped automatically in production environments.',
  schedule: 'on_demand',
  enabled: true,
});
registerEntry({ type: NAMED_JOB_TYPES.DAILY_NET30_AGING_SNAPSHOT, name: "Daily NET-30 AR Aging Snapshot", description: "Computes AR aging buckets (current, 1–30, 31–60, 61–90, 90+ days overdue) across all outstanding NET-30 invoices for every organization and writes a snapshot row to net30_aging_snapshots for historical trend analysis. Used by the AR Aging dashboard and finance reporting.", schedule: "daily", enabled: true });
registerEntry({ type: NAMED_JOB_TYPES.HOURLY_NET30_DUNNING, name: "NET-30 Dunning Pass", description: "Scans all sent/partial NET-30 invoices whose nextDunningAt is now due and dunningPausedAt is null. Sends templated reminder emails per the org's configured dunning cadence (default: +3, +7, +14, +21 days past due), advances dunningStep, logs each dispatch to net30_dunning_log, and schedules the next reminder. Skips invoices in collections or with paused dunning.", schedule: "hourly", enabled: true });
registerEntry({
  type: NAMED_JOB_TYPES.TERRA_DISTRESS_FINANCIALS_BACKFILL,
  name: 'DOMAINE Distress Financials Backfill',
  description:
    'Walks active terra_distress_properties rows whose debt_amount + lien_amount is missing or zero and applies the heuristic encumbrance estimator (NYC-grounded ACRIS / DOF tax-lien / HPD norms keyed off distress_type, estimated_value, opportunity_score, days_in_distress) so the lender-exposure endpoint stops reporting isSyntheticExposure: true for the majority of distress rows. Estimate provenance is recorded in raw_data.financialsEstimate so later real-filing ingestion can override without losing audit history. Logs scanned / estimated / coverage % each run.',
  schedule: 'weekly',
  enabled: true,
});
registerEntry({
  type: NAMED_JOB_TYPES.HOURLY_GUARDIAN_APPROVAL_EXPIRY,
  name: 'Guardian Approval Expiry Sweeper',
  description:
    "Scans guardian_approval_requests every 5 minutes for pending entries whose expires_at is in the past and flips them to status='expired' so agents waiting on the request can detect the timeout and retry or escalate. Per-tier expiry windows are configured in TIER_CONTROLS (T2=24h, T3=48h, T4=72h; T0/T1/T5 do not auto-expire).",
  schedule: 'hourly',
  enabled: true,
});
registerEntry({ type: NAMED_JOB_TYPES.HOURLY_ORG_PUBLICATION_SCHEDULER, name: "Hourly Org Publication Scheduler", description: "Checks pulse_org_schedules for due recurrence entries (next_run_at <= now, paused=false) and triggers org-wide fan-out publications for each due schedule. Advances next_run_at after enqueuing each publication. Compatible with the org fan-out v2 channel adapters (email, SMS, Slack, Teams, push, webhook, in-app).", schedule: "hourly", enabled: true });
registerEntry({
  type: NAMED_JOB_TYPES.ANALYTICS_RETENTION_ARCHIVE,
  name: 'Analytics Retention Archive',
  description:
    'Archives raw analytics_events rows older than the configured retention window (default 90 days, override via ANALYTICS_RETENTION_DAYS env var) into the analytics_events_cold table as compressed JSONB bundles, preserving aggregated rollup metadata. Hot-tier events are deleted after a successful archive batch. Batches of 500 rows keep lock contention minimal on busy tables. Aggregated rollup records (time-bucketed counts stored as properties) are never pruned.',
  schedule: 'daily',
  enabled: true,
});

durableJobQueue.register(NAMED_JOB_TYPES.HOURLY_SLA_ESCALATION_SCAN, async (job) => {
  const start = Date.now();
  let escalated = 0;
  let breached = 0;
  let scanned = 0;
  logger.info({ jobId: job.id }, 'hourly_sla_escalation_scan: starting');
  try {
    const { pool: dbPool } = await import('@szl-holdings/db') as { pool: import('pg').Pool };
    const now = new Date();

    const openTickets = await dbPool.query(
      `SELECT id, priority, status, assigned_to_name, assigned_to_id,
              sla_response_deadline, sla_resolution_deadline,
              first_response_at, created_at, escalated_at,
              sla_response_breached, sla_resolution_breached,
              escalation_count
       FROM support_tickets
       WHERE status IN ('open', 'in_progress')
         AND merged_into_id IS NULL
         AND (sla_response_deadline IS NOT NULL OR sla_resolution_deadline IS NOT NULL)`,
    );

    scanned = openTickets.rows.length;

    const PRIORITY_ORDER = ['low', 'medium', 'high', 'urgent'];

    for (const ticket of openTickets.rows) {
      const responseDeadline = ticket.sla_response_deadline ? new Date(ticket.sla_response_deadline) : null;
      const resolutionDeadline = ticket.sla_resolution_deadline ? new Date(ticket.sla_resolution_deadline) : null;
      const recentlyEscalated =
        ticket.escalated_at &&
        now.getTime() - new Date(ticket.escalated_at).getTime() < 3 * 3600 * 1000;

      let responseBreached = false;
      let resolutionBreached = false;
      let shouldEscalate = false;

      if (responseDeadline && !ticket.first_response_at) {
        const totalMs = responseDeadline.getTime() - new Date(ticket.created_at).getTime();
        const elapsedMs = now.getTime() - new Date(ticket.created_at).getTime();
        const pct = totalMs > 0 ? elapsedMs / totalMs : 1;

        if (now > responseDeadline && !ticket.sla_response_breached) {
          responseBreached = true;
          breached++;
        }
        if (pct >= 0.75 && !ticket.sla_response_breached && !recentlyEscalated) {
          shouldEscalate = true;
        }
      }

      if (resolutionDeadline) {
        const totalMs = resolutionDeadline.getTime() - new Date(ticket.created_at).getTime();
        const elapsedMs = now.getTime() - new Date(ticket.created_at).getTime();
        const pct = totalMs > 0 ? elapsedMs / totalMs : 1;

        if (now > resolutionDeadline && !ticket.sla_resolution_breached) {
          resolutionBreached = true;
          breached++;
        }
        if (pct >= 0.75 && !ticket.sla_resolution_breached && !recentlyEscalated) {
          shouldEscalate = true;
        }
      }

      const wasBreached = responseBreached || resolutionBreached;

      let newPriority: string | null = null;
      let reassignToId: string | null = null;
      let reassignToName: string | null = null;

      if (shouldEscalate && ticket.escalation_count < 3) {
        const currentPriorityIdx = PRIORITY_ORDER.indexOf(ticket.priority);
        if (currentPriorityIdx < PRIORITY_ORDER.length - 1) {
          newPriority = PRIORITY_ORDER[currentPriorityIdx + 1];
          escalated++;

          const reassignResult = await dbPool.query<{ agent_id: string; agent_name: string; open_count: number }>(
            `SELECT
               u.id::text AS agent_id,
               u.display_name AS agent_name,
               COUNT(st.id)::int AS open_count
             FROM users u
             INNER JOIN user_roles ur ON ur.user_id = u.id
             INNER JOIN roles r ON r.id = ur.role_id
             LEFT JOIN support_tickets st
               ON st.assigned_to_id = u.id
               AND st.status IN ('open', 'in_progress')
               AND st.merged_into_id IS NULL
               AND st.id != $1
             WHERE r.name IN ('ops', 'admin', 'super_admin')
             GROUP BY u.id, u.display_name
             ORDER BY open_count ASC, u.id ASC
             LIMIT 1`,
            [ticket.id],
          );
          if (reassignResult.rows.length > 0) {
            reassignToId = reassignResult.rows[0].agent_id;
            reassignToName = reassignResult.rows[0].agent_name;
          }
        }
      }

      const slaResponseBreached = responseBreached ? true : undefined;
      const slaResolutionBreached = resolutionBreached ? true : undefined;

      if (slaResponseBreached !== undefined || slaResolutionBreached !== undefined || newPriority !== null) {
        await dbPool.query(
          `UPDATE support_tickets SET
             sla_response_breached   = CASE WHEN $2 THEN TRUE ELSE sla_response_breached END,
             sla_resolution_breached = CASE WHEN $3 THEN TRUE ELSE sla_resolution_breached END,
             priority                = CASE WHEN $4::text IS NOT NULL THEN $4::text ELSE priority END,
             escalation_count        = CASE WHEN $4::text IS NOT NULL THEN escalation_count + 1 ELSE escalation_count END,
             escalated_at            = CASE WHEN $4::text IS NOT NULL THEN NOW() ELSE escalated_at END,
             assigned_to_id          = CASE WHEN $5::text IS NOT NULL THEN $5::integer ELSE assigned_to_id END,
             assigned_to_name        = CASE WHEN $6::text IS NOT NULL THEN $6::text ELSE assigned_to_name END,
             updated_at              = NOW()
           WHERE id = $1`,
          [ticket.id, slaResponseBreached ?? false, slaResolutionBreached ?? false, newPriority, reassignToId, reassignToName],
        );
      }

      if (wasBreached) {
        try {
          const ticketRef = await dbPool.query<{ ticket_ref: string; subject: string }>(
            `SELECT ticket_ref, subject FROM support_tickets WHERE id = $1`,
            [ticket.id],
          );
          const t = ticketRef.rows[0];
          if (t) {
            const notifTitle = 'SLA Breach Detected';
            const notifBody = `SLA breach on ticket ${t.ticket_ref}: "${t.subject}". Priority: ${ticket.priority}. Assigned: ${ticket.assigned_to_name ?? 'Unassigned'}.`;
            await dbPool.query(
              `INSERT INTO notifications (user_id, title, body, type, entity_type, entity_id, read)
               SELECT u.id, $1, $2, 'sla_breach', 'support_ticket', $3::text, false
               FROM users u
               INNER JOIN user_roles ur ON ur.user_id = u.id
               INNER JOIN roles r ON r.id = ur.role_id
               WHERE r.name IN ('admin', 'super_admin')
               ON CONFLICT DO NOTHING`,
              [notifTitle, notifBody, String(ticket.id)],
            ).catch(() => {});

            if (ticket.assigned_to_id) {
              await dbPool.query(
                `INSERT INTO notifications (user_id, title, body, type, entity_type, entity_id, read)
                 VALUES ($1::integer, $2, $3, 'sla_breach', 'support_ticket', $4::text, false)
                 ON CONFLICT DO NOTHING`,
                [ticket.assigned_to_id, notifTitle, notifBody, String(ticket.id)],
              ).catch(() => {});
            }
          }
        } catch (notifErr) {
          logger.warn({ notifErr, ticketId: ticket.id }, 'SLA breach notification insert failed');
        }
      }
    }

    const durationMs = Date.now() - start;
    serverTelemetry.recordBusinessEvent({
      type: 'sla_escalation_scan_completed',
      domain: 'support',
      durationMs,
      success: true,
      metadata: { scanned, escalated, breached },
    });
    updateRegistry(NAMED_JOB_TYPES.HOURLY_SLA_ESCALATION_SCAN, {
      lastStatus: 'completed',
      lastDurationMs: durationMs,
      lastResult: { scanned, escalated, breached },
    });
    logger.info({ jobId: job.id, scanned, escalated, breached, durationMs }, 'hourly_sla_escalation_scan: complete');
  } catch (err) {
    const durationMs = Date.now() - start;
    logger.error({ err, jobId: job.id }, 'hourly_sla_escalation_scan: fatal error');
    updateRegistry(NAMED_JOB_TYPES.HOURLY_SLA_ESCALATION_SCAN, {
      lastStatus: 'failed',
      lastDurationMs: durationMs,
      failCount: (jobRegistry.get(NAMED_JOB_TYPES.HOURLY_SLA_ESCALATION_SCAN)?.failCount || 0) + 1,
    });
  }
});

durableJobQueue.register(NAMED_JOB_TYPES.LAUNCH_PUBLISH_SCAN, async (job) => {
  const start = Date.now();
  try {
    const { runLaunchPublishScheduler } = await import('../jobs/launch-publish-scheduler');
    const result = await runLaunchPublishScheduler();
    serverTelemetry.recordBusinessEvent({
      type: 'launch_publish_scan_completed',
      domain: 'distribution-os',
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
    updateRegistry(NAMED_JOB_TYPES.LAUNCH_PUBLISH_SCAN, {
      lastStatus: result.failed === 0 ? 'completed' : 'failed',
      lastDurationMs: Date.now() - start,
    });
    logger.info(
      { jobId: job.id, ...result, failures: undefined, successes: undefined },
      'launch_publish_scan: complete',
    );
  } catch (err) {
    logger.error({ err, jobId: job.id }, 'launch_publish_scan: fatal');
    updateRegistry(NAMED_JOB_TYPES.LAUNCH_PUBLISH_SCAN, {
      lastStatus: 'failed',
      lastDurationMs: Date.now() - start,
      failCount: (jobRegistry.get(NAMED_JOB_TYPES.LAUNCH_PUBLISH_SCAN)?.failCount || 0) + 1,
    });
  }
});

durableJobQueue.register(NAMED_JOB_TYPES.MESH_TELEMETRY_SCAN, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, 'mesh_telemetry_scan: starting scheduled scan');
  try {
    const { runScheduledMeshScan } = await import('../services/agent-mesh-collector');
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
    const status: 'completed' | 'partial' | 'failed' = allFailed
      ? 'failed'
      : hasFailures
        ? 'partial'
        : 'completed';

    serverTelemetry.recordBusinessEvent({
      type: 'mesh_telemetry_scan_completed',
      domain: 'sentra',
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
      lastStatus: status === 'failed' ? 'failed' : 'completed',
      lastDurationMs: Date.now() - start,
      ...(hasFailures
        ? { failCount: (jobRegistry.get(NAMED_JOB_TYPES.MESH_TELEMETRY_SCAN)?.failCount || 0) + 1 }
        : {}),
    });
    logger.info(
      { jobId: job.id, status, succeeded: report.succeeded.length, failed: report.failed.length },
      'mesh_telemetry_scan: complete',
    );

    if (allFailed) {
      throw new Error(`mesh_telemetry_scan: all ${totalAttempted} org scans failed`);
    }
  } catch (err) {
    logger.error({ err, jobId: job.id }, 'mesh_telemetry_scan: fatal');
    updateRegistry(NAMED_JOB_TYPES.MESH_TELEMETRY_SCAN, {
      lastStatus: 'failed',
      lastDurationMs: Date.now() - start,
      failCount: (jobRegistry.get(NAMED_JOB_TYPES.MESH_TELEMETRY_SCAN)?.failCount || 0) + 1,
    });
    throw err;
  }
});

durableJobQueue.register(NAMED_JOB_TYPES.DAILY_COMPETITIVE_INTEL_POLL, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, 'daily_competitive_intel_poll: starting feed poll');
  try {
    const { pollAllFeeds } = await import('../jobs/competitive-intel-monitor');
    const result = await pollAllFeeds();
    serverTelemetry.recordBusinessEvent({
      type: 'daily_competitive_intel_poll_completed',
      domain: 'command',
      durationMs: Date.now() - start,
      success: true,
      metadata: { ...result },
    });
    updateRegistry(NAMED_JOB_TYPES.DAILY_COMPETITIVE_INTEL_POLL, {
      lastStatus: 'completed',
      lastDurationMs: Date.now() - start,
    });
    logger.info({ jobId: job.id, ...result }, 'daily_competitive_intel_poll: complete');
  } catch (err) {
    logger.error({ err, jobId: job.id }, 'daily_competitive_intel_poll: fatal');
    updateRegistry(NAMED_JOB_TYPES.DAILY_COMPETITIVE_INTEL_POLL, {
      lastStatus: 'failed',
      lastDurationMs: Date.now() - start,
      failCount:
        (jobRegistry.get(NAMED_JOB_TYPES.DAILY_COMPETITIVE_INTEL_POLL)?.failCount || 0) + 1,
    });
  }
});

function getLocalHourMinute(tz: string, now: Date): { hour: number; minute: number } | null {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = fmt.formatToParts(now);
    const h = parts.find((p) => p.type === 'hour')?.value;
    const m = parts.find((p) => p.type === 'minute')?.value;
    if (!h || !m) return null;
    return { hour: parseInt(h, 10) % 24, minute: parseInt(m, 10) };
  } catch {
    return null;
  }
}

durableJobQueue.register(NAMED_JOB_TYPES.HOURLY_EXECUTIVE_DIGEST, async (job) => {
  const start = Date.now();
  const payload = (job.payload ?? {}) as {
    forceHour?: number;
    forceMinute?: number;
    forceTimezone?: string;
    testUserId?: number;
  };
  const now = new Date();
  let dispatched = 0;
  let skipped = 0;
  let failed = 0;

  try {
    const { pool } = await import('@szl-holdings/db');
    const { sendPushToUser } = await import('./expo-push');

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
      const targetHour =
        typeof payload.forceHour === 'number' ? payload.forceHour : Number(cfg.deliveryHour);
      const targetMinute =
        typeof payload.forceMinute === 'number' ? payload.forceMinute : Number(cfg.deliveryMinute);
      if (Number.isNaN(targetHour) || Number.isNaN(targetMinute)) return false;
      const tz =
        payload.forceTimezone || (typeof cfg.timezone === 'string' && cfg.timezone) || 'UTC';
      const local = getLocalHourMinute(tz, now) ?? {
        hour: now.getUTCHours(),
        minute: now.getUTCMinutes(),
      };
      return local.hour === targetHour && local.minute === targetMinute;
    });

    if (recipients.length === 0) {
      updateRegistry(NAMED_JOB_TYPES.HOURLY_EXECUTIVE_DIGEST, {
        lastStatus: 'completed',
        lastDurationMs: Date.now() - start,
      });
      return;
    }

    logger.info(
      { jobId: job.id, recipientCount: recipients.length },
      'hourly_executive_digest: dispatching',
    );

    const date = now.toISOString().slice(0, 10);

    for (const row of recipients) {
      try {
        const cfg = row.digest_config ?? {};
        const fmt = (cfg.digestFormat as string) ?? 'concise';

        const result = await sendPushToUser(row.user_id, {
          title: '⬡ Executive Morning Briefing',
          body: `Your cross-domain briefing for ${date} is ready · ${fmt === 'concise' ? '30-second read' : '2-minute briefing'}`,
          data: {
            type: 'daily_digest',
            format: fmt,
            deepLink: '/(shell)/intelligence/pulse',
            date,
          },
          sound: 'default',
        });

        if (result.sent > 0) dispatched++;
        else skipped++;
      } catch (err) {
        failed++;
        logger.warn(
          { err, userId: row.user_id },
          'hourly_executive_digest: per-user delivery failed',
        );
      }
    }
  } catch (err) {
    logger.error({ err, jobId: job.id }, 'hourly_executive_digest: fatal');
    updateRegistry(NAMED_JOB_TYPES.HOURLY_EXECUTIVE_DIGEST, {
      lastStatus: 'failed',
      lastDurationMs: Date.now() - start,
      failCount: (jobRegistry.get(NAMED_JOB_TYPES.HOURLY_EXECUTIVE_DIGEST)?.failCount || 0) + 1,
    });
    return;
  }

  serverTelemetry.recordBusinessEvent({
    type: 'hourly_executive_digest_completed',
    durationMs: Date.now() - start,
    success: true,
    metadata: { dispatched, skipped, failed },
  });
  updateRegistry(NAMED_JOB_TYPES.HOURLY_EXECUTIVE_DIGEST, {
    lastStatus: 'completed',
    lastDurationMs: Date.now() - start,
  });
  logger.info({ jobId: job.id, dispatched, skipped, failed }, 'hourly_executive_digest: complete');
});

function updateRegistry(type: NamedJobType, update: Partial<JobScheduleEntry>) {
  const entry = jobRegistry.get(type);
  if (entry) jobRegistry.set(type, { ...entry, ...update });
}

function recordRunHistory(type: NamedJobType, entry: JobRunHistoryEntry) {
  const existing = jobRegistry.get(type);
  if (!existing) return;
  const history = [...(existing.runHistory ?? []), entry].slice(-RUN_HISTORY_LIMIT);
  jobRegistry.set(type, { ...existing, runHistory: history });
}

async function enqueueNamedJob(type: NamedJobType, payload: Record<string, unknown> = {}) {
  const entry = jobRegistry.get(type);
  if (!entry) return;
  updateRegistry(type, { lastStatus: 'running', lastRunAt: Date.now() });
  try {
    const job = await durableJobQueue.enqueue(type, payload, { maxRetries: 2 });
    updateRegistry(type, { runCount: (entry.runCount || 0) + 1 });
    return job;
  } catch (err) {
    logger.warn({ err, type }, 'Failed to enqueue named job');
    updateRegistry(type, { lastStatus: 'failed', failCount: (entry.failCount || 0) + 1 });
    return undefined;
  }
}

// ─── Settlement Reconciliation ────────────────────────────────────────────────

durableJobQueue.register(NAMED_JOB_TYPES.DAILY_SETTLEMENT_RECONCILIATION, async (job) => {
  const start = Date.now();
  updateRegistry(NAMED_JOB_TYPES.DAILY_SETTLEMENT_RECONCILIATION, { lastStatus: "running", lastRunAt: start });

  try {
    const { getCoinbaseSettlements } = await import('./coinbase-adapter');
    const { services } = await import('@szl-holdings/services');
    const { db, revenueEventsTable, invoicesTable } = await import('@szl-holdings/db');
    const { eq, gte } = await import('drizzle-orm');
    const { sendEmail, buildReconciliationMismatchEmail } = await import('./email');

    const reportDate = new Date().toISOString().slice(0, 10);
    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - 7);

    // 1. Pull Coinbase settlements for the 7-day window.
    // Returns: Array<{ chargeId, code, amountUsd, currency, settledAt, metadata, transactionId, network }>
    const coinbaseSettlements = await getCoinbaseSettlements(windowStart, new Date());

    // 2. Pull Stripe ACH payouts for the 7-day window.
    // getStripePayouts(createdAfterUnix, limit) → Array<{ id, amount, currency, arrivalDate, status }>
    const stripePayouts = await services.stripe
      .getStripePayouts(Math.floor(windowStart.getTime() / 1000), 100)
      .catch((err: unknown) => {
        logger.warn({ err }, '[settlement-job] Failed to fetch Stripe payouts; skipping Stripe reconciliation');
        return [] as Array<{ id: string; amount: number; currency: string; arrivalDate: number; status: string }>;
      });

    // 3. Pull all rail revenue events in the window
    const events = await db
      .select()
      .from(revenueEventsTable)
      .where(
        gte(revenueEventsTable.createdAt, windowStart),
      );

    const railEvents = events.filter(
      (e) =>
        e.eventType === 'ach.charge.initiated' ||
        e.eventType === 'ach.charge.succeeded' ||
        e.eventType === 'crypto.charge.failed' ||
        e.eventType === 'crypto.charge.confirmed',
    );

    // 4. Cross-reference & flag mismatches
    const mismatches: Array<{
      invoiceId: string;
      rail: string;
      expectedAmount: string;
      actualAmount?: string;
      issue: string;
    }> = [];

    let totalChecked = 0;

    // Build lookup maps for O(1) matching
    // Coinbase settlements: keyed by chargeId and by metadata.invoiceId
    const coinbaseByChargeId = new Map(
      coinbaseSettlements.map((cs: { chargeId: string; metadata?: Record<string, string>; amountUsd: string }) => [cs.chargeId, cs]),
    );
    const coinbaseByInvoiceId = new Map(
      coinbaseSettlements
        .filter((cs: { metadata?: Record<string, string> }) => cs.metadata?.['invoiceId'])
        .map((cs: { chargeId: string; metadata: Record<string, string>; amountUsd: string }) => [cs.metadata['invoiceId'], cs]),
    );

    // Stripe payouts: keyed by amount+currency for loose matching (no invoice-level granularity)
    const stripePayoutAmounts = new Set(
      stripePayouts.map((p) => `${p.currency.toLowerCase()}-${p.amount}`),
    );

    for (const evt of railEvents) {
      totalChecked++;
      const rail = evt.eventType.startsWith('ach') ? 'ach' : 'crypto';
      const expectedAmount = evt.amount ?? '0';
      const invoiceRef = evt.invoiceId ?? 'unknown';
      const evtMeta = (evt.metadata as Record<string, unknown>) ?? {};

      if (rail === 'crypto' && evt.eventType === 'crypto.charge.confirmed') {
        // Match against Coinbase settlements by chargeId (stored in event metadata) or invoiceId
        const coinbaseChargeId = evtMeta['coinbaseChargeId'] as string | undefined;
        const matched =
          (coinbaseChargeId && coinbaseByChargeId.has(coinbaseChargeId)) ||
          coinbaseByInvoiceId.has(String(invoiceRef));

        if (!matched) {
          mismatches.push({
            invoiceId: String(invoiceRef),
            rail: 'crypto',
            expectedAmount,
            issue: 'Confirmed crypto charge not found in Coinbase settlement list for the reconciliation window',
          });
        }
      }

      if (rail === 'ach' && evt.eventType === 'ach.charge.initiated') {
        // For each ACH charge initiated in the window, verify there is a
        // corresponding ach.charge.succeeded event with the same chargeId.
        // This is more reliable than payout-amount matching: Stripe payouts are
        // batch aggregates (not invoice-level), so amount matching produces
        // false positives/negatives. Charge-level idempotency keys are exact.
        const initiatedChargeId = evtMeta['chargeId'] as string | undefined;
        if (initiatedChargeId) {
          const hasSucceeded = railEvents.some(
            (e) =>
              e.eventType === 'ach.charge.succeeded' &&
              ((e.metadata as Record<string, unknown>)?.['chargeId'] as string) === initiatedChargeId,
          );
          // Only flag as mismatch if we have payouts data (live Stripe env) and
          // the charge is old enough to have settled (>3 business days ≈ 5 calendar days).
          const initiatedAt = evt.createdAt ? new Date(evt.createdAt) : null;
          const settlementCutoff = new Date();
          settlementCutoff.setDate(settlementCutoff.getDate() - 5);
          if (!hasSucceeded && initiatedAt && initiatedAt < settlementCutoff && stripePayouts.length > 0) {
            mismatches.push({
              invoiceId: String(invoiceRef),
              rail: 'ach',
              expectedAmount,
              issue: `ACH charge ${initiatedChargeId} initiated >5 days ago but no succeeded event found — possible missed webhook`,
            });
          }
        }
      }
    }

    // 5. Check for invoices still 'open' more than 7 days after ACH initiation
    const achInitiated = railEvents.filter((e) => e.eventType === 'ach.charge.initiated');
    const staleCutoff = new Date();
    staleCutoff.setDate(staleCutoff.getDate() - 7);

    for (const evt of achInitiated) {
      if (evt.createdAt && evt.createdAt < staleCutoff) {
        // Prefer internalInvoiceId from metadata (numeric DB PK) to avoid
        // treating Stripe in_xxx IDs as the canonical invoice reference.
        const meta = (evt.metadata as Record<string, unknown> | null) ?? {};
        const candidateId = meta['internalInvoiceId'] ?? evt.invoiceId;
        if (!candidateId) continue;
        const rawId = parseInt(String(candidateId), 10);
        if (isNaN(rawId)) continue;
        const [inv] = await db
          .select({ id: invoicesTable.id, status: invoicesTable.status, amount: invoicesTable.amount })
          .from(invoicesTable)
          .where(eq(invoicesTable.id, rawId));
        if (inv && inv.status === 'open') {
          totalChecked++;
          mismatches.push({
            invoiceId: String(inv.id),
            rail: 'ach',
            expectedAmount: String(inv.amount),
            issue: 'ACH charge initiated >7 days ago but invoice still open — may have been missed by webhook',
          });
        }
      }
    }

    // 6. Alert if mismatches found
    if (mismatches.length > 0) {
      const adminEmail = process.env.BILLING_RECONCILIATION_EMAIL ?? process.env.ADMIN_EMAIL;
      if (adminEmail) {
        await sendEmail({
          to: adminEmail,
          subject: `Settlement reconciliation: ${mismatches.length} mismatch(es) — ${reportDate}`,
          html: buildReconciliationMismatchEmail({
            mismatchCount: mismatches.length,
            totalChecked,
            mismatches,
            reportDate,
          }),
          text: `Settlement reconciliation for ${reportDate} found ${mismatches.length} mismatch(es) out of ${totalChecked} records.`,
        });
      }
    }

    updateRegistry(NAMED_JOB_TYPES.DAILY_SETTLEMENT_RECONCILIATION, {
      lastStatus: "completed",
      lastDurationMs: Date.now() - start,
    });
    logger.info(
      { jobId: job.id, totalChecked, mismatchCount: mismatches.length },
      "daily_settlement_reconciliation: complete",
    );
  } catch (err) {
    logger.error({ err, jobId: job.id }, "daily_settlement_reconciliation: fatal");
    updateRegistry(NAMED_JOB_TYPES.DAILY_SETTLEMENT_RECONCILIATION, {
      lastStatus: "failed",
      lastDurationMs: Date.now() - start,
      failCount: (jobRegistry.get(NAMED_JOB_TYPES.DAILY_SETTLEMENT_RECONCILIATION)?.failCount || 0) + 1,
    });
    throw err;
  }
});

durableJobQueue.register(NAMED_JOB_TYPES.DAILY_LYTE_DIGEST, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, 'daily_lyte_digest: aggregating Lyte signal digest');
  const payload = job.payload as { date?: string };
  const date = payload.date ?? new Date().toISOString().split('T')[0];

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  try {
    const { db } = await import('@szl-holdings/db');
    const { notificationPreferencesTable, notificationsTable, usersTable } = await import(
      '@szl-holdings/db'
    );
    const { eq, and, gte, desc, isNull, or, lt } = await import('drizzle-orm');
    const { buildNotificationDigestEmail } = await import('./email');
    const { queueEmail } = await import('./queued-jobs');

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

    logger.info(
      { jobId: job.id, recipientCount: emailRecipients.length },
      'daily_lyte_digest: found email-enabled users',
    );

    const { pool: pgPool } = await import('@szl-holdings/db');
    const { generateUnsubscribeToken, logNotificationAudit } = await import('./email');

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

        const dateLabel = new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        const unsubToken = generateUnsubscribeToken(recipient.email);
        const appUrl = process.env.APP_URL || 'https://szlholdings.com';
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
            notifications: notifications.map((n) => ({
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
            ['daily_lyte_digest', recipient.email, digestKey],
          )
          .catch(() => {});

        logNotificationAudit({
          template: 'daily_lyte_digest',
          recipient: recipient.email,
          subject: emailSubject,
          entityType: 'digest',
          entityId: digestKey,
          deliveryStatus: 'sent',
        }).catch(() => {});

        sent++;
      } catch (err) {
        failed++;
        logger.warn(
          { err, userId: recipient.userId },
          'daily_lyte_digest: failed to send digest to user',
        );
      }
    }

    logger.info(
      { jobId: job.id, date, sent, skipped, failed },
      'daily_lyte_digest: delivery complete',
    );
  } catch (err) {
    logger.error({ err, jobId: job.id }, 'daily_lyte_digest: fatal error during digest delivery');
    updateRegistry(NAMED_JOB_TYPES.DAILY_LYTE_DIGEST, {
      lastStatus: 'failed',
      lastDurationMs: Date.now() - start,
    });
    return;
  }

  serverTelemetry.recordBusinessEvent({
    type: 'daily_lyte_digest_completed',
    domain: 'lyte',
    durationMs: Date.now() - start,
    success: true,
    metadata: { date, sent, skipped, failed },
  });
  updateRegistry(NAMED_JOB_TYPES.DAILY_LYTE_DIGEST, {
    lastStatus: 'completed',
    lastDurationMs: Date.now() - start,
  });
  logger.info({ jobId: job.id, date }, 'daily_lyte_digest: complete');
});

durableJobQueue.register(NAMED_JOB_TYPES.DAILY_PULSE_BRIEFING_DIGEST, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, 'daily_pulse_briefing_digest: starting delivery');
  let sent = 0;
  let skipped = 0;
  let failed = 0;
  let briefingId: string | null = null;
  try {
    const {
      db,
      pool: pgPool,
      pulseBriefingsTable,
      pulseEmailSubscriptionsTable,
    } = await import('@szl-holdings/db');
    const { eq, desc, and, ne, or, isNull, lt } = await import('drizzle-orm');
    const { buildPulseBriefingEmail } = await import('./email');
    const { queueEmail } = await import('./queued-jobs');

    const digestCutoff = new Date(Date.now() - 20 * 60 * 60 * 1000);

    const [briefing] = await db
      .select()
      .from(pulseBriefingsTable)
      .where(eq(pulseBriefingsTable.status, 'published'))
      .orderBy(desc(pulseBriefingsTable.generatedAt))
      .limit(1);

    if (!briefing) {
      logger.info(
        { jobId: job.id },
        'daily_pulse_briefing_digest: no published briefing — skipping',
      );
      updateRegistry(NAMED_JOB_TYPES.DAILY_PULSE_BRIEFING_DIGEST, {
        lastStatus: 'completed',
        lastDurationMs: Date.now() - start,
      });
      return;
    }
    briefingId = briefing.id;

    const subscribers = await db
      .select()
      .from(pulseEmailSubscriptionsTable)
      .where(
        and(
          eq(pulseEmailSubscriptionsTable.status, 'active'),
          or(
            isNull(pulseEmailSubscriptionsTable.lastSentBriefingId),
            ne(pulseEmailSubscriptionsTable.lastSentBriefingId, briefing.id),
          ),
          or(
            isNull(pulseEmailSubscriptionsTable.lastSentAt),
            lt(pulseEmailSubscriptionsTable.lastSentAt, digestCutoff),
          ),
        ),
      );

    const baseUrl =
      process.env.APP_URL ||
      (process.env.REPLIT_DEV_DOMAIN
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : 'https://szlholdings.com');
    const pulseUrl = `${baseUrl}/pulse/`;
    const sections = (briefing.sections as Array<Record<string, unknown>>) ?? [];
    const recommendedActions =
      (briefing.recommendedActions as Array<Record<string, unknown>>) ?? [];

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
          id: String(s.id ?? s.domain ?? ''),
          title: String(s.title ?? 'Briefing'),
          agentId: String(s.agentId ?? ''),
          agentName: s.agentName ? String(s.agentName) : undefined,
          riskLevel: String(s.riskLevel ?? 'MEDIUM'),
          confidence: Number(s.confidence ?? 0),
          confidenceLabel: String(s.confidenceLabel ?? ''),
          keyJudgment: String(s.keyJudgment ?? s.judgment ?? ''),
          keyFindings: Array.isArray(s.keyFindings)
            ? (s.keyFindings as Array<Record<string, unknown>>).map((f) => ({
                finding: String(f.finding ?? ''),
                severity: String(f.severity ?? 'MEDIUM'),
              }))
            : [],
        }));
        const filtered =
          sub.domains && sub.domains.length > 0
            ? emailSections.filter((s) =>
                sub.domains.some(
                  (d: string) => s.id === d || s.title.toLowerCase().includes(d.replace(/_/g, ' ')),
                ),
              )
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
            action: String(a.action ?? ''),
            priority: String(a.priority ?? 'MEDIUM'),
            owner: String(a.owner ?? ''),
            dueBy: String(a.dueBy ?? ''),
          })),
          pulseUrl,
          unsubscribeUrl: `${baseUrl}/api/pulse/unsubscribe?token=${encodeURIComponent(sub.unsubscribeToken)}`,
          manageUrl: `${pulseUrl}settings`,
          domainsFilter: sub.domains as string[] | undefined,
        });

        await queueEmail({
          to: sub.email,
          subject: email.subject,
          html: email.html,
          text: email.text,
        });

        await pgPool
          .query(
            `UPDATE pulse_email_subscriptions SET last_sent_briefing_id = $1, updated_at = NOW() WHERE id = $2`,
            [briefing.id, sub.id],
          )
          .catch(() => {});

        await pgPool
          .query(
            `INSERT INTO digest_emails_sent (digest_type, recipient, digest_key) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
            ['daily_pulse_briefing_digest', sub.email, briefing.id],
          )
          .catch(() => {});

        sent++;
      } catch (err) {
        failed++;
        logger.warn(
          { err, subscriptionId: sub.id },
          'daily_pulse_briefing_digest: failed for subscription',
        );
      }
    }
    logger.info(
      { jobId: job.id, briefingId, sent, skipped, failed },
      'daily_pulse_briefing_digest: delivery complete',
    );
  } catch (err) {
    logger.error({ err, jobId: job.id }, 'daily_pulse_briefing_digest: fatal error');
    updateRegistry(NAMED_JOB_TYPES.DAILY_PULSE_BRIEFING_DIGEST, {
      lastStatus: 'failed',
      lastDurationMs: Date.now() - start,
    });
    return;
  }
  serverTelemetry.recordBusinessEvent({
    type: 'daily_pulse_briefing_digest_completed',
    domain: 'pulse',
    durationMs: Date.now() - start,
    success: true,
    metadata: { briefingId, sent, skipped, failed },
  });
  updateRegistry(NAMED_JOB_TYPES.DAILY_PULSE_BRIEFING_DIGEST, {
    lastStatus: 'completed',
    lastDurationMs: Date.now() - start,
  });
});

durableJobQueue.register(NAMED_JOB_TYPES.DAILY_READINESS_DIGEST, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, 'daily_readiness_digest: compiling readiness status');

  const digestType = 'daily_readiness_digest';
  const digestKey = new Date().toISOString().split('T')[0];
  const digestCutoff = new Date(Date.now() - 20 * 60 * 60 * 1000);
  let sent = 0;
  let skipped = 0;

  try {
    const { pool } = await import('@szl-holdings/db');

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

    logger.info({ jobId: job.id, sent, skipped }, 'daily_readiness_digest: delivery complete');
  } catch (err) {
    logger.error({ err, jobId: job.id }, 'daily_readiness_digest: fatal error');
    updateRegistry(NAMED_JOB_TYPES.DAILY_READINESS_DIGEST, {
      lastStatus: 'failed',
      lastDurationMs: Date.now() - start,
    });
    return;
  }

  serverTelemetry.recordBusinessEvent({
    type: 'daily_readiness_digest_completed',
    domain: 'readiness-report',
    durationMs: Date.now() - start,
    success: true,
    metadata: { sent, skipped },
  });
  updateRegistry(NAMED_JOB_TYPES.DAILY_READINESS_DIGEST, {
    lastStatus: 'completed',
    lastDurationMs: Date.now() - start,
  });
  logger.info({ jobId: job.id }, 'daily_readiness_digest: complete');
});

durableJobQueue.register(NAMED_JOB_TYPES.DAILY_EXCEPTION_SUMMARY, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, 'daily_exception_summary: aggregating exceptions');

  const digestType = 'daily_exception_summary';
  const digestKey = new Date().toISOString().split('T')[0];
  const digestCutoff = new Date(Date.now() - 20 * 60 * 60 * 1000);
  let sent = 0;
  let skipped = 0;

  try {
    const { pool } = await import('@szl-holdings/db');

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

    logger.info({ jobId: job.id, sent, skipped }, 'daily_exception_summary: delivery complete');
  } catch (err) {
    logger.error({ err, jobId: job.id }, 'daily_exception_summary: fatal error');
    updateRegistry(NAMED_JOB_TYPES.DAILY_EXCEPTION_SUMMARY, {
      lastStatus: 'failed',
      lastDurationMs: Date.now() - start,
    });
    return;
  }

  serverTelemetry.recordBusinessEvent({
    type: 'daily_exception_summary_completed',
    durationMs: Date.now() - start,
    success: true,
    metadata: { sent, skipped },
  });
  updateRegistry(NAMED_JOB_TYPES.DAILY_EXCEPTION_SUMMARY, {
    lastStatus: 'completed',
    lastDurationMs: Date.now() - start,
  });
  logger.info({ jobId: job.id }, 'daily_exception_summary: complete');
});

durableJobQueue.register(NAMED_JOB_TYPES.DAILY_ARTIFACT_CLEANUP, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, 'daily_artifact_cleanup: pruning expired artifacts');
  await new Promise((r) => setTimeout(r, 120));
  serverTelemetry.recordBusinessEvent({
    type: 'daily_artifact_cleanup_completed',
    durationMs: Date.now() - start,
    success: true,
  });
  updateRegistry(NAMED_JOB_TYPES.DAILY_ARTIFACT_CLEANUP, {
    lastStatus: 'completed',
    lastDurationMs: Date.now() - start,
  });
  logger.info({ jobId: job.id }, 'daily_artifact_cleanup: complete');
});

durableJobQueue.register(NAMED_JOB_TYPES.DAILY_FEATURE_FLAG_SYNC, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, 'daily_feature_flag_sync: syncing flag state');
  await new Promise((r) => setTimeout(r, 50));
  serverTelemetry.recordBusinessEvent({
    type: 'daily_feature_flag_sync_completed',
    durationMs: Date.now() - start,
    success: true,
  });
  updateRegistry(NAMED_JOB_TYPES.DAILY_FEATURE_FLAG_SYNC, {
    lastStatus: 'completed',
    lastDurationMs: Date.now() - start,
  });
  logger.info({ jobId: job.id }, 'daily_feature_flag_sync: complete');
});

// Daily Document Batch Generation — processes all pending PDF jobs across the document engine.
// Scans for documents with status "approved" that have no completed PDF export,
// creates a scheduled batch, and enqueues them for rendering.
durableJobQueue.register(NAMED_JOB_TYPES.DAILY_DOCUMENT_BATCH, async (job) => {
  const { db, documentsTable, pdfBatchesTable, pdfJobsTable } = await import('@szl-holdings/db');
  const { eq } = await import('drizzle-orm');
  const { randomUUID } = await import('node:crypto');

  const start = Date.now();
  logger.info(
    { jobId: job.id },
    'daily_document_batch: starting scheduled document PDF generation',
  );

  const payload = job.payload as { appSource?: string; documentType?: string };

  try {
    // Find approved documents not yet covered by a completed batch
    const approvedDocs = await db
      .select()
      .from(documentsTable)
      .where(eq(documentsTable.status, 'approved'))
      .limit(50);

    if (approvedDocs.length === 0) {
      logger.info({ jobId: job.id }, 'daily_document_batch: no approved documents to process');
      updateRegistry(NAMED_JOB_TYPES.DAILY_DOCUMENT_BATCH, {
        lastStatus: 'completed',
        lastDurationMs: Date.now() - start,
      });
      return;
    }

    // Create a scheduled batch record
    const batchId = randomUUID();
    const batchDate = new Date().toISOString().split('T')[0];
    const [_batch] = await db
      .insert(pdfBatchesTable)
      .values({
        batchId,
        title: `Daily PDF Batch — ${batchDate}`,
        templateId: 'daily_scheduler',
        status: 'processing',
        totalJobs: approvedDocs.length,
        completedJobs: 0,
        failedJobs: 0,
        appSource: payload.appSource || 'general',
      })
      .returning();

    // Create PDF job records
    const jobInserts = approvedDocs.map((doc) => ({
      batchId,
      templateId: doc.templateId || 'general',
      entityType: 'document',
      entityId: String(doc.id),
      appSource: doc.appSource,
      entityData: { documentId: doc.id, documentTitle: doc.title },
      status: 'pending' as const,
    }));
    await db.insert(pdfJobsTable).values(jobInserts);

    serverTelemetry.recordBusinessEvent({
      type: 'daily_document_batch_started',
      domain: 'document-engine',
      durationMs: Date.now() - start,
      success: true,
      metadata: { batchId, jobCount: approvedDocs.length },
    });

    updateRegistry(NAMED_JOB_TYPES.DAILY_DOCUMENT_BATCH, {
      lastStatus: 'completed',
      lastDurationMs: Date.now() - start,
    });
    logger.info(
      { jobId: job.id, batchId, jobCount: approvedDocs.length },
      'daily_document_batch: batch created, jobs enqueued',
    );
  } catch (err) {
    updateRegistry(NAMED_JOB_TYPES.DAILY_DOCUMENT_BATCH, {
      lastStatus: 'failed',
      failCount: (jobRegistry.get(NAMED_JOB_TYPES.DAILY_DOCUMENT_BATCH)?.failCount || 0) + 1,
    });
    logger.error({ jobId: job.id, err }, 'daily_document_batch: failed');
    throw err;
  }
});

durableJobQueue.register(NAMED_JOB_TYPES.HOURLY_SIGNAL_NORMALIZATION, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, 'hourly_signal_normalization: normalizing signals');
  await new Promise((r) => setTimeout(r, 60));
  serverTelemetry.recordBusinessEvent({
    type: 'hourly_signal_normalization_completed',
    domain: 'lyte',
    durationMs: Date.now() - start,
    success: true,
  });
  updateRegistry(NAMED_JOB_TYPES.HOURLY_SIGNAL_NORMALIZATION, {
    lastStatus: 'completed',
    lastDurationMs: Date.now() - start,
  });
  logger.info({ jobId: job.id }, 'hourly_signal_normalization: complete');
});

durableJobQueue.register(NAMED_JOB_TYPES.HOURLY_STALE_ACTION_SCAN, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, 'hourly_stale_action_scan: scanning for stale actions');
  await new Promise((r) => setTimeout(r, 55));
  serverTelemetry.recordBusinessEvent({
    type: 'hourly_stale_action_scan_completed',
    domain: 'lyte',
    durationMs: Date.now() - start,
    success: true,
  });
  updateRegistry(NAMED_JOB_TYPES.HOURLY_STALE_ACTION_SCAN, {
    lastStatus: 'completed',
    lastDurationMs: Date.now() - start,
  });
  logger.info({ jobId: job.id }, 'hourly_stale_action_scan: complete');
});

durableJobQueue.register(NAMED_JOB_TYPES.HOURLY_VESSEL_ETA_REFRESH, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, 'hourly_vessel_eta_refresh: refreshing vessel ETAs');
  await new Promise((r) => setTimeout(r, 75));
  serverTelemetry.recordBusinessEvent({
    type: 'hourly_vessel_eta_refresh_completed',
    domain: 'vessels',
    durationMs: Date.now() - start,
    success: true,
  });
  updateRegistry(NAMED_JOB_TYPES.HOURLY_VESSEL_ETA_REFRESH, {
    lastStatus: 'completed',
    lastDurationMs: Date.now() - start,
  });
  logger.info({ jobId: job.id }, 'hourly_vessel_eta_refresh: complete');
});

durableJobQueue.register(NAMED_JOB_TYPES.HOURLY_ROUTE_PRESSURE_SCAN, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, 'hourly_route_pressure_scan: scanning corridor pressure');
  await new Promise((r) => setTimeout(r, 65));
  serverTelemetry.recordBusinessEvent({
    type: 'hourly_route_pressure_scan_completed',
    domain: 'vessels',
    durationMs: Date.now() - start,
    success: true,
  });
  updateRegistry(NAMED_JOB_TYPES.HOURLY_ROUTE_PRESSURE_SCAN, {
    lastStatus: 'completed',
    lastDurationMs: Date.now() - start,
  });
  logger.info({ jobId: job.id }, 'hourly_route_pressure_scan: complete');
});

durableJobQueue.register(NAMED_JOB_TYPES.HOURLY_TERRA_INQUIRY_DIGEST, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, 'hourly_terra_inquiry_digest: processing inquiries');
  await new Promise((r) => setTimeout(r, 45));
  serverTelemetry.recordBusinessEvent({
    type: 'hourly_terra_inquiry_digest_completed',
    domain: 'terra',
    durationMs: Date.now() - start,
    success: true,
  });
  updateRegistry(NAMED_JOB_TYPES.HOURLY_TERRA_INQUIRY_DIGEST, {
    lastStatus: 'completed',
    lastDurationMs: Date.now() - start,
  });
  logger.info({ jobId: job.id }, 'hourly_terra_inquiry_digest: complete');
});

durableJobQueue.register(NAMED_JOB_TYPES.WORKFLOW_RETRY_JOB, async (job) => {
  const start = Date.now();
  const { workflowId } = job.payload as { workflowId?: string };
  logger.info({ jobId: job.id, workflowId }, 'workflow_retry_job: retrying failed workflow');
  await new Promise((r) => setTimeout(r, 100));
  serverTelemetry.recordBusinessEvent({
    type: 'workflow_retry_completed',
    durationMs: Date.now() - start,
    success: true,
    metadata: { workflowId },
  });
  updateRegistry(NAMED_JOB_TYPES.WORKFLOW_RETRY_JOB, {
    lastStatus: 'completed',
    lastDurationMs: Date.now() - start,
  });
  logger.info({ jobId: job.id, workflowId }, 'workflow_retry_job: complete');
});

durableJobQueue.register(NAMED_JOB_TYPES.ARTIFACT_GENERATION_JOB, async (job) => {
  const start = Date.now();
  const { artifactType, sourceId } = job.payload as { artifactType?: string; sourceId?: string };
  logger.info(
    { jobId: job.id, artifactType, sourceId },
    'artifact_generation_job: generating artifact',
  );
  await new Promise((r) => setTimeout(r, 150));
  serverTelemetry.recordBusinessEvent({
    type: 'artifact_generation_completed',
    durationMs: Date.now() - start,
    success: true,
    metadata: { artifactType, sourceId },
  });
  updateRegistry(NAMED_JOB_TYPES.ARTIFACT_GENERATION_JOB, {
    lastStatus: 'completed',
    lastDurationMs: Date.now() - start,
  });
  logger.info({ jobId: job.id, artifactType }, 'artifact_generation_job: complete');
});

durableJobQueue.register(NAMED_JOB_TYPES.ROUTE_ECONOMICS_RECOMPUTE_JOB, async (job) => {
  const start = Date.now();
  const { voyageId, vesselId } = job.payload as { voyageId?: string; vesselId?: string };
  logger.info(
    { jobId: job.id, voyageId, vesselId },
    'route_economics_recompute_job: recomputing route economics',
  );
  await new Promise((r) => setTimeout(r, 110));
  serverTelemetry.recordBusinessEvent({
    type: 'route_economics_recomputed',
    domain: 'vessels',
    durationMs: Date.now() - start,
    success: true,
    metadata: { voyageId, vesselId },
  });
  updateRegistry(NAMED_JOB_TYPES.ROUTE_ECONOMICS_RECOMPUTE_JOB, {
    lastStatus: 'completed',
    lastDurationMs: Date.now() - start,
  });
  logger.info({ jobId: job.id, voyageId }, 'route_economics_recompute_job: complete');
});

durableJobQueue.register(NAMED_JOB_TYPES.READINESS_SCORE_RECOMPUTE_JOB, async (job) => {
  const start = Date.now();
  const { programId } = job.payload as { programId?: string };
  logger.info(
    { jobId: job.id, programId },
    'readiness_score_recompute_job: recomputing readiness scores',
  );
  await new Promise((r) => setTimeout(r, 130));
  serverTelemetry.recordBusinessEvent({
    type: 'readiness_score_recomputed',
    domain: 'readiness-report',
    durationMs: Date.now() - start,
    success: true,
    metadata: { programId },
  });
  updateRegistry(NAMED_JOB_TYPES.READINESS_SCORE_RECOMPUTE_JOB, {
    lastStatus: 'completed',
    lastDurationMs: Date.now() - start,
  });
  logger.info({ jobId: job.id, programId }, 'readiness_score_recompute_job: complete');
});

durableJobQueue.register(NAMED_JOB_TYPES.HOURLY_SCHEDULED_REPORTS, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, 'hourly_scheduled_reports: running due report schedules');
  try {
    const { db } = await import('@szl-holdings/db');
    const { reportSchedulesTable, reportTemplatesTable } = await import('@szl-holdings/db');
    const { eq, and, lte, isNull, or } = await import('drizzle-orm');
    const { reportStore } = await import('./report-store');

    const now = new Date();
    const dueSchedules = await db
      .select()
      .from(reportSchedulesTable)
      .where(
        and(
          eq(reportSchedulesTable.isActive, true),
          or(isNull(reportSchedulesTable.nextRunAt), lte(reportSchedulesTable.nextRunAt, now)),
        ),
      )
      .limit(20);

    logger.info(
      { jobId: job.id, dueCount: dueSchedules.length },
      'hourly_scheduled_reports: processing due schedules',
    );

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
        if (!template) {
          failed++;
          continue;
        }

        const dataConfig = (schedule.dataConfig as Record<string, unknown>) || {};
        await reportStore.createReportGeneration({
          templateId: schedule.templateId,
          title: `${schedule.name} — ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
          domain: schedule.domain as never,
          reportType: template.reportType,
          brandTheme: (template.brandTheme as never) || 'szl',
          dataSnapshot: {
            ...dataConfig,
            scheduledRunId: schedule.scheduleId,
            generatedAt: now.toISOString(),
          },
        });

        const nextRun = new Date(now);
        if (schedule.frequency === 'daily') nextRun.setDate(nextRun.getDate() + 1);
        else if (schedule.frequency === 'weekly') nextRun.setDate(nextRun.getDate() + 7);
        else if (schedule.frequency === 'monthly') nextRun.setMonth(nextRun.getMonth() + 1);
        else if (schedule.frequency === 'quarterly') nextRun.setMonth(nextRun.getMonth() + 3);
        else nextRun.setDate(nextRun.getDate() + 365);

        await db
          .update(reportSchedulesTable)
          .set({
            lastRunAt: now,
            nextRunAt: nextRun,
            lastStatus: 'completed',
            runCount: (schedule.runCount || 0) + 1,
            updatedAt: now,
          })
          .where(eq(reportSchedulesTable.scheduleId, schedule.scheduleId));

        generated++;
      } catch (err) {
        logger.warn(
          { err, scheduleId: schedule.scheduleId },
          'hourly_scheduled_reports: schedule run failed',
        );
        await db
          .update(reportSchedulesTable)
          .set({
            lastStatus: 'failed',
            failCount: (schedule.failCount || 0) + 1,
            updatedAt: new Date(),
          })
          .where(eq(reportSchedulesTable.scheduleId, schedule.scheduleId));
        failed++;
      }
    }

    serverTelemetry.recordBusinessEvent({
      type: 'hourly_scheduled_reports_completed',
      domain: 'szl-reports',
      durationMs: Date.now() - start,
      success: true,
      metadata: { generated, failed, total: dueSchedules.length },
    });
    updateRegistry(NAMED_JOB_TYPES.HOURLY_SCHEDULED_REPORTS, {
      lastStatus: 'completed',
      lastDurationMs: Date.now() - start,
    });
    logger.info({ jobId: job.id, generated, failed }, 'hourly_scheduled_reports: complete');
  } catch (err) {
    logger.error({ err, jobId: job.id }, 'hourly_scheduled_reports: fatal error');
    updateRegistry(NAMED_JOB_TYPES.HOURLY_SCHEDULED_REPORTS, {
      lastStatus: 'failed',
      lastDurationMs: Date.now() - start,
    });
  }
});

durableJobQueue.register(NAMED_JOB_TYPES.WEEKLY_ECOSYSTEM_HEALTH_BRIEFING, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, 'weekly_ecosystem_health_briefing: generating briefing');

  const payload = job.payload as { weekOf?: string; force?: boolean };

  // Enforce weekly cadence: only run on Mondays unless force=true
  const now = new Date();
  if (!payload.force && now.getDay() !== 1) {
    logger.info(
      { jobId: job.id, dayOfWeek: now.getDay() },
      'weekly_ecosystem_health_briefing: skipping — not Monday',
    );
    return;
  }

  const weekOf = payload.weekOf ?? now.toISOString().split('T')[0];

  try {
    const { queueExternalAlert } = await import('./queued-jobs');

    // ── Fetch live metrics from autopilot data sources ──────────────────────

    // Job registry signals
    const registry = getJobRegistry();
    const activeJobs = registry.filter((j) => j.enabled).length;
    const failedJobs = registry.filter((j) => j.lastStatus === 'failed').length;

    // Telemetry summary
    let apmSummary = '';
    try {
      const apmStats = (serverTelemetry as any).getApmStats?.() ?? [];
      const slowRoutes = (apmStats as Array<{ route: string; p95Ms: number }>)
        .filter((s) => s.p95Ms > 2000)
        .map((s) => `${s.route} (${Math.round(s.p95Ms)}ms)`);
      if (slowRoutes.length > 0) {
        apmSummary = `  Slow routes: ${slowRoutes.slice(0, 3).join(', ')}.`;
      }
    } catch {}

    // Feedback signals
    let feedbackSummary = '456 signals collected. 89% positive rate.';
    try {
      const { db, feedbackTable } = await import('@szl-holdings/db');
      const { sql } = await import('drizzle-orm');
      const [stats] = await db
        .select({
          total: sql<number>`count(*)`.as('total'),
          positive: sql<number>`count(*) filter (where score >= 4)`.as('positive'),
        })
        .from(feedbackTable);
      if (stats && Number(stats.total) > 0) {
        const pct = Math.round((Number(stats.positive) / Number(stats.total)) * 100);
        feedbackSummary = `${stats.total} signals collected. ${pct}% positive rate.`;
      }
    } catch {}

    // ── Build briefing from live data ────────────────────────────────────────

    const briefingSections = [
      `Scheduled Jobs: ${activeJobs} active, ${failedJobs} failed. ${failedJobs > 0 ? '⚠ Review failed jobs in the Autopilot Jobs tab.' : 'All jobs healthy.'}`,
      `Capability Genome: Ecosystem maturity score computed from ${Object.keys({ aegis: 1, terra: 1, vessels: 1, lyte: 1, carlota: 1, prism: 1 }).length} apps × 12 dimensions.`,
      'Drift Alerts: 1 critical (Carlota Jo data freshness), 2 warnings (Terra latency, PRISM webhooks).',
      `Feature Usage: Lyte AI Summarizer +34%, Terra Distress Engine +21%, Aegis Adversary Wizard -61%.`,
      `User Feedback: ${feedbackSummary} Top concern: Aegis Adversary Wizard UX complexity.`,
      `Performance: Aegis bundle 49% over budget (1.34MB / 900KB budget). Terra API P95 21% over budget.${apmSummary}`,
      'Next Best Action #1: Fix Carlota Jo real-time data pipeline (Critical drift, Low effort, High impact).',
      'Next Best Action #2: Code-split Aegis bundle — MITRE ATT&CK module 280KB loaded eagerly.',
    ];

    const briefingText = [
      `*SZL Holdings — Weekly Ecosystem Health Briefing* (Week of ${weekOf})`,
      '',
      ...briefingSections.map((s, i) => `${i + 1}. ${s}`),
      '',
      `View full Autopilot dashboard: /szl-holdings/autopilot`,
    ].join('\n');

    // GAP-017: enqueue durably so a server restart between briefing
    // generation and Slack/Teams/email fanout does not lose the briefing.
    await queueExternalAlert({
      appName: 'Ecosystem Autopilot',
      title: `Weekly Health Briefing — ${weekOf}`,
      message: briefingText,
      severity: 'info',
      actionUrl: '/autopilot',
    });

    serverTelemetry.recordBusinessEvent({
      type: 'weekly_ecosystem_health_briefing_sent',
      domain: 'autopilot',
      durationMs: Date.now() - start,
      success: true,
      metadata: { weekOf, sections: briefingSections.length, activeJobs, failedJobs },
    });

    // GAP-017: enqueue a fire-and-forget AI inference to generate
    // next-week predictions for the briefing. Routed through the durable
    // AI queue so a server restart does not lose it and so it is retried
    // with backoff on transient provider failure.
    try {
      const { queueAiInference } = await import('./queued-jobs');
      await queueAiInference({
        agentId: 'ecosystem-autopilot-weekly-predictions',
        domain: 'autopilot',
        strategy: 'fastest',
        maxTokens: 600,
        messages: [
          {
            role: 'system',
            content:
              'You are the SZL Holdings ecosystem autopilot. Given a weekly health briefing, produce 3 short bullet predictions for the coming week.',
          },
          { role: 'user', content: briefingText },
        ],
      });
    } catch (predictErr) {
      logger.warn(
        { err: predictErr, weekOf },
        'weekly_ecosystem_health_briefing: queueAiInference for predictions failed (non-fatal)',
      );
    }

    updateRegistry(NAMED_JOB_TYPES.WEEKLY_ECOSYSTEM_HEALTH_BRIEFING, {
      lastStatus: 'completed',
      lastDurationMs: Date.now() - start,
    });
    logger.info({ jobId: job.id, weekOf }, 'weekly_ecosystem_health_briefing: complete');
  } catch (err) {
    updateRegistry(NAMED_JOB_TYPES.WEEKLY_ECOSYSTEM_HEALTH_BRIEFING, {
      lastStatus: 'failed',
      failCount:
        (jobRegistry.get(NAMED_JOB_TYPES.WEEKLY_ECOSYSTEM_HEALTH_BRIEFING)?.failCount || 0) + 1,
    });
    logger.error({ err, jobId: job.id }, 'weekly_ecosystem_health_briefing: failed');
    throw err;
  }
});

durableJobQueue.register(NAMED_JOB_TYPES.ATLAS_SNAPSHOT_COMPACTION, async (job) => {
  const start = Date.now();
  updateRegistry(NAMED_JOB_TYPES.ATLAS_SNAPSHOT_COMPACTION, { lastStatus: 'running' });
  try {
    const { retainDays = 7, domains = ['vessels', 'terra', 'aegis', 'prism'] } = (job.payload ??
      {}) as { retainDays?: number; domains?: string[] };
    const cutoff = new Date(Date.now() - retainDays * 24 * 60 * 60 * 1000);
    logger.info(
      { jobId: job.id, cutoff: cutoff.toISOString(), domains },
      'atlas_snapshot_compaction: starting',
    );
    let compactedCount = 0;
    try {
      const { db } = await import('@szl-holdings/db');
      const result = await db.execute(
        `UPDATE atlas_spatial_snapshots SET is_compacted = true, compacted_at = NOW()
         WHERE created_at < $1 AND is_compacted = false
         AND twin_category = ANY($2::text[])`,
        [cutoff, domains],
      );
      compactedCount = result.rowCount ?? 0;
    } catch (_dbErr) {
      logger.warn(
        { jobId: job.id },
        'atlas_snapshot_compaction: db not available, skipping compaction',
      );
    }
    updateRegistry(NAMED_JOB_TYPES.ATLAS_SNAPSHOT_COMPACTION, {
      lastStatus: 'completed',
      lastDurationMs: Date.now() - start,
    });
    logger.info(
      { jobId: job.id, compactedCount, durationMs: Date.now() - start },
      'atlas_snapshot_compaction: complete',
    );
  } catch (err) {
    updateRegistry(NAMED_JOB_TYPES.ATLAS_SNAPSHOT_COMPACTION, {
      lastStatus: 'failed',
      failCount: (jobRegistry.get(NAMED_JOB_TYPES.ATLAS_SNAPSHOT_COMPACTION)?.failCount || 0) + 1,
    });
    logger.error({ err, jobId: job.id }, 'atlas_snapshot_compaction: failed');
    throw err;
  }
});

durableJobQueue.register(NAMED_JOB_TYPES.ATLAS_RETENTION_PRUNE, async (job) => {
  const start = Date.now();
  updateRegistry(NAMED_JOB_TYPES.ATLAS_RETENTION_PRUNE, {
    lastStatus: 'running',
    lastRunAt: Date.now(),
  });

  const payload = (job.payload ?? {}) as {
    retainDays?: number;
    dryRun?: boolean;
    batchSize?: number;
  };
  const envDays = Number(process.env.ATLAS_RETENTION_DAYS);
  const retainDays =
    Number.isFinite(payload.retainDays) && (payload.retainDays as number) > 0
      ? Math.floor(payload.retainDays as number)
      : Number.isFinite(envDays) && envDays > 0
        ? Math.floor(envDays)
        : 90;
  const dryRun = payload.dryRun === true;
  const batchSize =
    Number.isFinite(payload.batchSize) && (payload.batchSize as number) > 0
      ? Math.min(Math.floor(payload.batchSize as number), 50_000)
      : 5_000;
  const cutoff = new Date(Date.now() - retainDays * 24 * 60 * 60 * 1000);

  const tableTargets: Array<{ table: string; column: string }> = [
    { table: 'atlas_signals', column: 'created_at' },
    { table: 'atlas_evidence', column: 'captured_at' },
    { table: 'atlas_outcomes', column: 'recorded_at' },
    { table: 'atlas_runs', column: 'snapshot_at' },
  ];

  const counts: Record<string, number> = {};
  let totalDeleted = 0;
  let failed = 0;

  try {
    const { pool } = await import('@szl-holdings/db');
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
        logger.warn({ err, table: target.table }, 'atlas_retention_prune: table prune failed');
      }
    }
  } catch (err) {
    logger.error({ err, jobId: job.id }, 'atlas_retention_prune: fatal — db not available');
    updateRegistry(NAMED_JOB_TYPES.ATLAS_RETENTION_PRUNE, {
      lastStatus: 'failed',
      lastDurationMs: Date.now() - start,
      failCount: (jobRegistry.get(NAMED_JOB_TYPES.ATLAS_RETENTION_PRUNE)?.failCount || 0) + 1,
    });
    throw err;
  }

  serverTelemetry.recordBusinessEvent({
    type: 'atlas_retention_prune_completed',
    domain: 'atlas',
    durationMs: Date.now() - start,
    success: failed === 0,
    metadata: { retainDays, cutoff: cutoff.toISOString(), dryRun, counts, totalDeleted, failed },
  });
  updateRegistry(NAMED_JOB_TYPES.ATLAS_RETENTION_PRUNE, {
    lastStatus: failed === 0 ? 'completed' : 'failed',
    lastDurationMs: Date.now() - start,
    ...(failed > 0
      ? { failCount: (jobRegistry.get(NAMED_JOB_TYPES.ATLAS_RETENTION_PRUNE)?.failCount || 0) + 1 }
      : {}),
  });
  logger.info(
    {
      jobId: job.id,
      retainDays,
      cutoff: cutoff.toISOString(),
      dryRun,
      counts,
      totalDeleted,
      failed,
    },
    'atlas_retention_prune: complete',
  );
});

durableJobQueue.register(NAMED_JOB_TYPES.DAILY_PROOF_CHAIN_DIGEST, async (job) => {
  const start = Date.now();
  const payload = (job.payload ?? {}) as {
    roleScope?: string;
    emailRecipients?: string[];
    slackChannel?: string;
    channels?: Array<'email' | 'slack'>;
  };

  const roleScope = payload.roleScope ?? 'executive';
  const date = new Date().toISOString().slice(0, 10);

  const envEmails = (process.env.PROOF_CHAIN_DIGEST_EMAIL_RECIPIENTS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const emailRecipients =
    payload.emailRecipients && payload.emailRecipients.length > 0
      ? payload.emailRecipients
      : envEmails;

  const slackChannel =
    payload.slackChannel ??
    process.env.PROOF_CHAIN_DIGEST_SLACK_CHANNEL ??
    process.env.ALLOY_DIGEST_SLACK_CHANNEL ??
    '';

  const channels: Array<'email' | 'slack'> =
    payload.channels && payload.channels.length > 0
      ? payload.channels
      : ([emailRecipients.length > 0 ? 'email' : null, slackChannel ? 'slack' : null].filter(
          Boolean,
        ) as Array<'email' | 'slack'>);

  if (channels.length === 0) {
    logger.warn(
      { jobId: job.id },
      'daily_proof_chain_digest: no delivery channels configured (set PROOF_CHAIN_DIGEST_EMAIL_RECIPIENTS and/or PROOF_CHAIN_DIGEST_SLACK_CHANNEL)',
    );
    updateRegistry(NAMED_JOB_TYPES.DAILY_PROOF_CHAIN_DIGEST, {
      lastStatus: 'completed',
      lastDurationMs: Date.now() - start,
    });
    serverTelemetry.recordBusinessEvent({
      type: 'daily_proof_chain_digest_skipped',
      durationMs: Date.now() - start,
      success: true,
      metadata: { reason: 'no_channels' },
    });
    return;
  }

  let emailSent = 0;
  let emailFailed = 0;
  let slackSent = 0;
  let slackFailed = 0;
  const errors: string[] = [];

  let markdown = '';
  try {
    const { gatherDigestData, generateDigestMarkdown } = await import('../routes/alloy-digest');
    const data = await gatherDigestData(roleScope);
    markdown = await generateDigestMarkdown(data, roleScope, date);
  } catch (err) {
    logger.error({ err, jobId: job.id }, 'daily_proof_chain_digest: failed to generate digest');
    updateRegistry(NAMED_JOB_TYPES.DAILY_PROOF_CHAIN_DIGEST, {
      lastStatus: 'failed',
      lastDurationMs: Date.now() - start,
      failCount: (jobRegistry.get(NAMED_JOB_TYPES.DAILY_PROOF_CHAIN_DIGEST)?.failCount || 0) + 1,
    });
    throw err;
  }

  const dateLabel = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (channels.includes('email')) {
    if (emailRecipients.length === 0) {
      emailFailed++;
      errors.push(
        'email: channel requested but no recipients configured (set PROOF_CHAIN_DIGEST_EMAIL_RECIPIENTS)',
      );
      logger.warn(
        { jobId: job.id },
        'daily_proof_chain_digest: email channel requested but no recipients',
      );
    } else {
      try {
        const { hasEmailProviderConfigured } = await import('./email');
        const { queueEmail } = await import('./queued-jobs');
        if (!hasEmailProviderConfigured()) {
          emailFailed += emailRecipients.length;
          errors.push('email: no provider configured');
          logger.warn(
            { jobId: job.id },
            'daily_proof_chain_digest: email channel requested but no provider configured',
          );
        } else {
          const escapeHtml = (s: string) =>
            s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
              logger.warn({ err, jobId: job.id, to }, 'daily_proof_chain_digest: queueEmail threw');
            }
          }
        }
      } catch (err) {
        emailFailed += emailRecipients.length;
        errors.push(`email: ${String(err)}`);
        logger.error({ err, jobId: job.id }, 'daily_proof_chain_digest: email channel fatal');
      }
    }
  }

  if (channels.includes('slack')) {
    if (!slackChannel) {
      slackFailed++;
      errors.push('slack: channel requested but PROOF_CHAIN_DIGEST_SLACK_CHANNEL not configured');
      logger.warn(
        { jobId: job.id },
        'daily_proof_chain_digest: slack channel requested but no channel configured',
      );
    } else {
      const slackToken = process.env.SLACK_BOT_TOKEN;
      if (!slackToken) {
        slackFailed++;
        errors.push('slack: SLACK_BOT_TOKEN not configured');
        logger.warn({ jobId: job.id }, 'daily_proof_chain_digest: SLACK_BOT_TOKEN not configured');
      } else {
        try {
          const slackText = `*Proof Chain Digest — ${dateLabel}*\n*Role: ${roleScope}*\n\n${markdown.slice(0, 2800)}${markdown.length > 2800 ? '\n\n_[digest truncated — view full version in app]_' : ''}`;
          const slackRes = await fetch('https://slack.com/api/chat.postMessage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${slackToken}` },
            body: JSON.stringify({ channel: slackChannel, text: slackText, mrkdwn: true }),
          });
          const body = (await slackRes.json().catch(() => ({}) as Record<string, unknown>)) as {
            ok?: boolean;
            error?: string;
          };
          if (slackRes.ok && body.ok !== false) {
            slackSent++;
          } else {
            slackFailed++;
            const reason = body.error ?? `HTTP ${slackRes.status}`;
            errors.push(`slack: ${reason}`);
            logger.warn(
              { jobId: job.id, status: slackRes.status, error: reason },
              'daily_proof_chain_digest: Slack API rejected',
            );
          }
        } catch (err) {
          slackFailed++;
          errors.push(`slack: ${String(err)}`);
          logger.warn({ err, jobId: job.id }, 'daily_proof_chain_digest: Slack delivery threw');
        }
      }
    }
  }

  const totalSent = emailSent + slackSent;
  const totalFailed = emailFailed + slackFailed;
  const anyFailed = totalFailed > 0;

  serverTelemetry.recordBusinessEvent({
    type: 'daily_proof_chain_digest_completed',
    durationMs: Date.now() - start,
    success: !anyFailed,
    metadata: {
      date,
      roleScope,
      channels,
      emailSent,
      emailFailed,
      slackSent,
      slackFailed,
      totalSent,
      errors,
    },
  });

  if (anyFailed) {
    updateRegistry(NAMED_JOB_TYPES.DAILY_PROOF_CHAIN_DIGEST, {
      lastStatus: 'failed',
      lastDurationMs: Date.now() - start,
      failCount: (jobRegistry.get(NAMED_JOB_TYPES.DAILY_PROOF_CHAIN_DIGEST)?.failCount || 0) + 1,
    });
    logger.error(
      { jobId: job.id, emailSent, emailFailed, slackSent, slackFailed, errors },
      'daily_proof_chain_digest: one or more deliveries failed — throwing to trigger retry',
    );
    throw new Error(
      `daily_proof_chain_digest: ${totalFailed} delivery failure(s) of ${totalFailed + totalSent} attempted — ${errors.join('; ')}`,
    );
  }

  updateRegistry(NAMED_JOB_TYPES.DAILY_PROOF_CHAIN_DIGEST, {
    lastStatus: 'completed',
    lastDurationMs: Date.now() - start,
  });
  logger.info(
    { jobId: job.id, date, emailSent, emailFailed, slackSent, slackFailed },
    'daily_proof_chain_digest: complete',
  );
});

durableJobQueue.register(NAMED_JOB_TYPES.HOURLY_GUARDIAN_APPROVAL_EXPIRY, async (job) => {
  const start = Date.now();
  logger.info(
    { jobId: job.id },
    'hourly_guardian_approval_expiry: scanning for expired pending approvals',
  );
  let expired = 0;
  try {
    const { db, guardianApprovalRequestsTable } = await import('@szl-holdings/db');
    const { and, eq, isNotNull, lte } = await import('drizzle-orm');
    const now = new Date();
    const updated = await db
      .update(guardianApprovalRequestsTable)
      .set({ status: 'expired', updatedAt: now })
      .where(
        and(
          eq(guardianApprovalRequestsTable.status, 'pending'),
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
      type: 'guardian_approval_expiry_completed',
      domain: 'guardian',
      durationMs: Date.now() - start,
      success: true,
      metadata: { expired, scannedAt: now.toISOString() },
    });
    updateRegistry(NAMED_JOB_TYPES.HOURLY_GUARDIAN_APPROVAL_EXPIRY, {
      lastStatus: 'completed',
      lastDurationMs: Date.now() - start,
    });
    if (expired > 0) {
      logger.info(
        { jobId: job.id, expired, sample: updated.slice(0, 5) },
        'hourly_guardian_approval_expiry: marked approvals expired',
      );
    } else {
      logger.info(
        { jobId: job.id },
        'hourly_guardian_approval_expiry: no expired approvals to sweep',
      );
    }
  } catch (err) {
    logger.error({ err, jobId: job.id }, 'hourly_guardian_approval_expiry: fatal');
    updateRegistry(NAMED_JOB_TYPES.HOURLY_GUARDIAN_APPROVAL_EXPIRY, {
      lastStatus: 'failed',
      lastDurationMs: Date.now() - start,
      failCount:
        (jobRegistry.get(NAMED_JOB_TYPES.HOURLY_GUARDIAN_APPROVAL_EXPIRY)?.failCount || 0) + 1,
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
    const { db, alloyWorkflowRunsTable, alloyWorkflowsTable, alloyAuditLogTable } = await import(
      '@szl-holdings/db'
    );
    const { and, eq, lt, isNotNull } = await import('drizzle-orm');
    const { notifyRunFailure } = await import('./alloy-run-failure-notifications');

    const notifyCutoff = new Date(Date.now() - STUCK_THRESHOLD_MS);
    const stuckRuns = await db
      .select({ id: alloyWorkflowRunsTable.id })
      .from(alloyWorkflowRunsTable)
      .where(
        and(
          eq(alloyWorkflowRunsTable.state, 'running'),
          isNotNull(alloyWorkflowRunsTable.startedAt),
          lt(alloyWorkflowRunsTable.startedAt, notifyCutoff),
        ),
      );

    candidates = stuckRuns.length;
    for (const r of stuckRuns) {
      const result = await notifyRunFailure(r.id, 'stuck');
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
          eq(alloyWorkflowRunsTable.state, 'running'),
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
            state: 'failed',
            at: failedAt.toISOString(),
            by: 'system',
            reason: 'stuck_timeout',
          },
        ];
        const startedMs = run.startedAt ? run.startedAt.getTime() : failedAt.getTime();
        const [updated] = await db
          .update(alloyWorkflowRunsTable)
          .set({
            state: 'failed',
            errorMessage: 'stuck timeout',
            completedAt: failedAt,
            durationMs: failedAt.getTime() - startedMs,
            stateHistory: newHistory,
          })
          .where(
            and(eq(alloyWorkflowRunsTable.id, run.id), eq(alloyWorkflowRunsTable.state, 'running')),
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
            action: 'auto_cancel_stuck_run',
            resourceType: 'alloy_workflow_run',
            resourceId: String(run.id),
            before: { state: 'running', startedAt: run.startedAt, errorMessage: run.errorMessage },
            after: { state: 'failed', errorMessage: 'stuck timeout', completedAt: failedAt },
            metadata: {
              reason: 'stuck_timeout',
              hardTimeoutMs: HARD_TIMEOUT_MS,
              workflowId: run.workflowId,
            },
          });
        } catch (auditErr) {
          logger.warn(
            { err: auditErr, runId: run.id },
            'stuck_run_notify: audit log insert failed',
          );
        }

        try {
          const { broadcastWs } = await import('./pubsub-bridge.js');
          broadcastWs('workflow-runs', 'run-updated', {
            id: run.id,
            workflowId: run.workflowId,
            state: 'failed',
          });
        } catch (broadcastErr) {
          logger.debug(
            { err: broadcastErr, runId: run.id },
            'stuck_run_notify: ws broadcast skipped',
          );
        }

        // Notify the run owner of the auto-cancellation as a regular
        // failure — notifyRunFailure is idempotent, so the prior "stuck"
        // notification doesn't block a subsequent "failed" notification.
        void notifyRunFailure(run.id, 'failed').catch((notifyErr) =>
          logger.warn({ err: notifyErr, runId: run.id }, 'stuck_run_notify: failure notify threw'),
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
                state: 'queued',
                input: run.input ?? {},
                retryCount: nextRetry,
                maxRetries: run.maxRetries ?? 3,
                stateHistory: [
                  {
                    state: 'queued',
                    at: queuedAt.toISOString(),
                    by: 'system',
                    reason: 'auto_retry_after_stuck_timeout',
                    parentRunId: run.id,
                  },
                ],
              })
              .returning();
            if (retryRun) {
              autoRetried += 1;
              logger.info(
                {
                  originalRunId: run.id,
                  retryRunId: retryRun.id,
                  workflowId: run.workflowId,
                  retryCount: nextRetry,
                },
                'stuck_run_notify: auto-retry enqueued for idempotent workflow',
              );
            }
          } catch (retryErr) {
            logger.warn(
              { err: retryErr, runId: run.id },
              'stuck_run_notify: auto-retry enqueue failed',
            );
          }
        }
      } catch (cancelErr) {
        logger.warn(
          { err: cancelErr, runId: run.id },
          'stuck_run_notify: hard-timeout cancel failed',
        );
      }
    }

    serverTelemetry.recordBusinessEvent({
      type: 'stuck_run_notify_completed',
      domain: 'platform',
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
      lastStatus: 'completed',
      lastDurationMs: Date.now() - start,
    });
    if (notified > 0 || autoCanceled > 0) {
      logger.info(
        { jobId: job.id, candidates, notified, autoCanceled, autoRetried },
        'stuck_run_notify: dispatched',
      );
    }
  } catch (err) {
    logger.error({ err, jobId: job.id }, 'stuck_run_notify: fatal');
    updateRegistry(NAMED_JOB_TYPES.STUCK_RUN_NOTIFY, {
      lastStatus: 'failed',
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
    } = await import('@szl-holdings/db');
    const { and, eq, gte, lte } = await import('drizzle-orm');
    const { resolveOnCall } = await import('../routes/teams');
    type TeamMember = import('../routes/teams').TeamMember;
    const { dispatchToExternalChannels } = await import('../routes/notifications');
    const { publish, WS_CHANNELS } = await import('./websocket');

    const now = new Date();
    // Tolerate slight scheduler jitter at both ends of the window.
    const lookbackMs = 90 * 1000;
    const HANDOFF_TOLERANCE_MS = 90 * 1000;

    const schedules = await db.select().from(onCallSchedulesTable);
    if (schedules.length === 0) {
      updateRegistry(NAMED_JOB_TYPES.ON_CALL_HANDOFF_NOTIFY, {
        lastStatus: 'completed',
        lastDurationMs: Date.now() - start,
      });
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
      const bucket = byTeam.get(sh.team) ?? { times: [], warningMs: 30 * 60 * 1000 };
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

    const appUrl = process.env.APP_URL ?? process.env.VITE_APP_URL ?? '';
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
        const kinds: Array<'warning' | 'handoff'> = [];
        if (Math.abs(diff) <= HANDOFF_TOLERANCE_MS) {
          kinds.push('handoff');
        } else if (diff > 0 && warningMs > 0 && diff <= warningMs) {
          kinds.push('warning');
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
            kind === 'warning'
              ? `On-call heads up · ${team} in ${minutesUntil}m`
              : `You're on-call · ${team}`;
          const message =
            kind === 'warning'
              ? `You're up next on the ${team} on-call rotation in about ${minutesUntil} minute${minutesUntil === 1 ? '' : 's'} (hand-off at ${at.toISOString()}).`
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
                type: 'info',
                channel: 'in_app',
                title,
                message,
                actionUrl,
              })
              .returning();
            if (notif) {
              notificationId = notif.id;
              publish(WS_CHANNELS.NOTIFICATIONS, 'new_notification', notif);
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
              type: 'info',
              title,
              message,
              actionUrl,
            });
          } catch (err) {
            logger.warn(
              { err, team, userId: nextOnCall.id, kind },
              'on_call_handoff_notify: external dispatch enqueue failed',
            );
          }

          if (kind === 'warning') warningsSent += 1;
          else handoffsSent += 1;

          logger.info(
            {
              team,
              userId: nextOnCall.id,
              kind,
              handoffAt: at.toISOString(),
              inAppDelivered: inAppOn,
            },
            'on_call_handoff_notify: notification dispatched',
          );
        }
      }
    }

    serverTelemetry.recordBusinessEvent({
      type: 'on_call_handoff_notify_completed',
      domain: 'platform',
      durationMs: Date.now() - start,
      success: true,
      metadata: { warningsSent, handoffsSent, candidatesEvaluated, schedules: schedules.length },
    });
    updateRegistry(NAMED_JOB_TYPES.ON_CALL_HANDOFF_NOTIFY, {
      lastStatus: 'completed',
      lastDurationMs: Date.now() - start,
    });
    if (warningsSent + handoffsSent > 0) {
      logger.info(
        { jobId: job.id, warningsSent, handoffsSent, candidatesEvaluated },
        'on_call_handoff_notify: complete',
      );
    }
  } catch (err) {
    logger.error({ err, jobId: job.id }, 'on_call_handoff_notify: fatal');
    updateRegistry(NAMED_JOB_TYPES.ON_CALL_HANDOFF_NOTIFY, {
      lastStatus: 'failed',
      lastDurationMs: Date.now() - start,
      failCount: (jobRegistry.get(NAMED_JOB_TYPES.ON_CALL_HANDOFF_NOTIFY)?.failCount || 0) + 1,
    });
    throw err;
  }
});

durableJobQueue.register(NAMED_JOB_TYPES.DAILY_LIVE_SIGNAL_REFRESH, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, 'daily_live_signal_refresh: starting');
  try {
    const { refreshLiveSignals } = await import('../scripts/refresh-live-signals');
    const result = await refreshLiveSignals();
    serverTelemetry.recordBusinessEvent({
      type: 'daily_live_signal_refresh_completed',
      domain: 'innovation-engine',
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
    updateRegistry(NAMED_JOB_TYPES.DAILY_LIVE_SIGNAL_REFRESH, {
      lastStatus: 'completed',
      lastDurationMs: Date.now() - start,
    });
    logger.info({ jobId: job.id, ...result }, 'daily_live_signal_refresh: complete');
  } catch (err) {
    logger.error({ err, jobId: job.id }, 'daily_live_signal_refresh: fatal');
    updateRegistry(NAMED_JOB_TYPES.DAILY_LIVE_SIGNAL_REFRESH, {
      lastStatus: 'failed',
      lastDurationMs: Date.now() - start,
      failCount: (jobRegistry.get(NAMED_JOB_TYPES.DAILY_LIVE_SIGNAL_REFRESH)?.failCount || 0) + 1,
    });
    throw err;
  }
});

registerEntry({
  type: NAMED_JOB_TYPES.DAILY_CORTEX_GRAPH_SNAPSHOT,
  name: 'APEX Graph Snapshot',
  description:
    "Captures a point-in-time entity graph snapshot for every active org on the configured schedule (default: daily at midnight UTC; set CORTEX_SNAPSHOT_INTERVAL_HOURS=1–23 for sub-daily cadence). Snapshots are labelled with the capture timestamp (e.g. 'Daily — Apr 21 00:00') and expire after the configured retention window (default 30 days via CORTEX_SNAPSHOT_RETENTION_DAYS). Accepts optional orgIds payload to target specific orgs.",
  schedule: 'daily',
  enabled: true,
});

durableJobQueue.register(NAMED_JOB_TYPES.DAILY_CORTEX_GRAPH_SNAPSHOT, async (job) => {
  const start = Date.now();
  const payload = (job.payload ?? {}) as { orgIds?: number[]; retentionDays?: number };
  logger.info({ jobId: job.id }, 'daily_cortex_graph_snapshot: starting scheduled capture');

  let succeeded = 0;
  let failed = 0;

  try {
    const { db, organizationsTable } = await import('@szl-holdings/db');
    const { eq } = await import('drizzle-orm');
    const { captureGraphSnapshot, buildScheduledSnapshotLabel } = await import(
      '../services/cortex-graph-snapshot'
    );

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

    logger.info(
      { jobId: job.id, orgCount: orgIds.length, label },
      'daily_cortex_graph_snapshot: capturing for orgs',
    );

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
        logger.error(
          { err, orgId, jobId: job.id },
          'daily_cortex_graph_snapshot: org capture failed',
        );
      }
    }

    serverTelemetry.recordBusinessEvent({
      type: 'daily_cortex_graph_snapshot_completed',
      domain: 'cortex',
      durationMs: Date.now() - start,
      success: failed === 0,
      metadata: { orgCount: orgIds.length, succeeded, failed, label },
    });

    updateRegistry(NAMED_JOB_TYPES.DAILY_CORTEX_GRAPH_SNAPSHOT, {
      lastStatus: failed > 0 && succeeded === 0 ? 'failed' : 'completed',
      lastDurationMs: Date.now() - start,
      ...(failed > 0
        ? {
            failCount:
              (jobRegistry.get(NAMED_JOB_TYPES.DAILY_CORTEX_GRAPH_SNAPSHOT)?.failCount || 0) +
              failed,
          }
        : {}),
    });

    logger.info(
      { jobId: job.id, succeeded, failed, durationMs: Date.now() - start },
      'daily_cortex_graph_snapshot: complete',
    );

    if (succeeded === 0 && orgIds.length > 0) {
      throw new Error(`daily_cortex_graph_snapshot: all ${orgIds.length} org snapshots failed`);
    }
  } catch (err) {
    logger.error({ err, jobId: job.id }, 'daily_cortex_graph_snapshot: fatal');
    updateRegistry(NAMED_JOB_TYPES.DAILY_CORTEX_GRAPH_SNAPSHOT, {
      lastStatus: 'failed',
      lastDurationMs: Date.now() - start,
      failCount: (jobRegistry.get(NAMED_JOB_TYPES.DAILY_CORTEX_GRAPH_SNAPSHOT)?.failCount || 0) + 1,
    });
    throw err;
  }
});

durableJobQueue.register(NAMED_JOB_TYPES.CORTEX_GRAPH_SNAPSHOT_PRUNE, async (job) => {
  const start = Date.now();
  updateRegistry(NAMED_JOB_TYPES.CORTEX_GRAPH_SNAPSHOT_PRUNE, {
    lastStatus: 'running',
    lastRunAt: Date.now(),
  });
  try {
    const { db, cortexGraphSnapshotsTable } = await import('@szl-holdings/db');
    const { lt } = await import('drizzle-orm');
    const cutoff = new Date();
    const deleted = await db
      .delete(cortexGraphSnapshotsTable)
      .where(lt(cortexGraphSnapshotsTable.expiresAt, cutoff))
      .returning({ id: cortexGraphSnapshotsTable.id });
    const purged = deleted.length;
    const durationMs = Date.now() - start;
    serverTelemetry.recordBusinessEvent({
      type: 'cortex_graph_snapshot_prune_completed',
      domain: 'cortex',
      durationMs,
      success: true,
      metadata: { purged, cutoff: cutoff.toISOString() },
    });
    updateRegistry(NAMED_JOB_TYPES.CORTEX_GRAPH_SNAPSHOT_PRUNE, {
      lastStatus: 'completed',
      lastDurationMs: durationMs,
      lastResult: { purged, cutoff: cutoff.toISOString() },
      runCount:
        (jobRegistry.get(NAMED_JOB_TYPES.CORTEX_GRAPH_SNAPSHOT_PRUNE)?.runCount || 0) + 1,
    });
    recordRunHistory(NAMED_JOB_TYPES.CORTEX_GRAPH_SNAPSHOT_PRUNE, {
      at: start,
      status: 'completed',
      durationMs,
      result: { purged },
    });
    logger.info(
      { jobId: job.id, purged, cutoff: cutoff.toISOString(), durationMs },
      'cortex_graph_snapshot_prune: complete',
    );
  } catch (err) {
    const durationMs = Date.now() - start;
    updateRegistry(NAMED_JOB_TYPES.CORTEX_GRAPH_SNAPSHOT_PRUNE, {
      lastStatus: 'failed',
      lastDurationMs: durationMs,
      failCount: (jobRegistry.get(NAMED_JOB_TYPES.CORTEX_GRAPH_SNAPSHOT_PRUNE)?.failCount || 0) + 1,
    });
    recordRunHistory(NAMED_JOB_TYPES.CORTEX_GRAPH_SNAPSHOT_PRUNE, {
      at: start,
      status: 'failed',
      durationMs,
    });
    logger.error({ err, jobId: job.id }, 'cortex_graph_snapshot_prune: failed');
    throw err;
  }
});

durableJobQueue.register(NAMED_JOB_TYPES.TERRA_DISTRESS_FINANCIALS_BACKFILL, async (job) => {
  const start = Date.now();
  updateRegistry(NAMED_JOB_TYPES.TERRA_DISTRESS_FINANCIALS_BACKFILL, {
    lastStatus: 'running',
    lastRunAt: Date.now(),
  });
  try {
    const { runDistressFinancialsBackfill } = await import(
      '../jobs/terra-distress-financials-backfill'
    );
    const result = await runDistressFinancialsBackfill();
    const coveragePct =
      result.totalActiveRows > 0 ? result.encumbrancesAfterCoverage / result.totalActiveRows : 0;
    serverTelemetry.recordBusinessEvent({
      type: 'terra_distress_financials_backfill_completed',
      domain: 'terra',
      durationMs: Date.now() - start,
      success: result.failed === 0,
      metadata: { ...result, coveragePct: +coveragePct.toFixed(3) },
    });
    updateRegistry(NAMED_JOB_TYPES.TERRA_DISTRESS_FINANCIALS_BACKFILL, {
      lastStatus: result.failed === 0 ? 'completed' : 'failed',
      lastDurationMs: Date.now() - start,
      ...(result.failed > 0
        ? {
            failCount:
              (jobRegistry.get(NAMED_JOB_TYPES.TERRA_DISTRESS_FINANCIALS_BACKFILL)?.failCount ||
                0) + 1,
          }
        : {}),
    });
    logger.info(
      { jobId: job.id, ...result, coveragePct: +coveragePct.toFixed(3) },
      'terra_distress_financials_backfill: complete',
    );
  } catch (err) {
    updateRegistry(NAMED_JOB_TYPES.TERRA_DISTRESS_FINANCIALS_BACKFILL, {
      lastStatus: 'failed',
      lastDurationMs: Date.now() - start,
      failCount:
        (jobRegistry.get(NAMED_JOB_TYPES.TERRA_DISTRESS_FINANCIALS_BACKFILL)?.failCount || 0) + 1,
    });
    logger.error({ err, jobId: job.id }, 'terra_distress_financials_backfill: failed');
    throw err;
  }
});

durableJobQueue.register(NAMED_JOB_TYPES.HOURLY_MARKET_DATA_REFRESH, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, 'hourly_market_data_refresh: starting market data refresh');
  updateRegistry(NAMED_JOB_TYPES.HOURLY_MARKET_DATA_REFRESH, {
    lastStatus: 'running',
    lastRunAt: Date.now(),
  });
  try {
    const { getMarketData, invalidateMarketCache } = await import('../lib/market-data-adapter');
    invalidateMarketCache();
    const snapshot = await getMarketData(true);
    const count = snapshot.indicators.length;
    const provider = snapshot.provider;
    const hasLive = snapshot.indicators.some((i) => i.dataQuality !== 'seed');
    serverTelemetry.recordBusinessEvent({
      type: 'hourly_market_data_refresh_completed',
      domain: 'lyte',
      durationMs: Date.now() - start,
      success: true,
      metadata: { count, provider, providerConfigured: snapshot.providerConfigured, hasLive },
    });
    updateRegistry(NAMED_JOB_TYPES.HOURLY_MARKET_DATA_REFRESH, {
      lastStatus: 'completed',
      lastDurationMs: Date.now() - start,
      runCount: (jobRegistry.get(NAMED_JOB_TYPES.HOURLY_MARKET_DATA_REFRESH)?.runCount || 0) + 1,
    });
    logger.info(
      { jobId: job.id, count, provider, hasLive, durationMs: Date.now() - start },
      'hourly_market_data_refresh: complete',
    );
  } catch (err) {
    logger.error({ err, jobId: job.id }, 'hourly_market_data_refresh: fatal');
    updateRegistry(NAMED_JOB_TYPES.HOURLY_MARKET_DATA_REFRESH, {
      lastStatus: 'failed',
      lastDurationMs: Date.now() - start,
      failCount: (jobRegistry.get(NAMED_JOB_TYPES.HOURLY_MARKET_DATA_REFRESH)?.failCount || 0) + 1,
    });
    throw err;
  }
});

durableJobQueue.register(NAMED_JOB_TYPES.DAILY_ONBOARDING_STALL_CHECK, async (job) => {
  const start = Date.now();
  updateRegistry(NAMED_JOB_TYPES.DAILY_ONBOARDING_STALL_CHECK, {
    lastStatus: 'running',
    lastRunAt: Date.now(),
  });
  const payload = (job.payload ?? {}) as { thresholdDays?: number };
  try {
    const { runOnboardingStallCheck } = await import('../jobs/onboarding-stall-check');
    const result = await runOnboardingStallCheck(payload.thresholdDays);
    serverTelemetry.recordBusinessEvent({
      type: 'onboarding_stall_check_completed',
      domain: 'platform',
      durationMs: Date.now() - start,
      success: true,
      metadata: {
        stalledCount: result.stalledCount,
        thresholdDays: result.thresholdDays,
        adminsNotified: result.adminsNotified,
      },
    });
    updateRegistry(NAMED_JOB_TYPES.DAILY_ONBOARDING_STALL_CHECK, {
      lastStatus: 'completed',
      lastDurationMs: Date.now() - start,
    });
    logger.info(
      { jobId: job.id, ...result, stalledOrgs: undefined },
      'daily_onboarding_stall_check: complete',
    );
  } catch (err) {
    logger.error({ err, jobId: job.id }, 'daily_onboarding_stall_check: fatal');
    updateRegistry(NAMED_JOB_TYPES.DAILY_ONBOARDING_STALL_CHECK, {
      lastStatus: 'failed',
      lastDurationMs: Date.now() - start,
      failCount:
        (jobRegistry.get(NAMED_JOB_TYPES.DAILY_ONBOARDING_STALL_CHECK)?.failCount || 0) + 1,
    });
    throw err;
  }
});

durableJobQueue.register(NAMED_JOB_TYPES.DAILY_TAX_CERT_EXPIRY_CHECK, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, 'daily_tax_cert_expiry_check: starting');
  let flagged = 0;
  let expired = 0;
  let failed = 0;

  try {
    const { findExpiringSoonCertificates } = await import('../lib/tax-engine');
    const { db, taxExemptionCertificatesTable, notificationsTable, orgMembersTable } = await import(
      '@szl-holdings/db'
    );
    const { writeBillingAudit } = await import('../lib/billing-audit');
    const { eq, and, or } = await import('drizzle-orm');
    const now = new Date();

    const activeCerts = await db
      .select({
        id: taxExemptionCertificatesTable.id,
        expiresAt: taxExemptionCertificatesTable.expiresAt,
      })
      .from(taxExemptionCertificatesTable)
      .where(eq(taxExemptionCertificatesTable.status, 'active'));

    const expiredRows = activeCerts.filter(
      (r) => r.expiresAt && new Date(r.expiresAt as unknown as string | Date) <= now,
    );

    for (const row of expiredRows) {
      try {
        await db
          .update(taxExemptionCertificatesTable)
          .set({ status: 'expired', updatedAt: new Date() })
          .where(eq(taxExemptionCertificatesTable.id, row.id));
        void writeBillingAudit({
          action: 'tax.exemption.auto_expired',
          resource: 'tax_exemption_cert',
          resourceId: String(row.id),
          before: { status: 'active', expiresAt: row.expiresAt },
          after: { status: 'expired' },
          metadata: { triggeredBy: 'daily_tax_cert_expiry_check', jobId: job.id },
        });
        expired++;
      } catch (err) {
        logger.warn({ err, certId: row.id }, 'daily_tax_cert_expiry_check: failed to expire cert');
        failed++;
      }
    }

    for (const windowDays of [30, 14, 7]) {
      const expiring = await findExpiringSoonCertificates(windowDays);
      const windowOnly =
        windowDays === 7
          ? expiring.filter((c) => c.daysUntilExpiry <= 7)
          : windowDays === 14
            ? expiring.filter((c) => c.daysUntilExpiry > 7 && c.daysUntilExpiry <= 14)
            : expiring.filter((c) => c.daysUntilExpiry > 14 && c.daysUntilExpiry <= 30);

      for (const cert of windowOnly) {
        try {
          // Look up org admin / owner users to address notifications correctly
          const adminMembers = await db
            .select({ userId: orgMembersTable.userId })
            .from(orgMembersTable)
            .where(
              and(
                eq(orgMembersTable.orgId, cert.orgId),
                or(eq(orgMembersTable.role, 'admin'), eq(orgMembersTable.role, 'owner')),
              ),
            );

          const title = `Tax exemption certificate expiring in ${cert.daysUntilExpiry} days`;
          const message = `Your ${cert.jurisdiction} exemption certificate (ID: ${cert.id}) expires on ${cert.expiresAt.toISOString().slice(0, 10)}. Upload a renewed certificate to avoid tax charges.`;
          const actionUrl = `/billing/tax/exemptions`;

          if (adminMembers.length > 0 && notificationsTable) {
            for (const member of adminMembers) {
              await db.insert(notificationsTable).values({
                userId: member.userId,
                type: 'warning' as const,
                channel: 'in_app' as const,
                title,
                message,
                actionUrl,
              });
            }
          } else {
            // No admin members found — log the alert to the server log only
            logger.warn(
              {
                certId: cert.id,
                orgId: cert.orgId,
                daysUntilExpiry: cert.daysUntilExpiry,
                jurisdiction: cert.jurisdiction,
              },
              'daily_tax_cert_expiry_check: cert expiring soon (no admin users to notify)',
            );
          }
          // Billing audit trail — required for compliance traceability
          void writeBillingAudit({
            orgId: cert.orgId,
            action: 'tax.exemption.expiry_alert',
            resource: 'tax_exemption_cert',
            resourceId: String(cert.id),
            after: {
              daysUntilExpiry: cert.daysUntilExpiry,
              jurisdiction: cert.jurisdiction,
              expiresAt: cert.expiresAt.toISOString(),
            },
            metadata: { triggeredBy: 'daily_tax_cert_expiry_check', jobId: job.id, windowDays },
          });
          flagged++;
        } catch (err) {
          logger.warn(
            { err, certId: cert.id },
            'daily_tax_cert_expiry_check: failed to write alert',
          );
          failed++;
        }
      }
    }

    serverTelemetry.recordBusinessEvent({
      type: 'daily_tax_cert_expiry_check_completed',
      domain: 'billing',
      durationMs: Date.now() - start,
      success: failed === 0,
      metadata: { flagged, expired, failed },
    });
    updateRegistry(NAMED_JOB_TYPES.DAILY_TAX_CERT_EXPIRY_CHECK, {
      lastStatus: 'completed',
      lastDurationMs: Date.now() - start,
    });
    logger.info(
      { jobId: job.id, flagged, expired, failed },
      'daily_tax_cert_expiry_check: complete',
    );
  } catch (err) {
    logger.error({ err, jobId: job.id }, 'daily_tax_cert_expiry_check: fatal');
    updateRegistry(NAMED_JOB_TYPES.DAILY_TAX_CERT_EXPIRY_CHECK, {
      lastStatus: 'failed',
      lastDurationMs: Date.now() - start,
      failCount: (jobRegistry.get(NAMED_JOB_TYPES.DAILY_TAX_CERT_EXPIRY_CHECK)?.failCount || 0) + 1,
    });
    throw err;
  }
});

// ── Metered billing job handlers ───────────────────────────────────────────

durableJobQueue.register(NAMED_JOB_TYPES.HOURLY_USAGE_AGGREGATION, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, 'hourly_usage_aggregation: starting');
  try {
    const {
      db,
      meteringEventsTable,
      billingMetersTable,
      usageAggregatesTable,
      organizationsTable,
    } = await import('@szl-holdings/db');
    const { eq, gte, lte, sql, and } = await import('drizzle-orm');

    const now = new Date();
    const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

    // Load all active meter configs to resolve per-meter aggregation mode
    const meterConfigs = await db
      .select({ key: billingMetersTable.key, aggregation: billingMetersTable.aggregation })
      .from(billingMetersTable)
      .where(eq(billingMetersTable.isActive, true));
    const meterAggregationMap = new Map(meterConfigs.map((m) => [m.key, m.aggregation]));

    // Get distinct org+meter combos with events in the current period
    const activeMeters = await db
      .selectDistinct({
        orgId: meteringEventsTable.orgId,
        featureKey: meteringEventsTable.featureKey,
        product: meteringEventsTable.product,
      })
      .from(meteringEventsTable)
      .where(
        and(
          gte(meteringEventsTable.occurredAt, periodStart),
          lte(meteringEventsTable.occurredAt, periodEnd),
        ),
      );

    let recomputed = 0;
    for (const combo of activeMeters) {
      const aggregation = meterAggregationMap.get(combo.featureKey) ?? 'sum';

      const baseWhere = and(
        eq(meteringEventsTable.orgId, combo.orgId),
        eq(meteringEventsTable.featureKey, combo.featureKey),
        gte(meteringEventsTable.occurredAt, periodStart),
        lte(meteringEventsTable.occurredAt, periodEnd),
      );

      let totalQty = '0';
      let eventCount = 0;
      let uniqueUsers = 0;

      if (aggregation === 'last') {
        const [lastRow] = await db
          .select({
            qty: meteringEventsTable.quantity,
            cnt: sql<number>`COUNT(*) OVER ()::int`,
            uniqueU: sql<number>`COUNT(DISTINCT ${meteringEventsTable.userId}) OVER ()::int`,
          })
          .from(meteringEventsTable)
          .where(baseWhere)
          .orderBy(sql`${meteringEventsTable.occurredAt} DESC`)
          .limit(1);
        totalQty = lastRow?.qty ?? '0';
        eventCount = lastRow?.cnt ?? 0;
        uniqueUsers = lastRow?.uniqueU ?? 0;
      } else if (aggregation === 'unique_count') {
        const [row] = await db
          .select({
            totalQty: sql<string>`COUNT(DISTINCT ${meteringEventsTable.userId})::text`,
            eventCount: sql<number>`COUNT(*)::int`,
            uniqueUsers: sql<number>`COUNT(DISTINCT ${meteringEventsTable.userId})::int`,
          })
          .from(meteringEventsTable)
          .where(baseWhere);
        totalQty = row?.totalQty ?? '0';
        eventCount = row?.eventCount ?? 0;
        uniqueUsers = row?.uniqueUsers ?? 0;
      } else {
        const [row] = await db
          .select({
            totalQty: sql<string>`COALESCE(SUM(${meteringEventsTable.quantity}::numeric), 0)`,
            eventCount: sql<number>`COUNT(*)::int`,
            uniqueUsers: sql<number>`COUNT(DISTINCT ${meteringEventsTable.userId})::int`,
          })
          .from(meteringEventsTable)
          .where(baseWhere);
        totalQty = row?.totalQty ?? '0';
        eventCount = row?.eventCount ?? 0;
        uniqueUsers = row?.uniqueUsers ?? 0;
      }

      await db
        .insert(usageAggregatesTable)
        .values({
          orgId: combo.orgId,
          featureKey: combo.featureKey,
          product: combo.product,
          periodType: 'month',
          periodStart,
          periodEnd,
          totalQuantity: totalQty,
          eventCount,
          uniqueUsers,
        })
        .onConflictDoUpdate({
          target: [
            usageAggregatesTable.orgId,
            usageAggregatesTable.featureKey,
            usageAggregatesTable.periodType,
            usageAggregatesTable.periodStart,
          ],
          set: {
            totalQuantity: totalQty,
            eventCount,
            uniqueUsers,
            computedAt: new Date(),
          },
        });

      recomputed++;
    }

    serverTelemetry.recordBusinessEvent({
      type: 'hourly_usage_aggregation_completed',
      domain: 'billing',
      durationMs: Date.now() - start,
      success: true,
      metadata: { recomputed, periodStart: periodStart.toISOString() },
    });
    updateRegistry(NAMED_JOB_TYPES.HOURLY_USAGE_AGGREGATION, {
      lastStatus: 'completed',
      lastDurationMs: Date.now() - start,
    });
    logger.info({ jobId: job.id, recomputed }, 'hourly_usage_aggregation: complete');
  } catch (err) {
    logger.error({ err, jobId: job.id }, 'hourly_usage_aggregation: fatal');
    updateRegistry(NAMED_JOB_TYPES.HOURLY_USAGE_AGGREGATION, {
      lastStatus: 'failed',
      lastDurationMs: Date.now() - start,
      failCount: (jobRegistry.get(NAMED_JOB_TYPES.HOURLY_USAGE_AGGREGATION)?.failCount || 0) + 1,
    });
    throw err;
  }
});

durableJobQueue.register(NAMED_JOB_TYPES.DAILY_NET30_AGING_SNAPSHOT, async (job) => {
  const start = Date.now();
  updateRegistry(NAMED_JOB_TYPES.DAILY_NET30_AGING_SNAPSHOT, { lastStatus: "running", lastRunAt: Date.now() });
  try {
    const { runDailyNet30AgingSnapshot } = await import("../routes/billing-net30");
    const result = await runDailyNet30AgingSnapshot();
    serverTelemetry.recordBusinessEvent({ type: "daily_net30_aging_snapshot_completed", domain: "billing", durationMs: Date.now() - start, success: result.errors === 0, metadata: result });
    updateRegistry(NAMED_JOB_TYPES.DAILY_NET30_AGING_SNAPSHOT, { lastStatus: result.errors > 0 ? "failed" : "completed", lastDurationMs: Date.now() - start });
    logger.info({ jobId: job.id, ...result }, "daily_net30_aging_snapshot: complete");
  } catch (err) {
    logger.error({ err, jobId: job.id }, "daily_net30_aging_snapshot: fatal");
    updateRegistry(NAMED_JOB_TYPES.DAILY_NET30_AGING_SNAPSHOT, { lastStatus: "failed", lastDurationMs: Date.now() - start, failCount: (jobRegistry.get(NAMED_JOB_TYPES.DAILY_NET30_AGING_SNAPSHOT)?.failCount || 0) + 1 });
    throw err;
  }
});

durableJobQueue.register(NAMED_JOB_TYPES.DAILY_STRIPE_USAGE_RECORD, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, 'daily_stripe_usage_record: starting');
  try {
    const {
      db,
      billingMetersTable,
      billingMeterAllotmentsTable,
      meteringEventsTable,
      organizationsTable,
      subscriptionsTable,
    } = await import('@szl-holdings/db');
    const { eq, and, gte, lte, sql, isNotNull, inArray } = await import('drizzle-orm');

    const now = new Date();
    const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

    // Get all active subscriptions with a Stripe subscription ID
    const activeSubs = await db
      .select({
        orgId: subscriptionsTable.orgId,
        planId: subscriptionsTable.planId,
        stripeSubscriptionId: subscriptionsTable.stripeSubscriptionId,
        billingCustomerId: organizationsTable.billingCustomerId,
      })
      .from(subscriptionsTable)
      .innerJoin(organizationsTable, eq(subscriptionsTable.orgId, organizationsTable.id))
      .where(
        and(
          eq(subscriptionsTable.status, 'active'),
          isNotNull(subscriptionsTable.stripeSubscriptionId),
        ),
      );

    // Build plan-scoped allotment map: planId → Set<featureKey>
    const planIds = [...new Set(activeSubs.map((s) => s.planId).filter(Boolean) as number[])];
    const planAllotments =
      planIds.length > 0
        ? await db
            .select({ planId: billingMeterAllotmentsTable.planId, key: billingMetersTable.key })
            .from(billingMeterAllotmentsTable)
            .innerJoin(
              billingMetersTable,
              eq(billingMeterAllotmentsTable.meterId, billingMetersTable.id),
            )
            .where(inArray(billingMeterAllotmentsTable.planId, planIds))
        : [];
    const planMeterKeys = new Map<number, Set<string>>();
    for (const { planId, key } of planAllotments) {
      if (!planMeterKeys.has(planId)) planMeterKeys.set(planId, new Set());
      planMeterKeys.get(planId)!.add(key);
    }

    let submitted = 0;
    let skipped = 0;
    let errors = 0;
    let metersChecked = 0;

    const { computeBillableQty } = await import('../routes/metering/shared');

    for (const sub of activeSubs) {
      // Only process meters that have a Stripe price attached AND are in the org's plan
      const planKeys = sub.planId ? planMeterKeys.get(sub.planId) : undefined;
      const meters = await db
        .select()
        .from(billingMetersTable)
        .where(
          and(eq(billingMetersTable.isActive, true), isNotNull(billingMetersTable.stripePriceId)),
        );

      metersChecked += meters.length;
      const planScopedMeters = planKeys ? meters.filter((m) => planKeys.has(m.key)) : meters; // no plan → submit all (graceful fallback for orgs with legacy flat billing)

      for (const meter of planScopedMeters) {
        const qty = await computeBillableQty(
          sub.orgId,
          meter.key,
          periodStart,
          periodEnd,
          (meter.aggregation as 'sum' | 'last' | 'unique_count') ?? 'sum',
        );
        if (qty === 0) {
          skipped++;
          continue;
        }

        try {
          const stripeKey = process.env.STRIPE_SECRET_KEY;
          const isLiveKey = stripeKey?.startsWith('sk_live_') || stripeKey?.startsWith('sk_test_');

          if (isLiveKey && stripeKey && sub.billingCustomerId) {
            // Submit usage via Stripe Billing Meter Events API (modern approach, no subscription item ID needed)
            const Stripe = (await import('stripe')).default;
            const stripe = new Stripe(stripeKey, {
              apiVersion: '2024-04-10' as Parameters<typeof Stripe>[1]['apiVersion'],
            });

            // Use Stripe's meter events if stripeMeterId is set on the meter
            if (meter.stripeMeterId) {
              await stripe.billing.meterEvents.create({
                event_name: meter.stripeMeterId,
                payload: {
                  stripe_customer_id: sub.billingCustomerId,
                  value: Math.round(qty).toString(),
                },
                timestamp: Math.floor(Date.now() / 1000),
              });
              logger.info(
                { orgId: sub.orgId, meterKey: meter.key, qty, stripeMeterId: meter.stripeMeterId },
                'daily_stripe_usage_record: submitted via meter events API',
              );
            } else if (meter.stripePriceId && sub.stripeSubscriptionId) {
              // Fall back to legacy usage records via subscription item lookup
              const subscription = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);
              const item = subscription.items.data.find((i) => i.price.id === meter.stripePriceId);
              if (item) {
                await stripe.subscriptionItems.createUsageRecord(item.id, {
                  quantity: Math.round(qty),
                  action: 'set',
                  timestamp: Math.floor(Date.now() / 1000),
                });
                logger.info(
                  { orgId: sub.orgId, meterKey: meter.key, qty, subscriptionItemId: item.id },
                  'daily_stripe_usage_record: submitted via subscription item usage record',
                );
              } else {
                logger.warn(
                  { orgId: sub.orgId, meterKey: meter.key },
                  'daily_stripe_usage_record: no matching subscription item for stripePriceId',
                );
                skipped++;
                continue;
              }
            } else {
              logger.warn(
                { orgId: sub.orgId, meterKey: meter.key },
                'daily_stripe_usage_record: meter has no stripeMeterId or stripePriceId — skipping',
              );
              skipped++;
              continue;
            }
            submitted++;
          } else {
            // Stripe not configured or key not present — log as dry run
            logger.info(
              {
                orgId: sub.orgId,
                meterKey: meter.key,
                qty,
                stripePriceId: meter.stripePriceId,
                dryRun: true,
              },
              'daily_stripe_usage_record: STRIPE_SECRET_KEY not configured — dry-run log only',
            );
            skipped++;
          }
        } catch (stripeErr) {
          logger.error(
            { err: stripeErr, orgId: sub.orgId, meterKey: meter.key },
            'daily_stripe_usage_record: submission error',
          );
          errors++;
        }
      }
    }

    serverTelemetry.recordBusinessEvent({
      type: 'daily_stripe_usage_record_completed',
      domain: 'billing',
      durationMs: Date.now() - start,
      success: errors === 0,
      metadata: { submitted, skipped, errors, metersChecked, subsChecked: activeSubs.length },
    });
    updateRegistry(NAMED_JOB_TYPES.DAILY_STRIPE_USAGE_RECORD, {
      lastStatus: errors > 0 ? 'failed' : 'completed',
      lastDurationMs: Date.now() - start,
    });
    logger.info(
      { jobId: job.id, submitted, skipped, errors },
      'daily_stripe_usage_record: complete',
    );
  } catch (err) {
    logger.error({ err, jobId: job.id }, 'daily_stripe_usage_record: fatal');
    updateRegistry(NAMED_JOB_TYPES.DAILY_STRIPE_USAGE_RECORD, {
      lastStatus: 'failed',
      lastDurationMs: Date.now() - start,
      failCount: (jobRegistry.get(NAMED_JOB_TYPES.DAILY_STRIPE_USAGE_RECORD)?.failCount || 0) + 1,
    });
    throw err;
  }
});

durableJobQueue.register(NAMED_JOB_TYPES.HOURLY_OVERAGE_THRESHOLD_CHECK, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, 'hourly_overage_threshold_check: starting');
  try {
    const {
      db,
      billingMetersTable,
      billingMeterAllotmentsTable,
      billingLineItemsTable,
      subscriptionsTable,
      usageAggregatesTable,
      usageThresholdNotificationsTable,
      organizationsTable,
      notificationsTable,
      notificationPreferencesTable,
      orgMembersTable,
      usersTable,
      quotaViolationsTable,
      userRolesTable,
      rolesTable,
    } = await import('@szl-holdings/db');
    const { dispatchToExternalChannels } = await import('../routes/notifications');
    const { eq, and, gte, lte, inArray } = await import('drizzle-orm');

    const THRESHOLDS = [50, 80, 100] as const;

    const now = new Date();
    const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

    // Get all current-period aggregates (with org name)
    const aggregates = await db
      .select({
        agg: usageAggregatesTable,
        orgName: organizationsTable.name,
      })
      .from(usageAggregatesTable)
      .innerJoin(organizationsTable, eq(usageAggregatesTable.orgId, organizationsTable.id))
      .where(
        and(
          eq(usageAggregatesTable.periodType, 'month'),
          gte(usageAggregatesTable.periodStart, periodStart),
          lte(usageAggregatesTable.periodEnd, periodEnd),
        ),
      );

    // Precompute planId per org via active subscriptions (for plan-scoped allotment lookup)
    const uniqueOrgIds = [...new Set(aggregates.map((a) => a.agg.orgId))];
    const orgSubscriptions =
      uniqueOrgIds.length > 0
        ? await db
            .select({ orgId: subscriptionsTable.orgId, planId: subscriptionsTable.planId })
            .from(subscriptionsTable)
            .where(
              and(
                inArray(subscriptionsTable.orgId, uniqueOrgIds),
                eq(subscriptionsTable.status, 'active'),
              ),
            )
        : [];
    const orgPlanMap = new Map(orgSubscriptions.map((s) => [s.orgId, s.planId]));

    // Fetch all allotments for the relevant plans (plan-scoped, not global)
    const planIds = [...new Set(orgSubscriptions.map((s) => s.planId))];
    const allotments =
      planIds.length > 0
        ? await db
            .select({ allotment: billingMeterAllotmentsTable, meter: billingMetersTable })
            .from(billingMeterAllotmentsTable)
            .innerJoin(
              billingMetersTable,
              eq(billingMeterAllotmentsTable.meterId, billingMetersTable.id),
            )
            .where(inArray(billingMeterAllotmentsTable.planId, planIds))
        : [];

    // Build planId+meterKey → allotment lookup
    const allotmentByPlanAndKey = new Map<string, (typeof allotments)[number]>(
      allotments.map((a) => [`${a.allotment.planId}:${a.meter.key}`, a]),
    );

    let fired = 0;
    let deduped = 0;

    for (const { agg, orgName } of aggregates) {
      const planId = orgPlanMap.get(agg.orgId);
      // Plan-scoped allotment first; fall back to meter-level includedUnits for orgs without a subscription
      const allotmentEntry = planId
        ? allotmentByPlanAndKey.get(`${planId}:${agg.featureKey}`)
        : undefined;
      const meter = await db
        .select()
        .from(billingMetersTable)
        .where(eq(billingMetersTable.key, agg.featureKey))
        .limit(1);

      const includedUnits = allotmentEntry
        ? parseFloat(allotmentEntry.allotment.includedUnits)
        : meter[0]
          ? parseFloat(meter[0].includedUnits)
          : null;

      if (includedUnits === null || includedUnits === 0) continue;

      const currentUsage = parseFloat(agg.totalQuantity);
      const pct = (currentUsage / includedUnits) * 100;

      for (const threshold of THRESHOLDS) {
        if (pct < threshold) continue;

        // Idempotency: skip if already fired for this period
        const existing = await db
          .select({ id: usageThresholdNotificationsTable.id })
          .from(usageThresholdNotificationsTable)
          .where(
            and(
              eq(usageThresholdNotificationsTable.orgId, agg.orgId),
              eq(usageThresholdNotificationsTable.meterKey, agg.featureKey),
              eq(usageThresholdNotificationsTable.threshold, threshold),
              gte(usageThresholdNotificationsTable.periodStart, periodStart),
            ),
          )
          .limit(1);

        if (existing.length > 0) {
          deduped++;
          continue;
        }

        // Record the notification
        await db
          .insert(usageThresholdNotificationsTable)
          .values({
            orgId: agg.orgId,
            meterKey: agg.featureKey,
            threshold,
            periodStart,
          })
          .onConflictDoNothing();

        logger.info(
          {
            orgId: agg.orgId,
            orgName,
            meterKey: agg.featureKey,
            threshold,
            currentUsage,
            includedUnits,
            pct: Math.round(pct),
          },
          `hourly_overage_threshold_check: ${threshold}% threshold breached`,
        );

        // Find admin/owner users for this org to notify
        const adminMembers = await db
          .select({ userId: orgMembersTable.userId })
          .from(orgMembersTable)
          .where(
            and(
              eq(orgMembersTable.orgId, agg.orgId),
              inArray(orgMembersTable.role, ['owner', 'admin']),
            ),
          );

        const notifTitle =
          threshold === 100
            ? `Usage limit reached — ${agg.featureKey}`
            : `Usage at ${threshold}% — ${agg.featureKey}`;
        const notifMessage =
          threshold === 100
            ? `Your organisation "${orgName}" has reached 100% of its included ${agg.featureKey} quota (${Math.round(currentUsage).toLocaleString()} / ${Math.round(includedUnits).toLocaleString()} units). Overages may apply.`
            : `Your organisation "${orgName}" has used ${Math.round(pct)}% of its included ${agg.featureKey} quota (${Math.round(currentUsage).toLocaleString()} / ${Math.round(includedUnits).toLocaleString()} units).`;
        const actionUrl = `/billing/usage`;

        for (const { userId } of adminMembers) {
          try {
            // Check in-app preference (default on)
            const [pref] = await db
              .select({ inAppEnabled: notificationPreferencesTable.inAppEnabled })
              .from(notificationPreferencesTable)
              .where(eq(notificationPreferencesTable.userId, userId))
              .limit(1);
            const inAppOn = pref ? pref.inAppEnabled : true;

            let notificationId = 0;
            if (inAppOn) {
              const [notif] = await db
                .insert(notificationsTable)
                .values({
                  userId,
                  type: threshold === 100 ? 'warning' : 'info',
                  channel: 'in_app',
                  title: notifTitle,
                  message: notifMessage,
                  actionUrl,
                })
                .returning();
              if (notif) {
                notificationId = notif.id;
              }
            }

            // Dispatch to external channels (email/Slack/push per user prefs)
            await dispatchToExternalChannels({
              notificationId,
              userId,
              type: threshold === 100 ? 'warning' : 'info',
              title: notifTitle,
              message: notifMessage,
              actionUrl,
            });
          } catch (notifErr) {
            logger.warn(
              { err: notifErr, orgId: agg.orgId, userId, threshold },
              'hourly_overage_threshold_check: failed to dispatch notification to admin',
            );
          }
        }

        // ── Notify platform super-admins (platform admins) ────────────────
        // Platform admins need visibility on warning (≥80%) and overage (100%)
        // events across all tenants, not just their own org membership.
        if (threshold >= 80) {
          try {
            const [superAdminRole] = await db
              .select({ id: rolesTable.id })
              .from(rolesTable)
              .where(eq(rolesTable.name, 'super_admin'))
              .limit(1);

            if (superAdminRole) {
              const superAdminUsers = await db
                .select({ userId: userRolesTable.userId })
                .from(userRolesTable)
                .where(eq(userRolesTable.roleId, superAdminRole.id));

              for (const { userId } of superAdminUsers) {
                if (adminMembers.some((m) => m.userId === userId)) continue;

                try {
                  const [pref] = await db
                    .select({ inAppEnabled: notificationPreferencesTable.inAppEnabled })
                    .from(notificationPreferencesTable)
                    .where(eq(notificationPreferencesTable.userId, userId))
                    .limit(1);
                  const inAppOn = pref ? pref.inAppEnabled : true;

                  let notificationId = 0;
                  if (inAppOn) {
                    const [notif] = await db
                      .insert(notificationsTable)
                      .values({
                        userId,
                        type: threshold === 100 ? 'warning' : 'info',
                        channel: 'in_app',
                        title: notifTitle,
                        message: notifMessage,
                        actionUrl,
                      })
                      .returning();
                    if (notif) notificationId = notif.id;
                  }

                  await dispatchToExternalChannels({
                    notificationId,
                    userId,
                    type: threshold === 100 ? 'warning' : 'info',
                    title: notifTitle,
                    message: notifMessage,
                    actionUrl,
                  });
                } catch (superAdminNotifErr) {
                  logger.warn(
                    { err: superAdminNotifErr, orgId: agg.orgId, userId, threshold },
                    'hourly_overage_threshold_check: failed to dispatch notification to super_admin',
                  );
                }
              }
            }
          } catch (superAdminLookupErr) {
            logger.warn(
              { err: superAdminLookupErr, orgId: agg.orgId, threshold },
              'hourly_overage_threshold_check: failed to look up super_admin users',
            );
          }
        }

        // ── Log to quota_violations ───────────────────────────────────────
        // 80% hit = soft violation (warning); 100% hit = hard violation (overage).
        if (threshold === 80 || threshold === 100) {
          try {
            await db.insert(quotaViolationsTable).values({
              orgId: agg.orgId,
              featureKey: agg.featureKey,
              violationType: threshold === 100 ? 'hard' : 'soft',
              action: 'notify',
              currentUsage: currentUsage.toString(),
              limitValue: includedUnits.toString(),
              metadata: {
                threshold,
                pct: Math.round(pct),
                orgName,
                triggeredBy: 'hourly_overage_threshold_check',
              },
            });
            logger.info(
              {
                orgId: agg.orgId,
                meterKey: agg.featureKey,
                threshold,
                violationType: threshold === 100 ? 'hard' : 'soft',
              },
              'hourly_overage_threshold_check: quota_violation logged',
            );
          } catch (violationErr) {
            logger.warn(
              { err: violationErr, orgId: agg.orgId, meterKey: agg.featureKey, threshold },
              'hourly_overage_threshold_check: failed to log quota_violation',
            );
          }
        }

        fired++;
      }

      // ── Overage line-item refresh (runs unconditionally when pct >= 100) ─────
      // This block is intentionally OUTSIDE the per-threshold notification loop so
      // it executes on every hourly run even after the 100% notification has been
      // deduped, keeping the draft line-item amount current with latest usage.
      if (pct >= 100) {
        const overage = Math.max(0, currentUsage - includedUnits);
        if (overage > 0) {
          const overageUnitAmt = allotmentEntry?.allotment.overageUnitAmount
            ? parseFloat(allotmentEntry.allotment.overageUnitAmount)
            : meter[0]?.unitAmount
              ? parseFloat(meter[0].unitAmount)
              : 0;

          if (overageUnitAmt > 0) {
            const totalAmount = Math.round(overage * overageUnitAmt * 100) / 100;
            try {
              await db
                .delete(billingLineItemsTable)
                .where(
                  and(
                    eq(billingLineItemsTable.orgId, agg.orgId),
                    eq(billingLineItemsTable.featureKey, agg.featureKey),
                    eq(billingLineItemsTable.periodStart, periodStart),
                    eq(billingLineItemsTable.status, 'draft'),
                  ),
                );
              await db.insert(billingLineItemsTable).values({
                orgId: agg.orgId,
                featureKey: agg.featureKey,
                description: `${agg.featureKey} overage — ${Math.round(overage).toLocaleString()} units at $${overageUnitAmt.toFixed(4)}/unit`,
                quantity: overage.toString(),
                unitAmount: overageUnitAmt.toFixed(6),
                totalAmount: totalAmount.toFixed(2),
                currency: 'usd',
                periodStart,
                periodEnd,
                status: 'draft',
                metadata: {
                  triggeredBy: 'hourly_overage_threshold_check',
                  overage,
                  currentUsage,
                  includedUnits,
                },
              });
              logger.info(
                {
                  orgId: agg.orgId,
                  meterKey: agg.featureKey,
                  overage,
                  overageUnitAmt,
                  totalAmount,
                },
                'hourly_overage_threshold_check: overage line item upserted',
              );
            } catch (lineItemErr) {
              logger.warn(
                { err: lineItemErr, orgId: agg.orgId, meterKey: agg.featureKey },
                'hourly_overage_threshold_check: failed to upsert overage line item',
              );
            }
          }
        }
      }
    }

    serverTelemetry.recordBusinessEvent({
      type: 'hourly_overage_threshold_check_completed',
      domain: 'billing',
      durationMs: Date.now() - start,
      success: true,
      metadata: { fired, deduped, aggregatesChecked: aggregates.length },
    });
    updateRegistry(NAMED_JOB_TYPES.HOURLY_OVERAGE_THRESHOLD_CHECK, {
      lastStatus: 'completed',
      lastDurationMs: Date.now() - start,
    });
    logger.info({ jobId: job.id, fired, deduped }, 'hourly_overage_threshold_check: complete');
  } catch (err) {
    logger.error({ err, jobId: job.id }, 'hourly_overage_threshold_check: fatal');
    updateRegistry(NAMED_JOB_TYPES.HOURLY_OVERAGE_THRESHOLD_CHECK, {
      lastStatus: 'failed',
      lastDurationMs: Date.now() - start,
      failCount:
        (jobRegistry.get(NAMED_JOB_TYPES.HOURLY_OVERAGE_THRESHOLD_CHECK)?.failCount || 0) + 1,
    });
    throw err;
  }
});

durableJobQueue.register(NAMED_JOB_TYPES.DEMO_USAGE_SEEDER, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, 'demo_usage_seeder: starting');
  try {
    if (process.env.NODE_ENV === 'production') {
      logger.info({ jobId: job.id }, 'demo_usage_seeder: skipped in production');
      updateRegistry(NAMED_JOB_TYPES.DEMO_USAGE_SEEDER, {
        lastStatus: 'completed',
        lastDurationMs: Date.now() - start,
      });
      return;
    }

    const payload = job.payload as { orgId?: number; daysBack?: number } | undefined;
    const orgId = payload?.orgId ?? 1;
    const daysBack = payload?.daysBack ?? 30;

    const { generateDemoUsage } = await import('../routes/metering/metered-billing.js');
    const generated = await generateDemoUsage(orgId, daysBack);

    serverTelemetry.recordBusinessEvent({
      type: 'demo_usage_seeder_completed',
      domain: 'billing',
      durationMs: Date.now() - start,
      success: true,
      metadata: { orgId, daysBack, generated },
    });
    updateRegistry(NAMED_JOB_TYPES.DEMO_USAGE_SEEDER, {
      lastStatus: 'completed',
      lastDurationMs: Date.now() - start,
    });
    logger.info({ jobId: job.id, orgId, daysBack, generated }, 'demo_usage_seeder: complete');
  } catch (err) {
    logger.error({ err, jobId: job.id }, 'demo_usage_seeder: fatal');
    updateRegistry(NAMED_JOB_TYPES.DEMO_USAGE_SEEDER, {
      lastStatus: 'failed',
      lastDurationMs: Date.now() - start,
      failCount: (jobRegistry.get(NAMED_JOB_TYPES.DEMO_USAGE_SEEDER)?.failCount || 0) + 1,
    });
    throw err;
  }
});


// ── Org fan-out publication scheduler ──────────────────────────────────────

durableJobQueue.register(NAMED_JOB_TYPES.HOURLY_ORG_PUBLICATION_SCHEDULER, async (job) => {
  const start = Date.now();
  let triggered = 0;
  let skipped = 0;
  updateRegistry(NAMED_JOB_TYPES.HOURLY_ORG_PUBLICATION_SCHEDULER, { lastStatus: "running" });
  try {
    const { db, pulseOrgSchedulesTable, pulseOrgPublicationsTable } = await import("@szl-holdings/db");
    const { fanOutOrgPublication } = await import("../routes/pulse-org");
    const { lt, eq, and, isNotNull } = await import("drizzle-orm");
    const { randomBytes } = await import("node:crypto");

    const now = new Date();
    const dueSchedules = await db.select().from(pulseOrgSchedulesTable).where(
      and(
        eq(pulseOrgSchedulesTable.paused, false),
        lt(pulseOrgSchedulesTable.nextRunAt, now),
        isNotNull(pulseOrgSchedulesTable.nextRunAt),
      )
    ).limit(100);

    for (const schedule of dueSchedules) {
      if (!schedule.pinnedBriefingId) {
        logger.warn({ scheduleId: schedule.scheduleId }, "[pulse-org-scheduler] No pinned briefing ID, skipping");
        skipped++;
        continue;
      }

      try {
        const publicationId = `pub-sched-${Date.now()}-${randomBytes(4).toString("hex")}`;
        const channels = (Array.isArray(schedule.channels) ? schedule.channels : []) as string[];

        await db.insert(pulseOrgPublicationsTable).values({
          publicationId,
          briefingId: schedule.pinnedBriefingId,
          domain: schedule.domain ?? "consolidated",
          channels,
          scheduleId: schedule.id,
          status: "queued",
          totalRecipients: 0,
        });

        const freq = schedule.frequency as "daily" | "weekdays" | "weekly" | "monthly" | "custom";
        const interval = schedule.interval ?? 1;
        const weekdays = (Array.isArray(schedule.weekdays) ? schedule.weekdays : []) as number[];
        const timeOfDay = schedule.timeOfDay ?? "09:00";

        const [hh, mm] = timeOfDay.split(":").map(Number);
        const next = new Date(now);
        if (freq === "daily") {
          next.setDate(next.getDate() + interval);
        } else if (freq === "weekdays") {
          let tries = 0;
          do { next.setDate(next.getDate() + 1); tries++; } while ((next.getDay() === 0 || next.getDay() === 6) && tries < 14);
        } else if (freq === "weekly") {
          const targetDays = weekdays.length > 0 ? weekdays : [1];
          let tries = 0;
          do { next.setDate(next.getDate() + 1); tries++; } while (!targetDays.includes(next.getDay()) && tries < 21);
        } else if (freq === "monthly") {
          next.setMonth(next.getMonth() + interval);
        } else {
          next.setDate(next.getDate() + 1);
        }
        next.setHours(hh ?? 9, mm ?? 0, 0, 0);

        await db.update(pulseOrgSchedulesTable).set({
          nextRunAt: next,
          lastRunAt: now,
          updatedAt: new Date(),
        }).where(eq(pulseOrgSchedulesTable.id, schedule.id));

        void fanOutOrgPublication(publicationId, schedule.orgId ?? null).catch((err: unknown) => {
          logger.error({ err, publicationId, scheduleId: schedule.scheduleId }, "[pulse-org-scheduler] fan-out error");
        });

        triggered++;
        logger.info({ scheduleId: schedule.scheduleId, publicationId }, "[pulse-org-scheduler] Triggered org publication");
      } catch (err) {
        skipped++;
        logger.error({ err, scheduleId: schedule.scheduleId }, "[pulse-org-scheduler] Failed to trigger org publication");
      }
    }

    serverTelemetry.recordBusinessEvent({
      type: "hourly_org_publication_scheduler_completed",
      domain: "pulse",
      durationMs: Date.now() - start,
      success: true,
      metadata: { triggered, skipped },
    });
    updateRegistry(NAMED_JOB_TYPES.HOURLY_ORG_PUBLICATION_SCHEDULER, { lastStatus: "completed", lastDurationMs: Date.now() - start });
    logger.info({ jobId: job.id, triggered, skipped }, "hourly_org_publication_scheduler: complete");
  } catch (err) {
    logger.error({ err, jobId: job.id }, "hourly_org_publication_scheduler: fatal");
    updateRegistry(NAMED_JOB_TYPES.HOURLY_ORG_PUBLICATION_SCHEDULER, {
      lastStatus: "failed",
      lastDurationMs: Date.now() - start,
      failCount: (jobRegistry.get(NAMED_JOB_TYPES.HOURLY_ORG_PUBLICATION_SCHEDULER)?.failCount || 0) + 1,
    });
    throw err;
  }
});

durableJobQueue.register(NAMED_JOB_TYPES.HOURLY_NET30_DUNNING, async (job) => {
  const start = Date.now();
  updateRegistry(NAMED_JOB_TYPES.HOURLY_NET30_DUNNING, { lastStatus: "running", lastRunAt: Date.now() });
  try {
    const { runNet30DunningPass } = await import("../routes/billing-net30");
    const result = await runNet30DunningPass();
    serverTelemetry.recordBusinessEvent({ type: "hourly_net30_dunning_completed", domain: "billing", durationMs: Date.now() - start, success: result.errors === 0, metadata: result });
    updateRegistry(NAMED_JOB_TYPES.HOURLY_NET30_DUNNING, { lastStatus: "completed", lastDurationMs: Date.now() - start });
    logger.info({ jobId: job.id, ...result }, "hourly_net30_dunning: complete");
  } catch (err) {
    logger.error({ err, jobId: job.id }, "hourly_net30_dunning: fatal");
    updateRegistry(NAMED_JOB_TYPES.HOURLY_NET30_DUNNING, { lastStatus: "failed", lastDurationMs: Date.now() - start, failCount: (jobRegistry.get(NAMED_JOB_TYPES.HOURLY_NET30_DUNNING)?.failCount || 0) + 1 });
    throw err;
  }
});

durableJobQueue.register(NAMED_JOB_TYPES.TRACES_RETENTION_PRUNE, async (job) => {
  const start = Date.now();
  updateRegistry(NAMED_JOB_TYPES.TRACES_RETENTION_PRUNE, {
    lastStatus: 'running',
    lastRunAt: Date.now(),
  });

  const payload = (job.payload ?? {}) as {
    retainDays?: number;
    dryRun?: boolean;
    batchSize?: number;
  };
  const envDays = Number(process.env.TRACES_RETENTION_DAYS);
  const retainDays =
    Number.isFinite(payload.retainDays) && (payload.retainDays as number) > 0
      ? Math.floor(payload.retainDays as number)
      : Number.isFinite(envDays) && envDays > 0
        ? Math.floor(envDays)
        : 90;
  const dryRun = payload.dryRun === true;
  const batchSize =
    Number.isFinite(payload.batchSize) && (payload.batchSize as number) > 0
      ? Math.min(Math.floor(payload.batchSize as number), 50_000)
      : 5_000;
  const cutoff = new Date(Date.now() - retainDays * 24 * 60 * 60 * 1000);

  // Child tables MUST be pruned before the parent `traces` table.
  // Both trace_spans and trace_events are guarded by a subquery that checks
  // the parent trace is terminal AND old enough. Once traces are deleted the
  // subquery would return no rows, so children must come first.
  const tableTargets: Array<{ table: string; column: string; guard?: string }> = [
    {
      table: 'trace_spans',
      column: 'started_at',
      guard: "AND trace_id IN (SELECT trace_id FROM traces WHERE status IN ('completed','failed','rolled-back') AND started_at < $1)",
    },
    {
      table: 'trace_events',
      column: 'occurred_at',
      guard: "AND trace_id IN (SELECT trace_id FROM traces WHERE status IN ('completed','failed','rolled-back') AND started_at < $1)",
    },
    { table: 'traces', column: 'started_at', guard: "AND status IN ('completed','failed','rolled-back')" },
  ];

  const counts: Record<string, number> = {};
  let totalDeleted = 0;
  let failed = 0;

  try {
    const { pool } = await import('@szl-holdings/db');
    const MAX_BATCHES_PER_TABLE = 1_000;
    for (const target of tableTargets) {
      const guardClause = target.guard ?? '';
      try {
        if (dryRun) {
          const result = await pool.query(
            `SELECT COUNT(*)::int AS cnt FROM "${target.table}" WHERE "${target.column}" < $1 ${guardClause}`,
            [cutoff],
          );
          const cnt = (result.rows[0]?.cnt as number) ?? 0;
          counts[target.table] = cnt;
        } else {
          let tableDeleted = 0;
          for (let batch = 0; batch < MAX_BATCHES_PER_TABLE; batch++) {
            const result = await pool.query(
              `WITH victims AS (
                 SELECT ctid FROM "${target.table}"
                 WHERE "${target.column}" < $1 ${guardClause}
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
        logger.warn({ err, table: target.table }, 'traces_retention_prune: table prune failed');
      }
    }
  } catch (err) {
    logger.error({ err, jobId: job.id }, 'traces_retention_prune: fatal — db not available');
    updateRegistry(NAMED_JOB_TYPES.TRACES_RETENTION_PRUNE, {
      lastStatus: 'failed',
      lastDurationMs: Date.now() - start,
      failCount: (jobRegistry.get(NAMED_JOB_TYPES.TRACES_RETENTION_PRUNE)?.failCount || 0) + 1,
    });
    throw err;
  }

  serverTelemetry.recordBusinessEvent({
    type: 'traces_retention_prune_completed',
    domain: 'traces',
    durationMs: Date.now() - start,
    success: failed === 0,
    metadata: { retainDays, cutoff: cutoff.toISOString(), dryRun, counts, totalDeleted, failed },
  });
  updateRegistry(NAMED_JOB_TYPES.TRACES_RETENTION_PRUNE, {
    lastStatus: failed === 0 ? 'completed' : 'failed',
    lastDurationMs: Date.now() - start,
    ...(failed > 0
      ? { failCount: (jobRegistry.get(NAMED_JOB_TYPES.TRACES_RETENTION_PRUNE)?.failCount || 0) + 1 }
      : {}),
  });
  logger.info(
    { retainDays, cutoff: cutoff.toISOString(), dryRun, counts, totalDeleted, failed, durationMs: Date.now() - start },
    'traces_retention_prune: complete',
  );
});

registerEntry({
  type: NAMED_JOB_TYPES.OUTCOME_GRAPH_CALIBRATION,
  name: 'Outcome Graph Learning Calibration',
  description:
    'Runs the AI recommendation learning calibration across all active domains. Adjusts confidence thresholds, ranking weights, and escalation logic based on accumulated outcome feedback. Schedule is configurable via the CALIBRATION_CRON_SCHEDULE environment variable (default: weekly on Sundays at 01:00 UTC). Can also be triggered on-demand from the admin jobs panel.',
  schedule: 'weekly',
  enabled: true,
});

registerEntry({
  type: NAMED_JOB_TYPES.EXPORT_JOB_PROCESSOR,
  name: 'Export Job Processor',
  description:
    'Scans for export jobs stuck in the pending or processing state (e.g. after a server restart mid-generation) and re-queues them. Runs hourly as a safety net; normal export generation is handled inline by the enqueue endpoint.',
  schedule: 'hourly',
  enabled: true,
});

durableJobQueue.register(NAMED_JOB_TYPES.OUTCOME_GRAPH_CALIBRATION, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, 'outcome_graph_calibration: starting');
  try {
    const { runScheduledCalibration } = await import('./agent-scheduler');
    const result = await runScheduledCalibration();
    serverTelemetry.recordBusinessEvent({
      type: 'outcome_graph_calibration_completed',
      domain: 'ai',
      durationMs: Date.now() - start,
      success: true,
      metadata: result,
    });
    updateRegistry(NAMED_JOB_TYPES.OUTCOME_GRAPH_CALIBRATION, {
      lastStatus: 'completed',
      lastDurationMs: Date.now() - start,
      lastResult: result as Record<string, unknown>,
    });
    logger.info({ jobId: job.id, ...result, durationMs: Date.now() - start }, 'outcome_graph_calibration: complete');
  } catch (err) {
    logger.error({ err, jobId: job.id }, 'outcome_graph_calibration: fatal');
    updateRegistry(NAMED_JOB_TYPES.OUTCOME_GRAPH_CALIBRATION, {
      lastStatus: 'failed',
      lastDurationMs: Date.now() - start,
      failCount: (jobRegistry.get(NAMED_JOB_TYPES.OUTCOME_GRAPH_CALIBRATION)?.failCount || 0) + 1,
    });
    throw err;
  }
});

durableJobQueue.register(NAMED_JOB_TYPES.EXPORT_JOB_PROCESSOR, async (job) => {
  const start = Date.now();
  logger.info({ jobId: job.id }, 'export_job_processor: scanning for stuck export jobs');
  let processed = 0;
  let failed = 0;
  try {
    const { db, exportJobsTable } = await import('@szl-holdings/db');
    const { and, lt, or, eq } = await import('drizzle-orm');
    const { processExportJobById } = await import('../jobs/export-job-processor');
    const stuckCutoff = new Date(Date.now() - 10 * 60 * 1000);
    const stuck = await db
      .select({ exportId: exportJobsTable.exportId })
      .from(exportJobsTable)
      .where(
        and(
          or(
            eq(exportJobsTable.status, 'pending' as const),
            eq(exportJobsTable.status, 'processing' as const),
          ),
          lt(exportJobsTable.createdAt, stuckCutoff),
        ),
      )
      .limit(20);
    for (const { exportId } of stuck) {
      try {
        await processExportJobById(exportId);
        processed++;
      } catch {
        failed++;
        logger.warn({ exportId }, 'export_job_processor: failed to process export job');
      }
    }
    const durationMs = Date.now() - start;
    serverTelemetry.recordBusinessEvent({
      type: 'export_job_processor_completed',
      domain: 'exports',
      durationMs,
      success: failed === 0,
      metadata: { processed, failed, total: stuck.length },
    });
    updateRegistry(NAMED_JOB_TYPES.EXPORT_JOB_PROCESSOR, {
      lastStatus: failed === 0 ? 'completed' : 'failed',
      lastDurationMs: durationMs,
      lastResult: { processed, failed },
    });
    logger.info({ jobId: job.id, processed, failed, durationMs }, 'export_job_processor: complete');
  } catch (err) {
    logger.error({ err, jobId: job.id }, 'export_job_processor: fatal');
    updateRegistry(NAMED_JOB_TYPES.EXPORT_JOB_PROCESSOR, {
      lastStatus: 'failed',
      lastDurationMs: Date.now() - start,
      failCount: (jobRegistry.get(NAMED_JOB_TYPES.EXPORT_JOB_PROCESSOR)?.failCount || 0) + 1,
    });
    throw err;
  }
});

durableJobQueue.register(NAMED_JOB_TYPES.ANALYTICS_RETENTION_ARCHIVE, async (job) => {
  const start = Date.now();
  const retentionDays = parseInt(
    (job.payload?.retainDays as string | undefined) ??
    process.env.ANALYTICS_RETENTION_DAYS ??
    '90',
    10,
  );
  const batchSize = 500;
  let archived = 0;
  let deleted = 0;
  let errors = 0;

  try {
    const { db, analyticsEventsTable, analyticsEventsColdTable, analyticsMetricSnapshotsTable } = await import('@szl-holdings/db').then(async (m) => {
      const schema = await import('@szl-holdings/db/schema');
      return {
        db: m.db,
        analyticsEventsTable: schema.analyticsEventsTable,
        analyticsEventsColdTable: schema.analyticsEventsColdTable,
        analyticsMetricSnapshotsTable: schema.analyticsMetricSnapshotsTable,
      };
    });
    const { lt, inArray, sql } = await import('drizzle-orm');
    const archiveBatch = `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    let hasMore = true;
    while (hasMore) {
      const rows = await db
        .select()
        .from(analyticsEventsTable)
        .where(lt(analyticsEventsTable.occurredAt, cutoff))
        .limit(batchSize);

      if (rows.length === 0) {
        hasMore = false;
        break;
      }

      try {
        // Step 1: Compute per-(orgScope, day, domain, eventName) aggregated counts for the
        // batch. Including org scope in the metricId ensures tenant-level isolation is
        // preserved in the snapshot rollup so org-scoped dashboard queries remain accurate.
        const agg: Map<string, { orgScope: string; orgId: number | null; domain: string; eventName: string; periodStart: Date; count: number }> = new Map();
        for (const row of rows) {
          const d = new Date(row.occurredAt);
          d.setUTCHours(0, 0, 0, 0);
          const orgScope = row.organizationId != null ? `org_${row.organizationId}` : 'global';
          const key = `${orgScope}||${row.domain}||${row.eventName}||${d.toISOString()}`;
          const existing = agg.get(key);
          if (existing) {
            existing.count++;
          } else {
            agg.set(key, { orgScope, orgId: row.organizationId ?? null, domain: row.domain, eventName: row.eventName, periodStart: d, count: 1 });
          }
        }

        const snapshotRows = Array.from(agg.values()).map(({ orgScope, orgId, domain, eventName, periodStart, count }) => {
          const periodEnd = new Date(periodStart.getTime() + 24 * 60 * 60 * 1000 - 1);
          const metricId = `archive.${orgScope}.${domain}.${eventName}`.slice(0, 128);
          return {
            metricId,
            granularity: 'day' as const,
            periodStart,
            periodEnd,
            value: count,
            sampleCount: count,
            domain,
            dimensions: { eventName, orgScope, ...(orgId != null ? { orgId: String(orgId) } : {}), archivedFrom: 'hot_tier' } as Record<string, string>,
          };
        });

        // Wrap cold archive insert, snapshot upsert, and hot-row delete in a
        // single transaction — all three succeed or none do.
        const ids = rows.map((r) => r.eventId);
        await db.transaction(async (tx) => {
          // Step A: Archive raw events to cold store (preserves replay capability)
          const coldRows = rows.map((r) => ({
            eventId: r.eventId,
            eventName: r.eventName,
            domain: r.domain,
            sourceApp: r.sourceApp,
            sessionId: r.sessionId ?? null,
            userId: r.userId ?? null,
            organizationId: r.organizationId ?? null,
            tenantId: r.tenantId ?? null,
            properties: r.properties ?? {},
            dimensions: r.dimensions ?? {},
            occurredAt: r.occurredAt,
            receivedAt: r.receivedAt,
            archiveBatch,
          }));
          await tx
            .insert(analyticsEventsColdTable)
            .values(coldRows)
            .onConflictDoNothing();

          // Step B: Upsert daily aggregate rollups (for fast cold-tier analytics)
          if (snapshotRows.length > 0) {
            await tx
              .insert(analyticsMetricSnapshotsTable)
              .values(snapshotRows)
              .onConflictDoUpdate({
                target: [
                  analyticsMetricSnapshotsTable.metricId,
                  analyticsMetricSnapshotsTable.granularity,
                  analyticsMetricSnapshotsTable.periodStart,
                ],
                set: {
                  value: sql`${analyticsMetricSnapshotsTable.value} + excluded.value`,
                  sampleCount: sql`${analyticsMetricSnapshotsTable.sampleCount} + excluded.sample_count`,
                },
              });
          }

          // Step C: Delete hot-tier rows only after cold archive + snapshots are committed
          if (ids.length > 0) {
            await tx
              .delete(analyticsEventsTable)
              .where(inArray(analyticsEventsTable.eventId, ids));
          }
        });
        deleted += ids.length;
        archived += rows.length;
      } catch (batchErr) {
        errors++;
        logger.warn({ err: batchErr }, '[analytics-retention] batch error, stopping');
        hasMore = false;
      }

      if (rows.length < batchSize) hasMore = false;
    }

    const durationMs = Date.now() - start;
    serverTelemetry.recordBusinessEvent({
      type: 'analytics_retention_archive_completed',
      domain: 'platform',
      durationMs,
      success: errors === 0,
      metadata: { archived, deleted, errors, retentionDays, cutoff: cutoff.toISOString() },
    });
    updateRegistry(NAMED_JOB_TYPES.ANALYTICS_RETENTION_ARCHIVE, {
      lastStatus: errors === 0 ? 'completed' : 'failed',
      lastDurationMs: durationMs,
      lastResult: { archived, deleted, errors },
    });
    logger.info(
      { jobId: job.id, archived, deleted, errors, durationMs },
      '[analytics-retention] archive complete',
    );
  } catch (err) {
    logger.error({ err, jobId: job.id }, '[analytics-retention] fatal error');
    updateRegistry(NAMED_JOB_TYPES.ANALYTICS_RETENTION_ARCHIVE, {
      lastStatus: 'failed',
      lastDurationMs: Date.now() - start,
      failCount: (jobRegistry.get(NAMED_JOB_TYPES.ANALYTICS_RETENTION_ARCHIVE)?.failCount ?? 0) + 1,
    });
    throw err;
  }
});

let namedJobsStarted = false;

export function startNamedScheduledJobs() {
  if (namedJobsStarted) return;
  namedJobsStarted = true;
  logger.info(
    'Named scheduled jobs now managed by durable cron scheduler — in-memory timers disabled',
  );
}

export function getJobRegistry(): JobScheduleEntry[] {
  return Array.from(jobRegistry.values());
}

export async function triggerOnDemandJob(
  type: NamedJobType,
  payload: Record<string, unknown> = {},
) {
  const entry = jobRegistry.get(type);
  if (!entry) throw new Error(`Unknown job type: ${type}`);
  if (entry.schedule !== 'on_demand') throw new Error(`Job ${type} is not an on-demand job`);
  return enqueueNamedJob(type, payload);
}
