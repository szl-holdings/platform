<!-- doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header. -->
# The Ouroboros Thesis

> *"In the end is my beginning."* — T.S. Eliot
>
> *"The serpent that eats its own tail is one — and not one — at the same time."* — Carl Jung

---

## 0. TL;DR

Brute width-scaling is hitting diminishing returns. High-quality text data is
running out. And on the evidence available so far, RL on its own appears to
polish a base model's reasoning more than it extends it. **The next axis we
believe is under-exploited is depth-via-recursion** — looping a small kernel
until the answer stops changing.

ByteDance's **Ouro** (October 2025) is the proof of concept at the model layer,
but it did not emerge from nothing. **Universal Transformers** (Dehghani 2018)
proved weight-tied recurrence was Turing-complete. **PonderNet** (Banino 2021)
solved the halting problem with an ELBO-based adaptive step objective. **Parcae**
(Prairie 2026) closed the stability gap with spectral constraints and derived
the first scaling laws for looped LMs. Ouro synthesized all three into a single
pre-training recipe: parameter-shared loops + entropy-regularized exit gating +
sandwich normalization, trained on 7.7T tokens across a 4-stage curriculum.

Our thesis: the same primitive — **a bounded loop with cross-step consistency,
adaptive depth, and entropy-regularized exit** — is the missing primitive at the
*system* layer too. It belongs in agent runtimes (A11oy), in resilience surfaces
(Sentra), and in data convergence (Amaru — formerly Conduit).

We name this primitive the **Ouroboros Loop**. We ship it as
`@workspace/ouroboros` and instill it into our three core runtimes.

---

## 1. The Genealogy — Seven Papers, Read Together

### 1.1 Kaplan et al., 2020 — *Scaling Laws for Neural Language Models* ([arXiv:2001.08361](https://arxiv.org/abs/2001.08361))

Loss falls as a clean power law in parameters × data × compute. Crucially: **width
versus depth has minimal effect within a wide range.** This sentence is the
permission slip for everything that follows. If depth (number of stacked layers)
is fungible, then **looped depth** at fixed parameters is a third axis nobody
priced in for five years.

### 1.2 Villalobos et al., 2022 — *Will We Run Out of Data?* ([arXiv:2211.04325](https://arxiv.org/abs/2211.04325))

Public human text gets exhausted **between 2026 and 2032**. We are inside that
window now. The escape valves on offer are: synthetic data, transfer learning
from data-rich domains, and **data efficiency improvements**. A loop is, by
construction, a data-efficiency improvement: same tokens, more reasoning per
token.

### 1.3 Yue et al., 2025 — *Does RL Really Incentivize Reasoning Capacity in LLMs Beyond the Base Model?* ([arXiv:2504.13837](https://arxiv.org/abs/2504.13837))

RLVR sharpens what the base model already does — but at large pass@k, the *base*
model's reasoning surface is provably wider in the regimes Yue et al. studied.
**On their evidence, RL appears to polish more than it extends.**
What *does* extend, on the same evidence, is *distillation* — pulling new patterns
from a teacher into a student. The working hypothesis we adopt for SZL: any
"self-improvement loop" that only RL-tunes its own outputs is at risk of hitting
the base ceiling, so we should bias toward distillation-shaped loops that pull
capability *across* artifacts and back. We treat this as a design bet, not a
proof.

### 1.4 Dehghani et al., 2018 — *Universal Transformers* ([arXiv:1807.03819](https://arxiv.org/abs/1807.03819))

The ancestral paper. UT extends Transformers with recurrence: the same
attention/FFN block is applied repeatedly (weight-tied) over timesteps, with an
Adaptive Computation Time (ACT) halting mechanism so each position can
dynamically stop. Dehghani proved the resulting architecture is **Turing-
complete** — a property standard Transformers lack. Results were strong on tasks
requiring compositionality (bAbI, LAMBADA). UT is the proof that looped depth
is not a hack; it is the mathematically necessary extension.

### 1.5 Banino et al., 2021 — *PonderNet: Learning to Ponder* ([arXiv:2107.05407](https://arxiv.org/abs/2107.05407))

