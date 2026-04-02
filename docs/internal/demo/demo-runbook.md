# Demo Runbook — Lyte + Alloy Canonical Demo

**Version:** 1.0  
**Last Updated:** April 2026  
**Classification:** Internal  
**Owner:** Founder / Sales

---

## Purpose

This runbook gives presenters everything they need to run the canonical Lyte + Alloy demo reliably — for customers, investors, and lenders. It documents the exact setup, click-by-click steps, objection responses, and audience-specific pivots.

---

## Pre-Demo Checklist

### Environment Setup (do before every demo)

- [ ] Navigate to `/lyte-command-center/?demo=true` to force app mode
- [ ] Verify the "DEMO — SEEDED DATA" label is visible in the dashboard header
- [ ] Confirm PRISM Dashboard loads with signals populated
- [ ] Confirm Alloy Intelligence (`/alloy/intelligence`) loads the Triage Engine and Evidence panel
- [ ] Confirm Action Center (`/actions`) shows at least 3 open actions
- [ ] Confirm Audit Trail tab in Alloy Intelligence is populated
- [ ] Confirm Approvals Center (`/approvals`) shows pending approvals
- [ ] Browser: use a fresh profile or clear session storage to avoid stale state
- [ ] Screen resolution: 1440×900 or higher for demo clarity
- [ ] Close all unrelated browser tabs

### Seed Data Verification

Run the seed script if data is missing:

```bash
pnpm tsx scripts/seed-demo-data.ts
```

Or use the Admin Seeder at `/admin/seeder` (requires admin role).

---

## Audience Profiles

| Audience | Focus | Emphasis | Time |
|----------|-------|----------|------|
| Enterprise Buyer | Full flow — signal to audit | Human-in-the-loop, accountability | 10–12 min |
| Investor / LP | Signal → decision → audit only | Moat, scalability, AI governance | 8–10 min |
| Lender | Governance, audit trail, compliance | RBAC, immutable audit, explainability | 8–10 min |
| Design Partner | All scenes + intervention workspace | Workflow depth, customization | 12 min |

---

## Demo Flow — Step by Step

### Scene 1: Signal Ingestion (1–2 min)

**URL:** `/lyte-command-center/signals`

**Steps:**
1. Open Signals Feed
2. Point to the top signal: "Payment pipeline stalled — Stripe webhook queue depth 14.2k"
3. Note the severity badge (Critical), source (PagerDuty), and "Value at Risk: $2.3M"
4. Say: *"This signal was ingested from PagerDuty, classified by Alloy as Critical, and surfaced with value at risk quantified — automatically."*
5. Point to the DEMO label in the header — *"All data here is seeded for this demo."*

**Talking points:**
- Signals come from existing systems — no rip-and-replace
- Automatic classification and business context injection
- Value at risk is quantified, not just a severity label

---

### Scene 2: PRISM Dashboard (1 min)

**URL:** `/lyte-command-center/prism`

**Steps:**
1. Open PRISM Dashboard
2. Show the signal grid — surface the three Critical signals
3. Point to the correlation: DB replication lag + payment pipeline stall + deploy blocked
4. Say: *"PRISM shows these aren't three separate incidents — they're correlated. The deploy block is preventing the hotfix that would fix the payment stall."*

**Talking points:**
- Correlation across signals, not just a list of alerts
- Business context visible at a glance

---

### Scene 3: Alloy Evidence Retrieval (1–2 min)

**URL:** `/lyte-command-center/alloy/intelligence` → Retrieval tab

**Steps:**
1. Navigate to Alloy Intelligence → Retrieval tab
2. Show the knowledge base query against the signal
3. Walk through retrieved evidence:
   - Prior similar payment pipeline incident (resolved in 4h, 3 months ago)
   - Approval policy for escalation
   - Owner metadata for Platform Engineering lead
   - Connector context from Stripe webhook config
4. Say: *"Alloy doesn't hallucinate. Every recommendation is grounded in your organization's actual data."*

**Talking points:**
- RAG-based retrieval against org-specific knowledge
- Evidence sourced, not fabricated
- Confidence score shown alongside each piece of evidence

---

### Scene 4: Structured Decision Object (2–3 min)

**URL:** `/lyte-command-center/alloy/intelligence` → Triage Engine

**Steps:**
1. Click into the Triage Engine
2. Enter the signal into the engine (or show pre-populated result)
3. Walk through each field of the structured decision:
   - Priority: P1 (Critical)
   - Urgency: Immediate
   - Confidence: 0.87
   - Route To: Platform Engineering Lead
   - Requires Human Review: Yes
   - Suggested Actions: Scale webhook processor, rollback v3.14.2, page on-call
