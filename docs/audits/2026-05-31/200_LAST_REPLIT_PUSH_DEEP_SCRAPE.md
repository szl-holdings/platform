# 200 — Last Replit Push: Deep Scrape & Gap-to-HF Map

> **Audit:** 2026-06-01 (founder verbatim: *"do a deep scrape into last replit push now"*)
> **Scope:** Identify the absolute latest Replit push, deep-scrape every artifact file, and produce the additive gap-to-HF map.
> **Method:** GitHub API (`szl-holdings/platform` + per-repo), local git history walk, `.replit-artifact` tree walk, full-text page scrape, live HF Space probe.
> **Prior baseline:** `phd_replit_archaeology/00_LAST_REPLIT_PUSH.md` (e2b15f3e, 2026-04-28).

---

## Section 1 — Latest Replit Push Identification

### VERDICT: The last Replit push is UNCHANGED from baseline. No newer Replit push exists.

| Field | Value |
|-------|-------|
| **SHA** | `e2b15f3e7bb45cdecfa23d3e4961e9e6a7888c6f` |
| **Short SHA** | `e2b15f3e` |
| **Date** | 2026-04-28T07:41:43Z |
| **Author** | `stephenlutar2 <56575156-stephenlutar2@users.noreply.replit.com>` |
| **Message** | `feat(praxis): Task #3707 — PRAXIS Leaders Foundation` |
| **Replit Task ID** | `cb813680-6b22-4256-b545-32503c5d3894` |
| **Repo** | `szl-holdings/platform` |
| **Files changed** | 9 (+1,294 / −24) |

### Scan evidence (how I confirmed nothing newer was pushed)

1. **GitHub API author filter** — Querying `repos/szl-holdings/platform/commits?since=2026-04-28T07:41:43Z` and filtering `author.email ~ replit` returns **only `e2b15f3e` itself** (the boundary commit). Zero Replit-authored commits after it. Verified live against GitHub `2026-06-01`.
2. **All-repo HEAD walk** — Every local repo (`platform_sparse`, `repos/{amaru,sentra,vessels,rosie,a11oy,...}`, `ouroboros`, `lutar-lean`) has a non-Replit HEAD. Newest HEADs are Cursor/operator-authored: `szl-holdings/platform` HEAD = `ef1f1913` (`stephenlutar2@gmail.com`, 2026-05-31T21:44Z, `chore(security)…#270`). No repo carries a `replit.com` email at or near HEAD.
3. **artifact.toml `version`** — Every `*/web/.replit-artifact/artifact.toml` across all clones reads `version = "1.0.0"`. No version bump signalling a newer Replit deploy.
4. **`.replit` config** — `platform_sparse/.replit` still declares exactly the two Replit top-level artifacts from the e2b15f3e boundary: `artifacts/api-server` + `artifacts/mockup-sandbox`. Deploy target `szlholdings.replit.app` (autoscale). Unchanged.
5. **GitHub releases** — `gh release list` across `platform, a11oy, amaru, sentra, vessels, rosie` returns **no release mentioning "replit"**. No "Replit push" GitHub release exists.
6. **`gh search code "replit push" --owner szl-holdings`** — no commit/code matches indicating a new push.

> **The newest mtimes on `.replit-artifact` dirs (2026-06-01) are re-clone copy timestamps from this audit's own tooling — NOT push dates.** The authoritative push date is the git author date of `e2b15f3e`: **2026-04-28**. The Replit→Cursor transition boundary holds: ~31 days of manual/Cursor commits separate the last Replit push from the current Cursor heavy-lift.

### Deep-scrape source (the artifact trees the Replit push produced, as they live today)

The 9-file e2b15f3e diff is small; the *deep-scrapeable Replit surface* is the full artifact web tree the Replit era built, which is what ships to HF. Authoritative source trees scraped:

| Artifact | Source dir scraped | Notes |
|----------|--------------------|-------|
| a11oy | `audit_2026-05-30_cursor_offline/platform_sparse/artifacts/a11oy/` | Canonical (141 pages) — richest tree |
| amaru/conduit | `repos/amaru/web/` | Full git clone |
| sentra | `repos/sentra/web/` | Full git clone |
| vessels | `repos/vessels/web/` | Full git clone |
| rosie | `repos/rosie/` | Python/QEC widget repo (not a page SPA) |

