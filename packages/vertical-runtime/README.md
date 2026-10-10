# SZL vertical runtime

> **Evidence status: MODELED.**

This dependency-free Python package interprets the admitted Packet 6 source
manifests as a loopback-only recommendation service. Generated contracts are
checked for parity by integration tests; they are not dynamically loaded
plugins. The service records decisions and outcomes in a
locally append-guarded SQLite hash chain, evaluates policy without executing any
external action, and refuses every operational-readiness claim because this
package has no independent evidence trust root.

It is source code, not evidence that a production deployment or Hugging Face
Space exists. The `/healthz`, `/readyz`, and `/production-readyz` endpoints keep
liveness, local source readiness, and admitted production readiness separate.
The portable v2 declaration shape is in
`schemas/space_release_manifest.schema.json`. The local
`szl_vertical_runtime.release.validate_release` gate can pass valid
`SOURCE_ONLY` structure and cross-field identity. It always blocks
`PROTECTED_CANDIDATE`, `PUBLIC_DEMO`, `PILOT_READY`, `PRODUCTION_READY`, and
`ROLLED_BACK`; admitting those states requires an external verifier with actual
receipt bytes, authorized signer keys, and independent witness provenance.

The SQLite chain detects inconsistent local records, metadata, and missing
append-only guards. A writer who controls the database can rewrite history and
rebase local metadata, so this is not a WORM store, transparency log, signed
checkpoint, independent witness, or proof of event completeness. `/readyz`
therefore reports `LOCAL_PERSISTENCE_UNVERIFIED`, never durable production.
Local `READY` means the admitted catalog, local chain, and bearer configuration
pass the service's checks. It does not verify evidence bytes, execute formulas,
or qualify any external workflow.

## Run locally

From the repository root with Python 3.11 or newer:

```powershell
$env:PYTHONPATH = "packages/vertical-runtime"
python -m szl_vertical_runtime verify-ledger
python -m szl_vertical_runtime serve --host 127.0.0.1 --port 8766 --auth-token-file C:\secure\szl-vertical-runtime.token
```

The token file must be a regular, non-symlink file containing 32–256 admitted
token characters. It is read into memory and never logged. When
`--auth-token-file` is omitted, read-only endpoints remain available but every
POST route returns `503 AUTH_NOT_CONFIGURED`. With a token configured, mutation
routes require an exact `Authorization: Bearer <token>` header and compare it in
constant time. Receipt and raw ledger-event retrieval use the same protection so
the raw-event endpoint cannot bypass receipt authorization. Loopback binding and
bearer authentication are both mandatory; neither is a production identity
provider.

For a non-networked SAMPLE smoke run from the repository root:

```powershell
$env:PYTHONPATH = "packages/vertical-runtime"
python -B -m szl_vertical_runtime evaluate lyte-services packages/vertical-runtime/examples/lyte-request.json --ledger C:\path\sample-ledger.sqlite3
python -B -m szl_vertical_runtime verify-ledger --ledger C:\path\sample-ledger.sqlite3
```

The example's all-`a` digest is an explicit sample handle, not a hash of admitted
evidence bytes. Its freshness is caller-declared. The result stays non-executing
and approval-required. Repeating the exact request replays the same decision
and receipt; change `request_id` for a distinct proposal. Do not submit this
example as evidence for an operational release.

## Decision and receipt contract

The generated per-vertical surface is:

- `GET /v1/verticals/{vertical_id}` — checked-in public source manifest.
- `POST /v1/verticals/{vertical_id}/decisions/evaluate` — strict policy request,
  recorded decision, and deterministic initial receipt.
- `POST /v1/verticals/{vertical_id}/decisions/{decision_id}/human-disposition`
  — append-only `APPROVED` or `DENIED` disposition with a caller-declared,
  explicitly unverified human actor identity.
- `GET /v1/verticals/{vertical_id}/receipts/{receipt_id}` — authenticated local
  receipt retrieval after full chain and receipt-semantic verification.

Requests have exact nested fields and reject unknown keys, duplicate JSON keys,
duplicate evidence digests,
unadmitted workflows, stale or unavailable evidence, and non-exact allowed
actions. Prohibited actions deny before evidence admission. Every decision and
receipt keeps `execution_permitted=false` and `external_side_effects=[]`.
Receipt replay is idempotent; a divergent human disposition returns a conflict.
ENFORCE evaluation records the decision and its initial receipt in one SQLite
transaction, including CLI evaluation. Failure of either insert rolls back
both. LOG_ONLY remains a non-executing decision record without a decision
receipt. Receipt retrieval validates the recorded decision identity, replay
digest, event ordering, and initial-to-human inheritance, not just JSON shape.
These receipts are local decision records, not signed release evidence, verified
human authorization, external persistence proof, or production readiness.

The optional `SZL_VERTICAL_RUNTIME_GIT_SHA` environment variable must be exactly
40 lowercase hexadecimal characters. It is reported as declared runtime
identity; setting it does not by itself prove deployment or convergence.

## Test

```powershell
$env:PYTHONPATH = "packages/vertical-runtime;packages/vertical-runtime/tests;apps/vertical-cells"
python -B -m unittest discover -s packages/vertical-runtime/tests -v
```

All mutable state defaults to `packages/vertical-runtime/var/`, which is runtime
state rather than a release artifact. Pass `--ledger` to select another local
volume and use `backup-ledger` to create a SQLite-consistent, locally
chain-verified backup. Neither the path nor the backup command establishes
external durability or production recovery evidence.
