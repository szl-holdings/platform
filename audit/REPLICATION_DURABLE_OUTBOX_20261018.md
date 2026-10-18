# Durable replication outbox — local storage proof

## Plan and boundary

Workcell: `replication-durable-outbox-20261018`.
Base: `9d685a683984b7a0595a2a85bed930f961b94a53`.

Complete the inherited work in `packages/khipu-lmdb/khipu_lmdb/core.py`,
`outbox.py`, and `tests/test_replication_outbox.py`. Add the package API contract
and update the replication gap register. Preserve existing receipt bytes and
receiver-origin indexing. Success means exact pending bytes survive process
exit, only the matching pending acknowledgement advances its interval, and
invalid binding, corrupt state/source, or limits leave the transaction unchanged.

No transport, credentials, peer authorization, worker activation, deployment,
or hosted filesystem qualification is included. There are no UI changes.

## Verification

Initial inherited candidate: **MEASURED**, 86 package tests passed on Windows
with Python 3.12 and real LMDB in 12.04 seconds. The tests include independent
process exits before and after commit, concurrent preparers, and lost-ACK replay.

Command (from the repository root, with `PYTHONPATH=packages/khipu-lmdb`,
`PYTHONDONTWRITEBYTECODE=1`, and `PYTEST_DISABLE_PLUGIN_AUTOLOAD=1`):

```text
python -B -m pytest -q -p no:cacheprovider --basetemp=C:/Users/steph/szl-work/platform-replication-outbox-tests-20261018 packages/khipu-lmdb/tests
```

Baseline `pnpm typecheck`: **BLOCKED**, exit 1, before typechecking. This
checkout requires pnpm 10.26.1; the installed executable reports 11.25.0.
No package-manager installation, configuration change, or unrelated TypeScript
repair was attempted. The same command after editing stopped with the same
engine mismatch. Routes and UI are unchanged; route/browser tests are NOT RUN.

Final storage implementation: **MEASURED**, 95 package tests passed on Windows
in 17.16 seconds and on WSL Ubuntu in 4.94 seconds. The new negative cases check
malformed and unknown ACKs, exact envelope/comma byte limits, a rehashed receipt
with a broken predecessor link, and changed pending auxiliary bytes even after
their stored batch hash is recomputed.

After reducing only the new outbox test databases to 8 MiB LMDB maps, the final
complete package suite passed **95/95** on WSL Ubuntu in 40.36 seconds, exit 0:

```text
wsl -d Ubuntu -- bash -lc 'cd /mnt/c/Users/steph/szl-work/platform-replication-outbox-20261018 && PYTHONDONTWRITEBYTECODE=1 PYTEST_DISABLE_PLUGIN_AUTOLOAD=1 PYTHONPATH=packages/khipu-lmdb /home/rosie/szl-runtime-identity-20261017-venv/bin/python -B -m pytest -q -p no:cacheprovider --basetemp=/tmp/platform-outbox-bounded-20261018 packages/khipu-lmdb/tests'
```

`git diff --check`: **MEASURED**, exit 0. At initial local completion, hosted CI,
package publication, independent review, and Gitleaks were NOT RUN, and no commit,
push, merge, provider write, or runtime activation had occurred.

## Protected review handoff

**REPORTED:** the coordinating release agent supplied an independent code-review
result with no P1/P2 findings and authorized a signed commit and pull request.
This is a separate agent review, not an independent-party attestation or runtime
authorization. A fresh `git fetch origin main` still resolved protected main to
the base above; no reconciliation or source change was needed. No tests were
repeated solely for this documentation update.

The existing `Khipu LMDB replication transaction contracts` job in
`.github/workflows/tests.yml` already runs the complete package test directory
with Python 3.12, pytest 9.1.1, and LMDB 2.3.0. It will include the new tests on
the pull request without a workflow change. Hosted CI and secret-scan results
remain pending until observed on the pushed head. No merge, publication, or
runtime activation is authorized by this proof packet.

## Release limits

**DECLARED:** the new API is package-local. Single-file `szl_khipu_lmdb.py`
consumers cannot call its lazy relative `outbox` import until their governed
vendor exporter includes or flattens that module and their integration is tested.
No consumer pin or deployment changes are made here.

The outbox is local transaction state, not a peer signature, authorization,
independent witness, or cross-host backup. Deployment, hosted restart recovery,
authenticated delivery, snapshot admission, pause state, and end-to-end
replication are **UNAVAILABLE** in this proof. No claim of AGI or production
readiness follows from these tests.
