/**
 * Decision Fabric API
 *
 * Routes (mounted under /decision-fabric):
 *   POST  /correlations/link
 *   GET   /workflows/:runId/360
 *   GET   /entities/:entityType/:entityId/investigation
 *   GET   /recommendations/:recommendationId/trace
 *   GET   /approvals/bottlenecks
 *   GET   /policies/failures
 *   GET   /predictions/drift
 *   POST  /decisions
 *   GET   /decisions
 *   GET   /decisions/:id
 *   POST  /decisions/:id/actual-outcome
 *   POST  /policy-snapshots
 *   POST  /simulation-snapshots
 *   GET   /playbooks
 *   POST  /playbooks/generate
 *   POST  /playbooks/:id/review
 *   GET   /clusters
 *   POST  /learning/run
 */

import { Router, type IRouter, type Request, type Response } from "express";
import { z } from "zod";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { logger } from "../lib/logger";
import {
  linkEvent,
  getWorkflow360,
  investigateEntity,
  traceRecommendation,
  getApprovalBottlenecks,
  getPolicyFailures,
  getPredictionDrift,
  recordDecision,
  recordActualOutcome,
  getDecision,
  listDecisions,
  snapshotPolicy,
  snapshotSimulation,
  generatePlaybookSuggestions,
  listPlaybookSuggestions,
  reviewPlaybookSuggestion,
  getDomainClusterStats,
  runLearningCycle,
} from "@szl-holdings/decision-fabric";

const decisionFabricRouter: IRouter = Router();

decisionFabricRouter.use("/decision-fabric", authMiddleware({ required: true }));

const FABRIC_DOMAIN = z.enum([
  "maritime",
  "security",
  "real_estate",
  "aiops",
  "research",
  "creative",
  "analytics",
  "infrastructure",
  "readiness",
  "general",
  "global",
]);

// ─── Correlation ────────────────────────────────────────────────────────────

const linkSchema = z.object({
  correlationId: z.string().min(1),
  primitive: z.enum([
    "prism_bus",
    "proof_chain",
    "outcome_graph",
    "covenant_policy",
    "workflow_engine",
    "monte_carlo",
    "approval",
    "decision_record",
  ]),
  primitiveId: z.string().min(1),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  workflowRunId: z.string().optional(),
  domain: FABRIC_DOMAIN.optional(),
  metadata: z.record(z.unknown()).optional(),
});

decisionFabricRouter.post("/decision-fabric/correlations/link", async (req: Request, res: Response) => {
  try {
    const parsed = linkSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
    const user = (req as any).user;
    const row = await linkEvent({ ...parsed.data, orgId: user?.orgId ?? null });
    return res.status(201).json({ success: true, data: row });
  } catch (err) {
    logger.error({ err }, "POST /decision-fabric/correlations/link error");
    return res.status(500).json({ error: "Failed to link event" });
  }
});

// ─── Workflow 360 ────────────────────────────────────────────────────────────

decisionFabricRouter.get("/decision-fabric/workflows/:runId/360", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const view = await getWorkflow360(req.params.runId, { orgId: user?.orgId ?? null });
    return res.json({ success: true, data: view });
  } catch (err) {
    logger.error({ err }, "GET /decision-fabric/workflows/:runId/360 error");
    return res.status(500).json({ error: "Failed to assemble workflow 360" });
  }
});

// ─── Entity Investigation ────────────────────────────────────────────────────

decisionFabricRouter.get("/decision-fabric/entities/:entityType/:entityId/investigation", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await investigateEntity(req.params.entityType, req.params.entityId, {
      orgId: user?.orgId ?? null,
    });
    return res.json({ success: true, data: result });
  } catch (err) {
    logger.error({ err }, "GET /decision-fabric/entities/.../investigation error");
    return res.status(500).json({ error: "Failed to investigate entity" });
  }
});

// ─── Traceability ────────────────────────────────────────────────────────────

decisionFabricRouter.get("/decision-fabric/recommendations/:recommendationId/trace", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const trace = await traceRecommendation(req.params.recommendationId, { orgId: user?.orgId ?? null });
    return res.json({ success: true, data: trace });
  } catch (err) {
    logger.error({ err }, "GET /decision-fabric/recommendations/:id/trace error");
    return res.status(500).json({ error: "Failed to trace recommendation" });
  }
});

// ─── Bottlenecks ─────────────────────────────────────────────────────────────

