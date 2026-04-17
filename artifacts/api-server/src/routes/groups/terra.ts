import type { IRouter } from "express";
import { perUserApiSlidingLimiter, perUserWriteSlidingLimiter } from "../../middlewares/sliding-window-limiter";

import terraRouter from "../terra";
import terraCrmRouter from "../terra-crm";
import terraDistressRouter from "../terra-distress";
import terraBrokerRouter from "../terra-broker";
import terraLiveRouter from "../terra-live";
import terraCognitiveRouter from "../terra-cognitive";

const _readLimiter = perUserApiSlidingLimiter;
const _writeLimiter = perUserWriteSlidingLimiter;

export function register(router: IRouter): void {
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
}
