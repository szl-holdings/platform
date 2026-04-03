import { Router, Request, Response } from "express";
import { insurerPressureEngine } from "../services/prism-insurer-pressure";
import { settlementFrictionEngine } from "../services/prism-settlement-friction";
import { portfolioLearning } from "../services/prism-portfolio-learning";
import { forecastExpanded } from "../services/prism-forecast-expanded";
import { copilotPilotOne } from "../services/prism-copilot-pilot-one";
import { db } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import {
  pcInsurerPressureSnapshotsTable, pcSettlementFrictionSnapshotsTable,
  pcCarrierSilenceWindowsTable, pcCarrierBehaviorPatternsTable,
  pcMovementRecommendationsTable, pcPortfolioMatterCohortsTable,
  pcPortfolioBenchmarkSnapshotsTable, pcPortfolioActionEffectivenessTable,
  pcPortfolioTeamLagMetricsTable, pcWorldlineSignalOverlaysTable,
  pcWorldlineWeatherEventsTable, pcWorldlineCountyProfilesTable,
  pcWorldlineRegulatoryEventsTable, pcWorldlineRecoveryMarkersTable,
  pcQuietRiskSnapshotsTable,
} from "@workspace/db/schema";
import { logger } from "../lib/logger";

const router = Router();
const ORG_ID = 1;

/* ─── Insurer Pressure Engine ─────────────────────────────────────────── */

router.post("/pressure/:matterId/compute", async (req: Request, res: Response) => {
  try {
    const matterId = parseInt(req.params.matterId as string);
    const { snapshotId, analysis } = await insurerPressureEngine.compute(ORG_ID, matterId);
    res.json({ snapshotId, analysis });
  } catch (err: any) {
    logger.error({ err }, "Error computing insurer pressure");
    res.status(500).json({ error: err.message || "Failed to compute insurer pressure" });
  }
});

router.get("/pressure/:matterId", async (req: Request, res: Response) => {
  try {
    const matterId = parseInt(req.params.matterId as string);
    const data = await insurerPressureEngine.getLatestSnapshot(ORG_ID, matterId);
    res.json({ data });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch pressure snapshot" });
  }
});

router.get("/pressure/portfolio/view", async (_req: Request, res: Response) => {
  try {
    const view = await insurerPressureEngine.getPortfolioPressureView(ORG_ID);
    res.json({ view });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch portfolio pressure view" });
  }
});

router.get("/pressure/carrier/patterns", async (req: Request, res: Response) => {
  try {
    const carrierName = req.query.carrier as string | undefined;
    const patterns = await insurerPressureEngine.getCarrierPatterns(ORG_ID, carrierName);
    res.json({ patterns });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch carrier patterns" });
  }
});

router.get("/pressure/silence-windows", async (req: Request, res: Response) => {
  try {
    const matterId = req.query.matterId ? parseInt(req.query.matterId as string) : undefined;
    const windows = await insurerPressureEngine.getSilenceWindows(ORG_ID, matterId);
    res.json({ windows });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch silence windows" });
  }
});

router.post("/pressure/:matterId/events", async (req: Request, res: Response) => {
  try {
    const matterId = parseInt(req.params.matterId as string);
    await insurerPressureEngine.recordCarrierEvent(ORG_ID, matterId, req.body);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to record carrier event" });
  }
});

/* ─── Settlement Friction Engine ──────────────────────────────────────── */

router.post("/friction/:matterId/compute", async (req: Request, res: Response) => {
  try {
    const matterId = parseInt(req.params.matterId as string);
    const { snapshotId, analysis } = await settlementFrictionEngine.compute(ORG_ID, matterId);
    res.json({ snapshotId, analysis });
  } catch (err: any) {
    logger.error({ err }, "Error computing settlement friction");
    res.status(500).json({ error: err.message || "Failed to compute settlement friction" });
  }
});

router.get("/friction/:matterId", async (req: Request, res: Response) => {
  try {
    const matterId = parseInt(req.params.matterId as string);
    const data = await settlementFrictionEngine.getLatestSnapshot(ORG_ID, matterId);
    res.json({ data });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch friction snapshot" });
  }
});

router.get("/friction/portfolio/view", async (_req: Request, res: Response) => {
  try {
    const view = await settlementFrictionEngine.getPortfolioFrictionView(ORG_ID);
    res.json({ view });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch portfolio friction view" });
  }
});

