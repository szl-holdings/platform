# Frontier readiness integration proof

**Verified:** 2026-07-25 America/New_York

## Integration boundary

This branch is based on platform `main` at
`36e924f2c8ec34d7e725fa1da6606dfa609e9eda`. It reconciles the functional trees
from the following overlapping pull requests without rewriting a published
source branch:

| Source PR | Frozen source head | Integration treatment |
|---|---|---|
| #471 truth drift | `cbb97988f47297f67aee74afff5f90cb8bf6651f` | Included; narrow reason-required claim allowlist retained |
| #477 overclaim ledger | `3543e80494c7116d67f29d151116901d25328c5c` | Included with immutable incident evidence bindings |
| #479 clean-clone portability | `f2afb49b3dfb3e8dd5dfbe1459626b814bbccce4` | Included with current proof receipt |
| #481 vertical conformance | `67b66a65e09bb11b83c9a4680ded9f3000892354` | Included with full-SHA, freshness, SSRF, timeout, and 10,000-slash regressions |
| #482 / #489 / #492 evidence lock replacement | `a2e582f71746b278a0bb31b54cd01cccd2a46384` | Reconciled with stricter #471 truth files; added bounded allowlist parsing and exact evidence-shape validation |
| #483 consolidation plan | `603df13e881746e9b077e58795ed042c5c62da56` | Reviewed; integration retains stricter public-only redaction, omits access-controlled fingerprints/private-slot signals, and preserves the typed rollback correction |
| #484 dependency override | `a67de112a8204bb7cf90b3b39b5d02014d79a819` | Included; lock resolves `tar@7.5.21` |
| #485 evidence-led positioning | `2d19e0ea6fb6215052c7c07931775423ebde243c` | Included with changed-file claim-gate correction |
| #486 adapter validation | `c27a531dca6ca07d65f3200caed424277a950e9a` | Included with fail-closed MISP, TAXII, New Relic, and NVD boundaries plus null-NRQL aggregate handling |
| #487 Hugging Face catalog | `9f8a1eda2f61fcc8713db97ee70e509054c5d81a` | Included without replacing newer clean-clone and conformance trees |
| #491 MCP governor | `635619b8684864ebc78e47e89b53ef5bb703bec3` | Included with fail-closed capability/receipt enforcement, prototype-key canonicalization, void-result receipts, and replay-expiry guards |

The exact publication head is recorded by the integration pull request. Source
heads are evidence inputs, not merge authorization.

## Review findings closed

- Canonical truth now requires every metric, rejects future timestamps and
  malformed available values, and represents test totals as numeric fields.
- Scanner-allowlist documentation has a deterministic `--check` gate.
- Conformance URL normalization uses a bounded loop and passes a
  10,000-trailing-slash regression without weakening path validation.
- Private repository names and heads were removed from the public consolidation
  proof; the restoration command uses typed boolean form.
- Current API documentation is checked against the tracked CSRF, authentication,
  route, and schema files.
- Canonical counts include the conformance and MCP-governor additions: 158
  package directories, 211 package-plus-library directories, 198 workspace
  manifests, and 199 pnpm projects including the root.

## Verification

| Gate | Result |
|---|---|
| Frozen offline install | **PASS** — lockfile current across 199 projects |
| Clean-clone/package-manager/hook/API-codegen suite | **PASS** — 13/13 |
| Truth generator, validator, and allowlist tests | **PASS** — 14/14 |
| Generated truth versus current sources | **PASS** |
| Canonical source-of-truth validator | **PASS** — 69/69 |
| Changed-file claim-drift gate versus `origin/main` | **PASS** |
| Documentation claim gate | **PASS** — 26/26 |
| Overclaim negative suite | **PASS** — 14/14 |
| Conformance and offline-verifier suite | **PASS** — 16/16 |
| Hugging Face catalog suite and snapshot check | **PASS** — 7/7 |
| Upstream adapter validation | **PASS** — 17/17 plus package typecheck |
| AEF workflow runtime | **PASS** — 12/12 plus SDK and engine typechecks |
| MCP governor / Nexus policy | **PASS** — 14/14 and 3/3 plus both package typechecks |
| Supply-chain tar override | **PASS** — `tar@7.5.21` in the frozen lock |
| Repository-wide test graph | **PASS** — 116/116 Turbo tasks in 2m20.777s |
| Repository-wide TypeScript build | **BLOCKED BASELINE** — the root project-reference build exposes existing missing Node typings and TypeScript 6 `rootDir` migrations in unrelated libraries; the normal Turbo graph also reaches unbuilt composite declarations |
| GitHub exact-head checks | **PENDING** — must run on the published integration head |
| Independent approval | **BLOCKED EXTERNALLY** — no eligible independent collaborator exists |

## Explicit readiness gaps

- The full historical claim scan remains a remediation backlog. The required
  changed-file gate passes and prevents new drift.
- Public vertical conformance remains **0/3 verified** because live URLs,
  deployed full SHAs, and pinned public keys are unavailable; no badge or
  deployment claim is authorized.
- The root TypeScript project-reference graph requires a dedicated baseline
  migration. Focused packages touched here typecheck, but the integration does
  not label the entire 199-project graph green.
- No pull request may merge until its exact head passes required checks, every
  actionable conversation is resolved, and an eligible independent reviewer
  approves. Self-approval, protection bypass, and administrative merge are not
  authorized.
