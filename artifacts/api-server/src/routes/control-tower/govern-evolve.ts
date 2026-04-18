import { Router, type IRouter, type Request, type Response } from "express";
import { requireRole } from "../../middlewares/auth";
import { sendSuccess, sendBadRequest, sendNotFound, handleRouteError } from "../../lib/api-response";
import {
  getKernelAuditTrail,
  verifyAuditChainIntegrity,
  issueScopeCertificate,
  keywordSearch,
} from "@szl-holdings/ai-engine";
import { listPipelines } from "../../lib/intelligence-pipelines";
import { getOrchestratorCapabilities } from "../../lib/multi-agent-orchestrator";
import { inferenceTelemetry } from "../../lib/inference-telemetry";
import { listDecisions } from "../../lib/alloy-decision-store";
import { agentEventBus } from "../../lib/event-bus";
import { logger } from "../../lib/logger";
import { randomUUID } from "crypto";
import {
  CONTROL_TOWER_AGENT_REGISTRY,
  AGENT_MANIFEST_VERSION,
  REGISTERED_AGENT_IDS,
  POLICIES,
  evaluatePolicies,
  buildCompliancePosture,
  buildAgentRegistryWithHealth,
  buildSignalBusSnapshot,
  agentPerformanceStore,
  getOrCreatePerf,
} from "./shared";
import { validateBody, jsonObjectBodySchema, validateQuery, listQuerySchema} from "../../lib/validation";

const router = Router();

router.get("/control-tower/govern/compliance", (_req: Request, res: Response) => {
  try {
    const posture = buildCompliancePosture();
    sendSuccess(res, { layer: "govern", ...posture, evaluatedAt: new Date().toISOString() });
  } catch (err) {
    handleRouteError(res, err, "control-tower/govern/compliance");
  }
});

router.get("/control-tower/govern/audit", validateQuery(listQuerySchema), (req: Request, res: Response) => {
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

router.get("/control-tower/govern/certificates", requireRole("super_admin", "ops", "exec"), validateQuery(listQuerySchema), (req: Request, res: Response) => {
  try {
    const requestedIds = (req.query.agents as string)?.split(",").filter(Boolean);
    const agentIds = requestedIds && requestedIds.length > 0
      ? requestedIds
      : CONTROL_TOWER_AGENT_REGISTRY.map(a => a.id);

    const unknownIds = agentIds.filter(id => !REGISTERED_AGENT_IDS.has(id));
    if (unknownIds.length > 0) {
      sendBadRequest(res, "Certificate issuance rejected: unregistered agent IDs", {
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

router.post("/control-tower/govern/evaluate", requireRole("super_admin", "ops", "exec"), validateBody(jsonObjectBodySchema), (req: Request, res: Response) => {
  try {
    const { agentId, action, riskLevel } = req.body as {
      agentId?: string; action?: string; riskLevel?: string;
    };
    if (!agentId || !action || !riskLevel) {
      sendBadRequest(res, "agentId, action, and riskLevel are required");
      return;
    }
    if (!REGISTERED_AGENT_IDS.has(agentId)) {
      sendBadRequest(res, `Unknown agent: ${agentId}. Must be a registered Control Tower agent.`);
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

router.get("/control-tower/search", requireRole("super_admin", "ops", "exec"), validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string | undefined;
    const domainsParam = (req.query.domains as string)?.split(",").filter(Boolean);
    const limit = Math.min(50, parseInt(String(req.query.limit ?? "15"), 10));

    if (!query || query.trim().length === 0) {
      sendBadRequest(res, "q (query) parameter is required");
      return;
    }

    const searchStart = Date.now();
    const queryLower = query.toLowerCase();
    const domainFilter = domainsParam?.length ? domainsParam : undefined;

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

    let decisionResults: typeof ragResults = [];
    try {
      const { decisions } = await listDecisions({ limit: 50, offset: 0, orgId: null, isAdmin: true });
      decisionResults = decisions
        .filter(d => {
          const text = `${d.recommendedAction} ${d.rationaleSummary} ${d.rawInput ?? ""}`.toLowerCase();
          return queryLower.split(/\s+/).some(term => term.length > 2 && text.includes(term));
        })
        .map(d => {
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

router.post("/control-tower/evolve/propose", requireRole("super_admin", "ops", "exec"), validateBody(jsonObjectBodySchema), (req: Request, res: Response) => {
  try {
    const { agentId, description, expectedImprovement } = req.body as {
      agentId?: string; description?: string; expectedImprovement?: string;
    };
    if (!agentId || !description) {
      sendBadRequest(res, "agentId and description are required");
      return;
    }
    if (!REGISTERED_AGENT_IDS.has(agentId)) {
      sendBadRequest(res, `Unknown agent: ${agentId}`);
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

router.patch("/control-tower/evolve/propose/:proposalId", requireRole("super_admin", "ops", "exec"), validateBody(jsonObjectBodySchema), (req: Request, res: Response) => {
  try {
    const { proposalId } = req.params as Record<string, string>;
    const { status } = req.body as { status?: "applied" | "rejected" };
    if (!status) {
      sendBadRequest(res, "status is required");
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
      sendNotFound(res, "Proposal");
      return;
    }
    sendSuccess(res, { proposalId, status, updatedAt: new Date().toISOString() });
  } catch (err) {
    handleRouteError(res, err, "control-tower/evolve/propose/:proposalId");
  }
});

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


export function register(r: IRouter): void { r.use(router); }
