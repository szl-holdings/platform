# 03 — Competitive Benchmark
*One-of-One Audit · SZL Holdings Platform · April 2026*

---

## Method
For each SZL surface, identify the 2–3 strongest in-market comparables. Extract specific design, IA, and copy principles. Assign explicit "adopt / innovate / reject" verdicts per principle.

---

## 1. SZL Holdings — Portfolio & Control Hub

### Comparables
| Reference | Why it benchmarks |
|-----------|------------------|
| **Stripe Dashboard** | Gold standard for developer-facing SaaS — dense, scannable, dark-light adaptive, micro-interactions |
| **Linear** | Information density, keyboard-first, snappy routing, opinionated IA with minimal chrome |
| **Vercel Dashboard** | Deployment status clarity, environment switching, real-time updates without refresh |

### Benchmarked Principles

| Principle | Reference | Verdict |
|-----------|-----------|---------|
| Global search that finds anything (⌘K) surfaces instantly | Linear | **ADOPT** — wire CommandPalette portfolio-wide |
| Every dashboard number is clickable and drills to raw data | Stripe | **ADOPT** — all KPIs must link to underlying detail |
| Environment indicator is always visible, top-right | Vercel | **ADOPT** — EcosystemNav already has this |
| Dark + light theme as first-class (not afterthought) | Stripe | **INNOVATE** — we go dark-first; light is optional enterprise |
| "What changed" delta indicators next to every metric | Vercel | **ADOPT** — already in WhatChanged pages; make them universal |
| Pricing page with actual numbers, not "contact us" | Stripe | **REJECT** — enterprise pricing works differently |

---

## 2. Sentra — Cyber Resilience

### Comparables
| Reference | Why it benchmarks |
|-----------|------------------|
| **Anduril Lattice** | Military-grade situational awareness UI — no wasted pixels, everything is live |
| **CrowdStrike Falcon** | Alert triage density, MITRE ATT&CK coverage visualization |
| **Palo Alto Cortex XSOAR** | Incident timeline, playbook orchestration, evidence linking |

### Benchmarked Principles

| Principle | Reference | Verdict |
|-----------|-----------|---------|
| Every alert card shows: severity, MITRE tactic, confidence, age | CrowdStrike | **ADOPT** — AlertCard in shared-ui needs these four fields required |
| Incident timeline is the canonical view, not a table | XSOAR | **ADOPT** — IncidentCommander page should lead with timeline |
| Asset topology updates in real-time (WebSocket / SSE) | Lattice | **INNOVATE** — use SSE from api-server; no WS overhead |
| Heatmap for control coverage by framework domain | CrowdStrike | **ADOPT** — Control Drift page needs framework-mapped heatmap |
| "Go to war room" CTA from any incident card | XSOAR | **ADOPT** — add cross-surface jump to Command war room |
| Separate analyst vs. executive view | CrowdStrike | **REJECT** — our Pulse briefing covers executive; keep unified |

---

## 3. Aegis — Investor Pitch Deck

### Comparables
| Reference | Why it benchmarks |
|-----------|------------------|
| **Palantir Foundry marketing site** | Institutional weight, trust signals, product-led proof |
| **Figma investor deck best practices** | Constraint: one idea per slide, no bullet points, data > words |
| **Arc Browser pitch deck** | Story-first, zero jargon, emotional before rational |

### Benchmarked Principles

| Principle | Reference | Verdict |
|-----------|-----------|---------|
| Each slide has exactly one claim, supported by one data point | Figma standards | **ADOPT** — audit every slide for single-claim rule |
| Demo screenshots show real data, not placeholder | Palantir | **ADOPT** — wire slides to seeded tenant data |
| "Why us, why now" as a standalone slide | Arc | **ADOPT** — add to S03 or S04 |
| Long slide decks with 30+ slides | Common mistake | **REJECT** — cap at 18 slides |
| TAM slides using top-down market sizing | Common mistake | **REJECT** — use bottoms-up or serviceable market |

---

## 4. Vessels — Maritime Intelligence

### Comparables
| Reference | Why it benchmarks |
|-----------|------------------|
| **Windward** | Best-in-class maritime risk visualization, vessel behavior scoring |
| **Kpler** | Commodity flow intelligence, cargo tracking, sanctions mapping |
| **Pole Star / GISIS** | Fleet tracking depth, regulatory compliance, port state control |

