import { db } from '@szl-holdings/db';
import {
  analyticsAnomaliesTable,
  analyticsEventsTable,
  analyticsExportJobsTable,
  analyticsMetricDefinitionsTable,
  analyticsMetricSnapshotsTable,
} from '@szl-holdings/db/schema';
import { JOB_TYPES } from '@szl-holdings/forge-runtime';
import {
  candidateToRecord,
  computeNextRunAt,
  detectAnomalies,
  detectTrendChange,
  generateBuckets,
  getBucketEnd,
  serializeAnalyticsEvents,
  serializeAnomalies,
  serializeMetricSnapshots,
} from '@szl-holdings/observability/analytics';
import { randomBytes } from 'crypto';
import { and, asc, desc, eq, gte, lte } from 'drizzle-orm';
import { jobQueue } from './job-queue';
import { logger } from './logger';

// ---------------------------------------------------------------------------
// METRICS_AGGREGATION job
// Aggregates raw analytics events into metric snapshots at multiple granularities
// ---------------------------------------------------------------------------

export async function runMetricsAggregation(payload: {
  domain?: string;
  metricId?: string;
  lookbackHours?: number;
}): Promise<void> {
  const { domain, metricId, lookbackHours = 25 } = payload;
  const now = new Date();
  const from = new Date(now.getTime() - lookbackHours * 60 * 60 * 1000);

  logger.info({ domain, metricId, lookbackHours }, '[analytics-agg] Starting metrics aggregation');

  const conditions = [];
  if (domain) conditions.push(eq(analyticsMetricDefinitionsTable.domain, domain));
  if (metricId) conditions.push(eq(analyticsMetricDefinitionsTable.metricId, metricId));
  conditions.push(eq(analyticsMetricDefinitionsTable.isActive, true));

  const definitions = await db
    .select()
    .from(analyticsMetricDefinitionsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  let totalSnapshots = 0;

  for (const def of definitions) {
    const granularities = (def.granularities as string[]) ?? ['hour', 'day'];
    const eventName = def.eventName;

    if (!eventName) continue;

    const events = await db
      .select({
        numericValue: analyticsEventsTable.numericValue,
        occurredAt: analyticsEventsTable.occurredAt,
        dimensions: analyticsEventsTable.dimensions,
      })
      .from(analyticsEventsTable)
      .where(
        and(
          eq(analyticsEventsTable.domain, def.domain),
          eq(analyticsEventsTable.eventName, eventName),
          gte(analyticsEventsTable.occurredAt, from),
          lte(analyticsEventsTable.occurredAt, now),
        ),
      )
      .orderBy(asc(analyticsEventsTable.occurredAt));

    for (const granularity of granularities as Array<
      'minute' | 'hour' | 'day' | 'week' | 'month'
    >) {
      const buckets = generateBuckets(from, now, granularity);

      for (const bucket of buckets) {
        const inBucket = events.filter(
          (e) => e.occurredAt >= bucket.start && e.occurredAt < bucket.end,
        );
        if (inBucket.length === 0) continue;

        const values = inBucket.map((e) => e.numericValue ?? 1);
        const value = aggregateValues(values, def.calculationType);

        try {
          await db
            .insert(analyticsMetricSnapshotsTable)
            .values({
              metricId: def.metricId,
              granularity,
              periodStart: bucket.start,
              periodEnd: bucket.end,
              value,
              sampleCount: values.length,
              domain: def.domain,
              dimensions: {},
            })
            .onConflictDoUpdate({
              target: [
                analyticsMetricSnapshotsTable.metricId,
                analyticsMetricSnapshotsTable.granularity,
                analyticsMetricSnapshotsTable.periodStart,
              ],
              set: {
                value,
                sampleCount: values.length,
                computedAt: new Date(),
              },
            });
          totalSnapshots++;
        } catch (err) {
          logger.warn(
            { err, metricId: def.metricId, granularity },
            '[analytics-agg] Failed to upsert snapshot',
          );
        }
      }
    }
  }

  logger.info(
    { totalSnapshots, definitions: definitions.length },
    '[analytics-agg] Aggregation complete',
  );
}

function aggregateValues(values: number[], type: string): number {
  if (values.length === 0) return 0;
  switch (type) {
    case 'count':
      return values.length;
    case 'sum':
      return values.reduce((a, b) => a + b, 0);
    case 'avg':
      return values.reduce((a, b) => a + b, 0) / values.length;
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    case 'distinct_count':
      return new Set(values).size;
    case 'rate':
      return (values.filter((v) => v > 0).length / values.length) * 100;
    default:
      return values.length;
  }
}

// ---------------------------------------------------------------------------
// ANOMALY_SCAN job
// Scans metric snapshots for anomalies using statistical detection
// ---------------------------------------------------------------------------

export async function runAnomalyScan(payload: {
  domain?: string;
  metricId?: string;
  lookbackDays?: number;
}): Promise<void> {
  const { domain, metricId, lookbackDays = 30 } = payload;
  const now = new Date();
  const from = new Date(now.getTime() - lookbackDays * 24 * 60 * 60 * 1000);

  logger.info({ domain, metricId, lookbackDays }, '[analytics-anomaly] Starting anomaly scan');

  const snapshotConditions = [];
  if (domain) snapshotConditions.push(eq(analyticsMetricSnapshotsTable.domain, domain));
  if (metricId) snapshotConditions.push(eq(analyticsMetricSnapshotsTable.metricId, metricId));
  snapshotConditions.push(
    eq(analyticsMetricSnapshotsTable.granularity, 'hour'),
    gte(analyticsMetricSnapshotsTable.periodStart, from),
    lte(analyticsMetricSnapshotsTable.periodStart, now),
  );

  const snapshots = await db
    .select()
    .from(analyticsMetricSnapshotsTable)
    .where(and(...snapshotConditions))
    .orderBy(
      asc(analyticsMetricSnapshotsTable.metricId),
      asc(analyticsMetricSnapshotsTable.periodStart),
    );

  const byMetric = new Map<string, typeof snapshots>();
  for (const snap of snapshots) {
    const list = byMetric.get(snap.metricId) ?? [];
    list.push(snap);
    byMetric.set(snap.metricId, list);
  }

  let totalAnomalies = 0;

  for (const [mId, snaps] of byMetric) {
    const dataPoints = snaps.map((s) => ({
      timestamp: s.periodStart,
      value: s.value,
      sampleCount: s.sampleCount,
    }));

    const metricDomain = snaps[0]?.domain ?? domain ?? 'platform';

    const candidates = [...detectAnomalies(dataPoints), ...detectTrendChange(dataPoints)];

    for (const candidate of candidates) {
      const anomalyId = `anm_${mId.replace(/\./g, '_')}_${candidate.timestamp.getTime()}`;

      const existing = await db
        .select({ id: analyticsAnomaliesTable.id })
        .from(analyticsAnomaliesTable)
        .where(eq(analyticsAnomaliesTable.anomalyId, anomalyId))
        .limit(1);

      if (existing.length > 0) continue;

      const record = candidateToRecord(candidate, mId, metricDomain);

      try {
        await db.insert(analyticsAnomaliesTable).values({
          ...record,
          isResolved: false,
          isSuppressed: false,
        });
        totalAnomalies++;
      } catch (err) {
        logger.warn({ err, anomalyId }, '[analytics-anomaly] Failed to insert anomaly');
      }
    }
  }

  logger.info(
    { totalAnomalies, metrics: byMetric.size },
    '[analytics-anomaly] Anomaly scan complete',
  );
}

// ---------------------------------------------------------------------------
// ANALYTICS_EXPORT job
// Processes scheduled and one-time analytics export jobs
// ---------------------------------------------------------------------------

export async function runAnalyticsExport(payload: {
  exportId: string;
  domain: string;
  exportType: string;
  format: string;
  from: string;
  to: string;
}): Promise<void> {
  const { exportId, domain, exportType, format, from: fromStr, to: toStr } = payload;

  logger.info({ exportId, domain, exportType, format }, '[analytics-export] Processing export job');

  try {
    await db
      .update(analyticsExportJobsTable)
      .set({ status: 'processing' })
      .where(eq(analyticsExportJobsTable.exportId, exportId));

    const from = new Date(fromStr);
    const to = new Date(toStr);

    let content = '';
    let rowCount = 0;

    if (exportType === 'events') {
      const events = await db
        .select()
        .from(analyticsEventsTable)
        .where(
          and(
            eq(analyticsEventsTable.domain, domain),
            gte(analyticsEventsTable.occurredAt, from),
            lte(analyticsEventsTable.occurredAt, to),
          ),
        )
        .orderBy(asc(analyticsEventsTable.occurredAt))
        .limit(100_000);

      content = serializeAnalyticsEvents(events, format as 'csv' | 'json' | 'parquet');
      rowCount = events.length;
    } else if (exportType === 'metric_snapshots') {
      const snapshots = await db
        .select()
        .from(analyticsMetricSnapshotsTable)
        .where(
          and(
            eq(analyticsMetricSnapshotsTable.domain, domain),
            gte(analyticsMetricSnapshotsTable.periodStart, from),
            lte(analyticsMetricSnapshotsTable.periodStart, to),
          ),
        )
        .orderBy(asc(analyticsMetricSnapshotsTable.periodStart))
        .limit(100_000);

      content = serializeMetricSnapshots(snapshots, format as 'csv' | 'json' | 'parquet');
      rowCount = snapshots.length;
    } else if (exportType === 'anomalies') {
      const anomalies = await db
        .select()
        .from(analyticsAnomaliesTable)
        .where(
          and(
            eq(analyticsAnomaliesTable.domain, domain),
            gte(analyticsAnomaliesTable.detectedAt, from),
            lte(analyticsAnomaliesTable.detectedAt, to),
          ),
        )
        .orderBy(desc(analyticsAnomaliesTable.detectedAt))
        .limit(50_000);

      content = serializeAnomalies(anomalies, format as 'csv' | 'json' | 'parquet');
      rowCount = anomalies.length;
    }

    const downloadToken = randomBytes(24).toString('hex');
    const fileSizeBytes = Buffer.byteLength(content, 'utf-8');

    await db
      .update(analyticsExportJobsTable)
      .set({
        status: 'completed',
        rowCount,
        fileSizeBytes,
        downloadToken,
        completedAt: new Date(),
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      })
      .where(eq(analyticsExportJobsTable.exportId, exportId));

    const [job] = await db
      .select({ webhookUrl: analyticsExportJobsTable.webhookUrl })
      .from(analyticsExportJobsTable)
      .where(eq(analyticsExportJobsTable.exportId, exportId))
      .limit(1);

    if (job?.webhookUrl) {
      fetch(job.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exportId, status: 'completed', rowCount, downloadToken }),
        signal: AbortSignal.timeout(10_000),
      }).catch((err) => {
        logger.warn({ err, exportId }, '[analytics-export] Webhook notification failed');
      });
    }

    logger.info({ exportId, rowCount, fileSizeBytes }, '[analytics-export] Export completed');
  } catch (err) {
    logger.error({ err, exportId }, '[analytics-export] Export failed');
    await db
      .update(analyticsExportJobsTable)
      .set({ status: 'failed', errorMessage: String(err) })
      .where(eq(analyticsExportJobsTable.exportId, exportId));
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Register all analytics job handlers
// ---------------------------------------------------------------------------

export function registerAnalyticsJobHandlers(): void {
  jobQueue.register(JOB_TYPES.METRICS_AGGREGATION, async (job) => {
    await runMetricsAggregation(
      job.payload as {
        domain?: string;
        metricId?: string;
        lookbackHours?: number;
      },
    );
  });

  jobQueue.register(JOB_TYPES.ANOMALY_SCAN, async (job) => {
    await runAnomalyScan(
      job.payload as {
        domain?: string;
        metricId?: string;
        lookbackDays?: number;
      },
    );
  });

  jobQueue.register(JOB_TYPES.ANALYTICS_EXPORT, async (job) => {
    await runAnalyticsExport(
      job.payload as {
        exportId: string;
        domain: string;
        exportType: string;
        format: string;
        from: string;
        to: string;
      },
    );
  });

  logger.info(
    '[analytics-jobs] Registered analytics job handlers: METRICS_AGGREGATION, ANOMALY_SCAN, ANALYTICS_EXPORT',
  );
}
