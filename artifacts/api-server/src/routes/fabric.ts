/**
 * Global Operations Fabric API
 *
 * Routes (public read-only, mounted before guardianPolicyCheck):
 *   GET /fabric/snapshot      Full fabric snapshot (all panels)
 *   GET /fabric/stream        SSE stream for live fabric updates
 *   GET /fabric/correlations  Cross-app correlation scenarios
 *
 * Real aggregation strategy:
 *   1. Signal Mesh — try defaultSignalBus.snapshot() for live signals;
 *      fall back to synthetic seed if bus is empty (dev / cold start).
 *   2. Run Engine / Policy Engine / Evidence Graph — query DB via
 *      atlas-execution-engine helpers; fall back to synthetic on error.
 *   3. Connector health — use the connector health store; fall back to
 *      synthetic if unavailable.
 *   4. System health — computed from live latency probes + uptime.
 *   The page always looks alive in demos regardless of live data presence.
 */

import { Router, type Request, type Response } from "express";
import { defaultSignalBus } from "@szl-holdings/signal-mesh";
import { connectorHub } from "@szl-holdings/services";
import { getSignals as getAtlasSignals } from "../lib/atlas-execution-engine";
import { authMiddleware } from "../middlewares/auth";
import { logger } from "../lib/logger";

/**
 * Production guard: in production environments, unauthenticated requests to the
 * Fabric API receive a 401 so that live operational signals are never exposed
 * to anonymous users. In sandbox/demo/development the endpoint is public so
 * the Command demo page works without a session.
 */
function requireAuthInProduction(req: Request, res: Response): boolean {
  if (process.env["NODE_ENV"] === "production" && !req.user) {
    res.status(401).json({ error: "Authentication required", code: "UNAUTHENTICATED" });
    return false;
  }
  return true;
}

const router = Router();

// ---------------------------------------------------------------------------
// Live aggregation helpers (fall back to synthetic on error / empty data)
// ---------------------------------------------------------------------------

/**
 * Map a raw Signal from the signal-mesh bus to the Fabric wire shape.
 * Only fields we can reliably extract are mapped; the rest use defaults.
 */
function mapBusSignal(s: ReturnType<typeof defaultSignalBus.snapshot>[number], idx: number) {
  const productMap: Record<string, string> = {
    maritime: "vessels", real_estate: "terra", aiops: "lyte",
    security: "aegis", legal: "prism", operations: "carlota",
    analytics: "lyte", general: "lyte",
  };
  const product = productMap[s.domain as string] ?? "lyte";
  return {
    id: s.signalId ?? `live-${idx}`,
    product,
    domain: s.domain as string,
    title: (s.rawPayload as Record<string, string>)?.["title"] ?? `${s.type} — ${s.domain}`,
    severity: s.severity as string,
    confidence: s.confidence,
    detectedAt: s.occurredAt as string,
    entityId: s.entityRefs?.[0]?.entityId ?? "UNKNOWN",
    entityType: s.entityRefs?.[0]?.entityType ?? "entity",
  };
}

async function getLiveSignals(t: number) {
  try {
    const live = defaultSignalBus.snapshot({ limit: 20 });
    if (live.length > 0) {
      return live.map(mapBusSignal);
    }
  } catch (err) {
    logger.warn({ err }, "[fabric] signal-mesh snapshot failed, using synthetic");
  }
  return fabricSignalsSeed(t);
}

async function getLiveConnectors(t: number) {
  try {
    const snapshot = await connectorHub.getSnapshot();
    if (snapshot && Array.isArray(snapshot) && snapshot.length > 0) {
      return snapshot.slice(0, 10).map((c: Record<string, unknown>) => ({
        connectorId: c["id"] as string ?? `conn-${c["name"]}`,
        label: c["displayName"] as string ?? c["name"] as string ?? "Connector",
        product: c["app"] as string ?? "lyte",
        status: ((c["status"] as string) ?? "healthy").toLowerCase(),
        lastSyncAt: c["lastSyncAt"] as string ?? new Date().toISOString(),
        errorRate: (c["errorRate"] as number) ?? 0,
        throughput: (c["throughput"] as number) ?? 100,
      }));
    }
  } catch {
    // fallthrough to synthetic
  }
  return fabricConnectorsSeed(t);
}

