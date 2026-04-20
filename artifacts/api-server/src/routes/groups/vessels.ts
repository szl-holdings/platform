import type { IRouter } from "express";
import { perUserApiSlidingLimiter } from "../../middlewares/sliding-window-limiter";
import { tenantScope } from "../../middlewares/tenant-scope";
import { lazyMount, lazyMatch } from "../../lib/lazy-router";

export function register(router: IRouter): void {
  router.use("/vessels", tenantScope({ required: true }));
  router.use("/vessels", perUserApiSlidingLimiter);

  router.use(lazyMatch("/vessels", () => import("../vessels"), "vessels"));
  router.use(lazyMatch("/vessels", () => import("../vessels-extended"), "vessels-extended"));
  router.use(lazyMatch("/vessels", () => import("../vessels-platform"), "vessels-platform"));
  router.use(lazyMatch("/vessels", () => import("../vessels-live"), "vessels-live"));
  router.use(lazyMatch("/vessels", () => import("../vessels-trading"), "vessels-trading"));
  router.use(lazyMatch("/vessels", () => import("../vessels-insurance"), "vessels-insurance"));
  router.use(lazyMatch("/vessels", () => import("../vessels-cognitive"), "vessels-cognitive"));
  router.use(lazyMatch("/vessels", () => import("../vessels-digital-twin"), "vessels-digital-twin"));
  router.use(lazyMatch("/vessels", () => import("../vessels-modules"), "vessels-modules"));
  router.use(lazyMatch("/vessels", () => import("../vessels-voyage-risk"), "vessels-voyage-risk"));
  router.use(lazyMatch("/vessels", () => import("../vessels-freight"), "vessels-freight"));
}
