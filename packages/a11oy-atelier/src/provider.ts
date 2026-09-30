import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { promisify } from 'node:util';
import type {
  AtelierAskRequest,
  AtelierProviderHealth,
  AtelierProviderId,
  AtelierProviderResult,
  AtelierUsage,
} from './contracts.js';

const execFileAsync = promisify(execFile);
const XAI_RESPONSES_URL = 'https://api.x.ai/v1/responses';
export const DEFAULT_GROK_MODEL = 'grok-4.7';
export const ALLOWED_GROK_MODELS: readonly string[] = Object.freeze([
  DEFAULT_GROK_MODEL,
  'grok-4.6',
]);

export class AtelierProviderUnavailableError extends Error {
  readonly code = 'ATELIER_PROVIDER_UNAVAILABLE';
}

type GrokModelResolution = { ok: true; model: string } | { ok: false; reason: string };

/** Resolve an explicit request, estate override, legacy override, or reviewed default. */
export function tryResolveGrokModel(
  requestedModel?: string,
  env: NodeJS.ProcessEnv = process.env,
): GrokModelResolution {
  const candidates: readonly [string, string | undefined][] =
    requestedModel !== undefined
      ? [['request.model', requestedModel]]
      : [
          ['SZL_GROK_MODEL', env.SZL_GROK_MODEL],
          ['A11OY_ATELIER_MODEL', env.A11OY_ATELIER_MODEL],
        ];
  for (const [source, raw] of candidates) {
    const model = raw?.trim();
    if (!model && source !== 'request.model') continue;
    if (model && ALLOWED_GROK_MODELS.includes(model)) return { ok: true, model };
    return {
      ok: false,
      reason: `${source} is not an allowlisted Grok model id; use grok-4.7 or the grok-4.6 rollback. No provider call was made.`,
    };
  }
  return { ok: true, model: DEFAULT_GROK_MODEL };
}

export function resolveGrokModel(requestedModel?: string): string {
  const resolution = tryResolveGrokModel(requestedModel);
  if (!resolution.ok) throw new AtelierProviderUnavailableError(resolution.reason);
  return resolution.model;
}

export class AtelierProviderResponseError extends Error {
  readonly code = 'ATELIER_PROVIDER_RESPONSE_INVALID';
}

export interface AtelierProvider {
  readonly id: AtelierProviderId;
  readonly label: string;
  readonly localOnly: boolean;
  health(model?: string): AtelierProviderHealth;
  generate(request: AtelierAskRequest): Promise<AtelierProviderResult>;
}

interface JsonRecord {
  [key: string]: unknown;
}

function asRecord(value: unknown): JsonRecord | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonRecord)
    : undefined;
}

/** Recognize a known pre-response quota rejection without exposing raw CLI diagnostics. */
export function isGrokBuildQuotaError(error: unknown): boolean {
  const record = asRecord(error);
  const stderr = record?.stderr;
  if (typeof stderr !== 'string') return false;
  const stdout = record?.stdout;
  if (typeof stdout === 'string' && stdout.trim()) {
    try {
      if (asRecord(JSON.parse(stdout))?.type !== 'error') return false;
    } catch {
      return false;
    }
  }
  const ansiSequence = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');
  const diagnostic = stderr.replace(ansiSequence, '');
  return /responses API error\s+status=402 Payment Required\s+error_message=Grok Build usage balance exhausted\b/.test(
    diagnostic,
  );
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined;
}

function extractResponseText(payload: unknown): string {
  const root = asRecord(payload);
  if (!root)
    throw new AtelierProviderResponseError('Provider returned a non-object JSON response.');
  if (typeof root.output_text === 'string' && root.output_text.trim())
    return root.output_text.trim();
  const output = Array.isArray(root.output) ? root.output : [];
  const chunks: string[] = [];
  for (const item of output) {
    const record = asRecord(item);
    // Grok 4.7 always returns encrypted reasoning items. The v1 text capsule
    // neither retains nor exposes them; only final assistant text is admitted.
    if (record?.type !== 'message' || record.role !== 'assistant') continue;
    const content = Array.isArray(record.content) ? record.content : [];
    for (const part of content) {
      const contentRecord = asRecord(part);
      if (contentRecord?.type !== 'output_text') continue;
      if (typeof contentRecord.text === 'string') chunks.push(contentRecord.text);
      const nested = asRecord(contentRecord.text);
      if (nested && typeof nested.value === 'string') chunks.push(nested.value);
    }
  }
  const text = chunks.join('\n').trim();
  if (!text)
    throw new AtelierProviderResponseError('Provider response did not contain output text.');
  return text;
}

