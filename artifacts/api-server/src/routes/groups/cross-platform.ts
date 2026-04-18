import type { IRouter } from "express";
import { perUserApiSlidingLimiter } from "../../middlewares/sliding-window-limiter";
import crossPlatformRouter from "../cross-platform";

export function register(router: IRouter): void {
  router.use("/cross-platform", perUserApiSlidingLimiter);
  router.use(crossPlatformRouter);
}
