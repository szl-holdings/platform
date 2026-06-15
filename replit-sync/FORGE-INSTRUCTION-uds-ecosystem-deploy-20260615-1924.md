<!--
Copyright 2026 SZL Holdings · SPDX-License-Identifier: Apache-2.0
-->
# FORGE-INSTRUCTION — UDS ECOSYSTEM DEPLOY (box-side bring-up + cosign handoff)
**2026-06-15 19:24 ET · founder: Stephen Lutar · demos June 18 · warhacker 50-pt CAPSTONE**

This is the box-side execution order for the SZL UDS ecosystem. The four UDS technical lanes are DONE
and validated (lint-green, digests pinned, Pepr enforcing, SLSA L2 gate green in CI, tamper-evident
demo green, /uds-portability live on both apps). Your job: stand the ecosystem UP on the air-gapped
tower and drive every NON-secret step to DONE-AND-VERIFIED. The `cosign sign` + energy image publish +
NVML are explicitly **FOUNDER-GATED** — do everything else, leave those staged with the exact commands.

Ground truth source-of-record (do NOT re-block what is already proven):
- `team/AUDIT/uds/RESULT_PAYLOADS.md` · `RESULT_MESH_PEPR.md` · `RESULT_SUPPLYCHAIN.md` ·
  `RESULT_SHOWCASE_FE.md` · `team/AUDIT/warroom/UDS_COSIGN_FOUNDER_HANDOFF.md`
- Judge-facing scoring map: `team/AUDIT/uds/WARHACKER_SCORING_NARRATIVE.md`

================================================================
DOCTRINE (hard — applies to every step below)
================================================================
- SLSA **L1 honest / L2 attested (organs) / L3 ROADMAP** ONLY. NEVER bare L3 / FedRAMP / IronBank /
  CMMC / ATO in any README, output, or claim.
- effectors **SIMULATED**, human-on-loop. trust **never 100%**. tamper-**EVIDENT**, not tamper-proof.
- Section 889 vendors = **exactly 5**. locked = **8 @ c7c0ba17**. Λ = **Conjecture 1**.
- **NO user-visible codenames** (sentra/amaru/rosie are mesh-internal schema ids only — never on a
  judge-facing surface). **NEVER commit a key.** **Never fake a signature or a joule.**
- Energy joules stay **SAMPLE** until a real on-box NVML reading exists. NEVER stamp MEASURED without
  a real per-job energy read. NEVER set `sovereign:true`.
- **Honest BLOCKED beats fake green. The half-state is the only unacceptable outcome.** You run
  `--no-secrets`: do all non-secret work; leave each key/cosign step explicitly BLOCKED-on-founder
  with the exact one command.
- **Re-resolve organ image digests immediately before any air-gap freeze** — the `uds-v0.3.0`/`uds-v0.2.0`
  organ tags are MUTABLE and CI may rebuild them (per RESULT_PAYLOADS §Moving-target note).

================================================================
PINS (verified current 2026-06-15 — re-resolve before freeze)
================================================================
- a11oy organ:      ghcr.io/szl-holdings/a11oy:uds-v0.3.0     @ sha256:088f8da12625eda3f43b459aa4da8d908a01137d9c3cdbf4b71a8e48bab2bf6e
- killinchu organ:  ghcr.io/szl-holdings/killinchu:uds-v0.2.0 @ sha256:946f1fc9675933a373364d372a03f4f8314ebee6a8adcd97926fa52b081af7cc
- szl-receipts:     ghcr.io/szl-holdings/szl-receipts:0.4.0-upstream @ sha256:3ec1e2bac45453e588252c5584106ec497c4e1e7bc8279229c993f57a7819829
- signed mesh bundle (FE shows this): oci://ghcr.io/szl-holdings/szl-mesh:v0.4.0 @ sha256:7f5fce3238ce3d255b322340bbe18cad1eb656e677065a2757637337300cac7f
- STALE published bundles needing founder republish+sign: a11oy-bundle:0.5.0 (sha256:d801f8e4…),
  killinchu-bundle:0.5.0 (sha256:e59921332c…)
- verify keys: org root szl-holdings/.github/cosign.pub (fp 76199818…); bundle-sign
  szl-uds-deployment:cosign/cosign.pub (fp e136ee4e…). Use whichever key you actually signed with.

================================================================
ORDER 1 — AIR-GAP TOWER BRING-UP (k3d / uds-core, no internet)
================================================================
Repo: szl-holdings/szl-uds-deployment + szl-fleet-overlay. Source: RESULT_MESH_PEPR.md §5.
AUTOMATABLE BY FORGE — do it now on the box.

PRE-FLIGHT (on a connected build box; air-gap = create here, carry tarballs in):
```bash
# Pepr admission controller image + manifests (REAL, builds today):
cd szl-uds-deployment/capabilities/szl-governance
npm ci && npx --yes pepr@1.2.1 build         # emits dist/pepr-module-szl-governance-001.yaml + image
uds zarf package create . --confirm          # -> zarf-package-szl-governance-amd64-0.5.0.tar.zst

# Fleet overlay + mesh bundles:
cd ../../../szl-fleet-overlay && uds create . --confirm
# (szl-mesh bundle published as oci://ghcr.io/szl-holdings/szl-mesh:uds-v0.4.0)
```

