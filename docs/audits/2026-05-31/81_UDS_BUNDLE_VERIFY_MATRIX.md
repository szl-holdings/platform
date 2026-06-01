# 81 — UDS BUNDLE VERIFICATION MATRIX (v0.3.x)

**Classification:** SZL Internal — Founder Eyes
**Date:** 2026-05-31
**Operator:** Perplexity verification agent (sandbox)
**Scope:** 6 UDS releases — a11oy, amaru, sentra, vessels, rosie, uds-mesh
**Toolchain:** `gh` (GitHub CLI, authenticated), `cosign v2`, `openssl`, Python `zstandard` 0.25.0, `zarf v0.51.0` (downloaded into sandbox), `sha256sum`.

---

## 0. EXECUTIVE RESULT

| Bundle | Tag (LATEST) | sha256 | cosign sig | Tarball unpacks | 6 docs present | uds-bundle.yaml | Overall |
|---|---|---|---|---|---|---|---|
| **vessels** | uds-v0.3.0 | ✅ OK | ✅ **Verified OK** (keyless/Fulcio) | ✅ | ⚠️ 1/6 (SECURITY.md) | ❌ not in tarball | **PASS (signed)** |
| **a11oy** | uds-v0.3.0 | ✅ OK | ❌ **NO .sig exists** | ✅ | ⚠️ 5/6 (no AUDIT-LOG.md) | ✅ `artifacts/a11oy-uds/uds-bundle.yaml` | **PARTIAL — sha256 only** |
| **amaru** | uds-v0.3.1 | ✅ OK (v0.3.0 payload) | ❌ **NO .sig exists** | ✅ | ⚠️ 1/6 (SECURITY.md) | ❌ not in tarball | **PARTIAL — sha256 only** |
| **sentra** | uds-v0.3.1 | ✅ OK (v0.3.0 payload) | ❌ **NO .sig exists** | ✅ | ⚠️ 1/6 (SECURITY.md) | ❌ not in tarball | **PARTIAL — sha256 only** |
| **rosie** | uds-v0.3.0 | ✅ OK | ❌ **NO .sig exists** | ✅ | ⚠️ 1/6 (SECURITY.md) | ❌ not in tarball | **PARTIAL — sha256 only** |
| **uds-mesh** | uds-v0.3.0 | ✅ OK | ❌ **NO .sig exists** | ✅ | ⚠️ 2/6 (SECURITY.md + uds-bundle.yaml) | ✅ top-level `uds-bundle.yaml` + `bundles/v0.3.1/uds-bundle.yaml` | **PARTIAL — sha256 only** |

**Headline:**
- **sha256 integrity: 6/6 PASS.** Every tarball's SHA-256 matches the hash published in its GitHub release body byte-for-byte. **No tampering.**
- **cosign signature: 1/6 verified** (vessels only). The other 5 have **no signature artifact anywhere** (not on GitHub releases, not on the Hugging Face mirror). This is the **P0**.

---

## 1. ASSET-LOCATION REALITY (root cause)

The v0.3.x release bodies state plainly: *"Binary assets (tar.zst + .sig + .sha256 + .pub) are not attached to this release. The Perplexity agent proxy does not support binary file uploads to `uploads.github.com`."*

Consequence — the 4-asset signed pattern only landed on GitHub for **one** repo:

| Repo | tar.zst on GitHub | .sig on GitHub | .sigstore.json | .pub on GitHub | tar.zst on HF mirror |
|---|---|---|---|---|---|
| vessels | ✅ | ✅ | ✅ | ✅ | (n/a) |
| a11oy | ❌ | ❌ | ❌ | ❌ (only in v0.2.0) | ✅ `SZLHOLDINGS/a11oy-source` |
| amaru | ❌ | ❌ | ❌ | ❌ (only in v0.2.0) | ✅ `SZLHOLDINGS/amaru-source` |
| sentra | ❌ | ❌ | ❌ | ❌ (only in v0.2.0) | ✅ `SZLHOLDINGS/sentra-source` |
| rosie | ❌ | ❌ | ❌ | ❌ (only in v0.2.0) | ✅ `SZLHOLDINGS/rosie-source` |
| uds-mesh | ❌ | ❌ | ❌ | ❌ (none in v0.2.0 either) | ✅ `SZLHOLDINGS/uds-mesh-source` |

