# API Catalogue — SZL Holdings DreamStack API

> **Auto-generated** from `lib/api-spec/openapi.yaml` — do not edit by hand.
> Last generated: **2026-04-22** | Spec version: **0.3.0** | Base URL: `/api`

Run `pnpm docs:generate` to refresh after editing the spec.

## Summary

| Metric | Value |
|--------|-------|
| Total paths | 4071 |
| Total operations | 5040 |
| Tag groups | 282 |
| Spec version | 0.3.0 |

## Table of Contents

- [health](#health) (13 endpoints)
- [ai-engine](#ai-engine) (26 endpoints)
- [projects](#projects) (10 endpoints)
- [auth](#auth) (34 endpoints)
- [connectors](#connectors) (11 endpoints)
- [notifications](#notifications) (11 endpoints)
- [audit](#audit) (4 endpoints)
- [billing](#billing) (92 endpoints)
- [feature-flags](#feature-flags) (14 endpoints)
- [files](#files) (13 endpoints)
- [Storage](#storage) (3 endpoints)
- [stephen](#stephen) (37 endpoints)
- [vessels](#vessels) (79 endpoints)
- [firestorm](#firestorm) (3 endpoints)
- [lyte](#lyte) (43 endpoints)
- [dreamscape](#dreamscape) (29 endpoints)
- [readiness](#readiness) (30 endpoints)
- [observability](#observability) (16 endpoints)
- [terra](#terra) (34 endpoints)
- [holdings](#holdings) (92 endpoints)
- [a2a](#a2a) (62 endpoints)
- [agent-os](#agent-os) (18 endpoints)
- [copilot](#copilot) (1 endpoint)
- [alloy](#alloy) (158 endpoints)
- [decisions](#decisions) (9 endpoints)
- [skills](#skills) (12 endpoints)
- [admin](#admin) (14 endpoints)
- [reports](#reports) (45 endpoints)
- [exports](#exports) (25 endpoints)
- [webhooks](#webhooks) (18 endpoints)
- [atlas](#atlas) (4 endpoints)
- [act](#act) (4 endpoints)
- [action-store](#action-store) (3 endpoints)
- [actions](#actions) (4 endpoints)
- [aegis-digital-twin](#aegis-digital-twin) (3 endpoints)
- [aegis-intel](#aegis-intel) (28 endpoints)
- [aegis-modules](#aegis-modules) (21 endpoints)
- [aegis-pcap](#aegis-pcap) (2 endpoints)
- [agent-autonomy](#agent-autonomy) (10 endpoints)
- [agent-mesh](#agent-mesh) (9 endpoints)
- [agents](#agents) (4 endpoints)
- [ai-ops-dashboard](#ai-ops-dashboard) (18 endpoints)
- [ai-routes](#ai-routes) (17 endpoints)
- [alloy-channels](#alloy-channels) (10 endpoints)
- [alloy-cognitive-learning](#alloy-cognitive-learning) (8 endpoints)
- [alloy-digest](#alloy-digest) (6 endpoints)
- [alloy-email](#alloy-email) (9 endpoints)
- [alloy-governance](#alloy-governance) (13 endpoints)
- [alloy-integrations](#alloy-integrations) (11 endpoints)
- [alloy-meetings](#alloy-meetings) (7 endpoints)
- [alloy-policy-compiler](#alloy-policy-compiler) (5 endpoints)
- [alloy-research](#alloy-research) (13 endpoints)
- [alloy-runtime](#alloy-runtime) (232 endpoints)
- [alloy-skills](#alloy-skills) (28 endpoints)
- [alloy-voice](#alloy-voice) (5 endpoints)
- [analysis](#analysis) (4 endpoints)
- [analytics](#analytics) (4 endpoints)
- [analytics-engine-public](#analytics-engine-public) (2 endpoints)
- [apm](#apm) (4 endpoints)
- [approvals](#approvals) (20 endpoints)
- [apps-registry](#apps-registry) (6 endpoints)
- [assets-cases](#assets-cases) (39 endpoints)
- [atlas-scene-export](#atlas-scene-export) (16 endpoints)
- [atlas-spatial-runtime](#atlas-spatial-runtime) (28 endpoints)
- [audit-chain](#audit-chain) (4 endpoints)
- [booking](#booking) (4 endpoints)
- [briefing](#briefing) (4 endpoints)
- [briefings](#briefings) (5 endpoints)
- [business-events-ingestion](#business-events-ingestion) (5 endpoints)
- [capital-readiness](#capital-readiness) (44 endpoints)
- [carlota-jo](#carlota-jo) (183 endpoints)
- [carlota-jo-invoice-email](#carlota-jo-invoice-email) (2 endpoints)
- [carlota-time-tracking](#carlota-time-tracking) (9 endpoints)
- [certification-readiness](#certification-readiness) (45 endpoints)
- [changes](#changes) (3 endpoints)
- [cms](#cms) (83 endpoints)
- [cognitive-runtime](#cognitive-runtime) (4 endpoints)
- [command](#command) (19 endpoints)
- [comments](#comments) (5 endpoints)
- [competitive-intel](#competitive-intel) (10 endpoints)
- [compliance](#compliance) (13 endpoints)
- [config](#config) (2 endpoints)
- [connector-hub](#connector-hub) (8 endpoints)
- [consciousness](#consciousness) (16 endpoints)
- [constellation-views](#constellation-views) (4 endpoints)
- [contact](#contact) (3 endpoints)
- [content-crud](#content-crud) (60 endpoints)
- [conversions](#conversions) (2 endpoints)
- [core](#core) (5 endpoints)
- [correlation-map](#correlation-map) (2 endpoints)
- [cortex](#cortex) (19 endpoints)
- [counsel](#counsel) (21 endpoints)
- [covenant-policy-api](#covenant-policy-api) (18 endpoints)
- [crm](#crm) (28 endpoints)
- [cross-app-handoffs](#cross-app-handoffs) (8 endpoints)
- [cross-domain-query](#cross-domain-query) (2 endpoints)
- [cross-platform](#cross-platform) (4 endpoints)
- [crud](#crud) (33 endpoints)
- [csv-export](#csv-export) (1 endpoint)
- [data-retention](#data-retention) (7 endpoints)
- [dataverse](#dataverse) (30 endpoints)
- [deals](#deals) (3 endpoints)
- [debug](#debug) (2 endpoints)
- [decide](#decide) (5 endpoints)
- [decisioning](#decisioning) (12 endpoints)
- [decisions-receipts](#decisions-receipts) (4 endpoints)
- [decisions-runtime](#decisions-runtime) (8 endpoints)
- [delta-sync](#delta-sync) (9 endpoints)
- [demo-governed-scenarios](#demo-governed-scenarios) (1 endpoint)
- [demo-requests](#demo-requests) (2 endpoints)
- [demo-reset](#demo-reset) (2 endpoints)
- [deployments](#deployments) (5 endpoints)
- [digital-twins](#digital-twins) (10 endpoints)
- [doctrine](#doctrine) (2 endpoints)
- [domain-atlas-execution](#domain-atlas-execution) (19 endpoints)
- [domains](#domains) (6 endpoints)
- [dos-public-api](#dos-public-api) (4 endpoints)
- [drift](#drift) (4 endpoints)
- [evals](#evals) (11 endpoints)
- [events](#events) (3 endpoints)
- [evidence-graph](#evidence-graph) (9 endpoints)
- [executive-briefings](#executive-briefings) (6 endpoints)
- [external-integrations](#external-integrations) (52 endpoints)
- [fabric](#fabric) (4 endpoints)
- [feeds](#feeds) (15 endpoints)
- [firestorm-cognitive](#firestorm-cognitive) (5 endpoints)
- [firestorm-command-surfaces](#firestorm-command-surfaces) (11 endpoints)
- [firestorm-live](#firestorm-live) (11 endpoints)
- [flags](#flags) (2 endpoints)
- [forge](#forge) (23 endpoints)
- [forge-runtime-api](#forge-runtime-api) (8 endpoints)
- [fund-inbound-deals](#fund-inbound-deals) (10 endpoints)
- [fund-ops](#fund-ops) (51 endpoints)
- [funnel](#funnel) (1 endpoint)
- [fusion](#fusion) (18 endpoints)
- [gdpr](#gdpr) (3 endpoints)
- [genai-telemetry](#genai-telemetry) (7 endpoints)
- [geo-intel](#geo-intel) (2 endpoints)
- [gov-data](#gov-data) (13 endpoints)
- [govern-evolve](#govern-evolve) (9 endpoints)
- [governance](#governance) (17 endpoints)
- [governance-counts](#governance-counts) (1 endpoint)
- [graph](#graph) (8 endpoints)
- [graph-stream](#graph-stream) (1 endpoint)
- [growth](#growth) (1 endpoint)
- [guardian](#guardian) (458 endpoints)
- [health-integrations](#health-integrations) (46 endpoints)
- [identity](#identity) (9 endpoints)
- [imperium](#imperium) (8 endpoints)
- [incidents-alerts](#incidents-alerts) (16 endpoints)
- [infrastructure-status](#infrastructure-status) (1 endpoint)
- [innovation-engine](#innovation-engine) (5 endpoints)
- [integrations](#integrations) (31 endpoints)
- [investor-analytics](#investor-analytics) (6 endpoints)
- [invitations](#invitations) (5 endpoints)
- [jobs](#jobs) (17 endpoints)
- [knowledge-graph](#knowledge-graph) (18 endpoints)
- [leads](#leads) (4 endpoints)
- [linear](#linear) (4 endpoints)
- [live](#live) (8 endpoints)
- [lp-portal](#lp-portal) (9 endpoints)
- [lyte-billing](#lyte-billing) (6 endpoints)
- [lyte-cognitive](#lyte-cognitive) (7 endpoints)
- [lyte-extended](#lyte-extended) (22 endpoints)
- [lyte-intel](#lyte-intel) (3 endpoints)
- [lyte-live](#lyte-live) (5 endpoints)
- [lyte-observability](#lyte-observability) (23 endpoints)
- [lyte-surfaces](#lyte-surfaces) (8 endpoints)
- [maps](#maps) (2 endpoints)
- [mcp](#mcp) (6 endpoints)
- [mcp-gateway](#mcp-gateway) (5 endpoints)
- [memory](#memory) (15 endpoints)
- [microsoft-graph](#microsoft-graph) (8 endpoints)
- [microsoft-integrations](#microsoft-integrations) (9 endpoints)
- [ml-pipeline](#ml-pipeline) (44 endpoints)
- [monitoring](#monitoring) (8 endpoints)
- [monte-carlo](#monte-carlo) (14 endpoints)
- [msp](#msp) (11 endpoints)
- [msp-live](#msp-live) (5 endpoints)
- [multiplayer-sessions](#multiplayer-sessions) (6 endpoints)
- [narratives](#narratives) (1 endpoint)
- [newsletter](#newsletter) (1 endpoint)
- [nexus](#nexus) (28 endpoints)
- [notification-recipients](#notification-recipients) (4 endpoints)
- [nuro-mesh-advanced](#nuro-mesh-advanced) (17 endpoints)
- [oidc-auth](#oidc-auth) (51 endpoints)
- [onboarding](#onboarding) (5 endpoints)
- [ontology](#ontology) (9 endpoints)
- [opportunities](#opportunities) (2 endpoints)
- [ops-management](#ops-management) (22 endpoints)
- [org-settings](#org-settings) (32 endpoints)
- [ot-ics](#ot-ics) (10 endpoints)
- [ownership-control](#ownership-control) (43 endpoints)
- [page-view-tracking](#page-view-tracking) (1 endpoint)
- [partner-portal](#partner-portal) (80 endpoints)
- [pdf](#pdf) (14 endpoints)
- [pipeline-deals](#pipeline-deals) (5 endpoints)
- [plans](#plans) (9 endpoints)
- [platform-analytics](#platform-analytics) (34 endpoints)
- [playbooks](#playbooks) (8 endpoints)
- [policy-modes](#policy-modes) (8 endpoints)
- [powerbi](#powerbi) (6 endpoints)
- [preferences](#preferences) (2 endpoints)
- [prism-bus-api](#prism-bus-api) (6 endpoints)
- [prism-counsel-core](#prism-counsel-core) (25 endpoints)
- [prism-counsel-court](#prism-counsel-court) (19 endpoints)
- [prism-counsel-ny](#prism-counsel-ny) (42 endpoints)
- [prism-counsel-ops](#prism-counsel-ops) (29 endpoints)
- [prism-counsel-pilot](#prism-counsel-pilot) (28 endpoints)
- [prism-counsel-pilot-one](#prism-counsel-pilot-one) (36 endpoints)
- [prism-counsel-purview](#prism-counsel-purview) (9 endpoints)
- [prism-counsel-review](#prism-counsel-review) (27 endpoints)
- [prism-counsel-s31](#prism-counsel-s31) (35 endpoints)
- [privacy](#privacy) (2 endpoints)
- [prompt-registry](#prompt-registry) (4 endpoints)
- [proof-chain](#proof-chain) (5 endpoints)
- [providers](#providers) (10 endpoints)
- [public-status](#public-status) (10 endpoints)
- [publishing](#publishing) (11 endpoints)
- [pulse](#pulse) (295 endpoints)
- [pulse-evals](#pulse-evals) (8 endpoints)
- [push-analytics](#push-analytics) (1 endpoint)
- [push-history](#push-history) (2 endpoints)
- [push-notifications](#push-notifications) (5 endpoints)
- [push-preferences](#push-preferences) (5 endpoints)
- [push-tokens](#push-tokens) (3 endpoints)
- [rate-cards](#rate-cards) (9 endpoints)
- [realtime](#realtime) (4 endpoints)
- [receipt-graph](#receipt-graph) (12 endpoints)
- [reflections](#reflections) (8 endpoints)
- [replay](#replay) (7 endpoints)
- [research](#research) (29 endpoints)
- [revenue-intelligence](#revenue-intelligence) (3 endpoints)
- [risk-evidence](#risk-evidence) (4 endpoints)
- [scim](#scim) (18 endpoints)
- [seed](#seed) (2 endpoints)
- [self-healing](#self-healing) (11 endpoints)
- [self-model](#self-model) (6 endpoints)
- [sense](#sense) (3 endpoints)
- [sentra](#sentra) (7 endpoints)
- [signal-chains](#signal-chains) (7 endpoints)
- [signatures](#signatures) (8 endpoints)
- [simulation-whatif](#simulation-whatif) (1 endpoint)
- [storage](#storage-2) (3 endpoints)
- [substrate-replay](#substrate-replay) (4 endpoints)
- [support](#support) (16 endpoints)
- [system](#system) (20 endpoints)
- [teams](#teams) (18 endpoints)
- [telemetry](#telemetry) (1 endpoint)
- [tenant-health](#tenant-health) (4 endpoints)
- [tenants](#tenants) (12 endpoints)
- [terra-broker](#terra-broker) (13 endpoints)
- [terra-cognitive](#terra-cognitive) (20 endpoints)
- [terra-digital-twin](#terra-digital-twin) (2 endpoints)
- [terra-distress](#terra-distress) (9 endpoints)
- [terra-live](#terra-live) (9 endpoints)
- [terra-modules](#terra-modules) (35 endpoints)
- [terra-portfolio-intel](#terra-portfolio-intel) (5 endpoints)
- [terra-property-intel](#terra-property-intel) (6 endpoints)
- [terra-why-this-property](#terra-why-this-property) (1 endpoint)
- [traces](#traces) (24 endpoints)
- [trust-provenance](#trust-provenance) (8 endpoints)
- [unified-settings](#unified-settings) (9 endpoints)
- [usage](#usage) (4 endpoints)
- [users](#users) (13 endpoints)
- [v1-approvals](#v1-approvals) (3 endpoints)
- [v1-runs](#v1-runs) (2 endpoints)
- [verifier](#verifier) (5 endpoints)
- [vessels-cognitive](#vessels-cognitive) (5 endpoints)
- [vessels-digital-twin](#vessels-digital-twin) (2 endpoints)
- [vessels-extended](#vessels-extended) (31 endpoints)
- [vessels-freight](#vessels-freight) (1 endpoint)
- [vessels-insurance](#vessels-insurance) (12 endpoints)
- [vessels-live](#vessels-live) (5 endpoints)
- [vessels-modules](#vessels-modules) (11 endpoints)
- [vessels-platform](#vessels-platform) (23 endpoints)
- [vessels-psc](#vessels-psc) (5 endpoints)
- [vessels-trading](#vessels-trading) (10 endpoints)
- [vessels-voyage-risk](#vessels-voyage-risk) (5 endpoints)
- [web-push-subscriptions](#web-push-subscriptions) (5 endpoints)
- [worldline](#worldline) (5 endpoints)
- [Auth](#auth-2) (6 endpoints)

<a id="health"></a>

## health

Health operations

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /health/ai | `aiProviderHealthCheck` | AI provider health |
| `GET` | /health/billing | `billingHealthCheck` | Billing provider health |
| `GET` | /health/detailed | `detailedHealthCheck` | Detailed health status |
| `GET` | /health/health | `health_get_health_health` | [stub] List/get /health/health (health) |
| `GET` | /health/health/detailed | `health_get_health_health_detailed` | [stub] List/get /health/health/detailed (health) |
| `GET` | /health/healthz | `health_get_health_healthz` | [stub] List/get /health/healthz (health) |
| `GET` | /health/live | `livenessCheck` | Liveness probe |
| `GET` | /health/ready | `readinessCheck` | Readiness probe |
| `GET` | /health/websocket | `websocketHealthCheck` | WebSocket server health |
| `GET` | /healthz | `healthCheck` | Health check |
| `GET` | /healthz/health | `health_get_healthz_health` | [stub] List/get /healthz/health (health) |
| `GET` | /healthz/health/detailed | `health_get_healthz_health_detailed` | [stub] List/get /healthz/health/detailed (health) |
| `GET` | /healthz/healthz | `health_get_healthz_healthz` | [stub] List/get /healthz/healthz (health) |

<a id="ai-engine"></a>

## ai-engine

Alloy AI engine — decisions, approvals, audit, retrieval

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /ai/ai/approval-matrix | `ai_engine_get_ai_ai_approval_matrix` | [stub] List/get /ai/ai/approval-matrix (ai-engine) |
| `GET` | /ai/ai/audit | `ai_engine_get_ai_ai_audit` | [stub] List/get /ai/ai/audit (ai-engine) |
| `GET` | /ai/ai/decision | `ai_engine_get_ai_ai_decision` | [stub] List/get /ai/ai/decision (ai-engine) |
| `POST` | /ai/ai/decision | `ai_engine_post_ai_ai_decision` | [stub] Create/invoke /ai/ai/decision (ai-engine) |
| `GET` | /ai/ai/decision/{id} | `ai_engine_get_ai_ai_decision_id` | [stub] List/get /ai/ai/decision/{id} (ai-engine) |
| `POST` | /ai/ai/decision/{id}/approve | `ai_engine_post_ai_ai_decision_id_approve` | [stub] Create/invoke /ai/ai/decision/{id}/approve (ai-engine) |
| `POST` | /ai/ai/decision/{id}/reject | `ai_engine_post_ai_ai_decision_id_reject` | [stub] Create/invoke /ai/ai/decision/{id}/reject (ai-engine) |
| `GET` | /ai/ai/evals/golden-set | `ai_engine_get_ai_ai_evals_golden_set` | [stub] List/get /ai/ai/evals/golden-set (ai-engine) |
| `POST` | /ai/ai/evals/run | `ai_engine_post_ai_ai_evals_run` | [stub] Create/invoke /ai/ai/evals/run (ai-engine) |
| `POST` | /ai/ai/extract | `ai_engine_post_ai_ai_extract` | [stub] Create/invoke /ai/ai/extract (ai-engine) |
| `GET` | /ai/ai/health | `ai_engine_get_ai_ai_health` | [stub] List/get /ai/ai/health (ai-engine) |
| `GET` | /ai/ai/models | `ai_engine_get_ai_ai_models` | [stub] List/get /ai/ai/models (ai-engine) |
| `POST` | /ai/ai/plan | `ai_engine_post_ai_ai_plan` | [stub] Create/invoke /ai/ai/plan (ai-engine) |
| `POST` | /ai/ai/respond | `ai_engine_post_ai_ai_respond` | [stub] Create/invoke /ai/ai/respond (ai-engine) |
| `POST` | /ai/ai/retrieval/ingest | `ai_engine_post_ai_ai_retrieval_ingest` | [stub] Create/invoke /ai/ai/retrieval/ingest (ai-engine) |
| `POST` | /ai/ai/retrieve | `ai_engine_post_ai_ai_retrieve` | [stub] Create/invoke /ai/ai/retrieve (ai-engine) |
| `GET` | /ai/ai/tools | `ai_engine_get_ai_ai_tools` | [stub] List/get /ai/ai/tools (ai-engine) |
| `POST` | /ai/ai/tools/execute | `ai_engine_post_ai_ai_tools_execute` | [stub] Create/invoke /ai/ai/tools/execute (ai-engine) |
| `POST` | /ai/ai/tools/preview | `ai_engine_post_ai_ai_tools_preview` | [stub] Create/invoke /ai/ai/tools/preview (ai-engine) |
| `POST` | /ai/ai/triage | `ai_engine_post_ai_ai_triage` | [stub] Create/invoke /ai/ai/triage (ai-engine) |
| `GET` | /ai/approval-matrix | `getApprovalMatrix` | Get decision approval matrix |
| `GET` | /ai/decision | `listDecisions` | List Alloy decisions |
| `POST` | /ai/decision | `createDecision` | Create an Alloy decision |
| `GET` | /ai/decision/{id} | `getDecision` | Get a single Alloy decision |
| `POST` | /ai/decision/{id}/approve | `approveDecision` | Approve a pending Alloy decision |
| `POST` | /ai/decision/{id}/reject | `rejectDecision` | Reject a pending Alloy decision |

<a id="projects"></a>

## projects

Project operations

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /projects | `listProjects` | List all projects |
| `POST` | /projects | `createProject` | Create a new project |
| `GET` | /projects/{id} | `getProject` | Get a project by ID |
| `PATCH` | /projects/{id} | `updateProject` | Update a project |
| `DELETE` | /projects/{id} | `deleteProject` | Delete a project |
| `GET` | /projects/projects | `projects_get_projects_projects` | [stub] List/get /projects/projects (projects) |
| `POST` | /projects/projects | `projects_post_projects_projects` | [stub] Create/invoke /projects/projects (projects) |
| `GET` | /projects/projects/{id} | `projects_get_projects_projects_id` | [stub] List/get /projects/projects/{id} (projects) |
| `PATCH` | /projects/projects/{id} | `projects_patch_projects_projects_id` | [stub] Patch /projects/projects/{id} (projects) |
| `DELETE` | /projects/projects/{id} | `projects_delete_projects_projects_id` | [stub] Delete /projects/projects/{id} (projects) |

<a id="auth"></a>

## auth

Authentication and user management

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `POST` | /auth/auth/login | `auth_post_auth_auth_login` | [stub] Create/invoke /auth/auth/login (auth) |
| `POST` | /auth/auth/login-password | `auth_post_auth_auth_login_password` | [stub] Create/invoke /auth/auth/login-password (auth) |
| `GET` | /auth/auth/me | `auth_get_auth_auth_me` | [stub] List/get /auth/auth/me (auth) |
| `DELETE` | /auth/auth/mfa | `auth_delete_auth_auth_mfa` | [stub] Delete /auth/auth/mfa (auth) |
| `POST` | /auth/auth/mfa/challenge | `auth_post_auth_auth_mfa_challenge` | [stub] Create/invoke /auth/auth/mfa/challenge (auth) |
| `POST` | /auth/auth/mfa/enable | `auth_post_auth_auth_mfa_enable` | [stub] Create/invoke /auth/auth/mfa/enable (auth) |
| `POST` | /auth/auth/mfa/enable-required | `auth_post_auth_auth_mfa_enable_required` | [stub] Create/invoke /auth/auth/mfa/enable-required (auth) |
| `POST` | /auth/auth/mfa/setup | `auth_post_auth_auth_mfa_setup` | [stub] Create/invoke /auth/auth/mfa/setup (auth) |
| `POST` | /auth/auth/mfa/setup-required | `auth_post_auth_auth_mfa_setup_required` | [stub] Create/invoke /auth/auth/mfa/setup-required (auth) |
| `GET` | /auth/auth/mfa/status | `auth_get_auth_auth_mfa_status` | [stub] List/get /auth/auth/mfa/status (auth) |
| `GET` | /auth/auth/my-roles | `auth_get_auth_auth_my_roles` | [stub] List/get /auth/auth/my-roles (auth) |
| `GET` | /auth/auth/providers | `auth_get_auth_auth_providers` | [stub] List/get /auth/auth/providers (auth) |
| `POST` | /auth/auth/refresh | `auth_post_auth_auth_refresh` | [stub] Create/invoke /auth/auth/refresh (auth) |
| `POST` | /auth/auth/register | `auth_post_auth_auth_register` | [stub] Create/invoke /auth/auth/register (auth) |
| `GET` | /auth/auth/roles | `auth_get_auth_auth_roles` | [stub] List/get /auth/auth/roles (auth) |
| `POST` | /auth/auth/sessions | `auth_post_auth_auth_sessions` | [stub] Create/invoke /auth/auth/sessions (auth) |
| `DELETE` | /auth/auth/sessions/{id} | `auth_delete_auth_auth_sessions_id` | [stub] Delete /auth/auth/sessions/{id} (auth) |
| `DELETE` | /auth/auth/sessions/current | `auth_delete_auth_auth_sessions_current` | [stub] Delete /auth/auth/sessions/current (auth) |
| `GET` | /auth/auth/users | `auth_get_auth_auth_users` | [stub] List/get /auth/auth/users (auth) |
| `GET` | /auth/auth/verify-email | `auth_get_auth_auth_verify_email` | [stub] List/get /auth/auth/verify-email (auth) |
| `POST` | /auth/auth/ws-ticket | `auth_post_auth_auth_ws_ticket` | [stub] Create/invoke /auth/auth/ws-ticket (auth) |
| `POST` | /auth/login | `login` | Authenticate with a credential and receive a session token |
| `POST` | /auth/login-password | `loginWithPassword` | Authenticate with email and password |
| `GET` | /auth/me | `getCurrentUser` | Get current authenticated user |
| `GET` | /auth/my-roles | `getMyRoles` | Get roles for the current user |
| `GET` | /auth/providers | `getAuthProviders` | List available authentication providers |
| `POST` | /auth/register | `register` | Register a new user account |
| `GET` | /auth/roles | `listRoles` | List all roles |
| `POST` | /auth/sessions | `createSession` | Create a new session token |
| `DELETE` | /auth/sessions/{id} | `deleteSession` | Revoke a session by ID |
| `DELETE` | /auth/sessions/current | `deleteCurrentSession` | Revoke the current session (from Authorization header) |
| `GET` | /auth/users | `listUsers` | List all users |
| `GET` | /auth/verify-email | `verifyEmail` | Verify an email address with a token |
| `POST` | /auth/ws-ticket | `createWsTicket` | Create a short-lived WebSocket upgrade ticket |

<a id="connectors"></a>

## connectors

Integration connector management

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /connectors | `listConnectors` | List all connectors |
| `POST` | /connectors | `createConnector` | Create a new connector |
| `GET` | /connectors/{id} | `getConnector` | Get a connector by ID |
| `PATCH` | /connectors/{id} | `updateConnector` | Update a connector |
| `DELETE` | /connectors/{id} | `deleteConnector` | Delete a connector |
| `GET` | /connectors/connectors | `connectors_get_connectors_connectors` | [stub] List/get /connectors/connectors (connectors) |
| `POST` | /connectors/connectors | `connectors_post_connectors_connectors` | [stub] Create/invoke /connectors/connectors (connectors) |
| `GET` | /connectors/connectors/{id} | `connectors_get_connectors_connectors_id` | [stub] List/get /connectors/connectors/{id} (connectors) |
| `PATCH` | /connectors/connectors/{id} | `connectors_patch_connectors_connectors_id` | [stub] Patch /connectors/connectors/{id} (connectors) |
| `DELETE` | /connectors/connectors/{id} | `connectors_delete_connectors_connectors_id` | [stub] Delete /connectors/connectors/{id} (connectors) |
| `GET` | /connectors/connectors/{id}/logs | `connectors_get_connectors_connectors_id_logs` | [stub] List/get /connectors/connectors/{id}/logs (connectors) |

<a id="notifications"></a>

## notifications

Notification management

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /notifications | `listNotifications` | List notifications |
| `POST` | /notifications | `createNotification` | Create a notification |
| `DELETE` | /notifications/{id} | `deleteNotification` | Delete a notification |
| `PATCH` | /notifications/{id}/read | `markNotificationRead` | Mark notification as read |
| `GET` | /notifications/notifications | `notifications_get_notifications_notifications` | [stub] List/get /notifications/notifications (notifications) |
| `POST` | /notifications/notifications | `notifications_post_notifications_notifications` | [stub] Create/invoke /notifications/notifications (notifications) |
| `DELETE` | /notifications/notifications/{id} | `notifications_delete_notifications_notifications_id` | [stub] Delete /notifications/notifications/{id} (notifications) |
| `PATCH` | /notifications/notifications/{id}/read | `notifications_patch_notifications_notifications_id_read` | [stub] Patch /notifications/notifications/{id}/read (notifications) |
| `GET` | /notifications/notifications/count | `notifications_get_notifications_notifications_count` | [stub] List/get /notifications/notifications/count (notifications) |
| `PATCH` | /notifications/notifications/read-all | `notifications_patch_notifications_notifications_read_all` | [stub] Patch /notifications/notifications/read-all (notifications) |
| `PATCH` | /notifications/read-all | `markAllNotificationsRead` | Mark all notifications as read for the current user |

<a id="audit"></a>

## audit

Activity logs and audit events

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /audit/activity | `listActivityLogs` | List activity logs |
| `GET` | /audit/audit/activity | `audit_get_audit_audit_activity` | [stub] List/get /audit/audit/activity (audit) |
| `GET` | /audit/audit/events | `audit_get_audit_audit_events` | [stub] List/get /audit/audit/events (audit) |
| `GET` | /audit/events | `listAuditEvents` | List audit events |

<a id="billing"></a>

## billing

Billing plans, subscriptions, and invoices

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `POST` | /billing/aegis/enterprise-quote | `requestAegisEnterpriseQuote` | Submit an Aegis enterprise quote request |
| `POST` | /billing/aegis/invoice | `createAegisInvoice` | Create an Aegis invoice (admin) |
| `POST` | /billing/billing/aegis/enterprise-quote | `billing_post_billing_billing_aegis_enterprise_quote` | [stub] Create/invoke /billing/billing/aegis/enterprise-quote (billing) |
| `POST` | /billing/billing/aegis/invoice | `billing_post_billing_billing_aegis_invoice` | [stub] Create/invoke /billing/billing/aegis/invoice (billing) |
| `POST` | /billing/billing/cancel-subscription | `billing_post_billing_billing_cancel_subscription` | [stub] Create/invoke /billing/billing/cancel-subscription (billing) |
| `POST` | /billing/billing/checkout | `billing_post_billing_billing_checkout` | [stub] Create/invoke /billing/billing/checkout (billing) |
| `GET` | /billing/billing/checkout-session/{sessionId} | `billing_get_billing_billing_checkout_session_sessionId` | [stub] List/get /billing/billing/checkout-session/{sessionId} (billing) |
| `GET` | /billing/billing/command/plans | `billing_get_billing_billing_command_plans` | [stub] List/get /billing/billing/command/plans (billing) |
| `POST` | /billing/billing/command/subscribe | `billing_post_billing_billing_command_subscribe` | [stub] Create/invoke /billing/billing/command/subscribe (billing) |
| `POST` | /billing/billing/customer-portal | `billing_post_billing_billing_customer_portal` | [stub] Create/invoke /billing/billing/customer-portal (billing) |
| `GET` | /billing/billing/invoices | `billing_get_billing_billing_invoices` | [stub] List/get /billing/billing/invoices (billing) |
| `GET` | /billing/billing/plans | `billing_get_billing_billing_plans` | [stub] List/get /billing/billing/plans (billing) |
| `GET` | /billing/billing/plans/{id} | `billing_get_billing_billing_plans_id` | [stub] List/get /billing/billing/plans/{id} (billing) |
| `POST` | /billing/billing/portal-session | `billing_post_billing_billing_portal_session` | [stub] Create/invoke /billing/billing/portal-session (billing) |
| `GET` | /billing/billing/products | `billing_get_billing_billing_products` | [stub] List/get /billing/billing/products (billing) |
| `GET` | /billing/billing/revenue-analytics | `billing_get_billing_billing_revenue_analytics` | [stub] List/get /billing/billing/revenue-analytics (billing) |
| `GET` | /billing/billing/stripe-config | `billing_get_billing_billing_stripe_config` | [stub] List/get /billing/billing/stripe-config (billing) |
| `GET` | /billing/billing/stripe-invoices | `billing_get_billing_billing_stripe_invoices` | [stub] List/get /billing/billing/stripe-invoices (billing) |
| `GET` | /billing/billing/subscription-status | `billing_get_billing_billing_subscription_status` | [stub] List/get /billing/billing/subscription-status (billing) |
| `GET` | /billing/billing/subscriptions | `billing_get_billing_billing_subscriptions` | [stub] List/get /billing/billing/subscriptions (billing) |
| `POST` | /billing/billing/sync-plans | `billing_post_billing_billing_sync_plans` | [stub] Create/invoke /billing/billing/sync-plans (billing) |
| `POST` | /billing/billing/terra/metered-usage | `billing_post_billing_billing_terra_metered_usage` | [stub] Create/invoke /billing/billing/terra/metered-usage (billing) |
| `GET` | /billing/billing/terra/plans | `billing_get_billing_billing_terra_plans` | [stub] List/get /billing/billing/terra/plans (billing) |
| `POST` | /billing/billing/terra/subscribe | `billing_post_billing_billing_terra_subscribe` | [stub] Create/invoke /billing/billing/terra/subscribe (billing) |
| `POST` | /billing/billing/update-subscription | `billing_post_billing_billing_update_subscription` | [stub] Create/invoke /billing/billing/update-subscription (billing) |
| `POST` | /billing/billing/webhooks | `billing_post_billing_billing_webhooks` | [stub] Create/invoke /billing/billing/webhooks (billing) |
| `POST` | /billing/cancel-subscription | `cancelSubscription` | Cancel a Stripe subscription |
| `POST` | /billing/checkout | `createCheckoutSession` | Create a Stripe Checkout Session |
| `GET` | /billing/checkout-session/{sessionId} | `getCheckoutSession` | Get a checkout session by ID |
| `GET` | /billing/command/plans | `listCommandBillingPlans` | List Unified Command billing plans |
| `POST` | /billing/command/subscribe | `subscribeCommandPlan` | Subscribe to a Unified Command plan |
| `POST` | /billing/customer-portal | `createCustomerPortal` | Create a Stripe Customer Portal session |
| `GET` | /billing/invoices | `listInvoices` | List invoices |
| `POST` | /billing/metering/check-quota | `billing_post_billing_metering_check_quota` | [stub] Create/invoke /billing/metering/check-quota (billing) |
| `GET` | /billing/metering/cost-allocation | `billing_get_billing_metering_cost_allocation` | [stub] List/get /billing/metering/cost-allocation (billing) |
| `POST` | /billing/metering/cost-allocation | `billing_post_billing_metering_cost_allocation` | [stub] Create/invoke /billing/metering/cost-allocation (billing) |
| `POST` | /billing/metering/invoices/generate | `billing_post_billing_metering_invoices_generate` | [stub] Create/invoke /billing/metering/invoices/generate (billing) |
| `GET` | /billing/metering/line-items | `billing_get_billing_metering_line_items` | [stub] List/get /billing/metering/line-items (billing) |
| `GET` | /billing/metering/margin-analysis | `billing_get_billing_metering_margin_analysis` | [stub] List/get /billing/metering/margin-analysis (billing) |
| `GET` | /billing/metering/quota-violations | `billing_get_billing_metering_quota_violations` | [stub] List/get /billing/metering/quota-violations (billing) |
| `GET` | /billing/metering/quotas | `billing_get_billing_metering_quotas` | [stub] List/get /billing/metering/quotas (billing) |
| `POST` | /billing/metering/quotas | `billing_post_billing_metering_quotas` | [stub] Create/invoke /billing/metering/quotas (billing) |
| `GET` | /billing/plans | `listBillingPlans` | List billing plans |
| `GET` | /billing/plans/{id} | `getBillingPlan` | Get a billing plan by ID |
| `GET` | /billing/products | `listStripeProducts` | List Stripe products with prices |
| `GET` | /billing/revenue-analytics | `getBillingRevenueAnalytics` | Get revenue analytics dashboard data |
| `GET` | /billing/stripe-config | `getStripeConfig` | Get public Stripe configuration (publishable key, mode) |
| `GET` | /billing/stripe-invoices | `listStripeInvoices` | List Stripe invoices |
| `POST` | /billing/stripe/checkout | `billing_post_billing_stripe_checkout` | [stub] Create/invoke /billing/stripe/checkout (billing) |
| `GET` | /billing/subscription-status | `getSubscriptionStatus` | Get subscription status for a customer |
| `GET` | /billing/subscriptions | `listSubscriptions` | List subscriptions |
| `POST` | /billing/sync-plans | `syncBillingPlans` | Sync billing plans from Stripe (admin only) |
| `POST` | /billing/terra/metered-usage | `recordTerraMeteredUsage` | Record metered API usage for Terra |
| `GET` | /billing/terra/plans | `listTerraBillingPlans` | List Terra real estate intelligence billing plans |
| `POST` | /billing/terra/subscribe | `subscribeTerraplan` | Subscribe to a Terra plan |
| `POST` | /billing/update-subscription | `updateSubscription` | Update a Stripe subscription (plan change, quantity) |
| `POST` | /billing/webhooks | `handleStripeWebhook` | Receive and process Stripe webhook events |
| `POST` | /stripe/billing/aegis/enterprise-quote | `billing_post_stripe_billing_aegis_enterprise_quote` | [stub] Create/invoke /stripe/billing/aegis/enterprise-quote (billing) |
| `POST` | /stripe/billing/aegis/invoice | `billing_post_stripe_billing_aegis_invoice` | [stub] Create/invoke /stripe/billing/aegis/invoice (billing) |
| `POST` | /stripe/billing/cancel-subscription | `billing_post_stripe_billing_cancel_subscription` | [stub] Create/invoke /stripe/billing/cancel-subscription (billing) |
| `POST` | /stripe/billing/checkout | `billing_post_stripe_billing_checkout` | [stub] Create/invoke /stripe/billing/checkout (billing) |
| `GET` | /stripe/billing/checkout-session/{sessionId} | `billing_get_stripe_billing_checkout_session_sessionId` | [stub] List/get /stripe/billing/checkout-session/{sessionId} (billing) |
| `GET` | /stripe/billing/command/plans | `billing_get_stripe_billing_command_plans` | [stub] List/get /stripe/billing/command/plans (billing) |
| `POST` | /stripe/billing/command/subscribe | `billing_post_stripe_billing_command_subscribe` | [stub] Create/invoke /stripe/billing/command/subscribe (billing) |
| `POST` | /stripe/billing/customer-portal | `billing_post_stripe_billing_customer_portal` | [stub] Create/invoke /stripe/billing/customer-portal (billing) |
| `GET` | /stripe/billing/invoices | `billing_get_stripe_billing_invoices` | [stub] List/get /stripe/billing/invoices (billing) |
| `GET` | /stripe/billing/plans | `billing_get_stripe_billing_plans` | [stub] List/get /stripe/billing/plans (billing) |
| `GET` | /stripe/billing/plans/{id} | `billing_get_stripe_billing_plans_id` | [stub] List/get /stripe/billing/plans/{id} (billing) |
| `POST` | /stripe/billing/portal-session | `billing_post_stripe_billing_portal_session` | [stub] Create/invoke /stripe/billing/portal-session (billing) |
| `GET` | /stripe/billing/products | `billing_get_stripe_billing_products` | [stub] List/get /stripe/billing/products (billing) |
| `GET` | /stripe/billing/revenue-analytics | `billing_get_stripe_billing_revenue_analytics` | [stub] List/get /stripe/billing/revenue-analytics (billing) |
| `GET` | /stripe/billing/stripe-config | `billing_get_stripe_billing_stripe_config` | [stub] List/get /stripe/billing/stripe-config (billing) |
| `GET` | /stripe/billing/stripe-invoices | `billing_get_stripe_billing_stripe_invoices` | [stub] List/get /stripe/billing/stripe-invoices (billing) |
| `GET` | /stripe/billing/subscription-status | `billing_get_stripe_billing_subscription_status` | [stub] List/get /stripe/billing/subscription-status (billing) |
| `GET` | /stripe/billing/subscriptions | `billing_get_stripe_billing_subscriptions` | [stub] List/get /stripe/billing/subscriptions (billing) |
| `POST` | /stripe/billing/sync-plans | `billing_post_stripe_billing_sync_plans` | [stub] Create/invoke /stripe/billing/sync-plans (billing) |
| `POST` | /stripe/billing/terra/metered-usage | `billing_post_stripe_billing_terra_metered_usage` | [stub] Create/invoke /stripe/billing/terra/metered-usage (billing) |
| `GET` | /stripe/billing/terra/plans | `billing_get_stripe_billing_terra_plans` | [stub] List/get /stripe/billing/terra/plans (billing) |
| `POST` | /stripe/billing/terra/subscribe | `billing_post_stripe_billing_terra_subscribe` | [stub] Create/invoke /stripe/billing/terra/subscribe (billing) |
| `POST` | /stripe/billing/update-subscription | `billing_post_stripe_billing_update_subscription` | [stub] Create/invoke /stripe/billing/update-subscription (billing) |
| `POST` | /stripe/billing/webhooks | `billing_post_stripe_billing_webhooks` | [stub] Create/invoke /stripe/billing/webhooks (billing) |
| `POST` | /stripe/checkout | `createStripeCheckoutDirect` | Create a Stripe Checkout session (direct path alias) |
| `POST` | /stripe/metering/check-quota | `billing_post_stripe_metering_check_quota` | [stub] Create/invoke /stripe/metering/check-quota (billing) |
| `GET` | /stripe/metering/cost-allocation | `billing_get_stripe_metering_cost_allocation` | [stub] List/get /stripe/metering/cost-allocation (billing) |
| `POST` | /stripe/metering/cost-allocation | `billing_post_stripe_metering_cost_allocation` | [stub] Create/invoke /stripe/metering/cost-allocation (billing) |
| `POST` | /stripe/metering/invoices/generate | `billing_post_stripe_metering_invoices_generate` | [stub] Create/invoke /stripe/metering/invoices/generate (billing) |
| `GET` | /stripe/metering/line-items | `billing_get_stripe_metering_line_items` | [stub] List/get /stripe/metering/line-items (billing) |
| `GET` | /stripe/metering/margin-analysis | `billing_get_stripe_metering_margin_analysis` | [stub] List/get /stripe/metering/margin-analysis (billing) |
| `GET` | /stripe/metering/quota-violations | `billing_get_stripe_metering_quota_violations` | [stub] List/get /stripe/metering/quota-violations (billing) |
| `GET` | /stripe/metering/quotas | `billing_get_stripe_metering_quotas` | [stub] List/get /stripe/metering/quotas (billing) |
| `POST` | /stripe/metering/quotas | `billing_post_stripe_metering_quotas` | [stub] Create/invoke /stripe/metering/quotas (billing) |
| `POST` | /stripe/stripe/checkout | `billing_post_stripe_stripe_checkout` | [stub] Create/invoke /stripe/stripe/checkout (billing) |

<a id="feature-flags"></a>

## feature-flags

Feature flag management

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /feature-flags | `listFeatureFlags` | List feature flags |
| `POST` | /feature-flags | `createFeatureFlag` | Create a feature flag |
| `PATCH` | /feature-flags/{id} | `updateFeatureFlag` | Update a feature flag |
| `DELETE` | /feature-flags/{id} | `deleteFeatureFlag` | Delete a feature flag |
| `GET` | /feature-flags/feature-flags | `feature_flags_get_feature_flags_feature_flags` | [stub] List/get /feature-flags/feature-flags (feature-flags) |
| `POST` | /feature-flags/feature-flags | `feature_flags_post_feature_flags_feature_flags` | [stub] Create/invoke /feature-flags/feature-flags (feature-flags) |
| `PATCH` | /feature-flags/feature-flags/{id} | `feature_flags_patch_feature_flags_feature_flags_id` | [stub] Patch /feature-flags/feature-flags/{id} (feature-flags) |
| `DELETE` | /feature-flags/feature-flags/{id} | `feature_flags_delete_feature_flags_feature_flags_id` | [stub] Delete /feature-flags/feature-flags/{id} (feature-flags) |
| `GET` | /feature-flags/feature-flags/{id}/overrides | `feature_flags_get_feature_flags_feature_flags_id_overrides` | [stub] List/get /feature-flags/feature-flags/{id}/overrides (feature-flags) |
| `POST` | /feature-flags/feature-flags/{id}/overrides | `feature_flags_post_feature_flags_feature_flags_id_overrides` | [stub] Create/invoke /feature-flags/feature-flags/{id}/overrides (feature-flags) |
| `DELETE` | /feature-flags/feature-flags/{id}/overrides/{overrideId} | `feature_flags_delete_feature_flags_feature_flags_id_overrides_overrideId` | [stub] Delete /feature-flags/feature-flags/{id}/overrides/{overrideId} (feature-flags) |
| `GET` | /feature-flags/feature-flags/check/{key} | `feature_flags_get_feature_flags_feature_flags_check_key` | [stub] List/get /feature-flags/feature-flags/check/{key} (feature-flags) |
| `POST` | /feature-flags/feature-flags/evaluate | `feature_flags_post_feature_flags_feature_flags_evaluate` | [stub] Create/invoke /feature-flags/feature-flags/evaluate (feature-flags) |
| `GET` | /feature-flags/feature-flags/platform | `feature_flags_get_feature_flags_feature_flags_platform` | [stub] List/get /feature-flags/feature-flags/platform (feature-flags) |

<a id="files"></a>

## files

File and asset management

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /assets | `listAssets` | List assets |
| `GET` | /assets/assets | `files_get_assets_assets` | [stub] List/get /assets/assets (files) |
| `GET` | /assets/files | `files_get_assets_files` | [stub] List/get /assets/files (files) |
| `POST` | /assets/files | `files_post_assets_files` | [stub] Create/invoke /assets/files (files) |
| `GET` | /assets/files/{id} | `files_get_assets_files_id` | [stub] List/get /assets/files/{id} (files) |
| `DELETE` | /assets/files/{id} | `files_delete_assets_files_id` | [stub] Delete /assets/files/{id} (files) |
| `GET` | /files | `listFiles` | List files |
| `GET` | /files/{id} | `getFile` | Get a file by ID |
| `GET` | /files/assets | `files_get_files_assets` | [stub] List/get /files/assets (files) |
| `GET` | /files/files | `files_get_files_files` | [stub] List/get /files/files (files) |
| `POST` | /files/files | `files_post_files_files` | [stub] Create/invoke /files/files (files) |
| `GET` | /files/files/{id} | `files_get_files_files_id` | [stub] List/get /files/files/{id} (files) |
| `DELETE` | /files/files/{id} | `files_delete_files_files_id` | [stub] Delete /files/files/{id} (files) |

<a id="storage"></a>

## Storage

Object storage upload and serving endpoints.

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /storage/objects/{objectPath} | `getStorageObject` | Serve an object entity from PRIVATE_OBJECT_DIR |
| `GET` | /storage/public-objects/{filePath} | `getPublicObject` | Serve a public asset from PUBLIC_OBJECT_SEARCH_PATHS |
| `POST` | /storage/uploads/request-url | `requestUploadUrl` | Request a presigned URL for file upload |

<a id="stephen"></a>

## stephen

Stephen L. portfolio site

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /stephen/booking-requests | `listStephenBookingRequests` | List booking requests |
| `POST` | /stephen/booking-requests | `createStephenBookingRequest` | Submit a booking request |
| `GET` | /stephen/case-studies | `listStephenCaseStudies` | List case studies |
| `GET` | /stephen/contacts | `listStephenContacts` | List contact submissions |
| `POST` | /stephen/contacts | `createStephenContact` | Submit a contact form |
| `GET` | /stephen/content-blocks | `listStephenContentBlocks` | List all content blocks |
| `POST` | /stephen/content-blocks | `createStephenContentBlock` | Create a content block |
| `PATCH` | /stephen/content-blocks/{id} | `updateStephenContentBlock` | Update a content block |
| `DELETE` | /stephen/content-blocks/{id} | `deleteStephenContentBlock` | Delete a content block |
| `GET` | /stephen/ecosystem-status | `getStephenEcosystemStatus` | Get ecosystem status |
| `GET` | /stephen/portfolio-case-studies | `listStephenPortfolioCaseStudies` | List portfolio case studies |
| `POST` | /stephen/portfolio-case-studies | `createStephenPortfolioCaseStudy` | Create a portfolio case study |
| `GET` | /stephen/portfolio-case-studies/{slug} | `getStephenPortfolioCaseStudy` | Get a portfolio case study by slug |
| `PATCH` | /stephen/portfolio-case-studies/{slug} | `updateStephenPortfolioCaseStudy` | Update a portfolio case study |
| `DELETE` | /stephen/portfolio-case-studies/{slug} | `deleteStephenPortfolioCaseStudy` | Delete a portfolio case study |
| `GET` | /stephen/profile | `getStephenProfile` | Get Stephen's profile data |
| `GET` | /stephen/stephen/booking-requests | `stephen_get_stephen_stephen_booking_requests` | [stub] List/get /stephen/stephen/booking-requests (stephen) |
| `POST` | /stephen/stephen/booking-requests | `stephen_post_stephen_stephen_booking_requests` | [stub] Create/invoke /stephen/stephen/booking-requests (stephen) |
| `PATCH` | /stephen/stephen/booking-requests/{id} | `stephen_patch_stephen_stephen_booking_requests_id` | [stub] Patch /stephen/stephen/booking-requests/{id} (stephen) |
| `GET` | /stephen/stephen/case-studies | `stephen_get_stephen_stephen_case_studies` | [stub] List/get /stephen/stephen/case-studies (stephen) |
| `GET` | /stephen/stephen/case-studies/{slug} | `stephen_get_stephen_stephen_case_studies_slug` | [stub] List/get /stephen/stephen/case-studies/{slug} (stephen) |
| `GET` | /stephen/stephen/contacts | `stephen_get_stephen_stephen_contacts` | [stub] List/get /stephen/stephen/contacts (stephen) |
| `POST` | /stephen/stephen/contacts | `stephen_post_stephen_stephen_contacts` | [stub] Create/invoke /stephen/stephen/contacts (stephen) |
| `GET` | /stephen/stephen/content-blocks | `stephen_get_stephen_stephen_content_blocks` | [stub] List/get /stephen/stephen/content-blocks (stephen) |
| `POST` | /stephen/stephen/content-blocks | `stephen_post_stephen_stephen_content_blocks` | [stub] Create/invoke /stephen/stephen/content-blocks (stephen) |
| `PATCH` | /stephen/stephen/content-blocks/{id} | `stephen_patch_stephen_stephen_content_blocks_id` | [stub] Patch /stephen/stephen/content-blocks/{id} (stephen) |
| `DELETE` | /stephen/stephen/content-blocks/{id} | `stephen_delete_stephen_stephen_content_blocks_id` | [stub] Delete /stephen/stephen/content-blocks/{id} (stephen) |
| `POST` | /stephen/stephen/design-partner-intake | `stephen_post_stephen_stephen_design_partner_intake` | [stub] Create/invoke /stephen/stephen/design-partner-intake (stephen) |
| `GET` | /stephen/stephen/ecosystem-status | `stephen_get_stephen_stephen_ecosystem_status` | [stub] List/get /stephen/stephen/ecosystem-status (stephen) |
| `GET` | /stephen/stephen/portfolio-case-studies | `stephen_get_stephen_stephen_portfolio_case_studies` | [stub] List/get /stephen/stephen/portfolio-case-studies (stephen) |
| `POST` | /stephen/stephen/portfolio-case-studies | `stephen_post_stephen_stephen_portfolio_case_studies` | [stub] Create/invoke /stephen/stephen/portfolio-case-studies (stephen) |
| `GET` | /stephen/stephen/portfolio-case-studies/{slug} | `stephen_get_stephen_stephen_portfolio_case_studies_slug` | [stub] List/get /stephen/stephen/portfolio-case-studies/{slug} (stephen) |
| `PATCH` | /stephen/stephen/portfolio-case-studies/{slug} | `stephen_patch_stephen_stephen_portfolio_case_studies_slug` | [stub] Patch /stephen/stephen/portfolio-case-studies/{slug} (stephen) |
| `DELETE` | /stephen/stephen/portfolio-case-studies/{slug} | `stephen_delete_stephen_stephen_portfolio_case_studies_slug` | [stub] Delete /stephen/stephen/portfolio-case-studies/{slug} (stephen) |
| `GET` | /stephen/stephen/profile | `stephen_get_stephen_stephen_profile` | [stub] List/get /stephen/stephen/profile (stephen) |
| `GET` | /stephen/stephen/testimonials | `stephen_get_stephen_stephen_testimonials` | [stub] List/get /stephen/stephen/testimonials (stephen) |
| `GET` | /stephen/testimonials | `listStephenTestimonials` | List testimonials |

<a id="vessels"></a>

## vessels

Vessel tracking and cargo management

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /vessels | `listVessels` | List all vessels |
| `POST` | /vessels | `createVessel` | Add a new vessel |
| `GET` | /vessels/{id} | `getVessel` | Get vessel details |
| `PUT` | /vessels/{id} | `updateVessel` | Update a vessel |
| `DELETE` | /vessels/{id} | `deleteVessel` | Remove a vessel |
| `GET` | /vessels/{id}/cargo | `getVesselCargo` | Get cargo manifest for a vessel |
| `GET` | /vessels/{id}/events | `getVesselEvents` | Get events for a specific vessel |
| `GET` | /vessels/{id}/positions | `getVesselPositions` | Get position history for a vessel |
| `GET` | /vessels/{id}/routes | `getVesselRoutes` | Get planned routes for a specific vessel |
| `POST` | /vessels/alert-rules | `createVesselAlertRule` | Create a vessel alert rule |
| `PUT` | /vessels/alert-rules/{id} | `updateVesselAlertRule` | Update a vessel alert rule |
| `DELETE` | /vessels/alert-rules/{id} | `deleteVesselAlertRule` | Delete a vessel alert rule |
| `GET` | /vessels/alert-rules/all | `listVesselAlertRules` | List all vessel alert rules |
| `POST` | /vessels/alerts | `createVesselAlert` | Create a vessel alert |
| `DELETE` | /vessels/alerts/{id} | `deleteVesselAlert` | Dismiss a vessel alert |
| `GET` | /vessels/alerts/all | `listVesselAlerts` | List all active vessel alerts |
| `GET` | /vessels/command-workflows | `listVesselCommandWorkflows` | List vessel command workflows |
| `POST` | /vessels/command-workflows | `createVesselCommandWorkflow` | Create a vessel command workflow |
| `PATCH` | /vessels/command-workflows/{id} | `updateVesselCommandWorkflow` | Update a vessel command workflow status |
| `GET` | /vessels/events | `listVesselEvents` | List all vessel events |
| `POST` | /vessels/events | `createVesselEvent` | Record a new vessel event |
| `PATCH` | /vessels/events/{id} | `updateVesselEvent` | Update a vessel event |
| `GET` | /vessels/fleets | `listVesselFleets` | List all fleets |
| `POST` | /vessels/fleets | `createVesselFleet` | Create a new fleet |
| `GET` | /vessels/fleets/{id} | `getVesselFleet` | Get a fleet by ID |
| `PUT` | /vessels/fleets/{id} | `updateVesselFleet` | Update a fleet |
| `DELETE` | /vessels/fleets/{id} | `deleteVesselFleet` | Delete a fleet |
| `GET` | /vessels/live/chokepoints | `getVesselLiveChokepoints` | Get real-time maritime chokepoint status |
| `GET` | /vessels/live/geopolitical-events | `getVesselLiveGeopoliticalEvents` | Get active geopolitical events affecting maritime routes |
| `GET` | /vessels/live/port-congestion | `getVesselLivePortCongestion` | Get real-time port congestion data |
| `GET` | /vessels/live/weather-marine | `getVesselLiveMarineWeather` | Get live marine weather for a region |
| `POST` | /vessels/routes | `createVesselRoute` | Create a new vessel route |
| `PUT` | /vessels/routes/{id} | `updateVesselRoute` | Update a vessel route |
| `DELETE` | /vessels/routes/{id} | `deleteVesselRoute` | Delete a vessel route |
| `GET` | /vessels/routes/all | `listAllVesselRoutes` | List all planned vessel routes |
| `POST` | /vessels/simulations | `createVesselSimulation` | Run a route simulation |
| `GET` | /vessels/simulations/{id} | `getVesselSimulation` | Get a route simulation result |
| `GET` | /vessels/simulations/all | `listVesselSimulations` | List all route simulations |
| `GET` | /vessels/vessels | `vessels_get_vessels_vessels` | [stub] List/get /vessels/vessels (vessels) |
| `POST` | /vessels/vessels | `vessels_post_vessels_vessels` | [stub] Create/invoke /vessels/vessels (vessels) |
| `GET` | /vessels/vessels/{id} | `vessels_get_vessels_vessels_id` | [stub] List/get /vessels/vessels/{id} (vessels) |
| `PUT` | /vessels/vessels/{id} | `vessels_put_vessels_vessels_id` | [stub] Update /vessels/vessels/{id} (vessels) |
| `DELETE` | /vessels/vessels/{id} | `vessels_delete_vessels_vessels_id` | [stub] Delete /vessels/vessels/{id} (vessels) |
| `GET` | /vessels/vessels/{id}/cargo | `vessels_get_vessels_vessels_id_cargo` | [stub] List/get /vessels/vessels/{id}/cargo (vessels) |
| `GET` | /vessels/vessels/{id}/events | `vessels_get_vessels_vessels_id_events` | [stub] List/get /vessels/vessels/{id}/events (vessels) |
| `GET` | /vessels/vessels/{id}/positions | `vessels_get_vessels_vessels_id_positions` | [stub] List/get /vessels/vessels/{id}/positions (vessels) |
| `GET` | /vessels/vessels/{id}/route | `vessels_get_vessels_vessels_id_route` | [stub] List/get /vessels/vessels/{id}/route (vessels) |
| `GET` | /vessels/vessels/{id}/routes | `vessels_get_vessels_vessels_id_routes` | [stub] List/get /vessels/vessels/{id}/routes (vessels) |
| `POST` | /vessels/vessels/alert-rules | `vessels_post_vessels_vessels_alert_rules` | [stub] Create/invoke /vessels/vessels/alert-rules (vessels) |
| `PUT` | /vessels/vessels/alert-rules/{id} | `vessels_put_vessels_vessels_alert_rules_id` | [stub] Update /vessels/vessels/alert-rules/{id} (vessels) |
| `DELETE` | /vessels/vessels/alert-rules/{id} | `vessels_delete_vessels_vessels_alert_rules_id` | [stub] Delete /vessels/vessels/alert-rules/{id} (vessels) |
| `GET` | /vessels/vessels/alert-rules/all | `vessels_get_vessels_vessels_alert_rules_all` | [stub] List/get /vessels/vessels/alert-rules/all (vessels) |
| `POST` | /vessels/vessels/alerts | `vessels_post_vessels_vessels_alerts` | [stub] Create/invoke /vessels/vessels/alerts (vessels) |
| `DELETE` | /vessels/vessels/alerts/{id} | `vessels_delete_vessels_vessels_alerts_id` | [stub] Delete /vessels/vessels/alerts/{id} (vessels) |
| `GET` | /vessels/vessels/alerts/all | `vessels_get_vessels_vessels_alerts_all` | [stub] List/get /vessels/vessels/alerts/all (vessels) |
| `GET` | /vessels/vessels/command-workflows | `vessels_get_vessels_vessels_command_workflows` | [stub] List/get /vessels/vessels/command-workflows (vessels) |
| `POST` | /vessels/vessels/command-workflows | `vessels_post_vessels_vessels_command_workflows` | [stub] Create/invoke /vessels/vessels/command-workflows (vessels) |
| `PATCH` | /vessels/vessels/command-workflows/{id} | `vessels_patch_vessels_vessels_command_workflows_id` | [stub] Patch /vessels/vessels/command-workflows/{id} (vessels) |
| `GET` | /vessels/vessels/events | `vessels_get_vessels_vessels_events` | [stub] List/get /vessels/vessels/events (vessels) |
| `POST` | /vessels/vessels/events | `vessels_post_vessels_vessels_events` | [stub] Create/invoke /vessels/vessels/events (vessels) |
| `PATCH` | /vessels/vessels/events/{id} | `vessels_patch_vessels_vessels_events_id` | [stub] Patch /vessels/vessels/events/{id} (vessels) |
| `GET` | /vessels/vessels/fleets | `vessels_get_vessels_vessels_fleets` | [stub] List/get /vessels/vessels/fleets (vessels) |
| `POST` | /vessels/vessels/fleets | `vessels_post_vessels_vessels_fleets` | [stub] Create/invoke /vessels/vessels/fleets (vessels) |
| `GET` | /vessels/vessels/fleets/{id} | `vessels_get_vessels_vessels_fleets_id` | [stub] List/get /vessels/vessels/fleets/{id} (vessels) |
| `PUT` | /vessels/vessels/fleets/{id} | `vessels_put_vessels_vessels_fleets_id` | [stub] Update /vessels/vessels/fleets/{id} (vessels) |
| `DELETE` | /vessels/vessels/fleets/{id} | `vessels_delete_vessels_vessels_fleets_id` | [stub] Delete /vessels/vessels/fleets/{id} (vessels) |
| `GET` | /vessels/vessels/live/chokepoints | `vessels_get_vessels_vessels_live_chokepoints` | [stub] List/get /vessels/vessels/live/chokepoints (vessels) |
| `GET` | /vessels/vessels/live/geopolitical-events | `vessels_get_vessels_vessels_live_geopolitical_events` | [stub] List/get /vessels/vessels/live/geopolitical-events (vessels) |
| `GET` | /vessels/vessels/live/port-congestion | `vessels_get_vessels_vessels_live_port_congestion` | [stub] List/get /vessels/vessels/live/port-congestion (vessels) |
| `GET` | /vessels/vessels/live/weather-marine | `vessels_get_vessels_vessels_live_weather_marine` | [stub] List/get /vessels/vessels/live/weather-marine (vessels) |
| `POST` | /vessels/vessels/routes | `vessels_post_vessels_vessels_routes` | [stub] Create/invoke /vessels/vessels/routes (vessels) |
| `PUT` | /vessels/vessels/routes/{id} | `vessels_put_vessels_vessels_routes_id` | [stub] Update /vessels/vessels/routes/{id} (vessels) |
| `DELETE` | /vessels/vessels/routes/{id} | `vessels_delete_vessels_vessels_routes_id` | [stub] Delete /vessels/vessels/routes/{id} (vessels) |
| `GET` | /vessels/vessels/routes/all | `vessels_get_vessels_vessels_routes_all` | [stub] List/get /vessels/vessels/routes/all (vessels) |
| `POST` | /vessels/vessels/simulations | `vessels_post_vessels_vessels_simulations` | [stub] Create/invoke /vessels/vessels/simulations (vessels) |
| `GET` | /vessels/vessels/simulations/{id} | `vessels_get_vessels_vessels_simulations_id` | [stub] List/get /vessels/vessels/simulations/{id} (vessels) |
| `GET` | /vessels/vessels/simulations/all | `vessels_get_vessels_vessels_simulations_all` | [stub] List/get /vessels/vessels/simulations/all (vessels) |
| `GET` | /vessels/vessels/weather/snapshots | `vessels_get_vessels_vessels_weather_snapshots` | [stub] List/get /vessels/vessels/weather/snapshots (vessels) |
| `GET` | /vessels/weather/snapshots | `getVesselWeatherSnapshots` | Get weather snapshots for vessel locations |

<a id="firestorm"></a>

## firestorm

Campaign and lead management

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /firestorm/analytics | `listFirestormAnalytics` | List campaign analytics |
| `GET` | /firestorm/campaigns | `listFirestormCampaigns` | List campaigns |
| `GET` | /firestorm/leads | `listFirestormLeads` | List leads |

<a id="lyte"></a>

## lyte

E-commerce products and orders

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /lyte/lyte/actions | `lyte_get_lyte_lyte_actions` | [stub] List/get /lyte/lyte/actions (lyte) |
| `POST` | /lyte/lyte/actions | `lyte_post_lyte_lyte_actions` | [stub] Create/invoke /lyte/lyte/actions (lyte) |
| `PATCH` | /lyte/lyte/actions/{id} | `lyte_patch_lyte_lyte_actions_id` | [stub] Patch /lyte/lyte/actions/{id} (lyte) |
| `GET` | /lyte/lyte/command-cards | `lyte_get_lyte_lyte_command_cards` | [stub] List/get /lyte/lyte/command-cards (lyte) |
| `POST` | /lyte/lyte/command-cards | `lyte_post_lyte_lyte_command_cards` | [stub] Create/invoke /lyte/lyte/command-cards (lyte) |
| `PATCH` | /lyte/lyte/command-cards/{id} | `lyte_patch_lyte_lyte_command_cards_id` | [stub] Patch /lyte/lyte/command-cards/{id} (lyte) |
| `DELETE` | /lyte/lyte/command-cards/{id} | `lyte_delete_lyte_lyte_command_cards_id` | [stub] Delete /lyte/lyte/command-cards/{id} (lyte) |
| `GET` | /lyte/lyte/executive-summary | `lyte_get_lyte_lyte_executive_summary` | [stub] List/get /lyte/lyte/executive-summary (lyte) |
| `GET` | /lyte/lyte/governance-posture | `lyte_get_lyte_lyte_governance_posture` | [stub] List/get /lyte/lyte/governance-posture (lyte) |
| `GET` | /lyte/lyte/incidents | `lyte_get_lyte_lyte_incidents` | [stub] List/get /lyte/lyte/incidents (lyte) |
| `POST` | /lyte/lyte/incidents | `lyte_post_lyte_lyte_incidents` | [stub] Create/invoke /lyte/lyte/incidents (lyte) |
| `PATCH` | /lyte/lyte/incidents/{id} | `lyte_patch_lyte_lyte_incidents_id` | [stub] Patch /lyte/lyte/incidents/{id} (lyte) |
| `DELETE` | /lyte/lyte/incidents/{id} | `lyte_delete_lyte_lyte_incidents_id` | [stub] Delete /lyte/lyte/incidents/{id} (lyte) |
| `GET` | /lyte/lyte/interventions | `lyte_get_lyte_lyte_interventions` | [stub] List/get /lyte/lyte/interventions (lyte) |
| `POST` | /lyte/lyte/interventions | `lyte_post_lyte_lyte_interventions` | [stub] Create/invoke /lyte/lyte/interventions (lyte) |
| `GET` | /lyte/lyte/live/bls-employment | `lyte_get_lyte_lyte_live_bls_employment` | [stub] List/get /lyte/lyte/live/bls-employment (lyte) |
| `GET` | /lyte/lyte/live/github-trending | `lyte_get_lyte_lyte_live_github_trending` | [stub] List/get /lyte/lyte/live/github-trending (lyte) |
| `GET` | /lyte/lyte/live/tech-news | `lyte_get_lyte_lyte_live_tech_news` | [stub] List/get /lyte/lyte/live/tech-news (lyte) |
| `GET` | /lyte/lyte/playbooks | `lyte_get_lyte_lyte_playbooks` | [stub] List/get /lyte/lyte/playbooks (lyte) |
| `POST` | /lyte/lyte/playbooks | `lyte_post_lyte_lyte_playbooks` | [stub] Create/invoke /lyte/lyte/playbooks (lyte) |
| `GET` | /lyte/lyte/playbooks/{id} | `lyte_get_lyte_lyte_playbooks_id` | [stub] List/get /lyte/lyte/playbooks/{id} (lyte) |
| `PATCH` | /lyte/lyte/playbooks/{id} | `lyte_patch_lyte_lyte_playbooks_id` | [stub] Patch /lyte/lyte/playbooks/{id} (lyte) |
| `DELETE` | /lyte/lyte/playbooks/{id} | `lyte_delete_lyte_lyte_playbooks_id` | [stub] Delete /lyte/lyte/playbooks/{id} (lyte) |
| `GET` | /lyte/lyte/readiness | `lyte_get_lyte_lyte_readiness` | [stub] List/get /lyte/lyte/readiness (lyte) |
| `POST` | /lyte/lyte/readiness | `lyte_post_lyte_lyte_readiness` | [stub] Create/invoke /lyte/lyte/readiness (lyte) |
| `PATCH` | /lyte/lyte/readiness/{id} | `lyte_patch_lyte_lyte_readiness_id` | [stub] Patch /lyte/lyte/readiness/{id} (lyte) |
| `GET` | /lyte/lyte/recommendations | `lyte_get_lyte_lyte_recommendations` | [stub] List/get /lyte/lyte/recommendations (lyte) |
| `POST` | /lyte/lyte/recommendations | `lyte_post_lyte_lyte_recommendations` | [stub] Create/invoke /lyte/lyte/recommendations (lyte) |
| `PATCH` | /lyte/lyte/recommendations/{id} | `lyte_patch_lyte_lyte_recommendations_id` | [stub] Patch /lyte/lyte/recommendations/{id} (lyte) |
| `DELETE` | /lyte/lyte/recommendations/{id} | `lyte_delete_lyte_lyte_recommendations_id` | [stub] Delete /lyte/lyte/recommendations/{id} (lyte) |
| `GET` | /lyte/lyte/signals | `lyte_get_lyte_lyte_signals` | [stub] List/get /lyte/lyte/signals (lyte) |
| `POST` | /lyte/lyte/signals | `lyte_post_lyte_lyte_signals` | [stub] Create/invoke /lyte/lyte/signals (lyte) |
| `PATCH` | /lyte/lyte/signals/{id} | `lyte_patch_lyte_lyte_signals_id` | [stub] Patch /lyte/lyte/signals/{id} (lyte) |
| `DELETE` | /lyte/lyte/signals/{id} | `lyte_delete_lyte_lyte_signals_id` | [stub] Delete /lyte/lyte/signals/{id} (lyte) |
| `GET` | /lyte/lyte/views | `lyte_get_lyte_lyte_views` | [stub] List/get /lyte/lyte/views (lyte) |
| `POST` | /lyte/lyte/views | `lyte_post_lyte_lyte_views` | [stub] Create/invoke /lyte/lyte/views (lyte) |
| `PATCH` | /lyte/lyte/views/{id} | `lyte_patch_lyte_lyte_views_id` | [stub] Patch /lyte/lyte/views/{id} (lyte) |
| `DELETE` | /lyte/lyte/views/{id} | `lyte_delete_lyte_lyte_views_id` | [stub] Delete /lyte/lyte/views/{id} (lyte) |
| `GET` | /lyte/lyte/workspaces | `lyte_get_lyte_lyte_workspaces` | [stub] List/get /lyte/lyte/workspaces (lyte) |
| `POST` | /lyte/lyte/workspaces | `lyte_post_lyte_lyte_workspaces` | [stub] Create/invoke /lyte/lyte/workspaces (lyte) |
| `GET` | /lyte/lyte/workspaces/{id} | `lyte_get_lyte_lyte_workspaces_id` | [stub] List/get /lyte/lyte/workspaces/{id} (lyte) |
| `GET` | /lyte/orders | `listLyteOrders` | List orders |
| `GET` | /lyte/products | `listLyteProducts` | List products |

<a id="dreamscape"></a>

## dreamscape

Creative project management

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `POST` | /dreamscape/dreamscape/campaign-assets | `dreamscape_post_dreamscape_dreamscape_campaign_assets` | [stub] Create/invoke /dreamscape/dreamscape/campaign-assets (dreamscape) |
| `DELETE` | /dreamscape/dreamscape/campaign-assets/{id} | `dreamscape_delete_dreamscape_dreamscape_campaign_assets_id` | [stub] Delete /dreamscape/dreamscape/campaign-assets/{id} (dreamscape) |
| `GET` | /dreamscape/dreamscape/campaigns | `dreamscape_get_dreamscape_dreamscape_campaigns` | [stub] List/get /dreamscape/dreamscape/campaigns (dreamscape) |
| `POST` | /dreamscape/dreamscape/campaigns | `dreamscape_post_dreamscape_dreamscape_campaigns` | [stub] Create/invoke /dreamscape/dreamscape/campaigns (dreamscape) |
| `GET` | /dreamscape/dreamscape/campaigns/{id} | `dreamscape_get_dreamscape_dreamscape_campaigns_id` | [stub] List/get /dreamscape/dreamscape/campaigns/{id} (dreamscape) |
| `PATCH` | /dreamscape/dreamscape/campaigns/{id} | `dreamscape_patch_dreamscape_dreamscape_campaigns_id` | [stub] Patch /dreamscape/dreamscape/campaigns/{id} (dreamscape) |
| `DELETE` | /dreamscape/dreamscape/campaigns/{id} | `dreamscape_delete_dreamscape_dreamscape_campaigns_id` | [stub] Delete /dreamscape/dreamscape/campaigns/{id} (dreamscape) |
| `GET` | /dreamscape/dreamscape/campaigns/{id}/assets | `dreamscape_get_dreamscape_dreamscape_campaigns_id_assets` | [stub] List/get /dreamscape/dreamscape/campaigns/{id}/assets (dreamscape) |
| `GET` | /dreamscape/dreamscape/campaigns/{id}/reviews | `dreamscape_get_dreamscape_dreamscape_campaigns_id_reviews` | [stub] List/get /dreamscape/dreamscape/campaigns/{id}/reviews (dreamscape) |
| `GET` | /dreamscape/dreamscape/campaigns/{id}/scripts | `dreamscape_get_dreamscape_dreamscape_campaigns_id_scripts` | [stub] List/get /dreamscape/dreamscape/campaigns/{id}/scripts (dreamscape) |
| `GET` | /dreamscape/dreamscape/campaigns/{id}/storyboards | `dreamscape_get_dreamscape_dreamscape_campaigns_id_storyboards` | [stub] List/get /dreamscape/dreamscape/campaigns/{id}/storyboards (dreamscape) |
| `GET` | /dreamscape/dreamscape/campaigns/{id}/voice-assets | `dreamscape_get_dreamscape_dreamscape_campaigns_id_voice_assets` | [stub] List/get /dreamscape/dreamscape/campaigns/{id}/voice-assets (dreamscape) |
| `GET` | /dreamscape/dreamscape/live/ai-creative-tools | `dreamscape_get_dreamscape_dreamscape_live_ai_creative_tools` | [stub] List/get /dreamscape/dreamscape/live/ai-creative-tools (dreamscape) |
| `GET` | /dreamscape/dreamscape/live/creative-trends | `dreamscape_get_dreamscape_dreamscape_live_creative_trends` | [stub] List/get /dreamscape/dreamscape/live/creative-trends (dreamscape) |
| `GET` | /dreamscape/dreamscape/live/media-signals | `dreamscape_get_dreamscape_dreamscape_live_media_signals` | [stub] List/get /dreamscape/dreamscape/live/media-signals (dreamscape) |
| `POST` | /dreamscape/dreamscape/reviews | `dreamscape_post_dreamscape_dreamscape_reviews` | [stub] Create/invoke /dreamscape/dreamscape/reviews (dreamscape) |
| `PATCH` | /dreamscape/dreamscape/reviews/{id} | `dreamscape_patch_dreamscape_dreamscape_reviews_id` | [stub] Patch /dreamscape/dreamscape/reviews/{id} (dreamscape) |
| `DELETE` | /dreamscape/dreamscape/reviews/{id} | `dreamscape_delete_dreamscape_dreamscape_reviews_id` | [stub] Delete /dreamscape/dreamscape/reviews/{id} (dreamscape) |
| `POST` | /dreamscape/dreamscape/scripts | `dreamscape_post_dreamscape_dreamscape_scripts` | [stub] Create/invoke /dreamscape/dreamscape/scripts (dreamscape) |
| `GET` | /dreamscape/dreamscape/scripts/{id} | `dreamscape_get_dreamscape_dreamscape_scripts_id` | [stub] List/get /dreamscape/dreamscape/scripts/{id} (dreamscape) |
| `PATCH` | /dreamscape/dreamscape/scripts/{id} | `dreamscape_patch_dreamscape_dreamscape_scripts_id` | [stub] Patch /dreamscape/dreamscape/scripts/{id} (dreamscape) |
| `DELETE` | /dreamscape/dreamscape/scripts/{id} | `dreamscape_delete_dreamscape_dreamscape_scripts_id` | [stub] Delete /dreamscape/dreamscape/scripts/{id} (dreamscape) |
| `POST` | /dreamscape/dreamscape/storyboards | `dreamscape_post_dreamscape_dreamscape_storyboards` | [stub] Create/invoke /dreamscape/dreamscape/storyboards (dreamscape) |
| `PATCH` | /dreamscape/dreamscape/storyboards/{id} | `dreamscape_patch_dreamscape_dreamscape_storyboards_id` | [stub] Patch /dreamscape/dreamscape/storyboards/{id} (dreamscape) |
| `DELETE` | /dreamscape/dreamscape/storyboards/{id} | `dreamscape_delete_dreamscape_dreamscape_storyboards_id` | [stub] Delete /dreamscape/dreamscape/storyboards/{id} (dreamscape) |
| `POST` | /dreamscape/dreamscape/voice-assets | `dreamscape_post_dreamscape_dreamscape_voice_assets` | [stub] Create/invoke /dreamscape/dreamscape/voice-assets (dreamscape) |
| `PATCH` | /dreamscape/dreamscape/voice-assets/{id} | `dreamscape_patch_dreamscape_dreamscape_voice_assets_id` | [stub] Patch /dreamscape/dreamscape/voice-assets/{id} (dreamscape) |
| `DELETE` | /dreamscape/dreamscape/voice-assets/{id} | `dreamscape_delete_dreamscape_dreamscape_voice_assets_id` | [stub] Delete /dreamscape/dreamscape/voice-assets/{id} (dreamscape) |
| `GET` | /dreamscape/projects | `listDreamscapeProjects` | List creative projects |

<a id="readiness"></a>

## readiness

Readiness assessments and compliance

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /readiness/assessments | `listReadinessAssessments` | List readiness assessments |
| `POST` | /readiness/readiness/alerts | `readiness_post_readiness_readiness_alerts` | [stub] Create/invoke /readiness/readiness/alerts (readiness) |
| `PATCH` | /readiness/readiness/alerts/{id} | `readiness_patch_readiness_readiness_alerts_id` | [stub] Patch /readiness/readiness/alerts/{id} (readiness) |
| `DELETE` | /readiness/readiness/alerts/{id} | `readiness_delete_readiness_readiness_alerts_id` | [stub] Delete /readiness/readiness/alerts/{id} (readiness) |
| `POST` | /readiness/readiness/dimensions | `readiness_post_readiness_readiness_dimensions` | [stub] Create/invoke /readiness/readiness/dimensions (readiness) |
| `PATCH` | /readiness/readiness/dimensions/{id} | `readiness_patch_readiness_readiness_dimensions_id` | [stub] Patch /readiness/readiness/dimensions/{id} (readiness) |
| `DELETE` | /readiness/readiness/dimensions/{id} | `readiness_delete_readiness_readiness_dimensions_id` | [stub] Delete /readiness/readiness/dimensions/{id} (readiness) |
| `GET` | /readiness/readiness/dimensions/{id}/scores | `readiness_get_readiness_readiness_dimensions_id_scores` | [stub] List/get /readiness/readiness/dimensions/{id}/scores (readiness) |
| `GET` | /readiness/readiness/executive-rollup | `readiness_get_readiness_readiness_executive_rollup` | [stub] List/get /readiness/readiness/executive-rollup (readiness) |
| `GET` | /readiness/readiness/live/audit-findings | `readiness_get_readiness_readiness_live_audit_findings` | [stub] List/get /readiness/readiness/live/audit-findings (readiness) |
| `GET` | /readiness/readiness/live/controls | `readiness_get_readiness_readiness_live_controls` | [stub] List/get /readiness/readiness/live/controls (readiness) |
| `GET` | /readiness/readiness/live/framework-mappings | `readiness_get_readiness_readiness_live_framework_mappings` | [stub] List/get /readiness/readiness/live/framework-mappings (readiness) |
| `GET` | /readiness/readiness/live/nist-framework | `readiness_get_readiness_readiness_live_nist_framework` | [stub] List/get /readiness/readiness/live/nist-framework (readiness) |
| `GET` | /readiness/readiness/live/risk-posture | `readiness_get_readiness_readiness_live_risk_posture` | [stub] List/get /readiness/readiness/live/risk-posture (readiness) |
| `POST` | /readiness/readiness/milestones | `readiness_post_readiness_readiness_milestones` | [stub] Create/invoke /readiness/readiness/milestones (readiness) |
| `PATCH` | /readiness/readiness/milestones/{id} | `readiness_patch_readiness_readiness_milestones_id` | [stub] Patch /readiness/readiness/milestones/{id} (readiness) |
| `DELETE` | /readiness/readiness/milestones/{id} | `readiness_delete_readiness_readiness_milestones_id` | [stub] Delete /readiness/readiness/milestones/{id} (readiness) |
| `GET` | /readiness/readiness/programs | `readiness_get_readiness_readiness_programs` | [stub] List/get /readiness/readiness/programs (readiness) |
| `POST` | /readiness/readiness/programs | `readiness_post_readiness_readiness_programs` | [stub] Create/invoke /readiness/readiness/programs (readiness) |
| `GET` | /readiness/readiness/programs/{id} | `readiness_get_readiness_readiness_programs_id` | [stub] List/get /readiness/readiness/programs/{id} (readiness) |
| `PATCH` | /readiness/readiness/programs/{id} | `readiness_patch_readiness_readiness_programs_id` | [stub] Patch /readiness/readiness/programs/{id} (readiness) |
| `DELETE` | /readiness/readiness/programs/{id} | `readiness_delete_readiness_readiness_programs_id` | [stub] Delete /readiness/readiness/programs/{id} (readiness) |
| `GET` | /readiness/readiness/programs/{id}/alerts | `readiness_get_readiness_readiness_programs_id_alerts` | [stub] List/get /readiness/readiness/programs/{id}/alerts (readiness) |
| `GET` | /readiness/readiness/programs/{id}/dimensions | `readiness_get_readiness_readiness_programs_id_dimensions` | [stub] List/get /readiness/readiness/programs/{id}/dimensions (readiness) |
| `GET` | /readiness/readiness/programs/{id}/milestones | `readiness_get_readiness_readiness_programs_id_milestones` | [stub] List/get /readiness/readiness/programs/{id}/milestones (readiness) |
| `GET` | /readiness/readiness/programs/{id}/risks | `readiness_get_readiness_readiness_programs_id_risks` | [stub] List/get /readiness/readiness/programs/{id}/risks (readiness) |
| `POST` | /readiness/readiness/risks | `readiness_post_readiness_readiness_risks` | [stub] Create/invoke /readiness/readiness/risks (readiness) |
| `PATCH` | /readiness/readiness/risks/{id} | `readiness_patch_readiness_readiness_risks_id` | [stub] Patch /readiness/readiness/risks/{id} (readiness) |
| `DELETE` | /readiness/readiness/risks/{id} | `readiness_delete_readiness_readiness_risks_id` | [stub] Delete /readiness/readiness/risks/{id} (readiness) |
| `POST` | /readiness/readiness/scores | `readiness_post_readiness_readiness_scores` | [stub] Create/invoke /readiness/readiness/scores (readiness) |

<a id="observability"></a>

## observability

Platform telemetry, web vitals, alerts, and health monitoring

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /observability | `listObservabilityApps` | List all app observability snapshots |
| `GET` | /observability/{appSlug} | `getAppObservability` | Get observability snapshot for a specific app |
| `GET` | /observability/admin/observability | `observability_get_observability_admin_observability` | [stub] List/get /observability/admin/observability (observability) |
| `GET` | /observability/alerts | `getActiveAlerts` | Get all active system alerts |
| `GET` | /observability/business-events | `getBusinessEvents` | Get business event counts and domain breakdown |
| `GET` | /observability/observability | `observability_get_observability_observability` | [stub] List/get /observability/observability (observability) |
| `GET` | /observability/observability/{appSlug} | `observability_get_observability_observability_appSlug` | [stub] List/get /observability/observability/{appSlug} (observability) |
| `GET` | /observability/observability/alerts | `observability_get_observability_observability_alerts` | [stub] List/get /observability/observability/alerts (observability) |
| `POST` | /observability/observability/alerts/{id}/resolve | `observability_post_observability_observability_alerts_id_resolve` | [stub] Create/invoke /observability/observability/alerts/{id}/resolve (observability) |
| `GET` | /observability/observability/business-events | `observability_get_observability_observability_business_events` | [stub] List/get /observability/observability/business-events (observability) |
| `POST` | /observability/observability/client-errors | `observability_post_observability_observability_client_errors` | [stub] Create/invoke /observability/observability/client-errors (observability) |
| `POST` | /observability/observability/error-feedback | `observability_post_observability_observability_error_feedback` | [stub] Create/invoke /observability/observability/error-feedback (observability) |
| `GET` | /observability/observability/telemetry/product | `observability_get_observability_observability_telemetry_product` | [stub] List/get /observability/observability/telemetry/product (observability) |
| `GET` | /observability/observability/telemetry/technical | `observability_get_observability_observability_telemetry_technical` | [stub] List/get /observability/observability/telemetry/technical (observability) |
| `POST` | /observability/observability/vitals | `observability_post_observability_observability_vitals` | [stub] Create/invoke /observability/observability/vitals (observability) |
| `POST` | /observability/vitals | `recordWebVitals` | Record web vital metrics |

<a id="terra"></a>

## terra

Real estate intelligence — market data, listings, geocoding, MLS, and commercial properties

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /terra/commercial/comps | `getTerraCommercialComps` | Get commercial real estate comparable sales |
| `GET` | /terra/commercial/properties | `getTerraCommercialProperties` | Search commercial real estate properties |
| `GET` | /terra/demographics | `getTerraDemographics` | Get demographic data for real estate analysis |
| `GET` | /terra/employment-outlook | `getTerraEmploymentOutlook` | Get employment outlook for a market area |
| `GET` | /terra/enterprise/flags | `getTerraEnterpriseFlags` | Get Terra enterprise feature flags |
| `POST` | /terra/enterprise/sync/commercial | `syncTerraCommercial` | Trigger commercial data sync (enterprise, authenticated) |
| `POST` | /terra/enterprise/sync/mls | `syncTerraMLS` | Trigger MLS data sync (enterprise, authenticated) |
| `GET` | /terra/geocode | `terraGeocode` | Forward geocode an address to coordinates |
| `GET` | /terra/geocoding-status | `terraGeocodingStatus` | Check geocoding service availability and quota |
| `GET` | /terra/market-intelligence | `getTerraMarketIntelligence` | Get real estate market intelligence snapshot |
| `GET` | /terra/mls/listings | `getTerraMLSListings` | Search MLS residential property listings |
| `GET` | /terra/property-risk | `getTerraPropertyRisk` | Get property risk assessment data (flood, fire, seismic) |
| `GET` | /terra/reit-filings | `getTerraReitFilings` | Get recent REIT regulatory filings |
| `GET` | /terra/reverse-geocode | `terraReverseGeocode` | Reverse geocode coordinates to an address |
| `GET` | /terra/sector-performance | `getTerraSectorPerformance` | Get real estate sector performance by asset class |
| `GET` | /terra/terra/commercial/comps | `terra_get_terra_terra_commercial_comps` | [stub] List/get /terra/terra/commercial/comps (terra) |
| `GET` | /terra/terra/commercial/properties | `terra_get_terra_terra_commercial_properties` | [stub] List/get /terra/terra/commercial/properties (terra) |
| `GET` | /terra/terra/demographics | `terra_get_terra_terra_demographics` | [stub] List/get /terra/terra/demographics (terra) |
| `GET` | /terra/terra/employment-outlook | `terra_get_terra_terra_employment_outlook` | [stub] List/get /terra/terra/employment-outlook (terra) |
| `GET` | /terra/terra/enterprise/flags | `terra_get_terra_terra_enterprise_flags` | [stub] List/get /terra/terra/enterprise/flags (terra) |
| `POST` | /terra/terra/enterprise/sync/commercial | `terra_post_terra_terra_enterprise_sync_commercial` | [stub] Create/invoke /terra/terra/enterprise/sync/commercial (terra) |
| `POST` | /terra/terra/enterprise/sync/mls | `terra_post_terra_terra_enterprise_sync_mls` | [stub] Create/invoke /terra/terra/enterprise/sync/mls (terra) |
| `GET` | /terra/terra/geocode | `terra_get_terra_terra_geocode` | [stub] List/get /terra/terra/geocode (terra) |
| `GET` | /terra/terra/geocoding-status | `terra_get_terra_terra_geocoding_status` | [stub] List/get /terra/terra/geocoding-status (terra) |
| `GET` | /terra/terra/market | `terra_get_terra_terra_market` | [stub] List/get /terra/terra/market (terra) |
| `GET` | /terra/terra/market-intelligence | `terra_get_terra_terra_market_intelligence` | [stub] List/get /terra/terra/market-intelligence (terra) |
| `GET` | /terra/terra/mls/listings | `terra_get_terra_terra_mls_listings` | [stub] List/get /terra/terra/mls/listings (terra) |
| `GET` | /terra/terra/properties | `terra_get_terra_terra_properties` | [stub] List/get /terra/terra/properties (terra) |
| `GET` | /terra/terra/properties/{id} | `terra_get_terra_terra_properties_id` | [stub] List/get /terra/terra/properties/{id} (terra) |
| `GET` | /terra/terra/properties/{id}/history | `terra_get_terra_terra_properties_id_history` | [stub] List/get /terra/terra/properties/{id}/history (terra) |
| `GET` | /terra/terra/property-risk | `terra_get_terra_terra_property_risk` | [stub] List/get /terra/terra/property-risk (terra) |
| `GET` | /terra/terra/reit-filings | `terra_get_terra_terra_reit_filings` | [stub] List/get /terra/terra/reit-filings (terra) |
| `GET` | /terra/terra/reverse-geocode | `terra_get_terra_terra_reverse_geocode` | [stub] List/get /terra/terra/reverse-geocode (terra) |
| `GET` | /terra/terra/sector-performance | `terra_get_terra_terra_sector_performance` | [stub] List/get /terra/terra/sector-performance (terra) |

<a id="holdings"></a>

## holdings

SZL Holdings portfolio — ventures, milestones, metrics, leadership, and investor relations

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /holdings/ecosystem-health | `getHoldingsEcosystemHealth` | Get health status across all portfolio ventures |
| `GET` | /holdings/ecosystem-summary | `getHoldingsEcosystemSummary` | Get high-level ecosystem summary for the holdings dashboard |
| `GET` | /holdings/health | `getHoldingsHealth` | Holdings service health check |
| `GET` | /holdings/holdings/ecosystem-health | `holdings_get_holdings_holdings_ecosystem_health` | [stub] List/get /holdings/holdings/ecosystem-health (holdings) |
| `GET` | /holdings/holdings/ecosystem-summary | `holdings_get_holdings_holdings_ecosystem_summary` | [stub] List/get /holdings/holdings/ecosystem-summary (holdings) |
| `GET` | /holdings/holdings/fundamentals | `holdings_get_holdings_holdings_fundamentals` | [stub] List/get /holdings/holdings/fundamentals (holdings) |
| `GET` | /holdings/holdings/health | `holdings_get_holdings_holdings_health` | [stub] List/get /holdings/holdings/health (holdings) |
| `GET` | /holdings/holdings/inquiries | `holdings_get_holdings_holdings_inquiries` | [stub] List/get /holdings/holdings/inquiries (holdings) |
| `POST` | /holdings/holdings/inquiries | `holdings_post_holdings_holdings_inquiries` | [stub] Create/invoke /holdings/holdings/inquiries (holdings) |
| `DELETE` | /holdings/holdings/inquiries/{id} | `holdings_delete_holdings_holdings_inquiries_id` | [stub] Delete /holdings/holdings/inquiries/{id} (holdings) |
| `GET` | /holdings/holdings/investor-content | `holdings_get_holdings_holdings_investor_content` | [stub] List/get /holdings/holdings/investor-content (holdings) |
| `GET` | /holdings/holdings/kpis | `holdings_get_holdings_holdings_kpis` | [stub] List/get /holdings/holdings/kpis (holdings) |
| `GET` | /holdings/holdings/leadership | `holdings_get_holdings_holdings_leadership` | [stub] List/get /holdings/holdings/leadership (holdings) |
| `POST` | /holdings/holdings/leadership | `holdings_post_holdings_holdings_leadership` | [stub] Create/invoke /holdings/holdings/leadership (holdings) |
| `DELETE` | /holdings/holdings/leadership/{id} | `holdings_delete_holdings_holdings_leadership_id` | [stub] Delete /holdings/holdings/leadership/{id} (holdings) |
| `GET` | /holdings/holdings/metrics | `holdings_get_holdings_holdings_metrics` | [stub] List/get /holdings/holdings/metrics (holdings) |
| `POST` | /holdings/holdings/metrics | `holdings_post_holdings_holdings_metrics` | [stub] Create/invoke /holdings/holdings/metrics (holdings) |
| `DELETE` | /holdings/holdings/metrics/{id} | `holdings_delete_holdings_holdings_metrics_id` | [stub] Delete /holdings/holdings/metrics/{id} (holdings) |
| `GET` | /holdings/holdings/milestones | `holdings_get_holdings_holdings_milestones` | [stub] List/get /holdings/holdings/milestones (holdings) |
| `POST` | /holdings/holdings/milestones | `holdings_post_holdings_holdings_milestones` | [stub] Create/invoke /holdings/holdings/milestones (holdings) |
| `DELETE` | /holdings/holdings/milestones/{id} | `holdings_delete_holdings_holdings_milestones_id` | [stub] Delete /holdings/holdings/milestones/{id} (holdings) |
| `GET` | /holdings/holdings/search | `holdings_get_holdings_holdings_search` | [stub] List/get /holdings/holdings/search (holdings) |
| `GET` | /holdings/holdings/venture-health | `holdings_get_holdings_holdings_venture_health` | [stub] List/get /holdings/holdings/venture-health (holdings) |
| `GET` | /holdings/holdings/ventures | `holdings_get_holdings_holdings_ventures` | [stub] List/get /holdings/holdings/ventures (holdings) |
| `POST` | /holdings/holdings/ventures | `holdings_post_holdings_holdings_ventures` | [stub] Create/invoke /holdings/holdings/ventures (holdings) |
| `GET` | /holdings/holdings/ventures/{id} | `holdings_get_holdings_holdings_ventures_id` | [stub] List/get /holdings/holdings/ventures/{id} (holdings) |
| `PATCH` | /holdings/holdings/ventures/{id} | `holdings_patch_holdings_holdings_ventures_id` | [stub] Patch /holdings/holdings/ventures/{id} (holdings) |
| `DELETE` | /holdings/holdings/ventures/{id} | `holdings_delete_holdings_holdings_ventures_id` | [stub] Delete /holdings/holdings/ventures/{id} (holdings) |
| `GET` | /holdings/inquiries | `listHoldingsInquiries` | List investor and partnership inquiries (authenticated) |
| `POST` | /holdings/inquiries | `createHoldingsInquiry` | Submit a holdings inquiry (public — rate limited) |
| `DELETE` | /holdings/inquiries/{id} | `deleteHoldingsInquiry` | Archive/delete an inquiry |
| `POST` | /holdings/investors/demo-request | `holdings_post_holdings_investors_demo_request` | [stub] Create/invoke /holdings/investors/demo-request (holdings) |
| `GET` | /holdings/investors/docs | `holdings_get_holdings_investors_docs` | [stub] List/get /holdings/investors/docs (holdings) |
| `GET` | /holdings/investors/docs/{id} | `holdings_get_holdings_investors_docs_id` | [stub] List/get /holdings/investors/docs/{id} (holdings) |
| `GET` | /holdings/investors/docs/{id}/download | `holdings_get_holdings_investors_docs_id_download` | [stub] List/get /holdings/investors/docs/{id}/download (holdings) |
| `POST` | /holdings/investors/inquiry | `holdings_post_holdings_investors_inquiry` | [stub] Create/invoke /holdings/investors/inquiry (holdings) |
| `POST` | /holdings/investors/nda/accept | `holdings_post_holdings_investors_nda_accept` | [stub] Create/invoke /holdings/investors/nda/accept (holdings) |
| `GET` | /holdings/investors/nda/status | `holdings_get_holdings_investors_nda_status` | [stub] List/get /holdings/investors/nda/status (holdings) |
| `GET` | /holdings/investors/search | `holdings_get_holdings_investors_search` | [stub] List/get /holdings/investors/search (holdings) |
| `GET` | /holdings/kpis | `getHoldingsKPIs` | Get SZL Holdings top-level KPIs |
| `GET` | /holdings/leadership | `listVentureLeadership` | List venture leadership profiles |
| `POST` | /holdings/leadership | `createVentureLeader` | Add a leadership profile to a venture |
| `DELETE` | /holdings/leadership/{id} | `deleteVentureLeader` | Remove a leadership profile |
| `GET` | /holdings/metrics | `listVentureMetrics` | List venture performance metrics |
| `POST` | /holdings/metrics | `createVentureMetric` | Record a venture metric data point |
| `DELETE` | /holdings/metrics/{id} | `deleteVentureMetric` | Delete a metric data point |
| `GET` | /holdings/milestones | `listVentureMilestones` | List portfolio milestones |
| `POST` | /holdings/milestones | `createVentureMilestone` | Create a milestone for a venture |
| `DELETE` | /holdings/milestones/{id} | `deleteVentureMilestone` | Delete a milestone |
| `GET` | /holdings/search | `searchHoldings` | Full-text search across ventures, metrics, and milestones |
| `GET` | /holdings/ventures | `listVentures` | List all portfolio ventures |
| `POST` | /holdings/ventures | `createVenture` | Add a new portfolio venture |
| `GET` | /holdings/ventures/{id} | `getVenture` | Get a portfolio venture by ID |
| `PATCH` | /holdings/ventures/{id} | `updateVenture` | Update a portfolio venture |
| `DELETE` | /holdings/ventures/{id} | `deleteVenture` | Remove a portfolio venture |
| `GET` | /investors/docs | `listInvestorDocs` | List investor-grade documents (requires NDA acceptance and analyst+ role) |
| `GET` | /investors/docs/{id} | `getInvestorDoc` | Get a specific investor document |
| `GET` | /investors/holdings/ecosystem-health | `holdings_get_investors_holdings_ecosystem_health` | [stub] List/get /investors/holdings/ecosystem-health (holdings) |
| `GET` | /investors/holdings/ecosystem-summary | `holdings_get_investors_holdings_ecosystem_summary` | [stub] List/get /investors/holdings/ecosystem-summary (holdings) |
| `GET` | /investors/holdings/fundamentals | `holdings_get_investors_holdings_fundamentals` | [stub] List/get /investors/holdings/fundamentals (holdings) |
| `GET` | /investors/holdings/health | `holdings_get_investors_holdings_health` | [stub] List/get /investors/holdings/health (holdings) |
| `GET` | /investors/holdings/inquiries | `holdings_get_investors_holdings_inquiries` | [stub] List/get /investors/holdings/inquiries (holdings) |
| `POST` | /investors/holdings/inquiries | `holdings_post_investors_holdings_inquiries` | [stub] Create/invoke /investors/holdings/inquiries (holdings) |
| `DELETE` | /investors/holdings/inquiries/{id} | `holdings_delete_investors_holdings_inquiries_id` | [stub] Delete /investors/holdings/inquiries/{id} (holdings) |
| `GET` | /investors/holdings/investor-content | `holdings_get_investors_holdings_investor_content` | [stub] List/get /investors/holdings/investor-content (holdings) |
| `GET` | /investors/holdings/kpis | `holdings_get_investors_holdings_kpis` | [stub] List/get /investors/holdings/kpis (holdings) |
| `GET` | /investors/holdings/leadership | `holdings_get_investors_holdings_leadership` | [stub] List/get /investors/holdings/leadership (holdings) |
| `POST` | /investors/holdings/leadership | `holdings_post_investors_holdings_leadership` | [stub] Create/invoke /investors/holdings/leadership (holdings) |
| `DELETE` | /investors/holdings/leadership/{id} | `holdings_delete_investors_holdings_leadership_id` | [stub] Delete /investors/holdings/leadership/{id} (holdings) |
| `GET` | /investors/holdings/metrics | `holdings_get_investors_holdings_metrics` | [stub] List/get /investors/holdings/metrics (holdings) |
| `POST` | /investors/holdings/metrics | `holdings_post_investors_holdings_metrics` | [stub] Create/invoke /investors/holdings/metrics (holdings) |
| `DELETE` | /investors/holdings/metrics/{id} | `holdings_delete_investors_holdings_metrics_id` | [stub] Delete /investors/holdings/metrics/{id} (holdings) |
| `GET` | /investors/holdings/milestones | `holdings_get_investors_holdings_milestones` | [stub] List/get /investors/holdings/milestones (holdings) |
| `POST` | /investors/holdings/milestones | `holdings_post_investors_holdings_milestones` | [stub] Create/invoke /investors/holdings/milestones (holdings) |
| `DELETE` | /investors/holdings/milestones/{id} | `holdings_delete_investors_holdings_milestones_id` | [stub] Delete /investors/holdings/milestones/{id} (holdings) |
| `GET` | /investors/holdings/search | `holdings_get_investors_holdings_search` | [stub] List/get /investors/holdings/search (holdings) |
| `GET` | /investors/holdings/venture-health | `holdings_get_investors_holdings_venture_health` | [stub] List/get /investors/holdings/venture-health (holdings) |
| `GET` | /investors/holdings/ventures | `holdings_get_investors_holdings_ventures` | [stub] List/get /investors/holdings/ventures (holdings) |
| `POST` | /investors/holdings/ventures | `holdings_post_investors_holdings_ventures` | [stub] Create/invoke /investors/holdings/ventures (holdings) |
| `GET` | /investors/holdings/ventures/{id} | `holdings_get_investors_holdings_ventures_id` | [stub] List/get /investors/holdings/ventures/{id} (holdings) |
| `PATCH` | /investors/holdings/ventures/{id} | `holdings_patch_investors_holdings_ventures_id` | [stub] Patch /investors/holdings/ventures/{id} (holdings) |
| `DELETE` | /investors/holdings/ventures/{id} | `holdings_delete_investors_holdings_ventures_id` | [stub] Delete /investors/holdings/ventures/{id} (holdings) |
| `POST` | /investors/investors/demo-request | `holdings_post_investors_investors_demo_request` | [stub] Create/invoke /investors/investors/demo-request (holdings) |
| `GET` | /investors/investors/docs | `holdings_get_investors_investors_docs` | [stub] List/get /investors/investors/docs (holdings) |
| `GET` | /investors/investors/docs/{id} | `holdings_get_investors_investors_docs_id` | [stub] List/get /investors/investors/docs/{id} (holdings) |
| `GET` | /investors/investors/docs/{id}/download | `holdings_get_investors_investors_docs_id_download` | [stub] List/get /investors/investors/docs/{id}/download (holdings) |
| `POST` | /investors/investors/inquiry | `holdings_post_investors_investors_inquiry` | [stub] Create/invoke /investors/investors/inquiry (holdings) |
| `POST` | /investors/investors/nda/accept | `holdings_post_investors_investors_nda_accept` | [stub] Create/invoke /investors/investors/nda/accept (holdings) |
| `GET` | /investors/investors/nda/status | `holdings_get_investors_investors_nda_status` | [stub] List/get /investors/investors/nda/status (holdings) |
| `GET` | /investors/investors/search | `holdings_get_investors_investors_search` | [stub] List/get /investors/investors/search (holdings) |
| `POST` | /investors/nda/accept | `acceptInvestorNDA` | Accept the investor NDA |
| `GET` | /investors/nda/status | `getInvestorNDAStatus` | Check NDA acceptance status for the current investor |

<a id="a2a"></a>

## a2a

Agent-to-Agent (A2A) protocol — agent cards, tasks, delegation, discovery

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /.well-known/.well-known/agent-card.json | `a2a_get_well_known_well_known_agent_card_json` | [stub] List/get /.well-known/.well-known/agent-card.json (a2a) |
| `GET` | /.well-known/a2a/agents | `a2a_get_well_known_a2a_agents` | [stub] List/get /.well-known/a2a/agents (a2a) |
| `GET` | /.well-known/a2a/agents/{agentId} | `a2a_get_well_known_a2a_agents_agentId` | [stub] List/get /.well-known/a2a/agents/{agentId} (a2a) |
| `GET` | /.well-known/a2a/agents/{agentId}/health | `a2a_get_well_known_a2a_agents_agentId_health` | [stub] List/get /.well-known/a2a/agents/{agentId}/health (a2a) |
| `POST` | /.well-known/a2a/agents/{agentId}/heartbeat | `a2a_post_well_known_a2a_agents_agentId_heartbeat` | [stub] Create/invoke /.well-known/a2a/agents/{agentId}/heartbeat (a2a) |
| `POST` | /.well-known/a2a/agents/{agentId}/rpc | `a2a_post_well_known_a2a_agents_agentId_rpc` | [stub] Create/invoke /.well-known/a2a/agents/{agentId}/rpc (a2a) |
| `GET` | /.well-known/a2a/agents/{agentId}/status | `a2a_get_well_known_a2a_agents_agentId_status` | [stub] List/get /.well-known/a2a/agents/{agentId}/status (a2a) |
| `GET` | /.well-known/a2a/agents/{agentId}/stream | `a2a_get_well_known_a2a_agents_agentId_stream` | [stub] List/get /.well-known/a2a/agents/{agentId}/stream (a2a) |
| `GET` | /.well-known/a2a/agents/{agentId}/tasks | `a2a_get_well_known_a2a_agents_agentId_tasks` | [stub] List/get /.well-known/a2a/agents/{agentId}/tasks (a2a) |
| `POST` | /.well-known/a2a/agents/{agentId}/tasks | `a2a_post_well_known_a2a_agents_agentId_tasks` | [stub] Create/invoke /.well-known/a2a/agents/{agentId}/tasks (a2a) |
| `GET` | /.well-known/a2a/agents/{agentId}/tasks/{taskId} | `a2a_get_well_known_a2a_agents_agentId_tasks_taskId` | [stub] List/get /.well-known/a2a/agents/{agentId}/tasks/{taskId} (a2a) |
| `GET` | /.well-known/a2a/delegate | `a2a_get_well_known_a2a_delegate` | [stub] List/get /.well-known/a2a/delegate (a2a) |
| `POST` | /.well-known/a2a/delegate | `a2a_post_well_known_a2a_delegate` | [stub] Create/invoke /.well-known/a2a/delegate (a2a) |
| `GET` | /.well-known/a2a/delegate/{taskId} | `a2a_get_well_known_a2a_delegate_taskId` | [stub] List/get /.well-known/a2a/delegate/{taskId} (a2a) |
| `GET` | /.well-known/a2a/delegations | `a2a_get_well_known_a2a_delegations` | [stub] List/get /.well-known/a2a/delegations (a2a) |
| `GET` | /.well-known/a2a/delegations/stats | `a2a_get_well_known_a2a_delegations_stats` | [stub] List/get /.well-known/a2a/delegations/stats (a2a) |
| `GET` | /.well-known/a2a/discover | `a2a_get_well_known_a2a_discover` | [stub] List/get /.well-known/a2a/discover (a2a) |
| `POST` | /.well-known/a2a/discover | `a2a_post_well_known_a2a_discover` | [stub] Create/invoke /.well-known/a2a/discover (a2a) |
| `GET` | /.well-known/a2a/health | `a2a_get_well_known_a2a_health` | [stub] List/get /.well-known/a2a/health (a2a) |
| `POST` | /.well-known/a2a/heartbeat | `a2a_post_well_known_a2a_heartbeat` | [stub] Create/invoke /.well-known/a2a/heartbeat (a2a) |
| `POST` | /.well-known/a2a/multi-delegate | `a2a_post_well_known_a2a_multi_delegate` | [stub] Create/invoke /.well-known/a2a/multi-delegate (a2a) |
| `POST` | /.well-known/a2a/register | `a2a_post_well_known_a2a_register` | [stub] Create/invoke /.well-known/a2a/register (a2a) |
| `POST` | /.well-known/a2a/sync | `a2a_post_well_known_a2a_sync` | [stub] Create/invoke /.well-known/a2a/sync (a2a) |
| `GET` | /.well-known/agent-card.json | `getMeshAgentIndex` | Mesh index of all A2A agent cards |
| `GET` | /a2a/.well-known/agent-card.json | `a2a_get_a2a_well_known_agent_card_json` | [stub] List/get /a2a/.well-known/agent-card.json (a2a) |
| `GET` | /a2a/a2a/agents | `a2a_get_a2a_a2a_agents` | [stub] List/get /a2a/a2a/agents (a2a) |
| `GET` | /a2a/a2a/agents/{agentId} | `a2a_get_a2a_a2a_agents_agentId` | [stub] List/get /a2a/a2a/agents/{agentId} (a2a) |
| `GET` | /a2a/a2a/agents/{agentId}/health | `a2a_get_a2a_a2a_agents_agentId_health` | [stub] List/get /a2a/a2a/agents/{agentId}/health (a2a) |
| `POST` | /a2a/a2a/agents/{agentId}/heartbeat | `a2a_post_a2a_a2a_agents_agentId_heartbeat` | [stub] Create/invoke /a2a/a2a/agents/{agentId}/heartbeat (a2a) |
| `POST` | /a2a/a2a/agents/{agentId}/rpc | `a2a_post_a2a_a2a_agents_agentId_rpc` | [stub] Create/invoke /a2a/a2a/agents/{agentId}/rpc (a2a) |
| `GET` | /a2a/a2a/agents/{agentId}/status | `a2a_get_a2a_a2a_agents_agentId_status` | [stub] List/get /a2a/a2a/agents/{agentId}/status (a2a) |
| `GET` | /a2a/a2a/agents/{agentId}/stream | `a2a_get_a2a_a2a_agents_agentId_stream` | [stub] List/get /a2a/a2a/agents/{agentId}/stream (a2a) |
| `GET` | /a2a/a2a/agents/{agentId}/tasks | `a2a_get_a2a_a2a_agents_agentId_tasks` | [stub] List/get /a2a/a2a/agents/{agentId}/tasks (a2a) |
| `POST` | /a2a/a2a/agents/{agentId}/tasks | `a2a_post_a2a_a2a_agents_agentId_tasks` | [stub] Create/invoke /a2a/a2a/agents/{agentId}/tasks (a2a) |
| `GET` | /a2a/a2a/agents/{agentId}/tasks/{taskId} | `a2a_get_a2a_a2a_agents_agentId_tasks_taskId` | [stub] List/get /a2a/a2a/agents/{agentId}/tasks/{taskId} (a2a) |
| `GET` | /a2a/a2a/delegate | `a2a_get_a2a_a2a_delegate` | [stub] List/get /a2a/a2a/delegate (a2a) |
| `POST` | /a2a/a2a/delegate | `a2a_post_a2a_a2a_delegate` | [stub] Create/invoke /a2a/a2a/delegate (a2a) |
| `GET` | /a2a/a2a/delegate/{taskId} | `a2a_get_a2a_a2a_delegate_taskId` | [stub] List/get /a2a/a2a/delegate/{taskId} (a2a) |
| `GET` | /a2a/a2a/delegations | `a2a_get_a2a_a2a_delegations` | [stub] List/get /a2a/a2a/delegations (a2a) |
| `GET` | /a2a/a2a/delegations/stats | `a2a_get_a2a_a2a_delegations_stats` | [stub] List/get /a2a/a2a/delegations/stats (a2a) |
| `GET` | /a2a/a2a/discover | `a2a_get_a2a_a2a_discover` | [stub] List/get /a2a/a2a/discover (a2a) |
| `POST` | /a2a/a2a/discover | `a2a_post_a2a_a2a_discover` | [stub] Create/invoke /a2a/a2a/discover (a2a) |
| `GET` | /a2a/a2a/health | `a2a_get_a2a_a2a_health` | [stub] List/get /a2a/a2a/health (a2a) |
| `POST` | /a2a/a2a/heartbeat | `a2a_post_a2a_a2a_heartbeat` | [stub] Create/invoke /a2a/a2a/heartbeat (a2a) |
| `POST` | /a2a/a2a/multi-delegate | `a2a_post_a2a_a2a_multi_delegate` | [stub] Create/invoke /a2a/a2a/multi-delegate (a2a) |
| `POST` | /a2a/a2a/register | `a2a_post_a2a_a2a_register` | [stub] Create/invoke /a2a/a2a/register (a2a) |
| `POST` | /a2a/a2a/sync | `a2a_post_a2a_a2a_sync` | [stub] Create/invoke /a2a/a2a/sync (a2a) |
| `GET` | /a2a/agents | `listA2AAgents` | List all registered A2A agent cards |
| `GET` | /a2a/agents/{agentId} | `getA2AAgent` | Get a specific agent card |
| `GET` | /a2a/agents/{agentId}/health | `getA2AAgentHealth` | Check health of a specific agent |
| `POST` | /a2a/agents/{agentId}/heartbeat | `recordA2AHeartbeat` | Record an agent heartbeat |
| `POST` | /a2a/agents/{agentId}/rpc | `a2aJsonRpc` | JSON-RPC 2.0 endpoint for agent |
| `GET` | /a2a/agents/{agentId}/status | `getA2AAgentStatus` | Get agent availability and trust status |
| `GET` | /a2a/agents/{agentId}/stream | `streamA2AAgent` | SSE stream of task results for an agent |
| `GET` | /a2a/agents/{agentId}/tasks | `listA2ATasks` | List tasks for an agent |
| `POST` | /a2a/agents/{agentId}/tasks | `createA2ATask` | Create a new A2A task for an agent |
| `GET` | /a2a/agents/{agentId}/tasks/{taskId} | `getA2ATask` | Get task status and output |
| `POST` | /a2a/delegate | `delegateA2ATask` | Delegate a task from one agent to another |
| `GET` | /a2a/delegations | `listA2ADelegations` | Get active and historical delegations |
| `GET` | /a2a/delegations/stats | `getA2ADelegationStats` | Delegation statistics by agent |
| `GET` | /a2a/discover | `discoverA2AAgents` | Discover agents by capability, domain, or task query |
| `POST` | /a2a/multi-delegate | `multiDelegateA2ATask` | Delegate to multiple agents and merge results |

<a id="agent-os"></a>

## agent-os

AgentOS runtime — scheduler, knowledge store, event bus, agent feeds

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /agent-os/agent-os/agent-stats | `agent_os_get_agent_os_agent_os_agent_stats` | [stub] List/get /agent-os/agent-os/agent-stats (agent-os) |
| `GET` | /agent-os/agent-os/events | `agent_os_get_agent_os_agent_os_events` | [stub] List/get /agent-os/agent-os/events (agent-os) |
| `GET` | /agent-os/agent-os/feed | `agent_os_get_agent_os_agent_os_feed` | [stub] List/get /agent-os/agent-os/feed (agent-os) |
| `GET` | /agent-os/agent-os/feed/{domain} | `agent_os_get_agent_os_agent_os_feed_domain` | [stub] List/get /agent-os/agent-os/feed/{domain} (agent-os) |
| `GET` | /agent-os/agent-os/knowledge | `agent_os_get_agent_os_agent_os_knowledge` | [stub] List/get /agent-os/agent-os/knowledge (agent-os) |
| `POST` | /agent-os/agent-os/run/{agentId} | `agent_os_post_agent_os_agent_os_run_agentId` | [stub] Create/invoke /agent-os/agent-os/run/{agentId} (agent-os) |
| `GET` | /agent-os/agent-os/runs | `agent_os_get_agent_os_agent_os_runs` | [stub] List/get /agent-os/agent-os/runs (agent-os) |
| `GET` | /agent-os/agent-os/schedules | `agent_os_get_agent_os_agent_os_schedules` | [stub] List/get /agent-os/agent-os/schedules (agent-os) |
| `GET` | /agent-os/agent-os/status | `agent_os_get_agent_os_agent_os_status` | [stub] List/get /agent-os/agent-os/status (agent-os) |
| `GET` | /agent-os/agent-stats | `getAgentStats` | Get detailed per-agent statistics |
| `GET` | /agent-os/events | `listAgentEvents` | Get agent event bus history |
| `GET` | /agent-os/feed | `getGlobalAgentFeed` | Get global agent intelligence feed |
| `GET` | /agent-os/feed/{domain} | `getDomainAgentFeed` | Get domain-specific agent intelligence feed |
| `GET` | /agent-os/knowledge | `queryAgentKnowledge` | Query the agent knowledge store |
| `POST` | /agent-os/run/{agentId} | `triggerAgentRun` | Manually trigger a scheduled agent run (admin only) |
| `GET` | /agent-os/runs | `listAgentRuns` | Get agent run history |
| `GET` | /agent-os/schedules | `listAgentSchedules` | List all agent schedules |
| `GET` | /agent-os/status | `getAgentOsStatus` | Get AgentOS runtime status — scheduler, knowledge, event bus |

<a id="copilot"></a>

## copilot

AI Copilot — domain-specific AI chat powered by OpenAI and Anthropic

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `POST` | /copilot/chat | `copilotChat` | Send a message to the AI copilot (domain-specific) |

<a id="alloy"></a>

## alloy

Alloy agentic runtime — workflows, runs, artifacts, signals, approvals, and factory floor

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /alloy/admin/flags | `listAlloyAdminFlags` | List Alloy admin feature flags |
| `POST` | /alloy/admin/flags | `upsertAlloyAdminFlag` | Create or update an Alloy admin flag |
| `PATCH` | /alloy/admin/flags/{key} | `patchAlloyAdminFlag` | Patch a single Alloy admin flag |
| `GET` | /alloy/alloy/admin/flags | `alloy_get_alloy_alloy_admin_flags` | [stub] List/get /alloy/alloy/admin/flags (alloy) |
| `POST` | /alloy/alloy/admin/flags | `alloy_post_alloy_alloy_admin_flags` | [stub] Create/invoke /alloy/alloy/admin/flags (alloy) |
| `PATCH` | /alloy/alloy/admin/flags/{key} | `alloy_patch_alloy_alloy_admin_flags_key` | [stub] Patch /alloy/alloy/admin/flags/{key} (alloy) |
| `GET` | /alloy/alloy/approvals | `alloy_get_alloy_alloy_approvals` | [stub] List/get /alloy/alloy/approvals (alloy) |
| `POST` | /alloy/alloy/approvals/{id}/decide | `alloy_post_alloy_alloy_approvals_id_decide` | [stub] Create/invoke /alloy/alloy/approvals/{id}/decide (alloy) |
| `GET` | /alloy/alloy/artifacts | `alloy_get_alloy_alloy_artifacts` | [stub] List/get /alloy/alloy/artifacts (alloy) |
| `GET` | /alloy/alloy/artifacts/{id} | `alloy_get_alloy_alloy_artifacts_id` | [stub] List/get /alloy/alloy/artifacts/{id} (alloy) |
| `POST` | /alloy/alloy/artifacts/{id}/approve | `alloy_post_alloy_alloy_artifacts_id_approve` | [stub] Create/invoke /alloy/alloy/artifacts/{id}/approve (alloy) |
| `POST` | /alloy/alloy/artifacts/{id}/reject | `alloy_post_alloy_alloy_artifacts_id_reject` | [stub] Create/invoke /alloy/alloy/artifacts/{id}/reject (alloy) |
| `GET` | /alloy/alloy/audit | `alloy_get_alloy_alloy_audit` | [stub] List/get /alloy/alloy/audit (alloy) |
| `GET` | /alloy/alloy/autonomy-mode | `alloy_get_alloy_alloy_autonomy_mode` | [stub] List/get /alloy/alloy/autonomy-mode (alloy) |
| `PATCH` | /alloy/alloy/autonomy-mode | `alloy_patch_alloy_alloy_autonomy_mode` | [stub] Patch /alloy/alloy/autonomy-mode (alloy) |
| `POST` | /alloy/alloy/autonomy-mode/evaluate | `alloy_post_alloy_alloy_autonomy_mode_evaluate` | [stub] Create/invoke /alloy/alloy/autonomy-mode/evaluate (alloy) |
| `GET` | /alloy/alloy/dashboard | `alloy_get_alloy_alloy_dashboard` | [stub] List/get /alloy/alloy/dashboard (alloy) |
| `GET` | /alloy/alloy/evidence | `alloy_get_alloy_alloy_evidence` | [stub] List/get /alloy/alloy/evidence (alloy) |
| `POST` | /alloy/alloy/evidence | `alloy_post_alloy_alloy_evidence` | [stub] Create/invoke /alloy/alloy/evidence (alloy) |
| `GET` | /alloy/alloy/evidence/{id} | `alloy_get_alloy_alloy_evidence_id` | [stub] List/get /alloy/alloy/evidence/{id} (alloy) |
| `GET` | /alloy/alloy/factory-floor | `alloy_get_alloy_alloy_factory_floor` | [stub] List/get /alloy/alloy/factory-floor (alloy) |
| `POST` | /alloy/alloy/ingest/batch | `alloy_post_alloy_alloy_ingest_batch` | [stub] Create/invoke /alloy/alloy/ingest/batch (alloy) |
| `POST` | /alloy/alloy/ingest/signal | `alloy_post_alloy_alloy_ingest_signal` | [stub] Create/invoke /alloy/alloy/ingest/signal (alloy) |
| `POST` | /alloy/alloy/policy/simulate | `alloy_post_alloy_alloy_policy_simulate` | [stub] Create/invoke /alloy/alloy/policy/simulate (alloy) |
| `POST` | /alloy/alloy/recommend | `alloy_post_alloy_alloy_recommend` | [stub] Create/invoke /alloy/alloy/recommend (alloy) |
| `GET` | /alloy/alloy/runs | `alloy_get_alloy_alloy_runs` | [stub] List/get /alloy/alloy/runs (alloy) |
| `GET` | /alloy/alloy/runs/{id} | `alloy_get_alloy_alloy_runs_id` | [stub] List/get /alloy/alloy/runs/{id} (alloy) |
| `POST` | /alloy/alloy/runs/{id}/cancel | `alloy_post_alloy_alloy_runs_id_cancel` | [stub] Create/invoke /alloy/alloy/runs/{id}/cancel (alloy) |
| `POST` | /alloy/alloy/runs/{id}/retry | `alloy_post_alloy_alloy_runs_id_retry` | [stub] Create/invoke /alloy/alloy/runs/{id}/retry (alloy) |
| `GET` | /alloy/alloy/runs/{id}/steps | `alloy_get_alloy_alloy_runs_id_steps` | [stub] List/get /alloy/alloy/runs/{id}/steps (alloy) |
| `GET` | /alloy/alloy/signals | `alloy_get_alloy_alloy_signals` | [stub] List/get /alloy/alloy/signals (alloy) |
| `GET` | /alloy/alloy/workflows | `alloy_get_alloy_alloy_workflows` | [stub] List/get /alloy/alloy/workflows (alloy) |
| `POST` | /alloy/alloy/workflows | `alloy_post_alloy_alloy_workflows` | [stub] Create/invoke /alloy/alloy/workflows (alloy) |
| `GET` | /alloy/alloy/workflows/{id} | `alloy_get_alloy_alloy_workflows_id` | [stub] List/get /alloy/alloy/workflows/{id} (alloy) |
| `PATCH` | /alloy/alloy/workflows/{id} | `alloy_patch_alloy_alloy_workflows_id` | [stub] Patch /alloy/alloy/workflows/{id} (alloy) |
| `DELETE` | /alloy/alloy/workflows/{id} | `alloy_delete_alloy_alloy_workflows_id` | [stub] Delete /alloy/alloy/workflows/{id} (alloy) |
| `POST` | /alloy/alloy/workflows/{id}/run | `alloy_post_alloy_alloy_workflows_id_run` | [stub] Create/invoke /alloy/alloy/workflows/{id}/run (alloy) |
| `GET` | /alloy/approvals | `listAlloyApprovals` | List pending Alloy approvals |
| `POST` | /alloy/approvals/{id}/decide | `decideAlloyApproval` | Approve or reject an Alloy approval request |
| `GET` | /alloy/artifacts | `listAlloyArtifacts` | List Alloy output artifacts awaiting review |
| `GET` | /alloy/artifacts/{id} | `getAlloyArtifact` | Get an Alloy artifact by ID |
| `POST` | /alloy/artifacts/{id}/approve | `approveAlloyArtifact` | Approve an Alloy artifact for use |
| `POST` | /alloy/artifacts/{id}/reject | `rejectAlloyArtifact` | Reject an Alloy artifact |
| `GET` | /alloy/audit | `listAlloyAuditLog` | List Alloy audit log entries |
| `GET` | /alloy/dashboard | `getAlloyDashboard` | Get Alloy operational dashboard metrics |
| `GET` | /alloy/decisions | `alloy_get_alloy_decisions` | [stub] List/get /alloy/decisions (alloy) |
| `POST` | /alloy/decisions | `alloy_post_alloy_decisions` | [stub] Create/invoke /alloy/decisions (alloy) |
| `GET` | /alloy/decisions/{id} | `alloy_get_alloy_decisions_id` | [stub] List/get /alloy/decisions/{id} (alloy) |
| `POST` | /alloy/decisions/{id}/approve | `alloy_post_alloy_decisions_id_approve` | [stub] Create/invoke /alloy/decisions/{id}/approve (alloy) |
| `POST` | /alloy/decisions/{id}/reject | `alloy_post_alloy_decisions_id_reject` | [stub] Create/invoke /alloy/decisions/{id}/reject (alloy) |
| `GET` | /alloy/factory-floor | `getAlloyFactoryFloor` | Get the Alloy factory floor — active agents, queues, and throughput |
| `POST` | /alloy/ingest/batch | `ingestAlloySignalBatch` | Batch-ingest multiple signals into the Alloy pipeline |
| `POST` | /alloy/ingest/signal | `ingestAlloySignal` | Ingest a single signal into the Alloy pipeline |
| `GET` | /alloy/runs | `listAlloyRuns` | List Alloy workflow runs |
| `GET` | /alloy/runs/{id} | `getAlloyRun` | Get an Alloy run by ID |
| `POST` | /alloy/runs/{id}/cancel | `cancelAlloyRun` | Cancel a running Alloy workflow run |
| `POST` | /alloy/runs/{id}/retry | `retryAlloyRun` | Retry a failed Alloy run |
| `GET` | /alloy/runs/{id}/steps | `getAlloyRunSteps` | Get step-level execution details for a run |
| `GET` | /alloy/signals | `listAlloySignals` | List ingested signals |
| `GET` | /alloy/skills | `alloy_get_alloy_skills` | [stub] List/get /alloy/skills (alloy) |
| `POST` | /alloy/skills | `alloy_post_alloy_skills` | [stub] Create/invoke /alloy/skills (alloy) |
| `GET` | /alloy/skills/{id} | `alloy_get_alloy_skills_id` | [stub] List/get /alloy/skills/{id} (alloy) |
| `PATCH` | /alloy/skills/{id} | `alloy_patch_alloy_skills_id` | [stub] Patch /alloy/skills/{id} (alloy) |
| `GET` | /alloy/skills/{id}/runs | `alloy_get_alloy_skills_id_runs` | [stub] List/get /alloy/skills/{id}/runs (alloy) |
| `GET` | /alloy/workflows | `listAlloyWorkflows` | List Alloy workflows |
| `POST` | /alloy/workflows | `createAlloyWorkflow` | Create a new Alloy workflow |
| `GET` | /alloy/workflows/{id} | `getAlloyWorkflow` | Get an Alloy workflow by ID |
| `PATCH` | /alloy/workflows/{id} | `updateAlloyWorkflow` | Update an Alloy workflow |
| `DELETE` | /alloy/workflows/{id} | `deleteAlloyWorkflow` | Delete an Alloy workflow |
| `POST` | /alloy/workflows/{id}/run | `runAlloyWorkflow` | Trigger an Alloy workflow run |
| `GET` | /decisions/alloy/admin/flags | `alloy_get_decisions_alloy_admin_flags` | [stub] List/get /decisions/alloy/admin/flags (alloy) |
| `POST` | /decisions/alloy/admin/flags | `alloy_post_decisions_alloy_admin_flags` | [stub] Create/invoke /decisions/alloy/admin/flags (alloy) |
| `PATCH` | /decisions/alloy/admin/flags/{key} | `alloy_patch_decisions_alloy_admin_flags_key` | [stub] Patch /decisions/alloy/admin/flags/{key} (alloy) |
| `GET` | /decisions/alloy/approvals | `alloy_get_decisions_alloy_approvals` | [stub] List/get /decisions/alloy/approvals (alloy) |
| `POST` | /decisions/alloy/approvals/{id}/decide | `alloy_post_decisions_alloy_approvals_id_decide` | [stub] Create/invoke /decisions/alloy/approvals/{id}/decide (alloy) |
| `GET` | /decisions/alloy/artifacts | `alloy_get_decisions_alloy_artifacts` | [stub] List/get /decisions/alloy/artifacts (alloy) |
| `GET` | /decisions/alloy/artifacts/{id} | `alloy_get_decisions_alloy_artifacts_id` | [stub] List/get /decisions/alloy/artifacts/{id} (alloy) |
| `POST` | /decisions/alloy/artifacts/{id}/approve | `alloy_post_decisions_alloy_artifacts_id_approve` | [stub] Create/invoke /decisions/alloy/artifacts/{id}/approve (alloy) |
| `POST` | /decisions/alloy/artifacts/{id}/reject | `alloy_post_decisions_alloy_artifacts_id_reject` | [stub] Create/invoke /decisions/alloy/artifacts/{id}/reject (alloy) |
| `GET` | /decisions/alloy/audit | `alloy_get_decisions_alloy_audit` | [stub] List/get /decisions/alloy/audit (alloy) |
| `GET` | /decisions/alloy/autonomy-mode | `alloy_get_decisions_alloy_autonomy_mode` | [stub] List/get /decisions/alloy/autonomy-mode (alloy) |
| `PATCH` | /decisions/alloy/autonomy-mode | `alloy_patch_decisions_alloy_autonomy_mode` | [stub] Patch /decisions/alloy/autonomy-mode (alloy) |
| `POST` | /decisions/alloy/autonomy-mode/evaluate | `alloy_post_decisions_alloy_autonomy_mode_evaluate` | [stub] Create/invoke /decisions/alloy/autonomy-mode/evaluate (alloy) |
| `GET` | /decisions/alloy/dashboard | `alloy_get_decisions_alloy_dashboard` | [stub] List/get /decisions/alloy/dashboard (alloy) |
| `GET` | /decisions/alloy/evidence | `alloy_get_decisions_alloy_evidence` | [stub] List/get /decisions/alloy/evidence (alloy) |
| `POST` | /decisions/alloy/evidence | `alloy_post_decisions_alloy_evidence` | [stub] Create/invoke /decisions/alloy/evidence (alloy) |
| `GET` | /decisions/alloy/evidence/{id} | `alloy_get_decisions_alloy_evidence_id` | [stub] List/get /decisions/alloy/evidence/{id} (alloy) |
| `GET` | /decisions/alloy/factory-floor | `alloy_get_decisions_alloy_factory_floor` | [stub] List/get /decisions/alloy/factory-floor (alloy) |
| `POST` | /decisions/alloy/ingest/batch | `alloy_post_decisions_alloy_ingest_batch` | [stub] Create/invoke /decisions/alloy/ingest/batch (alloy) |
| `POST` | /decisions/alloy/ingest/signal | `alloy_post_decisions_alloy_ingest_signal` | [stub] Create/invoke /decisions/alloy/ingest/signal (alloy) |
| `POST` | /decisions/alloy/policy/simulate | `alloy_post_decisions_alloy_policy_simulate` | [stub] Create/invoke /decisions/alloy/policy/simulate (alloy) |
| `POST` | /decisions/alloy/recommend | `alloy_post_decisions_alloy_recommend` | [stub] Create/invoke /decisions/alloy/recommend (alloy) |
| `GET` | /decisions/alloy/runs | `alloy_get_decisions_alloy_runs` | [stub] List/get /decisions/alloy/runs (alloy) |
| `GET` | /decisions/alloy/runs/{id} | `alloy_get_decisions_alloy_runs_id` | [stub] List/get /decisions/alloy/runs/{id} (alloy) |
| `POST` | /decisions/alloy/runs/{id}/cancel | `alloy_post_decisions_alloy_runs_id_cancel` | [stub] Create/invoke /decisions/alloy/runs/{id}/cancel (alloy) |
| `POST` | /decisions/alloy/runs/{id}/retry | `alloy_post_decisions_alloy_runs_id_retry` | [stub] Create/invoke /decisions/alloy/runs/{id}/retry (alloy) |
| `GET` | /decisions/alloy/runs/{id}/steps | `alloy_get_decisions_alloy_runs_id_steps` | [stub] List/get /decisions/alloy/runs/{id}/steps (alloy) |
| `GET` | /decisions/alloy/signals | `alloy_get_decisions_alloy_signals` | [stub] List/get /decisions/alloy/signals (alloy) |
| `GET` | /decisions/alloy/workflows | `alloy_get_decisions_alloy_workflows` | [stub] List/get /decisions/alloy/workflows (alloy) |
| `POST` | /decisions/alloy/workflows | `alloy_post_decisions_alloy_workflows` | [stub] Create/invoke /decisions/alloy/workflows (alloy) |
| `GET` | /decisions/alloy/workflows/{id} | `alloy_get_decisions_alloy_workflows_id` | [stub] List/get /decisions/alloy/workflows/{id} (alloy) |
| `PATCH` | /decisions/alloy/workflows/{id} | `alloy_patch_decisions_alloy_workflows_id` | [stub] Patch /decisions/alloy/workflows/{id} (alloy) |
| `DELETE` | /decisions/alloy/workflows/{id} | `alloy_delete_decisions_alloy_workflows_id` | [stub] Delete /decisions/alloy/workflows/{id} (alloy) |
| `POST` | /decisions/alloy/workflows/{id}/run | `alloy_post_decisions_alloy_workflows_id_run` | [stub] Create/invoke /decisions/alloy/workflows/{id}/run (alloy) |
| `GET` | /decisions/decisions | `alloy_get_decisions_decisions` | [stub] List/get /decisions/decisions (alloy) |
| `POST` | /decisions/decisions | `alloy_post_decisions_decisions` | [stub] Create/invoke /decisions/decisions (alloy) |
| `GET` | /decisions/decisions/{id} | `alloy_get_decisions_decisions_id` | [stub] List/get /decisions/decisions/{id} (alloy) |
| `POST` | /decisions/decisions/{id}/approve | `alloy_post_decisions_decisions_id_approve` | [stub] Create/invoke /decisions/decisions/{id}/approve (alloy) |
| `POST` | /decisions/decisions/{id}/reject | `alloy_post_decisions_decisions_id_reject` | [stub] Create/invoke /decisions/decisions/{id}/reject (alloy) |
| `GET` | /decisions/skills | `alloy_get_decisions_skills` | [stub] List/get /decisions/skills (alloy) |
| `POST` | /decisions/skills | `alloy_post_decisions_skills` | [stub] Create/invoke /decisions/skills (alloy) |
| `GET` | /decisions/skills/{id} | `alloy_get_decisions_skills_id` | [stub] List/get /decisions/skills/{id} (alloy) |
| `PATCH` | /decisions/skills/{id} | `alloy_patch_decisions_skills_id` | [stub] Patch /decisions/skills/{id} (alloy) |
| `GET` | /decisions/skills/{id}/runs | `alloy_get_decisions_skills_id_runs` | [stub] List/get /decisions/skills/{id}/runs (alloy) |
| `GET` | /skills/alloy/admin/flags | `alloy_get_skills_alloy_admin_flags` | [stub] List/get /skills/alloy/admin/flags (alloy) |
| `POST` | /skills/alloy/admin/flags | `alloy_post_skills_alloy_admin_flags` | [stub] Create/invoke /skills/alloy/admin/flags (alloy) |
| `PATCH` | /skills/alloy/admin/flags/{key} | `alloy_patch_skills_alloy_admin_flags_key` | [stub] Patch /skills/alloy/admin/flags/{key} (alloy) |
| `GET` | /skills/alloy/approvals | `alloy_get_skills_alloy_approvals` | [stub] List/get /skills/alloy/approvals (alloy) |
| `POST` | /skills/alloy/approvals/{id}/decide | `alloy_post_skills_alloy_approvals_id_decide` | [stub] Create/invoke /skills/alloy/approvals/{id}/decide (alloy) |
| `GET` | /skills/alloy/artifacts | `alloy_get_skills_alloy_artifacts` | [stub] List/get /skills/alloy/artifacts (alloy) |
| `GET` | /skills/alloy/artifacts/{id} | `alloy_get_skills_alloy_artifacts_id` | [stub] List/get /skills/alloy/artifacts/{id} (alloy) |
| `POST` | /skills/alloy/artifacts/{id}/approve | `alloy_post_skills_alloy_artifacts_id_approve` | [stub] Create/invoke /skills/alloy/artifacts/{id}/approve (alloy) |
| `POST` | /skills/alloy/artifacts/{id}/reject | `alloy_post_skills_alloy_artifacts_id_reject` | [stub] Create/invoke /skills/alloy/artifacts/{id}/reject (alloy) |
| `GET` | /skills/alloy/audit | `alloy_get_skills_alloy_audit` | [stub] List/get /skills/alloy/audit (alloy) |
| `GET` | /skills/alloy/autonomy-mode | `alloy_get_skills_alloy_autonomy_mode` | [stub] List/get /skills/alloy/autonomy-mode (alloy) |
| `PATCH` | /skills/alloy/autonomy-mode | `alloy_patch_skills_alloy_autonomy_mode` | [stub] Patch /skills/alloy/autonomy-mode (alloy) |
| `POST` | /skills/alloy/autonomy-mode/evaluate | `alloy_post_skills_alloy_autonomy_mode_evaluate` | [stub] Create/invoke /skills/alloy/autonomy-mode/evaluate (alloy) |
| `GET` | /skills/alloy/dashboard | `alloy_get_skills_alloy_dashboard` | [stub] List/get /skills/alloy/dashboard (alloy) |
| `GET` | /skills/alloy/evidence | `alloy_get_skills_alloy_evidence` | [stub] List/get /skills/alloy/evidence (alloy) |
| `POST` | /skills/alloy/evidence | `alloy_post_skills_alloy_evidence` | [stub] Create/invoke /skills/alloy/evidence (alloy) |
| `GET` | /skills/alloy/evidence/{id} | `alloy_get_skills_alloy_evidence_id` | [stub] List/get /skills/alloy/evidence/{id} (alloy) |
| `GET` | /skills/alloy/factory-floor | `alloy_get_skills_alloy_factory_floor` | [stub] List/get /skills/alloy/factory-floor (alloy) |
| `POST` | /skills/alloy/ingest/batch | `alloy_post_skills_alloy_ingest_batch` | [stub] Create/invoke /skills/alloy/ingest/batch (alloy) |
| `POST` | /skills/alloy/ingest/signal | `alloy_post_skills_alloy_ingest_signal` | [stub] Create/invoke /skills/alloy/ingest/signal (alloy) |
| `POST` | /skills/alloy/policy/simulate | `alloy_post_skills_alloy_policy_simulate` | [stub] Create/invoke /skills/alloy/policy/simulate (alloy) |
| `POST` | /skills/alloy/recommend | `alloy_post_skills_alloy_recommend` | [stub] Create/invoke /skills/alloy/recommend (alloy) |
| `GET` | /skills/alloy/runs | `alloy_get_skills_alloy_runs` | [stub] List/get /skills/alloy/runs (alloy) |
| `GET` | /skills/alloy/runs/{id} | `alloy_get_skills_alloy_runs_id` | [stub] List/get /skills/alloy/runs/{id} (alloy) |
| `POST` | /skills/alloy/runs/{id}/cancel | `alloy_post_skills_alloy_runs_id_cancel` | [stub] Create/invoke /skills/alloy/runs/{id}/cancel (alloy) |
| `POST` | /skills/alloy/runs/{id}/retry | `alloy_post_skills_alloy_runs_id_retry` | [stub] Create/invoke /skills/alloy/runs/{id}/retry (alloy) |
| `GET` | /skills/alloy/runs/{id}/steps | `alloy_get_skills_alloy_runs_id_steps` | [stub] List/get /skills/alloy/runs/{id}/steps (alloy) |
| `GET` | /skills/alloy/signals | `alloy_get_skills_alloy_signals` | [stub] List/get /skills/alloy/signals (alloy) |
| `GET` | /skills/alloy/workflows | `alloy_get_skills_alloy_workflows` | [stub] List/get /skills/alloy/workflows (alloy) |
| `POST` | /skills/alloy/workflows | `alloy_post_skills_alloy_workflows` | [stub] Create/invoke /skills/alloy/workflows (alloy) |
| `GET` | /skills/alloy/workflows/{id} | `alloy_get_skills_alloy_workflows_id` | [stub] List/get /skills/alloy/workflows/{id} (alloy) |
| `PATCH` | /skills/alloy/workflows/{id} | `alloy_patch_skills_alloy_workflows_id` | [stub] Patch /skills/alloy/workflows/{id} (alloy) |
| `DELETE` | /skills/alloy/workflows/{id} | `alloy_delete_skills_alloy_workflows_id` | [stub] Delete /skills/alloy/workflows/{id} (alloy) |
| `POST` | /skills/alloy/workflows/{id}/run | `alloy_post_skills_alloy_workflows_id_run` | [stub] Create/invoke /skills/alloy/workflows/{id}/run (alloy) |
| `GET` | /skills/decisions | `alloy_get_skills_decisions` | [stub] List/get /skills/decisions (alloy) |
| `POST` | /skills/decisions | `alloy_post_skills_decisions` | [stub] Create/invoke /skills/decisions (alloy) |
| `GET` | /skills/decisions/{id} | `alloy_get_skills_decisions_id` | [stub] List/get /skills/decisions/{id} (alloy) |
| `POST` | /skills/decisions/{id}/approve | `alloy_post_skills_decisions_id_approve` | [stub] Create/invoke /skills/decisions/{id}/approve (alloy) |
| `POST` | /skills/decisions/{id}/reject | `alloy_post_skills_decisions_id_reject` | [stub] Create/invoke /skills/decisions/{id}/reject (alloy) |
| `GET` | /skills/skills | `alloy_get_skills_skills` | [stub] List/get /skills/skills (alloy) |
| `POST` | /skills/skills | `alloy_post_skills_skills` | [stub] Create/invoke /skills/skills (alloy) |
| `GET` | /skills/skills/{id} | `alloy_get_skills_skills_id` | [stub] List/get /skills/skills/{id} (alloy) |
| `PATCH` | /skills/skills/{id} | `alloy_patch_skills_skills_id` | [stub] Patch /skills/skills/{id} (alloy) |
| `GET` | /skills/skills/{id}/runs | `alloy_get_skills_skills_id_runs` | [stub] List/get /skills/skills/{id}/runs (alloy) |

<a id="decisions"></a>

## decisions

Platform-level decision engine — create, approve, and reject autonomous decisions

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `POST` | /decisioning/evaluate | `evaluateDecisionSignals` | Evaluate signals into ranked recommendations |
| `POST` | /decisioning/execute | `executeDecisionWorkflow` | Execute a decision workflow |
| `POST` | /decisioning/runs/{runId}/outcome | `recordDecisionOutcome` | Record the outcome of a decision run |
| `POST` | /decisioning/runs/{runId}/prove | `proveDecisionRun` | Record proof for a decision run |
| `GET` | /decisions | `listPlatformDecisions` | List platform-level decisions |
| `POST` | /decisions | `createPlatformDecision` | Create a platform-level decision |
| `GET` | /decisions/{id} | `getPlatformDecision` | Get a platform-level decision by ID |
| `POST` | /decisions/{id}/approve | `approvePlatformDecision` | Approve a platform-level decision |
| `POST` | /decisions/{id}/reject | `rejectPlatformDecision` | Reject a platform-level decision |

<a id="skills"></a>

## skills

Skill library — AI agent skill definitions, runs, and lifecycle management

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /skill-runs/skill-runs/{runId} | `skills_get_skill_runs_skill_runs_runId` | [stub] List/get /skill-runs/skill-runs/{runId} (skills) |
| `GET` | /skill-runs/skills | `skills_get_skill_runs_skills` | [stub] List/get /skill-runs/skills (skills) |
| `GET` | /skill-runs/skills/{id} | `skills_get_skill_runs_skills_id` | [stub] List/get /skill-runs/skills/{id} (skills) |
| `POST` | /skill-runs/skills/{id}/run | `skills_post_skill_runs_skills_id_run` | [stub] Create/invoke /skill-runs/skills/{id}/run (skills) |
| `GET` | /skill-runs/skills/{id}/runs | `skills_get_skill_runs_skills_id_runs` | [stub] List/get /skill-runs/skills/{id}/runs (skills) |
| `GET` | /skills | `listSkills` | List available agent skills |
| `POST` | /skills | `createSkill` | Create a new agent skill definition |
| `GET` | /skills/{id} | `getSkill` | Get an agent skill by ID |
| `PATCH` | /skills/{id} | `updateSkill` | Update an agent skill |
| `GET` | /skills/{id}/runs | `getSkillRuns` | List execution runs for a skill |
| `GET` | /skills/skill-runs/{runId} | `skills_get_skills_skill_runs_runId` | [stub] List/get /skills/skill-runs/{runId} (skills) |
| `POST` | /skills/skills/{id}/run | `skills_post_skills_skills_id_run` | [stub] Create/invoke /skills/skills/{id}/run (skills) |

<a id="admin"></a>

## admin

Platform administration — users, roles, audit log, impersonation, and feature flags

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /admin/audit-log | `getAdminAuditLog` | Get the platform audit log (admin) |
| `GET` | /admin/export-history | `getAdminExportHistory` | Get export job history (admin) |
| `GET` | /admin/feature-flags | `listAdminFeatureFlags` | List all feature flags (admin) |
| `PUT` | /admin/feature-flags/{key} | `setAdminFeatureFlag` | Enable or disable a feature flag (admin) |
| `POST` | /admin/impersonate/{userId} | `impersonateUser` | Start impersonating a user (admin) |
| `POST` | /admin/impersonate/end | `endImpersonation` | End the current impersonation session |
| `GET` | /admin/roles | `listAdminRoles` | List all platform roles |
| `DELETE` | /admin/sessions/{userId} | `revokeUserSessions` | Revoke all sessions for a user (admin) |
| `GET` | /admin/users | `listAdminUsers` | List all platform users (admin) |
| `POST` | /admin/users | `createAdminUser` | Create a platform user (admin) |
| `PATCH` | /admin/users/{id}/deactivate | `deactivateAdminUser` | Deactivate a user account |
| `GET` | /admin/users/{id}/detail | `getAdminUserDetail` | Get detailed profile for a user (admin) |
| `PATCH` | /admin/users/{id}/role | `setAdminUserRole` | Set a user's primary role |
| `PUT` | /admin/users/{userId}/roles | `assignAdminUserRoles` | Assign multiple roles to a user (super admin) |

<a id="reports"></a>

## reports

Report builder — templates, generation, approval workflow, distribution, and scheduling

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /reports | `listReports` | List generated reports |
| `GET` | /reports/{reportId} | `getReport` | Get a report by ID |
| `GET` | /reports/{reportId}/approval | `getReportApproval` | Get approval status for a report |
| `POST` | /reports/{reportId}/distribute | `distributeReport` | Distribute a report to recipients |
| `GET` | /reports/{reportId}/distributions | `listReportDistributions` | List distribution history for a report |
| `GET` | /reports/{reportId}/pdf | `downloadReportPDF` | Download a report as PDF |
| `POST` | /reports/{reportId}/request-approval | `requestReportApproval` | Submit a report for approval review |
| `POST` | /reports/{reportId}/review | `submitReportReview` | Submit a compliance review for a report |
| `PATCH` | /reports/{reportId}/status | `updateReportStatus` | Update a report status |
| `GET` | /reports/{reportId}/versions | `listReportVersions` | List version history for a report |
| `POST` | /reports/generate | `generateReport` | Generate a report from a template |
| `POST` | /reports/narrative | `generateReportNarrative` | Generate an AI narrative section for a report |
| `GET` | /reports/reports | `reports_get_reports_reports` | [stub] List/get /reports/reports (reports) |
| `GET` | /reports/reports/{reportId} | `reports_get_reports_reports_reportId` | [stub] List/get /reports/reports/{reportId} (reports) |
| `GET` | /reports/reports/{reportId}/approval | `reports_get_reports_reports_reportId_approval` | [stub] List/get /reports/reports/{reportId}/approval (reports) |
| `POST` | /reports/reports/{reportId}/distribute | `reports_post_reports_reports_reportId_distribute` | [stub] Create/invoke /reports/reports/{reportId}/distribute (reports) |
| `GET` | /reports/reports/{reportId}/distributions | `reports_get_reports_reports_reportId_distributions` | [stub] List/get /reports/reports/{reportId}/distributions (reports) |
| `GET` | /reports/reports/{reportId}/pdf | `reports_get_reports_reports_reportId_pdf` | [stub] List/get /reports/reports/{reportId}/pdf (reports) |
| `POST` | /reports/reports/{reportId}/request-approval | `reports_post_reports_reports_reportId_request_approval` | [stub] Create/invoke /reports/reports/{reportId}/request-approval (reports) |
| `POST` | /reports/reports/{reportId}/review | `reports_post_reports_reports_reportId_review` | [stub] Create/invoke /reports/reports/{reportId}/review (reports) |
| `PATCH` | /reports/reports/{reportId}/status | `reports_patch_reports_reports_reportId_status` | [stub] Patch /reports/reports/{reportId}/status (reports) |
| `GET` | /reports/reports/{reportId}/versions | `reports_get_reports_reports_reportId_versions` | [stub] List/get /reports/reports/{reportId}/versions (reports) |
| `GET` | /reports/reports/brand-themes | `reports_get_reports_reports_brand_themes` | [stub] List/get /reports/reports/brand-themes (reports) |
| `POST` | /reports/reports/generate | `reports_post_reports_reports_generate` | [stub] Create/invoke /reports/reports/generate (reports) |
| `POST` | /reports/reports/narrative | `reports_post_reports_reports_narrative` | [stub] Create/invoke /reports/reports/narrative (reports) |
| `GET` | /reports/reports/schedules | `reports_get_reports_reports_schedules` | [stub] List/get /reports/reports/schedules (reports) |
| `POST` | /reports/reports/schedules | `reports_post_reports_reports_schedules` | [stub] Create/invoke /reports/reports/schedules (reports) |
| `PATCH` | /reports/reports/schedules/{scheduleId} | `reports_patch_reports_reports_schedules_scheduleId` | [stub] Patch /reports/reports/schedules/{scheduleId} (reports) |
| `POST` | /reports/reports/schedules/{scheduleId}/run | `reports_post_reports_reports_schedules_scheduleId_run` | [stub] Create/invoke /reports/reports/schedules/{scheduleId}/run (reports) |
| `POST` | /reports/reports/schedules/run-due | `reports_post_reports_reports_schedules_run_due` | [stub] Create/invoke /reports/reports/schedules/run-due (reports) |
| `GET` | /reports/reports/stats | `reports_get_reports_reports_stats` | [stub] List/get /reports/reports/stats (reports) |
| `GET` | /reports/reports/templates | `reports_get_reports_reports_templates` | [stub] List/get /reports/reports/templates (reports) |
| `POST` | /reports/reports/templates | `reports_post_reports_reports_templates` | [stub] Create/invoke /reports/reports/templates (reports) |
| `GET` | /reports/reports/templates/{templateId} | `reports_get_reports_reports_templates_templateId` | [stub] List/get /reports/reports/templates/{templateId} (reports) |
| `PATCH` | /reports/reports/templates/{templateId} | `reports_patch_reports_reports_templates_templateId` | [stub] Patch /reports/reports/templates/{templateId} (reports) |
| `GET` | /reports/reports/templates/built-in | `reports_get_reports_reports_templates_built_in` | [stub] List/get /reports/reports/templates/built-in (reports) |
| `GET` | /reports/reports/templates/built-in/{key} | `reports_get_reports_reports_templates_built_in_key` | [stub] List/get /reports/reports/templates/built-in/{key} (reports) |
| `GET` | /reports/schedules | `listReportSchedules` | List scheduled report jobs |
| `GET` | /reports/stats | `getReportStats` | Get report generation statistics |
| `GET` | /reports/templates | `listReportTemplates` | List custom report templates |
| `POST` | /reports/templates | `createReportTemplate` | Create a report template |
| `GET` | /reports/templates/{templateId} | `getReportTemplate` | Get a report template by ID |
| `PATCH` | /reports/templates/{templateId} | `updateReportTemplate` | Update a report template |
| `GET` | /reports/templates/built-in | `listBuiltInReportTemplates` | List built-in report templates |
| `GET` | /reports/templates/built-in/{key} | `getBuiltInReportTemplate` | Get a built-in report template by key |

<a id="exports"></a>

## exports

Data export builder — domain-specific exports, download history, and preview

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `POST` | /exports/aegis-incidents | `exportAegisIncidents` | Export Aegis security incidents |
| `POST` | /exports/audit-log | `exportAuditLog` | Export platform audit log to CSV/JSON |
| `GET` | /exports/download/{token} | `downloadExport` | Download an export file by one-time token |
| `POST` | /exports/exports/aegis-incidents | `exports_post_exports_exports_aegis_incidents` | [stub] Create/invoke /exports/exports/aegis-incidents (exports) |
| `POST` | /exports/exports/audit-log | `exports_post_exports_exports_audit_log` | [stub] Create/invoke /exports/exports/audit-log (exports) |
| `GET` | /exports/exports/download/{token} | `exports_get_exports_exports_download_token` | [stub] List/get /exports/exports/download/{token} (exports) |
| `POST` | /exports/exports/enqueue | `exports_post_exports_exports_enqueue` | [stub] Create/invoke /exports/exports/enqueue (exports) |
| `GET` | /exports/exports/history | `exports_get_exports_exports_history` | [stub] List/get /exports/exports/history (exports) |
| `GET` | /exports/exports/jobs/{exportId} | `exports_get_exports_exports_jobs_exportId` | [stub] List/get /exports/exports/jobs/{exportId} (exports) |
| `GET` | /exports/exports/jobs/{exportId}/download | `exports_get_exports_exports_jobs_exportId_download` | [stub] List/get /exports/exports/jobs/{exportId}/download (exports) |
| `POST` | /exports/exports/lyte-signals | `exports_post_exports_exports_lyte_signals` | [stub] Create/invoke /exports/exports/lyte-signals (exports) |
| `POST` | /exports/exports/msp-tickets | `exports_post_exports_exports_msp_tickets` | [stub] Create/invoke /exports/exports/msp-tickets (exports) |
| `GET` | /exports/exports/preview | `exports_get_exports_exports_preview` | [stub] List/get /exports/exports/preview (exports) |
| `POST` | /exports/exports/revenue-events | `exports_post_exports_exports_revenue_events` | [stub] Create/invoke /exports/exports/revenue-events (exports) |
| `POST` | /exports/exports/terra-deals | `exports_post_exports_exports_terra_deals` | [stub] Create/invoke /exports/exports/terra-deals (exports) |
| `POST` | /exports/exports/usage-metering | `exports_post_exports_exports_usage_metering` | [stub] Create/invoke /exports/exports/usage-metering (exports) |
| `POST` | /exports/exports/vessels | `exports_post_exports_exports_vessels` | [stub] Create/invoke /exports/exports/vessels (exports) |
| `GET` | /exports/history | `listExportHistory` | List past export jobs and download links |
| `POST` | /exports/lyte-signals | `exportLyteSignals` | Export Lyte e-commerce signals |
| `POST` | /exports/msp-tickets | `exportMSPTickets` | Export MSP support tickets |
| `GET` | /exports/preview | `previewExport` | Preview export data before download (first 100 rows) |
| `POST` | /exports/revenue-events | `exportRevenueEvents` | Export revenue events from billing |
| `POST` | /exports/terra-deals | `exportTerraDeals` | Export Terra real estate deals |
| `POST` | /exports/usage-metering | `exportUsageMetering` | Export usage metering records |
| `POST` | /exports/vessels | `exportVesselsData` | Export Vessels maritime data |

<a id="webhooks"></a>

## webhooks

Webhook management — register endpoints, list deliveries, and receive Stripe-style signed event notifications for decision lifecycle events

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /webhooks | `listWebhooks` | List registered webhook endpoints |
| `POST` | /webhooks | `registerWebhook` | Register a webhook endpoint |
| `GET` | /webhooks/deliveries | `listWebhookDeliveries` | List webhook delivery attempts |
| `GET` | /webhooks/endpoints | `listWebhookEndpoints` | List registered webhook endpoints (verbose path) |
| `POST` | /webhooks/endpoints | `registerWebhookEndpoint` | Register a webhook endpoint (verbose path) |
| `PATCH` | /webhooks/endpoints/{id} | `updateWebhookEndpoint` | Update a webhook endpoint |
| `DELETE` | /webhooks/endpoints/{id} | `deleteWebhookEndpoint` | Delete a webhook endpoint |
| `POST` | /webhooks/endpoints/{id}/ping | `pingWebhookEndpoint` | Send a test ping to a webhook endpoint |
| `GET` | /webhooks/event-types | `listWebhookEventTypes` | List all supported webhook event types |
| `GET` | /webhooks/webhooks | `webhooks_get_webhooks_webhooks` | [stub] List/get /webhooks/webhooks (webhooks) |
| `POST` | /webhooks/webhooks | `webhooks_post_webhooks_webhooks` | [stub] Create/invoke /webhooks/webhooks (webhooks) |
| `GET` | /webhooks/webhooks/deliveries | `webhooks_get_webhooks_webhooks_deliveries` | [stub] List/get /webhooks/webhooks/deliveries (webhooks) |
| `GET` | /webhooks/webhooks/endpoints | `webhooks_get_webhooks_webhooks_endpoints` | [stub] List/get /webhooks/webhooks/endpoints (webhooks) |
| `POST` | /webhooks/webhooks/endpoints | `webhooks_post_webhooks_webhooks_endpoints` | [stub] Create/invoke /webhooks/webhooks/endpoints (webhooks) |
| `PATCH` | /webhooks/webhooks/endpoints/{id} | `webhooks_patch_webhooks_webhooks_endpoints_id` | [stub] Patch /webhooks/webhooks/endpoints/{id} (webhooks) |
| `DELETE` | /webhooks/webhooks/endpoints/{id} | `webhooks_delete_webhooks_webhooks_endpoints_id` | [stub] Delete /webhooks/webhooks/endpoints/{id} (webhooks) |
| `POST` | /webhooks/webhooks/endpoints/{id}/ping | `webhooks_post_webhooks_webhooks_endpoints_id_ping` | [stub] Create/invoke /webhooks/webhooks/endpoints/{id}/ping (webhooks) |
| `GET` | /webhooks/webhooks/event-types | `webhooks_get_webhooks_webhooks_event_types` | [stub] List/get /webhooks/webhooks/event-types (webhooks) |

<a id="atlas"></a>

## atlas

ATLAS Spatial Runtime — scene snapshot, branch, proof bundle, and OpenUSD manifest exports.
All ATLAS routes are gated by the `ENABLE_ATLAS_SPATIAL_RUNTIME` platform feature flag and
will return `503 FEATURE_DISABLED` when the flag is off.


| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `POST` | /atlas/branch/export | `exportAtlasBranchPackage` | Export an ATLAS branch package |
| `GET` | /atlas/export/openusd/{sceneId} | `exportAtlasOpenUSDManifest` | Export an OpenUSD manifest for an ATLAS scene |
| `POST` | /atlas/proof-bundle/export | `exportAtlasProofBundle` | Export an ATLAS proof bundle |
| `GET` | /atlas/snapshot/{sceneId} | `exportAtlasSnapshot` | Export an ATLAS scene snapshot |

<a id="act"></a>

## act

Auto-generated tag for act route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `POST` | /act/control-tower/act/compose | `act_post_act_control_tower_act_compose` | [stub] Create/invoke /act/control-tower/act/compose (act) |
| `GET` | /act/control-tower/act/pipelines | `act_get_act_control_tower_act_pipelines` | [stub] List/get /act/control-tower/act/pipelines (act) |
| `GET` | /act/control-tower/act/pipelines/{id} | `act_get_act_control_tower_act_pipelines_id` | [stub] List/get /act/control-tower/act/pipelines/{id} (act) |
| `POST` | /act/control-tower/act/pipelines/{id}/run | `act_post_act_control_tower_act_pipelines_id_run` | [stub] Create/invoke /act/control-tower/act/pipelines/{id}/run (act) |

<a id="action-store"></a>

## action-store

Auto-generated tag for action-store route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /action-store/action-store | `action_store_get_action_store_action_store` | [stub] List/get /action-store/action-store (action-store) |
| `PATCH` | /action-store/action-store | `action_store_patch_action_store_action_store` | [stub] Patch /action-store/action-store (action-store) |
| `GET` | /action-store/action-store/stream | `action_store_get_action_store_action_store_stream` | [stub] List/get /action-store/action-store/stream (action-store) |

<a id="actions"></a>

## actions

Auto-generated tag for actions route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /actions/rmm/actions | `actions_get_actions_rmm_actions` | [stub] List/get /actions/rmm/actions (actions) |
| `POST` | /actions/rmm/actions | `actions_post_actions_rmm_actions` | [stub] Create/invoke /actions/rmm/actions (actions) |
| `POST` | /actions/rmm/actions/{id}/approve | `actions_post_actions_rmm_actions_id_approve` | [stub] Create/invoke /actions/rmm/actions/{id}/approve (actions) |
| `POST` | /actions/rmm/actions/{id}/cancel | `actions_post_actions_rmm_actions_id_cancel` | [stub] Create/invoke /actions/rmm/actions/{id}/cancel (actions) |

<a id="aegis-digital-twin"></a>

## aegis-digital-twin

Auto-generated tag for aegis-digital-twin route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /aegis/aegis/scenarios/{scenarioId}/export | `aegis_digital_twin_get_aegis_aegis_scenarios_scenarioId_export` | [stub] List/get /aegis/aegis/scenarios/{scenarioId}/export (aegis-digital-twin) |
| `POST` | /aegis/aegis/scenarios/export | `aegis_digital_twin_post_aegis_aegis_scenarios_export` | [stub] Create/invoke /aegis/aegis/scenarios/export (aegis-digital-twin) |
| `GET` | /aegis/aegis/scenarios/library | `aegis_digital_twin_get_aegis_aegis_scenarios_library` | [stub] List/get /aegis/aegis/scenarios/library (aegis-digital-twin) |

<a id="aegis-intel"></a>

## aegis-intel

Auto-generated tag for aegis-intel route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /inca/inca/dashboard | `aegis_intel_get_inca_inca_dashboard` | [stub] List/get /inca/inca/dashboard (aegis-intel) |
| `GET` | /inca/inca/experiments | `aegis_intel_get_inca_inca_experiments` | [stub] List/get /inca/inca/experiments (aegis-intel) |
| `POST` | /inca/inca/experiments | `aegis_intel_post_inca_inca_experiments` | [stub] Create/invoke /inca/inca/experiments (aegis-intel) |
| `PATCH` | /inca/inca/experiments/{id} | `aegis_intel_patch_inca_inca_experiments_id` | [stub] Patch /inca/inca/experiments/{id} (aegis-intel) |
| `DELETE` | /inca/inca/experiments/{id} | `aegis_intel_delete_inca_inca_experiments_id` | [stub] Delete /inca/inca/experiments/{id} (aegis-intel) |
| `GET` | /inca/inca/health | `aegis_intel_get_inca_inca_health` | [stub] List/get /inca/inca/health (aegis-intel) |
| `GET` | /inca/inca/insights | `aegis_intel_get_inca_inca_insights` | [stub] List/get /inca/inca/insights (aegis-intel) |
| `POST` | /inca/inca/insights | `aegis_intel_post_inca_inca_insights` | [stub] Create/invoke /inca/inca/insights (aegis-intel) |
| `DELETE` | /inca/inca/insights/{id} | `aegis_intel_delete_inca_inca_insights_id` | [stub] Delete /inca/inca/insights/{id} (aegis-intel) |
| `GET` | /inca/inca/live/arxiv | `aegis_intel_get_inca_inca_live_arxiv` | [stub] List/get /inca/inca/live/arxiv (aegis-intel) |
| `GET` | /inca/inca/live/huggingface-models | `aegis_intel_get_inca_inca_live_huggingface_models` | [stub] List/get /inca/inca/live/huggingface-models (aegis-intel) |
| `GET` | /inca/inca/live/paperswithcode | `aegis_intel_get_inca_inca_live_paperswithcode` | [stub] List/get /inca/inca/live/paperswithcode (aegis-intel) |
| `GET` | /inca/inca/live/research-trends | `aegis_intel_get_inca_inca_live_research_trends` | [stub] List/get /inca/inca/live/research-trends (aegis-intel) |
| `GET` | /inca/inca/live/semantic-scholar | `aegis_intel_get_inca_inca_live_semantic_scholar` | [stub] List/get /inca/inca/live/semantic-scholar (aegis-intel) |
| `GET` | /inca/inca/models | `aegis_intel_get_inca_inca_models` | [stub] List/get /inca/inca/models (aegis-intel) |
| `POST` | /inca/inca/models | `aegis_intel_post_inca_inca_models` | [stub] Create/invoke /inca/inca/models (aegis-intel) |
| `PATCH` | /inca/inca/models/{id} | `aegis_intel_patch_inca_inca_models_id` | [stub] Patch /inca/inca/models/{id} (aegis-intel) |
| `DELETE` | /inca/inca/models/{id} | `aegis_intel_delete_inca_inca_models_id` | [stub] Delete /inca/inca/models/{id} (aegis-intel) |
| `GET` | /inca/inca/projects | `aegis_intel_get_inca_inca_projects` | [stub] List/get /inca/inca/projects (aegis-intel) |
| `POST` | /inca/inca/projects | `aegis_intel_post_inca_inca_projects` | [stub] Create/invoke /inca/inca/projects (aegis-intel) |
| `GET` | /inca/inca/projects/{id} | `aegis_intel_get_inca_inca_projects_id` | [stub] List/get /inca/inca/projects/{id} (aegis-intel) |
| `PATCH` | /inca/inca/projects/{id} | `aegis_intel_patch_inca_inca_projects_id` | [stub] Patch /inca/inca/projects/{id} (aegis-intel) |
| `DELETE` | /inca/inca/projects/{id} | `aegis_intel_delete_inca_inca_projects_id` | [stub] Delete /inca/inca/projects/{id} (aegis-intel) |
| `GET` | /inca/inca/projects/{id}/experiments | `aegis_intel_get_inca_inca_projects_id_experiments` | [stub] List/get /inca/inca/projects/{id}/experiments (aegis-intel) |
| `GET` | /inca/inca/projects/{id}/models | `aegis_intel_get_inca_inca_projects_id_models` | [stub] List/get /inca/inca/projects/{id}/models (aegis-intel) |
| `GET` | /inca/inca/provider/models | `aegis_intel_get_inca_inca_provider_models` | [stub] List/get /inca/inca/provider/models (aegis-intel) |
| `GET` | /inca/inca/provider/models/{id} | `aegis_intel_get_inca_inca_provider_models_id` | [stub] List/get /inca/inca/provider/models/{id} (aegis-intel) |
| `GET` | /inca/inca/search | `aegis_intel_get_inca_inca_search` | [stub] List/get /inca/inca/search (aegis-intel) |

<a id="aegis-modules"></a>

## aegis-modules

Auto-generated tag for aegis-modules route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /aegis/aegis/action-queue | `aegis_modules_get_aegis_aegis_action_queue` | [stub] List/get /aegis/aegis/action-queue (aegis-modules) |
| `POST` | /aegis/aegis/action-queue | `aegis_modules_post_aegis_aegis_action_queue` | [stub] Create/invoke /aegis/aegis/action-queue (aegis-modules) |
| `POST` | /aegis/aegis/action-queue/{id}/complete | `aegis_modules_post_aegis_aegis_action_queue_id_complete` | [stub] Create/invoke /aegis/aegis/action-queue/{id}/complete (aegis-modules) |
| `POST` | /aegis/aegis/action-queue/{id}/escalate | `aegis_modules_post_aegis_aegis_action_queue_id_escalate` | [stub] Create/invoke /aegis/aegis/action-queue/{id}/escalate (aegis-modules) |
| `GET` | /aegis/aegis/deception/events | `aegis_modules_get_aegis_aegis_deception_events` | [stub] List/get /aegis/aegis/deception/events (aegis-modules) |
| `POST` | /aegis/aegis/deception/events/{id}/push-ioc | `aegis_modules_post_aegis_aegis_deception_events_id_push_ioc` | [stub] Create/invoke /aegis/aegis/deception/events/{id}/push-ioc (aegis-modules) |
| `GET` | /aegis/aegis/deception/honeypots | `aegis_modules_get_aegis_aegis_deception_honeypots` | [stub] List/get /aegis/aegis/deception/honeypots (aegis-modules) |
| `POST` | /aegis/aegis/deception/honeypots | `aegis_modules_post_aegis_aegis_deception_honeypots` | [stub] Create/invoke /aegis/aegis/deception/honeypots (aegis-modules) |
| `GET` | /aegis/aegis/digital-twin/scenarios | `aegis_modules_get_aegis_aegis_digital_twin_scenarios` | [stub] List/get /aegis/aegis/digital-twin/scenarios (aegis-modules) |
| `POST` | /aegis/aegis/digital-twin/scenarios/{id}/pause | `aegis_modules_post_aegis_aegis_digital_twin_scenarios_id_pause` | [stub] Create/invoke /aegis/aegis/digital-twin/scenarios/{id}/pause (aegis-modules) |
| `POST` | /aegis/aegis/digital-twin/scenarios/{id}/resume | `aegis_modules_post_aegis_aegis_digital_twin_scenarios_id_resume` | [stub] Create/invoke /aegis/aegis/digital-twin/scenarios/{id}/resume (aegis-modules) |
| `POST` | /aegis/aegis/digital-twin/scenarios/{id}/run | `aegis_modules_post_aegis_aegis_digital_twin_scenarios_id_run` | [stub] Create/invoke /aegis/aegis/digital-twin/scenarios/{id}/run (aegis-modules) |
| `POST` | /aegis/aegis/digital-twin/sync | `aegis_modules_post_aegis_aegis_digital_twin_sync` | [stub] Create/invoke /aegis/aegis/digital-twin/sync (aegis-modules) |
| `GET` | /aegis/aegis/digital-twin/topology | `aegis_modules_get_aegis_aegis_digital_twin_topology` | [stub] List/get /aegis/aegis/digital-twin/topology (aegis-modules) |
| `POST` | /aegis/aegis/soar-builder/execute | `aegis_modules_post_aegis_aegis_soar_builder_execute` | [stub] Create/invoke /aegis/aegis/soar-builder/execute (aegis-modules) |
| `GET` | /aegis/aegis/soar-builder/playbooks | `aegis_modules_get_aegis_aegis_soar_builder_playbooks` | [stub] List/get /aegis/aegis/soar-builder/playbooks (aegis-modules) |
| `POST` | /aegis/aegis/soar-builder/playbooks | `aegis_modules_post_aegis_aegis_soar_builder_playbooks` | [stub] Create/invoke /aegis/aegis/soar-builder/playbooks (aegis-modules) |
| `GET` | /aegis/aegis/soar-builder/playbooks/{id} | `aegis_modules_get_aegis_aegis_soar_builder_playbooks_id` | [stub] List/get /aegis/aegis/soar-builder/playbooks/{id} (aegis-modules) |
| `PUT` | /aegis/aegis/soar-builder/playbooks/{id} | `aegis_modules_put_aegis_aegis_soar_builder_playbooks_id` | [stub] Update /aegis/aegis/soar-builder/playbooks/{id} (aegis-modules) |
| `DELETE` | /aegis/aegis/soar-builder/playbooks/{id} | `aegis_modules_delete_aegis_aegis_soar_builder_playbooks_id` | [stub] Delete /aegis/aegis/soar-builder/playbooks/{id} (aegis-modules) |
| `GET` | /aegis/aegis/soar-builder/runs | `aegis_modules_get_aegis_aegis_soar_builder_runs` | [stub] List/get /aegis/aegis/soar-builder/runs (aegis-modules) |

<a id="aegis-pcap"></a>

## aegis-pcap

Auto-generated tag for aegis-pcap route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `POST` | /aegis/aegis/replay/pcap | `aegis_pcap_post_aegis_aegis_replay_pcap` | [stub] Create/invoke /aegis/aegis/replay/pcap (aegis-pcap) |
| `POST` | /aegis/aegis/replay/pcapng | `aegis_pcap_post_aegis_aegis_replay_pcapng` | [stub] Create/invoke /aegis/aegis/replay/pcapng (aegis-pcap) |

<a id="agent-autonomy"></a>

## agent-autonomy

Auto-generated tag for agent-autonomy route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /agent-autonomy/agent-autonomy/agents | `agent_autonomy_get_agent_autonomy_agent_autonomy_agents` | [stub] List/get /agent-autonomy/agent-autonomy/agents (agent-autonomy) |
| `GET` | /agent-autonomy/agent-autonomy/agents/{agentId}/reflection | `agent_autonomy_get_agent_autonomy_agent_autonomy_agents_agentId_reflection` | [stub] List/get /agent-autonomy/agent-autonomy/agents/{agentId}/reflection (agent-autonomy) |
| `GET` | /agent-autonomy/agent-autonomy/connectors | `agent_autonomy_get_agent_autonomy_agent_autonomy_connectors` | [stub] List/get /agent-autonomy/agent-autonomy/connectors (agent-autonomy) |
| `POST` | /agent-autonomy/agent-autonomy/connectors/{connectorId}/health | `agent_autonomy_post_agent_autonomy_agent_autonomy_connectors_connectorId_health` | [stub] Create/invoke /agent-autonomy/agent-autonomy/connectors/{connectorId}/health (agent-autonomy) |
| `GET` | /agent-autonomy/agent-autonomy/delegations | `agent_autonomy_get_agent_autonomy_agent_autonomy_delegations` | [stub] List/get /agent-autonomy/agent-autonomy/delegations (agent-autonomy) |
| `GET` | /agent-autonomy/agent-autonomy/overview | `agent_autonomy_get_agent_autonomy_agent_autonomy_overview` | [stub] List/get /agent-autonomy/agent-autonomy/overview (agent-autonomy) |
| `GET` | /agent-autonomy/agent-autonomy/performance | `agent_autonomy_get_agent_autonomy_agent_autonomy_performance` | [stub] List/get /agent-autonomy/agent-autonomy/performance (agent-autonomy) |
| `GET` | /agent-autonomy/agent-autonomy/rag | `agent_autonomy_get_agent_autonomy_agent_autonomy_rag` | [stub] List/get /agent-autonomy/agent-autonomy/rag (agent-autonomy) |
| `POST` | /agent-autonomy/agent-autonomy/rag/ingest | `agent_autonomy_post_agent_autonomy_agent_autonomy_rag_ingest` | [stub] Create/invoke /agent-autonomy/agent-autonomy/rag/ingest (agent-autonomy) |
| `GET` | /agent-autonomy/agent-autonomy/skills | `agent_autonomy_get_agent_autonomy_agent_autonomy_skills` | [stub] List/get /agent-autonomy/agent-autonomy/skills (agent-autonomy) |

<a id="agent-mesh"></a>

## agent-mesh

Auto-generated tag for agent-mesh route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `POST` | /agent-mesh/agent-mesh/drift/{id}/approve | `agent_mesh_post_agent_mesh_agent_mesh_drift_id_approve` | [stub] Create/invoke /agent-mesh/agent-mesh/drift/{id}/approve (agent-mesh) |
| `POST` | /agent-mesh/agent-mesh/drift/{id}/rollback | `agent_mesh_post_agent_mesh_agent_mesh_drift_id_rollback` | [stub] Create/invoke /agent-mesh/agent-mesh/drift/{id}/rollback (agent-mesh) |
| `GET` | /agent-mesh/agent-mesh/gateway | `agent_mesh_get_agent_mesh_agent_mesh_gateway` | [stub] List/get /agent-mesh/agent-mesh/gateway (agent-mesh) |
| `GET` | /agent-mesh/agent-mesh/gateway/export.csv | `agent_mesh_get_agent_mesh_agent_mesh_gateway_export_csv` | [stub] List/get /agent-mesh/agent-mesh/gateway/export.csv (agent-mesh) |
| `GET` | /agent-mesh/agent-mesh/gateway/latency | `agent_mesh_get_agent_mesh_agent_mesh_gateway_latency` | [stub] List/get /agent-mesh/agent-mesh/gateway/latency (agent-mesh) |
| `GET` | /agent-mesh/agent-mesh/gateway/stream | `agent_mesh_get_agent_mesh_agent_mesh_gateway_stream` | [stub] List/get /agent-mesh/agent-mesh/gateway/stream (agent-mesh) |
| `GET` | /agent-mesh/agent-mesh/index | `agent_mesh_get_agent_mesh_agent_mesh_index` | [stub] List/get /agent-mesh/agent-mesh/index (agent-mesh) |
| `POST` | /agent-mesh/agent-mesh/scan | `agent_mesh_post_agent_mesh_agent_mesh_scan` | [stub] Create/invoke /agent-mesh/agent-mesh/scan (agent-mesh) |
| `GET` | /agent-mesh/agent-mesh/state | `agent_mesh_get_agent_mesh_agent_mesh_state` | [stub] List/get /agent-mesh/agent-mesh/state (agent-mesh) |

<a id="agents"></a>

## agents

Auto-generated tag for agents route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `POST` | /agents/agents/approvals/{runId}/{stepId}/resolve | `agents_post_agents_agents_approvals_runId_stepId_resolve` | [stub] Create/invoke /agents/agents/approvals/{runId}/{stepId}/resolve (agents) |
| `GET` | /agents/agents/approvals/pending | `agents_get_agents_agents_approvals_pending` | [stub] List/get /agents/agents/approvals/pending (agents) |
| `GET` | /agents/agents/evals/auto-suites | `agents_get_agents_agents_evals_auto_suites` | [stub] List/get /agents/agents/evals/auto-suites (agents) |
| `GET` | /agents/agents/runs/{runId}/step-log | `agents_get_agents_agents_runs_runId_step_log` | [stub] List/get /agents/agents/runs/{runId}/step-log (agents) |

<a id="ai-ops-dashboard"></a>

## ai-ops-dashboard

Auto-generated tag for ai-ops-dashboard route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /ai/ai/ops/circuit-breaker | `ai_ops_dashboard_get_ai_ai_ops_circuit_breaker` | [stub] List/get /ai/ai/ops/circuit-breaker (ai-ops-dashboard) |
| `GET` | /ai/ai/ops/cost/budget | `ai_ops_dashboard_get_ai_ai_ops_cost_budget` | [stub] List/get /ai/ai/ops/cost/budget (ai-ops-dashboard) |
| `GET` | /ai/ai/ops/cost/records | `ai_ops_dashboard_get_ai_ai_ops_cost_records` | [stub] List/get /ai/ai/ops/cost/records (ai-ops-dashboard) |
| `GET` | /ai/ai/ops/cost/summary | `ai_ops_dashboard_get_ai_ai_ops_cost_summary` | [stub] List/get /ai/ai/ops/cost/summary (ai-ops-dashboard) |
| `GET` | /ai/ai/ops/evaluators | `ai_ops_dashboard_get_ai_ai_ops_evaluators` | [stub] List/get /ai/ai/ops/evaluators (ai-ops-dashboard) |
| `GET` | /ai/ai/ops/evaluators/stats | `ai_ops_dashboard_get_ai_ai_ops_evaluators_stats` | [stub] List/get /ai/ai/ops/evaluators/stats (ai-ops-dashboard) |
| `GET` | /ai/ai/ops/policy/rules | `ai_ops_dashboard_get_ai_ai_ops_policy_rules` | [stub] List/get /ai/ai/ops/policy/rules (ai-ops-dashboard) |
| `GET` | /ai/ai/ops/review-queue | `ai_ops_dashboard_get_ai_ai_ops_review_queue` | [stub] List/get /ai/ai/ops/review-queue (ai-ops-dashboard) |
| `PATCH` | /ai/ai/ops/review-queue/{reviewId}/claim | `ai_ops_dashboard_patch_ai_ai_ops_review_queue_reviewId_claim` | [stub] Patch /ai/ai/ops/review-queue/{reviewId}/claim (ai-ops-dashboard) |
| `PATCH` | /ai/ai/ops/review-queue/{reviewId}/decision | `ai_ops_dashboard_patch_ai_ai_ops_review_queue_reviewId_decision` | [stub] Patch /ai/ai/ops/review-queue/{reviewId}/decision (ai-ops-dashboard) |
| `GET` | /ai/ai/ops/review-queue/stats | `ai_ops_dashboard_get_ai_ai_ops_review_queue_stats` | [stub] List/get /ai/ai/ops/review-queue/stats (ai-ops-dashboard) |
| `GET` | /ai/ai/ops/summary | `ai_ops_dashboard_get_ai_ai_ops_summary` | [stub] List/get /ai/ai/ops/summary (ai-ops-dashboard) |
| `GET` | /ai/ai/ops/traces | `ai_ops_dashboard_get_ai_ai_ops_traces` | [stub] List/get /ai/ai/ops/traces (ai-ops-dashboard) |
| `GET` | /ai/ai/ops/traces/{id}/feedback | `ai_ops_dashboard_get_ai_ai_ops_traces_id_feedback` | [stub] List/get /ai/ai/ops/traces/{id}/feedback (ai-ops-dashboard) |
| `POST` | /ai/ai/ops/traces/{id}/feedback | `ai_ops_dashboard_post_ai_ai_ops_traces_id_feedback` | [stub] Create/invoke /ai/ai/ops/traces/{id}/feedback (ai-ops-dashboard) |
| `GET` | /ai/ai/ops/traces/{traceId} | `ai_ops_dashboard_get_ai_ai_ops_traces_traceId` | [stub] List/get /ai/ai/ops/traces/{traceId} (ai-ops-dashboard) |
| `PATCH` | /ai/ai/ops/traces/{traceId}/status | `ai_ops_dashboard_patch_ai_ai_ops_traces_traceId_status` | [stub] Patch /ai/ai/ops/traces/{traceId}/status (ai-ops-dashboard) |
| `POST` | /ai/ai/ops/traces/capture | `ai_ops_dashboard_post_ai_ai_ops_traces_capture` | [stub] Create/invoke /ai/ai/ops/traces/capture (ai-ops-dashboard) |

<a id="ai-routes"></a>

## ai-routes

Auto-generated tag for ai-routes route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `POST` | /ai-routes/intelligence/ai/analyze-document | `ai_routes_post_ai_routes_intelligence_ai_analyze_document` | [stub] Create/invoke /ai-routes/intelligence/ai/analyze-document (ai-routes) |
| `POST` | /ai-routes/intelligence/ai/chat | `ai_routes_post_ai_routes_intelligence_ai_chat` | [stub] Create/invoke /ai-routes/intelligence/ai/chat (ai-routes) |
| `DELETE` | /ai-routes/intelligence/ai/chat/{sessionId} | `ai_routes_delete_ai_routes_intelligence_ai_chat_sessionId` | [stub] Delete /ai-routes/intelligence/ai/chat/{sessionId} (ai-routes) |
| `GET` | /ai-routes/intelligence/ai/chat/{sessionId}/history | `ai_routes_get_ai_routes_intelligence_ai_chat_sessionId_history` | [stub] List/get /ai-routes/intelligence/ai/chat/{sessionId}/history (ai-routes) |
| `POST` | /ai-routes/intelligence/ai/chat/stream | `ai_routes_post_ai_routes_intelligence_ai_chat_stream` | [stub] Create/invoke /ai-routes/intelligence/ai/chat/stream (ai-routes) |
| `POST` | /ai-routes/intelligence/ai/classify | `ai_routes_post_ai_routes_intelligence_ai_classify` | [stub] Create/invoke /ai-routes/intelligence/ai/classify (ai-routes) |
| `POST` | /ai-routes/intelligence/ai/embed | `ai_routes_post_ai_routes_intelligence_ai_embed` | [stub] Create/invoke /ai-routes/intelligence/ai/embed (ai-routes) |
| `POST` | /ai-routes/intelligence/ai/generate-image | `ai_routes_post_ai_routes_intelligence_ai_generate_image` | [stub] Create/invoke /ai-routes/intelligence/ai/generate-image (ai-routes) |
| `GET` | /ai-routes/intelligence/ai/health | `ai_routes_get_ai_routes_intelligence_ai_health` | [stub] List/get /ai-routes/intelligence/ai/health (ai-routes) |
| `POST` | /ai-routes/intelligence/ai/ner | `ai_routes_post_ai_routes_intelligence_ai_ner` | [stub] Create/invoke /ai-routes/intelligence/ai/ner (ai-routes) |
| `POST` | /ai-routes/intelligence/ai/reason | `ai_routes_post_ai_routes_intelligence_ai_reason` | [stub] Create/invoke /ai-routes/intelligence/ai/reason (ai-routes) |
| `POST` | /ai-routes/intelligence/ai/semantic-search | `ai_routes_post_ai_routes_intelligence_ai_semantic_search` | [stub] Create/invoke /ai-routes/intelligence/ai/semantic-search (ai-routes) |
| `POST` | /ai-routes/intelligence/ai/sentiment | `ai_routes_post_ai_routes_intelligence_ai_sentiment` | [stub] Create/invoke /ai-routes/intelligence/ai/sentiment (ai-routes) |
| `GET` | /ai-routes/intelligence/ai/stream | `ai_routes_get_ai_routes_intelligence_ai_stream` | [stub] List/get /ai-routes/intelligence/ai/stream (ai-routes) |
| `POST` | /ai-routes/intelligence/ai/summarize | `ai_routes_post_ai_routes_intelligence_ai_summarize` | [stub] Create/invoke /ai-routes/intelligence/ai/summarize (ai-routes) |
| `POST` | /ai-routes/intelligence/ai/transcribe | `ai_routes_post_ai_routes_intelligence_ai_transcribe` | [stub] Create/invoke /ai-routes/intelligence/ai/transcribe (ai-routes) |
| `POST` | /ai-routes/intelligence/ai/translate | `ai_routes_post_ai_routes_intelligence_ai_translate` | [stub] Create/invoke /ai-routes/intelligence/ai/translate (ai-routes) |

<a id="alloy-channels"></a>

## alloy-channels

Auto-generated tag for alloy-channels route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /alloy/alloy/channels/approvals | `alloy_channels_get_alloy_alloy_channels_approvals` | [stub] List/get /alloy/alloy/channels/approvals (alloy-channels) |
| `POST` | /alloy/alloy/channels/approvals/{id}/decide | `alloy_channels_post_alloy_alloy_channels_approvals_id_decide` | [stub] Create/invoke /alloy/alloy/channels/approvals/{id}/decide (alloy-channels) |
| `GET` | /alloy/alloy/channels/audit | `alloy_channels_get_alloy_alloy_channels_audit` | [stub] List/get /alloy/alloy/channels/audit (alloy-channels) |
| `GET` | /alloy/alloy/channels/config | `alloy_channels_get_alloy_alloy_channels_config` | [stub] List/get /alloy/alloy/channels/config (alloy-channels) |
| `POST` | /alloy/alloy/channels/config | `alloy_channels_post_alloy_alloy_channels_config` | [stub] Create/invoke /alloy/alloy/channels/config (alloy-channels) |
| `PATCH` | /alloy/alloy/channels/config/{channelId} | `alloy_channels_patch_alloy_alloy_channels_config_channelId` | [stub] Patch /alloy/alloy/channels/config/{channelId} (alloy-channels) |
| `POST` | /alloy/alloy/channels/slack/interactive | `alloy_channels_post_alloy_alloy_channels_slack_interactive` | [stub] Create/invoke /alloy/alloy/channels/slack/interactive (alloy-channels) |
| `POST` | /alloy/alloy/channels/slack/send | `alloy_channels_post_alloy_alloy_channels_slack_send` | [stub] Create/invoke /alloy/alloy/channels/slack/send (alloy-channels) |
| `POST` | /alloy/alloy/channels/slack/webhook | `alloy_channels_post_alloy_alloy_channels_slack_webhook` | [stub] Create/invoke /alloy/alloy/channels/slack/webhook (alloy-channels) |
| `GET` | /alloy/alloy/channels/trust-levels | `alloy_channels_get_alloy_alloy_channels_trust_levels` | [stub] List/get /alloy/alloy/channels/trust-levels (alloy-channels) |

<a id="alloy-cognitive-learning"></a>

## alloy-cognitive-learning

Auto-generated tag for alloy-cognitive-learning route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /alloy/alloy/cognitive/calibration/{agentId} | `alloy_cognitive_learning_get_alloy_alloy_cognitive_calibration_agentId` | [stub] List/get /alloy/alloy/cognitive/calibration/{agentId} (alloy-cognitive-learning) |
| `GET` | /alloy/alloy/cognitive/corrections/{agentId} | `alloy_cognitive_learning_get_alloy_alloy_cognitive_corrections_agentId` | [stub] List/get /alloy/alloy/cognitive/corrections/{agentId} (alloy-cognitive-learning) |
| `GET` | /alloy/alloy/cognitive/evals/calibrations | `alloy_cognitive_learning_get_alloy_alloy_cognitive_evals_calibrations` | [stub] List/get /alloy/alloy/cognitive/evals/calibrations (alloy-cognitive-learning) |
| `GET` | /alloy/alloy/cognitive/evals/history | `alloy_cognitive_learning_get_alloy_alloy_cognitive_evals_history` | [stub] List/get /alloy/alloy/cognitive/evals/history (alloy-cognitive-learning) |
| `GET` | /alloy/alloy/cognitive/evals/latest | `alloy_cognitive_learning_get_alloy_alloy_cognitive_evals_latest` | [stub] List/get /alloy/alloy/cognitive/evals/latest (alloy-cognitive-learning) |
| `POST` | /alloy/alloy/cognitive/evals/run | `alloy_cognitive_learning_post_alloy_alloy_cognitive_evals_run` | [stub] Create/invoke /alloy/alloy/cognitive/evals/run (alloy-cognitive-learning) |
| `GET` | /alloy/alloy/cognitive/memory-stats | `alloy_cognitive_learning_get_alloy_alloy_cognitive_memory_stats` | [stub] List/get /alloy/alloy/cognitive/memory-stats (alloy-cognitive-learning) |
| `POST` | /alloy/alloy/cognitive/outcomes | `alloy_cognitive_learning_post_alloy_alloy_cognitive_outcomes` | [stub] Create/invoke /alloy/alloy/cognitive/outcomes (alloy-cognitive-learning) |

<a id="alloy-digest"></a>

## alloy-digest

Auto-generated tag for alloy-digest route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /alloy/alloy/digest/{id} | `alloy_digest_get_alloy_alloy_digest_id` | [stub] List/get /alloy/alloy/digest/{id} (alloy-digest) |
| `GET` | /alloy/alloy/digest/config | `alloy_digest_get_alloy_alloy_digest_config` | [stub] List/get /alloy/alloy/digest/config (alloy-digest) |
| `PUT` | /alloy/alloy/digest/config | `alloy_digest_put_alloy_alloy_digest_config` | [stub] Update /alloy/alloy/digest/config (alloy-digest) |
| `POST` | /alloy/alloy/digest/generate | `alloy_digest_post_alloy_alloy_digest_generate` | [stub] Create/invoke /alloy/alloy/digest/generate (alloy-digest) |
| `GET` | /alloy/alloy/digest/history | `alloy_digest_get_alloy_alloy_digest_history` | [stub] List/get /alloy/alloy/digest/history (alloy-digest) |
| `GET` | /alloy/alloy/digest/latest | `alloy_digest_get_alloy_alloy_digest_latest` | [stub] List/get /alloy/alloy/digest/latest (alloy-digest) |

<a id="alloy-email"></a>

## alloy-email

Auto-generated tag for alloy-email route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `POST` | /alloy/alloy/email/ingest | `alloy_email_post_alloy_alloy_email_ingest` | [stub] Create/invoke /alloy/alloy/email/ingest (alloy-email) |
| `GET` | /alloy/alloy/email/rules | `alloy_email_get_alloy_alloy_email_rules` | [stub] List/get /alloy/alloy/email/rules (alloy-email) |
| `POST` | /alloy/alloy/email/rules | `alloy_email_post_alloy_alloy_email_rules` | [stub] Create/invoke /alloy/alloy/email/rules (alloy-email) |
| `GET` | /alloy/alloy/email/stats | `alloy_email_get_alloy_alloy_email_stats` | [stub] List/get /alloy/alloy/email/stats (alloy-email) |
| `GET` | /alloy/alloy/email/triage | `alloy_email_get_alloy_alloy_email_triage` | [stub] List/get /alloy/alloy/email/triage (alloy-email) |
| `GET` | /alloy/alloy/email/triage/{id} | `alloy_email_get_alloy_alloy_email_triage_id` | [stub] List/get /alloy/alloy/email/triage/{id} (alloy-email) |
| `PATCH` | /alloy/alloy/email/triage/{id} | `alloy_email_patch_alloy_alloy_email_triage_id` | [stub] Patch /alloy/alloy/email/triage/{id} (alloy-email) |
| `POST` | /alloy/alloy/email/triage/{id}/draft | `alloy_email_post_alloy_alloy_email_triage_id_draft` | [stub] Create/invoke /alloy/alloy/email/triage/{id}/draft (alloy-email) |
| `POST` | /alloy/alloy/email/triage/{id}/route | `alloy_email_post_alloy_alloy_email_triage_id_route` | [stub] Create/invoke /alloy/alloy/email/triage/{id}/route (alloy-email) |

<a id="alloy-governance"></a>

## alloy-governance

Auto-generated tag for alloy-governance route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /alloy/alloy/admin/analytics | `alloy_governance_get_alloy_alloy_admin_analytics` | [stub] List/get /alloy/alloy/admin/analytics (alloy-governance) |
| `POST` | /alloy/alloy/governance/enforce | `alloy_governance_post_alloy_alloy_governance_enforce` | [stub] Create/invoke /alloy/alloy/governance/enforce (alloy-governance) |
| `GET` | /alloy/alloy/governance/incidents | `alloy_governance_get_alloy_alloy_governance_incidents` | [stub] List/get /alloy/alloy/governance/incidents (alloy-governance) |
| `POST` | /alloy/alloy/governance/incidents | `alloy_governance_post_alloy_alloy_governance_incidents` | [stub] Create/invoke /alloy/alloy/governance/incidents (alloy-governance) |
| `PATCH` | /alloy/alloy/governance/incidents/{id}/resolve | `alloy_governance_patch_alloy_alloy_governance_incidents_id_resolve` | [stub] Patch /alloy/alloy/governance/incidents/{id}/resolve (alloy-governance) |
| `GET` | /alloy/alloy/policies | `alloy_governance_get_alloy_alloy_policies` | [stub] List/get /alloy/alloy/policies (alloy-governance) |
| `POST` | /alloy/alloy/policies | `alloy_governance_post_alloy_alloy_policies` | [stub] Create/invoke /alloy/alloy/policies (alloy-governance) |
| `GET` | /alloy/alloy/policies/{id} | `alloy_governance_get_alloy_alloy_policies_id` | [stub] List/get /alloy/alloy/policies/{id} (alloy-governance) |
| `PATCH` | /alloy/alloy/policies/{id} | `alloy_governance_patch_alloy_alloy_policies_id` | [stub] Patch /alloy/alloy/policies/{id} (alloy-governance) |
| `DELETE` | /alloy/alloy/policies/{id} | `alloy_governance_delete_alloy_alloy_policies_id` | [stub] Delete /alloy/alloy/policies/{id} (alloy-governance) |
| `POST` | /alloy/alloy/policies/{id}/apply | `alloy_governance_post_alloy_alloy_policies_id_apply` | [stub] Create/invoke /alloy/alloy/policies/{id}/apply (alloy-governance) |
| `GET` | /alloy/alloy/usage/events | `alloy_governance_get_alloy_alloy_usage_events` | [stub] List/get /alloy/alloy/usage/events (alloy-governance) |
| `POST` | /alloy/alloy/usage/events | `alloy_governance_post_alloy_alloy_usage_events` | [stub] Create/invoke /alloy/alloy/usage/events (alloy-governance) |

<a id="alloy-integrations"></a>

## alloy-integrations

Auto-generated tag for alloy-integrations route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /alloy/alloy/integrations/connections | `alloy_integrations_get_alloy_alloy_integrations_connections` | [stub] List/get /alloy/alloy/integrations/connections (alloy-integrations) |
| `POST` | /alloy/alloy/integrations/connections | `alloy_integrations_post_alloy_alloy_integrations_connections` | [stub] Create/invoke /alloy/alloy/integrations/connections (alloy-integrations) |
| `PATCH` | /alloy/alloy/integrations/connections/{id} | `alloy_integrations_patch_alloy_alloy_integrations_connections_id` | [stub] Patch /alloy/alloy/integrations/connections/{id} (alloy-integrations) |
| `DELETE` | /alloy/alloy/integrations/connections/{id} | `alloy_integrations_delete_alloy_alloy_integrations_connections_id` | [stub] Delete /alloy/alloy/integrations/connections/{id} (alloy-integrations) |
| `POST` | /alloy/alloy/integrations/connections/{id}/test | `alloy_integrations_post_alloy_alloy_integrations_connections_id_test` | [stub] Create/invoke /alloy/alloy/integrations/connections/{id}/test (alloy-integrations) |
| `GET` | /alloy/alloy/integrations/events | `alloy_integrations_get_alloy_alloy_integrations_events` | [stub] List/get /alloy/alloy/integrations/events (alloy-integrations) |
| `GET` | /alloy/alloy/integrations/health | `alloy_integrations_get_alloy_alloy_integrations_health` | [stub] List/get /alloy/alloy/integrations/health (alloy-integrations) |
| `GET` | /alloy/alloy/integrations/registry | `alloy_integrations_get_alloy_alloy_integrations_registry` | [stub] List/get /alloy/alloy/integrations/registry (alloy-integrations) |
| `GET` | /alloy/alloy/integrations/webhooks/endpoints | `alloy_integrations_get_alloy_alloy_integrations_webhooks_endpoints` | [stub] List/get /alloy/alloy/integrations/webhooks/endpoints (alloy-integrations) |
| `POST` | /alloy/alloy/integrations/webhooks/endpoints | `alloy_integrations_post_alloy_alloy_integrations_webhooks_endpoints` | [stub] Create/invoke /alloy/alloy/integrations/webhooks/endpoints (alloy-integrations) |
| `POST` | /alloy/alloy/integrations/webhooks/receive/{endpointId} | `alloy_integrations_post_alloy_alloy_integrations_webhooks_receive_endpointId` | [stub] Create/invoke /alloy/alloy/integrations/webhooks/receive/{endpointId} (alloy-integrations) |

<a id="alloy-meetings"></a>

## alloy-meetings

Auto-generated tag for alloy-meetings route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /alloy/alloy/meetings | `alloy_meetings_get_alloy_alloy_meetings` | [stub] List/get /alloy/alloy/meetings (alloy-meetings) |
| `GET` | /alloy/alloy/meetings/{id} | `alloy_meetings_get_alloy_alloy_meetings_id` | [stub] List/get /alloy/alloy/meetings/{id} (alloy-meetings) |
| `PATCH` | /alloy/alloy/meetings/{id}/action-items/{itemId} | `alloy_meetings_patch_alloy_alloy_meetings_id_action_items_itemId` | [stub] Patch /alloy/alloy/meetings/{id}/action-items/{itemId} (alloy-meetings) |
| `GET` | /alloy/alloy/meetings/{id}/follow-up | `alloy_meetings_get_alloy_alloy_meetings_id_follow_up` | [stub] List/get /alloy/alloy/meetings/{id}/follow-up (alloy-meetings) |
| `GET` | /alloy/alloy/meetings/action-items/open | `alloy_meetings_get_alloy_alloy_meetings_action_items_open` | [stub] List/get /alloy/alloy/meetings/action-items/open (alloy-meetings) |
| `POST` | /alloy/alloy/meetings/capture | `alloy_meetings_post_alloy_alloy_meetings_capture` | [stub] Create/invoke /alloy/alloy/meetings/capture (alloy-meetings) |
| `POST` | /alloy/alloy/meetings/prep | `alloy_meetings_post_alloy_alloy_meetings_prep` | [stub] Create/invoke /alloy/alloy/meetings/prep (alloy-meetings) |

<a id="alloy-policy-compiler"></a>

## alloy-policy-compiler

Auto-generated tag for alloy-policy-compiler route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /alloy/policy-compiler/alloy/policy-compiler/state | `alloy_policy_compiler_get_alloy_policy_compiler_alloy_policy_compiler_state` | [stub] List/get /alloy/policy-compiler/alloy/policy-compiler/state (alloy-policy-compiler) |
| `POST` | /alloy/policy-compiler/alloy/policy-compiler/test-cases | `alloy_policy_compiler_post_alloy_policy_compiler_alloy_policy_compiler_test_cases` | [stub] Create/invoke /alloy/policy-compiler/alloy/policy-compiler/test-cases (alloy-policy-compiler) |
| `DELETE` | /alloy/policy-compiler/alloy/policy-compiler/test-cases/{externalId} | `alloy_policy_compiler_delete_alloy_policy_compiler_alloy_policy_compiler_test_cases_externalId` | [stub] Delete /alloy/policy-compiler/alloy/policy-compiler/test-cases/{externalId} (alloy-policy-compiler) |
| `POST` | /alloy/policy-compiler/alloy/policy-compiler/versions | `alloy_policy_compiler_post_alloy_policy_compiler_alloy_policy_compiler_versions` | [stub] Create/invoke /alloy/policy-compiler/alloy/policy-compiler/versions (alloy-policy-compiler) |
| `POST` | /alloy/policy-compiler/alloy/policy-compiler/versions/{externalId}/sign | `alloy_policy_compiler_post_alloy_policy_compiler_alloy_policy_compiler_versions_externalId_sign` | [stub] Create/invoke /alloy/policy-compiler/alloy/policy-compiler/versions/{externalId}/sign (alloy-policy-compiler) |

<a id="alloy-research"></a>

## alloy-research

Auto-generated tag for alloy-research route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /alloy/alloy/browser/allowlist | `alloy_research_get_alloy_alloy_browser_allowlist` | [stub] List/get /alloy/alloy/browser/allowlist (alloy-research) |
| `POST` | /alloy/alloy/browser/allowlist | `alloy_research_post_alloy_alloy_browser_allowlist` | [stub] Create/invoke /alloy/alloy/browser/allowlist (alloy-research) |
| `DELETE` | /alloy/alloy/browser/allowlist/{id} | `alloy_research_delete_alloy_alloy_browser_allowlist_id` | [stub] Delete /alloy/alloy/browser/allowlist/{id} (alloy-research) |
| `GET` | /alloy/alloy/browser/tasks | `alloy_research_get_alloy_alloy_browser_tasks` | [stub] List/get /alloy/alloy/browser/tasks (alloy-research) |
| `POST` | /alloy/alloy/browser/tasks | `alloy_research_post_alloy_alloy_browser_tasks` | [stub] Create/invoke /alloy/alloy/browser/tasks (alloy-research) |
| `POST` | /alloy/alloy/browser/tasks/{id}/execute | `alloy_research_post_alloy_alloy_browser_tasks_id_execute` | [stub] Create/invoke /alloy/alloy/browser/tasks/{id}/execute (alloy-research) |
| `POST` | /alloy/alloy/browser/tasks/{id}/pause | `alloy_research_post_alloy_alloy_browser_tasks_id_pause` | [stub] Create/invoke /alloy/alloy/browser/tasks/{id}/pause (alloy-research) |
| `POST` | /alloy/alloy/browser/tasks/{id}/resume | `alloy_research_post_alloy_alloy_browser_tasks_id_resume` | [stub] Create/invoke /alloy/alloy/browser/tasks/{id}/resume (alloy-research) |
| `GET` | /alloy/alloy/research/spaces | `alloy_research_get_alloy_alloy_research_spaces` | [stub] List/get /alloy/alloy/research/spaces (alloy-research) |
| `POST` | /alloy/alloy/research/spaces | `alloy_research_post_alloy_alloy_research_spaces` | [stub] Create/invoke /alloy/alloy/research/spaces (alloy-research) |
| `GET` | /alloy/alloy/research/spaces/{id} | `alloy_research_get_alloy_alloy_research_spaces_id` | [stub] List/get /alloy/alloy/research/spaces/{id} (alloy-research) |
| `DELETE` | /alloy/alloy/research/spaces/{id} | `alloy_research_delete_alloy_alloy_research_spaces_id` | [stub] Delete /alloy/alloy/research/spaces/{id} (alloy-research) |
| `POST` | /alloy/alloy/research/spaces/{id}/run | `alloy_research_post_alloy_alloy_research_spaces_id_run` | [stub] Create/invoke /alloy/alloy/research/spaces/{id}/run (alloy-research) |

<a id="alloy-runtime"></a>

## alloy-runtime

Auto-generated tag for alloy-runtime route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /actions/actions | `alloy_runtime_get_actions_actions` | [stub] List/get /actions/actions (alloy-runtime) |
| `POST` | /actions/actions | `alloy_runtime_post_actions_actions` | [stub] Create/invoke /actions/actions (alloy-runtime) |
| `GET` | /actions/agents | `alloy_runtime_get_actions_agents` | [stub] List/get /actions/agents (alloy-runtime) |
| `POST` | /actions/agents | `alloy_runtime_post_actions_agents` | [stub] Create/invoke /actions/agents (alloy-runtime) |
| `GET` | /actions/agents/{agentId} | `alloy_runtime_get_actions_agents_agentId` | [stub] List/get /actions/agents/{agentId} (alloy-runtime) |
| `GET` | /actions/agents/{agentId}/versions | `alloy_runtime_get_actions_agents_agentId_versions` | [stub] List/get /actions/agents/{agentId}/versions (alloy-runtime) |
| `POST` | /actions/agents/{agentId}/versions | `alloy_runtime_post_actions_agents_agentId_versions` | [stub] Create/invoke /actions/agents/{agentId}/versions (alloy-runtime) |
| `GET` | /actions/models | `alloy_runtime_get_actions_models` | [stub] List/get /actions/models (alloy-runtime) |
| `POST` | /actions/models | `alloy_runtime_post_actions_models` | [stub] Create/invoke /actions/models (alloy-runtime) |
| `GET` | /actions/models/{modelId} | `alloy_runtime_get_actions_models_modelId` | [stub] List/get /actions/models/{modelId} (alloy-runtime) |
| `POST` | /actions/models/route | `alloy_runtime_post_actions_models_route` | [stub] Create/invoke /actions/models/route (alloy-runtime) |
| `GET` | /actions/prompts | `alloy_runtime_get_actions_prompts` | [stub] List/get /actions/prompts (alloy-runtime) |
| `POST` | /actions/prompts | `alloy_runtime_post_actions_prompts` | [stub] Create/invoke /actions/prompts (alloy-runtime) |
| `GET` | /actions/prompts/{promptId} | `alloy_runtime_get_actions_prompts_promptId` | [stub] List/get /actions/prompts/{promptId} (alloy-runtime) |
| `GET` | /actions/prompts/{promptId}/versions | `alloy_runtime_get_actions_prompts_promptId_versions` | [stub] List/get /actions/prompts/{promptId}/versions (alloy-runtime) |
| `GET` | /actions/recommendations | `alloy_runtime_get_actions_recommendations` | [stub] List/get /actions/recommendations (alloy-runtime) |
| `GET` | /actions/signals | `alloy_runtime_get_actions_signals` | [stub] List/get /actions/signals (alloy-runtime) |
| `POST` | /actions/signals | `alloy_runtime_post_actions_signals` | [stub] Create/invoke /actions/signals (alloy-runtime) |
| `GET` | /actions/signals/{signalId} | `alloy_runtime_get_actions_signals_signalId` | [stub] List/get /actions/signals/{signalId} (alloy-runtime) |
| `PATCH` | /actions/signals/{signalId}/status | `alloy_runtime_patch_actions_signals_signalId_status` | [stub] Patch /actions/signals/{signalId}/status (alloy-runtime) |
| `GET` | /actions/workflow-runs | `alloy_runtime_get_actions_workflow_runs` | [stub] List/get /actions/workflow-runs (alloy-runtime) |
| `POST` | /actions/workflow-runs | `alloy_runtime_post_actions_workflow_runs` | [stub] Create/invoke /actions/workflow-runs (alloy-runtime) |
| `GET` | /actions/workflow-runs/{runId} | `alloy_runtime_get_actions_workflow_runs_runId` | [stub] List/get /actions/workflow-runs/{runId} (alloy-runtime) |
| `POST` | /actions/workflow-runs/{runId}/replay | `alloy_runtime_post_actions_workflow_runs_runId_replay` | [stub] Create/invoke /actions/workflow-runs/{runId}/replay (alloy-runtime) |
| `GET` | /actions/workflows | `alloy_runtime_get_actions_workflows` | [stub] List/get /actions/workflows (alloy-runtime) |
| `POST` | /actions/workflows | `alloy_runtime_post_actions_workflows` | [stub] Create/invoke /actions/workflows (alloy-runtime) |
| `GET` | /actions/workflows/{workflowId} | `alloy_runtime_get_actions_workflows_workflowId` | [stub] List/get /actions/workflows/{workflowId} (alloy-runtime) |
| `PATCH` | /actions/workflows/{workflowId} | `alloy_runtime_patch_actions_workflows_workflowId` | [stub] Patch /actions/workflows/{workflowId} (alloy-runtime) |
| `DELETE` | /actions/workflows/{workflowId} | `alloy_runtime_delete_actions_workflows_workflowId` | [stub] Delete /actions/workflows/{workflowId} (alloy-runtime) |
| `GET` | /agents/actions | `alloy_runtime_get_agents_actions` | [stub] List/get /agents/actions (alloy-runtime) |
| `POST` | /agents/actions | `alloy_runtime_post_agents_actions` | [stub] Create/invoke /agents/actions (alloy-runtime) |
| `GET` | /agents/agents | `alloy_runtime_get_agents_agents` | [stub] List/get /agents/agents (alloy-runtime) |
| `POST` | /agents/agents | `alloy_runtime_post_agents_agents` | [stub] Create/invoke /agents/agents (alloy-runtime) |
| `GET` | /agents/agents/{agentId} | `alloy_runtime_get_agents_agents_agentId` | [stub] List/get /agents/agents/{agentId} (alloy-runtime) |
| `GET` | /agents/agents/{agentId}/versions | `alloy_runtime_get_agents_agents_agentId_versions` | [stub] List/get /agents/agents/{agentId}/versions (alloy-runtime) |
| `POST` | /agents/agents/{agentId}/versions | `alloy_runtime_post_agents_agents_agentId_versions` | [stub] Create/invoke /agents/agents/{agentId}/versions (alloy-runtime) |
| `GET` | /agents/models | `alloy_runtime_get_agents_models` | [stub] List/get /agents/models (alloy-runtime) |
| `POST` | /agents/models | `alloy_runtime_post_agents_models` | [stub] Create/invoke /agents/models (alloy-runtime) |
| `GET` | /agents/models/{modelId} | `alloy_runtime_get_agents_models_modelId` | [stub] List/get /agents/models/{modelId} (alloy-runtime) |
| `POST` | /agents/models/route | `alloy_runtime_post_agents_models_route` | [stub] Create/invoke /agents/models/route (alloy-runtime) |
| `GET` | /agents/prompts | `alloy_runtime_get_agents_prompts` | [stub] List/get /agents/prompts (alloy-runtime) |
| `POST` | /agents/prompts | `alloy_runtime_post_agents_prompts` | [stub] Create/invoke /agents/prompts (alloy-runtime) |
| `GET` | /agents/prompts/{promptId} | `alloy_runtime_get_agents_prompts_promptId` | [stub] List/get /agents/prompts/{promptId} (alloy-runtime) |
| `GET` | /agents/prompts/{promptId}/versions | `alloy_runtime_get_agents_prompts_promptId_versions` | [stub] List/get /agents/prompts/{promptId}/versions (alloy-runtime) |
| `GET` | /agents/recommendations | `alloy_runtime_get_agents_recommendations` | [stub] List/get /agents/recommendations (alloy-runtime) |
| `GET` | /agents/signals | `alloy_runtime_get_agents_signals` | [stub] List/get /agents/signals (alloy-runtime) |
| `POST` | /agents/signals | `alloy_runtime_post_agents_signals` | [stub] Create/invoke /agents/signals (alloy-runtime) |
| `GET` | /agents/signals/{signalId} | `alloy_runtime_get_agents_signals_signalId` | [stub] List/get /agents/signals/{signalId} (alloy-runtime) |
| `PATCH` | /agents/signals/{signalId}/status | `alloy_runtime_patch_agents_signals_signalId_status` | [stub] Patch /agents/signals/{signalId}/status (alloy-runtime) |
| `GET` | /agents/workflow-runs | `alloy_runtime_get_agents_workflow_runs` | [stub] List/get /agents/workflow-runs (alloy-runtime) |
| `POST` | /agents/workflow-runs | `alloy_runtime_post_agents_workflow_runs` | [stub] Create/invoke /agents/workflow-runs (alloy-runtime) |
| `GET` | /agents/workflow-runs/{runId} | `alloy_runtime_get_agents_workflow_runs_runId` | [stub] List/get /agents/workflow-runs/{runId} (alloy-runtime) |
| `POST` | /agents/workflow-runs/{runId}/replay | `alloy_runtime_post_agents_workflow_runs_runId_replay` | [stub] Create/invoke /agents/workflow-runs/{runId}/replay (alloy-runtime) |
| `GET` | /agents/workflows | `alloy_runtime_get_agents_workflows` | [stub] List/get /agents/workflows (alloy-runtime) |
| `POST` | /agents/workflows | `alloy_runtime_post_agents_workflows` | [stub] Create/invoke /agents/workflows (alloy-runtime) |
| `GET` | /agents/workflows/{workflowId} | `alloy_runtime_get_agents_workflows_workflowId` | [stub] List/get /agents/workflows/{workflowId} (alloy-runtime) |
| `PATCH` | /agents/workflows/{workflowId} | `alloy_runtime_patch_agents_workflows_workflowId` | [stub] Patch /agents/workflows/{workflowId} (alloy-runtime) |
| `DELETE` | /agents/workflows/{workflowId} | `alloy_runtime_delete_agents_workflows_workflowId` | [stub] Delete /agents/workflows/{workflowId} (alloy-runtime) |
| `GET` | /models/actions | `alloy_runtime_get_models_actions` | [stub] List/get /models/actions (alloy-runtime) |
| `POST` | /models/actions | `alloy_runtime_post_models_actions` | [stub] Create/invoke /models/actions (alloy-runtime) |
| `GET` | /models/agents | `alloy_runtime_get_models_agents` | [stub] List/get /models/agents (alloy-runtime) |
| `POST` | /models/agents | `alloy_runtime_post_models_agents` | [stub] Create/invoke /models/agents (alloy-runtime) |
| `GET` | /models/agents/{agentId} | `alloy_runtime_get_models_agents_agentId` | [stub] List/get /models/agents/{agentId} (alloy-runtime) |
| `GET` | /models/agents/{agentId}/versions | `alloy_runtime_get_models_agents_agentId_versions` | [stub] List/get /models/agents/{agentId}/versions (alloy-runtime) |
| `POST` | /models/agents/{agentId}/versions | `alloy_runtime_post_models_agents_agentId_versions` | [stub] Create/invoke /models/agents/{agentId}/versions (alloy-runtime) |
| `GET` | /models/models | `alloy_runtime_get_models_models` | [stub] List/get /models/models (alloy-runtime) |
| `POST` | /models/models | `alloy_runtime_post_models_models` | [stub] Create/invoke /models/models (alloy-runtime) |
| `GET` | /models/models/{modelId} | `alloy_runtime_get_models_models_modelId` | [stub] List/get /models/models/{modelId} (alloy-runtime) |
| `POST` | /models/models/route | `alloy_runtime_post_models_models_route` | [stub] Create/invoke /models/models/route (alloy-runtime) |
| `GET` | /models/prompts | `alloy_runtime_get_models_prompts` | [stub] List/get /models/prompts (alloy-runtime) |
| `POST` | /models/prompts | `alloy_runtime_post_models_prompts` | [stub] Create/invoke /models/prompts (alloy-runtime) |
| `GET` | /models/prompts/{promptId} | `alloy_runtime_get_models_prompts_promptId` | [stub] List/get /models/prompts/{promptId} (alloy-runtime) |
| `GET` | /models/prompts/{promptId}/versions | `alloy_runtime_get_models_prompts_promptId_versions` | [stub] List/get /models/prompts/{promptId}/versions (alloy-runtime) |
| `GET` | /models/recommendations | `alloy_runtime_get_models_recommendations` | [stub] List/get /models/recommendations (alloy-runtime) |
| `GET` | /models/signals | `alloy_runtime_get_models_signals` | [stub] List/get /models/signals (alloy-runtime) |
| `POST` | /models/signals | `alloy_runtime_post_models_signals` | [stub] Create/invoke /models/signals (alloy-runtime) |
| `GET` | /models/signals/{signalId} | `alloy_runtime_get_models_signals_signalId` | [stub] List/get /models/signals/{signalId} (alloy-runtime) |
| `PATCH` | /models/signals/{signalId}/status | `alloy_runtime_patch_models_signals_signalId_status` | [stub] Patch /models/signals/{signalId}/status (alloy-runtime) |
| `GET` | /models/workflow-runs | `alloy_runtime_get_models_workflow_runs` | [stub] List/get /models/workflow-runs (alloy-runtime) |
| `POST` | /models/workflow-runs | `alloy_runtime_post_models_workflow_runs` | [stub] Create/invoke /models/workflow-runs (alloy-runtime) |
| `GET` | /models/workflow-runs/{runId} | `alloy_runtime_get_models_workflow_runs_runId` | [stub] List/get /models/workflow-runs/{runId} (alloy-runtime) |
| `POST` | /models/workflow-runs/{runId}/replay | `alloy_runtime_post_models_workflow_runs_runId_replay` | [stub] Create/invoke /models/workflow-runs/{runId}/replay (alloy-runtime) |
| `GET` | /models/workflows | `alloy_runtime_get_models_workflows` | [stub] List/get /models/workflows (alloy-runtime) |
| `POST` | /models/workflows | `alloy_runtime_post_models_workflows` | [stub] Create/invoke /models/workflows (alloy-runtime) |
| `GET` | /models/workflows/{workflowId} | `alloy_runtime_get_models_workflows_workflowId` | [stub] List/get /models/workflows/{workflowId} (alloy-runtime) |
| `PATCH` | /models/workflows/{workflowId} | `alloy_runtime_patch_models_workflows_workflowId` | [stub] Patch /models/workflows/{workflowId} (alloy-runtime) |
| `DELETE` | /models/workflows/{workflowId} | `alloy_runtime_delete_models_workflows_workflowId` | [stub] Delete /models/workflows/{workflowId} (alloy-runtime) |
| `GET` | /prompts/actions | `alloy_runtime_get_prompts_actions` | [stub] List/get /prompts/actions (alloy-runtime) |
| `POST` | /prompts/actions | `alloy_runtime_post_prompts_actions` | [stub] Create/invoke /prompts/actions (alloy-runtime) |
| `GET` | /prompts/agents | `alloy_runtime_get_prompts_agents` | [stub] List/get /prompts/agents (alloy-runtime) |
| `POST` | /prompts/agents | `alloy_runtime_post_prompts_agents` | [stub] Create/invoke /prompts/agents (alloy-runtime) |
| `GET` | /prompts/agents/{agentId} | `alloy_runtime_get_prompts_agents_agentId` | [stub] List/get /prompts/agents/{agentId} (alloy-runtime) |
| `GET` | /prompts/agents/{agentId}/versions | `alloy_runtime_get_prompts_agents_agentId_versions` | [stub] List/get /prompts/agents/{agentId}/versions (alloy-runtime) |
| `POST` | /prompts/agents/{agentId}/versions | `alloy_runtime_post_prompts_agents_agentId_versions` | [stub] Create/invoke /prompts/agents/{agentId}/versions (alloy-runtime) |
| `GET` | /prompts/models | `alloy_runtime_get_prompts_models` | [stub] List/get /prompts/models (alloy-runtime) |
| `POST` | /prompts/models | `alloy_runtime_post_prompts_models` | [stub] Create/invoke /prompts/models (alloy-runtime) |
| `GET` | /prompts/models/{modelId} | `alloy_runtime_get_prompts_models_modelId` | [stub] List/get /prompts/models/{modelId} (alloy-runtime) |
| `POST` | /prompts/models/route | `alloy_runtime_post_prompts_models_route` | [stub] Create/invoke /prompts/models/route (alloy-runtime) |
| `GET` | /prompts/prompts | `alloy_runtime_get_prompts_prompts` | [stub] List/get /prompts/prompts (alloy-runtime) |
| `POST` | /prompts/prompts | `alloy_runtime_post_prompts_prompts` | [stub] Create/invoke /prompts/prompts (alloy-runtime) |
| `GET` | /prompts/prompts/{promptId} | `alloy_runtime_get_prompts_prompts_promptId` | [stub] List/get /prompts/prompts/{promptId} (alloy-runtime) |
| `GET` | /prompts/prompts/{promptId}/versions | `alloy_runtime_get_prompts_prompts_promptId_versions` | [stub] List/get /prompts/prompts/{promptId}/versions (alloy-runtime) |
| `GET` | /prompts/recommendations | `alloy_runtime_get_prompts_recommendations` | [stub] List/get /prompts/recommendations (alloy-runtime) |
| `GET` | /prompts/signals | `alloy_runtime_get_prompts_signals` | [stub] List/get /prompts/signals (alloy-runtime) |
| `POST` | /prompts/signals | `alloy_runtime_post_prompts_signals` | [stub] Create/invoke /prompts/signals (alloy-runtime) |
| `GET` | /prompts/signals/{signalId} | `alloy_runtime_get_prompts_signals_signalId` | [stub] List/get /prompts/signals/{signalId} (alloy-runtime) |
| `PATCH` | /prompts/signals/{signalId}/status | `alloy_runtime_patch_prompts_signals_signalId_status` | [stub] Patch /prompts/signals/{signalId}/status (alloy-runtime) |
| `GET` | /prompts/workflow-runs | `alloy_runtime_get_prompts_workflow_runs` | [stub] List/get /prompts/workflow-runs (alloy-runtime) |
| `POST` | /prompts/workflow-runs | `alloy_runtime_post_prompts_workflow_runs` | [stub] Create/invoke /prompts/workflow-runs (alloy-runtime) |
| `GET` | /prompts/workflow-runs/{runId} | `alloy_runtime_get_prompts_workflow_runs_runId` | [stub] List/get /prompts/workflow-runs/{runId} (alloy-runtime) |
| `POST` | /prompts/workflow-runs/{runId}/replay | `alloy_runtime_post_prompts_workflow_runs_runId_replay` | [stub] Create/invoke /prompts/workflow-runs/{runId}/replay (alloy-runtime) |
| `GET` | /prompts/workflows | `alloy_runtime_get_prompts_workflows` | [stub] List/get /prompts/workflows (alloy-runtime) |
| `POST` | /prompts/workflows | `alloy_runtime_post_prompts_workflows` | [stub] Create/invoke /prompts/workflows (alloy-runtime) |
| `GET` | /prompts/workflows/{workflowId} | `alloy_runtime_get_prompts_workflows_workflowId` | [stub] List/get /prompts/workflows/{workflowId} (alloy-runtime) |
| `PATCH` | /prompts/workflows/{workflowId} | `alloy_runtime_patch_prompts_workflows_workflowId` | [stub] Patch /prompts/workflows/{workflowId} (alloy-runtime) |
| `DELETE` | /prompts/workflows/{workflowId} | `alloy_runtime_delete_prompts_workflows_workflowId` | [stub] Delete /prompts/workflows/{workflowId} (alloy-runtime) |
| `GET` | /recommendations/actions | `alloy_runtime_get_recommendations_actions` | [stub] List/get /recommendations/actions (alloy-runtime) |
| `POST` | /recommendations/actions | `alloy_runtime_post_recommendations_actions` | [stub] Create/invoke /recommendations/actions (alloy-runtime) |
| `GET` | /recommendations/agents | `alloy_runtime_get_recommendations_agents` | [stub] List/get /recommendations/agents (alloy-runtime) |
| `POST` | /recommendations/agents | `alloy_runtime_post_recommendations_agents` | [stub] Create/invoke /recommendations/agents (alloy-runtime) |
| `GET` | /recommendations/agents/{agentId} | `alloy_runtime_get_recommendations_agents_agentId` | [stub] List/get /recommendations/agents/{agentId} (alloy-runtime) |
| `GET` | /recommendations/agents/{agentId}/versions | `alloy_runtime_get_recommendations_agents_agentId_versions` | [stub] List/get /recommendations/agents/{agentId}/versions (alloy-runtime) |
| `POST` | /recommendations/agents/{agentId}/versions | `alloy_runtime_post_recommendations_agents_agentId_versions` | [stub] Create/invoke /recommendations/agents/{agentId}/versions (alloy-runtime) |
| `GET` | /recommendations/models | `alloy_runtime_get_recommendations_models` | [stub] List/get /recommendations/models (alloy-runtime) |
| `POST` | /recommendations/models | `alloy_runtime_post_recommendations_models` | [stub] Create/invoke /recommendations/models (alloy-runtime) |
| `GET` | /recommendations/models/{modelId} | `alloy_runtime_get_recommendations_models_modelId` | [stub] List/get /recommendations/models/{modelId} (alloy-runtime) |
| `POST` | /recommendations/models/route | `alloy_runtime_post_recommendations_models_route` | [stub] Create/invoke /recommendations/models/route (alloy-runtime) |
| `GET` | /recommendations/prompts | `alloy_runtime_get_recommendations_prompts` | [stub] List/get /recommendations/prompts (alloy-runtime) |
| `POST` | /recommendations/prompts | `alloy_runtime_post_recommendations_prompts` | [stub] Create/invoke /recommendations/prompts (alloy-runtime) |
| `GET` | /recommendations/prompts/{promptId} | `alloy_runtime_get_recommendations_prompts_promptId` | [stub] List/get /recommendations/prompts/{promptId} (alloy-runtime) |
| `GET` | /recommendations/prompts/{promptId}/versions | `alloy_runtime_get_recommendations_prompts_promptId_versions` | [stub] List/get /recommendations/prompts/{promptId}/versions (alloy-runtime) |
| `GET` | /recommendations/recommendations | `alloy_runtime_get_recommendations_recommendations` | [stub] List/get /recommendations/recommendations (alloy-runtime) |
| `GET` | /recommendations/signals | `alloy_runtime_get_recommendations_signals` | [stub] List/get /recommendations/signals (alloy-runtime) |
| `POST` | /recommendations/signals | `alloy_runtime_post_recommendations_signals` | [stub] Create/invoke /recommendations/signals (alloy-runtime) |
| `GET` | /recommendations/signals/{signalId} | `alloy_runtime_get_recommendations_signals_signalId` | [stub] List/get /recommendations/signals/{signalId} (alloy-runtime) |
| `PATCH` | /recommendations/signals/{signalId}/status | `alloy_runtime_patch_recommendations_signals_signalId_status` | [stub] Patch /recommendations/signals/{signalId}/status (alloy-runtime) |
| `GET` | /recommendations/workflow-runs | `alloy_runtime_get_recommendations_workflow_runs` | [stub] List/get /recommendations/workflow-runs (alloy-runtime) |
| `POST` | /recommendations/workflow-runs | `alloy_runtime_post_recommendations_workflow_runs` | [stub] Create/invoke /recommendations/workflow-runs (alloy-runtime) |
| `GET` | /recommendations/workflow-runs/{runId} | `alloy_runtime_get_recommendations_workflow_runs_runId` | [stub] List/get /recommendations/workflow-runs/{runId} (alloy-runtime) |
| `POST` | /recommendations/workflow-runs/{runId}/replay | `alloy_runtime_post_recommendations_workflow_runs_runId_replay` | [stub] Create/invoke /recommendations/workflow-runs/{runId}/replay (alloy-runtime) |
| `GET` | /recommendations/workflows | `alloy_runtime_get_recommendations_workflows` | [stub] List/get /recommendations/workflows (alloy-runtime) |
| `POST` | /recommendations/workflows | `alloy_runtime_post_recommendations_workflows` | [stub] Create/invoke /recommendations/workflows (alloy-runtime) |
| `GET` | /recommendations/workflows/{workflowId} | `alloy_runtime_get_recommendations_workflows_workflowId` | [stub] List/get /recommendations/workflows/{workflowId} (alloy-runtime) |
| `PATCH` | /recommendations/workflows/{workflowId} | `alloy_runtime_patch_recommendations_workflows_workflowId` | [stub] Patch /recommendations/workflows/{workflowId} (alloy-runtime) |
| `DELETE` | /recommendations/workflows/{workflowId} | `alloy_runtime_delete_recommendations_workflows_workflowId` | [stub] Delete /recommendations/workflows/{workflowId} (alloy-runtime) |
| `GET` | /signals/actions | `alloy_runtime_get_signals_actions` | [stub] List/get /signals/actions (alloy-runtime) |
| `POST` | /signals/actions | `alloy_runtime_post_signals_actions` | [stub] Create/invoke /signals/actions (alloy-runtime) |
| `GET` | /signals/agents | `alloy_runtime_get_signals_agents` | [stub] List/get /signals/agents (alloy-runtime) |
| `POST` | /signals/agents | `alloy_runtime_post_signals_agents` | [stub] Create/invoke /signals/agents (alloy-runtime) |
| `GET` | /signals/agents/{agentId} | `alloy_runtime_get_signals_agents_agentId` | [stub] List/get /signals/agents/{agentId} (alloy-runtime) |
| `GET` | /signals/agents/{agentId}/versions | `alloy_runtime_get_signals_agents_agentId_versions` | [stub] List/get /signals/agents/{agentId}/versions (alloy-runtime) |
| `POST` | /signals/agents/{agentId}/versions | `alloy_runtime_post_signals_agents_agentId_versions` | [stub] Create/invoke /signals/agents/{agentId}/versions (alloy-runtime) |
| `GET` | /signals/models | `alloy_runtime_get_signals_models` | [stub] List/get /signals/models (alloy-runtime) |
| `POST` | /signals/models | `alloy_runtime_post_signals_models` | [stub] Create/invoke /signals/models (alloy-runtime) |
| `GET` | /signals/models/{modelId} | `alloy_runtime_get_signals_models_modelId` | [stub] List/get /signals/models/{modelId} (alloy-runtime) |
| `POST` | /signals/models/route | `alloy_runtime_post_signals_models_route` | [stub] Create/invoke /signals/models/route (alloy-runtime) |
| `GET` | /signals/prompts | `alloy_runtime_get_signals_prompts` | [stub] List/get /signals/prompts (alloy-runtime) |
| `POST` | /signals/prompts | `alloy_runtime_post_signals_prompts` | [stub] Create/invoke /signals/prompts (alloy-runtime) |
| `GET` | /signals/prompts/{promptId} | `alloy_runtime_get_signals_prompts_promptId` | [stub] List/get /signals/prompts/{promptId} (alloy-runtime) |
| `GET` | /signals/prompts/{promptId}/versions | `alloy_runtime_get_signals_prompts_promptId_versions` | [stub] List/get /signals/prompts/{promptId}/versions (alloy-runtime) |
| `GET` | /signals/recommendations | `alloy_runtime_get_signals_recommendations` | [stub] List/get /signals/recommendations (alloy-runtime) |
| `GET` | /signals/signals | `alloy_runtime_get_signals_signals` | [stub] List/get /signals/signals (alloy-runtime) |
| `POST` | /signals/signals | `alloy_runtime_post_signals_signals` | [stub] Create/invoke /signals/signals (alloy-runtime) |
| `GET` | /signals/signals/{signalId} | `alloy_runtime_get_signals_signals_signalId` | [stub] List/get /signals/signals/{signalId} (alloy-runtime) |
| `PATCH` | /signals/signals/{signalId}/status | `alloy_runtime_patch_signals_signals_signalId_status` | [stub] Patch /signals/signals/{signalId}/status (alloy-runtime) |
| `GET` | /signals/workflow-runs | `alloy_runtime_get_signals_workflow_runs` | [stub] List/get /signals/workflow-runs (alloy-runtime) |
| `POST` | /signals/workflow-runs | `alloy_runtime_post_signals_workflow_runs` | [stub] Create/invoke /signals/workflow-runs (alloy-runtime) |
| `GET` | /signals/workflow-runs/{runId} | `alloy_runtime_get_signals_workflow_runs_runId` | [stub] List/get /signals/workflow-runs/{runId} (alloy-runtime) |
| `POST` | /signals/workflow-runs/{runId}/replay | `alloy_runtime_post_signals_workflow_runs_runId_replay` | [stub] Create/invoke /signals/workflow-runs/{runId}/replay (alloy-runtime) |
| `GET` | /signals/workflows | `alloy_runtime_get_signals_workflows` | [stub] List/get /signals/workflows (alloy-runtime) |
| `POST` | /signals/workflows | `alloy_runtime_post_signals_workflows` | [stub] Create/invoke /signals/workflows (alloy-runtime) |
| `GET` | /signals/workflows/{workflowId} | `alloy_runtime_get_signals_workflows_workflowId` | [stub] List/get /signals/workflows/{workflowId} (alloy-runtime) |
| `PATCH` | /signals/workflows/{workflowId} | `alloy_runtime_patch_signals_workflows_workflowId` | [stub] Patch /signals/workflows/{workflowId} (alloy-runtime) |
| `DELETE` | /signals/workflows/{workflowId} | `alloy_runtime_delete_signals_workflows_workflowId` | [stub] Delete /signals/workflows/{workflowId} (alloy-runtime) |
| `GET` | /workflow-runs/actions | `alloy_runtime_get_workflow_runs_actions` | [stub] List/get /workflow-runs/actions (alloy-runtime) |
| `POST` | /workflow-runs/actions | `alloy_runtime_post_workflow_runs_actions` | [stub] Create/invoke /workflow-runs/actions (alloy-runtime) |
| `GET` | /workflow-runs/agents | `alloy_runtime_get_workflow_runs_agents` | [stub] List/get /workflow-runs/agents (alloy-runtime) |
| `POST` | /workflow-runs/agents | `alloy_runtime_post_workflow_runs_agents` | [stub] Create/invoke /workflow-runs/agents (alloy-runtime) |
| `GET` | /workflow-runs/agents/{agentId} | `alloy_runtime_get_workflow_runs_agents_agentId` | [stub] List/get /workflow-runs/agents/{agentId} (alloy-runtime) |
| `GET` | /workflow-runs/agents/{agentId}/versions | `alloy_runtime_get_workflow_runs_agents_agentId_versions` | [stub] List/get /workflow-runs/agents/{agentId}/versions (alloy-runtime) |
| `POST` | /workflow-runs/agents/{agentId}/versions | `alloy_runtime_post_workflow_runs_agents_agentId_versions` | [stub] Create/invoke /workflow-runs/agents/{agentId}/versions (alloy-runtime) |
| `GET` | /workflow-runs/models | `alloy_runtime_get_workflow_runs_models` | [stub] List/get /workflow-runs/models (alloy-runtime) |
| `POST` | /workflow-runs/models | `alloy_runtime_post_workflow_runs_models` | [stub] Create/invoke /workflow-runs/models (alloy-runtime) |
| `GET` | /workflow-runs/models/{modelId} | `alloy_runtime_get_workflow_runs_models_modelId` | [stub] List/get /workflow-runs/models/{modelId} (alloy-runtime) |
| `POST` | /workflow-runs/models/route | `alloy_runtime_post_workflow_runs_models_route` | [stub] Create/invoke /workflow-runs/models/route (alloy-runtime) |
| `GET` | /workflow-runs/prompts | `alloy_runtime_get_workflow_runs_prompts` | [stub] List/get /workflow-runs/prompts (alloy-runtime) |
| `POST` | /workflow-runs/prompts | `alloy_runtime_post_workflow_runs_prompts` | [stub] Create/invoke /workflow-runs/prompts (alloy-runtime) |
| `GET` | /workflow-runs/prompts/{promptId} | `alloy_runtime_get_workflow_runs_prompts_promptId` | [stub] List/get /workflow-runs/prompts/{promptId} (alloy-runtime) |
| `GET` | /workflow-runs/prompts/{promptId}/versions | `alloy_runtime_get_workflow_runs_prompts_promptId_versions` | [stub] List/get /workflow-runs/prompts/{promptId}/versions (alloy-runtime) |
| `GET` | /workflow-runs/recommendations | `alloy_runtime_get_workflow_runs_recommendations` | [stub] List/get /workflow-runs/recommendations (alloy-runtime) |
| `GET` | /workflow-runs/signals | `alloy_runtime_get_workflow_runs_signals` | [stub] List/get /workflow-runs/signals (alloy-runtime) |
| `POST` | /workflow-runs/signals | `alloy_runtime_post_workflow_runs_signals` | [stub] Create/invoke /workflow-runs/signals (alloy-runtime) |
| `GET` | /workflow-runs/signals/{signalId} | `alloy_runtime_get_workflow_runs_signals_signalId` | [stub] List/get /workflow-runs/signals/{signalId} (alloy-runtime) |
| `PATCH` | /workflow-runs/signals/{signalId}/status | `alloy_runtime_patch_workflow_runs_signals_signalId_status` | [stub] Patch /workflow-runs/signals/{signalId}/status (alloy-runtime) |
| `GET` | /workflow-runs/workflow-runs | `alloy_runtime_get_workflow_runs_workflow_runs` | [stub] List/get /workflow-runs/workflow-runs (alloy-runtime) |
| `POST` | /workflow-runs/workflow-runs | `alloy_runtime_post_workflow_runs_workflow_runs` | [stub] Create/invoke /workflow-runs/workflow-runs (alloy-runtime) |
| `GET` | /workflow-runs/workflow-runs/{runId} | `alloy_runtime_get_workflow_runs_workflow_runs_runId` | [stub] List/get /workflow-runs/workflow-runs/{runId} (alloy-runtime) |
| `POST` | /workflow-runs/workflow-runs/{runId}/replay | `alloy_runtime_post_workflow_runs_workflow_runs_runId_replay` | [stub] Create/invoke /workflow-runs/workflow-runs/{runId}/replay (alloy-runtime) |
| `GET` | /workflow-runs/workflows | `alloy_runtime_get_workflow_runs_workflows` | [stub] List/get /workflow-runs/workflows (alloy-runtime) |
| `POST` | /workflow-runs/workflows | `alloy_runtime_post_workflow_runs_workflows` | [stub] Create/invoke /workflow-runs/workflows (alloy-runtime) |
| `GET` | /workflow-runs/workflows/{workflowId} | `alloy_runtime_get_workflow_runs_workflows_workflowId` | [stub] List/get /workflow-runs/workflows/{workflowId} (alloy-runtime) |
| `PATCH` | /workflow-runs/workflows/{workflowId} | `alloy_runtime_patch_workflow_runs_workflows_workflowId` | [stub] Patch /workflow-runs/workflows/{workflowId} (alloy-runtime) |
| `DELETE` | /workflow-runs/workflows/{workflowId} | `alloy_runtime_delete_workflow_runs_workflows_workflowId` | [stub] Delete /workflow-runs/workflows/{workflowId} (alloy-runtime) |
| `GET` | /workflows/actions | `alloy_runtime_get_workflows_actions` | [stub] List/get /workflows/actions (alloy-runtime) |
| `POST` | /workflows/actions | `alloy_runtime_post_workflows_actions` | [stub] Create/invoke /workflows/actions (alloy-runtime) |
| `GET` | /workflows/agents | `alloy_runtime_get_workflows_agents` | [stub] List/get /workflows/agents (alloy-runtime) |
| `POST` | /workflows/agents | `alloy_runtime_post_workflows_agents` | [stub] Create/invoke /workflows/agents (alloy-runtime) |
| `GET` | /workflows/agents/{agentId} | `alloy_runtime_get_workflows_agents_agentId` | [stub] List/get /workflows/agents/{agentId} (alloy-runtime) |
| `GET` | /workflows/agents/{agentId}/versions | `alloy_runtime_get_workflows_agents_agentId_versions` | [stub] List/get /workflows/agents/{agentId}/versions (alloy-runtime) |
| `POST` | /workflows/agents/{agentId}/versions | `alloy_runtime_post_workflows_agents_agentId_versions` | [stub] Create/invoke /workflows/agents/{agentId}/versions (alloy-runtime) |
| `GET` | /workflows/models | `alloy_runtime_get_workflows_models` | [stub] List/get /workflows/models (alloy-runtime) |
| `POST` | /workflows/models | `alloy_runtime_post_workflows_models` | [stub] Create/invoke /workflows/models (alloy-runtime) |
| `GET` | /workflows/models/{modelId} | `alloy_runtime_get_workflows_models_modelId` | [stub] List/get /workflows/models/{modelId} (alloy-runtime) |
| `POST` | /workflows/models/route | `alloy_runtime_post_workflows_models_route` | [stub] Create/invoke /workflows/models/route (alloy-runtime) |
| `GET` | /workflows/prompts | `alloy_runtime_get_workflows_prompts` | [stub] List/get /workflows/prompts (alloy-runtime) |
| `POST` | /workflows/prompts | `alloy_runtime_post_workflows_prompts` | [stub] Create/invoke /workflows/prompts (alloy-runtime) |
| `GET` | /workflows/prompts/{promptId} | `alloy_runtime_get_workflows_prompts_promptId` | [stub] List/get /workflows/prompts/{promptId} (alloy-runtime) |
| `GET` | /workflows/prompts/{promptId}/versions | `alloy_runtime_get_workflows_prompts_promptId_versions` | [stub] List/get /workflows/prompts/{promptId}/versions (alloy-runtime) |
| `GET` | /workflows/recommendations | `alloy_runtime_get_workflows_recommendations` | [stub] List/get /workflows/recommendations (alloy-runtime) |
| `GET` | /workflows/signals | `alloy_runtime_get_workflows_signals` | [stub] List/get /workflows/signals (alloy-runtime) |
| `POST` | /workflows/signals | `alloy_runtime_post_workflows_signals` | [stub] Create/invoke /workflows/signals (alloy-runtime) |
| `GET` | /workflows/signals/{signalId} | `alloy_runtime_get_workflows_signals_signalId` | [stub] List/get /workflows/signals/{signalId} (alloy-runtime) |
| `PATCH` | /workflows/signals/{signalId}/status | `alloy_runtime_patch_workflows_signals_signalId_status` | [stub] Patch /workflows/signals/{signalId}/status (alloy-runtime) |
| `GET` | /workflows/workflow-runs | `alloy_runtime_get_workflows_workflow_runs` | [stub] List/get /workflows/workflow-runs (alloy-runtime) |
| `POST` | /workflows/workflow-runs | `alloy_runtime_post_workflows_workflow_runs` | [stub] Create/invoke /workflows/workflow-runs (alloy-runtime) |
| `GET` | /workflows/workflow-runs/{runId} | `alloy_runtime_get_workflows_workflow_runs_runId` | [stub] List/get /workflows/workflow-runs/{runId} (alloy-runtime) |
| `POST` | /workflows/workflow-runs/{runId}/replay | `alloy_runtime_post_workflows_workflow_runs_runId_replay` | [stub] Create/invoke /workflows/workflow-runs/{runId}/replay (alloy-runtime) |
| `GET` | /workflows/workflows | `alloy_runtime_get_workflows_workflows` | [stub] List/get /workflows/workflows (alloy-runtime) |
| `POST` | /workflows/workflows | `alloy_runtime_post_workflows_workflows` | [stub] Create/invoke /workflows/workflows (alloy-runtime) |
| `GET` | /workflows/workflows/{workflowId} | `alloy_runtime_get_workflows_workflows_workflowId` | [stub] List/get /workflows/workflows/{workflowId} (alloy-runtime) |
| `PATCH` | /workflows/workflows/{workflowId} | `alloy_runtime_patch_workflows_workflows_workflowId` | [stub] Patch /workflows/workflows/{workflowId} (alloy-runtime) |
| `DELETE` | /workflows/workflows/{workflowId} | `alloy_runtime_delete_workflows_workflows_workflowId` | [stub] Delete /workflows/workflows/{workflowId} (alloy-runtime) |

<a id="alloy-skills"></a>

## alloy-skills

Auto-generated tag for alloy-skills route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /alloy/alloy/agents/{agentId}/accuracy | `alloy_skills_get_alloy_alloy_agents_agentId_accuracy` | [stub] List/get /alloy/alloy/agents/{agentId}/accuracy (alloy-skills) |
| `GET` | /alloy/alloy/agents/{agentId}/calibration | `alloy_skills_get_alloy_alloy_agents_agentId_calibration` | [stub] List/get /alloy/alloy/agents/{agentId}/calibration (alloy-skills) |
| `GET` | /alloy/alloy/agents/{agentId}/performance | `alloy_skills_get_alloy_alloy_agents_agentId_performance` | [stub] List/get /alloy/alloy/agents/{agentId}/performance (alloy-skills) |
| `GET` | /alloy/alloy/agents/{agentId}/performance/history | `alloy_skills_get_alloy_alloy_agents_agentId_performance_history` | [stub] List/get /alloy/alloy/agents/{agentId}/performance/history (alloy-skills) |
| `POST` | /alloy/alloy/agents/{agentId}/performance/snapshot | `alloy_skills_post_alloy_alloy_agents_agentId_performance_snapshot` | [stub] Create/invoke /alloy/alloy/agents/{agentId}/performance/snapshot (alloy-skills) |
| `GET` | /alloy/alloy/agents/{agentId}/reflections | `alloy_skills_get_alloy_alloy_agents_agentId_reflections` | [stub] List/get /alloy/alloy/agents/{agentId}/reflections (alloy-skills) |
| `GET` | /alloy/alloy/agents/{agentId}/self-reflection | `alloy_skills_get_alloy_alloy_agents_agentId_self_reflection` | [stub] List/get /alloy/alloy/agents/{agentId}/self-reflection (alloy-skills) |
| `GET` | /alloy/alloy/agents/{agentId}/skill-effectiveness | `alloy_skills_get_alloy_alloy_agents_agentId_skill_effectiveness` | [stub] List/get /alloy/alloy/agents/{agentId}/skill-effectiveness (alloy-skills) |
| `GET` | /alloy/alloy/agents/{agentId}/trend | `alloy_skills_get_alloy_alloy_agents_agentId_trend` | [stub] List/get /alloy/alloy/agents/{agentId}/trend (alloy-skills) |
| `POST` | /alloy/alloy/decisions/{decisionId}/outcome | `alloy_skills_post_alloy_alloy_decisions_decisionId_outcome` | [stub] Create/invoke /alloy/alloy/decisions/{decisionId}/outcome (alloy-skills) |
| `GET` | /alloy/alloy/decisions/outcomes | `alloy_skills_get_alloy_alloy_decisions_outcomes` | [stub] List/get /alloy/alloy/decisions/outcomes (alloy-skills) |
| `GET` | /alloy/alloy/performance/alerts | `alloy_skills_get_alloy_alloy_performance_alerts` | [stub] List/get /alloy/alloy/performance/alerts (alloy-skills) |
| `PATCH` | /alloy/alloy/performance/alerts/{alertId}/resolve | `alloy_skills_patch_alloy_alloy_performance_alerts_alertId_resolve` | [stub] Patch /alloy/alloy/performance/alerts/{alertId}/resolve (alloy-skills) |
| `POST` | /alloy/alloy/performance/alerts/evaluate | `alloy_skills_post_alloy_alloy_performance_alerts_evaluate` | [stub] Create/invoke /alloy/alloy/performance/alerts/evaluate (alloy-skills) |
| `GET` | /alloy/alloy/self-improvement/config | `alloy_skills_get_alloy_alloy_self_improvement_config` | [stub] List/get /alloy/alloy/self-improvement/config (alloy-skills) |
| `PUT` | /alloy/alloy/self-improvement/config | `alloy_skills_put_alloy_alloy_self_improvement_config` | [stub] Update /alloy/alloy/self-improvement/config (alloy-skills) |
| `GET` | /alloy/alloy/skills | `alloy_skills_get_alloy_alloy_skills` | [stub] List/get /alloy/alloy/skills (alloy-skills) |
| `POST` | /alloy/alloy/skills | `alloy_skills_post_alloy_alloy_skills` | [stub] Create/invoke /alloy/alloy/skills (alloy-skills) |
| `GET` | /alloy/alloy/skills/{skillId} | `alloy_skills_get_alloy_alloy_skills_skillId` | [stub] List/get /alloy/alloy/skills/{skillId} (alloy-skills) |
| `PATCH` | /alloy/alloy/skills/{skillId} | `alloy_skills_patch_alloy_alloy_skills_skillId` | [stub] Patch /alloy/alloy/skills/{skillId} (alloy-skills) |
| `DELETE` | /alloy/alloy/skills/{skillId} | `alloy_skills_delete_alloy_alloy_skills_skillId` | [stub] Delete /alloy/alloy/skills/{skillId} (alloy-skills) |
| `DELETE` | /alloy/alloy/skills/chains/{chainId} | `alloy_skills_delete_alloy_alloy_skills_chains_chainId` | [stub] Delete /alloy/alloy/skills/chains/{chainId} (alloy-skills) |
| `POST` | /alloy/alloy/skills/chains/{chainId}/plan | `alloy_skills_post_alloy_alloy_skills_chains_chainId_plan` | [stub] Create/invoke /alloy/alloy/skills/chains/{chainId}/plan (alloy-skills) |
| `POST` | /alloy/alloy/skills/chains/compose | `alloy_skills_post_alloy_alloy_skills_chains_compose` | [stub] Create/invoke /alloy/alloy/skills/chains/compose (alloy-skills) |
| `GET` | /alloy/alloy/skills/chains/list | `alloy_skills_get_alloy_alloy_skills_chains_list` | [stub] List/get /alloy/alloy/skills/chains/list (alloy-skills) |
| `GET` | /alloy/alloy/skills/chains/prebuilt/{scenario} | `alloy_skills_get_alloy_alloy_skills_chains_prebuilt_scenario` | [stub] List/get /alloy/alloy/skills/chains/prebuilt/{scenario} (alloy-skills) |
| `POST` | /alloy/alloy/skills/discover | `alloy_skills_post_alloy_alloy_skills_discover` | [stub] Create/invoke /alloy/alloy/skills/discover (alloy-skills) |
| `POST` | /alloy/alloy/skills/select | `alloy_skills_post_alloy_alloy_skills_select` | [stub] Create/invoke /alloy/alloy/skills/select (alloy-skills) |

<a id="alloy-voice"></a>

## alloy-voice

Auto-generated tag for alloy-voice route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /alloy/alloy/voice/notes | `alloy_voice_get_alloy_alloy_voice_notes` | [stub] List/get /alloy/alloy/voice/notes (alloy-voice) |
| `GET` | /alloy/alloy/voice/notes/{id} | `alloy_voice_get_alloy_alloy_voice_notes_id` | [stub] List/get /alloy/alloy/voice/notes/{id} (alloy-voice) |
| `DELETE` | /alloy/alloy/voice/notes/{id} | `alloy_voice_delete_alloy_alloy_voice_notes_id` | [stub] Delete /alloy/alloy/voice/notes/{id} (alloy-voice) |
| `POST` | /alloy/alloy/voice/transcribe | `alloy_voice_post_alloy_alloy_voice_transcribe` | [stub] Create/invoke /alloy/alloy/voice/transcribe (alloy-voice) |
| `POST` | /alloy/alloy/voice/transcribe-text | `alloy_voice_post_alloy_alloy_voice_transcribe_text` | [stub] Create/invoke /alloy/alloy/voice/transcribe-text (alloy-voice) |

<a id="analysis"></a>

## analysis

Auto-generated tag for analysis route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /analysis/terra/broker/overview | `analysis_get_analysis_terra_broker_overview` | [stub] List/get /analysis/terra/broker/overview (analysis) |
| `POST` | /analysis/terra/distress/ai-score | `analysis_post_analysis_terra_distress_ai_score` | [stub] Create/invoke /analysis/terra/distress/ai-score (analysis) |
| `GET` | /analysis/terra/distress/dashboard | `analysis_get_analysis_terra_distress_dashboard` | [stub] List/get /analysis/terra/distress/dashboard (analysis) |
| `GET` | /analysis/terra/investor/opportunities | `analysis_get_analysis_terra_investor_opportunities` | [stub] List/get /analysis/terra/investor/opportunities (analysis) |

<a id="analytics"></a>

## analytics

Auto-generated tag for analytics route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /analytics/metering/analytics/cohort | `analytics_get_analytics_metering_analytics_cohort` | [stub] List/get /analytics/metering/analytics/cohort (analytics) |
| `GET` | /analytics/metering/analytics/overview | `analytics_get_analytics_metering_analytics_overview` | [stub] List/get /analytics/metering/analytics/overview (analytics) |
| `GET` | /analytics/metering/analytics/revenue-trend | `analytics_get_analytics_metering_analytics_revenue_trend` | [stub] List/get /analytics/metering/analytics/revenue-trend (analytics) |
| `GET` | /analytics/metering/analytics/tenant-leaderboard | `analytics_get_analytics_metering_analytics_tenant_leaderboard` | [stub] List/get /analytics/metering/analytics/tenant-leaderboard (analytics) |

<a id="analytics-engine-public"></a>

## analytics-engine-public

Auto-generated tag for analytics-engine-public route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `POST` | /analytics-engine/analytics-engine/events | `analytics_engine_public_post_analytics_engine_analytics_engine_events` | [stub] Create/invoke /analytics-engine/analytics-engine/events (analytics-engine-public) |
| `POST` | /analytics-engine/analytics-engine/events/batch | `analytics_engine_public_post_analytics_engine_analytics_engine_events_batch` | [stub] Create/invoke /analytics-engine/analytics-engine/events/batch (analytics-engine-public) |

<a id="apm"></a>

## apm

Auto-generated tag for apm route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /apm/apm/external-calls | `apm_get_apm_apm_external_calls` | [stub] List/get /apm/apm/external-calls (apm) |
| `GET` | /apm/apm/latency | `apm_get_apm_apm_latency` | [stub] List/get /apm/apm/latency (apm) |
| `GET` | /apm/apm/snapshot | `apm_get_apm_apm_snapshot` | [stub] List/get /apm/apm/snapshot (apm) |
| `GET` | /apm/apm/spans | `apm_get_apm_apm_spans` | [stub] List/get /apm/apm/spans (apm) |

<a id="approvals"></a>

## approvals

Auto-generated tag for approvals route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /approvals/approvals | `approvals_get_approvals_approvals` | [stub] List/get /approvals/approvals (approvals) |
| `POST` | /approvals/approvals | `approvals_post_approvals_approvals` | [stub] Create/invoke /approvals/approvals (approvals) |
| `GET` | /approvals/approvals/{id} | `approvals_get_approvals_approvals_id` | [stub] List/get /approvals/approvals/{id} (approvals) |
| `GET` | /approvals/approvals/{id}/audit-trail | `approvals_get_approvals_approvals_id_audit_trail` | [stub] List/get /approvals/approvals/{id}/audit-trail (approvals) |
| `POST` | /approvals/approvals/{id}/comment | `approvals_post_approvals_approvals_id_comment` | [stub] Create/invoke /approvals/approvals/{id}/comment (approvals) |
| `GET` | /approvals/approvals/{id}/comments | `approvals_get_approvals_approvals_id_comments` | [stub] List/get /approvals/approvals/{id}/comments (approvals) |
| `POST` | /approvals/approvals/{id}/escalate | `approvals_post_approvals_approvals_id_escalate` | [stub] Create/invoke /approvals/approvals/{id}/escalate (approvals) |
| `POST` | /approvals/approvals/{id}/review | `approvals_post_approvals_approvals_id_review` | [stub] Create/invoke /approvals/approvals/{id}/review (approvals) |
| `GET` | /approvals/approvals/by-resource/{resourceType}/{resourceId} | `approvals_get_approvals_approvals_by_resource_resourceType_resourceId` | [stub] List/get /approvals/approvals/by-resource/{resourceType}/{resourceId} (approvals) |
| `POST` | /approvals/audit-log/policy-appeal | `approvals_post_approvals_audit_log_policy_appeal` | [stub] Create/invoke /approvals/audit-log/policy-appeal (approvals) |
| `GET` | /audit-log/approvals | `approvals_get_audit_log_approvals` | [stub] List/get /audit-log/approvals (approvals) |
| `POST` | /audit-log/approvals | `approvals_post_audit_log_approvals` | [stub] Create/invoke /audit-log/approvals (approvals) |
| `GET` | /audit-log/approvals/{id} | `approvals_get_audit_log_approvals_id` | [stub] List/get /audit-log/approvals/{id} (approvals) |
| `GET` | /audit-log/approvals/{id}/audit-trail | `approvals_get_audit_log_approvals_id_audit_trail` | [stub] List/get /audit-log/approvals/{id}/audit-trail (approvals) |
| `POST` | /audit-log/approvals/{id}/comment | `approvals_post_audit_log_approvals_id_comment` | [stub] Create/invoke /audit-log/approvals/{id}/comment (approvals) |
| `GET` | /audit-log/approvals/{id}/comments | `approvals_get_audit_log_approvals_id_comments` | [stub] List/get /audit-log/approvals/{id}/comments (approvals) |
| `POST` | /audit-log/approvals/{id}/escalate | `approvals_post_audit_log_approvals_id_escalate` | [stub] Create/invoke /audit-log/approvals/{id}/escalate (approvals) |
| `POST` | /audit-log/approvals/{id}/review | `approvals_post_audit_log_approvals_id_review` | [stub] Create/invoke /audit-log/approvals/{id}/review (approvals) |
| `GET` | /audit-log/approvals/by-resource/{resourceType}/{resourceId} | `approvals_get_audit_log_approvals_by_resource_resourceType_resourceId` | [stub] List/get /audit-log/approvals/by-resource/{resourceType}/{resourceId} (approvals) |
| `POST` | /audit-log/audit-log/policy-appeal | `approvals_post_audit_log_audit_log_policy_appeal` | [stub] Create/invoke /audit-log/audit-log/policy-appeal (approvals) |

<a id="apps-registry"></a>

## apps-registry

Auto-generated tag for apps-registry route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /apps-registry/admin/apps | `apps_registry_get_apps_registry_admin_apps` | [stub] List/get /apps-registry/admin/apps (apps-registry) |
| `POST` | /apps-registry/admin/apps | `apps_registry_post_apps_registry_admin_apps` | [stub] Create/invoke /apps-registry/admin/apps (apps-registry) |
| `DELETE` | /apps-registry/admin/apps/{slug} | `apps_registry_delete_apps_registry_admin_apps_slug` | [stub] Delete /apps-registry/admin/apps/{slug} (apps-registry) |
| `PUT` | /apps-registry/admin/apps/{slug}/owner-team | `apps_registry_put_apps_registry_admin_apps_slug_owner_team` | [stub] Update /apps-registry/admin/apps/{slug}/owner-team (apps-registry) |
| `PUT` | /apps-registry/admin/apps/{slug}/status | `apps_registry_put_apps_registry_admin_apps_slug_status` | [stub] Update /apps-registry/admin/apps/{slug}/status (apps-registry) |
| `GET` | /apps-registry/admin/apps/activity | `apps_registry_get_apps_registry_admin_apps_activity` | [stub] List/get /apps-registry/admin/apps/activity (apps-registry) |

<a id="assets-cases"></a>

## assets-cases

Auto-generated tag for assets-cases route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /assets-cases/firestorm/ai-governance/log | `assets_cases_get_assets_cases_firestorm_ai_governance_log` | [stub] List/get /assets-cases/firestorm/ai-governance/log (assets-cases) |
| `GET` | /assets-cases/firestorm/ai-governance/registry | `assets_cases_get_assets_cases_firestorm_ai_governance_registry` | [stub] List/get /assets-cases/firestorm/ai-governance/registry (assets-cases) |
| `GET` | /assets-cases/firestorm/assets | `assets_cases_get_assets_cases_firestorm_assets` | [stub] List/get /assets-cases/firestorm/assets (assets-cases) |
| `POST` | /assets-cases/firestorm/assets | `assets_cases_post_assets_cases_firestorm_assets` | [stub] Create/invoke /assets-cases/firestorm/assets (assets-cases) |
| `GET` | /assets-cases/firestorm/assets/{id} | `assets_cases_get_assets_cases_firestorm_assets_id` | [stub] List/get /assets-cases/firestorm/assets/{id} (assets-cases) |
| `PUT` | /assets-cases/firestorm/assets/{id} | `assets_cases_put_assets_cases_firestorm_assets_id` | [stub] Update /assets-cases/firestorm/assets/{id} (assets-cases) |
| `GET` | /assets-cases/firestorm/cases | `assets_cases_get_assets_cases_firestorm_cases` | [stub] List/get /assets-cases/firestorm/cases (assets-cases) |
| `POST` | /assets-cases/firestorm/cases | `assets_cases_post_assets_cases_firestorm_cases` | [stub] Create/invoke /assets-cases/firestorm/cases (assets-cases) |
| `GET` | /assets-cases/firestorm/cases/{id} | `assets_cases_get_assets_cases_firestorm_cases_id` | [stub] List/get /assets-cases/firestorm/cases/{id} (assets-cases) |
| `PATCH` | /assets-cases/firestorm/cases/{id} | `assets_cases_patch_assets_cases_firestorm_cases_id` | [stub] Patch /assets-cases/firestorm/cases/{id} (assets-cases) |
| `GET` | /assets-cases/firestorm/hardening-controls | `assets_cases_get_assets_cases_firestorm_hardening_controls` | [stub] List/get /assets-cases/firestorm/hardening-controls (assets-cases) |
| `GET` | /assets-cases/firestorm/hardening-controls/{id} | `assets_cases_get_assets_cases_firestorm_hardening_controls_id` | [stub] List/get /assets-cases/firestorm/hardening-controls/{id} (assets-cases) |
| `PUT` | /assets-cases/firestorm/hardening-controls/{id} | `assets_cases_put_assets_cases_firestorm_hardening_controls_id` | [stub] Update /assets-cases/firestorm/hardening-controls/{id} (assets-cases) |
| `GET` | /assets-cases/firestorm/hardening-summary | `assets_cases_get_assets_cases_firestorm_hardening_summary` | [stub] List/get /assets-cases/firestorm/hardening-summary (assets-cases) |
| `POST` | /assets-cases/firestorm/ingest/syslog | `assets_cases_post_assets_cases_firestorm_ingest_syslog` | [stub] Create/invoke /assets-cases/firestorm/ingest/syslog (assets-cases) |
| `GET` | /assets-cases/firestorm/live/greynoise-ip | `assets_cases_get_assets_cases_firestorm_live_greynoise_ip` | [stub] List/get /assets-cases/firestorm/live/greynoise-ip (assets-cases) |
| `GET` | /assets-cases/firestorm/live/malware-bazaar | `assets_cases_get_assets_cases_firestorm_live_malware_bazaar` | [stub] List/get /assets-cases/firestorm/live/malware-bazaar (assets-cases) |
| `GET` | /assets-cases/firestorm/live/shodan-ip | `assets_cases_get_assets_cases_firestorm_live_shodan_ip` | [stub] List/get /assets-cases/firestorm/live/shodan-ip (assets-cases) |
| `GET` | /assets-cases/firestorm/live/threat-aggregator | `assets_cases_get_assets_cases_firestorm_live_threat_aggregator` | [stub] List/get /assets-cases/firestorm/live/threat-aggregator (assets-cases) |
| `GET` | /assets-cases/firestorm/mitre-detections | `assets_cases_get_assets_cases_firestorm_mitre_detections` | [stub] List/get /assets-cases/firestorm/mitre-detections (assets-cases) |
| `GET` | /assets-cases/firestorm/mitre-detections/{techniqueId} | `assets_cases_get_assets_cases_firestorm_mitre_detections_techniqueId` | [stub] List/get /assets-cases/firestorm/mitre-detections/{techniqueId} (assets-cases) |
| `POST` | /assets-cases/firestorm/push-token | `assets_cases_post_assets_cases_firestorm_push_token` | [stub] Create/invoke /assets-cases/firestorm/push-token (assets-cases) |
| `POST` | /assets-cases/firestorm/seed | `assets_cases_post_assets_cases_firestorm_seed` | [stub] Create/invoke /assets-cases/firestorm/seed (assets-cases) |
| `POST` | /assets-cases/firestorm/tradecraft/case-memory | `assets_cases_post_assets_cases_firestorm_tradecraft_case_memory` | [stub] Create/invoke /assets-cases/firestorm/tradecraft/case-memory (assets-cases) |
| `GET` | /assets-cases/firestorm/tradecraft/case-memory/{caseId} | `assets_cases_get_assets_cases_firestorm_tradecraft_case_memory_caseId` | [stub] List/get /assets-cases/firestorm/tradecraft/case-memory/{caseId} (assets-cases) |
| `PUT` | /assets-cases/firestorm/tradecraft/case-memory/{caseId} | `assets_cases_put_assets_cases_firestorm_tradecraft_case_memory_caseId` | [stub] Update /assets-cases/firestorm/tradecraft/case-memory/{caseId} (assets-cases) |
| `GET` | /assets-cases/firestorm/tradecraft/decisions | `assets_cases_get_assets_cases_firestorm_tradecraft_decisions` | [stub] List/get /assets-cases/firestorm/tradecraft/decisions (assets-cases) |
| `POST` | /assets-cases/firestorm/tradecraft/decisions | `assets_cases_post_assets_cases_firestorm_tradecraft_decisions` | [stub] Create/invoke /assets-cases/firestorm/tradecraft/decisions (assets-cases) |
| `GET` | /assets-cases/firestorm/tradecraft/decisions/{objectId} | `assets_cases_get_assets_cases_firestorm_tradecraft_decisions_objectId` | [stub] List/get /assets-cases/firestorm/tradecraft/decisions/{objectId} (assets-cases) |
| `PUT` | /assets-cases/firestorm/tradecraft/decisions/{objectId} | `assets_cases_put_assets_cases_firestorm_tradecraft_decisions_objectId` | [stub] Update /assets-cases/firestorm/tradecraft/decisions/{objectId} (assets-cases) |
| `GET` | /assets-cases/firestorm/tradecraft/evidence-index | `assets_cases_get_assets_cases_firestorm_tradecraft_evidence_index` | [stub] List/get /assets-cases/firestorm/tradecraft/evidence-index (assets-cases) |
| `POST` | /assets-cases/firestorm/tradecraft/evidence-index/query | `assets_cases_post_assets_cases_firestorm_tradecraft_evidence_index_query` | [stub] Create/invoke /assets-cases/firestorm/tradecraft/evidence-index/query (assets-cases) |
| `GET` | /assets-cases/firestorm/tradecraft/notebook | `assets_cases_get_assets_cases_firestorm_tradecraft_notebook` | [stub] List/get /assets-cases/firestorm/tradecraft/notebook (assets-cases) |
| `POST` | /assets-cases/firestorm/tradecraft/notebook | `assets_cases_post_assets_cases_firestorm_tradecraft_notebook` | [stub] Create/invoke /assets-cases/firestorm/tradecraft/notebook (assets-cases) |
| `PUT` | /assets-cases/firestorm/tradecraft/notebook/{noteId} | `assets_cases_put_assets_cases_firestorm_tradecraft_notebook_noteId` | [stub] Update /assets-cases/firestorm/tradecraft/notebook/{noteId} (assets-cases) |
| `DELETE` | /assets-cases/firestorm/tradecraft/notebook/{noteId} | `assets_cases_delete_assets_cases_firestorm_tradecraft_notebook_noteId` | [stub] Delete /assets-cases/firestorm/tradecraft/notebook/{noteId} (assets-cases) |
| `GET` | /assets-cases/firestorm/workflow-actions | `assets_cases_get_assets_cases_firestorm_workflow_actions` | [stub] List/get /assets-cases/firestorm/workflow-actions (assets-cases) |
| `POST` | /assets-cases/firestorm/workflow-actions | `assets_cases_post_assets_cases_firestorm_workflow_actions` | [stub] Create/invoke /assets-cases/firestorm/workflow-actions (assets-cases) |
| `PATCH` | /assets-cases/firestorm/workflow-actions/{id} | `assets_cases_patch_assets_cases_firestorm_workflow_actions_id` | [stub] Patch /assets-cases/firestorm/workflow-actions/{id} (assets-cases) |

<a id="atlas-scene-export"></a>

## atlas-scene-export

Auto-generated tag for atlas-scene-export route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `POST` | /atlas/branch/atlas/branch/export | `atlas_scene_export_post_atlas_branch_atlas_branch_export` | [stub] Create/invoke /atlas/branch/atlas/branch/export (atlas-scene-export) |
| `GET` | /atlas/branch/atlas/export/openusd/{sceneId} | `atlas_scene_export_get_atlas_branch_atlas_export_openusd_sceneId` | [stub] List/get /atlas/branch/atlas/export/openusd/{sceneId} (atlas-scene-export) |
| `POST` | /atlas/branch/atlas/proof-bundle/export | `atlas_scene_export_post_atlas_branch_atlas_proof_bundle_export` | [stub] Create/invoke /atlas/branch/atlas/proof-bundle/export (atlas-scene-export) |
| `GET` | /atlas/branch/atlas/snapshot/{sceneId} | `atlas_scene_export_get_atlas_branch_atlas_snapshot_sceneId` | [stub] List/get /atlas/branch/atlas/snapshot/{sceneId} (atlas-scene-export) |
| `POST` | /atlas/export/atlas/branch/export | `atlas_scene_export_post_atlas_export_atlas_branch_export` | [stub] Create/invoke /atlas/export/atlas/branch/export (atlas-scene-export) |
| `GET` | /atlas/export/atlas/export/openusd/{sceneId} | `atlas_scene_export_get_atlas_export_atlas_export_openusd_sceneId` | [stub] List/get /atlas/export/atlas/export/openusd/{sceneId} (atlas-scene-export) |
| `POST` | /atlas/export/atlas/proof-bundle/export | `atlas_scene_export_post_atlas_export_atlas_proof_bundle_export` | [stub] Create/invoke /atlas/export/atlas/proof-bundle/export (atlas-scene-export) |
| `GET` | /atlas/export/atlas/snapshot/{sceneId} | `atlas_scene_export_get_atlas_export_atlas_snapshot_sceneId` | [stub] List/get /atlas/export/atlas/snapshot/{sceneId} (atlas-scene-export) |
| `POST` | /atlas/proof-bundle/atlas/branch/export | `atlas_scene_export_post_atlas_proof_bundle_atlas_branch_export` | [stub] Create/invoke /atlas/proof-bundle/atlas/branch/export (atlas-scene-export) |
| `GET` | /atlas/proof-bundle/atlas/export/openusd/{sceneId} | `atlas_scene_export_get_atlas_proof_bundle_atlas_export_openusd_sceneId` | [stub] List/get /atlas/proof-bundle/atlas/export/openusd/{sceneId} (atlas-scene-export) |
| `POST` | /atlas/proof-bundle/atlas/proof-bundle/export | `atlas_scene_export_post_atlas_proof_bundle_atlas_proof_bundle_export` | [stub] Create/invoke /atlas/proof-bundle/atlas/proof-bundle/export (atlas-scene-export) |
| `GET` | /atlas/proof-bundle/atlas/snapshot/{sceneId} | `atlas_scene_export_get_atlas_proof_bundle_atlas_snapshot_sceneId` | [stub] List/get /atlas/proof-bundle/atlas/snapshot/{sceneId} (atlas-scene-export) |
| `POST` | /atlas/snapshot/atlas/branch/export | `atlas_scene_export_post_atlas_snapshot_atlas_branch_export` | [stub] Create/invoke /atlas/snapshot/atlas/branch/export (atlas-scene-export) |
| `GET` | /atlas/snapshot/atlas/export/openusd/{sceneId} | `atlas_scene_export_get_atlas_snapshot_atlas_export_openusd_sceneId` | [stub] List/get /atlas/snapshot/atlas/export/openusd/{sceneId} (atlas-scene-export) |
| `POST` | /atlas/snapshot/atlas/proof-bundle/export | `atlas_scene_export_post_atlas_snapshot_atlas_proof_bundle_export` | [stub] Create/invoke /atlas/snapshot/atlas/proof-bundle/export (atlas-scene-export) |
| `GET` | /atlas/snapshot/atlas/snapshot/{sceneId} | `atlas_scene_export_get_atlas_snapshot_atlas_snapshot_sceneId` | [stub] List/get /atlas/snapshot/atlas/snapshot/{sceneId} (atlas-scene-export) |

<a id="atlas-spatial-runtime"></a>

## atlas-spatial-runtime

Auto-generated tag for atlas-spatial-runtime route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /atlas/spatial/atlas/spatial/branches | `atlas_spatial_runtime_get_atlas_spatial_atlas_spatial_branches` | [stub] List/get /atlas/spatial/atlas/spatial/branches (atlas-spatial-runtime) |
| `POST` | /atlas/spatial/atlas/spatial/branches | `atlas_spatial_runtime_post_atlas_spatial_atlas_spatial_branches` | [stub] Create/invoke /atlas/spatial/atlas/spatial/branches (atlas-spatial-runtime) |
| `GET` | /atlas/spatial/atlas/spatial/branches/{branchId} | `atlas_spatial_runtime_get_atlas_spatial_atlas_spatial_branches_branchId` | [stub] List/get /atlas/spatial/atlas/spatial/branches/{branchId} (atlas-spatial-runtime) |
| `PATCH` | /atlas/spatial/atlas/spatial/branches/{branchId} | `atlas_spatial_runtime_patch_atlas_spatial_atlas_spatial_branches_branchId` | [stub] Patch /atlas/spatial/atlas/spatial/branches/{branchId} (atlas-spatial-runtime) |
| `DELETE` | /atlas/spatial/atlas/spatial/branches/{branchId} | `atlas_spatial_runtime_delete_atlas_spatial_atlas_spatial_branches_branchId` | [stub] Delete /atlas/spatial/atlas/spatial/branches/{branchId} (atlas-spatial-runtime) |
| `GET` | /atlas/spatial/atlas/spatial/branches/compare | `atlas_spatial_runtime_get_atlas_spatial_atlas_spatial_branches_compare` | [stub] List/get /atlas/spatial/atlas/spatial/branches/compare (atlas-spatial-runtime) |
| `GET` | /atlas/spatial/atlas/spatial/cross-domain/summary | `atlas_spatial_runtime_get_atlas_spatial_atlas_spatial_cross_domain_summary` | [stub] List/get /atlas/spatial/atlas/spatial/cross-domain/summary (atlas-spatial-runtime) |
| `GET` | /atlas/spatial/atlas/spatial/drift/{twinId}/latest | `atlas_spatial_runtime_get_atlas_spatial_atlas_spatial_drift_twinId_latest` | [stub] List/get /atlas/spatial/atlas/spatial/drift/{twinId}/latest (atlas-spatial-runtime) |
| `POST` | /atlas/spatial/atlas/spatial/drift/assess | `atlas_spatial_runtime_post_atlas_spatial_atlas_spatial_drift_assess` | [stub] Create/invoke /atlas/spatial/atlas/spatial/drift/assess (atlas-spatial-runtime) |
| `GET` | /atlas/spatial/atlas/spatial/memory/{twinId} | `atlas_spatial_runtime_get_atlas_spatial_atlas_spatial_memory_twinId` | [stub] List/get /atlas/spatial/atlas/spatial/memory/{twinId} (atlas-spatial-runtime) |
| `POST` | /atlas/spatial/atlas/spatial/memory/index | `atlas_spatial_runtime_post_atlas_spatial_atlas_spatial_memory_index` | [stub] Create/invoke /atlas/spatial/atlas/spatial/memory/index (atlas-spatial-runtime) |
| `GET` | /atlas/spatial/atlas/spatial/model-lanes | `atlas_spatial_runtime_get_atlas_spatial_atlas_spatial_model_lanes` | [stub] List/get /atlas/spatial/atlas/spatial/model-lanes (atlas-spatial-runtime) |
| `POST` | /atlas/spatial/atlas/spatial/model-lanes/invoke | `atlas_spatial_runtime_post_atlas_spatial_atlas_spatial_model_lanes_invoke` | [stub] Create/invoke /atlas/spatial/atlas/spatial/model-lanes/invoke (atlas-spatial-runtime) |
| `GET` | /atlas/spatial/atlas/spatial/proof-bundle/{contentType}/{contentId} | `atlas_spatial_runtime_get_atlas_spatial_atlas_spatial_proof_bundle_contentType_contentId` | [stub] List/get /atlas/spatial/atlas/spatial/proof-bundle/{contentType}/{contentId} (atlas-spatial-runtime) |
| `POST` | /atlas/spatial/atlas/spatial/proof-bundle/tag | `atlas_spatial_runtime_post_atlas_spatial_atlas_spatial_proof_bundle_tag` | [stub] Create/invoke /atlas/spatial/atlas/spatial/proof-bundle/tag (atlas-spatial-runtime) |
| `GET` | /atlas/spatial/atlas/spatial/replay/{twinId}/frame/{frameIndex} | `atlas_spatial_runtime_get_atlas_spatial_atlas_spatial_replay_twinId_frame_frameIndex` | [stub] List/get /atlas/spatial/atlas/spatial/replay/{twinId}/frame/{frameIndex} (atlas-spatial-runtime) |
| `GET` | /atlas/spatial/atlas/spatial/replay/{twinId}/timeline | `atlas_spatial_runtime_get_atlas_spatial_atlas_spatial_replay_twinId_timeline` | [stub] List/get /atlas/spatial/atlas/spatial/replay/{twinId}/timeline (atlas-spatial-runtime) |
| `GET` | /atlas/spatial/atlas/spatial/snapshots/{twinId} | `atlas_spatial_runtime_get_atlas_spatial_atlas_spatial_snapshots_twinId` | [stub] List/get /atlas/spatial/atlas/spatial/snapshots/{twinId} (atlas-spatial-runtime) |
| `POST` | /atlas/spatial/atlas/spatial/snapshots/compare | `atlas_spatial_runtime_post_atlas_spatial_atlas_spatial_snapshots_compare` | [stub] Create/invoke /atlas/spatial/atlas/spatial/snapshots/compare (atlas-spatial-runtime) |
| `POST` | /atlas/spatial/atlas/spatial/twins/incident | `atlas_spatial_runtime_post_atlas_spatial_atlas_spatial_twins_incident` | [stub] Create/invoke /atlas/spatial/atlas/spatial/twins/incident (atlas-spatial-runtime) |
| `POST` | /atlas/spatial/atlas/spatial/twins/matter | `atlas_spatial_runtime_post_atlas_spatial_atlas_spatial_twins_matter` | [stub] Create/invoke /atlas/spatial/atlas/spatial/twins/matter (atlas-spatial-runtime) |
| `POST` | /atlas/spatial/atlas/spatial/twins/port | `atlas_spatial_runtime_post_atlas_spatial_atlas_spatial_twins_port` | [stub] Create/invoke /atlas/spatial/atlas/spatial/twins/port (atlas-spatial-runtime) |
| `POST` | /atlas/spatial/atlas/spatial/twins/portfolio | `atlas_spatial_runtime_post_atlas_spatial_atlas_spatial_twins_portfolio` | [stub] Create/invoke /atlas/spatial/atlas/spatial/twins/portfolio (atlas-spatial-runtime) |
| `GET` | /atlas/spatial/atlas/spatial/twins/sync-status | `atlas_spatial_runtime_get_atlas_spatial_atlas_spatial_twins_sync_status` | [stub] List/get /atlas/spatial/atlas/spatial/twins/sync-status (atlas-spatial-runtime) |
| `GET` | /atlas/spatial/atlas/spatial/worldline/overlays | `atlas_spatial_runtime_get_atlas_spatial_atlas_spatial_worldline_overlays` | [stub] List/get /atlas/spatial/atlas/spatial/worldline/overlays (atlas-spatial-runtime) |
| `POST` | /atlas/spatial/atlas/spatial/worldline/overlays | `atlas_spatial_runtime_post_atlas_spatial_atlas_spatial_worldline_overlays` | [stub] Create/invoke /atlas/spatial/atlas/spatial/worldline/overlays (atlas-spatial-runtime) |
| `GET` | /atlas/spatial/atlas/spatial/worldline/overlays/{overlayId} | `atlas_spatial_runtime_get_atlas_spatial_atlas_spatial_worldline_overlays_overlayId` | [stub] List/get /atlas/spatial/atlas/spatial/worldline/overlays/{overlayId} (atlas-spatial-runtime) |
| `PATCH` | /atlas/spatial/atlas/spatial/worldline/overlays/{overlayId}/expire | `atlas_spatial_runtime_patch_atlas_spatial_atlas_spatial_worldline_overlays_overlayId_expire` | [stub] Patch /atlas/spatial/atlas/spatial/worldline/overlays/{overlayId}/expire (atlas-spatial-runtime) |

<a id="audit-chain"></a>

## audit-chain

Auto-generated tag for audit-chain route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /audit-chain/audit-chain/events | `audit_chain_get_audit_chain_audit_chain_events` | [stub] List/get /audit-chain/audit-chain/events (audit-chain) |
| `POST` | /audit-chain/audit-chain/events | `audit_chain_post_audit_chain_audit_chain_events` | [stub] Create/invoke /audit-chain/audit-chain/events (audit-chain) |
| `GET` | /audit-chain/audit-chain/export | `audit_chain_get_audit_chain_audit_chain_export` | [stub] List/get /audit-chain/audit-chain/export (audit-chain) |
| `GET` | /audit-chain/audit-chain/verify | `audit_chain_get_audit_chain_audit_chain_verify` | [stub] List/get /audit-chain/audit-chain/verify (audit-chain) |

<a id="booking"></a>

## booking

Auto-generated tag for booking route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /booking/booking/appointments | `booking_get_booking_booking_appointments` | [stub] List/get /booking/booking/appointments (booking) |
| `GET` | /booking/booking/appointments/{id} | `booking_get_booking_booking_appointments_id` | [stub] List/get /booking/booking/appointments/{id} (booking) |
| `GET` | /booking/booking/health | `booking_get_booking_booking_health` | [stub] List/get /booking/booking/health (booking) |
| `GET` | /booking/booking/search | `booking_get_booking_booking_search` | [stub] List/get /booking/booking/search (booking) |

<a id="briefing"></a>

## briefing

Auto-generated tag for briefing route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /briefing/briefing/{date} | `briefing_get_briefing_briefing_date` | [stub] List/get /briefing/briefing/{date} (briefing) |
| `POST` | /briefing/briefing/generate | `briefing_post_briefing_briefing_generate` | [stub] Create/invoke /briefing/briefing/generate (briefing) |
| `GET` | /briefing/briefing/history | `briefing_get_briefing_briefing_history` | [stub] List/get /briefing/briefing/history (briefing) |
| `GET` | /briefing/briefing/today | `briefing_get_briefing_briefing_today` | [stub] List/get /briefing/briefing/today (briefing) |

<a id="briefings"></a>

## briefings

Auto-generated tag for briefings route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /briefings/briefings | `briefings_get_briefings_briefings` | [stub] List/get /briefings/briefings (briefings) |
| `GET` | /briefings/briefings/{domain} | `briefings_get_briefings_briefings_domain` | [stub] List/get /briefings/briefings/{domain} (briefings) |
| `PUT` | /briefings/briefings/{id}/approve | `briefings_put_briefings_briefings_id_approve` | [stub] Update /briefings/briefings/{id}/approve (briefings) |
| `PUT` | /briefings/briefings/{id}/archive | `briefings_put_briefings_briefings_id_archive` | [stub] Update /briefings/briefings/{id}/archive (briefings) |
| `POST` | /briefings/briefings/generate | `briefings_post_briefings_briefings_generate` | [stub] Create/invoke /briefings/briefings/generate (briefings) |

<a id="business-events-ingestion"></a>

## business-events-ingestion

Auto-generated tag for business-events-ingestion route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `POST` | /business-events/business-events/emit | `business_events_ingestion_post_business_events_business_events_emit` | [stub] Create/invoke /business-events/business-events/emit (business-events-ingestion) |
| `GET` | /business-events/business-events/events | `business_events_ingestion_get_business_events_business_events_events` | [stub] List/get /business-events/business-events/events (business-events-ingestion) |
| `POST` | /business-events/business-events/kpi | `business_events_ingestion_post_business_events_business_events_kpi` | [stub] Create/invoke /business-events/business-events/kpi (business-events-ingestion) |
| `GET` | /business-events/business-events/summary | `business_events_ingestion_get_business_events_business_events_summary` | [stub] List/get /business-events/business-events/summary (business-events-ingestion) |
| `POST` | /business-events/business-events/transactions | `business_events_ingestion_post_business_events_business_events_transactions` | [stub] Create/invoke /business-events/business-events/transactions (business-events-ingestion) |

<a id="capital-readiness"></a>

## capital-readiness

Auto-generated tag for capital-readiness route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /capital/capital/artifacts | `capital_readiness_get_capital_capital_artifacts` | [stub] List/get /capital/capital/artifacts (capital-readiness) |
| `POST` | /capital/capital/artifacts | `capital_readiness_post_capital_capital_artifacts` | [stub] Create/invoke /capital/capital/artifacts (capital-readiness) |
| `PATCH` | /capital/capital/artifacts/{id} | `capital_readiness_patch_capital_capital_artifacts_id` | [stub] Patch /capital/capital/artifacts/{id} (capital-readiness) |
| `DELETE` | /capital/capital/artifacts/{id} | `capital_readiness_delete_capital_capital_artifacts_id` | [stub] Delete /capital/capital/artifacts/{id} (capital-readiness) |
| `GET` | /capital/capital/cap-table | `capital_readiness_get_capital_capital_cap_table` | [stub] List/get /capital/capital/cap-table (capital-readiness) |
| `POST` | /capital/capital/cap-table | `capital_readiness_post_capital_capital_cap_table` | [stub] Create/invoke /capital/capital/cap-table (capital-readiness) |
| `PATCH` | /capital/capital/cap-table/{id} | `capital_readiness_patch_capital_capital_cap_table_id` | [stub] Patch /capital/capital/cap-table/{id} (capital-readiness) |
| `DELETE` | /capital/capital/cap-table/{id} | `capital_readiness_delete_capital_capital_cap_table_id` | [stub] Delete /capital/capital/cap-table/{id} (capital-readiness) |
| `GET` | /capital/capital/dashboard | `capital_readiness_get_capital_capital_dashboard` | [stub] List/get /capital/capital/dashboard (capital-readiness) |
| `PATCH` | /capital/capital/diligence-checklist-items/{id} | `capital_readiness_patch_capital_capital_diligence_checklist_items_id` | [stub] Patch /capital/capital/diligence-checklist-items/{id} (capital-readiness) |
| `DELETE` | /capital/capital/diligence-checklist-items/{id} | `capital_readiness_delete_capital_capital_diligence_checklist_items_id` | [stub] Delete /capital/capital/diligence-checklist-items/{id} (capital-readiness) |
| `GET` | /capital/capital/diligence-checklists | `capital_readiness_get_capital_capital_diligence_checklists` | [stub] List/get /capital/capital/diligence-checklists (capital-readiness) |
| `POST` | /capital/capital/diligence-checklists | `capital_readiness_post_capital_capital_diligence_checklists` | [stub] Create/invoke /capital/capital/diligence-checklists (capital-readiness) |
| `GET` | /capital/capital/diligence-checklists/{id} | `capital_readiness_get_capital_capital_diligence_checklists_id` | [stub] List/get /capital/capital/diligence-checklists/{id} (capital-readiness) |
| `PATCH` | /capital/capital/diligence-checklists/{id} | `capital_readiness_patch_capital_capital_diligence_checklists_id` | [stub] Patch /capital/capital/diligence-checklists/{id} (capital-readiness) |
| `DELETE` | /capital/capital/diligence-checklists/{id} | `capital_readiness_delete_capital_capital_diligence_checklists_id` | [stub] Delete /capital/capital/diligence-checklists/{id} (capital-readiness) |
| `GET` | /capital/capital/financial-models | `capital_readiness_get_capital_capital_financial_models` | [stub] List/get /capital/capital/financial-models (capital-readiness) |
| `POST` | /capital/capital/financial-models | `capital_readiness_post_capital_capital_financial_models` | [stub] Create/invoke /capital/capital/financial-models (capital-readiness) |
| `PATCH` | /capital/capital/financial-models/{id} | `capital_readiness_patch_capital_capital_financial_models_id` | [stub] Patch /capital/capital/financial-models/{id} (capital-readiness) |
| `DELETE` | /capital/capital/financial-models/{id} | `capital_readiness_delete_capital_capital_financial_models_id` | [stub] Delete /capital/capital/financial-models/{id} (capital-readiness) |
| `POST` | /capital/capital/generate-investor-packet/{id} | `capital_readiness_post_capital_capital_generate_investor_packet_id` | [stub] Create/invoke /capital/capital/generate-investor-packet/{id} (capital-readiness) |
| `POST` | /capital/capital/generate-lender-packet/{id} | `capital_readiness_post_capital_capital_generate_lender_packet_id` | [stub] Create/invoke /capital/capital/generate-lender-packet/{id} (capital-readiness) |
| `PATCH` | /capital/capital/investor-deliverables/{id} | `capital_readiness_patch_capital_capital_investor_deliverables_id` | [stub] Patch /capital/capital/investor-deliverables/{id} (capital-readiness) |
| `DELETE` | /capital/capital/investor-deliverables/{id} | `capital_readiness_delete_capital_capital_investor_deliverables_id` | [stub] Delete /capital/capital/investor-deliverables/{id} (capital-readiness) |
| `GET` | /capital/capital/investor-packets | `capital_readiness_get_capital_capital_investor_packets` | [stub] List/get /capital/capital/investor-packets (capital-readiness) |
| `POST` | /capital/capital/investor-packets | `capital_readiness_post_capital_capital_investor_packets` | [stub] Create/invoke /capital/capital/investor-packets (capital-readiness) |
| `GET` | /capital/capital/investor-packets/{id} | `capital_readiness_get_capital_capital_investor_packets_id` | [stub] List/get /capital/capital/investor-packets/{id} (capital-readiness) |
| `PATCH` | /capital/capital/investor-packets/{id} | `capital_readiness_patch_capital_capital_investor_packets_id` | [stub] Patch /capital/capital/investor-packets/{id} (capital-readiness) |
| `DELETE` | /capital/capital/investor-packets/{id} | `capital_readiness_delete_capital_capital_investor_packets_id` | [stub] Delete /capital/capital/investor-packets/{id} (capital-readiness) |
| `PATCH` | /capital/capital/lender-deliverables/{id} | `capital_readiness_patch_capital_capital_lender_deliverables_id` | [stub] Patch /capital/capital/lender-deliverables/{id} (capital-readiness) |
| `DELETE` | /capital/capital/lender-deliverables/{id} | `capital_readiness_delete_capital_capital_lender_deliverables_id` | [stub] Delete /capital/capital/lender-deliverables/{id} (capital-readiness) |
| `GET` | /capital/capital/lender-packets | `capital_readiness_get_capital_capital_lender_packets` | [stub] List/get /capital/capital/lender-packets (capital-readiness) |
| `POST` | /capital/capital/lender-packets | `capital_readiness_post_capital_capital_lender_packets` | [stub] Create/invoke /capital/capital/lender-packets (capital-readiness) |
| `GET` | /capital/capital/lender-packets/{id} | `capital_readiness_get_capital_capital_lender_packets_id` | [stub] List/get /capital/capital/lender-packets/{id} (capital-readiness) |
| `PATCH` | /capital/capital/lender-packets/{id} | `capital_readiness_patch_capital_capital_lender_packets_id` | [stub] Patch /capital/capital/lender-packets/{id} (capital-readiness) |
| `DELETE` | /capital/capital/lender-packets/{id} | `capital_readiness_delete_capital_capital_lender_packets_id` | [stub] Delete /capital/capital/lender-packets/{id} (capital-readiness) |
| `GET` | /capital/capital/milestones | `capital_readiness_get_capital_capital_milestones` | [stub] List/get /capital/capital/milestones (capital-readiness) |
| `POST` | /capital/capital/milestones | `capital_readiness_post_capital_capital_milestones` | [stub] Create/invoke /capital/capital/milestones (capital-readiness) |
| `PATCH` | /capital/capital/milestones/{id} | `capital_readiness_patch_capital_capital_milestones_id` | [stub] Patch /capital/capital/milestones/{id} (capital-readiness) |
| `DELETE` | /capital/capital/milestones/{id} | `capital_readiness_delete_capital_capital_milestones_id` | [stub] Delete /capital/capital/milestones/{id} (capital-readiness) |
| `GET` | /capital/capital/use-of-funds | `capital_readiness_get_capital_capital_use_of_funds` | [stub] List/get /capital/capital/use-of-funds (capital-readiness) |
| `POST` | /capital/capital/use-of-funds | `capital_readiness_post_capital_capital_use_of_funds` | [stub] Create/invoke /capital/capital/use-of-funds (capital-readiness) |
| `PATCH` | /capital/capital/use-of-funds/{id} | `capital_readiness_patch_capital_capital_use_of_funds_id` | [stub] Patch /capital/capital/use-of-funds/{id} (capital-readiness) |
| `DELETE` | /capital/capital/use-of-funds/{id} | `capital_readiness_delete_capital_capital_use_of_funds_id` | [stub] Delete /capital/capital/use-of-funds/{id} (capital-readiness) |

<a id="carlota-jo"></a>

## carlota-jo

Auto-generated tag for carlota-jo route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /booking/booking/availability | `carlota_jo_get_booking_booking_availability` | [stub] List/get /booking/booking/availability (carlota-jo) |
| `GET` | /booking/booking/clients | `carlota_jo_get_booking_booking_clients` | [stub] List/get /booking/booking/clients (carlota-jo) |
| `GET` | /booking/booking/inquiries | `carlota_jo_get_booking_booking_inquiries` | [stub] List/get /booking/booking/inquiries (carlota-jo) |
| `POST` | /booking/booking/inquiries | `carlota_jo_post_booking_booking_inquiries` | [stub] Create/invoke /booking/booking/inquiries (carlota-jo) |
| `GET` | /booking/booking/inquiries/{id} | `carlota_jo_get_booking_booking_inquiries_id` | [stub] List/get /booking/booking/inquiries/{id} (carlota-jo) |
| `PATCH` | /booking/booking/inquiries/{id} | `carlota_jo_patch_booking_booking_inquiries_id` | [stub] Patch /booking/booking/inquiries/{id} (carlota-jo) |
| `DELETE` | /booking/booking/inquiries/{id} | `carlota_jo_delete_booking_booking_inquiries_id` | [stub] Delete /booking/booking/inquiries/{id} (carlota-jo) |
| `POST` | /booking/booking/invoices | `carlota_jo_post_booking_booking_invoices` | [stub] Create/invoke /booking/booking/invoices (carlota-jo) |
| `GET` | /booking/booking/invoices/{invoiceId} | `carlota_jo_get_booking_booking_invoices_invoiceId` | [stub] List/get /booking/booking/invoices/{invoiceId} (carlota-jo) |
| `GET` | /booking/booking/reservations | `carlota_jo_get_booking_booking_reservations` | [stub] List/get /booking/booking/reservations (carlota-jo) |
| `POST` | /booking/booking/reservations | `carlota_jo_post_booking_booking_reservations` | [stub] Create/invoke /booking/booking/reservations (carlota-jo) |
| `GET` | /booking/booking/reservations/{id} | `carlota_jo_get_booking_booking_reservations_id` | [stub] List/get /booking/booking/reservations/{id} (carlota-jo) |
| `PATCH` | /booking/booking/reservations/{id} | `carlota_jo_patch_booking_booking_reservations_id` | [stub] Patch /booking/booking/reservations/{id} (carlota-jo) |
| `DELETE` | /booking/booking/reservations/{id} | `carlota_jo_delete_booking_booking_reservations_id` | [stub] Delete /booking/booking/reservations/{id} (carlota-jo) |
| `GET` | /booking/booking/services | `carlota_jo_get_booking_booking_services` | [stub] List/get /booking/booking/services (carlota-jo) |
| `POST` | /booking/booking/services | `carlota_jo_post_booking_booking_services` | [stub] Create/invoke /booking/booking/services (carlota-jo) |
| `PATCH` | /booking/booking/services/{id} | `carlota_jo_patch_booking_booking_services_id` | [stub] Patch /booking/booking/services/{id} (carlota-jo) |
| `DELETE` | /booking/booking/services/{id} | `carlota_jo_delete_booking_booking_services_id` | [stub] Delete /booking/booking/services/{id} (carlota-jo) |
| `GET` | /booking/carlota/admin/clients/{clientId}/advisory-data | `carlota_jo_get_booking_carlota_admin_clients_clientId_advisory_data` | [stub] List/get /booking/carlota/admin/clients/{clientId}/advisory-data (carlota-jo) |
| `PUT` | /booking/carlota/admin/clients/{clientId}/competitors | `carlota_jo_put_booking_carlota_admin_clients_clientId_competitors` | [stub] Update /booking/carlota/admin/clients/{clientId}/competitors (carlota-jo) |
| `PUT` | /booking/carlota/admin/clients/{clientId}/margin-history | `carlota_jo_put_booking_carlota_admin_clients_clientId_margin_history` | [stub] Update /booking/carlota/admin/clients/{clientId}/margin-history (carlota-jo) |
| `PUT` | /booking/carlota/admin/clients/{clientId}/market-trend | `carlota_jo_put_booking_carlota_admin_clients_clientId_market_trend` | [stub] Update /booking/carlota/admin/clients/{clientId}/market-trend (carlota-jo) |
| `PUT` | /booking/carlota/admin/clients/{clientId}/radar-signals | `carlota_jo_put_booking_carlota_admin_clients_clientId_radar_signals` | [stub] Update /booking/carlota/admin/clients/{clientId}/radar-signals (carlota-jo) |
| `PUT` | /booking/carlota/admin/clients/{clientId}/roi-benchmarks | `carlota_jo_put_booking_carlota_admin_clients_clientId_roi_benchmarks` | [stub] Update /booking/carlota/admin/clients/{clientId}/roi-benchmarks (carlota-jo) |
| `PUT` | /booking/carlota/admin/clients/{clientId}/roi-trend | `carlota_jo_put_booking_carlota_admin_clients_clientId_roi_trend` | [stub] Update /booking/carlota/admin/clients/{clientId}/roi-trend (carlota-jo) |
| `GET` | /booking/carlota/clients | `carlota_jo_get_booking_carlota_clients` | [stub] List/get /booking/carlota/clients (carlota-jo) |
| `GET` | /booking/carlota/diagnostics | `carlota_jo_get_booking_carlota_diagnostics` | [stub] List/get /booking/carlota/diagnostics (carlota-jo) |
| `POST` | /booking/carlota/diagnostics | `carlota_jo_post_booking_carlota_diagnostics` | [stub] Create/invoke /booking/carlota/diagnostics (carlota-jo) |
| `GET` | /booking/carlota/engagements | `carlota_jo_get_booking_carlota_engagements` | [stub] List/get /booking/carlota/engagements (carlota-jo) |
| `GET` | /booking/carlota/experts | `carlota_jo_get_booking_carlota_experts` | [stub] List/get /booking/carlota/experts (carlota-jo) |
| `POST` | /booking/carlota/experts | `carlota_jo_post_booking_carlota_experts` | [stub] Create/invoke /booking/carlota/experts (carlota-jo) |
| `PUT` | /booking/carlota/experts/{id} | `carlota_jo_put_booking_carlota_experts_id` | [stub] Update /booking/carlota/experts/{id} (carlota-jo) |
| `DELETE` | /booking/carlota/experts/{id} | `carlota_jo_delete_booking_carlota_experts_id` | [stub] Delete /booking/carlota/experts/{id} (carlota-jo) |
| `GET` | /booking/carlota/knowledge | `carlota_jo_get_booking_carlota_knowledge` | [stub] List/get /booking/carlota/knowledge (carlota-jo) |
| `POST` | /booking/carlota/knowledge | `carlota_jo_post_booking_carlota_knowledge` | [stub] Create/invoke /booking/carlota/knowledge (carlota-jo) |
| `PUT` | /booking/carlota/knowledge/{id} | `carlota_jo_put_booking_carlota_knowledge_id` | [stub] Update /booking/carlota/knowledge/{id} (carlota-jo) |
| `DELETE` | /booking/carlota/knowledge/{id} | `carlota_jo_delete_booking_carlota_knowledge_id` | [stub] Delete /booking/carlota/knowledge/{id} (carlota-jo) |
| `GET` | /booking/carlota/live/consulting-trends | `carlota_jo_get_booking_carlota_live_consulting_trends` | [stub] List/get /booking/carlota/live/consulting-trends (carlota-jo) |
| `GET` | /booking/carlota/live/economic-outlook | `carlota_jo_get_booking_carlota_live_economic_outlook` | [stub] List/get /booking/carlota/live/economic-outlook (carlota-jo) |
| `GET` | /booking/carlota/live/strategic-news | `carlota_jo_get_booking_carlota_live_strategic_news` | [stub] List/get /booking/carlota/live/strategic-news (carlota-jo) |
| `GET` | /booking/carlota/live/world-bank-indicators | `carlota_jo_get_booking_carlota_live_world_bank_indicators` | [stub] List/get /booking/carlota/live/world-bank-indicators (carlota-jo) |
| `GET` | /booking/carlota/my-scope | `carlota_jo_get_booking_carlota_my_scope` | [stub] List/get /booking/carlota/my-scope (carlota-jo) |
| `GET` | /booking/carlota/proposals | `carlota_jo_get_booking_carlota_proposals` | [stub] List/get /booking/carlota/proposals (carlota-jo) |
| `POST` | /booking/carlota/proposals | `carlota_jo_post_booking_carlota_proposals` | [stub] Create/invoke /booking/carlota/proposals (carlota-jo) |
| `PUT` | /booking/carlota/proposals/{id} | `carlota_jo_put_booking_carlota_proposals_id` | [stub] Update /booking/carlota/proposals/{id} (carlota-jo) |
| `DELETE` | /booking/carlota/proposals/{id} | `carlota_jo_delete_booking_carlota_proposals_id` | [stub] Delete /booking/carlota/proposals/{id} (carlota-jo) |
| `GET` | /booking/carlota/radar-competitors | `carlota_jo_get_booking_carlota_radar_competitors` | [stub] List/get /booking/carlota/radar-competitors (carlota-jo) |
| `PUT` | /booking/carlota/radar-competitors | `carlota_jo_put_booking_carlota_radar_competitors` | [stub] Update /booking/carlota/radar-competitors (carlota-jo) |
| `GET` | /booking/carlota/radar-signals | `carlota_jo_get_booking_carlota_radar_signals` | [stub] List/get /booking/carlota/radar-signals (carlota-jo) |
| `GET` | /booking/carlota/radar/notification-preferences | `carlota_jo_get_booking_carlota_radar_notification_preferences` | [stub] List/get /booking/carlota/radar/notification-preferences (carlota-jo) |
| `PUT` | /booking/carlota/radar/notification-preferences | `carlota_jo_put_booking_carlota_radar_notification_preferences` | [stub] Update /booking/carlota/radar/notification-preferences (carlota-jo) |
| `POST` | /booking/carlota/radar/notification-preferences/flush-digest | `carlota_jo_post_booking_carlota_radar_notification_preferences_flush_digest` | [stub] Create/invoke /booking/carlota/radar/notification-preferences/flush-digest (carlota-jo) |
| `GET` | /booking/carlota/roi-metrics | `carlota_jo_get_booking_carlota_roi_metrics` | [stub] List/get /booking/carlota/roi-metrics (carlota-jo) |
| `GET` | /booking/carlota/scenarios | `carlota_jo_get_booking_carlota_scenarios` | [stub] List/get /booking/carlota/scenarios (carlota-jo) |
| `POST` | /booking/carlota/scenarios | `carlota_jo_post_booking_carlota_scenarios` | [stub] Create/invoke /booking/carlota/scenarios (carlota-jo) |
| `GET` | /booking/portal/documents | `carlota_jo_get_booking_portal_documents` | [stub] List/get /booking/portal/documents (carlota-jo) |
| `POST` | /booking/portal/documents | `carlota_jo_post_booking_portal_documents` | [stub] Create/invoke /booking/portal/documents (carlota-jo) |
| `GET` | /booking/portal/messages | `carlota_jo_get_booking_portal_messages` | [stub] List/get /booking/portal/messages (carlota-jo) |
| `POST` | /booking/portal/messages | `carlota_jo_post_booking_portal_messages` | [stub] Create/invoke /booking/portal/messages (carlota-jo) |
| `GET` | /booking/portal/my-account | `carlota_jo_get_booking_portal_my_account` | [stub] List/get /booking/portal/my-account (carlota-jo) |
| `GET` | /booking/portal/updates | `carlota_jo_get_booking_portal_updates` | [stub] List/get /booking/portal/updates (carlota-jo) |
| `GET` | /carlota/booking/availability | `carlota_jo_get_carlota_booking_availability` | [stub] List/get /carlota/booking/availability (carlota-jo) |
| `GET` | /carlota/booking/clients | `carlota_jo_get_carlota_booking_clients` | [stub] List/get /carlota/booking/clients (carlota-jo) |
| `GET` | /carlota/booking/inquiries | `carlota_jo_get_carlota_booking_inquiries` | [stub] List/get /carlota/booking/inquiries (carlota-jo) |
| `POST` | /carlota/booking/inquiries | `carlota_jo_post_carlota_booking_inquiries` | [stub] Create/invoke /carlota/booking/inquiries (carlota-jo) |
| `GET` | /carlota/booking/inquiries/{id} | `carlota_jo_get_carlota_booking_inquiries_id` | [stub] List/get /carlota/booking/inquiries/{id} (carlota-jo) |
| `PATCH` | /carlota/booking/inquiries/{id} | `carlota_jo_patch_carlota_booking_inquiries_id` | [stub] Patch /carlota/booking/inquiries/{id} (carlota-jo) |
| `DELETE` | /carlota/booking/inquiries/{id} | `carlota_jo_delete_carlota_booking_inquiries_id` | [stub] Delete /carlota/booking/inquiries/{id} (carlota-jo) |
| `POST` | /carlota/booking/invoices | `carlota_jo_post_carlota_booking_invoices` | [stub] Create/invoke /carlota/booking/invoices (carlota-jo) |
| `GET` | /carlota/booking/invoices/{invoiceId} | `carlota_jo_get_carlota_booking_invoices_invoiceId` | [stub] List/get /carlota/booking/invoices/{invoiceId} (carlota-jo) |
| `GET` | /carlota/booking/reservations | `carlota_jo_get_carlota_booking_reservations` | [stub] List/get /carlota/booking/reservations (carlota-jo) |
| `POST` | /carlota/booking/reservations | `carlota_jo_post_carlota_booking_reservations` | [stub] Create/invoke /carlota/booking/reservations (carlota-jo) |
| `GET` | /carlota/booking/reservations/{id} | `carlota_jo_get_carlota_booking_reservations_id` | [stub] List/get /carlota/booking/reservations/{id} (carlota-jo) |
| `PATCH` | /carlota/booking/reservations/{id} | `carlota_jo_patch_carlota_booking_reservations_id` | [stub] Patch /carlota/booking/reservations/{id} (carlota-jo) |
| `DELETE` | /carlota/booking/reservations/{id} | `carlota_jo_delete_carlota_booking_reservations_id` | [stub] Delete /carlota/booking/reservations/{id} (carlota-jo) |
| `GET` | /carlota/booking/services | `carlota_jo_get_carlota_booking_services` | [stub] List/get /carlota/booking/services (carlota-jo) |
| `POST` | /carlota/booking/services | `carlota_jo_post_carlota_booking_services` | [stub] Create/invoke /carlota/booking/services (carlota-jo) |
| `PATCH` | /carlota/booking/services/{id} | `carlota_jo_patch_carlota_booking_services_id` | [stub] Patch /carlota/booking/services/{id} (carlota-jo) |
| `DELETE` | /carlota/booking/services/{id} | `carlota_jo_delete_carlota_booking_services_id` | [stub] Delete /carlota/booking/services/{id} (carlota-jo) |
| `GET` | /carlota/carlota/admin/clients/{clientId}/advisory-data | `carlota_jo_get_carlota_carlota_admin_clients_clientId_advisory_data` | [stub] List/get /carlota/carlota/admin/clients/{clientId}/advisory-data (carlota-jo) |
| `PUT` | /carlota/carlota/admin/clients/{clientId}/competitors | `carlota_jo_put_carlota_carlota_admin_clients_clientId_competitors` | [stub] Update /carlota/carlota/admin/clients/{clientId}/competitors (carlota-jo) |
| `PUT` | /carlota/carlota/admin/clients/{clientId}/margin-history | `carlota_jo_put_carlota_carlota_admin_clients_clientId_margin_history` | [stub] Update /carlota/carlota/admin/clients/{clientId}/margin-history (carlota-jo) |
| `PUT` | /carlota/carlota/admin/clients/{clientId}/market-trend | `carlota_jo_put_carlota_carlota_admin_clients_clientId_market_trend` | [stub] Update /carlota/carlota/admin/clients/{clientId}/market-trend (carlota-jo) |
| `PUT` | /carlota/carlota/admin/clients/{clientId}/radar-signals | `carlota_jo_put_carlota_carlota_admin_clients_clientId_radar_signals` | [stub] Update /carlota/carlota/admin/clients/{clientId}/radar-signals (carlota-jo) |
| `PUT` | /carlota/carlota/admin/clients/{clientId}/roi-benchmarks | `carlota_jo_put_carlota_carlota_admin_clients_clientId_roi_benchmarks` | [stub] Update /carlota/carlota/admin/clients/{clientId}/roi-benchmarks (carlota-jo) |
| `PUT` | /carlota/carlota/admin/clients/{clientId}/roi-trend | `carlota_jo_put_carlota_carlota_admin_clients_clientId_roi_trend` | [stub] Update /carlota/carlota/admin/clients/{clientId}/roi-trend (carlota-jo) |
| `GET` | /carlota/carlota/clients | `carlota_jo_get_carlota_carlota_clients` | [stub] List/get /carlota/carlota/clients (carlota-jo) |
| `GET` | /carlota/carlota/diagnostics | `carlota_jo_get_carlota_carlota_diagnostics` | [stub] List/get /carlota/carlota/diagnostics (carlota-jo) |
| `POST` | /carlota/carlota/diagnostics | `carlota_jo_post_carlota_carlota_diagnostics` | [stub] Create/invoke /carlota/carlota/diagnostics (carlota-jo) |
| `GET` | /carlota/carlota/engagements | `carlota_jo_get_carlota_carlota_engagements` | [stub] List/get /carlota/carlota/engagements (carlota-jo) |
| `GET` | /carlota/carlota/experts | `carlota_jo_get_carlota_carlota_experts` | [stub] List/get /carlota/carlota/experts (carlota-jo) |
| `POST` | /carlota/carlota/experts | `carlota_jo_post_carlota_carlota_experts` | [stub] Create/invoke /carlota/carlota/experts (carlota-jo) |
| `PUT` | /carlota/carlota/experts/{id} | `carlota_jo_put_carlota_carlota_experts_id` | [stub] Update /carlota/carlota/experts/{id} (carlota-jo) |
| `DELETE` | /carlota/carlota/experts/{id} | `carlota_jo_delete_carlota_carlota_experts_id` | [stub] Delete /carlota/carlota/experts/{id} (carlota-jo) |
| `GET` | /carlota/carlota/knowledge | `carlota_jo_get_carlota_carlota_knowledge` | [stub] List/get /carlota/carlota/knowledge (carlota-jo) |
| `POST` | /carlota/carlota/knowledge | `carlota_jo_post_carlota_carlota_knowledge` | [stub] Create/invoke /carlota/carlota/knowledge (carlota-jo) |
| `PUT` | /carlota/carlota/knowledge/{id} | `carlota_jo_put_carlota_carlota_knowledge_id` | [stub] Update /carlota/carlota/knowledge/{id} (carlota-jo) |
| `DELETE` | /carlota/carlota/knowledge/{id} | `carlota_jo_delete_carlota_carlota_knowledge_id` | [stub] Delete /carlota/carlota/knowledge/{id} (carlota-jo) |
| `GET` | /carlota/carlota/live/consulting-trends | `carlota_jo_get_carlota_carlota_live_consulting_trends` | [stub] List/get /carlota/carlota/live/consulting-trends (carlota-jo) |
| `GET` | /carlota/carlota/live/economic-outlook | `carlota_jo_get_carlota_carlota_live_economic_outlook` | [stub] List/get /carlota/carlota/live/economic-outlook (carlota-jo) |
| `GET` | /carlota/carlota/live/strategic-news | `carlota_jo_get_carlota_carlota_live_strategic_news` | [stub] List/get /carlota/carlota/live/strategic-news (carlota-jo) |
| `GET` | /carlota/carlota/live/world-bank-indicators | `carlota_jo_get_carlota_carlota_live_world_bank_indicators` | [stub] List/get /carlota/carlota/live/world-bank-indicators (carlota-jo) |
| `GET` | /carlota/carlota/my-scope | `carlota_jo_get_carlota_carlota_my_scope` | [stub] List/get /carlota/carlota/my-scope (carlota-jo) |
| `GET` | /carlota/carlota/proposals | `carlota_jo_get_carlota_carlota_proposals` | [stub] List/get /carlota/carlota/proposals (carlota-jo) |
| `POST` | /carlota/carlota/proposals | `carlota_jo_post_carlota_carlota_proposals` | [stub] Create/invoke /carlota/carlota/proposals (carlota-jo) |
| `PUT` | /carlota/carlota/proposals/{id} | `carlota_jo_put_carlota_carlota_proposals_id` | [stub] Update /carlota/carlota/proposals/{id} (carlota-jo) |
| `DELETE` | /carlota/carlota/proposals/{id} | `carlota_jo_delete_carlota_carlota_proposals_id` | [stub] Delete /carlota/carlota/proposals/{id} (carlota-jo) |
| `GET` | /carlota/carlota/radar-competitors | `carlota_jo_get_carlota_carlota_radar_competitors` | [stub] List/get /carlota/carlota/radar-competitors (carlota-jo) |
| `PUT` | /carlota/carlota/radar-competitors | `carlota_jo_put_carlota_carlota_radar_competitors` | [stub] Update /carlota/carlota/radar-competitors (carlota-jo) |
| `GET` | /carlota/carlota/radar-signals | `carlota_jo_get_carlota_carlota_radar_signals` | [stub] List/get /carlota/carlota/radar-signals (carlota-jo) |
| `GET` | /carlota/carlota/radar/notification-preferences | `carlota_jo_get_carlota_carlota_radar_notification_preferences` | [stub] List/get /carlota/carlota/radar/notification-preferences (carlota-jo) |
| `PUT` | /carlota/carlota/radar/notification-preferences | `carlota_jo_put_carlota_carlota_radar_notification_preferences` | [stub] Update /carlota/carlota/radar/notification-preferences (carlota-jo) |
| `POST` | /carlota/carlota/radar/notification-preferences/flush-digest | `carlota_jo_post_carlota_carlota_radar_notification_preferences_flush_digest` | [stub] Create/invoke /carlota/carlota/radar/notification-preferences/flush-digest (carlota-jo) |
| `GET` | /carlota/carlota/roi-metrics | `carlota_jo_get_carlota_carlota_roi_metrics` | [stub] List/get /carlota/carlota/roi-metrics (carlota-jo) |
| `GET` | /carlota/carlota/scenarios | `carlota_jo_get_carlota_carlota_scenarios` | [stub] List/get /carlota/carlota/scenarios (carlota-jo) |
| `POST` | /carlota/carlota/scenarios | `carlota_jo_post_carlota_carlota_scenarios` | [stub] Create/invoke /carlota/carlota/scenarios (carlota-jo) |
| `GET` | /carlota/portal/documents | `carlota_jo_get_carlota_portal_documents` | [stub] List/get /carlota/portal/documents (carlota-jo) |
| `POST` | /carlota/portal/documents | `carlota_jo_post_carlota_portal_documents` | [stub] Create/invoke /carlota/portal/documents (carlota-jo) |
| `GET` | /carlota/portal/messages | `carlota_jo_get_carlota_portal_messages` | [stub] List/get /carlota/portal/messages (carlota-jo) |
| `POST` | /carlota/portal/messages | `carlota_jo_post_carlota_portal_messages` | [stub] Create/invoke /carlota/portal/messages (carlota-jo) |
| `GET` | /carlota/portal/my-account | `carlota_jo_get_carlota_portal_my_account` | [stub] List/get /carlota/portal/my-account (carlota-jo) |
| `GET` | /carlota/portal/updates | `carlota_jo_get_carlota_portal_updates` | [stub] List/get /carlota/portal/updates (carlota-jo) |
| `GET` | /portal/booking/availability | `carlota_jo_get_portal_booking_availability` | [stub] List/get /portal/booking/availability (carlota-jo) |
| `GET` | /portal/booking/clients | `carlota_jo_get_portal_booking_clients` | [stub] List/get /portal/booking/clients (carlota-jo) |
| `GET` | /portal/booking/inquiries | `carlota_jo_get_portal_booking_inquiries` | [stub] List/get /portal/booking/inquiries (carlota-jo) |
| `POST` | /portal/booking/inquiries | `carlota_jo_post_portal_booking_inquiries` | [stub] Create/invoke /portal/booking/inquiries (carlota-jo) |
| `GET` | /portal/booking/inquiries/{id} | `carlota_jo_get_portal_booking_inquiries_id` | [stub] List/get /portal/booking/inquiries/{id} (carlota-jo) |
| `PATCH` | /portal/booking/inquiries/{id} | `carlota_jo_patch_portal_booking_inquiries_id` | [stub] Patch /portal/booking/inquiries/{id} (carlota-jo) |
| `DELETE` | /portal/booking/inquiries/{id} | `carlota_jo_delete_portal_booking_inquiries_id` | [stub] Delete /portal/booking/inquiries/{id} (carlota-jo) |
| `POST` | /portal/booking/invoices | `carlota_jo_post_portal_booking_invoices` | [stub] Create/invoke /portal/booking/invoices (carlota-jo) |
| `GET` | /portal/booking/invoices/{invoiceId} | `carlota_jo_get_portal_booking_invoices_invoiceId` | [stub] List/get /portal/booking/invoices/{invoiceId} (carlota-jo) |
| `GET` | /portal/booking/reservations | `carlota_jo_get_portal_booking_reservations` | [stub] List/get /portal/booking/reservations (carlota-jo) |
| `POST` | /portal/booking/reservations | `carlota_jo_post_portal_booking_reservations` | [stub] Create/invoke /portal/booking/reservations (carlota-jo) |
| `GET` | /portal/booking/reservations/{id} | `carlota_jo_get_portal_booking_reservations_id` | [stub] List/get /portal/booking/reservations/{id} (carlota-jo) |
| `PATCH` | /portal/booking/reservations/{id} | `carlota_jo_patch_portal_booking_reservations_id` | [stub] Patch /portal/booking/reservations/{id} (carlota-jo) |
| `DELETE` | /portal/booking/reservations/{id} | `carlota_jo_delete_portal_booking_reservations_id` | [stub] Delete /portal/booking/reservations/{id} (carlota-jo) |
| `GET` | /portal/booking/services | `carlota_jo_get_portal_booking_services` | [stub] List/get /portal/booking/services (carlota-jo) |
| `POST` | /portal/booking/services | `carlota_jo_post_portal_booking_services` | [stub] Create/invoke /portal/booking/services (carlota-jo) |
| `PATCH` | /portal/booking/services/{id} | `carlota_jo_patch_portal_booking_services_id` | [stub] Patch /portal/booking/services/{id} (carlota-jo) |
| `DELETE` | /portal/booking/services/{id} | `carlota_jo_delete_portal_booking_services_id` | [stub] Delete /portal/booking/services/{id} (carlota-jo) |
| `GET` | /portal/carlota/admin/clients/{clientId}/advisory-data | `carlota_jo_get_portal_carlota_admin_clients_clientId_advisory_data` | [stub] List/get /portal/carlota/admin/clients/{clientId}/advisory-data (carlota-jo) |
| `PUT` | /portal/carlota/admin/clients/{clientId}/competitors | `carlota_jo_put_portal_carlota_admin_clients_clientId_competitors` | [stub] Update /portal/carlota/admin/clients/{clientId}/competitors (carlota-jo) |
| `PUT` | /portal/carlota/admin/clients/{clientId}/margin-history | `carlota_jo_put_portal_carlota_admin_clients_clientId_margin_history` | [stub] Update /portal/carlota/admin/clients/{clientId}/margin-history (carlota-jo) |
| `PUT` | /portal/carlota/admin/clients/{clientId}/market-trend | `carlota_jo_put_portal_carlota_admin_clients_clientId_market_trend` | [stub] Update /portal/carlota/admin/clients/{clientId}/market-trend (carlota-jo) |
| `PUT` | /portal/carlota/admin/clients/{clientId}/radar-signals | `carlota_jo_put_portal_carlota_admin_clients_clientId_radar_signals` | [stub] Update /portal/carlota/admin/clients/{clientId}/radar-signals (carlota-jo) |
| `PUT` | /portal/carlota/admin/clients/{clientId}/roi-benchmarks | `carlota_jo_put_portal_carlota_admin_clients_clientId_roi_benchmarks` | [stub] Update /portal/carlota/admin/clients/{clientId}/roi-benchmarks (carlota-jo) |
| `PUT` | /portal/carlota/admin/clients/{clientId}/roi-trend | `carlota_jo_put_portal_carlota_admin_clients_clientId_roi_trend` | [stub] Update /portal/carlota/admin/clients/{clientId}/roi-trend (carlota-jo) |
| `GET` | /portal/carlota/clients | `carlota_jo_get_portal_carlota_clients` | [stub] List/get /portal/carlota/clients (carlota-jo) |
| `GET` | /portal/carlota/diagnostics | `carlota_jo_get_portal_carlota_diagnostics` | [stub] List/get /portal/carlota/diagnostics (carlota-jo) |
| `POST` | /portal/carlota/diagnostics | `carlota_jo_post_portal_carlota_diagnostics` | [stub] Create/invoke /portal/carlota/diagnostics (carlota-jo) |
| `GET` | /portal/carlota/engagements | `carlota_jo_get_portal_carlota_engagements` | [stub] List/get /portal/carlota/engagements (carlota-jo) |
| `GET` | /portal/carlota/experts | `carlota_jo_get_portal_carlota_experts` | [stub] List/get /portal/carlota/experts (carlota-jo) |
| `POST` | /portal/carlota/experts | `carlota_jo_post_portal_carlota_experts` | [stub] Create/invoke /portal/carlota/experts (carlota-jo) |
| `PUT` | /portal/carlota/experts/{id} | `carlota_jo_put_portal_carlota_experts_id` | [stub] Update /portal/carlota/experts/{id} (carlota-jo) |
| `DELETE` | /portal/carlota/experts/{id} | `carlota_jo_delete_portal_carlota_experts_id` | [stub] Delete /portal/carlota/experts/{id} (carlota-jo) |
| `GET` | /portal/carlota/knowledge | `carlota_jo_get_portal_carlota_knowledge` | [stub] List/get /portal/carlota/knowledge (carlota-jo) |
| `POST` | /portal/carlota/knowledge | `carlota_jo_post_portal_carlota_knowledge` | [stub] Create/invoke /portal/carlota/knowledge (carlota-jo) |
| `PUT` | /portal/carlota/knowledge/{id} | `carlota_jo_put_portal_carlota_knowledge_id` | [stub] Update /portal/carlota/knowledge/{id} (carlota-jo) |
| `DELETE` | /portal/carlota/knowledge/{id} | `carlota_jo_delete_portal_carlota_knowledge_id` | [stub] Delete /portal/carlota/knowledge/{id} (carlota-jo) |
| `GET` | /portal/carlota/live/consulting-trends | `carlota_jo_get_portal_carlota_live_consulting_trends` | [stub] List/get /portal/carlota/live/consulting-trends (carlota-jo) |
| `GET` | /portal/carlota/live/economic-outlook | `carlota_jo_get_portal_carlota_live_economic_outlook` | [stub] List/get /portal/carlota/live/economic-outlook (carlota-jo) |
| `GET` | /portal/carlota/live/strategic-news | `carlota_jo_get_portal_carlota_live_strategic_news` | [stub] List/get /portal/carlota/live/strategic-news (carlota-jo) |
| `GET` | /portal/carlota/live/world-bank-indicators | `carlota_jo_get_portal_carlota_live_world_bank_indicators` | [stub] List/get /portal/carlota/live/world-bank-indicators (carlota-jo) |
| `GET` | /portal/carlota/my-scope | `carlota_jo_get_portal_carlota_my_scope` | [stub] List/get /portal/carlota/my-scope (carlota-jo) |
| `GET` | /portal/carlota/proposals | `carlota_jo_get_portal_carlota_proposals` | [stub] List/get /portal/carlota/proposals (carlota-jo) |
| `POST` | /portal/carlota/proposals | `carlota_jo_post_portal_carlota_proposals` | [stub] Create/invoke /portal/carlota/proposals (carlota-jo) |
| `PUT` | /portal/carlota/proposals/{id} | `carlota_jo_put_portal_carlota_proposals_id` | [stub] Update /portal/carlota/proposals/{id} (carlota-jo) |
| `DELETE` | /portal/carlota/proposals/{id} | `carlota_jo_delete_portal_carlota_proposals_id` | [stub] Delete /portal/carlota/proposals/{id} (carlota-jo) |
| `GET` | /portal/carlota/radar-competitors | `carlota_jo_get_portal_carlota_radar_competitors` | [stub] List/get /portal/carlota/radar-competitors (carlota-jo) |
| `PUT` | /portal/carlota/radar-competitors | `carlota_jo_put_portal_carlota_radar_competitors` | [stub] Update /portal/carlota/radar-competitors (carlota-jo) |
| `GET` | /portal/carlota/radar-signals | `carlota_jo_get_portal_carlota_radar_signals` | [stub] List/get /portal/carlota/radar-signals (carlota-jo) |
| `GET` | /portal/carlota/radar/notification-preferences | `carlota_jo_get_portal_carlota_radar_notification_preferences` | [stub] List/get /portal/carlota/radar/notification-preferences (carlota-jo) |
| `PUT` | /portal/carlota/radar/notification-preferences | `carlota_jo_put_portal_carlota_radar_notification_preferences` | [stub] Update /portal/carlota/radar/notification-preferences (carlota-jo) |
| `POST` | /portal/carlota/radar/notification-preferences/flush-digest | `carlota_jo_post_portal_carlota_radar_notification_preferences_flush_digest` | [stub] Create/invoke /portal/carlota/radar/notification-preferences/flush-digest (carlota-jo) |
| `GET` | /portal/carlota/roi-metrics | `carlota_jo_get_portal_carlota_roi_metrics` | [stub] List/get /portal/carlota/roi-metrics (carlota-jo) |
| `GET` | /portal/carlota/scenarios | `carlota_jo_get_portal_carlota_scenarios` | [stub] List/get /portal/carlota/scenarios (carlota-jo) |
| `POST` | /portal/carlota/scenarios | `carlota_jo_post_portal_carlota_scenarios` | [stub] Create/invoke /portal/carlota/scenarios (carlota-jo) |
| `GET` | /portal/portal/documents | `carlota_jo_get_portal_portal_documents` | [stub] List/get /portal/portal/documents (carlota-jo) |
| `POST` | /portal/portal/documents | `carlota_jo_post_portal_portal_documents` | [stub] Create/invoke /portal/portal/documents (carlota-jo) |
| `GET` | /portal/portal/messages | `carlota_jo_get_portal_portal_messages` | [stub] List/get /portal/portal/messages (carlota-jo) |
| `POST` | /portal/portal/messages | `carlota_jo_post_portal_portal_messages` | [stub] Create/invoke /portal/portal/messages (carlota-jo) |
| `GET` | /portal/portal/my-account | `carlota_jo_get_portal_portal_my_account` | [stub] List/get /portal/portal/my-account (carlota-jo) |
| `GET` | /portal/portal/updates | `carlota_jo_get_portal_portal_updates` | [stub] List/get /portal/portal/updates (carlota-jo) |

<a id="carlota-jo-invoice-email"></a>

## carlota-jo-invoice-email

Auto-generated tag for carlota-jo-invoice-email route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `POST` | /booking/booking/invoices/email | `carlota_jo_invoice_email_post_booking_booking_invoices_email` | [stub] Create/invoke /booking/booking/invoices/email (carlota-jo-invoice-email) |
| `GET` | /booking/booking/invoices/email-log/{invoiceId} | `carlota_jo_invoice_email_get_booking_booking_invoices_email_log_invoiceId` | [stub] List/get /booking/booking/invoices/email-log/{invoiceId} (carlota-jo-invoice-email) |

<a id="carlota-time-tracking"></a>

## carlota-time-tracking

Auto-generated tag for carlota-time-tracking route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /booking/booking/time-entries | `carlota_time_tracking_get_booking_booking_time_entries` | [stub] List/get /booking/booking/time-entries (carlota-time-tracking) |
| `POST` | /booking/booking/time-entries | `carlota_time_tracking_post_booking_booking_time_entries` | [stub] Create/invoke /booking/booking/time-entries (carlota-time-tracking) |
| `PATCH` | /booking/booking/time-entries/{id} | `carlota_time_tracking_patch_booking_booking_time_entries_id` | [stub] Patch /booking/booking/time-entries/{id} (carlota-time-tracking) |
| `DELETE` | /booking/booking/time-entries/{id} | `carlota_time_tracking_delete_booking_booking_time_entries_id` | [stub] Delete /booking/booking/time-entries/{id} (carlota-time-tracking) |
| `GET` | /booking/booking/time-invoices | `carlota_time_tracking_get_booking_booking_time_invoices` | [stub] List/get /booking/booking/time-invoices (carlota-time-tracking) |
| `POST` | /booking/booking/time-invoices | `carlota_time_tracking_post_booking_booking_time_invoices` | [stub] Create/invoke /booking/booking/time-invoices (carlota-time-tracking) |
| `PATCH` | /booking/booking/time-invoices/{id} | `carlota_time_tracking_patch_booking_booking_time_invoices_id` | [stub] Patch /booking/booking/time-invoices/{id} (carlota-time-tracking) |
| `DELETE` | /booking/booking/time-invoices/{id} | `carlota_time_tracking_delete_booking_booking_time_invoices_id` | [stub] Delete /booking/booking/time-invoices/{id} (carlota-time-tracking) |
| `POST` | /booking/booking/time-invoices/generate | `carlota_time_tracking_post_booking_booking_time_invoices_generate` | [stub] Create/invoke /booking/booking/time-invoices/generate (carlota-time-tracking) |

<a id="certification-readiness"></a>

## certification-readiness

Auto-generated tag for certification-readiness route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /certification/certification/artifacts | `certification_readiness_get_certification_certification_artifacts` | [stub] List/get /certification/certification/artifacts (certification-readiness) |
| `POST` | /certification/certification/artifacts | `certification_readiness_post_certification_certification_artifacts` | [stub] Create/invoke /certification/certification/artifacts (certification-readiness) |
| `PATCH` | /certification/certification/artifacts/{id} | `certification_readiness_patch_certification_certification_artifacts_id` | [stub] Patch /certification/certification/artifacts/{id} (certification-readiness) |
| `DELETE` | /certification/certification/artifacts/{id} | `certification_readiness_delete_certification_certification_artifacts_id` | [stub] Delete /certification/certification/artifacts/{id} (certification-readiness) |
| `GET` | /certification/certification/calendar | `certification_readiness_get_certification_certification_calendar` | [stub] List/get /certification/certification/calendar (certification-readiness) |
| `POST` | /certification/certification/calendar | `certification_readiness_post_certification_certification_calendar` | [stub] Create/invoke /certification/certification/calendar (certification-readiness) |
| `PATCH` | /certification/certification/calendar/{id} | `certification_readiness_patch_certification_certification_calendar_id` | [stub] Patch /certification/certification/calendar/{id} (certification-readiness) |
| `DELETE` | /certification/certification/calendar/{id} | `certification_readiness_delete_certification_certification_calendar_id` | [stub] Delete /certification/certification/calendar/{id} (certification-readiness) |
| `GET` | /certification/certification/dashboard | `certification_readiness_get_certification_certification_dashboard` | [stub] List/get /certification/certification/dashboard (certification-readiness) |
| `GET` | /certification/certification/legal-reviews | `certification_readiness_get_certification_certification_legal_reviews` | [stub] List/get /certification/certification/legal-reviews (certification-readiness) |
| `POST` | /certification/certification/legal-reviews | `certification_readiness_post_certification_certification_legal_reviews` | [stub] Create/invoke /certification/certification/legal-reviews (certification-readiness) |
| `PATCH` | /certification/certification/legal-reviews/{id} | `certification_readiness_patch_certification_certification_legal_reviews_id` | [stub] Patch /certification/certification/legal-reviews/{id} (certification-readiness) |
| `DELETE` | /certification/certification/legal-reviews/{id} | `certification_readiness_delete_certification_certification_legal_reviews_id` | [stub] Delete /certification/certification/legal-reviews/{id} (certification-readiness) |
| `GET` | /certification/certification/mom-led-readiness | `certification_readiness_get_certification_certification_mom_led_readiness` | [stub] List/get /certification/certification/mom-led-readiness (certification-readiness) |
| `GET` | /certification/certification/naics | `certification_readiness_get_certification_certification_naics` | [stub] List/get /certification/certification/naics (certification-readiness) |
| `POST` | /certification/certification/naics | `certification_readiness_post_certification_certification_naics` | [stub] Create/invoke /certification/certification/naics (certification-readiness) |
| `GET` | /certification/certification/opportunities | `certification_readiness_get_certification_certification_opportunities` | [stub] List/get /certification/certification/opportunities (certification-readiness) |
| `POST` | /certification/certification/opportunities | `certification_readiness_post_certification_certification_opportunities` | [stub] Create/invoke /certification/certification/opportunities (certification-readiness) |
| `PATCH` | /certification/certification/opportunities/{id} | `certification_readiness_patch_certification_certification_opportunities_id` | [stub] Patch /certification/certification/opportunities/{id} (certification-readiness) |
| `DELETE` | /certification/certification/opportunities/{id} | `certification_readiness_delete_certification_certification_opportunities_id` | [stub] Delete /certification/certification/opportunities/{id} (certification-readiness) |
| `GET` | /certification/certification/ownership-scenarios | `certification_readiness_get_certification_certification_ownership_scenarios` | [stub] List/get /certification/certification/ownership-scenarios (certification-readiness) |
| `POST` | /certification/certification/ownership-scenarios | `certification_readiness_post_certification_certification_ownership_scenarios` | [stub] Create/invoke /certification/certification/ownership-scenarios (certification-readiness) |
| `PATCH` | /certification/certification/ownership-scenarios/{id} | `certification_readiness_patch_certification_certification_ownership_scenarios_id` | [stub] Patch /certification/certification/ownership-scenarios/{id} (certification-readiness) |
| `DELETE` | /certification/certification/ownership-scenarios/{id} | `certification_readiness_delete_certification_certification_ownership_scenarios_id` | [stub] Delete /certification/certification/ownership-scenarios/{id} (certification-readiness) |
| `GET` | /certification/certification/procurement-contacts | `certification_readiness_get_certification_certification_procurement_contacts` | [stub] List/get /certification/certification/procurement-contacts (certification-readiness) |
| `POST` | /certification/certification/procurement-contacts | `certification_readiness_post_certification_certification_procurement_contacts` | [stub] Create/invoke /certification/certification/procurement-contacts (certification-readiness) |
| `PATCH` | /certification/certification/procurement-contacts/{id} | `certification_readiness_patch_certification_certification_procurement_contacts_id` | [stub] Patch /certification/certification/procurement-contacts/{id} (certification-readiness) |
| `DELETE` | /certification/certification/procurement-contacts/{id} | `certification_readiness_delete_certification_certification_procurement_contacts_id` | [stub] Delete /certification/certification/procurement-contacts/{id} (certification-readiness) |
| `GET` | /certification/certification/programs | `certification_readiness_get_certification_certification_programs` | [stub] List/get /certification/certification/programs (certification-readiness) |
| `POST` | /certification/certification/programs | `certification_readiness_post_certification_certification_programs` | [stub] Create/invoke /certification/certification/programs (certification-readiness) |
| `GET` | /certification/certification/programs/{id} | `certification_readiness_get_certification_certification_programs_id` | [stub] List/get /certification/certification/programs/{id} (certification-readiness) |
| `PATCH` | /certification/certification/programs/{id} | `certification_readiness_patch_certification_certification_programs_id` | [stub] Patch /certification/certification/programs/{id} (certification-readiness) |
| `DELETE` | /certification/certification/programs/{id} | `certification_readiness_delete_certification_certification_programs_id` | [stub] Delete /certification/certification/programs/{id} (certification-readiness) |
| `POST` | /certification/certification/requirements | `certification_readiness_post_certification_certification_requirements` | [stub] Create/invoke /certification/certification/requirements (certification-readiness) |
| `PATCH` | /certification/certification/requirements/{id} | `certification_readiness_patch_certification_certification_requirements_id` | [stub] Patch /certification/certification/requirements/{id} (certification-readiness) |
| `DELETE` | /certification/certification/requirements/{id} | `certification_readiness_delete_certification_certification_requirements_id` | [stub] Delete /certification/certification/requirements/{id} (certification-readiness) |
| `POST` | /certification/certification/seed | `certification_readiness_post_certification_certification_seed` | [stub] Create/invoke /certification/certification/seed (certification-readiness) |
| `GET` | /certification/certification/status | `certification_readiness_get_certification_certification_status` | [stub] List/get /certification/certification/status (certification-readiness) |
| `POST` | /certification/certification/status | `certification_readiness_post_certification_certification_status` | [stub] Create/invoke /certification/certification/status (certification-readiness) |
| `PATCH` | /certification/certification/status/{id} | `certification_readiness_patch_certification_certification_status_id` | [stub] Patch /certification/certification/status/{id} (certification-readiness) |
| `DELETE` | /certification/certification/status/{id} | `certification_readiness_delete_certification_certification_status_id` | [stub] Delete /certification/certification/status/{id} (certification-readiness) |
| `GET` | /certification/certification/tasks | `certification_readiness_get_certification_certification_tasks` | [stub] List/get /certification/certification/tasks (certification-readiness) |
| `POST` | /certification/certification/tasks | `certification_readiness_post_certification_certification_tasks` | [stub] Create/invoke /certification/certification/tasks (certification-readiness) |
| `PATCH` | /certification/certification/tasks/{id} | `certification_readiness_patch_certification_certification_tasks_id` | [stub] Patch /certification/certification/tasks/{id} (certification-readiness) |
| `DELETE` | /certification/certification/tasks/{id} | `certification_readiness_delete_certification_certification_tasks_id` | [stub] Delete /certification/certification/tasks/{id} (certification-readiness) |

<a id="changes"></a>

## changes

Auto-generated tag for changes route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /changes/changes | `changes_get_changes_changes` | [stub] List/get /changes/changes (changes) |
| `POST` | /changes/changes | `changes_post_changes_changes` | [stub] Create/invoke /changes/changes (changes) |
| `GET` | /changes/changes/replay | `changes_get_changes_changes_replay` | [stub] List/get /changes/changes/replay (changes) |

<a id="cms"></a>

## cms

Auto-generated tag for cms route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /cms/cms/articles | `cms_get_cms_cms_articles` | [stub] List/get /cms/cms/articles (cms) |
| `POST` | /cms/cms/articles | `cms_post_cms_cms_articles` | [stub] Create/invoke /cms/cms/articles (cms) |
| `PATCH` | /cms/cms/articles/{id} | `cms_patch_cms_cms_articles_id` | [stub] Patch /cms/cms/articles/{id} (cms) |
| `DELETE` | /cms/cms/articles/{id} | `cms_delete_cms_cms_articles_id` | [stub] Delete /cms/cms/articles/{id} (cms) |
| `GET` | /cms/cms/articles/{slug} | `cms_get_cms_cms_articles_slug` | [stub] List/get /cms/cms/articles/{slug} (cms) |
| `GET` | /cms/cms/case-studies | `cms_get_cms_cms_case_studies` | [stub] List/get /cms/cms/case-studies (cms) |
| `POST` | /cms/cms/case-studies | `cms_post_cms_cms_case_studies` | [stub] Create/invoke /cms/cms/case-studies (cms) |
| `PATCH` | /cms/cms/case-studies/{id} | `cms_patch_cms_cms_case_studies_id` | [stub] Patch /cms/cms/case-studies/{id} (cms) |
| `DELETE` | /cms/cms/case-studies/{id} | `cms_delete_cms_cms_case_studies_id` | [stub] Delete /cms/cms/case-studies/{id} (cms) |
| `GET` | /cms/cms/case-studies/{slug} | `cms_get_cms_cms_case_studies_slug` | [stub] List/get /cms/cms/case-studies/{slug} (cms) |
| `GET` | /cms/cms/contact-submissions | `cms_get_cms_cms_contact_submissions` | [stub] List/get /cms/cms/contact-submissions (cms) |
| `POST` | /cms/cms/contact-submissions | `cms_post_cms_cms_contact_submissions` | [stub] Create/invoke /cms/cms/contact-submissions (cms) |
| `GET` | /cms/cms/ctas | `cms_get_cms_cms_ctas` | [stub] List/get /cms/cms/ctas (cms) |
| `POST` | /cms/cms/ctas | `cms_post_cms_cms_ctas` | [stub] Create/invoke /cms/cms/ctas (cms) |
| `PATCH` | /cms/cms/ctas/{id} | `cms_patch_cms_cms_ctas_id` | [stub] Patch /cms/cms/ctas/{id} (cms) |
| `DELETE` | /cms/cms/ctas/{id} | `cms_delete_cms_cms_ctas_id` | [stub] Delete /cms/cms/ctas/{id} (cms) |
| `GET` | /cms/cms/downloads | `cms_get_cms_cms_downloads` | [stub] List/get /cms/cms/downloads (cms) |
| `POST` | /cms/cms/downloads | `cms_post_cms_cms_downloads` | [stub] Create/invoke /cms/cms/downloads (cms) |
| `PATCH` | /cms/cms/downloads/{id} | `cms_patch_cms_cms_downloads_id` | [stub] Patch /cms/cms/downloads/{id} (cms) |
| `GET` | /cms/cms/faqs | `cms_get_cms_cms_faqs` | [stub] List/get /cms/cms/faqs (cms) |
| `POST` | /cms/cms/faqs | `cms_post_cms_cms_faqs` | [stub] Create/invoke /cms/cms/faqs (cms) |
| `PATCH` | /cms/cms/faqs/{id} | `cms_patch_cms_cms_faqs_id` | [stub] Patch /cms/cms/faqs/{id} (cms) |
| `DELETE` | /cms/cms/faqs/{id} | `cms_delete_cms_cms_faqs_id` | [stub] Delete /cms/cms/faqs/{id} (cms) |
| `GET` | /cms/cms/features-items | `cms_get_cms_cms_features_items` | [stub] List/get /cms/cms/features-items (cms) |
| `POST` | /cms/cms/features-items | `cms_post_cms_cms_features_items` | [stub] Create/invoke /cms/cms/features-items (cms) |
| `POST` | /cms/cms/lead-status | `cms_post_cms_cms_lead_status` | [stub] Create/invoke /cms/cms/lead-status (cms) |
| `PATCH` | /cms/cms/lead-status/{id} | `cms_patch_cms_cms_lead_status_id` | [stub] Patch /cms/cms/lead-status/{id} (cms) |
| `GET` | /cms/cms/media-assets | `cms_get_cms_cms_media_assets` | [stub] List/get /cms/cms/media-assets (cms) |
| `POST` | /cms/cms/media-assets | `cms_post_cms_cms_media_assets` | [stub] Create/invoke /cms/cms/media-assets (cms) |
| `DELETE` | /cms/cms/media-assets/{id} | `cms_delete_cms_cms_media_assets_id` | [stub] Delete /cms/cms/media-assets/{id} (cms) |
| `GET` | /cms/cms/navigation-items | `cms_get_cms_cms_navigation_items` | [stub] List/get /cms/cms/navigation-items (cms) |
| `POST` | /cms/cms/navigation-items | `cms_post_cms_cms_navigation_items` | [stub] Create/invoke /cms/cms/navigation-items (cms) |
| `PATCH` | /cms/cms/navigation-items/{id} | `cms_patch_cms_cms_navigation_items_id` | [stub] Patch /cms/cms/navigation-items/{id} (cms) |
| `DELETE` | /cms/cms/navigation-items/{id} | `cms_delete_cms_cms_navigation_items_id` | [stub] Delete /cms/cms/navigation-items/{id} (cms) |
| `GET` | /cms/cms/pages | `cms_get_cms_cms_pages` | [stub] List/get /cms/cms/pages (cms) |
| `POST` | /cms/cms/pages | `cms_post_cms_cms_pages` | [stub] Create/invoke /cms/cms/pages (cms) |
| `GET` | /cms/cms/pages/{id} | `cms_get_cms_cms_pages_id` | [stub] List/get /cms/cms/pages/{id} (cms) |
| `PATCH` | /cms/cms/pages/{id} | `cms_patch_cms_cms_pages_id` | [stub] Patch /cms/cms/pages/{id} (cms) |
| `DELETE` | /cms/cms/pages/{id} | `cms_delete_cms_cms_pages_id` | [stub] Delete /cms/cms/pages/{id} (cms) |
| `GET` | /cms/cms/posts | `cms_get_cms_cms_posts` | [stub] List/get /cms/cms/posts (cms) |
| `POST` | /cms/cms/posts | `cms_post_cms_cms_posts` | [stub] Create/invoke /cms/cms/posts (cms) |
| `PUT` | /cms/cms/posts/{id} | `cms_put_cms_cms_posts_id` | [stub] Update /cms/cms/posts/{id} (cms) |
| `PATCH` | /cms/cms/posts/{id} | `cms_patch_cms_cms_posts_id` | [stub] Patch /cms/cms/posts/{id} (cms) |
| `DELETE` | /cms/cms/posts/{id} | `cms_delete_cms_cms_posts_id` | [stub] Delete /cms/cms/posts/{id} (cms) |
| `GET` | /cms/cms/posts/{slug} | `cms_get_cms_cms_posts_slug` | [stub] List/get /cms/cms/posts/{slug} (cms) |
| `POST` | /cms/cms/posts/upload-image | `cms_post_cms_cms_posts_upload_image` | [stub] Create/invoke /cms/cms/posts/upload-image (cms) |
| `GET` | /cms/cms/redirects | `cms_get_cms_cms_redirects` | [stub] List/get /cms/cms/redirects (cms) |
| `POST` | /cms/cms/redirects | `cms_post_cms_cms_redirects` | [stub] Create/invoke /cms/cms/redirects (cms) |
| `DELETE` | /cms/cms/redirects/{id} | `cms_delete_cms_cms_redirects_id` | [stub] Delete /cms/cms/redirects/{id} (cms) |
| `GET` | /cms/cms/roadmap-items | `cms_get_cms_cms_roadmap_items` | [stub] List/get /cms/cms/roadmap-items (cms) |
| `POST` | /cms/cms/roadmap-items | `cms_post_cms_cms_roadmap_items` | [stub] Create/invoke /cms/cms/roadmap-items (cms) |
| `PATCH` | /cms/cms/roadmap-items/{id} | `cms_patch_cms_cms_roadmap_items_id` | [stub] Patch /cms/cms/roadmap-items/{id} (cms) |
| `DELETE` | /cms/cms/roadmap-items/{id} | `cms_delete_cms_cms_roadmap_items_id` | [stub] Delete /cms/cms/roadmap-items/{id} (cms) |
| `GET` | /cms/cms/sections | `cms_get_cms_cms_sections` | [stub] List/get /cms/cms/sections (cms) |
| `POST` | /cms/cms/sections | `cms_post_cms_cms_sections` | [stub] Create/invoke /cms/cms/sections (cms) |
| `PATCH` | /cms/cms/sections/{id} | `cms_patch_cms_cms_sections_id` | [stub] Patch /cms/cms/sections/{id} (cms) |
| `DELETE` | /cms/cms/sections/{id} | `cms_delete_cms_cms_sections_id` | [stub] Delete /cms/cms/sections/{id} (cms) |
| `GET` | /cms/cms/services-items | `cms_get_cms_cms_services_items` | [stub] List/get /cms/cms/services-items (cms) |
| `POST` | /cms/cms/services-items | `cms_post_cms_cms_services_items` | [stub] Create/invoke /cms/cms/services-items (cms) |
| `PATCH` | /cms/cms/services-items/{id} | `cms_patch_cms_cms_services_items_id` | [stub] Patch /cms/cms/services-items/{id} (cms) |
| `DELETE` | /cms/cms/services-items/{id} | `cms_delete_cms_cms_services_items_id` | [stub] Delete /cms/cms/services-items/{id} (cms) |
| `GET` | /cms/cms/site-settings | `cms_get_cms_cms_site_settings` | [stub] List/get /cms/cms/site-settings (cms) |
| `POST` | /cms/cms/site-settings | `cms_post_cms_cms_site_settings` | [stub] Create/invoke /cms/cms/site-settings (cms) |
| `PUT` | /cms/cms/site-settings | `cms_put_cms_cms_site_settings` | [stub] Update /cms/cms/site-settings (cms) |
| `DELETE` | /cms/cms/site-settings/{id} | `cms_delete_cms_cms_site_settings_id` | [stub] Delete /cms/cms/site-settings/{id} (cms) |
| `GET` | /cms/cms/site-settings/{siteId} | `cms_get_cms_cms_site_settings_siteId` | [stub] List/get /cms/cms/site-settings/{siteId} (cms) |
| `GET` | /cms/cms/sites | `cms_get_cms_cms_sites` | [stub] List/get /cms/cms/sites (cms) |
| `PATCH` | /cms/cms/sites/{id} | `cms_patch_cms_cms_sites_id` | [stub] Patch /cms/cms/sites/{id} (cms) |
| `GET` | /cms/cms/sites/{slug} | `cms_get_cms_cms_sites_slug` | [stub] List/get /cms/cms/sites/{slug} (cms) |
| `GET` | /cms/cms/testimonials | `cms_get_cms_cms_testimonials` | [stub] List/get /cms/cms/testimonials (cms) |
| `POST` | /cms/cms/testimonials | `cms_post_cms_cms_testimonials` | [stub] Create/invoke /cms/cms/testimonials (cms) |
| `PATCH` | /cms/cms/testimonials/{id} | `cms_patch_cms_cms_testimonials_id` | [stub] Patch /cms/cms/testimonials/{id} (cms) |
| `DELETE` | /cms/cms/testimonials/{id} | `cms_delete_cms_cms_testimonials_id` | [stub] Delete /cms/cms/testimonials/{id} (cms) |
| `GET` | /cms/cms/updates | `cms_get_cms_cms_updates` | [stub] List/get /cms/cms/updates (cms) |
| `POST` | /cms/cms/updates | `cms_post_cms_cms_updates` | [stub] Create/invoke /cms/cms/updates (cms) |
| `PATCH` | /cms/cms/updates/{id} | `cms_patch_cms_cms_updates_id` | [stub] Patch /cms/cms/updates/{id} (cms) |
| `GET` | /cms/cms/use-cases | `cms_get_cms_cms_use_cases` | [stub] List/get /cms/cms/use-cases (cms) |
| `POST` | /cms/cms/use-cases | `cms_post_cms_cms_use_cases` | [stub] Create/invoke /cms/cms/use-cases (cms) |
| `GET` | /cms/cms/ventures | `cms_get_cms_cms_ventures` | [stub] List/get /cms/cms/ventures (cms) |
| `POST` | /cms/cms/ventures | `cms_post_cms_cms_ventures` | [stub] Create/invoke /cms/cms/ventures (cms) |
| `PATCH` | /cms/cms/ventures/{id} | `cms_patch_cms_cms_ventures_id` | [stub] Patch /cms/cms/ventures/{id} (cms) |
| `DELETE` | /cms/cms/ventures/{id} | `cms_delete_cms_cms_ventures_id` | [stub] Delete /cms/cms/ventures/{id} (cms) |
| `GET` | /cms/cms/ventures/{slug} | `cms_get_cms_cms_ventures_slug` | [stub] List/get /cms/cms/ventures/{slug} (cms) |

<a id="cognitive-runtime"></a>

## cognitive-runtime

Auto-generated tag for cognitive-runtime route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /cognitive-runtime/cognitive-runtime/checkpoint/{ref} | `cognitive_runtime_get_cognitive_runtime_cognitive_runtime_checkpoint_ref` | [stub] List/get /cognitive-runtime/cognitive-runtime/checkpoint/{ref} (cognitive-runtime) |
| `GET` | /cognitive-runtime/cognitive-runtime/checkpoints | `cognitive_runtime_get_cognitive_runtime_cognitive_runtime_checkpoints` | [stub] List/get /cognitive-runtime/cognitive-runtime/checkpoints (cognitive-runtime) |
| `POST` | /cognitive-runtime/cognitive-runtime/resume | `cognitive_runtime_post_cognitive_runtime_cognitive_runtime_resume` | [stub] Create/invoke /cognitive-runtime/cognitive-runtime/resume (cognitive-runtime) |
| `POST` | /cognitive-runtime/cognitive-runtime/run | `cognitive_runtime_post_cognitive_runtime_cognitive_runtime_run` | [stub] Create/invoke /cognitive-runtime/cognitive-runtime/run (cognitive-runtime) |

<a id="command"></a>

## command

Auto-generated tag for command route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `POST` | /integrations/actions/{id}/resolve | `command_post_integrations_actions_id_resolve` | [stub] Create/invoke /integrations/actions/{id}/resolve (command) |
| `GET` | /integrations/alerts | `command_get_integrations_alerts` | [stub] List/get /integrations/alerts (command) |
| `GET` | /integrations/alerts/{alertId}/audit | `command_get_integrations_alerts_alertId_audit` | [stub] List/get /integrations/alerts/{alertId}/audit (command) |
| `POST` | /integrations/alerts/{alertId}/state | `command_post_integrations_alerts_alertId_state` | [stub] Create/invoke /integrations/alerts/{alertId}/state (command) |
| `GET` | /integrations/alerts/count | `command_get_integrations_alerts_count` | [stub] List/get /integrations/alerts/count (command) |
| `GET` | /integrations/business-state | `command_get_integrations_business_state` | [stub] List/get /integrations/business-state (command) |
| `GET` | /integrations/costs | `command_get_integrations_costs` | [stub] List/get /integrations/costs (command) |
| `GET` | /integrations/costs/over-budget | `command_get_integrations_costs_over_budget` | [stub] List/get /integrations/costs/over-budget (command) |
| `GET` | /integrations/digest | `command_get_integrations_digest` | [stub] List/get /integrations/digest (command) |
| `GET` | /integrations/enterprise-state | `command_get_integrations_enterprise_state` | [stub] List/get /integrations/enterprise-state (command) |
| `GET` | /integrations/governance | `command_get_integrations_governance` | [stub] List/get /integrations/governance (command) |
| `GET` | /integrations/health | `command_get_integrations_health` | [stub] List/get /integrations/health (command) |
| `GET` | /integrations/releases | `command_get_integrations_releases` | [stub] List/get /integrations/releases (command) |
| `GET` | /integrations/search | `command_get_integrations_search` | [stub] List/get /integrations/search (command) |
| `GET` | /integrations/sla | `command_get_integrations_sla` | [stub] List/get /integrations/sla (command) |
| `GET` | /integrations/sla/breaches | `command_get_integrations_sla_breaches` | [stub] List/get /integrations/sla/breaches (command) |
| `GET` | /integrations/snapshot | `command_get_integrations_snapshot` | [stub] List/get /integrations/snapshot (command) |
| `GET` | /integrations/snapshot/stream | `command_get_integrations_snapshot_stream` | [stub] List/get /integrations/snapshot/stream (command) |
| `GET` | /integrations/team | `command_get_integrations_team` | [stub] List/get /integrations/team (command) |

<a id="comments"></a>

## comments

Auto-generated tag for comments route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /comments/comments/{entityType}/{entityId} | `comments_get_comments_comments_entityType_entityId` | [stub] List/get /comments/comments/{entityType}/{entityId} (comments) |
| `POST` | /comments/comments/{entityType}/{entityId} | `comments_post_comments_comments_entityType_entityId` | [stub] Create/invoke /comments/comments/{entityType}/{entityId} (comments) |
| `PATCH` | /comments/comments/{id} | `comments_patch_comments_comments_id` | [stub] Patch /comments/comments/{id} (comments) |
| `DELETE` | /comments/comments/{id} | `comments_delete_comments_comments_id` | [stub] Delete /comments/comments/{id} (comments) |
| `GET` | /comments/comments/activity-feed | `comments_get_comments_comments_activity_feed` | [stub] List/get /comments/comments/activity-feed (comments) |

<a id="competitive-intel"></a>

## competitive-intel

Auto-generated tag for competitive-intel route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /competitive-intel/alerts | `competitive_intel_get_competitive_intel_alerts` | [stub] List/get /competitive-intel/alerts (competitive-intel) |
| `POST` | /competitive-intel/alerts/{id}/dismiss | `competitive_intel_post_competitive_intel_alerts_id_dismiss` | [stub] Create/invoke /competitive-intel/alerts/{id}/dismiss (competitive-intel) |
| `GET` | /competitive-intel/feeds | `competitive_intel_get_competitive_intel_feeds` | [stub] List/get /competitive-intel/feeds (competitive-intel) |
| `POST` | /competitive-intel/feeds | `competitive_intel_post_competitive_intel_feeds` | [stub] Create/invoke /competitive-intel/feeds (competitive-intel) |
| `PATCH` | /competitive-intel/feeds/{id} | `competitive_intel_patch_competitive_intel_feeds_id` | [stub] Patch /competitive-intel/feeds/{id} (competitive-intel) |
| `DELETE` | /competitive-intel/feeds/{id} | `competitive_intel_delete_competitive_intel_feeds_id` | [stub] Delete /competitive-intel/feeds/{id} (competitive-intel) |
| `GET` | /competitive-intel/lanes | `competitive_intel_get_competitive_intel_lanes` | [stub] List/get /competitive-intel/lanes (competitive-intel) |
| `POST` | /competitive-intel/lanes/{laneId}/mute | `competitive_intel_post_competitive_intel_lanes_laneId_mute` | [stub] Create/invoke /competitive-intel/lanes/{laneId}/mute (competitive-intel) |
| `POST` | /competitive-intel/refresh | `competitive_intel_post_competitive_intel_refresh` | [stub] Create/invoke /competitive-intel/refresh (competitive-intel) |
| `GET` | /competitive-intel/status | `competitive_intel_get_competitive_intel_status` | [stub] List/get /competitive-intel/status (competitive-intel) |

<a id="compliance"></a>

## compliance

Auto-generated tag for compliance route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /compliance/compliance/archival | `compliance_get_compliance_compliance_archival` | [stub] List/get /compliance/compliance/archival (compliance) |
| `POST` | /compliance/compliance/archival | `compliance_post_compliance_compliance_archival` | [stub] Create/invoke /compliance/compliance/archival (compliance) |
| `GET` | /compliance/compliance/calendar | `compliance_get_compliance_compliance_calendar` | [stub] List/get /compliance/compliance/calendar (compliance) |
| `POST` | /compliance/compliance/calendar | `compliance_post_compliance_compliance_calendar` | [stub] Create/invoke /compliance/compliance/calendar (compliance) |
| `GET` | /compliance/compliance/intelligence-fusion | `compliance_get_compliance_compliance_intelligence_fusion` | [stub] List/get /compliance/compliance/intelligence-fusion (compliance) |
| `GET` | /compliance/compliance/market-context | `compliance_get_compliance_compliance_market_context` | [stub] List/get /compliance/compliance/market-context (compliance) |
| `GET` | /compliance/compliance/posture | `compliance_get_compliance_compliance_posture` | [stub] List/get /compliance/compliance/posture (compliance) |
| `GET` | /compliance/compliance/suitability | `compliance_get_compliance_compliance_suitability` | [stub] List/get /compliance/compliance/suitability (compliance) |
| `POST` | /compliance/compliance/suitability | `compliance_post_compliance_compliance_suitability` | [stub] Create/invoke /compliance/compliance/suitability (compliance) |
| `PATCH` | /compliance/compliance/suitability/{id}/review | `compliance_patch_compliance_compliance_suitability_id_review` | [stub] Patch /compliance/compliance/suitability/{id}/review (compliance) |
| `GET` | /compliance/compliance/supervision | `compliance_get_compliance_compliance_supervision` | [stub] List/get /compliance/compliance/supervision (compliance) |
| `POST` | /compliance/compliance/supervision | `compliance_post_compliance_compliance_supervision` | [stub] Create/invoke /compliance/compliance/supervision (compliance) |
| `PATCH` | /compliance/compliance/supervision/{itemId}/action | `compliance_patch_compliance_compliance_supervision_itemId_action` | [stub] Patch /compliance/compliance/supervision/{itemId}/action (compliance) |

<a id="config"></a>

## config

Auto-generated tag for config route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /config/config/mapbox-token | `config_get_config_config_mapbox_token` | [stub] List/get /config/config/mapbox-token (config) |
| `POST` | /config/config/verify-admin-pin | `config_post_config_config_verify_admin_pin` | [stub] Create/invoke /config/config/verify-admin-pin (config) |

<a id="connector-hub"></a>

## connector-hub

Auto-generated tag for connector-hub route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /connector-hub/connector-hub/agent-tools | `connector_hub_get_connector_hub_connector_hub_agent_tools` | [stub] List/get /connector-hub/connector-hub/agent-tools (connector-hub) |
| `GET` | /connector-hub/connector-hub/capabilities | `connector_hub_get_connector_hub_connector_hub_capabilities` | [stub] List/get /connector-hub/connector-hub/capabilities (connector-hub) |
| `PATCH` | /connector-hub/connector-hub/connectors/{connectorId}/toggle | `connector_hub_patch_connector_hub_connector_hub_connectors_connectorId_toggle` | [stub] Patch /connector-hub/connector-hub/connectors/{connectorId}/toggle (connector-hub) |
| `POST` | /connector-hub/connector-hub/execute | `connector_hub_post_connector_hub_connector_hub_execute` | [stub] Create/invoke /connector-hub/connector-hub/execute (connector-hub) |
| `GET` | /connector-hub/connector-hub/health | `connector_hub_get_connector_hub_connector_hub_health` | [stub] List/get /connector-hub/connector-hub/health (connector-hub) |
| `GET` | /connector-hub/connector-hub/health/{connectorId} | `connector_hub_get_connector_hub_connector_hub_health_connectorId` | [stub] List/get /connector-hub/connector-hub/health/{connectorId} (connector-hub) |
| `GET` | /connector-hub/connector-hub/registry | `connector_hub_get_connector_hub_connector_hub_registry` | [stub] List/get /connector-hub/connector-hub/registry (connector-hub) |
| `GET` | /connector-hub/connector-hub/registry/{connectorId} | `connector_hub_get_connector_hub_connector_hub_registry_connectorId` | [stub] List/get /connector-hub/connector-hub/registry/{connectorId} (connector-hub) |

<a id="consciousness"></a>

## consciousness

Auto-generated tag for consciousness route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /nuro-mesh/nuro-mesh/consciousness/dream | `consciousness_get_nuro_mesh_nuro_mesh_consciousness_dream` | [stub] List/get /nuro-mesh/nuro-mesh/consciousness/dream (consciousness) |
| `GET` | /nuro-mesh/nuro-mesh/consciousness/emotions | `consciousness_get_nuro_mesh_nuro_mesh_consciousness_emotions` | [stub] List/get /nuro-mesh/nuro-mesh/consciousness/emotions (consciousness) |
| `GET` | /nuro-mesh/nuro-mesh/consciousness/goals | `consciousness_get_nuro_mesh_nuro_mesh_consciousness_goals` | [stub] List/get /nuro-mesh/nuro-mesh/consciousness/goals (consciousness) |
| `GET` | /nuro-mesh/nuro-mesh/consciousness/history/emotions | `consciousness_get_nuro_mesh_nuro_mesh_consciousness_history_emotions` | [stub] List/get /nuro-mesh/nuro-mesh/consciousness/history/emotions (consciousness) |
| `GET` | /nuro-mesh/nuro-mesh/consciousness/history/goals | `consciousness_get_nuro_mesh_nuro_mesh_consciousness_history_goals` | [stub] List/get /nuro-mesh/nuro-mesh/consciousness/history/goals (consciousness) |
| `GET` | /nuro-mesh/nuro-mesh/consciousness/history/monologue | `consciousness_get_nuro_mesh_nuro_mesh_consciousness_history_monologue` | [stub] List/get /nuro-mesh/nuro-mesh/consciousness/history/monologue (consciousness) |
| `GET` | /nuro-mesh/nuro-mesh/consciousness/history/profiles | `consciousness_get_nuro_mesh_nuro_mesh_consciousness_history_profiles` | [stub] List/get /nuro-mesh/nuro-mesh/consciousness/history/profiles (consciousness) |
| `GET` | /nuro-mesh/nuro-mesh/consciousness/history/snapshots | `consciousness_get_nuro_mesh_nuro_mesh_consciousness_history_snapshots` | [stub] List/get /nuro-mesh/nuro-mesh/consciousness/history/snapshots (consciousness) |
| `GET` | /nuro-mesh/nuro-mesh/consciousness/history/temporal | `consciousness_get_nuro_mesh_nuro_mesh_consciousness_history_temporal` | [stub] List/get /nuro-mesh/nuro-mesh/consciousness/history/temporal (consciousness) |
| `GET` | /nuro-mesh/nuro-mesh/consciousness/metacognition | `consciousness_get_nuro_mesh_nuro_mesh_consciousness_metacognition` | [stub] List/get /nuro-mesh/nuro-mesh/consciousness/metacognition (consciousness) |
| `GET` | /nuro-mesh/nuro-mesh/consciousness/monologue | `consciousness_get_nuro_mesh_nuro_mesh_consciousness_monologue` | [stub] List/get /nuro-mesh/nuro-mesh/consciousness/monologue (consciousness) |
| `GET` | /nuro-mesh/nuro-mesh/consciousness/predictive | `consciousness_get_nuro_mesh_nuro_mesh_consciousness_predictive` | [stub] List/get /nuro-mesh/nuro-mesh/consciousness/predictive (consciousness) |
| `GET` | /nuro-mesh/nuro-mesh/consciousness/self-model | `consciousness_get_nuro_mesh_nuro_mesh_consciousness_self_model` | [stub] List/get /nuro-mesh/nuro-mesh/consciousness/self-model (consciousness) |
| `GET` | /nuro-mesh/nuro-mesh/consciousness/snapshot | `consciousness_get_nuro_mesh_nuro_mesh_consciousness_snapshot` | [stub] List/get /nuro-mesh/nuro-mesh/consciousness/snapshot (consciousness) |
| `GET` | /nuro-mesh/nuro-mesh/consciousness/temporal | `consciousness_get_nuro_mesh_nuro_mesh_consciousness_temporal` | [stub] List/get /nuro-mesh/nuro-mesh/consciousness/temporal (consciousness) |
| `GET` | /nuro-mesh/nuro-mesh/consciousness/workspace | `consciousness_get_nuro_mesh_nuro_mesh_consciousness_workspace` | [stub] List/get /nuro-mesh/nuro-mesh/consciousness/workspace (consciousness) |

<a id="constellation-views"></a>

## constellation-views

Auto-generated tag for constellation-views route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /constellation/constellation/views | `constellation_views_get_constellation_constellation_views` | [stub] List/get /constellation/constellation/views (constellation-views) |
| `POST` | /constellation/constellation/views | `constellation_views_post_constellation_constellation_views` | [stub] Create/invoke /constellation/constellation/views (constellation-views) |
| `PATCH` | /constellation/constellation/views/{id} | `constellation_views_patch_constellation_constellation_views_id` | [stub] Patch /constellation/constellation/views/{id} (constellation-views) |
| `DELETE` | /constellation/constellation/views/{id} | `constellation_views_delete_constellation_constellation_views_id` | [stub] Delete /constellation/constellation/views/{id} (constellation-views) |

<a id="contact"></a>

## contact

Auto-generated tag for contact route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /contact/contact/requests | `contact_get_contact_contact_requests` | [stub] List/get /contact/contact/requests (contact) |
| `GET` | /contact/contact/submissions | `contact_get_contact_contact_submissions` | [stub] List/get /contact/contact/submissions (contact) |
| `POST` | /contact/contact/submit | `contact_post_contact_contact_submit` | [stub] Create/invoke /contact/contact/submit (contact) |

<a id="content-crud"></a>

## content-crud

Auto-generated tag for content-crud route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /content-crud/articles | `content_crud_get_content_crud_articles` | [stub] List/get /content-crud/articles (content-crud) |
| `POST` | /content-crud/articles | `content_crud_post_content_crud_articles` | [stub] Create/invoke /content-crud/articles (content-crud) |
| `GET` | /content-crud/articles/{id} | `content_crud_get_content_crud_articles_id` | [stub] List/get /content-crud/articles/{id} (content-crud) |
| `PATCH` | /content-crud/articles/{id} | `content_crud_patch_content_crud_articles_id` | [stub] Patch /content-crud/articles/{id} (content-crud) |
| `DELETE` | /content-crud/articles/{id} | `content_crud_delete_content_crud_articles_id` | [stub] Delete /content-crud/articles/{id} (content-crud) |
| `GET` | /content-crud/articles/{id}/versions | `content_crud_get_content_crud_articles_id_versions` | [stub] List/get /content-crud/articles/{id}/versions (content-crud) |
| `GET` | /content-crud/articles/slug/{slug} | `content_crud_get_content_crud_articles_slug_slug` | [stub] List/get /content-crud/articles/slug/{slug} (content-crud) |
| `GET` | /content-crud/authors | `content_crud_get_content_crud_authors` | [stub] List/get /content-crud/authors (content-crud) |
| `POST` | /content-crud/authors | `content_crud_post_content_crud_authors` | [stub] Create/invoke /content-crud/authors (content-crud) |
| `GET` | /content-crud/automation-runs | `content_crud_get_content_crud_automation_runs` | [stub] List/get /content-crud/automation-runs (content-crud) |
| `POST` | /content-crud/automation-runs | `content_crud_post_content_crud_automation_runs` | [stub] Create/invoke /content-crud/automation-runs (content-crud) |
| `PATCH` | /content-crud/automation-runs/{id} | `content_crud_patch_content_crud_automation_runs_id` | [stub] Patch /content-crud/automation-runs/{id} (content-crud) |
| `POST` | /content-crud/automation-runs/trigger/{jobType} | `content_crud_post_content_crud_automation_runs_trigger_jobType` | [stub] Create/invoke /content-crud/automation-runs/trigger/{jobType} (content-crud) |
| `GET` | /content-crud/calendar | `content_crud_get_content_crud_calendar` | [stub] List/get /content-crud/calendar (content-crud) |
| `POST` | /content-crud/calendar | `content_crud_post_content_crud_calendar` | [stub] Create/invoke /content-crud/calendar (content-crud) |
| `PATCH` | /content-crud/calendar/{id} | `content_crud_patch_content_crud_calendar_id` | [stub] Patch /content-crud/calendar/{id} (content-crud) |
| `GET` | /content-crud/campaigns | `content_crud_get_content_crud_campaigns` | [stub] List/get /content-crud/campaigns (content-crud) |
| `POST` | /content-crud/campaigns | `content_crud_post_content_crud_campaigns` | [stub] Create/invoke /content-crud/campaigns (content-crud) |
| `PATCH` | /content-crud/campaigns/{id} | `content_crud_patch_content_crud_campaigns_id` | [stub] Patch /content-crud/campaigns/{id} (content-crud) |
| `GET` | /content-crud/campaigns/{id}/links | `content_crud_get_content_crud_campaigns_id_links` | [stub] List/get /content-crud/campaigns/{id}/links (content-crud) |
| `POST` | /content-crud/campaigns/{id}/links | `content_crud_post_content_crud_campaigns_id_links` | [stub] Create/invoke /content-crud/campaigns/{id}/links (content-crud) |
| `GET` | /content-crud/carousels | `content_crud_get_content_crud_carousels` | [stub] List/get /content-crud/carousels (content-crud) |
| `POST` | /content-crud/carousels | `content_crud_post_content_crud_carousels` | [stub] Create/invoke /content-crud/carousels (content-crud) |
| `GET` | /content-crud/carousels/{id} | `content_crud_get_content_crud_carousels_id` | [stub] List/get /content-crud/carousels/{id} (content-crud) |
| `PATCH` | /content-crud/carousels/{id} | `content_crud_patch_content_crud_carousels_id` | [stub] Patch /content-crud/carousels/{id} (content-crud) |
| `GET` | /content-crud/cta-blocks | `content_crud_get_content_crud_cta_blocks` | [stub] List/get /content-crud/cta-blocks (content-crud) |
| `POST` | /content-crud/cta-blocks | `content_crud_post_content_crud_cta_blocks` | [stub] Create/invoke /content-crud/cta-blocks (content-crud) |
| `GET` | /content-crud/distribution | `content_crud_get_content_crud_distribution` | [stub] List/get /content-crud/distribution (content-crud) |
| `POST` | /content-crud/distribution | `content_crud_post_content_crud_distribution` | [stub] Create/invoke /content-crud/distribution (content-crud) |
| `PATCH` | /content-crud/distribution/{id} | `content_crud_patch_content_crud_distribution_id` | [stub] Patch /content-crud/distribution/{id} (content-crud) |
| `GET` | /content-crud/integrations | `content_crud_get_content_crud_integrations` | [stub] List/get /content-crud/integrations (content-crud) |
| `PATCH` | /content-crud/integrations/{id} | `content_crud_patch_content_crud_integrations_id` | [stub] Patch /content-crud/integrations/{id} (content-crud) |
| `POST` | /content-crud/integrations/retry/{provider} | `content_crud_post_content_crud_integrations_retry_provider` | [stub] Create/invoke /content-crud/integrations/retry/{provider} (content-crud) |
| `GET` | /content-crud/leads | `content_crud_get_content_crud_leads` | [stub] List/get /content-crud/leads (content-crud) |
| `POST` | /content-crud/leads | `content_crud_post_content_crud_leads` | [stub] Create/invoke /content-crud/leads (content-crud) |
| `PATCH` | /content-crud/leads/{id} | `content_crud_patch_content_crud_leads_id` | [stub] Patch /content-crud/leads/{id} (content-crud) |
| `DELETE` | /content-crud/leads/{id} | `content_crud_delete_content_crud_leads_id` | [stub] Delete /content-crud/leads/{id} (content-crud) |
| `GET` | /content-crud/leads/{id}/notes | `content_crud_get_content_crud_leads_id_notes` | [stub] List/get /content-crud/leads/{id}/notes (content-crud) |
| `POST` | /content-crud/leads/{id}/notes | `content_crud_post_content_crud_leads_id_notes` | [stub] Create/invoke /content-crud/leads/{id}/notes (content-crud) |
| `GET` | /content-crud/linktree | `content_crud_get_content_crud_linktree` | [stub] List/get /content-crud/linktree (content-crud) |
| `POST` | /content-crud/linktree | `content_crud_post_content_crud_linktree` | [stub] Create/invoke /content-crud/linktree (content-crud) |
| `PATCH` | /content-crud/linktree/{id} | `content_crud_patch_content_crud_linktree_id` | [stub] Patch /content-crud/linktree/{id} (content-crud) |
| `DELETE` | /content-crud/linktree/{id} | `content_crud_delete_content_crud_linktree_id` | [stub] Delete /content-crud/linktree/{id} (content-crud) |
| `GET` | /content-crud/linktree/admin | `content_crud_get_content_crud_linktree_admin` | [stub] List/get /content-crud/linktree/admin (content-crud) |
| `GET` | /content-crud/newsletters | `content_crud_get_content_crud_newsletters` | [stub] List/get /content-crud/newsletters (content-crud) |
| `POST` | /content-crud/newsletters | `content_crud_post_content_crud_newsletters` | [stub] Create/invoke /content-crud/newsletters (content-crud) |
| `GET` | /content-crud/newsletters/{id} | `content_crud_get_content_crud_newsletters_id` | [stub] List/get /content-crud/newsletters/{id} (content-crud) |
| `PATCH` | /content-crud/newsletters/{id} | `content_crud_patch_content_crud_newsletters_id` | [stub] Patch /content-crud/newsletters/{id} (content-crud) |
| `DELETE` | /content-crud/newsletters/{id} | `content_crud_delete_content_crud_newsletters_id` | [stub] Delete /content-crud/newsletters/{id} (content-crud) |
| `GET` | /content-crud/pillars | `content_crud_get_content_crud_pillars` | [stub] List/get /content-crud/pillars (content-crud) |
| `POST` | /content-crud/pillars | `content_crud_post_content_crud_pillars` | [stub] Create/invoke /content-crud/pillars (content-crud) |
| `GET` | /content-crud/settings | `content_crud_get_content_crud_settings` | [stub] List/get /content-crud/settings (content-crud) |
| `POST` | /content-crud/settings | `content_crud_post_content_crud_settings` | [stub] Create/invoke /content-crud/settings (content-crud) |
| `PATCH` | /content-crud/settings/{key} | `content_crud_patch_content_crud_settings_key` | [stub] Patch /content-crud/settings/{key} (content-crud) |
| `GET` | /content-crud/x-posts | `content_crud_get_content_crud_x_posts` | [stub] List/get /content-crud/x-posts (content-crud) |
| `POST` | /content-crud/x-posts | `content_crud_post_content_crud_x_posts` | [stub] Create/invoke /content-crud/x-posts (content-crud) |
| `GET` | /content-crud/x-posts/{id} | `content_crud_get_content_crud_x_posts_id` | [stub] List/get /content-crud/x-posts/{id} (content-crud) |
| `PATCH` | /content-crud/x-posts/{id} | `content_crud_patch_content_crud_x_posts_id` | [stub] Patch /content-crud/x-posts/{id} (content-crud) |
| `DELETE` | /content-crud/x-posts/{id} | `content_crud_delete_content_crud_x_posts_id` | [stub] Delete /content-crud/x-posts/{id} (content-crud) |
| `POST` | /content-crud/x-posts/{id}/queue | `content_crud_post_content_crud_x_posts_id_queue` | [stub] Create/invoke /content-crud/x-posts/{id}/queue (content-crud) |

<a id="conversions"></a>

## conversions

Auto-generated tag for conversions route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `POST` | /conversions/terra/convert/distress-to-lead | `conversions_post_conversions_terra_convert_distress_to_lead` | [stub] Create/invoke /conversions/terra/convert/distress-to-lead (conversions) |
| `POST` | /conversions/terra/convert/lead-to-deal | `conversions_post_conversions_terra_convert_lead_to_deal` | [stub] Create/invoke /conversions/terra/convert/lead-to-deal (conversions) |

<a id="core"></a>

## core

Auto-generated tag for core route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /core/core/audit | `core_get_core_core_audit` | [stub] List/get /core/core/audit (core) |
| `GET` | /core/core/health | `core_get_core_core_health` | [stub] List/get /core/core/health (core) |
| `GET` | /core/core/metrics | `core_get_core_core_metrics` | [stub] List/get /core/core/metrics (core) |
| `GET` | /core/core/recommendations | `core_get_core_core_recommendations` | [stub] List/get /core/core/recommendations (core) |
| `POST` | /core/core/recommendations | `core_post_core_core_recommendations` | [stub] Create/invoke /core/core/recommendations (core) |

<a id="correlation-map"></a>

## correlation-map

Auto-generated tag for correlation-map route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /correlation-map/correlation-map | `correlation_map_get_correlation_map_correlation_map` | [stub] List/get /correlation-map/correlation-map (correlation-map) |
| `GET` | /correlation-map/correlation-map/live | `correlation_map_get_correlation_map_correlation_map_live` | [stub] List/get /correlation-map/correlation-map/live (correlation-map) |

<a id="cortex"></a>

## cortex

Auto-generated tag for cortex route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /cortex/cortex/action-drafts | `cortex_get_cortex_cortex_action_drafts` | [stub] List/get /cortex/cortex/action-drafts (cortex) |
| `POST` | /cortex/cortex/action-drafts/{id}/approve | `cortex_post_cortex_cortex_action_drafts_id_approve` | [stub] Create/invoke /cortex/cortex/action-drafts/{id}/approve (cortex) |
| `POST` | /cortex/cortex/action-drafts/{id}/dismiss | `cortex_post_cortex_cortex_action_drafts_id_dismiss` | [stub] Create/invoke /cortex/cortex/action-drafts/{id}/dismiss (cortex) |
| `GET` | /cortex/cortex/action-drafts/export | `cortex_get_cortex_cortex_action_drafts_export` | [stub] List/get /cortex/cortex/action-drafts/export (cortex) |
| `POST` | /cortex/cortex/action-drafts/generate | `cortex_post_cortex_cortex_action_drafts_generate` | [stub] Create/invoke /cortex/cortex/action-drafts/generate (cortex) |
| `DELETE` | /cortex/cortex/action-drafts/prune | `cortex_delete_cortex_cortex_action_drafts_prune` | [stub] Delete /cortex/cortex/action-drafts/prune (cortex) |
| `GET` | /cortex/cortex/briefing/today | `cortex_get_cortex_cortex_briefing_today` | [stub] List/get /cortex/cortex/briefing/today (cortex) |
| `GET` | /cortex/cortex/command-feed | `cortex_get_cortex_cortex_command_feed` | [stub] List/get /cortex/cortex/command-feed (cortex) |
| `GET` | /cortex/cortex/domains | `cortex_get_cortex_cortex_domains` | [stub] List/get /cortex/cortex/domains (cortex) |
| `GET` | /cortex/cortex/entity-graph | `cortex_get_cortex_cortex_entity_graph` | [stub] List/get /cortex/cortex/entity-graph (cortex) |
| `POST` | /cortex/cortex/entity-graph/snapshot | `cortex_post_cortex_cortex_entity_graph_snapshot` | [stub] Create/invoke /cortex/cortex/entity-graph/snapshot (cortex) |
| `GET` | /cortex/cortex/entity-graph/snapshot/{uuid} | `cortex_get_cortex_cortex_entity_graph_snapshot_uuid` | [stub] List/get /cortex/cortex/entity-graph/snapshot/{uuid} (cortex) |
| `DELETE` | /cortex/cortex/entity-graph/snapshot/{uuid} | `cortex_delete_cortex_cortex_entity_graph_snapshot_uuid` | [stub] Delete /cortex/cortex/entity-graph/snapshot/{uuid} (cortex) |
| `GET` | /cortex/cortex/entity-graph/snapshots | `cortex_get_cortex_cortex_entity_graph_snapshots` | [stub] List/get /cortex/cortex/entity-graph/snapshots (cortex) |
| `GET` | /cortex/cortex/intelligence-feed | `cortex_get_cortex_cortex_intelligence_feed` | [stub] List/get /cortex/cortex/intelligence-feed (cortex) |
| `POST` | /cortex/cortex/query | `cortex_post_cortex_cortex_query` | [stub] Create/invoke /cortex/cortex/query (cortex) |
| `GET` | /cortex/cortex/quick-actions | `cortex_get_cortex_cortex_quick_actions` | [stub] List/get /cortex/cortex/quick-actions (cortex) |
| `POST` | /cortex/cortex/quick-actions/{id}/action | `cortex_post_cortex_cortex_quick_actions_id_action` | [stub] Create/invoke /cortex/cortex/quick-actions/{id}/action (cortex) |
| `POST` | /cortex/cortex/whatif | `cortex_post_cortex_cortex_whatif` | [stub] Create/invoke /cortex/cortex/whatif (cortex) |

<a id="counsel"></a>

## counsel

Auto-generated tag for counsel route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /counsel/audit-trail | `counselListAuditTrail` | List audit-trail entries for a matter (or all matters) |
| `POST` | /counsel/audit-trail | `counselAppendAuditEntry` | Append an audit-trail entry to a matter |
| `GET` | /counsel/counsel/audit-trail | `counsel_get_counsel_counsel_audit_trail` | [stub] List/get /counsel/counsel/audit-trail (counsel) |
| `POST` | /counsel/counsel/audit-trail | `counsel_post_counsel_counsel_audit_trail` | [stub] Create/invoke /counsel/counsel/audit-trail (counsel) |
| `GET` | /counsel/counsel/matters | `counsel_get_counsel_counsel_matters` | [stub] List/get /counsel/counsel/matters (counsel) |
| `POST` | /counsel/counsel/matters | `counsel_post_counsel_counsel_matters` | [stub] Create/invoke /counsel/counsel/matters (counsel) |
| `GET` | /counsel/counsel/matters/{id} | `counsel_get_counsel_counsel_matters_id` | [stub] List/get /counsel/counsel/matters/{id} (counsel) |
| `PATCH` | /counsel/counsel/matters/{id} | `counsel_patch_counsel_counsel_matters_id` | [stub] Patch /counsel/counsel/matters/{id} (counsel) |
| `DELETE` | /counsel/counsel/matters/{id} | `counsel_delete_counsel_counsel_matters_id` | [stub] Delete /counsel/counsel/matters/{id} (counsel) |
| `GET` | /counsel/counsel/obligations | `counsel_get_counsel_counsel_obligations` | [stub] List/get /counsel/counsel/obligations (counsel) |
| `PATCH` | /counsel/counsel/obligations/{id} | `counsel_patch_counsel_counsel_obligations_id` | [stub] Patch /counsel/counsel/obligations/{id} (counsel) |
| `GET` | /counsel/counsel/proof-chain | `counsel_get_counsel_counsel_proof_chain` | [stub] List/get /counsel/counsel/proof-chain (counsel) |
| `POST` | /counsel/counsel/proof-chain | `counsel_post_counsel_counsel_proof_chain` | [stub] Create/invoke /counsel/counsel/proof-chain (counsel) |
| `GET` | /counsel/matters | `counselListMatters` | List all matters with full nested obligations, audit trail, and proof chain |
| `POST` | /counsel/matters | `counselCreateMatter` | Create a new matter (requires authentication) |
| `GET` | /counsel/matters/{id} | `counselGetMatter` | Get a single matter with full detail |
| `PATCH` | /counsel/matters/{id} | `counselUpdateMatter` | Update a matter (requires authentication) |
| `DELETE` | /counsel/matters/{id} | `counselDeleteMatter` | Delete a matter and its child records (requires authentication) |
| `PATCH` | /counsel/obligations/{id} | `counselUpdateObligation` | Update an obligation (status, completed date, assignee, due date) |
| `GET` | /counsel/proof-chain | `counselListProofChain` | List proof-chain entries for a matter |
| `POST` | /counsel/proof-chain | `counselAppendProofChainEntry` | Append a proof-chain entry to a matter |

<a id="covenant-policy-api"></a>

## covenant-policy-api

Auto-generated tag for covenant-policy-api route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /covenant/covenant/check | `covenant_policy_api_get_covenant_covenant_check` | [stub] List/get /covenant/covenant/check (covenant-policy-api) |
| `GET` | /covenant/covenant/decisions | `covenant_policy_api_get_covenant_covenant_decisions` | [stub] List/get /covenant/covenant/decisions (covenant-policy-api) |
| `POST` | /covenant/covenant/domain-policy | `covenant_policy_api_post_covenant_covenant_domain_policy` | [stub] Create/invoke /covenant/covenant/domain-policy (covenant-policy-api) |
| `POST` | /covenant/covenant/evaluate | `covenant_policy_api_post_covenant_covenant_evaluate` | [stub] Create/invoke /covenant/covenant/evaluate (covenant-policy-api) |
| `GET` | /covenant/covenant/high-risk-actions | `covenant_policy_api_get_covenant_covenant_high_risk_actions` | [stub] List/get /covenant/covenant/high-risk-actions (covenant-policy-api) |
| `GET` | /covenant/covenant/policies | `covenant_policy_api_get_covenant_covenant_policies` | [stub] List/get /covenant/covenant/policies (covenant-policy-api) |
| `POST` | /covenant/covenant/policies | `covenant_policy_api_post_covenant_covenant_policies` | [stub] Create/invoke /covenant/covenant/policies (covenant-policy-api) |
| `DELETE` | /covenant/covenant/policies/{policyId} | `covenant_policy_api_delete_covenant_covenant_policies_policyId` | [stub] Delete /covenant/covenant/policies/{policyId} (covenant-policy-api) |
| `GET` | /covenant/covenant/scenarios | `covenant_policy_api_get_covenant_covenant_scenarios` | [stub] List/get /covenant/covenant/scenarios (covenant-policy-api) |
| `POST` | /covenant/covenant/scenarios | `covenant_policy_api_post_covenant_covenant_scenarios` | [stub] Create/invoke /covenant/covenant/scenarios (covenant-policy-api) |
| `GET` | /covenant/covenant/scenarios/{id} | `covenant_policy_api_get_covenant_covenant_scenarios_id` | [stub] List/get /covenant/covenant/scenarios/{id} (covenant-policy-api) |
| `DELETE` | /covenant/covenant/scenarios/{id} | `covenant_policy_api_delete_covenant_covenant_scenarios_id` | [stub] Delete /covenant/covenant/scenarios/{id} (covenant-policy-api) |
| `POST` | /covenant/covenant/scenarios/{id}/run | `covenant_policy_api_post_covenant_covenant_scenarios_id_run` | [stub] Create/invoke /covenant/covenant/scenarios/{id}/run (covenant-policy-api) |
| `POST` | /covenant/covenant/simulate | `covenant_policy_api_post_covenant_covenant_simulate` | [stub] Create/invoke /covenant/covenant/simulate (covenant-policy-api) |
| `GET` | /covenant/covenant/simulation-history | `covenant_policy_api_get_covenant_covenant_simulation_history` | [stub] List/get /covenant/covenant/simulation-history (covenant-policy-api) |
| `GET` | /covenant/covenant/status | `covenant_policy_api_get_covenant_covenant_status` | [stub] List/get /covenant/covenant/status (covenant-policy-api) |
| `GET` | /covenant/covenant/templates | `covenant_policy_api_get_covenant_covenant_templates` | [stub] List/get /covenant/covenant/templates (covenant-policy-api) |
| `POST` | /covenant/covenant/templates/{templateKey}/instantiate | `covenant_policy_api_post_covenant_covenant_templates_templateKey_instantiate` | [stub] Create/invoke /covenant/covenant/templates/{templateKey}/instantiate (covenant-policy-api) |

<a id="crm"></a>

## crm

Auto-generated tag for crm route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `POST` | /crm/crm/sync/{crmType} | `crm_post_crm_crm_sync_crmType` | [stub] Create/invoke /crm/crm/sync/{crmType} (crm) |
| `GET` | /crm/dynamics/opportunities | `crm_get_crm_dynamics_opportunities` | [stub] List/get /crm/dynamics/opportunities (crm) |
| `GET` | /crm/hubspot/contacts | `crm_get_crm_hubspot_contacts` | [stub] List/get /crm/hubspot/contacts (crm) |
| `GET` | /crm/hubspot/deals | `crm_get_crm_hubspot_deals` | [stub] List/get /crm/hubspot/deals (crm) |
| `GET` | /crm/salesforce/accounts | `crm_get_crm_salesforce_accounts` | [stub] List/get /crm/salesforce/accounts (crm) |
| `GET` | /crm/salesforce/leads | `crm_get_crm_salesforce_leads` | [stub] List/get /crm/salesforce/leads (crm) |
| `GET` | /crm/salesforce/opportunities | `crm_get_crm_salesforce_opportunities` | [stub] List/get /crm/salesforce/opportunities (crm) |
| `POST` | /dynamics/crm/sync/{crmType} | `crm_post_dynamics_crm_sync_crmType` | [stub] Create/invoke /dynamics/crm/sync/{crmType} (crm) |
| `GET` | /dynamics/dynamics/opportunities | `crm_get_dynamics_dynamics_opportunities` | [stub] List/get /dynamics/dynamics/opportunities (crm) |
| `GET` | /dynamics/hubspot/contacts | `crm_get_dynamics_hubspot_contacts` | [stub] List/get /dynamics/hubspot/contacts (crm) |
| `GET` | /dynamics/hubspot/deals | `crm_get_dynamics_hubspot_deals` | [stub] List/get /dynamics/hubspot/deals (crm) |
| `GET` | /dynamics/salesforce/accounts | `crm_get_dynamics_salesforce_accounts` | [stub] List/get /dynamics/salesforce/accounts (crm) |
| `GET` | /dynamics/salesforce/leads | `crm_get_dynamics_salesforce_leads` | [stub] List/get /dynamics/salesforce/leads (crm) |
| `GET` | /dynamics/salesforce/opportunities | `crm_get_dynamics_salesforce_opportunities` | [stub] List/get /dynamics/salesforce/opportunities (crm) |
| `POST` | /hubspot/crm/sync/{crmType} | `crm_post_hubspot_crm_sync_crmType` | [stub] Create/invoke /hubspot/crm/sync/{crmType} (crm) |
| `GET` | /hubspot/dynamics/opportunities | `crm_get_hubspot_dynamics_opportunities` | [stub] List/get /hubspot/dynamics/opportunities (crm) |
| `GET` | /hubspot/hubspot/contacts | `crm_get_hubspot_hubspot_contacts` | [stub] List/get /hubspot/hubspot/contacts (crm) |
| `GET` | /hubspot/hubspot/deals | `crm_get_hubspot_hubspot_deals` | [stub] List/get /hubspot/hubspot/deals (crm) |
| `GET` | /hubspot/salesforce/accounts | `crm_get_hubspot_salesforce_accounts` | [stub] List/get /hubspot/salesforce/accounts (crm) |
| `GET` | /hubspot/salesforce/leads | `crm_get_hubspot_salesforce_leads` | [stub] List/get /hubspot/salesforce/leads (crm) |
| `GET` | /hubspot/salesforce/opportunities | `crm_get_hubspot_salesforce_opportunities` | [stub] List/get /hubspot/salesforce/opportunities (crm) |
| `POST` | /salesforce/crm/sync/{crmType} | `crm_post_salesforce_crm_sync_crmType` | [stub] Create/invoke /salesforce/crm/sync/{crmType} (crm) |
| `GET` | /salesforce/dynamics/opportunities | `crm_get_salesforce_dynamics_opportunities` | [stub] List/get /salesforce/dynamics/opportunities (crm) |
| `GET` | /salesforce/hubspot/contacts | `crm_get_salesforce_hubspot_contacts` | [stub] List/get /salesforce/hubspot/contacts (crm) |
| `GET` | /salesforce/hubspot/deals | `crm_get_salesforce_hubspot_deals` | [stub] List/get /salesforce/hubspot/deals (crm) |
| `GET` | /salesforce/salesforce/accounts | `crm_get_salesforce_salesforce_accounts` | [stub] List/get /salesforce/salesforce/accounts (crm) |
| `GET` | /salesforce/salesforce/leads | `crm_get_salesforce_salesforce_leads` | [stub] List/get /salesforce/salesforce/leads (crm) |
| `GET` | /salesforce/salesforce/opportunities | `crm_get_salesforce_salesforce_opportunities` | [stub] List/get /salesforce/salesforce/opportunities (crm) |

<a id="cross-app-handoffs"></a>

## cross-app-handoffs

Auto-generated tag for cross-app-handoffs route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /cross-app/cross-app/family/health | `cross_app_handoffs_get_cross_app_cross_app_family_health` | [stub] List/get /cross-app/cross-app/family/health (cross-app-handoffs) |
| `GET` | /cross-app/cross-app/handoffs/contracts | `cross_app_handoffs_get_cross_app_cross_app_handoffs_contracts` | [stub] List/get /cross-app/cross-app/handoffs/contracts (cross-app-handoffs) |
| `GET` | /cross-app/cross-app/handoffs/history | `cross_app_handoffs_get_cross_app_cross_app_handoffs_history` | [stub] List/get /cross-app/cross-app/handoffs/history (cross-app-handoffs) |
| `GET` | /cross-app/cross-app/handoffs/stats | `cross_app_handoffs_get_cross_app_cross_app_handoffs_stats` | [stub] List/get /cross-app/cross-app/handoffs/stats (cross-app-handoffs) |
| `POST` | /cross-app/cross-app/handoffs/trigger | `cross_app_handoffs_post_cross_app_cross_app_handoffs_trigger` | [stub] Create/invoke /cross-app/cross-app/handoffs/trigger (cross-app-handoffs) |
| `GET` | /cross-app/cross-app/recent-items | `cross_app_handoffs_get_cross_app_cross_app_recent_items` | [stub] List/get /cross-app/cross-app/recent-items (cross-app-handoffs) |
| `POST` | /cross-app/cross-app/recent-items | `cross_app_handoffs_post_cross_app_cross_app_recent_items` | [stub] Create/invoke /cross-app/cross-app/recent-items (cross-app-handoffs) |
| `DELETE` | /cross-app/cross-app/recent-items | `cross_app_handoffs_delete_cross_app_cross_app_recent_items` | [stub] Delete /cross-app/cross-app/recent-items (cross-app-handoffs) |

<a id="cross-domain-query"></a>

## cross-domain-query

Auto-generated tag for cross-domain-query route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `POST` | /cross-domain-query/cross-domain-query | `cross_domain_query_post_cross_domain_query_cross_domain_query` | [stub] Create/invoke /cross-domain-query/cross-domain-query (cross-domain-query) |
| `GET` | /cross-domain-query/cross-domain-query/suggestions | `cross_domain_query_get_cross_domain_query_cross_domain_query_suggestions` | [stub] List/get /cross-domain-query/cross-domain-query/suggestions (cross-domain-query) |

<a id="cross-platform"></a>

## cross-platform

Auto-generated tag for cross-platform route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /cross-platform/cross-platform/correlations | `cross_platform_get_cross_platform_cross_platform_correlations` | [stub] List/get /cross-platform/cross-platform/correlations (cross-platform) |
| `GET` | /cross-platform/cross-platform/evidence | `cross_platform_get_cross_platform_cross_platform_evidence` | [stub] List/get /cross-platform/cross-platform/evidence (cross-platform) |
| `GET` | /cross-platform/cross-platform/pilots | `cross_platform_get_cross_platform_cross_platform_pilots` | [stub] List/get /cross-platform/cross-platform/pilots (cross-platform) |
| `GET` | /cross-platform/cross-platform/run-health | `cross_platform_get_cross_platform_cross_platform_run_health` | [stub] List/get /cross-platform/cross-platform/run-health (cross-platform) |

<a id="crud"></a>

## crud

Auto-generated tag for crud route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /crud/documents | `crud_get_crud_documents` | [stub] List/get /crud/documents (crud) |
| `POST` | /crud/documents | `crud_post_crud_documents` | [stub] Create/invoke /crud/documents (crud) |
| `PUT` | /crud/documents/{id} | `crud_put_crud_documents_id` | [stub] Update /crud/documents/{id} (crud) |
| `DELETE` | /crud/documents/{id} | `crud_delete_crud_documents_id` | [stub] Delete /crud/documents/{id} (crud) |
| `POST` | /crud/documents/{id}/comments | `crud_post_crud_documents_id_comments` | [stub] Create/invoke /crud/documents/{id}/comments (crud) |
| `POST` | /crud/documents/{id}/restore | `crud_post_crud_documents_id_restore` | [stub] Create/invoke /crud/documents/{id}/restore (crud) |
| `GET` | /crud/documents/{id}/versions | `crud_get_crud_documents_id_versions` | [stub] List/get /crud/documents/{id}/versions (crud) |
| `PATCH` | /crud/documents/comments/{commentId}/resolve | `crud_patch_crud_documents_comments_commentId_resolve` | [stub] Patch /crud/documents/comments/{commentId}/resolve (crud) |
| `GET` | /crud/documents/content-library | `crud_get_crud_documents_content_library` | [stub] List/get /crud/documents/content-library (crud) |
| `GET` | /crud/documents/templates | `crud_get_crud_documents_templates` | [stub] List/get /crud/documents/templates (crud) |
| `GET` | /crud/documents/templates/{id} | `crud_get_crud_documents_templates_id` | [stub] List/get /crud/documents/templates/{id} (crud) |
| `GET` | /crud/firestorm/assessments | `crud_get_crud_firestorm_assessments` | [stub] List/get /crud/firestorm/assessments (crud) |
| `POST` | /crud/firestorm/assessments | `crud_post_crud_firestorm_assessments` | [stub] Create/invoke /crud/firestorm/assessments (crud) |
| `GET` | /crud/firestorm/assessments/{id} | `crud_get_crud_firestorm_assessments_id` | [stub] List/get /crud/firestorm/assessments/{id} (crud) |
| `PUT` | /crud/firestorm/assessments/{id} | `crud_put_crud_firestorm_assessments_id` | [stub] Update /crud/firestorm/assessments/{id} (crud) |
| `DELETE` | /crud/firestorm/assessments/{id} | `crud_delete_crud_firestorm_assessments_id` | [stub] Delete /crud/firestorm/assessments/{id} (crud) |
| `GET` | /crud/firestorm/findings | `crud_get_crud_firestorm_findings` | [stub] List/get /crud/firestorm/findings (crud) |
| `POST` | /crud/firestorm/findings | `crud_post_crud_firestorm_findings` | [stub] Create/invoke /crud/firestorm/findings (crud) |
| `GET` | /crud/firestorm/findings/{id} | `crud_get_crud_firestorm_findings_id` | [stub] List/get /crud/firestorm/findings/{id} (crud) |
| `PUT` | /crud/firestorm/findings/{id} | `crud_put_crud_firestorm_findings_id` | [stub] Update /crud/firestorm/findings/{id} (crud) |
| `GET` | /crud/firestorm/reports | `crud_get_crud_firestorm_reports` | [stub] List/get /crud/firestorm/reports (crud) |
| `GET` | /crud/firestorm/reports/{assessmentId} | `crud_get_crud_firestorm_reports_assessmentId` | [stub] List/get /crud/firestorm/reports/{assessmentId} (crud) |
| `GET` | /crud/firestorm/reports/export-summary | `crud_get_crud_firestorm_reports_export_summary` | [stub] List/get /crud/firestorm/reports/export-summary (crud) |
| `GET` | /crud/firestorm/risk-scores | `crud_get_crud_firestorm_risk_scores` | [stub] List/get /crud/firestorm/risk-scores (crud) |
| `POST` | /crud/firestorm/risk-scores | `crud_post_crud_firestorm_risk_scores` | [stub] Create/invoke /crud/firestorm/risk-scores (crud) |
| `GET` | /crud/firestorm/scenarios | `crud_get_crud_firestorm_scenarios` | [stub] List/get /crud/firestorm/scenarios (crud) |
| `POST` | /crud/firestorm/scenarios | `crud_post_crud_firestorm_scenarios` | [stub] Create/invoke /crud/firestorm/scenarios (crud) |
| `GET` | /crud/firestorm/scenarios/{id} | `crud_get_crud_firestorm_scenarios_id` | [stub] List/get /crud/firestorm/scenarios/{id} (crud) |
| `PUT` | /crud/firestorm/scenarios/{id} | `crud_put_crud_firestorm_scenarios_id` | [stub] Update /crud/firestorm/scenarios/{id} (crud) |
| `DELETE` | /crud/firestorm/scenarios/{id} | `crud_delete_crud_firestorm_scenarios_id` | [stub] Delete /crud/firestorm/scenarios/{id} (crud) |
| `GET` | /crud/firestorm/simulations | `crud_get_crud_firestorm_simulations` | [stub] List/get /crud/firestorm/simulations (crud) |
| `POST` | /crud/firestorm/simulations | `crud_post_crud_firestorm_simulations` | [stub] Create/invoke /crud/firestorm/simulations (crud) |
| `GET` | /crud/firestorm/simulations/{id} | `crud_get_crud_firestorm_simulations_id` | [stub] List/get /crud/firestorm/simulations/{id} (crud) |

<a id="csv-export"></a>

## csv-export

Auto-generated tag for csv-export route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /csv-export/terra/distress/export/csv | `csv_export_get_csv_export_terra_distress_export_csv` | [stub] List/get /csv-export/terra/distress/export/csv (csv-export) |

<a id="data-retention"></a>

## data-retention

Auto-generated tag for data-retention route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /data-retention/data-retention/audit-log | `data_retention_get_data_retention_data_retention_audit_log` | [stub] List/get /data-retention/data-retention/audit-log (data-retention) |
| `GET` | /data-retention/data-retention/policies | `data_retention_get_data_retention_data_retention_policies` | [stub] List/get /data-retention/data-retention/policies (data-retention) |
| `PUT` | /data-retention/data-retention/policies | `data_retention_put_data_retention_data_retention_policies` | [stub] Update /data-retention/data-retention/policies (data-retention) |
| `POST` | /data-retention/data-retention/policies/{policyId}/run | `data_retention_post_data_retention_data_retention_policies_policyId_run` | [stub] Create/invoke /data-retention/data-retention/policies/{policyId}/run (data-retention) |
| `POST` | /data-retention/data-retention/sweep | `data_retention_post_data_retention_data_retention_sweep` | [stub] Create/invoke /data-retention/data-retention/sweep (data-retention) |
| `GET` | /data-retention/data-retention/sweep-status | `data_retention_get_data_retention_data_retention_sweep_status` | [stub] List/get /data-retention/data-retention/sweep-status (data-retention) |
| `GET` | /data-retention/data-retention/tables | `data_retention_get_data_retention_data_retention_tables` | [stub] List/get /data-retention/data-retention/tables (data-retention) |

<a id="dataverse"></a>

## dataverse

Auto-generated tag for dataverse route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /business-events/accounts | `dataverse_get_business_events_accounts` | [stub] List/get /business-events/accounts (dataverse) |
| `GET` | /business-events/accounts/{accountId} | `dataverse_get_business_events_accounts_accountId` | [stub] List/get /business-events/accounts/{accountId} (dataverse) |
| `GET` | /business-events/activities | `dataverse_get_business_events_activities` | [stub] List/get /business-events/activities (dataverse) |
| `POST` | /business-events/activities | `dataverse_post_business_events_activities` | [stub] Create/invoke /business-events/activities (dataverse) |
| `GET` | /business-events/activities/{activityId} | `dataverse_get_business_events_activities_activityId` | [stub] List/get /business-events/activities/{activityId} (dataverse) |
| `PATCH` | /business-events/activities/{activityId} | `dataverse_patch_business_events_activities_activityId` | [stub] Patch /business-events/activities/{activityId} (dataverse) |
| `DELETE` | /business-events/activities/{activityId} | `dataverse_delete_business_events_activities_activityId` | [stub] Delete /business-events/activities/{activityId} (dataverse) |
| `GET` | /business-events/aegis/identity-signals | `dataverse_get_business_events_aegis_identity_signals` | [stub] List/get /business-events/aegis/identity-signals (dataverse) |
| `POST` | /business-events/alloy/ingest-signals | `dataverse_post_business_events_alloy_ingest_signals` | [stub] Create/invoke /business-events/alloy/ingest-signals (dataverse) |
| `GET` | /business-events/contacts | `dataverse_get_business_events_contacts` | [stub] List/get /business-events/contacts (dataverse) |
| `POST` | /business-events/contacts | `dataverse_post_business_events_contacts` | [stub] Create/invoke /business-events/contacts (dataverse) |
| `GET` | /business-events/contacts/{contactId} | `dataverse_get_business_events_contacts_contactId` | [stub] List/get /business-events/contacts/{contactId} (dataverse) |
| `PATCH` | /business-events/contacts/{contactId} | `dataverse_patch_business_events_contacts_contactId` | [stub] Patch /business-events/contacts/{contactId} (dataverse) |
| `DELETE` | /business-events/contacts/{contactId} | `dataverse_delete_business_events_contacts_contactId` | [stub] Delete /business-events/contacts/{contactId} (dataverse) |
| `GET` | /business-events/leads | `dataverse_get_business_events_leads` | [stub] List/get /business-events/leads (dataverse) |
| `POST` | /business-events/leads | `dataverse_post_business_events_leads` | [stub] Create/invoke /business-events/leads (dataverse) |
| `GET` | /business-events/leads/{leadId} | `dataverse_get_business_events_leads_leadId` | [stub] List/get /business-events/leads/{leadId} (dataverse) |
| `PATCH` | /business-events/leads/{leadId} | `dataverse_patch_business_events_leads_leadId` | [stub] Patch /business-events/leads/{leadId} (dataverse) |
| `DELETE` | /business-events/leads/{leadId} | `dataverse_delete_business_events_leads_leadId` | [stub] Delete /business-events/leads/{leadId} (dataverse) |
| `POST` | /business-events/notes | `dataverse_post_business_events_notes` | [stub] Create/invoke /business-events/notes (dataverse) |
| `GET` | /business-events/opportunities | `dataverse_get_business_events_opportunities` | [stub] List/get /business-events/opportunities (dataverse) |
| `GET` | /business-events/opportunities/{opportunityId} | `dataverse_get_business_events_opportunities_opportunityId` | [stub] List/get /business-events/opportunities/{opportunityId} (dataverse) |
| `PATCH` | /business-events/opportunities/{opportunityId} | `dataverse_patch_business_events_opportunities_opportunityId` | [stub] Patch /business-events/opportunities/{opportunityId} (dataverse) |
| `DELETE` | /business-events/opportunities/{opportunityId} | `dataverse_delete_business_events_opportunities_opportunityId` | [stub] Delete /business-events/opportunities/{opportunityId} (dataverse) |
| `PATCH` | /business-events/opportunities/{opportunityId}/stage | `dataverse_patch_business_events_opportunities_opportunityId_stage` | [stub] Patch /business-events/opportunities/{opportunityId}/stage (dataverse) |
| `GET` | /business-events/signals | `dataverse_get_business_events_signals` | [stub] List/get /business-events/signals (dataverse) |
| `GET` | /business-events/status | `dataverse_get_business_events_status` | [stub] List/get /business-events/status (dataverse) |
| `GET` | /business-events/sync | `dataverse_get_business_events_sync` | [stub] List/get /business-events/sync (dataverse) |
| `POST` | /business-events/terra/sync | `dataverse_post_business_events_terra_sync` | [stub] Create/invoke /business-events/terra/sync (dataverse) |
| `GET` | /business-events/vessels/fleet-operators | `dataverse_get_business_events_vessels_fleet_operators` | [stub] List/get /business-events/vessels/fleet-operators (dataverse) |

<a id="deals"></a>

## deals

Auto-generated tag for deals route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /deals/terra/pipeline/deals | `deals_get_deals_terra_pipeline_deals` | [stub] List/get /deals/terra/pipeline/deals (deals) |
| `POST` | /deals/terra/pipeline/deals | `deals_post_deals_terra_pipeline_deals` | [stub] Create/invoke /deals/terra/pipeline/deals (deals) |
| `PATCH` | /deals/terra/pipeline/deals/{id}/stage | `deals_patch_deals_terra_pipeline_deals_id_stage` | [stub] Patch /deals/terra/pipeline/deals/{id}/stage (deals) |

<a id="debug"></a>

## debug

Auto-generated tag for debug route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /debug/debug/integrations | `debug_get_debug_debug_integrations` | [stub] List/get /debug/debug/integrations (debug) |
| `GET` | /debug/debug/sentry-test | `debug_get_debug_debug_sentry_test` | [stub] List/get /debug/debug/sentry-test (debug) |

<a id="decide"></a>

## decide

Auto-generated tag for decide route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /decide/control-tower/decide/agents | `decide_get_decide_control_tower_decide_agents` | [stub] List/get /decide/control-tower/decide/agents (decide) |
| `POST` | /decide/control-tower/decide/approve/{id} | `decide_post_decide_control_tower_decide_approve_id` | [stub] Create/invoke /decide/control-tower/decide/approve/{id} (decide) |
| `GET` | /decide/control-tower/decide/journal | `decide_get_decide_control_tower_decide_journal` | [stub] List/get /decide/control-tower/decide/journal (decide) |
| `PATCH` | /decide/control-tower/decide/journal/{id} | `decide_patch_decide_control_tower_decide_journal_id` | [stub] Patch /decide/control-tower/decide/journal/{id} (decide) |
| `POST` | /decide/control-tower/decide/orchestrate | `decide_post_decide_control_tower_decide_orchestrate` | [stub] Create/invoke /decide/control-tower/decide/orchestrate (decide) |

<a id="decisioning"></a>

## decisioning

Auto-generated tag for decisioning route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `POST` | /decisioning/decisioning/check-policy | `decisioning_post_decisioning_decisioning_check_policy` | [stub] Create/invoke /decisioning/decisioning/check-policy (decisioning) |
| `POST` | /decisioning/decisioning/evaluate | `decisioning_post_decisioning_decisioning_evaluate` | [stub] Create/invoke /decisioning/decisioning/evaluate (decisioning) |
| `POST` | /decisioning/decisioning/execute | `decisioning_post_decisioning_decisioning_execute` | [stub] Create/invoke /decisioning/decisioning/execute (decisioning) |
| `GET` | /decisioning/decisioning/policies | `decisioning_get_decisioning_decisioning_policies` | [stub] List/get /decisioning/decisioning/policies (decisioning) |
| `POST` | /decisioning/decisioning/policies | `decisioning_post_decisioning_decisioning_policies` | [stub] Create/invoke /decisioning/decisioning/policies (decisioning) |
| `GET` | /decisioning/decisioning/runs | `decisioning_get_decisioning_decisioning_runs` | [stub] List/get /decisioning/decisioning/runs (decisioning) |
| `GET` | /decisioning/decisioning/runs/{runId} | `decisioning_get_decisioning_decisioning_runs_runId` | [stub] List/get /decisioning/decisioning/runs/{runId} (decisioning) |
| `POST` | /decisioning/decisioning/runs/{runId}/outcome | `decisioning_post_decisioning_decisioning_runs_runId_outcome` | [stub] Create/invoke /decisioning/decisioning/runs/{runId}/outcome (decisioning) |
| `POST` | /decisioning/decisioning/runs/{runId}/prove | `decisioning_post_decisioning_decisioning_runs_runId_prove` | [stub] Create/invoke /decisioning/decisioning/runs/{runId}/prove (decisioning) |
| `GET` | /decisioning/decisioning/signals | `decisioning_get_decisioning_decisioning_signals` | [stub] List/get /decisioning/decisioning/signals (decisioning) |
| `GET` | /decisioning/decisioning/stats | `decisioning_get_decisioning_decisioning_stats` | [stub] List/get /decisioning/decisioning/stats (decisioning) |
| `GET` | /decisioning/decisioning/workflows | `decisioning_get_decisioning_decisioning_workflows` | [stub] List/get /decisioning/decisioning/workflows (decisioning) |

<a id="decisions-receipts"></a>

## decisions-receipts

Auto-generated tag for decisions-receipts route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /decisions/decisions/receipts | `decisions_receipts_get_decisions_decisions_receipts` | [stub] List/get /decisions/decisions/receipts (decisions-receipts) |
| `POST` | /decisions/decisions/receipts | `decisions_receipts_post_decisions_decisions_receipts` | [stub] Create/invoke /decisions/decisions/receipts (decisions-receipts) |
| `GET` | /decisions/decisions/receipts/{receiptId} | `decisions_receipts_get_decisions_decisions_receipts_receiptId` | [stub] List/get /decisions/decisions/receipts/{receiptId} (decisions-receipts) |
| `GET` | /decisions/decisions/receipts/download/{receiptId} | `decisions_receipts_get_decisions_decisions_receipts_download_receiptId` | [stub] List/get /decisions/decisions/receipts/download/{receiptId} (decisions-receipts) |

<a id="decisions-runtime"></a>

## decisions-runtime

Auto-generated tag for decisions-runtime route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /decisions-runtime/decisions/cards | `decisions_runtime_get_decisions_runtime_decisions_cards` | [stub] List/get /decisions-runtime/decisions/cards (decisions-runtime) |
| `GET` | /decisions-runtime/decisions/cards/{id} | `decisions_runtime_get_decisions_runtime_decisions_cards_id` | [stub] List/get /decisions-runtime/decisions/cards/{id} (decisions-runtime) |
| `POST` | /decisions-runtime/decisions/cards/{id}/approve | `decisions_runtime_post_decisions_runtime_decisions_cards_id_approve` | [stub] Create/invoke /decisions-runtime/decisions/cards/{id}/approve (decisions-runtime) |
| `POST` | /decisions-runtime/decisions/cards/{id}/delegate | `decisions_runtime_post_decisions_runtime_decisions_cards_id_delegate` | [stub] Create/invoke /decisions-runtime/decisions/cards/{id}/delegate (decisions-runtime) |
| `POST` | /decisions-runtime/decisions/cards/{id}/reject | `decisions_runtime_post_decisions_runtime_decisions_cards_id_reject` | [stub] Create/invoke /decisions-runtime/decisions/cards/{id}/reject (decisions-runtime) |
| `POST` | /decisions-runtime/decisions/cards/{id}/request-changes | `decisions_runtime_post_decisions_runtime_decisions_cards_id_request_changes` | [stub] Create/invoke /decisions-runtime/decisions/cards/{id}/request-changes (decisions-runtime) |
| `POST` | /decisions-runtime/decisions/cards/{id}/validate-and-promote | `decisions_runtime_post_decisions_runtime_decisions_cards_id_validate_and_promote` | [stub] Create/invoke /decisions-runtime/decisions/cards/{id}/validate-and-promote (decisions-runtime) |
| `POST` | /decisions-runtime/decisions/simulate-policy | `decisions_runtime_post_decisions_runtime_decisions_simulate_policy` | [stub] Create/invoke /decisions-runtime/decisions/simulate-policy (decisions-runtime) |

<a id="delta-sync"></a>

## delta-sync

Auto-generated tag for delta-sync route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /aegis/aegis/sync | `delta_sync_get_aegis_aegis_sync` | [stub] List/get /aegis/aegis/sync (delta-sync) |
| `GET` | /aegis/alloy/sync | `delta_sync_get_aegis_alloy_sync` | [stub] List/get /aegis/alloy/sync (delta-sync) |
| `GET` | /aegis/vessels/sync | `delta_sync_get_aegis_vessels_sync` | [stub] List/get /aegis/vessels/sync (delta-sync) |
| `GET` | /alloy/aegis/sync | `delta_sync_get_alloy_aegis_sync` | [stub] List/get /alloy/aegis/sync (delta-sync) |
| `GET` | /alloy/alloy/sync | `delta_sync_get_alloy_alloy_sync` | [stub] List/get /alloy/alloy/sync (delta-sync) |
| `GET` | /alloy/vessels/sync | `delta_sync_get_alloy_vessels_sync` | [stub] List/get /alloy/vessels/sync (delta-sync) |
| `GET` | /vessels/aegis/sync | `delta_sync_get_vessels_aegis_sync` | [stub] List/get /vessels/aegis/sync (delta-sync) |
| `GET` | /vessels/alloy/sync | `delta_sync_get_vessels_alloy_sync` | [stub] List/get /vessels/alloy/sync (delta-sync) |
| `GET` | /vessels/vessels/sync | `delta_sync_get_vessels_vessels_sync` | [stub] List/get /vessels/vessels/sync (delta-sync) |

<a id="demo-governed-scenarios"></a>

## demo-governed-scenarios

Auto-generated tag for demo-governed-scenarios route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `POST` | /demo/seed-governed-scenarios/demo/seed-governed-scenarios | `demo_governed_scenarios_post_demo_seed_governed_scenarios_demo_seed_governed_scenarios` | [stub] Create/invoke /demo/seed-governed-scenarios/demo/seed-governed-scenarios (demo-governed-scenarios) |

<a id="demo-requests"></a>

## demo-requests

Auto-generated tag for demo-requests route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /demo-requests/demo-requests | `demo_requests_get_demo_requests_demo_requests` | [stub] List/get /demo-requests/demo-requests (demo-requests) |
| `POST` | /demo-requests/demo-requests | `demo_requests_post_demo_requests_demo_requests` | [stub] Create/invoke /demo-requests/demo-requests (demo-requests) |

<a id="demo-reset"></a>

## demo-reset

Auto-generated tag for demo-reset route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `POST` | /demo-reset/demo/reset | `demo_reset_post_demo_reset_demo_reset` | [stub] Create/invoke /demo-reset/demo/reset (demo-reset) |
| `GET` | /demo-reset/demo/reset/status | `demo_reset_get_demo_reset_demo_reset_status` | [stub] List/get /demo-reset/demo/reset/status (demo-reset) |

<a id="deployments"></a>

## deployments

Auto-generated tag for deployments route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /deployments/deployments | `deployments_get_deployments_deployments` | [stub] List/get /deployments/deployments (deployments) |
| `POST` | /deployments/deployments | `deployments_post_deployments_deployments` | [stub] Create/invoke /deployments/deployments (deployments) |
| `GET` | /deployments/deployments/{appId} | `deployments_get_deployments_deployments_appId` | [stub] List/get /deployments/deployments/{appId} (deployments) |
| `GET` | /deployments/deployments/{appId}/history | `deployments_get_deployments_deployments_appId_history` | [stub] List/get /deployments/deployments/{appId}/history (deployments) |
| `POST` | /deployments/deployments/{appId}/rollback | `deployments_post_deployments_deployments_appId_rollback` | [stub] Create/invoke /deployments/deployments/{appId}/rollback (deployments) |

<a id="digital-twins"></a>

## digital-twins

Auto-generated tag for digital-twins route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /digital-twins/digital-twins | `digital_twins_get_digital_twins_digital_twins` | [stub] List/get /digital-twins/digital-twins (digital-twins) |
| `GET` | /digital-twins/digital-twins/{twinId} | `digital_twins_get_digital_twins_digital_twins_twinId` | [stub] List/get /digital-twins/digital-twins/{twinId} (digital-twins) |
| `PATCH` | /digital-twins/digital-twins/{twinId} | `digital_twins_patch_digital_twins_digital_twins_twinId` | [stub] Patch /digital-twins/digital-twins/{twinId} (digital-twins) |
| `POST` | /digital-twins/digital-twins/{twinId}/simulate | `digital_twins_post_digital_twins_digital_twins_twinId_simulate` | [stub] Create/invoke /digital-twins/digital-twins/{twinId}/simulate (digital-twins) |
| `POST` | /digital-twins/digital-twins/demo/seed | `digital_twins_post_digital_twins_digital_twins_demo_seed` | [stub] Create/invoke /digital-twins/digital-twins/demo/seed (digital-twins) |
| `GET` | /digital-twins/digital-twins/entity/{entityId} | `digital_twins_get_digital_twins_digital_twins_entity_entityId` | [stub] List/get /digital-twins/digital-twins/entity/{entityId} (digital-twins) |
| `POST` | /digital-twins/digital-twins/posture | `digital_twins_post_digital_twins_digital_twins_posture` | [stub] Create/invoke /digital-twins/digital-twins/posture (digital-twins) |
| `POST` | /digital-twins/digital-twins/property | `digital_twins_post_digital_twins_digital_twins_property` | [stub] Create/invoke /digital-twins/digital-twins/property (digital-twins) |
| `GET` | /digital-twins/digital-twins/type/{type} | `digital_twins_get_digital_twins_digital_twins_type_type` | [stub] List/get /digital-twins/digital-twins/type/{type} (digital-twins) |
| `POST` | /digital-twins/digital-twins/vessel | `digital_twins_post_digital_twins_digital_twins_vessel` | [stub] Create/invoke /digital-twins/digital-twins/vessel (digital-twins) |

<a id="doctrine"></a>

## doctrine

Auto-generated tag for doctrine route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /doctrine/doctrine/events | `doctrine_get_doctrine_doctrine_events` | [stub] List/get /doctrine/doctrine/events (doctrine) |
| `POST` | /doctrine/doctrine/events | `doctrine_post_doctrine_doctrine_events` | [stub] Create/invoke /doctrine/doctrine/events (doctrine) |

<a id="domain-atlas-execution"></a>

## domain-atlas-execution

Auto-generated tag for domain-atlas-execution route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `POST` | /atlas/${prefix}/evaluate | `domain_atlas_execution_post_atlas_prefix_evaluate` | [stub] Create/invoke /atlas/${prefix}/evaluate (domain-atlas-execution) |
| `GET` | /atlas/${prefix}/evaluation-hooks | `domain_atlas_execution_get_atlas_prefix_evaluation_hooks` | [stub] List/get /atlas/${prefix}/evaluation-hooks (domain-atlas-execution) |
| `POST` | /atlas/${prefix}/evaluation-hooks/replay | `domain_atlas_execution_post_atlas_prefix_evaluation_hooks_replay` | [stub] Create/invoke /atlas/${prefix}/evaluation-hooks/replay (domain-atlas-execution) |
| `GET` | /atlas/${prefix}/evidence | `domain_atlas_execution_get_atlas_prefix_evidence` | [stub] List/get /atlas/${prefix}/evidence (domain-atlas-execution) |
| `POST` | /atlas/${prefix}/evidence | `domain_atlas_execution_post_atlas_prefix_evidence` | [stub] Create/invoke /atlas/${prefix}/evidence (domain-atlas-execution) |
| `POST` | /atlas/${prefix}/execute | `domain_atlas_execution_post_atlas_prefix_execute` | [stub] Create/invoke /atlas/${prefix}/execute (domain-atlas-execution) |
| `POST` | /atlas/${prefix}/outcome | `domain_atlas_execution_post_atlas_prefix_outcome` | [stub] Create/invoke /atlas/${prefix}/outcome (domain-atlas-execution) |
| `GET` | /atlas/${prefix}/outcomes | `domain_atlas_execution_get_atlas_prefix_outcomes` | [stub] List/get /atlas/${prefix}/outcomes (domain-atlas-execution) |
| `POST` | /atlas/${prefix}/policy-check | `domain_atlas_execution_post_atlas_prefix_policy_check` | [stub] Create/invoke /atlas/${prefix}/policy-check (domain-atlas-execution) |
| `GET` | /atlas/${prefix}/runs | `domain_atlas_execution_get_atlas_prefix_runs` | [stub] List/get /atlas/${prefix}/runs (domain-atlas-execution) |
| `GET` | /atlas/${prefix}/runs/{runId} | `domain_atlas_execution_get_atlas_prefix_runs_runId` | [stub] List/get /atlas/${prefix}/runs/{runId} (domain-atlas-execution) |
| `POST` | /atlas/${prefix}/runs/{runId}/approve | `domain_atlas_execution_post_atlas_prefix_runs_runId_approve` | [stub] Create/invoke /atlas/${prefix}/runs/{runId}/approve (domain-atlas-execution) |
| `POST` | /atlas/${prefix}/runs/{runId}/cancel | `domain_atlas_execution_post_atlas_prefix_runs_runId_cancel` | [stub] Create/invoke /atlas/${prefix}/runs/{runId}/cancel (domain-atlas-execution) |
| `GET` | /atlas/${prefix}/signals | `domain_atlas_execution_get_atlas_prefix_signals` | [stub] List/get /atlas/${prefix}/signals (domain-atlas-execution) |
| `POST` | /atlas/${prefix}/signals | `domain_atlas_execution_post_atlas_prefix_signals` | [stub] Create/invoke /atlas/${prefix}/signals (domain-atlas-execution) |
| `PATCH` | /atlas/${prefix}/signals/{signalId}/status | `domain_atlas_execution_patch_atlas_prefix_signals_signalId_status` | [stub] Patch /atlas/${prefix}/signals/{signalId}/status (domain-atlas-execution) |
| `GET` | /atlas/${prefix}/status | `domain_atlas_execution_get_atlas_prefix_status` | [stub] List/get /atlas/${prefix}/status (domain-atlas-execution) |
| `GET` | /atlas/${prefix}/workflows | `domain_atlas_execution_get_atlas_prefix_workflows` | [stub] List/get /atlas/${prefix}/workflows (domain-atlas-execution) |
| `GET` | /atlas/atlas/execution/status | `domain_atlas_execution_get_atlas_atlas_execution_status` | [stub] List/get /atlas/atlas/execution/status (domain-atlas-execution) |

<a id="domains"></a>

## domains

Auto-generated tag for domains route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /domains/domains/{domain}/graph | `domains_get_domains_domains_domain_graph` | [stub] List/get /domains/domains/{domain}/graph (domains) |
| `GET` | /domains/domains/aegis/graph | `domains_get_domains_domains_aegis_graph` | [stub] List/get /domains/domains/aegis/graph (domains) |
| `GET` | /domains/domains/lyte/graph | `domains_get_domains_domains_lyte_graph` | [stub] List/get /domains/domains/lyte/graph (domains) |
| `GET` | /domains/domains/prism/graph | `domains_get_domains_domains_prism_graph` | [stub] List/get /domains/domains/prism/graph (domains) |
| `GET` | /domains/domains/terra/graph | `domains_get_domains_domains_terra_graph` | [stub] List/get /domains/domains/terra/graph (domains) |
| `GET` | /domains/domains/vessels/graph | `domains_get_domains_domains_vessels_graph` | [stub] List/get /domains/domains/vessels/graph (domains) |

<a id="dos-public-api"></a>

## dos-public-api

Auto-generated tag for dos-public-api route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /autopilot/analytics/summary | `dos_public_api_get_autopilot_analytics_summary` | [stub] List/get /autopilot/analytics/summary (dos-public-api) |
| `GET` | /autopilot/content | `dos_public_api_get_autopilot_content` | [stub] List/get /autopilot/content (dos-public-api) |
| `GET` | /autopilot/subscribers | `dos_public_api_get_autopilot_subscribers` | [stub] List/get /autopilot/subscribers (dos-public-api) |
| `POST` | /autopilot/subscribers | `dos_public_api_post_autopilot_subscribers` | [stub] Create/invoke /autopilot/subscribers (dos-public-api) |

<a id="drift"></a>

## drift

Auto-generated tag for drift route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /drift/drift | `drift_get_drift_drift` | [stub] List/get /drift/drift (drift) |
| `GET` | /drift/drift/{domain} | `drift_get_drift_drift_domain` | [stub] List/get /drift/drift/{domain} (drift) |
| `GET` | /drift/drift/history | `drift_get_drift_drift_history` | [stub] List/get /drift/drift/history (drift) |
| `POST` | /drift/drift/reset | `drift_post_drift_drift_reset` | [stub] Create/invoke /drift/drift/reset (drift) |

<a id="evals"></a>

## evals

Auto-generated tag for evals route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /evals/evals | `evals_get_evals_evals` | [stub] List/get /evals/evals (evals) |
| `GET` | /evals/evals/{id} | `evals_get_evals_evals_id` | [stub] List/get /evals/evals/{id} (evals) |
| `POST` | /evals/evals/run | `evals_post_evals_evals_run` | [stub] Create/invoke /evals/evals/run (evals) |
| `POST` | /evals/evals/run-all | `evals_post_evals_evals_run_all` | [stub] Create/invoke /evals/evals/run-all (evals) |
| `GET` | /evals/evals/runs | `evals_get_evals_evals_runs` | [stub] List/get /evals/evals/runs (evals) |
| `GET` | /evals/evals/runs/{runId} | `evals_get_evals_evals_runs_runId` | [stub] List/get /evals/evals/runs/{runId} (evals) |
| `PATCH` | /evals/evals/scores/{scoreId}/human-label | `evals_patch_evals_evals_scores_scoreId_human_label` | [stub] Patch /evals/evals/scores/{scoreId}/human-label (evals) |
| `GET` | /evals/evals/suites | `evals_get_evals_evals_suites` | [stub] List/get /evals/evals/suites (evals) |
| `GET` | /evals/evals/suites/{suiteId} | `evals_get_evals_evals_suites_suiteId` | [stub] List/get /evals/evals/suites/{suiteId} (evals) |
| `POST` | /evals/evals/suites/{suiteId}/runs/variant | `evals_post_evals_evals_suites_suiteId_runs_variant` | [stub] Create/invoke /evals/evals/suites/{suiteId}/runs/variant (evals) |
| `POST` | /evals/v1/evals/run | `evals_post_evals_v1_evals_run` | [stub] Create/invoke /evals/v1/evals/run (evals) |

<a id="events"></a>

## events

Auto-generated tag for events route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /events/metering/events | `events_get_events_metering_events` | [stub] List/get /events/metering/events (events) |
| `POST` | /events/metering/events | `events_post_events_metering_events` | [stub] Create/invoke /events/metering/events (events) |
| `POST` | /events/metering/events/batch | `events_post_events_metering_events_batch` | [stub] Create/invoke /events/metering/events/batch (events) |

<a id="evidence-graph"></a>

## evidence-graph

Auto-generated tag for evidence-graph route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /evidence-graph/evidence-graph/entities | `evidence_graph_get_evidence_graph_evidence_graph_entities` | [stub] List/get /evidence-graph/evidence-graph/entities (evidence-graph) |
| `GET` | /evidence-graph/evidence-graph/recommendations | `evidence_graph_get_evidence_graph_evidence_graph_recommendations` | [stub] List/get /evidence-graph/evidence-graph/recommendations (evidence-graph) |
| `GET` | /evidence-graph/evidence-graph/recommendations/{id} | `evidence_graph_get_evidence_graph_evidence_graph_recommendations_id` | [stub] List/get /evidence-graph/evidence-graph/recommendations/{id} (evidence-graph) |
| `POST` | /evidence-graph/evidence-graph/recommendations/{id}/decision | `evidence_graph_post_evidence_graph_evidence_graph_recommendations_id_decision` | [stub] Create/invoke /evidence-graph/evidence-graph/recommendations/{id}/decision (evidence-graph) |
| `GET` | /evidence-graph/evidence-graph/recommendations/{id}/decisions | `evidence_graph_get_evidence_graph_evidence_graph_recommendations_id_decisions` | [stub] List/get /evidence-graph/evidence-graph/recommendations/{id}/decisions (evidence-graph) |
| `GET` | /evidence-graph/evidence-graph/signals | `evidence_graph_get_evidence_graph_evidence_graph_signals` | [stub] List/get /evidence-graph/evidence-graph/signals (evidence-graph) |
| `GET` | /evidence-graph/evidence-graph/status | `evidence_graph_get_evidence_graph_evidence_graph_status` | [stub] List/get /evidence-graph/evidence-graph/status (evidence-graph) |
| `GET` | /evidence-graph/evidence-graph/stream | `evidence_graph_get_evidence_graph_evidence_graph_stream` | [stub] List/get /evidence-graph/evidence-graph/stream (evidence-graph) |
| `GET` | /evidence-graph/evidence-graph/why/{entityId} | `evidence_graph_get_evidence_graph_evidence_graph_why_entityId` | [stub] List/get /evidence-graph/evidence-graph/why/{entityId} (evidence-graph) |

<a id="executive-briefings"></a>

## executive-briefings

Auto-generated tag for executive-briefings route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /executive/executive | `executive_briefings_get_executive_executive` | [stub] List/get /executive/executive (executive-briefings) |
| `GET` | /executive/executive/{domain} | `executive_briefings_get_executive_executive_domain` | [stub] List/get /executive/executive/{domain} (executive-briefings) |
| `GET` | /executive/executive/brief/{id} | `executive_briefings_get_executive_executive_brief_id` | [stub] List/get /executive/executive/brief/{id} (executive-briefings) |
| `POST` | /executive/executive/generate | `executive_briefings_post_executive_executive_generate` | [stub] Create/invoke /executive/executive/generate (executive-briefings) |
| `POST` | /executive/executive/generate/{domain} | `executive_briefings_post_executive_executive_generate_domain` | [stub] Create/invoke /executive/executive/generate/{domain} (executive-briefings) |
| `GET` | /executive/executive/history | `executive_briefings_get_executive_executive_history` | [stub] List/get /executive/executive/history (executive-briefings) |

<a id="external-integrations"></a>

## external-integrations

Auto-generated tag for external-integrations route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /integrations/integrations/jira/oauth/authorize | `external_integrations_get_integrations_integrations_jira_oauth_authorize` | [stub] List/get /integrations/integrations/jira/oauth/authorize (external-integrations) |
| `POST` | /integrations/integrations/jira/oauth/callback | `external_integrations_post_integrations_integrations_jira_oauth_callback` | [stub] Create/invoke /integrations/integrations/jira/oauth/callback (external-integrations) |
| `GET` | /integrations/integrations/jira/oauth/status | `external_integrations_get_integrations_integrations_jira_oauth_status` | [stub] List/get /integrations/integrations/jira/oauth/status (external-integrations) |
| `GET` | /integrations/integrations/jira/sync | `external_integrations_get_integrations_integrations_jira_sync` | [stub] List/get /integrations/integrations/jira/sync (external-integrations) |
| `GET` | /integrations/integrations/pagerduty/incidents | `external_integrations_get_integrations_integrations_pagerduty_incidents` | [stub] List/get /integrations/integrations/pagerduty/incidents (external-integrations) |
| `POST` | /integrations/integrations/pagerduty/incidents | `external_integrations_post_integrations_integrations_pagerduty_incidents` | [stub] Create/invoke /integrations/integrations/pagerduty/incidents (external-integrations) |
| `GET` | /integrations/integrations/pagerduty/oncall | `external_integrations_get_integrations_integrations_pagerduty_oncall` | [stub] List/get /integrations/integrations/pagerduty/oncall (external-integrations) |
| `GET` | /integrations/integrations/salesforce/sync | `external_integrations_get_integrations_integrations_salesforce_sync` | [stub] List/get /integrations/integrations/salesforce/sync (external-integrations) |
| `GET` | /integrations/integrations/siem/alerts | `external_integrations_get_integrations_integrations_siem_alerts` | [stub] List/get /integrations/integrations/siem/alerts (external-integrations) |
| `GET` | /integrations/integrations/siem/events | `external_integrations_get_integrations_integrations_siem_events` | [stub] List/get /integrations/integrations/siem/events (external-integrations) |
| `GET` | /integrations/integrations/siem/rules | `external_integrations_get_integrations_integrations_siem_rules` | [stub] List/get /integrations/integrations/siem/rules (external-integrations) |
| `GET` | /integrations/integrations/status | `external_integrations_get_integrations_integrations_status` | [stub] List/get /integrations/integrations/status (external-integrations) |
| `GET` | /integrations/integrations/status/{adapter} | `external_integrations_get_integrations_integrations_status_adapter` | [stub] List/get /integrations/integrations/status/{adapter} (external-integrations) |
| `POST` | /integrations/integrations/status/refresh | `external_integrations_post_integrations_integrations_status_refresh` | [stub] Create/invoke /integrations/integrations/status/refresh (external-integrations) |
| `GET` | /integrations/integrations/webhooks/info | `external_integrations_get_integrations_integrations_webhooks_info` | [stub] List/get /integrations/integrations/webhooks/info (external-integrations) |
| `POST` | /integrations/webhooks/inbound/jira | `external_integrations_post_integrations_webhooks_inbound_jira` | [stub] Create/invoke /integrations/webhooks/inbound/jira (external-integrations) |
| `POST` | /integrations/webhooks/inbound/pagerduty | `external_integrations_post_integrations_webhooks_inbound_pagerduty` | [stub] Create/invoke /integrations/webhooks/inbound/pagerduty (external-integrations) |
| `POST` | /integrations/webhooks/inbound/salesforce/cdc | `external_integrations_post_integrations_webhooks_inbound_salesforce_cdc` | [stub] Create/invoke /integrations/webhooks/inbound/salesforce/cdc (external-integrations) |
| `POST` | /integrations/webhooks/inbound/siem/cef | `external_integrations_post_integrations_webhooks_inbound_siem_cef` | [stub] Create/invoke /integrations/webhooks/inbound/siem/cef (external-integrations) |
| `POST` | /integrations/webhooks/inbound/siem/events | `external_integrations_post_integrations_webhooks_inbound_siem_events` | [stub] Create/invoke /integrations/webhooks/inbound/siem/events (external-integrations) |
| `POST` | /integrations/webhooks/inbound/siem/sentinel | `external_integrations_post_integrations_webhooks_inbound_siem_sentinel` | [stub] Create/invoke /integrations/webhooks/inbound/siem/sentinel (external-integrations) |
| `POST` | /integrations/webhooks/inbound/siem/splunk | `external_integrations_post_integrations_webhooks_inbound_siem_splunk` | [stub] Create/invoke /integrations/webhooks/inbound/siem/splunk (external-integrations) |
| `POST` | /integrations/webhooks/inbound/siem/syslog | `external_integrations_post_integrations_webhooks_inbound_siem_syslog` | [stub] Create/invoke /integrations/webhooks/inbound/siem/syslog (external-integrations) |
| `POST` | /integrations/webhooks/inbound/slack/commands | `external_integrations_post_integrations_webhooks_inbound_slack_commands` | [stub] Create/invoke /integrations/webhooks/inbound/slack/commands (external-integrations) |
| `POST` | /integrations/webhooks/inbound/slack/events | `external_integrations_post_integrations_webhooks_inbound_slack_events` | [stub] Create/invoke /integrations/webhooks/inbound/slack/events (external-integrations) |
| `POST` | /integrations/webhooks/inbound/slack/interactions | `external_integrations_post_integrations_webhooks_inbound_slack_interactions` | [stub] Create/invoke /integrations/webhooks/inbound/slack/interactions (external-integrations) |
| `GET` | /webhooks/integrations/jira/oauth/authorize | `external_integrations_get_webhooks_integrations_jira_oauth_authorize` | [stub] List/get /webhooks/integrations/jira/oauth/authorize (external-integrations) |
| `POST` | /webhooks/integrations/jira/oauth/callback | `external_integrations_post_webhooks_integrations_jira_oauth_callback` | [stub] Create/invoke /webhooks/integrations/jira/oauth/callback (external-integrations) |
| `GET` | /webhooks/integrations/jira/oauth/status | `external_integrations_get_webhooks_integrations_jira_oauth_status` | [stub] List/get /webhooks/integrations/jira/oauth/status (external-integrations) |
| `GET` | /webhooks/integrations/jira/sync | `external_integrations_get_webhooks_integrations_jira_sync` | [stub] List/get /webhooks/integrations/jira/sync (external-integrations) |
| `GET` | /webhooks/integrations/pagerduty/incidents | `external_integrations_get_webhooks_integrations_pagerduty_incidents` | [stub] List/get /webhooks/integrations/pagerduty/incidents (external-integrations) |
| `POST` | /webhooks/integrations/pagerduty/incidents | `external_integrations_post_webhooks_integrations_pagerduty_incidents` | [stub] Create/invoke /webhooks/integrations/pagerduty/incidents (external-integrations) |
| `GET` | /webhooks/integrations/pagerduty/oncall | `external_integrations_get_webhooks_integrations_pagerduty_oncall` | [stub] List/get /webhooks/integrations/pagerduty/oncall (external-integrations) |
| `GET` | /webhooks/integrations/salesforce/sync | `external_integrations_get_webhooks_integrations_salesforce_sync` | [stub] List/get /webhooks/integrations/salesforce/sync (external-integrations) |
| `GET` | /webhooks/integrations/siem/alerts | `external_integrations_get_webhooks_integrations_siem_alerts` | [stub] List/get /webhooks/integrations/siem/alerts (external-integrations) |
| `GET` | /webhooks/integrations/siem/events | `external_integrations_get_webhooks_integrations_siem_events` | [stub] List/get /webhooks/integrations/siem/events (external-integrations) |
| `GET` | /webhooks/integrations/siem/rules | `external_integrations_get_webhooks_integrations_siem_rules` | [stub] List/get /webhooks/integrations/siem/rules (external-integrations) |
| `GET` | /webhooks/integrations/status | `external_integrations_get_webhooks_integrations_status` | [stub] List/get /webhooks/integrations/status (external-integrations) |
| `GET` | /webhooks/integrations/status/{adapter} | `external_integrations_get_webhooks_integrations_status_adapter` | [stub] List/get /webhooks/integrations/status/{adapter} (external-integrations) |
| `POST` | /webhooks/integrations/status/refresh | `external_integrations_post_webhooks_integrations_status_refresh` | [stub] Create/invoke /webhooks/integrations/status/refresh (external-integrations) |
| `GET` | /webhooks/integrations/webhooks/info | `external_integrations_get_webhooks_integrations_webhooks_info` | [stub] List/get /webhooks/integrations/webhooks/info (external-integrations) |
| `POST` | /webhooks/webhooks/inbound/jira | `external_integrations_post_webhooks_webhooks_inbound_jira` | [stub] Create/invoke /webhooks/webhooks/inbound/jira (external-integrations) |
| `POST` | /webhooks/webhooks/inbound/pagerduty | `external_integrations_post_webhooks_webhooks_inbound_pagerduty` | [stub] Create/invoke /webhooks/webhooks/inbound/pagerduty (external-integrations) |
| `POST` | /webhooks/webhooks/inbound/salesforce/cdc | `external_integrations_post_webhooks_webhooks_inbound_salesforce_cdc` | [stub] Create/invoke /webhooks/webhooks/inbound/salesforce/cdc (external-integrations) |
| `POST` | /webhooks/webhooks/inbound/siem/cef | `external_integrations_post_webhooks_webhooks_inbound_siem_cef` | [stub] Create/invoke /webhooks/webhooks/inbound/siem/cef (external-integrations) |
| `POST` | /webhooks/webhooks/inbound/siem/events | `external_integrations_post_webhooks_webhooks_inbound_siem_events` | [stub] Create/invoke /webhooks/webhooks/inbound/siem/events (external-integrations) |
| `POST` | /webhooks/webhooks/inbound/siem/sentinel | `external_integrations_post_webhooks_webhooks_inbound_siem_sentinel` | [stub] Create/invoke /webhooks/webhooks/inbound/siem/sentinel (external-integrations) |
| `POST` | /webhooks/webhooks/inbound/siem/splunk | `external_integrations_post_webhooks_webhooks_inbound_siem_splunk` | [stub] Create/invoke /webhooks/webhooks/inbound/siem/splunk (external-integrations) |
| `POST` | /webhooks/webhooks/inbound/siem/syslog | `external_integrations_post_webhooks_webhooks_inbound_siem_syslog` | [stub] Create/invoke /webhooks/webhooks/inbound/siem/syslog (external-integrations) |
| `POST` | /webhooks/webhooks/inbound/slack/commands | `external_integrations_post_webhooks_webhooks_inbound_slack_commands` | [stub] Create/invoke /webhooks/webhooks/inbound/slack/commands (external-integrations) |
| `POST` | /webhooks/webhooks/inbound/slack/events | `external_integrations_post_webhooks_webhooks_inbound_slack_events` | [stub] Create/invoke /webhooks/webhooks/inbound/slack/events (external-integrations) |
| `POST` | /webhooks/webhooks/inbound/slack/interactions | `external_integrations_post_webhooks_webhooks_inbound_slack_interactions` | [stub] Create/invoke /webhooks/webhooks/inbound/slack/interactions (external-integrations) |

<a id="fabric"></a>

## fabric

Auto-generated tag for fabric route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `POST` | /fabric/fabric/approvals/inline-action | `fabric_post_fabric_fabric_approvals_inline_action` | [stub] Create/invoke /fabric/fabric/approvals/inline-action (fabric) |
| `GET` | /fabric/fabric/correlations | `fabric_get_fabric_fabric_correlations` | [stub] List/get /fabric/fabric/correlations (fabric) |
| `GET` | /fabric/fabric/snapshot | `fabric_get_fabric_fabric_snapshot` | [stub] List/get /fabric/fabric/snapshot (fabric) |
| `GET` | /fabric/fabric/stream | `fabric_get_fabric_fabric_stream` | [stub] List/get /fabric/fabric/stream (fabric) |

<a id="feeds"></a>

## feeds

Auto-generated tag for feeds route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /feeds/intelligence/anomalies | `feeds_get_feeds_intelligence_anomalies` | [stub] List/get /feeds/intelligence/anomalies (feeds) |
| `GET` | /feeds/intelligence/benchmarks | `feeds_get_feeds_intelligence_benchmarks` | [stub] List/get /feeds/intelligence/benchmarks (feeds) |
| `GET` | /feeds/intelligence/cultural-calendar | `feeds_get_feeds_intelligence_cultural_calendar` | [stub] List/get /feeds/intelligence/cultural-calendar (feeds) |
| `GET` | /feeds/intelligence/cves | `feeds_get_feeds_intelligence_cves` | [stub] List/get /feeds/intelligence/cves (feeds) |
| `GET` | /feeds/intelligence/ecosystem-health | `feeds_get_feeds_intelligence_ecosystem_health` | [stub] List/get /feeds/intelligence/ecosystem-health (feeds) |
| `GET` | /feeds/intelligence/geopolitical | `feeds_get_feeds_intelligence_geopolitical` | [stub] List/get /feeds/intelligence/geopolitical (feeds) |
| `GET` | /feeds/intelligence/maritime/chokepoints | `feeds_get_feeds_intelligence_maritime_chokepoints` | [stub] List/get /feeds/intelligence/maritime/chokepoints (feeds) |
| `GET` | /feeds/intelligence/maritime/sanctions | `feeds_get_feeds_intelligence_maritime_sanctions` | [stub] List/get /feeds/intelligence/maritime/sanctions (feeds) |
| `GET` | /feeds/intelligence/maritime/vessels | `feeds_get_feeds_intelligence_maritime_vessels` | [stub] List/get /feeds/intelligence/maritime/vessels (feeds) |
| `GET` | /feeds/intelligence/maritime/weather | `feeds_get_feeds_intelligence_maritime_weather` | [stub] List/get /feeds/intelligence/maritime/weather (feeds) |
| `GET` | /feeds/intelligence/news | `feeds_get_feeds_intelligence_news` | [stub] List/get /feeds/intelligence/news (feeds) |
| `GET` | /feeds/intelligence/ops-heatmap | `feeds_get_feeds_intelligence_ops_heatmap` | [stub] List/get /feeds/intelligence/ops-heatmap (feeds) |
| `GET` | /feeds/intelligence/platform-stats | `feeds_get_feeds_intelligence_platform_stats` | [stub] List/get /feeds/intelligence/platform-stats (feeds) |
| `GET` | /feeds/intelligence/tech-trends | `feeds_get_feeds_intelligence_tech_trends` | [stub] List/get /feeds/intelligence/tech-trends (feeds) |
| `GET` | /feeds/intelligence/threats | `feeds_get_feeds_intelligence_threats` | [stub] List/get /feeds/intelligence/threats (feeds) |

<a id="firestorm-cognitive"></a>

## firestorm-cognitive

Auto-generated tag for firestorm-cognitive route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /firestorm/firestorm/cognitive/attack-path-graph | `firestorm_cognitive_get_firestorm_firestorm_cognitive_attack_path_graph` | [stub] List/get /firestorm/firestorm/cognitive/attack-path-graph (firestorm-cognitive) |
| `GET` | /firestorm/firestorm/cognitive/business-impact-map | `firestorm_cognitive_get_firestorm_firestorm_cognitive_business_impact_map` | [stub] List/get /firestorm/firestorm/cognitive/business-impact-map (firestorm-cognitive) |
| `GET` | /firestorm/firestorm/cognitive/control-evidence-graph | `firestorm_cognitive_get_firestorm_firestorm_cognitive_control_evidence_graph` | [stub] List/get /firestorm/firestorm/cognitive/control-evidence-graph (firestorm-cognitive) |
| `GET` | /firestorm/firestorm/cognitive/identity-blast-radius | `firestorm_cognitive_get_firestorm_firestorm_cognitive_identity_blast_radius` | [stub] List/get /firestorm/firestorm/cognitive/identity-blast-radius (firestorm-cognitive) |
| `GET` | /firestorm/firestorm/cognitive/incident-proof-chain | `firestorm_cognitive_get_firestorm_firestorm_cognitive_incident_proof_chain` | [stub] List/get /firestorm/firestorm/cognitive/incident-proof-chain (firestorm-cognitive) |

<a id="firestorm-command-surfaces"></a>

## firestorm-command-surfaces

Auto-generated tag for firestorm-command-surfaces route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /firestorm/firestorm/command/decisions | `firestorm_command_surfaces_get_firestorm_firestorm_command_decisions` | [stub] List/get /firestorm/firestorm/command/decisions (firestorm-command-surfaces) |
| `POST` | /firestorm/firestorm/command/decisions/{id}/approve | `firestorm_command_surfaces_post_firestorm_firestorm_command_decisions_id_approve` | [stub] Create/invoke /firestorm/firestorm/command/decisions/{id}/approve (firestorm-command-surfaces) |
| `GET` | /firestorm/firestorm/command/executive/compliance | `firestorm_command_surfaces_get_firestorm_firestorm_command_executive_compliance` | [stub] List/get /firestorm/firestorm/command/executive/compliance (firestorm-command-surfaces) |
| `GET` | /firestorm/firestorm/command/executive/posture | `firestorm_command_surfaces_get_firestorm_firestorm_command_executive_posture` | [stub] List/get /firestorm/firestorm/command/executive/posture (firestorm-command-surfaces) |
| `GET` | /firestorm/firestorm/command/investigations | `firestorm_command_surfaces_get_firestorm_firestorm_command_investigations` | [stub] List/get /firestorm/firestorm/command/investigations (firestorm-command-surfaces) |
| `POST` | /firestorm/firestorm/command/investigations | `firestorm_command_surfaces_post_firestorm_firestorm_command_investigations` | [stub] Create/invoke /firestorm/firestorm/command/investigations (firestorm-command-surfaces) |
| `GET` | /firestorm/firestorm/command/posture | `firestorm_command_surfaces_get_firestorm_firestorm_command_posture` | [stub] List/get /firestorm/firestorm/command/posture (firestorm-command-surfaces) |
| `POST` | /firestorm/firestorm/command/response/contain | `firestorm_command_surfaces_post_firestorm_firestorm_command_response_contain` | [stub] Create/invoke /firestorm/firestorm/command/response/contain (firestorm-command-surfaces) |
| `POST` | /firestorm/firestorm/command/response/execute | `firestorm_command_surfaces_post_firestorm_firestorm_command_response_execute` | [stub] Create/invoke /firestorm/firestorm/command/response/execute (firestorm-command-surfaces) |
| `GET` | /firestorm/firestorm/command/response/playbooks | `firestorm_command_surfaces_get_firestorm_firestorm_command_response_playbooks` | [stub] List/get /firestorm/firestorm/command/response/playbooks (firestorm-command-surfaces) |
| `GET` | /firestorm/firestorm/tool-audit-log | `firestorm_command_surfaces_get_firestorm_firestorm_tool_audit_log` | [stub] List/get /firestorm/firestorm/tool-audit-log (firestorm-command-surfaces) |

<a id="firestorm-live"></a>

## firestorm-live

Auto-generated tag for firestorm-live route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /firestorm/firestorm/live/asset-risk | `firestorm_live_get_firestorm_firestorm_live_asset_risk` | [stub] List/get /firestorm/firestorm/live/asset-risk (firestorm-live) |
| `GET` | /firestorm/firestorm/live/compliance-summary | `firestorm_live_get_firestorm_firestorm_live_compliance_summary` | [stub] List/get /firestorm/firestorm/live/compliance-summary (firestorm-live) |
| `GET` | /firestorm/firestorm/live/incidents | `firestorm_live_get_firestorm_firestorm_live_incidents` | [stub] List/get /firestorm/firestorm/live/incidents (firestorm-live) |
| `GET` | /firestorm/firestorm/live/threat-summary | `firestorm_live_get_firestorm_firestorm_live_threat_summary` | [stub] List/get /firestorm/firestorm/live/threat-summary (firestorm-live) |
| `GET` | /firestorm/firestorm/live/threats | `firestorm_live_get_firestorm_firestorm_live_threats` | [stub] List/get /firestorm/firestorm/live/threats (firestorm-live) |
| `GET` | /firestorm/firestorm/mitre/coverage | `firestorm_live_get_firestorm_firestorm_mitre_coverage` | [stub] List/get /firestorm/firestorm/mitre/coverage (firestorm-live) |
| `POST` | /firestorm/firestorm/soar/execute | `firestorm_live_post_firestorm_firestorm_soar_execute` | [stub] Create/invoke /firestorm/firestorm/soar/execute (firestorm-live) |
| `GET` | /firestorm/firestorm/soar/playbooks | `firestorm_live_get_firestorm_firestorm_soar_playbooks` | [stub] List/get /firestorm/firestorm/soar/playbooks (firestorm-live) |
| `POST` | /firestorm/firestorm/stix/export | `firestorm_live_post_firestorm_firestorm_stix_export` | [stub] Create/invoke /firestorm/firestorm/stix/export (firestorm-live) |
| `GET` | /firestorm/firestorm/stix/objects | `firestorm_live_get_firestorm_firestorm_stix_objects` | [stub] List/get /firestorm/firestorm/stix/objects (firestorm-live) |
| `GET` | /firestorm/firestorm/taxii/feeds | `firestorm_live_get_firestorm_firestorm_taxii_feeds` | [stub] List/get /firestorm/firestorm/taxii/feeds (firestorm-live) |

<a id="flags"></a>

## flags

Auto-generated tag for flags route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /flags/admin/feature-flags | `flags_get_flags_admin_feature_flags` | [stub] List/get /flags/admin/feature-flags (flags) |
| `PUT` | /flags/admin/feature-flags/{key} | `flags_put_flags_admin_feature_flags_key` | [stub] Update /flags/admin/feature-flags/{key} (flags) |

<a id="forge"></a>

## forge

Auto-generated tag for forge route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /forge/forge/agents | `forge_get_forge_forge_agents` | [stub] List/get /forge/forge/agents (forge) |
| `POST` | /forge/forge/agents | `forge_post_forge_forge_agents` | [stub] Create/invoke /forge/forge/agents (forge) |
| `GET` | /forge/forge/agents/{id} | `forge_get_forge_forge_agents_id` | [stub] List/get /forge/forge/agents/{id} (forge) |
| `POST` | /forge/forge/agents/{id}/execute | `forge_post_forge_forge_agents_id_execute` | [stub] Create/invoke /forge/forge/agents/{id}/execute (forge) |
| `POST` | /forge/forge/agents/{id}/promote | `forge_post_forge_forge_agents_id_promote` | [stub] Create/invoke /forge/forge/agents/{id}/promote (forge) |
| `POST` | /forge/forge/agents/{id}/rollback | `forge_post_forge_forge_agents_id_rollback` | [stub] Create/invoke /forge/forge/agents/{id}/rollback (forge) |
| `GET` | /forge/forge/agents/{id}/versions | `forge_get_forge_forge_agents_id_versions` | [stub] List/get /forge/forge/agents/{id}/versions (forge) |
| `POST` | /forge/forge/agents/{id}/versions | `forge_post_forge_forge_agents_id_versions` | [stub] Create/invoke /forge/forge/agents/{id}/versions (forge) |
| `POST` | /forge/forge/drift/evaluate | `forge_post_forge_forge_drift_evaluate` | [stub] Create/invoke /forge/forge/drift/evaluate (forge) |
| `GET` | /forge/forge/drift/events | `forge_get_forge_forge_drift_events` | [stub] List/get /forge/forge/drift/events (forge) |
| `GET` | /forge/forge/drift/summary | `forge_get_forge_forge_drift_summary` | [stub] List/get /forge/forge/drift/summary (forge) |
| `GET` | /forge/forge/environments | `forge_get_forge_forge_environments` | [stub] List/get /forge/forge/environments (forge) |
| `GET` | /forge/forge/executions | `forge_get_forge_forge_executions` | [stub] List/get /forge/forge/executions (forge) |
| `GET` | /forge/forge/executions/{id} | `forge_get_forge_forge_executions_id` | [stub] List/get /forge/forge/executions/{id} (forge) |
| `GET` | /forge/forge/models | `forge_get_forge_forge_models` | [stub] List/get /forge/forge/models (forge) |
| `GET` | /forge/forge/overview | `forge_get_forge_forge_overview` | [stub] List/get /forge/forge/overview (forge) |
| `GET` | /forge/forge/policies | `forge_get_forge_forge_policies` | [stub] List/get /forge/forge/policies (forge) |
| `GET` | /forge/forge/promotions | `forge_get_forge_forge_promotions` | [stub] List/get /forge/forge/promotions (forge) |
| `POST` | /forge/forge/promotions/{id}/approve | `forge_post_forge_forge_promotions_id_approve` | [stub] Create/invoke /forge/forge/promotions/{id}/approve (forge) |
| `GET` | /forge/forge/prompts | `forge_get_forge_forge_prompts` | [stub] List/get /forge/forge/prompts (forge) |
| `GET` | /forge/forge/targets | `forge_get_forge_forge_targets` | [stub] List/get /forge/forge/targets (forge) |
| `GET` | /forge/forge/telemetry/summary | `forge_get_forge_forge_telemetry_summary` | [stub] List/get /forge/forge/telemetry/summary (forge) |
| `GET` | /forge/forge/tools | `forge_get_forge_forge_tools` | [stub] List/get /forge/forge/tools (forge) |

<a id="forge-runtime-api"></a>

## forge-runtime-api

Auto-generated tag for forge-runtime-api route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /forge/forge/evidence | `forge_runtime_api_get_forge_forge_evidence` | [stub] List/get /forge/forge/evidence (forge-runtime-api) |
| `GET` | /forge/forge/executions/{executionId} | `forge_runtime_api_get_forge_forge_executions_executionId` | [stub] List/get /forge/forge/executions/{executionId} (forge-runtime-api) |
| `POST` | /forge/forge/executions/{executionId}/approve | `forge_runtime_api_post_forge_forge_executions_executionId_approve` | [stub] Create/invoke /forge/forge/executions/{executionId}/approve (forge-runtime-api) |
| `GET` | /forge/forge/history | `forge_runtime_api_get_forge_forge_history` | [stub] List/get /forge/forge/history (forge-runtime-api) |
| `GET` | /forge/forge/status | `forge_runtime_api_get_forge_forge_status` | [stub] List/get /forge/forge/status (forge-runtime-api) |
| `POST` | /forge/forge/submit | `forge_runtime_api_post_forge_forge_submit` | [stub] Create/invoke /forge/forge/submit (forge-runtime-api) |
| `POST` | /forge/forge/tenant-policy | `forge_runtime_api_post_forge_forge_tenant_policy` | [stub] Create/invoke /forge/forge/tenant-policy (forge-runtime-api) |
| `GET` | /forge/forge/timeline | `forge_runtime_api_get_forge_forge_timeline` | [stub] List/get /forge/forge/timeline (forge-runtime-api) |

<a id="fund-inbound-deals"></a>

## fund-inbound-deals

Auto-generated tag for fund-inbound-deals route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /fund-inbound-deals/fund-inbound-deals | `fund_inbound_deals_get_fund_inbound_deals_fund_inbound_deals` | [stub] List/get /fund-inbound-deals/fund-inbound-deals (fund-inbound-deals) |
| `PATCH` | /fund-inbound-deals/fund-inbound-deals/{pipelineId} | `fund_inbound_deals_patch_fund_inbound_deals_fund_inbound_deals_pipelineId` | [stub] Patch /fund-inbound-deals/fund-inbound-deals/{pipelineId} (fund-inbound-deals) |
| `GET` | /fund-inbound-deals/fund-inbound-deals/{pipelineId}/attachments/{idx} | `fund_inbound_deals_get_fund_inbound_deals_fund_inbound_deals_pipelineId_attachments_idx` | [stub] List/get /fund-inbound-deals/fund-inbound-deals/{pipelineId}/attachments/{idx} (fund-inbound-deals) |
| `POST` | /fund-inbound-deals/public/fund-inbound-deals | `fund_inbound_deals_post_fund_inbound_deals_public_fund_inbound_deals` | [stub] Create/invoke /fund-inbound-deals/public/fund-inbound-deals (fund-inbound-deals) |
| `POST` | /fund-inbound-deals/public/fund-inbound-deals/upload | `fund_inbound_deals_post_fund_inbound_deals_public_fund_inbound_deals_upload` | [stub] Create/invoke /fund-inbound-deals/public/fund-inbound-deals/upload (fund-inbound-deals) |
| `GET` | /public/fund-inbound-deals/fund-inbound-deals | `fund_inbound_deals_get_public_fund_inbound_deals_fund_inbound_deals` | [stub] List/get /public/fund-inbound-deals/fund-inbound-deals (fund-inbound-deals) |
| `PATCH` | /public/fund-inbound-deals/fund-inbound-deals/{pipelineId} | `fund_inbound_deals_patch_public_fund_inbound_deals_fund_inbound_deals_pipelineId` | [stub] Patch /public/fund-inbound-deals/fund-inbound-deals/{pipelineId} (fund-inbound-deals) |
| `GET` | /public/fund-inbound-deals/fund-inbound-deals/{pipelineId}/attachments/{idx} | `fund_inbound_deals_get_public_fund_inbound_deals_fund_inbound_deals_pipelineId_attachments_idx` | [stub] List/get /public/fund-inbound-deals/fund-inbound-deals/{pipelineId}/attachments/{idx} (fund-inbound-deals) |
| `POST` | /public/fund-inbound-deals/public/fund-inbound-deals | `fund_inbound_deals_post_public_fund_inbound_deals_public_fund_inbound_deals` | [stub] Create/invoke /public/fund-inbound-deals/public/fund-inbound-deals (fund-inbound-deals) |
| `POST` | /public/fund-inbound-deals/public/fund-inbound-deals/upload | `fund_inbound_deals_post_public_fund_inbound_deals_public_fund_inbound_deals_upload` | [stub] Create/invoke /public/fund-inbound-deals/public/fund-inbound-deals/upload (fund-inbound-deals) |

<a id="fund-ops"></a>

## fund-ops

Auto-generated tag for fund-ops route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /fund-ops/fund-ops/accredited-investors | `fund_ops_get_fund_ops_fund_ops_accredited_investors` | [stub] List/get /fund-ops/fund-ops/accredited-investors (fund-ops) |
| `POST` | /fund-ops/fund-ops/accredited-investors | `fund_ops_post_fund_ops_fund_ops_accredited_investors` | [stub] Create/invoke /fund-ops/fund-ops/accredited-investors (fund-ops) |
| `GET` | /fund-ops/fund-ops/accredited-investors/{id} | `fund_ops_get_fund_ops_fund_ops_accredited_investors_id` | [stub] List/get /fund-ops/fund-ops/accredited-investors/{id} (fund-ops) |
| `PATCH` | /fund-ops/fund-ops/accredited-investors/{id} | `fund_ops_patch_fund_ops_fund_ops_accredited_investors_id` | [stub] Patch /fund-ops/fund-ops/accredited-investors/{id} (fund-ops) |
| `GET` | /fund-ops/fund-ops/audit-log | `fund_ops_get_fund_ops_fund_ops_audit_log` | [stub] List/get /fund-ops/fund-ops/audit-log (fund-ops) |
| `GET` | /fund-ops/fund-ops/cap-table-holders | `fund_ops_get_fund_ops_fund_ops_cap_table_holders` | [stub] List/get /fund-ops/fund-ops/cap-table-holders (fund-ops) |
| `POST` | /fund-ops/fund-ops/cap-table-holders | `fund_ops_post_fund_ops_fund_ops_cap_table_holders` | [stub] Create/invoke /fund-ops/fund-ops/cap-table-holders (fund-ops) |
| `PATCH` | /fund-ops/fund-ops/cap-table-holders/{id} | `fund_ops_patch_fund_ops_fund_ops_cap_table_holders_id` | [stub] Patch /fund-ops/fund-ops/cap-table-holders/{id} (fund-ops) |
| `GET` | /fund-ops/fund-ops/cap-table-summary | `fund_ops_get_fund_ops_fund_ops_cap_table_summary` | [stub] List/get /fund-ops/fund-ops/cap-table-summary (fund-ops) |
| `GET` | /fund-ops/fund-ops/cap-table-transactions | `fund_ops_get_fund_ops_fund_ops_cap_table_transactions` | [stub] List/get /fund-ops/fund-ops/cap-table-transactions (fund-ops) |
| `POST` | /fund-ops/fund-ops/cap-table-transactions | `fund_ops_post_fund_ops_fund_ops_cap_table_transactions` | [stub] Create/invoke /fund-ops/fund-ops/cap-table-transactions (fund-ops) |
| `POST` | /fund-ops/fund-ops/capital-call-lines | `fund_ops_post_fund_ops_fund_ops_capital_call_lines` | [stub] Create/invoke /fund-ops/fund-ops/capital-call-lines (fund-ops) |
| `PATCH` | /fund-ops/fund-ops/capital-call-lines/{id} | `fund_ops_patch_fund_ops_fund_ops_capital_call_lines_id` | [stub] Patch /fund-ops/fund-ops/capital-call-lines/{id} (fund-ops) |
| `GET` | /fund-ops/fund-ops/capital-calls | `fund_ops_get_fund_ops_fund_ops_capital_calls` | [stub] List/get /fund-ops/fund-ops/capital-calls (fund-ops) |
| `POST` | /fund-ops/fund-ops/capital-calls | `fund_ops_post_fund_ops_fund_ops_capital_calls` | [stub] Create/invoke /fund-ops/fund-ops/capital-calls (fund-ops) |
| `GET` | /fund-ops/fund-ops/capital-calls/{id} | `fund_ops_get_fund_ops_fund_ops_capital_calls_id` | [stub] List/get /fund-ops/fund-ops/capital-calls/{id} (fund-ops) |
| `PATCH` | /fund-ops/fund-ops/capital-calls/{id} | `fund_ops_patch_fund_ops_fund_ops_capital_calls_id` | [stub] Patch /fund-ops/fund-ops/capital-calls/{id} (fund-ops) |
| `GET` | /fund-ops/fund-ops/distributions | `fund_ops_get_fund_ops_fund_ops_distributions` | [stub] List/get /fund-ops/fund-ops/distributions (fund-ops) |
| `POST` | /fund-ops/fund-ops/distributions | `fund_ops_post_fund_ops_fund_ops_distributions` | [stub] Create/invoke /fund-ops/fund-ops/distributions (fund-ops) |
| `GET` | /fund-ops/fund-ops/distributions/{id} | `fund_ops_get_fund_ops_fund_ops_distributions_id` | [stub] List/get /fund-ops/fund-ops/distributions/{id} (fund-ops) |
| `PATCH` | /fund-ops/fund-ops/distributions/{id} | `fund_ops_patch_fund_ops_fund_ops_distributions_id` | [stub] Patch /fund-ops/fund-ops/distributions/{id} (fund-ops) |
| `GET` | /fund-ops/fund-ops/form-d-filings | `fund_ops_get_fund_ops_fund_ops_form_d_filings` | [stub] List/get /fund-ops/fund-ops/form-d-filings (fund-ops) |
| `POST` | /fund-ops/fund-ops/form-d-filings | `fund_ops_post_fund_ops_fund_ops_form_d_filings` | [stub] Create/invoke /fund-ops/fund-ops/form-d-filings (fund-ops) |
| `PATCH` | /fund-ops/fund-ops/form-d-filings/{id} | `fund_ops_patch_fund_ops_fund_ops_form_d_filings_id` | [stub] Patch /fund-ops/fund-ops/form-d-filings/{id} (fund-ops) |
| `DELETE` | /fund-ops/fund-ops/form-d-filings/{id} | `fund_ops_delete_fund_ops_fund_ops_form_d_filings_id` | [stub] Delete /fund-ops/fund-ops/form-d-filings/{id} (fund-ops) |
| `GET` | /fund-ops/fund-ops/lp-capital-accounts | `fund_ops_get_fund_ops_fund_ops_lp_capital_accounts` | [stub] List/get /fund-ops/fund-ops/lp-capital-accounts (fund-ops) |
| `POST` | /fund-ops/fund-ops/lp-capital-accounts | `fund_ops_post_fund_ops_fund_ops_lp_capital_accounts` | [stub] Create/invoke /fund-ops/fund-ops/lp-capital-accounts (fund-ops) |
| `PATCH` | /fund-ops/fund-ops/lp-capital-accounts/{id} | `fund_ops_patch_fund_ops_fund_ops_lp_capital_accounts_id` | [stub] Patch /fund-ops/fund-ops/lp-capital-accounts/{id} (fund-ops) |
| `GET` | /fund-ops/fund-ops/lp-reports | `fund_ops_get_fund_ops_fund_ops_lp_reports` | [stub] List/get /fund-ops/fund-ops/lp-reports (fund-ops) |
| `POST` | /fund-ops/fund-ops/lp-reports | `fund_ops_post_fund_ops_fund_ops_lp_reports` | [stub] Create/invoke /fund-ops/fund-ops/lp-reports (fund-ops) |
| `GET` | /fund-ops/fund-ops/lp-reports/{id} | `fund_ops_get_fund_ops_fund_ops_lp_reports_id` | [stub] List/get /fund-ops/fund-ops/lp-reports/{id} (fund-ops) |
| `PATCH` | /fund-ops/fund-ops/lp-reports/{id} | `fund_ops_patch_fund_ops_fund_ops_lp_reports_id` | [stub] Patch /fund-ops/fund-ops/lp-reports/{id} (fund-ops) |
| `GET` | /fund-ops/fund-ops/nav-records | `fund_ops_get_fund_ops_fund_ops_nav_records` | [stub] List/get /fund-ops/fund-ops/nav-records (fund-ops) |
| `POST` | /fund-ops/fund-ops/nav-records | `fund_ops_post_fund_ops_fund_ops_nav_records` | [stub] Create/invoke /fund-ops/fund-ops/nav-records (fund-ops) |
| `GET` | /fund-ops/fund-ops/portfolio-aggregate | `fund_ops_get_fund_ops_fund_ops_portfolio_aggregate` | [stub] List/get /fund-ops/fund-ops/portfolio-aggregate (fund-ops) |
| `GET` | /fund-ops/fund-ops/portfolio-financials | `fund_ops_get_fund_ops_fund_ops_portfolio_financials` | [stub] List/get /fund-ops/fund-ops/portfolio-financials (fund-ops) |
| `POST` | /fund-ops/fund-ops/portfolio-financials | `fund_ops_post_fund_ops_fund_ops_portfolio_financials` | [stub] Create/invoke /fund-ops/fund-ops/portfolio-financials (fund-ops) |
| `GET` | /fund-ops/fund-ops/portfolio-financials/{id} | `fund_ops_get_fund_ops_fund_ops_portfolio_financials_id` | [stub] List/get /fund-ops/fund-ops/portfolio-financials/{id} (fund-ops) |
| `PATCH` | /fund-ops/fund-ops/portfolio-financials/{id} | `fund_ops_patch_fund_ops_fund_ops_portfolio_financials_id` | [stub] Patch /fund-ops/fund-ops/portfolio-financials/{id} (fund-ops) |
| `DELETE` | /fund-ops/fund-ops/portfolio-financials/{id} | `fund_ops_delete_fund_ops_fund_ops_portfolio_financials_id` | [stub] Delete /fund-ops/fund-ops/portfolio-financials/{id} (fund-ops) |
| `GET` | /fund-ops/fund-ops/portfolio-kpis | `fund_ops_get_fund_ops_fund_ops_portfolio_kpis` | [stub] List/get /fund-ops/fund-ops/portfolio-kpis (fund-ops) |
| `POST` | /fund-ops/fund-ops/portfolio-kpis | `fund_ops_post_fund_ops_fund_ops_portfolio_kpis` | [stub] Create/invoke /fund-ops/fund-ops/portfolio-kpis (fund-ops) |
| `PATCH` | /fund-ops/fund-ops/portfolio-kpis/{id} | `fund_ops_patch_fund_ops_fund_ops_portfolio_kpis_id` | [stub] Patch /fund-ops/fund-ops/portfolio-kpis/{id} (fund-ops) |
| `DELETE` | /fund-ops/fund-ops/portfolio-kpis/{id} | `fund_ops_delete_fund_ops_fund_ops_portfolio_kpis_id` | [stub] Delete /fund-ops/fund-ops/portfolio-kpis/{id} (fund-ops) |
| `GET` | /fund-ops/fund-ops/share-classes | `fund_ops_get_fund_ops_fund_ops_share_classes` | [stub] List/get /fund-ops/fund-ops/share-classes (fund-ops) |
| `POST` | /fund-ops/fund-ops/share-classes | `fund_ops_post_fund_ops_fund_ops_share_classes` | [stub] Create/invoke /fund-ops/fund-ops/share-classes (fund-ops) |
| `PATCH` | /fund-ops/fund-ops/share-classes/{id} | `fund_ops_patch_fund_ops_fund_ops_share_classes_id` | [stub] Patch /fund-ops/fund-ops/share-classes/{id} (fund-ops) |
| `GET` | /fund-ops/fund-ops/summary | `fund_ops_get_fund_ops_fund_ops_summary` | [stub] List/get /fund-ops/fund-ops/summary (fund-ops) |
| `GET` | /fund-ops/fund-ops/vesting-schedules | `fund_ops_get_fund_ops_fund_ops_vesting_schedules` | [stub] List/get /fund-ops/fund-ops/vesting-schedules (fund-ops) |
| `POST` | /fund-ops/fund-ops/vesting-schedules | `fund_ops_post_fund_ops_fund_ops_vesting_schedules` | [stub] Create/invoke /fund-ops/fund-ops/vesting-schedules (fund-ops) |
| `PATCH` | /fund-ops/fund-ops/vesting-schedules/{id} | `fund_ops_patch_fund_ops_fund_ops_vesting_schedules_id` | [stub] Patch /fund-ops/fund-ops/vesting-schedules/{id} (fund-ops) |

<a id="funnel"></a>

## funnel

Auto-generated tag for funnel route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /funnel/admin/analytics/funnel | `funnel_get_funnel_admin_analytics_funnel` | [stub] List/get /funnel/admin/analytics/funnel (funnel) |

<a id="fusion"></a>

## fusion

Auto-generated tag for fusion route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /fusion/fusion/alerts | `fusion_get_fusion_fusion_alerts` | [stub] List/get /fusion/fusion/alerts (fusion) |
| `POST` | /fusion/fusion/alerts/{alertId}/feedback | `fusion_post_fusion_fusion_alerts_alertId_feedback` | [stub] Create/invoke /fusion/fusion/alerts/{alertId}/feedback (fusion) |
| `POST` | /fusion/fusion/alerts/{id}/acknowledge | `fusion_post_fusion_fusion_alerts_id_acknowledge` | [stub] Create/invoke /fusion/fusion/alerts/{id}/acknowledge (fusion) |
| `POST` | /fusion/fusion/alerts/{id}/resolve | `fusion_post_fusion_fusion_alerts_id_resolve` | [stub] Create/invoke /fusion/fusion/alerts/{id}/resolve (fusion) |
| `POST` | /fusion/fusion/alerts/inject | `fusion_post_fusion_fusion_alerts_inject` | [stub] Create/invoke /fusion/fusion/alerts/inject (fusion) |
| `POST` | /fusion/fusion/demo/seed | `fusion_post_fusion_fusion_demo_seed` | [stub] Create/invoke /fusion/fusion/demo/seed (fusion) |
| `GET` | /fusion/fusion/patterns | `fusion_get_fusion_fusion_patterns` | [stub] List/get /fusion/fusion/patterns (fusion) |
| `GET` | /fusion/fusion/patterns/{id} | `fusion_get_fusion_fusion_patterns_id` | [stub] List/get /fusion/fusion/patterns/{id} (fusion) |
| `POST` | /fusion/fusion/patterns/{id}/feedback | `fusion_post_fusion_fusion_patterns_id_feedback` | [stub] Create/invoke /fusion/fusion/patterns/{id}/feedback (fusion) |
| `POST` | /fusion/fusion/patterns/custom | `fusion_post_fusion_fusion_patterns_custom` | [stub] Create/invoke /fusion/fusion/patterns/custom (fusion) |
| `GET` | /fusion/fusion/predictive/alerts | `fusion_get_fusion_fusion_predictive_alerts` | [stub] List/get /fusion/fusion/predictive/alerts (fusion) |
| `POST` | /fusion/fusion/predictive/alerts/{id}/resolve | `fusion_post_fusion_fusion_predictive_alerts_id_resolve` | [stub] Create/invoke /fusion/fusion/predictive/alerts/{id}/resolve (fusion) |
| `POST` | /fusion/fusion/predictive/generate | `fusion_post_fusion_fusion_predictive_generate` | [stub] Create/invoke /fusion/fusion/predictive/generate (fusion) |
| `POST` | /fusion/fusion/predictive/project | `fusion_post_fusion_fusion_predictive_project` | [stub] Create/invoke /fusion/fusion/predictive/project (fusion) |
| `POST` | /fusion/fusion/scan | `fusion_post_fusion_fusion_scan` | [stub] Create/invoke /fusion/fusion/scan (fusion) |
| `POST` | /fusion/fusion/start-continuous | `fusion_post_fusion_fusion_start_continuous` | [stub] Create/invoke /fusion/fusion/start-continuous (fusion) |
| `GET` | /fusion/fusion/stats | `fusion_get_fusion_fusion_stats` | [stub] List/get /fusion/fusion/stats (fusion) |
| `POST` | /fusion/fusion/stop-continuous | `fusion_post_fusion_fusion_stop_continuous` | [stub] Create/invoke /fusion/fusion/stop-continuous (fusion) |

<a id="gdpr"></a>

## gdpr

Auto-generated tag for gdpr route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /gdpr/gdpr/data-processing-records | `gdpr_get_gdpr_gdpr_data_processing_records` | [stub] List/get /gdpr/gdpr/data-processing-records (gdpr) |
| `POST` | /gdpr/gdpr/erasure | `gdpr_post_gdpr_gdpr_erasure` | [stub] Create/invoke /gdpr/gdpr/erasure (gdpr) |
| `GET` | /gdpr/gdpr/export | `gdpr_get_gdpr_gdpr_export` | [stub] List/get /gdpr/gdpr/export (gdpr) |

<a id="genai-telemetry"></a>

## genai-telemetry

Auto-generated tag for genai-telemetry route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /genai-telemetry/genai-telemetry/dashboard/{appSlug} | `genai_telemetry_get_genai_telemetry_genai_telemetry_dashboard_appSlug` | [stub] List/get /genai-telemetry/genai-telemetry/dashboard/{appSlug} (genai-telemetry) |
| `GET` | /genai-telemetry/genai-telemetry/langfuse/{traceId} | `genai_telemetry_get_genai_telemetry_genai_telemetry_langfuse_traceId` | [stub] List/get /genai-telemetry/genai-telemetry/langfuse/{traceId} (genai-telemetry) |
| `GET` | /genai-telemetry/genai-telemetry/snapshot | `genai_telemetry_get_genai_telemetry_genai_telemetry_snapshot` | [stub] List/get /genai-telemetry/genai-telemetry/snapshot (genai-telemetry) |
| `GET` | /genai-telemetry/genai-telemetry/spans | `genai_telemetry_get_genai_telemetry_genai_telemetry_spans` | [stub] List/get /genai-telemetry/genai-telemetry/spans (genai-telemetry) |
| `POST` | /genai-telemetry/genai-telemetry/spans | `genai_telemetry_post_genai_telemetry_genai_telemetry_spans` | [stub] Create/invoke /genai-telemetry/genai-telemetry/spans (genai-telemetry) |
| `POST` | /genai-telemetry/genai-telemetry/spans/batch | `genai_telemetry_post_genai_telemetry_genai_telemetry_spans_batch` | [stub] Create/invoke /genai-telemetry/genai-telemetry/spans/batch (genai-telemetry) |
| `GET` | /genai-telemetry/genai-telemetry/trace/{traceId} | `genai_telemetry_get_genai_telemetry_genai_telemetry_trace_traceId` | [stub] List/get /genai-telemetry/genai-telemetry/trace/{traceId} (genai-telemetry) |

<a id="geo-intel"></a>

## geo-intel

Auto-generated tag for geo-intel route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /geo-intel/geo-intel/meta | `geo_intel_get_geo_intel_geo_intel_meta` | [stub] List/get /geo-intel/geo-intel/meta (geo-intel) |
| `GET` | /geo-intel/geo-intel/pins | `geo_intel_get_geo_intel_geo_intel_pins` | [stub] List/get /geo-intel/geo-intel/pins (geo-intel) |

<a id="gov-data"></a>

## gov-data

Auto-generated tag for gov-data route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /gov/gov/arxiv | `gov_data_get_gov_gov_arxiv` | [stub] List/get /gov/gov/arxiv (gov-data) |
| `GET` | /gov/gov/bls-employment | `gov_data_get_gov_gov_bls_employment` | [stub] List/get /gov/gov/bls-employment (gov-data) |
| `GET` | /gov/gov/census | `gov_data_get_gov_gov_census` | [stub] List/get /gov/gov/census (gov-data) |
| `GET` | /gov/gov/cisa-kev | `gov_data_get_gov_gov_cisa_kev` | [stub] List/get /gov/gov/cisa-kev (gov-data) |
| `GET` | /gov/gov/fedramp | `gov_data_get_gov_gov_fedramp` | [stub] List/get /gov/gov/fedramp (gov-data) |
| `GET` | /gov/gov/fema-risk | `gov_data_get_gov_gov_fema_risk` | [stub] List/get /gov/gov/fema-risk (gov-data) |
| `GET` | /gov/gov/mitre-attack | `gov_data_get_gov_gov_mitre_attack` | [stub] List/get /gov/gov/mitre-attack (gov-data) |
| `GET` | /gov/gov/noaa-marine | `gov_data_get_gov_gov_noaa_marine` | [stub] List/get /gov/gov/noaa-marine (gov-data) |
| `GET` | /gov/gov/nvd-cves | `gov_data_get_gov_gov_nvd_cves` | [stub] List/get /gov/gov/nvd-cves (gov-data) |
| `GET` | /gov/gov/pubmed | `gov_data_get_gov_gov_pubmed` | [stub] List/get /gov/gov/pubmed (gov-data) |
| `GET` | /gov/gov/sec-edgar | `gov_data_get_gov_gov_sec_edgar` | [stub] List/get /gov/gov/sec-edgar (gov-data) |
| `GET` | /gov/gov/summary | `gov_data_get_gov_gov_summary` | [stub] List/get /gov/gov/summary (gov-data) |
| `GET` | /gov/gov/usaspending | `gov_data_get_gov_gov_usaspending` | [stub] List/get /gov/gov/usaspending (gov-data) |

<a id="govern-evolve"></a>

## govern-evolve

Auto-generated tag for govern-evolve route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /govern-evolve/control-tower/evolve/metrics | `govern_evolve_get_govern_evolve_control_tower_evolve_metrics` | [stub] List/get /govern-evolve/control-tower/evolve/metrics (govern-evolve) |
| `POST` | /govern-evolve/control-tower/evolve/propose | `govern_evolve_post_govern_evolve_control_tower_evolve_propose` | [stub] Create/invoke /govern-evolve/control-tower/evolve/propose (govern-evolve) |
| `PATCH` | /govern-evolve/control-tower/evolve/propose/{proposalId} | `govern_evolve_patch_govern_evolve_control_tower_evolve_propose_proposalId` | [stub] Patch /govern-evolve/control-tower/evolve/propose/{proposalId} (govern-evolve) |
| `GET` | /govern-evolve/control-tower/govern/audit | `govern_evolve_get_govern_evolve_control_tower_govern_audit` | [stub] List/get /govern-evolve/control-tower/govern/audit (govern-evolve) |
| `GET` | /govern-evolve/control-tower/govern/certificates | `govern_evolve_get_govern_evolve_control_tower_govern_certificates` | [stub] List/get /govern-evolve/control-tower/govern/certificates (govern-evolve) |
| `GET` | /govern-evolve/control-tower/govern/compliance | `govern_evolve_get_govern_evolve_control_tower_govern_compliance` | [stub] List/get /govern-evolve/control-tower/govern/compliance (govern-evolve) |
| `POST` | /govern-evolve/control-tower/govern/evaluate | `govern_evolve_post_govern_evolve_control_tower_govern_evaluate` | [stub] Create/invoke /govern-evolve/control-tower/govern/evaluate (govern-evolve) |
| `GET` | /govern-evolve/control-tower/search | `govern_evolve_get_govern_evolve_control_tower_search` | [stub] List/get /govern-evolve/control-tower/search (govern-evolve) |
| `GET` | /govern-evolve/control-tower/status | `govern_evolve_get_govern_evolve_control_tower_status` | [stub] List/get /govern-evolve/control-tower/status (govern-evolve) |

<a id="governance"></a>

## governance

Auto-generated tag for governance route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /ai-safety/analytics | `governance_get_ai_safety_analytics` | [stub] List/get /ai-safety/analytics (governance) |
| `GET` | /ai-safety/budgets | `governance_get_ai_safety_budgets` | [stub] List/get /ai-safety/budgets (governance) |
| `POST` | /ai-safety/budgets | `governance_post_ai_safety_budgets` | [stub] Create/invoke /ai-safety/budgets (governance) |
| `GET` | /ai-safety/cost-events | `governance_get_ai_safety_cost_events` | [stub] List/get /ai-safety/cost-events (governance) |
| `POST` | /ai-safety/cost-events | `governance_post_ai_safety_cost_events` | [stub] Create/invoke /ai-safety/cost-events (governance) |
| `GET` | /ai-safety/cost-summary | `governance_get_ai_safety_cost_summary` | [stub] List/get /ai-safety/cost-summary (governance) |
| `GET` | /ai-safety/incidents | `governance_get_ai_safety_incidents` | [stub] List/get /ai-safety/incidents (governance) |
| `POST` | /ai-safety/incidents | `governance_post_ai_safety_incidents` | [stub] Create/invoke /ai-safety/incidents (governance) |
| `PATCH` | /ai-safety/incidents/{id}/resolve | `governance_patch_ai_safety_incidents_id_resolve` | [stub] Patch /ai-safety/incidents/{id}/resolve (governance) |
| `GET` | /ai-safety/model-routing | `governance_get_ai_safety_model_routing` | [stub] List/get /ai-safety/model-routing (governance) |
| `POST` | /ai-safety/model-routing | `governance_post_ai_safety_model_routing` | [stub] Create/invoke /ai-safety/model-routing (governance) |
| `PATCH` | /ai-safety/model-routing/{id} | `governance_patch_ai_safety_model_routing_id` | [stub] Patch /ai-safety/model-routing/{id} (governance) |
| `GET` | /ai-safety/policies | `governance_get_ai_safety_policies` | [stub] List/get /ai-safety/policies (governance) |
| `POST` | /ai-safety/policies | `governance_post_ai_safety_policies` | [stub] Create/invoke /ai-safety/policies (governance) |
| `GET` | /ai-safety/policies/{id} | `governance_get_ai_safety_policies_id` | [stub] List/get /ai-safety/policies/{id} (governance) |
| `PATCH` | /ai-safety/policies/{id} | `governance_patch_ai_safety_policies_id` | [stub] Patch /ai-safety/policies/{id} (governance) |
| `DELETE` | /ai-safety/policies/{id} | `governance_delete_ai_safety_policies_id` | [stub] Delete /ai-safety/policies/{id} (governance) |

<a id="governance-counts"></a>

## governance-counts

Auto-generated tag for governance-counts route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /governance/pending | `governance_counts_get_governance_pending` | [stub] List/get /governance/pending (governance-counts) |

<a id="graph"></a>

## graph

Auto-generated tag for graph route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /graph/graph/entities | `graph_get_graph_graph_entities` | [stub] List/get /graph/graph/entities (graph) |
| `GET` | /graph/graph/entities/{fromId}/path/{toId} | `graph_get_graph_graph_entities_fromId_path_toId` | [stub] List/get /graph/graph/entities/{fromId}/path/{toId} (graph) |
| `GET` | /graph/graph/entities/{id} | `graph_get_graph_graph_entities_id` | [stub] List/get /graph/graph/entities/{id} (graph) |
| `GET` | /graph/graph/entities/{id}/neighbors | `graph_get_graph_graph_entities_id_neighbors` | [stub] List/get /graph/graph/entities/{id}/neighbors (graph) |
| `GET` | /graph/graph/entities/{id}/subgraph | `graph_get_graph_graph_entities_id_subgraph` | [stub] List/get /graph/graph/entities/{id}/subgraph (graph) |
| `GET` | /graph/graph/entities/{id}/subgraph/export | `graph_get_graph_graph_entities_id_subgraph_export` | [stub] List/get /graph/graph/entities/{id}/subgraph/export (graph) |
| `GET` | /graph/graph/relationships | `graph_get_graph_graph_relationships` | [stub] List/get /graph/graph/relationships (graph) |
| `GET` | /graph/graph/search | `graph_get_graph_graph_search` | [stub] List/get /graph/graph/search (graph) |

<a id="graph-stream"></a>

## graph-stream

Auto-generated tag for graph-stream route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /graph/stream/graph/stream | `graph_stream_get_graph_stream_graph_stream` | [stub] List/get /graph/stream/graph/stream (graph-stream) |

<a id="growth"></a>

## growth

Auto-generated tag for growth route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /growth/admin/inquiries | `growth_get_growth_admin_inquiries` | [stub] List/get /growth/admin/inquiries (growth) |

<a id="guardian"></a>

## guardian

Auto-generated tag for guardian route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /actions/actions/{id} | `guardian_get_actions_actions_id` | [stub] List/get /actions/actions/{id} (guardian) |
| `POST` | /actions/actions/{id}/approve | `guardian_post_actions_actions_id_approve` | [stub] Create/invoke /actions/actions/{id}/approve (guardian) |
| `POST` | /actions/actions/{id}/reject | `guardian_post_actions_actions_id_reject` | [stub] Create/invoke /actions/actions/{id}/reject (guardian) |
| `GET` | /actions/approvals | `guardian_get_actions_approvals` | [stub] List/get /actions/approvals (guardian) |
| `GET` | /actions/approvals/{requestId} | `guardian_get_actions_approvals_requestId` | [stub] List/get /actions/approvals/{requestId} (guardian) |
| `POST` | /actions/approvals/{requestId}/review | `guardian_post_actions_approvals_requestId_review` | [stub] Create/invoke /actions/approvals/{requestId}/review (guardian) |
| `GET` | /actions/audit/policy-decisions | `guardian_get_actions_audit_policy_decisions` | [stub] List/get /actions/audit/policy-decisions (guardian) |
| `GET` | /actions/decisions/summary | `guardian_get_actions_decisions_summary` | [stub] List/get /actions/decisions/summary (guardian) |
| `POST` | /actions/guardian/decide | `guardian_post_actions_guardian_decide` | [stub] Create/invoke /actions/guardian/decide (guardian) |
| `POST` | /actions/guardian/evaluate | `guardian_post_actions_guardian_evaluate` | [stub] Create/invoke /actions/guardian/evaluate (guardian) |
| `GET` | /actions/guardrail-configs | `guardian_get_actions_guardrail_configs` | [stub] List/get /actions/guardrail-configs (guardian) |
| `POST` | /actions/guardrail-configs | `guardian_post_actions_guardrail_configs` | [stub] Create/invoke /actions/guardrail-configs (guardian) |
| `GET` | /actions/guardrail-configs/{id} | `guardian_get_actions_guardrail_configs_id` | [stub] List/get /actions/guardrail-configs/{id} (guardian) |
| `PATCH` | /actions/guardrail-configs/{id} | `guardian_patch_actions_guardrail_configs_id` | [stub] Patch /actions/guardrail-configs/{id} (guardian) |
| `DELETE` | /actions/guardrail-configs/{id} | `guardian_delete_actions_guardrail_configs_id` | [stub] Delete /actions/guardrail-configs/{id} (guardian) |
| `GET` | /actions/ledger | `guardian_get_actions_ledger` | [stub] List/get /actions/ledger (guardian) |
| `GET` | /actions/ledger/stream | `guardian_get_actions_ledger_stream` | [stub] List/get /actions/ledger/stream (guardian) |
| `GET` | /actions/policies | `guardian_get_actions_policies` | [stub] List/get /actions/policies (guardian) |
| `POST` | /actions/policies | `guardian_post_actions_policies` | [stub] Create/invoke /actions/policies (guardian) |
| `GET` | /actions/policies/{id} | `guardian_get_actions_policies_id` | [stub] List/get /actions/policies/{id} (guardian) |
| `PATCH` | /actions/policies/{id} | `guardian_patch_actions_policies_id` | [stub] Patch /actions/policies/{id} (guardian) |
| `DELETE` | /actions/policies/{id} | `guardian_delete_actions_policies_id` | [stub] Delete /actions/policies/{id} (guardian) |
| `GET` | /actions/policies/{id}/assignments | `guardian_get_actions_policies_id_assignments` | [stub] List/get /actions/policies/{id}/assignments (guardian) |
| `POST` | /actions/policies/{id}/assignments | `guardian_post_actions_policies_id_assignments` | [stub] Create/invoke /actions/policies/{id}/assignments (guardian) |
| `DELETE` | /actions/policies/{id}/assignments/{assignmentId} | `guardian_delete_actions_policies_id_assignments_assignmentId` | [stub] Delete /actions/policies/{id}/assignments/{assignmentId} (guardian) |
| `GET` | /actions/policies/{id}/audit | `guardian_get_actions_policies_id_audit` | [stub] List/get /actions/policies/{id}/audit (guardian) |
| `GET` | /actions/policies/tiers | `guardian_get_actions_policies_tiers` | [stub] List/get /actions/policies/tiers (guardian) |
| `PATCH` | /actions/policies/tiers/{tier} | `guardian_patch_actions_policies_tiers_tier` | [stub] Patch /actions/policies/tiers/{tier} (guardian) |
| `GET` | /actions/rollback-events | `guardian_get_actions_rollback_events` | [stub] List/get /actions/rollback-events (guardian) |
| `POST` | /actions/rollback-events | `guardian_post_actions_rollback_events` | [stub] Create/invoke /actions/rollback-events (guardian) |
| `GET` | /actions/rollback-events/{id} | `guardian_get_actions_rollback_events_id` | [stub] List/get /actions/rollback-events/{id} (guardian) |
| `PATCH` | /actions/rollback-events/{id}/status | `guardian_patch_actions_rollback_events_id_status` | [stub] Patch /actions/rollback-events/{id}/status (guardian) |
| `POST` | /actions/tool-approvals | `guardian_post_actions_tool_approvals` | [stub] Create/invoke /actions/tool-approvals (guardian) |
| `POST` | /actions/tool-approvals/{id}/approve | `guardian_post_actions_tool_approvals_id_approve` | [stub] Create/invoke /actions/tool-approvals/{id}/approve (guardian) |
| `POST` | /actions/tool-approvals/{id}/reject | `guardian_post_actions_tool_approvals_id_reject` | [stub] Create/invoke /actions/tool-approvals/{id}/reject (guardian) |
| `GET` | /actions/tools | `guardian_get_actions_tools` | [stub] List/get /actions/tools (guardian) |
| `POST` | /actions/tools | `guardian_post_actions_tools` | [stub] Create/invoke /actions/tools (guardian) |
| `GET` | /actions/tools/{toolId} | `guardian_get_actions_tools_toolId` | [stub] List/get /actions/tools/{toolId} (guardian) |
| `PATCH` | /actions/tools/{toolId} | `guardian_patch_actions_tools_toolId` | [stub] Patch /actions/tools/{toolId} (guardian) |
| `GET` | /actions/tools/{toolId}/audit | `guardian_get_actions_tools_toolId_audit` | [stub] List/get /actions/tools/{toolId}/audit (guardian) |
| `GET` | /actions/tools/{toolId}/permissions | `guardian_get_actions_tools_toolId_permissions` | [stub] List/get /actions/tools/{toolId}/permissions (guardian) |
| `POST` | /actions/tools/{toolId}/permissions | `guardian_post_actions_tools_toolId_permissions` | [stub] Create/invoke /actions/tools/{toolId}/permissions (guardian) |
| `DELETE` | /actions/tools/{toolId}/permissions/{permissionId} | `guardian_delete_actions_tools_toolId_permissions_permissionId` | [stub] Delete /actions/tools/{toolId}/permissions/{permissionId} (guardian) |
| `GET` | /actions/tools/{toolId}/versions | `guardian_get_actions_tools_toolId_versions` | [stub] List/get /actions/tools/{toolId}/versions (guardian) |
| `POST` | /actions/tools/{toolId}/versions | `guardian_post_actions_tools_toolId_versions` | [stub] Create/invoke /actions/tools/{toolId}/versions (guardian) |
| `GET` | /approvals/actions | `guardian_get_approvals_actions` | [stub] List/get /approvals/actions (guardian) |
| `GET` | /approvals/actions/{id} | `guardian_get_approvals_actions_id` | [stub] List/get /approvals/actions/{id} (guardian) |
| `POST` | /approvals/actions/{id}/approve | `guardian_post_approvals_actions_id_approve` | [stub] Create/invoke /approvals/actions/{id}/approve (guardian) |
| `POST` | /approvals/actions/{id}/reject | `guardian_post_approvals_actions_id_reject` | [stub] Create/invoke /approvals/actions/{id}/reject (guardian) |
| `GET` | /approvals/approvals/{requestId} | `guardian_get_approvals_approvals_requestId` | [stub] List/get /approvals/approvals/{requestId} (guardian) |
| `POST` | /approvals/approvals/{requestId}/review | `guardian_post_approvals_approvals_requestId_review` | [stub] Create/invoke /approvals/approvals/{requestId}/review (guardian) |
| `GET` | /approvals/audit/policy-decisions | `guardian_get_approvals_audit_policy_decisions` | [stub] List/get /approvals/audit/policy-decisions (guardian) |
| `GET` | /approvals/decisions/summary | `guardian_get_approvals_decisions_summary` | [stub] List/get /approvals/decisions/summary (guardian) |
| `POST` | /approvals/guardian/decide | `guardian_post_approvals_guardian_decide` | [stub] Create/invoke /approvals/guardian/decide (guardian) |
| `POST` | /approvals/guardian/evaluate | `guardian_post_approvals_guardian_evaluate` | [stub] Create/invoke /approvals/guardian/evaluate (guardian) |
| `GET` | /approvals/guardrail-configs | `guardian_get_approvals_guardrail_configs` | [stub] List/get /approvals/guardrail-configs (guardian) |
| `POST` | /approvals/guardrail-configs | `guardian_post_approvals_guardrail_configs` | [stub] Create/invoke /approvals/guardrail-configs (guardian) |
| `GET` | /approvals/guardrail-configs/{id} | `guardian_get_approvals_guardrail_configs_id` | [stub] List/get /approvals/guardrail-configs/{id} (guardian) |
| `PATCH` | /approvals/guardrail-configs/{id} | `guardian_patch_approvals_guardrail_configs_id` | [stub] Patch /approvals/guardrail-configs/{id} (guardian) |
| `DELETE` | /approvals/guardrail-configs/{id} | `guardian_delete_approvals_guardrail_configs_id` | [stub] Delete /approvals/guardrail-configs/{id} (guardian) |
| `GET` | /approvals/ledger | `guardian_get_approvals_ledger` | [stub] List/get /approvals/ledger (guardian) |
| `GET` | /approvals/ledger/stream | `guardian_get_approvals_ledger_stream` | [stub] List/get /approvals/ledger/stream (guardian) |
| `GET` | /approvals/policies | `guardian_get_approvals_policies` | [stub] List/get /approvals/policies (guardian) |
| `POST` | /approvals/policies | `guardian_post_approvals_policies` | [stub] Create/invoke /approvals/policies (guardian) |
| `GET` | /approvals/policies/{id} | `guardian_get_approvals_policies_id` | [stub] List/get /approvals/policies/{id} (guardian) |
| `PATCH` | /approvals/policies/{id} | `guardian_patch_approvals_policies_id` | [stub] Patch /approvals/policies/{id} (guardian) |
| `DELETE` | /approvals/policies/{id} | `guardian_delete_approvals_policies_id` | [stub] Delete /approvals/policies/{id} (guardian) |
| `GET` | /approvals/policies/{id}/assignments | `guardian_get_approvals_policies_id_assignments` | [stub] List/get /approvals/policies/{id}/assignments (guardian) |
| `POST` | /approvals/policies/{id}/assignments | `guardian_post_approvals_policies_id_assignments` | [stub] Create/invoke /approvals/policies/{id}/assignments (guardian) |
| `DELETE` | /approvals/policies/{id}/assignments/{assignmentId} | `guardian_delete_approvals_policies_id_assignments_assignmentId` | [stub] Delete /approvals/policies/{id}/assignments/{assignmentId} (guardian) |
| `GET` | /approvals/policies/{id}/audit | `guardian_get_approvals_policies_id_audit` | [stub] List/get /approvals/policies/{id}/audit (guardian) |
| `GET` | /approvals/policies/tiers | `guardian_get_approvals_policies_tiers` | [stub] List/get /approvals/policies/tiers (guardian) |
| `PATCH` | /approvals/policies/tiers/{tier} | `guardian_patch_approvals_policies_tiers_tier` | [stub] Patch /approvals/policies/tiers/{tier} (guardian) |
| `GET` | /approvals/rollback-events | `guardian_get_approvals_rollback_events` | [stub] List/get /approvals/rollback-events (guardian) |
| `POST` | /approvals/rollback-events | `guardian_post_approvals_rollback_events` | [stub] Create/invoke /approvals/rollback-events (guardian) |
| `GET` | /approvals/rollback-events/{id} | `guardian_get_approvals_rollback_events_id` | [stub] List/get /approvals/rollback-events/{id} (guardian) |
| `PATCH` | /approvals/rollback-events/{id}/status | `guardian_patch_approvals_rollback_events_id_status` | [stub] Patch /approvals/rollback-events/{id}/status (guardian) |
| `POST` | /approvals/tool-approvals | `guardian_post_approvals_tool_approvals` | [stub] Create/invoke /approvals/tool-approvals (guardian) |
| `POST` | /approvals/tool-approvals/{id}/approve | `guardian_post_approvals_tool_approvals_id_approve` | [stub] Create/invoke /approvals/tool-approvals/{id}/approve (guardian) |
| `POST` | /approvals/tool-approvals/{id}/reject | `guardian_post_approvals_tool_approvals_id_reject` | [stub] Create/invoke /approvals/tool-approvals/{id}/reject (guardian) |
| `GET` | /approvals/tools | `guardian_get_approvals_tools` | [stub] List/get /approvals/tools (guardian) |
| `POST` | /approvals/tools | `guardian_post_approvals_tools` | [stub] Create/invoke /approvals/tools (guardian) |
| `GET` | /approvals/tools/{toolId} | `guardian_get_approvals_tools_toolId` | [stub] List/get /approvals/tools/{toolId} (guardian) |
| `PATCH` | /approvals/tools/{toolId} | `guardian_patch_approvals_tools_toolId` | [stub] Patch /approvals/tools/{toolId} (guardian) |
| `GET` | /approvals/tools/{toolId}/audit | `guardian_get_approvals_tools_toolId_audit` | [stub] List/get /approvals/tools/{toolId}/audit (guardian) |
| `GET` | /approvals/tools/{toolId}/permissions | `guardian_get_approvals_tools_toolId_permissions` | [stub] List/get /approvals/tools/{toolId}/permissions (guardian) |
| `POST` | /approvals/tools/{toolId}/permissions | `guardian_post_approvals_tools_toolId_permissions` | [stub] Create/invoke /approvals/tools/{toolId}/permissions (guardian) |
| `DELETE` | /approvals/tools/{toolId}/permissions/{permissionId} | `guardian_delete_approvals_tools_toolId_permissions_permissionId` | [stub] Delete /approvals/tools/{toolId}/permissions/{permissionId} (guardian) |
| `GET` | /approvals/tools/{toolId}/versions | `guardian_get_approvals_tools_toolId_versions` | [stub] List/get /approvals/tools/{toolId}/versions (guardian) |
| `POST` | /approvals/tools/{toolId}/versions | `guardian_post_approvals_tools_toolId_versions` | [stub] Create/invoke /approvals/tools/{toolId}/versions (guardian) |
| `GET` | /audit/actions | `guardian_get_audit_actions` | [stub] List/get /audit/actions (guardian) |
| `GET` | /audit/actions/{id} | `guardian_get_audit_actions_id` | [stub] List/get /audit/actions/{id} (guardian) |
| `POST` | /audit/actions/{id}/approve | `guardian_post_audit_actions_id_approve` | [stub] Create/invoke /audit/actions/{id}/approve (guardian) |
| `POST` | /audit/actions/{id}/reject | `guardian_post_audit_actions_id_reject` | [stub] Create/invoke /audit/actions/{id}/reject (guardian) |
| `GET` | /audit/approvals | `guardian_get_audit_approvals` | [stub] List/get /audit/approvals (guardian) |
| `GET` | /audit/approvals/{requestId} | `guardian_get_audit_approvals_requestId` | [stub] List/get /audit/approvals/{requestId} (guardian) |
| `POST` | /audit/approvals/{requestId}/review | `guardian_post_audit_approvals_requestId_review` | [stub] Create/invoke /audit/approvals/{requestId}/review (guardian) |
| `GET` | /audit/audit/policy-decisions | `guardian_get_audit_audit_policy_decisions` | [stub] List/get /audit/audit/policy-decisions (guardian) |
| `GET` | /audit/decisions/summary | `guardian_get_audit_decisions_summary` | [stub] List/get /audit/decisions/summary (guardian) |
| `POST` | /audit/guardian/decide | `guardian_post_audit_guardian_decide` | [stub] Create/invoke /audit/guardian/decide (guardian) |
| `POST` | /audit/guardian/evaluate | `guardian_post_audit_guardian_evaluate` | [stub] Create/invoke /audit/guardian/evaluate (guardian) |
| `GET` | /audit/guardrail-configs | `guardian_get_audit_guardrail_configs` | [stub] List/get /audit/guardrail-configs (guardian) |
| `POST` | /audit/guardrail-configs | `guardian_post_audit_guardrail_configs` | [stub] Create/invoke /audit/guardrail-configs (guardian) |
| `GET` | /audit/guardrail-configs/{id} | `guardian_get_audit_guardrail_configs_id` | [stub] List/get /audit/guardrail-configs/{id} (guardian) |
| `PATCH` | /audit/guardrail-configs/{id} | `guardian_patch_audit_guardrail_configs_id` | [stub] Patch /audit/guardrail-configs/{id} (guardian) |
| `DELETE` | /audit/guardrail-configs/{id} | `guardian_delete_audit_guardrail_configs_id` | [stub] Delete /audit/guardrail-configs/{id} (guardian) |
| `GET` | /audit/ledger | `guardian_get_audit_ledger` | [stub] List/get /audit/ledger (guardian) |
| `GET` | /audit/ledger/stream | `guardian_get_audit_ledger_stream` | [stub] List/get /audit/ledger/stream (guardian) |
| `GET` | /audit/policies | `guardian_get_audit_policies` | [stub] List/get /audit/policies (guardian) |
| `POST` | /audit/policies | `guardian_post_audit_policies` | [stub] Create/invoke /audit/policies (guardian) |
| `GET` | /audit/policies/{id} | `guardian_get_audit_policies_id` | [stub] List/get /audit/policies/{id} (guardian) |
| `PATCH` | /audit/policies/{id} | `guardian_patch_audit_policies_id` | [stub] Patch /audit/policies/{id} (guardian) |
| `DELETE` | /audit/policies/{id} | `guardian_delete_audit_policies_id` | [stub] Delete /audit/policies/{id} (guardian) |
| `GET` | /audit/policies/{id}/assignments | `guardian_get_audit_policies_id_assignments` | [stub] List/get /audit/policies/{id}/assignments (guardian) |
| `POST` | /audit/policies/{id}/assignments | `guardian_post_audit_policies_id_assignments` | [stub] Create/invoke /audit/policies/{id}/assignments (guardian) |
| `DELETE` | /audit/policies/{id}/assignments/{assignmentId} | `guardian_delete_audit_policies_id_assignments_assignmentId` | [stub] Delete /audit/policies/{id}/assignments/{assignmentId} (guardian) |
| `GET` | /audit/policies/{id}/audit | `guardian_get_audit_policies_id_audit` | [stub] List/get /audit/policies/{id}/audit (guardian) |
| `GET` | /audit/policies/tiers | `guardian_get_audit_policies_tiers` | [stub] List/get /audit/policies/tiers (guardian) |
| `PATCH` | /audit/policies/tiers/{tier} | `guardian_patch_audit_policies_tiers_tier` | [stub] Patch /audit/policies/tiers/{tier} (guardian) |
| `GET` | /audit/rollback-events | `guardian_get_audit_rollback_events` | [stub] List/get /audit/rollback-events (guardian) |
| `POST` | /audit/rollback-events | `guardian_post_audit_rollback_events` | [stub] Create/invoke /audit/rollback-events (guardian) |
| `GET` | /audit/rollback-events/{id} | `guardian_get_audit_rollback_events_id` | [stub] List/get /audit/rollback-events/{id} (guardian) |
| `PATCH` | /audit/rollback-events/{id}/status | `guardian_patch_audit_rollback_events_id_status` | [stub] Patch /audit/rollback-events/{id}/status (guardian) |
| `POST` | /audit/tool-approvals | `guardian_post_audit_tool_approvals` | [stub] Create/invoke /audit/tool-approvals (guardian) |
| `POST` | /audit/tool-approvals/{id}/approve | `guardian_post_audit_tool_approvals_id_approve` | [stub] Create/invoke /audit/tool-approvals/{id}/approve (guardian) |
| `POST` | /audit/tool-approvals/{id}/reject | `guardian_post_audit_tool_approvals_id_reject` | [stub] Create/invoke /audit/tool-approvals/{id}/reject (guardian) |
| `GET` | /audit/tools | `guardian_get_audit_tools` | [stub] List/get /audit/tools (guardian) |
| `POST` | /audit/tools | `guardian_post_audit_tools` | [stub] Create/invoke /audit/tools (guardian) |
| `GET` | /audit/tools/{toolId} | `guardian_get_audit_tools_toolId` | [stub] List/get /audit/tools/{toolId} (guardian) |
| `PATCH` | /audit/tools/{toolId} | `guardian_patch_audit_tools_toolId` | [stub] Patch /audit/tools/{toolId} (guardian) |
| `GET` | /audit/tools/{toolId}/audit | `guardian_get_audit_tools_toolId_audit` | [stub] List/get /audit/tools/{toolId}/audit (guardian) |
| `GET` | /audit/tools/{toolId}/permissions | `guardian_get_audit_tools_toolId_permissions` | [stub] List/get /audit/tools/{toolId}/permissions (guardian) |
| `POST` | /audit/tools/{toolId}/permissions | `guardian_post_audit_tools_toolId_permissions` | [stub] Create/invoke /audit/tools/{toolId}/permissions (guardian) |
| `DELETE` | /audit/tools/{toolId}/permissions/{permissionId} | `guardian_delete_audit_tools_toolId_permissions_permissionId` | [stub] Delete /audit/tools/{toolId}/permissions/{permissionId} (guardian) |
| `GET` | /audit/tools/{toolId}/versions | `guardian_get_audit_tools_toolId_versions` | [stub] List/get /audit/tools/{toolId}/versions (guardian) |
| `POST` | /audit/tools/{toolId}/versions | `guardian_post_audit_tools_toolId_versions` | [stub] Create/invoke /audit/tools/{toolId}/versions (guardian) |
| `GET` | /guardian/actions | `guardian_get_guardian_actions` | [stub] List/get /guardian/actions (guardian) |
| `GET` | /guardian/actions/{id} | `guardian_get_guardian_actions_id` | [stub] List/get /guardian/actions/{id} (guardian) |
| `POST` | /guardian/actions/{id}/approve | `guardian_post_guardian_actions_id_approve` | [stub] Create/invoke /guardian/actions/{id}/approve (guardian) |
| `POST` | /guardian/actions/{id}/reject | `guardian_post_guardian_actions_id_reject` | [stub] Create/invoke /guardian/actions/{id}/reject (guardian) |
| `GET` | /guardian/approvals | `guardian_get_guardian_approvals` | [stub] List/get /guardian/approvals (guardian) |
| `GET` | /guardian/approvals/{requestId} | `guardian_get_guardian_approvals_requestId` | [stub] List/get /guardian/approvals/{requestId} (guardian) |
| `POST` | /guardian/approvals/{requestId}/review | `guardian_post_guardian_approvals_requestId_review` | [stub] Create/invoke /guardian/approvals/{requestId}/review (guardian) |
| `GET` | /guardian/audit/policy-decisions | `guardian_get_guardian_audit_policy_decisions` | [stub] List/get /guardian/audit/policy-decisions (guardian) |
| `GET` | /guardian/decisions/summary | `guardian_get_guardian_decisions_summary` | [stub] List/get /guardian/decisions/summary (guardian) |
| `POST` | /guardian/guardian/decide | `guardian_post_guardian_guardian_decide` | [stub] Create/invoke /guardian/guardian/decide (guardian) |
| `POST` | /guardian/guardian/evaluate | `guardian_post_guardian_guardian_evaluate` | [stub] Create/invoke /guardian/guardian/evaluate (guardian) |
| `GET` | /guardian/guardrail-configs | `guardian_get_guardian_guardrail_configs` | [stub] List/get /guardian/guardrail-configs (guardian) |
| `POST` | /guardian/guardrail-configs | `guardian_post_guardian_guardrail_configs` | [stub] Create/invoke /guardian/guardrail-configs (guardian) |
| `GET` | /guardian/guardrail-configs/{id} | `guardian_get_guardian_guardrail_configs_id` | [stub] List/get /guardian/guardrail-configs/{id} (guardian) |
| `PATCH` | /guardian/guardrail-configs/{id} | `guardian_patch_guardian_guardrail_configs_id` | [stub] Patch /guardian/guardrail-configs/{id} (guardian) |
| `DELETE` | /guardian/guardrail-configs/{id} | `guardian_delete_guardian_guardrail_configs_id` | [stub] Delete /guardian/guardrail-configs/{id} (guardian) |
| `GET` | /guardian/ledger | `guardian_get_guardian_ledger` | [stub] List/get /guardian/ledger (guardian) |
| `GET` | /guardian/ledger/stream | `guardian_get_guardian_ledger_stream` | [stub] List/get /guardian/ledger/stream (guardian) |
| `GET` | /guardian/policies | `guardian_get_guardian_policies` | [stub] List/get /guardian/policies (guardian) |
| `POST` | /guardian/policies | `guardian_post_guardian_policies` | [stub] Create/invoke /guardian/policies (guardian) |
| `GET` | /guardian/policies/{id} | `guardian_get_guardian_policies_id` | [stub] List/get /guardian/policies/{id} (guardian) |
| `PATCH` | /guardian/policies/{id} | `guardian_patch_guardian_policies_id` | [stub] Patch /guardian/policies/{id} (guardian) |
| `DELETE` | /guardian/policies/{id} | `guardian_delete_guardian_policies_id` | [stub] Delete /guardian/policies/{id} (guardian) |
| `GET` | /guardian/policies/{id}/assignments | `guardian_get_guardian_policies_id_assignments` | [stub] List/get /guardian/policies/{id}/assignments (guardian) |
| `POST` | /guardian/policies/{id}/assignments | `guardian_post_guardian_policies_id_assignments` | [stub] Create/invoke /guardian/policies/{id}/assignments (guardian) |
| `DELETE` | /guardian/policies/{id}/assignments/{assignmentId} | `guardian_delete_guardian_policies_id_assignments_assignmentId` | [stub] Delete /guardian/policies/{id}/assignments/{assignmentId} (guardian) |
| `GET` | /guardian/policies/{id}/audit | `guardian_get_guardian_policies_id_audit` | [stub] List/get /guardian/policies/{id}/audit (guardian) |
| `GET` | /guardian/policies/tiers | `guardian_get_guardian_policies_tiers` | [stub] List/get /guardian/policies/tiers (guardian) |
| `PATCH` | /guardian/policies/tiers/{tier} | `guardian_patch_guardian_policies_tiers_tier` | [stub] Patch /guardian/policies/tiers/{tier} (guardian) |
| `GET` | /guardian/rollback-events | `guardian_get_guardian_rollback_events` | [stub] List/get /guardian/rollback-events (guardian) |
| `POST` | /guardian/rollback-events | `guardian_post_guardian_rollback_events` | [stub] Create/invoke /guardian/rollback-events (guardian) |
| `GET` | /guardian/rollback-events/{id} | `guardian_get_guardian_rollback_events_id` | [stub] List/get /guardian/rollback-events/{id} (guardian) |
| `PATCH` | /guardian/rollback-events/{id}/status | `guardian_patch_guardian_rollback_events_id_status` | [stub] Patch /guardian/rollback-events/{id}/status (guardian) |
| `POST` | /guardian/tool-approvals | `guardian_post_guardian_tool_approvals` | [stub] Create/invoke /guardian/tool-approvals (guardian) |
| `POST` | /guardian/tool-approvals/{id}/approve | `guardian_post_guardian_tool_approvals_id_approve` | [stub] Create/invoke /guardian/tool-approvals/{id}/approve (guardian) |
| `POST` | /guardian/tool-approvals/{id}/reject | `guardian_post_guardian_tool_approvals_id_reject` | [stub] Create/invoke /guardian/tool-approvals/{id}/reject (guardian) |
| `GET` | /guardian/tools | `guardian_get_guardian_tools` | [stub] List/get /guardian/tools (guardian) |
| `POST` | /guardian/tools | `guardian_post_guardian_tools` | [stub] Create/invoke /guardian/tools (guardian) |
| `GET` | /guardian/tools/{toolId} | `guardian_get_guardian_tools_toolId` | [stub] List/get /guardian/tools/{toolId} (guardian) |
| `PATCH` | /guardian/tools/{toolId} | `guardian_patch_guardian_tools_toolId` | [stub] Patch /guardian/tools/{toolId} (guardian) |
| `GET` | /guardian/tools/{toolId}/audit | `guardian_get_guardian_tools_toolId_audit` | [stub] List/get /guardian/tools/{toolId}/audit (guardian) |
| `GET` | /guardian/tools/{toolId}/permissions | `guardian_get_guardian_tools_toolId_permissions` | [stub] List/get /guardian/tools/{toolId}/permissions (guardian) |
| `POST` | /guardian/tools/{toolId}/permissions | `guardian_post_guardian_tools_toolId_permissions` | [stub] Create/invoke /guardian/tools/{toolId}/permissions (guardian) |
| `DELETE` | /guardian/tools/{toolId}/permissions/{permissionId} | `guardian_delete_guardian_tools_toolId_permissions_permissionId` | [stub] Delete /guardian/tools/{toolId}/permissions/{permissionId} (guardian) |
| `GET` | /guardian/tools/{toolId}/versions | `guardian_get_guardian_tools_toolId_versions` | [stub] List/get /guardian/tools/{toolId}/versions (guardian) |
| `POST` | /guardian/tools/{toolId}/versions | `guardian_post_guardian_tools_toolId_versions` | [stub] Create/invoke /guardian/tools/{toolId}/versions (guardian) |
| `GET` | /guardrail-configs/actions | `guardian_get_guardrail_configs_actions` | [stub] List/get /guardrail-configs/actions (guardian) |
| `GET` | /guardrail-configs/actions/{id} | `guardian_get_guardrail_configs_actions_id` | [stub] List/get /guardrail-configs/actions/{id} (guardian) |
| `POST` | /guardrail-configs/actions/{id}/approve | `guardian_post_guardrail_configs_actions_id_approve` | [stub] Create/invoke /guardrail-configs/actions/{id}/approve (guardian) |
| `POST` | /guardrail-configs/actions/{id}/reject | `guardian_post_guardrail_configs_actions_id_reject` | [stub] Create/invoke /guardrail-configs/actions/{id}/reject (guardian) |
| `GET` | /guardrail-configs/approvals | `guardian_get_guardrail_configs_approvals` | [stub] List/get /guardrail-configs/approvals (guardian) |
| `GET` | /guardrail-configs/approvals/{requestId} | `guardian_get_guardrail_configs_approvals_requestId` | [stub] List/get /guardrail-configs/approvals/{requestId} (guardian) |
| `POST` | /guardrail-configs/approvals/{requestId}/review | `guardian_post_guardrail_configs_approvals_requestId_review` | [stub] Create/invoke /guardrail-configs/approvals/{requestId}/review (guardian) |
| `GET` | /guardrail-configs/audit/policy-decisions | `guardian_get_guardrail_configs_audit_policy_decisions` | [stub] List/get /guardrail-configs/audit/policy-decisions (guardian) |
| `GET` | /guardrail-configs/decisions/summary | `guardian_get_guardrail_configs_decisions_summary` | [stub] List/get /guardrail-configs/decisions/summary (guardian) |
| `POST` | /guardrail-configs/guardian/decide | `guardian_post_guardrail_configs_guardian_decide` | [stub] Create/invoke /guardrail-configs/guardian/decide (guardian) |
| `POST` | /guardrail-configs/guardian/evaluate | `guardian_post_guardrail_configs_guardian_evaluate` | [stub] Create/invoke /guardrail-configs/guardian/evaluate (guardian) |
| `GET` | /guardrail-configs/guardrail-configs | `guardian_get_guardrail_configs_guardrail_configs` | [stub] List/get /guardrail-configs/guardrail-configs (guardian) |
| `POST` | /guardrail-configs/guardrail-configs | `guardian_post_guardrail_configs_guardrail_configs` | [stub] Create/invoke /guardrail-configs/guardrail-configs (guardian) |
| `GET` | /guardrail-configs/guardrail-configs/{id} | `guardian_get_guardrail_configs_guardrail_configs_id` | [stub] List/get /guardrail-configs/guardrail-configs/{id} (guardian) |
| `PATCH` | /guardrail-configs/guardrail-configs/{id} | `guardian_patch_guardrail_configs_guardrail_configs_id` | [stub] Patch /guardrail-configs/guardrail-configs/{id} (guardian) |
| `DELETE` | /guardrail-configs/guardrail-configs/{id} | `guardian_delete_guardrail_configs_guardrail_configs_id` | [stub] Delete /guardrail-configs/guardrail-configs/{id} (guardian) |
| `GET` | /guardrail-configs/ledger | `guardian_get_guardrail_configs_ledger` | [stub] List/get /guardrail-configs/ledger (guardian) |
| `GET` | /guardrail-configs/ledger/stream | `guardian_get_guardrail_configs_ledger_stream` | [stub] List/get /guardrail-configs/ledger/stream (guardian) |
| `GET` | /guardrail-configs/policies | `guardian_get_guardrail_configs_policies` | [stub] List/get /guardrail-configs/policies (guardian) |
| `POST` | /guardrail-configs/policies | `guardian_post_guardrail_configs_policies` | [stub] Create/invoke /guardrail-configs/policies (guardian) |
| `GET` | /guardrail-configs/policies/{id} | `guardian_get_guardrail_configs_policies_id` | [stub] List/get /guardrail-configs/policies/{id} (guardian) |
| `PATCH` | /guardrail-configs/policies/{id} | `guardian_patch_guardrail_configs_policies_id` | [stub] Patch /guardrail-configs/policies/{id} (guardian) |
| `DELETE` | /guardrail-configs/policies/{id} | `guardian_delete_guardrail_configs_policies_id` | [stub] Delete /guardrail-configs/policies/{id} (guardian) |
| `GET` | /guardrail-configs/policies/{id}/assignments | `guardian_get_guardrail_configs_policies_id_assignments` | [stub] List/get /guardrail-configs/policies/{id}/assignments (guardian) |
| `POST` | /guardrail-configs/policies/{id}/assignments | `guardian_post_guardrail_configs_policies_id_assignments` | [stub] Create/invoke /guardrail-configs/policies/{id}/assignments (guardian) |
| `DELETE` | /guardrail-configs/policies/{id}/assignments/{assignmentId} | `guardian_delete_guardrail_configs_policies_id_assignments_assignmentId` | [stub] Delete /guardrail-configs/policies/{id}/assignments/{assignmentId} (guardian) |
| `GET` | /guardrail-configs/policies/{id}/audit | `guardian_get_guardrail_configs_policies_id_audit` | [stub] List/get /guardrail-configs/policies/{id}/audit (guardian) |
| `GET` | /guardrail-configs/policies/tiers | `guardian_get_guardrail_configs_policies_tiers` | [stub] List/get /guardrail-configs/policies/tiers (guardian) |
| `PATCH` | /guardrail-configs/policies/tiers/{tier} | `guardian_patch_guardrail_configs_policies_tiers_tier` | [stub] Patch /guardrail-configs/policies/tiers/{tier} (guardian) |
| `GET` | /guardrail-configs/rollback-events | `guardian_get_guardrail_configs_rollback_events` | [stub] List/get /guardrail-configs/rollback-events (guardian) |
| `POST` | /guardrail-configs/rollback-events | `guardian_post_guardrail_configs_rollback_events` | [stub] Create/invoke /guardrail-configs/rollback-events (guardian) |
| `GET` | /guardrail-configs/rollback-events/{id} | `guardian_get_guardrail_configs_rollback_events_id` | [stub] List/get /guardrail-configs/rollback-events/{id} (guardian) |
| `PATCH` | /guardrail-configs/rollback-events/{id}/status | `guardian_patch_guardrail_configs_rollback_events_id_status` | [stub] Patch /guardrail-configs/rollback-events/{id}/status (guardian) |
| `POST` | /guardrail-configs/tool-approvals | `guardian_post_guardrail_configs_tool_approvals` | [stub] Create/invoke /guardrail-configs/tool-approvals (guardian) |
| `POST` | /guardrail-configs/tool-approvals/{id}/approve | `guardian_post_guardrail_configs_tool_approvals_id_approve` | [stub] Create/invoke /guardrail-configs/tool-approvals/{id}/approve (guardian) |
| `POST` | /guardrail-configs/tool-approvals/{id}/reject | `guardian_post_guardrail_configs_tool_approvals_id_reject` | [stub] Create/invoke /guardrail-configs/tool-approvals/{id}/reject (guardian) |
| `GET` | /guardrail-configs/tools | `guardian_get_guardrail_configs_tools` | [stub] List/get /guardrail-configs/tools (guardian) |
| `POST` | /guardrail-configs/tools | `guardian_post_guardrail_configs_tools` | [stub] Create/invoke /guardrail-configs/tools (guardian) |
| `GET` | /guardrail-configs/tools/{toolId} | `guardian_get_guardrail_configs_tools_toolId` | [stub] List/get /guardrail-configs/tools/{toolId} (guardian) |
| `PATCH` | /guardrail-configs/tools/{toolId} | `guardian_patch_guardrail_configs_tools_toolId` | [stub] Patch /guardrail-configs/tools/{toolId} (guardian) |
| `GET` | /guardrail-configs/tools/{toolId}/audit | `guardian_get_guardrail_configs_tools_toolId_audit` | [stub] List/get /guardrail-configs/tools/{toolId}/audit (guardian) |
| `GET` | /guardrail-configs/tools/{toolId}/permissions | `guardian_get_guardrail_configs_tools_toolId_permissions` | [stub] List/get /guardrail-configs/tools/{toolId}/permissions (guardian) |
| `POST` | /guardrail-configs/tools/{toolId}/permissions | `guardian_post_guardrail_configs_tools_toolId_permissions` | [stub] Create/invoke /guardrail-configs/tools/{toolId}/permissions (guardian) |
| `DELETE` | /guardrail-configs/tools/{toolId}/permissions/{permissionId} | `guardian_delete_guardrail_configs_tools_toolId_permissions_permissionId` | [stub] Delete /guardrail-configs/tools/{toolId}/permissions/{permissionId} (guardian) |
| `GET` | /guardrail-configs/tools/{toolId}/versions | `guardian_get_guardrail_configs_tools_toolId_versions` | [stub] List/get /guardrail-configs/tools/{toolId}/versions (guardian) |
| `POST` | /guardrail-configs/tools/{toolId}/versions | `guardian_post_guardrail_configs_tools_toolId_versions` | [stub] Create/invoke /guardrail-configs/tools/{toolId}/versions (guardian) |
| `GET` | /ledger/actions | `guardian_get_ledger_actions` | [stub] List/get /ledger/actions (guardian) |
| `GET` | /ledger/actions/{id} | `guardian_get_ledger_actions_id` | [stub] List/get /ledger/actions/{id} (guardian) |
| `POST` | /ledger/actions/{id}/approve | `guardian_post_ledger_actions_id_approve` | [stub] Create/invoke /ledger/actions/{id}/approve (guardian) |
| `POST` | /ledger/actions/{id}/reject | `guardian_post_ledger_actions_id_reject` | [stub] Create/invoke /ledger/actions/{id}/reject (guardian) |
| `GET` | /ledger/approvals | `guardian_get_ledger_approvals` | [stub] List/get /ledger/approvals (guardian) |
| `GET` | /ledger/approvals/{requestId} | `guardian_get_ledger_approvals_requestId` | [stub] List/get /ledger/approvals/{requestId} (guardian) |
| `POST` | /ledger/approvals/{requestId}/review | `guardian_post_ledger_approvals_requestId_review` | [stub] Create/invoke /ledger/approvals/{requestId}/review (guardian) |
| `GET` | /ledger/audit/policy-decisions | `guardian_get_ledger_audit_policy_decisions` | [stub] List/get /ledger/audit/policy-decisions (guardian) |
| `GET` | /ledger/decisions/summary | `guardian_get_ledger_decisions_summary` | [stub] List/get /ledger/decisions/summary (guardian) |
| `POST` | /ledger/guardian/decide | `guardian_post_ledger_guardian_decide` | [stub] Create/invoke /ledger/guardian/decide (guardian) |
| `POST` | /ledger/guardian/evaluate | `guardian_post_ledger_guardian_evaluate` | [stub] Create/invoke /ledger/guardian/evaluate (guardian) |
| `GET` | /ledger/guardrail-configs | `guardian_get_ledger_guardrail_configs` | [stub] List/get /ledger/guardrail-configs (guardian) |
| `POST` | /ledger/guardrail-configs | `guardian_post_ledger_guardrail_configs` | [stub] Create/invoke /ledger/guardrail-configs (guardian) |
| `GET` | /ledger/guardrail-configs/{id} | `guardian_get_ledger_guardrail_configs_id` | [stub] List/get /ledger/guardrail-configs/{id} (guardian) |
| `PATCH` | /ledger/guardrail-configs/{id} | `guardian_patch_ledger_guardrail_configs_id` | [stub] Patch /ledger/guardrail-configs/{id} (guardian) |
| `DELETE` | /ledger/guardrail-configs/{id} | `guardian_delete_ledger_guardrail_configs_id` | [stub] Delete /ledger/guardrail-configs/{id} (guardian) |
| `GET` | /ledger/ledger | `guardian_get_ledger_ledger` | [stub] List/get /ledger/ledger (guardian) |
| `GET` | /ledger/ledger/stream | `guardian_get_ledger_ledger_stream` | [stub] List/get /ledger/ledger/stream (guardian) |
| `GET` | /ledger/policies | `guardian_get_ledger_policies` | [stub] List/get /ledger/policies (guardian) |
| `POST` | /ledger/policies | `guardian_post_ledger_policies` | [stub] Create/invoke /ledger/policies (guardian) |
| `GET` | /ledger/policies/{id} | `guardian_get_ledger_policies_id` | [stub] List/get /ledger/policies/{id} (guardian) |
| `PATCH` | /ledger/policies/{id} | `guardian_patch_ledger_policies_id` | [stub] Patch /ledger/policies/{id} (guardian) |
| `DELETE` | /ledger/policies/{id} | `guardian_delete_ledger_policies_id` | [stub] Delete /ledger/policies/{id} (guardian) |
| `GET` | /ledger/policies/{id}/assignments | `guardian_get_ledger_policies_id_assignments` | [stub] List/get /ledger/policies/{id}/assignments (guardian) |
| `POST` | /ledger/policies/{id}/assignments | `guardian_post_ledger_policies_id_assignments` | [stub] Create/invoke /ledger/policies/{id}/assignments (guardian) |
| `DELETE` | /ledger/policies/{id}/assignments/{assignmentId} | `guardian_delete_ledger_policies_id_assignments_assignmentId` | [stub] Delete /ledger/policies/{id}/assignments/{assignmentId} (guardian) |
| `GET` | /ledger/policies/{id}/audit | `guardian_get_ledger_policies_id_audit` | [stub] List/get /ledger/policies/{id}/audit (guardian) |
| `GET` | /ledger/policies/tiers | `guardian_get_ledger_policies_tiers` | [stub] List/get /ledger/policies/tiers (guardian) |
| `PATCH` | /ledger/policies/tiers/{tier} | `guardian_patch_ledger_policies_tiers_tier` | [stub] Patch /ledger/policies/tiers/{tier} (guardian) |
| `GET` | /ledger/rollback-events | `guardian_get_ledger_rollback_events` | [stub] List/get /ledger/rollback-events (guardian) |
| `POST` | /ledger/rollback-events | `guardian_post_ledger_rollback_events` | [stub] Create/invoke /ledger/rollback-events (guardian) |
| `GET` | /ledger/rollback-events/{id} | `guardian_get_ledger_rollback_events_id` | [stub] List/get /ledger/rollback-events/{id} (guardian) |
| `PATCH` | /ledger/rollback-events/{id}/status | `guardian_patch_ledger_rollback_events_id_status` | [stub] Patch /ledger/rollback-events/{id}/status (guardian) |
| `POST` | /ledger/tool-approvals | `guardian_post_ledger_tool_approvals` | [stub] Create/invoke /ledger/tool-approvals (guardian) |
| `POST` | /ledger/tool-approvals/{id}/approve | `guardian_post_ledger_tool_approvals_id_approve` | [stub] Create/invoke /ledger/tool-approvals/{id}/approve (guardian) |
| `POST` | /ledger/tool-approvals/{id}/reject | `guardian_post_ledger_tool_approvals_id_reject` | [stub] Create/invoke /ledger/tool-approvals/{id}/reject (guardian) |
| `GET` | /ledger/tools | `guardian_get_ledger_tools` | [stub] List/get /ledger/tools (guardian) |
| `POST` | /ledger/tools | `guardian_post_ledger_tools` | [stub] Create/invoke /ledger/tools (guardian) |
| `GET` | /ledger/tools/{toolId} | `guardian_get_ledger_tools_toolId` | [stub] List/get /ledger/tools/{toolId} (guardian) |
| `PATCH` | /ledger/tools/{toolId} | `guardian_patch_ledger_tools_toolId` | [stub] Patch /ledger/tools/{toolId} (guardian) |
| `GET` | /ledger/tools/{toolId}/audit | `guardian_get_ledger_tools_toolId_audit` | [stub] List/get /ledger/tools/{toolId}/audit (guardian) |
| `GET` | /ledger/tools/{toolId}/permissions | `guardian_get_ledger_tools_toolId_permissions` | [stub] List/get /ledger/tools/{toolId}/permissions (guardian) |
| `POST` | /ledger/tools/{toolId}/permissions | `guardian_post_ledger_tools_toolId_permissions` | [stub] Create/invoke /ledger/tools/{toolId}/permissions (guardian) |
| `DELETE` | /ledger/tools/{toolId}/permissions/{permissionId} | `guardian_delete_ledger_tools_toolId_permissions_permissionId` | [stub] Delete /ledger/tools/{toolId}/permissions/{permissionId} (guardian) |
| `GET` | /ledger/tools/{toolId}/versions | `guardian_get_ledger_tools_toolId_versions` | [stub] List/get /ledger/tools/{toolId}/versions (guardian) |
| `POST` | /ledger/tools/{toolId}/versions | `guardian_post_ledger_tools_toolId_versions` | [stub] Create/invoke /ledger/tools/{toolId}/versions (guardian) |
| `GET` | /policies/actions | `guardian_get_policies_actions` | [stub] List/get /policies/actions (guardian) |
| `GET` | /policies/actions/{id} | `guardian_get_policies_actions_id` | [stub] List/get /policies/actions/{id} (guardian) |
| `POST` | /policies/actions/{id}/approve | `guardian_post_policies_actions_id_approve` | [stub] Create/invoke /policies/actions/{id}/approve (guardian) |
| `POST` | /policies/actions/{id}/reject | `guardian_post_policies_actions_id_reject` | [stub] Create/invoke /policies/actions/{id}/reject (guardian) |
| `GET` | /policies/approvals | `guardian_get_policies_approvals` | [stub] List/get /policies/approvals (guardian) |
| `GET` | /policies/approvals/{requestId} | `guardian_get_policies_approvals_requestId` | [stub] List/get /policies/approvals/{requestId} (guardian) |
| `POST` | /policies/approvals/{requestId}/review | `guardian_post_policies_approvals_requestId_review` | [stub] Create/invoke /policies/approvals/{requestId}/review (guardian) |
| `GET` | /policies/audit/policy-decisions | `guardian_get_policies_audit_policy_decisions` | [stub] List/get /policies/audit/policy-decisions (guardian) |
| `GET` | /policies/decisions/summary | `guardian_get_policies_decisions_summary` | [stub] List/get /policies/decisions/summary (guardian) |
| `POST` | /policies/guardian/decide | `guardian_post_policies_guardian_decide` | [stub] Create/invoke /policies/guardian/decide (guardian) |
| `POST` | /policies/guardian/evaluate | `guardian_post_policies_guardian_evaluate` | [stub] Create/invoke /policies/guardian/evaluate (guardian) |
| `GET` | /policies/guardrail-configs | `guardian_get_policies_guardrail_configs` | [stub] List/get /policies/guardrail-configs (guardian) |
| `POST` | /policies/guardrail-configs | `guardian_post_policies_guardrail_configs` | [stub] Create/invoke /policies/guardrail-configs (guardian) |
| `GET` | /policies/guardrail-configs/{id} | `guardian_get_policies_guardrail_configs_id` | [stub] List/get /policies/guardrail-configs/{id} (guardian) |
| `PATCH` | /policies/guardrail-configs/{id} | `guardian_patch_policies_guardrail_configs_id` | [stub] Patch /policies/guardrail-configs/{id} (guardian) |
| `DELETE` | /policies/guardrail-configs/{id} | `guardian_delete_policies_guardrail_configs_id` | [stub] Delete /policies/guardrail-configs/{id} (guardian) |
| `GET` | /policies/ledger | `guardian_get_policies_ledger` | [stub] List/get /policies/ledger (guardian) |
| `GET` | /policies/ledger/stream | `guardian_get_policies_ledger_stream` | [stub] List/get /policies/ledger/stream (guardian) |
| `GET` | /policies/policies | `guardian_get_policies_policies` | [stub] List/get /policies/policies (guardian) |
| `POST` | /policies/policies | `guardian_post_policies_policies` | [stub] Create/invoke /policies/policies (guardian) |
| `GET` | /policies/policies/{id} | `guardian_get_policies_policies_id` | [stub] List/get /policies/policies/{id} (guardian) |
| `PATCH` | /policies/policies/{id} | `guardian_patch_policies_policies_id` | [stub] Patch /policies/policies/{id} (guardian) |
| `DELETE` | /policies/policies/{id} | `guardian_delete_policies_policies_id` | [stub] Delete /policies/policies/{id} (guardian) |
| `GET` | /policies/policies/{id}/assignments | `guardian_get_policies_policies_id_assignments` | [stub] List/get /policies/policies/{id}/assignments (guardian) |
| `POST` | /policies/policies/{id}/assignments | `guardian_post_policies_policies_id_assignments` | [stub] Create/invoke /policies/policies/{id}/assignments (guardian) |
| `DELETE` | /policies/policies/{id}/assignments/{assignmentId} | `guardian_delete_policies_policies_id_assignments_assignmentId` | [stub] Delete /policies/policies/{id}/assignments/{assignmentId} (guardian) |
| `GET` | /policies/policies/{id}/audit | `guardian_get_policies_policies_id_audit` | [stub] List/get /policies/policies/{id}/audit (guardian) |
| `GET` | /policies/policies/tiers | `guardian_get_policies_policies_tiers` | [stub] List/get /policies/policies/tiers (guardian) |
| `PATCH` | /policies/policies/tiers/{tier} | `guardian_patch_policies_policies_tiers_tier` | [stub] Patch /policies/policies/tiers/{tier} (guardian) |
| `GET` | /policies/rollback-events | `guardian_get_policies_rollback_events` | [stub] List/get /policies/rollback-events (guardian) |
| `POST` | /policies/rollback-events | `guardian_post_policies_rollback_events` | [stub] Create/invoke /policies/rollback-events (guardian) |
| `GET` | /policies/rollback-events/{id} | `guardian_get_policies_rollback_events_id` | [stub] List/get /policies/rollback-events/{id} (guardian) |
| `PATCH` | /policies/rollback-events/{id}/status | `guardian_patch_policies_rollback_events_id_status` | [stub] Patch /policies/rollback-events/{id}/status (guardian) |
| `POST` | /policies/tool-approvals | `guardian_post_policies_tool_approvals` | [stub] Create/invoke /policies/tool-approvals (guardian) |
| `POST` | /policies/tool-approvals/{id}/approve | `guardian_post_policies_tool_approvals_id_approve` | [stub] Create/invoke /policies/tool-approvals/{id}/approve (guardian) |
| `POST` | /policies/tool-approvals/{id}/reject | `guardian_post_policies_tool_approvals_id_reject` | [stub] Create/invoke /policies/tool-approvals/{id}/reject (guardian) |
| `GET` | /policies/tools | `guardian_get_policies_tools` | [stub] List/get /policies/tools (guardian) |
| `POST` | /policies/tools | `guardian_post_policies_tools` | [stub] Create/invoke /policies/tools (guardian) |
| `GET` | /policies/tools/{toolId} | `guardian_get_policies_tools_toolId` | [stub] List/get /policies/tools/{toolId} (guardian) |
| `PATCH` | /policies/tools/{toolId} | `guardian_patch_policies_tools_toolId` | [stub] Patch /policies/tools/{toolId} (guardian) |
| `GET` | /policies/tools/{toolId}/audit | `guardian_get_policies_tools_toolId_audit` | [stub] List/get /policies/tools/{toolId}/audit (guardian) |
| `GET` | /policies/tools/{toolId}/permissions | `guardian_get_policies_tools_toolId_permissions` | [stub] List/get /policies/tools/{toolId}/permissions (guardian) |
| `POST` | /policies/tools/{toolId}/permissions | `guardian_post_policies_tools_toolId_permissions` | [stub] Create/invoke /policies/tools/{toolId}/permissions (guardian) |
| `DELETE` | /policies/tools/{toolId}/permissions/{permissionId} | `guardian_delete_policies_tools_toolId_permissions_permissionId` | [stub] Delete /policies/tools/{toolId}/permissions/{permissionId} (guardian) |
| `GET` | /policies/tools/{toolId}/versions | `guardian_get_policies_tools_toolId_versions` | [stub] List/get /policies/tools/{toolId}/versions (guardian) |
| `POST` | /policies/tools/{toolId}/versions | `guardian_post_policies_tools_toolId_versions` | [stub] Create/invoke /policies/tools/{toolId}/versions (guardian) |
| `GET` | /rollback-events/actions | `guardian_get_rollback_events_actions` | [stub] List/get /rollback-events/actions (guardian) |
| `GET` | /rollback-events/actions/{id} | `guardian_get_rollback_events_actions_id` | [stub] List/get /rollback-events/actions/{id} (guardian) |
| `POST` | /rollback-events/actions/{id}/approve | `guardian_post_rollback_events_actions_id_approve` | [stub] Create/invoke /rollback-events/actions/{id}/approve (guardian) |
| `POST` | /rollback-events/actions/{id}/reject | `guardian_post_rollback_events_actions_id_reject` | [stub] Create/invoke /rollback-events/actions/{id}/reject (guardian) |
| `GET` | /rollback-events/approvals | `guardian_get_rollback_events_approvals` | [stub] List/get /rollback-events/approvals (guardian) |
| `GET` | /rollback-events/approvals/{requestId} | `guardian_get_rollback_events_approvals_requestId` | [stub] List/get /rollback-events/approvals/{requestId} (guardian) |
| `POST` | /rollback-events/approvals/{requestId}/review | `guardian_post_rollback_events_approvals_requestId_review` | [stub] Create/invoke /rollback-events/approvals/{requestId}/review (guardian) |
| `GET` | /rollback-events/audit/policy-decisions | `guardian_get_rollback_events_audit_policy_decisions` | [stub] List/get /rollback-events/audit/policy-decisions (guardian) |
| `GET` | /rollback-events/decisions/summary | `guardian_get_rollback_events_decisions_summary` | [stub] List/get /rollback-events/decisions/summary (guardian) |
| `POST` | /rollback-events/guardian/decide | `guardian_post_rollback_events_guardian_decide` | [stub] Create/invoke /rollback-events/guardian/decide (guardian) |
| `POST` | /rollback-events/guardian/evaluate | `guardian_post_rollback_events_guardian_evaluate` | [stub] Create/invoke /rollback-events/guardian/evaluate (guardian) |
| `GET` | /rollback-events/guardrail-configs | `guardian_get_rollback_events_guardrail_configs` | [stub] List/get /rollback-events/guardrail-configs (guardian) |
| `POST` | /rollback-events/guardrail-configs | `guardian_post_rollback_events_guardrail_configs` | [stub] Create/invoke /rollback-events/guardrail-configs (guardian) |
| `GET` | /rollback-events/guardrail-configs/{id} | `guardian_get_rollback_events_guardrail_configs_id` | [stub] List/get /rollback-events/guardrail-configs/{id} (guardian) |
| `PATCH` | /rollback-events/guardrail-configs/{id} | `guardian_patch_rollback_events_guardrail_configs_id` | [stub] Patch /rollback-events/guardrail-configs/{id} (guardian) |
| `DELETE` | /rollback-events/guardrail-configs/{id} | `guardian_delete_rollback_events_guardrail_configs_id` | [stub] Delete /rollback-events/guardrail-configs/{id} (guardian) |
| `GET` | /rollback-events/ledger | `guardian_get_rollback_events_ledger` | [stub] List/get /rollback-events/ledger (guardian) |
| `GET` | /rollback-events/ledger/stream | `guardian_get_rollback_events_ledger_stream` | [stub] List/get /rollback-events/ledger/stream (guardian) |
| `GET` | /rollback-events/policies | `guardian_get_rollback_events_policies` | [stub] List/get /rollback-events/policies (guardian) |
| `POST` | /rollback-events/policies | `guardian_post_rollback_events_policies` | [stub] Create/invoke /rollback-events/policies (guardian) |
| `GET` | /rollback-events/policies/{id} | `guardian_get_rollback_events_policies_id` | [stub] List/get /rollback-events/policies/{id} (guardian) |
| `PATCH` | /rollback-events/policies/{id} | `guardian_patch_rollback_events_policies_id` | [stub] Patch /rollback-events/policies/{id} (guardian) |
| `DELETE` | /rollback-events/policies/{id} | `guardian_delete_rollback_events_policies_id` | [stub] Delete /rollback-events/policies/{id} (guardian) |
| `GET` | /rollback-events/policies/{id}/assignments | `guardian_get_rollback_events_policies_id_assignments` | [stub] List/get /rollback-events/policies/{id}/assignments (guardian) |
| `POST` | /rollback-events/policies/{id}/assignments | `guardian_post_rollback_events_policies_id_assignments` | [stub] Create/invoke /rollback-events/policies/{id}/assignments (guardian) |
| `DELETE` | /rollback-events/policies/{id}/assignments/{assignmentId} | `guardian_delete_rollback_events_policies_id_assignments_assignmentId` | [stub] Delete /rollback-events/policies/{id}/assignments/{assignmentId} (guardian) |
| `GET` | /rollback-events/policies/{id}/audit | `guardian_get_rollback_events_policies_id_audit` | [stub] List/get /rollback-events/policies/{id}/audit (guardian) |
| `GET` | /rollback-events/policies/tiers | `guardian_get_rollback_events_policies_tiers` | [stub] List/get /rollback-events/policies/tiers (guardian) |
| `PATCH` | /rollback-events/policies/tiers/{tier} | `guardian_patch_rollback_events_policies_tiers_tier` | [stub] Patch /rollback-events/policies/tiers/{tier} (guardian) |
| `GET` | /rollback-events/rollback-events | `guardian_get_rollback_events_rollback_events` | [stub] List/get /rollback-events/rollback-events (guardian) |
| `POST` | /rollback-events/rollback-events | `guardian_post_rollback_events_rollback_events` | [stub] Create/invoke /rollback-events/rollback-events (guardian) |
| `GET` | /rollback-events/rollback-events/{id} | `guardian_get_rollback_events_rollback_events_id` | [stub] List/get /rollback-events/rollback-events/{id} (guardian) |
| `PATCH` | /rollback-events/rollback-events/{id}/status | `guardian_patch_rollback_events_rollback_events_id_status` | [stub] Patch /rollback-events/rollback-events/{id}/status (guardian) |
| `POST` | /rollback-events/tool-approvals | `guardian_post_rollback_events_tool_approvals` | [stub] Create/invoke /rollback-events/tool-approvals (guardian) |
| `POST` | /rollback-events/tool-approvals/{id}/approve | `guardian_post_rollback_events_tool_approvals_id_approve` | [stub] Create/invoke /rollback-events/tool-approvals/{id}/approve (guardian) |
| `POST` | /rollback-events/tool-approvals/{id}/reject | `guardian_post_rollback_events_tool_approvals_id_reject` | [stub] Create/invoke /rollback-events/tool-approvals/{id}/reject (guardian) |
| `GET` | /rollback-events/tools | `guardian_get_rollback_events_tools` | [stub] List/get /rollback-events/tools (guardian) |
| `POST` | /rollback-events/tools | `guardian_post_rollback_events_tools` | [stub] Create/invoke /rollback-events/tools (guardian) |
| `GET` | /rollback-events/tools/{toolId} | `guardian_get_rollback_events_tools_toolId` | [stub] List/get /rollback-events/tools/{toolId} (guardian) |
| `PATCH` | /rollback-events/tools/{toolId} | `guardian_patch_rollback_events_tools_toolId` | [stub] Patch /rollback-events/tools/{toolId} (guardian) |
| `GET` | /rollback-events/tools/{toolId}/audit | `guardian_get_rollback_events_tools_toolId_audit` | [stub] List/get /rollback-events/tools/{toolId}/audit (guardian) |
| `GET` | /rollback-events/tools/{toolId}/permissions | `guardian_get_rollback_events_tools_toolId_permissions` | [stub] List/get /rollback-events/tools/{toolId}/permissions (guardian) |
| `POST` | /rollback-events/tools/{toolId}/permissions | `guardian_post_rollback_events_tools_toolId_permissions` | [stub] Create/invoke /rollback-events/tools/{toolId}/permissions (guardian) |
| `DELETE` | /rollback-events/tools/{toolId}/permissions/{permissionId} | `guardian_delete_rollback_events_tools_toolId_permissions_permissionId` | [stub] Delete /rollback-events/tools/{toolId}/permissions/{permissionId} (guardian) |
| `GET` | /rollback-events/tools/{toolId}/versions | `guardian_get_rollback_events_tools_toolId_versions` | [stub] List/get /rollback-events/tools/{toolId}/versions (guardian) |
| `POST` | /rollback-events/tools/{toolId}/versions | `guardian_post_rollback_events_tools_toolId_versions` | [stub] Create/invoke /rollback-events/tools/{toolId}/versions (guardian) |
| `GET` | /tool-approvals/actions | `guardian_get_tool_approvals_actions` | [stub] List/get /tool-approvals/actions (guardian) |
| `GET` | /tool-approvals/actions/{id} | `guardian_get_tool_approvals_actions_id` | [stub] List/get /tool-approvals/actions/{id} (guardian) |
| `POST` | /tool-approvals/actions/{id}/approve | `guardian_post_tool_approvals_actions_id_approve` | [stub] Create/invoke /tool-approvals/actions/{id}/approve (guardian) |
| `POST` | /tool-approvals/actions/{id}/reject | `guardian_post_tool_approvals_actions_id_reject` | [stub] Create/invoke /tool-approvals/actions/{id}/reject (guardian) |
| `GET` | /tool-approvals/approvals | `guardian_get_tool_approvals_approvals` | [stub] List/get /tool-approvals/approvals (guardian) |
| `GET` | /tool-approvals/approvals/{requestId} | `guardian_get_tool_approvals_approvals_requestId` | [stub] List/get /tool-approvals/approvals/{requestId} (guardian) |
| `POST` | /tool-approvals/approvals/{requestId}/review | `guardian_post_tool_approvals_approvals_requestId_review` | [stub] Create/invoke /tool-approvals/approvals/{requestId}/review (guardian) |
| `GET` | /tool-approvals/audit/policy-decisions | `guardian_get_tool_approvals_audit_policy_decisions` | [stub] List/get /tool-approvals/audit/policy-decisions (guardian) |
| `GET` | /tool-approvals/decisions/summary | `guardian_get_tool_approvals_decisions_summary` | [stub] List/get /tool-approvals/decisions/summary (guardian) |
| `POST` | /tool-approvals/guardian/decide | `guardian_post_tool_approvals_guardian_decide` | [stub] Create/invoke /tool-approvals/guardian/decide (guardian) |
| `POST` | /tool-approvals/guardian/evaluate | `guardian_post_tool_approvals_guardian_evaluate` | [stub] Create/invoke /tool-approvals/guardian/evaluate (guardian) |
| `GET` | /tool-approvals/guardrail-configs | `guardian_get_tool_approvals_guardrail_configs` | [stub] List/get /tool-approvals/guardrail-configs (guardian) |
| `POST` | /tool-approvals/guardrail-configs | `guardian_post_tool_approvals_guardrail_configs` | [stub] Create/invoke /tool-approvals/guardrail-configs (guardian) |
| `GET` | /tool-approvals/guardrail-configs/{id} | `guardian_get_tool_approvals_guardrail_configs_id` | [stub] List/get /tool-approvals/guardrail-configs/{id} (guardian) |
| `PATCH` | /tool-approvals/guardrail-configs/{id} | `guardian_patch_tool_approvals_guardrail_configs_id` | [stub] Patch /tool-approvals/guardrail-configs/{id} (guardian) |
| `DELETE` | /tool-approvals/guardrail-configs/{id} | `guardian_delete_tool_approvals_guardrail_configs_id` | [stub] Delete /tool-approvals/guardrail-configs/{id} (guardian) |
| `GET` | /tool-approvals/ledger | `guardian_get_tool_approvals_ledger` | [stub] List/get /tool-approvals/ledger (guardian) |
| `GET` | /tool-approvals/ledger/stream | `guardian_get_tool_approvals_ledger_stream` | [stub] List/get /tool-approvals/ledger/stream (guardian) |
| `GET` | /tool-approvals/policies | `guardian_get_tool_approvals_policies` | [stub] List/get /tool-approvals/policies (guardian) |
| `POST` | /tool-approvals/policies | `guardian_post_tool_approvals_policies` | [stub] Create/invoke /tool-approvals/policies (guardian) |
| `GET` | /tool-approvals/policies/{id} | `guardian_get_tool_approvals_policies_id` | [stub] List/get /tool-approvals/policies/{id} (guardian) |
| `PATCH` | /tool-approvals/policies/{id} | `guardian_patch_tool_approvals_policies_id` | [stub] Patch /tool-approvals/policies/{id} (guardian) |
| `DELETE` | /tool-approvals/policies/{id} | `guardian_delete_tool_approvals_policies_id` | [stub] Delete /tool-approvals/policies/{id} (guardian) |
| `GET` | /tool-approvals/policies/{id}/assignments | `guardian_get_tool_approvals_policies_id_assignments` | [stub] List/get /tool-approvals/policies/{id}/assignments (guardian) |
| `POST` | /tool-approvals/policies/{id}/assignments | `guardian_post_tool_approvals_policies_id_assignments` | [stub] Create/invoke /tool-approvals/policies/{id}/assignments (guardian) |
| `DELETE` | /tool-approvals/policies/{id}/assignments/{assignmentId} | `guardian_delete_tool_approvals_policies_id_assignments_assignmentId` | [stub] Delete /tool-approvals/policies/{id}/assignments/{assignmentId} (guardian) |
| `GET` | /tool-approvals/policies/{id}/audit | `guardian_get_tool_approvals_policies_id_audit` | [stub] List/get /tool-approvals/policies/{id}/audit (guardian) |
| `GET` | /tool-approvals/policies/tiers | `guardian_get_tool_approvals_policies_tiers` | [stub] List/get /tool-approvals/policies/tiers (guardian) |
| `PATCH` | /tool-approvals/policies/tiers/{tier} | `guardian_patch_tool_approvals_policies_tiers_tier` | [stub] Patch /tool-approvals/policies/tiers/{tier} (guardian) |
| `GET` | /tool-approvals/rollback-events | `guardian_get_tool_approvals_rollback_events` | [stub] List/get /tool-approvals/rollback-events (guardian) |
| `POST` | /tool-approvals/rollback-events | `guardian_post_tool_approvals_rollback_events` | [stub] Create/invoke /tool-approvals/rollback-events (guardian) |
| `GET` | /tool-approvals/rollback-events/{id} | `guardian_get_tool_approvals_rollback_events_id` | [stub] List/get /tool-approvals/rollback-events/{id} (guardian) |
| `PATCH` | /tool-approvals/rollback-events/{id}/status | `guardian_patch_tool_approvals_rollback_events_id_status` | [stub] Patch /tool-approvals/rollback-events/{id}/status (guardian) |
| `POST` | /tool-approvals/tool-approvals | `guardian_post_tool_approvals_tool_approvals` | [stub] Create/invoke /tool-approvals/tool-approvals (guardian) |
| `POST` | /tool-approvals/tool-approvals/{id}/approve | `guardian_post_tool_approvals_tool_approvals_id_approve` | [stub] Create/invoke /tool-approvals/tool-approvals/{id}/approve (guardian) |
| `POST` | /tool-approvals/tool-approvals/{id}/reject | `guardian_post_tool_approvals_tool_approvals_id_reject` | [stub] Create/invoke /tool-approvals/tool-approvals/{id}/reject (guardian) |
| `GET` | /tool-approvals/tools | `guardian_get_tool_approvals_tools` | [stub] List/get /tool-approvals/tools (guardian) |
| `POST` | /tool-approvals/tools | `guardian_post_tool_approvals_tools` | [stub] Create/invoke /tool-approvals/tools (guardian) |
| `GET` | /tool-approvals/tools/{toolId} | `guardian_get_tool_approvals_tools_toolId` | [stub] List/get /tool-approvals/tools/{toolId} (guardian) |
| `PATCH` | /tool-approvals/tools/{toolId} | `guardian_patch_tool_approvals_tools_toolId` | [stub] Patch /tool-approvals/tools/{toolId} (guardian) |
| `GET` | /tool-approvals/tools/{toolId}/audit | `guardian_get_tool_approvals_tools_toolId_audit` | [stub] List/get /tool-approvals/tools/{toolId}/audit (guardian) |
| `GET` | /tool-approvals/tools/{toolId}/permissions | `guardian_get_tool_approvals_tools_toolId_permissions` | [stub] List/get /tool-approvals/tools/{toolId}/permissions (guardian) |
| `POST` | /tool-approvals/tools/{toolId}/permissions | `guardian_post_tool_approvals_tools_toolId_permissions` | [stub] Create/invoke /tool-approvals/tools/{toolId}/permissions (guardian) |
| `DELETE` | /tool-approvals/tools/{toolId}/permissions/{permissionId} | `guardian_delete_tool_approvals_tools_toolId_permissions_permissionId` | [stub] Delete /tool-approvals/tools/{toolId}/permissions/{permissionId} (guardian) |
| `GET` | /tool-approvals/tools/{toolId}/versions | `guardian_get_tool_approvals_tools_toolId_versions` | [stub] List/get /tool-approvals/tools/{toolId}/versions (guardian) |
| `POST` | /tool-approvals/tools/{toolId}/versions | `guardian_post_tool_approvals_tools_toolId_versions` | [stub] Create/invoke /tool-approvals/tools/{toolId}/versions (guardian) |
| `GET` | /tools/actions | `guardian_get_tools_actions` | [stub] List/get /tools/actions (guardian) |
| `GET` | /tools/actions/{id} | `guardian_get_tools_actions_id` | [stub] List/get /tools/actions/{id} (guardian) |
| `POST` | /tools/actions/{id}/approve | `guardian_post_tools_actions_id_approve` | [stub] Create/invoke /tools/actions/{id}/approve (guardian) |
| `POST` | /tools/actions/{id}/reject | `guardian_post_tools_actions_id_reject` | [stub] Create/invoke /tools/actions/{id}/reject (guardian) |
| `GET` | /tools/approvals | `guardian_get_tools_approvals` | [stub] List/get /tools/approvals (guardian) |
| `GET` | /tools/approvals/{requestId} | `guardian_get_tools_approvals_requestId` | [stub] List/get /tools/approvals/{requestId} (guardian) |
| `POST` | /tools/approvals/{requestId}/review | `guardian_post_tools_approvals_requestId_review` | [stub] Create/invoke /tools/approvals/{requestId}/review (guardian) |
| `GET` | /tools/audit/policy-decisions | `guardian_get_tools_audit_policy_decisions` | [stub] List/get /tools/audit/policy-decisions (guardian) |
| `GET` | /tools/decisions/summary | `guardian_get_tools_decisions_summary` | [stub] List/get /tools/decisions/summary (guardian) |
| `POST` | /tools/guardian/decide | `guardian_post_tools_guardian_decide` | [stub] Create/invoke /tools/guardian/decide (guardian) |
| `POST` | /tools/guardian/evaluate | `guardian_post_tools_guardian_evaluate` | [stub] Create/invoke /tools/guardian/evaluate (guardian) |
| `GET` | /tools/guardrail-configs | `guardian_get_tools_guardrail_configs` | [stub] List/get /tools/guardrail-configs (guardian) |
| `POST` | /tools/guardrail-configs | `guardian_post_tools_guardrail_configs` | [stub] Create/invoke /tools/guardrail-configs (guardian) |
| `GET` | /tools/guardrail-configs/{id} | `guardian_get_tools_guardrail_configs_id` | [stub] List/get /tools/guardrail-configs/{id} (guardian) |
| `PATCH` | /tools/guardrail-configs/{id} | `guardian_patch_tools_guardrail_configs_id` | [stub] Patch /tools/guardrail-configs/{id} (guardian) |
| `DELETE` | /tools/guardrail-configs/{id} | `guardian_delete_tools_guardrail_configs_id` | [stub] Delete /tools/guardrail-configs/{id} (guardian) |
| `GET` | /tools/ledger | `guardian_get_tools_ledger` | [stub] List/get /tools/ledger (guardian) |
| `GET` | /tools/ledger/stream | `guardian_get_tools_ledger_stream` | [stub] List/get /tools/ledger/stream (guardian) |
| `GET` | /tools/policies | `guardian_get_tools_policies` | [stub] List/get /tools/policies (guardian) |
| `POST` | /tools/policies | `guardian_post_tools_policies` | [stub] Create/invoke /tools/policies (guardian) |
| `GET` | /tools/policies/{id} | `guardian_get_tools_policies_id` | [stub] List/get /tools/policies/{id} (guardian) |
| `PATCH` | /tools/policies/{id} | `guardian_patch_tools_policies_id` | [stub] Patch /tools/policies/{id} (guardian) |
| `DELETE` | /tools/policies/{id} | `guardian_delete_tools_policies_id` | [stub] Delete /tools/policies/{id} (guardian) |
| `GET` | /tools/policies/{id}/assignments | `guardian_get_tools_policies_id_assignments` | [stub] List/get /tools/policies/{id}/assignments (guardian) |
| `POST` | /tools/policies/{id}/assignments | `guardian_post_tools_policies_id_assignments` | [stub] Create/invoke /tools/policies/{id}/assignments (guardian) |
| `DELETE` | /tools/policies/{id}/assignments/{assignmentId} | `guardian_delete_tools_policies_id_assignments_assignmentId` | [stub] Delete /tools/policies/{id}/assignments/{assignmentId} (guardian) |
| `GET` | /tools/policies/{id}/audit | `guardian_get_tools_policies_id_audit` | [stub] List/get /tools/policies/{id}/audit (guardian) |
| `GET` | /tools/policies/tiers | `guardian_get_tools_policies_tiers` | [stub] List/get /tools/policies/tiers (guardian) |
| `PATCH` | /tools/policies/tiers/{tier} | `guardian_patch_tools_policies_tiers_tier` | [stub] Patch /tools/policies/tiers/{tier} (guardian) |
| `GET` | /tools/rollback-events | `guardian_get_tools_rollback_events` | [stub] List/get /tools/rollback-events (guardian) |
| `POST` | /tools/rollback-events | `guardian_post_tools_rollback_events` | [stub] Create/invoke /tools/rollback-events (guardian) |
| `GET` | /tools/rollback-events/{id} | `guardian_get_tools_rollback_events_id` | [stub] List/get /tools/rollback-events/{id} (guardian) |
| `PATCH` | /tools/rollback-events/{id}/status | `guardian_patch_tools_rollback_events_id_status` | [stub] Patch /tools/rollback-events/{id}/status (guardian) |
| `POST` | /tools/tool-approvals | `guardian_post_tools_tool_approvals` | [stub] Create/invoke /tools/tool-approvals (guardian) |
| `POST` | /tools/tool-approvals/{id}/approve | `guardian_post_tools_tool_approvals_id_approve` | [stub] Create/invoke /tools/tool-approvals/{id}/approve (guardian) |
| `POST` | /tools/tool-approvals/{id}/reject | `guardian_post_tools_tool_approvals_id_reject` | [stub] Create/invoke /tools/tool-approvals/{id}/reject (guardian) |
| `GET` | /tools/tools | `guardian_get_tools_tools` | [stub] List/get /tools/tools (guardian) |
| `POST` | /tools/tools | `guardian_post_tools_tools` | [stub] Create/invoke /tools/tools (guardian) |
| `GET` | /tools/tools/{toolId} | `guardian_get_tools_tools_toolId` | [stub] List/get /tools/tools/{toolId} (guardian) |
| `PATCH` | /tools/tools/{toolId} | `guardian_patch_tools_tools_toolId` | [stub] Patch /tools/tools/{toolId} (guardian) |
| `GET` | /tools/tools/{toolId}/audit | `guardian_get_tools_tools_toolId_audit` | [stub] List/get /tools/tools/{toolId}/audit (guardian) |
| `GET` | /tools/tools/{toolId}/permissions | `guardian_get_tools_tools_toolId_permissions` | [stub] List/get /tools/tools/{toolId}/permissions (guardian) |
| `POST` | /tools/tools/{toolId}/permissions | `guardian_post_tools_tools_toolId_permissions` | [stub] Create/invoke /tools/tools/{toolId}/permissions (guardian) |
| `DELETE` | /tools/tools/{toolId}/permissions/{permissionId} | `guardian_delete_tools_tools_toolId_permissions_permissionId` | [stub] Delete /tools/tools/{toolId}/permissions/{permissionId} (guardian) |
| `GET` | /tools/tools/{toolId}/versions | `guardian_get_tools_tools_toolId_versions` | [stub] List/get /tools/tools/{toolId}/versions (guardian) |
| `POST` | /tools/tools/{toolId}/versions | `guardian_post_tools_tools_toolId_versions` | [stub] Create/invoke /tools/tools/{toolId}/versions (guardian) |

<a id="health-integrations"></a>

## health-integrations

Auto-generated tag for health-integrations route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /health/health/ai | `health_integrations_get_health_health_ai` | [stub] List/get /health/health/ai (health-integrations) |
| `GET` | /health/health/billing | `health_integrations_get_health_health_billing` | [stub] List/get /health/health/billing (health-integrations) |
| `GET` | /health/health/external-feeds | `health_integrations_get_health_health_external_feeds` | [stub] List/get /health/health/external-feeds (health-integrations) |
| `GET` | /health/health/external-feeds/refresh | `health_integrations_get_health_health_external_feeds_refresh` | [stub] List/get /health/health/external-feeds/refresh (health-integrations) |
| `GET` | /health/health/integrations | `health_integrations_get_health_health_integrations` | [stub] List/get /health/health/integrations (health-integrations) |
| `GET` | /health/health/integrations/refresh | `health_integrations_get_health_health_integrations_refresh` | [stub] List/get /health/health/integrations/refresh (health-integrations) |
| `GET` | /health/health/websocket | `health_integrations_get_health_health_websocket` | [stub] List/get /health/health/websocket (health-integrations) |
| `GET` | /health/integrations/cisa/kev | `health_integrations_get_health_integrations_cisa_kev` | [stub] List/get /health/integrations/cisa/kev (health-integrations) |
| `GET` | /health/integrations/cisa/kev/ransomware | `health_integrations_get_health_integrations_cisa_kev_ransomware` | [stub] List/get /health/integrations/cisa/kev/ransomware (health-integrations) |
| `GET` | /health/integrations/cisa/kev/search | `health_integrations_get_health_integrations_cisa_kev_search` | [stub] List/get /health/integrations/cisa/kev/search (health-integrations) |
| `GET` | /health/integrations/health | `health_integrations_get_health_integrations_health` | [stub] List/get /health/integrations/health (health-integrations) |
| `GET` | /health/integrations/health/{name} | `health_integrations_get_health_integrations_health_name` | [stub] List/get /health/integrations/health/{name} (health-integrations) |
| `GET` | /health/integrations/health/live | `health_integrations_get_health_integrations_health_live` | [stub] List/get /health/integrations/health/live (health-integrations) |
| `GET` | /health/integrations/health/test | `health_integrations_get_health_integrations_health_test` | [stub] List/get /health/integrations/health/test (health-integrations) |
| `GET` | /health/integrations/misp-taxii/collections | `health_integrations_get_health_integrations_misp_taxii_collections` | [stub] List/get /health/integrations/misp-taxii/collections (health-integrations) |
| `GET` | /health/integrations/misp-taxii/indicators | `health_integrations_get_health_integrations_misp_taxii_indicators` | [stub] List/get /health/integrations/misp-taxii/indicators (health-integrations) |
| `GET` | /health/integrations/new-relic/alerts | `health_integrations_get_health_integrations_new_relic_alerts` | [stub] List/get /health/integrations/new-relic/alerts (health-integrations) |
| `GET` | /health/integrations/new-relic/apm | `health_integrations_get_health_integrations_new_relic_apm` | [stub] List/get /health/integrations/new-relic/apm (health-integrations) |
| `GET` | /health/integrations/new-relic/hosts | `health_integrations_get_health_integrations_new_relic_hosts` | [stub] List/get /health/integrations/new-relic/hosts (health-integrations) |
| `GET` | /health/integrations/nvd/cves | `health_integrations_get_health_integrations_nvd_cves` | [stub] List/get /health/integrations/nvd/cves (health-integrations) |
| `GET` | /health/integrations/nvd/cves/critical | `health_integrations_get_health_integrations_nvd_cves_critical` | [stub] List/get /health/integrations/nvd/cves/critical (health-integrations) |
| `GET` | /health/integrations/nvidia-dcgm/cluster | `health_integrations_get_health_integrations_nvidia_dcgm_cluster` | [stub] List/get /health/integrations/nvidia-dcgm/cluster (health-integrations) |
| `GET` | /health/integrations/nvidia-dcgm/gpus | `health_integrations_get_health_integrations_nvidia_dcgm_gpus` | [stub] List/get /health/integrations/nvidia-dcgm/gpus (health-integrations) |
| `GET` | /integrations/health/ai | `health_integrations_get_integrations_health_ai` | [stub] List/get /integrations/health/ai (health-integrations) |
| `GET` | /integrations/health/billing | `health_integrations_get_integrations_health_billing` | [stub] List/get /integrations/health/billing (health-integrations) |
| `GET` | /integrations/health/external-feeds | `health_integrations_get_integrations_health_external_feeds` | [stub] List/get /integrations/health/external-feeds (health-integrations) |
| `GET` | /integrations/health/external-feeds/refresh | `health_integrations_get_integrations_health_external_feeds_refresh` | [stub] List/get /integrations/health/external-feeds/refresh (health-integrations) |
| `GET` | /integrations/health/integrations | `health_integrations_get_integrations_health_integrations` | [stub] List/get /integrations/health/integrations (health-integrations) |
| `GET` | /integrations/health/integrations/refresh | `health_integrations_get_integrations_health_integrations_refresh` | [stub] List/get /integrations/health/integrations/refresh (health-integrations) |
| `GET` | /integrations/health/websocket | `health_integrations_get_integrations_health_websocket` | [stub] List/get /integrations/health/websocket (health-integrations) |
| `GET` | /integrations/integrations/cisa/kev | `health_integrations_get_integrations_integrations_cisa_kev` | [stub] List/get /integrations/integrations/cisa/kev (health-integrations) |
| `GET` | /integrations/integrations/cisa/kev/ransomware | `health_integrations_get_integrations_integrations_cisa_kev_ransomware` | [stub] List/get /integrations/integrations/cisa/kev/ransomware (health-integrations) |
| `GET` | /integrations/integrations/cisa/kev/search | `health_integrations_get_integrations_integrations_cisa_kev_search` | [stub] List/get /integrations/integrations/cisa/kev/search (health-integrations) |
| `GET` | /integrations/integrations/health | `health_integrations_get_integrations_integrations_health` | [stub] List/get /integrations/integrations/health (health-integrations) |
| `GET` | /integrations/integrations/health/{name} | `health_integrations_get_integrations_integrations_health_name` | [stub] List/get /integrations/integrations/health/{name} (health-integrations) |
| `GET` | /integrations/integrations/health/live | `health_integrations_get_integrations_integrations_health_live` | [stub] List/get /integrations/integrations/health/live (health-integrations) |
| `GET` | /integrations/integrations/health/test | `health_integrations_get_integrations_integrations_health_test` | [stub] List/get /integrations/integrations/health/test (health-integrations) |
| `GET` | /integrations/integrations/misp-taxii/collections | `health_integrations_get_integrations_integrations_misp_taxii_collections` | [stub] List/get /integrations/integrations/misp-taxii/collections (health-integrations) |
| `GET` | /integrations/integrations/misp-taxii/indicators | `health_integrations_get_integrations_integrations_misp_taxii_indicators` | [stub] List/get /integrations/integrations/misp-taxii/indicators (health-integrations) |
| `GET` | /integrations/integrations/new-relic/alerts | `health_integrations_get_integrations_integrations_new_relic_alerts` | [stub] List/get /integrations/integrations/new-relic/alerts (health-integrations) |
| `GET` | /integrations/integrations/new-relic/apm | `health_integrations_get_integrations_integrations_new_relic_apm` | [stub] List/get /integrations/integrations/new-relic/apm (health-integrations) |
| `GET` | /integrations/integrations/new-relic/hosts | `health_integrations_get_integrations_integrations_new_relic_hosts` | [stub] List/get /integrations/integrations/new-relic/hosts (health-integrations) |
| `GET` | /integrations/integrations/nvd/cves | `health_integrations_get_integrations_integrations_nvd_cves` | [stub] List/get /integrations/integrations/nvd/cves (health-integrations) |
| `GET` | /integrations/integrations/nvd/cves/critical | `health_integrations_get_integrations_integrations_nvd_cves_critical` | [stub] List/get /integrations/integrations/nvd/cves/critical (health-integrations) |
| `GET` | /integrations/integrations/nvidia-dcgm/cluster | `health_integrations_get_integrations_integrations_nvidia_dcgm_cluster` | [stub] List/get /integrations/integrations/nvidia-dcgm/cluster (health-integrations) |
| `GET` | /integrations/integrations/nvidia-dcgm/gpus | `health_integrations_get_integrations_integrations_nvidia_dcgm_gpus` | [stub] List/get /integrations/integrations/nvidia-dcgm/gpus (health-integrations) |

<a id="identity"></a>

## identity

Auto-generated tag for identity route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /identity/admin/tenants/{id}/branding | `identity_get_identity_admin_tenants_id_branding` | [stub] List/get /identity/admin/tenants/{id}/branding (identity) |
| `PUT` | /identity/admin/tenants/{id}/branding | `identity_put_identity_admin_tenants_id_branding` | [stub] Update /identity/admin/tenants/{id}/branding (identity) |
| `DELETE` | /identity/admin/tenants/{id}/branding | `identity_delete_identity_admin_tenants_id_branding` | [stub] Delete /identity/admin/tenants/{id}/branding (identity) |
| `GET` | /identity/admin/tenants/{id}/scim/provisioned-users | `identity_get_identity_admin_tenants_id_scim_provisioned_users` | [stub] List/get /identity/admin/tenants/{id}/scim/provisioned-users (identity) |
| `POST` | /identity/admin/tenants/{id}/scim/sync | `identity_post_identity_admin_tenants_id_scim_sync` | [stub] Create/invoke /identity/admin/tenants/{id}/scim/sync (identity) |
| `GET` | /identity/admin/tenants/{id}/scim/tokens | `identity_get_identity_admin_tenants_id_scim_tokens` | [stub] List/get /identity/admin/tenants/{id}/scim/tokens (identity) |
| `POST` | /identity/admin/tenants/{id}/scim/tokens | `identity_post_identity_admin_tenants_id_scim_tokens` | [stub] Create/invoke /identity/admin/tenants/{id}/scim/tokens (identity) |
| `DELETE` | /identity/admin/tenants/{id}/scim/tokens/{tokenId} | `identity_delete_identity_admin_tenants_id_scim_tokens_tokenId` | [stub] Delete /identity/admin/tenants/{id}/scim/tokens/{tokenId} (identity) |
| `GET` | /identity/tenant-branding/{azureTenantId} | `identity_get_identity_tenant_branding_azureTenantId` | [stub] List/get /identity/tenant-branding/{azureTenantId} (identity) |

<a id="imperium"></a>

## imperium

Auto-generated tag for imperium route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /imperium/imperium/centurion/profiles | `imperium_get_imperium_imperium_centurion_profiles` | [stub] List/get /imperium/imperium/centurion/profiles (imperium) |
| `POST` | /imperium/imperium/centurion/query | `imperium_post_imperium_imperium_centurion_query` | [stub] Create/invoke /imperium/imperium/centurion/query (imperium) |
| `GET` | /imperium/imperium/cloud/metrics | `imperium_get_imperium_imperium_cloud_metrics` | [stub] List/get /imperium/imperium/cloud/metrics (imperium) |
| `GET` | /imperium/imperium/cloud/resources | `imperium_get_imperium_imperium_cloud_resources` | [stub] List/get /imperium/imperium/cloud/resources (imperium) |
| `GET` | /imperium/imperium/cloud/sentinels | `imperium_get_imperium_imperium_cloud_sentinels` | [stub] List/get /imperium/imperium/cloud/sentinels (imperium) |
| `GET` | /imperium/imperium/intelligence/briefs | `imperium_get_imperium_imperium_intelligence_briefs` | [stub] List/get /imperium/imperium/intelligence/briefs (imperium) |
| `GET` | /imperium/imperium/senate/proposals | `imperium_get_imperium_imperium_senate_proposals` | [stub] List/get /imperium/imperium/senate/proposals (imperium) |
| `GET` | /imperium/imperium/supply-lines/status | `imperium_get_imperium_imperium_supply_lines_status` | [stub] List/get /imperium/imperium/supply-lines/status (imperium) |

<a id="incidents-alerts"></a>

## incidents-alerts

Auto-generated tag for incidents-alerts route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /incidents-alerts/firestorm/alerts | `incidents_alerts_get_incidents_alerts_firestorm_alerts` | [stub] List/get /incidents-alerts/firestorm/alerts (incidents-alerts) |
| `POST` | /incidents-alerts/firestorm/alerts | `incidents_alerts_post_incidents_alerts_firestorm_alerts` | [stub] Create/invoke /incidents-alerts/firestorm/alerts (incidents-alerts) |
| `PUT` | /incidents-alerts/firestorm/alerts/{id} | `incidents_alerts_put_incidents_alerts_firestorm_alerts_id` | [stub] Update /incidents-alerts/firestorm/alerts/{id} (incidents-alerts) |
| `GET` | /incidents-alerts/firestorm/compliance | `incidents_alerts_get_incidents_alerts_firestorm_compliance` | [stub] List/get /incidents-alerts/firestorm/compliance (incidents-alerts) |
| `PUT` | /incidents-alerts/firestorm/compliance/{controlId} | `incidents_alerts_put_incidents_alerts_firestorm_compliance_controlId` | [stub] Update /incidents-alerts/firestorm/compliance/{controlId} (incidents-alerts) |
| `GET` | /incidents-alerts/firestorm/cves | `incidents_alerts_get_incidents_alerts_firestorm_cves` | [stub] List/get /incidents-alerts/firestorm/cves (incidents-alerts) |
| `GET` | /incidents-alerts/firestorm/incidents | `incidents_alerts_get_incidents_alerts_firestorm_incidents` | [stub] List/get /incidents-alerts/firestorm/incidents (incidents-alerts) |
| `POST` | /incidents-alerts/firestorm/incidents | `incidents_alerts_post_incidents_alerts_firestorm_incidents` | [stub] Create/invoke /incidents-alerts/firestorm/incidents (incidents-alerts) |
| `GET` | /incidents-alerts/firestorm/incidents/{id} | `incidents_alerts_get_incidents_alerts_firestorm_incidents_id` | [stub] List/get /incidents-alerts/firestorm/incidents/{id} (incidents-alerts) |
| `PUT` | /incidents-alerts/firestorm/incidents/{id} | `incidents_alerts_put_incidents_alerts_firestorm_incidents_id` | [stub] Update /incidents-alerts/firestorm/incidents/{id} (incidents-alerts) |
| `DELETE` | /incidents-alerts/firestorm/incidents/{id} | `incidents_alerts_delete_incidents_alerts_firestorm_incidents_id` | [stub] Delete /incidents-alerts/firestorm/incidents/{id} (incidents-alerts) |
| `GET` | /incidents-alerts/firestorm/soc-dashboard | `incidents_alerts_get_incidents_alerts_firestorm_soc_dashboard` | [stub] List/get /incidents-alerts/firestorm/soc-dashboard (incidents-alerts) |
| `GET` | /incidents-alerts/firestorm/vulnerabilities | `incidents_alerts_get_incidents_alerts_firestorm_vulnerabilities` | [stub] List/get /incidents-alerts/firestorm/vulnerabilities (incidents-alerts) |
| `GET` | /incidents-alerts/firestorm/vulnerabilities/{id} | `incidents_alerts_get_incidents_alerts_firestorm_vulnerabilities_id` | [stub] List/get /incidents-alerts/firestorm/vulnerabilities/{id} (incidents-alerts) |
| `PUT` | /incidents-alerts/firestorm/vulnerabilities/{id} | `incidents_alerts_put_incidents_alerts_firestorm_vulnerabilities_id` | [stub] Update /incidents-alerts/firestorm/vulnerabilities/{id} (incidents-alerts) |
| `GET` | /incidents-alerts/firestorm/vulnerability-inventory | `incidents_alerts_get_incidents_alerts_firestorm_vulnerability_inventory` | [stub] List/get /incidents-alerts/firestorm/vulnerability-inventory (incidents-alerts) |

<a id="infrastructure-status"></a>

## infrastructure-status

Auto-generated tag for infrastructure-status route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /infrastructure/infrastructure/status | `infrastructure_status_get_infrastructure_infrastructure_status` | [stub] List/get /infrastructure/infrastructure/status (infrastructure-status) |

<a id="innovation-engine"></a>

## innovation-engine

Auto-generated tag for innovation-engine route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /lyte/ambient-signals | `innovation_engine_get_lyte_ambient_signals` | [stub] List/get /lyte/ambient-signals (innovation-engine) |
| `GET` | /lyte/correlations | `innovation_engine_get_lyte_correlations` | [stub] List/get /lyte/correlations (innovation-engine) |
| `GET` | /lyte/decision-items | `innovation_engine_get_lyte_decision_items` | [stub] List/get /lyte/decision-items (innovation-engine) |
| `GET` | /lyte/energy-metrics | `innovation_engine_get_lyte_energy_metrics` | [stub] List/get /lyte/energy-metrics (innovation-engine) |
| `GET` | /lyte/stakeholder-views/{lens} | `innovation_engine_get_lyte_stakeholder_views_lens` | [stub] List/get /lyte/stakeholder-views/{lens} (innovation-engine) |

<a id="integrations"></a>

## integrations

Auto-generated tag for integrations route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /integrations/admin/billing | `integrations_get_integrations_admin_billing` | [stub] List/get /integrations/admin/billing (integrations) |
| `GET` | /integrations/admin/connectors | `integrations_get_integrations_admin_connectors` | [stub] List/get /integrations/admin/connectors (integrations) |
| `PUT` | /integrations/admin/connectors/{name}/enable | `integrations_put_integrations_admin_connectors_name_enable` | [stub] Update /integrations/admin/connectors/{name}/enable (integrations) |
| `POST` | /integrations/admin/connectors/{name}/sync | `integrations_post_integrations_admin_connectors_name_sync` | [stub] Create/invoke /integrations/admin/connectors/{name}/sync (integrations) |
| `POST` | /integrations/admin/connectors/{name}/test | `integrations_post_integrations_admin_connectors_name_test` | [stub] Create/invoke /integrations/admin/connectors/{name}/test (integrations) |
| `GET` | /integrations/admin/files | `integrations_get_integrations_admin_files` | [stub] List/get /integrations/admin/files (integrations) |
| `GET` | /integrations/admin/integration-activity | `integrations_get_integrations_admin_integration_activity` | [stub] List/get /integrations/admin/integration-activity (integrations) |
| `GET` | /integrations/admin/integration-health | `integrations_get_integrations_admin_integration_health` | [stub] List/get /integrations/admin/integration-health (integrations) |
| `GET` | /integrations/admin/provisioning | `integrations_get_integrations_admin_provisioning` | [stub] List/get /integrations/admin/provisioning (integrations) |
| `GET` | /integrations/admin/webhooks | `integrations_get_integrations_admin_webhooks` | [stub] List/get /integrations/admin/webhooks (integrations) |
| `GET` | /integrations/integrations/atlassian/descriptor | `integrations_get_integrations_integrations_atlassian_descriptor` | [stub] List/get /integrations/integrations/atlassian/descriptor (integrations) |
| `PUT` | /integrations/integrations/atlassian/tenant | `integrations_put_integrations_integrations_atlassian_tenant` | [stub] Update /integrations/integrations/atlassian/tenant (integrations) |
| `GET` | /integrations/integrations/atlassian/tenant/{clientKey} | `integrations_get_integrations_integrations_atlassian_tenant_clientKey` | [stub] List/get /integrations/integrations/atlassian/tenant/{clientKey} (integrations) |
| `DELETE` | /integrations/integrations/atlassian/tenant/{clientKey} | `integrations_delete_integrations_integrations_atlassian_tenant_clientKey` | [stub] Delete /integrations/integrations/atlassian/tenant/{clientKey} (integrations) |
| `POST` | /integrations/integrations/jira/ingest-signals | `integrations_post_integrations_integrations_jira_ingest_signals` | [stub] Create/invoke /integrations/integrations/jira/ingest-signals (integrations) |
| `GET` | /integrations/integrations/jira/oauth/callback | `integrations_get_integrations_integrations_jira_oauth_callback` | [stub] List/get /integrations/integrations/jira/oauth/callback (integrations) |
| `POST` | /integrations/integrations/jira/push/issue | `integrations_post_integrations_integrations_jira_push_issue` | [stub] Create/invoke /integrations/integrations/jira/push/issue (integrations) |
| `GET` | /integrations/integrations/jira/query | `integrations_get_integrations_integrations_jira_query` | [stub] List/get /integrations/integrations/jira/query (integrations) |
| `GET` | /integrations/integrations/jira/status | `integrations_get_integrations_integrations_jira_status` | [stub] List/get /integrations/integrations/jira/status (integrations) |
| `POST` | /integrations/integrations/jira/sync | `integrations_post_integrations_integrations_jira_sync` | [stub] Create/invoke /integrations/integrations/jira/sync (integrations) |
| `POST` | /integrations/integrations/jira/webhook | `integrations_post_integrations_integrations_jira_webhook` | [stub] Create/invoke /integrations/integrations/jira/webhook (integrations) |
| `POST` | /integrations/integrations/salesforce/ingest-signals | `integrations_post_integrations_integrations_salesforce_ingest_signals` | [stub] Create/invoke /integrations/integrations/salesforce/ingest-signals (integrations) |
| `GET` | /integrations/integrations/salesforce/oauth/authorize | `integrations_get_integrations_integrations_salesforce_oauth_authorize` | [stub] List/get /integrations/integrations/salesforce/oauth/authorize (integrations) |
| `GET` | /integrations/integrations/salesforce/oauth/callback | `integrations_get_integrations_integrations_salesforce_oauth_callback` | [stub] List/get /integrations/integrations/salesforce/oauth/callback (integrations) |
| `GET` | /integrations/integrations/salesforce/pipeline-health | `integrations_get_integrations_integrations_salesforce_pipeline_health` | [stub] List/get /integrations/integrations/salesforce/pipeline-health (integrations) |
| `POST` | /integrations/integrations/salesforce/push/case | `integrations_post_integrations_integrations_salesforce_push_case` | [stub] Create/invoke /integrations/integrations/salesforce/push/case (integrations) |
| `POST` | /integrations/integrations/salesforce/push/task | `integrations_post_integrations_integrations_salesforce_push_task` | [stub] Create/invoke /integrations/integrations/salesforce/push/task (integrations) |
| `GET` | /integrations/integrations/salesforce/query | `integrations_get_integrations_integrations_salesforce_query` | [stub] List/get /integrations/integrations/salesforce/query (integrations) |
| `GET` | /integrations/integrations/salesforce/status | `integrations_get_integrations_integrations_salesforce_status` | [stub] List/get /integrations/integrations/salesforce/status (integrations) |
| `POST` | /integrations/integrations/salesforce/sync | `integrations_post_integrations_integrations_salesforce_sync` | [stub] Create/invoke /integrations/integrations/salesforce/sync (integrations) |
| `POST` | /integrations/integrations/salesforce/webhook | `integrations_post_integrations_integrations_salesforce_webhook` | [stub] Create/invoke /integrations/integrations/salesforce/webhook (integrations) |

<a id="investor-analytics"></a>

## investor-analytics

Auto-generated tag for investor-analytics route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /investor-analytics/investor-analytics/audit-diffs | `investor_analytics_get_investor_analytics_investor_analytics_audit_diffs` | [stub] List/get /investor-analytics/investor-analytics/audit-diffs (investor-analytics) |
| `GET` | /investor-analytics/investor-analytics/cohort | `investor_analytics_get_investor_analytics_investor_analytics_cohort` | [stub] List/get /investor-analytics/investor-analytics/cohort (investor-analytics) |
| `GET` | /investor-analytics/investor-analytics/data-room-docs | `investor_analytics_get_investor_analytics_investor_analytics_data_room_docs` | [stub] List/get /investor-analytics/investor-analytics/data-room-docs (investor-analytics) |
| `GET` | /investor-analytics/investor-analytics/data-room-engagement | `investor_analytics_get_investor_analytics_investor_analytics_data_room_engagement` | [stub] List/get /investor-analytics/investor-analytics/data-room-engagement (investor-analytics) |
| `GET` | /investor-analytics/investor-analytics/funnel | `investor_analytics_get_investor_analytics_investor_analytics_funnel` | [stub] List/get /investor-analytics/investor-analytics/funnel (investor-analytics) |
| `GET` | /investor-analytics/investor-analytics/metrics | `investor_analytics_get_investor_analytics_investor_analytics_metrics` | [stub] List/get /investor-analytics/investor-analytics/metrics (investor-analytics) |

<a id="invitations"></a>

## invitations

Auto-generated tag for invitations route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /orgs/orgs/{orgSlug}/invitations | `invitations_get_orgs_orgs_orgSlug_invitations` | [stub] List/get /orgs/orgs/{orgSlug}/invitations (invitations) |
| `DELETE` | /orgs/orgs/{orgSlug}/invitations/{invitationId} | `invitations_delete_orgs_orgs_orgSlug_invitations_invitationId` | [stub] Delete /orgs/orgs/{orgSlug}/invitations/{invitationId} (invitations) |
| `POST` | /orgs/orgs/{orgSlug}/invite | `invitations_post_orgs_orgs_orgSlug_invite` | [stub] Create/invoke /orgs/orgs/{orgSlug}/invite (invitations) |
| `GET` | /orgs/orgs/accept-invite | `invitations_get_orgs_orgs_accept_invite` | [stub] List/get /orgs/orgs/accept-invite (invitations) |
| `POST` | /orgs/orgs/accept-invite | `invitations_post_orgs_orgs_accept_invite` | [stub] Create/invoke /orgs/orgs/accept-invite (invitations) |

<a id="jobs"></a>

## jobs

Auto-generated tag for jobs route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `POST` | /jobs/jobs/durable/{jobId}/cancel | `jobs_post_jobs_jobs_durable_jobId_cancel` | [stub] Create/invoke /jobs/jobs/durable/{jobId}/cancel (jobs) |
| `GET` | /jobs/jobs/durable/dashboard | `jobs_get_jobs_jobs_durable_dashboard` | [stub] List/get /jobs/jobs/durable/dashboard (jobs) |
| `GET` | /jobs/jobs/durable/dead-letter | `jobs_get_jobs_jobs_durable_dead_letter` | [stub] List/get /jobs/jobs/durable/dead-letter (jobs) |
| `POST` | /jobs/jobs/durable/dead-letter/{jobId}/replay | `jobs_post_jobs_jobs_durable_dead_letter_jobId_replay` | [stub] Create/invoke /jobs/jobs/durable/dead-letter/{jobId}/replay (jobs) |
| `POST` | /jobs/jobs/durable/enqueue | `jobs_post_jobs_jobs_durable_enqueue` | [stub] Create/invoke /jobs/jobs/durable/enqueue (jobs) |
| `GET` | /jobs/jobs/durable/recent | `jobs_get_jobs_jobs_durable_recent` | [stub] List/get /jobs/jobs/durable/recent (jobs) |
| `GET` | /jobs/jobs/durable/stats | `jobs_get_jobs_jobs_durable_stats` | [stub] List/get /jobs/jobs/durable/stats (jobs) |
| `POST` | /jobs/jobs/enqueue | `jobs_post_jobs_jobs_enqueue` | [stub] Create/invoke /jobs/jobs/enqueue (jobs) |
| `GET` | /jobs/jobs/recent | `jobs_get_jobs_jobs_recent` | [stub] List/get /jobs/jobs/recent (jobs) |
| `GET` | /jobs/jobs/registry | `jobs_get_jobs_jobs_registry` | [stub] List/get /jobs/jobs/registry (jobs) |
| `GET` | /jobs/jobs/schedules | `jobs_get_jobs_jobs_schedules` | [stub] List/get /jobs/jobs/schedules (jobs) |
| `PATCH` | /jobs/jobs/schedules/{name}/enable | `jobs_patch_jobs_jobs_schedules_name_enable` | [stub] Patch /jobs/jobs/schedules/{name}/enable (jobs) |
| `POST` | /jobs/jobs/schedules/{name}/trigger | `jobs_post_jobs_jobs_schedules_name_trigger` | [stub] Create/invoke /jobs/jobs/schedules/{name}/trigger (jobs) |
| `GET` | /jobs/jobs/stats | `jobs_get_jobs_jobs_stats` | [stub] List/get /jobs/jobs/stats (jobs) |
| `GET` | /jobs/jobs/status | `jobs_get_jobs_jobs_status` | [stub] List/get /jobs/jobs/status (jobs) |
| `POST` | /jobs/jobs/trigger/{type} | `jobs_post_jobs_jobs_trigger_type` | [stub] Create/invoke /jobs/jobs/trigger/{type} (jobs) |
| `GET` | /jobs/jobs/types | `jobs_get_jobs_jobs_types` | [stub] List/get /jobs/jobs/types (jobs) |

<a id="knowledge-graph"></a>

## knowledge-graph

Auto-generated tag for knowledge-graph route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /ai/centrality | `knowledge_graph_get_ai_centrality` | [stub] List/get /ai/centrality (knowledge-graph) |
| `GET` | /ai/communities | `knowledge_graph_get_ai_communities` | [stub] List/get /ai/communities (knowledge-graph) |
| `POST` | /ai/cross-domain | `knowledge_graph_post_ai_cross_domain` | [stub] Create/invoke /ai/cross-domain (knowledge-graph) |
| `POST` | /ai/embed/batch | `knowledge_graph_post_ai_embed_batch` | [stub] Create/invoke /ai/embed/batch (knowledge-graph) |
| `POST` | /ai/embed/generate | `knowledge_graph_post_ai_embed_generate` | [stub] Create/invoke /ai/embed/generate (knowledge-graph) |
| `POST` | /ai/embed/process | `knowledge_graph_post_ai_embed_process` | [stub] Create/invoke /ai/embed/process (knowledge-graph) |
| `POST` | /ai/embed/schedule | `knowledge_graph_post_ai_embed_schedule` | [stub] Create/invoke /ai/embed/schedule (knowledge-graph) |
| `GET` | /ai/embedding-models | `knowledge_graph_get_ai_embedding_models` | [stub] List/get /ai/embedding-models (knowledge-graph) |
| `POST` | /ai/entities | `knowledge_graph_post_ai_entities` | [stub] Create/invoke /ai/entities (knowledge-graph) |
| `POST` | /ai/entities/search | `knowledge_graph_post_ai_entities_search` | [stub] Create/invoke /ai/entities/search (knowledge-graph) |
| `POST` | /ai/graph-query | `knowledge_graph_post_ai_graph_query` | [stub] Create/invoke /ai/graph-query (knowledge-graph) |
| `GET` | /ai/graph/{entityId} | `knowledge_graph_get_ai_graph_entityId` | [stub] List/get /ai/graph/{entityId} (knowledge-graph) |
| `GET` | /ai/graph/{fromId}/paths/{toId} | `knowledge_graph_get_ai_graph_fromId_paths_toId` | [stub] List/get /ai/graph/{fromId}/paths/{toId} (knowledge-graph) |
| `POST` | /ai/rag-context | `knowledge_graph_post_ai_rag_context` | [stub] Create/invoke /ai/rag-context (knowledge-graph) |
| `POST` | /ai/reembed | `knowledge_graph_post_ai_reembed` | [stub] Create/invoke /ai/reembed (knowledge-graph) |
| `POST` | /ai/relationships | `knowledge_graph_post_ai_relationships` | [stub] Create/invoke /ai/relationships (knowledge-graph) |
| `POST` | /ai/search | `knowledge_graph_post_ai_search` | [stub] Create/invoke /ai/search (knowledge-graph) |
| `GET` | /ai/stats | `knowledge_graph_get_ai_stats` | [stub] List/get /ai/stats (knowledge-graph) |

<a id="leads"></a>

## leads

Auto-generated tag for leads route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /leads/terra/crm/leads | `leads_get_leads_terra_crm_leads` | [stub] List/get /leads/terra/crm/leads (leads) |
| `POST` | /leads/terra/crm/leads | `leads_post_leads_terra_crm_leads` | [stub] Create/invoke /leads/terra/crm/leads (leads) |
| `GET` | /leads/terra/crm/leads/{id} | `leads_get_leads_terra_crm_leads_id` | [stub] List/get /leads/terra/crm/leads/{id} (leads) |
| `PATCH` | /leads/terra/crm/leads/{id} | `leads_patch_leads_terra_crm_leads_id` | [stub] Patch /leads/terra/crm/leads/{id} (leads) |

<a id="linear"></a>

## linear

Auto-generated tag for linear route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `POST` | /linear/linear/create-ticket | `linear_post_linear_linear_create_ticket` | [stub] Create/invoke /linear/linear/create-ticket (linear) |
| `GET` | /linear/linear/settings | `linear_get_linear_linear_settings` | [stub] List/get /linear/linear/settings (linear) |
| `PUT` | /linear/linear/settings | `linear_put_linear_linear_settings` | [stub] Update /linear/linear/settings (linear) |
| `GET` | /linear/linear/teams | `linear_get_linear_linear_teams` | [stub] List/get /linear/linear/teams (linear) |

<a id="live"></a>

## live

Auto-generated tag for live route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `POST` | /live/firestorm/ingest/webhook | `live_post_live_firestorm_ingest_webhook` | [stub] Create/invoke /live/firestorm/ingest/webhook (live) |
| `GET` | /live/firestorm/live/cert-advisories | `live_get_live_firestorm_live_cert_advisories` | [stub] List/get /live/firestorm/live/cert-advisories (live) |
| `GET` | /live/firestorm/live/cisa-kev | `live_get_live_firestorm_live_cisa_kev` | [stub] List/get /live/firestorm/live/cisa-kev (live) |
| `GET` | /live/firestorm/live/feed-status | `live_get_live_firestorm_live_feed_status` | [stub] List/get /live/firestorm/live/feed-status (live) |
| `GET` | /live/firestorm/live/mitre-attack | `live_get_live_firestorm_live_mitre_attack` | [stub] List/get /live/firestorm/live/mitre-attack (live) |
| `GET` | /live/firestorm/live/nvd-cves | `live_get_live_firestorm_live_nvd_cves` | [stub] List/get /live/firestorm/live/nvd-cves (live) |
| `GET` | /live/firestorm/live/threat-indicators | `live_get_live_firestorm_live_threat_indicators` | [stub] List/get /live/firestorm/live/threat-indicators (live) |
| `GET` | /live/firestorm/live/threat-news | `live_get_live_firestorm_live_threat_news` | [stub] List/get /live/firestorm/live/threat-news (live) |

<a id="lp-portal"></a>

## lp-portal

Auto-generated tag for lp-portal route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /lp-portal/lp-portal/lps | `lp_portal_get_lp_portal_lp_portal_lps` | [stub] List/get /lp-portal/lp-portal/lps (lp-portal) |
| `GET` | /lp-portal/lp-portal/lps/{id}/activity | `lp_portal_get_lp_portal_lp_portal_lps_id_activity` | [stub] List/get /lp-portal/lp-portal/lps/{id}/activity (lp-portal) |
| `POST` | /lp-portal/lp-portal/lps/{id}/activity | `lp_portal_post_lp_portal_lp_portal_lps_id_activity` | [stub] Create/invoke /lp-portal/lp-portal/lps/{id}/activity (lp-portal) |
| `GET` | /lp-portal/lp-portal/lps/{id}/capital-account | `lp_portal_get_lp_portal_lp_portal_lps_id_capital_account` | [stub] List/get /lp-portal/lp-portal/lps/{id}/capital-account (lp-portal) |
| `GET` | /lp-portal/lp-portal/lps/{id}/documents | `lp_portal_get_lp_portal_lp_portal_lps_id_documents` | [stub] List/get /lp-portal/lp-portal/lps/{id}/documents (lp-portal) |
| `GET` | /lp-portal/lp-portal/lps/{id}/messages | `lp_portal_get_lp_portal_lp_portal_lps_id_messages` | [stub] List/get /lp-portal/lp-portal/lps/{id}/messages (lp-portal) |
| `POST` | /lp-portal/lp-portal/lps/{id}/messages | `lp_portal_post_lp_portal_lp_portal_lps_id_messages` | [stub] Create/invoke /lp-portal/lp-portal/lps/{id}/messages (lp-portal) |
| `GET` | /lp-portal/lp-portal/lps/{id}/reports | `lp_portal_get_lp_portal_lp_portal_lps_id_reports` | [stub] List/get /lp-portal/lp-portal/lps/{id}/reports (lp-portal) |
| `GET` | /lp-portal/lp-portal/nav-history | `lp_portal_get_lp_portal_lp_portal_nav_history` | [stub] List/get /lp-portal/lp-portal/nav-history (lp-portal) |

<a id="lyte-billing"></a>

## lyte-billing

Auto-generated tag for lyte-billing route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `POST` | /lyte/lyte/billing/create-invoice | `lyte_billing_post_lyte_lyte_billing_create_invoice` | [stub] Create/invoke /lyte/lyte/billing/create-invoice (lyte-billing) |
| `POST` | /lyte/lyte/billing/pilot-checkout | `lyte_billing_post_lyte_lyte_billing_pilot_checkout` | [stub] Create/invoke /lyte/lyte/billing/pilot-checkout (lyte-billing) |
| `GET` | /lyte/lyte/billing/pilot-metrics | `lyte_billing_get_lyte_lyte_billing_pilot_metrics` | [stub] List/get /lyte/lyte/billing/pilot-metrics (lyte-billing) |
| `GET` | /lyte/lyte/billing/plans | `lyte_billing_get_lyte_lyte_billing_plans` | [stub] List/get /lyte/lyte/billing/plans (lyte-billing) |
| `GET` | /lyte/lyte/billing/revenue-events | `lyte_billing_get_lyte_lyte_billing_revenue_events` | [stub] List/get /lyte/lyte/billing/revenue-events (lyte-billing) |
| `POST` | /lyte/lyte/billing/webhooks/failed-payment | `lyte_billing_post_lyte_lyte_billing_webhooks_failed_payment` | [stub] Create/invoke /lyte/lyte/billing/webhooks/failed-payment (lyte-billing) |

<a id="lyte-cognitive"></a>

## lyte-cognitive

Auto-generated tag for lyte-cognitive route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /lyte/lyte/cognitive/accountability-map | `lyte_cognitive_get_lyte_lyte_cognitive_accountability_map` | [stub] List/get /lyte/lyte/cognitive/accountability-map (lyte-cognitive) |
| `GET` | /lyte/lyte/cognitive/bottlenecks | `lyte_cognitive_get_lyte_lyte_cognitive_bottlenecks` | [stub] List/get /lyte/lyte/cognitive/bottlenecks (lyte-cognitive) |
| `GET` | /lyte/lyte/cognitive/executive-narrative | `lyte_cognitive_get_lyte_lyte_cognitive_executive_narrative` | [stub] List/get /lyte/lyte/cognitive/executive-narrative (lyte-cognitive) |
| `GET` | /lyte/lyte/cognitive/interventions | `lyte_cognitive_get_lyte_lyte_cognitive_interventions` | [stub] List/get /lyte/lyte/cognitive/interventions (lyte-cognitive) |
| `GET` | /lyte/lyte/cognitive/signal-fusion | `lyte_cognitive_get_lyte_lyte_cognitive_signal_fusion` | [stub] List/get /lyte/lyte/cognitive/signal-fusion (lyte-cognitive) |
| `POST` | /lyte/lyte/cognitive/signal-fusion/run | `lyte_cognitive_post_lyte_lyte_cognitive_signal_fusion_run` | [stub] Create/invoke /lyte/lyte/cognitive/signal-fusion/run (lyte-cognitive) |
| `GET` | /lyte/lyte/cognitive/value-at-risk | `lyte_cognitive_get_lyte_lyte_cognitive_value_at_risk` | [stub] List/get /lyte/lyte/cognitive/value-at-risk (lyte-cognitive) |

<a id="lyte-extended"></a>

## lyte-extended

Auto-generated tag for lyte-extended route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /core/actions | `lyte_extended_get_core_actions` | [stub] List/get /core/actions (lyte-extended) |
| `POST` | /core/actions | `lyte_extended_post_core_actions` | [stub] Create/invoke /core/actions (lyte-extended) |
| `PATCH` | /core/actions/{id} | `lyte_extended_patch_core_actions_id` | [stub] Patch /core/actions/{id} (lyte-extended) |
| `DELETE` | /core/actions/{id} | `lyte_extended_delete_core_actions_id` | [stub] Delete /core/actions/{id} (lyte-extended) |
| `GET` | /core/dashboard | `lyte_extended_get_core_dashboard` | [stub] List/get /core/dashboard (lyte-extended) |
| `GET` | /core/insights/narratives | `lyte_extended_get_core_insights_narratives` | [stub] List/get /core/insights/narratives (lyte-extended) |
| `GET` | /core/readiness | `lyte_extended_get_core_readiness` | [stub] List/get /core/readiness (lyte-extended) |
| `POST` | /core/readiness | `lyte_extended_post_core_readiness` | [stub] Create/invoke /core/readiness (lyte-extended) |
| `PATCH` | /core/readiness/{id} | `lyte_extended_patch_core_readiness_id` | [stub] Patch /core/readiness/{id} (lyte-extended) |
| `GET` | /core/readiness/score | `lyte_extended_get_core_readiness_score` | [stub] List/get /core/readiness/score (lyte-extended) |
| `GET` | /core/saved-views | `lyte_extended_get_core_saved_views` | [stub] List/get /core/saved-views (lyte-extended) |
| `POST` | /core/saved-views | `lyte_extended_post_core_saved_views` | [stub] Create/invoke /core/saved-views (lyte-extended) |
| `PATCH` | /core/saved-views/{id} | `lyte_extended_patch_core_saved_views_id` | [stub] Patch /core/saved-views/{id} (lyte-extended) |
| `DELETE` | /core/saved-views/{id} | `lyte_extended_delete_core_saved_views_id` | [stub] Delete /core/saved-views/{id} (lyte-extended) |
| `POST` | /core/signals/{id}/acknowledge | `lyte_extended_post_core_signals_id_acknowledge` | [stub] Create/invoke /core/signals/{id}/acknowledge (lyte-extended) |
| `POST` | /core/signals/{id}/assign | `lyte_extended_post_core_signals_id_assign` | [stub] Create/invoke /core/signals/{id}/assign (lyte-extended) |
| `GET` | /core/signals/{id}/comments | `lyte_extended_get_core_signals_id_comments` | [stub] List/get /core/signals/{id}/comments (lyte-extended) |
| `POST` | /core/signals/{id}/comments | `lyte_extended_post_core_signals_id_comments` | [stub] Create/invoke /core/signals/{id}/comments (lyte-extended) |
| `POST` | /core/signals/{id}/escalate | `lyte_extended_post_core_signals_id_escalate` | [stub] Create/invoke /core/signals/{id}/escalate (lyte-extended) |
| `POST` | /core/signals/{id}/override | `lyte_extended_post_core_signals_id_override` | [stub] Create/invoke /core/signals/{id}/override (lyte-extended) |
| `POST` | /core/signals/{id}/resolve | `lyte_extended_post_core_signals_id_resolve` | [stub] Create/invoke /core/signals/{id}/resolve (lyte-extended) |
| `GET` | /core/signals/{id}/timeline | `lyte_extended_get_core_signals_id_timeline` | [stub] List/get /core/signals/{id}/timeline (lyte-extended) |

<a id="lyte-intel"></a>

## lyte-intel

Auto-generated tag for lyte-intel route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /lyte/lyte/decision-schemas | `lyte_intel_get_lyte_lyte_decision_schemas` | [stub] List/get /lyte/lyte/decision-schemas (lyte-intel) |
| `GET` | /lyte/lyte/governance-domains | `lyte_intel_get_lyte_lyte_governance_domains` | [stub] List/get /lyte/lyte/governance-domains (lyte-intel) |
| `GET` | /lyte/lyte/signal-fusion | `lyte_intel_get_lyte_lyte_signal_fusion` | [stub] List/get /lyte/lyte/signal-fusion (lyte-intel) |

<a id="lyte-live"></a>

## lyte-live

Auto-generated tag for lyte-live route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /lyte/lyte/live/database-telemetry | `lyte_live_get_lyte_lyte_live_database_telemetry` | [stub] List/get /lyte/lyte/live/database-telemetry (lyte-live) |
| `GET` | /lyte/lyte/live/github-activity | `lyte_live_get_lyte_lyte_live_github_activity` | [stub] List/get /lyte/lyte/live/github-activity (lyte-live) |
| `GET` | /lyte/lyte/live/incidents | `lyte_live_get_lyte_lyte_live_incidents` | [stub] List/get /lyte/lyte/live/incidents (lyte-live) |
| `GET` | /lyte/lyte/live/operations-summary | `lyte_live_get_lyte_lyte_live_operations_summary` | [stub] List/get /lyte/lyte/live/operations-summary (lyte-live) |
| `GET` | /lyte/lyte/live/signals | `lyte_live_get_lyte_lyte_live_signals` | [stub] List/get /lyte/lyte/live/signals (lyte-live) |

<a id="lyte-observability"></a>

## lyte-observability

Auto-generated tag for lyte-observability route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /lyte/lyte/alert-events | `lyte_observability_get_lyte_lyte_alert_events` | [stub] List/get /lyte/lyte/alert-events (lyte-observability) |
| `POST` | /lyte/lyte/alert-events | `lyte_observability_post_lyte_lyte_alert_events` | [stub] Create/invoke /lyte/lyte/alert-events (lyte-observability) |
| `GET` | /lyte/lyte/alerts | `lyte_observability_get_lyte_lyte_alerts` | [stub] List/get /lyte/lyte/alerts (lyte-observability) |
| `POST` | /lyte/lyte/alerts | `lyte_observability_post_lyte_lyte_alerts` | [stub] Create/invoke /lyte/lyte/alerts (lyte-observability) |
| `GET` | /lyte/lyte/alerts/{id} | `lyte_observability_get_lyte_lyte_alerts_id` | [stub] List/get /lyte/lyte/alerts/{id} (lyte-observability) |
| `PATCH` | /lyte/lyte/alerts/{id} | `lyte_observability_patch_lyte_lyte_alerts_id` | [stub] Patch /lyte/lyte/alerts/{id} (lyte-observability) |
| `DELETE` | /lyte/lyte/alerts/{id} | `lyte_observability_delete_lyte_lyte_alerts_id` | [stub] Delete /lyte/lyte/alerts/{id} (lyte-observability) |
| `GET` | /lyte/lyte/dashboards | `lyte_observability_get_lyte_lyte_dashboards` | [stub] List/get /lyte/lyte/dashboards (lyte-observability) |
| `POST` | /lyte/lyte/dashboards | `lyte_observability_post_lyte_lyte_dashboards` | [stub] Create/invoke /lyte/lyte/dashboards (lyte-observability) |
| `GET` | /lyte/lyte/dashboards/{id} | `lyte_observability_get_lyte_lyte_dashboards_id` | [stub] List/get /lyte/lyte/dashboards/{id} (lyte-observability) |
| `PUT` | /lyte/lyte/dashboards/{id} | `lyte_observability_put_lyte_lyte_dashboards_id` | [stub] Update /lyte/lyte/dashboards/{id} (lyte-observability) |
| `DELETE` | /lyte/lyte/dashboards/{id} | `lyte_observability_delete_lyte_lyte_dashboards_id` | [stub] Delete /lyte/lyte/dashboards/{id} (lyte-observability) |
| `GET` | /lyte/lyte/dashboards/shared/{token} | `lyte_observability_get_lyte_lyte_dashboards_shared_token` | [stub] List/get /lyte/lyte/dashboards/shared/{token} (lyte-observability) |
| `GET` | /lyte/lyte/escalations | `lyte_observability_get_lyte_lyte_escalations` | [stub] List/get /lyte/lyte/escalations (lyte-observability) |
| `POST` | /lyte/lyte/escalations | `lyte_observability_post_lyte_lyte_escalations` | [stub] Create/invoke /lyte/lyte/escalations (lyte-observability) |
| `PATCH` | /lyte/lyte/escalations/{id} | `lyte_observability_patch_lyte_lyte_escalations_id` | [stub] Patch /lyte/lyte/escalations/{id} (lyte-observability) |
| `GET` | /lyte/lyte/metrics | `lyte_observability_get_lyte_lyte_metrics` | [stub] List/get /lyte/lyte/metrics (lyte-observability) |
| `POST` | /lyte/lyte/metrics | `lyte_observability_post_lyte_lyte_metrics` | [stub] Create/invoke /lyte/lyte/metrics (lyte-observability) |
| `GET` | /lyte/lyte/observability/summary | `lyte_observability_get_lyte_lyte_observability_summary` | [stub] List/get /lyte/lyte/observability/summary (lyte-observability) |
| `GET` | /lyte/lyte/prism/scores | `lyte_observability_get_lyte_lyte_prism_scores` | [stub] List/get /lyte/lyte/prism/scores (lyte-observability) |
| `POST` | /lyte/lyte/prism/scores | `lyte_observability_post_lyte_lyte_prism_scores` | [stub] Create/invoke /lyte/lyte/prism/scores (lyte-observability) |
| `GET` | /lyte/lyte/prism/summary | `lyte_observability_get_lyte_lyte_prism_summary` | [stub] List/get /lyte/lyte/prism/summary (lyte-observability) |
| `GET` | /lyte/lyte/topology | `lyte_observability_get_lyte_lyte_topology` | [stub] List/get /lyte/lyte/topology (lyte-observability) |

<a id="lyte-surfaces"></a>

## lyte-surfaces

Auto-generated tag for lyte-surfaces route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /lyte/lyte/action-debt | `lyte_surfaces_get_lyte_lyte_action_debt` | [stub] List/get /lyte/lyte/action-debt (lyte-surfaces) |
| `GET` | /lyte/lyte/board-view | `lyte_surfaces_get_lyte_lyte_board_view` | [stub] List/get /lyte/lyte/board-view (lyte-surfaces) |
| `GET` | /lyte/lyte/decision-replay | `lyte_surfaces_get_lyte_lyte_decision_replay` | [stub] List/get /lyte/lyte/decision-replay (lyte-surfaces) |
| `GET` | /lyte/lyte/decision-replay/{id} | `lyte_surfaces_get_lyte_lyte_decision_replay_id` | [stub] List/get /lyte/lyte/decision-replay/{id} (lyte-surfaces) |
| `GET` | /lyte/lyte/entity-graph | `lyte_surfaces_get_lyte_lyte_entity_graph` | [stub] List/get /lyte/lyte/entity-graph (lyte-surfaces) |
| `GET` | /lyte/lyte/ownership-drift | `lyte_surfaces_get_lyte_lyte_ownership_drift` | [stub] List/get /lyte/lyte/ownership-drift (lyte-surfaces) |
| `GET` | /lyte/lyte/pressure-map | `lyte_surfaces_get_lyte_lyte_pressure_map` | [stub] List/get /lyte/lyte/pressure-map (lyte-surfaces) |
| `GET` | /lyte/lyte/workflow-health | `lyte_surfaces_get_lyte_lyte_workflow_health` | [stub] List/get /lyte/lyte/workflow-health (lyte-surfaces) |

<a id="maps"></a>

## maps

Auto-generated tag for maps route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /maps/maps/geocode | `maps_get_maps_maps_geocode` | [stub] List/get /maps/maps/geocode (maps) |
| `GET` | /maps/maps/static | `maps_get_maps_maps_static` | [stub] List/get /maps/maps/static (maps) |

<a id="mcp"></a>

## mcp

Auto-generated tag for mcp route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `POST` | /mcp/mcp | `mcp_post_mcp_mcp` | [stub] Create/invoke /mcp/mcp (mcp) |
| `GET` | /mcp/mcp/health | `mcp_get_mcp_mcp_health` | [stub] List/get /mcp/mcp/health (mcp) |
| `GET` | /mcp/mcp/prompts | `mcp_get_mcp_mcp_prompts` | [stub] List/get /mcp/mcp/prompts (mcp) |
| `GET` | /mcp/mcp/resources | `mcp_get_mcp_mcp_resources` | [stub] List/get /mcp/mcp/resources (mcp) |
| `GET` | /mcp/mcp/sse | `mcp_get_mcp_mcp_sse` | [stub] List/get /mcp/mcp/sse (mcp) |
| `GET` | /mcp/mcp/tools | `mcp_get_mcp_mcp_tools` | [stub] List/get /mcp/mcp/tools (mcp) |

<a id="mcp-gateway"></a>

## mcp-gateway

Auto-generated tag for mcp-gateway route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /mcp-gateway/mcp-gateway/config | `mcp_gateway_get_mcp_gateway_mcp_gateway_config` | [stub] List/get /mcp-gateway/mcp-gateway/config (mcp-gateway) |
| `GET` | /mcp-gateway/mcp-gateway/events | `mcp_gateway_get_mcp_gateway_mcp_gateway_events` | [stub] List/get /mcp-gateway/mcp-gateway/events (mcp-gateway) |
| `GET` | /mcp-gateway/mcp-gateway/latency | `mcp_gateway_get_mcp_gateway_mcp_gateway_latency` | [stub] List/get /mcp-gateway/mcp-gateway/latency (mcp-gateway) |
| `POST` | /mcp-gateway/mcp-gateway/proxy | `mcp_gateway_post_mcp_gateway_mcp_gateway_proxy` | [stub] Create/invoke /mcp-gateway/mcp-gateway/proxy (mcp-gateway) |
| `PATCH` | /mcp-gateway/mcp-gateway/rules/{ruleId}/enforcement-mode | `mcp_gateway_patch_mcp_gateway_mcp_gateway_rules_ruleId_enforcement_mode` | [stub] Patch /mcp-gateway/mcp-gateway/rules/{ruleId}/enforcement-mode (mcp-gateway) |

<a id="memory"></a>

## memory

Auto-generated tag for memory route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /memory/memory | `memory_get_memory_memory` | [stub] List/get /memory/memory (memory) |
| `POST` | /memory/memory | `memory_post_memory_memory` | [stub] Create/invoke /memory/memory (memory) |
| `GET` | /memory/memory/{id} | `memory_get_memory_memory_id` | [stub] List/get /memory/memory/{id} (memory) |
| `PUT` | /memory/memory/{id} | `memory_put_memory_memory_id` | [stub] Update /memory/memory/{id} (memory) |
| `DELETE` | /memory/memory/{id} | `memory_delete_memory_memory_id` | [stub] Delete /memory/memory/{id} (memory) |
| `POST` | /memory/memory/{id}/pin | `memory_post_memory_memory_id_pin` | [stub] Create/invoke /memory/memory/{id}/pin (memory) |
| `DELETE` | /memory/memory/{id}/pin | `memory_delete_memory_memory_id_pin` | [stub] Delete /memory/memory/{id}/pin (memory) |
| `POST` | /memory/memory/behaviors/decay-freshness | `memory_post_memory_memory_behaviors_decay_freshness` | [stub] Create/invoke /memory/memory/behaviors/decay-freshness (memory) |
| `POST` | /memory/memory/behaviors/distill-lessons | `memory_post_memory_memory_behaviors_distill_lessons` | [stub] Create/invoke /memory/memory/behaviors/distill-lessons (memory) |
| `POST` | /memory/memory/behaviors/enforce-retention | `memory_post_memory_memory_behaviors_enforce_retention` | [stub] Create/invoke /memory/memory/behaviors/enforce-retention (memory) |
| `POST` | /memory/memory/behaviors/summarize-episodes | `memory_post_memory_memory_behaviors_summarize_episodes` | [stub] Create/invoke /memory/memory/behaviors/summarize-episodes (memory) |
| `POST` | /memory/memory/evict-expired | `memory_post_memory_memory_evict_expired` | [stub] Create/invoke /memory/memory/evict-expired (memory) |
| `GET` | /memory/memory/search | `memory_get_memory_memory_search` | [stub] List/get /memory/memory/search (memory) |
| `GET` | /memory/memory/stats/summary | `memory_get_memory_memory_stats_summary` | [stub] List/get /memory/memory/stats/summary (memory) |
| `GET` | /memory/memory/tiers/overview | `memory_get_memory_memory_tiers_overview` | [stub] List/get /memory/memory/tiers/overview (memory) |

<a id="microsoft-graph"></a>

## microsoft-graph

Auto-generated tag for microsoft-graph route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /microsoft/microsoft/calendar/events | `microsoft_graph_get_microsoft_microsoft_calendar_events` | [stub] List/get /microsoft/microsoft/calendar/events (microsoft-graph) |
| `GET` | /microsoft/microsoft/contacts | `microsoft_graph_get_microsoft_microsoft_contacts` | [stub] List/get /microsoft/microsoft/contacts (microsoft-graph) |
| `GET` | /microsoft/microsoft/onedrive/files | `microsoft_graph_get_microsoft_microsoft_onedrive_files` | [stub] List/get /microsoft/microsoft/onedrive/files (microsoft-graph) |
| `GET` | /microsoft/microsoft/sharepoint/files | `microsoft_graph_get_microsoft_microsoft_sharepoint_files` | [stub] List/get /microsoft/microsoft/sharepoint/files (microsoft-graph) |
| `GET` | /microsoft/microsoft/sharepoint/sites | `microsoft_graph_get_microsoft_microsoft_sharepoint_sites` | [stub] List/get /microsoft/microsoft/sharepoint/sites (microsoft-graph) |
| `GET` | /microsoft/microsoft/status | `microsoft_graph_get_microsoft_microsoft_status` | [stub] List/get /microsoft/microsoft/status (microsoft-graph) |
| `GET` | /microsoft/microsoft/sync | `microsoft_graph_get_microsoft_microsoft_sync` | [stub] List/get /microsoft/microsoft/sync (microsoft-graph) |
| `POST` | /microsoft/microsoft/teams/notify | `microsoft_graph_post_microsoft_microsoft_teams_notify` | [stub] Create/invoke /microsoft/microsoft/teams/notify (microsoft-graph) |

<a id="microsoft-integrations"></a>

## microsoft-integrations

Auto-generated tag for microsoft-integrations route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /integrations/integrations/dynamics/entities | `microsoft_integrations_get_integrations_integrations_dynamics_entities` | [stub] List/get /integrations/integrations/dynamics/entities (microsoft-integrations) |
| `GET` | /integrations/integrations/dynamics/health | `microsoft_integrations_get_integrations_integrations_dynamics_health` | [stub] List/get /integrations/integrations/dynamics/health (microsoft-integrations) |
| `POST` | /integrations/integrations/dynamics/sync | `microsoft_integrations_post_integrations_integrations_dynamics_sync` | [stub] Create/invoke /integrations/integrations/dynamics/sync (microsoft-integrations) |
| `POST` | /integrations/integrations/dynamics/webhook | `microsoft_integrations_post_integrations_integrations_dynamics_webhook` | [stub] Create/invoke /integrations/integrations/dynamics/webhook (microsoft-integrations) |
| `POST` | /integrations/integrations/power-automate/trigger | `microsoft_integrations_post_integrations_integrations_power_automate_trigger` | [stub] Create/invoke /integrations/integrations/power-automate/trigger (microsoft-integrations) |
| `GET` | /integrations/integrations/sharepoint/deployment | `microsoft_integrations_get_integrations_integrations_sharepoint_deployment` | [stub] List/get /integrations/integrations/sharepoint/deployment (microsoft-integrations) |
| `GET` | /integrations/integrations/sharepoint/health | `microsoft_integrations_get_integrations_integrations_sharepoint_health` | [stub] List/get /integrations/integrations/sharepoint/health (microsoft-integrations) |
| `GET` | /integrations/integrations/sharepoint/webparts | `microsoft_integrations_get_integrations_integrations_sharepoint_webparts` | [stub] List/get /integrations/integrations/sharepoint/webparts (microsoft-integrations) |
| `GET` | /integrations/integrations/sharepoint/webparts/{id} | `microsoft_integrations_get_integrations_integrations_sharepoint_webparts_id` | [stub] List/get /integrations/integrations/sharepoint/webparts/{id} (microsoft-integrations) |

<a id="ml-pipeline"></a>

## ml-pipeline

Auto-generated tag for ml-pipeline route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /ml/ml/ab-tests | `ml_pipeline_get_ml_ml_ab_tests` | [stub] List/get /ml/ml/ab-tests (ml-pipeline) |
| `POST` | /ml/ml/ab-tests | `ml_pipeline_post_ml_ml_ab_tests` | [stub] Create/invoke /ml/ml/ab-tests (ml-pipeline) |
| `POST` | /ml/ml/ab-tests/{testId}/assign | `ml_pipeline_post_ml_ml_ab_tests_testId_assign` | [stub] Create/invoke /ml/ml/ab-tests/{testId}/assign (ml-pipeline) |
| `POST` | /ml/ml/ab-tests/{testId}/conclude | `ml_pipeline_post_ml_ml_ab_tests_testId_conclude` | [stub] Create/invoke /ml/ml/ab-tests/{testId}/conclude (ml-pipeline) |
| `GET` | /ml/ml/ab-tests/{testId}/evaluate | `ml_pipeline_get_ml_ml_ab_tests_testId_evaluate` | [stub] List/get /ml/ml/ab-tests/{testId}/evaluate (ml-pipeline) |
| `POST` | /ml/ml/ab-tests/{testId}/outcome | `ml_pipeline_post_ml_ml_ab_tests_testId_outcome` | [stub] Create/invoke /ml/ml/ab-tests/{testId}/outcome (ml-pipeline) |
| `GET` | /ml/ml/ab-tests/summary | `ml_pipeline_get_ml_ml_ab_tests_summary` | [stub] List/get /ml/ml/ab-tests/summary (ml-pipeline) |
| `GET` | /ml/ml/datasets | `ml_pipeline_get_ml_ml_datasets` | [stub] List/get /ml/ml/datasets (ml-pipeline) |
| `POST` | /ml/ml/datasets | `ml_pipeline_post_ml_ml_datasets` | [stub] Create/invoke /ml/ml/datasets (ml-pipeline) |
| `GET` | /ml/ml/datasets/{datasetId} | `ml_pipeline_get_ml_ml_datasets_datasetId` | [stub] List/get /ml/ml/datasets/{datasetId} (ml-pipeline) |
| `POST` | /ml/ml/datasets/{datasetId}/refresh | `ml_pipeline_post_ml_ml_datasets_datasetId_refresh` | [stub] Create/invoke /ml/ml/datasets/{datasetId}/refresh (ml-pipeline) |
| `POST` | /ml/ml/datasets/bootstrap | `ml_pipeline_post_ml_ml_datasets_bootstrap` | [stub] Create/invoke /ml/ml/datasets/bootstrap (ml-pipeline) |
| `GET` | /ml/ml/datasets/summary | `ml_pipeline_get_ml_ml_datasets_summary` | [stub] List/get /ml/ml/datasets/summary (ml-pipeline) |
| `POST` | /ml/ml/explain | `ml_pipeline_post_ml_ml_explain` | [stub] Create/invoke /ml/ml/explain (ml-pipeline) |
| `POST` | /ml/ml/explain/shap | `ml_pipeline_post_ml_ml_explain_shap` | [stub] Create/invoke /ml/ml/explain/shap (ml-pipeline) |
| `GET` | /ml/ml/features | `ml_pipeline_get_ml_ml_features` | [stub] List/get /ml/ml/features (ml-pipeline) |
| `GET` | /ml/ml/features/catalog | `ml_pipeline_get_ml_ml_features_catalog` | [stub] List/get /ml/ml/features/catalog (ml-pipeline) |
| `POST` | /ml/ml/features/compute | `ml_pipeline_post_ml_ml_features_compute` | [stub] Create/invoke /ml/ml/features/compute (ml-pipeline) |
| `GET` | /ml/ml/features/freshness | `ml_pipeline_get_ml_ml_features_freshness` | [stub] List/get /ml/ml/features/freshness (ml-pipeline) |
| `GET` | /ml/ml/features/summary | `ml_pipeline_get_ml_ml_features_summary` | [stub] List/get /ml/ml/features/summary (ml-pipeline) |
| `POST` | /ml/ml/features/vector | `ml_pipeline_post_ml_ml_features_vector` | [stub] Create/invoke /ml/ml/features/vector (ml-pipeline) |
| `POST` | /ml/ml/inference/batch | `ml_pipeline_post_ml_ml_inference_batch` | [stub] Create/invoke /ml/ml/inference/batch (ml-pipeline) |
| `DELETE` | /ml/ml/inference/cache | `ml_pipeline_delete_ml_ml_inference_cache` | [stub] Delete /ml/ml/inference/cache (ml-pipeline) |
| `POST` | /ml/ml/inference/predict | `ml_pipeline_post_ml_ml_inference_predict` | [stub] Create/invoke /ml/ml/inference/predict (ml-pipeline) |
| `GET` | /ml/ml/inference/stats | `ml_pipeline_get_ml_ml_inference_stats` | [stub] List/get /ml/ml/inference/stats (ml-pipeline) |
| `GET` | /ml/ml/monitoring/retraining-log | `ml_pipeline_get_ml_ml_monitoring_retraining_log` | [stub] List/get /ml/ml/monitoring/retraining-log (ml-pipeline) |
| `POST` | /ml/ml/monitoring/run-all | `ml_pipeline_post_ml_ml_monitoring_run_all` | [stub] Create/invoke /ml/ml/monitoring/run-all (ml-pipeline) |
| `POST` | /ml/ml/monitoring/run/{modelVersionId} | `ml_pipeline_post_ml_ml_monitoring_run_modelVersionId` | [stub] Create/invoke /ml/ml/monitoring/run/{modelVersionId} (ml-pipeline) |
| `GET` | /ml/ml/monitoring/snapshots | `ml_pipeline_get_ml_ml_monitoring_snapshots` | [stub] List/get /ml/ml/monitoring/snapshots (ml-pipeline) |
| `GET` | /ml/ml/monitoring/summary | `ml_pipeline_get_ml_ml_monitoring_summary` | [stub] List/get /ml/ml/monitoring/summary (ml-pipeline) |
| `GET` | /ml/ml/registry/models | `ml_pipeline_get_ml_ml_registry_models` | [stub] List/get /ml/ml/registry/models (ml-pipeline) |
| `GET` | /ml/ml/registry/models/{modelVersionId} | `ml_pipeline_get_ml_ml_registry_models_modelVersionId` | [stub] List/get /ml/ml/registry/models/{modelVersionId} (ml-pipeline) |
| `GET` | /ml/ml/registry/models/{modelVersionId}/lineage | `ml_pipeline_get_ml_ml_registry_models_modelVersionId_lineage` | [stub] List/get /ml/ml/registry/models/{modelVersionId}/lineage (ml-pipeline) |
| `POST` | /ml/ml/registry/models/{modelVersionId}/promote | `ml_pipeline_post_ml_ml_registry_models_modelVersionId_promote` | [stub] Create/invoke /ml/ml/registry/models/{modelVersionId}/promote (ml-pipeline) |
| `GET` | /ml/ml/registry/summary | `ml_pipeline_get_ml_ml_registry_summary` | [stub] List/get /ml/ml/registry/summary (ml-pipeline) |
| `GET` | /ml/ml/status | `ml_pipeline_get_ml_ml_status` | [stub] List/get /ml/ml/status (ml-pipeline) |
| `GET` | /ml/ml/templates | `ml_pipeline_get_ml_ml_templates` | [stub] List/get /ml/ml/templates (ml-pipeline) |
| `GET` | /ml/ml/templates/{domain} | `ml_pipeline_get_ml_ml_templates_domain` | [stub] List/get /ml/ml/templates/{domain} (ml-pipeline) |
| `GET` | /ml/ml/templates/{domain}/{modelType} | `ml_pipeline_get_ml_ml_templates_domain_modelType` | [stub] List/get /ml/ml/templates/{domain}/{modelType} (ml-pipeline) |
| `GET` | /ml/ml/training/runs | `ml_pipeline_get_ml_ml_training_runs` | [stub] List/get /ml/ml/training/runs (ml-pipeline) |
| `POST` | /ml/ml/training/runs | `ml_pipeline_post_ml_ml_training_runs` | [stub] Create/invoke /ml/ml/training/runs (ml-pipeline) |
| `GET` | /ml/ml/training/runs/{runId} | `ml_pipeline_get_ml_ml_training_runs_runId` | [stub] List/get /ml/ml/training/runs/{runId} (ml-pipeline) |
| `GET` | /ml/ml/training/summary | `ml_pipeline_get_ml_ml_training_summary` | [stub] List/get /ml/ml/training/summary (ml-pipeline) |
| `POST` | /ml/ml/training/trigger/{domain} | `ml_pipeline_post_ml_ml_training_trigger_domain` | [stub] Create/invoke /ml/ml/training/trigger/{domain} (ml-pipeline) |

<a id="monitoring"></a>

## monitoring

Auto-generated tag for monitoring route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `POST` | /monitoring/rmm/actions/bulk | `monitoring_post_monitoring_rmm_actions_bulk` | [stub] Create/invoke /monitoring/rmm/actions/bulk (monitoring) |
| `GET` | /monitoring/rmm/org-site-mappings | `monitoring_get_monitoring_rmm_org_site_mappings` | [stub] List/get /monitoring/rmm/org-site-mappings (monitoring) |
| `POST` | /monitoring/rmm/org-site-mappings | `monitoring_post_monitoring_rmm_org_site_mappings` | [stub] Create/invoke /monitoring/rmm/org-site-mappings (monitoring) |
| `PATCH` | /monitoring/rmm/org-site-mappings/{id} | `monitoring_patch_monitoring_rmm_org_site_mappings_id` | [stub] Patch /monitoring/rmm/org-site-mappings/{id} (monitoring) |
| `DELETE` | /monitoring/rmm/org-site-mappings/{id} | `monitoring_delete_monitoring_rmm_org_site_mappings_id` | [stub] Delete /monitoring/rmm/org-site-mappings/{id} (monitoring) |
| `GET` | /monitoring/rmm/predictions | `monitoring_get_monitoring_rmm_predictions` | [stub] List/get /monitoring/rmm/predictions (monitoring) |
| `POST` | /monitoring/rmm/psa/ticket | `monitoring_post_monitoring_rmm_psa_ticket` | [stub] Create/invoke /monitoring/rmm/psa/ticket (monitoring) |
| `POST` | /monitoring/rmm/psa/ticket/{psaTicketId}/close | `monitoring_post_monitoring_rmm_psa_ticket_psaTicketId_close` | [stub] Create/invoke /monitoring/rmm/psa/ticket/{psaTicketId}/close (monitoring) |

<a id="monte-carlo"></a>

## monte-carlo

Auto-generated tag for monte-carlo route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `POST` | /monte-carlo/monte-carlo/backtest | `monte_carlo_post_monte_carlo_monte_carlo_backtest` | [stub] Create/invoke /monte-carlo/monte-carlo/backtest (monte-carlo) |
| `POST` | /monte-carlo/monte-carlo/calibrate | `monte_carlo_post_monte_carlo_monte_carlo_calibrate` | [stub] Create/invoke /monte-carlo/monte-carlo/calibrate (monte-carlo) |
| `POST` | /monte-carlo/monte-carlo/cleanup | `monte_carlo_post_monte_carlo_monte_carlo_cleanup` | [stub] Create/invoke /monte-carlo/monte-carlo/cleanup (monte-carlo) |
| `POST` | /monte-carlo/monte-carlo/compare | `monte_carlo_post_monte_carlo_monte_carlo_compare` | [stub] Create/invoke /monte-carlo/monte-carlo/compare (monte-carlo) |
| `GET` | /monte-carlo/monte-carlo/execution-profile | `monte_carlo_get_monte_carlo_monte_carlo_execution_profile` | [stub] List/get /monte-carlo/monte-carlo/execution-profile (monte-carlo) |
| `GET` | /monte-carlo/monte-carlo/jobs | `monte_carlo_get_monte_carlo_monte_carlo_jobs` | [stub] List/get /monte-carlo/monte-carlo/jobs (monte-carlo) |
| `GET` | /monte-carlo/monte-carlo/jobs/{id} | `monte_carlo_get_monte_carlo_monte_carlo_jobs_id` | [stub] List/get /monte-carlo/monte-carlo/jobs/{id} (monte-carlo) |
| `GET` | /monte-carlo/monte-carlo/jobs/{id}/stream | `monte_carlo_get_monte_carlo_monte_carlo_jobs_id_stream` | [stub] List/get /monte-carlo/monte-carlo/jobs/{id}/stream (monte-carlo) |
| `GET` | /monte-carlo/monte-carlo/scenarios | `monte_carlo_get_monte_carlo_monte_carlo_scenarios` | [stub] List/get /monte-carlo/monte-carlo/scenarios (monte-carlo) |
| `GET` | /monte-carlo/monte-carlo/scenarios/{id} | `monte_carlo_get_monte_carlo_monte_carlo_scenarios_id` | [stub] List/get /monte-carlo/monte-carlo/scenarios/{id} (monte-carlo) |
| `GET` | /monte-carlo/monte-carlo/schema | `monte_carlo_get_monte_carlo_monte_carlo_schema` | [stub] List/get /monte-carlo/monte-carlo/schema (monte-carlo) |
| `POST` | /monte-carlo/monte-carlo/simulate | `monte_carlo_post_monte_carlo_monte_carlo_simulate` | [stub] Create/invoke /monte-carlo/monte-carlo/simulate (monte-carlo) |
| `POST` | /monte-carlo/monte-carlo/simulate/custom | `monte_carlo_post_monte_carlo_monte_carlo_simulate_custom` | [stub] Create/invoke /monte-carlo/monte-carlo/simulate/custom (monte-carlo) |
| `GET` | /monte-carlo/monte-carlo/ws-info | `monte_carlo_get_monte_carlo_monte_carlo_ws_info` | [stub] List/get /monte-carlo/monte-carlo/ws-info (monte-carlo) |

<a id="msp"></a>

## msp

Auto-generated tag for msp route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /msp/msp/clients | `msp_get_msp_msp_clients` | [stub] List/get /msp/msp/clients (msp) |
| `GET` | /msp/msp/clients/{id} | `msp_get_msp_msp_clients_id` | [stub] List/get /msp/msp/clients/{id} (msp) |
| `GET` | /msp/msp/contracts | `msp_get_msp_msp_contracts` | [stub] List/get /msp/msp/contracts (msp) |
| `GET` | /msp/msp/dashboard | `msp_get_msp_msp_dashboard` | [stub] List/get /msp/msp/dashboard (msp) |
| `GET` | /msp/msp/devices | `msp_get_msp_msp_devices` | [stub] List/get /msp/msp/devices (msp) |
| `GET` | /msp/msp/revenue | `msp_get_msp_msp_revenue` | [stub] List/get /msp/msp/revenue (msp) |
| `GET` | /msp/msp/technicians | `msp_get_msp_msp_technicians` | [stub] List/get /msp/msp/technicians (msp) |
| `GET` | /msp/msp/tickets | `msp_get_msp_msp_tickets` | [stub] List/get /msp/msp/tickets (msp) |
| `POST` | /msp/msp/tickets | `msp_post_msp_msp_tickets` | [stub] Create/invoke /msp/msp/tickets (msp) |
| `GET` | /msp/msp/tickets/{id} | `msp_get_msp_msp_tickets_id` | [stub] List/get /msp/msp/tickets/{id} (msp) |
| `PATCH` | /msp/msp/tickets/{id} | `msp_patch_msp_msp_tickets_id` | [stub] Patch /msp/msp/tickets/{id} (msp) |

<a id="msp-live"></a>

## msp-live

Auto-generated tag for msp-live route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /msp/msp/live/contracts | `msp_live_get_msp_msp_live_contracts` | [stub] List/get /msp/msp/live/contracts (msp-live) |
| `GET` | /msp/msp/live/fedramp | `msp_live_get_msp_msp_live_fedramp` | [stub] List/get /msp/msp/live/fedramp (msp-live) |
| `GET` | /msp/msp/live/health-metrics | `msp_live_get_msp_msp_live_health_metrics` | [stub] List/get /msp/msp/live/health-metrics (msp-live) |
| `GET` | /msp/msp/live/pipeline | `msp_live_get_msp_msp_live_pipeline` | [stub] List/get /msp/msp/live/pipeline (msp-live) |
| `GET` | /msp/msp/live/system-metrics | `msp_live_get_msp_msp_live_system_metrics` | [stub] List/get /msp/msp/live/system-metrics (msp-live) |

<a id="multiplayer-sessions"></a>

## multiplayer-sessions

Auto-generated tag for multiplayer-sessions route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /sessions/sessions/command | `multiplayer_sessions_get_sessions_sessions_command` | [stub] List/get /sessions/sessions/command (multiplayer-sessions) |
| `POST` | /sessions/sessions/command | `multiplayer_sessions_post_sessions_sessions_command` | [stub] Create/invoke /sessions/sessions/command (multiplayer-sessions) |
| `DELETE` | /sessions/sessions/command/{id} | `multiplayer_sessions_delete_sessions_sessions_command_id` | [stub] Delete /sessions/sessions/command/{id} (multiplayer-sessions) |
| `GET` | /sessions/sessions/command/{sessionId} | `multiplayer_sessions_get_sessions_sessions_command_sessionId` | [stub] List/get /sessions/sessions/command/{sessionId} (multiplayer-sessions) |
| `GET` | /sessions/sessions/command/{sessionId}/comments | `multiplayer_sessions_get_sessions_sessions_command_sessionId_comments` | [stub] List/get /sessions/sessions/command/{sessionId}/comments (multiplayer-sessions) |
| `POST` | /sessions/sessions/command/{sessionId}/comments | `multiplayer_sessions_post_sessions_sessions_command_sessionId_comments` | [stub] Create/invoke /sessions/sessions/command/{sessionId}/comments (multiplayer-sessions) |

<a id="narratives"></a>

## narratives

Auto-generated tag for narratives route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /narratives/narratives/{id} | `narratives_get_narratives_narratives_id` | [stub] List/get /narratives/narratives/{id} (narratives) |

<a id="newsletter"></a>

## newsletter

Auto-generated tag for newsletter route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `POST` | /newsletter/newsletter/subscribe | `newsletter_post_newsletter_newsletter_subscribe` | [stub] Create/invoke /newsletter/newsletter/subscribe (newsletter) |

<a id="nexus"></a>

## nexus

Auto-generated tag for nexus route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `POST` | /nexus/bridge/invoke | `nexus_post_nexus_bridge_invoke` | [stub] Create/invoke /nexus/bridge/invoke (nexus) |
| `GET` | /nexus/bridge/tools | `nexus_get_nexus_bridge_tools` | [stub] List/get /nexus/bridge/tools (nexus) |
| `POST` | /nexus/bridge/tools | `nexus_post_nexus_bridge_tools` | [stub] Create/invoke /nexus/bridge/tools (nexus) |
| `PUT` | /nexus/bridge/tools/{id} | `nexus_put_nexus_bridge_tools_id` | [stub] Update /nexus/bridge/tools/{id} (nexus) |
| `DELETE` | /nexus/bridge/tools/{id} | `nexus_delete_nexus_bridge_tools_id` | [stub] Delete /nexus/bridge/tools/{id} (nexus) |
| `POST` | /nexus/customizations/reset | `nexus_post_nexus_customizations_reset` | [stub] Create/invoke /nexus/customizations/reset (nexus) |
| `GET` | /nexus/ingest | `nexus_get_nexus_ingest` | [stub] List/get /nexus/ingest (nexus) |
| `POST` | /nexus/ingest | `nexus_post_nexus_ingest` | [stub] Create/invoke /nexus/ingest (nexus) |
| `GET` | /nexus/ingest/{id} | `nexus_get_nexus_ingest_id` | [stub] List/get /nexus/ingest/{id} (nexus) |
| `POST` | /nexus/ingest/{id}/retry | `nexus_post_nexus_ingest_id_retry` | [stub] Create/invoke /nexus/ingest/{id}/retry (nexus) |
| `GET` | /nexus/memory | `nexus_get_nexus_memory` | [stub] List/get /nexus/memory (nexus) |
| `POST` | /nexus/memory | `nexus_post_nexus_memory` | [stub] Create/invoke /nexus/memory (nexus) |
| `PUT` | /nexus/memory/{id} | `nexus_put_nexus_memory_id` | [stub] Update /nexus/memory/{id} (nexus) |
| `DELETE` | /nexus/memory/{id} | `nexus_delete_nexus_memory_id` | [stub] Delete /nexus/memory/{id} (nexus) |
| `GET` | /nexus/orchestrate | `nexus_get_nexus_orchestrate` | [stub] List/get /nexus/orchestrate (nexus) |
| `POST` | /nexus/orchestrate | `nexus_post_nexus_orchestrate` | [stub] Create/invoke /nexus/orchestrate (nexus) |
| `GET` | /nexus/orchestrate/{id} | `nexus_get_nexus_orchestrate_id` | [stub] List/get /nexus/orchestrate/{id} (nexus) |
| `POST` | /nexus/orchestrate/{id}/retry | `nexus_post_nexus_orchestrate_id_retry` | [stub] Create/invoke /nexus/orchestrate/{id}/retry (nexus) |
| `GET` | /nexus/patterns | `nexus_get_nexus_patterns` | [stub] List/get /nexus/patterns (nexus) |
| `GET` | /nexus/research | `nexus_get_nexus_research` | [stub] List/get /nexus/research (nexus) |
| `POST` | /nexus/research | `nexus_post_nexus_research` | [stub] Create/invoke /nexus/research (nexus) |
| `GET` | /nexus/research/{id} | `nexus_get_nexus_research_id` | [stub] List/get /nexus/research/{id} (nexus) |
| `GET` | /nexus/research/{id}/stream | `nexus_get_nexus_research_id_stream` | [stub] List/get /nexus/research/{id}/stream (nexus) |
| `GET` | /nexus/skills | `nexus_get_nexus_skills` | [stub] List/get /nexus/skills (nexus) |
| `POST` | /nexus/skills | `nexus_post_nexus_skills` | [stub] Create/invoke /nexus/skills (nexus) |
| `PUT` | /nexus/skills/{id} | `nexus_put_nexus_skills_id` | [stub] Update /nexus/skills/{id} (nexus) |
| `POST` | /nexus/skills/{id}/toggle | `nexus_post_nexus_skills_id_toggle` | [stub] Create/invoke /nexus/skills/{id}/toggle (nexus) |
| `GET` | /nexus/status | `nexus_get_nexus_status` | [stub] List/get /nexus/status (nexus) |

<a id="notification-recipients"></a>

## notification-recipients

Auto-generated tag for notification-recipients route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /notification-recipients/notification-recipients | `notification_recipients_get_notification_recipients_notification_recipients` | [stub] List/get /notification-recipients/notification-recipients (notification-recipients) |
| `POST` | /notification-recipients/notification-recipients | `notification_recipients_post_notification_recipients_notification_recipients` | [stub] Create/invoke /notification-recipients/notification-recipients (notification-recipients) |
| `PATCH` | /notification-recipients/notification-recipients/{id} | `notification_recipients_patch_notification_recipients_notification_recipients_id` | [stub] Patch /notification-recipients/notification-recipients/{id} (notification-recipients) |
| `DELETE` | /notification-recipients/notification-recipients/{id} | `notification_recipients_delete_notification_recipients_notification_recipients_id` | [stub] Delete /notification-recipients/notification-recipients/{id} (notification-recipients) |

<a id="nuro-mesh-advanced"></a>

## nuro-mesh-advanced

Auto-generated tag for nuro-mesh-advanced route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /nuro-mesh/nuro-mesh/cost/analytics | `nuro_mesh_advanced_get_nuro_mesh_nuro_mesh_cost_analytics` | [stub] List/get /nuro-mesh/nuro-mesh/cost/analytics (nuro-mesh-advanced) |
| `POST` | /nuro-mesh/nuro-mesh/cost/budget | `nuro_mesh_advanced_post_nuro_mesh_nuro_mesh_cost_budget` | [stub] Create/invoke /nuro-mesh/nuro-mesh/cost/budget (nuro-mesh-advanced) |
| `GET` | /nuro-mesh/nuro-mesh/cost/budget/{workflowId} | `nuro_mesh_advanced_get_nuro_mesh_nuro_mesh_cost_budget_workflowId` | [stub] List/get /nuro-mesh/nuro-mesh/cost/budget/{workflowId} (nuro-mesh-advanced) |
| `GET` | /nuro-mesh/nuro-mesh/cost/estimate | `nuro_mesh_advanced_get_nuro_mesh_nuro_mesh_cost_estimate` | [stub] List/get /nuro-mesh/nuro-mesh/cost/estimate (nuro-mesh-advanced) |
| `POST` | /nuro-mesh/nuro-mesh/flywheel/feedback | `nuro_mesh_advanced_post_nuro_mesh_nuro_mesh_flywheel_feedback` | [stub] Create/invoke /nuro-mesh/nuro-mesh/flywheel/feedback (nuro-mesh-advanced) |
| `GET` | /nuro-mesh/nuro-mesh/flywheel/golden-runs | `nuro_mesh_advanced_get_nuro_mesh_nuro_mesh_flywheel_golden_runs` | [stub] List/get /nuro-mesh/nuro-mesh/flywheel/golden-runs (nuro-mesh-advanced) |
| `GET` | /nuro-mesh/nuro-mesh/flywheel/stats | `nuro_mesh_advanced_get_nuro_mesh_nuro_mesh_flywheel_stats` | [stub] List/get /nuro-mesh/nuro-mesh/flywheel/stats (nuro-mesh-advanced) |
| `GET` | /nuro-mesh/nuro-mesh/flywheel/trajectories | `nuro_mesh_advanced_get_nuro_mesh_nuro_mesh_flywheel_trajectories` | [stub] List/get /nuro-mesh/nuro-mesh/flywheel/trajectories (nuro-mesh-advanced) |
| `GET` | /nuro-mesh/nuro-mesh/kernel/audit-trail | `nuro_mesh_advanced_get_nuro_mesh_nuro_mesh_kernel_audit_trail` | [stub] List/get /nuro-mesh/nuro-mesh/kernel/audit-trail (nuro-mesh-advanced) |
| `POST` | /nuro-mesh/nuro-mesh/kernel/scope-certificate | `nuro_mesh_advanced_post_nuro_mesh_nuro_mesh_kernel_scope_certificate` | [stub] Create/invoke /nuro-mesh/nuro-mesh/kernel/scope-certificate (nuro-mesh-advanced) |
| `GET` | /nuro-mesh/nuro-mesh/kernel/verify-integrity | `nuro_mesh_advanced_get_nuro_mesh_nuro_mesh_kernel_verify_integrity` | [stub] List/get /nuro-mesh/nuro-mesh/kernel/verify-integrity (nuro-mesh-advanced) |
| `POST` | /nuro-mesh/nuro-mesh/memory/retrieve | `nuro_mesh_advanced_post_nuro_mesh_nuro_mesh_memory_retrieve` | [stub] Create/invoke /nuro-mesh/nuro-mesh/memory/retrieve (nuro-mesh-advanced) |
| `POST` | /nuro-mesh/nuro-mesh/memory/reward | `nuro_mesh_advanced_post_nuro_mesh_nuro_mesh_memory_reward` | [stub] Create/invoke /nuro-mesh/nuro-mesh/memory/reward (nuro-mesh-advanced) |
| `GET` | /nuro-mesh/nuro-mesh/memory/stats/{agentId} | `nuro_mesh_advanced_get_nuro_mesh_nuro_mesh_memory_stats_agentId` | [stub] List/get /nuro-mesh/nuro-mesh/memory/stats/{agentId} (nuro-mesh-advanced) |
| `GET` | /nuro-mesh/nuro-mesh/observability/stats | `nuro_mesh_advanced_get_nuro_mesh_nuro_mesh_observability_stats` | [stub] List/get /nuro-mesh/nuro-mesh/observability/stats (nuro-mesh-advanced) |
| `GET` | /nuro-mesh/nuro-mesh/observability/traces | `nuro_mesh_advanced_get_nuro_mesh_nuro_mesh_observability_traces` | [stub] List/get /nuro-mesh/nuro-mesh/observability/traces (nuro-mesh-advanced) |
| `GET` | /nuro-mesh/nuro-mesh/observability/traces/{traceId} | `nuro_mesh_advanced_get_nuro_mesh_nuro_mesh_observability_traces_traceId` | [stub] List/get /nuro-mesh/nuro-mesh/observability/traces/{traceId} (nuro-mesh-advanced) |

<a id="oidc-auth"></a>

## oidc-auth

Auto-generated tag for oidc-auth route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /auth/auth/user | `oidc_auth_get_auth_auth_user` | [stub] List/get /auth/auth/user (oidc-auth) |
| `GET` | /auth/azure-ad/callback | `oidc_auth_get_auth_azure_ad_callback` | [stub] List/get /auth/azure-ad/callback (oidc-auth) |
| `GET` | /auth/azure-ad/login | `oidc_auth_get_auth_azure_ad_login` | [stub] List/get /auth/azure-ad/login (oidc-auth) |
| `GET` | /auth/callback | `oidc_auth_get_auth_callback` | [stub] List/get /auth/callback (oidc-auth) |
| `GET` | /auth/logout | `oidc_auth_get_auth_logout` | [stub] List/get /auth/logout (oidc-auth) |
| `POST` | /auth/mobile-auth/logout | `oidc_auth_post_auth_mobile_auth_logout` | [stub] Create/invoke /auth/mobile-auth/logout (oidc-auth) |
| `POST` | /auth/mobile-auth/token-exchange | `oidc_auth_post_auth_mobile_auth_token_exchange` | [stub] Create/invoke /auth/mobile-auth/token-exchange (oidc-auth) |
| `GET` | /azure-ad/auth/providers | `oidc_auth_get_azure_ad_auth_providers` | [stub] List/get /azure-ad/auth/providers (oidc-auth) |
| `GET` | /azure-ad/auth/user | `oidc_auth_get_azure_ad_auth_user` | [stub] List/get /azure-ad/auth/user (oidc-auth) |
| `GET` | /azure-ad/azure-ad/callback | `oidc_auth_get_azure_ad_azure_ad_callback` | [stub] List/get /azure-ad/azure-ad/callback (oidc-auth) |
| `GET` | /azure-ad/azure-ad/login | `oidc_auth_get_azure_ad_azure_ad_login` | [stub] List/get /azure-ad/azure-ad/login (oidc-auth) |
| `GET` | /azure-ad/callback | `oidc_auth_get_azure_ad_callback` | [stub] List/get /azure-ad/callback (oidc-auth) |
| `GET` | /azure-ad/login | `oidc_auth_get_azure_ad_login` | [stub] List/get /azure-ad/login (oidc-auth) |
| `GET` | /azure-ad/logout | `oidc_auth_get_azure_ad_logout` | [stub] List/get /azure-ad/logout (oidc-auth) |
| `POST` | /azure-ad/mobile-auth/logout | `oidc_auth_post_azure_ad_mobile_auth_logout` | [stub] Create/invoke /azure-ad/mobile-auth/logout (oidc-auth) |
| `POST` | /azure-ad/mobile-auth/token-exchange | `oidc_auth_post_azure_ad_mobile_auth_token_exchange` | [stub] Create/invoke /azure-ad/mobile-auth/token-exchange (oidc-auth) |
| `GET` | /callback/auth/providers | `oidc_auth_get_callback_auth_providers` | [stub] List/get /callback/auth/providers (oidc-auth) |
| `GET` | /callback/auth/user | `oidc_auth_get_callback_auth_user` | [stub] List/get /callback/auth/user (oidc-auth) |
| `GET` | /callback/azure-ad/callback | `oidc_auth_get_callback_azure_ad_callback` | [stub] List/get /callback/azure-ad/callback (oidc-auth) |
| `GET` | /callback/azure-ad/login | `oidc_auth_get_callback_azure_ad_login` | [stub] List/get /callback/azure-ad/login (oidc-auth) |
| `GET` | /callback/callback | `oidc_auth_get_callback_callback` | [stub] List/get /callback/callback (oidc-auth) |
| `GET` | /callback/login | `oidc_auth_get_callback_login` | [stub] List/get /callback/login (oidc-auth) |
| `GET` | /callback/logout | `oidc_auth_get_callback_logout` | [stub] List/get /callback/logout (oidc-auth) |
| `POST` | /callback/mobile-auth/logout | `oidc_auth_post_callback_mobile_auth_logout` | [stub] Create/invoke /callback/mobile-auth/logout (oidc-auth) |
| `POST` | /callback/mobile-auth/token-exchange | `oidc_auth_post_callback_mobile_auth_token_exchange` | [stub] Create/invoke /callback/mobile-auth/token-exchange (oidc-auth) |
| `GET` | /login/auth/providers | `oidc_auth_get_login_auth_providers` | [stub] List/get /login/auth/providers (oidc-auth) |
| `GET` | /login/auth/user | `oidc_auth_get_login_auth_user` | [stub] List/get /login/auth/user (oidc-auth) |
| `GET` | /login/azure-ad/callback | `oidc_auth_get_login_azure_ad_callback` | [stub] List/get /login/azure-ad/callback (oidc-auth) |
| `GET` | /login/azure-ad/login | `oidc_auth_get_login_azure_ad_login` | [stub] List/get /login/azure-ad/login (oidc-auth) |
| `GET` | /login/callback | `oidc_auth_get_login_callback` | [stub] List/get /login/callback (oidc-auth) |
| `GET` | /login/login | `oidc_auth_get_login_login` | [stub] List/get /login/login (oidc-auth) |
| `GET` | /login/logout | `oidc_auth_get_login_logout` | [stub] List/get /login/logout (oidc-auth) |
| `POST` | /login/mobile-auth/logout | `oidc_auth_post_login_mobile_auth_logout` | [stub] Create/invoke /login/mobile-auth/logout (oidc-auth) |
| `POST` | /login/mobile-auth/token-exchange | `oidc_auth_post_login_mobile_auth_token_exchange` | [stub] Create/invoke /login/mobile-auth/token-exchange (oidc-auth) |
| `GET` | /logout/auth/providers | `oidc_auth_get_logout_auth_providers` | [stub] List/get /logout/auth/providers (oidc-auth) |
| `GET` | /logout/auth/user | `oidc_auth_get_logout_auth_user` | [stub] List/get /logout/auth/user (oidc-auth) |
| `GET` | /logout/azure-ad/callback | `oidc_auth_get_logout_azure_ad_callback` | [stub] List/get /logout/azure-ad/callback (oidc-auth) |
| `GET` | /logout/azure-ad/login | `oidc_auth_get_logout_azure_ad_login` | [stub] List/get /logout/azure-ad/login (oidc-auth) |
| `GET` | /logout/callback | `oidc_auth_get_logout_callback` | [stub] List/get /logout/callback (oidc-auth) |
| `GET` | /logout/login | `oidc_auth_get_logout_login` | [stub] List/get /logout/login (oidc-auth) |
| `GET` | /logout/logout | `oidc_auth_get_logout_logout` | [stub] List/get /logout/logout (oidc-auth) |
| `POST` | /logout/mobile-auth/logout | `oidc_auth_post_logout_mobile_auth_logout` | [stub] Create/invoke /logout/mobile-auth/logout (oidc-auth) |
| `POST` | /logout/mobile-auth/token-exchange | `oidc_auth_post_logout_mobile_auth_token_exchange` | [stub] Create/invoke /logout/mobile-auth/token-exchange (oidc-auth) |
| `GET` | /mobile-auth/auth/providers | `oidc_auth_get_mobile_auth_auth_providers` | [stub] List/get /mobile-auth/auth/providers (oidc-auth) |
| `GET` | /mobile-auth/auth/user | `oidc_auth_get_mobile_auth_auth_user` | [stub] List/get /mobile-auth/auth/user (oidc-auth) |
| `GET` | /mobile-auth/azure-ad/callback | `oidc_auth_get_mobile_auth_azure_ad_callback` | [stub] List/get /mobile-auth/azure-ad/callback (oidc-auth) |
| `GET` | /mobile-auth/azure-ad/login | `oidc_auth_get_mobile_auth_azure_ad_login` | [stub] List/get /mobile-auth/azure-ad/login (oidc-auth) |
| `GET` | /mobile-auth/callback | `oidc_auth_get_mobile_auth_callback` | [stub] List/get /mobile-auth/callback (oidc-auth) |
| `GET` | /mobile-auth/login | `oidc_auth_get_mobile_auth_login` | [stub] List/get /mobile-auth/login (oidc-auth) |
| `POST` | /mobile-auth/mobile-auth/logout | `oidc_auth_post_mobile_auth_mobile_auth_logout` | [stub] Create/invoke /mobile-auth/mobile-auth/logout (oidc-auth) |
| `POST` | /mobile-auth/mobile-auth/token-exchange | `oidc_auth_post_mobile_auth_mobile_auth_token_exchange` | [stub] Create/invoke /mobile-auth/mobile-auth/token-exchange (oidc-auth) |

<a id="onboarding"></a>

## onboarding

Auto-generated tag for onboarding route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `POST` | /onboarding/onboarding/org | `onboarding_post_onboarding_onboarding_org` | [stub] Create/invoke /onboarding/onboarding/org (onboarding) |
| `POST` | /onboarding/onboarding/resend-invite/{orgSlug} | `onboarding_post_onboarding_onboarding_resend_invite_orgSlug` | [stub] Create/invoke /onboarding/onboarding/resend-invite/{orgSlug} (onboarding) |
| `GET` | /onboarding/onboarding/wizard/{orgSlug} | `onboarding_get_onboarding_onboarding_wizard_orgSlug` | [stub] List/get /onboarding/onboarding/wizard/{orgSlug} (onboarding) |
| `PUT` | /onboarding/onboarding/wizard/{orgSlug} | `onboarding_put_onboarding_onboarding_wizard_orgSlug` | [stub] Update /onboarding/onboarding/wizard/{orgSlug} (onboarding) |
| `POST` | /onboarding/onboarding/wizard/{orgSlug}/complete | `onboarding_post_onboarding_onboarding_wizard_orgSlug_complete` | [stub] Create/invoke /onboarding/onboarding/wizard/{orgSlug}/complete (onboarding) |

<a id="ontology"></a>

## ontology

Auto-generated tag for ontology route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /ontology/ontology/domain/{domain} | `ontology_get_ontology_ontology_domain_domain` | [stub] List/get /ontology/ontology/domain/{domain} (ontology) |
| `POST` | /ontology/ontology/entity | `ontology_post_ontology_ontology_entity` | [stub] Create/invoke /ontology/ontology/entity (ontology) |
| `GET` | /ontology/ontology/entity/{id} | `ontology_get_ontology_ontology_entity_id` | [stub] List/get /ontology/ontology/entity/{id} (ontology) |
| `GET` | /ontology/ontology/entity/{id}/connections | `ontology_get_ontology_ontology_entity_id_connections` | [stub] List/get /ontology/ontology/entity/{id}/connections (ontology) |
| `GET` | /ontology/ontology/entity/{id}/traverse | `ontology_get_ontology_ontology_entity_id_traverse` | [stub] List/get /ontology/ontology/entity/{id}/traverse (ontology) |
| `POST` | /ontology/ontology/graph-rag | `ontology_post_ontology_ontology_graph_rag` | [stub] Create/invoke /ontology/ontology/graph-rag (ontology) |
| `POST` | /ontology/ontology/relationship | `ontology_post_ontology_ontology_relationship` | [stub] Create/invoke /ontology/ontology/relationship (ontology) |
| `GET` | /ontology/ontology/search | `ontology_get_ontology_ontology_search` | [stub] List/get /ontology/ontology/search (ontology) |
| `GET` | /ontology/ontology/stats | `ontology_get_ontology_ontology_stats` | [stub] List/get /ontology/ontology/stats (ontology) |

<a id="opportunities"></a>

## opportunities

Auto-generated tag for opportunities route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `POST` | /opportunities/terra/opportunities/save | `opportunities_post_opportunities_terra_opportunities_save` | [stub] Create/invoke /opportunities/terra/opportunities/save (opportunities) |
| `GET` | /opportunities/terra/opportunities/saved | `opportunities_get_opportunities_terra_opportunities_saved` | [stub] List/get /opportunities/terra/opportunities/saved (opportunities) |

<a id="ops-management"></a>

## ops-management

Auto-generated tag for ops-management route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /ops/ops/alert-events | `ops_management_get_ops_ops_alert_events` | [stub] List/get /ops/ops/alert-events (ops-management) |
| `POST` | /ops/ops/alert-events/{id}/acknowledge | `ops_management_post_ops_ops_alert_events_id_acknowledge` | [stub] Create/invoke /ops/ops/alert-events/{id}/acknowledge (ops-management) |
| `GET` | /ops/ops/alert-rules | `ops_management_get_ops_ops_alert_rules` | [stub] List/get /ops/ops/alert-rules (ops-management) |
| `POST` | /ops/ops/alert-rules | `ops_management_post_ops_ops_alert_rules` | [stub] Create/invoke /ops/ops/alert-rules (ops-management) |
| `PATCH` | /ops/ops/alert-rules/{id} | `ops_management_patch_ops_ops_alert_rules_id` | [stub] Patch /ops/ops/alert-rules/{id} (ops-management) |
| `DELETE` | /ops/ops/alert-rules/{id} | `ops_management_delete_ops_ops_alert_rules_id` | [stub] Delete /ops/ops/alert-rules/{id} (ops-management) |
| `POST` | /ops/ops/alert-rules/evaluate | `ops_management_post_ops_ops_alert_rules_evaluate` | [stub] Create/invoke /ops/ops/alert-rules/evaluate (ops-management) |
| `GET` | /ops/ops/incidents | `ops_management_get_ops_ops_incidents` | [stub] List/get /ops/ops/incidents (ops-management) |
| `POST` | /ops/ops/incidents | `ops_management_post_ops_ops_incidents` | [stub] Create/invoke /ops/ops/incidents (ops-management) |
| `GET` | /ops/ops/incidents/{id} | `ops_management_get_ops_ops_incidents_id` | [stub] List/get /ops/ops/incidents/{id} (ops-management) |
| `PATCH` | /ops/ops/incidents/{id} | `ops_management_patch_ops_ops_incidents_id` | [stub] Patch /ops/ops/incidents/{id} (ops-management) |
| `DELETE` | /ops/ops/incidents/{id} | `ops_management_delete_ops_ops_incidents_id` | [stub] Delete /ops/ops/incidents/{id} (ops-management) |
| `GET` | /ops/ops/runbooks | `ops_management_get_ops_ops_runbooks` | [stub] List/get /ops/ops/runbooks (ops-management) |
| `POST` | /ops/ops/runbooks | `ops_management_post_ops_ops_runbooks` | [stub] Create/invoke /ops/ops/runbooks (ops-management) |
| `GET` | /ops/ops/runbooks/{id} | `ops_management_get_ops_ops_runbooks_id` | [stub] List/get /ops/ops/runbooks/{id} (ops-management) |
| `PATCH` | /ops/ops/runbooks/{id} | `ops_management_patch_ops_ops_runbooks_id` | [stub] Patch /ops/ops/runbooks/{id} (ops-management) |
| `DELETE` | /ops/ops/runbooks/{id} | `ops_management_delete_ops_ops_runbooks_id` | [stub] Delete /ops/ops/runbooks/{id} (ops-management) |
| `GET` | /ops/ops/service-deps | `ops_management_get_ops_ops_service_deps` | [stub] List/get /ops/ops/service-deps (ops-management) |
| `POST` | /ops/ops/service-deps | `ops_management_post_ops_ops_service_deps` | [stub] Create/invoke /ops/ops/service-deps (ops-management) |
| `DELETE` | /ops/ops/service-deps/{id} | `ops_management_delete_ops_ops_service_deps_id` | [stub] Delete /ops/ops/service-deps/{id} (ops-management) |
| `GET` | /ops/ops/slo | `ops_management_get_ops_ops_slo` | [stub] List/get /ops/ops/slo (ops-management) |
| `GET` | /ops/ops/uptime-history | `ops_management_get_ops_ops_uptime_history` | [stub] List/get /ops/ops/uptime-history (ops-management) |

<a id="org-settings"></a>

## org-settings

Auto-generated tag for org-settings route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `PATCH` | /orgs/orgs/{orgSlug} | `org_settings_patch_orgs_orgs_orgSlug` | [stub] Patch /orgs/orgs/{orgSlug} (org-settings) |
| `GET` | /orgs/orgs/{orgSlug}/members | `org_settings_get_orgs_orgs_orgSlug_members` | [stub] List/get /orgs/orgs/{orgSlug}/members (org-settings) |
| `DELETE` | /orgs/orgs/{orgSlug}/members/{userId} | `org_settings_delete_orgs_orgs_orgSlug_members_userId` | [stub] Delete /orgs/orgs/{orgSlug}/members/{userId} (org-settings) |
| `PUT` | /orgs/orgs/{orgSlug}/members/{userId}/role | `org_settings_put_orgs_orgs_orgSlug_members_userId_role` | [stub] Update /orgs/orgs/{orgSlug}/members/{userId}/role (org-settings) |
| `PATCH` | /orgs/orgs/{orgSlug}/mfa-required | `org_settings_patch_orgs_orgs_orgSlug_mfa_required` | [stub] Patch /orgs/orgs/{orgSlug}/mfa-required (org-settings) |
| `GET` | /orgs/orgs/{orgSlug}/notification-prefs | `org_settings_get_orgs_orgs_orgSlug_notification_prefs` | [stub] List/get /orgs/orgs/{orgSlug}/notification-prefs (org-settings) |
| `PUT` | /orgs/orgs/{orgSlug}/notification-prefs | `org_settings_put_orgs_orgs_orgSlug_notification_prefs` | [stub] Update /orgs/orgs/{orgSlug}/notification-prefs (org-settings) |
| `GET` | /orgs/orgs/{orgSlug}/profile | `org_settings_get_orgs_orgs_orgSlug_profile` | [stub] List/get /orgs/orgs/{orgSlug}/profile (org-settings) |
| `PUT` | /orgs/orgs/{orgSlug}/profile | `org_settings_put_orgs_orgs_orgSlug_profile` | [stub] Update /orgs/orgs/{orgSlug}/profile (org-settings) |
| `POST` | /orgs/user/deactivate | `org_settings_post_orgs_user_deactivate` | [stub] Create/invoke /orgs/user/deactivate (org-settings) |
| `GET` | /orgs/user/notification-preferences | `org_settings_get_orgs_user_notification_preferences` | [stub] List/get /orgs/user/notification-preferences (org-settings) |
| `PUT` | /orgs/user/notification-preferences | `org_settings_put_orgs_user_notification_preferences` | [stub] Update /orgs/user/notification-preferences (org-settings) |
| `POST` | /orgs/user/password-reset | `org_settings_post_orgs_user_password_reset` | [stub] Create/invoke /orgs/user/password-reset (org-settings) |
| `POST` | /orgs/user/password-reset/confirm | `org_settings_post_orgs_user_password_reset_confirm` | [stub] Create/invoke /orgs/user/password-reset/confirm (org-settings) |
| `GET` | /orgs/user/profile | `org_settings_get_orgs_user_profile` | [stub] List/get /orgs/user/profile (org-settings) |
| `PUT` | /orgs/user/profile | `org_settings_put_orgs_user_profile` | [stub] Update /orgs/user/profile (org-settings) |
| `PATCH` | /user/orgs/{orgSlug} | `org_settings_patch_user_orgs_orgSlug` | [stub] Patch /user/orgs/{orgSlug} (org-settings) |
| `GET` | /user/orgs/{orgSlug}/members | `org_settings_get_user_orgs_orgSlug_members` | [stub] List/get /user/orgs/{orgSlug}/members (org-settings) |
| `DELETE` | /user/orgs/{orgSlug}/members/{userId} | `org_settings_delete_user_orgs_orgSlug_members_userId` | [stub] Delete /user/orgs/{orgSlug}/members/{userId} (org-settings) |
| `PUT` | /user/orgs/{orgSlug}/members/{userId}/role | `org_settings_put_user_orgs_orgSlug_members_userId_role` | [stub] Update /user/orgs/{orgSlug}/members/{userId}/role (org-settings) |
| `PATCH` | /user/orgs/{orgSlug}/mfa-required | `org_settings_patch_user_orgs_orgSlug_mfa_required` | [stub] Patch /user/orgs/{orgSlug}/mfa-required (org-settings) |
| `GET` | /user/orgs/{orgSlug}/notification-prefs | `org_settings_get_user_orgs_orgSlug_notification_prefs` | [stub] List/get /user/orgs/{orgSlug}/notification-prefs (org-settings) |
| `PUT` | /user/orgs/{orgSlug}/notification-prefs | `org_settings_put_user_orgs_orgSlug_notification_prefs` | [stub] Update /user/orgs/{orgSlug}/notification-prefs (org-settings) |
| `GET` | /user/orgs/{orgSlug}/profile | `org_settings_get_user_orgs_orgSlug_profile` | [stub] List/get /user/orgs/{orgSlug}/profile (org-settings) |
| `PUT` | /user/orgs/{orgSlug}/profile | `org_settings_put_user_orgs_orgSlug_profile` | [stub] Update /user/orgs/{orgSlug}/profile (org-settings) |
| `POST` | /user/user/deactivate | `org_settings_post_user_user_deactivate` | [stub] Create/invoke /user/user/deactivate (org-settings) |
| `GET` | /user/user/notification-preferences | `org_settings_get_user_user_notification_preferences` | [stub] List/get /user/user/notification-preferences (org-settings) |
| `PUT` | /user/user/notification-preferences | `org_settings_put_user_user_notification_preferences` | [stub] Update /user/user/notification-preferences (org-settings) |
| `POST` | /user/user/password-reset | `org_settings_post_user_user_password_reset` | [stub] Create/invoke /user/user/password-reset (org-settings) |
| `POST` | /user/user/password-reset/confirm | `org_settings_post_user_user_password_reset_confirm` | [stub] Create/invoke /user/user/password-reset/confirm (org-settings) |
| `GET` | /user/user/profile | `org_settings_get_user_user_profile` | [stub] List/get /user/user/profile (org-settings) |
| `PUT` | /user/user/profile | `org_settings_put_user_user_profile` | [stub] Update /user/user/profile (org-settings) |

<a id="ot-ics"></a>

## ot-ics

Auto-generated tag for ot-ics route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /aegis/aegis/ot-ics/anomaly-scores | `ot_ics_get_aegis_aegis_ot_ics_anomaly_scores` | [stub] List/get /aegis/aegis/ot-ics/anomaly-scores (ot-ics) |
| `POST` | /aegis/aegis/ot-ics/anomaly-scores | `ot_ics_post_aegis_aegis_ot_ics_anomaly_scores` | [stub] Create/invoke /aegis/aegis/ot-ics/anomaly-scores (ot-ics) |
| `GET` | /aegis/aegis/ot-ics/assets | `ot_ics_get_aegis_aegis_ot_ics_assets` | [stub] List/get /aegis/aegis/ot-ics/assets (ot-ics) |
| `POST` | /aegis/aegis/ot-ics/assets | `ot_ics_post_aegis_aegis_ot_ics_assets` | [stub] Create/invoke /aegis/aegis/ot-ics/assets (ot-ics) |
| `POST` | /aegis/aegis/ot-ics/baseline/recompute | `ot_ics_post_aegis_aegis_ot_ics_baseline_recompute` | [stub] Create/invoke /aegis/aegis/ot-ics/baseline/recompute (ot-ics) |
| `GET` | /aegis/aegis/ot-ics/conversations | `ot_ics_get_aegis_aegis_ot_ics_conversations` | [stub] List/get /aegis/aegis/ot-ics/conversations (ot-ics) |
| `POST` | /aegis/aegis/ot-ics/conversations | `ot_ics_post_aegis_aegis_ot_ics_conversations` | [stub] Create/invoke /aegis/aegis/ot-ics/conversations (ot-ics) |
| `POST` | /aegis/aegis/ot-ics/demo/seed | `ot_ics_post_aegis_aegis_ot_ics_demo_seed` | [stub] Create/invoke /aegis/aegis/ot-ics/demo/seed (ot-ics) |
| `GET` | /aegis/aegis/ot-ics/frames | `ot_ics_get_aegis_aegis_ot_ics_frames` | [stub] List/get /aegis/aegis/ot-ics/frames (ot-ics) |
| `POST` | /aegis/aegis/ot-ics/frames | `ot_ics_post_aegis_aegis_ot_ics_frames` | [stub] Create/invoke /aegis/aegis/ot-ics/frames (ot-ics) |

<a id="ownership-control"></a>

## ownership-control

Auto-generated tag for ownership-control route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `PATCH` | /ownership/ownership/allocations/{id} | `ownership_control_patch_ownership_ownership_allocations_id` | [stub] Patch /ownership/ownership/allocations/{id} (ownership-control) |
| `DELETE` | /ownership/ownership/allocations/{id} | `ownership_control_delete_ownership_ownership_allocations_id` | [stub] Delete /ownership/ownership/allocations/{id} (ownership-control) |
| `PATCH` | /ownership/ownership/capital-contributions/{id} | `ownership_control_patch_ownership_ownership_capital_contributions_id` | [stub] Patch /ownership/ownership/capital-contributions/{id} (ownership-control) |
| `DELETE` | /ownership/ownership/capital-contributions/{id} | `ownership_control_delete_ownership_ownership_capital_contributions_id` | [stub] Delete /ownership/ownership/capital-contributions/{id} (ownership-control) |
| `PATCH` | /ownership/ownership/certification-readiness/{id} | `ownership_control_patch_ownership_ownership_certification_readiness_id` | [stub] Patch /ownership/ownership/certification-readiness/{id} (ownership-control) |
| `DELETE` | /ownership/ownership/certification-readiness/{id} | `ownership_control_delete_ownership_ownership_certification_readiness_id` | [stub] Delete /ownership/ownership/certification-readiness/{id} (ownership-control) |
| `PATCH` | /ownership/ownership/control-roles/{id} | `ownership_control_patch_ownership_ownership_control_roles_id` | [stub] Patch /ownership/ownership/control-roles/{id} (ownership-control) |
| `DELETE` | /ownership/ownership/control-roles/{id} | `ownership_control_delete_ownership_ownership_control_roles_id` | [stub] Delete /ownership/ownership/control-roles/{id} (ownership-control) |
| `DELETE` | /ownership/ownership/decision-log/{id} | `ownership_control_delete_ownership_ownership_decision_log_id` | [stub] Delete /ownership/ownership/decision-log/{id} (ownership-control) |
| `PATCH` | /ownership/ownership/governance-documents/{id} | `ownership_control_patch_ownership_ownership_governance_documents_id` | [stub] Patch /ownership/ownership/governance-documents/{id} (ownership-control) |
| `DELETE` | /ownership/ownership/governance-documents/{id} | `ownership_control_delete_ownership_ownership_governance_documents_id` | [stub] Delete /ownership/ownership/governance-documents/{id} (ownership-control) |
| `GET` | /ownership/ownership/health | `ownership_control_get_ownership_ownership_health` | [stub] List/get /ownership/ownership/health (ownership-control) |
| `PATCH` | /ownership/ownership/legal-flags/{id} | `ownership_control_patch_ownership_ownership_legal_flags_id` | [stub] Patch /ownership/ownership/legal-flags/{id} (ownership-control) |
| `DELETE` | /ownership/ownership/legal-flags/{id} | `ownership_control_delete_ownership_ownership_legal_flags_id` | [stub] Delete /ownership/ownership/legal-flags/{id} (ownership-control) |
| `PATCH` | /ownership/ownership/manager-roles/{id} | `ownership_control_patch_ownership_ownership_manager_roles_id` | [stub] Patch /ownership/ownership/manager-roles/{id} (ownership-control) |
| `DELETE` | /ownership/ownership/manager-roles/{id} | `ownership_control_delete_ownership_ownership_manager_roles_id` | [stub] Delete /ownership/ownership/manager-roles/{id} (ownership-control) |
| `GET` | /ownership/ownership/next-actions | `ownership_control_get_ownership_ownership_next_actions` | [stub] List/get /ownership/ownership/next-actions (ownership-control) |
| `PATCH` | /ownership/ownership/officer-roles/{id} | `ownership_control_patch_ownership_ownership_officer_roles_id` | [stub] Patch /ownership/ownership/officer-roles/{id} (ownership-control) |
| `DELETE` | /ownership/ownership/officer-roles/{id} | `ownership_control_delete_ownership_ownership_officer_roles_id` | [stub] Delete /ownership/ownership/officer-roles/{id} (ownership-control) |
| `GET` | /ownership/ownership/scenarios | `ownership_control_get_ownership_ownership_scenarios` | [stub] List/get /ownership/ownership/scenarios (ownership-control) |
| `POST` | /ownership/ownership/scenarios | `ownership_control_post_ownership_ownership_scenarios` | [stub] Create/invoke /ownership/ownership/scenarios (ownership-control) |
| `GET` | /ownership/ownership/scenarios/{id} | `ownership_control_get_ownership_ownership_scenarios_id` | [stub] List/get /ownership/ownership/scenarios/{id} (ownership-control) |
| `PATCH` | /ownership/ownership/scenarios/{id} | `ownership_control_patch_ownership_ownership_scenarios_id` | [stub] Patch /ownership/ownership/scenarios/{id} (ownership-control) |
| `DELETE` | /ownership/ownership/scenarios/{id} | `ownership_control_delete_ownership_ownership_scenarios_id` | [stub] Delete /ownership/ownership/scenarios/{id} (ownership-control) |
| `GET` | /ownership/ownership/scenarios/{id}/allocations | `ownership_control_get_ownership_ownership_scenarios_id_allocations` | [stub] List/get /ownership/ownership/scenarios/{id}/allocations (ownership-control) |
| `POST` | /ownership/ownership/scenarios/{id}/allocations | `ownership_control_post_ownership_ownership_scenarios_id_allocations` | [stub] Create/invoke /ownership/ownership/scenarios/{id}/allocations (ownership-control) |
| `POST` | /ownership/ownership/scenarios/{id}/capital-contributions | `ownership_control_post_ownership_ownership_scenarios_id_capital_contributions` | [stub] Create/invoke /ownership/ownership/scenarios/{id}/capital-contributions (ownership-control) |
| `POST` | /ownership/ownership/scenarios/{id}/certification-readiness | `ownership_control_post_ownership_ownership_scenarios_id_certification_readiness` | [stub] Create/invoke /ownership/ownership/scenarios/{id}/certification-readiness (ownership-control) |
| `POST` | /ownership/ownership/scenarios/{id}/control-roles | `ownership_control_post_ownership_ownership_scenarios_id_control_roles` | [stub] Create/invoke /ownership/ownership/scenarios/{id}/control-roles (ownership-control) |
| `GET` | /ownership/ownership/scenarios/{id}/decision-log | `ownership_control_get_ownership_ownership_scenarios_id_decision_log` | [stub] List/get /ownership/ownership/scenarios/{id}/decision-log (ownership-control) |
| `POST` | /ownership/ownership/scenarios/{id}/decision-log | `ownership_control_post_ownership_ownership_scenarios_id_decision_log` | [stub] Create/invoke /ownership/ownership/scenarios/{id}/decision-log (ownership-control) |
| `POST` | /ownership/ownership/scenarios/{id}/governance-documents | `ownership_control_post_ownership_ownership_scenarios_id_governance_documents` | [stub] Create/invoke /ownership/ownership/scenarios/{id}/governance-documents (ownership-control) |
| `GET` | /ownership/ownership/scenarios/{id}/legal-flags | `ownership_control_get_ownership_ownership_scenarios_id_legal_flags` | [stub] List/get /ownership/ownership/scenarios/{id}/legal-flags (ownership-control) |
| `POST` | /ownership/ownership/scenarios/{id}/legal-flags | `ownership_control_post_ownership_ownership_scenarios_id_legal_flags` | [stub] Create/invoke /ownership/ownership/scenarios/{id}/legal-flags (ownership-control) |
| `POST` | /ownership/ownership/scenarios/{id}/manager-roles | `ownership_control_post_ownership_ownership_scenarios_id_manager_roles` | [stub] Create/invoke /ownership/ownership/scenarios/{id}/manager-roles (ownership-control) |
| `POST` | /ownership/ownership/scenarios/{id}/officer-roles | `ownership_control_post_ownership_ownership_scenarios_id_officer_roles` | [stub] Create/invoke /ownership/ownership/scenarios/{id}/officer-roles (ownership-control) |
| `POST` | /ownership/ownership/scenarios/{id}/signature-authority | `ownership_control_post_ownership_ownership_scenarios_id_signature_authority` | [stub] Create/invoke /ownership/ownership/scenarios/{id}/signature-authority (ownership-control) |
| `POST` | /ownership/ownership/scenarios/{id}/voting-rights | `ownership_control_post_ownership_ownership_scenarios_id_voting_rights` | [stub] Create/invoke /ownership/ownership/scenarios/{id}/voting-rights (ownership-control) |
| `POST` | /ownership/ownership/seed-preferred-template | `ownership_control_post_ownership_ownership_seed_preferred_template` | [stub] Create/invoke /ownership/ownership/seed-preferred-template (ownership-control) |
| `PATCH` | /ownership/ownership/signature-authority/{id} | `ownership_control_patch_ownership_ownership_signature_authority_id` | [stub] Patch /ownership/ownership/signature-authority/{id} (ownership-control) |
| `DELETE` | /ownership/ownership/signature-authority/{id} | `ownership_control_delete_ownership_ownership_signature_authority_id` | [stub] Delete /ownership/ownership/signature-authority/{id} (ownership-control) |
| `PATCH` | /ownership/ownership/voting-rights/{id} | `ownership_control_patch_ownership_ownership_voting_rights_id` | [stub] Patch /ownership/ownership/voting-rights/{id} (ownership-control) |
| `DELETE` | /ownership/ownership/voting-rights/{id} | `ownership_control_delete_ownership_ownership_voting_rights_id` | [stub] Delete /ownership/ownership/voting-rights/{id} (ownership-control) |

<a id="page-view-tracking"></a>

## page-view-tracking

Auto-generated tag for page-view-tracking route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `POST` | /track/track/page-view | `page_view_tracking_post_track_track_page_view` | [stub] Create/invoke /track/track/page-view (page-view-tracking) |

<a id="partner-portal"></a>

## partner-portal

Auto-generated tag for partner-portal route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /org-branding/org-branding/{orgSlug} | `partner_portal_get_org_branding_org_branding_orgSlug` | [stub] List/get /org-branding/org-branding/{orgSlug} (partner-portal) |
| `GET` | /org-branding/orgs/{orgId}/branding | `partner_portal_get_org_branding_orgs_orgId_branding` | [stub] List/get /org-branding/orgs/{orgId}/branding (partner-portal) |
| `PUT` | /org-branding/orgs/{orgId}/branding | `partner_portal_put_org_branding_orgs_orgId_branding` | [stub] Update /org-branding/orgs/{orgId}/branding (partner-portal) |
| `DELETE` | /org-branding/orgs/{orgId}/branding | `partner_portal_delete_org_branding_orgs_orgId_branding` | [stub] Delete /org-branding/orgs/{orgId}/branding (partner-portal) |
| `GET` | /org-branding/orgs/{orgId}/custom-domains | `partner_portal_get_org_branding_orgs_orgId_custom_domains` | [stub] List/get /org-branding/orgs/{orgId}/custom-domains (partner-portal) |
| `POST` | /org-branding/orgs/{orgId}/custom-domains | `partner_portal_post_org_branding_orgs_orgId_custom_domains` | [stub] Create/invoke /org-branding/orgs/{orgId}/custom-domains (partner-portal) |
| `PATCH` | /org-branding/orgs/{orgId}/custom-domains/{domainId} | `partner_portal_patch_org_branding_orgs_orgId_custom_domains_domainId` | [stub] Patch /org-branding/orgs/{orgId}/custom-domains/{domainId} (partner-portal) |
| `DELETE` | /org-branding/orgs/{orgId}/custom-domains/{domainId} | `partner_portal_delete_org_branding_orgs_orgId_custom_domains_domainId` | [stub] Delete /org-branding/orgs/{orgId}/custom-domains/{domainId} (partner-portal) |
| `POST` | /org-branding/orgs/{orgId}/custom-domains/{domainId}/activate | `partner_portal_post_org_branding_orgs_orgId_custom_domains_domainId_activate` | [stub] Create/invoke /org-branding/orgs/{orgId}/custom-domains/{domainId}/activate (partner-portal) |
| `POST` | /org-branding/orgs/{orgId}/custom-domains/{domainId}/verify | `partner_portal_post_org_branding_orgs_orgId_custom_domains_domainId_verify` | [stub] Create/invoke /org-branding/orgs/{orgId}/custom-domains/{domainId}/verify (partner-portal) |
| `GET` | /org-branding/partner/accounts | `partner_portal_get_org_branding_partner_accounts` | [stub] List/get /org-branding/partner/accounts (partner-portal) |
| `POST` | /org-branding/partner/accounts | `partner_portal_post_org_branding_partner_accounts` | [stub] Create/invoke /org-branding/partner/accounts (partner-portal) |
| `GET` | /org-branding/partner/accounts/{id} | `partner_portal_get_org_branding_partner_accounts_id` | [stub] List/get /org-branding/partner/accounts/{id} (partner-portal) |
| `PATCH` | /org-branding/partner/accounts/{id} | `partner_portal_patch_org_branding_partner_accounts_id` | [stub] Patch /org-branding/partner/accounts/{id} (partner-portal) |
| `POST` | /org-branding/partner/accounts/{id}/tenants | `partner_portal_post_org_branding_partner_accounts_id_tenants` | [stub] Create/invoke /org-branding/partner/accounts/{id}/tenants (partner-portal) |
| `DELETE` | /org-branding/partner/accounts/{id}/tenants/{orgId} | `partner_portal_delete_org_branding_partner_accounts_id_tenants_orgId` | [stub] Delete /org-branding/partner/accounts/{id}/tenants/{orgId} (partner-portal) |
| `POST` | /org-branding/partner/accounts/{id}/tenants/assign | `partner_portal_post_org_branding_partner_accounts_id_tenants_assign` | [stub] Create/invoke /org-branding/partner/accounts/{id}/tenants/assign (partner-portal) |
| `GET` | /org-branding/partner/accounts/{id}/usage | `partner_portal_get_org_branding_partner_accounts_id_usage` | [stub] List/get /org-branding/partner/accounts/{id}/usage (partner-portal) |
| `GET` | /org-branding/partner/me | `partner_portal_get_org_branding_partner_me` | [stub] List/get /org-branding/partner/me (partner-portal) |
| `GET` | /org-branding/resolve-domain | `partner_portal_get_org_branding_resolve_domain` | [stub] List/get /org-branding/resolve-domain (partner-portal) |
| `GET` | /orgs/org-branding/{orgSlug} | `partner_portal_get_orgs_org_branding_orgSlug` | [stub] List/get /orgs/org-branding/{orgSlug} (partner-portal) |
| `GET` | /orgs/orgs/{orgId}/branding | `partner_portal_get_orgs_orgs_orgId_branding` | [stub] List/get /orgs/orgs/{orgId}/branding (partner-portal) |
| `PUT` | /orgs/orgs/{orgId}/branding | `partner_portal_put_orgs_orgs_orgId_branding` | [stub] Update /orgs/orgs/{orgId}/branding (partner-portal) |
| `DELETE` | /orgs/orgs/{orgId}/branding | `partner_portal_delete_orgs_orgs_orgId_branding` | [stub] Delete /orgs/orgs/{orgId}/branding (partner-portal) |
| `GET` | /orgs/orgs/{orgId}/custom-domains | `partner_portal_get_orgs_orgs_orgId_custom_domains` | [stub] List/get /orgs/orgs/{orgId}/custom-domains (partner-portal) |
| `POST` | /orgs/orgs/{orgId}/custom-domains | `partner_portal_post_orgs_orgs_orgId_custom_domains` | [stub] Create/invoke /orgs/orgs/{orgId}/custom-domains (partner-portal) |
| `PATCH` | /orgs/orgs/{orgId}/custom-domains/{domainId} | `partner_portal_patch_orgs_orgs_orgId_custom_domains_domainId` | [stub] Patch /orgs/orgs/{orgId}/custom-domains/{domainId} (partner-portal) |
| `DELETE` | /orgs/orgs/{orgId}/custom-domains/{domainId} | `partner_portal_delete_orgs_orgs_orgId_custom_domains_domainId` | [stub] Delete /orgs/orgs/{orgId}/custom-domains/{domainId} (partner-portal) |
| `POST` | /orgs/orgs/{orgId}/custom-domains/{domainId}/activate | `partner_portal_post_orgs_orgs_orgId_custom_domains_domainId_activate` | [stub] Create/invoke /orgs/orgs/{orgId}/custom-domains/{domainId}/activate (partner-portal) |
| `POST` | /orgs/orgs/{orgId}/custom-domains/{domainId}/verify | `partner_portal_post_orgs_orgs_orgId_custom_domains_domainId_verify` | [stub] Create/invoke /orgs/orgs/{orgId}/custom-domains/{domainId}/verify (partner-portal) |
| `GET` | /orgs/partner/accounts | `partner_portal_get_orgs_partner_accounts` | [stub] List/get /orgs/partner/accounts (partner-portal) |
| `POST` | /orgs/partner/accounts | `partner_portal_post_orgs_partner_accounts` | [stub] Create/invoke /orgs/partner/accounts (partner-portal) |
| `GET` | /orgs/partner/accounts/{id} | `partner_portal_get_orgs_partner_accounts_id` | [stub] List/get /orgs/partner/accounts/{id} (partner-portal) |
| `PATCH` | /orgs/partner/accounts/{id} | `partner_portal_patch_orgs_partner_accounts_id` | [stub] Patch /orgs/partner/accounts/{id} (partner-portal) |
| `POST` | /orgs/partner/accounts/{id}/tenants | `partner_portal_post_orgs_partner_accounts_id_tenants` | [stub] Create/invoke /orgs/partner/accounts/{id}/tenants (partner-portal) |
| `DELETE` | /orgs/partner/accounts/{id}/tenants/{orgId} | `partner_portal_delete_orgs_partner_accounts_id_tenants_orgId` | [stub] Delete /orgs/partner/accounts/{id}/tenants/{orgId} (partner-portal) |
| `POST` | /orgs/partner/accounts/{id}/tenants/assign | `partner_portal_post_orgs_partner_accounts_id_tenants_assign` | [stub] Create/invoke /orgs/partner/accounts/{id}/tenants/assign (partner-portal) |
| `GET` | /orgs/partner/accounts/{id}/usage | `partner_portal_get_orgs_partner_accounts_id_usage` | [stub] List/get /orgs/partner/accounts/{id}/usage (partner-portal) |
| `GET` | /orgs/partner/me | `partner_portal_get_orgs_partner_me` | [stub] List/get /orgs/partner/me (partner-portal) |
| `GET` | /orgs/resolve-domain | `partner_portal_get_orgs_resolve_domain` | [stub] List/get /orgs/resolve-domain (partner-portal) |
| `GET` | /partner/org-branding/{orgSlug} | `partner_portal_get_partner_org_branding_orgSlug` | [stub] List/get /partner/org-branding/{orgSlug} (partner-portal) |
| `GET` | /partner/orgs/{orgId}/branding | `partner_portal_get_partner_orgs_orgId_branding` | [stub] List/get /partner/orgs/{orgId}/branding (partner-portal) |
| `PUT` | /partner/orgs/{orgId}/branding | `partner_portal_put_partner_orgs_orgId_branding` | [stub] Update /partner/orgs/{orgId}/branding (partner-portal) |
| `DELETE` | /partner/orgs/{orgId}/branding | `partner_portal_delete_partner_orgs_orgId_branding` | [stub] Delete /partner/orgs/{orgId}/branding (partner-portal) |
| `GET` | /partner/orgs/{orgId}/custom-domains | `partner_portal_get_partner_orgs_orgId_custom_domains` | [stub] List/get /partner/orgs/{orgId}/custom-domains (partner-portal) |
| `POST` | /partner/orgs/{orgId}/custom-domains | `partner_portal_post_partner_orgs_orgId_custom_domains` | [stub] Create/invoke /partner/orgs/{orgId}/custom-domains (partner-portal) |
| `PATCH` | /partner/orgs/{orgId}/custom-domains/{domainId} | `partner_portal_patch_partner_orgs_orgId_custom_domains_domainId` | [stub] Patch /partner/orgs/{orgId}/custom-domains/{domainId} (partner-portal) |
| `DELETE` | /partner/orgs/{orgId}/custom-domains/{domainId} | `partner_portal_delete_partner_orgs_orgId_custom_domains_domainId` | [stub] Delete /partner/orgs/{orgId}/custom-domains/{domainId} (partner-portal) |
| `POST` | /partner/orgs/{orgId}/custom-domains/{domainId}/activate | `partner_portal_post_partner_orgs_orgId_custom_domains_domainId_activate` | [stub] Create/invoke /partner/orgs/{orgId}/custom-domains/{domainId}/activate (partner-portal) |
| `POST` | /partner/orgs/{orgId}/custom-domains/{domainId}/verify | `partner_portal_post_partner_orgs_orgId_custom_domains_domainId_verify` | [stub] Create/invoke /partner/orgs/{orgId}/custom-domains/{domainId}/verify (partner-portal) |
| `GET` | /partner/partner/accounts | `partner_portal_get_partner_partner_accounts` | [stub] List/get /partner/partner/accounts (partner-portal) |
| `POST` | /partner/partner/accounts | `partner_portal_post_partner_partner_accounts` | [stub] Create/invoke /partner/partner/accounts (partner-portal) |
| `GET` | /partner/partner/accounts/{id} | `partner_portal_get_partner_partner_accounts_id` | [stub] List/get /partner/partner/accounts/{id} (partner-portal) |
| `PATCH` | /partner/partner/accounts/{id} | `partner_portal_patch_partner_partner_accounts_id` | [stub] Patch /partner/partner/accounts/{id} (partner-portal) |
| `POST` | /partner/partner/accounts/{id}/tenants | `partner_portal_post_partner_partner_accounts_id_tenants` | [stub] Create/invoke /partner/partner/accounts/{id}/tenants (partner-portal) |
| `DELETE` | /partner/partner/accounts/{id}/tenants/{orgId} | `partner_portal_delete_partner_partner_accounts_id_tenants_orgId` | [stub] Delete /partner/partner/accounts/{id}/tenants/{orgId} (partner-portal) |
| `POST` | /partner/partner/accounts/{id}/tenants/assign | `partner_portal_post_partner_partner_accounts_id_tenants_assign` | [stub] Create/invoke /partner/partner/accounts/{id}/tenants/assign (partner-portal) |
| `GET` | /partner/partner/accounts/{id}/usage | `partner_portal_get_partner_partner_accounts_id_usage` | [stub] List/get /partner/partner/accounts/{id}/usage (partner-portal) |
| `GET` | /partner/partner/me | `partner_portal_get_partner_partner_me` | [stub] List/get /partner/partner/me (partner-portal) |
| `GET` | /partner/resolve-domain | `partner_portal_get_partner_resolve_domain` | [stub] List/get /partner/resolve-domain (partner-portal) |
| `GET` | /resolve-domain/org-branding/{orgSlug} | `partner_portal_get_resolve_domain_org_branding_orgSlug` | [stub] List/get /resolve-domain/org-branding/{orgSlug} (partner-portal) |
| `GET` | /resolve-domain/orgs/{orgId}/branding | `partner_portal_get_resolve_domain_orgs_orgId_branding` | [stub] List/get /resolve-domain/orgs/{orgId}/branding (partner-portal) |
| `PUT` | /resolve-domain/orgs/{orgId}/branding | `partner_portal_put_resolve_domain_orgs_orgId_branding` | [stub] Update /resolve-domain/orgs/{orgId}/branding (partner-portal) |
| `DELETE` | /resolve-domain/orgs/{orgId}/branding | `partner_portal_delete_resolve_domain_orgs_orgId_branding` | [stub] Delete /resolve-domain/orgs/{orgId}/branding (partner-portal) |
| `GET` | /resolve-domain/orgs/{orgId}/custom-domains | `partner_portal_get_resolve_domain_orgs_orgId_custom_domains` | [stub] List/get /resolve-domain/orgs/{orgId}/custom-domains (partner-portal) |
| `POST` | /resolve-domain/orgs/{orgId}/custom-domains | `partner_portal_post_resolve_domain_orgs_orgId_custom_domains` | [stub] Create/invoke /resolve-domain/orgs/{orgId}/custom-domains (partner-portal) |
| `PATCH` | /resolve-domain/orgs/{orgId}/custom-domains/{domainId} | `partner_portal_patch_resolve_domain_orgs_orgId_custom_domains_domainId` | [stub] Patch /resolve-domain/orgs/{orgId}/custom-domains/{domainId} (partner-portal) |
| `DELETE` | /resolve-domain/orgs/{orgId}/custom-domains/{domainId} | `partner_portal_delete_resolve_domain_orgs_orgId_custom_domains_domainId` | [stub] Delete /resolve-domain/orgs/{orgId}/custom-domains/{domainId} (partner-portal) |
| `POST` | /resolve-domain/orgs/{orgId}/custom-domains/{domainId}/activate | `partner_portal_post_resolve_domain_orgs_orgId_custom_domains_domainId_activate` | [stub] Create/invoke /resolve-domain/orgs/{orgId}/custom-domains/{domainId}/activate (partner-portal) |
| `POST` | /resolve-domain/orgs/{orgId}/custom-domains/{domainId}/verify | `partner_portal_post_resolve_domain_orgs_orgId_custom_domains_domainId_verify` | [stub] Create/invoke /resolve-domain/orgs/{orgId}/custom-domains/{domainId}/verify (partner-portal) |
| `GET` | /resolve-domain/partner/accounts | `partner_portal_get_resolve_domain_partner_accounts` | [stub] List/get /resolve-domain/partner/accounts (partner-portal) |
| `POST` | /resolve-domain/partner/accounts | `partner_portal_post_resolve_domain_partner_accounts` | [stub] Create/invoke /resolve-domain/partner/accounts (partner-portal) |
| `GET` | /resolve-domain/partner/accounts/{id} | `partner_portal_get_resolve_domain_partner_accounts_id` | [stub] List/get /resolve-domain/partner/accounts/{id} (partner-portal) |
| `PATCH` | /resolve-domain/partner/accounts/{id} | `partner_portal_patch_resolve_domain_partner_accounts_id` | [stub] Patch /resolve-domain/partner/accounts/{id} (partner-portal) |
| `POST` | /resolve-domain/partner/accounts/{id}/tenants | `partner_portal_post_resolve_domain_partner_accounts_id_tenants` | [stub] Create/invoke /resolve-domain/partner/accounts/{id}/tenants (partner-portal) |
| `DELETE` | /resolve-domain/partner/accounts/{id}/tenants/{orgId} | `partner_portal_delete_resolve_domain_partner_accounts_id_tenants_orgId` | [stub] Delete /resolve-domain/partner/accounts/{id}/tenants/{orgId} (partner-portal) |
| `POST` | /resolve-domain/partner/accounts/{id}/tenants/assign | `partner_portal_post_resolve_domain_partner_accounts_id_tenants_assign` | [stub] Create/invoke /resolve-domain/partner/accounts/{id}/tenants/assign (partner-portal) |
| `GET` | /resolve-domain/partner/accounts/{id}/usage | `partner_portal_get_resolve_domain_partner_accounts_id_usage` | [stub] List/get /resolve-domain/partner/accounts/{id}/usage (partner-portal) |
| `GET` | /resolve-domain/partner/me | `partner_portal_get_resolve_domain_partner_me` | [stub] List/get /resolve-domain/partner/me (partner-portal) |
| `GET` | /resolve-domain/resolve-domain | `partner_portal_get_resolve_domain_resolve_domain` | [stub] List/get /resolve-domain/resolve-domain (partner-portal) |

<a id="pdf"></a>

## pdf

Auto-generated tag for pdf route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /pdf/documents/{id} | `pdf_get_pdf_documents_id` | [stub] List/get /pdf/documents/{id} (pdf) |
| `POST` | /pdf/documents/{id}/docusign/embed/{sigId} | `pdf_post_pdf_documents_id_docusign_embed_sigId` | [stub] Create/invoke /pdf/documents/{id}/docusign/embed/{sigId} (pdf) |
| `POST` | /pdf/documents/{id}/docusign/send | `pdf_post_pdf_documents_id_docusign_send` | [stub] Create/invoke /pdf/documents/{id}/docusign/send (pdf) |
| `GET` | /pdf/documents/{id}/pdf | `pdf_get_pdf_documents_id_pdf` | [stub] List/get /pdf/documents/{id}/pdf (pdf) |
| `GET` | /pdf/documents/{id}/versions/{versionA}/diff/{versionB} | `pdf_get_pdf_documents_id_versions_versionA_diff_versionB` | [stub] List/get /pdf/documents/{id}/versions/{versionA}/diff/{versionB} (pdf) |
| `GET` | /pdf/documents/batch-pdf | `pdf_get_pdf_documents_batch_pdf` | [stub] List/get /pdf/documents/batch-pdf (pdf) |
| `POST` | /pdf/documents/batch-pdf | `pdf_post_pdf_documents_batch_pdf` | [stub] Create/invoke /pdf/documents/batch-pdf (pdf) |
| `GET` | /pdf/documents/batch-pdf/{batchId} | `pdf_get_pdf_documents_batch_pdf_batchId` | [stub] List/get /pdf/documents/batch-pdf/{batchId} (pdf) |
| `POST` | /pdf/documents/batch-pdf/{batchId}/cancel | `pdf_post_pdf_documents_batch_pdf_batchId_cancel` | [stub] Create/invoke /pdf/documents/batch-pdf/{batchId}/cancel (pdf) |
| `GET` | /pdf/documents/batch-pdf/{batchId}/zip | `pdf_get_pdf_documents_batch_pdf_batchId_zip` | [stub] List/get /pdf/documents/batch-pdf/{batchId}/zip (pdf) |
| `POST` | /pdf/documents/docusign/webhook | `pdf_post_pdf_documents_docusign_webhook` | [stub] Create/invoke /pdf/documents/docusign/webhook (pdf) |
| `POST` | /pdf/documents/pdf-jobs/{jobId}/retry | `pdf_post_pdf_documents_pdf_jobs_jobId_retry` | [stub] Create/invoke /pdf/documents/pdf-jobs/{jobId}/retry (pdf) |
| `GET` | /pdf/documents/pdf-output/{filename} | `pdf_get_pdf_documents_pdf_output_filename` | [stub] List/get /pdf/documents/pdf-output/{filename} (pdf) |
| `GET` | /pdf/documents/signing-dashboard | `pdf_get_pdf_documents_signing_dashboard` | [stub] List/get /pdf/documents/signing-dashboard (pdf) |

<a id="pipeline-deals"></a>

## pipeline-deals

Auto-generated tag for pipeline-deals route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /pipeline-deals/admin/pipeline-deals | `pipeline_deals_get_pipeline_deals_admin_pipeline_deals` | [stub] List/get /pipeline-deals/admin/pipeline-deals (pipeline-deals) |
| `POST` | /pipeline-deals/admin/pipeline-deals | `pipeline_deals_post_pipeline_deals_admin_pipeline_deals` | [stub] Create/invoke /pipeline-deals/admin/pipeline-deals (pipeline-deals) |
| `PATCH` | /pipeline-deals/admin/pipeline-deals/{id} | `pipeline_deals_patch_pipeline_deals_admin_pipeline_deals_id` | [stub] Patch /pipeline-deals/admin/pipeline-deals/{id} (pipeline-deals) |
| `DELETE` | /pipeline-deals/admin/pipeline-deals/{id} | `pipeline_deals_delete_pipeline_deals_admin_pipeline_deals_id` | [stub] Delete /pipeline-deals/admin/pipeline-deals/{id} (pipeline-deals) |
| `GET` | /pipeline-deals/admin/pipeline-deals/{id}/events | `pipeline_deals_get_pipeline_deals_admin_pipeline_deals_id_events` | [stub] List/get /pipeline-deals/admin/pipeline-deals/{id}/events (pipeline-deals) |

<a id="plans"></a>

## plans

Auto-generated tag for plans route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /plans/plans | `plans_get_plans_plans` | [stub] List/get /plans/plans (plans) |
| `POST` | /plans/plans | `plans_post_plans_plans` | [stub] Create/invoke /plans/plans (plans) |
| `GET` | /plans/plans/{id} | `plans_get_plans_plans_id` | [stub] List/get /plans/plans/{id} (plans) |
| `POST` | /plans/plans/{id}/execute | `plans_post_plans_plans_id_execute` | [stub] Create/invoke /plans/plans/{id}/execute (plans) |
| `GET` | /plans/plans/{id}/fallbacks | `plans_get_plans_plans_id_fallbacks` | [stub] List/get /plans/plans/{id}/fallbacks (plans) |
| `POST` | /plans/plans/{id}/replay | `plans_post_plans_plans_id_replay` | [stub] Create/invoke /plans/plans/{id}/replay (plans) |
| `POST` | /plans/plans/{id}/steps/{stepId}/approve | `plans_post_plans_plans_id_steps_stepId_approve` | [stub] Create/invoke /plans/plans/{id}/steps/{stepId}/approve (plans) |
| `POST` | /plans/plans/{id}/steps/{stepId}/deny | `plans_post_plans_plans_id_steps_stepId_deny` | [stub] Create/invoke /plans/plans/{id}/steps/{stepId}/deny (plans) |
| `POST` | /plans/plans/{id}/steps/{stepId}/reject | `plans_post_plans_plans_id_steps_stepId_reject` | [stub] Create/invoke /plans/plans/{id}/steps/{stepId}/reject (plans) |

<a id="platform-analytics"></a>

## platform-analytics

Auto-generated tag for platform-analytics route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /platform-analytics/ab-tests | `platform_analytics_get_platform_analytics_ab_tests` | [stub] List/get /platform-analytics/ab-tests (platform-analytics) |
| `POST` | /platform-analytics/ab-tests | `platform_analytics_post_platform_analytics_ab_tests` | [stub] Create/invoke /platform-analytics/ab-tests (platform-analytics) |
| `GET` | /platform-analytics/analytics/cross-platform | `platform_analytics_get_platform_analytics_analytics_cross_platform` | [stub] List/get /platform-analytics/analytics/cross-platform (platform-analytics) |
| `GET` | /platform-analytics/analytics/dashboard | `platform_analytics_get_platform_analytics_analytics_dashboard` | [stub] List/get /platform-analytics/analytics/dashboard (platform-analytics) |
| `GET` | /platform-analytics/api-keys | `platform_analytics_get_platform_analytics_api_keys` | [stub] List/get /platform-analytics/api-keys (platform-analytics) |
| `POST` | /platform-analytics/api-keys | `platform_analytics_post_platform_analytics_api_keys` | [stub] Create/invoke /platform-analytics/api-keys (platform-analytics) |
| `DELETE` | /platform-analytics/api-keys/{id} | `platform_analytics_delete_platform_analytics_api_keys_id` | [stub] Delete /platform-analytics/api-keys/{id} (platform-analytics) |
| `GET` | /platform-analytics/articles/published/list | `platform_analytics_get_platform_analytics_articles_published_list` | [stub] List/get /platform-analytics/articles/published/list (platform-analytics) |
| `POST` | /platform-analytics/atomizer/atomize | `platform_analytics_post_platform_analytics_atomizer_atomize` | [stub] Create/invoke /platform-analytics/atomizer/atomize (platform-analytics) |
| `GET` | /platform-analytics/atomizer/jobs/{jobId} | `platform_analytics_get_platform_analytics_atomizer_jobs_jobId` | [stub] List/get /platform-analytics/atomizer/jobs/{jobId} (platform-analytics) |
| `GET` | /platform-analytics/attribution/funnel | `platform_analytics_get_platform_analytics_attribution_funnel` | [stub] List/get /platform-analytics/attribution/funnel (platform-analytics) |
| `GET` | /platform-analytics/audience/genome | `platform_analytics_get_platform_analytics_audience_genome` | [stub] List/get /platform-analytics/audience/genome (platform-analytics) |
| `GET` | /platform-analytics/audience/migration | `platform_analytics_get_platform_analytics_audience_migration` | [stub] List/get /platform-analytics/audience/migration (platform-analytics) |
| `GET` | /platform-analytics/audience/segments | `platform_analytics_get_platform_analytics_audience_segments` | [stub] List/get /platform-analytics/audience/segments (platform-analytics) |
| `GET` | /platform-analytics/feeds/all.rss | `platform_analytics_get_platform_analytics_feeds_all_rss` | [stub] List/get /platform-analytics/feeds/all.rss (platform-analytics) |
| `GET` | /platform-analytics/feeds/articles.rss | `platform_analytics_get_platform_analytics_feeds_articles_rss` | [stub] List/get /platform-analytics/feeds/articles.rss (platform-analytics) |
| `GET` | /platform-analytics/feeds/newsletters.rss | `platform_analytics_get_platform_analytics_feeds_newsletters_rss` | [stub] List/get /platform-analytics/feeds/newsletters.rss (platform-analytics) |
| `GET` | /platform-analytics/growth/referral-stats | `platform_analytics_get_platform_analytics_growth_referral_stats` | [stub] List/get /platform-analytics/growth/referral-stats (platform-analytics) |
| `GET` | /platform-analytics/lifecycle/overview | `platform_analytics_get_platform_analytics_lifecycle_overview` | [stub] List/get /platform-analytics/lifecycle/overview (platform-analytics) |
| `GET` | /platform-analytics/monetization/attribution | `platform_analytics_get_platform_analytics_monetization_attribution` | [stub] List/get /platform-analytics/monetization/attribution (platform-analytics) |
| `GET` | /platform-analytics/monetization/overview | `platform_analytics_get_platform_analytics_monetization_overview` | [stub] List/get /platform-analytics/monetization/overview (platform-analytics) |
| `GET` | /platform-analytics/oembed | `platform_analytics_get_platform_analytics_oembed` | [stub] List/get /platform-analytics/oembed (platform-analytics) |
| `GET` | /platform-analytics/platform-connections | `platform_analytics_get_platform_analytics_platform_connections` | [stub] List/get /platform-analytics/platform-connections (platform-analytics) |
| `GET` | /platform-analytics/seo/keywords | `platform_analytics_get_platform_analytics_seo_keywords` | [stub] List/get /platform-analytics/seo/keywords (platform-analytics) |
| `GET` | /platform-analytics/seo/overview | `platform_analytics_get_platform_analytics_seo_overview` | [stub] List/get /platform-analytics/seo/overview (platform-analytics) |
| `GET` | /platform-analytics/subscribers | `platform_analytics_get_platform_analytics_subscribers` | [stub] List/get /platform-analytics/subscribers (platform-analytics) |
| `POST` | /platform-analytics/subscribers/magic-link | `platform_analytics_post_platform_analytics_subscribers_magic_link` | [stub] Create/invoke /platform-analytics/subscribers/magic-link (platform-analytics) |
| `GET` | /platform-analytics/trends/radar | `platform_analytics_get_platform_analytics_trends_radar` | [stub] List/get /platform-analytics/trends/radar (platform-analytics) |
| `POST` | /platform-analytics/virality/score-content | `platform_analytics_post_platform_analytics_virality_score_content` | [stub] Create/invoke /platform-analytics/virality/score-content (platform-analytics) |
| `GET` | /platform-analytics/virality/scores | `platform_analytics_get_platform_analytics_virality_scores` | [stub] List/get /platform-analytics/virality/scores (platform-analytics) |
| `GET` | /platform-analytics/webhook-subscriptions | `platform_analytics_get_platform_analytics_webhook_subscriptions` | [stub] List/get /platform-analytics/webhook-subscriptions (platform-analytics) |
| `POST` | /platform-analytics/webhook-subscriptions | `platform_analytics_post_platform_analytics_webhook_subscriptions` | [stub] Create/invoke /platform-analytics/webhook-subscriptions (platform-analytics) |
| `DELETE` | /platform-analytics/webhook-subscriptions/{id} | `platform_analytics_delete_platform_analytics_webhook_subscriptions_id` | [stub] Delete /platform-analytics/webhook-subscriptions/{id} (platform-analytics) |
| `POST` | /platform-analytics/webhook-subscriptions/{id}/test | `platform_analytics_post_platform_analytics_webhook_subscriptions_id_test` | [stub] Create/invoke /platform-analytics/webhook-subscriptions/{id}/test (platform-analytics) |

<a id="playbooks"></a>

## playbooks

Auto-generated tag for playbooks route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /playbooks/rmm/playbooks | `playbooks_get_playbooks_rmm_playbooks` | [stub] List/get /playbooks/rmm/playbooks (playbooks) |
| `POST` | /playbooks/rmm/playbooks | `playbooks_post_playbooks_rmm_playbooks` | [stub] Create/invoke /playbooks/rmm/playbooks (playbooks) |
| `PATCH` | /playbooks/rmm/playbooks/{id} | `playbooks_patch_playbooks_rmm_playbooks_id` | [stub] Patch /playbooks/rmm/playbooks/{id} (playbooks) |
| `DELETE` | /playbooks/rmm/playbooks/{id} | `playbooks_delete_playbooks_rmm_playbooks_id` | [stub] Delete /playbooks/rmm/playbooks/{id} (playbooks) |
| `POST` | /playbooks/rmm/playbooks/{id}/execute | `playbooks_post_playbooks_rmm_playbooks_id_execute` | [stub] Create/invoke /playbooks/rmm/playbooks/{id}/execute (playbooks) |
| `GET` | /playbooks/rmm/playbooks/executions | `playbooks_get_playbooks_rmm_playbooks_executions` | [stub] List/get /playbooks/rmm/playbooks/executions (playbooks) |
| `POST` | /playbooks/rmm/playbooks/executions/{id}/approve | `playbooks_post_playbooks_rmm_playbooks_executions_id_approve` | [stub] Create/invoke /playbooks/rmm/playbooks/executions/{id}/approve (playbooks) |
| `POST` | /playbooks/rmm/playbooks/executions/{id}/reject | `playbooks_post_playbooks_rmm_playbooks_executions_id_reject` | [stub] Create/invoke /playbooks/rmm/playbooks/executions/{id}/reject (playbooks) |

<a id="policy-modes"></a>

## policy-modes

Auto-generated tag for policy-modes route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /policy-modes/policy-modes | `policy_modes_get_policy_modes_policy_modes` | [stub] List/get /policy-modes/policy-modes (policy-modes) |
| `POST` | /policy-modes/policy-modes | `policy_modes_post_policy_modes_policy_modes` | [stub] Create/invoke /policy-modes/policy-modes (policy-modes) |
| `GET` | /policy-modes/policy-modes/{id} | `policy_modes_get_policy_modes_policy_modes_id` | [stub] List/get /policy-modes/policy-modes/{id} (policy-modes) |
| `PATCH` | /policy-modes/policy-modes/{id} | `policy_modes_patch_policy_modes_policy_modes_id` | [stub] Patch /policy-modes/policy-modes/{id} (policy-modes) |
| `DELETE` | /policy-modes/policy-modes/{id} | `policy_modes_delete_policy_modes_policy_modes_id` | [stub] Delete /policy-modes/policy-modes/{id} (policy-modes) |
| `POST` | /policy-modes/policy-modes/evaluate | `policy_modes_post_policy_modes_policy_modes_evaluate` | [stub] Create/invoke /policy-modes/policy-modes/evaluate (policy-modes) |
| `GET` | /policy-modes/policy-modes/meta | `policy_modes_get_policy_modes_policy_modes_meta` | [stub] List/get /policy-modes/policy-modes/meta (policy-modes) |
| `GET` | /policy-modes/policy-modes/resolve | `policy_modes_get_policy_modes_policy_modes_resolve` | [stub] List/get /policy-modes/policy-modes/resolve (policy-modes) |

<a id="powerbi"></a>

## powerbi

Auto-generated tag for powerbi route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /powerbi/admin/powerbi-config | `powerbi_get_powerbi_admin_powerbi_config` | [stub] List/get /powerbi/admin/powerbi-config (powerbi) |
| `PUT` | /powerbi/admin/powerbi-config | `powerbi_put_powerbi_admin_powerbi_config` | [stub] Update /powerbi/admin/powerbi-config (powerbi) |
| `POST` | /powerbi/admin/powerbi-config/embed-token | `powerbi_post_powerbi_admin_powerbi_config_embed_token` | [stub] Create/invoke /powerbi/admin/powerbi-config/embed-token (powerbi) |
| `POST` | /powerbi/admin/powerbi-config/test | `powerbi_post_powerbi_admin_powerbi_config_test` | [stub] Create/invoke /powerbi/admin/powerbi-config/test (powerbi) |
| `GET` | /powerbi/admin/tenants/{id}/powerbi-config | `powerbi_get_powerbi_admin_tenants_id_powerbi_config` | [stub] List/get /powerbi/admin/tenants/{id}/powerbi-config (powerbi) |
| `PUT` | /powerbi/admin/tenants/{id}/powerbi-config | `powerbi_put_powerbi_admin_tenants_id_powerbi_config` | [stub] Update /powerbi/admin/tenants/{id}/powerbi-config (powerbi) |

<a id="preferences"></a>

## preferences

Auto-generated tag for preferences route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /preferences/preferences | `preferences_get_preferences_preferences` | [stub] List/get /preferences/preferences (preferences) |
| `PATCH` | /preferences/preferences | `preferences_patch_preferences_preferences` | [stub] Patch /preferences/preferences (preferences) |

<a id="prism-bus-api"></a>

## prism-bus-api

Auto-generated tag for prism-bus-api route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /prism-bus/prism-bus/connectors | `prism_bus_api_get_prism_bus_prism_bus_connectors` | [stub] List/get /prism-bus/prism-bus/connectors (prism-bus-api) |
| `GET` | /prism-bus/prism-bus/domain-tools | `prism_bus_api_get_prism_bus_prism_bus_domain_tools` | [stub] List/get /prism-bus/prism-bus/domain-tools (prism-bus-api) |
| `GET` | /prism-bus/prism-bus/events | `prism_bus_api_get_prism_bus_prism_bus_events` | [stub] List/get /prism-bus/prism-bus/events (prism-bus-api) |
| `POST` | /prism-bus/prism-bus/publish | `prism_bus_api_post_prism_bus_prism_bus_publish` | [stub] Create/invoke /prism-bus/prism-bus/publish (prism-bus-api) |
| `GET` | /prism-bus/prism-bus/status | `prism_bus_api_get_prism_bus_prism_bus_status` | [stub] List/get /prism-bus/prism-bus/status (prism-bus-api) |
| `GET` | /prism-bus/prism-bus/tools | `prism_bus_api_get_prism_bus_prism_bus_tools` | [stub] List/get /prism-bus/prism-bus/tools (prism-bus-api) |

<a id="prism-counsel-core"></a>

## prism-counsel-core

Auto-generated tag for prism-counsel-core route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /prism-counsel/prism-counsel/admin/dashboards/{type} | `prism_counsel_core_get_prism_counsel_prism_counsel_admin_dashboards_type` | [stub] List/get /prism-counsel/prism-counsel/admin/dashboards/{type} (prism-counsel-core) |
| `GET` | /prism-counsel/prism-counsel/admin/incidents | `prism_counsel_core_get_prism_counsel_prism_counsel_admin_incidents` | [stub] List/get /prism-counsel/prism-counsel/admin/incidents (prism-counsel-core) |
| `GET` | /prism-counsel/prism-counsel/admin/onboarding | `prism_counsel_core_get_prism_counsel_prism_counsel_admin_onboarding` | [stub] List/get /prism-counsel/prism-counsel/admin/onboarding (prism-counsel-core) |
| `GET` | /prism-counsel/prism-counsel/admin/service-metrics | `prism_counsel_core_get_prism_counsel_prism_counsel_admin_service_metrics` | [stub] List/get /prism-counsel/prism-counsel/admin/service-metrics (prism-counsel-core) |
| `GET` | /prism-counsel/prism-counsel/admin/tenant-config | `prism_counsel_core_get_prism_counsel_prism_counsel_admin_tenant_config` | [stub] List/get /prism-counsel/prism-counsel/admin/tenant-config (prism-counsel-core) |
| `GET` | /prism-counsel/prism-counsel/approvals | `prism_counsel_core_get_prism_counsel_prism_counsel_approvals` | [stub] List/get /prism-counsel/prism-counsel/approvals (prism-counsel-core) |
| `POST` | /prism-counsel/prism-counsel/approvals/{id}/approve | `prism_counsel_core_post_prism_counsel_prism_counsel_approvals_id_approve` | [stub] Create/invoke /prism-counsel/prism-counsel/approvals/{id}/approve (prism-counsel-core) |
| `POST` | /prism-counsel/prism-counsel/approvals/{id}/reject | `prism_counsel_core_post_prism_counsel_prism_counsel_approvals_id_reject` | [stub] Create/invoke /prism-counsel/prism-counsel/approvals/{id}/reject (prism-counsel-core) |
| `GET` | /prism-counsel/prism-counsel/dashboard | `prism_counsel_core_get_prism_counsel_prism_counsel_dashboard` | [stub] List/get /prism-counsel/prism-counsel/dashboard (prism-counsel-core) |
| `GET` | /prism-counsel/prism-counsel/data-products | `prism_counsel_core_get_prism_counsel_prism_counsel_data_products` | [stub] List/get /prism-counsel/prism-counsel/data-products (prism-counsel-core) |
| `GET` | /prism-counsel/prism-counsel/health | `prism_counsel_core_get_prism_counsel_prism_counsel_health` | [stub] List/get /prism-counsel/prism-counsel/health (prism-counsel-core) |
| `GET` | /prism-counsel/prism-counsel/matters | `prism_counsel_core_get_prism_counsel_prism_counsel_matters` | [stub] List/get /prism-counsel/prism-counsel/matters (prism-counsel-core) |
| `POST` | /prism-counsel/prism-counsel/matters | `prism_counsel_core_post_prism_counsel_prism_counsel_matters` | [stub] Create/invoke /prism-counsel/prism-counsel/matters (prism-counsel-core) |
| `GET` | /prism-counsel/prism-counsel/matters/{id} | `prism_counsel_core_get_prism_counsel_prism_counsel_matters_id` | [stub] List/get /prism-counsel/prism-counsel/matters/{id} (prism-counsel-core) |
| `PATCH` | /prism-counsel/prism-counsel/matters/{id} | `prism_counsel_core_patch_prism_counsel_prism_counsel_matters_id` | [stub] Patch /prism-counsel/prism-counsel/matters/{id} (prism-counsel-core) |
| `GET` | /prism-counsel/prism-counsel/matters/{id}/audit-packets | `prism_counsel_core_get_prism_counsel_prism_counsel_matters_id_audit_packets` | [stub] List/get /prism-counsel/prism-counsel/matters/{id}/audit-packets (prism-counsel-core) |
| `GET` | /prism-counsel/prism-counsel/matters/{id}/contradictions | `prism_counsel_core_get_prism_counsel_prism_counsel_matters_id_contradictions` | [stub] List/get /prism-counsel/prism-counsel/matters/{id}/contradictions (prism-counsel-core) |
| `GET` | /prism-counsel/prism-counsel/matters/{id}/copilot-drafts | `prism_counsel_core_get_prism_counsel_prism_counsel_matters_id_copilot_drafts` | [stub] List/get /prism-counsel/prism-counsel/matters/{id}/copilot-drafts (prism-counsel-core) |
| `GET` | /prism-counsel/prism-counsel/matters/{id}/forecast-diffs | `prism_counsel_core_get_prism_counsel_prism_counsel_matters_id_forecast_diffs` | [stub] List/get /prism-counsel/prism-counsel/matters/{id}/forecast-diffs (prism-counsel-core) |
| `GET` | /prism-counsel/prism-counsel/matters/{id}/pressure | `prism_counsel_core_get_prism_counsel_prism_counsel_matters_id_pressure` | [stub] List/get /prism-counsel/prism-counsel/matters/{id}/pressure (prism-counsel-core) |
| `GET` | /prism-counsel/prism-counsel/matters/{id}/proof-chain | `prism_counsel_core_get_prism_counsel_prism_counsel_matters_id_proof_chain` | [stub] List/get /prism-counsel/prism-counsel/matters/{id}/proof-chain (prism-counsel-core) |
| `GET` | /prism-counsel/prism-counsel/matters/{id}/twin | `prism_counsel_core_get_prism_counsel_prism_counsel_matters_id_twin` | [stub] List/get /prism-counsel/prism-counsel/matters/{id}/twin (prism-counsel-core) |
| `GET` | /prism-counsel/prism-counsel/operational-flows | `prism_counsel_core_get_prism_counsel_prism_counsel_operational_flows` | [stub] List/get /prism-counsel/prism-counsel/operational-flows (prism-counsel-core) |
| `GET` | /prism-counsel/prism-counsel/signal-forge/runs | `prism_counsel_core_get_prism_counsel_prism_counsel_signal_forge_runs` | [stub] List/get /prism-counsel/prism-counsel/signal-forge/runs (prism-counsel-core) |
| `GET` | /prism-counsel/prism-counsel/worldline/signals | `prism_counsel_core_get_prism_counsel_prism_counsel_worldline_signals` | [stub] List/get /prism-counsel/prism-counsel/worldline/signals (prism-counsel-core) |

<a id="prism-counsel-court"></a>

## prism-counsel-court

Auto-generated tag for prism-counsel-court route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /prism-counsel/copilot/drafts | `prism_counsel_court_get_prism_counsel_copilot_drafts` | [stub] List/get /prism-counsel/copilot/drafts (prism-counsel-court) |
| `POST` | /prism-counsel/copilot/drafts/{draftId}/advance | `prism_counsel_court_post_prism_counsel_copilot_drafts_draftId_advance` | [stub] Create/invoke /prism-counsel/copilot/drafts/{draftId}/advance (prism-counsel-court) |
| `POST` | /prism-counsel/copilot/generate-draft | `prism_counsel_court_post_prism_counsel_copilot_generate_draft` | [stub] Create/invoke /prism-counsel/copilot/generate-draft (prism-counsel-court) |
| `GET` | /prism-counsel/court/dockets/{id} | `prism_counsel_court_get_prism_counsel_court_dockets_id` | [stub] List/get /prism-counsel/court/dockets/{id} (prism-counsel-court) |
| `GET` | /prism-counsel/court/dockets/search | `prism_counsel_court_get_prism_counsel_court_dockets_search` | [stub] List/get /prism-counsel/court/dockets/search (prism-counsel-court) |
| `GET` | /prism-counsel/court/filings/recent | `prism_counsel_court_get_prism_counsel_court_filings_recent` | [stub] List/get /prism-counsel/court/filings/recent (prism-counsel-court) |
| `GET` | /prism-counsel/court/judges/search | `prism_counsel_court_get_prism_counsel_court_judges_search` | [stub] List/get /prism-counsel/court/judges/search (prism-counsel-court) |
| `POST` | /prism-counsel/court/matters/{matterId}/link-docket | `prism_counsel_court_post_prism_counsel_court_matters_matterId_link_docket` | [stub] Create/invoke /prism-counsel/court/matters/{matterId}/link-docket (prism-counsel-court) |
| `GET` | /prism-counsel/court/matters/{matterId}/linked-dockets | `prism_counsel_court_get_prism_counsel_court_matters_matterId_linked_dockets` | [stub] List/get /prism-counsel/court/matters/{matterId}/linked-dockets (prism-counsel-court) |
| `GET` | /prism-counsel/court/opinions/search | `prism_counsel_court_get_prism_counsel_court_opinions_search` | [stub] List/get /prism-counsel/court/opinions/search (prism-counsel-court) |
| `POST` | /prism-counsel/privilege/classify | `prism_counsel_court_post_prism_counsel_privilege_classify` | [stub] Create/invoke /prism-counsel/privilege/classify (prism-counsel-court) |
| `POST` | /prism-counsel/privilege/clawback/{tagId} | `prism_counsel_court_post_prism_counsel_privilege_clawback_tagId` | [stub] Create/invoke /prism-counsel/privilege/clawback/{tagId} (prism-counsel-court) |
| `POST` | /prism-counsel/privilege/export-check | `prism_counsel_court_post_prism_counsel_privilege_export_check` | [stub] Create/invoke /prism-counsel/privilege/export-check (prism-counsel-court) |
| `GET` | /prism-counsel/privilege/log | `prism_counsel_court_get_prism_counsel_privilege_log` | [stub] List/get /prism-counsel/privilege/log (prism-counsel-court) |
| `GET` | /prism-counsel/privilege/log/{matterId}/production | `prism_counsel_court_get_prism_counsel_privilege_log_matterId_production` | [stub] List/get /prism-counsel/privilege/log/{matterId}/production (prism-counsel-court) |
| `GET` | /prism-counsel/privilege/review-queue | `prism_counsel_court_get_prism_counsel_privilege_review_queue` | [stub] List/get /prism-counsel/privilege/review-queue (prism-counsel-court) |
| `POST` | /prism-counsel/privilege/review/{tagId}/resolve | `prism_counsel_court_post_prism_counsel_privilege_review_tagId_resolve` | [stub] Create/invoke /prism-counsel/privilege/review/{tagId}/resolve (prism-counsel-court) |
| `GET` | /prism-counsel/privilege/stats | `prism_counsel_court_get_prism_counsel_privilege_stats` | [stub] List/get /prism-counsel/privilege/stats (prism-counsel-court) |
| `POST` | /prism-counsel/privilege/tag | `prism_counsel_court_post_prism_counsel_privilege_tag` | [stub] Create/invoke /prism-counsel/privilege/tag (prism-counsel-court) |

<a id="prism-counsel-ny"></a>

## prism-counsel-ny

Auto-generated tag for prism-counsel-ny route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `PATCH` | /prism-counsel/prism-counsel/ny/ai-reviews/{id}/approve | `prism_counsel_ny_patch_prism_counsel_prism_counsel_ny_ai_reviews_id_approve` | [stub] Patch /prism-counsel/prism-counsel/ny/ai-reviews/{id}/approve (prism-counsel-ny) |
| `GET` | /prism-counsel/prism-counsel/ny/clock-rules | `prism_counsel_ny_get_prism_counsel_prism_counsel_ny_clock_rules` | [stub] List/get /prism-counsel/prism-counsel/ny/clock-rules (prism-counsel-ny) |
| `GET` | /prism-counsel/prism-counsel/ny/clock-rules/{id} | `prism_counsel_ny_get_prism_counsel_prism_counsel_ny_clock_rules_id` | [stub] List/get /prism-counsel/prism-counsel/ny/clock-rules/{id} (prism-counsel-ny) |
| `GET` | /prism-counsel/prism-counsel/ny/clocks/{clockId}/events | `prism_counsel_ny_get_prism_counsel_prism_counsel_ny_clocks_clockId_events` | [stub] List/get /prism-counsel/prism-counsel/ny/clocks/{clockId}/events (prism-counsel-ny) |
| `GET` | /prism-counsel/prism-counsel/ny/dashboard | `prism_counsel_ny_get_prism_counsel_prism_counsel_ny_dashboard` | [stub] List/get /prism-counsel/prism-counsel/ny/dashboard (prism-counsel-ny) |
| `GET` | /prism-counsel/prism-counsel/ny/health | `prism_counsel_ny_get_prism_counsel_prism_counsel_ny_health` | [stub] List/get /prism-counsel/prism-counsel/ny/health (prism-counsel-ny) |
| `GET` | /prism-counsel/prism-counsel/ny/insurer-profiles | `prism_counsel_ny_get_prism_counsel_prism_counsel_ny_insurer_profiles` | [stub] List/get /prism-counsel/prism-counsel/ny/insurer-profiles (prism-counsel-ny) |
| `GET` | /prism-counsel/prism-counsel/ny/insurer-profiles/{id} | `prism_counsel_ny_get_prism_counsel_prism_counsel_ny_insurer_profiles_id` | [stub] List/get /prism-counsel/prism-counsel/ny/insurer-profiles/{id} (prism-counsel-ny) |
| `GET` | /prism-counsel/prism-counsel/ny/matters | `prism_counsel_ny_get_prism_counsel_prism_counsel_ny_matters` | [stub] List/get /prism-counsel/prism-counsel/ny/matters (prism-counsel-ny) |
| `GET` | /prism-counsel/prism-counsel/ny/matters/{matterId} | `prism_counsel_ny_get_prism_counsel_prism_counsel_ny_matters_matterId` | [stub] List/get /prism-counsel/prism-counsel/ny/matters/{matterId} (prism-counsel-ny) |
| `GET` | /prism-counsel/prism-counsel/ny/matters/{matterId}/ai-reviews | `prism_counsel_ny_get_prism_counsel_prism_counsel_ny_matters_matterId_ai_reviews` | [stub] List/get /prism-counsel/prism-counsel/ny/matters/{matterId}/ai-reviews (prism-counsel-ny) |
| `GET` | /prism-counsel/prism-counsel/ny/matters/{matterId}/appeals | `prism_counsel_ny_get_prism_counsel_prism_counsel_ny_matters_matterId_appeals` | [stub] List/get /prism-counsel/prism-counsel/ny/matters/{matterId}/appeals (prism-counsel-ny) |
| `POST` | /prism-counsel/prism-counsel/ny/matters/{matterId}/appeals | `prism_counsel_ny_post_prism_counsel_prism_counsel_ny_matters_matterId_appeals` | [stub] Create/invoke /prism-counsel/prism-counsel/ny/matters/{matterId}/appeals (prism-counsel-ny) |
| `GET` | /prism-counsel/prism-counsel/ny/matters/{matterId}/clocks | `prism_counsel_ny_get_prism_counsel_prism_counsel_ny_matters_matterId_clocks` | [stub] List/get /prism-counsel/prism-counsel/ny/matters/{matterId}/clocks (prism-counsel-ny) |
| `POST` | /prism-counsel/prism-counsel/ny/matters/{matterId}/clocks | `prism_counsel_ny_post_prism_counsel_prism_counsel_ny_matters_matterId_clocks` | [stub] Create/invoke /prism-counsel/prism-counsel/ny/matters/{matterId}/clocks (prism-counsel-ny) |
| `GET` | /prism-counsel/prism-counsel/ny/matters/{matterId}/communication-windows | `prism_counsel_ny_get_prism_counsel_prism_counsel_ny_matters_matterId_communication_windows` | [stub] List/get /prism-counsel/prism-counsel/ny/matters/{matterId}/communication-windows (prism-counsel-ny) |
| `GET` | /prism-counsel/prism-counsel/ny/matters/{matterId}/coverage-positions | `prism_counsel_ny_get_prism_counsel_prism_counsel_ny_matters_matterId_coverage_positions` | [stub] List/get /prism-counsel/prism-counsel/ny/matters/{matterId}/coverage-positions (prism-counsel-ny) |
| `GET` | /prism-counsel/prism-counsel/ny/matters/{matterId}/defensibility | `prism_counsel_ny_get_prism_counsel_prism_counsel_ny_matters_matterId_defensibility` | [stub] List/get /prism-counsel/prism-counsel/ny/matters/{matterId}/defensibility (prism-counsel-ny) |
| `GET` | /prism-counsel/prism-counsel/ny/matters/{matterId}/demand-packets | `prism_counsel_ny_get_prism_counsel_prism_counsel_ny_matters_matterId_demand_packets` | [stub] List/get /prism-counsel/prism-counsel/ny/matters/{matterId}/demand-packets (prism-counsel-ny) |
| `POST` | /prism-counsel/prism-counsel/ny/matters/{matterId}/demand-packets | `prism_counsel_ny_post_prism_counsel_prism_counsel_ny_matters_matterId_demand_packets` | [stub] Create/invoke /prism-counsel/prism-counsel/ny/matters/{matterId}/demand-packets (prism-counsel-ny) |
| `GET` | /prism-counsel/prism-counsel/ny/matters/{matterId}/demand-readiness | `prism_counsel_ny_get_prism_counsel_prism_counsel_ny_matters_matterId_demand_readiness` | [stub] List/get /prism-counsel/prism-counsel/ny/matters/{matterId}/demand-readiness (prism-counsel-ny) |
| `GET` | /prism-counsel/prism-counsel/ny/matters/{matterId}/denials | `prism_counsel_ny_get_prism_counsel_prism_counsel_ny_matters_matterId_denials` | [stub] List/get /prism-counsel/prism-counsel/ny/matters/{matterId}/denials (prism-counsel-ny) |
| `GET` | /prism-counsel/prism-counsel/ny/matters/{matterId}/disclaimers | `prism_counsel_ny_get_prism_counsel_prism_counsel_ny_matters_matterId_disclaimers` | [stub] List/get /prism-counsel/prism-counsel/ny/matters/{matterId}/disclaimers (prism-counsel-ny) |
| `GET` | /prism-counsel/prism-counsel/ny/matters/{matterId}/external-appeals | `prism_counsel_ny_get_prism_counsel_prism_counsel_ny_matters_matterId_external_appeals` | [stub] List/get /prism-counsel/prism-counsel/ny/matters/{matterId}/external-appeals (prism-counsel-ny) |
| `GET` | /prism-counsel/prism-counsel/ny/matters/{matterId}/forecasts | `prism_counsel_ny_get_prism_counsel_prism_counsel_ny_matters_matterId_forecasts` | [stub] List/get /prism-counsel/prism-counsel/ny/matters/{matterId}/forecasts (prism-counsel-ny) |
| `POST` | /prism-counsel/prism-counsel/ny/matters/{matterId}/forecasts/compute | `prism_counsel_ny_post_prism_counsel_prism_counsel_ny_matters_matterId_forecasts_compute` | [stub] Create/invoke /prism-counsel/prism-counsel/ny/matters/{matterId}/forecasts/compute (prism-counsel-ny) |
| `GET` | /prism-counsel/prism-counsel/ny/matters/{matterId}/forecasts/latest | `prism_counsel_ny_get_prism_counsel_prism_counsel_ny_matters_matterId_forecasts_latest` | [stub] List/get /prism-counsel/prism-counsel/ny/matters/{matterId}/forecasts/latest (prism-counsel-ny) |
| `GET` | /prism-counsel/prism-counsel/ny/matters/{matterId}/mediation-events | `prism_counsel_ny_get_prism_counsel_prism_counsel_ny_matters_matterId_mediation_events` | [stub] List/get /prism-counsel/prism-counsel/ny/matters/{matterId}/mediation-events (prism-counsel-ny) |
| `GET` | /prism-counsel/prism-counsel/ny/matters/{matterId}/mediations | `prism_counsel_ny_get_prism_counsel_prism_counsel_ny_matters_matterId_mediations` | [stub] List/get /prism-counsel/prism-counsel/ny/matters/{matterId}/mediations (prism-counsel-ny) |
| `GET` | /prism-counsel/prism-counsel/ny/matters/{matterId}/medical-bills | `prism_counsel_ny_get_prism_counsel_prism_counsel_ny_matters_matterId_medical_bills` | [stub] List/get /prism-counsel/prism-counsel/ny/matters/{matterId}/medical-bills (prism-counsel-ny) |
| `GET` | /prism-counsel/prism-counsel/ny/matters/{matterId}/no-fault-claims | `prism_counsel_ny_get_prism_counsel_prism_counsel_ny_matters_matterId_no_fault_claims` | [stub] List/get /prism-counsel/prism-counsel/ny/matters/{matterId}/no-fault-claims (prism-counsel-ny) |
| `POST` | /prism-counsel/prism-counsel/ny/matters/{matterId}/no-fault-claims | `prism_counsel_ny_post_prism_counsel_prism_counsel_ny_matters_matterId_no_fault_claims` | [stub] Create/invoke /prism-counsel/prism-counsel/ny/matters/{matterId}/no-fault-claims (prism-counsel-ny) |
| `GET` | /prism-counsel/prism-counsel/ny/matters/{matterId}/offer-movements | `prism_counsel_ny_get_prism_counsel_prism_counsel_ny_matters_matterId_offer_movements` | [stub] List/get /prism-counsel/prism-counsel/ny/matters/{matterId}/offer-movements (prism-counsel-ny) |
| `POST` | /prism-counsel/prism-counsel/ny/matters/{matterId}/offer-movements | `prism_counsel_ny_post_prism_counsel_prism_counsel_ny_matters_matterId_offer_movements` | [stub] Create/invoke /prism-counsel/prism-counsel/ny/matters/{matterId}/offer-movements (prism-counsel-ny) |
| `GET` | /prism-counsel/prism-counsel/ny/matters/{matterId}/offers | `prism_counsel_ny_get_prism_counsel_prism_counsel_ny_matters_matterId_offers` | [stub] List/get /prism-counsel/prism-counsel/ny/matters/{matterId}/offers (prism-counsel-ny) |
| `GET` | /prism-counsel/prism-counsel/ny/matters/{matterId}/readiness-snapshots | `prism_counsel_ny_get_prism_counsel_prism_counsel_ny_matters_matterId_readiness_snapshots` | [stub] List/get /prism-counsel/prism-counsel/ny/matters/{matterId}/readiness-snapshots (prism-counsel-ny) |
| `GET` | /prism-counsel/prism-counsel/ny/matters/{matterId}/reserve-movements | `prism_counsel_ny_get_prism_counsel_prism_counsel_ny_matters_matterId_reserve_movements` | [stub] List/get /prism-counsel/prism-counsel/ny/matters/{matterId}/reserve-movements (prism-counsel-ny) |
| `GET` | /prism-counsel/prism-counsel/ny/matters/{matterId}/verifications | `prism_counsel_ny_get_prism_counsel_prism_counsel_ny_matters_matterId_verifications` | [stub] List/get /prism-counsel/prism-counsel/ny/matters/{matterId}/verifications (prism-counsel-ny) |
| `GET` | /prism-counsel/prism-counsel/ny/part-profiles | `prism_counsel_ny_get_prism_counsel_prism_counsel_ny_part_profiles` | [stub] List/get /prism-counsel/prism-counsel/ny/part-profiles (prism-counsel-ny) |
| `GET` | /prism-counsel/prism-counsel/ny/rule-profiles | `prism_counsel_ny_get_prism_counsel_prism_counsel_ny_rule_profiles` | [stub] List/get /prism-counsel/prism-counsel/ny/rule-profiles (prism-counsel-ny) |
| `GET` | /prism-counsel/prism-counsel/ny/venue-profiles | `prism_counsel_ny_get_prism_counsel_prism_counsel_ny_venue_profiles` | [stub] List/get /prism-counsel/prism-counsel/ny/venue-profiles (prism-counsel-ny) |
| `GET` | /prism-counsel/prism-counsel/ny/venue-profiles/{id} | `prism_counsel_ny_get_prism_counsel_prism_counsel_ny_venue_profiles_id` | [stub] List/get /prism-counsel/prism-counsel/ny/venue-profiles/{id} (prism-counsel-ny) |

<a id="prism-counsel-ops"></a>

## prism-counsel-ops

Auto-generated tag for prism-counsel-ops route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /orgs/approvals | `prism_counsel_ops_get_orgs_approvals` | [stub] List/get /orgs/approvals (prism-counsel-ops) |
| `POST` | /orgs/approvals | `prism_counsel_ops_post_orgs_approvals` | [stub] Create/invoke /orgs/approvals (prism-counsel-ops) |
| `PATCH` | /orgs/approvals/{approvalId}/resolve | `prism_counsel_ops_patch_orgs_approvals_approvalId_resolve` | [stub] Patch /orgs/approvals/{approvalId}/resolve (prism-counsel-ops) |
| `GET` | /orgs/audit | `prism_counsel_ops_get_orgs_audit` | [stub] List/get /orgs/audit (prism-counsel-ops) |
| `GET` | /orgs/connectors | `prism_counsel_ops_get_orgs_connectors` | [stub] List/get /orgs/connectors (prism-counsel-ops) |
| `GET` | /orgs/connectors/{accountId}/history | `prism_counsel_ops_get_orgs_connectors_accountId_history` | [stub] List/get /orgs/connectors/{accountId}/history (prism-counsel-ops) |
| `POST` | /orgs/connectors/{accountId}/sync | `prism_counsel_ops_post_orgs_connectors_accountId_sync` | [stub] Create/invoke /orgs/connectors/{accountId}/sync (prism-counsel-ops) |
| `GET` | /orgs/dashboard | `prism_counsel_ops_get_orgs_dashboard` | [stub] List/get /orgs/dashboard (prism-counsel-ops) |
| `POST` | /orgs/exports | `prism_counsel_ops_post_orgs_exports` | [stub] Create/invoke /orgs/exports (prism-counsel-ops) |
| `GET` | /orgs/health | `prism_counsel_ops_get_orgs_health` | [stub] List/get /orgs/health (prism-counsel-ops) |
| `GET` | /orgs/jobs | `prism_counsel_ops_get_orgs_jobs` | [stub] List/get /orgs/jobs (prism-counsel-ops) |
| `GET` | /orgs/jobs/dead-letter | `prism_counsel_ops_get_orgs_jobs_dead_letter` | [stub] List/get /orgs/jobs/dead-letter (prism-counsel-ops) |
| `POST` | /orgs/jobs/dead-letter/{eventId}/replay | `prism_counsel_ops_post_orgs_jobs_dead_letter_eventId_replay` | [stub] Create/invoke /orgs/jobs/dead-letter/{eventId}/replay (prism-counsel-ops) |
| `GET` | /orgs/matters | `prism_counsel_ops_get_orgs_matters` | [stub] List/get /orgs/matters (prism-counsel-ops) |
| `POST` | /orgs/matters | `prism_counsel_ops_post_orgs_matters` | [stub] Create/invoke /orgs/matters (prism-counsel-ops) |
| `GET` | /orgs/matters/{matterId} | `prism_counsel_ops_get_orgs_matters_matterId` | [stub] List/get /orgs/matters/{matterId} (prism-counsel-ops) |
| `PATCH` | /orgs/matters/{matterId} | `prism_counsel_ops_patch_orgs_matters_matterId` | [stub] Patch /orgs/matters/{matterId} (prism-counsel-ops) |
| `GET` | /orgs/matters/{matterId}/communications | `prism_counsel_ops_get_orgs_matters_matterId_communications` | [stub] List/get /orgs/matters/{matterId}/communications (prism-counsel-ops) |
| `GET` | /orgs/matters/{matterId}/deadlines | `prism_counsel_ops_get_orgs_matters_matterId_deadlines` | [stub] List/get /orgs/matters/{matterId}/deadlines (prism-counsel-ops) |
| `POST` | /orgs/matters/{matterId}/deadlines | `prism_counsel_ops_post_orgs_matters_matterId_deadlines` | [stub] Create/invoke /orgs/matters/{matterId}/deadlines (prism-counsel-ops) |
| `GET` | /orgs/matters/{matterId}/discovery | `prism_counsel_ops_get_orgs_matters_matterId_discovery` | [stub] List/get /orgs/matters/{matterId}/discovery (prism-counsel-ops) |
| `GET` | /orgs/matters/{matterId}/documents | `prism_counsel_ops_get_orgs_matters_matterId_documents` | [stub] List/get /orgs/matters/{matterId}/documents (prism-counsel-ops) |
| `GET` | /orgs/matters/{matterId}/parties | `prism_counsel_ops_get_orgs_matters_matterId_parties` | [stub] List/get /orgs/matters/{matterId}/parties (prism-counsel-ops) |
| `POST` | /orgs/matters/{matterId}/parties | `prism_counsel_ops_post_orgs_matters_matterId_parties` | [stub] Create/invoke /orgs/matters/{matterId}/parties (prism-counsel-ops) |
| `GET` | /orgs/matters/{matterId}/witnesses | `prism_counsel_ops_get_orgs_matters_matterId_witnesses` | [stub] List/get /orgs/matters/{matterId}/witnesses (prism-counsel-ops) |
| `GET` | /orgs/notifications | `prism_counsel_ops_get_orgs_notifications` | [stub] List/get /orgs/notifications (prism-counsel-ops) |
| `GET` | /orgs/pipeline/stats | `prism_counsel_ops_get_orgs_pipeline_stats` | [stub] List/get /orgs/pipeline/stats (prism-counsel-ops) |
| `POST` | /orgs/privilege/check | `prism_counsel_ops_post_orgs_privilege_check` | [stub] Create/invoke /orgs/privilege/check (prism-counsel-ops) |
| `GET` | /orgs/readiness | `prism_counsel_ops_get_orgs_readiness` | [stub] List/get /orgs/readiness (prism-counsel-ops) |

<a id="prism-counsel-pilot"></a>

## prism-counsel-pilot

Auto-generated tag for prism-counsel-pilot route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /prism-counsel/pilot/admin/connectors | `prism_counsel_pilot_get_prism_counsel_pilot_admin_connectors` | [stub] List/get /prism-counsel/pilot/admin/connectors (prism-counsel-pilot) |
| `GET` | /prism-counsel/pilot/admin/health | `prism_counsel_pilot_get_prism_counsel_pilot_admin_health` | [stub] List/get /prism-counsel/pilot/admin/health (prism-counsel-pilot) |
| `GET` | /prism-counsel/pilot/admin/jobs | `prism_counsel_pilot_get_prism_counsel_pilot_admin_jobs` | [stub] List/get /prism-counsel/pilot/admin/jobs (prism-counsel-pilot) |
| `GET` | /prism-counsel/pilot/exports | `prism_counsel_pilot_get_prism_counsel_pilot_exports` | [stub] List/get /prism-counsel/pilot/exports (prism-counsel-pilot) |
| `POST` | /prism-counsel/pilot/exports | `prism_counsel_pilot_post_prism_counsel_pilot_exports` | [stub] Create/invoke /prism-counsel/pilot/exports (prism-counsel-pilot) |
| `GET` | /prism-counsel/pilot/exports/{id} | `prism_counsel_pilot_get_prism_counsel_pilot_exports_id` | [stub] List/get /prism-counsel/pilot/exports/{id} (prism-counsel-pilot) |
| `GET` | /prism-counsel/pilot/exports/{id}/content | `prism_counsel_pilot_get_prism_counsel_pilot_exports_id_content` | [stub] List/get /prism-counsel/pilot/exports/{id}/content (prism-counsel-pilot) |
| `GET` | /prism-counsel/pilot/forecasts/{matterId} | `prism_counsel_pilot_get_prism_counsel_pilot_forecasts_matterId` | [stub] List/get /prism-counsel/pilot/forecasts/{matterId} (prism-counsel-pilot) |
| `POST` | /prism-counsel/pilot/ingest/email | `prism_counsel_pilot_post_prism_counsel_pilot_ingest_email` | [stub] Create/invoke /prism-counsel/pilot/ingest/email (prism-counsel-pilot) |
| `POST` | /prism-counsel/pilot/ingest/file | `prism_counsel_pilot_post_prism_counsel_pilot_ingest_file` | [stub] Create/invoke /prism-counsel/pilot/ingest/file (prism-counsel-pilot) |
| `GET` | /prism-counsel/pilot/matter-desk/{id} | `prism_counsel_pilot_get_prism_counsel_pilot_matter_desk_id` | [stub] List/get /prism-counsel/pilot/matter-desk/{id} (prism-counsel-pilot) |
| `GET` | /prism-counsel/pilot/reviews | `prism_counsel_pilot_get_prism_counsel_pilot_reviews` | [stub] List/get /prism-counsel/pilot/reviews (prism-counsel-pilot) |
| `POST` | /prism-counsel/pilot/reviews | `prism_counsel_pilot_post_prism_counsel_pilot_reviews` | [stub] Create/invoke /prism-counsel/pilot/reviews (prism-counsel-pilot) |
| `GET` | /prism-counsel/pilot/reviews/{id} | `prism_counsel_pilot_get_prism_counsel_pilot_reviews_id` | [stub] List/get /prism-counsel/pilot/reviews/{id} (prism-counsel-pilot) |
| `PATCH` | /prism-counsel/pilot/reviews/{id}/state | `prism_counsel_pilot_patch_prism_counsel_pilot_reviews_id_state` | [stub] Patch /prism-counsel/pilot/reviews/{id}/state (prism-counsel-pilot) |
| `POST` | /prism-counsel/pilot/reviews/{id}/submit-signoff | `prism_counsel_pilot_post_prism_counsel_pilot_reviews_id_submit_signoff` | [stub] Create/invoke /prism-counsel/pilot/reviews/{id}/submit-signoff (prism-counsel-pilot) |
| `GET` | /prism-counsel/pilot/signoffs | `prism_counsel_pilot_get_prism_counsel_pilot_signoffs` | [stub] List/get /prism-counsel/pilot/signoffs (prism-counsel-pilot) |
| `POST` | /prism-counsel/pilot/signoffs/{id}/resolve | `prism_counsel_pilot_post_prism_counsel_pilot_signoffs_id_resolve` | [stub] Create/invoke /prism-counsel/pilot/signoffs/{id}/resolve (prism-counsel-pilot) |
| `GET` | /prism-counsel/pilot/signoffs/pending | `prism_counsel_pilot_get_prism_counsel_pilot_signoffs_pending` | [stub] List/get /prism-counsel/pilot/signoffs/pending (prism-counsel-pilot) |
| `GET` | /prism-counsel/pilot/today | `prism_counsel_pilot_get_prism_counsel_pilot_today` | [stub] List/get /prism-counsel/pilot/today (prism-counsel-pilot) |
| `GET` | /prism-counsel/pilot/today/brief | `prism_counsel_pilot_get_prism_counsel_pilot_today_brief` | [stub] List/get /prism-counsel/pilot/today/brief (prism-counsel-pilot) |
| `POST` | /prism-counsel/pilot/today/brief/generate | `prism_counsel_pilot_post_prism_counsel_pilot_today_brief_generate` | [stub] Create/invoke /prism-counsel/pilot/today/brief/generate (prism-counsel-pilot) |
| `POST` | /prism-counsel/pilot/today/detect-risks | `prism_counsel_pilot_post_prism_counsel_pilot_today_detect_risks` | [stub] Create/invoke /prism-counsel/pilot/today/detect-risks (prism-counsel-pilot) |
| `GET` | /prism-counsel/pilot/today/next-actions | `prism_counsel_pilot_get_prism_counsel_pilot_today_next_actions` | [stub] List/get /prism-counsel/pilot/today/next-actions (prism-counsel-pilot) |
| `POST` | /prism-counsel/pilot/today/next-actions/{id}/complete | `prism_counsel_pilot_post_prism_counsel_pilot_today_next_actions_id_complete` | [stub] Create/invoke /prism-counsel/pilot/today/next-actions/{id}/complete (prism-counsel-pilot) |
| `GET` | /prism-counsel/pilot/today/quiet-risks | `prism_counsel_pilot_get_prism_counsel_pilot_today_quiet_risks` | [stub] List/get /prism-counsel/pilot/today/quiet-risks (prism-counsel-pilot) |
| `GET` | /prism-counsel/pilot/what-changed | `prism_counsel_pilot_get_prism_counsel_pilot_what_changed` | [stub] List/get /prism-counsel/pilot/what-changed (prism-counsel-pilot) |
| `POST` | /prism-counsel/pilot/what-changed/mark-read | `prism_counsel_pilot_post_prism_counsel_pilot_what_changed_mark_read` | [stub] Create/invoke /prism-counsel/pilot/what-changed/mark-read (prism-counsel-pilot) |

<a id="prism-counsel-pilot-one"></a>

## prism-counsel-pilot-one

Auto-generated tag for prism-counsel-pilot-one route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /prism-counsel/pilot-one/admin/friction | `prism_counsel_pilot_one_get_prism_counsel_pilot_one_admin_friction` | [stub] List/get /prism-counsel/pilot-one/admin/friction (prism-counsel-pilot-one) |
| `GET` | /prism-counsel/pilot-one/admin/portfolio-learning | `prism_counsel_pilot_one_get_prism_counsel_pilot_one_admin_portfolio_learning` | [stub] List/get /prism-counsel/pilot-one/admin/portfolio-learning (prism-counsel-pilot-one) |
| `GET` | /prism-counsel/pilot-one/admin/pressure | `prism_counsel_pilot_one_get_prism_counsel_pilot_one_admin_pressure` | [stub] List/get /prism-counsel/pilot-one/admin/pressure (prism-counsel-pilot-one) |
| `GET` | /prism-counsel/pilot-one/admin/quality | `prism_counsel_pilot_one_get_prism_counsel_pilot_one_admin_quality` | [stub] List/get /prism-counsel/pilot-one/admin/quality (prism-counsel-pilot-one) |
| `GET` | /prism-counsel/pilot-one/admin/worldline | `prism_counsel_pilot_one_get_prism_counsel_pilot_one_admin_worldline` | [stub] List/get /prism-counsel/pilot-one/admin/worldline (prism-counsel-pilot-one) |
| `GET` | /prism-counsel/pilot-one/boards/carrier-watch | `prism_counsel_pilot_one_get_prism_counsel_pilot_one_boards_carrier_watch` | [stub] List/get /prism-counsel/pilot-one/boards/carrier-watch (prism-counsel-pilot-one) |
| `GET` | /prism-counsel/pilot-one/boards/friction | `prism_counsel_pilot_one_get_prism_counsel_pilot_one_boards_friction` | [stub] List/get /prism-counsel/pilot-one/boards/friction (prism-counsel-pilot-one) |
| `GET` | /prism-counsel/pilot-one/boards/movement | `prism_counsel_pilot_one_get_prism_counsel_pilot_one_boards_movement` | [stub] List/get /prism-counsel/pilot-one/boards/movement (prism-counsel-pilot-one) |
| `GET` | /prism-counsel/pilot-one/boards/pressure | `prism_counsel_pilot_one_get_prism_counsel_pilot_one_boards_pressure` | [stub] List/get /prism-counsel/pilot-one/boards/pressure (prism-counsel-pilot-one) |
| `GET` | /prism-counsel/pilot-one/boards/today-enhanced | `prism_counsel_pilot_one_get_prism_counsel_pilot_one_boards_today_enhanced` | [stub] List/get /prism-counsel/pilot-one/boards/today-enhanced (prism-counsel-pilot-one) |
| `GET` | /prism-counsel/pilot-one/copilot/pilot-one/cards | `prism_counsel_pilot_one_get_prism_counsel_pilot_one_copilot_pilot_one_cards` | [stub] List/get /prism-counsel/pilot-one/copilot/pilot-one/cards (prism-counsel-pilot-one) |
| `POST` | /prism-counsel/pilot-one/copilot/pilot-one/execute | `prism_counsel_pilot_one_post_prism_counsel_pilot_one_copilot_pilot_one_execute` | [stub] Create/invoke /prism-counsel/pilot-one/copilot/pilot-one/execute (prism-counsel-pilot-one) |
| `POST` | /prism-counsel/pilot-one/forecasts/pilot-one/{matterId}/compute | `prism_counsel_pilot_one_post_prism_counsel_pilot_one_forecasts_pilot_one_matterId_compute` | [stub] Create/invoke /prism-counsel/pilot-one/forecasts/pilot-one/{matterId}/compute (prism-counsel-pilot-one) |
| `GET` | /prism-counsel/pilot-one/forecasts/pilot-one/{matterId}/diff-view | `prism_counsel_pilot_one_get_prism_counsel_pilot_one_forecasts_pilot_one_matterId_diff_view` | [stub] List/get /prism-counsel/pilot-one/forecasts/pilot-one/{matterId}/diff-view (prism-counsel-pilot-one) |
| `GET` | /prism-counsel/pilot-one/friction/{matterId} | `prism_counsel_pilot_one_get_prism_counsel_pilot_one_friction_matterId` | [stub] List/get /prism-counsel/pilot-one/friction/{matterId} (prism-counsel-pilot-one) |
| `POST` | /prism-counsel/pilot-one/friction/{matterId}/compute | `prism_counsel_pilot_one_post_prism_counsel_pilot_one_friction_matterId_compute` | [stub] Create/invoke /prism-counsel/pilot-one/friction/{matterId}/compute (prism-counsel-pilot-one) |
| `GET` | /prism-counsel/pilot-one/friction/{matterId}/recommendations | `prism_counsel_pilot_one_get_prism_counsel_pilot_one_friction_matterId_recommendations` | [stub] List/get /prism-counsel/pilot-one/friction/{matterId}/recommendations (prism-counsel-pilot-one) |
| `GET` | /prism-counsel/pilot-one/friction/portfolio/view | `prism_counsel_pilot_one_get_prism_counsel_pilot_one_friction_portfolio_view` | [stub] List/get /prism-counsel/pilot-one/friction/portfolio/view (prism-counsel-pilot-one) |
| `POST` | /prism-counsel/pilot-one/friction/recommendations/{id}/accept | `prism_counsel_pilot_one_post_prism_counsel_pilot_one_friction_recommendations_id_accept` | [stub] Create/invoke /prism-counsel/pilot-one/friction/recommendations/{id}/accept (prism-counsel-pilot-one) |
| `GET` | /prism-counsel/pilot-one/portfolio/action-effectiveness | `prism_counsel_pilot_one_get_prism_counsel_pilot_one_portfolio_action_effectiveness` | [stub] List/get /prism-counsel/pilot-one/portfolio/action-effectiveness (prism-counsel-pilot-one) |
| `GET` | /prism-counsel/pilot-one/portfolio/benchmarks | `prism_counsel_pilot_one_get_prism_counsel_pilot_one_portfolio_benchmarks` | [stub] List/get /prism-counsel/pilot-one/portfolio/benchmarks (prism-counsel-pilot-one) |
| `GET` | /prism-counsel/pilot-one/portfolio/best-next-30/{userId} | `prism_counsel_pilot_one_get_prism_counsel_pilot_one_portfolio_best_next_30_userId` | [stub] List/get /prism-counsel/pilot-one/portfolio/best-next-30/{userId} (prism-counsel-pilot-one) |
| `GET` | /prism-counsel/pilot-one/portfolio/cohorts | `prism_counsel_pilot_one_get_prism_counsel_pilot_one_portfolio_cohorts` | [stub] List/get /prism-counsel/pilot-one/portfolio/cohorts (prism-counsel-pilot-one) |
| `POST` | /prism-counsel/pilot-one/portfolio/quiet-risk/{matterId} | `prism_counsel_pilot_one_post_prism_counsel_pilot_one_portfolio_quiet_risk_matterId` | [stub] Create/invoke /prism-counsel/pilot-one/portfolio/quiet-risk/{matterId} (prism-counsel-pilot-one) |
| `POST` | /prism-counsel/pilot-one/portfolio/run-learning | `prism_counsel_pilot_one_post_prism_counsel_pilot_one_portfolio_run_learning` | [stub] Create/invoke /prism-counsel/pilot-one/portfolio/run-learning (prism-counsel-pilot-one) |
| `GET` | /prism-counsel/pilot-one/portfolio/watchlist | `prism_counsel_pilot_one_get_prism_counsel_pilot_one_portfolio_watchlist` | [stub] List/get /prism-counsel/pilot-one/portfolio/watchlist (prism-counsel-pilot-one) |
| `GET` | /prism-counsel/pilot-one/pressure/{matterId} | `prism_counsel_pilot_one_get_prism_counsel_pilot_one_pressure_matterId` | [stub] List/get /prism-counsel/pilot-one/pressure/{matterId} (prism-counsel-pilot-one) |
| `POST` | /prism-counsel/pilot-one/pressure/{matterId}/compute | `prism_counsel_pilot_one_post_prism_counsel_pilot_one_pressure_matterId_compute` | [stub] Create/invoke /prism-counsel/pilot-one/pressure/{matterId}/compute (prism-counsel-pilot-one) |
| `POST` | /prism-counsel/pilot-one/pressure/{matterId}/events | `prism_counsel_pilot_one_post_prism_counsel_pilot_one_pressure_matterId_events` | [stub] Create/invoke /prism-counsel/pilot-one/pressure/{matterId}/events (prism-counsel-pilot-one) |
| `GET` | /prism-counsel/pilot-one/pressure/carrier/patterns | `prism_counsel_pilot_one_get_prism_counsel_pilot_one_pressure_carrier_patterns` | [stub] List/get /prism-counsel/pilot-one/pressure/carrier/patterns (prism-counsel-pilot-one) |
| `GET` | /prism-counsel/pilot-one/pressure/portfolio/view | `prism_counsel_pilot_one_get_prism_counsel_pilot_one_pressure_portfolio_view` | [stub] List/get /prism-counsel/pilot-one/pressure/portfolio/view (prism-counsel-pilot-one) |
| `GET` | /prism-counsel/pilot-one/pressure/silence-windows | `prism_counsel_pilot_one_get_prism_counsel_pilot_one_pressure_silence_windows` | [stub] List/get /prism-counsel/pilot-one/pressure/silence-windows (prism-counsel-pilot-one) |
| `GET` | /prism-counsel/pilot-one/worldline/recovery-markers | `prism_counsel_pilot_one_get_prism_counsel_pilot_one_worldline_recovery_markers` | [stub] List/get /prism-counsel/pilot-one/worldline/recovery-markers (prism-counsel-pilot-one) |
| `GET` | /prism-counsel/pilot-one/worldline/regulatory | `prism_counsel_pilot_one_get_prism_counsel_pilot_one_worldline_regulatory` | [stub] List/get /prism-counsel/pilot-one/worldline/regulatory (prism-counsel-pilot-one) |
| `GET` | /prism-counsel/pilot-one/worldline/signal-overlays | `prism_counsel_pilot_one_get_prism_counsel_pilot_one_worldline_signal_overlays` | [stub] List/get /prism-counsel/pilot-one/worldline/signal-overlays (prism-counsel-pilot-one) |
| `GET` | /prism-counsel/pilot-one/worldline/weather | `prism_counsel_pilot_one_get_prism_counsel_pilot_one_worldline_weather` | [stub] List/get /prism-counsel/pilot-one/worldline/weather (prism-counsel-pilot-one) |

<a id="prism-counsel-purview"></a>

## prism-counsel-purview

Auto-generated tag for prism-counsel-purview route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /prism-counsel/purview/bridge-summary | `prism_counsel_purview_get_prism_counsel_purview_bridge_summary` | [stub] List/get /prism-counsel/purview/bridge-summary (prism-counsel-purview) |
| `GET` | /prism-counsel/purview/case-links | `prism_counsel_purview_get_prism_counsel_purview_case_links` | [stub] List/get /prism-counsel/purview/case-links (prism-counsel-purview) |
| `GET` | /prism-counsel/purview/diagnostics | `prism_counsel_purview_get_prism_counsel_purview_diagnostics` | [stub] List/get /prism-counsel/purview/diagnostics (prism-counsel-purview) |
| `POST` | /prism-counsel/purview/diagnostics/run | `prism_counsel_purview_post_prism_counsel_purview_diagnostics_run` | [stub] Create/invoke /prism-counsel/purview/diagnostics/run (prism-counsel-purview) |
| `GET` | /prism-counsel/purview/export-handoffs | `prism_counsel_purview_get_prism_counsel_purview_export_handoffs` | [stub] List/get /prism-counsel/purview/export-handoffs (prism-counsel-purview) |
| `POST` | /prism-counsel/purview/export-handoffs/{id}/confirm | `prism_counsel_purview_post_prism_counsel_purview_export_handoffs_id_confirm` | [stub] Create/invoke /prism-counsel/purview/export-handoffs/{id}/confirm (prism-counsel-purview) |
| `GET` | /prism-counsel/purview/hold-awareness | `prism_counsel_purview_get_prism_counsel_purview_hold_awareness` | [stub] List/get /prism-counsel/purview/hold-awareness (prism-counsel-purview) |
| `GET` | /prism-counsel/purview/scope-links | `prism_counsel_purview_get_prism_counsel_purview_scope_links` | [stub] List/get /prism-counsel/purview/scope-links (prism-counsel-purview) |
| `GET` | /prism-counsel/purview/status | `prism_counsel_purview_get_prism_counsel_purview_status` | [stub] List/get /prism-counsel/purview/status (prism-counsel-purview) |

<a id="prism-counsel-review"></a>

## prism-counsel-review

Auto-generated tag for prism-counsel-review route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /prism-counsel/review-desk/admin | `prism_counsel_review_get_prism_counsel_review_desk_admin` | [stub] List/get /prism-counsel/review-desk/admin (prism-counsel-review) |
| `GET` | /prism-counsel/review-desk/blocked | `prism_counsel_review_get_prism_counsel_review_desk_blocked` | [stub] List/get /prism-counsel/review-desk/blocked (prism-counsel-review) |
| `GET` | /prism-counsel/review-desk/contradiction | `prism_counsel_review_get_prism_counsel_review_desk_contradiction` | [stub] List/get /prism-counsel/review-desk/contradiction (prism-counsel-review) |
| `GET` | /prism-counsel/review-desk/copilot/max-unblock | `prism_counsel_review_get_prism_counsel_review_desk_copilot_max_unblock` | [stub] List/get /prism-counsel/review-desk/copilot/max-unblock (prism-counsel-review) |
| `GET` | /prism-counsel/review-desk/high-risk | `prism_counsel_review_get_prism_counsel_review_desk_high_risk` | [stub] List/get /prism-counsel/review-desk/high-risk (prism-counsel-review) |
| `POST` | /prism-counsel/review-desk/items | `prism_counsel_review_post_prism_counsel_review_desk_items` | [stub] Create/invoke /prism-counsel/review-desk/items (prism-counsel-review) |
| `GET` | /prism-counsel/review-desk/items/{id} | `prism_counsel_review_get_prism_counsel_review_desk_items_id` | [stub] List/get /prism-counsel/review-desk/items/{id} (prism-counsel-review) |
| `POST` | /prism-counsel/review-desk/items/{id}/actions/approve | `prism_counsel_review_post_prism_counsel_review_desk_items_id_actions_approve` | [stub] Create/invoke /prism-counsel/review-desk/items/{id}/actions/approve (prism-counsel-review) |
| `POST` | /prism-counsel/review-desk/items/{id}/actions/assign | `prism_counsel_review_post_prism_counsel_review_desk_items_id_actions_assign` | [stub] Create/invoke /prism-counsel/review-desk/items/{id}/actions/assign (prism-counsel-review) |
| `POST` | /prism-counsel/review-desk/items/{id}/actions/block | `prism_counsel_review_post_prism_counsel_review_desk_items_id_actions_block` | [stub] Create/invoke /prism-counsel/review-desk/items/{id}/actions/block (prism-counsel-review) |
| `POST` | /prism-counsel/review-desk/items/{id}/actions/escalate | `prism_counsel_review_post_prism_counsel_review_desk_items_id_actions_escalate` | [stub] Create/invoke /prism-counsel/review-desk/items/{id}/actions/escalate (prism-counsel-review) |
| `POST` | /prism-counsel/review-desk/items/{id}/actions/export-packet | `prism_counsel_review_post_prism_counsel_review_desk_items_id_actions_export_packet` | [stub] Create/invoke /prism-counsel/review-desk/items/{id}/actions/export-packet (prism-counsel-review) |
| `POST` | /prism-counsel/review-desk/items/{id}/actions/generate-review-packet | `prism_counsel_review_post_prism_counsel_review_desk_items_id_actions_generate_review_packet` | [stub] Create/invoke /prism-counsel/review-desk/items/{id}/actions/generate-review-packet (prism-counsel-review) |
| `POST` | /prism-counsel/review-desk/items/{id}/actions/reject | `prism_counsel_review_post_prism_counsel_review_desk_items_id_actions_reject` | [stub] Create/invoke /prism-counsel/review-desk/items/{id}/actions/reject (prism-counsel-review) |
| `POST` | /prism-counsel/review-desk/items/{id}/actions/request-support | `prism_counsel_review_post_prism_counsel_review_desk_items_id_actions_request_support` | [stub] Create/invoke /prism-counsel/review-desk/items/{id}/actions/request-support (prism-counsel-review) |
| `POST` | /prism-counsel/review-desk/items/{id}/actions/revise | `prism_counsel_review_post_prism_counsel_review_desk_items_id_actions_revise` | [stub] Create/invoke /prism-counsel/review-desk/items/{id}/actions/revise (prism-counsel-review) |
| `POST` | /prism-counsel/review-desk/items/{id}/notes | `prism_counsel_review_post_prism_counsel_review_desk_items_id_notes` | [stub] Create/invoke /prism-counsel/review-desk/items/{id}/notes (prism-counsel-review) |
| `POST` | /prism-counsel/review-desk/items/{id}/transition | `prism_counsel_review_post_prism_counsel_review_desk_items_id_transition` | [stub] Create/invoke /prism-counsel/review-desk/items/{id}/transition (prism-counsel-review) |
| `GET` | /prism-counsel/review-desk/low-confidence | `prism_counsel_review_get_prism_counsel_review_desk_low_confidence` | [stub] List/get /prism-counsel/review-desk/low-confidence (prism-counsel-review) |
| `GET` | /prism-counsel/review-desk/metrics | `prism_counsel_review_get_prism_counsel_review_desk_metrics` | [stub] List/get /prism-counsel/review-desk/metrics (prism-counsel-review) |
| `GET` | /prism-counsel/review-desk/my-queue | `prism_counsel_review_get_prism_counsel_review_desk_my_queue` | [stub] List/get /prism-counsel/review-desk/my-queue (prism-counsel-review) |
| `GET` | /prism-counsel/review-desk/my-review | `prism_counsel_review_get_prism_counsel_review_desk_my_review` | [stub] List/get /prism-counsel/review-desk/my-review (prism-counsel-review) |
| `GET` | /prism-counsel/review-desk/needs-attorney | `prism_counsel_review_get_prism_counsel_review_desk_needs_attorney` | [stub] List/get /prism-counsel/review-desk/needs-attorney (prism-counsel-review) |
| `GET` | /prism-counsel/review-desk/needs-partner | `prism_counsel_review_get_prism_counsel_review_desk_needs_partner` | [stub] List/get /prism-counsel/review-desk/needs-partner (prism-counsel-review) |
| `GET` | /prism-counsel/review-desk/overview | `prism_counsel_review_get_prism_counsel_review_desk_overview` | [stub] List/get /prism-counsel/review-desk/overview (prism-counsel-review) |
| `GET` | /prism-counsel/review-desk/ready-to-export | `prism_counsel_review_get_prism_counsel_review_desk_ready_to_export` | [stub] List/get /prism-counsel/review-desk/ready-to-export (prism-counsel-review) |
| `GET` | /prism-counsel/review-desk/team-queue | `prism_counsel_review_get_prism_counsel_review_desk_team_queue` | [stub] List/get /prism-counsel/review-desk/team-queue (prism-counsel-review) |

<a id="prism-counsel-s31"></a>

## prism-counsel-s31

Auto-generated tag for prism-counsel-s31 route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /prism-counsel/s31/admin/overview | `prism_counsel_s31_get_prism_counsel_s31_admin_overview` | [stub] List/get /prism-counsel/s31/admin/overview (prism-counsel-s31) |
| `GET` | /prism-counsel/s31/copilot/sessions | `prism_counsel_s31_get_prism_counsel_s31_copilot_sessions` | [stub] List/get /prism-counsel/s31/copilot/sessions (prism-counsel-s31) |
| `POST` | /prism-counsel/s31/copilot/sessions | `prism_counsel_s31_post_prism_counsel_s31_copilot_sessions` | [stub] Create/invoke /prism-counsel/s31/copilot/sessions (prism-counsel-s31) |
| `GET` | /prism-counsel/s31/copilot/sessions/{sessionId}/history | `prism_counsel_s31_get_prism_counsel_s31_copilot_sessions_sessionId_history` | [stub] List/get /prism-counsel/s31/copilot/sessions/{sessionId}/history (prism-counsel-s31) |
| `POST` | /prism-counsel/s31/copilot/sessions/{sessionId}/message | `prism_counsel_s31_post_prism_counsel_s31_copilot_sessions_sessionId_message` | [stub] Create/invoke /prism-counsel/s31/copilot/sessions/{sessionId}/message (prism-counsel-s31) |
| `GET` | /prism-counsel/s31/copilot/templates | `prism_counsel_s31_get_prism_counsel_s31_copilot_templates` | [stub] List/get /prism-counsel/s31/copilot/templates (prism-counsel-s31) |
| `GET` | /prism-counsel/s31/costs/summary | `prism_counsel_s31_get_prism_counsel_s31_costs_summary` | [stub] List/get /prism-counsel/s31/costs/summary (prism-counsel-s31) |
| `GET` | /prism-counsel/s31/data-products/{matterId} | `prism_counsel_s31_get_prism_counsel_s31_data_products_matterId` | [stub] List/get /prism-counsel/s31/data-products/{matterId} (prism-counsel-s31) |
| `GET` | /prism-counsel/s31/forecast-diff/{matterId} | `prism_counsel_s31_get_prism_counsel_s31_forecast_diff_matterId` | [stub] List/get /prism-counsel/s31/forecast-diff/{matterId} (prism-counsel-s31) |
| `GET` | /prism-counsel/s31/hf-gateway/endpoints | `prism_counsel_s31_get_prism_counsel_s31_hf_gateway_endpoints` | [stub] List/get /prism-counsel/s31/hf-gateway/endpoints (prism-counsel-s31) |
| `POST` | /prism-counsel/s31/hf-gateway/endpoints | `prism_counsel_s31_post_prism_counsel_s31_hf_gateway_endpoints` | [stub] Create/invoke /prism-counsel/s31/hf-gateway/endpoints (prism-counsel-s31) |
| `POST` | /prism-counsel/s31/hf-gateway/execute | `prism_counsel_s31_post_prism_counsel_s31_hf_gateway_execute` | [stub] Create/invoke /prism-counsel/s31/hf-gateway/execute (prism-counsel-s31) |
| `GET` | /prism-counsel/s31/m365/delta-cursors | `prism_counsel_s31_get_prism_counsel_s31_m365_delta_cursors` | [stub] List/get /prism-counsel/s31/m365/delta-cursors (prism-counsel-s31) |
| `GET` | /prism-counsel/s31/m365/subscriptions | `prism_counsel_s31_get_prism_counsel_s31_m365_subscriptions` | [stub] List/get /prism-counsel/s31/m365/subscriptions (prism-counsel-s31) |
| `GET` | /prism-counsel/s31/matter-twin/{matterId} | `prism_counsel_s31_get_prism_counsel_s31_matter_twin_matterId` | [stub] List/get /prism-counsel/s31/matter-twin/{matterId} (prism-counsel-s31) |
| `GET` | /prism-counsel/s31/matter-twin/{matterId}/history | `prism_counsel_s31_get_prism_counsel_s31_matter_twin_matterId_history` | [stub] List/get /prism-counsel/s31/matter-twin/{matterId}/history (prism-counsel-s31) |
| `POST` | /prism-counsel/s31/matter-twin/{matterId}/snapshot | `prism_counsel_s31_post_prism_counsel_s31_matter_twin_matterId_snapshot` | [stub] Create/invoke /prism-counsel/s31/matter-twin/{matterId}/snapshot (prism-counsel-s31) |
| `GET` | /prism-counsel/s31/model-mesh/lanes | `prism_counsel_s31_get_prism_counsel_s31_model_mesh_lanes` | [stub] List/get /prism-counsel/s31/model-mesh/lanes (prism-counsel-s31) |
| `POST` | /prism-counsel/s31/model-mesh/lanes | `prism_counsel_s31_post_prism_counsel_s31_model_mesh_lanes` | [stub] Create/invoke /prism-counsel/s31/model-mesh/lanes (prism-counsel-s31) |
| `POST` | /prism-counsel/s31/model-mesh/route | `prism_counsel_s31_post_prism_counsel_s31_model_mesh_route` | [stub] Create/invoke /prism-counsel/s31/model-mesh/route (prism-counsel-s31) |
| `GET` | /prism-counsel/s31/model-mesh/stats | `prism_counsel_s31_get_prism_counsel_s31_model_mesh_stats` | [stub] List/get /prism-counsel/s31/model-mesh/stats (prism-counsel-s31) |
| `GET` | /prism-counsel/s31/pressure-graph/{matterId} | `prism_counsel_s31_get_prism_counsel_s31_pressure_graph_matterId` | [stub] List/get /prism-counsel/s31/pressure-graph/{matterId} (prism-counsel-s31) |
| `POST` | /prism-counsel/s31/pressure-graph/{matterId}/compute | `prism_counsel_s31_post_prism_counsel_s31_pressure_graph_matterId_compute` | [stub] Create/invoke /prism-counsel/s31/pressure-graph/{matterId}/compute (prism-counsel-s31) |
| `POST` | /prism-counsel/s31/proof-chain/{id}/approve | `prism_counsel_s31_post_prism_counsel_s31_proof_chain_id_approve` | [stub] Create/invoke /prism-counsel/s31/proof-chain/{id}/approve (prism-counsel-s31) |
| `POST` | /prism-counsel/s31/proof-chain/{id}/review | `prism_counsel_s31_post_prism_counsel_s31_proof_chain_id_review` | [stub] Create/invoke /prism-counsel/s31/proof-chain/{id}/review (prism-counsel-s31) |
| `GET` | /prism-counsel/s31/proof-chain/{id}/trace | `prism_counsel_s31_get_prism_counsel_s31_proof_chain_id_trace` | [stub] List/get /prism-counsel/s31/proof-chain/{id}/trace (prism-counsel-s31) |
| `GET` | /prism-counsel/s31/proof-chain/{id}/verify | `prism_counsel_s31_get_prism_counsel_s31_proof_chain_id_verify` | [stub] List/get /prism-counsel/s31/proof-chain/{id}/verify (prism-counsel-s31) |
| `GET` | /prism-counsel/s31/proof-chain/audit-packet/{matterId} | `prism_counsel_s31_get_prism_counsel_s31_proof_chain_audit_packet_matterId` | [stub] List/get /prism-counsel/s31/proof-chain/audit-packet/{matterId} (prism-counsel-s31) |
| `GET` | /prism-counsel/s31/proof-chain/matter/{matterId} | `prism_counsel_s31_get_prism_counsel_s31_proof_chain_matter_matterId` | [stub] List/get /prism-counsel/s31/proof-chain/matter/{matterId} (prism-counsel-s31) |
| `GET` | /prism-counsel/s31/proof-chain/pending-reviews | `prism_counsel_s31_get_prism_counsel_s31_proof_chain_pending_reviews` | [stub] List/get /prism-counsel/s31/proof-chain/pending-reviews (prism-counsel-s31) |
| `GET` | /prism-counsel/s31/worldline/features/{matterId} | `prism_counsel_s31_get_prism_counsel_s31_worldline_features_matterId` | [stub] List/get /prism-counsel/s31/worldline/features/{matterId} (prism-counsel-s31) |
| `POST` | /prism-counsel/s31/worldline/fetch/{sourceId} | `prism_counsel_s31_post_prism_counsel_s31_worldline_fetch_sourceId` | [stub] Create/invoke /prism-counsel/s31/worldline/fetch/{sourceId} (prism-counsel-s31) |
| `POST` | /prism-counsel/s31/worldline/initialize | `prism_counsel_s31_post_prism_counsel_s31_worldline_initialize` | [stub] Create/invoke /prism-counsel/s31/worldline/initialize (prism-counsel-s31) |
| `GET` | /prism-counsel/s31/worldline/signals | `prism_counsel_s31_get_prism_counsel_s31_worldline_signals` | [stub] List/get /prism-counsel/s31/worldline/signals (prism-counsel-s31) |
| `GET` | /prism-counsel/s31/worldline/sources | `prism_counsel_s31_get_prism_counsel_s31_worldline_sources` | [stub] List/get /prism-counsel/s31/worldline/sources (prism-counsel-s31) |

<a id="privacy"></a>

## privacy

Auto-generated tag for privacy route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /privacy/privacy/policy | `privacy_get_privacy_privacy_policy` | [stub] List/get /privacy/privacy/policy (privacy) |
| `GET` | /privacy/privacy/terms | `privacy_get_privacy_privacy_terms` | [stub] List/get /privacy/privacy/terms (privacy) |

<a id="prompt-registry"></a>

## prompt-registry

Auto-generated tag for prompt-registry route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /ai/ai/prompts | `prompt_registry_get_ai_ai_prompts` | [stub] List/get /ai/ai/prompts (prompt-registry) |
| `GET` | /ai/ai/prompts/{id} | `prompt_registry_get_ai_ai_prompts_id` | [stub] List/get /ai/ai/prompts/{id} (prompt-registry) |
| `POST` | /ai/ai/prompts/{id}/promote | `prompt_registry_post_ai_ai_prompts_id_promote` | [stub] Create/invoke /ai/ai/prompts/{id}/promote (prompt-registry) |
| `POST` | /ai/ai/prompts/{id}/versions/{versionId}/eval | `prompt_registry_post_ai_ai_prompts_id_versions_versionId_eval` | [stub] Create/invoke /ai/ai/prompts/{id}/versions/{versionId}/eval (prompt-registry) |

<a id="proof-chain"></a>

## proof-chain

Auto-generated tag for proof-chain route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /proof-chain/proof-chain | `proof_chain_get_proof_chain_proof_chain` | [stub] List/get /proof-chain/proof-chain (proof-chain) |
| `GET` | /proof-chain/proof-chain/{id} | `proof_chain_get_proof_chain_proof_chain_id` | [stub] List/get /proof-chain/proof-chain/{id} (proof-chain) |
| `POST` | /proof-chain/proof-chain/{id}/review | `proof_chain_post_proof_chain_proof_chain_id_review` | [stub] Create/invoke /proof-chain/proof-chain/{id}/review (proof-chain) |
| `GET` | /proof-chain/proof-chain/by-content/{contentType}/{contentId} | `proof_chain_get_proof_chain_proof_chain_by_content_contentType_contentId` | [stub] List/get /proof-chain/proof-chain/by-content/{contentType}/{contentId} (proof-chain) |
| `POST` | /proof-chain/proof-chain/tag | `proof_chain_post_proof_chain_proof_chain_tag` | [stub] Create/invoke /proof-chain/proof-chain/tag (proof-chain) |

<a id="providers"></a>

## providers

Auto-generated tag for providers route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /providers/rmm/devices | `providers_get_providers_rmm_devices` | [stub] List/get /providers/rmm/devices (providers) |
| `GET` | /providers/rmm/health | `providers_get_providers_rmm_health` | [stub] List/get /providers/rmm/health (providers) |
| `GET` | /providers/rmm/providers | `providers_get_providers_rmm_providers` | [stub] List/get /providers/rmm/providers (providers) |
| `POST` | /providers/rmm/providers | `providers_post_providers_rmm_providers` | [stub] Create/invoke /providers/rmm/providers (providers) |
| `GET` | /providers/rmm/providers/{id} | `providers_get_providers_rmm_providers_id` | [stub] List/get /providers/rmm/providers/{id} (providers) |
| `PATCH` | /providers/rmm/providers/{id} | `providers_patch_providers_rmm_providers_id` | [stub] Patch /providers/rmm/providers/{id} (providers) |
| `DELETE` | /providers/rmm/providers/{id} | `providers_delete_providers_rmm_providers_id` | [stub] Delete /providers/rmm/providers/{id} (providers) |
| `POST` | /providers/rmm/providers/{id}/sync | `providers_post_providers_rmm_providers_id_sync` | [stub] Create/invoke /providers/rmm/providers/{id}/sync (providers) |
| `POST` | /providers/rmm/providers/{id}/test | `providers_post_providers_rmm_providers_id_test` | [stub] Create/invoke /providers/rmm/providers/{id}/test (providers) |
| `POST` | /providers/rmm/providers/probe | `providers_post_providers_rmm_providers_probe` | [stub] Create/invoke /providers/rmm/providers/probe (providers) |

<a id="public-status"></a>

## public-status

Auto-generated tag for public-status route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `POST` | /admin/status/incidents | `public_status_post_admin_status_incidents` | [stub] Create/invoke /admin/status/incidents (public-status) |
| `PATCH` | /admin/status/incidents/{id} | `public_status_patch_admin_status_incidents_id` | [stub] Patch /admin/status/incidents/{id} (public-status) |
| `GET` | /admin/status/status | `public_status_get_admin_status_status` | [stub] List/get /admin/status/status (public-status) |
| `POST` | /admin/status/status/subscribe | `public_status_post_admin_status_status_subscribe` | [stub] Create/invoke /admin/status/status/subscribe (public-status) |
| `GET` | /admin/status/uptime-history | `public_status_get_admin_status_uptime_history` | [stub] List/get /admin/status/uptime-history (public-status) |
| `POST` | /alloy/policies/incidents | `public_status_post_alloy_policies_incidents` | [stub] Create/invoke /alloy/policies/incidents (public-status) |
| `PATCH` | /alloy/policies/incidents/{id} | `public_status_patch_alloy_policies_incidents_id` | [stub] Patch /alloy/policies/incidents/{id} (public-status) |
| `GET` | /alloy/policies/status | `public_status_get_alloy_policies_status` | [stub] List/get /alloy/policies/status (public-status) |
| `POST` | /alloy/policies/status/subscribe | `public_status_post_alloy_policies_status_subscribe` | [stub] Create/invoke /alloy/policies/status/subscribe (public-status) |
| `GET` | /alloy/policies/uptime-history | `public_status_get_alloy_policies_uptime_history` | [stub] List/get /alloy/policies/uptime-history (public-status) |

<a id="publishing"></a>

## publishing

Auto-generated tag for publishing route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /publishing/analytics/dashboard | `publishing_get_publishing_analytics_dashboard` | [stub] List/get /publishing/analytics/dashboard (publishing) |
| `POST` | /publishing/analytics/event | `publishing_post_publishing_analytics_event` | [stub] Create/invoke /publishing/analytics/event (publishing) |
| `POST` | /publishing/analytics/pageview | `publishing_post_publishing_analytics_pageview` | [stub] Create/invoke /publishing/analytics/pageview (publishing) |
| `POST` | /publishing/articles/{id}/publish-medium | `publishing_post_publishing_articles_id_publish_medium` | [stub] Create/invoke /publishing/articles/{id}/publish-medium (publishing) |
| `DELETE` | /publishing/campaigns/{id} | `publishing_delete_publishing_campaigns_id` | [stub] Delete /publishing/campaigns/{id} (publishing) |
| `GET` | /publishing/carousels/{id}/export-pdf | `publishing_get_publishing_carousels_id_export_pdf` | [stub] List/get /publishing/carousels/{id}/export-pdf (publishing) |
| `POST` | /publishing/carousels/{id}/publish-linkedin | `publishing_post_publishing_carousels_id_publish_linkedin` | [stub] Create/invoke /publishing/carousels/{id}/publish-linkedin (publishing) |
| `POST` | /publishing/linktree/{id}/click | `publishing_post_publishing_linktree_id_click` | [stub] Create/invoke /publishing/linktree/{id}/click (publishing) |
| `POST` | /publishing/newsletters/{id}/publish-substack | `publishing_post_publishing_newsletters_id_publish_substack` | [stub] Create/invoke /publishing/newsletters/{id}/publish-substack (publishing) |
| `POST` | /publishing/seed | `publishing_post_publishing_seed` | [stub] Create/invoke /publishing/seed (publishing) |
| `POST` | /publishing/x-posts/{id}/publish | `publishing_post_publishing_x_posts_id_publish` | [stub] Create/invoke /publishing/x-posts/{id}/publish (publishing) |

<a id="pulse"></a>

## pulse

Auto-generated tag for pulse route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /briefings/briefings/{id} | `pulse_get_briefings_briefings_id` | [stub] List/get /briefings/briefings/{id} (pulse) |
| `POST` | /briefings/briefings/{id}/save | `pulse_post_briefings_briefings_id_save` | [stub] Create/invoke /briefings/briefings/{id}/save (pulse) |
| `DELETE` | /briefings/briefings/{id}/save | `pulse_delete_briefings_briefings_id_save` | [stub] Delete /briefings/briefings/{id}/save (pulse) |
| `GET` | /briefings/briefings/saved | `pulse_get_briefings_briefings_saved` | [stub] List/get /briefings/briefings/saved (pulse) |
| `GET` | /briefings/briefings/search | `pulse_get_briefings_briefings_search` | [stub] List/get /briefings/briefings/search (pulse) |
| `GET` | /briefings/confidence | `pulse_get_briefings_confidence` | [stub] List/get /briefings/confidence (pulse) |
| `GET` | /briefings/custom | `pulse_get_briefings_custom` | [stub] List/get /briefings/custom (pulse) |
| `POST` | /briefings/custom | `pulse_post_briefings_custom` | [stub] Create/invoke /briefings/custom (pulse) |
| `GET` | /briefings/demo/briefings | `pulse_get_briefings_demo_briefings` | [stub] List/get /briefings/demo/briefings (pulse) |
| `GET` | /briefings/demo/confidence | `pulse_get_briefings_demo_confidence` | [stub] List/get /briefings/demo/confidence (pulse) |
| `GET` | /briefings/demo/dissents | `pulse_get_briefings_demo_dissents` | [stub] List/get /briefings/demo/dissents (pulse) |
| `POST` | /briefings/demo/export/pdf | `pulse_post_briefings_demo_export_pdf` | [stub] Create/invoke /briefings/demo/export/pdf (pulse) |
| `GET` | /briefings/demo/today | `pulse_get_briefings_demo_today` | [stub] List/get /briefings/demo/today (pulse) |
| `POST` | /briefings/demo/verify | `pulse_post_briefings_demo_verify` | [stub] Create/invoke /briefings/demo/verify (pulse) |
| `GET` | /briefings/dissents | `pulse_get_briefings_dissents` | [stub] List/get /briefings/dissents (pulse) |
| `POST` | /briefings/dissents | `pulse_post_briefings_dissents` | [stub] Create/invoke /briefings/dissents (pulse) |
| `PATCH` | /briefings/dissents/{id} | `pulse_patch_briefings_dissents_id` | [stub] Patch /briefings/dissents/{id} (pulse) |
| `GET` | /briefings/domain-panel/{domain} | `pulse_get_briefings_domain_panel_domain` | [stub] List/get /briefings/domain-panel/{domain} (pulse) |
| `POST` | /briefings/export/pdf | `pulse_post_briefings_export_pdf` | [stub] Create/invoke /briefings/export/pdf (pulse) |
| `GET` | /briefings/subscriptions | `pulse_get_briefings_subscriptions` | [stub] List/get /briefings/subscriptions (pulse) |
| `POST` | /briefings/subscriptions | `pulse_post_briefings_subscriptions` | [stub] Create/invoke /briefings/subscriptions (pulse) |
| `PATCH` | /briefings/subscriptions/{id} | `pulse_patch_briefings_subscriptions_id` | [stub] Patch /briefings/subscriptions/{id} (pulse) |
| `DELETE` | /briefings/subscriptions/{id} | `pulse_delete_briefings_subscriptions_id` | [stub] Delete /briefings/subscriptions/{id} (pulse) |
| `GET` | /briefings/today | `pulse_get_briefings_today` | [stub] List/get /briefings/today (pulse) |
| `GET` | /briefings/unsubscribe | `pulse_get_briefings_unsubscribe` | [stub] List/get /briefings/unsubscribe (pulse) |
| `GET` | /confidence/briefings | `pulse_get_confidence_briefings` | [stub] List/get /confidence/briefings (pulse) |
| `GET` | /confidence/briefings/{id} | `pulse_get_confidence_briefings_id` | [stub] List/get /confidence/briefings/{id} (pulse) |
| `POST` | /confidence/briefings/{id}/save | `pulse_post_confidence_briefings_id_save` | [stub] Create/invoke /confidence/briefings/{id}/save (pulse) |
| `DELETE` | /confidence/briefings/{id}/save | `pulse_delete_confidence_briefings_id_save` | [stub] Delete /confidence/briefings/{id}/save (pulse) |
| `POST` | /confidence/briefings/generate | `pulse_post_confidence_briefings_generate` | [stub] Create/invoke /confidence/briefings/generate (pulse) |
| `GET` | /confidence/briefings/saved | `pulse_get_confidence_briefings_saved` | [stub] List/get /confidence/briefings/saved (pulse) |
| `GET` | /confidence/briefings/search | `pulse_get_confidence_briefings_search` | [stub] List/get /confidence/briefings/search (pulse) |
| `GET` | /confidence/confidence | `pulse_get_confidence_confidence` | [stub] List/get /confidence/confidence (pulse) |
| `GET` | /confidence/custom | `pulse_get_confidence_custom` | [stub] List/get /confidence/custom (pulse) |
| `POST` | /confidence/custom | `pulse_post_confidence_custom` | [stub] Create/invoke /confidence/custom (pulse) |
| `GET` | /confidence/demo/briefings | `pulse_get_confidence_demo_briefings` | [stub] List/get /confidence/demo/briefings (pulse) |
| `GET` | /confidence/demo/confidence | `pulse_get_confidence_demo_confidence` | [stub] List/get /confidence/demo/confidence (pulse) |
| `GET` | /confidence/demo/dissents | `pulse_get_confidence_demo_dissents` | [stub] List/get /confidence/demo/dissents (pulse) |
| `POST` | /confidence/demo/export/pdf | `pulse_post_confidence_demo_export_pdf` | [stub] Create/invoke /confidence/demo/export/pdf (pulse) |
| `GET` | /confidence/demo/today | `pulse_get_confidence_demo_today` | [stub] List/get /confidence/demo/today (pulse) |
| `POST` | /confidence/demo/verify | `pulse_post_confidence_demo_verify` | [stub] Create/invoke /confidence/demo/verify (pulse) |
| `GET` | /confidence/dissents | `pulse_get_confidence_dissents` | [stub] List/get /confidence/dissents (pulse) |
| `POST` | /confidence/dissents | `pulse_post_confidence_dissents` | [stub] Create/invoke /confidence/dissents (pulse) |
| `PATCH` | /confidence/dissents/{id} | `pulse_patch_confidence_dissents_id` | [stub] Patch /confidence/dissents/{id} (pulse) |
| `GET` | /confidence/domain-panel/{domain} | `pulse_get_confidence_domain_panel_domain` | [stub] List/get /confidence/domain-panel/{domain} (pulse) |
| `POST` | /confidence/export/pdf | `pulse_post_confidence_export_pdf` | [stub] Create/invoke /confidence/export/pdf (pulse) |
| `GET` | /confidence/subscriptions | `pulse_get_confidence_subscriptions` | [stub] List/get /confidence/subscriptions (pulse) |
| `POST` | /confidence/subscriptions | `pulse_post_confidence_subscriptions` | [stub] Create/invoke /confidence/subscriptions (pulse) |
| `PATCH` | /confidence/subscriptions/{id} | `pulse_patch_confidence_subscriptions_id` | [stub] Patch /confidence/subscriptions/{id} (pulse) |
| `DELETE` | /confidence/subscriptions/{id} | `pulse_delete_confidence_subscriptions_id` | [stub] Delete /confidence/subscriptions/{id} (pulse) |
| `GET` | /confidence/today | `pulse_get_confidence_today` | [stub] List/get /confidence/today (pulse) |
| `GET` | /confidence/unsubscribe | `pulse_get_confidence_unsubscribe` | [stub] List/get /confidence/unsubscribe (pulse) |
| `GET` | /custom/briefings | `pulse_get_custom_briefings` | [stub] List/get /custom/briefings (pulse) |
| `GET` | /custom/briefings/{id} | `pulse_get_custom_briefings_id` | [stub] List/get /custom/briefings/{id} (pulse) |
| `POST` | /custom/briefings/{id}/save | `pulse_post_custom_briefings_id_save` | [stub] Create/invoke /custom/briefings/{id}/save (pulse) |
| `DELETE` | /custom/briefings/{id}/save | `pulse_delete_custom_briefings_id_save` | [stub] Delete /custom/briefings/{id}/save (pulse) |
| `POST` | /custom/briefings/generate | `pulse_post_custom_briefings_generate` | [stub] Create/invoke /custom/briefings/generate (pulse) |
| `GET` | /custom/briefings/saved | `pulse_get_custom_briefings_saved` | [stub] List/get /custom/briefings/saved (pulse) |
| `GET` | /custom/briefings/search | `pulse_get_custom_briefings_search` | [stub] List/get /custom/briefings/search (pulse) |
| `GET` | /custom/confidence | `pulse_get_custom_confidence` | [stub] List/get /custom/confidence (pulse) |
| `GET` | /custom/custom | `pulse_get_custom_custom` | [stub] List/get /custom/custom (pulse) |
| `POST` | /custom/custom | `pulse_post_custom_custom` | [stub] Create/invoke /custom/custom (pulse) |
| `GET` | /custom/demo/briefings | `pulse_get_custom_demo_briefings` | [stub] List/get /custom/demo/briefings (pulse) |
| `GET` | /custom/demo/confidence | `pulse_get_custom_demo_confidence` | [stub] List/get /custom/demo/confidence (pulse) |
| `GET` | /custom/demo/dissents | `pulse_get_custom_demo_dissents` | [stub] List/get /custom/demo/dissents (pulse) |
| `POST` | /custom/demo/export/pdf | `pulse_post_custom_demo_export_pdf` | [stub] Create/invoke /custom/demo/export/pdf (pulse) |
| `GET` | /custom/demo/today | `pulse_get_custom_demo_today` | [stub] List/get /custom/demo/today (pulse) |
| `POST` | /custom/demo/verify | `pulse_post_custom_demo_verify` | [stub] Create/invoke /custom/demo/verify (pulse) |
| `GET` | /custom/dissents | `pulse_get_custom_dissents` | [stub] List/get /custom/dissents (pulse) |
| `POST` | /custom/dissents | `pulse_post_custom_dissents` | [stub] Create/invoke /custom/dissents (pulse) |
| `PATCH` | /custom/dissents/{id} | `pulse_patch_custom_dissents_id` | [stub] Patch /custom/dissents/{id} (pulse) |
| `GET` | /custom/domain-panel/{domain} | `pulse_get_custom_domain_panel_domain` | [stub] List/get /custom/domain-panel/{domain} (pulse) |
| `POST` | /custom/export/pdf | `pulse_post_custom_export_pdf` | [stub] Create/invoke /custom/export/pdf (pulse) |
| `GET` | /custom/subscriptions | `pulse_get_custom_subscriptions` | [stub] List/get /custom/subscriptions (pulse) |
| `POST` | /custom/subscriptions | `pulse_post_custom_subscriptions` | [stub] Create/invoke /custom/subscriptions (pulse) |
| `PATCH` | /custom/subscriptions/{id} | `pulse_patch_custom_subscriptions_id` | [stub] Patch /custom/subscriptions/{id} (pulse) |
| `DELETE` | /custom/subscriptions/{id} | `pulse_delete_custom_subscriptions_id` | [stub] Delete /custom/subscriptions/{id} (pulse) |
| `GET` | /custom/today | `pulse_get_custom_today` | [stub] List/get /custom/today (pulse) |
| `GET` | /custom/unsubscribe | `pulse_get_custom_unsubscribe` | [stub] List/get /custom/unsubscribe (pulse) |
| `GET` | /demo/briefings | `pulse_get_demo_briefings` | [stub] List/get /demo/briefings (pulse) |
| `GET` | /demo/briefings/{id} | `pulse_get_demo_briefings_id` | [stub] List/get /demo/briefings/{id} (pulse) |
| `POST` | /demo/briefings/{id}/save | `pulse_post_demo_briefings_id_save` | [stub] Create/invoke /demo/briefings/{id}/save (pulse) |
| `DELETE` | /demo/briefings/{id}/save | `pulse_delete_demo_briefings_id_save` | [stub] Delete /demo/briefings/{id}/save (pulse) |
| `POST` | /demo/briefings/generate | `pulse_post_demo_briefings_generate` | [stub] Create/invoke /demo/briefings/generate (pulse) |
| `GET` | /demo/briefings/saved | `pulse_get_demo_briefings_saved` | [stub] List/get /demo/briefings/saved (pulse) |
| `GET` | /demo/briefings/search | `pulse_get_demo_briefings_search` | [stub] List/get /demo/briefings/search (pulse) |
| `GET` | /demo/confidence | `pulse_get_demo_confidence` | [stub] List/get /demo/confidence (pulse) |
| `GET` | /demo/custom | `pulse_get_demo_custom` | [stub] List/get /demo/custom (pulse) |
| `POST` | /demo/custom | `pulse_post_demo_custom` | [stub] Create/invoke /demo/custom (pulse) |
| `GET` | /demo/demo/briefings | `pulse_get_demo_demo_briefings` | [stub] List/get /demo/demo/briefings (pulse) |
| `GET` | /demo/demo/confidence | `pulse_get_demo_demo_confidence` | [stub] List/get /demo/demo/confidence (pulse) |
| `GET` | /demo/demo/dissents | `pulse_get_demo_demo_dissents` | [stub] List/get /demo/demo/dissents (pulse) |
| `POST` | /demo/demo/export/pdf | `pulse_post_demo_demo_export_pdf` | [stub] Create/invoke /demo/demo/export/pdf (pulse) |
| `GET` | /demo/demo/today | `pulse_get_demo_demo_today` | [stub] List/get /demo/demo/today (pulse) |
| `POST` | /demo/demo/verify | `pulse_post_demo_demo_verify` | [stub] Create/invoke /demo/demo/verify (pulse) |
| `GET` | /demo/dissents | `pulse_get_demo_dissents` | [stub] List/get /demo/dissents (pulse) |
| `POST` | /demo/dissents | `pulse_post_demo_dissents` | [stub] Create/invoke /demo/dissents (pulse) |
| `PATCH` | /demo/dissents/{id} | `pulse_patch_demo_dissents_id` | [stub] Patch /demo/dissents/{id} (pulse) |
| `GET` | /demo/domain-panel/{domain} | `pulse_get_demo_domain_panel_domain` | [stub] List/get /demo/domain-panel/{domain} (pulse) |
| `POST` | /demo/export/pdf | `pulse_post_demo_export_pdf` | [stub] Create/invoke /demo/export/pdf (pulse) |
| `GET` | /demo/subscriptions | `pulse_get_demo_subscriptions` | [stub] List/get /demo/subscriptions (pulse) |
| `POST` | /demo/subscriptions | `pulse_post_demo_subscriptions` | [stub] Create/invoke /demo/subscriptions (pulse) |
| `PATCH` | /demo/subscriptions/{id} | `pulse_patch_demo_subscriptions_id` | [stub] Patch /demo/subscriptions/{id} (pulse) |
| `DELETE` | /demo/subscriptions/{id} | `pulse_delete_demo_subscriptions_id` | [stub] Delete /demo/subscriptions/{id} (pulse) |
| `GET` | /demo/today | `pulse_get_demo_today` | [stub] List/get /demo/today (pulse) |
| `GET` | /demo/unsubscribe | `pulse_get_demo_unsubscribe` | [stub] List/get /demo/unsubscribe (pulse) |
| `GET` | /dissents/briefings | `pulse_get_dissents_briefings` | [stub] List/get /dissents/briefings (pulse) |
| `GET` | /dissents/briefings/{id} | `pulse_get_dissents_briefings_id` | [stub] List/get /dissents/briefings/{id} (pulse) |
| `POST` | /dissents/briefings/{id}/save | `pulse_post_dissents_briefings_id_save` | [stub] Create/invoke /dissents/briefings/{id}/save (pulse) |
| `DELETE` | /dissents/briefings/{id}/save | `pulse_delete_dissents_briefings_id_save` | [stub] Delete /dissents/briefings/{id}/save (pulse) |
| `POST` | /dissents/briefings/generate | `pulse_post_dissents_briefings_generate` | [stub] Create/invoke /dissents/briefings/generate (pulse) |
| `GET` | /dissents/briefings/saved | `pulse_get_dissents_briefings_saved` | [stub] List/get /dissents/briefings/saved (pulse) |
| `GET` | /dissents/briefings/search | `pulse_get_dissents_briefings_search` | [stub] List/get /dissents/briefings/search (pulse) |
| `GET` | /dissents/confidence | `pulse_get_dissents_confidence` | [stub] List/get /dissents/confidence (pulse) |
| `GET` | /dissents/custom | `pulse_get_dissents_custom` | [stub] List/get /dissents/custom (pulse) |
| `POST` | /dissents/custom | `pulse_post_dissents_custom` | [stub] Create/invoke /dissents/custom (pulse) |
| `GET` | /dissents/demo/briefings | `pulse_get_dissents_demo_briefings` | [stub] List/get /dissents/demo/briefings (pulse) |
| `GET` | /dissents/demo/confidence | `pulse_get_dissents_demo_confidence` | [stub] List/get /dissents/demo/confidence (pulse) |
| `GET` | /dissents/demo/dissents | `pulse_get_dissents_demo_dissents` | [stub] List/get /dissents/demo/dissents (pulse) |
| `POST` | /dissents/demo/export/pdf | `pulse_post_dissents_demo_export_pdf` | [stub] Create/invoke /dissents/demo/export/pdf (pulse) |
| `GET` | /dissents/demo/today | `pulse_get_dissents_demo_today` | [stub] List/get /dissents/demo/today (pulse) |
| `POST` | /dissents/demo/verify | `pulse_post_dissents_demo_verify` | [stub] Create/invoke /dissents/demo/verify (pulse) |
| `GET` | /dissents/dissents | `pulse_get_dissents_dissents` | [stub] List/get /dissents/dissents (pulse) |
| `POST` | /dissents/dissents | `pulse_post_dissents_dissents` | [stub] Create/invoke /dissents/dissents (pulse) |
| `PATCH` | /dissents/dissents/{id} | `pulse_patch_dissents_dissents_id` | [stub] Patch /dissents/dissents/{id} (pulse) |
| `GET` | /dissents/domain-panel/{domain} | `pulse_get_dissents_domain_panel_domain` | [stub] List/get /dissents/domain-panel/{domain} (pulse) |
| `POST` | /dissents/export/pdf | `pulse_post_dissents_export_pdf` | [stub] Create/invoke /dissents/export/pdf (pulse) |
| `GET` | /dissents/subscriptions | `pulse_get_dissents_subscriptions` | [stub] List/get /dissents/subscriptions (pulse) |
| `POST` | /dissents/subscriptions | `pulse_post_dissents_subscriptions` | [stub] Create/invoke /dissents/subscriptions (pulse) |
| `PATCH` | /dissents/subscriptions/{id} | `pulse_patch_dissents_subscriptions_id` | [stub] Patch /dissents/subscriptions/{id} (pulse) |
| `DELETE` | /dissents/subscriptions/{id} | `pulse_delete_dissents_subscriptions_id` | [stub] Delete /dissents/subscriptions/{id} (pulse) |
| `GET` | /dissents/today | `pulse_get_dissents_today` | [stub] List/get /dissents/today (pulse) |
| `GET` | /dissents/unsubscribe | `pulse_get_dissents_unsubscribe` | [stub] List/get /dissents/unsubscribe (pulse) |
| `GET` | /domain-panel/briefings | `pulse_get_domain_panel_briefings` | [stub] List/get /domain-panel/briefings (pulse) |
| `GET` | /domain-panel/briefings/{id} | `pulse_get_domain_panel_briefings_id` | [stub] List/get /domain-panel/briefings/{id} (pulse) |
| `POST` | /domain-panel/briefings/{id}/save | `pulse_post_domain_panel_briefings_id_save` | [stub] Create/invoke /domain-panel/briefings/{id}/save (pulse) |
| `DELETE` | /domain-panel/briefings/{id}/save | `pulse_delete_domain_panel_briefings_id_save` | [stub] Delete /domain-panel/briefings/{id}/save (pulse) |
| `POST` | /domain-panel/briefings/generate | `pulse_post_domain_panel_briefings_generate` | [stub] Create/invoke /domain-panel/briefings/generate (pulse) |
| `GET` | /domain-panel/briefings/saved | `pulse_get_domain_panel_briefings_saved` | [stub] List/get /domain-panel/briefings/saved (pulse) |
| `GET` | /domain-panel/briefings/search | `pulse_get_domain_panel_briefings_search` | [stub] List/get /domain-panel/briefings/search (pulse) |
| `GET` | /domain-panel/confidence | `pulse_get_domain_panel_confidence` | [stub] List/get /domain-panel/confidence (pulse) |
| `GET` | /domain-panel/custom | `pulse_get_domain_panel_custom` | [stub] List/get /domain-panel/custom (pulse) |
| `POST` | /domain-panel/custom | `pulse_post_domain_panel_custom` | [stub] Create/invoke /domain-panel/custom (pulse) |
| `GET` | /domain-panel/demo/briefings | `pulse_get_domain_panel_demo_briefings` | [stub] List/get /domain-panel/demo/briefings (pulse) |
| `GET` | /domain-panel/demo/confidence | `pulse_get_domain_panel_demo_confidence` | [stub] List/get /domain-panel/demo/confidence (pulse) |
| `GET` | /domain-panel/demo/dissents | `pulse_get_domain_panel_demo_dissents` | [stub] List/get /domain-panel/demo/dissents (pulse) |
| `POST` | /domain-panel/demo/export/pdf | `pulse_post_domain_panel_demo_export_pdf` | [stub] Create/invoke /domain-panel/demo/export/pdf (pulse) |
| `GET` | /domain-panel/demo/today | `pulse_get_domain_panel_demo_today` | [stub] List/get /domain-panel/demo/today (pulse) |
| `POST` | /domain-panel/demo/verify | `pulse_post_domain_panel_demo_verify` | [stub] Create/invoke /domain-panel/demo/verify (pulse) |
| `GET` | /domain-panel/dissents | `pulse_get_domain_panel_dissents` | [stub] List/get /domain-panel/dissents (pulse) |
| `POST` | /domain-panel/dissents | `pulse_post_domain_panel_dissents` | [stub] Create/invoke /domain-panel/dissents (pulse) |
| `PATCH` | /domain-panel/dissents/{id} | `pulse_patch_domain_panel_dissents_id` | [stub] Patch /domain-panel/dissents/{id} (pulse) |
| `GET` | /domain-panel/domain-panel/{domain} | `pulse_get_domain_panel_domain_panel_domain` | [stub] List/get /domain-panel/domain-panel/{domain} (pulse) |
| `POST` | /domain-panel/export/pdf | `pulse_post_domain_panel_export_pdf` | [stub] Create/invoke /domain-panel/export/pdf (pulse) |
| `GET` | /domain-panel/subscriptions | `pulse_get_domain_panel_subscriptions` | [stub] List/get /domain-panel/subscriptions (pulse) |
| `POST` | /domain-panel/subscriptions | `pulse_post_domain_panel_subscriptions` | [stub] Create/invoke /domain-panel/subscriptions (pulse) |
| `PATCH` | /domain-panel/subscriptions/{id} | `pulse_patch_domain_panel_subscriptions_id` | [stub] Patch /domain-panel/subscriptions/{id} (pulse) |
| `DELETE` | /domain-panel/subscriptions/{id} | `pulse_delete_domain_panel_subscriptions_id` | [stub] Delete /domain-panel/subscriptions/{id} (pulse) |
| `GET` | /domain-panel/today | `pulse_get_domain_panel_today` | [stub] List/get /domain-panel/today (pulse) |
| `GET` | /domain-panel/unsubscribe | `pulse_get_domain_panel_unsubscribe` | [stub] List/get /domain-panel/unsubscribe (pulse) |
| `GET` | /export/briefings | `pulse_get_export_briefings` | [stub] List/get /export/briefings (pulse) |
| `GET` | /export/briefings/{id} | `pulse_get_export_briefings_id` | [stub] List/get /export/briefings/{id} (pulse) |
| `POST` | /export/briefings/{id}/save | `pulse_post_export_briefings_id_save` | [stub] Create/invoke /export/briefings/{id}/save (pulse) |
| `DELETE` | /export/briefings/{id}/save | `pulse_delete_export_briefings_id_save` | [stub] Delete /export/briefings/{id}/save (pulse) |
| `POST` | /export/briefings/generate | `pulse_post_export_briefings_generate` | [stub] Create/invoke /export/briefings/generate (pulse) |
| `GET` | /export/briefings/saved | `pulse_get_export_briefings_saved` | [stub] List/get /export/briefings/saved (pulse) |
| `GET` | /export/briefings/search | `pulse_get_export_briefings_search` | [stub] List/get /export/briefings/search (pulse) |
| `GET` | /export/confidence | `pulse_get_export_confidence` | [stub] List/get /export/confidence (pulse) |
| `GET` | /export/custom | `pulse_get_export_custom` | [stub] List/get /export/custom (pulse) |
| `POST` | /export/custom | `pulse_post_export_custom` | [stub] Create/invoke /export/custom (pulse) |
| `GET` | /export/demo/briefings | `pulse_get_export_demo_briefings` | [stub] List/get /export/demo/briefings (pulse) |
| `GET` | /export/demo/confidence | `pulse_get_export_demo_confidence` | [stub] List/get /export/demo/confidence (pulse) |
| `GET` | /export/demo/dissents | `pulse_get_export_demo_dissents` | [stub] List/get /export/demo/dissents (pulse) |
| `POST` | /export/demo/export/pdf | `pulse_post_export_demo_export_pdf` | [stub] Create/invoke /export/demo/export/pdf (pulse) |
| `GET` | /export/demo/today | `pulse_get_export_demo_today` | [stub] List/get /export/demo/today (pulse) |
| `POST` | /export/demo/verify | `pulse_post_export_demo_verify` | [stub] Create/invoke /export/demo/verify (pulse) |
| `GET` | /export/dissents | `pulse_get_export_dissents` | [stub] List/get /export/dissents (pulse) |
| `POST` | /export/dissents | `pulse_post_export_dissents` | [stub] Create/invoke /export/dissents (pulse) |
| `PATCH` | /export/dissents/{id} | `pulse_patch_export_dissents_id` | [stub] Patch /export/dissents/{id} (pulse) |
| `GET` | /export/domain-panel/{domain} | `pulse_get_export_domain_panel_domain` | [stub] List/get /export/domain-panel/{domain} (pulse) |
| `POST` | /export/export/pdf | `pulse_post_export_export_pdf` | [stub] Create/invoke /export/export/pdf (pulse) |
| `GET` | /export/subscriptions | `pulse_get_export_subscriptions` | [stub] List/get /export/subscriptions (pulse) |
| `POST` | /export/subscriptions | `pulse_post_export_subscriptions` | [stub] Create/invoke /export/subscriptions (pulse) |
| `PATCH` | /export/subscriptions/{id} | `pulse_patch_export_subscriptions_id` | [stub] Patch /export/subscriptions/{id} (pulse) |
| `DELETE` | /export/subscriptions/{id} | `pulse_delete_export_subscriptions_id` | [stub] Delete /export/subscriptions/{id} (pulse) |
| `GET` | /export/today | `pulse_get_export_today` | [stub] List/get /export/today (pulse) |
| `GET` | /export/unsubscribe | `pulse_get_export_unsubscribe` | [stub] List/get /export/unsubscribe (pulse) |
| `GET` | /pulse/briefings | `pulse_get_pulse_briefings` | [stub] List/get /pulse/briefings (pulse) |
| `GET` | /pulse/briefings/{id} | `pulse_get_pulse_briefings_id` | [stub] List/get /pulse/briefings/{id} (pulse) |
| `POST` | /pulse/briefings/{id}/save | `pulse_post_pulse_briefings_id_save` | [stub] Create/invoke /pulse/briefings/{id}/save (pulse) |
| `DELETE` | /pulse/briefings/{id}/save | `pulse_delete_pulse_briefings_id_save` | [stub] Delete /pulse/briefings/{id}/save (pulse) |
| `POST` | /pulse/briefings/generate | `pulse_post_pulse_briefings_generate` | [stub] Create/invoke /pulse/briefings/generate (pulse) |
| `GET` | /pulse/briefings/saved | `pulse_get_pulse_briefings_saved` | [stub] List/get /pulse/briefings/saved (pulse) |
| `GET` | /pulse/briefings/search | `pulse_get_pulse_briefings_search` | [stub] List/get /pulse/briefings/search (pulse) |
| `GET` | /pulse/confidence | `pulse_get_pulse_confidence` | [stub] List/get /pulse/confidence (pulse) |
| `GET` | /pulse/custom | `pulse_get_pulse_custom` | [stub] List/get /pulse/custom (pulse) |
| `POST` | /pulse/custom | `pulse_post_pulse_custom` | [stub] Create/invoke /pulse/custom (pulse) |
| `GET` | /pulse/demo/briefings | `pulse_get_pulse_demo_briefings` | [stub] List/get /pulse/demo/briefings (pulse) |
| `GET` | /pulse/demo/confidence | `pulse_get_pulse_demo_confidence` | [stub] List/get /pulse/demo/confidence (pulse) |
| `GET` | /pulse/demo/dissents | `pulse_get_pulse_demo_dissents` | [stub] List/get /pulse/demo/dissents (pulse) |
| `POST` | /pulse/demo/export/pdf | `pulse_post_pulse_demo_export_pdf` | [stub] Create/invoke /pulse/demo/export/pdf (pulse) |
| `GET` | /pulse/demo/today | `pulse_get_pulse_demo_today` | [stub] List/get /pulse/demo/today (pulse) |
| `POST` | /pulse/demo/verify | `pulse_post_pulse_demo_verify` | [stub] Create/invoke /pulse/demo/verify (pulse) |
| `GET` | /pulse/dissents | `pulse_get_pulse_dissents` | [stub] List/get /pulse/dissents (pulse) |
| `POST` | /pulse/dissents | `pulse_post_pulse_dissents` | [stub] Create/invoke /pulse/dissents (pulse) |
| `PATCH` | /pulse/dissents/{id} | `pulse_patch_pulse_dissents_id` | [stub] Patch /pulse/dissents/{id} (pulse) |
| `GET` | /pulse/domain-panel/{domain} | `pulse_get_pulse_domain_panel_domain` | [stub] List/get /pulse/domain-panel/{domain} (pulse) |
| `POST` | /pulse/export/pdf | `pulse_post_pulse_export_pdf` | [stub] Create/invoke /pulse/export/pdf (pulse) |
| `GET` | /pulse/subscriptions | `pulse_get_pulse_subscriptions` | [stub] List/get /pulse/subscriptions (pulse) |
| `POST` | /pulse/subscriptions | `pulse_post_pulse_subscriptions` | [stub] Create/invoke /pulse/subscriptions (pulse) |
| `PATCH` | /pulse/subscriptions/{id} | `pulse_patch_pulse_subscriptions_id` | [stub] Patch /pulse/subscriptions/{id} (pulse) |
| `DELETE` | /pulse/subscriptions/{id} | `pulse_delete_pulse_subscriptions_id` | [stub] Delete /pulse/subscriptions/{id} (pulse) |
| `GET` | /pulse/today | `pulse_get_pulse_today` | [stub] List/get /pulse/today (pulse) |
| `GET` | /pulse/unsubscribe | `pulse_get_pulse_unsubscribe` | [stub] List/get /pulse/unsubscribe (pulse) |
| `GET` | /subscriptions/briefings | `pulse_get_subscriptions_briefings` | [stub] List/get /subscriptions/briefings (pulse) |
| `GET` | /subscriptions/briefings/{id} | `pulse_get_subscriptions_briefings_id` | [stub] List/get /subscriptions/briefings/{id} (pulse) |
| `POST` | /subscriptions/briefings/{id}/save | `pulse_post_subscriptions_briefings_id_save` | [stub] Create/invoke /subscriptions/briefings/{id}/save (pulse) |
| `DELETE` | /subscriptions/briefings/{id}/save | `pulse_delete_subscriptions_briefings_id_save` | [stub] Delete /subscriptions/briefings/{id}/save (pulse) |
| `POST` | /subscriptions/briefings/generate | `pulse_post_subscriptions_briefings_generate` | [stub] Create/invoke /subscriptions/briefings/generate (pulse) |
| `GET` | /subscriptions/briefings/saved | `pulse_get_subscriptions_briefings_saved` | [stub] List/get /subscriptions/briefings/saved (pulse) |
| `GET` | /subscriptions/briefings/search | `pulse_get_subscriptions_briefings_search` | [stub] List/get /subscriptions/briefings/search (pulse) |
| `GET` | /subscriptions/confidence | `pulse_get_subscriptions_confidence` | [stub] List/get /subscriptions/confidence (pulse) |
| `GET` | /subscriptions/custom | `pulse_get_subscriptions_custom` | [stub] List/get /subscriptions/custom (pulse) |
| `POST` | /subscriptions/custom | `pulse_post_subscriptions_custom` | [stub] Create/invoke /subscriptions/custom (pulse) |
| `GET` | /subscriptions/demo/briefings | `pulse_get_subscriptions_demo_briefings` | [stub] List/get /subscriptions/demo/briefings (pulse) |
| `GET` | /subscriptions/demo/confidence | `pulse_get_subscriptions_demo_confidence` | [stub] List/get /subscriptions/demo/confidence (pulse) |
| `GET` | /subscriptions/demo/dissents | `pulse_get_subscriptions_demo_dissents` | [stub] List/get /subscriptions/demo/dissents (pulse) |
| `POST` | /subscriptions/demo/export/pdf | `pulse_post_subscriptions_demo_export_pdf` | [stub] Create/invoke /subscriptions/demo/export/pdf (pulse) |
| `GET` | /subscriptions/demo/today | `pulse_get_subscriptions_demo_today` | [stub] List/get /subscriptions/demo/today (pulse) |
| `POST` | /subscriptions/demo/verify | `pulse_post_subscriptions_demo_verify` | [stub] Create/invoke /subscriptions/demo/verify (pulse) |
| `GET` | /subscriptions/dissents | `pulse_get_subscriptions_dissents` | [stub] List/get /subscriptions/dissents (pulse) |
| `POST` | /subscriptions/dissents | `pulse_post_subscriptions_dissents` | [stub] Create/invoke /subscriptions/dissents (pulse) |
| `PATCH` | /subscriptions/dissents/{id} | `pulse_patch_subscriptions_dissents_id` | [stub] Patch /subscriptions/dissents/{id} (pulse) |
| `GET` | /subscriptions/domain-panel/{domain} | `pulse_get_subscriptions_domain_panel_domain` | [stub] List/get /subscriptions/domain-panel/{domain} (pulse) |
| `POST` | /subscriptions/export/pdf | `pulse_post_subscriptions_export_pdf` | [stub] Create/invoke /subscriptions/export/pdf (pulse) |
| `GET` | /subscriptions/subscriptions | `pulse_get_subscriptions_subscriptions` | [stub] List/get /subscriptions/subscriptions (pulse) |
| `POST` | /subscriptions/subscriptions | `pulse_post_subscriptions_subscriptions` | [stub] Create/invoke /subscriptions/subscriptions (pulse) |
| `PATCH` | /subscriptions/subscriptions/{id} | `pulse_patch_subscriptions_subscriptions_id` | [stub] Patch /subscriptions/subscriptions/{id} (pulse) |
| `DELETE` | /subscriptions/subscriptions/{id} | `pulse_delete_subscriptions_subscriptions_id` | [stub] Delete /subscriptions/subscriptions/{id} (pulse) |
| `GET` | /subscriptions/today | `pulse_get_subscriptions_today` | [stub] List/get /subscriptions/today (pulse) |
| `GET` | /subscriptions/unsubscribe | `pulse_get_subscriptions_unsubscribe` | [stub] List/get /subscriptions/unsubscribe (pulse) |
| `GET` | /today/briefings | `pulse_get_today_briefings` | [stub] List/get /today/briefings (pulse) |
| `GET` | /today/briefings/{id} | `pulse_get_today_briefings_id` | [stub] List/get /today/briefings/{id} (pulse) |
| `POST` | /today/briefings/{id}/save | `pulse_post_today_briefings_id_save` | [stub] Create/invoke /today/briefings/{id}/save (pulse) |
| `DELETE` | /today/briefings/{id}/save | `pulse_delete_today_briefings_id_save` | [stub] Delete /today/briefings/{id}/save (pulse) |
| `POST` | /today/briefings/generate | `pulse_post_today_briefings_generate` | [stub] Create/invoke /today/briefings/generate (pulse) |
| `GET` | /today/briefings/saved | `pulse_get_today_briefings_saved` | [stub] List/get /today/briefings/saved (pulse) |
| `GET` | /today/briefings/search | `pulse_get_today_briefings_search` | [stub] List/get /today/briefings/search (pulse) |
| `GET` | /today/confidence | `pulse_get_today_confidence` | [stub] List/get /today/confidence (pulse) |
| `GET` | /today/custom | `pulse_get_today_custom` | [stub] List/get /today/custom (pulse) |
| `POST` | /today/custom | `pulse_post_today_custom` | [stub] Create/invoke /today/custom (pulse) |
| `GET` | /today/demo/briefings | `pulse_get_today_demo_briefings` | [stub] List/get /today/demo/briefings (pulse) |
| `GET` | /today/demo/confidence | `pulse_get_today_demo_confidence` | [stub] List/get /today/demo/confidence (pulse) |
| `GET` | /today/demo/dissents | `pulse_get_today_demo_dissents` | [stub] List/get /today/demo/dissents (pulse) |
| `POST` | /today/demo/export/pdf | `pulse_post_today_demo_export_pdf` | [stub] Create/invoke /today/demo/export/pdf (pulse) |
| `GET` | /today/demo/today | `pulse_get_today_demo_today` | [stub] List/get /today/demo/today (pulse) |
| `POST` | /today/demo/verify | `pulse_post_today_demo_verify` | [stub] Create/invoke /today/demo/verify (pulse) |
| `GET` | /today/dissents | `pulse_get_today_dissents` | [stub] List/get /today/dissents (pulse) |
| `POST` | /today/dissents | `pulse_post_today_dissents` | [stub] Create/invoke /today/dissents (pulse) |
| `PATCH` | /today/dissents/{id} | `pulse_patch_today_dissents_id` | [stub] Patch /today/dissents/{id} (pulse) |
| `GET` | /today/domain-panel/{domain} | `pulse_get_today_domain_panel_domain` | [stub] List/get /today/domain-panel/{domain} (pulse) |
| `POST` | /today/export/pdf | `pulse_post_today_export_pdf` | [stub] Create/invoke /today/export/pdf (pulse) |
| `GET` | /today/subscriptions | `pulse_get_today_subscriptions` | [stub] List/get /today/subscriptions (pulse) |
| `POST` | /today/subscriptions | `pulse_post_today_subscriptions` | [stub] Create/invoke /today/subscriptions (pulse) |
| `PATCH` | /today/subscriptions/{id} | `pulse_patch_today_subscriptions_id` | [stub] Patch /today/subscriptions/{id} (pulse) |
| `DELETE` | /today/subscriptions/{id} | `pulse_delete_today_subscriptions_id` | [stub] Delete /today/subscriptions/{id} (pulse) |
| `GET` | /today/today | `pulse_get_today_today` | [stub] List/get /today/today (pulse) |
| `GET` | /today/unsubscribe | `pulse_get_today_unsubscribe` | [stub] List/get /today/unsubscribe (pulse) |
| `GET` | /unsubscribe/briefings | `pulse_get_unsubscribe_briefings` | [stub] List/get /unsubscribe/briefings (pulse) |
| `GET` | /unsubscribe/briefings/{id} | `pulse_get_unsubscribe_briefings_id` | [stub] List/get /unsubscribe/briefings/{id} (pulse) |
| `POST` | /unsubscribe/briefings/{id}/save | `pulse_post_unsubscribe_briefings_id_save` | [stub] Create/invoke /unsubscribe/briefings/{id}/save (pulse) |
| `DELETE` | /unsubscribe/briefings/{id}/save | `pulse_delete_unsubscribe_briefings_id_save` | [stub] Delete /unsubscribe/briefings/{id}/save (pulse) |
| `POST` | /unsubscribe/briefings/generate | `pulse_post_unsubscribe_briefings_generate` | [stub] Create/invoke /unsubscribe/briefings/generate (pulse) |
| `GET` | /unsubscribe/briefings/saved | `pulse_get_unsubscribe_briefings_saved` | [stub] List/get /unsubscribe/briefings/saved (pulse) |
| `GET` | /unsubscribe/briefings/search | `pulse_get_unsubscribe_briefings_search` | [stub] List/get /unsubscribe/briefings/search (pulse) |
| `GET` | /unsubscribe/confidence | `pulse_get_unsubscribe_confidence` | [stub] List/get /unsubscribe/confidence (pulse) |
| `GET` | /unsubscribe/custom | `pulse_get_unsubscribe_custom` | [stub] List/get /unsubscribe/custom (pulse) |
| `POST` | /unsubscribe/custom | `pulse_post_unsubscribe_custom` | [stub] Create/invoke /unsubscribe/custom (pulse) |
| `GET` | /unsubscribe/demo/briefings | `pulse_get_unsubscribe_demo_briefings` | [stub] List/get /unsubscribe/demo/briefings (pulse) |
| `GET` | /unsubscribe/demo/confidence | `pulse_get_unsubscribe_demo_confidence` | [stub] List/get /unsubscribe/demo/confidence (pulse) |
| `GET` | /unsubscribe/demo/dissents | `pulse_get_unsubscribe_demo_dissents` | [stub] List/get /unsubscribe/demo/dissents (pulse) |
| `POST` | /unsubscribe/demo/export/pdf | `pulse_post_unsubscribe_demo_export_pdf` | [stub] Create/invoke /unsubscribe/demo/export/pdf (pulse) |
| `GET` | /unsubscribe/demo/today | `pulse_get_unsubscribe_demo_today` | [stub] List/get /unsubscribe/demo/today (pulse) |
| `POST` | /unsubscribe/demo/verify | `pulse_post_unsubscribe_demo_verify` | [stub] Create/invoke /unsubscribe/demo/verify (pulse) |
| `GET` | /unsubscribe/dissents | `pulse_get_unsubscribe_dissents` | [stub] List/get /unsubscribe/dissents (pulse) |
| `POST` | /unsubscribe/dissents | `pulse_post_unsubscribe_dissents` | [stub] Create/invoke /unsubscribe/dissents (pulse) |
| `PATCH` | /unsubscribe/dissents/{id} | `pulse_patch_unsubscribe_dissents_id` | [stub] Patch /unsubscribe/dissents/{id} (pulse) |
| `GET` | /unsubscribe/domain-panel/{domain} | `pulse_get_unsubscribe_domain_panel_domain` | [stub] List/get /unsubscribe/domain-panel/{domain} (pulse) |
| `POST` | /unsubscribe/export/pdf | `pulse_post_unsubscribe_export_pdf` | [stub] Create/invoke /unsubscribe/export/pdf (pulse) |
| `GET` | /unsubscribe/subscriptions | `pulse_get_unsubscribe_subscriptions` | [stub] List/get /unsubscribe/subscriptions (pulse) |
| `POST` | /unsubscribe/subscriptions | `pulse_post_unsubscribe_subscriptions` | [stub] Create/invoke /unsubscribe/subscriptions (pulse) |
| `PATCH` | /unsubscribe/subscriptions/{id} | `pulse_patch_unsubscribe_subscriptions_id` | [stub] Patch /unsubscribe/subscriptions/{id} (pulse) |
| `DELETE` | /unsubscribe/subscriptions/{id} | `pulse_delete_unsubscribe_subscriptions_id` | [stub] Delete /unsubscribe/subscriptions/{id} (pulse) |
| `GET` | /unsubscribe/today | `pulse_get_unsubscribe_today` | [stub] List/get /unsubscribe/today (pulse) |
| `GET` | /unsubscribe/unsubscribe | `pulse_get_unsubscribe_unsubscribe` | [stub] List/get /unsubscribe/unsubscribe (pulse) |

<a id="pulse-evals"></a>

## pulse-evals

Auto-generated tag for pulse-evals route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `POST` | /pulse-evals/pulse-evals/baseline | `pulse_evals_post_pulse_evals_pulse_evals_baseline` | [stub] Create/invoke /pulse-evals/pulse-evals/baseline (pulse-evals) |
| `POST` | /pulse-evals/pulse-evals/check-regression | `pulse_evals_post_pulse_evals_pulse_evals_check_regression` | [stub] Create/invoke /pulse-evals/pulse-evals/check-regression (pulse-evals) |
| `POST` | /pulse-evals/pulse-evals/compare | `pulse_evals_post_pulse_evals_pulse_evals_compare` | [stub] Create/invoke /pulse-evals/pulse-evals/compare (pulse-evals) |
| `GET` | /pulse-evals/pulse-evals/datasets | `pulse_evals_get_pulse_evals_pulse_evals_datasets` | [stub] List/get /pulse-evals/pulse-evals/datasets (pulse-evals) |
| `GET` | /pulse-evals/pulse-evals/datasets/{domain} | `pulse_evals_get_pulse_evals_pulse_evals_datasets_domain` | [stub] List/get /pulse-evals/pulse-evals/datasets/{domain} (pulse-evals) |
| `GET` | /pulse-evals/pulse-evals/regression-dashboard | `pulse_evals_get_pulse_evals_pulse_evals_regression_dashboard` | [stub] List/get /pulse-evals/pulse-evals/regression-dashboard (pulse-evals) |
| `POST` | /pulse-evals/pulse-evals/run | `pulse_evals_post_pulse_evals_pulse_evals_run` | [stub] Create/invoke /pulse-evals/pulse-evals/run (pulse-evals) |
| `POST` | /pulse-evals/pulse-evals/run-red-team | `pulse_evals_post_pulse_evals_pulse_evals_run_red_team` | [stub] Create/invoke /pulse-evals/pulse-evals/run-red-team (pulse-evals) |

<a id="push-analytics"></a>

## push-analytics

Auto-generated tag for push-analytics route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /push-analytics/push-analytics | `push_analytics_get_push_analytics_push_analytics` | [stub] List/get /push-analytics/push-analytics (push-analytics) |

<a id="push-history"></a>

## push-history

Auto-generated tag for push-history route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /push-history/push-history | `push_history_get_push_history_push_history` | [stub] List/get /push-history/push-history (push-history) |
| `GET` | /push-history/push-history/me | `push_history_get_push_history_push_history_me` | [stub] List/get /push-history/push-history/me (push-history) |

<a id="push-notifications"></a>

## push-notifications

Auto-generated tag for push-notifications route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `POST` | /push-notifications/push-notifications/schedule | `push_notifications_post_push_notifications_push_notifications_schedule` | [stub] Create/invoke /push-notifications/push-notifications/schedule (push-notifications) |
| `GET` | /push-notifications/push-notifications/scheduled | `push_notifications_get_push_notifications_push_notifications_scheduled` | [stub] List/get /push-notifications/push-notifications/scheduled (push-notifications) |
| `DELETE` | /push-notifications/push-notifications/scheduled/{id} | `push_notifications_delete_push_notifications_push_notifications_scheduled_id` | [stub] Delete /push-notifications/push-notifications/scheduled/{id} (push-notifications) |
| `POST` | /push-notifications/push-notifications/send | `push_notifications_post_push_notifications_push_notifications_send` | [stub] Create/invoke /push-notifications/push-notifications/send (push-notifications) |
| `GET` | /push-notifications/push-notifications/templates | `push_notifications_get_push_notifications_push_notifications_templates` | [stub] List/get /push-notifications/push-notifications/templates (push-notifications) |

<a id="push-preferences"></a>

## push-preferences

Auto-generated tag for push-preferences route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /push-preferences/push-preferences | `push_preferences_get_push_preferences_push_preferences` | [stub] List/get /push-preferences/push-preferences (push-preferences) |
| `GET` | /push-preferences/push-preferences/{appId} | `push_preferences_get_push_preferences_push_preferences_appId` | [stub] List/get /push-preferences/push-preferences/{appId} (push-preferences) |
| `DELETE` | /push-preferences/push-preferences/{appId} | `push_preferences_delete_push_preferences_push_preferences_appId` | [stub] Delete /push-preferences/push-preferences/{appId} (push-preferences) |
| `PUT` | /push-preferences/push-preferences/{appId}/{category} | `push_preferences_put_push_preferences_push_preferences_appId_category` | [stub] Update /push-preferences/push-preferences/{appId}/{category} (push-preferences) |
| `GET` | /push-preferences/push-preferences/categories/{appId} | `push_preferences_get_push_preferences_push_preferences_categories_appId` | [stub] List/get /push-preferences/push-preferences/categories/{appId} (push-preferences) |

<a id="push-tokens"></a>

## push-tokens

Auto-generated tag for push-tokens route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `POST` | /push-tokens/push-tokens | `push_tokens_post_push_tokens_push_tokens` | [stub] Create/invoke /push-tokens/push-tokens (push-tokens) |
| `DELETE` | /push-tokens/push-tokens/{token} | `push_tokens_delete_push_tokens_push_tokens_token` | [stub] Delete /push-tokens/push-tokens/{token} (push-tokens) |
| `GET` | /push-tokens/push-tokens/me | `push_tokens_get_push_tokens_push_tokens_me` | [stub] List/get /push-tokens/push-tokens/me (push-tokens) |

<a id="rate-cards"></a>

## rate-cards

Auto-generated tag for rate-cards route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /rate-cards/metering/dashboard/{orgId} | `rate_cards_get_rate_cards_metering_dashboard_orgId` | [stub] List/get /rate-cards/metering/dashboard/{orgId} (rate-cards) |
| `GET` | /rate-cards/metering/rate-cards | `rate_cards_get_rate_cards_metering_rate_cards` | [stub] List/get /rate-cards/metering/rate-cards (rate-cards) |
| `POST` | /rate-cards/metering/rate-cards | `rate_cards_post_rate_cards_metering_rate_cards` | [stub] Create/invoke /rate-cards/metering/rate-cards (rate-cards) |
| `GET` | /rate-cards/metering/rate-cards/{id} | `rate_cards_get_rate_cards_metering_rate_cards_id` | [stub] List/get /rate-cards/metering/rate-cards/{id} (rate-cards) |
| `PUT` | /rate-cards/metering/rate-cards/{id} | `rate_cards_put_rate_cards_metering_rate_cards_id` | [stub] Update /rate-cards/metering/rate-cards/{id} (rate-cards) |
| `POST` | /rate-cards/metering/rate-cards/{id}/assign | `rate_cards_post_rate_cards_metering_rate_cards_id_assign` | [stub] Create/invoke /rate-cards/metering/rate-cards/{id}/assign (rate-cards) |
| `GET` | /rate-cards/metering/rate-cards/assignments/{orgId} | `rate_cards_get_rate_cards_metering_rate_cards_assignments_orgId` | [stub] List/get /rate-cards/metering/rate-cards/assignments/{orgId} (rate-cards) |
| `GET` | /rate-cards/metering/usage | `rate_cards_get_rate_cards_metering_usage` | [stub] List/get /rate-cards/metering/usage (rate-cards) |
| `GET` | /rate-cards/metering/usage/{orgId} | `rate_cards_get_rate_cards_metering_usage_orgId` | [stub] List/get /rate-cards/metering/usage/{orgId} (rate-cards) |

<a id="realtime"></a>

## realtime

Auto-generated tag for realtime route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /realtime/realtime/health | `realtime_get_realtime_realtime_health` | [stub] List/get /realtime/realtime/health (realtime) |
| `GET` | /realtime/realtime/history/{channel} | `realtime_get_realtime_realtime_history_channel` | [stub] List/get /realtime/realtime/history/{channel} (realtime) |
| `GET` | /realtime/realtime/presence/{channel} | `realtime_get_realtime_realtime_presence_channel` | [stub] List/get /realtime/realtime/presence/{channel} (realtime) |
| `GET` | /realtime/realtime/sse | `realtime_get_realtime_realtime_sse` | [stub] List/get /realtime/realtime/sse (realtime) |

<a id="receipt-graph"></a>

## receipt-graph

Auto-generated tag for receipt-graph route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /receipt-graph/receipt-graph/audit/{receiptId} | `receipt_graph_get_receipt_graph_receipt_graph_audit_receiptId` | [stub] List/get /receipt-graph/receipt-graph/audit/{receiptId} (receipt-graph) |
| `GET` | /receipt-graph/receipt-graph/by-content/{contentType}/{contentId} | `receipt_graph_get_receipt_graph_receipt_graph_by_content_contentType_contentId` | [stub] List/get /receipt-graph/receipt-graph/by-content/{contentType}/{contentId} (receipt-graph) |
| `GET` | /receipt-graph/receipt-graph/executive-summary | `receipt_graph_get_receipt_graph_receipt_graph_executive_summary` | [stub] List/get /receipt-graph/receipt-graph/executive-summary (receipt-graph) |
| `GET` | /receipt-graph/receipt-graph/graph/{receiptId} | `receipt_graph_get_receipt_graph_receipt_graph_graph_receiptId` | [stub] List/get /receipt-graph/receipt-graph/graph/{receiptId} (receipt-graph) |
| `POST` | /receipt-graph/receipt-graph/link | `receipt_graph_post_receipt_graph_receipt_graph_link` | [stub] Create/invoke /receipt-graph/receipt-graph/link (receipt-graph) |
| `GET` | /receipt-graph/receipt-graph/receipts | `receipt_graph_get_receipt_graph_receipt_graph_receipts` | [stub] List/get /receipt-graph/receipt-graph/receipts (receipt-graph) |
| `POST` | /receipt-graph/receipt-graph/receipts | `receipt_graph_post_receipt_graph_receipt_graph_receipts` | [stub] Create/invoke /receipt-graph/receipt-graph/receipts (receipt-graph) |
| `GET` | /receipt-graph/receipt-graph/receipts/{receiptId} | `receipt_graph_get_receipt_graph_receipt_graph_receipts_receiptId` | [stub] List/get /receipt-graph/receipt-graph/receipts/{receiptId} (receipt-graph) |
| `POST` | /receipt-graph/receipt-graph/receipts/{receiptId}/approve | `receipt_graph_post_receipt_graph_receipt_graph_receipts_receiptId_approve` | [stub] Create/invoke /receipt-graph/receipt-graph/receipts/{receiptId}/approve (receipt-graph) |
| `POST` | /receipt-graph/receipt-graph/receipts/{receiptId}/delta | `receipt_graph_post_receipt_graph_receipt_graph_receipts_receiptId_delta` | [stub] Create/invoke /receipt-graph/receipt-graph/receipts/{receiptId}/delta (receipt-graph) |
| `POST` | /receipt-graph/receipt-graph/receipts/{receiptId}/reject | `receipt_graph_post_receipt_graph_receipt_graph_receipts_receiptId_reject` | [stub] Create/invoke /receipt-graph/receipt-graph/receipts/{receiptId}/reject (receipt-graph) |
| `POST` | /receipt-graph/receipt-graph/receipts/{receiptId}/retract | `receipt_graph_post_receipt_graph_receipt_graph_receipts_receiptId_retract` | [stub] Create/invoke /receipt-graph/receipt-graph/receipts/{receiptId}/retract (receipt-graph) |

<a id="reflections"></a>

## reflections

Auto-generated tag for reflections route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /reflections/reflections | `reflections_get_reflections_reflections` | [stub] List/get /reflections/reflections (reflections) |
| `POST` | /reflections/reflections | `reflections_post_reflections_reflections` | [stub] Create/invoke /reflections/reflections (reflections) |
| `GET` | /reflections/reflections/{id} | `reflections_get_reflections_reflections_id` | [stub] List/get /reflections/reflections/{id} (reflections) |
| `POST` | /reflections/reflections/{id}/skills/{skillName}/adopt | `reflections_post_reflections_reflections_id_skills_skillName_adopt` | [stub] Create/invoke /reflections/reflections/{id}/skills/{skillName}/adopt (reflections) |
| `POST` | /reflections/reflections/{id}/skills/{skillName}/reject | `reflections_post_reflections_reflections_id_skills_skillName_reject` | [stub] Create/invoke /reflections/reflections/{id}/skills/{skillName}/reject (reflections) |
| `POST` | /reflections/reflections/{id}/strategy/{index}/apply | `reflections_post_reflections_reflections_id_strategy_index_apply` | [stub] Create/invoke /reflections/reflections/{id}/strategy/{index}/apply (reflections) |
| `POST` | /reflections/reflections/{id}/strategy/{index}/defer | `reflections_post_reflections_reflections_id_strategy_index_defer` | [stub] Create/invoke /reflections/reflections/{id}/strategy/{index}/defer (reflections) |
| `GET` | /reflections/reflections/by-trace/{traceId} | `reflections_get_reflections_reflections_by_trace_traceId` | [stub] List/get /reflections/reflections/by-trace/{traceId} (reflections) |

<a id="replay"></a>

## replay

Auto-generated tag for replay route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `POST` | /replay/replay/run | `replay_post_replay_replay_run` | [stub] Create/invoke /replay/replay/run (replay) |
| `GET` | /replay/replay/runs | `replay_get_replay_replay_runs` | [stub] List/get /replay/replay/runs (replay) |
| `GET` | /replay/replay/scenarios | `replay_get_replay_replay_scenarios` | [stub] List/get /replay/replay/scenarios (replay) |
| `POST` | /replay/replay/scenarios | `replay_post_replay_replay_scenarios` | [stub] Create/invoke /replay/replay/scenarios (replay) |
| `GET` | /replay/replay/scenarios/{scenarioId} | `replay_get_replay_replay_scenarios_scenarioId` | [stub] List/get /replay/replay/scenarios/{scenarioId} (replay) |
| `GET` | /replay/replay/snapshots | `replay_get_replay_replay_snapshots` | [stub] List/get /replay/replay/snapshots (replay) |
| `POST` | /replay/replay/snapshots | `replay_post_replay_replay_snapshots` | [stub] Create/invoke /replay/replay/snapshots (replay) |

<a id="research"></a>

## research

Auto-generated tag for research route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /research/intelligence/ai-models | `research_get_research_intelligence_ai_models` | [stub] List/get /research/intelligence/ai-models (research) |
| `GET` | /research/intelligence/ai-models/{modelId} | `research_get_research_intelligence_ai_models_modelId` | [stub] List/get /research/intelligence/ai-models/{modelId} (research) |
| `GET` | /research/intelligence/ai-models/summary | `research_get_research_intelligence_ai_models_summary` | [stub] List/get /research/intelligence/ai-models/summary (research) |
| `POST` | /research/intelligence/ai/advisory | `research_post_research_intelligence_ai_advisory` | [stub] Create/invoke /research/intelligence/ai/advisory (research) |
| `POST` | /research/intelligence/ai/campaign-copy | `research_post_research_intelligence_ai_campaign_copy` | [stub] Create/invoke /research/intelligence/ai/campaign-copy (research) |
| `POST` | /research/intelligence/ai/content-ideas | `research_post_research_intelligence_ai_content_ideas` | [stub] Create/invoke /research/intelligence/ai/content-ideas (research) |
| `POST` | /research/intelligence/ai/dark-vessel-analysis | `research_post_research_intelligence_ai_dark_vessel_analysis` | [stub] Create/invoke /research/intelligence/ai/dark-vessel-analysis (research) |
| `POST` | /research/intelligence/ai/domain-agent | `research_post_research_intelligence_ai_domain_agent` | [stub] Create/invoke /research/intelligence/ai/domain-agent (research) |
| `POST` | /research/intelligence/ai/maritime-intelligence | `research_post_research_intelligence_ai_maritime_intelligence` | [stub] Create/invoke /research/intelligence/ai/maritime-intelligence (research) |
| `POST` | /research/intelligence/ai/readiness-summary | `research_post_research_intelligence_ai_readiness_summary` | [stub] Create/invoke /research/intelligence/ai/readiness-summary (research) |
| `POST` | /research/intelligence/ai/risk-assessment | `research_post_research_intelligence_ai_risk_assessment` | [stub] Create/invoke /research/intelligence/ai/risk-assessment (research) |
| `POST` | /research/intelligence/ai/risk-prediction | `research_post_research_intelligence_ai_risk_prediction` | [stub] Create/invoke /research/intelligence/ai/risk-prediction (research) |
| `POST` | /research/intelligence/ai/situation-report | `research_post_research_intelligence_ai_situation_report` | [stub] Create/invoke /research/intelligence/ai/situation-report (research) |
| `POST` | /research/intelligence/ai/threat-briefing | `research_post_research_intelligence_ai_threat_briefing` | [stub] Create/invoke /research/intelligence/ai/threat-briefing (research) |
| `POST` | /research/intelligence/ai/threat-triage | `research_post_research_intelligence_ai_threat_triage` | [stub] Create/invoke /research/intelligence/ai/threat-triage (research) |
| `POST` | /research/intelligence/ai/ticket-triage | `research_post_research_intelligence_ai_ticket_triage` | [stub] Create/invoke /research/intelligence/ai/ticket-triage (research) |
| `GET` | /research/intelligence/briefing | `research_get_research_intelligence_briefing` | [stub] List/get /research/intelligence/briefing (research) |
| `GET` | /research/intelligence/cisa-kev | `research_get_research_intelligence_cisa_kev` | [stub] List/get /research/intelligence/cisa-kev (research) |
| `GET` | /research/intelligence/cross-app-correlation | `research_get_research_intelligence_cross_app_correlation` | [stub] List/get /research/intelligence/cross-app-correlation (research) |
| `GET` | /research/intelligence/daily-digest | `research_get_research_intelligence_daily_digest` | [stub] List/get /research/intelligence/daily-digest (research) |
| `GET` | /research/intelligence/data-flow | `research_get_research_intelligence_data_flow` | [stub] List/get /research/intelligence/data-flow (research) |
| `GET` | /research/intelligence/huggingface-hub | `research_get_research_intelligence_huggingface_hub` | [stub] List/get /research/intelligence/huggingface-hub (research) |
| `GET` | /research/intelligence/ip-reputation | `research_get_research_intelligence_ip_reputation` | [stub] List/get /research/intelligence/ip-reputation (research) |
| `GET` | /research/intelligence/mitre-attack/correlation | `research_get_research_intelligence_mitre_attack_correlation` | [stub] List/get /research/intelligence/mitre-attack/correlation (research) |
| `GET` | /research/intelligence/model-registry | `research_get_research_intelligence_model_registry` | [stub] List/get /research/intelligence/model-registry (research) |
| `GET` | /research/intelligence/paperswithcode | `research_get_research_intelligence_paperswithcode` | [stub] List/get /research/intelligence/paperswithcode (research) |
| `GET` | /research/intelligence/research-papers | `research_get_research_intelligence_research_papers` | [stub] List/get /research/intelligence/research-papers (research) |
| `GET` | /research/intelligence/semantic-scholar | `research_get_research_intelligence_semantic_scholar` | [stub] List/get /research/intelligence/semantic-scholar (research) |
| `GET` | /research/intelligence/unified-feed | `research_get_research_intelligence_unified_feed` | [stub] List/get /research/intelligence/unified-feed (research) |

<a id="revenue-intelligence"></a>

## revenue-intelligence

Auto-generated tag for revenue-intelligence route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /revenue-intelligence/revenue-intelligence/events | `revenue_intelligence_get_revenue_intelligence_revenue_intelligence_events` | [stub] List/get /revenue-intelligence/revenue-intelligence/events (revenue-intelligence) |
| `GET` | /revenue-intelligence/revenue-intelligence/forecast | `revenue_intelligence_get_revenue_intelligence_revenue_intelligence_forecast` | [stub] List/get /revenue-intelligence/revenue-intelligence/forecast (revenue-intelligence) |
| `GET` | /revenue-intelligence/revenue-intelligence/summary | `revenue_intelligence_get_revenue_intelligence_revenue_intelligence_summary` | [stub] List/get /revenue-intelligence/revenue-intelligence/summary (revenue-intelligence) |

<a id="risk-evidence"></a>

## risk-evidence

Auto-generated tag for risk-evidence route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /risk-evidence/risk-evidence/{domain} | `risk_evidence_get_risk_evidence_risk_evidence_domain` | [stub] List/get /risk-evidence/risk-evidence/{domain} (risk-evidence) |
| `POST` | /risk-evidence/risk-evidence/{domain} | `risk_evidence_post_risk_evidence_risk_evidence_domain` | [stub] Create/invoke /risk-evidence/risk-evidence/{domain} (risk-evidence) |
| `DELETE` | /risk-evidence/risk-evidence/{domain}/{evidenceId} | `risk_evidence_delete_risk_evidence_risk_evidence_domain_evidenceId` | [stub] Delete /risk-evidence/risk-evidence/{domain}/{evidenceId} (risk-evidence) |
| `GET` | /risk-evidence/risk-evidence/by-id/{evidenceId} | `risk_evidence_get_risk_evidence_risk_evidence_by_id_evidenceId` | [stub] List/get /risk-evidence/risk-evidence/by-id/{evidenceId} (risk-evidence) |

<a id="scim"></a>

## scim

Auto-generated tag for scim route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `PATCH` | /scim/admin/tenants/{id}/organization | `scim_patch_scim_admin_tenants_id_organization` | [stub] Patch /scim/admin/tenants/{id}/organization (scim) |
| `POST` | /scim/admin/tenants/{id}/scim/deprovision-user | `scim_post_scim_admin_tenants_id_scim_deprovision_user` | [stub] Create/invoke /scim/admin/tenants/{id}/scim/deprovision-user (scim) |
| `POST` | /scim/admin/tenants/{id}/scim/sync-users | `scim_post_scim_admin_tenants_id_scim_sync_users` | [stub] Create/invoke /scim/admin/tenants/{id}/scim/sync-users (scim) |
| `GET` | /scim/scim/v2/Groups | `scim_get_scim_scim_v2_Groups` | [stub] List/get /scim/scim/v2/Groups (scim) |
| `POST` | /scim/scim/v2/Groups | `scim_post_scim_scim_v2_Groups` | [stub] Create/invoke /scim/scim/v2/Groups (scim) |
| `GET` | /scim/scim/v2/Groups/{id} | `scim_get_scim_scim_v2_Groups_id` | [stub] List/get /scim/scim/v2/Groups/{id} (scim) |
| `PUT` | /scim/scim/v2/Groups/{id} | `scim_put_scim_scim_v2_Groups_id` | [stub] Update /scim/scim/v2/Groups/{id} (scim) |
| `PATCH` | /scim/scim/v2/Groups/{id} | `scim_patch_scim_scim_v2_Groups_id` | [stub] Patch /scim/scim/v2/Groups/{id} (scim) |
| `DELETE` | /scim/scim/v2/Groups/{id} | `scim_delete_scim_scim_v2_Groups_id` | [stub] Delete /scim/scim/v2/Groups/{id} (scim) |
| `GET` | /scim/scim/v2/ResourceTypes | `scim_get_scim_scim_v2_ResourceTypes` | [stub] List/get /scim/scim/v2/ResourceTypes (scim) |
| `GET` | /scim/scim/v2/Schemas | `scim_get_scim_scim_v2_Schemas` | [stub] List/get /scim/scim/v2/Schemas (scim) |
| `GET` | /scim/scim/v2/ServiceProviderConfig | `scim_get_scim_scim_v2_ServiceProviderConfig` | [stub] List/get /scim/scim/v2/ServiceProviderConfig (scim) |
| `GET` | /scim/scim/v2/Users | `scim_get_scim_scim_v2_Users` | [stub] List/get /scim/scim/v2/Users (scim) |
| `POST` | /scim/scim/v2/Users | `scim_post_scim_scim_v2_Users` | [stub] Create/invoke /scim/scim/v2/Users (scim) |
| `GET` | /scim/scim/v2/Users/{id} | `scim_get_scim_scim_v2_Users_id` | [stub] List/get /scim/scim/v2/Users/{id} (scim) |
| `PUT` | /scim/scim/v2/Users/{id} | `scim_put_scim_scim_v2_Users_id` | [stub] Update /scim/scim/v2/Users/{id} (scim) |
| `PATCH` | /scim/scim/v2/Users/{id} | `scim_patch_scim_scim_v2_Users_id` | [stub] Patch /scim/scim/v2/Users/{id} (scim) |
| `DELETE` | /scim/scim/v2/Users/{id} | `scim_delete_scim_scim_v2_Users_id` | [stub] Delete /scim/scim/v2/Users/{id} (scim) |

<a id="seed"></a>

## seed

Auto-generated tag for seed route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /seed/admin/seed/demo-status | `seed_get_seed_admin_seed_demo_status` | [stub] List/get /seed/admin/seed/demo-status (seed) |
| `POST` | /seed/admin/seed/reset-demo | `seed_post_seed_admin_seed_reset_demo` | [stub] Create/invoke /seed/admin/seed/reset-demo (seed) |

<a id="self-healing"></a>

## self-healing

Auto-generated tag for self-healing route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /self-healing/self-healing/policies | `self_healing_get_self_healing_self_healing_policies` | [stub] List/get /self-healing/self-healing/policies (self-healing) |
| `POST` | /self-healing/self-healing/policies | `self_healing_post_self_healing_self_healing_policies` | [stub] Create/invoke /self-healing/self-healing/policies (self-healing) |
| `PUT` | /self-healing/self-healing/policies/{id} | `self_healing_put_self_healing_self_healing_policies_id` | [stub] Update /self-healing/self-healing/policies/{id} (self-healing) |
| `DELETE` | /self-healing/self-healing/policies/{id} | `self_healing_delete_self_healing_self_healing_policies_id` | [stub] Delete /self-healing/self-healing/policies/{id} (self-healing) |
| `GET` | /self-healing/self-healing/policies/{id}/history | `self_healing_get_self_healing_self_healing_policies_id_history` | [stub] List/get /self-healing/self-healing/policies/{id}/history (self-healing) |
| `PATCH` | /self-healing/self-healing/policies/{id}/toggle | `self_healing_patch_self_healing_self_healing_policies_id_toggle` | [stub] Patch /self-healing/self-healing/policies/{id}/toggle (self-healing) |
| `GET` | /self-healing/self-healing/runs | `self_healing_get_self_healing_self_healing_runs` | [stub] List/get /self-healing/self-healing/runs (self-healing) |
| `GET` | /self-healing/self-healing/runs/{id} | `self_healing_get_self_healing_self_healing_runs_id` | [stub] List/get /self-healing/self-healing/runs/{id} (self-healing) |
| `POST` | /self-healing/self-healing/runs/{id}/approve | `self_healing_post_self_healing_self_healing_runs_id_approve` | [stub] Create/invoke /self-healing/self-healing/runs/{id}/approve (self-healing) |
| `POST` | /self-healing/self-healing/runs/{id}/reject | `self_healing_post_self_healing_self_healing_runs_id_reject` | [stub] Create/invoke /self-healing/self-healing/runs/{id}/reject (self-healing) |
| `GET` | /self-healing/self-healing/stats | `self_healing_get_self_healing_self_healing_stats` | [stub] List/get /self-healing/self-healing/stats (self-healing) |

<a id="self-model"></a>

## self-model

Auto-generated tag for self-model route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /self-model/self-model | `self_model_get_self_model_self_model` | [stub] List/get /self-model/self-model (self-model) |
| `POST` | /self-model/self-model | `self_model_post_self_model_self_model` | [stub] Create/invoke /self-model/self-model (self-model) |
| `POST` | /self-model/self-model/check-threshold | `self_model_post_self_model_self_model_check_threshold` | [stub] Create/invoke /self-model/self-model/check-threshold (self-model) |
| `GET` | /self-model/self-model/history | `self_model_get_self_model_self_model_history` | [stub] List/get /self-model/self-model/history (self-model) |
| `POST` | /self-model/self-model/run-outcome | `self_model_post_self_model_self_model_run_outcome` | [stub] Create/invoke /self-model/self-model/run-outcome (self-model) |
| `GET` | /self-model/self-model/stats | `self_model_get_self_model_self_model_stats` | [stub] List/get /self-model/self-model/stats (self-model) |

<a id="sense"></a>

## sense

Auto-generated tag for sense route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /sense/control-tower/sense/domain-snapshot | `sense_get_sense_control_tower_sense_domain_snapshot` | [stub] List/get /sense/control-tower/sense/domain-snapshot (sense) |
| `POST` | /sense/control-tower/sense/emit | `sense_post_sense_control_tower_sense_emit` | [stub] Create/invoke /sense/control-tower/sense/emit (sense) |
| `GET` | /sense/control-tower/sense/signals | `sense_get_sense_control_tower_sense_signals` | [stub] List/get /sense/control-tower/sense/signals (sense) |

<a id="sentra"></a>

## sentra

Auto-generated tag for sentra route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /sentra/sentra/alerts | `sentra_get_sentra_sentra_alerts` | [stub] List/get /sentra/sentra/alerts (sentra) |
| `PATCH` | /sentra/sentra/alerts/{id} | `sentra_patch_sentra_sentra_alerts_id` | [stub] Patch /sentra/sentra/alerts/{id} (sentra) |
| `GET` | /sentra/sentra/incidents | `sentra_get_sentra_sentra_incidents` | [stub] List/get /sentra/sentra/incidents (sentra) |
| `POST` | /sentra/sentra/incidents | `sentra_post_sentra_sentra_incidents` | [stub] Create/invoke /sentra/sentra/incidents (sentra) |
| `GET` | /sentra/sentra/incidents/{id} | `sentra_get_sentra_sentra_incidents_id` | [stub] List/get /sentra/sentra/incidents/{id} (sentra) |
| `PATCH` | /sentra/sentra/incidents/{id} | `sentra_patch_sentra_sentra_incidents_id` | [stub] Patch /sentra/sentra/incidents/{id} (sentra) |
| `GET` | /sentra/sentra/summary | `sentra_get_sentra_sentra_summary` | [stub] List/get /sentra/sentra/summary (sentra) |

<a id="signal-chains"></a>

## signal-chains

Auto-generated tag for signal-chains route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /signal-chains/signal-chains | `signal_chains_get_signal_chains_signal_chains` | [stub] List/get /signal-chains/signal-chains (signal-chains) |
| `GET` | /signal-chains/signal-chains/{id} | `signal_chains_get_signal_chains_signal_chains_id` | [stub] List/get /signal-chains/signal-chains/{id} (signal-chains) |
| `GET` | /signal-chains/signal-chains/{id}/audit | `signal_chains_get_signal_chains_signal_chains_id_audit` | [stub] List/get /signal-chains/signal-chains/{id}/audit (signal-chains) |
| `POST` | /signal-chains/signal-chains/{id}/trigger | `signal_chains_post_signal_chains_signal_chains_id_trigger` | [stub] Create/invoke /signal-chains/signal-chains/{id}/trigger (signal-chains) |
| `GET` | /signal-chains/signal-chains/audit-log | `signal_chains_get_signal_chains_signal_chains_audit_log` | [stub] List/get /signal-chains/signal-chains/audit-log (signal-chains) |
| `GET` | /signal-chains/signal-chains/audit-log/export | `signal_chains_get_signal_chains_signal_chains_audit_log_export` | [stub] List/get /signal-chains/signal-chains/audit-log/export (signal-chains) |
| `POST` | /signal-chains/signal-chains/evaluate | `signal_chains_post_signal_chains_signal_chains_evaluate` | [stub] Create/invoke /signal-chains/signal-chains/evaluate (signal-chains) |

<a id="signatures"></a>

## signatures

Auto-generated tag for signatures route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `POST` | /signatures/documents/{id}/sign | `signatures_post_signatures_documents_id_sign` | [stub] Create/invoke /signatures/documents/{id}/sign (signatures) |
| `POST` | /signatures/documents/{id}/sign/{sigId} | `signatures_post_signatures_documents_id_sign_sigId` | [stub] Create/invoke /signatures/documents/{id}/sign/{sigId} (signatures) |
| `GET` | /signatures/documents/{id}/signatures | `signatures_get_signatures_documents_id_signatures` | [stub] List/get /signatures/documents/{id}/signatures (signatures) |
| `POST` | /signatures/documents/{id}/signatures/{sigId}/decline | `signatures_post_signatures_documents_id_signatures_sigId_decline` | [stub] Create/invoke /signatures/documents/{id}/signatures/{sigId}/decline (signatures) |
| `POST` | /signatures/documents/{id}/signatures/{sigId}/remind | `signatures_post_signatures_documents_id_signatures_sigId_remind` | [stub] Create/invoke /signatures/documents/{id}/signatures/{sigId}/remind (signatures) |
| `GET` | /signatures/documents/sign/{token} | `signatures_get_signatures_documents_sign_token` | [stub] List/get /signatures/documents/sign/{token} (signatures) |
| `POST` | /signatures/documents/sign/{token}/decline | `signatures_post_signatures_documents_sign_token_decline` | [stub] Create/invoke /signatures/documents/sign/{token}/decline (signatures) |
| `POST` | /signatures/documents/sign/{token}/submit | `signatures_post_signatures_documents_sign_token_submit` | [stub] Create/invoke /signatures/documents/sign/{token}/submit (signatures) |

<a id="simulation-whatif"></a>

## simulation-whatif

Auto-generated tag for simulation-whatif route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `POST` | /simulation/simulation/what-if | `simulation_whatif_post_simulation_simulation_what_if` | [stub] Create/invoke /simulation/simulation/what-if (simulation-whatif) |

<a id="storage-2"></a>

## storage

Auto-generated tag for storage route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /storage/storage/objects/*path | `storage_get_storage_storage_objects_path` | [stub] List/get /storage/storage/objects/*path (storage) |
| `GET` | /storage/storage/public-objects/*filePath | `storage_get_storage_storage_public_objects_filePath` | [stub] List/get /storage/storage/public-objects/*filePath (storage) |
| `POST` | /storage/storage/uploads/request-url | `storage_post_storage_storage_uploads_request_url` | [stub] Create/invoke /storage/storage/uploads/request-url (storage) |

<a id="substrate-replay"></a>

## substrate-replay

Auto-generated tag for substrate-replay route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /substrate-replay/substrate/metrics | `substrate_replay_get_substrate_replay_substrate_metrics` | [stub] List/get /substrate-replay/substrate/metrics (substrate-replay) |
| `POST` | /substrate-replay/substrate/replay | `substrate_replay_post_substrate_replay_substrate_replay` | [stub] Create/invoke /substrate-replay/substrate/replay (substrate-replay) |
| `POST` | /substrate-replay/substrate/run | `substrate_replay_post_substrate_replay_substrate_run` | [stub] Create/invoke /substrate-replay/substrate/run (substrate-replay) |
| `GET` | /substrate-replay/substrate/run/{runId} | `substrate_replay_get_substrate_replay_substrate_run_runId` | [stub] List/get /substrate-replay/substrate/run/{runId} (substrate-replay) |

<a id="support"></a>

## support

Auto-generated tag for support route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /support/admin/kb-articles | `support_get_support_admin_kb_articles` | [stub] List/get /support/admin/kb-articles (support) |
| `POST` | /support/admin/kb-articles | `support_post_support_admin_kb_articles` | [stub] Create/invoke /support/admin/kb-articles (support) |
| `PATCH` | /support/admin/kb-articles/{id} | `support_patch_support_admin_kb_articles_id` | [stub] Patch /support/admin/kb-articles/{id} (support) |
| `DELETE` | /support/admin/kb-articles/{id} | `support_delete_support_admin_kb_articles_id` | [stub] Delete /support/admin/kb-articles/{id} (support) |
| `GET` | /support/admin/support-queue | `support_get_support_admin_support_queue` | [stub] List/get /support/admin/support-queue (support) |
| `POST` | /support/admin/support-queue/{id}/reopen | `support_post_support_admin_support_queue_id_reopen` | [stub] Create/invoke /support/admin/support-queue/{id}/reopen (support) |
| `POST` | /support/admin/support-queue/{id}/reply | `support_post_support_admin_support_queue_id_reply` | [stub] Create/invoke /support/admin/support-queue/{id}/reply (support) |
| `POST` | /support/admin/support-queue/{id}/resolve | `support_post_support_admin_support_queue_id_resolve` | [stub] Create/invoke /support/admin/support-queue/{id}/resolve (support) |
| `POST` | /support/admin/support-queue/{id}/status | `support_post_support_admin_support_queue_id_status` | [stub] Create/invoke /support/admin/support-queue/{id}/status (support) |
| `GET` | /support/support/knowledge | `support_get_support_support_knowledge` | [stub] List/get /support/support/knowledge (support) |
| `GET` | /support/support/knowledge/{slug} | `support_get_support_support_knowledge_slug` | [stub] List/get /support/support/knowledge/{slug} (support) |
| `GET` | /support/support/tickets | `support_get_support_support_tickets` | [stub] List/get /support/support/tickets (support) |
| `POST` | /support/support/tickets | `support_post_support_support_tickets` | [stub] Create/invoke /support/support/tickets (support) |
| `GET` | /support/support/tickets/{id} | `support_get_support_support_tickets_id` | [stub] List/get /support/support/tickets/{id} (support) |
| `POST` | /support/support/tickets/{id}/comments | `support_post_support_support_tickets_id_comments` | [stub] Create/invoke /support/support/tickets/{id}/comments (support) |
| `PATCH` | /support/support/tickets/{id}/status | `support_patch_support_support_tickets_id_status` | [stub] Patch /support/support/tickets/{id}/status (support) |

<a id="system"></a>

## system

Auto-generated tag for system route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /system/admin/apps | `system_get_system_admin_apps` | [stub] List/get /system/admin/apps (system) |
| `GET` | /system/admin/artifact-approvals | `system_get_system_admin_artifact_approvals` | [stub] List/get /system/admin/artifact-approvals (system) |
| `POST` | /system/admin/artifact-approvals/{id}/approve | `system_post_system_admin_artifact_approvals_id_approve` | [stub] Create/invoke /system/admin/artifact-approvals/{id}/approve (system) |
| `POST` | /system/admin/artifact-approvals/{id}/reject | `system_post_system_admin_artifact_approvals_id_reject` | [stub] Create/invoke /system/admin/artifact-approvals/{id}/reject (system) |
| `GET` | /system/admin/billing/settings | `system_get_system_admin_billing_settings` | [stub] List/get /system/admin/billing/settings (system) |
| `GET` | /system/admin/environment | `system_get_system_admin_environment` | [stub] List/get /system/admin/environment (system) |
| `GET` | /system/admin/environment/full | `system_get_system_admin_environment_full` | [stub] List/get /system/admin/environment/full (system) |
| `GET` | /system/admin/feed-health | `system_get_system_admin_feed_health` | [stub] List/get /system/admin/feed-health (system) |
| `GET` | /system/admin/health-dashboard | `system_get_system_admin_health_dashboard` | [stub] List/get /system/admin/health-dashboard (system) |
| `GET` | /system/admin/overview | `system_get_system_admin_overview` | [stub] List/get /system/admin/overview (system) |
| `POST` | /system/admin/push-notifications/broadcast | `system_post_system_admin_push_notifications_broadcast` | [stub] Create/invoke /system/admin/push-notifications/broadcast (system) |
| `GET` | /system/admin/push-tokens/stats | `system_get_system_admin_push_tokens_stats` | [stub] List/get /system/admin/push-tokens/stats (system) |
| `POST` | /system/admin/retention/sweep | `system_post_system_admin_retention_sweep` | [stub] Create/invoke /system/admin/retention/sweep (system) |
| `GET` | /system/admin/security-alerts | `system_get_system_admin_security_alerts` | [stub] List/get /system/admin/security-alerts (system) |
| `POST` | /system/admin/seed | `system_post_system_admin_seed` | [stub] Create/invoke /system/admin/seed (system) |
| `POST` | /system/admin/seed/reset | `system_post_system_admin_seed_reset` | [stub] Create/invoke /system/admin/seed/reset (system) |
| `GET` | /system/admin/seed/validate | `system_get_system_admin_seed_validate` | [stub] List/get /system/admin/seed/validate (system) |
| `GET` | /system/admin/system-health | `system_get_system_admin_system_health` | [stub] List/get /system/admin/system-health (system) |
| `GET` | /system/admin/workflow-runs | `system_get_system_admin_workflow_runs` | [stub] List/get /system/admin/workflow-runs (system) |
| `GET` | /system/admin/workflow-runs/{id} | `system_get_system_admin_workflow_runs_id` | [stub] List/get /system/admin/workflow-runs/{id} (system) |

<a id="teams"></a>

## teams

Auto-generated tag for teams route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /teams/teams/{team} | `teams_get_teams_teams_team` | [stub] List/get /teams/teams/{team} (teams) |
| `POST` | /teams/teams/{team}/page | `teams_post_teams_teams_team_page` | [stub] Create/invoke /teams/teams/{team}/page (teams) |
| `GET` | /teams/teams/{team}/pages | `teams_get_teams_teams_team_pages` | [stub] List/get /teams/teams/{team}/pages (teams) |
| `GET` | /teams/teams/{team}/schedule | `teams_get_teams_teams_team_schedule` | [stub] List/get /teams/teams/{team}/schedule (teams) |
| `PUT` | /teams/teams/{team}/schedule | `teams_put_teams_teams_team_schedule` | [stub] Update /teams/teams/{team}/schedule (teams) |
| `POST` | /teams/teams/{team}/schedule/overrides | `teams_post_teams_teams_team_schedule_overrides` | [stub] Create/invoke /teams/teams/{team}/schedule/overrides (teams) |
| `DELETE` | /teams/teams/{team}/schedule/overrides/{id} | `teams_delete_teams_teams_team_schedule_overrides_id` | [stub] Delete /teams/teams/{team}/schedule/overrides/{id} (teams) |
| `GET` | /teams/teams/schedules | `teams_get_teams_teams_schedules` | [stub] List/get /teams/teams/schedules (teams) |
| `GET` | /teams/users/{id}/pages | `teams_get_teams_users_id_pages` | [stub] List/get /teams/users/{id}/pages (teams) |
| `GET` | /users/teams/{team} | `teams_get_users_teams_team` | [stub] List/get /users/teams/{team} (teams) |
| `POST` | /users/teams/{team}/page | `teams_post_users_teams_team_page` | [stub] Create/invoke /users/teams/{team}/page (teams) |
| `GET` | /users/teams/{team}/pages | `teams_get_users_teams_team_pages` | [stub] List/get /users/teams/{team}/pages (teams) |
| `GET` | /users/teams/{team}/schedule | `teams_get_users_teams_team_schedule` | [stub] List/get /users/teams/{team}/schedule (teams) |
| `PUT` | /users/teams/{team}/schedule | `teams_put_users_teams_team_schedule` | [stub] Update /users/teams/{team}/schedule (teams) |
| `POST` | /users/teams/{team}/schedule/overrides | `teams_post_users_teams_team_schedule_overrides` | [stub] Create/invoke /users/teams/{team}/schedule/overrides (teams) |
| `DELETE` | /users/teams/{team}/schedule/overrides/{id} | `teams_delete_users_teams_team_schedule_overrides_id` | [stub] Delete /users/teams/{team}/schedule/overrides/{id} (teams) |
| `GET` | /users/teams/schedules | `teams_get_users_teams_schedules` | [stub] List/get /users/teams/schedules (teams) |
| `GET` | /users/users/{id}/pages | `teams_get_users_users_id_pages` | [stub] List/get /users/users/{id}/pages (teams) |

<a id="telemetry"></a>

## telemetry

Auto-generated tag for telemetry route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `POST` | /telemetry/telemetry/events | `telemetry_post_telemetry_telemetry_events` | [stub] Create/invoke /telemetry/telemetry/events (telemetry) |

<a id="tenant-health"></a>

## tenant-health

Auto-generated tag for tenant-health route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /tenant-health/tenant-health | `tenant_health_get_tenant_health_tenant_health` | [stub] List/get /tenant-health/tenant-health (tenant-health) |
| `GET` | /tenant-health/tenant-health/{orgId} | `tenant_health_get_tenant_health_tenant_health_orgId` | [stub] List/get /tenant-health/tenant-health/{orgId} (tenant-health) |
| `POST` | /tenant-health/tenant-health/{orgId}/compute | `tenant_health_post_tenant_health_tenant_health_orgId_compute` | [stub] Create/invoke /tenant-health/tenant-health/{orgId}/compute (tenant-health) |
| `GET` | /tenant-health/tenant-health/benchmarks | `tenant_health_get_tenant_health_tenant_health_benchmarks` | [stub] List/get /tenant-health/tenant-health/benchmarks (tenant-health) |

<a id="tenants"></a>

## tenants

Auto-generated tag for tenants route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /tenants/admin/tenants | `tenants_get_tenants_admin_tenants` | [stub] List/get /tenants/admin/tenants (tenants) |
| `POST` | /tenants/admin/tenants | `tenants_post_tenants_admin_tenants` | [stub] Create/invoke /tenants/admin/tenants (tenants) |
| `GET` | /tenants/admin/tenants/{id} | `tenants_get_tenants_admin_tenants_id` | [stub] List/get /tenants/admin/tenants/{id} (tenants) |
| `DELETE` | /tenants/admin/tenants/{id} | `tenants_delete_tenants_admin_tenants_id` | [stub] Delete /tenants/admin/tenants/{id} (tenants) |
| `GET` | /tenants/admin/tenants/{id}/admin-consent-url | `tenants_get_tenants_admin_tenants_id_admin_consent_url` | [stub] List/get /tenants/admin/tenants/{id}/admin-consent-url (tenants) |
| `GET` | /tenants/admin/tenants/{id}/dataverse/connections | `tenants_get_tenants_admin_tenants_id_dataverse_connections` | [stub] List/get /tenants/admin/tenants/{id}/dataverse/connections (tenants) |
| `POST` | /tenants/admin/tenants/{id}/dataverse/connections | `tenants_post_tenants_admin_tenants_id_dataverse_connections` | [stub] Create/invoke /tenants/admin/tenants/{id}/dataverse/connections (tenants) |
| `GET` | /tenants/admin/tenants/{id}/dataverse/connections/{connectionId}/signals | `tenants_get_tenants_admin_tenants_id_dataverse_connections_connectionId_signals` | [stub] List/get /tenants/admin/tenants/{id}/dataverse/connections/{connectionId}/signals (tenants) |
| `POST` | /tenants/admin/tenants/{id}/dataverse/connections/{connectionId}/sync | `tenants_post_tenants_admin_tenants_id_dataverse_connections_connectionId_sync` | [stub] Create/invoke /tenants/admin/tenants/{id}/dataverse/connections/{connectionId}/sync (tenants) |
| `POST` | /tenants/admin/tenants/{id}/dataverse/connections/{connectionId}/test | `tenants_post_tenants_admin_tenants_id_dataverse_connections_connectionId_test` | [stub] Create/invoke /tenants/admin/tenants/{id}/dataverse/connections/{connectionId}/test (tenants) |
| `PATCH` | /tenants/admin/tenants/{id}/provisioning-config | `tenants_patch_tenants_admin_tenants_id_provisioning_config` | [stub] Patch /tenants/admin/tenants/{id}/provisioning-config (tenants) |
| `PATCH` | /tenants/admin/tenants/{id}/status | `tenants_patch_tenants_admin_tenants_id_status` | [stub] Patch /tenants/admin/tenants/{id}/status (tenants) |

<a id="terra-broker"></a>

## terra-broker

Auto-generated tag for terra-broker route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /terra/terra/broker/agents | `terra_broker_get_terra_terra_broker_agents` | [stub] List/get /terra/terra/broker/agents (terra-broker) |
| `GET` | /terra/terra/broker/brokerage | `terra_broker_get_terra_terra_broker_brokerage` | [stub] List/get /terra/terra/broker/brokerage (terra-broker) |
| `GET` | /terra/terra/broker/inquiries | `terra_broker_get_terra_terra_broker_inquiries` | [stub] List/get /terra/terra/broker/inquiries (terra-broker) |
| `POST` | /terra/terra/broker/inquiries | `terra_broker_post_terra_terra_broker_inquiries` | [stub] Create/invoke /terra/terra/broker/inquiries (terra-broker) |
| `PATCH` | /terra/terra/broker/inquiries/{id} | `terra_broker_patch_terra_terra_broker_inquiries_id` | [stub] Patch /terra/terra/broker/inquiries/{id} (terra-broker) |
| `GET` | /terra/terra/broker/listings | `terra_broker_get_terra_terra_broker_listings` | [stub] List/get /terra/terra/broker/listings (terra-broker) |
| `POST` | /terra/terra/broker/listings | `terra_broker_post_terra_terra_broker_listings` | [stub] Create/invoke /terra/terra/broker/listings (terra-broker) |
| `GET` | /terra/terra/broker/listings/{id} | `terra_broker_get_terra_terra_broker_listings_id` | [stub] List/get /terra/terra/broker/listings/{id} (terra-broker) |
| `PATCH` | /terra/terra/broker/listings/{id} | `terra_broker_patch_terra_terra_broker_listings_id` | [stub] Patch /terra/terra/broker/listings/{id} (terra-broker) |
| `DELETE` | /terra/terra/broker/listings/{id} | `terra_broker_delete_terra_terra_broker_listings_id` | [stub] Delete /terra/terra/broker/listings/{id} (terra-broker) |
| `GET` | /terra/terra/broker/map | `terra_broker_get_terra_terra_broker_map` | [stub] List/get /terra/terra/broker/map (terra-broker) |
| `GET` | /terra/terra/broker/search | `terra_broker_get_terra_terra_broker_search` | [stub] List/get /terra/terra/broker/search (terra-broker) |
| `GET` | /terra/terra/broker/transactions | `terra_broker_get_terra_terra_broker_transactions` | [stub] List/get /terra/terra/broker/transactions (terra-broker) |

<a id="terra-cognitive"></a>

## terra-cognitive

Auto-generated tag for terra-cognitive route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /terra/terra/cognitive/covenants | `terra_cognitive_get_terra_terra_cognitive_covenants` | [stub] List/get /terra/terra/cognitive/covenants (terra-cognitive) |
| `POST` | /terra/terra/cognitive/covenants | `terra_cognitive_post_terra_terra_cognitive_covenants` | [stub] Create/invoke /terra/terra/cognitive/covenants (terra-cognitive) |
| `PATCH` | /terra/terra/cognitive/covenants/{id} | `terra_cognitive_patch_terra_terra_cognitive_covenants_id` | [stub] Patch /terra/terra/cognitive/covenants/{id} (terra-cognitive) |
| `DELETE` | /terra/terra/cognitive/covenants/{id} | `terra_cognitive_delete_terra_terra_cognitive_covenants_id` | [stub] Delete /terra/terra/cognitive/covenants/{id} (terra-cognitive) |
| `POST` | /terra/terra/cognitive/covenants/financials/ingest | `terra_cognitive_post_terra_terra_cognitive_covenants_financials_ingest` | [stub] Create/invoke /terra/terra/cognitive/covenants/financials/ingest (terra-cognitive) |
| `POST` | /terra/terra/cognitive/covenants/financials/sync | `terra_cognitive_post_terra_terra_cognitive_covenants_financials_sync` | [stub] Create/invoke /terra/terra/cognitive/covenants/financials/sync (terra-cognitive) |
| `POST` | /terra/terra/cognitive/covenants/scan | `terra_cognitive_post_terra_terra_cognitive_covenants_scan` | [stub] Create/invoke /terra/terra/cognitive/covenants/scan (terra-cognitive) |
| `POST` | /terra/terra/cognitive/covenants/seed | `terra_cognitive_post_terra_terra_cognitive_covenants_seed` | [stub] Create/invoke /terra/terra/cognitive/covenants/seed (terra-cognitive) |
| `POST` | /terra/terra/cognitive/covenants/submit-review | `terra_cognitive_post_terra_terra_cognitive_covenants_submit_review` | [stub] Create/invoke /terra/terra/cognitive/covenants/submit-review (terra-cognitive) |
| `GET` | /terra/terra/cognitive/diligence-room | `terra_cognitive_get_terra_terra_cognitive_diligence_room` | [stub] List/get /terra/terra/cognitive/diligence-room (terra-cognitive) |
| `PATCH` | /terra/terra/cognitive/diligence-room/evidence/{evidenceId} | `terra_cognitive_patch_terra_terra_cognitive_diligence_room_evidence_evidenceId` | [stub] Patch /terra/terra/cognitive/diligence-room/evidence/{evidenceId} (terra-cognitive) |
| `GET` | /terra/terra/cognitive/diligence-room/evidence/{evidenceId}/download | `terra_cognitive_get_terra_terra_cognitive_diligence_room_evidence_evidenceId_download` | [stub] List/get /terra/terra/cognitive/diligence-room/evidence/{evidenceId}/download (terra-cognitive) |
| `POST` | /terra/terra/cognitive/diligence-room/matters | `terra_cognitive_post_terra_terra_cognitive_diligence_room_matters` | [stub] Create/invoke /terra/terra/cognitive/diligence-room/matters (terra-cognitive) |
| `POST` | /terra/terra/cognitive/diligence-room/matters/{matterId}/evidence | `terra_cognitive_post_terra_terra_cognitive_diligence_room_matters_matterId_evidence` | [stub] Create/invoke /terra/terra/cognitive/diligence-room/matters/{matterId}/evidence (terra-cognitive) |
| `GET` | /terra/terra/cognitive/distress-forecast | `terra_cognitive_get_terra_terra_cognitive_distress_forecast` | [stub] List/get /terra/terra/cognitive/distress-forecast (terra-cognitive) |
| `POST` | /terra/terra/cognitive/enrichment/run | `terra_cognitive_post_terra_terra_cognitive_enrichment_run` | [stub] Create/invoke /terra/terra/cognitive/enrichment/run (terra-cognitive) |
| `GET` | /terra/terra/cognitive/enrichment/status | `terra_cognitive_get_terra_terra_cognitive_enrichment_status` | [stub] List/get /terra/terra/cognitive/enrichment/status (terra-cognitive) |
| `GET` | /terra/terra/cognitive/lender-exposure | `terra_cognitive_get_terra_terra_cognitive_lender_exposure` | [stub] List/get /terra/terra/cognitive/lender-exposure (terra-cognitive) |
| `GET` | /terra/terra/cognitive/ownership-graph | `terra_cognitive_get_terra_terra_cognitive_ownership_graph` | [stub] List/get /terra/terra/cognitive/ownership-graph (terra-cognitive) |
| `GET` | /terra/terra/cognitive/underwriting-copilot | `terra_cognitive_get_terra_terra_cognitive_underwriting_copilot` | [stub] List/get /terra/terra/cognitive/underwriting-copilot (terra-cognitive) |

<a id="terra-digital-twin"></a>

## terra-digital-twin

Auto-generated tag for terra-digital-twin route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /terra/terra/{propertyId}/digital-twin | `terra_digital_twin_get_terra_terra_propertyId_digital_twin` | [stub] List/get /terra/terra/{propertyId}/digital-twin (terra-digital-twin) |
| `POST` | /terra/terra/{propertyId}/simulate | `terra_digital_twin_post_terra_terra_propertyId_simulate` | [stub] Create/invoke /terra/terra/{propertyId}/simulate (terra-digital-twin) |

<a id="terra-distress"></a>

## terra-distress

Auto-generated tag for terra-distress route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /terra/terra/distress/alerts | `terra_distress_get_terra_terra_distress_alerts` | [stub] List/get /terra/terra/distress/alerts (terra-distress) |
| `POST` | /terra/terra/distress/ingest/csv | `terra_distress_post_terra_terra_distress_ingest_csv` | [stub] Create/invoke /terra/terra/distress/ingest/csv (terra-distress) |
| `POST` | /terra/terra/distress/ingest/nyc-extended | `terra_distress_post_terra_terra_distress_ingest_nyc_extended` | [stub] Create/invoke /terra/terra/distress/ingest/nyc-extended (terra-distress) |
| `POST` | /terra/terra/distress/ingest/nyc-open-data | `terra_distress_post_terra_terra_distress_ingest_nyc_open_data` | [stub] Create/invoke /terra/terra/distress/ingest/nyc-open-data (terra-distress) |
| `GET` | /terra/terra/distress/ingestion/stats | `terra_distress_get_terra_terra_distress_ingestion_stats` | [stub] List/get /terra/terra/distress/ingestion/stats (terra-distress) |
| `GET` | /terra/terra/distress/nearby | `terra_distress_get_terra_terra_distress_nearby` | [stub] List/get /terra/terra/distress/nearby (terra-distress) |
| `GET` | /terra/terra/distress/property/{id} | `terra_distress_get_terra_terra_distress_property_id` | [stub] List/get /terra/terra/distress/property/{id} (terra-distress) |
| `GET` | /terra/terra/distress/score | `terra_distress_get_terra_terra_distress_score` | [stub] List/get /terra/terra/distress/score (terra-distress) |
| `GET` | /terra/terra/distress/search | `terra_distress_get_terra_terra_distress_search` | [stub] List/get /terra/terra/distress/search (terra-distress) |

<a id="terra-live"></a>

## terra-live

Auto-generated tag for terra-live route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /terra/terra/live/bls-construction | `terra_live_get_terra_terra_live_bls_construction` | [stub] List/get /terra/terra/live/bls-construction (terra-live) |
| `GET` | /terra/terra/live/census-acs-demographics | `terra_live_get_terra_terra_live_census_acs_demographics` | [stub] List/get /terra/terra/live/census-acs-demographics (terra-live) |
| `GET` | /terra/terra/live/census-housing | `terra_live_get_terra_terra_live_census_housing` | [stub] List/get /terra/terra/live/census-housing (terra-live) |
| `GET` | /terra/terra/live/fema-nri | `terra_live_get_terra_terra_live_fema_nri` | [stub] List/get /terra/terra/live/fema-nri (terra-live) |
| `GET` | /terra/terra/live/hud-fair-market-rents | `terra_live_get_terra_terra_live_hud_fair_market_rents` | [stub] List/get /terra/terra/live/hud-fair-market-rents (terra-live) |
| `GET` | /terra/terra/live/mortgage-rates | `terra_live_get_terra_terra_live_mortgage_rates` | [stub] List/get /terra/terra/live/mortgage-rates (terra-live) |
| `GET` | /terra/terra/live/nyc-311 | `terra_live_get_terra_terra_live_nyc_311` | [stub] List/get /terra/terra/live/nyc-311 (terra-live) |
| `GET` | /terra/terra/live/nyc-dashboard | `terra_live_get_terra_terra_live_nyc_dashboard` | [stub] List/get /terra/terra/live/nyc-dashboard (terra-live) |
| `GET` | /terra/terra/live/nyc-pluto | `terra_live_get_terra_terra_live_nyc_pluto` | [stub] List/get /terra/terra/live/nyc-pluto (terra-live) |

<a id="terra-modules"></a>

## terra-modules

Auto-generated tag for terra-modules route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /terra/terra/construction | `terra_modules_get_terra_terra_construction` | [stub] List/get /terra/terra/construction (terra-modules) |
| `GET` | /terra/terra/construction-projects | `terra_modules_get_terra_terra_construction_projects` | [stub] List/get /terra/terra/construction-projects (terra-modules) |
| `POST` | /terra/terra/construction-projects | `terra_modules_post_terra_terra_construction_projects` | [stub] Create/invoke /terra/terra/construction-projects (terra-modules) |
| `PUT` | /terra/terra/construction-projects/{id} | `terra_modules_put_terra_terra_construction_projects_id` | [stub] Update /terra/terra/construction-projects/{id} (terra-modules) |
| `DELETE` | /terra/terra/construction-projects/{id} | `terra_modules_delete_terra_terra_construction_projects_id` | [stub] Delete /terra/terra/construction-projects/{id} (terra-modules) |
| `GET` | /terra/terra/exchanges-1031 | `terra_modules_get_terra_terra_exchanges_1031` | [stub] List/get /terra/terra/exchanges-1031 (terra-modules) |
| `POST` | /terra/terra/exchanges-1031 | `terra_modules_post_terra_terra_exchanges_1031` | [stub] Create/invoke /terra/terra/exchanges-1031 (terra-modules) |
| `PUT` | /terra/terra/exchanges-1031/{id} | `terra_modules_put_terra_terra_exchanges_1031_id` | [stub] Update /terra/terra/exchanges-1031/{id} (terra-modules) |
| `DELETE` | /terra/terra/exchanges-1031/{id} | `terra_modules_delete_terra_terra_exchanges_1031_id` | [stub] Delete /terra/terra/exchanges-1031/{id} (terra-modules) |
| `GET` | /terra/terra/leases | `terra_modules_get_terra_terra_leases` | [stub] List/get /terra/terra/leases (terra-modules) |
| `POST` | /terra/terra/leases | `terra_modules_post_terra_terra_leases` | [stub] Create/invoke /terra/terra/leases (terra-modules) |
| `PUT` | /terra/terra/leases/{id} | `terra_modules_put_terra_terra_leases_id` | [stub] Update /terra/terra/leases/{id} (terra-modules) |
| `DELETE` | /terra/terra/leases/{id} | `terra_modules_delete_terra_terra_leases_id` | [stub] Delete /terra/terra/leases/{id} (terra-modules) |
| `POST` | /terra/terra/leases/upload | `terra_modules_post_terra_terra_leases_upload` | [stub] Create/invoke /terra/terra/leases/upload (terra-modules) |
| `GET` | /terra/terra/pro-forma-projects | `terra_modules_get_terra_terra_pro_forma_projects` | [stub] List/get /terra/terra/pro-forma-projects (terra-modules) |
| `POST` | /terra/terra/pro-forma-projects | `terra_modules_post_terra_terra_pro_forma_projects` | [stub] Create/invoke /terra/terra/pro-forma-projects (terra-modules) |
| `PUT` | /terra/terra/pro-forma-projects/{id} | `terra_modules_put_terra_terra_pro_forma_projects_id` | [stub] Update /terra/terra/pro-forma-projects/{id} (terra-modules) |
| `DELETE` | /terra/terra/pro-forma-projects/{id} | `terra_modules_delete_terra_terra_pro_forma_projects_id` | [stub] Delete /terra/terra/pro-forma-projects/{id} (terra-modules) |
| `GET` | /terra/terra/pro-forma-session | `terra_modules_get_terra_terra_pro_forma_session` | [stub] List/get /terra/terra/pro-forma-session (terra-modules) |
| `PUT` | /terra/terra/pro-forma-session | `terra_modules_put_terra_terra_pro_forma_session` | [stub] Update /terra/terra/pro-forma-session (terra-modules) |
| `GET` | /terra/terra/rent-roll | `terra_modules_get_terra_terra_rent_roll` | [stub] List/get /terra/terra/rent-roll (terra-modules) |
| `GET` | /terra/terra/screening | `terra_modules_get_terra_terra_screening` | [stub] List/get /terra/terra/screening (terra-modules) |
| `GET` | /terra/terra/tax-appeals | `terra_modules_get_terra_terra_tax_appeals` | [stub] List/get /terra/terra/tax-appeals (terra-modules) |
| `POST` | /terra/terra/tax-appeals | `terra_modules_post_terra_terra_tax_appeals` | [stub] Create/invoke /terra/terra/tax-appeals (terra-modules) |
| `PUT` | /terra/terra/tax-appeals/{id} | `terra_modules_put_terra_terra_tax_appeals_id` | [stub] Update /terra/terra/tax-appeals/{id} (terra-modules) |
| `DELETE` | /terra/terra/tax-appeals/{id} | `terra_modules_delete_terra_terra_tax_appeals_id` | [stub] Delete /terra/terra/tax-appeals/{id} (terra-modules) |
| `GET` | /terra/terra/tenant-applications | `terra_modules_get_terra_terra_tenant_applications` | [stub] List/get /terra/terra/tenant-applications (terra-modules) |
| `POST` | /terra/terra/tenant-applications | `terra_modules_post_terra_terra_tenant_applications` | [stub] Create/invoke /terra/terra/tenant-applications (terra-modules) |
| `PUT` | /terra/terra/tenant-applications/{id} | `terra_modules_put_terra_terra_tenant_applications_id` | [stub] Update /terra/terra/tenant-applications/{id} (terra-modules) |
| `DELETE` | /terra/terra/tenant-applications/{id} | `terra_modules_delete_terra_terra_tenant_applications_id` | [stub] Delete /terra/terra/tenant-applications/{id} (terra-modules) |
| `GET` | /terra/terra/tenant-screening | `terra_modules_get_terra_terra_tenant_screening` | [stub] List/get /terra/terra/tenant-screening (terra-modules) |
| `GET` | /terra/terra/waterfall-structures | `terra_modules_get_terra_terra_waterfall_structures` | [stub] List/get /terra/terra/waterfall-structures (terra-modules) |
| `POST` | /terra/terra/waterfall-structures | `terra_modules_post_terra_terra_waterfall_structures` | [stub] Create/invoke /terra/terra/waterfall-structures (terra-modules) |
| `PUT` | /terra/terra/waterfall-structures/{id} | `terra_modules_put_terra_terra_waterfall_structures_id` | [stub] Update /terra/terra/waterfall-structures/{id} (terra-modules) |
| `DELETE` | /terra/terra/waterfall-structures/{id} | `terra_modules_delete_terra_terra_waterfall_structures_id` | [stub] Delete /terra/terra/waterfall-structures/{id} (terra-modules) |

<a id="terra-portfolio-intel"></a>

## terra-portfolio-intel

Auto-generated tag for terra-portfolio-intel route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /terra/terra/portfolio/climate-risk | `terra_portfolio_intel_get_terra_terra_portfolio_climate_risk` | [stub] List/get /terra/terra/portfolio/climate-risk (terra-portfolio-intel) |
| `GET` | /terra/terra/portfolio/neighborhood-momentum | `terra_portfolio_intel_get_terra_terra_portfolio_neighborhood_momentum` | [stub] List/get /terra/terra/portfolio/neighborhood-momentum (terra-portfolio-intel) |
| `GET` | /terra/terra/portfolio/seller-motivation | `terra_portfolio_intel_get_terra_terra_portfolio_seller_motivation` | [stub] List/get /terra/terra/portfolio/seller-motivation (terra-portfolio-intel) |
| `GET` | /terra/terra/portfolio/spatial-walkthrough | `terra_portfolio_intel_get_terra_terra_portfolio_spatial_walkthrough` | [stub] List/get /terra/terra/portfolio/spatial-walkthrough (terra-portfolio-intel) |
| `GET` | /terra/terra/portfolio/zoning | `terra_portfolio_intel_get_terra_terra_portfolio_zoning` | [stub] List/get /terra/terra/portfolio/zoning (terra-portfolio-intel) |

<a id="terra-property-intel"></a>

## terra-property-intel

Auto-generated tag for terra-property-intel route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /terra/terra/properties/{id}/climate-risk | `terra_property_intel_get_terra_terra_properties_id_climate_risk` | [stub] List/get /terra/terra/properties/{id}/climate-risk (terra-property-intel) |
| `GET` | /terra/terra/properties/{id}/neighborhood-momentum | `terra_property_intel_get_terra_terra_properties_id_neighborhood_momentum` | [stub] List/get /terra/terra/properties/{id}/neighborhood-momentum (terra-property-intel) |
| `GET` | /terra/terra/properties/{id}/seller-motivation | `terra_property_intel_get_terra_terra_properties_id_seller_motivation` | [stub] List/get /terra/terra/properties/{id}/seller-motivation (terra-property-intel) |
| `GET` | /terra/terra/properties/{id}/spatial-walkthrough | `terra_property_intel_get_terra_terra_properties_id_spatial_walkthrough` | [stub] List/get /terra/terra/properties/{id}/spatial-walkthrough (terra-property-intel) |
| `GET` | /terra/terra/properties/{id}/waterfall | `terra_property_intel_get_terra_terra_properties_id_waterfall` | [stub] List/get /terra/terra/properties/{id}/waterfall (terra-property-intel) |
| `GET` | /terra/terra/properties/{id}/zoning | `terra_property_intel_get_terra_terra_properties_id_zoning` | [stub] List/get /terra/terra/properties/{id}/zoning (terra-property-intel) |

<a id="terra-why-this-property"></a>

## terra-why-this-property

Auto-generated tag for terra-why-this-property route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /terra/terra/why-this-property/{propertyId} | `terra_why_this_property_get_terra_terra_why_this_property_propertyId` | [stub] List/get /terra/terra/why-this-property/{propertyId} (terra-why-this-property) |

<a id="traces"></a>

## traces

Auto-generated tag for traces route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /runs/runs | `traces_get_runs_runs` | [stub] List/get /runs/runs (traces) |
| `GET` | /runs/runs/{id} | `traces_get_runs_runs_id` | [stub] List/get /runs/runs/{id} (traces) |
| `POST` | /runs/runs/{id}/replay | `traces_post_runs_runs_id_replay` | [stub] Create/invoke /runs/runs/{id}/replay (traces) |
| `GET` | /runs/runs/health | `traces_get_runs_runs_health` | [stub] List/get /runs/runs/health (traces) |
| `GET` | /runs/traces | `traces_get_runs_traces` | [stub] List/get /runs/traces (traces) |
| `GET` | /runs/traces/{id} | `traces_get_runs_traces_id` | [stub] List/get /runs/traces/{id} (traces) |
| `POST` | /runs/traces/{id}/comment | `traces_post_runs_traces_id_comment` | [stub] Create/invoke /runs/traces/{id}/comment (traces) |
| `GET` | /runs/traces/{id}/diff/{compareId} | `traces_get_runs_traces_id_diff_compareId` | [stub] List/get /runs/traces/{id}/diff/{compareId} (traces) |
| `POST` | /runs/traces/{id}/grade | `traces_post_runs_traces_id_grade` | [stub] Create/invoke /runs/traces/{id}/grade (traces) |
| `POST` | /runs/traces/{id}/link-entity | `traces_post_runs_traces_id_link_entity` | [stub] Create/invoke /runs/traces/{id}/link-entity (traces) |
| `POST` | /runs/traces/{id}/replay | `traces_post_runs_traces_id_replay` | [stub] Create/invoke /runs/traces/{id}/replay (traces) |
| `GET` | /runs/traces/regressions | `traces_get_runs_traces_regressions` | [stub] List/get /runs/traces/regressions (traces) |
| `GET` | /traces/runs | `traces_get_traces_runs` | [stub] List/get /traces/runs (traces) |
| `GET` | /traces/runs/{id} | `traces_get_traces_runs_id` | [stub] List/get /traces/runs/{id} (traces) |
| `POST` | /traces/runs/{id}/replay | `traces_post_traces_runs_id_replay` | [stub] Create/invoke /traces/runs/{id}/replay (traces) |
| `GET` | /traces/runs/health | `traces_get_traces_runs_health` | [stub] List/get /traces/runs/health (traces) |
| `GET` | /traces/traces | `traces_get_traces_traces` | [stub] List/get /traces/traces (traces) |
| `GET` | /traces/traces/{id} | `traces_get_traces_traces_id` | [stub] List/get /traces/traces/{id} (traces) |
| `POST` | /traces/traces/{id}/comment | `traces_post_traces_traces_id_comment` | [stub] Create/invoke /traces/traces/{id}/comment (traces) |
| `GET` | /traces/traces/{id}/diff/{compareId} | `traces_get_traces_traces_id_diff_compareId` | [stub] List/get /traces/traces/{id}/diff/{compareId} (traces) |
| `POST` | /traces/traces/{id}/grade | `traces_post_traces_traces_id_grade` | [stub] Create/invoke /traces/traces/{id}/grade (traces) |
| `POST` | /traces/traces/{id}/link-entity | `traces_post_traces_traces_id_link_entity` | [stub] Create/invoke /traces/traces/{id}/link-entity (traces) |
| `POST` | /traces/traces/{id}/replay | `traces_post_traces_traces_id_replay` | [stub] Create/invoke /traces/traces/{id}/replay (traces) |
| `GET` | /traces/traces/regressions | `traces_get_traces_traces_regressions` | [stub] List/get /traces/traces/regressions (traces) |

<a id="trust-provenance"></a>

## trust-provenance

Auto-generated tag for trust-provenance route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /audit-log/audit-log | `trust_provenance_get_audit_log_audit_log` | [stub] List/get /audit-log/audit-log (trust-provenance) |
| `GET` | /audit-log/covenant/decisions | `trust_provenance_get_audit_log_covenant_decisions` | [stub] List/get /audit-log/covenant/decisions (trust-provenance) |
| `GET` | /audit-log/proof-chain | `trust_provenance_get_audit_log_proof_chain` | [stub] List/get /audit-log/proof-chain (trust-provenance) |
| `GET` | /audit-log/simulations/results | `trust_provenance_get_audit_log_simulations_results` | [stub] List/get /audit-log/simulations/results (trust-provenance) |
| `GET` | /proof-chain/audit-log | `trust_provenance_get_proof_chain_audit_log` | [stub] List/get /proof-chain/audit-log (trust-provenance) |
| `POST` | /proof-chain/audit-log/policy-appeal | `trust_provenance_post_proof_chain_audit_log_policy_appeal` | [stub] Create/invoke /proof-chain/audit-log/policy-appeal (trust-provenance) |
| `GET` | /proof-chain/covenant/decisions | `trust_provenance_get_proof_chain_covenant_decisions` | [stub] List/get /proof-chain/covenant/decisions (trust-provenance) |
| `GET` | /proof-chain/simulations/results | `trust_provenance_get_proof_chain_simulations_results` | [stub] List/get /proof-chain/simulations/results (trust-provenance) |

<a id="unified-settings"></a>

## unified-settings

Auto-generated tag for unified-settings route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `DELETE` | /settings/settings/{tier}/{id} | `unified_settings_delete_settings_settings_tier_id` | [stub] Delete /settings/settings/{tier}/{id} (unified-settings) |
| `GET` | /settings/settings/audit | `unified_settings_get_settings_settings_audit` | [stub] List/get /settings/settings/audit (unified-settings) |
| `GET` | /settings/settings/platform | `unified_settings_get_settings_settings_platform` | [stub] List/get /settings/settings/platform (unified-settings) |
| `POST` | /settings/settings/platform | `unified_settings_post_settings_settings_platform` | [stub] Create/invoke /settings/settings/platform (unified-settings) |
| `GET` | /settings/settings/resolve | `unified_settings_get_settings_settings_resolve` | [stub] List/get /settings/settings/resolve (unified-settings) |
| `GET` | /settings/settings/tenant/{orgId} | `unified_settings_get_settings_settings_tenant_orgId` | [stub] List/get /settings/settings/tenant/{orgId} (unified-settings) |
| `POST` | /settings/settings/tenant/{orgId} | `unified_settings_post_settings_settings_tenant_orgId` | [stub] Create/invoke /settings/settings/tenant/{orgId} (unified-settings) |
| `GET` | /settings/settings/user | `unified_settings_get_settings_settings_user` | [stub] List/get /settings/settings/user (unified-settings) |
| `POST` | /settings/settings/user | `unified_settings_post_settings_settings_user` | [stub] Create/invoke /settings/settings/user (unified-settings) |

<a id="usage"></a>

## usage

Auto-generated tag for usage route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /orgs/admin/usage | `usage_get_orgs_admin_usage` | [stub] List/get /orgs/admin/usage (usage) |
| `GET` | /orgs/orgs/{orgSlug}/usage | `usage_get_orgs_orgs_orgSlug_usage` | [stub] List/get /orgs/orgs/{orgSlug}/usage (usage) |
| `POST` | /orgs/orgs/{orgSlug}/usage/events | `usage_post_orgs_orgs_orgSlug_usage_events` | [stub] Create/invoke /orgs/orgs/{orgSlug}/usage/events (usage) |
| `GET` | /orgs/orgs/{orgSlug}/usage/history | `usage_get_orgs_orgs_orgSlug_usage_history` | [stub] List/get /orgs/orgs/{orgSlug}/usage/history (usage) |

<a id="users"></a>

## users

Auto-generated tag for users route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /users/admin/audit-log | `users_get_users_admin_audit_log` | [stub] List/get /users/admin/audit-log (users) |
| `GET` | /users/admin/export-history | `users_get_users_admin_export_history` | [stub] List/get /users/admin/export-history (users) |
| `POST` | /users/admin/impersonate/{userId} | `users_post_users_admin_impersonate_userId` | [stub] Create/invoke /users/admin/impersonate/{userId} (users) |
| `POST` | /users/admin/impersonate/end | `users_post_users_admin_impersonate_end` | [stub] Create/invoke /users/admin/impersonate/end (users) |
| `GET` | /users/admin/roles | `users_get_users_admin_roles` | [stub] List/get /users/admin/roles (users) |
| `DELETE` | /users/admin/sessions/{userId} | `users_delete_users_admin_sessions_userId` | [stub] Delete /users/admin/sessions/{userId} (users) |
| `GET` | /users/admin/users | `users_get_users_admin_users` | [stub] List/get /users/admin/users (users) |
| `POST` | /users/admin/users | `users_post_users_admin_users` | [stub] Create/invoke /users/admin/users (users) |
| `PATCH` | /users/admin/users/{id}/deactivate | `users_patch_users_admin_users_id_deactivate` | [stub] Patch /users/admin/users/{id}/deactivate (users) |
| `GET` | /users/admin/users/{id}/detail | `users_get_users_admin_users_id_detail` | [stub] List/get /users/admin/users/{id}/detail (users) |
| `POST` | /users/admin/users/{id}/revoke-sessions | `users_post_users_admin_users_id_revoke_sessions` | [stub] Create/invoke /users/admin/users/{id}/revoke-sessions (users) |
| `PATCH` | /users/admin/users/{id}/role | `users_patch_users_admin_users_id_role` | [stub] Patch /users/admin/users/{id}/role (users) |
| `PUT` | /users/admin/users/{userId}/roles | `users_put_users_admin_users_userId_roles` | [stub] Update /users/admin/users/{userId}/roles (users) |

<a id="v1-approvals"></a>

## v1-approvals

Auto-generated tag for v1-approvals route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /v1/approvals | `v1_approvals_get_v1_approvals` | [stub] List/get /v1/approvals (v1-approvals) |
| `GET` | /v1/approvals/{id} | `v1_approvals_get_v1_approvals_id` | [stub] List/get /v1/approvals/{id} (v1-approvals) |
| `POST` | /v1/approvals/{id}/decide | `v1_approvals_post_v1_approvals_id_decide` | [stub] Create/invoke /v1/approvals/{id}/decide (v1-approvals) |

<a id="v1-runs"></a>

## v1-runs

Auto-generated tag for v1-runs route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /v1/runs | `v1_runs_get_v1_runs` | [stub] List/get /v1/runs (v1-runs) |
| `GET` | /v1/runs/{id}/ledger | `v1_runs_get_v1_runs_id_ledger` | [stub] List/get /v1/runs/{id}/ledger (v1-runs) |

<a id="verifier"></a>

## verifier

Auto-generated tag for verifier route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /verifier/verifier | `verifier_get_verifier_verifier` | [stub] List/get /verifier/verifier (verifier) |
| `POST` | /verifier/verifier | `verifier_post_verifier_verifier` | [stub] Create/invoke /verifier/verifier (verifier) |
| `GET` | /verifier/verifier/{id} | `verifier_get_verifier_verifier_id` | [stub] List/get /verifier/verifier/{id} (verifier) |
| `DELETE` | /verifier/verifier/{id} | `verifier_delete_verifier_verifier_id` | [stub] Delete /verifier/verifier/{id} (verifier) |
| `GET` | /verifier/verifier/target/{targetType}/{targetId} | `verifier_get_verifier_verifier_target_targetType_targetId` | [stub] List/get /verifier/verifier/target/{targetType}/{targetId} (verifier) |

<a id="vessels-cognitive"></a>

## vessels-cognitive

Auto-generated tag for vessels-cognitive route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /vessels/vessels/cognitive/counterparty-risk | `vessels_cognitive_get_vessels_vessels_cognitive_counterparty_risk` | [stub] List/get /vessels/vessels/cognitive/counterparty-risk (vessels-cognitive) |
| `GET` | /vessels/vessels/cognitive/owner-graph | `vessels_cognitive_get_vessels_vessels_cognitive_owner_graph` | [stub] List/get /vessels/vessels/cognitive/owner-graph (vessels-cognitive) |
| `GET` | /vessels/vessels/cognitive/route-anomalies | `vessels_cognitive_get_vessels_vessels_cognitive_route_anomalies` | [stub] List/get /vessels/vessels/cognitive/route-anomalies (vessels-cognitive) |
| `GET` | /vessels/vessels/cognitive/sanctions-chain/{vesselImo} | `vessels_cognitive_get_vessels_vessels_cognitive_sanctions_chain_vesselImo` | [stub] List/get /vessels/vessels/cognitive/sanctions-chain/{vesselImo} (vessels-cognitive) |
| `GET` | /vessels/vessels/cognitive/voyage-twin/{voyageRef} | `vessels_cognitive_get_vessels_vessels_cognitive_voyage_twin_voyageRef` | [stub] List/get /vessels/vessels/cognitive/voyage-twin/{voyageRef} (vessels-cognitive) |

<a id="vessels-digital-twin"></a>

## vessels-digital-twin

Auto-generated tag for vessels-digital-twin route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /vessels/vessels/{imo}/digital-twin | `vessels_digital_twin_get_vessels_vessels_imo_digital_twin` | [stub] List/get /vessels/vessels/{imo}/digital-twin (vessels-digital-twin) |
| `POST` | /vessels/vessels/{imo}/simulate | `vessels_digital_twin_post_vessels_vessels_imo_simulate` | [stub] Create/invoke /vessels/vessels/{imo}/simulate (vessels-digital-twin) |

<a id="vessels-extended"></a>

## vessels-extended

Auto-generated tag for vessels-extended route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /vessels/vessels/{id}/detail | `vessels_extended_get_vessels_vessels_id_detail` | [stub] List/get /vessels/vessels/{id}/detail (vessels-extended) |
| `GET` | /vessels/vessels/{id}/exceptions | `vessels_extended_get_vessels_vessels_id_exceptions` | [stub] List/get /vessels/vessels/{id}/exceptions (vessels-extended) |
| `GET` | /vessels/vessels/{id}/maintenance | `vessels_extended_get_vessels_vessels_id_maintenance` | [stub] List/get /vessels/vessels/{id}/maintenance (vessels-extended) |
| `GET` | /vessels/vessels/{id}/port-calls | `vessels_extended_get_vessels_vessels_id_port_calls` | [stub] List/get /vessels/vessels/{id}/port-calls (vessels-extended) |
| `GET` | /vessels/vessels/{id}/sanctions | `vessels_extended_get_vessels_vessels_id_sanctions` | [stub] List/get /vessels/vessels/{id}/sanctions (vessels-extended) |
| `GET` | /vessels/vessels/{id}/voyages | `vessels_extended_get_vessels_vessels_id_voyages` | [stub] List/get /vessels/vessels/{id}/voyages (vessels-extended) |
| `GET` | /vessels/vessels/corridors | `vessels_extended_get_vessels_vessels_corridors` | [stub] List/get /vessels/vessels/corridors (vessels-extended) |
| `GET` | /vessels/vessels/corridors/{id} | `vessels_extended_get_vessels_vessels_corridors_id` | [stub] List/get /vessels/vessels/corridors/{id} (vessels-extended) |
| `GET` | /vessels/vessels/dashboard | `vessels_extended_get_vessels_vessels_dashboard` | [stub] List/get /vessels/vessels/dashboard (vessels-extended) |
| `GET` | /vessels/vessels/exceptions | `vessels_extended_get_vessels_vessels_exceptions` | [stub] List/get /vessels/vessels/exceptions (vessels-extended) |
| `POST` | /vessels/vessels/exceptions | `vessels_extended_post_vessels_vessels_exceptions` | [stub] Create/invoke /vessels/vessels/exceptions (vessels-extended) |
| `GET` | /vessels/vessels/exceptions/{id} | `vessels_extended_get_vessels_vessels_exceptions_id` | [stub] List/get /vessels/vessels/exceptions/{id} (vessels-extended) |
| `POST` | /vessels/vessels/exceptions/{id}/acknowledge | `vessels_extended_post_vessels_vessels_exceptions_id_acknowledge` | [stub] Create/invoke /vessels/vessels/exceptions/{id}/acknowledge (vessels-extended) |
| `POST` | /vessels/vessels/exceptions/{id}/escalate | `vessels_extended_post_vessels_vessels_exceptions_id_escalate` | [stub] Create/invoke /vessels/vessels/exceptions/{id}/escalate (vessels-extended) |
| `POST` | /vessels/vessels/exceptions/{id}/resolve | `vessels_extended_post_vessels_vessels_exceptions_id_resolve` | [stub] Create/invoke /vessels/vessels/exceptions/{id}/resolve (vessels-extended) |
| `GET` | /vessels/vessels/fleet-summary | `vessels_extended_get_vessels_vessels_fleet_summary` | [stub] List/get /vessels/vessels/fleet-summary (vessels-extended) |
| `GET` | /vessels/vessels/maintenance | `vessels_extended_get_vessels_vessels_maintenance` | [stub] List/get /vessels/vessels/maintenance (vessels-extended) |
| `GET` | /vessels/vessels/map-payload | `vessels_extended_get_vessels_vessels_map_payload` | [stub] List/get /vessels/vessels/map-payload (vessels-extended) |
| `GET` | /vessels/vessels/port-calls | `vessels_extended_get_vessels_vessels_port_calls` | [stub] List/get /vessels/vessels/port-calls (vessels-extended) |
| `GET` | /vessels/vessels/ports | `vessels_extended_get_vessels_vessels_ports` | [stub] List/get /vessels/vessels/ports (vessels-extended) |
| `GET` | /vessels/vessels/readiness | `vessels_extended_get_vessels_vessels_readiness` | [stub] List/get /vessels/vessels/readiness (vessels-extended) |
| `GET` | /vessels/vessels/roster | `vessels_extended_get_vessels_vessels_roster` | [stub] List/get /vessels/vessels/roster (vessels-extended) |
| `GET` | /vessels/vessels/sanctions | `vessels_extended_get_vessels_vessels_sanctions` | [stub] List/get /vessels/vessels/sanctions (vessels-extended) |
| `GET` | /vessels/vessels/sanctions/summary | `vessels_extended_get_vessels_vessels_sanctions_summary` | [stub] List/get /vessels/vessels/sanctions/summary (vessels-extended) |
| `POST` | /vessels/vessels/seed | `vessels_extended_post_vessels_vessels_seed` | [stub] Create/invoke /vessels/vessels/seed (vessels-extended) |
| `GET` | /vessels/vessels/track/{vesselId} | `vessels_extended_get_vessels_vessels_track_vesselId` | [stub] List/get /vessels/vessels/track/{vesselId} (vessels-extended) |
| `GET` | /vessels/vessels/voyage-economics | `vessels_extended_get_vessels_vessels_voyage_economics` | [stub] List/get /vessels/vessels/voyage-economics (vessels-extended) |
| `GET` | /vessels/vessels/voyage-economics/{id} | `vessels_extended_get_vessels_vessels_voyage_economics_id` | [stub] List/get /vessels/vessels/voyage-economics/{id} (vessels-extended) |
| `GET` | /vessels/vessels/voyage-economics/analytics | `vessels_extended_get_vessels_vessels_voyage_economics_analytics` | [stub] List/get /vessels/vessels/voyage-economics/analytics (vessels-extended) |
| `GET` | /vessels/vessels/voyages | `vessels_extended_get_vessels_vessels_voyages` | [stub] List/get /vessels/vessels/voyages (vessels-extended) |
| `GET` | /vessels/vessels/voyages/{id} | `vessels_extended_get_vessels_vessels_voyages_id` | [stub] List/get /vessels/vessels/voyages/{id} (vessels-extended) |

<a id="vessels-freight"></a>

## vessels-freight

Auto-generated tag for vessels-freight route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /vessels/vessels/freight/benchmarks | `vessels_freight_get_vessels_vessels_freight_benchmarks` | [stub] List/get /vessels/vessels/freight/benchmarks (vessels-freight) |

<a id="vessels-insurance"></a>

## vessels-insurance

Auto-generated tag for vessels-insurance route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /vessels/vessels/insurance/claims | `vessels_insurance_get_vessels_vessels_insurance_claims` | [stub] List/get /vessels/vessels/insurance/claims (vessels-insurance) |
| `POST` | /vessels/vessels/insurance/claims | `vessels_insurance_post_vessels_vessels_insurance_claims` | [stub] Create/invoke /vessels/vessels/insurance/claims (vessels-insurance) |
| `PUT` | /vessels/vessels/insurance/claims/{id}/status | `vessels_insurance_put_vessels_vessels_insurance_claims_id_status` | [stub] Update /vessels/vessels/insurance/claims/{id}/status (vessels-insurance) |
| `GET` | /vessels/vessels/insurance/policies | `vessels_insurance_get_vessels_vessels_insurance_policies` | [stub] List/get /vessels/vessels/insurance/policies (vessels-insurance) |
| `GET` | /vessels/vessels/insurance/policies/{id} | `vessels_insurance_get_vessels_vessels_insurance_policies_id` | [stub] List/get /vessels/vessels/insurance/policies/{id} (vessels-insurance) |
| `GET` | /vessels/vessels/insurance/portfolio-summary | `vessels_insurance_get_vessels_vessels_insurance_portfolio_summary` | [stub] List/get /vessels/vessels/insurance/portfolio-summary (vessels-insurance) |
| `GET` | /vessels/vessels/insurance/quotes | `vessels_insurance_get_vessels_vessels_insurance_quotes` | [stub] List/get /vessels/vessels/insurance/quotes (vessels-insurance) |
| `POST` | /vessels/vessels/insurance/quotes | `vessels_insurance_post_vessels_vessels_insurance_quotes` | [stub] Create/invoke /vessels/vessels/insurance/quotes (vessels-insurance) |
| `POST` | /vessels/vessels/insurance/quotes/{id}/bind | `vessels_insurance_post_vessels_vessels_insurance_quotes_id_bind` | [stub] Create/invoke /vessels/vessels/insurance/quotes/{id}/bind (vessels-insurance) |
| `GET` | /vessels/vessels/insurance/reference/chokepoints | `vessels_insurance_get_vessels_vessels_insurance_reference_chokepoints` | [stub] List/get /vessels/vessels/insurance/reference/chokepoints (vessels-insurance) |
| `GET` | /vessels/vessels/insurance/reference/hazard-classes | `vessels_insurance_get_vessels_vessels_insurance_reference_hazard_classes` | [stub] List/get /vessels/vessels/insurance/reference/hazard-classes (vessels-insurance) |
| `GET` | /vessels/vessels/insurance/risk-score | `vessels_insurance_get_vessels_vessels_insurance_risk_score` | [stub] List/get /vessels/vessels/insurance/risk-score (vessels-insurance) |

<a id="vessels-live"></a>

## vessels-live

Auto-generated tag for vessels-live route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /vessels/vessels/live/ais | `vessels_live_get_vessels_vessels_live_ais` | [stub] List/get /vessels/vessels/live/ais (vessels-live) |
| `GET` | /vessels/vessels/live/ais/combined | `vessels_live_get_vessels_vessels_live_ais_combined` | [stub] List/get /vessels/vessels/live/ais/combined (vessels-live) |
| `GET` | /vessels/vessels/live/fleet-summary | `vessels_live_get_vessels_vessels_live_fleet_summary` | [stub] List/get /vessels/vessels/live/fleet-summary (vessels-live) |
| `GET` | /vessels/vessels/live/vessel-details/{mmsi} | `vessels_live_get_vessels_vessels_live_vessel_details_mmsi` | [stub] List/get /vessels/vessels/live/vessel-details/{mmsi} (vessels-live) |
| `GET` | /vessels/vessels/live/weather | `vessels_live_get_vessels_vessels_live_weather` | [stub] List/get /vessels/vessels/live/weather (vessels-live) |

<a id="vessels-modules"></a>

## vessels-modules

Auto-generated tag for vessels-modules route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /vessels/vessels/modules/ais-track | `vessels_modules_get_vessels_vessels_modules_ais_track` | [stub] List/get /vessels/vessels/modules/ais-track (vessels-modules) |
| `GET` | /vessels/vessels/modules/bills-of-lading | `vessels_modules_get_vessels_vessels_modules_bills_of_lading` | [stub] List/get /vessels/vessels/modules/bills-of-lading (vessels-modules) |
| `POST` | /vessels/vessels/modules/bills-of-lading | `vessels_modules_post_vessels_vessels_modules_bills_of_lading` | [stub] Create/invoke /vessels/vessels/modules/bills-of-lading (vessels-modules) |
| `GET` | /vessels/vessels/modules/bills-of-lading/{id} | `vessels_modules_get_vessels_vessels_modules_bills_of_lading_id` | [stub] List/get /vessels/vessels/modules/bills-of-lading/{id} (vessels-modules) |
| `POST` | /vessels/vessels/modules/bills-of-lading/{id}/transfer | `vessels_modules_post_vessels_vessels_modules_bills_of_lading_id_transfer` | [stub] Create/invoke /vessels/vessels/modules/bills-of-lading/{id}/transfer (vessels-modules) |
| `GET` | /vessels/vessels/modules/bills-of-lading/{id}/verify | `vessels_modules_get_vessels_vessels_modules_bills_of_lading_id_verify` | [stub] List/get /vessels/vessels/modules/bills-of-lading/{id}/verify (vessels-modules) |
| `GET` | /vessels/vessels/modules/crew | `vessels_modules_get_vessels_vessels_modules_crew` | [stub] List/get /vessels/vessels/modules/crew (vessels-modules) |
| `GET` | /vessels/vessels/modules/crew/{id} | `vessels_modules_get_vessels_vessels_modules_crew_id` | [stub] List/get /vessels/vessels/modules/crew/{id} (vessels-modules) |
| `GET` | /vessels/vessels/modules/voyages-emissions | `vessels_modules_get_vessels_vessels_modules_voyages_emissions` | [stub] List/get /vessels/vessels/modules/voyages-emissions (vessels-modules) |
| `POST` | /vessels/vessels/modules/voyages-emissions | `vessels_modules_post_vessels_vessels_modules_voyages_emissions` | [stub] Create/invoke /vessels/vessels/modules/voyages-emissions (vessels-modules) |
| `GET` | /vessels/vessels/modules/voyages-emissions/{id} | `vessels_modules_get_vessels_vessels_modules_voyages_emissions_id` | [stub] List/get /vessels/vessels/modules/voyages-emissions/{id} (vessels-modules) |

<a id="vessels-platform"></a>

## vessels-platform

Auto-generated tag for vessels-platform route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /vessels/vessels/platform/corridors | `vessels_platform_get_vessels_vessels_platform_corridors` | [stub] List/get /vessels/vessels/platform/corridors (vessels-platform) |
| `GET` | /vessels/vessels/platform/dashboard | `vessels_platform_get_vessels_vessels_platform_dashboard` | [stub] List/get /vessels/vessels/platform/dashboard (vessels-platform) |
| `GET` | /vessels/vessels/platform/exceptions | `vessels_platform_get_vessels_vessels_platform_exceptions` | [stub] List/get /vessels/vessels/platform/exceptions (vessels-platform) |
| `POST` | /vessels/vessels/platform/exceptions | `vessels_platform_post_vessels_vessels_platform_exceptions` | [stub] Create/invoke /vessels/vessels/platform/exceptions (vessels-platform) |
| `GET` | /vessels/vessels/platform/exceptions/{id} | `vessels_platform_get_vessels_vessels_platform_exceptions_id` | [stub] List/get /vessels/vessels/platform/exceptions/{id} (vessels-platform) |
| `POST` | /vessels/vessels/platform/exceptions/{id}/acknowledge | `vessels_platform_post_vessels_vessels_platform_exceptions_id_acknowledge` | [stub] Create/invoke /vessels/vessels/platform/exceptions/{id}/acknowledge (vessels-platform) |
| `POST` | /vessels/vessels/platform/exceptions/{id}/assign | `vessels_platform_post_vessels_vessels_platform_exceptions_id_assign` | [stub] Create/invoke /vessels/vessels/platform/exceptions/{id}/assign (vessels-platform) |
| `POST` | /vessels/vessels/platform/exceptions/{id}/escalate | `vessels_platform_post_vessels_vessels_platform_exceptions_id_escalate` | [stub] Create/invoke /vessels/vessels/platform/exceptions/{id}/escalate (vessels-platform) |
| `POST` | /vessels/vessels/platform/exceptions/{id}/resolve | `vessels_platform_post_vessels_vessels_platform_exceptions_id_resolve` | [stub] Create/invoke /vessels/vessels/platform/exceptions/{id}/resolve (vessels-platform) |
| `GET` | /vessels/vessels/platform/fleet | `vessels_platform_get_vessels_vessels_platform_fleet` | [stub] List/get /vessels/vessels/platform/fleet (vessels-platform) |
| `GET` | /vessels/vessels/platform/map | `vessels_platform_get_vessels_vessels_platform_map` | [stub] List/get /vessels/vessels/platform/map (vessels-platform) |
| `GET` | /vessels/vessels/platform/ports | `vessels_platform_get_vessels_vessels_platform_ports` | [stub] List/get /vessels/vessels/platform/ports (vessels-platform) |
| `GET` | /vessels/vessels/platform/readiness | `vessels_platform_get_vessels_vessels_platform_readiness` | [stub] List/get /vessels/vessels/platform/readiness (vessels-platform) |
| `POST` | /vessels/vessels/platform/readiness | `vessels_platform_post_vessels_vessels_platform_readiness` | [stub] Create/invoke /vessels/vessels/platform/readiness (vessels-platform) |
| `GET` | /vessels/vessels/platform/routes | `vessels_platform_get_vessels_vessels_platform_routes` | [stub] List/get /vessels/vessels/platform/routes (vessels-platform) |
| `GET` | /vessels/vessels/platform/routes/{id} | `vessels_platform_get_vessels_vessels_platform_routes_id` | [stub] List/get /vessels/vessels/platform/routes/{id} (vessels-platform) |
| `POST` | /vessels/vessels/platform/vessels | `vessels_platform_post_vessels_vessels_platform_vessels` | [stub] Create/invoke /vessels/vessels/platform/vessels (vessels-platform) |
| `GET` | /vessels/vessels/platform/vessels/{id} | `vessels_platform_get_vessels_vessels_platform_vessels_id` | [stub] List/get /vessels/vessels/platform/vessels/{id} (vessels-platform) |
| `PATCH` | /vessels/vessels/platform/vessels/{id} | `vessels_platform_patch_vessels_vessels_platform_vessels_id` | [stub] Patch /vessels/vessels/platform/vessels/{id} (vessels-platform) |
| `GET` | /vessels/vessels/platform/voyages | `vessels_platform_get_vessels_vessels_platform_voyages` | [stub] List/get /vessels/vessels/platform/voyages (vessels-platform) |
| `POST` | /vessels/vessels/platform/voyages | `vessels_platform_post_vessels_vessels_platform_voyages` | [stub] Create/invoke /vessels/vessels/platform/voyages (vessels-platform) |
| `GET` | /vessels/vessels/platform/voyages/{id} | `vessels_platform_get_vessels_vessels_platform_voyages_id` | [stub] List/get /vessels/vessels/platform/voyages/{id} (vessels-platform) |
| `PATCH` | /vessels/vessels/platform/voyages/{id} | `vessels_platform_patch_vessels_vessels_platform_voyages_id` | [stub] Patch /vessels/vessels/platform/voyages/{id} (vessels-platform) |

<a id="vessels-psc"></a>

## vessels-psc

Auto-generated tag for vessels-psc route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /vessels/vessels/{id}/psc/checklist | `vessels_psc_get_vessels_vessels_id_psc_checklist` | [stub] List/get /vessels/vessels/{id}/psc/checklist (vessels-psc) |
| `POST` | /vessels/vessels/{id}/psc/checklist | `vessels_psc_post_vessels_vessels_id_psc_checklist` | [stub] Create/invoke /vessels/vessels/{id}/psc/checklist (vessels-psc) |
| `GET` | /vessels/vessels/{id}/psc/inspections | `vessels_psc_get_vessels_vessels_id_psc_inspections` | [stub] List/get /vessels/vessels/{id}/psc/inspections (vessels-psc) |
| `PATCH` | /vessels/vessels/psc/checklist/{itemId} | `vessels_psc_patch_vessels_vessels_psc_checklist_itemId` | [stub] Patch /vessels/vessels/psc/checklist/{itemId} (vessels-psc) |
| `GET` | /vessels/vessels/psc/profiles | `vessels_psc_get_vessels_vessels_psc_profiles` | [stub] List/get /vessels/vessels/psc/profiles (vessels-psc) |

<a id="vessels-trading"></a>

## vessels-trading

Auto-generated tag for vessels-trading route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /vessels/vessels/trading/fills | `vessels_trading_get_vessels_vessels_trading_fills` | [stub] List/get /vessels/vessels/trading/fills (vessels-trading) |
| `GET` | /vessels/vessels/trading/instruments | `vessels_trading_get_vessels_vessels_trading_instruments` | [stub] List/get /vessels/vessels/trading/instruments (vessels-trading) |
| `GET` | /vessels/vessels/trading/instruments/{id} | `vessels_trading_get_vessels_vessels_trading_instruments_id` | [stub] List/get /vessels/vessels/trading/instruments/{id} (vessels-trading) |
| `GET` | /vessels/vessels/trading/market-depth/{symbol} | `vessels_trading_get_vessels_vessels_trading_market_depth_symbol` | [stub] List/get /vessels/vessels/trading/market-depth/{symbol} (vessels-trading) |
| `GET` | /vessels/vessels/trading/orders | `vessels_trading_get_vessels_vessels_trading_orders` | [stub] List/get /vessels/vessels/trading/orders (vessels-trading) |
| `POST` | /vessels/vessels/trading/orders | `vessels_trading_post_vessels_vessels_trading_orders` | [stub] Create/invoke /vessels/vessels/trading/orders (vessels-trading) |
| `DELETE` | /vessels/vessels/trading/orders/{id} | `vessels_trading_delete_vessels_vessels_trading_orders_id` | [stub] Delete /vessels/vessels/trading/orders/{id} (vessels-trading) |
| `GET` | /vessels/vessels/trading/pnl | `vessels_trading_get_vessels_vessels_trading_pnl` | [stub] List/get /vessels/vessels/trading/pnl (vessels-trading) |
| `GET` | /vessels/vessels/trading/positions | `vessels_trading_get_vessels_vessels_trading_positions` | [stub] List/get /vessels/vessels/trading/positions (vessels-trading) |
| `GET` | /vessels/vessels/trading/rates | `vessels_trading_get_vessels_vessels_trading_rates` | [stub] List/get /vessels/vessels/trading/rates (vessels-trading) |

<a id="vessels-voyage-risk"></a>

## vessels-voyage-risk

Auto-generated tag for vessels-voyage-risk route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `POST` | /vessels/vessels/voyage-risk/memo/pdf | `vessels_voyage_risk_post_vessels_vessels_voyage_risk_memo_pdf` | [stub] Create/invoke /vessels/vessels/voyage-risk/memo/pdf (vessels-voyage-risk) |
| `POST` | /vessels/vessels/voyage-risk/sanctions/refresh | `vessels_voyage_risk_post_vessels_vessels_voyage_risk_sanctions_refresh` | [stub] Create/invoke /vessels/vessels/voyage-risk/sanctions/refresh (vessels-voyage-risk) |
| `GET` | /vessels/vessels/voyage-risk/sanctions/sources | `vessels_voyage_risk_get_vessels_vessels_voyage_risk_sanctions_sources` | [stub] List/get /vessels/vessels/voyage-risk/sanctions/sources (vessels-voyage-risk) |
| `GET` | /vessels/vessels/voyage-risk/scenarios | `vessels_voyage_risk_get_vessels_vessels_voyage_risk_scenarios` | [stub] List/get /vessels/vessels/voyage-risk/scenarios (vessels-voyage-risk) |
| `POST` | /vessels/vessels/voyage-risk/score | `vessels_voyage_risk_post_vessels_vessels_voyage_risk_score` | [stub] Create/invoke /vessels/vessels/voyage-risk/score (vessels-voyage-risk) |

<a id="web-push-subscriptions"></a>

## web-push-subscriptions

Auto-generated tag for web-push-subscriptions route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /web-push/web-push/subscriptions | `web_push_subscriptions_get_web_push_web_push_subscriptions` | [stub] List/get /web-push/web-push/subscriptions (web-push-subscriptions) |
| `POST` | /web-push/web-push/subscriptions | `web_push_subscriptions_post_web_push_web_push_subscriptions` | [stub] Create/invoke /web-push/web-push/subscriptions (web-push-subscriptions) |
| `DELETE` | /web-push/web-push/subscriptions | `web_push_subscriptions_delete_web_push_web_push_subscriptions` | [stub] Delete /web-push/web-push/subscriptions (web-push-subscriptions) |
| `GET` | /web-push/web-push/subscriptions/me | `web_push_subscriptions_get_web_push_web_push_subscriptions_me` | [stub] List/get /web-push/web-push/subscriptions/me (web-push-subscriptions) |
| `GET` | /web-push/web-push/vapid-public-key | `web_push_subscriptions_get_web_push_web_push_vapid_public_key` | [stub] List/get /web-push/web-push/vapid-public-key (web-push-subscriptions) |

<a id="worldline"></a>

## worldline

Auto-generated tag for worldline route group

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /worldline/worldline/sources | `worldline_get_worldline_worldline_sources` | [stub] List/get /worldline/worldline/sources (worldline) |
| `POST` | /worldline/worldline/sources | `worldline_post_worldline_worldline_sources` | [stub] Create/invoke /worldline/worldline/sources (worldline) |
| `GET` | /worldline/worldline/sources/{slug} | `worldline_get_worldline_worldline_sources_slug` | [stub] List/get /worldline/worldline/sources/{slug} (worldline) |
| `POST` | /worldline/worldline/sources/{slug}/fetch | `worldline_post_worldline_worldline_sources_slug_fetch` | [stub] Create/invoke /worldline/worldline/sources/{slug}/fetch (worldline) |
| `GET` | /worldline/worldline/sources/{slug}/history | `worldline_get_worldline_worldline_sources_slug_history` | [stub] List/get /worldline/worldline/sources/{slug}/history (worldline) |

<a id="auth-2"></a>

## Auth

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /auth/user | `getCurrentAuthUser` | Get the currently authenticated user |
| `GET` | /callback | `handleBrowserLoginCallback` | Complete the browser OIDC login flow |
| `GET` | /login | `beginBrowserLogin` | Start the browser OIDC login flow |
| `GET` | /logout | `logoutBrowserSession` | Clear the session and begin OIDC logout |
| `POST` | /mobile-auth/logout | `logoutMobileSession` | Delete a mobile session token |
| `POST` | /mobile-auth/token-exchange | `exchangeMobileAuthorizationCode` | Exchange a mobile OIDC code for a session token |

---

_This file is auto-generated. Edit `lib/api-spec/openapi.yaml` to update the spec, then run `pnpm docs:generate`._
