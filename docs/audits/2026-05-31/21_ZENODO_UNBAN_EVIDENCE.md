# 21 — ZENODO UNBAN EVIDENCE: Banned Tokens in Published Zenodo Records
**Audit date:** 2026-05-31  
**ORCID:** 0009-0001-0110-4173  
**Auditor:** Perplexity Computer (read-only)  
**Method:** grep across all .md and .tex files in workspace thesis repo directories; cross-reference against what was published in each Zenodo deposit

---

## Scope

Banned tokens searched:
```
sorry | TODO | FIXME | PLACEHOLDER | FILL IN | TBD | REDACTED | [INSERT | [ADD  |
[CITATION NEEDED | lorem ipsum | in preparation | forthcoming | to be completed |
stub | omitted for brevity | left as exercise | left to the reader | [XX] | [YY] |
[ZZ] | INTENTIONALLY LEFT BLANK | fake data | dummy data | boilerplate |
PROOF OMITTED | PROOF SKETCH | we omit | omitted here | incomplete proof |
axiom placeholders | XXXXX
```

---

## CATEGORY 1 — `sorry` in Published Zenodo-linked Content

### Finding 1A: sorry claims in v12 thesis (Zenodo 20173920, 20173912)

**File:** `/home/user/workspace/szl/thesis-repo/papers/v12/ouroboros-thesis-v12.md`  
**Zenodo deposits:** 20173920 (MD), 20173912 (MD)

**Exact text (verbatim from file):**
```
Line 93: CI runs `lake build` on every push; when the `sorry` count reaches 0, 
the kernel has verified the theorem. The kernel is the referee.

Line 252: - **A3 weight uniqueness** in Lean has one outstanding `sorry`; 
Theorems 1 and 2 are scaffolded but not yet fully discharged. The published 
claim is the *commitment*: every CI run displays the remaining `sorry` count.

Line 258: ## 11. Roadmap to `sorry = 0`
```

**Assessment:** DISCLOSED. v12 explicitly documents the sorry situation and frames it as a commitment/roadmap. This is honest disclosure, not a banned-token violation. The `sorry` appears in Lean code discussion, not in the proof assertions themselves.

---

### Finding 1B: sorry-count = 0 claim in v14 arXiv submission (Zenodo 20424992)

**File:** `/home/user/workspace/szl/thesis-repo/papers/v14/main.tex.md`  
**Corresponding Zenodo deposit:** 20424992 (v14 PDF, 107 KB)

**Exact text (verbatim from file):**
```
Line 80: governed by a nine-axis quality gate Λ_9 proved unique in Lean 4 
(sorry-count = 0, zenodo.20053148)

Line 82: ...machine-checked in Lean 4 with sorry-count = 0), gate evaluations 
are reduction rules (Theorem TH4, Λ-Category, proof sketch in §6.1; pending 
Lean formalization in lutar-lean/Lutar/LaxFunctor.lean), and ρ-closed chains 
are normal forms (Theorem TH5, Confluence, proof sketch in §6.2; pending Lean 
formalization).
```

**Assessment:** FLAGGED. The claim "sorry-count = 0" as applied to TH4/TH5 is contradicted by v14 CHANGELOG entry:
> "TH10 downgrade — Theorem 1 → Conjecture 1 (§3.3). `lutar-lean/Lutar/Uniqueness.lean` currently declares `lutar_unique` and `lutar_is_geomean` as Lean `axiom`s; they are kernel-accepted but not deductively proved."

Furthermore, the live lutar-lean corpus has 168 tracked sorries (v19/v20 confirm this). The "sorry-count = 0" claim attached to specific theorems misrepresents the state of the Lean corpus at time of v14 publication. The v14 deposit description propagated this claim.

**v18 description also carries this claim:**  
Record 20434276 (v18, the current MASTER) description states "zero sorry, zero open axioms" — which is directly contradicted by the live lutar-lean HEAD having 168 tracked sorries (163 baseline + 5 K10v2 path-B additions) and 14 unique axioms.

---

### Finding 1C: sorry-bearing Lean skeletons in arXiv packages (linked to v9/v10 ZIP deposits)

**File:** `/home/user/workspace/szl/thesis-repo/arxiv_pkg/ancillary/lean_th8_skeleton/README.md`  
**Files published in Zenodo:** v9 (20053148) and v10 (20053163) ZIPs contain Lean skeletons

**Exact text:**
```
Line 95: # Check sorry count:
Line 99: grep -r "sorry" Lutar/GLR/ | wc -l   # expected: 9
Line 104: ## Sorry-Discharge Difficulty Estimates
```

**Assessment:** DISCLOSED. The skeletons are explicitly labeled as "Lean skeletons with sorry" in the deposit README. The v9/v10 ZIPs (1065 KB each) include the lean_th8_skeleton directory, and the included README honestly documents sorry expectations. This is transparent.

