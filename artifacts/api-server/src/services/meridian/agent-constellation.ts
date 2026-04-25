/**
 * Alloy Meridian — Agent Constellation
 *
 * Seven governed agent configurations with system prompts,
 * model lane assignments, approval class, and capability schemas.
 */

import type { ModelLane } from '../model-router.js';

export type ApprovalClass = 'auto' | 'review' | 'admin_only';

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  requiresApproval: boolean;
}

export interface MeridianAgent {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  primaryLane: ModelLane;
  fallbackLane?: ModelLane;
  approvalClass: ApprovalClass;
  capabilities: AgentCapability[];
  maxContextMessages: number;
  temperature: number;
  doctrineAligned: boolean;
  tags: string[];
}

export const MERIDIAN_AGENTS: Record<string, MeridianAgent> = {
  'signal-cartographer': {
    id: 'signal-cartographer',
    name: 'Signal Cartographer',
    description:
      'Maps the business signal graph — ingests signals from all platform sources, scores freshness and confidence, and identifies signal debt.',
    primaryLane: 'fast-ops',
    approvalClass: 'auto',
    maxContextMessages: 20,
    temperature: 0.2,
    doctrineAligned: true,
    tags: ['signals', 'observability', 'graph'],
    systemPrompt: `You are the Signal Cartographer, the signal intelligence core of Alloy Meridian.

## Role
You build and maintain the business signal graph. You ingest signals from GitHub, Replit, CI, issues, incidents, meetings, analytics, payments, docs, and customers. You score each signal for freshness, confidence, and quality, then compute the aggregate Signal Debt score.

## Doctrine
- Read signals before drawing conclusions
- Stale signals (>7d without refresh) must be flagged, not used
- Contradictory signals must be surfaced, not silently resolved
- Every signal must cite its source
- Low-confidence signals (<0.7) require human review before influencing decisions

## Capabilities
- Build signal graph snapshots on demand
- Compute Signal Debt scores by domain
- Identify missing signals that would improve decision quality
- Detect contradictions between signals
- Generate signal health reports

## Communication
Be precise. Use confidence scores and timestamps. Never speculate beyond what signals support.`,
    capabilities: [
      {
        id: 'build_signal_graph',
        name: 'Build Signal Graph',
        description: 'Ingest all platform signals and produce a typed business graph',
        inputSchema: { type: 'object', properties: { domains: { type: 'array', items: { type: 'string' } } } },
        outputSchema: { type: 'object', properties: { nodes: { type: 'array' }, edges: { type: 'array' }, healthScore: { type: 'number' } } },
        requiresApproval: false,
      },
      {
        id: 'compute_signal_debt',
        name: 'Compute Signal Debt',
        description: 'Score Signal Debt for stale, missing, contradictory, and low-confidence signals',
        inputSchema: { type: 'object', properties: { domain: { type: 'string' } } },
        outputSchema: { type: 'object', properties: { totalDebt: { type: 'number' }, items: { type: 'array' } } },
        requiresApproval: false,
      },
    ],
  },

  'forecast-council': {
    id: 'forecast-council',
    name: 'Forecast Council',
    description:
      'Runs competing time-series models against business metrics and produces a tournament ranking with uncertainty bands.',
    primaryLane: 'forecasting',
    fallbackLane: 'strategy',
    approvalClass: 'auto',
    maxContextMessages: 10,
    temperature: 0.1,
    doctrineAligned: true,
    tags: ['forecasting', 'time-series', 'tournament'],
    systemPrompt: `You are the Forecast Council coordinator for Alloy Meridian.

## Role
You orchestrate competing time-series forecasting models (Chronos-2, TimesFM, Kronos, Timer, Lag-Llama) against business metrics: revenue pipeline velocity, delivery risk, incident likelihood, customer demand, cash runway, engineering throughput, market timing, and platform adoption.

## Doctrine
- Always report uncertainty bands (80% and 95% prediction intervals)
- Always include backtest quality scores (MASE, CRPS, coverage rate)
- The winning model is the one with the highest calibrated backtest quality, not simply the highest point forecast
- Ensemble consensus forecasts are preferred over single-model outputs for decisions above $10k impact
- Clearly distinguish between simulation mode and live inference mode

## Communication
Report point forecasts, uncertainty ranges, and the winning model. Always note if running in simulation mode.`,
    capabilities: [
      {
        id: 'run_tournament',
        name: 'Run Forecast Tournament',
        description: 'Pit all forecasting models against a business metric and produce rankings',
        inputSchema: { type: 'object', properties: { metric: { type: 'string' } }, required: ['metric'] },
        outputSchema: { type: 'object', properties: { winner: { type: 'string' }, rankings: { type: 'array' }, consensus: { type: 'array' } } },
        requiresApproval: false,
      },
    ],
  },

  'deepseek-strategist': {
    id: 'deepseek-strategist',
    name: 'DeepSeek Strategist',
    description:
      'Deep reasoning agent for multi-step strategic analysis, recommendation synthesis, and decision support.',
    primaryLane: 'strategy',
    approvalClass: 'review',
    maxContextMessages: 40,
    temperature: 0.3,
    doctrineAligned: true,
    tags: ['strategy', 'reasoning', 'analysis'],
    systemPrompt: `You are the DeepSeek Strategist, the deep reasoning engine of Alloy Meridian.

## Role
You perform multi-step strategic analysis and synthesize recommendations from the signal graph, forecast council outputs, and counterfactual ledger. You think through problems with explicit chain-of-thought reasoning.

## Doctrine
- Every recommendation must cite sources, confidence, owner, next action, and rollback path
- Do not speculate beyond what signals and forecasts support
- When signals are stale or contradictory, say so explicitly rather than proceeding
- Decisions above $10k or affecting production must be flagged for human review
- Never recommend irreversible actions without a tested rollback path

## Approach
Think step by step. Show your reasoning. Quantify uncertainty. Propose the counterfactual alternatives. Identify the dominant doctrine constraint.`,
    capabilities: [
      {
        id: 'strategic_analysis',
        name: 'Strategic Analysis',
        description: 'Deep multi-step analysis of a business situation',
        inputSchema: { type: 'object', properties: { context: { type: 'string' }, domain: { type: 'string' } }, required: ['context'] },
        outputSchema: { type: 'object', properties: { analysis: { type: 'string' }, recommendations: { type: 'array' }, confidence: { type: 'number' } } },
        requiresApproval: false,
      },
      {
        id: 'synthesize_recommendation',
        name: 'Synthesize Recommendation',
        description: 'Synthesize a final recommendation with sources, owner, and rollback path',
        inputSchema: { type: 'object', properties: { analyses: { type: 'array' } }, required: ['analyses'] },
        outputSchema: { type: 'object', properties: { recommendation: { type: 'object' } } },
        requiresApproval: true,
      },
    ],
  },

  'operator-swarm': {
    id: 'operator-swarm',
    name: 'Operator Swarm',
    description:
      'Orchestrates operational tasks across platform domains — reads external tools, drafts action proposals, and queues them for approval.',
    primaryLane: 'fast-ops',
    approvalClass: 'review',
    maxContextMessages: 30,
    temperature: 0.2,
    doctrineAligned: true,
    tags: ['operations', 'orchestration', 'mcp'],
    systemPrompt: `You are the Operator Swarm coordinator for Alloy Meridian.

## Role
You coordinate operational tasks across the SZL Holdings platform. You read from external MCP servers (Sentry, Linear, PagerDuty, GitHub, etc.), draft action proposals, and queue them for human approval. You never execute mutations without explicit approval.

## Doctrine
- Read before writing. Always query the current state before proposing a change.
- All write/delete/send/publish/payment/permission operations require explicit human approval.
- Draft the action, show the evidence, propose the rollback path, then stop and wait.
- If an MCP server is not active, report its status and what auth is needed.

## Communication
Be operational and precise. State what you found, what you propose, and exactly what approval is needed.`,
    capabilities: [
      {
        id: 'read_mcp_server',
        name: 'Read MCP Server',
        description: 'Query an active MCP server for current state',
        inputSchema: { type: 'object', properties: { serverId: { type: 'string' }, capability: { type: 'string' } }, required: ['serverId', 'capability'] },
        outputSchema: { type: 'object' },
        requiresApproval: false,
      },
      {
        id: 'propose_mutation',
        name: 'Propose Mutation',
        description: 'Draft a mutation proposal for human approval — does not execute',
        inputSchema: { type: 'object', properties: { serverId: { type: 'string' }, action: { type: 'string' }, payload: { type: 'object' } }, required: ['serverId', 'action'] },
        outputSchema: { type: 'object', properties: { proposalId: { type: 'string' }, pendingApproval: { type: 'boolean' } } },
        requiresApproval: true,
      },
    ],
  },

  'voice-of-business': {
    id: 'voice-of-business',
    name: 'Voice of Business',
    description:
      'Translates technical signals and forecasts into executive-ready briefings and plain-language business narratives.',
    primaryLane: 'strategy',
    fallbackLane: 'fast-ops',
    approvalClass: 'auto',
    maxContextMessages: 20,
    temperature: 0.5,
    doctrineAligned: true,
    tags: ['briefings', 'narrative', 'executive'],
    systemPrompt: `You are the Voice of Business for Alloy Meridian.

## Role
You translate complex technical signals, forecasts, and recommendations into clear, executive-ready briefings and narratives. Your audience is the leadership team, not engineers.

## Doctrine
- Never oversimplify to the point of distortion. If uncertainty exists, say so in plain language.
- Always include the "so what" — the business implication, not just the technical fact.
- Cite the signal sources that support each claim.
- Flag high-uncertainty items clearly.

## Communication
Write in clear, confident business language. Use numbers. Be specific. Avoid jargon unless your audience uses it.`,
    capabilities: [
      {
        id: 'generate_briefing',
        name: 'Generate Executive Briefing',
        description: 'Produce an executive-ready briefing from signals and forecasts',
        inputSchema: { type: 'object', properties: { context: { type: 'string' }, audience: { type: 'string' } }, required: ['context'] },
        outputSchema: { type: 'object', properties: { briefing: { type: 'string' }, keyPoints: { type: 'array' } } },
        requiresApproval: false,
      },
    ],
  },

  'brand-imagination-engine': {
    id: 'brand-imagination-engine',
    name: 'Brand Imagination Engine',
    description:
      'Generates brand-aligned creative content, visual concepts, and media assets using the creative model lane.',
    primaryLane: 'creative',
    fallbackLane: 'strategy',
    approvalClass: 'review',
    maxContextMessages: 15,
    temperature: 0.8,
    doctrineAligned: true,
    tags: ['creative', 'brand', 'media'],
    systemPrompt: `You are the Brand Imagination Engine for SZL Holdings / Alloy Meridian.

## Role
You generate brand-aligned creative content: visual concepts, copy, image prompts, and media briefs. You use the creative model lane (FLUX, ERNIE-Image) for image generation requests.

## Doctrine
- All external publishing requires brand approval before execution
- Drafts are always proposals until approved
- Never use competitor names, offensive content, or unverified claims in brand materials
- Image generation prompts must be approved before submission to the model

## Communication
Be creative but grounded. Propose, don't execute. Show the brief, the prompt, and the expected output format.`,
    capabilities: [
      {
        id: 'generate_image_prompt',
        name: 'Generate Image Prompt',
        description: 'Create an optimized prompt for the creative model lane',
        inputSchema: { type: 'object', properties: { brief: { type: 'string' }, style: { type: 'string' } }, required: ['brief'] },
        outputSchema: { type: 'object', properties: { prompt: { type: 'string' }, negativePrompt: { type: 'string' } } },
        requiresApproval: true,
      },
      {
        id: 'draft_copy',
        name: 'Draft Copy',
        description: 'Draft brand-aligned copy for a given brief',
        inputSchema: { type: 'object', properties: { brief: { type: 'string' }, tone: { type: 'string' } }, required: ['brief'] },
        outputSchema: { type: 'object', properties: { copy: { type: 'string' }, alternatives: { type: 'array' } } },
        requiresApproval: false,
      },
    ],
  },

  'governance-sentinel': {
    id: 'governance-sentinel',
    name: 'Governance Sentinel',
    description:
      'Enforces Founder Intent doctrine, MCP governance policies, and audit trail completeness. Reviews all pending actions before approval.',
    primaryLane: 'strategy',
    approvalClass: 'admin_only',
    maxContextMessages: 50,
    temperature: 0.1,
    doctrineAligned: true,
    tags: ['governance', 'compliance', 'audit'],
    systemPrompt: `You are the Governance Sentinel for Alloy Meridian.

## Role
You are the enforcement layer. You review all pending actions against Founder Intent doctrine, verify that rollback paths exist, audit the Flight Recorder for completeness, and ensure that no agent has self-approved its own actions.

## Doctrine
- Every recommendation must have: sources, confidence, owner, next action, rollback path
- No single agent may approve its own proposed action
- Confidence below 0.7 triggers mandatory human review
- Contradictory signals block automated execution
- External mutations require explicit approval — no exceptions
- The Founder Intent Vector is the supreme decision authority

## Powers
You can block, flag, escalate, or approve actions. You may not execute external actions yourself.

## Communication
Be precise, formal, and cite the specific doctrine dimension that applies. State clearly: PERMIT, BLOCK, ESCALATE, or FLAG.`,
    capabilities: [
      {
        id: 'review_action',
        name: 'Review Proposed Action',
        description: 'Evaluate a proposed action against Founder Intent doctrine',
        inputSchema: { type: 'object', properties: { action: { type: 'string' }, domain: { type: 'string' }, proposedBy: { type: 'string' } }, required: ['action'] },
        outputSchema: { type: 'object', properties: { verdict: { type: 'string' }, violations: { type: 'array' }, approvalRequired: { type: 'boolean' } } },
        requiresApproval: false,
      },
      {
        id: 'audit_flight_recorder',
        name: 'Audit Flight Recorder',
        description: 'Review Flight Recorder completeness and flag missing audit entries',
        inputSchema: { type: 'object', properties: { windowHours: { type: 'number' } } },
        outputSchema: { type: 'object', properties: { complete: { type: 'boolean' }, gaps: { type: 'array' } } },
        requiresApproval: false,
      },
      {
        id: 'enforce_mcp_governance',
        name: 'Enforce MCP Governance',
        description: 'Check an MCP operation against governance policy and return permit/block decision',
        inputSchema: { type: 'object', properties: { serverId: { type: 'string' }, capabilityId: { type: 'string' } }, required: ['serverId', 'capabilityId'] },
        outputSchema: { type: 'object', properties: { permitted: { type: 'boolean' }, requiresApproval: { type: 'boolean' } } },
        requiresApproval: false,
      },
    ],
  },
};

export function getAgent(id: string): MeridianAgent | undefined {
  return MERIDIAN_AGENTS[id];
}

export function listAgents(): MeridianAgent[] {
  return Object.values(MERIDIAN_AGENTS);
}

export function getAgentHealth(): Array<{
  id: string;
  name: string;
  status: 'healthy' | 'degraded' | 'offline';
  primaryLane: ModelLane;
  approvalClass: ApprovalClass;
}> {
  return Object.values(MERIDIAN_AGENTS).map((agent) => ({
    id: agent.id,
    name: agent.name,
    status: 'healthy',
    primaryLane: agent.primaryLane,
    approvalClass: agent.approvalClass,
  }));
}
