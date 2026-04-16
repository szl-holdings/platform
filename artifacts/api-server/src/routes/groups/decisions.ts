import type { IRouter } from "express";
import { perUserApiSlidingLimiter, perUserWriteSlidingLimiter } from "../../middlewares/sliding-window-limiter";
import decisioningRouter from "../decisioning";
import decisionFabricRouter from "../decision-fabric";

export function register(router: IRouter): void {
  router.use("/decisioning", perUserApiSlidingLimiter);
  router.use(decisioningRouter);
  router.use("/decision-fabric", perUserApiSlidingLimiter);
  router.use(decisionFabricRouter);
}
