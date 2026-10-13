# Ubuntu 26 runner compatibility — platform proof packet

- Workcell: `ubuntu26-platform-audit-20261008`
- Actor: AuditTitan / Codex
- Recorded: 2026-10-08
- Audited source: `szl-holdings/platform` protected `main` at
  `0dbf3de71e6ef317d9382ea0e4c3b6c188e3e767`.
- Evidence level: local source inspection and local tests, with separately
  identified existing hosted runs. A fresh Ubuntu 26 hosted run is not claimed.

## Objective and plan recorded before patch

Audit current enabled workflow definitions for the announced `ubuntu-latest`
migration, prioritize deployment, publication, security and reliability, and
change only a dependency whose compatibility risk can be demonstrated. The
pre-patch plan identified `a11y.yml:a11y-axe`, `e2e.yml:e2e-app`, and
`post-deploy-smoke.yml:smoke` as the affected jobs after reproducing the locked
Playwright failure. Success requires preserving every other executable workflow
field, parsing the workflows and shell blocks, running relevant existing guards,
and recording both baseline and post-patch typecheck outcomes.

The audit intersected current `.github/workflows/*.yml` files with both pages of
the repository's Actions workflow API. All 47 current files were active. The
API also contained historical workflow entries; those were not counted as
current definitions. At the audited source, 42 files directly selected
`ubuntu-latest`, including `ci.yml` through its OS matrix; four files delegated
to immutable reusable workflows; the exact-head screenshot workflow already
selected `ubuntu-24.04` throughout.

## Demonstrated compatibility risk and narrow change

