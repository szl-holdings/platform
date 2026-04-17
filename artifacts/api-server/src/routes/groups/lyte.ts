import type { IRouter } from "express";
import { perUserApiSlidingLimiter, perUserWriteSlidingLimiter } from "../../middlewares/sliding-window-limiter";
import { tenantScope } from "../../middlewares/tenant-scope";

import lyteRouter from "../lyte";
import lyteBillingRouter from "../lyte-billing";
import lytePlatformRouter from "../lyte-platform";
import lyteLiveRouter from "../lyte-live";
import lyteObservabilityRouter from "../lyte-observability";
import lyteExtendedRouter from "../lyte-extended";
import lyteCognitiveRouter from "../lyte-cognitive";

const _readLimiter = perUserApiSlidingLimiter;
const _writeLimiter = perUserWriteSlidingLimiter;

export function register(router: IRouter): void {
  router.use("/lyte", tenantScope({ required: true }));

  router.use("/lyte", _readLimiter);
  router.use("/lyte/billing", _writeLimiter);
  router.use(lyteBillingRouter);

  router.use("/lyte", lyteExtendedRouter);
  router.use(lyteObservabilityRouter);

  router.use("/lyte/platform", _readLimiter);
  router.use(lytePlatformRouter);

  router.use(lyteRouter);

  router.use("/lyte", _readLimiter);
  router.use(lyteLiveRouter);

  router.use("/lyte/cognitive", _readLimiter);
  router.use(lyteCognitiveRouter);
}
