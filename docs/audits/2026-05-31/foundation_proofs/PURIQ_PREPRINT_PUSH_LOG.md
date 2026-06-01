# PURIQ Preprint — Build & Push Log (Task 3)

**Date:** 2026-06-01
**Author:** Stephen P. Lutar Jr. (signed **Yachay**)
**Co-authored-by:** Perplexity Computer Agent
**Directive:** NO BANDAID. Foundation-level math + provenance closure. arXiv preprint
must cite primary sources; no marketing fluff.

---

## 1. Deliverable

A canonical, standalone preprint for the **PURIQ** master formula — the agentic-action
layer of Doctrine v12 — published to a public GitHub repository with `.zenodo.json` at
root from day one (per founder), and staged for arXiv `cs.AI` submission.

## 2. Paper

- **Source:** `puriq_preprint/main.tex` (IEEE two-column layout emulated with the base
  `article` class; `IEEEtran.cls` is not installed and `tlmgr install` is blocked by a
  full disk — switching `\documentclass` to `{IEEEtran}[conference]` requires no body
  changes). Bibliography style `plain`.
- **Bibliography:** `puriq_preprint/bibliography.bib` — 72 entries, all **primary**
  sources: Mathlib/Lean 4, Aczél (functional equations), Hardy–Littlewood–Pólya
  (inequalities), Merkle, FIPS 180-4 (SHA-256), Lamport (signatures / time-clocks),
  Nakamoto, Noether, Newton, Euler, Gauss, Riemann, Turing, von Neumann, Sion, Shannon,
  Kolmogorov, Bekenstein/'t Hooft/Susskind, Feynman; standards SLSA, in-toto, Sigstore,
  DSSE, FRE 901/902, IBCS, EU AI Act, NIST AI RMF; model leaders Llama, Qwen, DeepSeek,
  Mixtral, GPT-4, Gemini, Claude; fielded autonomy Anduril Lattice, Iron Dome; WRR /
  McKay (ELS negative control).
- **Compile result:** `pdflatex ×3 + bibtex`, **exit 0** on all passes.
  - **8 pages** (task target 8–12 ✓)
  - **0 undefined citations**, **0 undefined references**
  - 1 trivial overfull hbox (1.07pt, axis table) — cosmetically negligible.
  - Page-1 replay hash now wraps cleanly via `\seqsplit` (prior column overflow fixed).
- **Expansion vs. the 5-page draft:** added a threat model, design principles,
  product-vs-sum derivation, β-choice and a worked non-compensation micro-example,
  per-invariant proof sketches (I1, I3) and an I4 finiteness remark, a full 13-axis
  table (Table 1: tier / floor / HUKLLA link), a Lean-model + "proven vs. assumed"
  breakdown and an append-only proof sketch in the Khipu section, an organ
  construction-discipline + status-honesty discussion, an evaluation summary table
  (Table 3: dataset + corpus accounting) with a reproducibility note, and a
  Limitations & Open Problems section (L1–L5).

## 3. GitHub repository (PUBLIC)

- **URL:** https://github.com/szl-holdings/puriq-preprint
- **Visibility:** public (preprint is meant public per task).
- **Created with:** `gh repo create szl-holdings/puriq-preprint --public` (api_credentials=["github"]).
- **HEAD commit:** `d33a88cfc1e7b6a487a361a047dbc43d9635f2a8`
- **Branch:** `main`
- **Commit message trailers (verified):**
  - `Signed-off-by: Yachay <stephenlutar2@gmail.com>`
  - `Co-authored-by: Perplexity Computer Agent <agent@perplexity.ai>`
- **Push result:** `* [new branch] main -> main` (success).

### Files in the repo (verified via `gh api repos/.../contents`)

| File | Size | Purpose |
|------|------|---------|
| `main.tex` | 36,574 B | Preprint source |
| `main.pdf` | 480,154 B | Compiled 8-page PDF |
| `bibliography.bib` | 18,316 B | 72 primary-source references |
| `.zenodo.json` | 2,595 B | **At repo ROOT** — auto-mint metadata (verified present) |
| `README.md` | 3,858 B | Overview + DOI badge placeholder + auto-mint link |
| `ZENODO_AUTO_MINT_SETUP.md` | 3,049 B | GitHub–Zenodo auto-mint instructions |
| `CITATION.cff` | 1,557 B | Citation metadata |
| `LICENSE` | 18,657 B | CC-BY-4.0 full legal text |
| `.gitignore` | 70 B | Excludes LaTeX build artifacts |

`.zenodo.json` confirmed at root via
`gh api repos/szl-holdings/puriq-preprint/contents/.zenodo.json` → HTTP 200, base64
content decodes to the prepared metadata.

## 4. arXiv staging

- **Directory:** `puriq_preprint/arxiv_staging/` containing `main.tex`, `main.bbl`
  (pre-built so arXiv need not run BibTeX), `bibliography.bib`, and `00README.XXX`
  (control file: primary `cs.AI`, cross-list `cs.LO`/`cs.CR`).
- **Verification:** compiled `pdflatex ×2` using the shipped `main.bbl` only — 8 pages,
  0 undefined citations, 0 undefined references (mirrors arXiv AutoTeX).
- **Process doc:** `ARXIV_SUBMISSION_PROCESS.md` — step-by-step upload, classification,
  CC-BY-4.0 license, and the `cs.AI` **endorsement-request** process (founder action;
  documented, not faked).

## 5. Zenodo (auto-mint pattern — per founder correction)

The preprint repo ships `.zenodo.json` at root from day one and documents the
GitHub–Zenodo auto-mint pattern in `ZENODO_AUTO_MINT_SETUP.md` (no manual API mint).
DOI is assigned automatically when the founder toggles the repo ON in Zenodo and
publishes a GitHub release. See `ZENODO_AUTO_MINT_SETUP.md` (top-level) and Task 4.

## 6. Doctrine v11 LOCKED numbers — preserved verbatim

749 declarations / 14 unique axioms / 163 sorries (112 baseline + 51 Putnam); replay
hash `bacf5443…`; A2=IsHomogeneous, A4=IsBounded; SLSA L1; Λ-uniqueness = Conjecture 1;
concept DOI `10.5281/zenodo.19944926`. The paper states these verbatim and reports the
PURIQ additions as **net-new** (`SORRY_PURIQ_OPEN[24..27]`, **0 new axioms**).

---

**Status: COMPLETE.** Repo public and pushed; arXiv bundle staged & verified; Zenodo
auto-mint wired from day one. Remaining founder-only actions (arXiv upload + endorsement;
Zenodo OAuth + repo toggle) are documented above.
