# THESIS v24 → v24.1 UPDATE REPORT

**Date:** 2026-06-08
**Author of update:** thesis-update subagent (delegated by parent)
**Deliverable status:** COMPLETE — files updated, recompiled, and pushed to `szl-holdings/szl-papers`. **Release NOT cut** (parent cuts it).

---

## 1. Recommended Release tag (for the parent to cut)

```
thesis-v24.1.0
```

Cutting a GitHub Release on this tag triggers the Zenodo DOI mint (concept DOI `10.5281/zenodo.19944926`). The pushed `.zenodo.json` carries `"version": "24.1.0"`.

---

## 2. Where everything was pushed

Repo: **`szl-holdings/szl-papers`** · branch `main` · path **`thesis/ouroboros/papers/v24/`**
(Convention matched: existing dirs are integer-version `v22`, `v23`; no `v24` existed, so `v24/` was created and the v24.1 *content* placed inside it. Staged file-naming `main.tex/main.pdf/main.md/README.md` preserved.)

| File | Remote | Result commit |
|------|--------|---------------|
| `main.tex` | `thesis/ouroboros/papers/v24/main.tex` | `6c0648b1ba` |
| `main.md`  | `.../v24/main.md`  | `2f8c2df3bc` |
| `main.pdf` | `.../v24/main.pdf` | `49e7411416` |
| `README.md`| `.../v24/README.md`| `6958946c51` |
| `refs.bib` | `.../v24/refs.bib` | `999eb46f44` |
| `.zenodo.json` | `.../v24/.zenodo.json` | `4153486673` |

All six confirmed present via the GitHub Contents API after upload.

Local authoritative copies live at `/home/user/workspace/thesis_v24/`.

---

## 3. PDF compile status (honest)

- **Tool:** local `./tectonic` v0.15.0. **Exit code 0.** Output `main.pdf` = 214.78 KiB, **24 pages**.
- **Citations fully resolved:** `grep "[?]"` on extracted text = **0** unresolved cites. New BKS refs render as `[8]` (arXiv:2107.07391), `[9]` (arXiv:2208.07083), with arXiv:2606.05221 and Aczél–Dhombres also present in the bibliography.
- **Warnings present but benign:** several `Underfull \hbox` (cosmetic spacing in tables), and a `TeX rerun seems needed, but stopping at 6 passes` / `main.bbl changed` note. I cleared stale `.aux/.bbl/.bcf` and recompiled from clean; the final PDF text shows the bibliography and all in-text citation numbers fully resolved (no `[?]`), so the rerun note did **not** leave dangling references. No `Overfull` errors, no undefined references in the rendered output.
- Markers verified in the PDF text: "CUT-1" ×31, "v24.1", "ba1050b7", corrected SLSA signoff line.

---

## 4. What changed (v24 → v24.1)

### main.tex (authoritative source, now ~1352 lines)
- Header/title/date → **v24.1**; running header "(v24.1)".
- Abstract: added the **v24.1 CUT-1 paragraph**; CUT-2 "merged at b910c276" reworded to "present at `main` `ba1050b7` (originally merged at `b910c276`)".
- Honesty note: added precise CUT-1 scoping; experimental tier now "~185 kernel-clean thms; drift 1323/23/307 at `ba1050b7`"; SLSA → "L1 honest with L2 build-attestation present".
- Intro: v24.1 refresh sentence + "what does not change" extended to state CUT-1 doesn't alter the false-unconditional verdict.
- Doctrine rules: rule 4 SLSA reworded; **new rule** precisely scoping CUT-1.
- **NEW `\section{...}\label{sec:cut1}`** (CUT-1): representation theorem (`thm:cut1`), step-by-step closure table (Waves 18–22), assembled chain, "How CUT-1 sharpens the conditional Λ result" (`thm:cut1sharp` = `cut1_sharp_conditional_lambda`, with `bisymmetry_is_redundant` + `slice_one_eq_one_of_sep`), the "sharp boundary" note, and an explicit **"What 'closed on its stated hypotheses' means — precisely"** is/is-not itemize, plus Sources.
- Frontier section: added Wave-15/16/17 (CF-22…CF-28) and Wave-18–22 subsections.
- Wave ledger table: extended to **Waves 11–22**.
- Drift gate: rewritten for `ba1050b7`, "unchanged since b910c276", EXPERIMENTAL_SCOPES note.
- SLSA §: corrected to "L1 honest, L2 build-attestation present" with the rest as roadmap.
- Appendix A.1 pinned-commits table: `main` row → Waves 11–22 @ `ba1050b7` + ~185 thms; added "Prior pin" row and "CUT-1 representation" row; CUT-2 row → `ba1050b7`.
- Appendix A.2 verify block: `git checkout ba1050b7`.
- Conclusion: added v24.1/CUT-1 advance + explicit "does not, and cannot, change" the Conjecture-1 verdict.
- Glossary: experimental tier line → `ba1050b7`.
- Final signoff block: SLSA wording corrected.
- `refs.bib`: added `bks2021` (2107.07391), `bks2022` (2208.07083), `bks2026` (2606.05221), `aczeldhombres1989`.

