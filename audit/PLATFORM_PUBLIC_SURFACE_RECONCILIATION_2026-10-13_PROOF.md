# Public-surface reconciliation — Proof Packet

- **workcell_id:** WC-PLATFORM-SURFACE-RECONCILIATION-20261013
- **agent / recorded_by:** Codex review_platform
- **recorded_at:** 2026-10-13T18:36:57.436079+00:00
- **objective:** Reconcile PR #906 against protected source without losing newer
  redirect, readiness, dependency-security, or evidence boundaries. Refresh the
  operational registry only from bounded observations made in this session.
- **plan_summary:** Preserve current source controls, apply reviewed structural
  HTML and duplicate-free metadata validation, refresh all approved targets,
  regenerate the lock-derived SBOM and canonical truth, then require a new
  protected PR check run and normal expected-head squash.
- **patch_summary:** Add exact parse5 dependency, structural WEB validation and
  regressions, duplicate-free webmanifest validation, and claims validation to
  Runtime Audit. Keep the existing closed URL allowlist, exact 301 redirect
  checks, concurrency/retry/body bounds, and stricter ephemeral recovery checks.
  Refresh observed registry/manifest/runtime pins, truth and SBOM. Retain three
  historical PR #906 proof packets unchanged and append the current gap scope.
- **screenshot_refs:** N/A — this change alters verifier and audit source only;
  it changes no rendered UI, stylesheet, route implementation, or interaction.
  Static HTML parsing is not screenshot proof.
- **proof_level:** 2 — tested source/evidence reconciliation; hosted admission
  and deployment qualification are separate.

## Source reconciliation

