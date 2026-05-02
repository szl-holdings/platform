import { beforeAll, vi } from 'vitest';

beforeAll(() => {
  process.env.AEF_GATEWAY_URL = process.env.AEF_GATEWAY_URL ?? 'http://aef.test.local';
  process.env.AEF_API_KEY = process.env.AEF_API_KEY ?? 'test-key';
  process.env.AEF_TENANT_ID = process.env.AEF_TENANT_ID ?? 'szl-holdings';
  // lib/db throws at module-load if DATABASE_URL is unset. The tool-mesh
  // unit tests mock @szl-holdings/db end-to-end (see vi.mock below) so the
  // value is never used to dial a real connection — it just needs to satisfy
  // the env-validation schema.
  process.env.DATABASE_URL =
    process.env.DATABASE_URL ?? 'postgres://test-stub:test-stub@127.0.0.1:5432/test-stub';
  process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
});

vi.mock('@workspace/aef-sdk/client', () => {
  class MockAefClient {
    async hybridSearch(req: { requestId?: string; query: string; profileId?: string }) {
      return {
        requestId: req.requestId ?? 'mock-req',
        tenantId: 'szl-holdings',
        profileId: req.profileId,
        traceId: 'mock-trace',
        retrievalPath: ['mock'],
        hits: [
          {
            documentId: 'mock-doc-1',
            chunkId: 'mock-chunk-1',
            text: `mock retrieval result for ${req.query}`,
            fusedScore: 0.9,
            finalScore: 0.9,
            boostApplied: false,
            metadata: {},
          },
        ],
        totalCandidates: 1,
        processingMs: 1,
      };
    }
  }
  return { AefClient: MockAefClient };
});

// ── Mock @szl-holdings/db ─────────────────────────────────────────────────
// The tool-mesh handlers in src/tools/{security,finance,operations}-tools.ts
// dynamically import @szl-holdings/db at runtime (via `await import(...)`).
// That module reads DATABASE_URL via getEnv() and constructs a pg Pool at
// module-load. While DATABASE_URL is now stubbed above so the env validator
// passes, we still want the unit tests to be hermetic — they should NOT
// open a real pg.Pool, NOT attempt any TCP connection, and NOT depend on
// drizzle's query builder semantics. The handlers are pre-MVP stubs that
// return canonical shapes regardless of DB content; the tests only assert
// on those shapes, so a no-op chainable proxy is sufficient.
//
// The mock returns:
//   - `db`: a chainable proxy where every method returns the proxy itself,
//     except terminals (Promise-shaped: `then`/`catch`/`finally`) which
//     resolve to an empty array. This makes `db.select().from(t).where(...)
//     .orderBy(...).limit(N)` resolve to [] and `db.insert(t).values({...})`
//     resolve to undefined — both compatible with handler bodies that just
//     map over the result or ignore it.
//   - any drizzle schema table symbol (advisoryFindings, treasuryAccountsTable,
//     etc.) destructured from the import: a plain proxy stub. Drizzle's
//     `eq(table.col, val)` and similar SQL builders are also mocked through
//     drizzle-orm below.
vi.mock('@szl-holdings/db', () => {
  // Chainable thenable: every property access returns the chain itself, but
  // `then`/`catch`/`finally` resolve the chain to an empty array. This makes
  // both `await db.select().from(t).where(...).orderBy(...).limit(N)` and
  // `await db.insert(t).values({...})` work — the former awaits to [], the
  // latter awaits to [] (handlers ignore the insert return value).
  const makeChain = () => {
    const chain: unknown = new Proxy(() => {}, {
      get(_t, prop) {
        if (prop === 'then')
          return (resolve: (v: unknown[]) => unknown) => Promise.resolve([]).then(resolve);
        if (prop === 'catch') return () => chain;
        if (prop === 'finally') return () => chain;
        if (prop === Symbol.iterator) return undefined;
        if (prop === Symbol.asyncIterator) return undefined;
        if (prop === Symbol.toPrimitive) return () => '[mock-db-chain]';
        if (prop === '__esModule') return undefined;
        return chain;
      },
      apply() {
        return chain;
      },
    });
    return chain;
  };

  const makeTable = (name: string): unknown =>
    new Proxy(
      {},
      {
        get(_t, prop) {
          if (prop === Symbol.toPrimitive) return () => `[mock-table:${name}]`;
          if (prop === 'toString') return () => `[mock-table:${name}]`;
          // Column access (table.id, table.severity, ...) → another proxy so
          // drizzle's operator builders (eq, desc, …) accept it without
          // throwing. The chain mock short-circuits before any SQL is run.
          return makeTable(`${name}.${String(prop)}`);
        },
      },
    );

  // vi.mock validates that every name destructured from the import exists on
  // the returned object — Proxies are NOT consulted, so we must enumerate
  // every table symbol the tool-mesh handlers destructure. Audit:
  //   $ grep -hoE "\{ db, [^}]+ \}" packages/tool-mesh/src/tools/*.ts
  return {
    db: makeChain(),
    advisoryFindings: makeTable('advisoryFindings'),
    agentUsageStats: makeTable('agentUsageStats'),
    certificationStatusTable: makeTable('certificationStatusTable'),
    clientAccountsTable: makeTable('clientAccountsTable'),
    complianceCalendarTable: makeTable('complianceCalendarTable'),
    fundLpReportsTable: makeTable('fundLpReportsTable'),
    fundPortfolioFinancialsTable: makeTable('fundPortfolioFinancialsTable'),
    maritimeVesselsTable: makeTable('maritimeVesselsTable'),
    platformJobRunsTable: makeTable('platformJobRunsTable'),
    terraDealsTable: makeTable('terraDealsTable'),
    terraPropertiesTable: makeTable('terraPropertiesTable'),
    treasuryAccountsTable: makeTable('treasuryAccountsTable'),
    treasuryBalanceSnapshotsTable: makeTable('treasuryBalanceSnapshotsTable'),
    treasuryTransactionsTable: makeTable('treasuryTransactionsTable'),
    vesselsPositionsTable: makeTable('vesselsPositionsTable'),
  };
});

// drizzle-orm's `eq`, `desc`, `and`, etc. are pure SQL-builder functions; the
// tool-mesh handlers pass them values from the mocked tableProxy above. The
// real implementations would happily build a SQL fragment from those proxies,
// but we never execute that fragment (the chain mock short-circuits to []),
// so leaving drizzle-orm un-mocked is fine. We only mock here if needed in
// the future. No-op for now.
