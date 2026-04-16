# Route Inventory — SZL Holdings Platform

> Complete inventory of all routes across the SZL Holdings platform with public/private/internal classification.

Last updated: 2026-04-16

---

## Classification Key

| Flag | Meaning |
|------|---------|
| `PUBLIC` | Safe to share externally, indexed by search engines |
| `DEMO` | Requires demo context; show to prospects with guidance |
| `PRIVATE` | Requires authentication; internal or client-only |
| `INTERNAL` | Operational tools; never share externally |
| `STAGING` | Development/sprint routes; not for external viewing |

---

## SZL Holdings Web App (`artifacts/szl-holdings`)

### Public Marketing Routes

| Route | Title | Flag | Notes |
|-------|-------|------|-------|
| `/` | SZL Holdings — Governed Operational Intelligence | PUBLIC | Main landing |
| `/platform` | Platform | PUBLIC | Platform overview |
| `/lyte` | Lyte — Business Observability | PUBLIC | Product page |
| `/alloy-fabric` | Alloy — Execution Fabric | PUBLIC | Product page |
| `/solutions` | Solutions | PUBLIC | Solutions hub |
| `/solutions/aegis` | Aegis — Security & Defense | PUBLIC | Vertical page |
| `/solutions/vessels` | Vessels — Maritime Intelligence | PUBLIC | Vertical page |
| `/solutions/terra` | Terra — Real Estate Intelligence | PUBLIC | Vertical page |
| `/solutions/prism-counsel` | PRISM Counsel | PUBLIC | Vertical page |
| `/design-partners` | Design Partners | PUBLIC | Partner program |
| `/contact` | Contact | PUBLIC | Contact form |
| `/pricing` | Pricing | PUBLIC | Pricing page |
| `/status` | System Status | PUBLIC | Status page |
| `/how-it-works` | How It Works | PUBLIC | Explainer |
| `/docs` | Documentation | PUBLIC | Developer docs |
| `/docs/architecture` | Architecture | PUBLIC | Technical docs |
| `/docs/control-plane` | Control Plane | PUBLIC | Technical docs |
| `/docs/worldline` | Worldline | PUBLIC | Technical docs |
| `/docs/proof-chain` | Proof Chain | PUBLIC | Technical docs |
| `/docs/model-mesh` | Model Mesh | PUBLIC | Technical docs |
| `/docs/trust` | Trust Documentation | PUBLIC | Trust docs |
| `/docs/github` | GitHub Integration | PUBLIC | Integration docs |
| `/legal/privacy` | Privacy Policy | PUBLIC | Legal |
| `/legal/terms` | Terms of Service | PUBLIC | Legal |
| `/accessibility` | Accessibility Statement | PUBLIC | Legal/compliance |

### Trust Routes

| Route | Title | Flag | Notes |
|-------|-------|------|-------|
| `/trust-center` | Trust Center | PUBLIC | Main trust hub |
| `/trust` | Trust Overview | PUBLIC | Trust landing |
| `/trust/security` | Security | PUBLIC | Security posture |
| `/trust/governance` | Governance | PUBLIC | Governance model |
| `/trust/architecture` | Architecture | PUBLIC | Technical trust |
| `/trust/ai` | AI Governance | PUBLIC | AI trust posture |
| `/trust/approvals` | Approvals | PUBLIC | Approval framework |
| `/trust/exports` | Data Exports | PUBLIC | Data portability |
| `/trust/operations` | Operations | PUBLIC | Operational trust |

### Solution Trust Routes

| Route | Flag |
|-------|------|
| `/solutions/prism-counsel/trust` | PUBLIC |
| `/solutions/terra/trust` | PUBLIC |
| `/solutions/vessels/trust` | PUBLIC |
| `/solutions/aegis/trust` | PUBLIC |
| `/solutions/lyte/trust` | PUBLIC |

### Standalone Public Product Pages

| Route | Title | Flag |
|-------|-------|------|
| `/prism-counsel-public` | PRISM Counsel | PUBLIC |
| `/terra-public` | Terra | PUBLIC |
| `/vessels-public` | Vessels | PUBLIC |
| `/aegis-public` | Aegis | PUBLIC |
| `/carlota-jo-public` | Carlota Jo | PUBLIC |

### Demo Routes (Require Context)

| Route | Title | Flag | Notes |
|-------|-------|------|-------|
| `/demo` | Demo | DEMO | Demo request / live demo |
| `/lyte/demo` | Lyte Demo | DEMO | Demo entry |
| `/pilot/prism-counsel` | PRISM Counsel Pilot | DEMO | Pilot flow |
| `/pilot/terra` | Terra Pilot | DEMO | Pilot flow |
| `/pilot/vessels` | Vessels Pilot | DEMO | Pilot flow |
| `/pilot/aegis` | Aegis Pilot | DEMO | Pilot flow |

### Authenticated App Routes (Alloy)

