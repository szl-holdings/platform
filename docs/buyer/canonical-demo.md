# Lyte + Alloy — Canonical Demo Flow

**Duration**: 8–12 minutes  
**Audience**: Investors, enterprise buyers, design partners, lenders  
**Environment**: Demo (Seeded Data)  
**Version**: 2.0 — April 2026

---

## Overview

**Surface routing policy:** This buyer-facing demo uses the `/command/` portal (Unified Command artifact). Internal operator access to Lyte functionality uses `/lyte/` within `artifacts/szl-holdings` — see `docs/internal/demo/demo-runbook.md`. Both surfaces expose the same underlying Lyte workspace; `/command/` is the canonical path for all buyer-facing and investor demos.

This is the single canonical demo flow for Lyte + Alloy. It walks through the complete operating loop:

> Signal enters Lyte → PRISM scores and correlates it → Alloy retrieves evidence → Alloy produces a structured decision object → Approval gate assessed → Human approves or revises → Action created and routed → Audit trail closes the loop → Dashboard reflects resolution

Every step is reproducible using the seeded demo dataset. Every screen exists in the live application.

---

## Prerequisites

- Command portal running at `/command`
- Navigate to `/command/?demo=true` to activate demo mode
- Verify "DEMO" label is visible in the header bar
- API server running with demo data seeded (see Seeded Dataset section)
- Screen resolution 1440×900 or higher

---

## Audience Pivots

| Audience | Emphasis | Scenes to prioritize |
|----------|----------|----------------------|
| Enterprise buyer | Human-in-the-loop, accountability | All 8 scenes |
| Investor / LP | Moat, scalability, AI governance | 1, 3, 4, 6, 7 |
| Lender | Audit trail, compliance, immutability | 1, 6, 7 |
| Design partner | Workflow depth, customization | All 8 + Intervention |

---

## Flow Script

### Scene 1: Signal Ingestion (1–2 minutes)

**URL**: `/command/signals`

**Narration**: *"Lyte watches your entire operational surface. When something changes — a new risk, a missed SLA, a compliance gap — Lyte catches it and structures it as a signal. Not a generic alert. A structured business event with context attached."*

**Show**:
1. Open Signals Feed
2. Point to the top signal: **"Payment pipeline stalled — Stripe webhook queue depth 14.2k"**
   - Source: PagerDuty (monitoring)
   - Severity: Critical
   - Value at Risk: $2.3M (auto-quantified)
   - Status: New — unassigned
3. Open the signal detail — show the `whyItMatters` field: *"$2.3M in in-flight payments are delayed. Each 10-min delay increases chargeback risk by 12%."*
4. Point to the DEMO label: *"Everything you see here is seeded demo data — no live systems are connected."*

**Key messages**:
- Signals come from your existing systems — no rip-and-replace
- Business context and value at risk quantified automatically, not just a severity label
- Lyte normalizes signals across 20+ source types into a common schema

---

### Scene 2: PRISM Correlation (1 minute)

**URL**: `/command/prism`

**Narration**: *"PRISM is Lyte's intelligence framework. It doesn't just show you alerts — it correlates them. Let me show you what that means."*

**Show**:
1. Open PRISM Dashboard
2. Surface the three Critical signals together:
   - RDS replication lag at 127s
   - Stripe webhook queue at 14.2k depth
   - CI/CD deploy blocked — P1 hotfix OOM killed
3. Say: *"PRISM shows these aren't three separate incidents. The deploy block is preventing the hotfix. The hotfix would fix the payment stall. The payment stall is causing the RDS write spike. One cascade — three signals — surfaced as a correlated cluster."*

**Key messages**:
- Correlation across signals, not just a prioritized list
- Business impact visible at a glance ($2.3M + $800K at risk)
- PRISM = Pulse · Risk · Intelligence · Signals · Motion

---

### Scene 3: Evidence Retrieval (1–2 minutes)

**URL**: `/command/alloy/intelligence` → Retrieval tab

**Narration**: *"Before Alloy makes any recommendation, it retrieves evidence. It searches your organization's actual knowledge — prior incidents, approval policies, owner metadata, connector context. Not generic AI. Your data."*

**Show**:
1. Navigate to Alloy Intelligence → Retrieval tab
2. Show the knowledge base query issued against the signal
3. Walk through retrieved evidence:
   - Prior similar payment stall (resolved in 4h, 3 months ago — Stripe config change)
   - Approval policy for P1 escalation (manager-level approval required)
   - Owner metadata for Platform Engineering Lead
   - Connector context from Stripe webhook configuration
4. Point to confidence scores on each evidence item

