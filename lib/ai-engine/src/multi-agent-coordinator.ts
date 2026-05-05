/**
 * Multi-Agent Coordinator
 *
 * Provides a coordinator-agent pattern that decomposes a complex task into
 * sub-tasks, delegates each to a specialist agent from the A2A registry, and
 * merges results into a single synthesised answer.
 *
 * Every delegation step is annotated with a proof-chain entry so the full
 * reasoning trace is auditable.
 *
 * Architecture:
 *   CoordinatorAgent.run(objective)
 *     ├─ decompose(objective) → SubTask[]
 *     ├─ for each SubTask: discoverAgent() → agentId
 *     ├─ delegate(agentId, subTask) → SubTaskResult
 *     └─ synthesise(SubTaskResult[]) → final answer
 */

import { randomUUID } from 'node:crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AgentRole = 'retrieval' | 'forecasting' | 'document' | 'speech' | 'general';

/**
 * Trust Tier ladder — matches the 5-level ladder in Trust Tier Enforcer hook.
 *
 * 0  Read-only:            knowledge retrieval and analysis only
 * 1  Plan-only:            may draft plans; no side-effecting tools until plan is signed
 * 2  Auto-approve-low-risk: low-risk tool calls auto-approved; high-risk gated to HITL
 * 3  HITL-required:        every material action gated to human-in-the-loop approval queue
 * 4  Sovereign/Air-gapped: no external API calls; all actions operator-supervised
 */
export type TrustTier = 0 | 1 | 2 | 3 | 4;

export type PermissionMode =
  | 'read-only'           // tier 0
  | 'plan-only'           // tier 1
  | 'auto-approve-low-risk' // tier 2
  | 'hitl-required'       // tier 3
  | 'sovereign-air-gapped'; // tier 4

/** Subagent spawn contract — every spawned subagent must declare this fully. */
export interface SubagentContract {
  /** Unique ID for the spawned subagent. */
  subagentId: string;
  /** Model to use. Explicit model specification is required. */
  model: string;
  /** Explicit allowlist of tool names the subagent may call. */
  allowedTools: string[];
  /** Explicit blocklist of tools denied even if in allowedTools. */
  blockedTools?: string[];
  /**
   * Allowlist of MCP server IDs the subagent may connect to.
   * Empty array = no MCP servers permitted for this subagent.
   */
  allowedMcpServers: string[];
  /** Permission mode — determines which hooks fire on PreToolUse. */
  permissionMode: PermissionMode;
  /** Trust tier — must not exceed parent agent's trust tier. */
  trustTier: TrustTier;
  /**
   * Proof of parent agent's identity — bound to the parent's current run so
   * trust tier escalation can be detected and blocked by hooks.
   */
  parentProofId: string;
  /** Cross-surface session identifier threaded from the originating request. */
  sessionId: string;
}

export interface SubTask {
  taskId: string;
  role: AgentRole;
  instruction: string;
  context?: Record<string, unknown>;
  priority: number;
}

export interface SubTaskResult {
  taskId: string;
  agentId: string;
  agentName: string;
  role: AgentRole;
  output: string;
  success: boolean;
  durationMs: number;
  proofEntryId: string;
  sessionId: string;
}

export interface CoordinatorStep {
  stepId: string;
  type: 'decompose' | 'delegate' | 'synthesise';
  agentId?: string;
  taskId?: string;
  summary: string;
  durationMs: number;
  timestamp: string;
}

export interface CoordinatorRunResult {
  runId: string;
  sessionId: string;
  objective: string;
  steps: CoordinatorStep[];
  subTaskResults: SubTaskResult[];
  answer: string;
  success: boolean;
  totalDurationMs: number;
  agentsInvolved: string[];
}

export interface CoordinatorRunOptions {
  /** Domain hint for A2A agent discovery (e.g. 'maritime', 'legal', 'revenue'). */
  domain?: string;
  /**
   * Cross-surface session identifier — propagated to every subagent spawn
   * contract and proof chain entry so the full run is traceable across surfaces.
   */
  sessionId?: string;
  /**
   * Trust tier ceiling for all spawned subagents.
   * Defaults to 3 (HITL-required) if not specified.
   */
  trustTier?: TrustTier;
  /**
   * Permission mode applied to all spawned subagents.
   * Defaults to 'hitl-required' if not specified.
   */
  permissionMode?: PermissionMode;
}