function extractUsage(payload: unknown): AtelierUsage {
  const root = asRecord(payload);
  const usage = asRecord(root?.usage) ?? {};
  const inputDetails = asRecord(usage.input_tokens_details) ?? {};
  const outputDetails = asRecord(usage.output_tokens_details) ?? {};
  const normalized: AtelierUsage = {};
  const inputTokens = optionalNumber(usage.input_tokens ?? usage.prompt_tokens);
  const cachedInputTokens = optionalNumber(
    inputDetails.cached_tokens ?? usage.cached_tokens ?? usage.cache_read_input_tokens,
  );
  const outputTokens = optionalNumber(usage.output_tokens ?? usage.completion_tokens);
  const reasoningTokens = optionalNumber(outputDetails.reasoning_tokens ?? usage.reasoning_tokens);
  const totalTokens = optionalNumber(usage.total_tokens);
  if (inputTokens !== undefined) normalized.inputTokens = inputTokens;
  if (cachedInputTokens !== undefined) normalized.cachedInputTokens = cachedInputTokens;
  if (outputTokens !== undefined) normalized.outputTokens = outputTokens;
  if (reasoningTokens !== undefined) normalized.reasoningTokens = reasoningTokens;
  if (totalTokens !== undefined) normalized.totalTokens = totalTokens;
  return normalized;
}

export class XaiResponsesProvider implements AtelierProvider {
  readonly id = 'xai' as const;
  readonly label = 'xAI API';
  readonly localOnly = false;