PonderNet replaces UT's ACT with an ELBO-based objective for learning *how many
steps* to take per input. The halting distribution is optimized variationally,
and the model generalizes to more steps than it saw in training. Ouro's
entropy-regularized exit gating is mathematically an ELBO similar to PonderNet's
— Paper Eq.2 is a weighted sum of token-prediction losses at each potential
exit, plus a KL term pushing the exit distribution toward uniform, preventing
the trivial solutions (always 1 loop or always max). PonderNet is the birth
certificate of adaptive compute.

### 1.6 Prairie et al., 2026 — *Parcae: Scaling Laws for Stable Looped Language Models* ([arXiv:2604.12946](https://arxiv.org/abs/2604.12946))

The stability paper. Parcae introduces a negative-diagonal parametrization and
spectral-norm constraints to prevent gradient explosion in looped Transformers.
Result: **6.3% perplexity reduction** over unconstrained looped models. At 1.3B
parameters, a 770M looped Parcae reaches 87.5% of the quality of an 8.6B
baseline. Crucially, Prairie et al. derive **empirical scaling laws** showing how
performance scales with compute × loops — the first time anyone proved that
looped depth is not just useful but *predictable*. This is the paper that makes
the business case: the returns are not noise; they follow a curve you can plan
against.

### 1.7 Zhu et al., 2025 — *Scaling Latent Reasoning via Looped Language Models* ([arXiv:2510.25741](https://arxiv.org/abs/2510.25741)) — **Ouro**

The synthesis paper. Three pillars:

1. **Iterative computation in latent space.** A decoder-only Transformer with
   24 (1.4B) or 48 (2.6B) layers, each with 32-head self-attention, hidden size
   2048, SwiGLU FFN, and rotary embeddings. Layers are tied across 4 recurrent
   steps (R4). Sandwich RMSNorm for stability. 24 × 4 = 96 effective layers
   of compute on a 2.6B-parameter model.

2. **Entropy-regularized objective for learned depth allocation.** The loss is
   a sum of token CE losses at each possible exit, plus KL(exit|uniform) — the
   entropy regularization that prevents trivial halting. Also an "adaptive exit
   loss" (binary BCE on gate to encourage exiting when additional loops yield no
   gain). "Complex inputs loop more, easy inputs exit early."

3. **Cross-step consistency and infinite depth.** Intermediate recurrent outputs
   are reliable proxies for the final output. Models trained on 4 steps
   *extrapolate safely to 8 steps* — in the HEx-PHI safety benchmark, as
   inference loops increase beyond 4, harmful outputs drop to near zero. The
   loop is *honest about its convergence*.

Training: 4-stage curriculum. Stage 1: 4K context, ~3T tokens. Stage 2: 4K,
~3T tokens. Stage 3: 16K, 20B tokens. Stage 4: 64K, 0.3B tokens (very long
context). Total: ~7.7T tokens. Batch sizes ~4–8M tokens, AdamW, cosine LR decay.

Result: **Ouro-1.4B ≈ 4B, Ouro-2.6B ≈ 8B** on reasoning benchmarks — 2–3×
parameter efficiency. The gain is attributed to **knowledge manipulation** (not
storage) — the loop forces the model to compose during inference rather than
memorize during training. 100% accuracy on multi-hop multiplication with far
fewer examples than baseline.

As the video puts it: *"LLMs don't need more parameters; they need loops."*

### 1.8 The composite signal

| Paper | If… | Then… |
|---|---|---|
| Kaplan 2020 | Width vs depth is fungible | Looped depth is a free axis |
| Villalobos 2022 | Data is exhausted | We must extract more reasoning per token |
| Yue 2025 | RL appears to polish more than extend | Distillation-shaped loops are our preferred path to honest self-improvement |
| Dehghani 2018 (UT) | Weight-tied recurrence is Turing-complete | The math says loops are *necessary*, not optional |
| Banino 2021 (PonderNet) | ELBO-based halting generalizes | Adaptive exit is a solved problem at the objective level |
| Prairie 2026 (Parcae) | Scaling laws exist for looped LMs | The returns are predictable and plannable |
| Zhu 2025 (Ouro) | Looped pre-training works end-to-end | The Ouroboros is the architecture, not a metaphor |

