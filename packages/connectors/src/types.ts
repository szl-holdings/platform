/**
 * @workspace/connectors — typed external-data connector framework.
 *
 * Inspired by Airbyte / Fivetran / Foundry data lineage. Kept lean: every
 * connector is a small TypeScript module that:
 *   - declares a typed config schema (zod)
 *   - declares a typed record schema (zod)
 *   - declares a fetch() that pulls a batch of raw records
 *   - declares a transform() that maps each record to an ontology entity URI
 *
 * The runner is responsible for: scheduling, retry, dead-letter, audit-ledger
 * append, ontology entity registration, and drift detection.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Connector contract
// ---------------------------------------------------------------------------

export const connectorKindSchema = z.enum([
  'real-estate',
  'maritime',
  'sanctions',
  'finance',
  'security',
  'other',
]);
export type ConnectorKind = z.infer<typeof connectorKindSchema>;

export const connectorScheduleSchema = z.object({
  /** Run cadence in seconds. Use 0 for on-demand only. */
  intervalSec: z.number().int().min(0),
  /** Max retries on a transient failure before dead-lettering. */
  maxRetries: z.number().int().min(0).max(10).default(3),
  /** Per-attempt timeout in ms. */
  timeoutMs: z.number().int().min(100).max(120_000).default(15_000),
});
export type ConnectorSchedule = z.infer<typeof connectorScheduleSchema>;

/**
 * A connector implementation. Generic over the typed record shape so the
 * runner gets full type-safety from fetch -> transform -> ontology write.
 */
export interface Connector<TRecord = unknown> {
  /** Stable identifier, used in URLs and audit entries. */
  id: string;
  /** Human-readable name. */
  name: string;
  /** Domain this connector belongs to. */
  kind: ConnectorKind;
  /** Short description of what it pulls. */
  description: string;
  /** External source URL or label (no secrets). */
  source: string;
  /** Default schedule. Operators can override at runtime. */
  schedule: ConnectorSchedule;
  /** Zod schema describing one raw record from the source. */
  recordSchema: z.ZodType<TRecord>;
  /** Pull a batch of records. Implementation may be mock or live. */
  fetch: (ctx: ConnectorContext) => Promise<TRecord[]>;
  /** Transform a record into an ontology-entity registration request. */
  transform: (record: TRecord) => OntologyWrite;
}

/** Context passed into fetch() so connectors can be observed and cancelled. */
export interface ConnectorContext {
  signal: AbortSignal;
  attempt: number;
  /** ISO timestamp of the previous successful sync, if any. */
  lastSyncAt: string | null;
}

/** Ontology write request — what the runner will register against the graph. */
export interface OntologyWrite {
  kind: string;
  namespace: string;
  identifier: string | number;
  properties: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Sync results, drift reports, health snapshots
// ---------------------------------------------------------------------------

export const syncStatusSchema = z.enum(['ok', 'retried', 'dead-letter', 'skipped']);
export type SyncStatus = z.infer<typeof syncStatusSchema>;

export interface SyncResult {
  connectorId: string;
  status: SyncStatus;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  attempts: number;
  recordsFetched: number;
  recordsTransformed: number;
  recordsRejected: number;
  entitiesRegistered: number;
  ledgerEventId: string | null;
  drift: DriftReport | null;
  errorMessage: string | null;
}

export interface DriftReport {
  connectorId: string;
  baselineRecordCount: number | null;
  currentRecordCount: number;
  /** Volume drift = |current - baseline| / baseline. */
  volumeDrift: number;
  /** Schema drift = number of fields added or removed since baseline. */
  schemaDrift: number;
  addedFields: string[];
  removedFields: string[];
  severity: 'none' | 'info' | 'warn' | 'critical';
  threshold: {
    volumeWarn: number;
    volumeCritical: number;
  };
}

export interface ConnectorHealth {
  connectorId: string;
  name: string;
  kind: ConnectorKind;
  source: string;
  enabled: boolean;
  scheduleSec: number;
  lastSyncAt: string | null;
  lastStatus: SyncStatus | null;
  lastDuration: number | null;
  consecutiveFailures: number;
  totalSyncs: number;
  totalEntities: number;
  drift: DriftReport | null;
  deadLettered: number;
}
