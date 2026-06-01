import type OpenAI from 'openai';
import type { ChatInterface, StructuredCompletionResult } from '../../domain-agent-runner.js';
import { openai } from './client.js';

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

function toOpenAIMessages(messages: ChatMsg[]): OpenAI.Chat.ChatCompletionMessageParam[] {
  const result: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  let i = 0;
  while (i < messages.length) {
    const m = messages[i]!;
    if (m.role === 'system') {
      result.push({ role: 'system', content: m.content });
      i++;
    } else if (m.role === 'user') {
      result.push({ role: 'user', content: m.content });
      i++;
    } else if (m.role === 'assistant') {
      if (m.toolCallId && m.name !== undefined) {
        const toolCalls: OpenAI.Chat.ChatCompletionMessageToolCall[] = [];
        let j = i;
        while (j < messages.length && messages[j]?.role === 'assistant' && messages[j]?.toolCallId) {
          const am = messages[j]!;
          toolCalls.push({
            id: am.toolCallId!,
            type: 'function',
            function: {
              name: am.name!,
              arguments: JSON.stringify(am.toolArguments ?? {}),
            },
          });
          j++;
        }
        result.push({ role: 'assistant', content: null, tool_calls: toolCalls });
        i = j;
      } else {
        result.push({ role: 'assistant', content: m.content });
        i++;
      }
    } else if (m.role === 'tool') {
      result.push({
        role: 'tool',
        content: m.content,
        tool_call_id: m.toolCallId ?? '',
      });
      i++;
    } else {
      i++;
    }
  }
  return result;
}

export class OpenAIChatInterface implements ChatInterface {
  private readonly client: typeof openai;

  constructor(client: typeof openai = openai) {
    this.client = client;
  }

  async chatCompletion(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options?: { model?: string; maxTokens?: number },
  ): Promise<{ content: string }> {
    const result = await this.client.chat.completions.create({
      model: options?.model ?? 'gpt-4o',
      messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
      max_tokens: options?.maxTokens ?? 2048,
    });
    return { content: result.choices[0]?.message?.content ?? '' };
  }

  async *streamChatCompletion(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options?: { model?: string; maxTokens?: number },
  ): AsyncIterable<string> {
    const stream = await this.client.chat.completions.create({
      model: options?.model ?? 'gpt-4o',
      messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
      max_tokens: options?.maxTokens ?? 2048,
      stream: true,
    });
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  }

  async chatCompletionWithTools(
    messages: ChatMsg[],
    tools: OpenAIToolSchema,
    options?: { model?: string; maxTokens?: number },
  ): Promise<StructuredCompletionResult> {
    const openaiMessages = toOpenAIMessages(messages);
    const result = await this.client.chat.completions.create({
      model: options?.model ?? 'gpt-4o',
      messages: openaiMessages,
      tools,
      max_tokens: options?.maxTokens ?? 2048,
    });

    const choice = result.choices[0];
    const message = choice?.message;
    const rawToolCalls = (message?.tool_calls ?? []) as Array<{
      id: string;
      type: 'function';
      function: { name: string; arguments: string };
    }>;

    return {
      content: message?.content ?? null,
      toolCalls: rawToolCalls.map((tc) => ({
        id: tc.id,
        name: tc.function.name,
        arguments: (() => {
          try {
            return JSON.parse(tc.function.arguments) as Record<string, unknown>;
          } catch {
            return {} as Record<string, unknown>;
          }
        })(),
      })),
      stopReason:
        choice?.finish_reason === 'tool_calls'
          ? 'tool_calls'
          : choice?.finish_reason === 'stop'
            ? 'stop'
            : choice?.finish_reason === 'length'
              ? 'max_tokens'
              : 'other',
      usage: result.usage
        ? {
            promptTokens: result.usage.prompt_tokens,
            completionTokens: result.usage.completion_tokens,
          }
        : undefined,
    };
  }
}

export const openAIChatInterface = new OpenAIChatInterface();
