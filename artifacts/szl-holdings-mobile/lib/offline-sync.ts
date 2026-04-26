import * as SQLite from 'expo-sqlite';

export type SyncStatus = 'synced' | 'pending' | 'syncing' | 'conflict' | 'error';
export type ConflictResolution = 'client-wins' | 'server-wins' | 'merge' | 'manual';

export interface CachedEntity {
  id: string;
  entityType: string;
  data: Record<string, unknown>;
  version: number;
  cachedAt: number;
  lastModifiedAt: number;
  syncStatus: SyncStatus;
  serverVersion?: number;
  conflictData?: Record<string, unknown>;
}

export interface SyncQueueItem {
  id: string;
  entityType: string;
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  payload: Record<string, unknown>;
  queuedAt: number;
  retryCount: number;
  lastAttemptAt?: number;
  priority: number;
}

export interface SyncResult {
  synced: string[];
  conflicts: string[];
  errors: string[];
  totalProcessed: number;
  durationMs: number;
}

export interface ConflictRecord {
  entityId: string;
  entityType: string;
  clientData: Record<string, unknown>;
  serverData: Record<string, unknown>;
  clientVersion: number;
  serverVersion: number;
  detectedAt: number;
  resolved: boolean;
  resolution?: ConflictResolution;
}

const MAX_RETRIES = 5;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

let _db: SQLite.SQLiteDatabase | null = null;

