import { Router, type IRouter } from "express";
import { perUserApiSlidingLimiter } from "../middlewares/sliding-window-limiter";
import { guardianPolicyCheck } from "../middlewares/guardian-policy";
import { lazyMount, lazyMatch } from "../lib/lazy-router";
import emailWebhooksRouter from "./email-webhooks";
import * as core from "./groups/core";
import * as vessels from "./groups/vessels";
import * as security from "./groups/security";
import * as lyte from "./groups/lyte";
import * as terra from "./groups/terra";
import * as alloy from "./groups/alloy";
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
import decisionsRuntimeRouter from "./decisions-runtime";
import a11oyFabricRouter from "./a11oy-fabric-api";
import a11oyRuntimeRouter from "./a11oy-runtime-api.js";
import a11oySovereignRouter from "./a11oy-sovereign-api.js";
import publicA11oyRouter from "./public-a11oy-api";
import internalA11oyRouter from "./internal-a11oy-api";
import apiKeysRouter from "./api-keys";
import oauthRouter from "./oauth";
import meshObservabilityRouter from "./mesh-observability";

const router: IRouter = Router();

// Carlota Jo time-tracking & invoice routes (public, unauthenticated).
// Owns /booking/time-entries, /booking/time-invoices, and /booking/invoices/email.
router.use(lazyMatch("/booking", () => import("./carlota-time-tracking"), "carlota-time-tracking"));
router.use(lazyMatch("/booking", () => import("./carlota-jo-invoice-email"), "carlota-jo-invoice-email"));

// Carlota Jo metrics routes (public, unauthenticated).
// Owns /booking/team and /booking/engagements-summary for dashboard KPIs.
router.use(lazyMatch("/booking", () => import("./carlota-metrics"), "carlota-metrics"));

// Anonymous page-view tracking — public, unauthenticated.
router.use(lazyMatch("/track", () => import("./page-view-tracking"), "page-view-tracking"));

// Public anonymous analytics-engine ingest.
router.use(lazyMatch("/analytics-engine", () => import("./analytics-engine-public"), "analytics-engine-public"));

// Newsletter subscribe proxy — public, unauthenticated.
router.use(lazyMatch("/newsletter", () => import("./newsletter"), "newsletter"));

// Email provider webhooks (bounces, complaints) + unsubscribe handler — public, unauthenticated.
router.use(emailWebhooksRouter);

// Self-healing orchestrator — public GETs.
router.use(lazyMatch("/self-healing", () => import("./self-healing"), "self-healing"));

// Simulation what-if engine — POST route is public.
router.use(lazyMatch("/simulation", () => import("./simulation-whatif"), "simulation-whatif"));

// Causal scenario & shock-propagation engine — public (demo surface).
// GET /scenarios/library  — shock taxonomy
// POST /scenarios/run     — propagates stacked shocks across the entity graph
router.use(lazyMatch("/scenarios", () => import("./scenarios"), "scenarios"));

// Infrastructure status — public.
router.use(lazyMatch("/infrastructure", () => import("./infrastructure-status"), "infrastructure-status"));

// Public platform status page — unauthenticated. Owns /status, /uptime-history, /incidents (KG031).
router.use(lazyMatch(["/status", "/uptime-history", "/incidents"], () => import("./public-status"), "public-status"));

// Counsel — public matters CRUD.
router.use(lazyMatch("/counsel", () => import("./counsel"), "counsel"));

// Counsel Knowledge Index — graph+vector RAG over matter documents.
router.use(lazyMatch("/counsel-knowledge", () => import("./counsel-knowledge"), "counsel-knowledge"));

// Counsel E-Signature — DocuSign adapter for contract signing.
router.use(lazyMatch("/counsel/esignature", () => import("./esignature"), "esignature"));

// Counsel Court Filing Automation — electronic filing preparation and submission.
router.use(lazyMatch("/counsel/court-filings", () => import("./court-filings"), "court-filings"));

// Public API v1 — developer-facing versioned REST surface with OpenAPI spec.
router.use(lazyMatch(["/v1", "/v1/api-keys", "/v1/openapi.json"], () => import("./public-api-v1"), "public-api-v1"));