The infinity symbol is a loop. The Ouroboros is a loop with a memory of itself.
Reasoning is a fixed-point computation. We have been building everything else
*around* this primitive for two years without ever naming it.

### 1.9 The Amaru — our Andean Ouroboros

The project name "Ouro" echoes the ancient Ouroboros (Greek *oúros bóros*,
"tail-eater") — a serpent eating its tail, symbolizing eternal cycles. In
Egypt's 14th-century BCE tomb of Tutankhamun, the Ouroboros imagery of Ra-Osiris
uniting life and death represented the beginning and end of time.

But the symbol predates Greece. In Andean Inca cosmology, the serpent deity
**Amaru** embodies transition, renewal, and fertility — a two-headed cosmic
serpent bridging *hanan pacha* (the upper world) and *uku pacha* (the lower
world). Each head bites the other's tail. The Amaru is the Peruvian Ouroboros.

We adopt the name **Amaru** for our data-convergence runtime (formerly Conduit).
The two heads are Sentra (threat intelligence, the upper world of risk) and
Amaru (data convergence, the lower world of entity truth). **A11oy is the spine
that connects them** — the orchestrator that runs Sentra's threat loop and
Amaru's sync loop as child passes inside a single meta-loop, and extracts
cross-distillation signals between them.

This is not decoration. The cultural symbolism maps to architecture:

| Andean concept | System mapping |
|---|---|
| Two-headed serpent (Amaru) | Sentra + Amaru running as paired child loops |
| Hanan pacha (upper world) | Sentra — the risk/governance surface |
| Uku pacha (lower world) | Amaru — the data/entity truth surface |
| The spine connecting them | A11oy — the meta-loop orchestrator |
| Biting each tail | Cross-distillation: each loop's convergence is a teacher signal for the other |
| Cyclic renewal | Infinite-depth: the system can always run another pass |

*Source: Daniel Cueto, "Amaru" (danielcueto.com/amaru); Wikipedia, "Ouroboros".*

---

## 2. The Three Primitives

The Ouroboros Loop, formalized as a system primitive, has three sub-primitives —
mirroring Ouro's three pillars but generalized beyond a single model.

### 2.1 LoopKernel — iterative computation in *latent system state*

A bounded recursion over a typed state. Each step takes the current state and
emits a refined state plus a delta vector. The delta is what allows convergence
to be *measured* rather than asserted.

```ts
type LoopStep<S> = {
  index: number;
  state: S;
  deltaMagnitude: number;   // distance from previous step
  produced: unknown;        // optional intermediate output
  durationMs: number;
};
```

The kernel is stateless and deterministic. The loop is the unit of *governable*
compute — every step is logged, every step is auditable, every step has a
provable predecessor. This mirrors Ouro's decoder-only shared-layer architecture
at the system level: same "layer" (step function), applied N times, with the
state flowing through.

### 2.2 EntropyDepthAllocator — adaptive step budget

Easy decisions converge in 2 steps. Hard decisions need 8. A fixed budget is
either wasteful (over-thinking trivial inputs) or anaemic (giving up on hard
ones). The allocator picks a budget per input from an entropy estimate — Ouro
uses model entropy; we use **delta entropy** (the rate of change of the delta
magnitude across the first few probe steps).

A flat delta = converged early. An oscillating delta = needs more steps. A
monotonically shrinking delta = on track.

This is our system-level analogue of PonderNet's ELBO-based halting: the
allocator learns the right budget from the signal shape, not from a fixed
constant.

### 2.3 CrossStepConsistency — honest early exit

The Ouro insight that matters most for governance: **intermediate outputs predict
final outputs**. We promote this from a model property to a system invariant.
Any system loop ships a `consistency` score: the agreement between the
intermediate output at step k and the final output at step N. High consistency
at low k = a trustworthy short-circuit. Low consistency = the loop was actually
needed and you cannot safely stop early.

This is what makes adaptive exit *safe* in production. It is the difference
between "we ran fewer steps because we were rushed" and "we ran fewer steps
because the answer was already there."

