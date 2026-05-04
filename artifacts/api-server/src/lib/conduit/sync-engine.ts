import { db } from '@szl-holdings/db';
import { eq } from 'drizzle-orm';
import {
  conduitSyncsTable,
  conduitSyncRunsTable,
  conduitSyncRunRowsTable,
  conduitSyncMappingsTable,
  conduitConnectionsTable,
} from '@szl-holdings/db';
import { getSource, getDestination } from './connector-registry';
import { applyMappings, type MappingConfig } from './transform-engine';
import type { WriteBatchResult } from './connector-protocol';
import { logger } from '../logger';

const activeSyncs = new Set<string>();

export function isSyncRunning(syncId: string): boolean {
  return activeSyncs.has(syncId);
}

interface SyncExecutionOptions {
  triggeredBy?: string;
  fullRefresh?: boolean;
  batchSize?: number;
}

const MAX_WRITE_RETRIES = 3;

async function writeWithRetry(
  writeFn: () => Promise<WriteBatchResult>,
  retries: number = MAX_WRITE_RETRIES,
): Promise<WriteBatchResult> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await writeFn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const isTransient = lastError.message.includes('ECONNRESET') ||
        lastError.message.includes('ETIMEDOUT') ||
        lastError.message.includes('ECONNREFUSED') ||
        lastError.message.includes('socket hang up') ||
        lastError.message.includes('429') ||
        lastError.message.includes('503');

      if (!isTransient || attempt >= retries) {
        throw lastError;
      }

      const backoffMs = Math.min(1000 * Math.pow(2, attempt), 16000);
      await new Promise(r => setTimeout(r, backoffMs));
    }
  }
  throw lastError ?? new Error('Write failed after retries');
}

