# Demo Guide — SZL Holdings Platform

> Instructions for running demos of the governed operational intelligence platform, what to show to which audiences, and how to manage demo state.
>
> The core demo narrative: every consequential decision follows the same governed loop — Signal → Context → Recommendation → Simulation → Policy → Approval → Execution → Proof → Outcome. Domain packs add domain-specific intelligence; the governance is shared.

---

## Before Every Demo

1. Verify all required workflows are running in Replit
2. Clear any previous demo state if doing a fresh walkthrough
3. Confirm the correct demo org is seeded (`pnpm seed:demo`)
4. Open the relevant demo URL in a fresh browser window (not an existing session)
5. Have backup screenshots ready in case of network issues

---

## Demo URLs

> **Route notation:** All paths below are relative to the Replit preview root. The Command app is mounted at `/command/`; its in-app routes use the `/operations/...` prefix (e.g., the flagship loop is `/command/operations/governed-decision-loop`).

| Product | Demo URL | Auth Required |
|---------|----------|---------------|
| SZL Holdings (marketing) | `https://szlholdings.com` | No |
| Command (Unified Ops) | `/command/operations` | Yes (demo org) |
| Command — Flagship Loop | `/command/operations/governed-decision-loop` | Yes (demo org) |
| Alloy Fabric | `/alloy/` | Yes (demo org) |
| Aegis Defense | `/aegis/` | Yes (demo org) |
| Vessels Maritime | `/vessels/` | Yes (demo org) |
| Terra Real Estate | `/terra/` | Yes (demo org) |
| Carlota Jo | `/carlota-jo/` | No (public) |

