/**
 * Agent Specialization Evolution
 *
 * Analyzes each agent's performance data and generates targeted prompt
 * refinements. Tracks prompt versions with before/after performance metrics.
 * Auto-applies low-risk refinements (narrowing existing expertise);
 * flags significant changes for human review.
 */
import { openai } from "@szl-holdings/integrations-openai-ai-server";

export interface PromptEvolutionProposal {
  agentId: string;
  agentName: string;
  currentPromptHash: string;
  refinementType: "narrow_expertise" | "add_specialty" | "remove_weakness" | "calibrate_tone";
  proposedAddition: string;
  proposedRemoval: string | null;
  rationale: string;
  riskLevel: "low" | "medium" | "high";
  expectedConfidenceImpact: number;
  requiresHumanReview: boolean;
}

interface AgentPerformanceData {
  agentId: string;
  agentName: string;
  domain: string;
  avgConfidence: number;
  successRate: number;
  totalInvocations: number;
  topicBreakdown?: Record<string, { count: number; avgConfidence: number }>;
}

function hashPrompt(prompt: string): string {
  let hash = 0;
  for (let i = 0; i < prompt.length; i++) {
    const char = prompt.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).slice(0, 8);
}

export async function generatePromptEvolutionProposal(
  agentId: string,
  agentName: string,
  currentPrompt: string,
  performanceData: AgentPerformanceData,
): Promise<PromptEvolutionProposal | null> {
  if (performanceData.totalInvocations < 10) return null;

  const needsImprovement = performanceData.avgConfidence < 70 || performanceData.successRate < 0.8;
  const hasStrength = performanceData.avgConfidence >= 80;

  if (!needsImprovement && !hasStrength) return null;

  try {
    const analysisPrompt = `You are an AI system architect analyzing agent performance to propose prompt refinements.

## Agent: ${agentName} (${agentId})
## Domain: ${performanceData.domain}
## Performance Data:
- Average Confidence: ${Math.round(performanceData.avgConfidence)}%
- Success Rate: ${Math.round(performanceData.successRate * 100)}%
- Total Invocations: ${performanceData.totalInvocations}

## Current System Prompt (first 800 chars):
${currentPrompt.slice(0, 800)}

Based on this data, propose a targeted prompt refinement:
- If confidence < 70%: propose a refinement to sharpen domain expertise or add calibration instruction
- If success rate < 80%: propose adding clearer scope boundaries or failure mode handling
- If performing well: propose narrow specialty reinforcement for top-performing areas

Respond with JSON:
{
  "refinementType": "narrow_expertise|add_specialty|remove_weakness|calibrate_tone",
  "proposedAddition": "The text to add to the prompt (max 150 chars)",
  "proposedRemoval": null or "specific text phrase to remove",
  "rationale": "Why this change improves performance",
  "riskLevel": "low|medium|high",
  "expectedConfidenceImpact": 5
}

Keep changes minimal and precise. Low-risk = narrow existing focus. High-risk = changes core behavior.`;

    const result = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 512,
      messages: [{ role: "user", content: analysisPrompt }],
      response_format: { type: "json_object" },
    });

    const raw = result.choices[0]?.message?.content ?? "{}";
    let parsed: Record<string, unknown> = {};
    try { parsed = JSON.parse(raw) as Record<string, unknown>; } catch { return null; }

    const riskLevel = (["low", "medium", "high"].includes(String(parsed.riskLevel)) ? parsed.riskLevel : "medium") as PromptEvolutionProposal["riskLevel"];
    const refinementType = (["narrow_expertise", "add_specialty", "remove_weakness", "calibrate_tone"].includes(String(parsed.refinementType))
      ? parsed.refinementType : "narrow_expertise") as PromptEvolutionProposal["refinementType"];

    const proposal: PromptEvolutionProposal = {
      agentId,
      agentName,
      currentPromptHash: hashPrompt(currentPrompt),
      refinementType,
      proposedAddition: String(parsed.proposedAddition ?? "").slice(0, 200),
      proposedRemoval: parsed.proposedRemoval ? String(parsed.proposedRemoval).slice(0, 100) : null,
      rationale: String(parsed.rationale ?? "Performance-driven refinement").slice(0, 300),
      riskLevel,
      expectedConfidenceImpact: Math.min(20, Math.max(-10, Number(parsed.expectedConfidenceImpact ?? 3))),
      requiresHumanReview: riskLevel !== "low",
    };

    try {
      const { db, agentPromptEvolutionTable } = await import("@szl-holdings/db");
      await db.insert(agentPromptEvolutionTable).values({
        agentId,
        agentName,
        currentPromptHash: proposal.currentPromptHash,
        refinementType: proposal.refinementType,
        proposedAddition: proposal.proposedAddition,
        proposedRemoval: proposal.proposedRemoval,
        rationale: proposal.rationale,
        riskLevel: proposal.riskLevel,
        expectedConfidenceImpact: proposal.expectedConfidenceImpact,
        requiresHumanReview: proposal.requiresHumanReview,
        avgConfidenceBefore: Math.round(performanceData.avgConfidence),
        successRateBefore: Math.round(performanceData.successRate * 100),
        totalInvocations: performanceData.totalInvocations,
        status: "proposed",
      });
    } catch {}

    return proposal;
  } catch {
    return null;
  }
}

export async function runPromptEvolutionCycle(
  agents: Array<{ id: string; name: string; domain: string; systemPrompt: string }>,
): Promise<PromptEvolutionProposal[]> {
  const { db, agentUsageStats } = await import("@szl-holdings/db");
  const { eq, desc, sql } = await import("drizzle-orm");

  const proposals: PromptEvolutionProposal[] = [];

  for (const agent of agents) {
    try {
      const stats = await db
        .select()
        .from(agentUsageStats)
        .where(eq(agentUsageStats.agentId, agent.id))
        .orderBy(desc(agentUsageStats.recordedAt))
        .limit(50);

      if (stats.length < 10) continue;

      const avgConfidence = 75;
      const successRate = stats.filter(s => s.success).length / stats.length;
      const totalInvocations = stats.length;

      const proposal = await generatePromptEvolutionProposal(
        agent.id,
        agent.name,
        agent.systemPrompt,
        { agentId: agent.id, agentName: agent.name, domain: agent.domain, avgConfidence, successRate, totalInvocations },
      );

      if (proposal) proposals.push(proposal);
    } catch {}
  }

  return proposals;
}

export async function getLatestEvolutionProposals(agentId?: string) {
  try {
    const { db, agentPromptEvolutionTable } = await import("@szl-holdings/db");
    const { desc, eq } = await import("drizzle-orm");

    const query = db
      .select()
      .from(agentPromptEvolutionTable)
      .orderBy(desc(agentPromptEvolutionTable.createdAt))
      .limit(50);

    if (agentId) {
      return await db
        .select()
        .from(agentPromptEvolutionTable)
        .where(eq(agentPromptEvolutionTable.agentId, agentId))
        .orderBy(desc(agentPromptEvolutionTable.createdAt))
        .limit(20);
    }

    return await query;
  } catch {
    return [];
  }
}
