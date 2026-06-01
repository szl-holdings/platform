# GAP_CHECK.md — What is real, what is honestly-stubbed, residual gaps

**Signed: Yachay. Co-authored-by: Perplexity Computer Agent.**

This is the honest ledger demanded by the founder directive ("NO FUCKING AROUND").
No claim here is dressed up beyond what the evidence shows.

## REAL and verified

| Claim | Evidence |
|---|---|
| Self-driving loop is a real `while True` with per-tick stdout/log output | `EVIDENCE_self_driving_12ticks.log` — 12 ticks, `verify_ok:true` every tick |
| Reed-Solomon erasure uses a real library (`reedsolo`) with working encode/decode | `EVIDENCE_reed_solomon_roundtrip.txt` — (10,6), recovers any 4 lost shards, refuses 5, single-shard corruption recovered |
| HF push yields a real commit SHA returned by HfApi, confirmed by `list_repo_commits` | `HF_PUSH_LOG.md` — `b7e2a7a9…` then `8ea4c3a2…` (HEAD) |
| Live endpoints return 200 | `EVIDENCE_live_endpoint_responses.json` — all 4 khipu-os endpoints 200 |
| GREEN routes unaffected | healthz/readyz/live-wires all 200 |
| Append-only Merkle DAG + inclusion proofs | `merkle_proof`/`verify_merkle_proof` in `dag.py`; 10k-insert test passes |
| Durable persistence | `store.py` SQLite (WAL); tick log shows `backend:sqlite` |
| LOCKED v11 numbers preserved | echoed verbatim by `/stats` and `/checkpoint` |
| Tests | 19/19 pass |
| Honest naming enforced | "Reed-Solomon erasure coding (honest naming)" in `/stats`; source + Lean comments explicitly say NOT holographic/NOT quantum |

## Honestly STUBBED / degraded-but-labeled (not hidden)

| Item | Honest status | Why |
|---|---|---|
| In-Space Reed-Solomon | `/stats.erasure_coding.available = false` | `reedsolo` not in the Space Dockerfile pip list. R-S is an archive-side feature; the DAG runs without it. R-S is proven REAL in the library context (`EVIDENCE_reed_solomon_roundtrip.txt`). |
| In-Space checkpoint signature | `sig_kind = "PLACEHOLDER-hmac-sha256 (no EC key wired)"` | The EC cosign key is not shipped to the Space. The envelope is honestly labeled PLACEHOLDER, never a fake "real" signature. Real ECDSA-P256 DSSE signing runs in `checkpointer.py` where the key is present. |
| LMDB persistence | Not active; SQLite fallback used | `lmdb` C-extension build was killed in the sandbox; SQLite is the allowed fallback. |
| Lean `lake build` | NOT completed | Sandbox disk full → Mathlib cannot be fetched. See `LAKE_BUILD_LOG.md`. |
| `dag_reed_solomon_recovery`, `dag_inclusion_proof_correct` | `sorry`-tagged | `SORRY_PURIQ_OPEN[AD2-RS]` / `[25]`. Stated precisely per Zero-Bandaid; math independently exercised by Python tests. |

## Residual gaps & recommendations

1. **Ship `reedsolo` to the Space** — add `"reedsolo>=1.7.0"` to the Dockerfile pip
   install to flip `/stats.erasure_coding.available` to true in-Space. (Held back here to
   keep this push minimal/additive after the concurrent-edit churn.)
2. **Wire the EC cosign key into the Space** (as a HF Space secret, not committed) to
   replace the PLACEHOLDER signature with real ECDSA-P256 DSSE in-Space.
3. **Concurrent-edit hazard on `serve.py`/`Dockerfile`** — other agents repeatedly
   overwrite these (`HF_PUSH_LOG.md` Commit 2; cf. another agent's `c4bb25ed` re-apply).
   The registration may be overwritten again. Durable fix: coordinate serve.py ownership
   or register from a file no other agent edits.
4. **Lean green check** — run `lake exe cache get && lake build` on a host with several GB
   free disk to compile `§AD2` against Mathlib v4.13.0.

## Honesty statement

Reed-Solomon is classical algebraic erasure coding
([Reed & Solomon, J. SIAM 8(2):300–304, 1960](https://doi.org/10.1137/0108018)) — the same
math as RAID-6, Ceph, and Backblaze. It is **not** "holographic" and **not** "quantum"
error correction. Where a feature is not active in a given context (in-Space R-S, in-Space
EC signing, LMDB, Lean build), the system says so plainly rather than faking success.
