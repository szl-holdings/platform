/**
 * Agent — first-class composable agent definition.
 *
 * Brings together: name, instructions (system prompt), tools (tool IDs from
 * tool-mesh), handoffs (other agents this agent can transfer to), guardrail
 * references, and lifecycle hooks.
 *
 * Includes `.asTool()` which exposes this agent as a callable tool so it can
 * be used inside a manager pattern where one agent dispatches to specialists.
 */

import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { GuardianDecisionEngine } from '@workspace/guardian';
import type { AgentHooks, ConversationMessage, HandoffData, RunHooks } from './hooks.js';
import type { MutableRunContext } from './run-context.js';

/** Minimal duck-typed gateway interface for propagating tool governance into asTool() sub-runners. */
export interface AgentSubrunnerGateway {
  invoke(
    toolId: string,
    input: Record<string, unknown>,
    ctx: { requestId: string; agentId: string; sessionId?: string; dryRun?: boolean },
  ): Promise<{ success: boolean; output?: unknown; error?: string }>;
}

export interface GuardrailConfig {
  id: string;
  description?: string;
}

export interface AgentHandoff {
  targetAgentId: string;
  description: string;
  /** Zod schema for structured handoff data. Optional — untyped if omitted. */
  dataSchema?: z.ZodTypeAny;
  /** 'full' passes the entire history; 'folded' summarises prior turns. */
  historyMode?: 'full' | 'folded';
}

export interface AgentTool {
  toolId: string;
  description?: string;
}

export interface AgentAsToolOptions {
  name: string;
  description: string;
  inputSchema?: z.ZodTypeAny;
  /** Inference function for the sub-AgentRunner. Required for real LLM responses. */
  inferenceFn?: AgentInferenceFn;
  /**
   * Optional runtime deps to propagate into the sub-AgentRunner. Pass these to
   * ensure the sub-runner inherits the same toolGateway, guardian, and lifecycle
   * hooks as the parent runner. Without them, governance and observability are
   * degraded. Prefer `AgentRunner.buildAgentTool()` when calling from within a
   * runner — it captures all deps automatically.
   */
  toolGateway?: AgentSubrunnerGateway;
  runHooks?: RunHooks;
  /** Guardian engine to inject into the sub-AgentRunner for consistent policy evaluation. */
  guardian?: GuardianDecisionEngine;
  maxTotalTurns?: number;
}

export interface AgentInferenceRequest {
  agentId: string;
  systemPrompt: string;
  messages: ConversationMessage[];
  tools?: AgentTool[];
  maxTokens?: number;
  ctx: MutableRunContext;
}

export interface AgentInferenceResponse {
  content: string;
  toolCalls?: Array<{ toolId: string; toolName: string; input: unknown; callId: string }>;
  handoffTarget?: string;
  handoffData?: unknown;
  usage?: { inputTokens: number; outputTokens: number; totalTokens: number };
  costUsd?: number;
}

export type AgentInferenceFn = (req: AgentInferenceRequest) => Promise<AgentInferenceResponse>;

export interface AgentToolWrapper {
  toolId: string;
  toolName: string;
  description: string;
  inputSchema: z.ZodTypeAny;
  invoke: (input: unknown, ctx: MutableRunContext) => Promise<string>;
}

export interface AgentDefinition {
  readonly agentId: string;
  readonly name: string;
  readonly description?: string;
  readonly instructions: string;
  readonly tools: AgentTool[];
  readonly handoffs: AgentHandoff[];
  readonly guardrails: GuardrailConfig[];
  readonly hooks?: AgentHooks;
  readonly maxTurns?: number;
}

/**
 * Agent class — wraps an AgentDefinition with runtime behaviour.
 */
export class Agent {
  readonly agentId: string;
  readonly name: string;
  readonly description: string | undefined;
  readonly instructions: string;
  readonly tools: AgentTool[];
  readonly handoffs: AgentHandoff[];
  readonly guardrails: GuardrailConfig[];
  readonly hooks: AgentHooks | undefined;
  readonly maxTurns: number;

  constructor(definition: AgentDefinition) {
    this.agentId = definition.agentId;
    this.name = definition.name;
    this.description = definition.description;
    this.instructions = definition.instructions;
    this.tools = definition.tools;
    this.handoffs = definition.handoffs;
    this.guardrails = definition.guardrails;
    this.hooks = definition.hooks;
    this.maxTurns = definition.maxTurns ?? 10;
  }

