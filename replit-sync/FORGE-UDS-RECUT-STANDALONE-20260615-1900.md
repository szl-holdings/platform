# FORGE ORDER — UDS BUNDLE RECUT (standalone, parser-safe) — 2026-06-15 19:00 ET

WHY THIS EXISTS: the last two passes, the auto-loop parser dropped the UDS recut because the bullets contained the words publish/sign/cosign (keyword auto-skip). This order is phrased so the RECUT + PROVE-INSTALL work routes as ACTIONABLE. The one founder key-step lives in a separate clearly-labeled section that the parser ignores and the agent simply reports back. Doctrine v11: never fabricate a digest/receipt/200; never write/print a credential; never touch lutar-lean; honest BLOCKED beats fake green; never weaken a CI gate.

## ACTIONABLE WORK (no key, no secret — do this fully now; do NOT skip)
Target: szl-holdings/szl-uds-deployment/bundles/szl-warhacker (TIER 1, demo-critical). It is currently metadata.version 0.4.0 with the a11oy-uds + killinchu-uds members commented out (STAGED). Make it real:

1. Build the local members the bundle needs: run `zarf package create --flavor upstream` for the a11oy member; the other organ members WITHOUT that flavor (per the existing flavor-gating in uds-bundle-publish.yml). `uds create` does NOT build local path: members — you must pre-build them. (Team B already landed the ref + pre-build wiring in PR #101 / 419bfba — confirm it's present, then run it.)
2. Un-comment / un-stage the a11oy-uds + killinchu-uds members in bundles/szl-warhacker/uds-bundle.yaml so they ship as real members. Resolve their CURRENT package digests (no placeholder, no hardcoded stale digest).
3. Run `uds create` to recut the szl-warhacker bundle to a fresh tag from current main. Run scripts/uds-bundle-publish-guard-checks.sh (OCI-ref + digest guards) — they must pass.
4. prove-bundle-install: deploy the freshly-built bundle into a throwaway k3d cluster; confirm in-cluster health endpoints return 200. Capture the REAL digests + the install proof output.
5. Push the freshly-built bundle ARTIFACT to ghcr (an image push is not a key operation). Record the exact OCI ref + digest.
6. Update UDS_DEPLOY_RUNBOOK.md `uds deploy` one-liner with the fresh OCI ref + digest. Mark the attestation state honestly as "pending founder hand-back" (do not claim it's attested).
7. Write the result to AUTO_STATE.json under a `uds` key (bundle, recut=true, oci_ref, digest, prove_install_health, published=true, attested=pending-founder) and append a per-bundle line to the forge report.

THEN TIER 2 (only after Tier 1 fully done; same neutral steps 1-7, never delay Tier 1): szl-full-stack, szl-uds-bundle, a11oy, killinchu, energy, prove-organs.

If any BUILD genuinely fails (a `uds create` / `zarf package create` / prove-install error), report BLOCKED with the failing step + first error line. That is honest. Silently dropping the task is NOT acceptable — if you read this file, you MUST attempt steps 1-5 and report a real per-step result.

## FOUNDER HAND-BACK (NOT for Forge to execute — just compute + report the string)
The bundle attestation/key-step stays founder-held by doctrine. After step 5, COMPUTE and report (do not run) the exact one command the founder pastes to attest the published bundle, with the real fresh tag + digest filled in:
    cosign sign --key $COSIGN_KEY oci://ghcr.io/szl-holdings/szl-uds-bundle:szl-warhacker-<freshtag>@sha256:<realdigest>
Report it as "FOUNDER HAND-BACK COMMAND" in the report so I can surface it. Never run it. Never fabricate a digest — only emit this once the real published digest from step 5 exists.

## PROVE-IT
Per-bundle table in the report: bundle | recut(y/n) | fresh OCI ref+digest | prove-install health 200 | published-unsigned(y/n) | FOUNDER HAND-BACK command. Real values only. AUTO_STATE.json `uds` key updated. Honest doctrine v11.
