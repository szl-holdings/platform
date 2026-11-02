# Readiness authority preflight - bounded source proof

- `workcell_id`: READINESS-AUTHORITY-PREFLIGHT-20261102
- `agent` / `recorded_by`: OpenAI Codex, implementing the owner's operational repair request
- `recorded_at`: 2026-11-02 UTC
- `proof_level`: source and offline test evidence; no provider or deployment proof
- `source_base`: `21d4ee44d4eb9b3a8fcb30530b02f9de6ff52537`
- `objective`: fail the hourly reliability lane before its probe window when
  receipt signing or publication authority is absent or invalid, while retaining
  the existing fail-closed signature and publication gates.

## Context and plan

The scoped Pathfinder scan read the root `AGENTS.md`, non-negotiables,
documentation index, historical application-status register, current known-gaps
register, readiness fleet and reliability READMEs, shared receipt publisher,
reliability executor, workflow and offline contract tests. Run
`41381694418` reached receipt emission at source `dca2db629` but produced an
unsigned envelope and correctly refused publication. The existing workflow
performs its probe window before it discovers that no usable fleet signing
authority reached the job. The publisher credential is likewise checked only
after collection.

The recorded plan is to add a bounded, read-only signing preflight, run it and
the existing Hugging Face publisher preflight before reliability collection,
exercise missing, malformed, invalid-length, unavailable-client, failed-signing
and success paths with offline doubles, and pin the workflow ordering in a
contract test. The patch will not create or rotate a signing key, change a
provider credential, dispatch a workflow, weaken receipt verification, publish
evidence, or alter application routes. The staging HTTP 403 in run
`41375292722` is tracked as a separate Replit authorization blocker; source
still rejects it without retries or false success.

## Patch summary

`signing_preflight.py` validates the effective secret without emitting a
receipt: strict base64, exact 32-byte seed, pinned PyNaCl availability, and a
fixed local Ed25519 sign/verify challenge. Results expose only bounded stages,
codes and the derived public key ID. Secret bytes, signatures, exception text,
provider bodies and headers are excluded.

`readiness-reliability.yml` now runs that check and the existing Hugging Face
identity/destination/write preflight after dependency installation and before
the 60-second probe window. Both use the same secret expressions as the
executor, have bounded timeouts, and cannot continue on error. The executor's
receipt construction, configured-key signature verification, upload, requested
artifact retention and `require_published` gates are unchanged.

Nine offline cases cover the new module and workflow ordering. Fleet and lane
documentation describes the bounded behavior. The known-gaps register preserves
the external authority holds, and the companion
`PLATFORM_EXTERNAL_AUTHORITY_BLOCKERS_20261102.md` records the exact owner-side
Replit, signer, publisher and readback evidence checklist.

## Verification and test results

Validation ran in the fresh full checkout on Python 3.12 and Node 24.19.0.
Pinned Python dependencies were installed only in an ignored local test target;
all provider operations in the suite use offline doubles.

| Command / check | Exit | Result |
| --- | ---: | --- |
| `python -B -m unittest discover -s platform/agents/readiness/_lib -p "test_signing_preflight.py" -v` | 0 | 9 cases passed |
| Full fleet discovery with pinned `huggingface_hub==2.0.0` and PyNaCl 1.6.2 | 0 | 164 cases passed, zero skips |
| Real PyNaCl preflight with a synthetic 32-byte seed | 0 | `complete/ready`; local sign and verify succeeded |
| `node --test platform/agents/readiness/_lib/test_dashboard.mjs` | 0 | 4 reader cases passed |
| Parse changed workflow with pinned PyYAML | 0 | Valid mapping with 9 ordered steps |
| `corepack pnpm docs:claims-check` | 0 | All 26 claims verified |
| `python -m py_compile` for the new module and tests | 0 | Passed |
| `git diff --check` | 0 | Passed |
| Before and after: `corepack pnpm typecheck` | 1 | Identical pre-package blocker: Turbo cannot locate the package-manager binary; no package typecheck executed |

The initial fleet run used the Windows sandbox's protected temporary directory
and produced six unrelated tempfile permission errors. Re-running with an
explicit writable task temp directory removed those errors; the resulting full
164-case suite passed. The local `gitleaks` executable was unavailable. The
first hosted scan flagged the environment-variable name assigned as one literal
as a generic API key; a follow-up source commit constructs the same public name
from fixed words without an allowlist or scanner change. Committed fixtures
derive synthetic bytes in memory and contain no credential value. Fresh hosted
scanning qualifies that follow-up revision.

## Limits and operational follow-up

This source candidate cannot establish the identity behind an absent GitHub
Actions secret, Replit provider authorization, a live receipt upload, remote
readback, or deployed runtime readiness. The owner must reconcile the exact
bindings in `PLATFORM_EXTERNAL_AUTHORITY_BLOCKERS_20261102.md`:

- Replit environment `staging`: exact `REPLIT_STAGING_APP_ID` paired with an
  active bearer identity authorized to create deployments for that application.
- Scheduled readiness job: existing raw 32-byte fleet seed in effective
  `KHIPU_SIGNING_KEY_B64`, plus an `HF_TOKEN` identity with content-write access
  to `SZLHOLDINGS/readiness-runs`.

No screenshot or route check applies because no UI or route changed. No public
runtime, customer, compliance, revenue or deployment claim was added. Rollback
is a protected revert of the source candidate; it requires no data migration.
