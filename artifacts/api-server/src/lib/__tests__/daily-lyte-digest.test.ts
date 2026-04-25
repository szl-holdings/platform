import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

interface FakeRecipient {
  userId: number;
  email: string | null;
  displayName: string;
}

interface FakeNotification {
  id: number;
  title: string;
  message: string;
  type: string;
  actionUrl: string | null;
  createdAt: Date;
}

const state: {
  recipients: FakeRecipient[];
  notificationsPerUser: Record<number, FakeNotification[]>;
  claimResult: { rows: { user_id: number }[] } | (() => { rows: { user_id: number }[] });
  queuedEmails: unknown[];
  poolQueries: Array<{ sql: string; params: unknown[] }>;
} = {
  recipients: [],
  notificationsPerUser: {},
  claimResult: { rows: [] },
  queuedEmails: [],
  poolQueries: [],
};

let selectCallIndex = 0;

vi.mock('@szl-holdings/db', () => {
  const notificationPreferencesTable = {
    userId: { _col: 'user_id' },
    emailEnabled: { _col: 'email_enabled' },
    lastDigestSentAt: { _col: 'last_digest_sent_at' },
  };
  const notificationsTable = {
    id: { _col: 'id' },
    userId: { _col: 'user_id' },
    title: { _col: 'title' },
    message: { _col: 'message' },
    type: { _col: 'type' },
    actionUrl: { _col: 'action_url' },
    createdAt: { _col: 'created_at' },
    isRead: { _col: 'is_read' },
  };
  const usersTable = {
    id: { _col: 'id' },
    email: { _col: 'email' },
    displayName: { _col: 'display_name' },
    isActive: { _col: 'is_active' },
  };

  const makeLimitChain = (userId: number) => ({
    limit: (_n: number) => Promise.resolve(state.notificationsPerUser[userId] ?? []),
  });

  return {
    notificationPreferencesTable,
    notificationsTable,
    usersTable,
    db: {
      select(_proj?: unknown) {
        const callIdx = selectCallIndex++;
        return {
          from(_table: unknown) {
            return {
              innerJoin(_t: unknown, _cond: unknown) {
                return {
                  where(_cond: unknown) {
                    return Promise.resolve(state.recipients);
                  },
                };
              },
              where(_cond: unknown) {
                return {
                  orderBy(_col: unknown) {
                    const recipient = state.recipients[callIdx - 1] ?? state.recipients[0];
                    return makeLimitChain(recipient?.userId ?? 0);
                  },
                };
              },
            };
          },
        };
      },
    },
    pool: {
      query(sql: string, params: unknown[]) {
        state.poolQueries.push({ sql, params });
        if (sql.includes('UPDATE notification_preferences')) {
          const result = typeof state.claimResult === 'function'
            ? state.claimResult()
            : state.claimResult;
          return Promise.resolve(result);
        }
        return Promise.resolve({ rows: [] });
      },
    },
  };
});

vi.mock('drizzle-orm', () => ({
  eq: (col: unknown, val: unknown) => ({ op: 'eq', col, val }),
  and: (...c: unknown[]) => ({ op: 'and', c }),
  or: (...c: unknown[]) => ({ op: 'or', c }),
  gte: (col: unknown, val: unknown) => ({ op: 'gte', col, val }),
  lt: (col: unknown, val: unknown) => ({ op: 'lt', col, val }),
  desc: (col: unknown) => ({ op: 'desc', col }),
  isNull: (col: unknown) => ({ op: 'isNull', col }),
}));

vi.mock('@szl-holdings/forge-runtime', () => ({
  durableJobQueue: { register: vi.fn() },
}));

const recordBusinessEventSpy = vi.fn();
vi.mock('@szl-holdings/observability', () => ({
  serverTelemetry: { recordBusinessEvent: recordBusinessEventSpy },
}));

const loggerSpy = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };
vi.mock('../logger', () => ({ logger: loggerSpy }));

const queueEmailSpy = vi.fn().mockResolvedValue(undefined);
vi.mock('../queued-jobs', () => ({ queueEmail: queueEmailSpy }));

vi.mock('../email', () => ({
  buildNotificationDigestEmail: vi.fn(() => '<html>digest</html>'),
  generateUnsubscribeToken: vi.fn(() => 'tok-abc'),
  logNotificationAudit: vi.fn().mockResolvedValue(undefined),
}));

let digestHandler: (job: { id: string; payload: Record<string, unknown> }) => Promise<void>;

