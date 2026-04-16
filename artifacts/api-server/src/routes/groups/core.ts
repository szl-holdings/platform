import type { IRouter } from "express";
import { perUserApiSlidingLimiter, perUserWriteSlidingLimiter, strictAuthSlidingLimiter } from "../../middlewares/sliding-window-limiter";
import { idempotencyMiddleware, optionalIdempotencyMiddleware } from "../../middlewares/idempotency";

import healthRouter from "../health";
import healthIntegrationsRouter from "../health-integrations";
import authRouter from "../auth";
import oidcAuthRouter from "../oidc-auth";
import webhooksRouter from "../webhooks";
import externalIntegrationsRouter from "../external-integrations";
import filesRouter from "../files";
import storageRouter from "../storage";
import configRouter from "../config";
import backupRouter from "../backup";
import apmRouter from "../apm";
import publicStatusRouter from "../public-status";
import contactRouter from "../contact";
import demoRequestsRouter from "../demo-requests";
import { feedbackRouter } from "../feedback";
import coreRouter from "../core";

const _authLimiter = strictAuthSlidingLimiter;
const _readLimiter = perUserApiSlidingLimiter;
const _writeLimiter = perUserWriteSlidingLimiter;

export function register(router: IRouter): void {
  router.use("/auth", _authLimiter);

  router.use("/storage/uploads", _writeLimiter);
  router.use("/storage", _readLimiter);
  router.use(storageRouter);

  router.use("/files", _writeLimiter);

  router.use(healthRouter);
  router.use(healthIntegrationsRouter);

  router.use("/webhooks", _writeLimiter);
  router.use("/webhooks", optionalIdempotencyMiddleware);
  router.use(webhooksRouter);

  router.use(externalIntegrationsRouter);
  router.use(authRouter);
  router.use(oidcAuthRouter);
  router.use(filesRouter);

  router.use("/contact", _writeLimiter);
  router.use(contactRouter);

  router.use("/demo-requests", _writeLimiter);
  router.use(demoRequestsRouter);

  router.use("/feedback", _writeLimiter);
  router.use(feedbackRouter);

  router.use(configRouter);
  router.use(apmRouter);

  router.use("/public", publicStatusRouter);
  router.use("/admin/status", _writeLimiter);
  router.use("/admin/status", publicStatusRouter);

  router.use("/core", _readLimiter);
  router.use(coreRouter);

  router.use("/admin/backup", _writeLimiter);
  router.use(backupRouter);
}