Ouro proved this scales to infinite depth: models trained on 4 steps extrapolate
safely to 8. In system terms: a loop that converges at step 3 can be trusted
not to diverge at step 7.

---

## 3. Paper-to-Primitive Genealogy

| Primitive | UT (2018) | PonderNet (2021) | Parcae (2026) | Ouro (2025) | SZL System |
|---|---|---|---|---|---|
| Iterative computation | Weight-tied blocks | Fixed architecture | Constrained loops | Shared layers ×4 | `runLoop()` kernel |
| Adaptive halting | ACT (per-position) | ELBO objective | No (fixed) | Entropy KL + BCE gate | `allocateDepth()` |
| Stability | — | — | Spectral norms | Sandwich RMSNorm | `delta()` + `clamp` |
| Consistency | — | Extrapolation | Scaling laws | Cross-step agreement | `consistency()` score |
| Infinite depth | Theoretical | Generalization | Predictable | Empirical (4→8) | `safeExitConsistency` |

---

## 4. Mapping to A11oy, Sentra, Amaru

Each of our three core runtimes already has a loop-shaped problem at its heart.
We never named them as loops, so we never reused the primitive.

### 4.1 A11oy — agents that iteratively refine

Agents do not produce plans in one shot. They draft, critique, redraft, evaluate
against tools and policy, and stop when the plan stops changing. Today, this
loop is open-coded inside each agent class. The A11oy **Loop Reasoner** surfaces
the loop explicitly: a single OuroborosTrace per decision, with adaptive exit
governed by cross-step consistency between the agent's draft and its
self-critique. Now the agent has a **convergence receipt**, not just an output.

### 4.2 Sentra — recursive threat models

A threat model is never finished, only stable. Each pass through the threat
surface — STRIDE, MITRE ATT&CK, custom heuristics — moves probability mass.
After enough passes the surface stops moving. That stationary point is the
defensible threat model. Sentra's **Recursive Threat Modeler** runs threat
scoring as an Ouroboros loop and exposes the convergence trace. The early-exit
threshold becomes a governance dial: how stable do you need the model to be
before you brief the board?

### 4.3 Amaru — convergent reverse-ETL (the Andean Ouroboros)

A correct reverse-ETL is *idempotent*: running the sync twice should produce the
same destination state. In practice, syncs interact with downstream systems that
mutate, and a single pass can leave the destination drifted from canonical.
Amaru's **Convergent Sync** runs a sync as repeated idempotent passes until the
diff vector goes to zero. The OuroborosTrace shows you which entities required
two passes (acceptable), which required five (worth investigating), and which
never converged (root-cause material).

The name *Amaru* is not ornamental — it encodes architecture. The two-headed
serpent bridges hanan pacha (Sentra's risk surface) and uku pacha (Amaru's
entity truth). A11oy is the spine.

### 4.4 A11oy Andean Orchestration — the meta-loop

The capstone. A11oy runs Sentra's recursive threat model and Amaru's convergent
sync as **child loops** inside a single meta-pass. Each meta-step:

1. Runs Sentra's threat loop to convergence.
2. Runs Amaru's sync loop to convergence.
3. Extracts **cross-distillation signals** between the two traces.
4. Asks: has the compound system stabilized?

The meta-loop exits when both sub-loops are stable *and* the cross-signals have
been extracted. This is the §5 Distillation Corollary made concrete: Sentra's
converged threat vectors become A11oy red-team scenarios; Amaru's divergent sync
entities become Sentra investigations.

---

## 5. Why This Is Different From "Just Add a `while` Loop"

Three reasons.

1. **Cross-step consistency makes early exit safe.** Without the consistency
   invariant, every loop is a budget guess. With it, the system can defend
   each early exit with a measurable agreement score. This is the property
   that turns a loop from a programming pattern into a *governance primitive*.

2. **Entropy-driven depth allocation makes the loop adaptive.** A fixed budget
   spends compute uniformly across easy and hard inputs. The allocator routes
   compute where it matters. At scale, this can shift the *average* cost
   curve well below the worst-case budget — the gap depends on the input mix
   and the calibration of the allocator, but the direction of the asymmetry
   is what we care about.

