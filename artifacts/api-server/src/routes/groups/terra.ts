import type { IRouter } from "express";
import { perUserApiSlidingLimiter, perUserWriteSlidingLimiter } from "../../middlewares/sliding-window-limiter";
import { tenantScope } from "../../middlewares/tenant-scope";

import terraRouter from "../terra";
import terraCrmRouter from "../terra-crm";
import terraDistressRouter from "../terra-distress";
import terraBrokerRouter from "../terra-broker";
import terraLiveRouter from "../terra-live";
import terraCognitiveRouter from "../terra-cognitive";
import terraModulesRouter from "../terra-modules";
import terraDigitalTwinRouter from "../terra-digital-twin";
import terraPropertyIntelRouter from "../terra-property-intel";

const _readLimiter = perUserApiSlidingLimiter;
const _writeLimiter = perUserWriteSlidingLimiter;

export function register(router: IRouter): void {
  // Property intelligence module routes are public (demo-friendly, authOptional).
  // They MUST be registered before the tenantScope middleware on "/terra" so
  // unauthenticated visitors can access property-scoped intelligence data.
  router.use(terraPropertyIntelRouter);

  router.use("/terra", tenantScope({ required: true }));
  router.use("/beacon", tenantScope({ required: true }));

  router.use("/terra", _readLimiter);
  router.use(terraRouter);
  router.use("/beacon", _readLimiter);
  router.use(terraRouter);

  router.use("/terra", _readLimiter);
  router.use(terraDistressRouter);
  router.use("/beacon", _readLimiter);
  router.use(terraDistressRouter);

  router.use("/terra", _readLimiter);
  router.use(terraBrokerRouter);

  router.use("/terra", _writeLimiter);
  router.use(terraCrmRouter);
  router.use("/beacon", _writeLimiter);
  router.use(terraCrmRouter);

  router.use("/terra", _readLimiter);
  router.use(terraLiveRouter);
  router.use("/beacon", _readLimiter);
  router.use(terraLiveRouter);

  router.use("/terra", _readLimiter);
  router.use(terraCognitiveRouter);
  router.use("/beacon", _readLimiter);
  router.use(terraCognitiveRouter);

  router.use("/terra", _writeLimiter);
  router.use(terraModulesRouter);
  router.use("/beacon", _writeLimiter);
  router.use(terraModulesRouter);

  router.use("/terra", _readLimiter);
  router.use(terraDigitalTwinRouter);
}
