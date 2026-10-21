# Bounded HTTPS replication delivery

Workcell: `replication-https-delivery-20261021`.
Base: `01e646f294f75b3c82aaa5792c03ffcd7029aa0d`.

## Plan

Add a one-attempt HTTPS delivery adapter and authenticated batch receiver to
`packages/khipu-lmdb/khipu_lmdb/delivery.py`, using the existing durable outbox
and atomic mirror origin index. Bind exact endpoint, peer, source and credential
reference before delivery. Require certificate/hostname validation, no redirects,
bounded request/response sizes, and an exact batch acknowledgement before cursor
advance. Read credentials from an explicitly named environment variable; never
include values in bindings, results or errors.

Add real separate-process HTTPS regressions for delivery, receiver persistence,
lost acknowledgements and sender restart; retain negative credential, binding,
TLS and ACK controls. Record actual commands/results below. Update the package
README and known gap register. No UI or existing route changes are planned.

The one-attempt API has no automatic worker or restart enablement. It does not
provision credentials or authorize production peers. Existing single-file
A11oy/Killinchu consumers require a governed export and protocol/lifecycle
integration before using it. Local transport tests do not establish hosted
snapshot durability or production activation.

## Baseline

`pnpm typecheck`: BLOCKED before typechecking. The checkout requires pnpm
10.26.1; installed pnpm is 11.25.0. No dependency changes were made.

Implementation tests, independent review and publication: NOT RUN at plan time.

## Verification

MEASURED: initial Windows transport tests passed all 20 Khipu HTTPS regression
cases. Review identified missing cross-batch continuity and unbounded test-server
startup. The candidate now commits the bound receiver cursor and every wrapper
and origin index in one transaction, rejects source gaps/forks, and acknowledges
only the next contiguous batch or exact last-batch replay. Test startup is bounded
to 15 seconds. New regressions cover a later-origin conflict rolling back the
whole batch and actual receiver process death inside the write transaction.

MEASURED: final Windows complete package suite passed all 118 Khipu LMDB
regression cases in 46.57 seconds. Command, from the repository root with
`PYTHONPATH=packages/khipu-lmdb`, `PYTHONDONTWRITEBYTECODE=1` and
`PYTEST_DISABLE_PLUGIN_AUTOLOAD=1`:

```text
python -B -m pytest -q -p no:cacheprovider --basetemp=C:/Users/steph/szl-work/replication-https-tests-20261021-c packages/khipu-lmdb/tests
```

MEASURED: an isolated native Linux run on the existing Ubuntu VM passed the prior
117 Khipu LMDB regression cases in 8.58 seconds. The transfer archive and all
source/test bytes were SHA-256 checked on the VM before execution. A task-local
venv installed only pytest 9.1.1 and LMDB 2.3.0 with their required dependencies;
no global environment or running service changed. The final additional
receiver-death regression is qualified in the terminal receipt below.

The HTTPS tests create fresh temporary keys/certificates and random credentials;
none are committed. A real separate process receives the batch over TLS into a
real LMDB mirror. After lost response or receiver process death, both sender and
receiver restart and retry the exact durable body. Tests inspect the reopened
receiver and source cursor and verify that no duplicate wrappers were appended.
Other controls reject unknown TLS roots, wrong hostname, wrong bearer, redirects,
changed/boolean/oversized ACKs, malformed batches and source discontinuities.

This is bounded real transport between test processes. Production credentials,
hosted state-store restoration, consumer deployment and automatic lifecycle
activation remain UNAVAILABLE. No model request or training was run.

## Terminal local qualification

MEASURED: the final native Ubuntu run passed all 118 Khipu LMDB regression cases
in 9.11 seconds, including real receiver process death before transaction commit.
The isolated command used the existing task venv and fresh source/test directory:

```text
/home/Ubuntu/szl-verification/replication-20261021-de919bb45aba/venv/bin/python -B -m pytest -q -p no:cacheprovider --basetemp=/home/Ubuntu/szl-verification/replication-20261021-f5b5bcd81f30/tests tests
```

The retained external receipt is `replication-20261021-f5b5bcd81f30.json`.
Transferred archive SHA-256:
`def2bbe414445512ecb4e054836867f3a709037b6e34aa7a12824048281cc5dc`.
Runtime module SHA-256:
`d2d635607f840fe15c4ed042043f8433a499cd323a1e64eb185cf0fc6e3bf94c`.
HTTPS tests SHA-256:
`80d98c3a5e3d91c8e7bb609c9d47aa807a458ff71a8cf4c71da1e76c62ae96ef`.
The receipt enumerates every transferred source hash and records zero production
service changes, peer activations, provider writes, inference and training.

Post-edit `pnpm typecheck` stopped at the same pnpm version mismatch as baseline;
typechecking is BLOCKED locally and must be checked by hosted CI. `git diff
--check` returned exit 0. No UI changed; screenshots and route QA are NOT RUN.
Separate agent source review reported no P1/P2 findings. Hosted checks, protected
merge and consumer publication remain pending; these test results authorize no
production activation.

MEASURED: retained Gitleaks 8.21.2 package archive SHA-256 matched the previously
verified official checksum
`f238c85e5f47e18fac779ce71ee11091cf70a0a8fb4415f165efba2800eef133`.
`gitleaks detect --source packages/khipu-lmdb --no-git --redact --no-banner
--log-level error` returned exit 0. The complete hosted scan remains a merge
gate. Source push does not authorize retrying the currently denied Platform
staging deploy-control request or activating production replication.

## Snapshot admission race correction

Consumer-design review identified that another actor could ACK a checkpointed
batch before the adapter's internal prepare. `expected_batch_id` now rejects a
missing or substituted pending batch before opening HTTPS. The consumer must
still checkpoint that exact batch and fence the full operation. The new focused
Windows regression passed; the final native VM package run passed all 119 Khipu
LMDB regression cases in 8.47 seconds, including both empty and substituted
pending-state races. Receipt: `replication-20261021-56eb8efb391b.json`.
Archive SHA-256: `e89a691c8c89f74d8a3882bd78fe13f1b5e9e29beee1fa0ace4fedcb3681be89`.
Final delivery module SHA-256:
`cacec8ad545c16d36e02926b03000d43a42b052ceb84f4d3a844da001d52ea1a`.

The exact required pnpm 10.26.1 was then invoked through an isolated npx cache:
`npx --yes --cache <task-cache> pnpm@10.26.1 typecheck`. It reached the repository
script but exited 1 because this sparse checkout has no `node_modules`/`turbo`.
The previous engine mismatch was resolved for this invocation; local typecheck
remains BLOCKED on missing workspace dependencies. Hosted typecheck is required.
