import { bodyShape } from '@szl-holdings/contracts/common';
import { db } from '@szl-holdings/db';
import {
  pcCarrierSilenceWindowsTable,
  pcInsurerPressureSnapshotsTable,
  pcMovementRecommendationsTable,
  pcPortfolioActionEffectivenessTable,
  pcPortfolioBenchmarkSnapshotsTable,
  pcPortfolioMatterCohortsTable,
  pcPortfolioTeamLagMetricsTable,
  pcQuietRiskSnapshotsTable,
  pcSettlementFrictionSnapshotsTable,
  pcWorldlineRecoveryMarkersTable,
  pcWorldlineRegulatoryEventsTable,
  pcWorldlineSignalOverlaysTable,
  pcWorldlineWeatherEventsTable,
} from '@szl-holdings/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import { type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { logger } from '../lib/logger';
import { commonSchemas, listQuerySchema, validateBody, validateParams, validateQuery } from '../lib/validation';
import { authMiddleware, requireRole } from '../middlewares/auth';
import { tenantScope } from '../middlewares/tenant-scope';
import { copilotPilotOne } from '../services/prism-copilot-pilot-one';
import { forecastExpanded } from '../services/prism-forecast-expanded';
import { insurerPressureEngine } from '../services/prism-insurer-pressure';
import { portfolioLearning } from '../services/prism-portfolio-learning';
import { settlementFrictionEngine } from '../services/prism-settlement-friction';

const router = Router();

router.use(authMiddleware());
router.use(tenantScope({ required: true }));

const matterIdParamSchema = z.object({ matterId: z.coerce.number().int().positive() });
const userIdParamSchema = z.object({ userId: z.coerce.number().int().positive() });

const CarrierEventSchema = z.object({
  carrierName: z.string().min(1).max(200),
  eventType: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
  daysSinceLastContact: z.number().int().min(0).optional(),
  signalStrength: z.number().min(0).max(1).optional(),
  sourceRef: z.string().max(500).optional(),
});

const PilotOneExecuteSchema = z.object({
  matterId: z.number().int().positive(),
  cardId: z.enum([
    'why_harder_than_looks',
    'what_blocking_settlement',
    'explain_pressure_score',
    'what_changed_since_monday',
    'smallest_action_readiness',
    'draft_partner_briefing',
    'draft_escalation_note',
    'settlement_friction_memo',
    'matter_movement_summary',
    'carrier_watch_summary',
    'pressure_trend_narrative',
    'movement_board_item',
  ]),
});

function getOrgId(req: Request): number {
  const orgId = req.tenantOrgId ?? req.user?.orgs[0]?.orgId;
  if (!orgId) throw Object.assign(new Error('Organization context required'), { statusCode: 403 });
  return orgId;
}

/* ─── Insurer Pressure Engine ─────────────────────────────────────────── */

router.post(
  '/pressure/:matterId/compute',
  validateParams(matterIdParamSchema),
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    try {
      const matterId = parseInt(req.params.matterId as string, 10);
      const { snapshotId, analysis } = await insurerPressureEngine.compute(getOrgId(req), matterId);
      res.json({ snapshotId, analysis });
    } catch (err: any) {
      logger.error({ err }, 'Error computing insurer pressure');
      res.status(500).json({ error: err.message || 'Failed to compute insurer pressure' });
    }
  },
);

router.get('/pressure/:matterId', validateParams(matterIdParamSchema), async (req: Request, res: Response) => {
  try {
    const matterId = parseInt(req.params.matterId as string, 10);
    const data = await insurerPressureEngine.getLatestSnapshot(getOrgId(req), matterId);
    res.json({ data });
  } catch (_err: any) {
    res.status(500).json({ error: 'Failed to fetch pressure snapshot' });
  }
});

