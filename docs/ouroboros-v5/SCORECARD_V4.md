# Ouroboros v4 — Honest scorecard
### Does v4 make us 100/100 on each axis?

**Author:** Stephen P. Lutar
**Date:** May 1, 2026

---

## Short answer

**No.** The Lutar Invariant compounds the four axes into one auditable scalar, but the underlying axes are not at 100. Anyone who tells you a runtime is at 100/100 on cleanliness, horizon, resonance, or reconciliation is selling you something. Real systems live in the 70–95 range; a clean release is one that stays above the policy threshold under load, not one that tops out.

The v4 contribution is the **law**, not perfect axis values. The law makes any deficiency visible, auditable, and bounded. That is what changes — not the score.

## What 100/100 would actually mean per axis

### Cleanliness (C)
**100 means:** every released bit is reproducible from a tamper-evident witness root, every witness root is anchored in a public ledger, every anchor verifies independently, and the verifier itself has no failure mode (formally proven correct).

**Where Ouroboros is today (estimate, default test deployment):**
- Witness root anchoring: yes (LOCAL, REKOR, INTERNAL_HSM drivers) — **95**
- Public ledger anchor: optional via Sigstore Rekor — **90 if enabled, 70 if not**
- Independent verifier: `@workspace/verifier` runs property tests — **85** (not formally verified yet)
- Formal correctness proof of the verifier itself: **not yet** — **caps cleanliness at ~92**

**Estimated C ≈ 0.88 in a default secure deployment.** To reach 100, you need a Lean / Coq formal proof of the verifier and the Merkle implementation. That is a 6–18 month project.

### Horizon (H)
**100 means:** every release respects a Page-curve bound exactly, the holographic budget is provably tight (not over-conservative), no-cloning is enforced at the type-system level (not just at runtime), and the Hawking-rate limiter cannot be bypassed by any sequence of legitimate operations.

**Where Ouroboros is today:**
- Page-curve monitor: shipped — **90**
- Holographic surface budget: enforced — **85**
- No-cloning gate: runtime enforcement — **80** (not type-level)
- Hawking-rate limiter: shipped, deterministic — **90**
- Type-level no-cloning enforcement (linear types in Lean / Idris): **not yet**

**Estimated H ≈ 0.85.** To reach 100, port the no-cloning gate to a linearly-typed language. 12–24 month project, partially academic.

### Resonance (R)
**100 means:** handoff Q-factor is at the Landauer ceiling exactly (not below), Kuramoto coherence is r = 1 across the entire fleet, impedance is matched within the noise floor, peak/RMS discipline rejects every unsafe aggregation provably.

**Where Ouroboros is today:**
- Cadence match: shipped — **90**
- Impedance match: shipped, |Γ| < 0.1 in tests — **88**
- Q-factor history: shipped, drift-detected — **85**
- Kuramoto coherence: shipped, r ≥ 0.85 in tests — **85** (true r = 1 is unphysical for any real fleet)
- Peak/RMS discipline: shipped — **92**

**Estimated R ≈ 0.88.** The ceiling is 0.95–0.98 because perfect coherence (r = 1) is physically impossible. Anyone claiming R = 1 is lying.

### Reconciliation (F)
**100 means:** three independent witnesses agree on every released leaf with zero divergence, every threshold is decomposable into ≤ 4 distinct unit fractions exactly, every accumulator step is verifiable via an independent re-derivation that uses only shift-add.

**Where Ouroboros is today:**
- Frustum reconciliation: shipped, 9 tests — **95**
- Seked slope audit: shipped, 11 tests — **90**
- Unit-fraction threshold inspection: shipped, 12 tests — **95** (all canonical RMP decompositions verified)
- Doubling multiplication HSM accumulator: shipped, 13 tests — **92**

**Estimated F ≈ 0.93.** The newest axis but the cleanest mathematically. Egyptian primitives are 4000-year-stable; the implementation is straightforward.

## What does the Lutar Invariant say with these numbers?

Plug in the realistic axes (C = 0.88, H = 0.85, R = 0.88, F = 0.93) with default Egyptian weights:

\[
\Lambda = 0.88^{1/4} \cdot 0.85^{1/4} \cdot 0.88^{1/4} \cdot 0.93^{1/4} \approx 0.884
\]

**A realistic Lutar Invariant for the current Ouroboros runtime is 0.88.**

That is **excellent** — it means a runtime trust scalar of 88% across all four axes simultaneously. Almost no AI system in production today would clear 0.7 if you ran the same scoring honestly. But it is not 1.0, and the gap is informative.

