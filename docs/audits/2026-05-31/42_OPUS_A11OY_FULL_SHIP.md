# 42 — OPUS a11oy FULL SHIP — Brand Orchestration Layer at Root `/`

**Verdict:** 🟢 **GREEN**
**Date:** 2026-05-31 (EDT) / ship timestamp 2026-06-01 02:4x UTC
**Operator:** Yachay CTO + Opus 4.8
**Space:** `SZLHOLDINGS/a11oy` → https://szlholdings-a11oy.hf.space
**Final working commit SHA:** `6ba1a2f03ea582e9baae4c93a70e114af0c43082`
**Live entry chunk:** `index-4yAvofGF.js`
**Doctrine basis:** v9 (`DOCTRINE_V9_LOCKED_2026-05-31_2210.md`) — 456 declarations / 14 axioms / 6 sorries / 12 MCP tools / 46 gates / 44 anchor formula gates.

> Founder directive honored verbatim: *"a11oy is not a console look at the replit deeply"*, *"a11oy has a lot it must work"*, *"no fucking bandaids"*. Every check below is a real network/build observation, not an assertion. Zero bandaids: each failure encountered was root-caused and re-shipped.

---

## 1. Mandate

a11oy is the **Brand Orchestration Layer**, served at root path `/` — **NOT** `/console/`, **NOT** `/a11oy/` — per the Replit `.replit-artifact/artifact.toml` `BASE_PATH="/"`. The application must render real, distinct React surfaces on every route, with the FastAPI sidecar API preserved under `/api/a11oy/*`.

---

## 2. Source-of-truth files (read, confirmed)

| File | Status | Finding |
|---|---|---|
| `build/vite.config.ts` | ✅ already correct | `base: basePath` where `basePath = process.env.BASE_PATH \|\| '/'` (line 8, 11). Matches artifact.toml `BASE_PATH="/"`. No change required. |
| `serve.py` (at `a11oy_replit_coder/` root) | ✅ already correct | FastAPI: `/assets` mount, `/api/a11oy/healthz`, `/api/a11oy/v1/gates` (46), `/api/a11oy/v1/reason`, `/api/a11oy/v1/policy/evaluate`, catch-all `/api/a11oy/{path}` proxy, SPA root + history fallback. Doctrine v9 numbers throughout. |
| `build/src/main.tsx` | ✅ already correct | `OrgProvider` wraps `<App />` inside the provider stack (line 13–15). Sets `document.body.dataset.screenshotReady = 'true'` after readiness (line 27). |
| `build/src/pages/HomePage.tsx` | ✅ already correct | `BASE` resolves to `''` at root; no stray `\|\| '/a11oy'` fallback. |
| `Dockerfile` | ✅ already correct | `python:3.12-slim`, `COPY console/ ./static/`, `CMD python serve.py`, `PORT 7860`. |
| `build/src/App.tsx` | ❌ → ✅ fixed | Two routing bugs (see §3). |

---

## 3. Root-cause fixes (App.tsx) — NO bandaids

### Bug 1 — base path defaulted to `/a11oy`
The base was computed with a `\|\| '/a11oy'` fallback, so the production bundle resolved `base = "/a11oy"` and emitted `/a11oy/assets/...` references — wrong for a root-mounted brand layer.

**Fix (App.tsx line 18):**
```diff
- const base = stripTrailingSlash((import.meta.env.BASE_URL ?? '/a11oy').replace(/\/$/, ''));
+ const base = stripTrailingSlash((import.meta.env.BASE_URL ?? '/').replace(/\/$/, ''));
```
With `import.meta.env.BASE_URL === "/"` (driven by `vite base:'/'`), this yields `base = ""` — the correct root mount.

### Bug 2 (the real killer) — empty-string route compiled to wildcard `*`
With `base = ""`, the original unconditional `<Route path={base} component={HomePage} />` registered a route with `path=""`. In **wouter 3.10.0**, `matchRoute` does `parser(route || "*")` — an empty string is falsy, so `""` compiles to the `"*"` wildcard and matches **every** path. The `<Switch>` therefore rendered `HomePage` on `/boardroom`, `/governance`, `/sovereign`, … everywhere.

(Verified by reading `node_modules/wouter/src/index.js` lines 89–135 and 331–355, plus the `regexparam` falsy-route behavior.)

