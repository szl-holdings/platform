# Proof Packet — Series A W2 GitHub Consolidation Plan

| Field | Value |
|---|---|
| `workcell_id` | `SERIES-A-W2-GITHUB-CONSOLIDATION-2026-07-25` |
| `agent` | CodexSmith |
| `objective` | Publish a documentation-only, founder-gated, reversible estate plan from the observed W2 audit. |
| `plan_summary` | Add one consolidation plan and this proof packet; make no estate mutation. |
| `patch_summary` | Added the consolidation plan and proof packet; updated `docs/INDEX.md` to register both documents; review hardening removed non-public repository metadata, corrected the typed archive rollback field, and recorded baseline/post-edit typecheck evidence. |
| `proof_level` | 4 — public documentation claim and security review; screenshot not applicable because no UI surface changed. |
| `recorded_at` | 2026-07-26T01:30:42.617Z snapshot; packet assembled 2026-07-25 America/New_York. |
| `recorded_by` | CodexSmith |

## Source and evidence boundary

- Live GitHub observation: `2026-07-26T01:30:42.617Z`.
- Pre-change `platform/main` head used during planning: `36e924f2c8ec34d7e725fa1da6606dfa609e9eda`. The branch base is refreshed immediately before publication.
- The access-controlled inventory is not reproduced or fingerprinted in this public proof packet.
- Public snapshot math: 12 archived + 42 active = 54 public repositories.
- Claim labels: MEASURED, REPORTED, MODELED, UNKNOWN.
- GitHub state may drift after the observed timestamp; this packet is evidence of that observation, not a perpetual current-state claim.

## Public default-head ledger

This public ledger intentionally contains only repositories already visible to
unauthenticated readers. Non-public identifiers, settings, branches, refs, and
heads are excluded and must remain in access-controlled evidence.

