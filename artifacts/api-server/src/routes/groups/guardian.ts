import type { IRouter } from "express";
import { perUserApiSlidingLimiter, perUserWriteSlidingLimiter } from "../../middlewares/sliding-window-limiter";
import { tenantScope } from "../../middlewares/tenant-scope";
import { lazyMount, lazyMatch } from "../../lib/lazy-router";

export function register(router: IRouter): void {
  router.use("/guardian", tenantScope({ required: true }));

  router.use("/guardian", perUserApiSlidingLimiter);
  router.use("/guardian/decide", perUserWriteSlidingLimiter);
  router.use(lazyMatch(["/policies", "/tools", "/actions", "/tool-approvals", "/approvals", "/audit", "/rollback-events", "/guardian", "/guardrail-configs"], () => import("../guardian"), "guardian"));
}
