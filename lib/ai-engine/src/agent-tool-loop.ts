import { MAX_TOOL_ROUNDS } from './domain-agent-runner.js';
import {
  getToolDefinitionsForAgent,
  invokeToolWithGovernance,
  recordToolCall,
  toOpenAIToolSchema,
} from './tool-bridge.js';
import type { AgentDefinition } from './types.js';

type LoopMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  toolCallId?: string;
  name?: string;
  toolArguments?: Record<string, unknown>;
};

export interface ToolLoopResult {
  response: string;
  tokensUsed: number;
  toolCallCount: number;
}

type ToolCallEvent = {
  toolCallId: string;
  toolName: string;
  toolInput: Record<string, unknown>;
};

type ToolResultEvent = {
  toolCallId: string;
  toolName: string;
  toolOutput: string;
  success: boolean;
};

export interface ToolLoopCallbacks {
  onToolCallStart?: (events: ToolCallEvent[]) => void;
  onToolCallResult?: (event: ToolResultEvent) => void;
}

/**
 * Governance context threaded into every tool call so that plan-mode,
 * trust-tier, and covenant hooks have full context to evaluate.
 */
export interface GovernanceContext {
  session_id?: string;
  permission_mode?: string;
  trust_tier?: number;
  plan_id?: string;
  /** Active skill ID — used to resolve covenant metadata in invokeToolWithGovernance */
  skill_id?: string;
  /** Pre-resolved covenant metadata; if omitted, tool-bridge looks it up from the skill registry */
  covenant_metadata?: {
    allowed_tools?: string[];
    blocked_tools?: string[];
    covenant_policy_bundle?: string;
  };
}

async function runToolCalls(
  agentId: string,
  toolCalls: Array<{ id: string; name: string; arguments: Record<string, unknown> }>,
  messages: LoopMessage[],
  callbacks: ToolLoopCallbacks | undefined,
  governance: GovernanceContext,
): Promise<{ toolCallCount: number }> {
  callbacks?.onToolCallStart?.(
    toolCalls.map((tc) => ({
      toolCallId: tc.id,
      toolName: tc.name,
      toolInput: tc.arguments,
    })),
  );

  for (const toolCall of toolCalls) {
    messages.push({
      role: 'assistant',
      content: `[tool_call:${toolCall.name}]`,
      toolCallId: toolCall.id,
      name: toolCall.name,
      toolArguments: toolCall.arguments,
    });
  }

  const results = await Promise.all(
    toolCalls.map(async (toolCall) => {
      const gwResult = await invokeToolWithGovernance(agentId, toolCall.name, toolCall.arguments, {
        session_id: governance.session_id,
        permission_mode: governance.permission_mode,
        trust_tier: governance.trust_tier,
        plan_id: governance.plan_id,
        skill_id: governance.skill_id,
        covenant_metadata: governance.covenant_metadata,
      });

      void recordToolCall(
        agentId,
        toolCall.name,
        toolCall.arguments,
        gwResult.output,
        gwResult.success,
        gwResult.latencyMs,
        { decisionOutcome: gwResult.decisionOutcome, traceId: gwResult.traceId },
      );

      callbacks?.onToolCallResult?.({
        toolCallId: toolCall.id,
        toolName: toolCall.name,
        toolOutput: gwResult.output,
        success: gwResult.success,
      });

      return { toolCall, gwResult };
    }),
  );

  for (const { toolCall, gwResult } of results) {
    messages.push({
      role: 'tool',
      content: gwResult.output,
      toolCallId: toolCall.id,
      name: toolCall.name,
    });
  }

  return { toolCallCount: toolCalls.length };
}

async function runOpenAIToolLoop(
  agent: AgentDefinition,
  systemPrompt: string,
  userQuery: string,
  model: string,
  maxTokens: number,
  callbacks?: ToolLoopCallbacks,
  governance: GovernanceContext = {},
): Promise<ToolLoopResult> {
  const { openAIChatInterface } = await import('./providers/openai/chat-with-tools.js');
  const toolDefs = getToolDefinitionsForAgent(agent.tools);
  const toolSchemas = toOpenAIToolSchema(toolDefs);

  const messages: LoopMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userQuery },
  ];

  let tokensUsed = 0;
  let toolCallCount = 0;
  let rounds = 0;

  while (rounds < MAX_TOOL_ROUNDS) {
    rounds++;

    const result = await openAIChatInterface.chatCompletionWithTools(
      messages as Parameters<typeof openAIChatInterface.chatCompletionWithTools>[0],
      toolSchemas,
      { model, maxTokens },
    );

    if (result.usage) {
      tokensUsed += result.usage.promptTokens + result.usage.completionTokens;
    }

    if (result.toolCalls.length === 0) {
      return { response: result.content ?? 'Analysis complete.', tokensUsed, toolCallCount };
    }

    const { toolCallCount: roundCalls } = await runToolCalls(
      agent.id,
      result.toolCalls,
      messages,
      callbacks,
      governance,
    );
    toolCallCount += roundCalls;
  }

  return {
    response: "I've reached the maximum analysis steps. Based on available data, here's my assessment.",
    tokensUsed,
    toolCallCount,
  };
}