// ---------------------------------------------------------------------------
// Specialist Agent Executor — pluggable via injection or defaults to
// the A2A registry + DomainAgentRunner pipeline.
// ---------------------------------------------------------------------------

export type SpecialistExecutor = (
  agentId: string,
  instruction: string,
  context?: Record<string, unknown>,
) => Promise<{ output: string; success: boolean }>;

// ---------------------------------------------------------------------------
// Role → capability keyword mapping for A2A discovery
// ---------------------------------------------------------------------------

const ROLE_CAPABILITIES: Record<AgentRole, string> = {
  retrieval: 'retrieval knowledge search rag',
  forecasting: 'forecasting prediction risk monte-carlo',
  document: 'document analysis summarisation extraction',
  speech: 'speech audio transcript sentiment',
  general: 'analysis intelligence reasoning',
};

// ---------------------------------------------------------------------------
// Role → explicit tool allowlist (SubagentContract.allowedTools)
// Each role declares only the tools it is permitted to invoke.
// ---------------------------------------------------------------------------

const ROLE_TOOL_ALLOWLIST: Record<AgentRole, string[]> = {
  retrieval:   ['knowledge_search', 'rag_retrieve', 'document_fetch', 'context_lookup', 'embedding_search'],
  forecasting: ['forecast_model', 'monte_carlo_run', 'risk_assess', 'market_data_fetch', 'scenario_run'],
  document:    ['document_retrieve', 'document_analyse', 'clause_extract', 'deadline_monitor', 'docket_search'],
  speech:      ['audio_transcript', 'sentiment_score', 'speech_summarise'],
  general:     ['knowledge_search', 'signal_classify', 'eval_score', 'policy_lookup'],
};

// ---------------------------------------------------------------------------
// Decomposer — breaks an objective into typed sub-tasks
// ---------------------------------------------------------------------------

function decompose(objective: string): SubTask[] {
  const lower = objective.toLowerCase();
  const tasks: SubTask[] = [];

  // Retrieval sub-task — always needed for grounding
  tasks.push({
    taskId: randomUUID(),
    role: 'retrieval',
    instruction: `Retrieve relevant facts, documents, and prior context for: ${objective}`,
    priority: 1,
  });

  // Forecasting sub-task — when financial/risk language detected
  if (/risk|forecast|predict|scenario|portfolio|market|yield|spread|rate/.test(lower)) {
    tasks.push({
      taskId: randomUUID(),
      role: 'forecasting',
      instruction: `Produce a probabilistic forecast or risk assessment for: ${objective}`,
      priority: 2,
    });
  }

  // Document sub-task — when document/legal/compliance language detected
  if (/document|contract|agreement|clause|compliance|filing|matter|case|brief/.test(lower)) {
    tasks.push({
      taskId: randomUUID(),
      role: 'document',
      instruction: `Analyse relevant documents and extract key findings for: ${objective}`,
      priority: 2,
    });
  }

  // Synthesis is always the final step — handled separately
  return tasks.sort((a, b) => a.priority - b.priority);
}

// ---------------------------------------------------------------------------
// Proof-chain annotation
// ---------------------------------------------------------------------------

async function annotateProofChain(entry: {
  runId: string;
  taskId: string;
  agentId: string;
  instruction: string;
  output: string;
  success: boolean;
  /** Cross-surface session identifier — threaded from originating request. */
  sessionId?: string;
}): Promise<string> {
  const proofEntryId = `proof-${randomUUID()}`;
  try {
    const { tagAIContent } = await import('@szl-holdings/proof-chain');
    await tagAIContent({
      contentId: proofEntryId,
      contentType: 'multi_agent_delegation',
      sourceClass: 'system_computed',
      correlationId: entry.runId,
      serviceAttribution: entry.agentId,
      metadata: {
        taskId: entry.taskId,
        sessionId: entry.sessionId,
        instruction: entry.instruction.slice(0, 500),
        outputPreview: entry.output.slice(0, 300),
        success: entry.success,
      },
    });
  } catch {
    // proof-chain is best-effort — never block the coordinator run
  }
  return proofEntryId;
}

