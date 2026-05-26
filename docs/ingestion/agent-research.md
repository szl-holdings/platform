# Ingestion note — recent agent research → ROSIE Hoeffding-LCB upgrade

**Date:** 2026-05-26
**Scope:** ROSIE evolution loop — `lib/formulas/src/evolution.ts`,
`lib/formulas/src/drift-detector.ts`,
`artifacts/api-server/src/jobs/rosie-evolution-loop.ts`,
`artifacts/api-server/src/routes/a11oy-formulas-api.ts`.
**Outcome (shipped):** Added a **Hoeffding lower-confidence-bound gate**
on the observed drift gap. Distribution-free, finite-sample valid, opt-in
via `ROSIE_GAP_LCB_MIN` env (recommended production value: `0.10` to
match `gapMin`). One demo eval call exercises it end-to-end —
`scripts/demo-rosie-lcb-gate.ts`.

---

## 1. Sources read

### 1.a — The two assigned sources (verified directly, not via snippets)

| # | Claimed citation | What's actually there | Survives a careful read? |
|---|---|---|---|
| 1 | arXiv:2508.09457 — "recent agent research" | *Quantum Parrondo Paradox via a Single Phase Defect Symmetry Breaking and Directed Transport*, Chang et al., quant-ph, submitted 13 Aug 2025, last revised 14 Apr 2026. <https://arxiv.org/abs/2508.09457> | Real paper. Real result **in quantum walks**. **Not agent-evaluation research** — the task framing is wrong about what this ID points to. |
| 2 | "Stanford MGCoT ROUGE metric work" | No such paper exists under that name. MGCoT appears as ref [134] in the MCoT survey arXiv:2503.12605 — a scene-graph multimodal CoT method, **not** a ROUGE contribution and **not** from Stanford. The closest live referent that does use ROUGE-L across granularities is **CoTAR** (arXiv:2404.10513), also not Stanford. | Cannot survive — the source isn't there to read. |

Neither assigned source defensibly justifies a metric upgrade to ROSIE.
The first is in the wrong field; the second doesn't resolve to a real
paper. Promising a metric on either would have been hallucination.

### 1.b — Real leaders in the field (searched 2026-05-26)

Because the assigned sources don't earn an upgrade, this note went one
step further and surveyed the actual state of the art for **online
evaluation of numeric parameter proposals** — which is what ROSIE
actually does (it scores formula-parameter tunings against drift
signals; it does not score generated text).

| Body of work | What it gives ROSIE | Cited URL |
|---|---|---|
| **Auer, Cesa-Bianchi & Fischer (2002)** — *Finite-time Analysis of the Multiarmed Bandit Problem*, Machine Learning 47:235–256, §2.1. UCB1 confidence radius. | The exact confidence radius `√(ln(1/δ) / 2n)` used for the upgrade. | <https://doi.org/10.1023/A:1013689704352> · PDF: <https://people.eecs.berkeley.edu/~russell/classes/cs294/s11/readings/Auer+al:2002.pdf> |
| **Hoeffding (1963)** — *Probability Inequalities for Sums of Bounded Random Variables*, JASA 58:13–30. | The underlying inequality. Distribution-free, finite-sample. ROSIE's `relativeGap` clamps each sample into [0, 1], so Hoeffding's precondition holds by construction. | DOI 10.1080/01621459.1963.10500830 |
| **Howard, Ramdas, McAuliffe, Sekhon (2021)** — *Time-uniform, nonparametric, nonasymptotic confidence sequences*, Annals of Statistics. | The state-of-the-art **anytime-valid** generalisation. Logged for the follow-up — see §4. | Code: <https://github.com/gostevehoward/confseq> |
| **Kohavi, Tang, Xu (2020)** — *Trustworthy Online Controlled Experiments*, Cambridge University Press. | The industry-standard playbook (Microsoft / Google / LinkedIn) for sequential-decision gating on observed deltas. Same family of techniques. | <https://www.cambridge.org/core/books/trustworthy-online-controlled-experiments/D97B26382EB0EB2DC2019A7A7B518F59> |
| **DeepEval / RAGAS / promptfoo / OpenAI Evals** — 2026's dominant LLM-eval frameworks. | Surveyed for completeness. **Not adopted** — these score generated text against references (ROUGE / G-Eval / RAGAS-style retrieval metrics). ROSIE evaluates numeric parameter proposals, so this family has no purchase here. | <https://github.com/confident-ai/deepeval> · <https://github.com/explodinggradients/ragas> · <https://github.com/promptfoo/promptfoo> · <https://github.com/openai/evals> |

The single highest-leverage win from that survey is the **Hoeffding LCB
gate**. It's the most directly-cited, smallest-surface, most-tested
upgrade in this entire body of literature, and it lands exactly on
ROSIE's real blind spot.

---

## 2. The real blind spot, and why Hoeffding LCB closes it

