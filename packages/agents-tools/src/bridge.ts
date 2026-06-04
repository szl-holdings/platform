/**
 * agents-tools/bridge
 *
 * Provides `createToolStep()` — the canonical way to route a TypedTool invocation
 * through an AgentRun step, ensuring retries, timeouts, approval gates, and OTel spans
 * are all enforced centrally by agents-core.
 *
 * Usage:
 *   import { createToolStep } from "@workspace/agents-tools/bridge";
 *   import { AgentRun } from "@workspace/agents-core";
 *
 *   const run = new AgentRun("Transfer funds for Q3 settlement");
 *   await run.start();
 *   await run.step(createToolStep(fundTransferTool, { timeoutMs: 10_000 }), {
 *     fromAccountId: "ACC-001",
 *     toAccountId: "ACC-002",
 *     amountUsd: 5000,
 *     currency: "USD",
 *   });
 *   await run.complete();
 *
 * This pattern enforces:
 * 1. Approval gate for tools with approvalRequired=true (written to approvals-inbox)
 * 2. Retry policy with bounded back-off
 * 3. Timeout enforcement via Promise.race
 * 4. OTel span emission for each tool call
 * 5. Durable trace persistence to trace-graph defaultTraceStore
 */

import { randomUUID } from 'node:crypto';
import { defaultTypedToolGateway, type TypedToolInvocationContext } from './gateway.js';
import type { TypedTool } from './typed-tool.js';

/**
 * Minimal step-context interface compatible with AgentRun.StepContext.
 * Defined locally to avoid a cross-package import cycle.
 */
export interface AgentStepContext {
  runId: string;
  stepId: string;
  stepName: string;
  attemptNumber: number;
}

/**
 * A step definition that is structurally compatible with AgentRun.StepDefinition<TInput, TOutput>.
 * Pass instances of this to AgentRun.step() to execute typed tools through the
 * agents-core orchestration layer.
 */
export interface ToolStepDefinition<TInput = unknown, TOutput = unknown> {
  id: string;
  name: string;
  toolId: string;
  requiresApproval: boolean;
  approvalJustification?: string;
  projectedImpact?: string;
  projectedRisk?: string;
  timeoutMs?: number;
  handler: (input: TInput, ctx: AgentStepContext) => Promise<TOutput>;
}

export interface CreateToolStepOptions {
  stepId?: string;
  approvalJustification?: string;
  projectedImpact?: string;
  projectedRisk?: string;
  timeoutMs?: number;
  agentId?: string;
}

/**
 * Creates a ToolStepDefinition from a TypedTool.
 *
 * The returned definition is structurally compatible with AgentRun.StepDefinition, so it
 * can be passed directly to AgentRun.step(). This is the only way to execute
 * approval-required tools: agents-core clears the approval gate first, then calls
 * the handler with `preApproved: true` set in the gateway context.
 */
export function createToolStep<TInput, TOutput>(
  tool: TypedTool<TInput, TOutput>,
  options: CreateToolStepOptions = {},
): ToolStepDefinition<TInput, TOutput> {
  const stepId = options.stepId ?? `${tool.manifest.id}:${randomUUID().slice(0, 8)}`;

  return {
    id: stepId,
    name: tool.manifest.name,
    toolId: tool.manifest.id,
    requiresApproval: tool.manifest.approvalRequired ?? false,
    approvalJustification: options.approvalJustification,
    projectedImpact: options.projectedImpact,
    projectedRisk: options.projectedRisk,
    timeoutMs: options.timeoutMs ?? tool.manifest.timeoutMs,
    handler: async (input: TInput, ctx: AgentStepContext): Promise<TOutput> => {
      const invocationCtx: TypedToolInvocationContext = {
        requestId: randomUUID(),
        runId: ctx.runId,
        stepId: ctx.stepId,
        agentId: options.agentId,
        preApproved: tool.manifest.approvalRequired ?? false,
      };

      const result = await defaultTypedToolGateway.invoke<TOutput>(
        tool.manifest.id,
        input,
        invocationCtx,
      );

      if (!result.success) {
        throw new Error(
          result.error ??
            `Tool '${tool.manifest.id}' invocation failed (requestId: ${invocationCtx.requestId})`,
        );
      }

      return result.output as TOutput;
    },
  };
}
