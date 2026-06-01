# 190 — Per-Repo Exhaustive Tab/Route/Endpoint Re-Audit

**Generated:** 2026-06-01 (EDT)
**Scope:** Every repo in the `szl-holdings` GitHub org, walked file-tree-deep, every tab/route/endpoint/component extracted and cross-referenced to the live `SZLHOLDINGS` Hugging Face org.
**Method:** Fresh shallow clones (`--depth 50`) of all repos into `/home/user/workspace/szl/repos/<name>-fresh`, regex surface extraction, HF public-API cross-reference of live Space SHAs + shipped file trees.

> Founder directive ("go through each one by one all repos use agents get this done stop missing shit") — this pass walks **all 22 repos** (20 known + 2 discovered) and the **6 live HF Spaces + 30 datasets + 2 models**.

---

## CRITICAL CORRECTION — the GitHub↔HF naming + topology

- The GitHub org is **`szl-holdings`** (lowercase, hyphen).
- The Hugging Face org is **`SZLHOLDINGS`** (uppercase, no hyphen). `author=szl-holdings` returns **0** HF results — anyone querying the hyphenated name on HF sees nothing. Authenticated HF user is `betterwithage`.
- **HF Space git SHAs are independent of GitHub HEAD SHAs.** The live Spaces are deployed from separate HF-side git repos (or a CI sync), NOT directly from the GitHub default branch. Example: a11oy GitHub HEAD `9b17643…` vs live Space SHA `e332d9d…` — different lineages. This means "is it live on HF?" cannot be answered by SHA-equality; it must be answered by comparing shipped surfaces.

---

## Repo discovery (authoritative)

`gh repo list szl-holdings --limit 100` → **22 repos** (saved to `raw/repo_list_full.json`).

Beyond the 20 named in the directive, discovery surfaced **2 additional repos**:
- **`du-upstream-contributions`** (private) — staging for upstream Defense Unicorns (Pepr/Zarf/UDS) contributions.
- **`szl-uds-deployment`** (private, default branch `master`) — UDS running deployment (Warhacker 2026): k3d + uds-cli + Pepr DSSE receipt policy.

`demo-repository` (private, "Archived — internal template repository") is present and was walked (10 files, near-empty).

---

## MASTER TABLE — 22 repos

