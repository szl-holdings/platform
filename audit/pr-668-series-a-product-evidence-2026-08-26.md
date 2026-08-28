# PR #668 Series A product view — Level 4 proof packet

- **workcell_id:** P0-SERIES-A-PRODUCT-WIRING-20260811
- **agent:** Codex
- **pull_request:** szl-holdings/platform#668
- **source_lane:** codex/series-a-product-current-main-v4
- **objective:** Publish one truth-qualified A11oy Series A route from the current
  protected-main line, make local screenshot provenance fail closed, and leave
  hosted promotion to exact-head checks and the protected pull-request path.
- **proof_level:** 4 — public route source, build, behavior, and visual proof.
  This is not a Level 5 release packet or a production-runtime witness.

## Context and root cause

The prior candidate exposed seeded buyer journeys without a single route that
kept the product story, source boundary, operational-state vocabulary,
developer path, receipt shape, and non-claims together. Its screenshot rail
also trusted a caller-provided loopback server and therefore could not prove
that captured pixels came from the validated source revision.

The repaired rail now builds into a fresh OS-temporary directory, hashes every
emitted file, serves only that immutable snapshot from an in-process node:http
listener on an OS-assigned 127.0.0.1 port, and binds the browser response to
the source SHA, source tree, manifest digest, and a per-run nonce. Foreign HTTP
and WebSocket connections fail closed before connection.

## Patch disposition

Source commit 4ca56d79a229a7207883475e368967c24c061df4, tree
cb311e5c9fb1caf8e1ccfcc9d5fea0b203ca92b6, provides:

- a self-contained /a11oy/start page with six deterministic buyer views;
- a truth-safe /a11oy/investor-demo compatibility alias to the same page;
- visible REAL, DEMO, UNAVAILABLE, DEGRADED, BLOCKED, and ROADMAP definitions,
  with no current item silently promoted to REAL;
- seven developer-verification steps and seven receipt-contract fields;
- internal fragment navigation only, with no outbound product claim;
- all tab panels mounted with resolved ARIA relationships and keyboard
  navigation for Arrow keys, Home, and End;
- an exact-source capture rail with owned build, server, network policy,
  deterministic manifesting, safe proof publication, and owned cleanup;
- behavioral coverage for output containment, digest-verified publication,
  no-overwrite behavior, tamper cleanup, and foreign HTTP/WebSocket blocking;
- corrected strict-claims verifier lookup for the tracked
  audit/launch/claim-evidence-ledger.json path without weakening its result.

## Test and doctrine loop

| Gate | Result | Observed evidence |
|---|---|---|
| Frozen workspace install | PASS | pnpm 10.26.1; 202 workspaces linked; lockfile unchanged |
| Node syntax | PASS | capture rail, helper, helper tests, and claims verifier |
| Biome | PASS | all modified source and test paths |
| Series A package suite | PASS | 16/16 tests |
| A11oy typecheck | PASS | repository-pinned package task |
| A11oy production build | PASS | Vite 8.0.16; 3,342 modules transformed |
| Brand gate | PASS | pnpm brand:check |
| Overclaim audit | PASS | 26/26 documentation claims |
| Documentation claims | PASS | 26/26 documentation claims |
| Advisory claims verifier | PASS | 90/106 working; 12 partial; 3 dormant; 1 mock; 0 broken |
| Strict claims verifier | BLOCKED | honest fail-closed Vessels/AIS mock; MARINETRAFFIC_API_KEY absent |
| Git whitespace | PASS | git diff --check |
| Secret-pattern review | PASS | no credential or .env value added |

The strict claims result was not relabeled, bypassed, or supplied with an
unapproved credential. It is a repository-wide external-authority blocker,
not a failure of the A11oy route or its capture rail.

## Exact-source screenshot proof

The local rail ran from a tracked-clean checkout with:

- SOURCE_REPOSITORY=szl-holdings/platform
- SOURCE_SHA=4ca56d79a229a7207883475e368967c24c061df4
- SOURCE_TREE_SHA=cb311e5c9fb1caf8e1ccfcc9d5fea0b203ca92b6
- SOURCE_REF=codex/series-a-product-current-main-v4
- CAPTURE_ROUTE=/a11oy/start

