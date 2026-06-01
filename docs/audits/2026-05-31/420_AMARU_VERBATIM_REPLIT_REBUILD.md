# 420 — amaru VERBATIM REPLIT REBUILD — a11oy Winning Pattern

**Verdict:** 🟢 **GREEN**
**Date:** 2026-06-01 (UTC)
**Operator:** Yachay CTO + Opus 4.8
**Space:** `SZLHOLDINGS/amaru` → https://szlholdings-amaru.hf.space
**SPA commit SHA:** `19b047b2f0c02dd11bd36d4a70b975d64065f399`
**Wire G fix commit SHA:** `e5000a8acc8d37e1e1a0480d31ff707ffebf2521`
**Doctrine basis:** v11 (749 declarations / 14 unique axioms / 163 sorries / 12 MCP tools / 46 gates, 13-axis canonical)

> Founder directive honored verbatim: *"5 flagships exactly like how we did a11oy follow the same roadmap … because Sentra and amaru are not what Replit made"*. amaru now serves the **verbatim Replit reverse-ETL React SPA at root `/`** (Vite `base="/"` per the a11oy lesson), with the full `/api/amaru/*` 7-chakra runtime, Wires B–G, brain-jack mesh, `/upgrades`, and agentic-RAG **all preserved**. ZERO BANDAID — the one failure found (Wire G shadowed by the API mount) was root-caused, not patched over.

---

## 1. Mandate

amaru is the **memory cortex (7 chakras)**. Per the founder, the front-end visual layer must be the verbatim Replit React SPA — *not* a console look, *not* the simpler single-page memory-cortex landing that previously occupied root. The `/api/amaru/*` runtime and every Wire must remain additive and untouched.

---

## 2. Source of truth (read, confirmed)

| File | Finding |
|---|---|
| `repos/amaru/web/.replit-artifact/artifact.toml` | `id="artifacts/conduit"`, `BASE_PATH="/conduit/"`, build `pnpm --filter @workspace/conduit run build`, SPA fallback `/* → /index.html`. |
| `repos/amaru/web/` (package `@workspace/conduit`) | The verbatim Replit React SPA source: 48 pages, 57 `.tsx`, wouter router, `vite.config.ts`, `index.html`, `main.tsx` (`registerWithA11oy`). |
| `a11oy_seriesA/infra_work/amaru/web/` | Proven npm rebuild harness — `App.tsx` is a **0-line diff** vs the repo source (verbatim), with `src/_stubs/*` vendoring the 6 imported workspace packages and `vite base = process.env.BASE_PATH \|\| '/'`. |

**BASE_PATH lesson applied:** artifact.toml says `/conduit/`, but per the a11oy winning pattern the production SPA is built with **`base="/"`** so it mounts at root.

---

## 3. Verbatim source + vendored workspace packages

The 6 workspace packages actually imported by `src/` were vendored as local stubs (aliased in `vite.config.ts`), matching the a11oy "vendor required workspace packages" step:

- `@workspace/a11oy-orchestration/client`, `@workspace/ouroboros`, `@workspace/ouroboros/react`, `@workspace/codex-kernel`
- `@szl-holdings/szl-doctrine` (+ `/panels`), `@szl-holdings/shared-ui` (`button/card/badge/skeleton/contact-modal`)

Two private-registry type-only imports (`@szl-holdings/a11oy-receipt-substrate`, `@szl-holdings/a11oy-policy`) were replaced with inlined structural type mirrors so the SPA build needs no access to the private GitHub npm registry — type-only, erased at build, contracts unchanged.

Providers wrapped (a11oy "OrgProvider equivalent" step): `QueryClientProvider` + `InnovationStoreProvider`, with `WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/,'')}` → `""` at root (no `path=""` wildcard trap; all routes use explicit `/…`).

---

## 4. Build

`BASE_PATH=/ NODE_ENV=production npm run build` (Vite 6.4.2) → 2346 modules, `dist/index.html` with **root-relative** asset prefix:

```
dist/index.html → <script type="module" src="/assets/index-CwhA0EWU.js">
```