// ---------------------------------------------------------------------------
// Default specialist executor — tries A2A registry, falls back gracefully
// ---------------------------------------------------------------------------

const defaultExecutor: SpecialistExecutor = async (agentId, instruction, _context) => {
  try {
    // Look up agent capabilities from the A2A registry to customise the system prompt.
    let systemPrompt = `You are a specialist AI agent. Answer concisely and factually.`;

    try {
      const { a2aRegistry } = await import('./a2a-registry.js');
      const card = await a2aRegistry.getAgentCard(agentId);
      if (card) {
        systemPrompt = `You are a specialist ${card.domain} AI agent. Answer concisely and factually.\n\nCapabilities: ${card.capabilities.join(', ')}`;
      }
    } catch {
      // A2A registry unavailable — use generic system prompt
    }

    // Route all LLM calls through the Anthropic proxy (covenant:anthropic-proxy-only).
    // This satisfies the SubagentContract model declaration and the Rego policy
    // that blocks any direct non-proxy provider calls.
    const { anthropic } = await import('./providers/anthropic/client.js');
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: instruction }],
    });

    const block = response.content[0];
    const output = (block?.type === 'text' ? block.text : null) ?? '[No response]';
    return { output, success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Executor error';
    return { output: `[Delegation error for ${agentId}]: ${msg}`, success: false };
  }
};

// ---------------------------------------------------------------------------
// CoordinatorAgent class
// ---------------------------------------------------------------------------

export class CoordinatorAgent {
  private readonly executor: SpecialistExecutor;

  constructor(executor: SpecialistExecutor = defaultExecutor) {
    this.executor = executor;
  }

