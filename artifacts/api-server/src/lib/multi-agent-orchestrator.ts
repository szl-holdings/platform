import { logger } from "./logger";
import { gatewayInfer, type GatewayResponse } from "./ai-gateway";
import type { ChatMessage } from "@workspace/services";

export type OrchestrationDepth = "shallow" | "standard" | "deep";

export interface OrchestrationRequest {
  query: string;
  domains?: string[];
  depth?: OrchestrationDepth;
  sessionId?: string;
}

export interface AgentStep {
  stepId: string;
  agentId: string;
  domain: string;
  task: string;
  status: "pending" | "running" | "completed" | "failed";
  startedAt?: number;
  completedAt?: number;
  durationMs?: number;
  result?: string;
  error?: string;
  gatewayResponse?: GatewayResponse;
}

export interface OrchestrationResult {
  orchestrationId: string;
  query: string;
  plan: { domains: string[]; depth: string; totalSteps: number };
  steps: AgentStep[];
  synthesis: string;
  confidence: number;
  totalDurationMs: number;
  totalTokens: number;
  totalCostUsd: number;
  status: "completed" | "partial" | "failed";
}

const DOMAIN_AGENTS: Record<string, { systemPrompt: string; capabilities: string[] }> = {
  vessels: {
    systemPrompt: "You are a maritime intelligence analyst. Analyze vessel data, AIS signals, sanctions risk, and route economics. Be precise and cite specific data points.",
    capabilities: ["fleet-tracking", "sanctions-screening", "route-analysis", "chokepoint-monitoring"],
  },
  firestorm: {
    systemPrompt: "You are a cybersecurity threat analyst. Assess vulnerabilities, attack surfaces, CVEs, and penetration test results. Prioritize by risk severity.",
    capabilities: ["vulnerability-assessment", "threat-detection", "risk-scoring", "incident-response"],
  },
  terra: {
    systemPrompt: "You are a real estate market intelligence analyst. Evaluate property data, market trends, distress signals, and investment opportunities.",
    capabilities: ["market-analysis", "property-scoring", "distress-detection", "investment-recommendation"],
  },
  lyte: {
    systemPrompt: "You are an SRE and observability expert. Analyze system health, service reliability, SLO compliance, and incident patterns.",
    capabilities: ["health-monitoring", "slo-analysis", "incident-diagnosis", "capacity-planning"],
  },
  inca: {
    systemPrompt: "You are an AI research analyst. Evaluate experiment results, model performance, research trends, and publication impact.",
    capabilities: ["experiment-analysis", "model-evaluation", "research-synthesis", "benchmark-comparison"],
  },
  msp: {
    systemPrompt: "You are a managed services operations analyst. Monitor SLA compliance, ticket patterns, client health, and service delivery quality.",
    capabilities: ["sla-monitoring", "ticket-analysis", "client-health", "capacity-planning"],
  },
  dreamscape: {
    systemPrompt: "You are a creative strategy analyst. Evaluate campaign performance, content effectiveness, brand consistency, and creative trends.",
    capabilities: ["campaign-analysis", "content-scoring", "brand-monitoring", "trend-detection"],
  },
};

const PLANNER_SYSTEM_PROMPT = `You are the Nimbus Orchestration Planner. Given a user query, determine which domain agents should be consulted and what specific task each agent should perform.

Available domains and their capabilities:
${Object.entries(DOMAIN_AGENTS).map(([domain, agent]) => `- ${domain}: ${agent.capabilities.join(", ")}`).join("\n")}

Respond in this exact format (one line per agent):
AGENT: <domain> | TASK: <specific task description>

Only include agents that are relevant to the query. Include 1-4 agents maximum.`;

const SYNTHESIS_SYSTEM_PROMPT = `You are the Nimbus Intelligence Synthesizer. Given multiple domain-specific analyses, produce a unified executive briefing. Structure your response as:

1. **Key Finding** — The single most important insight
2. **Cross-Domain Connections** — How findings relate across domains
3. **Risk Assessment** — Overall risk level and specific concerns
4. **Recommended Actions** — Concrete next steps, prioritized

Be concise, specific, and actionable. Reference specific data points from the analyses.`;

function parseAgentPlan(planText: string, requestedDomains?: string[]): Array<{ domain: string; task: string }> {
  const lines = planText.split("\n").filter(l => l.includes("AGENT:") && l.includes("TASK:"));
  const parsed: Array<{ domain: string; task: string }> = [];

  for (const line of lines) {
    const agentMatch = line.match(/AGENT:\s*([^\|]+)/i);
    const taskMatch = line.match(/TASK:\s*(.+)/i);
    if (agentMatch && taskMatch) {
      const domain = agentMatch[1]!.trim().toLowerCase();
      if (DOMAIN_AGENTS[domain]) {
        if (!requestedDomains || requestedDomains.length === 0 || requestedDomains.includes(domain)) {
          parsed.push({ domain, task: taskMatch[1]!.trim() });
        }
      }
    }
  }

  if (parsed.length === 0 && requestedDomains && requestedDomains.length > 0) {
    for (const domain of requestedDomains.slice(0, 3)) {
      if (DOMAIN_AGENTS[domain]) {
        parsed.push({ domain, task: `Analyze and provide insights relevant to: ${domain}` });
      }
    }
  }

  return parsed.slice(0, 4);
}

let orchestrationCounter = 0;

