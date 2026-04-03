# Route Inventory — SZL Holdings Platform

> Complete inventory of all routes across the SZL Holdings platform with public/private/internal classification.

Last updated: 2026-04-03

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
| `/lyte/demo` | Lyte Demo | DEMO | Redirects to Lyte Command Center |
| `/pilot/prism-counsel` | PRISM Counsel Pilot | DEMO | Pilot flow |
| `/pilot/terra` | Terra Pilot | DEMO | Pilot flow |
| `/pilot/vessels` | Vessels Pilot | DEMO | Pilot flow |
| `/pilot/aegis` | Aegis Pilot | DEMO | Pilot flow |

### Authenticated App Routes (PRISM Counsel)

| Route | Title | Flag |
|-------|-------|------|
| `/prism-counsel` | Dashboard | PRIVATE |
| `/prism-counsel/matters` | Matters List | PRIVATE |
| `/prism-counsel/matters/:id` | Matter Detail | PRIVATE |
| `/prism-counsel/forecast` | Forecast | PRIVATE |
| `/prism-counsel/deadlines` | Deadlines | PRIVATE |
| `/prism-counsel/discovery` | Discovery | PRIVATE |
| `/prism-counsel/playbooks` | Playbooks | PRIVATE |
| `/prism-counsel/approvals` | Approvals | PRIVATE |
| `/prism-counsel/copilot` | Copilot | PRIVATE |
| `/prism-counsel/parties` | Parties | PRIVATE |
| `/prism-counsel/trust` | Trust | PRIVATE |
| `/prism-counsel/admin` | Admin | PRIVATE |
| `/prism-counsel/watchlist` | Watchlist | PRIVATE |
| `/prism-counsel/insurer-intel` | Insurer Intel | PRIVATE |
| `/prism-counsel/venue-intel` | Venue Intel | PRIVATE |
| `/prism-counsel/no-fault` | No Fault | PRIVATE |
| `/prism-counsel/connectors` | Connectors | PRIVATE |
| `/prism-counsel/matter-twin` | Matter Twin | PRIVATE |
| `/prism-counsel/pressure-graph` | Pressure Graph | PRIVATE |
| `/prism-counsel/proof-chain` | Proof Chain | PRIVATE |
| `/prism-counsel/worldline` | Worldline | PRIVATE |
| `/prism-counsel/copilot-workbench` | Copilot Workbench | PRIVATE |
| `/prism-counsel/admin-health` | Admin Health | PRIVATE |
| `/prism-counsel/signal-forge` | Signal Forge | PRIVATE |
| `/prism-counsel/forecast-diff` | Forecast Diff | PRIVATE |

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

## Lyte Command Center (`artifacts/lyte-command-center`)

Full application at `/lyte-command-center/`. Flag: `DEMO` (requires context for external viewing).

---

## Aegis / Firestorm (`artifacts/firestorm`)

Full application at `/firestorm/`. Flag: `DEMO`.

---

## Vessels (`artifacts/vessels`)

Full application at `/vessels/`. Flag: `DEMO`.

---

## Terra (`artifacts/terra`)

Full application at `/terra/`. Flag: `DEMO`.

---

## Carlota Jo (`artifacts/carlota-jo`)

Full application at `/carlota-jo/`. Flag: `PUBLIC` (live, client-facing).

---

## Stephen Site (`artifacts/stephen-site`)

Personal site at `/stephen/`. Flag: `PUBLIC`.

---

## API Server (`artifacts/api-server`)

Backend API at `/api`. Flag: `INTERNAL`.

Key endpoints:
- `/api/health` — health check (PUBLIC)
- `/api/cms/*` — CMS data endpoints (authenticated)
- `/api/config/*` — configuration endpoints (authenticated)
- `/api/auth/*` — authentication endpoints

---

## Mobile Apps

All mobile apps are Expo-based and accessed via Expo Dev Client tunnel, not the Replit proxy.

| App | Flag | Notes |
|-----|------|-------|
| `szl-holdings-mobile` | INTERNAL | Executive command mobile |
| `aegis-mobile` | DEMO | SOC command mobile |
| `vessels-mobile` | DEMO | Fleet command mobile |
| `terra-mobile` | DEMO | Field intelligence mobile |
| `lyte-mobile` | DEMO | AIOps command mobile |
| `stephen-mobile` | INTERNAL | Personal command |
| `carlota-jo-mobile` | PRIVATE | Client app (live) |
