/**
 * AgentRunner — unified runner for the multi-agent turn loop.
 *
 * Manages: tool calls (routed through Tool Mesh gateway when available),
 * handoffs, per-transition and per-tool Guardian checks, guardrails, and
 * produces a complete trace with all agent transitions visible.
 *
 * Supports both sync execution and streaming (via AgentRunnerEvent array).
 *
 * Wires through the existing AgentRun lifecycle, Guardian policy engine, and
 * TraceWriter so all governance and observability is preserved.
 */

import { globalCollector } from '@workspace/cognitive-observability';
import { defaultDecisionEngine, GuardianDecisionEngine } from '@workspace/guardian';
import { defaultTraceStore, TraceWriter } from '@workspace/trace-graph';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { Agent, AgentInferenceFn, AgentToolWrapper, GuardrailConfig } from './agent.js';
import {
  fireAgentEnd,
  fireAgentStart,
  fireHandoff,
  fireRunEnd,
  fireRunStart,
  fireStepComplete,
  fireToolCall,
  type HandoffData,
  type RunHooks,
  type ToolCallData,
  type ConversationMessage,
} from './hooks.js';
import type { MutableRunContext } from './run-context.js';
import { AgentRun } from './run.js';
import { emitStepLog } from './step-log.js';

/**
 * Minimal tool gateway interface that AgentRunner uses for governed tool
 * invocation. Compatible with ToolMeshGateway from @workspace/tool-mesh —
 * callers can pass defaultGateway directly. Defined here to avoid a direct
 * agents-core → tool-mesh dependency.
 */
export interface AgentToolGateway {
  invoke(
    toolId: string,
    input: Record<string, unknown>,
    context: { requestId: string; agentId: string; sessionId?: string; dryRun?: boolean },
  ): Promise<{ success: boolean; output?: unknown; error?: string }>;
}

/**
 * Thrown when Guardian returns `require-approval` or `require-dual-approval`
 * for an agent turn, tool call, or handoff. Callers can catch this to route
 * the run through an approval workflow before resuming.
 */
export class ApprovalRequiredError extends Error {
  readonly kind: 'require-approval' | 'require-dual-approval';
  readonly subjectKind: 'agent-turn' | 'tool' | 'handoff';
  readonly subjectId: string;
  readonly guardianReason: string | undefined;

  constructor(
    kind: 'require-approval' | 'require-dual-approval',
    subjectKind: 'agent-turn' | 'tool' | 'handoff',
    subjectId: string,
    guardianReason: string | undefined,
  ) {
    super(
      `[Guardian] ${kind} required for ${subjectKind} '${subjectId}'${guardianReason ? `: ${guardianReason}` : ''}`,
    );
    this.name = 'ApprovalRequiredError';
    this.kind = kind;
    this.subjectKind = subjectKind;
    this.subjectId = subjectId;
    this.guardianReason = guardianReason;
  }
}

/**
 * Pluggable guardrail evaluator. Implement this interface and inject via
 * AgentRunnerOptions.guardrailExecutor to enforce agent-level guardrails
 * (PII scanning, content filters, compliance checks, etc.) before each turn.
 *
 * When not provided, guardrails defined on agents are logged but not enforced.
 */
export interface GuardrailExecutor {
  evaluate(
    config: GuardrailConfig,
    context: { agentId: string; input: string; runId: string },
  ): Promise<{ pass: boolean; reason?: string }>;
}

/** Thrown when a GuardrailExecutor blocks an agent turn. */
export class GuardrailBlockedError extends Error {
  readonly guardrailId: string;
  readonly agentId: string;

  constructor(guardrailId: string, agentId: string, reason: string | undefined) {
    super(`Guardrail '${guardrailId}' blocked agent '${agentId}'${reason ? `: ${reason}` : ''}`);
    this.name = 'GuardrailBlockedError';
    this.guardrailId = guardrailId;
    this.agentId = agentId;
  }
}

