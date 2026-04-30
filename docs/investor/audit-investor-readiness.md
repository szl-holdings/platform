# Investor Readiness Audit
**Date:** April 16, 2026  
**Scope:** All 14 artifact directories in the monorepo  
**Purpose:** Exhaustive pre-demo audit — complete per-route inventory, runtime health, data wiring, cross-app consistency, full API↔UI matrix, and prioritized fix backlog  
**Method:** Static code analysis only (`grep`, `find`, `tsc --noEmit`, route file extraction). No product code was modified.

---

## Executive Summary

| Metric | Value |
|---|---|
| Total artifact directories audited | 14 |
| Active / shippable apps | 7 |
| Archived / deprecated (no `src/`) | 6 |
| Total routes/screens across active apps | **847** (730 web + 117 mobile) |
| Routes with ≥1 live API call | ~250 (~30%) |
| Routes primarily on hardcoded / local-file data | ~597 (~70%) |
| Red-flag string occurrences (all active apps) | **611** across 220+ files |
| Apps passing TypeScript typecheck | 3 of 7 (Aegis ✅, Carlota Jo ✅, Command ✅) |
| Apps failing TypeScript typecheck | 4 of 7 (Vessels ❌, Terra ❌, SZL Holdings ❌, API Server ❌) |
| Total API endpoints implemented in API server | **2,243 distinct method+path combinations** |
| API endpoints with confirmed UI callers | ~42 (confirmed), ~180 plausibly called |

---

## Top 10 Demo Blockers

| # | App | Blocker | Location |
|---|---|---|---|
| 1 | **Vessels** | `/dashboard/billing`, `/dashboard/team`, `/dashboard/audit-log` are raw inline stub text — no UI | `App.tsx` inline Route elements |
| 2 | **SZL Mobile** | "Case studies coming soon" (line 714) and "Articles coming soon" (line 778) on the primary Founder tab | `founder/(tabs)/index.tsx` |
| 3 | **SZL Holdings** | `admin.backup.tsx` causes a `apiFetch` TypeScript compile error — stale 2,200-line file coexisting with `admin.tsx` | `src/pages/admin.backup.tsx` |
| 4 | **SZL Holdings** | `admin.tsx` references `Building2`, `UserCheck` — neither is imported — admin page crashes or shows broken icons | `src/pages/admin.tsx:130,308` |
| 5 | **Aegis** | `unified-settings.tsx` shows literal "Coming soon." for the majority of settings panel content | `src/pages/settings/unified-settings.tsx` |
| 6 | **Vessels** | `marketing-demo.tsx` references undefined `API_BASE` — TypeScript compile error, page likely throws at runtime | `src/pages/marketing-demo.tsx:17` |
| 7 | **Terra** | `distress-engine.tsx` references undefined `API_BASE` three times — page broken | `src/pages/distress-engine.tsx:14,18,524` |
| 8 | **SZL Holdings** | `ai-cost-analytics.tsx` and `demo.tsx` both reference undefined `API_BASE` — TypeScript errors | Multiple pages |
| 9 | **Command** | 8 operation routes use `DemoXxx`-named components (`DemoSignals`, `DemoAlerts`, etc.) — visible in source if screen-shared | `App.tsx` operations routes |
| 10 | **SZL Mobile** | `intelligence/index.tsx` is a single-file stub with no tabs and no content — entire Intelligence workspace is empty | `intelligence/index.tsx` |

---

## Runtime Health: TypeScript Typecheck Results

All apps were typechecked by running `tsc -p tsconfig.json --noEmit` in each artifact directory. Results are exact compiler output.

| App | Result | Errors | Key Error Details |
|---|---|---|---|
| **Aegis** | ✅ PASS | 0 | Clean |
| **Vessels** | ❌ FAIL | 9 | `data/types.ts` — circular import aliases for `ComplianceCertificate`, `PortStateDeficiency`, `ShipmentRecord`, `EventLog`, `EmissionRecord`, `AIBriefing`, `PredictiveMaintenance`, `ForecastModule`, `SanctionsRiskIndicator`, `ComplianceAlert`, `Fleet` (TS2303); `applied-intelligence.tsx:64` — implicit `any` on `item`, `i` (TS7006); `fleet-dashboard.tsx:15` — `AnimatedCounter` import conflict (TS2440); `logs-explorer.tsx:82` — implicit `any` index type (TS7053); `marketing-demo.tsx:17` — `API_BASE` not defined (TS2304); `predictive-maintenance.tsx:192` — `ChevronRight` not defined (TS2304); `trading-desk.tsx:600` — `instrumentId` does not exist on `Fill`, did you mean `instrument`? (TS2551) |
| **Terra** | ❌ FAIL | 5 | `commercial-intelligence.tsx:6` — `apiFetch` import conflict (TS2440); `commercial-intelligence.tsx:10` — `API_BASE` not defined (TS2304); `distress-engine.tsx:14,18,524` — `API_BASE` not defined ×3 (TS2304) |
| **Carlota Jo** | ✅ PASS | 0 | Clean |
| **Command** | ✅ PASS | 0 | Clean |
| **SZL Holdings** | ❌ FAIL | 22 | `admin.backup.tsx:4` — `apiFetch` import conflict (TS2440); `admin.tsx:130` — `Building2` not defined (TS2304); `admin.tsx:308` — `UserCheck` not defined (TS2304); `ai-cost-analytics.tsx:77,86` — `API_BASE` not defined ×2 (TS2304); `azure-tenant-dashboard.tsx:4` — `apiFetch` import conflict (TS2440); `azure-tenant-onboarding.tsx:3` — `apiFetch` import conflict (TS2440); `core-command.tsx:812` — `{}` not assignable to `Key \| null \| undefined` (TS2322); `crm-intelligence.tsx:283,284` — `probability` does not exist on union type (TS2339); `decisioning-command.tsx:785` — `urgency: string` not assignable to `"critical" \| "moderate" \| "urgent" \| "routine"` (TS2322); `demo.tsx:287` — `API_BASE` not defined (TS2304); `developers.tsx:143-146` — `Globe`, `Database`, `Webhook`, `Terminal` not defined (TS2304); `ops-dependency-map.tsx:324` — `textTransform` not a valid `SVGTextElementAttributes` prop (TS2322); `powerbi-config.tsx:4` — `apiFetch` import conflict (TS2440); `scim-provisioning.tsx:4` — `apiFetch` import conflict (TS2440); `tenant-branding.tsx:4` — `apiFetch` import conflict (TS2440); `tenant-health-scorecards.tsx:282` ×3 — string union vs literal `"all"` comparison always false (TS2367) |
| **SZL Mobile** | N/A (Expo/Metro bundler) | — | Health determined at Metro bundle time; no standard `tsc --noEmit` available |
| **API Server** | ❌ FAIL | 3 | `decisioning.ts:43` — `packages/decision-engine/dist/index.d.ts` not built (TS6305); `decisioning.ts:53` — `packages/policy-engine/dist/index.d.ts` not built (TS6305); `decisioning.ts:62` — `packages/action-engine/dist/index.d.ts` not built (TS6305) |

---

## App-by-App Findings

---

### App 1: Aegis — Unified Defense & Intelligence Command
**Directory:** `artifacts/aegis` | **Preview:** `/aegis/`  
**TypeScript:** ✅ PASS (0 errors)  
**Total `.tsx` files:** 155  
**Data pattern:** 58 pages with `useQuery`/`fetch` (37%); ~20 pages importing from `src/data/` local JSON/ts files; ~77 pages fully hardcoded

**Red Flag Strings:** 108 occurrences across 30 files (top files: `nexus/analyst-workspace.tsx`, `msp/rmm-console.tsx`, `msp/service-desk.tsx`, `phantom/tabletop.tsx`, `intel/willaq-umu.tsx`, `stix-taxii.tsx`)

#### Complete Route Inventory

| Route | Component | Data | Status |
|---|---|---|---|
| `/` | → redirect `/command-home` | — | `live` |
| `/home` | AegisHome | static | `live` |
| `/pricing` | AegisPricing | static | `live` |
| `/demo` | EnterpriseDemoPage | static | `hardcoded` |
| `/command-home` | CommandHome | API | `partial` |
| `/pulse` | Pulse | API | `partial` |
| `/investigations` | InvestigationsBoard | API | `partial` |
| `/decision-console` | DecisionConsole | static | `hardcoded` |
| `/response-orchestration` | ResponseOrchestration | static | `hardcoded` |
| `/executive-board` | ExecutiveBoardView | API | `partial` |
| `/citadel` | CitadelWarRoom | static | `hardcoded` |
| `/citadel/playbooks` | CitadelPlaybooks | static | `hardcoded` |
| `/citadel/after-action` | CitadelAfterAction | static | `hardcoded` |
| `/gov/operator-analytics` | OperatorAnalytics | API | `partial` |
| `/gov/incident-analytics` | IncidentAnalytics | API | `partial` |
| `/gov/trust-analytics` | TrustAnalytics | API | `partial` |
| `/gov/governance` | EnterpriseGovernance | mixed | `partial` |
| `/gov/executive-reports` | ExecutiveReports | static | `hardcoded` |
| `/gov/integrations` | IntegrationHub | mixed | `partial` |
| `/gov/canonical-demo` | CanonicalDemo | static | `hardcoded` |
| `/gov/trust` | TrustPositioning | static | `hardcoded` |
| `/gov/agent-config` | AgentConfig | API | `partial` |
| `/trust-provenance` | TrustProvenancePage | static | `hardcoded` |
| `/soc` | SocDashboard | API | `partial` |
| `/soc/action-queue` | ActionQueue | API | `partial` |
| `/soc/governance` | GovernanceReview | static | `hardcoded` |
| `/soc/readiness` | IncidentReadinessView | static | `hardcoded` |
| `/soc/threat-desk` | ThreatDesk | static | `hardcoded` |
| `/soc/what-changed` | AegisWhatChanged | static | `hardcoded` |
| `/sacsayhuaman-shield` | SacsayhuamanShield | static | `hardcoded` |
| `/incidents` | IncidentsPage | API | `partial` |
| `/alerts` | AlertsPage | API | `partial` |
| `/cases` | CasesPage | API | `partial` |
| `/asset-inventory` | AssetInventory | API | `partial` |
| `/vulnerabilities` | VulnerabilityDashboard | API | `partial` |
| `/vuln-lifecycle` | VulnLifecycle | static | `hardcoded` |
| `/mitre-attack` | MitreAttackPage | API | `partial` |
| `/threat-intel` | ThreatIntel | static | `hardcoded` |
| `/threat-feed` | ThreatIntelFeed | static | `hardcoded` |
| `/findings` | FindingsPage | API | `partial` |
| `/simulation-panel` | SimulationPanel | mock | `hardcoded` |
| `/hardening-controls` | HardeningControls | API | `partial` |
| `/document-engine` | DocumentEngine | API | `partial` |
| `/document-engine/:sub` | DocumentEngine sub | API | `partial` |
| `/phantom/war-room` | PhantomWarRoom | static | `hardcoded` |
| `/phantom/purple-exercise` | PhantomPurpleExercise | static | `hardcoded` |
| `/phantom/tabletop` | PhantomTabletop | mock | `hardcoded` |
| `/sentinel` | SentinelDashboard | static | `hardcoded` |
| `/sentinel/behavioral` | SentinelBehavioral | mock | `hardcoded` |
| `/threat-sim-report` | ThreatSimReport | static | `hardcoded` |
| `/agentic-soc` | AgenticSOC | static | `hardcoded` |
| `/deception-grid` | DeceptionGrid | static | `hardcoded` |
| `/mtd-engine` | MTDEngine | static | `hardcoded` |
| `/digital-twin` | DigitalTwin | static | `hardcoded` |
| `/hunt-agents` | HuntAgents | static | `hardcoded` |
| `/compliance-evidence` | ComplianceEvidence | API | `partial` |
| `/cyber-insurance-intel` | CyberInsuranceIntel | static | `hardcoded` |
| `/cyber-insurance` | CyberInsuranceScore | static | `hardcoded` |
| `/soar-builder` | SoarBuilder | static | `hardcoded` |
| `/soar-playbooks` | SoarPlaybooks | static | `hardcoded` |
| `/adversary-engine` | AdversaryEngine | static | `hardcoded` |
| `/adversary-emulation` | AptEmulation | static | `hardcoded` |
| `/xdr-workbench` | XDRIncidentWorkbench | mock | `hardcoded` |
| `/xdr-console` | XDRConsole | static | `hardcoded` |
| `/threat-graph` | ThreatGraph | static | `hardcoded` |
| `/threat-kill-chain` | ThreatKillChain | static | `hardcoded` |
| `/threat-hunting` | ThreatHunting | mock | `hardcoded` |
| `/identity-threat` | IdentityThreat | static | `hardcoded` |
| `/forensics` | ForensicsTimeline | static | `hardcoded` |
| `/executive-risk` | ExecutiveRisk | static | `hardcoded` |
| `/risk-scoring` | RiskScoring | static | `hardcoded` |
| `/reports` | ReportsPage | static | `hardcoded` |
| `/compliance` | CompliancePage | API | `partial` |
| `/cr/dashboard` | ReadinessDashboard | API | `partial` |
| `/cr/scorecards` | FrameworkScorecards | static | `hardcoded` |
| `/cr/risks` | ComplianceRisks | static | `hardcoded` |
| `/cr/vendor-risk` | VendorRisk | mock | `hardcoded` |
| `/cr/financial-compliance` | FinancialCompliance | API | `partial` |
| `/cr/milestones` | MilestonesTrends | static | `hardcoded` |
| `/cr/ai-insights` | ReadinessAiInsights | static | `hardcoded` |
| `/intel/dashboard` | IntelDashboard | API | `partial` |
| `/intel/models` | Models | static | `hardcoded` |
| `/intel/predictions` | Predictions | static | `hardcoded` |
| `/intel/projects` | Projects | mock | `hardcoded` |
| `/intel/insights` | Insights | static | `hardcoded` |
| `/intel/agent-autonomy` | AgentAutonomy | API | `partial` |
| `/intel/agent-autonomy/agents` | AgentAutonomy — agents tab | API | `partial` |
| `/intel/agent-autonomy/skills` | AgentAutonomy — skills tab | API | `partial` |
| `/intel/agent-autonomy/connectors` | AgentAutonomy — connectors tab | API | `partial` |
| `/intel/agent-autonomy/rag` | AgentAutonomy — rag tab | API | `partial` |
| `/intel/agent-autonomy/a2a` | AgentAutonomy — a2a tab | API | `partial` |
| `/intel/agent-autonomy/self-improvement` | AgentAutonomy — self-improvement tab | API | `partial` |
| `/intel/dual-mind` | DualMindMonitor | static | `hardcoded` |
| `/intel/willaq-umu` | WillaqUmu | mock | `hardcoded` |
| `/intel/chasqui-relay` | ChasquiRelay | static | `hardcoded` |
| `/intel/quipu-command` | QuipuCommand | static | `hardcoded` |
| `/intel/llm-evaluation` | LLMEvaluation | API | `partial` |
| `/intel/agent-spawner` | AgentSpawner | mock | `hardcoded` |
| `/intel/gpu-monitoring` | GpuMonitoring | API | `partial` |
| `/agentops-explorer` | AgentOpsExplorer | static | `hardcoded` |
| `/intelligence-fusion-grid` | IntelligenceFusionGrid | static | `hardcoded` |
| `/observability` | Observability | API | `partial` |
| `/predictive-intelligence` | PredictiveIntelligence | static | `hardcoded` |
| `/consciousness` | Consciousness | API | `partial` |
| `/nexus/workspace` | NexusAnalystWorkspace | mock | `hardcoded` |
| `/nexus/correlation` | CrossDomainCorrelation | static | `hardcoded` |
| `/nexus/decisions` | DecisionSupport | static | `hardcoded` |
| `/nexus/early-warning` | EarlyWarning | static | `hardcoded` |
| `/nexus/briefing` | NexusExecutiveBriefing | static | `hardcoded` |
| `/nexus/geo-risk` | GeopoliticalRiskScoring | static | `hardcoded` |
| `/nexus/patterns` | HistoricalPatterns | static | `hardcoded` |
| `/nexus/osint` | OsintPipeline | static | `hardcoded` |
| `/nexus/war-gaming` | ScenarioWargaming | static | `hardcoded` |
| `/nexus/actors` | ThreatActorProfiling | static | `hardcoded` |
| `/ops/dashboard` | MSPDashboard | static | `hardcoded` |
| `/ops/clients` | MSPClients | mock | `hardcoded` |
| `/ops/contracts` | MSPContracts | mock | `hardcoded` |
| `/ops/devices` | MSPDevices | mock | `hardcoded` |
| `/ops/dispatch` | MSPDispatch | static | `hardcoded` |
| `/ops/mrr` | MSPMRRDashboard | static | `hardcoded` |
| `/ops/noc` | MSPNOC | static | `hardcoded` |
| `/ops/revenue` | MSPRevenue | static | `hardcoded` |
| `/ops/rmm` | MSPRMMConsole | mock | `hardcoded` |
| `/ops/service-desk` | MSPServiceDesk | mock | `hardcoded` |
| `/ops/technicians` | MSPTechnicians | static | `hardcoded` |
| `/ops/tickets` | MSPTickets | mock | `hardcoded` |
| `/ops/settings` | MSPProviderSettings | mock | `hardcoded` |
| `/purple-team` | PurpleTeam | static | `hardcoded` |
| `/breach-cost` | BreachCostPredictor | static | `hardcoded` |
| `/threat-cost-translator` | ThreatCostTranslator | static | `hardcoded` |
| `/business-signal-intelligence` | BusinessSignalIntelligence | static | `hardcoded` |
| `/zero-trust-scorecard` | ZeroTrustScorecard | static | `hardcoded` |
| `/stix-taxii` | StixTaxiiPage | mock | `hardcoded` |
| `/tradecraft` | TradecraftEngine | mock | `hardcoded` |
| `/watchlists` | Watchlists | static | `hardcoded` |
| `/scenario-library` | ScenarioLibrary | mock | `hardcoded` |
| `/audit-chain` | AuditChain | API (`/api/audit-chain/events`) | `partial` |
| `/atlas-artifacts` | AtlasArtifacts | API | `partial` |
| `/agent-insights` | AgentInsights | API (`/api/agent-os/feed`) | `partial` |
| `/legal` | LegalWorkspace | static | `live` |
| `/security` | (marketing) | static | `live` |
| `/operator` | (marketing) | static | `live` |
| `/admin` | (marketing) | static | `live` |
| `/settings` | UnifiedSettings | API (partial) | `broken` — "Coming soon." for most panels |
| `/powerbi` | PowerBiReport | static | `hardcoded` |
| `/apt-emulation` | AptEmulation | static | `hardcoded` |
| `/autonomous-threat-engine` | AutonomousThreatEngine | static | `hardcoded` |
| `/attack-path` | AttackPathViz | static | `hardcoded` |
| `/threat-actors` | ThreatActorProfiling | static | `hardcoded` |

