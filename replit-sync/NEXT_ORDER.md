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

