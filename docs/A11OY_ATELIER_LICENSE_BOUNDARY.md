# A11oy Atelier Proofweave — Public Source and License Boundary

**Snapshot:** 2026-08-30

**Evidence class:** `DECLARED` implementer record; not an independent provenance audit

**Inventory scope:** Dated snapshot only; not a current or exhaustive xai-org inventory

**Release use:** Reference and independent pattern analysis only

**Code imported from xAI sources:** `DECLARED` — none intentionally imported by the implementer

**Prompts, weights, UI, branding, copy, or trade dress imported:** `DECLARED` — none
intentionally imported by the implementer

## Purpose

This register records the public xAI GitHub, publication, model-card, and safety sources considered
while shaping the original A11oy Proofweave compiler. It separates learning from public patterns
from copying protected expression. Repository visibility is not a license, a provider subscription
is not a source license, and a GitHub contribution record is not proof of employment or ownership.

The implemented release is a deterministic plan compiler. It does not fetch these sources at
runtime, invoke an xAI service, load model weights, execute research, or incorporate third-party
code.

This is a scoped primary-source register, not an exhaustive scholarly bibliography. The xAI
announcements, model cards, system cards, framework documents, and repository descriptions below
are vendor disclosures. Unless a row explicitly says otherwise, they are not peer-reviewed
research and are not independent validation of vendor performance or safety claims.

## Official `xai-org` repository register