---

### App 2: Vessels Maritime Intelligence
**Directory:** `artifacts/vessels` | **Preview:** `/vessels/`  
**TypeScript:** ❌ FAIL (9 errors — see Runtime Health table)  
**Total `.tsx` files:** 86  
**Data pattern:** 33 pages with `useQuery`/`fetch` (38%); 17 pages with local data file imports; 36 pages fully hardcoded

**Red Flag Strings:** 46 occurrences across 18 files

#### Complete Route Inventory

| Route | Data | Status |
|---|---|---|
| `/` | — | → redirect to `/vessels-landing` |
| `/vessels-landing` | static | `live` |
| `/sign-in` | static | `live` |
| `/demo` | static | `live` |
| `/platform` | static | `live` |
| `/pricing` | static | `live` |
| `/capabilities` | static | `live` |
| `/use-cases` | static | `live` |
| `/security` | static | `live` |
| `/legal/privacy` | static | `live` |
| `/legal/terms` | static | `live` |
| `/dashboard` | API | `partial` |
| `/dashboard/fleet` | API | `partial` |
| `/dashboard/vessels` | API | `partial` |
| `/dashboard/vessels/:id` | API | `partial` |
| `/dashboard/routes` | API | `partial` |
| `/dashboard/alerts` | API | `partial` |
| `/dashboard/reports` | API | `partial` |
| `/dashboard/billing` | inline stub | **`empty`** — raw stub text, no billing UI |
| `/dashboard/team` | inline stub | **`empty`** — raw stub text, no team UI |
| `/dashboard/audit-log` | inline stub | **`empty`** — raw stub text, no log UI |
| `/dashboard/settings` | API | `partial` |
| `/fleet` | API | `partial` |
| `/vessel/:id` | API | `partial` |
| `/vessels/:id` | API | `partial` |
| `/vessels-list` | API | `partial` |
| `/exceptions` | API | `partial` |
| `/exception-queue` | API | `partial` |
| `/economics` | API | `partial` |
| `/voyage-pnl` | API | `partial` |
| `/voyage-desk` | API | `partial` |
| `/port-congestion` | API | `partial` |
| `/cargo-tracking` | API | `partial` |
| `/ais-live` | API (`/api/vessels/live/ais`) | `partial` |
| `/commodity-flow` | local data | `hardcoded` |
| `/maintenance` | API | `partial` |
| `/command` | API | `partial` |
| `/analytics` | API | `partial` |
| `/intelligence` | API | `partial` |
| `/corridors` | API | `partial` |
| `/agent-insights` | API (`/api/agent-os/feed`) | `partial` |
| `/command-workflows` | mock | `hardcoded` |
| `/document-engine` | API | `partial` |
| `/document-engine/:sub` | API | `partial` |
| `/route-risk` | local data | `hardcoded` |
| `/routes` | local data | `hardcoded` |
| `/sanctions-screening` | mock | `hardcoded` |
| `/piracy-sanctions` | mock | `hardcoded` |
| `/sts-detection` | local data | `hardcoded` |
| `/dark-vessel-detection` | local data | `hardcoded` |
| `/dark-fleet-economics` | local data | `hardcoded` |
| `/trade-flow-heatmap` | static | `hardcoded` |
| `/trading-desk` | API (broken) | **`broken`** — TS error `instrumentId` vs `instrument` |
| `/freight-rates` | static | `hardcoded` |
| `/demurrage` | static | `hardcoded` |
| `/bunkering` | static | `hardcoded` |
| `/bunker-optimizer` | static | `hardcoded` |
| `/charter-party` | static | `hardcoded` |
| `/co2-emissions` | static | `hardcoded` |
| `/decarbonization` | static | `hardcoded` |
| `/voyage-carbon-passport` | static | `hardcoded` |
| `/synthetics-compliance` | local data | `hardcoded` |
| `/psc-inspector` | local data | `hardcoded` |
| `/performance-analytics` | API | `partial` |
| `/risk-scoring` | static | `hardcoded` |
| `/observability` | API | `partial` |
| `/logs-explorer` | local data | `hardcoded` (also TS error) |
| `/port-analytics` | static | `hardcoded` |
| `/port-twin` | static | `hardcoded` |
| `/infrastructure` | static | `hardcoded` |
| `/digital-twin` | static | `hardcoded` |
| `/insurance-panel` | static | `hardcoded` |
| `/blockchain-bol` | static | `hardcoded` |
| `/trust-provenance` | static | `hardcoded` |
| `/weather` | API | `partial` |
| `/weather-routing` | API | `partial` |
| `/autonomous-routing` | static | `hardcoded` |
| `/disruption-forecast` | local data | `hardcoded` |
| `/crew-tracker` | static | `hardcoded` |
| `/cyber-threats` | static | `hardcoded` |
| `/marketing-demo` | static | **`broken`** — `API_BASE` undefined TS error |
| `/what-changed` | API | `partial` |
| `/approval-review` | API | `partial` |
| `/atlas-artifacts` | API | `partial` |
| `/simulations-page` | mock | `hardcoded` |
| `/predictive-maintenance-ml` | static | **`broken`** — `ChevronRight` undefined |
| `/intelligence-briefs` | mock | `hardcoded` |
| `/applied-intelligence` | API | `partial` |
| `/fleet-apm` | static | `hardcoded` |
| `/pulse` | API | `partial` |
| `/digital-experience` | static | `hardcoded` |

---

### App 3: Terra — Real Estate Intelligence
**Directory:** `artifacts/terra` | **Preview:** `/terra/`  
**TypeScript:** ❌ FAIL (5 errors)  
**Total `.tsx` files:** 74  
**Data pattern:** 17 pages with `useQuery`/`fetch` (23%); 21 pages with local `src/data/` imports; 36 pages fully hardcoded

**Red Flag Strings:** 26 occurrences across 12 files

#### Complete Route Inventory

| Route | Data Source | Status |
|---|---|---|
| `/` | — | → redirect to `/dashboard` |
| `/home` | — | → redirect to `/dashboard` |
| `/dashboard` | local: `brokerage.ts` + `portfolio.ts` | `hardcoded` |
| `/pulse` | API | `partial` |
| `/distress-engine` | local + API (broken) | **`broken`** — `API_BASE` undefined ×3 |
| `/deals` | local: `portfolio.ts` | `hardcoded` |
| `/listings` | local: `brokerage.ts` | `hardcoded` |
| `/leads` | local: `brokerage.ts` | `hardcoded` |
| `/team` | local: `brokerage.ts` | `hardcoded` |
| `/inquiries` | API | `partial` |
| `/agents` | API | `partial` |
| `/case-study` | static | `live` |
| `/market` | local: `portfolio.ts` | `hardcoded` |
| `/transactions` | local: `brokerage.ts` | `hardcoded` |
| `/documents` | local: `brokerage.ts` | `hardcoded` |
| `/offers` | local: `brokerage.ts` | `hardcoded` |
| `/predictions` | local: `brokerage.ts` | `hardcoded` |
| `/automations` | local: `brokerage.ts` | `hardcoded` |
| `/broker-overview` | API | `partial` |
| `/ingestion` | API | `partial` |
| `/commercial` | API (broken) | **`broken`** — import conflict + `API_BASE` undefined |
| `/market-intelligence` | API | `partial` |
| `/market-analytics` | API | `partial` |
| `/comparable-sales` | mock | `hardcoded` |
| `/distress-pipeline` | static | `hardcoded` |
| `/portfolio-dashboard` | local: `portfolio.ts` | `hardcoded` |
| `/investor-mode` | API | `partial` |
| `/pipeline` | local: `portfolio.ts` | `hardcoded` |
| `/property-map` | local: `portfolio.ts` | `hardcoded` |
| `/property/:id` | API | `partial` |
| `/powerbi` | static | `hardcoded` |
| `/document-engine` | API | `partial` |
| `/document-engine/:sub` | API | `partial` |
| `/atlas-artifacts` | API | `partial` |
| `/pricing` | static | `live` |
| `/lender-report` | local: `portfolio.ts` | `hardcoded` |
| `/property-desk` | local: `property-twin.ts` | `hardcoded` |
| `/what-changed` | local: `property-twin.ts` | `hardcoded` |
| `/diligence-prep` | local: `property-twin.ts` | `hardcoded` |
| `/readiness-board` | local: `property-twin.ts` | `hardcoded` |
| `/approval-review` | API | `partial` |
| `/trust-provenance` | static | `hardcoded` |
| `/distress-radar` | API | `partial` |
| `/neighborhood-momentum` | API | `partial` |
| `/seller-motivation` | API | `partial` |
| `/portfolio-scenario` | API | `partial` |
| `/climate-risk-enhanced` | API | `partial` |
| `/computer-vision` | API | `partial` |
| `/zoning-intelligence` | API | `partial` |
| `/avm-engine` | API | `partial` |
| `/rent-roll` | API | `partial` |
| `/title-intelligence` | API | `partial` |
| `/construction-cost` | static | `hardcoded` |
| `/construction-monitor` | static | `hardcoded` |
| `/spatial-walkthrough` | static | `hardcoded` |
| `/lease-abstraction` | API | `partial` |
| `/pro-forma` | static | `hardcoded` |
| `/exchange-1031` | static | `hardcoded` |
| `/tax-appeal` | static | `hardcoded` |
| `/waterfall-calculator` | static | `hardcoded` |
| `/tenant-screening` | static | `hardcoded` |
| `/portfolio-performance` | local: `portfolio.ts` | `hardcoded` |
| `/investment-analysis` | static | `hardcoded` |
| `/causal-drilldown` | API | `partial` |
| `/drift-detection` | API | `partial` |
| `/climate-risk` | static | `hardcoded` |
| `/observability` | API | `partial` |
| `/executive-overview` | API | `partial` |
| `/workflow-health` | API | `partial` |
| `/ir-module` | static | `hardcoded` |
| `/unified-command` | mock | `hardcoded` |
| `/value-recovery` | static | `hardcoded` |
| `/alerts-page` | local: `portfolio.ts` | `hardcoded` |
| `/analytics` | local: `portfolio.ts` | `hardcoded` |
| `/marketing-landing` | static | `live` |

---

### App 4: Carlota Jo Consulting
**Directory:** `artifacts/carlota-jo` | **Preview:** `/carlota-jo/`  
**TypeScript:** ✅ PASS (0 errors)  
**Total `.tsx` files:** 49  
**Data pattern:** 20 pages with `useQuery`/`fetch` (41%); static data from 4 JSON files (`case-studies.json`, `services.json`, `testimonials.json`, `tiers.json`)

**Red Flag Strings:** 66 occurrences across 16 files

#### Complete Route Inventory

| Route | Data | Status |
|---|---|---|
| `/` | static JSON | `live` |
| `/services` | static JSON | `live` |
| `/methodology` | static | `live` |
| `/who-we-serve` | static | `live` |
| `/founder` | static | `live` |
| `/contact` | API (form POST) | `partial` |
| `/approach` | static | `live` |
| `/engage` | form | `partial` |
| `/about` | static | `live` |
| `/inquiries` | API | `partial` |
| `/legal/privacy` | static | `live` |
| `/legal/terms` | static | `live` |
| `/client-portal` | API | `partial` — auth-guarded |
| `/client-portal/documents` | API (`/api/portal/documents`) | `partial` |
| `/client-portal/updates` | API (`/api/portal/updates`) | `partial` |
| `/client-portal/messages` | API (`/api/portal/messages`) | `partial` |
| `/client-portal/settings` | API | `partial` |
| `/book` | API (`/api/booking/services`) | `partial` |
| `/booking` | API (`/api/booking/reservations`) | `partial` |
| `/booking/success` | static | `live` |
| `/booking/cancel` | static | `live` |
| `/booking/follow-up` | static | `live` |
| `/observability` | API | `partial` |
| `/advisory` | API (`/api/intelligence/ai/advisory`) | `partial` |
| `/ai-advisory` | API | `partial` |
| `/engagements` | mock | `hardcoded` |
| `/client-intel` | API | `partial` |
| `/roi-calculator` | mock | `hardcoded` |
| `/brand-audit` | static | `hardcoded` |
| `/content-strategy` | static | `hardcoded` |
| `/document-engine` | API | `partial` |
| `/document-engine/:sub` | API | `partial` |
| `/strategic-diagnostic` | API | `partial` |
| `/competitive-radar` | API | `partial` |
| `/engagement-roi` | API | `partial` |
| `/scenario-simulator` | API | `partial` |
| `/client-health` | API | `partial` |
| `/proposal-generator` | API (`/api/documents/generate`) | `partial` |
| `/consulting-os` | static | `hardcoded` |
| `/knowledge-graph` | API | `partial` |
| `/revenue-intelligence` | API | `partial` |
| `/workshop-platform` | API | `partial` |
| `/expert-network` | API | `partial` |
| `/invisible-service-design` | static | `hardcoded` |
| `/portal-admin` | API (`/api/partner/portals`) | `partial` |
| `/time-tracking` | API | `partial` |
| `/capacity-planner` | static | `hardcoded` |
| `/knowledge-vault` | API | `partial` |
| `/benchmark-database` | static | `hardcoded` |
| `/deliverable-workflow` | static | `hardcoded` |
| `/profitability-analytics` | API | `partial` |
| `/pulse` | API | `partial` |