/** Snapshot of AgentRunner state — used for checkpoint / resumability. */
export interface AgentRunnerCheckpoint {
  runId: string;
  traceId: string;
  agentPath: string[];
  currentAgentId: string;
  totalTurns: number;
  totalTokens: number;
  totalCostUsd: number;
  history: ConversationMessage[];
  handoffs: HandoffData[];
  savedAt: string;
}

export interface AgentRunnerOptions {
  agent: Agent;
  ctx: MutableRunContext;
  inferenceFn?: AgentInferenceFn;
  guardian?: GuardianDecisionEngine;
  runHooks?: RunHooks;
  /** Tool wrappers for agent-as-tool pattern */
  agentTools?: AgentToolWrapper[];
  /**
   * Tool gateway for governed tool invocation. When provided, registered tool
   * IDs (non-agent: prefix) are routed through the gateway for full
   * PII scan, policy-engine, Guardian decision, rate-limiter, and approval
   * gate enforcement. Compatible with ToolMeshGateway from
   * \@workspace/tool-mesh — pass defaultGateway directly. When omitted, tool
   * calls to non-agent tools return an informational message.
   */
  toolGateway?: AgentToolGateway;
  /** Max total turns across all agent hops in this runner invocation */
  maxTotalTurns?: number;
  /**
   * Guardrail executor evaluated before each agent turn. When provided and an
   * agent has guardrails defined, each guardrail is evaluated before inference.
   * A failing guardrail throws GuardrailBlockedError. When omitted, guardrails
   * on agents are visible in config but not enforced at runtime.
   */
  guardrailExecutor?: GuardrailExecutor;
}

export interface AgentRunnerResult {
  output: string | undefined;
  agentPath: string[];
  turns: number;
  handoffs: HandoffData[];
  traceId: string;
  runId: string;
  totalCostUsd: number;
  totalTokens: number;
}

export type AgentRunnerEventType =
  | 'run_start'
  | 'agent_start'
  | 'agent_end'
  | 'tool_call'
  | 'handoff'
  | 'step_complete'
  | 'checkpoint'
  | 'run_end';

export interface AgentRunnerEvent {
  type: AgentRunnerEventType;
  agentId: string;
  timestamp: number;
  data: Record<string, unknown>;
}

/**
 * Fallback guardian when the caller does not inject one.
 * Uses the platform-configured defaultDecisionEngine so governance policy
 * is consistent with the rest of the platform. Callers that need a
 * different policy scope should inject an explicit GuardianDecisionEngine.
 */
const platformDefaultGuardian: GuardianDecisionEngine = defaultDecisionEngine;

/** No-op gateway used when no toolGateway is provided. Returns a not-found message. */
const noopGateway: AgentToolGateway = {
  async invoke(toolId) {
    return {
      success: false,
      error: `[AgentRunner] No toolGateway configured. Tool '${toolId}' cannot be invoked. Pass a toolGateway (e.g. defaultGateway from @workspace/tool-mesh) to enable governed tool invocation.`,
    };
  },
};

/**
 * Default inference function — no-op that returns an acknowledgement.
 * Callers must inject a real inference function (e.g. gatewayInfer wrapper)
 * to get LLM responses. This default exists so AgentRunner is usable in tests
 * and stubs without requiring an AI provider.
 */
const defaultInferenceFn: AgentInferenceFn = async (req) => ({
  content: `[AgentRunner: no inference function supplied for agent '${req.agentId}'. Inject an inferenceFn to produce real responses.]`,
});

/**
 * Check whether a tool ID is an agent-as-tool reference (agent: prefix)
 * vs a Tool Mesh registered tool ID.
 */
function isAgentToolId(toolId: string): boolean {
  return toolId.startsWith('agent:');
}

export class AgentRunner {
  private readonly agent: Agent;
  private readonly ctx: MutableRunContext;
  private readonly inferenceFn: AgentInferenceFn;
  private readonly guardian: GuardianDecisionEngine;
  private readonly runHooks: RunHooks;
  private readonly agentTools: Map<string, AgentToolWrapper>;
  private readonly toolGateway: AgentToolGateway;
  private readonly maxTotalTurns: number;
  private readonly traceWriter: TraceWriter;
  private readonly guardrailExecutor: GuardrailExecutor | undefined;

