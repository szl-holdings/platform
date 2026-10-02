# Estate audit adapter

This directory records the SZL CODEX FRONTIER V1 intake. The existing
`tools/szl_estate_auditor.py` remains the GitHub collector; `szl-estate-os`
remains the receipt/readiness control plane and `.github` remains the
organization workflow/doctrine source. This adapter does not replace them.

## Plan: frontier-estate-20260912

Baseline: `platform@ac24e9c211457dc76b7b3fc5457a586e2c4a8d2c`.

Repair the existing auditor and its tests so unavailable evidence, pending
runs, scheduled failures, truncated API pages, or a changed default-branch
head cannot yield GREEN. Enumerate accessible repositories with pagination;
bind file and CI observations to a captured commit and check that the head
has not changed before completing each observation. Keep every observed
workflow/event lane, so a newer successful workflow cannot hide a different
failing workflow. Add an offline CI job for these regressions and record a
scoped proof packet. No application route or provider mutation is part of
this patch.

The report is a source/CI snapshot, not an operational-readiness certificate.
Provider publication, live application behavior, model evaluation, commercial
readiness, and authorization require their own evidence. API errors remain
unavailable; they never become zero assets or a passing check. Runtime state
is `NOT_PROBED` unless a separate witness establishes otherwise.

## Reproduce

```sh
python -m unittest discover -s tools -p test_estate_auditor_contract.py -v
python tools/test_estate_auditor.py
python tools/szl_estate_auditor.py --all --workers 4 --json-out estate-audit/local/github.json
python tools/szl_estate_auditor.py --replay estate-audit/local/github.json --no-table
```

Live collection uses the existing authenticated `gh` session. Local reports
can contain private repository identities; they are ignored by Git and must
not be copied into a public PR. Fixtures contain only synthetic identities.
The replay command rescores the stored observations without network access;
it preserves their original observation time and does not refresh evidence.

Exit 0 means collection was complete, not that the estate is ready. Exit 2
means collection was incomplete. `--require-green` additionally exits 3 if
any repository's source/CI flag is not GREEN.

## Instruction reconciliation

Read at the baseline: root `AGENTS.md`, `CONTRIBUTING.md`, `SECURITY.md`,
`SOURCE_OF_TRUTH.md`, `docs/INDEX.md`, `docs/APP_STATUS.md`,
`docs/operations/known-gaps.md`, `docs/A11OY_NON_NEGOTIABLES.md`,
`docs/A11OY_PROOF_DOCTRINE.md`, `docs/A11OY_PUBLIC_CLAIMS_DOCTRINE.md`, and
`docs/PLATFORM_CANONICAL.md`. No nested instructions govern these tools.

The April canonical document's Node 22/TypeScript 5 text conflicts with the
current package manifest and root instructions (Node >=24/TypeScript 6).
Current executable manifests and root instructions govern verification.
This patch changes neither runtime selection nor product readiness claims.
The input payload is a proposed program specification; it does not itself
authorize billing, production-edge changes, public claims, or merging PRs.

## Proof packet: 2026-10-01 source refresh

The refreshed `origin/main` was
`f2f8df6f89056e9104587674ccec0855dd5b177a` before integration, 31
commits after the recorded September baseline. The upstream collector and
its legacy tests were unchanged; the CI workflow updated the pinned pnpm
setup action. The local offline contract suite passed 26 tests and the legacy
suite passed 25 assertions on the unintegrated patch. This is a source-level
check only. Repeat both suites on the integrated exact head, then use hosted
PR checks for the CI claim. Provider publication and runtime behavior remain
`UNAVAILABLE`/`NOT_PROBED` in this proof packet.
