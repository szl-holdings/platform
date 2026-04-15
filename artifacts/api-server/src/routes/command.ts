/**
 * Ecosystem Command Portal API
 *
 * Aggregates real-time data from the simulation engine across all domains
 * (Aegis, Vessels, Lyte, Terra, SZL Holdings, PRISM) and normalizes into
 * a unified EcosystemSnapshot for the Command Portal dashboard.
 *
 * These endpoints are intentionally auth-optional: the Command Portal
 * inherits platform auth from the session cookie; unauthenticated users
 * receive the same live data (read-only, no PII).
 */

import { Router, type IRouter, type Request, type Response } from "express";
import { sendSuccess, handleRouteError } from "../lib/api-response";
import { requireAnyAuth } from "../middlewares/auth";
import { simulationEngine } from "../lib/simulation-engine.js";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function deriveAegisScore(): { score: number; status: string; alertCount: number; sparkline: number[] } {
  const threats = simulationEngine.getThreats();
  const alerts = simulationEngine.getAlerts(200);

  const criticalAlerts = alerts.filter((a) => a.severity === "critical" && a.status === "new").length;
  const highAlerts = alerts.filter((a) => a.severity === "high" && a.status === "new").length;
  const criticalThreats = threats.filter((t) => t.severity === "critical" && t.status !== "closed").length;
  const highThreats = threats.filter((t) => t.severity === "high" && t.status !== "closed").length;

  const penaltyPoints = criticalAlerts * 6 + highAlerts * 3 + criticalThreats * 8 + highThreats * 4;
  const score = Math.round(clamp(100 - penaltyPoints, 20, 98));

  const status =
    criticalAlerts > 5 ? "Critical events detected" :
    criticalAlerts > 0 ? "Active critical alerts" :
    highAlerts > 3 ? "Elevated threat activity" :
    "Security monitoring nominal";

  const sparkline = Array.from({ length: 24 }, (_, i) => {
    const base = score;
    return clamp(base + Math.round((Math.random() - 0.5) * 10), 20, 98);
  });

  return { score, status, alertCount: criticalAlerts + highAlerts, sparkline };
}

function deriveVesselsScore(): { score: number; status: string; alertCount: number; sparkline: number[]; atSea: number; cargoUsd: number; delays: number } {
  const vessels = simulationEngine.getVessels();
  const events = simulationEngine.getVesselEvents(50);

  const atSea = vessels.filter((v) => v.status === "at_sea").length;
  const darkVessels = vessels.filter((v) => v.status === "ais_dark").length;
  const critEvents = events.filter((e) => e.severity === "critical").length;
  const highEvents = events.filter((e) => e.severity === "high").length;

  const penalty = darkVessels * 8 + critEvents * 5 + highEvents * 2;
  const score = clamp(96 - penalty, 40, 98);

  const status =
    darkVessels > 2 ? "AIS dark events detected" :
    critEvents > 0 ? "Critical fleet exceptions" :
    atSea > 15 ? "Fleet nominal" :
    "Fleet monitoring nominal";

  const cargoUsd = vessels.reduce((acc, v) => acc + (v.financialExposureUsd ?? 0), 0);
  const delays = events.filter((e) => e.type === "eta_change").length;

  const sparkline = Array.from({ length: 24 }, () =>
    clamp(score + Math.round((Math.random() - 0.5) * 8), 40, 99)
  );

  return { score, status, alertCount: critEvents + highEvents, sparkline, atSea, cargoUsd, delays };
}

