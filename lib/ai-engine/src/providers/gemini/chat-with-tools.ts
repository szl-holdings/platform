import type { FunctionCall, FunctionDeclaration, GoogleGenAI, Part, Tool } from '@google/genai';
import type { ChatInterface, StructuredCompletionResult } from '../../domain-agent-runner.js';
import { ai } from './client.js';

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

type GeminiContent = {
  role: string;
  parts: Part[];
};

function toGeminiContents(messages: ChatMsg[]): GeminiContent[] {
  const result: GeminiContent[] = [];
  const nonSystem = messages.filter((m) => m.role !== 'system');
  let i = 0;

  while (i < nonSystem.length) {
    const m = nonSystem[i]!;

    if (m.role === 'user') {
      result.push({ role: 'user', parts: [{ text: m.content }] });
      i++;
    } else if (m.role === 'assistant') {
      if (m.toolCallId && m.name !== undefined) {
        const functionCallParts: Part[] = [];
        let j = i;
        while (j < nonSystem.length && nonSystem[j]?.role === 'assistant' && nonSystem[j]?.toolCallId) {
          const am = nonSystem[j]!;
          functionCallParts.push({
            functionCall: { name: am.name!, args: am.toolArguments ?? {} } as FunctionCall,
          });
          j++;
        }
        result.push({ role: 'model', parts: functionCallParts });
        i = j;
      } else {
        result.push({ role: 'model', parts: [{ text: m.content }] });
        i++;
      }
    } else if (m.role === 'tool') {
      const functionResponseParts: Part[] = [];
      let j = i;
      while (j < nonSystem.length && nonSystem[j]?.role === 'tool') {
        const tm = nonSystem[j]!;
        functionResponseParts.push({
          functionResponse: {
            name: tm.name ?? '',
            response: { result: tm.content },
          },
        });
        j++;
      }
      result.push({ role: 'user', parts: functionResponseParts });
      i = j;
    } else {
      i++;
    }
  }

  return result;
}

function toGeminiTools(tools: OpenAIToolSchema): Tool[] {
  const declarations: FunctionDeclaration[] = tools.map((t) => ({
    name: t.function.name,
    description: t.function.description,
    parameters: t.function.parameters as FunctionDeclaration['parameters'],
  }));
  return [{ functionDeclarations: declarations }];
}

function extractSystemInstruction(messages: ChatMsg[]): string | undefined {
  return messages.find((m) => m.role === 'system')?.content;
}

export class GeminiChatInterface implements ChatInterface {
  private readonly client: GoogleGenAI;

  constructor(client: GoogleGenAI = ai) {
    this.client = client;
  }

  async chatCompletion(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options?: { model?: string; maxTokens?: number },
  ): Promise<{ content: string }> {
    const systemInstruction = messages.find((m) => m.role === 'system')?.content;
    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : m.role,
        parts: [{ text: m.content }],
      }));

    const result = await this.client.models.generateContent({
      model: options?.model ?? 'gemini-2.0-flash-exp',
      contents,
      config: {
        maxOutputTokens: options?.maxTokens ?? 2048,
        ...(systemInstruction ? { systemInstruction } : {}),
      },
    });

    return { content: result.text ?? '' };
  }

  async *streamChatCompletion(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options?: { model?: string; maxTokens?: number },
  ): AsyncIterable<string> {
    const systemInstruction = messages.find((m) => m.role === 'system')?.content;
    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : m.role,
        parts: [{ text: m.content }],
      }));

    const stream = await this.client.models.generateContentStream({
      model: options?.model ?? 'gemini-2.0-flash-exp',
      contents,
      config: {
        maxOutputTokens: options?.maxTokens ?? 2048,
        ...(systemInstruction ? { systemInstruction } : {}),
      },
    });

    for await (const chunk of stream) {
      if (chunk.text) yield chunk.text;
    }
  }

  async chatCompletionWithTools(
    messages: ChatMsg[],
    tools: OpenAIToolSchema,
    options?: { model?: string; maxTokens?: number },
  ): Promise<StructuredCompletionResult> {
    const systemInstruction = extractSystemInstruction(messages);
    const contents = toGeminiContents(messages);
    const geminiTools = toGeminiTools(tools);

    const result = await this.client.models.generateContent({
      model: options?.model ?? 'gemini-2.0-flash-exp',
      contents,
      config: {
        maxOutputTokens: options?.maxTokens ?? 2048,
        ...(systemInstruction ? { systemInstruction } : {}),
        tools: geminiTools,
      },
    });

    const parts: Part[] = result.candidates?.[0]?.content?.parts ?? [];
    const finishReason: string = result.candidates?.[0]?.finishReason ?? '';

    const textContent = parts
      .filter((p): p is Part & { text: string } => typeof p.text === 'string')
      .map((p) => p.text)
      .join('');

    const functionCallParts = parts.filter(
      (p): p is Part & { functionCall: FunctionCall } => p.functionCall !== undefined,
    );

    return {
      content: textContent || (result.text ?? null),
      toolCalls: functionCallParts.map((p, idx) => ({
        id: `gemini-tc-${Date.now()}-${idx}`,
        name: p.functionCall.name ?? '',
        arguments: (p.functionCall.args as Record<string, unknown>) ?? {},
      })),
      stopReason:
        functionCallParts.length > 0
          ? 'tool_calls'
          : finishReason === 'STOP'
            ? 'stop'
            : finishReason === 'MAX_TOKENS'
              ? 'max_tokens'
              : 'other',
    };
  }
}

export const geminiChatInterface = new GeminiChatInterface();
