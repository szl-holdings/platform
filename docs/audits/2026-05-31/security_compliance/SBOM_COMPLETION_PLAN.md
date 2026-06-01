# SBOM_COMPLETION_PLAN.md — every repo, every Space, every Docker image

**Author:** Yachay (CTO authority) · **Date:** 2026-06-01 · **Doctrine v11 LOCKED (749/14/163).**
**Goal:** A signed **CycloneDX** SBOM generated, signed, and *attached as a cosign attestation* for every GitHub repo, every HF Space, and every Docker image — plus a verifiable chain (SBOM → image → bundle → Rekor).
**Rules:** HF changes via **HfApi push only** (never CI `secrets.HF_TOKEN`). ADDITIVE only. Honest about current gaps.

> **Standard we adopt:** CycloneDX 1.5 JSON as the primary SBOM format (SPDX kept as secondary for partners who require it). Generation via **Syft** for images/filesystems, plus the existing `cyclonedx-*` plugins per ecosystem. Vulnerability matching via **Grype** (SBOM-driven) + **Trivy** (image + fs). Signing via **cosign attest --type cyclonedx** against the artifact digest, Rekor-logged.

---

## 1. Current state matrix

### 1.1 GitHub repos — SBOM in CI

| Repo | `sbom.yml` | Format(s) emitted | Signed? | Attached to artifact? | Container SBOM? |
|---|---|---|---|---|---|
| a11oy | ✅ success | CycloneDX + SPDX + Trivy | ❌ | ❌ (release JSON only) | ❌ |
| amaru | ✅ success | CycloneDX + SPDX + Trivy | ❌ | ❌ | ❌ |
| sentra | ✅ success | CycloneDX + SPDX | ❌ | ❌ | ❌ |
| rosie | ✅ success | CycloneDX + SPDX | ❌ | ❌ | ❌ |
| vessels | ✅ (API; missing in local snapshot) | CycloneDX + SPDX | ❌ | partial (in signed bundle source tree) | ❌ |
| uds-mesh | ✅ | CycloneDX | ❌ | ❌ | ❌ |
| lutar-lean / ouroboros / vsp-otel / platform | ✅ (most) | CycloneDX/SPDX | ❌ | ❌ | n/a |

Source: `13_GITHUB_WORKFLOWS_STATUS.md`, `81_UDS_BUNDLE_VERIFY_MATRIX.md`.

### 1.2 HF Spaces — SBOM present?

| Space | SDK | SBOM on Space? | Image | Note |
|---|---|---|---|---|
| a11oy | docker | ❌ | yes (no SBOM) | APP_STARTING |
| amaru | docker | ❌ | yes (no SBOM) | APP_STARTING |
| sentra | docker | ❌ | yes (no SBOM) | RUNNING |
| vessels | docker | ❌ | yes (no SBOM) | RUNNING |
| rosie | docker | ❌ | yes (no SBOM) | APP_STARTING |
| lean-kernel | docker | ❌ | yes (no SBOM) | RUNNING |
| anatomy-3d | static | ❌ | n/a | RUNNING |
| uds-demo | static | ❌ | n/a | RUNNING |
| README | static | ❌ | n/a | RUNNING |

Source: `hf_spaces_inventory.json`. **No HF Space currently carries an SBOM companion or attestation.**

### 1.3 UDS bundles — SBOM + signature

| Bundle | SBOM in tarball? | cosign `.sig`? | Attested SBOM? |
|---|---|---|---|
| vessels uds-v0.3.0 | partial (CI workflows present in source) | ✅ keyless (Rekor 1675423172) | ❌ |
| a11oy uds-v0.3.0 | ❌ | ❌ | ❌ |
| amaru uds-v0.3.0/.1 | ❌ | ❌ | ❌ |
| sentra uds-v0.3.0/.1 | ❌ | ❌ | ❌ |
| rosie uds-v0.3.0 | ❌ | ❌ | ❌ |
| uds-mesh | ❌ | ❌ | ❌ |

---

## 2. Gap summary

1. **No image-layer SBOMs** anywhere (Docker Spaces ship unscanned at the image level).
2. **No signed SBOM attestations** (`cosign attest --type cyclonedx`) on any artifact.
3. **SBOMs not attached** to HF Spaces or to 5/6 UDS bundles.
4. **Format drift** — some repos emit SPDX only, some both; standardize on CycloneDX-primary.
5. **No verification gate** that the deployed image's SBOM matches what was scanned (provenance↔artifact binding missing → this is exactly the SLSA L1→L2 gap).
6. **Broken GHCR build** means image SBOMs can't currently be produced in CI for some repos until that job is fixed.

---

## 3. Patch plan — per surface

### 3.1 GitHub repos (CI, no HF token)
For each flagship repo, extend `sbom.yml` (ADDITIVE) to:
1. Build the image (or consume the GHCR image once the build is fixed).
2. `syft <image> -o cyclonedx-json=sbom.cyclonedx.json` (image SBOM) **and** keep the existing fs/source SBOM.
3. `grype sbom:sbom.cyclonedx.json --fail-on high` (gate on High/Critical; POA&M any waivers).
4. `cosign attest --predicate sbom.cyclonedx.json --type cyclonedx <image-digest>` (keyless OIDC in CI, Rekor-logged) — **this signs the SBOM as an in-toto attestation bound to the image digest.**
5. Upload SBOM + attestation as release assets.

