import type { IRouter } from "express";
import { perUserApiSlidingLimiter, perUserWriteSlidingLimiter } from "../../middlewares/sliding-window-limiter";
import guardianRouter from "../guardian";

export function register(router: IRouter): void {
  router.use("/guardian", perUserApiSlidingLimiter);
  router.use("/guardian/decide", perUserWriteSlidingLimiter);
  router.use(guardianRouter);
}
