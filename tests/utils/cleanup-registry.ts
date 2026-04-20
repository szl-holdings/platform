/**
 * Shared test-record cleanup registry for smoke / integration tests.
 *
 * POST tests call `registerCleanup()` immediately after creating a record.
 * The test suite calls `flushCleanup()` inside an `afterEach` (or `afterAll`)
 * hook.  All pending deletes are executed in a single DB transaction;
 * the registry is only cleared after the transaction commits successfully.
 * Import failures and transaction failures are thrown — not swallowed — so
 * cleanup failures cause test runs to surface the problem explicitly.
 */

type TableName = 'vesselsFleetsTable' | 'carlotaInquiriesTable';

/** De-duplicated set of records waiting for deletion, keyed as "table:id". */
const _pending = new Set<string>();

function makeKey(table: TableName, id: number): string {
  return `${table}:${id}`;
}

function parseKey(key: string): { table: TableName; id: number } {
  const sep = key.indexOf(':');
  return { table: key.slice(0, sep) as TableName, id: parseInt(key.slice(sep + 1), 10) };
}

/**
 * Register a DB record for deletion during the next `flushCleanup()` call.
 * Idempotent — duplicate (table, id) pairs are silently deduplicated.
 * If `id` is falsy the entry is ignored.
 */
export function registerCleanup(entry: { table: TableName; id: number }): void {
  if (!entry.id) return;
  _pending.add(makeKey(entry.table, entry.id));
}

/**
 * Delete every registered record inside a single DB transaction, then clear
 * the registry.  The registry is NOT modified until the transaction commits,
 * so a transient failure leaves entries in place for the next flush attempt.
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
        throw new Error(`[cleanup-registry] Unknown table "${tableName}" — add it to TableName`);
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
