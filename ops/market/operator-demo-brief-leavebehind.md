# Operator Demo Brief

**Audience**: VP Operations, Chief of Staff, IT Directors, senior operators · **Format**: 15-minute operator demo · **Goal**: show signal triage, governed execution, and audit evidence in a working operator surface

> "Every step is visible, every decision has evidence, and every action generates a permanent receipt."

## Demo Flow

**1. Signal Triage** — `/operations/prism/signals`
A critical signal — *"Fleet ETA compliance gap, 3 vessels outside SLA"* — is detected, classified, and surfaced automatically. Cross-domain context attached: Aegis piracy advisory (Bay of Bengal, Level 3), Terra port congestion at Singapore, PRISM SLA penalty clause.

**2. Governed Decision Loop** — `/command/strategy`
- *Signal* SIG-4821 (Vessels, Critical) — M/V Meridian, Catalyst, Horizon.
- *Context* — 4 enrichment sources, 14 prior cases, 87% pattern confidence.
- *Recommendation* REC-0421 — reroute via Strait of Malacca, 82% confidence, 4 reasoning items.
- *Simulation* — 10,000 Monte Carlo iterations: reroute median saving $1.82M (84% confidence) vs. maintain route loss $850K.
- *Policy Gate* — 4 Covenant Policies pass automatically (severity, finance, audit, domain).
- *Approval* — Fleet Ops Lead → Finance Controller → CEO. 33 minutes from signal to sign-off; identical evidence at every stop.
- *Execution* — Reroute dispatched automatically; live execution log streams every step.
- *Proof Chain* — PF-9041, PF-9042 — model, confidence, reviewer, note. Immutable.
- *Outcome* — SLA breach avoided, $2.1M protected, accuracy fed back to the model.

**3. Audit & Proof Trail** — `/operations/trust-audit`, `/operations/approvals`
Filter to approved records to show the clean audit surface. Every AI-generated output carries review state and an export-safety flag. The compliance team's view, designed for them.

**4. Executive Intelligence Layer** — `/strategy/executive-briefing`
Cross-domain synthesis. What the CEO sees at the start of every day — pre-governed recommendations, not raw alerts.

## Talking Points That Land

- Signal detection, enrichment, and recommendation happen *before* a human sees anything.
- Cross-domain evidence is what separates this from monitoring; every source is attributed.
- Operators dismiss, snooze, or reject — every action is logged and tunes the model.
- The Covenant Policy engine is configurable per domain, signal, and threshold.

## Cheat Sheet

| Surface | Path | Use For |
|---|---|---|
| Governed Decision Loop | `/command/strategy` | Demo centerpiece |
| Executive Briefing | `/strategy/executive-briefing` | Synthesis view |
| Signal Feed | `/operations/prism/signals` | Live triage |
| Approvals Center | `/operations/approvals` | Human-in-the-loop |
| Proof Chain Audit | `/operations/trust-audit` | Compliance evidence |
| Action Queue | `/operations/alloy/actions` | Execution detail |
| Policy Engine | `/operations/alloy/governance` | Covenant rules |

> Operators know exactly what they're approving and why. Every decision is traceable. Every action is reversible.
