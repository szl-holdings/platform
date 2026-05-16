/**
 * Tests for the Lexicon reviewer-alert dispatch added in task #4878.
 *
 * Verifies that `notifyLexiconReviewers`:
 *   1. Resolves designated approver users via the
 *      rolesTable / userRolesTable / usersTable join (super_admin, admin,
 *      compliance only, active users only).
 *   2. Inserts one in_app `action_required` notification per approver with
 *      the correct title, message, and `/governance/lexicon` deep link.
 *   3. Publishes a `new_notification` event on the WS NOTIFICATIONS channel
 *      so the global tasks-for-you indicator updates without polling.
 *   4. No-ops gracefully when no approvers are configured.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const insertedRows: Array<Record<string, unknown>> = [];
const publishCalls: Array<{ channel: string; event: string; payload: unknown }> = [];

const ROLE_ROWS_BY_NAME: Record<string, { id: number }> = {
  super_admin: { id: 11 },
  admin: { id: 12 },
  compliance: { id: 13 },
};
let userRoleRows: Array<{ userId: number; roleId: number }> = [];
let activeUserIds: number[] = [];

vi.mock('@szl-holdings/db', () => {
  const rolesTable = { id: 'rolesTable.id', name: 'rolesTable.name' } as const;
  const userRolesTable = {
    userId: 'userRolesTable.userId',
    roleId: 'userRolesTable.roleId',
  } as const;
  const usersTable = { id: 'usersTable.id', isActive: 'usersTable.isActive' } as const;
  const notificationsTable = {
    id: 'notificationsTable.id',
    userId: 'notificationsTable.userId',
  } as const;

  function selectFrom(table: unknown) {
    return {
      where: async (cond: { _kind: string; l?: unknown; r?: unknown }) => {
        // inArray on rolesTable.name
        if (table === rolesTable && cond._kind === 'inArray') {
          const names = (cond.r as string[]) ?? [];
          return names
            .map((n) => ROLE_ROWS_BY_NAME[n])
            .filter((x): x is { id: number } => Boolean(x));
        }
        if (table === userRolesTable && cond._kind === 'inArray') {
          const ids = new Set(cond.r as number[]);
          return userRoleRows.filter((r) => ids.has(r.roleId));
        }
        if (table === usersTable && cond._kind === 'and') {
          // We assume the and() is (inArray(id, [...]), eq(isActive, true)).
          // Filter by activeUserIds.
          return activeUserIds.map((id) => ({ id }));
        }
        return [];
      },
    };
  }

  return {
    db: {
      select: () => ({ from: (t: unknown) => selectFrom(t) }),
      insert: () => ({
        values: (vals: Array<Record<string, unknown>>) => ({
          returning: async () => {
            const rows = vals.map((v, i) => ({
              id: insertedRows.length + i + 1,
              userId: v.userId as number,
            }));
            insertedRows.push(...vals);
            return rows;
          },
        }),
      }),
    },
    rolesTable,
    userRolesTable,
    usersTable,
    notificationsTable,
    notificationPreferencesTable: { userId: 'notificationPreferencesTable.userId' },
  };
});

vi.mock('drizzle-orm', () => ({
  and: (...a: unknown[]) => ({ _kind: 'and', a }),
  eq: (l: unknown, r: unknown) => ({ _kind: 'eq', l, r }),
  inArray: (l: unknown, r: unknown) => ({ _kind: 'inArray', l, r }),
}));

vi.mock('../lib/websocket', () => ({
  publish: (channel: string, event: string, payload: unknown) => {
    publishCalls.push({ channel, event, payload });
  },
  WS_CHANNELS: { NOTIFICATIONS: 'notifications' },
}));

vi.mock('../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('../routes/notifications', () => ({
  dispatchToExternalChannels: vi.fn(async () => undefined),
}));

describe('notifyLexiconReviewers (task #4878)', () => {
  beforeEach(() => {
    insertedRows.length = 0;
    publishCalls.length = 0;
    userRoleRows = [];
    activeUserIds = [];
    vi.resetModules();
  });

  it('inserts one in-app action_required notification per active approver and broadcasts', async () => {
    userRoleRows = [
      { userId: 101, roleId: 11 }, // super_admin
      { userId: 102, roleId: 12 }, // admin
      { userId: 103, roleId: 13 }, // compliance
      { userId: 102, roleId: 13 }, // duplicate (same user multiple roles)
    ];
    activeUserIds = [101, 102, 103];

    const { notifyLexiconReviewers } = await import('../lib/lexicon-notifications');
    const result = await notifyLexiconReviewers({
      reviewRequestId: 'rev-1',
      entryId: 'entry-1',
      targetId: 'meta-llama/Llama-Mystery-7B',
      provider: 'huggingface',
      context: { source: 'inference_gate_checker' },
    });

    expect(result.recipientCount).toBe(3);
    expect(insertedRows).toHaveLength(3);
    for (const row of insertedRows) {
      expect(row.type).toBe('action_required');
      expect(row.channel).toBe('in_app');
      expect(String(row.title)).toContain('meta-llama/Llama-Mystery-7B');
      expect(String(row.message)).toMatch(/license review/i);
      expect(String(row.actionUrl)).toContain('/governance/lexicon');
      expect(String(row.actionUrl)).toContain(
        encodeURIComponent('entry-1'),
      );
    }
    expect(insertedRows.map((r) => r.userId).sort()).toEqual([101, 102, 103]);

    expect(publishCalls).toHaveLength(1);
    expect(publishCalls[0]).toMatchObject({
      channel: 'notifications',
      event: 'new_notification',
      payload: {
        kind: 'lexicon_review_pending',
        reviewRequestId: 'rev-1',
        entryId: 'entry-1',
        targetId: 'meta-llama/Llama-Mystery-7B',
        recipientCount: 3,
      },
    });
  });

  it('returns zero recipients and skips broadcast when no approvers configured', async () => {
    userRoleRows = [];
    activeUserIds = [];

    const { notifyLexiconReviewers } = await import('../lib/lexicon-notifications');
    const result = await notifyLexiconReviewers({
      reviewRequestId: 'rev-2',
      entryId: 'entry-2',
      targetId: 'unknown/model',
    });

    expect(result.recipientCount).toBe(0);
    expect(insertedRows).toHaveLength(0);
    expect(publishCalls).toHaveLength(0);
  });
});
