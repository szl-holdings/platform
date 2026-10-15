# Readiness receipt admission reconciliation

Workcell: `SZL-ORG-PR-20261015` · PR #879 · recorded 2026-10-15.
Agent: Codex / BuildWarden and PixelProof roles.

The readiness publisher verifies receipt signatures against its configured fleet
key before upload. Successful credential preflight does not authorize an unsigned
receipt, and a later upload failure still fails the Actions run. The browser
viewer presents fetched claims as `UNVERIFIED` because it has no pinned signer.

## Plan and final patch

Forward-merge protected main `3876b20e91efd4928190e7ebe02b3b2340fd468d`
into the original PR branch at `c8227280aecaddb1711003c01c022247916fae5f`,
retain both append-only screenshot catalog sections, preserve main's dependency
repairs, validate the integrated contracts and refresh the local UI witness.

The integration exposed one stale preflight regression: it expected an unsigned
receipt to reach the uploader. The repaired upload-rejection case now supplies a
synthetic signed receipt and retains the failing exit status, publication result,
Actions annotation and uploader-call assertions. A separate case proves that a
successful credential preflight cannot admit an unsigned receipt. The audit-rift
README now describes the configured fleet-key trust boundary accurately.

The local merge commit `99251f1d368f6d8873edbeba46b41606be23d6e0` ran
the existing hooks, which also reformatted 30 inherited main files. A normal
forward GitHub API commit, `d70282985d7b4358cf405fbedc74628bb9475bbf`,
restored those files byte-for-byte to protected main. The server commit signature
was verified as valid. Neither history nor local hooks nor branch rules changed.
The intermediate formatter output is not the final source or evidence authority.

## Validation

These are suite-scoped local observations. The canonical aggregate
`platform_tests` evidence remains `UNAVAILABLE`; no repository-wide passing
test count is inferred from these results.

| Command / check | Exit | Result |
| --- | --- | --- |
| `pnpm typecheck`, pinned pnpm 10.26.1, initial checkout `cc9fc2bd658241354c381e4fe78a11ba1d09dd3b` | 0 | 232 tasks passed, 231 cached |
| `pnpm install --frozen-lockfile`, CI environment, Node 24.19.0 / pnpm 10.26.1 | 0 | Exact lockfile installed across 204 workspaces |
| `pnpm typecheck`, integrated corrected tree | 0 | 232 tasks passed, zero cached |
| `python -B -m unittest discover -s platform/agents/readiness/_lib -p 'test_*.py'` | 0 | 122 tests, nine expected PyNaCl-dependent skips in stdlib-only environment |
| Same suite with Python 3.12.14 and PyNaCl 1.6.0 | 0 | All 122 readiness regression cases passed, including real Ed25519 cases; network and publication mocked |
| `node --test platform/agents/readiness/_lib/test_dashboard.mjs` | 0 | Three DOM safety and unverified-claim tests passed |
| Existing vulnerability-report, Grype gate, dependency-patch and license regression suites | 0 | All 51 selected security regression cases passed |
| `pnpm claims:drift`, `pnpm claims:validate`, and changed-claim scan against protected main | 0 | Suite scopes accepted; all 134 selected truth-validation cases passed; canonical aggregate test evidence remains UNAVAILABLE |
| Existing audit normalization, version attestation, mitigation verification and blocking policy | 0 | Pinned pnpm verified; zero High/Critical, two Moderate findings, no mitigation errors |
| `pnpm audit --json` | 1 | Package manager reports the two Moderate findings; existing High/Critical policy remains unchanged |
| Normal pre-commit and pre-push hooks | 0 | Format/lint, 26 documentation claims, branding and 13 OG cards checked |
| Bounded local Chromium witness at `d70282985d7b4358cf405fbedc74628bb9475bbf` | 0 | Eight UNVERIFIED rows, zero GREEN rows, zero external requests, no page errors or request violations |
| Final delta whitespace check against protected main | 0 | No whitespace errors in this PR's final source delta |

The first unpinned `pnpm typecheck` invocation failed before compilation because
the environment's default pnpm was 11.19.0; the repository-pinned command above
resolved that toolchain mismatch. The first noninteractive install required the
normal CI flag and then completed. Neither failed attempt is counted as a pass.

The initial proof-only hosted truth-drift run rejected two unqualified suite-count
phrases in this packet. Their wording now names the specific readiness/security
scope; the counts and underlying results are retained. No validator, canonical
metric, baseline or allowlist was changed to admit them. A prior ignored local
Playwright report was preserved outside the source checkout before local scanning.

The original inherited High/Critical failures are not suppressed: protected main
already contains the dependency repairs. No security thresholds or exclusions
were changed in this reconciliation. The exact final PR head must still clear
all required hosted checks and normal protected admission.

## Screenshot and claim boundary

[Current local screenshot](../docs/assets/screenshots/current/szl-readiness-matrix-2026-10-15.png)
and [reproducible metadata](../docs/assets/screenshots/current/szl-readiness-matrix-2026-10-15.metadata.md)
bind the route, viewport, source, capture time and screenshot hash. The app is
served from its real local source. Browser requests for eight synthetic unsigned
receipts are fulfilled locally; all other traffic, non-GET methods, service
workers and WebSockets are blocked. The synthetic payloads claim GREEN, and every
row remains UNVERIFIED. This is `SIMULATED_LOCAL_RENDERED_UI` evidence only.

Historical October 2 screenshot bytes and their metadata remain unchanged.
The proof-only follow-up changes no dashboard or publisher runtime bytes.
No route was added, so route-discovery checks are not applicable.

No secret values were read or committed. No Hugging Face receipt was uploaded,
provider configuration changed, model called, deployment requested or readiness
writer dispatched. Secret-metadata access errors do not establish whether any
secret is present. Fleet identity configuration, provider publication, freshness,
underlying runtime claims and production readiness remain unverified. Existing
production gaps and the historical APP_STATUS register are not relabeled.

Proof level: 3, local source and rendered UI only; not production release proof.
