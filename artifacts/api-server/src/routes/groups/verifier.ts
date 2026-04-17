import type { IRouter } from "express";
import { perUserApiSlidingLimiter, perUserWriteSlidingLimiter } from "../../middlewares/sliding-window-limiter";
import verifierRouter from "../verifier";

export function register(router: IRouter): void {
  router.use("/verifier", perUserApiSlidingLimiter);
  router.post("/verifier", perUserWriteSlidingLimiter);
  router.use(verifierRouter);
}
