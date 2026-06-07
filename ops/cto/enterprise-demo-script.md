# Enterprise Demo Script — 15-Minute Route
**Phase C — CTO Pass**
*Completed: April 16, 2026*
*Audience: Enterprise buyers, IT leaders, CXOs, design partner prospects*
*Duration: 12–15 minutes*

---

## Purpose

This is the full enterprise demo — used for qualified prospects who have agreed to a structured evaluation or are considering a design partnership. It runs the complete operating loop with evidence rails, decision receipts, action receipts, and audit views.

It is designed to leave the audience with three convictions:
1. The operating loop is already built and demoed with real-feeling data
2. Human-in-the-loop governance is structural — it cannot be bypassed
3. Every action produces a defensible, auditable proof chain

---

## Audience Profile

| Role | Primary Concern | Emphasis |
|------|----------------|----------|
| CXO / COO | Operational control at scale | Operating loop rail, pressure board, approvals |
| CTO | Architecture, AI governance | Evidence rails, decision receipts, trust audit |
| VP Operations | Day-to-day operator surface | Signals, priorities, inbox, action queue |
| VP Finance | Risk exposure, approval latency | Approval chain, risk values, proof receipts |
| CISO / Compliance | Audit trail, attributability | Trust Audit, immutability, proof chain |

Adjust emphasis by audience. The script covers all angles.

---

## Setup (before the meeting)

1. Open `/command/` in a clean browser window
2. Activate demo mode via sidebar toggle — confirm full amber banner appears
3. Pre-open tabs (in order):
   - Tab 1: `/command/operations` (Executive Command)
   - Tab 2: `/command/operations/signals` (Signals Feed)
   - Tab 3: `/command/operations/recommendations` (Recommendations)
   - Tab 4: `/command/operations/approvals` (Approvals Center)
   - Tab 5: `/command/operations/action-queue` (Action Queue)
   - Tab 6: `/command/operations/alloy/receipts` (Trust Receipts)
   - Tab 7: `/command/operations/trust-audit` (Trust Audit)
4. Screen resolution: 1440×900 or higher
5. Fresh browser profile or cleared localStorage

---

## Scene 1: The Operating Command Center (2 minutes)

**Screen:** `/command/operations` — Executive Command

**Talking points:**

> "This is Executive Command — the single pane of glass for a complex organization. Before I show you anything else, I want to point to this strip at the top."

**Point to the Operating Loop Rail:**
> "Six stages. Observe — 44 active signals. Evaluate — 18 under analysis. Decide — 8 decision items. Approve — 4 pending approval. Act — 12 in motion. Prove — 31 evidenced outcomes. This is the operating loop of the business, live."

> "Below that, you have the pack signals — each of your intelligence domains, showing health, open items, critical counts, and risk value. Right now: Vessels is showing 52% health, 21 open items, $8.7M at risk."

**Point to the Pack Signal cards:**
> "Notice what's happening in Vessels — five critical items. That's surfacing before the fleet operator has even opened their inbox."

**Point to the Summary KPIs:**
> "Four packs reporting. Two healthy. 44 open signals across the portfolio. Eight critical items requiring attention."

**Demo mode acknowledgment:**
> "Everything you're seeing has the amber demo banner at the top — all data is synthetic. In your deployment, this is your organization's live signals."

---

## Scene 2: Signals — What's Happening (2 minutes)

**Screen:** `/command/operations/signals` — Signals Feed

**Talking points:**

> "Signals are the inputs. They come from approval queues, task systems, workflow tools — whatever your teams already use. Lyte doesn't require you to replace anything."

**Point to the signal list:**
> "Each signal carries: source, severity, value at risk, and the classification Lyte has applied. Not just a severity label — a business context. $2.1M SLA exposure on the Vessels fleet. $890K ownership conflict in accounts receivable."

> "These aren't alerts in the traditional sense. Alerts tell you something is broken. Signals tell you something is at risk — before it breaks."

**If CTO in the room:**
> "Under the hood, signals are ingested via our connector mesh — webhooks, API polling, event streams. Classification runs through a schema-validated structured output layer. No freeform text — typed JSON, every time."

---

## Scene 3: Evaluation — Evidence Rails (2 minutes)

**Screen:** `/command/operations/recommendations` — Recommendations

**Talking points:**

> "When Lyte evaluates a signal, it doesn't just classify it. It retrieves evidence. Let me show you what that looks like."

**Point to a recommendation card:**
> "This recommendation — for the Vessels SLA breach — includes: the relevant historical incident (resolved 6 weeks ago in 4 hours), the current SLA policy document, the owner metadata for the Fleet Ops lead, and the cost model for the breach. Confidence: 91%."

**Critical moment:**
> "Every piece of evidence is sourced. You can see the document name, the retrieval timestamp, and the confidence score. Alloy is designed to only recommend what it can attribute — if it cannot source a claim, it does not include it. This is the evidence rail."

**If compliance-focused audience:**
> "The evidence rail is what makes this defensible to auditors. When someone asks 'why did you take that action?' — you don't say 'the AI told us to.' You point to the evidence trail."

---

## Scene 4: Decision — The Approval Gate (3 minutes)

**Screen:** `/command/operations/approvals` — Approvals Center

**Talking points:**

> "This is where we spend the most time with enterprise buyers, because this is the part that makes every other part matter."

