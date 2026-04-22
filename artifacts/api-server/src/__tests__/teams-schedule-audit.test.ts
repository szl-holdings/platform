/**
 * On-call schedule audit logging coverage (#2533).
 *
 * #2483 wired PUT /teams/:team/schedule, POST .../schedule/overrides, and
 * DELETE .../schedule/overrides/:id to insert into `audit_logs`. Without
 * automated coverage, a future refactor of teams.ts could quietly drop the
 * audit insert and we'd only notice during a real incident review.
 *
 * This file exercises each of the three schedule-mutation endpoints against
 * the real test database and asserts:
 *   - The expected `audit_logs` row exists.
 *   - `actionType`, `entityType`, and `actorUserId` match the operation.
 *   - `payloadJson` contains the team plus the right before/after snapshot
 *     (no before for create/override-create; no after for delete).
 *
 * Plus a negative case: a request that fails body validation (e.g. invalid
 * `memberOrder`) MUST NOT write an audit row.
 *
 * Skipped when DATABASE_URL is not configured (e.g. local without test DB).
 */

import { randomUUID } from 'node:crypto';
import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const HAS_DB = Boolean(process.env.DATABASE_URL);
const d = HAS_DB ? describe : describe.skip;

// ---------------------------------------------------------------------------
// Auth mock — inject a real persisted admin user as req.user, so audit rows
// have a non-null actorUserId we can assert. The user id is patched in
// beforeAll once the DB row is created.
// ---------------------------------------------------------------------------

const mockAuthUser = {
  id: 0,
  displayName: 'schedule-audit-test-admin',
  email: 'schedule-audit-test@example.com',
  roles: ['admin'] as string[],
  orgs: [] as Array<unknown>,
};

// Mirror the production InvalidIdError so the route's `instanceof` check
// matches and unrecognized override ids correctly map to 400.
class MockInvalidIdError extends Error {}

vi.mock('../middlewares/auth.js', () => ({
  authMiddleware: (_opts?: unknown) => (req: Request, _res: Response, next: NextFunction) => {
    (req as unknown as { user: typeof mockAuthUser }).user = mockAuthUser;
    next();
  },
  requireRole: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  requireAnyAuth: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  denyIfReadOnly: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  requireOrgMembership: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  InvalidIdError: MockInvalidIdError,
  parseIdParam: (raw: string) => {
    const n = Number(raw);
    if (!Number.isInteger(n) || n <= 0) {
      // Throw the same class the route catches via `instanceof InvalidIdError`
      // so the route maps it to a 400, matching production behavior.
      throw new MockInvalidIdError('invalid id');
    }
    return n;
  },
}));

