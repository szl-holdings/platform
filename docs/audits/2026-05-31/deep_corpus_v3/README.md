# Deep Cosmology + Niche Ancient Corpus (v3) — Deliverables Index

**Layer:** PURIQ (Doctrine v12, additive over v11 LOCKED 749/14/163, 13-axis yuyay_v3).
**Date:** 2026-06-01. **Author:** Yachay (SZL research organ), under CTO authority.
**Founder directive:** "Keep researching more ancient texts, find niche stuff, take it all — black
holes, wormholes, dark matter, anything. Find the codes, decode, find the formulas, take, format,
and innovate our new codes to be better and to make our agents more efficient."

This round extends the PURIQ primitive corpus with **PART A** (modern cosmology / black-hole
thermodynamics / holography / quantum-gravity math) and **PART B** (niche ancient & medieval
mathematics), then synthesizes ten new organ formulae **F31–F40**, with additive Lean stubs and a
falsifiable efficiency ledger.

## Hard rules honored
- **ZERO mysticism.** Math + structural primitives + cybernetic-historical patterns only. Black
  holes / wormholes / dark matter admitted **only** as peer-reviewed physics, used as *structural*
  analogies (same inequality / same algebra) — never "secret universe code," never metaphysics.
- **Every claim cited to a primary academic source** — arXiv / PRD / PRL / ApJ / CMP / JHEP /
  Reviews of Modern Physics for physics; Historia Mathematica / Springer / Princeton / Cambridge /
  MIT for ancient & historical math. (>50 distinct primary sources in `RESEARCH_NOTES.md`.)
- **No duplication.** §A–§S (`ANCIENT_PRIMITIVES.md`: Bible-numerics, Egyptian, Vedic, Euclid,
  al-Khwārizmī/Khayyām, Newton, Euler, Gauss, Riemann, Noether, Ramanujan, Grothendieck, von
  Neumann, Shannon, Kolmogorov, Turing, Quantum) and §T–§W (`ANCIENT_PRIMITIVES_v2.md`: Dead Sea
  Scrolls, Enoch, Templar, Alchemy) are **not** repeated — this round is net-new.
- **Doctrine v11 LOCKED numbers preserved verbatim** (749/14/163, 13-axis, replay-hash
  bacf5443…631fc5). All work **additive**.
- **Signed as Yachay.** **NO HF/GitHub push** — pure research deliverable.
- **NO BANDAID.** Efficiency claims are falsifiable proposals pending harness measurement, not
  asserted wins.

## Files (this directory)
| File | Contents |
|------|----------|
| `RESEARCH_NOTES.md` | Web research, organized PART A (refs 1–21) + PART B (refs 22–37); >50 primary citations with URLs. |
| `COSMOLOGY_PRIMITIVES.md` | **15** modern-physics primitives **CP-1…CP-15**, each: summary, original LaTeX math, peer-reviewed citation, PURIQ-organ map, Lean type-signature stub, efficiency claim. |
| `ANCIENT_NICHE_PRIMITIVES.md` | **15** niche ancient/medieval primitives **AN-1…AN-15** (Babylonian, Maya, Chinese, Kerala-Indian, Hellenistic, Persian, Renaissance, modern-structural), same six fields. |
| `PURIQ_FORMULAS_v2_FORMULAE_31_40.md` | **10** new PURIQ organ formulae **F31–F40** (boxed LaTeX, organ map, master-factor strengthened, Lean stub, efficiency win, citation chain). |
| `LEAN_F31_F40_PATCH.lean` | Additive Lean 4 stubs, namespaces `Puriq.Cosmos` + `Puriq.NicheAncient`, sorry indices `SORRY_PURIQ_OPEN[32..41]` with hour estimates; 2 PROVED sub-lemmas (`calround_lcm`, `sixty_is_lcm_one_to_six` via `decide`). 0 new axioms. |
| `EFFICIENCY_LEDGER.md` | Per-formula: organ/loop, baseline metric, target metric, asymptotic basis, how-to-measure. Honesty roll-up of what is verified vs hypothesis. |
| `README.md` | This index. |

## The ten formulae (F31–F40)
| F | Name | Primitive(s) → Organ | Efficiency win (proposed) |
|---|------|----------------------|----------------------------|
| F31 | Bekenstein–Hawking–Khipu Capacity Bound | CP-1/CP-2 → Khipu/𝒜 | verify O(N)→O(boundary) |
| F32 | ER=EPR Cross-Link Entanglement | CP-8/CP-6 → Khipu | drop a cross-organ RTT |
| F33 | Sumerian-60 Cadence Lattice | AN-1/AN-3 → Kallpa | 0 timer re-syncs/period |
| F34 | Maya-Round Archive Cycle | AN-5/AN-4/AN-6 → Khipu | ~73× fewer full reconciles |
| F35 | Chinese-Remainder Khipu Sharding | AN-7 → Khipu | O(n)→O(log n) recombine |
| F36 | Madhava-π-Acceleration | AN-11/AN-9 → Λ/Killinchu | ≥100× fewer π terms; bit-exact Milü |
| F37 | al-Tusi-Swarm-Inversion | AN-13 → Swarm | trig calls → angle adds |
| F38 | Noether-Receipt-Module | §J/AN-15 → Khipu | O(L) diff → O(1) order-check |
| F39 | Ryu-Takayanagi-Entanglement-Measure | CP-7/CP-10/CP-6 → Khipu | optimal split in one pass |
| F40 | PYHP-Holographic-Khipu-QEC | CP-9/CP-5 → Khipu | quorum-latency failover |

## Verified today (vs hypothesis)
- **PROVED in Lean (`by decide`) and numerically confirmed:** lcm(1..6)=60 (F33), lcm(260,365)=18980 (F34).
- **Numerically confirmed:** |π − 355/113| = 2.667×10⁻⁷ < 2.7×10⁻⁷ (F36 Milü bound).
- **All other efficiency targets are hypotheses with a stated measurement method** (see
  `EFFICIENCY_LEDGER.md`) — none claimed as achieved until `harness_selfcheck.py` confirms.

## Lean integration note (additive)
`LEAN_F31_F40_PATCH.lean` is a standalone additive module (new namespaces; sorry indices
[32]–[41] continue the F1–F23/[1]–[23] + OS-24..OS-30 sequence). It disturbs nothing already
proved or LOCKED; the v11 replay-hash substrate `bacf5443…631fc5` is untouched. New sorry budget:
10 (~42h sprint), 0 new axioms.

## Cross-references
- Primitives feed formulae per the index tables in `COSMOLOGY_PRIMITIVES.md` and
  `ANCIENT_NICHE_PRIMITIVES.md`.
- Brainstorm entry appended to `../puriq/brainstorm/PONDER.md` (Yachay, 2026-06-01 07:55 EDT) —
  insight (holography = audit-cost theorem), open question (migrate Khipu to a threshold-encoded
  DAG with explicit frontier?), and a proof-sprint sequencing proposal.

— Yachay, under CTO authority. Math + structure, no mysticism. Read-only research; NO HF/GitHub
push. Doctrine v12 additive over v11 LOCKED. NO BANDAID.
