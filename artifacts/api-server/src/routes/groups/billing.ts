import type { IRouter } from "express";
import { perUserApiSlidingLimiter, perUserWriteSlidingLimiter } from "../../middlewares/sliding-window-limiter";
import { idempotencyMiddleware, optionalIdempotencyMiddleware } from "../../middlewares/idempotency";
import { tenantScope } from "../../middlewares/tenant-scope";
import { lazyMount, lazyRegister, lazyMatch, lazyRegisterMatch } from "../../lib/lazy-router";

const _readLimiter = perUserApiSlidingLimiter;
const _writeLimiter = perUserWriteSlidingLimiter;

export function register(router: IRouter): void {
  router.use("/billing", tenantScope({ required: true }));
  router.use("/metering", tenantScope({ required: true }));
  router.use("/usage", tenantScope({ required: true }));
  router.use("/notifications", tenantScope({ required: true }));
  router.use("/projects", tenantScope({ required: true }));
  router.use("/connectors", tenantScope({ required: true }));
  router.use("/feature-flags", tenantScope({ required: true }));
  router.use("/partner", tenantScope({ required: true }));
  router.use("/services", tenantScope({ required: true }));

  router.use("/billing", _writeLimiter);
  router.use("/billing", optionalIdempotencyMiddleware);
  router.use("/billing/checkout", idempotencyMiddleware);
  router.use("/billing/terra/subscribe", idempotencyMiddleware);
  router.use("/billing/cancel-subscription", idempotencyMiddleware);
  router.use("/billing/update-subscription", idempotencyMiddleware);
  router.use(lazyMatch(["/billing", "/stripe"], () => import("../billing"), "billing"));

  router.use("/metering", _readLimiter);
  router.use("/metering", _writeLimiter);
  router.use(lazyRegisterMatch("/metering", () => import("../metering"), "metering"));

  router.use(lazyMatch("/orgs", () => import("../usage"), "usage"));

  router.use("/partner", _writeLimiter);
  router.use("/partner", _readLimiter);
  router.use("/org-branding", _readLimiter);
  router.use("/orgs/:orgId/branding", _writeLimiter);
  router.use("/orgs/:orgId/custom-domains", _writeLimiter);
  router.use("/resolve-domain", _readLimiter);
  router.use(lazyMatch(["/partner", "/org-branding", "/orgs", "/resolve-domain"], () => import("../partner-portal"), "partner-portal"));

  router.use("/feature-flags", _writeLimiter);
  router.use(lazyMatch("/feature-flags", () => import("../feature-flags"), "feature-flags"));

  router.use("/notifications", _writeLimiter);
  router.use(lazyMatch("/notifications", () => import("../notifications"), "notifications"));

  router.use("/projects", _writeLimiter);
  router.use(lazyMatch("/projects", () => import("../projects"), "projects"));

  router.use(lazyMatch("/services", () => import("../services"), "services"));

  router.use("/connectors", _writeLimiter);
  router.use(lazyMatch("/connectors", () => import("../connectors"), "connectors"));
}