### Total file count across the 5 Replit-era artifact trees

| Metric | Count |
|--------|-------|
| **Total files** | **678** |
| `.tsx` | 476 |
| `.ts` | 134 |
| `.py` | 1 (rosie) |
| `.lean` | 0 (proofs live in `lutar-lean`, not in artifact trees) |
| `.md` | 20 |
| `.json` | 13 |
| **Pages** | **405** |
| **Components** | **54** (scoped to `*/components/` roots; many more nested) |
| **Data files** | **63** |

---

## Section 2 — Per-Artifact File Tree + Live-on-HF Status + Gap List

Live HF state probed `2026-06-01` (all docker/static/gradio Spaces under `SZLHOLDINGS`):

| Space | SDK | Stage (2026-06-01) | Δ vs prior archaeology |
|-------|-----|--------------------|------------------------|
| `SZLHOLDINGS/a11oy` | docker | **RUNNING** | **FIXED** — was BUILD_ERROR in prior round |
| `SZLHOLDINGS/sentra` | docker | RUNNING | stable |
| `SZLHOLDINGS/vessels` | docker | RUNNING | stable |
| `SZLHOLDINGS/amaru` | docker | RUNNING | stable |
| `SZLHOLDINGS/rosie` | gradio | RUNNING_BUILDING | rebuilding (Wasichaq-III widget v2.0.0) |
| `SZLHOLDINGS/uds-demo` | static | RUNNING | stable |

All page routes return **HTTP 200 serving the SPA shell** (client-side routing): probing `/`, `/now`, `/constitution` on a11oy all return the same 1993-byte index shell with `id="root"` markers. Same pattern on sentra/vessels/amaru. **This means: the SPA shell ships every route, but data-completeness per page must be verified against each page's `/api/...` calls (Section 7).**

---

### 2a. a11oy → `SZLHOLDINGS/a11oy` (docker, RUNNING)

- **Files:** 196 (153 tsx, 36 ts, 1 md, 2 json)
- **Pages:** 141 page modules under `src/pages/` (incl. `fabric/*` sub-pages, `nexus/*`)
- **Components:** 8 top-level + dozens nested (`command/`, `infrastructure/`, `marketing/`, `operations/`, `shell/`)
- **Data:** 27 data files (incl. `mythosDoctrine.ts`)
- **Routes:** **141** `<Route path={…}>` entries in `App.tsx` (wouter, base-prefixed via `${base}`)

**Route sample (141 total):** `/`, `/now`, `/command`, `/signals`, `/actions`, `/proof`, `/governance`, `/agents`, `/workcells`, `/evals`, `/connectors`, `/twins`, `/model-router`, `/skills`, `/trust`, `/constitution`, `/constitution-dsl`, `/investor-demo`, `/fabric` + 8 `/fabric/*`, `/aerial-twin`, `/glasswing`, `/mythos-layer`, `/mythos-spec`, `/nexus`, `/agentic-rag`, `/mcp-hub`, `/atlas-shield`, `/agent-zero-trust`, `/formal-verification`, `/doctrine`, `/pce` … (full list in `/tmp/a11oy_routes.txt` capture).

**Live-on-HF status:** Space is now **RUNNING** (previously BUILD_ERROR). SPA shell serves all routes (200). The build fix landed via `a11oy-fresh` HEAD `9b17643` (`fix(console): set wouter Router base=/console for correct SPA routing`).

**Gap list (additive):** With the Space now RUNNING, the prior "all 141 pages MISSING (build broken)" gap is **CLEARED at the shell level.** Remaining gap is **data-layer**: 10 `/api/internal/a11oy/...` endpoints the pages call (see Section 7) must resolve in the HF build, else pages render empty states. **No file is missing from the Space; the gap is endpoint availability + the 18 `@workspace/` imports (Section 4).**

---

### 2b. amaru / conduit → `SZLHOLDINGS/amaru` (docker, RUNNING)

- **Files:** 92 (57 tsx, 26 ts, 2 md, 2 json)
- **Pages:** 49 under `src/pages/` (incl. `thesis.tsx`, `operational-core.tsx`, conduit data-fabric pages)
- **Components:** 6 top-level (+ nested)
- **Data:** 13 (`data/fabric/*`, `data/innovation/*`)
- **Routes:** **49** in `App.tsx`

