import { Router, type IRouter } from "express";
import { perUserApiSlidingLimiter } from "../middlewares/sliding-window-limiter";
import { guardianPolicyCheck } from "../middlewares/guardian-policy";
import { lazyMount, lazyMatch } from "../lib/lazy-router";
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
import * as decisions from "./groups/decisions";
import * as domainAtlas from "./groups/domain-atlas";
import * as graph from "./groups/graph";
import * as guardian from "./groups/guardian";
import * as alloyRuntime from "./groups/alloy-runtime-group";
import * as selfModel from "./groups/self-model";
import * as verifier from "./groups/verifier";
import * as skillLibrary from "./groups/skill-library";
import * as crossPlatform from "./groups/cross-platform";

const router: IRouter = Router();

// Carlota Jo time-tracking & invoice routes (public, unauthenticated).
// Owns /booking/time-entries and /booking/time-invoices.
router.use(lazyMatch("/booking", () => import("./carlota-time-tracking"), "carlota-time-tracking"));

// Anonymous page-view tracking — public, unauthenticated.
router.use(lazyMatch("/track", () => import("./page-view-tracking"), "page-view-tracking"));

// Public anonymous analytics-engine ingest.
router.use(lazyMatch("/analytics-engine", () => import("./analytics-engine-public"), "analytics-engine-public"));

// Newsletter subscribe proxy — public, unauthenticated.
router.use(lazyMatch("/newsletter", () => import("./newsletter"), "newsletter"));

// Self-healing orchestrator — public GETs.
router.use(lazyMatch("/self-healing", () => import("./self-healing"), "self-healing"));

// Simulation what-if engine — POST route is public.
router.use(lazyMatch("/simulation", () => import("./simulation-whatif"), "simulation-whatif"));

// Infrastructure status — public.
router.use(lazyMatch("/infrastructure", () => import("./infrastructure-status"), "infrastructure-status"));

// PRISM Counsel — public matters CRUD.
router.use(lazyMatch("/counsel", () => import("./counsel"), "counsel"));

// Cross-platform intelligence — read-only (auth-gated in production).
crossPlatform.register(router);

// Global Operations Fabric — read-only snapshot + SSE stream.
router.use(lazyMatch("/fabric", () => import("./fabric"), "fabric"));

// Public read-only narrative payloads.
router.use(lazyMatch("/narratives", () => import("./narratives"), "narratives"));

// Shared action store — public, unauthenticated.
router.use(lazyMatch("/action-store", () => import("./action-store"), "action-store"));

// Competitive Intel monitor — public Atlas demo surface.
router.use("/competitive-intel", lazyMount(() => import("./competitive-intel"), "competitive-intel"));

// Shared risk evidence store — public.
router.use(lazyMatch("/risk-evidence", () => import("./risk-evidence"), "risk-evidence"));

// Agent Mesh telemetry — public read-only state + scan endpoints used by
// Sentra's Mesh Map and Pulse's MeshCard. Mounted BEFORE guardianPolicyCheck
// so unauthenticated demo views can hydrate. Scan is also public (no
// destructive side-effects beyond rewriting the per-org telemetry slice).
router.use(lazyMatch("/agent-mesh", () => import("./agent-mesh"), "agent-mesh"));

// Lyte legacy surfaces — read-only public GET endpoints backing the 5 legacy
// decision-intelligence pages. Mounted BEFORE lyte.register so the
// tenantScope middleware registered at "/lyte" never intercepts these routes.
// Exact paths are whitelisted in global-auth-enforcer.ts.
router.use(lazyMatch("/lyte", () => import("./lyte-surfaces"), "lyte-surfaces"));
router.use(lazyMatch("/lyte", () => import("./lyte-intel"), "lyte-intel"));

// Global Guardian policy check — derives category from request path.
router.use(guardianPolicyCheck());

// Carlota Jo invoice email router — mounted early.
router.use(lazyMatch("/booking", () => import("./carlota-jo-invoice-email"), "carlota-jo-invoice-email"));

// Pulse demo + briefing surfaces — owns multiple top-level prefixes.
router.use(
  perUserApiSlidingLimiter,
  lazyMatch(
    [
      "/demo",
      "/today",
      "/briefings",
      "/domain-panel",
      "/confidence",
      "/custom",
      "/dissents",
      "/export",
      "/subscriptions",
      "/unsubscribe",
    ],
    () => import("./pulse"),
    "pulse",
  ),
);
router.use("/executive", perUserApiSlidingLimiter, lazyMount(() => import("./executive-briefings"), "executive-briefings"));
router.use(lazyMatch("/evals", () => import("./evals"), "evals"));
router.use(lazyMatch("/briefings", () => import("./briefings"), "briefings"));
router.use(lazyMatch("/drift", () => import("./drift"), "drift"));
router.use(lazyMatch("/deployments", () => import("./deployments"), "deployments"));
router.use(lazyMatch("/domains", () => import("./domains"), "domains"));
router.use(lazyMatch("/constellation", () => import("./constellation-views"), "constellation-views"));
router.use(
  lazyMatch(
    ["/fund-inbound-deals", "/public/fund-inbound-deals"],
    () => import("./fund-inbound-deals"),
    "fund-inbound-deals",
  ),
);
router.use(lazyMatch("/aegis", () => import("./aegis-pcap"), "aegis-pcap"));
router.use(lazyMatch("/lp-portal", () => import("./lp-portal"), "lp-portal"));

// Trace/reflection/plan/replay routers must be registered BEFORE ai.register()
// because copilotRouter applies a global tenantScope that would terminate
// unauthenticated requests before they reach these handlers. Note traces.ts
// also serves /runs* paths.
router.use(lazyMatch(["/traces", "/runs"], () => import("./traces"), "traces"));
router.use(lazyMatch("/reflections", () => import("./reflections"), "reflections"));
router.use(lazyMatch("/plans", () => import("./plans"), "plans"));
router.use(lazyMatch("/replay", () => import("./replay"), "replay"));
router.use(
  lazyMatch(["/proof-chain", "/audit-log"], () => import("./trust-provenance"), "trust-provenance"),
);
router.use(lazyMatch("/mcp-gateway", () => import("./mcp-gateway"), "mcp-gateway"));

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

router.use("/nexus", lazyMount(() => import("./nexus"), "nexus"));

router.use(lazyMatch("/cognitive-runtime", () => import("./cognitive-runtime"), "cognitive-runtime"));
router.use(lazyMatch("/atlas/artifacts", () => import("./atlas-artifacts"), "atlas-artifacts"));
router.use(
  lazyMatch(
    ["/atlas/snapshot", "/atlas/branch", "/atlas/proof-bundle", "/atlas/export"],
    () => import("./atlas-scene-export"),
    "atlas-scene-export",
  ),
);
router.use(lazyMatch("/outcome-graph", () => import("./outcome-graph"), "outcome-graph"));

router.use(lazyMatch("/evidence-graph", () => import("./evidence-graph"), "evidence-graph"));
router.use(lazyMatch("/maps", () => import("./maps"), "maps"));
router.use(lazyMatch("/debug", () => import("./debug"), "debug"));
router.use(lazyMatch("/preferences", () => import("./preferences"), "preferences"));
router.use(lazyMatch("/policy-modes", () => import("./policy-modes"), "policy-modes"));
router.use(
  lazyMatch("/demo/seed-governed-scenarios", () => import("./demo-governed-scenarios"), "demo-governed-scenarios"),
);

export default router;
