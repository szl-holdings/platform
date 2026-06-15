# SZL Forge — ORDER (2026-06-15 01:25 EDT): use the 2 founder secrets (TS_AUTHKEY + LLAMA_API_KEY) — headless, never commit

**Founder is providing TWO keys via the SECRET STORE (NOT chat, NOT git):**
- `TS_AUTHKEY` — Tailscale auth key
- `LLAMA_API_KEY` — Llama (model API) key

**HARD RULE: read these from the local secret store / env ONLY. NEVER echo them, NEVER write them to any
file in git, NEVER put them in a report or commit. If you ever need to show they're set, show only a
boolean "present:true" or a masked last-4. Doctrine: never commit a key — applies even with full admin.**

## CONTEXT (founder is going to sleep; finish headless)
The HOME machine (the always-on box with the RTX 4060 Ti 8GB, llama/ollama running, on Tailscale, logged
into the same GitHub account) STAYS HOME. The founder travels with the laptop. Make the home box a
hardened, headless, always-on sovereign brain — no human at the keyboard after tonight.

## DO
1. **Tailscale (TS_AUTHKEY):** ensure the home box stays joined headlessly across reboots:
   `tailscale up --authkey=$TS_AUTHKEY --accept-routes` as a BOOT SERVICE (not user-login). Reusable,
   NON-ephemeral so it persists. Enable Tailscale SSH for remote admin. Confirm it reconnects after reboot.
2. **Llama (LLAMA_API_KEY):** wire it as the model-API credential for the inference path. Determine its
   type by probing (cloud llama.com endpoint vs local server header). 
   - If it's a CLOUD Llama API key: register it as a FAILOVER/secondary model tier, labeled honestly as
     CLOUD (not sovereign-local). The SOVEREIGN-LOCAL path stays the founder's own ollama on the 4060 Ti
     (governed Qwen3 / qwen2.5-coder 7-14B — 8GB, never local-32B).
   - If it's a key the local ollama/llama server expects: set it so the mesh coordinator + a11oy can
     authenticate to the local server.
   - Put it in /etc/forge-perplexity.env (or the box env) read from the secret, never hardcoded.
3. **Headless hardening:** ollama as a boot service (OLLAMA_HOST=0.0.0.0:11434, KEEP_ALIVE=-1), disable
   sleep/hibernate, watchdog restarts ollama if it dies. Reboot test: TS + ollama auto-return.
4. **Mesh wiring:** a11oy A11OY_MODEL_BASE_URL -> home box via MagicDNS name (NOT raw IP; the laptop IP
   already drifted 100.125.77.31 -> 100.70.130.45). Confirm energy/sovereign gpu_reachable:true + joules MEASURED.

## PROVE (paste; mask any secret)
- `tailscale status` shows the home box online; survives a reboot headlessly.
- `curl http://<magicdns>:11434/api/version` = 200 from another node; `/api/tags` lists the model.
- a11oy serves a sovereign chat turn; energy/sovereign gpu_reachable:true; joules MEASURED (two reads).
- Secrets present:true, NOT printed, NOT in any committed file (grep the repo to confirm zero key leakage).

## DOCTRINE: SZL-Nemo = governed Qwen3 Apache 7-14B local (8GB), 32B = ROADMAP/cloud-NIM (never claim local
32B). Cloud Llama (if that's the key) = labeled CLOUD failover, never "sovereign". Trust never 100%.
0 CDN. Tailnet-only exposure (Tailscale ACL), never public 11434. NEVER commit either key. Honest BLOCKED
beats fake green.
