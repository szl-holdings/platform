# Killinchu public-surface source-binding successor — refreshed 2026-10-13

**Workcell:** `platform-truth-killinchu-e3a3-20261011`

**Scope:** Platform's exact Killinchu `/api/build-info` public-surface contract.
**Evidence class:** MEASURED for the commands and bounded HTTP reads below. Provider fields are REPORTED by the served API; signature verification independently binds the source and manifest subject. This is not a Killinchu deployment or a production-readiness decision.

## Plan and cause

The prior [Platform PR #921](https://github.com/szl-holdings/platform/pull/921) merged normally at `1007fe7b546f7313546df3373a4e69e49ea365c3` after exact-head CI passed. A fresh manual [Truth drift run 38156828977](https://github.com/szl-holdings/platform/actions/runs/38156828977) on that merge commit failed twice for different reasons. Attempt 1 stopped during dependency installation because `onnxruntime-node` could not download its binary (`ETIMEDOUT`); it did not reach a truth gate. Attempt 2 reached `pnpm surfaces:check` and rejected the Killinchu build-info body. Killinchu had already advanced its protected main and completed a new HF sync before the Platform merge. The previous tuple remained a correct historical binding but no longer matched the live provider.

Update only the verified Killinchu source revision, deployment-manifest SHA-256, and advertised attestation ID. Keep exact-body validation. Test that the previous complete tuple and forged individual fields fail. Refresh the matching registry note, its deterministic generated projection, and the known-gap note. Preserve registry-wide `observed_at=2026-10-07T12:31:38.131Z`, because this patch did not reobserve all approved surfaces.

## Current immutable source and live read

The preserved successor was resumed on 2026-10-13. Protected Platform main
`5422b8adf5abaa2b0348bf893ddd938032970ab5` was fast-forwarded into the local
branch without resetting the preserved diff. The intervening estate-audit
changes do not overlap this patch. The older open PR #906 is unchanged since
2026-10-07 and is left intact. The commands in the table below were rerun on
2026-10-13: protected Killinchu main and the live tuple were unchanged, and a
fresh download of the immutable manifest passed signature verification.

| Evidence | Observation |
| --- | --- |
| `gh api repos/szl-holdings/killinchu/branches/main --jq .commit.sha` | Main source was `e3a3c4cf94d91b588e6708cca64239c98a8ec868`. |
| [Killinchu `hf-sync.yml` run 38156101805](https://github.com/szl-holdings/killinchu/actions/runs/38156101805) | SUCCESS at that source SHA. |
| `gh run download 38156101805 --repo szl-holdings/killinchu --name hf-deploy-evidence` and SHA-256 of `hf-deploy-manifest.json` | `c2e238552cb3c524a98b2b8507117bbacbd423b5776c3c5eceb7da2d34463d04`. The artifact was kept outside the repository. Its `ref` is the same source SHA. |
| `gh attestation verify hf-deploy-manifest.json -R szl-holdings/killinchu --signer-workflow szl-holdings/killinchu/.github/workflows/hf-sync.yml --source-ref refs/heads/main --source-digest e3a3c4cf94d91b588e6708cca64239c98a8ec868 --format json` | Exit 0 with a verified in-toto subject matching the downloaded manifest hash and the stated workflow, ref, source digest, and run. |
| Bounded GET `https://szlholdings-killinchu.hf.space/api/build-info` | HTTP 200 JSON reported the same build and receipt source SHA and manifest digest, and advertised attestation ID `54823964`. A later bounded read returned the same tuple. The ID is an API claim; the signature verification binds the manifest digest and source, not that numeric ID. |

The source and attested deployment manifest do not prove runtime byte parity. The Killinchu readiness contract still requires its canonical ledger to be `EPHEMERAL`, `PROCESS_MEMORY`, and `production_ready=false`; no aggregate readiness was asserted here.

## Change and verification

- Updated strict source-binding constants and the valid test fixture. The previous complete tuple, a forged manifest digest, and a forged attestation ID/URL remain negative controls.
- Updated only the Killinchu registry note and generated projection. The registry-wide observation timestamp and other surface entries remain unchanged.
- Clarified the separate single-surface read in `docs/operations/known-gaps.md`.

| Command | Result |
| --- | --- |
| `corepack pnpm exec tsx tools/truth/generate-public-surfaces.ts` | Generated the deterministic projection. |
| `corepack pnpm exec tsx tools/truth/generate-public-surfaces.ts --check` | Exit 0; deterministic projection matches. |
| `corepack pnpm exec tsx --test tools/truth/public-surfaces.test.ts` | Exit 0; all focused tests passed, including the stale complete tuple, forged digest and forged attestation negative controls. |
| `corepack pnpm claims:drift` | Exit 0; PASS. |
| `corepack pnpm surfaces:check` | Exit 0; all configured live routes verified. |
| `corepack pnpm surfaces:freshness` | Exit 0; live routes and existing observation-age gate passed. |
| `corepack pnpm truth:freshness` | Exit 0; existing generated truth remains within its freshness window. |
| `corepack pnpm truth:generate -- --verify-local --verify-remote` | Exit 1 in this sparse checkout: local inventory reports `monorepo_packages, api_endpoints` drift before remote verification. No generated truth bytes were changed. Full-checkout hosted CI remains required. |
| `corepack pnpm typecheck` | Exit 1 before and after this continuation: Turbo child tasks resolve machine pnpm 11.25.0 instead of required 10.26.1. This sparse local environment is BLOCKED; hosted exact-head CI is the merge gate. |
| `git diff --check` | Exit 0. |

This source change does not alter UI routes or screenshots. UI route/screenshot checks are NOT RUN locally; protected PR checks must pass on the exact head before a normal merge. A post-merge manual Truth drift run must verify the live source binding separately.

## Attributable proof metadata and verification correction — 2026-10-13

This append-only correction supplies the required explicit metadata and limits
the earlier whitespace-check observation. The original unstaged
`git diff --check` returned exit 0, but did not include this then-untracked
proof file. Rechecking the actual committed patch with
`git diff 5422b8adf5abaa2b0348bf893ddd938032970ab5..6c04b0071192e7fb0008cf72b5dfaa464c69b971 --check`
returned exit 2 for Markdown hard-break spaces on its original lines 3 and 4.
Those spaces were removed; no evidence or code was removed.

| Required field | Explicit value |
| --- | --- |
| `workcell_id` | `platform-truth-killinchu-e3a3-20261011` |
| `agent` | Codex, Platform repair subagent `/root/finish_platform` |
| `objective` | Restore strict agreement between Platform's Killinchu source-binding contract and the independently verified current deployment manifest. |
| `plan_summary` | Preserve the narrow successor, verify current immutable evidence, update only the exact tuple and matching notes, retain negative controls, and use normal protected admission. |
| `patch_summary` | The source tuple, test fixture, registry note, generated projection, known-gap note, and this proof packet comprise the diff. No workflow or runtime behavior was relaxed. |
| `test_results` | Commands and exits are in the verification table above. The base-to-index whitespace check documented below includes this proof file. |
| `screenshot_refs` | NOT RUN; no UI surface or route changed. |
| `verification_notes` | Fresh manifest signature verification binds the subject digest and source. Live body validation and stale/forged negative controls pass. Hosted checks on the subsequent exact head remain the merge gate. |
| `public_claim_check` | Reviewed the complete diff; no production-readiness, runtime-byte-parity, customer, certification, or aggregate readiness claim is introduced. |
| `security_check` | Reviewed the complete changed content; no credentials, tokens, private keys, environment values, or database data are present. Source hashes and attestation identifiers are public evidence. |
| `known_gaps_update` | Updated only the separate Killinchu source-binding observation; ephemeral ledger and production-readiness limits remain. |
| `proof_level` | Level 2, Standard Proof; non-UI source-contract change. No screenshot, deployment, or release qualification is claimed. |
| `recorded_at` | `2026-10-13T12:11:31.3857545Z` |
| `recorded_by` | Codex, Platform repair subagent `/root/finish_platform`; agent-attributed, not independent human certification. |

The corrected candidate is checked with
`git diff --cached 5422b8adf5abaa2b0348bf893ddd938032970ab5 --check`
before the signed follow-up commit and with
`git diff 5422b8adf5abaa2b0348bf893ddd938032970ab5..HEAD --check`
afterward. Both commands cover the complete PR patch, including new files.
