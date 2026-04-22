/**
 * AEEP v1 Memory Routes
 *
 * All memory operations are tenant-isolated: each tenant has its own
 * InMemoryStore instance, so keys from one tenant are never accessible
 * to another (no key-prefix collisions, no cross-tenant reads).
 *
 * POST   /v1/memory/write       — write an entry to the tenant's memory fabric
 * POST   /v1/memory/query       — query entries by scope + optional key prefix
 * DELETE /v1/memory/evict-stale — evict expired entries for the current tenant
 */

import type { MemoryScope } from '@szl-holdings/shared-contracts';
import { type Request, type Response, type IRouter, Router } from 'express';
import { z } from 'zod';
import { getMemoryStore } from '../../store.js';

const router: IRouter = Router();

export const VALID_SCOPES: MemoryScope[] = ['working', 'episodic', 'semantic', 'governance'];

const WriteSchema = z.object({
  scope: z.enum(['working', 'episodic', 'semantic', 'governance']),
  key: z.string().min(1),
  value: z.unknown(),
  agentRole: z.string().optional(),
  workflowRunId: z.string().optional(),
  traceId: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

const QuerySchema = z.object({
  scope: z.enum(['working', 'episodic', 'semantic', 'governance']),
  keyPrefix: z.string().optional(),
  limit: z.number().int().positive().optional(),
});

function tenantId(req: Request): string {
  return req.tenantCtx?.tenantId ?? 'default';
}

router.post('/write', (req: Request, res: Response): void => {
  const parse = WriteSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'Validation failed', issues: parse.error.issues });
    return;
  }

  const { scope, key, value, agentRole, workflowRunId, traceId, expiresAt } = parse.data;
  const tid = tenantId(req);
  const memoryStore = getMemoryStore(tid);

  const memoryId = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  memoryStore.set({
    memoryId,
    scope,
    key,
    value,
    createdAt: new Date().toISOString(),
    ...(agentRole !== undefined ? { agentRole } : {}),
    ...(workflowRunId !== undefined ? { workflowRunId } : {}),
    ...(traceId !== undefined ? { traceId } : {}),
    ...(expiresAt !== undefined ? { expiresAt } : {}),
  });

  res.status(201).json({ ok: true, scope, key, tenantId: tid });
});

router.post('/query', (req: Request, res: Response): void => {
  const parse = QuerySchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'Validation failed', issues: parse.error.issues });
    return;
  }

  const { scope, keyPrefix, limit } = parse.data;
  const tid = tenantId(req);
  const memoryStore = getMemoryStore(tid);

  let keys = memoryStore.keys(scope);

  if (keyPrefix) {
    keys = keys.filter((k) => k.startsWith(keyPrefix));
  }
  if (limit != null) {
    keys = keys.slice(0, limit);
  }

  const entries = keys.map((k) => memoryStore.get(scope, k)).filter((e) => e !== undefined);

  res.status(200).json({ scope, tenantId: tid, count: entries.length, entries });
});

router.delete('/evict-stale', (req: Request, res: Response): void => {
  const tid = tenantId(req);
  const memoryStore = getMemoryStore(tid);
  const evicted = memoryStore.expireStale();
  res.status(200).json({ ok: true, evicted, tenantId: tid });
});

export default router;