| # | Repo | Branch | Files | Routes | gr.Tab | API endpoints | Components/Exports | Workflows (defined / nonpass-latest) | Releases | Open PRs | Merged PRs | Live HF surface | Gap vs HF |
|---|------|--------|------:|-------:|-------:|--------------:|-------------------|---|-------:|-------:|-------:|---|---|
| 1 | **a11oy** | main | 605 | **17** (12 app + 5 console) | 0 | 0 | live ships **170** console components | 19 / 2 fail | 6 | 1 | 162 | Docker Space `e332d9d` | **HF ships 170 components; GitHub `web/src/App.tsx` only wires 12 routes — live console is built/served from a tree not fully in GitHub** |
| 2 | **amaru** | main | 273 | **49** | 0 | **15 FastAPI** (live: **16**, adds `/chakra/dinn`) | sidecar chakra kernels (7 chakras) | 11 / 0 | 5 | 1 | 92 | Docker Space `d468631` (conduit SPA + sidecar) | Live adds `/chakra/dinn` endpoint not in GitHub enumerated set |
| 3 | **sentra** | main | 559 | **17** | 0 | **16 FastAPI** | console SPA (compiled to single `console/index.html` on HF) | 12 / 2 fail | 5 | 1 | 99 | Docker Space `c6381c83` (landing + console + forecasts) | Container-build + hf-sync workflows failing; live serves compiled bundle |
| 4 | **vessels** | main | 415 | **115** | 0 | 1 (`api/main.py`) | web SPA (191 files live) + 171 stubs | 11 / 2 fail (**Tests + DCO failing**) | 4 | 1 | 93 | Docker Space `21b28cc9` (web SPA + api) | Tests & DCO red; 115 routes shipped via compiled web bundle |
| 5 | **rosie** | main | 156 | 0 (TS API + Lit widget) | **6 top tabs + 4 sub-tabs + DINN Lab** (live `app.py`) | **10 API endpoints** (`/v1/*`) | 6 widget components | 12 / 1 fail (**Fuzz failing**) | 4 | 1 | 74 | Docker Space `57a30395` (Gradio) | **P0: the Gradio app source (`app.py`, `rosie_dinn_tab.py`, `rosie_v2_additions.py`) is ONLY on HF — NOT in GitHub** |
| 6 | **uds-mesh** | main | 40 | 0 | 0 | 0 | Pepr governance-receipts (TS) + span schemas | 9 / 1 fail (Release Please) | 2 | 0 | 59 | No own Space (dataset `uds-mesh-source`) | No interactive Space (by design — schema lib) |
| 7 | **vsp-otel** | main | 50 | 0 | 0 | 0 (HTTP server, no routed framework) | OTel exporter + **5 anchor-formula spans** + 3 src gates | 8 / 0 (incl. **fuzz.yml**) | 1 (`v0.1.0`) | 0 | 51 | No Space (dataset `vsp-otel-source`) | **Missing `.zenodo.json`** despite README DOI badge `zenodo.20424995`; **`server.ts` has no test** |
| 8 | **lutar-lean** | main | 135 | 0 | 0 | 0 | **99 `.lean` files** (95 Lutar/ + 4 TH8/), 2 exes | 12 / 1 fail (**Lake build failing**) | 2 (`lutar-v18.0.0`) | 0 | 106 | No Space (datasets `lutar-lean-source`, `lean-theorem-tree`) | **P0: published Lean numbers disagree across 3 sources (see §Lean)** |
| 9 | **ouroboros** | main | 176 | 0 (3 React glyph comps) | 0 | 0 | runtime (6 dirs) + agentic + **1 fuzz target** | 12 / 3 fail (**Fuzz + DOI gate + Release**) | 4 (`v6.3.0`) | 0 | 76 | No Space (dataset `ouroboros-source`) | **Λ definition inconsistent: fuzzer uses MIN, evidence/thesis uses weighted geo-mean (see §Λ)** |
| 10 | **ouroboros-thesis** | main | 377 | 0 | 0 | 0 | LaTeX/paper substrate | 14 / 1 fail (codeql) | **28** (`paper-v18-1.0.0`) | 0 | 111 | Datasets `ouroboros-thesis-source`, `ouroboros-arxiv-preprint` | — |
| 11 | **agi-forecast** | main | 56 | 0 | 0 | 0 | runtime (vitest) — PAC-Bayes forecasts | 8 / 1 fail (Tests) | 1 (`v0.1.0`) | 0 | 57 | No Space (dataset `agi-forecast-source`); also a route inside amaru | Tests failing |
| 12 | **szl-trust** | main | 27 | 0 | 0 | 0 | Covenant-Proof run artifacts (JSON ledgers) | 7 / 1 fail (**doi-title-gate**) | **0** | 0 | 37 | Dataset `szl-trust-source` | **No releases; DOI-title gate failing; no CHANGELOG; no AGENTS.md** |
| 13 | **szl-cookbook** | main | 121 | 0 | 0 | 0 | recipe markdown (live a11oy console renders Cookbook* comps) | 9 / 0 | 1 | 0 | 57 | Dataset `szl-cookbook-source` | — |
| 14 | **szl-brand** | main | 135 | 0 | 0 | 0 | brand assets/SVG/logos | 9 / 0 | 1 | 0 | 45 | Dataset `szl-visual-identity` | — |
| 15 | **counsel** | main | 18 | 0 | 0 | 0 | docs only — scaffold | 6 / 0 | 1 | 0 | 37 | Dataset `counsel-source` | Scaffold ("implementation pending") — no UI yet (expected) |
| 16 | **terra** | main | 17 | 0 | 0 | 0 | docs only — scaffold | 5 / 0 | 1 | 0 | 37 | Dataset `terra-source` | Scaffold — no UI yet (expected) |
| 17 | **carlota-jo** | main | 17 | 0 | 0 | 0 | docs only — scaffold | 5 / 0 | 1 | 0 | 37 | Dataset `carlota-jo-source` | Scaffold — no UI yet (expected) |
| 18 | **platform** | main | (monorepo) | — | — | MCP 11 tools | substrate runtime | 28 / **3 fail (CI/Tests/Build)** | 11 | 0 | 200 | — | **Covered by sibling agent — deferred.** CI/Tests/Build all red. |
| 19 | **.github** | main | 142 | 0 | 0 | 0 | org community files + **15 reusable workflows** | 25 / 0 | 0 | 1 | 100 | Dataset `szl-org-infra` | **TRUST.md Lean numbers stale (626/14/189) vs README 752/15/160 (see §Lean)**; no CHANGELOG |
| 20 | **demo-repository** | main | 10 | 0 | 0 | 0 | template scaffold (archived, private) | 2 / 0 | 0 | 0 | 1 | — | Archived; no CITATION/CHANGELOG/zenodo (expected) |
| 21 | **du-upstream-contributions** | main | 53 | 0 | 0 | 0 | upstream DU staging | 0 defined / Dependabot fail | 0 | 2 | 12 | — | **0 workflows defined; Dependabot run failing; no zenodo/CHANGELOG** |
| 22 | **szl-uds-deployment** | master | 115 | 0 | 0 | 0 | k3d/uds-cli/Pepr deployment | 7 / 1 fail (verify-signed-assets) | 2 | 2 | 34 | — | **verify-signed-assets failing; no CONTRIBUTING/CoC/CHANGELOG/zenodo** |

