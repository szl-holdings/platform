/**
 * /teams — Team directory + paging (#2301) + real on-call schedules (#2432).
 *
 * Powers the clickable team pills on the deployments operator console.
 * Lets on-call jump from "App X is owned by team Y" to a roster showing
 * who's on that team, who is currently on-call, who to escalate to, and
 * a one-click "page this team" action that drops a notification into the
 * on-call user's inbox + opens the configured external channels.
 *
 * On-call resolution order (see {@link resolveOnCall}):
 *   1. Active override / shift in `on_call_shifts` whose [start_at, end_at)
 *      brackets `now`. Most-recently-created row wins on overlap.
 *   2. Configured rotation in `on_call_schedules` (member_order +
 *      rotation_interval_hours + handoff_anchor) walked deterministically.
 *   3. Legacy weekly auto-rotation across active members (id-sorted).
 *
 * Routes:
 *   GET    /teams/:team                       — directory: members, on-call, escalation, owned apps
 *   POST   /teams/:team/page                  — page the on-call (in-app notification + external dispatch)
 *   GET    /teams/:team/schedule              — schedule config + upcoming overrides
 *   PUT    /teams/:team/schedule              — upsert rotation config (admin)
 *   POST   /teams/:team/schedule/overrides    — add a one-off override (admin)
 *   DELETE /teams/:team/schedule/overrides/:id — remove an override (admin)
 */

import { bodyShape } from '@szl-holdings/contracts/common';
import {
  appsRegistryTable,
  auditLogsTable,
  db,
  notificationPreferencesTable,
  notificationsTable,
  type OnCallSchedule,
  type OnCallShift,
  onCallSchedulesTable,
  onCallShiftsTable,
  PLATFORM_ROLE_HIERARCHY,
  type PlatformRole,
  teamPagesTable,
  usersTable,
} from '@szl-holdings/db';
import { and, asc, desc, eq, gte, inArray, lte } from 'drizzle-orm';
import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import {
  handleRouteError,
  sendBadRequest,
  sendForbidden,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';
import { logger } from '../lib/logger';
import { validateBody } from '../lib/validation';
import { publish, WS_CHANNELS } from '../lib/websocket';
import {
  authMiddleware,
  denyIfReadOnly,
  InvalidIdError,
  parseIdParam,
  requireRole,
} from '../middlewares/auth';
import {
  perUserApiSlidingLimiter,
  perUserWriteSlidingLimiter,
} from '../middlewares/sliding-window-limiter';
import { dispatchToExternalChannels } from './notifications';

const router: IRouter = Router();

export interface TeamMember {
  id: number;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  platformRole: string | null;
  isActive: boolean;
}

export interface TeamOwnedApp {
  slug: string;
  name: string;
}

export type OnCallSource = 'override' | 'rotation' | 'fallback' | 'none';

export interface TeamDetail {
  team: string;
  members: TeamMember[];
  /** Currently on-call member resolved from the schedule store. */
  onCall: TeamMember | null;
  /** How {@link onCall} was selected — useful for surfacing "OVERRIDE" in UI. */
  onCallSource: OnCallSource;
  /** Highest-privilege active member; the person to escalate to. */
  escalation: TeamMember | null;
  ownedApps: TeamOwnedApp[];
  count: number;
}

/**
 * Walk a configured rotation: pick the member at slot `floor((now - anchor) /
 * interval) mod order.length`, skipping users who are no longer active team
 * members. Returns null if no active candidate could be found in the order.
 */
function pickFromRotation(
  order: number[],
  intervalHours: number,
  anchor: Date,
  active: TeamMember[],
  now: Date,
): TeamMember | null {
  if (order.length === 0 || intervalHours <= 0) return null;
  const activeById = new Map(active.map((m) => [m.id, m]));
  const intervalMs = intervalHours * 60 * 60 * 1000;
  const elapsed = now.getTime() - anchor.getTime();
  // Negative elapsed (anchor in the future) is fine — we still want a stable
  // slot; the modulo handles it.
  const rawSlot = Math.floor(elapsed / intervalMs);
  const len = order.length;
  // Walk forward up to `len` slots so we tolerate users dropped from the team
  // since the schedule was configured.
  for (let step = 0; step < len; step++) {
    const idx = (((rawSlot + step) % len) + len) % len;
    const candidateId = order[idx]!;
    const candidate = activeById.get(candidateId);
    if (candidate) return candidate;
  }
  return null;
}

/**
 * Legacy deterministic on-call from the active member roster, used as the
 * fallback when no schedule row is configured. Members are id-sorted so the
 * result is identical across instances regardless of query result ordering.
 */
function pickFallbackOnCall(active: TeamMember[], now: Date): TeamMember | null {
  if (active.length === 0) return null;
  const sorted = [...active].sort((a, b) => a.id - b.id);
  const weekIndex = Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000));
  const idx = ((weekIndex % sorted.length) + sorted.length) % sorted.length;
  return sorted[idx]!;
}

/**
 * Pick the highest-privilege active member as the escalation contact.
 * Falls back to the on-call when no member has a platform role configured.
 */
function pickEscalation(active: TeamMember[], onCall: TeamMember | null): TeamMember | null {
  if (active.length === 0) return null;
  const ranked = active
    .map((m) => ({
      m,
      rank: m.platformRole ? (PLATFORM_ROLE_HIERARCHY[m.platformRole as PlatformRole] ?? -1) : -1,
    }))
    .sort((a, b) => b.rank - a.rank || a.m.id - b.m.id);
  const top = ranked[0];
  if (!top || top.rank < 0) return onCall;
  return top.m;
}