export async function executeSyncRun(
  runId: string,
  syncId: string,
  options: SyncExecutionOptions = {},
): Promise<void> {
  if (activeSyncs.has(syncId)) {
    await db.update(conduitSyncRunsTable).set({
      status: 'failed',
      errorMessage: 'Sync is already running',
      finishedAt: new Date(),
    }).where(eq(conduitSyncRunsTable.id, runId));
    return;
  }

  activeSyncs.add(syncId);
  const startTime = Date.now();

  try {
    const [sync] = await db.select().from(conduitSyncsTable).where(eq(conduitSyncsTable.id, syncId));
    if (!sync) {
      await db.update(conduitSyncRunsTable).set({
        status: 'failed',
        errorMessage: 'Sync not found',
        finishedAt: new Date(),
      }).where(eq(conduitSyncRunsTable.id, runId));
      return;
    }

    const [connection] = await db.select().from(conduitConnectionsTable).where(eq(conduitConnectionsTable.id, sync.connectionId));
    if (!connection) {
      await db.update(conduitSyncRunsTable).set({
        status: 'failed',
        errorMessage: 'Connection not found',
        finishedAt: new Date(),
      }).where(eq(conduitSyncRunsTable.id, runId));
      return;
    }

    const sourceConnector = getSource(sync.sourceType);
    if (!sourceConnector) {
      await db.update(conduitSyncRunsTable).set({
        status: 'failed',
        errorMessage: `No source connector registered for type: ${sync.sourceType}`,
        finishedAt: new Date(),
      }).where(eq(conduitSyncRunsTable.id, runId));
      return;
    }

    const destConnector = getDestination(connection.destination);
    if (!destConnector) {
      await db.update(conduitSyncRunsTable).set({
        status: 'failed',
        errorMessage: `No destination connector registered for type: ${connection.destination}`,
        finishedAt: new Date(),
      }).where(eq(conduitSyncRunsTable.id, runId));
      return;
    }

    const mappings = await db.select().from(conduitSyncMappingsTable)
      .where(eq(conduitSyncMappingsTable.syncId, syncId))
      .orderBy(conduitSyncMappingsTable.sortOrder);

    const mappingConfigs: MappingConfig[] = mappings.map(m => ({
      sourceField: m.sourceField,
      destinationField: m.destinationField,
      transform: m.transform,
      transformConfig: m.transformConfig,
    }));

    const batchSize = options.batchSize ?? 100;
    let cursor: string | null = null;
    let totalRead = 0;
    let totalWritten = 0;
    let totalFailed = 0;
    let hasMore = true;
    const failedRowRecords: Array<{ runId: string; rowIndex: number; sourceData: Record<string, unknown>; errorMessage: string }> = [];

    const sourceConfig = (sync.sourceMeta as Record<string, unknown>) || {};

    const savedCursor = await loadCursorValue(syncId);
    if (!options.fullRefresh && savedCursor) {
      cursor = savedCursor;
    }

    while (hasMore) {
      let batchResult;
      try {
        batchResult = await sourceConnector.readBatch(sourceConfig, {
          batchSize,
          cursor,
          fullRefresh: options.fullRefresh,
        });
      } catch (err) {
        logger.error({ err, syncId, runId }, 'Source readBatch failed');
        if (totalRead === 0) {
          await db.update(conduitSyncRunsTable).set({
            status: 'failed',
            errorMessage: `Source read failed: ${err instanceof Error ? err.message : 'unknown'}`,
            rowsRead: totalRead,
            rowsWritten: totalWritten,
            rowsFailed: totalFailed,
            durationMs: Date.now() - startTime,
            finishedAt: new Date(),
          }).where(eq(conduitSyncRunsTable.id, runId));
          return;
        }
        break;
      }

      if (batchResult.rows.length === 0) break;

      totalRead += batchResult.rows.length;
      cursor = batchResult.cursor ?? cursor;
      hasMore = batchResult.hasMore;

      let transformedRecords: Array<Record<string, unknown>>;
      if (mappingConfigs.length > 0) {
        const { records, errors } = applyMappings(batchResult.rows, mappingConfigs);
        transformedRecords = records;
        for (const err of errors) {
          logger.debug({ syncId, rowIndex: err.rowIndex, errors: err.errors }, 'Transform errors (non-fatal)');
        }
      } else {
        transformedRecords = batchResult.rows;
      }

      let writeResult: WriteBatchResult;
      try {
        const credentials = (connection.credentialMeta as Record<string, unknown>) || {};
        writeResult = await writeWithRetry(
          () => destConnector.writeBatch(credentials, sync.objectType, transformedRecords),
        );
      } catch (err) {
        logger.error({ err, syncId, runId }, 'Destination writeBatch failed after retries');
        totalFailed += transformedRecords.length;
        for (let i = 0; i < transformedRecords.length && failedRowRecords.length < 500; i++) {
          failedRowRecords.push({
            runId,
            rowIndex: totalRead - batchResult.rows.length + i,
            sourceData: batchResult.rows[i],
            errorMessage: err instanceof Error ? err.message : 'Write failed',
          });
        }
        continue;
      }

      totalWritten += writeResult.successCount;
      totalFailed += writeResult.failureCount;

      for (const rr of writeResult.rowResults) {
        if (!rr.success && failedRowRecords.length < 500) {
          const sourceRowIndex = totalRead - batchResult.rows.length + rr.rowIndex;
          failedRowRecords.push({
            runId,
            rowIndex: sourceRowIndex,
            sourceData: batchResult.rows[rr.rowIndex] || {},
            errorMessage: rr.errorMessage || 'Unknown write error',
          });
        }
      }

      if (destConnector.maxRequestsPerSecond && hasMore) {
        const delayMs = Math.ceil((transformedRecords.length * 1000) / destConnector.maxRequestsPerSecond);
        await new Promise(r => setTimeout(r, delayMs));
      }
    }

    if (failedRowRecords.length > 0) {
      const batches = [];
      for (let i = 0; i < failedRowRecords.length; i += 100) {
        batches.push(failedRowRecords.slice(i, i + 100));
      }
      for (const batch of batches) {
        await db.insert(conduitSyncRunRowsTable).values(batch);
      }
    }

    const status = totalFailed === 0 ? 'success' : (totalWritten === 0 ? 'failed' : 'partial');
    const durationMs = Date.now() - startTime;

    await db.update(conduitSyncRunsTable).set({
      status,
      rowsRead: totalRead,
      rowsWritten: totalWritten,
      rowsFailed: totalFailed,
      durationMs,
      finishedAt: new Date(),
      errorMessage: totalFailed > 0 ? `${totalFailed} rows failed` : null,
    }).where(eq(conduitSyncRunsTable.id, runId));

    await db.update(conduitSyncsTable).set({
      lastRunId: runId,
      lastRunAt: new Date(),
      lastRunStatus: status,
    }).where(eq(conduitSyncsTable.id, syncId));

    if (cursor) {
      await saveCursorValue(syncId, cursor);
    }

    return;
  } catch (err) {
    logger.error({ err, runId, syncId }, 'Sync execution failed unexpectedly');
    await db.update(conduitSyncRunsTable).set({
      status: 'failed',
      errorMessage: err instanceof Error ? err.message : 'Execution failed unexpectedly',
      durationMs: Date.now() - startTime,
      finishedAt: new Date(),
    }).where(eq(conduitSyncRunsTable.id, runId));
  } finally {
    activeSyncs.delete(syncId);
  }
}