The root lockfile resolves `@playwright/test`, `playwright`, and
`playwright-core` to `1.60.0`. Its browser download and native dependency tables
contain Ubuntu 24 targets and no Ubuntu 26 target. Playwright's official
[version 1.61 release notes](https://playwright.dev/docs/release-notes#version-161)
introduce Ubuntu 26.04 support.

The exact installed, lockfile-selected CLI was tested with its platform override
and an empty temporary browser directory. This selects the Ubuntu 26 code path
without claiming that the local machine is Ubuntu 26 and without contacting a
production service. The command returned exit 1 before any browser download:

```text
PLAYWRIGHT_HOST_PLATFORM_OVERRIDE=ubuntu26.04-x64
PLAYWRIGHT_BROWSERS_PATH=<empty temporary directory>
node node_modules/.pnpm/playwright-core@1.60.0/node_modules/playwright-core/cli.js install chromium

Failed to install browsers
Error: ERROR: Playwright does not support chromium on ubuntu26.04-x64
```

An Ubuntu 26 `install-deps --dry-run chromium` emitted `Cannot install
dependencies for ubuntu26.04-x64 with Playwright 1.60.0!`. That command returned
zero, so its exit status alone is not compatibility evidence. Browser-download
dry runs emitted URLs for the Ubuntu 24 selection and no URLs for Ubuntu 26.
The Ubuntu 24 dependency simulation also could not resolve font/Xvfb packages
from this local machine's package metadata; it is not represented as a hosted
Ubuntu 24 installation test. Existing hosted browser evidence is listed below.

| Workflow | Job changed | Temporary selector |
|---|---|---|
| `.github/workflows/a11y.yml` | `a11y-axe` | `ubuntu-24.04` |
| `.github/workflows/e2e.yml` | `e2e-app` | `ubuntu-24.04` |
| `.github/workflows/post-deploy-smoke.yml` | `smoke` | `ubuntu-24.04` |

Each job continues installing browser dependencies on both cache-hit and
cache-miss paths. The aggregator jobs remain on `ubuntu-latest`. Tests,
permissions, protected environments, event conditions, timeouts, failure
handling, action SHAs, release confirmations and artifacts are unchanged.

Revisit these temporary pins before the announced rollout completes. Remove
them only after upgrading the locked Playwright toolchain to a version with
Ubuntu 26 support and recording successful hosted Ubuntu 26 browser installation
and actual test execution, with both empty and populated browser caches. The
version upgrade must also honor the separate exact-head screenshot controller's
explicit browser-version contract. A calendar date by itself is not a reason to
remove a pin without those results.

## Other audited requirements and decisions

The comparison used GitHub's
[Ubuntu 26 image manifest](https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2604-Readme.md)
and [Ubuntu 24 image manifest](https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2404-Readme.md).
Image manifests are dated snapshots and can change before rollout.

| Area | Observed requirements | Decision |
|---|---|---|
| `READINESS-*`, readiness verifier and test jobs | Explicit setup-python 3.12 or a 3.11/3.12 matrix; explicit Python package installs; several executors invoke `gh` | These Python lines have Ubuntu 26 builds, and `gh` is included in the new image. No demonstrated migration failure; retain selectors and harden-runner controls. |
| CI, builds, public/GitHub npm publication, runtime audit and source validation | Explicit Node 24, pnpm setup and repository dependency declarations; public npm also selects Node 24.15.0 and npm 12.0.1 | Retain the declared runtimes and established release gates. No Playwright installation is executed by their non-browser jobs. |
| SBOM, vulnerability and release-signature workflows | Explicit Syft/Grype/Trivy/CodeQL/cosign installation through pinned actions; secret scanning installs and SHA-256 checks Gitleaks | Retain current controls. No reliance on an absent preinstalled scanner was demonstrated. |
| Zarf/UDS and vessel image publication | Explicit Zarf, UDS, Buildx and cosign setup; Bash, curl, Docker and yq | Docker and yq remain in the new image. The Zarf version-check job installs yq; its publication jobs use image-provided yq. No removal-based pin is justified. Docker's major-version change still needs hosted evidence at the actual release revision. |
| Lighthouse | Explicit Node setup and pinned Lighthouse action; image Chrome/Chromium facilities | No equivalent Playwright 1.60 dependency was found in this workflow. Its selector is unchanged. |
| Truth refresh and shell gates | Git, gh, jq, curl, GNU utilities; one stdlib-only Python timestamp check | Relevant tools remain in the new image; no removed Python API was found in the timestamp check. |
| Exact-head screenshot controller | Existing Ubuntu 24 pins and strict isolated runtime/source/evidence contracts | Preserve the entire file and the separate open [PR #886](https://github.com/szl-holdings/platform/pull/886). |

The four reusable callers are `doctrine-check.yml` and
`reusable-overclaim-guard.yml` at
`5b0d38fadadc073812bfc6175a1e823cd529939f`, and
`reusable-lockfile-registry-check.yml` and `pin-check-reusable.yml` at
`932817603e46212f4226347c95aeb0cc55ec58cb`, all in `szl-holdings/.github`.
Their exact referenced revisions belong in the organization audit; checking only
the reusable repository's current default branch would not establish their
behavior. This repository defines no local composite actions.

## Existing hosted evidence and its limits

The following current-main runs are from the audited source above. Their logs
identify Ubuntu 24.04; none establishes Ubuntu 26 compatibility.

| Evidence | Observed outcome |
|---|---|
| [READINESS-SECURITY run 37825814112](https://github.com/szl-holdings/platform/actions/runs/37825814112), job `113478266728` | CPython 3.12.15 setup, offline contract tests and package installation passed. Receipt publication failed with Hugging Face HTTP 401 / `RepositoryNotFoundError` for `SZLHOLDINGS/readiness-runs`. |
| [READINESS-RELIABILITY run 37823096900](https://github.com/szl-holdings/platform/actions/runs/37823096900), job `113468884648` | Same successful setup/test/install sequence and authenticated dataset publication failure. |
| [READINESS-OBSERVABILITY run 37827596078](https://github.com/szl-holdings/platform/actions/runs/37827596078), job `113484339635` | Same dataset publication failure after successful setup/test/install. A separate StepSecurity service diagnostic also appeared; its hardening configuration is preserved. |
| [Security run 37770303624](https://github.com/szl-holdings/platform/actions/runs/37770303624) | Dependency, secret, lockfile, license and aggregate security jobs completed successfully. |
| [A11y run 37770303682](https://github.com/szl-holdings/platform/actions/runs/37770303682) | All configured axe matrix jobs and the aggregate gate succeeded on Ubuntu 24; the inspected A11oy job is `113287983846`. |
| [E2E run 37770303662](https://github.com/szl-holdings/platform/actions/runs/37770303662) | Carlota Jo job `113287982951` ran its tests successfully. The A11oy test step was skipped by the existing missing-spec condition; workflow success is not evidence of A11oy E2E execution. |
| [Lighthouse run 37770303652](https://github.com/szl-holdings/platform/actions/runs/37770303652) | All configured audits and the aggregate accessibility gate completed successfully. |
| [Staging run 37770303605](https://github.com/szl-holdings/platform/actions/runs/37770303605), job `113287982689` | The job was green because its existing fail-soft behavior converted a Replit HTTP 403 into a warning. This is not a successful deployment receipt. |

Current API readback returned no runs for `post-deploy-smoke.yml`,
`npm-public-publish.yml`, `szl-zarf-publish.yml`, `cosign.yml`, and
`hosted-observability-proof.yml`. The latest GitHub Packages publish run was a
historical failure on a different source revision, and the latest release and
vessel image runs were also from older revisions. They do not prove the current
definitions. The post-deploy smoke workflow's production deployment event names
`Deploy — Production`; no workflow with that name exists among the current
definitions. Manual smoke dispatch remains configured. This audit does not
dispatch publication, deployment, external probes or notifications to obtain
compatibility evidence.

## Local verification

| Command/check | Exit | Result |
|---|---:|---|
| `pnpm typecheck` before patch | 1 | The execution environment's fallback pnpm attempted dependency setup and stopped at `ERR_PNPM_IGNORED_BUILDS`; TypeScript checking did not start. |
| `pnpm typecheck` after patch | 1 | Same pre-typecheck failure. No build approval setting was added. The package manager's incidental workspace-file edit was restored to the original bytes after each attempt. |
| PyYAML parse plus comparison against `git show HEAD:<workflow>` | 0 | Every current workflow parsed. After normalizing only the three planned runner selectors, the parsed definitions exactly matched the audited source. |
| `bash -n` for all run blocks in the changed workflows | 0 | All applicable shell blocks parsed after replacing Actions expression placeholders for syntax checking. |
| `node --test scripts/ci/lighthouse-workflow.test.mjs scripts/ci/exact-head-screenshot-evidence.test.mjs scripts/qa/scan-secrets.test.js` | 0 | Existing accessibility-gate, isolation/publication-contract and secret-scanner regressions passed, including their negative controls. |
| `node scripts/qa/scan-secrets.js <temporary copy of the four candidate files>` | 0 | No secrets found in the workflow and proof-file candidate. |
| `python -B -S -m unittest discover -s platform/agents/readiness/_lib -p 'test_*.py'` | 0 | Offline stdlib readiness regression run passed; optional crypto tests were skipped under `-S`. |
| Locked Playwright CLI with isolated Ubuntu 26 platform selection | 1 (expected) | Reproduced unsupported Chromium installation, the reason for the temporary pins. |
| `git diff --check` | 0 | No whitespace errors. |

No successful full local typecheck or fresh hosted Ubuntu 26 run is claimed.
The runner pin is supported by the concrete toolchain failure and existing
Ubuntu 24 browser runs, not by treating those limitations as passes.

## Proof and scope disposition

- Screenshot: not applicable; no UI code or rendered UI was changed.
- Public claims: this packet describes source/CI observations and their limits;
  it makes no production, customer, certification or release-completion claim.
- Security: no credential values, environment files, permission expansions,
  release bypasses or weakened failure gates were added.
- Known gaps: existing application readiness and release limitations remain;
  this is migration containment, not an application readiness promotion.
- Separate work: PR #886 and all existing exact-head controller bytes are
  preserved. No dependency-version or lockfile change is included.
- Delivery boundary: the local candidate is ready for a normal reviewed PR.
  Merge, deployment and package publication are not part of this proof.
