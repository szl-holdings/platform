/**
 * /deployments — Deployment registry (database-backed)
 *
 * Tracks which domain-app versions are deployed to which environments.
 * Provides the stable contract for rollback, version pinning, and
 * the 12-step smoke test's "roll back bad version" step.
 *
 * Persistence: backed by the `deployments` table in the shared schema so
 * the registry, status, and rollback history survive restarts and are
 * consistent across multiple API instances.
 *
 * Routes:
 *   GET  /deployments                        — list all active deployments
 *   GET  /deployments/:appId                 — active deployment for an app
 *   POST /deployments                        — register / update a deployment
 *   POST /deployments/:appId/rollback        — roll back to previous version
 *   GET  /deployments/:appId/history         — version history for an app
 */

import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  deploymentsTable,
  usersTable,
  notificationsTable,
  notificationPreferencesTable,
  type Deployment,
} from "@szl-holdings/db";
import { and, asc, desc, eq, inArray, or } from "drizzle-orm";
import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendBadRequest,
  handleRouteError,
} from "../lib/api-response";
import { authMiddleware, denyIfReadOnly, requireRole } from "../middlewares/auth";
import { perUserApiSlidingLimiter, perUserWriteSlidingLimiter } from "../middlewares/sliding-window-limiter";
import { logger } from "../lib/logger";
import { validateBody, jsonObjectBodySchema, validateQuery, listQuerySchema} from "../lib/validation";
import { publish, WS_CHANNELS } from "../lib/websocket";
import { dispatchToExternalChannels } from "./notifications";

const router: IRouter = Router();

/**
 * Resolve a stable, human-readable identifier for the authenticated principal
 * to record on each deployment row. Prefers email, then displayName, then the
 * numeric user id as a string. POST routes require auth, so req.user is
 * guaranteed to be present at this point.
 */
function principalFor(req: Request): string {
  const u = req.user;
  if (!u) {
    // Defensive — should be unreachable because POST routes require auth.
    throw new Error("principalFor called without an authenticated user");
  }
  return u.email ?? u.displayName ?? String(u.id);
}

export type DeploymentStatus = "active" | "deploying" | "rolled-back" | "failed" | "inactive";
export type DeploymentEnvironment = "development" | "staging" | "production";

export interface DeploymentUserSummary {
  id: number;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  team: string | null;
}

export interface DeploymentRecord {
  appId: string;
  appName: string;
  version: string;
  environment: DeploymentEnvironment;
  status: DeploymentStatus;
  deployedAt: string;
  deployedBy: string;
  deployedByUser?: DeploymentUserSummary;
  ownerTeam?: string;
  commitSha?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Static map of appId -> owning team. Used so the operator console can show
 * "who do I page" alongside each deployment row without requiring a separate
 * lookup. Apps not listed here fall back to "Platform" — the catch-all team
 * that owns shared infrastructure.
 */
const APP_OWNER_TEAMS: Record<string, string> = {
  "api-server": "Platform",
  command: "Platform",
  "szl-holdings": "Platform",
  "szl-holdings-mobile": "Platform",
  pulse: "Pulse",
  aegis: "Aegis",
  vessels: "Vessels",
  terra: "Terra",
  sentra: "Sentra",
  counsel: "PRISM Counsel",
  "prism-counsel": "PRISM Counsel",
  lyte: "Lyte",
  "lyte-command-center": "Lyte",
  "carlota-jo": "Advisory",
  "szl-demo-video": "Marketing",
  "mockup-sandbox": "Design",
};

function ownerTeamFor(appId: string): string {
  return APP_OWNER_TEAMS[appId] ?? "Platform";
}

function toRecord(row: Deployment, user?: DeploymentUserSummary): DeploymentRecord {
  return {
    appId: row.appId,
    appName: row.appName,
    version: row.version,
    environment: row.environment,
    status: row.status,
    deployedAt: row.deployedAt.toISOString(),
    deployedBy: row.deployedBy,
    deployedByUser: user,
    ownerTeam: ownerTeamFor(row.appId),
    commitSha: row.commitSha ?? undefined,
    notes: row.notes ?? undefined,
    metadata: row.metadata ?? undefined,
  };
}

/**
 * Resolve `deployedBy` strings to user profiles for UI rendering. The column
 * stores whatever `principalFor` produced — email, displayName, or numeric id
 * (see POST handlers below) — so we look users up by all three in one query
 * each and build a lookup keyed by the original `deployedBy` value.
 */
async function lookupDeployers(
  deployedByValues: string[],
): Promise<Map<string, DeploymentUserSummary>> {
  const map = new Map<string, DeploymentUserSummary>();
  const unique = Array.from(new Set(deployedByValues.filter((v) => v && v !== "system")));
  if (unique.length === 0) return map;

  const emails = unique.filter((v) => v.includes("@"));
  const numericIds = unique
    .filter((v) => /^\d+$/.test(v))
    .map((v) => Number.parseInt(v, 10))
    .filter((n) => Number.isFinite(n));
  const otherNames = unique.filter((v) => !v.includes("@") && !/^\d+$/.test(v));

  const filters = [];
  if (emails.length > 0) filters.push(inArray(usersTable.email, emails));
  if (numericIds.length > 0) filters.push(inArray(usersTable.id, numericIds));
  if (otherNames.length > 0) filters.push(inArray(usersTable.displayName, otherNames));
  if (filters.length === 0) return map;

  const rows = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      displayName: usersTable.displayName,
      avatarUrl: usersTable.avatarUrl,
      team: usersTable.team,
    })
    .from(usersTable)
    .where(filters.length === 1 ? filters[0] : or(...filters));

  for (const r of rows) {
    const summary: DeploymentUserSummary = {
      id: r.id,
      displayName: r.displayName,
      email: r.email,
      avatarUrl: r.avatarUrl,
      team: r.team,
    };
    if (r.email && unique.includes(r.email)) map.set(r.email, summary);
    if (unique.includes(r.displayName)) {
      // Don't clobber a stronger email-based match
      if (!map.has(r.displayName)) map.set(r.displayName, summary);
    }
    const idStr = String(r.id);
    if (unique.includes(idStr) && !map.has(idStr)) map.set(idStr, summary);
  }
  return map;
}

