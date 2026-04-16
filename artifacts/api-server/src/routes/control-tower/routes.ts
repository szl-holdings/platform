import { Router, type IRouter, type Request, type Response } from "express";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { load as yamlLoad } from "js-yaml";
import { authMiddleware, requireRole } from "../../middlewares/auth";
import { sendSuccess, handleRouteError } from "../../lib/api-response";
import { agentEventBus } from "../../lib/event-bus";
import {
  getKernelAuditTrail,
  verifyAuditChainIntegrity,
  issueScopeCertificate,
  keywordSearch,
} from "@szl-holdings/ai-engine";
import { orchestrate, getOrchestratorCapabilities } from "../../lib/multi-agent-orchestrator";
import { listPipelines, executePipeline, getPipelineConfig, executeComposedPipeline } from "../../lib/intelligence-pipelines";

import { inferenceTelemetry } from "../../lib/inference-telemetry";
import { insertDecision, listDecisions, updateDecisionStatus, getDecision } from "../../lib/alloy-decision-store";
import type { AlloyDecisionEvidenceRef, RiskLevel } from "@szl-holdings/ai-engine";
import { logger } from "../../lib/logger";
import { randomUUID } from "crypto";

const router: IRouter = Router();

// ─── Agent Manifest (loaded from YAML at startup) ──────────────────────────────
// src/config/agent-manifest.yaml is the single source of truth for all agents.
// The server fails fast if the manifest is missing, malformed, or has no agents.

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

type AgentEntry = {
  id: string;
  name: string;
  subtitle: string;
  domain: string;
  capabilities: string[];
  riskTolerance: string;
  collaborationRules: string[];
  scopeCertMaxRisk: "low" | "medium" | "high" | "critical";
  version: string;
};

