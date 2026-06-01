# 220 — Code Section Deep Dive (Every Repo)

**Generated:** 2026-06-01 (EDT)
**Scope:** The actual **CODE** of all 20 directive repos — every `src/` tree, every test, every theorem-in-code reference, every doctrine number — read file-deep and run where possible.
**Method:** Fresh clones at `/home/user/workspace/szl/repos/<name>-fresh` (HEAD SHAs recorded per repo). Code walk via `code_walk.py`; thesis/doctrine grep + workflow consumption via `deep_analysis.py`; honesty + operational scoring via `build_scores.py`. Lean numbers regenerated with the **canonical** `.github/scripts/lean_numbers.py` at pinned SHA `c7c0ba1`. Operational checks run live (ouroboros self-test, vsp-otel + agi-forecast vitest).
**Sibling cross-ref:** This pass is the CODE-depth companion to **`190_PER_REPO_EVERY_TAB.md`** (tabs/routes/endpoints/HF-surface). Where 190 found a surface gap, this file states the underlying code/test/proof reality. Both agree on the four headline P0s (Λ-definition split, Lean number drift, rosie un-versioned source, red CI on shipped Spaces); this file adds the **in-code honesty verdicts**, **stale in-code numbers**, and **live test pass/fail counts**.
**Raw data:** `repos/code_walk_result.json`, `repos/deep_analysis_result.json`, `repos/scores.json`, `repos/ouroboros_selftest.log`.

---

## RETURN ANSWERS (headline)

- **Repos walked:** **20** (all directive repos; `platform` is the 7,378-file monorepo, deferred in depth to `180_PLATFORM_MONOREPO_EVERY_FILE.md` but its code tree was counted here).
- **Source files walked:** **5,863 code files / 1,693,847 LOC** across the 20 repos (platform alone = 4,195 files / 1.36 M LOC; the other 19 = 1,668 files / ~330 K LOC).
- **Tests:** **500 test files**. Live-run results where runnable: **ouroboros 32/32 self-tests PASS**; **vsp-otel 19/19 PASS**; **agi-forecast 30 FAIL / 92 pass (122 total)**; **lutar-lean build PARTIAL** (deps compile, sandbox timeout); platform/HF-Space repos have red CI on shipped surfaces.
- **Thesis-in-code references:** **2,929 hits** across 20 repos (REF 2,952 / SORRY 212 / LEAN_DECL 51 across raw grep including platform; per-repo de-duped in matrix). Concentrated in `a11oy (713)`, `ouroboros-thesis (654)`, `ouroboros (351)`, `lutar-lean (346)`, `.github (278)`.
- **Overstatements found:** **3 material** (the SLSA-L3 workflow-name vs honest-L1 TRUST.md split; the `OUROBOROS_RUN_ALL.py` "25 modules" in-code comment vs 32 actual; the HERO_VIDEO "30/30 modules"). Plus **1 number-drift cluster** (lutar-lean 752/749/626 declaration counts). The bulk of thesis-in-code references are **honest/self-disclosing** (sorry counts, TH10→Conjecture downgrade, Bekenstein→DPI relabel all stated in code/comments).
- **Operational blockers (P0):** **4** — (1) agi-forecast tests broken (`runEnsemble` not exported); (2) lutar-lean Lake-build gate red; (3) rosie live Gradio source absent from GitHub; (4) red CI on shipped Spaces (a11oy/sentra/vessels/ouroboros).
- **Deliverable path:** `/home/user/workspace/szl/audit_2026-05-30_cursor_offline/round2/full_reaudit_2026-05-31/220_CODE_SECTION_DEEP_DIVE.md`

---

## MASTER MATRIX — 20 repos × code reality

