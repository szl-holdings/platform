import { Router, type IRouter } from "express";
import { authMiddleware } from "../middlewares/auth";
import {
  db,
  firestormIncidentsTable,
  firestormAlertsTable,
  vesselsAlertsTable,
  vesselsEventsTable,
  terraDistressPropertiesTable,
} from "@szl-holdings/db";
import { ne, desc, eq, and } from "drizzle-orm";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.use(authMiddleware());

const now = () => Date.now();

interface AmbientSignal {
  id: string;
  domain: string;
  title: string;
  summary: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  score: number;
  timestamp: number;
  actionUrl?: string;
  actionLabel?: string;
  live?: boolean;
}

async function fetchLiveAmbientSignals(): Promise<AmbientSignal[]> {
  const [incidents, vesselAlerts, vesselDelays, distressProps, secAlerts] = await Promise.all([
    db
      .select({ id: firestormIncidentsTable.id, title: firestormIncidentsTable.title, severity: firestormIncidentsTable.severity, createdAt: firestormIncidentsTable.createdAt })
      .from(firestormIncidentsTable)
      .where(ne(firestormIncidentsTable.status, "closed"))
      .orderBy(desc(firestormIncidentsTable.createdAt))
      .limit(5),
    db
      .select({ id: vesselsAlertsTable.id, title: vesselsAlertsTable.title, severity: vesselsAlertsTable.severity, triggeredAt: vesselsAlertsTable.triggeredAt })
      .from(vesselsAlertsTable)
      .where(ne(vesselsAlertsTable.status, "resolved"))
      .orderBy(desc(vesselsAlertsTable.triggeredAt))
      .limit(5),
    db
      .select({ id: vesselsEventsTable.id, title: vesselsEventsTable.title, severity: vesselsEventsTable.severity })
      .from(vesselsEventsTable)
      .where(and(
        eq(vesselsEventsTable.eventType, "delay_event"),
        ne(vesselsEventsTable.status, "resolved"),
      ))
      .orderBy(desc(vesselsEventsTable.id))
      .limit(3),
    db
      .select({ id: terraDistressPropertiesTable.id, address: terraDistressPropertiesTable.address, borough: terraDistressPropertiesTable.borough })
      .from(terraDistressPropertiesTable)
      .where(eq(terraDistressPropertiesTable.isActive, true))
      .limit(20),
    db
      .select({ severity: firestormAlertsTable.severity })
      .from(firestormAlertsTable)
      .where(and(
        ne(firestormAlertsTable.status, "resolved"),
        ne(firestormAlertsTable.status, "dismissed"),
      ))
      .limit(30),
  ]);

  const signals: AmbientSignal[] = [];

  const criticalIncident = incidents.find((i) => i.severity === "critical");
  const highIncident = incidents.find((i) => i.severity === "high");
  const critAlerts = secAlerts.filter((a) => a.severity === "critical" || a.severity === "high").length;

  if (criticalIncident) {
    signals.push({
      id: `live-incident-${criticalIncident.id}`,
      domain: "aegis",
      title: criticalIncident.title.slice(0, 60),
      summary: `Critical incident open — ${incidents.length} total open incident(s); ${critAlerts} high/critical alert(s) active. Legal hold and portfolio risk elevation triggered.`,
      severity: "critical",
      score: 0.97,
      timestamp: now() - 900000,
      actionLabel: "View Incident",
      live: true,
    });
  } else if (highIncident || critAlerts > 0) {
    signals.push({
      id: `live-incident-${highIncident?.id ?? "alerts"}`,
      domain: "aegis",
      title: highIncident?.title?.slice(0, 60) ?? `${critAlerts} High/Critical Security Alert(s)`,
      summary: `${incidents.length} open incident(s); ${critAlerts} high/critical alert(s) active — elevated threat posture.`,
      severity: "high",
      score: 0.85,
      timestamp: now() - 1800000,
      actionLabel: "View Incidents",
      live: true,
    });
  }

  const vesselDelayEvents = vesselDelays.length;
  const highVesselAlerts = vesselAlerts.filter((a) => a.severity === "high" || a.severity === "critical").length;
  if (vesselDelayEvents > 0) {
    const latest = vesselDelays[0];
    signals.push({
      id: `live-vessel-delay-${latest.id}`,
      domain: "vessels",
      title: latest.title?.slice(0, 60) ?? `${vesselDelayEvents} Active Vessel Delay Event(s)`,
      summary: `${vesselDelayEvents} active delay event(s) in fleet; ${highVesselAlerts} high/critical vessel alerts. Terra and PRISM signal chains evaluating.`,
      severity: "high",
      score: 0.88,
      timestamp: now() - 3600000,
      actionLabel: "View Fleet",
      live: true,
    });
  } else if (highVesselAlerts > 0) {
    signals.push({
      id: `live-vessel-alert-${vesselAlerts[0]?.id}`,
      domain: "vessels",
      title: vesselAlerts[0]?.title?.slice(0, 60) ?? `${highVesselAlerts} High-Severity Fleet Alert(s)`,
      summary: `${vesselAlerts.length} active vessel alert(s); ${highVesselAlerts} high-severity or above — fleet operations monitoring escalated.`,
      severity: "high",
      score: 0.82,
      timestamp: vesselAlerts[0]?.triggeredAt ? new Date(vesselAlerts[0].triggeredAt).getTime() : now() - 3600000,
      actionLabel: "View Fleet",
      live: true,
    });
  }

  if (distressProps.length > 0) {
    signals.push({
      id: `live-terra-distress-${distressProps[0].id}`,
      domain: "terra",
      title: `${distressProps.length} Distressed Propert${distressProps.length === 1 ? "y" : "ies"} Active`,
      summary: distressProps[0].address
        ? `${distressProps.length} active distress records. Recent: ${distressProps[0].address.slice(0, 50)}, ${distressProps[0].borough ?? ""}. Rate volatility and supply chain risk are contributing factors.`
        : `${distressProps.length} active distress records in portfolio. Rate volatility and supply chain risk are contributing factors.`,
      severity: distressProps.length >= 10 ? "high" : "medium",
      score: distressProps.length >= 10 ? 0.79 : 0.65,
      timestamp: now() - 7200000,
      actionLabel: "View Portfolio",
      live: true,
    });
  }

  return signals;
}

