import { logger } from "../logger";
import { gatewayInfer } from "../ai-gateway";
import { emitTrace } from "./agentops";
import type { AgentExecutionContext } from "./types";

export type ThinkingMode = "system1" | "system2";

export interface CognitiveAssessment {
  mode: ThinkingMode;
  confidence: number;
  complexity: "simple" | "moderate" | "complex" | "critical";
  requiresDeepThinking: boolean;
  reasoning: string;
}

export interface ExecutionPlan {
  planId: string;
  objective: string;
  steps: PlanStep[];
  assumptions: string[];
  risks: string[];
  revisedAt?: string;
  revisionCount: number;
}

export interface PlanStep {
  stepId: string;
  action: string;
  tool?: string;
  expectedOutcome: string;
  status: "pending" | "executing" | "completed" | "failed" | "revised";
  actualOutcome?: string;
  divergenceDetected?: boolean;
}

export interface MetacognitiveSignal {
  confidence: number;
  uncertaintyAreas: string[];
  verificationNeeded: boolean;
  verificationReason?: string;
  selfCritiqueNote?: string;
}

const COMPLEXITY_KEYWORDS = {
  simple: ["what is", "who is", "list", "name", "define", "when was"],
  complex: ["analyze", "synthesize", "compare multiple", "correlate", "predict", "optimize across", "multi-step"],
  critical: ["critical", "urgent", "security breach", "legal exposure", "material risk", "immediate", "emergency"],
};

export function assessQueryComplexity(query: string): CognitiveAssessment {
  const q = query.toLowerCase();

  const isCritical = COMPLEXITY_KEYWORDS.critical.some(kw => q.includes(kw));
  const isComplex = COMPLEXITY_KEYWORDS.complex.some(kw => q.includes(kw));
  const isSimple = COMPLEXITY_KEYWORDS.simple.some(kw => q.startsWith(kw));

  const wordCount = query.split(/\s+/).length;
  const hasManyConstraints = (query.match(/and|but|however|while|whereas|considering/gi) || []).length > 2;
  const hasMultipleDomains = (query.match(/vessels|aegis|terra|prism|lyte|carlota|maritime|legal|security/gi) || []).length > 1;

  let complexity: CognitiveAssessment["complexity"] = "moderate";
  let confidence = 0.7;

  if (isCritical) {
    complexity = "critical";
    confidence = 0.5;
  } else if (isComplex || hasManyConstraints || hasMultipleDomains || wordCount > 60) {
    complexity = "complex";
    confidence = 0.55;
  } else if (isSimple && wordCount < 15 && !hasManyConstraints) {
    complexity = "simple";
    confidence = 0.9;
  }

  const requiresDeepThinking = complexity === "complex" || complexity === "critical";
  const mode: ThinkingMode = requiresDeepThinking ? "system2" : "system1";

  return {
    mode,
    confidence,
    complexity,
    requiresDeepThinking,
    reasoning: buildComplexityReasoning(complexity, wordCount, hasManyConstraints, hasMultipleDomains),
  };
}

function buildComplexityReasoning(
  complexity: string,
  wordCount: number,
  hasManyConstraints: boolean,
  hasMultipleDomains: boolean
): string {
  const parts: string[] = [`Query complexity assessed as ${complexity}.`];
  if (wordCount > 60) parts.push(`Long query (${wordCount} words) suggests nuanced intent.`);
  if (hasManyConstraints) parts.push("Multiple logical constraints detected.");
  if (hasMultipleDomains) parts.push("Cross-domain coordination required.");
  if (complexity === "critical") parts.push("Critical urgency signals detected — prioritizing accuracy over speed.");
  return parts.join(" ");
}