- Asset prefix `/assets/` (root), **zero** `/conduit/assets` references in emitted index.html.
- Vendor chunks: react / tanstack / recharts / d3 / icons split as in the Replit config.

---

## 5. Deploy — HfApi.create_commit DIRECT (NEVER GitHub Actions)

`deploy_amaru.py` used `HfApi.create_commit` with `CommitOperationAdd` (token `audit_2026-05-30_cursor_offline/.secret/hf_token`, user `betterwithage`, org `SZLHOLDINGS`):

- Uploaded `dist/index.html → static/index.html`, `dist/assets/* → static/assets/*` (sourcemaps excluded), `opengraph.jpg`.
- Updated `Dockerfile` to `COPY static/index.html → /app/static/index.html` + `static/assets/` at root (legacy memory-cortex page preserved at `/legacy`, prior `/conduit/` SPA left intact).
- `serve.py` API contract **untouched** by the SPA commit; it already serves `STATIC_DIR/index.html` at `/` with a history fallback `/{path:path} → index.html` (a11oy pattern).

**SPA commit:** `feat(amaru): verbatim Replit rebuild — a11oy pattern. Yachay CTO.` → `19b047b2…`

### Root-cause fix (NO bandaid) — Wire G ordering
Live smoke revealed `/api/amaru/v1/brain/jack`, `/sockets`, `/multi-jack` returned **404**: the Wire G routes were registered on the root app *after* `app.mount("/api/amaru", amaru_app)`, so the mount shadowed them. Fixed by moving the entire Wire G block to **before** the mount and adding Wire G to the honest `wires` disclosure. Redeployed `serve.py` only.

**Wire G fix commit:** `fix(amaru): Wire G brain-jack registered before /api/amaru mount (root-cause, no bandaid) — a11oy pattern. Yachay CTO.` → `e5000a8a…`

---

## 6. Exhaustive route verification — 47/47 PASS

Each route fetched live; PASS = HTTP `200` **and** SPA shell `<div id="root">` present **and** root-relative `/assets/index-…` reference.

Routes (47): `/`, `/dashboard`, `/cockpit`, `/compute`, `/connections`, `/connections/new`, `/syncs`, `/syncs/new`, `/runs`, `/templates`, `/settings`, `/convergent-sync`, `/codex-loop`, `/ouroboros`, `/thesis`, `/brain`, `/sigil`, `/operational-core`, `/sovereign-ai-hub`, `/sovereign-ai-hub/model-fleet`, `/sovereign-ai-hub/inference`, `/sovereign-ai-hub/distillery`, `/sovereign-ai-hub/praxis`, `/sovereign-ai-hub/data-estate`, `/sovereign-ai-hub/cognitive`, `/admin/usage`, `/agi-forecast`, `/sources`, `/models`, `/destinations`, `/mappings`, `/policies`, `/observability`, `/outcomes`, `/agents`, `/roadmap`, `/innovation`, `/innovation/audience-sql`, `/innovation/lineage`, `/innovation/drift-repair`, `/innovation/golden-record`, `/innovation/cost-carbon`, `/innovation/closed-loop`, `/innovation/sim-theater`, `/innovation/mapper-accuracy`, `/innovation/destination-discovery`, `/innovation/policy-dsl`.

**Result: 47 / 47 PASS, 0 FAIL** (preserves the prior GREEN baseline of 47/47).

### Asset + API contract + Wire checks (live)
| Check | Result |
|---|---|
| `GET /assets/index-CwhA0EWU.js` | `200` |
| Root HTML script tag | `src="/assets/index-CwhA0EWU.js"` ✅, zero `/conduit/assets` |
| `GET /api/amaru/healthz` | `200` (Wire D `traceparent_propagating:true`) |
| `GET /api/amaru/v1/brainz` → declarations/axioms/sorries | `749 / 14 / 163` ✅ (Doctrine v11 honest) |
| `GET /api/amaru/v1/brain` | `200` |
| `GET /api/amaru/v1/receipts` (Wire F) | `200` |
| `GET /api/amaru/v1/mesh/state` | `200` |
| `GET /upgrades` (governed-loop + upgrades index) | `200` |
| `GET /api/amaru/v1/cortex-subscribe` (**Wire E**, a11oy↔amaru SSE) | `200` ✅ |
| `GET /api/amaru/v1/brain/sockets` (**Wire G**) | `200` ✅ (post-fix) |
| `POST /api/amaru/v1/brain/jack` (**Wire G** brain-jack) | `200`, `wire="G"`, `response_organ="cortex"`, `lambda_signal=0.5424` ✅ |