  /**
   * Run a coordinated multi-agent pipeline for the given objective.
   * Returns a structured result with sub-task outputs and a synthesised answer.
   *
   * `options.sessionId` is threaded through every subagent spawn contract and
   * proof chain entry so the full run is traceable across surfaces.
   */
  async run(
    objective: string,
    optionsOrDomain?: string | CoordinatorRunOptions,
  ): Promise<CoordinatorRunResult> {
    // Backwards-compatible: accept legacy `domain` string or new options object.
    const options: CoordinatorRunOptions =
      typeof optionsOrDomain === 'string'
        ? { domain: optionsOrDomain }
        : (optionsOrDomain ?? {});

    const { domain, sessionId: callerSessionId, trustTier = 3, permissionMode = 'hitl-required' } = options;
    const runId = randomUUID();
    const sessionId = callerSessionId ?? `sess-${runId.slice(0, 8)}`;
    const parentProofId = `parent-proof-${runId}`;
    const startMs = Date.now();
    const steps: CoordinatorStep[] = [];
    const subTaskResults: SubTaskResult[] = [];
    const agentsInvolved = new Set<string>();

    // ── Decompose ─────────────────────────────────────────────────────────
    const decomposeStart = Date.now();
    const subTasks = decompose(objective);
    steps.push({
      stepId: randomUUID(),
      type: 'decompose',
      summary: `Decomposed into ${subTasks.length} sub-task(s): ${subTasks.map((t) => t.role).join(', ')}`,
      durationMs: Date.now() - decomposeStart,
      timestamp: new Date().toISOString(),
    });

    // ── Delegate ──────────────────────────────────────────────────────────
    for (const subTask of subTasks) {
      const delegateStart = Date.now();

      // Discover the best agent for this role
      let agentId = `specialist-${subTask.role}`;
      let agentName = `${subTask.role.charAt(0).toUpperCase() + subTask.role.slice(1)} Specialist`;

      try {
        const { a2aRegistry } = await import('./a2a-registry.js');
        const results = await a2aRegistry.discover({
          queryText: ROLE_CAPABILITIES[subTask.role],
          domain,
          maxResults: 3,
          requireOnline: true,
        });
        if (results[0]) {
          agentId = results[0].agentId;
          agentName = results[0].name;
        }
      } catch {
        // Discovery failure — use fallback agentId
      }

      agentsInvolved.add(agentId);

      // Build the subagent spawn contract — every spawn must declare model,
      // allowed_tools, permission_mode, trust_tier, parent_proof_id, session_id.
      const spawnContract: SubagentContract = {
        subagentId: `${agentId}-${randomUUID().slice(0, 8)}`,
        model: 'claude-sonnet-4-6',
        allowedTools: ROLE_TOOL_ALLOWLIST[subTask.role],
        blockedTools: ['charter_sign', 'filing_submit', 'cisa_report_submit', 'settlement_execute'],
        allowedMcpServers: [],
        permissionMode,
        trustTier,
        parentProofId,
        sessionId,
      };

      // Execute the sub-task (spawnContract is available for hook inspection via context)
      const { output, success } = await this.executor(agentId, subTask.instruction, {
        ...subTask.context,
        _spawnContract: spawnContract,
      });

      const durationMs = Date.now() - delegateStart;

      // Annotate proof chain — include session_id so the run is traceable cross-surface
      const proofEntryId = await annotateProofChain({
        runId,
        taskId: subTask.taskId,
        agentId,
        instruction: subTask.instruction,
        output,
        success,
        sessionId,
      });

      subTaskResults.push({
        taskId: subTask.taskId,
        agentId,
        agentName,
        role: subTask.role,
        output,
        success,
        durationMs,
        proofEntryId,
        sessionId,
      });

      steps.push({
        stepId: randomUUID(),
        type: 'delegate',
        agentId,
        taskId: subTask.taskId,
        summary: `Delegated '${subTask.role}' to ${agentName} (${success ? 'success' : 'failed'}, ${durationMs}ms)`,
        durationMs,
        timestamp: new Date().toISOString(),
      });
    }

    // ── Synthesise ────────────────────────────────────────────────────────
    const synthStart = Date.now();
    const answer = await this.synthesise(objective, subTaskResults);
    const synthDuration = Date.now() - synthStart;

    steps.push({
      stepId: randomUUID(),
      type: 'synthesise',
      summary: `Synthesised ${subTaskResults.length} sub-task result(s) into final answer`,
      durationMs: synthDuration,
      timestamp: new Date().toISOString(),
    });

    const totalDurationMs = Date.now() - startMs;
    const overallSuccess = subTaskResults.some((r) => r.success);

    return {
      runId,
      sessionId,
      objective,
      steps,
      subTaskResults,
      answer,
      success: overallSuccess,
      totalDurationMs,
      agentsInvolved: [...agentsInvolved],
    };
  }

  private async synthesise(
    objective: string,
    results: SubTaskResult[],
  ): Promise<string> {
    if (results.length === 0) {
      return 'No specialist results available to synthesise.';
    }

    const successful = results.filter((r) => r.success);
    if (successful.length === 0) {
      return results.map((r) => `[${r.role}]: ${r.output}`).join('\n\n');
    }

    // Route synthesis through the Anthropic proxy (covenant:anthropic-proxy-only).
    try {
      const { anthropic } = await import('./providers/anthropic/client.js');
      const context = successful
        .map((r) => `## ${r.agentName} (${r.role})\n${r.output}`)
        .join('\n\n');

      const result = await anthropic.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 1500,
        system: 'You are a synthesis agent. Merge the specialist outputs below into a clear, executive-ready answer. Cite each specialist where relevant. Be precise and concise.',
        messages: [
          {
            role: 'user',
            content: `Objective: ${objective}\n\nSpecialist Outputs:\n${context}\n\nSynthesize a final answer:`,
          },
        ],
      });

      const block = result.content[0];
      return (block?.type === 'text' ? block.text : null) ?? context;
    } catch {
      // LLM unavailable — return concatenated outputs
      return successful.map((r) => `[${r.role}]: ${r.output}`).join('\n\n---\n\n');
    }
  }
}

export const coordinatorAgent = new CoordinatorAgent();
