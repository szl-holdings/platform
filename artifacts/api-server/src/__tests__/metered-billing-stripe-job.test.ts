/**
 * DAILY_STRIPE_USAGE_RECORD scheduled job — completion path tests
 *
 * Focuses on the job-level invariants:
 *  1. Job completes without throwing even when no subscriptions exist.
 *  2. Telemetry is emitted with the correct metersChecked / subsChecked counters.
 *  3. metersChecked tracks across all subscriptions (not just the last one).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Hoisted mocks
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

const mockRecordBusinessEvent = vi.fn();
vi.mock('@szl-holdings/observability', () => ({
  serverTelemetry: {
    recordBusinessEvent: mockRecordBusinessEvent,
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

// computeBillableQty used inside the job — mock it at the shared module level
vi.mock('../routes/metering/shared', () => ({
  computeBillableQty: vi.fn(async () => 0),
  recomputeAggregate: vi.fn(async () => undefined),
}));

// ---------------------------------------------------------------------------
// DB mock
// ---------------------------------------------------------------------------

const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockDelete = vi.fn();

const mockDb = {
  select: mockSelect,
  selectDistinct: vi.fn(() => ({
    from: vi.fn(() => ({ where: vi.fn(() => Promise.resolve([])) })),
  })),
  insert: mockInsert,
  update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => Promise.resolve([{}])) })) })),
  delete: mockDelete,
};

vi.mock('@szl-holdings/db', () => ({
  db: mockDb,
  subscriptionsTable:           { __t: 'subscriptions' },
  organizationsTable:           { __t: 'organizations' },
  billingMetersTable:           { __t: 'billing_meters' },
  billingMeterAllotmentsTable:  { __t: 'billing_meter_allotments' },
  billingLineItemsTable:        { __t: 'billing_line_items' },
  usageAggregatesTable:         { __t: 'usage_aggregates' },
  usageThresholdNotificationsTable: { __t: 'usage_threshold_notifications' },
  orgMembersTable:              { __t: 'org_members' },
  notificationPreferencesTable: { __t: 'notification_preferences' },
  notificationsTable:           { __t: 'notifications' },
  usersTable:                   { __t: 'users' },
  meteringEventsTable:          { __t: 'metering_events' },
  usersSettingsTable:           { __t: 'user_settings' },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** `select().from().where()` resolves to an array directly */
function queueWhere(result: unknown) {
  mockSelect.mockReturnValueOnce({
    from: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve(result)),
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const JOB_TYPE = 'daily_stripe_usage_record';

describe('DAILY_STRIPE_USAGE_RECORD scheduled job — completion path', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    await import('../lib/scheduled-jobs.js');
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('job is registered with durableJobQueue', () => {
    expect(handlerMap.has(JOB_TYPE)).toBe(true);
  });

  it('completes without throwing when there are no active subscriptions', async () => {
    // activeSubs: subscriptions innerJoin organizations → empty
    queueInnerJoinWhere([]);
    // planAllotments: planIds.length === 0, so the conditional short-circuits — no DB call

    const handler = handlerMap.get(JOB_TYPE);
    await expect(handler!({ id: 'job-empty' })).resolves.toBeUndefined();
  });

  it('emits telemetry with correct metersChecked and subsChecked when no subs exist', async () => {
    queueInnerJoinWhere([]); // activeSubs → empty
    // no allotments call (planIds is empty)

    const handler = handlerMap.get(JOB_TYPE);
    await handler!({ id: 'job-telemetry-empty' });

    const telemetryCalls = mockRecordBusinessEvent.mock.calls.filter(
      ([ev]: [{ type: string }]) => ev.type === 'daily_stripe_usage_record_completed',
    );
    expect(telemetryCalls.length).toBeGreaterThan(0);
    const [event] = telemetryCalls[telemetryCalls.length - 1] as [{ metadata: { metersChecked: number; subsChecked: number } }];
    expect(event.metadata.metersChecked).toBe(0);
    expect(event.metadata.subsChecked).toBe(0);
  });

  it('emits metersChecked=2 when one subscription has two active meters', async () => {
    const sub = { orgId: 1, planId: 10, billingCustomerId: 'cus_abc', stripeSubscriptionId: 'sub_abc', status: 'active' };
    const meters = [
      { key: 'api.calls', aggregation: 'sum', stripePriceId: 'price_A', stripeMeterId: null, isActive: true, unitAmount: '0.01', includedUnits: '1000' },
      { key: 'storage.gb', aggregation: 'last', stripePriceId: 'price_B', stripeMeterId: null, isActive: true, unitAmount: '0.005', includedUnits: '100' },
    ];

    // 1. activeSubs: subscriptions innerJoin organizations
    queueInnerJoinWhere([sub]);
    // 2. planAllotments for planId=10: allotments innerJoin meters
    queueInnerJoinWhere([
      { planId: 10, key: 'api.calls' },
      { planId: 10, key: 'storage.gb' },
    ]);
    // 3. meters inside loop: select().from(billingMetersTable).where(...)
    queueWhere(meters);

    const handler = handlerMap.get(JOB_TYPE);
    await handler!({ id: 'job-meters' });

    const telemetryCalls = mockRecordBusinessEvent.mock.calls.filter(
      ([ev]: [{ type: string }]) => ev.type === 'daily_stripe_usage_record_completed',
    );
    expect(telemetryCalls.length).toBeGreaterThan(0);
    const [event] = telemetryCalls[telemetryCalls.length - 1] as [{ metadata: { metersChecked: number; subsChecked: number } }];
    expect(event.metadata.metersChecked).toBe(2);
    expect(event.metadata.subsChecked).toBe(1);
  });
});