router.get("/friction/:matterId/recommendations", async (req: Request, res: Response) => {
  try {
    const matterId = parseInt(req.params.matterId as string);
    const recommendations = await settlementFrictionEngine.getMovementRecommendations(ORG_ID, matterId);
    res.json({ recommendations });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch movement recommendations" });
  }
});

router.post("/friction/recommendations/:id/accept", async (req: Request, res: Response) => {
  try {
    await db.update(pcMovementRecommendationsTable)
      .set({ status: "accepted", acceptedBy: 1, acceptedAt: new Date() })
      .where(and(eq(pcMovementRecommendationsTable.id, parseInt(req.params.id as string)), eq(pcMovementRecommendationsTable.orgId, ORG_ID)));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to accept recommendation" });
  }
});

/* ─── Forecast Expansion ─────────────────────────────────────────────── */

router.post("/forecasts/pilot-one/:matterId/compute", async (req: Request, res: Response) => {
  try {
    const matterId = parseInt(req.params.matterId as string);
    const forecasts = await forecastExpanded.runForecastCycle(ORG_ID, matterId);
    res.json({ forecasts });
  } catch (err: any) {
    logger.error({ err }, "Error computing Pilot One forecasts");
    res.status(500).json({ error: err.message || "Failed to compute forecasts" });
  }
});

router.get("/forecasts/pilot-one/:matterId/diff-view", async (req: Request, res: Response) => {
  try {
    const matterId = parseInt(req.params.matterId as string);
    const diffView = await forecastExpanded.getForecastDiffView(ORG_ID, matterId);
    res.json(diffView);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch forecast diff view" });
  }
});

/* ─── Portfolio Learning ──────────────────────────────────────────────── */

router.post("/portfolio/run-learning", async (_req: Request, res: Response) => {
  try {
    await portfolioLearning.runFullPortfolioLearning(ORG_ID);
    res.json({ success: true, message: "Portfolio learning cycle complete" });
  } catch (err: any) {
    logger.error({ err }, "Error running portfolio learning");
    res.status(500).json({ error: "Failed to run portfolio learning" });
  }
});

router.get("/portfolio/benchmarks", async (req: Request, res: Response) => {
  try {
    const benchmarkType = req.query.type as string | undefined;
    const benchmarks = await portfolioLearning.getBenchmarks(ORG_ID, benchmarkType);
    res.json({ benchmarks });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch benchmarks" });
  }
});

router.get("/portfolio/action-effectiveness", async (_req: Request, res: Response) => {
  try {
    const effectiveness = await portfolioLearning.getActionEffectiveness(ORG_ID);
    res.json({ effectiveness });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch action effectiveness" });
  }
});

router.get("/portfolio/cohorts", async (req: Request, res: Response) => {
  try {
    const cohortType = req.query.type as string | undefined;
    const cohorts = await portfolioLearning.getMatterCohorts(ORG_ID, cohortType);
    res.json({ cohorts });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch matter cohorts" });
  }
});

router.get("/portfolio/watchlist", async (_req: Request, res: Response) => {
  try {
    const watchlist = await portfolioLearning.getManagerWatchlist(ORG_ID);
    res.json({ watchlist });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch manager watchlist" });
  }
});

router.get("/portfolio/best-next-30/:userId", async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId as string);
    const actions = await portfolioLearning.getBestNext30Minutes(ORG_ID, userId);
    res.json({ actions });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch best next 30 minutes" });
  }
});