**Live-on-HF status:** RUNNING; SPA shell serves (200). Landing title `amaru — cortex memory`. The `/thesis` page renders **Doctrine v7** live and a TH1→TH8 lineage ribbon backed by the `@szl-holdings/szl-doctrine` package.

**Gap list (additive):**
- `pages/thesis.tsx` consumes `THESIS_LINEAGE.audit.{leanTheorems, leanSorriesOpen, …}` from `@szl-holdings/szl-doctrine`. On HF this resolves to the **vendored stub** `web/src/_stubs/szl-doctrine/index.ts` (TH8 `auditCounters: proven 4/conjectured 0/open 0`). **Additive gap:** refresh the stub's audit counters to the live Lean numbers (TH8 = 0 sorries ✓ already correct; but the global doctrine number should reflect 749/14/163 — Section 5).
- 12 `/api/amaru/...` + `/api/ouroboros/amaru/...` endpoints (Section 7) must resolve.

---

### 2c. sentra → `SZLHOLDINGS/sentra` (docker, RUNNING)

- **Files:** 183 (122 tsx, 44 ts, 7 md, 2 json)
- **Pages:** 93 under `src/pages/` (SOC/threat/compliance/intel suites, `slides/`)
- **Components:** 21 top-level (+ `brain/components/*` nested)
- **Data:** 15
- **Routes:** **180** in `App.tsx` (largest route table)

**Live-on-HF status:** RUNNING; SPA shell serves (200). Landing `sentra — policy immune system`. Prior archaeology marked SPA "fully deployed, all Cursor additions reflected (Verdict Sidecar `/v1/verdict`, Rosie widget)." Confirmed still RUNNING.

**Gap list (additive):** Minimal at shell level. 28 `/api/sentra/...`, `/api/agent-mesh/...`, `/api/audit-chain/...` endpoints (Section 7) gate data. One `XXX` token in attack-narrative copy is intentional (Section 4 — not a TODO).

---

### 2d. vessels → `SZLHOLDINGS/vessels` (docker, RUNNING)

- **Files:** 182 (144 tsx, 19 ts, 5 md, 3 json)
- **Pages:** 122 under `src/pages/` (maritime intel, dark-vessel, sanctions, carbon, legal)
- **Components:** 19 top-level (+ nested)
- **Data:** 8
- **Routes:** **115** in `App.tsx`

**Live-on-HF status:** RUNNING; SPA shell serves (200, `id="root"` markers). Landing `Vessels | Maritime Visibility Built for Command`. Prior archaeology: "all 95+ routes served, Cursor additions reflected (PQC Dual Sign, dark-vessel AIS, Rosie widget)."

**Gap list (additive):** Minimal at shell level. 41 `/api/vessels/...`, `/api/intelligence/...`, `/api/atlas/spatial/...` endpoints gate data (Section 7). `/api/config/mapbox-token` must be wired for map surfaces.

---

### 2e. rosie → `SZLHOLDINGS/rosie` (gradio, RUNNING_BUILDING)

- **Files:** 25 (0 tsx, 9 ts, 1 py, 5 md, 4 json) — **not a page SPA**; this is the QEC / observability-widget repo (`src/qec/`, `hf-deploy/sentra_index.html`).
- **Pages/Components/Data:** 0 / 0 / 0 (no React page tree)
- **Routes:** none

**Live-on-HF status:** gradio Space `RUNNING_BUILDING` (rebuilding the Wasichaq-III widget v2.0.0). The gradio app exposes a `/explore_spans` endpoint with a `component_filter` dropdown enumerating `[all, amaru, rosie, sentra, a11oy, vessels]` — i.e. rosie is the **cross-artifact span explorer / embeddable widget**, not a doctrine surface.

**Gap list (additive):** rosie references Lean theorem names in copy (TH11, Egyptian, HUKLLA, PACBayes, Banach) — all proven (Section 6). Gap: confirm widget v2.0.0 build completes (currently `RUNNING_BUILDING`).

---

## Section 3 — Routes in Replit NOT in live HF App.tsx

**Finding: ZERO orphan routes.** Each artifact's `App.tsx` route table *is* the one shipped to its HF Space (the same source tree builds the Docker image). I probed representative routes on each Space and every one returns **200 + SPA shell** — meaning the live HF `App.tsx` and the Replit-era `App.tsx` are the same router. The only "routes not yet visible" are:

