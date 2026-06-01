# SZL Holdings UDS Bundle Manual — v0.3.x

**For:** Andrew Greene (Co-Founder, Defense Unicorns) and the UDS engineering team
**From:** SZL Holdings — Lutar, Stephen P. (ORCID 0009-0001-0110-4173)
**Date:** 2026-05-31
**Re:** Option A integration — running deployment of the SZL organs on UDS for Warhacker (San Diego, June 16–19, 2026)

> Andrew (2026-05-22): *"Option A is a great idea to integrate what you've built with Zarf... it'd be awesome to see a running deployment of what you've built!"*

This manual supersedes the v0.1.1 bundle manual. Everything is now at **v0.3.x**. It covers **six** artifacts — the v0.1.1 manual only had three (a11oy, amaru, sentra); this adds **vessels**, **rosie**, and **uds-mesh**.

---

## 0. WHAT CHANGED SINCE v0.1.1

The v0.1.1 manual (2026-05-26) described three first-cut signed Zarf payloads. We are now **three minor versions ahead**, with two new organs and a mesh capstone. Summary of the leap:

| Dimension | v0.1.1 (the manual you saw) | v0.3.x (this manual) |
|---|---|---|
| **Organs covered** | a11oy, amaru, sentra (3) | a11oy, amaru, sentra, **vessels, rosie, uds-mesh** (6) |
| **Anchor-formula gates** | not present | **5 gates** (Liu Hui π, Madhava bound, false position, summation invariant, adversarial robustness) wired across all 7 layers (L1 Lean → L7 forecast) |
| **Signing** | ed25519/dev-key, manual | **vessels: keyless cosign / Sigstore Fulcio in CI** (Rekor transparency). Others: dev-key cosign (re-sign in progress — see §6) |
| **DSSE** | basic | **DSSE signature/payload body separation per spec v1.0** |
| **uds-mesh** | did not exist | **pointer manifest + UDSBundle** binding the organs at immutable commit SHAs |
| **Docs surface** | minimal | a11oy ships ARCHITECTURE / OPERATOR-QUICKSTART / UDS-BUNDLE / SECURITY + uds-bundle.yaml |
| **CI lanes** | partial | CodeQL, Scorecard, SLSA, SBOM (SPDX + CycloneDX), DCO, fuzz on the mature repos |

**Version progression per organ:** uds-v0.1.0 → uds-v0.1.1 → uds-v0.2.0 → uds-v0.3.0 (a11oy/rosie/vessels/uds-mesh) → uds-v0.3.1 (amaru/sentra patch cuts).

**Honest status note for Andrew (no security theater):**
- **vessels uds-v0.3.0 is fully signed and verifies cleanly** — keyless cosign, Fulcio cert, Rekor index `1675423172`. This is the reference pattern.
- The other five v0.3.x payloads currently have **sha256 integrity only** — the signature artifacts were not uploaded yet because the build proxy could not push binaries to GitHub. We are re-signing them with the same dev key and rolling vessels' keyless CI workflow to all repos. See §6. We're flagging this proactively rather than shipping a fake "verified" claim.

---

## 1. THE SIX ARTIFACTS AT A GLANCE

| Organ | What it is | Latest tag | Source commit | Payload location | Signed? |
|---|---|---|---|---|---|
| **a11oy** | Brand-orchestration kernel — Fisher manifold, Bohr complementarity, Kochen-Specker 18-vector witness, POVM verdicts, 5 anchor-formula policy gates | `uds-v0.3.0` | `663e7c3` | HF `SZLHOLDINGS/a11oy-source` | dev-key (re-sign pending) |
| **amaru** | Andean-ouroboros replay-bound sync engine — append-only hash-chained delta-log | `uds-v0.3.1` | `365474c` (payload @ v0.3.0) | HF `SZLHOLDINGS/amaru-source` | dev-key (re-sign pending) |
| **sentra** | Cyber Resilience Command — financial-exposure model, posture API, incident command | `uds-v0.3.1` | `fd35f8a` (payload @ v0.3.0) | HF `SZLHOLDINGS/sentra-source` | dev-key (re-sign pending) |
| **vessels** | Maritime intelligence — OFAC/UN/EU sanctions screening, dark-vessel (AIS gap+spoof) detection, ownership graph, voyage analytics; every alert DSSE-receipted | `uds-v0.3.0` | `bb8202c` | **GitHub release (4-asset)** | ✅ **keyless / Fulcio** |
| **rosie** | Governed decision fabric — mandatory witnesses on every decision (ROSIE-V1), receipt observability, receipt-replayable demo | `uds-v0.3.0` | `c5fdc90` | HF `SZLHOLDINGS/rosie-source` | dev-key (re-sign pending) |
| **uds-mesh** | Mesh capstone — pointer manifest + UDSBundle binding the organs at immutable SHAs; air-gap-parity record | `uds-v0.3.0` | `3c87c52` | HF `SZLHOLDINGS/uds-mesh-source` | dev-key (re-sign pending) |

