// doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header.
import { Router, type IRouter } from "express";
import { perUserApiSlidingLimiter } from "../middlewares/sliding-window-limiter";
import { bulkExportLimiter } from "../middlewares/rate-limiters";
import { guardianPolicyCheck } from "../middlewares/guardian-policy";
import { lazyMount, lazyMatch, lazyRegisterMatch } from "../lib/lazy-router";
import emailWebhooksRouter from "./email-webhooks";
import * as core from "./groups/core";
import * as vessels from "./groups/vessels";
import * as security from "./groups/security";
import * as lyte from "./groups/lyte";
import * as terra from "./groups/terra";
import * as continuum from "./groups/continuum";
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
import * as continuumRuntime from "./groups/continuum-runtime-group";
import * as selfModel from "./groups/self-model";
import * as cognitiveReflexivity from "./groups/cognitive-reflexivity";
import * as ouroboros from "./groups/ouroboros";
import * as verifier from "./groups/verifier";
import * as skillLibrary from "./groups/skill-library";
import * as crossPlatform from "./groups/cross-platform";
import decisionsRuntimeRouter from "./decisions-runtime";
import a11oyDomainFabricRouter from "./a11oy-domain-fabric-api.js";
import a11oyFabricRouter from "./a11oy-fabric-api";
import { a11oyAttestationPublicRouter, a11oyAttestationProtectedRouter } from "./a11oy-attestation-api.js";
import { a11oyCodexPublicRouter, a11oyCodexProtectedRouter } from "./a11oy-codex-api.js";
import { a11oyFormulasPublicRouter, a11oyFormulasProtectedRouter } from "./a11oy-formulas-api.js";
import capabilityFabricRouter from "./capability-fabric";
import a11oyRuntimeRouter from "./a11oy-runtime-api.js";
import a11oyCognitiveRuntimeRouter from "./a11oy-cognitive-runtime.js";
import { a11oyClaudeCodeDoctrineRouter } from "./a11oy-claude-code-doctrine.js";
import a11oyAgenticPagesRouter from "./a11oy-agentic-pages-api";
import a11oyDoctrineRouter from "./a11oy-doctrine-api";
import a11oyPayloadRouter from "./a11oy-payload";
import a11oyDashboardRouter from "./a11oy-dashboard-api";
import szlAtlasRouter from "./szl-atlas";
import forgeSkillsRouter from "./forge-skills";
import a11oySovereignRouter from "./a11oy-sovereign-api.js";
import publicA11oyRouter from "./public-a11oy-api";
import internalA11oyRouter from "./internal-a11oy-api";
import internalA11oyDefenseRouter from "./internal-a11oy-defense";
import sentraCortexApiRouter from "./sentra-cortex-api";
import apiKeysRouter from "./api-keys";
import oauthRouter from "./oauth";
import meshObservabilityRouter from "./mesh-observability";
import openaiConversationsRouter from "./openai/conversations";

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

// Public replay-attestation + governance stats + .well-known attestation keys (Track C-02).
// Owns POST /v1/replay-attestation, GET /governance/stats, GET /.well-known/szl-attestation-keys.json.
router.use(lazyMatch(["/v1/replay-attestation", "/governance/stats", "/.well-known/szl-attestation-keys.json"], () => import("./replay-attestation"), "replay-attestation"));

// PQC Identity & Governance Gateway — public verification API.
// GET  /pqc/status, /pqc/certificates, /pqc/transparency-log, /pqc/did.json
// GET  /.well-known/did.json (W3C DID document for tenant did:web resolution)
// POST /pqc/verify, /pqc/verify/signature, /pqc/verify/certificate, /pqc/verify/did
// POST /pqc/transparency-log/inclusion-proof
router.use(lazyMatch(["/pqc", "/.well-known/did.json"], () => import("./pqc-verification"), "pqc-verification"));
router.use(lazyMatch("/pqc/ca", () => import("./pqc-hsm"), "pqc-hsm"));

// VSP (Verifiable Span Protocol) coverage — public read-only metrics.
// GET /vsp/coverage
router.use(lazyMatch("/vsp", () => import("./vsp-coverage"), "vsp-coverage"));

// Email provider webhooks (bounces, complaints) + unsubscribe handler — public, unauthenticated.
router.use(emailWebhooksRouter);

// Self-healing orchestrator — public GETs.
router.use(lazyMatch("/self-healing", () => import("./self-healing"), "self-healing"));

// Simulation what-if engine — POST route is public.
router.use(lazyMatch("/simulation", () => import("./simulation-whatif"), "simulation-whatif"));

// ROSIE — Governed Decision Fabric. Public demo surface.
// Owns /rosie/templates, /rosie/solve, /rosie/narrate, /rosie/receipts*,
// /rosie/research, /rosie/github/*, /rosie/ingest/*, /rosie/fabric, /rosie/events
router.use(lazyMatch("/rosie", () => import("./rosie"), "rosie"));

// Adversarial red-team & crisis stress-drill suite.
// All state is isolated in-memory — no production tables touched.
// GET  /stress-drill/scenarios
// POST /stress-drill/drills + lifecycle routes
// GET  /stress-drill/drills/:id/debrief + /debrief/pdf
router.use(lazyMatch("/stress-drill", () => import("./stress-drill"), "stress-drill"));

// Causal scenario backtest — historical event replay & accuracy metrics.
// GET  /scenarios/backtest/events   — list historical shock events
// POST /scenarios/backtest/run      — run backtest against selected events
// GET  /scenarios/backtest/accuracy — aggregate model accuracy
router.use(lazyMatch("/scenarios/backtest", () => import("./scenario-backtest"), "scenario-backtest"));

// Causal scenario & shock-propagation engine — public (demo surface).
// GET /scenarios/library  — shock taxonomy
// POST /scenarios/run     — propagates stacked shocks across the entity graph
router.use(lazyMatch("/scenarios", () => import("./scenarios"), "scenarios"));

// Monte Carlo Fabric — configurable stochastic simulation with probability bands.
// GET  /monte-carlo-fabric/scenarios, /monte-carlo-fabric/distributions
// POST /monte-carlo-fabric/simulate
router.use(lazyMatch("/monte-carlo-fabric", () => import("./monte-carlo-fabric"), "monte-carlo-fabric"));

// Premium Data Fabric — adapter registry, health, cost metering, unified entity fetch.
// GET /data-fabric/adapters, /data-fabric/data, /data-fabric/costs, /data-fabric/health
router.use(lazyMatch("/data-fabric", () => import("./data-fabric"), "data-fabric"));

// Terra predictive cap-rate model — ML-driven cap rate forecasting.
// GET /terra/cap-rate/predict, /terra/cap-rate/history, /terra/cap-rate/compare
router.use(lazyMatch("/terra/cap-rate", () => import("./terra-cap-rate"), "terra-cap-rate"));

// Vessels voyage economics calculator — charter rates, bunker costs, canal fees, P&L.
// GET  /vessels/voyage-calc/vessel-classes, routes, bunker-prices, canal-fees, charter-rates
// POST /vessels/voyage-calc/estimate
router.use(lazyMatch("/vessels/voyage-calc", () => import("./vessels-voyage-calc"), "vessels-voyage-calc"));