router.post("/portfolio/quiet-risk/:matterId", async (req: Request, res: Response) => {
  try {
    const matterId = parseInt(req.params.matterId as string);
    const result = await portfolioLearning.detectQuietRisk(ORG_ID, matterId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to detect quiet risk" });
  }
});

/* ─── Copilot Pilot One Action Cards ─────────────────────────────────── */

router.get("/copilot/pilot-one/cards", (_req: Request, res: Response) => {
  try {
    const cards = copilotPilotOne.getAvailableCards();
    res.json({ cards });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to list cards" });
  }
});

router.post("/copilot/pilot-one/execute", async (req: Request, res: Response): Promise<void> => {
  try {
    const { matterId, cardId } = req.body;
    if (!matterId || !cardId) { res.status(400).json({ error: "matterId and cardId are required" }); return; }
    const result = await copilotPilotOne.executeActionCard(ORG_ID, parseInt(matterId), cardId);
    res.json(result);
  } catch (err: any) {
    logger.error({ err }, "Error executing Pilot One action card");
    res.status(500).json({ error: err.message || "Failed to execute action card" });
  }
});

/* ─── Lawyer Life OS Boards ──────────────────────────────────────────── */

router.get("/boards/pressure", async (_req: Request, res: Response) => {
  try {
    const pressureView = await insurerPressureEngine.getPortfolioPressureView(ORG_ID);
    const silenceWindows = await insurerPressureEngine.getSilenceWindows(ORG_ID);
    res.json({
      boardType: "pressure",
      title: "Pressure Board",
      matters: pressureView.slice(0, 20),
      silenceWindows: silenceWindows.slice(0, 10),
      asOf: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to build pressure board" });
  }
});

router.get("/boards/friction", async (_req: Request, res: Response) => {
  try {
    const frictionView = await settlementFrictionEngine.getPortfolioFrictionView(ORG_ID);
    const recommendations = await settlementFrictionEngine.getMovementRecommendations(ORG_ID);
    res.json({
      boardType: "friction",
      title: "Friction Board",
      matters: frictionView.slice(0, 20),
      topRecommendations: recommendations.slice(0, 5),
      asOf: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to build friction board" });
  }
});

router.get("/boards/carrier-watch", async (_req: Request, res: Response) => {
  try {
    const silenceWindows = await insurerPressureEngine.getSilenceWindows(ORG_ID);
    const patterns = await insurerPressureEngine.getCarrierPatterns(ORG_ID);
    const pressureView = await insurerPressureEngine.getPortfolioPressureView(ORG_ID);
    res.json({
      boardType: "carrier_watch",
      title: "Carrier Watch",
      activeSilenceWindows: silenceWindows,
      behaviorPatterns: patterns.slice(0, 10),
      highPressureMatters: pressureView.filter(p => p.pressure.overallScore >= 0.60).slice(0, 10),
      asOf: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to build carrier watch board" });
  }
});

router.get("/boards/movement", async (_req: Request, res: Response) => {
  try {
    const frictionView = await settlementFrictionEngine.getPortfolioFrictionView(ORG_ID);
    const recommendations = await settlementFrictionEngine.getMovementRecommendations(ORG_ID);
    const movingMatters = frictionView.filter(f => f.friction.direction === "falling" || f.friction.overallScore < 0.4);
    res.json({
      boardType: "movement",
      title: "Movement Board",
      mattersMovingToward: movingMatters.slice(0, 10),
      topMovementActions: recommendations.slice(0, 5),
      stalled: frictionView.filter(f => f.friction.direction === "rising" || f.friction.overallScore >= 0.70).slice(0, 5),
      asOf: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to build movement board" });
  }
});

router.get("/boards/today-enhanced", async (_req: Request, res: Response) => {
  try {
    const [pressureView, frictionView, watchlist, bestActions, silenceWindows] = await Promise.all([
      insurerPressureEngine.getPortfolioPressureView(ORG_ID),
      settlementFrictionEngine.getPortfolioFrictionView(ORG_ID),
      portfolioLearning.getManagerWatchlist(ORG_ID),
      portfolioLearning.getBestNext30Minutes(ORG_ID, 1),
      insurerPressureEngine.getSilenceWindows(ORG_ID),
    ]);

    res.json({
      asOf: new Date().toISOString(),
      highestPressure: pressureView.slice(0, 3).map(p => ({
        matterId: p.matter.id,
        title: p.matter.title,
        caseNumber: p.matter.caseNumber,
        pressureScore: p.pressure.overallScore,
        direction: p.pressure.direction,
        action: p.pressure.recommendedNextAction,
      })),
      risingFriction: frictionView.filter(f => f.friction.direction === "rising").slice(0, 3).map(f => ({
        matterId: f.matter.id,
        title: f.matter.title,
        frictionScore: f.friction.overallScore,
        smallestAction: f.friction.smallestAction,
      })),
      quietRisk: watchlist.slice(0, 3),
      closestToMovement: frictionView.filter(f => f.friction.overallScore < 0.35).slice(0, 3).map(f => ({
        matterId: f.matter.id,
        title: f.matter.title,
        frictionScore: f.friction.overallScore,
        readinessDrag: f.friction.readinessDragDays,
      })),
      bestNext30Minutes: bestActions.slice(0, 5),
      waitingOnCarrier: silenceWindows.length,
    });
  } catch (err: any) {
    logger.error({ err }, "Error building enhanced today view");
    res.status(500).json({ error: "Failed to build enhanced today view" });
  }
});

/* ─── Worldline V1 Expansion ─────────────────────────────────────────── */

router.get("/worldline/signal-overlays", async (req: Request, res: Response) => {
  try {
    const matterId = req.query.matterId ? parseInt(req.query.matterId as string) : undefined;
    const conditions = matterId
      ? and(eq(pcWorldlineSignalOverlaysTable.orgId, ORG_ID), eq(pcWorldlineSignalOverlaysTable.matterId, matterId))
      : eq(pcWorldlineSignalOverlaysTable.orgId, ORG_ID);
    const overlays = await db.select().from(pcWorldlineSignalOverlaysTable).where(conditions).orderBy(desc(pcWorldlineSignalOverlaysTable.createdAt)).limit(50);
    res.json({ overlays });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch signal overlays" });
  }
});

router.get("/worldline/weather", async (_req: Request, res: Response) => {
  try {
    const events = await db.select().from(pcWorldlineWeatherEventsTable)
      .where(eq(pcWorldlineWeatherEventsTable.orgId, ORG_ID))
      .orderBy(desc(pcWorldlineWeatherEventsTable.fetchedAt)).limit(20);
    res.json({ events });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch weather events" });
  }
});

router.get("/worldline/regulatory", async (_req: Request, res: Response) => {
  try {
    const events = await db.select().from(pcWorldlineRegulatoryEventsTable)
      .where(eq(pcWorldlineRegulatoryEventsTable.orgId, ORG_ID))
      .orderBy(desc(pcWorldlineRegulatoryEventsTable.fetchedAt)).limit(20);
    res.json({ events });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch regulatory events" });
  }
});

router.get("/worldline/recovery-markers", async (req: Request, res: Response) => {
  try {
    const matterId = req.query.matterId ? parseInt(req.query.matterId as string) : undefined;
    const conditions = matterId
      ? and(eq(pcWorldlineRecoveryMarkersTable.orgId, ORG_ID), eq(pcWorldlineRecoveryMarkersTable.matterId, matterId))
      : eq(pcWorldlineRecoveryMarkersTable.orgId, ORG_ID);
    const markers = await db.select().from(pcWorldlineRecoveryMarkersTable).where(conditions).orderBy(desc(pcWorldlineRecoveryMarkersTable.fetchedAt)).limit(20);
    res.json({ markers });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch recovery markers" });
  }
});

/* ─── Admin Surfaces ──────────────────────────────────────────────────── */

router.get("/admin/pressure", async (_req: Request, res: Response) => {
  try {
    const snapshots = await db.select().from(pcInsurerPressureSnapshotsTable)
      .where(eq(pcInsurerPressureSnapshotsTable.orgId, ORG_ID))
      .orderBy(desc(pcInsurerPressureSnapshotsTable.computedAt)).limit(50);
    const requiresReview = snapshots.filter(s => s.requiresReview).length;
    const highPressure = snapshots.filter(s => s.overallScore >= 0.70).length;
    const silenceWindows = await db.select().from(pcCarrierSilenceWindowsTable)
      .where(and(eq(pcCarrierSilenceWindowsTable.orgId, ORG_ID), eq(pcCarrierSilenceWindowsTable.isCurrent, true)));
    res.json({
      summary: { totalSnapshots: snapshots.length, requiresReview, highPressure, activeSilenceWindows: silenceWindows.length },
      recentSnapshots: snapshots.slice(0, 20),
      activeSilenceWindows: silenceWindows.slice(0, 10),
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch pressure admin data" });
  }
});

router.get("/admin/friction", async (_req: Request, res: Response) => {
  try {
    const snapshots = await db.select().from(pcSettlementFrictionSnapshotsTable)
      .where(eq(pcSettlementFrictionSnapshotsTable.orgId, ORG_ID))
      .orderBy(desc(pcSettlementFrictionSnapshotsTable.computedAt)).limit(50);
    const requiresReview = snapshots.filter(s => s.requiresReview).length;
    const highFriction = snapshots.filter(s => s.overallScore >= 0.70).length;
    const recommendations = await db.select().from(pcMovementRecommendationsTable)
      .where(and(eq(pcMovementRecommendationsTable.orgId, ORG_ID), eq(pcMovementRecommendationsTable.status, "suggested"))).limit(20);
    res.json({
      summary: { totalSnapshots: snapshots.length, requiresReview, highFriction, pendingRecommendations: recommendations.length },
      recentSnapshots: snapshots.slice(0, 20),
      pendingRecommendations: recommendations.slice(0, 10),
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch friction admin data" });
  }
});

router.get("/admin/portfolio-learning", async (_req: Request, res: Response) => {
  try {
    const [benchmarks, effectiveness, cohorts, teamLag] = await Promise.all([
      db.select().from(pcPortfolioBenchmarkSnapshotsTable).where(eq(pcPortfolioBenchmarkSnapshotsTable.orgId, ORG_ID)).orderBy(desc(pcPortfolioBenchmarkSnapshotsTable.computedAt)).limit(20),
      db.select().from(pcPortfolioActionEffectivenessTable).where(eq(pcPortfolioActionEffectivenessTable.orgId, ORG_ID)).limit(20),
      db.select().from(pcPortfolioMatterCohortsTable).where(eq(pcPortfolioMatterCohortsTable.orgId, ORG_ID)).orderBy(desc(pcPortfolioMatterCohortsTable.computedAt)).limit(30),
      db.select().from(pcPortfolioTeamLagMetricsTable).where(eq(pcPortfolioTeamLagMetricsTable.orgId, ORG_ID)).limit(20),
    ]);
    res.json({ benchmarks, effectiveness, cohorts, teamLag });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch portfolio learning admin data" });
  }
});

router.get("/admin/worldline", async (_req: Request, res: Response) => {
  try {
    const [overlays, weather, regulatory, recovery] = await Promise.all([
      db.select().from(pcWorldlineSignalOverlaysTable).where(eq(pcWorldlineSignalOverlaysTable.orgId, ORG_ID)).orderBy(desc(pcWorldlineSignalOverlaysTable.createdAt)).limit(20),
      db.select().from(pcWorldlineWeatherEventsTable).where(eq(pcWorldlineWeatherEventsTable.orgId, ORG_ID)).orderBy(desc(pcWorldlineWeatherEventsTable.fetchedAt)).limit(10),
      db.select().from(pcWorldlineRegulatoryEventsTable).where(eq(pcWorldlineRegulatoryEventsTable.orgId, ORG_ID)).orderBy(desc(pcWorldlineRegulatoryEventsTable.fetchedAt)).limit(10),
      db.select().from(pcWorldlineRecoveryMarkersTable).where(eq(pcWorldlineRecoveryMarkersTable.orgId, ORG_ID)).orderBy(desc(pcWorldlineRecoveryMarkersTable.fetchedAt)).limit(10),
    ]);
    res.json({
      summary: { signalOverlays: overlays.length, weatherEvents: weather.length, regulatoryEvents: regulatory.length, recoveryMarkers: recovery.length },
      recentOverlays: overlays.slice(0, 10),
      weatherEvents: weather,
      regulatoryEvents: regulatory,
      recoveryMarkers: recovery,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch worldline admin data" });
  }
});

router.get("/admin/quality", async (_req: Request, res: Response) => {
  try {
    const quietRisks = await db.select().from(pcQuietRiskSnapshotsTable)
      .where(eq(pcQuietRiskSnapshotsTable.orgId, ORG_ID))
      .orderBy(desc(pcQuietRiskSnapshotsTable.riskScore)).limit(20);
    const highRiskCount = quietRisks.filter(r => r.riskScore >= 0.60).length;
    res.json({
      summary: { quietRiskMatters: quietRisks.length, highRiskCount },
      quietRisks: quietRisks.slice(0, 10),
      qualityWarnings: quietRisks.filter(r => r.requiresReview).map(r => ({
        matterId: r.matterId, riskScore: r.riskScore,
        signals: r.topSignals, requiresReview: r.requiresReview,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch quality admin data" });
  }
});

export const prismCounselPilotOneRouter = router;
