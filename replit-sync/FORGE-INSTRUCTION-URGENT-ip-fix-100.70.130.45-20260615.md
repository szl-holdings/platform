# SZL Forge — URGENT IP FIX (2026-06-15 01:15 EDT): laptop tailnet IP changed to 100.70.130.45

**Founder screenshot (Tailscale tray, live) shows:** `This device: betterwithage (100.70.130.45)`.
**Every prior order + the box used `100.125.77.31` — that is now STALE/WRONG.** Tailscale reassigned
the node IP. Fix everywhere the old IP appears. Founder also confirms **llama/ollama is running** on the
laptop now.

## DO (high priority — silent mesh breakage risk)
1. Find/replace the laptop tailnet IP across ALL configs/orders/scripts:
   OLD `100.125.77.31`  ->  NEW `100.70.130.45`
   Includes: box `A11OY_MODEL_BASE_URL` (-> `http://100.70.130.45:11434/v1`), mesh coordinator config,
   mesh_join.sh / mesh_serve.py references, /etc/forge-perplexity.env, szl-joule.env, any
   A11OY_VLLM_METRICS_URL pointing at the laptop, and the mesh docs.
2. PREFER a STABLE handle over the raw IP so this never breaks again: use the MagicDNS name
   `betterwithage` (or `betterwithage.<tailnet>.ts.net`) instead of the numeric IP wherever the client
   supports DNS — then a future IP change won't matter. Keep the numeric as fallback.
3. Verify ollama/llama is reachable at the NEW address from the box / another tailnet node:
   `curl http://100.70.130.45:11434/api/version` (or the MagicDNS name) -> 200 with version.
   `curl http://100.70.130.45:11434/api/tags` -> lists the loaded model(s).
4. Re-point a11oy inference at the corrected coordinator; confirm /api/a11oy/v1/energy/sovereign shows
   gpu_reachable:true + the real node, and a chat turn is served sovereignly (not hf-router).
5. Re-confirm joules still MEASURED after the re-point (two reads, climbing).

## PROVE (paste real output)
- `curl http://100.70.130.45:11434/api/version` = 200 from a 2nd tailnet node.
- box /api/a11oy/v1/energy/sovereign -> base_url contains 100.70.130.45 (or betterwithage MagicDNS), gpu_reachable:true.
- No remaining grep hits for `100.125.77.31` anywhere in the deploy configs.

## DOCTRINE: never commit a key; honest BLOCKED beats fake green; trust never 100%; 0 CDN;
SZL-Nemo = governed Qwen3-32B Apache. If the laptop firewall blocks 11434 on the tailnet iface, open it
to the tailnet ONLY (Tailscale ACL), never public.
