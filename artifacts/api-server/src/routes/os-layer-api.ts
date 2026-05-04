import {
  db,
  osRecommendationsTable,
  osSourceHealthTable,
  osRunsTable,
  osEvalResultsTable,
  osCommandKpisTable,
  osPlatformStatsTable,
} from '@szl-holdings/db';
import { eq, desc, and, sql } from 'drizzle-orm';
import { Router } from 'express';
import {
  handleRouteError,
  sendSuccess,
  sendNotFound,
  sendBadRequest,
} from '../lib/api-response';

const router = Router();

const VALID_VARIANTS = [
  'szl-holdings',
  'vessels',
  'carlota-jo',
  'aegis',
  'terra',
  'pulse',
  'command',
];

const isDev = process.env.NODE_ENV !== 'production';

async function seedVariant(variant: string): Promise<void> {
  const { getSeedData } = await import('../lib/os-layer-seed');
  const seed = getSeedData(variant);
  if (!seed) return;

  if (seed.recommendations.length > 0) {
    await db.insert(osRecommendationsTable).values(
      seed.recommendations.map((r: Record<string, unknown>) => ({
        recId: r.id as string,
        variant,
        priority: r.priority as string,
        status: (r.status as string) || 'pending',
        category: (r.category as string) || null,
        title: r.title as string,
        data: r,
      })),
    );
  }

  if (seed.sourceHealth.length > 0) {
    await db.insert(osSourceHealthTable).values(
      seed.sourceHealth.map((s: Record<string, unknown>) => ({
        sourceId: s.sourceId as string,
        variant,
        data: s,
      })),
    );
  }

  if (seed.runs.length > 0) {
    await db.insert(osRunsTable).values(
      seed.runs.map((r: Record<string, unknown>) => ({
        runId: r.id as string,
        variant,
        status: (r.status as string) || 'completed',
        data: r,
      })),
    );
  }

  if (seed.evalResults && seed.evalResults.length > 0) {
    const [existingEval] = await db
      .select({ id: osEvalResultsTable.id })
      .from(osEvalResultsTable)
      .limit(1);
    if (!existingEval) {
      await db.insert(osEvalResultsTable).values(
        seed.evalResults.map((e: Record<string, unknown>) => ({
          skillName: e.skillName as string,
          passRate: Math.round((e.passRate as number) * 10000),
          total: e.total as number,
          passed: e.passed as number,
          regressions: (e.regressions as number) || 0,
          trend: (e.trend as string) || 'stable',
          lastRunAt: new Date(e.lastRunAt as string),
        })),
      );
    }
  }
}

async function seedAllIfEmpty(): Promise<{ seeded: string[]; skipped: string[] }> {
  const seeded: string[] = [];
  const skipped: string[] = [];
  for (const v of VALID_VARIANTS) {
    const [existing] = await db
      .select({ id: osRecommendationsTable.id })
      .from(osRecommendationsTable)
      .where(eq(osRecommendationsTable.variant, v))
      .limit(1);
    if (!existing) {
      await seedVariant(v);
      seeded.push(v);
    } else {
      skipped.push(v);
    }
  }
  return { seeded, skipped };
}

if (isDev) {
  seedAllIfEmpty()
    .then(({ seeded }) => {
      if (seeded.length > 0) {
        console.log(`[os-layer] Dev seed: populated ${seeded.join(', ')}`);
      }
    })
    .catch((err) => {
      console.warn('[os-layer] Dev seed failed (non-fatal):', err?.message);
    });
}

router.post('/v1/os/seed', async (req, res) => {
  try {
    if (!isDev) {
      return sendBadRequest(res, 'Seeding is only available in development mode');
    }
    const result = await seedAllIfEmpty();
    sendSuccess(res, result);
  } catch (err) {
    handleRouteError(res, err, 'Failed to seed OS layer data');
  }
});

router.get('/v1/os/recommendations', async (req, res) => {
  try {
    const variant = req.query.variant as string | undefined;
    if (variant && !VALID_VARIANTS.includes(variant)) {
      return sendBadRequest(res, `Invalid variant: ${variant}`);
    }

    const conditions = variant
      ? [eq(osRecommendationsTable.variant, variant)]
      : [];
    const rows = await db
      .select()
      .from(osRecommendationsTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(osRecommendationsTable.createdAt));

    const recommendations = rows.map((r) => r.data);
    sendSuccess(res, recommendations);
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch recommendations');
  }
});

