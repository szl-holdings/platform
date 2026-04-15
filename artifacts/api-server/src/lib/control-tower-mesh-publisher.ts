/**
 * Control Tower Mesh Publisher
 *
 * Background task that bridges the domain simulation engines (Firestorm, Vessels,
 * Lyte, Terra, Alloy) to the agentEventBus — providing the continuous signal feed
 * the Control Tower Sense layer consumes. This creates the actual Sense → Decide
 * → Act → Govern runtime loop rather than relying on on-demand UI polling alone.
 *
 * In a production deployment, each domain service (firestorm, vessels, terra, lyte)
 * would publish directly to the bus via the shared workflow-engine package.  During
 * this phase the API server acts as the mesh coordinator, sampling the simulation
 * engines on a configurable cadence and publishing normalised AgentEvent records.
 */

import { agentEventBus } from "@szl-holdings/workflow-engine";
import { simulationEngine } from "./simulation-engine.js";
import { logger } from "./logger";

// Tracks last-seen IDs per domain so we don't re-publish stale events
const seen = new Set<string>();
let publishedTotal = 0;

/**
 * Sample domain signals and publish new ones to the agentEventBus.
 * Called on a periodic interval once the server is ready.
 */
async function publishDomainSignals(): Promise<void> {
  const batch: Promise<void>[] = [];

  // ── Firestorm domain: security threats ───────────────────────────────────
  for (const threat of simulationEngine.getThreats()) {
    const eid = `threat-${threat.id}`;
    if (seen.has(eid)) continue;
    seen.add(eid);
    batch.push(
      agentEventBus
        .publish({
          type: "threat_identified",
          sourceAgent: "firestorm-threat-detector",
          sourceDomain: "firestorm",
          severity: threat.severity,
          payload: {
            threatId: threat.id,
            title: threat.title,
            attackTechnique: threat.attackTechnique,
            tactic: threat.tactic,
            killChainPhase: threat.killChainPhase,
            confidence: threat.confidence,
            affectedAssets: threat.affectedAssets,
            detectedAt: threat.detectedAt,
          },
          correlationId: `firestorm-${threat.id}`,
        })
        .then(() => void 0)
        .catch(err => logger.warn({ err, threatId: threat.id }, "[mesh] failed to publish threat")),
    );
  }

  // ── Firestorm domain: active alerts ──────────────────────────────────────
  for (const alert of simulationEngine.getAlerts(30)) {
    const eid = `alert-${alert.id}`;
    if (seen.has(eid)) continue;
    seen.add(eid);
    batch.push(
      agentEventBus
        .publish({
          type: "alert_raised",
          sourceAgent: "firestorm-alert-engine",
          sourceDomain: "firestorm",
          severity: alert.severity,
          payload: {
            alertId: alert.id,
            title: alert.title,
            source: alert.source,
            status: alert.status,
            mitreId: alert.mitreId,
            receivedAt: alert.receivedAt,
          },
          correlationId: `firestorm-alert-${alert.id}`,
        })
        .then(() => void 0)
        .catch(err => logger.warn({ err, alertId: alert.id }, "[mesh] failed to publish alert")),
    );
  }

  // ── Vessels domain: AIS-dark or high-exposure vessels ────────────────────
  for (const vessel of simulationEngine.getVessels()) {
    if (vessel.status !== "ais_dark" && vessel.financialExposureUsd < 5_000_000) continue;
    const eid = `vessel-${vessel.id}-${vessel.status}`;
    if (seen.has(eid)) continue;
    seen.add(eid);
    const eventType = vessel.status === "ais_dark" ? "dark_vessel_detected" : "anomaly_detected";
    const severity = vessel.financialExposureUsd > 8_000_000 ? "critical" : vessel.status === "ais_dark" ? "high" : "medium";
    batch.push(
      agentEventBus
        .publish({
          type: eventType,
          sourceAgent: "vessels-ais-monitor",
          sourceDomain: "vessels",
          severity,
          payload: {
            vesselId: vessel.id,
            name: vessel.name,
            imo: vessel.imo,
            flag: vessel.flag,
            status: vessel.status,
            financialExposureUsd: vessel.financialExposureUsd,
            destination: vessel.destination,
            eta: vessel.eta,
            activeException: vessel.activeException,
          },
          correlationId: `vessels-${vessel.id}`,
        })
        .then(() => void 0)
        .catch(err => logger.warn({ err, vesselId: vessel.id }, "[mesh] failed to publish vessel event")),
    );
  }

  // ── Lyte domain: critical/high signals ───────────────────────────────────
  for (const signal of simulationEngine.getLyteSignals(30)) {
    if (signal.severity !== "critical" && signal.severity !== "high") continue;
    const eid = `signal-${signal.id}`;
    if (seen.has(eid)) continue;
    seen.add(eid);
    batch.push(
      agentEventBus
        .publish({
          type: signal.crossDomainTriggered ? "cross_domain_signal" : "metric_spike",
          sourceAgent: "lyte-monitoring-agent",
          sourceDomain: "lyte",
          severity: signal.severity,
          payload: {
            signalId: signal.id,
            title: signal.title,
            source: signal.source,
            sourceType: signal.sourceType,
            loadPct: signal.loadPct,
            crossDomainTriggered: signal.crossDomainTriggered,
            receivedAt: signal.receivedAt,
          },
          correlationId: `lyte-signal-${signal.id}`,
        })
        .then(() => void 0)
        .catch(err => logger.warn({ err, signalId: signal.id }, "[mesh] failed to publish lyte signal")),
    );
  }

  // ── Lyte domain: open incidents ───────────────────────────────────────────
  for (const incident of simulationEngine.getLyteIncidents()) {
    if (incident.status !== "open" && incident.status !== "investigating") continue;
    const eid = `incident-${incident.id}`;
    if (seen.has(eid)) continue;
    seen.add(eid);
    batch.push(
      agentEventBus
        .publish({
          type: "anomaly_detected",
          sourceAgent: "lyte-incident-manager",
          sourceDomain: "lyte",
          severity: incident.severity,
          payload: {
            incidentId: incident.id,
            title: incident.title,
            status: incident.status,
            assignee: incident.assignee,
            financialImpactUsd: incident.financialImpactUsd,
            createdAt: incident.createdAt,
          },
          correlationId: `lyte-incident-${incident.id}`,
        })
        .then(() => void 0)
        .catch(err => logger.warn({ err, incidentId: incident.id }, "[mesh] failed to publish lyte incident")),
    );
  }

  // ── Cross-domain correlation events ─────────────────────────────────────
  for (const corr of simulationEngine.getCorrelationEvents(10)) {
    const eid = `corr-${corr.id}`;
    if (seen.has(eid)) continue;
    seen.add(eid);
    batch.push(
      agentEventBus
        .publish({
          type: "correlation_found",
          sourceAgent: "alloy-correlation-engine",
          sourceDomain: corr.sourceDomain,
          severity: "high",
          payload: {
            correlationId: corr.id,
            type: corr.type,
            sourceDomain: corr.sourceDomain,
          },
          correlationId: `cross-domain-${corr.id}`,
        })
        .then(() => void 0)
        .catch(err => logger.warn({ err, corrId: corr.id }, "[mesh] failed to publish correlation event")),
    );
  }

  await Promise.allSettled(batch);
  publishedTotal += batch.length;

  if (batch.length > 0) {
    logger.debug({ newEvents: batch.length, totalPublished: publishedTotal }, "[mesh-publisher] domain signals published to agentEventBus");
  }
}

/**
 * Start the Control Tower Mesh Publisher background loop.
 * Returns a cleanup function that can be called to stop it.
 */
export function startMeshPublisher(intervalMs = 30_000): () => void {
  logger.info({ intervalMs }, "[mesh-publisher] Control Tower mesh publisher starting");

  // Run an initial sync immediately so the bus has data before first poll
  publishDomainSignals().catch(err =>
    logger.warn({ err }, "[mesh-publisher] initial domain signal publish failed"),
  );

  const handle = setInterval(() => {
    publishDomainSignals().catch(err =>
      logger.warn({ err }, "[mesh-publisher] periodic domain signal publish failed"),
    );
  }, intervalMs);

  return () => {
    clearInterval(handle);
    logger.info("[mesh-publisher] Control Tower mesh publisher stopped");
  };
}

export function getMeshPublisherStats(): { publishedTotal: number; uniqueSeenIds: number } {
  return { publishedTotal, uniqueSeenIds: seen.size };
}