*Surface counts are distinct route paths / endpoints from source. Full per-route lists in `raw/all_routes.txt`; raw machine data in `raw/walk_report.json` + `raw/meta_summary.json`.*

---

## TALLY (answers to the return questions)

- **Repos walked:** **22** (all of `szl-holdings`; platform deferred to sibling agent but metadata captured).
- **Tabs/routes/endpoints counted across repos:**
  - React routes: a11oy **17** + amaru **49** + sentra **17** + vessels **115** = **198 routes**
  - FastAPI/HTTP endpoints: amaru **15** (GitHub) / **16** (live) + sentra **16** + rosie **10** + vessels **1** = **42 endpoints**
  - rosie Gradio tabs (live only): **6 top + 4 sub + 1 DINN = 11 tabs**
  - **Grand total UI/API surfaces ≈ 251.**
- **Surfaces NOT verifiable as one-to-one live on HF (the gap):**
  - **rosie:** entire Gradio app (11 tabs) — source lives ONLY on HF, not GitHub → **un-versioned in GitHub.**
  - **amaru:** `/chakra/dinn` live endpoint — not in the GitHub-enumerated endpoint set (+1).
  - **a11oy:** **170 live console components vs 12 GitHub-wired routes** → ~158 component surfaces shipped from a build tree not represented in `web/src/App.tsx`.
  - **lutar-lean / ouroboros / vsp-otel / agi-forecast / uds-mesh / ouroboros-thesis / scaffolds:** **no interactive Space** — mirrored only as `*-source` datasets (not "tabs not shipped" — they have no UI by design, except where noted).
  - **Net "un-shipped or un-versioned tab" gap ≈ 11 (rosie) + 1 (amaru dinn) + 158 (a11oy build-tree divergence) = ~170 surfaces that do not have a clean GitHub→HF one-to-one mapping.**

---

## §Λ — Λ-aggregator definition inconsistency (P0, cross-repo)

The core invariant Λ is defined **three different ways** across the substrate:

