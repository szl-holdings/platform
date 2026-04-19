import type { IRouter } from "express";
import { perUserApiSlidingLimiter, perUserWriteSlidingLimiter } from "../../middlewares/sliding-window-limiter";
import { tenantScope } from "../../middlewares/tenant-scope";
import { lazyMount, lazyMatch } from "../../lib/lazy-router";

export function register(router: IRouter): void {
  router.use("/self-model", tenantScope({ required: true }));

  router.use("/self-model", perUserApiSlidingLimiter);
  router.use("/self-model/run-outcome", perUserWriteSlidingLimiter);
  router.use(lazyMatch("/self-model", () => import("../self-model"), "self-model"));
}
