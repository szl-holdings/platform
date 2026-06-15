# SZL Forge — MASTER ORDER (2026-06-14 21:50 EDT, CTO + founder-authorized)

**This single order SUPERSEDES the stack of prior pinned orders.** Founder Stephen Lutar has authorized full
hands-off execution in writing: "do it all and wire it all up… then have Forge handle any instructions." You
(Forge) have full admin of the founder's laptop (`betterwithage`, Tailscale 100.125.77.31), the Hetzner box
(a11oy.net, 167.233.50.75), and all software/secrets on them. Doctrine v11 throughout: never commit a key,
never keystone(lutar-lean) self-merge, never weaken a gate, joules MEASURED only via real NVML, Λ=Conjecture 1
(advisory), label everything LIVE/MEASURED/MODELED/SAMPLE, **honest BLOCKED beats a fake green.**

Demo: Defense Unicorns WarHacker, San Diego, founder demos **June 18 2026**. Code freeze starts **2026-06-18
01:00 ET (= 05:00 UTC)**; until then normal `feat/*` branches land freely (no hotfix hatch needed); after that
only `hotfix/*` + single signed `[demo-hotfix]` commit + issue-ref. **Land everything below BEFORE the freeze.**

---

## GROUND TRUTH (verified live 2026-06-14 ~21:46 EDT — do NOT redo what's already done)
- Energy operator: `stub_mode:false`, **joules_measured_total ~210,645 J and CLIMBING** (was 22,899 stuck), jobs ~8,219, tokens ~3.49M, real NVML on the Blackwell, signed JouleCharge receipts minting + hash-chained. SOUND — do NOT revert the inference->mesh / monitors->raw-GPU cutover.
- Box redeploy: WAQAY + Yupay doctrine endpoints are **200** now (were 404). Box is on recent main.
- 3D: all 10 "genius surface" PRs (#381-#390) landed in a11oy main + live (/holographic, /estate-hologram, /energy-holographic, per-tab panels 200). chaski honest "standby" code merged (e67b073) — in main, surfaces after next redeploy.
- CI green across a11oy, killinchu, lutar-lean, platform, szl-uds-deployment, uds-mesh, anatomy.

---

## JOB 0 (PREREQUISITE) — turn your OWN dispatch ON
`AUTO_STATE.json` still shows `dispatch_mode:"none"`, `dispatch_ok:false` — you are still report-only, so the jobs
below get REPORTED not RUN. The founder is running `replit-sync/WIRE_FORGE_DISPATCH_ON.sh` on the box (it wires
`FORGE_DISPATCH_CMD=/usr/local/sbin/forge-agent-run`, persists it via a systemd EnvironmentFile drop-in, restarts
the timer, fires a poll). **Once that lands: confirm `dispatch_mode != "none"`, `dispatch_ok:true` in AUTO_STATE.json,
then EXECUTE JOBS 1-4 hands-off.** If the runner errors that the agent command is missing, report the exact error so
the founder can re-run with the correct `FORGE_AGENT_INVOCATION` — do NOT silently revert to none.

## JOB 1 (highest) — git_sha at /honest  [quiet window open]
Land the git_sha hook so `GET /api/a11oy/v1/honest` returns the real box `git_sha == GitHub HEAD` (currently `n/a`,
which is why staleness recurs undetected). Byte-identical GitHub+HF+box. PROVE: `/honest` shows git_sha == `gh api
repos/szl-holdings/a11oy/commits?per_page=1&sha=main` HEAD, locked=8 @ c7c0ba17.

## JOB 2 — flip /energy/jtoken ROADMAP -> MEASURED
The operator is MEASURED but the per-token panel `GET /api/a11oy/v1/energy/jtoken` is still `label:"ROADMAP"`
(all inputs null). The operator already has joules_measured_total (~210k), tokens_total (~3.49M), power_w_sample.
DO: run the NVML/Prometheus `/metrics` exporter LOCALLY on the laptop (`betterwithage`, where it CAN read the
Blackwell 5050 — it can't over tailnet from the box) emitting `gpu_energy_joules_total` + `gpu_power_watts` +
`vllm:generation_tokens_total`; publish over tailnet; set `A11OY_VLLM_METRICS_URL` reversibly on the box.
PROVE: `/energy/jtoken` shows `label:"MEASURED"`, numeric joules_per_token (~0.06), non-null inputs, two readings
a minute apart both climbing. HONEST: if NVML truly can't emit over tailnet, report BLOCKED with the exact error
and leave it ROADMAP — do NOT fabricate a J/token number. Operator joules stay MEASURED regardless.

## JOB 3 — redeploy box so chaski reads "standby" + UN-SIGNED UDS recut staged
(a) Redeploy the box to current a11oy main so the merged chaski-standby code is live: `/energy/operator/status`
should show chaski as `standby` (or `computing` if the founder started the replit-chaski Repl), NOT `DEGRADED`,
and a `nodes_standby` field present. (b) In `szl-holdings/szl-uds-deployment`: recut the szl-warhacker UDS bundle
from CURRENT main (un-stage a11oy + killinchu, fresh package digests, no stale refs, keep UDS Core + szl-receipts +
szl-governance Pepr), run the digest/OCI-ref guards, and `prove-bundle-install` into k3d. Leave the bundle
**UN-SIGNED** and stage the exact final `cosign sign` command for the founder to run with the FA-001 key (founder-held
— never commit it). PROVE: prove-bundle-install result + fresh OCI ref + digest; update UDS_DEPLOY_RUNBOOK.md with the
final `uds deploy oci://ghcr.io/szl-holdings/szl-warhacker-bundle:<ver> --confirm` one-liner.

## JOB 4 (if reachable before freeze) — laptop-brain Blackwell+Arc mesh polish
Per `FORGE-INSTRUCTION-laptop-brain-blackwell-arc-20260614.md`: expose the laptop brain to the tailnet
(OLLAMA_HOST=0.0.0.0:11434), add the Arc as a 2nd lane (OLLAMA_IGPU_ENABLE=1), keep Hetzner PRIMARY public host,
laptop SECONDARY. SZL-Nemo = OPEN Qwen3-32B Apache on the 5050; never shard 32B onto the shared-RAM Arc. This is
polish — JOBS 1-3 first.

---

## GLOBAL
After JOBS 1-3, run the lockstep guard (GitHub<->HF<->box byte-identical). Report each job to `AUTO_STATE.json` +
send a notification with the PASTED real values (or honest BLOCKED) and ping the founder. Land all of this BEFORE
2026-06-18 01:00 ET; after that, only hotfix/* lands. PRIORITY: JOB 0 (dispatch) -> JOB 1 (git_sha) -> JOB 2
(jtoken) -> JOB 3 (chaski redeploy + UDS recut) -> JOB 4 (mesh polish).