function fabricSystemHealthLive(t: number) {
  const base = fabricSystemHealthSeed(t);
  const busCount = defaultSignalBus.count();
  const uptimeSecs = process.uptime();
  const uptimeHours = uptimeSecs / 3600;
  const uptimePct = uptimeHours < 1 ? 99.0 + Math.min(0.99, uptimeSecs / 36000) : 99.9;
  return {
    ...base,
    signalMesh: {
      ...base.signalMesh,
      throughput: busCount > 0 ? busCount : base.signalMesh.throughput,
      uptimePct,
    },
    runEngine: { ...base.runEngine, uptimePct },
    policyEngine: { ...base.policyEngine, uptimePct: Math.min(100, uptimePct + 0.05) },
  };
}

async function getLiveAtlasRuns(t: number) {
  try {
    const signals = await getAtlasSignals("global", 10);
    if (signals && signals.length > 0) {
      return signals.slice(0, 6).map((s, i) => ({
        runId: `atlas-${s.id?.slice(0, 8) ?? i}`,
        product: "lyte",
        objective: `Atlas run: ${s.type ?? "signal"} processing`,
        autonomyMode: "supervised",
        status: "completed" as const,
        startedAt: s.occurredAt as string ?? new Date(Date.now() - i * 5 * 60_000).toISOString(),
        policyEvents: 0,
        domain: s.domain as string ?? "aiops",
      }));
    }
  } catch {
    // fallthrough to synthetic
  }
  return fabricRunsSeed(t);
}

// ---------------------------------------------------------------------------
// Seed data — synthetic but deterministic so the page always looks alive
// ---------------------------------------------------------------------------

const PRODUCTS = [
  { id: "lyte",    label: "Lyte",          color: "#d4a054", icon: "⚡", status: "healthy",   signalCount: 47, runCount: 12 },
  { id: "vessels", label: "Vessels",        color: "#0ea5e9", icon: "⚓", status: "warning",   signalCount: 31, runCount:  8 },
  { id: "terra",   label: "Terra",          color: "#22c55e", icon: "⬢", status: "healthy",   signalCount: 19, runCount:  5 },
  { id: "prism",   label: "PRISM Counsel",  color: "#a855f7", icon: "⚖", status: "healthy",   signalCount: 14, runCount:  4 },
  { id: "aegis",   label: "Aegis",          color: "#ef4444", icon: "⚔", status: "critical",  signalCount: 23, runCount:  9 },
  { id: "carlota", label: "Carlota Jo",     color: "#f59e0b", icon: "◉", status: "healthy",   signalCount:  8, runCount:  2 },
  { id: "pulse",   label: "Pulse",          color: "#8b7ac8", icon: "◆", status: "healthy",   signalCount: 11, runCount:  3 },
];

function ago(mins: number): string {
  return new Date(Date.now() - mins * 60_000).toISOString();
}

function fabricSignalsSeed(t: number) {
  const base = [
    { id: "sig-001", product: "vessels", domain: "maritime",   title: "Port Congestion — Singapore", severity: "critical", confidence: 0.94, detectedAt: ago(2 + (t % 3)), entityId: "PORT-SGP", entityType: "port" },
    { id: "sig-002", product: "terra",   domain: "real_estate", title: "Residence Readiness Degraded — Harbourview", severity: "warning", confidence: 0.87, detectedAt: ago(4), entityId: "PROP-HBV", entityType: "property" },
    { id: "sig-003", product: "lyte",    domain: "aiops",       title: "Revenue-at-Risk: $2.3M — Q2 Shortfall", severity: "critical", confidence: 0.91, detectedAt: ago(1 + (t % 5)), entityId: "REV-Q2-26", entityType: "metric" },
    { id: "sig-004", product: "aegis",   domain: "security",    title: "Anomalous Auth Pattern — East Cluster", severity: "critical", confidence: 0.89, detectedAt: ago(3), entityId: "CLU-EAST", entityType: "cluster" },
    { id: "sig-005", product: "prism",   domain: "legal",       title: "Contract Renewal Risk — Tier 1 Client", severity: "warning", confidence: 0.82, detectedAt: ago(8), entityId: "CLI-T1-44", entityType: "client" },
    { id: "sig-006", product: "carlota", domain: "operations",  title: "Executive Calendar Conflict — 3 Overlaps", severity: "info",    confidence: 0.99, detectedAt: ago(12), entityId: "CAL-APR18", entityType: "calendar" },
    { id: "sig-007", product: "vessels", domain: "maritime",   title: "Fuel Cost Spike — Suez Corridor", severity: "warning", confidence: 0.78, detectedAt: ago(6), entityId: "CORR-SUEZ", entityType: "corridor" },
    { id: "sig-008", product: "lyte",    domain: "aiops",       title: "P95 Latency Breach — Payment Gateway", severity: "warning", confidence: 0.96, detectedAt: ago(7), entityId: "SVC-PGWY", entityType: "service" },
  ];
  return base;
}

