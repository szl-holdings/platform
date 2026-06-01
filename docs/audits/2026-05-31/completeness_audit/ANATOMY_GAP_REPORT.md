# ANATOMY GAP REPORT — "Is the anatomy fully complete?"
**Founder directive (2026-06-01 ~02:12 EDT):** *"Zoom out. Am I missing anything for anatomy to be fully complete?"*
**Auditor:** Yachay (Anatomy + Flagship Completeness Gap-Hunter subagent)
**Mode:** Read-only. No HF/GitHub push. Brutal honesty. NO BANDAID.
**Authority:** Doctrine v12 (`puriq/doctrine/PURIQ_DOCTRINE_v12.md`), carrying v11 LOCKED numbers.
**Prior art (EXTENDED, not duplicated):** `110_ANATOMY_COMPLETENESS_AUDIT.md` (v9, 9-of-12 verdict).

> **LOCKED NUMBERS (preserved verbatim, Doctrine v12 §172–§179):** 749 declarations / 14 unique axioms (15 raw, 1 dup) / 163 tracked sorries · 13-axis `yuyay_v3` (2 sacred ≥0.95 + 7 structural ≥0.90 + 4 introspection) · replay-hash anchor `bacf54434f1a3bf2d758b27a62d5fd580ca4c8d3b180693573eeebcaea631fc5` · A2 = `IsHomogeneous` · A4 = `IsBounded` · SLSA L1 · Λ-uniqueness Conjecture 1.
> Source: `puriq/doctrine/PURIQ_DOCTRINE_v12.md:172,174,179` and `:84` (A2/A4), `:85` (13-axis + replay hash).

---

## 0. WHAT CHANGED SINCE 110 (delta the founder must internalise)

The v9 audit (`110_ANATOMY_COMPLETENESS_AUDIT.md:38–42`) scored **9 of 12** organs substrate-ready and used the v9 number set **456/14/6**. Doctrine has since advanced to **v12 with LOCKED 749/14/163** (`PURIQ_DOCTRINE_v12.md:172`). The 163-sorry honest count *replaces* the 6-sorry v9 figure — this is a **good** change (honesty), but it means every "fully verified" claim in flagship UIs that still reads "6 sorries" or "zero sorry" is now a stale over-claim (see FLAGSHIP_GAP_REPORT §over-claims). The master formula is now canonically:

\[ P(x,t)=\arg\max_{a\in\mathcal{A}}\big[\Lambda(x)\cdot \mathrm{Yuyay}_{13}(a)\cdot e^{-\beta\,\mathrm{HUKLLA}(a)}\cdot \textstyle\prod_i \mathrm{Khipu}_i(a)\big] \]
(`PURIQ_DOCTRINE_v12.md:67–76`). Four invariants INV-1..4 (`:121–131`) remain sorry-backed in `puriq/formulas/PuriqLean.lean`.

**Bottom line up front:** The anatomy is **NOT** fully complete. By organ count it is closer than v9 (live HF Spaces now prove 7 organs run real workloads), but the *empire-level connective tissue* — reception, expressed output, observability single-pane, resilience, and a real (not rhetorical) brand organ — is **missing or partial**. Of the 12 canonical organs: **7 substrate-ready, 4 partial, 1 missing (UNAY)**, and **3 entire organ-classes are absent from the canon** (reception, output/voice, observability-as-organ). Details below.

---

## 1. PER-ORGAN STATUS (the 12 canonical organs, Doctrine v12)

Verdict key: **READY** = substrate-quality + live evidence · **PARTIAL** = real code, gap in ship/test/provenance · **MISSING** = named in canon, no code.

