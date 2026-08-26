# P0 Series A Product Wiring

Updated: 2026-08-26

## Status

`SOURCE_CARRIED_FORWARD / REPAIRED_HOSTED_RECAPTURE_IMPORTED_FOR_PR656_HEAD / SUCCESSOR_FINAL_HEAD_CI_REVIEW_MERGE_PENDING`

The reviewed Series A product delta was consolidated in Platform PR #656 and has now been carried forward onto current `origin/main` as successor branch `codex/series-a-proof-successor-20260826`. The first hosted capture run `32364821536` remains superseded because its full-page images started below the scroll origin. Repaired GitHub Actions run `32376800750` captured the PR #656 final head `0ca011c41184f809bddf184ca494f08224f71791` with `scroll_origin: true` at all five viewports, and those repaired PNGs plus metadata are imported as current hosted presentation evidence for that source revision. The successor branch still requires fresh exact-head CI/review before any protected merge. Nothing in this task claims deployment, production runtime, customer use, revenue, compliance, or model performance.

## Objective

Provide one coherent A11oy investor entry point that:

- exposes six buyer-oriented decision views;
- uses the shared `Observe -> Gate -> Act -> Prove` grammar;
- distinguishes available source from demo, blocked, and unavailable states;
- preserves keyboard and responsive behavior;
- binds screenshots to an exact hosted source revision; and
- keeps missing GraphQL and Omnia server operations fail closed.

## Review repair plan

Before patching the current PR head, the repair plan is to:

1. remove the final stale workflow-count claim without weakening Truth drift;
2. expose the Series A contract suite through the package's normal `test` task;
3. reset capture scroll state and wait for layout stability after exercising tabs;
4. complete every per-capture catalog field and supersede the displaced-header
   imports until a fresh exact-head hosted artifact is captured and imported; and
5. run the focused contract suite, A11oy and Omnia typechecks, Truth checks,
   formatting, lint, metadata verification, and diff review.

Success requires every local check available in this environment to pass and no invalid screenshot to remain labeled current proof. The repaired PR #656 capture is imported; the current-main successor branch must still pass its own fresh exact-head CI after push.

## Exact provenance

| Field | Value |
|---|---|
| Repository | `szl-holdings/platform` |
| Worktree | `C:\Users\steph\Documents\Codex\2026-08-26\prior-conversation-with-codex-conversation-role-10\work\platform-series-a-successor-20260826` |
| Branch | `codex/series-a-proof-successor-20260826` |
| Prior pull request | #656 (closed) |
| Protected base | `48b0ea169de75990e44b6ec924e59fe7d76e6020` |
| Signed product-source commit | `69285dd8450fc86db5ec5ba59986d36333d79f75` |
| Product-source tree | `1774cf19daa8689287dea98540a744d7847eea9c` |
| Superseded hosted capture run | 32364821536 |
| Repaired hosted capture run | 32376800750 |
| Repaired hosted artifact ID | 9409395738 |
| Repaired artifact digest | sha256:cbe034bfd9b28c68fee191913c0dfe0ed6ecbbceb36d991db45c0a36c1a0b823 |
| Repaired capture metadata SHA-256 | 55979e0cb408bac56d074fa794ed58bfa20e111fdd095dc72df0725100cdb3a4 |

## Implemented contract

- `/a11oy/start` is the canonical investor route.
- `/a11oy/investor-demo` preserves the existing 12-step guided product story;
  the new six-view Series A surface does not replace it.
- Cyber security, finance, data governance, enterprise operations, real
  estate, and legal use one typed six-view model.
- External actions stay staged and blocked.
- GraphQL and Omnia server operations stay unavailable when no verified
  backend route exists.
- The exact-head workflow builds, serves, captures, hashes, and uploads five
  responsive views.
- Canonical workflow-count surfaces now measure 46 tracked workflows.

## Hosted evidence

Run `32364821536` passed automated capture assertions but remains superseded because direct review found the sticky header displaced after tab interaction. Run `32376800750` used the repaired script against source commit `0ca011c41184f809bddf184ca494f08224f71791` and artifact `9409395738`; its metadata records `PASS`, `scroll_origin: true`, HTTP 200, the expected accessible heading, six exercised tabs, no horizontal overflow, zero console/page errors, and zero undeclared API requests at every width. The five repaired PNGs and metadata sidecar are imported in `docs/assets/screenshots/current/` and cataloged in `audit/screenshot-catalog.md` as hosted presentation proof for that exact PR #656 head.

## CI disposition

At product-source commit `69285dd8450fc86db5ec5ba59986d36333d79f75`,
Source of Truth, Commitlint, DCO, security, lockfile, README, doctrine, schema,
dependency review, and screenshot-capture automation were observed green. Truth
drift correctly found ten prose surfaces still stating the prior workflow count.
This evidence-only commit advances those exact references to canonical 46.

The closed PR #656 final head had green CI, including the repaired screenshot workflow. The current-main successor branch must receive fresh exact-head CI and review before any protected merge. Prior green runs are recorded as evidence, not substituted for successor-head gates.

## Residuals

- No verified GraphQL server resolver or authenticated route exists.
- Omnia network mutation endpoints remain absent.
- Full deployment and domain readback are outside this source task.
- Hugging Face publication and mutation are outside this task.
- PR #656 is closed and was conflicting with current main; this successor branch carries the work forward without rewriting that branch.
- Successor-head CI and protected review remain required before merge. The imported repaired screenshots prove the older PR #656 final head, not deployment or production behavior.
- Production receipts, customers, revenue, compliance, and model-performance
  claims remain unproven.

## Non-claims

This task records pushed source and hosted presentation evidence only. It does
not claim protected merge, deployment, production behavior, live integrations,
external-font delivery, customer use, revenue, compliance, or an independent
runtime witness.
