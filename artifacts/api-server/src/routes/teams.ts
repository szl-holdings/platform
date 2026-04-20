/**
 * /teams — Team directory + paging (#2301)
 *
 * Powers the clickable team pills on the deployments operator console.
 * Lets on-call jump from "App X is owned by team Y" to a roster showing
 * who's on that team, who is currently on-call, who to escalate to, and
 * a one-click "page this team" action that drops a notification into the
 * on-call user's inbox + opens the configured external channels.
 *
 * Routes:
 *   GET  /teams/:team           — directory: members, on-call, escalation, owned apps
 *   POST /teams/:team/page      — page the on-call (in-app notification + external dispatch)
 */

import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  usersTable,
  notificationsTable,
  notificationPreferencesTable,
  appsRegistryTable,
  teamPagesTable,
  PLATFORM_ROLE_HIERARCHY,
  type PlatformRole,
} from "@szl-holdings/db";
import { asc, desc, eq, inArray } from "drizzle-orm";
import {
  sendSuccess,
  sendBadRequest,
  sendNotFound,
  handleRouteError,
} from "../lib/api-response";
import { authMiddleware, denyIfReadOnly } from "../middlewares/auth";
import { perUserApiSlidingLimiter, perUserWriteSlidingLimiter } from "../middlewares/sliding-window-limiter";
import { logger } from "../lib/logger";
import { validateBody, jsonObjectBodySchema } from "../lib/validation";
import { publish, WS_CHANNELS } from "../lib/websocket";
import { dispatchToExternalChannels } from "./notifications";

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

export interface TeamDetail {
  team: string;
  members: TeamMember[];
  /** Deterministic on-call pick rotated weekly across active members. */
  onCall: TeamMember | null;
  /** Highest-privilege active member; the person to escalate to. */
  escalation: TeamMember | null;
  ownedApps: TeamOwnedApp[];
  count: number;
}

/**
 * Pick a deterministic on-call from the active member roster. Uses the
 * current ISO week index so the rotation is stable for a week, predictable,
 * and survives restarts — no schedule table needed for the v1 contract.
 *
 * Members are sorted by id (insertion order) so the rotation is the same
 * across instances regardless of query result ordering.
 */
function pickOnCall(active: TeamMember[], now: Date = new Date()): TeamMember | null {
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
      rank: m.platformRole
        ? (PLATFORM_ROLE_HIERARCHY[m.platformRole as PlatformRole] ?? -1)
        : -1,
    }))
    .sort((a, b) => b.rank - a.rank || a.m.id - b.m.id);
  const top = ranked[0];
  if (!top || top.rank < 0) return onCall;
  return top.m;
}

async function loadTeam(team: string): Promise<TeamDetail | null> {
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

  const active = members.filter((m) => m.isActive);
  const onCall = pickOnCall(active);
  const escalation = pickEscalation(active, onCall);

  return {
    team,
    members,
    onCall,
    escalation,
    ownedApps: appRows.map((a) => ({ slug: a.slug, name: a.name })),
    count: members.length,
  };
}