The result was 5/5 PASS. The promoted raw metadata is
[a11oy-series-a-capture-metadata-2026-08-26.json.txt](../docs/assets/screenshots/current/a11oy-series-a-capture-metadata-2026-08-26.json.txt),
SHA-256
EB5B78ECDCD1D8D952DA75D4BDADC61B8A48B7CC7427F13FF5AB7DA300327399.

Build identity:

- Node v24.19.0
- pnpm 10.26.1, equal to the repository pin
- Vite 8.0.16 on win32-x64 and Node v24.19.0
- lockfile SHA-256
  8CA498A12F4AF40D42D31A74DA3A193A83AB60758E13A59B0AA6F8E7DE0B0418
- canonical 344-file manifest SHA-256
  806485B29F378B1AAA38F3AF2984AB65C74A677F9CAE1282F6B7D52756B2ACD5
- entry document SHA-256
  6510BCBEC50E14BAF4AAF73DC52DECA5F3CFEF8ADE65B6008744C50935F6E26B
- build size 16,537,771 bytes
- proof nonce SHA-256
  4A64BFEA9C22C724B9FC2D38036574326850A633BECA06DAA31779D9D561068A

| Viewport | Captured at | Full document | PNG SHA-256 |
|---|---|---|---|
| 320x900 | 2026-08-26T20:39:02.479Z | 320x9155 | EEE8ED83F6E01A56EF1774EBF2C4426B9763C24A28008636511CB890FF967DCC |
| 390x900 | 2026-08-26T20:39:05.086Z | 390x8356 | C0EEEB0AE3FF7067D48D50B1038CD75EBD75709FD0289998F456C2BEB87FA6DE |
| 768x1024 | 2026-08-26T20:39:08.761Z | 768x5205 | 61A210B5C27A8CC666CD5FF1699CAE346BE8D8F5473921695C6065CA34FDB181 |
| 1366x900 | 2026-08-26T20:39:17.398Z | 1366x4620 | 431C37C0D8518D05A3F63D58F0BE1756F2CE66633C9CAC83831E7F265FDE3444 |
| 1728x1000 | 2026-08-26T20:39:20.103Z | 1728x4665 | D679D023CC298E4442EEB9A272B51B8C0D4C1220D9206547B752FF4278F59008 |

Every viewport recorded HTTP 200, exact served-build identity, document-digest
verification, six states, six exercised tabs, resolved ARIA controls, keyboard
navigation, seven developer steps, seven receipt fields, zero outbound or
missing-fragment targets, restored scroll origin, no horizontal overflow, no
console/page/API errors, no foreign network or WebSocket requests, blocked
service workers, and one intentionally stubbed Google Fonts request.

All five full-page captures were decoded and visually inspected. The responsive
layouts, copy hierarchy, truth-state badges, selected/focused tab, cards, and
non-claims remained readable without observed overlap or horizontal clipping.
The Codex desktop image renderer and optional in-app browser kernel both hit
local ACL/tooling faults; those tool faults did not replace or weaken the
repository-owned Playwright assertions.

## Security and public-claim check

- The rail removes inherited VITE_*, evidence-output, and REPL_ID values.
- It accepts only its owned exact origin, blocks service workers and
  pre-connect WebSockets, and never kills or scans for a foreign process.
- It publishes through adjacent copy, digest verification, and atomic rename;
  destination overwrite is not allowed.
- No token, credential, secret value, workflow bypass, database mutation,
  deployment, or production/customer assertion was added.
- The route is source-qualified DEMO/UNAVAILABLE evidence. Local HTTP 200, a
  passing build, and captured pixels are not deployment or customer proof.

## Promotion boundary

This packet binds the promoted screenshots to the exact source parent. An
evidence commit cannot embed its own SHA without recursion. After this packet
is committed and pushed, the final PR head must be recaptured; byte equivalence
of the five committed PNGs and the final-head receipt belong in the PR
discussion. Hosted exact-head CI, fresh review, resolution of the two review
threads, draft removal, and a normal protected squash merge remain separate
promotion gates. No administrator bypass or force push is authorized.

- **task_disposition:** source complete; protected promotion tracked in PR #668
- **deployment_disposition:** UNAVAILABLE — no deployment requested or witnessed
- **customer_runtime_disposition:** UNAVAILABLE — no customer use observed
- **recorded_at:** 2026-08-26T20:45:00Z
- **recorded_by:** Codex
