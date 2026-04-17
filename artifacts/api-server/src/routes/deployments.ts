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
import { db, deploymentsTable, type Deployment } from "@szl-holdings/db";
import { and, asc, desc, eq } from "drizzle-orm";
import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendBadRequest,
  handleRouteError,
} from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";
import { perUserApiSlidingLimiter, perUserWriteSlidingLimiter } from "../middlewares/sliding-window-limiter";
import { logger } from "../lib/logger";

const router: IRouter = Router();
router.use(authMiddleware({ required: false }));

export type DeploymentStatus = "active" | "deploying" | "rolled-back" | "failed" | "inactive";
export type DeploymentEnvironment = "development" | "staging" | "production";

export interface DeploymentRecord {
  appId: string;
  appName: string;
  version: string;
  environment: DeploymentEnvironment;
  status: DeploymentStatus;
  deployedAt: string;
  deployedBy: string;
  commitSha?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

function toRecord(row: Deployment): DeploymentRecord {
  return {
    appId: row.appId,
    appName: row.appName,
    version: row.version,
    environment: row.environment,
    status: row.status,
    deployedAt: row.deployedAt.toISOString(),
    deployedBy: row.deployedBy,
    commitSha: row.commitSha ?? undefined,
    notes: row.notes ?? undefined,
    metadata: row.metadata ?? undefined,
  };
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

router.get("/deployments", perUserApiSlidingLimiter, async (req: Request, res: Response) => {
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
    const deployments = rows.map(toRecord);
    return sendSuccess(res, { deployments, environment: env, count: deployments.length });
  } catch (err) {
    return handleRouteError(res, err, "GET /deployments");
  }
});

router.get("/deployments/:appId", perUserApiSlidingLimiter, async (req: Request, res: Response) => {
  try {
    const { appId } = req.params;
    const env = (req.query.environment as string) ?? "production";
    const active = await getActive(appId, env);
    if (!active) {
      return sendNotFound(res, `No active deployment for app '${appId}' in '${env}'`);
    }
    return sendSuccess(res, toRecord(active));
  } catch (err) {
    return handleRouteError(res, err, `GET /deployments/${req.params.appId}`);
  }
});

router.get("/deployments/:appId/history", perUserApiSlidingLimiter, async (req: Request, res: Response) => {
  try {
    const { appId } = req.params;
    const env = (req.query.environment as string) ?? "production";
    const rows = await getHistory(appId, env);
    const history = rows.map(toRecord);
    return sendSuccess(res, { appId, environment: env, history, count: history.length });
  } catch (err) {
    return handleRouteError(res, err, `GET /deployments/${req.params.appId}/history`);
  }
});

router.post("/deployments", perUserWriteSlidingLimiter, async (req: Request, res: Response) => {
  try {
    const { appId, appName, version, environment, deployedBy, commitSha, notes, metadata } =
      req.body as Partial<DeploymentRecord>;
    if (!appId || !version || !environment) {
      return sendBadRequest(res, "appId, version, and environment are required");
    }

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
          deployedBy: deployedBy ?? (req.user?.id ?? "system"),
          commitSha: commitSha ?? null,
          notes: notes ?? null,
          metadata: metadata ?? null,
        })
        .returning();
      return row!;
    });

    logger.info({ appId, version, environment }, "Deployment registered");
    return sendCreated(res, toRecord(inserted));
  } catch (err) {
    return handleRouteError(res, err, "POST /deployments");
  }
});

router.post("/deployments/:appId/rollback", perUserWriteSlidingLimiter, async (req: Request, res: Response) => {
  try {
    const { appId } = req.params;
    const env = (req.body.environment as string) ?? "production";
    const targetVersion = req.body.version as string | undefined;

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
          deployedBy: req.user?.id ?? "system",
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
    return sendSuccess(res, {
      rolledBack: true,
      previous: toRecord(result.previous),
      current: toRecord(result.rolled),
    });
  } catch (err) {
    return handleRouteError(res, err, `POST /deployments/${req.params.appId}/rollback`);
  }
});

export default router;