function loadAgentManifest(): { agents: AgentEntry[]; version: string; date: string } {
  // At runtime the server bundle lives in dist/; the build copies src/config/ → dist/config/
  const manifestPath = join(__dirname, "config/agent-manifest.yaml");
  let raw: string;
  try {
    raw = readFileSync(manifestPath, "utf8");
  } catch (err) {
    throw new Error(`[control-tower] Cannot read agent manifest at ${manifestPath}: ${err}`);
  }
  const doc = yamlLoad(raw) as { agents?: AgentEntry[] };
  if (!doc || !Array.isArray(doc.agents) || doc.agents.length === 0) {
    throw new Error("[control-tower] Agent manifest is empty or malformed — cannot start without a valid agent registry");
  }
  const versionMatch = raw.match(/^# Version:\s*(.+)$/m);
  const dateMatch   = raw.match(/^# Date:\s*(.+)$/m);
  return {
    agents: doc.agents,
    version: versionMatch?.[1]?.trim() ?? "unknown",
    date:    dateMatch?.[1]?.trim()    ?? "unknown",
  };
}

const { agents: CONTROL_TOWER_AGENT_REGISTRY, version: AGENT_MANIFEST_VERSION, date: AGENT_MANIFEST_DATE } = loadAgentManifest();
const REGISTERED_AGENT_IDS = new Set(CONTROL_TOWER_AGENT_REGISTRY.map(a => a.id));

// Require authentication for every Control Tower route.
// Mutation routes additionally require operator/admin role via requireRole().
router.use(authMiddleware({ required: true }));

// ─── Policy Definitions ────────────────────────────────────────────────────────

interface PolicyDef {
  id: string; name: string; description: string; category: string; enforced: boolean;
  blocking: boolean;
  appliesWhen: (riskLevel: string, action: string, agentId: string) => boolean;
  violationMessage: string;
}

/** Known domain namespaces — cross-domain refs in a single query trigger pol-003. */
const DOMAIN_NAMESPACES = ["firestorm", "vessels", "terra", "lyte", "prism", "alloy"] as const;

const POLICIES: PolicyDef[] = [
  {
    id: "pol-001",
    name: "High-Risk Action Approval Gate",
    description: "Any AI action with risk level >= high requires explicit human approval before execution",
    category: "authorization",
    enforced: true,
    blocking: true,
    appliesWhen: (riskLevel) => riskLevel === "high" || riskLevel === "critical",
    violationMessage: "High-risk action requires human approval before execution",
  },
  {
    id: "pol-002",
    name: "Scope Certificate Expiry Enforcement",
    description: "Critical-risk actions from non-orchestrator agents require a valid scope certificate",
    category: "identity",
    enforced: true,
    blocking: false,
    appliesWhen: (riskLevel, _action, agentId) =>
      riskLevel === "critical" && agentId !== "alloy-orchestrator",
    violationMessage: "Critical-risk action from non-orchestrator agent — scope certificate required",
  },
  {
    id: "pol-003",
    name: "Cross-Domain Data Isolation",
    description: "Actions referencing 2+ domain namespaces must route through the orchestrator mediator",
    category: "data-governance",
    enforced: true,
    blocking: true,
    appliesWhen: (_riskLevel, action) => {
      const lower = action.toLowerCase();
      return DOMAIN_NAMESPACES.filter(d => lower.includes(d)).length >= 2;
    },
    violationMessage: "Cross-domain action detected — must be routed through alloy-orchestrator mediator",
  },
  {
    id: "pol-004",
    name: "Decision Journal Completeness",
    description: "Deep orchestration actions must be pre-approved and journaled before execution",
    category: "audit",
    enforced: true,
    blocking: false,
    appliesWhen: (riskLevel, action) =>
      riskLevel === "high" || riskLevel === "critical" || action.includes("deep"),
    violationMessage: "High-risk action should be pre-journaled — submit as proposed, then approve",
  },
  {
    id: "pol-005",
    name: "Pipeline Output Audit Trail",
    description: "All pipeline executions must reference a registered pipeline configuration",
    category: "audit",
    enforced: true,
    blocking: false,
    appliesWhen: (_riskLevel, action) =>
      action.startsWith("execute pipeline") && !action.match(/terra-|vessels-|alloy-|lyte-|firestorm-/i),
    violationMessage: "Pipeline execution should reference a registered pipeline template",
  },
];

// ─── Governance: pre-flight policy check ─────────────────────────────────────
// Actions are BLOCKED (allowed: false) if:
//   a) The requested riskLevel exceeds the agent's scopeCertMaxRisk, OR
//   b) The action is high/critical risk and no prior explicit approval exists
//      (pol-001: High-Risk Action Approval Gate).
//
// Callers must treat allowed: false as a hard gate — execution must not proceed.
// For requiresApproval cases, the caller should persist the decision as
// status="proposed" and return 202 Accepted so the human can review and approve.

function evaluatePolicies(
  agentId: string,
  action: string,
  riskLevel: string,
  approvalGranted = false,
): {
  allowed: boolean;
  requiresApproval: boolean;
  blockedReason: string | null;
  violatedPolicies: string[];
} {
  const agentDef = CONTROL_TOWER_AGENT_REGISTRY.find(a => a.id === agentId);
  const riskOrder: Record<string, number> = { low: 0, medium: 1, high: 2, critical: 3 };
  const maxRisk = agentDef?.scopeCertMaxRisk ?? "medium";

  const exceedsScope = (riskOrder[riskLevel] ?? 0) > (riskOrder[maxRisk] ?? 1);

  // pol-001: high/critical risk always requires human approval (hard gate)
  const requiresApproval = riskLevel === "high" || riskLevel === "critical";
  const pol001Violated = requiresApproval && !approvalGranted;

  const violatedPolicies: string[] = [];
  let blockingViolation: string | null = null;

  if (exceedsScope) violatedPolicies.push("pol-001-scope");
  if (pol001Violated) { violatedPolicies.push("pol-001"); blockingViolation ??= "pol-001"; }

  for (const policy of POLICIES) {
    if (
      policy.enforced &&
      policy.appliesWhen(riskLevel, action, agentId) &&
      !violatedPolicies.includes(policy.id)
    ) {
      violatedPolicies.push(policy.id);
      if (policy.blocking && !pol001Violated && !exceedsScope) {
        blockingViolation ??= policy.id;
      }
    }
  }

  const allowed = !exceedsScope && !pol001Violated && blockingViolation === null;
  const blockedReason = exceedsScope
    ? `Risk level '${riskLevel}' exceeds agent '${agentId}' scope maximum '${maxRisk}'`
    : pol001Violated
    ? `High-risk action requires explicit human approval (pol-001). Submit the decision, obtain approval, then call /decide/approve/:id to execute.`
    : blockingViolation
    ? (POLICIES.find(p => p.id === blockingViolation)?.violationMessage ?? `Policy ${blockingViolation} violated`)
    : null;

  return { allowed, requiresApproval, blockedReason, violatedPolicies };
}

// ─── In-memory performance ring (session-level complement to DB decisions) ────

interface AgentPerformanceRecord {
  agentId: string;
  domain: string;
  totalDecisions: number;
  acceptedDecisions: number;
  avgConfidence: number;
  avgLatencyMs: number;
  totalTokenCost: number;
  proposedOptimizations: Array<{
    id: string;
    proposedAt: string;
    description: string;
    expectedImprovement: string;
    status: "pending" | "applied" | "rejected";
  }>;
  lastUpdated: string;
}

const agentPerformanceStore = new Map<string, AgentPerformanceRecord>();

function getOrCreatePerf(agentId: string, domain: string): AgentPerformanceRecord {
  if (!agentPerformanceStore.has(agentId)) {
    agentPerformanceStore.set(agentId, {
      agentId, domain,
      totalDecisions: 0, acceptedDecisions: 0,
      avgConfidence: 0, avgLatencyMs: 0, totalTokenCost: 0,
      proposedOptimizations: [],
      lastUpdated: new Date().toISOString(),
    });
  }
  return agentPerformanceStore.get(agentId)!;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Map human-readable risk strings (used internally by evaluatePolicies) to
 *  the typed RiskLevel enum used by AlloyDecision (P0 = highest risk). */
function toRiskLevel(humanRisk: string): RiskLevel {
  const map: Record<string, RiskLevel> = { critical: "P0", high: "P1", medium: "P2", low: "P3" };
  return map[humanRisk] ?? "P2";
}

/** Map stored AlloyDecision RiskLevel (P0-P4) to OrchestrationDepth. */
function riskLevelToDepth(riskLevel: string): "deep" | "standard" | "shallow" {
  if (riskLevel === "P0") return "deep";
  if (riskLevel === "P1") return "standard";
  return "shallow";
}

/** Build a valid AlloyDecisionEvidenceRef from a partial source object. */
function makeEvidenceRef(partial: {
  refId?: string; source: string; sourceType: AlloyDecisionEvidenceRef["sourceType"];
  content: string; relevanceScore?: number; objectId?: string | null;
}): AlloyDecisionEvidenceRef {
  return {
    refId: partial.refId ?? randomUUID(),
    source: partial.source,
    sourceType: partial.sourceType,
    content: partial.content.slice(0, 400),
    relevanceScore: partial.relevanceScore ?? 0.85,
    timestamp: new Date().toISOString(),
    objectId: partial.objectId ?? null,
  };
}

function buildSignalBusSnapshot() {
  const events = agentEventBus.getHistory({ limit: 100 });
  const stats = agentEventBus.getStats();
  const domainSignals: Record<string, { count: number; lastSeverity: string; lastAt: number }> = {};
  for (const evt of events) {
    const d = evt.sourceDomain;
    if (!domainSignals[d]) domainSignals[d] = { count: 0, lastSeverity: "info", lastAt: 0 };
    domainSignals[d]!.count++;
    domainSignals[d]!.lastSeverity = evt.severity;
    domainSignals[d]!.lastAt = Math.max(domainSignals[d]!.lastAt, evt.timestamp);
  }
  return {
    totalSignals: stats.totalPublished,
    activeSubscribers: stats.subscriptionCount,
    recentEvents: events.slice(0, 50),
    domainSummary: Object.entries(domainSignals).map(([domain, info]) => ({ domain, ...info })),
    eventsByType: stats.byType,
    historyWindowSize: stats.historySize,
  };
}

function buildCompliancePosture() {
  const auditTrail = getKernelAuditTrail();
  const integrity = verifyAuditChainIntegrity();
  const last24h = auditTrail.filter(e => new Date(e.timestamp).getTime() > Date.now() - 86400000);
  const blockedActions = last24h.filter(e => e.authorizationResult === "unauthorized").length;
  const escalatedActions = last24h.filter(e => e.authorizationResult === "escalated").length;
  const validatedActions = last24h.filter(e => e.validationResult === "passed").length;
  const totalActions = last24h.length;
  const overallScore = totalActions === 0 ? 100
    : Math.round(100 - (blockedActions / totalActions * 30) - (escalatedActions / totalActions * 10));
  return {
    overallComplianceScore: Math.max(overallScore, 50),
    auditChainIntegrity: integrity.valid,
    auditChainBrokenAt: integrity.brokenAt,
    totalAuditEntries: auditTrail.length,
    last24hSummary: { total: totalActions, authorized: validatedActions, blocked: blockedActions, escalated: escalatedActions },
    policies: POLICIES.map(p => ({
      id: p.id, name: p.name, description: p.description,
      category: p.category, enforced: p.enforced,
      status: p.enforced ? "compliant" : "inactive",
    })),
    riskPosture: overallScore >= 90 ? "low" : overallScore >= 70 ? "medium" : "high",
  };
}

function buildAgentRegistryWithHealth() {
  const auditTrail = getKernelAuditTrail();
  return CONTROL_TOWER_AGENT_REGISTRY.map(agent => {
    const agentAuditEntries = auditTrail.filter(e => e.agentId.includes(agent.domain));
    const perf = agentPerformanceStore.get(agent.id);
    const successCount = agentAuditEntries.filter(e => e.executionResult === "success").length;
    const totalCount = agentAuditEntries.length;
    const successRate = totalCount > 0 ? successCount / totalCount : 1;
    return {
      ...agent,
      manifestVersion: AGENT_MANIFEST_VERSION,
      manifestDate: AGENT_MANIFEST_DATE,
      health: {
        status: successRate >= 0.9 ? "healthy" : successRate >= 0.7 ? "degraded" : "unhealthy",
        successRate: parseFloat(successRate.toFixed(3)),
        totalExecutions: totalCount,
        avgLatencyMs: perf?.avgLatencyMs ?? 0,
        lastActivity: agentAuditEntries[0]?.timestamp ?? null,
      },
      performance: {
        totalDecisions: perf?.totalDecisions ?? 0,
        acceptanceRate: perf && perf.totalDecisions > 0
          ? parseFloat((perf.acceptedDecisions / perf.totalDecisions).toFixed(3))
          : null,
        avgConfidence: perf?.avgConfidence ?? null,
        totalTokenCost: perf?.totalTokenCost ?? 0,
      },
    };
  });
}

// ─── Sense Layer ───────────────────────────────────────────────────────────────

router.get("/control-tower/sense/signals", (req: Request, res: Response) => {
  try {
    const domain = req.query.domain as string | undefined;
    const severity = req.query.severity as string | undefined;
    const limit = Math.min(200, parseInt(String(req.query.limit ?? "50"), 10));
    let events = agentEventBus.getHistory({ limit: 200 });
    if (domain) events = events.filter(e => e.sourceDomain === domain);
    if (severity) events = events.filter(e => e.severity === severity);
    events = events.slice(0, limit);
    const snapshot = buildSignalBusSnapshot();
    sendSuccess(res, { layer: "sense", snapshot, events, filteredCount: events.length });
  } catch (err) {
    handleRouteError(res, err, "control-tower/sense/signals");
  }
});

router.post("/control-tower/sense/emit", requireRole("super_admin", "ops", "exec"), async (req: Request, res: Response) => {
  try {
    const { type, sourceAgent, sourceDomain, payload, severity, correlationId } = req.body as {
      type?: string; sourceAgent?: string; sourceDomain?: string;
      payload?: Record<string, unknown>; severity?: "info" | "low" | "medium" | "high" | "critical";
      correlationId?: string;
    };
    if (!type || !sourceAgent || !sourceDomain) {
      res.status(400).json({ error: "type, sourceAgent, and sourceDomain are required" });
      return;
    }
    const event = await agentEventBus.publish({
      type: type as Parameters<typeof agentEventBus.publish>[0]["type"],
      sourceAgent, sourceDomain, payload: payload ?? {},
      severity: severity ?? "info", correlationId,
    });
    sendSuccess(res, { event, emittedAt: new Date().toISOString() });
  } catch (err) {
    handleRouteError(res, err, "control-tower/sense/emit");
  }
});

router.get("/control-tower/sense/domain-snapshot", (_req: Request, res: Response) => {
  try {
    const signals: any[] = [];

    sendSuccess(res, {
      layer: "sense", signals, totalSignals: signals.length,
      domains: ["firestorm", "vessels", "lyte", "terra"], snapshotAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, "control-tower/sense/domain-snapshot");
  }
});

// ─── Decide Layer ──────────────────────────────────────────────────────────────

router.get("/control-tower/decide/agents", (_req: Request, res: Response) => {
  try {
    const registry = buildAgentRegistryWithHealth();
    const capabilities = getOrchestratorCapabilities();
    sendSuccess(res, {
      layer: "decide",
      agents: registry,
      meshCapabilities: capabilities,
      totalAgents: registry.length,
      manifestVersion: AGENT_MANIFEST_VERSION,
      manifestDate: AGENT_MANIFEST_DATE,
      healthySummary: {
        healthy: registry.filter(a => a.health.status === "healthy").length,
        degraded: registry.filter(a => a.health.status === "degraded").length,
        unhealthy: registry.filter(a => a.health.status === "unhealthy").length,
      },
    });
  } catch (err) {
    handleRouteError(res, err, "control-tower/decide/agents");
  }
});

// Decision journal — reads from the persistent alloy_ai_decisions table (operator-only: isAdmin queries span all orgs)
router.get("/control-tower/decide/journal", requireRole("super_admin", "ops", "exec"), async (req: Request, res: Response) => {
  try {
    const limit = Math.min(100, parseInt(String(req.query.limit ?? "20"), 10));
    const statusFilter = req.query.status as string | undefined;
    const riskLevel = req.query.riskLevel as string | undefined;

    const { decisions, total } = await listDecisions({
      limit,
      offset: 0,
      status: statusFilter as "proposed" | "approved" | "rejected" | "executed" | undefined,
      riskLevel: riskLevel as "low" | "medium" | "high" | "critical" | undefined,
      orgId: null,
      isAdmin: true,
    });

    const entries = decisions.map(d => {
      // Derive domain from modelRoute (e.g. "alloy-orchestrator" → "orchestration",
      // "pipeline:vessels-risk-assessment" → "vessels")
      const routePrefix = d.modelRoute?.split(":")?.[0] ?? "alloy-orchestrator";
      const agentDef = CONTROL_TOWER_AGENT_REGISTRY.find(a => a.id === routePrefix);
      const domain = agentDef?.domain
        ?? (d.workflowId?.split("-")?.[0] !== undefined ? d.workflowId!.split("-")[0]! : "orchestration");

      return {
        id: d.decisionId,
        timestamp: d.createdAt,
        agentId: routePrefix,
        domain,
        query: d.rawInput?.slice(0, 200) ?? d.recommendedAction,
        decision: d.recommendedAction,
        confidence: d.confidence,
        reasoningChain: d.evidenceRefs.map(e =>
          typeof e === "string" ? e : JSON.stringify(e).slice(0, 150),
        ),
        outcome: d.status === "approved" ? "accepted"
          : d.status === "rejected" ? "rejected"
          : d.status === "executed" ? "accepted"
          : "pending",
        riskLevel: d.riskLevel,
        approvalRequired: d.approvalRequired,
        durationMs: 0,
      };
    });

    sendSuccess(res, { layer: "decide", entries, total, filteredCount: entries.length });
  } catch (err) {
    handleRouteError(res, err, "control-tower/decide/journal");
  }
});

// Orchestrate: governance pre-flight + DB decision. High/critical risk → 202 pending_approval.
// Low/medium risk executes immediately. See PATCH /journal/:id and POST /approve/:id for the approval flow.
router.post("/control-tower/decide/orchestrate", requireRole("super_admin", "ops", "exec"), async (req: Request, res: Response) => {
  try {
    const { query, domains, depth, sessionId } = req.body as {
      query?: string; domains?: string[];
      depth?: "shallow" | "standard" | "deep"; sessionId?: string;
    };
    if (!query) {
      res.status(400).json({ error: "query is required" });
      return;
    }

    const riskLevel = depth === "deep" ? "high" : depth === "standard" ? "medium" : "low";
    const govCheck = evaluatePolicies("alloy-orchestrator", query, riskLevel);

    const decisionId = `ct-dec-${randomUUID()}`;

    if (govCheck.requiresApproval && !govCheck.allowed) {
      // Persist as "proposed" pending human approval — do NOT execute.
      try {
        await insertDecision({
          decisionId,
          workflowId: sessionId ?? null,
          signalIds: [],
          recommendedAction: query,
          rationaleSummary: `[PENDING APPROVAL] ${govCheck.blockedReason}`,
          evidenceRefs: [
            makeEvidenceRef({
              source: "pol-001: High-Risk Action Approval Gate",
              sourceType: "policy",
              content: `Action '${query.slice(0, 200)}' blocked at depth '${depth ?? "standard"}' — requires human approval before execution.`,
              relevanceScore: 1.0,
            }),
          ],
          confidence: 0,
          ownerSuggestion: "Review required before execution",
          approvalRequired: true,
          riskLevel: toRiskLevel(riskLevel),
          fallbackPlan: "Reduce query depth to 'standard' or 'shallow' for auto-execution",
          modelRoute: "alloy-orchestrator",
          schemaVersion: "2.0.0",
          status: "proposed",
          rawInput: query,
          rawOutput: null,
          createdAt: new Date().toISOString(),
        });
      } catch (dbErr) {
        logger.warn({ err: dbErr }, "control-tower: failed to persist proposed decision");
      }

      res.status(202).json({
        status: "pending_approval",
        message: "High-risk orchestration has been queued for human approval. Approve at /decide/approve/:id.",
        decisionId,
        riskLevel,
        governanceCheck: {
          allowed: false,
          requiresApproval: true,
          blockedReason: govCheck.blockedReason,
          violatedPolicies: govCheck.violatedPolicies,
        },
      });
      return;
    }

    if (!govCheck.allowed) {
      res.status(403).json({
        error: "Governance pre-flight failed: scope exceeded",
        blockedReason: govCheck.blockedReason,
        violatedPolicies: govCheck.violatedPolicies,
      });
      return;
    }

    const startTime = Date.now();
    const result = await orchestrate({ query, domains, depth, sessionId });
    const durationMs = Date.now() - startTime;

    try {
      await insertDecision({
        decisionId,
        workflowId: sessionId ?? null,
        signalIds: [],
        recommendedAction: result.synthesis.slice(0, 1000),
        rationaleSummary: result.steps
          .filter(s => s.status === "completed")
          .map(s => `[${s.domain}] ${s.result?.slice(0, 200) ?? ""}`)
          .join("\n"),
        evidenceRefs: result.steps.map(s =>
          makeEvidenceRef({
            source: `orchestration-step:${s.domain}`,
            sourceType: "workflow",
            content: `Task: ${s.task.slice(0, 150)} | Result: ${s.result?.slice(0, 150) ?? ""}`,
            relevanceScore: result.confidence,
          }),
        ),
        confidence: result.confidence,
        ownerSuggestion: null,
        approvalRequired: false,
        riskLevel: toRiskLevel(riskLevel),
        fallbackPlan: null,
        modelRoute: "alloy-orchestrator",
        schemaVersion: "2.0.0",
        status: "executed",
        rawInput: query,
        rawOutput: result.synthesis.slice(0, 2000),
        createdAt: new Date().toISOString(),
      });
    } catch (dbErr) {
      logger.warn({ err: dbErr }, "control-tower: failed to persist decision to DB");
    }

    const alloyPerf = getOrCreatePerf("alloy-orchestrator", "orchestration");
    alloyPerf.totalDecisions++;
    alloyPerf.avgConfidence = (alloyPerf.avgConfidence * (alloyPerf.totalDecisions - 1) + result.confidence) / alloyPerf.totalDecisions;
    alloyPerf.avgLatencyMs = (alloyPerf.avgLatencyMs * (alloyPerf.totalDecisions - 1) + durationMs) / alloyPerf.totalDecisions;
    alloyPerf.totalTokenCost += result.totalCostUsd;
    alloyPerf.lastUpdated = new Date().toISOString();

    sendSuccess(res, {
      layer: "decide", result, decisionId,
      governanceCheck: { allowed: true, requiresApproval: false, riskLevel },
    });
  } catch (err) {
    handleRouteError(res, err, "control-tower/decide/orchestrate");
  }
});

// Approve + execute a previously queued high-risk orchestration (operator role required)
router.post("/control-tower/decide/approve/:id", requireRole("super_admin", "ops", "exec"), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { approvedBy, domains } = req.body as { approvedBy?: string; domains?: string[] };

    const decision = await getDecision(id, null, true);
    if (!decision) {
      res.status(404).json({ error: `Decision not found: ${id}` });
      return;
    }
    if (decision.status !== "proposed") {
      res.status(409).json({ error: `Decision is already ${decision.status}; cannot re-approve` });
      return;
    }
    if (!decision.approvalRequired) {
      res.status(400).json({ error: "This decision did not require approval" });
      return;
    }

    await updateDecisionStatus(id, {
      status: "approved",
      approvedBy: approvedBy ?? "control-tower-operator",
      approvedAt: new Date().toISOString(),
    }, null, true);

    const query = decision.rawInput ?? decision.recommendedAction;
    const depth = riskLevelToDepth(decision.riskLevel);

    const startTime = Date.now();
    const result = await orchestrate({ query, domains, depth });
    const durationMs = Date.now() - startTime;

    await updateDecisionStatus(id, {
      status: "executed",
      executionOutcome: result.status === "completed" ? "success" : "partial",
      executedAt: new Date().toISOString(),
    }, null, true);

    const alloyPerf = getOrCreatePerf("alloy-orchestrator", "orchestration");
    alloyPerf.totalDecisions++;
    alloyPerf.acceptedDecisions++;
    alloyPerf.avgConfidence = (alloyPerf.avgConfidence * (alloyPerf.totalDecisions - 1) + result.confidence) / alloyPerf.totalDecisions;
    alloyPerf.avgLatencyMs = (alloyPerf.avgLatencyMs * (alloyPerf.totalDecisions - 1) + durationMs) / alloyPerf.totalDecisions;
    alloyPerf.lastUpdated = new Date().toISOString();

    sendSuccess(res, {
      layer: "decide", result, decisionId: id,
      approvedBy: approvedBy ?? "control-tower-operator",
      executedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, "control-tower/decide/approve/:id");
  }
});

router.patch("/control-tower/decide/journal/:id", requireRole("super_admin", "ops", "exec"), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { outcome } = req.body as { outcome?: "accepted" | "rejected" | "overridden" };
    if (!outcome) {
      res.status(400).json({ error: "outcome is required" });
      return;
    }
    const dbStatus = outcome === "accepted" ? "approved"
      : outcome === "rejected" ? "rejected"
      : "proposed";
    await updateDecisionStatus(id, { status: dbStatus }, null, true);
    sendSuccess(res, { id, outcome, updatedAt: new Date().toISOString() });
  } catch (err) {
    handleRouteError(res, err, "control-tower/decide/journal/:id");
  }
});

// ─── Act Layer ─────────────────────────────────────────────────────────────────

router.get("/control-tower/act/pipelines", (_req: Request, res: Response) => {
  try {
    const pipelines = listPipelines();
    sendSuccess(res, {
      layer: "act",
      pipelines,
      totalPipelines: pipelines.length,
      templates: pipelines.map(p => ({
        id: p.id, name: p.name, domain: p.domain,
        description: p.description, stages: p.stages,
        stageTypes: p.stages.map(s => s.type),
      })),
    });
  } catch (err) {
    handleRouteError(res, err, "control-tower/act/pipelines");
  }
});

router.get("/control-tower/act/pipelines/:id", (req: Request, res: Response) => {
  try {
    const config = getPipelineConfig(req.params.id);
    if (!config) {
      res.status(404).json({ error: `Pipeline not found: ${req.params.id}` });
      return;
    }
    sendSuccess(res, { layer: "act", pipeline: config });
  } catch (err) {
    handleRouteError(res, err, "control-tower/act/pipelines/:id");
  }
});

// Pipeline execution — governance pre-flight before running
router.post("/control-tower/act/pipelines/:id/run", requireRole("super_admin", "ops", "exec"), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { input, agentId } = req.body as { input?: string; agentId?: string };
    if (!input) {
      res.status(400).json({ error: "input is required" });
      return;
    }

    const config = getPipelineConfig(id);
    if (!config) {
      res.status(404).json({ error: `Pipeline not found: ${id}` });
      return;
    }

    const executingAgentId = agentId ?? `${config.domain}-pipeline`;
    const riskLevel = "medium";
    const govCheck = evaluatePolicies(executingAgentId, `execute pipeline ${id}`, riskLevel);

    if (!govCheck.allowed) {
      res.status(403).json({
        error: "Governance pre-flight failed",
        blockedReason: govCheck.blockedReason,
        violatedPolicies: govCheck.violatedPolicies,
        pipeline: id,
      });
      return;
    }

    logger.info({ pipelineId: id, inputLength: input.length }, "Control Tower — pipeline execution");
    const result = await executePipeline(id, input);

    const decisionId = `ct-pipe-${randomUUID()}`;
    try {
      await insertDecision({
        decisionId,
        workflowId: id,
        signalIds: [],
        recommendedAction: result.finalOutput.slice(0, 1000),
        rationaleSummary: result.stages
          .filter(s => s.status === "completed")
          .map(s => `[${s.stageType}] ${s.output.slice(0, 150)}`)
          .join("\n"),
        evidenceRefs: result.stages.map(s =>
          makeEvidenceRef({
            source: `pipeline:${id}:${s.stageType}`,
            sourceType: "workflow",
            content: `Stage '${s.stageName}' (${s.stageType}) status=${s.status} — ${s.output.slice(0, 200)}`,
            relevanceScore: s.status === "completed" ? 0.9 : 0.4,
          }),
        ),
        confidence: result.status === "completed" ? 0.9 : result.status === "partial" ? 0.6 : 0.2,
        ownerSuggestion: null,
        approvalRequired: govCheck.requiresApproval,
        riskLevel: toRiskLevel(riskLevel),
        fallbackPlan: null,
        modelRoute: `pipeline:${id}`,
        schemaVersion: "2.0.0",
        status: "executed",
        rawInput: input.slice(0, 1000),
        rawOutput: result.finalOutput.slice(0, 2000),
        createdAt: new Date().toISOString(),
      });
    } catch (dbErr) {
      logger.warn({ err: dbErr }, "control-tower: failed to persist pipeline decision to DB");
    }

    sendSuccess(res, { layer: "act", result, decisionId, governanceCheck: { requiresApproval: govCheck.requiresApproval } });
  } catch (err) {
    handleRouteError(res, err, "control-tower/act/pipelines/:id/run");
  }
});

