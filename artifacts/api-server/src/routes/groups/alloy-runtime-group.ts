import type { IRouter } from "express";
import { perUserApiSlidingLimiter, perUserWriteSlidingLimiter } from "../../middlewares/sliding-window-limiter";
import { optionalIdempotencyMiddleware } from "../../middlewares/idempotency";
import alloyRuntimeRouter from "../alloy-runtime";
import memoryRouter from "../memory";

export function register(router: IRouter): void {
  router.use("/memory", perUserApiSlidingLimiter);
  router.use("/memory", perUserWriteSlidingLimiter);
  router.use(memoryRouter);

  router.use("/workflows", perUserApiSlidingLimiter);
  router.use("/workflow-runs", perUserApiSlidingLimiter);
  router.use("/workflow-runs", optionalIdempotencyMiddleware);
  router.use("/agents", perUserApiSlidingLimiter);
  router.use("/models", perUserApiSlidingLimiter);
  router.use("/prompts", perUserApiSlidingLimiter);
  router.use("/signals", perUserApiSlidingLimiter);
  router.use("/signals", perUserWriteSlidingLimiter);
  router.use("/actions", perUserApiSlidingLimiter);
  router.use("/recommendations", perUserApiSlidingLimiter);
  router.use(alloyRuntimeRouter);
}
