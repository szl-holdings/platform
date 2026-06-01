# DOCTRINE.md — Agentic Khipu DAG (KHIPU-OS)

**SZL Holdings · Doctrine v11 LOCKED preserved · ADDITIVE build**
**Signed: Yachay. Co-authored-by: Perplexity Computer Agent.**
**Founder directive: 2026-06-01 04:40 EDT — "Make the Khipu DAG agentic. Finish my recommendations. Stick to what works."**

---

## 1. What this build is (honest scope)

The Khipu DAG is now **agentic**: a self-driving, append-only Merkle receipt log that
prunes, checkpoints, verifies, and signs itself on a fixed cadence, persists durably
to disk, and exposes live HTTP endpoints on the `SZLHOLDINGS/a11oy` Hugging Face Space.

This is built on **classical, well-understood mechanisms only** — no pseudo-physics:

| Mechanism | Honest name | What it actually is |
|---|---|---|
| Tamper-evidence | **Merkle hash tree** (SHA3-256) | Standard append-only log + inclusion proofs |
| Durability against shard loss | **Reed-Solomon (n,k) erasure coding** | Classical algebraic coding (Reed & Solomon 1960); same math as RAID-6, Ceph, Backblaze |
| Checkpoint authenticity | **DSSE envelope + ECDSA-P256 (Cosign)** | In-toto DSSE; honest `PLACEHOLDER-hmac` label when no EC key is wired |
| Persistence | **SQLite (WAL)** | LMDB attempted; SQLite is the active, allowed fallback |

### HONEST NAMING (Zero-Bandaid Law) — enforced everywhere
Reed-Solomon is **NOT** "holographic error correction" and **NOT** "quantum error
correction." It is classical erasure coding over GF(2^8). This wording is asserted in
the source docstrings, the Lean comments, and the live `/stats` endpoint payload
(`"kind": "Reed-Solomon erasure coding (honest naming)"`). Reference:
[Reed & Solomon, "Polynomial Codes over Certain Finite Fields", J. SIAM 8(2):300–304 (1960)](https://doi.org/10.1137/0108018).

## 2. Doctrine v11 LOCKED numbers — PRESERVED (not modified)

These values are echoed verbatim by the live endpoints and were never changed:

| Key | LOCKED value |
|---|---|
| declarations | 749 |
| unique_axioms | 14 |
| tracked_sorries | 163 |
| yuyay_axes | 13 |
| replay_hash | `bacf54434f1a3bf2d758b27a62d5fd580ca4c8d3b180693573eeebcaea631fc5` |
| A2 | IsHomogeneous |
| A4 | IsBounded |
| slsa | L1 |
| lambda_uniqueness | Conjecture 1 |
| hukulla_core_tripwires | 10 |

Confirmed live in `EVIDENCE_live_endpoint_responses.json` (`/stats.locked` and
`/checkpoint.envelope.payload.locked` blocks both carry these exact values).

## 3. Hard rules honored

- **Founder-token HfApi** used for all `SZLHOLDINGS/a11oy` writes (NOT the betterwithage
  connector). Token whoami: user `betterwithage`, org `SZLHOLDINGS`, role `write`.
- **ADDITIVE only.** No existing route, theorem, or LOCKED number removed or changed.
  IP-HOLD `a11oy#57` untouched.
- **Signed as Yachay**; commit trailers carry `Co-authored-by: Perplexity Computer Agent`.
- **Open-source deps only**: `reedsolo` (MIT), `cryptography` (Apache-2.0/BSD), stdlib
  `sqlite3`/`hashlib`.
- **Honest stop on non-auth failure**: the Lean `lake build` could not complete because
  the sandbox is out of disk (Mathlib cache cannot be fetched). Documented honestly in
  `LAKE_BUILD_LOG.md`; not faked.

## 4. Deliverables in this directory

- `DOCTRINE.md` (this file)
- `KHIPU_OS_SOURCE_INDEX.md` — every source file, additive changes, line counts
- `HF_PUSH_LOG.md` — commit SHAs + `list_repo_commits` confirmation
- `LEAN_PATCHES.md` — the §AD2 theorems appended to `PuriqFormulaLean.lean`
- `LAKE_BUILD_LOG.md` — honest build-failure record (disk exhaustion)
- `VERIFY_REPORT.md` — live endpoint 200s, GREEN regression, tests, R-S proof, tick log
- `GAP_CHECK.md` — what is real, what is honestly-stubbed, residual gaps
- `EVIDENCE_*` — raw captured artifacts (tick log, R-S output, endpoint JSON, proof script)