// Cross-platform intelligence — read-only (auth-gated in production).
crossPlatform.register(router);

// Global Operations Fabric — read-only snapshot + SSE stream.
router.use(lazyMatch("/fabric", () => import("./fabric"), "fabric"));

// Public read-only narrative payloads.
router.use(lazyMatch("/narratives", () => import("./narratives"), "narratives"));

// Shared action store — public, unauthenticated.
router.use(lazyMatch("/action-store", () => import("./action-store"), "action-store"));

// Alloy Policy Authoring Studio — public persistence for compiled policies,
// version history, and per-studio test cases. Demo surface, same model as
// /api/action-store.
router.use(lazyMatch("/alloy/policy-compiler", () => import("./alloy-policy-compiler"), "alloy-policy-compiler"));

// Competitive Intel monitor — public Atlas demo surface.
router.use("/competitive-intel", lazyMount(() => import("./competitive-intel"), "competitive-intel"));

// Shared risk evidence store — public.
router.use(lazyMatch("/risk-evidence", () => import("./risk-evidence"), "risk-evidence"));

// Agent Mesh telemetry — public read-only state + scan endpoints used by
// Sentra's Mesh Map and Pulse's MeshCard. Mounted BEFORE guardianPolicyCheck
// so unauthenticated demo views can hydrate. Scan is also public (no
// destructive side-effects beyond rewriting the per-org telemetry slice).
router.use(lazyMatch("/agent-mesh", () => import("./agent-mesh"), "agent-mesh"));

// Geospatial intelligence feed — public read-only. Serves live-mutating GeoPin
// data for the Command Geospatial Intelligence map. Mounted before
// guardianPolicyCheck so the map loads without auth.
router.use(lazyMatch("/geo-intel", () => import("./geo-intel"), "geo-intel"));

// RF Intelligence — satellite AIS correlation engine, anomaly detection, and geo-intel surface.
// Public endpoints (no auth) — consumed by Command geo-intel map and Vessels dashboard.
router.use(lazyMatch("/rf-intel", () => import("./rf-intel"), "rf-intel"));

// Sentra cyber resilience cockpit — incidents + alerts CRUD. Public demo
// surface (in-memory store). Write paths carry CSRF double-submit protection
// via the global csrfMiddleware mounted in server.ts.
router.use(lazyMatch("/sentra", () => import("./sentra"), "sentra"));

// Crisis Arena — crowdsourced business crisis simulation. Public leaderboard
// endpoints are unauthenticated and rate-limited; all client/architect
// endpoints enforce auth. Every state change is written to Proof Chain.
router.use(lazyMatch("/crisis-arena", () => import("./crisis-arena"), "crisis-arena"));

// Lyte legacy surfaces — read-only public GET endpoints backing the 5 legacy
// decision-intelligence pages. Mounted BEFORE lyte.register so the
// tenantScope middleware registered at "/lyte" never intercepts these routes.
// Exact paths are whitelisted in global-auth-enforcer.ts.
router.use(lazyMatch("/lyte", () => import("./lyte-surfaces"), "lyte-surfaces"));
router.use(lazyMatch("/lyte", () => import("./lyte-intel"), "lyte-intel"));

// A11oy Public API — unauthenticated read-only routes for public system story.
// GET /api/public/a11oy/constellation, /applications, /architecture, /resources.
router.use(publicA11oyRouter);

// A11oy Internal API — authenticated operational routes for readiness, health, and storage.
// GET /api/internal/a11oy/readiness, /verticals/health, /proof/summary, /mcp/readiness, /storage/status.
router.use(internalA11oyRouter);

// A11oy Sovereign API (Phase 3) — Sovereign Execution Lab endpoints.
// model-router, MirrorEval 2.0, replay, connector firewall, twin foundry, skills, boardroom, trust center.
// Note: routes/index.ts is mounted at /api in app.ts, so this resolves to /api/a11oy/*.
router.use('/a11oy', a11oySovereignRouter);

// A11oy Runtime API (Phase 2) — mutating endpoints, operators, MirrorEval, PCE gate, Workcells, Skills.
// Mounted BEFORE the Phase 1 fabric router so runtime routes take precedence when paths overlap.
router.use(a11oyRuntimeRouter);