// Compose — run a custom ad-hoc pipeline assembled by the frontend drag-and-drop builder
router.post("/control-tower/act/compose", requireRole("super_admin", "ops", "exec"), async (req: Request, res: Response) => {
  try {
    const { stages, input } = req.body as {
      stages: Array<{ id: string; type: string; name: string }>;
      input: string;
    };

    if (!Array.isArray(stages) || stages.length === 0) {
      res.status(400).json({ error: "stages array is required and must be non-empty" });
      return;
    }
    if (typeof input !== "string" || !input.trim()) {
      res.status(400).json({ error: "input string is required" });
      return;
    }

    const validStageTypes = ["ingest", "classify", "score", "enrich", "recommend", "audit"] as const;
    type ValidType = typeof validStageTypes[number];
    const invalidStage = stages.find(s => !validStageTypes.includes(s.type as ValidType));
    if (invalidStage) {
      res.status(400).json({ error: `Unknown stage type: ${invalidStage.type}. Valid types: ${validStageTypes.join(", ")}` });
      return;
    }

    const typedStages = stages as Array<{ id: string; type: ValidType; name: string }>;

    const result = await executeComposedPipeline(typedStages, input.trim());

    // Persist composed pipeline run to the decision journal for full lineage tracing:
    // signal → compose request → stage executions → decision record → governance audit
    const decisionId = `ct-compose-${randomUUID()}`;
    try {
      const confidence = result.status === "completed" ? 0.85 : result.status === "partial" ? 0.5 : 0.2;
      await insertDecision({
        decisionId,
        workflowId: result.runId,
        signalIds: [],
        recommendedAction: result.finalOutput.slice(0, 1000),
        rationaleSummary: result.stages
          .filter(s => s.status === "completed")
          .map(s => `[${s.stageType}] ${s.output.slice(0, 150)}`)
          .join("\n"),
        evidenceRefs: result.stages.map(s =>
          makeEvidenceRef({
            source: `composed-pipeline:${result.composedPipelineId}:${s.stageType}`,
            sourceType: "workflow",
            content: `Stage '${s.stageName}' (${s.stageType}) — ${s.output.slice(0, 200)}`,
            relevanceScore: s.status === "completed" ? 0.9 : 0.3,
            objectId: result.composedPipelineId,
          }),
        ),
        confidence,
        ownerSuggestion: null,
        approvalRequired: false,
        riskLevel: toRiskLevel("medium"),
        fallbackPlan: null,
        modelRoute: `composed-pipeline`,
        schemaVersion: "2.0.0",
        status: "executed",
        rawInput: input.trim().slice(0, 1000),
        rawOutput: result.finalOutput.slice(0, 2000),
        createdAt: new Date().toISOString(),
      });
    } catch (dbErr) {
      logger.warn({ err: dbErr }, "control-tower: failed to persist composed pipeline decision to DB");
    }

    sendSuccess(res, {
      layer: "act",
      composedPipelineId: result.composedPipelineId,
      runId: result.runId,
      decisionId,
      status: result.status,
      stageResults: result.stages.map(s => ({
        stageName: s.stageName,
        type: s.stageType,
        status: s.status,
        outputSnippet: s.output.slice(0, 400),
        durationMs: s.durationMs,
        tokensUsed: s.tokensUsed,
      })),
      finalOutput: result.finalOutput,
      totalDurationMs: result.totalDurationMs,
      totalTokens: result.totalTokens,
      stageCount: stages.length,
    });
  } catch (err) {
    handleRouteError(res, err, "control-tower/act/compose");
  }
});