The following nine repositories were visible in the official
[`xai-org`](https://github.com/xai-org) organization at the snapshot date. License labels were
checked against the repository root and GitHub metadata. Each record remains subject to its exact
file-level terms and revision; this table is not legal advice.

| Repository | `MEASURED` license/status at snapshot | Boundary for this release |
|---|---|---|
| [`grok-1`](https://github.com/xai-org/grok-1) | [Apache License 2.0](https://github.com/xai-org/grok-1/blob/main/LICENSE.txt). The repository describes the open Grok-1 architecture and released Grok-1 weights. | Reference only. No architecture code or weights copied, downloaded, converted, or executed. This license does not extend to later Grok models or services. |
| [`grok-build`](https://github.com/xai-org/grok-build) | [Apache License 2.0](https://github.com/xai-org/grok-build/blob/main/LICENSE) with a repository [third-party notices file](https://github.com/xai-org/grok-build/blob/main/THIRD-PARTY-NOTICES). Public first-party harness/TUI source; its history is synchronized from another source. | Pattern study only. No agent-loop, tool, terminal UI, extension, checkpoint, or workflow code copied. Any future reuse would require exact-revision and notice review. |
| [`grok-build-plugin-cc`](https://github.com/xai-org/grok-build-plugin-cc) | [Apache License 2.0](https://github.com/xai-org/grok-build-plugin-cc/blob/main/LICENSE) with a repository [NOTICE](https://github.com/xai-org/grok-build-plugin-cc/blob/main/NOTICE). | Reference only. No plugin code, commands, prompts, or product naming copied. |
| [`x-algorithm`](https://github.com/xai-org/x-algorithm) | [Apache License 2.0](https://github.com/xai-org/x-algorithm/blob/main/LICENSE). Its public tree omits some build/deploy files and imports from infrastructure that is not included. | Reference only. No ranking or recommendation code copied. The public tree is a limited source release and must not be represented as every component or the complete production system. |
| [`xai-sdk-python`](https://github.com/xai-org/xai-sdk-python) | [Apache License 2.0](https://github.com/xai-org/xai-sdk-python/blob/main/LICENSE). | API-shape research only. A11oy Proofweave does not import the SDK or call the API. |
| [`xai-proto`](https://github.com/xai-org/xai-proto) | [Apache License 2.0](https://github.com/xai-org/xai-proto/blob/main/LICENSE). | Protocol reference only. No protobuf definition or generated client copied. |
| [`grok-prompts`](https://github.com/xai-org/grok-prompts) | [GNU AGPL v3](https://github.com/xai-org/grok-prompts/blob/main/LICENSE). | Reference only. No system prompt, bot prompt, wording, behavioral script, or derivative prompt copied. AGPL material is outside the incorporation allowlist. |
| [`xai-cookbook`](https://github.com/xai-org/xai-cookbook) | [Custom Beta Testing License](https://github.com/xai-org/xai-cookbook/blob/main/LICENSE); GitHub reports `NOASSERTION`, not an SPDX permissive license. | Reference only. No notebook, example, prose, or code copied. Custom-license material is outside the incorporation allowlist. |
| [`plugin-marketplace`](https://github.com/xai-org/plugin-marketplace) | `MEASURED` at the snapshot: no blanket root license in the checked tree. The catalog states that individual plugins may carry their own terms. Absence of a root license is not permission to reuse. | Catalog-pattern reference only. No plugin, index, manifest, skill, agent, hook, MCP configuration, or copy imported. Each future candidate would require its own exact-source license review. |

### `MEASURED` default-branch revisions at the snapshot

These are observation coordinates from 2026-08-30, not source-integrity receipts. Proofweave does
not fetch them, resolve them, verify reachability, or bind them to bytes at compile time.

| Repository | `MEASURED` default-branch revision |
|---|---|
| `grok-1` | `7050ed204b8206bb8645c7b7bbef7252f79561b0` |
| `grok-build` | `bc7f02eddd3d84085849dc19ed216f11c23b0571` |
| `grok-build-plugin-cc` | `92b76a670713335229644e94add15ab40c80e547` |
| `x-algorithm` | `bc8e5f0f07b31337bfdcaf690121498e00199b64` |
| `xai-sdk-python` | `4dab6a449736890a70d20bc886221a4219ff6ae7` |
| `xai-proto` | `723dd2aa22d17be35617463837dc47cda008d90e` |
| `grok-prompts` | `a7c186f5ccac95875c0041aed60398f6ecb6d6c7` |
| `xai-cookbook` | `01d842179c4c41c326bd8ce8aa65edce9c9c231d` |
| `plugin-marketplace` | `5f0834b815305cc9c46d6f108e35dcdeef3543f3` |

The synchronized [`grok-build` `SOURCE_REV`](https://github.com/xai-org/grok-build/blob/main/SOURCE_REV)
reported upstream source revision `d5a0335a47221e8c9519936cb693e9b6450227ec`. That value is
distinct from the observed public mirror commit and does not by itself provide the omitted
upstream history or an exact-byte provenance receipt.

### License-handling rule

- `Apache-2.0`, `MIT`, `BSD-2-Clause`, `BSD-3-Clause`, and `ISC` may pass the compiler's
  *declaration-level* permissive-license check for a code material with an operator-declared,
  syntactically valid 40-hex Git revision. This does not incorporate code or complete legal review.
- Any future Apache-2.0 reuse must preserve applicable copyright and license text, review and carry
  required notices, mark modifications where required, inventory third-party material, and bind the
  exact reused bytes to a verified source revision.
- AGPL, a custom license, `NOASSERTION`, or no root license is reference-only for this release. No
  code, prompt, prose, or other protected expression from those sources may enter A11oy through
  Proofweave.
- File-level licenses and vendored components can differ from a repository-level detector. Exact
  files, notices, dependencies, and history must be reviewed before any future reuse.
- The compiler checks only that a declared revision has 40 hexadecimal characters. It does not
  resolve the revision, prove that it exists or is reachable at the locator, or bind it to fetched
  bytes. A separate acquisition/provenance review must do that work.
- Only the released Grok-1 artifacts identified by their release are treated here as Apache-2.0.
  Later Grok weights, hosted models, APIs, consumer services, and Grok Build entitlements are
  proprietary or governed by their applicable service terms unless an exact artifact says
  otherwise.

## Official publications and safety references

Publications informed pattern selection and risk boundaries; they did not provide source code or a
license to copy expression.

| Primary source | Signal used | A11oy boundary |
|---|---|---|
| [Open Release of Grok-1](https://x.ai/news/grok-os) | Public description of the Grok-1 release, base-model status, architecture, and Apache-2.0 release boundary. | Distinguishes the open Grok-1 release from later proprietary models. No weights used. |
| [Grok-1 model card](https://x.ai/news/grok/model-card) | Intended-use, limitation, training-data, and evaluation disclosures. | Supports explicit limitation labels; no wording copied into product UI. |
| [Grok 4 announcement](https://x.ai/news/grok-4) | Public claims about reasoning, native tools, real-time search, and parallel test-time approaches. | Treated as vendor-reported product information, not independent validation and not implemented Proofweave capability. |
| [Grok 4 Model Card](https://data.x.ai/2025-08-20-grok-4-model-card.pdf) | Safety-relevant evaluation categories and deployment-context distinctions. | Informed the need for separate claim, evidence, and runtime states. No evaluation result imported as A11oy evidence. |
| [Grok 4.20 System Card](https://data.x.ai/2026-04-07-grok-4-20-model-card.pdf) | Public discussion of single-agent and multi-agent configurations and safety evaluation. | Reference only. Proofweave launches no agents and makes no comparative safety claim. |
| [Grok 4.6 Model Card](https://media.x.ai/v1/website/card-4p6-4cd2dc57.pdf) | Current xAI disclosure for Grok 4.6 capability and safety evaluation context. | Vendor disclosure only. No result is imported as A11oy evidence, and Proofweave performs no Grok 4.6 call. |
| [Grok 4.6 developer documentation](https://docs.x.ai/developers/grok-4-6) | Current API-facing capability, context-window, and access documentation. | Vendor reference only. Proofweave neither calls the API nor treats documented availability as witnessed runtime. |
| [xAI Frontier Artificial Intelligence Framework, 30 June 2026](https://media.x.ai/v1/website/xai-frontier-artificial-intelligence-framework-30-june-2026-99c40684.pdf) | Public risk-management, threshold, evaluation, and governance framework. | Risk reference only. It is not adopted as A11oy policy, certification, or compliance proof. |
| [xAI safety hub](https://x.ai/safety) | Index of model cards, safety reporting, and the frontier framework. | Source-discovery index only; current content can change and requires a fresh observation. |
| [Introducing Grok Build](https://x.ai/news/grok-build-cli) | Plan review, diffs, headless operation, extension compatibility, and parallel subagent product patterns. | Pattern reference only. Proofweave is not a Grok Build clone and executes none of those capabilities. |
| [Grok Build is Now Open Source](https://x.ai/news/grok-build-open-source) | Public scope of the released harness, tools, TUI, and extension system. | Directs license review to the source tree and notices; no source reused here. |
| [Grok Build Plugin Marketplace](https://x.ai/news/grok-plugin-marketplace) | Commit-revision remote-plugin and extension-catalog pattern. | Informed declared-revision admission. Proofweave installs no plugin. |
| [Workflows in Grok Build](https://x.ai/news/workflows) | Public workflow pattern: phased fan-out, verification, budgets, saved progress, and reusable commands. | Inspired the question, not the expression. Proofweave compiles five original A11oy stages and runs zero agents. |
| [Introducing Grok 4.6](https://x.ai/news/grok-4-6) | Vendor-reported focus on long-running agents, coding, research, visual work, self-testing, and safeguards. | Research context only. A11oy makes no parity claim and Proofweave performs no Grok 4.6 call. |

## Public contributor-history signals

GitHub exposes several narrow, time-varying signals. They can help locate public work; they cannot
establish a complete development team, employment, authorship of an internally synchronized
source tree, ownership of intellectual property, endorsement, or authority to grant a license.

### Public organization membership

The [`xai-org` public-members endpoint](https://api.github.com/orgs/xai-org/public_members?per_page=100)
returned these opt-in public handles on 2026-08-30:

`aksheyd`, `andr3wy`, `anishathalye`, `anonrig`, `bliutech`, `cph816`, `eriknson`,
`fabioibanez`, `fatih`, `giljulio`, `hleberre-xai`, `Jaaneek`, `lilingxi01`, `mpdmanash`,
`nullswan`, `poteto`, `sezze`, `shawnthapa`, `SirajChokshi`, `SivilTaram`, `StuartSul`, and
`VineethSendilraj`.

This is a public-membership snapshot, not a list of all personnel and not a claim that every handle
worked on Grok, Grok Build, a particular model, or any specific file.

### Repository contribution history

The [`xai-sdk-python` contributor endpoint](https://api.github.com/repos/xai-org/xai-sdk-python/contributors?per_page=10&anon=1)
returned the following top public commit-history counts on 2026-08-30:

| Handle | Contributions reported by GitHub |
|---|---:|
| `Omar-V2` | 94 |
| `shawnthapa` | 30 |
| `mark-xai` | 15 |
| `double-di` | 5 |
| `gyang-xai` | 5 |
| `aaditjuneja` | 3 |
| `avixai` | 2 |
| `ushiromiya-lion` | 2 |
| `dcbert` | 1 |
| `jif-perso` | 1 |

GitHub's [`grok-build` contributor endpoint](https://api.github.com/repos/xai-org/grok-build/contributors?per_page=10&anon=1)
reported only `grokkybara[bot]` with 40 contributions at the same snapshot. Because the repository
states that it is synchronized from another source, that public history cannot identify the humans
who authored the internal upstream work. Counts can also change after merges, squashes, account
mapping, or history synchronization.

The corresponding public contributor endpoints reported these additional repository-history
signals at the snapshot. They are included to locate public commits, not to construct a developer
or maintainer roster.

| Repository | Handle | Contributions reported by GitHub |
|---|---|---:|
| `grok-1` | `ibab` | 3 |
| `grok-1` | `syzymon` | 2 |
| `grok-1` | `mane` | 1 |
| `grok-1` | `garethpaul` | 1 |
| `grok-1` | `lvelvee` | 1 |
| `grok-1` | `xSetech` | 1 |
| `plugin-marketplace` | `ykeremy` | 39 |
| `plugin-marketplace` | `github-actions[bot]` | 21 |
| `plugin-marketplace` | `gilisho` | 2 |
| `plugin-marketplace` | `seiflotfy` | 2 |
| `plugin-marketplace` | `10ishq` | 2 |
| `plugin-marketplace` | `andrelandgraf` | 1 |
| `plugin-marketplace` | `evanpurkhiser` | 1 |
| `plugin-marketplace` | `kayleegeorge` | 1 |
| `plugin-marketplace` | `lakshyaag-tavily` | 1 |
| `plugin-marketplace` | `m-abdelwahab` | 1 |
| `grok-build-plugin-cc` | `aksheyd` | 1 |
| `grok-build-plugin-cc` | `railapex` | 1 |
| `grok-build-plugin-cc` | `mittalpk` | 1 |
| `grok-build-plugin-cc` | `raghavagrawal-x` | 1 |

All counts above are GitHub attribution/history signals. They are not proof of employment,
maintainership, source ownership, completeness, endorsement, or authority to grant rights.

## Original pattern-adaptation record

Proofweave adopts abstract engineering ideas and rebuilds their expression inside A11oy doctrine.
This work did not use a formal dual-team clean-room process or independent provenance audit, and
this register makes no such legal claim. It records a `DECLARED` implementer account of independent
pattern adaptation with no intentionally copied xAI expression:

| Public pattern observed | Original A11oy expression | Current boundary |
|---|---|---|
| Phased orchestration | `PATTERN -> CUT -> STITCH -> FITTING -> LABEL` with named A11oy roles | Compiled plan only |
| Parallel-agent budgets | Strict Workcell/provider/source/token/cost/time budget schema | No agent or provider execution |
| Verification phase | MirrorEval-assigned `AUTOMATED_REVIEW` plus a zero-edge claim graph whose nodes begin `NOT_EVALUATED` / `UNAVAILABLE` | Review remains `NOT_EXECUTED`; human approval `UNAVAILABLE` |
| Saved workflow identity | Canonical SHA-256 plan identity | In-process return; no checkpoint or durable store |
| Commit-revision extensions | Operator-declared 40-hex revision requirement for non-reference code use | Material metadata only; revision existence/reachability evidence `UNKNOWN`; no plugin or code installed |
| Source-aware research | Typed material admission and explicit reuse intent | HTTPS locator recorded; content not fetched |
| Model-card transparency | Fixed limitations, lifecycle states, and an approved evidence class | No vendor result becomes A11oy evidence |

`DECLARED` by the implementer: the implementation was written as SZL Holdings code against A11oy
naming, policy, and evidence doctrine; no xAI code, UI, terminal presentation, prompts, weights,
product copy, branding, logos, screenshots, or trade dress was intentionally copied or modified.
This statement is not an independent provenance or legal conclusion. The project does not claim
affiliation, endorsement, partnership, employment, or feature parity.

## Recommended sequence for a future runtime — not built

1. Freeze an exact primary-source inventory with verified, reachable revisions, per-file licenses,
   and byte hashes.
2. Add a read-only, sandboxed acquisition rail with byte hashes, redirect and size limits, malware
   scanning, and fetched-source receipts.
3. Require an explicit legal/provenance decision before any code moves beyond reference-only
   handling; preserve Apache notices and exclude incompatible or unclear material.
4. Add provider-neutral Workcell execution with default-deny tools, zero external writes, enforced
   cost/token/time/concurrency budgets, cancellation, and source-bound outputs.
5. Separate claimant, automated verifier, and real human approval roles; retain conflicts and
   denials rather than auto-promoting them.
6. Introduce tenant-bound durable storage only after identity, encryption, retention, deletion,
   replay defense, signed receipts, deployment, and independent runtime witness exist.

None of these future steps is implied by the current compiler. The current status remains
`DEMO / COMPILED_NOT_EXECUTED / IN_PROCESS_NOT_STORED`.
