# arXiv Submission Plan — Ouroboros Thesis v10 (EXHAUSTIVE-AUDIT)

**Document ID:** ARXIV-V10
**Author:** Stephen P. Lutar (SZL Holdings)
**Status:** Manuscript ready (`docs/thesis/v10-canonical.md` + `paper/v10/`). This document is the operator's submission checklist. (Replaces the v3-era checklist at `paper/ARXIV_SUBMISSION_CHECKLIST.md`.)

---

## 1. Why arXiv

1. **Citation surface.** A stable arXiv ID makes Λ₁₀ citable from external code and academic work.
2. **Priority date.** The Audit Closure Operator is original to v10; the arXiv timestamp establishes priority.
3. **Distribution.** arXiv pushes to Google Scholar, Semantic Scholar, ConnectedPapers, and the cs.SE / cs.AI mailing lists — exactly the audience for machine-verifiable software contracts.

## 2. arXiv mechanics

### 2.1 Account
- Author: Stephen P. Lutar Jr.
- Affiliation: SZL Holdings · United States
- Email: inquiries@szlholdings.com
- ORCID: `0009-0001-0110-4173` (already linked to existing arXiv submissions)

### 2.2 Categories
- **Primary:** `cs.SE` (Software Engineering) — Λ₁₀ is a contract-over-source-tree.
- **Cross-list (in priority order):**
  - `cs.AI` (Artificial Intelligence) — A11oy / agent-runtime context
  - `cs.LO` (Logic in Computer Science) — closure theorem is a 2-line constructive proof
  - `cs.CR` (Cryptography and Security) — implementation-chain attestation parallels supply-chain integrity
  - `math.LO` — optional secondary if cs.LO is rejected

### 2.3 License
- **CC-BY-4.0** (matches `szl-holdings/ouroboros-thesis` and the v9 deposit).

### 2.4 Required artefacts
- LaTeX source `.tex` compiled from `paper/v10/v10-canonical.md` via pandoc (see §3 below).
- Bibliography `.bib`: `paper/v10/references.bib`.
- Figures: none required (this is a contract-and-proof paper; the audit table in §3 of the canonical is rendered as plain markdown / LaTeX tabular).
- Compiled PDF preview for sanity check.

## 3. Manuscript prep

```bash
# From repo root
pandoc paper/v10/v10-canonical.md docs/thesis/v10-canonical.md \
  --from markdown \
  --to latex \
  --standalone \
  --bibliography paper/v10/references.bib \
  --citeproc \
  -o paper/v10/v10-canonical.tex
```

Then:

- [ ] Replace `\documentclass{article}` with arXiv-friendly `\documentclass[11pt]{article}`; single-column.
- [ ] Verify all references in `references.bib` resolve. **No fake references.** (Reused from v3 lesson.)
- [ ] Verify the closure-theorem proof (§2.4 of the canonical) renders correctly in LaTeX.
- [ ] Verify the abstract `paper/v10/v10-abstract.txt` is ≤ 1920 characters and ≤ 250 words.
  - Current count: see `wc -c paper/v10/v10-abstract.txt` (target ≤ 1920).
- [ ] Add an "Author contributions" section (single author — state explicitly).
- [ ] Add an "Availability" section listing:
  - Public source: `https://github.com/szl-holdings/szl-holdings-platform`
  - Thesis chain: `https://github.com/szl-holdings/ouroboros-thesis`
  - Live audit endpoint: `POST /api/ouroboros/lutar/v10`
  - Reference implementation: `packages/ouroboros-integrations/src/lutar-formulas.ts`
- [ ] Run `chktex` and fix any warnings.
- [ ] Run `pdflatex` twice + `bibtex` + `pdflatex` once more.
- [ ] Visual review of the compiled PDF.

## 4. Endorsement

The author has prior arXiv submissions in physical-sciences categories under ORCID `0009-0001-0110-4173`. For first-time submission to `cs.SE`, an endorsement may be required; if so, request from any cs.SE-active SZL collaborator or co-author of a recent cs.SE arXiv submission citing software-engineering methods.

## 5. Companion DOI (Zenodo)

The arXiv submission is mirrored to Zenodo via the `szl-holdings/ouroboros-thesis` GitHub release:

```bash
# In szl-holdings/ouroboros-thesis (separate repo)
mkdir -p papers/v10
cp paper/v10/v10-canonical.md   papers/v10/v10-canonical.md
cp paper/v10/v10-abstract.txt   papers/v10/v10-abstract.txt
cp paper/v10/CITATION.cff       papers/v10/CITATION.cff
cp paper/v10/.zenodo.json       papers/v10/.zenodo.json
cp paper/v10/references.bib     papers/v10/references.bib
cp docs/thesis/v10-canonical.md papers/v10/v10-canonical-full.md
cp docs/thesis/v10-essay.md     papers/v10/v10-essay.md
cp docs/thesis/v10-onepager.md  papers/v10/v10-onepager.md
git add papers/v10 && git commit -m "v10 deposit"
git tag -a paper-v10-1.0.0 -m "v10 — EXHAUSTIVE-AUDIT: Audit Closure Operator Λ₁₀"
git push origin main paper-v10-1.0.0
gh release create paper-v10-1.0.0 \
  --title "v10 — EXHAUSTIVE-AUDIT: The Audit Closure Operator Λ₁₀" \
  --notes-file papers/v10/v10-onepager.md \
  papers/v10/*
```

Zenodo's `szl-holdings/ouroboros-thesis` webhook then mints the DOI automatically. Update root `CITATION.cff` and `.zenodo.json` `identifiers:` once the DOI lands.

## 6. Style match against the existing chain

The v10 paper matches the style of `paper-v8-1.0.0` (last shipped Zenodo release) on five axes:

| Axis | v8 / v9 style | v10 style |
|---|---|---|
| Tone | Operational, no fabricated numbers | Operational, no fabricated numbers |
| Structure | Abstract → spec → proof → live results → API → files | Same 9-section cadence (see `docs/thesis/v10-canonical.md`) |
| License | CC-BY-4.0 | CC-BY-4.0 |
| Disclosure | Sourced URLs, IP statement | Sourced URLs, IP statement, plus an explicit "v10 makes no claims about physics" note |
| Convention | §5 of formula-thesis-gaps.md | §5 followed exactly: code + codex + api + test + thesis section + gap-report row |

## 7. Post-submission

- [ ] Watch the codex traversal endpoint (`/api/ouroboros/codex/traverse/lutar_v10`) for inbound external traffic.
- [ ] Open a tracking issue in `szl-holdings/ouroboros-thesis` for any reader-flagged corrections.
- [ ] Open the v11 changelog stub at `docs/thesis/v11-canonical.md` ONLY when a real new physical L-term is warranted. Do not pre-cut a v11.
- [ ] Archive this checklist under `docs/thesis/published/v10-checklist-completed.md` once everything above is checked, with the publication date and the arXiv ID + Zenodo DOI.
