import type { IRouter } from "express";
import { perUserApiSlidingLimiter, perUserWriteSlidingLimiter } from "../../middlewares/sliding-window-limiter";
import { tenantScope } from "../../middlewares/tenant-scope";
import verifierRouter from "../verifier";
import { validateBody, jsonObjectBodySchema } from "../../lib/validation";

export function register(router: IRouter): void {
  router.use("/verifier", tenantScope({ required: true }));

  router.use("/verifier", perUserApiSlidingLimiter);
  router.post("/verifier", perUserWriteSlidingLimiter);
  router.use(verifierRouter);
}