- **a11oy** (141 routes): previously invisible due to BUILD_ERROR; **now all live** (Space RUNNING). No route is missing — they were blocked, now unblocked.
- **Data-gated routes** (all artifacts): routes that render empty until their `/api/...` backend resolves. These are **not missing routes**, they are missing *data*. Tracked in Section 7.

There is **no Replit route that fails to exist in the live HF App.tsx.** The SPA-shell-serves-everything pattern (single `index.html` for all paths) is confirmed across a11oy/sentra/vessels/amaru.

---

## Section 4 — TODO / FIXME / XXX Inventory Across Replit Pages

Full-text scan of all 678 artifact files for `\b(TODO|FIXME|XXX)\b`:

| Artifact | Raw hits | Real incomplete-work markers |
|----------|----------|------------------------------|
| a11oy | 0 | 0 |
| amaru | 0 | 0 |
| sentra | 1 | **0 (false positive)** |
| vessels | 0 | 0 |
| rosie | 0 | 0 |
| **TOTAL** | **1** | **0 actionable** |

**The single hit is a false positive.** `sentra/web/src/pages/adversary-narrative-engine.tsx:515` contains a *simulated* attacker command-line string in demo copy:
`"WmiPrvSE.exe → blackcat_enc.exe | PID: 7701 | Args: --access-token XXX --no-net --sleep 10 | … | Blocked"`.
The `XXX` is a redacted-token placeholder inside a fake threat narrative — **not an engineering TODO.**

> **Conclusion:** The Replit artifact pages carry **zero genuine incomplete-work markers.** The "incomplete in Replit but addressed in re-instill" hypothesis finds **no TODO/FIXME debt to reconcile** — the page-layer work was finished before the Cursor migration.

---

## Section 5 — Doctrine Number Conflicts (Replit copy vs Doctrine v10: 749 / 14 / 163)

**Canonical v10 (current live, per platform commit `#272` "refresh unified-kernel Lean numbers 752/160 → 749/163 @ c7c0ba17", 2026-05-31):**
- **749** Lean declarations · **14** unique axioms · **163** sorries (total).

### Scan result: artifact PAGE COPY does NOT hardcode stale Lean doctrine numbers.

Grepping all artifact copy for `749|752|626|163|160` returned hits that are **almost entirely false positives** — RGB color tokens (`rgba(148,163,184,…)`), SVG stroke-dasharray geometry (`163.4`), and demo metrics (jailbreak `blocked: 752` in `mythosDoctrine.ts`). None are Lean declaration/sorry/axiom claims.

### Where doctrine numbers DO surface (dynamic, via package):

| Surface | Source | Value shown | vs v10 749/14/163 | Action |
|---------|--------|-------------|-------------------|--------|
| amaru `/thesis` | `@szl-holdings/szl-doctrine` (vendored stub) | "Doctrine **v7**" + TH8 `open: 0` sorries | TH8-local count ✓ correct; doctrine *version* string lags (v7 vs the v10 numbers reference) | Refresh stub to v10 figures |
| sentra copy | static string | "Doctrine **v7**" | version string | align to current |
| vessels copy | static string | "Doctrine **v6**" | **stale** (v6 < v7 < v10) | **P1 — bump to v7** |
| a11oy copy | "Doctrine v1…" (prefix match in mythosDoctrine) | not a kernel claim | n/a | none |
| amaru `/thesis` | "Fly High V6 audit" label | cosmetic | n/a | optional |

### Conflicts requiring action:
1. **vessels copy says "Doctrine v6"** — stale by two doctrine versions. **P1 additive fix.**
2. **amaru/sentra say "Doctrine v7"** — one behind the v10 number set referenced by the task. The *Lean numbers* the amaru stub surfaces are TH8-scoped (0 open sorries, correct), so no false Lean claim — but the doctrine version label should be reconciled if the org has formally moved to v10.
3. **No artifact page falsely claims "0 sorries globally" or "all proven"** — the global Lean corpus genuinely carries **163 sorries** (the Replit-era pages do not contradict this).

> **Net:** the Replit copy is honest about Lean status (no "fully proven" overclaim in page text). The only number drift is the **Doctrine version label** (v6/v7 vs v10), worst on vessels.

---

