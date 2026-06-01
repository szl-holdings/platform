# 23 — THESIS VERSION LADDER: Ouroboros Thesis v1 → v20
**Audit date:** 2026-05-31  
**ORCID:** 0009-0001-0110-4173  
**Author:** Stephen P. Lutar Jr.  
**Concept DOI (main chain from v3 onward):** [10.5281/zenodo.19944926](https://doi.org/10.5281/zenodo.19944926)  
**Current head:** v18.0 (index 37; v19 and v20 are PENDING-MINT)

---

## Version Ladder Summary

| Version | Zenodo DOI | Date | Type | Key Content | Lean Proofs State | PDF Size |
|---------|-----------|------|------|-------------|-------------------|----------|
| v1 | [10.5281/zenodo.19867281](https://doi.org/10.5281/zenodo.19867281) | 2026-04-28 | paper | Bounded recursion as system primitive; loop = audit primitive | Pre-Lean — no formal proofs | 271 KB (PDF+TXT) |
| v2 | [10.5281/zenodo.19934129](https://doi.org/10.5281/zenodo.19934129) | 2026-04-30 | paper | Empirical companion — 3 production case studies (A11oy, Sentra, Amaru) | Pre-Lean | 144 KB PDF |
| v3 | [10.5281/zenodo.19983066](https://doi.org/10.5281/zenodo.19983066) | 2026-05-02 | paper | Lutar Invariant Λ: axiomatic trust aggregator; Egyptian-fraction weight inspectability; A1–A4 axiom set | Lean skeletons, sorry-bearing | 584 KB ZIP |
| v4 | [10.5281/zenodo.20020841](https://doi.org/10.5281/zenodo.20020841) | 2026-05-04 | paper | Omega Formalism: Energy–Mass–Information coupling with EPR–Bell diagnostics | Lean skeletons | 23 KB MD |
| v5 | [10.5281/zenodo.20020846](https://doi.org/10.5281/zenodo.20020846) | 2026-05-04 | paper | Lineage-aware RAG (Prisca-GraphRAG) with sparse-autoencoder feature interpretability | Lean skeletons | 21 KB MD |
| v6 | [10.5281/zenodo.20020845](https://doi.org/10.5281/zenodo.20020845) | 2026-05-04 | paper | Sealed constitutional guardrails; Chinchilla–Lutar scaling; dynamical bifurcation detection | Lean skeletons | 22 KB MD |
| v7 | [10.5281/zenodo.20020848](https://doi.org/10.5281/zenodo.20020848) | 2026-05-04 | paper | Tiered continual learning; Hopfield associative retrieval; conformal memory bounds | Lean skeletons | 24 KB MD |
| v8 | [10.5281/zenodo.20020849](https://doi.org/10.5281/zenodo.20020849) | 2026-05-04 | paper | Active inference under free-energy minimization; hierarchical predictive coding; cognitive-map navigation | Lean skeletons | 29 KB MD |
| v9 | [10.5281/zenodo.20053148](https://doi.org/10.5281/zenodo.20053148) | 2026-05-06 | paper | Unified operational account of Λ family; Bianchi-closed fiber bundle formulation | Lean skeletons in ZIP | 1,065 KB ZIP |
| v10 | [10.5281/zenodo.20053163](https://doi.org/10.5281/zenodo.20053163) | 2026-05-06 | paper | Audit-closure operator Λ₁₀; formalizing the implementation contract | Lean skeletons (TH8 sorry=9 in GLR) | 1,065 KB ZIP |
| v11-a | [10.5281/zenodo.20119582](https://doi.org/10.5281/zenodo.20119582) | 2026-05-11 | paper | Applied Λ: measured per-request latency overhead (p50=11.5 µs, 62,764 ops/sec) | TH8 sorry-count claimed 0 | 1,568 KB ZIP |
| v11-b | [10.5281/zenodo.20173905](https://doi.org/10.5281/zenodo.20173905) | 2026-05-14 | paper | Re-upload of v11 (file contains v12 zip — mislabeled) | v12 content in v11 shell | 4,088 KB ZIP |
| v12 | [10.5281/zenodo.20173920](https://doi.org/10.5281/zenodo.20173920) | 2026-05-14 | technote | Λ-Ouroboros Substrate — four machine-verified mechanisms; sorry-count roadmap; Doctrine v2 | 1 outstanding sorry on A3 weight uniqueness | 16 KB MD |
| v13-MD | [10.5281/zenodo.20173912](https://doi.org/10.5281/zenodo.20173912) | 2026-05-14 | technote | Make-It-Real Audit; Doctrine v2; Λ-Invariant Stack (Markdown) | 2 open sorry; XXXXX DOI placeholder | 117 KB MD |
| v13-PDF | [10.5281/zenodo.20195368](https://doi.org/10.5281/zenodo.20195368) | 2026-05-14 | technote | v13 canonical PDF; most-downloaded (49 unique DL) | 2 open sorry; XXXXX placeholder in body | 2,620 KB PDF |
| v14 | [10.5281/zenodo.20424992](https://doi.org/10.5281/zenodo.20424992) | 2026-05-28 | paper | Verifiable multi-agent anatomy; Lutar Calculus; TH10 downgraded Theorem→Conjecture 1; TH6 Bekenstein→DPI relabel; KS-18 corrected | sorry-count = 0 claimed (overstatement); TH10 is Lean axiom not proof | 107 KB PDF |
| v15 | [10.5281/zenodo.20424995](https://doi.org/10.5281/zenodo.20424995) | 2026-05-28 | paper | Knot calculus for governed decision receipts; R1/R2/R3 audit-Reidemeister conjecture; PAC-Bayes governance head; Khipu-DAG receipt structure | TH11 sorry-free; TH12 3 sorry; TH13 open | 86 KB PDF |
| v16 | [10.5281/zenodo.20424996](https://doi.org/10.5281/zenodo.20424996) | 2026-05-28 | paper | Feynman path-integral audit closure; Gates doctrine codes; cross-component composite invariant | Inherited v14 state | 142 KB PDF |
| v17 | [10.5281/zenodo.20431181](https://doi.org/10.5281/zenodo.20431181) | 2026-05-28 | paper | Wheelerian audit closure ("It from Bit" information-theoretic frame); Shannon doctrine code; QEC-evolved agent body (Hamming, Shor, CSS, Kitaev) | Lean QEC modules added | 69 KB PDF |
| v18.0 | [10.5281/zenodo.20434276](https://doi.org/10.5281/zenodo.20434276) | 2026-05-28 | technote | Multi-track substrate expansion (CURRENT MASTER on Zenodo) | 749 decls / 14 unique axioms / 163 sorries at deposit time | 90 KB PDF ⚠️ body = v17 |
| v19 | PENDING-v19 | 2026-05-31 | paper | Mid-step consolidation: K10v2 honest discharge; Wire B/C live; σ-algebra retraction; TH10 → Conjecture 1 explicit | 749 decls / 14 unique axioms / **168** sorries (K10v2 added 5 Path-B) | PENDING |
| v20 | PENDING-v20 | 2026-05-31 | paper | CULMINATION: full standalone arXiv paper; 16 sections; absorbs v14–v19; ~7500 words | 749 decls / 14 unique axioms / 168 sorries (unchanged) | PENDING |

---

## Detailed Version Notes

---

### v1 — 2026-04-28 — "The Loop Is the Product"
**DOI:** [10.5281/zenodo.19867281](https://doi.org/10.5281/zenodo.19867281)  
**Concept DOI:** 10.5281/zenodo.19867280 (standalone — NOT in main chain)  
**What changed:** First publication. Introduces the core claim: bounded recursion as an auditable system primitive. The loop as the fundamental product metaphor. Two files: PDF + metadata TXT.  
**Lean status:** No Lean proofs. Pre-formal.  
**Stats:** 567 version views (highest single-version; tied with runtime record)  
**Chain position:** Standalone — not in the main 19944926 chain

---

### v2 — 2026-04-30 — Empirical Companion
**DOI:** [10.5281/zenodo.19934129](https://doi.org/10.5281/zenodo.19934129)  
**Concept DOI:** 10.5281/zenodo.19934128 (standalone)  
**What changed:** Three production case studies — A11oy (CFO-briefing workflow), Sentra (admission control), Amaru (data sync). Introduces `redactedFields: []` trace methodology. Filename: `ouroboros-thesis-v2-empirical (1).pdf` (stray space in filename noted as a minor anomaly).  
**Lean status:** No Lean proofs.  
**Stats:** 511 version views, 46 unique downloads  
**Chain position:** Standalone

---

### v3 — 2026-05-02 — The Lutar Invariant
**DOI:** [10.5281/zenodo.19983066](https://doi.org/10.5281/zenodo.19983066)  
**Concept DOI:** **10.5281/zenodo.19944926** ← ENTERS MAIN CHAIN HERE  
**Predecessor (retracted):** 10.5281/zenodo.19951520 (v3-1.0.0, intentionally retracted)  
**What changed:** Formal introduction of the Lutar Invariant Λ with axiomatic foundations (A1-monotone, A2-zero-pinning, A3-Egyptian-exact, A4-page-curve concavity). Egyptian-fraction (unit-fraction) weight inspectability. FIRST entry into the main concept-DOI chain.  
**Lean status:** Lean skeletons present in ZIP; sorry-bearing throughout.  
**Note:** Axioms A2 ("zero-pinning") and A4 ("page-curve concavity") are later superseded in v14.  
**Stats:** 2,874 views (concept chain aggregate)

---

### v4–v8 — 2026-05-04 — Chapter Papers
**DOIs:**
- v4 Omega Formalism: [10.5281/zenodo.20020841](https://doi.org/10.5281/zenodo.20020841)
- v5 Lineage-Aware RAG: [10.5281/zenodo.20020846](https://doi.org/10.5281/zenodo.20020846)
- v6 Constitutional Guardrails: [10.5281/zenodo.20020845](https://doi.org/10.5281/zenodo.20020845)
- v7 Tiered Continual Learning: [10.5281/zenodo.20020848](https://doi.org/10.5281/zenodo.20020848)
- v8 Active Inference: [10.5281/zenodo.20020849](https://doi.org/10.5281/zenodo.20020849)

**Concept DOIs:** v4–v8 have STANDALONE concept DOIs (20020840, 20020842, 20020843, 20020844, 20020847) — NOT in main 19944926 chain.  
**What changed:** Five chapter-level papers expanding the Λ theory into different domains. Deposited as `.md` files (Markdown, not PDF). All share commit `a42e586` in the GitHub repo — meaning v4–v8 were deposited from the same code snapshot on the same day, with different metadata labels.  
**Lean status:** Lean skeletons only; no sorry-free results.  
**Key content per version:**
- v4: Ω = E·M·I coupling with EPR-Bell diagnostics; geometric coherence invariants
- v5: GraphRAG + sparse autoencoder interpretability (Prisca framework)
- v6: Chinchilla-Lutar scaling law; bifurcation detection in constitutional guardrails
- v7: Hopfield associative retrieval; conformal memory bounds (Sefirot-tiered)
- v8: Free-energy minimization; predictive coding; cognitive-map navigation (Friston framework)

---

### v9–v10 — 2026-05-06 — Unified Theory + Audit-Closure Operator
**DOIs:**
- v9: [10.5281/zenodo.20053148](https://doi.org/10.5281/zenodo.20053148)
- v10: [10.5281/zenodo.20053163](https://doi.org/10.5281/zenodo.20053163)

**Concept DOI:** Both enter 19944926 (main chain).  
**What changed:** v9 unifies v3–v8 into a Bianchi-closed fiber bundle formulation. v10 formalizes the audit-closure operator Λ₁₀ as an implementation contract. Both ZIPs are 1,065 KB — SAME BLOB (identical file hashes confirmed). v9 and v10 share commit `dd6c01d`.  
**Lean status:** TH8 graded receipt calculus partially discharged; lean_th8_skeleton README says `expected: 9` sorries in `Lutar/GLR/`.

---

### v11-a — 2026-05-11 — Applied Λ (Empirical)
**DOI:** [10.5281/zenodo.20119582](https://doi.org/10.5281/zenodo.20119582)  
**What changed:** First empirical latency measurement paper. Claims: p50 = 11.5 µs, 62,764 ops/sec receipt build, 100% ρ-closure on 8,000/8,000 paired calls. 218/218 tests passing.  
**Lean status:** Claims sorry-count = 0 for TH8 graded receipt calculus (partially confirmed — TH8's GLR module has discharge; general sorry count still non-zero).  
**Note:** 1,568 KB ZIP — larger than v9/v10 despite same conceptual scope, suggests additional test artifacts included.

---

### v11-b (mislabeled) — 2026-05-14
**DOI:** [10.5281/zenodo.20173905](https://doi.org/10.5281/zenodo.20173905)  
**Anomaly:** Title says "v11" but attached ZIP file is `szl-holdings/ouroboros-thesis-paper-v12-1.0.0.zip` (4,088 KB). The version label and file content are from different versions. Assessment: accidental upload of v12 content under a v11-labeled record.

---

### v12 — 2026-05-14 — Λ-Ouroboros Substrate
**DOI:** [10.5281/zenodo.20173920](https://doi.org/10.5281/zenodo.20173920)  
**What changed:** Introduces "Four Machine-Verified Mechanisms" framing. Documents roadmap to `sorry = 0`. Mentions "1 outstanding sorry on A3 weight uniqueness". Doctrine v2 adopted. Small file (16 KB MD).  
**Lean status:** 1 sorry on A3 weight uniqueness; broader sorry landscape not fully enumerated.  
**Stats:** 198 version views, 0 unique downloads

---

### v13 — 2026-05-14 — Λ-Invariant Stack (First Full Thesis)
**DOIs:** 
- MD version: [10.5281/zenodo.20173912](https://doi.org/10.5281/zenodo.20173912) (117 KB, standalone concept)
- PDF canonical: [10.5281/zenodo.20195368](https://doi.org/10.5281/zenodo.20195368) (2,620 KB, in main chain)

**What changed:** Major consolidation — the first deposit explicitly titled "Master Thesis." Introduces 13-axis heart, five retrieval fingers, 20-line receipt bus, doctrine layer, Make-It-Real Audit, Doctrine v2.  
**Lean status:** 2 open sorry; `XXXXX` DOI placeholder (2 instances) in Ch.4 body — represents an as-yet-unminted Egyptian-math deposit.  
**Note:** Two competing concept chains for v13 (20173911 standalone for MD; 19944926 for PDF canonical). The PDF is the canonical cite target.  
**Stats:** PDF (20195368) is the highest-downloaded thesis version — 49 unique downloads.

---

### v14 — 2026-05-28 — Verifiable Multi-Agent Anatomy (Math Corrections)
**DOI:** [10.5281/zenodo.20424992](https://doi.org/10.5281/zenodo.20424992)  
**What changed (five major math corrections from CHANGELOG):**
1. **TH6 relabel:** Bekenstein entropy bound → Cover-Thomas DPI (Theorem 2.8.1). A category error corrected: Bekenstein is a physical bound; DPI is the correct information-theoretic tool.
2. **TH10 downgrade:** "Theorem 1 (uniqueness of Λ)" → **Conjecture 1**. `lutar_unique` and `lutar_is_geomean` in `Lutar/Uniqueness.lean` are now `axiom`s (kernel-accepted but not proved). Proof gap: `IsEgyptianExact.weight_eq` is tautological. Honest downgrade documented.
3. **§9.2.2 KS-18 corrected:** Two-witness soundness description corrected. Canonical module moved to `Lutar/TwoWitness.lean`. Soundness direction has no sorry; `no_NCHV` parity hardness has 1 tagged sorry.
4. **Lutar Calculus introduced:** Receipt types are proofs (Curry-Howard, TH7); gate evaluations are reduction rules (TH4, proof sketch); ρ-closed chains are normal forms (TH5, proof sketch).
5. **Anatomy-Evolved-v1 (Ch.9):** Bohr complementarity in a11oy; QKAN-FWP graft (arXiv:2605.06734); 200-category dual-use registry in sentra; 2 new lutar-lean theorems.

**Lean status:** sorry-count = 0 CLAIMED in abstract and description — this overstates the actual state. Live corpus had ~163 sorries at this point. The specific claims attach to TH7 and TH8 only (which are sorry-free); TH10 is Conjecture.  
**File:** 107 KB PDF  
**Also introduced:** arXiv submission package in workspace (`arxiv_pkg_v14/`)

---

### v15 — 2026-05-28 — Knot Calculus for Governed Decision Receipts
**DOI:** [10.5281/zenodo.20424995](https://doi.org/10.5281/zenodo.20424995)  
**What changed:**
- Geometric reframe: Λ as knot invariant of receipt-chain braid in B_n
- R1, R2, R3 Audit-Reidemeister Conjecture formalized
- PAC-Bayes governance head (TH13) introduced
- Khipu-DAG receipt structure elaborated
- Iris (external reviewer) contributions incorporated: two load-bearing inversions ("receipts are behavior", "gate is parameter-free at inference time")

**Lean status:**
- TH11 (khipuReceipt_checksum_invariant): sorry-free ✓
- TH12 (ΛGateLID_DPO_stability): 3 sorry (~60h estimated discharge)
- TH13 (PAC-Bayes head): 80–120h estimated

**File:** 86 KB PDF  
**WARNING:** This DOI was previously listed in vsp-otel CITATION.cff as "vsp-otel Zenodo DOI" — a provenance error (now corrected in workspace version; original repo may still be affected).

---

### v16 — 2026-05-28 — Feynman Path-Integral Audit Closure
**DOI:** [10.5281/zenodo.20424996](https://doi.org/10.5281/zenodo.20424996)  
**What changed:**
- Feynman path-integral formulation of audit closure
- Gates Doctrine codes introduced
- Cross-component composite invariant
- Inherits all v14 math corrections

**Lean status:** Inherited v14; no new sorry-free theorems in this version.  
**File:** 142 KB PDF (larger than v15, v17)

---

### v17 — 2026-05-28 — Wheelerian Audit Closure
**DOI:** [10.5281/zenodo.20431181](https://doi.org/10.5281/zenodo.20431181)  
**What changed:**
- Wheeler "It from Bit" information-theoretic frame for audit closure
- Shannon doctrine code: information-theoretic receipt compression
- QEC-evolved agent body: Hamming code (error detection), Shor code (error correction), CSS code, Kitaev surface code
- New Lean modules: Lutar/Shannon.lean, Lutar/Wheeler.lean, Lutar/Hamming.lean, Lutar/Shor.lean, Lutar/CSS.lean, Lutar/KitaevSurface.lean

**Lean status:** QEC modules present but sorry-bearing. Main theorem additions: Shannon and Wheeler channels.  
**File:** 69 KB PDF (smallest of the v14–v18 batch)  
**Critical anomaly:** The v18.0 Zenodo record (20434276) attaches THIS PDF — the v17 file was uploaded under v18 metadata.

---

### v18.0 — 2026-05-28 — Multi-track Substrate Expansion (CURRENT ZENODO MASTER)
**DOI:** [10.5281/zenodo.20434276](https://doi.org/10.5281/zenodo.20434276) (index 37 in concept chain)  
**What changed (as described in metadata):**
- Multi-track substrate expansion
- UDS bundle architecture consolidated
- Doctrine v7 referenced
- 749 Lean declarations, 15 raw axioms, 14 unique axioms

**CRITICAL ANOMALIES:**
1. **PDF body is v17 file.** The attached `ouroboros-thesis-v18.0.pdf` (90 KB) has the v17 title page. The v18 content exists only as metadata; no matching body was successfully uploaded.
2. **Description claims "zero sorry, zero open axioms"** — contradicted by live lutar-lean corpus having 168 tracked sorries and 14 unique axioms.

**Lean status at deposit time:** 749 declarations / 14 unique axioms / 163 tracked sorries (pre-K10v2)  
**File:** 90 KB PDF (body = v17 content)  
**Most recent Zenodo master** — 511 version views, 15 unique downloads

---

### v19 — PENDING-MINT — Mid-Step Consolidation
**DOI:** `10.5281/zenodo.PENDING-v19`  
**Package ready at:** `/home/user/workspace/szl/audit_2026-05-30_cursor_offline/thesis_v19_arxiv/`  
**Date drafted:** 2026-05-31  
**What this version does:**
1. **K10v2 honest discharge** (PR `lutar-lean#137` by Mana-Yanqa):
   - Path A: 3 obligations discharged via genuine Lean proofs
   - Path B: 6 obligations downgraded from `Prop := True` (vacuous) to honest `sorry`
   - Sorry count: 163 → **168** (117 non-Putnam + 51 Putnam)
2. **Wire B/C HTTP substrate live:**
   - `POST /v1/verdict` (sentra) — PR a11oy#176 + sentra#102
   - `POST /v1/events` (rosie) — PR rosie#79
3. **σ-algebra retraction:** Rhetorical claim "measurable governance operator on the receipt-bus σ-algebra" permanently retired; replaced with: "tamper-evident append-only audit log + Khipu summation-checked Merkle DAG"
4. **Conjecture 1 explicit demotion:** CAUCHY_ND sorry + missing permutation-symmetry axiom A5 documented as two-part proof gap
5. **Doctrine v7, Watunakuy, Zero-Bandaid Law** canonized as mandatory disciplines

**Lean status:** 749 declarations / 14 unique axioms / **168 tracked sorries**  
**Format:** 9 sections, ~3,300 words; mid-step consolidation (NOT standalone — requires v14–v18 context)  
**v19 IS NOT standalone — v20 is the standalone culmination**

---

### v20 — PENDING-MINT — CULMINATION
**DOI:** `10.5281/zenodo.PENDING-v20`  
**Package ready at:** `/home/user/workspace/szl/audit_2026-05-30_cursor_offline/thesis_v20_arxiv/`  
**Date drafted:** 2026-05-31  
**What this version does:**
- Absorbs ALL of v14 architecture + v15 knot calculus + v16 Feynman frame + v17 QEC + v18 substrate + v19 consolidation into ONE standalone paper
- 16 sections, ~7,500 words, ~65 BibTeX entries
- Standalone: does NOT require prior versions to be read first
- New sections: §1 full intro, §2 related work (~30 citations), §7 DSSE/Sigstore, §9 Knot Calculus (from v15), §10 PAC-Bayes (from v15), §11 UDS substrate, §12 Doctrine v7 enforcement, §13 EU AI Act / NIST AI RMF / ISO 42001, §15 reproducibility, §16 conclusion
- Limitations section: 8 subsections including 12 false @lean_status:GREEN bindings corrected, infrastructure gap table, σ-algebra non-existence with construction requirements, vacuous axiom documentation

**Lean status:** 749 declarations / 14 unique axioms / **168 tracked sorries** (unchanged from v19)  
**arXiv submission-ready:** Primary `cs.LO`; cross-list `cs.PL`, `cs.LG`, `cs.CR`, `math.GT`, `stat.ML`  
**This will be INDEX 38 or 39 in the concept chain (after v19 is minted as index 38)**

---

## Lean Proof Count Evolution

| Version(s) | Lean Status | Key Milestone |
|------------|-------------|---------------|
| v1–v2 | No Lean proofs | Paper-only; pre-formal |
| v3–v8 | Sorry-bearing skeletons | Axioms A1–A4 defined |
| v9–v10 | TH8 GLR: expected 9 sorry | First concrete sorry estimate |
| v11 | TH8 GLR sorry-count = 0 claimed | First sorry-free module claim |
| v12 | 1 sorry on A3 weight uniqueness | Specific sorry location identified |
| v13 | 2 open sorry; XXXXX DOI placeholder | First complete thesis; XXXXX in body |
| v14 | TH10 → Conjecture 1; ~163 sorry (live) | Major honest-proof corrections |
| v15 | TH11 sorry-free; TH12 3 sorry; TH13 open | Knot calculus modules added |
| v16–v17 | QEC Lean modules added (Hamming, Shor, CSS, Kitaev) | Wheeler/Shannon modules |
| v18.0 | 749 decls / 14 unique axioms / 163 sorry | Multi-track substrate; description falsely claims 0 sorry |
| v19 (PENDING) | 749 decls / 14 unique axioms / **168 sorry** | K10v2 Path A/B; 3 discharged + 6 honest downgrades |
| v20 (PENDING) | 749 decls / 14 unique axioms / **168 sorry** | Culmination; no new proof work in v20 itself |

---

## Chain Structure Diagram

```
STANDALONE CONCEPT CHAINS (v1, v2, v4–v8 have their own chains):
  10.5281/zenodo.19867280  →  v1 (19867281)
  10.5281/zenodo.19934128  →  v2 (19934129)
  10.5281/zenodo.20020840  →  v4 (20020841)
  10.5281/zenodo.20020842  →  v5 (20020846)
  10.5281/zenodo.20020843  →  v6 (20020845)
  10.5281/zenodo.20020844  →  v7 (20020848)
  10.5281/zenodo.20020847  →  v8 (20020849)
  10.5281/zenodo.20173911  →  v13-MD (20173912)
  10.5281/zenodo.20173919  →  v12 (20173920)

MAIN CONCEPT CHAIN — 10.5281/zenodo.19944926:
  v3  (19983066)  2026-05-02
  v9  (20053148)  2026-05-06
  v10 (20053163)  2026-05-06
  v11 (20119582)  2026-05-11
  v11b (20173905) 2026-05-14  ← mislabeled (contains v12 zip)
  v13-PDF (20195368) 2026-05-14
  v14 (20424992)  2026-05-28
  v15 (20424995)  2026-05-28
  v16 (20424996)  2026-05-28
  v17 (20431181)  2026-05-28
  v18.0 (20434276) 2026-05-28  ← CURRENT HEAD (index 37)
  v19 (PENDING)   2026-05-31  ← awaiting mint
  v20 (PENDING)   2026-05-31  ← awaiting mint
```

---

## Missing Intermediate Versions (Gap Analysis)

| Gap | Assessment |
|-----|-----------|
| No "v13-exhaustive" Zenodo deposit | GitHub release exists (`paper-v13-exhaustive-1.0.0`, 2026-05-18) with note "DOI pending mint" — never minted |
| No standalone v4-v8 in main concept chain | These are standalone chapter papers; intentional architecture |
| No v19 DOI yet | Package ready in workspace; ACTION-02 in Founder Actions |
| No v20 DOI yet | Package ready in workspace; ACTION-03 in Founder Actions |
| No Doctrine v3–v7 deposits | Only Doctrine v2 on Zenodo (20174600); v3–v7 never deposited |
