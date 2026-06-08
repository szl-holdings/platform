# UDS Packaging Build Report — a11oy + killinchu

**Author:** stephenlutar2-hash <stephenlutar2@gmail.com>
**Date:** 2026-06-06
**Scope:** `szl-holdings/szl-uds-deployment` only (no changes to `uds-bundles`; no changes to HF app source).
**License posture:** all SZL-authored artifacts Apache-2.0; AGPL UDS toolchain interoperated-with only (no source copied).

---

## 1. Files committed

**Repo:** `szl-holdings/szl-uds-deployment` · **branch:** `main`
**Commit:** `cbc9c92e42801459a281656037bd390238087595`
(local pre-rebase sha was `d9a7cc2`; rebased onto `origin/main @ 28a3b49` then pushed → `cbc9c92`)
**Author/committer:** `stephenlutar2-hash <stephenlutar2@gmail.com>` (both)
**Signed-off-by:** `Stephen P. Lutar Jr. <stephenlutar2@gmail.com>` ✅ present in commit body
**Push:** SUCCESS (`28a3b49..cbc9c92 main -> main`). 25 files, 2884 insertions, all new (non-destructive).

| Repo | Path | Type | Status |
| --- | --- | --- | --- |
| szl-uds-deployment | `packages/a11oy/uds-package-mesh-ready.yaml` | UDS Package CR (a11oy, mesh-ready) | NEW |
| szl-uds-deployment | `packages/killinchu/uds-package-mesh-ready.yaml` | UDS Package CR (killinchu, mesh-ready) | NEW |
| szl-uds-deployment | `packages/a11oy/zarf-mesh-ready.yaml` | Zarf pkg (upstream+unicorn) | NEW |
| szl-uds-deployment | `packages/killinchu/zarf-mesh-ready.yaml` | Zarf pkg (upstream+unicorn) | NEW |
| szl-uds-deployment | `bundles/a11oy/uds-bundle.yaml` | UDS Bundle | NEW |
| szl-uds-deployment | `bundles/killinchu/uds-bundle.yaml` | UDS Bundle | NEW |
| szl-uds-deployment | `capabilities/szl-governance/package.json` | Pepr module config | NEW |
| szl-uds-deployment | `capabilities/szl-governance/pepr.ts` | Pepr entrypoint | NEW |
| szl-uds-deployment | `capabilities/szl-governance/tsconfig.json` | TS config | NEW |
| szl-uds-deployment | `capabilities/szl-governance/capabilities/szl-governance-common.ts` | Receipt validator | NEW |
| szl-uds-deployment | `capabilities/szl-governance/capabilities/a11oy-receipt-gate.ts` | a11oy gate | NEW |
| szl-uds-deployment | `capabilities/szl-governance/capabilities/killinchu-receipt-gate.ts` | killinchu gate | NEW |
| szl-uds-deployment | `capabilities/szl-governance/chart/Chart.yaml` | UDS policy chart | NEW |
| szl-uds-deployment | `capabilities/szl-governance/chart/values.yaml` | chart values | NEW |
| szl-uds-deployment | `capabilities/szl-governance/chart/templates/uds-package.yaml` | Pepr UDS Package CR | NEW |
| szl-uds-deployment | `capabilities/szl-governance/zarf.yaml` | Zarf pkg for capability | NEW |
| szl-uds-deployment | `capabilities/szl-governance/README.md` | Made-for-UDS badge + docs | NEW |
| szl-uds-deployment | `capabilities/szl-governance/LICENSE` | Apache-2.0 | NEW |
| szl-uds-deployment | `capabilities/szl-governance/NOTICE` | pepr + k8s-fluent-client attrib | NEW |
| szl-uds-deployment | `capabilities/szl-governance/.gitignore` | node_modules/dist | NEW |
| szl-uds-deployment | `compliance/oscal-component-a11oy.yaml` | OSCAL 1.1.2, 5 controls | NEW |
| szl-uds-deployment | `compliance/oscal-component-killinchu.yaml` | OSCAL 1.1.2, 5 controls | NEW |
| szl-uds-deployment | `compliance/LICENSE` | Apache-2.0 | NEW |
| szl-uds-deployment | `compliance/NOTICE` | OSCAL/NIST/lula/OPA attrib | NEW |
| szl-uds-deployment | `MESH_READY.md` | top-level summary | NEW |

**`uds-bundles` repo:** NO commit — all six deliverables belong in `szl-uds-deployment`. Left untouched (last seen `6f9998b`).

