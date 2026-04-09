import { Router, type Request, type Response } from "express";
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
const ORG_ID = 1;

router.get("/model-mesh/lanes", async (_req: Request, res: Response) => {
  try {
    const lanes = await modelRouter.getLaneHealth(ORG_ID);
    res.json({ lanes, defaults: ["embedding", "retrieval", "classification", "extraction", "reasoning", "forecast", "policy_guardrail"] });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/model-mesh/stats", async (req: Request, res: Response) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const stats = await modelRouter.getRequestStats(ORG_ID, hours);
    res.json({ stats, period: `${hours}h` });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/model-mesh/route", async (req: Request, res: Response) => {
  try {
    const { lane, taskType, input, matterId } = req.body;
    const result = await modelRouter.route({ orgId: ORG_ID, lane, taskType, input, matterId });
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/model-mesh/lanes", async (req: Request, res: Response) => {
  try {
    const [lane] = await db.insert(pcModelLanesTable).values({ orgId: ORG_ID, ...req.body }).returning();
    res.json(lane);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/hf-gateway/endpoints", async (_req: Request, res: Response) => {
  try {
    const endpoints = await hfGateway.getEndpointHealth(ORG_ID);
    res.json({ endpoints });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/hf-gateway/endpoints", async (req: Request, res: Response) => {
  try {
    const ep = await hfGateway.registerEndpoint({ orgId: ORG_ID, ...req.body });
    res.json(ep);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/hf-gateway/execute", async (req: Request, res: Response) => {
  try {
    const { task, input, endpointId } = req.body;
    const result = await hfGateway.execute({ orgId: ORG_ID, task, input, options: { endpointId } });
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/worldline/sources", async (_req: Request, res: Response) => {
  try {
    const sources = await worldlineEngine.getSources(ORG_ID);
    res.json({ sources });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/worldline/initialize", async (_req: Request, res: Response) => {
  try {
    await worldlineEngine.initializeDefaultSources(ORG_ID);
    const sources = await worldlineEngine.getSources(ORG_ID);
    res.json({ initialized: true, sources });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/worldline/fetch/:sourceId", async (req: Request, res: Response) => {
  try {
    const count = await worldlineEngine.fetchSource(ORG_ID, parseInt(String(req.params.sourceId ?? "0"), 10));
    res.json({ fetched: count });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/worldline/signals", async (req: Request, res: Response) => {
  try {
    const signals = await worldlineEngine.getSignals(ORG_ID, {
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
    const features = await worldlineEngine.getFeatures(ORG_ID, parseInt(String(req.params.matterId ?? "0"), 10));
    res.json({ features });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/pressure-graph/:matterId", async (req: Request, res: Response) => {
  try {
    const pressure = await pressureGraph.getMatterPressure(ORG_ID, parseInt(String(req.params.matterId ?? "0"), 10));
    res.json({ matterId: parseInt(String(req.params.matterId ?? "0"), 10), dimensions: pressure });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/pressure-graph/:matterId/compute", async (req: Request, res: Response) => {
  try {
    const matterId = parseInt(String(req.params.matterId ?? "0"), 10);
    await pressureGraph.computeAllDimensions({ orgId: ORG_ID, matterId });
    await pressureGraph.computeDataProducts(ORG_ID, matterId);
    const pressure = await pressureGraph.getMatterPressure(ORG_ID, matterId);
    res.json({ computed: true, dimensions: pressure });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/data-products/:matterId", async (req: Request, res: Response) => {
  try {
    const products = await pressureGraph.getMatterDataProducts(ORG_ID, parseInt(String(req.params.matterId ?? "0"), 10));
    res.json({ matterId: parseInt(String(req.params.matterId ?? "0"), 10), products });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/proof-chain/matter/:matterId", async (req: Request, res: Response) => {
  try {
    const chain = await proofChain.getMatterChain(ORG_ID, parseInt(String(req.params.matterId ?? "0"), 10));
    res.json({ chain });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/proof-chain/:id/trace", async (req: Request, res: Response) => {
  try {
    const trace = await proofChain.getTrace(parseInt(String(req.params.id ?? "0"), 10));
    res.json({ trace });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/proof-chain/:id/verify", async (req: Request, res: Response) => {
  try {
    const result = await proofChain.verifyIntegrity(parseInt(String(req.params.id ?? "0"), 10));
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/proof-chain/:id/review", async (req: Request, res: Response) => {
  try {
    await proofChain.setReviewState(parseInt(String(req.params.id ?? "0"), 10), req.body.state, req.body.reviewerId ?? 1);
    res.json({ updated: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/proof-chain/:id/approve", async (req: Request, res: Response) => {
  try {
    await proofChain.setApprovalState(parseInt(String(req.params.id ?? "0"), 10), req.body.state, req.body.approverId ?? 1);
    res.json({ updated: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/proof-chain/pending-reviews", async (_req: Request, res: Response) => {
  try {
    const pending = await proofChain.getPendingReviews(ORG_ID);
    res.json({ pending });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/proof-chain/audit-packet/:matterId", async (req: Request, res: Response) => {
  try {
    const packet = await proofChain.generateAuditPacket(ORG_ID, parseInt(String(req.params.matterId ?? "0"), 10));
    res.json(packet);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/matter-twin/:matterId", async (req: Request, res: Response) => {
  try {
    const snapshot = await matterTwin.getLatestSnapshot(ORG_ID, parseInt(String(req.params.matterId ?? "0"), 10));
    res.json({ snapshot });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/matter-twin/:matterId/snapshot", async (req: Request, res: Response) => {
  try {
    const snapshot = await matterTwin.buildSnapshot(ORG_ID, parseInt(String(req.params.matterId ?? "0"), 10), req.body.type ?? "manual");
    res.json({ snapshot });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/matter-twin/:matterId/history", async (req: Request, res: Response) => {
  try {
    const history = await matterTwin.getSnapshotHistory(ORG_ID, parseInt(String(req.params.matterId ?? "0"), 10));
    res.json({ history });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/forecast-diff/:matterId", async (req: Request, res: Response) => {
  try {
    const diffs = await db.select().from(pcForecastDiffsTable)
      .where(and(eq(pcForecastDiffsTable.orgId, ORG_ID), eq(pcForecastDiffsTable.matterId, parseInt(String(req.params.matterId ?? "0"), 10))))
      .orderBy(desc(pcForecastDiffsTable.createdAt)).limit(20);
    res.json({ diffs });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/copilot/sessions", async (req: Request, res: Response) => {
  try {
    const { mode, matterId } = req.body;
    const session = await copilotWorkbench.createSession(ORG_ID, 1, mode, matterId);
    res.json(session);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/copilot/sessions", async (_req: Request, res: Response) => {
  try {
    const sessions = await copilotWorkbench.getUserSessions(ORG_ID, 1);
    res.json({ sessions });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/copilot/sessions/:sessionId/message", async (req: Request, res: Response) => {
  try {
    const result = await copilotWorkbench.sendMessage(parseInt(String(req.params.sessionId ?? "0"), 10), req.body.content, 1);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/copilot/sessions/:sessionId/history", async (req: Request, res: Response) => {
  try {
    const messages = await copilotWorkbench.getSessionHistory(parseInt(String(req.params.sessionId ?? "0"), 10));
    res.json({ messages });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/copilot/templates", async (_req: Request, res: Response) => {
  try {
    const templates = await copilotWorkbench.getPromptTemplates();
    res.json({ templates });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/m365/subscriptions", async (_req: Request, res: Response) => {
  try {
    const subs = await db.select().from(pcM365SubscriptionsTable).where(eq(pcM365SubscriptionsTable.orgId, ORG_ID));
    res.json({ subscriptions: subs });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/m365/delta-cursors", async (_req: Request, res: Response) => {
  try {
    const cursors = await db.select().from(pcM365DeltaCursorsTable).where(eq(pcM365DeltaCursorsTable.orgId, ORG_ID));
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
      .where(and(eq(pcCostTrackingTable.orgId, ORG_ID), sql`${pcCostTrackingTable.createdAt} >= ${since}`))
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

router.get("/admin/overview", async (_req: Request, res: Response) => {
  try {
    const [lanes, hfEndpoints, wlSources, m365Subs] = await Promise.all([
      modelRouter.getLaneHealth(ORG_ID),
      hfGateway.getEndpointHealth(ORG_ID),
      worldlineEngine.getSources(ORG_ID),
      db.select().from(pcM365SubscriptionsTable).where(eq(pcM365SubscriptionsTable.orgId, ORG_ID)),
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
