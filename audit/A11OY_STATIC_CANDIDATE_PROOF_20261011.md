# A11oy static candidate boundary proof

- workcell_id: `A11OY-STATIC-CANDIDATE-20261011`
- agent: Codex / BuildWarden / PixelProof / ClaimGuard / SecretHawk / ProofSmith
- objective: Prepare a bounded, network-free A11oy interface candidate that can later be published at an additive preview path without changing an existing live root or API.
- source_revision: `1d4654f0feb3d23850ef20cbba31faf8bea5db1b`
- protected-main baseline: `690959d29c6d26f0f3f4a42ef91fd442067c186e`
- branch: `codex/production-hardening-20261011`
- proof_level: **4 — local source, focused tests, exact-source live UI, claim and security review**
- recorded_at: `2026-10-11T07:25:00Z`
- recorded_by: Codex

## Plan summary

The workcell limited the public candidate to a static home and one deterministic
security-agent fixture. It required a network-free browser boundary, removal of
public provider side effects, a closed route allowlist, explicit claim limits,
an exact-source build, browser request evidence, and an additive future hosting
path. Existing production roots, APIs, and deployments were outside this
source workcell and were not changed.

## Patch summary

The patch:

- replaces the prior default surface with a candidate home that states the
  runtime, external-effects, operational-evidence, and interface-evidence
  boundaries;
- admits only the candidate home and deterministic security-agent fixture and
  renders a publication hold for all other client routes;
- removes public `GraphQLProvider` and `OmniaShellProvider` initialization so
  the static candidate makes no runtime API or external-service request;
- relabels security-agent data and digest-shaped values as fixtures and removes
  the overclaiming Open Graph asset;
- adds source and built-bundle contract tests, including rejection of API
  strings, external fetch primitives, extra routes, and unexpected bundle
  files;
- adds an exact-source Playwright evidence capture that fails on foreign or
  undeclared same-origin requests; and
- narrows route smoke coverage to the two reviewed candidate routes and records
  remaining deployment and operational gaps; and
- raises the sidebar group-label color to the reviewed text-dim token so its
  contrast against the navigation background meets the WCAG AA axe contract.

## Test results

| Command | Result |
|---|---|
| `corepack pnpm --filter @workspace/a11oy test` | **MEASURED — exit 0; 50/50 Node contract tests and 5/5 Vitest UI tests passed.** Vitest printed its known close-timeout warning after successful completion. |
| `corepack pnpm --filter @workspace/a11oy typecheck` | **MEASURED — exit 0.** |
| `node --test scripts/qa/dependency-patches.test.mjs` | **MEASURED — exit 0; every dependency-patch assertion passed.** |
| `BASE_PATH=/preview/platform-a11oy/ corepack pnpm --filter @workspace/a11oy build` | **MEASURED — exit 0.** The bundle verifier admitted exactly `index.html`, one CSS asset, the main JavaScript asset, and the lazy security-agent JavaScript asset. |
| `PLAYWRIGHT_BASE_URL=http://localhost:4111/preview/platform-a11oy A11Y_ARTIFACT_NAME=a11oy CI=true corepack pnpm exec playwright test tests/e2e/a11y.spec.ts --grep "Per-Artifact Root Page" --reporter=list --project=chromium` | **MEASURED — exit 0; 3/3 accessibility checks passed, including zero critical or serious WCAG 2.1 AA axe violations.** |
| `VESSELS_URL=http://127.0.0.1:8099 corepack pnpm qa:routes --web-only` with six local web servers | **MEASURED — exit 0; 62/62 web route checks passed.** Terra used port 6100 because Fetch rejects port 6000; Vessels used the explicit 8099 override. |
| candidate-home evidence capture | **MEASURED — exit 0; HTTP 200 for the document and two declared assets; zero foreign or undeclared same-origin requests.** |
| security-agent evidence capture | **MEASURED — exit 0; HTTP 200 for the document and three declared assets; zero foreign or undeclared same-origin requests.** |
| `node scripts/docs/check-docs-claims.js` | **MEASURED — exit 0; 26/26 active documentation claims passed.** |
| `node --test scripts/qa/scan-secrets.test.js` | **MEASURED — exit 0; 17/17 scanner contract tests passed.** |
| `node scripts/qa/scan-secrets.js .` | **MEASURED — exit 0; complete repository scan reported `CLEAN — no secrets found.`** |

