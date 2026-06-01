/**
 * Prompt Caching Layer + Structured Output Guarantees
 *
 * Two complementary capabilities:
 *
 * 1. PROMPT CACHE — hashes system prompts and repeated context, reusing cached
 *    prefixes for follow-up queries within a session. Target: 50%+ cost and
 *    latency reduction on repeated-context queries.
 *
 * 2. STRUCTURED OUTPUT WRAPPER — enforces JSON schema validation on model
 *    responses with automatic retry on schema violations (up to 3 retries).
 */

import { createHash } from 'node:crypto';
import type { HFChatMessage } from './providers/hf-client.js';

// ─── Prompt Cache ────────────────────────────────────────────────────────────

export interface CacheEntry {
  cacheKey: string;
  systemPromptHash: string;
  contextHash: string;
  cachedContent: string;
  model: string;
  hitCount: number;
  createdAt: string;
  lastHitAt: string;
  expiresAt: string;
  estimatedTokens: number;
}

export interface CacheStats {
  totalEntries: number;
  totalHits: number;
  totalMisses: number;
  estimatedCostSavingsUsd: number;
  estimatedLatencySavedMs: number;
  hitRate: number;
}

const CACHE_TTL_MS = 30 * 60 * 1000;
const MAX_CACHE_ENTRIES = 500;
const COST_PER_TOKEN_SAVED = 0.000003;
const LATENCY_SAVED_PER_1K_TOKENS_MS = 200;

const _cache = new Map<string, CacheEntry>();
let _totalHits = 0;
let _totalMisses = 0;
let _estimatedCostSavingsUsd = 0;
let _estimatedLatencySavedMs = 0;

function hashString(content: string): string {
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
}

function buildCacheKey(systemPrompt: string, contextPrefix: string, model: string): string {
  const sysHash = hashString(systemPrompt);
  const ctxHash = hashString(contextPrefix);
  return `${model}:${sysHash}:${ctxHash}`;
}

function evictExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of _cache.entries()) {
    if (new Date(entry.expiresAt).getTime() < now) {
      _cache.delete(key);
    }
  }
}

function evictLruIfNeeded(): void {
  if (_cache.size <= MAX_CACHE_ENTRIES) return;
  const entries = Array.from(_cache.entries()).sort(
    (a, b) => new Date(a[1].lastHitAt).getTime() - new Date(b[1].lastHitAt).getTime(),
  );
  const toRemove = entries.slice(0, _cache.size - MAX_CACHE_ENTRIES);
  for (const [key] of toRemove) {
    _cache.delete(key);
  }
}

export function extractCachePrefix(messages: HFChatMessage[]): {
  systemPrompt: string;
  contextPrefix: string;
  remainingMessages: HFChatMessage[];
} {
  const systemMessage = messages.find((m) => m.role === 'system');
  const systemPrompt = systemMessage?.content ?? '';

  const userMessages = messages.filter((m) => m.role !== 'system');
  const contextPrefix = userMessages.slice(0, -1).map((m) => m.content).join('\n');
  const remainingMessages = systemMessage
    ? [systemMessage, ...userMessages.slice(-1)]
    : userMessages.slice(-1);

  return { systemPrompt, contextPrefix, remainingMessages };
}

export function getCachedResponse(
  systemPrompt: string,
  contextPrefix: string,
  model: string,
): CacheEntry | null {
  evictExpiredEntries();
  const key = buildCacheKey(systemPrompt, contextPrefix, model);
  const entry = _cache.get(key);

  if (!entry) {
    _totalMisses++;
    return null;
  }

  if (new Date(entry.expiresAt).getTime() < Date.now()) {
    _cache.delete(key);
    _totalMisses++;
    return null;
  }

  entry.hitCount++;
  entry.lastHitAt = new Date().toISOString();
  _totalHits++;
  _estimatedCostSavingsUsd += entry.estimatedTokens * COST_PER_TOKEN_SAVED;
  _estimatedLatencySavedMs += (entry.estimatedTokens / 1000) * LATENCY_SAVED_PER_1K_TOKENS_MS;

  return entry;
}

export function setCachedResponse(
  systemPrompt: string,
  contextPrefix: string,
  model: string,
  content: string,
): CacheEntry {
  evictExpiredEntries();
  evictLruIfNeeded();

  const key = buildCacheKey(systemPrompt, contextPrefix, model);
  const estimatedTokens = Math.ceil((systemPrompt.length + contextPrefix.length) / 4);

  const entry: CacheEntry = {
    cacheKey: key,
    systemPromptHash: hashString(systemPrompt),
    contextHash: hashString(contextPrefix),
    cachedContent: content.slice(0, 10_000),
    model,
    hitCount: 0,
    createdAt: new Date().toISOString(),
    lastHitAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
    estimatedTokens,
  };

  _cache.set(key, entry);
  return entry;
}