// Infrastructure status — public.
router.use(lazyMatch("/infrastructure", () => import("./infrastructure-status"), "infrastructure-status"));

// Public platform status page — unauthenticated. Owns /status, /uptime-history, /incidents (KG031).
router.use(lazyMatch(["/status", "/uptime-history", "/incidents"], () => import("./public-status"), "public-status"));

// Third-Party Legal Disclosure Registry — recipients, records, subprocessors, agreements, compliance controls.
router.use(lazyMatch("/disclosure", () => import("./disclosure"), "disclosure"));

// Counsel — public matters CRUD.
router.use(lazyMatch("/counsel", () => import("./counsel"), "counsel"));

// Counsel Live Legal Feeds — CourtListener, EDGAR, Federal Register, USPTO PEDS, State AG.
// GET /counsel/feeds       — aggregated item list per source
// GET /counsel/feeds/:src  — single-source items
// GET /counsel/feeds/health — per-feed status, latency, freshness
// Public (no auth) — whitelisted in global-auth-enforcer.ts.
// Uses lazyMatch (no path prefix) so the full /counsel/feeds path is preserved
// and counsel-feeds.ts route handlers (which include the /counsel prefix) match correctly.
router.use(lazyMatch(["/counsel/feeds"], () => import("./counsel-feeds").then((m) => ({ default: m.router })), "counsel-feeds"));

// Counsel Clause Genome — clause library, drafting agent, risk diff, and
// matter-scoped clause links (/counsel/matters/:id/clauses).
router.use(lazyMatch(["/counsel/clauses", "/counsel/matters"], () => import("./counsel-clauses"), "counsel-clauses"));

// Counsel Knowledge Index — graph+vector RAG over matter documents.
router.use(lazyMatch("/counsel-knowledge", () => import("./counsel-knowledge"), "counsel-knowledge"));

// Counsel E-Signature — DocuSign adapter for contract signing.
router.use(lazyMatch("/counsel/esignature", () => import("./esignature"), "esignature"));

// Counsel Court Filing Automation — electronic filing preparation and submission.
router.use(lazyMatch("/counsel/court-filings", () => import("./court-filings"), "court-filings"));

// Mission Runbooks — CRUD + run orchestration (public for internal command UI)
router.use("/mission-runbooks", lazyMount(() => import("./v1-mission-runbooks"), "v1-mission-runbooks"));

// Public API v1 — developer-facing versioned REST surface with OpenAPI spec.
router.use(lazyMatch(["/v1", "/v1/api-keys", "/v1/openapi.json"], () => import("./public-api-v1"), "public-api-v1"));

// LaaS v1 — Lambda-as-a-Service public guard endpoint (POST /v1/guard, GET /v1/guard/pulse|axes|health).
router.use(lazyMatch("/v1/guard", () => import("./v1-guard"), "v1-guard"));

// Cross-platform intelligence — read-only (auth-gated in production).
crossPlatform.register(router);

// Global Operations Fabric — read-only snapshot + SSE stream.
router.use(lazyMatch("/fabric", () => import("./fabric"), "fabric"));

// Public read-only narrative payloads.
router.use(lazyMatch("/narratives", () => import("./narratives"), "narratives"));

// Shared action store — public, unauthenticated.
router.use(lazyMatch("/action-store", () => import("./action-store"), "action-store"));

// Continuum Policy Authoring Studio — public persistence for compiled policies,
// version history, and per-studio test cases. Demo surface, same model as
// /api/action-store.
router.use(lazyMatch("/continuum/policy-compiler", () => import("./continuum-policy-compiler"), "continuum-policy-compiler"));

// Competitive Intel monitor — public Atlas demo surface.
router.use("/competitive-intel", lazyMount(() => import("./competitive-intel"), "competitive-intel"));

// Shared risk evidence store — public.
router.use(lazyMatch("/risk-evidence", () => import("./risk-evidence"), "risk-evidence"));

// Agent Mesh telemetry — public read-only state + scan endpoints used by
// Sentra's Mesh Map and Pulse's MeshCard. Mounted BEFORE guardianPolicyCheck
// so unauthenticated demo views can hydrate. Scan is also public (no
// destructive side-effects beyond rewriting the per-org telemetry slice).
router.use(lazyMatch("/agent-mesh", () => import("./agent-mesh"), "agent-mesh"));

// Geospatial intelligence feed — Serves live-mutating GeoPin data for the
// Command Geospatial Intelligence map. GET /pins and /meta are public read-only
// so the map loads without auth (mounted before guardianPolicyCheck and
// whitelisted in global-auth-enforcer.ts). PATCH/POST/DELETE on /pins persist
// to `geo_intel_pins` and require an authenticated, write-capable session via
// requireAuth + denyIfReadOnly enforced inside the route handlers.
router.use(lazyMatch("/geo-intel", () => import("./geo-intel"), "geo-intel"));

// RF Intelligence — satellite AIS correlation engine, anomaly detection, and geo-intel surface.
// Public endpoints (no auth) — consumed by Command geo-intel map and Vessels dashboard.
router.use(lazyMatch("/rf-intel", () => import("./rf-intel"), "rf-intel"));

// Sentra / Amaru — Operational Core snapshot bridges. Parity surfaces with
// vessels-ops-core. Public (PUBLIC_PREFIXES "/api/{app}/ops-core/"). Consumed
// by each app's `*-store.ts` and a11oy's <{App}Ops /> pages.
router.use(lazyMatch("/sentra/ops-core", () => import("./sentra-ops-core"), "sentra-ops-core"));
// Sentra → A11oy cross-device status bridge. See `./sentra-status.ts`.
router.use(lazyMatch("/sentra/status", () => import("./sentra-status"), "sentra-status"));
router.use(lazyMatch("/amaru/ops-core", () => import("./amaru-ops-core"), "amaru-ops-core"));
// Round 2 (2026-05-18): five additional vertical ops-core bridges. Mounted on
// their own narrow prefixes so they cannot shadow the existing per-app routers
// (counsel.ts, carlota-jo.ts, pulse.ts, lexicon.ts, terra.ts) that sit below.
router.use(lazyMatch("/counsel/ops-core", () => import("./counsel-ops-core"), "counsel-ops-core"));
router.use(lazyMatch("/carlota-jo/ops-core", () => import("./carlota-jo-ops-core"), "carlota-jo-ops-core"));
router.use(lazyMatch("/pulse/ops-core", () => import("./pulse-ops-core"), "pulse-ops-core"));
router.use(lazyMatch("/lexicon/ops-core", () => import("./lexicon-ops-core"), "lexicon-ops-core"));
router.use(lazyMatch("/terra/ops-core", () => import("./terra-ops-core"), "terra-ops-core"));
// Round 3 (2026-05-18): org-level intelligence surface. Ingests the live
// state of the six user-named public repos in szl-holdings (cookbook,
// agi-forecast, trust, vsp-otel, ouroboros-thesis, ouroboros) via the
// GitHub REST API. Same auth posture as the per-app ops-core surfaces
// (GET/HEAD only via isOpsCorePublicRead — see global-auth-enforcer).
router.use(lazyMatch("/org-intelligence", () => import("./org-intelligence"), "org-intelligence"));
// Round 4 (2026-05-18): unified ecosystem aggregator. Fans out server-
// side to org-intelligence/snapshot + the 8 per-app ops-core/snapshots
// so a11oy can render the entire board with ONE network call.
router.use(lazyMatch("/ecosystem", () => import("./ecosystem"), "ecosystem"));

