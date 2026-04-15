/**
 * Morning Briefing Engine
 *
 * Aggregates real-time cross-domain signals from Aegis, Vessels, Lyte, Terra,
 * and SZL Holdings into a daily executive briefing document. Briefings are
 * generated on demand and cached in the database.
 *
 * Routes:
 *   GET  /briefing/today         — get or generate today's briefing
 *   GET  /briefing/history       — list recent briefings (last 30 days)
 *   GET  /briefing/:date         — get briefing for a specific date (YYYY-MM-DD)
 *   POST /briefing/generate      — force-regenerate today's briefing
 */

import { Router, type IRouter } from "express";
import { db, dailyBriefingsTable } from "@szl-holdings/db";
import { desc, eq, and, gte } from "drizzle-orm";
import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendBadRequest,
  handleRouteError,
} from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";
import { perUserApiSlidingLimiter, perUserWriteSlidingLimiter } from "../middlewares/sliding-window-limiter";
import { simulationEngine } from "../lib/simulation-engine.js";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

interface AggregatedSignal {
  domain: string;
  level: "info" | "warning" | "critical";
  title: string;
  summary: string;
  count: number;
}

function aggregateSignals(): {
  signals: AggregatedSignal[];
  domainScores: Record<string, number>;
  totalAlerts: number;
  criticalCount: number;
  highCount: number;
  overallHealth: string;
  headline: string;
  executiveSummary: string;
} {
  const threats = simulationEngine.getThreats();
  const alerts = simulationEngine.getAlerts(200);
  const vessels = simulationEngine.getVessels();
  const vesselEvents = simulationEngine.getVesselEvents(100);
  const lyteSignals = simulationEngine.getLyteSignals(50);
  const lyteIncidents = simulationEngine.getLyteIncidents();
  const properties = simulationEngine.getProperties();
  const holdings = simulationEngine.getHoldings();
  const correlations = simulationEngine.getCorrelationEvents(20);

  const signals: AggregatedSignal[] = [];

  const critAegis = alerts.filter((a) => a.severity === "critical" && a.status === "new").length;
  const highAegis = alerts.filter((a) => a.severity === "high" && a.status === "new").length;
  if (critAegis > 0 || highAegis > 0) {
    signals.push({
      domain: "firestorm",
      level: critAegis > 0 ? "critical" : "warning",
      title: `${critAegis + highAegis} active security ${critAegis + highAegis === 1 ? "alert" : "alerts"}`,
      summary: `${critAegis} critical, ${highAegis} high-severity alerts require SOC attention.`,
      count: critAegis + highAegis,
    });
  }

  const darkVessels = vessels.filter((v) => v.status === "ais_dark").length;
  const critVesselEvents = vesselEvents.filter((e) => e.severity === "critical").length;
  if (darkVessels > 0 || critVesselEvents > 0) {
    signals.push({
      domain: "vessels",
      level: darkVessels > 2 || critVesselEvents > 0 ? "critical" : "warning",
      title: `Fleet status: ${darkVessels} dark vessel${darkVessels !== 1 ? "s" : ""}`,
      summary: `${vessels.length} vessels tracked. ${darkVessels} AIS-dark, ${critVesselEvents} critical events.`,
      count: darkVessels + critVesselEvents,
    });
  } else if (vessels.length > 0) {
    signals.push({
      domain: "vessels",
      level: "info",
      title: `Fleet nominal — ${vessels.filter((v) => v.status === "at_sea").length} vessels at sea`,
      summary: `All ${vessels.length} tracked vessels reporting nominal AIS status.`,
      count: vessels.length,
    });
  }

  const openIncidents = lyteIncidents.filter((i) => i.status !== "resolved").length;
  if (openIncidents > 0) {
    signals.push({
      domain: "lyte",
      level: openIncidents > 2 ? "critical" : "warning",
      title: `${openIncidents} open infrastructure incident${openIncidents !== 1 ? "s" : ""}`,
      summary: `${openIncidents} active incidents impacting SLO compliance across observed services.`,
      count: openIncidents,
    });
  }

  const distressProps = properties.filter((p: any) => p.distressScore > 0.7).length;
  if (distressProps > 0) {
    signals.push({
      domain: "terra",
      level: "warning",
      title: `${distressProps} high-distress properties flagged`,
      summary: `${distressProps} properties above 70% distress threshold require portfolio review.`,
      count: distressProps,
    });
  }

  if (correlations.length > 0) {
    signals.push({
      domain: "szl-holdings",
      level: "info",
      title: `${correlations.length} cross-domain correlations detected`,
      summary: `AI correlation engine identified ${correlations.length} signals spanning multiple domains requiring strategic attention.`,
      count: correlations.length,
    });
  }

  const totalAlerts = signals.reduce((s, sig) => s + sig.count, 0);
  const criticalCount = signals.filter((s) => s.level === "critical").reduce((acc, s) => acc + s.count, 0);
  const highCount = signals.filter((s) => s.level === "warning").reduce((acc, s) => acc + s.count, 0);

  const holdingNav = holdings.reduce((acc: number, h: any) => acc + (h.valueUsd ?? 0), 0);
  const navStr = holdingNav > 1e9
    ? `$${(holdingNav / 1e9).toFixed(2)}B`
    : holdingNav > 1e6
    ? `$${(holdingNav / 1e6).toFixed(1)}M`
    : `$${holdingNav.toLocaleString()}`;

  const overallHealth =
    criticalCount > 5 ? "critical" :
    criticalCount > 0 ? "degraded" :
    highCount > 3 ? "warning" :
    "nominal";

  const domainScores: Record<string, number> = {
    vessels: Math.max(40, 98 - (darkVessels * 10) - (critVesselEvents * 8)),
    firestorm: Math.max(20, 98 - (critAegis * 10) - (highAegis * 4)),
    terra: Math.max(50, 95 - (distressProps * 5)),
    lyte: Math.max(40, 96 - (openIncidents * 12)),
    "szl-holdings": Math.max(60, 92),
  };

  const headline =
    criticalCount > 0
      ? `${criticalCount} critical alert${criticalCount !== 1 ? "s" : ""} across ${signals.filter(s => s.level === "critical").length} domain${signals.filter(s => s.level === "critical").length !== 1 ? "s" : ""} require immediate attention`
      : signals.length > 0
      ? `${signals.length} intelligence signal${signals.length !== 1 ? "s" : ""} across ecosystem — portfolio NAV ${navStr}`
      : `All domains nominal — portfolio NAV ${navStr}`;

  const executiveSummary = [
    `As of ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} UTC, the SZL ecosystem is operating at ${overallHealth.toUpperCase()} status.`,
    signals.length > 0
      ? `${signals.length} intelligence signal${signals.length !== 1 ? "s" : ""} identified across ${[...new Set(signals.map(s => s.domain))].length} domains.`
      : "No critical signals detected.",
    holdingNav > 0 ? `Portfolio NAV: ${navStr}.` : "",
  ].filter(Boolean).join(" ");

  return { signals, domainScores, totalAlerts, criticalCount, highCount, overallHealth, headline, executiveSummary };
}

