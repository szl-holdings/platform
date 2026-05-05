/**
 * DB-backed failover chain resolver for HF models.
 *
 * Returns:
 *   null      — Model not in registry; caller may use static HF_TASK_FAILOVERS.
 *   string[]  — Model in registry; DB chain is authoritative (may be empty).
 *   throws    — DB error; propagates so inference fails explicitly rather than
 *               silently reverting to static defaults for a registered model.
 */

import { db, hfModelRegistryTable, hfFailoverChainsTable } from '@szl-holdings/db';
import { eq } from 'drizzle-orm';

export async function resolveHfFailoverChain(modelId: string): Promise<string[] | null> {
  const [entry] = await db
    .select({ failoverChainId: hfModelRegistryTable.failoverChainId })
    .from(hfModelRegistryTable)
    .where(eq(hfModelRegistryTable.modelId, modelId))
    .limit(1);

  if (!entry) {
    return null; // confirmed not in registry → caller may use static defaults
  }

  if (!entry.failoverChainId) {
    return []; // in registry, no chain assigned → no fallbacks (DB authoritative)
  }

  const [chain] = await db
    .select({
      isActive: hfFailoverChainsTable.isActive,
      fallbackModelIds: hfFailoverChainsTable.fallbackModelIds,
    })
    .from(hfFailoverChainsTable)
    .where(eq(hfFailoverChainsTable.id, entry.failoverChainId))
    .limit(1);

  if (!chain) {
    return []; // chain row missing → no fallbacks (DB authoritative)
  }

  if (!chain.isActive) {
    return []; // chain retired by operator → no fallbacks (DB authoritative)
  }

  return (chain.fallbackModelIds as string[]) ?? [];
}
