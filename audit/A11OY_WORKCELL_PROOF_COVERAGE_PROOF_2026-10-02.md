# A11oy Workcell Proof Coverage Inspector proof

- `workcell_id`: `A11OY-WORKCELL-PROOF-COVERAGE-20261002`
- `agent`: Codex / Pathfinder / PatchPilot / PixelProof / ClaimGuard / ProofSmith
- `objective`: Study relevant public leaders from official, revision-pinned sources; derive an original A11oy improvement; implement a conservative Workcell proof-coverage interface that exposes missing or contradictory evidence without overstating verification; and leave reproducible Level 4 proof.
- `plan_summary`: Audit the repository and cloud setup, study orchestration/observability/governance/durable-execution/attestation patterns, document source and license boundaries, implement a pure evidence-join evaluator plus a responsive inspector on the existing Workcell replay route, add adversarial and browser coverage, run repository-wide checks, obtain independent review, then capture and catalog the exact committed source.
- `patch_summary`: Research commit `e22b494dc` adds an 18-project, commit-pinned leader-pattern study. Implementation commit `677c9ab3e` adds the 12-obligation evaluator, responsive DEMO inspector, three local challenge controls, polite live status, fail-closed approval consistency checks, unit/source/browser contracts, screenshot reveal requirement, and an explicit known-gap record. No vendor code, copy, visual assets, or trade dress were imported.
- `test_results`: Detailed commands and results are recorded below, including non-passing infrastructure checks.
- `screenshot_refs`: Desktop and mobile exact-source JPEGs are linked below and recorded in [`audit/screenshot-catalog.md`](screenshot-catalog.md).
- `verification_notes`: The final independent review found no remaining implementation, claims, accessibility, or browser-QA blocker. The current `wc-001` fixture remains honestly `INCOMPLETE` at 5/12 obligations; the UI never upgrades an unresolved reference or hash-shaped string to cryptographic proof.
- `public_claim_check`: Passed. The surface is marked `DEMO`, describes deterministic fixture joins, keeps A11oy at `Partial`, and explicitly excludes signatures, durable storage, operator identity, external attestation, and production execution.
- `security_check`: Passed for the scoped change. No secret, token, `.env` value, or ordinary-variable substitute for a secret was added. Exact-source capture admitted only loopback/data/blob browser requests and reported no browser errors or undeclared origins.
- `known_gaps_update`: `docs/operations/known-gaps.md` revision 31 records that missing policy/approval registries, durable persistence, authenticated identity, external attestation, trust-policy verification, and production execution remain open. `docs/APP_STATUS.md` remains unchanged at `Partial`.
- `proof_level`: **4 — Full Proof, local exact-source authority only**
- `recorded_at`: `2026-10-02T23:48:49Z`
- `recorded_by`: Codex / ProofSmith

## Source and evidence identity

- Repository: `https://github.com/szl-holdings/platform.git`
- Local ref at capture: `work`
- Captured source revision: `677c9ab3ed6ce8d1d839c264a49f9a61f3646c74`
- Captured source tree: `73efe371333fd5162f9eca9d5fdd38198c313871`
- Source commit time: `2026-10-02T23:41:59Z`
- Capture authority: `LOCAL_NON_AUTHORITATIVE`
- Runtime: Linux `6.18.44` x86_64; Node `v24.19.0`; pnpm `10.26.1`; Chromium `151.0.7922.173`
- Exact-source Vite output manifest SHA-256: `fcd0a69cc767b268bd47db285dee3b6d2c733bf65b8ba02a44c56c6b99051139`
- Capture script snapshot: [`a11oy-workcell-proof-coverage-capture-2026-10-02.mjs.txt`](a11oy-workcell-proof-coverage-capture-2026-10-02.mjs.txt), SHA-256 `8b431474f90c6728ceabf2d6b851c6dca3ae91c8f604f32ad96f97e8201926e3`

The implementation commit was clean before the `/tmp` build and capture. This
Proof Packet and its image/catalog metadata are a documentation-and-evidence
successor; they do not relabel the captured source revision.

