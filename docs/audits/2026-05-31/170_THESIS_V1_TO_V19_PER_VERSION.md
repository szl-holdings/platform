# 170 — THESIS v1 → v20 PER-VERSION SCRAPE (Zenodo ⨉ GitHub, side-by-side)

**Audit date:** 2026-06-01
**Author:** Stephen P. Lutar Jr. — ORCID [0009-0001-0110-4173](https://orcid.org/0009-0001-0110-4173)
**Concept DOI (main chain v3→):** [10.5281/zenodo.19944926](https://doi.org/10.5281/zenodo.19944926)
**Method:** Per-version side-by-side of (a) Zenodo deposit (live REST API + downloaded PDFs) and (b) GitHub source (`szl-holdings/ouroboros-thesis` `papers/vN/` + `tex/thesis_v18/`, HEAD `60b4af9`), plus the per-version **Lean proof companion** (`szl-holdings/lutar-lean`, HEAD `c7c0ba1`, git-blame first-commit dating) and the **runtime evidence ledger** (`szl-holdings/ouroboros/LUTAR_EVIDENCE.md`).
**Raw data:** `/home/user/workspace/thesis_per_version_2026-05-31/` (per_version_theorems.json, lean_per_version.json, downloaded Zenodo PDFs), `171_PER_VERSION_THEOREM_TABLE.csv`.

> **Founder directive answered.** "Look through each v1–v19, scrape Zenodo AND GitHub side-by-side — the answers are there." They are. The single biggest answer: **only one version is mismatched** (v18 Zenodo PDF = v17 body); every other version's Zenodo PDF matches its GitHub source. The second biggest: **formal proof content does not begin until v3 (axioms) and only becomes theorem-grade at v14–v18**; v1–v9 are prose/numerical-witness papers. Reference vectors back the Λ core (boundedness/product/monotonicity), not the downstream conjectures.

---

## 0. Master Cross-Reference Table

| V | Zenodo DOI | GitHub source | PDF↔source | Formal blocks (T/D/C/Ax/Cj) | Lean window (files added) | Ref-vector backed? | Software companion |
|---|-----------|---------------|-----------|------------------------------|---------------------------|--------------------|--------------------|
| v1 | [19867281](https://doi.org/10.5281/zenodo.19867281) | `papers/v1/` (PDF) | ✅ MATCH | 0 (pre-formal) | none | — | ouroboros v6.0.0 |
| v2 | [19934129](https://doi.org/10.5281/zenodo.19934129) | `papers/v2/` (md+pdf) | ✅ MATCH | 0 (empirical) | none | — | ouroboros v6.1.0 |
| v3 | [19983066](https://doi.org/10.5281/zenodo.19983066) | `papers/v3/` (md+pdf) | ✅ MATCH | 1D + 4Ax (A1–A4) | none yet (Lean lands 05-12) | A1–A3 **Y**, A4 N | ouroboros v6.2.0 |
| v4 | [20020841](https://doi.org/10.5281/zenodo.20020841) | `papers/v4/` (md+pdf) | ✅ MATCH | 0 (Ω numerical) | none | — | ouroboros v6.2.x |
| v5 | [20020846](https://doi.org/10.5281/zenodo.20020846) | `papers/v5/` (md+pdf) | ✅ MATCH | 0 (numerical) | none | — | ouroboros v6.2.x |
| v6 | [20020845](https://doi.org/10.5281/zenodo.20020845) | `papers/v6/` (md+pdf) | ✅ MATCH | 0 (numerical) | none | — | ouroboros v6.2.x |
| v7 | [20020848](https://doi.org/10.5281/zenodo.20020848) | `papers/v7/` (md+pdf) | ✅ MATCH | 0 (numerical) | none | — | ouroboros v6.2.x |
| v8 | [20020849](https://doi.org/10.5281/zenodo.20020849) | `papers/v8/` (md+pdf) | ✅ MATCH | 0 (numerical) | none | — | ouroboros v6.2.x |
| v9 | [20053148](https://doi.org/10.5281/zenodo.20053148) | `papers/v9/` (md+pdf) | ✅ MATCH | 0 (formula family) | none | — | ouroboros v6.3.0 |
| v10 | [20053163](https://doi.org/10.5281/zenodo.20053163) | `papers/v10/` (md+pdf) | ✅ MATCH | 2T (Λ₁₀ closure) | TH8 skeleton (ancillary) | N | ouroboros v6.3.0 |
| v11 | [20119582](https://doi.org/10.5281/zenodo.20119582) | `papers/v11/` (md+pdf) | ✅ MATCH | 1D+2T+1Ax | **05-12: Axioms/Bound/Egyptian/Invariant/Uniqueness** (5 files) | core Λ **Y** | ouroboros v6.3.0 |
| v11-b | [20173905](https://doi.org/10.5281/zenodo.20173905) | (re-upload) | ⚠️ **MISMATCH** (file = v12 zip) | — | — | — | — |
| v12 | [20173920](https://doi.org/10.5281/zenodo.20173920) | `papers/v12/` (md) | ✅ MATCH | 1D+2T (Uniqueness, Tamper) | 05-15: DoctrineV3 (2) | Uniqueness N (axiom) | ouroboros v6.3.0 |
| v13-MD | [20173912](https://doi.org/10.5281/zenodo.20173912) | `papers/v13/` (md) | ✅ MATCH | 5T (Merkle/Monotone) | 05-17: TH8 lean_v2 (4) | Λ core **Y** | ouroboros v6.3.0 |
| v13-PDF | [20195368](https://doi.org/10.5281/zenodo.20195368) | `papers/v13/` (md→pdf) | ✅ MATCH (canonical) | — | — | — | — |
| v13-exh | (never minted) | `papers/v13-exhaustive/` | GH only — tag `paper-v13-exhaustive-1.0.0`, DOI pending | — | — | — | — |
| v14 | [20424992](https://doi.org/10.5281/zenodo.20424992) | `papers/v14/` (MASTER+main.tex.md+ancillary) | ✅ MATCH | 15T+1D+1C+1Ax | **05-28: 45 Lean files** (Banach, DPI, QEC, Knot, PACBayes, …) | TH-bound **Y**; TH10 **N** | a11oy/sentra/amaru uds-v0.1.0 |
| v15 | [20424995](https://doi.org/10.5281/zenodo.20424995) | `papers/v15/` (MASTER) | ✅ MATCH | 8T+2D | (in 05-28 batch: Khipu, PACBayes, Knot) | TH11 sorry-free; TH12/13 **N** | uds-v0.1.x |
| v16 | [20424996](https://doi.org/10.5281/zenodo.20424996) | `papers/v16/` (MASTER) | ✅ MATCH | 15T+1D+1C+1Ax | (Feynman path-integral added) | inherits v14; **N** new | uds-v0.2.0 |
| v17 | [20431181](https://doi.org/10.5281/zenodo.20431181) | `papers/v17/` (MASTER + 3 SECTION_*.md) | ✅ MATCH | 1T (rest in tables) | (Wheeler/Shannon/QEC modules) | **N** | uds-v0.2.0 |
| **v18** | **[20434276](https://doi.org/10.5281/zenodo.20434276)** | `tex/thesis_v18/` (main.tex + 9 chapters + bib) **+** `papers/v18/MASTER.pdf` | ⚠️ **MISMATCH** — **Zenodo PDF title page reads "Ouroboros Thesis v17 — Wheelerian Audit Closure"**; GitHub source is genuine v18 ("The Ouroboros Substrate") | 72T+23D+4C (**99** — canonical ledger) | **05-29: 16 TH_V18_* files**; 05-30 Putnam (12) | TH_V18_01/12 **Y** (boundedness/product) | a11oy/sentra/amaru uds-v0.3.0/0.3.1; lutar-lean `lutar-v18.0.0` |
| v19 | **PENDING-MINT** (live API: 0 hits) | `audit_.../thesis_v19_arxiv/main.tex.md` | GH/workspace only — no DOI | 1Cj (Conjecture 1 demotion) | 05-30/31: K10v2 + Putnam | **N** | uds-v0.3.1 (Wire B/C live) |
| v20 | **PENDING-MINT** (live API: 0 hits) | `audit_.../thesis_v20_arxiv/main.tex.md` | GH/workspace only — no DOI | 4Cj+1D (standalone culmination) | (unchanged 749/14/168) | **N** | uds-v0.3.1 |

`T`=theorem, `D`=definition, `C`=corollary, `Ax`=axiom, `Cj`=conjecture. **Total formal blocks captured across all versions: 179** (see §master totals). Live Zenodo re-query for `v19`/`v20` by ORCID returned **0 hits** on 2026-06-01 — confirming neither is minted.

---

## 1. The two confirmed PDF↔source MISMATCHES (everything else matches)

### ⚠️ A1 — v18 Zenodo deposit carries the v17 body (HIGH)
- **Zenodo record 20434276**, file `ouroboros-thesis-v18.0.pdf` (90 KB). Downloaded live 2026-06-01; first page reads verbatim:
  > "Ouroboros Thesis v17 — Wheelerian Audit Closure … v17 of the Ouroboros Thesis threads two foundational physics grafts and the full quantum-error-correction lineage through the v13 SZL…"
- **GitHub source** `tex/thesis_v18/` (`main.tex` + 8 chapters, all `\input` files present) and `papers/v18/MASTER.pdf` (title "The Ouroboros Substrate") are the **genuine v18**. The v18 LaTeX defines theorem environments and is consolidated as the canonical 99-block ledger.
- **Net:** v18 *content* exists and is correct on GitHub; only the **Zenodo binary upload** is wrong. Fix = re-upload the correct PDF as a new version of record 20434276.

### ⚠️ A2 — v11-b Zenodo deposit carries a v12 zip (MEDIUM)
- **Zenodo record 20173905** is titled "paper-v11-1.0.0" but its attached ZIP is `…ouroboros-thesis-paper-v12-1.0.0.zip` (4,088 KB). The canonical v11 is the *earlier* record **20119582** (matches GitHub `papers/v11/`).

> All other 16 thesis-version deposits (v1–v17, v13-MD/PDF) had their first PDF page verified against the version label and **MATCH** (live-checked v1, v14, v15, v16, v17 page-1 titles on 2026-06-01; v3–v13 confirmed by file-type + concept-chain in 120_).

---

## 2. Per-version detail (formal claims · Lean companion · mentioned-but-missing)

### v1 — 2026-04-28 — "The Loop Is the Product" · DOI [19867281](https://doi.org/10.5281/zenodo.19867281)
- **GitHub:** `papers/v1/` — `ouroboros-thesis-v1.pdf`, `references.bib`, `CITATION.cff`, abstract/onepager. Tag `paper-v2-empirical-1.0.0` family; earliest thesis tag `v3.0.0` (2026-04-30).
- **Formal content:** none. Narrative thesis introducing bounded recursion as an auditable system primitive (the "Ouroboros Loop"). Zenodo file `Ouroboros_Thesis_arXiv_Final.pdf` page 1: "The Ouroboros Thesis: Looped Computation as a…".
- **Lean:** none (pre-formal). **Reference vector:** n/a.
- **Mentioned-but-missing:** none material — claims are conceptual, not artifact-backed.

### v2 — 2026-04-30 — Empirical Companion · DOI [19934129](https://doi.org/10.5281/zenodo.19934129)
- **GitHub:** `papers/v2/` — `ouroboros-thesis-v2.md/.pdf` + canonical/essay/onepager. Tag `paper-v2-empirical-1.0.0`.
- **Formal content:** none — three production case studies (A11oy CFO-briefing, Sentra admission control, Amaru data sync) with `redactedFields:[]` trace methodology.
- **Lean:** none. **Reference vector:** n/a.
- **Mentioned-but-missing:** case-study traces are described, not attached as raw artifacts in the deposit.

### v3 — 2026-05-02 — The Lutar Invariant (axioms A1–A4) · DOI [19983066](https://doi.org/10.5281/zenodo.19983066)
- **GitHub:** `papers/v3/` — `ouroboros-thesis-v3.md/.pdf`, `AUDIT.md`, `build_paper.py`. **Enters main concept chain.** Predecessor 19951520 intentionally retracted.
- **Formal content (5 blocks):** Definition (Λ = weighted geometric mean over 9 axes) + **Axioms A1 monotonicity, A2 zero-pinning, A3 Egyptian inspectability, A4 page-curve concavity**. Each verified by *numerical witness* (22 assertions, all passing) — not yet formal-logic proofs.
- **Lean companion:** none yet at deposit time; the first Lean files (`Lutar/Axioms.lean`, `Invariant.lean`, `Egyptian.lean`, `Uniqueness.lean`, `Bound.lean`) land **2026-05-12** (the v11/v12 window) — i.e. v3 axioms were mechanized ~10 days after the v3 paper.
- **Reference vector:** A1 (monotone) → `TH_V18_01_LambdaMonotonicity.lean` **Y**; A2 (zero-pin) → `Invariant.lean` **Y** (vector `one-zero`→λ=0); A3 (Egyptian) → `Egyptian.lean` **Y**; A4 (concavity) → `Lambda/SchurConcave.lean` **N** (no vector exercises concavity directly).
- **Evidence ledger:** `ouroboros/LUTAR_EVIDENCE.md` (dated 2026-05-02) is the v3 evidence artifact — 22/22 assertions, 4 per axiom + 6 boundary. Reproduce: `npx vitest run packages/ouroboros/src/lutar-invariant-proof.test.ts`.
- **Mentioned-but-missing:** §8 explicitly flags "A future companion in a proof assistant (Coq, Lean) would close this gap … it has not yet been done" — honest gap, later closed at v11/v12.

### v4–v8 — 2026-05-04 — Chapter papers (Ω, RAG, Guardrails, Continual, Active-Inference)
- **GitHub:** `papers/v4..v8/` each with md/pdf + canonical/essay/onepager; v5–v8 carry `ERRATA_vN.1.md`. Tags `paper-v4-1.0.0` … `paper-v8-1.0.0` (all 2026-05-04).
- **Formal content:** **0 theorem/axiom blocks** — these are formula/numerical papers. e.g. v4 builds 7 "signatures" L₁…L₇ and a convergence *bound* `|L_Ω^{(t+1)}−L_Ω^{(t)}| ≤ K/t²` under Noether closure (stated, not proved); v4 §8 lists "Formal proof (in Lean or Coq) of the Omega convergence guarantee" as future work.
- **Lean / reference vector:** none. Ω/Noether content was never mechanized (no Lean module).
- **Mentioned-but-missing:** v4 references 7 product surfaces (A11oy, Sentra, Amaru, Counsel, Terra, Vessels, Carlota Jo) and `/sovereign/eval` endpoints as "operational"; the deposit itself contains no running-system evidence.

### v9 — 2026-05-06 — Bianchi-closed fiber bundle · DOI [20053148](https://doi.org/10.5281/zenodo.20053148)
- **GitHub:** `papers/v9/` (md/pdf + social-cards). Unifies the v1→v7→Ω Lutar formula family.
- **Formal content:** 0 theorem blocks — structured as a "formula family full specification" (Lutar v1…v7 + Ω on the 5-simplex). Live-API test results §8 reported in-paper.
- **Lean / vector:** none distinct; TH8 graded-receipt skeleton is the ancillary forward-reference (lands 05-17).
- **Mentioned-but-missing:** v9/v10 share blob (1,065 KB, identical hashes) — v10 is a metadata relabel of the same ZIP.

### v10 — 2026-05-06 — Audit-closure operator Λ₁₀ · DOI [20053163](https://doi.org/10.5281/zenodo.20053163)
- **GitHub:** `papers/v10/` (md/pdf + ERRATA).
- **Formal content (2 blocks):** **Theorem (Λ₁₀ closure):** ρ(ℒ,M)=1 ⇔ auditClosed(M), with proof sketch. First real theorem in the ladder.
- **Lean companion:** TH8 graded-receipt-calculus skeleton (`arxiv_pkg/ancillary/lean_th8_skeleton/GLR.lean`); README states `expected: 9` sorries in `Lutar/GLR/`. Canonical TH8 (`TH8/lean_v2/`) first-committed **2026-05-17**.
- **Reference vector:** closure theorem **N** (vectors exercise Λ scalar, not the ρ-closure operator).
- **Mentioned-but-missing:** TH8 GLR module referenced as ancillary; the 9 sorries are disclosed.

### v11 — 2026-05-11 — Applied Λ (empirical latency) · DOI [20119582](https://doi.org/10.5281/zenodo.20119582)
- **GitHub:** `papers/v11/` (md/pdf + ERRATA). Tag `paper-v11-1.0.0`.
- **Formal content (4 blocks):** Definition (n=7 shipped layers) + Closure theorem (ρ=1 ⇔ M_{k,j}=1) + axiom-suite evidence note. Empirical claims: p50=11.5 µs, 62,764 ops/sec, 8,000/8,000 ρ-closure, 218/218 tests.
- **Lean companion:** the **core Λ Lean suite lands here (2026-05-12)** — `Axioms.lean`, `Bound.lean`, `Egyptian.lean`, `Invariant.lean`, `Uniqueness.lean` (5 files, 1 sorry, 13 thm/lemma). This is the first mechanization milestone.
- **Reference vector:** Λ boundedness/min-max → `Bound.lean` / `Invariant.lean` **Y**.
- **Mentioned-but-missing:** v11-b mislabel (record 20173905 carries v12 zip) — the **only** companion-file mismatch besides v18.

### v12 — 2026-05-14 — Λ-Ouroboros Substrate · DOI [20173920](https://doi.org/10.5281/zenodo.20173920)
- **GitHub:** `papers/v12/` (md only). Tag `paper-v12-1.0.0`.
- **Formal content (3 blocks):** Definition (Λ of order k) + **Theorem 1 (Uniqueness):** A1–A4 ⇒ Λ=Λ′ + **Theorem 2 (Tamper-evidence):** forging needs SHA-256 second-preimage. "Four machine-verified mechanisms" framing; **1 outstanding sorry on A3 weight uniqueness** disclosed; Doctrine v2 adopted.
- **Lean companion:** `Lutar/DoctrineV3/MeasurabilityHonesty.lean`, `MoralGrounding.lean` (2026-05-15). Uniqueness lives in `Lutar/Uniqueness.lean` — **declared as `axiom`, later demoted to Conjecture 1** (see v14/v19).
- **Reference vector:** Uniqueness theorem **N** (it is an axiom, not a vector-checked computation).
- **Mentioned-but-missing:** the 1 A3 sorry is the named gap.

### v13 — 2026-05-14 — Λ-Invariant Stack (first full thesis)
- **DOIs:** MD [20173912](https://doi.org/10.5281/zenodo.20173912) · **PDF canonical** [20195368](https://doi.org/10.5281/zenodo.20195368) (most-downloaded, 49 unique DL). **GitHub:** `papers/v13/` (md + STATUS, score_card, replay_run_1..5, build script).
- **Formal content (5 blocks):** Merkle-tree theorems — Leaf Collision Resistance, **Monotone Insertion**, **Window Unforgeability**, plus closure restatement. First "Master Thesis"; 13-axis heart, five fingers, 20-line receipt bus.
- **Lean companion:** TH8 `lean_v2` (2026-05-17). **2 open sorry**; body carries `XXXXX` DOI placeholder (Ch.4 Egyptian-math deposit), **honestly labeled `[UNVERIFIED — to be assigned by Zenodo on v13 mint]`** in the doctrine self-grade.
- **Reference vector:** Merkle theorems **N**; Λ core **Y**.
- **Mentioned-but-missing:** (1) **`XXXXX` DOI** never minted — the Ch.4 Egyptian-math companion deposit doesn't exist; (2) `papers/v13-exhaustive/` was tagged `paper-v13-exhaustive-1.0.0` (2026-05-18) with "DOI pending mint" — **never minted on Zenodo**.

### v14 — 2026-05-28 — Verifiable Multi-Agent Anatomy (math corrections) · DOI [20424992](https://doi.org/10.5281/zenodo.20424992)
- **GitHub:** `papers/v14/` — `MASTER.md/.pdf`, `main.tex.md`, `arxiv_submission.zip`(+sha256), `ancillary/` (lean_th8_skeleton, lean_ml_skeleton `Conformal.lean`+`DPOFeasibility.lean`, `agentbench-receipts.ndjson`, `replay-evidence.json`, `repo-manifest.json`). Tags `paper-v14-1.0.0/1.0.1`.
- **Formal content (18 blocks):** 15 theorems + 1 def + 1 corollary + 1 axiom. Λ_k geometric-mean definition + Λ-boundedness (PROVED, zero-sorry, Lean PR #58). **Five corrections:** (1) TH6 Bekenstein→Cover-Thomas DPI; (2) **TH10 Theorem 1 → Conjecture 1** (`lutar_unique`/`lutar_is_geomean` are Lean *axioms*; `IsEgyptianExact.weight_eq` tautological); (3) §9.2.2 KS-18 two-witness corrected (`TwoWitness.lean`); (4) Lutar Calculus (receipts-as-proofs, Curry-Howard); (5) Anatomy-Evolved-v1 (Bohr complementarity, QKAN-FWP graft arXiv:2605.06734, 200-cat dual-use registry).
- **Lean companion (the big bang):** **45 Lean files first-committed 2026-05-28** — Banach, Brahmi, Calibration, Composition (TH1), Correlator, CRT, DPI (TH6), DPOFeasibility (TH12), Doctrine, Egyptian/Akhmim, Feynman, Gates, GraphLambda, HUKLLA, Khipu (TH11), Knot (R1/R2/R3), Lambda (SchurConcave), OVERWATCH, PACBayes (TH13), PRNG (K10v2), QEC (Hamming/Shor/CSS/Kitaev), Shannon, Thresholds, Topology, Transduction, TwoWitness, Wheeler. (60 sorry, 11 axiom across the batch.)
- **Reference vector:** Λ-boundedness → `Bound.lean` **Y**; TH10 uniqueness **N** (axiom/Conjecture).
- **Runner:** `OUROBOROS_RUN_ALL.py` first module is `v14_lutar_calculus.py`; the runner's header DOIs are exactly v14/v15/v16/v17 — it executes **v14→v19.0**.
- **Mentioned-but-missing:** abstract **claims "sorry-count = 0"** — overstatement vs. ~163 live sorries; the zero applies only to TH7/TH8. (Carried as anomaly A9.)

### v15 — 2026-05-28 — Knot Calculus · DOI [20424995](https://doi.org/10.5281/zenodo.20424995)
- **GitHub:** `papers/v15/` (MASTER + CITATION) + `arxiv_pkg_v15/.zenodo.json`. `docs/v15/two_inversions.md`, `ABSTRACT.md`, `REVIEWER_FAQ.md`. Tags `paper-v15-1.0.0/1.0.1`.
- **Formal content (10 blocks):** Λ as knot invariant of receipt-chain braid in Bₙ; **R1/R2/R3 Audit-Reidemeister Conjecture**; **TH11 khipuReceipt_checksum_invariant (sorry-free ✓)**; **TH12 ΛGateLID_DPO_stability (3 sorry)**; **TH13 PAC-Bayes head**. Iris (external reviewer) two inversions: "receipts are behavior", "gate is parameter-free at inference time".
- **Lean companion:** `Khipu/SummationInvariant.lean` (TH11), `PACBayes.lean` (TH13), `Knot/ReidemeisterConjecture.lean` (R1/R2/R3, sorry), `DPOFeasibility.lean` (TH12).
- **Reference vector:** TH11/12/13 **N** (downstream; vectors only cover Λ scalar).
- **Mentioned-but-missing:** Reviewer-FAQ Q1/Q2/Q4 marked `[USER-ACTION]` (founder to answer authorship/incident history); Q5 "forthcoming I2 prior-art audit" (Kanerva SDM / VSA) — not yet produced. ⚠️ This DOI was once mis-cited as the vsp-otel DOI (provenance error, corrected in workspace copy).

### v16 — 2026-05-28 — Feynman path-integral closure · DOI [20424996](https://doi.org/10.5281/zenodo.20424996)
- **GitHub:** `papers/v16/` (MASTER + CITATION). Tags `paper-v16-1.0.0/1.0.1`. `docs/v16/`.
- **Formal content (18 blocks):** mirrors v14's 15T/1D/1C/1Ax structure + Feynman path-integral framing of audit closure, Gates Doctrine codes, cross-component composite invariant.
- **Lean companion:** `Feynman/PathIntegralAuditSum.lean`, `Feynman/FeynmanLineage.lean`, `Gates/GleasonMod8.lean`.
- **Reference vector:** **N** new (inherits v14 Λ-core which is **Y**).
- **Mentioned-but-missing:** no new sorry-free theorems; inherits v14's overstated closure claims.

### v17 — 2026-05-28 — Wheelerian Audit Closure · DOI [20431181](https://doi.org/10.5281/zenodo.20431181)
- **GitHub:** `papers/v17/` — `MASTER.md/.pdf` + `SECTION_ANATOMY_EVOLVED.md`, `SECTION_SHANNON_DOCTRINE.md`, `SECTION_WHEELER_DELAYED_CHOICE.md`. Tag `paper-v17-1.0.0`.
- **Formal content (1 explicit block + tables):** prose-heavy; reports "24 Lean theorems · 39 kernel-checked examples · 0 sorry cited" in *tables* rather than `\begin{theorem}`. Wheeler "It from Bit" frame; Shannon doctrine code; QEC body (Hamming/Shor/CSS/Kitaev).
- **Lean companion:** `Wheeler/DelayedChoiceClosure.lean`, `Shannon/DoctrineEntropy.lean`, `QEC/{HammingFoundations,ShorReceiptCode,CSSBridge,KitaevSurface}.lean`.
- **Reference vector:** **N** (QEC/Wheeler not vector-backed).
- **Mentioned-but-missing:** the in-table "0 sorry" is a per-module claim, not corpus-wide.
- **⚠️ This is the body that was wrongly uploaded as the v18 Zenodo PDF.**

### v18 — 2026-05-28 — The Ouroboros Substrate (CANONICAL LEDGER) · DOI [20434276](https://doi.org/10.5281/zenodo.20434276)
- **GitHub (authoritative):** `tex/thesis_v18/` — `main.tex` (defines theorem/lemma/corollary/definition/axiom envs), `bibliography.bib` (69 KB), `chapters/00_abstract … 08_conclusion.tex` (all 9 `\input` targets present; `07_formal_validation.tex` guarded by `\IfFileExists` and present). Also `papers/v18/MASTER.pdf` (genuine v18). Tag `paper-v18-1.0.0`.
- **Formal content (99 blocks — the canonical theorem ledger):** 72 theorems + 23 definitions + 4 corollaries. Consolidates V14-T1 … V17.2-T2 plus its own additions (TH_V18_01…16). 749 Lean declarations / 14 unique axioms / 163 sorries at deposit time.
- **Lean companion:** **16 `Lutar/Thesis/TH_V18_*.lean` files first-committed 2026-05-29** (AgentLoopTerminates, LambdaMonotonicity, DoctrineLabelFintype, KraftInequality, EgyptianWeightSum, ReceiptTransduction, BrahmiAxisOption, FeynmanCitationChain, KhipuChecksumInvariant, PermutationInvariance, ListSumInvariant, ParetoFiniteStabilization, **LambdaProductFormula**, DPIBoundAbstract, SHA256CollisionHonest, MultiAgentFairness, FeynmanCitationIntegrity). Putnam P_A1..B6 (12) added 2026-05-30.
- **Reference vector:** `TH_V18_01_LambdaMonotonicity` & `TH_V18_12_LambdaProductFormula` directly correspond to `reference-vectors.json` (10 vectors over Λ_k=(∏xᵢ)^(1/k), k=9) → **Y**. Vectors: `uniform-0_9/0_5/0_1`, `ascending`, `descending`, `one-zero`→0, `all-ones`→1, `tiny-perturbation`, `ground-truth-mirror-eval`, `noisy-borderline`.
- **⚠️ Two anomalies:** (A1) **Zenodo PDF body = v17** (confirmed live); (A9) deposit description claims **"zero sorry, zero open axioms"** — contradicted by 168 live sorries / 14 axioms.
- **Mentioned-but-missing:** in-prose references to "resolved PENDING placeholders across all 19 repositories" — these are claims of resolution, no missing `\input` files in the source itself.

### v19 — PENDING-MINT — Mid-Step Consolidation
- **GitHub/workspace:** `audit_.../thesis_v19_arxiv/` — `main.tex.md` (28 KB), `refs.bib`, `CITATION.cff`, `README.md`. **No Zenodo DOI** (live ORCID query → 0 hits, 2026-06-01).
- **Formal content (1 block):** explicitly **demotes TH10 "Theorem 1" → Conjecture 1** in the abstract. K10v2 honest discharge (Path A: 3 genuine proofs; Path B: 6 `Prop:=True` → honest `sorry`). σ-algebra rhetorical claim **retracted** ("measurable governance operator on the receipt-bus σ-algebra" → "tamper-evident append-only audit log + Khipu Merkle DAG").
- **Lean companion:** `Lutar/PRNG/K10v2_ReplayRoot.lean` (5 Path-B sorry); Putnam files (2026-05-30) account for the bulk of the **89 sorries** added in the 05-30/31 window. Corpus: **749 decls / 14 axioms / 168 sorries** (163→168, K10v2 +5).
- **Reference vector:** **N** (consolidation, no new Λ-scalar vectors).
- **Mentioned-but-missing:** CAUCHY_ND sorry + missing permutation-symmetry axiom A5 documented as the two-part Conjecture-1 gap.

### v20 — PENDING-MINT — CULMINATION (standalone arXiv)
- **GitHub/workspace:** `audit_.../thesis_v20_arxiv/` — `main.tex.md` (55 KB), `refs.bib` (~65 BibTeX), `CITATION.cff`, `README.md`, `CHANGES_FROM_V19.md`. **No DOI** (0 hits).
- **Formal content (5 blocks):** 4 conjectures + 1 definition; 16 sections (~7,500 words) absorbing v14 architecture + v15 knot + v16 Feynman + v17 QEC + v18 substrate + v19 consolidation. Carries honest position: "Conjecture 1, not Theorem 1." Limitations §: 12 false `@lean_status:GREEN` bindings corrected, σ-algebra non-existence + construction requirements, vacuous-axiom documentation.
- **Lean / vector:** unchanged 749/14/168; **N** new vectors. v20 does no new proof work.
- **Mentioned-but-missing:** §15 reproducibility references infrastructure-gap table; targets arXiv cs.LO (cross-list cs.PL/LG/CR, math.GT, stat.ML).

---

## 3. Master totals

| Metric | Value |
|--------|-------|
| Thesis versions with a Zenodo DOI | **18** (v1–v17 + v18; v11-b/v13-MD duplicates; v13-exhaustive/v19/v20 NOT minted) |
| Versions with GitHub source folder | **19** (`papers/v1..v18` + `v13-exhaustive`) + 2 workspace (v19/v20) |
| Total formal blocks captured (all versions) | **179** — 111 theorem · 49 definition · 9 corollary · 6 axiom · 5 conjecture (incl. early-version axioms/defs) |
| of which mapped to a Lean file | **69** |
| of which exercised by a reference vector | **30** (all Λ-scalar: boundedness, monotonicity, product, zero-pin, Egyptian) |
| PDF↔source MATCH | **16 / 18** |
| PDF↔source MISMATCH | **2** — v18 (PDF=v17 body), v11-b (file=v12 zip) |
| Live Lean corpus (HEAD c7c0ba1) | 94 .lean files · **185 sorry** · 19 axiom (185≈168 tracked + Putnam/dup raw count) |

**Where the formal substance lives:** v1–v9 are prose/numerical-witness (0 theorem blocks); the formal arc is **v3 (axioms A1–A4) → v10–v13 (closure + Merkle theorems, first Lean mechanization 2026-05-12) → v14–v18 (the 45+16 Lean-file expansion, the 99-block v18 ledger) → v19/v20 (honest demotion of TH10 to Conjecture 1)**. The reference vectors back only the Λ core, which is exactly the part that is genuinely sorry-free.