| Source | File | Definition |
|---|---|---|
| lutar-lean (kernel-verified, canonical) | `Lutar/Invariant.lean`, `RefVectors.lean`, `reference-vectors.json` | **`Λ_k(x) = (∏ xᵢ)^(1/k)`** — *unweighted* geometric mean, k=9 |
| ouroboros (evidence ledger) | `LUTAR_EVIDENCE.md` | **`Λ = ∏ xᵢ^wᵢ`** — *weighted* geometric mean (Egyptian weights) |
| ouroboros (fuzz harness) | `.clusterfuzzlite/fuzzers/fuzz_receipts.js` | **`computeLambda() — MIN reduction over axis values`** — conjunctive AND/min |

These are mathematically distinct (min ≤ geo-mean ≤ weighted geo-mean in general). The reference-vectors golden set (10 vectors, tolAbs 1e-12) checks **unweighted** parity only. **Recommendation:** declare one canonical Λ in Doctrine v7 and make the fuzzer + evidence ledger cite the same formula as the Lean kernel.

---

## §Lean — lutar-lean number drift (P0, honesty/Doctrine §2)

Published declaration/axiom/sorry counts disagree across four locations; the Lake-build CI gate is currently **failing**:

| Source | Declarations | Axioms | Sorries | At SHA |
|---|---:|---:|---:|---|
| `lutar-lean/README.md` | 752 | 15 (14 unique) | 160 | (claimed) |
| repo description (GitHub) | 749 | 14 | 168 | (claimed) |
| `.github/TRUST.md` "Live numbers" | 626 | 14 | 189 | `3de37e5` |
| **Raw count at current HEAD `c7c0ba1`** | ~780 decl-like lines | **18 `axiom` decls** | 177 (`grep -v comment`) / 234 (raw) | `c7c0ba1` |

Toolchain is consistent and correct: **Lean `leanprover/lean4:v4.13.0`**, **Mathlib pinned `v4.13.0`** (`lakefile.lean` + `lake-manifest.json`). 99 `.lean` files: 95 under `Lutar/`, 4 under `TH8/lean_v2/` (GLR, GradedSemiring, LinearReceipt, StrongMonadIdentity). **`scripts/` is empty** — the reproducibility/count script TRUST.md calls a "TODO" is genuinely absent. **Recommendation:** (1) add the count script, (2) regenerate all three published numbers from HEAD, (3) fix the failing Lake-build gate (this is why the numbers drift unnoticed).

---

## PER-REPO SECTIONS — surfaces + live-on-HF

### 1. a11oy — `web/src/App.tsx` routes (12) + `web/console/src` routes (5)
App routes: `/`, `/a11oy/:rest*`, `/a11oy/command`, `/a11oy/command/approvals`, `/a11oy/command/frontier/proposals`, `/a11oy/command/inbox`, `/a11oy/proof-packet/:packetRef`, `/command`, `/command/:rest*`, `/lyte`, `/nexus`, `/pulse`.
Console routes: `/`, `/ledger`, `/policy`, `/receipt/:hash`, `/verify`.
**Live HF (`SZLHOLDINGS/a11oy`, docker, `e332d9d`)** ships **170 distinct compiled console components** (e.g. AgentMesh, ApprovalQueue, Constitution, EvidenceLedger, ProofLedger, RedTeam, TrustCenter, Workcells, …). The GitHub `App.tsx` route table does not enumerate these 170 surfaces — they are wired in a build artifact / lazy-route map that is shipped to HF but not flatly visible in the GitHub source walked here. **CI: "Container build + GHCR push" and "Doctrine — banned-token grep gate" are FAILING** (banned-token failure = Doctrine §1 marketing-superlative violation in shipped text → P0). Full component list in `raw/walk_report.json` and the HF asset listing.

