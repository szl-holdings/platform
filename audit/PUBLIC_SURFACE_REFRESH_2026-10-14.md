# Public surface observation refresh — 2026-10-14

Workcell: `platform-public-surface-refresh-20261014`

Agent and recorded by: Codex

Recorded at: 2026-10-14T03:43:00Z

Proof level: 2 (source and evidence correction; no UI or runtime change)

Evidence: **MEASURED**, scoped to the commands and observations below.

## Plan and change

The plan recorded before editing was to verify the immutable Killinchu publisher
evidence, observe every approved public URL, refresh the exact registry and
generated counts, and retain the existing response predicates and release gates.
This follows the failed full live witness
[38502159402](https://github.com/szl-holdings/platform/actions/runs/38502159402),
whose source was `4d37b956685f6e52fa1ff13ee858416e095ad9e1`.
That run found recovered HTTP routes and a newer Killinchu release than the
previous observation. The failure is retained; it is not a passing witness.

All 29 approved surfaces were read anonymously with four concurrent workers,
bounded GET requests and only the registry's approved redirect targets. The
[readback](PUBLIC_SURFACE_READBACK_2026-10-14.json) records status, final URL,
content type, observation time and complete-body hashes where available. The
console exceeded the one MiB collection limit, so its full body hash is
**UNAVAILABLE**; its HTTP status is observed independently of body completeness.

There are 20 directly reachable entries, two approved redirects and seven
retired routes that still return 404 and remain `UNAVAILABLE`. The 12 recovered
web entries retain their previously reviewed `MIXED`, `DOCUMENTATION` or `LIVE`
classification. This is a route classification, not permission to execute a
workflow. The generated summary reports 15 customer-facing routes and one
product owner; it does not report 15 products or production readiness.

The Killinchu constants and corresponding fixtures now identify source
`d80753e8c951c1a1753f31d163a1b82aecb63782`, manifest SHA-256
`a6a48b63bcc420149fe440d2dae4a92b3ed800fe13dfb4087d2b94858d32e9b1`,
and deployment-release attestation reference `55637681`. The manifest was
downloaded from the immutable `hf-deploy-evidence` artifact of successful
[publisher run 38488127035](https://github.com/szl-holdings/killinchu/actions/runs/38488127035).
The source commit's GitHub signature was verified. The following command
completed with exit 0 against those exact downloaded bytes:

```text
gh attestation verify hf-deploy-manifest.json --repo szl-holdings/killinchu --signer-workflow szl-holdings/killinchu/.github/workflows/hf-sync.yml --source-ref refs/heads/main --source-digest d80753e8c951c1a1753f31d163a1b82aecb63782 --format json
```

## Verification and boundaries

- The unchanged live surface verifier, including exact HTML metadata, JSON,
  redirect, body bounds and freshness predicates, passed all approved routes.
- The public-surface unit suite passed 42/42 before and after the patch.
- The complete focused truth suite passed 134/134 using
  `tsx --test tools/truth/validate-truth.test.ts tools/truth/generate-truth.test.ts tools/truth/claims-drift.test.ts tools/truth/generate-allowlist-justifications.test.ts tools/truth/public-surfaces.test.ts`.
- `tools/truth/generate-truth.ts --verify-local --verify-remote` passed after
  a real regeneration. `tools/truth/validate-truth.ts --require-freshness` passed.
- Generation freshly observed 37 Hugging Face Spaces and recomputed the route
  count. The existing 204 package and 5,066 OpenAPI-operation counts were
  reproduced from the tracked metadata. No observation time was refreshed alone.
- Local `pnpm typecheck` initially could not run with the installed pnpm version.
  This sparse checkout is not a complete workspace typecheck environment;
  the after-edit attempt also exited 1 when a Turbo child invoked the host's
  incompatible fallback pnpm. Hosted checks on the PR's exact head remain a
  release requirement; no local whole-workspace typecheck pass is claimed.
- No UI, route, runtime configuration, workflow, DNS or storage implementation
  changed. Screenshot and browser interaction tests: **NOT RUN**, since this
  patch changes evidence and exact binding constants only.
- No credential or private data was included. GET minted no new receipt.
  Killinchu effectors remain `SIMULATED`; its ledger remains process-scoped and
  `production_ready: false`. Runtime authorization and aggregate readiness are
  not established by this readback or by the publisher attestation.

Protected merge and a fresh complete main-branch live witness are required
before describing this correction as released. The dated October 13 evidence
remains history; this packet supersedes only its observed route and source
binding fields.