## Research and implementation result

The public-source study covers 18 official repositories at exact revisions and
separates source observations from A11oy design conclusions. It records MIT,
Apache-2.0, CC BY, Elastic License, restricted-enterprise, ISC-metadata, and
Community Specification license boundaries where relevant. The work is a
source-informed original implementation, not a formal clean-room process.

The resulting inspector evaluates 12 deterministic obligations across Workcell
signals, the PCE contract, action and trace identifiers, policy and approval
references, Proof Packet identity/context/subject/reference agreement, and
terminal fixture state. `COMPLETE` is possible only when all obligations are
`SATISFIED`; any `MISMATCH` or `UNAVAILABLE` result keeps the aggregate
`INCOMPLETE`.

Three in-memory challenges remove the proof reference, substitute the action
ID, or omit the approval reference. Each changes only evaluator input. Reset
restores the baseline result. A no-approval Workcell cannot hide stale or
contradictory approval references, and Workcell/ActionBrief approval-policy
disagreement fails closed.

## Test results

All commands used the existing workspace dependency installation. The pinned
Playwright browser was unavailable while environment egress remained disabled;
the final browser checks used the installed system Chromium explicitly.

### Passing checks

- `node artifacts/a11oy/test/workcell-proof-coverage.test.ts`: **exit 0; 7/7** evaluator tests, including contradictory packet context, policy/approval references, no-approval references, approval-policy disagreement, missing contract, and input challenges.
- `pnpm --filter @workspace/a11oy typecheck` with the recorded pnpm/Corepack/store environment: **exit 0**.
- `pnpm exec biome check artifacts/a11oy/src/lib/workcell-proof-coverage.ts artifacts/a11oy/src/components/WorkcellProofCoverage.tsx artifacts/a11oy/test/workcell-proof-coverage.test.ts scripts/qa/a11oy-product-interactions.mjs`: **exit 0; 4 files checked, no fixes** after the final adversarial repair. Earlier scoped formatting checks also passed.
- `pnpm exec turbo run typecheck --env-mode=loose --concurrency=3`: **exit 0; 185/185 tasks successful**.
- `pnpm exec turbo run test --env-mode=loose --concurrency=3`: **exit 0; 123/123 tasks successful**. The A11oy package executed **36/36** tests.
- `pnpm exec turbo run build --env-mode=loose --concurrency=3`: **exit 0; 46/46 tasks successful** on the permitted host execution path.
- `PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/chromium A11OY_URL=http://127.0.0.1:43110 node scripts/qa/a11oy-product-interactions.mjs`: **exit 0; 175/175 states PASS** at widths `320`, `390`, `768`, `1366`, and `1728`. This covered all 15 planned routes, each proof challenge, live-region state, reset restoration, minimum control size, status wrapping, viewport/clipping/horizontal/text overflow, browser errors, and undeclared network origins.
- `pnpm docs:claims-check`: **exit 0; 26/26** documentation claim checks.
- `pnpm audit:copy`: **exit 0**.
- `node --import tsx scripts/check-env-coverage.ts`: **exit 0; 3 configured artifact coverage checks passed**.
- `node --import tsx scripts/brand-check.ts`: **exit 0** on the permitted host execution path.
- `git diff --check`: **exit 0** before the source commits and again before evidence packaging.
- `pnpm --filter @workspace/a11oy exec vite build --config vite.config.ts --outDir /tmp/a11oy-workcell-proof-coverage-677c9ab3 --emptyOutDir`: **exit 0; 3,346 modules transformed** from the clean capture revision.
- `node /tmp/capture-a11oy-workcell-proof-coverage.mjs`: **exit 0; 2/2 direct JPEG captures**. Both routes returned HTTP 200, `data-screenshot-ready` and fonts resolved, blocked placeholder copy was absent, no browser error or undeclared origin was observed, and the target inspector was visible.
- `node /tmp/verify-a11oy-proof-evidence.mjs` on the permitted host execution path: **exit 0**. It resolved the captured source tree, rehashed both committed JPEGs, matched both sidecars and catalog entries, and confirmed all 14 required Proof Packet field labels.
- Independent implementation re-review: the initial approval-reference loophole was reproduced and fixed; the final reviewer reported **no remaining code, claim, accessibility, or browser-QA blocker**.
- Independent research review: **18 source snapshots and 70 source links** were checked for revision, path/line anchors, license boundaries, and observation-versus-recommendation wording; all substantive findings were resolved.

