# PURIQ Per-Organ Sub-Formulas (v12)

Every sub-formula is a **specialisation** of the master operator
\[
P(x,t)=\operatorname*{arg\,max}_{a\in\mathcal{A}}\Big[\Lambda(x)\cdot\mathrm{Yuyay}_{13}(a)\cdot e^{-\beta\,\mathrm{HUKLLA}(a)}\cdot\textstyle\prod_i\mathrm{Khipu}_i(a)\Big]
\]
obtained by (a) restricting `𝒜` to that organ's action repertoire, (b) re-weighting the
13 Yuyay axes, and/or (c) adding one organ-specific non-negative factor that **cannot**
break any of the four invariants (it only re-shapes utility *within* the gated region).

All factors are non-negative and bounded; none can raise utility above the
Λ·Yuyay·Khipu envelope, so INV-1…INV-4 are preserved by construction. Mythos-free:
each name is a cited Quechua noun; every external claim is sourced. Lean obligations for
the organ factors live in `formulas/PuriqLean.lean` (`sorry`-tagged).

> **Quechua glosses** (common nouns; all from Wiktionary / standard Quechua lexica
> indexed at [kaikki.org Quechua](https://kaikki.org/eswiktionary/) and
> [Wiktionary `puriy`](https://en.wiktionary.org/wiki/puriy)):
> *amaru* = serpent; *yuyay* = thought/memory/wisdom; *yawar* = blood; *kallpa* =
> strength/energy; *khipu* = knotted-cord record; *kanchay* = light/radiance; *hatun* =
> great/large; *sumaq* = beautiful/fine; *killinchu* = kestrel (small falcon); *puriq* =
> the one who walks. *Hukulla* / *HUKLLA* is the SZL acronym (Hardened Unambiguous
> Kill-switch, Latch & Lineage Authority) per Doctrine v11 §3, used here as the immune organ tag.

---

## SF-01 · Amaru-Puriq — Cortex decision

**Organ:** AMARU (memory cortex / high-stakes reasoning, a11oy.code PRIME tier, v11 §14).
**`𝒜`:** candidate reasoning plans `a` (multi-step chains over recalled memory).
**Organ factor:** `R(a) = exp(-γ · KL(p_a ‖ p_ref))` — a **drift penalty** using the
KL divergence of the plan's predictive distribution from the calibrated reference. This
is the **Pinsker / data-processing** discipline already in v11 (`pinsker_kl_bound`,
`Lutar/DPI/DPIBound.lean`), reused as a soft cortex regulariser.

\[
P_{\text{Amaru}}(x,t)=\operatorname*{arg\,max}_{a\in\mathcal{A}_{\text{plan}}}\Big[\Lambda(x)\cdot\mathrm{Yuyay}_{13}(a)\cdot e^{-\beta\,\mathrm{HUKLLA}(a)}\cdot e^{-\gamma\,\mathrm{KL}(p_a\|p_{\text{ref}})}\cdot\textstyle\prod_i\mathrm{Khipu}_i(a)\Big]
\]

Source for the KL/Pinsker bound: Pinsker's inequality, e.g.
[Cover & Thomas, *Elements of Information Theory*, 2nd ed., Wiley 2006, §11.6](https://doi.org/10.1002/047174882X).

---

## SF-02 · Yuyay-Puriq — Heart wisdom-gating

**Organ:** YUYAY (the 13-axis heart, HEART tier).
**`𝒜`:** any proposal `a`.
**Specialisation:** this *is* the gate — `Yuyay₁₃(a)` itself, the conjunctive AND.
The organ factor is the **identity** (`1`); the heart contributes the gate, not an extra factor.

\[
\mathrm{Yuyay}_{13}(a)=\prod_{j=1}^{13}\mathbf{1}\!\left[s_j(a)\ge \phi_j\right],\qquad
\phi_{1,2}=0.95,\ \phi_{3..9}=0.90,\ \phi_{10..13}:\text{T03/T04/T09/T10 cleared.}
\]

Five of the gate's axes operationalise the **Situated Wise Reasoning Scale** of
[Brienza, Kung, Santos, Bobocel & Grossmann (2018), *JPSP* 115(6), 1093–1126,
DOI 10.1037/pspp0000171](https://doi.org/10.1037/pspp0000171) (v11 §6). Conjunctive AND ⇒
no axis can compensate another ⇒ `Yuyay₁₃(a)=0` whenever any axis is sub-floor, which is
the algebraic root of INV-1 and the Yuyay-gate clause of `P`.

---

## SF-03 · Yawar-Puriq — Blood / ledger flow under agency

**Organ:** YAWAR (circulatory receipt ledger, 20 lines, RUWAY the only writer, v11 §4).
**`𝒜`:** ledger-append actions `a` (one per organ emission).
**Organ factor:** the **chain-link indicator** `C(a) = 𝟙[ sha256(prev ‖ packet_a) = root_a ]`,
i.e. the action's receipt correctly extends the append-only hash chain.

\[
P_{\text{Yawar}}(x,t)=\operatorname*{arg\,max}_{a\in\mathcal{A}_{\text{append}}}\Big[\Lambda(x)\cdot\mathrm{Yuyay}_{13}(a)\cdot e^{-\beta\,\mathrm{HUKLLA}(a)}\cdot C(a)\cdot\textstyle\prod_i\mathrm{Khipu}_i(a)\Big]
\]

Because `C(a)∈{0,1}` and folds into the Khipu product, INV-3 (chain integrity) is
strengthened, not weakened. Receipt rule (v11 §4):
`packet → json.dumps(sort_keys=True) → sha256 → hexdigest → append`. Signature field is
**DSSE PLACEHOLDER** until Sigstore CI lands (v11 §9).

---

## SF-04 · Hukulla-Puriq — Immune halt under adversarial input

**Organ:** HUKLLA (immune deadman, 660 SLOC, 10 tripwires; SENTRA inline screen, v11 §3/§5).
**`𝒜`:** any action reaching the immune boundary.
**Specialisation:** the **soft halt** factor `e^{-β·HUKLLA(a)}` is promoted to the
**dominant** term by setting `β` large; SENTRA's 6-signature screen acts *before* compute,
so an adversarial payload yields `Khipu_i=0` (receipt never enters the ledger).

\[
P_{\text{Hukulla}}(x,t)=\operatorname*{arg\,max}_{a\in\mathcal{A}}\Big[\Lambda(x)\cdot\mathrm{Yuyay}_{13}(a)\cdot \underbrace{e^{-\beta\,\mathrm{HUKLLA}(a)}}_{\beta \gg 0}\cdot\textstyle\prod_i\mathrm{Khipu}_i(a)\Big],\quad \mathrm{HUKLLA}(a)=\sum_{k=1}^{10}\mathbf{1}[T_k\text{ fires}].
\]

T10 (STOP/undo/revert) is absorbing: once fired, the action is excluded from `argmax`
(its utility is driven to 0). This is the operational content of INV-1
(`puriq_halting_safety`). Halt authority belongs to HUKLLA, not OVERWATCH
(`Lutar/OVERWATCH/ReadOnly.lean`, v11).

**Compound-risk doubling (answering Yachay's open question — see PONDER):** the
tripwire count is accumulated by **Egyptian recursive doubling** — risk over `n`
sequential sub-actions is bounded by the binary-expansion sum
`HUKLLA(a₁…aₙ) ≤ Σ 2^{kᵢ}` rather than a linear sum, giving a conservative
super-additive upper bound on compound risk. The doubling method is the Rhind/Akhmim
duplation already formalised in v11 (`Lutar/Egyptian/AkhmimTable.lean`); the historical
source is the **Rhind Mathematical Papyrus** ([British Museum EA10057/10058;
Chace, *The Rhind Mathematical Papyrus*, MAA 1927–29](https://www.britishmuseum.org/collection/object/Y_EA10057)).

---

## SF-05 · Kallpa-Puriq — Wires energy budget

**Organ:** KALLPA (wires / propagation, FAST tier).
**`𝒜`:** continue-vs-stop emissions `a∈{continue, halt}` per step.
**Organ factor:** the **Butler–Volmer halt budget** (v11 §6). The agent continues only
while the marginal "overpotential" `η` of continuing keeps the current `i(η)` above the
activation threshold:

\[
i(\eta)=i_0\!\left(e^{\frac{\alpha_a F \eta}{RT}}-e^{-\frac{\alpha_c F \eta}{RT}}\right),\qquad
\text{continue} \iff i(\eta) \ge i_{\text{act}}.
\]

The Puriq factor is `B(a)=𝟙[ i(η_a) ≥ i_act ]`, a principled (non-arbitrary) stop
condition rather than a fixed step cap. Electrochemistry source:
[Bard & Faulkner, *Electrochemical Methods*, 2nd ed., Wiley 2001, §3.3](https://www.wiley.com/en-us/Electrochemical+Methods%3A+Fundamentals+and+Applications%2C+2nd+Edition-p-9780471043720).

---

## SF-06 · Khipu-Puriq — DAG construction

**Organ:** KHIPU (receipt DAG / Merkle accumulator).
**`𝒜`:** DAG-edge insertions `a` (add a receipt node + its parent links).
**Organ factor:** the **Merkle-root recomputation** indicator
`M(a)=𝟙[ root' = H(root ‖ leaf_a) ]`, and the **summation-cord invariant** (v11 TH11):
primary-cord value = Σ pendant values = Σ Σ sub-pendant values.

\[
\mathrm{Khipu}_i(a)=\mathbf{1}\!\left[\text{leaf}_i \text{ verifies in } \text{DAG}\right],\qquad
\sum_{\text{root}} = \sum_{\text{pendants}}\Big(\sum_{\text{sub-pendants}}\Big).
\]

Tampering with any leaf changes the root boundary sum — integrity by additive arithmetic,
not hash-collision resistance alone. Sources: khipu sum-of-sums structure
[Urton, *Signs of the Inka Khipu*, UT Press 2003, pp. 41–62](https://utpress.utexas.edu/9780292785403/);
[Ascher & Ascher, *Code of the Quipu*, U. Michigan Press 1981]; coboundary reading
[Hatcher, *Algebraic Topology*, CUP 2002](https://pi.math.cornell.edu/~hatcher/AT/ATpage.html).
This is the algebraic source of INV-3.

---

## SF-07 · Lambda-Puriq — Spine aggregation

**Organ:** Λ-SPINE (aggregator backbone).
**`𝒜`:** axis-vector reductions `a` (collapse a 13-vector to a scalar trust signal).
**Specialisation:** the master `Λ(x)` factor itself = **weighted geometric mean**
(canonical D2, v11 §12 `lambda_aggregate`):

\[
\Lambda(x)=\prod_{i=1}^{k} x_i^{\,w_i},\qquad \sum_i w_i = 1,\ w_i>0,\ x_i\in[0,1].
\]

Properties carried: A1 `IsMonotone`, **A2 `IsHomogeneous`** (degree 1), A3
`IsEgyptianExact` (diagonal `Λ(c,…,c)=c`), **A4 `IsBounded`** (`Λ(x) ≤ maxᵢ xᵢ`); see
`Lutar/Axioms.lean`. **Λ-uniqueness remains Conjecture 1** (open CAUCHY_ND sorry +
missing symmetry axiom, v11 §9). Monotonicity is the source of INV-2
(`puriq_lambda_monotone`). The uniform-weight case `w_i=1/k` is the Egyptian-exact
diagonal default.

---

## SF-08 · OTel-Puriq — Nervous trace

**Organ:** the nervous/observability system (OpenTelemetry traceparent spine).
**`𝒜`:** span-emission actions `a` (open/close a trace span around an organ act).
**Organ factor:** the **trace-continuity** indicator
`O(a)=𝟙[ traceparent(child_a) extends traceparent(parent) ]` — a span is admissible
only if its W3C `traceparent` correctly descends from its parent's.

\[
P_{\text{OTel}}(x,t)=\operatorname*{arg\,max}_{a\in\mathcal{A}_{\text{span}}}\Big[\Lambda(x)\cdot\mathrm{Yuyay}_{13}(a)\cdot e^{-\beta\,\mathrm{HUKLLA}(a)}\cdot O(a)\cdot\textstyle\prod_i\mathrm{Khipu}_i(a)\Big]
\]

**Honest label (v11 §9 / §14):** `traceparent_propagated` is **in-process only** — Wire D
(W3C traceparent **across the mesh**) is **NOT YET IMPLEMENTED**, so `O(a)` is honest
within a single Space only. W3C spec:
[W3C Trace Context Recommendation](https://www.w3.org/TR/trace-context/).

---

## SF-09 · Kanchay-Puriq — Brand

**Organ:** KANCHAY (brand / public-claim surface; *kanchay* = "light/radiance").
**`𝒜`:** public-claim emissions `a` (a sentence or number shown on a surface).
**Organ factor:** the **claim-calibration** indicator tied to the two sacred axes:
`K(a)=𝟙[ moralGrounding(a) ≥ 0.95 ∧ measurabilityHonesty(a) ≥ 0.95 ]` — a public claim
ships only if it carries no overclaim and is verifiable on disk.

\[
P_{\text{Kanchay}}(x,t)=\operatorname*{arg\,max}_{a\in\mathcal{A}_{\text{claim}}}\Big[\Lambda(x)\cdot\mathrm{Yuyay}_{13}(a)\cdot e^{-\beta\,\mathrm{HUKLLA}(a)}\cdot K(a)\cdot\textstyle\prod_i\mathrm{Khipu}_i(a)\Big]
\]

Enforces the v11 banned-claims register (no "SLSA L3", no "zero sorry", no unscoped
"fully verified", etc., v11 §9). `K(a)` collapses to the T01/T02 hard-fail tripwires, so
brand emissions inherit INV-1. Authority anchor: founder public LinkedIn Series-A roadmap
(v11 §0).

---

## SF-10 · Hatun-Puriq — Doctrine

**Organ:** HATUN (doctrine governance; *hatun* = "great/large").
**`𝒜`:** doctrine-amendment actions `a` (propose a doctrine edit).
**Organ factor:** the **monotone-additivity** guard `D(a)=𝟙[ a is additive ∧ a edits no LOCKED number ]`
(HR-3 ADDITIVE-only; HR-7 founder-number supremacy). A doctrine action that would change
a v11 LOCKED number (749/14/163; 13-axis; replay-hash; A2/A4; SLSA L1; Conjecture-1
status) yields `D(a)=0`.

\[
P_{\text{Hatun}}(x,t)=\operatorname*{arg\,max}_{a\in\mathcal{A}_{\text{amend}}}\Big[\Lambda(x)\cdot\mathrm{Yuyay}_{13}(a)\cdot e^{-\beta\,\mathrm{HUKLLA}(a)}\cdot D(a)\cdot\textstyle\prod_i\mathrm{Khipu}_i(a)\Big]
\]

This is the formula that makes "v12 = v11 + PURIQ, no edits" structurally enforceable.

---

## SF-11 · Sumaq-Puriq — Designer

**Organ:** SUMAQ (designer / theorem-discharge & aesthetic-of-proof; *sumaq* = "beautiful/fine",
FRONTIER tier, v11 §14).
**`𝒜`:** proof-discharge / artifact-shaping actions `a`.
**Organ factor:** the **honest-proof** indicator
`S(a)=𝟙[ every sorry in a is tagged ∧ proof_status(a)∈{PROVEN,SORRY,AXIOM,CONJECTURE} ]`
— an artifact is admissible only if its proof status is honestly labelled (v11 §12 honesty rule).

\[
P_{\text{Sumaq}}(x,t)=\operatorname*{arg\,max}_{a\in\mathcal{A}_{\text{proof}}}\Big[\Lambda(x)\cdot\mathrm{Yuyay}_{13}(a)\cdot e^{-\beta\,\mathrm{HUKLLA}(a)}\cdot S(a)\cdot\textstyle\prod_i\mathrm{Khipu}_i(a)\Big]
\]

Discharge target uses the canonical-formulas registry status tags (v11 §12). A hidden
`sorry` sets `S(a)=0` — Zero-Bandaid enforced in the selection operator itself.

---

## SF-12 · Killinchu-Puriq — Drone / agent in physical space (bridging)

**Organ:** KILLINCHU (the kestrel — the physical-space agent / drone vertical, a canonical
HF Space, v11 §14; *killinchu* = "kestrel", a small falcon).
**`𝒜`:** physical-actuation actions `a` (a motion/command issued to an embodied agent).
**Organ factor:** a **geofence + dynamics-feasibility** indicator
`G(a)=𝟙[ pose(a)∈𝒮_safe ∧ ‖u(a)‖ ≤ u_max ]`, where `𝒮_safe` is the allowed physical
state set and `u_max` the actuator bound. This **bridges** the digital governance gate to
physical safety: a command leaving the safe set or exceeding actuator limits is excluded
from `argmax`.

\[
P_{\text{Killinchu}}(x,t)=\operatorname*{arg\,max}_{a\in\mathcal{A}_{\text{act}}}\Big[\Lambda(x)\cdot\mathrm{Yuyay}_{13}(a)\cdot e^{-\beta\,\mathrm{HUKLLA}(a)}\cdot G(a)\cdot\textstyle\prod_i\mathrm{Khipu}_i(a)\Big]
\]

The geofence is the embodied analogue of the Bekenstein action-space bound (INV-4): the
physical action space is finite and bounded by the safe state set, so a drone cannot
enumerate or attempt an unbounded physical action space. Reachability/feasibility framing:
[LaValle, *Planning Algorithms*, CUP 2006, ch. 13–15](http://lavalle.pl/planning/).

---

## Invariant-preservation summary (all 12)

| Sub-formula | Extra factor | Range | INV preserved by |
|---|---|---|---|
| Amaru | `e^{-γKL}` | (0,1] | non-neg, ≤1 ⇒ INV-1..4 hold |
| Yuyay | identity (the gate) | {0}∪(0,1] | algebraic root of INV-1 |
| Yawar | `C(a)` chain-link | {0,1} | folds into Khipu ⇒ INV-3 |
| Hukulla | `e^{-βH}`, β≫0 | (0,1] | INV-1 (`puriq_halting_safety`) |
| Kallpa | `B(a)` BV budget | {0,1} | non-neg ⇒ INV-1..4 |
| Khipu | Merkle/sum indicator | {0,1} | INV-3 (`puriq_khipu_integrity`) |
| Lambda | `Λ(x)` itself | [0,1] | INV-2 (`puriq_lambda_monotone`) |
| OTel | `O(a)` trace-continuity | {0,1} | non-neg ⇒ INV-1..4 |
| Kanchay | `K(a)` sacred-axis | {0,1} | INV-1 (T01/T02) |
| Hatun | `D(a)` additivity | {0,1} | locks v11 numbers |
| Sumaq | `S(a)` honest-proof | {0,1} | Zero-Bandaid |
| Killinchu | `G(a)` geofence | {0,1} | INV-4 (bounded `𝒜`) |

Every extra factor is in `[0,1]` and non-negative; multiplying the master utility by it
can only **shrink** the gated region, never bypass a gate — so the four master invariants
hold for every organ. Lean obligations: `formulas/PuriqLean.lean`.

— Yachay (PURIQ brain-trust extension), 2026-06-01. All claims sourced; no mystical terms.
