# 12_GITHUB_TO_HF_GAPS.md
## GitHub Source → HuggingFace Space Gap Analysis — Full Re-Audit 2026-05-31

**Reference:** HF Space content from `/home/user/workspace/szl/audit_2026-05-30_cursor_offline/round2/*_full_operational/`  
**GitHub source:** `/home/user/workspace/szl/repos/` and `/home/user/workspace/szl/git-repos/`  
**HF Org:** SZLHOLDINGS  

---

## SPACES AUDITED

The following repos have confirmed HuggingFace Spaces:

| GitHub Repo | HF Space | Has Local HF Build? |
|-------------|----------|---------------------|
| szl-holdings/a11oy | SZLHOLDINGS/a11oy | ✅ (a11oy_full_operational/build/) |
| szl-holdings/amaru | SZLHOLDINGS/amaru | ✅ (amaru_full_operational/) |
| szl-holdings/sentra | SZLHOLDINGS/sentra | ✅ (sentra_full_operational/build/) |
| szl-holdings/vessels | SZLHOLDINGS/vessels | ✅ (vessels_full_operational/) |
| szl-holdings/rosie | SZLHOLDINGS/rosie | ✅ (rosie_full_operational/) |
| szl-holdings/ouroboros-thesis | GitHub Pages (docs/) | ✅ (ouroboros-thesis-git pages.yml) |

Repos with **NO** HF Space (confirmed or expected):
- vsp-otel (library/package — no HF Space expected)
- uds-mesh (deployment manifest — no HF Space expected)
- agi-forecast (library — no HF Space expected)
- ouroboros (runtime library — no HF Space, but consumed by a11oy/amaru)
- lutar-lean (Lean4 library — no HF Space expected)
- counsel/terra/carlota-jo/szl-trust/szl-brand (docs/brand — no HF Space expected)

---

## SPACE-BY-SPACE GAP ANALYSIS

---

### 1. a11oy (SZLHOLDINGS/a11oy)

**GitHub main HEAD SHA:** `9b17643d95219fe3438a594dd9cc531363fcee16` (2026-06-01)  
**HF Space deployed SHA:** `3e91d41df6b8a17e006e3f7491e1f0ff567cad00` (not found on current main branch)

**⚠️ CRITICAL GAP: SHA MISMATCH**
- The deployed SHA `3e91d41` does not appear in the current commit history of `szl-holdings/a11oy` main. This means HF Space is running a build from either:
  - A branch commit that was rebased/force-pushed away, OR
  - A commit from a feature branch that was never merged to main
- GitHub main has at least 5 commits that postdate the deployed version.

**CI Status:**
- `Container build + GHCR push` → **FAILING** on main
- `Doctrine — banned-token grep gate` → **FAILING** (Mythos in `mythosDoctrine.ts`)

**Files in GitHub NOT mirrored to HF:**
- `web/src/pages/frontier/` — directory appears empty in snapshot (MythosIndex.tsx, MythosLayer.tsx, MythosSpec.tsx referenced in App.tsx but not found in local snapshot)
- `deploy/manifests/*.yaml` (Kubernetes manifests — not for HF Space)
- `packages/a11oy-knowledge/`, `packages/policy/`, etc. — npm packages; only built artifacts go to HF

**Files in HF NOT in GitHub:**
- `build/Dockerfile` and `build/Dockerfile.v2` — HF-specific deployment files (NOT in GitHub `deploy/`)
- `build/serve.py` — HF FastAPI server NOT in GitHub repo root (only in HF operational build)
- `build/deploy.py` — HF deployment helper NOT in GitHub
- `build/gates_manifest.json` — 46 gates manifest (generated artifact, not source-committed)
- `build/patches/` — HF-specific patches NOT in GitHub
- `build/console_src/` and `build/console_dist/` — built SPA artifacts (expected generated)
- `build/landing/` — Vessels-DNA landing (from vessels repo, NOT from a11oy GitHub)

**Root Cause:** The a11oy HF Space is assembled from multiple repos (a11oy + vessels landing), built by an operator subagent, and the serving infrastructure (`serve.py`, `Dockerfile`) lives only in the HF Space, not in GitHub. The `Container build + GHCR push` CI failing means the GitHub CI pipeline cannot push a new container.

**Verdict:** ⚠️ STALE DEPLOYMENT — HF is 1+ commits behind GitHub main. Container CI broken. Serve infrastructure not source-controlled.

---

### 2. amaru (SZLHOLDINGS/amaru)

**GitHub main HEAD SHA:** `51b0fc22b42c8155266bbb60033466233cc29c73` (2026-06-01)  
**HF Space deployed SHA:** `51b0fc22b42c8155266bbb60033466233cc29c73` (from delivery doc)  
**Status:** ✅ SYNCED