router.get('/pressure/portfolio/view', async (req: Request, res: Response) => {
  try {
    const view = await insurerPressureEngine.getPortfolioPressureView(getOrgId(req));
    res.json({ view });
  } catch (_err: any) {
    res.status(500).json({ error: 'Failed to fetch portfolio pressure view' });
  }
});

router.get(
  '/pressure/carrier/patterns',
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const carrierName = req.query.carrier as string | undefined;
      const patterns = await insurerPressureEngine.getCarrierPatterns(getOrgId(req), carrierName);
      res.json({ patterns });
    } catch (_err: any) {
      res.status(500).json({ error: 'Failed to fetch carrier patterns' });
    }
  },
);

router.get(
  '/pressure/silence-windows',
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const matterId = req.query.matterId ? parseInt(req.query.matterId as string, 10) : undefined;
      const windows = await insurerPressureEngine.getSilenceWindows(getOrgId(req), matterId);
      res.json({ windows });
    } catch (_err: any) {
      res.status(500).json({ error: 'Failed to fetch silence windows' });
    }
  },
);

router.post(
  '/pressure/:matterId/events',
  validateParams(matterIdParamSchema),
  validateBody(CarrierEventSchema),
  async (req: Request, res: Response) => {
    try {
      const matterId = parseInt(req.params.matterId as string, 10);
      await insurerPressureEngine.recordCarrierEvent(
        getOrgId(req),
        matterId,
        req.body as z.infer<typeof CarrierEventSchema>,
      );
      res.json({ success: true });
    } catch (_err: any) {
      res.status(500).json({ error: 'Failed to record carrier event' });
    }
  },
);

/* ─── Settlement Friction Engine ──────────────────────────────────────── */

router.post(
  '/friction/:matterId/compute',
  validateParams(matterIdParamSchema),
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    try {
      const matterId = parseInt(req.params.matterId as string, 10);
      const { snapshotId, analysis } = await settlementFrictionEngine.compute(
        getOrgId(req),
        matterId,
      );
      res.json({ snapshotId, analysis });
    } catch (err: any) {
      logger.error({ err }, 'Error computing settlement friction');
      res.status(500).json({ error: err.message || 'Failed to compute settlement friction' });
    }
  },
);

router.get('/friction/:matterId', validateParams(matterIdParamSchema), async (req: Request, res: Response) => {
  try {
    const matterId = parseInt(req.params.matterId as string, 10);
    const data = await settlementFrictionEngine.getLatestSnapshot(getOrgId(req), matterId);
    res.json({ data });
  } catch (_err: any) {
    res.status(500).json({ error: 'Failed to fetch friction snapshot' });
  }
});

router.get('/friction/portfolio/view', async (req: Request, res: Response) => {
  try {
    const view = await settlementFrictionEngine.getPortfolioFrictionView(getOrgId(req));
    res.json({ view });
  } catch (_err: any) {
    res.status(500).json({ error: 'Failed to fetch portfolio friction view' });
  }
});

router.get('/friction/:matterId/recommendations', validateParams(matterIdParamSchema), async (req: Request, res: Response) => {
  try {
    const matterId = parseInt(req.params.matterId as string, 10);
    const recommendations = await settlementFrictionEngine.getMovementRecommendations(
      getOrgId(req),
      matterId,
    );
    res.json({ recommendations });
  } catch (_err: any) {
    res.status(500).json({ error: 'Failed to fetch movement recommendations' });
  }
});

router.post(
  '/friction/recommendations/:id/accept',
  validateParams(commonSchemas.idParam),
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    try {
      await db
        .update(pcMovementRecommendationsTable)
        .set({ status: 'accepted', acceptedBy: req.user?.id, acceptedAt: new Date() })
        .where(
          and(
            eq(pcMovementRecommendationsTable.id, parseInt(req.params.id as string, 10)),
            eq(pcMovementRecommendationsTable.orgId, getOrgId(req)),
          ),
        );
      res.json({ success: true });
    } catch (_err: any) {
      res.status(500).json({ error: 'Failed to accept recommendation' });
    }
  },
);