router.get('/v1/os/source-health', async (req, res) => {
  try {
    const variant = req.query.variant as string | undefined;
    if (variant && !VALID_VARIANTS.includes(variant)) {
      return sendBadRequest(res, `Invalid variant: ${variant}`);
    }

    const conditions = variant
      ? [eq(osSourceHealthTable.variant, variant)]
      : [];
    const rows = await db
      .select()
      .from(osSourceHealthTable)
      .where(conditions.length ? and(...conditions) : undefined);

    const sources = rows.map((r) => r.data);
    sendSuccess(res, sources);
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch source health');
  }
});

router.get('/v1/os/runs', async (req, res) => {
  try {
    const variant = req.query.variant as string | undefined;
    if (variant && !VALID_VARIANTS.includes(variant)) {
      return sendBadRequest(res, `Invalid variant: ${variant}`);
    }

    const conditions = variant
      ? [eq(osRunsTable.variant, variant)]
      : [];
    const rows = await db
      .select()
      .from(osRunsTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(osRunsTable.createdAt));

    const runs = rows.map((r) => r.data);
    sendSuccess(res, runs);
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch runs');
  }
});

router.get('/v1/os/eval-results', async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(osEvalResultsTable)
      .orderBy(desc(osEvalResultsTable.lastRunAt));

    const results = rows.map((r) => ({
      skillName: r.skillName,
      passRate: r.passRate / 10000,
      total: r.total,
      passed: r.passed,
      regressions: r.regressions,
      trend: r.trend,
      lastRunAt: r.lastRunAt.toISOString(),
    }));
    sendSuccess(res, results);
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch eval results');
  }
});

router.get('/v1/os/command/kpis', async (req, res) => {
  try {
    const recCounts = await db
      .select({
        variant: osRecommendationsTable.variant,
        total: sql<number>`count(*)`,
        pending: sql<number>`count(*) filter (where ${osRecommendationsTable.status} = 'pending')`,
        approved: sql<number>`count(*) filter (where ${osRecommendationsTable.status} = 'approved')`,
        rejected: sql<number>`count(*) filter (where ${osRecommendationsTable.status} = 'rejected')`,
      })
      .from(osRecommendationsTable)
      .groupBy(osRecommendationsTable.variant);

    const totalRecs = recCounts.reduce((sum, r) => sum + Number(r.total), 0);
    const pendingRecs = recCounts.reduce((sum, r) => sum + Number(r.pending), 0);
    const approvedRecs = recCounts.reduce((sum, r) => sum + Number(r.approved), 0);
    const activeVariants = recCounts.length;

    const healthRows = await db.select().from(osSourceHealthTable);
    const healthySources = healthRows.filter(
      (h) => (h.data as Record<string, unknown>).status === 'healthy',
    ).length;
    const totalSources = healthRows.length;

    const kpis = {
      totalRecommendations: totalRecs,
      pendingActions: pendingRecs,
      approvedActions: approvedRecs,
      activeVariants,
      sourceHealthRate: totalSources > 0 ? Math.round((healthySources / totalSources) * 100) : 100,
      healthySources,
      totalSources,
      byVariant: recCounts.map((r) => ({
        variant: r.variant,
        total: Number(r.total),
        pending: Number(r.pending),
        approved: Number(r.approved),
      })),
      computedAt: new Date().toISOString(),
    };

    sendSuccess(res, kpis);
  } catch (err) {
    handleRouteError(res, err, 'Failed to compute command KPIs');
  }
});

router.get('/v1/os/command/brief', async (req, res) => {
  try {
    const p0Recs = await db
      .select()
      .from(osRecommendationsTable)
      .where(
        and(
          eq(osRecommendationsTable.priority, 'P0'),
          eq(osRecommendationsTable.status, 'pending'),
        ),
      );

    const allPending = await db
      .select()
      .from(osRecommendationsTable)
      .where(eq(osRecommendationsTable.status, 'pending'));

    const totalValueAtRisk = allPending.reduce((sum, r) => {
      const data = r.data as Record<string, unknown>;
      return sum + ((data.valueAtRisk as number) || 0);
    }, 0);

    const brief = {
      headline:
        p0Recs.length > 0
          ? `${p0Recs.length} critical recommendation${p0Recs.length > 1 ? 's' : ''} require immediate attention`
          : 'All systems nominal — no critical actions pending',
      p0Count: p0Recs.length,
      pendingCount: allPending.length,
      totalValueAtRisk,
      criticalItems: p0Recs.map((r) => {
        const data = r.data as Record<string, unknown>;
        return {
          id: r.recId,
          variant: r.variant,
          title: r.title,
          valueAtRisk: data.valueAtRisk || 0,
        };
      }),
      generatedAt: new Date().toISOString(),
    };

    sendSuccess(res, brief);
  } catch (err) {
    handleRouteError(res, err, 'Failed to generate executive brief');
  }
});

