# SZL Forge — ORDER: ALWAYS-UP demo hosting on the sovereign estate (a11oy + killinchu off HF free tier)

PRIORITY: founder has a demo (Defense Unicorns Warhacker, founder demos June 18). The HF free Spaces
(SZLHOLDINGS/a11oy, /killinchu) sleep/rebuild and flicker — UNACCEPTABLE for the demo. Make a11oy + killinchu
ALWAYS-UP, served from the founder's OWN always-on infrastructure, with HF as failover only.

## GROUND TRUTH (confirmed this session)
- a11oy.net = PUBLIC Hetzner server 167.233.50.75 — always-on, already serving a11oy API at https://a11oy.net (200, ~0.37s).
- The sovereign GPU brain = founder's RTX 5050, joined to Tailscale at 100.125.77.31 (PRIVATE tailnet, inference only).
- killinchu.net has NO DNS yet. killinchu currently only lives on the HF free Space (sleeps).
- HF Spaces are free cpu-basic; gcTimeout 48h but they pause on rebuilds/platform pressure → the flicker the founder sees.

## GOAL (make it happen, box-side — you have dispatch ON; founder approved exposing/hosting on the box)
Serve BOTH a11oy and killinchu publicly from the always-on Hetzner box (a11oy.net / 167.233.50.75), with inference
proxied to the sovereign 5050 over Tailscale (100.125.77.31). Hetzner box = PRIMARY public host (never sleeps).
HF Spaces = warm failover/mirror. Honest sovereign labeling preserved (sovereign:true only on live GPU probe).

## STEPS
1. HOST BOTH APPS ON THE HETZNER BOX (a11oy.net): docker compose up a11oy + killinchu containers on 167.233.50.75
   (pull the same images/repos served on HF, byte-identical to GitHub main). a11oy already serves there — add killinchu
   as a second service. Reverse proxy (Caddy or nginx) on :443 with automatic TLS:
     - https://a11oy.net  → a11oy container
     - https://killinchu.net (once DNS set) OR https://killinchu.a11oy.net (subdomain, works immediately) → killinchu container
   Caddy auto-HTTPS is simplest. Keep the existing a11oy.net routing intact (additive).
2. INFERENCE → SOVEREIGN 5050: both containers' model calls route to the 5050 over Tailscale (http://100.125.77.31:11434
   Ollama / the vLLM port) so sovereign:true stays HONEST and live-probed. If the 5050 is asleep/unreachable, the apps
   must DEGRADE honestly (sovereign:false, cloud/local fallback) — never fake sovereign. Keep the live gpu_reachable probe.
3. ALWAYS-ON: systemd units (or docker compose restart:always) for both app containers + the reverse proxy + the
   tailscale daemon, so a reboot auto-recovers. Confirm they survive a simulated restart.
4. DNS: point killinchu.net A-record → 167.233.50.75 if the founder owns it (else use killinchu.a11oy.net subdomain now,
   note killinchu.net registration as a founder TODO). Confirm cert issues for the chosen hostname.
5. HF AS FAILOVER: keep the HF Spaces running (the hourly uptime cron 84b8f79a already auto-restarts them). Optionally add
   a health-based DNS/proxy failover so if the Hetzner box drops, traffic falls back to the HF Space. At minimum, keep HF
   warm as a manual backup URL for the demo.
6. VERIFY: curl https://a11oy.net/api/a11oy/v1/honest (locked=8 @ c7c0ba17, Λ=Conjecture 1, v11) + the killinchu public
   URL /elite + /api/killinchu/v1/... all 200 over many minutes with NO sleep; simulate a container restart and confirm
   auto-recovery <60s; confirm inference still routes to the 5050 (sovereign:true on live probe) and degrades honestly if not.

## HARD LIMITS / DOCTRINE
- sovereign:true ONLY on a live per-GPU gpu_reachable probe — NEVER fake it; degrade honestly if the 5050 is down.
- Keep GitHub↔HF↔box byte-identical on shared modules; never weaken a gate; never commit a key (TLS/Tailscale/NIM keys
  are box secrets, founder-set); locked=8 {F1,F4,F7,F11,F12,F18,F19,F22}@c7c0ba17; Λ=Conjecture 1; doctrine v11; 0 CDN;
  0 visible codenames; effectors SIMULATED. "The half-state — claiming more than is real — is the only unacceptable outcome."
- This is a box production change → it's founder-approved for hosting/exposing the apps; but anything touching a
  cosign-signed artifact / Rekor / a MAJOR config that could break the live a11oy.net → notify founder first.

## NOTIFY
send_notification when both apps are served always-up from the box (title 'SZL always-up: a11oy + killinchu live on sovereign box'
with the public URLs + restart-recovery confirmation + sovereign-probe state), or if you hit a blocker (DNS ownership for
killinchu.net, TLS, 5050 unreachable) listing exactly what the founder must do.