**However:** The outer deposit abstract/description claims TH8 has sorry-count = 0 while the skeleton README says `expected: 9` sorries in `Lutar/GLR/`. This is a discrepancy between the description prose and the actual content.

---

### Finding 1D: sorry in v14 ancillary lean skeleton (linked to v14 PDF deposit 20424992)

**File:** `/home/user/workspace/szl/thesis-repo/papers/v14/ancillary/lean_ml_skeleton/README.md`

**Exact text:**
```
Line 4: of the v14 thesis. Each file is a *statement-only* Lean 4 source with a `sorry`
Line 9: | Conformal.lean        | §14.3 (calibration) | sorry      | lutar-lean#TBD |
Line 10: | DPOFeasibility.lean   | §17 (L2G/DPO)       | sorry      | lutar-lean#TBD |
```

**Assessment:** DISCLOSED but with `TBD` token. The `lutar-lean#TBD` references (no actual issue number) and `sorry` are correctly disclosed in the skeleton README. However `TBD` is a tracked banned token that appeared in content included in the arXiv package file tree (even though the arXiv submission itself is the main PDF).

---

## CATEGORY 2 — XXXXX DOI Placeholder in v13 Published Content

### Finding 2A: XXXXX DOI placeholder in v13 thesis (Zenodo 20173912, 20195368)

**File:** `/home/user/workspace/szl/thesis-repo/papers/v13/STATUS.md`  
**Corresponding Zenodo deposits:** 20173912 (v13 MD), 20195368 (v13 PDF)

**Exact text:**
```
Line 97: | UV-01-02 | Ch4 XXXXX DOI (2 instances) | DOI for Egyptian-math Zenodo 
deposit not yet minted; `XXXXX` placeholder present |

Line 116: 4. Resolve or explicitly `[UNVERIFIED]`-tag every `[INTERNAL]` SHA reference; 
mint UV-01-01 v13 DOI and replace placeholder once available.
```

**Assessment:** FLAGGED. The v13 STATUS.md — which was published as part of the workspace package for Zenodo deposit 20173912 — documents that the v13 thesis body contains `XXXXX` as a DOI placeholder (2 instances). These literal `XXXXX` strings appear in the published thesis text at Ch.4.

**Confirmation from doctrine_self_grade.md:**
```
| 1 | cleanliness | 0.93 | The XXXXX DOI placeholder remains with [UNVERIFIED — to be 
assigned by Zenodo on v13 mint] label. |
```

This means the published v13 Zenodo deposit (20195368) contains a thesis PDF that has `XXXXX` as a placeholder DOI reference. This is a materially unresolved placeholder in a public academic deposit.

---

## CATEGORY 3 — README-Stage Placeholder Language in v3 (Zenodo 19983066)

### Finding 3A: Product repos described as "README-stage placeholders" in published v3

**File:** `/home/user/workspace/szl/thesis-repo/papers/v3/ouroboros-thesis-v3.md`  
**Corresponding Zenodo deposit:** 19983066 (v3 ZIP, 584 KB)

**Exact text:**
```
Line 232: ...the seven product repositories in the SZL Holdings organisation — A11oy, 
Amaru, Sentra, Counsel, Terra, Vessels, Carlota Jo — are README-stage placeholders 
at the time of writing (each contains a README, LICENSE, NOTICE, and SECURITY file, 
and no source).
```

**Assessment:** DISCLOSED AND HONEST. v3 explicitly calls out that product repos were stubs at time of writing. This is a transparency positive, not a violation. The paper (v3) accurately describes the state.

---

## CATEGORY 4 — Redacted Fields in v2 Empirical Companion (Zenodo 19934129)

### Finding 4A: `redactedFields: []` in production trace example

**File:** `/home/user/workspace/szl/thesis-repo/papers/v2/ouroboros-thesis-v2.md`  
**Corresponding Zenodo deposit:** 19934129 (v2 PDF, 144 KB)

**Exact text:**
```
Line 65: We deploy the same kernel across three production runtimes (A11oy, Sentra, 
Amaru) with separate state schemas, separate delta and consistency scorers, and 
shared trace persistence via `aef-evidence-ledger`. Each case study reports a 
representative state schema, a redacted trace example, and aggregate convergence 
statistics.

Line 192: redactedFields: [],
Line 278: Trace example (redacted). One A11oy run where a CFO-briefing workflow 
oscillated between two plans before stabilizing.
```

**Assessment:** DISCLOSED. The paper explicitly calls these "redacted traces" — this is an explicit methodology note (PII protection), not a suppression of evidence. `redactedFields: []` means no fields were actually redacted in this example, which is also honest.

---

## CATEGORY 5 — "forthcoming" in v3 (Zenodo 19983066)

