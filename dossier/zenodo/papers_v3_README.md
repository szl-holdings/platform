# v3 — The Lutar Invariant (rewritten)

**Title:** *The Lutar Invariant: An Axiomatic Trust Aggregator with Egyptian-Fraction Weight Inspectability*
**Author:** Stephen Paul Lutar Jr. — `stephenlutar2@gmail.com` — ORCID [0009-0001-0110-4173](https://orcid.org/0009-0001-0110-4173)
**Date:** 2 May 2026
**Status:** Rewrite of the retracted preprint [10.5281/zenodo.19951520](https://doi.org/10.5281/zenodo.19951520). A new DOI will be minted automatically by Zenodo on the GitHub Release.
**Reference implementation:** [github.com/szl-holdings/ouroboros](https://github.com/szl-holdings/ouroboros) at commit [`5f6ee65`](https://github.com/szl-holdings/ouroboros/commit/5f6ee65) — full suite 172/172 tests passing.

## What's in this directory

| File | Description |
|---|---|
| `ouroboros-thesis-v3.pdf` | Camera-ready paper, 8 pages |
| `ouroboros-thesis-v3.md` | Source Markdown of the paper |
| `build_paper.py` | ReportLab build script that produces the PDF from scratch |
| `AUDIT.md` | Pre-publication audit of all SZL Holdings GitHub repos — what the paper can and cannot claim |

## What this paper does and does not claim

**Claims (all backed by code that runs on a fresh clone):**

- The aggregator Λ(**x**;**w**) = Π xᵢ^wᵢ over 9 axes with non-negative weights summing to 1.
- Four axioms (A1 monotonicity, A2 zero-pinning, A3 Egyptian inspectability, A4 page-curve concavity), each verified by explicit numerical witnesses in `packages/ouroboros/src/lutar-invariant-proof.test.ts` (22 tests, all passing).
- The Egyptian weight set [1/3, 1/3, 1/9, 6×(1/27)] sums to exactly 1 in rational arithmetic and is bit-exact reproducible across two computation paths.

**Does not claim:**

- A formal-logic proof in Lean / Coq — only numerical witnesses on finite test points.
- Third-party audit — the NYSTEC / Empire APEX engagement was procurement counseling, not certification.
- Deployed product — the seven SZL Holdings product repos (A11oy, Amaru, Sentra, Counsel, Terra, Vessels, Carlota Jo) are README-stage placeholders.
- Platform consumption — a fresh-clone audit on 2 May 2026 confirmed that the platform monorepo `szl-holdings/szl-holdings-platform` does not yet declare `@szl-holdings/ouroboros` as a dependency in any `package.json`.
- Empirical comparison study — none performed.

`AUDIT.md` documents the full audit methodology and findings.

## Reproducing the proof suite

```bash
git clone https://github.com/szl-holdings/ouroboros.git
cd ouroboros
git checkout 5f6ee65
pnpm install
pnpm exec vitest run packages/ouroboros/src/lutar-invariant-proof.test.ts
```

Expected output: 22 tests, 22 passed.

For the full runtime suite:

```bash
pnpm exec vitest run
```

Expected output: 172 tests across 6 files, all passing.

## Rebuilding the PDF from source

```bash
cd papers/v3
python build_paper.py
```

Produces `ouroboros-thesis-v3.pdf` from the embedded story. Requires `reportlab` and DejaVu Sans installed at `/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf` (standard on Debian/Ubuntu).

## Licence

The paper is released under CC BY 4.0. The reference implementation is licensed per its own repository.