// A11oy Fabric API — public read-side endpoints for the Live Enterprise Execution Fabric.
// GET /a11oy/now, /signals, /outcomes, /actions, /proof, /governance, /verticals, /fabric, /workcells.
router.use(a11oyFabricRouter);

// Lyte market indicators — delayed/EOD macro feed backed by Alpha Vantage.
// Public read endpoint; mounted before tenantScope group.
router.use(lazyMatch("/lyte", () => import("./lyte-market"), "lyte-market"));

// n8n Automation Bridge — proxy to a connected n8n instance (public surface,
// mounted BEFORE guardianPolicyCheck so the Automations page works in demo
// mode without a session). Gracefully returns 503 when not configured.
router.use(lazyMatch("/n8n", () => import("./n8n"), "n8n"));

// Helios — Frontier Intelligence & Evolution Engine. Public demo surface.
// Owns /helios/* endpoints: signals, mythos, proposals, benchmarks, scanners,
// memos, stats, mcp (Mythos query for portfolio agents), and frontier-briefing.
// Mounted BEFORE guardianPolicyCheck so unauthenticated views can hydrate.
router.use("/helios", lazyMount(() => import("./helios/index"), "helios"));

// Alloy Meridian — Cognitive observability OS with model router, agent
// constellation, forecast council, signal graph, decision weather,
// counterfactual ledger, flight recorder, founder intent, and MCP governance.
// Owns /meridian/* endpoints. Mounted BEFORE guardianPolicyCheck so
// read-only intelligence surfaces work in demo/unauthenticated mode.
router.use(lazyMatch("/meridian", () => import("./meridian"), "meridian"));

// Meridian MCP Activation registry (Task #3717 thin slice).
// Distinct from mcp.ts (internal JSON-RPC gateway) — this is a read-only
// registry of the 15 governed external MCP servers and their activation status.
// Owns /meridian-mcp/* endpoints.
router.use(lazyMatch("/meridian-mcp", () => import("./meridian-mcp-activation"), "meridian-mcp-activation"));

// MCP Public Trust Layer — marketplace, trust scores, server directory, submission queue.
// GET endpoints are public (unauthenticated server discovery). POST /marketplace/v1/submit
// is public for external contributors. Mounted BEFORE guardianPolicyCheck intentionally.
router.use(lazyMatch("/marketplace", () => import("./marketplace"), "marketplace"));

// Global Guardian policy check — derives category from request path.
router.use(guardianPolicyCheck());

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
// Aliased mount so the Pulse client (and CSRF / global-auth-enforcer
// exemptions) can address these routes under the canonical `/api/pulse/...`
// prefix that they were always documented as.
router.use(
  "/pulse",
  perUserApiSlidingLimiter,
  lazyMount(() => import("./pulse"), "pulse-aliased"),
);
router.use("/executive", perUserApiSlidingLimiter, lazyMount(() => import("./executive-briefings"), "executive-briefings"));
router.use(lazyMatch("/evals", () => import("./evals"), "evals"));
router.use(lazyMatch("/briefings", () => import("./briefings"), "briefings"));
router.use(lazyMatch("/drift", () => import("./drift"), "drift"));
router.use(lazyMatch("/deployments", () => import("./deployments"), "deployments"));
router.use(lazyMatch("/teams", () => import("./teams"), "teams"));
// teams.ts also exposes GET /users/:id/pages — the per-user counterpart
// to /teams/:team/pages (#2469). Same module, separate prefix gate.
router.use(lazyMatch("/users", () => import("./teams"), "teams-user-pages"));
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

// Decision Runtime v1 — GET /api/decisions/cards and GET /api/decisions/cards/:id
// are public (demo workspace when unauthenticated). Mutating routes require auth.
router.use(decisionsRuntimeRouter);

// Trace/reflection/plan/replay routers. Note traces.ts also serves /runs* paths.
router.use(lazyMatch(["/traces", "/runs"], () => import("./traces"), "traces"));