> **Deprecated:** Lyte Command Center (`/lyte-command-center/`) is archived — use `/command/operations` instead. Firestorm (`/firestorm/`) is superseded by Aegis. PRISM Counsel (`/prism-counsel/`) is deprecated (task #579).

---

## What Is Live vs. Staged

### Live (Real Functionality)
- All authentication flows (login, session management, RBAC)
- Database-backed CMS content (ventures, articles, testimonials)
- Contact form submissions (land in real database)
- Trust Center and legal pages
- Carlota Jo client intake flow

### Staged / Demo Data (Not Real)
- KPI metrics and business signals in Lyte dashboards
- Fleet positions and vessel data in Vessels
- Real estate deals and distress signals in Terra
- SOAR playbook executions in Aegis
- Law firm matters and forecasts in PRISM Counsel
- Workflow execution history in Alloy

Demo data is seeded via `pnpm seed:demo` and uses realistic but entirely synthetic data.

---

## Audience-Specific Demo Flows

### Investor Demo (~20 minutes)

**Goal:** Establish platform credibility, demonstrate governance differentiation, show domain pack breadth.

**Core narrative:** "This is a governed decision platform. Every domain pack runs the same governed loop. The five platform primitives — Outcome Graph, Proof Chain, Covenant Policy, Monte Carlo, Workflow Engine — are shared infrastructure, not per-product features."

1. **Start:** `szlholdings.com` — company overview (1 min)
2. **Platform thesis:** `/platform` or `/investors/overview` — governed decision loop, five primitives (3 min)
3. **Lyte walkthrough:** Signal timeline → PRISM dashboard → Action queue → Approval gate (5 min)
4. **Alloy governance:** Workflow engine → Covenant Policy in action → Proof Chain audit trail (3 min)
5. **Trust:** `/trust-center` — security posture, AI governance model (2 min)
6. **Domain packs:** Brief overview of Aegis/Vessels/Terra as domain extensions on shared infrastructure (3 min)
7. **Close:** Roadmap, revenue model, design partner opportunity (3 min)

**What NOT to show:** Internal admin routes, investor data room (unless invited), unfinished sprint routes.

---

### Enterprise Buyer Demo (~30 minutes)

**Goal:** Demonstrate operational fit for their domain, show trust and compliance posture.

**For legal/professional services buyers (PRISM Counsel):**
1. Landing `/solutions/prism-counsel` (2 min)
2. PRISM Counsel dashboard — matter list, deadlines, forecast (5 min)
3. Copilot workbench — AI with approval gate (5 min)
4. Proof chain — immutable audit trail (3 min)
5. Trust: `/solutions/prism-counsel/trust` (3 min)
6. Discussion and Q&A (12 min)

**For maritime operators (Vessels):**
1. Landing `/solutions/vessels` (2 min)
2. Vessels dashboard — fleet map, AIS feed, alerts (5 min)
3. Exception-based workflow — dark vessel alert → Alloy action → approval (5 min)
4. Trust: `/solutions/vessels/trust` (3 min)
5. Discussion and Q&A (15 min)

**For security/defense buyers (Aegis):**
1. Landing `/solutions/aegis` (2 min)
2. Aegis SOC — threat feed, MITRE ATT&CK map (5 min)
3. SOAR playbook — Sentinel triage → human approval → response (5 min)
4. Trust: `/solutions/aegis/trust` (3 min)
5. Discussion and Q&A (15 min)

---

### Design Partner Demo (~45 minutes)

**Goal:** Deep product exploration, feedback capture, co-design opportunity.

1. Full platform walkthrough (15 min)
2. Focus on their specific domain pack in depth (15 min)
3. Show admin/configuration surfaces (appropriate routes only) (5 min)
4. Discuss customization and white-labeling options (5 min)
5. Roadmap and design partner agreement (5 min)
6. Collect structured feedback

---

## What to Show — Lyte Walkthrough

Recommended sequence for Lyte Command Center:

1. **Command Inbox** — signals arriving, priority-ranked
2. **PRISM Dashboard** — P/R/I/S/M modules with health scoring
3. **Signal Timeline** — correlated signal chain with attribution
4. **Action Queue** — pending decisions with consequence modeling
5. **Approvals Center** — human-in-the-loop gate in action
6. **Ownership Map** — accountability graph

Key talking points:
- "Not a dashboard — it's a governed decision surface"
- "Every recommendation has a source, confidence score, and approval gate — enforced by Covenant Policy"
- "The Proof Chain makes every decision reconstructable — signal to outcome"
- "Monte Carlo shows operators not just what to do, but what could happen if they do it"
- "The same five primitives power every domain pack — shared governance, domain-specific intelligence"

---

## Flagship Loop — Step-by-Step Walkthrough

The Governed Decision Loop (`/command/operations/governed-decision-loop`) is the canonical demo of the entire governed intelligence platform. It shows a real scenario — a fleet ETA compliance gap — traversing all nine steps of the decision loop powered by the five platform primitives.

**Scenario:** Three vessels (M/V Meridian, M/V Catalyst, M/V Horizon) are outside SLA threshold. The system surfaces a $2.1M risk signal, generates a reroute recommendation, simulates outcomes, gates on policy, routes to human approval, executes, seals proof, and records the outcome.

### Step 1 — Signal

- **What to show:** Signal SIG-4821 ingested from Vessel Telemetry / AIS Feed
- **Talking point:** "Every decision starts with a signal. This one came from live telemetry — three vessels are now at risk of missing SLA. The signal carries evidence and a risk estimate before a human ever sees it."
- **Primitive:** None yet — this is raw ingest

### Step 2 — Context

- **What to show:** Cross-domain intelligence from Aegis (piracy risk), Terra (port congestion), and PRISM (SLA penalty clause); 14 historical pattern matches at 87% confidence
- **Talking point:** "Lyte doesn't just surface the signal — it enriches it. Aegis knows there's a piracy advisory in the same waters. Terra knows Singapore port is congested. PRISM knows the contract has a penalty clause that triggers in 96 hours. No human had to connect those dots."
- **Primitive:** Proof Chain (provenance of each enrichment source)

### Step 3 — Recommendation

- **What to show:** REC-0421 — reroute recommendation with 82% confidence, reasoning chain, and model attribution (szl-ops-advisor-v3)
- **Talking point:** "The AI generates a specific recommendation with its reasoning fully exposed — not a black box. You can see every factor it weighed, what it deprioritized, and the alternative it considered. If an operator overrides it, that gets recorded too."
- **Primitive:** Proof Chain (model ID, provider, confidence, prompt attribution)

### Step 4 — Simulation

- **What to show:** Monte Carlo — three scenarios (Reroute, Maintain Route, Negotiate SLA). Highlight the distribution chart and tornado sensitivity drivers.
- **Talking point:** "Before asking anyone to approve anything, the system runs 10,000 simulations. It shows you not just the expected outcome — the median, the worst case, the best case — but which variables drive the most uncertainty. Weather delay matters most; fuel price matters less."
- **Primitive:** Monte Carlo

### Step 5 — Policy Gate

- **What to show:** Four Covenant Policy evaluations all passing — high-severity approval gate, financial threshold check, compliance logging, cross-domain sign-off requirement
- **Talking point:** "Covenant Policy runs automatically before any human sees an approval request. It checks whether the action is even legal to approve, who needs to sign off, and whether any compliance rules apply. Here, four policies ran in under 10ms and all passed."
- **Primitive:** Covenant Policy

### Step 6 — Approval

- **What to show:** Three-step approval chain — Fleet Ops Lead, Finance Controller, CEO — all approved with timestamps and comments
- **Talking point:** "This is the human-in-the-loop gate. The system knows who needs to approve based on the policy evaluation — it doesn't just email everyone. Each approver sees the recommendation, the simulation, and the proof chain before they sign."
- **Primitive:** Covenant Policy (role-based routing), Workflow Engine (state machine)

### Step 7 — Execution

- **What to show:** Five execution steps — authorization verified, reroute order dispatched, fuel surcharge logged, client notified, audit trail sealed — all in 4.2 seconds
- **Talking point:** "Once all approvals are in, the workflow engine executes the action. Each sub-step is instrumented — the vessel got the reroute order via VSAT, the finance system was updated, the client was notified, and the proof chain was sealed, all in 4.2 seconds."
- **Primitive:** Workflow Engine, Proof Chain

### Step 8 — Proof Chain

- **What to show:** Two proof records — the recommendation (AI Generated, 82% confidence, approved by Marcus Chen) and the simulation result (System Computed, 84% confidence). Show input sources and lineage.
- **Talking point:** "The Proof Chain is the immutable record. Every piece of AI content has a fingerprint — source class, model attribution, confidence score, who reviewed it, and what data it was derived from. If this decision is ever questioned — in an audit, in litigation, by a regulator — this is the record."
- **Primitive:** Proof Chain

### Step 9 — Outcome

- **What to show:** Outcome OUT-2104 — Achieved — $2.1M protected, 97% prediction accuracy, operator feedback, downstream impact (contract renewal probability +17%)
- **Talking point:** "Twenty-nine hours later, the outcome is recorded. The SLA was protected. The system's prediction was 97% accurate. The operator left feedback. And now this decision becomes a training signal — the next time a similar pattern appears, the system's confidence will be higher."
- **Primitive:** Outcome Graph (decision memory, learning loop)

---

### Flagship Loop — Key Talking Points

- "This is a single decision. Everything you just saw — signal to outcome — is the governed decision loop. Every decision on this platform runs through this loop."
- "The five primitives are invisible to operators. They experience it as: a signal appears, a recommendation is there, it's already been vetted, I approve, it executes, I can see exactly what happened."
- "This isn't a demo feature. The same Covenant Policy engine, the same Proof Chain, the same Monte Carlo engine powers Aegis, Vessels, and Terra. Domain-specific intelligence, shared governance."
- "The loop closes. Outcomes feed back in. The system learns. After 50 similar decisions, the recommendation confidence for this pattern will be in the 90s."

---

## What to Show — Alloy Walkthrough

1. **Factory Floor** — active workflow canvas
2. **Signal Feed** — normalized signals from all sources
3. **Workflow Orchestration** — DAG view of a workflow in execution
4. **Governance Audit** — audit log of all workflow actions
5. **Connector Mesh** — 40+ integration connectors

---

## Screenshots for Demos

Key screenshots for offline/backup use are in `docs/media/screenshots/`:
- `landing-hero.jpg` — main landing page
- `lyte-overview.jpg` — Lyte PRISM dashboard
- `alloy-overview.jpg` — Alloy factory floor
- `trust-center.jpg` — Trust Center overview

Refresh screenshots before major demos:
```bash
pnpm capture:screens
```

---

## Demo Environment Reset

If demo state is messy or stale:

```bash
pnpm seed:demo
```

This reseeds all demo data for the canonical demo organization. Does not affect production data.

For a specific product's demo org only:
```bash
pnpm --filter scripts run seed:demo -- --product lyte
pnpm --filter scripts run seed:demo -- --product vessels
```

---

## During the Demo — Practical Tips

- Use a dedicated browser profile for demos (no personal accounts, no browser history visible)
- Keep browser dev tools closed
- If something breaks, have screenshots ready as backup
- Acknowledge any rough edges with confidence: "This is alpha — we're validating the core workflow here"
- Never apologize for missing features — pivot to what's working
- Record demos (with consent) for async review

---

## Post-Demo

1. Log the demo in the CRM/pipeline
2. Send follow-up within 24 hours
3. Note any feedback or questions that came up
4. If demo data needs cleanup, run `pnpm seed:demo` to reset
