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
  objective: string;
  steps: CoordinatorStep[];
  subTaskResults: SubTaskResult[];
  answer: string;
  success: boolean;
  totalDurationMs: number;
  agentsInvolved: string[];
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

    // Call the LLM directly via the OpenAI Chat Completions API.
    // This avoids the DomainAgentRunner.chat() ChatInterface requirement while
    // still producing a grounded specialist response for proof-chain annotation.
    const { openai } = await import('./providers/openai/index.js');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_completion_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: instruction },
      ],
    });

    const output = response.choices[0]?.message?.content ?? '[No response]';
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
   */
  async run(
    objective: string,
    domain?: string,
  ): Promise<CoordinatorRunResult> {
    const runId = randomUUID();
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

      // Execute the sub-task
      const { output, success } = await this.executor(agentId, subTask.instruction, subTask.context);

      const durationMs = Date.now() - delegateStart;

      // Annotate proof chain
      const proofEntryId = await annotateProofChain({
        runId,
        taskId: subTask.taskId,
        agentId,
        instruction: subTask.instruction,
        output,
        success,
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

    // Try to synthesise via the LLM
    try {
      const { openai } = await import('./providers/openai/index.js');
      const context = successful
        .map((r) => `## ${r.agentName} (${r.role})\n${r.output}`)
        .join('\n\n');

      const result = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_completion_tokens: 1500,
        messages: [
          {
            role: 'system',
            content:
              'You are a synthesis agent. Merge the specialist outputs below into a clear, executive-ready answer. Cite each specialist where relevant. Be precise and concise.',
          },
          {
            role: 'user',
            content: `Objective: ${objective}\n\nSpecialist Outputs:\n${context}\n\nSynthesize a final answer:`,
          },
        ],
      });

      return result.choices[0]?.message?.content ?? context;
    } catch {
      // LLM unavailable — return concatenated outputs
      return successful.map((r) => `[${r.role}]: ${r.output}`).join('\n\n---\n\n');
    }
  }
}

export const coordinatorAgent = new CoordinatorAgent();