---

### App 5: Unified Command
**Directory:** `artifacts/command` | **Preview:** `/command/`  
**TypeScript:** ✅ PASS (0 errors)  
**Total own `.tsx` page files:** 22 + ~45 routes served from `@lyte` shared package  
**Data pattern:** Core strategy pages use API; all operations pages use `DemoModeProvider` wrapper

**Red Flag Strings:** 18 occurrences across 7 files

#### Complete Route Inventory

| Route | Component | Data | Status |
|---|---|---|---|
| `/marketing` | MarketingHome | static | `live` |
| `/marketing/apps/:id` | AppDetailPage | static | `live` |
| `/marketing/pricing` | PricingPage | static | `live` |
| `/marketing/signup` | SignupPage | API (`/api/auth/register`) | `partial` — hardcoded `SOCIAL_PROOF` array |
| `/marketing/onboarding` | OnboardingChecklist | localStorage | `partial` — no backend state |
| `/marketing/status` | StatusPage | API (`/api/health`, `/api/public/status/subscribe`) | `partial` |
| `/marketing/verify-email` | VerifyEmail | sessionStorage | `partial` — no real polling |
| `/` | — | — | → redirect |
| `/strategy` | StrategyDashboard | API (`/api/briefing/today`) | `partial` |
| `/strategy/domain/:id` | DomainDrilldown | API | `partial` |
| `/strategy/executive-briefing` | ExecutiveBriefing | API (`/api/briefing/generate`) | `partial` |
| `/strategy/simulation` | SimulationPage | API (`/api/simulation/what-if`) | `partial` |
| `/strategy/briefing` | BriefingHistory | API (`/api/briefing/history?limit=14`) | `partial` |
| `/strategy/correlation-map` | CorrelationMap | static | `hardcoded` |
| `/strategy/signal-chains` | SignalChains | static | `hardcoded` |
| `/operations` | @lyte/ExecutiveCommand | DemoMode | `partial` |
| `/operations/pulse` | @lyte/LytePulse | DemoMode | `partial` |
| `/operations/prism` | @lyte/PrismDashboard | DemoMode | `partial` |
| `/operations/prism/pulse` | @lyte/PrismDashboard | DemoMode | `partial` |
| `/operations/prism/risk` | @lyte/PrismDashboard | DemoMode | `partial` |
| `/operations/prism/intelligence` | @lyte/PrismDashboard | DemoMode | `partial` |
| `/operations/prism/signals` | **@lyte/DemoSignals** | demo mock | `mock` |
| `/operations/prism/motion` | @lyte/ActionQueue | DemoMode | `partial` |
| `/operations/blocker-board` | @lyte/BlockerBoard | DemoMode | `partial` |
| `/operations/digest` | @lyte/DigestCenter | DemoMode | `partial` |
| `/operations/trust-audit` | @lyte/TrustAudit | DemoMode | `partial` |
| `/operations/approvals` | @lyte/ApprovalsCenter | DemoMode | `partial` |
| `/operations/inbox` | @lyte/CommandInbox | DemoMode | `partial` |
| `/operations/ownership` | @lyte/OwnershipMap | DemoMode | `partial` |
| `/operations/escalation` | @lyte/EscalationCenter | DemoMode | `partial` |
| `/operations/queue` | @lyte/OperationalQueue | DemoMode | `partial` |
| `/operations/action-queue` | @lyte/ActionQueue | DemoMode | `partial` |
| `/operations/signals` | **@lyte/DemoSignals** | demo mock | `mock` |
| `/operations/alerts` | **@lyte/DemoAlerts** | demo mock | `mock` |
| `/operations/priorities` | **@lyte/DemoPriorities** | demo mock | `mock` |
| `/operations/workflows` | **@lyte/DemoWorkflows** | demo mock | `mock` |
| `/operations/recommendations` | **@lyte/DemoRecommendations** | demo mock | `mock` |
| `/operations/audit` | **@lyte/DemoAudit** | demo mock | `mock` |
| `/operations/exceptions` | **@lyte/DemoExceptions** | demo mock | `mock` |
| `/operations/readiness` | **@lyte/DemoReadiness** | demo mock | `mock` |
| `/operations/metrics` | @lyte/MetricsExplorer | DemoMode | `partial` |
| `/operations/topology` | @lyte/ServiceTopology | DemoMode | `partial` |
| `/operations/logs` | @lyte/LogExplorer | DemoMode | `partial` |
| `/operations/alert-management` | @lyte/AlertManagement | DemoMode | `partial` |
| `/operations/autonomous-noc` | @lyte/AutonomousNOC | DemoMode | `partial` |
| `/operations/dex` | @lyte/DEXScoring | DemoMode | `partial` |
| `/operations/runbook-studio` | @lyte/RunbookStudio | DemoMode | `partial` |
| `/operations/knowledge-graph` | @lyte/KnowledgeGraph | DemoMode | `partial` |
| `/operations/self-healing` | @lyte/SelfHealing | DemoMode | `partial` |
| `/operations/slo` | @lyte/SLOManagement | DemoMode | `partial` |
| `/operations/finops` | @lyte/FinOps | DemoMode | `partial` |
| `/operations/tracing` | @lyte/DistributedTracing | DemoMode | `partial` |
| `/operations/on-call` | @lyte/OnCallCenter | DemoMode | `partial` |
| `/operations/noise-reduction` | @lyte/NoiseReduction | DemoMode | `partial` |
| `/operations/capacity-planning` | @lyte/CapacityPlanning | DemoMode | `partial` |
| `/operations/change-management` | @lyte/ChangeManagement | DemoMode | `partial` |
| `/operations/synthetic` | @lyte/SyntheticMonitoring | DemoMode | `partial` |
| `/operations/revenue-impact` | @lyte/RevenueImpact | DemoMode | `partial` |
| `/operations/alloy/actions` | @lyte/AlloyActionConsole | DemoMode | `partial` |
| `/operations/alloy/canvas` | @lyte/AlloyWorkflowCanvas | DemoMode | `partial` |
| `/operations/alloy/intelligence` | @lyte/AlloyIntelligence | DemoMode | `partial` |
| `/operations/alloy/governance` | @lyte/AlloyGovernance | DemoMode | `partial` |
| `/operations/alloy/templates` | @lyte/AlloyWorkflowTemplates | DemoMode | `partial` |
| `/operations/alloy/receipts` | @lyte/AlloyTrustReceipts | DemoMode | `partial` |
| `/operations/alloy/agents` | @lyte/AlloyAgentMonitor | DemoMode | `partial` |
| `/operations/alloy/traces` | @lyte/AlloyExecutionTraces | DemoMode | `partial` |
| `/operations/alloy/replay` | @lyte/AlloyReplayTimeline | DemoMode | `partial` |
| `/operations/alloy/simulate` | @lyte/AlloyPolicySim | DemoMode | `partial` |
| `/operations/alloy/handoffs` | @lyte/AlloyAgentHandoffs | DemoMode | `partial` |
| `/operations/alloy/integrations` | @lyte/AlloyIntegrationHealth | DemoMode | `partial` |
| `/operations/alloy/compiler` | @lyte/AlloyGraphCompiler | DemoMode | `partial` |
| `/infrastructure` | InfrastructureOverview | static | `hardcoded` |
| `/infrastructure/centurion` | CenturionPage | static | `hardcoded` |
| `/infrastructure/imperium-map` | ImperiumMap | static | `hardcoded` |
| `/infrastructure/intelligence` | IntelligencePage | static | `hardcoded` |
| `/infrastructure/legatus` | LegatusPage | static | `hardcoded` |
| `/infrastructure/praetorian` | PraetorianPage | static | `hardcoded` |
| `/infrastructure/senate` | SenatePage | static | `hardcoded` |
| `/infrastructure/supply-lines` | SupplyLinesPage | static | `hardcoded` |

---

### App 6: SZL Holdings Dashboard
**Directory:** `artifacts/szl-holdings` | **Preview:** `/` (root)  
**TypeScript:** ❌ FAIL (22 errors — see Runtime Health table)  
**Total `.tsx` files:** 227  
**Data pattern:** 29 pages with `useQuery`/`fetch` (13%); majority hardcoded or local

**Red Flag Strings:** 236 occurrences across 56 files

#### Complete Route Inventory

| Route | Data | Status |
|---|---|---|
| `/` | static | `live` — homepage/landing |
| `/about` | static | `live` |
| `/academy` | static | `hardcoded` |
| `/accessibility` | static | `live` |
| `/admin` | broken | **`broken`** — `Building2`, `UserCheck` undefined; page crashes |
| `/admin/azure-onboarding` | API | `partial` |
| `/admin/azure-tenants` | API | `partial` |
| `/admin/capital-arsenal` | static | `hardcoded` |
| `/admin/command-center` | API | `partial` |
| `/admin/data-retention` | API | `partial` |
| `/admin/distribution` | API | `partial` |
| `/admin/distribution/ab-testing` | API | `partial` |
| `/admin/distribution/analytics` | API | `partial` |
| `/admin/distribution/articles` | API | `partial` |
| `/admin/distribution/atomizer` | API | `partial` |
| `/admin/distribution/attribution` | API | `partial` |
| `/admin/distribution/audience-genome` | API | `partial` |
| `/admin/distribution/automations` | API | `partial` |
| `/admin/distribution/calendar` | API | `partial` |
| `/admin/distribution/campaigns` | API | `partial` |
| `/admin/distribution/carousel-lab` | API | `partial` |
| `/admin/distribution/cross-analytics` | API | `partial` |
| `/admin/distribution/developer-api` | API | `partial` |
| `/admin/distribution/embeds` | API | `partial` |
| `/admin/distribution/growth` | API | `partial` |
| `/admin/distribution/leads` | API | `partial` |
| `/admin/distribution/lifecycle` | API | `partial` |
| `/admin/distribution/monetization` | API | `partial` |
| `/admin/distribution/newsletters` | API | `partial` |
| `/admin/distribution/platforms` | static | `hardcoded` |
| `/admin/distribution/reports` | API | `partial` |
| `/admin/distribution/segments` | API | `partial` |
| `/admin/distribution/seo-intelligence` | API | `partial` |
| `/admin/distribution/settings` | API | `partial` |
| `/admin/distribution/trend-radar` | API | `partial` |
| `/admin/distribution/virality` | API | `partial` |
| `/admin/distribution/x-studio` | API | `partial` |
| `/admin/platform-settings` | broken | **`broken`** — `apiFetch` import conflict |
| `/admin/powerbi` | broken | **`broken`** — `apiFetch` import conflict |
| `/admin/scim` | broken | **`broken`** — `apiFetch` import conflict |
| `/admin/:section` | API | `partial` |
| `/admin/tenant-branding/:id` | broken | **`broken`** — `apiFetch` import conflict |
| `/admin/tenant-health` | API | `partial` |
| `/aegis-public` | static | `live` |
| `/ai-cost-analytics` | broken | **`broken`** — `API_BASE` undefined |
| `/alloy` | API | `partial` |
| `/alloy/admin-analytics` | API | `partial` |
| `/alloy/analytics` | API | `partial` |
| `/alloy/artifacts` | API | `partial` |
| `/alloy/browser` | API | `partial` |
| `/alloy/connectors` | API | `partial` |
| `/alloy/console` | API | `partial` |
| `/alloy/creative` | API | `partial` |
| `/alloy/creative/ai-studio` | API | `partial` |
| `/alloy/creative/brand-voice` | API | `partial` |
| `/alloy/creative/campaigns/:id` | API | `partial` |
| `/alloy/creative/content-calendar` | API | `partial` |
| `/alloy/dag` | API | `partial` |
| `/alloy/decisions` | API | `partial` |
| `/alloy/demos` | static | `hardcoded` |
| `/alloy/documents` | API | `partial` |
| `/alloy/documents/:sub` | API | `partial` |
| `/alloy/enterprise-governance` | API | `partial` |
| `/alloy-fabric` | API | `partial` |
| `/alloy/governance` | API | `partial` |
| `/alloy/home` | API | `partial` |
| `/alloy/mcp-store` | API | `partial` |
| `/alloy/mcp-tools` | API | `partial` |
| `/alloy/operator` | API | `partial` |
| `/alloy/pilot` | static | `hardcoded` |
| `/alloy/policies` | API | `partial` |
| `/alloy/research` | API | `partial` |
| `/alloy/runs` | API | `partial` |
| `/alloy/runs/:id` | API | `partial` |
| `/alloy/signals` | API | `partial` |
| `/alloy/skills` | API | `partial` |
| `/alloy/usage` | API | `partial` |
| `/alloy/workflows` | API | `partial` |
| `/api` | static docs | `live` |
| `/architecture` | static | `hardcoded` |
| `/autopilot` | API | `partial` — live header; GENOME/APPS arrays hardcoded |
| `/brand` | static | `hardcoded` |
| `/carlota-jo` | redirect | `live` |
| `/carlota-jo-public` | static | `live` |
| `/carlota-jo/services` | static | `live` |
| `/case-studies` | API (CMS) | `partial` |
| `/changelog` | API (CMS) | `partial` |
| `/company` | static | `live` |
| `/contact` | API | `partial` |
| `/control-plane` | static | `hardcoded` |
| `/control-tower` | API | `partial` |
| `/core` | API | `partial` |
| `/crm-intelligence` | API (broken) | **`broken`** — `probability` property type error |
| `/decisioning` | API (broken) | **`broken`** — `urgency` type incompatibility |
| `/demo` | broken | **`broken`** — `API_BASE` undefined |
| `/demos` | static | `hardcoded` |
| `/design-partner` | static | `live` |
| `/design-partners` | static | `live` |
| `/developers` | broken | **`broken`** — `Globe`, `Database`, `Webhook`, `Terminal` undefined |
| `/developers/:section` | broken | **`broken`** — same as above |
| `/docs` | static | `live` |
| `/docs/architecture` | static | `live` |
| `/docs/control-plane` | static | `live` |
| `/docs/github` | static | `live` |
| `/docs/model-mesh` | static | `live` |
| `/docs/proof-chain` | static | `live` |
| `/docs/trust` | static | `live` |
| `/docs/worldline` | static | `live` |
| `/ecosystem` | static | `hardcoded` |
| `/faq` | static | `live` |
| `/financials` | static | `hardcoded` |
| `/firestorm` | redirect | `live` |
| `/forge` | static | `hardcoded` |
| `/forge/:rest*` | static | `hardcoded` |
| `/founder` | API (CMS) | `partial` |
| `/founder-legacy` | static | `hardcoded` |
| `/fund` | static | `hardcoded` — all KPIs are hardcoded strings |
| `/fund/benchmarking` | static | `hardcoded` |
| `/fund/board-meetings` | static | `hardcoded` |
| `/fund/cap-table` | static | `hardcoded` |
| `/fund/co-invest` | static | `hardcoded` |
| `/fund/compliance` | static | `hardcoded` |
| `/fund/data-room` | static | `hardcoded` |
| `/fund/deal-scoring` | static | `hardcoded` |
| `/fund/esg` | static | `hardcoded` |
| `/fund/exit-modeling` | static | `hardcoded` |
| `/fund/lp-crm` | static | `hardcoded` |
| `/fund/lp-reports` | static | `hardcoded` |
| `/fund/nav-dashboard` | static | `hardcoded` |
| `/fund-operations` | static | `hardcoded` |
| `/fund/portfolio-intelligence` | static | `hardcoded` |
| `/fund/secondary-market` | static | `hardcoded` |
| `/fund/treasury` | static | `hardcoded` |
| `/helm` | API | `partial` |
| `/helm/:tab` | API | `partial` |
| `/help` | static | `live` |
| `/how-it-works` | static | `live` |
| `/inca` | static | `hardcoded` |
| `/insights` | API (CMS) | `partial` |
| `/insights/:slug` | API (CMS) | `partial` |
| `/integrations` | API | `partial` |
| `/integrations/:sub` | API | `partial` |
| `/intelligence/analyst` | API | `partial` |
| `/intelligence/cortex` | API | `partial` |
| `/intelligence/fabric` | API | `partial` |
| `/investor` | static | `hardcoded` |
| `/investor-analytics` | API | `partial` |
| `/investor-relations` | static | `hardcoded` |
| `/investors` | static | `hardcoded` |
| `/investors/architecture` | static | `hardcoded` |
| `/investors/data-room` | static | `hardcoded` |
| `/investors/founder` | static | `hardcoded` |
| `/investors/moat` | static | `hardcoded` |
| `/investors/overview` | static | `hardcoded` — **duplicate** with `investors-overview-v2.tsx` |
| `/investors/roadmap` | static | `hardcoded` |
| `/investor-story` | static | `hardcoded` |
| `/investors/trust` | static | `hardcoded` |
| `/ir` | static | `hardcoded` |
| `/kpis` | API | `partial` |
| `/leadership` | static | `hardcoded` |
| `/legal/acceptable-use` | static | `live` |
| `/legal/cookies` | static | `live` |
| `/legal/privacy` | static | `live` |
| `/legal/security-disclosure` | static | `live` |
| `/legal/terms` | static | `live` |
| `/link-in-bio` | API | `partial` |
| `/lp-sentiment-pulse` | API | `partial` |
| `/lyte` | static | `live` |
| `/lyte/app` | static | `live` |
| `/lyte/demo` | static | `live` |
| `/lyte/use-cases` | static | `live` |
| `/meridian` | static | `hardcoded` |
| `/msp` | static | `hardcoded` |
| `/newsletter` | API | `partial` |
| `/nexus` | API | `partial` |
| `/nexus/explorer` | API | `partial` |
| `/nexus/oracle` | API | `partial` |
| `/notifications` | API | `partial` |
| `/nuro-forge` | static | `hardcoded` |
| `/nuro-forge/arena` | static | `hardcoded` |
| `/nuro-forge/blueprints` | static | `hardcoded` |
| `/nuro-forge/composition` | static | `hardcoded` |
| `/nuro-forge/cost` | static | `hardcoded` |
| `/nuro-forge/fine-tuning` | static | `hardcoded` |
| `/nuro-forge/governance` | static | `hardcoded` |
| `/nuro-forge/multimodal` | static | `hardcoded` |
| `/nuro-forge/observatory` | static | `hardcoded` |
| `/nuro-forge/prompts` | static | `hardcoded` |
| `/nuro-forge/self-healing` | static | `hardcoded` |
| `/onboarding` | API | `partial` |
| `/onboarding/:orgSlug` | API | `partial` |
| `/operating-doctrine` | static | `hardcoded` |
| `/ops` | static | `hardcoded` |
| `/ops/alerts` | API | `partial` |
| `/ops/dependency-map` | API (broken) | **`broken`** — `textTransform` invalid SVG attribute |
| `/ops/incidents` | API | `partial` |
| `/ops/runbooks` | API | `partial` |
| `/ops/:section` | API | `partial` |
| `/ops/:section/:sub` | API | `partial` |
| `/ownership` | API | `partial` |
| `/packages` | static | `hardcoded` |
| `/pilot/aegis` | static | `live` |
| `/pilot/prism-counsel` | static | `live` |
| `/pilot/terra` | static | `live` |
| `/pilot/vessels` | static | `live` |
| `/platform` | static | `live` |
| `/platform/alloy` | static | `live` |
| `/portfolio` | static | `hardcoded` |
| `/portfolio-ops` | API | `partial` |
| `/press` | API (CMS) | `partial` |
| `/pricing` | static | `live` |
| `/prism-counsel` | redirect | `live` |
| `/prism-counsel-public` | static | `live` |
| `/prism-counsel/:rest*` | redirect | `live` |
| `/products/aegis` | static | `live` |
| `/products/lyte` | static | `live` |
| `/products/terra` | static | `live` |
| `/products/vessels` | static | `live` |
| `/pulse` | API | `partial` |
| `/relief` | static | `hardcoded` |
| `/reports` | API | `partial` |
| `/reports/builder` | API | `partial` |
| `/reports/export-builder` | API | `partial` |
| `/reports/scheduled` | API | `partial` |
| `/roadmap` | static | `hardcoded` |
| `/roi` | static | `hardcoded` |
| `/security` | static | `live` |
| `/services/carlota-jo` | redirect | `live` |
| `/settings` | API (partial) | `partial` — "Coming soon." fallback |
| `/settings/:orgSlug` | API (partial) | `partial` |
| `/solutions` | static | `live` |
| `/solutions/aegis` | static | `live` |
| `/solutions/aegis/trust` | static | `live` |
| `/solutions/lyte/trust` | static | `live` |
| `/solutions/prism-counsel` | static | `live` |
| `/solutions/prism-counsel/trust` | static | `live` |
| `/solutions/terra` | static | `live` |
| `/solutions/terra/trust` | static | `live` |
| `/solutions/vessels` | static | `live` |
| `/solutions/vessels/trust` | static | `live` |
| `/status` | API | `partial` |
| `/stephen` | redirect | `live` |
| `/support` | static | `live` |
| `/support/submit` | API | `partial` |
| `/support/tickets` | API | `partial` |
| `/support/tickets/:id` | API | `partial` |
| `/terra` | redirect | `live` |
| `/terra/demo` | static | `live` |
| `/terra/listings` | redirect | `live` |
| `/terra/platform` | static | `live` |
| `/terra-public` | static | `live` |
| `/trust` | static | `hardcoded` |
| `/trust/ai` | static | `hardcoded` |
| `/trust/approvals` | API | `partial` |
| `/trust/architecture` | static | `hardcoded` |
| `/trust/exports` | API | `partial` |
| `/trust/governance` | static | `hardcoded` |
| `/trust/operations` | API | `partial` |
| `/trust/security` | static | `hardcoded` |
| `/usage` | API | `partial` |
| `/usage/:orgSlug` | API | `partial` |
| `/venture-intelligence` | static | `hardcoded` |
| `/venture-intelligence/capital-optimizer` | static | `hardcoded` |
| `/venture-intelligence/exit-modeler` | static | `hardcoded` |
| `/venture-intelligence/health-radar` | static | `hardcoded` |
| `/venture-intelligence/lp-portal` | static | `hardcoded` |
| `/venture-intelligence/market-signals` | static | `hardcoded` |
| `/venture-intelligence/synergy-map` | static | `hardcoded` |
| `/venture-portfolio` | static | `hardcoded` |
| `/ventures` | static | `hardcoded` |
| `/vessels` | redirect | `live` |
| `/vessels/demo` | static | `live` |
| `/vessels/platform` | static | `live` |
| `/vessels-public` | static | `live` |

