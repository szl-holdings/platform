/**
 * Multi-Agent Orchestrator
 *
 * Implements a manager pattern: a planner agent dispatches to domain
 * specialist agents via explicitly-wired AgentToolWrapper instances.
 * All governance (Guardian per agent-turn and per tool-call), observability,
 * and lifecycle hooks are applied by AgentRunner uniformly.
 *
 * Execution flow:
 *  1. Planner turn (planning): plannerInferenceFn calls gatewayInfer to
 *     produce a structured text plan, parses it into tool calls, and returns
 *     structured AgentInferenceResponse.toolCalls so AgentRunner dispatches
 *     them through the agentTools map (Guardian-checked, event-emitted).
 *  2. Domain agent turns: each specialist runs via its own sub-AgentRunner
 *     (invoked through the AgentToolWrapper), with its own inferenceFn, Guardian
 *     checks, and TraceWriter spans.
 *  3. Synthesis turn: after all tool results arrive in history,
 *     plannerInferenceFn switches to the synthesis branch and produces the
 *     executive briefing. AgentRunner captures totalTokens and totalCostUsd
 *     across all turns automatically.
 *
 * Tool Mesh gateway is wired into the plannerRunner so any tool-mesh-registered
 * tool IDs produced by domain agents flow through the full governance pipeline.
 */

import {
  Agent,
  AgentRunner,
  chainAgents,
  createRunContext,
  evaluatorLoop,
  getAgent,
  type MutableRunContext,
  plannerAgent,
  registerAgent,
  routeByClassification,
  type AgentInferenceFn,
  type AgentInferenceRequest,
  type AgentInferenceResponse,
  type AgentToolWrapper,
  type RunHooks,
} from '@workspace/agents-core';
import type { ChatMessage } from '@szl-holdings/services';
import { defaultGateway, type ToolMeshGateway } from '@workspace/tool-mesh';
import { defaultDecisionEngine, type GuardianDecisionEngine } from '@workspace/guardian';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { type GatewayResponse, gatewayInfer } from './ai-gateway';
import { logger } from './logger';

// Re-export orchestration primitives so callers can use them directly
export { AgentRunner, chainAgents, evaluatorLoop, routeByClassification };

// ─── Types (preserved for backward compatibility) ────────────────────────────

export type OrchestrationDepth = 'shallow' | 'standard' | 'deep';

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
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: number;
  completedAt?: number;
  durationMs?: number;
  result?: string;
  error?: string;
  gatewayResponse?: GatewayResponse;
  /** Token and cost usage from this domain agent's sub-runner, for accurate rollup. */
  tokensUsed?: number;
  stepCostUsd?: number;
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
  status: 'completed' | 'partial' | 'failed';
}

// ─── Additional legacy domain agents not in agents-core ─────────────────────

const firestormAgent = new Agent({
  agentId: 'firestorm',
  name: 'Firestorm Security',
  description: 'Cybersecurity threat analyst (legacy alias for Sentra)',
  instructions:
    'You are a cybersecurity threat analyst. Assess vulnerabilities, attack surfaces, CVEs, and penetration test results. Prioritize by risk severity.',
  tools: [],
  handoffs: [],
  guardrails: [],
});

const incaAgent = new Agent({
  agentId: 'inca',
  name: 'Counsel AI Research',
  description: 'AI research analyst. Experiment results, model performance, research trends.',
  instructions:
    'You are an AI research analyst. Evaluate experiment results, model performance, research trends, and publication impact.',
  tools: [],
  handoffs: [],
  guardrails: [],
});

const mspAgent = new Agent({
  agentId: 'msp',
  name: 'MSP Operations',
  description: 'Managed services operations analyst. SLA compliance, ticket patterns, client health.',
  instructions:
    'You are a managed services operations analyst. Monitor SLA compliance, ticket patterns, client health, and service delivery quality.',
  tools: [],
  handoffs: [],
  guardrails: [],
});

registerAgent(firestormAgent);
registerAgent(incaAgent);
registerAgent(mspAgent);

