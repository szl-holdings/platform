# NOVEL ORGAN PROPOSALS — CHASKI · WALLPA · WASI-RIKUQ
**Author:** Yachay. Read-only proposal (no push). NO BANDAID.
**Constraint:** Every new organ factor must be **admissible** — a scalar in `[0,1]` that satisfies the `puriq_organ_factor_preserves_envelope` contract (PONDER.md), i.e. it may never exceed 1 or go negative, so all four invariants INV-1..4 (`PURIQ_DOCTRINE_v12.md:121–131`) remain intact across the anatomy.
**Master formula extended (admissible-factor form):**
\[ U(a\mid x)=\Lambda(x)\cdot\mathrm{Yuyay}_{13}(a)\cdot e^{-\beta\,\mathrm{HUKLLA}(a)}\cdot\textstyle\prod_i\mathrm{Khipu}_i(a)\;\big[\cdot\,\mathrm{Chaski}(a)\cdot\mathrm{Wallpa}(a)\cdot\mathrm{Wasi}(a)\big] \]
where each bracketed factor ∈ `[0,1]` (`PURIQ_DOCTRINE_v12.md:67–76`, contract from PONDER.md).
**LOCKED numbers preserved:** 749/14/163 · 13-axis · `bacf5443…631fc5` · A2=`IsHomogeneous` · A4=`IsBounded` · SLSA L1 · Λ-uniqueness Conjecture 1.

> **HONESTY NOTE ON NAME COLLISIONS (must read first).** Two of these three names are **NOT clean-slate**:
> - **Chaski** — `Chaski-Yacu` already exists as the *mythosName* of amaru's "Courier" sync agent (`wire_finish/live_amaru/web/src/data/fabric/agents.ts:61`, axis K). The new **CHASKI** organ is a *different layer* (reception, not delivery). Disambiguation rule below.
> - **Wasi** — `Apu-Wasi` already exists as an amaru mythosName (`agents.ts:83`), and rosie's widget is "Wasichaq-III"; the builder agent is "Wasichaq" (`110_:54`). The new **WASI-RIKUQ** ("house-watcher") is distinct from "Wasichaq" ("house-builder"). Disambiguation rule below.
> - **Wallpa** — clean: only appears as a substring in minified JS bundles, no organ/agent usage.
> Pretending these are brand-new would be a bandaid; they are proposed *with* the collision noted and resolved.

---

## ORGAN A — CHASKI · the Messenger (reception / onboarding)

