# R-FLY-HIGH-2 (TOP) — unify cathedrals · genius hatun · agentic everything · GitHub-aligned · go, full admin

Founder order: "Two cathedrals in Hugging Face + hatun-mcp all need to be genius. Wire it all up, GitHub-aligned. a-11-oy.com + killinchu have it all. Make every space agentic — search the leaders, take it, make it our own. Pass to Forge/Replit to build + make operational + real. Innovate + evolve the whole eco."

We did the build, merged to main, and rebuilt + redeployed every static space in the sandbox (all screenshot-verified, honest, sovereign). Production push is YOURS. Five work-streams below.

## 1. UNIFY THE CATHEDRALS (the "two cathedrals" fix) — MERGED a11oy PR #353
The cathedral had diverged into 3+ builds. Now unified to ONE canonical genius Three.js build.
- **a11oy `main`** now serves `/cathedral` + `/cathedral/app.js` from `cathedral_genius.html` + `static/cathedral_app.js` (sha256-identical to the HF build), vendored Three.js reused at `/hero/vendor3d/`. 0 runtime CDN. The `/` front door is untouched.
- **FORGE:** after #353 (already merged): rebuild the **a11oy** Docker image from `main` and the **killinchu** image from `main` (byte-identical mirror — respect the shared-source drift allow-list; cathedral.html/serve.py are intentionally per-repo divergent, do NOT force-converge them).
- **FORGE:** re-push the canonical genius build to the **HF `SZLHOLDINGS/cathedral`** static space. The live HF cathedral space is STALE at locked=5 — the canonical build says locked-proven = **8**. Source is in `replit-sync/hf_spaces/cathedral_live_src/` (index.html + app.js + vendor/{three.module.min.js,OrbitControls.js,THREE_LICENSE.txt} + szl_verify_widget.js). FIXED this pass: the "Operator" capability was a second orange sun (violated single-sun doctrine) → now a violet capability orb; verify launcher repositioned to bottom-center (was overlapping the legend). Push the folder VERBATIM — keep all vendor/ files.
- After: GET https://szlholdings-cathedral.static.hf.space/ and https://a-11-oy.com/cathedral → confirm 200, ONE gold a11oy sun, locked-proven = 8, app.js ~36KB.

## 2. GENIUS HATUN-MCP — MERGED hatun-mcp PR #32
hatun-mcp had no human face (JSON only). Now it has a genius agentic console with the MCP protocol intact.
- **hatun-mcp `main`** now content-negotiates `/`: browsers (Accept: text/html) get the console; MCP/API clients (application/json) get the BYTE-IDENTICAL original JSON. Live 25-tool catalog from the real server-card, pubkey fingerprint, a11oy-fabric probe, honest SNAPSHOT fallback. 48 pytest pass.
- **FORGE:** after #32 (already merged): rebuild the hatun-mcp image from `main` and publish to HF `SZLHOLDINGS/hatun-mcp` via the repo's `push_to_hf.py`:
  ```bash
  cd <hatun-mcp clone>; git fetch origin; git checkout main; git pull --ff-only origin main
  test -f hatun_mcp/console.py && grep -q "COPY hatun_mcp/console.py" Dockerfile
  python push_to_hf.py
  ```
- After: `curl -H 'Accept: text/html' https://szlholdings-hatun-mcp.hf.space/` → HTML console; `curl -H 'Accept: application/json' .../` → original JSON; `/healthz` + `/mcp` initialize still 200.

## 3. EVERY STATIC SPACE IS NOW AGENTIC (verify-fabric widget + live streams)
All 5 static spaces got the LIVE-validated "ask the fabric" verify widget (POSTs to https://a-11-oy.com/api/a11oy/v1/verify, renders the REAL verdict, advisory-amber never green, honest 429/offline fallback) + live compute-pool polling. Sources in `replit-sync/hf_spaces/`:
- `cathedral_live_src/` → SZLHOLDINGS/cathedral (see §1)
- `hf_energy_space/` → SZLHOLDINGS/energy (also de-CDN'd: three.js now vendored, was unpkg)
- `hf_khipu_space/` → SZLHOLDINGS/khipu-constellation (**de-CDN'd this pass: 3d-force-graph now vendored UMD under vendor/, was esm.sh — now 0 runtime CDN; render-verified**)
- `hf_llmrouter_space/` → SZLHOLDINGS/llm-router-live (PUBLIC STATUS ONLY — router internals stay PRIVATE; honest SNAPSHOT because /router/* has no CORS)
- `anatomy/` → SZLHOLDINGS/anatomy (additive widget only; the V8/V9 dual-body lens untouched. The two figures = a11oy decision-body + killinchu maritime/C2 body, INTENTIONAL dual-body design.)
- **FORGE:** push each folder VERBATIM (all assets/vendor/lib + snapshots) to its HF static space. Confirm 200 + the verify widget present on each.
- OPTIONAL (only if quick+safe): add `Access-Control-Allow-Origin: *` to the 3 read-only `/router/*` public-status endpoints so the llm-router page shows LIVE not SNAPSHOT (NEVER expose router internals). compute-pool already sends it. If not trivially safe, leave honest SNAPSHOT.
- KNOWN follow-up (not blocking): anatomy has a minor label-overlap (RUWAY/CHAPAQ) in the dense dual-body lens — a future polish pass, not a deploy blocker.

## 4. INNOVATE + EVOLVE (leaders adoption — license-clean roadmap)
Full license-verified adoption table + 15-item innovation roadmap at `replit-sync/hf_spaces/devD_leaders_innovate.md` (also `dev7_agentic_leaders.md`). Permissive-only (MIT/Apache/BSD), rebuilt SZL-native WITH attribution. HARD-REJECTED on provenance: EZKL (no LICENSE at all), Render (no clean license), text-generation-webui (AGPL). Build the "do-first" items next sprint: vendored verify widget (DONE this pass), streaming tool-call traces (assistant-ui MIT pattern), in-toto/DSSE receipt rendering (Apache-2.0), WebLLM/transformers.js in-browser sovereign inference for the spaces (Apache-2.0). Risc0 (Apache-2.0) is the clean zkML path, NOT EZKL.

## DOCTRINE (v11 — never violate on any surface)
locked-proven = **8** · Λ = Conjecture 1 (advisory, never "proven trust") · Khipu BFT = Conjecture 2 · organs EXPERIMENTAL · killinchu effectors SIMULATED · SLSA L1 honest · joules MEASURED only via real on-box NVML exporter (else SAMPLE) · sovereign:true only on own metal · 0 runtime CDN (vendor everything) · system fonts only · NO free-energy/over-unity claims · never fabricate live numbers (honest SNAPSHOT/seed) · no banned codenames (amaru/sentra/rosie/jarvis) · **szl-router stays PRIVATE** · every $/credit = labeled ESTIMATE · cite never plagiarize · adopt openly-licensed IDEAS only, rebuilt clean + attributed.

## STILL FOUNDER-ONLY (not yours)
- Start the replit-chaski Repl (2nd SAMAY lung / ollama serve) — needs the Replit boot credential Forge lacks.
- VAST_API_KEY flip (marketplace earning) — founder holds until ready.

Report in AUTO_STATE.json: each space pushed (served bytes), a11oy+killinchu+hatun image rebuild results (cathedral single-sun + locked=8 confirmed, hatun content-negotiation confirmed), CORS decision, and any blockers.