  /**
   * Expose this agent as a callable tool to be used inside another agent
   * (manager pattern). Pass `inferenceFn` so the sub-runner produces real LLM
   * responses — without it the sub-runner uses a no-op stub.
   *
   * For full dependency propagation (inferenceFn + toolGateway + guardian +
   * hooks) prefer `AgentRunner.buildAgentTool()` over this method.
   */
  asTool(options: AgentAsToolOptions): AgentToolWrapper {
    const inputSchema = options.inputSchema ?? z.object({ input: z.string() });
    const inferenceFn = options.inferenceFn;
    return {
      toolId: `agent:${this.agentId}`,
      toolName: options.name,
      description: options.description,
      inputSchema,
      invoke: async (rawInput: unknown, ctx: MutableRunContext): Promise<string> => {
        const parsed = inputSchema.safeParse(rawInput);
        const inputText =
          parsed.success && 'input' in (parsed.data as object)
            ? String((parsed.data as Record<string, unknown>).input)
            : JSON.stringify(rawInput);

        const { AgentRunner } = await import('./agent-runner.js');
        const runner = new AgentRunner({
          agent: this,
          ctx,
          inferenceFn,
          toolGateway: options.toolGateway,
          runHooks: options.runHooks,
          guardian: options.guardian,
          maxTotalTurns: options.maxTotalTurns,
        });
        const result = await runner.run(inputText);
        return result.output ?? '';
      },
    };
  }

  /**
   * Return the handoff config for a given target agent ID, or undefined.
   */
  getHandoff(targetAgentId: string): AgentHandoff | undefined {
    return this.handoffs.find((h) => h.targetAgentId === targetAgentId);
  }

  /**
   * Validate that a handoff to the given agent is declared on this agent.
   * Guardian policy enforcement happens in AgentRunner, but structural
   * validity is checked here.
   */
  canHandoffTo(targetAgentId: string): boolean {
    return this.handoffs.some((h) => h.targetAgentId === targetAgentId);
  }
}

/**
 * Agent registry — a process-wide map of all registered agents.
 */
const _registry = new Map<string, Agent>();

export function registerAgent(agent: Agent): void {
  _registry.set(agent.agentId, agent);
}

export function getAgent(agentId: string): Agent | undefined {
  return _registry.get(agentId);
}

export function listAgents(): Agent[] {
  return Array.from(_registry.values());
}

// ─── Domain Agent Definitions ────────────────────────────────────────────────

export const vesselAgent = new Agent({
  agentId: 'vessels',
  name: 'Vessels Maritime Intelligence',
  description: 'Maritime fleet tracking, AIS signal analysis, sanctions risk, and route economics.',
  instructions:
    'You are a maritime intelligence analyst. Analyze vessel data, AIS signals, sanctions risk, and route economics. Be precise and cite specific data points.',
  tools: [
    { toolId: 'vessels.fleetTrack', description: 'Track vessel fleet positions' },
    { toolId: 'vessels.sanctionsScreen', description: 'Screen vessels against sanctions lists' },
    { toolId: 'vessels.routeAnalysis', description: 'Analyze route economics and chokepoints' },
  ],
  handoffs: [
    {
      targetAgentId: 'sentra',
      description: 'Hand off to Sentra when vessel activity indicates cyber or security threat',
      historyMode: 'full',
    },
    {
      targetAgentId: 'counsel',
      description: 'Hand off to Counsel when sanctions or legal risk is detected',
      historyMode: 'full',
    },
  ],
  guardrails: [{ id: 'sanctions-data-pii', description: 'PII scan on vessel owner data' }],
});

export const sentraAgent = new Agent({
  agentId: 'sentra',
  name: 'Sentra Cyber Resilience',
  description: 'Cybersecurity threat analysis, vulnerability assessment, incident response.',
  instructions:
    'You are a cybersecurity threat analyst. Assess vulnerabilities, attack surfaces, CVEs, and penetration test results. Prioritize by risk severity.',
  tools: [
    { toolId: 'sentra.vulnScan', description: 'Scan for vulnerabilities' },
    { toolId: 'sentra.threatDetect', description: 'Detect active threats' },
    { toolId: 'sentra.riskScore', description: 'Score risk severity' },
  ],
  handoffs: [
    {
      targetAgentId: 'counsel',
      description: 'Hand off to Counsel when a security incident has legal implications',
      historyMode: 'full',
    },
  ],
  guardrails: [{ id: 'cve-data-sensitivity', description: 'Sensitivity check on CVE details' }],
});

