/**
 * Anthropic Token Counting Shim
 *
 * Wraps the Anthropic count_tokens endpoint (/v1/messages/count_tokens).
 * Returns exact token counts for a given messages array + system prompt WITHOUT
 * making an inference call — ideal for pre-flight budget checks and context
 * window utilisation displays in the Console.
 *
 * Falls back to character-based heuristic if the API call fails so calling
 * code always gets a usable estimate.
 */

import { anthropic } from './client.js';

export interface TokenCountRequest {
  model: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  system?: string;
  tools?: Array<Record<string, unknown>>;
}

export interface TokenCountResult {
  inputTokens: number;
  method: 'api' | 'heuristic';
  latencyMs: number;
}

function heuristicTokenCount(req: TokenCountRequest): number {
  let totalChars = 0;
  if (req.system) totalChars += req.system.length;
  for (const m of req.messages) {
    totalChars += (typeof m.content === 'string' ? m.content : JSON.stringify(m.content)).length;
  }
  if (req.tools?.length) {
    totalChars += JSON.stringify(req.tools).length;
  }
  return Math.ceil(totalChars / 4);
}

export async function countTokens(req: TokenCountRequest): Promise<TokenCountResult> {
  const start = Date.now();

  try {
    const result = await anthropic.messages.countTokens({
      model: req.model,
      messages: req.messages,
      ...(req.system ? { system: req.system } : {}),
    });

    return {
      inputTokens: result.input_tokens,
      method: 'api',
      latencyMs: Date.now() - start,
    };
  } catch {
    return {
      inputTokens: heuristicTokenCount(req),
      method: 'heuristic',
      latencyMs: Date.now() - start,
    };
  }
}

export function heuristicTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function contextWindowUsedPercent(
  inputTokens: number,
  contextWindowSize: number,
): number {
  return Math.min(100, (inputTokens / contextWindowSize) * 100);
}
