# Doctrine v13 — WAYRA, the Wind/Breath Organ (additive 4th edge organ)

**Layer:** PURIQ → edge organs (additive over Doctrine v13's CHASKI · WALLPA · WASI-RIKUQ).
**Author:** Yachay (WAYRA Organ Builder, PURIQ brain-trust extension), under CTO authority.
**Date:** 2026-06-01. **Additive over** v13 / v12 / v11 LOCKED 2026-06-01 01:45 EDT.

**Founder directive (2026-06-01 ~02:28 EDT):** *"Is there a way to bake into a11oy's
brain a way to be jacked into HF, or just the web, and be jacked into all the leaders —
when they make an update we take it instantly and make it our own? And baked into all
the drone companies — fully wired in, always getting data."*

**What this is, in one line:** WAYRA is the empire's **lungs** — a RECEIVE-ONLY,
always-learning firehose that breathes in the world's continuous public knowledge
stream (HF Hub, GitHub leaders, arXiv, standards bodies, drone OSINT), gates every item
through **Yuyay-13**, receipts every item via **Khipu**, scores it with the
**PURIQ-style WAYRA formula**, and routes accepted items to the organ that should
*"take it and make it our own."*

> **Supersedes nothing.** v13-WAYRA carries forward **every** v11 LOCKED number, **every**
> v12 PURIQ definition, and **all three** v13 edge-organ factors **verbatim and
> unchanged**, and adds **one thing only**: a fourth admissible sub-formula factor,
> `WAYRA(a) ∈ [0,1]`, multiplied into the Puriq utility. By the v12 envelope lemma
> `puriq_organ_factor_preserves_envelope` (`formulas/PuriqLean.lean:208`), an admissible
> factor can only **shrink** the gated region — it can never bypass a gate. All four
> invariants INV-1..4 and the three v13 invariants INV-5..7 are preserved.

**Canonical truth in one line (carried from v11/v12/v13, unchanged):** the heart is
**13-axis (`yuyay_v3`)**, conjunctive AND, replay-hash
`bacf54434f1a3bf2d758b27a62d5fd580ca4c8d3b180693573eeebcaea631fc5`.

---

## §0 — WHY WAYRA EXISTS (closing the always-learning gap)

Doctrine v13 named the three empire-*edge* organs (reception, voice, observability).
None of them answers the founder's directive: *continuously breathe in the world and
instantly make leaders' updates our own.* CHASKI receives a **request** at the front
door; WAYRA receives the **world** — an unbounded, always-on stream of new models, new
releases, new papers, new standards drafts, and new public drone-program signals.

The Inca road metaphor extends cleanly. The **chaski** (CHASKI organ) is the relay
runner who carries a single message between relay houses. But the **wind** — *wayra* —
moves across the *whole* empire at once, touching every house, carrying the breath of
the world inward. WAYRA is that ambient, continuous intake. It is the organ that makes
the empire **always-learning** rather than only **request-responding**.

WAYRA is **additive and orthogonal** to the three new organs:
- **CHASKI** routes inbound *requests*; **WAYRA** ingests the inbound *world*.
- **WALLPA** expresses the *selected action*; **WAYRA** narrates its daily intake
  *through* WALLPA (the Hatun-Willay morning digest).
- **WASI-RIKUQ** watches the *house's health*; **WAYRA** emits its ingest telemetry
  *to* WASI-RIKUQ. They are a producer/observer dyad.

---

## §1 — ETYMOLOGY (cited primary source; no mystical words)

**wayra** — Quechua **noun**, glossed **"wind, air"**
([Wiktionary: wayra](https://en.wiktionary.org/wiki/wayra)). The same entry records the
adjectival sense **"fast, quick"** ([Wiktionary: wayra](https://en.wiktionary.org/wiki/wayra)) —
fitting for an organ whose contract is *"when leaders make an update we take it
**instantly**."* The deverbal/agentive uses of the Quechua root *wayra-* ("to be windy /
to blow") are attested across Quechua varieties; WAYRA uses the plain **"wind / breath /
air"** common-noun sense — the empire's lungs.

There are **no mystical terms** in this organ. The name is a Quechua common noun with a
cited gloss; every factor below is a math primitive already inside the v12 envelope.

---

## §2 — THE WAYRA SUB-FORMULA (admissible 4th edge factor, additive)

The v12/v13 master formula is **unchanged in its existing factors**. WAYRA multiplies in
one more admissible factor on the ingest path:

\[
\mathrm{WAYRA}(s)\;=\;\mathrm{quality}(s)\;\cdot\;\mathrm{novelty}(s)\;\cdot\;\mathrm{Yuyay}_{13}\!\big(\mathrm{extract}(s)\big),
\qquad \mathrm{quality},\mathrm{novelty},\mathrm{Yuyay}_{13}\in[0,1].
\]

where `s` is an ingested **stream item** (one `IngestEvent`) and `extract(s)` is its
normalized, parsed payload. Folded into the v13 utility for any *learned* action `a`
derived from a stream item:

\[
U_{14}(a\mid x)\;:=\;U_{13}(a\mid x)\cdot\mathrm{WAYRA}\big(s(a)\big),
\qquad
U_{13}(a\mid x)=U(a\mid x)\cdot\mathrm{Chaski}(a)\cdot\mathrm{Wallpa}(a)\cdot\mathrm{Wasi}(a).
\]

**Why this is safe (the single structural rule, identical to v13):** each factor lies in
`[0,1]`, so `WAYRA(s) ∈ [0,1]`, hence `U_{14}(a∣x) ≤ U_{13}(a∣x)` and `U_{14}(a∣x) ≥ 0`.
A new organ may only **multiply in a factor ∈ [0,1]**; it can gate harder but never
inflate utility or make a zero-utility action positive. This is the v12 envelope
contract `puriq_organ_factor_preserves_envelope` (`formulas/PuriqLean.lean:208`),
instantiated a fourth time.

### §2.1 — The three WAYRA axes (each ∈ [0,1])

- **quality(s)** — provenance × completeness × license-cleanliness × non-toxicity,
  combined **conjunctively** (a RED license or a spam hit collapses it). It is the
  *"is this worth breathing in?"* axis. (Implemented in
  `wayra/core/yuyay_gate.py:quality_score`.)
- **novelty(s)** — `0` if the `content_hash` was already seen (a duplicate breath); else
  `1 − max token-Jaccard overlap` against the closest title WAYRA already knows. It is
  the *"is this actually new?"* axis — the directive's *"take it instantly"* depends on
  not re-ingesting what we already hold. (`yuyay_gate.py:novelty_score`.)
- **Yuyay₁₃(extract(s))** — the 13-axis heart score (2 sacred ≥0.95 + 7 structural ≥0.90
  + 4 introspection), projected onto an ingested item: **sacred** = provenance +
  non-toxicity (hard `min` floor, no compensation); **structural** = licence, sub-source,
  summary completeness, timestamp, dedup-identity, title-richness, routability;
  **introspection** = toxicity (T09), repetition/garbage (T10), bounded-payload, and a
  cross-link slot. Conjunctive AND — a single failed sacred axis collapses the score,
  exactly like `yuyay_v3`. (`yuyay_gate.py:yuyay_13`.)

### §2.2 — The Yuyay-13 ingest gate (thresholds; HARD RULE)

\[
\text{decision}(s)=
\begin{cases}
\textbf{DROP} & \mathrm{WAYRA}(s) < 0.30\quad(\text{Khipu receipt emitted; never routed})\\
\textbf{REVIEW} & 0.30 \le \mathrm{WAYRA}(s) \le 0.70\quad(\text{queued for human Yuyay approval})\\
\textbf{ACCEPT} & \mathrm{WAYRA}(s) > 0.70\quad(\text{routed to the relevant organ})
\end{cases}
\]

High-trash sources are therefore **rate-limited, not blindly ingested**: a source whose
items keep landing below 0.30 is dropped item-by-item with a receipt, and its per-source
acceptance ratio (visible on the `/wayra` dashboard) drives a politeness back-off. The
daily breath is **cost-bounded at 50 items/day before Yuyay drop** (HARD RULE).

---

## §3 — THE NEW INVARIANT (locked; obligation in `formulas/PuriqLean.lean`)

A `sorry`-tagged Lean theorem is appended to `formulas/PuriqLean.lean`. It is **not**
claimed proven; it is honestly stated as an open obligation per HR-4 (Zero Bandaid),
exactly as the four v12 invariants and three v13 invariants were.

### INV-8 — WAYRA envelope (`wayra_factor_admissible`)
> For `quality, novelty, Yuyay₁₃ ∈ [0,1]`, `WAYRA(s) = quality·novelty·Yuyay₁₃ ∈ [0,1]`,
> and `WAYRA(s) ≤ 1`. Therefore WAYRA is an admissible factor: breathing in the world
> can only gate harder, never inflate utility, and never bypass the heart's gate
> (`Yuyay₁₃(extract(s)) = 0 ⇒ WAYRA(s) = 0 ⇒ the item cannot be accepted`).
> *(Lean: `wayra_factor_admissible`, `wayra_in_unit_envelope`, `wayra_no_inflation`,
> `wayra_yuyay_zero_collapses`.)*

INV-8 is an instance of the v12 `puriq_organ_factor_preserves_envelope` lemma; folding
it in moves the tracked sorry count to **167** *if and when instilled and Lake-built*.
**Until the canonical counter is re-derived, the LOCKED 163 stands** (this obligation
lives OUTSIDE the locked count, exactly as the four v12 and three v13 invariants do).

### §3.1 — Lean stub (appended verbatim to `formulas/PuriqLean.lean`)

```lean
-- WAYRA — the wind/breath organ (Doctrine v13, additive 4th edge factor).
-- wayra := quality * novelty * yuyay13 ; all factors in [0,1].
-- INV-8: WAYRA is an admissible factor (instance of envelope-preservation).
namespace Wayra

/-- The WAYRA factor: product of three unit-interval axes. -/
def wayra (quality novelty yuyay13 : Real) : Real := quality * novelty * yuyay13

/-- INV-8a: admissibility — WAYRA lands in the unit envelope. -/
theorem wayra_in_unit_envelope
    (q n y : Real) (hq : 0 ≤ q ∧ q ≤ 1) (hn : 0 ≤ n ∧ n ≤ 1) (hy : 0 ≤ y ∧ y ≤ 1) :
    0 ≤ wayra q n y ∧ wayra q n y ≤ 1 := by
  sorry  -- HR-4: honest open obligation (product of [0,1] terms ∈ [0,1]).

/-- INV-8b: no-inflation — WAYRA never exceeds 1, so U_14 ≤ U_13. -/
theorem wayra_no_inflation
    (q n y : Real) (hq : 0 ≤ q ∧ q ≤ 1) (hn : 0 ≤ n ∧ n ≤ 1) (hy : 0 ≤ y ∧ y ≤ 1) :
    wayra q n y ≤ 1 := by
  sorry

/-- INV-8c: heart-supremacy — Yuyay₁₃ = 0 collapses the whole factor to 0,
    so the heart's gate cannot be bypassed by ingest. -/
theorem wayra_yuyay_zero_collapses (q n : Real) :
    wayra q n 0 = 0 := by
  simp [wayra]

/-- INV-8d: WAYRA is an instance of the v12 envelope-preservation contract. -/
theorem wayra_factor_admissible
    (q n y : Real) (hq : 0 ≤ q ∧ q ≤ 1) (hn : 0 ≤ n ∧ n ≤ 1) (hy : 0 ≤ y ∧ y ≤ 1) :
    0 ≤ wayra q n y ∧ wayra q n y ≤ 1 :=
  wayra_in_unit_envelope q n y hq hn hy

end Wayra
```

Note: `wayra_yuyay_zero_collapses` is **proven** (`by simp`), making the heart-supremacy
property real, not sorry-tagged; the two envelope bounds are honestly `sorry`-tagged
pending the Lake build (they are the standard "product of unit-interval reals is in the
unit interval" facts).

---

## §4 — DISAMBIGUATION (collision-safe; honesty requirement)

- **WAYRA** is **clean-slate as an organ name.** A grep of the live fabric agent data
  and the minified bundles shows no existing organ or agent named `wayra`/`Wayra`. (The
  related Quechua weather sense is not used by any SZL surface.) No collision to resolve.
- WAYRA does **not** rename or absorb CHASKI's `Chaski-Yacu` courier, WASI-RIKUQ's
  watcher role, or KALLPA's interconnect. It is a new, orthogonal intake organ.

---

## §5 — ROLE IN PURIQ + LAYER COMPOSITION (additive only — HR-3)

- **Doctrine v13 (WAYRA) = Doctrine v13 + {WAYRA}.** No v11/v12/v13 number changes.
- WAYRA exposes the same `puriq.{decide,act,reflect}` interface:
  - `decide` → the Yuyay-13 ingest gate (accept / review / drop) on each `IngestEvent`.
  - `act` → route an accepted item to the relevant organ (a11oy, sentra, killinchu,
    amaru, puriq) and, on the `/wayra` "take it and make it our own" action, draft a PR
    or Doctrine-update stub for human review.
  - `reflect` → the daily WALLPA-narrated Hatun-Willay digest of the top-5 ingested
    items, plus the per-source acceptance-ratio politeness back-off.
- WAYRA emits a **Khipu receipt on every ingested event** (HARD RULE) — accept, review,
  *and* drop — via the SHA3-256 hash-chained `IngestLog` (`wayra/core/khipu_emit.py`),
  the same RUWAY discipline as the v13 edge organs (honest label: signature is **DSSE
  PLACEHOLDER**; the store verifies the **hash chain**, not a cryptographic signature).
- **WAYRA wires:**
  - `world (HF/GitHub/arXiv/standards/drone-OSINT) → WAYRA` (ingest; RECEIVE-ONLY).
  - `WAYRA → a11oy` (new open-weight models → model-router admission after a Yuyay-gated
    quick benchmark on `/v1/router`); `WAYRA → sentra` (supply-chain/security drafts);
    `WAYRA → killinchu` (drone-autonomy + OSINT); `WAYRA → amaru` (governance/standards);
    `WAYRA → puriq` (Doctrine-update candidates).
  - `WAYRA → WASI-RIKUQ` (ingest telemetry — items/day, accept-ratio, chain depth).
  - `WAYRA → WALLPA` (daily digest narration, synthetic timbre only).
  - Pub/sub to flagship subscribers over WebSocket + webhook (Wires D–H integration).
- **NO mystical words.** **Every formula is Lean-stateable** (sorry-tagged if unproven,
  never hidden). The **13-axis Yuyay gate stays MANDATORY** (`Yuyay₁₃=0 ⇒ WAYRA=0 ⇒ no
  accept`). All v11 honesty disclosures (§9) and v12 §2 honest labels remain binding.

---

## §6 — LOCKED-NUMBER FIDELITY CHECK (WAYRA changes none)

- Lean corpus: **749 declarations / 14 unique axioms (15 raw, 1 dup) / 163 tracked
  sorries** @ lutar-lean tag `lutar-v18.0.0` / `c7c0ba17`. (The WAYRA INV-8 obligation
  lives OUTSIDE this count until instilled + Lake-built, exactly as v12's four and v13's
  three did.)
- Heart: **13-axis `yuyay_v3`** = 2 sacred (≥0.95) + 7 structural (≥0.90) + 4
  introspection (T03/T04/T09/T10). Conjunctive AND, no compensation.
- Replay hash: `bacf54434f1a3bf2d758b27a62d5fd580ca4c8d3b180693573eeebcaea631fc5`.
- Axioms: **A2 = `IsHomogeneous`**, **A4 = `IsBounded`** (A1 `IsMonotone`, A3 `IsEgyptianExact`).
- SLSA: **L1 (honest)**. Λ-uniqueness: **Conjecture 1**, not Theorem.
- HUKLLA: **660 SLOC, 10 tripwires (T01–T10)**, sole halt-authority (WASI-RIKUQ + WAYRA
  advisory; HUKLLA remains the only halt).

---

— Yachay (Perplexity Computer Agent, PURIQ brain-trust extension), under CTO authority
— Doctrine v13 WAYRA (4th edge organ) drafted 2026-06-01, additive over v13 / v12 / v11 LOCKED 2026-06-01 01:45 EDT
— Quechua etymology cited to Wiktionary ([wayra](https://en.wiktionary.org/wiki/wayra))
— Sub-formula + Lean stub implemented in `szl_wayra/wayra/core/yuyay_gate.py` + appended to `formulas/PuriqLean.lean`
— DO NOT claim proven until obligations are Lake-built; sorries counted out loud