---

### App 7: SZL Holdings Mobile (CORTEX)
**Directory:** `artifacts/szl-holdings-mobile` | **App name:** CORTEX v2.0.0  
**TypeScript:** N/A (Expo/Metro bundler)  
**Total `.tsx` screen files:** 117 across 8 domain workspaces  
**Data pattern:** 40/117 screens with `useQuery`/`useMutation` (34%); 77 screens hardcoded or stub

**Red Flag Strings:** 111 occurrences across 20 files  

**Mobile App Health:**
- Auth: `expo-secure-store` + biometrics (`BiometricProvider`) ✅
- Splash / Icon: `./assets/images/icon.png`, `./assets/images/splash-icon.png`, backgroundColor `#090810` — check art is not Expo placeholder ⚠️
- Push notifications: `configurePushNotificationHandler` + `usePushNotificationsBase` in root `_layout.tsx` ✅
- Offline sync: `SyncEngineProvider`, `SyncStatusBanner`, `ConflictResolutionModal` in root layout ✅
- Deep links: scheme `szl-holdings://` in `app.json` ✅
- Navigation: 8 workspaces; Intelligence workspace has no sub-tabs (single stub file) ⚠️

#### Complete Screen Inventory

| Screen File | Data | Status |
|---|---|---|
| `app/auth.tsx` | API | `live` |
| `app/_layout.tsx` | config | `live` |
| `app/+not-found.tsx` | static | `live` |
| `(shell)/index.tsx` | API | `partial` |
| `(shell)/notifications.tsx` | API | `partial` |
| `(shell)/quick-actions.tsx` | static | `hardcoded` |
| `(shell)/usage.tsx` | API | `partial` |
| `(shell)/settings/index.tsx` | static | `hardcoded` |
| `(shell)/settings/digest.tsx` | static | `hardcoded` |
| `(shell)/settings/security.tsx` | static | `hardcoded` |
| `(shell)/settings/widgets.tsx` | static | `hardcoded` |
| **Advisory** | | |
| `(shell)/advisory/(tabs)/index.tsx` | API | `partial` |
| `(shell)/advisory/(tabs)/sessions.tsx` | API | `partial` |
| `(shell)/advisory/(tabs)/documents.tsx` | API | `partial` |
| `(shell)/advisory/(tabs)/messages.tsx` | static | `empty` — no messaging backend |
| `(shell)/advisory/(tabs)/profile.tsx` | static | `hardcoded` |
| `(shell)/advisory/(tabs)/agent-chat.tsx` | mock | `hardcoded` |
| `(shell)/advisory/(tabs)/mcp-tools.tsx` | mock | `hardcoded` |
| `(shell)/advisory/_layout.tsx` | config | `live` |
| `(shell)/advisory/agent-chat.tsx` | static | `hardcoded` |
| `(shell)/advisory/mcp-tools.tsx` | mock | `hardcoded` |
| **Defense** | | |
| `(shell)/defense/(tabs)/index.tsx` | API | `partial` |
| `(shell)/defense/(tabs)/digest.tsx` | API | `partial` |
| `(shell)/defense/(tabs)/findings.tsx` | API (mock fallback) | `partial` |
| `(shell)/defense/(tabs)/incidents.tsx` | API (mock fallback) | `partial` |
| `(shell)/defense/(tabs)/agents.tsx` | API | `partial` |
| `(shell)/defense/(tabs)/approvals.tsx` | API | `partial` |
| `(shell)/defense/(tabs)/mitre.tsx` | API | `partial` |
| `(shell)/defense/(tabs)/agent-chat.tsx` | mock | `hardcoded` |
| `(shell)/defense/(tabs)/mcp-tools.tsx` | mock | `hardcoded` |
| `(shell)/defense/(tabs)/profile.tsx` | static | `hardcoded` |
| `(shell)/defense/(tabs)/_layout.tsx` | config | `live` |
| `(shell)/defense/agent/[id].tsx` | API | `partial` |
| `(shell)/defense/finding/[id].tsx` | API | `partial` |
| `(shell)/defense/incident/[id].tsx` | API | `partial` |
| `(shell)/defense/workflow/[id].tsx` | API | `partial` |
| `(shell)/defense/agents-list.tsx` | static | `hardcoded` |
| `(shell)/defense/agents.tsx` | static | `hardcoded` |
| `(shell)/defense/approvals.tsx` | static | `hardcoded` |
| `(shell)/defense/findings.tsx` | static | `hardcoded` |
| `(shell)/defense/mcp-tools.tsx` | mock | `hardcoded` |
| `(shell)/defense/mitre.tsx` | static | `hardcoded` |
| `(shell)/defense/_layout.tsx` | config | `live` |
| **Fleet** | | |
| `(shell)/fleet/(tabs)/index.tsx` | API | `partial` |
| `(shell)/fleet/(tabs)/fleet.tsx` | API | `partial` |
| `(shell)/fleet/(tabs)/alerts.tsx` | API | `partial` |
| `(shell)/fleet/(tabs)/economics.tsx` | API | `partial` |
| `(shell)/fleet/(tabs)/agent-chat.tsx` | mock | `hardcoded` |
| `(shell)/fleet/(tabs)/mcp-tools.tsx` | mock | `hardcoded` |
| `(shell)/fleet/(tabs)/profile.tsx` | static | `hardcoded` |
| `(shell)/fleet/(tabs)/_layout.tsx` | config | `live` |
| `(shell)/fleet/vessel/[id].tsx` | API | `partial` |
| `(shell)/fleet/economics.tsx` | static | `hardcoded` |
| `(shell)/fleet/mcp-tools.tsx` | mock | `hardcoded` |
| `(shell)/fleet/_layout.tsx` | config | `live` |
| **Founder** | | |
| `(shell)/founder/(tabs)/index.tsx` | API | **`broken`** — "Case studies coming soon" (line 714), "Articles coming soon" (line 778) |
| `(shell)/founder/(tabs)/articles.tsx` | API | `partial` |
| `(shell)/founder/(tabs)/ventures.tsx` | API | `partial` |
| `(shell)/founder/(tabs)/tools.tsx` | static | `hardcoded` |
| `(shell)/founder/(tabs)/profile.tsx` | static | `hardcoded` |
| `(shell)/founder/(tabs)/_layout.tsx` | config | `live` |
| `(shell)/founder/article/[slug].tsx` | API | `partial` |
| `(shell)/founder/venture/[slug].tsx` | API | `partial` |
| `(shell)/founder/index-redirect.tsx` | — | `live` (redirect) |
| `(shell)/founder/mcp-tools.tsx` | mock | `hardcoded` |
| `(shell)/founder/_layout.tsx` | config | `live` |
| **Intelligence** | | |
| `(shell)/intelligence/index.tsx` | API | **`empty`** — single-file stub, no tabs, no content |
| **Operations** | | |
| `(shell)/operations/(tabs)/index.tsx` | API | `partial` |
| `(shell)/operations/(tabs)/health.tsx` | API | `partial` |
| `(shell)/operations/(tabs)/board-mode.tsx` | API | `partial` |
| `(shell)/operations/(tabs)/alerts.tsx` | API | `partial` |
| `(shell)/operations/(tabs)/signals.tsx` | API | `partial` |
| `(shell)/operations/(tabs)/receipts.tsx` | API | `partial` |
| `(shell)/operations/(tabs)/prism.tsx` | API | `partial` |
| `(shell)/operations/(tabs)/agent-chat.tsx` | mock | `hardcoded` |
| `(shell)/operations/(tabs)/mcp-tools.tsx` | mock | `hardcoded` |
| `(shell)/operations/(tabs)/profile.tsx` | static | `hardcoded` |
| `(shell)/operations/(tabs)/_layout.tsx` | config | `live` |
| `(shell)/operations/agent-chat.tsx` | static | `hardcoded` |
| `(shell)/operations/mcp-tools.tsx` | mock | `hardcoded` |
| `(shell)/operations/prism.tsx` | static | `hardcoded` |
| `(shell)/operations/receipts.tsx` | static | `hardcoded` |
| `(shell)/operations/signals.tsx` | static | `hardcoded` |
| `(shell)/operations/_layout.tsx` | config | `live` |
| **Portfolio** | | |
| `(shell)/portfolio/(tabs)/index.tsx` | API | `partial` |
| `(shell)/portfolio/(tabs)/portfolio.tsx` | API | `partial` |
| `(shell)/portfolio/(tabs)/investor.tsx` | API | `partial` |
| `(shell)/portfolio/(tabs)/trust.tsx` | API | `partial` |
| `(shell)/portfolio/(tabs)/alloy.tsx` | API | `partial` |
| `(shell)/portfolio/(tabs)/agents.tsx` | API | `partial` |
| `(shell)/portfolio/(tabs)/agent-chat.tsx` | mock | `hardcoded` |
| `(shell)/portfolio/(tabs)/mcp-tools.tsx` | mock | `hardcoded` |
| `(shell)/portfolio/(tabs)/profile.tsx` | static | `hardcoded` |
| `(shell)/portfolio/(tabs)/_layout.tsx` | config | `live` |
| `(shell)/portfolio/portfolio/[id].tsx` | static | `hardcoded` |
| `(shell)/portfolio/agents.tsx` | API | `partial` |
| `(shell)/portfolio/alloy.tsx` | API | `partial` |
| `(shell)/portfolio/trust.tsx` | API | `partial` |
| `(shell)/portfolio/mcp-tools.tsx` | mock | `hardcoded` |
| `(shell)/portfolio/_layout.tsx` | config | `live` |
| **Properties** | | |
| `(shell)/properties/(tabs)/index.tsx` | API | `partial` |
| `(shell)/properties/(tabs)/properties.tsx` | API | `partial` |
| `(shell)/properties/(tabs)/pipeline.tsx` | API | `partial` |
| `(shell)/properties/(tabs)/scanner.tsx` | API | `partial` — camera-dependent |
| `(shell)/properties/(tabs)/agent-chat.tsx` | mock | `hardcoded` |
| `(shell)/properties/(tabs)/mcp-tools.tsx` | mock | `hardcoded` |
| `(shell)/properties/(tabs)/profile.tsx` | API | `partial` |
| `(shell)/properties/(tabs)/_layout.tsx` | config | `live` |
| `(shell)/properties/property/[id].tsx` | API | `partial` |
| `(shell)/properties/ar-viewer.tsx` | API | `partial` — camera-dependent |
| `(shell)/properties/capture.tsx` | API | `partial` — camera-dependent |
| `(shell)/properties/agent-chat.tsx` | mock | `hardcoded` |
| `(shell)/properties/mcp-tools.tsx` | mock | `hardcoded` |
| `(shell)/properties/_layout.tsx` | config | `live` |