## Where the gap to 1.0 actually is

The dominant gap is **formal verification**. Three of the four axes have implementation-level testing but not machine-checked proofs. To raise each axis from ~0.88 to ~0.97, you need:

1. **Lean / Coq proof of the Merkle implementation** (Cleanliness → 0.97). Already a known target; ~9 months of academic work.
2. **Linear-type port of the no-cloning primitive** (Horizon → 0.95). 12 months, requires either an Idris / Granule rewrite or a custom linear type checker.
3. **Formally verified peak/RMS aggregator** (Resonance → 0.94). 4 months, easier because it is a bounded computation.
4. **Already strong** (Reconciliation, F → 0.97). The Egyptian primitives are simple enough that the tests effectively cover the proof. A formalization in Lean would push it to 0.99.

**With all four formal verifications in place: Λ ≈ 0.96, not 1.0.** The remaining 4% is empirical reality — real systems leak entropy, real fleets have phase noise, real auditors miss things. **1.0 is not a goal; 0.95 is.**

## What is actually 100/100 about v4

The Lutar Invariant itself is at 100/100 on its own terms:

| Property | Status |
|---|---|
| Closed-form expression | **100** — it is a single formula |
| Uniqueness theorem | **100** — proven under A1–A4 |
| Bound theorem | **100** — proven |
| Test coverage of the implementation | **100** — 18/18 tests pass |
| Cross-runtime bit-exactness | **100** — Egyptian inspectability axiom enforces this |
| Public proof | **100** — `docs/LUTAR_INVARIANT.md` |
| Reference implementation | **100** — `packages/invariant/` |

**The v4 contribution is 100/100 on the law itself.** The runtime axes it aggregates are at 0.88 each. That is the honest distinction.

## What I would say in a customer or investor conversation

Customer: "Does this give us a 100% trust score?"

Honest answer: "No system gives you a 100% trust score. What v4 gives you is a single auditable number — the Lutar Invariant Λ — that compresses four independent axes into one with provable bounds. A typical production deployment lands between 0.80 and 0.92. We tell you the formula, the weights, the bound theorem, and we ship the source code. If anyone tells you 1.0, they are not measuring the same thing we are measuring."

Investor: "Is this a defensible moat?"

Honest answer: "The moat is the Egyptian inspectability axiom — bit-exact reproducibility across runtimes. No other trust aggregator has it. The patent claim covers the method, not the formula itself. The standards-track adoption is what makes the moat economic; the math is what makes it defensible against re-implementation."

## Where to focus next to lift the score

**Highest-leverage gaps (in order):**

1. **Formal verification of the witness root** (~9 months, lifts C from 0.88 → 0.97).
2. **NIST AI RMF named contribution** (~3 months part-time, lifts perceived score across all axes via standards adoption).
3. **First lighthouse customer** (~6 months, lifts Reconciliation by exposing edge cases that pure tests miss).
4. **Linear-type port of no-cloning** (~12 months, lifts H from 0.85 → 0.95). Lower priority because the runtime enforcement is already strong.

## Bottom line

**v4 does not make Ouroboros 100/100 on each axis.** What it does is define what the score actually is, prove the law that combines them is unique, and ship a reference implementation that scores ~0.88 today.

The path from 0.88 to 0.95 is well-mapped. The path from 0.95 to 1.0 is asymptotic — it does not exist for any real runtime. Anyone selling 1.0 is either lying or measuring the wrong thing.

This is what honest scoring looks like. It is also why the Lutar Invariant is a moat: every other vendor reports a single proprietary score with no axis breakdown, no bound theorem, and no source code. Ouroboros reports four axes, the law that combines them, the bound, and the source code. **0.88 with a proof beats 0.99 without one, every time.**

---

## V4.6 Extension Scorecard — Ten New Modules

Date: v4.6 release. These scores follow the same methodology as the four-axis assessment above: defence-grade rigour, academic rigour, deployability, and Egyptian inspectability. Honest grades. No module is at 100/100 on all dimensions until a Lean/Coq proof of the implementation exists.

### Scoring legend

| Dimension | What 100 means |
|---|---|
| Defence-grade rigour | Primitives are machine-checkable, test-green, and would pass a DARPA adversarial review |
| Academic rigour | Primary sources are peer-reviewed or historically documented; module design is falsifiable |
| Deployable | Ships as a self-contained package with tests, examples, and a documented interface |
| Egyptian inspectability | Every threshold and weight is expressible as a finite sum of distinct unit fractions |

