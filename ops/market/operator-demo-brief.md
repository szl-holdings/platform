# Operator Demo Brief

**For**: Sales engineers, solutions consultants, and technical team members running 15-minute operator demos  
**Audience**: VP Operations, Chief of Staff, IT Directors, operations leads, senior operators  
**Duration**: 15 minutes  
**Goal**: Show the operator experience — signal triage, governed execution, audit evidence, and cross-domain intelligence — clearly and at pace

---

## Preparation

Before the demo:
1. Open Command at `/command/strategy` — confirm the Governed Decision Loop loads cleanly
2. Have `/operations/prism/signals` ready in a second tab
3. Know the active demo scenario: **Vessels — MV Meridian Star course deviation**
4. Demo mode label ("DEMO") should be visible in the header bar — this confirms synthetic data

Demo environment URL: set by your SE team per engagement. Default: the Replit-hosted demo instance.

---

## Opening Frame (1 min)

> "I'm going to walk you through a live scenario — a maritime fleet management situation — from the moment a signal is detected to the moment an action is taken and a proof trail is generated. The same loop applies to every domain: security, real estate, financial. What you're seeing is the governed execution engine."

> "The key thing I want you to hold onto: every step is visible, every decision has evidence, and every action generates a permanent receipt. Let's go."

Set screen to: `/command/strategy`

---

## Section 1 — Signal Triage (3 min)

Navigate to: `/operations/prism/signals`

### What to show
1. The signal feed — sorted by severity. Point out the critical signal at the top.
2. Click into **"Fleet ETA compliance gap — 3 vessels outside SLA"**
3. In the signal detail panel, walk through:
   - Severity badge (critical) and source attribution (Vessels AIS Intelligence)
   - Summary: 3 vessels, 14-hour ETA gap, SLA penalty clause triggered
   - Evidence items: AIS deviation, weather delay correlation, historical match ($1.8M breach in Q3 2025)
   - Confidence score: 87%
4. Click into the cross-domain signals section:
   - Aegis: piracy advisory elevated to Level 3 in the Bay of Bengal
   - Terra: port congestion at Singapore adding 18hr delays
   - PRISM: SLA contract clause triggers at 96hr delay

### Key talking points
- "This signal wasn't emailed to someone. It was detected, classified, enriched, and surfaced automatically."
- "The cross-domain context is what makes this different from a monitoring alert. The AI pulled in three external signals to understand the full picture before surfacing this."
- "Every source is attributed. You can trace every evidence point back to the originating system."

---

## Section 2 — Governed Decision Loop (5 min)

Navigate to: `/command/strategy` (Governed Decision Loop)

### Step-by-step walk

**Step 1: Signal**
> "Same signal we just triaged. Now we're in the command surface — the place where we take action."

Point out: signal ID (SIG-4821), domain badge (Vessels), severity (Critical), entities (M/V Meridian, M/V Catalyst, M/V Horizon).

**Step 2: Context**
> "The AI pulled in 4 enrichment sources: AIS Live Feed, Weather API, Port Authority Database, and the Contract Management System. 14 prior cases matched this pattern. 87% pattern confidence."

**Step 3: Recommendation**
> "REC-0421: Authorize fuel surcharge pass-through and reroute M/V Meridian via Strait of Malacca to recover the 14-hour ETA gap."

Point out: 82% confidence, 4 reasoning items, alternative action visible.

**Step 4: Simulation**
> "Before this goes to humans for approval, the system runs a Monte Carlo simulation — 10,000 iterations. Here's what it shows."

Walk through scenarios:
- Reroute (recommended): median net savings $1.82M, 84% confidence
- Maintain route: median expected loss $850K, 41% confidence
- Negotiate SLA: median $580K savings, 62% confidence

> "This is the risk/reward matrix. The recommendation is data-driven, not intuition-driven."

Point to sensitivity drivers: weather delay is the dominant variable.

**Step 5: Policy Gate**
> "Before it goes to any human, it hits the Covenant Policy engine. 4 policies evaluated automatically."

Walk through each:
- High-severity → human approval required: **passed**
- Financial action > $50K → finance review: **passed** (within operational mandate)
- Compliance event → immutable audit log: **passed**
- Cross-domain impact → domain lead sign-off: **passed**

> "All of this happened in milliseconds. No one had to read a policy document."

**Step 6: Approval**
> "Now it goes to humans — but only the right humans, with the right context."

Walk through the approval chain:
- Fleet Operations Lead (Marcus Chen): approved at 09:18 — "Confirmed weather window. Reroute is the right call."
- Finance Controller (Aisha Kamara): approved at 09:25 — "Fuel surcharge within Q2 contingency budget."
- CEO (Stephen Lutar): approved at 09:45 — "Approved. Protect the SLA — client relationship is strategic."

