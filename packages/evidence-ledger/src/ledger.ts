/**
 * AEEP Evidence Ledger
 *
 * Append-only ledger of LedgerEntry records.
 * Entries are immutable once written. Any mutation attempt throws.
 *
 * Each entry carries a ProofEnvelope with:
 *  - traceId
 *  - Source citations
 *  - Tool call records
 *  - Confidence and freshness scores
 *  - Policy verdict
 *
 * Storage backends:
 *  - EvidenceLedger (in-memory, for use in tests or as a component of a store)
 *  - InMemoryEvidenceLedgerStore (array-backed; entries lost on restart)
 *  - PostgresEvidenceLedgerStore (Postgres-backed; durable across restarts)
 *  - MutableEvidenceLedgerStore (swappable backend; activate Postgres at startup)
 *  - defaultEvidenceLedgerStore (singleton; defaults to in-memory, swap to Postgres at startup)
 */
import type {
  ConfidenceLevel,
  FreshnessLevel,
  LedgerEntry,
  ProofEnvelope,
} from '@szl-holdings/shared-contracts';

export interface LedgerAppendOptions {
  entityType: string;
  entityId: string;
  action: string;
  actor?: string;
  actorRole?: string;
  envelope: Omit<ProofEnvelope, 'generatedAt'>;
}

let _entryCounter = 0;

function generateEntryId(): string {
  return `le_${Date.now()}_${(++_entryCounter).toString().padStart(6, '0')}`;
}

/**
 * Hook for observing durable-backend persistence failures during
 * EvidenceLedger.append fan-out. Defaults to console.error, which is
 * structured-log-friendly. Production callers should replace it with a
 * metrics/alerting emitter via setLedgerPersistFailureHandler so that
 * silent durability loss is impossible.
 */
export type LedgerPersistFailureHandler = (entry: LedgerEntry, error: unknown) => void;

let _persistFailureHandler: LedgerPersistFailureHandler = (entry, error) => {
  const payload = JSON.stringify({
    level: 'error',
    component: 'evidence-ledger',
    event: 'persistence_failure',
    entryId: entry.entryId,
    traceId: entry.traceId,
    entityType: entry.entityType,
    entityId: entry.entityId,
    action: entry.action,
    error: error instanceof Error ? { name: error.name, message: error.message } : String(error),
  });
  const proc = (globalThis as { process?: { stderr?: { write: (s: string) => void } } }).process;
  proc?.stderr?.write?.(payload + '\n');
};

export function setLedgerPersistFailureHandler(handler: LedgerPersistFailureHandler): void {
  _persistFailureHandler = handler;
}

function reportPersistFailure(entry: LedgerEntry, error: unknown): void {
  try {
    _persistFailureHandler(entry, error);
  } catch {
    // Handler must never throw back into append's synchronous path.
  }
}

export class EvidenceLedger {
  private readonly entries: LedgerEntry[] = [];

  /**
   * Append a new immutable ledger entry. Also fans the entry out to the
   * configured durable backend; persistence failures are surfaced via the
   * onPersistFailure hook (see setLedgerPersistFailureHandler).
   */
  append(options: LedgerAppendOptions): LedgerEntry {
    const entry: LedgerEntry = Object.freeze({
      entryId: generateEntryId(),
      traceId: options.envelope.traceId,
      entityType: options.entityType,
      entityId: options.entityId,
      action: options.action,
      ...(options.actor !== undefined ? { actor: options.actor } : {}),
      ...(options.actorRole !== undefined ? { actorRole: options.actorRole } : {}),
      envelope: Object.freeze({
        ...options.envelope,
        generatedAt: new Date().toISOString(),
      }),
      immutable: true as const,
      timestamp: new Date().toISOString(),
    });

    this.entries.push(entry);
    try {
      const result = defaultEvidenceLedgerStore.save(entry);
      if (result instanceof Promise) {
        result.catch((err) => reportPersistFailure(entry, err));
      }
    } catch (err) {
      reportPersistFailure(entry, err);
    }
    return entry;
  }

  /**
   * Query entries by entity.
   */
  getByEntity(entityType: string, entityId: string): LedgerEntry[] {
    return this.entries.filter((e) => e.entityType === entityType && e.entityId === entityId);
  }

  /**
   * Query entries by traceId.
   */
  getByTrace(traceId: string): LedgerEntry[] {
    return this.entries.filter((e) => e.traceId === traceId);
  }

  /**
   * Query entries by workflow run.
   */
  getByWorkflowRun(workflowRunId: string): LedgerEntry[] {
    return this.entries.filter((e) => e.envelope.workflowRunId === workflowRunId);
  }

  /**
   * Return all entries (read-only view).
   */
  getAll(): readonly LedgerEntry[] {
    return this.entries;
  }