/**
 * Resolve who is on-call right now for a team, honoring overrides and the
 * configured rotation before falling back to the legacy weekly pick.
 */
export async function resolveOnCall(
  team: string,
  members: TeamMember[],
  now: Date,
): Promise<{ onCall: TeamMember | null; source: OnCallSource; schedule: OnCallSchedule | null }> {
  const memberById = new Map(members.map((m) => [m.id, m]));
  const active = members.filter((m) => m.isActive);

  // 1. Active override / shift wins.
  const activeShifts = await db
    .select()
    .from(onCallShiftsTable)
    .where(
      and(
        eq(onCallShiftsTable.team, team),
        lte(onCallShiftsTable.startAt, now),
        gte(onCallShiftsTable.endAt, now),
      ),
    )
    .orderBy(desc(onCallShiftsTable.createdAt))
    .limit(10);
  for (const s of activeShifts) {
    const m = memberById.get(s.userId);
    // Only honor if the user is still on the team (active or not — explicit
    // overrides override even the active-only filter, since an admin chose
    // them deliberately).
    if (m) return { onCall: m, source: 'override', schedule: null };
  }

  // 2. Configured rotation.
  const [schedule] = await db
    .select()
    .from(onCallSchedulesTable)
    .where(eq(onCallSchedulesTable.team, team))
    .limit(1);
  if (schedule && schedule.memberOrder.length > 0 && schedule.rotationIntervalHours > 0) {
    const picked = pickFromRotation(
      schedule.memberOrder,
      schedule.rotationIntervalHours,
      schedule.handoffAnchor,
      active,
      now,
    );
    if (picked) return { onCall: picked, source: 'rotation', schedule };
  }

  // 3. Legacy fallback.
  const fallback = pickFallbackOnCall(active, now);
  return {
    onCall: fallback,
    source: fallback ? 'fallback' : 'none',
    schedule: schedule ?? null,
  };
}

async function loadTeam(team: string, now: Date = new Date()): Promise<TeamDetail | null> {
  const memberRows = await db
    .select({
      id: usersTable.id,
      displayName: usersTable.displayName,
      email: usersTable.email,
      avatarUrl: usersTable.avatarUrl,
      platformRole: usersTable.platformRole,
      isActive: usersTable.isActive,
    })
    .from(usersTable)
    .where(eq(usersTable.team, team))
    .orderBy(asc(usersTable.displayName));

  const appRows = await db
    .select({ slug: appsRegistryTable.slug, name: appsRegistryTable.name })
    .from(appsRegistryTable)
    .where(eq(appsRegistryTable.ownerTeam, team));

  if (memberRows.length === 0 && appRows.length === 0) {
    return null;
  }

  const members: TeamMember[] = memberRows.map((r) => ({
    id: r.id,
    displayName: r.displayName,
    email: r.email,
    avatarUrl: r.avatarUrl,
    platformRole: r.platformRole,
    isActive: r.isActive,
  }));

  const { onCall, source } = await resolveOnCall(team, members, now);
  const active = members.filter((m) => m.isActive);
  const escalation = pickEscalation(active, onCall);

  return {
    team,
    members,
    onCall,
    onCallSource: source,
    escalation,
    ownedApps: appRows.map((a) => ({ slug: a.slug, name: a.name })),
    count: members.length,
  };
}

export interface TeamScheduleSummary {
  team: string;
  memberCount: number;
  ownedApps: TeamOwnedApp[];
  currentOnCall: TeamMember | null;
  currentOnCallSource: OnCallSource;
  escalation: TeamMember | null;
  schedule: {
    rotationIntervalHours: number;
    memberOrder: number[];
    handoffAnchor: string;
    timezone: string;
  } | null;
  upcomingHandoffs: Array<{ at: string; userId: number; displayName: string }>;
  overrides: Array<{
    id: number;
    userId: number;
    displayName: string;
    startAt: string;
    endAt: string;
    note: string | null;
    kind: 'override' | 'shift';
  }>;
}

/**
 * Cross-team on-call snapshot — powers the unified on-call center page so
 * operators can see who's on-call across every team in a single fetch
 * instead of N×`/teams/:team/schedule` round-trips. Includes the next 7
 * days of rotation handoffs and any active or upcoming overrides per team
 * so the UI can render an agenda timeline.
 *
 * MUST be registered before `GET /teams/:team` since Express matches
 * routes in registration order — otherwise `:team` would swallow
 * "schedules".
 */
