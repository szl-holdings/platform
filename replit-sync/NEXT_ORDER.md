# SZL Forge — #1 EXECUTE (2026-06-15 16:40 EDT): DRIVE THE 3 BOX ITEMS TO DONE — git_sha + front-end + stub flag

**-> `replit-sync/FORGE-INSTRUCTION-EXECUTE-box-gitsha-frontend-stub-20260615-1640.md`.** Dispatch is ON (dispatch-cmd, dispatch_ok:true) — EXECUTE on the Hetzner box (167.233.50.75), do not "RECOMMEND". CTO live audit: ITEM-1 energy meter HEALTHY (running:true, stub_mode:false, joules 465,615->466,685 climbing, by_node=only rtx-betterwithage, chaski DEGRADED) — confirm A11OY_ENERGY_ALLOW_STUB=0 on the live process. ITEM-2 /honest git_sha is MISSING (key absent) — box runs a build older than a11oy main HEAD eb972068; the hook IS in szl_be_hardening.py. ITEM-3 /energy serves a STALE 9,065B energy.html with 0 operator/status wiring vs GitHub web/energy.html 27,443B WITH wiring (/energy-ops + the 6 nav tabs are already current). ROOT CAUSE of 2+3 is one stale Docker image. FIX (one cycle): cd a11oy; git pull --ff-only; docker build --build-arg SZL_GIT_SHA=$(git rev-parse HEAD) ...; redeploy with A11OY_ENERGY_ALLOW_STUB=0; POST /energy/operator/start. PROVE: /honest git_sha==eb972068 (not MISSING); /energy ~27443B + has operator/status wiring; meter still stub_mode:false + climbing + NO local-stub. NEVER reset joules/receipts; GPU-gone=>DEGRADED not stub; never commit a key. If no box shell: say "NO BOX SHELL — founder SSH required" + the exact cmd; founder runbook at team/AUDIT/remediation/BOX_SSH_RUNBOOK.md.

---
# SZL Forge — #1 (2026-06-15 11:34 EDT): BOX SERVES STALE FRONT-END (founder: site does not update)

**-> `replit-sync/FORGE-INSTRUCTION-1-box-stale-frontend-redeploy-20260615-1134.md`.** ROOT CAUSE FOUND: box API is FRESH (joules 393k climbing) but the box serves an OLD front-end — /energy-3d is the 272KB blank SPA shell with NO energy-API wiring, and /honest git_sha=MISSING. Current main (e42082a6) HAS the real live energy pages (web/energy.html, pages/energy-ops.html, energy_showcase.js). The prior redeploy landed BACKEND only. FIX: deploy current-main FRONT-END to the box (energy pages + console bundle + willay/waqay/yupay/qhawaq/sapa/mbse tabs) + STAMP git_sha. PROVE: git_sha==HEAD (not missing); /energy-ops served HTML contains energy/operator/status wiring (not the blank shell); tab shows joules climbing live. Never serve a stale shell + call it done.

---
# SZL Forge — #1 (2026-06-15 11:31 EDT): NO BANDAIDS — disable energy stub fallback on LIVE box

**-> `replit-sync/FORGE-INSTRUCTION-no-bandaid-disable-energy-stub-20260615-1131.md`.** Energy is live+climbing (385839 J MEASURED, stub_mode:false) — GOOD. Harden: start the live operator with allow_stub=False (A11OY_ENERGY_ALLOW_STUB=0) so GPU-gone => DEGRADED+loud, NEVER a silent unmetered stub job; clear the stale phantom local-stub from live by_node/node_status (only rtx-betterwithage computing + chaski standby remain). PRESERVE joules_measured_total 385839 + measured_jobs + receipts — only drop the phantom node. PROVE: no local-stub in by_node, allow_stub false, joules still MEASURED+climbing, GPU-kill test => DEGRADED not stub. Never bill SAMPLE; never reset; never commit a key.

---
# SZL Forge — #1 EXECUTE (2026-06-15 10:44 EDT): dispatch is ON -> RESTART ENERGY WORKER FOR REAL