// ─── Govern Layer ──────────────────────────────────────────────────────────────

router.get("/control-tower/govern/compliance", (_req: Request, res: Response) => {
  try {
    const posture = buildCompliancePosture();
    sendSuccess(res, { layer: "govern", ...posture, evaluatedAt: new Date().toISOString() });
  } catch (err) {
    handleRouteError(res, err, "control-tower/govern/compliance");
  }
});

router.get("/control-tower/govern/audit", (req: Request, res: Response) => {
  try {
    const limit = Math.min(200, parseInt(String(req.query.limit ?? "50"), 10));
    const executionResult = req.query.result as string | undefined;
    const agentIdFilter = req.query.agentId as string | undefined;
    let trail = getKernelAuditTrail();
    if (executionResult) trail = trail.filter(e => e.executionResult === executionResult);
    if (agentIdFilter) trail = trail.filter(e => e.agentId === agentIdFilter);
    const entries = trail.slice(-limit).reverse();
    sendSuccess(res, {
      layer: "govern", entries, total: getKernelAuditTrail().length,
      filteredCount: entries.length, integrity: verifyAuditChainIntegrity(),
    });
  } catch (err) {
    handleRouteError(res, err, "control-tower/govern/audit");
  }
});

// Certificates — only issue for manifest-registered agents; operator role required
router.get("/control-tower/govern/certificates", requireRole("super_admin", "ops", "exec"), (req: Request, res: Response) => {
  try {
    const requestedIds = (req.query.agents as string)?.split(",").filter(Boolean);
    const agentIds = requestedIds && requestedIds.length > 0
      ? requestedIds
      : CONTROL_TOWER_AGENT_REGISTRY.map(a => a.id);

    const unknownIds = agentIds.filter(id => !REGISTERED_AGENT_IDS.has(id));
    if (unknownIds.length > 0) {
      res.status(400).json({
        error: "Certificate issuance rejected: unregistered agent IDs",
        unknownIds,
        hint: "Only agents registered in the Control Tower manifest may receive certificates",
      });
      return;
    }

    const certificates = agentIds.map(agentId => {
      const agentDef = CONTROL_TOWER_AGENT_REGISTRY.find(a => a.id === agentId)!;
      const cert = issueScopeCertificate(
        agentId,
        agentDef.capabilities,
        agentDef.scopeCertMaxRisk,
        3600000,
      );
      return {
        agentId,
        agentName: agentDef.name,
        domain: agentDef.domain,
        certificate: cert,
        status: new Date(cert.expiresAt) > new Date() ? "active" : "expired",
      };
    });

    sendSuccess(res, {
      layer: "govern",
      certificates,
      totalIssued: certificates.length,
      issuedAt: new Date().toISOString(),
      manifestVersion: AGENT_MANIFEST_VERSION,
    });
  } catch (err) {
    handleRouteError(res, err, "control-tower/govern/certificates");
  }
});

