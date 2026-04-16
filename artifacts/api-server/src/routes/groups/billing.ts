import type { IRouter } from "express";
import { perUserApiSlidingLimiter, perUserWriteSlidingLimiter } from "../../middlewares/sliding-window-limiter";
import { idempotencyMiddleware, optionalIdempotencyMiddleware } from "../../middlewares/idempotency";

import billingRouter from "../billing";
import meteringRouter from "../metering";
import usageRouter from "../usage";
import partnerPortalRouter from "../partner-portal";
import featureFlagsRouter from "../feature-flags";
import notificationsRouter from "../notifications";
import projectsRouter from "../projects";
import servicesRouter from "../services";
import connectorsRouter from "../connectors";

const _readLimiter = perUserApiSlidingLimiter;
const _writeLimiter = perUserWriteSlidingLimiter;

export function register(router: IRouter): void {
  router.use("/billing", _writeLimiter);
  router.use("/billing", optionalIdempotencyMiddleware);
  router.use("/billing/checkout", idempotencyMiddleware);
  router.use("/billing/terra/subscribe", idempotencyMiddleware);
  router.use("/billing/cancel-subscription", idempotencyMiddleware);
  router.use("/billing/update-subscription", idempotencyMiddleware);
  router.use(billingRouter);

  router.use("/metering", _readLimiter);
  router.use("/metering", _writeLimiter);
  router.use(meteringRouter);

  router.use(usageRouter);

  router.use("/partner", _writeLimiter);
  router.use("/partner", _readLimiter);
  router.use("/org-branding", _readLimiter);
  router.use("/orgs/:orgId/branding", _writeLimiter);
  router.use("/orgs/:orgId/custom-domains", _writeLimiter);
  router.use("/resolve-domain", _readLimiter);
  router.use(partnerPortalRouter);

  router.use("/feature-flags", _writeLimiter);
  router.use(featureFlagsRouter);

  router.use("/notifications", _writeLimiter);
  router.use(notificationsRouter);

  router.use("/projects", _writeLimiter);
  router.use(projectsRouter);

  router.use(servicesRouter);

  router.use("/connectors", _writeLimiter);
  router.use(connectorsRouter);
}
