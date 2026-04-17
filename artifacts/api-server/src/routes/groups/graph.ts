import type { IRouter } from "express";
import { perUserApiSlidingLimiter } from "../../middlewares/sliding-window-limiter";
import graphRouter from "../graph";

export function register(router: IRouter): void {
  router.use("/graph", perUserApiSlidingLimiter);
  router.use(graphRouter);
}