router.get(
  '/teams/schedules',
  authMiddleware({ required: false }),
  perUserApiSlidingLimiter,
  async (_req: Request, res: Response) => {
    try {
      const now = new Date();
      const horizonHours = 7 * 24;
      const horizon = new Date(now.getTime() + horizonHours * 60 * 60 * 1000);

      const [userTeamRows, appTeamRows, scheduleTeamRows] = await Promise.all([
        db.selectDistinct({ team: usersTable.team }).from(usersTable),
        db.selectDistinct({ team: appsRegistryTable.ownerTeam }).from(appsRegistryTable),
        db.selectDistinct({ team: onCallSchedulesTable.team }).from(onCallSchedulesTable),
      ]);

      const teamSet = new Set<string>();
      for (const r of userTeamRows) {
        const t = (r.team ?? '').trim();
        if (t) teamSet.add(t);
      }
      for (const r of appTeamRows) {
        const t = (r.team ?? '').trim();
        if (t) teamSet.add(t);
      }
      for (const r of scheduleTeamRows) {
        const t = (r.team ?? '').trim();
        if (t) teamSet.add(t);
      }
      const teams = Array.from(teamSet).sort((a, b) => a.localeCompare(b));

      const summaries = await Promise.all(
        teams.map(async (team): Promise<TeamScheduleSummary | null> => {
          const detail = await loadTeam(team, now);
          if (!detail) return null;

          const [schedule] = await db
            .select()
            .from(onCallSchedulesTable)
            .where(eq(onCallSchedulesTable.team, team))
            .limit(1);

          const overrideRows = await db
            .select()
            .from(onCallShiftsTable)
            .where(
              and(
                eq(onCallShiftsTable.team, team),
                gte(onCallShiftsTable.endAt, now),
                lte(onCallShiftsTable.startAt, horizon),
              ),
            )
            .orderBy(asc(onCallShiftsTable.startAt))
            .limit(50);

          const handoffs: TeamScheduleSummary['upcomingHandoffs'] = [];
          if (schedule && schedule.memberOrder.length > 0 && schedule.rotationIntervalHours > 0) {
            const intervalMs = schedule.rotationIntervalHours * 60 * 60 * 1000;
            const anchorMs = schedule.handoffAnchor.getTime();
            const elapsed = now.getTime() - anchorMs;
            const nextSlot = Math.floor(elapsed / intervalMs) + 1;
            const active = detail.members.filter((m) => m.isActive);
            const activeById = new Map(active.map((m) => [m.id, m]));
            const len = schedule.memberOrder.length;
            // Cap iterations so a misconfigured tiny interval can't spin
            // forever; 200 slots covers a 7-day window with a 1h rotation.
            for (let i = 0; i < 200 && handoffs.length < 50; i++) {
              const slot = nextSlot + i;
              const at = new Date(anchorMs + slot * intervalMs);
              if (at.getTime() > horizon.getTime()) break;
              if (at.getTime() <= now.getTime()) continue;
              let picked: TeamMember | null = null;
              for (let step = 0; step < len; step++) {
                const idx = (((slot + step) % len) + len) % len;
                const id = schedule.memberOrder[idx]!;
                const m = activeById.get(id);
                if (m) {
                  picked = m;
                  break;
                }
              }
              if (picked) {
                handoffs.push({
                  at: at.toISOString(),
                  userId: picked.id,
                  displayName: picked.displayName,
                });
              }
            }
          }

          return {
            team,
            memberCount: detail.count,
            ownedApps: detail.ownedApps,
            currentOnCall: detail.onCall,
            currentOnCallSource: detail.onCallSource,
            escalation: detail.escalation,
            schedule: schedule
              ? {
                  rotationIntervalHours: schedule.rotationIntervalHours,
                  memberOrder: schedule.memberOrder,
                  handoffAnchor: schedule.handoffAnchor.toISOString(),
                  timezone: schedule.timezone,
                }
              : null,
            upcomingHandoffs: handoffs,
            overrides: overrideRows.map((o) => ({
              id: o.id,
              userId: o.userId,
              displayName:
                detail.members.find((m) => m.id === o.userId)?.displayName ?? `User #${o.userId}`,
              startAt: o.startAt.toISOString(),
              endAt: o.endAt.toISOString(),
              note: o.note,
              kind: o.kind as 'override' | 'shift',
            })),
          };
        }),
      );

      const filtered = summaries.filter((s): s is TeamScheduleSummary => s !== null);
      return sendSuccess(res, {
        generatedAt: now.toISOString(),
        horizonHours,
        count: filtered.length,
        teams: filtered,
      });
    } catch (err) {
      return handleRouteError(res, err, 'GET /teams/schedules');
    }
  },
);

router.get(
  '/teams/:team',
  authMiddleware({ required: false }),
  perUserApiSlidingLimiter,
  async (req: Request, res: Response) => {
    try {
      const team = decodeURIComponent((req.params as { team: string }).team).trim();
      if (!team) return sendBadRequest(res, 'team is required');
      const detail = await loadTeam(team);
      if (!detail) return sendNotFound(res, `Team '${team}'`);
      return sendSuccess(res, detail);
    } catch (err) {
      return handleRouteError(res, err, `GET /teams/${req.params.team}`);
    }
  },
);

/**
 * Page the on-call for a team. Drops an in-app notification (gated on the
 * recipient's `inAppEnabled` preference, default on) and fires external
 * channels (email/sms/slack) per their per-channel preferences.
 *
 * Body: { message?: string, urgency?: "info" | "warning" | "critical" }
 *
 * The actor is always taken from the authenticated principal — no spoofing
 * of "who paged whom" via the request body.
 */