router.post("/control-tower/govern/evaluate", requireRole("super_admin", "ops", "exec"), (req: Request, res: Response) => {
  try {
    const { agentId, action, riskLevel } = req.body as {
      agentId?: string; action?: string; riskLevel?: string;
    };
    if (!agentId || !action || !riskLevel) {
      res.status(400).json({ error: "agentId, action, and riskLevel are required" });
      return;
    }
    if (!REGISTERED_AGENT_IDS.has(agentId)) {
      res.status(400).json({ error: `Unknown agent: ${agentId}. Must be a registered Control Tower agent.` });
      return;
    }
    const evaluation = evaluatePolicies(agentId, action, riskLevel);
    sendSuccess(res, {
      layer: "govern",
      evaluation: {
        agentId, action, riskLevel,
        ...evaluation,
        evaluatedAt: new Date().toISOString(),
        violatedPolicies: evaluation.violatedPolicies.map(id => {
          const policy = POLICIES.find(p => p.id === id);
          return { id, name: policy?.name, message: policy?.violationMessage };
        }),
      },
    });
  } catch (err) {
    handleRouteError(res, err, "control-tower/govern/evaluate");
  }
});

// Federated search: RAG knowledge base, persisted decisions (DB), and event bus signals (operator-only: isAdmin queries span all orgs)
router.get("/control-tower/search", requireRole("super_admin", "ops", "exec"), async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string | undefined;
    const domainsParam = (req.query.domains as string)?.split(",").filter(Boolean);
    const limit = Math.min(50, parseInt(String(req.query.limit ?? "15"), 10));

    if (!query || query.trim().length === 0) {
      res.status(400).json({ error: "q (query) parameter is required" });
      return;
    }

    const searchStart = Date.now();
    const queryLower = query.toLowerCase();
    const domainFilter = domainsParam?.length ? domainsParam : undefined;

    // Source 1: RAG knowledge base (DB-backed keyword search)
    let ragResults: Array<{
      id: string; domain: string; type: string;
      title: string; summary: string; relevance: number;
      timestamp: string; metadata: Record<string, unknown>;
    }> = [];

    try {
      const ragHits = await keywordSearch({
        query,
        topK: Math.min(30, limit * 2),
        domains: domainFilter,
        maxSensitivityLevel: "confidential",
      });
      ragResults = ragHits.map(hit => ({
        id: hit.id,
        domain: hit.domain,
        type: `knowledge:${hit.sourceType}`,
        title: (hit.metadata?.title as string) ?? `${hit.domain} — ${hit.sourceType}`,
        summary: hit.content.slice(0, 300),
        relevance: hit.score,
        timestamp: hit.updatedAt ?? hit.createdAt ?? new Date().toISOString(),
        metadata: { sourceType: hit.sourceType, sensitivity: hit.sensitivityLevel, chunkIndex: hit.chunkIndex },
      }));
    } catch (ragErr) {
      logger.warn({ err: ragErr }, "control-tower/search: RAG search failed, continuing");
    }

    // Source 2: Persisted AI decisions (DB)
    let decisionResults: typeof ragResults = [];
    try {
      const { decisions } = await listDecisions({ limit: 50, offset: 0, orgId: null, isAdmin: true });
      decisionResults = decisions
        .filter(d => {
          const text = `${d.recommendedAction} ${d.rationaleSummary} ${d.rawInput ?? ""}`.toLowerCase();
          return queryLower.split(/\s+/).some(term => term.length > 2 && text.includes(term));
        })
        .map(d => {
          // Derive domain from modelRoute, not riskLevel
          const routePrefix = d.modelRoute?.split(":")?.[0] ?? "alloy-orchestrator";
          const agentDef = CONTROL_TOWER_AGENT_REGISTRY.find(a => a.id === routePrefix);
          const decisionDomain = agentDef?.domain ?? "orchestration";
          return { d, decisionDomain };
        })
        .filter(({ decisionDomain }) => !domainFilter || domainFilter.includes(decisionDomain))
        .slice(0, limit)
        .map(({ d, decisionDomain }) => ({
          id: d.decisionId,
          domain: decisionDomain,
          type: "decision:alloy",
          title: `Decision — ${d.recommendedAction.slice(0, 80)}`,
          summary: d.rationaleSummary.slice(0, 300),
          relevance: 0.8,
          timestamp: d.createdAt,
          metadata: {
            riskLevel: d.riskLevel, status: d.status,
            confidence: d.confidence, approvalRequired: d.approvalRequired,
          },
        }));
    } catch (dbErr) {
      logger.warn({ err: dbErr }, "control-tower/search: Decision DB search failed, continuing");
    }

    // Source 3: Event bus (in-memory, domain-tagged signals)
    const busResults: typeof ragResults = [];
    const allDomains = ["firestorm", "vessels", "terra", "lyte", "prism", "alloy"];
    const searchDomains = domainFilter ?? allDomains;
    const terms = queryLower.split(/\s+/).filter(t => t.length > 2);

    for (const domain of searchDomains) {
      const events = agentEventBus.getHistory({ sourceDomain: domain, limit: 80 });
      const hits = events.filter(e => {
        const text = `${e.type} ${JSON.stringify(e.payload)}`.toLowerCase();
        return terms.some(term => text.includes(term));
      }).slice(0, 5);

      for (const evt of hits) {
        busResults.push({
          id: evt.id,
          domain,
          type: `signal:${evt.type}`,
          title: `${domain} — ${evt.type.replace(/_/g, " ")}`,
          summary: JSON.stringify(evt.payload).slice(0, 250),
          relevance: 0.6,
          timestamp: new Date(evt.timestamp).toISOString(),
          metadata: { severity: evt.severity, sourceAgent: evt.sourceAgent },
        });
      }
    }

    // Merge and deduplicate by id, then rank by relevance descending
    const seenIds = new Set<string>();
    const allResults = [...ragResults, ...decisionResults, ...busResults]
      .filter(r => { const dup = seenIds.has(r.id); seenIds.add(r.id); return !dup; })
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit * 2);

    const domainsSearched = searchDomains.map(domain => ({
      domain,
      resultCount: allResults.filter(r => r.domain === domain).length,
      source: "rag+decisions+signals",
    }));

    sendSuccess(res, {
      layer: "search",
      query,
      results: allResults,
      totalResults: allResults.length,
      sources: {
        rag: ragResults.length,
        decisions: decisionResults.length,
        signals: busResults.length,
      },
      domainsSearched,
      searchLatencyMs: Date.now() - searchStart,
      searchedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, "control-tower/search");
  }
});