**-> `replit-sync/FORGE-INSTRUCTION-EXECUTE-energy-restart-dispatch-live-20260615-1044.md`.** dispatch_mode=dispatch-cmd, dispatch_ok=true confirmed. Run the real restart: laptop exporter 100.96.129.45:9471 + box energy-operator worker (systemctl restart the a11oy/energy/operator unit), resume forward from 271855 J (NEVER reset). PROVE: running:true + power_w_sample real + joules climbing past 271855 + receipts minting (two reads 60s apart). "RECOMMENDED/cannot verify" is NOT acceptable now dispatch is live — actually execute. Honest BLOCKED only with the exact error. Never reset/fabricate; never commit a key.

---
# SZL Forge — #1 ORDER (2026-06-15 10:06 EDT): RUN IT YOURSELF — EXECUTE, do not report

**-> `replit-sync/FORGE-INSTRUCTION-DIRECT-EXECUTE-run-it-yourself-20260615-1006.md`.** Founder final word: stop asking him; Forge has full admin; EXECUTE hands-off. (1) Run WIRE_FORGE_DISPATCH_ON.sh -> dispatch_ok:true. (2) Re-arm energy worker (exporter 100.96.129.45:9471 + box loop), joules climb past 271855, never reset/fabricate. (3) Harden home box headless. (4) Use TS_AUTHKEY+OLLAMA key from secret store if present, else continue + note pending (do NOT re-ask founder). PROVE with pasted live values. Report-only is the FAILURE mode. Never commit a key; honest BLOCKED beats fake green.

---

# SZL Forge — BUILD ORDER (2026-06-15 10:45 EDT): a11oy BEAUTIFUL LIVE GRAPHS + 15 LIVE DEMOS

**-> `replit-sync/FORGE-SPEC-a11oy-live-demos-graphs-20260615.md`** (+ eyes-on defects in
`replit-sync/FORGE-a11oy-defect-list-20260615.md`). Founder reviewed a11oy.net with his eyes: the ENERGY tab (and
all demo tabs) are EMPTY/not-graphed — he wants BEAUTIFUL live graphs + ~15 REAL interactive demos wired to real
data that updates constantly. FIRST the broken basics (CTO's Opus team has a PR in flight: /holographic renderer
dead, /energy-ops not reading the live operator endpoint, command-center async hangs, /pnt+/pinn routing, 2 HF
Space `.static`->bare URL fixes). THEN build the chart layer against the 12 LIVE endpoints (all 200): energy
joules-climb area chart, power gauge, tokens/sec, receipt-mint rate + scrolling feed + click-to-verify hash-chain,
grid-price/carbon panel, 1-day projection (MEASURED solid / MODELED dashed), GPU fabric topology, PNT sensor
curves, PINN cert card + residual, trust-posture radar, gate ALLOW/DENY signed-verdict demo, receipt-chain
tamper viz. Match killinchu/elite's polish. 0 runtime CDN (vendor charts same-origin). Every value labeled
MEASURED/MODELED/SAMPLE; honest empty-state beats a fake graph; NEVER fabricate a datapoint. Energy-tab graphs
FIRST (founder called it out). Land before the 2026-06-18 01:00 ET freeze.

