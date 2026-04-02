# Lyte + Alloy — Canonical Demo Flow

**Duration**: 8–12 minutes
**Audience**: Investors, enterprise buyers, design partners, lenders
**Environment**: Demo (Seeded Data)

---

## Prerequisites

- Lyte Command Center running at `/lyte-command-center`
- API server running with AI engine configured
- Demo dataset seeded (see "Demo Dataset" section below)

---

## Flow Script

### Scene 1: Signal Ingestion (1–2 minutes)

**Narration**: "Lyte watches your entire operational surface. When something changes — a new risk, a missed SLA, a compliance gap — Lyte catches it and structures it as a signal."

**Show**:
1. Open Lyte PRISM Dashboard → **Signals** tab
2. Point out the new signal at the top of the queue:
   - Source: "Contract Management System"
   - Type: "SLA Breach Warning"
   - Severity: High
   - Auto-classified by Alloy AI
3. Highlight: "This signal was ingested, normalized, and classified automatically. No manual tagging."

**Key Message**: Signals come from your existing systems. Lyte doesn't replace them — it watches them.

---

### Scene 2: Context Retrieval (1–2 minutes)

**Narration**: "Now Lyte needs to understand this signal in context. Alloy retrieves similar past incidents, the relevant approval policies, ownership data, and prior resolutions."

**Show**:
1. Click into the signal detail view
2. Open Alloy Intelligence Fabric → **Retrieval** tab
3. Demonstrate a retrieval query against the knowledge base
4. Show the retrieved evidence:
   - Prior similar SLA breach (3 months ago, resolved in 48h)
   - Current approval policy for contract amendments
   - Owner metadata for the account team
   - Connector context from the source system

**Key Message**: Every recommendation Alloy makes is grounded in your organization's actual data — not generic AI output.

---

### Scene 3: Decision Object Generation (2–3 minutes)

**Narration**: "Alloy doesn't give you a paragraph of AI text. It produces a structured decision object — validated against a schema, with confidence scores, evidence references, and a clear recommended action."

**Show**:
1. Open Alloy Intelligence Fabric → **Intelligence Hub**
2. Enter the signal into the Triage Engine
3. Walk through the structured output:
   - **Priority**: P1 (High)
   - **Urgency**: Urgent
   - **Confidence**: 0.82
   - **Route To**: Account Management Lead
   - **Requires Human Review**: Yes
   - **Suggested Actions**: Contact client, escalate internally, prepare amendment
4. Show the Evidence Sources panel below the decision
5. Open the Execution Planner with the same context
6. Walk through the Action Decision:
   - **Action Type**: Escalate
   - **Approval Required**: Yes (Manager level)
   - **Risk Level**: High
   - **Rationale**: Explains why based on evidence
   - **Alternatives**: Two other approaches with lower confidence

**Key Message**: Schema-validated decisions, not freeform text. Every field is typed, every recommendation is sourced.

---

### Scene 4: Approval Gate (1–2 minutes)

**Narration**: "This is a high-impact action. Alloy requires explicit human approval before anything executes. The approval gate is structural — enforced in code, not just in UI."

**Show**:
1. Point out the approval badge on the decision card
2. Show the execution mode indicator: "propose_only"
3. Explain the four execution modes:
   - **observe_only**: AI watches, no recommendations
   - **propose_only**: AI recommends, humans decide (current default)
   - **approval_required**: AI acts after explicit approval
   - **approved_execute**: Pre-approved automated execution (limited scope)
4. Show the Tool Layer tab → tools that require approval vs. those that don't

**Key Message**: AI proposes. Humans approve. This is not optional — it's how the system works.

---

### Scene 5: Action Execution (1–2 minutes)

**Narration**: "Once approved, Alloy creates the action item, routes it to the right owner, and records every step in the audit trail."

**Show**:
1. Navigate to Lyte Action Center
2. Show the action item created from the decision:
   - Assigned owner
   - Source signal reference
   - Decision rationale attached
   - Status: Open → In Progress
3. Show the audit trail entry for the action creation

**Key Message**: From signal to action — traceable, accountable, and auditable at every step.

---

### Scene 6: Audit Trail (1–2 minutes)

**Narration**: "Every step in this chain — the signal, the retrieval, the decision, the approval, the execution — is permanently recorded in an immutable audit trail."

**Show**:
1. Open Alloy Intelligence Fabric → **Audit Trail** tab
2. Walk through the entries:
   - Signal ingestion timestamp
   - Triage decision with model used, latency, confidence
   - Execution plan with evidence references
   - Tool execution audit (if applicable)
3. Show: model route, confidence, latency, timestamp for each entry
4. Highlight: "This audit trail is designed for compliance review, LP reporting, and enterprise diligence."

**Key Message**: Complete decision lineage — from signal to resolution. Every AI recommendation, every human decision, permanently traceable.

---

### Scene 7: Close (1 minute)

**Narration**: "What you just saw is the Lyte + Alloy operating loop:

Signal in → Evidence retrieved → Decision object produced → Approval assessed → Human gate honored → Action executed → Audit trail written.

This is Business Observability — not dashboards, not reports, not AI autopilot. It's structured intelligence with human accountability at every step."

**Show**:
1. Return to PRISM Dashboard overview
2. Show the signal now marked as "In Progress" with owner assigned
3. Brief pan across the platform surfaces

---

## Demo Dataset

### Seeded Signals
| Signal | Source | Severity | Type |
|--------|--------|----------|------|
| SLA Breach Warning — Acme Corp Q3 | Contract Management | High | Compliance |
| Unusual login pattern — APAC region | Identity Provider | Medium | Security |
| Revenue forecast deviation — -12% | Financial System | High | Risk |
| Vendor certification expiry — 30 days | Procurement | Medium | Compliance |
| Customer escalation — Priority response | CRM | High | Operations |

### Seeded Knowledge Base
- 10 prior incident records (similar patterns)
- 5 approval policies (varying risk levels)
- 8 owner/team metadata records
- 3 playbook documents
- 5 connector metadata records

### Environment Label
All demo screens display: **DEMO — SEEDED DATA**

---

## Rules for Presenters

1. Never imply live data when showing seeded/demo data
2. Always show the environment label chip
3. If asked about production readiness, refer to the Readiness Standard (Functional Alpha)
4. If asked about certifications, clearly separate current controls from future certification plans
5. Do not promise autonomous execution — emphasize the human-in-the-loop model
6. All screenshots from this demo must include the environment label
