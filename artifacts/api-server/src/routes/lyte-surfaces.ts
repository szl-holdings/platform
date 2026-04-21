/**
 * Lyte Surfaces — read-only API endpoints for the 5 legacy decision-intelligence
 * surfaces (Ownership Drift, Pressure Map, Action Debt Index, Decision Replay,
 * Board View). Backed by lyte_* tables seeded at boot.
 *
 * Mounted in routes/index.ts BEFORE the lyte group so the tenantScope middleware
 * registered at "/lyte" never intercepts these public read endpoints. Paths are
 * also whitelisted in global-auth-enforcer.ts.
 */

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
import { asc, eq } from 'drizzle-orm';
import { type IRouter, Router } from 'express';
import { authMiddleware } from '../middlewares/auth';

const router: IRouter = Router();
const noAuth = authMiddleware({ required: false });

router.get('/lyte/ownership-drift', noAuth, async (_req, res) => {
  try {
    const [items, history] = await Promise.all([
      db.select().from(lyteDriftItemsTable).orderBy(asc(lyteDriftItemsTable.orderIdx)),
      db.select().from(lyteDriftHistoryTable).orderBy(asc(lyteDriftHistoryTable.orderIdx)),
    ]);
    res.json({
      items: items.map((i) => ({
        id: i.id,
        title: i.title,
        program: i.program,
        team: i.team,
        staleDays: i.staleDays,
        owners: i.owners,
        evidence: i.evidence,
        status: i.status,
        lastActivity: i.lastActivity,
        impact: i.impact,
        proofRef: i.proofRef,
      })),
      history: history.map((h) => ({ date: h.date, count: h.count })),
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/lyte/pressure-map', noAuth, async (_req, res) => {
  try {
    const cells = await db
      .select()
      .from(lytePressureCellsTable)
      .orderBy(asc(lytePressureCellsTable.orderIdx));
    res.json({
      cells: cells.map((c) => ({
        team: c.team,
        workflow: c.workflow,
        account: c.account,
        program: c.program,
        sponsor: c.sponsor,
        open: c.openCount,
        overdue: c.overdue,
        blocked: c.blocked,
        escalated: c.escalated,
        score: c.score,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/lyte/action-debt', noAuth, async (_req, res) => {
  try {
    const [items, history] = await Promise.all([
      db.select().from(lyteDebtItemsTable).orderBy(asc(lyteDebtItemsTable.orderIdx)),
      db.select().from(lyteDebtScoreHistoryTable).orderBy(asc(lyteDebtScoreHistoryTable.orderIdx)),
    ]);
    res.json({
      items: items.map((i) => ({
        id: i.id,
        title: i.title,
        team: i.team,
        owner: i.owner,
        type: i.type,
        score: i.score,
        ageDays: i.ageDays,
        escalations: i.escalations,
        program: i.program,
        evidence: i.evidence,
        proofRef: i.proofRef,
        status: i.status,
      })),
      history: history.map((h) => ({
        date: h.date,
        critical: h.critical,
        high: h.high,
        medium: h.medium,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/lyte/decision-replay', noAuth, async (_req, res) => {
  try {
    const scenarios = await db
      .select()
      .from(lyteReplayScenariosTable)
      .orderBy(asc(lyteReplayScenariosTable.orderIdx));
    res.json({
      scenarios: scenarios.map((s) => ({
        id: s.id,
        title: s.title,
        decision: s.decision,
        outcome: s.outcome,
        dateRange: s.dateRange,
        events: s.events,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/lyte/decision-replay/:id', noAuth, async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(lyteReplayScenariosTable)
      .where(eq(lyteReplayScenariosTable.id, req.params.id!))
      .limit(1);
    if (rows.length === 0) {
      res.status(404).json({ error: 'Scenario not found' });
      return;
    }
    const s = rows[0]!;
    res.json({
      scenario: {
        id: s.id,
        title: s.title,
        decision: s.decision,
        outcome: s.outcome,
        dateRange: s.dateRange,
        events: s.events,
      },
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Provenance config per workflow — static metadata linking pressure cells to enriched context.
// Live metrics (blockerCount, overdue, score) come from lytePressureCellsTable at request time;
// drift.staleDays comes from lyteDriftItemsTable joined by team.
const WORKFLOW_CONFIG: Record<
  string,
  {
    id: string;
    type: string;
    slaBreach: boolean;
    slaDeadline: string;
    proofRef: string;
    lastActivity: string;
    lastReviewedAt: string;
    linkedEntityId: string | null;
    linkedEntityLabel: string | null;
    bottleneckStep: string | null;
    bottleneckOwner: string | null;
    valueAtRiskUsd: number;
  }
> = {
  'Vantex Approval Chain': {
    id: 'wf-001',
    type: 'approval',
    slaBreach: true,
    slaDeadline: '2026-03-31',
    proofRef: 'LYTE-WF-001',
    lastActivity: '2026-02-28',
    lastReviewedAt: '2026-02-01',
    linkedEntityId: 'lyte-chain-vantex-001',
    linkedEntityLabel: 'Vantex Procurement Approval Chain',
    bottleneckStep: 'BD Qualification Sign-off',
    bottleneckOwner: 'VOID — original owner departed',
    valueAtRiskUsd: 4200000,
  },
  'Q2 Pipeline Execution': {
    id: 'wf-003',
    type: 'execution',
    slaBreach: false,
    slaDeadline: '2026-06-30',
    proofRef: 'LYTE-WF-003',
    lastActivity: '2026-04-13',
    lastReviewedAt: '2026-03-20',
    linkedEntityId: 'lyte-proj-q2-pipeline-001',
    linkedEntityLabel: 'Q2 Pipeline Execution',
    bottleneckStep: 'Approval Gate — Vantex',
    bottleneckOwner: 'Approval chain void',
    valueAtRiskUsd: 7800000,
  },
  'Vantex Legal Review': {
    id: 'wf-004',
    type: 'review',
    slaBreach: true,
    slaDeadline: '2026-04-08',
    proofRef: 'LYTE-WF-004',
    lastActivity: '2026-03-22',
    lastReviewedAt: '2026-03-01',
    linkedEntityId: 'lyte-del-legal-001',
    linkedEntityLabel: 'Legal Review Package — Vantex',
    bottleneckStep: 'Awaiting Procurement clearance',
    bottleneckOwner: 'Tyler Raines (Procurement Lead)',
    valueAtRiskUsd: 4200000,
  },
  'Q2 Forecast Revision': {
    id: 'wf-005',
    type: 'review',
    slaBreach: false,
    slaDeadline: '2026-04-30',
    proofRef: 'LYTE-WF-005',
    lastActivity: '2026-04-08',
    lastReviewedAt: '2026-04-08',
    linkedEntityId: null,
    linkedEntityLabel: null,
    bottleneckStep: 'Strategy sign-off pending',
    bottleneckOwner: 'David Osei (Strategy)',
    valueAtRiskUsd: 0,
  },
  'Offboarding — Chris Wade': {
    id: 'wf-006',
    type: 'onboarding',
    slaBreach: false,
    slaDeadline: '2026-04-30',
    proofRef: 'LYTE-WF-006',
    lastActivity: '2026-04-10',
    lastReviewedAt: '2026-04-08',
    linkedEntityId: null,
    linkedEntityLabel: null,
    bottleneckStep: null,
    bottleneckOwner: null,
    valueAtRiskUsd: 0,
  },
  'Q2 Budget Reallocation': {
    id: 'wf-007',
    type: 'execution',
    slaBreach: false,
    slaDeadline: '2026-05-31',
    proofRef: 'LYTE-WF-007',
    lastActivity: '2026-04-15',
    lastReviewedAt: '2026-04-14',
    linkedEntityId: null,
    linkedEntityLabel: null,
    bottleneckStep: null,
    bottleneckOwner: null,
    valueAtRiskUsd: 0,
  },
};

function computeStatus(
  blocked: number,
  overdue: number,
  score: number,
): 'stalled' | 'blocked' | 'at_risk' | 'on_track' | 'complete' {
  if (blocked >= 2 || score >= 90) return 'stalled';
  if (blocked >= 1 || score >= 70) return 'blocked';
  if (overdue >= 2 || score >= 50) return 'at_risk';
  return 'on_track';
}

router.get('/lyte/workflow-health', noAuth, async (_req, res) => {
  try {
    const [pressureCells, driftItems, debtItems] = await Promise.all([
      db.select().from(lytePressureCellsTable).orderBy(asc(lytePressureCellsTable.orderIdx)),
      db.select().from(lyteDriftItemsTable).orderBy(asc(lyteDriftItemsTable.orderIdx)),
      db.select().from(lyteDebtItemsTable).orderBy(asc(lyteDebtItemsTable.orderIdx)),
    ]);

    // Build a lookup: team → staleDays from drift items
    const driftByTeam = new Map<string, number>();
    for (const d of driftItems) {
      const existing = driftByTeam.get(d.team) ?? 0;
      if (d.staleDays > existing) driftByTeam.set(d.team, d.staleDays);
    }

    // Map pressure cells → workflow health items with live metrics
    const workflows = pressureCells.map((cell) => {
      const config = WORKFLOW_CONFIG[cell.workflow] ?? null;
      const driftDays = driftByTeam.get(cell.team) ?? 0;
      const status = computeStatus(cell.blocked, cell.overdue, cell.score);
      // progress: invert the risk score (score=98 → progress=2%, score=44 → progress=56%)
      const progress = Math.max(0, Math.round(100 - cell.score));

      return {
        id: config?.id ?? `wf-${cell.workflow.toLowerCase().replace(/\s+/g, '-')}`,
        name: cell.workflow,
        type: config?.type ?? 'execution',
        owner: cell.sponsor,
        team: cell.team,
        account: cell.account,
        program: cell.program,
        status,
        progress,
        stalledDays: cell.overdue > 0 ? driftDays : 0,
        blockerCount: cell.blocked,
        valueAtRiskUsd: config?.valueAtRiskUsd ?? 0,
        bottleneckStep: config?.bottleneckStep ?? null,
        bottleneckOwner: config?.bottleneckOwner ?? null,
        linkedEntityId: config?.linkedEntityId ?? null,
        linkedEntityLabel: config?.linkedEntityLabel ?? null,
        slaDeadline: config?.slaDeadline ?? null,
        slaBreach: config?.slaBreach ?? false,
        proofRef: config?.proofRef ?? `LYTE-PC-${cell.team.toUpperCase().slice(0, 4)}`,
        lastActivity: config?.lastActivity ?? new Date().toISOString().slice(0, 10),
        lastReviewedAt: config?.lastReviewedAt ?? new Date().toISOString().slice(0, 10),
        driftDays,
        // Live DB-sourced provenance fields
        liveMetrics: {
          openCount: cell.openCount,
          overdue: cell.overdue,
          blocked: cell.blocked,
          escalated: cell.escalated,
          pressureScore: cell.score,
        },
      };
    });

    const summary = {
      total: workflows.length,
      slaBreaches: workflows.filter((w) => w.slaBreach).length,
      blocked: workflows.filter((w) => w.status === 'blocked').length,
      stalled: workflows.filter((w) => w.status === 'stalled').length,
      totalValueAtRiskUsd: workflows.reduce((s, w) => s + (w.valueAtRiskUsd ?? 0), 0),
      openDriftItems: driftItems.filter((d) => d.status !== 'cleared').length,
      openDebtItems: debtItems.filter((d) => d.status !== 'resolved').length,
    };

    res.json({ workflows, summary });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/lyte/entity-graph', noAuth, async (_req, res) => {
  try {
    const [nodes, edges] = await Promise.all([
      db.select().from(lyteEntityNodesTable).orderBy(asc(lyteEntityNodesTable.orderIdx)),
      db.select().from(lyteEntityEdgesTable).orderBy(asc(lyteEntityEdgesTable.orderIdx)),
    ]);
    res.json({
      nodes: nodes.map((n) => ({
        id: n.id,
        label: n.label,
        type: n.type,
        status: n.status,
        sublabel: n.sublabel,
        policyState: n.policyState,
        confidence: n.confidence,
        freshness: n.freshness,
        x: n.x,
        y: n.y,
        metadata: n.metadata ?? {},
      })),
      edges: edges.map((e) => ({
        id: e.id,
        sourceId: e.sourceId,
        targetId: e.targetId,
        label: e.label,
        status: e.status,
        strength: e.strength,
        proofRef: e.proofRef,
      })),
      provenance: {
        source: 'lyte_entity_nodes / lyte_entity_edges',
        fetchedAt: new Date().toISOString(),
        nodeCount: nodes.length,
        edgeCount: edges.length,
      },
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/lyte/board-view', noAuth, async (_req, res) => {
  try {
    const [metrics, risks] = await Promise.all([
      db.select().from(lyteBoardMetricsTable).orderBy(asc(lyteBoardMetricsTable.orderIdx)),
      db.select().from(lyteBoardRisksTable).orderBy(asc(lyteBoardRisksTable.orderIdx)),
    ]);
    res.json({
      metrics: metrics.map((m) => ({
        label: m.label,
        value: m.value,
        delta: m.delta,
        trend: m.trend,
        context: m.context,
        good: m.good,
      })),
      risks: risks.map((r) => ({
        id: r.id,
        title: r.title,
        severity: r.severity,
        domain: r.domain,
        signal: r.signal,
        recommendation: r.recommendation,
        proofRef: r.proofRef,
        interventionOwner: r.interventionOwner,
        deadline: r.deadline,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
