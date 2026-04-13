import { logger } from "../logger";
import { gatewayInfer } from "../ai-gateway";

export interface MetacognitiveState {
  confidence: number;
  knowledgeGapDetected: boolean;
  knowledgeGaps: string[];
  ambiguityLevel: "none" | "low" | "moderate" | "high";
  competencyBoundaryBreached: boolean;
  conflictingEvidence: boolean;
  recommendedAction: "proceed" | "clarify" | "escalate" | "delegate";
  escalationReason?: string;
  delegateToDomain?: string;
  assessmentSteps: MetacognitiveStep[];
}

export interface MetacognitiveStep {
  stepId: string;
  reasoning: string;
  confidenceAtStep: number;
  issueDetected?: string;
}

export interface SelfReflectionResult {
  originalResponse: string;
  reflectionNotes: string;
  issuesFound: string[];
  correctedResponse?: string;
  shouldCorrect: boolean;
  confidence: number;
}

const COMPETENCY_DOMAINS: Record<string, string[]> = {
  legal: ["prism-legal", "legal analysis", "contract review", "compliance", "regulatory"],
  maritime: ["vessels-intelligence", "vessel tracking", "port operations", "AIS", "maritime"],
  cyber: ["aegis-defense", "threat detection", "security analysis", "vulnerability", "SOC"],
  "real estate": ["terra-realestate", "property valuation", "market analysis", "deal scoring"],
  finance: ["carlota-advisory", "portfolio strategy", "investment", "financial analysis"],
  ai: ["lyte-aiops", "model monitoring", "ML pipeline", "inference optimization"],
};

function detectKnowledgeGaps(query: string, response: string): string[] {
  const gaps: string[] = [];
  const uncertainPhrases = [
    "I'm not sure", "I don't know", "unclear", "cannot determine",
    "insufficient data", "would need more", "I'm uncertain", "I cannot verify",
    "may vary", "depends on", "not available",
  ];

  for (const phrase of uncertainPhrases) {
    if (response.toLowerCase().includes(phrase.toLowerCase())) {
      gaps.push(`Response expresses uncertainty: "${phrase}"`);
    }
  }

  const technicalTerms = query.match(/\b[A-Z]{2,}\b/g) || [];
  for (const term of technicalTerms) {
    if (!response.toLowerCase().includes(term.toLowerCase()) && term.length > 2) {
      gaps.push(`Technical term "${term}" not addressed`);
    }
  }

  return gaps.slice(0, 5);
}

function detectAmbiguity(query: string): "none" | "low" | "moderate" | "high" {
  const ambiguousWords = ["it", "this", "that", "they", "those", "thing", "stuff"];
  const ambiguousCount = ambiguousWords.filter(w =>
    new RegExp(`\\b${w}\\b`, "i").test(query)
  ).length;

  const hasVagueScope = /\b(everything|all|any|somewhere|somehow|whatever)\b/i.test(query);
  const shortQuery = query.split(" ").length < 5;

  if (ambiguousCount >= 3 || (shortQuery && hasVagueScope)) return "high";
  if (ambiguousCount >= 2 || shortQuery) return "moderate";
  if (ambiguousCount >= 1) return "low";
  return "none";
}

function identifyDomainForDelegation(query: string): string | undefined {
  for (const [domain, keywords] of Object.entries(COMPETENCY_DOMAINS)) {
    if (keywords.slice(1).some(kw => query.toLowerCase().includes(kw.toLowerCase()))) {
      return domain;
    }
  }
  return undefined;
}

