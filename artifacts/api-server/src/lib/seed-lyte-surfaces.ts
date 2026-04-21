import {
  db,
  lyteBoardMetricsTable,
  lyteBoardRisksTable,
  lyteDebtItemsTable,
  lyteDebtScoreHistoryTable,
  lyteDriftHistoryTable,
  lyteDriftItemsTable,
  lyteEntityEdgesTable,
  lyteEntityNodesTable,
  lytePressureCellsTable,
  lyteReplayScenariosTable,
} from '@szl-holdings/db';
import { sql } from 'drizzle-orm';
import { logger } from './logger';

const DRIFT_ITEMS = [
  {
    id: 'drift-001',
    title: 'Q2 Revenue Forecast Revision',
    program: 'Finance Planning',
    team: 'Finance + Strategy',
    staleDays: 11,
    owners: ['Sarah Lim (Finance)', 'David Osei (Strategy)'],
    evidence: [
      "Last edit: Apr 7 by Sarah Lim — marked 'awaiting Strategy sign-off'",
      'David Osei opened doc Apr 8 — no changes made',
      "Alloy workflow paused at 'strategy-review' node for 9 days",
      'Board deck assembly blocked on this output since Apr 12',
    ],
    status: 'critical',
    lastActivity: 'Apr 8',
    impact: 'Board deck cannot be finalized without updated forecast.',
    proofRef: 'ALLOY-W-0221',
    orderIdx: 0,
  },
  {
    id: 'drift-002',
    title: 'Vantex Procurement Approval — Step 2 Holder',
    program: 'Pipeline Execution',
    team: 'Procurement',
    staleDays: 39,
    owners: ['Tyler Raines (Procurement Lead)'],
    evidence: [
      'Waiting on void Step 1 for 39 days',
      '3 internal escalation attempts unresolved',
      'No successor designated in org chart',
    ],
    status: 'critical',
    lastActivity: 'Apr 3',
    impact: 'Approval chain fully frozen. $4.2M at risk.',
    proofRef: 'LYTE-W-0491',
    orderIdx: 1,
  },
  {
    id: 'drift-003',
    title: 'Product Roadmap Q3 Lock',
    program: 'Product Planning',
    team: 'Product + Engineering',
    staleDays: 7,
    owners: ['Maria Santos (PM)', 'Raj Patel (Eng Lead)'],
    evidence: [
      'Roadmap document in draft since Apr 11',
      'Engineering blocked on design completion',
      '3 open threads unresolved on Notion',
    ],
    status: 'warn',
    lastActivity: 'Apr 13',
    impact: 'Sprint planning delayed. 2 engineering teams blocked.',
    proofRef: 'ALLOY-W-0312',
    orderIdx: 2,
  },
];

const DRIFT_HISTORY = [
  { date: 'Apr 1', count: 2, orderIdx: 0 },
  { date: 'Apr 4', count: 3, orderIdx: 1 },
  { date: 'Apr 7', count: 3, orderIdx: 2 },
  { date: 'Apr 10', count: 4, orderIdx: 3 },
  { date: 'Apr 13', count: 5, orderIdx: 4 },
  { date: 'Apr 16', count: 6, orderIdx: 5 },
];

const PRESSURE_CELLS = [
  {
    team: 'Procurement',
    workflow: 'Vantex Approval Chain',
    account: 'Vantex Capital LLC',
    program: 'Q2 Pipeline',
    sponsor: 'Marcus Holt',
    openCount: 3,
    overdue: 3,
    blocked: 2,
    escalated: 1,
    score: 98,
    orderIdx: 0,
  },
  {
    team: 'Finance + Strategy',
    workflow: 'Q2 Forecast Revision',
    account: 'Meridian Capital Group',
    program: 'Finance Planning',
    sponsor: 'Sarah Lim',
    openCount: 4,
    overdue: 2,
    blocked: 1,
    escalated: 1,
    score: 82,
    orderIdx: 1,
  },
  {
    team: 'Legal',
    workflow: 'Vantex Legal Review',
    account: 'Vantex Capital LLC',
    program: 'Q2 Pipeline',
    sponsor: 'Ana Kovac',
    openCount: 1,
    overdue: 1,
    blocked: 1,
    escalated: 0,
    score: 78,
    orderIdx: 2,
  },
  {
    team: 'Sales',
    workflow: 'Q2 Pipeline Execution',
    account: 'Multiple',
    program: 'Revenue Operations',
    sponsor: 'Sarah Kim',
    openCount: 8,
    overdue: 3,
    blocked: 2,
    escalated: 2,
    score: 71,
    orderIdx: 3,
  },
  {
    team: 'HR Ops',
    workflow: 'Offboarding — Chris Wade',
    account: 'Internal',
    program: 'Operations',
    sponsor: 'HR Director',
    openCount: 1,
    overdue: 1,
    blocked: 0,
    escalated: 0,
    score: 65,
    orderIdx: 4,
  },
  {
    team: 'Marketing',
    workflow: 'Q2 Budget Reallocation',
    account: 'Internal',
    program: 'Marketing Ops',
    sponsor: 'CMO',
    openCount: 2,
    overdue: 1,
    blocked: 0,
    escalated: 0,
    score: 44,
    orderIdx: 5,
  },
];

