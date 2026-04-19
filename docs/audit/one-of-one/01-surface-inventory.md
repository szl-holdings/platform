# 01 — Surface Inventory
*One-of-One Audit · SZL Holdings Platform · April 2026*

---

## Scope
Every web artifact in the SZL ecosystem, with per-route current-state classification and data sources.

**Classification codes**
| Code | Meaning |
|------|---------|
| ✅ LIVE | Fully built, real data / seeded mock, investor-demoable |
| 🟡 PARTIAL | Exists with real shell but incomplete logic or placeholder data sections |
| 🔶 PLACEHOLDER | Renders but contains no real logic ("Coming Soon" / stub card) |
| 🔴 ORPHANED | Route registered but unreachable or duplicate of another |
| 🗂 MARKETING | Public-facing landing / marketing page — different quality bar |

---

## 1. SZL Holdings (`/`) — Portfolio & Control Hub

**Purpose:** Public marketing site + internal operator control surface + investor portal.
**Audience:** Investors, founders, operators, admin.
**Accent:** Teal `#14b8a6`
**Shell:** Custom SiteNav + SiteFooter (not using shared DashboardShell)

| Route | Label | State | Notes |
|-------|-------|-------|-------|
| `/` | Landing | ✅ LIVE | Full Governed Autonomy Loop storytelling |
| `/platform` | Platform Overview | ✅ LIVE | Architecture diagram, tier breakdown |
| `/solutions` | Solutions Hub | ✅ LIVE | Per-domain solution cards |
| `/solutions/aegis` | Sentra Security | ✅ LIVE | |
| `/solutions/vessels` | Vessels Maritime | ✅ LIVE | |
| `/solutions/terra` | Terra Real Estate | ✅ LIVE | |
| `/solutions/prism-counsel` | PRISM Counsel | ✅ LIVE | |
| `/solutions/lyte` | Lyte Decision | ✅ LIVE | |
| `/solutions/aegis-trust` | Trust/Aegis | ✅ LIVE | |
| `/solutions/vessels-trust` | Trust/Vessels | ✅ LIVE | |
| `/solutions/terra-trust` | Trust/Terra | ✅ LIVE | |
| `/solutions/prism-counsel-trust` | Trust/Counsel | ✅ LIVE | |
| `/solutions/lyte-trust` | Trust/Lyte | ✅ LIVE | |
| `/pricing` | Pricing | ✅ LIVE | Tier cards |
| `/investors` | Investor Hub | ✅ LIVE | |
| `/investors/overview` | Investor Overview | ✅ LIVE | |
| `/investors/overview-v2` | Overview V2 | 🔴 ORPHANED | Duplicate of v1 |
| `/investors/architecture` | Architecture | ✅ LIVE | |
| `/investors/moat` | Moat Analysis | ✅ LIVE | |
| `/investors/data-room` | Data Room | 🟡 PARTIAL | Gated but sparse content |
| `/investors/founder` | Founder Profile | ✅ LIVE | |
| `/investors/founder-v2` | Founder V2 | 🔴 ORPHANED | Duplicate |
| `/investors/roadmap` | Roadmap | ✅ LIVE | |
| `/investors/trust` | Investors Trust | ✅ LIVE | |
| `/trust` | Trust Center | ✅ LIVE | SOC 2 / compliance overview |
| `/trust/security` | Security | ✅ LIVE | |
| `/trust/ai` | AI Trust | ✅ LIVE | |
| `/trust/governance` | Governance | ✅ LIVE | |
| `/trust/architecture` | Architecture | ✅ LIVE | |
| `/trust/approvals` | Approvals | ✅ LIVE | |
| `/trust/operations` | Operations | ✅ LIVE | |
| `/trust/status` | Status | ✅ LIVE | |
| `/trust/exports` | Exports | ✅ LIVE | |
| `/trust/diligence/executive` | Due Diligence – Exec | ✅ LIVE | |
| `/trust/diligence/investor` | Due Diligence – Investor | ✅ LIVE | |
| `/trust/diligence/security` | Due Diligence – Security | ✅ LIVE | |
| `/trust/diligence/technical` | Due Diligence – Technical | ✅ LIVE | |
| `/pulse` | Pulse Briefing | ✅ LIVE | Cross-domain executive briefing |
| `/decision-center` | Decision Center | ✅ LIVE | |
| `/governed-cockpit` | Governed Cockpit | ✅ LIVE | |
| `/command-center` | Command Center | ✅ LIVE | |
| `/forge` | Forge Overview | ✅ LIVE | |
| `/forge/registry` | Agent Registry | ✅ LIVE | |
| `/forge/drift` | Drift Monitor | ✅ LIVE | |
| `/forge/promotions` | Promotions | ✅ LIVE | |
| `/forge/telemetry` | Telemetry | ✅ LIVE | |
| `/nuro-forge` | Nuro Forge Hub | ✅ LIVE | |
| `/nuro-forge/arena` | Arena | 🟡 PARTIAL | |
| `/nuro-forge/blueprints` | Blueprints | 🟡 PARTIAL | |
| `/fund` | Fund Operations | ✅ LIVE | |
| `/fund/nav-dashboard` | NAV Dashboard | ✅ LIVE | |
| `/fund/cap-table` | Cap Table | ✅ LIVE | |
| `/fund/lp-portal` | LP Portal | ✅ LIVE | |
| `/fund/deal-scoring` | Deal Scoring | ✅ LIVE | |
| `/fund/portfolio-intelligence` | Portfolio Intel | ✅ LIVE | |
| `/founder` | Founder Hub | ✅ LIVE | |
| `/alloy` | Alloy | ✅ LIVE | Agent orchestration |
| `/distribution-os` | Distribution OS | 🟡 PARTIAL | Multiple sub-pages |
| `/venture-intel` | Venture Intel | ✅ LIVE | |
| `/admin` | Admin | ✅ LIVE | |
| `/admin/design-partners` | Design Partners | ✅ LIVE | |
| `/admin/growth-command` | Growth Command | ✅ LIVE | |
| `/observability` | Observability | ✅ LIVE | |
| `/org-settings` | Org Settings | ✅ LIVE | |
| `/onboarding` | Onboarding Wizard | ✅ LIVE | |
| `/about`, `/company`, `/leadership`, `/press` | Marketing | 🗂 MARKETING | |
| `/docs` | Docs | ✅ LIVE | |
| `/docs/*` | Doc sub-pages | ✅ LIVE | |
| `/changelog` | Changelog | ✅ LIVE | |
| `/security` | Security Page | ✅ LIVE | |
| `/legal/*` | Legal pages | ✅ LIVE | |
| `/status` | Status | ✅ LIVE | |
| `/contact` | Contact | ✅ LIVE | |
| `/roi-calculator` | ROI Calculator | ✅ LIVE | |

