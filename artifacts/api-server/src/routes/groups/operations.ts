import type { IRouter } from "express";
import { perUserApiSlidingLimiter, perUserWriteSlidingLimiter } from "../../middlewares/sliding-window-limiter";
import { adminGuard } from "../../middlewares/admin-guard";
import { tenantScope } from "../../middlewares/tenant-scope";
import { lazyMount, lazyMatch } from "../../lib/lazy-router";

const _readLimiter = perUserApiSlidingLimiter;
const _writeLimiter = perUserWriteSlidingLimiter;

export function register(router: IRouter): void {
  router.use("/observability", tenantScope({ required: true }));
  router.use("/governance", tenantScope({ required: true }));
  router.use("/business-events", tenantScope({ required: true }));

  router.use("/admin", adminGuard);
  router.use(lazyMatch("/admin", () => import("../admin"), "admin"));

  router.use("/observability", _readLimiter);
  router.use(lazyMatch("/observability", () => import("../observability"), "observability"));

  router.use(lazyMatch("/ops", () => import("../ops-management"), "ops-management"));

  router.use("/command", _readLimiter);
  router.use("/command", _writeLimiter);
  router.use("/command", lazyMount(() => import("../command"), "command"));

  router.use("/governance", _readLimiter);
  router.use("/governance", lazyMount(() => import("../governance-counts"), "governance-counts"));

  router.use("/business-events", _writeLimiter);
  router.use(lazyMatch("/business-events", () => import("../business-events-ingestion"), "business-events-ingestion"));

  router.use("/linear", tenantScope({ required: true }));
  router.use("/linear", _writeLimiter);
  router.use(lazyMatch("/linear", () => import("../linear"), "linear"));
}
