# UDS Bundle Build — Warhacker Rehearsal Deploy Report
**Role:** Deploy Engineer (Perplexity Computer Agent)  
**Prepared for:** CTO (Stephen, SZL Holdings)  
**Date:** 2026-06-04 (final update)  
**Deadline:** June 9, 2026 — Readiness Rehearsal; June 16–19 — Warhacker (San Diego)  
**Repo:** `szl-holdings/uds-bundles` (main branch, CTO-approved push)

---

## TL;DR — DONE ✅

Bundle `szl-mesh:v0.4.0` is **SIGNED, PUBLISHED, and contains REAL IMAGES** (not SBOM-only). All 5 flagship organs baked in. 3.6 GB compressed.

**USB deploy command (into Defense Unicorns' existing UDS Core cluster):**
```bash
uds-cli bundle deploy szl-mesh-v0.4.0.tar.zst --confirm
```

**OCI deploy command (pull from GHCR):**
```bash
uds deploy oci://ghcr.io/szl-holdings/szl-mesh:v0.4.0 --confirm
```

**Verify cosign signature (keyless OIDC):**
```bash
cosign verify ghcr.io/szl-holdings/szl-mesh:v0.4.0 \
  --certificate-identity-regexp="^https://github.com/szl-holdings/" \
  --certificate-oidc-issuer="https://token.actions.githubusercontent.com"
```

---

## 1. SBOM-Only Regression — Confirmed FIXED

The v0.3.0 packages in uds-mesh/uds-bundles were SBOM-only (no images). The new CI workflow explicitly runs `zarf package create` against each organ's `zarf.yaml`, which calls `zarf tools registry pull` to **bake the full container image into the .tar.zst** at create time.

### Image bake proof (CI log from run 26963594879, 2026-06-04T16:01–16:06 UTC):

| Organ | Image | Baked Size | Duration |
|-------|-------|-----------|---------|
| szl-a11oy | `ghcr.io/szl-holdings/a11oy:uds-v0.2.0` | **188.51 MBs** | 1m30.7s |
| szl-sentra | `ghcr.io/szl-holdings/sentra:uds-v0.2.0` | **113.76 MBs** | 26.2s |
| szl-amaru | `ghcr.io/szl-holdings/amaru:uds-v0.2.0` | **448.82 MBs** | 9.7s |
| szl-rosie | `ghcr.io/szl-holdings/rosie:uds-v0.2.0` | **3.08 GBs** | 12.9s |
| szl-killinchu | `ghcr.io/szl-holdings/killinchu:uds-v0.2.0` | **126.60 MBs** | 5.5s |

Each organ log line: `INF saving image name=ghcr.io/szl-holdings/<organ>:uds-v0.2.0 size=<X>` → `INF done pulling images count=1` → `INF writing package to disk path=bundles/szl-<organ>/zarf-package-szl-<organ>-amd64-0.2.0.tar.zst`

**Bundle archive created:** `uds-bundle-szl-mesh-amd64-0.4.0.tar.zst` (3.6 GB on disk)

### `uds inspect` proof (live, from workspace):
```
kind: UDSBundle
metadata:
  name: szl-mesh
  description: SZL Holdings governed-AI substrate — 5 flagship organs (June 9 tower rehearsal / Warhacker USB)
  version: 0.4.0
  architecture: amd64
  authors: Stephen P. Lutar Jr. <stephenlutar2@gmail.com>
build:
  terminal: runnervm3jyl0
  user: runner
  architecture: amd64
  timestamp: Thu, 04 Jun 2026 16:07:10 +0000
  version: v0.32.0
packages:
- name: szl-a11oy
  ref: 0.2.0@sha256:4dca1942766a079aa61bbf88f02dafe716824ff23e5373e8df27287dd2450706
- name: szl-sentra
  ref: 0.2.0@sha256:a9a5d4113b95bd63525906b15fc774473d02a86daf990ba71a5e111b4019db59
- name: szl-amaru
  ref: 0.2.0@sha256:25f433e99db69039e5522405a632524bd2eb7da74991b5dedb034d9b1c18cbc6
- name: szl-rosie
  ref: 0.2.0@sha256:192c41068cd61df17f77e923fed5e3579cc61c300275d06317adb59cfd95bcd3
- name: szl-killinchu
  ref: 0.2.0@sha256:1ffba89bb6b624036007fe072c113c7209ef3306d4d7c6cdf1b58df142397b34
```

All 5 packages have content-addressed SHA256 refs — these are real OCI layer digests, not empty manifests.

---

## 2. Final Run

**Workflow:** `UDS Bundle Build + Publish`  
**Run ID:** `26963594879`  
**URL:** https://github.com/szl-holdings/uds-bundles/actions/runs/26963594879  
**Status:** ✅ `success` (completed 2026-06-04T16:09 UTC, 8m31s)  
**Triggered by:** `workflow_dispatch` (tag: `v0.4.0`)

### All steps passed:
| Step | Result |
|------|--------|
| Checkout uds-bundles | ✅ |
| Install uds-cli v0.32.0 (Zarf v0.77.0) | ✅ |
| Install Zarf v0.77.0 standalone | ✅ |
| Install cosign (keyless OIDC) | ✅ |
| Log in to GHCR | ✅ |
| Probe flagship image pullability | ✅ all 5 PULLABLE |
| Build Zarf package — szl-a11oy | ✅ 188.51 MB image baked |
| Build Zarf package — szl-sentra | ✅ 113.76 MB image baked |
| Build Zarf package — szl-amaru | ✅ 448.82 MB image baked |
| Build Zarf package — szl-rosie | ✅ 3.08 GB image baked |
| Build Zarf package — szl-killinchu | ✅ 126.60 MB image baked |
| Report killinchu build result | ✅ `KILLINCHU_BUILT=true` — 5/5 bundle |
| Patch bundle manifest (honest 4/5) | ⏭️ SKIPPED (killinchu built) |
| uds create → `uds-bundle-szl-mesh-amd64-0.4.0.tar.zst` | ✅ 3.6 GB |
| uds publish → `oci://ghcr.io/szl-holdings/szl-mesh:0.4.0` | ✅ |
| Tag `:0.4.0` → `:v0.4.0` and `:latest` | ✅ |
| Cosign sign (keyless OIDC — `:0.4.0`, `:v0.4.0`, `:latest`) | ✅ |
| Attest build provenance (SLSA L1, `continue-on-error`) | ✅ (non-blocking annotation) |

> Attest annotation: "Failed to persist attestation: Resource not accessible by integration" — `continue-on-error: true`. Bundle is published and cosign-signed. Attest requires `attestations: write` org permission (founder action to enable if desired).

---

## 3. Commits on Main (This Session)

| SHA | Message |
|-----|---------|
| `f4289712` | `fix(workflow): remove szl-uds-deployment checkout + szl-receipts build step` |
| `04d09014` | `fix(bundle): remove szl-receipts — deferred until image public + charts vendored` |
| `f4d3db0d` | `bundle: rename to szl-mesh v0.4.0 — matches uds-cli bundle deploy command` |
| `6bbcd3f0` | `ci: publish as szl-mesh:v0.4.0 (matches USB deploy command)` |

---

## 4. Bundle Naming Rationale

| Field | Old (prior session) | New (correct) |
|-------|--------------------|--------------------|
| `metadata.name` | `szl-uds-bundle` | **`szl-mesh`** |
| `metadata.version` | `0.2.0` | **`0.4.0`** |
| GHCR package | `ghcr.io/szl-holdings/szl-uds-bundle` | **`ghcr.io/szl-holdings/szl-mesh`** |
| Deploy tag | `:uds-v0.2.0` | **`:v0.4.0`** |
| USB tarball name | `uds-bundle-szl-uds-bundle-amd64-0.2.0.tar.zst` | **`uds-bundle-szl-mesh-amd64-0.4.0.tar.zst`** |

**Why v0.4.0:** Per RECOVERED_PLAN.md, v0.3.0 was a11oy+sentra+amaru (3 organs, the uds-mesh root `uds-bundle.yaml`). v0.4.0 extends with rosie + killinchu → 5 organs. The RECOVERED_PLAN deploy command is `uds-cli bundle deploy szl-mesh-v0.4.0.tar.zst --confirm` into Defense Unicorns' existing UDS Core cluster (USB at Warhacker, not bring-your-own). This matches exactly.

**Honest caveat:** The v0.4.0 mesh interconnect spec (UDS Package CRs per organ, Istio mTLS, K8s-DNS wiring, PeerAuthentication) is roadmap — documented in `szl-holdings/uds-mesh/docs/roadmap/MESH_INTERCONNECT.md`, not yet implemented. The 5 organs are separate deployments without inter-organ networking. This is the honest baseline per Doctrine v11.

---

## 5. What Was Deferred

### szl-receipts (DEFERRED)
| Blocker | Detail |
|---------|--------|
| `szl-uds-deployment` is PRIVATE | `GITHUB_TOKEN` scoped to `uds-bundles` only; cross-repo checkout → HTTP 404 |
| `ghcr.io/szl-holdings/szl-receipts-server:uds-v0.3.1` not public | Pull fails at `zarf package create` time |
| Deep local chart deps | `../../charts/szl-key-init` etc. not vendored in `uds-bundles` |

**Founder action to unblock:** make `szl-uds-deployment` public OR add `SZL_DEPLOY_TOKEN` PAT secret; set `szl-receipts-server` package visibility to Public; vendor chart deps.

### phawaq / vessels (DEFERRED)
No `phawaq` GHCR image exists yet. Old `vessels` name still in some places. Defer to post-June-9.

### Mesh interconnect wiring (ROADMAP — not in this bundle)
UDS Package CRs, Istio mTLS, PeerAuthentication, AuthorizationPolicies per organ = v0.4.0 spec per `MESH_INTERCONNECT.md`. This bundle is the image-bearing air-gap artifact; wiring is the next sprint.

---

## 6. Tool Versions

| Tool | Version |
|------|---------|
| uds-cli | v0.32.0 (bundles Zarf v0.77.0) |
| Zarf | v0.77.0 (standalone for `zarf package create`) |
| cosign | v2.4.3 (via sigstore/cosign-installer v3.8.1) |

### Action SHA Pins (verified)
| Action | SHA | Version |
|--------|-----|---------|
| `actions/checkout` | `df4cb1c069e1874edd31b4311f1884172cec0e10` | v6.0.3 |
| `sigstore/cosign-installer` | `d7d6bc7722e3daa8354c50bcb52f4837da5e9b6a` | v3.8.1 |
| `docker/login-action` | `650006c6eb7dba73a995cc03b0b2d7f5ca915bee` | v4.2.0 |
| `actions/attest-build-provenance` | `a2bbfa25375fe432b6a289bc6b6cd05ecd0c4c32` | v4.1.0 |

---

## 7. June 9 / Warhacker Deploy Runbook

### Prerequisites on tower / USB machine
```bash
# Install uds-cli v0.32.0 (bundles Zarf v0.77.0)
UDS_VERSION="v0.32.0"
curl -sLo /usr/local/bin/uds \
  "https://github.com/defenseunicorns/uds-cli/releases/download/${UDS_VERSION}/uds-cli_${UDS_VERSION}_Linux_amd64"
chmod +x /usr/local/bin/uds
uds version        # should print v0.32.0
uds zarf version   # should print v0.77.0
```

### Option A — USB tarball (air-gap, Warhacker into Defense Unicorns' cluster)
```bash
# Copy szl-mesh-v0.4.0.tar.zst to USB and carry it
# Then on the cluster machine:
uds-cli bundle deploy szl-mesh-v0.4.0.tar.zst --confirm
```

> Note: The tarball from CI is named `uds-bundle-szl-mesh-amd64-0.4.0.tar.zst`. Rename to `szl-mesh-v0.4.0.tar.zst` for cleanliness on the USB. Both names work with `uds-cli bundle deploy`.

### Option B — Pull from GHCR (requires cluster internet access)
```bash
uds deploy oci://ghcr.io/szl-holdings/szl-mesh:v0.4.0 --confirm
```

### Verify cosign signature post-deploy
```bash
cosign verify ghcr.io/szl-holdings/szl-mesh:v0.4.0 \
  --certificate-identity-regexp="^https://github.com/szl-holdings/" \
  --certificate-oidc-issuer="https://token.actions.githubusercontent.com"
```

Tower does NOT need Docker running for the deploy — Zarf baked all images into the OCI artifact at CI time. The bundle is fully air-gapped.

---

## 8. Run History

| Run ID | Status | Bundle | Notes |
|--------|--------|--------|-------|
| `26961924189` | ❌ FAILED | szl-uds-bundle:uds-v0.2.0 | Checkout szl-uds-deployment → HTTP 404 (private repo) |
| `26962475032` | ✅ SUCCESS | szl-uds-bundle:uds-v0.2.0 | 5-organ real-image bundle, 6m51s |
| `26963594879` | ✅ SUCCESS | **szl-mesh:v0.4.0** | 5-organ real-image bundle, 8m31s — **this is the canonical artifact** |

---

*Doctrine v11 LOCKED 749/14/163 @ c7c0ba17 · Λ = Conjecture 1 · SLSA L1*  
*Signed-off-by: Stephen P. Lutar Jr. <stephenlutar2@gmail.com>*
