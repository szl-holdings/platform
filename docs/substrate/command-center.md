# Substrate Command Center

**Route:** `/command/substrate/`  
**Artifact:** `artifacts/command` (Unified Command)  
**Version:** 1.0 — April 2026

---

## Overview

The Substrate Command Center is the cross-vertical operator surface for the SZL Holdings governed decision substrate. It renders typed run data — stage transitions, evidence bundles, policy evaluations, approval events, replay diffs — into a single purpose-built interface without introducing a parallel runtime.

The command center sits inside the existing Unified Command artifact at `/command/substrate/` and consumes the substrate's typed run model and the approvals-inbox package.

---

## Perspectives

Perspective switching is one click and persists per user (stored in `localStorage` under the key `substrate-perspective`). The active perspective is shown in a banner strip at the top of every page.

| Perspective | Focus | Who uses it |
|-------------|-------|-------------|
| **Executive** | Risk posture, KPI summary, cross-vertical health | C-suite, portfolio owners |
| **Operator** | In-flight runs, live trajectory map, stage monitoring | Operations leads, NOC |
| **Analyst** | Evidence drawers, OTel traces, counterfactual diffs | AI engineers, risk analysts |
| **Approver** | Unified approval queue, verdict recording, audit trail | Designated approvers, compliance |

Perspectives do not change the data visible — they change the emphasis and framing of the banner strip. All four perspectives have access to all views.

---

## Views

### Trajectory Map (`/command/substrate/`)

The home view. Shows every in-flight run across all verticals in a live-updating table. Refreshes every 5 seconds.

**Columns:** Workflow name · Run ID · Vertical · Tenant · Stage progress (9-segment bar) · Confidence · Risk level · Policy status · Approver · Age

**Filters:** Tenant · Vertical · Status · Risk level · Approval state

**KPI row** (above the fold):
- In-Flight Runs
- Awaiting Approval
- Completed (session)
- Failed
- Avg Confidence

**Keyboard shortcuts:**
- `R` — Refresh trajectory map
- `F` — Focus filter row
- `Esc` — Clear active row selection

---

### Run Detail (`/command/substrate/runs/:id`)

Full drill-down for a single run.

**Sections (tabbed):**
1. **Stage Timeline** — Each of the 9 governed decision loop stages rendered as an expandable timeline node. Clicking a stage reveals: input/output (with redaction indication), policy evaluation result, evidence drawer with citations, OTel span ID.
2. **OTel Trace** — Inline OpenTelemetry span waterfall with duration bars per operation.
3. **Approval History** — Immutable log of every approval event on this run: actor, verdict, justification, proof reference, timestamp.
4. **Checkpoints** — World-state snapshots captured at key stages, with restore capability for restorable checkpoints.

**Header actions:**
- **Counterfactual Replay** button — navigates to the Counterfactual Diff Viewer pre-loaded with this run.

---

### Counterfactual Diff Viewer (`/command/substrate/counterfactual`)

Loads any past run and re-runs it with a different model adapter and/or policy profile, then shows a side-by-side diff of decisions at each stage.

**Configuration inputs:**
- Source Run (dropdown — all known runs)
- Model Adapter (gpt-4o, gpt-4o-mini, claude-3-5-sonnet, claude-3-haiku, gemini-1.5-pro)
- Policy Profile (vertical-specific options, or "Default / unchanged")

**Diff output per stage:**
- Recommendation text
- Confidence score
- Key evidence references
- Policy result (PASS / FAIL / WARN)
- Whether approval would be required

Stages that diverge are flagged with a "DIVERGED" badge. A summary callout highlights cases where the approval gate would have been bypassed.

---

### Unified Approval Queue (`/command/substrate/approvals`)

All pending approval requests across every vertical, in a single view.

**Filters:** Vertical · Risk level

**Per-card information:**
- Vertical badge + risk level badge
- Tenant name + workflow name
- Proposed action text
- Policy name and ID that triggered the gate
- Evidence summary (expandable)
- Age (with urgency indicator for >15 minutes)
- Requesting agent ID

**Actions:** Approve · Reject · Escalate — all three require a written justification (minimum 10 characters). On confirmation, the verdict is written to the audit record and linked to the originating run's proof chain. A resolved session log is shown below the queue.

---

## Data Flow

```
SubstrateRun (typed) ──► Trajectory Map
        │
        ├──► Stage Timeline (evidence drawer, policy result, trace span)
        │
        ├──► OTel Trace (span waterfall)
        │
        ├──► Approval History (immutable audit events)
        │
        └──► Rollback Checkpoints (world-state snapshots)

PendingApproval ──────► Unified Approval Queue
                                │
                                └──► VerdictDialog ──► Audit record + proof ref

CounterfactualInput ──► Replay ──► CounterfactualDiff ──► Stage-level diff
```

Data is sourced from:
- `artifacts/command/src/pages/substrate/mock-data.ts` (simulation layer — replace with `@szl/substrate-client` SDK calls when the substrate Phase 2 SDK ships)
- `packages/approvals-inbox` (approval state and verdict recording)

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `P` | Open perspective switcher |
| `T` | Navigate to Trajectory Map |
| `A` | Navigate to Approval Queue |
| `C` | Navigate to Counterfactual Diff |
| `Cmd+K` | Open global Command Palette |
| `Esc` | Close active drawer / dialog |

---

## Extending the Command Center

To connect to a real substrate API instead of mock data:

1. Replace imports of `MOCK_RUNS`, `MOCK_PENDING_APPROVALS`, `MOCK_COUNTERFACTUAL` in each page file with calls to the `@szl/substrate-client` SDK.
2. Wire the `SubstrateRun` type to the SDK's `Run` type — they are structurally compatible.
3. Replace the 5-second `setInterval` in `trajectory-map.tsx` with an SSE subscription to the substrate's `/runs/stream` endpoint.
4. Replace `handleDecision` in `approval-queue.tsx` with a call to `approvals-inbox.submitApprovalAction()` backed by the substrate's `POST /approvals/:id/verdict` endpoint.

---

## Related

- Task #2390 — Substrate runtime (Phase 1)
- `packages/approvals-inbox` — Approval state and audit records
- `packages/cognitive-observability` — Cognitive trace observability
- `packages/telemetry-standards` — OTel span standards
- `packages/evidence-graph` — Evidence chain store and query
- `packages/replay-core` — Deterministic replay engine