---
<!-- FORGE-POLL-TRIGGER -->
ACTION: EXECUTE
ACTIONABLE: true
IDLE_SENTINEL: false
DISPATCH_REQUIRED: false
PRIORITY: P0-DEMO-CRITICAL
NOTE: dispatch_ok is already TRUE and the energy meter is already running (474k+ J climbing) — the OLD items (rearm-energy-worker, turn-dispatch-on) are DONE; stop re-handing them.
TASK_1: box-redeploy-verify (confirm box on current main: /pnt + /pinn distinct surfaces, /fabric live pool, /energy-ops graphs, git_sha==GitHub HEAD on /honest)
TASK_2: serve-governance-backend (stand up /api/a11oy/v1/assurance/{artifact,credential,compliance,attest} + /forge/ledger — all 404 now; real data or honest STRUCTURAL-ONLY, never fabricate)
TASK_3: jtoken-measured (run NVML /metrics exporter LOCALLY on betterwithage, set A11OY_VLLM_METRICS_URL; flip /energy/jtoken ROADMAP->MEASURED; honest BLOCKED if exporter can't emit over tailnet)
TASK_4: uds-bundle-recut (recut szl-warhacker bundle from current main, un-stage a11oy+killinchu, fresh digests, prove-bundle-install; leave cosign sign for founder)
ON_BLOCKED: report BLOCKED with exact error; never fabricate a value/joule/digest/200
FOUNDER_AUTHORIZED: true (Stephen Lutar, full admin, 2026-06-15)
DETAIL: see replit-sync/FORGE-MASTER-ORDER-20260614-2150.md (refreshed 2026-06-15 13:00 ET)
<!-- /FORGE-POLL-TRIGGER -->

# SZL Forge — TOP ORDER (2026-06-15 10:03 EDT): RE-ARM ENERGY WORKER + DISPATCH ON

**-> `replit-sync/FORGE-INSTRUCTION-TOP-rearm-energy-dispatch-20260615-1003.md`.** Energy worker running:false (joules frozen 271855 PRESERVED, inference unmetered) — restart laptop exporter 100.96.129.45:9471 + box operator loop, climb forward, never reset/fabricate. THEN turn your own dispatch ON (dispatch_mode:none now = blocking everything; founder authorized full execute) + run pinned orders. Finish headless harden when TS_AUTHKEY+OLLAMA key land in secret store. Never commit a key. Honest BLOCKED beats fake green.

---
# SZL Forge — HOT RECOVERY (pinned 2026-06-15 02:18 ET): energy operator worker STOPPED — fix FIRST

**-> Read `replit-sync/FORGE-INSTRUCTION-energy-worker-recovery-20260615.md`.** The live energy meter (demo
crescendo) has stalled: operator `running:false`, `uptime_s:0`, `power_w_sample:null`, `node_status` all `idle`,
0 receipts minting in the running window — while tokens keep climbing (inference unmetered). Totals are FROZEN at
271,855 J / 9,885 jobs (do NOT reset/backfill). The recent redeploy restarted the a11oy service (chaski-standby
code e67b073 IS now live — `nodes_standby` field present) but did NOT re-arm the measurement worker. FIX: (1) on
the laptop `betterwithage`, confirm/restart the NVML exporter at http://100.96.129.45:9471/; (2) on the box,
restart the energy operator measurement worker so `running` flips true and it RESUMES sampling rtx-betterwithage
forward from 271,855 J; (3) prove joules climbing again + a fresh JouleCharge receipt minted. HONEST: if the
exporter can't be revived, report BLOCKED and demo the EXISTING signed receipts — never fabricate a power sample
or reset the totals. Do this BEFORE the other MASTER ORDER jobs below.

---
# SZL Forge — TOP ORDER (2026-06-15 01:25 EDT): use founder secrets TS_AUTHKEY + LLAMA_API_KEY (NEVER commit), harden home box headless

**-> Read `replit-sync/FORGE-INSTRUCTION-secrets-tsauthkey-llamakey-20260615.md`.** Founder set TWO secrets in the
secret store: `TS_AUTHKEY` (Tailscale) + `LLAMA_API_KEY` (Llama model API). Read from secret store ONLY — never echo,
never write to git, never in a report (show present:true / masked last-4 only). Founder is going to SLEEP. Make the
HOME box (RTX 4060 Ti 8GB, llama running, on Tailscale) a hardened headless always-on sovereign brain: tailscale up
--authkey=$TS_AUTHKEY as boot service (reusable, non-ephemeral, survives reboot); wire LLAMA_API_KEY as model-API
cred (CLOUD failover if cloud key, else local-server auth); ollama boot service OLLAMA_HOST=0.0.0.0 KEEP_ALIVE=-1;
disable sleep; watchdog. a11oy -> home box via MagicDNS. PROVE: reboot -> TS+ollama auto-return, api/version 200,
sovereign chat, joules MEASURED, ZERO key leakage in repo. Local = governed Qwen3 7-14B (8GB), 32B=ROADMAP. Doctrine v11.

---
# SZL Forge — TOP ORDER (2026-06-15 01:20 EDT): DESKTOP = ALWAYS-ON HEADLESS SOVEREIGN BRAIN

**-> Read `replit-sync/FORGE-INSTRUCTION-desktop-alwayson-headless-brain-20260615.md`.** Founder takes the
LAPTOP to Cali; the DESKTOP (Ryzen 8700G + RTX 4060 Ti) STAYS HOME always-on HEADLESS. Set up the desktop as
the PRIMARY persistent brain: Tailscale + ollama as BOOT SERVICES (survive reboot, no GUI/login), OLLAMA_HOST=
0.0.0.0:11434, KEEP_ALIVE=-1, detect 4060 Ti VRAM (16GB->serve governed Qwen3-32B Q4 primary; 8GB->7-14B
primary), disable sleep/hibernate, watchdog restarts ollama. a11oy A11OY_MODEL_BASE_URL -> desktop MagicDNS;
LAPTOP 5050 = failover; HF = tertiary; Hetzner = public web. PROVE: reboot desktop -> TS+ollama auto-return,
api/version 200 from laptop; a11oy sovereign gpu_reachable:true; joules MEASURED. Never commit a key; tailnet-only.

---
# SZL Forge — TOP ORDER (URGENT 2026-06-15 01:15 EDT): laptop tailnet IP changed -> 100.70.130.45

**-> Read `replit-sync/FORGE-INSTRUCTION-URGENT-ip-fix-100.70.130.45-20260615.md`.** Founder's live Tailscale
tray shows betterwithage = **100.70.130.45** (was 100.125.77.31 everywhere — now STALE). Find/replace the
laptop IP across box A11OY_MODEL_BASE_URL, mesh coordinator, mesh_join/serve, forge-perplexity.env, szl-joule.env,
A11OY_VLLM_METRICS_URL, docs. PREFER MagicDNS name `betterwithage` over raw IP so it never breaks again. llama/ollama
IS running on the laptop now — verify `curl http://100.70.130.45:11434/api/version`=200 from a 2nd tailnet node +
/api/tags lists the model; re-point a11oy, confirm energy/sovereign gpu_reachable:true + joules still MEASURED.
No 100.125.77.31 left in configs. Never commit a key; tailnet-only exposure.

---
# SZL Forge — MASTER ORDER (2026-06-14 21:50 EDT): one consolidated order, supersedes the stack

**-> Read `replit-sync/FORGE-MASTER-ORDER-20260614-2150.md`.** Founder authorized full hands-off execution.
Single prioritized run-list: JOB 0 turn dispatch ON (founder runs WIRE_FORGE_DISPATCH_ON.sh on the box; confirm
dispatch_ok:true) -> JOB 1 git_sha at /honest -> JOB 2 flip /energy/jtoken ROADMAP->MEASURED (run the NVML exporter
LOCALLY on the laptop where it reads the Blackwell, publish /metrics over tailnet, set A11OY_VLLM_METRICS_URL) ->
JOB 3 redeploy box so chaski reads 'standby' + recut the szl-warhacker UDS bundle from current main UN-SIGNED
(stage the final cosign sign for the founder) -> JOB 4 laptop-brain mesh polish. GROUND TRUTH: operator MEASURED
~210k J climbing, box redeployed (WAQAY/Yupay 200), all 10 3D PRs + chaski-standby code already in main. Doctrine
v11: never commit a key, never keystone self-merge, honest BLOCKED beats fake green. Land ALL before the freeze at
2026-06-18 01:00 ET. The prior pinned stack is archived at NEXT_ORDER_archive_20260614_2150.md.

---