  private readonly events: AgentRunnerEvent[] = [];
  private totalCostUsd = 0;
  private totalTokens = 0;
  private lastMutationIdx = 0;
  private eventListener?: (event: AgentRunnerEvent) => void;

  constructor(options: AgentRunnerOptions) {
    this.agent = options.agent;
    this.ctx = options.ctx;
    this.inferenceFn = options.inferenceFn ?? defaultInferenceFn;
    this.guardian = options.guardian ?? platformDefaultGuardian;
    this.runHooks = options.runHooks ?? {};
    this.agentTools = new Map((options.agentTools ?? []).map((t) => [t.toolId, t]));
    this.toolGateway = options.toolGateway ?? noopGateway;
    this.maxTotalTurns = options.maxTotalTurns ?? 20;
    this.traceWriter = new TraceWriter(defaultTraceStore);
    this.guardrailExecutor = options.guardrailExecutor;
  }

  /**
   * Build an AgentToolWrapper that invokes `targetAgent` as a sub-runner,
   * propagating this runner's inferenceFn, toolGateway, guardian, and hooks.
   * Use this in the manager pattern to properly wire specialist sub-agents.
   *
   * @example
   * ```ts
   * const managerRunner = new AgentRunner({ agent: plannerAgent, ctx, inferenceFn });
   * const vesselTool = managerRunner.buildAgentTool(vesselAgent, {
   *   name: 'vessels',
   *   description: 'Maritime intelligence — fleet tracking and sanctions risk',
   * });
   * ```
   */
  buildAgentTool(
    targetAgent: Agent,
    options: { name: string; description: string },
  ): AgentToolWrapper {
    const inputSchema = z.object({ input: z.string() });
    const inferenceFn = this.inferenceFn;
    const toolGateway = this.toolGateway;
    const guardian = this.guardian;
    const runHooks = this.runHooks;
    const maxTotalTurns = Math.min(this.maxTotalTurns, targetAgent.maxTurns);

    return {
      toolId: `agent:${targetAgent.agentId}`,
      toolName: options.name,
      description: options.description,
      inputSchema,
      invoke: async (rawInput: unknown, ctx: MutableRunContext): Promise<string> => {
        const parsed = inputSchema.safeParse(rawInput);
        const inputText =
          parsed.success && 'input' in (parsed.data as object)
            ? String((parsed.data as Record<string, unknown>).input)
            : JSON.stringify(rawInput);

        const subRunner = new AgentRunner({
          agent: targetAgent,
          ctx,
          inferenceFn,
          toolGateway,
          guardian,
          runHooks,
          maxTotalTurns,
        });
        const result = await subRunner.run(inputText);
        return result.output ?? '';
      },
    };
  }

