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



