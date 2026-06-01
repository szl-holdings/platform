# Demo Killer Path

**Owner:** Stephen Lutar · **Audience:** Founder, sales-led demos, design partner walkthroughs

The demo path that wins is the one that makes governed decisioning *visible* in under twelve minutes. Every step below maps to a route in `artifacts/command` and a moment in the canonical 9-step loop: **Signal → Context → Recommendation → Simulation → Policy → Execution → Proof → Outcome → Learning**.

## The killer path (12 minutes)

| # | Minute | Route | Loop step(s) | What the buyer sees | Memory hook |
|---|--------|-------|--------------|---------------------|-------------|
| 1 | 0:00 | `/operations` (executive-command) | Signal · Context | One screen: value-at-risk, top three signals, the operating loop rail across the top. | "One screen that matters." |
| 1b | 0:45 | `/operations/dashboard` (demo-dashboard) | Signal · Context · Outcome | Optional executive roll-up with role-pivot (Executive / Operator / Manager / Compliance) and live PRISM score. Use only when buyer wants the persona switch up front. | "Same data, four lenses." |
| 2 | 1:30 | `/operations/signals` (demo-signals) | Signal · Context | A single critical signal opens a side panel: source, value-at-risk, owner, age, tags. | "A signal is not a notification — it carries provenance." |
| 3 | 3:00 | `/operations/decision-receipts` | Recommendation · Simulation | A receipt for the same signal: scoring factors, evidence rows, alternatives considered. | "Every recommendation has a receipt." |
| 4 | 5:00 | `/operations/approvals` | Policy | The recommendation hits a policy gate. Approval chain shows tier, approver, SLA. | "Enforced at the policy layer through named approval chains; bypass requires explicit, attributed override record." |
| 5 | 7:00 | `/operations/action-queue` | Execution | The approved decision becomes an action in the urgency-tiered queue. State transitions are visible. | "Decisions become work, not memos." |
| 6 | 9:00 | `/operations/trust-audit` | Proof | The same signal ID and decision ID appear in the immutable audit log. Outcome chip shows success / denied / warning. | "Auditable by default." |
| 7 | 10:30 | `/operations/executive-summary` | Outcome · Learning | Back to the executive view — the same signal is now resolved, value protected. Loop has closed. | "The loop ends where it started — but on the other side of governance." |

## Rules for running it

1. **Always start on the executive-command screen.** Never open with a settings page, never open with the marketing site.
2. **Use one anchor signal end-to-end.** Pick one critical demo signal at the start and follow it through every step. Buyers remember stories, not screen tours.
3. **Read the receipt aloud.** When the decision receipt opens, read the top scoring factor and the top alternative considered. This is the moment governance becomes real.
4. **Pause on the policy gate.** Do not skip past approvals. The approval chain is the single most underrated screen in the demo — it is the one slide that distinguishes us from agentic-AI vendors.
5. **End on the audit log.** Never end on a chart. End on the immutable record that ties the entire loop together.

## What kills the demo

- Opening on a configuration screen or settings page.
- Switching anchor signals mid-flow ("let me show you another one").
- Skipping the approval step to "save time."
- Ending on a dashboard rather than the audit trail.
- Using language like "the AI decided" — the AI *recommended*; governed humans decided.

## Required state for a demo run

- Demo mode banner visible in `lyte-layout` (top of every operations page).
- At least one critical signal in `active` status, one recommendation with ≥3 scoring factors, one approval chain in flight, one resolved action with a populated audit history.
- Real-time updates either disabled or pinned to a known seeded clock. The loop must feel deterministic on screen.

## Companion docs

- `operator-memory-hooks.md` — the phrases buyers should remember.
- `exec-to-operator-flow.md` — handoff between executive and operator views.
- `trust-in-workflow.md` — how trust shows up in the UI itself.