const DEBT_SCORE_HISTORY = [
  { date: 'Apr 1', critical: 1, high: 2, medium: 3, orderIdx: 0 },
  { date: 'Apr 4', critical: 1, high: 2, medium: 4, orderIdx: 1 },
  { date: 'Apr 7', critical: 2, high: 3, medium: 3, orderIdx: 2 },
  { date: 'Apr 10', critical: 2, high: 3, medium: 4, orderIdx: 3 },
  { date: 'Apr 13', critical: 2, high: 4, medium: 4, orderIdx: 4 },
  { date: 'Apr 16', critical: 2, high: 4, medium: 5, orderIdx: 5 },
];

const DEBT_ITEMS = [
  {
    id: 'debt-001',
    title: 'Vantex Approval Chain — 47 days without resolution',
    team: 'Procurement + BD',
    owner: '[VOID]',
    type: 'blocked',
    score: 98,
    ageDays: 47,
    escalations: 3,
    program: 'Q2 Pipeline',
    evidence: [
      'Approval chain void at step 1',
      '3 escalation attempts blocked',
      'CFO escalation pending',
    ],
    proofRef: 'LYTE-W-0491',
    status: 'critical',
    orderIdx: 0,
  },
  {
    id: 'debt-002',
    title: 'Q2 Revenue Forecast Revision — awaiting sign-off 11 days',
    team: 'Finance + Strategy',
    owner: 'David Osei',
    type: 'overdue',
    score: 82,
    ageDays: 11,
    escalations: 1,
    program: 'Finance Planning',
    evidence: ['Last activity: Apr 8', 'Board deck blocked', 'Alloy workflow paused'],
    proofRef: 'ALLOY-W-0221',
    status: 'critical',
    orderIdx: 1,
  },
  {
    id: 'debt-003',
    title: 'Legal Review Package — blocked on procurement',
    team: 'Legal',
    owner: 'Ana Kovac',
    type: 'blocked',
    score: 78,
    ageDays: 30,
    escalations: 0,
    program: 'Q2 Pipeline',
    evidence: ['Blocked waiting on step 2', 'SLA breach: 10 days'],
    proofRef: 'LYTE-WF-003',
    status: 'warn',
    orderIdx: 2,
  },
  {
    id: 'debt-004',
    title: 'Portfolio scan recommendation — unaddressed 3 days',
    team: 'Portfolio Management',
    owner: 'Portfolio Manager',
    type: 'looping',
    score: 61,
    ageDays: 3,
    escalations: 0,
    program: 'Portfolio Risk',
    evidence: ['3 companies identified', '$7.2M at risk', 'No action taken'],
    proofRef: 'LYTE-RUN-006',
    status: 'warn',
    orderIdx: 3,
  },
];

