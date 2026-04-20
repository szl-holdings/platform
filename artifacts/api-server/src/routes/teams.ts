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
  PLATFORM_ROLE_HIERARCHY,
  type PlatformRole,
} from "@szl-holdings/db";
import { and, asc, eq } from "drizzle-orm";
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

export default router;