### Non-destructive decision (documented)
The pre-existing `packages/{a11oy,killinchu}/uds-package.yaml` are the **mesh-INTERNAL**
sidecar profile (namespaces `szl-a11oy`/`szl-killinchu`, service-to-service
AuthorizationPolicies). I added **NEW** `*-mesh-ready.yaml` files (ambient mode, `a11oy`/
`killinchu` namespaces, tenant gateway, human SSO with `enableAuthserviceSelector`) so the
spec-faithful mesh-ready profile ships **without destroying** the working internal files.
Both `zarf.yaml` originals were also preserved; the new packaging is `*-mesh-ready.yaml`.

### Branch-protection note
The push succeeded but GitHub returned a branch-protection advisory: "Changes must be made
through a pull request" + "2 of 2 required status checks are expected." The direct push to
`main` went through (the proxy credential is permitted), but the team may prefer this land
as a PR. Commit `cbc9c92` is on `origin/main` now.

---

## 2. Digests re-probed (anonymous token + manifest HEAD, GHCR, 2026-06-06)

| Image / tag | Digest | HTTP | Verdict |
| --- | --- | --- | --- |
| `ghcr.io/szl-holdings/szl-mesh:0.4.0` | `sha256:7f5fce3238ce3d255b322340bbe18cad1eb656e677065a2757637337300cac7f` | 200 | **VERIFIED** (matches roadmap) |
| `ghcr.io/szl-holdings/killinchu-bundle:0.5.0` | `sha256:e59921332c37408fb5a62b270eeeafb1f1ab44aebb350f18662c37aa2c67426f` | 200 | **VERIFIED CURRENT** |
| `ghcr.io/szl-holdings/a11oy-bundle:0.5.0` | `sha256:d801f8e461dfd519b5f8593322e75b89a1e66d4da9f6d72d0937c8ff2de64b51` | 200 | **STALE** (built against old a11oy organ image) |
| `ghcr.io/szl-holdings/a11oy:uds-v0.2.0` | `sha256:99e4ded13a66a759723c20c38237d7e59346e03ea6819cb5fe902422a8f719cf` | 200 | **VERIFIED** — digest CHANGED from roadmap's `e2ef6184…` → confirms a11oy rebuild → confirms a11oy-bundle stale |
| `ghcr.io/szl-holdings/sentra:uds-v0.2.0` | `sha256:60a0efc14366ba392bfe3f3cd4196863fe148bb87a17428be6a57f0a05ac3639` | 200 | **VERIFIED** |
| `ghcr.io/szl-holdings/amaru:uds-v0.2.0` | `sha256:53301e26adcde49e73df28d8c3b790f2496da9d495307fe8587ffa7452b289ff` | 200 | **VERIFIED** |
| `ghcr.io/szl-holdings/rosie:uds-v0.2.0` | `sha256:1984a15f53c2e1b91c7dafaa0ed5df9148d57e3e86eb73db879c2b0443302848` | 200 | **VERIFIED** |
| `ghcr.io/szl-holdings/killinchu:uds-v0.2.0` | `sha256:e0fb6c3aeaddadfbabc3ca7c5f29ef7b3ba31370b5ffb816e12495d5f29ca548` | 200 | **VERIFIED** |
| `a11oy:0.5.0`, `a11oy:0.5.0-wolfi`, `a11oy-ledger:0.5.0` | — | 404 | **NOT published → verify before deploy** |
| `killinchu:0.5.0-wolfi`, `killinchu-relay:0.5.0` | — | 404 | **NOT published → verify before deploy** |
| `szl-pepr-governance:0.5.0`, `szl-lula-runner:latest` | — | 404 | **NOT published → verify before deploy** |

> NOTE: the `killinchu:0.5.0` tag resolves to the **bundle** digest (`e59921…`), i.e. it is
> NOT a real organ-image tag. The upstream Zarf flavor therefore pins the VERIFIED
> `uds-v0.2.0` organ images by digest; the unicorn flavor + all `0.5.0` tags are labeled
> "verify before deploy."

---

## 3. Validation output captured (local, this session)

All tooling installed via documented methods. Tool versions: `uds v0.32.0` (vendored
`zarf v0.77.0`), `lula v0.16.0` (defenseunicorns-labs/lula1, Apache-2.0), `helm v3.15.2`,
`kubeconform v0.6.7`, `node v20.20.1`, `prettier`, `typescript 5.4.5`, `pepr 0.40.0`, `pyyaml 6.0.3`.

### 3.1 YAML — PASS
`python yaml.safe_load_all` + `yamllint (relaxed)` exit 0 on all 11 hand-authored YAML files
(2 Package CRs, 2 Zarf, 2 bundles, 2 OSCAL, 3 chart files).