| # | Organ (EN / Quechua) | Sub-formula factor | Status | Primary evidence | Gap (brutal) |
|---|---|---|---|---|---|
| 1 | **Cortex — AMARU** | `R(a)=e^{-γ·KL}` drift | **READY** | Live `https://szlholdings-amaru.hf.space` 47/47 routes, brainz 749/14/163; SPA SHA `19b047b2`, Wire G fix `e5000a8a` (`420_AMARU_VERBATIM_REPLIT_REBUILD.md`) | Drift factor `R(a)` is doctrine'd but the live brainz card asserts the LOCKED numbers as a *static string*, not a recomputed `#print axioms` artifact. No live KL-drift telemetry feeding `R(a)`. |
| 2 | **Heart/memory — YUYAY** | 13-axis conjunctive gate | **PARTIAL** | 13-axis `yuyay_v3`, replay hash `bacf5443…631fc5` (`PURIQ_DOCTRINE_v12.md:85`); chakra-4 gate (`110_:25`) | **Gate, not a store.** No short-term/working-memory persistence primitive, no memory-store replay test. v9 SEV-2 (#4, `110_:74`) still open. Cross-session continuity is implied by the receipt chain, not a named module. |
| 3 | **Blood/ledger — YAWAR** | `C(a)` chain-link | **READY** | SHA-256 linked `receipts.py` + DSSE-PAE (`110_:27`); a11oy `/v1/ledger` route live HEAD `a93ca1bf` | Signature is **DSSE PLACEHOLDER** — `Khipu_i(a)` verifies the **hash chain, not the signature**, until Sigstore lands (`PURIQ_DOCTRINE_v12.md:101–102`). Cardano anchoring is local hash-chain only, no real tx (`240_INFRA_SOUNDNESS_ZOOMOUT.md`). |
| 4 | **Immune/halt — HUKLLA** | `e^{-β·HUKLLA}`, Egyptian doubling | **READY** | 10 tripwires T01–T10, 660 SLOC (`PURIQ_DOCTRINE_v12.md:179`); `hukulla_large_beta_zeroes` sorry-obligation in `puriq/formulas/PuriqLean.lean` (PONDER.md) | The halt is *soft-then-hard* (only the exp factor carries tunable β). Live Spaces do not expose a deadman/halt endpoint a buyer can trip on demand. No chaos-test that actually fires a tripwire in production. |
| 5 | **Wires/interconnect — KALLPA** | `B(a)` Butler–Volmer | **PARTIAL** | Wire B live, Wire C receiver in flight (`110_:29,73`); Wire G fixed in amaru `e5000a8a` | **Wire D not implemented** (a11oy policy wire). 3 of 7 anatomy-3d wires still dashed (D,G,H) at SHA `8c30023f` (`411_3D_ANATOMY_V2_PLUS_ROSIE_3D.md`). No cross-organ end-to-end test proving bidirectional interconnect. |
| 6 | **DAG/Merkle — KHIPU** | Merkle / sum-indicator | **READY** | `rosie/src/khipu-receipt.ts` 3-tier summation-invariant DAG + TH11 test (`110_:30`); `khipuReceipt_checksum_invariant` (`100_WARHACKER_DU_DEEP_DIVE.md`) | Sigstore envelopes self-disclosed **PLACEHOLDER, 0 real** (`240_`). The Merkle sum is verified; the *attestation* over it is not signed in CI. |
| 7 | **Skeleton — LAMBDA SPINE** | `Λ` weighted geo-mean | **PARTIAL** | `Λ=∏xᵢ^{wᵢ}, Σwᵢ=1`, D2 canonical, A2=`IsHomogeneous`, A4=`IsBounded` (`PURIQ_DOCTRINE_v12.md:84`) | **Λ-uniqueness is Conjecture 1, not a theorem** (LOCKED). `Uniqueness.lean:120` sorry + `lutar_is_geomean` sorry persist (`110_:31,75`). Of 163 sorries, the load-bearing one is here. |
| 8 | **Nervous — OTel-VSP** | `O(a)` trace-continuity | **PARTIAL** | `vsp-otel/runtime/src/exporter.ts` + pipeline/redaction/SLA tests (`110_:32`) | **Ships NOWHERE visible** + **NO Zenodo deposit** (`110_:70,175`). Code substrate-quality but un-instilled into any live Space. No live tracing in any HF Space (`240_`). FE OTel MISSING. |
| 9 | **Sacred-axis/claim-calibration — KANCHAY** | `K(a)` claim-calibration | **PARTIAL (re-classified)** | a11oy ships as **Brand Orchestration Layer** front (`240_`); v9 flagged "no organ code" (`110_:33,114`) | See §4 below — Kanchay is **NOT** a complete brand organ. No logo SVG / color-token file / typography spec / brand bible found as a versioned artifact. The a11oy SPA is the de-facto front, not a named brand-orchestration module with tests. |
| 10 | **Doctrine — HATUN** | `D(a)` additivity | **READY** | 46 `_gate.ts` policy modules + Hatun-Doctrine spec: **10 artifact kinds, 11 JSON schemas** (`240_`); `doctrine_cross_invariant` PROVEN (`110_:34`) | Mythos→Hatun-Willay rename **PARTIAL** — ~360 tokens remain (`240_`). 11 schemas exist but no public schema-registry endpoint a buyer can validate against. |
| 11 | **Honest-proof — SUMAQ** | `S(a)` honest-proof | **READY** | design-system tokens + 8 sha256-pinned anatomy figures, deterministic builders (`110_:35`) | This is a **design/proof subsystem, not a runtime organ** — correctly so. But "Sumaq" (honest-proof) and "Sumaq Rikuq" (designer, `110_:59`) are conflated. Needs a one-line canon disambiguation. |
| 12 | **Geofence-bridge — KILLINCHU** | `G(a)` geofence | **MISSING-LIVE** | Architecture spec only: `killinchu/architecture/KILLINCHU_FULL_STACK_ARCHITECTURE.md`; GitHub repo created (org now 23 repos) | **NOT DEPLOYED — 503/RED.** The 12th organ exists as a spec + empty repo. PONDER open question: should `G(a)` be hard `{0,1}` or soft `exp(-β·dist)` barrier (PONDER.md). Until killinchu ships, the embodied/drone lane (its Warhacker wedge) has no live artifact. |

### Scorecard (EXTENDS 110_:38–42)
- **READY (7):** Amaru, Yawar, Hukulla, Khipu, Hatun, Sumaq, + (live-proven) the Lambda *gate runs* even though its uniqueness is conjectural.
- **PARTIAL (4):** Yuyay (gate≠store), Kallpa (Wire D missing, 3 dashed wires), OTel-VSP (ships nowhere, no DOI), Kanchay (not a real brand organ).
- **MISSING (1 canonical):** UNAY — and **MISSING-LIVE (1):** Killinchu (spec only).

---

## 2. UNAY — cross-session memory (RECOMMEND FORMAL STATUS)

**Finding:** v9 flagged UNAY as "no module on remote, 0 named hits" (`110_:26,113`). It is **still** not a named runtime module. However, **rosie ships an "Unay" tab** (live `https://szlholdings-rosie.hf.space`, 11 tabs, SHA `304b9e08`, `93_OPUS_ROSIE_FULL_SHIP.md`) — so the *name* is now load-bearing in a live UI with no backing store. **This is the single worst honesty gap in the anatomy:** a customer can click "Unay" and there is no cross-session memory primitive behind it.

**RECOMMENDED FORMAL STATUS:** Promote UNAY to a **real, minimal organ** rather than dropping it (dropping now contradicts the live rosie tab — that would be a bandaid). Concrete:
- Build a **receipt-keyed continuity store**: `unay.recall(session_id) → last_n Khipu receipts`, keyed on the YAWAR chain. This makes UNAY *derive* from YAWAR/KHIPU (no new trust surface) and gives the rosie tab a real backing.
- Sub-formula: `Memory factor M(a) = 1` (admissible, ∈[0,1], satisfies the `puriq_organ_factor_preserves_envelope` contract from PONDER.md) — a **read-only** organ that never zeroes utility, only *informs* the context vector `x`.
- One Lean stub: `unay_recall_is_subset_of_chain` (recalled set ⊆ verified chain). One replay test.
- **Severity: P1** (rosie tab is live and empty → customer-facing over-claim).

---

## 3. WALLPA / YAPAY — output / expression / voice organ (DOES IT EXIST? SHOULD IT?)

**Finding:** **No output/expression organ exists.** Grep across the audit tree for `wallpa` / `yapay` returns **zero organ usages** — `yapay` and `wallpa` appear only as substrings inside minified JS bundles and the banned-tokens corpus (`banned_tokens_raw.txt:148` is "Chaski", not wallpa). The anatomy has organs for *deciding* (Yuyay), *halting* (Hukulla), *recording* (Khipu/Yawar), *scoring* (Lambda) — but **no canonical organ for the expressed act**: the rendered answer, the announcement, the voice the customer actually hears. Today "output" is implicit in each flagship's SPA, with no shared contract.

**SHOULD IT EXIST? YES.** The master formula's `argmax` selects an action `a`; `puriq.act` "performs `P(x,t)`'s argmax selection and emits a Khipu receipt via RUWAY" (`PURIQ_DOCTRINE_v12.md:147`). But **RUWAY is the receipt-emitter, not the expression layer.** There is a real gap between "selected action" and "what the human/agent downstream receives." This is the **WALLPA** organ (Quechua `wallpay` = *to create, invent*, [Wiktionary](https://en.wiktionary.org/wiki/wallpay)). Full proposal in `NOVEL_ORGAN_PROPOSALS.md`. **Severity: P2** (not blocking Warhacker; matters for a unified product voice at Series-A).

---

## 4. KANCHAY — is the brand organ actually complete? (NO.)

**Finding:** v9 scored Kanchay "NO — rhetoric, no dedicated code" (`110_:33`); it has since been **re-classified** as a11oy = "Brand Orchestration Layer" (`240_`). **This re-classification is a label, not an organ.** Brutal check of what a *complete* brand organ requires vs what exists:

| Brand-completeness artifact | Status | Evidence |
|---|---|---|
| Versioned **logo SVG** (primary + monochrome + favicon) | **MISSING** as a canonical artifact — no `logo.svg` brand-pinned file found | grep/glob across audit tree |
| **Color token file** (design tokens, dark/light) | **PARTIAL** — `amaru/web/src/_stubs/design-system/tokens.css` exists but is a *stub* under one flagship, not a shared brand source (`110_:35`) |
| **Typography spec** (type scale, font licensing) | **MISSING** as a documented spec |
| **Brand bible / identity guidelines** doc | **MISSING** — no brand bible found; `szl-brand` repo holds *anatomy figures*, not a brand identity system (`110_:160`) |
| **Brand-orchestration runtime module** with tests | **MISSING** — only `a11oy/web/src/data/brands.ts` (a data file), no orchestration module + test (`110_:114`) |

**Verdict: Kanchay is NOT complete.** It is a presentation surface (the a11oy SPA) wearing an organ name. **RECOMMENDED ADDITION:** Either (a) build a thin `kanchay/` brand-orchestration module (logo SVG set + `tokens.css` promoted to a shared package + typography spec + a 1-page brand bible + one snapshot test that asserts every flagship imports the shared tokens), elevating Kanchay to READY; or (b) **honestly demote** Kanchay from "organ" to "presentation surface" in the canon. Given a11oy *does* ship as the brand front live (GREEN, 40/40 routes, gates=46), option (a) is the smaller honest step. **Severity: P1** (investor decks lean on "brand orchestration"; today it is undefended).

---

## 5. RECEPTION LAYER — first-30-seconds UX (no organ → propose CHASKI)

**Finding:** There is **no reception organ** — nothing owns the first-30-seconds experience (landing, auth handshake, "what is this / what can I do here," routing a new visitor to the right flagship). Each HF Space dumps a user straight into its SPA. Empire-level, there is **no customer onboarding portal** (`240_`; cross-ref `EMPIRE_LEVEL_GAPS.md`). The Inca had a precise primitive for this: the **chaski** relay-messenger and the **chaskiwasi** ("house of chasqui") relay station ([Wikipedia: Chasqui](https://en.wikipedia.org/wiki/Chasqui)).

**HONESTY COLLISION (must flag):** `Chaski-Yacu` is **already in use** as the *mythosName* of amaru's "Courier" agent — a batched-delivery, retry-aware sync agent (`wire_finish/live_amaru/web/src/data/fabric/agents.ts:61`, axis K). So "Chaski" is **not** a clean-slate name. The proposal in `NOVEL_ORGAN_PROPOSALS.md` resolves this (organ = `CHASKI` reception; existing amaru agent stays `Chaski-Yacu` *courier* — different layer, disambiguated). **Severity: P0/P1** (reception is the literal first thing the Warhacker/Greene demo audience sees).

---

## 6. RESILIENCE ORGAN — chaos eng, circuit breakers (extend KALLPA or new?)

**Finding:** **No resilience organ.** Empire has **no chaos engineering, no circuit breakers, no backup-restore drill, no RPO/RTO** (`240_`). No secret management (no Vault/Doppler/AWS SM), no centralized log aggregation (no Loki/ELK), no live metrics (no Prometheus/Grafana) (`240_`). HUKLLA halts on tripwires but that is *safety*, not *availability* — a tripped Space today just 503s (killinchu already proves this: it is 503/RED).

**RECOMMENDATION:** Do **NOT** overload Kallpa (Kallpa is *interconnect*, Butler–Volmer wire-throughput; resilience is a different concern). Resilience belongs in the new **WASI-RIKUQ** observability/operations organ (Quechua `wasi`=house + `rikuq`=watcher, [Wiktionary](https://en.wiktionary.org/wiki/wasi), [Wiktionary](https://en.wiktionary.org/wiki/rikuy)) — the "house-watcher" that owns circuit breakers, chaos drills, and DR. See `NOVEL_ORGAN_PROPOSALS.md`. **Severity: P1** (enterprise/Series-A blocker; not a June-16 demo blocker if Spaces stay up).

---

## 7. OBSERVABILITY SINGLE-PANE — `/dashboard/everything` (MISSING)

**Finding:** There is **no single-pane observability endpoint.** OTel-VSP code exists but ships nowhere (`110_:32`, `240_`); each flagship has its own status surface; there is no `/dashboard/everything` that shows, in one view, all 7 live Spaces + organ health + replay-hash + sorry-count + wire-status. The founder cannot, today, answer "is the whole anatomy green right now?" from one URL. This is both an ops gap and a *demo* gap (a single-pane "everything is verified and live" screen is the single most investor-legible artifact SZL could ship).

**RECOMMENDATION:** Build `/dashboard/everything` as the customer-facing face of the **WASI-RIKUQ** organ: a static aggregator that polls each Space's health route + renders the LOCKED numbers + wire matrix + UDS-signature status. **Severity: P0** (highest-leverage single artifact for June 16). Detailed in `NOVEL_ORGAN_PROPOSALS.md` and `PRIORITIZED_ROADMAP.md`.

---

## 8. SUMMARY — what's missing for the anatomy to be FULLY complete

1. **UNAY** must become a real receipt-keyed store (live rosie tab is empty). — P1
2. **KILLINCHU** must actually deploy (12th organ is 503/RED, spec-only). — P1 (P0 for its Warhacker drone lane)
3. **KANCHAY** must become a real brand organ (logo SVG, shared tokens, typography, brand bible) or be honestly demoted. — P1
4. **Three organ-classes are entirely absent from the canon:** reception (**CHASKI**), output/voice (**WALLPA**), observability+resilience (**WASI-RIKUQ**). — P0/P1/P2
5. **Lambda uniqueness is a Conjecture, not a theorem** — the load-bearing sorry. Keep it honestly scoped; never call the spine "proven unique." — P1
6. **OTel-VSP** must ship *somewhere* live and get a Zenodo DOI (only organ with no deposit). — P1
7. **Signatures are PLACEHOLDER everywhere** (DSSE/Sigstore 0 real; Cardano local-only) — the receipt chain is hash-verified but not cryptographically signed in CI. — P1

The honest headline for the founder: **the anatomy has a strong proven skeleton and a real beating ledger, but it has no face (reception), no voice (output), no nervous-system dashboard (observability), no immune-to-failure layer (resilience), an empty memory tab (UNAY), and a brand organ that is a label not a build.** Completeness requires closing these — proposals and ranking follow in the sibling reports.

---
*— Yachay, Anatomy Gap Report, 2026-06-01. Read-only; no repos modified. EXTENDS 110_ANATOMY_COMPLETENESS_AUDIT.md.*