/* ─── Forecast Expansion ─────────────────────────────────────────────── */

router.post(
  '/forecasts/pilot-one/:matterId/compute',
  validateParams(matterIdParamSchema),
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    try {
      const matterId = parseInt(req.params.matterId as string, 10);
      const forecasts = await forecastExpanded.runForecastCycle(getOrgId(req), matterId);
      res.json({ forecasts });
    } catch (err: any) {
      logger.error({ err }, 'Error computing Pilot One forecasts');
      res.status(500).json({ error: err.message || 'Failed to compute forecasts' });
    }
  },
);

router.get('/forecasts/pilot-one/:matterId/diff-view', validateParams(matterIdParamSchema), async (req: Request, res: Response) => {
  try {
    const matterId = parseInt(req.params.matterId as string, 10);
    const diffView = await forecastExpanded.getForecastDiffView(getOrgId(req), matterId);
    res.json(diffView);
  } catch (_err: any) {
    res.status(500).json({ error: 'Failed to fetch forecast diff view' });
  }
});

/* ─── Portfolio Learning ──────────────────────────────────────────────── */

router.post(
  '/portfolio/run-learning',
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    try {
      await portfolioLearning.runFullPortfolioLearning(getOrgId(req));
      res.json({ success: true, message: 'Portfolio learning cycle complete' });
    } catch (err: any) {
      logger.error({ err }, 'Error running portfolio learning');
      res.status(500).json({ error: 'Failed to run portfolio learning' });
    }
  },
);

router.get(
  '/portfolio/benchmarks',
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const benchmarkType = req.query.type as string | undefined;
      const benchmarks = await portfolioLearning.getBenchmarks(getOrgId(req), benchmarkType);
      res.json({ benchmarks });
    } catch (_err: any) {
      res.status(500).json({ error: 'Failed to fetch benchmarks' });
    }
  },
);

router.get('/portfolio/action-effectiveness', async (req: Request, res: Response) => {
  try {
    const effectiveness = await portfolioLearning.getActionEffectiveness(getOrgId(req));
    res.json({ effectiveness });
  } catch (_err: any) {
    res.status(500).json({ error: 'Failed to fetch action effectiveness' });
  }
});

router.get(
  '/portfolio/cohorts',
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const cohortType = req.query.type as string | undefined;
      const cohorts = await portfolioLearning.getMatterCohorts(getOrgId(req), cohortType);
      res.json({ cohorts });
    } catch (_err: any) {
      res.status(500).json({ error: 'Failed to fetch matter cohorts' });
    }
  },
);

router.get('/portfolio/watchlist', async (req: Request, res: Response) => {
  try {
    const watchlist = await portfolioLearning.getManagerWatchlist(getOrgId(req));
    res.json({ watchlist });
  } catch (_err: any) {
    res.status(500).json({ error: 'Failed to fetch manager watchlist' });
  }
});

router.get('/portfolio/best-next-30/:userId', validateParams(userIdParamSchema), async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId as string, 10);
    const actions = await portfolioLearning.getBestNext30Minutes(getOrgId(req), userId);
    res.json({ actions });
  } catch (_err: any) {
    res.status(500).json({ error: 'Failed to fetch best next 30 minutes' });
  }
});

router.post(
  '/portfolio/quiet-risk/:matterId',
  validateParams(matterIdParamSchema),
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    try {
      const matterId = parseInt(req.params.matterId as string, 10);
      const result = await portfolioLearning.detectQuietRisk(getOrgId(req), matterId);
      res.json(result);
    } catch (_err: any) {
      res.status(500).json({ error: 'Failed to detect quiet risk' });
    }
  },
);

/* ─── Copilot Pilot One Action Cards ─────────────────────────────────── */

