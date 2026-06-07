/**
 * OpenAI Responses API Adapter
 *
 * Wraps `openai.responses.create` and translates to/from the existing
 * `ChatMessage[]` / `ChatCompletionResult` contract so all upstream call
 * sites can migrate with minimal surface area changes.
 *
 * Key Responses API advantages over Chat Completions:
 * - Cleaner separation of `instructions` (system) vs `input` (conversation)
 * - Built-in agentic loop support (web_search, file_search, code_interpreter, MCP)
 * - Stateful multi-turn via `previous_response_id` — no repeated token cost
 * - 40–80% improved cache utilization from stable `instructions` hashing
 * - ~3% benchmark improvement on reasoning tasks
 *
 * Audio modalities remain on Chat Completions (Responses API audio: "coming soon").
 * Batch file-upload jobs use the REST file/batch endpoints directly and are unaffected.
 */

import { openai } from './client.js';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ResponsesResult {
  content: string;
  model: string;
  provider: string;
  responseId?: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
  };
}

export interface ResponsesOptions {
  model?: string;
  maxOutputTokens?: number;
  previousResponseId?: string;
  instructions?: string;
}

/**
 * Translate a ChatMessage[] into the Responses API `instructions` + `input` shape.
 * System messages are concatenated into `instructions`; user/assistant turns
 * become typed `input` items.
 */
export function chatMessagesToResponsesInput(messages: ChatMessage[]): {
  instructions: string | undefined;
  input: Array<{ role: 'user' | 'assistant'; content: string }>;
} {
  const systemParts = messages.filter((m) => m.role === 'system').map((m) => m.content);
  const instructions = systemParts.length > 0 ? systemParts.join('\n\n') : undefined;

  const input = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

  return { instructions, input };
}

/**
 * Create a completion using the OpenAI Responses API.
 * Accepts the same ChatMessage[] format for easy migration.
 */
export async function createResponse(
  messages: ChatMessage[],
  options: ResponsesOptions = {},
): Promise<ResponsesResult> {
  const model = options.model ?? 'gpt-4o-mini';
  const { instructions: derivedInstructions, input } = chatMessagesToResponsesInput(messages);

  const instructions = options.instructions ?? derivedInstructions;

  const params: Parameters<typeof openai.responses.create>[0] = {
    model,
    input: input.length === 1 && input[0]?.role === 'user'
      ? (input[0].content as string)
      : (input as Parameters<typeof openai.responses.create>[0]['input']),
    ...(options.maxOutputTokens !== undefined && { max_output_tokens: options.maxOutputTokens }),
    ...(instructions !== undefined && { instructions }),
    ...(options.previousResponseId !== undefined && {
      previous_response_id: options.previousResponseId,
    }),
  };

  const response = await openai.responses.create(params);

  const content =
    'output_text' in response && typeof response.output_text === 'string'
      ? response.output_text
      : (response as unknown as { output: Array<{ type: string; content?: Array<{ text?: string }>; text?: string }> })
          .output?.find((o) => o.type === 'message')
          ?.content?.find((c) => c.text !== undefined)?.text ?? '';

  const usage = (response as unknown as { usage?: { input_tokens?: number; output_tokens?: number } }).usage;

  return {
    content,
    model,
    provider: 'openai',
    responseId: 'id' in response ? (response as { id: string }).id : undefined,
    usage: {
      promptTokens: usage?.input_tokens ?? 0,
      completionTokens: usage?.output_tokens ?? 0,
    },
  };
}

/**
 * Create a response with explicit `instructions` separation.
 * Preferred over createResponse() for agentic loop callers that manage
 * system prompt and conversation input independently.
 */
export async function createResponseWithInstructions(
  instructions: string,
  input: string,
  options: Omit<ResponsesOptions, 'instructions'> = {},
): Promise<ResponsesResult> {
  return createResponse(
    [
      { role: 'system', content: instructions },
      { role: 'user', content: input },
    ],
    { ...options, instructions },
  );
}

/**
 * Stream a response using the Responses API.
 * Yields incremental text delta strings suitable for SSE streaming.
 *
 * When the stream completes, `onComplete` is called with the terminal response
 * ID (if available). Use this to chain `previous_response_id` on follow-up turns.
 *
 * Usage:
 * ```ts
 * for await (const chunk of createResponseStream(messages, options, {
 *   onComplete: ({ responseId }) => storeResponseId(responseId),
 * })) {
 *   res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
 * }
 * ```
 */
export async function* createResponseStream(
  messages: ChatMessage[],
  options: ResponsesOptions = {},
  callbacks?: { onComplete?: (result: { responseId?: string }) => void },
): AsyncGenerator<string, void, unknown> {
  const model = options.model ?? 'gpt-4o-mini';
  const { instructions: derivedInstructions, input } = chatMessagesToResponsesInput(messages);
  const instructions = options.instructions ?? derivedInstructions;

  const params: Parameters<typeof openai.responses.create>[0] & { stream: true } = {
    model,
    input: input.length === 1 && input[0]?.role === 'user'
      ? (input[0].content as string)
      : (input as Parameters<typeof openai.responses.create>[0]['input']),
    stream: true,
    ...(options.maxOutputTokens !== undefined && { max_output_tokens: options.maxOutputTokens }),
    ...(instructions !== undefined && { instructions }),
    ...(options.previousResponseId !== undefined && {
      previous_response_id: options.previousResponseId,
    }),
  };

  const stream = await openai.responses.create(params);

  let terminalResponseId: string | undefined;

  for await (const event of stream as AsyncIterable<Record<string, unknown>>) {
    if (
      event.type === 'response.output_text.delta' &&
      typeof (event as Record<string, unknown>).delta === 'string'
    ) {
      yield (event as Record<string, unknown>).delta as string;
    } else if (event.type === 'response.completed') {
      const completedResponse = (event as Record<string, unknown>).response as Record<string, unknown> | undefined;
      terminalResponseId = typeof completedResponse?.id === 'string' ? completedResponse.id : undefined;
    }
  }

  if (callbacks?.onComplete) {
    callbacks.onComplete({ responseId: terminalResponseId });
  }
}
