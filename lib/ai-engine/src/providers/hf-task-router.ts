import { enforceInferenceGates, isGovernanceGateError } from './inference-gates.js';

/**
 * hf-task-router — the shared, governance-enforcing task-inference router for
 * Hugging Face Inference API endpoints (text-classification, NER,
 * summarization, feature-extraction, zero-shot, etc).
 *
 * The chat/completions model router (`routeModelCallWithFailover`) covers
 * provider switching for /v1/chat/completions only. Task endpoints have
 * different request/response shapes and are POSTed to
 * `https://api-inference.huggingface.co/models/{model}` directly, but they
 * MUST share the same governance contract:
 *   - 5-gate enforcement (registry, license, sensitivity, live, prod) on
 *     every model attempted
 *   - configured failover chain walked in order
 *   - terminal error after all attempts (NEVER silent mock fallback)
 *
 * This module is the single source of truth for that contract so api-server
 * routes, connector adapters, and any future caller all behave identically.
 */

const HF_API_BASE = 'https://api-inference.huggingface.co/models';

/**
 * Per-task failover chains used when the caller does not supply explicit
 * fallbacks. Mirrors the spirit of model-registry.FAILOVER_CHAINS but keyed
 * by HF task model id since task endpoints (vs chat completions) have their
 * own model conventions. Operators may override the primary at the call site
 * (or via env) and the chain will still be honored.
 */
export const HF_TASK_FAILOVERS: Record<string, string[]> = {
  // Legal-domain BERT → general-purpose zero-shot as fallback
  'nlpaueb/legal-bert-base-uncased': ['facebook/bart-large-mnli'],
  // Financial sentiment → general zero-shot
  'ProsusAI/finbert': ['facebook/bart-large-mnli'],
  // Embeddings: bge-large → bge-m3
  'BAAI/bge-large-en-v1.5': ['BAAI/bge-m3'],
};

export interface HfTaskCallResult<T> {
  result: T;
  modelUsed: string;
}

export interface HfTaskCallOptions {
  /** Override env var for the HF token (defaults to HUGGINGFACE_API_KEY/HF_TOKEN). */
  token?: string;
  timeoutMs?: number;
  /**
   * Explicit fallback list. When omitted, the configured chain in
   * HF_TASK_FAILOVERS for the primary model is used.
   */
  fallbackModels?: string[];
}

function getDefaultToken(): string | undefined {
  return process.env.HUGGINGFACE_API_KEY ?? process.env.HF_TOKEN;
}

async function postOne<T>(
  model: string,
  body: unknown,
  token: string | undefined,
  timeoutMs: number,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${HF_API_BASE}/${model}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw Object.assign(new Error(`hf_api_error:${res.status}:${text.slice(0, 200)}`), {
        statusCode: res.status === 503 ? 503 : 502,
      });
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Run a Hugging Face task-inference call against `primaryModel` with
 * registry-driven failover. Each candidate (primary + fallbacks) is gated by
 * the shared 5-condition governance check before any network call. If every
 * candidate fails (governance or live), the LAST error is thrown — there is
 * no mock fallback under any circumstance.
 */
export async function callHfTaskWithGovernance<T>(
  primaryModel: string,
  body: unknown,
  options: HfTaskCallOptions = {},
): Promise<HfTaskCallResult<T>> {
  const token = options.token ?? getDefaultToken();
  const timeoutMs = options.timeoutMs ?? 25_000;
  const explicit = options.fallbackModels;
  const fallbacks = explicit ?? HF_TASK_FAILOVERS[primaryModel] ?? [];
  const models = [primaryModel, ...fallbacks.filter((m) => m !== primaryModel)];

  let lastError: Error | null = null;
  for (const model of models) {
    try {
      enforceInferenceGates(model);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // Gate-blocked: try next candidate (also gate-checked).
      continue;
    }
    try {
      const result = await postOne<T>(model, body, token, timeoutMs);
      return { result, modelUsed: model };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // Live-call failure: try next candidate.
    }
  }
  throw lastError ?? new Error('failover_chain_exhausted');
}

export { isGovernanceGateError };
