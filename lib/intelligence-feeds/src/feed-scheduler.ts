/**
 * Feed Scheduler — Configurable polling, backpressure, and health monitoring
 *
 * Manages polling intervals per feed adapter with:
 * - Configurable poll intervals per source
 * - Backpressure detection (skip poll if previous one still running)
 * - Automatic retry with exponential backoff (delegated to adapters)
 * - Feed health status exposed via self-monitor
 * - Normalization → ontology entity ingestion pipeline
 */

import type {
  OntologyEntity,
  OntologyRelationship,
} from '@szl-holdings/ai-engine/ontology/ontology-engine';
import type {
  BaseFeedAdapter,
  FeedHealthStatus,
  NormalizedFeedPayload,
  PollResult,
} from './feed-adapter.js';
import { fusionEngine } from './fusion-engine.js';

export interface SchedulerConfig {
  maxConcurrentPolls: number;
  healthCheckIntervalMs: number;
  entityIngestionEnabled: boolean;
}

export interface FeedRegistration {
  adapter: BaseFeedAdapter;
  pollIntervalMs: number;
  lastPollAt: number;
  nextPollAt: number;
  isPolling: boolean;
  enabled: boolean;
  totalPollResults: PollResult[];
}

type EntityIngestionFn = (
  entities: NormalizedFeedPayload['entities'],
  relationships: NormalizedFeedPayload['relationships'],
  source: string,
) => Promise<{ entitiesUpserted: OntologyEntity[]; relationshipsCreated: OntologyRelationship[] }>;

export interface FeedIngestionEvent {
  pollAt: string;
  entitiesCreated: number;
  entitiesMerged: number;
  entitiesUpserted: number;
  relationshipsCreated: number;
}

export interface FeedIngestionSummary {
  feedId: string;
  totalCreated: number;
  totalMerged: number;
  lastIngestedAt: string | null;
  recent: FeedIngestionEvent[];
}

const INGESTION_HISTORY_LIMIT = 20;

export class FeedScheduler {
  private feeds = new Map<string, FeedRegistration>();
  private schedulerInterval: ReturnType<typeof setInterval> | null = null;
  private healthInterval: ReturnType<typeof setInterval> | null = null;
  private activePolls = 0;
  private config: SchedulerConfig;
  private entityIngestionFn: EntityIngestionFn | null = null;
  private isStarted = false;
  private ingestionHistory = new Map<string, FeedIngestionEvent[]>();
  private ingestionTotals = new Map<
    string,
    { totalCreated: number; totalMerged: number; lastIngestedAt: string | null }
  >();

  constructor(config: Partial<SchedulerConfig> = {}) {
    this.config = {
      maxConcurrentPolls: config.maxConcurrentPolls ?? 3,
      healthCheckIntervalMs: config.healthCheckIntervalMs ?? 60000,
      entityIngestionEnabled: config.entityIngestionEnabled ?? true,
    };
  }

  setEntityIngestionFn(fn: EntityIngestionFn): void {
    this.entityIngestionFn = fn;
  }

  register(adapter: BaseFeedAdapter, overridePollIntervalMs?: number): void {
    const health = adapter.getHealth();
    const pollIntervalMs =
      overridePollIntervalMs ?? adapter['config']?.pollIntervalMs ?? 5 * 60 * 1000;

    this.feeds.set(health.feedId, {
      adapter,
      pollIntervalMs,
      lastPollAt: 0,
      nextPollAt: Date.now() + Math.random() * 30000,
      isPolling: false,
      enabled: adapter['config']?.enabled ?? true,
      totalPollResults: [],
    });

    console.log(
      `[FeedScheduler] Registered feed: ${health.feedName} (poll every ${Math.round(pollIntervalMs / 1000)}s)`,
    );
  }

  async start(): Promise<void> {
    if (this.isStarted) return;
    this.isStarted = true;

    for (const [, reg] of this.feeds) {
      try {
        await reg.adapter.connect();
      } catch (err) {
        console.warn(
          `[FeedScheduler] Failed to connect feed ${reg.adapter.getHealth().feedId}:`,
          err instanceof Error ? err.message : err,
        );
      }
    }

    this.schedulerInterval = setInterval(() => {
      void this.tick();
    }, 5000);

    this.healthInterval = setInterval(() => {
      void this.runHealthChecks();
    }, this.config.healthCheckIntervalMs);

    console.log(`[FeedScheduler] Started with ${this.feeds.size} registered feeds`);
  }

