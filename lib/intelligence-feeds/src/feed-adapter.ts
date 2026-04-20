/**
 * Feed Adapter Interface — Intelligence Feeds Base Contract
 *
 * Every external OSINT feed adapter implements this interface.
 * Provides: connect, poll, normalize, healthCheck, and lifecycle hooks.
 * Built-in: rate limiting, deduplication via content hashing, error isolation.
 */

import type {
  OntologyEntity,
  OntologyRelationship,
} from '@szl-holdings/ai-engine/ontology/ontology-engine';
import { createHash } from 'crypto';

export interface FeedAdapterConfig {
  id: string;
  name: string;
  domain: string;
  pollIntervalMs: number;
  rateLimit: {
    requestsPerMinute: number;
    burstAllowed: number;
  };
  retryPolicy: {
    maxRetries: number;
    backoffBaseMs: number;
    maxBackoffMs: number;
  };
  timeout: number;
  enabled: boolean;
}

export interface FeedHealthStatus {
  feedId: string;
  feedName: string;
  status: 'healthy' | 'degraded' | 'down' | 'initializing';
  lastPollAt: string | null;
  lastSuccessAt: string | null;
  lastErrorAt: string | null;
  lastError: string | null;
  totalPolls: number;
  successfulPolls: number;
  failedPolls: number;
  entitiesIngested: number;
  relationshipsIngested: number;
  avgPollDurationMs: number;
  consecutiveFailures: number;
}

export interface NormalizedFeedPayload {
  entities: Array<Omit<OntologyEntity, 'id' | 'lastUpdated'> & { externalId?: string }>;
  relationships: Array<{
    fromExternalId: string;
    toExternalId: string;
    type: OntologyRelationship['type'];
    strength: OntologyRelationship['strength'];
    metadata: Record<string, unknown>;
  }>;
  feedId: string;
  feedName: string;
  sourceUrl: string;
  fetchedAt: string;
  recordCount: number;
}

export interface PollResult {
  feedId: string;
  success: boolean;
  recordsFound: number;
  recordsNew: number;
  recordsDuplicate: number;
  entitiesUpserted: number;
  relationshipsCreated: number;
  durationMs: number;
  error: string | null;
  payload: NormalizedFeedPayload | null;
}

class RateLimiter {
  private tokens: number;
  private lastRefillAt: number;
  private readonly maxTokens: number;
  private readonly refillRatePerMs: number;

  constructor(requestsPerMinute: number, burst: number) {
    this.maxTokens = burst;
    this.tokens = burst;
    this.lastRefillAt = Date.now();
    this.refillRatePerMs = requestsPerMinute / 60000;
  }

  async acquire(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRefillAt;
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRatePerMs);
    this.lastRefillAt = now;

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }

    const waitMs = (1 - this.tokens) / this.refillRatePerMs;
    await new Promise((resolve) => setTimeout(resolve, Math.ceil(waitMs)));
    this.tokens = 0;
  }
}

export class DeduplicationCache {
  private seen = new Map<string, number>();
  private readonly TTL_MS = 24 * 60 * 60 * 1000;
  private readonly MAX_SIZE = 100000;

  hash(content: string): string {
    return createHash('sha256').update(content).digest('hex').slice(0, 32);
  }

  isDuplicate(contentHash: string): boolean {
    const seenAt = this.seen.get(contentHash);
    if (seenAt === undefined) return false;
    if (Date.now() - seenAt > this.TTL_MS) {
      this.seen.delete(contentHash);
      return false;
    }
    return true;
  }

  markSeen(contentHash: string): void {
    if (this.seen.size >= this.MAX_SIZE) {
      const oldest = [...this.seen.entries()].sort((a, b) => a[1] - b[1]).slice(0, 1000);
      for (const [k] of oldest) this.seen.delete(k);
    }
    this.seen.set(contentHash, Date.now());
  }
}

export abstract class BaseFeedAdapter {
  protected config: FeedAdapterConfig;
  protected rateLimiter: RateLimiter;
  protected dedup: DeduplicationCache;
  protected health: FeedHealthStatus;
  private pollDurations: number[] = [];