router.post(
  '/teams/:team/page',
  authMiddleware({ required: true }),
  denyIfReadOnly(),
  perUserWriteSlidingLimiter,
  validateBody(
    bodyShape({
      message: z.unknown().optional(),
      urgency: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const team = decodeURIComponent((req.params as { team: string }).team).trim();
      if (!team) return sendBadRequest(res, 'team is required');
      const detail = await loadTeam(team);
      if (!detail) return sendNotFound(res, `Team '${team}'`);
      if (!detail.onCall) {
        return sendBadRequest(res, `Team '${team}' has no active members to page`);
      }

      const body = (req.body ?? {}) as { message?: string; urgency?: string };
      const note = typeof body.message === 'string' ? body.message.trim().slice(0, 500) : '';
      const urgencyRaw = typeof body.urgency === 'string' ? body.urgency.toLowerCase() : 'warning';
      // Map the operator-facing urgency vocabulary onto the notifications
      // table's `type` enum. "critical" → "error" so it shows in red.
      const urgency: 'info' | 'warning' | 'critical' =
        urgencyRaw === 'critical' || urgencyRaw === 'info' ? urgencyRaw : 'warning';
      const notifType: 'info' | 'warning' | 'error' = urgency === 'critical' ? 'error' : urgency;

      const actor = req.user!;
      const actorName = actor.displayName ?? actor.email ?? `user#${actor.id}`;

      // Don't page yourself — if the caller IS the on-call, that's a no-op
      // we report explicitly instead of inserting a useless self-notification.
      if (detail.onCall.id === actor.id) {
        return sendSuccess(res, {
          paged: false,
          reason: 'actor_is_oncall',
          team,
          onCall: detail.onCall,
        });
      }

      const appUrl = process.env.APP_URL ?? process.env.VITE_APP_URL ?? '';
      const actionUrl = `${appUrl}/command/operations/deployments`;
      const title = `Page from ${actorName} · ${team}`;
      const message = note
        ? `${actorName} paged the ${team} on-call: ${note}`
        : `${actorName} paged the ${team} on-call.`;

      // Duplicate-page suppression (#2468): if this same actor paged this
      // same recipient at this same urgency within the last DUPE_WINDOW_MS,
      // collapse it into the original page instead of creating a new in-app
      // row and re-firing external channels. The audit row is still
      // appended below (flagged `mutedAsDuplicate`) so the recent-pages
      // history is complete.
      const DUPE_WINDOW_MS = 5 * 60 * 1000;
      const windowStart = new Date(Date.now() - DUPE_WINDOW_MS);
      const [recentDup] = await db
        .select({ id: teamPagesTable.id, createdAt: teamPagesTable.createdAt })
        .from(teamPagesTable)
        .where(
          and(
            eq(teamPagesTable.team, team),
            eq(teamPagesTable.actorId, actor.id),
            eq(teamPagesTable.recipientId, detail.onCall.id),
            eq(teamPagesTable.urgency, urgency),
            eq(teamPagesTable.mutedAsDuplicate, false),
            gte(teamPagesTable.createdAt, windowStart),
          ),
        )
        .orderBy(desc(teamPagesTable.createdAt))
        .limit(1);

      const isDuplicate = !!recentDup;
      let inAppOn = true;
      let notificationId = 0;

      if (!isDuplicate) {
        const [pref] = await db
          .select({
            userId: notificationPreferencesTable.userId,
            inAppEnabled: notificationPreferencesTable.inAppEnabled,
          })
          .from(notificationPreferencesTable)
          .where(eq(notificationPreferencesTable.userId, detail.onCall.id))
          .limit(1);
        inAppOn = pref ? pref.inAppEnabled : true;

        if (inAppOn) {
          const [notif] = await db
            .insert(notificationsTable)
            .values({
              userId: detail.onCall.id,
              type: notifType,
              channel: 'in_app',
              title,
              message,
              actionUrl,
            })
            .returning();
          if (notif) {
            notificationId = notif.id;
            publish(WS_CHANNELS.NOTIFICATIONS, 'new_notification', notif);
          }
        }

        void dispatchToExternalChannels({
          notificationId,
          userId: detail.onCall.id,
          type: notifType,
          title,
          message,
          actionUrl,
        });
      } else {
        // Muted: do not insert a notification, do not re-dispatch external
        // channels. inAppDelivered stays false on the audit row.
        inAppOn = false;
      }

      // Append to the audit history so a third-party operator can see the
      // page later in the team detail modal. Self-paged no-ops (handled
      // above) never reach this point so they never pollute the history.
      // Muted duplicates ARE recorded (flagged) so noisy pagers stay visible.
      try {
        await db.insert(teamPagesTable).values({
          team,
          actorId: actor.id,
          recipientId: detail.onCall.id,
          urgency,
          message: note ? note : null,
          inAppDelivered: inAppOn,
          mutedAsDuplicate: isDuplicate,
          duplicateOfPageId: isDuplicate ? recentDup?.id : null,
        });
      } catch (auditErr) {
        // The page itself succeeded — do not fail the request because the
        // audit insert blew up. Log loudly so it gets noticed.
        logger.error(
          { err: auditErr, team, onCallUserId: detail.onCall.id, actorId: actor.id },
          'Failed to record team_pages audit row',
        );
      }

      logger.info(
        {
          team,
          onCallUserId: detail.onCall.id,
          actorId: actor.id,
          urgency,
          inAppDelivered: inAppOn,
          mutedAsDuplicate: isDuplicate,
          duplicateOfPageId: isDuplicate ? recentDup?.id : null,
        },
        isDuplicate ? 'Team page muted as duplicate' : 'Team paged',
      );

      return sendSuccess(res, {
        paged: !isDuplicate,
        reason: isDuplicate ? 'muted_duplicate' : undefined,
        team,
        onCall: detail.onCall,
        urgency,
        inAppDelivered: inAppOn,
        mutedAsDuplicate: isDuplicate,
        duplicateOfPageId: isDuplicate ? recentDup?.id : null,
      });
    } catch (err) {
      return handleRouteError(res, err, `POST /teams/${req.params.team}/page`);
    }
  },
);

export interface TeamPageHistoryEntry {
  id: number;
  team: string;
  urgency: 'info' | 'warning' | 'critical';
  message: string | null;
  inAppDelivered: boolean;
  mutedAsDuplicate: boolean;
  duplicateOfPageId: number | null;
  createdAt: string;
  actor: { id: number; displayName: string; email: string | null; avatarUrl: string | null } | null;
  recipient: {
    id: number;
    displayName: string;
    email: string | null;
    avatarUrl: string | null;
  } | null;
}

/**
 * Recent paging history for a team — powers the audit timeline in the team
 * detail modal so on-call can spot noisy alerts and confirm reach.
 *
 * Capped at the last 10 events (newest first). Self-paged no-ops are
 * never written to the audit table so they never appear here.
 */
router.get(
  '/teams/:team/pages',
  authMiddleware({ required: false }),
  perUserApiSlidingLimiter,
  async (req: Request, res: Response) => {
    try {
      const team = decodeURIComponent((req.params as { team: string }).team).trim();
      if (!team) return sendBadRequest(res, 'team is required');

      // Hand-rolled join: select the page rows then resolve actor/recipient
      // user summaries in two batched lookups. Keeps drizzle types simple
      // and avoids accidentally returning sensitive user columns.
      const pageRows = await db
        .select({
          id: teamPagesTable.id,
          team: teamPagesTable.team,
          actorId: teamPagesTable.actorId,
          recipientId: teamPagesTable.recipientId,
          urgency: teamPagesTable.urgency,
          message: teamPagesTable.message,
          inAppDelivered: teamPagesTable.inAppDelivered,
          mutedAsDuplicate: teamPagesTable.mutedAsDuplicate,
          duplicateOfPageId: teamPagesTable.duplicateOfPageId,
          createdAt: teamPagesTable.createdAt,
        })
        .from(teamPagesTable)
        .where(eq(teamPagesTable.team, team))
        .orderBy(desc(teamPagesTable.createdAt))
        .limit(10);

      const userIds = Array.from(
        new Set(
          pageRows.flatMap((r) => [r.actorId, r.recipientId]).filter((n): n is number => n != null),
        ),
      );
      const userRows = userIds.length
        ? await db
            .select({
              id: usersTable.id,
              displayName: usersTable.displayName,
              email: usersTable.email,
              avatarUrl: usersTable.avatarUrl,
            })
            .from(usersTable)
            .where(inArray(usersTable.id, userIds))
        : [];
      const userById = new Map(userRows.map((u) => [u.id, u]));

      const entries: TeamPageHistoryEntry[] = pageRows.map((r) => ({
        id: r.id,
        team: r.team,
        urgency: r.urgency as 'info' | 'warning' | 'critical',
        message: r.message,
        inAppDelivered: r.inAppDelivered,
        mutedAsDuplicate: r.mutedAsDuplicate,
        duplicateOfPageId: r.duplicateOfPageId,
        createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
        actor: userById.get(r.actorId) ?? null,
        recipient: userById.get(r.recipientId) ?? null,
      }));

      return sendSuccess(res, { team, count: entries.length, pages: entries });
    } catch (err) {
      return handleRouteError(res, err, `GET /teams/${req.params.team}/pages`);
    }
  },
);

export interface UserPageHistoryEntry extends TeamPageHistoryEntry {
  role: 'received' | 'sent';
}

router.get(
  '/users/:id/pages',
  authMiddleware({ required: false }),
  perUserApiSlidingLimiter,
  async (req: Request, res: Response) => {
    try {
      const idParam = (req.params as { id: string }).id;
      const userId = Number.parseInt(idParam, 10);
      if (!Number.isInteger(userId) || userId < 1) {
        return sendBadRequest(res, 'Invalid user id');
      }

      const roleRaw =
        typeof req.query.role === 'string' ? req.query.role.toLowerCase() : 'recipient';
      const role: 'recipient' | 'actor' | 'both' =
        roleRaw === 'actor' || roleRaw === 'both' ? roleRaw : 'recipient';

      const [user] = await db
        .select({
          id: usersTable.id,
          displayName: usersTable.displayName,
          email: usersTable.email,
          avatarUrl: usersTable.avatarUrl,
          team: usersTable.team,
          platformRole: usersTable.platformRole,
          isActive: usersTable.isActive,
        })
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);
      if (!user) return sendNotFound(res, `User #${userId}`);

      const filter =
        role === 'recipient'
          ? eq(teamPagesTable.recipientId, userId)
          : role === 'actor'
            ? eq(teamPagesTable.actorId, userId)
            : null;

      const limit = 25;
      let pageRows: Array<{
        id: number;
        team: string;
        actorId: number | null;
        recipientId: number | null;
        urgency: string;
        message: string | null;
        inAppDelivered: boolean;
        createdAt: Date | string;
      }>;
      if (filter) {
        pageRows = await db
          .select({
            id: teamPagesTable.id,
            team: teamPagesTable.team,
            actorId: teamPagesTable.actorId,
            recipientId: teamPagesTable.recipientId,
            urgency: teamPagesTable.urgency,
            message: teamPagesTable.message,
            inAppDelivered: teamPagesTable.inAppDelivered,
            createdAt: teamPagesTable.createdAt,
          })
          .from(teamPagesTable)
          .where(filter)
          .orderBy(desc(teamPagesTable.createdAt))
          .limit(limit);
      } else {
        const [recRows, actRows] = await Promise.all([
          db
            .select({
              id: teamPagesTable.id,
              team: teamPagesTable.team,
              actorId: teamPagesTable.actorId,
              recipientId: teamPagesTable.recipientId,
              urgency: teamPagesTable.urgency,
              message: teamPagesTable.message,
              inAppDelivered: teamPagesTable.inAppDelivered,
              createdAt: teamPagesTable.createdAt,
            })
            .from(teamPagesTable)
            .where(eq(teamPagesTable.recipientId, userId))
            .orderBy(desc(teamPagesTable.createdAt))
            .limit(limit),
          db
            .select({
              id: teamPagesTable.id,
              team: teamPagesTable.team,
              actorId: teamPagesTable.actorId,
              recipientId: teamPagesTable.recipientId,
              urgency: teamPagesTable.urgency,
              message: teamPagesTable.message,
              inAppDelivered: teamPagesTable.inAppDelivered,
              createdAt: teamPagesTable.createdAt,
            })
            .from(teamPagesTable)
            .where(eq(teamPagesTable.actorId, userId))
            .orderBy(desc(teamPagesTable.createdAt))
            .limit(limit),
        ]);
        const seen = new Set<number>();
        pageRows = [...recRows, ...actRows]
          .filter((r) => {
            if (seen.has(r.id)) return false;
            seen.add(r.id);
            return true;
          })
          .sort((a, b) => {
            const at =
              a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
            const bt =
              b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
            return bt - at;
          })
          .slice(0, limit);
      }

      const otherIds = Array.from(
        new Set(
          pageRows
            .flatMap((r) => [r.actorId, r.recipientId])
            .filter((n): n is number => n != null && n !== userId),
        ),
      );
      const otherRows = otherIds.length
        ? await db
            .select({
              id: usersTable.id,
              displayName: usersTable.displayName,
              email: usersTable.email,
              avatarUrl: usersTable.avatarUrl,
            })
            .from(usersTable)
            .where(inArray(usersTable.id, otherIds))
        : [];
      const userById = new Map<
        number,
        { id: number; displayName: string; email: string | null; avatarUrl: string | null }
      >(otherRows.map((u) => [u.id, u]));
      userById.set(user.id, {
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        avatarUrl: user.avatarUrl,
      });

      const entries: UserPageHistoryEntry[] = pageRows.map((r) => ({
        id: r.id,
        team: r.team,
        urgency: r.urgency as 'info' | 'warning' | 'critical',
        message: r.message,
        inAppDelivered: r.inAppDelivered,
        createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
        actor: r.actorId != null ? (userById.get(r.actorId) ?? null) : null,
        recipient: r.recipientId != null ? (userById.get(r.recipientId) ?? null) : null,
        role: r.recipientId === userId ? 'received' : 'sent',
      }));

      return sendSuccess(res, {
        user: {
          id: user.id,
          displayName: user.displayName,
          email: user.email,
          avatarUrl: user.avatarUrl,
          team: user.team,
          platformRole: user.platformRole,
          isActive: user.isActive,
        },
        role,
        count: entries.length,
        pages: entries,
      });
    } catch (err) {
      return handleRouteError(res, err, `GET /users/${req.params.id}/pages`);
    }
  },
);

