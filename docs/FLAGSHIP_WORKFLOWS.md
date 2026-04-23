# FLAGSHIP WORKFLOWS — Phase 2

Captured: 2026-04-23.

Per the category doctrine in `CATEGORY_POSITIONING.md`, the platform converges around **three flagship workflows** until after launch. Everything else is secondary.

## W1. Incident triage and escalation

**Promise:** Operators detect anomalies fast, route them to the right owner, and escalate with full context — without leaving Guardian's audit trail.

**Where it lives in code today:**
- `routes/sentra*` (cyber resilience command)
- `routes/guardian.ts` (governance + escalation)
- `lib/scheduled-jobs.ts` (background detection)
- `@szl-holdings/observability` (signal capture)

**Required UX state for go-live:**
- Live signal feed visible from the operator landing page.
- Each signal carries an evidence panel (severity, context, suggested action, history).
- Escalation produces a Guardian-tracked record with assignee + SLA timer.

**Required telemetry:**
- `incident.signal.received` (count + source)
- `incident.triage.latency_ms` (signal → owner-assigned)
- `incident.escalation.created` (count)
- `incident.resolution.latency_ms` (signal → resolved)

**Status today:** Code paths exist. UX surfacing varies by artifact. Telemetry partial.

## W2. Approval routing and execution gating

**Promise:** Privileged actions are gated by Guardian. The right human approves the right action with the right context, and execution only happens after the gate clears.

**Where it lives in code today:**
- `routes/guardian.ts` — the gate itself (3,973 LOC; do not rewrite)
- LP portal upload routes (Task #1388) — recently hardened
- Admin token comparison (Task #1440) — timing-safe gap closed
- Audit log on every privileged write

**Required UX state for go-live:**
- Approver inbox surfaces pending requests with full evidence.
- Execution after approval is observable end-to-end (request id propagated).
- Reversibility surfaced: "this action can be rolled back within X minutes".

**Required telemetry:**
- `approval.requested` (count, by tier)
- `approval.queue_depth` (gauge)
- `approval.turnaround_ms` (histogram)
- `approval.failed_action_rate` (ratio)
- `approval.bypass_attempt` (count — should always be 0)

**Status today:** Backend strong. Approver UX is in place but spread; queue-depth gauge needs a single home.

## W3. Executive decision briefings

**Promise:** Decision-makers get one page per cycle that combines signals + governance state + recommended actions. They approve from the briefing.

**Where it lives in code today:**
- `routes/pulse.ts` (2,660 LOC) — Pulse — AI Executive Briefing
- `artifacts/pulse/` — the surface
- `routes/lyte-command-center.ts` — adjacent decision intelligence
- `artifacts/aegis/` — investor-facing variant of the same idea

**Required UX state for go-live:**
- Briefing generation latency visible to the user.
- Each recommendation shows: source signals, governance gate, approval status, expected impact.
- Approver can act directly from the briefing (no context switch).

**Required telemetry:**
- `briefing.generation_latency_ms` (histogram)
- `briefing.recommendation_count` (per briefing)
- `briefing.action_taken` (count + outcome)
- `briefing.dismissed` (count + reason)

**Status today:** Pulse is the strongest implementation. Aegis (investor) shares vocabulary. Lyte overlaps but is positioned differently — opportunity for vocabulary alignment in Phase 8.

## What is NOT a flagship workflow

The following are valuable domain products but not flagship until post-launch:
- Counsel (legal matter) — proof surface for governance.
- Vessels (maritime intelligence) — proof surface for signal-rich domain.
- Terra (real estate intelligence) — proof surface for evidence panels.
- Carlota Jo Consulting — public-facing inbound funnel.
- Mockup Sandbox — internal design surface.

These remain alive, supported, and visible. Their **role in the story** is to demonstrate that the three flagship workflows generalise to multiple domains.

## Vocabulary unification (in-scope, NOT yet shipped)

A single shared vocabulary across the three workflows reduces confusion. Candidates:

| Concept | Suggested canonical name | Where it appears today |
| --- | --- | --- |
| Status of a thing in motion | `status: "pending" | "in_review" | "approved" | "executed" | "rejected" | "expired"` | Multiple |
| Evidence record | `EvidencePanelV1 { source, capturedAt, signal, supportingDocs[] }` | Spread |
| Approval object | `ApprovalRequestV1 { requestor, action, evidence, tier, expiresAt }` | Spread |
| Event taxonomy prefix | `incident.*`, `approval.*`, `briefing.*` (per workflow) | Partial |

Promotion happens in a dedicated post-launch task — not in this pass — to avoid touching the 14 oversized handlers right before launch.