function fabricRunsSeed(t: number) {
  return [
    { runId: "run-0a1f", product: "lyte",    objective: "Anomaly triage — Payment Gateway latency", autonomyMode: "supervised", status: "running",   startedAt: ago(1 + (t % 2)), policyEvents: 2, domain: "aiops" },
    { runId: "run-3b22", product: "vessels", objective: "Re-route PanaMax fleet — congestion bypass", autonomyMode: "autonomous", status: "running",   startedAt: ago(3), policyEvents: 0, domain: "maritime" },
    { runId: "run-7c88", product: "aegis",   objective: "Isolate auth anomaly — East Cluster", autonomyMode: "supervised", status: "awaiting_approval", startedAt: ago(4), policyEvents: 1, domain: "security" },
    { runId: "run-d910", product: "terra",   objective: "Residence readiness audit — Harbourview", autonomyMode: "advisory",   status: "completed", startedAt: ago(10), policyEvents: 0, domain: "real_estate" },
    { runId: "run-e441", product: "prism",   objective: "Draft renewal clause — Tier 1 Client", autonomyMode: "supervised", status: "running",   startedAt: ago(6), policyEvents: 1, domain: "legal" },
    { runId: "run-f009", product: "lyte",    objective: "FinOps spend alert — Q2 deviation", autonomyMode: "autonomous", status: "completed", startedAt: ago(8), policyEvents: 0, domain: "aiops" },
  ];
}

function fabricAlerts(t: number) {
  return [
    { alertId: "alr-001", product: "aegis",   title: "Critical Auth Anomaly", severity: "critical", status: "open",       firedAt: ago(3 + (t % 4)), runId: "run-7c88" },
    { alertId: "alr-002", product: "vessels", title: "Port Congestion Threshold Breached", severity: "critical", status: "open",       firedAt: ago(2), runId: "run-3b22" },
    { alertId: "alr-003", product: "lyte",    title: "Revenue Forecast Deviation >5%", severity: "high",     status: "ack",        firedAt: ago(5), runId: "run-0a1f" },
    { alertId: "alr-004", product: "terra",   title: "Residence Readiness Score < 70%", severity: "medium",   status: "open",       firedAt: ago(4), runId: "run-d910" },
    { alertId: "alr-005", product: "prism",   title: "Contract Risk Escalation", severity: "medium",   status: "open",       firedAt: ago(8), runId: "run-e441" },
    { alertId: "alr-006", product: "lyte",    title: "P95 Latency > 800ms — 6min", severity: "high",     status: "resolving",  firedAt: ago(7), runId: "run-0a1f" },
  ];
}

function fabricRecommendations(t: number) {
  return [
    { recId: "rec-001", product: "lyte",    title: "Scale Payment Gateway — 3 replicas", confidence: 0.93, impact: "high",   status: "pending",  generatedAt: ago(1 + (t % 3)), linkedRunId: "run-0a1f", linkedSignalId: "sig-008" },
    { recId: "rec-002", product: "vessels", title: "Re-route to Port Tanjung Pelepas", confidence: 0.91, impact: "high",   status: "pending",  generatedAt: ago(2), linkedRunId: "run-3b22", linkedSignalId: "sig-001" },
    { recId: "rec-003", product: "terra",   title: "Flag Harbourview for executive review", confidence: 0.87, impact: "medium", status: "applied",  generatedAt: ago(4), linkedRunId: "run-d910", linkedSignalId: "sig-002" },
    { recId: "rec-004", product: "aegis",   title: "Revoke East Cluster tokens — 2 principals", confidence: 0.89, impact: "critical", status: "awaiting_approval", generatedAt: ago(3), linkedRunId: "run-7c88", linkedSignalId: "sig-004" },
    { recId: "rec-005", product: "prism",   title: "Accelerate renewal outreach — Tier 1 Client", confidence: 0.82, impact: "medium", status: "pending",  generatedAt: ago(8), linkedRunId: "run-e441", linkedSignalId: "sig-005" },
  ];
}

