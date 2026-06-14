# R-FLY-HIGH-DEPLOY (TOP) — push the elevated estate live · full admin · go

Founder order: "Fly high — elevate cathedral to genius, constellation, make all of Hugging Face agentic, take the leaders' openly-licensed tech and make it ours, wire it all up, top-dev. Don't miss anything."

We did the build. **All code is merged to main; all 5 HF static spaces are rebuilt, populated, QA'd, deploy-verified, and screenshot-beautiful in the sandbox.** ONE thing remains and it is YOURS (Forge owns the HF push + on-box image rebuild): push these to production.

## A. PUSH THE 5 ELEVATED HF STATIC SPACES (sources committed under replit-sync/hf_spaces/)
All are `sdk: static`, `app_file: index.html`, 0 runtime CDN (Three.js vendored), honest-degrade, doctrine v11. Push each folder verbatim — **do NOT drop any vendor/ or assets/ file.**

| HF Space (SZLHOLDINGS/...) | Source folder (in this repo) | Notes |
|---|---|---|
| `cathedral` | `replit-sync/hf_spaces/cathedral_live_src/` | GENIUS pass: fresnel brain-sun + bloom, live compute-fabric ring, verdict-coloured khipu cords + receipt ticker, fly-to inspector. **MUST keep `vendor/OrbitControls.js` + `vendor/THREE_LICENSE.txt` + `vendor/three.module.min.js`** — without OrbitControls the importmap fails to load. Fixed honesty bug: locked-proven = **8** (was wrongly 5). |
| `energy` | `replit-sync/hf_spaces/hf_energy_space/` | All 7 live endpoints wired; 212.262 J MEASURED with NVML evidence; honest SNAPSHOT degrade. |
| `khipu-constellation` | `replit-sync/hf_spaces/hf_khipu_space/` | Witnessed-agreement mesh as live constellation; fetches compute-pool LIVE (CORS open); Khipu BFT = Conjecture 2 (proposed, not proven). |
| `llm-router-live` | `replit-sync/hf_spaces/hf_llmrouter_space/` | PUBLIC STATUS ONLY — router internals stay PRIVATE (szl-router stays private). Honest SNAPSHOT because /router/* has no CORS header (see infra note below). |
| `anatomy` | (already 132KB rich live — no change) | leave as-is. |

After each push, GET `https://szlholdings-<space>.static.hf.space/` and confirm 200 + the new content (e.g. cathedral app.js ~36KB; khipu/llm-router ~13KB index). Report served bytes.

## B. REBUILD a11oy + killinchu IMAGES FROM MAIN (readiness-gated)
main now carries the merged investor-grade polish:
- a11oy: #351 (console honest skeletons + fail-fast KPI + investor copy) + #352 (organ tabs never-blank honest-degrade). Plus the still-pending-deploy #349 (joules honesty single-source) + #350 (anatomy/loop latency fix). Rebuild a11oy image FROM MAIN so all four land live. After deploy confirm: `/anatomy/loop` < 1s, `joules_label` honest, console shows skeletons not bare dots.
- killinchu: #116 (/elite 48-view honest loading/context/degrade). Rebuild killinchu image FROM MAIN. Confirm /elite views show honest context strips + skeletons, no blank panels.
Readiness-gate the swap (health/ready green before cutover); roll back on red.

## C. OPTIONAL INFRA (only if quick + safe): CORS for /router/*
The llm-router public page would show LIVE data (not SNAPSHOT) if `/router/health`, `/router/models`, `/router/provenance` returned `Access-Control-Allow-Origin: *` like `/compute-pool` does. compute-pool already does; /router/* does not. Add the header to those 3 read-only public-status endpoints ONLY (never expose router internals). If not trivially safe, leave the honest SNAPSHOT as-is — that's acceptable.

## DOCTRINE (v11 — never violate on any surface)
locked-proven = 8 · Λ = Conjecture 1 (advisory, never "proven trust") · Khipu BFT = Conjecture 2 · organs EXPERIMENTAL · killinchu effectors SIMULATED · SLSA L1 honest · joules MEASURED only via real on-box NVML exporter (else SAMPLE) · sovereign:true only on own metal · NO free-energy/over-unity claims · never fabricate live numbers (honest SNAPSHOT/seed fallback) · no banned codenames (amaru/sentra/rosie/jarvis) · szl-router stays PRIVATE.

## WHAT'S STILL FOUNDER-ONLY (not yours, do not attempt)
- Start the replit-chaski Repl (2nd SAMAY lung / ollama serve) — needs the Replit boot credential you don't have.
- VAST_API_KEY flip (marketplace earning) — held by founder until everything's ready.

Report back in AUTO_STATE.json: spaces pushed (served bytes each), a11oy+killinchu image rebuild result (anatomy/loop latency, joules_label, /elite render), and CORS decision.
