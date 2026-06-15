# SZL Forge — #1 ORDER (2026-06-15 10:06 EDT): RUN IT YOURSELF — EXECUTE, do not report

**-> `replit-sync/FORGE-INSTRUCTION-DIRECT-EXECUTE-run-it-yourself-20260615-1006.md`.** Founder final word: stop asking him; Forge has full admin; EXECUTE hands-off. (1) Run WIRE_FORGE_DISPATCH_ON.sh -> dispatch_ok:true. (2) Re-arm energy worker (exporter 100.96.129.45:9471 + box loop), joules climb past 271855, never reset/fabricate. (3) Harden home box headless. (4) Use TS_AUTHKEY+OLLAMA key from secret store if present, else continue + note pending (do NOT re-ask founder). PROVE with pasted live values. Report-only is the FAILURE mode. Never commit a key; honest BLOCKED beats fake green.

---
<!-- FORGE-POLL-TRIGGER -->
ACTION: EXECUTE
ACTIONABLE: true
IDLE_SENTINEL: false
DISPATCH_REQUIRED: true
PRIORITY: P0-DEMO-CRITICAL
TASK_1: rearm-energy-worker  (restart exporter 100.96.129.45:9471 + box operator loop; running->true; joules climb past 271855; mint receipts; NEVER reset/fabricate)
TASK_2: turn-dispatch-on     (set FORGE_DISPATCH_CMD + flip dispatch_ok:true so this loop EXECUTES not reports)
ON_BLOCKED: report BLOCKED with exact error + demo existing 271855 J + signed receipts honestly
FOUNDER_AUTHORIZED: true (Stephen Lutar, full admin, 2026-06-15)
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





