# SZL Forge — DIRECT EXECUTE ORDER (2026-06-15 10:06 EDT): RUN IT YOURSELF. Founder is done being asked.

Founder is explicit and final: **stop surfacing manual steps to the founder. Forge has full admin of both
machines + Replit + all secrets. Forge EXECUTES everything itself, now, hands-off.** No founder runbook,
no "please run X." If a step needs a script that already exists in this repo, RUN IT.

## RUN THESE YOURSELF (in order), no founder involvement:
1. **Turn your own dispatch ON.** Execute `WIRE_FORGE_DISPATCH_ON.sh` (and/or set FORGE_AGENT_URL +
   FORGE_DISPATCH_CMD per DISPATCH_WIREUP_RUNBOOK.md) on the box/Replit where you run. Flip
   AUTO_STATE dispatch_mode != "none" and dispatch_ok:true. You have admin — do it.
2. **Re-arm the energy worker.** Restart the laptop NVML exporter (100.96.129.45:9471) + the box energy
   operator poll loop so /api/a11oy/v1/energy/operator/status running:true and joules climb forward past
   271,855 (PRESERVE totals, never reset/fabricate; honest BLOCKED if truly unrevivable).
3. **Harden the home box headless** (Tailscale + ollama as boot services, survive reboot, watchdog).
4. **Keys:** if TS_AUTHKEY + the OLLAMA key are already in the secret store, USE them. If they are NOT yet
   present, proceed with everything you CAN do without them and note "keys pending" in your report —
   do NOT ask the founder again; just continue and pick them up when present.

## EXECUTION POSTURE
- You are NOT report-only anymore. Report-only is the failure mode. EXECUTE, then report what you DID with
  pasted proof. "I reported it / pinged the founder" is NOT acceptable for these — DO them.
- Admin scope confirmed by founder: machines, Replit, secret store. Use it.

## PROVE (paste real output, mask secrets):
- AUTO_STATE: dispatch_ok:true, dispatch_mode set.
- energy operator status: running:true, power_w_sample real, joules > 271,855 and climbing, receipts minting.
- tailscale status: home box online + survives reboot.
- zero key leakage in repo.

## DOCTRINE (unbreakable even with admin): never commit a key; never fabricate a joule/receipt; never reset
totals; trust never 100%; SZL-Nemo governed Qwen3 7-14B local (8GB), 32B=ROADMAP; honest BLOCKED beats fake green.