### Benchmarked Principles

| Principle | Reference | Verdict |
|-----------|-----------|---------|
| Vessel risk score must be a single number with color + delta | Windward | **ADOPT** — FleetDashboard risk column |
| Sanctions screening shows chain of beneficial ownership | Kpler | **ADOPT** — SanctionsChainExplorer already does this; needs polish |
| AIS gap detection highlighted on vessel timeline | Windward | **ADOPT** — Dark vessel detection page needs AIS gap timeline |
| Every sanctions hit shows: entity, list, confidence, alt name | Pole Star | **ADOPT** — SanctionsScreening card requires all four fields |
| Predictive ETA based on weather + port congestion | Kpler | **INNOVATE** — our Monte Carlo voyage twin goes further |
| Separate desktop-only experience | Windward | **REJECT** — we maintain mobile parity |

---

## 5. Terra — Real Estate Intelligence

### Comparables
| Reference | Why it benchmarks |
|-----------|------------------|
| **Reonomy (CoStar)** | Commercial real estate ownership intelligence, property graph |
| **Causal** | Financial modeling with Monte Carlo, scenario analysis |
| **Bridgewater Daily Observations** | Principle-backed investment thesis, provenance of reasoning |

### Benchmarked Principles

| Principle | Reference | Verdict |
|-----------|-----------|---------|
| Ownership graph with UBO chain and stale-data indicators | Reonomy | **ADOPT** — OwnershipGraph page needs UBO depth + freshness |
| Scenario model shows: base / bull / bear with probability | Causal | **ADOPT** — PortfolioScenario needs three-case overlay |
| Every investment recommendation cites its sources | Bridgewater | **ADOPT** — this is our core proof chain; surface it in RecommendationCard |
| Pro forma with real-time cap rate benchmarks | Reonomy | **ADOPT** — ProForma page needs market comp overlay |
| Tenant screening shows payment history and lease clause flags | Reonomy | **ADOPT** — TenantScreening page needs risk scoring |
| PDF export as primary workflow | Common mistake | **REJECT** — we keep everything in-platform; export is secondary |

---

## 6. Counsel / PRISM Counsel — Legal Intelligence

### Comparables
| Reference | Why it benchmarks |
|-----------|------------------|
| **Ironclad** | Contract lifecycle management — obligation tracking, workflow |
| **Relativity** | Legal review platform — evidence management, privilege control |
| **Palantir Gotham** | Entity graph, evidence linking, cross-domain intelligence |

### Benchmarked Principles

| Principle | Reference | Verdict |
|-----------|-----------|---------|
| Obligation timeline with countdown + owner + clause link | Ironclad | **ADOPT** — ObligationTimeline needs countdown chip |
| Privilege log auto-generated from document metadata | Relativity | **ADOPT** — PrivilegeControls page |
| Every entity in the graph has: type, risk score, evidence count | Gotham | **ADOPT** — DependencyGraph needs entity metadata chips |
| "Red line" comparison for contract amendments | Ironclad | **INNOVATE** — our Alloy can generate redlines; surface in MatterOverview |
| Separate paralegal / attorney / client views | Ironclad | **REJECT** — use RBAC role-based module visibility instead |

---

## 7. Lyte — Decision Intelligence

### Comparables
| Reference | Why it benchmarks |
|-----------|------------------|
| **Linear** | Issue graph, cycle view, keyboard-first, no wasted pixels |
| **Notion** | Flexible workspace, board + timeline hybrid, team collaboration |
| **Bloomberg Terminal** | Information density, multi-pane, real-time data feeds |

### Benchmarked Principles

| Principle | Reference | Verdict |
|-----------|-----------|---------|
| Every decision in the board view has: status, owner, deadline, AI recommendation | Linear | **ADOPT** — DecisionCenter board card |
| Signal console shows delta from baseline + trend sparkline | Bloomberg | **ADOPT** — SignalsConsole needs sparkline column |
| Policy evaluation result shown inline next to every action | Linear | **ADOPT** — PolicyCenter verdict must be inline, not modal |
| Keyboard shortcut to move decision through stages | Linear | **ADOPT** — wire PowerUserProvider |
| Infinite scroll for decision history | Notion | **REJECT** — paginate with cursor; infinite scroll breaks ⌘K |