The normal-history merge commit
`18735710bd110f549b1a33dd1a68574c85c05f29` has two parents: the candidate
source and exact canonical main `690959d29c6d26f0f3f4a42ef91fd442067c186e`.
The final source revision above descends from that merge and contains only two
route-harness corrections and one stale contract correction after it. No rebase
or history rewrite was used.

The first final-source test rerun exposed one stale assertion in
`product-wiring-contract.test.mjs`: it still required `/a11oy/start` and
`/a11oy/atelier` in route smoke after those routes moved to publication hold.
That run exited 1 with 49/50 Node tests passing. Revision
`97e62630b5fb48a69b9a96907611b37620b9aa05` changed the assertion to require
the two reviewed routes and reject the three held routes. The full package test
was then rerun and passed 50/50 Node plus 5/5 UI tests as recorded above.

Integration CI later exposed a serious contrast violation in the sidebar group
label: the muted token measured 3.05:1 against the navigation background, below
the required 4.5:1. Revision `1d4654f0feb3d23850ef20cbba31faf8bea5db1b`
moved that label to the text-dim token. The exact-source accessibility rerun then
passed all three per-artifact checks, and both admitted routes were recaptured
from that clean revision.

## Screenshot references

- [Candidate home](../docs/assets/screenshots/current/a11oy-candidate-home-2026-10-11.png) at `/preview/platform-a11oy/` — SHA-256 `ee78b026bc2791e1e080a89e7099e2a5a1810315447d8f2ce953c450c558e27c`
- [Security-agent fixture](../docs/assets/screenshots/current/a11oy-candidate-security-agents-2026-10-11.png) at `/preview/platform-a11oy/security-agents` — SHA-256 `33142a17c2be1b91c150fd026e573018077e240f49f8bcb47ed734dbe9c2e800`
- [Screenshot catalog](screenshot-catalog.md)

Both screenshots were captured from the locally served build of the exact
source revision at 1440 by 900 using Playwright `1.60.0` and Chromium
`151.0.7922.173`. Their committed metadata sidecars bind route, timestamp,
source revision, screenshot digest, runtime versions, and every observed
request and response. Visual inspection found both surfaces stable and fully
loaded, with candidate and fixture limits visible in the application frame.

## Verification notes

The browser capture aborts on any non-GET request, foreign origin, undeclared
same-origin path, failed request, or non-200 asset response. The bundle verifier
parses the HTML resource closure, admits only fingerprinted local JavaScript and
CSS, rejects unexpected files, and scans emitted text for API routes, GraphQL,
WebSockets, external URLs, source maps, and service-worker behavior. Passing
local checks establish the candidate source and bundle boundary only.

## Public claim check

The modified UI calls itself a candidate demo and labels all displayed agent
data as deterministic fixtures. It explicitly says that it does not establish
production operation, customer outcomes, certification, external attestation,
model execution, market leadership, or durable signed proof. No public copy
turns a local test, build, screenshot, or digest-shaped fixture into a deployed
or independently witnessed claim.

## Security check

The candidate initializes no API client or provider, emits no externally hosted
resource, and makes no observed runtime request beyond its document and
fingerprinted assets. The changed source and evidence set contain no committed
secret, token, `.env` file, or runtime credential. Hosting and deployment
credentials remain outside this repository and outside this proof packet.

## Known gaps update

`docs/operations/known-gaps.md` records that deployment, DNS publication,
production readiness, authenticated operations, durable evidence, external
provider execution, customer use, and independent witness remain unavailable or
unknown. The static candidate closes only the public browser side-effect and
claim-boundary gaps.

## Limitations and nonclaims

This packet establishes local source behavior, focused tests, an exact-source
static bundle, and exact-source browser request evidence. It does not establish
a hosted preview, a production deployment, service availability, customer use,
business results, compliance, model quality, scientific validity, independent
security review, or an external witness. A later deployment must bind its own
manifest and runtime receipts to a merged source revision.