const REPLAY_SCENARIOS = [
  {
    id: 'replay-vantex',
    title: 'Vantex Acquisition — Approval Chain Recovery',
    decision: 'CFO emergency override — void step 1, reassign to Sarah Kim',
    outcome: 'Deal reactivated. Q2 close probability: 74%. Buyer re-engaged within 4 hours.',
    dateRange: 'Apr 14–15, 2026',
    orderIdx: 0,
    events: [
      {
        id: 're-01',
        timestamp: '2026-04-14T08:22:00Z',
        actor: 'Lyte Signal Scanner',
        role: 'System',
        action: 'Signal detected',
        signal: 'approval_chain_stall',
        detail:
          'Approval chain frozen 47 days. Revenue at risk: $4.2M. 3 escalation attempts exhausted.',
        evidenceType: 'system',
        proofRef: 'LYTE-W-0491',
      },
      {
        id: 're-02',
        timestamp: '2026-04-14T08:24:00Z',
        actor: 'Lyte Decision Engine',
        role: 'AI Agent',
        action: 'Recommendation generated',
        detail:
          'rec-001 generated: Emergency CFO escalation. Confidence: 87%. Submitted to approval queue.',
        evidenceType: 'alloy',
        proofRef: 'LYTE-REC-001',
      },
      {
        id: 're-03',
        timestamp: '2026-04-14T08:30:00Z',
        actor: 'Lyte Simulation Engine',
        role: 'AI Agent',
        action: 'Simulation run',
        detail:
          '3 scenarios modeled. CFO escalation: 74% close, 3d recovery. Partial: 51%. No action: 12%.',
        evidenceType: 'alloy',
        proofRef: 'LYTE-RUN-007',
      },
      {
        id: 're-04',
        timestamp: '2026-04-14T08:45:00Z',
        actor: 'Marcus Holt',
        role: 'CFO',
        action: 'Reviewed recommendation + simulation',
        detail:
          'Reviewed rec-001 in Decision Center. Viewed all 3 simulation scenarios. Evidence chain confirmed.',
        evidenceType: 'human',
        proofRef: 'LYTE-PEVAL-004',
      },
      {
        id: 're-05',
        timestamp: '2026-04-14T09:11:00Z',
        actor: 'Marcus Holt',
        role: 'CFO',
        action: 'Approved executive override',
        detail:
          "Approved: void step 1, assign Sarah Kim, join buyer call. Note: 'I will join the next buyer call personally.'",
        evidenceType: 'human',
        proofRef: 'LYTE-W-0491',
      },
      {
        id: 're-06',
        timestamp: '2026-04-14T09:14:00Z',
        actor: 'Lyte Alloy',
        role: 'System',
        action: 'Approval chain updated',
        detail:
          'Step 1 voided. Sarah Kim designated new approval owner. Chain unblocked. Steps 2–4 can now proceed.',
        evidenceType: 'alloy',
        proofRef: 'LYTE-WF-001',
      },
      {
        id: 're-07',
        timestamp: '2026-04-14T09:58:00Z',
        actor: 'Lyte Alloy',
        role: 'System',
        action: 'Downstream actions executed',
        detail:
          '4 actions completed: ownership reassigned, buyer email queued, CFO calendar block created, monitoring reactivated.',
        evidenceType: 'alloy',
        proofRef: 'LYTE-WF-002',
      },
      {
        id: 're-08',
        timestamp: '2026-04-14T14:22:00Z',
        actor: 'David Chen (Vantex)',
        role: 'External — Buyer',
        action: 'Buyer re-engaged',
        detail:
          "David Chen responded to CFO outreach: 'Let's reconnect this week — appreciate the personal reach-out.' Deal reactivated.",
        evidenceType: 'human',
        proofRef: 'LYTE-EV-003',
      },
    ],
  },
];

const BOARD_METRICS = [
  {
    label: 'Action Debt Index',
    value: '43',
    delta: '+7 this week',
    trend: 'up',
    context: 'Items blocked, stalled, or looping without resolution — threshold: 30',
    good: 'down',
    orderIdx: 0,
  },
  {
    label: 'Ownership Drift',
    value: '6',
    delta: '+2 vs last week',
    trend: 'up',
    context: 'Decisions awaiting sign-off with no owner action in >7 days',
    good: 'down',
    orderIdx: 1,
  },
  {
    label: 'At-Risk ARR',
    value: '$4.2M',
    delta: '+$1.1M',
    trend: 'up',
    context: 'Revenue at risk this quarter from detected pipeline and approval stalls',
    good: 'down',
    orderIdx: 2,
  },
  {
    label: 'Workflow Health',
    value: '62%',
    delta: '-11pp',
    trend: 'down',
    context: 'Share of tracked workflows with no active bottleneck',
    good: 'up',
    orderIdx: 3,
  },
];