**Total routes:** ~200+. Orphaned: ~3. Placeholders: ~5.

---

## 2. Sentra — Cyber Resilience Command (`/sentra/`)

**Purpose:** Security operations — incident response, asset risk, exposure, compliance.
**Audience:** CISO, SOC analysts, security operators.
**Accent:** Red `#ef4444`
**Shell:** Shared `DashboardShell` + `SidebarNav` + `EcosystemNav` ✅

| Route | Label | State |
|-------|-------|-------|
| `/` (landing) | Sentra Landing | 🗂 MARKETING |
| `/dashboard` | Dashboard | ✅ LIVE |
| `/resilience` | Resilience Scorecard | ✅ LIVE |
| `/threats` | Threat Overview | ✅ LIVE |
| `/assets` | Asset Risk Graph | ✅ LIVE |
| `/recovery` | Recovery Readiness | ✅ LIVE |
| `/incident` | Incident Commander | ✅ LIVE |
| `/exposure` | Exposure Board | ✅ LIVE |
| `/controls` | Control Drift | ✅ LIVE |
| `/decision-center` | Decision Center | ✅ LIVE |
| `/alerts` | Alerts | ✅ LIVE |
| `/approvals` | Approvals | ✅ LIVE |
| `/trust` | Trust & Provenance | ✅ LIVE |

