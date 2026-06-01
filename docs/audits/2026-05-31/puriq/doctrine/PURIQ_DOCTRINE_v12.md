# Doctrine v12 — the PURIQ Agentic Layer

**Supersedes:** Doctrine v11 (`DOCTRINE_V11_LOCKED_2026-06-01_0145.md`). v12 carries
forward **every** v11 canonical number, honesty rule, and governance organ
**verbatim and unchanged** (§0–§15 of v11 remain binding) and **adds one layer**:
PURIQ, the agentic-action layer that sits *on top of* the existing anatomy. v12
introduces **no edits** to any v11 LOCKED number. It only adds: (a) the Puriq
coinage, (b) the master action-selection formula `P(x,t)`, (c) its four invariants,
and (d) the per-organ Puriq sub-formulas (see `sub_formulas/PURIQ_SUBFORMULAS_v12.md`).

**Canonical truth in one line (carried from v11):** the heart is **13-axis
(`yuyay_v3`)**, conjunctive AND, replay-hash
`bacf54434f1a3bf2d758b27a62d5fd580ca4c8d3b180693573eeebcaea631fc5`.

---

## §0 — WHY v12 EXISTS (the governance → agency ratchet)

Doctrine v11 defines **what may pass** (the 13-axis heart) and **what must halt**
(HUKLLA). It does **not** define **how an action is selected** once a proposal has
cleared the gate. v12 closes that gap with a single, Lean-stateable action-selection
operator, **`P(x,t)`**, so that *agency itself* — not just admission — is governed.

**v12 definition of "agentic" (locked):** an action is *agentic* iff it is selected
by `P(x,t)` under all four invariants below — i.e. it is **Λ-bounded**,
**Yuyay-gated**, **HUKLLA-safe**, and **Khipu-receipted**. An LLM call that lacks any
one of the four is **not** agentic under this doctrine; it is an ungoverned emission.

---

## §1 — PURIQ (the coinage)

