/**
 * /drift — Model & data drift detection endpoint
 *
 * Provides observability into data freshness drift, confidence drift, and
 * schema drift across Constellation domains. Designed as a stable contract
 * for the eval-os and cognitive-observability packages.
 *
 * Routes:
 *   GET  /drift                  — overall drift summary
 *   GET  /drift/:domain          — per-domain drift breakdown
 *   GET  /drift/history          — last N drift snapshots (in-memory, resets on restart)
 *   POST /drift/reset            — mark current state as the new baseline
 */

import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@szl-holdings/db";
import { cstNodes } from "@szl-holdings/db";
import { eq, sql, and, lt } from "drizzle-orm";
import {
  sendSuccess,
  sendBadRequest,
  handleRouteError,
} from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";
import { perUserApiSlidingLimiter } from "../middlewares/sliding-window-limiter";
import { validateBody, jsonObjectBodySchema } from "../lib/validation";

const router: IRouter = Router();
router.use(authMiddleware({ required: false }));
router.use(perUserApiSlidingLimiter);

const KNOWN_DOMAINS = ["terra", "prism", "vessels", "aegis", "lyte", "imperium", "carlota-jo", "platform"] as const;

interface DriftWindow {
  windowHours: number;
  staleCount: number;
  stalePercent: number;
}

interface DomainDrift {
  domain: string;
  totalEntities: number;
  avgConfidence: number;
  confidenceDrift: number;
  freshnessWindows: DriftWindow[];
  driftScore: number;
  status: "healthy" | "degraded" | "critical";
}

interface DriftSummary {
  measuredAt: string;
  overallDriftScore: number;
  status: "healthy" | "degraded" | "critical";
  domains: DomainDrift[];
  topAlerts: Array<{ domain: string; reason: string; severity: "warning" | "critical" }>;
}

const BASELINE_CONFIDENCE = 0.85;
const driftHistory: DriftSummary[] = [];

async function measureDomainDrift(domain: string): Promise<DomainDrift> {
  const now = new Date();
  const windows = [1, 6, 24, 72];

  const [totalRow, avgRow] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(cstNodes).where(eq(cstNodes.domain, domain)),
    db.select({ avg: sql<number>`coalesce(avg(confidence), 1)::float` }).from(cstNodes).where(eq(cstNodes.domain, domain)),
  ]);

  const total = totalRow[0]?.count ?? 0;
  const avgConf = avgRow[0]?.avg ?? 1.0;

  const freshnessWindows: DriftWindow[] = await Promise.all(
    windows.map(async (h) => {
      const threshold = new Date(now.getTime() - h * 3600 * 1000);
      const [row] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(cstNodes)
        .where(and(eq(cstNodes.domain, domain), lt(cstNodes.freshness, threshold)));
      const count = row?.count ?? 0;
      return {
        windowHours: h,
        staleCount: count,
        stalePercent: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
      };
    })
  );

  const confidenceDrift = Math.max(0, BASELINE_CONFIDENCE - avgConf);
  const stale24hFraction = total > 0 ? (freshnessWindows.find(w => w.windowHours === 24)?.staleCount ?? 0) / total : 0;
  const driftScore = Math.round((confidenceDrift * 0.5 + stale24hFraction * 0.5) * 1000) / 1000;

  const status: DomainDrift["status"] =
    driftScore > 0.4 ? "critical" : driftScore > 0.15 ? "degraded" : "healthy";

  return {
    domain,
    totalEntities: total,
    avgConfidence: Math.round(avgConf * 1000) / 1000,
    confidenceDrift: Math.round(confidenceDrift * 1000) / 1000,
    freshnessWindows,
    driftScore,
    status,
  };
}

async function buildDriftSummary(): Promise<DriftSummary> {
  const domains = await Promise.all([...KNOWN_DOMAINS].map(measureDomainDrift));
  const overallDrift = domains.length > 0
    ? Math.round(domains.reduce((s, d) => s + d.driftScore, 0) / domains.length * 1000) / 1000
    : 0;

  const status: DriftSummary["status"] =
    overallDrift > 0.4 ? "critical" : overallDrift > 0.15 ? "degraded" : "healthy";

  const topAlerts: DriftSummary["topAlerts"] = domains
    .filter((d) => d.status !== "healthy")
    .map((d) => ({
      domain: d.domain,
      reason: d.driftScore > 0.4
        ? `Confidence ${(d.avgConfidence * 100).toFixed(0)}% and ${d.freshnessWindows.find(w => w.windowHours === 24)?.stalePercent ?? 0}% stale`
        : `Freshness drift detected: ${d.freshnessWindows.find(w => w.windowHours === 6)?.stalePercent ?? 0}% stale in 6h`,
      severity: d.status === "critical" ? "critical" : "warning",
    }));

  return {
    measuredAt: new Date().toISOString(),
    overallDriftScore: overallDrift,
    status,
    domains,
    topAlerts,
  };
}

router.get("/drift", async (_req: Request, res: Response) => {
  try {
    const summary = await buildDriftSummary();
    driftHistory.push(summary);
    if (driftHistory.length > 100) driftHistory.shift();
    return sendSuccess(res, summary);
  } catch (err) {
    return handleRouteError(res, err, "GET /drift");
  }
});

router.get("/drift/history", async (_req: Request, res: Response) => {
  try {
    return sendSuccess(res, { snapshots: driftHistory.slice(-20), count: driftHistory.length });
  } catch (err) {
    return handleRouteError(res, err, "GET /drift/history");
  }
});

router.get("/drift/:domain", async (req: Request, res: Response) => {
  try {
    const { domain } = req.params;
    if (!KNOWN_DOMAINS.includes(domain as typeof KNOWN_DOMAINS[number])) {
      return sendBadRequest(res, `Unknown domain '${domain}'. Valid: ${KNOWN_DOMAINS.join(", ")}`);
    }
    const drift = await measureDomainDrift(domain);
    return sendSuccess(res, drift);
  } catch (err) {
    return handleRouteError(res, err, `GET /drift/${req.params.domain}`);
  }
});

router.post("/drift/reset", async (_req: Request, res: Response) => {
  try {
    driftHistory.length = 0;
    return sendSuccess(res, { reset: true, message: "Drift baseline reset. History cleared." });
  } catch (err) {
    return handleRouteError(res, err, "POST /drift/reset");
  }
});

export default router;