// ─── Schedule management ───

/**
 * Append an audit_logs row for a successful on-call schedule mutation
 * (#2483). The schedule drives who gets paged, so every PUT/POST/DELETE
 * needs to land in the audit trail an incident reviewer can later query
 * via /api/core/audit. Failures are non-fatal: we log loudly but do not
 * roll back the user's mutation if the audit insert blows up.
 */
async function writeScheduleAudit(params: {
  actionType: string;
  entityType: 'on_call_schedule' | 'on_call_override';
  entityId: string;
  team: string;
  actorUserId: number;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  extra?: Record<string, unknown>;
}): Promise<void> {
  try {
    await db.insert(auditLogsTable).values({
      actionType: params.actionType,
      entityType: params.entityType,
      entityId: params.entityId,
      actorUserId: params.actorUserId,
      payloadJson: {
        team: params.team,
        ...(params.before !== undefined ? { _before: params.before } : {}),
        ...(params.after !== undefined ? { _after: params.after } : {}),
        ...params.extra,
      },
    });
  } catch (err) {
    logger.error(
      { err, actionType: params.actionType, team: params.team, entityId: params.entityId },
      'Failed to write on-call schedule audit log',
    );
  }
}

function scheduleSnapshot(s: OnCallSchedule): Record<string, unknown> {
  return {
    rotationIntervalHours: s.rotationIntervalHours,
    memberOrder: s.memberOrder,
    handoffAnchor: s.handoffAnchor.toISOString(),
    timezone: s.timezone,
    warningMinutes: s.warningMinutes,
    updatedBy: s.updatedBy,
  };
}

