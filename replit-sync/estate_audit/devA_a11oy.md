# Dev A — a-11-oy.com dark-tab wiring audit & fix

**Owner:** Opus Dev A (SZL Holdings) · **Repo:** szl-holdings/a11oy
**Branch:** `feat/wire-dark-tabs` · **Identity:** stephenlutar2-hash <stephenlutar2@gmail.com> (commit -s)
**PR:** **#342** — https://github.com/szl-holdings/a11oy/pull/342 (OPEN, MERGEABLE, NOT merged, no --admin)

---

## TL;DR

Every dark a-11-oy.com tab now has its v1 API surface wired through ONE additive aggregator
(`szl_dark_surfaces_register.py`) plus ONE additive try/except register line in `serve.py`.
All 7 surfaces register on a fresh FastAPI app; `test_dark_surfaces.py` passes **5/5**.
The fix is **code-complete and merge-ready**, but the live tabs stay dark **until Forge
deploys the new serve.py + module to the running HF Space** (see Deploy note for Forge).

---

## 1. AUDIT — why each surface was dark

The 7 backing modules ALL EXIST in the repo and ALL expose a working `register()`/router.
The HTML pages return 200 but the v1 JSON surfaces were 404 ("dark"). Root cause is **not**
missing modules — it is that the live `serve.py` deploy either (a) never ran the register
call, (b) ran it after the SPA catch-all, or (c) the register sat inside a try/except whose
*earlier* statement raised, so the register was skipped and only logged to stderr. The
repo-side `serve.py` already references all of them, but registration was **fragile** — a
single shared-block import failure could silence several surfaces at once. One concrete
fragility found: a stray/dead duplicate `except` clause sits at `serve.py:986-987` right
after the heart_blood block (harmless — Python allows multiple excepts — but evidence the
energy/heart block had been hand-edited and is brittle).

| # | Tab surface | Route | Module | Register kind | Module present? | register() OK? | Why dark (live) |
|---|---|---|---|---|---|---|---|
| 1 | energy/budget | `/api/a11oy/v1/energy/budget` | `szl_energy_budget` | `register(app, ns)` | YES | YES (line 204) | register exists in repo serve.py (L175) but **not live** in deployed Space image |
| 2 | engine/status | `/api/a11oy/v1/engine/status` | `szl_engine_status` | `register(app, ns)` | YES | YES (line 234) | register exists in repo serve.py (L124) but **not live** in deployed image |
| 3 | formula/sovereign | `/api/a11oy/v1/formula/sovereign` | `a11oy_formula_endpoints` | `register(app, ns)` | YES | YES (line 112) | register exists (L1039) but needs `/app/src` on path; **not live** in deployed image |
| 4 | energy/provenance | `/api/a11oy/v1/energy/provenance` | `szl_energy_provenance` | `register(app, ns)` | YES | YES (line 263) | repo serve.py imports it (L964) inside a brittle block; **not live** in deployed image |
| 5 | heart/pulse | `/api/a11oy/v1/heart/pulse` | `szl_heart_blood` | `register(app, ns)` | YES | YES (line 432) | register exists (L980) in the same brittle block; **not live** in deployed image |
| 6 | ayni | `/v1/ayni` (+ `/v1/replay`, `/v1/tinkuy`) | `ayni_os_serve` | `include_router(router)` | YES | YES (router @49) | `include_router` exists (L901); depends on vendored `ayni_os` pkg; **not live** in deployed image |
| 7 | anatomy/loop | `/api/a11oy/v1/anatomy/loop` | `szl_anatomy_loop` | `register(app, ns)` | **PR #341 only** | YES (line 465) | module ships in **PR #341 (feat/anatomy-circulation-loop)**, NOT yet on main → **0 references in serve.py** |

