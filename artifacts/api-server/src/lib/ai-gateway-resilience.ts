import { pool } from "@szl-holdings/db";
import { logger } from "./logger";
import { inferenceTelemetry } from "./inference-telemetry";
import type { InferenceProvider } from "./inference-telemetry";
import type { GatewayRequest, GatewayResponse } from "./ai-gateway";

// ─── Context Window Limits ────────────────────────────────────────────────────

const MODEL_CONTEXT_LIMITS: Record<string, number> = {
  "gpt-5.2": 128000,
  "gpt-4o": 128000,
  "gpt-4o-mini": 128000,
  "claude-sonnet-4-20250514": 200000,
  "claude-sonnet-4-6": 200000,
  "claude-3-haiku-20240307": 200000,
  "gemini-2.0-flash": 1048576,
  "mistralai/Mixtral-8x7B-Instruct-v0.1": 32768,
};

const MODEL_UPGRADE_PATH: Record<string, string> = {
  "gpt-4o-mini": "gpt-5.2",
  "claude-3-haiku-20240307": "claude-sonnet-4-20250514",
  "gemini-2.0-flash": "gemini-2.0-flash",
};

export function getContextLimit(model: string): number {
  return MODEL_CONTEXT_LIMITS[model] ?? 128000;
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export type ContextStrategy = "summarize" | "truncate" | "upgrade";

export interface ContextAnalysis {
  estimatedTokens: number;
  contextLimit: number;
  utilizationPct: number;
  overflowing: boolean;
  strategy: ContextStrategy | null;
  upgradedModel?: string;
}

export function analyzeContext(messages: Array<{ role: string; content: string }>, model: string): ContextAnalysis {
  const totalText = messages.map(m => m.content).join(" ");
  const estimatedTokens = estimateTokens(totalText);
  const contextLimit = getContextLimit(model);
  const utilizationPct = Math.min(100, Math.round((estimatedTokens / contextLimit) * 100));
  const overflowing = estimatedTokens > contextLimit * 0.9;

  let strategy: ContextStrategy | null = null;
  let upgradedModel: string | undefined;

  if (overflowing) {
    const upgradeTarget = MODEL_UPGRADE_PATH[model];
    if (upgradeTarget && getContextLimit(upgradeTarget) > estimatedTokens) {
      strategy = "upgrade";
      upgradedModel = upgradeTarget;
    } else if (messages.length > 4) {
      strategy = "summarize";
    } else {
      strategy = "truncate";
    }
  }

  return { estimatedTokens, contextLimit, utilizationPct, overflowing, strategy, upgradedModel };
}

export function applyContextStrategy(
  messages: Array<{ role: string; content: string }>,
  analysis: ContextAnalysis,
): Array<{ role: string; content: string }> {
  if (!analysis.overflowing || analysis.strategy === "upgrade") return messages;

  if (analysis.strategy === "truncate") {
    const systemMsgs = messages.filter(m => m.role === "system");
    const nonSystem = messages.filter(m => m.role !== "system");
    const keep = nonSystem.slice(-6);
    return [...systemMsgs, ...keep];
  }

  if (analysis.strategy === "summarize") {
    const systemMsgs = messages.filter(m => m.role === "system");
    const nonSystem = messages.filter(m => m.role !== "system");
    const older = nonSystem.slice(0, -4);
    const recent = nonSystem.slice(-4);
    const olderSummary = older.map(m => `${m.role}: ${m.content.slice(0, 150)}`).join(" | ");
    const summaryMsg = { role: "system" as const, content: `[Earlier conversation summary]: ${olderSummary}` };
    return [...systemMsgs, summaryMsg, ...recent];
  }

  return messages;
}

// ─── Priority Queue ───────────────────────────────────────────────────────────

export type RequestPriority = "critical" | "high" | "normal" | "low" | "background";

const PRIORITY_ORDER: Record<RequestPriority, number> = {
  critical: 5,
  high: 4,
  normal: 3,
  low: 2,
  background: 1,
};

export interface QueuedRequest {
  id: string;
  priority: RequestPriority;
  domain: string;
  agentId: string;
  enqueuedAt: number;
  resolve: (value: GatewayResponse) => void;
  reject: (err: Error) => void;
  execute: () => Promise<GatewayResponse>;
}

const DOMAIN_CONCURRENCY_LIMITS: Record<string, number> = {
  firestorm: 5,
  vessels: 4,
  aegis: 5,
  lyte: 4,
  terra: 3,
  general: 6,
};

class PriorityRequestQueue {
  private queue: QueuedRequest[] = [];
  private activeCounts: Map<string, number> = new Map();
  private totalActive = 0;
  private maxConcurrent = 20;
  private stats = { enqueued: 0, processed: 0, shed: 0, byPriority: {} as Record<RequestPriority, number> };

  enqueue(req: QueuedRequest): void {
    this.stats.enqueued++;
    this.stats.byPriority[req.priority] = (this.stats.byPriority[req.priority] ?? 0) + 1;

    const isSystemDegraded = this.totalActive > this.maxConcurrent * 0.9;
    if (isSystemDegraded && (req.priority === "background" || req.priority === "low")) {
      this.stats.shed++;
      req.reject(new Error("Request shed: system under high load, low-priority requests deferred"));
      return;
    }

    this.queue.push(req);
    this.queue.sort((a, b) => {
      const pDiff = PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
      if (pDiff !== 0) return pDiff;
      return a.enqueuedAt - b.enqueuedAt;
    });

    this.drain();
  }

  private drain(): void {
    while (this.queue.length > 0 && this.totalActive < this.maxConcurrent) {
      const req = this.queue[0]!;
      const domainLimit = DOMAIN_CONCURRENCY_LIMITS[req.domain] ?? DOMAIN_CONCURRENCY_LIMITS["general"]!;
      const domainActive = this.activeCounts.get(req.domain) ?? 0;

      if (domainActive >= domainLimit && req.priority !== "critical") break;

      this.queue.shift();
      this.totalActive++;
      this.activeCounts.set(req.domain, domainActive + 1);

      req.execute().then(result => {
        this.stats.processed++;
        req.resolve(result);
      }).catch(err => {
        req.reject(err instanceof Error ? err : new Error(String(err)));
      }).finally(() => {
        this.totalActive--;
        const dc = this.activeCounts.get(req.domain) ?? 1;
        this.activeCounts.set(req.domain, dc - 1);
        this.drain();
      });
    }
  }

  getStats() {
    return {
      ...this.stats,
      queueDepth: this.queue.length,
      activeConcurrent: this.totalActive,
      byPriority: { ...this.stats.byPriority },
      queueByPriority: this.queue.reduce((acc, r) => {
        acc[r.priority] = (acc[r.priority] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}

export const priorityQueue = new PriorityRequestQueue();

export function enqueueGatewayRequest(
  request: GatewayRequest & { priority?: RequestPriority },
  execute: () => Promise<GatewayResponse>,
): Promise<GatewayResponse> {
  return new Promise((resolve, reject) => {
    const id = `req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    priorityQueue.enqueue({
      id,
      priority: request.priority ?? "normal",
      domain: request.domain ?? "general",
      agentId: request.agentId ?? "anonymous",
      enqueuedAt: Date.now(),
      resolve,
      reject,
      execute,
    });
  });
}

// ─── Semantic Response Cache ──────────────────────────────────────────────────

export interface CacheConfig {
  ttlMs?: number;
  similarityThreshold?: number;
  maxEntries?: number;
}

export interface CacheEntry {
  id: string;
  domain: string;
  promptHash: string;
  promptText: string;
  response: string;
  model: string;
  provider: InferenceProvider;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  estimatedCostUsd: number;
  createdAt: number;
  expiresAt: number;
  hitCount: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalEntries: number;
  estimatedSavingsUsd: number;
  savedTokens: number;
}

const DEFAULT_TTL_MS = 60 * 60 * 1000;
const DEFAULT_SIMILARITY_THRESHOLD = 0.85;
const MAX_CACHE_ENTRIES = 1000;

class SemanticResponseCache {
  private entries: Map<string, CacheEntry> = new Map();
  private hits = 0;
  private misses = 0;
  private savingsUsd = 0;
  private savedTokens = 0;
  private domainTtls: Map<string, number> = new Map();
  private idCounter = 0;
  private initialized = false;

  async ensureTables(): Promise<void> {
    if (this.initialized) return;
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS ai_response_cache (
          id TEXT PRIMARY KEY,
          domain TEXT NOT NULL DEFAULT 'general',
          prompt_hash TEXT NOT NULL,
          prompt_text TEXT NOT NULL,
          response TEXT NOT NULL,
          model TEXT NOT NULL,
          provider TEXT NOT NULL,
          prompt_tokens INT NOT NULL DEFAULT 0,
          completion_tokens INT NOT NULL DEFAULT 0,
          total_tokens INT NOT NULL DEFAULT 0,
          estimated_cost_usd FLOAT NOT NULL DEFAULT 0,
          hit_count INT NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          expires_at TIMESTAMPTZ NOT NULL,
          INDEX_hint TEXT GENERATED ALWAYS AS (domain || ':' || prompt_hash) STORED
        );
        CREATE INDEX IF NOT EXISTS idx_ai_response_cache_domain_hash ON ai_response_cache(domain, prompt_hash);
        CREATE INDEX IF NOT EXISTS idx_ai_response_cache_expires ON ai_response_cache(expires_at);
      `);
      this.initialized = true;
      logger.info("AI response cache tables ensured");
    } catch {
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS ai_response_cache (
            id TEXT PRIMARY KEY,
            domain TEXT NOT NULL DEFAULT 'general',
            prompt_hash TEXT NOT NULL,
            prompt_text TEXT NOT NULL,
            response TEXT NOT NULL,
            model TEXT NOT NULL,
            provider TEXT NOT NULL,
            prompt_tokens INT NOT NULL DEFAULT 0,
            completion_tokens INT NOT NULL DEFAULT 0,
            total_tokens INT NOT NULL DEFAULT 0,
            estimated_cost_usd FLOAT NOT NULL DEFAULT 0,
            hit_count INT NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            expires_at TIMESTAMPTZ NOT NULL
          );
          CREATE INDEX IF NOT EXISTS idx_ai_response_cache_domain_hash ON ai_response_cache(domain, prompt_hash);
          CREATE INDEX IF NOT EXISTS idx_ai_response_cache_expires ON ai_response_cache(expires_at);
        `);
        this.initialized = true;
      } catch (err) {
        logger.warn({ err }, "Failed to ensure AI response cache tables (non-fatal)");
      }
    }
  }

  private buildPromptHash(messages: Array<{ role: string; content: string }>): string {
    const normalized = messages.map(m => `${m.role}:${m.content.trim().toLowerCase().slice(0, 500)}`).join("|");
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private computeSimilarity(a: string, b: string): number {
    if (a === b) return 1.0;
    const aTokens = new Set(a.toLowerCase().split(/\s+/));
    const bTokens = new Set(b.toLowerCase().split(/\s+/));
    const intersection = new Set([...aTokens].filter(t => bTokens.has(t)));
    const union = new Set([...aTokens, ...bTokens]);
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.entries) {
      if (entry.expiresAt < now) this.entries.delete(key);
    }
    while (this.entries.size > MAX_CACHE_ENTRIES) {
      const oldest = Array.from(this.entries.entries())
        .sort((a, b) => a[1].createdAt - b[1].createdAt)[0];
      if (oldest) this.entries.delete(oldest[0]);
    }
  }

  async lookup(
    messages: Array<{ role: string; content: string }>,
    domain: string,
    threshold = DEFAULT_SIMILARITY_THRESHOLD,
  ): Promise<CacheEntry | null> {
    await this.ensureTables();
    this.evictExpired();

    const promptText = messages.map(m => m.content).join(" ").toLowerCase();
    const promptHash = this.buildPromptHash(messages);
    const now = Date.now();

    const exactKey = `${domain}:${promptHash}`;
    const exact = this.entries.get(exactKey);
    if (exact && exact.expiresAt > now) {
      exact.hitCount++;
      this.hits++;
      this.savingsUsd += exact.estimatedCostUsd;
      this.savedTokens += exact.totalTokens;
      return exact;
    }

    const domainEntries = Array.from(this.entries.values())
      .filter(e => e.domain === domain && e.expiresAt > now);

    for (const entry of domainEntries) {
      const sim = this.computeSimilarity(promptText, entry.promptText.toLowerCase());
      if (sim >= threshold) {
        entry.hitCount++;
        this.hits++;
        this.savingsUsd += entry.estimatedCostUsd;
        this.savedTokens += entry.totalTokens;
        return entry;
      }
    }

    try {
      const result = await pool.query(
        `SELECT * FROM ai_response_cache WHERE domain = $1 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 20`,
        [domain]
      );
      for (const row of result.rows) {
        const rowText = row.prompt_text?.toLowerCase() ?? "";
        const sim = this.computeSimilarity(promptText, rowText);
        if (sim >= threshold) {
          const entry: CacheEntry = {
            id: row.id,
            domain: row.domain,
            promptHash: row.prompt_hash,
            promptText: row.prompt_text,
            response: row.response,
            model: row.model,
            provider: row.provider,
            usage: { promptTokens: row.prompt_tokens, completionTokens: row.completion_tokens, totalTokens: row.total_tokens },
            estimatedCostUsd: parseFloat(row.estimated_cost_usd),
            createdAt: new Date(row.created_at).getTime(),
            expiresAt: new Date(row.expires_at).getTime(),
            hitCount: row.hit_count,
          };
          this.entries.set(`${domain}:${row.prompt_hash}`, entry);
          entry.hitCount++;
          this.hits++;
          this.savingsUsd += entry.estimatedCostUsd;
          this.savedTokens += entry.totalTokens;
          await pool.query("UPDATE ai_response_cache SET hit_count = hit_count + 1 WHERE id = $1", [entry.id]).catch(() => {});
          return entry;
        }
      }
    } catch {}

    this.misses++;
    return null;
  }

  async store(
    messages: Array<{ role: string; content: string }>,
    domain: string,
    response: GatewayResponse,
    ttlMs?: number,
  ): Promise<void> {
    await this.ensureTables();
    const resolvedTtl = ttlMs ?? this.domainTtls.get(domain) ?? DEFAULT_TTL_MS;
    const promptText = messages.map(m => m.content).join(" ");
    const promptHash = this.buildPromptHash(messages);
    const id = `cache_${Date.now()}_${++this.idCounter}`;
    const expiresAt = Date.now() + resolvedTtl;

    const entry: CacheEntry = {
      id,
      domain,
      promptHash,
      promptText: promptText.slice(0, 2000),
      response: response.content,
      model: response.model,
      provider: response.provider,
      usage: response.usage,
      estimatedCostUsd: response.estimatedCostUsd,
      createdAt: Date.now(),
      expiresAt,
      hitCount: 0,
    };

    this.entries.set(`${domain}:${promptHash}`, entry);
    this.evictExpired();

    try {
      await pool.query(
        `INSERT INTO ai_response_cache (id, domain, prompt_hash, prompt_text, response, model, provider, prompt_tokens, completion_tokens, total_tokens, estimated_cost_usd, hit_count, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 0, $12)
         ON CONFLICT (id) DO NOTHING`,
        [id, domain, promptHash, entry.promptText, response.content, response.model, response.provider,
          response.usage.promptTokens, response.usage.completionTokens, response.usage.totalTokens,
          response.estimatedCostUsd, new Date(expiresAt)]
      );
    } catch {}
  }

  setDomainTtl(domain: string, ttlMs: number): void {
    this.domainTtls.set(domain, ttlMs);
  }

  async invalidateDomain(domain: string): Promise<number> {
    let count = 0;
    for (const [key, entry] of this.entries) {
      if (entry.domain === domain) {
        this.entries.delete(key);
        count++;
      }
    }
    try {
      const result = await pool.query("DELETE FROM ai_response_cache WHERE domain = $1", [domain]);
      count += result.rowCount ?? 0;
    } catch {}
    return count;
  }

  async invalidateById(id: string): Promise<boolean> {
    for (const [key, entry] of this.entries) {
      if (entry.id === id) {
        this.entries.delete(key);
        break;
      }
    }
    try {
      const result = await pool.query("DELETE FROM ai_response_cache WHERE id = $1", [id]);
      return (result.rowCount ?? 0) > 0;
    } catch {
      return false;
    }
  }

  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? parseFloat((this.hits / total).toFixed(4)) : 0,
      totalEntries: this.entries.size,
      estimatedSavingsUsd: parseFloat(this.savingsUsd.toFixed(6)),
      savedTokens: this.savedTokens,
    };
  }

  async listEntries(domain?: string, limit = 20): Promise<CacheEntry[]> {
    const entries = Array.from(this.entries.values())
      .filter(e => !domain || e.domain === domain)
      .filter(e => e.expiresAt > Date.now())
      .sort((a, b) => b.hitCount - a.hitCount)
      .slice(0, limit);

    if (entries.length < limit) {
      try {
        const result = await pool.query(
          domain
            ? `SELECT * FROM ai_response_cache WHERE domain = $1 AND expires_at > NOW() ORDER BY hit_count DESC LIMIT $2`
            : `SELECT * FROM ai_response_cache WHERE expires_at > NOW() ORDER BY hit_count DESC LIMIT $1`,
          domain ? [domain, limit] : [limit]
        );
        return result.rows.map(r => ({
          id: r.id,
          domain: r.domain,
          promptHash: r.prompt_hash,
          promptText: r.prompt_text,
          response: r.response,
          model: r.model,
          provider: r.provider,
          usage: { promptTokens: r.prompt_tokens, completionTokens: r.completion_tokens, totalTokens: r.total_tokens },
          estimatedCostUsd: parseFloat(r.estimated_cost_usd),
          createdAt: new Date(r.created_at).getTime(),
          expiresAt: new Date(r.expires_at).getTime(),
          hitCount: r.hit_count,
        }));
      } catch {}
    }

    return entries;
  }
}

export const semanticCache = new SemanticResponseCache();

// ─── Streaming Infrastructure ─────────────────────────────────────────────────

export interface StreamingToken {
  token: string;
  index: number;
  done: boolean;
  firstTokenMs?: number;
}

export interface StreamingStats {
  timeToFirstTokenMs: number;
  totalLatencyMs: number;
  tokenCount: number;
  provider: InferenceProvider;
  model: string;
  cached: boolean;
}

export async function* gatewayStream(
  content: string,
  provider: InferenceProvider,
  model: string,
  startTime: number,
): AsyncGenerator<StreamingToken> {
  const words = content.split(/(\s+)/);
  let index = 0;
  let firstTokenEmitted = false;
  const chunkSize = 3;

  for (let i = 0; i < words.length; i += chunkSize) {
    const chunk = words.slice(i, i + chunkSize).join("");
    if (!firstTokenEmitted && chunk.trim()) {
      firstTokenEmitted = true;
    }
    const firstTokenMs = firstTokenEmitted && index === 0 ? Date.now() - startTime : undefined;
    yield { token: chunk, index, done: false, firstTokenMs };
    index++;
    await new Promise(r => setTimeout(r, 15));
  }

  yield { token: "", index, done: true };
}

export function recordStreamingTelemetry(
  agentId: string,
  domain: string,
  stats: StreamingStats,
): void {
  inferenceTelemetry.record({
    provider: stats.provider,
    model: stats.model,
    agentId,
    domain,
    latencyMs: stats.totalLatencyMs,
    promptTokens: 0,
    completionTokens: stats.tokenCount,
    success: true,
    routingStrategy: "fastest",
    retryCount: 0,
    cached: stats.cached,
  });
}

// ─── Domain TTL Configuration ─────────────────────────────────────────────────

export const DOMAIN_CACHE_TTLS: Record<string, number> = {
  vessels: 30 * 60 * 1000,
  firestorm: 10 * 60 * 1000,
  aegis: 10 * 60 * 1000,
  lyte: 15 * 60 * 1000,
  terra: 60 * 60 * 1000,
  nexus: 20 * 60 * 1000,
  general: 60 * 60 * 1000,
};

export function initializeDomainCacheTtls(): void {
  for (const [domain, ttlMs] of Object.entries(DOMAIN_CACHE_TTLS)) {
    semanticCache.setDomainTtl(domain, ttlMs);
  }
  logger.info({ domains: Object.keys(DOMAIN_CACHE_TTLS) }, "Domain cache TTLs initialized");
}
