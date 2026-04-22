/**
 * Demo Seed Runner
 *
 * Writes the four production demo narratives (Business / Security /
 * Maritime / Legal) to the database using the alloy_* tables (signals,
 * workflows, workflow_runs, approvals, actions, artifacts) and domain-
 * specific tables (lyte_signals, lyte_command_cards, etc).
 *
 * NOTE: A fifth narrative — Terra distress diligence (1847 Flatbush Ave) —
 * is exported from this package as `TERRA_DISTRESS_NARRATIVE` for use in the
 * Terra app's self-serve guided demo, but is not yet wired into the database
 * seed runner here. Wire it up when Terra needs server-side seeded state.
 *
 * Idempotency strategy:
 * - clearDemoData() removes all demo-tagged rows before seeding (reliable reset)
 * - alloy_* inserts use onConflictDoNothing with externalId unique constraint
 * - lyte_* inserts check for existing demo records before inserting
 *
 * Run via: pnpm --filter @workspace/demo-seed run seed:all
 * Or via:  scripts/demo-reset/reset.sh
 */

import {
  alloyActions,
  alloyApprovals,
  alloyArtifacts,
  alloyOwners,
  alloySignals,
  alloyWorkflowRuns,
  alloyWorkflows,
  db,
  lyteCommandCardsTable,
  lyteIncidentsTable,
  lyteRecommendationsTable,
  lyteSignalsTable,
  lyteWorkspacesTable,
} from '@szl-holdings/db';
import { eq, inArray, sql } from 'drizzle-orm';
import { seedCarlotaAdvisoryData } from './carlota-advisory-seed';

function hoursAgo(h: number) {
  return new Date(Date.now() - h * 3600_000);
}
function minutesAgo(m: number) {
  return new Date(Date.now() - m * 60_000);
}

// ─── Clear Demo Data (true reset) ─────────────────────────────────────────────

/**
 * Deletes all demo-tagged records from relevant tables in FK-safe order.
 * Call this at the start of a full reset to ensure a clean baseline.
 */
export async function clearDemoData(): Promise<void> {

  // Find all demo workflow IDs for FK-constrained deletes
  const demoWorkflows = await db
    .select({ id: alloyWorkflows.id })
    .from(alloyWorkflows)
    .where(sql`external_id LIKE 'demo-workflow-%'`);
  const demoWorkflowIds = demoWorkflows.map((w) => w.id);

  // Delete in FK-safe order: actions → artifacts → approvals → runs → workflows → signals → owners
  await db.delete(alloyActions).where(sql`external_id LIKE 'demo-action-%'`);
  await db.delete(alloyArtifacts).where(sql`external_id LIKE 'demo-artifact-%'`);

  if (demoWorkflowIds.length > 0) {
    await db.delete(alloyApprovals).where(inArray(alloyApprovals.workflowId, demoWorkflowIds));
    await db
      .delete(alloyWorkflowRuns)
      .where(inArray(alloyWorkflowRuns.workflowId, demoWorkflowIds));
  }

  await db.delete(alloyWorkflows).where(sql`external_id LIKE 'demo-workflow-%'`);
  await db.delete(alloySignals).where(sql`external_id LIKE 'demo-signal-%'`);
  await db.delete(alloyOwners).where(sql`external_id LIKE 'demo-owner-%'`);

  // Clear lyte demo records (metadata JSON tag or title pattern), then workspace
  await db.delete(lyteIncidentsTable).where(sql`metadata->>'demo' = 'true'`);
  await db.delete(lyteRecommendationsTable).where(sql`title LIKE 'Escalate deal%'`);
  await db.delete(lyteCommandCardsTable).where(sql`metadata->>'demo' = 'true'`);
  await db.delete(lyteSignalsTable).where(sql`metadata->>'demo' = 'true'`);
  await db.delete(lyteWorkspacesTable).where(eq(lyteWorkspacesTable.name, 'SZL Holdings Demo'));
}

/**
 * Upserts the demo lyte workspace and returns its stable id.
 * Must be called before inserting into any lyte_* table that has workspace_id.
 */