ON THE AIR-GAPPED TOWER (cable pulled):
```bash
# [0] UDS Core (UPSTREAM flavor 1.5.0 — NOT Iron Bank, honest)
uds deploy core-bundle-*.tar.zst --confirm          # or: uds deploy szl-fleet-overlay (phase 1 pulls core)

# [1] Fleet overlay (namespaces + Package CRs + Peat CRDT mesh, QUIC 4001 / gRPC 50051)
uds deploy uds-bundle-szl-fleet-overlay-*.tar.zst --confirm
kubectl get packages.uds.dev -A                     # expect szl-a11oy … szl-killinchu = Ready

# [2] Pepr governance policy (admission enforcement) + signing key (key NEVER in git)
bash scripts/generate-receipt-key.sh > /tmp/szl-receipts-ed25519.secret.yaml
kubectl apply -f /tmp/szl-receipts-ed25519.secret.yaml          # Secret in pepr-system
uds zarf package deploy zarf-package-szl-governance-amd64-0.5.0.tar.zst --confirm
kubectl -n pepr-system patch deployment pepr-szl \
  --type=strategic --patch-file \
  szl-uds-deployment/kustomize/overlays/pepr-key-mount/pepr-admission-key-mount.yaml
# (pepr-key-mount.timer re-applies this automatically after future redeploys — day-2 self-heal)

# [3] Organ payloads (a11oy + killinchu mesh; images pinned @sha256 — air-gap content-addressed)
uds deploy oci://ghcr.io/szl-holdings/szl-mesh:uds-v0.4.0 --confirm   # or the carried-in tarball
```

HONEST NOTES: `szl-pepr-governance:0.5.0` image is `required:false` + verify-before-deploy until CI
publishes it (RESULT_MESH_PEPR §BLOCKED-1). In-cluster crypto DSSE verify is ROADMAP P1 — today's gate
is presence+format. Use `Recreate` strategy on the single 2-vCPU node to avoid rollout deadlock.

================================================================
ORDER 2 — PAYLOAD BUNDLES: create / deploy a11oy.uds + killinchu.uds + energy.uds
================================================================
Repo: szl-holdings/szl-uds-deployment @ main (HEAD 62a53107). Source: RESULT_PAYLOADS.md §Payload 1–3.
AUTOMATABLE BY FORGE for a11oy + killinchu. energy is FOUNDER-GATED on image publish (Order 4).

a11oy.uds (governed-AI substrate) — VALIDATED, create/deploy-ready:
```bash
cd szl-uds-deployment
uds zarf package create packages/sentra
uds zarf package create packages/amaru
uds zarf package create packages/a11oy
uds create bundles/a11oy --confirm -a amd64
uds deploy bundles/a11oy --confirm
cd bundles/a11oy && ./prove-it.sh validate   # GREEN anywhere
./prove-it.sh deploy                          # on tower: build + k3d + deploy + /healthz + /honest
# NOTE: charts/a11oy path is the COHERENT canonical (mesh-ready has a11oy vs szl-a11oy namespace
# mismatch that can hang deploy waits — flag to founder, RESULT_PAYLOADS §Payload 1 coherence note).
```

killinchu.uds (counter-UAS/maritime C2, effectors SIMULATED) — VALIDATED, create/deploy-ready:
```bash
cd szl-uds-deployment
uds zarf package create packages/sentra && uds zarf package create packages/amaru
uds zarf package create packages/killinchu
uds create bundles/killinchu --confirm -a amd64
uds deploy bundles/killinchu --confirm
cd bundles/killinchu && ./prove-it.sh validate   # GREEN
./prove-it.sh deploy   # MUST assert effector=SIMULATED on /api/killinchu/v1/cuas/engage (safety gate)
```

energy.uds (measured sovereign-energy operator) — VALIDATED but FOUNDER-GATED (image unpublished):
```bash
cd szl-uds-deployment/bundles/energy
./prove-it.sh validate   # GREEN: schema + manifest consistency + image-gate check + endpoint honesty
./prove-it.sh deploy     # GATED: step [2] IMAGE GATE prints BLOCKED while image unpublished
# DO NOT pin a fabricated digest. DO NOT stamp joules MEASURED. joules_label=SAMPLE, sovereign=false.
```

================================================================
ORDER 3 — UDS WARHACKER UMBRELLA BUNDLE RECUT (non-secret work — do it now)
================================================================
Source: UDS_COSIGN_FOUNDER_HANDOFF.md + RESULT_SUPPLYCHAIN.md §6. AUTOMATABLE BY FORGE up to publish.

DO (non-secret):
1. Recut bundles/a11oy + bundles/killinchu + the szl-warhacker umbrella from CURRENT main of every
   member repo. Members use `path:` builds, so `uds create` already composes the FRESH organ images
   (088f8da1 / 946f1fc9) automatically — staleness lives ONLY in the published OCI artifacts.