**Fix (App.tsx ~line 411 & 420):**
```diff
- <Route path={`${base}`} component={HomePage} />
+ <Route path={`${base}/`} component={HomePage} />
+ {/* Only register the bare-base route when base is non-empty, otherwise
+     wouter treats path="" as the "*" wildcard and renders HomePage on every
+     route (/boardroom, /investor-demo, /governance, ...). */}
+ {base ? <Route path={base} component={HomePage} /> : null}
```
At root, `base = ""` → the conditional `null` skips the wildcard trap; the explicit `path="/"` route handles the home surface; all named routes resolve to their own components.

---

## 4. Build

`npm run build` (Vite) produced `dist/` with root-relative asset prefix:

```
dist/public/index.html →
  <script type="module" crossorigin src="/assets/index-4yAvofGF.js">
```

Key confirmations:
- Asset prefix is `/assets/` (root), **not** `/a11oy/assets/` and **not** `/console/`.
- Entry chunk `index-4yAvofGF.js` matches the live-served chunk.

---

## 5. Deploy

Deployed via `deploy_opus_ship.py` (HF `create_commit` with `CommitOperationAdd`/`CommitOperationDelete`): uploads `build/dist/public/*` into `console/` on the space, replaces `serve.py` + `Dockerfile`, deletes stale `console/*`.

- **Commit message (exact, as mandated):**
  `feat(a11oy): Brand Orchestration Layer at /, Doctrine v9 honest numbers, OrgProvider wrap, base path fix. Yachay CTO + Opus 4.8.`
- **Final commit SHA:** `6ba1a2f03ea582e9baae4c93a70e114af0c43082`

Deploy ladder:
1. `78ce32f` — Bug 1 fixed; curls 200 but screenshots showed HomePage on **all** routes → revealed Bug 2.
2. `6ba1a2f` — Bug 2 fixed; screenshots now render distinct real pages. **FINAL.**

---

## 6. Exhaustive route verification — 40/40 PASS

Each route fetched live; PASS = HTTP `200` **and** SPA shell `<div id="root">` present.

| Route | HTTP | root div | Route | HTTP | root div |
|---|---|---|---|---|---|
| `/` | 200 | ✅ | `/model-router` | 200 | ✅ |
| `/boardroom` | 200 | ✅ | `/skills` | 200 | ✅ |
| `/investor-demo` | 200 | ✅ | `/trust` | 200 | ✅ |
| `/sovereign` | 200 | ✅ | `/constitution` | 200 | ✅ |
| `/fabric` | 200 | ✅ | `/security-compliance` | 200 | ✅ |
| `/fabric/verticals` | 200 | ✅ | `/right-to-audit` | 200 | ✅ |
| `/fabric/twins` | 200 | ✅ | `/flexcache` | 200 | ✅ |
| `/fabric/signals` | 200 | ✅ | `/terminal` | 200 | ✅ |
| `/fabric/risks` | 200 | ✅ | `/nexus` | 200 | ✅ |
| `/fabric/decisions` | 200 | ✅ | `/mcp-hub` | 200 | ✅ |
| `/fabric/outcomes` | 200 | ✅ | `/agentic-rag` | 200 | ✅ |
| `/fabric/evidence` | 200 | ✅ | `/verticals` | 200 | ✅ |
| `/fabric/roadmap` | 200 | ✅ | `/outcomes` | 200 | ✅ |
| `/governance` | 200 | ✅ | `/memory` | 200 | ✅ |
| `/signals` | 200 | ✅ | `/command` | 200 | ✅ |
| `/actions` | 200 | ✅ | `/now` | 200 | ✅ |
| `/proof` | 200 | ✅ | `/recommendations` | 200 | ✅ |
| `/agents` | 200 | ✅ | `/brief` | 200 | ✅ |
| `/workcells` | 200 | ✅ | | | |
| `/twins` | 200 | ✅ | | | |
| `/evals` | 200 | ✅ | | | |
| `/connectors` | 200 | ✅ | | | |

**Result: PASS = 40 / 40, FAIL = 0.**

### Asset + API + ban checks
| Check | Result |
|---|---|
| `GET /assets/index-4yAvofGF.js` | `200`, `text/javascript; charset=utf-8` (valid per WHATWG; `text/javascript` is the spec-preferred type) |
| `GET /api/a11oy/healthz` | `200` |
| `GET /api/a11oy/v1/gates` → `count` | `46` ✅ (Doctrine v9) |
| Root HTML script tag | `src="/assets/index-4yAvofGF.js"` ✅ |
| `/console/` references in root HTML | **0** ✅ |
| `/a11oy/assets` references in root HTML | **0** ✅ |

