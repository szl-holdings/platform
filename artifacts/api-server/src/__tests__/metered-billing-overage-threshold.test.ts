/**
 * HOURLY_OVERAGE_THRESHOLD_CHECK scheduled job — overage line-item refresh tests
 *
 * Critical invariant: the draft overage line item (billing_line_items) must be
 * refreshed (delete + insert) on every job run where usage >= 100% of included
 * units, regardless of whether the 100% threshold notification was already
 * deduped. This ensures the invoice reflects the latest overage amount rather
 * than the amount at the first 100% crossing.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Hoisted — must be first so vitest hoisting works correctly
// ---------------------------------------------------------------------------

const { handlerMap } = vi.hoisted(() => {
  const handlerMap = new Map<string, (job: { id: string }) => Promise<void>>();
  return { handlerMap };
});

vi.mock('@szl-holdings/forge-runtime', () => ({
  durableJobQueue: {
    register: (type: string, handler: (job: { id: string }) => Promise<void>) => {
      handlerMap.set(type, handler);
    },
    enqueue: vi.fn(async () => ({ id: 'mock-job' })),
  },
  enqueueNamedJob: vi.fn(async () => ({ id: 'mock-job' })),
}));

vi.mock('@szl-holdings/observability', () => ({
  serverTelemetry: {
    recordBusinessEvent: vi.fn(),
    recordAuthFailure: vi.fn(),
    recordRequest: vi.fn(),
    recordError: vi.fn(),
    recordLatency: vi.fn(),
    recordMutation: vi.fn(),
  },
}));

vi.mock('../lib/logger', () => ({
  logger: {
    info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(),
    child: vi.fn(() => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() })),
  },
}));

vi.mock('../routes/notifications', () => ({
  dispatchToExternalChannels: vi.fn(() => Promise.resolve()),
}));

vi.mock('drizzle-orm', () => ({
  eq: (_a: unknown, _b: unknown) => ({ __eq: [_a, _b] }),
  and: (..._args: unknown[]) => ({ __and: _args }),
  gte: (_a: unknown, _b: unknown) => ({ __gte: [_a, _b] }),
  lte: (_a: unknown, _b: unknown) => ({ __lte: [_a, _b] }),
  inArray: (_col: unknown, _arr: unknown) => ({ __inArray: [_col, _arr] }),
  isNotNull: (_col: unknown) => ({ __isNotNull: _col }),
  sql: Object.assign(
    (_parts: TemplateStringsArray, ..._vals: unknown[]) => ({ __sql: true }),
    { raw: (_s: string) => ({ __sqlRaw: _s }) },
  ),
  desc: (_col: unknown) => ({ __desc: _col }),
}));

// ---------------------------------------------------------------------------
// Controllable DB mock
// ---------------------------------------------------------------------------

const mockDelete = vi.fn();
const mockInsert = vi.fn();
const mockSelect = vi.fn();

const mockDb = {
  select: mockSelect,
  selectDistinct: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => Promise.resolve([])) })) })),
  insert: mockInsert,
  update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => Promise.resolve([{}])) })) })),
  delete: mockDelete,
};

vi.mock('@szl-holdings/db', () => ({
  db: mockDb,
  usageAggregatesTable:             { __t: 'usage_aggregates' },
  organizationsTable:               { __t: 'organizations' },
  subscriptionsTable:               { __t: 'subscriptions' },
  billingMetersTable:               { __t: 'billing_meters' },
  billingMeterAllotmentsTable:      { __t: 'billing_meter_allotments' },
  billingLineItemsTable:            { __t: 'billing_line_items' },
  usageThresholdNotificationsTable: { __t: 'usage_threshold_notifications' },
  orgMembersTable:                  { __t: 'org_members' },
  notificationPreferencesTable:     { __t: 'notification_preferences' },
  notificationsTable:               { __t: 'notifications' },
  usersTable:                       { __t: 'users' },
  // other tables that may be pulled in by other jobs
  meteringEventsTable:              { __t: 'metering_events' },
  usersSettingsTable:               { __t: 'user_settings' },
}));

// ---------------------------------------------------------------------------
// Helper — push a chained select mock onto the queue
// ---------------------------------------------------------------------------

/** `select().from().innerJoin().where()` */
function queueInnerJoinWhere(result: unknown) {
  mockSelect.mockReturnValueOnce({
    from: vi.fn(() => ({
      innerJoin: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve(result)),
      })),
    })),
  });
}

/** `select().from().where().limit()` */
function queueWhereLimit(result: unknown) {
  mockSelect.mockReturnValueOnce({
    from: vi.fn(() => ({
      where: vi.fn(() => ({
        limit: vi.fn(() => Promise.resolve(result)),
        orderBy: vi.fn(() => Promise.resolve(result)),
      })),
    })),
  });
}

/** `select().from().where()` — resolves to array directly (no limit) */
function queueWhereDirect(result: unknown) {
  mockSelect.mockReturnValueOnce({
    from: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve(result)),
      innerJoin: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve(result)),
      })),
    })),
  });
}