GitHub release assets for the 5 non-vessels repos contain **only SBOM JSON** (`*-sbom-2.spdx.json`, `*-sbom.cyclonedx.json`) — no payload, no signature.

The Hugging Face mirrors host the `.tar.zst` **only** — no `.sig`, `.sha256`, or `.pub` companion files were uploaded there either (verified via `list_repo_files`).

---

## 2. PER-BUNDLE DETAIL

### 2.1 vessels — uds-v0.3.0 ✅ PASS (fully signed)
- **Source commit:** `bb8202c7aa94804d806d8e1a68d36a6f7f7773a2`
- **Assets (GitHub):** `vessels-uds-0.3.0.tar.zst`, `.sha256`, `.sig`, `.sigstore.json`, `vessels-uds-dev.pub`
- **sha256:** `a3b1a8c26977ed48270895d10123b3124773517e3155f3ed3287dc7e1d6467b3` → `sha256sum -c` = **OK**
- **cosign:** keyless / Sigstore Fulcio. `.pub` is an *instructions* file, not a key. Verified with:
  ```
  cosign verify-blob \
    --certificate-identity-regexp "https://github.com/szl-holdings/vessels/.github/workflows/uds-sign-release.yml.*" \
    --certificate-oidc-issuer https://token.actions.githubusercontent.com \
    --bundle vessels-uds-0.3.0.tar.zst.sigstore.json \
    vessels-uds-0.3.0.tar.zst
  → Verified OK
  ```
  - **Signing identity (from cert SAN):** `https://github.com/szl-holdings/vessels/.github/workflows/uds-sign-release.yml@refs/heads/main`
  - **OIDC issuer:** `https://token.actions.githubusercontent.com`
  - **Fulcio cert validity:** Not Before `May 30 13:51:15 2026 GMT` / Not After `14:01:15 2026 GMT` (10-min ephemeral, correct)
  - **Rekor transparency log index:** `1675423172` (integratedTime `1780149076` = 2026-05-30T13:51:16Z)
- **Unpack:** ✅ extracts to `vessels-uds-0.3.0/` (repo source: web/, scripts/, docs/, .github/workflows/{slsa,scorecard,sbom,codeql,...}.yml)
- **6 docs:** SECURITY.md ✅. ARCHITECTURE/AUDIT-LOG/OPERATOR-QUICKSTART/UDS-BUNDLE.md/uds-bundle.yaml ❌ (intended structure is documented in `docs/UDS_DEPLOYMENT.md` but the Zarf package layout — zarf.yaml/uds-bundle.yaml/charts — is **not committed in the tarball**).
- **Zarf metadata:** none packaged; `docs/UDS_DEPLOYMENT.md` describes the planned `uds-package-vessels` (zarf.yaml + uds-bundle.yaml + charts/vessels Helm chart, nginx:alpine port 8080). **Phase 1 (staged), Phase 2 (containerize web/) pending.**

### 2.2 a11oy — uds-v0.3.0 ⚠️ PARTIAL (sha256 only — P0 unsigned)
- **Source commit:** `663e7c3eb11ca5e299f04f7619e926f962620b91`
- **Payload source:** HF `SZLHOLDINGS/a11oy-source` → `a11oy-uds-0.3.0.tar.zst`
- **sha256 expected (release body):** `96a301140ef24c886718e91d122ade83b8db26696ec48681b46653cd753410b8`
- **sha256 actual (downloaded):** `96a301140ef24c886718e91d122ade83b8db26696ec48681b46653cd753410b8` → **OK**, size 10,539,040 bytes (matches documented 10,539,040)
- **cosign:** ❌ **no .sig exists anywhere.** Cannot verify a signature that was never produced/uploaded.
- **Unpack:** ✅ full repo source.
- **6 docs:** **5/6 present** — `artifacts/a11oy-uds/docs/ARCHITECTURE.md` ✅, `.../OPERATOR-QUICKSTART.md` ✅, `.../UDS-BUNDLE.md` ✅, root `SECURITY.md` ✅, `artifacts/a11oy-uds/uds-bundle.yaml` ✅. **AUDIT-LOG.md ❌ (absent in all 6 bundles).**
- **Zarf metadata** (`artifacts/a11oy-uds/zarf.yaml`, `zarf dev lint` → exit 0, schema valid):
  - kind `ZarfPackageConfig`, name `a11oy-uds`, version `0.2.0` (⚠️ zarf.yaml still pinned at 0.2.0 inside a 0.3.0 release), architecture `multi`
  - components: `a11oy-core`, `a11oy-connection`, `a11oy-provenance`, `a11oy-shared` (optional, default on), `a11oy-attestations` (optional, default off), `a11oy-docs`
  - images: none (file-drop package into `/opt/a11oy/`)
  - uds-bundle.yaml: kind `UDSBundle`, name `a11oy`, version `0.2.0`, single package `a11oy-uds` ref `0.2.0`

