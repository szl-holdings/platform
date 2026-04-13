import { Router, type Request, type Response } from "express";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { logger } from "../lib/logger";
import {
  listSkills, getSkill, updateSkillStatus, setSkillOrgConfig, getSkillOrgConfigs,
  getUserAutonomyLevel, setUserAutonomyLevel, getUserAutonomyPrefs, getSkillsStats,
  getSkillMetrics, listCompositions, getComposition,
  type AutonomyLevel, type SkillStatus,
} from "../lib/mastra/skills-registry";
import { saveSkillComposition } from "../lib/mastra/skill-composition";
import {
  executeSkill, getPendingApprovals, approveSkillExecution, rejectSkillExecution,
} from "../lib/mastra/skill-runtime";
import {
  runComposition, buildCompositionFromTemplate,
} from "../lib/mastra/skill-composition";
import {
  getActivityFeed, getAgentActivityStats, getA2ADelegationChain,
} from "../lib/mastra/agent-activity";
import { mcpGatewayHealth } from "../lib/mastra/mcp-gateway/index";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const skills = await listSkills({
      category: req.query.category ? String(req.query.category) : undefined,
      domain: req.query.domain ? String(req.query.domain) : undefined,
      status: req.query.status ? String(req.query.status) : undefined,
      search: req.query.search ? String(req.query.search) : undefined,
    });
    res.json({ data: skills });
  } catch (err: any) {
    logger.error({ err }, "Failed to list skills");
    res.status(500).json({ error: "Failed to list skills" });
  }
});

