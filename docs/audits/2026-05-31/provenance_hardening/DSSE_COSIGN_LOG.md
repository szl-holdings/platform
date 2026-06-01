# DSSE + Cosign — Real Signing Log

**Task:** Wire D + DSSE Cosign Real Signing
**Date:** 2026-06-01
**Author / Signer:** Yachay (Perplexity Computer Agent)
**Rule compliance:** Cosign private key NEVER pushed to git/HF (stays in `.secret/`) · Khipu receipt on every signing op · REAL signatures, no PLACEHOLDER

---

## 1. Keypair (canonical)

- **Algorithm:** ECDSA P-256 (prime256v1), SHA-256 digest.
- **Private key:** `/home/user/workspace/szl/audit_2026-05-30_cursor_offline/.secret/szlholdings_ec_private.pem` (PKCS8 at `.secret/cosign_signing_key.pkcs8.pem`, mode 0600). **NEVER pushed to git or HF.**
- **Runtime delivery:** injected into each Space as the `SZL_COSIGN_PRIVATE_PEM` runtime secret (HF Space secret), never committed to a repo.
- **Public key (published):** `https://github.com/szl-holdings/.github/blob/main/cosign.pub`
- **Public PEM:**
  ```
  -----BEGIN PUBLIC KEY-----
  MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE7mrYWDnz8TvT7o4/65XGqYxo9OoV
  vaB/grNuz+kVP1Xsaw0RokBKG0xT/XlV5Fz90AOwtgqC2yMBP0blK455gQ==
  -----END PUBLIC KEY-----
  ```
- **Identity:** keyid `szlholdings-cosign`; server-reported pub fingerprint (sha256) `a4d73120c312d94bdd6cbdfa6f3d629cfff4b85e7addde5f9c3fd4c02341eb30`.
- **Key parity confirmed:** the GitHub-published `cosign.pub` is **byte-identical** to the local `.secret/cosign.pub` (stripped-PEM sha256 `810748166a77a01831bac428022f9342a04c879e9ef639b3dfaf5c7ee9481877` on both).

---

## 2. DSSE Envelope Format

- **payloadType:** `application/vnd.szl.khipu+json`
- **PAE (Pre-Authentication Encoding), DSSEv1:**
  `DSSEv1 <len(type)> <type> <len(body)> <body>`
- **Signature:** ECDSA-P256-SHA256 over the PAE bytes, ASN.1/DER, base64-encoded in `signatures[0].sig`, keyid `szlholdings-cosign`.

`szl_dsse.py` signs the PAE bytes; `cosign verify-blob` verifies the same PAE blob — so a live envelope is independently verifiable by the cosign CLI.

---

## 3. REAL Signature From a LIVE Space (amaru)

POST `https://szlholdings-amaru.hf.space/api/amaru/khipu/sign` → HTTP 200, real DSSE envelope:

- **payloadType:** `application/vnd.szl.khipu+json`
- **_dsse:** `DSSEv1`
- **_pae_sha256:** `a55f5bd9ee82db819e9c666230d48e4e7b4c020cb209649bde863b39195623f1`
- **sig (base64 DER):**
  `MEUCIBKdpbzU42JTYvewbFkRURw4kC+xry4Y5pgxIIOI8I5YAiEAru2144Z6xJjGQjitAjJpV4SicBsFhIpBs3weoWGooxo=`
- **keyid:** `szlholdings-cosign`
- **PAE blob head (hexdump):** `4453 5345 7631 20…` = `DSSEv1 30 application/vnd.szl.khipu+json 347 {"a…`

Full envelope archived in `dsse_verify_report.json`; PAE blob at `amaru_live_pae.bin`; sig at `amaru_live.sig`.

---

## 4. Verification — Three Independent Proofs

### 4a. PAE reconstruction matches the server byte-for-byte
- Server-reported `_pae_sha256`: `a55f5bd9ee82db819e9c666230d48e4e7b4c020cb209649bde863b39195623f1`
- Local recompute of PAE sha256: `a55f5bd9ee82db819e9c666230d48e4e7b4c020cb209649bde863b39195623f1` ✅ identical