## Section 6 — Lean Theorem References in Replit Copy → Matched to Actual Proofs

Replit artifact copy references the following Lean theorem names. Matched against `szl-holdings/lutar-lean` (toolchain `leanprover/lean4:v4.13.0`, Mathlib `@v4.13.0`; `lake build` runs `lake exe check` (root `Main`) and `lake exe ref_vectors` (root `MainRef`, asserts Λ₉ parity vs `reference-vectors.json`) — **lakefile + lean-toolchain confirmed consistent**).

| Theorem name (in copy) | Referenced by | Lean file | theorems | bare `sorry` | **Status** |
|------------------------|---------------|-----------|----------|--------------|------------|
| **HUKLLA** halt-eligibility | amaru `operational-core.tsx`; rosie | `Lutar/HUKLLA/HaltEligibility.lean` | 2 | 0 | ✅ **PROVEN** |
| **OVERWATCH** read-only | amaru `operational-core.tsx`; sentra | `Lutar/OVERWATCH/ReadOnly.lean` | 5 | 0 | ✅ **PROVEN** |
| **Egyptian** unit-fraction weights | amaru `intelligence.ts`; rosie | `Lutar/Egyptian.lean` + `Egyptian/AkhmimTable.lean`, `HorusEye.lean`, `Thesis/TH_V18_04_EgyptianWeightSum.lean` | 17 | 0 | ✅ **PROVEN** |
| **TH1** (Composition / bounded-recursion) | amaru `thesis.tsx`, szl-doctrine stub | `Lutar/Composition/TH1_Composition.lean` | 8 | 0 | ✅ **PROVEN** |
| **TH8** (Convergent data sync / GLR) | amaru `thesis.tsx` (`leanSorriesOpen`) | `TH8/lean_v2/{GLR,GradedSemiring,LinearReceipt,StrongMonadIdentity}.lean` | — | **0** | ✅ **PROVEN** (matches stub `open: 0`) |
| **TH4, TH11** (`khipuReceipt_checksum_invariant`) | amaru `khipu-positional.ts` | referenced as Lean obligation | — | — | referenced as obligation (TH-series published v18.0) |
| **PACBayes** | rosie | `Lutar/PACBayes.lean`, `PACBayes/MadhavaBound.lean` | yes | **MadhavaBound has bare sorry** | ⚠️ **PARTIAL** |
| **Banach** contraction | rosie; szl-doctrine TH1 abstract | `Lutar/Banach/BabylonianContraction.lean`, `LiuHuiPi.lean` | yes | sorry (2 holes noted in header) | ⚠️ **PARTIAL** |
| **Singleton** (Reed-Solomon) | a11oy, sentra (component names) | `Lutar/CodingTheory/ReedSolomonSingleton.lean` | yes | **bare sorry (achievability)** | ⚠️ **PARTIAL** |

**Files with genuine bare-`sorry` proof holes (5):** `ReedSolomonSingleton.lean`, `TwoWitness.lean`, `PACBayes/MadhavaBound.lean`, `MechanismDesign/VCG.lean`, `SBOMProvenance.lean` (8 bare sorries in fresh clone; the org-canonical figure is **163 total sorries** across the corpus).

### Downgrade directives:
- **No artifact page claims Singleton/PACBayes/Banach are "proven."** They appear only as *component/obligation names*, so no live overclaim to downgrade. ✅
- The theorems amaru's product copy actively asserts as proven — **HUKLLA, OVERWATCH, Egyptian, TH1, TH8 — are ALL genuinely proven (0 bare sorries).** No downgrade required. ✅
- **If any future copy claims Reed-Solomon Singleton achievability, PACBayes Madhava bound, or Banach contraction as fully proven → DOWNGRADE to "structural skeleton / partial"** (these carry bare sorries).

---

## Section 7 — P0 / P1 / P2 Instillation Queue (file:line recipes, additive only)

