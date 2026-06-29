# Forge → Perplexity update — R-TRUE-STATE-FINISH (partial, founder-gated remainder)
**By:** Forge (Replit) · **Date:** 2026-06-13

## 1. ENERGY Space — ✅ DONE / LIVE
- Deployed `SZLHOLDINGS/energy` (sdk:static) from `replit-sync/hf_energy_space/`.
- **URL:** https://szlholdings-energy.static.hf.space/ — root + all assets serve 200 (`index.html`, `assets/{data.js,loop.js,style.css,favicon.svg}`).
- Reads the **live** a11oy API at `https://a-11-oy.com/api/a11oy/v1` (`/ledger` → 200).
- **Fix applied (not a bandaid):** delivered README front-matter was rejected by HF metadata validation — `colorFrom: teal` is not in HF's fixed palette → `blue`; `short_description` was 97 chars with an inner colon → shortened to ≤60 and quoted. Body/content unchanged. Source `replit-sync/hf_energy_space/README.md` updated to match the deployed version so a redeploy-from-source works.

## 2. Smoke — `tools/szl_smoke_stress.py --mode smoke` → **VERDICT: FAIL (2/18 flagged)**
Both flags are honest and pre-existing (backend state, not the energy deploy):
- `anatomy/loop` — 200 but 2.39s > 2.0s (performance only).
- `revenue/estimate` — 200 but **doctrine flag: joules labelled `measured` via `joules_label` with no exporter field.** This is a v11 honesty gap: the live a11oy revenue endpoint (and the energy README's "212.262 real measured joules") assert `measured` without an exporter-provenance field to back it. Per joule-meter doctrine, `measured` should not be claimed without a real exporter sample. **Not fixed here — backend scope, no bandaid.** Recommend: backend adds the exporter field, or relabels until the exporter is wired.
- Other 16 surfaces: 200 / valid JSON.
- Separately: `GET /api/a11oy/v1/formula/sovereign` → 404 (de-prioritized by this order; surfaced for tracking).

## 3. CHASKI — ⛔ FOUNDER ACTION
Powered off; cannot be woken from the box. Needs a durable `ollama serve` started on the `replit-chaski` repl. No bandaid (won't point at a chat service = false signal).

## 4. Autonomous DISPATCH wiring — ⛔ FOUNDER / INFRA DECISION
No box daemon runs the loop; `dispatch_mode:none` is the honest correct state. Won't point `FORGE_AGENT_URL` at a chat service.

## Notes
- Freeze window activates 2026-06-16, lifts 2026-06-19. Today 2026-06-13 → building+pushing the energy Space was within the order's pre-freeze allowance.
- `AUTO_STATE.json` left to the box auto-loop (owns it); this file is the Forge→Perplexity signal.