**Expand approval A-1041:**
> "Q2 pricing revision. $1.2M revenue impact. Been pending 31 hours. Here's what the approval record shows: the evidence documents behind the request, a confidence score of 88%, and the approval chain."

**Point to the approval chain:**
> "Sarah Chen submitted it. Michael Torres — VP Finance — approved it 28 hours ago. Stephen Lutar — CXO — is the current step. The business knows exactly where this is stalled. Not in someone's inbox. Not in a Slack thread. In a governed approval record."

**Point to the execution mode indicator:**
> "Notice the execution mode: `approval_required`. This is structural. The workflow layer — Alloy — requires a human decision before execution proceeds. It is not a UI affordance that can be toggled off. Approval is part of the action primitive itself."

> "Four execution modes exist: observe-only, propose-only, approval-required, and approved-execute. Each one is an explicit governance posture. You configure them per workflow."

**Click Approve (if live demo allows):**
> "When the approval is recorded, it logs: approver identity, timestamp, the specific action approved, and the evidence that was reviewed. This is the decision receipt."

---

## Scene 5: Action — Evidence-Backed Execution (2 minutes)

**Screen:** `/command/operations/action-queue` — Action Queue

**Talking points:**

> "Once approved, the action is created and routed. Here it is — assigned to Fleet Ops, with the source signal, the decision rationale, the approval reference, and the status."

**Point to the lineage:**
> "Signal → context → recommendation → simulation → policy → execution → proof → outcome → learning. You can traverse the entire chain from this record. No broken links."

**If VP Operations in the room:**
> "From the operator's perspective: they get an action in their queue with full context attached. They don't need to go hunting for why this task exists. The context travels with the work."

---

## Scene 6: Prove — The Trust Receipt (2 minutes)

**Screen:** `/command/operations/alloy/receipts` — Trust Receipts

**Talking points:**

> "This is the Prove stage — and it's the piece no one else has built."

**Point to a trust receipt:**
> "Every action that goes through this system produces a receipt. Not a log entry. A receipt. It contains: the originating signal, the evidence retrieved, the decision produced, the approval record, the action taken, and the outcome. One document. Complete lineage."

> "If an auditor asks 'show me every action your organization took in response to the Vessels SLA breach in Q2' — you pull this receipt. Everything is here."

---

## Scene 7: Audit View — The Full Proof Chain (1 minute)

**Screen:** `/command/operations/trust-audit` — Trust Audit

**Talking points:**

> "And if you want the complete audit view — every event, every decision, every approval, every action — across the entire portfolio, in chronological order — this is Trust Audit."

**Point to the audit trail:**
> "Immutable. Every entry is timestamped, attributed, and linked. Regulators, boards, and compliance teams can interrogate this without needing to access raw system logs."

---

## The Close (1 minute)

> "Let me recap what you just saw: a signal came in — 44 signals are live right now. The system evaluated it with a sourced evidence rail. A structured recommendation was produced with a confidence score. A human approved it in a governed chain. An action was created with full lineage. A proof receipt was generated."

> "Observe. Evaluate. Decide. Approve. Act. Prove."

> "This is the Business Operating System. Not a dashboard. Not a workflow tool. A complete operating loop — with a human in the loop at every consequential step — and a proof chain at the end of every action."

---

## Post-Demo Protocol

1. Send the design partner pack within 24 hours
2. Log: audience composition, which scenes generated questions, objections raised
3. If pilot discussed: share `docs/internal/sales/pilot-scope.md` and reference `ops/cto/proof-engine-final.md`
4. If compliance/audit concerns: share Trust Center at `szlholdings.com/trust`
5. Schedule pilot scoping call within 1 week of a strong demo

---

## Objection Handling — Enterprise Version

| Objection | Response |
|-----------|----------|
| "We're already using ServiceNow / Jira / Salesforce" | Lyte doesn't replace those — it watches them. It ingests from whatever systems you have, turns signals into a governed loop, and writes receipts back to wherever your audit trail lives. |
| "Is the AI making autonomous decisions?" | No. The default mode is `approval_required`. The AI produces a structured recommendation. A human approves it. The Alloy workflow layer requires approval before execution proceeds — it is not a UI toggle, it is part of the action primitive. |
| "How do we trust the evidence the AI retrieves?" | Every evidence document includes a source reference, a retrieval timestamp, and a confidence score. Alloy is designed to only surface what it can attribute — unsourced claims are not included in the output. |
| "What does implementation look like?" | A pilot starts with one workflow instrumented. We connect to your existing systems via our connector mesh — API, webhook, or event stream. No rip-and-replace. We're designed for co-existence. |
| "Is this SOC 2 certified?" | Not yet. We have the controls in place. Certification is on the roadmap. We have a known-gap register and a trust center — happy to share both under NDA. |
| "How long does a pilot take?" | A focused pilot on one domain — typically 60–90 days. Baseline established in week 1, signals instrumented in week 2–3, decision and approval loop running by week 4. |
| "What's the commercial model?" | Platform access plus design partner collaboration fee. Structure varies by domain and scope. We can share a term sheet after a pilot scoping call. |

---

*Internal document. Not for distribution.*
*See also: [Founder Demo Script](./founder-demo-script.md) · [Demo Finalization](./demo-finalization.md) · [Proof Engine](./proof-engine-final.md)*