### Non-passing or qualified checks

- `pnpm qa:routes`: **exit 1; 86/86 route probes could not connect** because the repository-wide application services were not running. This did not diagnose a route regression. The patch adds no route; the existing modified route subsequently returned HTTP 200 and passed the full 175-state production-browser matrix at five widths.
- `pnpm --filter @workspace/a11oy test:product-layout`: **exit 1** because the pinned Playwright Chromium executable was not installed and disabled egress prevented downloading it. The same layout collector was then exercised successfully in the 175-state matrix with system Chromium `151.0.7922.173`.
- The first sandboxed repository build attempt encountered an `EPERM` when the estate-contract release check spawned Git. The permitted host rerun completed **46/46** tasks with exit 0; no source change was made to bypass the check.
- Two initial evidence-validator harness invocations did not complete: one inline `node -e` command had shell-quoting syntax failure, and the file-backed sandbox run hit the same child-Git `EPERM` boundary. No product assertion ran in either attempt. The unchanged file-backed validator then passed on the permitted host path as recorded above.
- `node scripts/validate-markdown-assets.mjs`: **exit 0**, but reported nine pre-existing missing `audit/launch/*` targets and rewrote its tracked report. That unrelated generated change was restored exactly; the research links received a separate source-by-source review. This validator is not claimed as a clean link gate.

## Screenshot references and visual verification

- [Desktop — 1366x900](../docs/assets/screenshots/current/a11oy-workcell-proof-coverage-desktop-2026-10-02.jpg), route `/a11oy/workcells/wc-001/replay`, SHA-256 `4b867ba9ecbf1952d2147ef6de6349be57c2237ac78ab2f6602cc31363cb1f4a`; [metadata](a11oy-workcell-proof-coverage-desktop-2026-10-02.screenshot.json).
- [Mobile — 390x900](../docs/assets/screenshots/current/a11oy-workcell-proof-coverage-mobile-2026-10-02.jpg), route `/a11oy/workcells/wc-001/replay`, SHA-256 `99a0aca18856155e1769f955329f10b13233c5491e60be300b380f57f67a5082`; [metadata](a11oy-workcell-proof-coverage-mobile-2026-10-02.screenshot.json).
- Catalog: [`audit/screenshot-catalog.md`](screenshot-catalog.md), “A11oy Workcell Proof Coverage Inspector — 2026-10-02 exact-source local proof.”

Both images were captured directly as JPEG at the recorded viewport. Visual
inspection confirmed the A11oy app frame, inspector title, DEMO qualifier,
`INCOMPLETE` baseline, `5/12` count, challenge controls, stable loaded content,
responsive card layout, and absence of placeholder/error/loading states. No
crop, overlay, post-capture conversion, synthetic generation, or image edit was
used.

## Verification and claim boundaries

The evaluator proves only deterministic agreement and resolution across the
supplied fixture collections. The current route supplies no policy-evaluation
or approval-record registry. It does not authenticate an operator, fetch a
trace record, verify a signature/trust root, establish append-only durability,
witness an external side effect, or prove a hosted deployment. A string in a
packet hash field is not treated as signature verification.

The cloud-environment onboarding draft was separately validated for Node 24,
pnpm 10.26.1, frozen dependency installation, workspace-local caches, Vite and
shared-proxy startup, health checks, and focused verification. It requires the
user-facing **Environment Settings → Review & Publish** action before its
restricted network policy becomes live; that publication state is not claimed
by this source Proof Packet.