  /**
   * Run the agent with the given input, following handoffs until a final
   * response is produced or the max-turns / max-hops budget is exhausted.
   *
   * Throws `ApprovalRequiredError` when Guardian returns require-approval or
   * require-dual-approval for any agent turn, tool call, or handoff.
   * Callers should catch this and route the interrupted run through an
   * approval workflow before resuming.
   */
  async run(input: string): Promise<AgentRunnerResult> {
    const { runId, traceId } = this.ctx;
    const agentRun = new AgentRun(`AgentRunner: ${input.slice(0, 80)}`, {
      runId,
      agentId: this.agent.agentId,
      surface: 'agent-runner',
      metadata: { traceId, agentId: this.agent.agentId },
    });

    this.traceWriter.startTrace({
      traceId,
      runId,
      agentId: this.agent.agentId,
      objective: input,
    });

    await agentRun.start();
    await fireRunStart(this.runHooks, this.ctx, input);
    this.emit('run_start', this.agent.agentId, { input, maxTotalTurns: this.maxTotalTurns });

    const agentPath: string[] = [];
    const handoffs: HandoffData[] = [];
    let currentAgent = this.agent;
    let history: ConversationMessage[] = [{ role: 'user', content: input }];
    let totalTurns = 0;
    let finalOutput: string | undefined;

    try {
      while (totalTurns < this.maxTotalTurns) {
        agentPath.push(currentAgent.agentId);
        this.ctx.setCurrentAgent(currentAgent.agentId);
        this.ctx.incrementTurn();
        totalTurns++;

        const turnInput = history.at(-1)?.content ?? input;
        await fireAgentStart(
          this.runHooks,
          currentAgent.hooks,
          this.ctx,
          currentAgent.agentId,
          turnInput,
        );
        this.emit('agent_start', currentAgent.agentId, { turn: totalTurns });

        // ── Guardian check: agent-level ───────────────────────────────────────
        const guardianResult = this.guardian.evaluate({
          requestId: randomUUID(),
          agentId: currentAgent.agentId,
          sessionId: this.ctx.sessionId,
          action: `agent-turn:${currentAgent.agentId}`,
          domain: this.ctx.domain ?? currentAgent.agentId,
          tier: 'supervised',
          requestedAt: new Date().toISOString(),
          context: { agentId: currentAgent.agentId, turn: totalTurns },
        });

        if (guardianResult.outcome === 'block') {
          const blockMsg = `[Guardian blocked agent '${currentAgent.agentId}': ${guardianResult.reason}]`;
          globalCollector.recordKnown('agent_runner_guardian_block' as any, 1, {
            agentId: currentAgent.agentId,
            runId,
          });
          finalOutput = blockMsg;
          break;
        }

        if (
          guardianResult.outcome === 'require-approval' ||
          guardianResult.outcome === 'require-dual-approval'
        ) {
          // Save checkpoint before interrupting so caller can resume after approval
          this.saveCheckpoint(currentAgent.agentId, agentPath, totalTurns, history, handoffs);
          throw new ApprovalRequiredError(
            guardianResult.outcome,
            'agent-turn',
            currentAgent.agentId,
            guardianResult.reason,
          );
        }

        // ── Flush RunContext mutations from setCurrentAgent/incrementTurn ────
        await this.flushContextMutations();

        // ── Guardrail evaluation ──────────────────────────────────────────────
        if (this.guardrailExecutor && currentAgent.guardrails.length > 0) {
          const turnInput = history.at(-1)?.content ?? input;
          for (const gr of currentAgent.guardrails) {
            const grResult = await this.guardrailExecutor.evaluate(gr, {
              agentId: currentAgent.agentId,
              input: typeof turnInput === 'string' ? turnInput : JSON.stringify(turnInput),
              runId,
            });
            if (!grResult.pass) {
              globalCollector.recordKnown('agent_runner_guardrail_block' as any, 1, {
                agentId: currentAgent.agentId,
                guardrailId: gr.id,
                runId,
              });
              throw new GuardrailBlockedError(gr.id, currentAgent.agentId, grResult.reason);
            }
          }
        }

        // Build tools list — registered tool IDs + agent-as-tool wrappers
        const tools = [
          ...currentAgent.tools,
          ...Array.from(this.agentTools.values()).map((t) => ({
            toolId: t.toolId,
            description: t.description,
          })),
        ];

        const turnStart = Date.now();
        const response = await this.inferenceFn({
          agentId: currentAgent.agentId,
          systemPrompt: currentAgent.instructions,
          messages: history,
          tools,
          ctx: this.ctx,
        });

        const turnDurationMs = Date.now() - turnStart;

        if (response.usage) {
          this.totalTokens += response.usage.totalTokens;
        }
        if (response.costUsd) {
          this.totalCostUsd += response.costUsd;
          this.ctx.deductBudget(response.costUsd, currentAgent.agentId);
          await this.flushContextMutations();
        }

        // Append assistant message to history
        history.push({
          role: 'assistant',
          content: response.content,
          agentId: currentAgent.agentId,
        });

        // ── Handle tool calls ─────────────────────────────────────────────────
        if (response.toolCalls && response.toolCalls.length > 0) {
          for (const tc of response.toolCalls) {
            const tcData: ToolCallData = {
              toolId: tc.toolId,
              toolName: tc.toolName,
              agentId: currentAgent.agentId,
              input: tc.input,
              success: false,
            };

            // ── Guardian check: per-tool ──────────────────────────────────────
            const toolGuardian = this.guardian.evaluate({
              requestId: randomUUID(),
              agentId: currentAgent.agentId,
              action: `tool:${tc.toolId}`,
              toolId: tc.toolId,
              domain: this.ctx.domain ?? currentAgent.agentId,
              tier: 'supervised',
              requestedAt: new Date().toISOString(),
              context: { toolId: tc.toolId, agentId: currentAgent.agentId },
            });

            if (toolGuardian.outcome === 'block') {
              tcData.success = false;
              tcData.error = `Guardian blocked tool '${tc.toolId}': ${toolGuardian.reason}`;
              history.push({
                role: 'tool',
                content: tcData.error,
                toolCallId: tc.callId,
                toolName: tc.toolName,
              });
              await fireToolCall(this.runHooks, currentAgent.hooks, this.ctx, tcData);
              continue;
            }

            if (
              toolGuardian.outcome === 'require-approval' ||
              toolGuardian.outcome === 'require-dual-approval'
            ) {
              this.saveCheckpoint(currentAgent.agentId, agentPath, totalTurns, history, handoffs);
              throw new ApprovalRequiredError(
                toolGuardian.outcome,
                'tool',
                tc.toolId,
                toolGuardian.reason,
              );
            }

            this.emit('tool_call', currentAgent.agentId, {
              toolId: tc.toolId,
              toolName: tc.toolName,
            });

            let toolOutput = '';
            const toolCallStart = Date.now();

            if (isAgentToolId(tc.toolId)) {
              const toolWrapper = this.agentTools.get(tc.toolId);
              if (toolWrapper) {
                try {
                  toolOutput = await toolWrapper.invoke(tc.input, this.ctx);
                  tcData.success = true;
                  tcData.output = toolOutput;
                } catch (err) {
                  tcData.success = false;
                  tcData.error = err instanceof Error ? err.message : String(err);
                  toolOutput = `Tool error: ${tcData.error}`;
                }
              } else {
                toolOutput = `[Agent tool '${tc.toolId}' not registered in this runner]`;
              }
            } else {
              try {
                const gatewayResult = await this.toolGateway.invoke(
                  tc.toolId,
                  tc.input as Record<string, unknown>,
                  {
                    requestId: randomUUID(),
                    agentId: currentAgent.agentId,
                    sessionId: this.ctx.sessionId,
                    dryRun: false,
                  },
                );
                if (gatewayResult.success) {
                  toolOutput = JSON.stringify(gatewayResult.output ?? {});
                  tcData.success = true;
                  tcData.output = gatewayResult.output;
                } else {
                  tcData.success = false;
                  tcData.error = gatewayResult.error ?? `Tool '${tc.toolId}' failed`;
                  toolOutput = `Tool error: ${tcData.error}`;
                }
              } catch (err) {
                tcData.success = false;
                tcData.error = err instanceof Error ? err.message : String(err);
                toolOutput = `Tool invocation error: ${tcData.error}`;
              }
            }

            tcData.durationMs = Date.now() - toolCallStart;
            // Fire hook after invocation so it carries accurate success, output, and duration
            await fireToolCall(this.runHooks, currentAgent.hooks, this.ctx, tcData);

            history.push({
              role: 'tool',
              content: toolOutput,
              toolCallId: tc.callId,
              toolName: tc.toolName,
            });

            this.traceWriter.appendToolCall(traceId, {
              toolId: tc.toolId,
              toolName: tc.toolName,
              latencyMs: tcData.durationMs,
              success: tcData.success,
              errorCode: tcData.error,
              approvalRequired: false,
              retries: 0,
            });
          }

          // Fire step-complete after tool batch
          await fireStepComplete(this.runHooks, this.ctx, {
            agentId: currentAgent.agentId,
            turnIndex: totalTurns,
            durationMs: turnDurationMs,
            hadToolCalls: true,
            hadHandoff: false,
            output: undefined,
          });
          this.emit('step_complete', currentAgent.agentId, {
            turn: totalTurns,
            hadToolCalls: true,
          });

          // After tool calls, continue the loop to get the next agent response
          continue;
        }

        // ── Handle handoff ────────────────────────────────────────────────────
        if (response.handoffTarget) {
          const { getAgent } = await import('./agent.js');
          const targetAgent = getAgent(response.handoffTarget);

          if (!targetAgent || !currentAgent.canHandoffTo(response.handoffTarget)) {
            // Handoff not declared or target unknown — treat as final output
            finalOutput = response.content;
            await fireAgentEnd(
              this.runHooks,
              currentAgent.hooks,
              this.ctx,
              currentAgent.agentId,
              finalOutput,
            );
            this.emit('agent_end', currentAgent.agentId, { output: finalOutput?.slice(0, 200) });
            break;
          }

          // ── Validate handoff data schema ──────────────────────────────────
          const handoffConfig = currentAgent.getHandoff(response.handoffTarget);
          if (handoffConfig?.dataSchema && response.handoffData !== undefined) {
            const parseResult = handoffConfig.dataSchema.safeParse(response.handoffData);
            if (!parseResult.success) {
              // Schema mismatch: log the violation and treat as final output
              globalCollector.recordKnown('agent_runner_handoff_schema_violation' as any, 1, {
                fromAgent: currentAgent.agentId,
                toAgent: response.handoffTarget,
                error: parseResult.error.message,
              });
              finalOutput = response.content;
              await fireAgentEnd(
                this.runHooks,
                currentAgent.hooks,
                this.ctx,
                currentAgent.agentId,
                finalOutput,
              );
              this.emit('agent_end', currentAgent.agentId, {
                output: finalOutput?.slice(0, 200),
                handoffSchemaViolation: true,
              });
              break;
            }
          }

          // ── Guardian check: handoff transition ────────────────────────────
          const handoffGuardian = this.guardian.evaluate({
            requestId: randomUUID(),
            agentId: currentAgent.agentId,
            action: `handoff:${response.handoffTarget}`,
            domain: this.ctx.domain ?? currentAgent.agentId,
            tier: 'supervised',
            requestedAt: new Date().toISOString(),
            context: { fromAgent: currentAgent.agentId, toAgent: response.handoffTarget },
          });

          if (handoffGuardian.outcome === 'block') {
            finalOutput = response.content;
            await fireAgentEnd(
              this.runHooks,
              currentAgent.hooks,
              this.ctx,
              currentAgent.agentId,
              finalOutput,
            );
            break;
          }

          if (
            handoffGuardian.outcome === 'require-approval' ||
            handoffGuardian.outcome === 'require-dual-approval'
          ) {
            this.saveCheckpoint(currentAgent.agentId, agentPath, totalTurns, history, handoffs);
            throw new ApprovalRequiredError(
              handoffGuardian.outcome,
              'handoff',
              `${currentAgent.agentId}->${response.handoffTarget}`,
              handoffGuardian.reason,
            );
          }

          const historyMode = handoffConfig?.historyMode ?? 'full';

          const handoffData: HandoffData = {
            fromAgentId: currentAgent.agentId,
            toAgentId: response.handoffTarget,
            reason: response.content,
            context:
              typeof response.handoffData === 'object' && response.handoffData !== null
                ? (response.handoffData as Record<string, unknown>)
                : undefined,
            historyMode,
          };

          handoffs.push(handoffData);

          this.emit('handoff', currentAgent.agentId, {
            toAgentId: response.handoffTarget,
            historyMode,
          });

          await fireHandoff(this.runHooks, targetAgent.hooks, this.ctx, handoffData);

          this.traceWriter.appendSpan(traceId, {
            spanId: randomUUID(),
            name: `handoff:${currentAgent.agentId}->${response.handoffTarget}`,
            startedAt: new Date().toISOString(),
            endedAt: new Date().toISOString(),
            latencyMs: 0,
            status: 'ok',
            attributes: {
              fromAgent: currentAgent.agentId,
              toAgent: response.handoffTarget,
              historyMode,
            },
          });

          // Fold history if requested
          if (historyMode === 'folded' && history.length > 2) {
            const summary = history
              .slice(0, -1)
              .map((m) => `${m.role}: ${String(m.content).slice(0, 200)}`)
              .join('\n');
            history = [
              { role: 'user', content: `[Context summary from ${currentAgent.name}]\n${summary}` },
              { role: 'user', content: history.at(-1)?.content ?? input },
            ];
            handoffData.foldedSummary = summary;
          }

          await fireStepComplete(this.runHooks, this.ctx, {
            agentId: currentAgent.agentId,
            turnIndex: totalTurns,
            durationMs: turnDurationMs,
            hadToolCalls: false,
            hadHandoff: true,
          });
          this.emit('step_complete', currentAgent.agentId, { turn: totalTurns, hadHandoff: true });
          await fireAgentEnd(
            this.runHooks,
            currentAgent.hooks,
            this.ctx,
            currentAgent.agentId,
            undefined,
          );

          currentAgent = targetAgent;
          continue;
        }

        // ── Final output: no tool calls, no handoff ───────────────────────────
        finalOutput = response.content;

        await fireStepComplete(this.runHooks, this.ctx, {
          agentId: currentAgent.agentId,
          turnIndex: totalTurns,
          durationMs: turnDurationMs,
          hadToolCalls: false,
          hadHandoff: false,
          output: finalOutput,
        });
        this.emit('step_complete', currentAgent.agentId, { turn: totalTurns, final: true });

        await fireAgentEnd(
          this.runHooks,
          currentAgent.hooks,
          this.ctx,
          currentAgent.agentId,
          finalOutput,
        );
        this.emit('agent_end', currentAgent.agentId, { output: finalOutput?.slice(0, 200) });
        break;
      }

      if (finalOutput === undefined && totalTurns >= this.maxTotalTurns) {
        finalOutput = `[AgentRunner: max turns (${this.maxTotalTurns}) exceeded]`;
      }

      this.emit('run_end', currentAgent.agentId, { output: finalOutput?.slice(0, 200), agentPath });
      await fireRunEnd(this.runHooks, this.ctx, finalOutput, undefined);

      this.traceWriter.completeTrace(traceId, {
        status: 'completed',
        latencyMs: totalTurns * 100,
      });

      await agentRun.complete(`AgentRunner completed after ${totalTurns} turns`);

      return {
        output: finalOutput,
        agentPath,
        turns: totalTurns,
        handoffs,
        traceId,
        runId,
        totalCostUsd: this.totalCostUsd,
        totalTokens: this.totalTokens,
      };
    } catch (err) {
      if (err instanceof ApprovalRequiredError) {
        // Suspend the run as pending approval — do NOT mark as failed
        await agentRun.pendingApproval(err.message);
        this.traceWriter.completeTrace(traceId, { status: 'completed', latencyMs: 0 });
        throw err;
      }
      const msg = err instanceof Error ? err.message : String(err);
      await fireRunEnd(
        this.runHooks,
        this.ctx,
        undefined,
        err instanceof Error ? err : new Error(msg),
      );
      this.traceWriter.recordError(traceId, 'unknown', msg);
      this.traceWriter.completeTrace(traceId, { status: 'failed', latencyMs: 0 });
      await agentRun.fail(err);
      throw err;
    }
  }

