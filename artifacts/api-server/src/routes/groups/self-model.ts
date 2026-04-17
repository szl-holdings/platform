import type { IRouter } from "express";
import { perUserApiSlidingLimiter, perUserWriteSlidingLimiter } from "../../middlewares/sliding-window-limiter";
import selfModelRouter from "../self-model";

export function register(router: IRouter): void {
  router.use("/self-model", perUserApiSlidingLimiter);
  router.use("/self-model/run-outcome", perUserWriteSlidingLimiter);
  router.use(selfModelRouter);
}
