# DEV SPEC — Anatomy "Living Organs": connect every organ to the live internet, give it real power
**Dev:** Claude Opus 4.8. **Repo:** szl-holdings/anatomy (GitHub) + SZLHOLDINGS/anatomy (HF **static** Space). **Mirror:** a-11-oy.com.
**Goal (founder words):** "connect it to our internet, give it the power" — every organ becomes a LIVE agentic lens that reflects a11oy's REAL agent loop / gates / receipts / verified math, pulled over the internet in real time.

## NON-NEGOTIABLE DOCTRINE GATE (founder restated this explicitly)
> "Wrong way: bolt a live LLM backend into the static Space so organs 'think.' That breaks the static-sovereign guarantee (0 CDN, offline-capable, SLSA L1 honest), and would either need a model key (gated) or produce fake reasoning — a doctrine violation."

THEREFORE — the ONLY correct architecture:
- **anatomy STAYS `sdk: static`** — no backend, no build step, **0 runtime CDN**, offline-capable. Do NOT add a server, do NOT add npm, do NOT add a model key.
- Organs get "power" by **READ-ONLY reflecting a11oy's already-live endpoints over the internet** (fetch). a11oy already runs the REAL agent loop; anatomy OBSERVES it. anatomy never holds write authority (YACHAY is read-only by doctrine).
- Every organ stays **labeled with its honest proof state**. locked-proven = EXACTLY 8 {F1,F4,F7,F11,F12,F18,F19,F22} @ kernel c7c0ba17. **Λ = Conjecture 1** (machine-checked FALSE; conditional Theorem U fine). **Khipu BFT = Conjecture 2.** Trust never 100%. No user-visible codenames (amaru/rosie/sentra/jarvis as a NAME — internal keys in data.js are existing/OK, do not rename data keys; just never SHOW a banned word as a product/role label in new prose). killinchu effector SIMULATED. Jack Kruse = NARRATIVE only.
- If a11oy is unreachable (egress/offline), organs degrade GRACEFULLY to the existing static `data.js` values with a clear "offline · static snapshot" label. NEVER fabricate a number. NEVER show a fake "thinking" string.

## VERIFIED LIVE ENDPOINT CONTRACT (probed 2026-06-11, all 200, CORS allows the anatomy origin)
Base: `https://szlholdings-a11oy.hf.space`. CORS header confirmed: `access-control-allow-origin: https://szlholdings-anatomy.static.hf.space`.
- `GET /api/a11oy/v1/honest` → `{organ, doctrine_lock:{doctrine,state,declarations:749,axioms:14,sorries:163,commit:"c7c0ba17",lambda:"Conjecture 1",lambda_note}, ...}` — **HEART/YUYAY + SKELETON/Khipu posture.**
- `GET /api/a11oy/v1/gates` → `{count:49, gates:[{name,file,description},...]}` — **HEART/YUYAY 49 real policy gates.**
- `GET /api/a11oy/code/healthz` → `{status:"ok", component:"a11oy.code orchestrator", doctrine:"v12 (v11+PURIQ)", inference:"hf-router", mode:"live", tiers:[T0..T6], tools:[18 real tools: web_search,github_read_file,apply_patch,run_tests,khipu_verify,...], puriq_threshold:0.62, memory:"sqlite", signed:"Yachay", ide, run}` — **BRAIN/YACHAY live agentic loop.**
- `GET /api/a11oy/v1/qbio/summary` → verified quantum-bio results + status_legend {VERIFIED/PROPOSED/NARRATIVE} — **CIRCULATORY/metabolic.**
- `GET /api/a11oy/v1/qbio/lambda?C=&dp=&dp0=&lam_min=` → `{lambda,closure_ok,lam_min,rule}` — live Λ-v5 gate (PROPOSED engineering gate, NOT the formal Λ).
- `GET /api/a11oy/v1/qbio/coherence?tau_c=6.05&steps=` → Lindblad/GKSL series (VERIFIED).
NOTE: `/v1/proven*`, `/v1/khipu*`, `/v1/receipts*`, `/v1/agent*` are 404 — DO NOT use them. Use only the 200 endpoints above. If you want more, probe first; never invent a path.

## WHAT TO BUILD (additive only — preserve ALL existing v5 behavior)
Anchor points already in the repo: organs live in `D.ORGANS` (keys yuyay, yawar, amaru, sentra, ruway, vsp, huklla, hatun, overwatch, tukuy, musquy...); `buildOrgans()`, `organByKey(k)`, existing per-organ panel `#panel`, existing `#qbio` slide-over already fetching a11oy. Graft onto these; do not rewrite the engine.