// ACR Governance — v1 approval interrupts and run ledger (auth-gated)
router.use(lazyMatch("/v1/approvals", () => import("./v1-approvals"), "v1-approvals"));
router.use(lazyMatch("/v1/runs", () => import("./v1-runs"), "v1-runs"));
router.use(lazyMatch("/reflections", () => import("./reflections"), "reflections"));
router.use(lazyMatch("/plans", () => import("./plans"), "plans"));
router.use(lazyMatch("/replay", () => import("./replay"), "replay"));
router.use(
  lazyMatch(["/proof-chain", "/audit-log"], () => import("./trust-provenance"), "trust-provenance"),
);
router.use(lazyMatch("/mcp-gateway", () => import("./mcp-gateway"), "mcp-gateway"));
router.use(lazyMatch("/tool-mesh", () => import("./tool-mesh"), "tool-mesh"));

router.use(lazyMatch("/hf-mcp", () => import("./hf-mcp-proxy"), "hf-mcp-proxy"));
router.use(lazyMatch("/hf", () => import("./hf-status"), "hf-status"));

core.register(router);
vessels.register(router);
security.register(router);
lyte.register(router);
terra.register(router);
alloy.register(router);
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

router.use("/provenance", lazyMount(() => import("./provenance"), "provenance"));

// NEXUS Unified Intelligence Protocol v1 — single-endpoint API across all domains.
// Mounted BEFORE the legacy /nexus router so v1 paths take precedence.
router.use(lazyMatch(["/nexus/v1"], () => import("./nexus-v1"), "nexus-v1"));

// NEXUS MCP Fabric — bidirectional governed MCP control plane.
// Handles external server registry, session tracking, anomaly detection, and governed workflows.
router.use(lazyMatch("/nexus-mcp", () => import("./nexus-mcp"), "nexus-mcp"));

router.use("/nexus", lazyMount(() => import("./nexus"), "nexus"));

// Intelligence Economics Operating System — aggregate AI fleet economics,
// calibration observatory, compound intelligence map, trust registry,
// learning velocity, and provenance export. Auth-gated (admin/operator/analyst).
router.use("/intelligence-economics", lazyMount(() => import("./intelligence-economics"), "intelligence-economics"));

// NEXUS Ontology Fabric — unified entity registry + adjacency graph
// across Terra/Vessels/Counsel/Sentra/etc. URI scheme: szl://<kind>/<ns>/<id>.
router.use("/ontology", lazyMount(() => import("./ontology"), "ontology"));

router.use(lazyMatch("/cognitive-runtime", () => import("./cognitive-runtime"), "cognitive-runtime"));
router.use(lazyMatch("/agents", () => import("./agents"), "agents"));
router.use(lazyMatch("/sandbox", () => import("./sandbox"), "sandbox"));
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

router.use("/signal-bus", lazyMount(() => import("./signal-bus"), "signal-bus"));

router.use(lazyMatch("/mobile-biometric", () => import("./mobile-biometric"), "mobile-biometric"));

// Precision Evolution Runtime (PER) — governed AI evolution control plane.
// Owns /evolution/* endpoints: candidates, evaluation, calibration, scoring,
// drift, promotion, rollback, audit, and diagnostics.
router.use(lazyMatch("/evolution", () => import("./evolution"), "evolution"));

// Unified Auth Mesh — API key CRUD and OAuth client_credentials endpoints
router.use(apiKeysRouter);
router.use(oauthRouter);

// Mesh observability — call topology and principal registry (ops/admin only)
router.use(meshObservabilityRouter);

// MCP Ecosystem Command Center — topology, sessions, tool catalog, governed execution
router.use(lazyMatch("/ecosystem", () => import("./ecosystem-command"), "ecosystem-command"));

// OMNIA — unified portfolio world model, synthesis narrative, cross-portfolio search,
// entity ripple analysis, public story mode, and shell adoption telemetry.
// Public endpoints: /omnia/narrative, /omnia/story, /omnia/search, /omnia/graph, /omnia/notifications
// Adoption beacon: POST /omnia/adoption/beacon (unauthenticated, fire-and-forget)
router.use(lazyMatch("/omnia", () => import("./omnia"), "omnia"));

export default router;
