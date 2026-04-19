import type { IRouter } from "express";
import { perUserApiSlidingLimiter, perUserWriteSlidingLimiter } from "../../middlewares/sliding-window-limiter";
import { tenantScope } from "../../middlewares/tenant-scope";
import { lazyMount, lazyMatch } from "../../lib/lazy-router";

export function register(router: IRouter): void {
  router.use("/verifier", tenantScope({ required: true }));

  router.use("/verifier", perUserApiSlidingLimiter);
  router.post("/verifier", perUserWriteSlidingLimiter);
  router.use(lazyMatch("/verifier", () => import("../verifier"), "verifier"));
}
