# SZL Forge — DEMO-FINAL PAYLOAD v2 (2026-06-14 20:10 EDT, CTO)

Doctrine v11. PROVE-OR-DOWNGRADE. Demo: Defense Unicorns WarHacker, San Diego, **founder demos June 18 2026**.
Four surgical, reversible, demo-critical jobs in priority order. Honest BLOCKED beats a fake green.
Report each to `AUTO_STATE.json` + notify with the pasted real values when it lands (or is honestly BLOCKED).

## CREDIT WHERE DUE — verified live 2026-06-14 ~20:00 EDT (do NOT revert)
- Energy operator: `stub_mode:false`, `joules_measured_label:MEASURED`, **jobs ~4,361, joules_measured_total ~83,582 J and CLIMBING** (was 22,899 stuck), tokens ~1.46M, exporter `betterwithage`, real power_w. SOUND.
- `nodes_computing` is now **just `rtx-betterwithage`** — `local-stub` already dropped from the live compute set. GOOD (JOB 4 stub-half already done).
- Ledger minting hash-chained JouleCharge receipts with real `nvml_age_s`.
- CTO landed 8+/10 of the 3D "genius surface" PRs (#381–#388) into a11oy main (0-CDN, MEASURED/MODELED labeled, lockstep-clean). **These need the box redeploy (the order already pinned above this one) to go live on a-11-oy.com.** Run that redeploy; it now also carries the full 3D surface set + szl_holo3d.js toolkit.

---

## JOB 1 (highest) — Flip `/energy/jtoken` ROADMAP → MEASURED

`GET /api/a11oy/v1/energy/jtoken` is still `label:"ROADMAP"` (`joules_per_token:null`, all inputs null). The operator already tracks `joules_measured_total` (~83,582), `tokens_total` (~1.46M), and `power_w_sample`. ONLY the Prometheus `/metrics` exposure + `A11OY_VLLM_METRICS_URL` wiring is missing.

DO (safe, reversible):
1. Read box runtime (systemd unit vs docker compose for a11oy on Hetzner 167.233.50.75); find the right place to set `A11OY_VLLM_METRICS_URL` without clobbering live hand-edits. Record prior value for one-line rollback.
2. Expose a Prometheus `/metrics` endpoint from the SAME exporter feeding the operator (`betterwithage`, Blackwell RTX 5050, Tailscale 100.125.77.31) emitting: `gpu_energy_joules_total` (real NVML integral, ~83,582 climbing), `gpu_power_watts` (live sample), `vllm:generation_tokens_total` (or operator `tokens_total` ~1.46M — join it in).
3. Set `A11OY_VLLM_METRICS_URL` to that endpoint, reversibly. Confirm the jtoken consumer scrapes + stamps freshness.

PROVE: `curl https://a-11-oy.com/api/a11oy/v1/energy/jtoken` shows `label:"MEASURED"`, numeric `joules_per_token` (~0.057 given 83,582 J / 1.46M tok), non-null inputs, and `/api/a11oy/v1/energy/sovereign` `measured_panels` climbing toward 6/6. Two readings a minute apart, both totals increasing.

HONESTY: if the exporter genuinely can't emit `/metrics` over tailnet → BLOCKED with exact error, leave panel honestly ROADMAP. Do NOT fabricate a J/token number. Operator joules stay MEASURED regardless.

---

## JOB 2 — UDS bundle recut (a11oy/killinchu currently STAGED)

`bundles/szl-warhacker/uds-bundle.yaml` is still **v0.4.0**: zarf init v0.77.0 + UDS Core 1.5.0 + szl-receipts proven; a11oy/killinchu STAGED (SBOM-only). Today's merges (energy operator + signed ledger + holographic + showcase + PNT + the 3D surfaces) are NOT in any bundle image; published `a11oy-bundle:0.5.0` (sha d801f8e4) is STALE.

DO (in `szl-holdings/szl-uds-deployment`, the canonical external repo — NOT the monorepo deploy tree):
1. Rebuild a11oy + killinchu Zarf packages from CURRENT main (energy operator, signed ledger, /energy-ops, /signature-is-not-proof, /defense-readiness, holographic + 3D surfaces in the images).
2. Bump bundle to v0.5.0+, un-stage a11oy + killinchu, compose into `bundles/szl-warhacker/uds-bundle.yaml` with FRESH digests (no stale refs); keep UDS Core + szl-receipts + szl-governance Pepr capability.
3. Sign packages + bundle (cosign). Run `bundle-ref-check` / OCI-ref guard / digest-recut guards.
4. `prove-bundle-install` (or `uds deploy` into k3d) and PROVE it installs clean.

PROVE: fresh bundle OCI ref + digest; `prove-bundle-install` result; in-cluster probe (a11oy+killinchu health 200 in-cluster, a signed JouleCharge receipt minting in-cluster, Pepr admission active). Update `UDS_DEPLOY_RUNBOOK.md` + `docs/WARHACKER_UDS_PROOF_POINT.md` with the FINAL one-liner:
`uds deploy oci://ghcr.io/szl-holdings/szl-warhacker-bundle:<ver> --confirm`

HONESTY: if a package can't be composed/proven by demo time, leave it STAGED and SAY SO in the runbook — demo what IS proven (UDS Core + szl-receipts + governance Pepr + signed receipts) + the architecture. Never claim an unproven deploy.

---

## JOB 3 — Box redeploy carries the 3D surfaces (depends on the redeploy order pinned above)

The box-redeploy-to-current-main order already pinned above this one MUST run — it now also brings the full 3D surface set live. After redeploy, PROVE the per-tab 3D panels render on the live box (not the 272KB SPA shell):
- `/holographic`, `/estate-hologram`, `/energy-holographic` = 200 (already 200; keep)
- `/static/shared/szl_holo3d.js` = 200
- spot-check the new per-tab surfaces (`/pinn`, `/pnt`, `/energy-ops`, `/governance`, killinchu `/elite`) render their 3D panel bound to REAL data (energy=MEASURED, pnt=MODELED, pinn=MEASURED cert, counter-UAS=killinchu signal, governance=SBOM). Never a faked feed.
- `/api/a11oy/v1/honest` exposes a real `git_sha == GitHub HEAD` (per the redeploy order).

---

## JOB 4 (cleanup) — chaski: honest "standby", not "DEGRADED"

`local-stub` is already gone from `nodes_computing` (good). The remaining blemish: `chaski` reads `DEGRADED` because it's unreachable (founder must start the replit-chaski Repl — known founder-only action, do NOT escalate). For the demo, a node that is **configured but intentionally not started** should read `standby`, not the alarming `DEGRADED` (which should mean "supposed to be up but failed").

**STATUS: CODE ALREADY LANDED by CTO** — PR #417 merged to a11oy main as `e67b073` (hotfix/chaski-standby-label, single signed `[demo-hotfix]` commit through the demo-freeze escape hatch, closes #416). 10/10 operator tests green. Forge: you do NOT need to write this code — it is in main. Just ensure the box redeploy picks it up, then set `A11OY_CHASKI_STANDBY=1` (default) so chaski reads `standby` until the founder starts the replit-chaski Repl (then `=0`).

Reference (already implemented):
1. Add an env-gated standby concept: a node flagged standby (e.g. `A11OY_CHASKI_STANDBY=1`, default on until the Repl is up) that is unreachable reports `standby` instead of `DEGRADED`. If a standby node DOES respond, it computes normally (never suppress real compute).
2. `status()` should surface `nodes_standby` separately from `nodes_degraded`. Keep the strict rule: a node that fails MID-JOB is still `DEGRADED` (real failure), never downgraded to standby.

PROVE: `/api/a11oy/v1/energy/operator/status` shows `chaski` in a clean `standby` state (or `computing` if the founder started it), NOT `DEGRADED`; `joules_measured_total` still climbing on `rtx-betterwithage`.

HONESTY: do NOT fake chaski as computing. "Offline standby — fails over to the Hetzner mesh" is the honest, good demo line.

---

## GLOBAL CONSTRAINTS (all jobs)
0 runtime CDN. Never fabricate a joule/token/digest/200/receipt/deploy-result/TRL. Revenue DRY-RUN/MODELED (no Stripe key). Joules MEASURED only via real NVML. `sovereign:true` only on a live GPU probe. Λ = Conjecture 1 (advisory, never "proven trust"). Khipu BFT = Conjecture 2. Never commit a key (TS/HF/cosign/coordinator tokens → secret store only). Never touch `lutar-lean`. Keep GitHub ↔ HF ↔ box byte-identical (run lockstep guard after JOB 2 + JOB 3). Every change reversible. locked=8 @ c7c0ba17. Report to `AUTO_STATE.json` + notify with pasted real values per job.

PRIORITY if time-constrained before June 18: the box redeploy (pinned above) + JOB 1 (jtoken) + JOB 2 (UDS bundle) most change what the founder can SAY/SHOW on stage — do those first. JOB 4 is polish (CTO may pre-land the code).
