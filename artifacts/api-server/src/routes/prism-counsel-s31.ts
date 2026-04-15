import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { tenantScope } from "../middlewares/tenant-scope";
import { modelRouter } from "../services/prism-model-router";
import { hfGateway } from "../services/prism-hf-gateway";
import { worldlineEngine } from "../services/prism-worldline";
import { pressureGraph } from "../services/prism-pressure-graph";
import { proofChain } from "../services/prism-proof-chain";
import { matterTwin } from "../services/prism-matter-twin";
import { copilotWorkbench } from "../services/prism-copilot-workbench";
import { db } from "@szl-holdings/db";
import { pcModelLanesTable, pcCostTrackingTable, pcForecastDiffsTable, pcM365SubscriptionsTable, pcM365DeltaCursorsTable } from "@szl-holdings/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { logger } from "../lib/logger";

const router: Router = Router();

router.use(authMiddleware());
router.use(tenantScope({ required: true }));

const ModelRouteSchema = z.object({
  lane: z.enum(["embedding", "retrieval", "classification", "extraction", "reasoning", "forecast", "policy_guardrail"]),
  taskType: z.string().min(1).max(100),
  input: z.unknown(),
  matterId: z.number().int().positive().optional(),
});

const ModelLaneCreateSchema = z.object({
  lane: z.enum(["embedding", "retrieval", "classification", "extraction", "reasoning", "forecast", "policy_guardrail"]),
  provider: z.string().min(1).max(200),
  modelName: z.string().min(1).max(200),
  modelVersion: z.string().max(100).optional(),
  endpoint: z.string().url().max(500).optional(),
  status: z.enum(["active", "degraded", "disabled", "failover"]).default("active"),
  priority: z.number().int().min(1).max(100).default(1),
  config: z.record(z.unknown()).optional(),
  maxRps: z.number().int().min(1).max(10000).optional(),
  timeoutMs: z.number().int().min(100).max(300000).optional(),
  costPerRequest: z.string().regex(/^\d+(\.\d{1,6})?$/).optional(),
});

const HfEndpointCreateSchema = z.object({
  name: z.string().min(1).max(200),
  task: z.string().min(1).max(100),
  endpointUrl: z.string().url().max(500),
  modelId: z.string().max(200).optional(),
  authToken: z.string().max(500).optional(),
  config: z.record(z.unknown()).optional(),
});

const HfExecuteSchema = z.object({
  task: z.string().min(1).max(100),
  input: z.unknown(),
  endpointId: z.number().int().positive().optional(),
});

const MatterTwinSnapshotSchema = z.object({
  type: z.enum(["daily", "weekly", "manual", "on_change"]).optional(),
});

const CopilotSessionSchema = z.object({
  mode: z.enum(["matter", "communications", "document", "strategy", "ops"]),
  matterId: z.number().int().positive().optional(),
});

const CopilotMessageSchema = z.object({
  content: z.string().min(1).max(10000),
});

const ProofChainStateSchema = z.object({
  state: z.string().min(1).max(100),
});

function getOrgId(req: Request): number {
  const orgId = req.tenantOrgId ?? req.user?.orgs[0]?.orgId;
  if (!orgId) throw Object.assign(new Error("Organization context required"), { statusCode: 403 });
  return orgId;
}