beforeEach(async () => {
  vi.resetModules();
  selectCallIndex = 0;
  state.recipients = [];
  state.notificationsPerUser = {};
  state.claimResult = { rows: [] };
  state.queuedEmails = [];
  state.poolQueries = [];

  recordBusinessEventSpy.mockClear();
  queueEmailSpy.mockClear();
  loggerSpy.info.mockClear();
  loggerSpy.warn.mockClear();
  loggerSpy.error.mockClear();

  const capturedByType: Record<string, (job: { id: string; payload: Record<string, unknown> }) => Promise<void>> = {};
  const forge = await import('@szl-holdings/forge-runtime');
  (forge.durableJobQueue.register as ReturnType<typeof vi.fn>).mockImplementation(
    (type: string, fn: (job: { id: string; payload: Record<string, unknown> }) => Promise<void>) => {
      capturedByType[type] = fn;
    },
  );

  await import('../scheduled-jobs');
  digestHandler = capturedByType['daily_lyte_digest']!;
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('daily_lyte_digest', () => {
  it('queues an email and records business event when a user has unread notifications', async () => {
    state.recipients = [{ userId: 1, email: 'alice@example.com', displayName: 'Alice' }];
    state.claimResult = { rows: [{ user_id: 1 }] };
    state.notificationsPerUser = {
      1: [{ id: 10, title: 'Alert', message: 'something happened', type: 'info', actionUrl: null, createdAt: new Date() }],
    };

    await digestHandler({ id: 'job-1', payload: {} });

    expect(queueEmailSpy).toHaveBeenCalledTimes(1);
    const emailArg = queueEmailSpy.mock.calls[0]?.[0] as { to: string };
    expect(emailArg.to).toBe('alice@example.com');

    const event = recordBusinessEventSpy.mock.calls[0]?.[0];
    expect(event.type).toBe('daily_lyte_digest_completed');
    expect(event.metadata.sent).toBe(1);
    expect(event.metadata.skipped).toBe(0);
  });

  it('skips a user who has no unread notifications (claim is never attempted)', async () => {
    state.recipients = [{ userId: 2, email: 'bob@example.com', displayName: 'Bob' }];
    state.claimResult = { rows: [{ user_id: 2 }] };
    state.notificationsPerUser = { 2: [] };

    await digestHandler({ id: 'job-2', payload: {} });

    expect(queueEmailSpy).not.toHaveBeenCalled();
    const claimCalls = state.poolQueries.filter(q => q.sql.includes('UPDATE notification_preferences'));
    expect(claimCalls).toHaveLength(0);

    const event = recordBusinessEventSpy.mock.calls[0]?.[0];
    expect(event.metadata.sent).toBe(0);
    expect(event.metadata.skipped).toBe(1);
  });

  it('skips a user when the atomic claim returns no rows (concurrent run already sent)', async () => {
    state.recipients = [{ userId: 3, email: 'carol@example.com', displayName: 'Carol' }];
    state.claimResult = { rows: [] };
    state.notificationsPerUser = {
      3: [{ id: 20, title: 'Update', message: 'info', type: 'info', actionUrl: null, createdAt: new Date() }],
    };

    await digestHandler({ id: 'job-3', payload: {} });

    expect(queueEmailSpy).not.toHaveBeenCalled();
    const claimCalls = state.poolQueries.filter(q => q.sql.includes('UPDATE notification_preferences'));
    expect(claimCalls).toHaveLength(1);

    const event = recordBusinessEventSpy.mock.calls[0]?.[0];
    expect(event.metadata.sent).toBe(0);
    expect(event.metadata.skipped).toBe(1);
  });

  it('runs twice in the same day and sends exactly one email (second run claim returns empty)', async () => {
    state.recipients = [{ userId: 4, email: 'dave@example.com', displayName: 'Dave' }];
    state.notificationsPerUser = {
      4: [{ id: 30, title: 'Alert', message: 'x', type: 'info', actionUrl: null, createdAt: new Date() }],
    };

    let claimCount = 0;
    state.claimResult = () => {
      claimCount++;
      return claimCount === 1 ? { rows: [{ user_id: 4 }] } : { rows: [] };
    };

    await digestHandler({ id: 'job-4a', payload: {} });
    selectCallIndex = 0;
    await digestHandler({ id: 'job-4b', payload: {} });

    expect(queueEmailSpy).toHaveBeenCalledTimes(1);
    expect(recordBusinessEventSpy).toHaveBeenCalledTimes(2);
    const firstRun = recordBusinessEventSpy.mock.calls[0]?.[0];
    const secondRun = recordBusinessEventSpy.mock.calls[1]?.[0];
    expect(firstRun.metadata.sent).toBe(1);
    expect(secondRun.metadata.sent).toBe(0);
    expect(secondRun.metadata.skipped).toBe(1);
  });

  it('skips recipients with a null email address', async () => {
    state.recipients = [{ userId: 5, email: null, displayName: 'Unknown' }];
    state.claimResult = { rows: [{ user_id: 5 }] };

    await digestHandler({ id: 'job-5', payload: {} });

    expect(queueEmailSpy).not.toHaveBeenCalled();
    const event = recordBusinessEventSpy.mock.calls[0]?.[0];
    expect(event.metadata.skipped).toBe(1);
  });

  it('counts a failed per-user send and continues processing remaining recipients', async () => {
    state.recipients = [
      { userId: 6, email: 'err@example.com', displayName: 'Err' },
      { userId: 7, email: 'ok@example.com', displayName: 'Ok' },
    ];
    state.notificationsPerUser = {
      6: [{ id: 40, title: 'Alert', message: 'x', type: 'info', actionUrl: null, createdAt: new Date() }],
      7: [{ id: 41, title: 'Alert', message: 'y', type: 'info', actionUrl: null, createdAt: new Date() }],
    };
    state.claimResult = { rows: [{ user_id: 6 }] };

    let claimIdx = 0;
    state.claimResult = () => {
      claimIdx++;
      return { rows: [{ user_id: claimIdx === 1 ? 6 : 7 }] };
    };

    queueEmailSpy.mockRejectedValueOnce(new Error('smtp error'));

    await digestHandler({ id: 'job-6', payload: {} });

    expect(queueEmailSpy).toHaveBeenCalledTimes(2);
    const event = recordBusinessEventSpy.mock.calls[0]?.[0];
    expect(event.metadata.sent).toBe(1);
    expect(event.metadata.failed).toBe(1);
    expect(loggerSpy.warn).toHaveBeenCalledTimes(1);
  });
});