---

### App 8: API Server
**Directory:** `artifacts/api-server` | **Preview:** `/api/`  
**TypeScript:** ❌ FAIL (3 errors — `decisioning.ts` imports unbuilt dist types from `packages/decision-engine`, `packages/policy-engine`, `packages/action-engine`)  
**Route files:** 210+ files in `src/routes/`  
**Total distinct method+path endpoints:** **2,243**

#### Complete API Route Manifest

Routes are organized by domain prefix. `GET`, `POST`, `PATCH`, `PUT`, `DELETE` methods shown where implemented. All paths are prefixed with `/api` at runtime.

**A2A (Agent-to-Agent Protocol)**  
`GET/POST /a2a/agents` | `GET/POST/DELETE /a2a/agents/:agentId` | `GET /a2a/agents/:agentId/health` | `POST /a2a/agents/:agentId/heartbeat` | `POST /a2a/agents/:agentId/rpc` | `GET /a2a/agents/:agentId/status` | `GET /a2a/agents/:agentId/stream` | `GET/POST /a2a/agents/:agentId/tasks` | `GET /a2a/agents/:agentId/tasks/:taskId` | `GET/POST /a2a/delegate` | `GET /a2a/delegate/:taskId` | `GET /a2a/delegations` | `GET /a2a/delegations/stats` | `GET/POST /a2a/discover` | `GET /a2a/health` | `POST /a2a/heartbeat` | `POST /a2a/multi-delegate` | `POST /a2a/register` | `POST /a2a/sync`

**Admin**  
`GET/POST /admin/apps` | `GET /admin/artifact-approvals` | `POST /admin/artifact-approvals/:id/approve` | `POST /admin/artifact-approvals/:id/reject` | `GET /admin/audit-log` | `GET /admin/billing` | `GET /admin/billing/settings` | `GET /admin/connectors` | `PUT /admin/connectors/:name/enable` | `POST /admin/connectors/:name/sync` | `POST /admin/connectors/:name/test` | `GET /admin/environment` | `GET /admin/environment/full` | `GET /admin/export-history` | `GET/POST /admin/feature-flags` | `PUT /admin/feature-flags/:key` | `GET /admin/files` | `GET /admin/friction` | `GET /admin/health` | `GET /admin/health-dashboard` | `GET /admin/impersonate/end` | `POST /admin/impersonate/:userId` | `GET /admin/integration-activity` | `GET /admin/integration-health` | `GET /admin/jobs` | `GET /admin/overview` | `GET /admin/portfolio-learning` | `GET /admin/pressure` | `GET /admin/provisioning` | `POST /admin/push-notifications/broadcast` | `GET /admin/push-tokens/stats` | `GET /admin/quality` | `POST /admin/seed` | `POST /admin/seed/reset` | `GET /admin/seed/validate` | `DELETE /admin/sessions/:userId` | `GET /admin/system-health` | `GET/POST /admin/users` | `GET /admin/webhooks` | `GET /admin/workflow-runs` | `GET /admin/workflow-runs/:id` | `GET /admin/worldline`

**Agent Autonomy**  
`GET /agent-autonomy/agents` | `GET /agent-autonomy/agents/:agentId/reflection` | `GET/POST /agent-autonomy/connectors` | `POST /agent-autonomy/connectors/:connectorId/health` | `GET /agent-autonomy/delegations` | `GET /agent-autonomy/overview` | `GET /agent-autonomy/performance` | `GET/POST /agent-autonomy/rag` | `POST /agent-autonomy/rag/ingest` | `GET /agent-autonomy/skills`

**Agent OS**  
`GET /agent-os/agent-stats` | `GET /agent-os/events` | `GET /agent-os/feed` | `GET /agent-os/feed/:domain` | `GET /agent-os/knowledge` | `POST /agent-os/run/:agentId` | `GET /agent-os/runs` | `GET /agent-os/schedules` | `GET /agent-os/status`

**AI Engine**  
`GET /ai/approval-matrix` | `GET /ai/audit` | `GET/POST /ai/decision` | `GET /ai/decision/:id` | `GET /ai/evals/golden-set` | `POST /ai/evals/run` | `POST /ai/extract` | `GET /ai/health` | `GET /ai/models` | `POST /ai/plan` | `POST /ai/respond` | `POST /ai/retrieval/ingest` | `POST /ai/retrieve` | `GET /ai/tools` | `POST /ai/tools/execute` | `POST /ai/tools/preview` | `POST /ai/triage`

**Alloy (Workflow Automation Platform)**  
`GET/POST /alloy/admin/analytics` | `GET /alloy/admin/flags` | `POST /alloy/admin/flags` | `PATCH /alloy/admin/flags/:key` | `GET /alloy/agents/:agentId/accuracy` | `GET /alloy/agents/:agentId/calibration` | `GET /alloy/agents/:agentId/performance` | `GET /alloy/agents/:agentId/performance/history` | `POST /alloy/agents/:agentId/performance/snapshot` | `GET /alloy/agents/:agentId/reflections` | `GET /alloy/agents/:agentId/self-reflection` | `GET /alloy/agents/:agentId/skill-effectiveness` | `GET /alloy/agents/:agentId/trend` | `GET /alloy/approvals` | `POST /alloy/approvals/:id/decide` | `GET/POST /alloy/artifacts` | `GET /alloy/artifacts/:id` | `POST /alloy/artifacts/:id/approve` | `POST /alloy/artifacts/:id/reject` | `GET /alloy/audit` | `GET/POST /alloy/browser/allowlist` | `DELETE /alloy/browser/allowlist/:id` | `GET/POST /alloy/browser/tasks` | `POST /alloy/browser/tasks/:id/execute` | `POST /alloy/browser/tasks/:id/pause` | `POST /alloy/browser/tasks/:id/resume` | `GET /alloy/channels/approvals` | `POST /alloy/channels/approvals/:id/decide` | `GET /alloy/channels/audit` | `GET/POST /alloy/channels/config` | `PATCH /alloy/channels/config/:channelId` | `POST /alloy/channels/slack/interactive` | `POST /alloy/channels/slack/send` | `POST /alloy/channels/slack/webhook` | `GET /alloy/channels/trust-levels` | `GET /alloy/cognitive/calibration/:agentId` | `GET /alloy/cognitive/corrections/:agentId` | `GET /alloy/cognitive/evals/calibrations` | `GET /alloy/cognitive/evals/history` | `GET /alloy/cognitive/evals/latest` | `POST /alloy/cognitive/evals/run` | `GET /alloy/cognitive/memory-stats` | `POST /alloy/cognitive/outcomes` | `GET /alloy/dashboard` | `POST /alloy/decisions/:decisionId/outcome` | `GET /alloy/decisions/outcomes` | `POST /alloy/digest/generate` | `GET /alloy/digest/history` | `GET /alloy/digest/:id` | `GET /alloy/digest/latest` | `POST /alloy/email/ingest` | `GET/POST /alloy/email/rules` | `GET /alloy/email/stats` | `GET /alloy/email/triage` | `GET/PATCH /alloy/email/triage/:id` | `POST /alloy/email/triage/:id/draft` | `POST /alloy/email/triage/:id/route` | `GET /alloy/factory-floor` | `POST /alloy/governance/enforce` | `GET /alloy/governance/incidents` | `POST /alloy/governance/incidents` | `PATCH /alloy/governance/incidents/:id/resolve` | `POST /alloy/ingest/batch` | `POST /alloy/ingest/signal` | `GET/POST /alloy/integrations/connections` | `PATCH/DELETE /alloy/integrations/connections/:id` | `POST /alloy/integrations/connections/:id/test` | `GET /alloy/integrations/events` | `GET /alloy/integrations/health` | `GET /alloy/integrations/registry` | `GET/POST /alloy/integrations/webhooks/endpoints` | `POST /alloy/integrations/webhooks/receive/:endpointId` | `GET /alloy/meetings` | `GET /alloy/meetings/action-items/open` | `POST /alloy/meetings/capture` | `GET/PATCH /alloy/meetings/:id` | `PATCH /alloy/meetings/:id/action-items/:itemId` | `GET/POST /alloy/meetings/:id/follow-up` | `POST /alloy/meetings/prep` | `GET /alloy/performance/alerts` | `PATCH /alloy/performance/alerts/:alertId/resolve` | `POST /alloy/performance/alerts/evaluate` | `GET/POST /alloy/policies` | `GET/PATCH/DELETE /alloy/policies/:id` | `POST /alloy/policies/:id/apply` | `GET/POST /alloy/research/spaces` | `GET/DELETE /alloy/research/spaces/:id` | `POST /alloy/research/spaces/:id/run` | `GET /alloy/runs` | `GET /alloy/runs/:id` | `POST /alloy/runs/:id/cancel` | `POST /alloy/runs/:id/retry` | `GET /alloy/runs/:id/steps` | `PUT /alloy/self-improvement/config` | `GET /alloy/signals` | `GET/POST /alloy/skills` | `GET/PATCH/DELETE /alloy/skills/:skillId` | `POST /alloy/skills/chains/:chainId/plan` | `POST /alloy/skills/chains/compose` | `DELETE /alloy/skills/chains/:chainId` | `GET /alloy/skills/chains/list` | `GET /alloy/skills/chains/prebuilt/:scenario` | `GET/POST /alloy/skills/discover` | `POST /alloy/skills/select` | `POST /alloy/usage/events` | `GET/POST /alloy/voice/notes` | `GET/DELETE /alloy/voice/notes/:id` | `POST /alloy/voice/transcribe` | `POST /alloy/voice/transcribe-text` | `GET/POST /alloy/workflows` | `GET/PATCH/DELETE /alloy/workflows/:id` | `POST /alloy/workflows/:id/run`

**Analytics**  
`GET /analytics` | `GET /analytics/cross-platform` | `GET /analytics/dashboard` | `POST /analytics/event` | `POST /analytics/pageview` | `GET /analytics/summary` | `GET/POST /ab-tests` | `GET /attribution/funnel` | `GET /audience/genome` | `GET /audience/segments` | `GET/POST /campaigns` | `GET /campaigns/:id/links` | `POST /campaigns/:id/links`

**Auth**  
`POST /auth/login` | `POST /auth/login-password` | `GET /auth/me` | `GET /auth/my-roles` | `GET /auth/providers` | `POST /auth/register` | `GET /auth/roles` | `GET/POST /auth/sessions` | `GET /auth/sessions/current` | `DELETE /auth/sessions/current` | `DELETE /auth/sessions/:id` | `GET /auth/user` | `GET/POST /auth/users` | `GET /auth/verify-email` | `POST /auth/ws-ticket` | `GET /azure-ad/callback` | `GET /azure-ad/login` | `POST /mobile-auth/logout` | `POST /mobile-auth/token-exchange` | `POST /oidc-auth/*` (OIDC provider flow) | `SCIM /scim/v2/users` CRUD | `SCIM /scim/v2/groups` CRUD

**Billing**  
`POST /billing/aegis/enterprise-quote` | `POST /billing/cancel-subscription` | `POST /billing/checkout` | `GET /billing/checkout-session/:sessionId` | `GET/POST /billing/command/plans` | `POST /billing/command/subscribe` | `POST /billing/customer-portal` | `POST /billing/firestorm/enterprise-quote` | `POST /billing/aegis/invoice` | `GET /billing/invoices` | `GET/POST /billing/plans` | `GET /billing/plans/:id` | `GET /billing/products` | `GET /billing/revenue-analytics` | `GET /billing/stripe-config` | `GET /billing/stripe-invoices` | `GET /billing/subscriptions` | `GET /billing/subscription-status` | `POST /billing/sync-plans` | `POST /billing/terra/metered-usage` | `GET/POST /billing/terra/plans` | `POST /billing/terra/subscribe` | `POST /billing/update-subscription` | `POST /billing/webhooks`

**Booking (Carlota Jo)**  
`GET/POST /booking/appointments` | `GET /booking/appointments/:id` | `GET /booking/availability` | `GET /booking/clients` | `GET /booking/health` | `GET /booking/inquiries` | `GET /booking/inquiries/:id` | `PATCH/DELETE /booking/inquiries/:id` | `POST /booking/inquiries` | `POST /booking/invoices` | `GET /booking/invoices/:invoiceId` | `GET/POST /booking/reservations` | `GET /booking/reservations/:id` | `PATCH/DELETE /booking/reservations/:id` | `GET /booking/search` | `GET/POST /booking/services` | `PATCH/DELETE /booking/services/:id`

**Briefing / Cortex**  
`GET /briefing/today` | `POST /briefing/generate` | `GET /briefing/history` | `GET /briefing/:id` | `GET/POST /cortex/action-drafts` | `GET /cortex/briefing/today` | `GET /cortex/intelligence-feed` | `POST /cortex/whatif` | `GET /cortex/recommendations` | `POST /cortex/action-drafts/generate`

**CMS**  
`GET/POST/PATCH/DELETE /cms/articles` | `GET/POST/PATCH/DELETE /cms/case-studies` | `GET/POST /cms/contact-submissions` | `GET/POST/PATCH/DELETE /cms/ctas` | `GET/POST/PATCH /cms/faqs` | `GET/POST /cms/features-items` | `GET/POST/PATCH/DELETE /cms/media-assets` | `GET/POST/PATCH/DELETE /cms/navigation-items` | `GET/POST/PATCH/DELETE /cms/pages` | `GET/POST/PUT/DELETE /cms/posts` | `POST /cms/posts/upload-image` | `GET/POST/PATCH/DELETE /cms/redirects` | `GET/POST/PATCH/DELETE /cms/roadmap-items` | `GET/POST/PATCH/DELETE /cms/sections` | `GET/POST/PATCH/DELETE /cms/services-items` | `GET/PUT/DELETE /cms/site-settings` | `GET /cms/sites` | `GET /cms/sites/:slug` | `GET/POST/PATCH/DELETE /cms/testimonials` | `GET/POST/PATCH /cms/updates` | `GET/POST /cms/use-cases` | `GET/POST/PATCH/DELETE /cms/ventures`

**Contact / Holdings**  
`GET /contact/requests` | `POST /contact/submit` | `GET /holdings/inquiries` | `POST /holdings/inquiries` | `DELETE /holdings/inquiries/:id` | `GET /holdings/kpis` | `GET /holdings/leadership` | `GET /holdings/metrics` | `GET /holdings/milestones` | `GET /holdings/ventures` | `GET /holdings/ventures/:id` | `PATCH /holdings/ventures/:id` | `DELETE /holdings/ventures/:id` | `GET /holdings/health` | `GET /holdings/ecosystem-health` | `GET /holdings/search`