function shiftSnapshot(s: OnCallShift): Record<string, unknown> {
  return {
    userId: s.userId,
    kind: s.kind,
    startAt: s.startAt.toISOString(),
    endAt: s.endAt.toISOString(),
    note: s.note,
    createdBy: s.createdBy,
  };
}

export interface ScheduleResponse {
  team: string;
  schedule: {
    rotationIntervalHours: number;
    memberOrder: number[];
    handoffAnchor: string;
    timezone: string;
    warningMinutes: number;
    updatedAt: string;
    updatedBy: number;
  } | null;
  overrides: Array<{
    id: number;
    userId: number;
    displayName: string;
    kind: 'override';
    startAt: string;
    endAt: string;
    note: string | null;
    createdBy: number;
  }>;
  currentOnCall: { id: number; displayName: string } | null;
  currentOnCallSource: 'override' | 'rotation' | 'fallback';
}

function shiftToDto(
  s: typeof onCallShiftsTable.$inferSelect,
  members: Array<{ id: number; displayName: string }>,
) {
  return {
    id: s.id,
    userId: s.userId,
    displayName: members.find((m) => m.id === s.userId)?.displayName ?? `User #${s.userId}`,
    kind: s.kind as 'override',
    startAt: s.startAt.toISOString(),
    endAt: s.endAt.toISOString(),
    note: s.note,
    createdBy: s.createdBy,
  };
}

