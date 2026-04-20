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