**Total routes:** 13. All live.

---

## 3. Aegis — Investor Pitch Deck + Security Platform (`/aegis/`)

**Purpose:** Dual purpose: investor pitch slides AND deep security analytics (CISO, SOC, MSP, threat intel).
**Audience:** Investors (slides) + security operators (app pages).
**Accent:** Violet `#a855f7`
**Shell:** Custom bespoke shell (NOT using shared DashboardShell) ⚠️

| Route Segment | Label | State | Notes |
|--------------|-------|-------|-------|
| `/` | Home | ✅ LIVE | Routes to marketing home |
| `/slides/S01*` through `/slides/S15*` | Pitch deck slides | ✅ LIVE | Dual slide sets |
| `/soc-dashboard` | SOC Dashboard | ✅ LIVE | |
| `/threat-intelligence` | Threat Intelligence | ✅ LIVE | |
| `/threat-hunting` | Threat Hunting | ✅ LIVE | |
| `/incidents` | Incidents | ✅ LIVE | |
| `/compliance` | Compliance | ✅ LIVE | |
| `/decision-center` | Decision Center | ✅ LIVE | |
| `/governed-cockpit` | Governed Cockpit | ✅ LIVE | |
| `/pulse` | Pulse | ✅ LIVE | Duplicate of Pulse app |
| `/intel/*` | Intelligence sub-pages | ✅ LIVE | |
| `/nexus/*` | Nexus threat intel | ✅ LIVE | |
| `/governance/*` | Governance sub-pages | ✅ LIVE | |
| `/msp/*` | MSP console | ✅ LIVE | |
| `/settings/unified-settings` | Settings | ✅ LIVE | |
| ~100+ other routes | Various | 🟡 PARTIAL / ✅ LIVE | |

**Total routes:** ~150+. Shell is bespoke — highest priority for migration.

---

## 4. Counsel — Legal Matter Command (`/counsel/`)

**Purpose:** Legal matter management — obligations, risk, approvals, trust.
**Audience:** General counsel, legal ops, compliance officers.
**Accent:** Violet `#8b5cf6`
**Shell:** Shared `DashboardShell` + `SidebarNav` + `EcosystemNav` ✅

| Route | Label | State |
|-------|-------|-------|
| `/` (landing) | Counsel Landing | 🗂 MARKETING |
| `/dashboard` | Dashboard | ✅ LIVE |
| `/matters` | Matter Overview | ✅ LIVE |
| `/obligations` | Obligation Timeline | ✅ LIVE |
| `/dependencies` | Dependency Graph | ✅ LIVE |
| `/performance` | Counsel Performance | ✅ LIVE |
| `/risk` | Risk & Exposure Desk | ✅ LIVE |
| `/decision-center` | Decision Center | ✅ LIVE |
| `/alerts` | Alerts | ✅ LIVE |
| `/approvals` | Approvals | ✅ LIVE |
| `/trust` | Trust & Provenance | ✅ LIVE |

**Total routes:** 11. All live.

---

## 5. PRISM Counsel — Legal Command (`/prism-counsel/`)

**Purpose:** Advanced legal intelligence — obligation graph, privilege controls, proof chain.
**Audience:** Senior legal, compliance, external counsel.
**Accent:** Violet `#8b5cf6`
**Shell:** Unknown — smaller surface ⚠️

| Route | Label | State |
|-------|-------|-------|
| `/` | Marketing Landing | 🗂 MARKETING |
| `/matters` | Matter Board | ✅ LIVE |
| `/obligations` | Obligation Timeline | ✅ LIVE |
| `/obligation-graph` | Obligation Graph | ✅ LIVE |
| `/deadlines` | Deadline Heatmap | ✅ LIVE |
| `/privilege` | Privilege Controls | ✅ LIVE |
| `/evidence` | Evidence | ✅ LIVE |
| `/audit-trail` | Audit Trail | ✅ LIVE |
| `/proof-chain-export` | Proof Chain Export | ✅ LIVE |

