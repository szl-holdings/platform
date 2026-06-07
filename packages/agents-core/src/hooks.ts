/**
 * Hooks — structured lifecycle events for agent runs.
 *
 * Two scopes:
 *  - RunHooks: observe the entire runner invocation
 *  - AgentHooks: attached to a specific agent instance
 *
 * All hooks are optional. Missing hooks are silently skipped.
 * Hook errors are caught and logged but do not interrupt execution.
 */

import type { MutableRunContext } from './run-context.js';

export interface ConversationMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  agentId?: string;
  toolCallId?: string;
  toolName?: string;
}

export interface HandoffData {
  fromAgentId: string;
  toAgentId: string;
  reason?: string;
  context?: Record<string, unknown>;
  historyMode: 'full' | 'folded';
  foldedSummary?: string;
}

export interface ToolCallData {
  toolId: string;
  toolName: string;
  agentId: string;
  input: unknown;
  output?: unknown;
  durationMs?: number;
  success: boolean;
  error?: string;
}

export interface StepCompleteData {
  agentId: string;
  turnIndex: number;
  durationMs: number;
  hadToolCalls: boolean;
  hadHandoff: boolean;
  output?: string;
}

/**
 * RunHooks — observe the entire multi-agent runner invocation.
 */
export interface RunHooks {
  onRunStart?: (ctx: MutableRunContext, input: string) => void | Promise<void>;
  onRunEnd?: (ctx: MutableRunContext, output: string | undefined, error?: Error) => void | Promise<void>;
  onAgentStart?: (ctx: MutableRunContext, agentId: string, input: string) => void | Promise<void>;
  onAgentEnd?: (ctx: MutableRunContext, agentId: string, output: string | undefined) => void | Promise<void>;
  onHandoff?: (ctx: MutableRunContext, data: HandoffData) => void | Promise<void>;
  onToolCall?: (ctx: MutableRunContext, data: ToolCallData) => void | Promise<void>;
  onStepComplete?: (ctx: MutableRunContext, data: StepCompleteData) => void | Promise<void>;
}

/**
 * AgentHooks — attached to a specific agent instance.
 */
export interface AgentHooks {
  onStart?: (ctx: MutableRunContext, input: string) => void | Promise<void>;
  onEnd?: (ctx: MutableRunContext, output: string | undefined) => void | Promise<void>;
  onHandoffReceived?: (ctx: MutableRunContext, data: HandoffData) => void | Promise<void>;
  onToolCall?: (ctx: MutableRunContext, data: ToolCallData) => void | Promise<void>;
}

/** @internal Safe hook invocation — catches errors so hooks never break execution. */
async function safeCall(fn: ((...args: unknown[]) => void | Promise<void>) | undefined, ...args: unknown[]): Promise<void> {
  if (!fn) return;
  try { await fn(...args); } catch { /* swallow */ }
}

// ─── Typed hook fire helpers ─────────────────────────────────────────────────
// These eliminate `as any` at call sites by providing single-purpose wrappers.

export async function fireRunStart(hooks: RunHooks | undefined, ctx: MutableRunContext, input: string): Promise<void> {
  if (!hooks?.onRunStart) return;
  try { await hooks.onRunStart(ctx, input); } catch { /* swallow */ }
}

export async function fireRunEnd(hooks: RunHooks | undefined, ctx: MutableRunContext, output: string | undefined, error?: Error): Promise<void> {
  if (!hooks?.onRunEnd) return;
  try { await hooks.onRunEnd(ctx, output, error); } catch { /* swallow */ }
}

export async function fireAgentStart(hooks: RunHooks | undefined, agentHooks: AgentHooks | undefined, ctx: MutableRunContext, agentId: string, input: string): Promise<void> {
  if (hooks?.onAgentStart) { try { await hooks.onAgentStart(ctx, agentId, input); } catch { /* swallow */ } }
  if (agentHooks?.onStart) { try { await agentHooks.onStart(ctx, input); } catch { /* swallow */ } }
}

export async function fireAgentEnd(hooks: RunHooks | undefined, agentHooks: AgentHooks | undefined, ctx: MutableRunContext, agentId: string, output: string | undefined): Promise<void> {
  if (hooks?.onAgentEnd) { try { await hooks.onAgentEnd(ctx, agentId, output); } catch { /* swallow */ } }
  if (agentHooks?.onEnd) { try { await agentHooks.onEnd(ctx, output); } catch { /* swallow */ } }
}

export async function fireHandoff(hooks: RunHooks | undefined, targetAgentHooks: AgentHooks | undefined, ctx: MutableRunContext, data: HandoffData): Promise<void> {
  if (hooks?.onHandoff) { try { await hooks.onHandoff(ctx, data); } catch { /* swallow */ } }
  if (targetAgentHooks?.onHandoffReceived) { try { await targetAgentHooks.onHandoffReceived(ctx, data); } catch { /* swallow */ } }
}

export async function fireToolCall(hooks: RunHooks | undefined, agentHooks: AgentHooks | undefined, ctx: MutableRunContext, data: ToolCallData): Promise<void> {
  if (hooks?.onToolCall) { try { await hooks.onToolCall(ctx, data); } catch { /* swallow */ } }
  if (agentHooks?.onToolCall) { try { await agentHooks.onToolCall(ctx, data); } catch { /* swallow */ } }
}

export async function fireStepComplete(hooks: RunHooks | undefined, ctx: MutableRunContext, data: StepCompleteData): Promise<void> {
  if (!hooks?.onStepComplete) return;
  try { await hooks.onStepComplete(ctx, data); } catch { /* swallow */ }
}
