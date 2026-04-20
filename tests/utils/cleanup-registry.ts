/**
 * Shared test-record cleanup registry for smoke / integration tests.
 *
 * POST tests call `registerCleanup()` immediately after creating a record.
 * The test suite calls `flushCleanup()` inside an `afterEach` (or `afterAll`)
 * hook.  All pending deletes are executed in a single DB transaction;
 * the registry is only cleared after the transaction commits successfully.
 * Import failures and transaction failures are thrown — not swallowed — so
 * cleanup failures cause test runs to surface the problem explicitly.
 *
 * Text-ID tables (e.g. pcGcMattersTable whose PK is a text string like
 * "M-2024-00123") use `registerTextCleanup()` and `flushTextCleanup()`.
 * Both registries are flushed by `flushAllCleanup()`.
 */

type IntTableName =
  | 'vesselsFleetsTable'
  | 'carlotaInquiriesTable'
  | 'firestormFindingsTable'
  | 'firestormAssessmentsTable'
  | 'holdingsVenturesTable'
  | 'vesselsAlertRulesTable';

type TextTableName = 'pcGcMattersTable';

/** De-duplicated set of records waiting for deletion, keyed as "table:id". */
const _pending = new Set<string>();
const _pendingText = new Set<string>();

function makeKey(table: IntTableName, id: number): string {
  return `${table}:${id}`;
}

function parseKey(key: string): { table: IntTableName; id: number } {
  const sep = key.indexOf(':');
  return { table: key.slice(0, sep) as IntTableName, id: parseInt(key.slice(sep + 1), 10) };
}

function makeTextKey(table: TextTableName, id: string): string {
  return `${table}:${id}`;
}

function parseTextKey(key: string): { table: TextTableName; id: string } {
  const sep = key.indexOf(':');
  return { table: key.slice(0, sep) as TextTableName, id: key.slice(sep + 1) };
}

/**
 * Register a DB record for deletion during the next `flushCleanup()` call.
 * Idempotent — duplicate (table, id) pairs are silently deduplicated.
 * If `id` is falsy the entry is ignored.
 */
export function registerCleanup(entry: { table: IntTableName; id: number }): void {
  if (!entry.id) return;
  _pending.add(makeKey(entry.table, entry.id));
}

/**
 * Register a DB record with a text primary key for deletion.
 * Idempotent — duplicate (table, id) pairs are silently deduplicated.
 * If `id` is empty the entry is ignored.
 */
export function registerTextCleanup(entry: { table: TextTableName; id: string }): void {
  if (!entry.id) return;
  _pendingText.add(makeTextKey(entry.table, entry.id));
}

/**
 * Delete every registered integer-ID record inside a single DB transaction,
 * then clear the registry.  The registry is NOT modified until the transaction
 * commits, so a transient failure leaves entries in place for the next flush.
 *
 * Throws if imports fail or the transaction is rolled back, causing the
 * surrounding test to fail visibly rather than silently leaving orphan rows.
 */
export async function flushCleanup(): Promise<void> {
  if (_pending.size === 0) return;

  const keys = [..._pending]; // snapshot — registry is not cleared until commit

  // These imports throw if the DB module is unavailable; let that propagate.
  const { db } = await import('@szl-holdings/db');
  const schema = (await import('@szl-holdings/db/schema')) as Record<string, unknown>;
  const { eq } = await import('drizzle-orm');

  type TxClient = { delete: (t: unknown) => { where: (c: unknown) => Promise<unknown> } };
  type DbWithTx = { transaction: (fn: (tx: TxClient) => Promise<void>) => Promise<void> };

  // Execute all deletes in one transaction.
  // If any delete throws (or the table is unrecognised), the whole transaction
  // rolls back and the error propagates — the registry stays intact.
  await (db as unknown as DbWithTx).transaction(async (tx) => {
    for (const key of keys) {
      const { table: tableName, id } = parseKey(key);
      const table = schema[tableName];
      if (!table) {
        throw new Error(`[cleanup-registry] Unknown table "${tableName}" — add it to IntTableName`);
      }
      const col = (table as Record<string, unknown>)['id'];
      await tx.delete(table).where(eq(col, id));
    }
  });

  // Only clear the registry once the transaction has committed.
  for (const key of keys) {
    _pending.delete(key);
  }
}

/**
 * Delete every registered text-ID record inside a single DB transaction,
 * then clear the text registry.
 */
export async function flushTextCleanup(): Promise<void> {
  if (_pendingText.size === 0) return;

  const keys = [..._pendingText];

  const { db } = await import('@szl-holdings/db');
  const schema = (await import('@szl-holdings/db/schema')) as Record<string, unknown>;
  const { eq } = await import('drizzle-orm');

  type TxClient = { delete: (t: unknown) => { where: (c: unknown) => Promise<unknown> } };
  type DbWithTx = { transaction: (fn: (tx: TxClient) => Promise<void>) => Promise<void> };

  await (db as unknown as DbWithTx).transaction(async (tx) => {
    for (const key of keys) {
      const { table: tableName, id } = parseTextKey(key);
      const table = schema[tableName];
      if (!table) {
        throw new Error(`[cleanup-registry] Unknown table "${tableName}" — add it to TextTableName`);
      }
      const col = (table as Record<string, unknown>)['id'];
      await tx.delete(table).where(eq(col, id));
    }
  });

  for (const key of keys) {
    _pendingText.delete(key);
  }
}

/**
 * Flush both integer-ID and text-ID registries. Call in afterEach / afterAll.
 */
export async function flushAllCleanup(): Promise<void> {
  await Promise.all([flushCleanup(), flushTextCleanup()]);
}
