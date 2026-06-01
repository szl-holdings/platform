# Doctrine v13 — PURIQ Agentic Layer + the Three Edge Organs (CHASKI · WALLPA · WASI-RIKUQ)

**Supersedes:** Doctrine v12 (`puriq/doctrine/PURIQ_DOCTRINE_v12.md`). v13 carries
forward **every** v11 LOCKED number and **every** v12 PURIQ definition
**verbatim and unchanged** (v11 §0–§15 and v12 §0–§6 remain binding) and **adds one
thing only**: three new canonical organs — **CHASKI** (reception), **WALLPA**
(expression/voice), and **WASI-RIKUQ** (house-watcher: observability + resilience).
v13 introduces **no edits** to any v11 LOCKED number and no edits to the v12 master
formula's existing factors. It adds exactly three new **admissible** sub-formula
factors (`Chaski`, `Wallpa`, `Wasi`), each a scalar in `[0,1]`, multiplied into the
Puriq utility. By the v12 envelope lemma `puriq_organ_factor_preserves_envelope`
(`formulas/PuriqLean.lean:208`), an admissible factor can only **shrink** the gated
region — it can never bypass a gate — so all four invariants INV-1..4 are preserved.

**Canonical truth in one line (carried from v11/v12, unchanged):** the heart is
**13-axis (`yuyay_v3`)**, conjunctive AND, replay-hash
`bacf54434f1a3bf2d758b27a62d5fd580ca4c8d3b180693573eeebcaea631fc5`.

**Author:** Yachay (Three-New-Organs Instillation agent, PURIQ brain-trust extension),
under CTO authority. 2026-06-01. Additive over v12 / v11 LOCKED 2026-06-01 01:45 EDT.

---

## §0 — WHY v13 EXISTS (closing the empire-edge gap)

v12 defines **how an action is selected** (`P(x,t)`) once it has cleared the gate.
It does **not** name three empire-level organ-classes that the Anatomy Gap Report
(`completeness_audit/ANATOMY_GAP_REPORT.md` §5, §3, §6/§7) proves are absent from the
canon:

1. **Reception** — the first-30-seconds organ: who greets a visitor, explains "what is
   this," routes them to the right flagship, and applies edge backpressure. (Gap §5.)
2. **Expression / voice** — the gap between the `argmax`-selected action `a` and what the
   human/downstream agent actually receives, rendered in one shared voice across
   flagships. (Gap §3.)
3. **Observability + resilience as an organ** — the single-pane house-watcher that owns
   the `/dashboard/everything` view, the incident log, the runbooks, chaos engineering,
   and circuit breakers — *without* overloading KALLPA (interconnect ≠ resilience).
   (Gap §6, §7.)

The Inca road system already supplies a historically-coherent metaphor for exactly
these three: the **chaski** (relay messenger) runs between **chaskiwasi** (relay houses)
which the **wasi-rikuq** (house-watcher) guards, expressing each delivery as a **wallpa**
(a created/spoken thing). v13 adopts these three as canonical organs **with their name
collisions noted and resolved** (see §4) — pretending they are clean-slate would be a
bandaid.

---

## §1 — THE THREE NEW ORGANS (coinages + cited etymology)