### 2. amaru — 49 React routes + 15→16 FastAPI endpoints
Routes include `/`, `/agents`, `/brain`, `/cockpit`, `/codex-loop`, `/sovereign-ai-hub` (+6 sub), `/innovation` (+9 sub), `/observability`, `/ouroboros`, `/thesis`, `/runs/:id`, `/syncs/:id`, etc. (full list in `raw/all_routes.txt`).
FastAPI (GitHub): `/`, `/health`, `/healthz`, `/console`, `/events`, `/receipts`, `/state`, `/tripwires`, `/overwatch/snapshot`, `/scheduler/tick`, `/scheduler/wiring`, `/chakra/{name}/leader`, `/chakra/{name}/evaluate`, `/{path:path}`.
**Live HF (`d468631`, docker conduit SPA + sidecar)** adds **`GET /chakra/dinn`** — present in the live `sidecar/src/amaru/app.py` but not in the GitHub-enumerated set. 7 chakra kernels live (root/sacral/…/crown). CI all green. Live `HONEST_DISCLOSURE.md` present.

### 3. sentra — 17 routes + 16 FastAPI endpoints
Routes: `/home`, `/demo`, `/pricing`, `/decision-console`, `/xdr-console`, `/tradecraft`, `/gov/governance`, `/gov/trust-analytics`, `/command/open-eval-hub`, `/command/strategy/worldline-registry`, `/crisis-arena/architect/:id`, `/crisis-simulator/:id`, `/hunt/:id`, `/incidents/:id`, `/msp/ops-console`, `/ops/provider-settings`, `/account/billing`.
FastAPI: `/v1/inspect`, `/v1/verdict`, `/api/sentra/v1/{gates,gates/{id},gates/{id}/test,threats,inspect,verdict,audit-log,healthz}`, plus `/console`, `/style.css`. 30+ `id="…"` console section anchors captured (gates-grid, drift-watch-panel, ciso-dashboard, detector-framework-page, …).
**Live HF (`c6381c83`, docker)** serves a compiled `console/index.html` SPA + landing — the 17 routes are bundled. **CI: "Container build + GHCR push" and "hf-sync.yml" FAILING** → live may lag GitHub.

### 4. vessels — 115 routes (largest UI surface in the org)
Spans maritime intelligence: `/dashboard` (+9 sub), `/cortex/*` (5), `/voyage-*` (7), `/sanctions-*` (3), `/dark-*` (2), `/port-*`, `/risk-*`, `/document-engine/:sub`, `/digital-twin`, `/satellite-rf-intelligence`, `/legal/{privacy,terms}`, etc. (all 115 in `raw/all_routes.txt`).
**Live HF (`21b28cc9`, docker)** ships the full `web/` SPA (191 files) + `api/main.py` + 171 stubs — the 115 routes are served via the compiled bundle. **CI: "Tests" and "DCO" FAILING** → P0 (un-green deploy + DCO non-compliance).

### 5. rosie — Gradio operator console (source only on HF)
GitHub repo = TS API (`packages/api/src/routes/`: about, ask, doctrine, execute, formulas, mesh, receipts → 10 endpoints `/v1/*`) + Lit widget (6 components: command-palette, confirm-dialog, floating-button, propose-action-panel, receipt-stream, rosie-panel) + Python console library (`src/console/*`).
**Live HF (`57a30395`, docker Gradio) tabs:** `Span Explorer`, `Receipt Verifier`, `Mesh Health`, `Doctrine Sweep`, `Live Formulas`, `About`, `Cross-Space Helper` → nested: `🧠 Ask a11oy (/v1/reason)`, `📜 Ledger & Khipu DAG (/v1/ledger)`, `🔐 Verify & DSSE (/v1/verify)`, `⚖️ Policy Evaluate (/v1/policy/evaluate)`, plus `DINN Lab`. **P0: `app.py`, `rosie_dinn_tab.py`, `rosie_v2_additions.py` exist ONLY on the HF Space — the live UI is un-versioned in GitHub.** CI: "Fuzz" failing. Missing `.zenodo.json`.