// Map of domain names to agent IDs for routing
const DOMAIN_TO_AGENT: Record<string, string> = {
  vessels: 'vessels',
  firestorm: 'firestorm',
  terra: 'terra',
  lyte: 'lyte',
  inca: 'inca',
  msp: 'msp',
  alloy: 'alloy',
  sentra: 'sentra',
  counsel: 'counsel',
};

// ─── Planner / synthesis prompts ──────────────────────────────────────────────

const PLANNER_SYSTEM_PROMPT = `You are the SZL Orchestration Planner. Given a user query, determine which domain agents should be consulted and what specific task each agent should perform.

Available domains: vessels (maritime intelligence), firestorm (cybersecurity), terra (real estate), lyte (SRE/observability), inca (AI research), msp (managed services), alloy (orchestration health), sentra (cyber resilience), counsel (legal).

Respond in this exact format (one line per agent):
AGENT: <domain> | TASK: <specific task description>

Only include agents that are relevant to the query. Include 1-4 agents maximum.`;

const SYNTHESIS_SYSTEM_PROMPT = `You are the SZL Intelligence Synthesizer. Given multiple domain-specific analyses, produce a unified executive briefing. Structure your response as:

1. **Key Finding** — The single most important insight
2. **Cross-Domain Connections** — How findings relate across domains
3. **Risk Assessment** — Overall risk level and specific concerns
4. **Recommended Actions** — Concrete next steps, prioritized

Be concise, specific, and actionable. Reference specific data points from the analyses.`;

function parseAgentPlan(
  planText: string,
  requestedDomains?: string[],
): Array<{ domain: string; task: string }> {
  const lines = planText.split('\n').filter((l) => l.includes('AGENT:') && l.includes('TASK:'));
  const parsed: Array<{ domain: string; task: string }> = [];

  for (const line of lines) {
    const agentMatch = line.match(/AGENT:\s*([^|]+)/i);
    const taskMatch = line.match(/TASK:\s*(.+)/i);
    if (agentMatch && taskMatch) {
      const domain = agentMatch[1]?.trim().toLowerCase();
      if (domain && DOMAIN_TO_AGENT[domain]) {
        if (
          !requestedDomains ||
          requestedDomains.length === 0 ||
          requestedDomains.includes(domain)
        ) {
          parsed.push({ domain, task: taskMatch[1]?.trim() ?? domain });
        }
      }
    }
  }

  if (parsed.length === 0 && requestedDomains && requestedDomains.length > 0) {
    for (const domain of requestedDomains.slice(0, 3)) {
      if (DOMAIN_TO_AGENT[domain]) {
        parsed.push({ domain, task: `Analyze and provide insights relevant to: ${domain}` });
      }
    }
  }

  return parsed.slice(0, 4);
}

// ─── Gateway inference adapter ────────────────────────────────────────────────

/**
 * Builds an AgentInferenceFn that delegates to gatewayInfer. Used for domain
 * specialist sub-runners.
 */
export function buildGatewayInferenceFn(
  depth: OrchestrationDepth = 'standard',
): AgentInferenceFn {
  const maxTokens = depth === 'deep' ? 1500 : depth === 'shallow' ? 400 : 800;

  return async (req: AgentInferenceRequest): Promise<AgentInferenceResponse> => {
    const messages: ChatMessage[] = [
      { role: 'system', content: req.systemPrompt },
      ...req.messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ];

    const response = await gatewayInfer({
      messages,
      agentId: req.agentId,
      domain: req.ctx.domain ?? req.agentId,
      strategy: 'fastest',
      maxTokens,
    });

    return {
      content: response.content,
      usage: {
        inputTokens: response.usage.promptTokens,
        outputTokens: response.usage.completionTokens,
        totalTokens: response.usage.totalTokens,
      },
      costUsd: response.estimatedCostUsd,
    };
  };
}

/**
 * Builds the manager inference function for the planner agent.
 *
 * Turn 1 (no tool results in history): calls gatewayInfer to generate a
 * structured text plan, parses it into AgentInferenceResponse.toolCalls so
 * AgentRunner dispatches domain agents through the agentTools map.
 *
 * Turn 2+ (tool results present): calls gatewayInfer to synthesize domain
 * agent outputs into a unified executive briefing.
 *
 * The dual-turn approach lets AgentRunner own tool dispatch and governance
 * while preserving the proven text-based planning strategy that works without
 * native LLM function-calling support.
 */
