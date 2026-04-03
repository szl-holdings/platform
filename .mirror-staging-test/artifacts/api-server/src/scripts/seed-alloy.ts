import { db } from "@workspace/db";
import {
  alloyWorkflowsTable,
  alloySignalsTable,
  alloyWorkflowRunsTable,
  alloyApprovalsTable,
  alloyArtifactsTable,
  alloyAuditLogTable,
} from "@workspace/db";
import { sql, eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const WORKFLOW_TYPES = [
  {
    name: "Daily ETL Pipeline",
    description: "Ingests, transforms, and loads daily operational data across all platform connectors.",
    trigger: "schedule" as const,
    outputType: "report" as const,
    steps: [
      { id: "extract", label: "Extract", deps: [] },
      { id: "validate", label: "Validate Schema", deps: ["extract"] },
      { id: "transform", label: "Transform & Normalize", deps: ["validate"] },
      { id: "load", label: "Load to Warehouse", deps: ["transform"] },
      { id: "verify", label: "Verify Row Counts", deps: ["load"] },
      { id: "notify", label: "Notify Downstream", deps: ["verify"] },
    ],
  },
  {
    name: "Terra Distress Scanner",
    description: "Scans NYC property records for distress signals and scores opportunities.",
    trigger: "schedule" as const,
    outputType: "report" as const,
    steps: [
      { id: "fetch_records", label: "Fetch ACRIS Records", deps: [] },
      { id: "dedup", label: "Deduplicate Entries", deps: ["fetch_records"] },
      { id: "score", label: "Score Opportunities", deps: ["dedup"] },
      { id: "filter", label: "Filter High-Value", deps: ["score"] },
      { id: "publish", label: "Publish to Terra", deps: ["filter"] },
    ],
  },
  {
    name: "Vessels AIS Sync",
    description: "Syncs AIS vessel position data and detects maritime anomalies.",
    trigger: "schedule" as const,
    outputType: "alert" as const,
    steps: [
      { id: "fetch_ais", label: "Fetch AIS Feed", deps: [] },
      { id: "parse", label: "Parse Positions", deps: ["fetch_ais"] },
      { id: "anomaly", label: "Detect Anomalies", deps: ["parse"] },
      { id: "alert", label: "Alert on Exceptions", deps: ["anomaly"] },
      { id: "archive", label: "Archive to DB", deps: ["parse"] },
    ],
  },
  {
    name: "Aegis Threat Aggregation",
    description: "Aggregates threat intelligence feeds and escalates critical findings.",
    trigger: "schedule" as const,
    outputType: "alert" as const,
    steps: [
      { id: "ingest_feeds", label: "Ingest Threat Feeds", deps: [] },
      { id: "normalize", label: "Normalize CVEs", deps: ["ingest_feeds"] },
      { id: "correlate", label: "Correlate with Assets", deps: ["normalize"] },
      { id: "score_risk", label: "Score Risk", deps: ["correlate"] },
      { id: "escalate", label: "Escalate Critical", deps: ["score_risk"] },
      { id: "report_out", label: "Generate Report", deps: ["score_risk"] },
    ],
  },
  {
    name: "Client Onboarding Sync",
    description: "Orchestrates new client provisioning across CRM, billing, and access systems.",
    trigger: "webhook" as const,
    outputType: "notification" as const,
    requiresApproval: true,
    steps: [
      { id: "validate_crm", label: "Validate CRM Entry", deps: [] },
      { id: "provision_access", label: "Provision Access", deps: ["validate_crm"] },
      { id: "setup_billing", label: "Setup Billing", deps: ["validate_crm"] },
      { id: "send_welcome", label: "Send Welcome Email", deps: ["provision_access", "setup_billing"] },
      { id: "notify_team", label: "Notify CS Team", deps: ["send_welcome"] },
    ],
  },
  {
    name: "Compliance Report Gen",
    description: "Generates SOC 2 and regulatory compliance evidence packages.",
    trigger: "schedule" as const,
    outputType: "document" as const,
    requiresApproval: true,
    steps: [
      { id: "collect_evidence", label: "Collect Evidence", deps: [] },
      { id: "map_controls", label: "Map to Controls", deps: ["collect_evidence"] },
      { id: "validate_coverage", label: "Validate Coverage", deps: ["map_controls"] },
      { id: "generate_pdf", label: "Generate PDF", deps: ["validate_coverage"] },
      { id: "review_gate", label: "Legal Review Gate", deps: ["generate_pdf"] },
      { id: "publish_report", label: "Publish Report", deps: ["review_gate"] },
    ],
  },
  {
    name: "Lyte Routing Decision",
    description: "Evaluates incoming incidents and routes to appropriate playbooks.",
    trigger: "signal" as const,
    outputType: "action" as const,
    steps: [
      { id: "classify", label: "Classify Signal", deps: [] },
      { id: "enrich", label: "Enrich Context", deps: ["classify"] },
      { id: "match_playbook", label: "Match Playbook", deps: ["enrich"] },
      { id: "execute_playbook", label: "Execute Playbook", deps: ["match_playbook"] },
      { id: "update_status", label: "Update Incident Status", deps: ["execute_playbook"] },
    ],
  },
  {
    name: "Revenue Reconciliation",
    description: "Reconciles subscription revenue across billing, accounting, and CRM systems.",
    trigger: "schedule" as const,
    outputType: "report" as const,
    steps: [
      { id: "fetch_billing", label: "Fetch Billing Data", deps: [] },
      { id: "fetch_crm", label: "Fetch CRM ARR", deps: [] },
      { id: "reconcile", label: "Reconcile Differences", deps: ["fetch_billing", "fetch_crm"] },
      { id: "flag_discrepancies", label: "Flag Discrepancies", deps: ["reconcile"] },
      { id: "generate_summary", label: "Generate Summary", deps: ["flag_discrepancies"] },
    ],
  },
  {
    name: "PRISM Signal Ingest",
    description: "Processes and normalizes cross-platform intelligence signals from all Alloy connectors.",
    trigger: "webhook" as const,
    outputType: "action" as const,
    steps: [
      { id: "receive", label: "Receive Signal", deps: [] },
      { id: "dedupe", label: "Deduplicate", deps: ["receive"] },
      { id: "enrich_signal", label: "Enrich Signal", deps: ["dedupe"] },
      { id: "score_signal", label: "Score Signal", deps: ["enrich_signal"] },
      { id: "route", label: "Route to Workflows", deps: ["score_signal"] },
    ],
  },
  {
    name: "CRM Contact Sync",
    description: "Bidirectional sync of contact and deal data between CRM and downstream systems.",
    trigger: "schedule" as const,
    outputType: "none" as const,
    steps: [
      { id: "fetch_crm_delta", label: "Fetch CRM Delta", deps: [] },
      { id: "map_fields", label: "Map Field Schema", deps: ["fetch_crm_delta"] },
      { id: "upsert_contacts", label: "Upsert Contacts", deps: ["map_fields"] },
      { id: "sync_deals", label: "Sync Deal Pipeline", deps: ["map_fields"] },
      { id: "reconcile_crm", label: "Reconcile Records", deps: ["upsert_contacts", "sync_deals"] },
    ],
  },
];

const SIGNAL_SOURCES = [
  { source: "terra", sourceType: "connector" as const, titles: [
    "Distress property detected: 1847 Flatbush Ave, Brooklyn — 45% equity cushion",
    "Pre-foreclosure filing: 234 W 145th St, Manhattan — auction in 11 days",
    "Tax lien escalation: 89-12 Jamaica Ave, Queens — 127 days delinquent",
    "High-opportunity lead: 412 Fulton St, Brooklyn — motivated seller confirmed",
    "Auction alert: 78 Lenox Hill Dr — reserve price below assessed value",
  ]},
  { source: "aegis", sourceType: "monitoring" as const, titles: [
    "Critical CVE-2025-1234 detected in API gateway — CVSS 9.1",
    "Unauthorized access attempt: 47 failed auth requests from 185.220.101.x",
    "Configuration drift detected in production secrets rotation policy",
    "Privilege escalation attempt blocked: user `jdoe` → admin role",
    "Dependency vulnerability: lodash 4.17.20 — prototype pollution risk",
  ]},
  { source: "vessels", sourceType: "monitoring" as const, titles: [
    "Dark vessel detected: MMSI 123456789 — 18h AIS gap in AIS position feed",
    "Speed anomaly: MSC Medusa exceeding 24kts in restricted zone",
    "Port deviation: Vessel rerouted to non-declared port of call",
    "Cargo mismatch detected: declared vs. actual manifest discrepancy",
    "Sanctions flag: vessel owner linked to SDN list entity",
  ]},
  { source: "lyte", sourceType: "webhook" as const, titles: [
    "P1 incident: network intrusion attempt — perimeter breach detected",
    "Playbook triggered: DDoS mitigation for client subnet 10.100.0.0/24",
    "Incident escalation: INC-7821 unresolved after 2h SLA breach",
    "Alert storm: 847 low-severity events correlated to single root cause",
    "Change freeze violation: deployment attempted during critical window",
  ]},
  { source: "alloy", sourceType: "api" as const, titles: [
    "Pipeline health degraded: ETL latency +340% above baseline",
    "Connector timeout: Salesforce API rate limit hit — backoff in progress",
    "Schema drift detected: terra_properties column type changed",
    "Approval queue depth: 14 pending approvals exceeding 48h SLA",
    "Signal volume spike: 3.2x baseline in last 15 minutes",
  ]},
];

function randBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function hoursAgo(h: number) {
  return new Date(Date.now() - h * 3600000);
}

function minutesAgo(m: number) {
  return new Date(Date.now() - m * 60000);
}

function daysAgo(d: number) {
  return new Date(Date.now() - d * 24 * 3600000);
}

function generateStepHistory(steps: Array<{ id: string; label: string; deps: string[] }>, status: string, durationMs: number) {
  const now = Date.now();
  const perStep = Math.floor(durationMs / steps.length);
  return steps.map((step, i) => {
    const stepStart = now - durationMs + i * perStep;
    const stepEnd = stepStart + perStep;
    const isLast = i === steps.length - 1;
    let stepStatus = "completed";
    if (status === "failed" && isLast) stepStatus = "failed";
    else if (status === "running" && isLast) stepStatus = "running";
    else if (status === "running" && i === steps.length - 2) stepStatus = "completed";
    return {
      id: step.id,
      label: step.label,
      deps: step.deps,
      status: stepStatus,
      startedAt: new Date(stepStart).toISOString(),
      completedAt: stepStatus === "running" ? null : new Date(stepEnd).toISOString(),
      durationMs: stepStatus === "running" ? null : perStep,
      logs: [
        `[${new Date(stepStart).toISOString()}] ${step.label} started`,
        stepStatus === "failed" ? `[${new Date(stepEnd).toISOString()}] ERROR: Connection timeout after 30s` : `[${new Date(stepEnd).toISOString()}] ${step.label} completed (${(perStep / 1000).toFixed(1)}s)`,
      ],
      input: { step: step.id, iteration: i + 1 },
      output: stepStatus === "failed" ? null : { processed: randBetween(100, 10000), success: true },
    };
  });
}

async function seedAlloyWorkflows() {
  console.log("Seeding Alloy platform workflows…");

  const existingWorkflows = await db.select({ id: alloyWorkflowsTable.id }).from(alloyWorkflowsTable).limit(1);
  if (existingWorkflows.length > 0) {
    console.log("  Alloy workflows already seeded, skipping.");
    return;
  }

  const workflows = WORKFLOW_TYPES.map((wt, i) => ({
    name: wt.name,
    description: wt.description,
    trigger: wt.trigger,
    triggerConfig: wt.trigger === "schedule" ? { cron: i % 2 === 0 ? "0 6 * * *" : "0 */4 * * *" } : null,
    steps: wt.steps,
    outputType: wt.outputType,
    requiresApproval: wt.requiresApproval ?? false,
    approverRole: wt.requiresApproval ? "admin" : null,
    isActive: true,
    runCount: 0,
  }));

  const inserted = await db.insert(alloyWorkflowsTable).values(workflows as any).returning();
  console.log(`  Inserted ${inserted.length} workflows.`);
  return inserted;
}

async function seedAlloySignals(count = 500) {
  console.log(`Seeding ${count} Alloy signals…`);

  const existing = await db.select({ id: alloySignalsTable.id }).from(alloySignalsTable).limit(1);
  if (existing.length > 0) {
    console.log("  Alloy signals already seeded, skipping.");
    return;
  }

  const severities = ["critical", "high", "medium", "low", "info"] as const;
  const statuses = ["new", "processing", "processed", "failed", "ignored"] as const;

  const signals = Array.from({ length: count }, (_, i) => {
    const sourceGroup = SIGNAL_SOURCES[i % SIGNAL_SOURCES.length];
    const titleIdx = Math.floor(Math.random() * sourceGroup.titles.length);
    const title = sourceGroup.titles[titleIdx];
    const severity = severities[Math.floor(Math.random() * severities.length)];
    const daysBack = Math.random() * 30;
    const receivedAt = daysAgo(daysBack);

    return {
      source: sourceGroup.source,
      sourceType: sourceGroup.sourceType,
      severity,
      title,
      body: `Signal from ${sourceGroup.source.toUpperCase()} connector. Severity: ${severity}. Requires investigation and potential workflow trigger.`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      normalizedScore: parseFloat((Math.random() * 100).toFixed(2)).toString(),
      metadata: {
        correlationId: `corr-${randomUUID().slice(0, 8)}`,
        connectorVersion: "2.1.0",
        region: ["us-east-1", "us-west-2", "eu-west-1"][Math.floor(Math.random() * 3)],
      },
      receivedAt,
      processedAt: Math.random() > 0.3 ? new Date(receivedAt.getTime() + randBetween(1000, 60000)) : null,
    };
  });

  await db.insert(alloySignalsTable).values(signals);
  console.log(`  Inserted ${signals.length} signals.`);
}

async function seedAlloyRuns(workflows: Array<{ id: number; name: string; requiresApproval: boolean; steps: unknown }>) {
  console.log("Seeding 200+ Alloy workflow runs…");

  const existing = await db.select({ id: alloyWorkflowRunsTable.id }).from(alloyWorkflowRunsTable).limit(1);
  if (existing.length > 0) {
    console.log("  Alloy workflow runs already seeded, skipping.");
    return;
  }

  const allRuns: Array<Record<string, unknown>> = [];
  const states = ["completed", "completed", "completed", "completed", "completed", "failed", "failed", "running", "queued", "waiting_approval"] as const;

  for (const wf of workflows) {
    const wfDef = WORKFLOW_TYPES.find(w => w.name === wf.name);
    const steps = wfDef?.steps ?? [];
    const runsPerWorkflow = randBetween(18, 28);

    for (let i = 0; i < runsPerWorkflow; i++) {
      const state = states[Math.floor(Math.random() * states.length)];
      const daysBack = Math.random() * 7;
      const queuedAt = daysAgo(daysBack);
      const durationMs = randBetween(5000, 120000);
      const startedAt = new Date(queuedAt.getTime() + randBetween(500, 3000));
      const completedAt = ["completed", "failed"].includes(state)
        ? new Date(startedAt.getTime() + durationMs)
        : null;

      const stepsExecuted = ["completed", "failed"].includes(state) && steps.length > 0
        ? generateStepHistory(steps, state, durationMs)
        : state === "running" && steps.length > 0
          ? generateStepHistory(steps.slice(0, Math.ceil(steps.length / 2)), "running", durationMs / 2)
          : [];

      const stateHistory = [
        { state: "queued", at: queuedAt.toISOString(), by: "scheduler" },
        ...(["completed", "failed", "running", "waiting_approval"].includes(state) ? [{ state: "running", at: startedAt.toISOString(), by: "system" }] : []),
        ...(state === "waiting_approval" ? [{ state: "waiting_approval", at: new Date(startedAt.getTime() + durationMs * 0.8).toISOString(), by: "system" }] : []),
        ...(["completed", "failed"].includes(state) && completedAt ? [{ state, at: completedAt.toISOString(), by: "system" }] : []),
      ];

      allRuns.push({
        workflowId: wf.id,
        state,
        stateHistory,
        input: {
          trigger: ["schedule", "webhook", "manual", "api"][Math.floor(Math.random() * 4)],
          params: { batchSize: randBetween(100, 5000) },
        },
        output: state === "completed" ? {
          processed: randBetween(100, 50000),
          success: true,
          duration: `${(durationMs / 1000).toFixed(1)}s`,
          steps: stepsExecuted,
        } : null,
        errorMessage: state === "failed" ? [
          "Connection timeout: upstream provider did not respond within 30s",
          "Schema validation failed: unexpected column type in source",
          "Rate limit exceeded — backing off 60s",
          "Memory limit exceeded during transform step",
          "Downstream service unavailable — circuit breaker open",
        ][Math.floor(Math.random() * 5)] : null,
        retryCount: state === "failed" ? randBetween(1, 3) : 0,
        maxRetries: 3,
        durationMs: state === "completed" ? durationMs : state === "failed" ? Math.floor(durationMs * 0.4) : null,
        queuedAt,
        startedAt: ["completed", "failed", "running", "waiting_approval"].includes(state) ? startedAt : null,
        completedAt,
      });
    }
  }

  await db.insert(alloyWorkflowRunsTable).values(allRuns as any);
  console.log(`  Inserted ${allRuns.length} workflow runs.`);
  return allRuns;
}

async function seedAlloyApprovals(workflows: Array<{ id: number; requiresApproval: boolean }>) {
  console.log("Seeding Alloy approvals…");

  const existing = await db.select({ id: alloyApprovalsTable.id }).from(alloyApprovalsTable).limit(1);
  if (existing.length > 0) {
    console.log("  Alloy approvals already seeded, skipping.");
    return;
  }

  const waitingRuns = await db.select({ id: alloyWorkflowRunsTable.id, workflowId: alloyWorkflowRunsTable.workflowId })
    .from(alloyWorkflowRunsTable)
    .where(sql`state IN ('waiting_approval', 'completed')`);

  if (waitingRuns.length === 0) {
    console.log("  No runs to create approvals for.");
    return;
  }

  const approvalStatuses = ["pending", "approved", "approved", "approved", "rejected", "expired"] as const;
  const roles = ["admin", "compliance", "finance", "legal", "ops"];
  const decisions = [null, "Reviewed and approved — all controls verified", "Approved pending minor revisions", "Rejected — non-compliant with SOC 2 CC6.1", "Expired — no reviewer response within 48h"];

  const approvalsToInsert = waitingRuns.slice(0, 60).map((run, i) => {
    const status = approvalStatuses[i % approvalStatuses.length];
    const daysBack = Math.random() * 14;
    const createdAt = daysAgo(daysBack);
    const decisionAt = status !== "pending" ? new Date(createdAt.getTime() + randBetween(1, 48) * 3600000) : null;

    return {
      workflowRunId: run.id,
      requestedFrom: roles[i % roles.length],
      status,
      decision: status !== "pending" ? decisions[Math.floor(Math.random() * decisions.length)] : null,
      decisionAt,
      expiresAt: new Date(createdAt.getTime() + 48 * 3600000),
      createdAt,
    };
  });

  await db.insert(alloyApprovalsTable).values(approvalsToInsert);
  console.log(`  Inserted ${approvalsToInsert.length} approvals.`);
}

async function seedAlloyAuditLog() {
  console.log("Seeding Alloy audit log…");

  const existing = await db.select({ id: alloyAuditLogTable.id }).from(alloyAuditLogTable).limit(1);
  if (existing.length > 0) {
    console.log("  Alloy audit log already seeded, skipping.");
    return;
  }

  const actions = [
    { action: "workflow.run.started", resourceType: "workflow_run" },
    { action: "workflow.run.completed", resourceType: "workflow_run" },
    { action: "workflow.run.failed", resourceType: "workflow_run" },
    { action: "approval.created", resourceType: "approval" },
    { action: "approval.approved", resourceType: "approval" },
    { action: "approval.rejected", resourceType: "approval" },
    { action: "signal.received", resourceType: "signal" },
    { action: "signal.processed", resourceType: "signal" },
    { action: "workflow.created", resourceType: "workflow" },
    { action: "connector.synced", resourceType: "connector" },
    { action: "connector.error", resourceType: "connector" },
  ];

  const entries = Array.from({ length: 200 }, (_, i) => {
    const action = actions[i % actions.length];
    return {
      action: action.action,
      resourceType: action.resourceType,
      resourceId: `${action.resourceType}-${i + 1}`,
      correlationId: randomUUID().slice(0, 8),
      metadata: { environment: "production", region: "us-east-1" },
      createdAt: daysAgo(Math.random() * 30),
    };
  });

  await db.insert(alloyAuditLogTable).values(entries);
  console.log(`  Inserted ${entries.length} audit log entries.`);
}

async function main() {
  console.log("=== Seeding Alloy Orchestration Engine ===");

  const workflows = await seedAlloyWorkflows();
  if (!workflows || workflows.length === 0) {
    const existing = await db.select().from(alloyWorkflowsTable);
    if (existing.length === 0) {
      console.error("No workflows found, aborting.");
      process.exit(1);
    }
    const workflowDefs = existing.map(w => ({
      ...w,
      requiresApproval: w.requiresApproval ?? false,
      steps: (w.steps as Array<{ id: string; label: string; deps: string[] }>) ?? [],
    }));
    await seedAlloySignals(500);
    await seedAlloyRuns(workflowDefs);
    await seedAlloyApprovals(workflowDefs);
    await seedAlloyAuditLog();
  } else {
    const workflowDefs = workflows.map(w => ({
      ...w,
      requiresApproval: w.requiresApproval ?? false,
      steps: (w.steps as Array<{ id: string; label: string; deps: string[] }>) ?? [],
    }));
    await seedAlloySignals(500);
    await seedAlloyRuns(workflowDefs);
    await seedAlloyApprovals(workflowDefs);
    await seedAlloyAuditLog();
  }

  console.log("=== Alloy seed complete ===");
  process.exit(0);
}

main().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