### 2.3 amaru — uds-v0.3.1 ⚠️ PARTIAL (sha256 only — P0 unsigned)
- **Source commit (v0.3.1):** `365474c629a18e1dcf944398cb442953c7d89717`. v0.3.1 is a CodeQL/cleanup patch with **no new tarball**; the canonical payload is the **v0.3.0** tarball on HF.
- **Payload source:** HF `SZLHOLDINGS/amaru-source` → `amaru-uds-0.3.0.tar.zst`
- **sha256 expected:** `84bbbb362955b5a8330b04f7b73eb7ad02fdc235f23ef71cfa7467b77d1a261c`
- **sha256 actual:** `84bbbb362955b5a8330b04f7b73eb7ad02fdc235f23ef71cfa7467b77d1a261c` → **OK**, 381,567 bytes (matches documented)
- **cosign:** ❌ no .sig exists.
- **Unpack:** ✅. **6 docs: 1/6** (SECURITY.md). zarf.yaml at `deploy/zarf.yaml`.
- **Zarf metadata** (`deploy/zarf.yaml`): kind `ZarfPackageConfig`, name `amaru`, version `1.0.0-alpha`, arch `amd64`, component `amaru-runtime`, image `ghcr.io/szl-holdings/amaru:v1.0.0-alpha`, manifests: amaru-namespace/delta-log-pvc/amaru-deployment/amaru-service. **uds-bundle.yaml not in tarball.**

### 2.4 sentra — uds-v0.3.1 ⚠️ PARTIAL (sha256 only — P0 unsigned)
- **Source commit (v0.3.1):** `fd35f8aaff0b09a0467bebc0182aef36f713b9a8`. v0.3.1 = vite/esbuild dependency patches, no new tarball; canonical payload = v0.3.0 on HF.
- **Payload source:** HF `SZLHOLDINGS/sentra-source` → `sentra-uds-0.3.0.tar.zst`
- **sha256 expected:** `659a2fb6aa1ea4977c43dd02d485e42369c8b51520d81df5d220f5c58421c2db`
- **sha256 actual:** `659a2fb6aa1ea4977c43dd02d485e42369c8b51520d81df5d220f5c58421c2db` → **OK**, 756,132 bytes (matches documented)
- **cosign:** ❌ no .sig exists.
- **Unpack:** ✅. **6 docs: 1/6** (SECURITY.md). zarf.yaml at `deploy/zarf.yaml`.
- **Zarf metadata** (`deploy/zarf.yaml`): kind `ZarfPackageConfig`, name `sentra`, version `1.0.0-alpha`, arch `amd64`, component `sentra-runtime`, image `ghcr.io/szl-holdings/sentra:v1.0.0-alpha`, manifests: sentra-namespace/sentra-deployment/sentra-service.

### 2.5 rosie — uds-v0.3.0 ⚠️ PARTIAL (sha256 only — P0 unsigned)
- **Source commit:** `c5fdc90f456f23abfe4d8bedf944d5ca8550422f`
- **Payload source:** HF `SZLHOLDINGS/rosie-source` → `rosie-uds-0.3.0.tar.zst`
- **sha256 expected:** `c4332b7ce6b1c33a83c548235ee173b1cc6e88722fce7a3ad59b589499325251`
- **sha256 actual:** `c4332b7ce6b1c33a83c548235ee173b1cc6e88722fce7a3ad59b589499325251` → **OK**, 29,364 bytes (matches documented)
- **cosign:** ❌ no .sig exists.
- **Unpack:** ✅ (small — src/ + tests/ only). **6 docs: 1/6** (SECURITY.md). **No zarf.yaml or uds-bundle.yaml in tarball.**

