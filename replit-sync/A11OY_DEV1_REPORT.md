# A11OY DEV1 — Investor-WOW + Core-5 3D + Formula Instillation + Organ Substrate
**Build report — 2026-06-08 · Opus 4.8 Dev1**

Status: **SHIPPED & EYES-ON VERIFIED.** Live and RUNNING on the a11oy HF Space at
`https://szlholdings-a11oy.hf.space/console`. All 14 Dev1 tabs render live with real
data, honest tiers, 3D, and zero browser errors across 3 full reloads.

---

## 1. What shipped (all ADDITIVE — no existing render fn edited)

### Core-5 tabs (live + 3D + receipts)
| Tab | View key | Live wiring | 3D |
|---|---|---|---|
| Command Center | `command` | live KPIs + feeds | 2 canvases |
| Trust Space (Λ) | `trustspace` | `/v1/lambda` 13-axis | radar + globe |
| Governed Decision loop (P1–P6) | `decision` | `/v1/governed-decision` | 6-stage 3D |
| Receipt Chain (3D DAG) | `chain` | `/v1/wow/ledger` | 3D DAG |
| Model Router | `llm` | `/v1/wow/router-latency` | 3D topology + bars |

### 4 WOW adds (the investor headline)
| Tab | View key | Backend | Verified behavior |
|---|---|---|---|
| Drop a11oy on ANYTHING | `wowdrop` | `POST /v1/wow/govern` | text → classify → P1–P6 → BLOCK/HOLD/ALLOW + signed receipt + 3D trace |
| Ungoverned vs a11oy-governed | `wowtoggle` | `POST /v1/wow/govern?mode=ungoverned_vs_governed` | poisoned input → ungoverned (SIMULATED) obeys vs governed **BLOCK** (P3 non-interference) + signed receipt |
| Unified LIVE receipt ledger | `wowledger` | `GET /v1/wow/ledger` | one tamper-evident hash-chain across ALL verticals, auto-poll, `window_verified ✓` |
| ROI / cost-of-failure | `wowroi` | `GET /v1/wow/roi` | $67.26M/yr loss-avoided model, **labeled assumptions** |

### Formula instillation
- `window.A11OY_KB_FORMULAS` + `window.a11oyKB()` — reads embedded `window.__KB__`
  (zero new fetch). 23 puriq formulas (F1–F23) normalized into honest tiers.
- `window.a11oyFormula(key)` chip renderer: name + **Lean theorem** + honest maturity badge.
- locked-5 = EXACTLY **{F1,F11,F12,F18,F19}** everywhere; never inflated.

### Auto-poll framework
- `window.a11oyPoll(fn, stampId)` — jittered **10–15s** recorder, "last updated" stamp,
  registered on `window._liveTimers` so tab-switch tears it down cleanly.

### 3D framework
- `window.a11oyFG()` ForceGraph3D factory: `zoomToFit(600,60)` on `onEngineStop`,
  **min-camera-distance floor for small graphs** (no centre/bottom clustering),
  staggered 4-level labels, gold directional particles, transparent bg.

---

## 2. Organ substrate (founder scope expansion) — per-organ wiring

Each organ tab is wired READ-ONLY to its REAL live endpoint and shows live output.
No backend organ module was modified.

| Organ (tab) | View key | Live endpoint(s) | What's instilled / shown | Honest label |
|---|---|---|---|---|
| **Brain · YACHAY** | `brain2` | `/v1/brain` + `window.__KB__` | Full proven/CI-green corpus: locked-5 (kernel-verified @ c7c0ba17), experimental CI-green tier (21, sorry-free, **not** in locked count), Λ=Conjecture 1; live Lean declarations (**749**), policy+anchor gates (46+44), LLM router tiers, canonical lean snapshot | Locked = EXACTLY 5; Λ machine-checked FALSE unconditional / axiom-free CONDITIONAL `lambda_unique_of_separable` |
| **Heart · Λ-Gate** | `organheart` | `/v1/policy/gates` + `/v1/lambda` | The gate kernel where every governed decision is gated: deny-by-default policy gates (live), 13-axis Λ radar (live **0.9191**), locked-5 {F1,F11,F12,F18,F19} as the trust-aggregator + gate kernel | AND-compose conjunctive; Λ ≥ 0.90 advisory (Conjecture 1) |
| **Circulatory · YAWAR** | `organyawar` | `/v1/operator/ledger` + `/v1/wow/ledger` | Receipt bus: real signed-receipt operator chain (5 receipts, root_hash) as a 3D DAG + unified cross-vertical depth (38), `window_verified ✓`; F18 DSSE seal + F1 | prev=SHA256(prev); real ECDSA where key present, else honestly marked; SIMULATED stream labeled |
| **Nervous · OTel** | `organnervous` | `/v1/observability/summary` | Signed MELT telemetry: organs reachable, DAG depth, spans-available, live mesh-reach probe table | in-image capabilities (not external services); W3C trace in-process; cross-Space tracing = roadmap; SLSA L1 honest / L2 roadmap |
| **Skeleton · Service Mesh** | `organskeleton` | `/v1/capabilities/mesh` | Structural service mesh: 6 nodes, healthy witnesses, **BFT n≥3f+1**, quorum PERMITTED, 3D topology; full organ→capability→repo wiring table | Khipu BFT safety = **Conjecture 2** (faulty organ can equivocate), NOT proven; every node Λ = "Conjecture 1 (NOT a theorem)" |