  constructor(config: FeedAdapterConfig) {
    this.config = config;
    this.rateLimiter = new RateLimiter(
      config.rateLimit.requestsPerMinute,
      config.rateLimit.burstAllowed,
    );
    this.dedup = new DeduplicationCache();
    this.health = {
      feedId: config.id,
      feedName: config.name,
      status: 'initializing',
      lastPollAt: null,
      lastSuccessAt: null,
      lastErrorAt: null,
      lastError: null,
      totalPolls: 0,
      successfulPolls: 0,
      failedPolls: 0,
      entitiesIngested: 0,
      relationshipsIngested: 0,
      avgPollDurationMs: 0,
      consecutiveFailures: 0,
    };
  }

  abstract connect(): Promise<void>;
  abstract poll(): Promise<NormalizedFeedPayload>;
  abstract normalize(rawData: unknown): NormalizedFeedPayload;

  /**
   * Lightweight connectivity probe — each adapter implements a minimal
   * request (HEAD / small list endpoint) to verify the remote service is reachable.
   * Called by the feed scheduler before scheduling a full poll cycle.
   * Should throw if the service is unreachable or returns an error status.
   */
  abstract healthCheck(): Promise<void>;

  async executePoll(): Promise<PollResult> {
    const start = Date.now();
    this.health.totalPolls++;
    this.health.lastPollAt = new Date().toISOString();

    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt <= this.config.retryPolicy.maxRetries) {
      try {
        await this.rateLimiter.acquire();
        const payload = await this.poll();

        const durationMs = Date.now() - start;
        this.recordDuration(durationMs);
        this.health.successfulPolls++;
        this.health.consecutiveFailures = 0;
        this.health.lastSuccessAt = new Date().toISOString();
        this.health.status = 'healthy';

        let recordsNew = 0;
        let recordsDuplicate = 0;
        for (const entity of payload.entities) {
          const hash = this.dedup.hash(
            JSON.stringify({
              name: entity.name,
              type: entity.type,
              externalId: (entity as { externalId?: string }).externalId,
            }),
          );
          if (this.dedup.isDuplicate(hash)) {
            recordsDuplicate++;
          } else {
            this.dedup.markSeen(hash);
            recordsNew++;
          }
        }

        return {
          feedId: this.config.id,
          success: true,
          recordsFound: payload.recordCount,
          recordsNew,
          recordsDuplicate,
          entitiesUpserted: payload.entities.length,
          relationshipsCreated: payload.relationships.length,
          durationMs,
          error: null,
          payload,
        };
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        attempt++;
        if (attempt <= this.config.retryPolicy.maxRetries) {
          const backoff = Math.min(
            this.config.retryPolicy.backoffBaseMs * 2 ** (attempt - 1),
            this.config.retryPolicy.maxBackoffMs,
          );
          await new Promise((resolve) => setTimeout(resolve, backoff));
        }
      }
    }

    const durationMs = Date.now() - start;
    this.health.failedPolls++;
    this.health.consecutiveFailures++;
    this.health.lastErrorAt = new Date().toISOString();
    this.health.lastError = lastError?.message ?? 'Unknown error';
    this.health.status = this.health.consecutiveFailures >= 3 ? 'down' : 'degraded';

    return {
      feedId: this.config.id,
      success: false,
      recordsFound: 0,
      recordsNew: 0,
      recordsDuplicate: 0,
      entitiesUpserted: 0,
      relationshipsCreated: 0,
      durationMs,
      error: lastError?.message ?? 'Unknown error',
      payload: null,
    };
  }

  getHealth(): FeedHealthStatus {
    return { ...this.health };
  }

  private recordDuration(ms: number): void {
    this.pollDurations.push(ms);
    if (this.pollDurations.length > 100) this.pollDurations.shift();
    this.health.avgPollDurationMs = Math.round(
      this.pollDurations.reduce((s, d) => s + d, 0) / this.pollDurations.length,
    );
  }
}
