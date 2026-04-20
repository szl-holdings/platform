import type { EvidenceEntry } from "./types.js";
import type { LedgerStore } from "./store.js";

export function queryByRequestId(store: LedgerStore, requestId: string): EvidenceEntry[] {
  return store.query({ requestId });
}

export function queryByTenant(
  store: LedgerStore,
  tenantId: string,
  options: { limit?: number; offset?: number } = {},
): EvidenceEntry[] {
  return store.query({ tenantId, ...options });
}

export function queryByTimeRange(
  store: LedgerStore,
  after: string,
  before: string,
  options: { tenantId?: string; limit?: number } = {},
): EvidenceEntry[] {
  const { tenantId, limit } = options;
  return store.query({
    after,
    before,
    ...(tenantId !== undefined ? { tenantId } : {}),
    ...(limit !== undefined ? { limit } : {}),
  });
}

export function queryDenied(
  store: LedgerStore,
  tenantId?: string,
  options: { limit?: number } = {},
): EvidenceEntry[] {
  const { limit } = options;
  return store.query({
    policyAllow: false,
    ...(tenantId !== undefined ? { tenantId } : {}),
    ...(limit !== undefined ? { limit } : {}),
  });
}

export function replayRequest(store: LedgerStore, requestId: string): EvidenceEntry[] {
  const entries = queryByRequestId(store, requestId);
  return entries.sort((a, b) => a.requestedAt.localeCompare(b.requestedAt));
}
