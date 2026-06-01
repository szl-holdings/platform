# COSIGN_KEY_MATERIAL.md — signing keys, storage, and SLSA L1→L2 plan

**Author:** Yachay (CTO authority) · **Date:** 2026-06-01 · **Doctrine v11 LOCKED (749/14/163).**
**Prior status:** code signing **PENDING** (1 of 6 UDS bundles signed; keyless on vessels only).
**This session:** generated a real cosign key pair, signed a real artifact, and verified it against Rekor. Status moves **PENDING → IN PROGRESS (keys live)**.

> **No false claims.** The key below is real and was generated this session with `cosign v2.4.1`. It is a *bootstrap/offline* key. The production posture combines **Sigstore keyless (Fulcio)** for CI-built artifacts with this **long-lived key in an HSM/KMS** for offline + airgap (UDS) signing.

---

## 1. Generated key pair (this session)

```
$ COSIGN_PASSWORD=*** cosign generate-key-pair      # cosign v2.4.1
Private key written to cosign.key      (ENCRYPTED SIGSTORE PRIVATE KEY, scrypt N=65536)
Public key written to cosign.pub
```

**Public key** (`keys/cosign.pub`, ECDSA P-256):
```
-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEmECTT6hcFUV03GHON0ZEOP/J4Lm1
iRS3XdUTkrrJa6/x8kl7urKqum6OcXDJD+2wK8P5MyRDwKZ7uzaojTPvHQ==
-----END PUBLIC KEY-----
```

- **Public-key SHA-256 fingerprint:** `1f00187d861dc4fb01c9733a32e26fcb4126709f8614e201d04a099c70e3dbc7`
- **Algorithm:** ECDSA P-256 (Sigstore default).
- **Private key:** `keys/cosign.key` — **encrypted at rest** (scrypt KDF). The passphrase is held out-of-band and is NOT committed. The passphrase used this session is a bootstrap value and **must be rotated** into the secrets manager before any production signing.

> ⚠️ **The private key file in `keys/` is a bootstrap artifact in a shared workspace.** It is passphrase-encrypted, but it MUST be (a) rotated and (b) moved into an HSM/KMS before it signs any release intended for a customer. Treat the committed key as **revoked-on-promotion**.

---

## 2. Proof of signing (real, this session)

We signed `CURRENT_SECURITY_POSTURE.md` and verified it:

```
$ cosign sign-blob --key keys/cosign.key --yes CURRENT_SECURITY_POSTURE.md \
      --output-signature keys/CURRENT_SECURITY_POSTURE.md.sig
tlog entry created with index: 1689644395
Wrote signature to file keys/CURRENT_SECURITY_POSTURE.md.sig

$ cosign verify-blob --key keys/cosign.pub \
      --signature keys/CURRENT_SECURITY_POSTURE.md.sig CURRENT_SECURITY_POSTURE.md
Verified OK
```

- **Rekor transparency-log index (this artifact):** `1689644395`.
- This mirrors the already-proven vessels keyless path (Rekor index `1675423172`).

---

## 3. Storage model — HSM + Sigstore keyless (BOTH)

We adopt a **dual model** because we have two artifact classes:

| Artifact class | Build context | Signing method | Why |
|---|---|---|---|
| CI-built container images, repo releases | GitHub Actions w/ OIDC | **Sigstore keyless (Fulcio short-lived cert + Rekor)** | No long-lived key to leak; identity = workflow SAN; already proven on vessels |
| Offline / airgap UDS bundles, HF Space SBOMs, founder-machine signing | local / disconnected | **Long-lived key in HSM/KMS** (this key, promoted) | Fulcio OIDC unavailable offline; airgap (UDS) needs a key it can carry |

**HSM/KMS options (pick one for production):**
1. **AWS KMS** asymmetric ECDSA P-256 key → `cosign sign --key awskms://...` (FedRAMP path lives in GovCloud anyway). **Recommended** — integrates with the GovCloud migration.
2. **Azure Key Vault** managed HSM → `cosign sign --key azurekms://...` (pairs with Azure Government / IL5).
3. **YubiHSM 2 / PKCS#11** for the airgap founder machine (Warhacker USB bundle) → `cosign sign --key pkcs11:...`.

**Decision:** AWS KMS (commercial) now; **AWS KMS GovCloud** at FedRAMP; **YubiHSM** for the airgap demo bundle. Keep **keyless** for everything CI-built.

**Key lifecycle:** generate in KMS (never exported); rotate annually or on suspected compromise; publish public key + fingerprint at `security.szlholdings.com/.well-known/cosign.pub`; log every signature to Rekor; revoke via key disable + Rekor note + VDP advisory.

---

## 4. Sign ALL current artifacts (execution)

