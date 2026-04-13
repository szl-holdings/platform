import { logger } from "../logger";
import { gatewayInfer } from "../ai-gateway";

export interface ConsensusResponse {
  provider: string;
  model: string;
  response: string;
  confidence?: number;
}

export interface ConsensusAnalysis {
  agreements: string[];
  disagreements: string[];
  consensusReached: boolean;
  consensusScore: number;
  adjudicatedResponse: string;
  requiresHumanReview: boolean;
  hallucinations: string[];
  confidence: number;
}

export interface ConsensusResult {
  query: string;
  domain: string;
  individualResponses: ConsensusResponse[];
  analysis: ConsensusAnalysis;
  finalResponse: string;
  latencyMs: number;
  modelsUsed: string[];
}

const HIGH_STAKES_DOMAINS = ["legal", "security", "cyber", "compliance", "financial", "medical"];

const PROVIDER_CONFIGS = [
  { provider: "replit-proxy" as const, model: "gpt-5.2" },
  { provider: "anthropic" as const, model: "claude-sonnet-4-20250514" },
  { provider: "gemini" as const, model: "gemini-2.0-flash" },
];

export function requiresConsensus(domain: string, riskLevel: string): boolean {
  return (
    HIGH_STAKES_DOMAINS.some(d => domain.toLowerCase().includes(d)) ||
    riskLevel === "critical" ||
    riskLevel === "high"
  );
}

export async function runConsensusVerification(
  query: string,
  systemContext: string,
  domain: string,
  options: { providers?: number; minConsensusScore?: number } = {}
): Promise<ConsensusResult> {
  const startTime = Date.now();
  const numProviders = Math.min(options.providers ?? 3, PROVIDER_CONFIGS.length);
  const minConsensus = options.minConsensusScore ?? 0.7;
  const selectedProviders = PROVIDER_CONFIGS.slice(0, numProviders);

  const individualResponses: ConsensusResponse[] = [];

  const inferenceResults = await Promise.allSettled(
    selectedProviders.map(async (cfg) => {
      const response = await gatewayInfer({
        model: cfg.model,
        preferredProvider: cfg.provider,
        messages: [
          { role: "system", content: systemContext },
          { role: "user", content: query },
        ],
        maxTokens: 1200,
        strategy: "preferred",
      });
      return {
        provider: cfg.provider,
        model: response.model || cfg.model,
        response: response.content,
        confidence: response.confidence ?? undefined,
      };
    })
  );

  for (const result of inferenceResults) {
    if (result.status === "fulfilled") {
      individualResponses.push(result.value);
    }
  }

  if (individualResponses.length === 0) {
    return {
      query, domain, individualResponses: [], latencyMs: Date.now() - startTime,
      modelsUsed: [],
      analysis: {
        agreements: [], disagreements: [], consensusReached: false,
        consensusScore: 0, adjudicatedResponse: "All models failed to respond",
        requiresHumanReview: true, hallucinations: [], confidence: 0,
      },
      finalResponse: "Unable to complete consensus verification — all models failed",
    };
  }

  if (individualResponses.length === 1) {
    return {
      query, domain, individualResponses,
      latencyMs: Date.now() - startTime,
      modelsUsed: individualResponses.map(r => r.model),
      analysis: {
        agreements: ["Single provider response"], disagreements: [],
        consensusReached: true, consensusScore: 0.7,
        adjudicatedResponse: individualResponses[0]!.response,
        requiresHumanReview: false, hallucinations: [], confidence: 0.7,
      },
      finalResponse: individualResponses[0]!.response,
    };
  }

  const analysis = await adjudicate(query, individualResponses, minConsensus);

  logger.info({
    domain, consensusScore: analysis.consensusScore,
    providers: individualResponses.length,
    requiresHumanReview: analysis.requiresHumanReview,
  }, "Consensus verification complete");

  return {
    query, domain, individualResponses, analysis,
    finalResponse: analysis.adjudicatedResponse,
    latencyMs: Date.now() - startTime,
    modelsUsed: individualResponses.map(r => r.model),
  };
}

async function adjudicate(
  query: string,
  responses: ConsensusResponse[],
  minConsensusScore: number
): Promise<ConsensusAnalysis> {
  const responseTexts = responses
    .map((r, i) => `Model ${i + 1} (${r.provider}):\n${r.response.slice(0, 800)}`)
    .join("\n\n---\n\n");

  try {
    const adjudicationResponse = await gatewayInfer({
      model: "gpt-5.2",
      preferredProvider: "replit-proxy",
      messages: [
        {
          role: "system",
          content: `You are a consensus adjudicator for high-stakes AI outputs. Compare multiple model responses and identify agreements, disagreements, and potential hallucinations.

Respond with JSON:
{
  "agreements": ["point all models agree on"],
  "disagreements": ["point where models differ"],
  "consensusScore": 0.0-1.0,
  "hallucinations": ["potentially false claims found in responses"],
  "adjudicatedResponse": "synthesized best response combining agreed points",
  "requiresHumanReview": true|false,
  "confidence": 0.0-1.0
}

consensusScore: 1.0 = all models agree perfectly, 0.0 = total disagreement
requiresHumanReview: true if consensusScore < ${minConsensusScore} or significant hallucinations detected`,
        },
        {
          role: "user",
          content: `Query: ${query}\n\nModel responses:\n${responseTexts}`,
        },
      ],
      maxTokens: 1000,
      strategy: "preferred",
    });

    const match = adjudicationResponse.content.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return {
        agreements: parsed.agreements || [],
        disagreements: parsed.disagreements || [],
        consensusReached: (parsed.consensusScore ?? 0) >= minConsensusScore,
        consensusScore: parsed.consensusScore ?? 0.5,
        adjudicatedResponse: parsed.adjudicatedResponse || responses[0]!.response,
        requiresHumanReview: parsed.requiresHumanReview ?? false,
        hallucinations: parsed.hallucinations || [],
        confidence: parsed.confidence ?? 0.7,
      };
    }
  } catch (err) {
    logger.warn({ err }, "Adjudication failed, using majority response");
  }

  const longestResponse = responses.reduce((best, r) =>
    r.response.length > best.response.length ? r : best, responses[0]!
  );

  return {
    agreements: ["Responses available but adjudication failed"],
    disagreements: [],
    consensusReached: false,
    consensusScore: 0.5,
    adjudicatedResponse: longestResponse.response,
    requiresHumanReview: true,
    hallucinations: [],
    confidence: 0.5,
  };
}

export async function quickFactCheck(
  claim: string,
  context: string
): Promise<{ isLikelyTrue: boolean; confidence: number; reasoning: string }> {
  try {
    const response = await gatewayInfer({
      messages: [
        {
          role: "system",
          content: `You are a fact-checking assistant. Based only on the provided context, assess if the claim is likely true.
Respond with JSON: {"isLikelyTrue": true|false, "confidence": 0.0-1.0, "reasoning": "brief explanation"}
If the context doesn't contain enough information, set confidence below 0.5.`,
        },
        {
          role: "user",
          content: `Context:\n${context.slice(0, 1500)}\n\nClaim to check: ${claim}`,
        },
      ],
      maxTokens: 200,
      strategy: "cheapest",
    });

    const match = response.content.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return {
        isLikelyTrue: parsed.isLikelyTrue ?? false,
        confidence: parsed.confidence ?? 0.5,
        reasoning: parsed.reasoning || "Unable to verify",
      };
    }
  } catch {}

  return { isLikelyTrue: false, confidence: 0.3, reasoning: "Fact check failed" };
}