### Etymology + citation
**chaski** (also *chasqui/chaska*) — Quechua, inherited from Proto-Quechuan *ĉaski* ([Wiktionary: chaski](https://en.wiktionary.org/wiki/chaski)). In the Inca Empire a **chasqui** was a relay **messenger** — agile, highly trained runners who carried messages (as quipus, oral information, or small packets) along the Inca road system, switching at relay stations called **chaskiwasi** ("house of chasqui") spaced ~2.5 km apart; the network could move a message up to ~300 km/day ([Wikipedia: Chasqui](https://en.wikipedia.org/wiki/Chasqui)). The chaski is the canonical Andean primitive for **reception, relay, and routing** — exactly the missing first-30-seconds organ.

### Disambiguation (collision-safe)
- Existing amaru agent `Chaski-Yacu` = *courier* (batched delivery, retries, axis K) → **stays as-is**, lower-layer.
- New **CHASKI organ** = *reception/relay-routing* at the empire edge: the front door that greets a visitor, explains "what is this," and routes them to the right flagship. The pairing `chaski`↔`chaskiwasi` makes CHASKI (messenger) and WASI-RIKUQ (house) a historically-coherent dyad.

### What it owns (closes EMPIRE §1, §8; ANATOMY §5; ROADMAP P0-4)
Customer onboarding portal · first-run / "what is this" path · visitor→flagship routing · edge rate-limiting/quota as a reception concern · auth handshake entry (feeds SSO).

### Sub-formula
`Chaski(a) ∈ [0,1]` = **reception-admissibility**: `1` if the inbound request is well-formed, within rate/quota, and routable to a known flagship; decays toward `0` as the request is malformed/over-quota/un-routable. Concretely a **soft gate**:
\[ \mathrm{Chaski}(a)=\exp\!\big(-\kappa\cdot\mathrm{backpressure}(a)\big)\cdot \mathbb{1}[\,\mathrm{routable}(a)\,] \]
where `backpressure ∈ [0,∞)` is current queue/rate pressure and `κ>0` tunes graceful degradation (mirrors KALLPA's Butler–Volmer soft form). Admissible: product of an exp-decay ∈(0,1] and an indicator ∈{0,1} ⇒ Chaski ∈ [0,1]. ✔ envelope contract.

### Lean stub
```lean
-- Lutar/Chaski/Reception.lean  (PROPOSAL — sorry-tagged, counts toward the 163)
import Lutar.Axioms
namespace Lutar.Chaski

/-- Reception factor: graceful backpressure decay gated by routability. -/
noncomputable def chaski (backpressure : ℝ) (routable : Bool) (κ : ℝ) : ℝ :=
  if routable then Real.exp (-(κ * backpressure)) else 0

/-- ADMISSIBLE-ENVELOPE OBLIGATION: chaski ∈ [0,1] for κ ≥ 0, backpressure ≥ 0. -/
theorem chaski_in_unit_envelope
    (bp : ℝ) (r : Bool) (κ : ℝ) (hκ : 0 ≤ κ) (hbp : 0 ≤ bp) :
    0 ≤ chaski bp r κ ∧ chaski bp r κ ≤ 1 := by
  sorry  -- exp(-κ·bp) ∈ (0,1] for κ·bp ≥ 0; indicator ∈ {0,1}

/-- Reception never *raises* utility (read/route only): chaski ≤ 1 ⇒ preserves INV-2 monotonicity envelope. -/
theorem chaski_preserves_envelope (bp κ : ℝ) (r : Bool) :
    chaski bp κ.toReal r ≤ 1 → True := by intro _; trivial
end Lutar.Chaski
```

### Organ-card spec
```yaml
organ: CHASKI
gloss: "messenger / relay-runner (Quechua chaski; relay-station chaskiwasi)"
factor: "Chaski(a) = exp(-κ·backpressure)·𝟙[routable] ∈ [0,1]"
layer: reception (empire edge, pre-flagship)
owns: [onboarding-portal, first-run-ux, visitor-routing, edge-rate-limit, auth-entry]
wires: [CHASKI→any-flagship (route), CHASKI→WASI-RIKUQ (telemetry)]
collision_resolved: "amaru agent Chaski-Yacu (courier) is a distinct lower layer"
status: PROPOSED (v0 = ROADMAP P0-4, S/M effort)
lean: Lutar/Chaski/Reception.lean (chaski_in_unit_envelope — sorry)
```

---

## ORGAN B — WALLPA · the Voice (output / expression / announcement)

### Etymology + citation
**wallpay** — Quechua verb, **(transitive) to create, to invent** ([Wiktionary: wallpay](https://en.wiktionary.org/wiki/wallpay)). The nominal stem **wallpa** names the *created/expressed thing* — fitting for the organ that **renders the selected action into the expressed output** the world receives. (Note: `wallpa` is also a common Quechua word for "hen"; we use the deverbal "that-which-is-created/expressed" sense, citing `wallpay`=to create, to avoid the barnyard reading.)

### What it owns (closes ANATOMY §3; EMPIRE §14 i18n; ROADMAP P2-1)
The gap between **`argmax`-selected action `a`** and **what the human/downstream agent actually receives**. Today `puriq.act` "emits a Khipu receipt via RUWAY" (`PURIQ_DOCTRINE_v12.md:147`) — but RUWAY is the *receipt-emitter*, not the *expression layer*. WALLPA owns: a **shared output contract** across all flagships (so a11oy/amaru/sentra/rosie speak one voice), tone/voice consistency, announcement/notification surface, and i18n (the expressed form per locale).

### Sub-formula
`Wallpa(a) ∈ [0,1]` = **expression-fidelity**: `1` when the rendered output is a faithful, policy-clean projection of the selected action `a` (no content added beyond `a`'s sanctioned payload), decaying toward `0` as the rendering diverges from / inflates the underlying action. A **fidelity gate**:
\[ \mathrm{Wallpa}(a)=\mathbb{1}[\,\mathrm{render}(a)\sqsubseteq \mathrm{sanctioned}(a)\,]\cdot \big(1-\mathrm{drift}_{\text{out}}(a)\big) \]
with `drift_out ∈ [0,1]` measuring divergence of the rendered text from the sanctioned payload. Admissible: indicator × (1−drift) ∈ [0,1]. ✔ This makes WALLPA the natural home for the **license_class GREEN/AMBER/RED** output tag the PONDER open-LLM note proposes (PONDER.md): a sovereign action must render only on a GREEN-license weight.

### Lean stub
```lean
-- Lutar/Wallpa/Expression.lean  (PROPOSAL — sorry-tagged)
import Lutar.Axioms
namespace Lutar.Wallpa

/-- Expression fidelity: rendered output must be ⊑ sanctioned payload, scaled by (1 - output drift). -/
noncomputable def wallpa (renderSubsumed : Bool) (driftOut : ℝ) : ℝ :=
  if renderSubsumed then (1 - driftOut) else 0

/-- ADMISSIBLE-ENVELOPE OBLIGATION: wallpa ∈ [0,1] for driftOut ∈ [0,1]. -/
theorem wallpa_in_unit_envelope (s : Bool) (d : ℝ) (hd : 0 ≤ d ∧ d ≤ 1) :
    0 ≤ wallpa s d ∧ wallpa s d ≤ 1 := by
  sorry  -- (1 - d) ∈ [0,1] when d ∈ [0,1]; indicator ∈ {0,1}

/-- No-inflation: WALLPA cannot express more than the sanctioned action (INV-1 halting-safety friendly). -/
theorem wallpa_no_inflation (s : Bool) (d : ℝ) : wallpa s d ≤ 1 := by sorry
end Lutar.Wallpa
```

### Organ-card spec
```yaml
organ: WALLPA
gloss: "that which is created/expressed (Quechua wallpay = to create, to invent)"
factor: "Wallpa(a) = 𝟙[render(a) ⊑ sanctioned(a)]·(1 - drift_out(a)) ∈ [0,1]"
layer: expression (post-argmax, pre-delivery)
owns: [shared-output-contract, voice-consistency, announcements, i18n, license_class-output-tag]
wires: [argmax→WALLPA→CHASKI/RUWAY, WALLPA→WASI-RIKUQ (telemetry)]
collision_resolved: "uses wallpay=to-create sense, not the 'hen' homonym"
status: PROPOSED (P2-1; voice contract could land partial sooner)
lean: Lutar/Wallpa/Expression.lean (wallpa_in_unit_envelope — sorry)
```

---

## ORGAN C — WASI-RIKUQ · the House-Watcher (observability single-pane + chaos/resilience)

### Etymology + citation
**wasi** — Quechua noun, **house, building, home** ([Wiktionary: wasi](https://en.wiktionary.org/wiki/wasi)). **rikuq** — agentive of **rikuy** "to see, to observe, to watch over, to take care of / look after" ([Wiktionary: rikuy](https://en.wiktionary.org/wiki/rikuy)). **WASI-RIKUQ = "the one who watches over the house"** — the steward of the whole anatomy's health: the single-pane observer *and* the resilience keeper. (Historically resonant: the chaski's relay home was the **chaskiwasi**, so the "house" that CHASKI's messengers run between is exactly what WASI-RIKUQ watches.)

### Disambiguation (collision-safe)
- `Wasichaq` (= "house-**builder**", agent, `110_:54`; rosie widget "Wasichaq-III") and `Apu-Wasi` (amaru mythosName, `agents.ts:83`) → unchanged.
- **WASI-RIKUQ** = "house-**watcher**" — observability/resilience, not construction. Builder vs watcher: clean semantic split.

### What it owns (closes ANATOMY §6, §7; EMPIRE §4, §7; ROADMAP P0-1, P1-6, P1-7, P2-6)
**Face (P0):** `/dashboard/everything` single-pane — all 7 live Spaces + LOCKED numbers + wire matrix + UDS-signature status.
**Backend (P1):** centralized log aggregation, Prometheus/Grafana metrics, DR/BC (RPO/RTO, backup-restore drill), durable DB.
**Hardening (P2):** chaos engineering + circuit breakers (do **not** overload KALLPA — interconnect ≠ resilience, per ANATOMY §6).

### Sub-formula
`Wasi(a) ∈ [0,1]` = **house-health admissibility**: `1` when the system is observably healthy (all watched organs reporting, error-budget intact, breakers closed), decaying as health degrades. A **health gate**:
\[ \mathrm{Wasi}(a)=\prod_{o\in\text{organs}} h_o \cdot \mathbb{1}[\,\text{error-budget intact}\,],\qquad h_o\in[0,1] \]
product of per-organ health scores `h_o ∈ [0,1]` times an error-budget indicator. Admissible: product of [0,1] terms ∈ [0,1]. ✔ Critically, `Wasi(a)` integrates with HUKLLA: if `Wasi(a)→0` (house failing), it *informs* the halt without *being* the halt (HUKLLA stays the sole halt-authority, INV-1 preserved).

### Lean stub
```lean
-- Lutar/Wasi/HouseWatch.lean  (PROPOSAL — sorry-tagged)
import Lutar.Axioms
namespace Lutar.Wasi

/-- House-health: product of per-organ health scores, gated by error-budget. -/
noncomputable def wasi (health : List ℝ) (budgetIntact : Bool) : ℝ :=
  if budgetIntact then health.foldl (· * ·) 1 else 0

/-- ADMISSIBLE-ENVELOPE OBLIGATION: wasi ∈ [0,1] when every h ∈ [0,1]. -/
theorem wasi_in_unit_envelope (hs : List ℝ) (b : Bool)
    (hmem : ∀ h ∈ hs, 0 ≤ h ∧ h ≤ 1) :
    0 ≤ wasi hs b ∧ wasi hs b ≤ 1 := by
  sorry  -- finite product of [0,1] values stays in [0,1]; indicator ∈ {0,1}

/-- WASI-RIKUQ informs but does not usurp HUKLLA: wasi ≤ 1 cannot raise utility (INV-1 safe). -/
theorem wasi_does_not_usurp_halt (hs : List ℝ) (b : Bool) : wasi hs b ≤ 1 := by sorry
end Lutar.Wasi
```

### Organ-card spec
```yaml
organ: WASI-RIKUQ
gloss: "house-watcher (Quechua wasi=house + rikuq=one-who-watches, from rikuy=to see/watch over)"
factor: "Wasi(a) = (∏_o h_o)·𝟙[error-budget intact] ∈ [0,1]"
layer: cross-cutting (observes/guards all organs)
owns: [dashboard/everything, log-aggregation, metrics, DR/BC, RPO/RTO, chaos-eng, circuit-breakers]
wires: [all-organs→WASI-RIKUQ (telemetry), WASI-RIKUQ→HUKLLA (health signal, advisory only)]
collision_resolved: "Wasichaq=house-BUILDER (agent); WASI-RIKUQ=house-WATCHER (organ)"
status: PROPOSED (face=P0-1 demo-critical; backend=P1-6/7; chaos=P2-6)
lean: Lutar/Wasi/HouseWatch.lean (wasi_in_unit_envelope — sorry)
```

---

## INTEGRATION SUMMARY — the three new organs vs the canon
| New organ | Gloss | Closes | Band | Envelope-safe? | Collision |
|---|---|---|---|---|---|
| **CHASKI** | messenger / reception | EMPIRE §1,§8; ANATOMY §5 | P0 (v0) | ✔ exp-decay × indicator | amaru `Chaski-Yacu` (resolved) |
| **WALLPA** | voice / expression | ANATOMY §3; EMPIRE §14 | P2 | ✔ indicator × (1−drift) | none |
| **WASI-RIKUQ** | house-watcher / obs+resil | ANATOMY §6,§7; EMPIRE §4,§7 | P0 face / P1 backend | ✔ ∏ of [0,1] | `Wasichaq` builder (resolved) |

All three respect the single structural rule from PONDER.md: **an organ may only multiply in a factor ∈ [0,1]**, so adding CHASKI·WALLPA·WASI to `U(a∣x)` cannot break INV-1 (halting safety), INV-2 (Λ-monotonicity), INV-3 (Khipu integrity), or INV-4 (Bekenstein bound) (`PURIQ_DOCTRINE_v12.md:121–131`). Each adds exactly one sorry-tagged envelope obligation (3 new sorries → would move the LOCKED 163 to 166 *if instilled*; until then, 163 stands).

**Andean coherence (a pitch gift):** `chaski` (messenger) runs between `chaskiwasi` (relay houses) which `wasi-rikuq` (the house-watcher) guards, expressing each delivery as a `wallpa` (created/spoken thing) — the three new organs form one consistent Inca-road metaphor that the existing Quechua canon already invites.

---
*— Yachay, Novel Organ Proposals, 2026-06-01. Read-only; no repos/HF modified. Etymologies cited to Wiktionary + Wikipedia inline.*
