import type { IRouter } from "express";
import { perUserApiSlidingLimiter } from "../../middlewares/sliding-window-limiter";
import { tenantScope } from "../../middlewares/tenant-scope";

import vesselsRouter from "../vessels";
import vesselsPlatformRouter from "../vessels-platform";
import vesselsLiveRouter from "../vessels-live";
import vesselsExtendedRouter from "../vessels-extended";
import vesselsTradingRouter from "../vessels-trading";
import vesselsInsuranceRouter from "../vessels-insurance";
import vesselsCognitiveRouter from "../vessels-cognitive";
import vesselsDigitalTwinRouter from "../vessels-digital-twin";
import vesselsModulesRouter from "../vessels-modules";
import vesselsVoyageRiskRouter from "../vessels-voyage-risk";

export function register(router: IRouter): void {
  router.use("/vessels", tenantScope({ required: true }));
  router.use("/vessels", perUserApiSlidingLimiter);

  router.use(vesselsRouter);
  router.use(vesselsExtendedRouter);
  router.use(vesselsPlatformRouter);
  router.use(vesselsLiveRouter);
  router.use(vesselsTradingRouter);
  router.use(vesselsInsuranceRouter);
  router.use(vesselsCognitiveRouter);
  router.use(vesselsDigitalTwinRouter);
  router.use(vesselsModulesRouter);
  router.use(vesselsVoyageRiskRouter);
}
