import type { IRouter } from "express";
import { perUserApiSlidingLimiter } from "../../middlewares/sliding-window-limiter";
import { tenantScope } from "../../middlewares/tenant-scope";
import graphRouter from "../graph";

export function register(router: IRouter): void {
  router.use("/graph", tenantScope({ required: true }));

  router.use("/graph", perUserApiSlidingLimiter);
  router.use(graphRouter);
}
