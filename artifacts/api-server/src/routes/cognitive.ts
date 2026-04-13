import { Router, type IRouter, type Request, type Response } from "express";
import {
  classifyRequest, classifyWithLLM,
  runTreeOfThought, runPlanCritique, runMonteCarlo,
  runMetacognitiveAssessment, runSelfReflection,
  listStrategyProfiles, proposePromptRefinement, saveProposedProfile,
  approveStrategyProfile, getRecentOutcomes, getActiveStrategyProfile,
  getRecoveryHistory,
  identifyRepeatedChains, listCompoundTools, activateCompoundTool,
  runPeriodicToolAnalysis,
  getIntentStack,
  runConsensusVerification, quickFactCheck,
  getUserProfile, getOrCreateUserProfile, recordFeedback, updateProfileFromInference,
  inferProfileFromHistory,
  getActiveInsights, dismissInsight, listMonitoringObjectives,
  generateCrossDomainInsight,
} from "../lib/mastra";
import { logger } from "../lib/logger";

const cognitiveRouter: IRouter = Router();

function qs(v: unknown): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  return undefined;
}

function p(v: string | string[]): string {
  return Array.isArray(v) ? v[0] : v;
}

cognitiveRouter.post("/classify", async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, domain, context, useLLM } = req.body;
    if (!query || !domain) { res.status(400).json({ error: "query and domain are required" }); return; }
    const classification = useLLM
      ? await classifyWithLLM(query, domain)
      : await classifyRequest(query, domain, context);
    res.json({ classification });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