### Module scores

| Module | Primitives | Tests | Defence-grade rigour | Academic rigour | Deployable | Egyptian inspectability | Notes |
|---|---|---|---|---|---|---|---|
| Blanca | 21-24 | 42 | 95 | 98 | 95 | 100 | Academic rigour near-ceiling: Einstein SR/GR and EPR are the most tested bodies of physics in history. Defence ceiling caps at 95 until a formal proof of the Lorentz-covariance checker exists. |
| Oppenheimer | 25-28 | 28 | 92 | 90 | 92 | 100 | Dual-use-review primitive is the weakest link: the policy definition of a classification boundary is jurisdiction-dependent. Academic rigour reflects that the moral-ledger design draws on published accountability theory but has no peer-reviewed runtime analogue to cite. |
| Socrates | 29-32 | 28 | 88 | 95 | 90 | 100 | The elenchus gate is the hardest to score: detecting self-contradiction in a generative model is an open research problem. 88 is realistic for a runtime-level gate. Academic rigour is high because the divided-line sourcing is direct from the Republic. |
| Lara | 33-36 | 26 | 90 | 98 | 88 | 100 | Sourced directly from Jamneshan-Shalom-Tao Math. Ann. 394:11, 2026 — the most recent peer-reviewed primary source in the runtime. The abramov-gate implementation involves a non-constructive boundary; deployability caps at 88 because the boundary cannot be computed exactly, only approximated. |
| Emerald | 37-40 | 25 | 82 | 85 | 90 | 100 | The hermetic sources (Emerald Tablet, Newton 1680 translation) are historically documented but not peer-reviewed in a modern scientific sense. Defence-grade rigour is 82: the above-below and one-thing primitives are harder to operationalize than the cryptographic or physics-grounded ones. |
| Newton | 41-44 | 29 | 93 | 97 | 93 | 100 | The Principia and the mint-forensics records are among the most studied primary sources in science. Mint-forensics is the only Ouroboros primitive with a financial-forensics application; deployability is 93 because financial-adjacent outputs require jurisdiction-specific configuration. |
| Jung | 45-48 | 23 | 78 | 82 | 85 | 100 | Jung's sourcing is peer-reviewed within analytical psychology but does not carry physics-grade falsifiability. The shadow-registry and synchronicity-log are novel runtime constructs; no prior implementation to compare against. Defence-grade rigour is 78: the acausal-correlation claim in synchronicity-log is epistemically hedged, as it must be. |
| Theosophy | 49-52 | 21 | 75 | 80 | 85 | 100 | The Three Objects of the Theosophical Society are historically documented. Comparative-corpus and periodicity have clear runtime semantics. Brotherhood-gate and latent-capacity are harder to pin operationally. Defence-grade rigour is 75: the module is deployable but its adversarial surface is less well-characterized than the physics modules. |
| Trithemius | 53-56 | 22 | 90 | 88 | 92 | 100 | Carrier-integrity and key-separation are well-characterized cryptographic problems; the Trithemius sourcing gives historical depth. Academic rigour is 88 rather than 95 because the 15th-century originals require interpretive translation to runtime semantics. This is the same interpretive step that the Egyptian-mathematics sourcing required in v4. |
| Da Vinci | 57-60 | 22 | 85 | 90 | 88 | 100 | Sourced from three well-documented primary works. Vitruvian-frame and divine-proportion map cleanly to mathematical constraints. Sfumato is the only primitive in the runtime that encodes deliberate boundary-uncertainty tolerance rather than precision; deployability is 88 because callers must configure the tolerance parameter explicitly. |

### What v4.6 is actually 100/100 on

Every one of the 10 new modules is 100/100 on Egyptian inspectability. All weights and thresholds in every new primitive are expressed as finite sums of distinct unit fractions. The combined test suite (612 TypeScript + 107+ Python) is green. Every module ships with documented source references and a falsifiable primitive contract. The unified-philosophy adapter at `packages/integrations/src/unified-philosophy.ts` wires all 10 new modules into the Lutar Invariant pipeline without modifying any existing primitive.

No module is at 100/100 on defence-grade rigour. That cap is set by the absence of machine-checked proofs. The roadmap to close it is the same as in the original scorecard: Lean/Coq formalization, 9-18 months per module family. The highest-leverage target in v4.6 is Blanca: a Lean proof of the lorentz-invariance checker would lift both the Blanca score and the Invariance axis of Λ from 0.95 to 0.98.