| Repository | Visibility | Lifecycle | Default branch | Observed head |
|---|---|---|---|---|
| `szl-holdings/.github` | public | active | `main` | `0526df540bc58b761c948ba35c7f4f92effe3aef` |
| `szl-holdings/a11oy` | public | active | `main` | `2b3a3dd0254eb37c1a9b17a7c26c015696a18646` |
| `szl-holdings/a11oy-net` | public | active | `main` | `ff5f4da7585801e88e44c20dfd39bd7924273b11` |
| `szl-holdings/anatomy` | public | active | `main` | `c4bc67a4a0da76ca78eee2598618ab001eed1189` |
| `szl-holdings/developers` | public | archived | `main` | `95b888c09bce8871353959250a5c5de6826a0af8` |
| `szl-holdings/docs-site` | public | active | `main` | `edaab68833ddb2f7b6d3c002df6ff5bc813b4bc0` |
| `szl-holdings/energy-attest-holo` | public | active | `main` | `c1e56a3109d81ec4a1b4b69657d03da9d8394a67` |
| `szl-holdings/evidence-typed-formula-governance` | public | archived | `main` | `775ee23b5d4cf6a0e238ac330ce4deb41fe89a7b` |
| `szl-holdings/fail-closed-governed-ai-services` | public | archived | `main` | `40d1b710ac89cecbeee21f97110c761f8b83b950` |
| `szl-holdings/governed-inference-meter` | public | archived | `main` | `10e9a9fd4b762826b9c11bf8d212638d94c96555` |
| `szl-holdings/governed-norm-holo` | public | active | `main` | `6ca7ffb859571f9271495ddb69c28b03b13b2938` |
| `szl-holdings/governed-receipt-spec` | public | active | `main` | `007106bcb0212138345e19eb5efba8bb69327d57` |
| `szl-holdings/hatun-mcp` | public | active | `main` | `f7e6ef5c444b06ab16b1aff9a4560fb314f879ba` |
| `szl-holdings/immune` | public | active | `main` | `b4499c5bf83226b72a4b8dc6aeaa2da5a1010510` |
| `szl-holdings/khipu-consensus` | public | active | `main` | `8911f2160789a01a793dc189eb2c6c9824a9e4aa` |
| `szl-holdings/khipu-sda-core` | public | active | `main` | `23723cfbda363bd45aa095ea299fab1886e60504` |
| `szl-holdings/killinchu` | public | active | `main` | `c0e06d8c3c1b3a9c2cf550451132bd8c96ece1f3` |
| `szl-holdings/lambda-gate-holo` | public | active | `main` | `9e0ae85f70fa1936046666fdcc42f7549072b4a5` |
| `szl-holdings/lean-kernel` | public | active | `main` | `62cf1dd2b948f8e5fc9c7348cb618ac25f009875` |
| `szl-holdings/lutar-lean` | public | active | `main` | `3f3ad80df02ffd7a6d9e4757e6592b1f0dbddfd7` |
| `szl-holdings/ouroboros` | public | active | `main` | `6c60f1efbc9198491681792b81da7fce41280042` |
| `szl-holdings/platform` | public | active | `main` | `36e924f2c8ec34d7e725fa1da6606dfa609e9eda` |
| `szl-holdings/receipt-chain-live` | public | active | `main` | `46610bf543f2f38c8a4b8c8d204e65334699d0c0` |
| `szl-holdings/szl-brand` | public | active | `main` | `8f2c5c229f04f398bbe1a6c68e25c3acc238bd97` |
| `szl-holdings/szl-build-env` | public | active | `main` | `1174579152dbfbd40017108cb4fc7a695ecbdbf9` |
| `szl-holdings/szl-cookbook` | public | archived | `main` | `ad3d958786fb4e6852991e5e5e98bd43cc109ef2` |
| `szl-holdings/szl-doctrine` | public | active | `main` | `0cc4bf3b7a2eb8e9cdb3fd39253b95562a6c03b8` |
| `szl-holdings/szl-energy-attest` | public | active | `main` | `14c1d8fdbb19dbd69f4dfc365d7f74d515bc4bdb` |
| `szl-holdings/szl-fleet-overlay` | public | archived | `main` | `878a7eb5c345af49871a1a8626af73199e447381` |
| `szl-holdings/szl-forge` | public | active | `main` | `60fbe85bb4bd02ca6dbcac2db069a058d88dfe8a` |
| `szl-holdings/szl-formula-ledger` | public | active | `main` | `ceaef540eba6c5acf85091faf4a20cd9aef480f9` |
| `szl-holdings/szl-governed-norm` | public | archived | `main` | `3ef27eb7ebf491b0a6ce69be170ecef4c37885a2` |
| `szl-holdings/szl-gpu-bridge` | public | active | `main` | `a14c417d8bcb52ff7b4cba43d656c6858fc93c4c` |
| `szl-holdings/szl-guardrail-receipt` | public | active | `main` | `e7ef3d7940178e308b2bf0de38728d6bb66a85f4` |
| `szl-holdings/szl-holdings.github.io` | public | active | `main` | `f135c818593ebab633db35cb7aadc63c91669844` |
| `szl-holdings/szl-kernels-live` | public | active | `main` | `aee782cd5e38a155ebfefaa305aaea3d02d17594` |
| `szl-holdings/szl-lake` | public | active | `main` | `9c3819e3eb65af862aa0234db7e595c4e423932a` |
| `szl-holdings/szl-lambda-gate` | public | active | `main` | `8b95ca47571fda65a52b0b6189677ec089a6e503` |
| `szl-holdings/szl-mesh` | public | active | `main` | `b8fb7150bb1dfb2eddd71667e803387a00b2db78` |
| `szl-holdings/szl-otel-mesh` | public | archived | `main` | `172f52ecfc2cc7babac78bffde79517b38fcdb42` |
| `szl-holdings/szl-papers` | public | active | `main` | `9525240f583e3de8a3cdfb3a1297e086e5cd07fe` |
| `szl-holdings/szl-provctl-live` | public | active | `main` | `2af7860dac2a6fc6d27ebfaac99055c267dc65ba` |
| `szl-holdings/szl-quant` | public | active | `main` | `ac3f0654ffdb51967f0c3ef2771a7a9107e7a738` |
| `szl-holdings/szl-quant-witness` | public | active | `main` | `40553f41a4b55e62bee0751ad7bb413855f204a1` |
| `szl-holdings/szl-receipt` | public | active | `main` | `711158776c57394ed41d98cde5c7534f92f4ff2e` |
| `szl-holdings/szl-router` | public | active | `main` | `6f88e3b762ad9fe0a6dd30f8b9b3c5c9fb034acf` |
| `szl-holdings/szl-substrate` | public | active | `main` | `1ef9bf0ec9490b305b2bfa6378d4a8e5ae016a09` |
| `szl-holdings/szl-telemetry` | public | active | `main` | `ef519c090c9e2c19852e8b5c774fc41c750d9ec5` |
| `szl-holdings/szl-trust` | public | archived | `main` | `1f021cc6204d3eea272e246a8d81405511e924a1` |
| `szl-holdings/szl-uds-deployment` | public | archived | `main` | `341b79deda9094898e018a6152bba0a9b7e003df` |
| `szl-holdings/uds-bundles` | public | archived | `main` | `3c26e50961031918175ff9f529746022bbead1bb` |
| `szl-holdings/vsp-otel` | public | active | `main` | `ce7a37c35e7cfe84b36ea38f3dcd2ddaffb0b087` |
| `szl-holdings/warhacker-demo` | public | archived | `main` | `0c68abbc41f9327fdf4ffad88a474bcc01eb8e6b` |
| `szl-holdings/yarqa` | public | active | `main` | `331c4b8e65043b4874592e2261b6c9befb206432` |

## Option B proof