function buildManagerInferenceFn(
  request: OrchestrationRequest,
  depth: OrchestrationDepth,
  agentToolMap: Map<string, AgentToolWrapper>,
): AgentInferenceFn {
  const synthMaxTokens = depth === 'deep' ? 1500 : depth === 'shallow' ? 400 : 800;

  return async (req: AgentInferenceRequest): Promise<AgentInferenceResponse> => {
    const hasToolResults = req.messages.some((m) => m.role === 'tool');

    if (!hasToolResults) {
      // ── Planning turn ─────────────────────────────────────────────────────
      const planMessages: ChatMessage[] = [
        { role: 'system', content: PLANNER_SYSTEM_PROMPT },
        { role: 'user', content: req.messages.at(-1)?.content ?? request.query },
      ];

      const planResponse = await gatewayInfer({
        messages: planMessages,
        agentId: 'planner',
        domain: 'orchestration',
        strategy: 'fastest',
        maxTokens: 400,
      });

      const agentTasks = parseAgentPlan(planResponse.content, request.domains);
      const toolCalls = agentTasks
        .map((task) => {
          const agentId = DOMAIN_TO_AGENT[task.domain];
          const toolId = agentId ? `agent:${agentId}` : null;
          if (!toolId || !agentToolMap.has(toolId)) return null;
          return {
            toolId,
            toolName: task.domain,
            input: { input: `${task.task}\n\nOriginal query: ${request.query}` } as Record<
              string,
              unknown
            >,
            callId: randomUUID(),
          };
        })
        .filter((t): t is NonNullable<typeof t> => t !== null);

      return {
        content: planResponse.content,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        usage: {
          inputTokens: planResponse.usage.promptTokens,
          outputTokens: planResponse.usage.completionTokens,
          totalTokens: planResponse.usage.totalTokens,
        },
        costUsd: planResponse.estimatedCostUsd,
      };
    }

    // ── Synthesis turn ────────────────────────────────────────────────────────
    const toolResultText = req.messages
      .filter((m) => m.role === 'tool')
      .map((m) => {
        const label = m.toolName ? `## ${m.toolName.toUpperCase()} Analysis` : '## Analysis';
        return `${label}\n${m.content}`;
      })
      .join('\n\n---\n\n');

    const synthMessages: ChatMessage[] = [
      { role: 'system', content: SYNTHESIS_SYSTEM_PROMPT },
      { role: 'user', content: `Query: ${request.query}\n\n${toolResultText}` },
    ];

    const synthResponse = await gatewayInfer({
      messages: synthMessages,
      agentId: 'synthesizer',
      domain: 'orchestration',
      strategy: 'fastest',
      maxTokens: synthMaxTokens,
    });

    return {
      content: synthResponse.content,
      usage: {
        inputTokens: synthResponse.usage.promptTokens,
        outputTokens: synthResponse.usage.completionTokens,
        totalTokens: synthResponse.usage.totalTokens,
      },
      costUsd: synthResponse.estimatedCostUsd,
    };
  };
}

// ─── Domain tool builder ─────────────────────────────────────────────────────

/**
 * Creates an AgentToolWrapper for a domain specialist. Constructs a sub-AgentRunner
 * sharing the parent's inferenceFn, toolGateway, guardian, and runHooks, and records
 * step lifecycle + sub-runner usage on the provided AgentStep for accurate rollup.
 */
