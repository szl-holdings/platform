# Productized Governance

**Owner:** Stephen Lutar · **Audience:** Founder, board, category-defining narrative work

Most "governance" in the AI category today is one of two things:

1. **A policy document** that sits in a Notion page and is enforced by promise.
2. **A retrofit audit log** bolted onto a system whose primary loop never knew about governance.

Neither is a product. Both fail under buyer scrutiny within thirty days of pilot.

We are building the third option: governance as **the product itself**, expressed as a runtime, not a page.

## What "productized governance" means

Governance is productized when **every step of the canonical 9-step loop** carries a structured artifact that:

- Identifies the actor (user, agent, system) by attributed identity.
- Carries provenance for every input (source, source type, confidence).
- Records the policy that applied (tier, gate, override path).
- Produces a receipt that is addressable, immutable, and queryable.

In other words: governance is what the loop *does*, not what a separate system *checks*.

## The 9-step loop, governed

| Step | Governance artifact | UI surface |
|------|---------------------|------------|
| Signal | Provenance pill, source-type tag | `/operations/signals` |
| Context | Evidence panel, related-signal links | Signal detail side panel |
| Recommendation | Decision receipt with scoring factors and alternatives | `/operations/decision-receipts` |
| Simulation | Counterfactual rows in the receipt; confidence bands | Decision receipt expanded view |
| Policy | Approval chain with tier, approver, SLA, override | `/operations/approvals-center` |
| Execution | Action card with state transitions and dependencies | `/operations/action-queue` |
| Proof | Immutable audit row with actor type and outcome | `/operations/trust-audit` |
| Outcome | Resolution payload tied to the original signal ID | Executive summary roll-up |
| Learning | Outcome → recommendation feedback loop (logged as policy attestation) | (Phase 2 — not in this task) |

## Why this is defensible

- **It cannot be retrofitted.** A vendor who built an agentic copilot first cannot add receipts later — their loop has no place to put them. Every recommendation that ever existed in their system is unaccountable.
- **It compounds.** Every receipt becomes evidence for the next decision. Our system gets *more* governable as it runs; theirs gets *less* governable.
- **It is buyer-recognizable.** Compliance buyers, operations buyers, and executive buyers all read the same receipt and see what they need to see. One artifact serves three personas.

## What productized governance is not

- It is not RBAC. Roles control *who can act*; governance describes *what was done and why*.
- It is not a policy editor. The policy editor is downstream of governance; you cannot edit a policy if there is no record of what it gated.
- It is not "explainability." Explainability is a model property; governance is a *system* property. We do not need the model to explain itself if the loop already records what was decided, by whom, against which policy.

## The commercial implication

Productized governance is the basis on which we **refuse to compete on AI features**. We do not benchmark our agent against another vendor's agent. We benchmark our **loop** against their absence of one. This is why our category statement is *Governed Decision Infrastructure* — not "AI for X."

## What we owe ourselves

To make this credible, every screen in the operator command center must:

1. Show the artifact for the step it represents.
2. Carry the IDs forward (signal → decision → approval → action → audit).
3. Refuse to render data without provenance.
4. Treat override as a first-class, attributed action — not an admin escape hatch.

If any of those four properties is absent on a given screen, that screen is not yet productized governance and must be flagged as a gap.

## Companion docs

- `trust-in-workflow.md` — how the artifacts surface in the UI.
- `trust-narrative-final.md` — the buyer-facing version of this argument.
- `moat-definition.md` — why this becomes a structural moat over time.