**Total routes:** 9. All live.

---

## 6. Vessels — Maritime Intelligence (`/vessels/`)

**Purpose:** Maritime operations — fleet tracking, sanctions, voyage economics, risk.
**Audience:** Fleet operators, compliance officers, trading desks, port managers.
**Accent:** Cyan `#0ea5e9`
**Shell:** Shared `DashboardShell` + `SidebarNav` + `EcosystemNav` + CommandPalette + OnboardingWizard ✅✅

| Route | Label | State |
|-------|-------|-------|
| `/` (landing) | Marketing Home | 🗂 MARKETING |
| `/dashboard` | Fleet Dashboard | ✅ LIVE |
| `/fleet` | Fleet Map | ✅ LIVE |
| `/vessels` | Vessels List | ✅ LIVE |
| `/vessel/:id` | Vessel Detail | ✅ LIVE |
| `/voyages` | Voyage Desk | ✅ LIVE |
| `/sanctions` | Sanctions Screening | ✅ LIVE |
| `/dark-vessels` | Dark Vessel Detection | ✅ LIVE |
| `/intelligence` | Maritime Intelligence | ✅ LIVE |
| `/risk` | Risk Scoring | ✅ LIVE |
| `/decision-center` | Decision Center | ✅ LIVE |
| `/approvals` | Approvals Review | ✅ LIVE |
| `/trust` | Trust & Provenance | ✅ LIVE |
| `/pulse` | Pulse | ✅ LIVE |
| `/audit-log` | Audit Log | ✅ LIVE |
| `/cargo` | Cargo Tracking | ✅ LIVE |
| `/bunker-optimizer` | Bunker Optimizer | ✅ LIVE |
| `/decarbonization` | Decarbonization | ✅ LIVE |
| `/weather` | Weather Routing | ✅ LIVE |
| `/ports` | Port Analytics | ✅ LIVE |
| `/economics` | Voyage Economics | ✅ LIVE |
| `/replay` | Route Replay | ✅ LIVE |
| `/scenario-branches` | Scenario Branches | ✅ LIVE |
| `/atlas-runtime` | Atlas Runtime | 🟡 PARTIAL |
| `/settings` | Settings | ✅ LIVE |
| ~40 more routes | Various | 🟡 PARTIAL / ✅ |

**Total routes:** ~80. Most live. Richest surface in the ecosystem.

---

## 7. Terra — Real Estate Intelligence (`/terra/`)

**Purpose:** Real estate investment — portfolio analytics, underwriting, market intelligence.
**Audience:** Real estate investors, fund managers, brokers.
**Accent:** Green `#10b981`
**Shell:** Shared `DashboardShell` + `SidebarNav` + `EcosystemNav` (via terra-layout) ✅

| Route | Label | State |
|-------|-------|-------|
| `/` | Marketing Landing | 🗂 MARKETING |
| `/dashboard` | Portfolio Dashboard | ✅ LIVE |
| `/portfolio` | Portfolio Performance | ✅ LIVE |
| `/market` | Market Analytics | ✅ LIVE |
| `/properties` | Property Desk | ✅ LIVE |
| `/property/:id` | Property Detail | ✅ LIVE |
| `/pipeline` | Deal Pipeline | ✅ LIVE |
| `/deals` | Deals | ✅ LIVE |
| `/underwriting` | Underwriting Copilot | ✅ LIVE |
| `/diligence` | Diligence Room | ✅ LIVE |
| `/decision-center` | Decision Center | ✅ LIVE |
| `/evidence` | Evidence | ✅ LIVE |
| `/trust` | Trust Provenance | ✅ LIVE |
| `/pulse` | Pulse | ✅ LIVE |
| `/agents` | Agents Command | ✅ LIVE |
| `/approval-review` | Approval Review | ✅ LIVE |
| `/ownership-graph` | Ownership Graph | ✅ LIVE |
| `/climate-risk` | Climate Risk | ✅ LIVE |
| `/distress` | Distress Engine | ✅ LIVE |
| `/rent-roll` | Rent Roll | ✅ LIVE |
| `/tax-appeal` | Tax Appeal | ✅ LIVE |
| `/covenant-monitoring` | Covenant Monitoring | ✅ LIVE |
| `/scenario-branches` | Scenario Branches | ✅ LIVE |
| `/replay` | Replay | ✅ LIVE |
| `/atlas-runtime` | Atlas Runtime | 🟡 PARTIAL |
| `/observability` | Observability | ✅ LIVE |
| `/governed-cockpit` | Governed Cockpit | ✅ LIVE |
| ~30 more routes | Various | 🟡 PARTIAL / ✅ |