async function recordsWithUsers(rows: Deployment[]): Promise<DeploymentRecord[]> {
  const users = await lookupDeployers(rows.map((r) => r.deployedBy));
  return rows.map((r) => toRecord(r, users.get(r.deployedBy)));
}

async function getHistory(appId: string, env: string): Promise<Deployment[]> {
  return db
    .select()
    .from(deploymentsTable)
    .where(
      and(
        eq(deploymentsTable.appId, appId),
        eq(deploymentsTable.environment, env as DeploymentEnvironment),
      ),
    )
    .orderBy(asc(deploymentsTable.deployedAt), asc(deploymentsTable.id));
}

async function getActive(appId: string, env: string): Promise<Deployment | undefined> {
  const rows = await db
    .select()
    .from(deploymentsTable)
    .where(
      and(
        eq(deploymentsTable.appId, appId),
        eq(deploymentsTable.environment, env as DeploymentEnvironment),
        eq(deploymentsTable.status, "active"),
      ),
    )
    .orderBy(desc(deploymentsTable.deployedAt), desc(deploymentsTable.id))
    .limit(1);
  return rows[0];
}

/**
 * Notify the owning team and the original deployer that a rollback occurred.
 *
 * Recipients:
 *   - Every active user whose `team` matches the app's owning team
 *   - The user who originally deployed the version that was rolled back
 *     (resolved from the `deployedBy` principal string via `lookupDeployers`)
 *   - The operator who performed the rollback is always excluded, even if
 *     they were also the original deployer of the bad version. They just
 *     clicked the button — they know. This intentionally takes precedence
 *     over the "notify previous deployer" rule for the actor==deployer case.
 *
 * Preferences:
 *   - In-app delivery is gated on `notification_preferences.inAppEnabled`
 *     (default true if no row exists). Users who opted out of in-app get
 *     no notifications row inserted and no websocket push.
 *   - External channels (email/sms/slack) are dispatched independently
 *     through `dispatchToExternalChannels`, which checks each channel's
 *     own preference. A user who opted out of in-app but kept email on
 *     still receives the rollback email.
 *
 * Failures are logged but never thrown — a notification problem should not
 * roll a successful rollback back into a failure.
 */