| Route | Flag |
|-------|------|
| `/alloy` | PRIVATE |
| `/alloy/factory-floor` | PRIVATE |
| `/alloy/execution-history` | PRIVATE |
| `/alloy/runs/:id` | PRIVATE |
| `/alloy/signal-feed` | PRIVATE |
| `/alloy/workflow-orchestration` | PRIVATE |
| `/alloy/connector-mesh` | PRIVATE |
| `/alloy/governance-audit` | PRIVATE |
| `/alloy/enterprise-governance` | PRIVATE |
| `/alloy/automation-analytics` | PRIVATE |
| `/alloy/dag-view` | PRIVATE |
| `/alloy/document-engine` | PRIVATE |
| `/alloy/workspace` | PRIVATE |
| `/alloy/decision-objects` | PRIVATE |
| `/alloy/skill-registry` | PRIVATE |
| `/alloy/operator-control` | PRIVATE |
| `/alloy/research-mode` | PRIVATE |
| `/alloy/artifact-studio` | PRIVATE |
| `/alloy/browser-operator` | PRIVATE |
| `/alloy/policy-manager` | PRIVATE |
| `/alloy/admin-analytics` | PRIVATE |
| `/alloy/usage-metering` | PRIVATE |
| `/alloy/canonical-demos` | PRIVATE |
| `/alloy/pilot-onboarding` | PRIVATE |
| `/alloy/mcp-store` | PRIVATE |
| `/alloy/mcp-tool-creator` | PRIVATE |
| `/alloy/creative/campaigns` | PRIVATE |
| `/alloy/creative/campaigns/:id` | PRIVATE |
| `/alloy/creative/brand-voice` | PRIVATE |
| `/alloy/creative/content-calendar` | PRIVATE |
| `/alloy/creative/ai-studio` | PRIVATE |

### Founder Routes

| Route | Title | Flag |
|-------|-------|------|
| `/founder` | Stephen Lutar | PRIVATE |

### Internal / Admin Routes

| Route | Title | Flag | Notes |
|-------|-------|------|-------|
| `/admin` | Admin | INTERNAL | CMS admin (PIN-gated) |
| `/kpi-dashboard` | KPI Dashboard | INTERNAL | Business metrics |
| `/ownership-os` | Ownership OS | INTERNAL | Internal tool |
| `/ops` | Ops Overview | INTERNAL | Internal ops dashboard |
| `/ops/releases` | Releases | INTERNAL | Release management |
| `/ops/qa` | QA Status | INTERNAL | Quality status |
| `/ops/content` | Content | INTERNAL | Content management |
| `/ops/screenshots` | Screenshots | INTERNAL | Screenshot management |
| `/ops/trust` | Trust Status | INTERNAL | Trust posture |
| `/ops/demo-state` | Demo State | INTERNAL | Demo env management |
| `/ops/env-check` | Env Check | INTERNAL | Environment validation |
| `/ops/integrations` | Integrations | INTERNAL | Integration status |
| `/ops/incidents` | Incidents | INTERNAL | Incident management |
| `/ops/checklists` | Checklists | INTERNAL | Operational checklists |

### Investor Routes

| Route | Title | Flag | Notes |
|-------|-------|------|-------|
| `/investors` | Investors Hub | PRIVATE | NDA required |
| `/investors/overview` | Overview | PRIVATE | |
| `/investors/architecture` | Architecture | PRIVATE | |
| `/investors/moat` | Competitive Moat | PRIVATE | |
| `/investors/roadmap` | Roadmap | PRIVATE | |
| `/investors/trust` | Trust | PRIVATE | |
| `/investors/data-room` | Data Room | PRIVATE | Highly restricted |
| `/investors/founder` | Founder | PRIVATE | |

### Staging / Sprint Routes

| Route | Flag | Notes |
|-------|------|-------|
| `/s31/*` | STAGING | Sprint 31 routes |
| `/s32/*` | STAGING | Sprint 32 routes |
| `/pilot/*` | STAGING | Pilot-specific flows |
| `/ny/*` | STAGING | NY-specific legal routes |
| `/azure-tenant-onboarding` | STAGING | Enterprise onboarding |
| `/azure-tenant-dashboard` | STAGING | Enterprise dashboard |
| `/tenant-branding` | STAGING | White-label config |
| `/powerbi-config` | STAGING | BI integration |
| `/scim-provisioning` | STAGING | SCIM setup |
| `/capital-arsenal` | STAGING | Fundraising tool |

---

## Aegis (`artifacts/aegis`)

Full application at `/aegis/`. Flag: `DEMO`. 166 ts/tsx files.
Supersedes the archived firestorm artifact.

---

## Vessels (`artifacts/vessels`)

Full application at `/vessels/`. Flag: `DEMO`. 103 ts/tsx files.

---

## Terra (`artifacts/terra`)

Full application at `/terra/`. Flag: `DEMO`. 92 ts/tsx files.