2. Run the OCI-ref + digest guards (scripts/uds-bundle-publish-guard-checks.sh) — confirm no stale pin.
3. prove-bundle-install into a throwaway k3d: deploy the UNSIGNED bundle, confirm in-cluster health
   endpoints return 200. Capture real digests + install proof.
4. Update UDS_DEPLOY_RUNBOOK.md with the working `uds deploy` one-liner + fresh OCI ref + digest.
5. Write fresh digests + prove-install result into replit-sync/AUTO_STATE.json (uds section).

================================================================
ORDER 4 — FOUNDER-GATED (DO NOT auto-run; stage exact commands)
================================================================
These need the FA-001 cosign private key / image publish / NVML — founder only. Report each as
BLOCKED-on-founder with the exact one command. NEVER commit a key. NEVER fake a signature or joule.

A) cosign sign of the published OCI bundles (FA-001) — RESULT_SUPPLYCHAIN §6 / handoff:
```bash
export COSIGN_PASSWORD='<FA-001 passphrase>'   # env / KMS / hardware only — never committed
# a11oy bundle (composes fresh organ 088f8da1)
uds create bundles/a11oy --confirm
uds publish bundles/a11oy oci://ghcr.io/szl-holdings
cosign sign   --key fa-001.key       ghcr.io/szl-holdings/a11oy-bundle:0.5.0
cosign verify --key cosign/cosign.pub ghcr.io/szl-holdings/a11oy-bundle:0.5.0
# killinchu bundle (fresh organ 946f1fc9) — same four steps, killinchu-bundle:0.5.0
# warhacker umbrella (init + core + szl-receipts; app modules staged/commented)
uds create  bundles/szl-warhacker --confirm
uds publish bundles/szl-warhacker oci://ghcr.io/szl-holdings
cosign sign   --key fa-001.key       ghcr.io/szl-holdings/szl-warhacker-bundle:0.4.0
cosign verify --key cosign/cosign.pub ghcr.io/szl-holdings/szl-warhacker-bundle:0.4.0
uds deploy oci://ghcr.io/szl-holdings/szl-warhacker-bundle:0.4.0 --confirm
# After publish, turn prove-bundle-install GREEN:
gh workflow run prove-bundle-install.yml -R szl-holdings/szl-uds-deployment -f bundle_tag=0.4.0
```

B) energy image publish (gates energy.uds air-gap deploy) — RESULT_PAYLOADS §Payload 3:
```bash
docker build/push ghcr.io/szl-holdings/energy-harvest   # then cosign keyless-sign on push (SLSA L1)
# -> digest-pin in packages/energy-harvest/zarf.yaml + deployment.yaml (uncomment images: bake list)
# -> uds zarf package create packages/energy-harvest -> uds create bundles/energy -> uds deploy
```

C) on-box NVML MEASURED-joule exporter + signed JouleCharge receipt chain — ROADMAP. When the NVML
   meter lands, the ONLY change is SAMPLE→MEASURED in the payload; the signing/verify chain is
   unchanged. Until then: SAMPLE, sovereign=false, no fabricated joule.

D) a11oy /khipu/pubkey key mismatch — FOUNDER DECISION (flagged, NOT fixed): live app serves org-root
   key (76199818…) but MANIFEST declares per-organ a11oy.pub (f042ba5a…). Repoint a11oy OR update
   MANIFEST. Key changes are founder-gated.

================================================================
PROVE (paste REAL probe output in the report — no fabrication)
================================================================
- ORDER 1: `kubectl get packages.uds.dev -A` showing szl-a11oy … szl-killinchu = Ready; Pepr DENY of
  `kubectl -n szl-a11oy run rogue --image=nginx` ("Missing required annotation szl.io/receipt").
- ORDER 2: a11oy /healthz + /honest (locked=8 @ c7c0ba17, Λ=Conjecture 1); killinchu
  /api/killinchu/v1/cuas/engage → effector=SIMULATED; energy prove-it printing honest BLOCKED on image gate.
- ORDER 3: fresh OCI ref + digest, prove-install in-cluster 200, runbook one-liner, AUTO_STATE.json updated.
- ORDER 4: each item = BLOCKED-on-founder + the exact one command above. No signature attempted.
- TAMPER (offline, anytime): `node governance-receipts-pqc.js --self-test` →
  ✓ verify true … tamper flip → ✗ sig FAIL, ✗ every prev_hash link FAIL (tamper-EVIDENT).

================================================================
REPORT
================================================================
Append a dated section to replit-sync/forge-perplexity-update-20260615.md: per ORDER =
DONE / BLOCKED-on-founder (+ exact unblock command), with real probe output pasted. Update
AUTO_STATE.json. Honest doctrine v11. If the tower/k3d isn't up yet, ORDER 1/2 result = "staged +
validated, waiting-for-tower" (SUCCESS — the work is in place), NOT a failure. Stop asking the founder
for anything except the explicit Order-4 FA-001 / image-publish / NVML steps.