router.get('/copilot/pilot-one/cards', (_req: Request, res: Response) => {
  try {
    const cards = copilotPilotOne.getAvailableCards();
    res.json({ cards });
  } catch (_err: any) {
    res.status(500).json({ error: 'Failed to list cards' });
  }
});

router.post(
  '/copilot/pilot-one/execute',
  validateBody(PilotOneExecuteSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { matterId, cardId } = req.body as z.infer<typeof PilotOneExecuteSchema>;
      const result = await copilotPilotOne.executeActionCard(getOrgId(req), matterId, cardId);
      res.json(result);
    } catch (err: any) {
      logger.error({ err }, 'Error executing Pilot One action card');
      res.status(500).json({ error: err.message || 'Failed to execute action card' });
    }
  },
);

/* ─── Lawyer Life OS Boards ──────────────────────────────────────────── */

router.get('/boards/pressure', async (req: Request, res: Response) => {
  try {
    const pressureView = await insurerPressureEngine.getPortfolioPressureView(getOrgId(req));
    const silenceWindows = await insurerPressureEngine.getSilenceWindows(getOrgId(req));
    res.json({
      boardType: 'pressure',
      title: 'Pressure Board',
      matters: pressureView.slice(0, 20),
      silenceWindows: silenceWindows.slice(0, 10),
      asOf: new Date().toISOString(),
    });
  } catch (_err: any) {
    res.status(500).json({ error: 'Failed to build pressure board' });
  }
});

router.get('/boards/friction', async (req: Request, res: Response) => {
  try {
    const frictionView = await settlementFrictionEngine.getPortfolioFrictionView(getOrgId(req));
    const recommendations = await settlementFrictionEngine.getMovementRecommendations(
      getOrgId(req),
    );
    res.json({
      boardType: 'friction',
      title: 'Friction Board',
      matters: frictionView.slice(0, 20),
      topRecommendations: recommendations.slice(0, 5),
      asOf: new Date().toISOString(),
    });
  } catch (_err: any) {
    res.status(500).json({ error: 'Failed to build friction board' });
  }
});

router.get('/boards/carrier-watch', async (req: Request, res: Response) => {
  try {
    const silenceWindows = await insurerPressureEngine.getSilenceWindows(getOrgId(req));
    const patterns = await insurerPressureEngine.getCarrierPatterns(getOrgId(req));
    const pressureView = await insurerPressureEngine.getPortfolioPressureView(getOrgId(req));
    res.json({
      boardType: 'carrier_watch',
      title: 'Carrier Watch',
      activeSilenceWindows: silenceWindows,
      behaviorPatterns: patterns.slice(0, 10),
      highPressureMatters: pressureView.filter((p) => p.pressure.overallScore >= 0.6).slice(0, 10),
      asOf: new Date().toISOString(),
    });
  } catch (_err: any) {
    res.status(500).json({ error: 'Failed to build carrier watch board' });
  }
});

router.get('/boards/movement', async (req: Request, res: Response) => {
  try {
    const frictionView = await settlementFrictionEngine.getPortfolioFrictionView(getOrgId(req));
    const recommendations = await settlementFrictionEngine.getMovementRecommendations(
      getOrgId(req),
    );
    const movingMatters = frictionView.filter(
      (f) => f.friction.direction === 'falling' || f.friction.overallScore < 0.4,
    );
    res.json({
      boardType: 'movement',
      title: 'Movement Board',
      mattersMovingToward: movingMatters.slice(0, 10),
      topMovementActions: recommendations.slice(0, 5),
      stalled: frictionView
        .filter((f) => f.friction.direction === 'rising' || f.friction.overallScore >= 0.7)
        .slice(0, 5),
      asOf: new Date().toISOString(),
    });
  } catch (_err: any) {
    res.status(500).json({ error: 'Failed to build movement board' });
  }
});