// Sliding window limiters are no-ops in tests so we don't trip rate limits
// when running back-to-back operations.
vi.mock('../middlewares/sliding-window-limiter.js', () => ({
  perUserApiSlidingLimiter: (_req: Request, _res: Response, next: NextFunction) => next(),
  perUserWriteSlidingLimiter: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

async function bootApp() {
  const { default: teamsRouter } = await import('../routes/teams.js');
  const app = express();
  app.use(express.json());
  app.use('/api', teamsRouter);
  return app;
}

d('On-call schedule mutations write audit_logs rows (#2533)', () => {
  const runId = randomUUID().slice(0, 8);
  const TEAM = `audit-test-team-${runId}`;

  let actorUserId = 0;
  let memberAUserId = 0;
  let memberBUserId = 0;

  beforeAll(async () => {
    const { db, usersTable } = await import('@szl-holdings/db');
    const { sql } = await import('drizzle-orm');

    // The shared test DB schema in this workspace lags behind a few newer
    // tables (on-call rotation store from #2432). Create them defensively
    // if missing so this test is hermetic and doesn't depend on whether
    // `drizzle-kit push` has been run against the test DB. Mirrors the
    // shapes in `lib/db/src/schema/on_call.ts`.
    await db.execute(
      sql.raw(`
      CREATE TABLE IF NOT EXISTS on_call_schedules (
        id serial PRIMARY KEY,
        team text NOT NULL,
        rotation_interval_hours integer NOT NULL DEFAULT 168,
        member_order jsonb NOT NULL DEFAULT '[]'::jsonb,
        handoff_anchor timestamptz NOT NULL DEFAULT now(),
        timezone text NOT NULL DEFAULT 'UTC',
        warning_minutes integer NOT NULL DEFAULT 30,
        updated_by integer REFERENCES users(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS on_call_schedules_team_unique
        ON on_call_schedules (team);
      CREATE TABLE IF NOT EXISTS on_call_shifts (
        id serial PRIMARY KEY,
        team text NOT NULL,
        user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        kind text NOT NULL DEFAULT 'override',
        start_at timestamptz NOT NULL,
        end_at timestamptz NOT NULL,
        note text,
        created_by integer REFERENCES users(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS on_call_shifts_team_range_idx
        ON on_call_shifts (team, start_at, end_at);
    `),
    );

    const [actor] = await db
      .insert(usersTable)
      .values({
        email: `schedule-audit-actor-${runId}@example.com`,
        displayName: `audit-actor-${runId}`,
        team: TEAM,
        platformRole: 'platform_admin',
        isActive: true,
      })
      .returning();
    actorUserId = actor?.id;
    mockAuthUser.id = actorUserId;

    const [memberA] = await db
      .insert(usersTable)
      .values({
        email: `schedule-audit-member-a-${runId}@example.com`,
        displayName: `audit-member-a-${runId}`,
        team: TEAM,
        isActive: true,
      })
      .returning();
    memberAUserId = memberA?.id;

    const [memberB] = await db
      .insert(usersTable)
      .values({
        email: `schedule-audit-member-b-${runId}@example.com`,
        displayName: `audit-member-b-${runId}`,
        team: TEAM,
        isActive: true,
      })
      .returning();
    memberBUserId = memberB?.id;
  });

  afterAll(async () => {
    const { db, usersTable, onCallShiftsTable, onCallSchedulesTable, auditLogsTable } =
      await import('@szl-holdings/db');
    const { eq, inArray } = await import('drizzle-orm');

    // Delete schedule + shift rows (FK cascade for shifts via user).
    await db.delete(onCallSchedulesTable).where(eq(onCallSchedulesTable.team, TEAM));
    await db.delete(onCallShiftsTable).where(eq(onCallShiftsTable.team, TEAM));

    // Audit rows we inserted are namespaced by entity ids that are gone now.
    // Purge by actorUserId match before tearing down the user (which would
    // null actor_user_id via FK ON DELETE SET NULL anyway, but cleaner this way).
    if (actorUserId) {
      await db.delete(auditLogsTable).where(eq(auditLogsTable.actorUserId, actorUserId));
    }

    const ids = [actorUserId, memberAUserId, memberBUserId].filter((n) => n > 0);
    if (ids.length > 0) {
      await db.delete(usersTable).where(inArray(usersTable.id, ids));
    }
  });

  /**
   * Look up the most-recent audit row matching an action/entity tuple,
   * always scoped to THIS test's actor so concurrent runs against the
   * same DB can't accidentally match each other's rows.
   */
  async function findAudit(actionType: string, entityType: string, entityId?: string) {
    const { db, auditLogsTable } = await import('@szl-holdings/db');
    const { and, desc, eq } = await import('drizzle-orm');
    const predicates = [
      eq(auditLogsTable.actionType, actionType),
      eq(auditLogsTable.entityType, entityType),
      eq(auditLogsTable.actorUserId, actorUserId),
    ];
    if (entityId) predicates.push(eq(auditLogsTable.entityId, entityId));
    const [row] = await db
      .select()
      .from(auditLogsTable)
      .where(and(...predicates))
      .orderBy(desc(auditLogsTable.id))
      .limit(1);
    return row ?? null;
  }

  let createdScheduleAuditEntityId: string | null = null;
  let createdOverrideId: number | null = null;

  it('PUT /teams/:team/schedule writes an `on_call_schedule.created` audit row', async () => {
    const app = await bootApp();

    const handoffAnchor = new Date('2026-01-01T00:00:00.000Z').toISOString();
    const memberOrder = [memberAUserId, memberBUserId];

    const res = await request(app)
      .put(`/api/teams/${encodeURIComponent(TEAM)}/schedule`)
      .send({
        rotationIntervalHours: 24,
        memberOrder,
        handoffAnchor,
        timezone: 'UTC',
        warningMinutes: 15,
      });
    expect(res.status).toBe(200);

    const audit = await findAudit('on_call_schedule.created', 'on_call_schedule');
    expect(audit).not.toBeNull();
    expect(audit?.actorUserId).toBe(actorUserId);
    expect(audit?.entityType).toBe('on_call_schedule');
    expect(audit?.entityId).toBeTruthy();
    createdScheduleAuditEntityId = audit?.entityId!;

    const payload = audit?.payloadJson as {
      team: string;
      _before?: unknown;
      _after?: {
        rotationIntervalHours: number;
        memberOrder: number[];
        timezone: string;
        warningMinutes: number;
        updatedBy: number;
      };
    };
    expect(payload.team).toBe(TEAM);
    // No "before" snapshot for a create.
    expect(payload._before === null || payload._before === undefined).toBe(true);
    expect(payload._after).toBeDefined();
    expect(payload._after?.rotationIntervalHours).toBe(24);
    expect(payload._after?.memberOrder).toEqual(memberOrder);
    expect(payload._after?.timezone).toBe('UTC');
    expect(payload._after?.warningMinutes).toBe(15);
    expect(payload._after?.updatedBy).toBe(actorUserId);
  });

  it('PUT /teams/:team/schedule (second call) writes an `on_call_schedule.updated` audit row with before/after diff', async () => {
    const app = await bootApp();

    const handoffAnchor = new Date('2026-02-01T00:00:00.000Z').toISOString();
    const memberOrder = [memberBUserId, memberAUserId]; // reversed
    const res = await request(app)
      .put(`/api/teams/${encodeURIComponent(TEAM)}/schedule`)
      .send({
        rotationIntervalHours: 12,
        memberOrder,
        handoffAnchor,
        timezone: 'America/Los_Angeles',
        warningMinutes: 45,
      });
    expect(res.status).toBe(200);

    const audit = await findAudit(
      'on_call_schedule.updated',
      'on_call_schedule',
      createdScheduleAuditEntityId ?? undefined,
    );
    expect(audit).not.toBeNull();
    expect(audit?.actorUserId).toBe(actorUserId);

    const payload = audit?.payloadJson as {
      team: string;
      _before: {
        rotationIntervalHours: number;
        memberOrder: number[];
        timezone: string;
        warningMinutes: number;
      };
      _after: {
        rotationIntervalHours: number;
        memberOrder: number[];
        timezone: string;
        warningMinutes: number;
      };
    };
    expect(payload.team).toBe(TEAM);
    // Before snapshot is the originally-created row.
    expect(payload._before).toBeDefined();
    expect(payload._before.rotationIntervalHours).toBe(24);
    expect(payload._before.memberOrder).toEqual([memberAUserId, memberBUserId]);
    expect(payload._before.timezone).toBe('UTC');
    expect(payload._before.warningMinutes).toBe(15);
    // After snapshot is the new values.
    expect(payload._after.rotationIntervalHours).toBe(12);
    expect(payload._after.memberOrder).toEqual(memberOrder);
    expect(payload._after.timezone).toBe('America/Los_Angeles');
    expect(payload._after.warningMinutes).toBe(45);
  });

  it('POST /teams/:team/schedule/overrides writes an `on_call_override.created` audit row', async () => {
    const app = await bootApp();

    const startAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const endAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const note = `audit-override-${runId}`;
    const res = await request(app)
      .post(`/api/teams/${encodeURIComponent(TEAM)}/schedule/overrides`)
      .send({ userId: memberAUserId, startAt, endAt, note });
    expect(res.status).toBe(200);

    // Pull the override id back out of the response so the audit lookup is
    // exact rather than relying on "the most recent" semantics.
    const overrideRow = (
      res.body as { overrides?: Array<{ id: number; note: string | null }> }
    ).overrides?.find((o) => o.note === note);
    expect(overrideRow, 'expected override to surface in response').toBeDefined();
    createdOverrideId = overrideRow?.id;

    const audit = await findAudit(
      'on_call_override.created',
      'on_call_override',
      String(createdOverrideId),
    );
    expect(audit).not.toBeNull();
    expect(audit?.actorUserId).toBe(actorUserId);
    expect(audit?.entityType).toBe('on_call_override');
    expect(audit?.entityId).toBe(String(createdOverrideId));

    const payload = audit?.payloadJson as {
      team: string;
      _before?: unknown;
      _after: {
        userId: number;
        kind: string;
        startAt: string;
        endAt: string;
        note: string | null;
        createdBy: number;
      };
    };
    expect(payload.team).toBe(TEAM);
    expect(payload._before === null || payload._before === undefined).toBe(true);
    expect(payload._after.userId).toBe(memberAUserId);
    expect(payload._after.kind).toBe('override');
    expect(new Date(payload._after.startAt).toISOString()).toBe(startAt);
    expect(new Date(payload._after.endAt).toISOString()).toBe(endAt);
    expect(payload._after.note).toBe(note);
    expect(payload._after.createdBy).toBe(actorUserId);
  });

  it('DELETE /teams/:team/schedule/overrides/:id writes an `on_call_override.deleted` audit row with the before snapshot', async () => {
    expect(createdOverrideId).not.toBeNull();
    const app = await bootApp();

    const res = await request(app).delete(
      `/api/teams/${encodeURIComponent(TEAM)}/schedule/overrides/${createdOverrideId}`,
    );
    expect(res.status).toBe(200);

    const audit = await findAudit(
      'on_call_override.deleted',
      'on_call_override',
      String(createdOverrideId),
    );
    expect(audit).not.toBeNull();
    expect(audit?.actorUserId).toBe(actorUserId);
    expect(audit?.entityId).toBe(String(createdOverrideId));

    const payload = audit?.payloadJson as {
      team: string;
      _before: { userId: number; kind: string; note: string | null; createdBy: number };
      _after?: unknown;
    };
    expect(payload.team).toBe(TEAM);
    expect(payload._before).toBeDefined();
    expect(payload._before.userId).toBe(memberAUserId);
    expect(payload._before.kind).toBe('override');
    expect(payload._before.note).toBe(`audit-override-${runId}`);
    expect(payload._before.createdBy).toBe(actorUserId);
    // Delete has no "after" snapshot.
    expect(payload._after === null || payload._after === undefined).toBe(true);
  });

  it('Failed validation does NOT write an audit row', async () => {
    const app = await bootApp();
    const { db, auditLogsTable } = await import('@szl-holdings/db');
    const { eq, and, gt } = await import('drizzle-orm');

    // Snapshot the highest audit id touched by THIS actor before the bad
    // request so we can assert nothing new appeared after it.
    const beforeRows = await db
      .select({ id: auditLogsTable.id })
      .from(auditLogsTable)
      .where(eq(auditLogsTable.actorUserId, actorUserId));
    const maxBefore = beforeRows.reduce((m, r) => (r.id > m ? r.id : m), 0);

    // Invalid memberOrder (contains a non-integer) → 400 from the route.
    const res = await request(app)
      .put(`/api/teams/${encodeURIComponent(TEAM)}/schedule`)
      .send({
        rotationIntervalHours: 24,
        memberOrder: ['not-a-number'],
        handoffAnchor: new Date().toISOString(),
        timezone: 'UTC',
      });
    expect(res.status).toBe(400);

    const newer = await db
      .select({ id: auditLogsTable.id, actionType: auditLogsTable.actionType })
      .from(auditLogsTable)
      .where(and(eq(auditLogsTable.actorUserId, actorUserId), gt(auditLogsTable.id, maxBefore)));
    // No new audit row from this actor since the failed request.
    expect(newer).toEqual([]);
  });
});