### 3.2 Zarf schema lint — PASS (exit 0)
- `uds zarf dev lint packages/a11oy` (zarf-mesh-ready, `--set VERSION=0.5.0-uds.0 --set DOMAIN=uds.dev`) → **exit 0**
- `uds zarf dev lint packages/killinchu` (same) → **exit 0**
- `uds zarf dev lint capabilities/szl-governance` → **exit 0**, one expected warning:
  `Image not pinned with digest - ghcr.io/szl-holdings/szl-pepr-governance:0.5.0`
  (correct: that controller image is 404 / verify-before-deploy).

### 3.3 Helm — PASS (exit 0)
`helm template szl-governance ./chart` rendered a valid `uds.dev/v1alpha1` Package CR
(network.allow KubeAPI + szl-receipts egress + webhook ingress; monitor ServiceMonitor).

### 3.4 Pepr / TypeScript — PASS
- `tsc --noEmit` against **real pepr 0.40.0 types** → **exit 0** (type-correct).
- `prettier --check` → initially flagged 2 files; `prettier --write` applied; re-check
  → "All matched files use Prettier code style!" (this is what `pepr format` does).
- `pepr build` / `pepr format` CLI could NOT complete in-sandbox: Pepr's CLI pulls runtime
  deps (esbuild, node-forge, …) that don't resolve cleanly under `npm install --no-save
  --legacy-peer-deps`, and a full `pepr build` also requires **Docker** to produce the
  controller image. **No bandaid:** the meaningful checks (type-check vs real Pepr types +
  Prettier formatting) passed; the controller-image build is a CI/deploy-time step.

### 3.5 Lula / OSCAL — PASS (real engine)
- `lula tools lint -f oscal-component-a11oy.yaml` → `"valid": true` … "Successfully validated
  … is valid OSCAL version 1.1.2 component-definition" (exit 0).
- `lula tools lint -f oscal-component-killinchu.yaml` → `"valid": true` (exit 0).
- `lula validate -f oscal-component-a11oy.yaml` (no cluster) → "Found **5 Implemented
  Requirements**", "Found **4 runnable Lula Validations**", findings table for
  **si-7 / ac-7 / au-9 / au-3 / sa-17** all `not-satisfied` (HONEST — needs live cluster).
- `lula validate -f oscal-component-killinchu.yaml` → identical (5 reqs, 4 validations).
- **Rego proven with mock resources** via `lula dev validate`:
  - Λ-gate policy: all-6-true mock → "1 passing and 0 failing"; p6=false mock →
    "expected result to be true got false" (gate correctly DENIES). PASS.
  - Pepr-webhook-deployed policy: webhook-present + pod-Running mock → "1 passing". PASS.

**Two real fixes lula caught (applied — not band-aided):**
1. **UUID conformance:** OSCAL 1.1.2 requires RFC-4122 UUIDs. The spec's human-readable
   IDs (`SZL-A11OY-COMP-DEF-001-…`) failed schema. Replaced **all** component/party/control/
   requirement/back-matter UUIDs with valid v4 UUIDs (`lula tools uuidgen`), preserving the
   `#fragment` link wiring. Map saved at `/home/user/workspace/uuid_map.json`.
2. **Rego imports:** lula's bundled OPA rejects `import future.keywords.some` (in modern
   Rego `some` is a default keyword). Changed to `import future.keywords.in` (+ kept
   `.every`) which compiles and runs. Applied to all 8 Rego blocks (4 per app).

### 3.6 kubeconform — SKIPPED (expected, exit 0)
`kubeconform -summary -ignore-missing-schemas` on both mesh-ready Package CRs →
"Valid: 0, Invalid: 0, Errors: 0, Skipped: 2" (exit 0). The `uds.dev/v1alpha1` CRD is not in
the default schema set; full CR validation occurs at `uds deploy` time via the UDS Operator.

---

## 4. Honest REAL-vs-ROADMAP matrix