const BOARD_RISKS = [
  {
    id: 'risk-001',
    title: 'Vantex Approval Chain — $4.2M Q2 deal frozen 47 days',
    severity: 'critical',
    domain: 'Pipeline / Revenue',
    signal:
      'Approval chain void at step 1. Original owner departed without handoff. 3 escalation attempts blocked.',
    recommendation:
      'CFO invokes authority override, voids step 1, assigns Sarah Kim, joins buyer call personally.',
    proofRef: 'LYTE-W-0491',
    interventionOwner: 'Marcus Holt (CFO)',
    deadline: '2026-04-21',
    orderIdx: 0,
  },
  {
    id: 'risk-002',
    title: 'Q2 Revenue Forecast — Board deck blocked 11 days on missing sign-off',
    severity: 'high',
    domain: 'Finance Planning',
    signal:
      'Strategy sign-off on forecast revision pending since Apr 7. Board deck assembly stalled.',
    recommendation:
      'David Osei (Strategy) to complete review by Apr 19. Finance Director escalates if not complete.',
    proofRef: 'ALLOY-W-0221',
    interventionOwner: 'David Osei (Strategy)',
    deadline: '2026-04-19',
    orderIdx: 1,
  },
  {
    id: 'risk-003',
    title: 'Portfolio scan — 3 additional approval chains at $7.2M risk',
    severity: 'high',
    domain: 'Portfolio Risk',
    signal: '3 portfolio companies show same pattern as Vantex: departed owners, stalled chains.',
    recommendation:
      'Deploy platform-wide audit. Require offboarding attestation. Reassign or void stalled steps.',
    proofRef: 'LYTE-REC-002',
    interventionOwner: 'Sarah Kim (VP BD) + HR',
    deadline: '2026-04-30',
    orderIdx: 2,
  },
  {
    id: 'risk-004',
    title: 'Q2 Marketing Budget — $340K expires if reallocation not approved',
    severity: 'medium',
    domain: 'Finance / Marketing',
    signal: '23% of Q2 marketing budget unallocated with 42 days until expiry. No carryover.',
    recommendation: 'Finance Director approves reallocation to pipeline acceleration programs.',
    proofRef: 'LYTE-W-0499',
    interventionOwner: 'Finance Director',
    deadline: '2026-06-30',
    orderIdx: 3,
  },
];

