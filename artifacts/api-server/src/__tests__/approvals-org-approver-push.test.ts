/**
 * Tests for the high/critical approval mobile push notification flow added
 * for Task #1393.
 *
 * Verifies via the typed `__orgApproverInternals` seam that:
 *   1. `sendPushToOrgApprovers` fans out one push per resolved approver
 *      user (every user surfaced by the orgMembers ⨝ userRoles ⨝ roles
 *      ⨝ pushTokens query).
 *   2. The full CORTEX mobile app-id family is targeted by default
 *      (cortex-mobile, cortex-advisory, aegis-mobile, lyte-mobile,
 *      terra-mobile, stephen-mobile) and is forwarded to the role-resolver.
 *   3. Users gated out by `isAlertCategoryAllowedForUser` (e.g. quiet
 *      hours, `alerts_approvals_enabled=false`) do NOT receive a push.
 *   4. Targeted/sent counts are aggregated correctly even when a single
 *      per-user delivery throws.
 *   5. The Quick-Actions deep-link payload (`screen` + `deepLink`) is
 *      forwarded to every recipient delivery.
 *
 * The DB and Expo SDK are mocked so the test runs without a database or
 * network. The seam (`__orgApproverInternals`, typed via
 * `OrgApproverInternals`) lets the test substitute the per-user delivery
 * + preference gate without re-implementing the full DB stack.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { OrgApproverInternals, SendResult } from '../lib/expo-push';

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

const noopSendResult: SendResult = { sent: 1, failed: 0, tickets: [] };

async function loadHelperWith(overrides: Partial<OrgApproverInternals>) {
  const mod = await import('../lib/expo-push');
  const seam = mod.__orgApproverInternals;
  if (overrides.resolveUserIds) seam.resolveUserIds = overrides.resolveUserIds;
  if (overrides.isAllowed) seam.isAllowed = overrides.isAllowed;
  if (overrides.sendToUser) seam.sendToUser = overrides.sendToUser;
  return mod;
}

describe('sendPushToOrgApprovers', () => {
  it('targets the full CORTEX mobile app-id family by default', async () => {
    const resolveUserIds = vi
      .fn<OrgApproverInternals['resolveUserIds']>()
      .mockResolvedValue([]);
    const mod = await loadHelperWith({ resolveUserIds });

    await mod.sendPushToOrgApprovers(
      77,
      { title: 't', body: 'b' },
      { severity: 'high' },
    );

    expect(resolveUserIds).toHaveBeenCalledTimes(1);
    const [orgIdArg, appIdsArg] = resolveUserIds.mock.calls[0]!;
    expect(orgIdArg).toBe(77);
    expect(appIdsArg).toEqual(mod.CORTEX_MOBILE_APP_IDS);
    // Sanity: the family must include at least the canonical workspace ids.
    expect(appIdsArg).toEqual(
      expect.arrayContaining([
        'cortex-mobile',
        'cortex-advisory',
        'aegis-mobile',
        'lyte-mobile',
        'terra-mobile',
        'stephen-mobile',
      ]),
    );
  });

  it('fans out to every approver user surfaced by the DB query', async () => {
    const sendToUser = vi
      .fn<OrgApproverInternals['sendToUser']>()
      .mockResolvedValue(noopSendResult);
    const isAllowed = vi
      .fn<OrgApproverInternals['isAllowed']>()
      .mockResolvedValue(true);
    const resolveUserIds = vi
      .fn<OrgApproverInternals['resolveUserIds']>()
      .mockResolvedValue([11, 22, 33]);

    const mod = await loadHelperWith({ resolveUserIds, isAllowed, sendToUser });

    const result = await mod.sendPushToOrgApprovers(
      42,
      {
        title: 'High-Priority Approval Pending',
        body: 'Please review',
        data: { kind: 'approval_pending', screen: '/(shell)/quick-actions' },
        sound: 'default',
        channelId: 'critical-alerts',
      },
      { severity: 'high' },
    );

    expect(result.targeted).toBe(3);
    expect(result.sent).toBe(3);
    expect(isAllowed).toHaveBeenCalledTimes(3);
    expect(sendToUser).toHaveBeenCalledTimes(3);
    const userIds = sendToUser.mock.calls.map((c) => c[0]).sort();
    expect(userIds).toEqual([11, 22, 33]);
    for (const call of sendToUser.mock.calls) {
      const payload = call[1];
      const callOpts = call[2];
      expect(payload.data?.screen).toBe('/(shell)/quick-actions');
      expect(callOpts?.appId).toBe('cortex-mobile');
    }
  });

  it('skips users whose alert preferences disallow approvals (muted / quiet hours)', async () => {
    const sendToUser = vi
      .fn<OrgApproverInternals['sendToUser']>()
      .mockResolvedValue(noopSendResult);
    const isAllowed = vi
      .fn<OrgApproverInternals['isAllowed']>()
      .mockImplementation(async (userId) => userId !== 2);
    const resolveUserIds = vi
      .fn<OrgApproverInternals['resolveUserIds']>()
      .mockResolvedValue([1, 2, 3]);

    const mod = await loadHelperWith({ resolveUserIds, isAllowed, sendToUser });

    const result = await mod.sendPushToOrgApprovers(
      99,
      { title: 't', body: 'b' },
      { severity: 'high' },
    );

    expect(result.targeted).toBe(3);
    expect(isAllowed).toHaveBeenCalledTimes(3);
    expect(sendToUser).toHaveBeenCalledTimes(2);
    const userIds = sendToUser.mock.calls.map((c) => c[0]).sort();
    expect(userIds).toEqual([1, 3]);
  });

  it('returns zero counts and never gates / delivers when no approver rows are found', async () => {
    const sendToUser = vi.fn<OrgApproverInternals['sendToUser']>();
    const isAllowed = vi.fn<OrgApproverInternals['isAllowed']>();
    const resolveUserIds = vi
      .fn<OrgApproverInternals['resolveUserIds']>()
      .mockResolvedValue([]);
    const mod = await loadHelperWith({ resolveUserIds, isAllowed, sendToUser });

    const result = await mod.sendPushToOrgApprovers(
      7,
      { title: 't', body: 'b' },
      { severity: 'critical' },
    );

    expect(result).toEqual({ targeted: 0, sent: 0, failed: 0 });
    expect(sendToUser).not.toHaveBeenCalled();
    expect(isAllowed).not.toHaveBeenCalled();
  });

  it('passes the critical severity flag through to the alert-category gate', async () => {
    const isAllowed = vi
      .fn<OrgApproverInternals['isAllowed']>()
      .mockResolvedValue(true);
    const sendToUser = vi
      .fn<OrgApproverInternals['sendToUser']>()
      .mockResolvedValue(noopSendResult);
    const resolveUserIds = vi
      .fn<OrgApproverInternals['resolveUserIds']>()
      .mockResolvedValue([1]);
    const mod = await loadHelperWith({ resolveUserIds, isAllowed, sendToUser });

    await mod.sendPushToOrgApprovers(
      1,
      { title: 't', body: 'b' },
      { severity: 'critical' },
    );
    expect(isAllowed).toHaveBeenCalledWith(1, 'approvals', { severity: 'critical' });
  });

  it('does not fail the whole batch when a single per-user delivery throws', async () => {
    const sendToUser = vi
      .fn<OrgApproverInternals['sendToUser']>()
      .mockImplementation(async (userId: number) => {
        if (userId === 2) throw new Error('boom');
        return noopSendResult;
      });
    const mod = await loadHelperWith({
      resolveUserIds: vi
        .fn<OrgApproverInternals['resolveUserIds']>()
        .mockResolvedValue([1, 2, 3]),
      isAllowed: vi.fn<OrgApproverInternals['isAllowed']>().mockResolvedValue(true),
      sendToUser,
    });

    const result = await mod.sendPushToOrgApprovers(
      1,
      { title: 't', body: 'b' },
      { severity: 'high' },
    );

    expect(result.targeted).toBe(3);
    expect(result.sent).toBe(2);
    expect(sendToUser).toHaveBeenCalledTimes(3);
  });

  it('honors a caller-supplied appIds override (custom subset only)', async () => {
    const resolveUserIds = vi
      .fn<OrgApproverInternals['resolveUserIds']>()
      .mockResolvedValue([]);
    const mod = await loadHelperWith({ resolveUserIds });

    await mod.sendPushToOrgApprovers(
      1,
      { title: 't', body: 'b' },
      { severity: 'high', appIds: ['aegis-mobile'] },
    );

    expect(resolveUserIds).toHaveBeenCalledWith(1, ['aegis-mobile']);
  });

  it('includes the legacy unified-app appId "cortex" in the default app-id family', async () => {
    // Regression guard: szl-holdings-mobile/app/_layout.tsx currently
    // registers push tokens with appId='cortex'. If that legacy id is
    // ever dropped from CORTEX_MOBILE_APP_IDS, real production devices
    // silently stop receiving approval pushes. This test fails loudly
    // if that happens.
    const mod = await import('../lib/expo-push.js');
    expect(mod.CORTEX_MOBILE_APP_IDS).toContain('cortex');
    expect(mod.CORTEX_MOBILE_APP_IDS).toContain('cortex-mobile');
  });

  it('queries push-tokens with the legacy "cortex" appId so unified-app devices are reachable', async () => {
    const resolveUserIds = vi
      .fn<OrgApproverInternals['resolveUserIds']>()
      .mockResolvedValue([777]);
    const sendToUser = vi
      .fn<OrgApproverInternals['sendToUser']>()
      .mockResolvedValue({ sent: true });
    const isAllowed = vi
      .fn<OrgApproverInternals['isAllowed']>()
      .mockResolvedValue(true);
    const mod = await loadHelperWith({
      resolveUserIds,
      sendToUser,
      isAllowed,
    });

    const result = await mod.sendPushToOrgApprovers(
      42,
      { title: 'High-Priority Approval Pending', body: 'x' },
      { severity: 'high' },
    );

    // Default appIds passed to the resolver must include 'cortex' so
    // tokens registered by the current unified mobile app are matched.
    const calledWithAppIds = resolveUserIds.mock.calls[0]![1];
    expect(calledWithAppIds).toContain('cortex');
    expect(result.targeted).toBe(1);
    expect(result.sent).toBe(1);
    expect(sendToUser).toHaveBeenCalledTimes(1);
  });
});
