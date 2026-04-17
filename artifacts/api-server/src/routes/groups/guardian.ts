import type { IRouter } from "express";
import { perUserApiSlidingLimiter, perUserWriteSlidingLimiter } from "../../middlewares/sliding-window-limiter";
import { tenantScope } from "../../middlewares/tenant-scope";
import guardianRouter from "../guardian";

export function register(router: IRouter): void {
  router.use("/guardian", tenantScope({ required: true }));

  router.use("/guardian", perUserApiSlidingLimiter);
  router.use("/guardian/decide", perUserWriteSlidingLimiter);
  router.use(guardianRouter);
}
