/**
 * Intelligence Feeds Initialization
 *
 * Wires the feed scheduler → ontology engine ingestion pipeline.
 * Registers all OSINT feed adapters and starts polling on server startup.
 *
 * Entity ingestion: NormalizedFeedPayload → OntologyEngine.upsertEntity + createRelationship
 * Relationship resolution: externalId → UUID via in-batch map first, then DB lookup fallback
 * for pre-existing entities that were ingested in prior polling cycles.
 *
 * All errors are non-fatal — feeds run in isolation and cannot crash the server.
 */

import type {
  OntologyEntity,
  OntologyRelationship,
} from '@szl-holdings/ai-engine/ontology/ontology-engine';
import { db, entitiesTable } from '@szl-holdings/db';
import type { NormalizedFeedPayload } from '@szl-holdings/intelligence-feeds/feed-adapter';
import { eq } from 'drizzle-orm';
import { logger } from './logger';
import { isFlagEnabled } from './platform-flags';

let started = false;

/**
 * Resolve an external ID to a database UUID.
 * First checks the in-batch map (fast), then falls back to DB lookup by external_id column.
 */
async function resolveExternalId(
  externalId: string,
  batchMap: Map<string, string>,
): Promise<string | null> {
  const batched = batchMap.get(externalId);
  if (batched) return batched;

  try {
    const [row] = await db
      .select({ id: entitiesTable.id })
      .from(entitiesTable)
      .where(eq(entitiesTable.externalId, externalId))
      .limit(1);
    return row?.id ?? null;
  } catch {
    return null;
  }
}

export async function startIntelligenceFeeds(): Promise<void> {
  if (started) return;
  started = true;

  try {
    const [
      { feedScheduler },
      { AISFeedAdapter },
      { STIXTAXIIFeedAdapter },
      { SanctionsFeedAdapter },
      { LegalRecordsFeedAdapter },
      { ontologyEngine },
    ] = await Promise.all([
      import('@szl-holdings/intelligence-feeds/feed-scheduler'),
      import('@szl-holdings/intelligence-feeds/adapters/ais'),
      import('@szl-holdings/intelligence-feeds/adapters/stix-taxii'),
      import('@szl-holdings/intelligence-feeds/adapters/sanctions'),
      import('@szl-holdings/intelligence-feeds/adapters/legal-records'),
      import('@szl-holdings/ai-engine/ontology/ontology-engine'),
    ]);

    const aisEnabled =
      process.env.AIS_FEED_ENABLED !== 'false' && (await isFlagEnabled('live_ais_feed_enabled'));
    const stixEnabled = process.env.STIX_FEED_ENABLED !== 'false';
    const sanctionsEnabled = process.env.SANCTIONS_FEED_ENABLED !== 'false';
    const legalEnabled = process.env.LEGAL_FEED_ENABLED !== 'false';

    if (aisEnabled) feedScheduler.register(new AISFeedAdapter());
    if (stixEnabled) feedScheduler.register(new STIXTAXIIFeedAdapter());
    if (sanctionsEnabled) feedScheduler.register(new SanctionsFeedAdapter());
    if (legalEnabled) feedScheduler.register(new LegalRecordsFeedAdapter());

    feedScheduler.setEntityIngestionFn(
      async (
        entities: NormalizedFeedPayload['entities'],
        relationships: NormalizedFeedPayload['relationships'],
        source: string,
      ): Promise<{
        entitiesUpserted: OntologyEntity[];
        relationshipsCreated: OntologyRelationship[];
      }> => {
        const upserted: OntologyEntity[] = [];
        const created: OntologyRelationship[] = [];
        const externalIdMap = new Map<string, string>();
        let entitiesCreated = 0;
        let entitiesMerged = 0;

        for (const entity of entities) {
          try {
            const result = await ontologyEngine.upsertEntity(entity);
            upserted.push(result);
            if (result.wasCreated) {
              entitiesCreated++;
            } else {
              entitiesMerged++;
            }
            if (entity.externalId) {
              externalIdMap.set(entity.externalId, result.id);
            }
          } catch (err) {
            logger.warn(
              { err, entity: entity.name, source },
              '[feeds] Entity upsert failed (non-fatal)',
            );
          }
        }

        for (const rel of relationships) {
          try {
            const fromId = await resolveExternalId(rel.fromExternalId, externalIdMap);
            const toId = await resolveExternalId(rel.toExternalId, externalIdMap);

            if (!fromId) {
              logger.debug(
                { fromExternalId: rel.fromExternalId, source },
                '[feeds] Cannot resolve fromExternalId — relationship skipped',
              );
              continue;
            }
            if (!toId) {
              logger.debug(
                { toExternalId: rel.toExternalId, source },
                '[feeds] Cannot resolve toExternalId — relationship skipped',
              );
              continue;
            }

            const result = await ontologyEngine.createRelationship(
              fromId,
              toId,
              rel.type as Parameters<typeof ontologyEngine.createRelationship>[2],
              rel.strength,
              rel.metadata,
            );
            created.push(result);
          } catch (err) {
            logger.warn(
              { err, fromExternalId: rel.fromExternalId, toExternalId: rel.toExternalId, source },
              '[feeds] Relationship creation failed (non-fatal)',
            );
          }
        }

        if (upserted.length > 0 || created.length > 0) {
          logger.info(
            {
              source,
              entitiesUpserted: upserted.length,
              entitiesCreated,
              entitiesMerged,
              relationshipsCreated: created.length,
            },
            `[feeds] Upserted ${upserted.length} entities: ${entitiesCreated} created, ${entitiesMerged} merged (source=${source})`,
          );
        } else {
          logger.debug({ source }, '[feeds] Ingestion batch complete (no entities)');
        }
        // Record every successful poll — including zero-churn batches — so the
        // operator dashboard reflects true poll cadence and lastIngestedAt
        // never goes stale while polls are still succeeding.
        feedScheduler.recordIngestion(source, {
          entitiesCreated,
          entitiesMerged,
          entitiesUpserted: upserted.length,
          relationshipsCreated: created.length,
        });
        return { entitiesUpserted: upserted, relationshipsCreated: created };
      },
    );

    await feedScheduler.start();

    logger.info(
      { feedCount: feedScheduler.getSchedulerStatus().feedCount },
      '[feeds] Intelligence feed scheduler started',
    );
  } catch (err) {
    logger.warn({ err }, '[feeds] Intelligence feeds startup failed (non-fatal — feeds disabled)');
  }
}

