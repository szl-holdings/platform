import { Router } from 'express';
import { extractTenantId } from '../services/tenant-trust-registry';

const router = Router();

export interface OfflineSyncPayload {
  operations: Array<{
    entityType: string;
    entityId: string;
    operation: 'create' | 'update' | 'delete';
    payload: Record<string, unknown>;
    clientVersion: number;
  }>;
  deviceId: string;
  syncToken?: string;
}

export interface OfflineSyncResponse {
  results: Array<{
    entityId: string;
    entityType: string;
    success: boolean;
    serverVersion?: number;
    conflict?: {
      serverData: Record<string, unknown>;
      serverVersion: number;
    };
    error?: string;
  }>;
  syncToken: string;
  serverTimestamp: number;
}

interface StoredEntity {
  data: Record<string, unknown>;
  version: number;
  lastModified: number;
  deleted?: boolean;
}

const VALID_OPERATIONS = ['create', 'update', 'delete'] as const;

const _tenantEntityStore = new Map<string, Map<string, StoredEntity>>();

function getStoreForTenant(tenantId: string): Map<string, StoredEntity> {
  let store = _tenantEntityStore.get(tenantId);
  if (!store) {
    store = new Map();
    _tenantEntityStore.set(tenantId, store);
  }
  return store;
}

function validateSyncPayload(body: unknown): { valid: true; payload: OfflineSyncPayload } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body is required' };
  }

  const b = body as Record<string, unknown>;
  if (!Array.isArray(b.operations)) {
    return { valid: false, error: '"operations" is required and must be an array' };
  }

  if (typeof b.deviceId !== 'string' || !b.deviceId.trim()) {
    return { valid: false, error: '"deviceId" is required and must be a non-empty string' };
  }

  for (let i = 0; i < b.operations.length; i++) {
    const op = b.operations[i] as Record<string, unknown>;
    if (typeof op.entityType !== 'string' || !op.entityType.trim()) {
      return { valid: false, error: `operations[${i}].entityType is required and must be a non-empty string` };
    }
    if (typeof op.entityId !== 'string' || !op.entityId.trim()) {
      return { valid: false, error: `operations[${i}].entityId is required and must be a non-empty string` };
    }
    if (!VALID_OPERATIONS.includes(op.operation as typeof VALID_OPERATIONS[number])) {
      return { valid: false, error: `operations[${i}].operation must be one of: ${VALID_OPERATIONS.join(', ')}` };
    }
    if (typeof op.clientVersion !== 'number' || op.clientVersion < 0) {
      return { valid: false, error: `operations[${i}].clientVersion must be a non-negative number` };
    }
  }

  return { valid: true, payload: body as OfflineSyncPayload };
}

router.post('/offline-sync', (req, res) => {
  const validation = validateSyncPayload(req.body);
  if (!validation.valid) {
    res.status(400).json({ error: validation.error });
    return;
  }

  const tenantId = extractTenantId(req as Record<string, unknown>);
  const store = getStoreForTenant(tenantId);
  const body = validation.payload;
  const results: OfflineSyncResponse['results'] = [];
  const now = Date.now();

  for (const op of body.operations) {
    const storeKey = `${op.entityType}:${op.entityId}`;
    const existing = store.get(storeKey);

    if (op.operation === 'create') {
      if (existing && !existing.deleted) {
        results.push({
          entityId: op.entityId,
          entityType: op.entityType,
          success: false,
          conflict: {
            serverData: existing.data,
            serverVersion: existing.version,
          },
        });
      } else {
        store.set(storeKey, { data: op.payload, version: 1, lastModified: now });
        results.push({
          entityId: op.entityId,
          entityType: op.entityType,
          success: true,
          serverVersion: 1,
        });
      }
    } else if (op.operation === 'update') {
      if (existing && existing.version > op.clientVersion) {
        results.push({
          entityId: op.entityId,
          entityType: op.entityType,
          success: false,
          conflict: {
            serverData: existing.data,
            serverVersion: existing.version,
          },
        });
      } else {
        const newVersion = (existing?.version ?? 0) + 1;
        store.set(storeKey, { data: op.payload, version: newVersion, lastModified: now });
        results.push({
          entityId: op.entityId,
          entityType: op.entityType,
          success: true,
          serverVersion: newVersion,
        });
      }
    } else if (op.operation === 'delete') {
      if (existing) {
        store.set(storeKey, {
          data: existing.data,
          version: existing.version + 1,
          lastModified: now,
          deleted: true,
        });
      }
      results.push({
        entityId: op.entityId,
        entityType: op.entityType,
        success: true,
      });
    }
  }

  const response: OfflineSyncResponse = {
    results,
    syncToken: `sync-${now}-${Math.random().toString(36).slice(2, 8)}`,
    serverTimestamp: now,
  };

  res.json(response);
});

router.post('/offline-sync/pull', (req, res) => {
  const { entityTypes, since } = req.body as {
    entityTypes?: unknown;
    since?: unknown;
  };

  if (!Array.isArray(entityTypes) || entityTypes.length === 0) {
    res.status(400).json({ error: '"entityTypes" is required and must be a non-empty array of strings' });
    return;
  }
  if (since !== undefined && typeof since !== 'number') {
    res.status(400).json({ error: '"since" must be a number (unix timestamp in ms)' });
    return;
  }

  const tenantId = extractTenantId(req as Record<string, unknown>);
  const store = getStoreForTenant(tenantId);

  const entities: Array<{
    entityType: string;
    entityId: string;
    data: Record<string, unknown>;
    version: number;
    deleted?: boolean;
  }> = [];

  const sinceMs = (since as number | undefined) ?? 0;

  for (const [key, value] of store.entries()) {
    if (value.lastModified <= sinceMs) continue;

    const parts = key.split(':');
    const entityType = parts[0]!;
    const entityId = parts.slice(1).join(':');
    if ((entityTypes as string[]).includes(entityType)) {
      entities.push({
        entityType,
        entityId,
        data: value.data,
        version: value.version,
        ...(value.deleted ? { deleted: true } : {}),
      });
    }
  }

  const now = Date.now();
  res.json({
    entities,
    syncToken: `sync-${now}`,
    serverTimestamp: now,
  });
});

router.get('/offline-sync/status', (req, res) => {
  const tenantId = extractTenantId(req as Record<string, unknown>);
  const store = getStoreForTenant(tenantId);
  res.json({
    storeSize: store.size,
    serverTimestamp: Date.now(),
    healthy: true,
  });
});

export default router;
