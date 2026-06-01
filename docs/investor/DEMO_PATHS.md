# Demo Paths — Live Platform Walkthrough

> SZL Holdings Investor & Evaluator Guide · April 2026

This document defines the approved live demo walkthrough paths for investor meetings, design partner evaluations, and enterprise evaluations.

---

## Prerequisites

Before running a live demo:
1. Verify the demo environment is seeded: `pnpm seed:demo`
2. Confirm all services are running: `pnpm verify:health`
3. Test all demo paths in a clean browser session (incognito/private)
4. Close all non-demo browser tabs
5. Have the platform facts handy: `docs/platform-facts.md`

**Login credentials for demo sessions** are provided separately and are never committed to this repository.

---

## Demo Path 1: Investor Overview (12 minutes)

*For: First-time investor meetings. Shows breadth and governance thesis.*

### Step 1 — SZL Holdings Dashboard (2 min)
- Open: `/` (SZL Holdings Dashboard)
- Show: Portfolio overview with multi-domain signal tiles
- Talking points: "This is the executive layer — every domain packs signals into one view"
- Highlight: PRISM signal tiles (People, Revenue, Infrastructure, Security, Market)

### Step 2 — Governed Decision Flow (3 min)
- Open: `/command/` (Unified Command)
- Show: A live recommendation card with source citations and confidence score
- Walk through: Signal → Recommendation → Simulation → Approval gate
- Highlight: "The AI cannot execute — it recommends. Human approval is enforced at the policy layer."

### Step 3 — Domain Depth — Vessels (3 min)
- Open: `/vessels/`
- Show: Fleet map → select a vessel → voyage P&L → sanctions screening result
- Talking points: "Same governance primitives, different domain intelligence"
- Highlight: Cross-domain alert surfacing (if a vessel has a sanctions hit, a legal flag surfaces in Counsel)

### Step 4 — Trust Infrastructure (2 min)
- Open: Proof Chain audit trail view (accessible from any vessel action)
- Show: Immutable audit event with actor, timestamp, action, and decision context
- Talking points: "Every consequential action is permanently recorded. No silent failures."

### Step 5 — Mobile Command (2 min)
- Open: CORTEX Mobile app or `/szl-holdings-mobile/`
- Show: Domain workspace selector, notification panel, biometric auth indicator
- Talking points: "Operations don't stop when executives leave the desk"

---

## Demo Path 2: Technical Due Diligence (20 minutes)

*For: Technical evaluators, CTOs, engineering leads.*

### Step 1 — Repository and CI (3 min)
- Open: GitHub repository
- Show: CI badge green, CodeQL green, Dependabot active
- Walk through: `README.md` architecture diagram and primitive table
- Open: `.github/workflows/ci.yml` — show the gate structure

### Step 2 — Platform Primitives (5 min)
- Open: `docs/architecture/platform-primitives.md`
- Walk through each primitive: Outcome Graph, Proof Chain, Covenant Policy, Decision Simulation, Workflow Engine, Event Fabric
- Show: A live Proof Chain event in the platform
- Show: A Covenant Policy approval gate in action

### Step 3 — Multi-Tenancy and RBAC (4 min)
- Open: `docs/security/access-control-matrix.md`
- Walk through: 11-role RBAC, org_id scoping, deny-by-default enforcer
- Show: API response with org scoping (developer tools network panel)

### Step 4 — API and Data Layer (4 min)
- Open: `docs/architecture/api-spec.md`
- Show: Route inventory, auth model, typed API contracts
- Open: `lib/api-zod/` — Zod schema definitions
- Talking points: "TypeScript throughout, type-safe API contracts, codegen hooks"

### Step 5 — Testing and Quality (4 min)
- Run: `pnpm validate` — show it passing
- Open: `docs/audit/FINAL_VALIDATION_REPORT.md`
- Show: Test coverage, smoke test results, TypeScript strict mode

---

## Demo Path 3: Domain Pack Deep Dive (15 minutes)

*For: Domain-specific evaluators — one path per domain.*

### Terra — Real Estate Intelligence
1. `/terra/` — Distress pipeline (kanban view)
2. Select a distressed property → AI analysis panel → ownership graph
3. Pro Forma module → enter assumptions → see scenario output
4. Deal notes and workflow state

### Vessels — Maritime Intelligence
1. `/vessels/` — Fleet overview map
2. Select vessel → voyage economics → demurrage tracking
3. Sanctions screening — show a flagged result
4. S&P workflow → approval gate

### Carlota Jo — Advisory Operations
1. `/carlota-jo/` — Client portfolio overview
2. Select client → engagement timeline → service catalog
3. Note the premium light-mode aesthetic

---

## Frequently Asked Demo Questions

| Question | Answer Path |
|---------|-------------|
| "Is this real data?" | "All demo data is seeded — realistic but fictional. Real customer data is never in the demo environment." |
| "Is the AI actually running?" | "Yes — recommendations come from live AI inference. In demo mode, the model uses seeded context." |
| "How does the audit trail work?" | "Every action writes an immutable Proof Chain event with actor, timestamp, and decision context." |
| "Can we see the mobile app?" | "Yes — CORTEX is a native iOS/Android app built with Expo. Here's the mobile view." |

---

*SZL Holdings Investor & Evaluator Guide · April 2026*
