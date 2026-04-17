import type { IRouter } from "express";
import { perUserApiSlidingLimiter } from "../../middlewares/sliding-window-limiter";
import skillsRouter from "../skills";

export function register(router: IRouter): void {
  router.use("/skills", perUserApiSlidingLimiter);
  router.use("/skill-runs", perUserApiSlidingLimiter);
  router.use(skillsRouter);
}