| # | Repo | HEAD | src files | LOC | langs (top) | test files | tests run | cov | wf | consumes org-reusable | thesis refs | doctrine hits | honesty | operational | top issue |
|---|------|------|----------:|----:|-------------|-----------:|-----------|-----|---:|---|----------:|----:|---------|-------------|-----------|
| 1 | **a11oy** | 9b17643 | 322 | 66,786 | TS,Py,JS | 57 | not run (HF Docker) | n/a | 18 | ✅ | 713 | 104 | honest (refs disclose TH10/Bekenstein) | **PARTIAL** | banned-token Doctrine gate **RED** |
| 2 | **amaru** | 51b0fc2 | 157 | 25,563 | TS,Py | 13 | not run | n/a | 9 | ✅ | 75 | 14 | honest | **Y** | live `/chakra/dinn` not in GitHub set |
| 3 | **sentra** | a87e8d3 | 426 | 78,067 | TS,JS,Py | 15 | not run | n/a | 10 | ✅ | 64 | 14 | honest | **PARTIAL** | container-build + hf-sync CI **RED** |
| 4 | **vessels** | 0c6fa3f | 330 | 74,660 | TS,JS | 5 | not run | n/a | 10 | ✅ | 91 | 16 | honest | **PARTIAL** | Tests + DCO CI **RED**; only 5 test files for 330 src |
| 5 | **rosie** | 22bb5f7 | 97 | 10,600 | TS,Py | 27 | not run | n/a | 9 | ✅ | 106 | 7 | honest | **PARTIAL** | Gradio `app.py` lives ONLY on HF |
| 6 | **uds-mesh** | e3a80eb | 9 | 3,204 | Py,TS | 6 | not run | n/a | 8 | ✅ | 57 | 3 | honest | **Y** | schema lib, no UI (by design) |
| 7 | **vsp-otel** | 16447bc | 20 | 2,189 | TS,JS | 5 | **19/19 PASS** (runtime) | exporter only | 7 | ✅ | 37 | 3 | honest | **Y** | root `test/` 4 files NOT wired into `pnpm test`; `server.ts` untested; `.zenodo.json` missing |
| 8 | **lutar-lean** | c7c0ba1 | 99 | 13,759 | Lean | 0 | build PARTIAL | n/a | 11 | ✅ | 346 | 21 | honest-but-**number-drift** | **PARTIAL** | README 752/15/160 vs canonical **749/14/163** |
| 9 | **ouroboros** | 98efa13 | 91 | 31,373 | TS,Sh | 23 | **32/32 self-test PASS** | n/a | 10 | ✅ | 351 | 28 | honest | **Y** | `RUN_ALL.py` header says "25 modules" (actual 32) |
| 10 | **ouroboros-thesis** | f96b671 | 36 | 8,980 | Lean,Py,TS | 1 | not run | n/a | 11 | ✅ | 654 | 25 | **exemplary** (TH10/Bekenstein downgrades stated) | **Y** | — (paper substrate) |
| 11 | **agi-forecast** | a9ad59f | 22 | 4,726 | TS | 5 | **30 FAIL / 92 pass** | — | 7 | ✅ | 30 | 7 | honest | **N** | `runEnsemble` not exported → 4 test files fail |
| 12 | **szl-trust** | e5f938f | 0 | 0 | (receipts JSON) | 0 | n/a | n/a | 6 | ✅ | 10 | 1 | n/a | **N/A** | 0 releases; DOI-title gate **RED** |
| 13 | **szl-cookbook** | 1aadb2e | 31 | 3,117 | TS,Sh,Lean | 4 | not run | n/a | 8 | ✅ | 152 | 30 | honest | **Y** | recipe content; renders in a11oy console |
| 14 | **szl-brand** | 8dc5c86 | 22 | 4,772 | Py,Sh | 4 | not run | n/a | 7 | ✅ | 101 | 11 | honest | **Y** | asset generators |
| 15 | **counsel** | c98571d | 0 | 0 | (docs) | 0 | n/a | n/a | 5 | ✅ (dco **@main**) | 1 | 0 | n/a | **N/A** | scaffold; reusable-dco pinned `@main` not SHA |
| 16 | **terra** | 2e6ad2f | 0 | 0 | (docs) | 0 | n/a | n/a | 4 | ✅ (dco **@main**) | 1 | 0 | n/a | **N/A** | scaffold; reusable-dco pinned `@main` not SHA |
| 17 | **carlota-jo** | 1c47148 | 0 | 0 | (docs) | 0 | n/a | n/a | 4 | ✅ (dco **@main**) | 1 | 0 | n/a | **N/A** | scaffold; reusable-dco pinned `@main` not SHA |
| 18 | **platform** | 90ad450 | 4,195 | 1,363,701 | TS,Py,JS | 335 | CI red (see 180) | — | 21 | N/A (monorepo) | 147 | 285 | see 180 | **PARTIAL** | CI/Tests/Build all **RED** (covered in 180) |
| 19 | **.github** | 1d184d8 | 5 | 2,349 | Py,HTML,Lean | 0 | `lean_numbers.py` runs | n/a | 22 | N/A (source of reusables) | 278 | 47 | honest TRUST.md, **but** slsa.yml named "L3" | **Y** | TRUST.md Lean numbers stale; slsa.yml "L3" vs TRUST "L1" |
| 20 | **demo-repository** | 13572bf | 1 | 1 | HTML | 0 | n/a | n/a | 2 | ❌ | 0 | 0 | n/a | **N/A** | archived template (10 files) |
| | **TOTAL** | | **5,863** | **1,693,847** | | **500** | | | | | **2,929** | **726** | | | |