router.get('/boards/today-enhanced', async (req: Request, res: Response) => {
  try {
    const [pressureView, frictionView, watchlist, bestActions, silenceWindows] = await Promise.all([
      insurerPressureEngine.getPortfolioPressureView(getOrgId(req)),
      settlementFrictionEngine.getPortfolioFrictionView(getOrgId(req)),
      portfolioLearning.getManagerWatchlist(getOrgId(req)),
      portfolioLearning.getBestNext30Minutes(getOrgId(req), req.user?.id),
      insurerPressureEngine.getSilenceWindows(getOrgId(req)),
    ]);

    res.json({
      asOf: new Date().toISOString(),
      highestPressure: pressureView.slice(0, 3).map((p) => ({
        matterId: p.matter.id,
        title: p.matter.title,
        caseNumber: p.matter.caseNumber,
        pressureScore: p.pressure.overallScore,
        direction: p.pressure.direction,
        action: p.pressure.recommendedNextAction,
      })),
      risingFriction: frictionView
        .filter((f) => f.friction.direction === 'rising')
        .slice(0, 3)
        .map((f) => ({
          matterId: f.matter.id,
          title: f.matter.title,
          frictionScore: f.friction.overallScore,
          smallestAction: f.friction.smallestAction,
        })),
      quietRisk: watchlist.slice(0, 3),
      closestToMovement: frictionView
        .filter((f) => f.friction.overallScore < 0.35)
        .slice(0, 3)
        .map((f) => ({
          matterId: f.matter.id,
          title: f.matter.title,
          frictionScore: f.friction.overallScore,
          readinessDrag: f.friction.readinessDragDays,
        })),
      bestNext30Minutes: bestActions.slice(0, 5),
      waitingOnCarrier: silenceWindows.length,
    });
  } catch (err: any) {
    logger.error({ err }, 'Error building enhanced today view');
    res.status(500).json({ error: 'Failed to build enhanced today view' });
  }
});

/* ─── Worldline V1 Expansion ─────────────────────────────────────────── */

router.get(
  '/worldline/signal-overlays',
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const matterId = req.query.matterId ? parseInt(req.query.matterId as string, 10) : undefined;
      const conditions = matterId
        ? and(
            eq(pcWorldlineSignalOverlaysTable.orgId, getOrgId(req)),
            eq(pcWorldlineSignalOverlaysTable.matterId, matterId),
          )
        : eq(pcWorldlineSignalOverlaysTable.orgId, getOrgId(req));
      const overlays = await db
        .select()
        .from(pcWorldlineSignalOverlaysTable)
        .where(conditions)
        .orderBy(desc(pcWorldlineSignalOverlaysTable.createdAt))
        .limit(50);
      res.json({ overlays });
    } catch (_err: any) {
      res.status(500).json({ error: 'Failed to fetch signal overlays' });
    }
  },
);

router.get('/worldline/weather', async (req: Request, res: Response) => {
  try {
    const events = await db
      .select()
      .from(pcWorldlineWeatherEventsTable)
      .where(eq(pcWorldlineWeatherEventsTable.orgId, getOrgId(req)))
      .orderBy(desc(pcWorldlineWeatherEventsTable.fetchedAt))
      .limit(20);
    res.json({ events });
  } catch (_err: any) {
    res.status(500).json({ error: 'Failed to fetch weather events' });
  }
});

router.get('/worldline/regulatory', async (req: Request, res: Response) => {
  try {
    const events = await db
      .select()
      .from(pcWorldlineRegulatoryEventsTable)
      .where(eq(pcWorldlineRegulatoryEventsTable.orgId, getOrgId(req)))
      .orderBy(desc(pcWorldlineRegulatoryEventsTable.fetchedAt))
      .limit(20);
    res.json({ events });
  } catch (_err: any) {
    res.status(500).json({ error: 'Failed to fetch regulatory events' });
  }
});