router.get(
  "/teams/:team",
  authMiddleware({ required: false }),
  perUserApiSlidingLimiter,
  async (req: Request, res: Response) => {
    try {
      const team = decodeURIComponent((req.params as { team: string }).team).trim();
      if (!team) return sendBadRequest(res, "team is required");
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
  "/teams/:team/page",
  authMiddleware({ required: true }),
  denyIfReadOnly(),
  perUserWriteSlidingLimiter,
  validateBody(jsonObjectBodySchema),
  async (req: Request, res: Response) => {
    try {
      const team = decodeURIComponent((req.params as { team: string }).team).trim();
      if (!team) return sendBadRequest(res, "team is required");
      const detail = await loadTeam(team);
      if (!detail) return sendNotFound(res, `Team '${team}'`);
      if (!detail.onCall) {
        return sendBadRequest(res, `Team '${team}' has no active members to page`);
      }

      const body = (req.body ?? {}) as { message?: string; urgency?: string };
      const note = typeof body.message === "string" ? body.message.trim().slice(0, 500) : "";
      const urgencyRaw = typeof body.urgency === "string" ? body.urgency.toLowerCase() : "warning";
      // Map the operator-facing urgency vocabulary onto the notifications
      // table's `type` enum. "critical" → "error" so it shows in red.
      const urgency: "info" | "warning" | "critical" =
        urgencyRaw === "critical" || urgencyRaw === "info" ? urgencyRaw : "warning";
      const notifType: "info" | "warning" | "error" =
        urgency === "critical" ? "error" : urgency;

      const actor = req.user!;
      const actorName = actor.displayName ?? actor.email ?? `user#${actor.id}`;

      // Don't page yourself — if the caller IS the on-call, that's a no-op
      // we report explicitly instead of inserting a useless self-notification.
      if (detail.onCall.id === actor.id) {
        return sendSuccess(res, {
          paged: false,
          reason: "actor_is_oncall",
          team,
          onCall: detail.onCall,
        });
      }

      const appUrl = process.env["APP_URL"] ?? process.env["VITE_APP_URL"] ?? "";
      const actionUrl = `${appUrl}/command/operations/deployments`;
      const title = `Page from ${actorName} · ${team}`;
      const message = note
        ? `${actorName} paged the ${team} on-call: ${note}`
        : `${actorName} paged the ${team} on-call.`;

      const [pref] = await db
        .select({
          userId: notificationPreferencesTable.userId,
          inAppEnabled: notificationPreferencesTable.inAppEnabled,
        })
        .from(notificationPreferencesTable)
        .where(eq(notificationPreferencesTable.userId, detail.onCall.id))
        .limit(1);
      const inAppOn = pref ? pref.inAppEnabled : true;

      let notificationId = 0;
      if (inAppOn) {
        const [notif] = await db
          .insert(notificationsTable)
          .values({
            userId: detail.onCall.id,
            type: notifType,
            channel: "in_app",
            title,
            message,
            actionUrl,
          })
          .returning();
        if (notif) {
          notificationId = notif.id;
          publish(WS_CHANNELS.NOTIFICATIONS, "new_notification", notif);
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

      // Append to the audit history so a third-party operator can see the
      // page later in the team detail modal. Self-paged no-ops (handled
      // above) never reach this point so they never pollute the history.
      try {
        await db.insert(teamPagesTable).values({
          team,
          actorId: actor.id,
          recipientId: detail.onCall.id,
          urgency,
          message: note ? note : null,
          inAppDelivered: inAppOn,
        });
      } catch (auditErr) {
        // The page itself succeeded — do not fail the request because the
        // audit insert blew up. Log loudly so it gets noticed.
        logger.error(
          { err: auditErr, team, onCallUserId: detail.onCall.id, actorId: actor.id },
          "Failed to record team_pages audit row",
        );
      }

      logger.info(
        { team, onCallUserId: detail.onCall.id, actorId: actor.id, urgency, inAppDelivered: inAppOn },
        "Team paged",
      );

      return sendSuccess(res, {
        paged: true,
        team,
        onCall: detail.onCall,
        urgency,
        inAppDelivered: inAppOn,
      });
    } catch (err) {
      return handleRouteError(res, err, `POST /teams/${req.params.team}/page`);
    }
  },
);

export interface TeamPageHistoryEntry {
  id: number;
  team: string;
  urgency: "info" | "warning" | "critical";
  message: string | null;
  inAppDelivered: boolean;
  createdAt: string;
  actor: { id: number; displayName: string; email: string | null; avatarUrl: string | null } | null;
  recipient: { id: number; displayName: string; email: string | null; avatarUrl: string | null } | null;
}

/**
 * Recent paging history for a team — powers the audit timeline in the team
 * detail modal so on-call can spot noisy alerts and confirm reach.
 *
 * Capped at the last 10 events (newest first). Self-paged no-ops are
 * never written to the audit table so they never appear here.
 */
router.get(
  "/teams/:team/pages",
  authMiddleware({ required: false }),
  perUserApiSlidingLimiter,
  async (req: Request, res: Response) => {
    try {
      const team = decodeURIComponent((req.params as { team: string }).team).trim();
      if (!team) return sendBadRequest(res, "team is required");

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
          createdAt: teamPagesTable.createdAt,
        })
        .from(teamPagesTable)
        .where(eq(teamPagesTable.team, team))
        .orderBy(desc(teamPagesTable.createdAt))
        .limit(10);

      const userIds = Array.from(
        new Set(pageRows.flatMap((r) => [r.actorId, r.recipientId]).filter((n): n is number => n != null)),
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
        urgency: r.urgency as "info" | "warning" | "critical",
        message: r.message,
        inAppDelivered: r.inAppDelivered,
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
  /**
   * Which side of the page the requested user was on for this row.
   * "received" = they were the on-call recipient,
   * "sent"     = they were the actor (the pager).
   */
  role: "received" | "sent";
}

/**
 * Per-user paging history — the user-profile counterpart to
 * GET /teams/:team/pages (#2469).
 *
 * Lets an individual answer "have I been over-paged this week?" without
 * having to enumerate every team they belong to. Returns the most recent
 * pages where the user was the recipient by default; pass `?role=actor`
 * to get pages they fired, or `?role=both` to get either side.
 *
 * Capped at the last 25 events (newest first). Drives the user-profile
 * drawer surfaced from operator consoles (e.g. deployments → DeployerBadge).
 */
router.get(
  "/users/:id/pages",
  authMiddleware({ required: false }),
  perUserApiSlidingLimiter,
  async (req: Request, res: Response) => {
    try {
      const idParam = (req.params as { id: string }).id;
      const userId = Number.parseInt(idParam, 10);
      if (!Number.isInteger(userId) || userId < 1) {
        return sendBadRequest(res, "Invalid user id");
      }

      const roleRaw = typeof req.query["role"] === "string" ? req.query["role"].toLowerCase() : "recipient";
      const role: "recipient" | "actor" | "both" =
        roleRaw === "actor" || roleRaw === "both" ? roleRaw : "recipient";

      // Confirm the user exists so a typo'd id 404s instead of returning
      // an empty list that looks like "no pages yet".
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
        role === "recipient"
          ? eq(teamPagesTable.recipientId, userId)
          : role === "actor"
          ? eq(teamPagesTable.actorId, userId)
          : // role === "both" — match either side. Drizzle's `or` would work
            // but we already have inArray imported; using a small union
            // query here keeps behavior obvious. We do it as two parallel
            // queries to avoid pulling in another operator import.
            null;

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
        // role === "both" — union via two queries, dedupe (a row can match
        // both sides only if actor == recipient, which we never insert),
        // then sort + cap.
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
            const at = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
            const bt = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
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
      const userById = new Map<number, { id: number; displayName: string; email: string | null; avatarUrl: string | null }>(
        otherRows.map((u) => [u.id, u]),
      );
      // The requested user resolves to themselves without a second lookup.
      userById.set(user.id, {
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        avatarUrl: user.avatarUrl,
      });

      const entries: UserPageHistoryEntry[] = pageRows.map((r) => ({
        id: r.id,
        team: r.team,
        urgency: r.urgency as "info" | "warning" | "critical",
        message: r.message,
        inAppDelivered: r.inAppDelivered,
        createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
        actor: r.actorId != null ? userById.get(r.actorId) ?? null : null,
        recipient: r.recipientId != null ? userById.get(r.recipientId) ?? null : null,
        role: r.recipientId === userId ? "received" : "sent",
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

export default router;