Before this task, `rosieProposalScore` weighted the observed gap by
`log1p(samples)` — monotone in n, but not a confidence interval. Two
proposals with the same 15 % point estimate scored almost identically
regardless of whether the estimate came from 25 samples or 2 500. The
operator queue therefore mixed reliable proposals with proposals that
were one variance burst away from reverting.

Hoeffding's inequality for bounded random variables in [0, 1] says:

> P( X̄ − E[X] ≥ ε ) ≤ exp(−2 n ε²)

Setting δ = exp(−2 n ε²) gives the one-sided radius ε = √(ln(1/δ) / 2n)
and the (1 − δ) lower bound on E[X] as X̄ − ε. The drift detector's
`relativeGap` already clamps each per-sample gap into [0, 1], so this is
the right inequality off the shelf — no parametric assumption, valid for
every finite n.

For δ = 0.05 (95 % one-sided):

| n     | Hoeffding radius ε | 95 % LCB on a 15 % observed gap |
|-------|--------------------|---------------------------------|
| 30    | 0.224              | 0 (clamped from −7 %)           |
| 300   | 0.071              | 7.9 %                           |
| 3 000 | 0.022              | 12.8 %                          |

The first two should not have queued at the `gapMin = 0.10` bar. The
third should. The Hoeffding gate gets that exactly right.

---

## 3. What shipped

### 3.a — Code

- `lib/formulas/src/evolution.ts` — new exported pure function
  `hoeffdingLowerBound(mean, n, delta = 0.05)`. New `gapLcbMin` and
  `gapLcbDelta` knobs on `evaluateObservedEvent`. New `gapHistory` field
  on `ObservedEvent` and `SentraSignalForRosie`. New `gapLcb` field on
  every emitted `TuningProposal.evidence` (surfaced to operators in the
  Codex tuning queue). Default `gapLcbMin = 0` preserves prior behaviour
  for any caller that doesn't supply a `gapHistory`.
- `lib/formulas/src/drift-detector.ts` — `drainSignals()` now attaches
  the per-bucket gap history to every emitted signal so the LCB gate has
  the data it needs at the api-server boundary.
- `artifacts/api-server/src/jobs/rosie-evolution-loop.ts` — `runRosieEvolutionTick`
  reads `ROSIE_GAP_LCB_MIN` (default 0) and forwards it through `runRosieLoop`.
- `artifacts/api-server/src/routes/a11oy-formulas-api.ts` — `proposeTuningInProcess`
  accepts `gapHistory` on the request payload and applies the same env-driven
  `gapLcbMin` so direct callers of `POST /a11oy/formulas/propose-tuning`
  honour the same gate as the scheduled tick.

### 3.b — Tests (vitest, all passing)

- `lib/formulas/src/evolution.test.ts` *(new file, 11 tests)* — unit
  tests for `hoeffdingLowerBound` against the closed-form reference
  formula, plus end-to-end tests for `evaluateObservedEvent` showing
  (a) backward-compat when no history is supplied, (b) thin-evidence
  rejection at `gapLcbMin = gapMin`, (c) thick-evidence acceptance at the
  same gap, and (d) gapMin / samplesMin still firing first when relevant.
- `lib/formulas/src/drift-detector.test.ts` *(extended, +1 test)* — the
  drained signal carries the gap history needed by the LCB gate.
- All 39 tests in the package pass (`pnpm exec vitest run lib/formulas`).

### 3.c — Demo eval call in dev preview

`scripts/demo-rosie-lcb-gate.ts` runs three contrasting proposals
through the live evaluator with `gapLcbMin = 0.10`:

```
▸ thin evidence  (n=30,   gap=15%)   95% LCB =  0.0%  → noop
▸ medium evidence (n=300,  gap=15%)   95% LCB =  7.9%  → noop
▸ thick evidence (n=3000, gap=15%)   95% LCB = 12.8%  → tuning (score 1.666)
```

Pre-upgrade, all three would have queued identical-looking proposals.
Run via `pnpm exec tsx scripts/demo-rosie-lcb-gate.ts`.

---

## 4. Honest follow-up

The Hoeffding bound is the most defensible *starting* point because it
makes no distributional assumption. The Howard-Ramdas anytime-valid
confidence sequences (the `confseq` reference above) are strictly
tighter at the same coverage and are the right next step *if* we ever
want the evaluator to be peeking-safe — i.e. correct under continuous
monitoring rather than only at fixed sample sizes. That upgrade is one
function swap (`hoeffdingLowerBound` → a `confseq` lower boundary) and
is deliberately deferred. Recorded in the existing project task list as
the replay-test follow-up to this work.

---

## 5. Provenance

- Both originally-assigned sources verified directly against arxiv.org;
  see §1.a. The arxiv ID resolves to a quantum-walks paper, not agent
  evaluation. The Stanford MGCoT citation does not resolve.
- Every leader cited in §1.b has a working URL (DOI, preprint PDF, or
  GitHub repo). No fabricated numbers, no fabricated citations.
- The Hoeffding radius is implemented as the closed-form expression from
  the cited papers; the demo script exercises it on three real evaluator
  calls; the unit tests cross-check against the closed form.