---

## 2. PAYLOAD COORDINATES (URLs + sizes + sha256 + Rekor)

### 2.1 a11oy — uds-v0.3.0
- **Tarball:** HF `https://huggingface.co/datasets/SZLHOLDINGS/a11oy-source` → `a11oy-uds-0.3.0.tar.zst`
- **GitHub release:** https://github.com/szl-holdings/a11oy/releases/tag/uds-v0.3.0 (SBOMs only; payload pending re-upload)
- **size:** 10,539,040 bytes
- **sha256:** `96a301140ef24c886718e91d122ade83b8db26696ec48681b46653cd753410b8`
- **commit:** `663e7c3eb11ca5e299f04f7619e926f962620b91`
- **Rekor index:** _pending re-sign (no signature yet)_

### 2.2 amaru — uds-v0.3.1 (payload built at v0.3.0)
- **Tarball:** HF `https://huggingface.co/datasets/SZLHOLDINGS/amaru-source` → `amaru-uds-0.3.0.tar.zst`
- **GitHub release:** https://github.com/szl-holdings/amaru/releases/tag/uds-v0.3.1
- **size:** 381,567 bytes
- **sha256:** `84bbbb362955b5a8330b04f7b73eb7ad02fdc235f23ef71cfa7467b77d1a261c`
- **commit (v0.3.1):** `365474c629a18e1dcf944398cb442953c7d89717`
- **v0.3.1 delta:** CodeQL green pass (postMessage origin check PR #77; 20 unused-variable notes cleared PR #78); branch protection hardened. No payload change vs v0.3.0.
- **Rekor index:** _pending re-sign_

### 2.3 sentra — uds-v0.3.1 (payload built at v0.3.0)
- **Tarball:** HF `https://huggingface.co/datasets/SZLHOLDINGS/sentra-source` → `sentra-uds-0.3.0.tar.zst`
- **GitHub release:** https://github.com/szl-holdings/sentra/releases/tag/uds-v0.3.1
- **size:** 756,132 bytes
- **sha256:** `659a2fb6aa1ea4977c43dd02d485e42369c8b51520d81df5d220f5c58421c2db`
- **commit (v0.3.1):** `fd35f8aaff0b09a0467bebc0182aef36f713b9a8`
- **v0.3.1 delta:** vite ≥6.4.2, esbuild ≥0.25.0 (Dependabot #1, #2). No API change.
- **Rekor index:** _pending re-sign_

### 2.4 vessels — uds-v0.3.0 ✅ FULLY SIGNED
- **Tarball:** GitHub release asset — https://github.com/szl-holdings/vessels/releases/download/uds-v0.3.0/vessels-uds-0.3.0.tar.zst
- **Companion assets:**
  - `.sha256` — https://github.com/szl-holdings/vessels/releases/download/uds-v0.3.0/vessels-uds-0.3.0.tar.zst.sha256
  - `.sig` — https://github.com/szl-holdings/vessels/releases/download/uds-v0.3.0/vessels-uds-0.3.0.tar.zst.sig
  - `.sigstore.json` (Fulcio cert + Rekor bundle) — https://github.com/szl-holdings/vessels/releases/download/uds-v0.3.0/vessels-uds-0.3.0.tar.zst.sigstore.json
  - `vessels-uds-dev.pub` (keyless verify instructions) — https://github.com/szl-holdings/vessels/releases/download/uds-v0.3.0/vessels-uds-dev.pub
- **size:** 512,102 bytes
- **sha256:** `a3b1a8c26977ed48270895d10123b3124773517e3155f3ed3287dc7e1d6467b3`
- **commit:** `bb8202c7aa94804d806d8e1a68d36a6f7f7773a2`
- **Signing identity (Fulcio cert SAN):** `https://github.com/szl-holdings/vessels/.github/workflows/uds-sign-release.yml@refs/heads/main`
- **OIDC issuer:** `https://token.actions.githubusercontent.com`
- **Rekor transparency log index:** `1675423172` (integratedTime 1780149076 = 2026-05-30T13:51:16Z)

### 2.5 rosie — uds-v0.3.0
- **Tarball:** HF `https://huggingface.co/datasets/SZLHOLDINGS/rosie-source` → `rosie-uds-0.3.0.tar.zst`
- **GitHub release:** https://github.com/szl-holdings/rosie/releases/tag/uds-v0.3.0
- **size:** 29,364 bytes
- **sha256:** `c4332b7ce6b1c33a83c548235ee173b1cc6e88722fce7a3ad59b589499325251`
- **commit:** `c5fdc90f456f23abfe4d8bedf944d5ca8550422f`
- **Rekor index:** _pending re-sign_

### 2.6 uds-mesh — uds-v0.3.0
- **Tarball:** HF `https://huggingface.co/datasets/SZLHOLDINGS/uds-mesh-source` → `uds-mesh-uds-0.3.0.tar.zst`
- **GitHub release:** https://github.com/szl-holdings/uds-mesh/releases/tag/uds-v0.3.0
- **size:** 69,606 bytes
- **sha256:** `44727fdcb89027aed39d39e821302c5e60e2bf2d1d3f5504b508e7099b742eb6`
- **commit:** `3c87c520421fb5d682cfd74e543ecb50affb9c12`
- **Contents:** top-level `uds-bundle.yaml` (UDSBundle `szl-mesh` v0.1.0 binding a11oy+sentra+amaru), `bundles/v0.3.1/uds-bundle.yaml` (UDSBundle `szl-runtime-layer` v0.3.1), `uds-mesh-pointer-manifest.yaml` (binds organs at immutable SHAs), `extended-attestations.jsonl`, `formula_receipts.py`.
- **Rekor index:** _pending re-sign_

---

## 3. ORG DEV PUBLIC KEY (dev-channel cosign)

The dev-channel cosign key is the **same across all organ repos** and is embedded verbatim in every v0.3.x release body:

```
-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEIcKzhZ7zCKrBDcmdaBGUOpNyJvRj
4wkQ8nftahptyPXzH613e3mYyhtkH1mxFM0fNCra17wkBvorFNPuolNZRQ==
-----END PUBLIC KEY-----
```
- **SHA-256 of pubkey:** `009a3d59616f57e95f6021cdc383bc309fe54bc36d4eae22b70a2b1c6587ed8d`
- This is an ECDSA P-256 key. It has **not rotated** since v0.2.0 (verified — the v0.2.0 a11oy artifact still verifies against it with `cosign verify-blob --key`).

**vessels does NOT use this key** — it uses keyless Sigstore (no stored private key). Verify it with the certificate-identity flow (§4.2), not `--key`.

---

## 4. HOW TO VERIFY

### 4.1 sha256 (works now for all 6)
```bash
# vessels (from GitHub):
sha256sum -c vessels-uds-0.3.0.tar.zst.sha256

# a11oy/amaru/sentra/rosie/uds-mesh (from HF) — manual compare:
echo "96a301140ef24c886718e91d122ade83b8db26696ec48681b46653cd753410b8  a11oy-uds-0.3.0.tar.zst" | sha256sum -c
echo "84bbbb362955b5a8330b04f7b73eb7ad02fdc235f23ef71cfa7467b77d1a261c  amaru-uds-0.3.0.tar.zst" | sha256sum -c
echo "659a2fb6aa1ea4977c43dd02d485e42369c8b51520d81df5d220f5c58421c2db  sentra-uds-0.3.0.tar.zst" | sha256sum -c
echo "c4332b7ce6b1c33a83c548235ee173b1cc6e88722fce7a3ad59b589499325251  rosie-uds-0.3.0.tar.zst" | sha256sum -c
echo "44727fdcb89027aed39d39e821302c5e60e2bf2d1d3f5504b508e7099b742eb6  uds-mesh-uds-0.3.0.tar.zst" | sha256sum -c
```

### 4.2 cosign — vessels (keyless / Fulcio — works now)
```bash
cosign verify-blob \
  --certificate-identity-regexp "https://github.com/szl-holdings/vessels/.github/workflows/uds-sign-release.yml.*" \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \
  --bundle vessels-uds-0.3.0.tar.zst.sigstore.json \
  vessels-uds-0.3.0.tar.zst
# Expected: Verified OK
```

### 4.3 cosign — the other 5 (dev-key — once signatures are re-uploaded, §6)
```bash
cosign verify-blob \
  --key a11oy-uds-dev.pub \
  --signature a11oy-uds-0.3.0.tar.zst.sig \
  a11oy-uds-0.3.0.tar.zst
# Expected: Verified OK   (today: signature file not yet published — see §6)
```

---

## 5. DEPLOY TO UDS (Zarf)

> Important: the release tarballs are **repo-source archives**, not pre-built Zarf packages. The `zarf.yaml` lives **inside** the tree (`artifacts/a11oy-uds/zarf.yaml` for a11oy; `deploy/zarf.yaml` for amaru/sentra). You must `zarf package create` from that dir, then `zarf package deploy`.

### 5.1 Zarf package metadata per organ
| Organ | zarf.yaml path | Zarf name | version | arch | key components | images |
|---|---|---|---|---|---|---|
| a11oy | `artifacts/a11oy-uds/zarf.yaml` | a11oy-uds | 0.2.0* | multi | core, connection, provenance, shared, attestations, docs | none (file-drop /opt/a11oy) |
| amaru | `deploy/zarf.yaml` | amaru | 1.0.0-alpha | amd64 | amaru-runtime | ghcr.io/szl-holdings/amaru:v1.0.0-alpha |
| sentra | `deploy/zarf.yaml` | sentra | 1.0.0-alpha | amd64 | sentra-runtime | ghcr.io/szl-holdings/sentra:v1.0.0-alpha |
| vessels | (planned `uds-package-vessels/zarf.yaml`) | vessels | per docs | amd64 | vessels web (nginx:alpine:8080) + szl-receipts | ghcr.io/szl-holdings/vessels (Phase 2) |
| rosie | not yet committed | — | — | — | — | — |
| uds-mesh | `uds-bundle.yaml` (UDSBundle, not Zarf) | szl-mesh | 0.1.0* | amd64 | binds a11oy+sentra+amaru | (via component refs) |

\* version drift — manifest version lags the release tag; bump pending (see verify matrix doc 81, P1-3).

### 5.2 Deploy sequence (per organ)
```bash
# 1. unpack the source archive
zstd -d a11oy-uds-0.3.0.tar.zst -o a11oy-uds-0.3.0.tar && tar -xf a11oy-uds-0.3.0.tar
# 2. build the Zarf package from the nested manifest dir
cd a11oy-*/artifacts/a11oy-uds
zarf package create . --confirm
# 3. deploy onto the UDS cluster
zarf package deploy zarf-package-a11oy-uds-*.tar.zst --confirm
```
For amaru/sentra, the manifest dir is `deploy/`. For the mesh: `uds-cli bundle create .` then `uds-cli bundle deploy uds-bundle-szl-mesh-amd64-*.tar.zst --confirm`.

Full cluster bring-up + demo runbook is in **doc 83 — UDS_RUNNING_DEPLOYMENT_PLAN**.

---

## 6. OPEN ITEMS BEFORE WARHACKER (founder action)

1. **Re-sign the 5 unsigned payloads** (a11oy, amaru, sentra, rosie, uds-mesh) from a machine that can upload binaries to GitHub. Commands are pre-baked in each release body; the dev key is unchanged. *(Unblocks cosign verify for the USB demo.)*
2. **Roll vessels' keyless workflow** (`uds-sign-release.yml`) to all 5 repos so the next cut is Fulcio-signed with a public Rekor index (DU-native, matches what Andrew expects).
3. **Re-upload the 5 payloads to their GitHub releases** so the canonical download path is GitHub, not just the HF mirror.
4. **Backfill provenance docs** (ARCHITECTURE/AUDIT-LOG/OPERATOR-QUICKSTART/UDS-BUNDLE/uds-bundle.yaml) into amaru/sentra/rosie/vessels to match a11oy.
5. **Bump manifest versions** and add rosie + vessels to the szl-mesh `uds-bundle.yaml`.

---

## 7. WHAT THIS IS NOT (per Doctrine v6)
- Not endorsed by Defense Unicorns as their product — collaboration endorsement only.
- Not a formal trademark non-objection (counsel review is post-Warhacker).
- SZL's **UDS = Unified Decision Span**, distinct from Defense Unicorns' **UDS = Unicorn Delivery Service**.

---

*Sources (verified 2026-05-31): GitHub releases for szl-holdings/{a11oy,amaru,sentra,vessels,rosie,uds-mesh} via authenticated `gh`; release-body hashes/keys/Rekor data; Hugging Face mirrors `SZLHOLDINGS/{a11oy,amaru,sentra,rosie,uds-mesh}-source`; cosign keyless verification of vessels (Verified OK, Rekor index 1675423172). Andrew Greene context: 2026-05-22 Option-A endorsement reply.*