// Sentra cyber resilience cockpit — incidents + alerts CRUD. Public demo
// surface (in-memory store). Write paths carry CSRF double-submit protection
// via the global csrfMiddleware mounted in server.ts.
router.use(lazyMatch("/sentra", () => import("./sentra"), "sentra"));

// Sentra EDR agent deployment — enrollment tokens, heartbeat, lifecycle actions.
router.use(lazyMatch("/sentra", () => import("./sentra-agents"), "sentra-agents"));

// Sentra SIEM adapter layer — pluggable connections, webhook ingest.
// The /sentra/siem/ingest/:id endpoint is public (webhook push from external SIEM).
router.use(lazyMatch("/sentra", () => import("./sentra-siem"), "sentra-siem"));

// Sentra SIEM Export — outbound export of findings to Splunk (CEF), Sentinel (ASIM), Chronicle (UDM).
// Heavy export operation: apply bulk export rate limit before route handlers.
router.use("/sentra/siem-export", bulkExportLimiter);
router.use(lazyMatch("/sentra/siem-export", () => import("./sentra-siem-export"), "sentra-siem-export"));

// Sentra Threat Hunter — hunt approval and remediation plan approval endpoints.
// Publishes typed domain events to the signal mesh when analyst approves a hunt or plan.
router.use(lazyMatch("/sentra", () => import("./sentra-hunt"), "sentra-hunt"));

// Sentra domain CRUD — in-memory seed-data stores for research intelligence,
// threat twin, cyber twin, hunt data, PQC readiness, hardware root of trust,
// photonic inference, and DARPA MTO research domains.
router.use(lazyMatch("/sentra", () => import("./sentra-domains"), "sentra-domains"));

// Sentra "research surfaces" — read-only datasets for the rich operator pages
// (Autonomous SOC Command, Frontier AI Threat Lab, Attack Surface Command,
// AI Swarm Defense, MITRE ATLAS Overlay, Weaponized Intel Feed, SOAR Hub).
router.use(lazyMatch("/sentra/pages", () => import("./sentra-pages"), "sentra-pages"));

// Sentra Live Threat Feeds — NVD, KEV, EPSS, ATT&CK, abuse.ch URLhaus/ThreatFox,
// AlienVault OTX. Per-feed health panel, caching, drift, freshness telemetry.
router.use(lazyMatch("/sentra/threat-feeds", () => import("./sentra-threat-feeds"), "sentra-threat-feeds"));

// Sentra ML Scoring — three inference heads: asset risk, identity blast-radius,
// adversary-replay simulator. Monte Carlo, drift monitors, model registry.
router.use(lazyMatch("/sentra/ml", () => import("./sentra-ml-scoring"), "sentra-ml-scoring"));

// Sentra Agent Traffic Forensics — mitmproxy-style introspection of
// agent ↔ tool calls. Mocked streaming source today; live capture deferred
// (see docs/ingestion/sentra-introspection.md).
router.use(lazyMatch("/sentra/agent-traffic", () => import("./sentra-agent-traffic"), "sentra-agent-traffic"));

// Sentra A11oy Integration — tool registry, PCE-gated invocations, Healthcare
// case study, Prism Bus event stream.
router.use(lazyMatch("/sentra/a11oy", () => import("./sentra-a11oy"), "sentra-a11oy"));

// Sentra Governed Vulnerability Remediation Pipeline — A11oy-governed
// remediation lifecycle (ingest → context → recommend → simulate → policy
// → execute → verify → outcome) closing the "Patching Gap".
router.use(lazyMatch("/sentra/remediation", () => import("./sentra-remediation"), "sentra-remediation"));

// Sentra Active Defense Fabric — real telemetry ingestion, Sigma-style detection
// engine, Active Response Engine (typed action library), Operational Deception
// Grid (honey endpoints, canary tokens, tarpit), append-only hash-chained
// Evidence Ledger, Sentinel-vs-Adversary duel agent, HITL operator controls.
// /api/sentra/events          — telemetry ingest from middleware
// /api/sentra/defense/*       — defense state + action execution
// /api/sentra/response-queue  — HITL approval queue
// /api/sentra/evidence-ledger — chain-of-custody ledger
// /api/sentra/hitl/*          — operator toggle controls
// /api/sentra/duel/*          — Sentinel agent duel sessions
// /api/sentra/deception/*     — canary tokens + honey grid
// /api/honey/*                — honey endpoints (trap attackers)
// Sentra Posture / Controls Coverage / Doctrine V6 Governance reads —
// landing-surface and operator dashboard endpoints (payload-grounded).
// Mounted BEFORE sentra-defense so these reads aren't gated by the active-
// defense lazy module's init chain.
//   GET /api/sentra/posture
//   GET /api/sentra/controls/coverage
//   GET /api/sentra/governance/doctrine
router.use(lazyMatch("/sentra", () => import("./sentra-posture"), "sentra-posture"));
// Sentra Detector Framework (#5186) — canonical detector/finding contract,
// shared by TS detectors and the Python sidecar. See packages/sentra-detector-sdk
// and services/sentra-detector-sidecar.
router.use(lazyMatch("/sentra", () => import("./sentra-detector-framework"), "sentra-detector-framework"));
// AGI-stack capabilities (#5503) — Detector Council (MARBLE), Time-R1
// trajectory scoring, CTM bus snapshot, antivenom audit, edge-adversary
// demo drill. Mounted on `/sentra/agi/*` so the existing `/sentra`
// detector framework remains source-of-truth for individual detectors.
router.use(lazyMatch("/sentra/agi", () => import("./sentra-agi-stack"), "sentra-agi-stack"));

// Sentra Tabs (Round 5 #5208) — honest empty 200s for SPA tabs that previously
// hit unmounted endpoints and got 404. Replaces console errors with clean
// empty-state rendering. NO MOCK DATA — every handler returns
// { items: [], total: 0, note } until a real backing store is wired.
// Mounts: /sentra/{assets,identities,playbooks,risk-bow-tie,threat-intel,
//                  approvals,overview}
router.use(lazyMatch("/sentra", () => import("./sentra-tabs"), "sentra-tabs"));

// Sentra Core — typed HTTP routes backed by the services/sentra-core Python
// sidecar (threat_model, posture_drift, incident_response, evidence_pack,
// policy_gate). Mounted under /sentra/core/*.
router.use(
  lazyMatch("/sentra/core", () => import("../domain-services/sentra/routes"), "sentra-core"),
);
router.use(lazyMatch("/sentra", () => import("./sentra-defense"), "sentra-defense"));
router.use(lazyMatch("/honey", () => import("./sentra-defense"), "sentra-honey"));

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

