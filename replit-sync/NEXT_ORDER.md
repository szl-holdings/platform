# FORGE MASTER ORDER — 2026-06-15 15:20 ET (founder: Stephen)

Doctrine v11 throughout. Never fabricate a 200 / receipt / joule / digest. joules MEASURED only via real NVML. Λ = Conjecture 1 (advisory, never "proven trust"). Never commit a key. Never touch lutar-lean (keystone). Honest BLOCKED beats fake green. NEVER bypass Banned-token / doctrine CI gates — fix wording instead. You run `--no-secrets`: do all non-secret work, leave any key/cosign step explicitly BLOCKED-on-founder.

Founder direction (verbatim intent): "have replit chaski second lung popping have that set up and when I boot up I want forge to wire it up now and you jtoken force forge to do it he has full access UDS side have forge do it too."

GROUND TRUTH as of this order (CTO verified live, do NOT re-block what's already done):
- chaski IS reachable on the fabric: compute-pool shows `chaski reachable=true` @ http://100.102.173.88:11434, live model list (qwen2.5:32b, deepseek-r1:14b, codellama:13b, llama3.1:8b, +). gpu_nodes_reachable=2. It is NOT "standby" on the fabric anymore.
- jtoken is ALREADY MEASURED: /api/a11oy/v1/energy/jtoken = 200, label=MEASURED, 0.093 J/token, 762,964 tokens, 71,041 J. DO NOT regress it. Only KEEP it MEASURED.
- The REAL remaining chaski gap: the ENERGY OPERATOR still only computes on `rtx-betterwithage`. chaski is listed in `nodes_degraded` for the energy loop. We want chaski to be a SECOND ENERGY-PRODUCING LUNG, not just reachable.

================================================================
ORDER 1 — CHASKI SECOND LUNG (energy-producing), auto-arm on boot
================================================================
GOAL: when the founder boots the replit-chaski Repl, the energy operator automatically detects chaski reachable and dispatches MEASURED inference jobs to it as a second lung — joules from chaski land in the ledger labeled MEASURED, node=chaski. No founder step beyond booting the Repl.

CONSTRAINT (honest): chaski is a tailnet GPU but its joules must be MEASURED, not modeled. If chaski cannot emit real NVML/energy-per-job numbers over tailnet, you MUST label chaski jobs joules_label=MODELED-PER-TOKEN (using the fabric's MEASURED J/token from rtx as the coefficient) and mark node honesty `joules_source: modeled-from-fabric-coefficient`. NEVER stamp chaski joules as MEASURED unless a real per-job energy reading exists for chaski. Honest beats fake.

DO (on the box, reversibly):
1. In the energy operator config, add chaski as an eligible dispatch target:
   - endpoint: http://100.102.173.88:11434  (Ollama)
   - model: pick a small fast one present on chaski (e.g. `llama3.1:8b`)
   - health-gate: only dispatch to chaski when a 2s GET http://100.102.173.88:11434/api/tags returns 200 AND lists models. If unreachable (Repl not booted), SKIP chaski silently and keep computing on rtx — chaski "offline" is EXPECTED+HONEST, never DEGRADED-alarm.
2. Make detection automatic: the operator's node-poll loop (already polls rtx) should poll chaski every cycle; the moment chaski's /api/tags goes 200, chaski flips into `nodes_computing` and starts receiving its share of jobs. The moment it goes unreachable, it drops back to a clean `offline` (NOT degraded/error).
3. Receipts from chaski jobs: receipt_type SZL.Energy.JouleCharge.v1, node=chaski, with the honest joules_label per the CONSTRAINT above. Chain them into the SAME ledger (prev_digest links unbroken).
4. operator/status must then report chaski in `nodes_computing` (when Repl up) with its own jobs_done/tokens; and the compute-pool already shows it reachable.

PROVE (paste real values in your report, no fabrication):
- GET /api/a11oy/v1/energy/operator/status → show nodes_computing includes "chaski" when reachable; show chaski jobs_done climbing.
- GET /api/a11oy/v1/energy/ledger → show at least one receipt with node=chaski and its joules_label.
- Confirm: if chaski Repl is DOWN, status shows chaski `offline` (clean) and rtx keeps computing — NO red alarm.

REVERSIBLE: gate the whole chaski-energy path behind an env flag e.g. A11OY_ENERGY_CHASKI_ENABLED=1 + A11OY_ENERGY_CHASKI_URL=http://100.102.173.88:11434 so the founder can disable instantly. Persist these on the box so it survives restart (the "auto-arm on boot" requirement).

================================================================
ORDER 2 — JTOKEN: KEEP MEASURED (regression-guard only)
================================================================
jtoken is ALREADY 200 + MEASURED. Do NOT re-engineer it. Tasks:
1. Add a guard so /energy/jtoken can never silently fall back to ROADMAP while the rtx exporter is live: if the metrics source goes stale (no NVML read in > N seconds), the endpoint must say label=MEASURED-STALE with last-good ts, NOT fabricate fresh numbers and NOT silently flip to ROADMAP. Honest staleness.
2. Confirm jtoken stays 200+MEASURED across a box restart (tie its metrics URL env to the persisted config). Report the live JSON.

================================================================
ORDER 3 — UDS BUNDLE RECUT (full non-secret work; leave cosign for founder)
================================================================
You have FULL access for everything EXCEPT the cosign private key (you run --no-secrets). Do ALL of this now; do NOT auto-skip the whole task just because the final sign is gated — split it.

DO (non-secret, do it now):
1. Recut the szl-warhacker UDS bundle from CURRENT main of every member repo. Un-stage a11oy + killinchu (they were STAGED) so they ship as real packages.
2. Produce FRESH package digests + a fresh bundle OCI ref. Run the OCI-ref guard + digest guard (scripts/uds-bundle-publish-guard-checks.sh).
3. prove-bundle-install into k3d: deploy the unsigned bundle into a throwaway k3d cluster, confirm in-cluster health endpoints return 200. Capture the real digests + the install proof.
4. Update UDS_DEPLOY_RUNBOOK.md with the working `uds deploy` one-liner + the fresh OCI ref + digest.
5. Write the prove-install result + fresh digests into replit-sync/AUTO_STATE.json (uds section) and your report.

LEAVE FOR FOUNDER (explicitly, honestly):
- cosign sign of the bundle: report `BLOCKED-on-cosign-key (founder)`. Provide the EXACT one command the founder runs on the box to sign, e.g.:
    cosign sign --key $COSIGN_KEY oci://ghcr.io/szl-holdings/szl-uds-bundle:szl-warhacker-<freshtag>
  with the real <freshtag>/digest filled in. Do NOT attempt to sign. Do NOT fabricate a signature.

PROVE: fresh OCI ref + digest, prove-install in-cluster 200, runbook one-liner updated, and the single exact founder cosign command.

================================================================
REPORT
================================================================
Append a dated section to replit-sync/forge-perplexity-update-20260615.md with, for EACH order: DONE / BLOCKED-on-founder (+ exact unblock command). Paste real probe output. Update AUTO_STATE.json. Honest doctrine v11. If chaski Repl is not booted yet, Order-1 result = "armed, waiting-for-Repl-boot" (that is SUCCESS — the auto-arm is in place), NOT a failure.