cognitiveRouter.post("/plan/tot", async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, systemContext, branches, depth } = req.body;
    if (!query) { res.status(400).json({ error: "query is required" }); return; }
    const result = await runTreeOfThought(query, systemContext || "You are an expert analyst.", { branches, depth });
    res.json({ result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

cognitiveRouter.post("/plan/critique", async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, systemContext, maxIterations } = req.body;
    if (!query) { res.status(400).json({ error: "query is required" }); return; }
    const result = await runPlanCritique(query, systemContext || "You are an expert analyst.", { maxIterations });
    res.json({ result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

cognitiveRouter.post("/plan/monte-carlo", async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, systemContext, simulations } = req.body;
    if (!query) { res.status(400).json({ error: "query is required" }); return; }
    const result = await runMonteCarlo(query, systemContext || "You are an expert analyst.", { simulations });
    res.json({ result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

cognitiveRouter.post("/metacognition/assess", async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, response, domain, confidenceSignals } = req.body;
    if (!query || !response || !domain) { res.status(400).json({ error: "query, response, and domain are required" }); return; }
    const state = await runMetacognitiveAssessment(query, response, domain, confidenceSignals);
    res.json({ state });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

cognitiveRouter.post("/metacognition/reflect", async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, response, systemContext } = req.body;
    if (!query || !response) { res.status(400).json({ error: "query and response are required" }); return; }
    const reflection = await runSelfReflection(query, response, systemContext || "");
    res.json({ reflection });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

cognitiveRouter.get("/evolution/profiles", async (req: Request, res: Response): Promise<void> => {
  try {
    const agentId = qs(req.query.agentId);
    const profiles = await listStrategyProfiles(agentId);
    res.json({ profiles, count: profiles.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

cognitiveRouter.get("/evolution/profiles/:agentId/active", async (req: Request, res: Response): Promise<void> => {
  try {
    const profile = await getActiveStrategyProfile(p(req.params.agentId));
    if (!profile) { res.status(404).json({ message: "No active profile", agentId: p(req.params.agentId) }); return; }
    res.json({ profile });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

cognitiveRouter.post("/evolution/propose", async (req: Request, res: Response): Promise<void> => {
  try {
    const { agentId, currentPrompt } = req.body;
    if (!agentId || !currentPrompt) { res.status(400).json({ error: "agentId and currentPrompt required" }); return; }
    const outcomes = await getRecentOutcomes(agentId, 20);
    const refinement = await proposePromptRefinement(agentId, currentPrompt, outcomes);
    if (!refinement) { res.json({ message: "No refinement needed — performance is already high or insufficient data", refined: false }); return; }
    const profile = await saveProposedProfile(agentId, currentPrompt, refinement);
    res.json({ profile, refinement });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

cognitiveRouter.post("/evolution/approve/:profileId", async (req: Request, res: Response): Promise<void> => {
  try {
    const { approvedBy } = req.body;
    if (!approvedBy) { res.status(400).json({ error: "approvedBy is required" }); return; }
    await approveStrategyProfile(p(req.params.profileId), approvedBy);
    res.json({ approved: true, profileId: p(req.params.profileId) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

cognitiveRouter.get("/evolution/outcomes/:agentId", async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(qs(req.query.limit) || "20") || 20;
    const outcomes = await getRecentOutcomes(p(req.params.agentId), limit);
    res.json({ outcomes, count: outcomes.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

cognitiveRouter.get("/recovery/history/:agentId", async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(qs(req.query.limit) || "20") || 20;
    const history = await getRecoveryHistory(p(req.params.agentId), limit);
    res.json({ history, count: history.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

cognitiveRouter.get("/tools/chains", async (req: Request, res: Response): Promise<void> => {
  try {
    const minOccurrences = parseInt(qs(req.query.min) || "3") || 3;
    const chains = await identifyRepeatedChains(minOccurrences);
    res.json({ chains, count: chains.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

cognitiveRouter.get("/tools/compound", async (req: Request, res: Response): Promise<void> => {
  try {
    const status = qs(req.query.status);
    const tools = await listCompoundTools(status);
    res.json({ tools, count: tools.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

cognitiveRouter.post("/tools/compound/:id/activate", async (req: Request, res: Response): Promise<void> => {
  try {
    const activated = await activateCompoundTool(p(req.params.id));
    if (!activated) { res.status(404).json({ error: "Compound tool not found" }); return; }
    res.json({ activated: true, compoundToolId: p(req.params.id) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

cognitiveRouter.post("/tools/analyze", async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await runPeriodicToolAnalysis();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

cognitiveRouter.get("/intent/:threadId", async (req: Request, res: Response): Promise<void> => {
  try {
    const stack = await getIntentStack(p(req.params.threadId));
    if (!stack) { res.status(404).json({ message: "No intent stack for thread" }); return; }
    res.json({ stack });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

cognitiveRouter.post("/consensus/verify", async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, systemContext, domain, providers, minConsensusScore } = req.body;
    if (!query || !domain) { res.status(400).json({ error: "query and domain are required" }); return; }
    const result = await runConsensusVerification(query, systemContext || "", domain, { providers, minConsensusScore });
    res.json({ result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

cognitiveRouter.post("/consensus/fact-check", async (req: Request, res: Response): Promise<void> => {
  try {
    const { claim, context } = req.body;
    if (!claim || !context) { res.status(400).json({ error: "claim and context are required" }); return; }
    const result = await quickFactCheck(claim, context);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

cognitiveRouter.get("/personalization/users/:userId", async (req: Request, res: Response): Promise<void> => {
  try {
    const profile = await getUserProfile(p(req.params.userId));
    if (!profile) {
      const newProfile = await getOrCreateUserProfile(p(req.params.userId));
      res.json({ profile: newProfile, created: true });
      return;
    }
    res.json({ profile });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

cognitiveRouter.post("/personalization/users/:userId/feedback", async (req: Request, res: Response): Promise<void> => {
  try {
    const { runId, signalType, dimension, value } = req.body;
    if (!runId || !signalType || !dimension || value === undefined) {
      res.status(400).json({ error: "runId, signalType, dimension, value required" });
      return;
    }
    await recordFeedback(p(req.params.userId), { runId, signalType, dimension, value });
    res.json({ recorded: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

cognitiveRouter.post("/personalization/users/:userId/infer", async (req: Request, res: Response): Promise<void> => {
  try {
    const { recentQueries } = req.body;
    if (!Array.isArray(recentQueries) || recentQueries.length === 0) {
      res.status(400).json({ error: "recentQueries array is required" });
      return;
    }
    const inferred = await inferProfileFromHistory(p(req.params.userId), recentQueries);
    if (Object.keys(inferred).length > 0) {
      await updateProfileFromInference(p(req.params.userId), inferred);
    }
    res.json({ inferred, applied: Object.keys(inferred).length > 0 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

cognitiveRouter.get("/insights", async (req: Request, res: Response): Promise<void> => {
  try {
    const domain = qs(req.query.domain);
    const limit = parseInt(qs(req.query.limit) || "20") || 20;
    const insights = await getActiveInsights(domain, limit);
    res.json({ insights, count: insights.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

cognitiveRouter.post("/insights/generate", async (req: Request, res: Response): Promise<void> => {
  try {
    const { domains, agentId } = req.body;
    if (!domains?.length || !agentId) { res.status(400).json({ error: "domains array and agentId are required" }); return; }
    const insight = await generateCrossDomainInsight(domains, agentId);
    if (!insight) { res.json({ generated: false, message: "No meaningful insight found" }); return; }
    res.json({ generated: true, insight });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

cognitiveRouter.post("/insights/:insightId/dismiss", async (req: Request, res: Response): Promise<void> => {
  try {
    await dismissInsight(p(req.params.insightId));
    res.json({ dismissed: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

cognitiveRouter.get("/monitoring/objectives", async (req: Request, res: Response): Promise<void> => {
  try {
    const agentId = qs(req.query.agentId);
    const objectives = await listMonitoringObjectives(agentId);
    res.json({ objectives, count: objectives.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

cognitiveRouter.get("/status", (_req: Request, res: Response): void => {
  res.json({
    cognitiveCore: "active",
    version: "1.0.0",
    modules: {
      cognitiveRouter: "System 1/System 2 classification and routing",
      advancedPlanner: "Tree of Thought, Plan-Critique, Monte Carlo",
      metacognition: "Self-assessment, knowledge gap detection, self-reflection",
      selfEvolution: "Feedback-driven prompt and strategy evolution",
      failureRecovery: "Automatic failure diagnosis and replanning",
      dynamicTools: "Tool chain detection and compound tool composition",
      intentGraph: "Session-level intent preservation and continuity",
      consensusVerification: "Multi-model consensus for high-stakes outputs",
      personalization: "Per-user communication and autonomy adaptation",
      proactiveIntelligence: "Cross-domain pattern detection and insight surfacing",
    },
  });
});

export { cognitiveRouter };
