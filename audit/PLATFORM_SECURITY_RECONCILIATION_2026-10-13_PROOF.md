# Security claim and evidence reconciliation — Proof Packet

- **workcell_id:** WC-PLATFORM-SECURITY-20261013
- **agent / recorded_by:** Codex review_platform; independent collector/UI review by domain_audit and tool-mesh review by review_projections
- **recorded_at:** 2026-10-13T19:20:14.887411+00:00
- **objective:** Reconcile the active corrections in #882 with protected source and fresh bounded evidence.
- **plan_summary:** Retain current locks and admission controls, remove fabricated outcomes, validate exact-head evidence conservatively, and refresh browser qualification before normal squash.
- **patch_summary:** Design-only security pages; disabled unsupported tool handlers; read-only evidence collector; mandatory source/lock checks; descriptor-bound source reads; explicit API-codegen dependency; current repository-settings references.
- **screenshot_refs:** Fresh supplemental native E2E capture remains pending; October screenshots remain historical.
- **proof_level:** 2, local source and regression evidence only until the separately recorded hosted run completes.

## Source and historical boundary

Original #882: `8eb28c73a2dc0155438bdabdfbd199791e4d2e15`.
Initial protected source reviewed: `aaa5417bd9a1fe755a5eaaa4e45bb29c8940370c`.
Final protected publication base: `74cded3a9bb52e2e20fc93a2e990431ab9add7a0` (#881).
Its tree is `eb4e1149cb0b09043eda265eb60922b6193352d5`; all 62 candidate checks
passed/skipped, including the complete hosted Atelier suite (34 cases) and runtime
audit. #885 was closed only after that signed exact-tree squash. The original PR
history is retained as an ancestor; no historical evidence is rewritten.

The active `/security-agents` page becomes a design surface. It displays no
fabricated action count, trust score, short proof hash or operational receipt.
Its three selectors change local explanatory content only. Current routing and
the candidate banner are preserved. `/cyber-resilience` and
`/security-compliance` remain publication holds; their corrected dormant source
is not claimed as a reachable product feature.

The threat scan, alert escalation, compliance check and vulnerability report
manifests are disabled. Direct calls validate their schemas and throw the typed
unavailable result before importing a database or contacting a provider.
Existing incident-containment approval behavior remains unchanged. No new
scanner, message delivery, containment, certification or external effect exists.

## Evidence collector correction

The collector reads public metadata at the observed default-branch head. Missing,
unreadable, stale, failed, skipped, wrong-head or incomplete evidence cannot pass.
The original proposal misread the current Gitleaks step because it expected an
inline command while the reviewed workflow uses an argument array and explicitly
propagates the scanner exit status. The repair admits the exact named-step source
SHA-256 `dd607271606705264ac96c6c855f5c5f60ea0e36f6afd04ac54a61be529599c1`
from protected source, including environment, command, capture and final exit.
Duplicate job sections/keys or steps are refused. All run/head/time/job/step
bindings remain in force. A future step edit needs source review; this is not an
arbitrary shell or YAML interpreter.

Release signature asset names remain UNVERIFIED. The collector does not execute
cosign or establish cryptographic release verification; it cannot report GREEN
through that metadata-only path. Its own Khipu receipt signature is separate.

## Dependency and source-read controls

Current lock/workspace overrides, maintained braces-safe source and consumer
compatibility checks are retained. Added source/lock checks reject reintroduction
of retired signing dependencies and policy drift. They report vulnerability scan
and installed compatibility as NOT_RUN. The archived pristine-control helper has
only bounded, fixed-identity retrieval/extraction behavior; offline tests mock
retrieval. Its dated provenance JSON and import closure remain explicitly
historical, with no claim that retired Expo/node-forge consumers are installed.
No cryptographic reproduction suite or live scanner is executed in this pass.

The unresolved CodeQL source-reader finding (`4755`, thread
`PRRT_kwDORxaH7M6rPCPC`) is addressed by opening one nonblocking no-follow descriptor, admitting
its regular-file metadata, reading a bounded buffer, comparing descriptor metadata
before/after, and verifying the final named identity. All refusal paths close the
descriptor. Independent peer review found no blocking issue in this leaf-file
read boundary; it does not establish arbitrary ancestor-directory authority.
The fixed Git-tracked inventory and source/lock policy are unchanged. Fresh hosted CodeQL must confirm
the successor before the review thread can be resolved.

## Local validation

| Scope | Observed result |
| --- | --- |
| Readiness collector, all provider calls mocked | 30 cases passed independently in owner worktree |
| Existing source/lock policy regression suite | 204 cases passed |
| New bounded descriptor ordinary/refusal controls | 2 cases passed |
| Actual source/lock inspection | PASS over 207 tracked manifest inputs; scanner/installed compatibility NOT_RUN |
| Archived pristine helper, mocked retrieval/inert archive fixtures | 25 cases passed |
| Supplemental build-witness offline contract | 7 cases passed, including committed template admission and actual env-file rejection |
| Source whitespace / wrapper syntax checks | PASS |
| Tool-mesh native regression file | Independent native config/mock run:43 cases passed |
| Hosted build/typecheck/evidence/required checks | Pending final published candidate |

An initial source/lock test launch occurred before its local YAML dependency
symlink had finished materializing and failed with module-not-found. After that
preparation completed, the unchanged source-policy suite and actual graph check
passed. The peer tool-mesh run initially lacked isolated tsconfig/dependency links; after
materializing the unchanged native configuration and locked source dependencies,
its complete file passed. Neither bounded setup qualifies a full frozen workspace
installation or full workspace typecheck. The collector's unsigned-receipt fixture deliberately reports
an unsigned observation and verifies its fail-closed behavior.

Exact independently reviewed tool-mesh source SHA-256:
`71e20f00d3843954877a94dd5b54280ece5fc6709e119cd33dc8d4bc25e7b6bc`.
Regression file SHA-256:
`4ec2cea629049cb3e50b896fed5ae17868a335e73efc079697df2dbbd310436b`.

## Fresh supplemental browser plan

The native A11oy E2E job retains its existing installation, Chromium, forced
build command and localhost static server. A wrapper binds a clean source SHA/
tree and successful build to an output manifest; its error status propagates.
The additional specification covers three workflow selections and two publication
holds across five viewport sizes. It admits only localhost GET/HEAD documents and
witnessed assets, hashes response bytes, asserts the candidate/claim boundaries,
and records PNG/JSON sidecars. Current action pins and other app jobs are intact.

The native E2E base is `/`, so these are `/security-agents`, `/cyber-resilience`
and `/security-compliance` observations, not proof of `/a11oy/` production-base
delivery. The preserved canonical isolated screenshot controller is untouched;
the held page lacks its required `#main-content`, so this rail is explicitly
supplemental presentation evidence. A partial artifact is not a full pass.
Fresh compiled-browser execution remains pending before merge.

### First hosted integration result and correction

Candidate `7a2774ac7c3b5befc55e60f9accbf70486be14c5` successfully ran the
seven build-witness contracts and the forced A11oy build, but the browser job
`115500692376` stopped before tests: Playwright's CommonJS loader refused the
helper's conditional top-level `await`. The CLI now invokes its existing async
function with explicit success/error callbacks, retaining build-error propagation.
A real CommonJS subprocess regression passes without invoking the CLI.

Clean-clone jobs `115500688701` and `115500688511`, and unit job
`115500686177`, failed the unchanged required-E2E workflow contract because the
new array had replaced the explicit required specification argument. The original
`"$spec_path"` argument is restored; a separate, guarded supplemental array is
appended. No contract or required specification was removed or weakened.
The corrected local witness suite passes 8/8 and the original required-E2E
contract passes 1/1. The first local loader-regression invocation accidentally
identified the imported helper as the CLI; its argv fixture was corrected before
the passing run. The first hosted attempt produced no qualifying screenshots.

## Original proposal disposition

All original files remain accessible under the immutable source above.

- Retained active corrections: three page sources; tool-mesh source/tests;
  readiness source/tests/docs; source/lock and pristine helper closure; additive
  dependency CI; estate-contract API-codegen dependency.
- Reconciled current references: both GitHub settings JSON files now point to
  `main` and the five observed required-check names; documentation states these
  are partial references, with no provider settings operation. The operations
  index drops its obsolete final revision number.
- Atelier's additional temporary-candidate case is covered by the stronger
  independently reviewed #881/#885 composition, including deliberately aged live
  publication tests. No older Atelier implementation is restored.
- The earlier reproducibility/ONNX and cross-lane helper files are uninvoked
  historical alternatives to current protected orchestration. Current source and
  controls are preserved; old helper qualification is not relabeled as current.
- Dated audit packets, cross-lane execution documents and fifteen October image
  files remain in original immutable history. They describe earlier source,
  dependency graphs and route availability. They are not copied into a current
  screenshot catalog or promoted as current qualification. Fresh supplemental
  E2E evidence must cover the reachable design route and both publication holds.
- The complete latest gap register is preserved and extended with current
  limitations; historical local/hosted failures remain failures at their sources.

## Remaining authority

- **public_claim_check:** Design definitions, source checks and localhost images do not establish deployed runtime control, certification, customer evidence or production operation.
- **verification_notes:** Native full CI, source-bound fresh captures and normal protected squash are required. Current product-domain observations and provider/HF admission remain separately recorded and unavailable where unverified.
- **security_check:** No secrets, provider mutation, live scan, credential expansion, operational message or admission bypass is introduced.
- **known_gaps_update:** Preserve the complete register and distinguish source repair, local tests, hosted evidence, deployment and external witness.