  /** Return all events emitted during the run. */
  getEvents(): readonly AgentRunnerEvent[] {
    return this.events;
  }

  /**
   * Return the most recently saved checkpoint, or undefined if none has been
   * saved yet. Checkpoints are saved automatically before any
   * ApprovalRequiredError is thrown.
   */
  getLatestCheckpoint(): AgentRunnerCheckpoint | undefined {
    const checkpointEvents = this.events.filter((e) => e.type === 'checkpoint');
    if (checkpointEvents.length === 0) return undefined;
    const last = checkpointEvents.at(-1);
    return last?.data as AgentRunnerCheckpoint | undefined;
  }

  private saveCheckpoint(
    currentAgentId: string,
    agentPath: string[],
    totalTurns: number,
    history: ConversationMessage[],
    handoffs: HandoffData[],
  ): void {
    const checkpoint: AgentRunnerCheckpoint = {
      runId: this.ctx.runId,
      traceId: this.ctx.traceId,
      agentPath: [...agentPath],
      currentAgentId,
      totalTurns,
      totalTokens: this.totalTokens,
      totalCostUsd: this.totalCostUsd,
      history: [...history],
      handoffs: [...handoffs],
      savedAt: new Date().toISOString(),
    };
    this.emit('checkpoint', currentAgentId, checkpoint as unknown as Record<string, unknown>);
    globalCollector.recordKnown('agent_runner_checkpoint' as any, 1, {
      runId: this.ctx.runId,
      agentId: currentAgentId,
      totalTurns: String(totalTurns),
    });
  }

