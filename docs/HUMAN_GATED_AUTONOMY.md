# Human-Gated Autonomy — A11oy Governance Architecture

## Principle

A11oy's core architectural guarantee: **no material action executes without a human approval gate**. This is not a UI feature — it is an architectural guarantee enforced by the Covenant Layer.

## Approval Tiers

| Tier | Threshold | Examples | Approval Required |
|---|---|---|---|
| 0 — Autonomous | Low risk, < $10K impact | Signal classification, draft generation, read-only fetch | None — automated |
| 1 — Operator | Medium risk, $10K–$100K | Schedule adjustment, internal alert, data enrichment | Single operator sign-off |
| 2 — Senior | High risk, $100K–$1M | Contract flag, fund reallocation recommendation, vendor action | Senior or Director |
| 3 — C-Suite / Board | Critical, > $1M | Strategic initiative, major commitment, public disclosure | C-suite or Board vote |

## Covenant Layer

The Covenant Layer is the policy enforcement module that:

1. **Classifies** every action by risk tier (cost, reversibility, data sensitivity, scope)
2. **Routes** the action to the correct approval queue
3. **Blocks** execution until the required approval is received
4. **Records** the approval in the Proof Ledger with:
   - Approver identity
   - Approval timestamp
   - Stated rationale
   - Risk tier at time of approval

The Covenant Layer is not bypassable by the agent runtime. An action stuck in approval queue will not time-out to automatic execution.

## MirrorEval Gate

Before routing to the Covenant Layer, every action is evaluated by MirrorEval 2.0. Five dispositions:

| Disposition | Action |
|---|---|
| `pass` | Proceeds to Covenant Layer |
| `pass_with_warning` | Proceeds with warning flag attached |
| `needs_more_evidence` | Blocked — agent must gather additional evidence |
| `requires_human_review` | Elevated to human review queue regardless of tier |
| `blocked` | Hard block — action cannot proceed |

## UI Enforcement

The `ApprovalGate` component (`artifacts/a11oy/src/components/ui.tsx`) renders a human approval prompt for any action above Tier 0. The component:
- Displays full action context (rationale, risk level, evidence refs)
- Provides Approve / Reject with required rationale input
- Logs the decision to the Proof Ledger on submit

## What Cannot Happen

- An agent cannot approve its own action
- An action cannot proceed if MirrorEval disposition is `blocked`
- An action cannot proceed if the Covenant Layer policy requires a higher-tier approver than what is currently authenticated
- A Proof Packet cannot be post-hoc modified (append-only ledger)

## Demo Mode

In demo mode, the `ApprovalGate` renders as a functional UI component. Approvals do not trigger real execution but do generate a demo Proof Packet. This lets investors and evaluators experience the human-gate interaction without risk.