export const terraAgent = new Agent({
  agentId: 'terra',
  name: 'Terra Real Estate Intelligence',
  description: 'Real estate market analysis, property scoring, distress detection, investment recommendations.',
  instructions:
    'You are a real estate market intelligence analyst. Evaluate property data, market trends, distress signals, and investment opportunities.',
  tools: [
    { toolId: 'terra.marketAnalysis', description: 'Analyze real estate markets' },
    { toolId: 'terra.propertyScore', description: 'Score individual properties' },
    { toolId: 'terra.distressDetect', description: 'Detect distressed assets' },
  ],
  handoffs: [
    {
      targetAgentId: 'counsel',
      description: 'Hand off to Counsel for legal due diligence on acquisitions',
      historyMode: 'full',
    },
  ],
  guardrails: [{ id: 'property-pii', description: 'PII scan on owner data' }],
});

export const counselAgent = new Agent({
  agentId: 'counsel',
  name: 'Counsel Legal Intelligence',
  description: 'Legal matter analysis, contract review, compliance, regulatory risk.',
  instructions:
    'You are a legal intelligence analyst. Review contracts, assess regulatory compliance, evaluate legal risk, and provide structured legal guidance.',
  tools: [
    { toolId: 'counsel.contractReview', description: 'Review contracts for risk' },
    { toolId: 'counsel.complianceCheck', description: 'Check regulatory compliance' },
    { toolId: 'counsel.sanctionsLegal', description: 'Assess sanctions legal exposure' },
  ],
  handoffs: [],
  guardrails: [
    { id: 'legal-privilege', description: 'Attorney-client privilege classification' },
    { id: 'legal-pii', description: 'PII detection in legal documents' },
  ],
});

export const lyteAgent = new Agent({
  agentId: 'lyte',
  name: 'Lyte Decision Intelligence',
  description: 'System health, SLO compliance, observability, incident diagnosis.',
  instructions:
    'You are an SRE and observability expert. Analyze system health, service reliability, SLO compliance, and incident patterns.',
  tools: [
    { toolId: 'lyte.healthCheck', description: 'Check service health' },
    { toolId: 'lyte.sloAnalysis', description: 'Analyze SLO compliance' },
    { toolId: 'lyte.incidentDiag', description: 'Diagnose incidents' },
  ],
  handoffs: [
    {
      targetAgentId: 'sentra',
      description: 'Hand off to Sentra if an incident appears security-related',
      historyMode: 'full',
    },
  ],
  guardrails: [],
});

export const alloyAgent = new Agent({
  agentId: 'alloy',
  name: 'A11oy Brand Orchestration',
  description: 'Workflow execution, signal routing, artifact quality, orchestration health.',
  instructions:
    'You are an Alloy intelligence analyst. Evaluate workflow execution, signal patterns, artifact quality, and operational orchestration across the SZL ecosystem.',
  tools: [
    { toolId: 'alloy.workflowAnalysis', description: 'Analyze workflow execution' },
    { toolId: 'alloy.signalRoute', description: 'Route signals to handlers' },
    { toolId: 'alloy.artifactReview', description: 'Review artifact quality' },
  ],
  handoffs: [
    { targetAgentId: 'vessels', description: 'Delegate maritime queries to Vessels', historyMode: 'full' },
    { targetAgentId: 'sentra', description: 'Delegate cyber queries to Sentra', historyMode: 'full' },
    { targetAgentId: 'terra', description: 'Delegate real estate queries to Terra', historyMode: 'full' },
    { targetAgentId: 'counsel', description: 'Delegate legal queries to Counsel', historyMode: 'full' },
    { targetAgentId: 'lyte', description: 'Delegate observability queries to Lyte', historyMode: 'full' },
  ],
  guardrails: [],
});

/**
 * Planner agent — acts as the manager in Manager mode, dispatching to domain
 * specialists via .asTool() and synthesizing the results.
 */
export const plannerAgent = new Agent({
  agentId: 'planner',
  name: 'Orchestration Planner',
  description: 'Decomposes user queries and dispatches to domain specialist agents.',
  instructions: `You are the SZL Orchestration Planner. Given a user query, determine which domain specialists are needed and what each should analyze. You have access to specialist agents as tools. Call each relevant specialist tool with the specific sub-task. After receiving all specialist outputs, synthesize a unified executive briefing structured as:

1. **Key Finding** — The single most important insight
2. **Cross-Domain Connections** — How findings relate across domains
3. **Risk Assessment** — Overall risk level and specific concerns
4. **Recommended Actions** — Concrete next steps, prioritized

Be concise, specific, and actionable.`,
  tools: [],
  handoffs: [],
  guardrails: [],
});

// Register all domain agents in the global registry
registerAgent(vesselAgent);
registerAgent(sentraAgent);
registerAgent(terraAgent);
registerAgent(counselAgent);
registerAgent(lyteAgent);
registerAgent(alloyAgent);
registerAgent(plannerAgent);