---

## Carlota Jo (`artifacts/carlota-jo`)

Full application at `/carlota-jo/`. Flag: `PUBLIC` (live, client-facing). 70 ts/tsx files.

---

## Command (`artifacts/command`)

Full application at `/command/`. Flag: `DEMO`. 223 ts/tsx files.
Unified ops command — absorbs former Lyte Command Center and IMPERIUM surfaces.

> **Route notation:** The Command Wouter router uses `/command` as its base. In-app paths beginning with `/operations/` are the actual browser URL suffix (e.g., `/command/operations/governed-decision-loop`). The tables below list the in-app paths only; prepend `/command` to get the full URL. This is a curated list of key routes — the full route table is in `artifacts/command/src/App.tsx`.

### Flagship Loop Routes

| Route | Title | Flag | Primitive |
|-------|-------|------|-----------|
| `/operations/governed-decision-loop` | Governed Decision Loop | DEMO | All 5 |

### Core Ops Routes (Lyte)

| Route | Title | Flag | Notes |
|-------|-------|------|-------|
| `/operations` | Executive Command | DEMO | Primary ops dashboard |
| `/operations/inbox` | Command Inbox | DEMO | Signal inbox |
| `/operations/prism` | PRISM Dashboard | DEMO | 5-pillar intelligence view |
| `/operations/prism/pulse` | Pulse | DEMO | System/business health |
| `/operations/prism/risk` | Risk | DEMO | Exposure and vulnerability |
| `/operations/prism/intelligence` | Intelligence | DEMO | Analysis and insights |
| `/operations/prism/signals` | Signals Feed | DEMO | Real-time events |
| `/operations/prism/motion` | Motion | DEMO | Workflow and action |
| `/operations/approvals` | Approvals Center | DEMO | Human-in-the-loop gate |
| `/operations/ownership` | Ownership Map | DEMO | Accountability graph |
| `/operations/escalation` | Escalation Center | DEMO | Escalation management |
| `/operations/trust-audit` | Trust & Audit | DEMO | Governance audit trail |
| `/operations/action-queue` | Action Queue | DEMO | Pending decisions |
| `/operations/blocker-board` | Blocker Board | DEMO | Critical blockers |
| `/operations/digest` | Digest Center | DEMO | AI digest reports |
| `/operations/queue` | Operational Queue | DEMO | Queued work items |

### Alloy Fabric Routes (within Command)

| Route | Title | Flag |
|-------|-------|------|
| `/operations/alloy/canvas` | Workflow Canvas | DEMO |
| `/operations/alloy/actions` | Action Console | DEMO |
| `/operations/alloy/templates` | Workflow Templates | DEMO |
| `/operations/alloy/governance` | Governance Audit | DEMO |
| `/operations/alloy/simulate` | Policy Simulation | DEMO |
| `/operations/alloy/traces` | Execution Traces | DEMO |
| `/operations/alloy/receipts` | Trust Receipts | DEMO |
| `/operations/alloy/replay` | Replay Timeline | DEMO |
| `/operations/alloy/agents` | Agent Monitor | DEMO |
| `/operations/alloy/handoffs` | Agent Handoffs | DEMO |
| `/operations/alloy/compiler` | Graph Compiler | DEMO |
| `/operations/alloy/intelligence` | Intelligence Fabric | DEMO |
| `/operations/alloy/integrations` | Integration Health | DEMO |
| `/operations/alloy/gates` | Write-Back Gates | DEMO |

---

## API Server (`artifacts/api-server`)

Backend API at `/api`. Flag: `INTERNAL`. 395 ts/tsx files.

Key endpoints:
- `/api/health` — health check (PUBLIC)
- `/api/cms/*` — CMS data endpoints (authenticated)
- `/api/config/*` — configuration endpoints (authenticated)
- `/api/auth/*` — authentication endpoints

---

## Mobile App

| App | Artifact | Flag | Notes |
|-----|----------|------|-------|
| CORTEX (SZL Holdings Mobile) | `szl-holdings-mobile` | PRIVATE | Primary mobile app — 167 ts/tsx files |

Note: `cortex-mobile` is a bare scaffold (2 files) — not a functional app. The real mobile app is `szl-holdings-mobile`.

---

## Archived Surfaces

The following artifacts have been archived (app source removed — no pages/components/routes; marker files, stale dist/node_modules, and residual config may remain):

| Surface | Former Path | Disposition |
|---------|-------------|-------------|
| Lyte Command Center | `/lyte-command-center/` | Merged into Command (`/command/`) |
| Firestorm | `/firestorm/` | Superseded by Aegis (`/aegis/`) |
| IMPERIUM | `/imperium/` | Merged into Command (`/command/`) |
| PRISM Counsel | `/prism-counsel/` | Deprecated (task #579) |
| Stephen Site | `/stephen/` | Content moved to `/founder` in SZL Holdings |