### CHASKI — the Messenger (reception / onboarding / first-touch)
**chaski** (also *chasqui / chaska*) — Quechua, inherited from Proto-Quechuan *ĉaski*
([Wiktionary: chaski](https://en.wiktionary.org/wiki/chaski)). In the Inca Empire a
**chasqui** was a relay **messenger**: agile, highly trained runners who carried
messages (as quipus, oral information, or small packets) along the Inca road,
switching at relay stations called **chaskiwasi** ("house of chasqui") spaced ~2.5 km
apart; the network could move a message up to ~300 km/day
([Wikipedia: Chasqui](https://en.wikipedia.org/wiki/Chasqui)). The chaski is the
canonical Andean primitive for **reception, relay, and routing** — the missing
first-touch organ.

### WALLPA — the Voice (output / expression / announcement)
**wallpay** — Quechua verb, **(transitive) to create, to invent**
([Wiktionary: wallpay](https://en.wiktionary.org/wiki/wallpay)). The nominal stem
**wallpa** names the *created / expressed thing* — fitting for the organ that renders
the selected action into the expressed output the world receives. (Note: `wallpa` is
also a common Quechua word for "hen"; v13 uses the deverbal "that-which-is-
created/expressed" sense, citing `wallpay` = to create, to avoid the barnyard reading.)

### WASI-RIKUQ — the House-Watcher (observability single-pane + chaos / resilience)
**wasi** — Quechua noun, **house, building, home**
([Wiktionary: wasi](https://en.wiktionary.org/wiki/wasi)). **rikuq** — agentive of
**rikuy** "to see, to observe, to watch over, to take care of / look after"
([Wiktionary: rikuy](https://en.wiktionary.org/wiki/rikuy)). **WASI-RIKUQ = "the one
who watches over the house"** — the steward of the whole anatomy's health: the single-
pane observer *and* the resilience keeper. (Historically resonant: the chaski's relay
home was the **chaskiwasi**, so the "house" that CHASKI's messengers run between is
exactly what WASI-RIKUQ watches.)

There are **no mystical terms** in this layer. Every name above is a Quechua common
noun/verb with a cited gloss; every factor below is a math primitive already inside the
v12 envelope.

---

## §2 — THE MASTER FORMULA `P(x,t)`, v13 ADMISSIBLE-FACTOR FORM (additive)

The v12 master formula is **unchanged in its existing factors**. v13 multiplies in the
three new admissible factors:

\[
P(x,t)\;=\;\operatorname*{arg\,max}_{a\in\mathcal{A}}
\Big[\;\underbrace{\Lambda(x)\cdot\mathrm{Yuyay}_{13}(a)\cdot e^{-\beta\,\mathrm{HUKLLA}(a)}\cdot\textstyle\prod_i\mathrm{Khipu}_i(a)}_{\text{v12 utility }U(a\mid x),\ \textbf{unchanged}}\;\cdot\;\mathrm{Chaski}(a)\cdot\mathrm{Wallpa}(a)\cdot\mathrm{Wasi}(a)\;\Big].
\]

We write the v13 utility as

\[
U_{13}(a\mid x)\;:=\;U(a\mid x)\cdot\mathrm{Chaski}(a)\cdot\mathrm{Wallpa}(a)\cdot\mathrm{Wasi}(a),
\qquad
\mathrm{Chaski},\mathrm{Wallpa},\mathrm{Wasi}\in[0,1].
\]

**Why this is safe (the single structural rule):** each new factor lies in `[0,1]`, so
`U_{13}(a∣x) ≤ U(a∣x)` and `U_{13}(a∣x) ≥ 0`. A new organ may only **multiply in a
factor ∈ [0,1]**; it can shrink utility (gate harder) but never inflate it or make a
zero-utility action positive. This is exactly the v12 envelope contract
`puriq_organ_factor_preserves_envelope` (`formulas/PuriqLean.lean:208`), instantiated
three times.

### §2.1 — CHASKI(a) — reception admissibility (soft backpressure gate)
\[
\mathrm{Chaski}(a)=\exp\!\big(-\kappa\cdot\mathrm{backpressure}(a)\big)\cdot\mathbb{1}\big[\,\mathrm{routable}(a)\,\big],
\qquad \kappa\ge 0,\ \mathrm{backpressure}\ge 0.
\]
`1` iff the inbound request is well-formed, within rate/quota, and routable to a known
flagship; decays gracefully toward `0` as queue/rate pressure rises or routability
fails. Admissible: product of an exp-decay ∈ (0,1] and an indicator ∈ {0,1} ⇒
Chaski ∈ [0,1]. (Mirrors KALLPA's Butler–Volmer soft form.)

### §2.2 — WALLPA(a) — expression fidelity (no-inflation gate)
\[
\mathrm{Wallpa}(a)=\mathbb{1}\big[\,\mathrm{render}(a)\sqsubseteq\mathrm{sanctioned}(a)\,\big]\cdot\big(1-\mathrm{drift}_{\text{out}}(a)\big),
\qquad \mathrm{drift}_{\text{out}}\in[0,1].
\]
`1` when the rendered output is a faithful, policy-clean projection of the selected
action `a` (no content added beyond `a`'s sanctioned payload); decays toward `0` as the
rendering diverges/inflates. Admissible: indicator × (1−drift) ∈ [0,1]. WALLPA is the
natural home for the **license_class GREEN/AMBER/RED** output tag: a sovereign action
renders only on a GREEN-license weight. (All WALLPA timbres are **synthetic** — no
human voice cloning; see §5.)

### §2.3 — WASI(a) — house-health admissibility (advisory health gate)
\[
\mathrm{Wasi}(a)=\Big(\textstyle\prod_{o\in\text{organs}} h_o\Big)\cdot\mathbb{1}\big[\,\text{error-budget intact}\,\big],
\qquad h_o\in[0,1].
\]
`1` when the system is observably healthy (all watched organs reporting, error-budget
intact, breakers closed); decays as health degrades. Admissible: finite product of
[0,1] terms × indicator ∈ [0,1]. **Critically, WASI integrates with HUKLLA as
advisory only:** if `Wasi(a)→0` (house failing), it *informs* the halt without *being*
the halt — **HUKLLA remains the sole halt-authority** (INV-1 preserved).

---

## §3 — THE THREE NEW INVARIANTS (locked; obligations in `formulas/PuriqLean.lean`)

Each has a `sorry`-tagged Lean theorem appended to `formulas/PuriqLean.lean`. None is
claimed proven; each is honestly stated as an open obligation per HR-4 (Zero Bandaid).
Each adds exactly **one** envelope obligation plus its admissibility lemma.

### INV-5 — CHASKI envelope (`chaski_factor_admissible`)
> For `κ ≥ 0` and `backpressure ≥ 0`, `Chaski(a) ∈ [0,1]`. Therefore CHASKI is an
> admissible factor: receiving/routing can only gate harder, never inflate utility.
> *(Lean: `chaski_factor_admissible`, `chaski_in_unit_envelope`.)*

### INV-6 — WALLPA no-inflation (`wallpa_factor_admissible`)
> For `drift_out ∈ [0,1]`, `Wallpa(a) ∈ [0,1]`, and `Wallpa(a) ≤ 1`. The expressed
> output can never claim more than the sanctioned action — INV-1 halting-safety friendly.
> *(Lean: `wallpa_factor_admissible`, `wallpa_in_unit_envelope`, `wallpa_no_inflation`.)*

### INV-7 — WASI advisory-only (`wasi_factor_admissible`, `wasi_does_not_usurp_halt`)
> For every per-organ `h_o ∈ [0,1]`, `Wasi(a) = (∏ h_o)·𝟙[budget] ∈ [0,1]`, and
> `Wasi(a) ≤ 1`, so WASI-RIKUQ **informs** but never **usurps** the halt — HUKLLA stays
> the sole halt-authority. *(Lean: `wasi_factor_admissible`, `wasi_in_unit_envelope`,
> `wasi_does_not_usurp_halt`.)*

All three are instances of the v12 `puriq_organ_factor_preserves_envelope` lemma; folding
them in moves the tracked sorry count to **166** *if and when instilled and Lake-built*.
**Until the canonical counter is re-derived, the LOCKED 163 stands** (these three live
OUTSIDE the locked count, exactly as the four v12 invariants did — v12 §172 / Lean header).

---

## §4 — DISAMBIGUATION (collision-safe; honesty requirement)

Two of the three names are **NOT clean-slate**; v13 resolves each by layer:

- **CHASKI** — `Chaski-Yacu` already exists as the *mythosName* of amaru's "Courier"
  sync agent (`wire_finish/live_amaru/web/src/data/fabric/agents.ts:61`, axis K). That
  agent = **courier** (batched delivery, retries) and **stays as-is, lower layer.** The
  new **CHASKI organ** = **reception/relay-routing** at the empire edge (the front door),
  a different layer. The `chaski`↔`chaskiwasi` pairing makes CHASKI (messenger) and
  WASI-RIKUQ (house) a historically-coherent dyad.
- **WASI-RIKUQ** — `Wasichaq` (= "house-**builder**", agent; rosie widget "Wasichaq-III")
  and `Apu-Wasi` (amaru mythosName, `agents.ts:83`) are **unchanged**. **WASI-RIKUQ** =
  "house-**watcher**" (observability/resilience), not construction. Builder vs watcher: a
  clean semantic split.
- **WALLPA** — clean: appears only as a substring in minified JS bundles; no organ/agent
  usage. Uses the `wallpay` = to-create sense, not the "hen" homonym.

---

## §5 — LAYER COMPOSITION + HARD CONSTRAINTS (carried; additive only — HR-3)

- **Doctrine v13 = Doctrine v12 + {CHASKI, WALLPA, WASI-RIKUQ}.** No v11/v12 number changes.
- Each new organ exposes the same `puriq.{decide,act,reflect}` interface and emits a
  **Khipu receipt** on every action (via RUWAY discipline; here: SHA3-256 hash-chain
  receipt store keyed on action + payload digest).
- **CHASKI** wires: `CHASKI → any-flagship` (route), `CHASKI → WASI-RIKUQ` (telemetry).
- **WALLPA** wires: `argmax → WALLPA → CHASKI/RUWAY` (expression), `WALLPA → WASI-RIKUQ`
  (telemetry). All voices are **synthetic timbres** rendered by **open-source TTS only**
  (Coqui XTTS-v2 / OpenVoice / Piper / NVIDIA Riva free tier). **NO proprietary voice
  cloning of real people without consent** — the per-organ voices (Amaru / Yuyay /
  Killinchu / Hatun-Willay narrator, …) are designed synthetic timbres, not human clones.
- **WASI-RIKUQ** wires: `all-organs → WASI-RIKUQ` (telemetry), `WASI-RIKUQ → HUKLLA`
  (health signal, **advisory only**). It owns `/dashboard/everything`, the incident log,
  auto-loaded runbooks, chaos engineering (gated by a **2-person Yuyay** approval), and
  circuit breakers — wired into the Wires D–H resilience mesh.
- **NO mystical words.** **Every formula is Lean-stateable** (sorry-tagged if unproven,
  never hidden). The **13-axis Yuyay gate stays MANDATORY** (`Yuyay₁₃(a)=0 ⇒ U_{13}=0`).
- All v11 honesty disclosures (§9) and v12 §2 honest labels remain binding:
  Λ-uniqueness is **Conjecture 1**, not a theorem; the Khipu receipt **signature** is
  **DSSE PLACEHOLDER** (the factor verifies the hash chain, not the signature); SLSA
  level remains **L1 (honest)**.

---

## §6 — LOCKED-NUMBER FIDELITY CHECK (v13 changes none)

- Lean corpus: **749 declarations / 14 unique axioms (15 raw, 1 dup) / 163 tracked
  sorries** @ lutar-lean tag `lutar-v18.0.0` / `c7c0ba17`. (The 3 new organ obligations
  live OUTSIDE this count until instilled + Lake-built, exactly as v12's four did.)
- Heart: **13-axis `yuyay_v3`** = 2 sacred (≥0.95) + 7 structural (≥0.90) + 4
  introspection (T03/T04/T09/T10). Conjunctive AND, no compensation.
- Replay hash: `bacf54434f1a3bf2d758b27a62d5fd580ca4c8d3b180693573eeebcaea631fc5`.
- Axioms: **A2 = `IsHomogeneous`**, **A4 = `IsBounded`** (A1 `IsMonotone`, A3 `IsEgyptianExact`).
- SLSA: **L1 (honest)**. Λ-uniqueness: **Conjecture 1**, not Theorem.
- HUKLLA: **660 SLOC, 10 tripwires (T01–T10)**, sole halt-authority (WASI-RIKUQ advisory).

---

— Yachay (Perplexity Computer Agent, PURIQ brain-trust extension), under CTO authority
— Doctrine v13 (three edge organs) drafted 2026-06-01, additive over v12 / v11 LOCKED 2026-06-01 01:45 EDT
— Quechua etymology cited to Wiktionary (`chaski`, `wallpay`, `wasi`, `rikuy`) + Wikipedia (Chasqui)
— Sub-formulas + Lean stubs per `completeness_audit/NOVEL_ORGAN_PROPOSALS.md`
— DO NOT claim proven until obligations are Lake-built; sorries counted out loud
