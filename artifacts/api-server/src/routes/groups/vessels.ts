import type { IRouter } from "express";
import { perUserApiSlidingLimiter } from "../../middlewares/sliding-window-limiter";

import vesselsRouter from "../vessels";
import vesselsPlatformRouter from "../vessels-platform";
import vesselsLiveRouter from "../vessels-live";
import vesselsExtendedRouter from "../vessels-extended";
import vesselsTradingRouter from "../vessels-trading";
import vesselsInsuranceRouter from "../vessels-insurance";

const _readLimiter = perUserApiSlidingLimiter;

export function register(router: IRouter): void {
  router.use("/vessels", _readLimiter);
  router.use(vesselsRouter);

  router.use("/vessels", _readLimiter);
  router.use(vesselsExtendedRouter);

  router.use("/vessels/platform", _readLimiter);
  router.use(vesselsPlatformRouter);

  router.use("/vessels", _readLimiter);
  router.use(vesselsLiveRouter);

  router.use("/vessels/trading", _readLimiter);
  router.use(vesselsTradingRouter);

  router.use("/vessels/insurance", _readLimiter);
  router.use(vesselsInsuranceRouter);
}