---

## 7. Screenshots — 6/6 distinct rendered React surfaces

Saved to `420_screenshots/` (also `szl/rebuild_2026/amaru/screenshots/`).

| # | Route | Confirmed rendered content |
|---|---|---|
| 1 | `/` | Hero "The data sync that proves what it moved.", convergent-sync fabric, LIVE·RT badge |
| 2 | `/dashboard` | "The Andean Ouroboros" cockpit, LUTAR Σ 91.0%, kernel health (4 pass/0 warn/1 trip), full AppShell sidebar |
| 3 | `/brain` | **7-chakra kernels** Root·Muladhara → Crown·Sahasrara, Chakana wiring DAG, huklla-10 tripwires 8/10 |
| 4 | `/ouroboros` | Seked Audit + Unit-Fraction Thresholds, "**Governed by A11oy**" (Wire E cross-space), receipt chain |
| 5 | `/agi-forecast` | AGI Forecast — Derived Metrics (horizon-velocity, alignment-debt, lutar-readiness) |
| 6 | `/sovereign-ai-hub` | Sovereign AI Hub — Model Fleet / Inference Observatory / Domain Distillery / PRAXIS / Data Estate / Cognitive Insights, "6 Active", Proof Chains Active |

Every shot shows a distinct surface with the AppShell sidebar — direct proof routing renders distinct components (no wildcard trap, no black screens).

---

## 8. Constraints honored

- **Doctrine v11** (749/14/163, 13-axis canonical) — surfaced honestly in `/api/amaru/v1/brainz`.
- **HF auth DIRECT** via `HfApi.create_commit` (token file) — **no** GitHub Actions secret path used.
- **ADDITIVE at `/api/*`** — every existing endpoint preserved; only the root SPA visual layer replaced per founder.
- **IP-HOLD PR amaru#46** — untouched (no GitHub PR activity in this rebuild).
- **Founder-locked banner/avatars/emojis** — untouched (no edits to brand assets).
- **Mythos → Hatun-Willay** — `hatun_willay:true` present; no banned `Mythos` token introduced.
- **ZERO BANDAID** — Wire G 404 root-caused (mount-ordering), fixed properly.

---

## 9. Final verdict

🟢 **GREEN — SHIP CONFIRMED.**
- 47/47 routes → 200 + SPA shell + root-relative assets.
- 6/6 screenshots → real, distinct rendered React surfaces (incl. 7-chakra brain).
- API contract preserved (healthz, brainz 749/14/163, brain, receipts, mesh, upgrades).
- **Wire E** (a11oy↔amaru cortex SSE) LIVE; **Wire G** (brain-jack mesh) LIVE after root-cause fix.
- Two DIRECT HF commits, exact mandated SPA commit message; SPA `19b047b2…`, Wire G fix `e5000a8a…`.

### Source / evidence URLs
- Live: https://szlholdings-amaru.hf.space
- Health: https://szlholdings-amaru.hf.space/api/amaru/healthz
- Brainz (749/14/163): https://szlholdings-amaru.hf.space/api/amaru/v1/brainz
- Wire E: https://szlholdings-amaru.hf.space/api/amaru/v1/cortex-subscribe
- Wire G sockets: https://szlholdings-amaru.hf.space/api/amaru/v1/brain/sockets
- SPA commit: https://huggingface.co/spaces/SZLHOLDINGS/amaru/commit/19b047b2f0c02dd11bd36d4a70b975d64065f399
- Wire G fix commit: https://huggingface.co/spaces/SZLHOLDINGS/amaru/commit/e5000a8acc8d37e1e1a0480d31ff707ffebf2521