  /**
   * Compile an EvidencePackage from a set of entries.
   */
  compilePackage(
    entries: LedgerEntry[],
    options?: { title?: string; generatedBy?: string; workflowRunId?: string },
  ) {
    const allSources = entries.flatMap((e) => e.envelope.sources);
    const confidences = entries.map((e) => e.envelope.confidence);

    const overallConfidence = resolveOverallConfidence(confidences);
    const freshnesses = entries.map((e) => e.envelope.freshness);
    const overallFreshness = resolveOverallFreshness(freshnesses);

    return {
      packageId: `pkg_${Date.now()}`,
      title: options?.title,
      entries,
      overallConfidence,
      overallFreshness,
      generatedAt: new Date().toISOString(),
      generatedBy: options?.generatedBy,
      workflowRunId: options?.workflowRunId,
    };
  }
}

function resolveOverallConfidence(levels: ConfidenceLevel[]): ConfidenceLevel {
  if (levels.includes('contradiction')) return 'contradiction';
  if (levels.every((l) => l === 'high')) return 'high';
  if (levels.includes('low')) return 'low';
  return 'medium';
}

function resolveOverallFreshness(levels: FreshnessLevel[]): FreshnessLevel {
  if (levels.includes('stale')) return 'stale';
  if (levels.every((l) => l === 'fresh')) return 'fresh';
  if (levels.includes('aging')) return 'aging';
  return 'unknown';
}

// ─── Durable store infrastructure ────────────────────────────────────────────

/**
 * Durable store interface for evidence ledger entries.
 * Implementations must guarantee append-only semantics (no updates, no deletes).
 */
export interface EvidenceLedgerStore {
  save(entry: LedgerEntry): Promise<void> | void;
  getByTrace(traceId: string): Promise<LedgerEntry[]> | LedgerEntry[];
  getByEntity(entityType: string, entityId: string): Promise<LedgerEntry[]> | LedgerEntry[];
  getByWorkflowRun(workflowRunId: string): Promise<LedgerEntry[]> | LedgerEntry[];
  list(filter?: { limit?: number; offset?: number }): Promise<LedgerEntry[]> | LedgerEntry[];
  count(): Promise<number> | number;
}

/**
 * In-memory implementation — suitable for tests and development.
 * Entries are lost when the process restarts.
 */
export class InMemoryEvidenceLedgerStore implements EvidenceLedgerStore {
  private readonly entries: LedgerEntry[] = [];

  save(entry: LedgerEntry): void {
    this.entries.push(entry);
  }

  getByTrace(traceId: string): LedgerEntry[] {
    return this.entries.filter((e) => e.traceId === traceId);
  }

  getByEntity(entityType: string, entityId: string): LedgerEntry[] {
    return this.entries.filter((e) => e.entityType === entityType && e.entityId === entityId);
  }

  getByWorkflowRun(workflowRunId: string): LedgerEntry[] {
    return this.entries.filter((e) => e.envelope.workflowRunId === workflowRunId);
  }

  list(filter?: { limit?: number; offset?: number }): LedgerEntry[] {
    const offset = filter?.offset ?? 0;
    const limit = filter?.limit ?? 100;
    return this.entries.slice(offset, offset + limit);
  }

  count(): number {
    return this.entries.length;
  }
}

/**
 * Postgres-backed implementation for production use.
 *
 * Persists each evidence entry as a JSONB row in the `evidence_ledger_entries`
 * table. The table is created if it doesn't exist via the `ensureTable()` call
 * which must be awaited before first use (typically at server startup).
 *
 * Requires a `pool` compatible with `node-postgres` (pg) Pool or Client.
 *
 * Usage:
 * ```typescript
 * import { Pool } from 'pg';
 * import { PostgresEvidenceLedgerStore } from '@workspace/evidence-ledger';
 *
 * const store = new PostgresEvidenceLedgerStore(pool);
 * await store.ensureTable();
 * defaultEvidenceLedgerStore.setBackend(store);
 * ```
 */