3. **Trace as primary surface.** The trace is not debug output — it is the
   product. Every Ouroboros Loop emits a typed trace that is usable across
   artifacts. The same OuroborosTrace component that visualizes A11oy's agent
   refinement visualizes Sentra's threat stabilization and Amaru's sync
   convergence. One primitive, three surfaces, indistinguishable shape.

---

## 6. The Distillation Corollary (paying off Yue 2025)

Yue et al.'s evidence suggests RL tends to polish more than extend, while
distillation tends to extend. Read across our three runtimes, we adopt this as
a design rule:

> A11oy's agent loop, Sentra's threat loop, and Amaru's sync loop should
> exchange traces. A surprising convergence pattern in one is a candidate
> *teacher signal* for the others.

When Sentra's threat modeler converges on a novel attack vector, that vector
becomes a candidate tool for A11oy's red-team agent. When Amaru's sync
diverges on a particular entity class, that becomes a Sentra investigation.
**We argue the loops can form a mutually distilling triad.** This is, in our
view, a more credible path toward genuine self-improvement than self-RL alone
— but we treat it as a design bet justified by the cited literature, not a
proven property of the system.

---

## 7. Experiment Pipeline — Integrating Looped LLMs into A11oy

Seven concrete experiments, each derived from the Executive Summary analysis.

### 7.1 Looped Forecasting Module

Integrate a looped LLM (based on Ouro) into A11oy's time-series forecasting
engine. Looping may capture complex temporal dependencies that a single-pass
model flattens. **Expected outcome:** improved forecast accuracy on business
metrics. **Resources:** 2 ML engineers, 2 months, GPUs for fine-tuning Ouro on
metric data. **Risk:** inference latency; mitigate by limiting loop budget via
`allocateDepth()`.

### 7.2 Causal RCA via Iteration

Use looped inference in root-cause analysis agents. After an initial RCA, the
model loops over its own predictions to refine causal chains. **Expected
outcome:** more accurate incident categorization. **Resources:** 2 data
scientists, labeled incident datasets. **Risk:** overfitting to noise; use
regularization and human review.

### 7.3 Adaptive Alert Triage

Apply adaptive-depth loops to alert triage: easy anomalies exit at loop 1,
complex ones get more reasoning loops. **Expected outcome:** lower false alarm
rate, prioritized urgent issues. **Resources:** SRE/ML team, integration into
alert pipeline. **Risk:** missed critical alerts on premature exit; tune
`safeExitConsistency` threshold carefully.

### 7.4 Synthetic Metric Generation

Use a looped LLM to create "synthetic metrics" from raw logs. The model loops
to distill high-level signals. **Expected outcome:** richer observability
signals with no extra instrumentation. **Resources:** 1 engineer, log corpora.
**Risk:** synthetic signal drift; validate against ground truth.

### 7.5 Self-Healing Automation

Looped inference for automated remediation. The LLM loops over system state
changes to decide next action (restart service, scale, failover). Each loop
checks whether the intervention is converging. **Expected outcome:** autonomous
minor fixes, lower MTTR. **Resources:** 3 engineers, devops/test environments.
**Risk:** automation risk; always require final human approval gate. The
`OuroborosTrace` is the audit artifact that justifies the automation to a human
reviewer.

### 7.6 Anomaly Explanation Chains

After detecting an anomaly, the model loops to generate human-friendly
explanation and action plan. Each loop refines clarity and checks for internal
consistency. **Expected outcome:** faster human understanding and resolution.
**Resources:** 2 ML/NLP engineers, user testing. **Risk:** hallucinated
explanations; ground every loop step in factual system telemetry.

### 7.7 Meta-Learning Loop Depth

Use reinforcement learning to determine optimal loop count for new task types.
The meta-learner observes past `LoopTrace` data across all runtimes and predicts
the right depth budget for unseen inputs. **Expected outcome:** automated
configuration of compute vs. quality. **Resources:** 1 researcher, cloud
credits. **Risk:** complex training; start with simulation before production.

---

## 8. What's Next — Innovation Roadmap