async function getOrGenerateBriefing(date: string, orgId: number | null, forceRegenerate = false) {
  if (!forceRegenerate) {
    const conditions: ReturnType<typeof eq>[] = [eq(dailyBriefingsTable.briefingDate, date)];
    if (orgId != null) conditions.push(eq(dailyBriefingsTable.orgId, orgId));

    const [existing] = await db
      .select()
      .from(dailyBriefingsTable)
      .where(and(...conditions))
      .limit(1);

    if (existing) return existing;
  }

  const agg = aggregateSignals();

  const [briefing] = await db
    .insert(dailyBriefingsTable)
    .values({
      orgId,
      briefingDate: date,
      headline: agg.headline,
      executiveSummary: agg.executiveSummary,
      signals: agg.signals,
      domainScores: agg.domainScores,
      totalAlerts: agg.totalAlerts,
      criticalCount: agg.criticalCount,
      highCount: agg.highCount,
      overallHealth: agg.overallHealth,
      isPublished: true,
    })
    .onConflictDoNothing()
    .returning();

  if (!briefing) {
    const conditions: ReturnType<typeof eq>[] = [eq(dailyBriefingsTable.briefingDate, date)];
    if (orgId != null) conditions.push(eq(dailyBriefingsTable.orgId, orgId));
    const [existing] = await db.select().from(dailyBriefingsTable).where(and(...conditions)).limit(1);
    return existing!;
  }

  logger.info({ date, orgId, overallHealth: agg.overallHealth }, "[Briefing] Generated daily briefing");
  return briefing;
}