export function getCacheStats(): CacheStats {
  const totalRequests = _totalHits + _totalMisses;
  return {
    totalEntries: _cache.size,
    totalHits: _totalHits,
    totalMisses: _totalMisses,
    estimatedCostSavingsUsd: _estimatedCostSavingsUsd,
    estimatedLatencySavedMs: _estimatedLatencySavedMs,
    hitRate: totalRequests > 0 ? _totalHits / totalRequests : 0,
  };
}

export function clearCache(): void {
  _cache.clear();
}

// ─── Structured Output Guarantees ────────────────────────────────────────────

export interface JsonSchemaValidator<T> {
  validate(raw: unknown): { valid: boolean; result?: T; errors: string[] };
  schema: Record<string, unknown>;
}

export interface StructuredOutputOptions<T> {
  validator: JsonSchemaValidator<T>;
  maxRetries?: number;
  retryDelayMs?: number;
  systemPromptSuffix?: string;
}

export interface StructuredOutputResult<T> {
  result: T;
  rawContent: string;
  attempts: number;
  success: boolean;
  validationErrors: string[];
}

type StructuredLlmCaller = (
  messages: HFChatMessage[],
  responseFormat: { type: 'json_object' },
) => Promise<{ content: string }>;

let _structuredCaller: StructuredLlmCaller | null = null;

export function setStructuredOutputCaller(fn: StructuredLlmCaller): void {
  _structuredCaller = fn;
}

function extractJson(content: string): unknown {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON object found in response');
  return JSON.parse(jsonMatch[0]);
}

function buildRetryMessages(
  originalMessages: HFChatMessage[],
  previousContent: string,
  errors: string[],
): HFChatMessage[] {
  const systemMsg = originalMessages.find((m) => m.role === 'system');
  const otherMsgs = originalMessages.filter((m) => m.role !== 'system');

  const correctionMsg: HFChatMessage = {
    role: 'user',
    content: `Your previous response had JSON validation errors:\n${errors.join('\n')}\n\nPrevious (invalid) response:\n${previousContent.slice(0, 500)}\n\nPlease provide a corrected JSON response that matches the required schema exactly.`,
  };

  return [
    ...(systemMsg ? [systemMsg] : []),
    ...otherMsgs,
    correctionMsg,
  ];
}

export async function structuredOutputWithRetry<T>(
  messages: HFChatMessage[],
  options: StructuredOutputOptions<T>,
): Promise<StructuredOutputResult<T>> {
  const maxRetries = options.maxRetries ?? 3;
  const retryDelayMs = options.retryDelayMs ?? 500;

  const systemMsg = messages.find((m) => m.role === 'system');
  if (systemMsg && options.systemPromptSuffix) {
    systemMsg.content += `\n\n${options.systemPromptSuffix}`;
  }

  let currentMessages = [...messages];
  let lastContent = '';
  let lastErrors: string[] = [];

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    if (!_structuredCaller) {
      return {
        result: null as unknown as T,
        rawContent: '',
        attempts: attempt,
        success: false,
        validationErrors: ['Structured output caller not registered'],
      };
    }

    try {
      const response = await _structuredCaller(currentMessages, { type: 'json_object' });
      lastContent = response.content;

      let parsed: unknown;
      try {
        parsed = extractJson(lastContent);
      } catch (parseErr) {
        lastErrors = [`JSON parse error: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`];
        if (attempt < maxRetries) {
          currentMessages = buildRetryMessages(messages, lastContent, lastErrors);
          await new Promise((r) => setTimeout(r, retryDelayMs));
          continue;
        }
        break;
      }

      const validation = options.validator.validate(parsed);
      if (validation.valid && validation.result !== undefined) {
        return {
          result: validation.result as T,
          rawContent: lastContent,
          attempts: attempt,
          success: true,
          validationErrors: [],
        };
      }

      lastErrors = validation.errors;
      if (attempt < maxRetries) {
        currentMessages = buildRetryMessages(messages, lastContent, lastErrors);
        await new Promise((r) => setTimeout(r, retryDelayMs));
      }
    } catch (err) {
      lastErrors = [err instanceof Error ? err.message : String(err)];
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, retryDelayMs));
      }
    }
  }

  return {
    result: null as unknown as T,
    rawContent: lastContent,
    attempts: maxRetries,
    success: false,
    validationErrors: lastErrors,
  };
}

export function createSimpleJsonValidator<T>(
  requiredKeys: (keyof T & string)[],
): JsonSchemaValidator<T> {
  return {
    schema: {
      type: 'object',
      required: requiredKeys,
    },
    validate(raw: unknown) {
      if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
        return { valid: false, errors: ['Response must be a JSON object'] };
      }

      const obj = raw as Record<string, unknown>;
      const missingKeys = requiredKeys.filter((k) => !(k in obj));

      if (missingKeys.length > 0) {
        return {
          valid: false,
          errors: [`Missing required keys: ${missingKeys.join(', ')}`],
        };
      }

      return { valid: true, result: obj as unknown as T, errors: [] };
    },
  };
}
