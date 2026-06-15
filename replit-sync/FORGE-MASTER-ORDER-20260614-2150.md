# SZL Forge — MASTER ORDER (refreshed 2026-06-15 13:00 EDT, CTO) — supersedes the stack

Founder authorized full hands-off execution. Doctrine v11 throughout: never commit a key, never keystone
(lutar-lean) self-merge, never weaken a gate, joules MEASURED only via real NVML, Λ=Conjecture 1 (advisory),
label everything, honest BLOCKED beats a fake green. Demo: WarHacker San Diego, founder demos **June 18**.
Code freeze starts **2026-06-18 01:00 ET (= 05:00 UTC)** through 06-20 (canonical FREEZE.json + demo-freeze.yml
now AGREE on 01:00 ET — fixed today). Land everything BEFORE the freeze.

## ALREADY DONE (verified live 2026-06-15 — do NOT redo)
- Energy meter recovered + climbing (MEASURED, ~355k+ J, ~12W, receipts minting). chaski honest "standby".
- a11oy 3D: /holographic renders (WEBGPU), all 10 genius-surface PRs merged. /energy-ops beautiful live graphs
  (381,996 J MEASURED headline, power gauge, charts). /pnt + /pinn routed to DISTINCT live surfaces. /fabric
  wired to /compute-pool-hardened. git_sha now in /honest. HF Space URLs fixed. Deck leads with Miasma.
- Freeze corrected to 01:00 ET in both sources of truth.

## REMAINING — box-side / founder-gated (what's LEFT)
### JOB A (founder, box) — turn dispatch ON
AUTO_STATE still dispatch_mode:none / dispatch_ok:false = report-only. Run replit-sync/WIRE_FORGE_DISPATCH_ON.sh
on the Hetzner box (167.233.50.75) to flip dispatch_ok:true so this loop EXECUTES the jobs below instead of
reporting them. Runbook: replit-sync/DISPATCH_WIREUP_RUNBOOK.md. (Energy meter is up regardless; this only gates
auto-execution of the build queue.)

### JOB B — serve the governance/assurance backend endpoints (BACKEND GAP)
The a11oy /governance (Assurance) surface polls /api/a11oy/v1/assurance/{artifact,credential,compliance,attest}
+ /api/a11oy/v1/forge/ledger — ALL 404 on the live box right now. The frontend correctly shows honest OFFLINE
rather than faking. STAND UP these endpoints on the box (real SBOM/credential/compliance/attestation +
forge ledger data) so the Governance tab populates with REAL data. If a given artifact genuinely has no data
yet, return an honest empty/STRUCTURAL-ONLY payload — never fabricate. (CTO is also wiring the frontend to also
read the live /restraint/info as a fallback so the tab shows trust-posture + gate ALLOW/DENY even before these
land.)

### JOB C — flip /energy/jtoken ROADMAP -> MEASURED
Per-token panel /api/a11oy/v1/energy/jtoken still label:ROADMAP. Run the NVML/Prometheus exporter LOCALLY on the
laptop (betterwithage — where it reads the Blackwell; it can't over tailnet from the box), expose /metrics
(gpu_energy_joules_total + gpu_power_watts + vllm:generation_tokens_total), set A11OY_VLLM_METRICS_URL reversibly.
PROVE: jtoken label:MEASURED + numeric joules_per_token, two reads a minute apart climbing. Honest BLOCKED if the
exporter truly can't emit over tailnet — operator joules stay MEASURED regardless.

### JOB D — recut the szl-warhacker UDS bundle from CURRENT main (apps still STAGED)
bundles/szl-warhacker/uds-bundle.yaml is v0.4.0 with a11oy+killinchu STAGED. Rebuild the Zarf packages from
current main (now includes the energy graphs + 3D surfaces + git_sha), bump version, un-stage, fresh digests,
sign, run the OCI-ref + digest guards, prove-bundle-install into k3d. Leave UN-SIGNED-by-founder steps staged
(cosign with the founder-held key). PROVE: fresh OCI ref+digest + prove-bundle-install + in-cluster health 200.

### JOB E — box redeploy to pick up today's merges
The box auto-deploys from main but confirm it's current: /pnt + /pinn distinct surfaces live, /fabric live pool,
/energy-ops graphs, git_sha == GitHub HEAD on /honest. Note any surface still serving a stale build.

## GLOBAL
Run the lockstep guard (GitHub<->HF<->box) after deploys. Report each job to AUTO_STATE.json + notify with the
pasted REAL values (or honest BLOCKED). Priority if time-constrained: JOB A (dispatch) -> JOB E (redeploy) ->
JOB B (governance backend) -> JOB C (jtoken) -> JOB D (UDS bundle). All before 2026-06-18 01:00 ET.