// Khipu Doctrine — governance CRUD, seed, overview, system-card endpoints.
// Public (demo surface); mounted before guardianPolicyCheck.
router.use(lazyMatch("/doctrine", () => import("./doctrine-crud"), "doctrine-crud"));

// A11oy Chat — real Claude streaming chat surface (public, rate-limited).
// Mounted BEFORE the other A11oy router groups so their group-level auth
// middleware does not intercept the unauthenticated chat/conversations endpoints.
// GET  /api/a11oy/health
// POST /api/a11oy/chat  (SSE stream)
// GET  /api/a11oy/conversations
// GET  /api/a11oy/conversations/:id/messages
// A11oy Formulas — public reads of the canonical formula registry. MUST be
// mounted before the /a11oy chat router because chat owns a generic
// /formulas/:id matcher that would otherwise capture our /catalog path.
// Mutating endpoints (propose/approve/reject) mount after guardianPolicyCheck.
router.use(a11oyFormulasPublicRouter);
// Lutar Λ₅ forecast gauge (Task #5175) — public read of current invariant,
// recent history, forecast band, and per-axis sensitivity inspector.
// Mounted before /a11oy chat to avoid the /formulas/:id matcher collision.
router.use(lazyMatch("/formulas/lutar-invariant-5", () => import("./formulas-lutar"), "formulas-lutar"));
// Operator dashboard (Task #5175) — cross-product roll-up + SSE stream.
router.use(lazyMatch("/operator/dashboard", () => import("./operator-dashboard"), "operator-dashboard"));
router.use("/a11oy", lazyMount(() => import("./a11oy-chat"), "a11oy-chat"));
// Orchestration traces (Task #5514) — sequence-pipeline trace ring buffer
// surfaced for the reliquary, joined to Λ verdict receipts.
router.use(lazyMatch("/a11oy/orchestration-traces", () => import("./a11oy-orchestration"), "a11oy-orchestration"));

// A11oy Console — Workbench BFF route.
// GET  /api/a11oy/console/models
// POST /api/a11oy/console/count-tokens
// POST /api/a11oy/console/save-workcell
// POST /api/a11oy/console/run  (SSE stream — PCE gate + MirrorEval + ProofLedger)
router.use("/a11oy/console", lazyMount(() => import("./a11oy-console"), "a11oy-console"));

// A11oy Public API — unauthenticated read-only routes for public system story.
// GET /api/public/a11oy/constellation, /applications, /architecture, /resources.
router.use(publicA11oyRouter);

// A11oy Internal API — authenticated operational routes for readiness, health, and storage.
// GET /api/internal/a11oy/readiness, /verticals/health, /proof/summary, /mcp/readiness, /storage/status.
router.use(internalA11oyRouter);

// A11oy Internal Defense API — read-only endpoints for the 6 defense pages
// (PrecisionAI, WeaponizedIntel, AgentZeroTrust, AtlasShield, SwarmOrchestrator, PlaybookEngine).
// GET /api/internal/a11oy/defense/{precision-ai|weaponized-intel|agent-zero-trust|atlas-shield|swarm-orchestrator|playbook-engine}.
router.use(internalA11oyDefenseRouter);

// Sentra Predictive Defense Cortex API — seed data for Future Threat Horizon, Layered Intercept,
// Governed Adversary Swarm, and the a11oy Cyber Lobe cross-app panel.
// GET /api/internal/sentra/cortex/predictions
// GET /api/internal/sentra/cortex/swarm-status
// GET /api/internal/sentra/layered-intercept
// GET /api/internal/a11oy/cyber-lobe
router.use(sentraCortexApiRouter);

// A11oy Domain Fabric API — fabric data routes for domain twins, signals, risks, decisions,
// outcomes, evidence, verticals, agents, roadmap, and page-specific summaries.
// Resolves to /api/a11oy/fabric/*, /api/a11oy/pages/identity, /api/a11oy/pages/rag, etc.
// Mounted before agentic-pages so live fabric routes win over seed-backed overlapping paths.
router.use('/a11oy', a11oyDomainFabricRouter);

// A11oy FORGE — Proof-Carrying Agent Skills marketplace.
// In-memory FORGE-certified skill registry, MirrorEval evaluation, covenant compliance,
// PCE Gate approval, capability certificate generation, HF-compatible export.
// Owns /api/a11oy/forge/skills, /forge/skills/:id, /forge/skills/evaluate,
// /forge/skills/publish, /forge/skills/:id/export, /forge/certificates/:id.
// Mounted BEFORE a11oyDoctrineRouter because doctrine-crud applies a router-level
// authMiddleware to all POST/PUT/PATCH/DELETE requests; forge endpoints are
// public-demo POSTs that must run before that guard short-circuits the request.
router.use('/a11oy', forgeSkillsRouter);

// A11oy Khipu Doctrine — live data API for the 13 doctrine pages.
router.use('/a11oy', a11oyDoctrineRouter);

// A11oy canonical payload — read-only Doctrine V6 / DOI ledger / 16-repo inventory /
// push queue / Λ-axes / artifact indices / manifest. Backed by the typed
// @szl-holdings/payload-doctrine workspace package.
router.use('/a11oy/payload', a11oyPayloadRouter);
router.use(a11oyDashboardRouter);

// SZL Atlas — read-only audit JSON snapshots (GitHub org sweep, thesis lineage, gap report, backlog).
// Files live at artifacts/api-server/src/data/audit/*.json and are loaded lazily on first request.
router.use('/szl/atlas', szlAtlasRouter);

// A11oy Agentic Pages API — seed data endpoints for the 9 agentic frontend pages
// (A2A Interop, Agent Identity, Self-Optimization, Security Agents, Gateway, Proof Ledger, Memory, Signal Mesh).
// Mounted after domain-fabric so any overlapping paths resolve to live fabric data first.
router.use('/a11oy', a11oyAgenticPagesRouter);

// A11oy Reliquary — provenance-bound content-addressed cache spine.
// Real SHA-256 hashing, disk I/O, DB lineage edges, Merkle-root attestations, sovereign mode.
// Owns /api/reliquary/* endpoints (catalog, put, get, covenant, snapshot, replay, lineage, attest, sovereign, seed).
router.use(lazyMatch("/reliquary", () => import("./reliquary"), "reliquary"));

// A11oy Sovereign API (Phase 3) — Sovereign Execution Lab endpoints.
// model-router, MirrorEval 2.0, replay, connector firewall, twin foundry, skills, boardroom, trust center.
// Note: routes/index.ts is mounted at /api in app.ts, so this resolves to /api/a11oy/*.
router.use('/a11oy', a11oySovereignRouter);

// A11oy Orchestration Backbone (#4748) is mounted directly in app.ts BEFORE
// the global auth enforcer so the public fabric registry/proofs/demo-chain
// endpoints can be reached without a session. See app.ts ~line 322.