async function ensureDemoWorkspace(): Promise<number> {
  const [existing] = await db
    .select({ id: lyteWorkspacesTable.id })
    .from(lyteWorkspacesTable)
    .where(eq(lyteWorkspacesTable.name, 'SZL Holdings Demo'))
    .limit(1);
  if (existing) return existing.id;

  const [created] = await db
    .insert(lyteWorkspacesTable)
    .values({
      name: 'SZL Holdings Demo',
      description:
        'Demo workspace for the four database-seeded SZL Holdings narratives (Business, Security, Maritime, Legal)',
      ownerId: 'demo',
    })
    .returning({ id: lyteWorkspacesTable.id });
  return created?.id;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function upsertOwner(
  externalId: string,
  name: string,
  type: 'user' | 'team' | 'system' | 'external',
  domain: string,
  email?: string,
) {
  const [row] = await db
    .insert(alloyOwners)
    .values({ externalId, name, type, domain, email, metadata: { demo: true } })
    .onConflictDoNothing({ target: alloyOwners.externalId })
    .returning();
  if (row) return row;
  const [existing] = await db
    .select()
    .from(alloyOwners)
    .where(sql`external_id = ${externalId}`)
    .limit(1);
  return existing!;
}

async function upsertSignal(values: typeof alloySignals.$inferInsert) {
  const [row] = await db
    .insert(alloySignals)
    .values(values)
    .onConflictDoNothing({ target: alloySignals.externalId })
    .returning();
  if (row) return row;
  const [existing] = await db
    .select()
    .from(alloySignals)
    .where(sql`external_id = ${values.externalId}`)
    .limit(1);
  return existing!;
}

// ─── Narrative 1: Business / RevOps / Lyte ───────────────────────────────────

async function seedBusinessNarrative() {

  const lyteWorkspaceId = await ensureDemoWorkspace();
  const owner = await upsertOwner(
    'demo-owner-lyte-cfo',
    'Marcus Holt (CFO Demo)',
    'user',
    'lyte',
    'm.holt@demo.szlholdings.com',
  );

  const signal = await upsertSignal({
    externalId: 'demo-signal-biz-001',
    source: 'Lyte PRISM — Motion',
    sourceType: 'demo',
    domain: 'lyte',
    title: 'Pipeline stall — $4.2M deal stalled 47 days without owner action',
    summary:
      'Vantex Acquisition deal has not advanced in 47 days. Approval owner departed 2026-02-28 with no handoff. Q2 close probability: 31%.',
    category: 'pipeline',
    severity: 'high',
    score: 8.7,
    confidence: 0.91,
    tags: ['demo', 'pipeline', 'stall', 'q2-risk'],
    ownerId: owner.id,
    status: 'scored',
    environment: 'production',
    metadata: { demo: true, narrative: 'business-revops', valueAtRisk: 4200000, daysStalled: 47 },
  });

  const workflow = await (async () => {
    const [row] = await db
      .insert(alloyWorkflows)
      .values({
        externalId: 'demo-workflow-biz-001',
        name: 'Q2 Pipeline Recovery — Vantex Acquisition',
        type: 'escalation',
        domain: 'lyte',
        triggerId: signal.id,
        triggerType: 'signal',
        status: 'completed',
        priority: 'high',
        requiresApproval: true,
        approvalState: 'approved',
        confidenceScore: 0.87,
        steps: [
          { step: 1, name: 'Ownership reassignment', status: 'completed' },
          { step: 2, name: 'Buyer re-engagement', status: 'completed' },
          { step: 3, name: 'CFO calendar block', status: 'completed' },
          { step: 4, name: 'Velocity monitoring restart', status: 'completed' },
        ],
        environment: 'production',
        metadata: { demo: true, narrative: 'business-revops', agent: 'Lyte' },
        startedAt: hoursAgo(26),
        completedAt: hoursAgo(24),
      })
      .onConflictDoNothing({ target: alloyWorkflows.externalId })
      .returning();
    if (row) return row;
    const [existing] = await db
      .select()
      .from(alloyWorkflows)
      .where(sql`external_id = ${'demo-workflow-biz-001'}`)
      .limit(1);
    return existing!;
  })();

  const [wfRun] = await db
    .insert(alloyWorkflowRuns)
    .values({
      workflowId: workflow.id,
      runNumber: 1,
      status: 'completed',
      trigger: 'signal:demo-signal-biz-001',
      approvalState: 'approved',
      startedAt: hoursAgo(26),
      completedAt: hoursAgo(24),
      durationMs: 7200_000,
      metadata: { demo: true },
    })
    .returning();

  await db
    .insert(alloyApprovals)
    .values({
      workflowId: workflow.id,
      runId: wfRun?.id,
      status: 'approved',
      reason: 'Assign to Sarah Kim (VP BD). I will join the next buyer call personally.',
      reviewNote: 'CFO approved escalation — emergency ownership reassignment',
      requiredRoles: ['executive'],
      reviewedAt: hoursAgo(25),
    })
    .onConflictDoNothing();

  await db
    .insert(alloyActions)
    .values([
      {
        externalId: 'demo-action-biz-001-1',
        workflowId: workflow.id,
        signalId: signal.id,
        type: 'assign',
        title: 'Ownership reassigned to Sarah Kim (VP BD)',
        description:
          'Deal ownership transferred via Alloy workflow — velocity monitoring reactivated',
        status: 'completed',
        priority: 'critical',
        payload: { demo: true, assignee: 'Sarah Kim', role: 'VP Business Development' },
        completedAt: hoursAgo(25),
        metadata: { demo: true, narrative: 'business-revops' },
      },
      {
        externalId: 'demo-action-biz-001-2',
        workflowId: workflow.id,
        signalId: signal.id,
        type: 'notify',
        title: 'Buyer re-engagement email queued for review',
        description: "Lyte drafted buyer re-engagement email — pending Sophia's review before send",
        status: 'completed',
        priority: 'high',
        payload: { demo: true, recipient: 'Buyer contact', draftedBy: 'Lyte' },
        completedAt: hoursAgo(24),
        metadata: { demo: true, narrative: 'business-revops' },
      },
      {
        externalId: 'demo-action-biz-001-3',
        workflowId: workflow.id,
        signalId: signal.id,
        type: 'report',
        title: 'CFO calendar block created for buyer call',
        description: '2026-04-16 14:00 — CFO join on buyer call as sponsor',
        status: 'completed',
        priority: 'high',
        payload: { demo: true, eventDate: '2026-04-16T14:00:00Z' },
        completedAt: hoursAgo(24),
        metadata: { demo: true, narrative: 'business-revops' },
      },
    ])
    .onConflictDoNothing({ target: alloyActions.externalId });

  await db
    .insert(alloyArtifacts)
    .values({
      externalId: 'demo-artifact-biz-001-summary',
      workflowId: workflow.id,
      signalId: signal.id,
      type: 'summary',
      title: 'Q2 Revenue Exposure Contained: $4.2M Deal Reactivated',
      content:
        'A 47-day pipeline stall was detected and resolved within one business day. Close probability restored from 31% to 74%. Total time from signal to resolution: 25 hours 36 minutes. Actions taken: 4. Approvals: 1. Audit record: complete.',
      domain: 'lyte',
      metadata: {
        demo: true,
        narrative: 'business-revops',
        closeProbabilityBefore: 0.31,
        closeProbabilityAfter: 0.74,
      },
    })
    .onConflictDoNothing({ target: alloyArtifacts.externalId });

  // Seed lyte-specific tables for Command Inbox visibility
  const [lyteSignal] = await db
    .insert(lyteSignalsTable)
    .values({
      workspaceId: lyteWorkspaceId,
      source: 'PRISM Motion — Lyte',
      sourceType: 'monitoring',
      severity: 'high',
      title: 'Pipeline stall — Vantex Acquisition — 47 days — $4.2M at risk',
      body: 'Deal velocity: 0 actions in 47 days. Close probability dropped from 84% to 31%. Approval owner departed 2026-02-28 with no handoff. Q2 revenue at risk: $4.2M of $18M (23%).',
      status: 'acknowledged',
      metadata: { demo: true, narrative: 'business-revops', externalId: 'demo-signal-biz-001' },
    })
    .returning();

  if (lyteSignal) {
    await db
      .insert(lyteCommandCardsTable)
      .values({
        workspaceId: lyteWorkspaceId,
        title: 'Escalate Vantex Acquisition — CFO Approval Required',
        description:
          'Deal stalled 47 days. Approval owner departed without handoff. Revenue at risk: $4.2M. Lyte recommends emergency escalation to CFO with VP BD reassignment.',
        category: 'risk',
        priority: 'critical',
        status: 'completed',
        assignee: 'Marcus Holt',
        metadata: {
          demo: true,
          narrative: 'business-revops',
          signalId: lyteSignal.id,
          confidence: 0.87,
        },
      })
      .onConflictDoNothing();

    await db
      .insert(lyteRecommendationsTable)
      .values({
        workspaceId: lyteWorkspaceId,
        signalId: lyteSignal.id,
        title: 'Escalate deal — CFO sponsorship + VP BD reassignment + buyer re-engagement',
        description:
          'Escalate immediately. Reassign deal ownership to VP BD (Sarah Kim). CFO to sponsor buyer call. Deal has 78% historical close rate with this intervention pattern at this stage. Lyte confidence: 87%. Historical close rate with comparable intervention: 78%.',
        category: 'risk_mitigation',
        impact: 'high',
        effort: 'low',
        status: 'completed',
        actionItems: [
          { step: 1, action: 'Reassign deal ownership to Sarah Kim (VP BD)' },
          { step: 2, action: 'Queue buyer re-engagement email for review' },
          { step: 3, action: 'Create CFO calendar block for buyer call' },
          { step: 4, action: 'Reactivate deal velocity monitoring — 7-day threshold' },
        ],
      })
      .onConflictDoNothing();
  }
}

// ─── Narrative 2: Security / SOC / Aegis ─────────────────────────────────────

async function seedSecurityNarrative() {

  const lyteWorkspaceId = await ensureDemoWorkspace();
  const cisoOwner = await upsertOwner(
    'demo-owner-ciso',
    'Diana Reyes (CISO Demo)',
    'user',
    'aegis',
    'd.reyes@demo.szlholdings.com',
  );
  const _analystOwner = await upsertOwner(
    'demo-owner-soc-analyst',
    'Priya Nair (SOC Analyst Demo)',
    'user',
    'aegis',
    'p.nair@demo.szlholdings.com',
  );

  const signal = await upsertSignal({
    externalId: 'demo-signal-sec-001',
    source: 'Aegis Sentinel — Identity Telemetry',
    sourceType: 'demo',
    domain: 'aegis',
    title: 'Credential stuffing — 2,400 failed auth attempts in 3 min from 14 IPs',
    summary:
      'Auth Service Cluster under active credential stuffing attack. IP cluster matches CISA KEV-2026-0247 botnet. CVE-2025-31982 active (CVSS 9.1). MITRE T1110.004.',
    category: 'security_incident',
    severity: 'critical',
    score: 9.6,
    confidence: 0.96,
    tags: ['demo', 'credential-stuffing', 'cisa-kev', 'mitre-t1110.004', 'cvss-9.1'],
    ownerId: cisoOwner.id,
    status: 'triaged',
    environment: 'production',
    metadata: {
      demo: true,
      narrative: 'security-soc',
      cisaKevRef: 'KEV-2026-0247',
      cvePrimary: 'CVE-2025-31982',
      cvss: 9.1,
      mitreTechnique: 'T1110.004',
      failedAttempts: 2400,
      sourceIPs: 14,
      windowMinutes: 3,
      blastRadius: '340,000 active sessions',
    },
  });

  const workflow = await (async () => {
    const [row] = await db
      .insert(alloyWorkflows)
      .values({
        externalId: 'demo-workflow-sec-001',
        name: 'Credential Stuffing Containment — Auth Service',
        type: 'remediation',
        domain: 'aegis',
        triggerId: signal.id,
        triggerType: 'signal',
        status: 'completed',
        priority: 'critical',
        requiresApproval: true,
        approvalState: 'approved',
        confidenceScore: 0.94,
        steps: [
          { step: 1, name: 'Block 14 source IPs at firewall', status: 'completed' },
          { step: 2, name: 'Enable Auth Service rate limiting', status: 'completed' },
          { step: 3, name: 'Rotate 3 elevated session tokens', status: 'completed' },
          { step: 4, name: 'Schedule Auth Service v2.9.0 patch', status: 'completed' },
          { step: 5, name: 'Draft GDPR regulatory notification', status: 'completed' },
        ],
        environment: 'production',
        metadata: { demo: true, narrative: 'security-soc', playbook: 'P-001', agent: 'Sentinel' },
        startedAt: minutesAgo(47),
        completedAt: minutesAgo(24),
      })
      .onConflictDoNothing({ target: alloyWorkflows.externalId })
      .returning();
    if (row) return row;
    const [existing] = await db
      .select()
      .from(alloyWorkflows)
      .where(sql`external_id = ${'demo-workflow-sec-001'}`)
      .limit(1);
    return existing!;
  })();

  const [wfRun] = await db
    .insert(alloyWorkflowRuns)
    .values({
      workflowId: workflow.id,
      runNumber: 1,
      status: 'completed',
      trigger: 'signal:demo-signal-sec-001',
      approvalState: 'approved',
      startedAt: minutesAgo(47),
      completedAt: minutesAgo(24),
      durationMs: 23 * 60_000,
      metadata: { demo: true, minutesToContainment: 23 },
    })
    .returning();

  await db
    .insert(alloyApprovals)
    .values({
      workflowId: workflow.id,
      runId: wfRun?.id,
      status: 'approved',
      reason:
        'Execute containment immediately. Escalate patch to P0. Notify legal for regulatory reporting window.',
      reviewNote: 'CISO approved in 96 seconds',
      requiredRoles: ['executive', 'ciso'],
      reviewedAt: minutesAgo(45),
    })
    .onConflictDoNothing();

  await db
    .insert(alloyActions)
    .values([
      {
        externalId: 'demo-action-sec-001-1',
        workflowId: workflow.id,
        signalId: signal.id,
        type: 'remediate',
        title: '14 IPs blocked at perimeter firewall',
        description:
          'All 14 identified botnet IPs blocked via Aegis Firewall Connector — confirmed at perimeter',
        status: 'completed',
        priority: 'critical',
        payload: { demo: true, ipCount: 14, tool: 'Aegis Firewall Connector' },
        completedAt: minutesAgo(43),
        metadata: { demo: true, narrative: 'security-soc' },
      },
      {
        externalId: 'demo-action-sec-001-2',
        workflowId: workflow.id,
        signalId: signal.id,
        type: 'remediate',
        title: 'Auth Service rate limiting enabled — 5 req/min threshold',
        description: 'Rate limiting activated on Auth Service Cluster during patch window',
        status: 'completed',
        priority: 'critical',
        payload: { demo: true, threshold: '5 req/min', tool: 'Aegis Auth Connector' },
        completedAt: minutesAgo(40),
        metadata: { demo: true, narrative: 'security-soc' },
      },
      {
        externalId: 'demo-action-sec-001-3',
        workflowId: workflow.id,
        signalId: signal.id,
        type: 'remediate',
        title: '3 elevated session tokens rotated — users notified',
        description:
          'Precautionary rotation of 3 privileged session tokens; affected users emailed',
        status: 'completed',
        priority: 'high',
        payload: { demo: true, tokenCount: 3, tool: 'Aegis Identity Connector' },
        completedAt: minutesAgo(35),
        metadata: { demo: true, narrative: 'security-soc' },
      },
      {
        externalId: 'demo-action-sec-001-4',
        workflowId: workflow.id,
        signalId: signal.id,
        type: 'report',
        title: 'GDPR 72-hour notification window logged — draft staged',
        description: 'Regulatory notification obligation logged. Draft prepared for legal review.',
        status: 'completed',
        priority: 'high',
        payload: { demo: true, framework: 'GDPR', windowHours: 72 },
        completedAt: minutesAgo(24),
        metadata: { demo: true, narrative: 'security-soc' },
      },
    ])
    .onConflictDoNothing({ target: alloyActions.externalId });

  await db
    .insert(alloyArtifacts)
    .values({
      externalId: 'demo-artifact-sec-001-summary',
      workflowId: workflow.id,
      signalId: signal.id,
      type: 'summary',
      title: 'Credential Stuffing Contained in 23 Minutes — 0 Accounts Compromised',
      content:
        'CISA KEV-2026-0247 botnet detected targeting Auth Service. CISO approved containment in 96 seconds. Analyst executed 4-step playbook. 0 accounts compromised. 0 data exfiltration detected. GDPR notification filed within 72-hour window. Evidence package ready for SOC 2 and ISO 27001 review.',
      domain: 'aegis',
      metadata: {
        demo: true,
        narrative: 'security-soc',
        minutesToContainment: 23,
        accountsCompromised: 0,
      },
    })
    .onConflictDoNothing({ target: alloyArtifacts.externalId });

  await db
    .insert(lyteIncidentsTable)
    .values({
      workspaceId: lyteWorkspaceId,
      title: 'Auth Service — Credential Stuffing Attack (Contained)',
      description:
        '2,400 failed auth attempts from 14 IPs matching CISA KEV botnet. MITRE T1110.004. CVE-2025-31982 (CVSS 9.1) active. Contained in 23 minutes. 0 accounts compromised.',
      severity: 'critical',
      status: 'resolved',
      assignee: 'Priya Nair',
      impactArea: 'Authentication / Identity',
      rootCause:
        'Distributed botnet credential stuffing exploiting CVE-2025-31982 in Auth Service v2.8.0',
      resolution:
        'IP block + rate limiting + session token rotation + patch scheduled. CISO-approved containment playbook executed.',
      metadata: { demo: true, narrative: 'security-soc' },
      resolvedAt: minutesAgo(24),
    })
    .onConflictDoNothing();
}

// ─── Narrative 3: Maritime / Sanctions / Vessels ──────────────────────────────

async function seedMaritimeNarrative() {

  const fleetOwner = await upsertOwner(
    'demo-owner-fleet-ops',
    'Captain James Wren (Demo)',
    'user',
    'vessels',
    'j.wren@demo.szlholdings.com',
  );

  const signal = await upsertSignal({
    externalId: 'demo-signal-mar-001',
    source: 'Vessels Helmsman — AIS Telemetry',
    sourceType: 'demo',
    domain: 'vessels',
    title: 'MV Soltana — AIS dark 134 min, sanctions corridor proximity detected',
    summary:
      'MV Soltana ceased AIS transmission for 134 minutes. Reappeared 34nm off declared route, within 18nm of Iranian waters. OFAC screening triggered. Revenue at risk: $840,000.',
    category: 'compliance',
    severity: 'critical',
    score: 9.1,
    confidence: 0.89,
    tags: ['demo', 'ais-dark', 'ofac', 'sanctions', 'maritime'],
    ownerId: fleetOwner.id,
    status: 'triaged',
    environment: 'production',
    metadata: {
      demo: true,
      narrative: 'maritime',
      vessel: 'MV Soltana',
      imo: '9812347',
      darkDurationMin: 134,
      deviationNm: 34,
      ofacCorridorProximityNm: 18,
      cargoValue: 3200000,
      revenueAtRisk: 840000,
    },
  });

  const workflow = await (async () => {
    const [row] = await db
      .insert(alloyWorkflows)
      .values({
        externalId: 'demo-workflow-mar-001',
        name: 'MV Soltana — OFAC Clearance & Anchorage Hold',
        type: 'review',
        domain: 'vessels',
        triggerId: signal.id,
        triggerType: 'signal',
        status: 'completed',
        priority: 'critical',
        requiresApproval: true,
        approvalState: 'approved',
        confidenceScore: 0.91,
        steps: [
          { step: 1, name: 'Notify master — hold at Karachi anchorage', status: 'completed' },
          { step: 2, name: 'File voyage incident report INC-2026-0414-001', status: 'completed' },
          { step: 3, name: 'Notify P&I Club — UK P&I ref P24-0887', status: 'completed' },
          { step: 4, name: 'Initiate OFAC internal clearance review', status: 'completed' },
          { step: 5, name: 'Notify charterer — ETA revised', status: 'completed' },
        ],
        environment: 'production',
        metadata: {
          demo: true,
          narrative: 'maritime',
          agent: 'Helmsman',
          incidentRef: 'INC-2026-0414-001',
        },
        startedAt: hoursAgo(8),
        completedAt: hoursAgo(3),
      })
      .onConflictDoNothing({ target: alloyWorkflows.externalId })
      .returning();
    if (row) return row;
    const [existing] = await db
      .select()
      .from(alloyWorkflows)
      .where(sql`external_id = ${'demo-workflow-mar-001'}`)
      .limit(1);
    return existing!;
  })();

  const [wfRun] = await db
    .insert(alloyWorkflowRuns)
    .values({
      workflowId: workflow.id,
      runNumber: 1,
      status: 'completed',
      trigger: 'signal:demo-signal-mar-001',
      approvalState: 'approved',
      startedAt: hoursAgo(8),
      completedAt: hoursAgo(3),
      durationMs: 5 * 3600_000,
      metadata: { demo: true, clearanceHours: 4.5 },
    })
    .returning();

  await db
    .insert(alloyApprovals)
    .values({
      workflowId: workflow.id,
      runId: wfRun?.id,
      status: 'approved',
      reason:
        'Agreed. Hold at anchorage. I am calling the P&I Club now. Notify the charterer — they need to know the ETA impact.',
      reviewNote: 'Fleet Ops Director approved in 5 minutes',
      requiredRoles: ['operator'],
      reviewedAt: hoursAgo(7.9),
    })
    .onConflictDoNothing();

  await db
    .insert(alloyActions)
    .values([
      {
        externalId: 'demo-action-mar-001-1',
        workflowId: workflow.id,
        signalId: signal.id,
        type: 'notify',
        title: 'Master notified — hold at Karachi anchorage (18.8°N 67.1°E)',
        description: 'Master instructed to hold at designated anchorage pending OFAC clearance',
        status: 'completed',
        priority: 'critical',
        payload: { demo: true, anchorage: '18.8°N 67.1°E', vessel: 'MV Soltana' },
        completedAt: hoursAgo(7.7),
        metadata: { demo: true, narrative: 'maritime' },
      },
      {
        externalId: 'demo-action-mar-001-2',
        workflowId: workflow.id,
        signalId: signal.id,
        type: 'report',
        title: 'Voyage incident report filed — INC-2026-0414-001',
        description: 'Formal incident report created via Alloy Workflow',
        status: 'completed',
        priority: 'high',
        payload: { demo: true, ref: 'INC-2026-0414-001' },
        completedAt: hoursAgo(7.5),
        metadata: { demo: true, narrative: 'maritime' },
      },
      {
        externalId: 'demo-action-mar-001-3',
        workflowId: workflow.id,
        signalId: signal.id,
        type: 'notify',
        title: 'P&I Club notified — UK P&I ref P24-0887',
        description: 'UK P&I Club notified within 24-hour obligation window',
        status: 'completed',
        priority: 'high',
        payload: { demo: true, club: 'UK P&I', ref: 'P24-0887' },
        completedAt: hoursAgo(7),
        metadata: { demo: true, narrative: 'maritime' },
      },
      {
        externalId: 'demo-action-mar-001-4',
        workflowId: workflow.id,
        signalId: signal.id,
        type: 'notify',
        title: 'Charterer notified — ETA revised +12 hours',
        description:
          'Charterer (Meridian Energy Trading) informed of ETA revision pending OFAC clearance',
        status: 'completed',
        priority: 'medium',
        payload: { demo: true, charterer: 'Meridian Energy Trading', etaRevision: '+12 hours' },
        completedAt: hoursAgo(7),
        metadata: { demo: true, narrative: 'maritime' },
      },
    ])
    .onConflictDoNothing({ target: alloyActions.externalId });

  await db
    .insert(alloyArtifacts)
    .values({
      externalId: 'demo-artifact-mar-001-summary',
      workflowId: workflow.id,
      signalId: signal.id,
      type: 'summary',
      title: 'MV Soltana OFAC Event Resolved — Vessel Cleared, Voyage Record Complete',
      content:
        'AIS dark event (134 min) detected near sanctions corridor. Fleet Ops Director approved anchorage hold in 5 minutes. OFAC clearance confirmed in 4.5 hours — no sanctions match. Voyage resumed. Demurrage $112,000 recoverable from charterer. Full audit trail preserved for flag state, port authority, and P&I review.',
      domain: 'vessels',
      metadata: { demo: true, narrative: 'maritime', ofacResult: 'cleared', demurrage: 112000 },
    })
    .onConflictDoNothing({ target: alloyArtifacts.externalId });
}

// ─── Narrative 4: Legal / Compliance / PRISM Counsel ─────────────────────────

async function seedLegalNarrative() {

  const legalOwner = await upsertOwner(
    'demo-owner-attorney',
    'Sophia Marchetti (Demo)',
    'user',
    'prism-counsel',
    's.marchetti@demo.szlholdings.com',
  );

  const signal = await upsertSignal({
    externalId: 'demo-signal-leg-001',
    source: 'PRISM Counsel — Deadline Compliance Engine',
    sourceType: 'demo',
    domain: 'prism-counsel',
    title: 'Rivera v. Apex — NY DFS Reg 68 insurer acknowledgement window exceeded by 12 days',
    summary:
      'Continental General Insurance has not acknowledged the Rivera demand within the 30-day window required under NY DFS Regulation 68 §216.6. Violation: 12 days. Demand readiness: 91%. Bad faith clock trigger available.',
    category: 'compliance',
    severity: 'high',
    score: 8.4,
    confidence: 0.97,
    tags: ['demo', 'reg-68', 'deadline-violation', 'bad-faith', 'demand-readiness'],
    ownerId: legalOwner.id,
    status: 'triaged',
    environment: 'production',
    metadata: {
      demo: true,
      narrative: 'legal-compliance',
      matter: 'Rivera v. Apex Mobility Group',
      caseNumber: 'KCX-2025-08847',
      regulation: 'NY DFS Insurance Regulation 68 §216.6',
      violationDays: 12,
      demandReadiness: 91,
      estimatedValue: 485000,
      settlementBandMedian: 418000,
    },
  });

  const workflow = await (async () => {
    const [row] = await db
      .insert(alloyWorkflows)
      .values({
        externalId: 'demo-workflow-leg-001',
        name: 'Rivera v. Apex — Reg 68 Violation Notice & Demand Issuance',
        type: 'review',
        domain: 'prism-counsel',
        triggerId: signal.id,
        triggerType: 'signal',
        status: 'completed',
        priority: 'high',
        requiresApproval: true,
        approvalState: 'approved',
        confidenceScore: 0.93,
        steps: [
          {
            step: 1,
            name: 'Draft Reg 68 violation notice with insurer profile',
            status: 'completed',
          },
          { step: 2, name: 'Export demand packet to Word with citations', status: 'completed' },
          {
            step: 3,
            name: 'Transmit to Continental General (certified + email)',
            status: 'completed',
          },
          { step: 4, name: 'Notify client (Elena Rivera) — plain language', status: 'completed' },
          { step: 5, name: 'Set 7-day escalation deadline', status: 'completed' },
          { step: 6, name: 'Stage NY DFS complaint draft', status: 'completed' },
        ],
        environment: 'production',
        metadata: {
          demo: true,
          narrative: 'legal-compliance',
          ref: 'RIV-2026-0130',
          agent: 'PRISM Counsel AI',
        },
        startedAt: hoursAgo(72),
        completedAt: hoursAgo(70),
      })
      .onConflictDoNothing({ target: alloyWorkflows.externalId })
      .returning();
    if (row) return row;
    const [existing] = await db
      .select()
      .from(alloyWorkflows)
      .where(sql`external_id = ${'demo-workflow-leg-001'}`)
      .limit(1);
    return existing!;
  })();

  const [wfRun] = await db
    .insert(alloyWorkflowRuns)
    .values({
      workflowId: workflow.id,
      runNumber: 1,
      status: 'completed',
      trigger: 'signal:demo-signal-leg-001',
      approvalState: 'approved',
      startedAt: hoursAgo(72),
      completedAt: hoursAgo(70),
      durationMs: 2 * 3600_000,
      metadata: { demo: true, daysToInsurerResponse: 5 },
    })
    .returning();

  await db
    .insert(alloyApprovals)
    .values({
      workflowId: workflow.id,
      runId: wfRun?.id,
      status: 'approved',
      reason:
        'Agreed. Issue the notice today. CC our client. I want the bad faith letter to cite the prior violations — make sure the insurer profile is attached.',
      reviewNote: 'Managing Attorney approved in 44 minutes',
      requiredRoles: ['operator', 'attorney'],
      reviewedAt: hoursAgo(71.3),
    })
    .onConflictDoNothing();

  await db
    .insert(alloyActions)
    .values([
      {
        externalId: 'demo-action-leg-001-1',
        workflowId: workflow.id,
        signalId: signal.id,
        type: 'report',
        title: 'Reg 68 violation notice drafted — insurer profile attached',
        description:
          'PRISM Counsel drafted violation notice citing 3 prior Continental General violations in this jurisdiction',
        status: 'completed',
        priority: 'high',
        payload: { demo: true, regulation: 'NY DFS Reg 68 §216.6', priorViolations: 3 },
        completedAt: hoursAgo(71),
        metadata: { demo: true, narrative: 'legal-compliance' },
      },
      {
        externalId: 'demo-action-leg-001-2',
        workflowId: workflow.id,
        signalId: signal.id,
        type: 'report',
        title: 'Demand packet exported to Word with source citations',
        description:
          'Demand letter exported with privilege controls, source citations, and metadata intact',
        status: 'completed',
        priority: 'high',
        payload: { demo: true, format: 'Word (.docx)', citations: true, privilegeProtected: true },
        completedAt: hoursAgo(70.5),
        metadata: { demo: true, narrative: 'legal-compliance' },
      },
      {
        externalId: 'demo-action-leg-001-3',
        workflowId: workflow.id,
        signalId: signal.id,
        type: 'notify',
        title: 'Letter transmitted — Continental General (cert. mail + email) ref RIV-2026-0130',
        description: 'Formal Reg 68 violation notice transmitted via certified mail and email',
        status: 'completed',
        priority: 'high',
        payload: { demo: true, ref: 'RIV-2026-0130', channels: ['certified-mail', 'email'] },
        completedAt: hoursAgo(70),
        metadata: { demo: true, narrative: 'legal-compliance' },
      },
      {
        externalId: 'demo-action-leg-001-4',
        workflowId: workflow.id,
        signalId: signal.id,
        type: 'notify',
        title: 'Client (Elena Rivera) notified — plain-language summary',
        description:
          'Client update sent in plain language explaining the violation notice and next steps',
        status: 'completed',
        priority: 'medium',
        payload: { demo: true, client: 'Elena Rivera', format: 'plain-language' },
        completedAt: hoursAgo(70),
        metadata: { demo: true, narrative: 'legal-compliance' },
      },
    ])
    .onConflictDoNothing({ target: alloyActions.externalId });

  await db
    .insert(alloyArtifacts)
    .values({
      externalId: 'demo-artifact-leg-001-summary',
      workflowId: workflow.id,
      signalId: signal.id,
      type: 'summary',
      title: 'Rivera v. Apex — Reg 68 Clock Violation Triggered Settlement Response in 5 Days',
      content:
        'PRISM Counsel detected a 12-day Reg 68 clock violation (§216.6), scored demand readiness at 91%, and generated a violation notice recommendation. Managing Attorney approved in 44 minutes. Notice issued same day. Continental General responded in 5 days with a settlement conference request — offer $395,000 against band median $418,000. Proof chain complete for every step. Attorney work product protected.',
      domain: 'prism-counsel',
      metadata: {
        demo: true,
        narrative: 'legal-compliance',
        settlementOffer: 395000,
        daysToResponse: 5,
      },
    })
    .onConflictDoNothing({ target: alloyArtifacts.externalId });
}

// ─── Main Runner ──────────────────────────────────────────────────────────────

export async function seedAllNarratives() {
  await clearDemoData();
  await seedBusinessNarrative();
  await seedSecurityNarrative();
  await seedMaritimeNarrative();
  await seedLegalNarrative();
  await seedCarlotaAdvisoryData();
}

export async function seedNarrative(id: 'business' | 'security' | 'maritime' | 'legal') {
  const map = {
    business: seedBusinessNarrative,
    security: seedSecurityNarrative,
    maritime: seedMaritimeNarrative,
    legal: seedLegalNarrative,
  };
  // Note: clearDemoData() removes ALL demo-tagged rows (all four narratives) before
  // seeding the selected one. This ensures a clean baseline regardless of which narrative
  // was previously seeded, at the cost of clearing data from other narratives. This is
  // intentional for demo environments where only one narrative is shown at a time.
  await clearDemoData();
  await map[id]();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const narrative = process.argv[2] as 'business' | 'security' | 'maritime' | 'legal' | undefined;
  const runner = narrative ? () => seedNarrative(narrative) : seedAllNarratives;
  runner()
    .then(() => {
      process.exit(0);
    })
    .catch((_err) => {
      process.exit(1);
    });
}