### Finding 5A: forthcoming work referenced

**File:** `/home/user/workspace/szl/thesis-repo/papers/v3/ouroboros-thesis-v3.md`

**Exact text:**
```
Line 245: Implementation of v4 and v6 runtime services. The runtime contract 
declares a 9-entry validator registry (v4) and a 16-service shared runtime (v6) 
as routing/coordination layers; their implementation is the subject of 
**forthcoming work**.
```

**Assessment:** `forthcoming` appears in the v3 published content. This is academic future-work language (not a banned token under the current Doctrine definition, which targets `forthcoming` as a suppression of missing evidence). In v3 context it is appropriate — the author is honestly flagging unimplemented features. Assessment: LOW SEVERITY.

---

## CATEGORY 6 — TBD References in ancillary skeleton

### Finding 6A: TBD issue numbers in lean_ml_skeleton

**Files:** `/home/user/workspace/szl/thesis-repo/papers/v14/ancillary/lean_ml_skeleton/README.md`

**Exact text:**
```
| Conformal.lean        | §14.3 (calibration) | sorry      | lutar-lean#TBD |
| DPOFeasibility.lean   | §17 (L2G/DPO)       | sorry      | lutar-lean#TBD |
```

**Assessment:** FLAGGED. `#TBD` is a placeholder (no GitHub issue number assigned). This appears in the arXiv package ancillary files that accompany the v14 submission. The arXiv package was the basis for the v14 Zenodo deposit (20424992). While the ancillary files are supporting documents rather than the main PDF, they are part of the deposit record.

---

## Summary Table: Banned/Flagged Tokens in Published Zenodo Deposits

| Finding | Token | File | Zenodo Record | Severity | Type |
|---------|-------|------|---------------|----------|------|
| 1B | `sorry-count = 0` (overstatement) | v14/main.tex.md, v18 description | 20424992, 20434276 | **HIGH** | Factual mismatch — live corpus has 168 sorries |
| 2A | `XXXXX` (DOI placeholder) | v13/STATUS.md, v13 body | 20173912, 20195368 | **HIGH** | Literal placeholder in published thesis body |
| 6A | `TBD` (issue number) | v14/ancillary/lean_ml_skeleton/README.md | 20424992 (ancillary) | **MEDIUM** | Issue reference placeholder in arXiv package |
| 1A | `sorry` (disclosed) | v12/ouroboros-thesis-v12.md | 20173920, 20173912 | LOW | Honest disclosure; not a violation |
| 1C | `sorry expected: 9` | lean_th8_skeleton/README.md | 20053148, 20053163 (ZIP contents) | LOW | Honest disclosure in skeleton README |
| 3A | `README-stage placeholders` | v3/ouroboros-thesis-v3.md | 19983066 | LOW | Honest disclosure of known limitation |
| 4A | `redacted` / `redactedFields` | v2/ouroboros-thesis-v2.md | 19934129 | LOW | Appropriate methodology disclosure |
| 5A | `forthcoming` | v3/ouroboros-thesis-v3.md | 19983066 | LOW | Standard academic future-work language |
| 1D | `sorry`, `TBD` | v14/ancillary/lean_ml_skeleton | 20424992 (ancillary) | MEDIUM | In supporting files, not main PDF |

---

## Critical Finding: v18 Description "zero sorry, zero open axioms" vs Live Reality

**Record:** 20434276 (Ouroboros Thesis v18.0, current MASTER)  
**Claimed in description:** "zero sorry, zero open axioms"  
**Reality at lutar-lean HEAD (c7c0ba17):** 749 declarations, 14 unique axioms, **168 tracked sorries** (117 non-Putnam + 51 Putnam), confirmed by v19 CITATION.cff and v20 CHANGES_FROM_V19.md  

This is the most material unban evidence in the corpus. The public-facing description of the current master deposit directly contradicts the actual state of the Lean proof corpus. This was corrected in v19's σ-algebra retraction and K10v2 discharge campaigns, but the v18 deposit itself remains uncorrected on Zenodo.

**Required action:** Either mint a corrected v18.1 deposit with an honest description, or mint v19 (which replaces v18 as head of chain) promptly.

---

## Lean Proof Count at HEAD (confirmed from v19/v20)

| Metric | Value |
|--------|-------|
| Total Lean declarations | 749 |
| Unique axioms | 14 |
| Tracked sorries (total) | **168** |
| Non-Putnam sorry baseline | 117 |
| Putnam-tagged sorries | 51 |
| Sorry-free sub-results | a3_normalize_proof, lambda_isMonotone, lambda_isHomogeneous, Λ_le_max, TH11 (khipuReceipt_checksum_invariant) |
| Conjecture 1 (TH10) status | Axiom in Lean (not proved) — demoted from Theorem in v14 |
