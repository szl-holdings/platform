# Khipu offline tick recovery

- Workcell: KHIPU-OFFLINE-TICK-20261101
- Actor: OpenAI Codex, acting on the owner's operational repair request.
- Base: a465a0aa182f5eb88bdf3131372ca7a9b8199e87.
- Related candidate: Platform #991 at 5ee373a3c5dad935d8d228a570166a660106baca.

## Plan recorded before editing

Preserve #991's strict publication acknowledgement guard. Give KhipuDAG an
optional checkpoint uploader, and report an unavailable checkpoint when none
is configured so offline verification, publication-intent and tick receipts can
continue. Do not append a checkpoint, emit self_checkpoint, or advance the
successful-checkpoint timestamp without a positive acknowledgement. Explicitly
configured uploader failures remain exceptions. Cover the real tick consumer,
positive acknowledgement/cadence, and negative/malformed acknowledgements.

Scope: checkpointer.py, dag.py, package tests/README, this proof packet, and a
bounded known-gaps entry. No workflow, credential, publisher destination,
production runtime, signing configuration, or doctrine count changes.

Baseline typecheck: `pnpm typecheck` exited 1 before TypeScript execution:
repository requires pnpm 10.26.1; available wrapper invokes pnpm 11.25.0.
Hosted exact-head checks remain required. UI screenshot: not applicable;
no UI surface is modified.

## Executed validation

Python 3.12.14; pytest 9.1.1, reedsolo 1.7.0 and lmdb 2.3.0 match the
existing hosted package-test dependency pins. Dependencies were installed into
a separate test directory; no package manifest or lockfile changed.

- Before the DAG repair, with the exact #991 publication guard applied:
  `python -m pytest packages/khipu-os/tests/test_checkpoint_publication.py -q`
  exited 1: four failures and seven passes. The default offline tick raised
  before verification; the three uploader-injection cases lacked an API.
- After repair: `python -m pytest packages/khipu-os/tests -q -p no:cacheprovider`
  exited 0: 38 passed, no skips. PYTHONPATH selected the checkout and pinned test
  dependencies; PYTEST_DISABLE_PLUGIN_AUTOLOAD=1. This includes eleven new
  cases for offline SQLite-backed ticks, strict malformed/negative ACK rejection,
  direct-offline refusal, positive-ACK cadence, recovery and transport exceptions.
- `python -m compileall -q packages/khipu-os/khipu_os packages/khipu-os/tests`:
  exit 0.
- Complete base-to-candidate `git diff --check`: exit 0.
- `TRUTH_ALLOWLIST_BASE_SHA=a465a0aa182f5eb88bdf3131372ca7a9b8199e87 node
  tools/truth/claims-drift.ts`: exit 0, claims drift PASS after the local candidate
  commit existed. Earlier invocations correctly refused a missing origin/main
  and an allowlist baseline equal to then-HEAD; no checker or allowlist changed.
- Post-edit `pnpm typecheck`: exit 1 with the same pnpm engine mismatch as
  baseline. No TypeScript result is claimed. Hosted tests, security scanners,
  required contexts and protected admission remain required.

## Verification and boundaries

The checkpointer guard is byte-identical to #991's checkpointer.py. A missing
uploader is explicitly UNAVAILABLE, not a successful checkpoint. Actual
configured failures still propagate. The receipt verifier and all doctrine
constants remain unchanged. Tests use synthetic acknowledgements and a
non-production signing fixture; they make no Hub or provider calls and prove
neither remote durability nor production signing.

Six paths changed. No credentials, .env content, external endpoint, workflow,
security gate, application route or UI changed. Known-gaps has one scoped
candidate entry. APP_STATUS is historical and unchanged. Public claims remain
bounded to local test evidence. No human review, verified commit signature,
runtime deployment or estate readiness is asserted.

Proof level: 2 (source and local tests). Screenshot references: not applicable.
Recorded at: 2026-11-01. Recorded by: OpenAI Codex.
Rollback: revert the eventual protected change; no data migration is involved.
