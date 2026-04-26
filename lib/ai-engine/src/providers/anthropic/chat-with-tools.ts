import Anthropic from '@anthropic-ai/sdk';
import type { ChatInterface, StructuredCompletionResult } from '../../domain-agent-runner.js';
import { anthropic } from './client.js';

type OpenAIToolSchema = Array<{
  type: 'function';
  function: { name: string; description: string; parameters: Record<string, unknown> };
}>;

type ChatMsg = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCallId?: string;
  name?: string;
  toolArguments?: Record<string, unknown>;
};

function toAnthropicMessages(messages: ChatMsg[]): Anthropic.MessageParam[] {
  const result: Anthropic.MessageParam[] = [];
  const nonSystem = messages.filter((m) => m.role !== 'system');
  let i = 0;

  while (i < nonSystem.length) {
    const m = nonSystem[i]!;

    if (m.role === 'user') {
      result.push({ role: 'user', content: m.content });
      i++;
    } else if (m.role === 'assistant') {
      if (m.toolCallId && m.name !== undefined) {
        const toolUseBlocks: Anthropic.ToolUseBlock[] = [];
        let j = i;
        while (j < nonSystem.length && nonSystem[j]?.role === 'assistant' && nonSystem[j]?.toolCallId) {
          const am = nonSystem[j]!;
          toolUseBlocks.push({
            type: 'tool_use',
            id: am.toolCallId!,
            name: am.name!,
            input: am.toolArguments ?? {},
          } as Anthropic.ToolUseBlock);
          j++;
        }
        result.push({ role: 'assistant', content: toolUseBlocks });
        i = j;
      } else {
        result.push({ role: 'assistant', content: m.content });
        i++;
      }
    } else if (m.role === 'tool') {
      const toolResultBlocks: Anthropic.ToolResultBlockParam[] = [];
      let j = i;
      while (j < nonSystem.length && nonSystem[j]?.role === 'tool') {
        const tm = nonSystem[j]!;
        toolResultBlocks.push({
          type: 'tool_result',
          tool_use_id: tm.toolCallId ?? '',
          content: tm.content,
        });
        j++;
      }
      result.push({ role: 'user', content: toolResultBlocks });
      i = j;
    } else {
      i++;
    }
  }

  return result;
}

export class AnthropicChatInterface implements ChatInterface {
  private readonly client: typeof anthropic;

  constructor(client: typeof anthropic = anthropic) {
    this.client = client;
  }

  async chatCompletion(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options?: { model?: string; maxTokens?: number },
  ): Promise<{ content: string }> {
    const systemMsg = messages.find((m) => m.role === 'system')?.content;
    const chatMsgs = messages.filter((m) => m.role !== 'system');
    const result = await this.client.messages.create({
      model: options?.model ?? 'claude-sonnet-4-6',
      max_tokens: options?.maxTokens ?? 2048,
      ...(systemMsg ? { system: systemMsg } : {}),
      messages: chatMsgs.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });
    return { content: result.content[0]?.type === 'text' ? result.content[0].text : '' };
  }

  async *streamChatCompletion(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options?: { model?: string; maxTokens?: number },
  ): AsyncIterable<string> {
    const systemMsg = messages.find((m) => m.role === 'system')?.content;
    const chatMsgs = messages.filter((m) => m.role !== 'system');
    const stream = this.client.messages.stream({
      model: options?.model ?? 'claude-sonnet-4-6',
      max_tokens: options?.maxTokens ?? 2048,
      ...(systemMsg ? { system: systemMsg } : {}),
      messages: chatMsgs.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });
    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        (event.delta as { type: string }).type === 'text_delta'
      ) {
        yield (event.delta as { text: string }).text;
      }
    }
  }

  async chatCompletionWithTools(
    messages: ChatMsg[],
    tools: OpenAIToolSchema,
    options?: { model?: string; maxTokens?: number },
  ): Promise<StructuredCompletionResult> {
    const systemMsg = messages.find((m) => m.role === 'system')?.content;
    const anthropicMessages = toAnthropicMessages(messages);

    const anthropicTools: Anthropic.Tool[] = tools.map((t) => ({
      name: t.function.name,
      description: t.function.description,
      input_schema: {
        type: 'object' as const,
        ...(t.function.parameters as Record<string, unknown>),
      },
    }));

    const result = await this.client.messages.create({
      model: options?.model ?? 'claude-sonnet-4-6',
      max_tokens: options?.maxTokens ?? 2048,
      ...(systemMsg ? { system: systemMsg } : {}),
      messages: anthropicMessages,
      tools: anthropicTools,
    });

    const textContent = result.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as Anthropic.TextBlock).text)
      .join('');

    const toolUseBlocks = result.content.filter(
      (b) => b.type === 'tool_use',
    ) as Anthropic.ToolUseBlock[];

    return {
      content: textContent || null,
      toolCalls: toolUseBlocks.map((b) => ({
        id: b.id,
        name: b.name,
        arguments: b.input as Record<string, unknown>,
      })),
      stopReason:
        result.stop_reason === 'tool_use'
          ? 'tool_calls'
          : result.stop_reason === 'end_turn'
            ? 'stop'
            : result.stop_reason === 'max_tokens'
              ? 'max_tokens'
              : 'other',
      usage: {
        promptTokens: result.usage.input_tokens,
        completionTokens: result.usage.output_tokens,
      },
    };
  }
}

export const anthropicChatInterface = new AnthropicChatInterface();