function getDb(): SQLite.SQLiteDatabase {
  if (!_db) {
    _db = SQLite.openDatabaseSync('szl_offline_cache.db');
    _db.execSync(`
      CREATE TABLE IF NOT EXISTS cached_entities (
        id TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        data TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        cached_at INTEGER NOT NULL,
        last_modified_at INTEGER NOT NULL,
        sync_status TEXT NOT NULL DEFAULT 'pending',
        server_version INTEGER,
        conflict_data TEXT,
        PRIMARY KEY (entity_type, id)
      );
      CREATE INDEX IF NOT EXISTS idx_cached_type ON cached_entities(entity_type);
      CREATE INDEX IF NOT EXISTS idx_cached_status ON cached_entities(sync_status);

      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        operation TEXT NOT NULL,
        payload TEXT NOT NULL,
        queued_at INTEGER NOT NULL,
        retry_count INTEGER NOT NULL DEFAULT 0,
        last_attempt_at INTEGER,
        priority INTEGER NOT NULL DEFAULT 5
      );
      CREATE INDEX IF NOT EXISTS idx_queue_priority ON sync_queue(priority ASC, queued_at ASC);

      CREATE TABLE IF NOT EXISTS conflicts (
        entity_id TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        client_data TEXT NOT NULL,
        server_data TEXT NOT NULL,
        client_version INTEGER NOT NULL,
        server_version INTEGER NOT NULL,
        detected_at INTEGER NOT NULL,
        resolved INTEGER NOT NULL DEFAULT 0,
        resolution TEXT,
        PRIMARY KEY (entity_type, entity_id)
      );

      CREATE TABLE IF NOT EXISTS sync_meta (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);
  }
  return _db;
}

export async function cacheEntity(entity: CachedEntity): Promise<void> {
  const db = getDb();
  db.runSync(
    `INSERT OR REPLACE INTO cached_entities (id, entity_type, data, version, cached_at, last_modified_at, sync_status, server_version, conflict_data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    entity.id,
    entity.entityType,
    JSON.stringify(entity.data),
    entity.version,
    entity.cachedAt,
    entity.lastModifiedAt,
    entity.syncStatus,
    entity.serverVersion ?? null,
    entity.conflictData ? JSON.stringify(entity.conflictData) : null,
  );
}

export async function getCachedEntity(
  entityType: string,
  id: string,
): Promise<CachedEntity | null> {
  const db = getDb();
  const row = db.getFirstSync<Record<string, unknown>>(
    'SELECT * FROM cached_entities WHERE entity_type = ? AND id = ?',
    entityType,
    id,
  );
  if (!row) return null;

  const cachedAt = row.cached_at as number;
  if (Date.now() - cachedAt > CACHE_TTL_MS) {
    db.runSync('DELETE FROM cached_entities WHERE entity_type = ? AND id = ?', entityType, id);
    return null;
  }

  return rowToEntity(row);
}

export async function getCachedEntitiesByType(entityType: string): Promise<CachedEntity[]> {
  const db = getDb();
  const cutoff = Date.now() - CACHE_TTL_MS;
  db.runSync('DELETE FROM cached_entities WHERE entity_type = ? AND cached_at < ?', entityType, cutoff);

  const rows = db.getAllSync<Record<string, unknown>>(
    'SELECT * FROM cached_entities WHERE entity_type = ? ORDER BY last_modified_at DESC',
    entityType,
  );
  return rows.map(rowToEntity);
}

export async function removeCachedEntity(entityType: string, id: string): Promise<void> {
  const db = getDb();
  db.runSync('DELETE FROM cached_entities WHERE entity_type = ? AND id = ?', entityType, id);
}

export async function clearCache(entityType?: string): Promise<void> {
  const db = getDb();
  if (entityType) {
    db.runSync('DELETE FROM cached_entities WHERE entity_type = ?', entityType);
  } else {
    db.runSync('DELETE FROM cached_entities');
  }
}

export async function enqueueSync(
  entityType: string,
  entityId: string,
  operation: 'create' | 'update' | 'delete',
  payload: Record<string, unknown>,
  priority: number = 5,
): Promise<string> {
  const db = getDb();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  db.runSync(
    'DELETE FROM sync_queue WHERE entity_type = ? AND entity_id = ? AND operation = ?',
    entityType,
    entityId,
    operation,
  );

  db.runSync(
    `INSERT INTO sync_queue (id, entity_type, entity_id, operation, payload, queued_at, retry_count, priority)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
    id,
    entityType,
    entityId,
    operation,
    JSON.stringify(payload),
    Date.now(),
    priority,
  );

  return id;
}

export async function getSyncQueueSize(): Promise<number> {
  const db = getDb();
  const row = db.getFirstSync<{ cnt: number }>('SELECT COUNT(*) as cnt FROM sync_queue');
  return row?.cnt ?? 0;
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const db = getDb();
  const rows = db.getAllSync<Record<string, unknown>>(
    'SELECT * FROM sync_queue ORDER BY priority ASC, queued_at ASC',
  );
  return rows.map(rowToQueueItem);
}

export type SyncExecutor = (item: SyncQueueItem) => Promise<{
  success: boolean;
  serverVersion?: number;
  conflict?: { serverData: Record<string, unknown>; serverVersion: number };
}>;

export async function processSync(executor: SyncExecutor): Promise<SyncResult> {
  const startMs = Date.now();
  const queue = await getSyncQueue();
  const synced: string[] = [];
  const conflicts: string[] = [];
  const errors: string[] = [];
  const db = getDb();

  for (const item of queue) {
    try {
      const result = await executor(item);

      if (result.success) {
        synced.push(item.id);
        db.runSync('DELETE FROM sync_queue WHERE id = ?', item.id);

        const cached = await getCachedEntity(item.entityType, item.entityId);
        if (cached) {
          cached.syncStatus = 'synced';
          if (result.serverVersion) cached.serverVersion = result.serverVersion;
          await cacheEntity(cached);
        }
      } else if (result.conflict) {
        conflicts.push(item.id);
        db.runSync('DELETE FROM sync_queue WHERE id = ?', item.id);

        const conflict: ConflictRecord = {
          entityId: item.entityId,
          entityType: item.entityType,
          clientData: item.payload,
          serverData: result.conflict.serverData,
          clientVersion: (item.payload.version as number) ?? 0,
          serverVersion: result.conflict.serverVersion,
          detectedAt: Date.now(),
          resolved: false,
        };
        await addConflict(conflict);

        const cached = await getCachedEntity(item.entityType, item.entityId);
        if (cached) {
          cached.syncStatus = 'conflict';
          cached.conflictData = result.conflict.serverData;
          cached.serverVersion = result.conflict.serverVersion;
          await cacheEntity(cached);
        }
      } else {
        const newRetry = item.retryCount + 1;
        if (newRetry <= MAX_RETRIES) {
          db.runSync(
            'UPDATE sync_queue SET retry_count = ?, last_attempt_at = ? WHERE id = ?',
            newRetry,
            Date.now(),
            item.id,
          );
        } else {
          errors.push(item.id);
          db.runSync('DELETE FROM sync_queue WHERE id = ?', item.id);
        }
      }
    } catch {
      const newRetry = item.retryCount + 1;
      if (newRetry <= MAX_RETRIES) {
        db.runSync(
          'UPDATE sync_queue SET retry_count = ?, last_attempt_at = ? WHERE id = ?',
          newRetry,
          Date.now(),
          item.id,
        );
      } else {
        errors.push(item.id);
        db.runSync('DELETE FROM sync_queue WHERE id = ?', item.id);
      }
    }
  }

  db.runSync(
    'INSERT OR REPLACE INTO sync_meta (key, value) VALUES (?, ?)',
    'last_sync',
    JSON.stringify({
      timestamp: Date.now(),
      synced: synced.length,
      conflicts: conflicts.length,
      errors: errors.length,
    }),
  );

  return {
    synced,
    conflicts,
    errors,
    totalProcessed: synced.length + conflicts.length + errors.length,
    durationMs: Date.now() - startMs,
  };
}

async function addConflict(record: ConflictRecord): Promise<void> {
  const db = getDb();
  db.runSync(
    `INSERT OR REPLACE INTO conflicts (entity_id, entity_type, client_data, server_data, client_version, server_version, detected_at, resolved, resolution)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    record.entityId,
    record.entityType,
    JSON.stringify(record.clientData),
    JSON.stringify(record.serverData),
    record.clientVersion,
    record.serverVersion,
    record.detectedAt,
    record.resolved ? 1 : 0,
    record.resolution ?? null,
  );
}

export async function getConflicts(): Promise<ConflictRecord[]> {
  const db = getDb();
  const rows = db.getAllSync<Record<string, unknown>>(
    'SELECT * FROM conflicts WHERE resolved = 0 ORDER BY detected_at DESC',
  );
  return rows.map(rowToConflict);
}

export async function resolveConflict(
  entityId: string,
  entityType: string,
  resolution: ConflictResolution,
): Promise<void> {
  const db = getDb();
  const row = db.getFirstSync<Record<string, unknown>>(
    'SELECT * FROM conflicts WHERE entity_type = ? AND entity_id = ?',
    entityType,
    entityId,
  );
  if (!row) return;

  const conflict = rowToConflict(row);

  const cached = await getCachedEntity(entityType, entityId);
  if (cached) {
    if (resolution === 'server-wins' && conflict.serverData) {
      cached.data = conflict.serverData;
      cached.version = conflict.serverVersion;
      cached.syncStatus = 'synced';
      cached.conflictData = undefined;
      await cacheEntity(cached);
    } else if (resolution === 'client-wins') {
      cached.syncStatus = 'pending';
      cached.conflictData = undefined;
      await cacheEntity(cached);
      await enqueueSync(entityType, entityId, 'update', cached.data, 1);
    } else if (resolution === 'merge' && conflict.serverData) {
      cached.data = { ...conflict.serverData, ...cached.data };
      cached.version = conflict.serverVersion + 1;
      cached.syncStatus = 'pending';
      cached.conflictData = undefined;
      await cacheEntity(cached);
      await enqueueSync(entityType, entityId, 'update', cached.data, 1);
    } else {
      cached.syncStatus = 'pending';
      cached.conflictData = undefined;
      await cacheEntity(cached);
    }
  }

  db.runSync(
    'DELETE FROM conflicts WHERE entity_type = ? AND entity_id = ?',
    entityType,
    entityId,
  );
}

export async function getLastSyncInfo(): Promise<{
  timestamp: number;
  synced: number;
  conflicts: number;
  errors: number;
} | null> {
  const db = getDb();
  const row = db.getFirstSync<{ value: string }>('SELECT value FROM sync_meta WHERE key = ?', 'last_sync');
  if (!row) return null;
  try {
    return JSON.parse(row.value);
  } catch {
    return null;
  }
}

export async function getCacheStats(): Promise<{
  totalEntities: number;
  byType: Record<string, number>;
  pendingSync: number;
  conflicts: number;
  cacheSize: number;
}> {
  const db = getDb();

  const totalRow = db.getFirstSync<{ cnt: number }>('SELECT COUNT(*) as cnt FROM cached_entities');
  const totalEntities = totalRow?.cnt ?? 0;

  const typeRows = db.getAllSync<{ entity_type: string; cnt: number }>(
    'SELECT entity_type, COUNT(*) as cnt FROM cached_entities GROUP BY entity_type',
  );
  const byType: Record<string, number> = {};
  for (const r of typeRows) {
    byType[r.entity_type] = r.cnt;
  }

  const pendingRow = db.getFirstSync<{ cnt: number }>('SELECT COUNT(*) as cnt FROM sync_queue');
  const conflictRow = db.getFirstSync<{ cnt: number }>('SELECT COUNT(*) as cnt FROM conflicts WHERE resolved = 0');

  return {
    totalEntities,
    byType,
    pendingSync: pendingRow?.cnt ?? 0,
    conflicts: conflictRow?.cnt ?? 0,
    cacheSize: totalEntities,
  };
}

function rowToEntity(row: Record<string, unknown>): CachedEntity {
  return {
    id: row.id as string,
    entityType: row.entity_type as string,
    data: JSON.parse(row.data as string),
    version: row.version as number,
    cachedAt: row.cached_at as number,
    lastModifiedAt: row.last_modified_at as number,
    syncStatus: row.sync_status as SyncStatus,
    serverVersion: row.server_version as number | undefined,
    conflictData: row.conflict_data ? JSON.parse(row.conflict_data as string) : undefined,
  };
}

function rowToQueueItem(row: Record<string, unknown>): SyncQueueItem {
  return {
    id: row.id as string,
    entityType: row.entity_type as string,
    entityId: row.entity_id as string,
    operation: row.operation as 'create' | 'update' | 'delete',
    payload: JSON.parse(row.payload as string),
    queuedAt: row.queued_at as number,
    retryCount: row.retry_count as number,
    lastAttemptAt: row.last_attempt_at as number | undefined,
    priority: row.priority as number,
  };
}

function rowToConflict(row: Record<string, unknown>): ConflictRecord {
  return {
    entityId: row.entity_id as string,
    entityType: row.entity_type as string,
    clientData: JSON.parse(row.client_data as string),
    serverData: JSON.parse(row.server_data as string),
    clientVersion: row.client_version as number,
    serverVersion: row.server_version as number,
    detectedAt: row.detected_at as number,
    resolved: (row.resolved as number) === 1,
    resolution: row.resolution as ConflictResolution | undefined,
  };
}