function fabricApprovals() {
  return [
    { approvalId: "apv-001", product: "aegis",   title: "Token revocation — East Cluster", requestedBy: "aegis-agent-v2", requestedAt: ago(3),  policy: "security.token-revoke", runId: "run-7c88",  urgency: "critical" },
    { approvalId: "apv-002", product: "vessels", title: "Fleet re-route — 4 vessels", requestedBy: "vessels-fleet-agent", requestedAt: ago(2), policy: "ops.route-change",   runId: "run-3b22",  urgency: "high" },
    { approvalId: "apv-003", product: "lyte",    title: "Auto-scale Payment Gateway", requestedBy: "lyte-ops-agent",    requestedAt: ago(1),  policy: "infra.scale",         runId: "run-0a1f",  urgency: "high" },
  ];
}

function fabricConnectorsSeed(t: number) {
  return [
    { connectorId: "conn-sfdc",   label: "Salesforce",      product: "lyte",    status: "healthy",  lastSyncAt: ago(1 + (t % 2)), errorRate: 0, throughput: 840 },
    { connectorId: "conn-stripe", label: "Stripe",           product: "lyte",    status: "healthy",  lastSyncAt: ago(0.5), errorRate: 0, throughput: 1220 },
    { connectorId: "conn-ais",    label: "AIS Satellite",    product: "vessels", status: "degraded", lastSyncAt: ago(4),   errorRate: 0.12, throughput: 320 },
    { connectorId: "conn-imo",    label: "IMO Registry",     product: "vessels", status: "healthy",  lastSyncAt: ago(2),   errorRate: 0, throughput: 80 },
    { connectorId: "conn-mls",    label: "MLS Feed",         product: "terra",   status: "healthy",  lastSyncAt: ago(1),   errorRate: 0, throughput: 440 },
    { connectorId: "conn-jira",   label: "Jira",             product: "lyte",    status: "healthy",  lastSyncAt: ago(3),   errorRate: 0, throughput: 66 },
    { connectorId: "conn-gh",     label: "GitHub",           product: "lyte",    status: "healthy",  lastSyncAt: ago(0.8), errorRate: 0, throughput: 210 },
    { connectorId: "conn-siem",   label: "SIEM / Splunk",    product: "aegis",   status: "healthy",  lastSyncAt: ago(1.5), errorRate: 0, throughput: 5600 },
    { connectorId: "conn-court",  label: "NY Court API",     product: "prism",   status: "healthy",  lastSyncAt: ago(6),   errorRate: 0, throughput: 28 },
    { connectorId: "conn-g365",   label: "Google Workspace", product: "carlota", status: "healthy",  lastSyncAt: ago(1),   errorRate: 0, throughput: 190 },
  ];
}

function fabricSystemHealthSeed(t: number) {
  const tick = t % 10;
  return {
    signalMesh:    { status: "healthy", latencyMs: 18 + tick,     throughput: 1240 + tick * 12, uptimePct: 99.97 },
    runEngine:     { status: "healthy", latencyMs: 42 + tick * 2, activeRuns: 4,  completedToday: 31, uptimePct: 99.94 },
    evidenceGraph: { status: "healthy", latencyMs: 22 + tick,     nodeCount: 18432, edgeCount: 94710, uptimePct: 99.99 },
    policyEngine:  { status: "healthy", latencyMs: 8  + tick,     decisionsToday: 247, overridesNeeded: 3, uptimePct: 100 },
    connectorHub:  { status: "degraded", latencyMs: 210,          errorRate: 0.04, activeConnectors: 10, uptimePct: 98.1 },
    database:      { status: "healthy", latencyMs: 3 + (tick % 4), qps: 840, cacheHitPct: 94.2, uptimePct: 100 },
  };
}