function buildTrackedDomainTool(
  agent: Agent,
  domainName: string,
  step: AgentStep,
  deps: {
    inferenceFn: AgentInferenceFn;
    toolGateway: ToolMeshGateway;
    runHooks: RunHooks;
    guardian: GuardianDecisionEngine;
  },
): AgentToolWrapper {
  const inputSchema = z.object({ input: z.string() });

  return {
    toolId: `agent:${agent.agentId}`,
    toolName: domainName,
    description: agent.description ?? `${agent.name} domain specialist`,
    inputSchema,
    invoke: async (rawInput: unknown, ctx: MutableRunContext): Promise<string> => {
      const parsed = inputSchema.safeParse(rawInput);
      const inputText =
        parsed.success && 'input' in (parsed.data as object)
          ? String((parsed.data as Record<string, unknown>).input)
          : JSON.stringify(rawInput);

      step.status = 'running';
      step.startedAt = Date.now();
      step.task = inputText;

      const subRunner = new AgentRunner({
        agent,
        ctx,
        inferenceFn: deps.inferenceFn,
        toolGateway: deps.toolGateway,
        guardian: deps.guardian,
        runHooks: deps.runHooks,
        maxTotalTurns: agent.maxTurns,
      });

      try {
        const result = await subRunner.run(inputText);
        step.status = 'completed';
        step.completedAt = Date.now();
        step.durationMs = step.completedAt - (step.startedAt ?? step.completedAt);
        step.result = result.output ?? '';
        // Capture usage for parent rollup
        step.tokensUsed = result.totalTokens;
        step.stepCostUsd = result.totalCostUsd;
        return result.output ?? '';
      } catch (err) {
        step.status = 'failed';
        step.completedAt = Date.now();
        step.durationMs = step.completedAt - (step.startedAt ?? step.completedAt);
        step.error = err instanceof Error ? err.message : String(err);
        throw err;
      }
    },
  };
}

// ─── Main orchestration entry point ──────────────────────────────────────────

let orchestrationCounter = 0;

/**
 * Main orchestration entry point — backward-compatible with the previous
 * hardcoded orchestrator.
 *
 * Uses manager pattern: planner agent dispatches to domain specialists via
 * agentTools, governed by Guardian per tool call, with Tool Mesh gateway
 * wired for any tool-mesh-registered tool IDs.
 */