**PURIQ** — from Quechua **_puriy_**, the intransitive verb "to walk / to go", whose
**agentive** (nominaliser `-q`) form **_puriq_** means **"the one who walks / the
walker / the one who acts"**
([Wiktionary, *puriy*](https://en.wiktionary.org/wiki/puriy) gives the conjugation
table with infinitive `puriy` → agentive `puriq`;
[Wiktionary Quechua, *puriq*](https://qu.wiktionary.org/wiki/puriq) glosses it
"walker / caminante / piéton"). The agentive reading "celui qui marche" — "the one who
walks" — is documented in the peer-reviewed ethnomusicology of the Cusco region
([La Riva González, *Puriq wayra*, Recherches amérindiennes au Québec / érudit,
2018](https://www.erudit.org/en/journals/fr/2018-v29-n2-fr03541/1044160ar.pdf)).

The morphology is the whole point: `-q` turns a process verb into the **agent that
performs it**. PURIQ is therefore the layer that turns the anatomy from *a thing that
evaluates* into *an agent that acts*. Capitalised `PURIQ` denotes the layer (like
`HUKLLA`); lowercase `puriq.{decide,act,reflect}` denotes the per-organ interface.

**Naming (locked, carried from the Charter):**
- **PURIQ** = the layer.
- **Puriq-Yuyay** = agentic cognition = acting under the 13-axis wisdom gate.
- **Puriq-Khipu** = receipt-chained agency = every act recorded in the DAG.
- **Puriq-Λ** = Λ-aggregated agentic utility = the scalar `P` maximises.

There are **no mystical terms** in this layer. Every name above is either a Quechua
common noun with a cited gloss or a math primitive already present in v11.

---

## §2 — THE MASTER FORMULA `P(x,t)` (locked)

For an evaluation context `x` at decision step `t`, over a bounded action space `𝒜`,
the **selected action** is

\[
P(x,t) \;=\; \operatorname*{arg\,max}_{a \in \mathcal{A}}
\Big[\; \Lambda(x)\,\cdot\, \mathrm{Yuyay}_{13}(a)\,\cdot\,
\exp\!\big(-\beta \cdot \mathrm{HUKLLA}(a)\big)\,\cdot\,
\textstyle\prod_{i} \mathrm{Khipu}_i(a) \;\Big].
\]

We write the bracketed scalar as the **Puriq utility** of action `a`:

\[
U(a \mid x) \;:=\; \Lambda(x)\,\cdot\,\mathrm{Yuyay}_{13}(a)\,\cdot\,
e^{-\beta\,\mathrm{HUKLLA}(a)}\,\cdot\,\prod_{i=1}^{m}\mathrm{Khipu}_i(a),
\qquad P(x,t)=\operatorname*{arg\,max}_{a\in\mathcal{A}} U(a\mid x).
\]

**Term definitions (each tied to a v11 organ; no new numbers introduced):**

| Term | Type | Definition | v11 anchor |
|------|------|------------|------------|
| `Λ(x)` | `ℝ≥0` | Lambda-Spine aggregator over the context's axis vector: the **weighted geometric mean** `∏ xᵢ^{wᵢ}`, `Σwᵢ=1` (canonical definition **D2** from v11 §12 `lambda_aggregate`). Positive-homogeneous (**A2 = `IsHomogeneous`**), monotone (A1), bounded (**A4 = `IsBounded`**). | v11 §12; `Lutar/Axioms.lean` |
| `Yuyay₁₃(a)` | `[0,1]` | 13-axis `yuyay_v3` score for action `a`. Conjunctive AND: `0` unless **all 13** axes clear their floors (2 sacred ≥ 0.95, 7 structural ≥ 0.90, 4 introspection cross-linked to HUKLLA T03/T04/T09/T10). Replay-hash anchor `bacf5443…631fc5`. | v11 §1–§2 |
| `HUKLLA(a)` | `ℕ` | Count of fired tripwires among **T01–T10** for action `a`. `0` ⇔ clean. T10 (STOP/undo/revert) is an absorbing halt. | v11 §3 |
| `β` | `ℝ>0` | Halt-penalty rate. As `β→∞`, any `HUKLLA(a)>0` drives `e^{-β·HUKLLA(a)}→0`, zeroing utility. | new (v12 parameter) |
| `Khipu_i(a)` | `{0,1}` | `i`-th receipt verification for the action's provenance chain; `1` ⇔ `chain_verified=true`, `0` otherwise. The product is `0` if **any** receipt fails. | v11 §4 (YAWAR) |
| `𝒜` | finite set | Bounded action space. `|𝒜|` is **Bekenstein-bounded by the context budget** (v11 §12 `bekenstein_cascade`). | v11 §12 |

**Reading.** `Λ(x)` is the context's standing trust scale (how much utility the
context is even *worth*). `Yuyay₁₃(a)` is the conjunctive admission gate. The
exponential is the **soft halt**: each fired tripwire multiplies utility by `e^{-β}`.
The Khipu product is the **hard provenance gate**: one broken receipt zeroes the action.
`P` then takes the `argmax` over the bounded `𝒜`.

**Honest labels (carried from v11 §9):**
- **Λ-uniqueness is Conjecture 1, NOT a theorem** — it depends on the open CAUCHY_ND
  sorry (`Uniqueness.lean:120`) plus a missing symmetry axiom. `P(x,t)` uses Λ as the
  canonical **D2** aggregator; it does **not** assume Λ is the unique such aggregator.
- The Khipu receipt **signature** is **DSSE PLACEHOLDER** (Sigstore not wired into CI);
  `Khipu_i(a)` verifies the **hash chain**, not the signature, until signing lands.
- SLSA level remains **L1 (honest)**. "SLSA L3" is BANNED.

---

## §3 — THE FOUR INVARIANTS (locked; proof obligations in `formulas/PuriqLean.lean`)

Each invariant has a `sorry`-tagged Lean theorem in `formulas/PuriqLean.lean`. None is
claimed proven; each is honestly stated as an open obligation per HR-4 (Zero Bandaid).

### INV-1 — Halting safety
> If any tripwire fires for the action that would otherwise be selected, then for
> sufficiently large `β` that action's Puriq utility is dominated by any clean action
> of non-zero utility. Formally: for `a` with `HUKLLA(a) ≥ 1` and `b` with
> `HUKLLA(b)=0` and `U₀(b) > 0`, there exists `β*` such that for all `β > β*`,
> `U(a∣x) < U(b∣x)`. In the limit, a STOP directive (T10) makes `argmax` never select
> a halted action. *(Lean: `puriq_halting_safety`.)*

### INV-2 — Λ-monotonicity preservation
> `P` preserves the Lambda-Spine monotonicity (A1 `IsMonotone`): raising any context
> axis cannot lower `Λ(x)`, and since `U(a∣x)` is `Λ(x)` times a non-negative
> action-only factor, raising any context axis cannot lower the utility of any fixed
> action. The `argmax` is therefore monotone in the context axis vector.
> *(Lean: `puriq_lambda_monotone`.)*

### INV-3 — Khipu-chain integrity required for non-zero utility
> `U(a∣x) > 0` implies `∏_i Khipu_i(a) = 1`, i.e. **every** receipt verifies. Contrapositive:
> any failed receipt (`Khipu_i(a)=0`) forces `U(a∣x)=0`, so a provenance-broken action
> can never be selected over any action with verified provenance and positive utility.
> *(Lean: `puriq_khipu_integrity`.)*

### INV-4 — Bekenstein bound on `|𝒜|`
> The action space is finite and its cardinality is bounded by the context's
> information budget: `|𝒜| ≤ N_Bek(x)`, where `N_Bek` is the v11 `bekenstein_cascade`
> bound. This guarantees the `argmax` is over a finite set (well-defined, decidable)
> and that agency cannot enumerate an unbounded action space.
> *(Lean: `puriq_bekenstein_bound`.)*

---

## §4 — LAYER COMPOSITION (carried from Charter; additive only — HR-3)

- **Doctrine v12 = Doctrine v11 + PURIQ.** No v11 number changes.
- Every organ exposes a `puriq.{decide,act,reflect}` interface:
  - `decide` evaluates `U(a∣x)` for candidate actions (Yuyay-gated, HUKLLA-checked);
  - `act` performs `P(x,t)`'s `argmax` selection and emits a Khipu receipt (via RUWAY,
    the only authorized writer, v11 §4);
  - `reflect` re-runs the introspection axes (10–13) against the emitted receipt.
- Each of the 12 anatomy organs derives its own sub-formula by specialising `𝒜` and the
  Yuyay axis weights — see `sub_formulas/PURIQ_SUBFORMULAS_v12.md`.
- a11oy.code (v11 §14) is PURIQ's reasoning backend: tier→organ routing already maps
  PRIME→Amaru, HEART→Yuyay, IMMUNE→Sentra, etc. PURIQ adds the `argmax` selection on top.

---

## §5 — HARD CONSTRAINTS (Zero-Bandaid Law, carried)

- **NO mystical words.** Every Puriq term is a cited Quechua common noun or a math primitive.
- Every Puriq formula is **Lean-stateable**; unproven obligations are **`sorry`-tagged**, never hidden.
- Every Puriq action emits a **Khipu receipt** through RUWAY.
- The **13-axis Yuyay gate is MANDATORY** before any agentic act ships (`Yuyay₁₃(a)=0` ⇒ `U=0`).
- All v11 honesty disclosures (§9) remain binding and are reproduced where relevant above.

---

## §6 — LOCKED-NUMBER FIDELITY CHECK (v12 changes none)

For audit convenience, v12 re-states the v11 LOCKED numbers it must preserve. **v12
edits none of these.**

- Lean corpus: **749 declarations / 14 unique axioms (15 raw, 1 dup) / 163 tracked
  sorries** @ lutar-lean tag `lutar-v18.0.0` / `c7c0ba17`.
- Heart: **13-axis `yuyay_v3`** = 2 sacred (≥0.95) + 7 structural (≥0.90) + 4
  introspection (T03/T04/T09/T10). Conjunctive AND, no compensation.
- Replay hash: `bacf54434f1a3bf2d758b27a62d5fd580ca4c8d3b180693573eeebcaea631fc5`.
- Axioms: **A2 = `IsHomogeneous`**, **A4 = `IsBounded`** (A1 `IsMonotone`, A3 `IsEgyptianExact`).
- SLSA: **L1 (honest)**. Λ-uniqueness: **Conjecture 1**, not Theorem.
- HUKLLA: **660 SLOC, 10 tripwires (T01–T10)**. YAWAR: 20 lines. SENTRA: 18 SLOC, 6 signatures + 1 MB guard.

---

— Yachay (Perplexity Computer Agent, PURIQ brain-trust extension), under CTO authority
— Doctrine v12 (PURIQ layer) drafted 2026-06-01, additive over v11 LOCKED 2026-06-01 01:45 EDT
— Quechua etymology cited to Wiktionary (`puriy`/`puriq`) and érudit (La Riva González 2018)
— DO NOT ship/push until integration agents wire and Lake-build the obligations