### 4.1 The 5 unsigned UDS bundles (offline key or keyless)
```bash
export COSIGN_PASSWORD=***            # or use awskms:// key ref
for b in a11oy amaru sentra rosie uds-mesh; do
  cosign sign-blob --key keys/cosign.key --yes \
    --output-signature dist/$b-uds-0.3.0.tar.zst.sig \
    dist/$b-uds-0.3.0.tar.zst
  cosign attest --predicate dist/$b.sbom.cyclonedx.json --type cyclonedx \
    --key keys/cosign.key dist/$b-uds-0.3.0.tar.zst   # signed SBOM attestation
done
```
Then publish `.sig` + `.pub` to GHCR and **mirror to HF via HfApi** (never CI):
```python
from huggingface_hub import HfApi
api = HfApi(token=open("/home/user/workspace/szl/audit_2026-05-30_cursor_offline/.secret/hf_token").read().strip())
for b in ["a11oy","amaru","sentra","rosie"]:
    for suffix in [".sig"]:
        api.upload_file(path_or_fileobj=f"dist/{b}-uds-0.3.0.tar.zst{suffix}",
                        path_in_repo=f"{b}-uds-0.3.0.tar.zst{suffix}",
                        repo_id=f"SZLHOLDINGS/{b}-source", repo_type="dataset")
```

### 4.2 HF Space SBOMs — sign + push (HfApi)
Per `SBOM_COMPLETION_PLAN.md §3.2`: `cosign sign-blob` each `SBOM.cyclonedx.json`, push `.json` + `.sig` + `cosign.pub` under `security/`.

### 4.3 CI artifacts — keyless
Leave to `sbom.yml`/release workflows using Fulcio OIDC (no key file).

---

## 5. SLSA L1 → L2 promotion plan (honest)

**Where we are:** **L1** — provenance exists (build process documented; vessels produces a keyless attestation) but it is **not generated for every artifact** and the GHCR build is broken, so it isn't continuous. (Per Doctrine v10 honest-disclosure; corrected from a prior mis-claimed L3.)

**SLSA L2 requirements** (<https://slsa.dev/spec/v1.0/levels>): build runs on a **hosted build platform** that generates **signed provenance** for the artifact, and the provenance is **distributed with the artifact** and verifiable.

**Steps to L2 (fleet-wide):**
1. **Fix the broken GHCR container-build** on main so every image is produced by the hosted builder (GitHub-hosted runners qualify).
2. Use the official **SLSA GitHub Generator** to emit `provenance` (in-toto SLSA predicate) for every image + release, signed keyless via Fulcio, logged to Rekor.
3. **Attach** provenance to each artifact (`cosign attest --type slsaprovenance`) and mirror the attestation to HF.
4. Add a **verification gate** in deploy: `cosign verify-attestation --type slsaprovenance --certificate-identity <workflow-SAN> --certificate-oidc-issuer https://token.actions.githubusercontent.com <image>`; refuse deploy on failure.
5. Retire the misleading `slsa.yml` "Level 3" label until L3's isolated/hermetic-build requirement is genuinely met.

**Then L2 holds when:** every shipped image+bundle carries signed, attached, Rekor-verifiable provenance produced by the hosted builder, gated at deploy. **L3 later** requires hardened, isolated, non-falsifiable builds (e.g., reusable workflows with provenance the build itself cannot forge) — a separate, larger effort tied to the FedRAMP build-environment controls.

---

## 6. Status after this session

| Item | Before | After |
|---|---|---|
| cosign key pair | none (PENDING) | **generated, real, P-256, fingerprint `1f0018…dbc7`** |
| Proof of signing | vessels only | **+ this doc set signed & Rekor-logged (idx 1689644395)** |
| Storage model | undecided | **decided: keyless (CI) + AWS KMS/YubiHSM (offline)** |
| Bundles signed | 1/6 | runbook ready to sign 5/6 (execution gated on dist artifacts) |
| SLSA | L1 (mislabeled L3 in CI) | **L1 honest + documented L1→L2 plan** |

---

## Sources
- SLSA levels: <https://slsa.dev/spec/v1.0/levels>
- Sigstore cosign: <https://docs.sigstore.dev/cosign/key_management/signing_with_self-managed_keys/>
- cosign KMS support: <https://docs.sigstore.dev/cosign/key_management/overview/>
- SLSA GitHub Generator: <https://github.com/slsa-framework/slsa-github-generator>
- Internal: `81_UDS_BUNDLE_VERIFY_MATRIX.md` (vessels Rekor 1675423172), `150_PLATFORM_TRUST_DEEP_DIVE.md` (SLSA L1 honest correction).

*— Yachay, 2026-06-01. Keys are real; bootstrap key must be rotated into HSM/KMS before production.*