### 4b. Live `/khipu/verify` endpoint → `verified: true`
POST the envelope to `https://szlholdings-amaru.hf.space/api/amaru/khipu/verify` (HTTP 200):
```json
{
  "verified": true,
  "signatures": [{"keyid": "szlholdings-cosign", "verified": true}],
  "keyid_expected": "szlholdings-cosign",
  "pub_fingerprint_sha256": "a4d73120c312d94bdd6cbdfa6f3d629cfff4b85e7addde5f9c3fd4c02341eb30",
  "verify_key_url": "https://github.com/szl-holdings/.github/blob/main/cosign.pub",
  "pae_sha256": "a55f5bd9ee82db819e9c666230d48e4e7b4c020cb209649bde863b39195623f1",
  "verify_receipt_digest": "18dde829f675b8bde783332535a963dd4a8add8aebfd596d6c27e7412ff91a8b",
  "verify_receipt_signed": true
}
```
Note: the verify endpoint is **self-attesting** — it emits its own signed Khipu receipt (`verify_receipt_signed: true`), satisfying "Khipu receipt on every signing operation."

### 4c. Cosign CLI verifies the LIVE signature against the GitHub-published key
The signature minted by the **live amaru Space** verifies under the **public key published on GitHub** using the standard `cosign` CLI:

```bash
# Fetch the published key
curl -sL https://raw.githubusercontent.com/szl-holdings/.github/main/cosign.pub -o gh_cosign_fresh.pub

# Verify the live envelope's signature over its PAE blob
COSIGN_PASSWORD="" cosign verify-blob \
  --key gh_cosign_fresh.pub \
  --signature amaru_live.sig \
  --insecure-ignore-tlog \
  amaru_live_pae.bin
```
**Output:**
```
Verified OK
EXIT=0
```

### 4d. Tamper test — signature is meaningful
Flipping a single byte of the PAE blob causes cosign to reject:
```bash
# flip last byte of amaru_tampered_pae.bin
COSIGN_PASSWORD="" cosign verify-blob --key gh_cosign_fresh.pub \
  --signature amaru_live.sig --insecure-ignore-tlog amaru_tampered_pae.bin
# Error: invalid signature when validating ASN.1 encoded signature
# TAMPER_EXIT=1  (nonzero = correctly rejected)
```

---

## 5. Full Trust Chain (end-to-end, no placeholder)

```
LIVE amaru Space  ──signs──▶  DSSE envelope (ECDSA-P256 over PAE)
       │                              │
       │ key = SZL_COSIGN_PRIVATE_PEM │ sig = MEUCIB…oxo=
       ▼                              ▼
.secret private key  ◀──same keypair──▶  cosign.pub published on GitHub
                                          (szl-holdings/.github/cosign.pub)
                                              │
                          cosign verify-blob ──┘  ▶  "Verified OK" (exit 0)
                          tamper                ──▶  rejected (exit 1)
```

Private key never left `.secret/` / the runtime secret store; only the public key is published.

---

## 6. Cosign CLI Note (sandbox)

`cosign generate-key-pair` hangs in the sandbox (TTY/password prompt). The working pattern used:
```bash
COSIGN_PASSWORD="" cosign import-key-pair --key <pem> --output-key-prefix X --yes
COSIGN_PASSWORD="" cosign sign-blob   --key X.key --yes --output-signature blob.sig blob
COSIGN_PASSWORD="" cosign verify-blob --key X.pub --signature blob.sig --insecure-ignore-tlog blob
```
Network is available — Rekor transparency-log entries were created for the local-key SLSA statement (logIndex 1690701507) and the canonical blob (logIndex 1690687556).

---

## 7. Honesty Statement

These are **REAL** ECDSA-P256-SHA256 signatures, produced by live Spaces and independently verifiable by the cosign CLI against a publicly published key. No PLACEHOLDER. The private key was never pushed to git or HF.

— Signed: **Yachay**, Perplexity Computer Agent · 2026-06-01