  stop(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }
    if (this.healthInterval) {
      clearInterval(this.healthInterval);
      this.healthInterval = null;
    }
    this.isStarted = false;
    console.log('[FeedScheduler] Stopped');
  }

  async triggerPoll(feedId: string): Promise<PollResult | null> {
    const reg = this.feeds.get(feedId);
    if (!reg) {
      console.warn(`[FeedScheduler] Feed not found: ${feedId}`);
      return null;
    }
    return this.pollFeed(feedId, reg);
  }

  private async tick(): Promise<void> {
    const now = Date.now();

    for (const [feedId, reg] of this.feeds) {
      if (!reg.enabled) continue;
      if (reg.isPolling) continue;
      if (now < reg.nextPollAt) continue;
      if (this.activePolls >= this.config.maxConcurrentPolls) break;

      void this.pollFeed(feedId, reg);
    }
  }

  private async pollFeed(feedId: string, reg: FeedRegistration): Promise<PollResult | null> {
    if (reg.isPolling) {
      console.warn(
        `[FeedScheduler:${feedId}] Backpressure detected — skipping poll (previous still running)`,
      );
      return null;
    }

    reg.isPolling = true;
    this.activePolls++;

    try {
      const result = await reg.adapter.executePoll();

      reg.lastPollAt = Date.now();
      reg.nextPollAt = Date.now() + reg.pollIntervalMs;
      reg.totalPollResults.push(result);
      if (reg.totalPollResults.length > 100) reg.totalPollResults.shift();

      if (
        result.success &&
        result.payload &&
        this.config.entityIngestionEnabled &&
        this.entityIngestionFn
      ) {
        await this.ingestPayload(result.payload);
      }

      if (!result.success) {
        const health = reg.adapter.getHealth();
        if (health.consecutiveFailures >= 5) {
          console.error(
            `[FeedScheduler:${feedId}] ${health.consecutiveFailures} consecutive failures — feed may be down`,
          );
          reg.nextPollAt = Date.now() + Math.min(reg.pollIntervalMs * 4, 4 * 60 * 60 * 1000);
        }
      }

      return result;
    } catch (err) {
      console.error(
        `[FeedScheduler:${feedId}] Unhandled poll error:`,
        err instanceof Error ? err.message : err,
      );
      reg.nextPollAt = Date.now() + reg.pollIntervalMs;
      return null;
    } finally {
      reg.isPolling = false;
      this.activePolls = Math.max(0, this.activePolls - 1);
    }
  }

  private async ingestPayload(payload: NormalizedFeedPayload): Promise<void> {
    if (!this.entityIngestionFn) return;

    try {
      const { entitiesUpserted, relationshipsCreated } = await this.entityIngestionFn(
        payload.entities,
        payload.relationships,
        payload.feedId,
      );

      if (entitiesUpserted.length > 0) {
        const entityMap = new Map(entitiesUpserted.map((e) => [e.id, e]));

        for (const entity of entitiesUpserted) {
          const entityRels = relationshipsCreated.filter(
            (r) => r.fromEntityId === entity.id || r.toEntityId === entity.id,
          );
          const connected = entityRels
            .map((r) => {
              const otherId = r.fromEntityId === entity.id ? r.toEntityId : r.fromEntityId;
              return entityMap.get(otherId);
            })
            .filter((e): e is OntologyEntity => e !== undefined);

          await fusionEngine.processEntityUpdate({
            entity,
            relationships: entityRels,
            connectedEntities: connected,
            source: payload.feedId,
          });
        }
      }
    } catch (err) {
      console.warn(
        `[FeedScheduler] Ingestion error for feed ${payload.feedId}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  getAllHealth(): FeedHealthStatus[] {
    return [...this.feeds.values()].map((reg) => reg.adapter.getHealth());
  }

  getFeedHealth(feedId: string): FeedHealthStatus | null {
    return this.feeds.get(feedId)?.adapter.getHealth() ?? null;
  }

  getSchedulerStatus(): {
    isStarted: boolean;
    activePolls: number;
    feedCount: number;
    feedStatuses: Array<{
      feedId: string;
      feedName: string;
      status: string;
      enabled: boolean;
      nextPollIn: number;
    }>;
  } {
    const now = Date.now();
    return {
      isStarted: this.isStarted,
      activePolls: this.activePolls,
      feedCount: this.feeds.size,
      feedStatuses: [...this.feeds.entries()].map(([feedId, reg]) => ({
        feedId,
        feedName: reg.adapter.getHealth().feedName,
        status: reg.adapter.getHealth().status,
        enabled: reg.enabled,
        nextPollIn: Math.max(0, Math.round((reg.nextPollAt - now) / 1000)),
      })),
    };
  }

  isFeedEnabled(feedId: string): boolean {
    return this.feeds.get(feedId)?.enabled ?? false;
  }

  recordIngestion(
    feedId: string,
    event: Omit<FeedIngestionEvent, 'pollAt'> & { pollAt?: string },
  ): void {
    const pollAt = event.pollAt ?? new Date().toISOString();
    const entry: FeedIngestionEvent = {
      pollAt,
      entitiesCreated: event.entitiesCreated,
      entitiesMerged: event.entitiesMerged,
      entitiesUpserted: event.entitiesUpserted,
      relationshipsCreated: event.relationshipsCreated,
    };

    const history = this.ingestionHistory.get(feedId) ?? [];
    history.push(entry);
    if (history.length > INGESTION_HISTORY_LIMIT) history.shift();
    this.ingestionHistory.set(feedId, history);

    const totals = this.ingestionTotals.get(feedId) ?? {
      totalCreated: 0,
      totalMerged: 0,
      lastIngestedAt: null,
    };
    totals.totalCreated += entry.entitiesCreated;
    totals.totalMerged += entry.entitiesMerged;
    totals.lastIngestedAt = pollAt;
    this.ingestionTotals.set(feedId, totals);
  }

  getIngestionSummary(feedId: string): FeedIngestionSummary {
    const totals = this.ingestionTotals.get(feedId) ?? {
      totalCreated: 0,
      totalMerged: 0,
      lastIngestedAt: null,
    };
    return {
      feedId,
      totalCreated: totals.totalCreated,
      totalMerged: totals.totalMerged,
      lastIngestedAt: totals.lastIngestedAt,
      recent: [...(this.ingestionHistory.get(feedId) ?? [])],
    };
  }

  getAllIngestionSummaries(): FeedIngestionSummary[] {
    return [...this.feeds.keys()].map((feedId) => this.getIngestionSummary(feedId));
  }

  setFeedEnabled(feedId: string, enabled: boolean): boolean {
    const reg = this.feeds.get(feedId);
    if (!reg) return false;
    reg.enabled = enabled;
    console.log(`[FeedScheduler] Feed ${feedId} ${enabled ? 'enabled' : 'disabled'}`);
    return true;
  }

  /**
   * Run `healthCheck()` on every registered adapter, log summary, and update
   * adapter health status. Called on the health-check interval.
   */
  private async runHealthChecks(): Promise<void> {
    const results = await Promise.allSettled(
      [...this.feeds.entries()].map(async ([feedId, reg]) => {
        try {
          await reg.adapter.healthCheck();
          return { feedId, ok: true };
        } catch (err) {
          return { feedId, ok: false, error: err instanceof Error ? err.message : String(err) };
        }
      }),
    );

    let healthy = 0;
    let degraded = 0;
    let failed = 0;
    for (const r of results) {
      if (r.status === 'fulfilled') {
        if (r.value.ok) healthy++;
        else {
          degraded++;
          console.warn(
            `[FeedScheduler:HealthCheck] Feed ${r.value.feedId} health probe failed: ${r.value.error}`,
          );
        }
      } else {
        failed++;
      }
    }

    const all = this.getAllHealth();
    const down = all.filter((h) => h.status === 'down').length;
    console.log(
      `[FeedScheduler:Health] ${all.length} feeds — probe ok: ${healthy}, probe failed: ${degraded + failed}, down: ${down} | active polls: ${this.activePolls}`,
    );
  }
}

export const feedScheduler = new FeedScheduler();
