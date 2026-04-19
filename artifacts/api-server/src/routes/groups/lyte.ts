import type { IRouter } from "express";
import { perUserApiSlidingLimiter, perUserWriteSlidingLimiter } from "../../middlewares/sliding-window-limiter";
import { tenantScope } from "../../middlewares/tenant-scope";

import lyteRouter from "../lyte";
import lyteBillingRouter from "../lyte-billing";
import lyteLiveRouter from "../lyte-live";
import lyteObservabilityRouter from "../lyte-observability";
import lyteExtendedRouter from "../lyte-extended";
import lyteCognitiveRouter from "../lyte-cognitive";

const _readLimiter = perUserApiSlidingLimiter;
const _writeLimiter = perUserWriteSlidingLimiter;

// Canonical Lyte API surface (post task #2330 consolidation):
//   - /lyte/<resource>            CRUD over Lyte-domain tables (lyte.ts)
//   - /lyte/live/<feed>           Live external/computed feeds (lyte-live.ts + lyte.ts)
//   - /lyte/billing/*             Billing surface (lyte-billing.ts)
//   - /lyte/observability/*       Observability surface (lyte-observability.ts)
//   - /lyte/cognitive/*           Cognitive surface (lyte-cognitive.ts)
// The previous /lyte/platform/* layer (lyte-platform.ts) was removed because no
// frontend, scheduler, or test referenced it. Reintroduce only with a real consumer.
export function register(router: IRouter): void {
  router.use("/lyte", tenantScope({ required: true }));

  router.use("/lyte", _readLimiter);
  router.use("/lyte/billing", _writeLimiter);
  router.use(lyteBillingRouter);

  router.use("/lyte", lyteExtendedRouter);
  router.use(lyteObservabilityRouter);

  router.use(lyteRouter);

  router.use("/lyte", _readLimiter);
  router.use(lyteLiveRouter);

  router.use("/lyte/cognitive", _readLimiter);
  router.use(lyteCognitiveRouter);
}
