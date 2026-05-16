import { Router, type Request, type Response } from 'express';
import { logger } from '../lib/logger';

const router = Router();
const now = () => new Date().toISOString();

interface AlloyDashboardSnapshot {
  totalWorkflows: number;
  totalRuns: number;
  runningRuns: number;
  pendingApprovals: number;
  failedRuns: number;
  successRate: number;
  avgDurationMs: number | null;
  workflowsByStatus: { status: string; count: number }[];
  recentActivity: Array<Record<string, unknown>>;
}

const FALLBACK: AlloyDashboardSnapshot = {
  totalWorkflows: 0,
  totalRuns: 0,
  runningRuns: 0,
  pendingApprovals: 0,
  failedRuns: 0,
  successRate: 100,
  avgDurationMs: null,
  workflowsByStatus: [],
  recentActivity: [],
};

async function loadSnapshot(): Promise<{ snapshot: AlloyDashboardSnapshot; source: 'db' | 'fallback' }> {
  try {
    const { db } = await import('@szl-holdings/db');
    const { alloyWorkflows, alloyWorkflowRuns, alloyApprovals, alloyAuditLog } = await import(
      '@szl-holdings/db/schema'
    );
    const { desc, eq } = await import('drizzle-orm');

    const [workflows, runs, pendingApprovals, recentAudit] = await Promise.all([
      db.select().from(alloyWorkflows).orderBy(desc(alloyWorkflows.createdAt)).limit(200),
      db.select().from(alloyWorkflowRuns).orderBy(desc(alloyWorkflowRuns.startedAt)).limit(200),
      db.select().from(alloyApprovals).where(eq(alloyApprovals.status, 'pending')).limit(50),
      db.select().from(alloyAuditLog).orderBy(desc(alloyAuditLog.createdAt)).limit(10),
    ]);

    const running = runs.filter((r) => r.status === 'started').length;
    const failed = runs.filter((r) => r.status === 'failed').length;
    const completed = runs.filter((r) => r.status === 'completed').length;
    const successRate = runs.length > 0 ? Math.round((completed / runs.length) * 100) : 100;
    const completedWithDuration = runs.filter((r) => r.durationMs && r.status === 'completed');
    const avgDurationMs =
      completedWithDuration.length > 0
        ? Math.round(
            completedWithDuration.reduce((s, r) => s + (r.durationMs ?? 0), 0) /
              completedWithDuration.length,
          )
        : null;

    const statusCounts: Record<string, number> = {};
    for (const wf of workflows) statusCounts[wf.status] = (statusCounts[wf.status] ?? 0) + 1;

    return {
      snapshot: {
        totalWorkflows: workflows.length,
        totalRuns: runs.length,
        runningRuns: running,
        pendingApprovals: pendingApprovals.length,
        failedRuns: failed,
        successRate,
        avgDurationMs,
        workflowsByStatus: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
        recentActivity: recentAudit as Array<Record<string, unknown>>,
      },
      source: 'db',
    };
  } catch (err) {
    logger.warn({ err }, 'a11oy-dashboard: db unavailable, returning fallback snapshot');
    return { snapshot: FALLBACK, source: 'fallback' };
  }
}

router.get('/a11oy/dashboard', async (_req: Request, res: Response) => {
  const { snapshot, source } = await loadSnapshot();
  res.json({
    ok: true,
    data: snapshot,
    meta: {
      timestamp: now(),
      source,
      visibility: 'public',
      doctrine: 'V6',
    },
  });
});

export default router;
