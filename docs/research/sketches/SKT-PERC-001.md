---
id: SKT-PERC-001
title: Operator-loop liveness as an approval-gate input
disposition: try-again
source: docs/research/perception-bio-synthesis-2026.md §1, §7
package: '@szl-holdings/perception-loop'
receipt-class: perception.envelope.v1
---

# SKT-PERC-001 — Operator-loop liveness as an approval-gate input

Treat reviewer-presence as a **first-class policy input**, not telemetry.
A high-autonomy approval that crosses tier `T_review` must carry a
`perception.envelope.v1` with `Δt ≤ τ_freshness` and
`livenessConfidence ≥ θ_reviewer`, or it is rejected at the policy gate.

The novel angle vs. the AGI synthesis (§9 sotopia-judge) is that
liveness becomes a *blocking* signal, not a transcript-judging one.
Approval gates today treat reviewer presence as best-effort UX; this
sketch promotes it to evidence-bearing input.

**Disposition rationale.** `try-again` — depends on §1 (`perception-loop`)
landing first; the A11oy integration task ("wire perception/bio into
reviewer flow + reliquary") cuts the gate wiring against the package
this task ships.
