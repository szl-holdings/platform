import type { IRouter } from "express";
import { perUserApiSlidingLimiter, perUserWriteSlidingLimiter } from "../../middlewares/sliding-window-limiter";
import { tenantScope } from "../../middlewares/tenant-scope";
import domainAtlasRouter from "../domain-atlas-execution";

export function register(router: IRouter): void {
  router.use("/aegis/atlas", tenantScope({ required: true }));
  router.use("/vessels/atlas", tenantScope({ required: true }));
  router.use("/terra/atlas", tenantScope({ required: true }));
  router.use("/prism-counsel/atlas", tenantScope({ required: true }));
  router.use("/carlota-jo/atlas", tenantScope({ required: true }));
  router.use("/imperium/atlas", tenantScope({ required: true }));
  router.use("/atlas", tenantScope({ required: true }));

  router.use("/aegis/atlas", perUserApiSlidingLimiter);
  router.use("/vessels/atlas", perUserApiSlidingLimiter);
  router.use("/terra/atlas", perUserApiSlidingLimiter);
  router.use("/prism-counsel/atlas", perUserApiSlidingLimiter);
  router.use("/carlota-jo/atlas", perUserApiSlidingLimiter);
  router.use("/imperium/atlas", perUserApiSlidingLimiter);
  router.use("/atlas", perUserApiSlidingLimiter);

  router.use("/aegis/atlas", perUserWriteSlidingLimiter);
  router.use("/vessels/atlas", perUserWriteSlidingLimiter);
  router.use("/terra/atlas", perUserWriteSlidingLimiter);
  router.use("/prism-counsel/atlas", perUserWriteSlidingLimiter);
  router.use("/carlota-jo/atlas", perUserWriteSlidingLimiter);
  router.use("/imperium/atlas", perUserWriteSlidingLimiter);

  router.use(domainAtlasRouter);
}
