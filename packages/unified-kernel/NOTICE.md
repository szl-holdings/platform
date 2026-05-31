# NOTICE — @szl-holdings/unified-kernel

This package is distributed under **BSL 1.1** (Business Source License 1.1),
inherited from the `szl-holdings/platform` monorepo. (The package's own
`package.json` historically carried `Apache-2.0`; the platform-level license is
BSL 1.1 and governs the published artifact — see ARCH_ALIGNMENT_REPORT.md
Change 5 for the license-posture decision.)

The unified kernel composes work from several components carrying their own
licenses. Each is listed below with its license and attribution, as required.

## Apache License 2.0 components

- **Ouroboros Runtime** (`@szl-holdings/ouroboros`, git tag `v6.3.0`, commit
  `d64748cc9ad67296be296c1ef6752ae181413fd7`). Bounded-recursion agent-loop
  runtime; the kernel-source is vendored under
  `src/loop/vendor_ouroboros/` for offline boot and re-exported by `src/loop/`.
  Licensed under Apache License 2.0.
  © Stephen P. Lutar Jr. / SZL Holdings.

- **codex-kernel v1.0.2** (recovered from tag `v1.0.2-codex-kernel`). The four
  governance contracts in `src/codex/contracts.ts` (`computeTraceIdentity`,
  `auditSecrets`, `resolveVersionLineage`, `resolveDeploymentContract`).
  Licensed under Apache License 2.0.
  © Stephen P. Lutar Jr. / SZL Holdings.

## CC-BY 4.0 components (academic)

- **Ouroboros Thesis, v3–v18** — the academic theses whose formulas and Lean
  theorems are embodied as code in this kernel. Published on Zenodo with DOIs
  under **Creative Commons Attribution 4.0 International (CC-BY 4.0)**.
  Attribution: Stephen P. Lutar Jr. (ORCID 0009-0001-0110-4173). The
  `paper-to-receipt.ts` flow cites a thesis DOI as its input "paper".

## Formal-corpus reference

- **Lutar-Lean** — Lean 4 + Mathlib v4.13.0 formal kernel. Live canonical
  numbers @ `main` HEAD `3de37e5`: **752 declarations / 15 raw axioms (14
  unique) / 160 sorry tokens**. Source of truth:
  `szl-holdings/.github/.github/data/lean_numbers.json` (mirrored locally at
  `.github/data/lean_numbers.json`, read by `getCanonicalNumbers()`).
  Mathlib is licensed Apache License 2.0; the Lutar-Lean corpus © SZL Holdings.

## Standard-of-construction citations (no code copied)

The QEC, PAC-Bayes, Bekenstein, and Reidemeister primitives implement published
results and cite them; no third-party source code is copied:

- Hamming 1950 — DOI 10.1002/j.1538-7305.1950.tb00463.x
- Shor 1995 — DOI 10.1103/PhysRevA.52.R2493
- Steane 1996 — DOI 10.1098/rspa.1996.0136
- Calderbank–Shor 1996 — DOI 10.1103/PhysRevA.54.1098
- Kitaev 2003 — DOI 10.1016/S0003-4916(02)00018-0
- McAllester 2003 (PAC-Bayes) — DOI 10.1023/A:1021840411064
- Bekenstein 1981 (entropy bound) — DOI 10.1103/PhysRevD.23.287
- Reidemeister 1927 (knot moves) — DOI 10.1007/BF02952507

Attribution and license obligations for all of the above are preserved here per
the Operating Principle #7 (Attribution on Every Action).

Author: Stephen P. Lutar Jr. <stephenlutar2@gmail.com> (ORCID 0009-0001-0110-4173)