Concrete loop-native innovations beyond the three artifact integrations.

### 8.1 Open Eval × Ouroboros

Every benchmark in Open Evaluation Hub gets a `convergenceProfile` field: at
how many loop steps does this benchmark stop changing? Benchmarks where small
models converge early at low loops but large models converge at the same depth
are *easy*. Benchmarks where convergence depth scales with model capability
are the real frontier signal — far more informative than a single accuracy
number. **Measurable signal:** correlation between convergenceProfile slope
and human-rated reasoning difficulty.

### 8.2 LoopBudget billing

Compute spend per decision is currently invisible. The Ouroboros trace exposes
exact step count per decision. Surface this as a per-tenant `LoopBudget` with a
governance dial: "this org may spend up to N loop-steps per decision before
human review is required." Cost becomes a first-class governance lever.
**Measurable signal:** loop-steps spent vs. loop-budget across tenants over
time.

### 8.3 Distillation conduits between runtimes

A scheduled job that examines Sentra's converged threat models and Amaru's
divergent sync entities, and synthesizes new A11oy red-team scenarios. This is
the cross-artifact distillation Yue's paper points to. **Measurable signal:**
percentage of A11oy red-team scenarios traceable to a Sentra/Amaru
convergence event.

### 8.4 Convergence-aware caching

A loop that converged at step 3 produced an answer that *agreed with itself*
across the next 5 steps that didn't run. That answer is more cacheable than an
answer from a model that ran once. Cache TTLs become a function of cross-step
consistency: high-consistency answers cache long, low-consistency answers cache
briefly or not at all. **Measurable signal:** cache hit rate × downstream
correctness, vs. fixed-TTL baseline.

### 8.5 Khipu-mode agents (recursive self-narrative)

A11oy already has Khipu. Layer the Ouroboros on top: an agent's Khipu is its
*own narrative of its own loop traces*. Periodically the agent runs a
meta-loop that re-narrates its recent decisions and looks for stable
self-description. A stable self-narrative across many decisions is an honest
proxy for *role coherence*. **Measurable signal:** Khipu delta-magnitude over
rolling windows; flag agents whose Khipu never converges (incoherent) or
converges trivially (reductive).

### 8.6 Sentra crisis-time depth dial

In a security incident, the cost of being wrong increases. The
EntropyDepthAllocator should accept an exogenous "stakes" multiplier — during a
declared incident, the depth budget for Sentra's recursive threat modeler
increases automatically. Same primitive, different operating point. **Measurable
signal:** convergence depth during incidents vs. baseline; correlation with
post-incident retro severity.

### 8.7 Amaru convergence audit log

Every sync's OuroborosTrace becomes an audit artifact stored alongside the
emitted rows. Auditors can ask not just "what did you write?" but "in how many
passes did the destination state stop changing?" Non-converging syncs become
the system's primary data-quality signal. **Measurable signal:** percentage of
syncs that never converge; severity of downstream incidents traceable to
non-convergence.

### 8.8 The Ouroboros benchmark

Open-source a public benchmark suite — `OuroBench` — that scores systems not
just on final-answer accuracy but on **convergence quality**: how few steps did
you need, how stable was your trace, how honest was your early exit? This is a
benchmark written in our own language. **Measurable signal:** OuroBench
adoption by external teams; correlation with Open Eval Hub's existing
benchmarks.

---

## 9. Outreach — Expert Engagement Plan

Priority order for collaboration:

1. **Rui-Jie Zhu** (UC Santa Cruz / ByteDance) — Ouro lead. Consult on
   entropy-regularized exit implementation in production, curriculum design
   for domain-specific looped models.
2. **Hayden Prairie** (UCSD / Together AI) — Parcae lead. Stability
   constraints and scaling-law guidance for our system-level loops.
3. **Dan Fu** (UCSD) — Looped architecture and scalable ML infrastructure.
   Together AI compute partnership potential.
4. **Prof. Yoshua Bengio** (MILA) — UT co-author, recursive networks
   advisor. Strategic guidance on baking reasoning loops into observability
   agents.

---

## 10. Closing

