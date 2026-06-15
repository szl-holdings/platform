# SZL Forge — FREEZE WINDOW UPDATED (2026-06-14 20:38 EDT, CTO): now starts 2026-06-18 01:00 ET

**Founder moved the demo-freeze start to 2026-06-18 01:00 ET (= 2026-06-18 05:00 UTC).** It was 2026-06-15.
Landed on a11oy main as `ce7a44e` (hotfix/move-freeze-to-jun18, closes #419): demo-freeze.yml now uses a
timestamp-precise UTC window `2026-06-18T05:00:00Z .. 2026-06-20T23:59:59Z`. **Until 06-18 05:00 UTC, normal
`feat/*` branches land freely** — you do NOT need the hotfix escape hatch for routine work right now. Land all
demo-final work BEFORE 2026-06-18 01:00 ET; after that, only `hotfix/*` + `[demo-hotfix]` + issue-ref + DCO.

---
# SZL Forge — TOP ORDER (pinned 2026-06-14 20:19 EDT, FOUNDER-AUTHORIZED EXECUTE): TURN DISPATCH ON + RUN EVERYTHING

**-> Read `replit-sync/FORGE-INSTRUCTION-EXECUTE-founder-authorized-20260614-2019.md`.** Founder Stephen Lutar
EXPLICITLY authorizes full execution NOW: "Tell Forge to do it — he has full admin of my computer and all software."
This is the standing approval the box/dispatch work was gated on. JOB 0: turn YOUR OWN dispatch ON
(FORGE_AGENT_URL/FORGE_DISPATCH_CMD / WIRE_IT_UP.sh) — AUTO_STATE shows dispatch_mode:none, you've been report-only;
flip dispatch_ok:true and EXECUTE. JOB 1: run the pinned orders hands-off — (a) box-redeploy to current main + expose
git_sha [box still 404s WAQAY/Yupay], (b) laptop-brain Blackwell+Arc mesh, (c) demo-final v2. JOB 2: FIX the NVML
meter — joules stuck 22899.74 / receipts stuck 318 because NVML can't read the Windows Blackwell 5050 over tailnet;
run the power.draw exporter LOCALLY on the laptop (where it CAN read the 5050) + publish /metrics over tailnet, point
szl-joule.env there, PROVE joules CLIMB + receipts mint >318. Honest BLOCKED (demo the 318 real receipts) beats a fake
climbing number. NEVER commit a key even with full admin. Freeze starts 2026-06-18 01:00 ET (= 05:00 UTC) — land well before. Report with
PASTED proof + ping founder.

---
# SZL Forge — TOP ORDER (pinned 2026-06-14 20:10 EDT, CTO): DEMO-FINAL PAYLOAD v2

**-> Read `replit-sync/FORGE-INSTRUCTION-demo-final-v2-20260614-2010.md`.** Four demo-critical jobs, refreshed to
live state (operator already MEASURED ~83,582 J climbing; local-stub already dropped; CTO landed 8+/10 of the 3D
genius-surface PRs into a11oy main). JOBS: (1) flip `/energy/jtoken` ROADMAP->MEASURED via `A11OY_VLLM_METRICS_URL`
Prometheus exposure; (2) recut the szl-warhacker UDS bundle to UN-STAGE a11oy+killinchu from CURRENT main + sign +
prove-install; (3) the box-redeploy order pinned just below now ALSO carries the full 3D surface set live — run it,
then prove per-tab 3D panels render on the live box bound to REAL data; (4) make `chaski` read honest `standby`
(founder-gated, not started) instead of alarming `DEGRADED`. Doctrine v11, every value labeled, 0 CDN, reversible,
honest BLOCKED beats fake green. PRIORITY: box-redeploy (below) + JOB1 + JOB2 first — they change what the founder
can SAY/SHOW on stage.

---
# SZL Forge — TOP ORDER (pinned 2026-06-14 20:06 EDT): REDEPLOY BOX TO CURRENT MAIN + expose git_sha

**-> Read `replit-sync/FORGE-INSTRUCTION-box-redeploy-current-main-20260614-2005.md`.** CTO audit (live) found
a11oy.net box is PARTIALLY STALE: `/api/a11oy/v1/restraint/info`=200 (good, loop-1 RESOLVED) but
`/api/a11oy/v1/waqay/doctrine` and `/api/a11oy/v1/yupay/doctrine` = **404** — today's WAQAY + Yupay builds are NOT
on the box. git-pull + rebuild the box to CURRENT a11oy main (szl_waqay.py, a11oy_waqay_nav.py, szl_yupay.py,
a11oy_yupay_nav.py, szl_willay_gateway.py, szl_mbse_cosim/nav + serve.py registration + Dockerfile COPYs — all
already byte-identical on GitHub+HF) AND expose the box `git_sha` at /api/a11oy/v1/honest (currently `n/a`, which
is why staleness recurs undetected). PROVE with content-types: waqay/yupay doctrine = 200 application/json locked=8
@ c7c0ba17, /honest git_sha == GitHub HEAD, new tabs serve REAL pages not the 272KB SPA shell. NOTE: /holo3d.js +
/restraint/info returning text/html is IDENTICAL on box AND HF — NOT a defect, do not chase it. Hetzner stays
PRIMARY public host. Byte-identical, 0 CDN, never commit a key, honest BLOCKED beats fake done.

---
# SZL Forge — DEMO-CRITICAL ADDENDUM (2026-06-14 18:48 EDT): MAKE JOULES MEASURED ON BLACKWELL + MINT RECEIPTS

**-> Read `replit-sync/FORGE-INSTRUCTION-joules-measured-on-blackwell-20260614.md`.** Your FORGE_LLM_SPEC cutover was
correct (inference->mesh, energy monitors->raw GPU, reversible). BUT joules_measured_total is STUCK at 22899.74 (stale
stub figure, not climbing) and ledger receipts STUCK at 318 — the NVML meter isn't reading the live Blackwell RTX 5050
yet and no new JouleCharge receipts are minting. SURGICAL FIX: point the energy-metering path (szl-joule.env / NVML
exporter) at the now-reachable raw Blackwell GPU (100.125.77.31:11434, NOT the router); confirm joules CLIMB (MEASURED,
fresh); ensure JobRecords carry real joules so receipts mint (chain length > 318 climbing); drop 'local-stub' from
nodes_computing. PROVE with two operator readings a minute apart showing joules increasing + new receipts. If NVML genuinely
can't read the Windows GPU over tailnet, report BLOCKED honestly (we'll demo the 318 receipts + honest reason). Do NOT
revert the inference cutover. Revenue DRY-RUN. This is the heart of the energy demo.

