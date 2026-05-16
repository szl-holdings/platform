/**
 * Integration test for the inference-gate → Lexicon → reviewer-alert chain.
 *
 * Covers the complete dedup contract that the unit tests do NOT prove:
 *   1. A failing inference gate triggers ONE notification per designated
 *      approver on the first miss for a target.
 *   2. A SECOND miss for the SAME target while a review is still pending
 *      produces ZERO additional notifications (no on-call spam).
 *   3. After the prior review is denied (status flips off "pending"),
 *      a fresh miss against the same target enqueues a new review and
 *      fires a NEW round of notifications — one per approver again.
 *
 * The gate-checker hook installed by `artifacts/api-server/src/app.ts`
 * is rebuilt verbatim here (the production wiring is fire-and-forget
 * `ensureLexiconEntryAndEnqueueReview(...)` on a gate miss) so the test
 * exercises the same wiring the running server uses.
 *
 * The `@szl-holdings/db` module is replaced with an in-memory table-store
 * that implements just enough of the drizzle chainable API for the lexicon
 * routes and the notifications helper (insert/select/update + the small
 * set of operators they use: eq / and / inArray).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { randomUUID } from 'node:crypto';

// ---------------------------------------------------------------------------
// In-memory tables. Module-level so vi.mock factory and tests can reach them.
// ---------------------------------------------------------------------------

type Row = Record<string, unknown>;
const store: Record<string, Row[]> = {
  lexicon_entries: [],
  lexicon_review_requests: [],
  lexicon_decisions: [],
  roles: [],
  user_roles: [],
  users: [],
  notifications: [],
};

function resetStore(): void {
  for (const k of Object.keys(store)) store[k] = [];
}

let idSeq = 1;
function nextNumericId(): number {
  return idSeq++;
}

// ---------------------------------------------------------------------------
// Table sentinels. Each column descriptor carries `__table` / `__col` so the
// fake drizzle operators can resolve a column back to the row property.
// ---------------------------------------------------------------------------

function mkTable<T extends string>(name: T, cols: string[]) {
  const t: Record<string, unknown> = { __name: name };
  for (const c of cols) t[c] = { __table: name, __col: c };
  return t as { __name: T } & Record<string, { __table: T; __col: string }>;
}

const lexiconEntriesTable = mkTable('lexicon_entries', [
  'id',
  'targetId',
  'status',
  'provider',
  'kind',
  'license',
  'description',
  'seeded',
  'metadata',
  'riskFlagged',
  'riskNote',
  'updatedAt',
  'createdAt',
]);
const lexiconReviewRequestsTable = mkTable('lexicon_review_requests', [
  'id',
  'entryId',
  'status',
  'requestedBy',
  'context',
  'createdAt',
  'resolvedAt',
]);
const lexiconDecisionsTable = mkTable('lexicon_decisions', [
  'id',
  'entryId',
  'reviewRequestId',
  'decision',
  'reason',
  'decidedBy',
  'decidedAt',
]);
const rolesTable = mkTable('roles', ['id', 'name']);
const userRolesTable = mkTable('user_roles', ['userId', 'roleId']);
const usersTable = mkTable('users', ['id', 'isActive']);
const notificationsTable = mkTable('notifications', [
  'id',
  'userId',
  'type',
  'channel',
  'title',
  'message',
  'actionUrl',
]);

// ---------------------------------------------------------------------------
// Fake drizzle operator AST.
// ---------------------------------------------------------------------------

type Cond =
  | { __k: 'eq'; l: { __col: string }; r: unknown }
  | { __k: 'and'; parts: Cond[] }
  | { __k: 'inArray'; l: { __col: string }; r: unknown[] };

function compile(cond: Cond | undefined): (row: Row) => boolean {
  if (!cond) return () => true;
  if (cond.__k === 'eq') {
    const col = cond.l.__col;
    return (r) => r[col] === cond.r;
  }
  if (cond.__k === 'and') {
    const preds = cond.parts.map(compile);
    return (r) => preds.every((p) => p(r));
  }
  if (cond.__k === 'inArray') {
    const col = cond.l.__col;
    const set = new Set(cond.r);
    return (r) => set.has(r[col]);
  }
  return () => true;
}

// ---------------------------------------------------------------------------
// Chainable db builder. `.select().from(t).where(c).limit(n).orderBy(...)`
// is a thenable that resolves to filtered rows; projections are applied if
// a column map was passed to `.select({...})`.
// ---------------------------------------------------------------------------

function makeSelect(projection?: Record<string, unknown>) {
  type SelectOps = {
    table: { __name: string } | null;
    filters: Array<(r: Row) => boolean>;
    limit?: number;
  };
  const ops: SelectOps = { table: null, filters: [] };
  const exec = (): Row[] => {
    if (!ops.table) return [];
    let rows = store[ops.table.__name].slice();
    for (const f of ops.filters) rows = rows.filter(f);
    if (ops.limit !== undefined) rows = rows.slice(0, ops.limit);
    if (projection) {
      rows = rows.map((r) => {
        const out: Row = {};
        for (const [k, desc] of Object.entries(projection)) {
          if (desc && typeof desc === 'object' && '__col' in (desc as object)) {
            out[k] = r[(desc as { __col: string }).__col];
          } else {
            out[k] = undefined;
          }
        }
        return out;
      });
    }
    return rows;
  };
  const builder: {
    from: (t: { __name: string }) => typeof builder;
    where: (c: Cond) => typeof builder;
    limit: (n: number) => typeof builder;
    orderBy: () => typeof builder;
    groupBy: () => typeof builder;
    then: <R>(
      resolve: (v: Row[]) => R,
      reject?: (e: unknown) => unknown,
    ) => Promise<R>;
  } = {
    from(t) {
      ops.table = t;
      return builder;
    },
    where(c) {
      ops.filters.push(compile(c));
      return builder;
    },
    limit(n) {
      ops.limit = n;
      return builder;
    },
    orderBy() {
      return builder;
    },
    groupBy() {
      return builder;
    },
    then(resolve, reject) {
      try {
        return Promise.resolve(exec()).then(resolve, reject);
      } catch (err) {
        return Promise.reject(err).then(resolve, reject);
      }
    },
  };
  return builder;
}

const fakeDb = {
  select(projection?: Record<string, unknown>) {
    return makeSelect(projection);
  },
  insert(table: { __name: string }) {
    return {
      values(vals: Row | Row[]) {
        const arr = Array.isArray(vals) ? vals : [vals];
        const stamped = arr.map((v) => {
          const row: Row = { ...v };
          if (row.id === undefined) {
            row.id = table.__name === 'notifications' ? nextNumericId() : randomUUID();
          }
          if (table.__name === 'lexicon_entries' && row.status === undefined) {
            row.status = 'pending_review';
          }
          if (table.__name === 'lexicon_review_requests' && row.status === undefined) {
            row.status = 'pending';
          }
          return row;
        });
        const commit = () => {
          for (const row of stamped) store[table.__name].push(row);
        };
        return {
          onConflictDoNothing() {
            // Conflict key is `targetId` for lexicon_entries; otherwise no-op.
            for (const row of stamped) {
              if (
                table.__name === 'lexicon_entries' &&
                row.targetId !== undefined &&
                store[table.__name].some((r) => r.targetId === row.targetId)
              ) {
                continue;
              }
              store[table.__name].push(row);
            }
            return Promise.resolve();
          },
          returning() {
            commit();
            return Promise.resolve(stamped);
          },
          then<R>(resolve: (v: undefined) => R, reject?: (e: unknown) => unknown) {
            try {
              commit();
              return Promise.resolve(undefined as unknown as undefined).then(resolve, reject);
            } catch (err) {
              return Promise.reject(err).then(resolve, reject);
            }
          },
        };
      },
    };
  },
  update(table: { __name: string }) {
    return {
      set(vals: Row) {
        return {
          where(cond: Cond) {
            const pred = compile(cond);
            for (const row of store[table.__name]) {
              if (pred(row)) Object.assign(row, vals);
            }
            return Promise.resolve();
          },
        };
      },
    };
  },
};

// ---------------------------------------------------------------------------
// Module mocks. Must reference module-level vars only.
// ---------------------------------------------------------------------------

vi.mock('@szl-holdings/db', () => ({
  db: fakeDb,
  lexiconEntriesTable,
  lexiconReviewRequestsTable,
  lexiconDecisionsTable,
  rolesTable,
  userRolesTable,
  usersTable,
  notificationsTable,
  notificationPreferencesTable: mkTable('notification_preferences', ['userId']),
}));

vi.mock('drizzle-orm', () => ({
  and: (...parts: Cond[]) => ({ __k: 'and', parts }) as Cond,
  eq: (l: { __col: string }, r: unknown) => ({ __k: 'eq', l, r }) as Cond,
  inArray: (l: { __col: string }, r: unknown[]) => ({ __k: 'inArray', l, r }) as Cond,
  desc: (col: unknown) => col,
  sql: Object.assign(() => ({}), { raw: () => ({}) }),
}));

vi.mock('../lib/websocket', () => ({
  publish: vi.fn(),
  WS_CHANNELS: { NOTIFICATIONS: 'notifications' },
}));

vi.mock('../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('../routes/notifications', () => ({
  dispatchToExternalChannels: vi.fn(async () => undefined),
}));

vi.mock('../services/orchestration-store', () => ({
  addProductCapability: vi.fn(),
  appendProof: vi.fn(),
}));

vi.mock('@workspace/a11oy-orchestration', () => ({
  A11OY_PRODUCT_IDS: ['amaru'],
}));

// ---------------------------------------------------------------------------
// Test helpers.
// ---------------------------------------------------------------------------

async function waitFor(pred: () => boolean, timeoutMs = 2000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (pred()) return;
    await new Promise((r) => setTimeout(r, 10));
  }
  throw new Error(`waitFor: condition not met within ${timeoutMs}ms`);
}

function seedApprovers(): number[] {
  // Three approver roles, three active users, one per role.
  store.roles.push(
    { id: 11, name: 'super_admin' },
    { id: 12, name: 'admin' },
    { id: 13, name: 'compliance' },
    { id: 14, name: 'member' }, // non-approver — proves the filter works
  );
  store.user_roles.push(
    { userId: 101, roleId: 11 },
    { userId: 102, roleId: 12 },
    { userId: 103, roleId: 13 },
    { userId: 999, roleId: 14 }, // not an approver
  );
  store.users.push(
    { id: 101, isActive: true },
    { id: 102, isActive: true },
    { id: 103, isActive: true },
    { id: 999, isActive: true },
  );
  return [101, 102, 103];
}

// Mock the in-process router gate so the production hook installer sees a
// guaranteed gate miss for every model under test. We mock the module the
// hook installer imports, NOT the installer itself — so the assertion that
// "boot wiring is exercised end-to-end" still holds.
vi.mock('../a11oy/runtime/router/model-router', () => ({
  checkInferenceGates: (modelId: string) => ({
    allowed: false,
    model: modelId,
    failedGates: ['license_approved', 'registry_exists'],
    gates: {
      registry_exists: false,
      license_approved: false,
      sensitivity_match: true,
      live_inference_enabled: true,
      production_approved: true,
    },
  }),
  getGateSummary: () => ({}),
}));

describe('inference gate → Lexicon → reviewer alerts (integration)', () => {
  let evaluateInferenceGates: (typeof import('@szl-holdings/ai-engine/providers/inference-gates'))['evaluateInferenceGates'];
  let setInferenceGateChecker: (typeof import('@szl-holdings/ai-engine/providers/inference-gates'))['setInferenceGateChecker'];

  beforeEach(async () => {
    resetStore();
    idSeq = 1;
    seedApprovers();

    vi.resetModules();
    // Install the SAME hook the api-server boots with. The installer lives
    // in `lib/inference-gate-hook` and is called by both `app.ts` and this
    // test — so any drift in boot wiring is caught here automatically.
    const { installInferenceGateHook } = await import('../lib/inference-gate-hook');
    ({ evaluateInferenceGates, setInferenceGateChecker } = await import(
      '@szl-holdings/ai-engine/providers/inference-gates'
    ));
    installInferenceGateHook();
  });

  afterEach(() => {
    // Detach the hook to avoid leaking it into subsequent test files.
    setInferenceGateChecker((m: string) => ({
      allowed: false,
      model: m,
      failedGates: [],
      gates: {},
    }));
  });

  async function triggerGate(modelId: string): Promise<void> {
    // The production hook is fire-and-forget — we cannot await its
    // internal promise chain directly. Drain the microtask/macrotask
    // queue a few times so seedLexiconFromRegistry → ensureLexiconEntry
    // → notifyLexiconReviewers all settle. Callers that need stronger
    // guarantees use `waitFor` on observable state below.
    evaluateInferenceGates(modelId);
    for (let i = 0; i < 5; i++) {
      await new Promise((r) => setImmediate(r));
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  function notificationsFor(target: string): Row[] {
    return store.notifications.filter((n) =>
      String(n.title ?? '').includes(target),
    );
  }

  it('first gate miss → one notification per approver; second miss → none; resolved review → fresh round', async () => {
    const target = 'meta-llama/Llama-Mystery-7B';

    // ── 1. First miss ──
    await triggerGate(target);
    await waitFor(() => notificationsFor(target).length >= 3);

    const firstRound = notificationsFor(target);
    expect(firstRound).toHaveLength(3);
    expect(new Set(firstRound.map((n) => n.userId))).toEqual(
      new Set([101, 102, 103]),
    );
    for (const n of firstRound) {
      expect(n.type).toBe('action_required');
      expect(n.channel).toBe('in_app');
      expect(String(n.message)).toMatch(/license review/i);
      expect(String(n.actionUrl)).toContain('/governance/lexicon');
    }

    // Exactly one entry + one pending review row was created.
    const entries = store.lexicon_entries.filter((e) => e.targetId === target);
    expect(entries).toHaveLength(1);
    const entryId = entries[0].id;
    const reviews = store.lexicon_review_requests.filter(
      (r) => r.entryId === entryId,
    );
    expect(reviews).toHaveLength(1);
    expect(reviews[0].status).toBe('pending');

    // ── 2. Second miss for the same target while review is still pending ──
    await triggerGate(target);
    // Let any potential async dispatch settle before re-counting.
    await new Promise((r) => setTimeout(r, 30));

    expect(notificationsFor(target)).toHaveLength(3); // unchanged
    expect(
      store.lexicon_review_requests.filter((r) => r.entryId === entryId),
    ).toHaveLength(1); // no duplicate review row

    // ── 3. Operator denies the pending review → a fresh miss must alert again ──
    // Simulate the writes performed by the deny route handler
    // (POST /entries/:id/deny → applyDecision('denied')).
    for (const r of store.lexicon_review_requests) {
      if (r.entryId === entryId && r.status === 'pending') {
        r.status = 'denied';
        r.resolvedAt = new Date();
      }
    }
    for (const e of store.lexicon_entries) {
      if (e.id === entryId) e.status = 'denied';
    }

    await triggerGate(target);
    await waitFor(() => notificationsFor(target).length >= 6);

    const afterDeny = notificationsFor(target);
    expect(afterDeny).toHaveLength(6); // 3 original + 3 new
    expect(
      afterDeny.filter((n) => n.userId === 101),
    ).toHaveLength(2);
    expect(
      afterDeny.filter((n) => n.userId === 102),
    ).toHaveLength(2);
    expect(
      afterDeny.filter((n) => n.userId === 103),
    ).toHaveLength(2);

    // A second review row now exists (the new pending one), and the original
    // one is recorded as denied.
    const reviewsAfter = store.lexicon_review_requests.filter(
      (r) => r.entryId === entryId,
    );
    expect(reviewsAfter).toHaveLength(2);
    expect(reviewsAfter.filter((r) => r.status === 'pending')).toHaveLength(1);
    expect(reviewsAfter.filter((r) => r.status === 'denied')).toHaveLength(1);
  });

  it('non-approver roles never receive alerts even after multiple misses', async () => {
    const target = 'unknown-org/no-spam-9B';
    await triggerGate(target);
    await waitFor(() => notificationsFor(target).length >= 3);

    // The `member` user (id=999) is in `users` + `user_roles` but holds a
    // role outside the approver set. They must never receive an alert,
    // regardless of how many gate misses fire.
    await triggerGate(target);
    await triggerGate(target);
    await new Promise((r) => setTimeout(r, 30));

    expect(notificationsFor(target).every((n) => n.userId !== 999)).toBe(true);
    expect(notificationsFor(target)).toHaveLength(3);
  });
});