export async function runMetacognitiveAssessment(
  query: string,
  partialResponse: string,
  agentDomain: string,
  confidenceSignals?: { toolErrors?: number; retries?: number; uncertain?: boolean }
): Promise<MetacognitiveState> {
  const steps: MetacognitiveStep[] = [];
  let overallConfidence = 0.8;

  const ambiguityLevel = detectAmbiguity(query);
  const knowledgeGaps = detectKnowledgeGaps(query, partialResponse);
  const knowledgeGapDetected = knowledgeGaps.length > 0;

  steps.push({
    stepId: "ambiguity_check",
    reasoning: `Ambiguity assessment: ${ambiguityLevel}`,
    confidenceAtStep: ambiguityLevel === "none" ? 0.95 : ambiguityLevel === "low" ? 0.8 : ambiguityLevel === "moderate" ? 0.6 : 0.4,
  });

  if (ambiguityLevel === "high" || ambiguityLevel === "moderate") {
    overallConfidence -= 0.2;
  }

  if (knowledgeGapDetected) {
    overallConfidence -= 0.1 * knowledgeGaps.length;
    steps.push({
      stepId: "knowledge_gap_detection",
      reasoning: `Knowledge gaps detected: ${knowledgeGaps.join("; ")}`,
      confidenceAtStep: overallConfidence,
      issueDetected: `${knowledgeGaps.length} knowledge gaps`,
    });
  }

  const toolFailures = confidenceSignals?.toolErrors ?? 0;
  if (toolFailures > 0) {
    overallConfidence -= 0.15 * toolFailures;
    steps.push({
      stepId: "tool_error_impact",
      reasoning: `${toolFailures} tool error(s) reduced confidence`,
      confidenceAtStep: overallConfidence,
      issueDetected: "Tool execution failures",
    });
  }

  const delegateDomain = identifyDomainForDelegation(query);
  const competencyBoundaryBreached = !!(delegateDomain && delegateDomain !== agentDomain);

  if (competencyBoundaryBreached) {
    overallConfidence -= 0.2;
    steps.push({
      stepId: "competency_check",
      reasoning: `Query touches ${delegateDomain} domain outside this agent's primary competency (${agentDomain})`,
      confidenceAtStep: overallConfidence,
      issueDetected: `Out-of-domain: ${delegateDomain}`,
    });
  }

  overallConfidence = Math.max(0.1, Math.min(1.0, overallConfidence));

  let recommendedAction: MetacognitiveState["recommendedAction"] = "proceed";
  let escalationReason: string | undefined;

  if (ambiguityLevel === "high" || (ambiguityLevel === "moderate" && overallConfidence < 0.5)) {
    recommendedAction = "clarify";
    escalationReason = `High ambiguity (${ambiguityLevel}) makes it difficult to provide accurate response`;
  } else if (competencyBoundaryBreached && overallConfidence < 0.5) {
    recommendedAction = "delegate";
    escalationReason = `Query requires ${delegateDomain} domain expertise`;
  } else if (overallConfidence < 0.4 || toolFailures >= 3) {
    recommendedAction = "escalate";
    escalationReason = `Low confidence (${overallConfidence.toFixed(2)}) with ${toolFailures} tool failures`;
  }

  return {
    confidence: overallConfidence,
    knowledgeGapDetected,
    knowledgeGaps,
    ambiguityLevel,
    competencyBoundaryBreached,
    conflictingEvidence: confidenceSignals?.uncertain ?? false,
    recommendedAction,
    escalationReason,
    delegateToDomain: competencyBoundaryBreached ? delegateDomain : undefined,
    assessmentSteps: steps,
  };
}

export async function runSelfReflection(
  query: string,
  response: string,
  systemContext: string
): Promise<SelfReflectionResult> {
  try {
    const reflectionResponse = await gatewayInfer({
      messages: [
        {
          role: "system",
          content: `You are a self-reflective AI critic. Review the AI response to the user query and identify:
1. Factual errors or unsupported claims
2. Missing important information
3. Logical inconsistencies
4. Potential hallucinations
5. Whether the response fully addresses the query

Respond with JSON:
{
  "issues": ["issue1", "issue2"],
  "shouldCorrect": true|false,
  "confidence": 0.0-1.0,
  "reflectionNotes": "overall assessment",
  "correctedResponse": "optional improved response if shouldCorrect=true"
}`,
        },
        {
          role: "user",
          content: `User query: ${query}\n\nAI Response to review:\n${response.slice(0, 2000)}`,
        },
      ],
      maxTokens: 800,
      strategy: "cheapest",
    });

    const match = reflectionResponse.content.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return {
        originalResponse: response,
        reflectionNotes: parsed.reflectionNotes || "Self-reflection complete",
        issuesFound: parsed.issues || [],
        correctedResponse: parsed.correctedResponse,
        shouldCorrect: parsed.shouldCorrect ?? false,
        confidence: parsed.confidence ?? 0.8,
      };
    }
  } catch (err) {
    logger.warn({ err }, "Self-reflection failed");
  }

  return {
    originalResponse: response,
    reflectionNotes: "Self-reflection skipped",
    issuesFound: [],
    shouldCorrect: false,
    confidence: 0.7,
  };
}

export async function generateClarifyingQuestion(
  query: string,
  ambiguityLevel: string,
  gaps: string[]
): Promise<string> {
  try {
    const response = await gatewayInfer({
      messages: [
        {
          role: "system",
          content: "Generate a single, clear, concise clarifying question to resolve ambiguity in the user's request. Be specific about what information is needed.",
        },
        {
          role: "user",
          content: `User query: "${query}"\nAmbiguity level: ${ambiguityLevel}\nGaps identified: ${gaps.join(", ")}\n\nGenerate the most important clarifying question:`,
        },
      ],
      maxTokens: 150,
      strategy: "cheapest",
    });
    return response.content.trim();
  } catch {
    return "Could you provide more specific details about what you're looking for?";
  }
}
