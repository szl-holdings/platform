# What's still missing to close the loop completely

After Horizon (5 primitives) and Resonance (5 primitives), the runtime
governs the **inside** of every loop and the **boundary** of every
handoff. There are still four gaps. None of them is a math gap; all
four are integration / observability / governance hygiene. Listed in
priority order.

---

## Gap 1 — A signed witness root (cryptographic anchor)

**What's missing.** Today the dual-witness chain is sha-256-chained but
not externally anchored. A sufficiently powerful insider could rewrite
both chains and recompute hashes. The fix is to publish a *signed root
hash* of every closed loop's witness chain to an append-only external
log (Sigstore Rekor, an internal transparency log, or chained to a
public-blockchain timestamp).

**What it gives us.** Tamper-evidence at the runtime boundary. An
auditor can verify any past loop closure was not retroactively edited.
This is the difference between "we have logs" and "we have evidence."

**Effort.** Small. ~200 LOC + a Rekor / Sigstore client. v0.2 candidate.

---

## Gap 2 — A formal verifier mode for SPEC.md

**What's missing.** Horizon and Resonance ship with a SPEC.md describing
the contract. There's no machine-checkable artifact that says
"implementation conforms to spec." We get this for free with TypeScript
types, but a spec violation that compiles fine (e.g. someone returns a
non-canonical no-hair string) is currently only caught by tests.

**What it gives us.** A `npm run verify` step that runs property-based
tests (fast-check) over every primitive and asserts the spec holds for
randomly generated inputs. This is the difference between "we tested
some cases" and "we tested the space."

**Effort.** Medium. ~1 sprint. Add `fast-check`, write generators for
every type in `types.ts` and `cadence.ts`, run them in CI.

---

## Gap 3 — A live OpenTelemetry collector + Grafana dashboard

**What's missing.** `HorizonOtelBridge` emits attributes onto spans, but
the payload doesn't ship a working dashboard. Operators have nothing
visual to look at on day 1. They have to wire it themselves.

**What it gives us.** A `docker-compose.yml` that spins up:
- an OpenTelemetry collector (config attached)
- Grafana with prebuilt dashboards for: page-curve cleanliness rate,
  complementarity violation count, Q-factor distribution, Kuramoto
  coherence histogram, impedance-mismatch heatmap, capacity-horizon
  recommendations over time

**Effort.** Medium-large. ~1 sprint. The collector config is short; the
Grafana dashboard JSON is the bulk of it.

---

## Gap 4 — A reference adapter for one real LLM provider

**What's missing.** Horizon + Resonance are provider-agnostic but the
payload doesn't show how to plug them into, say, an OpenAI completion
or a Perplexity chat. A first-time integrator sees the abstract
contract and has to figure out the wiring.

**What it gives us.** `examples/openai-adapter.ts` and
`examples/perplexity-adapter.ts` showing exactly where to:
- open the PageCurveTracker
- emit internal-witness entries during streaming
- emit external-witness entries from the API client
- close the loop and compute no-hair + Q-factor + cadence

**Effort.** Small. ~300 LOC. Half a sprint.

---

## Smaller hygiene items

- Per-package `CHANGELOG.md` (semver discipline from day 1).
- A LICENSE file at the unified-payload root (currently inherited via
  `SEE LICENSE IN ../../LICENSE` in package.jsons; we should resolve).
- A `.github/workflows/ci.yml` that runs `npm test` on every push so
  the runtime invariants stay green.
- A pre-commit hook that runs `npm run lint` (TypeScript --noEmit) so
  the spec types never drift.

---

## What is **not** missing

- Math. The five primitives in each pack are dimensionally complete.
- Coverage of the loop lifetime. Page curve covers open → peak → close.
- Coverage of the loop boundary. Cadence/impedance/Q cover handoff.
- Coverage of the multi-agent topology. Kuramoto + entanglement graph
  cover fleet coherence and pair coupling.
- A falsification discipline. The Falsification Ledger keeps us honest.

A future deepening (v0.3, not v0.2) is the **information-thermodynamics
budget**: tying Q-factor losses to a Landauer-bound cost ceiling. That
is genuinely new science and is best published in the v3 thesis before
shipping in code.