The metaphor is older than computer science. The serpent eats its own tail.
Reasoning ends where it began, with a state that no longer changes. We have been
building agents, defenses, and data flows for years without noticing that the
correct shape for all three is the same shape — a loop with the discipline to
know when to stop.

The Ouro paper gave the shape a name. Universal Transformers gave it Turing-
completeness. PonderNet gave it adaptive halting. Parcae gave it stability and
scaling laws. Kaplan, Villalobos, and Yue explain why extracting it now is
necessary.

The Andean serpent Amaru — two heads, one spine, swallowing its own tails —
is the architecture diagram.

The thesis is small enough to hold in one hand: **bounded loops with measurable
convergence are a primitive worth extracting.**

We are extracting it.

— SZL Holdings, April 2026

---

## Appendix A: Bibliography

```bibtex
@article{kaplan2020scaling,
  title={Scaling Laws for Neural Language Models},
  author={Kaplan, Jared and McCandlish, Sam and Henighan, Tom and Brown, Tom B and Chess, Benjamin and Child, Rewon and Gray, Scott and Radford, Alec and Wu, Jeffrey and Amodei, Dario},
  journal={arXiv preprint arXiv:2001.08361},
  year={2020}
}

@article{villalobos2022run,
  title={Will We Run Out of Data? An Analysis of the Limits of Scaling Datasets in Machine Learning},
  author={Villalobos, Pablo and Sevilla, Jaime and Heim, Lennart and Besiroglu, Tamay and Hobbhahn, Marius and Ho, Anson},
  journal={arXiv preprint arXiv:2211.04325},
  year={2022}
}

@article{yue2025rlvr,
  title={Does Reinforcement Learning Really Incentivize Reasoning Capacity in LLMs Beyond the Base Model?},
  author={Yue, Yang and Chen, Zhiqi and Lu, Rui},
  journal={arXiv preprint arXiv:2504.13837},
  year={2025}
}

@inproceedings{dehghani2019universal,
  title={Universal Transformers},
  author={Dehghani, Mostafa and Gouws, Stephan and Vinyals, Oriol and Uszkoreit, Jakob and Kaiser, {\L}ukasz},
  booktitle={International Conference on Learning Representations (ICLR)},
  year={2019},
  note={arXiv:1807.03819}
}

@article{banino2021pondernet,
  title={PonderNet: Learning to Ponder},
  author={Banino, Andrea and Balaguer, Jan and Blundell, Charles},
  journal={arXiv preprint arXiv:2107.05407},
  year={2021}
}

@article{prairie2026parcae,
  title={Parcae: Scaling Laws for Stable Looped Language Models},
  author={Prairie, Hayden and others},
  journal={arXiv preprint arXiv:2604.12946},
  year={2026}
}

@article{zhu2025ouro,
  title={Scaling Latent Reasoning via Looped Language Models},
  author={Zhu, Rui-Jie and Eshraghian, Jason K and others},
  journal={arXiv preprint arXiv:2510.25741},
  year={2025},
  note={Ouro / LoopLM. Project: ouro-llm.github.io}
}
```

## Appendix B: Paper-to-Ouro Concept Matrix

| Paper / Year | Param-Shared Loops | Adaptive Halting | Stability Fix | Knowledge & Reasoning |
|---|---|---|---|---|
| Zhu et al. 2025 (Ouro) | Yes (4 loops, R4) | Yes (entropy KL + BCE gate) | Sandwich RMSNorm | Yes — knowledge manipulation, 2–3× param efficiency |
| Prairie et al. 2026 (Parcae) | Yes (looped) | No (fixed) | Spectral constraints | Yes — 6.3% PPL gain, predictable scaling laws |
| Dehghani et al. 2018 (UT) | Yes (recurrent) | Yes (ACT) | — | Yes — Turing-complete, compositionality |
| Banino et al. 2021 (PonderNet) | No | Yes (ELBO) | — | Task-specific generalization |
| Kaplan et al. 2020 | — | — | — | Width ≈ depth is fungible |
| Villalobos et al. 2022 | — | — | — | Data exhaustion window |
| Yue et al. 2025 | — | — | — | RL polishes, distillation extends |