async function runAnthropicToolLoop(
  agent: AgentDefinition,
  systemPrompt: string,
  userQuery: string,
  model: string,
  maxTokens: number,
  callbacks?: ToolLoopCallbacks,
  governance: GovernanceContext = {},
): Promise<ToolLoopResult> {
  const { anthropicChatInterface } = await import('./providers/anthropic/chat-with-tools.js');
  const toolDefs = getToolDefinitionsForAgent(agent.tools);
  const toolSchemas = toOpenAIToolSchema(toolDefs);

  const messages: LoopMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userQuery },
  ];

  let tokensUsed = 0;
  let toolCallCount = 0;
  let rounds = 0;

  while (rounds < MAX_TOOL_ROUNDS) {
    rounds++;

    const result = await anthropicChatInterface.chatCompletionWithTools(
      messages as Parameters<typeof anthropicChatInterface.chatCompletionWithTools>[0],
      toolSchemas,
      { model, maxTokens },
    );

    if (result.usage) {
      tokensUsed += result.usage.promptTokens + result.usage.completionTokens;
    }

    if (result.toolCalls.length === 0) {
      return { response: result.content ?? 'Analysis complete.', tokensUsed, toolCallCount };
    }

    const { toolCallCount: roundCalls } = await runToolCalls(
      agent.id,
      result.toolCalls,
      messages,
      callbacks,
      governance,
    );
    toolCallCount += roundCalls;
  }

  return {
    response: "I've reached the maximum analysis steps. Based on available data, here's my assessment.",
    tokensUsed,
    toolCallCount,
  };
}

async function runGeminiToolLoop(
  agent: AgentDefinition,
  systemPrompt: string,
  userQuery: string,
  model: string,
  maxTokens: number,
  callbacks?: ToolLoopCallbacks,
  governance: GovernanceContext = {},
): Promise<ToolLoopResult> {
  const { geminiChatInterface } = await import('./providers/gemini/chat-with-tools.js');
  const toolDefs = getToolDefinitionsForAgent(agent.tools);
  const toolSchemas = toOpenAIToolSchema(toolDefs);

  const messages: LoopMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userQuery },
  ];

  let tokensUsed = 0;
  let toolCallCount = 0;
  let rounds = 0;

  while (rounds < MAX_TOOL_ROUNDS) {
    rounds++;

    const result = await geminiChatInterface.chatCompletionWithTools(
      messages as Parameters<typeof geminiChatInterface.chatCompletionWithTools>[0],
      toolSchemas,
      { model, maxTokens },
    );

    if (result.usage) {
      tokensUsed += result.usage.promptTokens + result.usage.completionTokens;
    }

    if (result.toolCalls.length === 0) {
      return { response: result.content ?? 'Analysis complete.', tokensUsed, toolCallCount };
    }

    const { toolCallCount: roundCalls } = await runToolCalls(
      agent.id,
      result.toolCalls,
      messages,
      callbacks,
      governance,
    );
    toolCallCount += roundCalls;
  }

  return {
    response: "I've reached the maximum analysis steps. Based on available data, here's my assessment.",
    tokensUsed,
    toolCallCount,
  };
}

export async function runAgentToolLoop(
  agent: AgentDefinition,
  systemPrompt: string,
  userQuery: string,
  model: string,
  maxTokens = 2048,
  callbacks?: ToolLoopCallbacks,
  governance: GovernanceContext = {},
): Promise<ToolLoopResult> {
  if (agent.tools.length === 0) {
    return { response: '', tokensUsed: 0, toolCallCount: 0 };
  }

  if (agent.preferredProvider === 'anthropic') {
    return runAnthropicToolLoop(agent, systemPrompt, userQuery, model, maxTokens, callbacks, governance);
  }
  if (agent.preferredProvider === 'gemini') {
    try {
      return await runGeminiToolLoop(agent, systemPrompt, userQuery, model, maxTokens, callbacks, governance);
    } catch {
      return runOpenAIToolLoop(agent, systemPrompt, userQuery, 'gpt-5.2', maxTokens, callbacks, governance);
    }
  }
  return runOpenAIToolLoop(agent, systemPrompt, userQuery, model, maxTokens, callbacks, governance);
}
