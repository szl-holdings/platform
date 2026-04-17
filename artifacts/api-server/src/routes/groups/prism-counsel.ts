import type { IRouter } from "express";
import { perUserApiSlidingLimiter, perUserWriteSlidingLimiter } from "../../middlewares/sliding-window-limiter";
import { tenantScope } from "../../middlewares/tenant-scope";

import prismCounselCoreRouter from "../prism-counsel-core";
import prismCounselOpsRouter from "../prism-counsel-ops";
import prismCounselS31Router from "../prism-counsel-s31";
import { prismCounselPilotRouter } from "../prism-counsel-pilot";
import { prismCounselPilotOneRouter } from "../prism-counsel-pilot-one";
import prismCounselReviewRouter from "../prism-counsel-review";
import prismCounselPurviewRouter from "../prism-counsel-purview";
import prismCounselCourtRouter from "../prism-counsel-court";
import prismCounselNyRouter from "../prism-counsel-ny";

const _readLimiter = perUserApiSlidingLimiter;
const _writeLimiter = perUserWriteSlidingLimiter;

export function register(router: IRouter): void {
  router.use("/prism-counsel", tenantScope({ required: true }));

  router.use("/prism-counsel", _readLimiter);
  router.use("/prism-counsel", _writeLimiter);
  router.use(prismCounselCoreRouter);
  router.use("/prism-counsel", prismCounselOpsRouter);
  router.use("/prism-counsel/s31", prismCounselS31Router);
  router.use("/prism-counsel/pilot", prismCounselPilotRouter);
  router.use("/prism-counsel/pilot-one", prismCounselPilotOneRouter);
  router.use("/prism-counsel", prismCounselReviewRouter);
  router.use("/prism-counsel", prismCounselPurviewRouter);
  router.use("/prism-counsel", prismCounselCourtRouter);
  router.use(prismCounselNyRouter);
}