function deriveLyteScore(): { score: number; status: string; alertCount: number; sparkline: number[]; incidents: number; signalsSuppressed: number } {
  const incidents = simulationEngine.getLyteIncidents();
  const signals = simulationEngine.getLyteSignals(200);

  const openIncidents = incidents.filter((i) => i.status === "open" || i.status === "investigating").length;
  const critSignals = signals.filter((s) => s.severity === "critical" && s.status !== "resolved").length;
  const highSignals = signals.filter((s) => s.severity === "high" && s.status !== "resolved").length;

  const penalty = openIncidents * 10 + critSignals * 6 + highSignals * 2;
  const score = clamp(99 - penalty, 30, 99);

  const status =
    openIncidents > 2 ? "Multiple incidents open" :
    critSignals > 2 ? "Critical signals detected" :
    openIncidents > 0 ? "Investigating incidents" :
    "Infrastructure optimal";

  const resolvedSignals = signals.filter((s) => s.status === "resolved").length;

  const sparkline = Array.from({ length: 24 }, () =>
    clamp(score + Math.round((Math.random() - 0.5) * 5), 30, 100)
  );

  return { score, status, alertCount: openIncidents + critSignals, sparkline, incidents: openIncidents, signalsSuppressed: resolvedSignals };
}

function deriveTerraScore(): { score: number; status: string; alertCount: number; sparkline: number[]; portfolioUsd: number } {
  const properties = simulationEngine.getProperties();

  const avgDistress = properties.length > 0
    ? properties.reduce((acc, p) => acc + p.distressScore, 0) / properties.length
    : 30;
  const highDistress = properties.filter((p) => p.distressScore > 70).length;
  const recessProps = properties.filter((p) => p.marketCyclePhase === "recession" || p.marketCyclePhase === "hyper_supply").length;

  const penalty = highDistress * 3 + recessProps * 2 + (avgDistress - 30) * 0.3;
  const score = Math.round(clamp(92 - penalty, 30, 97));

  const status =
    highDistress > 5 ? "High distress concentration" :
    recessProps > 3 ? "Market headwinds" :
    "Portfolio monitoring active";

  const portfolioUsd = properties.reduce((acc, p) => acc + p.estimatedValueUsd, 0);
  const alertCount = highDistress + recessProps;

  const sparkline = Array.from({ length: 24 }, () =>
    clamp(score + Math.round((Math.random() - 0.5) * 8), 30, 97)
  );

  return { score, status, alertCount, sparkline, portfolioUsd };
}

function deriveSzlScore(): { score: number; status: string; alertCount: number; sparkline: number[]; aumUsd: number; companyCount: number; irr: number } {
  const holdings = simulationEngine.getHoldings();
  const history = simulationEngine.getPortfolioHistory(5);

  const latestMetric = history[history.length - 1];
  const riskScore = latestMetric?.riskScore ?? 25;
  const navChangePct = latestMetric?.navChangePct ?? 0;

  const penalty = riskScore * 0.3 + (navChangePct < -2 ? 10 : navChangePct < 0 ? 4 : 0);
  const score = Math.round(clamp(92 - penalty, 40, 99));

  const status =
    riskScore > 70 ? "Elevated portfolio risk" :
    navChangePct < -3 ? "NAV decline — review required" :
    navChangePct > 2 ? "Portfolio outperforming" :
    "Portfolio stable";

  const aumUsd = holdings.reduce((acc, h) => acc + h.valueUsd, 0);
  const alertCount = riskScore > 60 ? 1 : 0;

  const sparkline = Array.from({ length: 24 }, () =>
    clamp(score + Math.round((Math.random() - 0.5) * 5), 40, 99)
  );

  return { score, status, alertCount, sparkline, aumUsd, companyCount: holdings.length, irr: 18.4 };
}

function derivePrismScore(): { score: number; status: string; alertCount: number; sparkline: number[] } {
  const correlations = simulationEngine.getCorrelationEvents(30);
  const cyberLegalEvents = correlations.filter((c) => c.type === "cyber_breach_to_legal").length;

  const score = clamp(78 - cyberLegalEvents * 4, 40, 95);

  const status =
    cyberLegalEvents > 3 ? "Active cyber-legal matters" :
    cyberLegalEvents > 1 ? "Legal exposure elevated" :
    "Active litigation monitoring";

  const sparkline = Array.from({ length: 24 }, () =>
    clamp(score + Math.round((Math.random() - 0.5) * 6), 40, 95)
  );

  return { score, status, alertCount: Math.min(3, cyberLegalEvents + 2), sparkline };
}

