import type { IRouter } from "express";
import { perUserApiSlidingLimiter, perUserWriteSlidingLimiter } from "../../middlewares/sliding-window-limiter";
import { adminGuard } from "../../middlewares/admin-guard";
import { tenantScope } from "../../middlewares/tenant-scope";

import adminRouter from "../admin";
import observabilityRouter from "../observability";
import opsManagementRouter from "../ops-management";
import commandRouter from "../command";
import governanceCountsRouter from "../governance-counts";
import businessEventsRouter from "../business-events-ingestion";

const _readLimiter = perUserApiSlidingLimiter;
const _writeLimiter = perUserWriteSlidingLimiter;

export function register(router: IRouter): void {
  router.use("/observability", tenantScope({ required: true }));
  router.use("/business-events", tenantScope({ required: true }));

  router.use("/admin", adminGuard);
  router.use(adminRouter);

  router.use("/observability", _readLimiter);
  router.use(observabilityRouter);

  router.use(opsManagementRouter);

  router.use("/command", _readLimiter);
  router.use("/command", _writeLimiter);
  router.use("/command", commandRouter);

  router.use("/governance", _readLimiter);
  router.use("/governance", governanceCountsRouter);

  router.use("/business-events", _writeLimiter);
  router.use(businessEventsRouter);
}