export async function orchestrate(request: OrchestrationRequest): Promise<OrchestrationResult> {
  const orchestrationId = `orch-${Date.now()}-${++orchestrationCounter}`;
  const startTime = Date.now();
  const depth = request.depth ?? 'standard';

  logger.info(
    { orchestrationId, query: request.query.slice(0, 100), domains: request.domains, depth },
    'Orchestration started',
  );

  // ── Build domain specialist agentTools ────────────────────────────────────
  const domainInference = buildGatewayInferenceFn(depth);
  const steps: AgentStep[] = [];

  // Shared run hooks wired to both the planner runner and domain sub-runners
  const runHooks: RunHooks = {
    onHandoff: async (_ctx, data) => {
      logger.debug(
        { orchestrationId, from: data.fromAgentId, to: data.toAgentId },
        'Agent handoff during orchestration',
      );
    },
    onStepComplete: async (_ctx, data) => {
      logger.debug(
        { orchestrationId, agentId: data.agentId, turn: data.turnIndex, durationMs: data.durationMs },
        'Planner step complete',
      );
    },
  };

  const toolDeps = { inferenceFn: domainInference, toolGateway: defaultGateway, runHooks, guardian: defaultDecisionEngine };

  // Build domain tools using explicit AgentRunner wiring so all deps
  // (inferenceFn, toolGateway, guardian, runHooks) propagate to sub-runners
  const domainAgentTools: AgentToolWrapper[] = Object.entries(DOMAIN_TO_AGENT)
    .map(([domainName, agentId]) => {
      const agent = getAgent(agentId);
      if (!agent) return null;

      const step: AgentStep = {
        stepId: `${orchestrationId}-${domainName}`,
        agentId,
        domain: domainName,
        task: '',
        status: 'pending',
      };
      steps.push(step);

      return buildTrackedDomainTool(agent, domainName, step, toolDeps);
    })
    .filter((t): t is AgentToolWrapper => t !== null);

  if (domainAgentTools.length === 0) {
    return {
      orchestrationId,
      query: request.query,
      plan: { domains: [], depth, totalSteps: 0 },
      steps: [],
      synthesis: 'No domain agents available.',
      confidence: 0,
      totalDurationMs: Date.now() - startTime,
      totalTokens: 0,
      totalCostUsd: 0,
      status: 'failed',
    };
  }

  const agentToolMap = new Map(domainAgentTools.map((t) => [t.toolId, t]));

  // ── Run manager (planner + synthesizer) via AgentRunner ──────────────────
  const plannerCtx = createRunContext({
    sessionId: request.sessionId,
    domain: 'orchestration',
    metadata: { orchestrationId, role: 'planner-manager' },
  });

  const plannerRunner = new AgentRunner({
    agent: plannerAgent,
    ctx: plannerCtx,
    inferenceFn: buildManagerInferenceFn(request, depth, agentToolMap),
    agentTools: domainAgentTools,
    toolGateway: defaultGateway,
    guardian: defaultDecisionEngine,
    runHooks,
    maxTotalTurns: 4,
  });

  let synthesis = '';
  let totalTokens = 0;
  let totalCostUsd = 0;

  try {
    const result = await plannerRunner.run(request.query);
    synthesis = result.output ?? '';
    const domainTokens = steps.reduce((sum, s) => sum + (s.tokensUsed ?? 0), 0);
    const domainCostUsd = steps.reduce((sum, s) => sum + (s.stepCostUsd ?? 0), 0);
    totalTokens = result.totalTokens + domainTokens;
    totalCostUsd = result.totalCostUsd + domainCostUsd;
  } catch (err) {
    logger.error({ orchestrationId, err }, 'Manager orchestration run failed');
    const anyCompleted = steps.some((s) => s.status === 'completed');
    if (!anyCompleted) {
      return {
        orchestrationId,
        query: request.query,
        plan: { domains: [], depth, totalSteps: 0 },
        steps: steps.filter((s) => s.status !== 'pending'),
        synthesis: 'Orchestration failed.',
        confidence: 0,
        totalDurationMs: Date.now() - startTime,
        totalTokens: 0,
        totalCostUsd: 0,
        status: 'failed',
      };
    }
    // partial — synthesis from whatever completed
    const anyResults = steps
      .filter((s) => s.status === 'completed' && s.result)
      .map((s) => `**${s.domain}**: ${(s.result ?? '').slice(0, 300)}`)
      .join('\n\n');
    synthesis = anyResults || 'Partial results — synthesis unavailable.';
  }

  // Only include steps that were actually dispatched (not still pending)
  const dispatchedSteps = steps.filter((s) => s.status !== 'pending');
  const completedSteps = dispatchedSteps.filter((s) => s.status === 'completed');
  const confidence = dispatchedSteps.length > 0
    ? parseFloat((completedSteps.length / dispatchedSteps.length).toFixed(2))
    : 0.3;
  const status: OrchestrationResult['status'] =
    dispatchedSteps.length === 0
      ? 'failed'
      : completedSteps.length === dispatchedSteps.length
        ? 'completed'
        : completedSteps.length > 0
          ? 'partial'
          : 'failed';

  const result: OrchestrationResult = {
    orchestrationId,
    query: request.query,
    plan: {
      domains: dispatchedSteps.map((s) => s.domain),
      depth,
      totalSteps: dispatchedSteps.length,
    },
    steps: dispatchedSteps.map((s) => ({ ...s, gatewayResponse: undefined })),
    synthesis,
    confidence,
    totalDurationMs: Date.now() - startTime,
    totalTokens,
    totalCostUsd,
    status,
  };

  logger.info(
    {
      orchestrationId,
      status,
      dispatched: dispatchedSteps.length,
      completed: completedSteps.length,
      durationMs: result.totalDurationMs,
    },
    'Orchestration completed',
  );

  return result;
}

/**
 * Returns orchestrator capabilities — domains are sourced from the live
 * agent registry rather than the former hardcoded DOMAIN_AGENTS map.
 */
export function getOrchestratorCapabilities(): {
  domains: Array<{ name: string; capabilities: string[] }>;
  depthLevels: string[];
  maxConcurrentAgents: number;
} {
  return {
    domains: Object.entries(DOMAIN_TO_AGENT).map(([name, agentId]) => {
      const agent = getAgent(agentId);
      return {
        name,
        capabilities: agent?.tools.map((t) => t.toolId) ?? [],
      };
    }),
    depthLevels: ['shallow', 'standard', 'deep'],
    maxConcurrentAgents: 4,
  };
}