---

## 8. Pulse — AI Executive Briefing

### Comparables
| Reference | Why it benchmarks |
|-----------|------------------|
| **Morning Brew / Axios** | Brevity, scannable, curated, every item actionable |
| **Bloomberg Intelligence** | Source-cited analysis, sector coverage, quantitative backing |
| **Andreessen Horowitz a16z Podcast** | Narrative-first, thesis-backed, "so what" always answered |

### Benchmarked Principles

| Principle | Reference | Verdict |
|-----------|-----------|---------|
| Every briefing item has: headline, one-liner, so-what, source | Axios | **ADOPT** — BriefingEngine card structure |
| Source citations shown as chips, clickable to source entity | Bloomberg | **ADOPT** — BriefingDetail citation links |
| "Confidence level" shown for every AI-generated insight | Bloomberg | **ADOPT** — already in ConfidenceDashboard; show inline |
| Dissent channel lets user annotate + push back | a16z | **ADOPT** — DissentChannel is a moat; surface more prominently |
| Long-form AI essays replacing actionable briefings | Common mistake | **REJECT** — keep everything <250 words per item |

---

## 9. Command — Unified Control Tower

### Comparables
| Reference | Why it benchmarks |
|-----------|------------------|
| **Datadog** | Multi-product observability, trace → log → metric linking |
| **Retool** | Internal tool builder — component density, grid layout, data source wiring |
| **PagerDuty** | Incident response coordination, runbook integration, on-call management |

### Benchmarked Principles

| Principle | Reference | Verdict |
|-----------|-----------|---------|
| Trace view with parent-child spans, latency breakdown | Datadog | **ADOPT** — CognitiveLayers traces page |
| Every cross-platform alert shows: surface, severity, affected entity | PagerDuty | **ADOPT** — CrossPlatform alerts page |
| Dashboard builder with drag-and-drop sections | Retool | **INNOVATE** — we don't build a builder; we curate a canonical view |
| Runbook linked from every incident, auto-suggested | PagerDuty | **ADOPT** — Command's governed cockpit needs runbook links |
| On-call schedule rotations | PagerDuty | **REJECT** — not in scope for platform v1 |

---

## Cross-Surface Design Principles (Universal Adoptions)

The following principles apply to every surface in the portfolio.

### Typography & Density
- **Body text:** 13–14px, weight 400–500, line-height 1.5 — never smaller than 12px for data.
- **Data density:** Default to "compact" table rows (32px). No Airbnb-style spacious layouts.
- **Mono font for all numbers, IDs, timestamps:** JetBrains Mono.

### Color
- **Semantic colors only:** Use system-level state colors (allowed green, approval amber, blocked red, neutral grey). No decorative gradients.
- **Per-surface accent:** Single accent color used for primary CTAs, active nav item, ring highlights — nowhere else.
- **Dark-first:** `hsl(214,16%,4%)` base. Light theme available but not required in v1.

### States
- **Every list/table must have:** empty state with icon + message + primary action; loading skeleton matching the shape of real content; error boundary with retry + contact support.
- **No "Coming Soon" anywhere visible to investors or prospects.**

### Navigation
- **Canonical IA:** Every surface follows Overview → Workspaces → Decision Center → Trust/Proof → Settings. Workspaces section contains the surface-specific pages.
- **Cross-surface context preservation:** Tenant, time range, and entity selection survive navigation between surfaces.
- **⌘K palette:** Available from every surface. Searches pages, entities, decisions, agents, proofs.

### Copy Voice
- **Verb-first labels:** "Review Approvals" not "Approvals Review." "Trace Decision" not "Decision Tracing."
- **No filler phrases:** Remove "powered by AI," "leveraging machine learning," "state-of-the-art." Describe what the system actually does.
- **Quantify everything:** "3 decisions pending" not "Pending decisions." "12 sanctions hits, 2 critical" not "Sanctions screening results."
- **Authority tone:** Write as if the platform is the source of record, not a helper app. "The decision is blocked — 3 policy conditions unmet" not "We couldn't process this request."
