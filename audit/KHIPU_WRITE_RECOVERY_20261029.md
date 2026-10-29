# Khipu write/recovery consistency proof — 2026-10-29

**Workcell:** task-6/khipu-recovery-20261029  
**Evidence:** MEASURED local source/package tests; source candidate only.  
**Base commit:** `e1a04aa20ecad715921dec6aa4a0c29f6c90d985`  
**Base root tree:** `b1bfc0a007ab3e51267ba4b89dcbbb49d7e3e579`

## Plan and change

Reproduce append accepting receipt shapes that durable recovery rejects; share
shape validation before ID allocation, signing, persistence or graph mutation;
verify rejected-write state and valid restart behavior without changing signed
bytes or weakening recovery.

Changed paths:

- `packages/khipu-os/khipu_os/dag.py`: shared organ/action, payload and parent
  validation on append and recovery.
- `packages/khipu-os/tests/test_write_recovery_contract.py`: regression coverage.
- `packages/khipu-os/README.md`: append/recovery contract and its limits.
- `docs/operations/known-gaps.md`: narrow candidate result and remaining checks.
- `audit/KHIPU_WRITE_RECOVERY_20261029.md`: this self-contained proof.

Only `parents=None` normalizes to an empty list; `[]` remains a valid root.
Malformed shapes now fail before consuming an ID, calling the signer, writing
the store or changing graph state. Numeric handling, serialization, signature
verification, missing-parent/cycle rejection and restart counters are unchanged.

## Measured validation

Twenty-four fetched source/context files matched their pinned Git blob IDs
before production source edits. Tests used Python 3.12.14, pytest 9.2.0 and
reedsolo 1.7.0 on Windows, through the actual public `khipu_os` import and
SQLite backend, with no dependency or module shims. Only the repository's
synthetic test signing keys were used offline.

Commands ran from the source bundle with `PYTHONPATH=packages/khipu-os` and
`PYTHONDONTWRITEBYTECODE=1`:

```text
python -B -m pytest -p no:cacheprovider packages/khipu-os/tests --basetemp=audit/khipu-recovery/pytest-baseline -q --tb=short
python -B -m pytest -p no:cacheprovider packages/khipu-os/tests --basetemp=audit/khipu-recovery/pytest-candidate -q --tb=short
```

- Baseline: **50 failed, 62 passed**, exit **1**, 3.65 seconds.
- Candidate: **112 passed**, exit **0**, 2.17 seconds.

Coverage includes duplicate/non-list/empty/non-string parent inputs, invalid
organ/action and non-object payloads; no ID/sign/store calls or counter/graph/
stored-byte changes after rejection; malformed recovery records; cold-parent
links; parent order and list copying; restart counter continuation; numeric
fidelity; and existing fresh-process SQLite restart tests.

The fixed valid receipt blob remained byte-identical before/after, SHA-256:
`7b30d5c4d9bc1e4fbbda5f98a274de81d8d12d452b0bf7a0263e02def95f26df`.

Independent read-only review found no blocking issue in the validator, append
ordering, recovery semantics or regression coverage. That reviewer inspected
source and did not independently rerun tests. Parent source review also found
the helper and append ordering sound.

## Limits and safety

Baseline/post full-monorepo `pnpm typecheck`, full-monorepo `pnpm test` and
exact-head hosted CI are **NOT RUN**: the selected bundle lacks the complete
workspace/dependencies. No claim that those checks pass or are unchanged is
made. LMDB and real `szl_puriq_os` were unavailable; testing used the repository
PURIQ fallback. Routes/UI were unchanged, so route checks/screenshots do not
apply. Arbitrary nested-payload serialization and backend-write transactionality
are outside this shape-validation repair.

No trust gate, serializer, signing algorithm, locked doctrine, readiness label,
deployment or release status changed. No credentials, real signing authority,
GitHub writes, service jobs or model jobs were used. Detailed local test logs,
source identities and original snapshots are retained separately; this packet
requires none of them to be published. Only inactive synthetic pytest fixtures
were removed after preserving reproducible source and test evidence.