4. Open Evidence Sources panel
5. Switch to Execution Planner
6. Show action decision: Action Type = Escalate, Approval Required = Yes, Risk = High
7. Show Alternatives panel

**Talking points:**
- Schema-validated JSON output — not freeform text
- Every field is typed and machine-readable
- Alternatives shown so humans can override with context
- Confidence score is explicit, not hidden

---

### Scene 5: Approval Gate (1–2 min)

**URL:** `/lyte-command-center/approvals`

**Steps:**
1. Open Approvals Center
2. Show the pending approval for the escalation action
3. Point to: execution mode = "propose_only" badge
4. Explain the four execution modes (show the UI indicator)
5. Click "Approve" on the action (or show the approval flow)
6. Note the approval is logged with approver identity and timestamp

**Talking points:**
- Human-in-the-loop is structural — enforced at the workflow layer (Alloy), not just the UI
- Four modes: observe_only → propose_only → approval_required → approved_execute
- Cannot be bypassed in code
- Audit trail records the approval chain

---

### Scene 6: Action Execution & Routing (1 min)

**URL:** `/lyte-command-center/actions`

**Steps:**
1. Navigate to Action Center
2. Show the action created from the approved decision:
   - Assigned to: Platform Engineering Lead
   - Source: Signal reference (Stripe webhook queue)
   - Decision rationale attached
   - Status: Open → In Progress
3. Note the owner is notified (show the notification or indicate it would fire)

**Talking points:**
- From signal to assigned action — no manual triage
- Full lineage: signal → evidence → decision → approval → action
- Owner accountability built in

---

### Scene 7: Audit Trail (1–2 min)

**URL:** `/lyte-command-center/alloy/intelligence` → Audit Trail tab

**Steps:**
1. Open Audit Trail
2. Walk through the chain of entries for this signal:
   - Signal ingestion: timestamp, source, severity
   - Triage decision: model, confidence, latency, output
   - Execution plan: evidence references, action type
   - Human approval: approver, timestamp, decision
   - Action created: owner, status, reference
3. Say: *"This audit trail is designed for compliance review, LP reporting, and enterprise security diligence."*

**Talking points:**
- Immutable — cannot be edited or deleted
- Every AI action is attributed and sourced
- Regulators and auditors can trace every decision to its origin

---

### Scene 8: Dashboard Resolution (1 min)

**URL:** `/lyte-command-center/`

**Steps:**
1. Return to main Dashboard
2. Show the signal now marked as "In Progress" with owner assigned
3. Brief pan across Readiness Module (if time permits)
4. Close with: *"Signal in — evidence retrieved — decision produced — human approved — action routed — audit written. This is Business Observability."*

---

## Objection Handling

| Objection | Response |
|-----------|----------|
| "We already have PagerDuty / Datadog" | Lyte doesn't replace those — it watches them. PagerDuty sends signals; Lyte structures them into decisions with business context. |
| "Is the AI making autonomous decisions?" | No. The default execution mode is `propose_only`. AI proposes; humans approve. This is enforced at the workflow layer. |
| "How do we trust the AI output?" | Every recommendation includes evidence sources and a confidence score. No black-box verdicts. |
| "What does implementation look like?" | A pilot starts with one workflow instrumented. No rip-and-replace. Connectors to existing systems. |
| "Is this SOC 2 certified?" | Not yet. Controls are in place. Certification is planned. We have a known-gap register and a trust center — happy to share. |
| "How is data handled?" | Data stays in your environment. No advertising, no third-party sharing. See the Trust Center at szlholdings.com/trust. |

---

## Demo Environment Notes

- All signals, actions, decisions, and audit entries are seeded data
- The "DEMO — SEEDED DATA" label is always visible when demo mode is active
- No live systems are connected or modified during a demo
- To reset demo data: Admin → Seeder → Re-seed
- Demo mode is activated via URL param `?demo=true` or `?view=app`

---

## Post-Demo Actions

1. Send the follow-up deck within 24h (link: szlholdings.com/design-partners)
2. Log the prospect in the CRM with: audience type, signals shown, objections raised
3. If a pilot is discussed: reference the pilot scope doc at `docs/internal/sales/pilot-scope.md`
4. If investor: reference the investor story at szlholdings.com/investor-story

---

*Internal document. Not for distribution. For questions: contact the founder directly.*
