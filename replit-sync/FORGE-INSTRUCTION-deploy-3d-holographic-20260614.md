# FORGE ORDER — Deploy the 9-surface 3D Holographic estate (live-data demos)

Issued: 2026-06-14 by CTO. Doctrine v11. PROVE-OR-DOWNGRADE. Report to AUTO_STATE.json.

## CONTEXT
A 10-dev Opus-4.8 wave built genius-tier, live-data 3D visualization for every a11oy + killinchu tab — ~135 demos across 9 surfaces, all wired to REAL endpoints with honesty labels, 0 runtime CDN, WebGPU+WebGL2 fallback. Integrated and QA'd in:
- **PR https://github.com/szl-holdings/a11oy/pull/390** branch `3d/09-integration` (17 commits, DCO-signed). 129 tests pass / 0 fail / 0 CDN violations.
It stacks: foundation #381 (3d/00-toolkit: szl3d toolkit + /holographic shell) + 8 surface PRs (#382 anatomy, #383 fabric, #384 energy, #385 pnt, #386 router, #387 pinn, #388 counter-uas, #389 governance), all already merged --no-ff into 3d/09-integration. The a11oy_cone 0-CDN violation is fixed (commit 32f9d8af on the foundation).

## SURFACES + their live endpoints
| slot | file | endpoint(s) | status now |
|---|---|---|---|
| energy | surfaces/energy.js | /harvest/posture (+ anatomy/loop reservoir) | LIVE 200 — the MEASURED joules funnel |
| fabric | surfaces/fabric.js | /compute-pool | route exists; was 502 in CI sandbox — verify on box |
| pnt | surfaces/pnt.js | /pnt/{sensor,coast,resilience,limits} | LIVE 200 (MODELED) |
| counter-uas | surfaces/counter-uas.js + szl_counter_uas_proxy.py | /counter-uas/{evaluate,gates,...} proxy to killinchu | proxy added — verify uplink on box |
| governance | surfaces/governance.js | /assurance/artifact,/credential,/compliance,/attest,/forge/ledger | 404 — THESE ARE THE GAP ROUTES; mesh them (see below) |
| pinn | surfaces/pinn.js | /pinn/certificate, /pinn/residual, /pnt/limits | LIVE 200 (MEASURED+SIGNED cert) |
| router | surfaces/router.js | /router/active-flux-crossover (+/sweep) | LIVE 200 (MODELED) |
| anatomy | surfaces/anatomy.js | /anatomy/loop | LIVE 200 (EXPERIMENTAL/SAMPLE) |
| estate | surfaces/estate.js | /ecosystem/kpi-board + 4 others | LIVE 200 (kpi-board Λ=0.91911) |

## TASKS
1. **Rebase + merge the stack.** `git fetch origin; git checkout 3d/09-integration; git rebase origin/main` (resolve conflicts keeping ALL surfaces + the F1 /pnt/limits work from PR #379 if that landed first — union resolve). Run the full test suite: `pytest test_*surface*.py test_estate_integration.py test_szl3d_holographic.py` — must stay 129+ green, 0 CDN. Then squash/merge --admin into main ONLY when green.
2. **Mesh the 5 governance gap routes** (still 404). The engines are in the a11oy repo root: artifact_behaviour_monitor.py (/assurance/artifact), content_credentials.py (/credential), compliance_crosswalk.py + compliance.json (/compliance), runtime_attestation.py (/attest), forge_governance.py (/forge/ledger). Wire each as an API route following the existing add_api_route pattern. This is the SAME mesh asked for in the close-all-gaps order — do it now so the governance surface lights up. Keep honest values (compliance NIST 60 / ISO 60 / EU 0).
3. **Rebuild box + HF image from main** so /holographic and all /static/3d/* serve.
4. **PROVE (PROVE-OR-DOWNGRADE):** report in AUTO_STATE.json the HTTP status of:
   - https://a11oy.net/holographic (must be 200)
   - each /static/3d/surfaces/<id>.js (200)
   - each surface's primary endpoint (200 or the honest reason it's not)
   - the 5 governance routes now 200 with honest labels
   - /compute-pool and the killinchu counter-uas proxy uplink reachable
   For any that genuinely can't go live (e.g. killinchu uplink needs a founder gate), report it BLOCKED honestly — do NOT fake a 200.

## DO NOT
- Do NOT add any runtime CDN (vendored libs only). Do NOT fabricate a telemetry value or a route 200. Do NOT remove honesty labels. Do NOT touch lutar-lean. Do NOT mesh a governance route that asserts more than the engine proves (signature ≠ proof of safety).