decisionFabricRouter.get("/decision-fabric/approvals/bottlenecks", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const data = await getApprovalBottlenecks({ orgId: user?.orgId ?? null, limit });
    return res.json({ success: true, data });
  } catch (err) {
    logger.error({ err }, "GET /decision-fabric/approvals/bottlenecks error");
    return res.status(500).json({ error: "Failed to fetch bottlenecks" });
  }
});

decisionFabricRouter.get("/decision-fabric/policies/failures", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const data = await getPolicyFailures({ orgId: user?.orgId ?? null, limit });
    return res.json({ success: true, data });
  } catch (err) {
    logger.error({ err }, "GET /decision-fabric/policies/failures error");
    return res.status(500).json({ error: "Failed to fetch policy failures" });
  }
});

decisionFabricRouter.get("/decision-fabric/predictions/drift", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const data = await getPredictionDrift({ orgId: user?.orgId ?? null, limit });
    return res.json({ success: true, data });
  } catch (err) {
    logger.error({ err }, "GET /decision-fabric/predictions/drift error");
    return res.status(500).json({ error: "Failed to fetch prediction drift" });
  }
});

// ─── Decision Records ────────────────────────────────────────────────────────

const recordDecisionSchema = z.object({
  domain: FABRIC_DOMAIN.optional(),
  entityType: z.string().min(1),
  entityId: z.string().optional(),
  title: z.string().min(1),
  rationale: z.string().optional(),
  context: z.record(z.unknown()).optional(),
  decidedByRole: z.string().optional(),
  ownerUserId: z.number().int().optional(),
  outcomeGraphId: z.number().int().optional(),
  proofChainId: z.number().int().optional(),
  policyVersionId: z.number().int().optional(),
  simulationSnapshotId: z.number().int().optional(),
  approvalId: z.number().int().optional(),
  workflowRunId: z.string().optional(),
  recommendationId: z.string().optional(),
  predictedOutcome: z.record(z.unknown()).optional(),
  correlationId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  status: z.enum(["draft", "executed", "rolled_back", "superseded"]).optional(),
});

decisionFabricRouter.post("/decision-fabric/decisions", async (req: Request, res: Response) => {
  try {
    const parsed = recordDecisionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
    const user = (req as any).user;
    const row = await recordDecision({
      ...parsed.data,
      orgId: user?.orgId ?? null,
      decidedByUserId: user?.id ?? null,
    } as any);
    return res.status(201).json({ success: true, data: row });
  } catch (err) {
    logger.error({ err }, "POST /decision-fabric/decisions error");
    return res.status(500).json({ error: "Failed to record decision" });
  }
});

decisionFabricRouter.get("/decision-fabric/decisions", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const data = await listDecisions({
      orgId: user?.orgId ?? null,
      domain: req.query.domain as any,
      entityType: req.query.entityType as string | undefined,
      entityId: req.query.entityId as string | undefined,
      workflowRunId: req.query.workflowRunId as string | undefined,
      recommendationId: req.query.recommendationId as string | undefined,
      correlationId: req.query.correlationId as string | undefined,
      limit,
    });
    return res.json({ success: true, data });
  } catch (err) {
    logger.error({ err }, "GET /decision-fabric/decisions error");
    return res.status(500).json({ error: "Failed to list decisions" });
  }
});

decisionFabricRouter.get("/decision-fabric/decisions/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const user = (req as any).user;
    const row = await getDecision(id, user?.orgId ?? null);
    if (!row) return res.status(404).json({ error: "Not found" });
    return res.json({ success: true, data: row });
  } catch (err) {
    logger.error({ err }, "GET /decision-fabric/decisions/:id error");
    return res.status(500).json({ error: "Failed to get decision" });
  }
});

const actualOutcomeSchema = z.object({
  actualOutcome: z.record(z.unknown()),
  predictionError: z.number().optional(),
  status: z.enum(["draft", "executed", "rolled_back", "superseded"]).optional(),
});

decisionFabricRouter.post("/decision-fabric/decisions/:id/actual-outcome", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const parsed = actualOutcomeSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
    const user = (req as any).user;
    const row = await recordActualOutcome({ decisionId: id, orgId: user?.orgId ?? null, ...parsed.data });
    if (!row) return res.status(404).json({ error: "Not found" });
    return res.json({ success: true, data: row });
  } catch (err) {
    logger.error({ err }, "POST /decision-fabric/decisions/:id/actual-outcome error");
    return res.status(500).json({ error: "Failed to record actual outcome" });
  }
});

// ─── Snapshots ───────────────────────────────────────────────────────────────

const policySnapshotSchema = z.object({
  policyId: z.string().min(1),
  version: z.string().min(1),
  policyName: z.string().min(1),
  effect: z.enum(["allow", "deny"]),
  body: z.record(z.unknown()),
});

