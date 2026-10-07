# Public-surface exact-declaration successor — Proof Packet

- **workcell_id:** `WC-PLATFORM-SURFACE-SUCCESSOR-20261007`
- **task_reference:** append-only successor to
  `PLATFORM_OWNER_SOURCE_SURFACE_ALIGNMENT_2026-10-03_PROOF.md`
- **agent:** Codex BuildWarden repair lane
- **objective:** Refresh the exact protected A11oy source/runtime boundary, repair current truth
  drift, upgrade every dependency with an available High-severity remediation, retain both
  no-release High advisories as explicit blockers, and preserve the blocking security workflow and
  exact `fflate@0.8.3` guard.
- **plan_summary:** Re-read Platform and A11oy doctrine; preserve the existing PR branch and its
  owner-backed public-surface verifier; refresh protected-source, publisher, and bounded runtime
  evidence; review the six dependency overrides and regenerated lockfile; regenerate and validate
  `SOURCE_OF_TRUTH`; retain the two no-fix High advisories without suppression; prove the fflate
  guard is unchanged; then run focused live, freshness, truth, claim, security, and diff gates
  against the exact current Platform main base.
- **patch_summary:** The existing owner-backed HTML verifier and public-surface schema remain
  intact. The successor pins six patched dependency versions, regenerates the frozen lockfile,
  refreshes `SOURCE_OF_TRUTH` from admitted local and remote sources, and refreshes the exact
  Killinchu source/manifest/attestation evidence binding plus its deterministic public-surface
  artifact and fixtures. This packet and the known-gaps register record the exact A11oy deployment
  and unresolved security boundary. It does not add an advisory exception, audit waiver, alternate
  publisher, deployment authority, or production-readiness claim.
- **screenshot_refs:** `N/A` — no owning UI layout, style, interaction, or rendered presentation
  changed in this Platform successor. The owner changes are metadata declarations verified by
  bounded source and live-body checks.
- **public_claim_check:** **MEASURED** — every approved live route matched the reviewed registry.
  A11oy.net remains a static proof registry whose source witness labels product runtime readiness,
  uptime, and live DSSE `UNAVAILABLE`. Killinchu remains `EPHEMERAL`, process-memory scoped,
  explicitly not production-ready, with provider persistence `UNKNOWN`.
- **security_check:** **MEASURED** — the fixed HTTPS target allowlist, credential/IP/port
  rejection, manual redirect handling, bounded reads, duplicate-free JSON parsing,
  timeout/retry/concurrency limits, blocking security workflow, focused negative fixtures, and
  exact dependency guard remain active. No secret, credential, permission, writer, deployment
  authority, or security threshold was added or relaxed.
- **known_gaps_update:** `docs/operations/known-gaps.md` rev 34 records the current A11oy protected
  source and deployed runtime, the terminal readiness-verdict failure, the six patched dependency
  upgrades, the two remaining no-release High blockers, the exact fflate guard, and the regenerated
  truth snapshot.
- **proof_level:** `4` — local source, focused contract, live-route, claim, and security evidence;
  Platform hosted exact-candidate checks, review, protected merge, and an independent witness remain
  separate evidence states.
- **recorded_at:** `2026-10-07T17:55:27Z`
- **recorded_by:** Codex BuildWarden repair lane

## Exact source and observation binding

### Platform candidate

- protected base and refreshed merge base:
  `f2f8df6f89056e9104587674ccec0855dd5b177a`
- GitHub-verified signed branch head before this dependency/truth successor:
  `88a7c8d1abe079e48f4ff9d3265b36896e79d747`
- public-surface observation:
  `2026-10-07T16:57:50Z`
- regenerated truth observation:
  `2026-10-07T17:19:03.621Z`
- candidate commit identity: established by the signed commit and hosted pull-request metadata after
  this packet is written; this document does not self-assert its containing commit SHA.

### A11oy owner source and Hugging Face runtime

- current protected main and GitHub-verified source:
  `75e2977def8faabd16173de74a56055542cc9454`
- current source pull request: `szl-holdings/a11oy#2637`
- governed deployment run for the currently served revision: `37660374147`
- exact Hugging Face Space commit: `1ceb75cd127638e49579615ba0f5db522ec18a29`
- exact live build-info source: `75e2977def8faabd16173de74a56055542cc9454`
- build-info boundary: `receipt_minted: false`
- readiness and product-origin transport: HTTP 200 during the bounded observation
- readiness snapshot at `2026-10-07T17:46:48Z`: `application_ready: true`, `stale: false`,
  provider stage `RUNNING`, live Space SHA matching the deployed Space commit