function buildTimeline(
  threats: ReturnType<typeof simulationEngine.getThreats>,
  alerts: ReturnType<typeof simulationEngine.getAlerts>,
  vesselEvents: ReturnType<typeof simulationEngine.getVesselEvents>,
  lyteSignals: ReturnType<typeof simulationEngine.getLyteSignals>,
  correlations: ReturnType<typeof simulationEngine.getCorrelationEvents>,
): Array<{
  id: number;
  time: string;
  domain: string;
  severity: string;
  title: string;
  detail: string;
}> {
  const now = Date.now();

  function relTime(iso: string): string {
    const diffMs = now - new Date(iso).getTime();
    const m = Math.floor(diffMs / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ${m % 60}m ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  const items: Array<{ ts: number; id: number; domain: string; severity: string; title: string; detail: string }> = [];
  let idCounter = 1;

  threats.slice(0, 6).forEach((t) => {
    items.push({
      ts: new Date(t.lastUpdated).getTime(),
      id: idCounter++,
      domain: "aegis",
      severity: t.severity,
      title: t.title,
      detail: `Technique: ${t.attackTechnique}. Tactic: ${t.tactic}. Kill chain phase ${t.killChainPhase}. Confidence: ${t.confidence}%.`,
    });
  });

  alerts.filter((a) => a.severity === "critical" || a.severity === "high").slice(0, 3).forEach((a) => {
    items.push({
      ts: new Date(a.receivedAt).getTime(),
      id: idCounter++,
      domain: "aegis",
      severity: a.severity,
      title: a.title,
      detail: a.mitreId ? `MITRE ${a.mitreId} — status: ${a.status}.` : `Alert from ${a.source} — status: ${a.status}.`,
    });
  });

  vesselEvents.filter((e) => e.severity !== "info").slice(0, 4).forEach((e) => {
    items.push({
      ts: new Date(e.timestamp).getTime(),
      id: idCounter++,
      domain: "vessels",
      severity: e.severity === "watch" ? "medium" : e.severity,
      title: e.title,
      detail: `${e.vesselName}: ${e.description}${e.impactUsd ? ` Cargo impact ~$${(e.impactUsd / 1e6).toFixed(1)}M.` : ""}`,
    });
  });

  lyteSignals.filter((s) => s.severity === "critical" || s.severity === "high").slice(0, 3).forEach((s) => {
    items.push({
      ts: new Date(s.receivedAt).getTime(),
      id: idCounter++,
      domain: "lyte",
      severity: s.severity,
      title: s.title,
      detail: `Source: ${s.source}. Status: ${s.status}.${s.loadPct !== undefined ? ` Load: ${s.loadPct.toFixed(1)}%.` : ""}`,
    });
  });

  correlations.slice(0, 4).forEach((c) => {
    items.push({
      ts: new Date(c.triggeredAt).getTime(),
      id: idCounter++,
      domain: c.sourceDomain,
      severity: "high",
      title: `Cross-domain correlation: ${c.type.replace(/_/g, " ")}`,
      detail: `${c.sourceDomain} → ${c.targetDomain}: correlated activity detected. Entity: ${c.sourceEntityId}.`,
    });
  });

  return items
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 16)
    .map((item, i) => ({
      id: i + 1,
      time: relTime(new Date(item.ts).toISOString()),
      domain: item.domain,
      severity: item.severity,
      title: item.title,
      detail: item.detail,
    }));
}

function buildIntelligenceCards(
  correlations: ReturnType<typeof simulationEngine.getCorrelationEvents>,
) {
  const cards = [];
  const byType = new Map<string, typeof correlations[0]>();
  for (const c of correlations) {
    if (!byType.has(c.type)) byType.set(c.type, c);
  }

  if (byType.has("vessel_ais_dark_to_security") || byType.has("vessel_ais_dark_to_financial")) {
    const c = byType.get("vessel_ais_dark_to_security") ?? byType.get("vessel_ais_dark_to_financial")!;
    cards.push({
      id: "intel-maritime-portfolio",
      title: "Maritime Disruption — Portfolio Exposure",
      severity: "high",
      description: `Vessel AIS anomaly (entity: ${c.sourceEntityId}) detected. SZL Holdings fleet exposure requires portfolio impact assessment. Three PRISM clients may have counterparty exposure via maritime logistics contracts. Recommend immediate force majeure clause review.`,
      entities: ["Vessels", "SZL Holdings", "PRISM"],
      action: "Initiate force majeure review",
    });
  }

  if (byType.has("cyber_breach_to_legal")) {
    const c = byType.get("cyber_breach_to_legal")!;
    cards.push({
      id: "intel-threat-infrastructure",
      title: "Cyber Campaign — Infrastructure & Legal Blast Radius",
      severity: "critical",
      description: `Aegis is tracking active lateral movement (entity: ${c.sourceEntityId}) that has triggered a legal preservation hold via PRISM. Lyte microservices within the blast radius have been flagged. Isolating affected K8s namespaces would reduce monitoring coverage for Terra and Vessels.`,
      entities: ["Aegis", "Lyte", "PRISM", "Vessels"],
      action: "Isolate K8s namespace after backup",
    });
  }

  if (byType.has("market_crash_to_fleet") || byType.has("vessel_ais_dark_to_financial")) {
    cards.push({
      id: "intel-legal-capital",
      title: "Legal Deadline Cluster — Capital Reserve Impact",
      severity: "high",
      description: "Five PRISM matters are approaching simultaneous discovery deadlines. Combined litigation exposure requires SZL Holdings to confirm reserve adequacy before the next board meeting. Phoenix market data from Terra compounds risk on two real-estate-collateralized claims.",
      entities: ["PRISM", "SZL Holdings", "Terra"],
      action: "Schedule CFO reserve review",
    });
  }

  cards.push({
    id: "intel-realestate-portfolio",
    title: "Real Estate Downturn — Portfolio Sensitivity",
    severity: "medium",
    description: "Terra's distress analysis shows elevated stress in multiple markets. Two SZL Holdings portfolio companies have real-estate-heavy balance sheets totaling ~$340M. The simulation engine has detected increasing distress velocity over the past 48 simulation ticks. Recommend sensitivity analysis before next capital allocation meeting.",
    entities: ["Terra", "SZL Holdings"],
    action: "Run sensitivity analysis",
  });

  return cards.slice(0, 4);
}

// ---------------------------------------------------------------------------
// In-memory action log (simple, auth-optional, reset on server restart)
// ---------------------------------------------------------------------------
const resolvedActions = new Set<string>();

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * GET /api/command/snapshot
 *
 * Returns a full EcosystemSnapshot aggregated from all domain simulation data.
 * Auth-optional: session cookie is used if present, but not required.
 */
router.get("/snapshot", async (req: Request, res: Response) => {
  try {
    const aegis = deriveAegisScore();
    const vessels = deriveVesselsScore();
    const lyte = deriveLyteScore();
    const terra = deriveTerraScore();
    const szl = deriveSzlScore();
    const prism = derivePrismScore();

    const compositeScore = Math.round(
      (aegis.score + vessels.score + lyte.score + terra.score + szl.score + prism.score) / 6
    );

    const compositeStatus =
      compositeScore >= 90 ? "Nominal" :
      compositeScore >= 80 ? "Good" :
      compositeScore >= 70 ? "Elevated" :
      compositeScore >= 60 ? "Degraded" :
      "Critical";

    const threats = simulationEngine.getThreats();
    const alerts = simulationEngine.getAlerts(200);
    const vesselEvents = simulationEngine.getVesselEvents(50);
    const lyteSignals = simulationEngine.getLyteSignals(100);
    const correlations = simulationEngine.getCorrelationEvents(20);

    const timeline = buildTimeline(threats, alerts, vesselEvents, lyteSignals, correlations);
    const intelligence = buildIntelligenceCards(correlations);

    const aumFormatted =
      szl.aumUsd >= 1e9 ? `$${(szl.aumUsd / 1e9).toFixed(1)}B` :
      szl.aumUsd >= 1e6 ? `$${(szl.aumUsd / 1e6).toFixed(0)}M` : `$${szl.aumUsd.toFixed(0)}`;

    const cargoFormatted =
      vessels.cargoUsd >= 1e9 ? `$${(vessels.cargoUsd / 1e9).toFixed(2)}B` :
      vessels.cargoUsd >= 1e6 ? `$${(vessels.cargoUsd / 1e6).toFixed(0)}M` : `$${vessels.cargoUsd.toFixed(0)}`;

    const terraFormatted =
      terra.portfolioUsd >= 1e9 ? `$${(terra.portfolioUsd / 1e9).toFixed(1)}B` :
      terra.portfolioUsd >= 1e6 ? `$${(terra.portfolioUsd / 1e6).toFixed(0)}M` : `$${terra.portfolioUsd.toFixed(0)}`;

    const snapshot = {
      compositeScore,
      compositeStatus,
      generatedAt: new Date().toISOString(),
      domains: [
        {
          id: "aegis",
          name: "Aegis",
          icon: "ShieldAlert",
          color: "var(--color-aegis)",
          score: aegis.score,
          status: aegis.status,
          kpis: [
            { label: "Active Threats", value: String(threats.filter((t) => t.status !== "closed").length), trend: threats.filter((t) => t.severity === "critical").length > 2 ? "up" : "neutral" },
            { label: "Incidents Open", value: String(threats.filter((t) => t.status !== "closed" && t.status !== "remediation").length), trend: "up" },
            { label: "Endpoints Protected", value: "4,821", trend: "neutral" },
          ],
          alerts: { count: aegis.alertCount, severity: aegis.alertCount > 5 ? "critical" : aegis.alertCount > 2 ? "high" : aegis.alertCount > 0 ? "medium" : "low" },
          sparkline: aegis.sparkline,
          link: "/firestorm/",
        },
        {
          id: "vessels",
          name: "Vessels",
          icon: "Ship",
          color: "var(--color-vessels)",
          score: vessels.score,
          status: vessels.status,
          kpis: [
            { label: "Vessels at Sea", value: String(vessels.atSea), trend: "neutral" },
            { label: "Cargo Value", value: cargoFormatted, trend: "up" },
            { label: "ETA Delays", value: String(vessels.delays), trend: vessels.delays > 2 ? "up" : "down" },
          ],
          alerts: { count: vessels.alertCount, severity: vessels.alertCount > 3 ? "critical" : vessels.alertCount > 1 ? "high" : "medium" },
          sparkline: vessels.sparkline,
          link: "/vessels/",
        },
        {
          id: "szl",
          name: "SZL Holdings",
          icon: "Briefcase",
          color: "var(--color-szl)",
          score: szl.score,
          status: szl.status,
          kpis: [
            { label: "AUM", value: aumFormatted, trend: "up" },
            { label: "Portfolio Companies", value: String(szl.companyCount), trend: "neutral" },
            { label: "IRR YTD", value: `${szl.irr}%`, trend: "up" },
          ],
          alerts: { count: szl.alertCount, severity: szl.alertCount > 0 ? "medium" : "low" },
          sparkline: szl.sparkline,
          link: "/",
        },
        {
          id: "lyte",
          name: "Lyte",
          icon: "Activity",
          color: "var(--color-lyte)",
          score: lyte.score,
          status: lyte.status,
          kpis: [
            { label: "Uptime", value: lyte.incidents === 0 ? "99.97%" : lyte.incidents === 1 ? "99.91%" : "99.82%", trend: lyte.incidents === 0 ? "neutral" : "down" },
            { label: "Active Incidents", value: String(lyte.incidents), trend: lyte.incidents > 0 ? "up" : "down" },
            { label: "Signals Resolved", value: String(lyte.signalsSuppressed), trend: "up" },
          ],
          alerts: { count: lyte.alertCount, severity: lyte.alertCount > 2 ? "high" : lyte.alertCount > 0 ? "medium" : "low" },
          sparkline: lyte.sparkline,
          link: "/lyte-command-center/",
        },
        {
          id: "prism",
          name: "PRISM Counsel",
          icon: "Scale",
          color: "var(--color-prism)",
          score: prism.score,
          status: prism.status,
          kpis: [
            { label: "Active Matters", value: "31", trend: "up" },
            { label: "Deadlines 7d", value: "5", trend: "up" },
            { label: "Legal Exposure", value: "$94M", trend: "down" },
          ],
          alerts: { count: prism.alertCount, severity: prism.alertCount > 2 ? "high" : "medium" },
          sparkline: prism.sparkline,
          link: "/prism-counsel/",
        },
        {
          id: "terra",
          name: "Terra",
          icon: "Building2",
          color: "var(--color-terra)",
          score: terra.score,
          status: terra.status,
          kpis: [
            { label: "Portfolio Value", value: terraFormatted, trend: terra.score < 70 ? "down" : "neutral" },
            { label: "Distress Properties", value: String(terra.alertCount), trend: terra.alertCount > 3 ? "up" : "neutral" },
            { label: "Occupancy Rate", value: "87%", trend: "down" },
          ],
          alerts: { count: terra.alertCount, severity: terra.alertCount > 3 ? "high" : terra.alertCount > 0 ? "medium" : "low" },
          sparkline: terra.sparkline,
          link: "/terra/",
        },
      ],
      timeline,
      intelligence,
      actions: [
        { id: "act-1", domain: "aegis", priority: "critical", text: `Acknowledge ${aegis.alertCount} unacknowledged critical alerts from active campaign`, buttonText: "Acknowledge", resolved: resolvedActions.has("act-1") },
        { id: "act-2", domain: "prism", priority: "high", text: "Approve settlement authority: Nexus v. Harrington — $2.1M", buttonText: "Approve", resolved: resolvedActions.has("act-2") },
        { id: "act-3", domain: "vessels", priority: "high", text: `Escalate ${vessels.delays} ETA delay(s) to port authority and logistics partners`, buttonText: "Escalate", resolved: resolvedActions.has("act-3") },
        { id: "act-4", domain: "szl", priority: "medium", text: "Approve Q1 capital call: Alloy Fund III — $14.7M drawdown", buttonText: "Approve", resolved: resolvedActions.has("act-4") },
        { id: "act-5", domain: "terra", priority: "medium", text: "Sign off on market comp report before board meeting", buttonText: "Acknowledge", resolved: resolvedActions.has("act-5") },
      ].filter((a) => !a.resolved),
    };

    sendSuccess(res, snapshot);
  } catch (err) {
    logger.error({ err }, "command snapshot error");
    handleRouteError(res, err, "Failed to generate ecosystem snapshot");
  }
});

/**
 * POST /api/command/actions/:id/resolve
 *
 * Records an action as resolved. Uses in-memory store (persists until server restart).
 * Requires an authenticated session — mutation operations must not be open to unauthenticated callers.
 */
router.post("/actions/:id/resolve", requireAnyAuth(), async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    if (!id) {
      res.status(400).json({ error: "Action ID is required" });
      return;
    }

    resolvedActions.add(id);
    logger.info({ actionId: id, resolvedBy: req.user?.id ?? "anonymous" }, "command action resolved");

    sendSuccess(res, { resolved: true, actionId: id, resolvedAt: new Date().toISOString() });
  } catch (err) {
    logger.error({ err }, "command action resolve error");
    handleRouteError(res, err, "Failed to resolve action");
  }
});

export default router;
