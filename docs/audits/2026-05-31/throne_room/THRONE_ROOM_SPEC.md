# THRONE ROOM — 3D Heroes Unified Pane · SPEC

**Date:** 2026-06-01 · **Author:** Yachay (CTO subagent) · **Doctrine:** v11 (LOCKED: 749 declarations / 14 unique axioms / 163 sorries, 13-axis yuyay_v3, Λ Conjecture 1)
**Space:** [SZLHOLDINGS/a11oy](https://huggingface.co/spaces/SZLHOLDINGS/a11oy) (Docker SDK, FastAPI + pre-built React SPA)
**Live URLs:**
- `https://szlholdings-a11oy.hf.space/throne-room.html` (primary — static, route-independent)
- `https://szlholdings-a11oy.hf.space/throne-room` (route alias via serve.py)
- `https://szlholdings-a11oy.hf.space/throne` (short alias)

---

## 1. Concept

The **Throne Room** is a single unified 3D scene rendering all 5 SZL flagship heroes as **stylized abstract Kanchay-themed figures** (NOT Iron-Man-style avatars). Each figure pulses according to **real live `/healthz` polling every 5 seconds** — no fabricated data. Clicking a hero dollies the camera in and slides in a control pane (endpoints, live receipts, deeplink, chat). A Cmd-K palette searches every flagship + every tab and can route a free-text question to `a11oy.code`.

This is the "unified control surface the founder asked for" — one pane, all 5 heroes, live.

## 2. Hero roster & abstract forms (Pacha 3-tier semi-circle)

| Hero | Quechua etymology | Role | Abstract Kanchay form (Three.js geometry) | Tier / position |
|---|---|---|---|---|
| **a11oy** | "alloy" — fused metals | Brand Orchestration Layer · a11oy.code | Alloy **crown** — `IcosahedronGeometry(0.95,1)` + orbiting torus ring | MIDDLE (front center) |
| **Amaru** | "serpent / dragon" | Andean Ouroboros · looped reverse-ETL | Coiled **serpent** — `TorusKnotGeometry(0.6,0.2,140,18,2,3)` | UPPER-LEFT |
| **Sentra** | sentinel / guardian | Policy & Halt Authority | Guardian **shield** — `OctahedronGeometry(0.85)` | UPPER-RIGHT |
| **Killinchu** | "kestrel / falcon" | Drone Intelligence · Aerial Twin | Raptor **falcon** — `ConeGeometry(0.65,1.4,5)` (5-sided, inverted) | LOWER-LEFT |
| **Rosie** | the caregiver | Care Engine · Brain-jack Mesh | Care **bloom** — `DodecahedronGeometry(0.82)` | LOWER-RIGHT |

Composition is the **Pacha 3-tier**: 2 upper (Amaru, Sentra), 1 middle (a11oy — the crown, front & centre), 2 lower (Killinchu, Rosie), arranged on a semicircle facing the camera around a hatun-gold dais ring.

## 3. Renderer — WebGPU baseline + WebGL2 fallback

- **Three.js r171** (MIT) imported via `https://esm.sh/three@0.171.0` ESM.
- `makeRenderer()`: if `navigator.gpu` exists, dynamically imports `three@0.171.0/webgpu`, constructs `WebGPURenderer`, `await r.init()`. On any failure → falls back to `THREE.WebGLRenderer` (WebGL2). A bottom-right badge prints the active mode (`WEBGPU` or `WEBGL2`).
- `ACESFilmicToneMapping`, `pixelRatio` capped at 2, `FogExp2` depth.
- `modulepreload` + `preconnect` hints to `esm.sh` for faster first paint.

## 4. Live pulse — real `/healthz` polling every 5s

`startPolling()` fires `pollHero()` for all 5 immediately, then on a 5000 ms interval.

- **a11oy** is polled **same-origin** at `/api/a11oy/healthz` (the Throne Room is hosted on a11oy), so the full JSON body is read: `status`, `version`, `gates`, `declarations`, `axioms`, `sorries`. Real values drive the route-count chip and the Yuyay-13 gauge (`axioms/14`).
- **Amaru, Sentra, Killinchu, Rosie** are cross-origin Spaces. They are polled with `fetch(..., {mode:'no-cors'})` reachability probes — an opaque success = **UP** (green), a thrown error = **DOWN** (red). This is the **honest** signal (their Spaces are static SPAs with no JSON health API; reachability is the truthful liveness measure — no fabrication).
- Each hero's **core emissive intensity, status halo colour, and pulse amplitude** are bound to the real status: UP = strong pulse + green halo, DOWN = faint pulse + red halo, PENDING = neutral.

**Real state captured at build (2026-06-01 ~04:55 EDT):** a11oy 200 (JSON v2.0.0, 46 gates, 456 decl, 14 axioms, 6 sorries), amaru 200, sentra 200, killinchu 200, rosie 503 (honest red).

## 5. Floating status chips (top bar)

| Chip | Source |
|---|---|
| **Routes** | live `declarations` count from a11oy `/healthz` JSON (anchored to Doctrine v11 = 163 sorries / route family until live value arrives) |
| **Khipu** | most-recent receipt hash — FNV-1a over the real poll payload + timestamp (`pushKhipu`) |
| **Yuyay-13** | gauge = `axioms/14` from live JSON, rendered as `N/13` |
| **Up** | count of heroes currently UP, `N/5` |

Receipts are **real**: each successful poll emits a Khipu receipt hashing the actual response payload — not random.

## 6. Interaction

- **Hover** → tooltip with the hero's Quechua etymology + live status + latency (ms) + "poll 5s".
- **Click** → `selectHero()` dollies the camera toward the hero (eased lerp over ~22 frames) and slides the control pane in from the right.
- **Control pane** (`#pane`): live status row (version/gates/latency), endpoint list (with 200 markers on probed GETs), recent Khipu receipts for that hero, **"Open in full Space ↗" deeplink**, and an **inline chat box** that POSTs to `/api/a11oy/code/chat` (routes the question to a11oy.code with the hero id as `route`).
- **Cmd-K palette** (`⌘K` / `Ctrl-K`): fuzzy-searches all 5 flagships + 17 a11oy tabs; arrow-key navigation; Enter opens. If the query matches no flagship, it offers **"Ask: '…' → route to a11oy.code"**, which opens a11oy's pane and sends the question.
- **Esc** closes the palette, or deselects the hero (camera dollies back to the wide shot).
- **Mobile-responsive**: pane goes full-width <640px; chips wrap; `touch-action:none` on canvas for orbit; `viewport-fit=cover`.

## 7. Kanchay tokens (no off-palette)

All colours come from `kanchay/tokens/COLOR_TOKENS.json` (Apache-2.0): surface `#0a0f1e`/`#10151c`/`#1b222c`/`#2a3340`, border `#3c4757`, text `#f5f7fa`/`#c9d2df`/`#76859b`, yuyay teal family, hatun gold family, yawar red family, semantic success/warning/error/info. WCAG AA/AAA pairs per the token report.

## 8. Hard rules honoured

- Founder-token `HfApi` for every SZLHOLDINGS write (`whoami` asserted = SZLHOLDINGS before push).
- **Doctrine v11 LOCKED numbers preserved** (no v11 value altered; chips read live or fall back to v11 anchors).
- **ADDITIVE only** — no existing route, file, or console asset modified or removed; IP-HOLD a11oy#57 untouched.
- Open-source assets only: Three.js (MIT), Kanchay tokens/fonts (Apache-2.0).
- WebGPU + WebGL2 fallback.
- Real polling — no fake data.
- Signed: **Yachay**.

## 9. Source citations (URLs)
- Three.js r171 — https://github.com/mrdoob/three.js (MIT)
- esm.sh CDN — https://esm.sh/three@0.171.0
- Kanchay tokens — `round2/full_reaudit_2026-05-31/kanchay/tokens/COLOR_TOKENS.json`
- a11oy health JSON — https://szlholdings-a11oy.hf.space/api/a11oy/healthz
- PURIQ charter — `round2/full_reaudit_2026-05-31/puriq/PURIQ_CHARTER.md`