// ---------------------------------------------------------------------------
// Full mock DB setup for HOURLY_OVERAGE_THRESHOLD_CHECK call sequence
//
// The job makes these DB calls in order:
//   1. aggregates: select({agg, orgName}).from(usageAgg).innerJoin(orgs).where(...)
//   2. orgSubscriptions: select({orgId,planId}).from(subs).where(...)
//   3. allotments: select().from(allotments).innerJoin(meters).where(...)
//      (only if uniqueOrgIds.length > 0, which is true when aggregates is non-empty)
//   4. (per aggregate) meter lookup: select().from(meters).where(...).limit(1)
//   5. (per threshold) notification dedup: select({id}).from(notifs).where(...).limit(1)
//      — three calls for [50, 80, 100]
//   6. (if 100% notification fires) admin members: select({userId}).from(orgMembers).where(...)
//   After the threshold loop:
//   7. (if pct >= 100 and overage > 0) db.delete().where() then db.insert().values()
// ---------------------------------------------------------------------------

function setupThresholdCheckMocks({
  currentUsage,
  includedUnits,
  notif100Exists,
}: {
  currentUsage: number;
  includedUnits: number;
  notif100Exists: boolean;
}) {
  mockSelect.mockReset();
  mockInsert.mockReset();
  mockDelete.mockReset();

  mockDelete.mockImplementation(() => ({
    where: vi.fn(() => Promise.resolve({ rowCount: 1 })),
  }));

  mockInsert.mockImplementation(() => ({
    values: vi.fn(() => ({
      returning: vi.fn(() => Promise.resolve([{ id: 9001 }])),
      onConflictDoNothing: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{ id: 9001 }])),
      })),
      onConflictDoUpdate: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{ id: 9001 }])),
      })),
    })),
  }));

  // 1. aggregates innerJoin orgs
  queueInnerJoinWhere([
    {
      agg: {
        orgId: 1,
        featureKey: 'api.calls',
        product: 'platform',
        totalQuantity: String(currentUsage),
        periodType: 'month',
        periodStart: new Date('2026-04-01'),
        periodEnd: new Date('2026-05-01'),
      },
      orgName: 'Acme Corp',
    },
  ]);

  // 2. orgSubscriptions: select().from(subs).where()
  queueWhereDirect([{ orgId: 1, planId: 10 }]);

  // 3. allotments innerJoin meters
  queueInnerJoinWhere([
    {
      allotment: {
        planId: 10,
        meterId: 5,
        includedUnits: String(includedUnits),
        overageUnitAmount: '0.01',
      },
      meter: { key: 'api.calls', id: 5 },
    },
  ]);

  // 4. meter lookup (per aggregate) — used for fallback unitAmount
  queueWhereLimit([
    { key: 'api.calls', includedUnits: String(includedUnits), unitAmount: '0.01', id: 5 },
  ]);

  // 5a. Dedup for 50% — already fired
  queueWhereLimit([{ id: 1 }]);

  // 5b. Dedup for 80% — already fired
  queueWhereLimit([{ id: 2 }]);

  // 5c. Dedup for 100%
  queueWhereLimit(notif100Exists ? [{ id: 3 }] : []);

  // 6. If 100% notification fires (not deduped), admin members lookup
  if (!notif100Exists) {
    queueWhereDirect([]); // no admins → skip notification dispatch
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const JOB_TYPE = 'hourly_overage_threshold_check';

describe('HOURLY_OVERAGE_THRESHOLD_CHECK — overage line-item refresh', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    await import('../lib/scheduled-jobs.js');
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('writes a draft overage line item on first 100% breach (notification fires)', async () => {
    setupThresholdCheckMocks({ currentUsage: 1200, includedUnits: 1000, notif100Exists: false });

    const handler = handlerMap.get(JOB_TYPE);
    expect(handler, 'handler must be registered').toBeDefined();
    await handler!({ id: 'job-1' });

    expect(mockDelete).toHaveBeenCalled();
    expect(mockInsert).toHaveBeenCalled();
  });

  it('still refreshes overage line item when 100% notification was already deduped', async () => {
    // Simulate a subsequent run: notification for 50/80/100% are all deduped,
    // but usage has grown further (1500 > 1200).
    setupThresholdCheckMocks({ currentUsage: 1500, includedUnits: 1000, notif100Exists: true });

    const handler = handlerMap.get(JOB_TYPE);
    expect(handler).toBeDefined();
    await handler!({ id: 'job-2' });

    // Critical: delete + insert must have been called despite 100% notification being deduped.
    expect(mockDelete).toHaveBeenCalled();
    expect(mockInsert).toHaveBeenCalled();
  });

  it('does NOT write an overage line item when usage is below 100%', async () => {
    // 90% usage — threshold notifications for 50% and 80% deduped; 100% not reached.
    // The pct < threshold guard inside the loop skips 100%, so the overage block is never entered.
    setupThresholdCheckMocks({ currentUsage: 900, includedUnits: 1000, notif100Exists: false });

    const handler = handlerMap.get(JOB_TYPE);
    await handler!({ id: 'job-3' });

    // No overage → delete should NOT have been called
    expect(mockDelete).not.toHaveBeenCalled();
  });
});