### 2.6 uds-mesh — uds-v0.3.0 ⚠️ PARTIAL (sha256 only — P0 unsigned)
- **Source commit:** `3c87c520421fb5d682cfd74e543ecb50affb9c12`
- **Payload source:** HF `SZLHOLDINGS/uds-mesh-source` → `uds-mesh-uds-0.3.0.tar.zst`
- **sha256 expected:** `44727fdcb89027aed39d39e821302c5e60e2bf2d1d3f5504b508e7099b742eb6`
- **sha256 actual:** `44727fdcb89027aed39d39e821302c5e60e2bf2d1d3f5504b508e7099b742eb6` → **OK**, 69,606 bytes (matches documented)
- **cosign:** ❌ no .sig exists.
- **Unpack:** ✅. **6 docs: 2/6** (SECURITY.md + top-level `uds-bundle.yaml`).
- **Zarf/UDS metadata:**
  - Top-level `uds-bundle.yaml`: kind `UDSBundle`, name `szl-mesh`, version `0.1.0`, arch `amd64`, packages `a11oy` + `sentra` + `amaru` (refs `1.0.0-alpha`, repository `ghcr.io/szl-holdings/packages/<x>`). ⚠️ binds only **3 of 5** organs (rosie + vessels not in this bundle file) and version is `0.1.0`, not `0.3.x`.
  - `bundles/v0.3.1/uds-bundle.yaml`: kind `UDSBundle`, name `szl-runtime-layer`, version `0.3.1`, packages `composition-runtime` / `scitt-adapter` / `policy-gate` (a **different** runtime-layer bundle, ghcr.io/szl namespace, Helm charts + expose/metrics).
  - `uds-mesh-pointer-manifest.yaml`: kind `MeshPointerManifest`, version `uds-v0.2.0` (⚠️ still v0.2.0), binds a11oy+amaru+rosie+sentra at immutable v0.2.0 commit SHAs + verified tarball hashes + verifyCmd. This is the air-gap-parity record.

---

## 3. CROSS-CHECKS

- **Dev public key consistency:** the ECDSA P-256 dev key shipped in a11oy/amaru/sentra/rosie v0.2.0 releases is **identical** across all four (SHA-256 of pubkey = `009a3d59616f57e95f6021cdc383bc309fe54bc36d4eae22b70a2b1c6587ed8d`), and matches the "Org Dev Public Key" block embedded in every v0.3.x release body. The key has not rotated.
- **Toolchain proof:** the cosign key-based path is **functional** — verifying the v0.2.0 a11oy artifact (`cosign verify-blob --key a11oy-uds-dev.pub --signature a11oy-uds-0.2.0.tar.zst.sig a11oy-uds-0.2.0.tar.zst`) returns **Verified OK**. Therefore the v0.3.x cosign failures are **purely missing-artifact failures**, not tooling or key failures.
- **zarf package inspect:** the v0.2.0 and v0.3.0 a11oy tarballs are **repo-source archives, not built Zarf packages** — `zarf package inspect` reports `no zarf.yaml at archive root`. A real Zarf package must be produced via `zarf package create` from the nested manifest dir (`artifacts/a11oy-uds/` or `deploy/`) before `zarf package deploy`. This is reflected in the deployment plan (doc 83).
- **zarf dev lint** on `artifacts/a11oy-uds/zarf.yaml` → **exit 0** (schema valid).

---

## 4. P0 / P1 ISSUE LIST

### P0-1 — Five v0.3.x payloads are UNSIGNED (no cosign signature anywhere)
- **Bundles:** a11oy, amaru, sentra, rosie, uds-mesh (vessels is the only signed one).
- **Impact:** Air-gap/UDS verification (`cosign verify-blob`) **cannot pass** for 5 of 6. SHA-256 confirms integrity vs. the published hash, but provides **no authenticity/provenance** — anyone could publish a matching hash. Andrew Greene's whole ask ("running deployment of what you've built") and DU Registry standards expect signed, attested packages.
- **NOT tampering:** all 5 hashes match the release-body values exactly. This is a *missing-signature* gap, not corruption.
- **Founder action (choose one):**
  1. **Re-sign locally with the existing dev key** (no rotation needed — key unchanged): for each of the 5, run `cosign sign-blob --key <org-dev-private-key.pem> <bundle>.tar.zst --output-signature <bundle>.tar.zst.sig`, then `gh release upload <tag> <bundle>.tar.zst <...>.sig <...>.sha256 <name>-uds-dev.pub` from a machine that *can* upload binaries (the Perplexity proxy cannot). The exact commands are pre-baked in each release body.
  2. **Adopt vessels' keyless/Fulcio pattern** for all 5 (preferred for DU): add a `uds-sign-release.yml` GitHub Actions workflow (copy vessels') so future releases sign in-CI with Sigstore + Rekor transparency. This is the DU-native path and produces a public Rekor index per release.