// A11oy Cognitive Runtime API — Cortex Router, Memory Fabric, Phase Engine, SLA Planner,
// Worker Registry, Guided Output Guard, Proof Chain, Event Plane.
// GET  /api/a11oy/cognitive/health
// POST /api/a11oy/cognitive/route
// POST /api/a11oy/cognitive/execute
// POST /api/a11oy/cognitive/sla-plan
// GET  /api/a11oy/cognitive/workers
// POST /api/a11oy/cognitive/workers/register
// POST /api/a11oy/cognitive/workers/drain
// GET  /api/a11oy/cognitive/events
// POST /api/a11oy/cognitive/proof-chains
// GET  /api/a11oy/cognitive/deployments
router.use(a11oyCognitiveRuntimeRouter);

// A11oy Claude Code Doctrine BFF — Skills v2, Hook Packs, Memory Tiers, Plan Lock, Trust Tiers, Watchdog, OTel, Rego.
// Namespace: /a11oy/skills/v2, /a11oy/hooks, /a11oy/memory, /a11oy/plans, /a11oy/trust-tiers,
//            /a11oy/watchdog, /a11oy/otel, /a11oy/rego
router.use('/a11oy', a11oyClaudeCodeDoctrineRouter);

// A11oy Runtime API (Phase 2) — mutating endpoints, operators, MirrorEval, PCE gate, Workcells, Skills.
// Mounted BEFORE the Phase 1 fabric router so runtime routes take precedence when paths overlap.
router.use(a11oyRuntimeRouter);

// A11oy Fabric API — public read-side endpoints for the Live Enterprise Execution Fabric.
// GET /a11oy/now, /signals, /outcomes, /actions, /proof, /governance, /verticals, /fabric, /workcells.
router.use(a11oyFabricRouter);
// A11oy Attestation — public reads (envelopes + routing weights snapshots).
// Mutating endpoints are mounted AFTER guardianPolicyCheck below.
router.use(a11oyAttestationPublicRouter);
// A11oy Codex — searchable index of theses, formulas, codex payloads, ouroboros
// docs, doctrines, findings. Corpus restricted to public-repo material (docs/,
// attached_assets/, root *.md) — .local/* is intentionally excluded.
router.use(a11oyCodexPublicRouter);
router.use(capabilityFabricRouter);

// Lyte market indicators — delayed/EOD macro feed backed by Alpha Vantage.
// Public read endpoint; mounted before tenantScope group.
router.use(lazyMatch("/lyte", () => import("./lyte-market"), "lyte-market"));

// n8n Automation Bridge — proxy to a connected n8n instance (public surface,
// mounted BEFORE guardianPolicyCheck so the Automations page works in demo
// mode without a session). Gracefully returns 503 when not configured.
router.use(lazyMatch("/n8n", () => import("./n8n"), "n8n"));

// Frontier Intelligence & Evolution Engine — consolidated under A11oy
// (Task #4362). Owns signals, khipu, proposals, benchmarks, scanners,
// memos, stats, mcp (Khipu query for portfolio agents), and frontier-briefing.
// Primary surface: /a11oy/frontier/*. The /helios/* mount is preserved as a
// deprecated alias for backwards compatibility — both resolve to the same
// router. Mounted BEFORE guardianPolicyCheck so unauthenticated views hydrate.
router.use("/a11oy/frontier", lazyMount(() => import("./helios/index"), "a11oy-frontier-alias"));
router.use("/helios", lazyMount(() => import("./helios/index"), "helios-deprecated"));

// Continuum Meridian — Cognitive observability OS with model router, agent
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

// OS Layer API — read-only endpoints for recommendations, source health, runs, eval results, command KPIs.
// Public GET endpoints (demo surface) — mounted BEFORE guardianPolicyCheck.
router.use(lazyMatch("/v1/os", () => import("./os-layer-api"), "os-layer-api"));

// Sovereign Agent Mesh — governed micro-agent swarms with trust scoring,
// crew composition, and proof-carrying inter-agent communication.
// Public read-only demo surface — mounted BEFORE guardianPolicyCheck.
router.use("/sovereign-mesh", lazyMount(() => import("./sovereign-mesh"), "sovereign-mesh"));

// Governance-Injecting MCP Gateway — external agent access with PCE Gate
// enforcement, proof packets, approval queues, API key management, rate limiting.
// Public read-only demo surface (GET endpoints); mutations auth-gated at route level.
router.use("/mcp-governed-gateway", lazyMount(() => import("./mcp-governed-gateway"), "mcp-governed-gateway"));

// Global Guardian policy check — derives category from request path.
router.use(guardianPolicyCheck());

// OS Layer Actions — auth-gated POST endpoints for recommendation actions.
// Mounted AFTER guardianPolicyCheck to require authentication for state mutations.
router.use(lazyMatch("/v1/os/recommendations", () => import("./os-layer-actions"), "os-layer-actions"));