  private emit(type: AgentRunnerEventType, agentId: string, data: Record<string, unknown>): void {
    const event: AgentRunnerEvent = { type, agentId, timestamp: Date.now(), data };
    this.events.push(event);
    this.eventListener?.(event);
    globalCollector.recordKnown('agent_runner_event' as any, 1, { type, agentId });
  }

  /**
   * Stream events from this run as an async generator. Yields `AgentRunnerEvent`
   * objects in real time as the agent executes: agent_start, tool_call, handoff,
   * step_complete, run_end, etc. The generator completes after the run finishes.
   *
   * @example
   * ```ts
   * for await (const event of runner.stream('Analyze vessel risk')) {
   *   if (event.type === 'run_end') console.log('done:', event.data.output);
   *   else console.log(event.type, event.agentId);
   * }
   * ```
   */
  async *stream(input: string): AsyncGenerator<AgentRunnerEvent> {
    const queue: AgentRunnerEvent[] = [];
    let notify: (() => void) | null = null;
    let done = false;
    let runError: unknown;

    this.eventListener = (event: AgentRunnerEvent) => {
      queue.push(event);
      const fn = notify;
      notify = null;
      fn?.();
    };

    const runPromise = this.run(input)
      .catch((err) => {
        runError = err;
      })
      .finally(() => {
        done = true;
        const fn = notify;
        notify = null;
        fn?.();
      });

    try {
      while (true) {
        while (queue.length > 0) {
          yield queue.shift()!;
        }
        if (done) break;
        await new Promise<void>((resolve) => {
          notify = resolve;
        });
      }
      // Drain any events produced during final teardown
      while (queue.length > 0) {
        yield queue.shift()!;
      }
      await runPromise;
      if (runError !== undefined) throw runError;
    } finally {
      this.eventListener = undefined;
    }
  }

  /**
   * Emit new RunContext mutations (since the last flush) to the observability
   * log so context evolution is visible in traces.
   */
  private async flushContextMutations(): Promise<void> {
    const newMutations = this.ctx.mutations.slice(this.lastMutationIdx);
    this.lastMutationIdx = this.ctx.mutations.length;
    for (const m of newMutations) {
      await emitStepLog({
        runId: this.ctx.runId,
        stepId: `ctx:${m.field}:${m.timestamp}`,
        stepName: 'context.mutation',
        level: 'debug',
        message: `Context '${m.field}' \u2190 ${m.agentId}`,
        data: { field: m.field, agentId: m.agentId, prev: m.previousValue, next: m.nextValue },
      });
    }
  }
}
