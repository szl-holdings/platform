/**
 * Domain Event → Signal Mesh Bridge
 *
 * Subscribes to all per-product `domainEventBus` events (Vessels, Terra,
 * Lyte, PRISM Counsel, Firestorm, Alloy, Carlota Jo) and republishes them
 * as `Signal` objects onto the global `defaultSignalBus`.
 *
 * This is the single piece of plumbing that makes the Global Operations
 * Fabric page reflect what is actually happening inside each product —
 * before this bridge, only narratives and evidence-graph outcomes ever
 * reached the signal mesh, so the Fabric snapshot was synthetic.
 *
 * Idempotent: `initSignalMeshBridge()` is safe to call multiple times.
 */

import { defaultSignalBus } from "@szl-holdings/signal-mesh";
import {
  createSignal,
  type SignalDomain,
  type SignalSeverity,
  type SignalType,
} from "@workspace/ontology/signal";
import { domainEventBus, type DomainEvent, type DomainEventType } from "./index.js";
import { logger } from "../logger.js";

let initialized = false;

function clampSeverity(s: string | null | undefined): SignalSeverity {
  switch ((s ?? "").toLowerCase()) {
    case "critical": return "critical";
    case "high":     return "high";
    case "medium":   return "medium";
    case "low":      return "low";
    default:         return "info";
  }
}

function publish(args: {
  type: SignalType;
  domain: SignalDomain;
  severity?: SignalSeverity;
  title: string;
  entityId: string;
  entityType: string;
  rawPayload: Record<string, unknown>;
  source?: "api" | "connector" | "system" | "model";
  tags?: string[];
}) {
  try {
    const sig = createSignal({
      source: args.source ?? "api",
      type: args.type,
      domain: args.domain,
      occurredAt: new Date().toISOString(),
      freshness: 1,
      confidence: 0.9,
      severity: args.severity ?? "info",
      entityRefs: [{ entityId: args.entityId, entityType: args.entityType, displayName: args.title }],
      rawPayload: { title: args.title, ...args.rawPayload },
      tags: args.tags ?? [],
    });
    defaultSignalBus.publish(sig);
  } catch (err) {
    logger.warn({ err, type: args.type }, "[signal-mesh-bridge] publish failed");
  }
}

// The DomainEventHandler<T> handler signature resolves on a generic T to an
// unsatisfiable intersection across every event payload shape. We sidestep
// that by punching through the bus's typed subscribe with an untyped helper.
// At runtime each handler still only receives payloads for the matching
// `eventType` — the cast is purely a TypeScript escape hatch.
const busAny = domainEventBus as unknown as {
  subscribe: (type: string, handler: (payload: unknown) => void) => () => void;
};

type DomainEventPayloadOf<T extends DomainEventType> = Extract<DomainEvent, { type: T }>["payload"];

function bridge<T extends DomainEventType>(
  eventType: T,
  mapper: (payload: DomainEventPayloadOf<T>) => Parameters<typeof publish>[0] | null,
) {
  busAny.subscribe(eventType, (payload) => {
    const args = mapper(payload as DomainEventPayloadOf<T>);
    if (args) publish(args);
  });
}

