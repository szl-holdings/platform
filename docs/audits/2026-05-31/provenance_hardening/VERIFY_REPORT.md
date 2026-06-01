# Phase 4 — Verify Report

**Task:** Wire D + DSSE Cosign Real Signing
**Date:** 2026-06-01
**Author / Signer:** Yachay (Perplexity Computer Agent)
**Verdict:** ALL 5 Spaces GREEN · Cross-Space trace continuity PROVEN · DSSE signatures REAL and cosign-verifiable · SLSA **L2** (honest, NOT L3)

---

## 1. All-Space GREEN Sweep (verified 2026-06-01 ~09:3x UTC)

| Space | `/healthz` | `/wires/D` | status | `signing_available` | `slsa` | `pub_fp` (sha256) |
| ----- | ---------- | ---------- | ------ | ------------------- | ------ | ----------------- |
| a11oy | 200 | 200 | **LIVE** | **true** | L2 | a4d73120… |
| amaru | 200 | 200 | **LIVE** | **true** | L2 | a4d73120… |
| sentra | 200 | 200 | **LIVE** | **true** | L2 | a4d73120… |
| killinchu | 200 | 200 | **LIVE** | **true** | L2 | a4d73120… |
| rosie | 200 | 200 | **LIVE** | **true** | L2 | a4d73120… |

Every Space echoes a `traceparent` on the response and reports the identical public-key fingerprint `a4d73120c312d94bdd6cbdfa6f3d629cfff4b85e7addde5f9c3fd4c02341eb30`. Full transcript: `final_sweep_report.json`.

**a11oy** was the last gap (503 — Node-proxy fall-through because the per-file Dockerfile never `COPY`ed the provenance modules and lacked `cryptography`). Fixed ADDITIVELY in commit `057c23e9`; after rebuild a11oy is fully LIVE with real signing (sign→verify roundtrip `verified: true`, `verify_receipt_signed: true`).

---

## 2. Cross-Space Traceparent Continuity — PROVEN

- **Injected `traceparent`:** `00-261dfbe40f7841f78ef2ff7163011ecd-22c3dfaf9c354104-01`
- **amaru `/khipu/sign`** (HTTP 200): minted child span `f5dbdfcd00b70316` from inbound parent `22c3dfaf9c354104`; embedded `trace_id` into the signed DSSE payload.
- **sentra `/wires/D`** (HTTP 200, same `traceparent`): echoed the same trace-id, recorded `inbound_parent: 22c3dfaf9c354104`, minted child span `95e5fbdbe919aaf9`, set `tracestate: szl=95e5fbdbe919aaf9`.
- **Result:** trace-id `261dfbe4…011ecd` survives the amaru → sentra hop with a correct parent/child span chain. Transcript: `cross_space_trace_report.json`.

---

## 3. DSSE Validate — `verified: true`

### 3a. Live `/khipu/verify` (amaru) → `verified: true`
```json
{"verified": true,
 "signatures": [{"keyid": "szlholdings-cosign", "verified": true}],
 "pae_sha256": "a55f5bd9ee82db819e9c666230d48e4e7b4c020cb209649bde863b39195623f1",
 "verify_receipt_signed": true}
```
The verify endpoint is **self-attesting** (emits its own signed Khipu receipt) — satisfies "Khipu receipt on every signing operation."

### 3b. a11oy sign → verify roundtrip → `verified: true`
POST `/api/a11oy/khipu/sign` → real DSSE envelope → POST `/api/a11oy/khipu/verify` → `verified: true`, `verify_receipt_signed: true` (HTTP 200).

---

## 4. Cross-Tool Cosign Verification — `Verified OK`

Signatures minted by **live Spaces** verify under the **GitHub-published `cosign.pub`** via the standard cosign CLI:

**amaru live sig:**
```bash
COSIGN_PASSWORD="" cosign verify-blob --key gh_cosign_fresh.pub \
  --signature amaru_live.sig --insecure-ignore-tlog amaru_live_pae.bin
# Verified OK   (exit 0)
```
- sig: `MEUCIBKdpbzU42JTYvewbFkRURw4kC+xry4Y5pgxIIOI8I5YAiEAru2144Z6xJjGQjitAjJpV4SicBsFhIpBs3weoWGooxo=`

**a11oy live sig:**
```bash
COSIGN_PASSWORD="" cosign verify-blob --key gh_cosign_fresh.pub \
  --signature a11oy_xtool.sig --insecure-ignore-tlog a11oy_xtool_pae.bin
# Verified OK   (exit 0)
```
- sig: `MEUCIQCezoTXnZdLn+gS/FkrclZq6zeSK7QUELKWnXYaHqBzowIgDF4HU6rk0jeu1lwWkm6O2sJ9XYuVcGKwW0+TYzCmkMs=`
- PAE sha256 server == local: `c0adcefc55a85f4b93dee13772d9dea2891ac72f404fd02f955d54ea971eabc1` ✅

**Tamper test (negative control):** flipping one PAE byte → `Error: invalid signature when validating ASN.1 encoded signature` (exit 1). The signatures genuinely bind to exact bytes.

---

## 5. SLSA L2 Provenance Artifact in GitHub Release — CONFIRMED via `gh api`

- **Release:** `https://github.com/szl-holdings/a11oy/releases/tag/provenance-l2-2026-06-01`
- **Provenance asset (public, HTTP 200):**
  `https://github.com/szl-holdings/a11oy/releases/download/provenance-l2-2026-06-01/a11oy-uds-provenance-l2-2026-06-01.tar.zst.intoto.jsonl`
- `gh api repos/szl-holdings/a11oy/releases/tags/provenance-l2-2026-06-01` → 3 assets, all `state: uploaded` (provenance 11,351 bytes + 2 SBOMs).
- **Decoded bundle** (`application/vnd.dev.sigstore.bundle.v0.3+json`):
  - `predicateType`: `https://slsa.dev/provenance/v1`
  - `buildType`: `https://actions.github.io/buildtypes/workflow/v1`
  - `builder.id`: `https://github.com/szl-holdings/a11oy/.github/workflows/slsa.yml@refs/tags/provenance-l2-2026-06-01`
  - subject digest sha256 `62f57d707bfb23efd4c96f4293b5de0b7d272845505d450db1501f898ccdb6fe`
  - **Rekor logIndex `1690704819`** (transparency log), Fulcio certificate present.

---

## 6. Honest SLSA Assessment

**L2.** Signed provenance (DSSE + Cosign, verifiable against a published key) + real CI-generated SLSA v1.0 provenance bundle with a Rekor transparency entry, on a hosted build platform. **NOT L3** — no uniformly hardened/isolated CI across all artifacts; not claimed. The a11oy CI keyless-OIDC provenance is an L3-trajectory signal but is not used to claim L3.

---

## 7. Return Summary (per FOUNDER DIRECTIVE)

| Demand | Result |
| ------ | ------ |
| (1) cosign sign-blob → real `.sig` | `amaru_live.sig`, `a11oy_xtool.sig` (real DER ECDSA-P256); command + output above |
| (2) DSSE validates via cosign verify-blob | **Verified OK** (exit 0) for both amaru and a11oy live sigs |
| (3) SLSA L2 = real provenance artifact in GH release assets | confirmed via `gh api`; public asset URL in §5; Rekor logIndex 1690704819 |
| (4) keyless OIDC honesty | sandbox cosign keyless prompt avoided via real local keypair (documented); CI provenance IS keyless-OIDC Fulcio/Rekor |
| SLSA level honestly assessed | **L2, NOT L3** |

— Signed: **Yachay**, Perplexity Computer Agent · 2026-06-01
