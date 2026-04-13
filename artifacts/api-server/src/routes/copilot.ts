import { Router, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import { createNLAExecutionPlan } from "../lib/mastra/nla-router";
import { listSkills } from "../lib/mastra/skills-registry";
import { logger } from "../lib/logger";

const router = Router();

const copilotRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, ip: false },
});

router.use(copilotRateLimit as any);

const COPILOT_AGENT_TO_DOMAIN: Record<string, string> = {
  "helmsman": "maritime",
  "sentinel": "security",
  "beacon": "ai",
  "terra": "terra",
  "navigator": "general",
  "nexus": "general",
  "compass": "general",
  "muse": "advisory",
  "alloy-predict": "general",
  "stephen-ai": "general",
};

router.post("/nla/plan", async (req: Request, res: Response) => {
  const { command, agentId } = req.body as { command?: string; agentId?: string };
  if (!command || typeof command !== "string") {
    return res.status(400).json({ error: "command required" });
  }

  try {
    const domain = agentId ? COPILOT_AGENT_TO_DOMAIN[agentId] : undefined;
    const plan = await createNLAExecutionPlan(command, {
      triggeredBy: `copilot:${agentId ?? "unknown"}`,
      domain,
    });

    res.json({
      planId: plan.planId,
      intent: plan.parsed.intent,
      domain: plan.parsed.domain,
      overallRisk: plan.parsed.overallRisk,
      requiresApproval: plan.requiresApproval,
      confidence: plan.parsed.confidence,
      approvalReason: plan.parsed.approvalReason,
      steps: plan.parsed.toolChain.map((tc, idx) => ({
        id: `step-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        label: tc.rationale,
        tool: tc.toolName,
        risk: tc.estimatedRisk,
        requiresApproval: tc.estimatedRisk === "high" || tc.estimatedRisk === "critical",
      })),
    });
  } catch (err: any) {
    logger.error({ err }, "Copilot NLA plan error");
    res.status(500).json({ error: err.message ?? "NLA planning failed" });
  }
});

router.get("/skills/suggest", async (req: Request, res: Response) => {
  const { agentId, domain } = req.query as { agentId?: string; domain?: string };

  try {
    const targetDomain = domain ?? (agentId ? COPILOT_AGENT_TO_DOMAIN[agentId] : undefined);

    const skills = await listSkills({
      status: "active",
      ...(targetDomain ? { domain: targetDomain as any } : {}),
    });

    const suggestions = skills
      .slice(0, 6)
      .map(s => ({
        skillId: s.skill_id,
        label: s.label,
        description: s.description,
        domain: s.domains?.[0],
        autonomyRequired: s.required_autonomy_level,
        category: s.category,
      }));

    res.json({ suggestions, agentId, domain: targetDomain });
  } catch (err: any) {
    logger.error({ err }, "Copilot skill suggest error");
    res.status(500).json({ error: err.message ?? "Skill suggestion failed" });
  }
});

export default router;