---
# SZL Forge — TOP ORDER (pinned 2026-06-14 18:18 EDT): WIRE FOUNDER LAPTOP AS SOVEREIGN BRAIN + SECONDARY HOST

**-> Read `replit-sync/FORGE-INSTRUCTION-laptop-brain-blackwell-arc-20260614.md`** (full steps) and
`replit-sync/mesh/FORGE_MESH_ORDER.md` (see the 2026-06-14 Blackwell/Arc ADDENDUM + verification checklist).
Founder confirmed live from his `ollama serve` log: laptop `betterwithage` (Tailscale 100.125.77.31) has a
**Blackwell RTX 5050 (CUDA 13.3, compute 12.0, 8GB)** + an **Intel Arc 140T iGPU (16GB SHARED RAM, not VRAM)**
currently idle. DO: (1) `OLLAMA_HOST=0.0.0.0:11434` to expose the brain to the tailnet (Task Scheduler owns
`ollama serve`, detached); (2) `OLLAMA_IGPU_ENABLE=1` to add the Arc as a 2nd lane (Vulkan already on);
(3) extend `mesh/mesh_join.sh` probe to be multi-backend (nvidia-smi AND vulkan/ollama) so the Arc is detected;
(4) coordinator places SZL-Nemo (governed Qwen3-32B Apache, Q4/FP4) on the 5050 + a small model on the Arc —
NEVER shard 32B onto the shared-RAM iGPU; (5) point a11oy `A11OY_MODEL_BASE_URL` at the coordinator, keep HF
failover; (6) ALSO run a11oy+killinchu locally on the laptop as a SECONDARY tailnet host, but KEEP HETZNER
a11oy.net (167.233.50.75) as PRIMARY PUBLIC host (laptop not always-on; demo must not depend on it); (7) fold in
tonight's RTX 4000 + other nodes via the existing any-GPU auto-detect (`FORGE-INSTRUCTION-rtx4000-rig-onboard-20260614.md`).
DOCTRINE: SZL-Nemo = OPEN Qwen3-32B Apache (never from-scratch/Ultra-local); 5050=8GB discrete Blackwell, Arc=shared-RAM
(label honestly); trust never 100%; never commit a key (TS/HF/coordinator tokens = secret store only); 0 CDN;
locked=8 @ c7c0ba17; Λ=Conjecture 1. Honest BLOCKED beats a fake "wired." PASTE PROOF: 100.125.77.31:11434/api/version
reachable from another tailnet node + both devices listed + placement table + laptop secondary reachable + Hetzner still primary.

---
# SZL Forge — TOP ORDER (pinned 2026-06-14 17:28 EDT): FULL UDS ALIGNMENT + DEPLOYABILITY (WarHacker)

