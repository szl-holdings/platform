/**
 * Tests for the high/critical approval mobile push notification flow added
 * for Task #1393.
 *
 * Verifies via the `__orgApproverInternals` seam that:
 *   1. `sendPushToOrgApprovers` fans out one push per resolved approver
 *      user (every user surfaced by the orgMembers ⨝ userRoles ⨝ roles
 *      ⨝ pushTokens query).
 *   2. Users gated out by `isAlertCategoryAllowedForUser` (e.g. quiet
 *      hours, `alerts_approvals_enabled=false`) do NOT receive a push.
 *   3. Targeted/sent counts are aggregated correctly even when a single
 *      per-user delivery throws.
 *   4. The Quick-Actions deep-link payload is forwarded to every
 *      recipient delivery and the helper passes through `appId: 'cortex'`.
 *
 * The DB and Expo SDK are mocked so the test runs without a database or
 * network. The seam (`__orgApproverInternals`) lets the test substitute
 * the per-user delivery + preference gate without re-implementing the
 * full DB stack.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@szl-holdings/db', () => {
  return {
    db: { selectDistinct: () => ({ from: () => ({ innerJoin: () => ({ innerJoin: () => ({ innerJoin: () => ({ where: async () => [] }) }) }) }) }) },
    orgMembersTable: { orgId: 'orgId', userId: 'userId' },
    rolesTable: { id: 'id', name: 'name' },
    userRolesTable: { userId: 'userId', roleId: 'roleId' },
    pushTokensTable: {
      userId: 'userId',
      appId: 'appId',
      isActive: 'isActive',
      token: 'token',
    },
    pushNotificationHistoryTable: {},
    pushNotificationPreferencesTable: {},
    pushReceiptsTable: {},
    scheduledNotificationsTable: {},
    userSettingsTable: {},
    pool: { totalCount: 0, idleCount: 0, waitingCount: 0 },
  };
});

vi.mock('drizzle-orm', () => ({
  and: (...a: unknown[]) => ({ _kind: 'and', a }),
  eq: (l: unknown, r: unknown) => ({ _kind: 'eq', l, r }),
  inArray: (l: unknown, r: unknown) => ({ _kind: 'inArray', l, r }),
  isNull: (l: unknown) => ({ _kind: 'isNull', l }),
  lt: (l: unknown, r: unknown) => ({ _kind: 'lt', l, r }),
  sql: Object.assign(() => ({ _kind: 'sql' }), { raw: (s: string) => ({ _kind: 'sql', s }) }),
}));

vi.mock('expo-server-sdk', () => {
  class Expo {
    chunkPushNotifications(items: unknown[]) {
      return [items];
    }
    async sendPushNotificationsAsync() {
      return [];
    }
    async getPushNotificationReceiptsAsync() {
      return {};
    }
    static isExpoPushToken() {
      return true;
    }
  }
  return { Expo, default: { Expo } };
});

beforeEach(() => {
  vi.resetModules();
});

async function loadHelperWith(opts: {
  resolveUserIds?: (orgId: number, appId: string) => Promise<number[]>;
  isAllowed?: (userId: number) => Promise<boolean>;
  sendToUser?: (userId: number) => Promise<{ sent: number; failed: number }>;
}) {
  const mod = await import('../lib/expo-push');
  const sendToUser = vi.fn(async (userId: number) =>
    opts.sendToUser ? opts.sendToUser(userId) : { sent: 1, failed: 0 },
  );
  const isAllowed = vi.fn(async (userId: number) =>
    opts.isAllowed ? opts.isAllowed(userId) : true,
  );
  const resolveUserIds = vi.fn(async (orgId: number, appId: string) =>
    opts.resolveUserIds ? opts.resolveUserIds(orgId, appId) : [],
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (mod.__orgApproverInternals as any).resolveUserIds = resolveUserIds;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (mod.__orgApproverInternals as any).isAllowed = isAllowed;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (mod.__orgApproverInternals as any).sendToUser = (
    userId: number,
    payload: unknown,
    callOpts: unknown,
  ) => {
    sendToUser(userId);
    // Capture for downstream assertions on payload shape + appId.
    sendToUser.mock.calls[sendToUser.mock.calls.length - 1] = [
      userId,
      payload,
      callOpts,
    ] as unknown as [number];
    return Promise.resolve({ sent: 1, failed: 0, tickets: [] });
  };

  return { mod, sendToUser, isAllowed, resolveUserIds };
}

describe('sendPushToOrgApprovers', () => {
  it('fans out to every approver user surfaced by the DB query', async () => {
    const { mod, sendToUser, isAllowed, resolveUserIds } = await loadHelperWith({
      resolveUserIds: async () => [11, 22, 33],
    });

    const result = await mod.sendPushToOrgApprovers(
      42,
      {
        title: 'High-Priority Approval Pending',
        body: 'Please review',
        data: { kind: 'approval_pending', screen: '/(shell)/quick-actions' },
        sound: 'default',
        channelId: 'critical-alerts',
      },
      { appId: 'cortex', severity: 'high' },
    );

    expect(resolveUserIds).toHaveBeenCalledWith(42, 'cortex');
    expect(result.targeted).toBe(3);
    expect(result.sent).toBe(3);
    expect(isAllowed).toHaveBeenCalledTimes(3);
    expect(sendToUser).toHaveBeenCalledTimes(3);

    const calls = sendToUser.mock.calls as unknown as Array<
      [number, { data?: Record<string, unknown> }, { appId?: string }]
    >;
    const userIds = calls.map((c) => c[0]).sort();
    expect(userIds).toEqual([11, 22, 33]);
    for (const call of calls) {
      const payload = call[1];
      const callOpts = call[2];
      expect(payload.data?.screen).toBe('/(shell)/quick-actions');
      expect(callOpts.appId).toBe('cortex');
    }
  });

  it('skips users whose alert preferences disallow approvals (muted / quiet hours)', async () => {
    const { mod, sendToUser, isAllowed } = await loadHelperWith({
      resolveUserIds: async () => [1, 2, 3],
      isAllowed: async (userId) => userId !== 2,
    });

    const result = await mod.sendPushToOrgApprovers(
      99,
      { title: 't', body: 'b' },
      { appId: 'cortex', severity: 'high' },
    );

    expect(result.targeted).toBe(3);
    expect(isAllowed).toHaveBeenCalledTimes(3);
    expect(sendToUser).toHaveBeenCalledTimes(2);
    const calls = sendToUser.mock.calls as unknown as Array<[number]>;
    const userIds = calls.map((c) => c[0]).sort();
    expect(userIds).toEqual([1, 3]);
  });

  it('returns zero counts and never gates / delivers when no approver rows are found', async () => {
    const { mod, sendToUser, isAllowed } = await loadHelperWith({
      resolveUserIds: async () => [],
    });

    const result = await mod.sendPushToOrgApprovers(
      7,
      { title: 't', body: 'b' },
      { appId: 'cortex', severity: 'critical' },
    );

    expect(result).toEqual({ targeted: 0, sent: 0, failed: 0 });
    expect(sendToUser).not.toHaveBeenCalled();
    expect(isAllowed).not.toHaveBeenCalled();
  });

  it('passes the critical severity flag through to the alert-category gate', async () => {
    const isAllowedReal = vi.fn(async () => true);
    const mod = await import('../lib/expo-push');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mod.__orgApproverInternals as any).resolveUserIds = vi.fn(async () => [1]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mod.__orgApproverInternals as any).isAllowed = isAllowedReal;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mod.__orgApproverInternals as any).sendToUser = vi
      .fn()
      .mockResolvedValue({ sent: 1, failed: 0, tickets: [] });

    await mod.sendPushToOrgApprovers(
      1,
      { title: 't', body: 'b' },
      { appId: 'cortex', severity: 'critical' },
    );
    expect(isAllowedReal).toHaveBeenCalledWith(1, 'approvals', { severity: 'critical' });
  });

  it('does not fail the whole batch when a single per-user delivery throws', async () => {
    const mod = await import('../lib/expo-push');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mod.__orgApproverInternals as any).resolveUserIds = vi.fn(async () => [1, 2, 3]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mod.__orgApproverInternals as any).isAllowed = vi.fn(async () => true);
    const sendSpy = vi.fn(async (userId: number) => {
      if (userId === 2) throw new Error('boom');
      return { sent: 1, failed: 0, tickets: [] };
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mod.__orgApproverInternals as any).sendToUser = sendSpy;

    const result = await mod.sendPushToOrgApprovers(
      1,
      { title: 't', body: 'b' },
      { appId: 'cortex', severity: 'high' },
    );

    expect(result.targeted).toBe(3);
    expect(result.sent).toBe(2);
    expect(sendSpy).toHaveBeenCalledTimes(3);
  });
});