async function loadScheduleResponse(
  team: string,
  now: Date = new Date(),
): Promise<ScheduleResponse | null> {
  const detail = await loadTeam(team, now);
  if (!detail) return null;

  const [schedule] = await db
    .select()
    .from(onCallSchedulesTable)
    .where(eq(onCallSchedulesTable.team, team))
    .limit(1);

  const upcoming = await db
    .select()
    .from(onCallShiftsTable)
    .where(and(eq(onCallShiftsTable.team, team), gte(onCallShiftsTable.endAt, now)))
    .orderBy(asc(onCallShiftsTable.startAt))
    .limit(50);

  return {
    team,
    schedule: schedule
      ? {
          rotationIntervalHours: schedule.rotationIntervalHours,
          memberOrder: schedule.memberOrder,
          handoffAnchor: schedule.handoffAnchor.toISOString(),
          timezone: schedule.timezone,
          warningMinutes: schedule.warningMinutes,
          updatedAt: schedule.updatedAt.toISOString(),
          updatedBy: schedule.updatedBy,
        }
      : null,
    overrides: upcoming.map((s) => shiftToDto(s, detail.members)),
    currentOnCall: detail.onCall,
    currentOnCallSource: detail.onCallSource,
  };
}

router.get(
  '/teams/:team/schedule',
  authMiddleware({ required: false }),
  perUserApiSlidingLimiter,
  async (req: Request, res: Response) => {
    try {
      const team = decodeURIComponent((req.params as { team: string }).team).trim();
      if (!team) return sendBadRequest(res, 'team is required');
      const resp = await loadScheduleResponse(team);
      if (!resp) return sendNotFound(res, `Team '${team}'`);
      return sendSuccess(res, resp);
    } catch (err) {
      return handleRouteError(res, err, `GET /teams/${req.params.team}/schedule`);
    }
  },
);

async function findNonMemberIds(team: string, ids: number[]): Promise<number[]> {
  if (ids.length === 0) return [];
  const rows = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.team, team));
  const known = new Set(rows.map((r) => r.id));
  return ids.filter((id) => !known.has(id));
}

