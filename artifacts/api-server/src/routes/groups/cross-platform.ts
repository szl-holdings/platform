import type { IRouter } from "express";
import { perUserApiSlidingLimiter } from "../../middlewares/sliding-window-limiter";
import { lazyMount, lazyMatch } from "../../lib/lazy-router";

export function register(router: IRouter): void {
  router.use("/cross-platform", perUserApiSlidingLimiter);
  router.use(lazyMatch("/cross-platform", () => import("../cross-platform"), "cross-platform"));
}