const ENTITY_NODES = [
  {
    id: 'lyte-opp-vantex-001',
    type: 'opportunity',
    label: 'Vantex Acquisition',
    sublabel: '$4.2M · 47d stalled',
    status: 'stalled',
    policyState: 'flagged',
    confidence: 0.91,
    freshness: 'stale',
    x: 400,
    y: 200,
    metadata: { estimatedValueUsd: 4200000, closeProbability: 0.31, stalledDays: 47 },
    orderIdx: 0,
  },
  {
    id: 'lyte-chain-vantex-001',
    type: 'approval_chain',
    label: 'Procurement Approval Chain',
    sublabel: 'Step 1/4 — void owner',
    status: 'stalled',
    policyState: 'blocked',
    confidence: 0.96,
    freshness: 'live',
    x: 400,
    y: 360,
    metadata: { currentStep: 1, totalSteps: 4, stalledDays: 47 },
    orderIdx: 1,
  },
  {
    id: 'lyte-proj-q2-pipeline-001',
    type: 'project',
    label: 'Q2 Pipeline Execution',
    sublabel: '$7.8M at risk · 3 blockers',
    status: 'at_risk',
    policyState: 'flagged',
    confidence: 0.89,
    freshness: 'live',
    x: 160,
    y: 200,
    metadata: { blockerCount: 3, valueAtRiskUsd: 7800000 },
    orderIdx: 2,
  },
  {
    id: 'lyte-sh-chris-001',
    type: 'stakeholder',
    label: 'Chris Wade',
    sublabel: 'VP BD · Departed',
    status: 'void',
    policyState: 'blocked',
    confidence: 1.0,
    freshness: 'expired',
    x: 160,
    y: 400,
    metadata: { role: 'VP BD', approvalAuthority: true },
    orderIdx: 3,
  },
  {
    id: 'lyte-sh-tyler-001',
    type: 'stakeholder',
    label: 'Tyler Raines',
    sublabel: 'Procurement Lead · Stalled',
    status: 'stalled',
    policyState: 'pending',
    confidence: 0.9,
    freshness: 'recent',
    x: 340,
    y: 500,
    metadata: { role: 'Procurement Lead', approvalAuthority: true },
    orderIdx: 4,
  },
  {
    id: 'lyte-sh-ana-001',
    type: 'stakeholder',
    label: 'Ana Kovac',
    sublabel: 'General Counsel · Waiting',
    status: 'pending',
    policyState: 'pending',
    confidence: 0.88,
    freshness: 'recent',
    x: 500,
    y: 500,
    metadata: { role: 'General Counsel', approvalAuthority: true },
    orderIdx: 5,
  },
  {
    id: 'lyte-sh-marcus-001',
    type: 'stakeholder',
    label: 'Marcus Holt',
    sublabel: 'CFO · Escalation Target',
    status: 'active',
    policyState: 'cleared',
    confidence: 0.95,
    freshness: 'live',
    x: 640,
    y: 360,
    metadata: { role: 'CFO', approvalAuthority: true },
    orderIdx: 6,
  },
  {
    id: 'lyte-sh-sarah-001',
    type: 'stakeholder',
    label: 'Sarah Kim',
    sublabel: 'VP BD · New Owner',
    status: 'active',
    policyState: 'cleared',
    confidence: 0.92,
    freshness: 'live',
    x: 600,
    y: 200,
    metadata: { role: 'VP BD', approvalAuthority: false },
    orderIdx: 7,
  },
  {
    id: 'lyte-del-proposal-001',
    type: 'deliverable',
    label: 'Buyer Proposal v3',
    sublabel: 'Stalled 22d',
    status: 'stalled',
    policyState: 'blocked',
    confidence: 0.88,
    freshness: 'stale',
    x: 200,
    y: 320,
    metadata: { type: 'presentation', stalledDays: 22 },
    orderIdx: 8,
  },
  {
    id: 'lyte-del-legal-001',
    type: 'deliverable',
    label: 'Legal Review Package',
    sublabel: 'Blocked 30d',
    status: 'blocked',
    policyState: 'blocked',
    confidence: 0.85,
    freshness: 'stale',
    x: 590,
    y: 465,
    metadata: { type: 'contract', stalledDays: 30 },
    orderIdx: 9,
  },
];

const ENTITY_EDGES = [
  {
    id: 'e-01',
    sourceId: 'lyte-opp-vantex-001',
    targetId: 'lyte-chain-vantex-001',
    label: 'requires',
    strength: 'strong',
    status: 'stalled',
    proofRef: 'LYTE-W-0491',
    orderIdx: 0,
  },
  {
    id: 'e-02',
    sourceId: 'lyte-proj-q2-pipeline-001',
    targetId: 'lyte-opp-vantex-001',
    label: 'contains',
    strength: 'strong',
    status: 'stalled',
    proofRef: 'LYTE-W-0491',
    orderIdx: 1,
  },
  {
    id: 'e-03',
    sourceId: 'lyte-chain-vantex-001',
    targetId: 'lyte-sh-chris-001',
    label: 'step 1 owner (void)',
    strength: 'strong',
    status: 'broken',
    proofRef: 'LYTE-W-0491',
    orderIdx: 2,
  },
  {
    id: 'e-04',
    sourceId: 'lyte-chain-vantex-001',
    targetId: 'lyte-sh-tyler-001',
    label: 'step 2 owner (stalled)',
    strength: 'strong',
    status: 'stalled',
    proofRef: 'LYTE-W-0491',
    orderIdx: 3,
  },
  {
    id: 'e-05',
    sourceId: 'lyte-chain-vantex-001',
    targetId: 'lyte-sh-ana-001',
    label: 'step 3 (pending)',
    strength: 'weak',
    status: 'stalled',
    proofRef: 'LYTE-W-0491',
    orderIdx: 4,
  },
  {
    id: 'e-06',
    sourceId: 'lyte-chain-vantex-001',
    targetId: 'lyte-sh-marcus-001',
    label: 'escalation target',
    strength: 'strong',
    status: 'active',
    proofRef: 'LYTE-REC-001',
    orderIdx: 5,
  },
  {
    id: 'e-07',
    sourceId: 'lyte-opp-vantex-001',
    targetId: 'lyte-sh-sarah-001',
    label: 'assigned owner',
    strength: 'strong',
    status: 'active',
    proofRef: 'LYTE-REC-001',
    orderIdx: 6,
  },
  {
    id: 'e-08',
    sourceId: 'lyte-proj-q2-pipeline-001',
    targetId: 'lyte-del-proposal-001',
    label: 'produces',
    strength: 'strong',
    status: 'stalled',
    proofRef: 'LYTE-W-0491',
    orderIdx: 7,
  },
  {
    id: 'e-09',
    sourceId: 'lyte-chain-vantex-001',
    targetId: 'lyte-del-legal-001',
    label: 'blocks',
    strength: 'strong',
    status: 'broken',
    proofRef: 'LYTE-W-0491',
    orderIdx: 8,
  },
  {
    id: 'e-10',
    sourceId: 'lyte-sh-tyler-001',
    targetId: 'lyte-sh-marcus-001',
    label: 'escalates to',
    strength: 'weak',
    status: 'active',
    proofRef: 'LYTE-REC-001',
    orderIdx: 9,
  },
];