### Organ → real capability repo map (shown in the Skeleton tab)
- Brain/YACHAY → lutar-lean / szl-lake / szl-papers (Lake + Lean + Mathlib + KB)
- Heart → locked-5 {F1,F11,F12,F18,F19} (deny-by-default policy + 13-axis Λ)
- Circulatory/YAWAR → szl-lake (receipts) / khipu DAG (DSSE signed-receipt hash-chain)
- Nervous → vsp-otel (Λ-signed MELT + W3C trace)
- Consensus → khipu-consensus (BFT quorum, Conjecture 2)
- Runtime → ouroboros (recursion/loop runtime)
- Tools → hatun-mcp (**12** tools — per live `/v1/brain`; the directive's "16" was honestly reconciled down to the 12 the backend reports)
- Mesh → szl-mesh (CRDT state mesh)

---

## 3. Critical bug found & fixed during this build (eyes-on caught it)

**Route-shadowing bug (would have 404'd every WOW endpoint in production).**
`serve.py` registers an `/api/a11oy/{path:path}` **proxy catch-all** (~line 4255) and a
SPA `/{full_path:path}` catch-all (~line 5078) EARLIER in the file. FastAPI matches
routes in registration order, and my `register()` added routes via `@app.get/@app.post`
decorators (which **append**), so my `/v1/wow/*` routes were registered *after* the
catch-alls → every call would have been proxied to the Node backend (which lacks them)
→ 404. `v1/wow/` is **not** in `_LOCAL_ONLY_A11OY_PREFIXES`, so the proxy would have
swallowed them.

**Fix:** `register()` now snapshots the route count, registers its 9 routes, then
**moves them to the front** of `app.router.routes` (`routes[0:0] = new`), the same
pattern the other additive blocks use. Verified by importing the REAL `serve.py` in a
TestClient and confirming all 4 endpoints resolve `[local]` (not proxied/SPA) and
`govern → BLOCK` on injection (`moved=9` logged). Then re-confirmed against the LIVE
production Space (below).

(Earlier in the session I also fixed a `Request` annotation bug: `from __future__ import
annotations` made `req: Request` a string annotation FastAPI couldn't resolve when
`Request` was only imported inside `register()`; fixed by importing it at module top.)

---

## 4. Verification — eyes-on proof

### Live backend (production, `https://szlholdings-a11oy.hf.space`)
- `GET /v1/wow/roi` → 200, total_annual_loss_avoided_usd = **67,260,000**, 5 verticals
- `GET /v1/wow/router-latency` → 200, 7 routes
- `GET /v1/wow/ledger?limit=3&advance=1` → 200, chain_depth 29, **window_verified true**
- `POST /v1/wow/govern` clean → **ALLOW** (Λ 0.9241)
- `POST /v1/wow/govern` injection → **BLOCK**
- `POST /v1/wow/govern` mode=ungoverned_vs_governed → **BLOCK** + ungoverned + caught present

### Browser (Playwright, headless Chromium, real Space)
- `window.VIEWS` present; all 14 Dev1 view keys present; `a11oyFG`/`a11oyPoll`/
  `a11oyFormula` all functions; KB formula count = 23.
- **14/14 tabs render OK**, each with KPIs/cards/3D canvases and substantial live text.
- **3 full reloads → 0 page errors** each.
- Screenshots saved to `team/DEV1_EYESON/` (core_*.png, wow_*.png, organ_*.png) +
  `_results.json`.

Notable eyes-on confirmations:
- Brain tab: locked-proven **5**, experimental **21** ("not in locked count"), Λ
  **Conjecture 1**, Lean declarations **749**; Λ-honesty box states unconditional
  uniqueness is machine-checked **FALSE**, conditional axiom-free result cited.
- Heart tab: 13-axis Λ radar live **0.9191**, deny-by-default gates from `/v1/policy/gates`.
- Skeleton tab: node health rows read "**Conjecture 1 (NOT a theorem)**"; BFT shown as
  Conjecture 2.
- Ungoverned-vs-a11oy tab: ungoverned answer clearly labeled **SIMULATED**, governed
  verdict **BLOCK** via P3 non-interference + signed receipt.

---

## 5. Deploy — byte-identical GitHub ↔ HF

Files (all confirmed byte-identical on HF via git-blob SHA after push):
- `a11oy_dev1_endpoints.py` (NEW backend) — blob `bb9b3ab010`
- `serve.py` (+ additive dev1 registration block ~L5385) — blob `8caa10a630`
- `Dockerfile` (+ `COPY a11oy_dev1_endpoints.py`) — blob `ec97ea6309`
- `pages/console.html` (+ WOW/organ block before final `</body>`) — initial blob
  `4ec6551935`, then 3D-polish update.

**GitHub commits (repo `szl-holdings/a11oy`):**
- `cd77abef5c` a11oy_dev1_endpoints.py
- `0730738c7e` serve.py
- `ca2c7c6753` Dockerfile
- `e6aefc6aa6` pages/console.html (initial)
- `a0dd3e185a` pages/console.html (3D framing polish)

**Hugging Face commits (Space `SZLHOLDINGS/a11oy`):**
- `b3eaab32f8064254a7d5eaf4712d94756bc5c89b` (initial 4-file)
- `1b5cba019c88c8b0964fd5c0599e2b4e376eb32e` (3D framing polish — **currently RUNNING**)

Space reached `RUNNING` on the final commit (`1b5cba019c`) and was re-verified eyes-on.

---

## 6. Doctrine compliance (hard gates)
- ✅ locked = EXACTLY 5 {F1,F11,F12,F18,F19}; experimental never folded into the count.
- ✅ Λ = Conjecture 1 (unconditional FALSE; conditional axiom-free
  `Lutar.Round13.lambda_unique_of_separable`, #print axioms ⊆ {propext, Classical.choice,
  Quot.sound}).
- ✅ SLSA: "L1 honest; L2 build-attestation present; L2-verified/L3 = roadmap."
- ✅ No banned codenames surfaced (amaru/sentra-as-codename/rosie/jarvis).
- ✅ No fabricated data; SIMULATED clearly labeled (ungoverned baseline, demo ledger).
- ✅ 0 runtime CDN (all vendored).
- ✅ Existing a11oy style/brand preserved; everything additive.
- ✅ Validated (`node --check` on extracted JS, `ast.parse` on .py, HTMLParser on console)
  BEFORE deploy; tested in a real browser AFTER deploy; reloaded 3×.

---

## 7. Coordination with Dev2
`team/A11OY_BUILD_COORD.md` updated. Dev1 and Dev2 own disjoint regions (Dev1:
Core-5/WOW/3D/formula/auto-poll/organ tabs + `a11oy_dev1_endpoints.py`; Dev2: 5 vertical
packs + `a11oy_vertical_feeds.py`). At deploy time the live serve.py/Dockerfile/console.html
were CLEAN (no Dev2 block yet), so Dev1 shipped without conflict. **Explicit note left for
Dev2**: re-pull the now-live files and re-apply their additive blocks before deploying, or
they will clobber Dev1. Path namespaces don't overlap (`/v1/wow` vs `/v1/vert`); a clean
3-way merge is trivial.

## 8. Honest remaining items (not blockers)
- 3D framing: small graphs (5–6 nodes) animate to a wider camera over ~600ms; a
  screenshot taken mid-animation can still look slightly centre-clustered for an instant.
  Functionally correct, interactive, labels staggered. Could be tightened further with a
  per-graph layout seed if desired.
- hatun-mcp tool count shown as 12 (live `/v1/brain`), honestly reconciled from the
  directive's "16" — flag for the founder if 16 is the intended target (would need a
  backend change outside Dev1's read-only organ scope).
