/**
 * Adversarial Red Team Protocol
 *
 * Any agent can challenge any other's conclusions.
 * A challenger agent (rotated among agents not in the original response)
 * systematically probes for logical gaps, unstated assumptions,
 * contradictory evidence, and failure modes.
 * Findings feed back into the learning system.
 */
import { openai } from "@szl-holdings/integrations-openai-ai-server";
import { anthropic } from "@szl-holdings/integrations-anthropic-ai";
import type { AgentCallResult } from "../types.js";

export interface RedTeamFinding {
  findingId: string;
  challengerAgentId: string;
  challengerAgentName: string;
  targetAgentId: string;
  logicalGaps: string[];
  unstatedAssumptions: string[];
  contradictoryEvidence: string[];
  failureModes: string[];
  overallVulnerability: "critical" | "high" | "medium" | "low";
  recommendation: string;
  confidenceImpact: number;
}

export interface RedTeamResult {
  orchestrationId: string;
  findings: RedTeamFinding[];
  overallAssessment: string;
  challengesRaised: number;
  criticalIssues: number;
}

const CHALLENGER_ROTATION: Record<string, string[]> = {
  maritime: ["sentinel", "lexis", "atlas"],
  security: ["inca", "zeus", "compass"],
  research: ["sentinel", "beacon", "compass"],
  creative: ["beacon", "nexus", "compass"],
  analytics: ["sentinel", "inca", "zeus"],
  infrastructure: ["sentinel", "beacon", "inca"],
  readiness: ["sentinel", "atlas", "beacon"],
  legal: ["atlas", "sentinel", "helmsman"],
  financial: ["lexis", "sentinel", "beacon"],
  real_estate: ["atlas", "lexis", "beacon"],
  client_relations: ["compass", "atlas", "muse"],
};

function selectChallenger(targetDomain: string, usedAgentIds: string[]): string {
  const candidates = CHALLENGER_ROTATION[targetDomain] ?? ["sentinel", "beacon", "atlas"];
  for (const candidate of candidates) {
    if (!usedAgentIds.includes(candidate)) return candidate;
  }
  return candidates[0] ?? "sentinel";
}

async function runChallengerProbe(
  targetResponse: AgentCallResult,
  challengerAgentId: string,
  challengerAgentName: string,
  challengerProvider: "openai" | "anthropic",
  challengerModel: string,
  originalQuery: string,
): Promise<RedTeamFinding> {
  const prompt = `You are performing adversarial red-team analysis as ${challengerAgentName}.

## Original Query
${originalQuery.slice(0, 300)}

## Agent Response to Challenge (${targetResponse.agentName}, ${targetResponse.domain})
${targetResponse.response.slice(0, 2000)}

Your task: Systematically probe this response for weaknesses. Identify:
1. Logical gaps — where reasoning is incomplete or jumps to conclusions
2. Unstated assumptions — premises taken for granted without justification
3. Contradictory evidence — data points that undermine the conclusion
4. Failure modes — scenarios where this recommendation would be wrong

Be rigorous and specific. This is adversarial — push hard on weaknesses.

Respond with JSON:
{
  "logicalGaps": ["gap1", "gap2"],
  "unstatedAssumptions": ["assumption1", "assumption2"],
  "contradictoryEvidence": ["evidence1"],
  "failureModes": ["scenario1", "scenario2"],
  "overallVulnerability": "critical|high|medium|low",
  "recommendation": "How the original analysis should be strengthened"
}`;

  let raw = "";
  try {
    if (challengerProvider === "anthropic") {
      const result = await anthropic.messages.create({
        model: challengerModel,
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      });
      raw = result.content[0]?.type === "text" ? result.content[0].text : "{}";
    } else {
      const result = await openai.chat.completions.create({
        model: challengerModel,
        max_completion_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });
      raw = result.choices[0]?.message?.content ?? "{}";
    }
  } catch {
    raw = "{}";
  }

  let parsed: Record<string, unknown> = {};
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
  } catch {}

  const vulnerability = (["critical", "high", "medium", "low"].includes(String(parsed.overallVulnerability))
    ? parsed.overallVulnerability : "medium") as RedTeamFinding["overallVulnerability"];

  const confidenceImpact = vulnerability === "critical" ? -25 : vulnerability === "high" ? -15 : vulnerability === "medium" ? -8 : -3;

  return {
    findingId: `rt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    challengerAgentId,
    challengerAgentName,
    targetAgentId: targetResponse.agentId,
    logicalGaps: Array.isArray(parsed.logicalGaps) ? parsed.logicalGaps.map(String).slice(0, 3) : [],
    unstatedAssumptions: Array.isArray(parsed.unstatedAssumptions) ? parsed.unstatedAssumptions.map(String).slice(0, 3) : [],
    contradictoryEvidence: Array.isArray(parsed.contradictoryEvidence) ? parsed.contradictoryEvidence.map(String).slice(0, 2) : [],
    failureModes: Array.isArray(parsed.failureModes) ? parsed.failureModes.map(String).slice(0, 3) : [],
    overallVulnerability: vulnerability,
    recommendation: String(parsed.recommendation ?? "Additional verification recommended"),
    confidenceImpact,
  };
}

export async function runRedTeamProtocol(
  orchestrationId: string,
  originalQuery: string,
  agentResponses: AgentCallResult[],
  maxChallenges = 2,
): Promise<RedTeamResult> {
  const { AGENT_REGISTRY } = await import("../nuro-mesh.js");
  const usedAgentIds = agentResponses.map(r => r.agentId);

  const findings: RedTeamFinding[] = [];

  const candidatesForChallenge = agentResponses
    .filter(r => r.confidence > 50)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, maxChallenges);

  await Promise.all(
    candidatesForChallenge.map(async targetResponse => {
      const challengerAgentId = selectChallenger(targetResponse.domain, usedAgentIds);
      const challengerAgent = AGENT_REGISTRY.find(a => a.id === challengerAgentId);
      if (!challengerAgent) return;

      const finding = await runChallengerProbe(
        targetResponse,
        challengerAgentId,
        challengerAgent.name,
        challengerAgent.preferredProvider as "openai" | "anthropic",
        challengerAgent.preferredProvider === "gemini" ? "gpt-4o-mini" : challengerAgent.preferredModel,
        originalQuery,
      );
      findings.push(finding);
    })
  );

  const criticalIssues = findings.filter(f => f.overallVulnerability === "critical" || f.overallVulnerability === "high").length;
  const overallAssessment = criticalIssues > 0
    ? `Red team identified ${criticalIssues} high-severity challenge(s). Key concerns: ${findings.filter(f => f.overallVulnerability === "critical" || f.overallVulnerability === "high").flatMap(f => f.logicalGaps.slice(0, 1)).join("; ")}`
    : findings.length > 0
      ? `Red team analysis complete — ${findings.length} agent response(s) challenged with medium/low vulnerability findings.`
      : "Red team analysis inconclusive — insufficient agent responses to challenge.";

  try {
    const { db, redTeamFindingsTable } = await import("@szl-holdings/db");
    await db.insert(redTeamFindingsTable).values({
      orchestrationId,
      query: originalQuery.slice(0, 500),
      findings: findings as unknown as Record<string, unknown>,
      overallAssessment,
      challengesRaised: findings.length,
      criticalIssues,
    });
  } catch {}

  return {
    orchestrationId,
    findings,
    overallAssessment,
    challengesRaised: findings.length,
    criticalIssues,
  };
}