**Documents**  
`GET/POST /documents` | `GET/PUT/DELETE /documents/:id` | `GET /documents/batch-pdf` | `POST /documents/batch-pdf` | `POST /documents/batch-pdf/:batchId/cancel` | `GET /documents/batch-pdf/:batchId` | `GET /documents/batch-pdf/:batchId/zip` | `GET /documents/content-library` | `POST /documents/:id/comments` | `GET /documents/:id/pdf` | `GET /documents/:id/signatures` | `POST /documents/:id/sign` | `POST /documents/:id/sign/:sigId` | `POST /documents/:id/signatures/:sigId/decline` | `POST /documents/:id/signatures/:sigId/remind` | `GET /documents/:id/versions` | `GET /documents/:id/versions/:versionA/diff/:versionB` | `POST /documents/:id/restore` | `POST /documents/docusign/webhook` | `GET /documents/pdf-output/:filename` | `GET /documents/signing-dashboard` | `GET /documents/sign/:token` | `POST /documents/sign/:token/decline` | `POST /documents/sign/:token/submit` | `GET/POST /documents/templates` | `GET /documents/templates/:id`

**Firestorm (Aegis security backend)**  
`GET/POST /firestorm/alerts` | `PUT /firestorm/alerts/:id` | `GET/POST /firestorm/assessments` | `GET/PUT/DELETE /firestorm/assessments/:id` | `GET/POST /firestorm/assets` | `PUT /firestorm/assets/:id` | `GET/POST /firestorm/cases` | `PATCH /firestorm/cases/:id` | `GET /firestorm/compliance` | `PUT /firestorm/compliance/:controlId` | `GET /firestorm/cves` | `GET/POST /firestorm/findings` | `GET/PUT /firestorm/findings/:id` | `GET/POST /firestorm/hardening-controls` | `GET/PUT /firestorm/hardening-controls/:id` | `GET /firestorm/hardening-summary` | `GET/POST /firestorm/incidents` | `GET/PUT/DELETE /firestorm/incidents/:id` | `GET /firestorm/live/*` (15 live data feeds: CISA KEV, NVD CVEs, Shodan, Greynoise, Malware Bazaar, MITRE ATT&CK, Cert Advisories, Threat Indicators, Threat News, Threat Summary, Threats, Asset Risk, Compliance Summary, Feed Status, Incidents) | `GET /firestorm/mitre/coverage` | `GET/POST /firestorm/scenarios` | `GET/PUT/DELETE /firestorm/scenarios/:id` | `GET/POST /firestorm/simulations` | `GET/POST /firestorm/risk-scores` | `GET /firestorm/reports` | `GET /firestorm/soar/playbooks` | `POST /firestorm/soar/execute` | `POST /firestorm/seed` | `GET/POST /firestorm/tradecraft/*` (case memory, decisions, evidence index, notebook) | `GET/PUT/DELETE /firestorm/vulnerabilities/:id`

**Fund Operations**  
`GET/POST /fund-ops/accredited-investors` | `PATCH /fund-ops/accredited-investors/:id` | `GET/POST /fund-ops/capital-calls` | `PATCH /fund-ops/capital-calls/:id` | `POST /fund-ops/capital-call-lines` | `PATCH /fund-ops/capital-call-lines/:id` | `GET /fund-ops/cap-table-holders` | `POST /fund-ops/cap-table-holders` | `PATCH /fund-ops/cap-table-holders/:id` | `GET /fund-ops/cap-table-summary` | `POST /fund-ops/cap-table-transactions` | `GET /fund-ops/distributions` | `POST /fund-ops/distributions` | `PATCH /fund-ops/distributions/:id` | `GET/POST/DELETE /fund-ops/form-d-filings` | `GET /fund-ops/lp-capital-accounts` | `POST /fund-ops/lp-capital-accounts` | `PATCH /fund-ops/lp-capital-accounts/:id` | `GET/POST /fund-ops/lp-reports` | `GET/PATCH/DELETE /fund-ops/lp-reports/:id` | `GET /fund-ops/nav-records` | `POST /fund-ops/nav-records` | `GET /fund-ops/portfolio-aggregate` | `GET/POST /fund-ops/portfolio-financials` | `GET/PATCH/DELETE /fund-ops/portfolio-financials/:id` | `GET/POST/DELETE /fund-ops/portfolio-kpis` | `GET /fund-ops/seed` | `POST /fund-ops/seed` (seed demo data) | `GET/POST /fund-ops/share-classes` | `PATCH /fund-ops/share-classes/:id` | `GET /fund-ops/summary` | `GET/POST /fund-ops/vesting-schedules` | `PATCH /fund-ops/vesting-schedules/:id` | `GET /fund-ops/audit-log`

**Fusion (Signal Fusion / Anomaly Detection)**  
`GET /fusion/alerts` | `POST /fusion/alerts/:alertId/feedback` | `POST /fusion/alerts/:id/acknowledge` | `POST /fusion/alerts/:id/resolve` | `POST /fusion/alerts/inject` | `POST /fusion/demo/seed` | `GET /fusion/patterns` | `GET /fusion/patterns/:id` | `POST /fusion/patterns/custom` | `POST /fusion/patterns/:id/feedback` | `GET /fusion/predictive/alerts` | `POST /fusion/predictive/alerts/:id/resolve` | `POST /fusion/predictive/generate` | `POST /fusion/predictive/project` | `POST /fusion/scan` | `GET /fusion/stats` | `POST /fusion/start-continuous` | `POST /fusion/stop-continuous`

**Health**  
`GET /health` | `GET /healthz` | `GET /health/ai` | `GET /health/billing` | `GET /health/external-feeds` | `GET /health/external-feeds/refresh` | `GET /health/integrations` | `GET /health/integrations/refresh` | `GET /health/websocket` | `GET /core/health` | `GET /core/metrics` | `GET /services/health/app/:appSlug`

**Intelligence / AI**  
`POST /intelligence/ai/advisory` | `POST /intelligence/ai/analyze-document` | `POST /intelligence/ai/campaign-copy` | `POST/GET /intelligence/ai/chat` | `POST /intelligence/ai/chat/stream` | `DELETE /intelligence/ai/chat/:sessionId` | `GET /intelligence/ai/chat/:sessionId/history` | `POST /intelligence/ai/classify` | `POST /intelligence/ai/content-ideas` | `POST /intelligence/ai/dark-vessel-analysis` | `POST /intelligence/ai/domain-agent` | `POST /intelligence/ai/embed` | `POST /intelligence/ai/generate-image` | `GET /intelligence/ai/health` | `POST /intelligence/ai/maritime-intelligence` | `POST /intelligence/ai/ner` | `POST /intelligence/ai/readiness-summary` | `POST /intelligence/ai/reason` | `POST /intelligence/ai/risk-assessment` | `POST /intelligence/ai/risk-prediction` | `POST /intelligence/ai/semantic-search` | `POST /intelligence/ai/sentiment` | `POST /intelligence/ai/situation-report` | `POST /intelligence/ai/summarize` | `POST /intelligence/ai/threat-briefing` | `POST /intelligence/ai/threat-triage` | `POST /intelligence/ai/ticket-triage` | `POST /intelligence/ai/transcribe` | `POST /intelligence/ai/translate` | `GET /intelligence/ai/stream` | `GET /intelligence/anomalies` | `GET /intelligence/benchmarks` | `GET /intelligence/briefing` | `GET /intelligence/cisa-kev` | `GET /intelligence/cross-app-correlation` | `GET /intelligence/cves` | `GET /intelligence/daily-digest` | `GET /intelligence/geopolitical` | `GET /intelligence/maritime/chokepoints` | `GET /intelligence/maritime/sanctions` | `GET /intelligence/maritime/vessels` | `GET /intelligence/maritime/weather` | `GET /intelligence/news` | `GET /intelligence/threats` | `GET /intelligence/unified-feed`

**Lyte (Operations Platform)**  
`GET/POST /lyte/actions` | `PATCH /lyte/actions/:id` | `GET/POST /lyte/alerts` | `GET/PATCH/DELETE /lyte/alerts/:id` | `GET/POST /lyte/command-cards` | `GET/POST /lyte/dashboards` | `GET/PUT/DELETE /lyte/dashboards/:id` | `GET/POST /lyte/escalations` | `PATCH /lyte/escalations/:id` | `GET/POST /lyte/incidents` | `GET/PATCH/DELETE /lyte/incidents/:id` | `GET /lyte/live/*` (8 live data feeds: BLS Employment, GitHub Activity, GitHub Trending, Tech News, Signals, Operations Summary, Incidents, Database Telemetry) | `GET/POST /lyte/metrics` | `GET/POST/PATCH/DELETE /lyte/playbooks` | `GET/POST /lyte/recommendations` | `GET/POST /lyte/signals` | `GET/POST /lyte/views` | `GET/POST /lyte/workspaces` | `GET /lyte/billing/plans` | `GET /lyte/billing/pilot-metrics` | `GET /lyte/topology` | `GET /lyte/executive-summary` | `GET /lyte/readiness` | `GET /lyte/observability/summary`

**MSP (Managed Service Provider)**  
`GET /msp/clients` | `GET /msp/clients/:id` | `GET /msp/contracts` | `GET /msp/dashboard` | `GET /msp/devices` | `GET /msp/live/contracts` | `GET /msp/live/fedramp` | `GET /msp/live/health-metrics` | `GET /msp/live/pipeline` | `GET /msp/live/system-metrics` | `GET /msp/revenue` | `GET /msp/technicians` | `GET /msp/tickets` | `GET/PATCH /msp/tickets/:id` | `POST /msp/tickets`

**Nuro Mesh (AI Model Runtime)**  
`GET /nuro-mesh/consciousness/*` (18 sub-paths: emotions, goals, monologue, dream, metacognition, predictive, self-model, snapshot, temporal, workspace, and history endpoints) | `GET /nuro-mesh/cost/analytics` | `POST /nuro-mesh/cost/budget` | `GET /nuro-mesh/cost/budget/:workflowId` | `GET /nuro-mesh/cost/estimate` | `GET/POST /nuro-mesh/flywheel/*` | `GET /nuro-mesh/kernel/audit-trail` | `POST /nuro-mesh/kernel/scope-certificate` | `GET /nuro-mesh/kernel/verify-integrity` | `POST /nuro-mesh/memory/retrieve` | `POST /nuro-mesh/memory/reward` | `GET /nuro-mesh/memory/stats/:agentId` | `GET /nuro-mesh/observability/stats` | `GET /nuro-mesh/observability/traces` | `GET /nuro-mesh/observability/traces/:traceId`

**Observability**  
`GET /observability` | `GET /observability/:appSlug` | `GET /observability/alerts` | `POST /observability/alerts/:id/resolve` | `GET /observability/business-events` | `POST /observability/client-errors` | `POST /observability/error-feedback` | `GET /observability/telemetry/product` | `GET /observability/telemetry/technical` | `POST /observability/vitals`

**Ownership / Capital / Certification**  
`GET/POST /ownership/scenarios` | `GET/PATCH/DELETE /ownership/scenarios/:id` | `GET /ownership/health` | `GET /ownership/next-actions` | `GET /ownership/scenarios/:id/allocations` + POST | `GET /ownership/scenarios/:id/decision-log` + POST | `GET /ownership/scenarios/:id/legal-flags` + POST | Full CRUD on manager-roles, officer-roles, control-roles, governance-documents, signature-authority, voting-rights, capital-contributions, certification-readiness | `GET/POST /capital/artifacts` | `GET/POST /capital/cap-table` | `GET/POST /capital/diligence-checklists` | `GET/POST /capital/financial-models` | `GET/POST /capital/investor-packets` | `GET/POST /capital/lender-packets` | `GET/POST /capital/milestones` | `GET/POST /capital/use-of-funds` | Full PATCH/DELETE for each | `GET/POST /certification/dashboard` | Full CRUD on certification programs, tasks, requirements, opportunities, status, etc.

**Partner Portal**  
`GET /partner/accounts` | `POST /partner/accounts` | `GET/PATCH /partner/accounts/:id` | `POST /partner/accounts/:id/tenants` | `POST /partner/accounts/:id/tenants/assign` | `DELETE /partner/accounts/:id/tenants/:orgId` | `GET /partner/accounts/:id/usage` | `GET /partner/me` | `GET/POST /portal/documents` | `GET/POST /portal/messages` | `GET /portal/my-account` | `GET /portal/updates`

**Counsel (Legal Platform)**  
`GET/POST /prism-counsel/matters` | `GET/PATCH /prism-counsel/matters/:id` | `GET /prism-counsel/matters/:id/audit-packets` | `GET /prism-counsel/matters/:id/contradictions` | `GET /prism-counsel/matters/:id/copilot-drafts` | `GET /prism-counsel/matters/:id/forecast-diffs` | `GET /prism-counsel/matters/:id/pressure` | `GET /prism-counsel/matters/:id/proof-chain` | `GET /prism-counsel/matters/:id/twin` | Full CRUD for NY-specific subresources (clocks, appeals, no-fault-claims, demand-packets, offers, forecasts, mediations, denials, verifications, medical-bills, AI-reviews) | `GET /prism-counsel/dashboard` | `GET /prism-counsel/health` | `GET/POST /prism-counsel/approvals` | `GET /prism-counsel/ny/dashboard` | `GET /prism-counsel/ny/matters` + related | `GET /prism-counsel/signal-forge/runs` | `GET /prism-counsel/worldline/signals`

**Public / Status**  
`GET /public/status` | `POST /public/status/subscribe` | `GET /public/uptime-history` | `GET /status` | `GET /uptime-history` | `GET /feeds/all.rss` | `GET /feeds/articles.rss` | `GET /feeds/newsletters.rss` | `GET /oembed` | `GET /.well-known/agent-card.json`

**Push Notifications**  
`GET /push-analytics` | `GET /push-history` | `GET /push-history/me` | `GET/POST /push-notifications/scheduled` | `DELETE /push-notifications/scheduled/:id` | `GET /push-notifications/templates` | `POST /push-notifications/schedule` | `POST /push-notifications/send` | `GET/POST /push-preferences` | `GET/PUT /push-preferences/:appId` | `GET /push-preferences/categories/:appId` | `PUT /push-preferences/:appId/:category` | `GET /push-tokens/me` | `POST /push-tokens` | `DELETE /push-tokens/:token` | `GET/POST /web-push/subscriptions` | `DELETE /web-push/subscriptions` | `GET /web-push/subscriptions/me` | `GET /web-push/vapid-public-key`

**Reports / Exports**  
`GET/POST /reports` | `GET /reports/:reportId` | `GET /reports/:reportId/approval` | `GET /reports/:reportId/distributions` | `POST /reports/:reportId/distribute` | `GET /reports/:reportId/pdf` | `POST /reports/:reportId/request-approval` | `POST /reports/:reportId/review` | `PATCH /reports/:reportId/status` | `GET /reports/:reportId/versions` | `GET/POST /reports/schedules` | `PATCH /reports/schedules/:scheduleId` | `POST /reports/schedules/:scheduleId/run` | `GET /reports/stats` | `GET/POST /reports/templates` | `GET/PATCH/DELETE /reports/templates/:templateId` | `GET/POST /exports` | `GET /exports/:id` | `GET /exports/:id/content` | `GET /exports/download/:token` | `GET /exports/history` | `GET /exports/preview` | `POST /exports/aegis-incidents` | `POST /exports/audit-log` | `POST /exports/lyte-signals` | `POST /exports/msp-tickets` | `POST /exports/revenue-events` | `POST /exports/terra-deals` | `POST /exports/usage-metering` | `POST /exports/vessels`