export class PostgresEvidenceLedgerStore implements EvidenceLedgerStore {
  private readonly pool: { query: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }> };

  constructor(pool: { query: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }> }) {
    this.pool = pool;
  }

  /**
   * Create the evidence ledger table if it does not exist.
   * Safe to call on every server startup (idempotent).
   */
  async ensureTable(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS evidence_ledger_entries (
        entry_id      TEXT PRIMARY KEY,
        trace_id      TEXT NOT NULL,
        entity_type   TEXT NOT NULL,
        entity_id     TEXT NOT NULL,
        workflow_run_id TEXT,
        action        TEXT NOT NULL,
        actor         TEXT,
        actor_role    TEXT,
        payload       JSONB NOT NULL,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_evidence_ledger_trace_id
        ON evidence_ledger_entries(trace_id);
      CREATE INDEX IF NOT EXISTS idx_evidence_ledger_entity
        ON evidence_ledger_entries(entity_type, entity_id);
      CREATE INDEX IF NOT EXISTS idx_evidence_ledger_workflow_run
        ON evidence_ledger_entries(workflow_run_id)
        WHERE workflow_run_id IS NOT NULL;
    `);
  }

  async save(entry: LedgerEntry): Promise<void> {
    await this.pool.query(
      `INSERT INTO evidence_ledger_entries
         (entry_id, trace_id, entity_type, entity_id, workflow_run_id, action, actor, actor_role, payload, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       ON CONFLICT (entry_id) DO NOTHING`,
      [
        entry.entryId,
        entry.traceId,
        entry.entityType,
        entry.entityId,
        entry.envelope.workflowRunId ?? null,
        entry.action,
        (entry as { actor?: string }).actor ?? null,
        (entry as { actorRole?: string }).actorRole ?? null,
        JSON.stringify(entry),
      ],
    );
  }

  async getByTrace(traceId: string): Promise<LedgerEntry[]> {
    const result = await this.pool.query(
      `SELECT payload FROM evidence_ledger_entries WHERE trace_id = $1 ORDER BY created_at ASC`,
      [traceId],
    );
    return (result.rows as { payload: LedgerEntry }[]).map((r) => r.payload);
  }

  async getByEntity(entityType: string, entityId: string): Promise<LedgerEntry[]> {
    const result = await this.pool.query(
      `SELECT payload FROM evidence_ledger_entries WHERE entity_type = $1 AND entity_id = $2 ORDER BY created_at ASC`,
      [entityType, entityId],
    );
    return (result.rows as { payload: LedgerEntry }[]).map((r) => r.payload);
  }

  async getByWorkflowRun(workflowRunId: string): Promise<LedgerEntry[]> {
    const result = await this.pool.query(
      `SELECT payload FROM evidence_ledger_entries WHERE workflow_run_id = $1 ORDER BY created_at ASC`,
      [workflowRunId],
    );
    return (result.rows as { payload: LedgerEntry }[]).map((r) => r.payload);
  }

  async list(filter?: { limit?: number; offset?: number }): Promise<LedgerEntry[]> {
    const limit = filter?.limit ?? 100;
    const offset = filter?.offset ?? 0;
    const result = await this.pool.query(
      `SELECT payload FROM evidence_ledger_entries ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    return (result.rows as { payload: LedgerEntry }[]).map((r) => r.payload);
  }

  async count(): Promise<number> {
    const result = await this.pool.query(`SELECT COUNT(*)::int AS n FROM evidence_ledger_entries`);
    return ((result.rows[0] as { n: number }) ?? { n: 0 }).n;
  }
}

/**
 * Swappable-backend evidence ledger store.
 * Defaults to in-memory; swap to Postgres at server startup.
 *
 * @example
 * ```typescript
 * // In api-server startup:
 * import { defaultEvidenceLedgerStore, PostgresEvidenceLedgerStore } from '@workspace/evidence-ledger';
 * const pgStore = new PostgresEvidenceLedgerStore(pool);
 * await pgStore.ensureTable();
 * defaultEvidenceLedgerStore.setBackend(pgStore);
 * ```
 */
export class MutableEvidenceLedgerStore implements EvidenceLedgerStore {
  private backend: EvidenceLedgerStore;

  constructor(initial: EvidenceLedgerStore = new InMemoryEvidenceLedgerStore()) {
    this.backend = initial;
  }

  setBackend(store: EvidenceLedgerStore): void {
    this.backend = store;
  }

  getBackend(): EvidenceLedgerStore {
    return this.backend;
  }

  save(entry: LedgerEntry): Promise<void> | void {
    return this.backend.save(entry);
  }

  getByTrace(traceId: string): Promise<LedgerEntry[]> | LedgerEntry[] {
    return this.backend.getByTrace(traceId);
  }

  getByEntity(entityType: string, entityId: string): Promise<LedgerEntry[]> | LedgerEntry[] {
    return this.backend.getByEntity(entityType, entityId);
  }

  getByWorkflowRun(workflowRunId: string): Promise<LedgerEntry[]> | LedgerEntry[] {
    return this.backend.getByWorkflowRun(workflowRunId);
  }

  list(filter?: { limit?: number; offset?: number }): Promise<LedgerEntry[]> | LedgerEntry[] {
    return this.backend.list(filter);
  }

  count(): Promise<number> | number {
    return this.backend.count();
  }
}

/**
 * Default evidence ledger store singleton.
 *
 * Starts with an in-memory backend. In production, swap to Postgres at startup:
 * ```typescript
 * import { defaultEvidenceLedgerStore, PostgresEvidenceLedgerStore } from '@workspace/evidence-ledger';
 * defaultEvidenceLedgerStore.setBackend(new PostgresEvidenceLedgerStore(pool));
 * ```
 */
export const defaultEvidenceLedgerStore = new MutableEvidenceLedgerStore();