**Files in GitHub mirrored to HF:**
- `deploy/huggingface/serve.py` — main HF server (confirmed in delivery)
- `deploy/huggingface/Dockerfile` — HF container
- `static_console/console.html` — operator SPA (added in this commit)

**Files in GitHub NOT in HF (expected):**
- `src/` Python modules — loaded at runtime by serve.py, not standalone on HF
- `web/` — React UI (separate Replit deployment; NOT the HF SPA)
- `tests/` — CI only
- `sidecar/` — sidecar container config

**Files in HF NOT in GitHub:**
- `watunakuy_raw.json` — test results artifact
- `03_SCREENSHOTS/` — audit screenshots

**Verdict:** ✅ SYNCED — GitHub and HF Space are at the same commit SHA.

---

### 3. sentra (SZLHOLDINGS/sentra)

**GitHub main HEAD SHA:** `a87e8d3d77cfad9264a59ef6dba1f16a6ced9a57` (2026-06-01)  
**HF Space deployed SHA:** `b0e9ba86...` (partial — from delivery doc "Wire B SHA")  
**hf-sync.yml:** ✅ Present on main (SHA af46d550) — auto-syncs on merge

**⚠️ GAP: Container build + GHCR push → FAILING on main**  
**⚠️ NOTE: Delivery doc says "Action required: Merge PR #107 → triggers hf-sync.yml"**
- PR #107 was the sentra full-operational delivery PR. If it was merged (the main HEAD confirms it was: `a87e8d3d`), then `hf-sync.yml` should have triggered.
- The `hf-sync.yml` workflow is present on main and will push to HF Space on merge.

**Files in GitHub NOT fully mirrored to HF:**
- `web/` — full Node.js/TypeScript application (source; only build artifacts go to HF)
- `src/qec/` — QEC modules (loaded at runtime)
- `src/sentra_immune.py` — immune gate module
- `runtime/confluence/`, `runtime/doi-bind/` — runtime modules

**Files in HF (build/) NOT in GitHub:**
- `build/serve.py` — HF FastAPI server
- `build/console/` — built SPA artifacts
- `build/static/` — static assets
- `build/Dockerfile` — HF container

**The `hf-sync.yml` workflow references `HF_TOKEN` secret.** If the secret is set, the Space will auto-update. The previous failure was on a PR branch before merge.

**Verdict:** ⚠️ LIKELY SYNCED (post-merge) — hf-sync.yml present and active. Container CI still failing (separate from HF sync).

---

### 4. vessels (SZLHOLDINGS/vessels)

**GitHub main HEAD SHA:** `0c6fa3f0c4e577f1143985d5d0289d182d476c06` (2026-05-31)  
**HF Space deployed SHA:** `2c6e80ae5b0b484e43cd14b2faf2840a0f5bb403` (HF Space direct commit)  
**Note:** HF Space SHA is a HuggingFace git commit SHA, NOT a GitHub commit SHA.

**⚠️ CI FAILURES on vessels:**
- `Tests` → **FAILING** on `hampichiq/p3-4-simulated-ais-label-mmsi` branch (PR branch)
- `Tests` → **FAILING** on `main` (critical)
- `DCO` → **FAILING** on `hampichiq/p3-4-simulated-ais-label-mmsi` (missing sign-off on PR)

**Test failure on main is flagged as a regression.** The lone test file `web/src/lib/raz-nihyeh/__tests__/non-monotone-counterexample.test.ts` may be failing.

**Files in GitHub NOT in HF:**
- `web/src/` — full TypeScript/React source (only built artifacts on HF)
- `docs/` — documentation only
- No `deploy/huggingface/` directory (unlike amaru/sentra) — vessels HF may be built externally

**Files in HF NOT in GitHub:**
- `serve.py` — HF server (not in GitHub)
- All built SPA files

**Verdict:** ⚠️ TESTS FAILING ON MAIN — GitHub CI is broken. HF Space was deployed via direct commit (SHA does not match GitHub main). Build process is not automated via GitHub Actions.

---

### 5. rosie (SZLHOLDINGS/rosie)

**GitHub main HEAD SHA:** `22bb5f7e613cbf96041bfb0bdeda80b70fa403d5` (2026-05-31)  
**HF Deploy workflow:** `hf-deploy.yml` — **SUCCEEDED** (2026-06-01 01:18:06) ✅  
**Branch deployed:** `chore/series-a-citation-security-fix` (the current working branch)

