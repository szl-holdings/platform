import type { IRouter } from "express";
import { perUserApiSlidingLimiter, perUserWriteSlidingLimiter } from "../../middlewares/sliding-window-limiter";
import { tenantScope } from "../../middlewares/tenant-scope";
import { lazyMount, lazyMatch } from "../../lib/lazy-router";

export function register(router: IRouter): void {
  router.use("/decisioning", tenantScope({ required: true }));
  router.use("/decision-fabric", tenantScope({ required: true }));

  router.use("/decisioning", perUserApiSlidingLimiter);
  router.use(lazyMatch("/decisioning", () => import("../decisioning"), "decisioning"));
  router.use("/decision-fabric", perUserApiSlidingLimiter);
  router.use(lazyMatch("/decision-fabric", () => import("../decision-fabric"), "decision-fabric"));

  router.use("/decisions", tenantScope({ required: true }));
  router.use("/decisions", perUserWriteSlidingLimiter);
  router.use(lazyMatch("/decisions", () => import("../decisions-receipts"), "decisions-receipts"));
}