- readiness repository and release reads: `unreachable`; parity: `unknown`
- Killinchu page declaration:
  `szl.public-surface-boundary/v1;surface=killinchu-console;effectors=SIMULATED;authorization=UNAVAILABLE`
- command page declaration:
  `szl.public-surface-boundary/v1;surface=a11oy-command;origin=MODELED;energy=UNAVAILABLE;signer=UNAVAILABLE`

Run `37660374147` admitted exact protected main, published the Dockerfile-derived payload, bound the
runtime source, and passed its deployment-attestation and runtime-configuration jobs. The run still
ended in failure: `Validate the source-bound verdict without a Space write` rejected the probe with
`probe summary contains unavailable required sources`. Its downstream strict parity, exact live
proof, and final protected-main reauthorization jobs were skipped. The current source/runtime
match, `RUNNING` provider stage, and HTTP 200 responses establish the observed deployment only. They
do not establish a fully admitted release, authorization, certification, or a signed write receipt.

### Dependency-security successor

The frozen lockfile now resolves the six available High-severity remediations selected by the
reviewed workspace overrides:

| Package | Prior resolution | Successor resolution |
|---|---:|---:|
| `@modelcontextprotocol/sdk` | `1.29.0` | `1.31.0` |
| `source-map-js` | `1.2.1` | `1.2.2` |
| `proxy-addr` | `2.0.7` | `2.0.8` |
| `compression` | `1.8.1` | `1.8.2` |
| `shell-quote` | `1.9.0` | `1.11.0` |
| `sharp` | `0.35.4` | `0.35.5` |

A fresh `pnpm audit --json --audit-level=high` returned exit `1` with `2` High, `0` Critical,
`12` Moderate, and `2` Low findings. The remaining High findings are explicitly **BLOCKED**:

- `node-forge@1.4.0` — `GHSA-86w9-cpqp-85rv`; the reviewed advisory affects `<=1.4.0` and lists no
  patched release.
- `braces@3.0.3` — `GHSA-vfj7-8cjw-p6xm`; the reviewed advisory affects `<=3.0.3` and lists no
  patched release.

No advisory is muted, ignored, waived, assigned a fabricated version, or hidden behind a Git source
that the npm-version scanner cannot classify. The blocking security gate is expected to remain red
until compatible reviewed releases remove both resolutions.

The central `fflate` override remains exactly `0.8.3`. The fail-closed resolution script, its
positive and negative fixtures, and the blocking `security.yml` wiring are byte-identical to
protected Platform main. The dependency successor changes no fflate implementation or threshold.

### Regenerated source of truth

`artifacts/SOURCE_OF_TRUTH.json` was regenerated at `2026-10-07T17:19:03.621Z` from the admitted
local registry and remote sources. The reviewed drift repair changes the measured customer-facing
surface count from `2` to `1` and refreshes the Hugging Face snapshot to `47` models, `37` datasets,
and `35` Spaces. These values are bounded registry/provider observations, not deployment,
authorization, availability, or model-qualification claims.

### A11oy.net owner source and static witness

- protected squash merge and GitHub-verified source:
  `f659e9a827df1dcb938eb08f0ca1c667b46cb0b3`
- owner pull request: `szl-holdings/a11oy-net#290`
- exact live source-witness revision:
  `f659e9a827df1dcb938eb08f0ca1c667b46cb0b3`
- chat declaration:
  `szl.public-surface-boundary/v1;surface=a11oy-net-chat;execution=UNAVAILABLE`
- code declaration:
  `szl.public-surface-boundary/v1;surface=a11oy-net-code;execution=UNAVAILABLE`
- source-witness product runtime readiness, uptime, and live DSSE: `UNAVAILABLE`

Cloudflare injects edge content into the served HTML. The live source witness therefore establishes
an exact static source revision, not raw edge-byte identity. The static pages do not establish the
separate interactive console or governed run-loop.

BLOCKED edge gaps remain independently visible: GitHub Pages HTTPS enforcement is disabled, the
origin-certificate state is `bad_authz`, no parent DS record was observed for DNSSEC, and the edge
response lacks CSP, COOP, CORP, Permissions-Policy, Referrer-Policy, and X-Frame-Options. Public
Cloudflare TLS answered with TLS 1.3, but HTTP reachability does not close provider or registrar
control-plane gaps.

### Killinchu owner source and scoped runtime readback

- GitHub-verified owner source and exact live build-info source:
  `33e54ffed4723e5dd3d0dcdf69a6052769e69de3`
- deployment-manifest SHA-256:
  `048d19673af818122a068f0fcc0027885f2b04eb8c8ba4626e3407986c7346eb`
