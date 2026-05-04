import type { RouteResult } from './hf-router.js';
import { enforceInferenceGates } from './inference-gates.js';

export interface HFChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_call_id?: string;
}

export interface HFToolDef {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface HFCompletionResult {
  content: string;
  model: string;
  provider: string;
  finishReason: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number } | null;
  latencyMs: number;
  toolCalls: Array<{ id: string; name: string; arguments: Record<string, unknown> }>;
  raw: unknown;
}

const HF_API_BASE =
  process.env.HF_API_BASE || 'https://router.huggingface.co/hf-inference/v1';

function getHeaders(): Record<string, string> {
  const token = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function chatCompletion(
  messages: HFChatMessage[],
  route: RouteResult,
  options?: {
    tools?: HFToolDef[];
    responseFormat?: { type: 'json_object' } | { type: 'text' };
    stream?: boolean;
    signal?: AbortSignal;
  },
): Promise<HFCompletionResult> {
  // 5-gate governance check (registry, license, sensitivity, env, creds).
  // When the api-server is the host it registers a registry-aware checker
  // so all five gates apply; otherwise the shared module fails closed.
  enforceInferenceGates(route.model);
  const start = Date.now();
  const body: Record<string, unknown> = {
    model: route.model,
    messages,
    max_tokens: route.maxTokens,
    temperature: route.temperature,
  };

  if (options?.tools?.length) body.tools = options.tools;
  if (options?.responseFormat) body.response_format = options.responseFormat;
  if (options?.stream) body.stream = true;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${HF_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
      signal: options?.signal || controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`HF API error ${response.status}: ${errorText}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string;
          tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }>;
        };
        finish_reason?: string;
      }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
    };

    const choice = data.choices?.[0];
    const toolCalls = (choice?.message?.tool_calls || []).map((tc) => ({
      id: tc.id,
      name: tc.function.name,
      arguments: (() => {
        try {
          return JSON.parse(tc.function.arguments);
        } catch {
          return {};
        }
      })(),
    }));

    return {
      content: choice?.message?.content || '',
      model: route.model,
      provider: route.provider,
      finishReason: choice?.finish_reason || 'stop',
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens || 0,
            completionTokens: data.usage.completion_tokens || 0,
            totalTokens: data.usage.total_tokens || 0,
          }
        : null,
      latencyMs: Date.now() - start,
      toolCalls,
      raw: data,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function chatCompletionWithFallback(
  messages: HFChatMessage[],
  route: RouteResult,
  options?: Parameters<typeof chatCompletion>[2],
): Promise<HFCompletionResult> {
  const models = [
    route.model,
    process.env.HF_SECONDARY_LLM || 'Qwen/Qwen3-8B',
    process.env.HF_FALLBACK_LLM || 'Qwen/Qwen3-0.6B',
  ];
  const uniqueModels = [...new Set(models)];

  let lastError: Error | null = null;
  for (const model of uniqueModels) {
    try {
      return await chatCompletion(messages, { ...route, model }, options);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }
  throw lastError || new Error('All models failed');
}

export interface HFAudioInferenceResult {
  text: string;
  model: string;
  provider: string;
  latencyMs: number;
}

export async function audioInference(
  audioBuffer: Buffer,
  modelId: string,
  options?: { contentType?: string; signal?: AbortSignal },
): Promise<HFAudioInferenceResult> {
  // 5-gate governance check applies to ALL HF inference, including audio.
  enforceInferenceGates(modelId);
  const start = Date.now();
  const token = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY;
  const headers: Record<string, string> = {
    'Content-Type': options?.contentType || 'audio/wav',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${modelId}`,
      {
        method: 'POST',
        headers,
        body: audioBuffer as unknown as BodyInit,
        signal: options?.signal || controller.signal,
      },
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`HF audio inference ${response.status}: ${errorText.slice(0, 300)}`);
    }

    const data = (await response.json()) as { text?: string };
    return {
      text: data.text ?? '',
      model: modelId,
      provider: 'huggingface',
      latencyMs: Date.now() - start,
    };
  } finally {
    clearTimeout(timer);
  }
}
