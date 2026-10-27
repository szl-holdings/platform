# Platform PR 963 current HIGH dependency repair

Workcell: PLATFORM-963-CURRENT-HIGH-20261025.
Evidence class: **MEASURED** for the commands below; source candidate only.
Baseline: `60966e4b28a7f9202c8352ac5478fa1927adad46`.

## Finding and bounded repair

Native Security run `40169924627` and Grype run `40169924663` failed at the
baseline. The fresh reports identify happy-dom 20.10.2 with
[GHSA-834v-8h66-3h79](https://github.com/advisories/GHSA-834v-8h66-3h79)
and filelock 4.1.0 with
[GHSA-v4x8-3wr5-3wq8](https://github.com/advisories/GHSA-v4x8-3wr5-3wq8).
Use their published patched floors: happy-dom 21.0.4 and filelock 4.2.1.

The sole root happy-dom development declaration is pinned exactly. Published
old/new package metadata has the same Node >=20 engine and dependency set;
Vitest accepts the selected peer. Native CI uses Node 24. Independent source
review checked the v21 change that disables CSS and iframe file loading by
default against the existing DOM consumers; no consumer needs those features.
The safer upstream defaults remain in effect.

Pinned pnpm regeneration also rebinds two already present nested Vitest peer
contexts from @types/node 25.9.3 to 25.3.5. Existing peer warnings remain in the
lockfile command receipt. This is not a claim that every dependency is clean.

Only the filelock stanza changes in the Python worker lock. The project and
filelock both require Python >=3.11; existing hub and torch constraints admit
the patched version. No worker extra, image, dependency declaration or gate is
changed. The independent scout bound the native Grype artifact to this lockfile.

## Commands and receipts

The local pnpm executable is
`C:/Users/steph/AppData/Local/node/corepack/v1/pnpm/10.26.1/bin/pnpm.cjs`;
`node <pnpm> --version` reports 10.26.1. No full workspace install was run.

- `node <pnpm> install --lockfile-only --ignore-scripts --prefer-offline --no-frozen-lockfile`:
  exit zero; no packages downloaded or added.
- `node <pnpm> install --lockfile-only --ignore-scripts --frozen-lockfile`:
  exit zero.
- `node <pnpm> audit --json --audit-level high`: exit one, retained verbatim.
  The complete metadata reports critical=0, high=0, moderate=16, low=2. The
  lower findings and nonzero command result remain visible.
- `node scripts/qa/generate-sbom.js`: exit zero, content hash
  `e4a42a5940204f4865d4ea13205db86e13413616289c954c5ddd58b11e4b9f93`.
  The latest SBOM and content-addressed history include happy-dom 21.0.4.
- `node --test scripts/qa/generate-sbom.test.mjs`: exit zero; command receipt
  `pass=15, skipped=1`. The existing Windows symlink limitation is retained.
- `../toolchain-uv-0.12.19/uv.exe lock --project services/substrate-py-workers --upgrade-package filelock==4.2.1 --no-python-downloads`:
  exit zero; only filelock changes. The official uv wheel was verified against
  its published SHA-256 before extracting the executable; no global install.
- `../toolchain-uv-0.12.19/uv.exe lock --project services/substrate-py-workers --check --no-python-downloads`:
  exit zero. No Python environment sync or GPU workload was run.

Native Grype, Security Gate, Python worker contracts and DOM consumers must run
on the new exact head. Protected merge remains reserved to the coordinator.
Provider deployment and runtime qualification are **NOT RUN** in this workcell.