**Total routes:** ~80+. Rich, well-populated surface.

---

## 8. Lyte — Decision Intelligence (`/lyte/`)

**Purpose:** Operational decision nerve center — signal stream, entity graph, run console, policy center.
**Audience:** Operations leads, decision owners, platform admins.
**Accent:** Cyan `#06b6d4`
**Shell:** Unknown — appears lightweight ⚠️

| Route | Label | State |
|-------|-------|-------|
| `/` | Landing | 🗂 MARKETING |
| `/overview` | Overview | ✅ LIVE |
| `/decision-center` | Decision Center | ✅ LIVE |
| `/run-console` | Run Console | ✅ LIVE |
| `/signals` | Signals Console | ✅ LIVE |
| `/entity-graph` | Entity Graph | ✅ LIVE |
| `/evidence-explorer` | Evidence Explorer | ✅ LIVE |
| `/policy-center` | Policy Center | ✅ LIVE |
| `/board-view` | Board View | ✅ LIVE |
| `/action-debt` | Action Debt | ✅ LIVE |
| `/decision-replay` | Decision Replay | ✅ LIVE |
| `/decision-twin` | Decision Twin | ✅ LIVE |
| `/ownership-drift` | Ownership Drift | ✅ LIVE |
| `/pressure-map` | Pressure Map | ✅ LIVE |
| `/workflow-health` | Workflow Health | ✅ LIVE |
| `/eval-studio` | Eval Studio | ✅ LIVE |

**Total routes:** 16. All live.

---

## 9. Pulse — AI Executive Briefing (`/pulse/`)

**Purpose:** AI-generated cross-domain executive briefings with source citations.
**Audience:** C-suite, executive team, board members.
**Accent:** Amber `#f59e0b`
**Shell:** Custom — appears to have own layout ⚠️

| Route | Label | State |
|-------|-------|-------|
| `/` | Today's Brief | ✅ LIVE |
| `/briefings` | Briefing Engine | ✅ LIVE |
| `/library` | Briefing Library | ✅ LIVE |
| `/custom` | Custom Brief Builder | ✅ LIVE |
| `/briefing/:id` | Briefing Detail | ✅ LIVE |
| `/confidence` | Confidence Dashboard | ✅ LIVE |
| `/dissent` | Dissent Channel | ✅ LIVE |
| `/constellation` | Constellation Graph | ✅ LIVE |
| `/decision-center` | Decision Center | ✅ LIVE |
| `/governed-cockpit` | Governed Cockpit | ✅ LIVE |
| `/settings` | Settings | ✅ LIVE |
| `/health` | System Health | ✅ LIVE |

**Total routes:** 12. All live.

---

## 10. Unified Command (`/command/`)

**Purpose:** Cross-domain control tower — AI cognitive layer, cross-platform analytics, governance, eval lab.
**Audience:** Platform admins, AI operators, enterprise IT.
**Accent:** Cyan `#00d4ff`
**Shell:** Shared `DashboardShell` + `SidebarNav` ✅