async function notifyRollback(params: {
  appId: string;
  appName: string;
  environment: string;
  fromVersion: string;
  toVersion: string;
  rolledBackBy: string;
  rolledBackByUserId: number;
  previousDeployedBy: string;
}): Promise<void> {
  try {
    const team = ownerTeamFor(params.appId);
    const recipientIds = new Set<number>();

    const teamUsers = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.team, team));
    for (const u of teamUsers) recipientIds.add(u.id);

    const deployerLookup = await lookupDeployers([params.previousDeployedBy]);
    const previousDeployer = deployerLookup.get(params.previousDeployedBy);
    if (previousDeployer) recipientIds.add(previousDeployer.id);

    recipientIds.delete(params.rolledBackByUserId);

    if (recipientIds.size === 0) {
      logger.info(
        { appId: params.appId, team },
        "Rollback notification: no recipients to notify",
      );
      return;
    }

    const appUrl = process.env["APP_URL"] ?? process.env["VITE_APP_URL"] ?? "";
    const actionUrl = `${appUrl}/command/operations/deployments`;
    const title = `Rollback: ${params.appName} (${params.environment})`;
    const message =
      `${params.rolledBackBy} rolled back ${params.appName} in ${params.environment} ` +
      `from ${params.fromVersion} to ${params.toVersion}.`;

    const recipientArray = Array.from(recipientIds);
    const prefRows = await db
      .select({
        userId: notificationPreferencesTable.userId,
        inAppEnabled: notificationPreferencesTable.inAppEnabled,
      })
      .from(notificationPreferencesTable)
      .where(inArray(notificationPreferencesTable.userId, recipientArray));
    const inAppPrefs = new Map(prefRows.map((p) => [p.userId, p.inAppEnabled]));

    let inAppDelivered = 0;
    let inAppSkipped = 0;
    for (const userId of recipientArray) {
      // Default behavior when no prefs row exists: in-app on.
      const inAppOn = inAppPrefs.has(userId) ? inAppPrefs.get(userId)! : true;

      let notificationId = 0;
      if (inAppOn) {
        const [notif] = await db
          .insert(notificationsTable)
          .values({
            userId,
            type: "warning",
            channel: "in_app",
            title,
            message,
            actionUrl,
          })
          .returning();
        if (notif) {
          notificationId = notif.id;
          publish(WS_CHANNELS.NOTIFICATIONS, "new_notification", notif);
          inAppDelivered++;
        }
      } else {
        inAppSkipped++;
      }

      // External channels are dispatched regardless of the in-app preference.
      // dispatchToExternalChannels itself enforces email/sms/slack opt-ins.
      // notificationId may be 0 here when no in-app row was inserted; the
      // dispatch consumer uses it for logging only and tolerates that.
      void dispatchToExternalChannels({
        notificationId,
        userId,
        type: "warning",
        title,
        message,
        actionUrl,
      });
    }

    logger.info(
      {
        appId: params.appId,
        team,
        recipients: recipientArray.length,
        inAppDelivered,
        inAppSkipped,
        from: params.fromVersion,
        to: params.toVersion,
      },
      "Rollback notifications dispatched",
    );
  } catch (err) {
    logger.error(
      { err, appId: params.appId },
      "Failed to send rollback notifications",
    );
  }
}

router.get("/deployments", authMiddleware({ required: false }), perUserApiSlidingLimiter, validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const env = (req.query.environment as string) ?? "production";
    const rows = await db
      .select()
      .from(deploymentsTable)
      .where(
        and(
          eq(deploymentsTable.environment, env as DeploymentEnvironment),
          eq(deploymentsTable.status, "active"),
        ),
      );
    const deployments = await recordsWithUsers(rows);
    return sendSuccess(res, { deployments, environment: env, count: deployments.length });
  } catch (err) {
    return handleRouteError(res, err, "GET /deployments");
  }
});

router.get("/deployments/:appId", authMiddleware({ required: false }), perUserApiSlidingLimiter, validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const { appId } = req.params as { appId: string };
    const env = (req.query.environment as string) ?? "production";
    const active = await getActive(appId, env);
    if (!active) {
      return sendNotFound(res, `No active deployment for app '${appId}' in '${env}'`);
    }
    const [enriched] = await recordsWithUsers([active]);
    return sendSuccess(res, enriched);
  } catch (err) {
    return handleRouteError(res, err, `GET /deployments/${req.params.appId}`);
  }
});

router.get("/deployments/:appId/history", authMiddleware({ required: false }), perUserApiSlidingLimiter, validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const { appId } = req.params as { appId: string };
    const env = (req.query.environment as string) ?? "production";
    const rows = await getHistory(appId, env);
    const history = await recordsWithUsers(rows);
    return sendSuccess(res, { appId, environment: env, history, count: history.length });
  } catch (err) {
    return handleRouteError(res, err, `GET /deployments/${req.params.appId}/history`);
  }
});