Reviewed original PR #906 head: `a7764d3a4ac6256ec02037a2806003f4cef5fa7a`.
Implementation was reconciled on protected main
`fb4dd6d4a072f4e940daf76225211e14031082fd` (PR #929), rather than replacing
newer files with the older branch. Publication advances onto the subsequent
protected squash `aaa5417bd9a1fe755a5eaaa4e45bb29c8940370c` (#930), preserving
its complete source and gap register. The #906 implementation delta is unchanged. Main's exact 301 gateway expectations,
zero recovery attempts and zero delay in ephemeral mode, and current
dependency overrides/local patch are retained. Six old dependency upgrades
from #906 are already admitted in main; this successor does not regress them.

The three October 3 / October 7 proof packets are retained historical
records. Their old HTTP status, runtime pins, security findings and readiness
claims are not refreshed by their inclusion here. The current dated receipt
and explicit boundaries below take precedence for present observations.

## Current observations and limitations

The normal unauthenticated GET sweep recorded 29 approved surfaces / 31 hops
at 18:04–18:05 UTC; no response body was truncated. Receipt SHA-256:
`f23f524dc22582e83c526a755871a975e4255ed933e1fb6d931a3516d6a4f3c4`.
The original receipt identifies the immutable allowlist base used to choose
its targets; later source reconciliation did not change that allowlist.

- All 19 registered product-domain targets returned Cloudflare HTTP 403 /
  error 1010 from this observer route. `UNAVAILABLE` therefore describes the
  observer transaction, not a global outage. The origin route existence,
  source and runtime state were not observable. No alternate origin,
  credential change, browser impersonation, or access bypass was attempted.
- Six static-domain entries matched their HTTP/metadata contracts, including
  the exact 301 redirects. Independent domain receipts record source witness
  `2ed4a76edfb8925bf0611f00ee9d9e4943a026c0`; all eight required response
  headers remain absent in the checked root/manifest responses.
- Four upstream runtime API endpoints returned HTTP 200. A11oy build-info
  self-reported `3856bf185bb8436be3ce853630ca219fd2ab8767`; Killinchu reported
  `a6f6ce97afd09044df36b8ac610e3d42759e8462`, deployment manifest
  `72f1e751dd84994e30021d7366ba7bcc10b6b71f81b9dce29cbc4a2e5cd828f3`
  and attestation reference `55508160`. GitHub source commit signatures were
  checked independently. Attestation contents and Hub content parity were
  **not independently verified** by this refresh.
- Killinchu remains EPHEMERAL / PROCESS_MEMORY / production_ready=false;
  provider persistence remains UNKNOWN. A11oy readiness self-reports an
  empty valid SQLite chain. Neither response establishes independent durable
  persistence, production authorization, or the blocked custom-domain route.

Canonical truth was generated at `2026-10-13T18:30:20.891Z` from all
204 materialized workspace manifests, 48 workflow files and the OpenAPI
source (5,066 operations). Its customer-facing-product count is zero under
this observation scope. Anonymous Hub API author lists measured 48 models,
37 datasets and 36 Spaces. This is the returned public author-list scope,
not private inventory or provider readiness. An independent parallel audit
confirmed those counts at 18:33:47Z. Collections and receipt depth remain
UNAVAILABLE. The collections endpoint returned HTTP 400 in the diagnostic
recheck; receipt-head returned HTTP 404. No database or private Hub
credentials were used. Missing test, Lean build and benchmark input files
remain UNAVAILABLE rather than invented measurements.

## Test results

| Check | Exit | Result |
| --- | --- | --- |
| Node/tsx public-surfaces regressions | 0 | 42/42, including retained strict redirect and recovery negatives |
| Combined public-surfaces, generate-truth and validate-truth suites | 0 | 61/61 |
| Offline validation of independently captured bodies | 0 | All 31 body hashes checked; no contract failures across 29 surfaces; this is replay, not a second live sweep |
| Exact pnpm 10.26.1 frozen lock-only validation | 0 | All 204 workspaces; existing parsed lock data identical after removing the exact parse5/entities additions |
| Official generate-sbom.js | 0 | 1,809 components, one verified local patch, official vendored CycloneDX 1.4 schema |
| generate-sbom.test.mjs | 0 | 16/16, including current lock equality and byte-idempotence |
| generate-truth.ts and validate-truth.ts | 0 | Canonical generation and validation |
| generate-public-surfaces.ts --check | 0 | Deterministic manifest equals registry |
| generate-truth.ts --verify-local | 0 | Recomputed local metrics exactly match |
| Two initial --verify-local --verify-remote attempts | 1 each | Reported hf_models / hf_datasets / hf_spaces drift; no values were rewritten to suppress it |
| Diagnostic unmodified-generator remote recheck | 0 | Same fetch implementation with response cloning for diagnostic status/count logging; HTTP 200 counts 48/37/36 exactly matched |
| pnpm typecheck in isolated checkout | 1 | Could not launch: turbo executable absent; full typecheck result is UNAVAILABLE locally and required in native CI |
| Full root lock resolver attempt | 130 | Cancelled slow full-workspace re-resolution before mutation; exact minimal pnpm-generated records used and independently frozen-validated |

The SBOM SHA-256 is
`4dac02d1bcac96f94d04e5841810ad4254e3279c9b177ee326530ce9da2e88f9`.
The two added unique package identities are parse5@8.0.1 and entities@8.1.0.
Existing package records, snapshots, workspace importers, security overrides
and the admitted local patch were semantically unchanged. The minimal source
lock was generated by exact pnpm 10.26.1; the final 204-workspace frozen check
passed. No full local install, vulnerability audit, build, or hosted result
is inferred from that frozen metadata check.

## Verification and remaining work

- **verification_notes:** Reviewed exact source delta, preserved stronger main
  assertions, verified independent body hashes before replay, and used the
  canonical generators. Protected hosted checks and resolved review threads
  must pass before normal expected-head squash.
- **public_claim_check:** No production, durability, authorization, global
  availability, screenshot, customer, or release-admission claim introduced.
- **security_check:** Only public bounded observations and repository source
  are included; no credentials, tokens, environment values, secret files or
  bypass workflows are added. Blocking security policy is unchanged.
- **known_gaps_update:** Appended current observer, edge-header, ephemeral
  readiness, and inventory boundaries while preserving the entire existing
  register. Provider settings still require actual authorized provider state;
  source merge does not make those external dependencies operational.
