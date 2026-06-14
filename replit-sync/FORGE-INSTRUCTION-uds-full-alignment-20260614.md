# FORGE ORDER — FULL UDS ALIGNMENT + DEPLOYABILITY for WarHacker (GitHub↔HF↔box↔bundles all byte-identical)

Issued: 2026-06-14 by CTO. Doctrine v11. PROVE-OR-DOWNGRADE. Report to AUTO_STATE.json. Demo: Defense Unicorns WarHacker June 16-19.

## GOAL (founder mandate)
Everything aligned and fully deployable in a UDS environment: **GitHub ↔ Hugging Face ↔ a11oy.net ↔ killinchu** all byte-identical, AND the estate packaged as proper **UDS bundles** (Zarf packages + UDS Package CRs + Pepr operator + UDS fleet + mesh) that `uds deploy` clean. Today we merged a lot to a11oy main (energy operator + signed-receipt ledger mint + holographic showcase + szl3d toolkit + PNT pillars + the two showcase pages) — the published UDS bundles are now STALE and must be recut.

## CONTEXT — existing UDS assets (do NOT rebuild from scratch; recut + align)
- a11oy: `deploy/zarf.yaml`, `deploy/uds-package.yaml`, `artifacts/a11oy-uds/{zarf.yaml,uds-bundle.yaml,scripts/build.sh}`, workflows `zarf-build-and-sign.yml`, `uds-sign-release.yml`, `bundle-ref-check.yml`. Doc `docs/WARHACKER_UDS_PROOF_POINT.md`.
- killinchu: `deploy/zarf.yaml`, `deploy/uds-package.yaml`, `.github/workflows/build-uds-image.yml`, `static/uds.html`, `static/cookbook/uds/bundle_meta.json`.
- szl-uds-deployment: `bundles/{a11oy,killinchu,prove-organs,szl-full-stack,szl-uds-bundle,szl-warhacker}/uds-bundle.yaml`, `packages/{sentra,amaru,a11oy,...}`, Pepr `capabilities/szl-governance/pepr.ts` + kustomize `pepr-key-mount`/`pepr-throttle-tuning`, `UDS_DEPLOY_RUNBOOK.md`, `UDS_ENVIRONMENT.md`, `MESH_READY.md`, publish workflows (`uds-bundle-publish.yml`, `zarf-package-sign.yml`, `prove-bundle-install.yml`).
- uds-mesh: `pepr/governance-receipts-pqc.ts`, mesh span schemas, full CI.
- KNOWN STALE: `a11oy-bundle:0.5.0` on GHCR (sha256:d801f8e4…) built against an OLDER a11oy organ image — predates today's merges. Must recut.

## TASKS

### 1) ALIGNMENT — GitHub ↔ HF ↔ box ↔ bundles byte-identical
- Run the lockstep guard (COPY ↔ serve.py ↔ hf-sync mirror) on a11oy main; fix any drift so GitHub == HF Space == box. The hf-sync mirror workflow must carry the NEW files merged today: `static/shared/szl_holo3d.js`, `static/3d/**` (szl3d toolkit + energy_showcase), `pages/energy-ops.html`, `web/energy-holographic.html`, `web/signature-is-not-proof.html`, `web/defense-readiness.html`, `szl_energy_{operator,ledger,projection}.py`, `joule_billing.py`. (PR #406 forge/hf-sync-web-html-mirror is already open for the web/*.html mirror — verify it covers ALL of the above, merge it.)
- Same for killinchu: GitHub ↔ HF killinchu Space ↔ killinchu.a11oy.net byte-identical.
- PROVE: for each shared module, the GitHub blob sha, the HF file, and the box-served file match. Paste the lockstep-guard PASS line.

### 2) RECUT the stale Zarf packages + UDS bundles from CURRENT main
- Rebuild the a11oy Zarf package (`packages/a11oy` / `zarf-mesh-ready.yaml`) and the killinchu Zarf package from current main (so the energy operator + signed-receipt ledger + holographic surfaces are IN the image).
- Recut every affected `bundles/*/uds-bundle.yaml` (esp. `a11oy`, `killinchu`, `szl-full-stack`, `szl-warhacker`) to reference the freshly-built package digests — no stale sha256 refs. Run `bundle-ref-check.yml` / `bundle-digest-recut` so no bundle points at a stale digest.
- Sign packages + bundles (`zarf-package-sign.yml`, `uds-sign-release.yml`) — keep the signing honest (real cosign key; never commit the key).

### 3) PEPR + FLEET + MESH wired
- Confirm the Pepr governance operator (`szl-governance/pepr.ts`, `governance-receipts-pqc.ts`) is included in the bundle and admits/enforces the deny-by-default gate + emits governance receipts in-cluster.
- Confirm UDS fleet (`install-repo-sync-fleet.sh`, restore-fleet) + uds-mesh span schemas are referenced and current.
- The `szl-warhacker` bundle is the demo bundle — make it the single `uds deploy`-able artifact composing a11oy + killinchu + sentra + amaru + Pepr governance, mesh-ready.

### 4) PROVE DEPLOYABILITY (the WarHacker win condition)
- Run `prove-bundle-install.yml` (or `uds deploy` the szl-warhacker bundle into a UDS/k3d test env) and PROVE it installs clean. Paste: the bundle OCI ref + fresh digest, the deploy result, and a post-deploy probe showing the in-cluster a11oy + killinchu come up (health endpoints 200, a signed receipt mints in-cluster).
- Update `docs/WARHACKER_UDS_PROOF_POINT.md` + `UDS_DEPLOY_RUNBOOK.md` with the FINAL `uds deploy oci://ghcr.io/szl-holdings/szl-warhacker-bundle:<ver> --confirm` one-liner the founder will run on stage.

## REPORT (AUTO_STATE.json + a report file)
- Lockstep PASS for a11oy + killinchu (GitHub↔HF↔box).
- Fresh bundle OCI refs + digests for a11oy, killinchu, szl-warhacker (no stale d801f8e4).
- `prove-bundle-install` result + in-cluster health/receipt proof.
- The exact `uds deploy` one-liner for the demo.
- Anything BLOCKED (e.g. needs a GHCR token, a cluster) — report honestly, do NOT fake a green.

## DO-NOT
- 0 runtime CDN; system fonts; no fabricated digests/200s/receipts; revenue stays DRY-RUN/MODELED (no Stripe key); joules MEASURED only; sovereign:true only on live GPU probe; Λ=Conjecture 1; never commit a key; never weaken a gate; never touch lutar-lean. If a bundle can't be honestly proven to install, say so — an honest BLOCKED beats a fake deploy at the demo.