export function initSignalMeshBridge(): void {
  if (initialized) return;
  initialized = true;

  // ───────── Vessels (maritime) ─────────
  bridge("vessel.position-updated", (p) => ({
    type: "position-update",
    domain: "maritime",
    severity: "info",
    title: `Vessel position update — #${p.vesselId}`,
    entityId: `vessel-${p.vesselId}`,
    entityType: "vessel",
    rawPayload: { ...p },
    source: "connector",
    tags: ["ais"],
  }));
  bridge("vessel.status-changed", (p) => ({
    type: "state-change",
    domain: "maritime",
    severity: p.newStatus === "detained" || p.newStatus === "alarm" ? "high" : "medium",
    title: `Vessel #${p.vesselId} status: ${p.previousStatus ?? "unknown"} → ${p.newStatus}`,
    entityId: `vessel-${p.vesselId}`,
    entityType: "vessel",
    rawPayload: { ...p },
  }));
  bridge("vessel.risk-scored", (p) => {
    const score = parseFloat(p.riskScore ?? "0");
    return {
      type: "risk",
      domain: "maritime",
      severity: score >= 0.8 ? "critical" : score >= 0.6 ? "high" : score >= 0.4 ? "medium" : "low",
      title: `Vessel #${p.vesselId} risk scored ${(score * 100).toFixed(0)}%`,
      entityId: `vessel-${p.vesselId}`,
      entityType: "vessel",
      rawPayload: { ...p },
    };
  });

  // ───────── Terra (real-estate) ─────────
  bridge("terra.deal-updated", (p) => ({
    type: "state-change",
    domain: "real-estate",
    severity: "info",
    title: `Terra deal #${p.dealId} → ${p.stage ?? "stage-unknown"}`,
    entityId: `terra-deal-${p.dealId}`,
    entityType: "deal",
    rawPayload: { ...p },
  }));
  bridge("terra.lead-created", (p) => ({
    type: "opportunity",
    domain: "real-estate",
    severity: "low",
    title: `Terra ${p.type} lead — ${p.firstName} ${p.lastName}`,
    entityId: `terra-lead-${p.leadId}`,
    entityType: "lead",
    rawPayload: { ...p },
  }));
  bridge("terra.action-item-updated", (p) => ({
    type: "state-change",
    domain: "real-estate",
    severity: "info",
    title: `Terra action item — ${p.previousStatus} → ${p.status}`,
    entityId: p.propertyId,
    entityType: "property",
    rawPayload: { ...p },
  }));
  bridge("terra.distress-detected", (p) => ({
    type: "opportunity",
    domain: "real-estate",
    severity: p.opportunityScore >= 0.8 ? "high" : "medium",
    title: `Distress detected — ${p.distressType} (${(p.opportunityScore * 100).toFixed(0)}%)`,
    entityId: p.propertyId,
    entityType: "property",
    rawPayload: { ...p },
  }));

  // ───────── Firestorm (security / Aegis) ─────────
  bridge("firestorm.incident-updated", (p) => ({
    type: "state-change",
    domain: "security",
    severity: clampSeverity(p.severity),
    title: `Aegis incident #${p.incidentId} → ${p.newStatus}`,
    entityId: `incident-${p.incidentId}`,
    entityType: "incident",
    rawPayload: { ...p },
  }));
  bridge("firestorm.incident-escalated", (p) => ({
    type: "escalation",
    domain: "security",
    severity: clampSeverity(p.severity),
    title: `Aegis escalation — ${p.title}`,
    entityId: `incident-${p.incidentId}`,
    entityType: "incident",
    rawPayload: { ...p },
  }));
  bridge("firestorm.threat-detected", (p) => {
    const r = p.overallRiskScore ?? 0;
    return {
      type: "risk",
      domain: "security",
      severity: r >= 80 ? "critical" : r >= 60 ? "high" : r >= 40 ? "medium" : "low",
      title: `Aegis threat assessment — risk ${r.toFixed(0)} (${p.domain})`,
      entityId: `assessment-${p.assessmentId}`,
      entityType: "assessment",
      rawPayload: { ...p },
    };
  });

  // ───────── PRISM Counsel (legal) ─────────
  bridge("prism-counsel.approval-resolved", (p) => ({
    type: "approval",
    domain: "legal",
    severity: "info",
    title: `PRISM approval ${p.decision} — request #${p.requestId}`,
    entityId: `matter-${p.matterId}`,
    entityType: "matter",
    rawPayload: { ...p },
  }));
  bridge("prism-counsel.deadline-approaching", (p) => ({
    type: "deadline",
    domain: "legal",
    severity: clampSeverity(p.priority),
    title: `PRISM deadline — ${p.title} (due ${p.dueDate})`,
    entityId: `matter-${p.matterId}`,
    entityType: "matter",
    rawPayload: { ...p },
  }));
  bridge("prism-counsel.recommendation-acted", (p) => ({
    type: "recommendation",
    domain: "legal",
    severity: "info",
    title: `PRISM recommendation ${p.action} — #${p.recommendationId}`,
    entityId: `matter-${p.matterId}`,
    entityType: "matter",
    rawPayload: { ...p },
  }));

  // ───────── Lyte (aiops → "ai") ─────────
  bridge("lyte.signal-triaged", (p) => ({
    type: "state-change",
    domain: "ai",
    severity: clampSeverity(p.severity),
    title: `Lyte signal #${p.signalId} triaged → ${p.status}`,
    entityId: `lyte-signal-${p.signalId}`,
    entityType: "signal",
    rawPayload: { ...p },
    tags: p.source ? [p.source] : [],
  }));
  bridge("lyte.incident-escalated", (p) => ({
    type: "escalation",
    domain: "ai",
    severity: clampSeverity(p.severity),
    title: `Lyte incident #${p.incidentId} escalated → ${p.targetRole}`,
    entityId: `lyte-incident-${p.incidentId}`,
    entityType: "incident",
    rawPayload: { ...p },
  }));
  bridge("lyte.incident-resolved", (p) => ({
    type: "outcome",
    domain: "ai",
    severity: "info",
    title: `Lyte incident #${p.incidentId} resolved`,
    entityId: `lyte-incident-${p.incidentId}`,
    entityType: "incident",
    rawPayload: { ...p },
  }));

  // ───────── Carlota Jo (workforce / consulting) ─────────
  bridge("carlota-jo.inquiry-created", (p) => ({
    type: "opportunity",
    domain: "workforce",
    severity: "low",
    title: `Carlota Jo inquiry — ${p.service}`,
    entityId: `cj-inquiry-${p.inquiryId}`,
    entityType: "inquiry",
    rawPayload: { ...p },
  }));

  // ───────── Alloy ─────────
  bridge("alloy.signal-ingested", (p) => {
    const validDomains: ReadonlySet<SignalDomain> = new Set([
      "maritime", "real-estate", "legal", "security", "finance",
      "workforce", "hospitality", "platform", "ai", "cross-domain",
    ]);
    const d = (p.domain ?? "platform") as string;
    const domain: SignalDomain = (validDomains.has(d as SignalDomain) ? d : "platform") as SignalDomain;
    return {
      type: "anomaly",
      domain,
      severity: clampSeverity(p.severity),
      title: p.title || `Alloy signal — ${p.source}`,
      entityId: `alloy-signal-${p.signalId}`,
      entityType: "signal",
      rawPayload: { ...p },
    };
  });
  bridge("alloy.workflow-created", (p) => ({
    type: "execution",
    domain: "ai",
    severity: clampSeverity(p.priority),
    title: `Alloy workflow created — ${p.workflowType}`,
    entityId: `alloy-workflow-${p.workflowId}`,
    entityType: "workflow",
    rawPayload: { ...p },
  }));
  bridge("alloy.workflow-run-updated", (p) => ({
    type: "state-change",
    domain: "ai",
    severity: "info",
    title: `Alloy run #${p.runId} → ${p.state}`,
    entityId: `alloy-run-${p.runId}`,
    entityType: "workflow-run",
    rawPayload: { ...p },
  }));

  logger.info("[signal-mesh-bridge] Domain events are now flowing into the signal mesh");
}