// ─── Evolve Layer ──────────────────────────────────────────────────────────────

router.get("/control-tower/evolve/metrics", async (req: Request, res: Response) => {
  try {
    const providerStats = inferenceTelemetry.getProviderStats(3600000);

    let dbDecisionCount = 0;
    let dbAcceptedCount = 0;
    let dbPendingCount = 0;
    try {
      const { total: totalDb } = await listDecisions({ limit: 1, offset: 0, orgId: null, isAdmin: true });
      const { total: approvedDb } = await listDecisions({ limit: 1, offset: 0, status: "approved", orgId: null, isAdmin: true });
      const { total: proposedDb } = await listDecisions({ limit: 1, offset: 0, status: "proposed", orgId: null, isAdmin: true });
      dbDecisionCount = totalDb;
      dbAcceptedCount = approvedDb;
      dbPendingCount = proposedDb;
    } catch (dbErr) {
      logger.warn({ err: dbErr }, "control-tower/evolve/metrics: DB count failed");
    }

    const auditTrail = getKernelAuditTrail();
    const agentMetrics = CONTROL_TOWER_AGENT_REGISTRY.map(agent => {
      const perf = agentPerformanceStore.get(agent.id);
      const auditEntries = auditTrail.filter(e => e.agentId.includes(agent.domain));
      return {
        agentId: agent.id,
        agentName: agent.name,
        domain: agent.domain,
        metrics: {
          totalDecisions: perf?.totalDecisions ?? 0,
          acceptanceRate: perf && perf.totalDecisions > 0
            ? parseFloat((perf.acceptedDecisions / perf.totalDecisions).toFixed(3))
            : null,
          avgConfidence: perf?.avgConfidence ?? null,
          avgLatencyMs: perf?.avgLatencyMs ?? 0,
          totalTokenCost: perf?.totalTokenCost ?? 0,
          successRate: auditEntries.length > 0
            ? parseFloat((auditEntries.filter(e => e.executionResult === "success").length / auditEntries.length).toFixed(3))
            : null,
          executionCount: auditEntries.length,
        },
        optimizationProposals: perf?.proposedOptimizations ?? [],
      };
    });

    sendSuccess(res, {
      layer: "evolve",
      agentMetrics,
      systemMetrics: {
        totalInferences: providerStats.reduce((s, p) => s + p.totalRequests, 0),
        avgLatencyMs: providerStats.reduce((s, p) => s + p.avgLatencyMs, 0) / Math.max(1, providerStats.length),
        totalCostUsd: providerStats.reduce((s, p) => s + p.totalCostUsd, 0),
        totalDecisions: dbDecisionCount,
        acceptedDecisions: dbAcceptedCount,
        pendingDecisions: dbPendingCount,
        signalBusTotal: agentEventBus.getStats().totalPublished,
        dataSource: "db+kernel",
      },
      providerHealth: providerStats,
      evaluatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, "control-tower/evolve/metrics");
  }
});

router.post("/control-tower/evolve/propose", requireRole("super_admin", "ops", "exec"), (req: Request, res: Response) => {
  try {
    const { agentId, description, expectedImprovement } = req.body as {
      agentId?: string; description?: string; expectedImprovement?: string;
    };
    if (!agentId || !description) {
      res.status(400).json({ error: "agentId and description are required" });
      return;
    }
    if (!REGISTERED_AGENT_IDS.has(agentId)) {
      res.status(400).json({ error: `Unknown agent: ${agentId}` });
      return;
    }
    const agentDef = CONTROL_TOWER_AGENT_REGISTRY.find(a => a.id === agentId)!;
    const perf = getOrCreatePerf(agentId, agentDef.domain);
    const proposal = {
      id: `opt-${randomUUID()}`,
      proposedAt: new Date().toISOString(),
      description,
      expectedImprovement: expectedImprovement ?? "Performance improvement",
      status: "pending" as const,
    };
    perf.proposedOptimizations.unshift(proposal);
    if (perf.proposedOptimizations.length > 20) perf.proposedOptimizations.length = 20;
    perf.lastUpdated = new Date().toISOString();
    sendSuccess(res, { layer: "evolve", proposal, agentId, totalProposals: perf.proposedOptimizations.length });
  } catch (err) {
    handleRouteError(res, err, "control-tower/evolve/propose");
  }
});

router.patch("/control-tower/evolve/propose/:proposalId", requireRole("super_admin", "ops", "exec"), (req: Request, res: Response) => {
  try {
    const { proposalId } = req.params;
    const { status } = req.body as { status?: "applied" | "rejected" };
    if (!status) {
      res.status(400).json({ error: "status is required" });
      return;
    }
    let found = false;
    for (const perf of agentPerformanceStore.values()) {
      const proposal = perf.proposedOptimizations.find(p => p.id === proposalId);
      if (proposal) {
        proposal.status = status;
        found = true;
        break;
      }
    }
    if (!found) {
      res.status(404).json({ error: "Proposal not found" });
      return;
    }
    sendSuccess(res, { proposalId, status, updatedAt: new Date().toISOString() });
  } catch (err) {
    handleRouteError(res, err, "control-tower/evolve/propose/:proposalId");
  }
});

// ─── Unified Status ────────────────────────────────────────────────────────────

router.get("/control-tower/status", async (_req: Request, res: Response) => {
  try {
    const signalBus = buildSignalBusSnapshot();
    const compliance = buildCompliancePosture();
    const capabilities = getOrchestratorCapabilities();
    const busStats = agentEventBus.getStats();
    const providerStats = inferenceTelemetry.getProviderStats(300000);

    const agentHealthSummary = buildAgentRegistryWithHealth().reduce(
      (acc, a) => { acc[a.health.status] = (acc[a.health.status] ?? 0) + 1; return acc; },
      {} as Record<string, number>,
    );

    let totalDecisions = 0;
    try {
      const { total } = await listDecisions({ limit: 1, offset: 0, orgId: null, isAdmin: true });
      totalDecisions = total;
    } catch (_) {}

    sendSuccess(res, {
      layer: "all",
      controlTower: {
        status: compliance.auditChainIntegrity ? "operational" : "degraded",
        version: "1.0.0",
        manifestVersion: AGENT_MANIFEST_VERSION,
        uptime: process.uptime(),
        evaluatedAt: new Date().toISOString(),
      },
      sense: {
        totalSignalsPublished: signalBus.totalSignals,
        activeSubscribers: busStats.subscriptionCount,
        recentSignalCount: busStats.historySize,
        domainSummary: signalBus.domainSummary,
      },
      decide: {
        registeredAgents: CONTROL_TOWER_AGENT_REGISTRY.length,
        agentHealthSummary,
        totalDecisionsJournaled: totalDecisions,
      },
      act: {
        availablePipelines: listPipelines().length,
        supportedDomains: capabilities.domains.map(d => d.name),
      },
      govern: {
        overallComplianceScore: compliance.overallComplianceScore,
        riskPosture: compliance.riskPosture,
        auditChainIntegrity: compliance.auditChainIntegrity,
        totalAuditEntries: compliance.totalAuditEntries,
        activePolicies: POLICIES.filter(p => p.enforced).length,
      },
      evolve: {
        totalInferences: providerStats.reduce((s, p) => s + p.totalRequests, 0),
        avgSystemLatencyMs: providerStats.reduce((s, p) => s + p.avgLatencyMs, 0) / Math.max(1, providerStats.length),
        pendingOptimizations: Array.from(agentPerformanceStore.values())
          .flatMap(p => p.proposedOptimizations)
          .filter(o => o.status === "pending").length,
      },
    });
  } catch (err) {
    handleRouteError(res, err, "control-tower/status");
  }
});

export default router;
