import type { IRouter } from "express";
import { perUserApiSlidingLimiter, perUserWriteSlidingLimiter } from "../../middlewares/sliding-window-limiter";
import { adminGuard } from "../../middlewares/admin-guard";

import adminRouter from "../admin";
import observabilityRouter from "../observability";
import opsManagementRouter from "../ops-management";
import commandRouter from "../command";

const _readLimiter = perUserApiSlidingLimiter;
const _writeLimiter = perUserWriteSlidingLimiter;

export function register(router: IRouter): void {
  router.use("/admin", adminGuard);
  router.use(adminRouter);

  router.use("/observability", _readLimiter);
  router.use(observabilityRouter);

  router.use(opsManagementRouter);

  router.use("/command", _readLimiter);
  router.use("/command", _writeLimiter);
  router.use("/command", commandRouter);
}