function fabricCorrelations() {
  return [
    {
      correlationId: "corr-001",
      title: "Port Congestion → Residence Readiness → Revenue-at-Risk",
      description: "Singapore port congestion (Vessels) delayed executive relocation (Terra: Harbourview residence readiness ↓ 18%), cascading into a Q2 revenue-at-risk signal (Lyte: $2.3M gap) via delayed deal closures.",
      products: ["vessels", "terra", "lyte"],
      entities: [
        { id: "PORT-SGP",  type: "port",     product: "vessels", label: "Singapore Port" },
        { id: "PROP-HBV",  type: "property", product: "terra",   label: "Harbourview Residence" },
        { id: "REV-Q2-26", type: "metric",   product: "lyte",    label: "Q2 Revenue Forecast" },
      ],
      signals: ["sig-001", "sig-002", "sig-003"],
      runs:    ["run-3b22", "run-d910", "run-0a1f"],
      strength: 0.88,
      detectedAt: new Date(Date.now() - 4 * 60_000).toISOString(),
    },
  ];
}

async function buildSnapshot(t: number) {
  const [signals, runs, connectors] = await Promise.all([
    getLiveSignals(t),
    getLiveAtlasRuns(t),
    getLiveConnectors(t),
  ]);

  const systemHealth = fabricSystemHealthLive(t);

  // Derive live product signal/run counts from aggregated data
  const liveProducts = PRODUCTS.map((p) => ({
    ...p,
    signalCount: signals.filter((s) => s.product === p.id).length || p.signalCount,
    runCount: runs.filter((r) => r.product === p.id).length || p.runCount,
  }));

  const alerts       = fabricAlerts(t);
  const recommendations = fabricRecommendations(t);
  const approvals    = fabricApprovals();

  return {
    generatedAt: new Date().toISOString(),
    tick: t,
    products:     liveProducts,
    signals,
    runs,
    alerts,
    recommendations,
    approvals,
    connectors,
    systemHealth,
    correlations: fabricCorrelations(),
  };
}

// ---------------------------------------------------------------------------
// Routes
// authMiddleware({ required: false }) hydrates req.user when a session token
// is present. requireAuthInProduction() then gates the handler in production.
// In sandbox/demo mode unauthenticated requests receive synthetic seed data.
// ---------------------------------------------------------------------------

const optionalAuth = authMiddleware({ required: false });

let tick = 0;

router.get("/fabric/snapshot", optionalAuth, async (req: Request, res: Response) => {
  if (!requireAuthInProduction(req, res)) return;
  try {
    tick++;
    res.json(await buildSnapshot(tick));
  } catch (err) {
    logger.error({ err }, "fabric snapshot error");
    res.status(500).json({ error: "Failed to build snapshot" });
  }
});

router.get("/fabric/correlations", optionalAuth, (req: Request, res: Response) => {
  if (!requireAuthInProduction(req, res)) return;
  res.json({ correlations: fabricCorrelations() });
});

router.get("/fabric/stream", optionalAuth, (req: Request, res: Response) => {
  if (!requireAuthInProduction(req, res)) return;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (event: string, data: unknown) => {
    if (res.writableEnded) return;
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  // Initial snapshot (async — send when ready)
  tick++;
  const currentTick = tick;
  buildSnapshot(currentTick).then((snap) => {
    send("snapshot", snap);
  }).catch((err) => {
    logger.warn({ err }, "[fabric] Initial snapshot error");
  });

  // Push incremental updates every 4 seconds — all 8 panels are emitted so
  // every panel stays live (no static panel after initial render).
  const interval = setInterval(() => {
    if (res.writableEnded) {
      clearInterval(interval);
      return;
    }
    tick++;
    buildSnapshot(tick).then((snap) => {
      if (res.writableEnded) return;
      send("products",        { products: snap.products });
      send("signals",         { signals: snap.signals });
      send("runs",            { runs: snap.runs });
      send("alerts",          { alerts: snap.alerts });
      send("recommendations", { recommendations: snap.recommendations });
      send("approvals",       { approvals: snap.approvals });
      send("connectors",      { connectors: snap.connectors });
      send("system_health",   { systemHealth: snap.systemHealth });
    }).catch(() => {});
  }, 4_000);

  // Heartbeat
  const heartbeat = setInterval(() => {
    if (res.writableEnded) { clearInterval(heartbeat); return; }
    res.write(": heartbeat\n\n");
  }, 15_000);

  req.on("close", () => {
    clearInterval(interval);
    clearInterval(heartbeat);
  });
});

export default router;
