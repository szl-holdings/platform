# P0 Series A product wiring — current-main successor disposition

- **task_id:** P0_SERIES_A_PRODUCT_WIRING_20260811
- **repository:** szl-holdings/platform
- **pull_request:** #668
- **source_lane:** codex/series-a-product-current-main-v4
- **status:** MERGED_SOURCE; HOSTED_CAPTURE_UNAVAILABLE
- **promotion_authority:** protected pull-request checks and normal squash merge
- **owner:** solo builder, with Codex execution and auditable receipts

## Protected promotion receipt

- **final_pr_base:** `0bf6019093935d72f8d5d8deba02dcb9243261d6`
- **final_pr_head:** `6a79dcfd76c13cd2fb402015bcdbfa5223d602b5`
- **final_pr_tree:** `5dafa42faa20c11e13581d79c6de2c6f2fedde1e`
- **protected_merge:** `6bde2b6f2e0a360f31a87c3e8228c141b062585e`
- **protected_merge_tree:** `5dafa42faa20c11e13581d79c6de2c6f2fedde1e`
- **merged_at:** `2026-08-28T17:32:30Z`
- **merge_signature:** GitHub-verified and GitHub-signed
- **current_main_witness:** `bd1e62dea8b229f2e437b01488e76facb4c81b1c`
  retains the merge as an ancestor as observed on 2026-09-04

The five final PR commits carried valid DCO trailers but were reported by
GitHub as unsigned. The ordinary squash merge created one verified protected
commit with the exact final PR tree. This establishes signed protected source;
it does not retroactively make the branch commits cryptographically signed.

## Lineage

This is the current-main successor record for the P0 product-wiring task. It
does not copy the stale predecessor branch state or represent predecessor
screenshots, test counts, workflow runs, commits, or deployment claims as
current. The live promotion state is tracked on PR #668 so this source record
does not require a self-referential commit loop.

## 2026-09-04 protected-head reconciliation

The retained `codex/p0-platform-work-20260811` lineage was reconciled without
force-pushing onto protected main `bd1e62dea8b229f2e437b01488e76facb4c81b1c`,
tree `2ad5ce38ece5476e38b29d0ef00521884dc484df`. That base contains the
parsed High/Critical dependency-audit correction from protected commit
`d878d23fc3a6ec332f366bbbd7e9f5e00d9e8df5` and the verified mirrored-asset
lint correction from protected commit `bd1e62dea8b229f2e437b01488e76facb4c81b1c`.

The protected asset correction makes JavaScript's existing `var` hoisting
explicit for two declarations in each byte-identical Sentra and Vessels public
hologram asset, closing four hosted diagnostics without changing branch or
assignment behavior. Direct Node syntax checks, byte-parity comparison, Biome
2.4.16 focused and repository lint, Oxlint, environment-coverage, and
whitespace checks pass locally. Both local Vite builds reached chunk
rendering, then stopped on the partially linked local workspace's unresolved
`graphql-ws` to `graphql` import. A local production-build pass is therefore
not claimed; clean hosted exact-head CI is the promotion authority for this
reconciliation.

## Objective

Provide one investor-ready A11oy source route that shows the product thesis,
six buyer views, six operational truth states, the governed Observe-Gate-Act-
Prove loop, developer verification steps, receipt fields, and explicit
non-claims. Bind its visual evidence to exact locally built bytes without
trusting a foreign preview server.

## Dispositions

| Requirement | Disposition | Evidence |
|---|---|---|
| /a11oy/start product route | COMPLETE | source commit 4ca56d79a229a7207883475e368967c24c061df4 |
| /a11oy/investor-demo compatibility | COMPLETE | resolves to the same truth-safe SeriesAView |
| Six buyer views | COMPLETE | Cyber, Finance, Data, Enterprise, Real estate, Legal |
| Six truth states | COMPLETE | REAL, DEMO, UNAVAILABLE, DEGRADED, BLOCKED, ROADMAP |
| Silent production promotion | BLOCKED BY DESIGN | no current item qualifies as REAL |
| Developer path | COMPLETE | seven repository-native verification steps |
| Receipt contract | COMPLETE | seven required receipt fields; no fabricated receipt |
| Tab accessibility | COMPLETE | resolved ARIA controls plus Arrow/Home/End behavior |
| External navigation | CLOSED | internal fragments only on the qualified route |
| Exact-source capture rail | COMPLETE | owned build/server, full manifest, response identity |
| Capture publication safety | COMPLETE | adjacent copy, digest verification, atomic rename |
| Local five-viewport proof | PASS, NON-AUTHORITATIVE | 320, 390, 768, 1366, and 1728 widths |
| Source tests, typecheck, build | PASS | 16/16 tests, typecheck, Vite production build |
| Brand and documentation claims | PASS | brand gate plus both 26/26 claim checks |
| Repository strict claims | BLOCKED | Vessels/AIS remains mock without MARINETRAFFIC_API_KEY |
| PR-head checks and review threads | COMPLETE | 52 successful checks, 3 expected skips, and all 4 threads resolved on the final PR head |
| Hosted exact-head screenshot capture | UNAVAILABLE | workflow-dispatch run 33013248530 failed before capture while invoking pnpm under the isolated candidate identity |
| Screenshot-controller repair | COMPLETE, NOT RETROACTIVE | protected PR #690 repaired the candidate-readable pinned pnpm path after #668 merged; its green controller checks do not create a #668 capture receipt |
| Protected-main promotion | COMPLETE | normal squash merge `6bde2b6f2e0a360f31a87c3e8228c141b062585e`; no deployment inferred |
| Deployment witness | UNAVAILABLE | no deployment requested or observed |
| Customer runtime witness | UNAVAILABLE | no customer use or production outcome observed |

