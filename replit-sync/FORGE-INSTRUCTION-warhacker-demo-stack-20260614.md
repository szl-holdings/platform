# FORGE ORDER — WarHacker June 18 demo stack: energy operator + holographic showcase + F1 (after hosting)

Issued: 2026-06-14 by CTO. Doctrine v11. PROVE-OR-DOWNGRADE. Report to AUTO_STATE.json.
DEMO DEADLINE: **Defense Unicorns WarHacker — founder demo June 18** (4 days). This order is demo-critical.

## SEQUENCE (do in this order — hosting first, it's your current top order)
**STEP 0 (KEEP your current order):** Finish ALWAYS-UP hosting (a11oy + killinchu always-on off HF free tier on the Hetzner box, inference → sovereign GPU over Tailscale). That stays priority #1. The items below land ON the always-up box so they're in the demo.

Then merge + deploy these EXISTING, TESTED PRs (all branched cleanly, all DCO-signed, none merged yet). They are additive and do not weaken any gate.

## STEP 1 — Energy operator stack (the "press play → it earns" demo centerpiece)
Merge in dependency order, run tests, then deploy to the box:
- **#394** energy/01-operator — `szl_energy_operator.py`: press-play daemon, real inference jobs → MEASURED joules. Endpoints POST /energy/operator/{start,stop}, GET /status. (In sandbox it ran STUB; ON THE BOX with the sovereign GPU + NVML exporter reachable it runs REAL — that's the whole point.)
- **#391** energy/02-ledger — `szl_energy_ledger.py` + vendored joule_billing.py: signed JouleCharge.v1, hash-chained offline-verifiable ledger, DRY-RUN billing (no Stripe key needed). GET /energy/ledger, /energy/receipt/{idem}.
- **#393** energy/03-projection — `szl_energy_projection.py`: 1-day + scale projections from the REAL measured rate. GET /energy/projection?window=running. (Honest: at low draw the live rate projects lower than the full-power CSV — report the MEASURED rate, it scales up as the operator drives the GPUs.)
- **#392** energy/04-dashboard — `pages/energy-ops.html` at /energy-ops: the press-play "Today" console (PLAY/STOP button, live counters, receipt feed, grid-paying-us banner).

**PROVE:** after deploy, START the operator on the box, let it run a real window, then:
- GET https://a11oy.net/api/a11oy/v1/energy/operator/status → jobs_done>0, joules_measured_total>0 (MEASURED), nodes computing.
- GET .../energy/ledger → signed receipts present, chain integrity ok.
- GET .../energy/projection?window=running → 1-day numbers (MODELED, math shown).
- Report the ACTUAL measured rate + 1-day projection in AUTO_STATE.json AND write it to a `forge-energy-oneday-proof-<stamp>.md` report. THIS is the number the founder asked for ("how much can we make in 1 day + what compute we get done").
- Leave the operator RUNNING (the founder wants it computing non-stop).

## STEP 2 — Holographic 3D energy showcase (18 live graphs, the visual demo)
- **#397** energy/06-holographic — bundles the szl3d toolkit (boot/live/label, vendored three.js r170, /holographic shell) + `static/3d/energy_showcase/showcase.js` (18 live 3D graphs) on THREE surfaces: /holographic energy tab, /energy-holographic page, AND web/energy.html (the HF SZLHOLDINGS/energy Space — hf-sync mirrors it).
- It also fixes the pre-existing a11oy_cone jsdelivr 0-CDN violation.
- **PROVE:** /holographic 200, /energy-holographic 200, each of the 5 endpoints it polls 200, AND the HF energy Space shows the 18-graph showcase (mirror via hf-sync). 0 CDN. Honesty chips render. Report status.

## STEP 3 — F1 PNT pillars (DARPA-relevant, lower demo urgency)
- **#379** flyhigh/f1-compute-bounds — wires pnt_resilience + nav_coasting (currently live as wired:false) so ALL FOUR /pnt/limits pillars report wired:true honestly. Needs a rebase + the Gitleaks false-positive allowlist (private_key: is a PARAMETER NAME in runtime-attestation, not a secret — scope the allowlist, don't disable the rule). PROVE: all 4 pillars wired:true at /api/a11oy/v1/pnt/limits.

## STEP 4 (optional, if time) — the 8 other 3D estate surfaces
- #381-#390 (toolkit + fabric/pnt/counter-uas/governance/pinn/router/anatomy/estate + integration). #397 already bundles the toolkit; integrate the rest if the demo benefits. Mesh the 5 governance gap routes (engines in repo root) so the governance surface lights up.

## DOCTRINE / DO-NOT
- 0 runtime CDN. No fabricated joules/dollars/200s. Revenue MEASURED only when a real charge clears (none will until founder adds Stripe — keep DRY-RUN/MODELED). Joules MEASURED only via real NVML. sovereign:true only on live GPU probe. Never commit a key. Never touch lutar-lean. Preserve every honesty label. If any step genuinely can't go live (e.g. a node down), report BLOCKED honestly — do not fake a 200.
- Founder-gated (operator runs WITHOUT these; they only flip projection→real revenue / scale): STRIPE_API_KEY, VAST_API_KEY, rig #3 tailnet IP.