`consumes org-reusable` = the repo's `.github/workflows/*.yml` contains `uses: szl-holdings/.github/.github/workflows/reusable-*.yml@<ref>`. **17/18 source repos consume them** (demo-repository does not; platform and .github are excluded as monorepo/source).

---

## CROSS-REPO AGGREGATIONS

### P0 — Thesis-in-code overstatement list

1. **lutar-lean `Uniqueness.lean` framing of TH10.** Lines 9–11 read *"The statements below are now `theorem` declarations, replacing the former `axiom`"*, yet the core `theorem lutar_is_geomean` (line 117) **carries a `sorry`** (`CAUCHY_ND: Aczél 1966 Thm 5.1`). A reader skimming the file header could conclude TH10 is fully machine-checked. **Mitigation already in repo:** `Lutar/UnifiedLambda.lean:104-144` surfaces this honestly (*"carries a single `sorry`… status = SORRY. This file does NOT close that gap"*), and `README.md:49,112` discloses *"TH10 uniqueness is axiom-structured (not fully machine-checked)"*. **Verdict: SORRY_correctly_marked overall, but tighten the `Uniqueness.lean` header to say "theorem-shaped, depends on CAUCHY_ND `sorry`."** Consistent with `171_PER_VERSION_THEOREM_TABLE.csv` (TH10 status = **N**).
2. **`.github/.github/workflows/slsa.yml` is named "SLSA Level 3 Provenance"** and its comments say *"generates full SLSA Level 3 attestation"*, while `.github/TRUST.md:15` honestly states *"Provenance — SLSA Level 1 (honest)."* The org's own coordination doc (`CURSOR_CTO_PM_OPERATIONAL_PLAN.md:35`) confirms the intended truth is **"SLSA L1 (not L3)"**, and `CURSOR_MASTER_DIRECTIVE_FINAL_2026-05-30.md:435` lists *"SLSA L3 false claims removed"* as a still-PARTIAL gate (a11oy cleaned; 13 repos still carry the echo-stub). **Verdict: the workflow filename/labels overstate vs the honest TRUST.md → align the workflow name to "SLSA L1 → L3 roadmap" until `slsa-github-generator` actually runs at L3.**
3. **`HERO_VIDEO_STORYBOARD_v2.md:171` ships "SLSA L3 · OpenSSF 5.9 · 30/30 modules"** — both the SLSA-L3 claim (see #2) and the **"30/30 modules"** are wrong (actual self-test = **32/32**, verified live this pass). Marketing-surface overstatement.

> **Net honest-pattern finding:** the overwhelming majority of the 2,929 thesis-in-code references are **self-disclosing** — e.g. `ouroboros-thesis/CHANGELOG.md` openly logs *"TH10 downgrade — Theorem 1 → Conjecture 1"* and *"TH6 relabel — Bekenstein → DPI"*; `a11oy/docs/PROVENANCE.md:56` says TH10 *"should be described honestly"*; `lutar-lean/Lutar/Feynman/FeynmanLineage.lean` claims *"zero sorries, zero axioms"* **and that claim is verified true** (0 of each in that file). This is Doctrine-v10-grade honesty in code. The three items above are the residual overstatements.

### P0 — Doctrine stale-number list

| # | Number / claim | Where (in code) | Stale value | Canonical / actual | Source of truth |
|---|---|---|---|---|---|
| D1 | Lean **declarations** | `lutar-lean/README.md:34,70` | **752** | **749** | `.github/scripts/lean_numbers.py` @ `c7c0ba1` |
| D2 | Lean **axioms** | `lutar-lean/README.md:34,71` | **15** (raw) | **15 raw / 14 unique** (README only sometimes notes "14 unique") | canonical script: `axioms_raw=15, axioms_unique=14` |
| D3 | Lean **sorries** | `lutar-lean/README.md:34,43,72` | **160** (109 baseline + 51 Putnam) | **163 raw / 149 non-comment / 112 baseline + 51 Putnam** | canonical script @ `c7c0ba1` |
| D4 | `.github/TRUST.md` "Live numbers" | TRUST.md | **626 / 14 / 189** @ `3de37e5` | **749 / 14 / 163** @ `c7c0ba1` (and `main` has since moved to **749 / 14 / 169**) | canonical script |
| D5 | Ouroboros module count | `ouroboros/OUROBOROS_RUN_ALL.py:24,28` (header comments) | **"25 module self-test suites" / "25 modules inline"** | **32 modules** (live run: 32/32 GREEN) | live `python3 OUROBOROS_RUN_ALL.py` exit 0 |
| D6 | Module count (marketing) | `.github/coordination/HERO_VIDEO_STORYBOARD_v2.md:171` | **30/30 modules** | **32/32** | live run |

The canonical doctrine numbers **749 / 14 / 163 / 168** are *correct* where used (e.g. amaru/sentra/vessels README badges cite 749). The drift is concentrated in (a) the lutar-lean README's own figures (752/15/160), (b) the org TRUST.md (626/14/189), and (c) two in-code module-count comments (25, 30). **Putnam sorries = 51 verified exactly** (P_A1=1,P_A2=8,P_A3=0,P_A4=4,P_A5=6,P_A6=2,P_B1–B6=6,6,4,6,6,2). **Fix:** wire `lean_numbers.py` into a CI gate that fails on README/TRUST drift (the gate the prior audit flagged as red is exactly this), and update the two RUN_ALL/storyboard comments to 32.

### P0 — Operationality blockers list

1. **agi-forecast — tests broken.** `runtime` vitest: **30 failed / 92 passed (122 total)**, 4 of 5 test files red. Root cause: `runEnsemble is not a function` (the public ensemble entrypoint that `src/judges/ensemble.test.ts` and `judge_runner.test.ts` import is not exported / was refactored away), plus latency assertions (`total_latency_ms` expected > 0, got 0 in mock path). A public API is referenced by tests but not exported → untested+broken critical path. Confirms 190's "Tests failing."
2. **lutar-lean — Lake build PARTIAL.** With Mathlib v4.13.0 / Lean v4.13.0 pinned, `lake build` compiles dependencies to ~1613/4973 then hits the sandbox timeout; no *Lutar* module was observed failing, but the build does not complete in-sandbox, and the **Lake-build CI gate is red** (per 190). This is the same gate that would catch the number drift (D1–D4). 99 `.lean` files, 749 decls, 14 unique axioms, 163 sorries.
3. **rosie — live Gradio source not in GitHub.** The HF Space (`57a30395`) runs `app.py` + `rosie_dinn_tab.py` + `rosie_v2_additions.py` (11 tabs incl. DINN Lab); none are in `szl-holdings/rosie`. A reviewer cloning GitHub cannot rebuild the live console. The GitHub side is a TS API (10 `/v1/*` endpoints) + Lit widget (6 components) + a Python console *library* — not the served app.
4. **Red CI on shipped Spaces:** a11oy (Container build + GHCR push, **and** Doctrine banned-token gate), sentra (Container build + hf-sync), vessels (Tests + DCO), ouroboros (ClusterFuzzLite). "No fake green" (Doctrine §2) requires these green or the badges pulled.

**Operational greens proven this pass:** ouroboros (**32/32**, exit 0, stdlib-only), vsp-otel runtime (**19/19**). uds-mesh / ouroboros-thesis / szl-cookbook / szl-brand are non-interactive by design (schema lib / paper substrate / content / assets) and have no runnable UI to fail.

### P1 — Test-coverage gaps

- **vessels:** only **5 test files for 330 source files / 74,660 LOC** — the lowest test density in the org; 115 routes ship with near-zero front-end test coverage. **P1→P0 candidate** given it's a live Space.
- **vsp-otel:** the 4 substantive tests in `test/` (`dpi_soundness`, `lean_binding_drift`, `relay_latency`, `scitt_mask_entropy`) are **not wired into `pnpm test`** (which only runs `runtime/src/exporter.test.ts`). `server.ts` (the raw `http.createServer` entrypoint) has **no test**. So the "19/19 pass" is exporter-only; the gate-binding tests never run in CI as configured.
- **lutar-lean:** **0 `.test.ts`/`.spec` files** — verification is the Lean kernel itself (`lake exe check`, `lake exe ref_vectors` against 10 golden vectors). Acceptable for a proof repo, but means the only "test" is the build, which is currently red.
- **ouroboros:** 23 TS `.test.ts` files exist but could not be run here (disk-full in sandbox); the Python `OUROBOROS_RUN_ALL.py` covers 32 modules and passes. The TS vitest suite status is unverified this pass.
- **sentra (15 tests / 426 src), amaru (13 / 157):** moderate density; not run (Docker/HF served).

### P1 — Workflow pinning drift (DRIFT-2 follow-up)

Org-reusable workflows (`reusable-codeql/dco/dependency-review/docs-ci/gitleaks/node-ci/release-please/sbom/scorecard/secret-scan/trivy/workflow-lint` — **12 reusables in `.github/.github/workflows/`**) are consumed by **17/18 source repos** — good "single source of truth" compliance. References are **mostly pinned by full 40-char SHA** (`@c8359e5…`, `@f0961db…`), which is correct supply-chain practice. **DRIFT:** the three scaffold repos **counsel / terra / carlota-jo** pin `reusable-dco.yml@main` (unpinned branch ref). **Fix:** repin to the current `.github` SHA.

---

## PER-REPO SECTIONS (code-depth)

### 1. a11oy — TS governance console + Lean-gate blueprints
- **Code:** 322 files / 66,786 LOC. TS-dominant (287) + Python (20 — e.g. `a11oy_v19_opus48_substrate.py` blueprint) + JS (7). 57 test files (highest of the Space repos). Key deps: react, react-dom, vite, vitest, zod.
- **Dep graph:** `web/packages/a11oy-core/src/governance/` (lid-check, gates) imports Lean obligations by reference (comments cite `Lutar/DPOFeasibility.lean §LIDPreservation`, TH12.1a–d). `packages/policy/src/gates/` maps **30 formula gates** to `*_gate.ts` ↔ Lean files (`bekensteinSoundness_gate.ts → Lutar/BekensteinSoundness…`).
- **Thesis-in-code:** 713 refs (most in org) — TH10/TH12, Bekenstein, Khipu, Reidemeister, Kitaev, DSSE. `docs/FORMULA_GATES_30_README.md` claims "20 gates with 0 sorry in the gate's own Lean file" — **scoped, honest** (per-gate not whole-repo). `docs/PROVENANCE.md` explicitly says TH10 "should be described honestly."
- **Doctrine:** 104 hits — Mythos (74, trademark-attributed to Anthropic), SLSA L1 (6) + SLSA L3 (3) [**check the 3 L3 refs against #2 above**], 749 (4), 168 (4).
- **Operational:** PARTIAL — vite/vitest build present; **HF Docker Space live (`e332d9d`) ships 170 console components vs 12 GitHub-wired routes** (190's gap); **banned-token Doctrine gate RED (P0)**.

### 2. amaru — FastAPI chakra sidecar + React conduit SPA
- **Code:** 157 files / 25,563 LOC (TS 97, Py 54). 13 tests. Deps: fastapi, pydantic, uvicorn, react, vite, vitest.
- **Dep graph:** `sidecar/src/amaru/app.py` (FastAPI, 15 endpoints; live adds `/chakra/dinn`) + 7 chakra kernels (root→crown) + `web/` conduit SPA (49 routes).
- **Thesis-in-code:** 75 refs. **Doctrine:** 14 (168×8, 749×3, SLSA L1×2). **Operational:** **Y** — HF Space `d468631` live, CI green, `HONEST_DISCLOSURE.md` shipped.

### 3. sentra — admission-control console + FastAPI gates
- **Code:** 426 files / 78,067 LOC (TS 342, JS 57, Py 18). 15 tests. Deps: fastapi, pydantic, uvicorn, react, vite, vitest, zod.
- **Dep graph:** `serve.py` + `sidecar/` (16 FastAPI endpoints `/api/sentra/v1/*`) + `web/` SPA (17 routes, compiled to `console/index.html`).
- **Thesis:** 64. **Doctrine:** 14 (749×4, 163×4, 168×3). **Operational:** PARTIAL — HF Space `c6381c83` live; **Container build + hf-sync CI RED** → live may lag GitHub.

### 4. vessels — maritime-intelligence SPA (largest UI)
- **Code:** 330 files / 74,660 LOC (TS 177, JS 147). **Only 5 test files (P1 coverage gap).** Deps: react, react-dom, vite, vitest.
- **Dep graph:** `web/` SPA (115 routes) + `api/main.py` (1 endpoint). 171 stub files shipped live.
- **Thesis:** 91. **Doctrine:** 16 (168×9, 749×4, 163×2). **Operational:** PARTIAL — HF Space `21b28cc9` live; **Tests + DCO CI RED (P0)**.

### 5. rosie — operator console (TS API in GitHub; Gradio app on HF)
- **Code:** 97 files / 10,600 LOC (TS 68, Py 24). 27 tests (good density). Deps: express, hono, lit, vite, vitest, zod.
- **Dep graph (GitHub):** `packages/api/src/routes/` (about, ask, doctrine, execute, formulas, mesh, receipts → 10 `/v1/*`) + Lit widget (6 components) + `src/console/*` Python library.
- **Thesis:** 106. **Doctrine:** 7. **Operational:** PARTIAL — **the served Gradio app (`app.py`, `rosie_dinn_tab.py`, `rosie_v2_additions.py`, 11 tabs) is ONLY on HF Space `57a30395` (P0)**; GitHub cannot rebuild it. Fuzz CI red; `.zenodo.json` missing.

### 6. uds-mesh — Pepr governance-receipt schema library
- **Code:** 9 files / 3,204 LOC (Py 7, TS 1, Sh 1). 6 tests. **Dep graph:** Pepr governance-receipts (TS) + OTel span schemas. **Thesis:** 57 (DSSE/Cardano/Reidemeister in schema docstrings). **Operational:** **Y** — schema lib, no UI by design; dataset `uds-mesh-source`.

### 7. vsp-otel — OpenTelemetry anchor-formula exporter
- **Code:** 20 files / 2,189 LOC (TS 18, JS 2). 5 test files. Deps: vitest, zod.
- **Dep graph:** `runtime/src/exporter.ts` (injectAnchorFormula, axesFromSpan, spanHash, signSpan, exportSpans) + `server.ts` (raw http, **untested**) + 5 formula emitters (adversarialRobustness, falsePosition, liuHuiPi, madhavaBound, summationInvariant) + `src/` gates (dpi_soundness/TH6, scitt_mask_entropy, relay_latency).
- **Tests RUN this pass:** `pnpm -C runtime test` → **19/19 PASS** (exporter.test.ts only). **The 4 root `test/` files are not wired into the test script** (P1). `server.ts` has no test.
- **Thesis:** 37. **Doctrine:** 3. **Operational:** **Y** (exporter), but `.zenodo.json` missing despite README DOI badge `zenodo.20424995`.

### 8. lutar-lean — Lean 4 / Mathlib proof substrate
- **Code:** 99 `.lean` files / 13,759 LOC (95 under `Lutar/`, 4 under `TH8/lean_v2/`: GLR, GradedSemiring, LinearReceipt, StrongMonadIdentity). Lean `v4.13.0`, Mathlib pinned `v4.13.0`. Entry `Lutar.lean` imports 60+ modules; `Main.lean` = `lake exe check`, `MainRef.lean` = `lake exe ref_vectors` (10 golden vectors, k=9).
- **Canonical numbers (script @ `c7c0ba1`):** **749 declarations, 15 raw axioms / 14 unique, 163 raw sorries (149 non-comment, 112 baseline + 51 Putnam).** 14 unique axiom names incl. `lambda_stationary_unique`, `lambda_schur_concave_n_axis`, `sha256`, `sha256_collision_resistant`, `pinsker`, `klDivergence_nonneg`, `liu_hui_pi_converges`, `audit_reidemeister_invariance`.
- **Thesis-in-code honesty:** 346 refs. **TH10 (`lutar_is_geomean`/`lutar_unique`) = SORRY_correctly_marked** — theorem-shaped but depends on `CAUCHY_ND` sorry; disclosed in `UnifiedLambda.lean` + README. `FeynmanLineage.lean` "zero sorries, zero axioms" claim **verified true**. Putnam **51 sorries verified exactly**, "0/12 proved, 12/12 skeletoned" accurate.
- **Doctrine:** 21 (zero-sorry×15 [all module-scoped/correct], SLSA L3×2, SLSA L1×1, zero-axiom×1 [verified]).
- **Operational:** PARTIAL — `lake build` compiles deps then sandbox-times-out; **Lake-build CI gate RED**. **Number drift D1–D4 is the top issue.**

### 9. ouroboros — TS runtime + agentic + 1.4 MB self-test runner
- **Code:** 91 files / 31,373 LOC (TS 86). 23 `.test.ts` files. Deps: react, vitest, zod. `runtime/` dirs: bekenstein, category, closure, glr, lambda-gate, types. `.clusterfuzzlite/fuzzers/fuzz_receipts.js` (Jazzer.js).
- **Tests RUN this pass:** **`python3 OUROBOROS_RUN_ALL.py` → 32/32 modules GREEN, exit 0** (stdlib-only). TS vitest not run (disk-full).
- **Thesis:** 351. **Doctrine:** 28 (Mythos×24, 749×2). **In-code stale number:** header comments say "25 modules" (D5) — actual 32.
- **Λ inconsistency (P0, shared with 190):** fuzzer `computeLambda()` uses **MIN reduction**; evidence ledger `LUTAR_EVIDENCE.md` uses **weighted geo-mean**; lutar-lean kernel uses **unweighted geo-mean**. Three distinct definitions. **Operational:** **Y** (Python runner); ClusterFuzzLite + Release-Please + DOI-gate CI red.

### 10. ouroboros-thesis — paper/LaTeX substrate (exemplary honesty)
- **Code:** 36 files / 8,980 LOC (Lean 16, Py 12, TS 6). 28 releases (`paper-v18-1.0.0`). **Thesis:** 654 refs. **In-code honesty is exemplary:** `CHANGELOG.md` logs *"TH10 downgrade — Theorem 1 → Conjecture 1 (§3.3)"* and *"TH6 relabel — Bekenstein → DPI"*; `PR_BODY_V12.md` notes *"Theorem 1 (uniqueness) — proof scaffolded, `sorry`-counted in CI."* **Operational:** **Y** (build_paper.py per version). Matches `170/171` cross-ref (v18 = 99-block ledger; v18 Zenodo PDF carries v17 body — a Zenodo-binary issue, not a code issue).

### 11. agi-forecast — PAC-Bayes forecast judges (TESTS BROKEN)
- **Code:** 22 files / 4,726 LOC (TS). 5 test files. Deps: openai, vitest, zod. `runtime/src/judges/` ensemble + judge_runner; scripts `run_putnam.ts`/`run_putnam_v2.ts`.
- **Tests RUN this pass:** **30 FAIL / 92 pass (122 total); 4 of 5 files red.** `runEnsemble is not a function` (export removed/renamed) + latency-mock assertions. **Operational: N (P0).**
- **Thesis:** 30. **Doctrine:** 7 incl. one *"fully verified"* — but it's a **prompt string** instructing judges to treat GREEN Lean proofs as verified (`ensemble.ts:40`), **not a repo-level claim** → acceptable.

### 12. szl-trust — Covenant-Proof run-receipt artifacts
- **Code:** 0 source files — only `runs/E4-codex-kernel-2026-04-29/*.json(l)` ledgers (decision_receipt, proof_ledger, trace, version_lineage, etc.) + CI scaffolding. **Thesis:** 10 (in receipts). **Operational: N/A.** **0 releases; DOI-title gate RED; no CHANGELOG/AGENTS.md.**

### 13. szl-cookbook — recipe markdown + TS render + 2 Lean
- **Code:** 31 files / 3,117 LOC (TS 17, Sh 12, Lean 2). 4 tests. **Thesis:** 152, **Doctrine:** 30 (Mythos×22). **Operational: Y** — content renders in a11oy console Cookbook components.

### 14. szl-brand — visual-identity asset generators
- **Code:** 22 files / 4,772 LOC (Py 20). 4 tests. **Thesis:** 101, **Doctrine:** 11. **Operational: Y** — Python generators → SVG/logos; dataset `szl-visual-identity`.

### 15–17. counsel / terra / carlota-jo — docs-only scaffolds
- **Code:** 0 source files each — `docs/charter.md`, governance files, CI scaffold, `social-preview.svg`. "Implementation pending" by design. **Each pins `reusable-dco.yml@main` (unpinned — P1 fix).** **Operational: N/A** (no UI by design — matches 190).

### 18. platform — the 7,378-file monorepo
- **Code:** 4,195 code files / 1,363,701 LOC (TS 3,892, Py 153, JS 89, Sh 47). 335 test files. **Thesis:** 147, **Doctrine:** 285 (168×111, Mythos×86, 163×36, 456×24, Bo11y×21, "fully verified"×4). Does **not** consume org-reusable workflows (it's the monorepo with 21 of its own). **Operational: PARTIAL — CI/Tests/Build all RED.** Full file-level analysis in **`180_PLATFORM_MONOREPO_EVERY_FILE.md`**.

### 19. .github — org community + reusable-workflow source
- **Code:** 5 code files / 2,349 LOC incl. `.github/scripts/lean_numbers.py` (the canonical counter — **runs correctly**, clones + counts), `doctrine/V7.lean`, `doctrine/checker.ts`. Hosts **12 reusable workflows + standalone** (22 total). **Thesis:** 278, **Doctrine:** 47 (SLSA L3×20 [the slsa.yml workflow — see overstatement #2], SLSA L1×13, 749×5). **Operational: Y.** **TRUST.md Lean numbers stale (626/14/189 — D4); slsa.yml labeled "L3" vs TRUST "L1" honest; no CHANGELOG.**

### 20. demo-repository — archived template
- **Code:** 1 file (`index.html`) + `package.json` + community files. 2 workflows (auto-assign, proof-html). Does not consume org-reusable. Archived/private. **Operational: N/A.**

---

## FOUNDER ACTION LIST (top 10)

1. **Fix agi-forecast tests (P0).** Export `runEnsemble` (it's imported by `ensemble.test.ts`/`judge_runner.test.ts` but missing) and fix the `total_latency_ms > 0` mock path. 30 failing tests → green. *Repo: agi-forecast.*
2. **Reconcile all Lean numbers to canonical 749 / 14-unique / 163 (P0).** Update `lutar-lean/README.md` (752→749, 160→163, 109→112), `.github/TRUST.md` (626/14/189 → 749/14/163), and re-run after any push. *Repos: lutar-lean, .github.*
3. **Wire `lean_numbers.py` into a failing CI gate and fix the red Lake-build (P0).** This single gate prevents future number drift and is the root cause of #2 going unnoticed. *Repo: lutar-lean.*
4. **Commit the rosie Gradio source to GitHub (P0).** `app.py`, `rosie_dinn_tab.py`, `rosie_v2_additions.py` — the live 11-tab console must be rebuildable from `szl-holdings/rosie`. *Repo: rosie.*
5. **Declare ONE canonical Λ in Doctrine v7 and align all three call sites (P0).** lutar-lean kernel = unweighted geo-mean; evidence ledger = weighted geo-mean; ouroboros fuzzer = MIN. Pick one; make the fuzzer + ledger cite the kernel formula. *Repos: ouroboros, lutar-lean.*
6. **Green or pull the red CI badges on shipped Spaces (P0, Doctrine §2).** a11oy banned-token + container build; sentra container + hf-sync; vessels Tests + DCO; ouroboros fuzzing. *Repos: a11oy, sentra, vessels, ouroboros.*
7. **Rename `.github/.github/workflows/slsa.yml` to honest "SLSA L1 → L3 roadmap" (P0 honesty).** And fix `HERO_VIDEO_STORYBOARD_v2.md` "SLSA L3 · 30/30 modules" → "SLSA L1 · 32/32 modules." *Repos: .github.*
8. **Update the two in-code module-count comments to 32 (P1).** `OUROBOROS_RUN_ALL.py:24,28` say "25 modules"; the runner actually self-tests 32 (verified 32/32 GREEN). *Repo: ouroboros.*
9. **Wire vsp-otel's 4 gate tests into `pnpm test` and add a `server.ts` test (P1).** Today only `exporter.test.ts` runs; the TH6/SCITT/relay/lean-binding gate tests never execute in CI. Add the missing `.zenodo.json`. *Repo: vsp-otel.*
10. **Raise vessels test density and repin the 3 scaffold DCO refs (P1).** vessels = 5 tests for 330 files / 115 live routes; counsel/terra/carlota-jo pin `reusable-dco.yml@main` (unpinned). *Repos: vessels, counsel, terra, carlota-jo.*

---

## Method notes / reproducibility
- Code walk: `python3 /home/user/workspace/szl/repos/code_walk.py` → `code_walk_result.json`.
- Thesis/doctrine grep + workflow consumption: `python3 /home/user/workspace/szl/repos/deep_analysis.py` → `deep_analysis_result.json`.
- Scores/matrix: `python3 /home/user/workspace/szl/repos/build_scores.py` → `scores.json`.
- Canonical Lean numbers: `python3 lutar-lean-fresh/.github/scripts/lean_numbers.py --repo-path .` (@ `c7c0ba1`).
- Live operational: `python3 ouroboros-fresh/OUROBOROS_RUN_ALL.py` (32/32, exit 0, log `repos/ouroboros_selftest.log`); `pnpm -C vsp-otel-fresh/runtime test` (19/19); agi-forecast `vitest run` (30 fail / 92 pass).
- Lean `lake build` left PARTIAL per the established `31_LEAN_BUILD_RESULT.md` verdict (sandbox timeout at ~1613/4973 dep compilation); not re-completed here to conserve budget/disk.
- Sandbox note: disk reached 100% during node installs; ouroboros TS vitest could not be run (its Python self-test passed). All temporary `node_modules` were removed.