async function seedTable<T>(
  name: string,
  table: { _: { name: string } },
  rows: T[],
  insertFn: (rows: T[]) => Promise<unknown>,
): Promise<void> {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(table as Parameters<typeof db.select>[0] extends never ? never : any);
  if (count > 0) {
    logger.info({ count, table: name }, '[seed-lyte-surfaces] Already seeded — skipping');
    return;
  }
  await insertFn(rows);
  logger.info({ count: rows.length, table: name }, '[seed-lyte-surfaces] Seeded');
}

export async function seedLyteSurfaces(): Promise<void> {
  try {
    await seedTable('lyte_drift_items', lyteDriftItemsTable, DRIFT_ITEMS, async (rows) => {
      await db.insert(lyteDriftItemsTable).values(rows as never);
    });
    await seedTable('lyte_drift_history', lyteDriftHistoryTable, DRIFT_HISTORY, async (rows) => {
      await db.insert(lyteDriftHistoryTable).values(rows as never);
    });
    await seedTable('lyte_pressure_cells', lytePressureCellsTable, PRESSURE_CELLS, async (rows) => {
      await db.insert(lytePressureCellsTable).values(rows as never);
    });
    await seedTable('lyte_debt_items', lyteDebtItemsTable, DEBT_ITEMS, async (rows) => {
      await db.insert(lyteDebtItemsTable).values(rows as never);
    });
    await seedTable(
      'lyte_debt_score_history',
      lyteDebtScoreHistoryTable,
      DEBT_SCORE_HISTORY,
      async (rows) => {
        await db.insert(lyteDebtScoreHistoryTable).values(rows as never);
      },
    );
    await seedTable(
      'lyte_replay_scenarios',
      lyteReplayScenariosTable,
      REPLAY_SCENARIOS,
      async (rows) => {
        await db.insert(lyteReplayScenariosTable).values(rows as never);
      },
    );
    await seedTable('lyte_board_metrics', lyteBoardMetricsTable, BOARD_METRICS, async (rows) => {
      await db.insert(lyteBoardMetricsTable).values(rows as never);
    });
    await seedTable('lyte_board_risks', lyteBoardRisksTable, BOARD_RISKS, async (rows) => {
      await db.insert(lyteBoardRisksTable).values(rows as never);
    });
    await seedTable(
      'lyte_entity_nodes',
      lyteEntityNodesTable,
      ENTITY_NODES,
      async (rows) => {
        await db.insert(lyteEntityNodesTable).values(rows as never);
      },
    );
    await seedTable(
      'lyte_entity_edges',
      lyteEntityEdgesTable,
      ENTITY_EDGES,
      async (rows) => {
        await db.insert(lyteEntityEdgesTable).values(rows as never);
      },
    );
  } catch (err) {
    logger.warn({ err }, '[seed-lyte-surfaces] Seed failed (non-fatal)');
  }
}
