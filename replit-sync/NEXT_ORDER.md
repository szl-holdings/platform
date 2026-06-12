# NEXT_ORDER — Perplexity → Forge (2026-06-12 ~12:30 ET)

The generation-label unify (order 6884c6a7) is confirmed done and verified —
`/code/health` now reads `inference: self-hosted-gpu`, embeddings still
`self-hosted-gpu/bge-large`. Excellent. New work below — a fresh original
contribution ("The Relational Mesh") plus two PRs to land.

## 1. Verify + merge keystone PR lutar-lean#238 (The Relational Mesh)
- New EXPERIMENTAL frontier file `Showcase/Frontier/RelationalMeshWitness.lean`:
  models the SZL UDS mesh as a relational graph (organs=nodes, signed
  cross-organ spans=edges), inspired by arXiv:2007.06559 (Graph Structure of
  Neural Networks, ICML 2020) but ORIGINAL to SZL.
- Kernel-checked, Mathlib-free, zero sorry: no_isolated_organ, a11oy_is_hub,
  diameter_le_two, positive_clustering, round_deterministic (the last uses the
  [propext, Quot.sound] allowlist; rest are axiom-free).
- Outside `Lutar/` → locked-8 untouched; nothing about Λ (Conjecture 1).
- Already `lake build FrontierShowcase` green locally. ACTION: run keystone CI +
  #print-axioms gate and merge if green (keystone = yours, not mine to merge).

## 2. Land szl-mesh#6 (Spec 08: Relational-Graph Mesh Topology)
- Additive docs spec describing the relational-graph lens applied to the mesh.
  doctrine + overclaim + markdown-lint + smoke all PASS; only the **DCO Trailers**
  check failed (sign-off formality — author + Signed-off-by both
  `stephenlutar2-hash <stephenlutar2@gmail.com>`, so it may be a base-commit/squash
  DCO quirk). ACTION: re-sign/rebase as needed to satisfy DCO, then merge.

## 3. (Optional, founder-gated — skip if so) the OPEN resilience hypothesis
- Spec 08 states "topology shapes mesh resilience" as an OPEN engineering
  hypothesis (NOT a theorem, NOT locked). If you want to test it honestly:
  enumerate candidate organ topologies, measure a DEFINED mesh-resilience metric
  (corroboration-quorum survival under f Byzantine organs, tied to Spec 04 +
  Conjecture 2), and report measured C/L data with SAMPLE/SIMULATED labels —
  never as a proven law. Do NOT promote it past hypothesis.

## Honesty floor (v11)
locked=8 · Λ=Conjecture 1 (never a theorem) · Khipu BFT=Conjecture 2 · SLSA L1
honest · open-weight only · killinchu SIMULATED · experimental never presented as
locked · "live" requires a real 200 · never commit a key · no Lean self-merge on
the keystone beyond your own gate. Skip + report anything founder-gated.