**Probe result (fresh FastAPI app, all register calls):** all 7 routes register cleanly.
`a11oy_formula_endpoints.register` also brings up the full `/api/a11oy/v1/formula/*` family
(pacbayes, welford, quorum, holevo, bloom, kalman, reidemeister, hnsw, bls, allodial,
entanglement, **sovereign**) + `/api/a11oy/v1/formulas/index`.

---

## 2. WIRE — what I changed (additive only, +335/-0 across 3 files)

- **NEW `szl_dark_surfaces_register.py`** (125 lines) — single aggregator exposing
  `def register(app, ns="a11oy")`. Imports + registers all 7 surfaces. **Each surface is
  wrapped in its OWN try/except**, so one missing/broken module (e.g. `szl_anatomy_loop`
  before #341 merges) degrades exactly one tab and never the SPA or the other six. AYNI is
  mounted via `include_router` (with a bare-Starlette fallback); the other six via
  `register(app, ns)`. Carries a locked `DOCTRINE` echo block (v11, locked=8, Λ=Conjecture 1,
  organs EXPERIMENTAL, joules SAMPLE until on-box NVML, free_energy=False, key_committed=False).
- **`serve.py`** — exactly **ONE additive try/except import+register block (+17 lines)**,
  placed right after the existing heart_blood block (before the SPA catch-all), matching the
  existing additive pattern byte-for-byte. **No destructive edits.** Idempotent vs. the
  pre-existing explicit registrations (`add_api_route` is additive; a re-add is harmless), so
  this is belt-and-suspenders: even if an earlier block silenced a surface, the aggregator
  re-registers it behind its own guard.
- **NEW `test_dark_surfaces.py`** (193 lines) — see §3.

> `szl_anatomy_loop.py` / `test_anatomy_loop.py` (PR #341) were deliberately **NOT** committed
> into this PR (left untracked in the working tree) to avoid duplicating/conflicting with #341.
> The aggregator imports anatomy defensively, so this PR is safe to merge before OR after #341.

---

## 3. VERIFY — tests + parsing

- `python3 -c "import ast; ast.parse(...)"` on `szl_dark_surfaces_register.py`,
  `test_dark_surfaces.py`, and the edited `serve.py` → **ALL PARSE OK**.
- **`test_dark_surfaces.py` — 5/5 PASS:**
  1. `test_all_seven_routes_registered` — all 7 routes present after `register()`.
  2. `test_register_is_fault_tolerant` — blocking `szl_anatomy_loop` import still brings up the other six.
  3. `test_invokable_surfaces_are_doctrine_clean` — engine/status, formula/sovereign, anatomy/loop, ayni return 200 and are doctrine-clean (joules SAMPLE/unknown; no unnegated free-energy; organs EXPERIMENTAL; Λ never "proven"); anatomy/loop asserts `experimental` + `sample`; formula/sovereign asserts `experimental` + sovereignty verdict.
  4. `test_module_selftests_are_doctrine_clean` — `szl_energy_budget.budget_summary()` labels joules SAMPLE; aggregator `DOCTRINE` echo is locked (Λ=Conjecture 1, locked=8, organs EXPERIMENTAL, free_energy False, no key).
  5. `test_no_key_committed_in_aggregator` — no PEM/private-key markers in the new module.
- **Doctrine v11 / CI:** local banned-token scan of both new files = clean.

### CI on PR #342 (key gates GREEN)
- **PASS:** Banned-token scan (Doctrine v7 §1), DCO sign-off, **overclaim guard (Theorem U / Conjecture-1 honesty)**, doctrine check, Gitleaks secret scan (x2), Trivy fs scan, Run tests / pytest suites, Lint PR title, namespace fence, COPY/ADD sources exist, hf-module-drift.
- **PENDING (image build / CodeQL):** Grype CVE gate, Analyze (actions / js-ts), Build image+SBOM — unrelated to this change.
- **FAIL (PRE-EXISTING, NOT caused by this PR):** `Shared source files in sync with killinchu` →
  blocking file is **`szl_evidence_research.py`**, which **this PR does not touch**. It last
  changed on main in **PR #337** and is a cross-repo drift between a11oy↔killinchu. `serve.py`
  is already on `.github/shared-file-drift-allow.txt`, and the two NEW files don't exist in
  killinchu so are not shared candidates. → **Out of scope for Dev A / a11oy; needs the
  killinchu owner to reconcile `szl_evidence_research.py` or allow-list it.** Any PR opened
  against main right now inherits this same red check.

---

## 4. Surfaces I WIRED vs. surfaces that need Forge to DEPLOY

**Wired in code (all 7) — register confirmed on a fresh app:**
energy/budget · engine/status · formula/sovereign · energy/provenance · heart/pulse · ayni · anatomy/loop.

**Need Forge to DEPLOY (all 7) — they stay 404 on a-11-oy.com until the running HF Space picks
up the new `serve.py` + `szl_dark_surfaces_register.py`:** every surface above. The code is
correct; the live Space is simply running an older image where these registrations are absent
or were silently skipped at boot.

**Cross-repo dependency:** the `anatomy/loop` surface additionally requires **PR #341
(`szl_anatomy_loop.py`)** to be on main/in the deployed image. Until #341 ships, anatomy/loop
stays dark (logged honestly by the aggregator) while the other six populate.

---

## 5. DEPLOY NOTE FOR FORGE (precise)

> **Deploy `feat/wire-dark-tabs` (PR #342) to the live a11oy HF Space so the dark tabs populate.**
>
> 1. After review, merge **PR #342** (`feat/wire-dark-tabs`) into `main`. **Do NOT --admin / do NOT bypass** — let the green doctrine gates stand. The only red check (`Shared source files in sync with killinchu` → `szl_evidence_research.py`) is **pre-existing drift unrelated to this PR**; it must be cleared by reconciling/allow-listing `szl_evidence_research.py` against killinchu (killinchu owner), not by Dev A.
> 2. Ensure the deployed image **COPYs `szl_dark_surfaces_register.py`** alongside `serve.py` (it's pure-stdlib, no new deps). The Dockerfile per-file COPY pattern must include the new module, or the aggregator import logs "NOT registered" and the tabs stay dark.
> 3. Rebuild + push the Space image so the running container boots the new `serve.py`. On boot, stderr should show:
>    `[a11oy] Dark-surface aggregator registered: energy/budget, engine/status, formula/sovereign, energy/provenance, heart/pulse, ayni, anatomy/loop`
>    plus per-surface `[a11oy:dark] … registered: …` lines.
> 4. **Smoke-test live** — each should return 200 with JSON (not the SPA HTML / not 404):
>    - `GET /api/a11oy/v1/energy/budget`
>    - `GET /api/a11oy/v1/engine/status`
>    - `GET /api/a11oy/v1/formula/sovereign`
>    - `GET /api/a11oy/v1/energy/provenance`
>    - `GET /api/a11oy/v1/heart/pulse`
>    - `GET /v1/ayni` (+ `/v1/replay`, `/v1/tinkuy`)
>    - `GET /api/a11oy/v1/anatomy/loop`  ← **only after PR #341 is also on main/in the image**
> 5. For `formula/sovereign`, the deployed image must have `/app/src` on `sys.path` (serve.py already inserts it when `/app/src/a11oy` exists) so `import a11oy.formulas` resolves.
> 6. If anatomy/loop must go live in the same push, **also merge/deploy PR #341** (`feat/anatomy-circulation-loop`, module `szl_anatomy_loop.py`). The aggregator is safe either way.

---

## Doctrine compliance (v11)
joules SAMPLE until on-box NVML · no free-energy · organs EXPERIMENTAL · sovereign only on
own metal · Λ = Conjecture 1 (never theorem / never "proven trust") · locked = 8 · no key
committed. Additive only; no destructive edits to `serve.py`.
