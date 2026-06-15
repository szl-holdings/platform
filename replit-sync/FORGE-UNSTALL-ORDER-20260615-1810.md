# FORGE UNSTALL ORDER — 2026-06-15 18:10 ET (founder GREEN LIGHT) — TOP PRIORITY, do after the in-flight box-redeploy

Founder verbatim: "Green light send instructions for forge to do the things that stalled." Two things stalled. Do them. Doctrine v11: never fabricate a 200/joule/digest/signature; joules MEASURED only via real per-node reading; honest BLOCKED beats fake green; never write/print a credential; never touch lutar-lean.

================================================================
STALL 1 — CHASKI IS REACHABLE BUT NOT AN ENERGY LUNG (fully yours, no key — DO IT NOW)
================================================================
LIVE TRUTH: /api/a11oy/v1/energy/operator/status shows nodes_computing=['rtx-betterwithage'], nodes_degraded=['chaski']. /compute-pool shows chaski reachable=true @100.102.173.88:11434 (8 models). So chaski is on the fabric but the ENERGY operator is NOT dispatching jobs to it. That is the stall. There is NO key/secret in this task — execute fully, do not skip, do not return RECOMMENDED.

DO (box-side, reversible, persisted so it survives restart):
1. Resolve chaski's live tailnet IP dynamically (tailscale status; fallback 100.102.173.88). Confirm GET http://<ip>:11434/api/tags == 200 + model list.
2. Set + persist on the box: A11OY_ENERGY_CHASKI_ENABLED=1 ; A11OY_ENERGY_CHASKI_URL=http://<ip>:11434 ; pick a small model present on chaski (e.g. llama3.1:8b). 
3. Make the energy operator dispatch a SHARE of MEASURED inference jobs to chaski as a 2nd lung. Receipts node=chaski into the SAME ledger (prev_digest chain unbroken). Honest joules: label MEASURED only if a real per-job energy reading exists for chaski; else joules_label=MODELED-PER-TOKEN with joules_source=modeled-from-fabric-coefficient. NEVER fake MEASURED.
4. Health-gate: dispatch to chaski only when /api/tags is 200; if it drops, chaski → clean `offline` in operator/status (NOT degraded-alarm), rtx keeps breathing.
5. Durability so it stops dying after ~22h: per replit-sync/energy_engine/R_CHASKI_BOOT_AND_KEEP_ALIVE_20260615.md — install a systemd unit or supervisor restart-loop on the chaski Repl over tailnet. If neither survives a Replit recycle, that single Always-On toggle is founder-only: report the exact click-path (Replit → replit-chaski → Tools/Settings → Always On). Everything else: you do it.

PROVE in your report: operator/status with chaski MOVED from nodes_degraded INTO nodes_computing + its jobs_done climbing; a ledger receipt with node=chaski + its honest joules_label; which durability method you installed + a kill-and-recover proof.

================================================================
STALL 2 — UDS RECUT + PROVE-INSTALL + PUBLISH UNSIGNED (founder-key stays founder-held — that is CORRECT)
================================================================
RECOMMENDATION ACCEPTED BY FOUNDER: the cosign PRIVATE KEY stays founder-held even under green light (doctrine safety rail — an autonomous agent must never sign in the founder's name). So you do EVERYTHING EXCEPT the final sign, and hand back ONE exact command. This is NOT a skip — it is the full pipeline minus one founder keystroke. Do not auto-skip the whole task; split it.

DO NOW (no key needed for any of this):
1. Recut from CURRENT main, TIER 1 FIRST (blocks demo): szl-uds-deployment/bundles/szl-warhacker. Un-stage a11oy + killinchu (currently commented-out `# - name: a11oy-uds / killinchu-uds … signed module package not published yet`) into REAL members. Build the local members (`zarf package create --flavor upstream` for a11oy; the other organs without that flavor, per the publish workflow's flavor-gating). Fresh package digests + fresh bundle OCI ref. Run scripts/uds-bundle-publish-guard-checks.sh (OCI-ref + digest guards).
2. prove-bundle-install into a throwaway k3d cluster → confirm in-cluster health endpoints 200. Capture the REAL digests + install proof.
3. Publish the UNSIGNED bundle to ghcr (push is not a secret-signing op). 
4. Hand back the EXACT one founder command to sign, with the real fresh tag/digest filled in, e.g.:
     cosign sign --key $COSIGN_KEY oci://ghcr.io/szl-holdings/szl-uds-bundle:szl-warhacker-<freshtag>@sha256:<digest>
   Do NOT run it. Do NOT fabricate a verify line.
5. TIER 2 (only after Tier 1 done): same treatment for szl-full-stack, szl-uds-bundle, a11oy, killinchu, energy, prove-organs — recut, prove-install, publish unsigned, list the per-bundle founder sign command. Tier 2 NEVER delays Tier 1.
6. Update UDS_DEPLOY_RUNBOOK.md `uds deploy` one-liner with the fresh OCI ref + digest (mark signed-state pending-founder-sign honestly).

PROVE: per-bundle table — bundle | recut(y/n) | fresh OCI ref+digest | prove-install health 200 | published-unsigned(y/n) | the exact founder sign command. Honest BLOCKED only if a build genuinely fails — say which step + first error line.

================================================================
REPORT
================================================================
Append a dated section to replit-sync/forge-perplexity-update-20260615.md + write results to AUTO_STATE.json under `chaski` (lung state) and `uds` (per-bundle table) keys. Per-bundle/per-node truth only. Honest doctrine v11. If the box-redeploy in front of this is still settling, do that first, then these.
