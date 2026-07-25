# Overclaim Ledger

**Status: LIVE ledger · evidence labels required · correction state re-probed
2026-07-25**

This ledger distinguishes automated detections from human or agent reports. A
commit title containing “overclaim” is not evidence that CI detected it.

| ID | Claim at issue | Detection | Truth and correction | Current verification | Correction time |
|---|---|---|---|---|---|
| OC-001 | `a11oy.net` reportedly claimed sovereign, self-hosted inference while requests fell back to Hugging Face Router. | **REPORTED**, not CI-detected: platform commit [`297b855`](https://github.com/szl-holdings/platform/commit/297b855a682c543c1f920459d649f0de694fd075) recorded a manual live observation. The associated [Doctrine Overclaim Guard run](https://github.com/szl-holdings/platform/actions/runs/27455147544) succeeded; it did not catch this runtime/marketing mismatch. | The commit reports that a newer deployment would return `sovereign:false` while fallback routing remained active. Code and deployment correction are not inferred from the successful guard. | **UNAVAILABLE**: on 2026-07-25, `GET https://a11oy.net/api/a11oy/code/healthz` returned 404, so the claimed correction cannot currently be reverified through the cited endpoint. | **UNKNOWN** |

## Counter policy

The website counter may include only rows whose detection source is an
automated guard with a linked failing run. Mean time to correction is
`UNKNOWN` until both detection and correction timestamps are evidenced.