export async function stopIntelligenceFeeds(): Promise<void> {
  try {
    const { feedScheduler } = await import('@szl-holdings/intelligence-feeds/feed-scheduler');
    feedScheduler.stop();
    logger.info('[feeds] Intelligence feed scheduler stopped');
  } catch {
    // Already stopped or never started
  }
}

/**
 * Expose feed health data for the self-monitor health check endpoint.
 * Returns an array of health summaries per registered feed adapter.
 */
export async function getFeedHealthSummary(): Promise<
  Array<{
    feedId: string;
    feedName: string;
    status: string;
    consecutiveFailures: number;
    entitiesIngested: number;
    avgPollDurationMs: number;
    lastSuccessAt: string | null;
  }>
> {
  try {
    const { feedScheduler } = await import('@szl-holdings/intelligence-feeds/feed-scheduler');
    return feedScheduler.getAllHealth().map((h) => ({
      feedId: h.feedId,
      feedName: h.feedName,
      status: h.status,
      consecutiveFailures: h.consecutiveFailures,
      entitiesIngested: h.entitiesIngested,
      avgPollDurationMs: h.avgPollDurationMs,
      lastSuccessAt: h.lastSuccessAt,
    }));
  } catch {
    return [];
  }
}

/**
 * Operator-facing per-feed ingestion summary.
 * Combines health (status, failures, last success) with sync activity counters
 * (entitiesCreated / entitiesMerged) and a recent-poll history for sparklines.
 */
export interface FeedIngestionView {
  feedId: string;
  feedName: string;
  status: string;
  enabled: boolean;
  consecutiveFailures: number;
  avgPollDurationMs: number;
  lastSuccessAt: string | null;
  lastIngestedAt: string | null;
  totalEntitiesCreated: number;
  totalEntitiesMerged: number;
  recentPolls: Array<{
    pollAt: string;
    entitiesCreated: number;
    entitiesMerged: number;
    entitiesUpserted: number;
    relationshipsCreated: number;
  }>;
}

export async function getFeedIngestionView(): Promise<FeedIngestionView[]> {
  try {
    const { feedScheduler } = await import('@szl-holdings/intelligence-feeds/feed-scheduler');
    const health = feedScheduler.getAllHealth();
    const status = feedScheduler.getSchedulerStatus();
    const enabledMap = new Map(status.feedStatuses.map((f) => [f.feedId, f.enabled]));
    return health.map((h) => {
      const summary = feedScheduler.getIngestionSummary(h.feedId);
      return {
        feedId: h.feedId,
        feedName: h.feedName,
        status: h.status,
        enabled: enabledMap.get(h.feedId) ?? false,
        consecutiveFailures: h.consecutiveFailures,
        avgPollDurationMs: h.avgPollDurationMs,
        lastSuccessAt: h.lastSuccessAt,
        lastIngestedAt: summary.lastIngestedAt,
        totalEntitiesCreated: summary.totalCreated,
        totalEntitiesMerged: summary.totalMerged,
        recentPolls: summary.recent,
      };
    });
  } catch {
    return [];
  }
}