- deployment-release reference attestation: `53653748`
- build-info boundary: `receipt_minted_on_request: false`
- readiness boundary: canonical receipt ledger `EPHEMERAL`, `PROCESS_MEMORY` scoped,
  `production_ready: false`; backend provider persistence `UNKNOWN`

The endpoint-reported release identity and scoped readiness response do not establish durable
storage, aggregate service health, authorization, or deployment by this Platform successor.

## Verification record

- `corepack pnpm install --filter . --frozen-lockfile --ignore-scripts` — **MEASURED PASS** after a
  free-space check; only the root verification toolchain was linked from the lockfile.
- `corepack pnpm surfaces:test` — **MEASURED PASS**; the focused positive and negative cases
  passed after refreshing only the exact Killinchu evidence fixtures.
- `corepack pnpm truth:test` — **MEASURED PASS**; the truth and public-surface contract cases
  passed.
- `corepack pnpm claims:validate` — **MEASURED PASS**; truth validation, allowlist coverage, and the
  contract suite passed.
- `corepack pnpm surfaces:generate -- --check` — **MEASURED PASS**; generated evidence matches the
  reviewed registry.
- `corepack pnpm surfaces:check` — **MEASURED PASS**; every configured live observation matched,
  including the exact A11oy and A11oy.net declarations and bounded Killinchu bodies.
- `corepack pnpm surfaces:freshness` — **MEASURED PASS**; the same complete live sweep passed with
  the fresh-observation requirement enabled.
- `TRUTH_ALLOWLIST_BASE_SHA=f2f8df6f89056e9104587674ccec0855dd5b177a corepack pnpm
  claims:drift` — **MEASURED PASS**; the protected base admitted no unsupported claim drift.
- `corepack pnpm truth:generate -- --check --verify-remote` — **MEASURED PASS**; the regenerated
  truth snapshot matched its admitted local and remote inputs.
- `node --test scripts/qa/check-fflate-resolution.test.mjs` — **MEASURED PASS**; the focused positive
  and negative cases passed, including blocking workflow wiring.
- `node scripts/qa/check-fflate-resolution.mjs` — **MEASURED PASS**; all observed dependency edges
  converged on exact `fflate@0.8.3`.
- `git diff --exit-code origin/main -- scripts/qa/check-fflate-resolution.mjs
  scripts/qa/check-fflate-resolution.test.mjs .github/workflows/security.yml` — **MEASURED PASS**;
  the security implementation, exact guard, negative fixtures, and blocking workflow are unchanged
  from current main. `Select-String -LiteralPath pnpm-workspace.yaml -Pattern
  '^\s+fflate:\s+0\.8\.3$'` separately confirmed the exact central override at line 92.
- `node --test scripts/qa/generate-vuln-report.test.js` — **MEASURED PASS**; the focused
  report-parser contract cases passed.
- `corepack pnpm audit --json --audit-level=high` — **BLOCKED** with expected exit `1`: `2` High,
  `0` Critical, `12` Moderate, and `2` Low. The only High findings are `node-forge@1.4.0`
  (`GHSA-86w9-cpqp-85rv`) and `braces@3.0.3` (`GHSA-vfj7-8cjw-p6xm`); the registry reports no
  patched release for either. No suppression or waiver was added.
- `corepack pnpm exec biome check tools/truth/public-surfaces.ts
  tools/truth/public-surfaces.test.ts config/public-surfaces.json artifacts/PUBLIC_SURFACES.json
  artifacts/SOURCE_OF_TRUTH.json audit/PLATFORM_PUBLIC_SURFACE_SUCCESSOR_2026-10-07_PROOF.md
  docs/operations/known-gaps.md pnpm-workspace.yaml` — **MEASURED PASS** with no fixes applied. The
  existing literal GitHub-expression test warnings remain warnings, not failures.
- `corepack pnpm exec tsc --ignoreConfig --noEmit --strict --skipLibCheck --target ESNext
  --module ESNext --moduleResolution bundler --lib es2022,dom
  tools/truth/public-surfaces.ts` — **MEASURED PASS**.
- `git diff --check` — **MEASURED PASS**.
- `CI=1 COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack pnpm typecheck` — **UNAVAILABLE**. The repository-
  wide command began materializing nested workspace dependencies instead of reaching meaningful
  typechecking and was stopped without weakening policy or rewriting dependencies. The focused
  strict TypeScript command above is the scoped evidence for the edited verifier.

## Authority boundary

This packet records protected owner-source inspection, governed A11oy publication, bounded public
reads, local verifier execution, and an uncommitted Platform candidate. It does not claim Platform
hosted exact-head CI, review, protected merge, deployment, production readiness, authorization, or
independent witness. Those states must be recorded separately after the signed candidate is pushed
and admitted through normal repository protection.
