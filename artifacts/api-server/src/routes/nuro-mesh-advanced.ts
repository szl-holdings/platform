/**
 * Nuro Mesh Advanced Capabilities API Routes
 *
 * Endpoints for:
 *   - Agent Kernel audit trail and integrity verification
 *   - Self-improving data flywheel (trajectories, golden runs, feedback)
 *   - AgentOps behavioral observability (traces, judge evaluations)
 *   - Cost budget management (estimates, analytics, budget config)
 *   - RL Memory management (stats, operations)
 */

import { Router, type Request, type Response } from "express";
import { authMiddleware } from "../middlewares/auth";
import { tenantScope } from "../middlewares/tenant-scope";
import {
  getKernelAuditTrail,
  verifyAuditChainIntegrity,
  issueScopeCertificate,
} from "@szl-holdings/ai-engine";
import { trajectoryStore } from "@szl-holdings/ai-engine";
import { behavioralTracer } from "@szl-holdings/ai-engine";
import { budgetManager, MODEL_PRICING } from "@szl-holdings/ai-engine";
import { rlMemoryManager } from "@szl-holdings/ai-engine";

const router = Router();

router.use(authMiddleware());
router.use(tenantScope({ required: true }));

function getOrgId(req: Request): number {
  if (req.user?.roles.includes("super_admin") && req.headers["x-org-id"]) {
    const headerOrgId = parseInt(String(req.headers["x-org-id"]), 10);
    if (!isNaN(headerOrgId) && headerOrgId > 0) return headerOrgId;
  }
  const orgId = req.tenantOrgId ?? req.user?.orgs[0]?.orgId;
  if (!orgId) throw Object.assign(new Error("Organization context required"), { statusCode: 403 });
  return orgId;
}

router.get("/nuro-mesh/kernel/audit-trail", (req: Request, res: Response) => {
  const limit = Math.min(500, parseInt(String(req.query.limit ?? "50"), 10));
  const all = getKernelAuditTrail();
  res.json({
    entries: all.slice(-limit).reverse(),
    total: all.length,
    limit,
  });
});

router.get("/nuro-mesh/kernel/verify-integrity", (_req: Request, res: Response) => {
  const result = verifyAuditChainIntegrity();
  res.json({
    ...result,
    totalEntries: getKernelAuditTrail().length,
    verifiedAt: new Date().toISOString(),
  });
});

router.post("/nuro-mesh/kernel/scope-certificate", (req: Request, res: Response) => {
  const { agentId, allowedTools, maxRiskLevel, ttlMs } = req.body as {
    agentId?: string;
    allowedTools?: string[];
    maxRiskLevel?: "low" | "medium" | "high" | "critical";
    ttlMs?: number;
  };

  if (!agentId || !allowedTools) {
    res.status(400).json({ error: "agentId and allowedTools are required" });
    return;
  }

  const cert = issueScopeCertificate(agentId, allowedTools, maxRiskLevel ?? "medium", ttlMs ?? 3600000);
  res.json({ certificate: cert, issuedAt: cert.issuedAt, expiresAt: cert.expiresAt });
});

router.get("/nuro-mesh/flywheel/trajectories", (req: Request, res: Response) => {
  const limit = Math.min(200, parseInt(String(req.query.limit ?? "50"), 10));
  const status = req.query.status as string | undefined;
  const trajectories = trajectoryStore.getTrajectories(limit, status as Parameters<typeof trajectoryStore.getTrajectories>[1]);
  res.json({ trajectories, total: trajectories.length, limit });
});

router.get("/nuro-mesh/flywheel/golden-runs", (req: Request, res: Response) => {
  const limit = Math.min(50, parseInt(String(req.query.limit ?? "20"), 10));
  const runs = trajectoryStore.getGoldenRuns(limit);
  res.json({ goldenRuns: runs, total: runs.length });
});

router.get("/nuro-mesh/flywheel/stats", (_req: Request, res: Response) => {
  res.json(trajectoryStore.getStats());
});

router.post("/nuro-mesh/flywheel/feedback", (req: Request, res: Response) => {
  const { trajectoryId, score } = req.body as { trajectoryId?: string; score?: number };
  if (!trajectoryId || typeof score !== "number") {
    res.status(400).json({ error: "trajectoryId and score (number -1 to 1) are required" });
    return;
  }
  const success = trajectoryStore.addUserFeedback(trajectoryId, score);
  if (!success) {
    res.status(404).json({ error: "Trajectory not found", trajectoryId });
    return;
  }
  res.json({ success: true, trajectoryId, score });
});