> Container-image signing/attestation in CI uses **keyless Fulcio OIDC** (the same path vessels already proved). The generated key pair in `COSIGN_KEY_MATERIAL.md` is for **local/offline + HSM** signing of HF/UDS artifacts where CI OIDC isn't available.

### 3.2 HF Spaces (HfApi push ONLY — never CI)
A local script (token from `.secret/hf_token`) does, per docker Space:
1. Pull the running image digest (or rebuild locally from the Space `Dockerfile`).
2. `syft <image> -o cyclonedx-json` → `SBOM.cyclonedx.json`.
3. `cosign sign-blob --key keys/cosign.key SBOM.cyclonedx.json` → `SBOM.cyclonedx.json.sig` (offline key) **and/or** keyless.
4. `HfApi.upload_file` the SBOM + `.sig` to the Space under `security/SBOM.cyclonedx.json` (+ `.sig`, `.pub`).
5. Add a `SECURITY.md` + link in the Space README pointing to the SBOM and the public key fingerprint.

For static Spaces (anatomy-3d, uds-demo, README): emit an SBOM of the build toolchain + pinned CDN deps (npm/lockfile) and upload the same way.

Template (already-proven HfApi-direct pattern from `530_ENV_PLAN_AND_UDS_DOCS.md`):
```python
from huggingface_hub import HfApi
api = HfApi(token=open(".secret/hf_token").read().strip())
for space in ["a11oy","amaru","sentra","vessels","rosie","lean-kernel"]:
    api.upload_file(path_or_fileobj=f"out/{space}/SBOM.cyclonedx.json",
                    path_in_repo="security/SBOM.cyclonedx.json",
                    repo_id=f"SZLHOLDINGS/{space}", repo_type="space")
    api.upload_file(path_or_fileobj=f"out/{space}/SBOM.cyclonedx.json.sig",
                    path_in_repo="security/SBOM.cyclonedx.json.sig",
                    repo_id=f"SZLHOLDINGS/{space}", repo_type="space")
```

### 3.3 UDS bundles
1. Sign the 5 unsigned bundles (see `COSIGN_KEY_MATERIAL.md` §sign-all).
2. For each, `syft <bundle-image-set> -o cyclonedx-json` and `cosign attest --type cyclonedx`.
3. Re-publish bundle + `.sig` + `.sbom` + `.att` to GHCR and mirror the SBOM to HF via HfApi.
4. Where Zarf is used, rely on Zarf's **build-time SBOM auto-generation**; capture and sign it.

---

## 4. Per-artifact completion checklist

| Artifact | SBOM gen | Grype scan | cosign sign/attest | Attach (CI) | Mirror to HF (HfApi) | Status target |
|---|---|---|---|---|---|---|
| a11oy repo+image | ☐ | ☐ | ☐ | ☐ | ☐ | full |
| amaru repo+image | ☐ | ☐ | ☐ | ☐ | ☐ | full |
| sentra repo+image | ☐ | ☐ | ☐ | ☐ | ☐ | full |
| vessels repo+image | partial | ☐ | partial | partial | ☐ | full |
| rosie repo+image | ☐ | ☐ | ☐ | ☐ | ☐ | full |
| lean-kernel image | ☐ | ☐ | ☐ | n/a | ☐ | full |
| anatomy-3d (static) | ☐ | ☐ | ☐ | ☐ | ☐ | toolchain SBOM |
| uds-demo (static) | ☐ | ☐ | ☐ | ☐ | ☐ | toolchain SBOM |
| README (static) | ☐ | ☐ | ☐ | ☐ | ☐ | toolchain SBOM |
| uds-mesh bundle | ☐ | ☐ | ☐ | ☐ | ☐ | full |
| a11oy/amaru/sentra/rosie UDS bundles | ☐ | ☐ | ☐ | ☐ | ☐ | full |
| vessels UDS bundle | partial | ☐ | ✅ sig | partial | ☐ | attach SBOM attestation |

---

## 5. Sequencing (16-day Warhacker window)

| Day | Action |
|---|---|
| D1 | Fix GHCR container-build on main (unblocks image SBOMs); standardize CycloneDX-primary in `sbom.yml` |
| D2 | Add Syft image SBOM + Grype gate + `cosign attest` to a11oy/amaru/sentra |
| D3 | Same for rosie/vessels/lean-kernel; sign the 5 UDS bundles |
| D4 | HfApi-push SBOM + `.sig` + `SECURITY.md` to all 8 Spaces |
| D5 | Verification harness: `cosign verify-attestation --type cyclonedx` green across fleet; publish coverage report |

**Definition of done:** `cosign verify-attestation --type cyclonedx` succeeds for every image; every Space carries `security/SBOM.cyclonedx.json(.sig)`; every UDS bundle has `.sig` + attached CycloneDX attestation; coverage report shows **100%**.

---

## Sources
- Internal: `13_GITHUB_WORKFLOWS_STATUS.md`, `81_UDS_BUNDLE_VERIFY_MATRIX.md`, `hf_spaces_inventory.json`, `530_ENV_PLAN_AND_UDS_DOCS.md`.
- CycloneDX: <https://cyclonedx.org/specification/overview/>
- Syft/Grype (Anchore OSS): <https://github.com/anchore/syft> · <https://github.com/anchore/grype>
- cosign attestations: <https://docs.sigstore.dev/cosign/verifying/attestation/>
- Zarf SBOM: <https://docs.zarf.dev/ref/sboms/>

*— Yachay, 2026-06-01.*