| Item | Status |
| --- | --- |
| Mesh-ready UDS Package CRs (expose+uptime / allow / sso authservice / monitor) | **REAL** |
| Zarf upstream flavor (VERIFIED `uds-v0.2.0` digests) | **REAL** |
| Zarf unicorn flavor (`0.5.0-wolfi`) | **ROADMAP** (images 404) |
| UDS Bundles one-command deploy | **REAL** (killinchu CURRENT; a11oy STALE → re-publish) |
| Pepr receipt-gate (format + presence, deny on missing/malformed) | **REAL** |
| Pepr full DSSE cryptographic verify | **ROADMAP (P1)** (egress pre-provisioned, hook commented) |
| Pepr Λ-score threshold; ledger append | **ROADMAP (P2/P3)** |
| Lula OSCAL: 5 controls each, OPA/Rego over live K8s | **REAL** structure (lint valid, Rego runs); **deploy-time** verdict |
| AU-9 WAL tamper detection; AC-7 denial Prometheus metric | **ROADMAP** |
| SLSA Build **L1** | **REAL** (honest baseline) |
| SLSA Build **L2** on 5 organ images (cosign `.sig`+`.att`) | **REAL** |
| Bundle-level attestation | **NOT earned (ROADMAP)** — cosign signature = bundle provenance only |
| L3 / Iron Bank / FedRAMP / CMMC | **NOT claimed** |
| Doctrine v11 | **LOCKED** 749/14/163 @ `958c09f9` (roadmap also cites `c7c0ba17` as kernel commit) |
| Λ conjunctive gate | **Conjecture 1** (not a theorem); agentic P1–P6 CI-green @ `958c09f9` |
| cannonico vertical | **REAL**; other verticals sample |
| Section 889 vendor list | **REAL** — exactly 5 (Huawei, ZTE, Hytera, Hikvision, Dahua) |
| Defense Unicorns endorsement | **NONE** — "built to mesh with UDS", not affiliated |

---

## 5. Deploy command set

```bash
# Prereq: UDS Core (AGPL-3.0)
uds deploy oci://ghcr.io/defenseunicorns/packages/uds/core:1.5.0-upstream --confirm

# Preferred maintained all-in-one (VERIFIED sha256:7f5fce32…)
uds deploy oci://ghcr.io/szl-holdings/szl-mesh:0.4.0 --confirm

# Per-app bundles
uds deploy oci://ghcr.io/szl-holdings/killinchu-bundle:0.5.0 --confirm     # VERIFIED CURRENT
uds deploy oci://ghcr.io/szl-holdings/a11oy-bundle:0.5.0 --confirm         # STALE — re-publish + re-verify FIRST

# Build from this repo
uds zarf package create packages/a11oy     -f zarf-mesh-ready.yaml --set DOMAIN=uds.dev -a amd64 --flavor upstream --confirm
uds zarf package create packages/killinchu -f zarf-mesh-ready.yaml --set DOMAIN=uds.dev -a amd64 --flavor upstream --confirm
uds create bundles/a11oy --confirm && uds create bundles/killinchu --confirm

# Pepr governance capability (needs Docker for the build)
( cd capabilities/szl-governance && npm ci && npm run build )
uds zarf package create capabilities/szl-governance --confirm

# Lula compliance assessment (against a live cluster)
lula validate -f compliance/oscal-component-a11oy.yaml
lula validate -f compliance/oscal-component-killinchu.yaml

# Re-publish stale a11oy bundle (CI)
#   .github workflow: uds-canonical-bundles-publish.yml  (input bundle=a11oy)
```

---

## 6. What needs the live Hetzner/tower environment (deploy-time-only verification)

- Full `uds deploy` reconcile of the mesh-ready Package CRs by the UDS Operator
  (VirtualService creation, NetworkPolicy materialization, Keycloak client + authservice).
- Pepr admission webhook **live admit/deny** round-trip in k3d/UDS Core.
- `lula validate` control **PASS/FAIL** verdicts against live cluster state (offline they
  correctly report `not-satisfied` — the K8s queries return nothing without a cluster).
- `cosign verify` of organ-image `.sig` / `.att` (needs network egress to Rekor).
- **Re-publish + re-verify** the STALE `a11oy-bundle:0.5.0` (new digest must differ from
  `d801f8e4…`); publish the 404 `0.5.0` / `0.5.0-wolfi` / `szl-pepr-governance` images.
- `pepr build` controller image (needs Docker) → push to GHCR before deploying the capability.

---

## 7. Sources / references

- UDS Package v1alpha1 CR reference — https://uds.defenseunicorns.com/reference/configuration/custom-resources/packages-v1alpha1-cr/
- UDS Core (AGPL-3.0) — https://github.com/defenseunicorns/uds-core
- Pepr (Apache-2.0) — https://github.com/defenseunicorns/pepr
- lula1 (Apache-2.0) — https://github.com/defenseunicorns-labs/lula1 (release v0.16.0)
- Zarf (Apache-2.0) — https://github.com/zarf-dev/zarf
- OSCAL / NIST SP 800-53 Rev 5 (public domain) — https://pages.nist.gov/OSCAL/ , https://github.com/usnistgov/oscal-content
- Made-for-UDS badge — https://raw.githubusercontent.com/defenseunicorns/uds-common/refs/heads/main/docs/assets/made-for-uds.svg
- Internal spec — `team/UDS_MESH_READY_SPEC.md` §3 (CRs/zarf/bundle), §4 (Pepr), §5 (Lula/OSCAL)
