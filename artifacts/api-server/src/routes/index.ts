import { Router, type IRouter } from "express";
import pulseBriefingRouter from "./pulse";
import evalsRouter from "./evals";
import briefingsRouter from "./briefings";
import driftRouter from "./drift";
import deploymentsRouter from "./deployments";
import domainsRouter from "./domains";
import constellationViewsRouter from "./constellation-views";
import { perUserApiSlidingLimiter } from "../middlewares/sliding-window-limiter";
import { guardianPolicyCheck } from "../middlewares/guardian-policy";
import * as core from "./groups/core";
import * as vessels from "./groups/vessels";
import * as security from "./groups/security";
import * as lyte from "./groups/lyte";
import * as terra from "./groups/terra";
import * as alloy from "./groups/alloy";
import * as prismCounsel from "./groups/prism-counsel";
import * as platform from "./groups/platform";
import * as ai from "./groups/ai";
import * as operations from "./groups/operations";
import * as dataServices from "./groups/data-services";
import * as billing from "./groups/billing";
import * as misc from "./groups/misc";
import carlotaJoInvoiceEmailRouter from "./carlota-jo-invoice-email";
import * as decisions from "./groups/decisions";
import * as domainAtlas from "./groups/domain-atlas";
import * as graph from "./groups/graph";
import * as guardian from "./groups/guardian";
import tracesRouter from "./traces";
import reflectionsRouter from "./reflections";
import plansRouter from "./plans";
import * as alloyRuntime from "./groups/alloy-runtime-group";
import * as selfModel from "./groups/self-model";
import * as verifier from "./groups/verifier";
import * as skillLibrary from "./groups/skill-library";
import nexusRouter from "./nexus";
import cognitiveRuntimeRouter from "./cognitive-runtime";
import execBriefingsRouter from "./executive-briefings";
import fundInboundDealsRouter from "./fund-inbound-deals";
import aegisPcapRouter from "./aegis-pcap";
import carlotaTimeTrackingRouter from "./carlota-time-tracking";
import lpPortalRouter from "./lp-portal";

const router: IRouter = Router();

// Carlota Jo time-tracking & invoice routes (public, unauthenticated).
// Mounted at the TOP of the /api router, BEFORE any route group that applies
// blanket auth/tenant-scope middleware to an unprefixed sub-router — otherwise
// those guards would intercept /booking/time-entries and /booking/time-invoices
// and return 401 before the handlers run. See carlota-time-tracking.ts for the
// matching PUBLIC_PREFIXES allowlist in global-auth-enforcer.ts.
router.use(carlotaTimeTrackingRouter);

// Global Guardian policy check — derives category from request path and
// applies to every agent-facing route family. Read-only methods skip
// automatically. Tier is derived server-side from authenticated user.
router.use(guardianPolicyCheck());

// Carlota Jo invoice email router is mounted early (before group registers)
// so it matches before unrelated sub-routers — like copilotRouter — that
// apply tenantScope as router-level middleware. Tracked by follow-up #1367;
// once that lands, this early mount can be removed.
router.use(carlotaJoInvoiceEmailRouter);

router.use("/pulse", perUserApiSlidingLimiter, pulseBriefingRouter);
router.use("/pulse", perUserApiSlidingLimiter, execBriefingsRouter);
router.use(evalsRouter);
router.use(briefingsRouter);
router.use(driftRouter);
router.use(deploymentsRouter);
router.use(domainsRouter);
router.use(constellationViewsRouter);
router.use(fundInboundDealsRouter);
router.use(aegisPcapRouter);
router.use(lpPortalRouter);

core.register(router);
vessels.register(router);
security.register(router);
lyte.register(router);
terra.register(router);
alloy.register(router);
prismCounsel.register(router);
platform.register(router);
ai.register(router);
operations.register(router);
dataServices.register(router);
billing.register(router);
misc.register(router);
decisions.register(router);
domainAtlas.register(router);
graph.register(router);
guardian.register(router);
alloyRuntime.register(router);
selfModel.register(router);
verifier.register(router);
skillLibrary.register(router);

router.use("/nexus", nexusRouter);

router.use(tracesRouter);
router.use(reflectionsRouter);
router.use(plansRouter);
router.use(cognitiveRuntimeRouter);

export default router;