router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const stats = await getSkillsStats();
    res.json({ data: stats });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/autonomy/prefs", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = String(user?.id ?? "anonymous");
    const prefs = await getUserAutonomyPrefs(userId);
    res.json({ data: prefs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/autonomy/:skillId", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = String(user?.id ?? "anonymous");
    const skillId = String(req.params.skillId);
    const level = await getUserAutonomyLevel(userId, skillId);
    res.json({ data: { skillId, autonomyLevel: level } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/autonomy/:skillId", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = String(user?.id ?? "anonymous");
    const skillId = String(req.params.skillId);
    const { level, consentGiven } = req.body as { level: AutonomyLevel; consentGiven?: boolean };
    if (!["observer", "advisor", "operator"].includes(level)) {
      res.status(400).json({ error: "Invalid autonomy level — must be observer, advisor, or operator" }); return;
    }
    await setUserAutonomyLevel(userId, skillId, level, consentGiven ?? false);
    res.json({ data: { skillId, userId, level, updated: true } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/approvals/pending", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const isAdmin = user?.roles?.includes("admin") || user?.roles?.includes("super_admin");
    const pending = await getPendingApprovals({
      userId: isAdmin ? (req.query.userId ? String(req.query.userId) : undefined) : String(user?.id ?? ""),
      orgId: req.query.orgId ? String(req.query.orgId) : undefined,
      limit: req.query.limit ? parseInt(String(req.query.limit)) : 20,
    });
    res.json({ data: pending });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/approvals/:actionId/approve", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const actionId = String(req.params.actionId);
    const { notes } = req.body;
    const result = await approveSkillExecution(actionId, String(user?.id ?? "unknown"), notes);
    if (!result.success) { res.status(400).json({ error: result.error }); return; }
    res.json({ data: { approved: true, actionId } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/approvals/:actionId/reject", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const actionId = String(req.params.actionId);
    const { reason } = req.body;
    const result = await rejectSkillExecution(actionId, String(user?.id ?? "unknown"), reason);
    if (!result.success) { res.status(400).json({ error: result.error }); return; }
    res.json({ data: { rejected: true, actionId } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/compositions", async (req: Request, res: Response) => {
  try {
    const orgId = req.query.orgId ? String(req.query.orgId) : undefined;
    const compositions = await listCompositions(orgId);
    res.json({ data: compositions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/compositions/:compositionId", async (req: Request, res: Response) => {
  try {
    const compositionId = String(req.params.compositionId);
    const composition = await getComposition(compositionId);
    if (!composition) { res.status(404).json({ error: "Composition not found" }); return; }
    res.json({ data: composition });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/compositions", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { name, description, steps, approvalGates, orgId, useTemplate } = req.body;

    if (useTemplate) {
      const composition = await buildCompositionFromTemplate(
        useTemplate,
        { name, creatorId: String(user?.id ?? ""), orgId }
      );
      await saveSkillComposition({
        compositionId: composition.compositionId,
        name: composition.name,
        description: composition.description,
        creatorId: composition.creatorId,
        orgId: composition.orgId,
        steps: composition.steps,
        approvalGates: composition.approvalGates,
      });
      res.json({ data: { compositionId: composition.compositionId, created: true } });
      return;
    }

    if (!name || !steps?.length) {
      res.status(400).json({ error: "name and steps are required" }); return;
    }

    const compositionId = `comp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    await saveSkillComposition({
      compositionId,
      name,
      description,
      creatorId: String(user?.id ?? ""),
      orgId,
      steps,
      approvalGates: approvalGates ?? [],
    });
    res.json({ data: { compositionId, created: true } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/compositions/:compositionId/run", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const compositionId = String(req.params.compositionId);
    const { input, autonomyOverride } = req.body;

    const fakeContext = {
      runId: `comp_run_${Date.now()}`,
      traceId: `trace_comp_${Date.now()}`,
      agentId: "szl-orchestrator",
      domain: "orchestration",
      threadId: `thread_comp_${Date.now()}`,
      userId: String(user?.id ?? ""),
      metadata: {},
      delegateTo: async () => ({ agentId: "test", response: "ok", toolsUsed: [], latencyMs: 0, traceId: "" }),
      recall: async () => [],
      storeEntity: async () => {},
      emitTrace: async () => {},
    };

    const result = await runComposition(
      compositionId,
      input ?? {},
      fakeContext,
      { userId: String(user?.id ?? ""), autonomyOverride }
    );

    res.json({ data: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/activity/feed", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const isAdmin = user?.roles?.includes("admin") || user?.roles?.includes("super_admin");

    const feed = await getActivityFeed({
      agentId: req.query.agentId ? String(req.query.agentId) : undefined,
      domain: req.query.domain ? String(req.query.domain) : undefined,
      userId: isAdmin ? (req.query.userId ? String(req.query.userId) : undefined) : String(user?.id ?? ""),
      runId: req.query.runId ? String(req.query.runId) : undefined,
      compositionId: req.query.compositionId ? String(req.query.compositionId) : undefined,
      limit: req.query.limit ? parseInt(String(req.query.limit)) : 50,
      offset: req.query.offset ? parseInt(String(req.query.offset)) : 0,
    });

    res.json({ data: feed });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/activity/stats", authMiddleware, async (req: Request, res: Response) => {
  try {
    const windowHours = req.query.windowHours ? parseInt(String(req.query.windowHours)) : 24;
    const stats = await getAgentActivityStats(windowHours);
    res.json({ data: stats });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/activity/delegation-chain/:runId", authMiddleware, async (req: Request, res: Response) => {
  try {
    const runId = String(req.params.runId);
    const chain = await getA2ADelegationChain(runId);
    res.json({ data: chain });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/mcp/health", async (_req: Request, res: Response) => {
  try {
    const health = await mcpGatewayHealth();
    res.json({ data: health });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:skillId", async (req: Request, res: Response) => {
  try {
    const skillId = String(req.params.skillId);
    const skill = await getSkill(skillId);
    if (!skill) { res.status(404).json({ error: "Skill not found" }); return; }
    const [metrics, orgConfigs] = await Promise.all([
      getSkillMetrics(skillId),
      getSkillOrgConfigs(skillId),
    ]);
    res.json({ data: { ...skill, metrics, orgConfigs } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:skillId/status", authMiddleware, requireRole("admin"), async (req: Request, res: Response) => {
  try {
    const skillId = String(req.params.skillId);
    const { status } = req.body as { status: SkillStatus };
    if (!["active", "degraded", "inactive", "deprecated"].includes(status)) {
      res.status(400).json({ error: "Invalid status" }); return;
    }
    await updateSkillStatus(skillId, status);
    res.json({ data: { skillId, status } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:skillId/org-config", authMiddleware, requireRole("admin"), async (req: Request, res: Response) => {
  try {
    const skillId = String(req.params.skillId);
    const { orgId, enabled, autonomyLevelOverride, customConfig } = req.body;
    if (!orgId) { res.status(400).json({ error: "orgId required" }); return; }
    await setSkillOrgConfig(skillId, orgId, { enabled, autonomyLevelOverride, customConfig });
    res.json({ data: { skillId, orgId, updated: true } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:skillId/test", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const skillId = String(req.params.skillId);
    const { input, agentId, autonomyOverride } = req.body;

    const fakeContext = {
      runId: `test_${Date.now()}`,
      traceId: `trace_test_${Date.now()}`,
      agentId: agentId ?? "szl-orchestrator",
      domain: "test",
      threadId: `thread_test_${Date.now()}`,
      userId: String(user?.id ?? "test"),
      metadata: {},
      delegateTo: async () => ({ agentId: "test", response: "ok", toolsUsed: [], latencyMs: 0, traceId: "" }),
      recall: async () => [],
      storeEntity: async () => {},
      emitTrace: async () => {},
    };

    const result = await executeSkill({
      skillId,
      input: input ?? {},
      agentId: agentId ?? "szl-orchestrator",
      userId: String(user?.id ?? "test"),
      autonomyOverride: autonomyOverride ?? "observer",
    }, fakeContext);

    res.json({ data: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