router.get(
  '/worldline/recovery-markers',
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const matterId = req.query.matterId ? parseInt(req.query.matterId as string, 10) : undefined;
      const conditions = matterId
        ? and(
            eq(pcWorldlineRecoveryMarkersTable.orgId, getOrgId(req)),
            eq(pcWorldlineRecoveryMarkersTable.matterId, matterId),
          )
        : eq(pcWorldlineRecoveryMarkersTable.orgId, getOrgId(req));
      const markers = await db
        .select()
        .from(pcWorldlineRecoveryMarkersTable)
        .where(conditions)
        .orderBy(desc(pcWorldlineRecoveryMarkersTable.fetchedAt))
        .limit(20);
      res.json({ markers });
    } catch (_err: any) {
      res.status(500).json({ error: 'Failed to fetch recovery markers' });
    }
  },
);

/* ─── Admin Surfaces ──────────────────────────────────────────────────── */

router.get(
  '/admin/pressure',
  requireRole('super_admin', 'admin'),
  async (req: Request, res: Response) => {
    try {
      const snapshots = await db
        .select()
        .from(pcInsurerPressureSnapshotsTable)
        .where(eq(pcInsurerPressureSnapshotsTable.orgId, getOrgId(req)))
        .orderBy(desc(pcInsurerPressureSnapshotsTable.computedAt))
        .limit(50);
      const requiresReview = snapshots.filter((s) => s.requiresReview).length;
      const highPressure = snapshots.filter((s) => s.overallScore >= 0.7).length;
      const silenceWindows = await db
        .select()
        .from(pcCarrierSilenceWindowsTable)
        .where(
          and(
            eq(pcCarrierSilenceWindowsTable.orgId, getOrgId(req)),
            eq(pcCarrierSilenceWindowsTable.isCurrent, true),
          ),
        );
      res.json({
        summary: {
          totalSnapshots: snapshots.length,
          requiresReview,
          highPressure,
          activeSilenceWindows: silenceWindows.length,
        },
        recentSnapshots: snapshots.slice(0, 20),
        activeSilenceWindows: silenceWindows.slice(0, 10),
      });
    } catch (_err: any) {
      res.status(500).json({ error: 'Failed to fetch pressure admin data' });
    }
  },
);

router.get(
  '/admin/friction',
  requireRole('super_admin', 'admin'),
  async (req: Request, res: Response) => {
    try {
      const snapshots = await db
        .select()
        .from(pcSettlementFrictionSnapshotsTable)
        .where(eq(pcSettlementFrictionSnapshotsTable.orgId, getOrgId(req)))
        .orderBy(desc(pcSettlementFrictionSnapshotsTable.computedAt))
        .limit(50);
      const requiresReview = snapshots.filter((s) => s.requiresReview).length;
      const highFriction = snapshots.filter((s) => s.overallScore >= 0.7).length;
      const recommendations = await db
        .select()
        .from(pcMovementRecommendationsTable)
        .where(
          and(
            eq(pcMovementRecommendationsTable.orgId, getOrgId(req)),
            eq(pcMovementRecommendationsTable.status, 'suggested'),
          ),
        )
        .limit(20);
      res.json({
        summary: {
          totalSnapshots: snapshots.length,
          requiresReview,
          highFriction,
          pendingRecommendations: recommendations.length,
        },
        recentSnapshots: snapshots.slice(0, 20),
        pendingRecommendations: recommendations.slice(0, 10),
      });
    } catch (_err: any) {
      res.status(500).json({ error: 'Failed to fetch friction admin data' });
    }
  },
);