> "33 minutes from signal to CEO sign-off. Each approver saw the same evidence. No information gaps."

**Step 7: Execution**
> "Once the CEO approved, the reroute order was dispatched automatically. No one had to make an API call. The workflow engine handled it."

Point to the execution log: each step streamed live as it happened.

**Step 8: Proof Chain**
> "This is the permanent record. Everything that happened is here: what was recommended, what model generated it, what confidence it had, who reviewed it, when they approved it, what was executed."

Point to proof entries:
- PF-9041: Operational Recommendation — model, confidence, reviewer, note
- PF-9042: Monte Carlo Simulation Result — reviewed by Finance Controller

> "This is what your legal team will ask for after an incident. This is what a regulator will ask for. It's here. It's immutable."

**Step 9: Outcome**
> "And we close the loop. SLA breach avoided. $2.1M protected. Prediction accuracy logged."

> "The next time a similar signal appears, the system has 15 cases to learn from, not 14."

---

## Section 3 — Audit & Proof Trail (3 min)

Navigate to: `/operations/trust-audit`

### What to show
1. The proof chain audit — all AI-generated outputs with review state
2. Filter to "approved" — show the clean record
3. Open one record: source, model, confidence, reviewer, export safety flag
4. Navigate to `/operations/approvals`
5. Show the approvals center — pending, approved, and rejected in one view
6. Open an approved action: decision context, approver's comment, execution link

### Key talking points
- "Every AI-generated output has a review state: pending, approved, or rejected. Nothing executes without it."
- "Export safety flags tell you which outputs can be shared externally. That matters for client reports, investor updates, and regulatory filings."
- "This is the audit surface that your compliance team would use. It's designed for them — not for engineers."

---

## Section 4 — Executive Intelligence Layer (2 min)

Navigate to: `/strategy/executive-briefing`

### What to show
1. Cross-domain synthesis — all domain packs in one briefing
2. Show a pending recommendation surfaced from the briefing
3. Note: "This is what the CEO sees at the start of every day. Not a list of alerts — a synthesis."

### Key talking points
- "The executive briefing isn't built from one data source. It's correlated across all active domain packs."
- "A recommendation surfaced here has already passed policy evaluation. It's not raw data — it's pre-governed."

---

## Section 5 — Wrap (1 min)

Return to `/command/strategy`.

> "What you just walked through is the full governed execution loop. Signal detected automatically. Context enriched from multiple sources. Recommendation generated with evidence. Monte Carlo simulation for risk/reward clarity. Policies auto-evaluated. Human approval chain with evidence parity. Execution automated on approval. Proof chain generated. Outcome measured and fed back."

> "Every operator who works in this system knows exactly what they're approving and why. Every decision is traceable. Every action is reversible if needed. That's operational confidence at enterprise scale."

**Transition to**: technical deep-dive, integration questions, or next steps

---

## Common Operator Questions

**"How does it connect to our existing systems?"**
> "Domain packs connect via API or native integration. The integration health dashboard shows every connection — status, last sync, error rate. We support REST, GraphQL, webhooks, and several native connectors for common enterprise systems."

**"What if an operator rejects a recommendation?"**
> "The rejection is logged with the operator's reason. The recommendation is marked rejected in the proof chain. The system learns from rejections over time — patterns of rejection indicate model gaps that need tuning."

**"Can operators customize the approval chain?"**
> "Yes. The Covenant Policy engine is configurable per domain, per signal type, and per financial threshold. You define the approval chain — who approves what, in what order, with what timeout. The engine enforces it."

**"What happens if an approver misses the window?"**
> "The system escalates. You configure the escalation path — next approver, manager, or auto-reject after N hours. It's fully auditable — you can see every escalation event."

**"How does it handle false positives?"**
> "Operators can dismiss or snooze signals. Every dismissal is logged with a reason. Over time, patterns of dismissal help tune the signal detection model — reducing noise without reducing sensitivity."

---

## Cheat Sheet — Key URLs

| Surface | Path | When to Use |
|---------|------|-------------|
| Governed Decision Loop | `/strategy` | Core demo centerpiece |
| Executive Briefing | `/strategy/executive-briefing` | Executive synthesis view |
| Signal Feed | `/operations/prism/signals` | Live signal triage |
| Approvals Center | `/operations/approvals` | Human-in-the-loop evidence |
| Proof Chain Audit | `/operations/trust-audit` | Compliance and audit surface |
| Action Queue | `/operations/alloy/actions` | Execution log detail |
| Workflow Canvas | `/operations/alloy/canvas` | Workflow configuration |
| Policy Engine | `/operations/alloy/governance` | Covenant Policy rules |