### main.md (faithful render, now 478 lines)
Mirrors all of the above: title v24.1; abstract CUT-1 paragraph; honesty note; intro; doctrine rules (renumbered 1–6); **new §4.7 CUT-1 section** (representation theorem 4.7, closure table, sharpening to Theorem 4.8 / `cut1_sharp_conditional_lambda`, "sharp boundary", is/is-not itemize, Sources); experimental-tier commit → `ba1050b7`; **new §6.7 (CF-22…28)** and **§6.8 (Waves 18–22 CUT-1)**; wave ledger extended to Wave 22; drift gate rewritten; SLSA corrected; limitations updated (+ CUT-1 line); conclusion updated; appendix A.1/A.2 + glossary updated; references list extended with BKS ×3 + Aczél–Dhombres.

### README.md (now 110 lines)
v24 → **v24.1**; added a **CUT-1 closed-on-hypotheses badge** and updated SLSA badge; new "**The v24.1 advance: CUT-1**" section with per-wave bullets; verification-tier table gains a CUT-1 row and updates pins to `ba1050b7` (~185 thms); honesty doctrine block adds CUT-1 scoping; verify block uses `git checkout ba1050b7` + `maxAgg_ne_Lambda`; **Cite** tag `thesis-v24.0.0` → **`thesis-v24.1.0`**; files table lists `.zenodo.json`.

### .zenodo.json (created — did not previously exist in thesis_v24/)
`"version": "24.1.0"`, `upload_type: publication / preprint`, Apache-2.0, author Stephen P. Lutar Jr. (ORCID 0009-0001-0110-4173, SZL Holdings), concept DOI `10.5281/zenodo.19944926` as `isVersionOf`, BKS arXiv IDs as `references`. Full description embeds the headline + CUT-1 advance + the binding honesty doctrine. Valid JSON (parsed).

---

## 5. Honesty-doctrine compliance — CONFIRMED

Every doctrine invariant was preserved verbatim across all four artifacts:

- **locked-proven = EXACTLY 5** {F1,F11,F12,F18,F19} @ `c7c0ba17` (749/14/163). Never inflated. CUT-1 work is explicitly tiered *experimental* and **never folded into the locked-5**.
- **Λ UNCONDITIONAL uniqueness stays Conjecture 1**, machine-checked **FALSE** via `maxAgg_ne_Lambda` (maxAgg/min counterexamples). Stated everywhere; the new CUT-1 section explicitly says CUT-1 "does not, and cannot" discharge it.
- **CUT-1 wording is precise:** documents state CUT-1 = the quasi-arithmetic **representation** theorem is complete on its stated hypotheses, and it **strengthens the CONDITIONAL** Λ-uniqueness result (`cut1_sharp_conditional_lambda` on {A1–A5}+separability+slice-multiplicativity+slice-monotonicity, bisymmetry dropped as redundant, unit-normalization dropped). **No claim** anywhere that CUT-1 makes Λ unconditional.
- **Experimental CI-green tier** ~185 thms; drift baseline **1323/23/22/307 unchanged** at the experimental layer; kept SEPARATE from locked-5.
- **SLSA:** "L1 honest / L2 build-attestation present"; "L2-verified + L3 + FedRAMP + Iron Bank + CMMC = roadmap". Corrected the old "L2 roadmap" phrasing per the new true state.
- **Byzantine BFT = Conjecture 2** (Wave-13 quorum result labeled a non-Byzantine shadow). DPO `klDivergence`/`pinsker` false-as-stated; CF-22 noted as *conditional simplex-only* repair, CF-23 as full binary Pinsker.
- No fabricated results, no fake citations (all new cites are real arXiv IDs / the Aczél–Dhombres Cambridge book), 0 runtime CDN.

---

## 6. CUT-1 wording precision — CONFIRMED PRECISE/HONEST

The is/is-not framing appears identically in main.tex (`sec:cut1`) and main.md (§4.7):
- **IS:** representation theorem complete on stated checkable hypotheses; (B) and (C-order) residuals **derived, not assumed/axiomatised**; sharpens the conditional Λ theorem to its weakest checkable hypothesis set.
- **IS NOT:** does not make Λ unconditional; the unconditional conjecture stays open and machine-checked false; the `maxAgg_ne_Lambda` counterexample is untouched.

Per-wave attribution matches the wave reports: Wave18 forward fragment (PR#208), Wave19 BKS density engine (PR#209), Wave20 primitives (PR#210), Wave21 (B) residual via monotone-extension light route (PR#211), Wave22 derived (C-order) gap-shift + `cut1_sharp_conditional_lambda` (PR#212). All Wave 18–22 `#print axioms ⊆ {propext, Classical.choice, Quot.sound}`, no sorry, no new axiom, drift unchanged.

---

## 7. Action required from parent

1. Verify the pushed files at `thesis/ouroboros/papers/v24/` look correct.
2. **Cut the GitHub Release on tag `thesis-v24.1.0`** (this, not the subagent, mints the permanent Zenodo DOI).