**Terra (Real Estate)**  
`GET /terra/demographics` | `GET /terra/employment-outlook` | `GET /terra/enterprise/flags` | `POST /terra/enterprise/sync/mls` | `POST /terra/enterprise/sync/commercial` | `GET /terra/geocode` | `GET /terra/geocoding-status` | `GET /terra/market-intelligence` | `GET /terra/mls/listings` | `GET /terra/commercial/properties` | `GET /terra/commercial/comps` | `GET /terra/property-risk` | `GET /terra/reit-filings` | `GET /terra/reverse-geocode` | `GET /terra/sector-performance` | `GET /terra/live/census-housing` | `GET /terra/live/hud-fair-market-rents` | `GET /terra/live/mortgage-rates` | `GET /terra/live/bls-construction` | `GET /terra/live/fema-nri` | `GET /terra/live/nyc-dashboard` | `GET /terra/live/nyc-pluto` | `GET /terra/live/nyc-311` | `GET /terra/live/census-acs-demographics` | `GET/POST /terra/broker/listings` | `PATCH/DELETE /terra/broker/listings/:id` | `GET/POST /terra/broker/inquiries` | `PATCH /terra/broker/inquiries/:id` | `GET /terra/broker/agents` | `GET /terra/broker/brokerage` | `GET /terra/broker/map` | `GET /terra/broker/overview` | `GET /terra/broker/search` | `GET /terra/broker/transactions` | `GET/POST /terra/crm/leads` | `GET/PATCH /terra/crm/leads/:id` | `GET/POST /terra/pipeline/deals` | `PATCH /terra/pipeline/deals/:id/stage` | `GET/POST/PATCH/DELETE /terra/distress/*` (score, search, property, nearby, dashboard, alerts, ai-score, export) | `POST /terra/convert/distress-to-lead` | `POST /terra/convert/lead-to-deal` | `GET/POST /terra/opportunities/saved` | `GET /terra/investor/opportunities`

**Vessels**  
`GET/POST /vessels` | `GET/PUT/DELETE /vessels/:id` | `GET /vessels/:id/cargo` | `GET /vessels/:id/detail` | `GET /vessels/:id/events` | `PATCH /vessels/events/:id` | `GET /vessels/:id/exceptions` | `GET /vessels/:id/maintenance` | `GET /vessels/:id/port-calls` | `GET /vessels/:id/positions` | `GET /vessels/:id/routes` | `GET /vessels/:id/sanctions` | `GET /vessels/:id/voyages` | `GET/POST /vessels/alert-rules` | `PUT/DELETE /vessels/alert-rules/:id` | `GET /vessels/alert-rules/all` | `GET/POST /vessels/alerts/all` | `GET/POST /vessels/command-workflows` | `PATCH /vessels/command-workflows/:id` | `GET /vessels/corridors` | `GET /vessels/corridors/:id` | `GET /vessels/dashboard` | `GET /vessels/events` | `GET/POST /vessels/exceptions` | `GET /vessels/exceptions/:id` | `POST /vessels/exceptions/:id/acknowledge` | `POST /vessels/exceptions/:id/escalate` | `POST /vessels/exceptions/:id/resolve` | `GET/POST /vessels/fleets` | `GET/PUT/DELETE /vessels/fleets/:id` | `GET /vessels/fleet-summary` | `GET /vessels/insurance/*` (claims, policies, portfolio-summary, quotes, risk-score, reference) | `GET /vessels/live/ais` | `GET /vessels/live/ais/combined` | `GET /vessels/live/chokepoints` | `GET /vessels/live/fleet-summary` | `GET /vessels/live/geopolitical-events` | `GET /vessels/live/port-congestion` | `GET /vessels/live/vessel-details/:mmsi` | `GET /vessels/live/weather` | `GET /vessels/live/weather-marine` | `GET /vessels/maintenance` | `GET /vessels/map-payload` | `GET/POST /vessels/platform/*` (fleet, vessels, voyages, routes, ports, exceptions, readiness, map, corridors, dashboard) | `GET /vessels/port-calls` | `GET /vessels/ports` | `GET /vessels/readiness` | `GET /vessels/roster` | `GET /vessels/routes/all` | `POST /vessels/routes` | `PUT/DELETE /vessels/routes/:id` | `GET /vessels/sanctions` | `GET /vessels/sanctions/summary` | `GET/POST /vessels/simulations` | `GET /vessels/simulations/:id` | `POST /vessels/seed` | `GET /vessels/sync` | `GET /vessels/track/:vesselId` | `GET/POST /vessels/trading/fills` | `GET /vessels/trading/instruments` | `GET /vessels/trading/instruments/:id` | `GET /vessels/trading/market-depth/:symbol` | `GET/POST /vessels/trading/orders` | `DELETE /vessels/trading/orders/:id` | `GET /vessels/trading/pnl` | `GET /vessels/trading/positions` | `GET /vessels/trading/rates` | `GET /vessels/voyage-economics` | `GET /vessels/voyage-economics/analytics` | `GET /vessels/voyage-economics/:id` | `GET/POST /vessels/voyages` | `GET /vessels/voyages/:id` | `PATCH /vessels/platform/voyages/:id` | `GET /vessels/weather/snapshots`

**Additional Domain Groups (condensed)**  
*GDPR/Privacy:* `GET/POST /gdpr/export` | `POST /gdpr/erasure` | `GET /gdpr/data-processing-records` | `GET/POST /data-retention/policies` | `POST /data-retention/policies/:policyId/run` | `GET /data-retention/tables` | `GET /data-retention/audit-log`  
*Notifications:* `GET/POST /notifications` | `PATCH /notifications/:id/read` | `PATCH /notifications/read-all` | `DELETE /notifications/:id` | `GET/POST /notification-recipients` | `PATCH/DELETE /notification-recipients/:id`  
*Onboarding:* `POST /onboarding` | `GET /onboarding` | `PUT /onboarding` | `POST /onboarding/complete` | `POST /onboarding/resend`  
*Org Settings:* `PUT /orgs/:orgId/branding` | `DELETE /orgs/:orgId/branding` | `GET/POST /orgs/:orgId/custom-domains` | `PATCH/DELETE /orgs/:orgId/custom-domains/:domainId` | `GET /orgs/:orgSlug/members` | `GET /orgs/:orgSlug/profile` | `GET /orgs/:orgSlug/usage` | `GET /orgs/:orgSlug/notification-prefs`  
*RMM:* `GET/POST /rmm/actions` | `POST /rmm/actions/bulk` | `GET /rmm/devices` | `GET /rmm/health` | `GET/POST /rmm/org-site-mappings` | `PATCH/DELETE /rmm/org-site-mappings/:id` | `GET/POST/PATCH/DELETE /rmm/playbooks` | `GET/POST/PATCH/DELETE /rmm/providers` | `POST /rmm/providers/:id/sync` | `POST /rmm/providers/:id/test` | `GET /rmm/predictions`  
*Webhooks:* `GET/POST /webhooks/endpoints` | `PATCH/DELETE /webhooks/endpoints/:id` | `POST /webhooks/endpoints/:id/ping` | `GET /webhooks/deliveries` | `GET /webhooks/event-types` | `GET/POST /webhook-subscriptions` | `POST /webhook-subscriptions/:id/test` | `DELETE /webhook-subscriptions/:id` + inbound webhook receivers for Jira, PagerDuty, Salesforce, SIEM (CEF, Events, Sentinel, Splunk, Syslog), Slack (Commands, Events, Interactions)  
*INCA (ML Research):* `GET/POST /inca/experiments` | `GET/POST /inca/insights` | `GET/POST /inca/models` | `GET/POST /inca/projects` | `GET /inca/dashboard` | `GET /inca/health` | `GET /inca/live/*` (ArXiv, HuggingFace models, Paperswithcode, Semantic Scholar, Reports, Research Trends)  
*Monte Carlo:* `GET /monte-carlo/jobs` | `POST /monte-carlo/simulate` | `POST /monte-carlo/simulate/custom` | `POST /monte-carlo/backtest` | `POST /monte-carlo/calibrate` | `GET /monte-carlo/scenarios` + CRUD  
*Dreamscape (Campaign Automation):* Full CRUD on campaigns, scripts, storyboards, reviews, voice-assets, campaign-assets | `GET /dreamscape/live/*` (5 live feeds)  
*Worldline (Signal Tracking):* `GET/POST /worldline/signals` | `GET/POST /worldline/sources` | `GET /worldline/features/:matterId` | `GET /worldline/recovery-markers` | `GET /worldline/regulatory` | `GET /worldline/weather`  
*Usage / Metering:* `GET/POST /usage` | `GET /orgs/:orgSlug/usage` | `GET /orgs/:orgSlug/usage/history` | Full metering route group (2FA verification, event batches, quota checks, billing sync, usage summaries, budget alerts, quota snapshots, forecast events, overages, granular events, partner/multi-tenant metering)  
*Tenant Provisioning:* Full CRUD on tenant lifecycle, onboarding flows, Azure AD integration, branding, SCIM provisioning, custom domains, partner access  
*Microsoft Graph / Integrations:* `GET /microsoft/calendar/events` | `GET /microsoft/contacts` | `GET /microsoft/onedrive/files` | `GET /microsoft/sharepoint/*` | `GET /microsoft/status` | `POST /microsoft/sync` | Salesforce OAuth/sync | Jira OAuth/sync | PagerDuty integration | NVIDIA DCGM | New Relic | HubSpot | Dynamics | SharePoint WebParts  
*Stephen (legacy profile routes — deprecated app served by API):* Full CRUD on `/stephen/*` — booking-requests, case-studies, contacts, content-blocks, portfolio-case-studies, profile, testimonials  
*Imperium (legacy — deprecated app served by API):* `GET /imperium/centurion/profiles` | `GET /imperium/cloud/metrics` | `GET /imperium/cloud/resources` | `GET /imperium/cloud/sentinels` | `GET /imperium/intelligence/briefs` | `GET /imperium/senate/proposals` | `GET /imperium/supply-lines/status`

---

## Archived / Deprecated Apps

Each of the six archived artifact directories has been individually inspected.

---

### Archived App A: Firestorm
**Directory:** `artifacts/firestorm`  
**Disposition:** ARCHIVED — merged into Aegis (preview at `/aegis/`)  
**Source code (`src/`):** Not present  
**Contents:** `dist/` (compiled bundle, read-only), `ARCHIVED.md`  
**Active workflows:** None  
**API routes serving it:** `artifacts/api-server/src/routes/firestorm/` (still active, now serves Aegis UI)  
**Action required:** None — correctly retired

---

### Archived App B: Imperium
**Directory:** `artifacts/imperium`  
**Disposition:** ARCHIVED + DEPRECATED — merged into Command (preview at `/command/`)  
**Source code (`src/`):** Not present  
**Contents:** `dist/` (compiled bundle, read-only), `ARCHIVED.md`, `DEPRECATED.md`  
**Active workflows:** None  
**API routes serving it:** `artifacts/api-server/src/routes/imperium.ts` (still active, legacy read-only)  
**Action required:** None — correctly retired

---

### Archived App C: Lyte Command Center
**Directory:** `artifacts/lyte-command-center`  
**Disposition:** ARCHIVED — merged into Command via `@lyte` shared package  
**Source code (`src/`):** Not present  
**Contents:** `dist/` (compiled bundle, read-only), `ARCHIVED.md`  
**Active workflows:** None  
**API routes serving it:** `artifacts/api-server/src/routes/lyte*.ts` files (still active, now serve Command via @lyte package)  
**Action required:** None — correctly retired

---

### Archived App D: Counsel
**Directory:** `artifacts/prism-counsel`  
**Disposition:** DEPRECATED — merged into Aegis compliance module  
**Source code (`src/`):** Not present  
**Contents:** `dist/` (compiled bundle, read-only), `DEPRECATED.md`  
**Active workflows:** None  
**API routes serving it:** `artifacts/api-server/src/routes/prism-counsel-*.ts` (still active, serving Aegis and any Counsel embeds in SZL Holdings)  
**Action required:** None — correctly retired; SZL Holdings `/prism-counsel` route redirects correctly

---

### Archived App E: Stephen Site
**Directory:** `artifacts/stephen-site`  
**Disposition:** DEPRECATED — personal founder page merged into SZL Holdings `/founder` route  
**Source code (`src/`):** Not present  
**Contents:** `dist/` (compiled bundle, read-only), `DEPRECATED.md`  
**Active workflows:** None  
**API routes serving it:** `artifacts/api-server/src/routes/stephen.ts` (still active, serving SZL Holdings `/founder` and `/stephen` routes)  
**Action required:** None — correctly retired; SZL Holdings `/stephen` route redirects correctly

---

### Archived App F: Cortex Mobile (legacy)
**Directory:** `artifacts/cortex-mobile`  
**Disposition:** DEFERRED — superseded by SZL Holdings Mobile (`artifacts/szl-holdings-mobile`)  
**Source code (`src/`):** Not present — empty scaffold only  
**Contents:** `DEFERRED.md` confirming canonical mobile is `szl-holdings-mobile`  
**Active workflows:** None  
**Action required:** None — `szl-holdings-mobile` is the correct active mobile app

---

## API ↔ UI Cross-Reference Matrix

### Confirmed UI → API Calls

| UI App | API Endpoint Called | Notes |
|---|---|---|
| Aegis | `GET /api/agent-os/feed?limit=20` | agent-insights page |
| Aegis | `GET /api/audit-chain/events?limit=50` | audit-chain page |
| Aegis | `POST /api/billing/aegis/enterprise-quote` | pricing page |
| Aegis | `POST /api/documents/generate` | document-engine page |
| Aegis | `POST /api/intelligence/ai/threat-triage` | SOC triage |
| Aegis | `POST /api/intelligence/ai/domain-agent` | intel pages |
| Aegis | `GET /api/nuro-mesh/consciousness` | consciousness page |
| Vessels | `GET /api/agent-os/feed?limit=20` | agent-insights page |
| Vessels | `POST /api/intelligence/ai/dark-vessel-analysis` | intelligence page |
| Vessels | `POST /api/intelligence/ai/maritime-intelligence` | intelligence page |
| Vessels | `GET /api/services/health/app/vessels` | observability page |
| Vessels | `GET /api/vessels/live/ais` | ais-live page |
| Vessels | `GET /api/vessels/live/ais/combined` | multiple pages |
| Vessels | `GET /api/vessels/trading/fills` | trading-desk (broken TS) |
| Vessels | `GET /api/vessels/trading/instruments` | trading-desk (broken TS) |
| Vessels | `GET /api/vessels/trading/orders` | trading-desk (broken TS) |
| Vessels | `GET /api/vessels/trading/pnl` | trading-desk (broken TS) |
| Vessels | `GET /api/vessels/trading/positions` | trading-desk (broken TS) |
| Vessels | `GET /api/intelligence/maritime/chokepoints` | intelligence page |
| Vessels | `GET /api/intelligence/maritime/sanctions` | intelligence page |
| Vessels | `GET /api/intelligence/maritime/vessels` | intelligence page |
| Vessels | `GET /api/intelligence/maritime/weather` | intelligence page |
| Carlota Jo | `GET /api/booking/reservations` | booking page |
| Carlota Jo | `GET /api/booking/services?limit=20` | book page |
| Carlota Jo | `POST /api/documents/generate` | proposal-generator |
| Carlota Jo | `POST /api/intelligence/ai/advisory` | advisory page |
| Carlota Jo | `GET /api/partner/portals` | portal-admin page |
| Carlota Jo | `GET /api/portal/documents` | client-portal/documents |
| Carlota Jo | `GET /api/portal/messages` | client-portal/messages |
| Carlota Jo | `GET /api/portal/updates` | client-portal/updates |
| Carlota Jo | `POST /api/stripe/checkout` | booking page |
| Command | `GET /api/briefing/today` | strategy page |
| Command | `POST /api/briefing/generate` | executive-briefing page |
| Command | `GET /api/briefing/history?limit=14` | briefing history |
| Command | `POST /api/simulation/what-if` | simulation page |
| Command | `POST /api/billing/command/subscribe` | pricing |
| Command | `POST /api/auth/register` | signup |
| Command | `GET /api/health` | status page |
| Command | `GET /api/public/status/subscribe` | status page |
| SZL Holdings | `GET /api/audit?limit=10` | trust/exports |
| SZL Holdings | `GET /api/cortex/action-drafts` | autopilot |
| SZL Holdings | `GET /api/cortex/briefing/today` | multiple pages |
| SZL Holdings | `GET /api/cortex/intelligence-feed` | intelligence pages |
| SZL Holdings | `POST /api/cortex/whatif` | nexus |
| SZL Holdings | `GET /api/cross-app/family/health` | autopilot |
| SZL Holdings | `GET /api/fund-ops/portfolio-financials` | fund pages |
| SZL Holdings | `GET /api/fund-ops/seed` | fund seeding |
| SZL Holdings | `GET /api/fusion/alerts?limit=50` | fusion |
| SZL Holdings | `GET /api/fusion/patterns` | fusion |
| SZL Holdings | `GET /api/fusion/predictive/alerts?limit=50` | fusion |
| SZL Holdings | `POST /api/gdpr/export` | trust/exports |
| SZL Holdings | `GET /api/holdings/inquiries` | holdings |
| SZL Holdings | `GET /api/holdings/kpis` | autopilot |
| SZL Holdings | `GET /api/notifications?limit=100` | notifications |
| SZL Holdings | `PATCH /api/notifications/read-all` | notifications |
| SZL Holdings | `GET /api/observability` | observability |
| SZL Holdings | `GET /api/public/status` | status |
| SZL Holdings | `GET /api/public/uptime-history` | status |