const STATIC_SIGNALS: AmbientSignal[] = [
  { id: "sig-1", domain: "aegis", title: "APT-41 Activity Spike", summary: "Threat actor APT-41 activity spike detected across 3 subsidiaries", severity: "high", score: 0.92, timestamp: now(), actionUrl: "/threat-cost-translator", actionLabel: "View Cost Impact" },
  { id: "sig-2", domain: "vessels", title: "Carbon Intensity Below Target", summary: "Fleet carbon intensity trending 12% below IMO 2026 target", severity: "info", score: 0.45, timestamp: now(), actionUrl: "/voyage-carbon-passport", actionLabel: "View Passport" },
  { id: "sig-3", domain: "terra", title: "Momentum Surge", summary: "Neighborhood momentum score surged in 4 target markets", severity: "medium", score: 0.71, timestamp: now(), actionUrl: "/neighborhood-momentum", actionLabel: "View Markets" },
  { id: "sig-4", domain: "lyte", title: "Self-Healing Active", summary: "Self-healing resolved 94% of P1 incidents without human intervention", severity: "info", score: 0.38, timestamp: now(), actionUrl: "/self-healing-confidence", actionLabel: "View Index" },
  { id: "sig-5", domain: "prism", title: "Judicial Pattern Shift", summary: "Judicial pattern shift detected in Southern District — brief strategy update recommended", severity: "high", score: 0.88, timestamp: now(), actionUrl: "/judicial-pattern-intelligence", actionLabel: "View Patterns" },
  { id: "sig-6", domain: "szl-holdings", title: "LP Confidence High", summary: "LP sentiment pulse shows 87% confidence across Fund III investors", severity: "info", score: 0.32, timestamp: now(), actionUrl: "/lp-sentiment-pulse", actionLabel: "View Pulse" },
];

router.get("/ambient-signals", async (_req, res) => {
  try {
    const liveSignals = await fetchLiveAmbientSignals();

    if (liveSignals.length === 0) {
      res.json(STATIC_SIGNALS);
      return;
    }

    const liveDomains = new Set(liveSignals.map((s) => s.domain));
    const supplementary = STATIC_SIGNALS.filter(
      (s) => !liveDomains.has(s.domain) || s.severity === "info"
    ).slice(0, 4);

    const merged = [...liveSignals, ...supplementary].sort((a, b) => b.score - a.score);
    logger.info({ liveCount: liveSignals.length, total: merged.length }, "[InnovationEngine] Ambient signals with live data");
    res.json(merged);
  } catch (err) {
    logger.warn({ err }, "[InnovationEngine] Live signal fetch failed, returning static signals");
    res.json(STATIC_SIGNALS);
  }
});

router.get("/energy-metrics", (_req, res) => {
  res.json({
    apiCallsPerMinute: 127,
    wsMessagesPerMinute: 340,
    chartRendersPerMinute: 24,
    dataRefreshesPerMinute: 18,
    activeSubscriptions: 42,
    deferredUpdates: 3,
    totalBudget: 120,
    usedBudget: 78,
  });
});

