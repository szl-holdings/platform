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
import { db, deploymentsTable, usersTable, type Deployment } from "@szl-holdings/db";
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
  commitSha?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
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
    })
    .from(usersTable)
    .where(filters.length === 1 ? filters[0] : or(...filters));

  for (const r of rows) {
    const summary: DeploymentUserSummary = {
      id: r.id,
      displayName: r.displayName,
      email: r.email,
      avatarUrl: r.avatarUrl,
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

router.get("/deployments", authMiddleware({ required: false }), perUserApiSlidingLimiter, async (req: Request, res: Response) => {
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

router.get("/deployments/:appId", authMiddleware({ required: false }), perUserApiSlidingLimiter, async (req: Request, res: Response) => {
  try {
    const { appId } = req.params;
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

router.get("/deployments/:appId/history", authMiddleware({ required: false }), perUserApiSlidingLimiter, async (req: Request, res: Response) => {
  try {
    const { appId } = req.params;
    const env = (req.query.environment as string) ?? "production";
    const rows = await getHistory(appId, env);
    const history = await recordsWithUsers(rows);
    return sendSuccess(res, { appId, environment: env, history, count: history.length });
  } catch (err) {
    return handleRouteError(res, err, `GET /deployments/${req.params.appId}/history`);
  }
});

router.post("/deployments", authMiddleware({ required: true }), denyIfReadOnly(), requireRole("ops", "exec", "admin", "super_admin"), perUserWriteSlidingLimiter, async (req: Request, res: Response) => {
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

router.post("/deployments/:appId/rollback", authMiddleware({ required: true }), denyIfReadOnly(), requireRole("ops", "exec", "admin", "super_admin"), perUserWriteSlidingLimiter, async (req: Request, res: Response) => {
  try {
    const { appId } = req.params;
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
        targetIdx = history.findLastIndex(
          (r) => r.version === targetVersion && r.status !== "active",
        );
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
      return sendBadRequest(res, result.error);
    }

    logger.info(
      { appId, from: result.previous.version, to: result.rolled.version },
      "Rollback executed",
    );
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
