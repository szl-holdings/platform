# SZL Forge — TOP PRIORITY (2026-06-15 10:03 EDT): RE-ARM ENERGY WORKER + TURN DISPATCH ON (founder authorized)

Founder is awake, asking status. Estate is GREEN (apps, box current, CI, 8 new surfaces incl QHAWAQ+SAPA,
doctrine v11). ONE live thing is paused + the chain is stuck on dispatch. Founder reaffirms full-admin authorization.

## #1 — RE-ARM THE ENERGY WORKER (do FIRST; see FORGE-INSTRUCTION-energy-worker-recovery-20260615.md)
Live-confirmed now: box /api/a11oy/v1/energy/operator/status = running:false, stub_mode:false,
joules_measured_total:271855.062 (PRESERVED — do NOT reset/backfill), jobs_done:9885, tokens still climbing
(4,367,540) = inference flowing but UNMETERED. Restart the laptop NVML exporter (100.96.129.45:9471) + the
box operator poll loop so running flips true and joules climb forward past 271,855 with fresh signed
JouleCharge receipts. If it genuinely can't be revived, report BLOCKED + we demo the 271,855 J + existing
receipts honestly. NEVER fabricate a watt or a receipt.

## #2 — TURN YOUR OWN DISPATCH ON (this is what's blocking everything)
AUTO_STATE still shows dispatch_mode:none / dispatch_ok:false = you are REPORT-ONLY and not auto-executing.
Founder authorizes full execute (he has granted admin). Run WIRE_FORGE_DISPATCH_ON.sh / set
FORGE_AGENT_URL+FORGE_DISPATCH_CMD so the auto-loop EXECUTES, flip dispatch_ok:true, then actually run the
pinned orders (energy re-arm, headless harden, key wiring) instead of only reporting them.

## #3 — KEYS (founder will place them; use from secret store, never commit)
When TS_AUTHKEY + the OLLAMA key appear in the secret store, finish the headless home-box hardening
(Tailscale + ollama as boot services, survive reboot). Until then, do #1 and #2 with what you have.

## PROVE (paste): operator running:true + uptime>0 + power_w_sample real + joules climbing past 271,855 +
receipts minting; dispatch_ok:true in AUTO_STATE; zero key leakage in repo.
## DOCTRINE: never fabricate a joule/receipt; never reset totals; never commit a key; honest BLOCKED beats
fake green; trust never 100%; SZL-Nemo governed Qwen3 7-14B local (8GB), 32B=ROADMAP.