- **Recommendation:** Do **both** — re-sign current 5 with the dev key now (USB-demo unblocker for June 16), and add the keyless workflow so the next cut is fully Fulcio-signed like vessels.

### P0-2 — Payloads are not on GitHub releases (only HF mirror)
- **Bundles:** a11oy, amaru, sentra, rosie, uds-mesh.
- **Impact:** The canonical "download from the GitHub release" verify flow in Andrew's manual breaks for 5 of 6. Operators must know to pull from Hugging Face.
- **Founder action:** Upload the 5 `.tar.zst` (+ new .sig/.sha256/.pub) to their GitHub releases from a binary-upload-capable machine. Until then, the new manual (doc 80) points operators at the HF mirrors as the interim canonical source.

### P1-1 — Tarballs are repo source, not built Zarf packages
- **All 6.** No `zarf.yaml` at the archive root, so `zarf package deploy <tar.zst>` will **not** work directly. Operators must `zarf package create` from the nested manifest dir first. Documented in doc 83 (deployment plan) and INSTALL_ON_UDS.sh.

### P1-2 — Missing/inconsistent provenance docs
- **AUDIT-LOG.md** is absent from all 6 bundles (task expected 6 docs; reality is at best 5/6 in a11oy, 1/6 elsewhere).
- Only **a11oy** carries the full ARCHITECTURE/OPERATOR-QUICKSTART/UDS-BUNDLE doc set + uds-bundle.yaml. amaru/sentra/rosie/vessels ship SECURITY.md only.
- **Founder action:** Backfill ARCHITECTURE.md, AUDIT-LOG.md, OPERATOR-QUICKSTART.md, UDS-BUNDLE.md, uds-bundle.yaml into amaru/sentra/rosie/vessels before Warhacker, mirroring a11oy's `artifacts/<name>-uds/docs/` pattern.

### P1-3 — Version drift inside manifests
- a11oy `zarf.yaml`/`uds-bundle.yaml` say version `0.2.0` inside a v0.3.0 release.
- amaru/sentra `zarf.yaml` say `1.0.0-alpha`.
- uds-mesh top-level `uds-bundle.yaml` (`szl-mesh`) is `0.1.0` and binds only 3 of 5 organs; pointer manifest is still `uds-v0.2.0`.
- **Founder action:** bump manifest `version:` fields to match the release tag and add rosie + vessels to the szl-mesh `uds-bundle.yaml` packages list.

---

## 5. VERIFY COMMANDS (reproducible)

```bash
# vessels (the gold standard — fully signed, keyless):
gh release download uds-v0.3.0 --repo szl-holdings/vessels --dir vessels/
sha256sum -c vessels/vessels-uds-0.3.0.tar.zst.sha256          # OK
cosign verify-blob \
  --certificate-identity-regexp "https://github.com/szl-holdings/vessels/.github/workflows/uds-sign-release.yml.*" \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \
  --bundle vessels/vessels-uds-0.3.0.tar.zst.sigstore.json \
  vessels/vessels-uds-0.3.0.tar.zst                            # Verified OK

# the other 5 (HF mirror; sha256 only until re-signed):
python3 -c "from huggingface_hub import hf_hub_download as d; print(d(repo_id='SZLHOLDINGS/a11oy-source', filename='a11oy-uds-0.3.0.tar.zst', repo_type='dataset'))"
echo "96a301140ef24c886718e91d122ade83b8db26696ec48681b46653cd753410b8  a11oy-uds-0.3.0.tar.zst" | sha256sum -c   # OK
# (repeat with amaru/sentra/rosie/uds-mesh hashes from §2)
```

---
*Verification performed 2026-05-31 in the Perplexity sandbox. GitHub data via authenticated `gh`; payloads via authenticated GitHub releases (vessels) and the public Hugging Face mirrors (the other 5). Release-body hashes and the embedded dev pubkey are the cited source of truth for expected values.*