async function loadCursorValue(syncId: string): Promise<string | null> {
  try {
    const [sync] = await db.select({
      cursorValue: conduitSyncsTable.cursorValue,
    }).from(conduitSyncsTable).where(eq(conduitSyncsTable.id, syncId));
    return sync?.cursorValue ?? null;
  } catch {
    return null;
  }
}

async function saveCursorValue(syncId: string, cursor: string): Promise<void> {
  try {
    await db.update(conduitSyncsTable).set({
      cursorValue: cursor,
      cursorUpdatedAt: new Date(),
    }).where(eq(conduitSyncsTable.id, syncId));
  } catch (err) {
    logger.error({ err, syncId }, 'Failed to save cursor value');
  }
}

export async function retryFailedRow(
  runId: string,
  rowId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const [row] = await db.select().from(conduitSyncRunRowsTable)
      .where(eq(conduitSyncRunRowsTable.id, rowId));
    if (!row) return { success: false, message: 'Row not found' };

    const [run] = await db.select().from(conduitSyncRunsTable)
      .where(eq(conduitSyncRunsTable.id, runId));
    if (!run) return { success: false, message: 'Run not found' };

    const [sync] = await db.select().from(conduitSyncsTable)
      .where(eq(conduitSyncsTable.id, run.syncId));
    if (!sync) return { success: false, message: 'Sync not found' };

    const [connection] = await db.select().from(conduitConnectionsTable)
      .where(eq(conduitConnectionsTable.id, sync.connectionId));
    if (!connection) return { success: false, message: 'Connection not found' };

    const sourceConnector = getSource(sync.sourceType);
    if (!sourceConnector) return { success: false, message: `No source connector for ${sync.sourceType}` };

    const destConnector = getDestination(connection.destination);
    if (!destConnector) return { success: false, message: `No destination connector for ${connection.destination}` };

    const storedSourceData = row.sourceData as Record<string, unknown>;
    const sourceConfig = (sync.sourceMeta as Record<string, unknown>) || {};

    let freshSourceData: Record<string, unknown> = storedSourceData;
    const primaryKey = (sourceConfig.primaryKey as string) || 'id';
    const primaryKeyValue = storedSourceData[primaryKey] as string | undefined;
    if (primaryKeyValue && sourceConnector.readRowById) {
      try {
        const refetched = await sourceConnector.readRowById(sourceConfig, primaryKey, String(primaryKeyValue));
        if (refetched) {
          freshSourceData = refetched;
        } else {
          logger.warn({ rowId, primaryKey, primaryKeyValue }, 'Source row no longer exists, using stored data');
        }
      } catch (err) {
        logger.warn({ err, rowId, primaryKey, primaryKeyValue }, 'Could not re-fetch source row, using stored data');
      }
    }

    const mappings = await db.select().from(conduitSyncMappingsTable)
      .where(eq(conduitSyncMappingsTable.syncId, sync.id))
      .orderBy(conduitSyncMappingsTable.sortOrder);

    const mappingConfigs: MappingConfig[] = mappings.map(m => ({
      sourceField: m.sourceField,
      destinationField: m.destinationField,
      transform: m.transform,
      transformConfig: m.transformConfig,
    }));

    let record: Record<string, unknown>;
    if (mappingConfigs.length > 0) {
      const { records } = applyMappings([freshSourceData], mappingConfigs);
      record = records[0];
    } else {
      record = freshSourceData;
    }

    const credentials = (connection.credentialMeta as Record<string, unknown>) || {};
    const result = await writeWithRetry(
      () => destConnector.writeBatch(credentials, sync.objectType, [record]),
    );

    const rowResult = result.rowResults[0];
    if (rowResult?.success) {
      await db.update(conduitSyncRunRowsTable).set({
        retried: true,
        retriedAt: new Date(),
        errorMessage: null,
      }).where(eq(conduitSyncRunRowsTable.id, rowId));
      return { success: true, message: 'Row retried successfully' };
    }

    await db.update(conduitSyncRunRowsTable).set({
      retried: true,
      retriedAt: new Date(),
      errorMessage: rowResult?.errorMessage || 'Retry failed',
    }).where(eq(conduitSyncRunRowsTable.id, rowId));
    return { success: false, message: rowResult?.errorMessage || 'Retry failed' };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : 'Retry failed unexpectedly' };
  }
}
