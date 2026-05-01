# Tesla → Ouroboros: synthesis memo

Author: Stephen P. Lutar (with Computer)
Date: 2026-04-30
Source: [Formulas for Tesla coils — Open Tesla Research](https://teslaresearch.jimdofree.com/tesla-coils/formulas-for-tesla-coils/)
Companion: [`blackholes_to_ouroboros_synthesis.md`](./blackholes_to_ouroboros_synthesis.md)

---

## What Tesla actually gave us

The page is a reference table. Strip the geometry-specific coil formulas and what's left is universal physics that maps cleanly to a multi-agent runtime:

| Tesla formula | Operational meaning |
|---------------|--------------------|
| `f = 1 / (2π√(LC))` — resonant frequency | Every closed loop has a natural cadence |
| `Z = √(L/C)` — characteristic impedance | The boundary impedance between two loops determines transfer efficiency |
| `J = ½ C V²`, `J = ½ L I²` — stored energy | A loop can be viewed as a capacitor (state) or inductor (work-in-flight) |
| Dual-resonant primary/secondary topology | Two coupled subsystems transfer maximum energy when their resonant frequencies match (`f₁ = f₂`) |
| Coupling coefficient `k` (implicit in dual-tuning) | How tightly two loops share state — this IS the entanglement metric in another costume |
| `Q = ωL/R` (quality factor, implicit) | How long a loop preserves coherent oscillation before damping |
| RMS vs peak (`E_rms = 0.7071·E_peak`) | Average behavior diverges from worst-case; alerting must use peak, not mean |

Tesla gave the world working **resonant energy transfer between loosely coupled systems with no direct contact**. That is exactly what A11oy is supposed to do across agents: hand work between loops that don't share memory, with maximum efficiency and minimum loss.

---

## Why this is not a metaphor

Black-hole physics gave us five primitives about **information conservation** inside a single loop. Tesla physics gives us five primitives about **information transfer between loops**. They are complementary, not redundant:

- Black holes → invariants on a single loop's lifetime (Page curve, no-hair, dual-witness)
- Tesla → invariants on the coupling between loops (resonance match, impedance match, Q-factor, dual-tuning, peak-vs-RMS alerting)

Together they close the runtime. The loop is well-formed (Horizon) and the loop-to-loop handoff is well-formed (Resonance).

---

## The five Tesla primitives (Resonance package)

### R1. ResonantFrequencyMatch — the LC primitive

**Tesla anchor.** `f = 1 / (2π √(LC))`. A primary and secondary coil transfer maximum energy iff `f_p = f_s`.

**Operational analog.** Every loop has a measured *cadence frequency* `f_ℓ` — the dominant period of its observation/work cycle. Two loops handing off work transfer information cleanly iff `|f_a − f_b| / f_a < δ`, with default `δ = 0.05`.

**What it gives us.** A11oy gets a physical-units-grounded reason to refuse a handoff: *"this loop oscillates at 4 Hz and that one at 0.3 Hz; binding them will cause beating."* Today the runtime has no such concept.

### R2. ImpedanceMatchedHandoff — the Z primitive

**Tesla anchor.** `Z = √(L/C)`. Maximum power transfer occurs when source and load impedances match. An impedance mismatch reflects energy back.

**Operational analog.** Every loop has an *interface impedance* derived from the boundary cardinality (the L-analog: how much "inertia" the boundary has) and the loop's state cardinality (the C-analog: how much state it stores). Reflection coefficient:

  Γ = (Z₂ − Z₁) / (Z₂ + Z₁)

A handoff with `|Γ| > 0.2` triggers a `REFLECTION_LOSS` warning. Above `0.5` it's a hard deny.

**What it gives us.** Sentra gets a quantitative refusal of "wrong-shape handoff" instead of policy hand-coding. Two surfaces with mismatched fan-in/fan-out characteristics will bounce work back and forth — exactly the reflection-loss pattern. We can detect it before it ships.

### R3. QualityFactorBudget — the Q primitive

**Tesla anchor.** `Q = ω L / R` (or equivalently `Q = f / Δf`). A high-Q resonator stores energy for many cycles before damping; a low-Q resonator dissipates fast.

**Operational analog.** A loop's `Q_ℓ` is the ratio of its useful work output to its energy dissipated as drift, retries, hallucination, or context-loss. Specifically: `Q_ℓ = W_useful / W_lost`, measured per closed loop using the no-hair `mass` (work done) and the residual entropy from the Page curve (work that left the system as un-reconciled state).

**What it gives us.** A single number per loop that says *"this loop is high-fidelity"* or *"this loop is leaky."* Schedulers prefer high-Q loops for high-stakes tier-1 work. Amaru flags Q-decay across releases as quality regression.

### R4. DualTuningProtocol — the k coupling primitive

**Tesla anchor.** A Tesla coil works because the primary and secondary tank circuits are *both* tuned to the same frequency, with a precisely chosen coupling coefficient `k` (typically 0.1–0.3 for spark-gap coils). Too tight → energy slosh; too loose → no transfer.

**Operational analog.** When two loops `a → b` are bound, both must run in their resonant band AND the coupling strength (mutual information from the Entanglement primitive) must be in `[k_min, k_max]`. We pin `k_min = 0.1` bits, `k_max = 0.7` bits. Below `k_min` is "no transfer" (decoupled); above `k_max` is "energy slosh" (loops oscillating against each other, the runtime equivalent of two services in a livelock).

**What it gives us.** A11oy detects livelocks before they become incidents. The pattern of two loops oscillating in counter-phase has a precise signature: high mutual information AND oscillation frequencies within `δ` AND opposite phase. That is exactly what a livelock looks like.

### R5. PeakVsRMSAlerting — the worst-case primitive

**Tesla anchor.** `E_rms = 0.7071 · E_peak`. The RMS voltage is what does work on average; the peak voltage is what burns the dielectric. For safety analysis you must use peak.

**Operational analog.** Every metric on a loop has both a mean (RMS-equivalent) and a peak. The runtime must alert on peak when the underlying invariant is integrity (Page-curve cleanliness, complementarity, tier-monotone handoffs) and on mean when the underlying invariant is throughput. We make this rule machine-checkable: any alert rule on an integrity invariant that uses mean instead of peak is rejected at registration time.

**What it gives us.** A correctness property of the alerting layer itself. Today it's policy. Tomorrow it's a unit test in `@workspace/resonance`.

---

## The one trap to refuse

**Wireless free energy / over-unity.** Tesla is also famous for dubious claims. Several modern AI papers gesture toward "lossless coordination" or "free coherence." Those are the runtime equivalent of perpetual motion. Ouroboros must explicitly refuse this framing. Every loop **dissipates**; that dissipation is the cost of governance. A lossless governed system is a contradiction, exactly like a lossless heat engine. The runtime budgets Q and accepts that perfect Q is unreachable.

---

## What's already in the literature (current leaders)

The Tesla → AI bridge isn't speculation. It exists, well-cited, in Q4 2024 / Q1 2025:

1. **AKOrN — Artificial Kuramoto Oscillatory Neurons** ([arXiv:2410.13821](https://arxiv.org/abs/2410.13821), ICLR 2025) — Miyato, Löwe, Geiger, **Max Welling**. Replaces threshold units with Kuramoto oscillators. Code: [`autonomousvision/akorn`](https://github.com/autonomousvision/akorn). Welling is among the top-cited ML researchers globally; this is mainline research.
2. **Kuramoto on simplicial complexes** ([`arnaudon/simplicial-kuramoto`](https://github.com/arnaudon/simplicial-kuramoto)) — extends synchronization to hypergraphs (multi-way coupling). Directly applicable to multi-loop topology.
3. **Reference Kuramoto implementation** ([`fabridamicelli/kuramoto`](https://github.com/fabridamicelli/kuramoto)) — clean Python; we lift the math, port to TypeScript.
4. **Wireless power transfer impedance matching** ([PMC11086091](https://pmc.ncbi.nlm.nih.gov/articles/PMC11086091/), 2024) — modern engineering of `Z = √(L/C)` matching for adaptive systems. The control-theory translates directly.
5. **Q-factor control** (Zurich Instruments engineering blog, 2024) — operational Q-tuning in resonators.
6. **Emergent coordination in multi-agent LLMs** ([arXiv:2510.05174](https://arxiv.org/html/2510.05174v3), 2025) — quantifies emergent properties via information decomposition. Their math sits one step below ours: they measure emergence; we govern it.

We are not making up the bridge. We are the first ones to **ship it as a runtime** instead of leaving it in a paper.

---

## What we take, legitimately

- **Kuramoto phase update** (`dθ_i/dt = ω_i + (K/N) Σ sin(θ_j − θ_i)`) — public-domain math. We implement it from the equation, not from anyone's code, so there is no licensing question. We cite the original Kuramoto 1975 and AKOrN 2024.
- **Order parameter** (`r e^{iψ} = (1/N) Σ e^{iθ_j}`) — public-domain. We use it as the "coherence score" across a loop family.
- **Impedance matching control law** — public textbook material. We cite Pozar, *Microwave Engineering*.
- **Q-factor formulation** — public textbook material. We cite Pozar.

Nothing we ship copies a line of code from any of those repos. The math is in textbooks.

---

## How this changes A11oy / Sentra / Amaru

**A11oy:**
- Loop scheduling adds a *resonance band* check. Two loops of incompatible cadence are not bound.
- Multi-agent fan-out uses Kuramoto-style coherence (`r`) as a liveness signal: when `r → 1`, the agents have agreed; when `r` flatlines mid-run, they're stuck.

**Sentra:**
- New policy primitive: `resonance.cadence_match(a, b, δ=0.05)`.
- New policy primitive: `resonance.impedance_match(a, b, max_reflection=0.2)`.
- Existing dirty-close policy gains a Q-factor companion: `Q < 1.5` triggers tier-degradation review.

**Amaru:**
- Replays now record cadence and Q. Forensic queries: *"show me every loop whose Q dropped >30% over the last 7 days."*
- Cross-environment audit: production vs staging Q-factors. Drift > 20% is a release-block.

---

## The honest limit

This is dimensional analysis with units in **bits and ticks**, not henries and farads. The math is rigorously borrowed; the units are reinterpreted. A signal-integrity engineer would recognize the structure but rightly point out we're not solving Maxwell's equations. That is fine. We are using resonance as a *control structure*, the same way Kuramoto did for coupled biological oscillators in 1975 — long before anyone called it "AI."

The acceptance test is whether shipping these primitives reduces incidents. If it doesn't, we falsify and remove them. The Falsification Ledger applies.

---

## Single-line positioning lines

- *"Two black-hole loops and a Tesla transformer."*
- *"The horizon governs the loop. The resonator governs the handoff."*
- *"Information is preserved across the runtime; energy is transferred efficiently between loops."*
- *"Governance with units."*