// A11oy Attestation — operator mutations (PUT /routing-weights/:dim,
// POST /routing-weights/reset, POST /proof/envelope/:id/regenerate).
// Mounted AFTER guardianPolicyCheck so operator-tunable controls require auth.
router.use(a11oyAttestationProtectedRouter);
// A11oy Codex — gated mutations (POST /a11oy/codex/rebuild).
router.use(a11oyCodexProtectedRouter);
// A11oy Formulas — operator-gated mutations (propose/approve/reject tunings).
router.use(a11oyFormulasProtectedRouter);

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
// Live AI accuracy scores from `lib/pulse-evals` — surfaced in the Pulse
// dashboard. Mounted before the catch-all `/pulse` router so the more
// specific path takes priority.
router.use(
  "/pulse/eval-trends",
  perUserApiSlidingLimiter,
  lazyMount(() => import("./pulse-eval-trends"), "pulse-eval-trends"),
);
// Aliased mount so the Pulse client (and CSRF / global-auth-enforcer
// exemptions) can address these routes under the canonical `/api/pulse/...`
// prefix that they were always documented as.
router.use(
  "/pulse",
  perUserApiSlidingLimiter,
  lazyMount(() => import("./pulse"), "pulse-aliased"),
);
// Pulse org-wide fan-out v2 — org publications, schedules, preferences, unsubscribe
router.use(
  "/pulse/org",
  perUserApiSlidingLimiter,
  lazyMount(() => import("./pulse-org"), "pulse-org"),
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
router.use(lazyMatch("/aegis/investor", () => import("./aegis-investor-deck"), "aegis-investor-deck"));
router.use(lazyMatch("/lp-portal", () => import("./lp-portal"), "lp-portal"));

// Decision Runtime v1 — GET /api/decisions/cards and GET /api/decisions/cards/:id
// are public (demo workspace when unauthenticated). Mutating routes require auth.
router.use(decisionsRuntimeRouter);

// Trace/reflection/plan/replay routers. Note traces.ts also serves /runs* paths.
router.use(lazyMatch(["/traces", "/runs"], () => import("./traces"), "traces"));

// ACR Governance — v1 approval interrupts and run ledger (auth-gated)
// Mounted via router.use(prefix, lazyMount(...)) because inner routers use
// relative paths (e.g. "/", "/:id") that only resolve once Express strips
// the prefix. lazyMatch leaves the original URL intact and would 404.
router.use("/v1/approvals", lazyMount(() => import("./v1-approvals"), "v1-approvals"));
router.use("/v1/runs", lazyMount(() => import("./v1-runs"), "v1-runs"));

router.use(lazyMatch("/reflections", () => import("./reflections"), "reflections"));
router.use(lazyMatch("/plans", () => import("./plans"), "plans"));
router.use(lazyMatch("/replay", () => import("./replay"), "replay"));
router.use(
  lazyMatch(["/proof-chain", "/audit-log"], () => import("./trust-provenance"), "trust-provenance"),
);
router.use(lazyMatch("/mcp-gateway", () => import("./mcp-gateway"), "mcp-gateway"));
router.use(lazyMatch("/tool-mesh", () => import("./tool-mesh"), "tool-mesh"));
router.use(lazyMatch("/praxis-tools", () => import("./praxis-tools"), "praxis-tools"));
router.use(lazyMatch("/ai-gateway", () => import("./ai-gateway"), "ai-gateway"));

router.use(lazyMatch("/hf-mcp", () => import("./hf-mcp-proxy"), "hf-mcp-proxy"));

// A11oy Hub Operations — governed HF CLI bridge for agent-native Hub operations.
// Search, download, upload with PCE gate evaluation, proof chain, and cost metering.
router.use(lazyMatch("/a11oy/hub-operations", () => import("./a11oy-hub-operations"), "a11oy-hub-operations"));

// Frontier Ingestion Engine — continuous pulls from Anthropic/OpenAI/Google/NVIDIA/HF.
// Codex-scored (Ouroboros + Lutar + thesis-fit). Auto-promote or queue for operator review.
router.use(lazyMatch("/a11oy/frontier", () => import("./a11oy-frontier"), "a11oy-frontier"));

// Unified Hugging Face Hub — model/dataset/space search, pinned registry,
// multimodal inference proxy, and token health. All HF traffic from every
// frontend flows through this single surface so auth, retries, and cost
// telemetry are centralised. MUST be mounted BEFORE /hf so the more-
// specific /hf/hub/* prefix matches first (Express uses first-match routing).
router.use(lazyMatch("/hf/hub", () => import("./hf-hub"), "hf-hub"));

// HF operator registry + failover chains + audit — mounted before /hf so
// /hf/registry/* resolves before the catch-all /hf status route.
router.use(lazyMatch("/hf/registry", () => import("./hf-registry"), "hf-registry"));
router.use("/sovereign", lazyMount(() => import("./sovereign"), "sovereign"));

// HF status / whoami / subsystem health check — mounted after /hf/hub and /hf/registry.
router.use(lazyMatch("/hf", () => import("./hf-status"), "hf-status"));

// HuggingFace Jobs — governed external compute backend for agents.
// Owns /hf-jobs/runs, /hf-jobs/schedules, /hf-jobs/flavors, /hf-jobs/summary.
// Auth-gated; mutating routes pass through Guardian and write to the action ledger.
router.use(lazyMatch("/hf-jobs", () => import("./hf-jobs"), "hf-jobs"));

// HuggingFace ML Intelligence — legal NLP, threat correlation, AIS decode, property valuation,
// summarization (bart-large-cnn), and improved RAG embeddings (bge-large-en-v1.5).
// Public endpoints — no auth required for demo surfaces.
router.use(lazyMatch("/hf-intelligence", () => import("./hf-intelligence"), "hf-intelligence"));

core.register(router);
vessels.register(router);
security.register(router);
lyte.register(router);
terra.register(router);
continuum.register(router);
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
continuumRuntime.register(router);
selfModel.register(router);
cognitiveReflexivity.register(router);
ouroboros.register(router);
verifier.register(router);
skillLibrary.register(router);

router.use("/provenance", lazyMount(() => import("./provenance"), "provenance"));

// NEXUS Unified Intelligence Protocol v1 — single-endpoint API across all domains.
// Mounted BEFORE the legacy /nexus router so v1 paths take precedence.
router.use(lazyMatch(["/nexus/v1"], () => import("./nexus-v1"), "nexus-v1"));

// NEXUS Kernel — Unified AI Compute Kernel orchestration layer (SGLang + HuggingFace Kernel Hub).
// Owns /nexus/kernels, /nexus/infer, /nexus/compare, /nexus/simulate, /nexus/health, /nexus/audit, /nexus/stats
// nexus-kernel routes are defined relative to /nexus (e.g. /stats, /kernels);
// mount with prefix-stripping lazyMount so they resolve.
router.use("/nexus", lazyMount(() => import("./nexus-kernel"), "nexus-kernel"));

// NEXUS MCP Fabric — bidirectional governed MCP control plane.
// Handles external server registry, session tracking, anomaly detection, and governed workflows.
router.use("/nexus-mcp", lazyMount(() => import("./nexus-mcp"), "nexus-mcp"));

router.use("/nexus", lazyMount(() => import("./nexus"), "nexus"));

// Ouroboros v4 Runtime — A11oy control plane, Sentra/Amaru ingestion contracts,
// validator registry, innovation engine, output paths, proof-route + pack
// aliases. Backed by @workspace/ouroboros (pure kernel, 70+ tests).
router.use("/ouroboros", lazyMount(() => import("./ouroboros"), "ouroboros"));

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

// Outbound Gateway — unified external delivery with tracking, retry, and audit.
router.use("/outbound", lazyMount(() => import("./outbound-gateway"), "outbound-gateway"));

router.use("/document-lifecycle", lazyMount(() => import("./document-lifecycle"), "document-lifecycle"));

router.use("/fund-management", lazyMount(() => import("./fund-management"), "fund-management"));

// Aegis PDF export — heavyweight CPU/IO operation; apply bulk export limit.
router.use("/aegis-export", bulkExportLimiter);
router.use("/aegis-export", lazyMount(() => import("./aegis-export"), "aegis-export"));

router.use(lazyMatch("/mobile-biometric", () => import("./mobile-biometric"), "mobile-biometric"));

// Precision Evolution Runtime (PER) — governed AI evolution control plane.
// Owns /evolution/* endpoints: candidates, evaluation, calibration, scoring,
// drift, promotion, rollback, audit, and diagnostics.
router.use(lazyMatch("/evolution", () => import("./evolution"), "evolution"));

// A11oy Forge — Governed Self-Evolution Runtime for agent scaffold evolution
// (prompt strategies, tool selection, routing weights, autonomy levels, policy
// boundaries). Distinct from PER which governs model weight training.
// Owns /alloy-forge/* endpoints: status, evolution-rounds, arena, proof-ledger,
// cross-domain proposals, drift-alerts, timeline, and approve/reject lifecycle.
router.use(lazyMatch("/alloy-forge", () => import("./alloy-forge"), "alloy-forge"));

// FORGE Model Foundry — governed fine-tuning pipeline.
// Owns /model-foundry/* endpoints: families, runs, mirror-eval gate,
// covenant approval, model card w/ proof packet, lineage, cost summary.
router.use(lazyMatch("/model-foundry", () => import("./model-foundry"), "model-foundry"));

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
router.use("/omnia", lazyMount(() => import("./omnia"), "omnia"));

// OpenAI Voice & Audio — conversational voice sessions (gpt-audio speech-to-speech)
// and TTS audio briefing generation for Pulse and mobile.
// POST /openai/conversations                    — create ephemeral voice session (no DB, returns random id)
// GET  /openai/conversations/:id/messages       — stub: returns []
// POST /openai/conversations/:id/voice-messages — SSE streaming voice-to-voice (web, Command portal)
// POST /openai/voice-messages                   — SSE streaming voice-to-voice (generic web)
// POST /openai/voice-query                      — non-streaming voice query with audio response (mobile)
// POST /openai/text-query                       — AI text query for OMNIA (mobile text input)
// POST /openai/briefing-audio                   — stream MP3 TTS for a briefing text (Pulse Listen button)
// POST /openai/voice-approval                   — auditable voice-driven HITL action approval with provenance
// GET  /openai/daily-briefing/today             — today's daily briefing audio+provenance (mobile)
router.use("/openai", openaiConversationsRouter);

// Conduit — Reverse ETL: map SZL internal data to third-party SaaS destinations
// GET/POST/PATCH/DELETE /conduit/connections, /conduit/syncs, /conduit/sync-runs
// POST /conduit/syncs/:id/run, GET/PUT /conduit/syncs/:id/mappings
// GET /conduit/templates, POST /conduit/templates/:id/apply
// GET /conduit/destinations/:destination/objects
// POST /conduit/sources/preview, GET /conduit/stats
router.use(lazyMatch("/conduit", () => import("./conduit"), "conduit"));

// Carlota Jo drip email engine — lead nurturing sequences, engagement tracking, unsubscribe.
router.use(lazyMatch("/booking/drip", () => import("./carlota-drip"), "carlota-drip"));

// Carlota Jo Consulting — AI advisor chat, booking, portal, and CRM routes
router.use(
  lazyMatch(
    ["/booking", "/carlota", "/portal"],
    () => import("./carlota-jo"),
    "carlota-jo",
  ),
);

// Feature flag evaluation — POST /flags/evaluate, GET /flags/:key
router.use(lazyRegisterMatch(["/flags"], () => import("./feature-flags-public"), "feature-flags-public"));

// Alloy Agentic RAG — unified Agentic RAG platform layer
// POST   /alloy/agentic-rag/run           — full agentic RAG loop (auth + rate-limit + policy-guard)
// GET    /alloy/agentic-rag/runs/:id       — retrieve run result
// GET    /alloy/agentic-rag/runs/:id/trace — retrieve full trace
// POST   /alloy/agentic-rag/run/stream     — SSE streaming run
// GET    /alloy/agentic-rag/specialists    — list available specialist agents
// GET    /alloy/agentic-rag/mcp-classes    — list MCP server class capability descriptors
router.use("/alloy/agentic-rag", lazyMount(() => import("./alloy-agentic-rag"), "alloy-agentic-rag"));

// Open Evaluation Layer — benchmark registry, leaderboards, result submission & verification
// GET  /eval-registry/benchmarks
// GET  /eval-registry/benchmarks/:benchmarkId
// GET  /eval-registry/benchmarks/:benchmarkId/tasks
// GET  /eval-registry/benchmarks/:benchmarkId/leaderboard
// GET  /eval-registry/entities/:entityId/results
// GET  /eval-registry/results/:resultId
// POST /eval-registry/results
// POST /eval-registry/results/:resultId/verify
// GET  /eval-registry/submissions
// POST /eval-registry/submissions
// PATCH /eval-registry/submissions/:id/accept
// PATCH /eval-registry/submissions/:id/reject
router.use(lazyMatch("/eval-registry", () => import("./eval-registry"), "eval-registry"));

// SIGIL — SZL Integrated Governance & Invariant Layer
// GET  /sigil/health
// POST /sigil/compose
// POST /sigil/witness
// POST /sigil/coherence
// POST /sigil/saturation
router.use(lazyRegisterMatch(["/sigil"], () => import("./sigil"), "sigil"));

// Ouroboros · Gauß axis — operational port of v5 primitives 17 + 20
// GET  /ouroboros/gauss/health
// POST /ouroboros/gauss/fit
// POST /ouroboros/gauss/residuals
router.use(
  lazyRegisterMatch(
    ["/ouroboros/gauss"],
    () => import("./ouroboros-gauss"),
    "ouroboros-gauss",
  ),
);

// Ouroboros · Guardrails axis — operational port of v6 SKU
// (NeMo-Guardrails-compatible config surface + Λ scalar + tamper-evident
// hash-chained receipts). Backed by @workspace/ouroboros-guardrails.
// GET  /ouroboros/guardrails/health
// POST /ouroboros/guardrails/evaluate
// POST /ouroboros/guardrails/verify-receipt
router.use(
  lazyRegisterMatch(
    ["/ouroboros/guardrails"],
    () => import("./ouroboros-guardrails"),
    "ouroboros-guardrails",
  ),
);

// Runtime Configuration — operator-tunable parameters (ops/admin only)
// GET    /runtime-config            — list all config entries
// GET    /runtime-config/:key       — get a single entry
// POST   /runtime-config            — create a new entry
// PATCH  /runtime-config/:key       — update value / description
// DELETE /runtime-config/:key       — delete (resets to code default)
// POST   /runtime-config/invalidate-cache — bust cache for one or all keys
router.use(lazyMatch("/runtime-config", () => import("./runtime-config"), "runtime-config"));

// LEXICON — License Intelligence Catalog API
// GET /lexicon/v1/licenses
// GET /lexicon/v1/licenses/:id
// GET /lexicon/v1/compatibility
// GET /lexicon/v1/compatibility/:a/:b
// GET /lexicon/v1/families
// GET /lexicon/v1/families/:id
// GET /lexicon/v1/stats
// GET /lexicon/v1/openapi.json
router.use("/lexicon", lazyMount(() => import("./lexicon"), "lexicon"));

// Model Passport Registry — signed per-model-variant identity and governance artifacts.
// GET    /model-passports             — list passports (filter by lane, tier, state, tenant)
// GET    /model-passports/:id         — fetch one passport by id
// POST   /model-passports             — register a new passport (ops/admin only)
// POST   /model-passports/resolve     — resolve best passport for lane + budget + SLA + tenant
// POST   /model-passports/:id/verify  — re-verify signature + provenance hash live
// PATCH  /model-passports/:id/state   — lifecycle state transition (ops/admin, approver for high-risk)
// POST   /model-passports/seed        — seed passports for current allow-listed models (admin only)
router.use("/model-passports", lazyMount(() => import("./model-passports"), "model-passports"));

// Governance Gate Configuration & Operator Model Registry API
// GET    /governance/registry               — list all operator-registered models
// POST   /governance/registry               — add a new HF model (admin only)
// PATCH  /governance/registry/:id          — update model metadata (admin only)
// DELETE /governance/registry/:id          — remove a model (admin only, non-seeded only)
// GET    /governance/gates                  — read gate status for all models
// GET    /governance/gates/:id             — read gate status for a specific model
// PATCH  /governance/gates/:id             — update per-model gate conditions (admin only)
// POST   /governance/gates/:id/bypass      — grant a time-limited gate bypass (admin only)
// DELETE /governance/gates/:id/bypass/:bid — revoke a bypass (admin only)
// GET    /governance/gates/:id/bypasses    — list bypass audit trail
router.use(lazyMatch("/governance", () => import("./governance-gates"), "governance-gates"));

// Governed Evaluation Harness — proxy to the eval runner service.
// GET  /eval-harness/health
// GET  /eval-harness/suites
// POST /eval-harness/runs
// GET  /eval-harness/runs
// GET  /eval-harness/runs/:runId
// POST /eval-harness/runs/:runId/reproduce
// POST /eval-harness/runs/:runId/verify
// GET  /eval-harness/regression/:runId/:baselineId
// GET  /eval-harness/gate-status
router.use(lazyMatch("/eval-harness", () => import("./eval-harness"), "eval-harness"));

// A11oy Vertical Orchestrator — self-serve DomainPack onboarding.
// Feature flag: A11OY_ORCHESTRATOR_ENABLED (default off in prod, on in dev).
// Mounted at /a11oy/orchestrator/* to align with the A11oy frontend useApiData base (/api/a11oy).
// GET    /a11oy/orchestrator/packs                          — catalog (public A11oy surface)
// GET    /a11oy/orchestrator/packs/:slug                    — single pack detail
// POST   /a11oy/orchestrator/packs                          — draft new pack (adminGuard)
// POST   /a11oy/orchestrator/packs/:slug/validate           — validate pack body (adminGuard)
// POST   /a11oy/orchestrator/packs/:slug/request-activation — submit for approval queue (adminGuard)
// POST   /a11oy/orchestrator/packs/:slug/activate           — approve activation (adminGuard)
// POST   /a11oy/orchestrator/packs/:slug/reject             — reject pending pack (adminGuard)
// DELETE /a11oy/orchestrator/packs/:slug                    — delete draft/rejected pack (adminGuard)
// GET    /a11oy/orchestrator/packs/:slug/health             — per-pack health KPIs
// GET    /a11oy/orchestrator/packs/:slug/audit              — pack audit trail
// GET    /a11oy/orchestrator/status                         — orchestrator readiness probe
// Mounted with router.use(prefix, lazyMount(...)) — not lazyMatch — because
// the inner router defines paths relative to the orchestrator prefix
// (e.g. /packs, /status). lazyMatch does not strip the prefix, so those
// relative paths would never match and every request would 404.
router.use("/a11oy/orchestrator", lazyMount(() => import("./a11oy-vertical-orchestrator"), "a11oy-vertical-orchestrator"));

// A11oy Stubs Killer — backing endpoints for previously-stub surfaces:
// Ownership Graph, Distress Engine, Knowledge Vault, Infrastructure Map fixtures.
// All endpoints return deterministic seed data scoped per tenant; reassignment
// state for the ownership graph is kept in-memory keyed by tenant.
// GET  /a11oy/stubs/ownership-graph
// POST /a11oy/stubs/ownership-graph/reassign
// GET  /a11oy/stubs/distress-engine
// GET  /a11oy/stubs/distress-engine/:id
// GET  /a11oy/stubs/knowledge-vault?q=&category=
// GET  /a11oy/stubs/knowledge-vault/:id
// GET  /a11oy/stubs/infrastructure-map
router.use("/a11oy/stubs", lazyMount(() => import("./a11oy-stubs"), "a11oy-stubs"));

// A11oy Strategy Simulations contract (Task #5171):
// GET  /a11oy/strategy/scenarios
// GET  /a11oy/strategy/scenarios/:id
// POST /a11oy/strategy/scenarios/:id/run
// GET  /a11oy/strategy/runs
// GET  /a11oy/strategy/runs/:runId
router.use("/a11oy/strategy", lazyMount(() => import("./a11oy-strategy"), "a11oy-strategy"));

// Foundry — DeepSeek-V4 surface (task #5223).
// GET  /foundry/deepseek-v4
// GET  /foundry/deepseek-v4/models
// GET  /foundry/deepseek-v4/benchmarks?board=frontier|modes
// POST /foundry/deepseek-v4/route
// GET  /foundry/deepseek-v4/proofs
// GET  /foundry/deepseek-v4/long-context/recipes
// POST /foundry/deepseek-v4/long-context/ingest
router.use(lazyMatch("/foundry/deepseek-v4", () => import("./foundry-deepseek-v4"), "foundry-deepseek-v4"));

// Atelier (#5237): persisted Spaces / Runs / Proof Packets / Embed telemetry.
// Public endpoints — proof URLs and leaderboards are intentionally readable.
// GET    /atelier/spaces                       — list all Spaces
// GET    /atelier/spaces/:slug                 — single Space
// POST   /atelier/spaces                       — create Space
// POST   /atelier/spaces/:parent/fork          — fork with computed diff
// GET    /atelier/runs?spaceSlug=              — list runs (optional filter)
// GET    /atelier/runs/:id                     — single run
// POST   /atelier/runs                         — start run
// POST   /atelier/runs/:id/complete            — complete run, mint proof packet
// GET    /atelier/proofs                       — list proof packets
// GET    /atelier/proofs/:id                   — single proof packet (public)
// POST   /atelier/embed-events                 — record embed telemetry
// GET    /atelier/leaderboards?mode=           — governance-weighted leaderboard
router.use("/atelier", lazyMount(() => import("./atelier"), "atelier"));

// Perception/Bio API surface (#5519): one governed entry point per
// shared package — `@szl-holdings/perception-loop` (feature-vector
// verify, antivenom nonce), `@szl-holdings/sequence-pipeline` (trace
// ingest + tabulated statistic), `@szl-holdings/anomaly-fabric`
// peak-detector (batch scoring + ranked-candidate classification),
// `@szl-holdings/procedural-kit` (USD export job). All four prefixes
// share one router; lazy-loaded so cold-start cost is paid only on
// first hit.
router.use(
  lazyMatch(
    ["/perception", "/sequence-pipeline", "/peak-detector", "/procedural-kit"],
    () => import("./perception-bio"),
    "perception-bio",
  ),
);

// Electrodynamics API surface (#5532): one governed entry point for the
// shared package `@szl-holdings/electrodynamics-kit`. Ten endpoints
// under the `/electrodynamics` prefix cover actuator-command,
// device-lifecycle, bus-budget, mission-graph compile, engagement
// dosimetry, swarm consensus tally, redundancy mode transitions,
// nav-state fusion, em-field-step, and sealed-capability seal. All
// share one router; lazy-loaded so cold-start cost is paid only on
// first hit. See docs/research/electrodynamics-synthesis-2026.md.
router.use(
  lazyMatch(
    ["/electrodynamics"],
    () => import("./electrodynamics"),
    "electrodynamics",
  ),
);

// Warhacker Hub API (#5539): five operational lanes proving the
// Defense Unicorns problem set against the live backend. Endpoints
// emit hash-chained Doctrine V6 receipts so the hub UI at
// /rosie/warhacker can render real receipt chains, not slideware.
router.use(
  lazyMatch(
    ["/warhacker"],
    () => import("./warhacker"),
    "warhacker",
  ),
);

export default router;