router.get(
  "/briefing/today",
  authMiddleware({ required: false }),
  perUserApiSlidingLimiter,
  async (req, res) => {
    try {
      const orgId = (req.user?.orgs?.[0]?.orgId as number | undefined) ?? null;
      const briefing = await getOrGenerateBriefing(todayStr(), orgId);
      sendSuccess(res, briefing);
    } catch (err) {
      handleRouteError(res, err, "Failed to get today's briefing");
    }
  }
);

router.post(
  "/briefing/generate",
  authMiddleware({ required: false }),
  perUserWriteSlidingLimiter,
  async (req, res) => {
    try {
      const orgId = (req.user?.orgs?.[0]?.orgId as number | undefined) ?? null;
      const briefing = await getOrGenerateBriefing(todayStr(), orgId, true);
      sendCreated(res, briefing);
    } catch (err) {
      handleRouteError(res, err, "Failed to generate briefing");
    }
  }
);

router.get(
  "/briefing/history",
  authMiddleware({ required: false }),
  perUserApiSlidingLimiter,
  async (req, res) => {
    try {
      const orgId = (req.user?.orgs?.[0]?.orgId as number | undefined) ?? null;
      const limit = Math.min(Number(req.query["limit"] ?? 30), 90);

      const since = new Date();
      since.setDate(since.getDate() - limit);

      const conditions: ReturnType<typeof eq>[] = [gte(dailyBriefingsTable.generatedAt, since)];
      if (orgId != null) conditions.push(eq(dailyBriefingsTable.orgId, orgId));

      const briefings = await db
        .select()
        .from(dailyBriefingsTable)
        .where(and(...conditions))
        .orderBy(desc(dailyBriefingsTable.briefingDate))
        .limit(limit);

      sendSuccess(res, { briefings, count: briefings.length });
    } catch (err) {
      handleRouteError(res, err, "Failed to fetch briefing history");
    }
  }
);

router.get(
  "/briefing/:date",
  authMiddleware({ required: false }),
  perUserApiSlidingLimiter,
  async (req, res) => {
    try {
      const { date } = req.params as { date: string };
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        sendBadRequest(res, "Invalid date format — use YYYY-MM-DD");
        return;
      }

      const orgId = (req.user?.orgs?.[0]?.orgId as number | undefined) ?? null;
      const conditions: ReturnType<typeof eq>[] = [eq(dailyBriefingsTable.briefingDate, date)];
      if (orgId != null) conditions.push(eq(dailyBriefingsTable.orgId, orgId));

      const [briefing] = await db
        .select()
        .from(dailyBriefingsTable)
        .where(and(...conditions))
        .limit(1);

      if (!briefing) {
        sendNotFound(res, `No briefing found for ${date}`);
        return;
      }

      sendSuccess(res, briefing);
    } catch (err) {
      handleRouteError(res, err, "Failed to fetch briefing");
    }
  }
);

export default router;