decisionFabricRouter.post("/decision-fabric/policy-snapshots", async (req: Request, res: Response) => {
  try {
    const parsed = policySnapshotSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
    const user = (req as any).user;
    const row = await snapshotPolicy({
      ...parsed.data,
      orgId: user?.orgId ?? null,
      authoredByUserId: user?.id ?? null,
    });
    return res.status(201).json({ success: true, data: row });
  } catch (err) {
    logger.error({ err }, "POST /decision-fabric/policy-snapshots error");
    return res.status(500).json({ error: "Failed to snapshot policy" });
  }
});

const simulationSnapshotSchema = z.object({
  domain: FABRIC_DOMAIN.optional(),
  scenarioId: z.string().min(1),
  scenarioName: z.string().min(1),
  inputs: z.record(z.unknown()).optional(),
  parameters: z.record(z.unknown()).optional(),
  results: z.record(z.unknown()).optional(),
  confidenceInterval: z.record(z.unknown()).optional(),
  iterations: z.number().int().optional(),
  seed: z.string().optional(),
});

decisionFabricRouter.post("/decision-fabric/simulation-snapshots", async (req: Request, res: Response) => {
  try {
    const parsed = simulationSnapshotSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
    const user = (req as any).user;
    const row = await snapshotSimulation({ ...parsed.data, orgId: user?.orgId ?? null });
    return res.status(201).json({ success: true, data: row });
  } catch (err) {
    logger.error({ err }, "POST /decision-fabric/simulation-snapshots error");
    return res.status(500).json({ error: "Failed to snapshot simulation" });
  }
});

// ─── Playbooks ───────────────────────────────────────────────────────────────

decisionFabricRouter.get("/decision-fabric/playbooks", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const data = await listPlaybookSuggestions({
      orgId: user?.orgId ?? null,
      status: req.query.status as any,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    return res.json({ success: true, data });
  } catch (err) {
    logger.error({ err }, "GET /decision-fabric/playbooks error");
    return res.status(500).json({ error: "Failed to list playbooks" });
  }
});

decisionFabricRouter.post("/decision-fabric/playbooks/generate", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const data = await generatePlaybookSuggestions({
      orgId: user?.orgId ?? null,
      domain: req.body?.domain,
      windowDays: req.body?.windowDays,
      minSampleSize: req.body?.minSampleSize,
      minSuccessRate: req.body?.minSuccessRate,
    });
    return res.status(201).json({ success: true, data });
  } catch (err) {
    logger.error({ err }, "POST /decision-fabric/playbooks/generate error");
    return res.status(500).json({ error: "Failed to generate playbooks" });
  }
});

const reviewPlaybookSchema = z.object({
  status: z.enum(["proposed", "accepted", "rejected", "promoted_to_workflow"]),
  promotedWorkflowId: z.string().optional(),
});

decisionFabricRouter.post("/decision-fabric/playbooks/:id/review", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const parsed = reviewPlaybookSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
    const user = (req as any).user;
    if (!user?.id) return res.status(401).json({ error: "User required" });
    const row = await reviewPlaybookSuggestion(id, parsed.data.status, user.id, user?.orgId ?? null, parsed.data.promotedWorkflowId);
    if (!row) return res.status(404).json({ error: "Not found" });
    return res.json({ success: true, data: row });
  } catch (err) {
    logger.error({ err }, "POST /decision-fabric/playbooks/:id/review error");
    return res.status(500).json({ error: "Failed to review playbook" });
  }
});

decisionFabricRouter.get("/decision-fabric/clusters", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const data = await getDomainClusterStats({
      orgId: user?.orgId ?? null,
      domain: req.query.domain as any,
      windowDays: req.query.windowDays ? Number(req.query.windowDays) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    return res.json({ success: true, data });
  } catch (err) {
    logger.error({ err }, "GET /decision-fabric/clusters error");
    return res.status(500).json({ error: "Failed to fetch cluster stats" });
  }
});

// ─── Learning Loop ───────────────────────────────────────────────────────────

decisionFabricRouter.post("/decision-fabric/learning/run", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await runLearningCycle({
      orgId: user?.orgId ?? null,
      windowDays: req.body?.windowDays,
      triggeredBy: user?.email ?? "decision-fabric-api",
    });
    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    logger.error({ err }, "POST /decision-fabric/learning/run error");
    return res.status(500).json({ error: "Failed to run learning cycle" });
  }
});

export default decisionFabricRouter;