**-> Read `replit-sync/FORGE-INSTRUCTION-uds-full-alignment-20260614.md`.** Founder needs GitHub<->HF<->a11oy.net<->killinchu
byte-identical AND the estate as proper UDS bundles (Zarf packages + UDS Package CRs + Pepr operator + UDS fleet + mesh)
that `uds deploy` clean for the demo. Today's merges (energy operator + signed-receipt ledger mint + holographic showcase
+ szl3d toolkit + PNT pillars + showcase pages) made the published bundles STALE (a11oy-bundle:0.5.0 sha d801f8e4 is old).
DO: (1) run lockstep guard, fix GitHub<->HF<->box drift incl. all new files, merge PR #406 hf-sync mirror; (2) RECUT a11oy
+ killinchu Zarf packages from current main + re-digest every bundles/*/uds-bundle.yaml (no stale refs) + sign; (3) confirm
Pepr governance + UDS fleet + uds-mesh wired into the szl-warhacker bundle; (4) PROVE prove-bundle-install / uds-deploy the
szl-warhacker bundle into a UDS test env, paste fresh OCI digests + in-cluster health/receipt proof + the exact
`uds deploy oci://ghcr.io/szl-holdings/szl-warhacker-bundle:<ver> --confirm` one-liner for the stage. Honest BLOCKED beats
a fake deploy. 0 CDN, no fabricated digests/receipts, revenue DRY-RUN, never commit a key, never weaken a gate.

---
# SZL Forge — ORDER: HARD-CONFIRM the public box is current (no inference, prove with exact URLs)

The founder needs PROOF (not inference) that the always-up public box a11oy.net serves the FULL current estate
before the June 18 demo. Your last report confirmed /estate-hologram=200 on the box but did NOT explicitly confirm
the two paths the CTO audit found STALE (404) on the box.

DO THIS (box-side, you have on-box access; FREEZE-aware — this is verification + a deploy-to-current, demo-critical #1):
1. Rebuild/redeploy the a11oy container on Hetzner 167.233.50.75 (a11oy.net) to current GitHub main (d333b997 or newer)
   AND killinchu.a11oy.net to current killinchu main, byte-identical to GitHub==HF.
2. Then HARD-PROVE by curling these EXACT URLs from the box's public hostname and pasting the real HTTP codes + a content sniff:
   - https://a11oy.net/static/shared/szl_holo3d.js   -> MUST be 200, content-type application/javascript (was 404 stale)
   - https://a11oy.net/api/a11oy/v1/restraint/info     -> MUST be 200 JSON (was 404 stale)
   - https://a11oy.net/api/a11oy/v1/restraint/bench     -> MUST be 200 JSON (was 404 stale)
   - https://a11oy.net/estate-hologram                  -> 200
   - https://a11oy.net/nemo, /autoreview, /factory, /constitution, /quant, /grc, /restraint -> all 200
   - https://a11oy.net/api/a11oy/v1/honest -> 200 with locked=8 @ c7c0ba17, Λ=Conjecture 1, doctrine v11
   - https://killinchu.a11oy.net/elite, /elite/globe, /elite/restraint, /api/killinchu/v1/restraint/info -> all 200
   - sovereign probe: confirm sovereign:true ONLY if the 5050 (Tailscale 100.125.77.31) is live; else honest sovereign:false
3. Confirm restart-recovery: simulate a container restart, confirm both apps auto-recover <60s (systemd/restart:always).

NOTIFY with the actual pasted HTTP codes for EVERY URL above (this is the founder's hard proof), the box image sha/commit
it's running, and the sovereign-probe state. If any URL is NOT 200 after redeploy, say exactly which + why + the fix.
Do NOT claim done by inference — paste the real codes. Doctrine v11 unchanged; never weaken a gate; never commit a key.


---

## CTO ADDENDUM v2 (2026-06-14 16:05 EDT) — PRs ARE MERGED. NOW JUST REBUILD THE BOX.

UPDATE: The CTO merged the full energy + holographic stack to a11oy main himself (admin, all CI green). Main SHA
e24c8374 (or newer) now contains: static/shared/szl_holo3d.js (32412 B), szl_energy_operator.py, szl_energy_ledger.py,
szl_energy_projection.py, joule_billing.py, pages/energy-ops.html, static/3d/energy_showcase/showcase.js + the szl3d
toolkit. 36 energy tests green; serve.py registers operator+ledger+projection+dashboard routes. NO MERGE WORK LEFT.

YOUR ONE JOB NOW (demo-critical #1): REBUILD/REDEPLOY the a11oy container on Hetzner 167.233.50.75 from current main
(e24c8374+), byte-identical GitHub==box. Then START the energy operator on the box and leave it RUNNING. Then HARD-PROVE
by curling these EXACT URLs from a11oy.net and pasting the REAL HTTP codes (the box is currently STALE — all below are
404 right now and MUST become 200 after the rebuild):
   - https://a11oy.net/static/shared/szl_holo3d.js                    -> 200 (application/javascript) — fixes the 3D demo
   - https://a11oy.net/api/a11oy/v1/restraint/info  AND  /restraint/bench -> 200 JSON
   - https://a11oy.net/api/a11oy/v1/energy/operator/status            -> 200, jobs_done>0, joules_measured_total>0 (MEASURED)
   - https://a11oy.net/api/a11oy/v1/energy/ledger                     -> 200, signed receipts + chain integrity ok
   - https://a11oy.net/api/a11oy/v1/energy/projection?window=running  -> 200, 1-day numbers (MODELED, math shown)
   - https://a11oy.net/energy-ops  AND  /energy-holographic  AND  /holographic  AND  /estate-hologram -> all 200
REPORT the actual measured 1-day number from the running operator (the figure the founder asked for) + the box image
commit it's running. sovereign:true ONLY on a live 5050 probe; degrade honest if down. Revenue stays DRY-RUN/MODELED
(no Stripe key). Do NOT claim done by inference — paste the real codes. If any stays 404, say exactly which + why + fix.
Deadline: demo-sound before June 16.