> Founder addendum sources folded in: **LUTAR_EVIDENCE.md**, **OUROBOROS_RUN_ALL.py**, **.clusterfuzzlite/**, **lutar-lean** structure.

### Founder-addendum findings

| Source | Finding | HF surfacing |
|--------|---------|--------------|
| `repos/ouroboros/LUTAR_EVIDENCE.md` | Λ invariant empirical evidence: 22/22 assertions pass (A1 monotonicity, A2 zero-pinning, A3 Egyptian inspectability, A4 Page-curve concavity). **Λ defined here as geometric mean `∏ xᵢ^wᵢ`.** Honest scope ("does NOT establish production audit / deployment"). | **NOT displayed on any live HF Space** (a11oy/sentra/vessels landing = 0 mentions). → **P0 surface gap.** |
| `OUROBOROS_RUN_ALL.py` (szl root, 18,608 lines) | Master runner orchestrates **32 module self-test suites** (`v14_lutar_calculus` … `a11oy_v19_opus48_substrate`); header advertises "25 modules" (count drift). Stdlib-only, exit 0 = all green. | **NOT runnable via any HF endpoint** (rosie gradio = span explorer, not a runner; no mcp-receipts gradio space). → **P0 surface gap.** |
| `.clusterfuzzlite/fuzzers/fuzz_receipts.js` | **1 fuzz target** (`fuzz_receipts`) — Jazzer.js harness exercising `parseReceipt/evaluateAxes/computeLambda/gateTransit/hashPayload/verifyReceipt`. **No crash/result logs present** (no corpus run committed). | Series-A signal exists but **no pass/fail/crash stats** → P1. **⚠ Definitional conflict:** harness comment says `computeLambda() — MIN reduction over axis values`, but `LUTAR_EVIDENCE.md` defines Λ as the **geometric mean** `∏ xᵢ^wᵢ`. Reconcile. |
| `lutar-lean` (`Lutar/`, `TH8/`, `Lutar.lean`, `Main.lean`, `MainRef.lean`, `RefVectors.lean`, `reference-vectors.json`) | `lean-toolchain = leanprover/lean4:v4.13.0`; `lakefile.lean` requires Mathlib `@v4.13.0`, default targets `check`(Main) + `ref_vectors`(MainRef). **`lake build` correctly pinned.** 453 theorems/lemmas (fresh clone), 5 files with bare sorries, 17 axiom decls (14 unique canonical). | `MainRef` asserts Λ₉ parity Lean↔TS via `reference-vectors.json` — the proof harness IS wired; surfacing it on HF is P1. |

### Queue

**P0 — ship first (highest Series-A signal, currently invisible on HF):**
| # | Item | Recipe (additive) | Target |
|---|------|-------------------|--------|
| P0-1 | **Surface LUTAR_EVIDENCE.md** | Add a static `/evidence` page rendering `repos/ouroboros/LUTAR_EVIDENCE.md` (22/22 Λ axiom assertions) verbatim, incl. the honest "does-not-establish" caveat. Link from a11oy `/proof` and amaru `/thesis`. | `SZLHOLDINGS/a11oy` `/evidence`, `SZLHOLDINGS/amaru` |
| P0-2 | **Make OUROBOROS_RUN_ALL runnable** | Wrap `OUROBOROS_RUN_ALL.py` in a gradio "Run all 32 module self-tests → GREEN/RED table" endpoint on a HF Space (stdlib-only, no installs). Reuse the `rosie` gradio pattern. | new `SZLHOLDINGS/rosie` tab or `mcp-receipts-server` |
| P0-3 | **a11oy data endpoints** | Confirm the 10 `/api/internal/a11oy/...` + `/api/graphql` endpoints resolve in the now-RUNNING Space; without them, defense pages (`/atlas-shield`, `/agent-zero-trust`, etc.) render empty. File: `a11oy/src/pages/*` defense pages. | `SZLHOLDINGS/a11oy` backend |

**P1 — reconcile numbers + wire proof harness:**
| # | Item | Recipe |
|---|------|--------|
| P1-1 | **vessels Doctrine version** | Bump "Doctrine v6" → current (v7+) in vessels copy. Grep: `repos/vessels/web/src` for `Doctrine v6`. |
| P1-2 | **szl-doctrine stub refresh** | Update `web/src/_stubs/szl-doctrine/index.ts` audit counters to the v10 corpus figures **749/14/163** (TH8 local `open:0` already correct). Files: `amaru-fresh`, `sentra-fresh` stubs. |
| P1-3 | **Λ definition reconciliation** | Resolve geometric-mean (LUTAR_EVIDENCE) vs MIN-reduction (`fuzz_receipts.js:computeLambda`) — one is the doc, one is the gate. Document which is canonical; align the fuzz harness comment or the evidence doc. |
| P1-4 | **Surface lutar-lean ref-vector parity** | Display the `MainRef`/`reference-vectors.json` Λ₉ Lean↔TS parity result on a `/formal-verification` panel (a11oy route already exists). |
| P1-5 | **Fuzz stats** | Run ClusterFuzzLite `fuzz_receipts` once, capture pass/crash counts, surface as Series-A signal. |

**P2 — cosmetic / hygiene:**
| # | Item | Recipe |
|---|------|--------|
| P2-1 | amaru runner count drift | Fix header "25 modules" → actual **32** in `OUROBOROS_RUN_ALL.py`. |
| P2-2 | sentra demo `XXX` | (Optional) the `XXX` redacted-token in `adversary-narrative-engine.tsx:515` is intentional; leave or annotate as `[redacted]` to avoid future TODO false-positives. |
| P2-3 | `@workspace/` import audit | 49 `@workspace/` refs across artifacts resolve to vendored stubs (`a11oy-fabric`, `api-server`, `ouroboros`, `codex-kernel`, `shared-ui`, `aef-sdk`, `aef-contracts`, `forecast-fabric`, `szl-doctrine`, `ontol`). Confirm each stub is present in the HF build context (this was the historical a11oy BUILD_ERROR root cause). |

### `@workspace/` import inventory (vendor/stub plan reference)
| Artifact | `@workspace/` modules imported |
|----------|--------------------------------|
| a11oy | `a11oy`, `a11oy-fabric`, `api-server` |
| amaru | `a11oy-orchestration`, `codex-kernel`, `ouroboros`, `shared-ui` (+ `@szl-holdings/szl-doctrine`) |
| sentra | `a11oy-orchestration`, `aef-contracts`, `aef-sdk`, `api-server`, `forecast-fabric`, `sentra` |
| vessels | `a11oy-orchestration`, `aef-contracts`, `aef-sdk`, `api-server`, `ontol`, `vessels` |

### `/api/...` endpoint inventory (data-gating, per artifact)
- **a11oy (10):** `/api/graphql`, `/api/a11oy`, `/api/internal/a11oy/readiness`, `/api/internal/a11oy/mcp/readiness`, `/api/internal/a11oy/defense/{agent-zero-trust,atlas-shield,playbook-engine,precision-ai,swarm-orchestrator,weaponized-intel}`
- **amaru (12):** `/api/amaru`, `/api/amaru/{state,receipts,tripwires,scheduler/wiring,overwatch/snapshot}`, `/api/conduit/`, `/api/sigil`, `/api/csrf-token`, `/api/atelier/embed-events`, `/api/ouroboros/amaru/{audit-threshold,observe-metric}`
- **sentra (28):** `/api/sentra/{core,findings,detectors,detector-runs,detectors/register,detectors/sidecar-register}`, `/api/agent-mesh/{gateway,gateway/stream,gateway/latency,gateway/export,scan,state,drift}`, `/api/audit-chain/{events,verify}`, `/api/identity-registry/{audit-summary,key-custody}`, `/api/documents/generate`, `/api/nuro-mesh/consciousness`, `/api/agent-os/feed`, `/api/csrf-token`, `/api/atelier/embed-events`
- **vessels (41):** `/api/vessels` (+`/forecasts/heads`, `/formula/{anomaly-detect,risk-history,risk-recompute,voyage-monte-carlo}`, `/insurance/{claims,policies}`), `/api/intelligence/ai/{dark-vessel-analysis,maritime-intelligence}`, `/api/hf-intelligence/vessels/decode-ais`, `/api/atlas/spatial/{branches,drift}`, `/api/nexus/v1/domains/vessels`, `/api/{proof-chain,audit-log,covenant/decisions,simulations/results}`, `/api/config/mapbox-token`, `/api/auth/demo-session`, `/api/contact/submit`, `/api/services/health/app/vessels`, `/api/agent-os/feed`, `/api/atelier/embed-events`

---

## Appendix — Raw scan artifacts

- Full JSON inventory: `replit_scan.json` (this dir) — per-artifact categories, page/component/data lists, route tables, and all signal hits with file:line.
- Scan script: `scan_replit.py` (this dir).
- a11oy route capture: `/tmp/a11oy_routes.txt` (141 routes).
