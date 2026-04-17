/**
 * /deployments — Deployment registry stubs
 *
 * Tracks which domain-app versions are deployed to which environments.
 * Provides the stable contract for rollback, version pinning, and
 * the 12-step smoke test's "roll back bad version" step.
 *
 * Routes:
 *   GET  /deployments                        — list all registered deployments
 *   GET  /deployments/:appId                 — deployment detail for an app
 *   POST /deployments                        — register / update a deployment
 *   POST /deployments/:appId/rollback        — roll back to previous version
 *   GET  /deployments/:appId/history         — version history for an app
 */

import { Router, type IRouter, type Request, type Response } from "express";
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

export interface DeploymentRecord {
  appId: string;
  appName: string;
  version: string;
  environment: "development" | "staging" | "production";
  status: DeploymentStatus;
  deployedAt: string;
  deployedBy: string;
  commitSha?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

const deploymentStore = new Map<string, DeploymentRecord[]>();

function storeKey(appId: string, env: string): string {
  return `${appId}:${env}`;
}

function getHistory(appId: string, env: string): DeploymentRecord[] {
  return deploymentStore.get(storeKey(appId, env)) ?? [];
}

function getActive(appId: string, env: string): DeploymentRecord | undefined {
  const history = getHistory(appId, env);
  return history.find((r) => r.status === "active");
}

router.get("/deployments", perUserApiSlidingLimiter, async (req: Request, res: Response) => {
  try {
    const env = (req.query.environment as string) ?? "production";
    const all: DeploymentRecord[] = [];
    for (const records of deploymentStore.values()) {
      const active = records.find((r) => r.environment === env && r.status === "active");
      if (active) all.push(active);
    }
    return sendSuccess(res, { deployments: all, environment: env, count: all.length });
  } catch (err) {
    return handleRouteError(res, err, "GET /deployments");
  }
});

router.get("/deployments/:appId", perUserApiSlidingLimiter, async (req: Request, res: Response) => {
  try {
    const { appId } = req.params;
    const env = (req.query.environment as string) ?? "production";
    const active = getActive(appId, env);
    if (!active) {
      return sendNotFound(res, `No active deployment for app '${appId}' in '${env}'`);
    }
    return sendSuccess(res, active);
  } catch (err) {
    return handleRouteError(res, err, `GET /deployments/${req.params.appId}`);
  }
});

router.get("/deployments/:appId/history", perUserApiSlidingLimiter, async (req: Request, res: Response) => {
  try {
    const { appId } = req.params;
    const env = (req.query.environment as string) ?? "production";
    const history = getHistory(appId, env);
    return sendSuccess(res, { appId, environment: env, history, count: history.length });
  } catch (err) {
    return handleRouteError(res, err, `GET /deployments/${req.params.appId}/history`);
  }
});

router.post("/deployments", perUserWriteSlidingLimiter, async (req: Request, res: Response) => {
  try {
    const { appId, appName, version, environment, deployedBy, commitSha, notes, metadata } = req.body as Partial<DeploymentRecord>;
    if (!appId || !version || !environment) {
      return sendBadRequest(res, "appId, version, and environment are required");
    }
    const key = storeKey(appId, environment);
    const history = deploymentStore.get(key) ?? [];

    for (const rec of history) {
      if (rec.status === "active") rec.status = "inactive";
    }

    const record: DeploymentRecord = {
      appId,
      appName: appName ?? appId,
      version,
      environment: environment as DeploymentRecord["environment"],
      status: "active",
      deployedAt: new Date().toISOString(),
      deployedBy: deployedBy ?? (req.user?.id ?? "system"),
      commitSha,
      notes,
      metadata,
    };

    history.push(record);
    deploymentStore.set(key, history);
    logger.info({ appId, version, environment }, "Deployment registered");
    return sendCreated(res, record);
  } catch (err) {
    return handleRouteError(res, err, "POST /deployments");
  }
});

router.post("/deployments/:appId/rollback", perUserWriteSlidingLimiter, async (req: Request, res: Response) => {
  try {
    const { appId } = req.params;
    const env = (req.body.environment as string) ?? "production";
    const targetVersion = req.body.version as string | undefined;

    const key = storeKey(appId, env);
    const history = deploymentStore.get(key) ?? [];

    if (history.length < 2) {
      return sendBadRequest(res, "No previous version available to roll back to");
    }

    const activeIdx = history.findIndex((r) => r.status === "active");
    if (activeIdx < 0) {
      return sendBadRequest(res, "No active deployment to roll back");
    }

    let targetIdx: number;
    if (targetVersion) {
      targetIdx = history.findLastIndex((r) => r.version === targetVersion && r.status !== "active");
      if (targetIdx < 0) {
        return sendBadRequest(res, `Version '${targetVersion}' not found in history`);
      }
    } else {
      targetIdx = activeIdx > 0 ? activeIdx - 1 : -1;
      if (targetIdx < 0) {
        return sendBadRequest(res, "No previous version to roll back to");
      }
    }

    history[activeIdx]!.status = "rolled-back";
    const target = history[targetIdx]!;
    const rolled: DeploymentRecord = {
      ...target,
      status: "active",
      deployedAt: new Date().toISOString(),
      deployedBy: req.user?.id ?? "system",
      notes: `Rolled back from ${history[activeIdx]!.version} to ${target.version}`,
    };
    history.push(rolled);
    deploymentStore.set(key, history);

    logger.info({ appId, from: history[activeIdx]!.version, to: target.version }, "Rollback executed");
    return sendSuccess(res, { rolledBack: true, previous: history[activeIdx], current: rolled });
  } catch (err) {
    return handleRouteError(res, err, `POST /deployments/${req.params.appId}/rollback`);
  }
});

export default router;