router.put(
  '/teams/:team/schedule',
  authMiddleware({ required: true }),
  requireRole('admin', 'ops'),
  denyIfReadOnly(),
  perUserWriteSlidingLimiter,
  validateBody(
    bodyShape({
      handoffAnchor: z.unknown().optional(),
      memberOrder: z.unknown().optional(),
      rotationIntervalHours: z.unknown().optional(),
      timezone: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const team = decodeURIComponent((req.params as { team: string }).team).trim();
      if (!team) return sendBadRequest(res, 'team is required');
      const detail = await loadTeam(team);
      if (!detail) return sendNotFound(res, `Team '${team}'`);

      const body = (req.body ?? {}) as {
        rotationIntervalHours?: unknown;
        memberOrder?: unknown;
        handoffAnchor?: unknown;
        timezone?: unknown;
        warningMinutes?: unknown;
      };

      const intervalRaw = body.rotationIntervalHours;
      const interval =
        typeof intervalRaw === 'number' && Number.isFinite(intervalRaw) && intervalRaw >= 0
          ? Math.floor(intervalRaw)
          : null;
      if (interval === null) {
        return sendBadRequest(
          res,
          'rotationIntervalHours must be a non-negative number (0 = disabled)',
        );
      }
      if (interval > 24 * 365) {
        return sendBadRequest(res, 'rotationIntervalHours must be <= 8760 (one year)');
      }

      if (
        !Array.isArray(body.memberOrder) ||
        body.memberOrder.some((v) => typeof v !== 'number' || !Number.isInteger(v))
      ) {
        return sendBadRequest(res, 'memberOrder must be an array of integer user ids');
      }
      const memberOrder = (body.memberOrder as number[]).filter(
        (id, i, arr) => arr.indexOf(id) === i,
      );

      const offending = await findNonMemberIds(team, memberOrder);
      if (offending.length > 0) {
        return sendBadRequest(
          res,
          `memberOrder contains user ids that are not on team '${team}': ${offending.join(', ')}`,
        );
      }

      let handoffAnchor = new Date();
      if (typeof body.handoffAnchor === 'string') {
        const d = new Date(body.handoffAnchor);
        if (Number.isNaN(d.getTime()))
          return sendBadRequest(res, 'handoffAnchor must be an ISO timestamp');
        handoffAnchor = d;
      }

      const timezone =
        typeof body.timezone === 'string' &&
        body.timezone.trim().length > 0 &&
        body.timezone.length <= 64
          ? body.timezone.trim()
          : 'UTC';

      // #2482: per-schedule warning window. 0 disables the warning, capped
      // at 24h to keep the scheduler's lookahead bounded.
      const warningRaw = body.warningMinutes;
      let warningMinutes = 30;
      if (warningRaw !== undefined) {
        if (typeof warningRaw !== 'number' || !Number.isFinite(warningRaw) || warningRaw < 0) {
          return sendBadRequest(res, 'warningMinutes must be a non-negative number');
        }
        warningMinutes = Math.min(Math.floor(warningRaw), 24 * 60);
      }

      const actor = req.user!;
      const now = new Date();

      const existing = (
        await db
          .select()
          .from(onCallSchedulesTable)
          .where(eq(onCallSchedulesTable.team, team))
          .limit(1)
      )[0];

      let auditEntityId: string;
      if (existing) {
        await db
          .update(onCallSchedulesTable)
          .set({
            rotationIntervalHours: interval,
            memberOrder,
            handoffAnchor,
            timezone,
            warningMinutes,
            updatedBy: actor.id,
            updatedAt: now,
          })
          .where(eq(onCallSchedulesTable.id, existing.id));
        auditEntityId = String(existing.id);
      } else {
        const [created] = await db
          .insert(onCallSchedulesTable)
          .values({
            team,
            rotationIntervalHours: interval,
            memberOrder,
            handoffAnchor,
            timezone,
            warningMinutes,
            updatedBy: actor.id,
          })
          .returning();
        auditEntityId = String(created?.id ?? team);
      }

      logger.info(
        { team, actorId: actor.id, interval, memberCount: memberOrder.length },
        'On-call schedule updated',
      );

      const after: Record<string, unknown> = {
        rotationIntervalHours: interval,
        memberOrder,
        handoffAnchor: handoffAnchor.toISOString(),
        timezone,
        warningMinutes,
        updatedBy: actor.id,
      };
      await writeScheduleAudit({
        actionType: existing ? 'on_call_schedule.updated' : 'on_call_schedule.created',
        entityType: 'on_call_schedule',
        entityId: auditEntityId,
        team,
        actorUserId: actor.id,
        before: existing ? scheduleSnapshot(existing) : null,
        after,
      });

      const resp = await loadScheduleResponse(team);
      return sendSuccess(res, resp!);
    } catch (err) {
      return handleRouteError(res, err, `PUT /teams/${req.params.team}/schedule`);
    }
  },
);

router.post(
  '/teams/:team/schedule/overrides',
  authMiddleware({ required: true }),
  requireRole('admin', 'ops'),
  denyIfReadOnly(),
  perUserWriteSlidingLimiter,
  validateBody(
    bodyShape({
      endAt: z.unknown().optional(),
      note: z.unknown().optional(),
      startAt: z.unknown().optional(),
      userId: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const team = decodeURIComponent((req.params as { team: string }).team).trim();
      if (!team) return sendBadRequest(res, 'team is required');
      const detail = await loadTeam(team);
      if (!detail) return sendNotFound(res, `Team '${team}'`);

      const body = (req.body ?? {}) as {
        userId?: unknown;
        startAt?: unknown;
        endAt?: unknown;
        note?: unknown;
      };

      const userId =
        typeof body.userId === 'number' && Number.isInteger(body.userId) ? body.userId : null;
      if (userId === null) return sendBadRequest(res, 'userId must be an integer');

      const offending = await findNonMemberIds(team, [userId]);
      if (offending.length > 0) {
        return sendBadRequest(res, `user ${userId} is not a member of team '${team}'`);
      }

      if (typeof body.startAt !== 'string' || typeof body.endAt !== 'string') {
        return sendBadRequest(res, 'startAt and endAt must be ISO timestamps');
      }
      const startAt = new Date(body.startAt);
      const endAt = new Date(body.endAt);
      if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
        return sendBadRequest(res, 'startAt and endAt must be valid ISO timestamps');
      }
      if (endAt.getTime() <= startAt.getTime()) {
        return sendBadRequest(res, 'endAt must be after startAt');
      }
      if (endAt.getTime() - startAt.getTime() > 365 * 24 * 60 * 60 * 1000) {
        return sendBadRequest(res, 'override window must be <= 365 days');
      }

      const note =
        typeof body.note === 'string' && body.note.trim().length > 0
          ? body.note.trim().slice(0, 500)
          : null;

      const actor = req.user!;
      const [created] = await db
        .insert(onCallShiftsTable)
        .values({
          team,
          userId,
          kind: 'override',
          startAt,
          endAt,
          note,
          createdBy: actor.id,
        })
        .returning();

      logger.info(
        { team, actorId: actor.id, overrideId: created?.id, userId, startAt, endAt },
        'On-call override created',
      );

      if (created) {
        await writeScheduleAudit({
          actionType: 'on_call_override.created',
          entityType: 'on_call_override',
          entityId: String(created.id),
          team,
          actorUserId: actor.id,
          before: null,
          after: shiftSnapshot(created),
        });
      }

      const resp = await loadScheduleResponse(team);
      return sendSuccess(res, resp!);
    } catch (err) {
      return handleRouteError(res, err, `POST /teams/${req.params.team}/schedule/overrides`);
    }
  },
);

router.delete(
  '/teams/:team/schedule/overrides/:id',
  authMiddleware({ required: true }),
  requireRole('admin', 'ops'),
  denyIfReadOnly(),
  perUserWriteSlidingLimiter,
  async (req: Request, res: Response) => {
    try {
      const team = decodeURIComponent((req.params as { team: string }).team).trim();
      if (!team) return sendBadRequest(res, 'team is required');
      let id: number;
      try {
        id = parseIdParam((req.params as { id: string }).id);
      } catch (e) {
        if (e instanceof InvalidIdError) return sendBadRequest(res, 'invalid override id');
        throw e;
      }
      const [existing] = await db
        .select()
        .from(onCallShiftsTable)
        .where(eq(onCallShiftsTable.id, id))
        .limit(1);
      if (!existing) return sendNotFound(res, `Override #${id}`);
      if (existing.team !== team) {
        return sendForbidden(res, `Override #${id} does not belong to team '${team}'`);
      }

      await db.delete(onCallShiftsTable).where(eq(onCallShiftsTable.id, id));
      const actorId = req.user?.id;
      logger.info({ team, actorId, overrideId: id }, 'On-call override deleted');

      await writeScheduleAudit({
        actionType: 'on_call_override.deleted',
        entityType: 'on_call_override',
        entityId: String(id),
        team,
        actorUserId: actorId,
        before: shiftSnapshot(existing),
        after: null,
      });

      const resp = await loadScheduleResponse(team);
      return sendSuccess(res, resp);
    } catch (err) {
      return handleRouteError(
        res,
        err,
        `DELETE /teams/${req.params.team}/schedule/overrides/${req.params.id}`,
      );
    }
  },
);

export default router;