router.get(
  '/admin/portfolio-learning',
  requireRole('super_admin', 'admin'),
  async (req: Request, res: Response) => {
    try {
      const [benchmarks, effectiveness, cohorts, teamLag] = await Promise.all([
        db
          .select()
          .from(pcPortfolioBenchmarkSnapshotsTable)
          .where(eq(pcPortfolioBenchmarkSnapshotsTable.orgId, getOrgId(req)))
          .orderBy(desc(pcPortfolioBenchmarkSnapshotsTable.computedAt))
          .limit(20),
        db
          .select()
          .from(pcPortfolioActionEffectivenessTable)
          .where(eq(pcPortfolioActionEffectivenessTable.orgId, getOrgId(req)))
          .limit(20),
        db
          .select()
          .from(pcPortfolioMatterCohortsTable)
          .where(eq(pcPortfolioMatterCohortsTable.orgId, getOrgId(req)))
          .orderBy(desc(pcPortfolioMatterCohortsTable.computedAt))
          .limit(30),
        db
          .select()
          .from(pcPortfolioTeamLagMetricsTable)
          .where(eq(pcPortfolioTeamLagMetricsTable.orgId, getOrgId(req)))
          .limit(20),
      ]);
      res.json({ benchmarks, effectiveness, cohorts, teamLag });
    } catch (_err: any) {
      res.status(500).json({ error: 'Failed to fetch portfolio learning admin data' });
    }
  },
);

router.get(
  '/admin/worldline',
  requireRole('super_admin', 'admin'),
  async (req: Request, res: Response) => {
    try {
      const [overlays, weather, regulatory, recovery] = await Promise.all([
        db
          .select()
          .from(pcWorldlineSignalOverlaysTable)
          .where(eq(pcWorldlineSignalOverlaysTable.orgId, getOrgId(req)))
          .orderBy(desc(pcWorldlineSignalOverlaysTable.createdAt))
          .limit(20),
        db
          .select()
          .from(pcWorldlineWeatherEventsTable)
          .where(eq(pcWorldlineWeatherEventsTable.orgId, getOrgId(req)))
          .orderBy(desc(pcWorldlineWeatherEventsTable.fetchedAt))
          .limit(10),
        db
          .select()
          .from(pcWorldlineRegulatoryEventsTable)
          .where(eq(pcWorldlineRegulatoryEventsTable.orgId, getOrgId(req)))
          .orderBy(desc(pcWorldlineRegulatoryEventsTable.fetchedAt))
          .limit(10),
        db
          .select()
          .from(pcWorldlineRecoveryMarkersTable)
          .where(eq(pcWorldlineRecoveryMarkersTable.orgId, getOrgId(req)))
          .orderBy(desc(pcWorldlineRecoveryMarkersTable.fetchedAt))
          .limit(10),
      ]);
      res.json({
        summary: {
          signalOverlays: overlays.length,
          weatherEvents: weather.length,
          regulatoryEvents: regulatory.length,
          recoveryMarkers: recovery.length,
        },
        recentOverlays: overlays.slice(0, 10),
        weatherEvents: weather,
        regulatoryEvents: regulatory,
        recoveryMarkers: recovery,
      });
    } catch (_err: any) {
      res.status(500).json({ error: 'Failed to fetch worldline admin data' });
    }
  },
);

router.get(
  '/admin/quality',
  requireRole('super_admin', 'admin'),
  async (req: Request, res: Response) => {
    try {
      const quietRisks = await db
        .select()
        .from(pcQuietRiskSnapshotsTable)
        .where(eq(pcQuietRiskSnapshotsTable.orgId, getOrgId(req)))
        .orderBy(desc(pcQuietRiskSnapshotsTable.riskScore))
        .limit(20);
      const highRiskCount = quietRisks.filter((r) => r.riskScore >= 0.6).length;
      res.json({
        summary: { quietRiskMatters: quietRisks.length, highRiskCount },
        quietRisks: quietRisks.slice(0, 10),
        qualityWarnings: quietRisks
          .filter((r) => r.requiresReview)
          .map((r) => ({
            matterId: r.matterId,
            riskScore: r.riskScore,
            signals: r.topSignals,
            requiresReview: r.requiresReview,
          })),
      });
    } catch (_err: any) {
      res.status(500).json({ error: 'Failed to fetch quality admin data' });
    }
  },
);

export const prismCounselPilotOneRouter = router;
