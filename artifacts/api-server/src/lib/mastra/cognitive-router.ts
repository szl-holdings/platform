import { logger } from "../logger";
import { gatewayInfer } from "../ai-gateway";

export type CognitiveMode = "system1" | "system2";

export interface CognitiveClassification {
  mode: CognitiveMode;
  complexityScore: number;
  reasoning: string;
  planningStrategy: "direct" | "react" | "tot" | "plan_critique" | "monte_carlo";
  estimatedLatencyMs: number;
  domain: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  requiresConsensus: boolean;
}

const SYSTEM1_PATTERNS = [
  /^(what is|who is|when is|where is|list|show me|get|fetch|find)/i,
  /^(hello|hi|thanks|thank you|ok|yes|no)/i,
  /^(status of|how many|count|total)/i,
];

const COMPLEX_INDICATORS = [
  /\b(analyze|strategy|recommend|plan|assess|evaluate|compare|synthesize|correlate)\b/i,
  /\b(across|multiple|all domains|comprehensive|deep|thorough)\b/i,
  /\b(legal|compliance|security|financial|risk|audit)\b/i,
  /\b(if.*then|when.*happens|scenario|simulate|predict)\b/i,
  /\b(optimize|maximize|minimize|balance|trade-off)\b/i,
];

function scoreComplexity(query: string, domain: string, context?: Record<string, unknown>): number {
  let score = 0;

  if (query.split(" ").length > 30) score += 2;
  if (query.split(" ").length > 60) score += 2;

  for (const pat of SYSTEM1_PATTERNS) {
    if (pat.test(query)) { score -= 3; break; }
  }

  for (const ind of COMPLEX_INDICATORS) {
    if (ind.test(query)) score += 2;
  }

  const highRiskDomains = ["legal", "security", "financial", "compliance", "cyber"];
  if (highRiskDomains.some(d => domain.toLowerCase().includes(d))) score += 2;

  const hasMultipleQuestions = (query.match(/\?/g) || []).length > 1;
  if (hasMultipleQuestions) score += 2;

  if (query.includes("AND") || query.includes(" and ")) score += 1;

  if (context && Object.keys(context).length > 3) score += 1;

  return Math.max(0, Math.min(10, score));
}

function selectPlanningStrategy(complexityScore: number, domain: string): CognitiveClassification["planningStrategy"] {
  if (complexityScore <= 2) return "direct";
  if (complexityScore <= 4) return "react";
  if (complexityScore <= 6) return "tot";
  const criticalDomains = ["legal", "security", "cyber", "compliance"];
  if (criticalDomains.some(d => domain.toLowerCase().includes(d))) return "plan_critique";
  return "monte_carlo";
}

function assessRisk(domain: string, query: string): CognitiveClassification["riskLevel"] {
  const criticalPatterns = /\b(delete|remove|terminate|override|disable|bypass)\b/i;
  const highPatterns = /\b(modify|update|create|send|notify|execute)\b/i;
  if (criticalPatterns.test(query)) return "critical";
  const critDomains = ["security", "cyber", "legal", "compliance", "financial"];
  if (critDomains.some(d => domain.includes(d)) && highPatterns.test(query)) return "high";
  if (critDomains.some(d => domain.includes(d))) return "medium";
  return "low";
}

export async function classifyRequest(
  query: string,
  domain: string,
  context?: Record<string, unknown>
): Promise<CognitiveClassification> {
  const complexityScore = scoreComplexity(query, domain, context);
  const mode: CognitiveMode = complexityScore <= 3 ? "system1" : "system2";
  const planningStrategy = selectPlanningStrategy(complexityScore, domain);
  const riskLevel = assessRisk(domain, query);
  const requiresConsensus = riskLevel === "critical" || riskLevel === "high";

  const estimatedLatencyMs = mode === "system1"
    ? 500
    : planningStrategy === "monte_carlo" ? 8000
    : planningStrategy === "plan_critique" ? 5000
    : planningStrategy === "tot" ? 4000
    : 2000;

  const reasoning = mode === "system1"
    ? `Low complexity (score=${complexityScore}): fast-path single-model response`
    : `High complexity (score=${complexityScore}): slow-path ${planningStrategy} deliberation`;

  logger.debug({ query: query.slice(0, 80), mode, complexityScore, planningStrategy }, "Cognitive classification");

  return {
    mode,
    complexityScore,
    reasoning,
    planningStrategy,
    estimatedLatencyMs,
    domain,
    riskLevel,
    requiresConsensus,
  };
}

export async function classifyWithLLM(
  query: string,
  domain: string
): Promise<CognitiveClassification> {
  try {
    const response = await gatewayInfer({
      messages: [
        {
          role: "system",
          content: `You are a cognitive complexity classifier. Analyze the query and classify it. Respond with ONLY JSON:
{
  "complexityScore": 0-10,
  "mode": "system1"|"system2",
  "planningStrategy": "direct"|"react"|"tot"|"plan_critique"|"monte_carlo",
  "riskLevel": "low"|"medium"|"high"|"critical",
  "reasoning": "brief explanation",
  "requiresConsensus": true|false
}

System 1 (score 0-3): Simple lookups, status checks, factual queries, greetings.
System 2 (score 4-10): Analysis, strategy, multi-step reasoning, cross-domain synthesis, high-stakes decisions.
Planning: direct→react→tot→plan_critique→monte_carlo as complexity grows.
Consensus required for legal, security, financial high-stakes outputs.`,
        },
        { role: "user", content: `Domain: ${domain}\nQuery: ${query}` },
      ],
      maxTokens: 200,
      strategy: "cheapest",
    });

    const match = response.content.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return {
        mode: parsed.mode ?? "system2",
        complexityScore: parsed.complexityScore ?? 5,
        reasoning: parsed.reasoning ?? "LLM-classified",
        planningStrategy: parsed.planningStrategy ?? "react",
        estimatedLatencyMs: parsed.mode === "system1" ? 500 : 3000,
        domain,
        riskLevel: parsed.riskLevel ?? "medium",
        requiresConsensus: parsed.requiresConsensus ?? false,
      };
    }
  } catch (err) {
    logger.warn({ err }, "LLM classification failed, falling back to heuristic");
  }

  return classifyRequest(query, domain);
}