**Files in GitHub `hf-deploy/`:**
| GitHub file | HF Space equivalent | Match? |
|-------------|---------------------|--------|
| `hf-deploy/app_rosie_tab7.py` | `app_tab7.py` | ✅ (renamed) |
| `hf-deploy/rosie-widget-v2.js` | `rosie-widget-enhanced.js` | ⚠️ Different name — content may differ |
| `hf-deploy/sentra_index.html` | `sentra_index_patched.html` | ⚠️ "patched" version differs |

**Files in HF NOT in GitHub:**
- `app_original.py` — original rosie HF app (pre-Tab7), not committed to GitHub
- `app_new.py` — intermediate version, not committed to GitHub

**⚠️ Naming gap:** `rosie-widget-v2.js` (GitHub) vs `rosie-widget-enhanced.js` (HF). The HF deploy workflow renames during push or the HF version was manually patched. The content may diverge.

**Verdict:** ✅ LARGELY SYNCED — hf-deploy.yml succeeded on 2026-06-01. Minor naming discrepancies between GitHub source filenames and HF Space filenames.

---

### 6. ouroboros-thesis (GitHub Pages)

**GitHub main HEAD SHA:** `60b4af96764c4ce07e7463f564bf940deb430c60` (ouroboros-thesis-git)  
**pages.yml:** ✅ Present and **SUCCEEDED** (2026-05-31) — deploys `docs/` to GitHub Pages

**Pages deployment:**
- Source: `ouroboros-thesis-git/docs/` directory
- Target: GitHub Pages (not HuggingFace)
- Status: ✅ SYNCED — `pages build and deployment` completed success

**Files in GitHub-git NOT in main thesis-repo snapshot:**
- `arxiv_pkg_v15/` — additional arXiv package version
- `tex/` — LaTeX sources
- `thesis.pdf` and `ouroboros-thesis-v18.pdf` — PDF artifacts
- `AGENTS.md` — agent instructions

**Verdict:** ✅ PAGES SYNCED — GitHub Pages deployment is current.

---

## AGGREGATE GAP TABLE

| Space | GitHub SHA | HF SHA | Synced? | Key Gaps |
|-------|-----------|--------|---------|----------|
| a11oy | 9b17643 (2026-06-01) | 3e91d41 (unknown branch) | ❌ STALE | Container CI broken; serve infra not in GitHub; HF behind |
| amaru | 51b0fc2 (2026-06-01) | 51b0fc2 | ✅ MATCH | Minor: test artifacts HF-only |
| sentra | a87e8d3 (2026-06-01) | b0e9ba8 (partial) | ⚠️ LIKELY OK | hf-sync.yml present; Container CI broken; build artifacts HF-only |
| vessels | 0c6fa3f (2026-05-31) | 2c6e80a (HF commit) | ⚠️ MANUAL | Tests FAILING on main; HF deployed via direct commit not CI |
| rosie | 22bb5f7 (2026-05-31) | hf-deploy succeeded | ✅ DEPLOYED | File rename discrepancies (widget, sentra index) |
| ouroboros-thesis | 60b4af9 (2026-05-30) | pages OK | ✅ SYNCED | arxiv_v15, tex/, PDFs in git-repo not in snapshot |

---

## CRITICAL GAPS — ACTION REQUIRED

1. **a11oy HF STALE** — `9b17643` (GitHub main) ≠ `3e91d41` (HF deployed). The `Container build + GHCR push` CI workflow is failing. The HF serve infrastructure (`serve.py`, `Dockerfile`) is NOT committed to GitHub — it exists only in the HF Space git. This is a single-point-of-failure: if the Space is reset, the serve stack is gone.
   - **Action:** Commit `serve.py`, `Dockerfile`, `gates_manifest.json` to `a11oy` GitHub repo. Fix Container CI. Re-deploy.

2. **vessels Tests FAILING on main** — The `non-monotone-counterexample.test.ts` test is failing on the default branch, meaning the CI gate is broken. HF Space was deployed via direct commit bypassing CI.
   - **Action:** Fix test on main branch. Set up automated HF deploy workflow (like rosie's `hf-deploy.yml`).

3. **a11oy Doctrine banned-token gate FAILING** — CI scanning "Mythos" in `mythosDoctrine.ts`. The file has `doctrine-scanner-exempt` but CI doesn't honor it.
   - **Action:** Update the CI scanner to respect the `doctrine-scanner-exempt` header or add path exclusion.

4. **sentra Container build FAILING** — Build/GHCR push failing on main. HF Space is synced via `hf-sync.yml` but the GHCR image is stale.
   - **Action:** Investigate Container build failure (likely workspace:* protocol issue resolved in Sentra's latest branch fix).

5. **rosie widget name mismatch** — `rosie-widget-v2.js` (GitHub) vs `rosie-widget-enhanced.js` (HF). Consumers embedding the widget by name may break.
   - **Action:** Align filenames or add a canonical alias.