router.get("/model-mesh/lanes", async (req: Request, res: Response) => {
  try {
    const lanes = await modelRouter.getLaneHealth(getOrgId(req));
    res.json({ lanes, defaults: ["embedding", "retrieval", "classification", "extraction", "reasoning", "forecast", "policy_guardrail"] });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/model-mesh/stats", async (req: Request, res: Response) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const stats = await modelRouter.getRequestStats(getOrgId(req), hours);
    res.json({ stats, period: `${hours}h` });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/model-mesh/route", async (req: Request, res: Response) => {
  try {
    const parsed = ModelRouteSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid request body", issues: parsed.error.issues }); return; }
    const { lane, taskType, input, matterId } = parsed.data;
    const result = await modelRouter.route({ orgId: getOrgId(req), lane, taskType, input, matterId });
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/model-mesh/lanes", requireRole("super_admin", "admin"), async (req: Request, res: Response) => {
  try {
    const parsed = ModelLaneCreateSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid request body", issues: parsed.error.issues }); return; }
    const [lane] = await db.insert(pcModelLanesTable).values({ ...parsed.data, orgId: getOrgId(req) }).returning();
    res.json(lane);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/hf-gateway/endpoints", async (req: Request, res: Response) => {
  try {
    const endpoints = await hfGateway.getEndpointHealth(getOrgId(req));
    res.json({ endpoints });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/hf-gateway/endpoints", requireRole("super_admin", "admin"), async (req: Request, res: Response) => {
  try {
    const parsed = HfEndpointCreateSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid request body", issues: parsed.error.issues }); return; }
    const ep = await hfGateway.registerEndpoint({ ...parsed.data, orgId: getOrgId(req) });
    res.json(ep);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/hf-gateway/execute", async (req: Request, res: Response) => {
  try {
    const parsed = HfExecuteSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid request body", issues: parsed.error.issues }); return; }
    const { task, input, endpointId } = parsed.data;
    const result = await hfGateway.execute({ orgId: getOrgId(req), task, input, options: { endpointId } });
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/worldline/sources", async (req: Request, res: Response) => {
  try {
    const sources = await worldlineEngine.getSources(getOrgId(req));
    res.json({ sources });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/worldline/initialize", async (req: Request, res: Response) => {
  try {
    await worldlineEngine.initializeDefaultSources(getOrgId(req));
    const sources = await worldlineEngine.getSources(getOrgId(req));
    res.json({ initialized: true, sources });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/worldline/fetch/:sourceId", async (req: Request, res: Response) => {
  try {
    const count = await worldlineEngine.fetchSource(getOrgId(req), parseInt(req.params.sourceId as string));
    res.json({ fetched: count });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/worldline/signals", async (req: Request, res: Response) => {
  try {
    const signals = await worldlineEngine.getSignals(getOrgId(req), {
      sourceClass: req.query.sourceClass as string,
      limit: parseInt(req.query.limit as string) || 100,
    });
    res.json({ signals });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/worldline/features/:matterId", async (req: Request, res: Response) => {
  try {
    const features = await worldlineEngine.getFeatures(getOrgId(req), parseInt(req.params.matterId as string));
    res.json({ features });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/pressure-graph/:matterId", async (req: Request, res: Response) => {
  try {
    const pressure = await pressureGraph.getMatterPressure(getOrgId(req), parseInt(req.params.matterId as string));
    res.json({ matterId: parseInt(req.params.matterId as string), dimensions: pressure });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/pressure-graph/:matterId/compute", async (req: Request, res: Response) => {
  try {
    const matterId = parseInt(req.params.matterId as string);
    await pressureGraph.computeAllDimensions({ orgId: getOrgId(req), matterId });
    await pressureGraph.computeDataProducts(getOrgId(req), matterId);
    const pressure = await pressureGraph.getMatterPressure(getOrgId(req), matterId);
    res.json({ computed: true, dimensions: pressure });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/data-products/:matterId", async (req: Request, res: Response) => {
  try {
    const products = await pressureGraph.getMatterDataProducts(getOrgId(req), parseInt(req.params.matterId as string));
    res.json({ matterId: parseInt(req.params.matterId as string), products });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/proof-chain/matter/:matterId", async (req: Request, res: Response) => {
  try {
    const chain = await proofChain.getMatterChain(getOrgId(req), parseInt(req.params.matterId as string));
    res.json({ chain });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/proof-chain/:id/trace", async (req: Request, res: Response) => {
  try {
    const trace = await proofChain.getTrace(getOrgId(req), parseInt(req.params.id as string));
    if (!trace) { res.status(404).json({ error: "Proof chain entry not found" }); return; }
    res.json({ trace });
  } catch (e: any) {
    res.status(e.statusCode ?? 500).json({ error: e.message });
  }
});

router.get("/proof-chain/:id/verify", async (req: Request, res: Response) => {
  try {
    const result = await proofChain.verifyIntegrity(getOrgId(req), parseInt(req.params.id as string));
    res.json(result);
  } catch (e: any) {
    res.status(e.statusCode ?? 500).json({ error: e.message });
  }
});

router.post("/proof-chain/:id/review", requireRole("super_admin", "admin", "compliance"), async (req: Request, res: Response) => {
  try {
    const parsed = ProofChainStateSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid request body", issues: parsed.error.issues }); return; }
    const actorId = req.user!.id;
    await proofChain.setReviewState(getOrgId(req), parseInt(req.params.id as string), parsed.data.state, actorId);
    res.json({ updated: true });
  } catch (e: any) {
    res.status(e.statusCode ?? 500).json({ error: e.message });
  }
});

router.post("/proof-chain/:id/approve", requireRole("super_admin", "admin"), async (req: Request, res: Response) => {
  try {
    const parsed = ProofChainStateSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid request body", issues: parsed.error.issues }); return; }
    const actorId = req.user!.id;
    await proofChain.setApprovalState(getOrgId(req), parseInt(req.params.id as string), parsed.data.state, actorId);
    res.json({ updated: true });
  } catch (e: any) {
    res.status(e.statusCode ?? 500).json({ error: e.message });
  }
});

router.get("/proof-chain/pending-reviews", async (req: Request, res: Response) => {
  try {
    const pending = await proofChain.getPendingReviews(getOrgId(req));
    res.json({ pending });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/proof-chain/audit-packet/:matterId", async (req: Request, res: Response) => {
  try {
    const packet = await proofChain.generateAuditPacket(getOrgId(req), parseInt(req.params.matterId as string));
    res.json(packet);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/matter-twin/:matterId", async (req: Request, res: Response) => {
  try {
    const snapshot = await matterTwin.getLatestSnapshot(getOrgId(req), parseInt(req.params.matterId as string));
    res.json({ snapshot });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/matter-twin/:matterId/snapshot", async (req: Request, res: Response) => {
  try {
    const parsed = MatterTwinSnapshotSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid request body", issues: parsed.error.issues }); return; }
    const snapshot = await matterTwin.buildSnapshot(getOrgId(req), parseInt(req.params.matterId as string), parsed.data.type ?? "manual");
    res.json({ snapshot });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/matter-twin/:matterId/history", async (req: Request, res: Response) => {
  try {
    const history = await matterTwin.getSnapshotHistory(getOrgId(req), parseInt(req.params.matterId as string));
    res.json({ history });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/forecast-diff/:matterId", async (req: Request, res: Response) => {
  try {
    const diffs = await db.select().from(pcForecastDiffsTable)
      .where(and(eq(pcForecastDiffsTable.orgId, getOrgId(req)), eq(pcForecastDiffsTable.matterId, parseInt(req.params.matterId as string))))
      .orderBy(desc(pcForecastDiffsTable.createdAt)).limit(20);
    res.json({ diffs });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/copilot/sessions", async (req: Request, res: Response) => {
  try {
    const parsed = CopilotSessionSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid request body", issues: parsed.error.issues }); return; }
    const { mode, matterId } = parsed.data;
    const session = await copilotWorkbench.createSession(getOrgId(req), req.user!.id, mode, matterId);
    res.json(session);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/copilot/sessions", async (req: Request, res: Response) => {
  try {
    const sessions = await copilotWorkbench.getUserSessions(getOrgId(req), req.user!.id);
    res.json({ sessions });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/copilot/sessions/:sessionId/message", async (req: Request, res: Response) => {
  try {
    const parsed = CopilotMessageSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid request body", issues: parsed.error.issues }); return; }
    const result = await copilotWorkbench.sendMessage(getOrgId(req), req.user!.id, parseInt(req.params.sessionId as string), parsed.data.content);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/copilot/sessions/:sessionId/history", async (req: Request, res: Response) => {
  try {
    const messages = await copilotWorkbench.getSessionHistory(getOrgId(req), req.user!.id, parseInt(req.params.sessionId as string));
    res.json({ messages });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/copilot/templates", async (req: Request, res: Response) => {
  try {
    const templates = await copilotWorkbench.getPromptTemplates();
    res.json({ templates });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/m365/subscriptions", async (req: Request, res: Response) => {
  try {
    const subs = await db.select().from(pcM365SubscriptionsTable).where(eq(pcM365SubscriptionsTable.orgId, getOrgId(req)));
    res.json({ subscriptions: subs });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/m365/delta-cursors", async (req: Request, res: Response) => {
  try {
    const cursors = await db.select().from(pcM365DeltaCursorsTable).where(eq(pcM365DeltaCursorsTable.orgId, getOrgId(req)));
    res.json({ cursors });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/costs/summary", async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const since = new Date(Date.now() - days * 86400000);
    const costs = await db.select().from(pcCostTrackingTable)
      .where(and(eq(pcCostTrackingTable.orgId, getOrgId(req)), sql`${pcCostTrackingTable.createdAt} >= ${since}`))
      .orderBy(desc(pcCostTrackingTable.createdAt))
      .limit(500);

    const byCategory: Record<string, number> = {};
    const byWorkflow: Record<string, number> = {};
    let total = 0;
    for (const c of costs) {
      const amount = parseFloat(c.amount);
      byCategory[c.costCategory] = (byCategory[c.costCategory] ?? 0) + amount;
      byWorkflow[c.workflow] = (byWorkflow[c.workflow] ?? 0) + amount;
      total += amount;
    }

    res.json({ total, byCategory, byWorkflow, period: `${days}d`, entries: costs.length });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/admin/overview", requireRole("super_admin", "admin"), async (req: Request, res: Response) => {
  try {
    const [lanes, hfEndpoints, wlSources, m365Subs] = await Promise.all([
      modelRouter.getLaneHealth(getOrgId(req)),
      hfGateway.getEndpointHealth(getOrgId(req)),
      worldlineEngine.getSources(getOrgId(req)),
      db.select().from(pcM365SubscriptionsTable).where(eq(pcM365SubscriptionsTable.orgId, getOrgId(req))),
    ]);

    res.json({
      modelMesh: { lanes: lanes.length, activeLanes: lanes.filter((l: any) => l.status === "active").length },
      hfGateway: { endpoints: hfEndpoints.length, healthy: hfEndpoints.filter(e => e.status === "healthy").length },
      worldline: { sources: wlSources.length, active: wlSources.filter(s => s.status === "active").length },
      m365: { subscriptions: m365Subs.length, active: m365Subs.filter(s => s.status === "active").length },
      subsystems: [
        { name: "Model Mesh", status: "operational", lanes: 7 },
        { name: "HF Gateway", status: "operational", endpoints: hfEndpoints.length },
        { name: "Worldline Engine", status: "operational", sources: wlSources.length },
        { name: "Pressure Graph", status: "operational", dimensions: 12 },
        { name: "Proof Chain", status: "operational" },
        { name: "Matter Twin", status: "operational" },
        { name: "Copilot Workbench", status: "operational", modes: 5 },
        { name: "Forecast Diff", status: "operational" },
        { name: "M365 Integration", status: "pending_config" },
        { name: "Cost Tracking", status: "operational" },
      ],
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
