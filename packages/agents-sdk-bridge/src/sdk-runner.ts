/**
 * SDK Runner — provides an opt-in execution path through the @openai/agents run() loop.
 *
 * When an agent opts in via useAgentsSdk: true, this runner:
 *   1. Wraps the agent definition as an SDK Agent (via SzlAgentAdapter)
 *   2. Ensures SzlTracingProcessor is registered once per process lifetime
 *   3. Executes via Runner with proper RunConfig (workflow name, group ID, tracing)
 *   4. Returns the final output text
 *
 * The existing hand-rolled tool-calling loop is unchanged — agents that do NOT
 * opt in continue to behave exactly as before.
 */

import { Runner } from '@openai/agents';
import type { AgentDefinitionLike } from './agent-adapter.js';
import { SzlAgentAdapter } from './agent-adapter.js';
import { registerSzlTracingProcessor } from './tracing-processor.js';
import type { SzlTracingProcessorOptions } from './tracing-processor.js';
import { defaultGateway } from '@workspace/tool-mesh';

export interface SdkRunnerOptions {
  /**
   * Whether to include sensitive data (inputs/outputs) in traces.
   */
  includeSensitiveData?: boolean;

  /**
   * Maximum number of turns before the run is aborted.
   */
  maxTurns?: number;

  /**
   * Conversation ID — used as RunConfig.groupId to link traces in the same conversation.
   */
  conversationId?: string;

  /**
   * Workflow name used in traces. Defaults to the agent's name.
   */
  workflowName?: string;

  /**
   * Domain context passed to the guardrail adapter for policy evaluation.
   */
  domain?: string;

  /**
   * Additional options forwarded to SzlTracingProcessor.
   */
  tracingOptions?: SzlTracingProcessorOptions;
}

let processorRegistered = false;

/**
 * Ensure the SzlTracingProcessor is registered exactly once for the lifetime
 * of the process. Safe to call from multiple concurrent requests.
 */
async function ensureProcessorRegistered(opts: SzlTracingProcessorOptions): Promise<void> {
  if (processorRegistered) return;
  processorRegistered = true;
  await registerSzlTracingProcessor(opts);
}

export interface SdkRunResult {
  output: string;
}

/**
 * Run an agent through the SDK's Runner with full SZL observability.
 *
 * Configuration such as workflow name, group ID, and tracing flags go into
 * RunConfig on the Runner constructor — NOT into the run() call options,
 * which only accept { maxTurns, context, signal }.
 */
export async function runAgentViaSdk(
  definition: AgentDefinitionLike,
  userMessage: string,
  options: SdkRunnerOptions = {},
): Promise<SdkRunResult> {
  const tracingOptions: SzlTracingProcessorOptions = {
    includeSensitiveData: options.includeSensitiveData ?? false,
    ...options.tracingOptions,
  };
  await ensureProcessorRegistered(tracingOptions);

  const agentAdapter = new SzlAgentAdapter({
    gateway: defaultGateway,
    agentId: definition.id,
    domain: options.domain ?? definition.domain,
  });
  const agent = agentAdapter.adapt(definition);

  const runner = new Runner({
    workflowName: options.workflowName ?? definition.name,
    groupId: options.conversationId,
    tracingDisabled: false,
    traceIncludeSensitiveData: options.includeSensitiveData ?? false,
  });

  const result = await runner.run(agent, userMessage, {
    maxTurns: options.maxTurns ?? 6,
  });

  const output =
    typeof result.finalOutput === 'string'
      ? result.finalOutput
      : JSON.stringify(result.finalOutput ?? '');

  return { output };
}