**Key messages**:
- RAG-based retrieval against organization-specific knowledge
- Evidence is sourced and cited, not hallucinated
- Confidence score is explicit on every retrieved item

---

### Scene 4: Structured Decision Object (2–3 minutes)

**URL**: `/command/alloy/intelligence` → Triage Engine

**Narration**: *"Alloy doesn't give you a paragraph of AI text. It produces a structured decision object — validated against a schema, with typed fields, confidence scores, evidence references, and a clear recommended action."*

**Show**:
1. Enter the signal into the Triage Engine (or show pre-populated result)
2. Walk through each field of the structured decision:
   - **Priority**: P1 (Critical)
   - **Urgency**: Immediate — act within 30 minutes
   - **Confidence**: 0.87
   - **Route To**: Platform Engineering Lead
   - **Requires Human Review**: Yes (enforced)
   - **Suggested Actions**: Scale Stripe webhook processor pods (×3), rollback auth-service v3.14.2, page on-call lead
3. Open the Evidence Sources panel — show the citations linked to each recommendation
4. Switch to Execution Planner tab
5. Walk through the action decision:
   - **Action Type**: Escalate + Execute (patch)
   - **Approval Required**: Yes — Manager level
   - **Risk Level**: High
   - **Rationale**: Payment revenue impact $2.3M, prior incident resolved with processor scale
   - **Alternatives**: Two other approaches shown at lower confidence
6. Say: *"Schema-validated decisions, not freeform text. Every field is typed. Every recommendation is sourced. The alternatives panel means humans can override with context Alloy doesn't have."*

**Key messages**:
- Decision object is machine-readable JSON — not a prose summary
- Every field is typed and validated against a schema
- Alternatives shown so humans can make an informed override
- This is the core Alloy IP — structured intelligence, not chat output

---

### Scene 5: Approval Gate (1–2 minutes)

**URL**: `/command/approvals`

**Narration**: *"This is a P1 action with $2.3M at stake. Alloy requires explicit human approval before anything executes. The approval gate is structural — enforced at the workflow layer, not just in the UI. It cannot be bypassed in code."*

**Show**:
1. Open Approvals Center
2. Find the pending approval for the escalation action
3. Point to the execution mode indicator: **propose_only**
4. Explain the four execution modes:
   - `observe_only` — AI watches, no recommendations surface
   - `propose_only` — AI recommends, humans decide (current default)
   - `approval_required` — AI can act only after explicit approval (this scene)
   - `approved_execute` — Pre-approved automated execution (limited scope, config-only)
5. Click "Approve" (or show the approval recorded with approver identity + timestamp)
6. Say: *"AI proposes. Humans approve. This is not a setting — it's how the system works at the architecture level."*

**Key messages**:
- Human-in-the-loop is a structural guarantee, not a UI affordance
- Four modes give orgs granular control over AI autonomy per workflow type
- Every approval is attributed, timestamped, and immutable

---

### Scene 6: Action Execution & Routing (1 minute)

**URL**: `/command/actions`

**Narration**: *"Once approved, Alloy creates the action item, routes it to the right owner, and attaches the full decision context. No copy-paste. No re-explanation. The owner gets everything they need to act."*

**Show**:
1. Navigate to Action Center
2. Show the action created from the approved decision:
   - Assigned to: Platform Engineering Lead
   - Source: Signal reference (Stripe webhook queue — 14.2k)
   - Decision rationale: attached (full JSON context)
   - Status: Open → In Progress
3. Note the SLA timer on the action

**Key messages**:
- From signal to assigned action — no manual triage
- Full decision lineage attached to the action item
- Owner accountability is built in, not bolted on

---

### Scene 7: Audit Trail (1–2 minutes)

**URL**: `/command/alloy/intelligence` → Audit Trail tab

**Narration**: *"Every step in this chain is permanently recorded in an immutable audit trail. Signal → retrieval → decision → approval → execution. This audit trail is designed for compliance review, LP reporting, and enterprise security diligence."*

**Show**:
1. Open Audit Trail
2. Walk through the chain of entries for this signal:
   - **Signal ingestion**: source, severity, value at risk, timestamp
   - **Triage decision**: model version, confidence, latency, output hash
   - **Execution plan**: evidence references, action type, risk level
   - **Human approval**: approver identity, role, timestamp, decision
   - **Action created**: owner, assignment method, status
3. Point to: model route, confidence, latency, timestamp — all visible per entry
4. Say: *"Every AI recommendation, every human decision — permanently traceable from signal to resolution."*

**Key messages**:
- Immutable — cannot be edited or deleted by any user, including admins
- Every AI output is attributed (model version, confidence, latency)
- The full chain: `recommendation → review → approval → execution → outcome`
- Designed for auditors, compliance officers, and LP due diligence