router.get("/nuro-mesh/observability/traces", (req: Request, res: Response) => {
  const limit = Math.min(100, parseInt(String(req.query.limit ?? "20"), 10));
  const traces = behavioralTracer.getRecentTraces(limit, getOrgId(req));
  res.json({ traces, total: traces.length });
});

router.get("/nuro-mesh/observability/traces/:traceId", (req: Request, res: Response) => {
  const trace = behavioralTracer.getTrace(req.params.traceId as string);
  if (!trace) {
    res.status(404).json({ error: "Trace not found", traceId: req.params.traceId });
    return;
  }
  res.json(trace);
});

router.get("/nuro-mesh/observability/stats", (req: Request, res: Response) => {
  res.json(behavioralTracer.getObservabilityStats(getOrgId(req)));
});

router.get("/nuro-mesh/cost/estimate", (req: Request, res: Response) => {
  const { query, agents, workflowId } = req.query as {
    query?: string;
    agents?: string;
    workflowId?: string;
  };

  if (!query) {
    res.status(400).json({ error: "query parameter is required" });
    return;
  }

  const agentList = agents ? agents.split(",").map(a => ({ agentId: a.trim(), model: "gpt-5.2" })) : [{ agentId: "alloy", model: "gpt-5.2" }];
  const estimate = budgetManager.estimateRunCost(query, agentList, workflowId ?? "default", getOrgId(req));
  res.json(estimate);
});

router.get("/nuro-mesh/cost/analytics", (req: Request, res: Response) => {
  const limit = Math.min(500, parseInt(String(req.query.limit ?? "100"), 10));
  const analytics = budgetManager.getSpendAnalytics(getOrgId(req), limit);
  res.json({
    ...analytics,
    modelPricing: MODEL_PRICING,
    budgetStatuses: budgetManager.getAllBudgetStatuses(),
  });
});

router.get("/nuro-mesh/cost/budget/:workflowId", (req: Request, res: Response) => {
  const status = budgetManager.getBudgetStatus(req.params.workflowId as string, getOrgId(req));
  res.json({ workflowId: req.params.workflowId, ...status });
});

router.post("/nuro-mesh/cost/budget", (req: Request, res: Response) => {
  const { workflowId, budgetUsd, warningThreshold, hardCapThreshold, allowModelDowngrade } = req.body as {
    workflowId?: string;
    budgetUsd?: number;
    warningThreshold?: number;
    hardCapThreshold?: number;
    allowModelDowngrade?: boolean;
  };

  if (!workflowId || !budgetUsd) {
    res.status(400).json({ error: "workflowId and budgetUsd are required" });
    return;
  }

  budgetManager.configureBudget({
    workflowId,
    orgId: getOrgId(req),
    budgetUsd,
    warningThreshold: warningThreshold ?? 0.8,
    hardCapThreshold: hardCapThreshold ?? 1.0,
    allowModelDowngrade: allowModelDowngrade ?? true,
  });

  res.json({ success: true, workflowId, budgetUsd, message: "Budget configured" });
});

router.get("/nuro-mesh/memory/stats/:agentId", (req: Request, res: Response) => {
  const stats = rlMemoryManager.getMemoryStats(req.params.agentId as string);
  const opLog = rlMemoryManager.getOperationLog().filter(l => l.agentId === req.params.agentId).slice(-20);
  res.json({ agentId: req.params.agentId, ...stats, recentOperations: opLog });
});

router.post("/nuro-mesh/memory/retrieve", async (req: Request, res: Response) => {
  const { agentId, query, tier, maxResults } = req.body as {
    agentId?: string;
    query?: string;
    tier?: string;
    maxResults?: number;
  };

  if (!agentId || !query) {
    res.status(400).json({ error: "agentId and query are required" });
    return;
  }

  const result = await rlMemoryManager.retrieve(
    agentId,
    query,
    tier as Parameters<typeof rlMemoryManager.retrieve>[2],
    maxResults ?? 5,
  );
  res.json(result);
});

router.post("/nuro-mesh/memory/reward", (req: Request, res: Response) => {
  const { signals } = req.body as { signals?: Array<{ memoryId: string; taskSuccess: boolean; userFeedbackScore: number; confidenceDelta: number; latencyImpactMs: number }> };
  if (!signals || !Array.isArray(signals)) {
    res.status(400).json({ error: "signals array is required" });
    return;
  }
  rlMemoryManager.applyRewardSignal(signals);
  res.json({ success: true, signalsApplied: signals.length });
});

export default router;