export async function generateExecutionPlan(
  objective: string,
  agentId: string,
  availableTools: string[],
  context: AgentExecutionContext
): Promise<ExecutionPlan> {
  const planId = `plan_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const traceId = `trace_${Date.now()}`;

  await emitTrace(context.runId, agentId, {
    traceId,
    parentTraceId: context.traceId,
    spanType: "agent_run",
    name: "Plan Generation (System 2)",
    status: "running",
    input: { objective, availableTools: availableTools.slice(0, 10) },
  });

  const toolList = availableTools.slice(0, 15).join(", ");
  const planningPrompt = `You are a strategic planner. Given this objective and available tools, create a concise execution plan.

OBJECTIVE: ${objective}
AVAILABLE TOOLS: ${toolList}

Respond with a JSON object in this exact format:
{
  "steps": [
    {"stepId": "s1", "action": "description of what to do", "tool": "optional_tool_name", "expectedOutcome": "what success looks like"}
  ],
  "assumptions": ["key assumption 1", "key assumption 2"],
  "risks": ["potential risk 1", "potential risk 2"]
}

Keep it to 2-5 steps maximum. Be concrete and tool-specific.`;

  try {
    const response = await gatewayInfer({
      messages: [
        { role: "system", content: "You are a precise execution planner. Always respond with valid JSON only." },
        { role: "user", content: planningPrompt },
      ],
      model: "gpt-4o-mini",
      preferredProvider: "replit-proxy",
      strategy: "fastest",
      maxTokens: 800,
    });

    let parsed: any = { steps: [], assumptions: [], risks: [] };
    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
    } catch { }

    const plan: ExecutionPlan = {
      planId,
      objective,
      steps: (parsed.steps || []).map((s: any, i: number) => ({
        stepId: s.stepId || `s${i + 1}`,
        action: s.action || `Step ${i + 1}`,
        tool: s.tool,
        expectedOutcome: s.expectedOutcome || "Complete successfully",
        status: "pending" as const,
      })),
      assumptions: parsed.assumptions || [],
      risks: parsed.risks || [],
      revisionCount: 0,
    };

    await emitTrace(context.runId, agentId, {
      traceId,
      parentTraceId: context.traceId,
      spanType: "agent_run",
      name: "Plan Generation (System 2)",
      status: "completed",
      output: { planId, stepCount: plan.steps.length },
      latencyMs: 0,
    });

    return plan;
  } catch (err: any) {
    logger.warn({ err }, "Plan generation failed, using fallback");
    await emitTrace(context.runId, agentId, {
      traceId,
      parentTraceId: context.traceId,
      spanType: "agent_run",
      name: "Plan Generation (System 2)",
      status: "failed",
      error: err.message,
    });

    return {
      planId,
      objective,
      steps: [
        { stepId: "s1", action: "Research and gather relevant information", expectedOutcome: "Sufficient context gathered", status: "pending" },
        { stepId: "s2", action: "Synthesize findings and generate response", expectedOutcome: "Clear, actionable response", status: "pending" },
      ],
      assumptions: ["Standard domain context applies"],
      risks: ["Information may be incomplete"],
      revisionCount: 0,
    };
  }
}

export async function revisePlanOnDivergence(
  plan: ExecutionPlan,
  failedStep: PlanStep,
  actualOutcome: string,
  agentId: string,
  context: AgentExecutionContext
): Promise<ExecutionPlan> {
  const traceId = `trace_${Date.now()}`;

  await emitTrace(context.runId, agentId, {
    traceId,
    spanType: "agent_run",
    name: "Plan Revision (Divergence Detected)",
    status: "running",
    input: { planId: plan.planId, failedStep: failedStep.stepId, actualOutcome: actualOutcome.slice(0, 200) },
  });

  const revisionPrompt = `An execution plan has diverged from expectations. Revise the remaining steps.

OBJECTIVE: ${plan.objective}
FAILED STEP: ${failedStep.action}
EXPECTED: ${failedStep.expectedOutcome}
ACTUAL: ${actualOutcome}
REMAINING STEPS: ${plan.steps.filter(s => s.status === "pending").map(s => s.action).join(", ")}

Respond with JSON: {"revisedSteps": [{"stepId": "...", "action": "...", "expectedOutcome": "..."}], "revisionRationale": "..."}`;

  try {
    const response = await gatewayInfer({
      messages: [
        { role: "system", content: "You are an adaptive planner. Respond with valid JSON only." },
        { role: "user", content: revisionPrompt },
      ],
      model: "gpt-4o-mini",
      preferredProvider: "replit-proxy",
      strategy: "fastest",
      maxTokens: 600,
    });

    let parsed: any = { revisedSteps: [], revisionRationale: "Adaptation required" };
    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
    } catch { }

    const updatedSteps = plan.steps.map(step => {
      if (step.stepId === failedStep.stepId) {
        return { ...step, status: "failed" as const, actualOutcome, divergenceDetected: true };
      }
      if (step.status === "pending") {
        const revised = parsed.revisedSteps?.find((r: any) => r.stepId === step.stepId);
        if (revised) return { ...step, action: revised.action, expectedOutcome: revised.expectedOutcome, status: "revised" as const };
      }
      return step;
    });

    await emitTrace(context.runId, agentId, {
      traceId,
      spanType: "agent_run",
      name: "Plan Revision (Divergence Detected)",
      status: "completed",
      output: { revisedSteps: parsed.revisedSteps?.length ?? 0 },
    });

    return {
      ...plan,
      steps: updatedSteps,
      revisedAt: new Date().toISOString(),
      revisionCount: plan.revisionCount + 1,
    };
  } catch {
    const updatedSteps = plan.steps.map(step =>
      step.stepId === failedStep.stepId
        ? { ...step, status: "failed" as const, actualOutcome, divergenceDetected: true }
        : step
    );
    return { ...plan, steps: updatedSteps, revisionCount: plan.revisionCount + 1, revisedAt: new Date().toISOString() };
  }
}

export async function assessMetacognitiveConfidence(
  query: string,
  response: string,
  toolsUsed: string[]
): Promise<MetacognitiveSignal> {
  const responseLen = response.length;
  const hasUncertaintyMarkers = /i'm not sure|i don't know|unclear|may not|could be wrong|uncertain|approximate/i.test(response);
  const hasDataGaps = /no data|not available|insufficient|cannot confirm|unverified/i.test(response);
  const toolCount = toolsUsed.length;

  let confidence = 0.85;
  const uncertaintyAreas: string[] = [];

  if (hasUncertaintyMarkers) {
    confidence -= 0.15;
    uncertaintyAreas.push("Response contains self-expressed uncertainty");
  }
  if (hasDataGaps) {
    confidence -= 0.1;
    uncertaintyAreas.push("Data gaps detected in available information");
  }
  if (toolCount === 0) {
    confidence -= 0.05;
    uncertaintyAreas.push("No tools were used to verify claims");
  }
  if (responseLen < 50) {
    confidence -= 0.1;
    uncertaintyAreas.push("Response may be too brief for complex query");
  }

  confidence = Math.max(0.1, Math.min(0.99, confidence));
  const verificationNeeded = confidence < 0.6;

  return {
    confidence,
    uncertaintyAreas,
    verificationNeeded,
    verificationReason: verificationNeeded
      ? `Confidence is ${(confidence * 100).toFixed(0)}% — recommend verification via additional tools or human review.`
      : undefined,
    selfCritiqueNote: hasUncertaintyMarkers
      ? "Agent expressed internal uncertainty. Consider escalating to higher-capacity model."
      : undefined,
  };
}

export function buildSystem2Prefix(plan: ExecutionPlan, stepIndex: number): string {
  const step = plan.steps[stepIndex];
  if (!step) return "";
  return `[SYSTEM 2 REASONING — Step ${stepIndex + 1}/${plan.steps.length}]\n` +
    `Objective: ${plan.objective}\n` +
    `Current step: ${step.action}\n` +
    `Expected outcome: ${step.expectedOutcome}\n` +
    (plan.revisionCount > 0 ? `⚠️ Plan revised ${plan.revisionCount}x due to execution divergence.\n` : "") +
    `---\n`;
}

export function buildMetacognitiveFooter(signal: MetacognitiveSignal): string {
  if (signal.confidence >= 0.8) return "";

  const lines: string[] = [];
  if (signal.confidence < 0.6) {
    lines.push(`\n\n⚠️ **Metacognitive Note**: My confidence in this response is ${(signal.confidence * 100).toFixed(0)}%. I recommend verifying the following:`);
    signal.uncertaintyAreas.forEach(area => lines.push(`  — ${area}`));
  }
  if (signal.verificationReason) {
    lines.push(`\n  *${signal.verificationReason}*`);
  }
  return lines.join("\n");
}