### 6. ouroboros — runtime + agentic + fuzzing
`runtime/` dirs: bekenstein, category, closure, glr, lambda-gate, types. `src/`: almanac, consistency, depth-allocator, loop-kernel, proof-route, risk-tier + `src/react/` (3 components: LoopGlyph, OuroborosTrace, index). `agentic/`: a11oy-core, bot-reviewer (TS reviewer), formulas (5 span formulas + tests), mcp-server, quickstart; `agentic/agents/` = IDE configs (claude/cursor/replit) not runtime agents. **`.clusterfuzzlite/`: 1 fuzz target `fuzz_receipts.js`** (Jazzer.js — exercises parseReceipt/evaluateAxes/computeLambda/gateTransit/hashPayload/verifyReceipt) + Dockerfile + build.sh; **ClusterFuzzLite PR fuzzing CI is FAILING**. `LUTAR_EVIDENCE.md`: 22/22 assertions on `packages/ouroboros/src/lutar-invariant-proof.test.ts` (A1–A4 + boundary). `OUROBOROS_RUN_ALL.py`: 1.4 MB single-file runner that loads & self-tests **25 inline modules (v14→v19.0)**, stdlib-only, exit 0=all green. CI also fails: Release Please + huklla-t11-doi-title-gate. See §Λ for the min-vs-geomean inconsistency.

### 7. lutar-lean — see §Lean. Canonical entry `Lutar.lean` imports 60+ modules; `Main.lean` (`lake exe check`) + `MainRef.lean` (`lake exe ref_vectors` against `reference-vectors.json`, 10 golden vectors, k=9). TH8/lean_v2: GLR, GradedSemiring, LinearReceipt, StrongMonadIdentity. Lean v4.13.0 / Mathlib v4.13.0. **Lake-build gate FAILING.**

### 8. vsp-otel — OTel exporter + 5 anchor formulas
`runtime/src/exporter.ts` (injectAnchorFormula, axesFromSpan, spanHash, signSpan, exportSpans) + `server.ts` (raw `http.createServer`, port listen — **no test**). 5 formula span-emitters: adversarialRobustness, falsePosition, liuHuiPi, madhavaBound, summationInvariant. `src/` gates: dpi_soundness (TH6), scitt_mask_entropy, relay_latency_gate. `stubs/`: ouroboros-lambda-gate, ouroboros-types. `test/`: 4 tests (dpi, lean_binding_drift, relay_latency, scitt_mask_entropy) + exporter.test.ts. **Coverage gap: `server.ts` untested.** **Missing `.zenodo.json`** despite README DOI badge. CI green (incl. fuzz.yml).