router.post("/deployments", authMiddleware({ required: true }), denyIfReadOnly(), requireRole("ops", "exec", "admin", "super_admin"), perUserWriteSlidingLimiter, validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const { appId, appName, version, environment, commitSha, notes, metadata } =
      req.body as Partial<DeploymentRecord>;
    if (!appId || !version || !environment) {
      return sendBadRequest(res, "appId, version, and environment are required");
    }
    // Audit trail: deployedBy is always taken from the authenticated principal,
    // never from request input — clients cannot spoof who triggered a deploy.
    const deployedBy = principalFor(req);

    const inserted = await db.transaction(async (tx) => {
      await tx
        .update(deploymentsTable)
        .set({ status: "inactive" })
        .where(
          and(
            eq(deploymentsTable.appId, appId),
            eq(deploymentsTable.environment, environment as DeploymentEnvironment),
            eq(deploymentsTable.status, "active"),
          ),
        );

      const [row] = await tx
        .insert(deploymentsTable)
        .values({
          appId,
          appName: appName ?? appId,
          version,
          environment: environment as DeploymentEnvironment,
          status: "active",
          deployedBy,
          commitSha: commitSha ?? null,
          notes: notes ?? null,
          metadata: metadata ?? null,
        })
        .returning();
      return row!;
    });

    logger.info({ appId, version, environment }, "Deployment registered");
    const [enriched] = await recordsWithUsers([inserted]);
    return sendCreated(res, enriched);
  } catch (err) {
    return handleRouteError(res, err, "POST /deployments");
  }
});

router.post("/deployments/:appId/rollback", authMiddleware({ required: true }), denyIfReadOnly(), requireRole("ops", "exec", "admin", "super_admin"), perUserWriteSlidingLimiter, validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const { appId } = req.params as { appId: string };
    const env = (req.body.environment as string) ?? "production";
    const targetVersion = req.body.version as string | undefined;
    const deployedBy = principalFor(req);

    const result = await db.transaction(async (tx) => {
      const history = await tx
        .select()
        .from(deploymentsTable)
        .where(
          and(
            eq(deploymentsTable.appId, appId),
            eq(deploymentsTable.environment, env as DeploymentEnvironment),
          ),
        )
        .orderBy(asc(deploymentsTable.deployedAt), asc(deploymentsTable.id));

      if (history.length < 2) {
        return { error: "No previous version available to roll back to" } as const;
      }

      const activeIdx = history.findIndex((r) => r.status === "active");
      if (activeIdx < 0) {
        return { error: "No active deployment to roll back" } as const;
      }

      let targetIdx: number;
      if (targetVersion) {
        targetIdx = history.reduce((found: number, r: any, i: number) => (r.version === targetVersion && r.status !== "active") ? i : found, -1);
        if (targetIdx < 0) {
          return { error: `Version '${targetVersion}' not found in history` } as const;
        }
      } else {
        targetIdx = activeIdx > 0 ? activeIdx - 1 : -1;
        if (targetIdx < 0) {
          return { error: "No previous version to roll back to" } as const;
        }
      }

      const activeRow = history[activeIdx]!;
      const target = history[targetIdx]!;

      await tx
        .update(deploymentsTable)
        .set({ status: "rolled-back" })
        .where(eq(deploymentsTable.id, activeRow.id));

      const [rolled] = await tx
        .insert(deploymentsTable)
        .values({
          appId: target.appId,
          appName: target.appName,
          version: target.version,
          environment: target.environment,
          status: "active",
          deployedBy,
          commitSha: target.commitSha,
          notes: `Rolled back from ${activeRow.version} to ${target.version}`,
          metadata: target.metadata,
        })
        .returning();

      const previousAfter = { ...activeRow, status: "rolled-back" as const };
      return { rolled: rolled!, previous: previousAfter } as const;
    });

    if ("error" in result) {
      return sendBadRequest(res, result.error ?? "Unknown rollback error");
    }

    logger.info(
      { appId, from: result.previous.version, to: result.rolled.version },
      "Rollback executed",
    );

    void notifyRollback({
      appId,
      appName: result.previous.appName,
      environment: env,
      fromVersion: result.previous.version,
      toVersion: result.rolled.version,
      rolledBackBy: deployedBy,
      rolledBackByUserId: req.user!.id,
      previousDeployedBy: result.previous.deployedBy,
    });

    const enriched = await recordsWithUsers([result.previous, result.rolled]);
    return sendSuccess(res, {
      rolledBack: true,
      previous: enriched[0]!,
      current: enriched[1]!,
    });
  } catch (err) {
    return handleRouteError(res, err, `POST /deployments/${req.params.appId}/rollback`);
  }
});

export default router;