### UI Routes with Broken API References (compile-time errors)

| File | Issue | Endpoint |
|---|---|---|
| `vessels/src/pages/marketing-demo.tsx:17` | `API_BASE` undefined — TS2304 | Undefined |
| `terra/src/pages/distress-engine.tsx:14,18,524` | `API_BASE` undefined ×3 — TS2304 | Undefined |
| `terra/src/pages/commercial-intelligence.tsx:10` | `API_BASE` undefined — TS2304 | Undefined |
| `szl-holdings/src/pages/ai-cost-analytics.tsx:77,86` | `API_BASE` undefined ×2 — TS2304 | Undefined |
| `szl-holdings/src/pages/demo.tsx:287` | `API_BASE` undefined — TS2304 | Undefined |

### API Route Files with No Confirmed UI Consumers

| Route File | Reason UI is absent |
|---|---|
| `routes/msp-live.ts` | Aegis MSP module uses static data; none of 13 MSP pages call `msp-live` endpoints |
| `routes/vessels-insurance.ts` | `vessels/insurance-panel.tsx` uses static data |
| `routes/terra-distress.ts` | `terra/distress-engine.tsx` is broken (API_BASE undefined) |
| `routes/dreamscape.ts` / `dreamscape-live.ts` | No active UI found in any active app |
| `routes/inca-live.ts` | `szl-holdings/inca` page is hardcoded |
| `routes/monte-carlo.ts` | No UI found in active apps |
| `routes/outcome-graph.ts` | No UI found |
| `routes/receipt-graph.ts` | `szl-holdings-mobile/operations/receipts` tabs — possibly wired but not confirmed |
| `routes/multiplayer-sessions.ts` | No UI found |
| `routes/innovation-engine.ts` | No UI found |
| `routes/decisioning.ts` | Has TS errors (unbuilt dist packages); Aegis decisioning page exists but API wiring is untested |
| `routes/imperium.ts` | Imperium is archived; no active UI |
| `routes/stephen.ts` | `szl-holdings/founder` redirects use some Stephen API; coverage unclear |
| `routes/firestorm-command-surfaces.ts` | Aegis pages may use these; not confirmed by grep |

---

## Cross-App Consistency

| Dimension | Status | Notes |
|---|---|---|
| **Auth library** | ✅ Consistent | All web apps use Clerk/OIDC via shared `auth.ts`; mobile uses `expo-secure-store` + `BiometricProvider` |
| **UI component library** | ✅ Consistent | `@szl-holdings/shared-ui` across all web apps; `@szl-holdings/mobile-shared` for mobile |
| **Routing** | ✅ Consistent | All web apps use Wouter with `import.meta.env.BASE_URL`; mobile uses Expo Router |
| **Data fetching** | ✅ Consistent | TanStack Query v5 across all web and mobile |
| **Typography** | ✅ Consistent | Inter + Space Grotesk across web and mobile |
| **Color theming** | ⚠️ Divergent | No shared CSS design token file; each app defines its own palette |
| **Navigation chrome** | ⚠️ Inconsistent | Each app has different sidebar/nav pattern — no shared navigation component |
| **`/pulse` route** | ✅ Consistent | Present in Aegis, Vessels, Terra, Carlota Jo, SZL Holdings, Command |
| **`/atlas-artifacts` route** | ✅ Consistent | Aegis, Vessels, Terra |
| **`/trust-provenance` route** | ✅ Consistent | Aegis, Vessels, Terra |
| **`/document-engine` route** | ✅ Consistent | Aegis, Vessels, Terra, Carlota Jo |
| **`/observability` route** | ✅ Consistent | Aegis, Vessels, Terra, Carlota Jo, SZL Holdings |
| **"Coming soon." fallback** | ✗ Shared bug | Aegis `unified-settings.tsx` and SZL Holdings `unified-settings-page.tsx` both show the identical literal fallback — same unimplemented component |
| **`DemoXxx` component naming** | ✗ Shared concern | Command app uses `DemoSignals`, `DemoAlerts`, etc. — visible pattern during screen share |

---

## Per-App Prioritized Fix Backlog

### Aegis

**P0 — Demo Blockers**
- P0-AEG-01: Replace "Coming soon." fallback in `settings/unified-settings.tsx` with skeleton panels for the top 3 setting sections.

**P1 — Hollow Screens**
- P1-AEG-01: Populate 13 MSP module pages (`/ops/*`) using `msp-live.ts` API routes.
- P1-AEG-02: Wire `stix-taxii.tsx` to the API.
- P1-AEG-03: Wire 10 Nexus module pages to API-backed data (geopolitical-risk, scenario-wargaming, etc.).
- P1-AEG-04: Wire `tradecraft-engine.tsx` and `adversary-engine.tsx` to threat data APIs.
- P1-AEG-05: Wire `intel/agent-spawner.tsx` and `intel/llm-evaluation.tsx` to live ML pipeline.

**P2 — Polish**
- P2-AEG-01: Remove duplicate `threat-intel.tsx` / `threat-intel-feed.tsx` or consolidate into one canonical route.
- P2-AEG-02: Review `xdr-incident-workbench.tsx`, `phantom/tabletop.tsx` for TODO sections.
- P2-AEG-03: Review `consciousness.tsx` and `sacsayhuaman-shield.tsx` for investor-visible rough edges.

---

### Vessels

**P0 — Demo Blockers**
- P0-VES-01: Replace inline stub `/dashboard/billing` route with a real billing UI panel.
- P0-VES-02: Replace inline stub `/dashboard/team` with team management UI or styled empty state.
- P0-VES-03: Replace inline stub `/dashboard/audit-log` with a paginated audit event table from `audit-chain.ts`.
- P0-VES-04: Fix `API_BASE` undefined in `marketing-demo.tsx`.
- P0-VES-05: Fix `ChevronRight` undefined import in `predictive-maintenance.tsx`.

**P1 — Hollow Screens**
- P1-VES-01: Wire `trading-desk.tsx`; fix `instrumentId` → `instrument` type error.
- P1-VES-02: Wire `dark-vessel-detection.tsx`, `dark-fleet-economics.tsx`, `sts-detection.tsx` to `vessels-live.ts`.
- P1-VES-03: Wire `sanctions-screening.tsx` and `piracy-sanctions.tsx` to the intelligence API.
- P1-VES-04: Populate `intelligence-briefs.tsx` from the API.
- P1-VES-05: Wire `command-workflows.tsx` to API-backed workflow definitions.

**P2 — Polish**
- P2-VES-01: Fix circular type definitions in `src/data/types.ts`.
- P2-VES-02: Wire `marketing-sign-in.tsx` to real auth flow.
- P2-VES-03: Seed ≥3 vessel records so `vessels-list.tsx` is never empty on first load.

---

### Terra

**P0 — Demo Blockers**
- P0-TER-01: Fix `API_BASE` undefined in `distress-engine.tsx` (×3).
- P0-TER-02: Fix `apiFetch` import conflict and `API_BASE` undefined in `commercial-intelligence.tsx`.

**P1 — Hollow Screens**
- P1-TER-01: Replace `brokerage.ts` local imports in `listings.tsx`, `leads.tsx`, `deals.tsx`, `transactions.tsx`, `offers.tsx`, `documents.tsx` with `useQuery` calls to `terra-crm/` API routes.
- P1-TER-02: Replace `portfolio.ts` local imports in `dashboard.tsx`, `portfolio-dashboard.tsx`, `portfolio-performance.tsx`, `pipeline.tsx`, `market.tsx`, `analytics.tsx` with API-backed data.
- P1-TER-03: Replace `property-twin.ts` local imports in `property-desk.tsx`, `diligence-prep.tsx`, `readiness-board.tsx`, `what-changed.tsx` with `terra-live.ts` API calls.
- P1-TER-04: Wire `distress-pipeline.tsx` and `distress-radar.tsx` to `terra-distress.ts`.
- P1-TER-05: Populate `pro-forma.tsx`, `waterfall-calculator.tsx`, `rent-roll.tsx` with financial model data.
- P1-TER-06: Ensure `computer-vision.tsx`, `zoning-intelligence.tsx`, `spatial-walkthrough.tsx` show populated demo output.

**P2 — Polish**
- P2-TER-01: Consolidate `climate-risk.tsx` and `climate-risk-enhanced.tsx` into one canonical page.
- P2-TER-02: Add fallback empty state to `property-map-page.tsx` when no properties are in the DB.

---

### Carlota Jo

**P0 — Demo Blockers**
- P0-CAR-01: Verify `/book` and `/booking` forms submit to API and show success state end-to-end.

**P1 — Hollow Screens**
- P1-CAR-01: Populate 5 client portal routes with realistic demo client data from `carlota-live.ts`.
- P1-CAR-02: Wire `proposal-generator.tsx` to produce real AI output from `/api/documents/generate`.
- P1-CAR-03: Wire `time-tracking.tsx` and `capacity-planner.tsx` to API data.
- P1-CAR-04: Seed `knowledge-vault.tsx` and `benchmark-database.tsx` with visible entries on first load.
- P1-CAR-05: Wire `contact.tsx` form to `/api/contact` and show success message.

**P2 — Polish**
- P2-CAR-01: Wire `inquiries` page to real records from API.
- P2-CAR-02: Populate `expert-network.tsx` and `workshop-platform.tsx` with 3-5 demo entries.
- P2-CAR-03: Add visible "Delivery in progress" state to `deliverable-workflow.tsx`.

---

### Unified Command

**P0 — Demo Blockers**
- P0-CMD-01: Rename 8 `DemoXxx`-named `@lyte` components to non-"Demo" aliases in `App.tsx`.
- P0-CMD-02: Fix hardcoded `SOCIAL_PROOF` array in `marketing/signup.tsx` — replace with 4 distinct entries.

**P1 — Hollow Screens**
- P1-CMD-01: Wire `marketing/status.tsx` to `public-status.ts` API for real system health.
- P1-CMD-02: Populate `strategy/correlation-map` and `strategy/signal-chains` with real API data.
- P1-CMD-03: Implement `marketing/verify-email.tsx` to poll and redirect on email verification success.

**P2 — Polish**
- P2-CMD-01: Wire `marketing/pricing.tsx` plan CTAs to real Stripe product IDs.
- P2-CMD-02: Connect `marketing/onboarding.tsx` checklist to real backend state instead of localStorage.

---

### SZL Holdings

**P0 — Demo Blockers**
- P0-SZL-01: Delete `src/pages/admin.backup.tsx` — stale file causing TypeScript compile error.
- P0-SZL-02: Fix `admin.tsx` — add missing `Building2` and `UserCheck` icon imports.
- P0-SZL-03: Fix `developers.tsx` — add missing `Globe`, `Database`, `Webhook`, `Terminal` icon imports.
- P0-SZL-04: Fix `API_BASE` undefined in `ai-cost-analytics.tsx` and `demo.tsx`.
- P0-SZL-05: Replace "Coming soon." fallback in `unified-settings-page.tsx` with skeleton panels.

**P1 — Hollow Screens**
- P1-SZL-01: Wire all 15 Fund OS pages to `fund-ops.ts` API (currently all hardcoded string literals).
- P1-SZL-02: Replace `autopilot.tsx` `GENOME`/`APPS` hardcoded arrays with `useQuery` to autopilot endpoint.
- P1-SZL-03: Populate 11 Nuro Forge pages from `nuro-mesh.ts` and `nuro-mesh-advanced.ts`.
- P1-SZL-04: Populate 7 Venture Intel pages from `investor-analytics.ts`.
- P1-SZL-05: Deduplicate `investors-overview.tsx` and `investors-overview-v2.tsx` (both routed, both inconsistent).
- P1-SZL-06: Fix `apiFetch` import conflicts in 5 files: `azure-tenant-dashboard.tsx`, `azure-tenant-onboarding.tsx`, `powerbi-config.tsx`, `scim-provisioning.tsx`, `tenant-branding.tsx`.

**P2 — Polish**
- P2-SZL-01: Replace raw `<input>` in `distribution-os/platform-connections.tsx` with a shared-ui Input component.
- P2-SZL-02: Fix type errors in `crm-intelligence.tsx` (`probability`), `decisioning-command.tsx` (`urgency`), `ops-dependency-map.tsx` (`textTransform`).
- P2-SZL-03: Consolidate `/investor` and `/investors/overview` into one canonical investor story route.

---

### SZL Holdings Mobile

**P0 — Demo Blockers**
- P0-MOB-01: Remove "Case studies coming soon" (line 714) and "Articles coming soon" (line 778) from `founder/(tabs)/index.tsx` — replace with 2-3 seed entries.

**P1 — Hollow Screens**
- P1-MOB-01: Build out `intelligence/index.tsx` beyond single-file stub — add ≥2 tabs matching other workspace patterns.
- P1-MOB-02: Populate all 8 `mcp-tools.tsx` screens (one per workspace) with visible MCP tool list.
- P1-MOB-03: Seed `defense/(tabs)/findings.tsx` and `defense/(tabs)/incidents.tsx` so Defense workspace is never empty.
- P1-MOB-04: Seed `founder/(tabs)/articles.tsx` and `founder/(tabs)/ventures.tsx` with visible API-backed entries.
- P1-MOB-05: Add graceful empty state to `advisory/(tabs)/messages.tsx` if no messaging backend is active.

**P2 — Polish**
- P2-MOB-01: Confirm `assets/images/icon.png` and `assets/images/splash-icon.png` show the current CORTEX brand mark.
- P2-MOB-02: Verify deep-link routes (`szl-holdings://defense/findings/[id]`) open correct workspace screen from push notifications.
- P2-MOB-03: Add permission-denied states to `properties/(tabs)/scanner.tsx` and `properties/ar-viewer.tsx` for camera denial.

---

## Summary Table

| App | Pages / Screens | TypeCheck | API-Wired | Red Flags | P0 | P1 | P2 |
|---|---|---|---|---|---|---|---|
| Aegis | 155 | ✅ PASS | 58 (37%) | 108 | 1 | 5 | 3 |
| Vessels | 86 | ❌ 9 errors | 33 (38%) | 46 | 5 | 5 | 3 |
| Terra | 74 | ❌ 5 errors | 17 (23%) | 26 | 2 | 6 | 2 |
| Carlota Jo | 49 | ✅ PASS | 20 (41%) | 66 | 1 | 5 | 3 |
| Command | 22+45 | ✅ PASS | 8+ (12%) | 18 | 2 | 3 | 2 |
| SZL Holdings | 227 | ❌ 22 errors | 29 (13%) | 236 | 5 | 6 | 3 |
| SZL Mobile | 117 | N/A (Expo) | 40 (34%) | 111 | 1 | 5 | 3 |
| API Server | — | ❌ 3 errors | 2,243 endpoints | — | 0 | 0 | 0 |
| Archived (×6) | 0 each | N/A | 0 | 0 | 0 | 0 | 0 |
| **TOTAL** | **730+117** | 3/7 PASS | **~205 (28%)** | **611** | **17** | **35** | **19** |

---

*Report generated: April 16, 2026 — no product code was modified during this audit. All findings are from read-only static analysis.*
