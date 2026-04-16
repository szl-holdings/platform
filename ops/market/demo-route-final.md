# Demo Route — Final (April 2026)

## Overview

The canonical demo surfaces the governed execution loop: **Signal → Evaluation → Recommendation → Approval → Action → Proof**. Every step is observable, every decision has a receipt, every action is reversible with a full audit trail.

Two routes are defined: a 5-minute executive route and a 15-minute operator route. Both start in the same place — the Governed Decision Loop on the Strategy tab.

---

## Entry Point

**URL**: `/command/` → redirects to `/command/strategy`  
**Starting surface**: Strategy → Governed Decision Loop

The Governed Decision Loop is the centerpiece of the demo. It walks through a maritime scenario (MV Meridian Star course deviation) in 9 steps with realistic scenario data, confidence scoring, Monte Carlo simulation, policy gate evaluation, and a 3-step human approval chain.

---

## 5-Minute Route — Executive

**Audience**: C-suite, investors, board-level reviewers  
**Goal**: Show the value proposition in one complete cycle. Governed execution, human oversight, proof trail.

| Step | Screen | Duration | Key Point |
|------|--------|----------|-----------|
| 1 | Strategy → Governed Decision Loop | 1:30 | Signal detected → AI enriches context → recommendation generated with 82% confidence |
| 2 | Policy Gate tab | 0:45 | Covenant Policies auto-evaluated — 4 policies, all passed, no manual review needed |
| 3 | Approval tab | 1:00 | 3-step human approval chain: Fleet Ops Lead → Finance Controller → CEO |
| 4 | Proof Chain tab | 0:45 | Immutable receipt: source, model, confidence, lineage, reviewer |
| 5 | Outcome tab | 0:30 | SLA breach avoided, $2.1M protected — outcome logged and feedback loop closed |
| Wrap | — | 0:30 | "Every decision is auditable, every action is reversible, every outcome is measured" |

**Navigation path**: `/strategy` → (walk through 9-step panel: Signal → Context → Recommendation → Simulation → Policy Gate → Approval → Execution → Proof Chain → Outcome)

---

## 15-Minute Route — Operator + Executive

**Audience**: VP Operations, Chief of Staff, technical evaluators, enterprise buyers  
**Goal**: Show depth across the full governed loop plus cross-domain signals and operator-level execution power.

### Section 1 — Signal Triage (3 min)
**Surface**: Operations → Signal Feed (`/operations/prism/signals`)

1. Show the live signal feed — sorted by severity
2. Open a critical signal: "Fleet ETA compliance gap — 3 vessels outside SLA"
3. Click into signal detail: evidence panel, source attribution, confidence score
4. Show the domain cross-reference (Aegis threat advisory + Terra port congestion)
5. Note: "Every signal is source-attributed. No black boxes."

### Section 2 — Governed Decision Loop (5 min)
**Surface**: Strategy → Governed Decision Loop (`/strategy`)

Walk through all 9 steps with the vessels scenario active:

1. **Signal** — Critical maritime alert, detected automatically from AIS telemetry
2. **Context** — AI enriches with cross-domain signals (piracy advisory, port congestion, SLA clause)
3. **Recommendation** — REC-0421: Reroute via Strait of Malacca, 82% confidence, 4 evidence points
4. **Simulation** — Monte Carlo: 10,000 iterations, reroute saves $1.82M median vs $850K loss on maintain
5. **Policy Gate** — 4 Covenant Policies auto-checked: financial threshold, human approval gate, audit log, domain lead sign-off
6. **Approval** — 3-step chain, each approver saw the same evidence. Fleet Ops → Finance → CEO. Approved in 33 minutes.
7. **Execution** — Reroute order dispatched. Execution log streamed live. No manual API calls.
8. **Proof Chain** — Immutable receipt: what was recommended, who approved, what was executed, what changed
9. **Outcome** — SLA breach avoided. $2.1M protected. Prediction accuracy logged for model feedback.

Key callouts:
- "AI proposes. Humans decide. Systems execute. Everything is recorded."
- "The proof chain is the audit trail your legal, compliance, and board teams need."

### Section 3 — Audit & Trust Surface (3 min)
**Surface**: Operations → Proof Chain Audit (`/operations/trust-audit`) and Operations → Approvals (`/operations/approvals`)

1. Show the proof chain audit — immutable log of every AI-generated output
2. Show the approvals center — pending, approved, and rejected actions with full decision context
3. Open an approved action: see the evidence, the approver's comment, the execution log
4. Note: "A regulator, a board member, or a new CEO can trace every decision to its source in seconds."

### Section 4 — Cross-Domain Intelligence (2 min)
**Surface**: Strategy → Executive Briefing (`/strategy/executive-briefing`)

1. Show the cross-domain briefing — all domain packs synthesized into an executive summary
2. Note: signals from Vessels, Aegis, Terra, and PRISM are correlated automatically
3. Show a pending recommendation surfaced from the briefing

### Section 5 — Wrap (2 min)
Return to Strategy → Governed Decision Loop.

Close: "This is what governed AI execution looks like. Every action is traceable. Every decision has a receipt. You see the full loop — from signal to outcome — in one surface."

---

## Demo Mode Indicator

The Command interface shows a clear environment label in the header bar:

- **DEMO** banner (gold) — displayed when `VITE_DEPLOY_ENV` is set to `demo` or `simulated`
- All data panels in the Governed Decision Loop carry "synthetic" labels
- The proof chain panel shows "Decision Receipt · synthetic" in its header
- The audit trail shows "synthetic · demo scenario" footer when expanded
- The environment pill in the top-right status bar also shows the current environment (DEMO, PILOT, SEEDED, etc.)

Demo mode is controlled by the `VITE_DEPLOY_ENV` environment variable:
- `demo` — full demo indicator banner shown
- `simulated` — full demo indicator banner shown  
- `pilot` / `seeded` — environment pill shown in header only (no banner; these may have partial live data)
- `live` — no demo indicators shown

---

## Reset Instructions

To reset a demo scenario mid-presentation:
1. Click the demo control panel (if open) and select "Reset"
2. Or navigate back to `/strategy` — the Governed Decision Loop resets to initial state on mount

---

## What Is Real

| Surface | Status |
|---------|--------|
| Governed Decision Loop (9-step panel) | Real component, demo scenario data |
| Proof Chain Audit | Real component, demo scenario data |
| Approvals Center | Real component, demo scenario data |
| Signal Feed | Real component, seeded demo signals |
| Executive Briefing | Real component, demo intelligence data |
| Covenant Policy evaluation | Real engine, demo policy definitions |
| Monte Carlo simulation | Real visualization, demo parameters |
| All UI interactions (approval, rejection, expansion) | Fully functional |

Demo scenario data is clearly labeled throughout. No live external systems are connected during demos.