router.get('/v1/os/command/watchlist', async (req, res) => {
  try {
    const highPriority = await db
      .select()
      .from(osRecommendationsTable)
      .where(eq(osRecommendationsTable.status, 'pending'))
      .orderBy(desc(osRecommendationsTable.createdAt))
      .limit(10);

    const watchlist = highPriority.map((r) => {
      const data = r.data as Record<string, unknown>;
      return {
        id: r.recId,
        variant: r.variant,
        title: r.title,
        priority: r.priority,
        category: r.category,
        valueAtRisk: data.valueAtRisk || 0,
        confidence: data.confidence || 0,
        createdAt: data.createdAt,
      };
    });

    sendSuccess(res, watchlist);
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch watchlist');
  }
});

router.get('/v1/os/command/correlations', async (req, res) => {
  try {
    const pending = await db
      .select()
      .from(osRecommendationsTable)
      .where(eq(osRecommendationsTable.status, 'pending'));

    const byCategory = new Map<string, typeof pending>();
    for (const r of pending) {
      const cat = r.category || 'general';
      if (!byCategory.has(cat)) byCategory.set(cat, []);
      byCategory.get(cat)!.push(r);
    }

    const correlations = Array.from(byCategory.entries())
      .filter(([_, items]) => items.length > 1)
      .map(([category, items]) => ({
        category,
        count: items.length,
        variants: [...new Set(items.map((i) => i.variant))],
        totalValueAtRisk: items.reduce((sum, i) => {
          const data = i.data as Record<string, unknown>;
          return sum + ((data.valueAtRisk as number) || 0);
        }, 0),
        items: items.map((i) => ({
          id: i.recId,
          variant: i.variant,
          title: i.title,
          priority: i.priority,
        })),
      }));

    sendSuccess(res, correlations);
  } catch (err) {
    handleRouteError(res, err, 'Failed to compute correlations');
  }
});

router.get('/v1/os/platform/stats', async (req, res) => {
  try {
    const [recStats] = await db
      .select({
        total: sql<number>`count(*)`,
        approved: sql<number>`count(*) filter (where ${osRecommendationsTable.status} = 'approved')`,
        pending: sql<number>`count(*) filter (where ${osRecommendationsTable.status} = 'pending')`,
      })
      .from(osRecommendationsTable);

    const [runStats] = await db
      .select({
        total: sql<number>`count(*)`,
        completed: sql<number>`count(*) filter (where ${osRunsTable.status} = 'completed')`,
      })
      .from(osRunsTable);

    const healthRows = await db.select().from(osSourceHealthTable);
    const healthySources = healthRows.filter(
      (h) => (h.data as Record<string, unknown>).status === 'healthy',
    ).length;

    const evalRows = await db.select().from(osEvalResultsTable);
    const avgPassRate =
      evalRows.length > 0
        ? evalRows.reduce((sum, e) => sum + e.passRate, 0) / evalRows.length / 10000
        : 0;

    const stats = {
      autopilot: {
        totalDecisions: Number(recStats?.total || 0),
        approvedDecisions: Number(recStats?.approved || 0),
        pendingDecisions: Number(recStats?.pending || 0),
        automationRate:
          Number(recStats?.total || 0) > 0
            ? Math.round(
                (Number(recStats?.approved || 0) / Number(recStats?.total || 0)) * 100,
              )
            : 0,
      },
      genome: {
        score: Math.round(avgPassRate * 100),
        totalRuns: Number(runStats?.total || 0),
        completedRuns: Number(runStats?.completed || 0),
        healthySources,
        totalSources: healthRows.length,
      },
      computedAt: new Date().toISOString(),
    };

    sendSuccess(res, stats);
  } catch (err) {
    handleRouteError(res, err, 'Failed to compute platform stats');
  }
});

export default router;