### 9. .github — org community surface (all P0 founder files present)
`TRUST.md` (95L — read in full; SLSA L1 honest, DCO, CODEOWNERS, CodeQL run links, SSRF guard PR#252, founder identity, **stale Lean numbers** — see §Lean), `WORKFLOWS.md` (69L — registry of 6+ documented reusable workflows; repo actually hosts **15 reusable + standalone**), `SUPPORT.md`, `SECURITY.md`, `CITATION.cff`, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `.zenodo.json`, `security.txt` (RFC 9116, expires 2027-05-10), `profile/README.md` (89L), `templates/` (REPO_README, README, CONTRIBUTING, SECURITY, CoC), `.github/ISSUE_TEMPLATE/` (bug/feature/security/config) + PR template, `doctrine/` (DOCTRINE_V7.md, V7.lean, checker.ts, enforcement guide), `coordination/` + `cursor-directives/`. **25 workflows defined, all latest runs green.** **No CHANGELOG.md.**

### 10–17, 19–22 — see master table. Scaffolds (counsel/terra/carlota-jo) are docs-only by design. szl-trust has 0 releases + failing DOI-title gate. du-upstream-contributions has **0 workflows defined**. szl-uds-deployment has failing verify-signed-assets + missing CONTRIBUTING/CoC.

---

## CROSS-REPO GAP AGGREGATION (P0 / P1)

### P0 — must fix before any Series-A / external scrutiny
1. **rosie Gradio source un-versioned in GitHub** — the live operator console (11 tabs) exists only on the HF Space. A reviewer cloning GitHub cannot rebuild the live UI. → Commit `app.py`, `rosie_dinn_tab.py`, `rosie_v2_additions.py` to `szl-holdings/rosie`.
2. **Λ definition inconsistency** (lutar-lean geo-mean vs ouroboros evidence weighted-geo-mean vs fuzzer MIN). → Single canonical Λ in Doctrine v7.
3. **lutar-lean number drift + failing Lake build** — three published figures (752/749/626 decls) all disagree and CI gate is red. → Add count script, fix gate, regenerate.
4. **a11oy banned-token Doctrine gate FAILING** — shipped text contains banned marketing tokens (Doctrine §1). → Remediate tokens; gate must pass before deploy.
5. **Red CI on shipped Spaces:** a11oy (container build), sentra (container build + hf-sync), vessels (Tests + DCO), ouroboros (fuzzing), platform (CI/Tests/Build). → "No fake green" (Doctrine §2) requires these green or the badges removed.
6. **vsp-otel `.zenodo.json` missing** while README advertises DOI 10.5281/zenodo.20424995 — claim not backed by an in-repo artifact.

### P1 — hygiene / completeness
7. **Doc-file gaps:** AGENTS.md missing on vessels, lutar-lean, szl-trust + all 3 scaffolds; `.zenodo.json` missing on rosie, uds-mesh, vsp-otel, du-upstream-contributions; CHANGELOG missing on .github, szl-trust, du-upstream, szl-uds-deployment; CONTRIBUTING/CoC missing on szl-uds-deployment.
8. **du-upstream-contributions has 0 workflows** (Dependabot run failing) — no CI on a contribution-staging repo.
9. **vsp-otel `server.ts` untested**; rosie Fuzz red; agi-forecast Tests red; szl-trust DOI-title gate red; szl-uds-deployment verify-signed-assets red.
10. **amaru `/chakra/dinn`** live endpoint not enumerated in GitHub docs/source set (drift +1).
11. **HF naming trap:** `szl-holdings` ≠ `SZLHOLDINGS`. Document the canonical HF org slug everywhere to prevent "0 results" confusion.

---

## FOUNDER-READABLE SUMMARY — which repos have un-shipped / un-versioned tabs

- **rosie** — the entire live operator console (Span Explorer, Receipt Verifier, Mesh Health, Doctrine Sweep, Live Formulas, About, Cross-Space Helper +4 sub, DINN Lab) is running on Hugging Face but its Gradio source is **not in GitHub**. Biggest single gap. ✅ live, ❌ versioned.
- **a11oy** — Hugging Face ships **170 console components**; GitHub's `App.tsx` only wires **12 routes**. The live console is far bigger than what the walked GitHub source shows. Plus the **Doctrine banned-token gate is red**.
- **amaru** — one extra live endpoint (`/chakra/dinn`) that isn't in the repo's documented list.
- **vessels** — all 115 routes ship live, but **Tests + DCO are failing** on the repo.
- **sentra** — 17 routes ship as a compiled bundle, but **container build + HF sync are failing**, so live may lag GitHub.
- **lutar-lean, ouroboros, vsp-otel, agi-forecast, uds-mesh, ouroboros-thesis** — no interactive tabs by design (proof/library/runtime repos); mirrored to HF only as `*-source` datasets. Their gaps are number-drift, the Λ inconsistency, missing zenodo/test files, and red CI — not missing tabs.
- **counsel, terra, carlota-jo** — scaffolds, "implementation pending"; no UI yet (expected).
- **platform** — deferred to sibling agent; note its CI/Tests/Build are all red.

---

## Artifacts (this folder)
- `190_PER_REPO_EVERY_TAB.md` — this file
- `raw/repo_list_full.json` — authoritative 22-repo list
- `raw/walk_report.json` — per-repo file counts, surfaces, doc inventory, workflows
- `raw/meta_summary.json` — workflows defined + latest run status + releases per repo
- `raw/all_routes.txt` — full flat route lists (a11oy/amaru/sentra/vessels)
- Fresh clones at `/home/user/workspace/szl/repos/<name>-fresh`