---

### Scene 8: Dashboard Resolution (1 minute)

**URL**: `/command/`

**Narration**: *"Back to the dashboard. The signal that was Critical and unassigned 10 minutes ago is now In Progress with an owner assigned and an action underway. This is Business Observability — not dashboards, not reports, not AI autopilot. Structured intelligence with human accountability at every step."*

**Show**:
1. Return to main Dashboard
2. Show the signal now marked as "In Progress" with owner assigned
3. Show the value at risk counter updated (action in progress reduces exposure)
4. Optional: brief pan across Readiness Module if time permits

**Closing line**: *"Signal in → Evidence retrieved → Decision produced → Human approved → Action routed → Audit written. That's the Lyte + Alloy operating loop."*

---

## Demo Dataset

### Seeded Signals (Priority Demo Signals)

| Signal | Source | Severity | Value at Risk |
|--------|--------|----------|---------------|
| Payment pipeline stalled — Stripe webhook queue 14.2k | PagerDuty | Critical | $2.3M |
| RDS replication lag 127s — failover risk | AWS CloudWatch | Critical | $800K |
| auth-service CrashLoopBackOff — Enterprise SSO broken | Sentry | High | $4.2M ARR |
| Q1 revenue forecast drift — 8.3% below plan | Terra | Medium | $800K |
| Northgate contract approval SLA breach — 48h overdue | Terra | Medium | $840K |
| IAM credential exfiltration — prod account | AWS GuardDuty | High | — |

### Supporting Signals

| Signal | Source | Severity |
|--------|--------|----------|
| API Gateway p99 latency 8.4s | Datadog APM | High |
| Redis cluster memory 91% — eviction active | Datadog | High |
| Payment decline rate 12.3% | Stripe | High |
| Deploy pipeline blocked — P1 hotfix OOM | GitHub Actions | Medium |
| CDN cache hit ratio dropped to 62% | CloudFlare | Low |
| NIST CSF gap — 3 controls unresolved | Lyte Readiness | Medium |
| MV Pacific Voyager — 18h delay, weather diversion | AIS | High |

### Seeded Knowledge Base

- 10 prior incident records (matched by pattern similarity)
- 5 approval policies (by risk level and action type)
- 8 owner / team metadata records
- 3 playbook documents (payment, auth, deploy)
- 5 connector metadata records

### Environment Label

All demo screens display the **DEMO** badge in the header when `?demo=true` is set or sandbox mode is active.

---

## Demo Rules for Presenters

1. **Never imply live data** when showing seeded/demo data — always note the environment
2. **Always show the DEMO label** — point it out proactively at the start of every demo
3. **If asked about production readiness** — refer to the current stage (Functional Alpha) and the design partner program
4. **If asked about certifications** — separate current controls from future certification plans clearly; reference the Trust Center
5. **Do not promise autonomous execution** — emphasize the human-in-the-loop model; `propose_only` is the default
6. **If a question goes beyond the demo** — offer a follow-up call; don't improvise promises
7. **Screenshots from demos** must include the environment label

---

## Objection Responses

| Objection | Response |
|-----------|----------|
| "We already have PagerDuty / Datadog / Jira" | Lyte doesn't replace those. PagerDuty sends signals. Lyte structures them into decisions with business context and routes action — that's the missing layer. |
| "Is the AI making autonomous decisions?" | The default mode is `propose_only`. AI proposes; humans approve. This is enforced at the workflow layer, not just the UI. |
| "How do we trust the AI output?" | Every recommendation includes evidence sources and a confidence score. No black-box verdicts. The audit trail shows exactly why every recommendation was made. |
| "What does implementation look like?" | A pilot starts with one workflow instrumented — typically a contract approval or onboarding flow. No rip-and-replace. Connectors to existing systems. 4–6 weeks to first value. |
| "Is this SOC 2 certified?" | Not yet. Controls are in place. Certification is planned. We have a known-gap register and a public Trust Center — happy to share it. |
| "How is our data handled?" | Data stays in your environment. No advertising, no third-party sharing. See the Trust Center at szlholdings.com/trust. |
| "What's the pricing?" | Pilot pricing starts at a flat monthly fee. Production is usage-based. Full pricing at szlholdings.com/pricing — or we can scope your specific workflow. |

---

## Post-Demo Next Steps

1. Send follow-up deck within 24h: reference `docs/buyer/executive-overview.md`
2. Log the session: audience type, signals shown, objections raised, interest level
3. If pilot discussed: reference pilot scope template
4. If investor: direct to `szlholdings.com/investor-story` and investor-relations package
5. If lender / auditor: direct to Trust Center and offer a separate compliance call