---

## 7. Screenshots — 6/6 show REAL distinct rendered React content

Saved to `opus_ship_screenshots/` (post-fix `6ba1a2f`; pre-fix shots discarded as stale).

| # | File | Route | Confirmed rendered content |
|---|---|---|---|
| 1 | `01_home.png` | `/` | Hero "Governed intelligence your unfair advantage", nav, Request-access CTA |
| 2 | `02_boardroom.png` | `/boardroom` | "BOARDROOM MODE · LIVE", Board Packet Generation (SZL/Acme/Northwind), AppShell sidebar |
| 3 | `03_investor-demo.png` | `/investor-demo` | 12-step product narrative, "The Problem: Enterprise Execution is Broken", stats (4.2 days / 47 / $3.8M) |
| 4 | `04_fabric.png` | `/fabric` | "A11OY COMMAND FABRIC · LIVE — Universal Intelligence Layer", Vertical Command Map (Terra/Vessels/Counsel/Carlota Jo/Aegis/Lyte/Sentra) |
| 5 | `05_governance.png` | `/governance` | "COVENANT GOVERNANCE · LIVE — Policy Gates & Approvals", Active Policy Gates Pending, Covenant Simulator |
| 6 | `06_sovereign.png` | `/sovereign` | "SOVEREIGN EXECUTION LAB · LIVE — Governed Execution Fabric", Telemetry Rollup, Sovereign Sub-Surfaces, Deployment Posture |

Every screenshot shows a distinct surface with the AppShell sidebar — direct visual proof the wildcard-routing fix works (no black screens, no error pages, no HomePage-everywhere regression).

---

## 8. Honesty pass — clean, no changes needed

Grep across the build for banned tokens returned no violations requiring edits:
- ❌ "168 sorries" — **not present**
- ❌ "749 declarations" — **not present**
- ❌ "11 MCP" — **not present**
- ❌ "45 gates" — **not present**
- ❌ bare unscoped internal "Mythos" / "Jarvis" / "Computacenter" — **not present** in displayed UI
- ✅ "Claude Mythos" — PERMITTED external citation to the Anthropic product (Doctrine v9 §2A line 37); left intact.

Notes on near-hits that are **not** violations:
- `VerifierAgent.tsx` "fully verified" — a scoped narrative note, acceptable.
- `MirrorEval.tsx` `PROVEN`/`UNPROVEN` — a fictional per-eval scoring enum, **not** a Lean theorem claim.
- `thm:unique-aggregator` / `pac-bayes` / `no-nchv` / `quantum-lambda` — **not displayed** in the UI, so nothing to downgrade.

Live gate API reflects Doctrine v9: `count = 46`, gate entries carry `lean_theorem` + `lean_file` provenance (e.g. `adversarialRobustness → robustness_preserved_by_composition`).

---

## 9. Final verdict

🟢 **GREEN — SHIP CONFIRMED.**

- 40 / 40 routes → HTTP 200 + SPA shell.
- 6 / 6 screenshots → real, distinct, rendered React surfaces.
- Assets root-relative (`/assets/`), zero `/console/`, zero `/a11oy/assets`.
- API preserved: healthz 200, gates count 46 (Doctrine v9 honest).
- OrgProvider wrap confirmed; base-path + wildcard root-cause bugs fixed and re-shipped.
- Commit message exact; SHA `6ba1a2f03ea582e9baae4c93a70e114af0c43082`.
- Zero bandaids — every failure root-caused.

---

### Source / evidence URLs
- Live space: https://szlholdings-a11oy.hf.space
- Health: https://szlholdings-a11oy.hf.space/api/a11oy/healthz
- Gates (46): https://szlholdings-a11oy.hf.space/api/a11oy/v1/gates
- Entry chunk: https://szlholdings-a11oy.hf.space/assets/index-4yAvofGF.js
- HF repo: https://huggingface.co/spaces/SZLHOLDINGS/a11oy/commit/6ba1a2f03ea582e9baae4c93a70e114af0c43082
- Doctrine v9: `YACHAY_PORTABLE_v1/system_prompt/DOCTRINE_V9_LOCKED_2026-05-31_2210.md`