- Five usable public-active slots at observation: `platform`, `a11oy`, `ouroboros`, `lutar-lean`, and `.github`.
- Founder decision 1: `szl-trust` was public-archived and reported migration to `docs-site`.
- Founder decision 2: exact `sentra` was absent; `immune` is only a MODELED substitute.
- Founder decision 3: exact `insurance` was absent from the public inventory; no public substitute is selected.
- Founder decision 4: exact `vessels` was absent; using the payload-permitted public-active `killinchu` substitution remains MODELED and is not approved by this packet.
- Option B is explicitly **NOT APPLIED**.

## Relationship proof

| # | From | To | Relationship | README evidence head |
|---:|---|---|---|---|
| 1 | `szl-holdings/developers` | `szl-holdings/docs-site` | README_DEPRECATED_MIGRATED_TO | `95b888c09bce8871353959250a5c5de6826a0af8` |
| 2 | `szl-holdings/szl-cookbook` | `szl-holdings/docs-site` | README_DEPRECATED_MIGRATED_TO | `ad3d958786fb4e6852991e5e5e98bd43cc109ef2` |
| 3 | `szl-holdings/szl-trust` | `szl-holdings/docs-site` | README_DEPRECATED_MIGRATED_TO | `1f021cc6204d3eea272e246a8d81405511e924a1` |
| 4 | `szl-holdings/governed-inference-meter` | `szl-holdings/szl-energy-attest` | README_DEPRECATED_CONSOLIDATED_INTO | `10e9a9fd4b762826b9c11bf8d212638d94c96555` |
| 5 | `szl-holdings/szl-governed-norm` | `szl-holdings/szl-lambda-gate` | README_DEPRECATED_CONSOLIDATED_INTO | `3ef27eb7ebf491b0a6ce69be170ecef4c37885a2` |
| 6 | `szl-holdings/szl-otel-mesh` | `szl-holdings/szl-mesh` | README_MOVED_TO_ACTIVE_SUCCESSOR | `172f52ecfc2cc7babac78bffde79517b38fcdb42` |
| 7 | `szl-holdings/platform:services/vsp-otel` | `szl-holdings/vsp-otel` | README_NON_CANONICAL_PARTIAL_MIRROR_OF | `ce7a37c35e7cfe84b36ea38f3dcd2ddaffb0b087` |
| 8 | `szl-holdings/szl-otel-mesh` | `szl-holdings/vsp-otel` | README_SUPERSEDED_BY | `ce7a37c35e7cfe84b36ea38f3dcd2ddaffb0b087` |

The two OTel successor claims conflict and are both REPORTED. This proof packet does not resolve them.

## Validation record

| Check | Result | Evidence |
|---|---|---|
| Public ledger completeness | PASS | 54 unique public repository names and 54 valid 40-character default-head SHAs; non-public inventory is intentionally excluded. |
| Public snapshot arithmetic | PASS | 12 archived + 42 active = 54 public repositories. |
| Option B guard | PASS | Plan says NOT APPLIED and records four unresolved founder decisions. |
| Mutation guard | PASS | No forward mutation command or repository-setting change is part of this workcell. |
| Restore documentation | PASS | Only rollback command templates are documented and marked DO NOT RUN FROM THIS PR; `archived=false` uses typed `gh api --field` conversion via `-F`. |
| Public claim check | PASS | Counts are MEASURED at `2026-07-26T01:30:42.617Z` and carry an explicit drift boundary. Substitutions are MODELED. |
| Security check | PASS | No token, credential, private key, `.env` value, or non-public repository identifier, setting, branch, ref, head, or evidence fingerprint is included. |
| UI screenshot | NOT APPLICABLE | Markdown-only change; no UI surface changed. |
| Typecheck | NO WORSE THAN BASELINE (exit 1) | `pnpm typecheck` was run from this checkout before and after the review edits. Baseline: exit 1, 154/170 tasks completed before `@szl-holdings/ai-engine` stopped on TS2307 (missing `zod`) and TS7006 (implicit `any`). Post-edit: exit 1, 157/170 tasks completed, with the same package and same two diagnostics; neither diagnostic references either changed Markdown file. |
| Known gaps update | NOT REQUIRED | The plan records unresolved decisions in itself and does not change runtime or readiness status. |

## Verification notes

- The plan is additive and reversible.
- No existing file is deleted or renamed. The existing `docs/INDEX.md` is updated only to register the two new documents.
- No GitHub repository setting is changed.
- The DCO trailer must match the authenticated contributor identity.
- The draft PR must target `main` from an exact refreshed base SHA.
- CI status after publication is reported separately and does not retroactively change this observed snapshot.

## Remaining gates

1. Founder decision for `szl-trust`.
2. Founder decision for the absent `sentra` slot.
3. Founder selection of a public revenue-slot substitute, or deferral of that slot.
4. Founder decision to substitute `killinchu`, select another public-active defense/maritime surface, or defer that slot.
5. Maintainer/owner resolution of the `szl-otel-mesh` successor conflict.
6. Green required checks before any later merge; this PR remains draft.