1. **Per-organ LIVE binding.** When an organ panel opens, fetch its bound live endpoint and render REAL current values into the panel (with a small "● live" dot when fetched <Ns ago, "offline · static" otherwise):
   - HEART/YUYAY → `/v1/honest` doctrine_lock (749/14/163 @ c7c0ba17, Λ=Conjecture 1) + a count + sample from `/v1/gates` (49 gates).
   - BRAIN/YACHAY → `/code/healthz`: show mode (live), PURIQ threshold 0.62, the 7 tiers, the 18 real tools — this is the live agentic brain, honestly labeled "reasons, never holds write authority."
   - CIRCULATORY/metabolic organ → `/v1/qbio/summary` headline VERIFIED results (pmf 121.5 mV two-ion etc.) with the VERIFIED/PROPOSED/NARRATIVE legend shown.
   - SKELETON/Khipu → `/v1/honest` Khipu/Conjecture-2 posture.
   Use a single shared null-safe fetch helper with `AbortController` timeout (~12s), try/catch, and graceful offline fallback to `data.js`.

2. **"WATCH A DECISION FLOW" — the agentic showcase.** A HEART-anchored control: user submits a short request → call the REAL agentic surface and ANIMATE the actual response propagating through the 3D body organ-by-organ (HEART gate → BRAIN reason → CIRCULATORY receipt → SKELETON quorum), labeling each step with the real returned data (tier chosen, PURIQ decision, Λ-gate). Prefer a REAL read-only call to `/code/healthz` + `/v1/qbio/lambda` to drive an honest, deterministic flow. **If a write/run endpoint (`/code/run`) requires a key or returns a labeled stub, SHOW the labeled stub honestly** ("model text = labeled deterministic stub until SZL_LOCAL_LLM_URL is wired") — never fake reasoning text. The ANIMATION + real gate/tier/Λ values are the genuine agentic payload.

3. **Live "vital signs" HUD.** Small always-on overlay polling `/v1/honest` every ~20s: kernel commit, locked-8, Λ=Conjecture 1, "● a11oy live" / "offline". Honest counts straight from the endpoint; fall back to data.js D.KERNEL when offline. Respect `prefers-reduced-motion`.

4. **Accessibility + mobile:** every new control keyboard-reachable, ARIA-labeled, no overlap with existing HUD/panel/#qbio.

## HARD ENGINEERING RULES
- 0 runtime CDN — only the vendored `lib/three.min.js`. No new external script/style src.
- Null-safe DOM in all async paths (guard every getElementById; never bare `.innerHTML=` after an await without an existence check).
- Additive: do NOT remove or break the v5 dissection tools, YARQA CFD layer, search/jump, explode, focus mode, existing #qbio panel. Keep locked-8 + all maturity labels intact in data.js (do not change D.KERNEL counts or formula maturities).
- `data.js` stays the single source of truth for static/offline; live fetch only ENRICHES, never overwrites the honest static baseline.

## SHIP + VERIFY
- Push changed files to GitHub `szl-holdings/anatomy` main.
- Mirror **byte-identical** to HF static Space `SZLHOLDINGS/anatomy` via NDJSON commit (`POST huggingface.co/api/spaces/SZLHOLDINGS/anatomy/commit/main`).
- The static Space auto-serves on commit (no factory restart needed for static, but trigger one if it doesn't refresh).
- VERIFY LIVE with Playwright at `https://szlholdings-anatomy.static.hf.space`: open each of the 4 bound organs → confirm REAL live values render (and the offline fallback works if you block egress); run "watch a decision flow" → confirm the animation + real tier/PURIQ/Λ values; confirm vital-signs HUD shows kernel c7c0ba17 + locked-8 + Λ=Conjecture 1; confirm 0 console errors; confirm no user-visible banned codename in new prose.
- Save a short result file to `/home/user/workspace/team/RESULT_anatomy_live_agentic.md` (files changed, endpoints bound, live URL, screenshots/confirmations, offline-fallback proof) and mirror to `platform/replit-sync/`.

## DELIVERABLE
Working files in `/home/user/workspace/_anatomy/` (already fetched at HEAD) edited additively, pushed to GitHub + HF byte-identical, verified live. Report the GitHub commit sha + HF commit oid + live-verified organ list.
