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
import trustProvenanceRouter from "./trust-provenance";
import tracesRouter from "./traces";
import reflectionsRouter from "./reflections";
import plansRouter from "./plans";
import * as alloyRuntime from "./groups/alloy-runtime-group";
import * as selfModel from "./groups/self-model";
import * as verifier from "./groups/verifier";
import * as skillLibrary from "./groups/skill-library";
import * as crossPlatform from "./groups/cross-platform";
import nexusRouter from "./nexus";
import replayRouter from "./replay";
import cognitiveRuntimeRouter from "./cognitive-runtime";
import execBriefingsRouter from "./executive-briefings";
import fundInboundDealsRouter from "./fund-inbound-deals";
import aegisPcapRouter from "./aegis-pcap";
import carlotaTimeTrackingRouter from "./carlota-time-tracking";
import lpPortalRouter from "./lp-portal";
import atlasArtifactsRouter from "./atlas-artifacts";
import outcomeGraphRouter from "./outcome-graph";
import pageViewTrackingRouter from "./page-view-tracking";
import newsletterRouter from "./newsletter";
import selfHealingRouter from "./self-healing";
import simulationWhatIfRouter from "./simulation-whatif";
import infrastructureStatusRouter from "./infrastructure-status";
import debugRouter from "./debug";
import mapsRouter from "./maps";
import atlasSceneExportRouter from "./atlas-scene-export";
import preferencesRouter from "./preferences";
import evidenceGraphRouter from "./evidence-graph";
import policyModesRouter from "./policy-modes";
import demoGovernedScenariosRouter from "./demo-governed-scenarios";
import counselRouter from "./counsel";
import fabricRouter from "./fabric";
import narrativesRouter from "./narratives";
import actionStoreRouter from "./action-store";
import lyteSurfacesRouter from "./lyte-surfaces";
import lyteIntelRouter from "./lyte-intel";
import riskEvidenceRouter from "./risk-evidence";

const router: IRouter = Router();

// Carlota Jo time-tracking & invoice routes (public, unauthenticated).
// Mounted at the TOP of the /api router, BEFORE any route group that applies
// blanket auth/tenant-scope middleware to an unprefixed sub-router — otherwise
// those guards would intercept /booking/time-entries and /booking/time-invoices
// and return 401 before the handlers run. See carlota-time-tracking.ts for the
// matching PUBLIC_PREFIXES allowlist in global-auth-enforcer.ts.
router.use(carlotaTimeTrackingRouter);

// Anonymous page-view tracking — public, unauthenticated.  Must be mounted
// BEFORE guardianPolicyCheck so pre-login visitors can POST without a session.
// The /api/track/ prefix is also in PUBLIC_PREFIXES in global-auth-enforcer.ts.
router.use(pageViewTrackingRouter);

// Newsletter subscribe proxy — public, unauthenticated. Forwards email
// subscriptions to the Substack API on behalf of all portfolio sites.
// /api/newsletter/ is in PUBLIC_PREFIXES in global-auth-enforcer.ts.
router.use(newsletterRouter);

// Self-healing orchestrator — GET routes are publicly accessible (stats, policies
// and runs are whitelisted in global-auth-enforcer via PUBLIC_EXACT_PATHS/PREFIX).
// The PATCH /policies/:id/toggle mutation requires auth and is NOT whitelisted.
// Must be mounted BEFORE guardianPolicyCheck so the public GETs reach the handler.
router.use(selfHealingRouter);

// Simulation what-if engine — POST route is public so the Strategy simulation
// page can compute cross-domain scenario impacts in demo mode. Must be mounted
// BEFORE guardianPolicyCheck. /api/simulation/ is in PUBLIC_PREFIXES.
router.use(simulationWhatIfRouter);

// Infrastructure status — lightweight public endpoint used by the Legatus
// console to show live AquilaScore and threat level. Must be mounted
// BEFORE guardianPolicyCheck. /api/infrastructure/ is in PUBLIC_PREFIXES.
router.use(infrastructureStatusRouter);

// PRISM Counsel — GC matters CRUD (public, demo data backed by Postgres).
// /api/counsel/ is in PUBLIC_PREFIXES in global-auth-enforcer.ts.
router.use(counselRouter);

// Cross-platform intelligence — read-only GET routes for signal correlations,
// shared evidence registry, run health, and pilot intelligence. Mounted BEFORE
// guardianPolicyCheck. NOT in PUBLIC_PREFIXES — protected in production by the
// global auth enforcer (NODE_ENV === "production" blocks unauthenticated access).
crossPlatform.register(router);

// Global Operations Fabric — read-only snapshot + SSE stream aggregating all
// products, signals, runs, alerts, recommendations, approvals, connector health
// and system health. Public in demo/dev mode so the Fabric page works without auth.
router.use(fabricRouter);

// Public read-only narrative payloads (Sentra, Counsel) for the demo
// Decision Center pages. Mounted BEFORE guardianPolicyCheck.
// /api/narratives/ is in PUBLIC_PREFIXES in global-auth-enforcer.ts.
router.use(narrativesRouter);

// Shared action store — persists risk owner assignments and decisions for the
// Business State / Enterprise State pages so all team members see the same
// synchronized state instead of per-browser localStorage. Public,
// unauthenticated; mounted BEFORE guardianPolicyCheck and exempted in the
// global-auth-enforcer / csrf middleware allowlists.
router.use(actionStoreRouter);

// Shared risk evidence store — persists "Save run as evidence" Monte Carlo
// runs so external reviewers and lender briefings see the same cited
// envelopes that Terra/Vessels operators capture (instead of per-browser
// localStorage). Mounted BEFORE guardianPolicyCheck and exempted in the
// global-auth-enforcer / csrf middleware allowlists.
router.use(riskEvidenceRouter);

// Lyte legacy surfaces — read-only public GET endpoints backing the 5 legacy
// decision-intelligence pages. Mounted BEFORE lyte.register so the
// tenantScope middleware registered at "/lyte" never intercepts these routes.
// Exact paths are whitelisted in global-auth-enforcer.ts.
router.use(lyteSurfacesRouter);
router.use(lyteIntelRouter);

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

// tracesRouter (/runs*, /traces*, /reflections*, /plans*, /replay*) and its
// companions must be registered BEFORE ai.register() because copilotRouter
// is mounted there without a path prefix and applies a global
// tenantScope({ required: true }) that would terminate unauthenticated
// requests before they ever reach these handlers.
router.use(tracesRouter);
router.use(reflectionsRouter);
router.use(plansRouter);
router.use(replayRouter);
router.use(trustProvenanceRouter);

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

router.use(cognitiveRuntimeRouter);
router.use(atlasArtifactsRouter);
router.use(atlasSceneExportRouter);
router.use(outcomeGraphRouter);

router.use(evidenceGraphRouter);
router.use(mapsRouter);
router.use(debugRouter);
router.use(preferencesRouter);
router.use(policyModesRouter);
router.use(demoGovernedScenariosRouter);

export default router;