router.get("/decision-items", (_req, res) => {
  res.json({
    pendingDecisions: [
      { id: "dec-1", domain: "szl-holdings", title: "Approve Fund III capital call schedule", description: "Q3 capital call of $12M requires LP notification within 48 hours", recommendation: "Approve — all LPs have confirmed capacity and the deployment window aligns with market conditions", confidence: 0.94, risk: "low", autoResolvable: false, deadline: "2026-04-17", impact: "high", estimatedTimeSaved: "2 hours" },
      { id: "dec-2", domain: "aegis", title: "Review Aegis threat escalation policy update", description: "New MITRE ATT&CK v15 mappings require policy refresh across all subsidiaries", recommendation: "Adopt the updated mappings — 3 new techniques are relevant to current threat landscape", confidence: 0.87, risk: "medium", autoResolvable: false, deadline: "2026-04-18", impact: "high", estimatedTimeSaved: "4 hours" },
      { id: "dec-3", domain: "terra", title: "Sign off on Terra Q2 acquisition pipeline", description: "7 properties in due diligence stage, total commitment $34M", recommendation: "Proceed with 5 of 7 — defer two parcels pending environmental clearance", confidence: 0.81, risk: "medium", autoResolvable: false, deadline: "2026-04-20", impact: "medium", estimatedTimeSaved: "3 hours" },
    ],
    autoResolved: [
      { id: "dec-4", domain: "lyte", title: "Auto-scale east-region cluster", description: "CPU utilization exceeded 80% threshold on 3 nodes", recommendation: "Scaled horizontally by 2 nodes", confidence: 0.99, risk: "low", autoResolvable: true, autoResolved: true, autoResolvedAt: now() - 3600000, estimatedTimeSaved: "30 minutes" },
    ],
    totalAlerts: 47,
    consolidatedTo: 4,
    timeSavedMinutes: 210,
  });
});

router.get("/correlations", (_req, res) => {
  res.json([
    { id: "cor-1", title: "Cyber Resilience ↔ AIOps Maturity", description: "Cyber incident response times correlate with Lyte self-healing maturity — subsidiaries with higher AIOps adoption resolve 3x faster", domains: ["aegis", "lyte"], confidence: 0.91, timestamp: now(), signals: [{ domain: "aegis", event: "MTTR decreased 42% in Q1", severity: "medium" }, { domain: "lyte", event: "Self-healing rate reached 94%", severity: "info" }], suggestedActions: ["Deploy Lyte AIOps agent to remaining subsidiaries", "Create unified incident timeline view"], impact: "high" },
    { id: "cor-2", title: "Port Congestion → Material Delays", description: "Port congestion signals from Vessels predict construction material delivery delays tracked in Terra by 48 hours", domains: ["vessels", "terra"], confidence: 0.84, timestamp: now(), signals: [{ domain: "vessels", event: "Shanghai port congestion index +18%", severity: "medium" }, { domain: "terra", event: "Steel delivery delays reported in 3 projects", severity: "high" }], suggestedActions: ["Pre-order materials when congestion index exceeds threshold", "Activate alternative supplier network"], impact: "high" },
    { id: "cor-3", title: "Litigation Reserves ↔ LP Sentiment", description: "Litigation reserve accuracy improves when LP sentiment data feeds judicial pattern models", domains: ["prism", "szl-holdings"], confidence: 0.78, timestamp: now(), signals: [{ domain: "prism", event: "Reserve prediction accuracy improved to 91%", severity: "info" }, { domain: "szl-holdings", event: "LP confidence score at 87%", severity: "info" }], suggestedActions: ["Feed LP sentiment into litigation risk models"], impact: "medium" },
    { id: "cor-4", title: "Client Engagement → Thought Leadership", description: "Client engagement depth from Carlota Jo workshops correlates with thought leadership reach metrics", domains: ["carlota", "szl-holdings"], confidence: 0.82, timestamp: now(), signals: [{ domain: "carlota", event: "Workshop NPS at 92", severity: "info" }, { domain: "szl-holdings", event: "Portfolio NAV growth correlated with advisory engagement", severity: "info" }], suggestedActions: ["Publish workshop insights as thought pieces"], impact: "medium" },
  ]);
});

router.get("/stakeholder-views/:lens", (req, res) => {
  const lens = req.params.lens;
  const views: Record<string, object> = {
    executive: { focus: "Strategic impact & risk posture", metrics: ["Portfolio MOIC", "Threat Posture Score", "Fleet Utilization", "AUM Growth"], kpiCount: 12 },
    investor: { focus: "Returns, risk-adjusted performance & ESG compliance", metrics: ["IRR", "DPI", "TVPI", "Carbon Score", "LP NPS"], kpiCount: 8 },
    operator: { focus: "Operational efficiency & system health", metrics: ["MTTR", "Self-Healing Rate", "Query Latency p99", "Uptime SLA"], kpiCount: 15 },
    client: { focus: "Service quality & value delivery", metrics: ["NPS", "Resolution Time", "Feature Adoption", "ROI Delivered"], kpiCount: 10 },
  };
  const view = views[lens];
  if (!view) {
    res.status(404).json({ error: `Unknown stakeholder lens: ${lens}` });
    return;
  }
  res.json({ lens, ...view });
});

export default router;