| Route | Label | State |
|-------|-------|-------|
| `/dashboard` | Dashboard | ✅ LIVE |
| `/decision-center` | Decision Center | ✅ LIVE |
| `/cognitive` | Cognitive Layer Hub | ✅ LIVE |
| `/cognitive/traces` | Traces | ✅ LIVE |
| `/cognitive/memory` | Memory | ✅ LIVE |
| `/cognitive/planner` | Planner | ✅ LIVE |
| `/cognitive/evals` | Evals | ✅ LIVE |
| `/cognitive/verifier` | Verifier | ✅ LIVE |
| `/cognitive/self-model` | Self Model | ✅ LIVE |
| `/cognitive/world-model` | World Model | ✅ LIVE |
| `/cognitive/reflection` | Reflection | ✅ LIVE |
| `/cognitive/policies` | Policies | ✅ LIVE |
| `/cross-platform` | Cross Platform | ✅ LIVE |
| `/cross-platform/signal-correlation` | Signal Correlation | ✅ LIVE |
| `/cross-platform/evidence-registry` | Evidence Registry | ✅ LIVE |
| `/cross-platform/run-health` | Run Health | ✅ LIVE |
| `/cross-platform/pilot-intelligence` | Pilot Intelligence | ✅ LIVE |
| `/governance` | Governance | ✅ LIVE |
| `/eval-lab` | Eval Lab | ✅ LIVE |
| `/evidence-explorer` | Evidence Explorer | ✅ LIVE |
| `/governed-cockpit` | Governed Cockpit | ✅ LIVE |
| `/demo-launchpad` | Demo Launchpad | ✅ LIVE |
| `/alerts` | Alerts | ✅ LIVE |
| `/atlas-runtime` | Atlas Runtime | 🟡 PARTIAL |
| `/health` | Health | ✅ LIVE |
| `/costs` | AI Costs | ✅ LIVE |
| ~20 more routes | Various | 🟡 PARTIAL / ✅ |

**Total routes:** ~60+.

---

## 11. Carlota Jo Consulting (`/carlota-jo/`)

**Purpose:** Professional services consultancy showcase — distinct brand, separate identity.
**Audience:** Consulting prospects, clients.
**Accent:** Violet `#a855f7`
**Shell:** Custom marketing-style shell ⚠️

**Status:** Standalone micro-site. Minimal overlap with platform surfaces.

---

## 12. SZL Holdings Mobile (`/szl-holdings-mobile/`)

**Purpose:** Expo/React Native mobile companion — biometric auth, cross-domain command.
**Audience:** Executives, operators on mobile.
**Status:** 🟡 PARTIAL — shell exists, navigation aligned, limited feature parity with web.

---

## 13. Aegis Demo Video (`/szl-demo-video/`)

**Purpose:** Animated video demo of Governed Autonomy narrative.
**Status:** ✅ LIVE — renders video artifact.

---

## Summary Table

| Surface | Shell Pattern | Routes | State | Priority |
|---------|--------------|--------|-------|----------|
| SZL Holdings | Custom SiteNav | ~200 | 95% live | Medium |
| Sentra | Shared Shell ✅ | 13 | 100% live | Low |
| Aegis | Bespoke ⚠️ | ~150 | 90% live | HIGH |
| Counsel | Shared Shell ✅ | 11 | 100% live | Low |
| PRISM Counsel | Unknown ⚠️ | 9 | 100% live | Medium |
| Vessels | Shared Shell ✅ | ~80 | 95% live | Low |
| Terra | Shared Shell ✅ | ~80 | 95% live | Low |
| Lyte | Unknown ⚠️ | 16 | 100% live | Medium |
| Pulse | Custom ⚠️ | 12 | 100% live | Medium |
| Command | Shared Shell ✅ | ~60 | 95% live | Low |
| Carlota Jo | Custom ⚠️ | ~20 | Live | Low |
| Mobile | Expo | ~15 | Partial | Low |
| Demo Video | Video | 1 | Live | Low |
