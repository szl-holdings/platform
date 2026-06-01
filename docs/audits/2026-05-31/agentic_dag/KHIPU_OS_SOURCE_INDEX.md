# KHIPU_OS_SOURCE_INDEX.md — Source files & additive changes

**Signed: Yachay. Co-authored-by: Perplexity Computer Agent.**

All paths are absolute in the shared workspace. The package `khipu_os` pre-existed; all
changes are **ADDITIVE** (new files, or new params/functions on existing files — no
existing symbol removed).

## Library package — `/home/user/workspace/szl_khipu_os/khipu_os/`

| File | State | Bytes | What it provides |
|---|---|---|---|
| `erasure_code.py` | **NEW** | 7393 | Real Reed-Solomon (n,k) erasure over GF(2^8) via `reedsolo`, column-wise systematic (Backblaze/Vandermonde layout). Classes `ReedSolomonErasure(k,m)`, `ErasureBlock`, `shard_map()`. Honest-naming docstring (NOT holographic/quantum). |
| `store.py` | **NEW** | 6916 | `open_store()`, `SQLiteStore` (active, WAL mode, append-only, `move_to_cold`), `LMDBStore` (used only if `lmdb` importable). |
| `dag.py` | **MODIFIED** | 11127 | Added `persist_path` / `store_backend` params to `KhipuDAG.__init__` (durable put in `add_receipt`); added module-level `merkle_proof()` (line 53) and `verify_merkle_proof()` (line 81). |
| `checkpointer.py` | **MODIFIED** | 6022 | Added `_load_ec_signer()` (line 32) for real **ECDSA-P256** DSSE signing over the DSSE PAE (line 87), keyed by `DEFAULT_COSIGN_KEY`; honest `PLACEHOLDER-hmac` fallback when the EC key is absent (never a fake "real" signature). |
| `pruner.py` | **MODIFIED** | 3273 | On archive, calls `store.move_to_cold()` so pruned receipts move to cold storage instead of vanishing. |
| `__init__.py` | **MODIFIED** | 1980 | Exports the new symbols. |
| `_puriq_compat.py` | pre-existing (unchanged) | 12592 | Vendored `OrganAgent`/`KhipuSigner`/`KhipuReceipt` + LOCKED shim. |
| `verifier.py` | pre-existing | 1863 | Random-sample inclusion verification. |
| `linker.py` | pre-existing | 4391 | Receipt chaining. |
| `publisher.py` | pre-existing | 2150 | Publish hook. |
| `tamper_prosecutor.py` | pre-existing | 2280 | Tamper-event recording. |
| `runner.py` | pre-existing | 2781 | Tick orchestration. |

## Tests — `/home/user/workspace/szl_khipu_os/tests/`

| File | State | What it asserts |
|---|---|---|
| `test_agentic_dag_founder.py` | **NEW** | (1) 10k inserts + Merkle inclusion proof verifies; (2) single-block corruption → R-S recover; (3) random-sample verify catches tamper; (4) checkpoint signs cleanly. |

**Full suite: 19 passed (4 founder + 15 existing) — see VERIFY_REPORT.md.**

## Self-driving demo — `/home/user/workspace/szl_khipu_os/`

| File | State | What it does |
|---|---|---|
| `run_self_driving_demo.py` | **NEW** | Real `while True` loop (`MAX_TICKS=12`, env-overridable; production runs unbounded). Each tick self-prunes / self-checkpoints / self-verifies / self-publishes and signs an aggregate tick receipt. Logs one JSON line per tick to stdout + `/tmp/khipu_self_driving.log`. |

## HF Space route module — `/home/user/workspace/szl_khipu_os/a11oy_register/`

| File | State | What it does |
|---|---|---|
| `szl_khipu_os_routes.py` | **NEW** (363 lines) | Self-contained (stdlib-only hard deps) FastAPI router. Vendors a `KhipuOSDag`, runs a background self-driving `_Runner` (12-min cadence), and `register(app, ns="a11oy")` mounts `GET /api/a11oy/v1/khipu-os/{stats,verify}` + `POST .../{checkpoint,archive}`. `reedsolo` is OPTIONAL — reports honestly if absent. |

This same `szl_khipu_os_routes.py` is the file pushed to the Space (see HF_PUSH_LOG.md).

## Lean — `/home/user/workspace/szl/.../puriq/formulas/PuriqFormulaLean.lean`

`MODIFIED` (now 1548 lines). The appended `§AD2` section (`namespace Puriq.AgenticDAG2`)
is detailed in `LEAN_PATCHES.md`. Backup at `/tmp/PuriqFormulaLean.backup.lean`.