export async function orchestrate(request: OrchestrationRequest): Promise<OrchestrationResult> {
  const orchestrationId = `orch-${Date.now()}-${++orchestrationCounter}`;
  const startTime = Date.now();
  const depth = request.depth ?? "standard";

  logger.info({ orchestrationId, query: request.query.slice(0, 100), domains: request.domains, depth }, "Orchestration started");

  const planMessages: ChatMessage[] = [
    { role: "system", content: PLANNER_SYSTEM_PROMPT },
    { role: "user", content: request.query },
  ];

  const planResponse = await gatewayInfer({
    messages: planMessages,
    agentId: "nimbus-planner",
    domain: "orchestration",
    strategy: "fastest",
    maxTokens: 500,
  });

  const agentTasks = parseAgentPlan(planResponse.content, request.domains);

  if (agentTasks.length === 0) {
    return {
      orchestrationId,
      query: request.query,
      plan: { domains: [], depth, totalSteps: 0 },
      steps: [],
      synthesis: "No relevant domain agents identified for this query.",
      confidence: 0.3,
      totalDurationMs: Date.now() - startTime,
      totalTokens: planResponse.usage.totalTokens,
      totalCostUsd: planResponse.estimatedCostUsd,
      status: "failed",
    };
  }

  const steps: AgentStep[] = agentTasks.map((task, idx) => ({
    stepId: `${orchestrationId}-step-${idx}`,
    agentId: `${task.domain}-analyst`,
    domain: task.domain,
    task: task.task,
    status: "pending" as const,
  }));

  const maxTokens = depth === "deep" ? 1500 : depth === "shallow" ? 400 : 800;

  const agentPromises = steps.map(async (step, idx) => {
    step.status = "running";
    step.startedAt = Date.now();

    const agentConfig = DOMAIN_AGENTS[step.domain]!;
    const messages: ChatMessage[] = [
      { role: "system", content: agentConfig.systemPrompt },
      { role: "user", content: `${agentTasks[idx]!.task}\n\nOriginal query: ${request.query}` },
    ];

    try {
      const response = await gatewayInfer({
        messages,
        agentId: step.agentId,
        domain: step.domain,
        strategy: "fastest",
        maxTokens,
      });

      step.status = "completed";
      step.completedAt = Date.now();
      step.durationMs = step.completedAt - step.startedAt!;
      step.result = response.content;
      step.gatewayResponse = response;
    } catch (err) {
      step.status = "failed";
      step.completedAt = Date.now();
      step.durationMs = step.completedAt - step.startedAt!;
      step.error = err instanceof Error ? err.message : String(err);
    }
  });

  await Promise.allSettled(agentPromises);

  const completedSteps = steps.filter(s => s.status === "completed" && s.result);
  let synthesis = "";
  let synthesisTokens = 0;

  if (completedSteps.length > 0) {
    const analysesText = completedSteps
      .map(s => `## ${s.domain.toUpperCase()} Analysis\n${s.result}`)
      .join("\n\n---\n\n");

    const synthMessages: ChatMessage[] = [
      { role: "system", content: SYNTHESIS_SYSTEM_PROMPT },
      { role: "user", content: `Query: ${request.query}\n\n${analysesText}` },
    ];

    try {
      const synthResponse = await gatewayInfer({
        messages: synthMessages,
        agentId: "nimbus-synthesizer",
        domain: "orchestration",
        strategy: "preferred",
        preferredProvider: "anthropic",
        maxTokens: depth === "deep" ? 2000 : 1000,
      });

      synthesis = synthResponse.content;
      synthesisTokens = synthResponse.usage.totalTokens;
    } catch {
      synthesis = completedSteps.map(s => `**${s.domain}**: ${s.result?.slice(0, 200)}`).join("\n\n");
    }
  }

  const totalTokens = steps.reduce((sum, s) => sum + (s.gatewayResponse?.usage.totalTokens ?? 0), 0) + planResponse.usage.totalTokens + synthesisTokens;
  const totalCostUsd = steps.reduce((sum, s) => sum + (s.gatewayResponse?.estimatedCostUsd ?? 0), 0) + planResponse.estimatedCostUsd;
  const status = completedSteps.length === steps.length ? "completed" : completedSteps.length > 0 ? "partial" : "failed";
  const confidence = completedSteps.length / Math.max(steps.length, 1);

  const result: OrchestrationResult = {
    orchestrationId,
    query: request.query,
    plan: { domains: agentTasks.map(t => t.domain), depth, totalSteps: steps.length },
    steps: steps.map(s => ({ ...s, gatewayResponse: undefined })),
    synthesis,
    confidence: parseFloat(confidence.toFixed(2)),
    totalDurationMs: Date.now() - startTime,
    totalTokens,
    totalCostUsd,
    status,
  };

  logger.info({ orchestrationId, status, steps: steps.length, completed: completedSteps.length, durationMs: result.totalDurationMs }, "Orchestration completed");
  return result;
}

export function getOrchestratorCapabilities(): {
  domains: Array<{ name: string; capabilities: string[] }>;
  depthLevels: string[];
  maxConcurrentAgents: number;
} {
  return {
    domains: Object.entries(DOMAIN_AGENTS).map(([name, config]) => ({
      name,
      capabilities: config.capabilities,
    })),
    depthLevels: ["shallow", "standard", "deep"],
    maxConcurrentAgents: 4,
  };
}
