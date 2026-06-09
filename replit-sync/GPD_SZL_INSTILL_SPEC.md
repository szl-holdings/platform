# Governed Post-Determinism (GPD) — SZL original framework · instill spec (2026-06-08)

**Status:** SZL's OWN framework. NO external citation. Grounded solely in SZL's prior DOI-stamped
work. Do not reference any third-party paper anywhere (knowledge, UI, anatomy, docs, comments).

## Foundation — SZL prior art (the ONLY citations we use)
All by Stephen P. Lutar, ORCID 0009-0001-0110-4173, SZL Holdings:
- **The Loop Is the Product v1** — Zenodo 19867281 (2026-04-28) — bounded recursion as a system primitive
- **The Loop Is the Product v2 (Empirical)** — Zenodo 19934129 (2026-04-30)
- **Lineage-Aware RAG / Prisca-GraphRAG v5** — Zenodo 20020846 (2026-05-04) — belief-lineage / epistemic replication
- **Sealed Constitutional Guardrails v6** — Zenodo 20020845 (2026-05-04) — governed gate / protocol boundary
- **The Lutar Omega Formalism v4** — Zenodo 20020841 (2026-05-04)
- **SZL Doctrine v2 — 9 Canonical Axes (Λ DOI)** — Zenodo 20174600 (2026-05-14) — admissibility axes

## The core idea (SZL's own, one sentence)
> Classical systems demand every correct node produce the SAME bytes. Autonomous AI agents produce
> DIFFERENT reasoning paths that are still correct — so the unit of agreement must shift from
> "identical output" to **certified semantic admissibility**, and SZL is the stack that *proves* that
> certification with a signed, Lean-anchored receipt.

Admissibility (SZL formulation): a participant proposes an action-reasoning pair `(a, r)`; it is
**admissible** under state `s`, intent `i`, context `C`, policy `P`, epistemic state `E` iff our
Λ-gate + YUYAY conjunctive check certifies it. Classical deterministic systems are the zero-ambiguity
special case (exactly one admissible `(a,r)`). SZL operates in the post-deterministic regime
(multiple semantically-admissible pairs) and CERTIFIES membership rather than demanding identical bytes.

## The 5 SZL GPD pillars (all ours, all grounded in our prior art + proven stack)
| GPD pillar (SZL) | SZL component | Honest status | Prior art |
|---|---|---|---|
| **Protocol-Bounded Execution** | a11oy governed-decision loop + YUYAY 13-axis conjunctive gate (deny-by-default) | LIVE; gate sound (locked F-set) | Sealed Constitutional Guardrails (Zenodo 20020845) |
| **Verifiable Intent-to-Execution** | DSSE-signed receipt chain + Lean-theorem trace | LIVE; ECDSA-P256, hash-chained | SZL Doctrine v2 (Zenodo 20174600) |
| **Bounded-Recursion Control Plane** | Ouroboros P1–P6 loop + mission ledger (decouple reason/execute, persist intent) | LIVE; loop invariants proven | The Loop Is the Product v1/v2 (Zenodo 19867281, 19934129) |
| **Semantic Quorum Assurance** | Khipu BFT quorum + **Wave23 conditional safety theorem** | Conditional THEOREM (Wave23, axiom-clean); unconditional = Conjecture 2 | SZL Doctrine v2 |
| **Epistemic State Replication** | YAWAR append-only SHA-256 receipt bus + deterministic replay + Verifiable Semantic Rollback | LIVE for receipts/replay; full ESR semantics = SZL open R&D | Lineage-Aware RAG / Prisca-GraphRAG v5 (Zenodo 20020846) |

## The 8 GPD failure-class detectors (SZL's taxonomy, honest live/roadmap labels)
| Failure class (SZL naming OK) | SZL detector | Label |
|---|---|---|
| Semantic Drift | Λ-axis drift monitor (conformal band over time) | live/roadmap |
| Correlated Reasoning Failure | model-router diversity check (flag shared model family) | roadmap |
| Intent Loss | Ouroboros intent-anchor diff (declared vs cumulative) | roadmap |
| Evidence Fabrication | receipt provenance verify (reasoning trace hash-matches telemetry) | live |
| Unsafe Delegation | delegation receipt must carry policy+intent forward (gate fails if missing) | roadmap |
| Policy-Violating Autonomy | YUYAY conjunctive gate (local-pass but composition-violates → DENY) | live |
| Epistemic Divergence | quorum disagreement on retrieved evidence → no certification | live (via quorum) |
| Context Amnesia | rollback/replay must retain failure-cause evidence (lineage-retention) | roadmap |

## Where to instill
- a11oy: new "Governed Post-Determinism" tab (5-pillar map → live tab links + proof) + `frameworks`
  entry in knowledge.json with `foundation: [SZL Zenodo DOIs]`. NO external citation.
- killinchu: __KB__ frameworks entry; u_consensus notes "Semantic Quorum Assurance = our Khipu quorum,
  Wave23 conditional safety"; u_about notes the GPD framing.
- anatomy: KERNEL.gpd note — the 5 organs ARE the participant-general model.
- platform: docs/GOVERNED_POST_DETERMINISM.md — SZL-authored, foundation = our Zenodo prior art only.

## Guardrails
- NO reference to any external paper anywhere. Foundation citations = SZL Zenodo DOIs only.
- locked-proven=EXACTLY 5; Λ=Conjecture 1; SQA safety=Wave23 CONDITIONAL (Conjecture 2 unconditional);
  full ESR=OPEN (roadmap). No fabricated data; roadmap detectors labeled roadmap; no codenames; trust
  never 100%; GitHub↔HF byte-identical.