  constructor(
    private readonly apiKey = process.env.A11OY_ATELIER_XAI_API_KEY ?? '',
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  health(requestedModel?: string): AtelierProviderHealth {
    const configured = this.apiKey.trim().length > 0;
    const resolution = tryResolveGrokModel(requestedModel);
    if (!resolution.ok) {
      return {
        provider: this.id,
        model: 'UNAVAILABLE',
        configured,
        available: false,
        localOnly: false,
        evidenceState: 'UNAVAILABLE',
        reason: resolution.reason,
      };
    }
    const model = resolution.model;
    return {
      provider: this.id,
      model,
      configured,
      available: configured,
      localOnly: false,
      evidenceState: configured ? 'OBSERVED' : 'UNAVAILABLE',
      reason: configured
        ? 'A11OY_ATELIER_XAI_API_KEY is configured; no inference probe was charged.'
        : 'A11OY_ATELIER_XAI_API_KEY is not configured.',
    };
  }

  async generate(request: AtelierAskRequest): Promise<AtelierProviderResult> {
    if (!this.apiKey.trim()) {
      throw new AtelierProviderUnavailableError('A11OY_ATELIER_XAI_API_KEY is not configured.');
    }
    const model = resolveGrokModel(request.model);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 180_000);
    try {
      const response = await this.fetchImpl(XAI_RESPONSES_URL, {
        method: 'POST',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': 'a11oy-atelier/0.1.0',
        },
        body: JSON.stringify({
          model,
          input: request.prompt,
          reasoning: { effort: request.reasoningEffort },
          max_output_tokens: request.maxOutputTokens,
          store: false,
        }),
      });
      if (response.status >= 300 && response.status < 400) {
        throw new AtelierProviderResponseError(
          `Redirects are disabled for provider POSTs (${response.status}).`,
        );
      }
      const payload = (await response.json().catch(() => undefined)) as unknown;
      if (!response.ok) {
        // These status codes are explicit pre-inference rejections. The route may
        // release its reservation; timeouts, redirects, and server errors remain
        // ambiguous and must keep the retry key reserved.
        const knownRejections: Record<number, string> = {
          401: 'xAI API authentication was rejected. Check the configured API key.',
          402: 'xAI API usage balance was exhausted. Add provider credits or select another configured provider.',
          403: 'xAI API access was denied for this request.',
          429: 'xAI API rate limit rejected this request. Retry after the provider limit resets.',
        };
        if (knownRejections[response.status]) {
          throw new AtelierProviderUnavailableError(knownRejections[response.status]);
        }
        const errorRecord = asRecord(asRecord(payload)?.error);
        const message =
          typeof errorRecord?.message === 'string'
            ? errorRecord.message
            : 'Provider request failed.';
        throw new AtelierProviderResponseError(`xAI API ${response.status}: ${message}`);
      }
      const root = asRecord(payload);
      const responseId =
        (typeof root?.id === 'string' ? root.id : undefined) ??
        response.headers.get('x-request-id') ??
        undefined;
      return {
        text: extractResponseText(payload),
        provider: this.id,
        providerLabel: this.label,
        model,
        ...(responseId !== undefined ? { providerRequestId: responseId } : {}),
        usage: extractUsage(payload),
        localOnly: false,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

function extractCliPayload(stdout: string): {
  text: string;
  requestId?: string;
  usage: AtelierUsage;
} {
  let payload: unknown;
  try {
    payload = JSON.parse(stdout);
  } catch {
    const text = stdout.trim();
    if (!text) throw new AtelierProviderResponseError('Grok Build CLI returned no output.');
    return { text, usage: {} };
  }
  const root = asRecord(payload);
  const candidates = [
    root?.text,
    root?.output_text,
    root?.response,
    root?.result,
    asRecord(root?.message)?.content,
    asRecord(root?.assistant)?.content,
  ];
  const text = candidates.find(
    (value): value is string => typeof value === 'string' && value.trim().length > 0,
  );
  if (!text) return { text: extractResponseText(payload), usage: extractUsage(payload) };
  const requestId =
    typeof root?.request_id === 'string'
      ? root.request_id
      : typeof root?.requestId === 'string'
        ? root.requestId
        : undefined;
  return { text: text.trim(), ...(requestId ? { requestId } : {}), usage: extractUsage(payload) };
}

export class GrokBuildCliProvider implements AtelierProvider {
  readonly id = 'grok-build' as const;
  readonly label = 'xAI Grok Build CLI';
  readonly localOnly = true;

  constructor(
    private readonly executable = process.env.A11OY_ATELIER_GROK_CLI_PATH ?? '',
    private readonly cwd = process.cwd(),
  ) {}

  health(requestedModel?: string): AtelierProviderHealth {
    const configured = this.executable.trim().length > 0;
    const resolution = tryResolveGrokModel(requestedModel);
    if (!resolution.ok) {
      return {
        provider: this.id,
        model: 'UNAVAILABLE',
        configured,
        available: false,
        localOnly: true,
        evidenceState: 'UNAVAILABLE',
        reason: resolution.reason,
      };
    }
    const model = resolution.model;
    const available = configured && existsSync(this.executable);
    return {
      provider: this.id,
      model,
      configured,
      available,
      localOnly: true,
      evidenceState: available ? 'OBSERVED' : 'UNAVAILABLE',
      reason: available
        ? 'Configured Grok Build CLI executable exists; OAuth/runtime validity is checked on ask.'
        : configured
          ? 'Configured Grok Build CLI executable was not found.'
          : 'A11OY_ATELIER_GROK_CLI_PATH is not configured.',
    };
  }

  async generate(request: AtelierAskRequest): Promise<AtelierProviderResult> {
    const health = this.health(request.model);
    if (!health.available) throw new AtelierProviderUnavailableError(health.reason);
    const model = resolveGrokModel(request.model);
    let stdout: string;
    try {
      ({ stdout } = await execFileAsync(
        this.executable,
        [
          '--single',
          request.prompt,
          '--model',
          model,
          '--reasoning-effort',
          request.reasoningEffort,
          '--output-format',
          'json',
          '--max-turns',
          '1',
          '--no-subagents',
          '--disable-web-search',
          '--deny',
          '*',
          '--verbatim',
        ],
        {
          cwd: this.cwd,
          windowsHide: true,
          timeout: 180_000,
          maxBuffer: 4 * 1024 * 1024,
          encoding: 'utf8',
        },
      ));
    } catch (error) {
      if (isGrokBuildQuotaError(error)) {
        throw new AtelierProviderUnavailableError(
          'Grok Build usage balance exhausted. Add provider credits or select another configured provider.',
        );
      }
      throw error;
    }
    const parsed = extractCliPayload(stdout);
    return {
      text: parsed.text,
      provider: this.id,
      providerLabel: this.label,
      model,
      ...(parsed.requestId ? { providerRequestId: parsed.requestId } : {}),
      usage: parsed.usage,
      localOnly: true,
    };
  }
}

export function resolveProvider(
  requested: AtelierAskRequest['provider'],
  requestedModel?: string,
): AtelierProvider {
  if (requested === 'xai') return new XaiResponsesProvider();
  if (requested === 'grok-build') return new GrokBuildCliProvider();
  const xai = new XaiResponsesProvider();
  if (xai.health(requestedModel).available) return xai;
  const cli = new GrokBuildCliProvider();
  if (cli.health(requestedModel).available) return cli;
  const resolution = tryResolveGrokModel(requestedModel);
  throw new AtelierProviderUnavailableError(
    resolution.ok
      ? 'No Atelier inference provider is configured. Set A11OY_ATELIER_XAI_API_KEY or A11OY_ATELIER_GROK_CLI_PATH.'
      : resolution.reason,
  );
}

export function getAtelierProviderHealth(): AtelierProviderHealth[] {
  return [new XaiResponsesProvider().health(), new GrokBuildCliProvider().health()];
}
