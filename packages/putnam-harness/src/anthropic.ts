// Thin wrapper around the Replit-provisioned Anthropic integration. Keys come
// from AI_INTEGRATIONS_ANTHROPIC_API_KEY + AI_INTEGRATIONS_ANTHROPIC_BASE_URL.
// We use Sonnet for candidate generation (fast, cheap, very good math) and
// Opus for adjudication.

import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
  const baseURL = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  if (!apiKey || !baseURL) {
    throw new Error(
      "putnam-harness: Anthropic AI integration not provisioned " +
        "(AI_INTEGRATIONS_ANTHROPIC_{API_KEY,BASE_URL} missing)",
    );
  }
  _client = new Anthropic({ apiKey, baseURL });
  return _client;
}

export const CANDIDATE_MODEL = "claude-sonnet-4-6";
export const JUDGE_MODEL = "claude-opus-4-7";

export interface CompletionResult {
  readonly text: string;
  readonly tokensIn: number;
  readonly tokensOut: number;
  readonly wallMs: number;
  readonly model: string;
}

export async function complete(opts: {
  model: string;
  system: string;
  prompt: string;
  maxTokens?: number;
}): Promise<CompletionResult> {
  const client = getAnthropic();
  const t0 = Date.now();
  // claude-opus-4-7 rejects temperature/top_p/top_k; omit them entirely.
  const isOpus47 = opts.model === "claude-opus-4-7";
  const params: Anthropic.MessageCreateParams = {
    model: opts.model,
    max_tokens: opts.maxTokens ?? 4096,
    system: opts.system,
    messages: [{ role: "user", content: opts.prompt }],
  };
  if (!isOpus47) {
    // Sonnet supports temperature; keep it low for math.
    (params as Anthropic.MessageCreateParamsNonStreaming).temperature = 0.2;
  }
  const msg = await client.messages.create(params);
  const wallMs = Date.now() - t0;
  const text = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  return {
    text,
    tokensIn: msg.usage.input_tokens,
    tokensOut: msg.usage.output_tokens,
    wallMs,
    model: opts.model,
  };
}