## Doctrine loop receipt

1. **Context:** reconstructed the bounded product delta on the current protected
   main line and audited the two open P1 review findings.
2. **Plan:** close screenshot freshness and foreign-loopback trust before
   promotion; keep production and customer claims fail closed.
3. **Patch:** implemented the self-contained product route, exact-source capture
   rail, safe publication helper, behavioral tests, and verifier path repair.
4. **Test:** used the repository-pinned pnpm, focused tests, typecheck, build,
   formatting, brand, claims, whitespace, and secret checks.
5. **Screenshot:** captured five full pages from a rail-owned immutable build;
   every promoted PNG digest matches its metadata.
6. **Verify:** independently recomputed the 344-file canonical manifest and
   visually inspected the responsive outputs.
7. **Proof:** refreshed the Level 4 packet, screenshot catalog, known-gaps
   boundary, and this disposition.
8. **Commit/promotion:** PR #668 merged normally as verified protected commit
   `6bde2b6f2e0a360f31a87c3e8228c141b062585e`, preserving final tree
   `5dafa42faa20c11e13581d79c6de2c6f2fedde1e`. PR-head checks completed and
   all four review threads were resolved. The separately dispatched hosted
   screenshot job failed before capture, so no hosted exact-head screenshot
   receipt is claimed. PR #690 later repaired the controller path without
   retroactively changing that evidence state.

## Non-claims

MERGED_SOURCE means the bounded implementation is present in protected source.
It does not mean deployed, production healthy, customer adopted, externally
integrated, or independently witnessed at runtime. It also does not convert a
failed hosted screenshot run into a pass. Those states require their own
witnessed evidence and are never inferred from HTTP 200, a local build, a
screenshot, a branch push, a later controller repair, or a green check on a
different commit.

## 2026-09-24 product upgrade continuation

The retained task branch incorporates protected source
`ff8e29514a6560e269a875027db240b580b05b25` without rewriting history.
Source `6ca620d578c39a9b97a47259445782bf6b58f159`, tree
`12c6248a9ec6f0efa3d4f3556ba99d8b24cbbb7f`, completes the qualified product
journey, DEMO Workcell availability contract, responsive fixture/evidence
surfaces, accessible mobile drawer, and correct replay pause/resume controls.

Local qualification: 23 source/helper contracts, 9 browser layout regressions,
37 runtime tests, three affected-package typechecks, production build, 155
browser states, and 75 exact-source screenshots. All image and receipt digests
were independently read back. Evidence is LOCAL_NON_AUTHORITATIVE; existing
PR #601 is closed and was not reopened. No merge or deployment is inferred.

Full receipts, command outcomes, rejected/superseded attempts and remaining
aggregate/strict-claims/provider boundaries are recorded in
`audit/P0_SERIES_A_PRODUCT_UPGRADE_20260924.md` and `audit/screenshot-catalog.md`.
The old unreproducible `8243029` is BLOCKED/SUPERSEDED, not silently recovered.
This dated continuation does not replace the historical PR #668 disposition.

## 2026-09-25 current-source completion

Protected source `9e58f052a7fba212bc74dcc4fd92adc412ffa865` was merged normally;
current source `c62cac56e4ea84ccff641e0cc119bfe67278e577`, tree
`6d85c83195d3dd529df9e03a6360bc232cec60b7`, passed the complete owned build,
155 interaction states and 75 screenshots with zero failures (wrapper exit 0).
The capture verifier now awaits the exact lazy-route identity, closing the
boot-marker race without weakening content, link or layout gates.

Fresh qualification also passed 23 source/helper tests, 9 layout regressions,
37 runtime tests, 190 shared-contract tests, four scoped typechecks, docs claims
and brand validation. Full command/attempt/proof/publication receipts are in
`audit/P0_SERIES_A_PRODUCT_UPGRADE_20260925.md`. Evidence-only successors keep
the captured source identity. DEMO/provider/aggregate/hosted/deployment boundaries
remain explicit; no production readiness or PR reopening is inferred.
