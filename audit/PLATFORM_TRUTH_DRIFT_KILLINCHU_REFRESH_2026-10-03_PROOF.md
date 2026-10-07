# Killinchu exact deployment binding refresh — Proof Packet

- **workcell_id:** `WC-PLATFORM-TRUTH-DRIFT-20261003`
- **task_reference:** platform Truth Drift run `37104408373`
- **agent:** Codex BuildWarden repair lane
- **objective:** Repair the platform-owned stale Killinchu build-info contract at current
  protected `main` without weakening live Truth Drift or relabeling externally owned drift.
- **plan_summary:** Reproduce the exact-head live failure, separate the platform-owned stale
  immutable binding from owner-level route and metadata changes, verify the successor
  Killinchu deployment manifest and GitHub OIDC attestation, update only the exact binding and
  its contract fixtures, regenerate deterministic evidence, and leave every unresolved live
  mismatch blocking.
- **patch_summary:** Refreshed the expected Killinchu source revision, deployment-manifest
  digest, and GitHub attestation identity in `tools/truth/public-surfaces.ts`; updated the
  positive and duplicate-member negative contract fixtures; and regenerated the matching note
  in `config/public-surfaces.json` and `artifacts/PUBLIC_SURFACES.json`. No status, route,
  redirect, availability, product identity, retry, timeout, or fail-closed assertion changed.
- **test_results:**
  - `pnpm typecheck` — exit `1` before script dispatch because `pnpm` is not installed on this
    host path. Typecheck result is **UNAVAILABLE**; no repository or host policy was bypassed.
  - `corepack pnpm install --frozen-lockfile --ignore-scripts` — exit `0`; restored the locked
    JavaScript tooling without executing dependency lifecycle scripts or changing tracked files.
    This is scoped local test provisioning, not evidence for a supported build or hosted install.
  - `corepack pnpm exec tsx --test tools/truth/public-surfaces.test.ts` — exit `0`;
    **MEASURED**: the focused positive, negative, concurrency, retry, metadata, and exact
    Killinchu API contract cases passed.
  - `corepack pnpm exec tsx tools/truth/generate-public-surfaces.ts --check` — exit `0`;
    **MEASURED**: generated evidence matches the reviewed registry.
  - `TRUTH_ALLOWLIST_BASE_SHA=f2f8df6f89056e9104587674ccec0855dd5b177a corepack pnpm
    claims:drift` — exit `1` before scanning because the supplied baseline was current `HEAD`.
    This setup error changed no allowlist or assertion.
  - `TRUTH_ALLOWLIST_BASE_SHA=717cd2a60bc5d91f9abc10f68114b32d8c33da9a corepack pnpm
    claims:drift` — exit `0`; **MEASURED**: the immutable parent baseline admitted no claims
    drift in this successor.
  - `corepack pnpm surfaces:check` — exit `1`; **MEASURED** fail-closed result. The stale
    `killinchu-build-info-api` mismatch is absent, while the owner-level mismatches listed below
    remain blocking.
  - `gh attestation verify hf-deploy-manifest.json --repo szl-holdings/killinchu` — exit `0`;
    **MEASURED**: the downloaded deployment manifest is covered by the GitHub attestation whose
    source repository is `szl-holdings/killinchu` and source revision is the protected head below.
  - `git diff --check` — exit `0`; **MEASURED**: no whitespace errors.
- **screenshot_refs:** `N/A` — this patch changes an API evidence binding and generated registry
  note; it does not modify a UI route, rendered surface, style, layout, or interaction.
- **verification_notes:** The repaired contract is bound to Killinchu protected source
  `47cbda9ead6548fb4cbf112ba47f1f39411ae6da`, deployment run `37100152089`, manifest
  `sha256:4622b60c4d9818c81ee6d73b470cc44a1597c20022b0d4fd86d2cbaf345d92d2`, and GitHub
  OIDC attestation `52366835`. The live gate no longer reports a Killinchu build-info mismatch.
  This proves the narrow exact-body repair only; it does not prove the separate Hugging Face
  runtime content revision, whole-estate convergence, deployment by this commit, or a green
  Truth Drift run.
- **public_claim_check:** **MEASURED** — the diff advances only an exact GitHub-attested evidence
  identity. It makes no certification, production-readiness, model-quality, runtime,
  deployment, or whole-platform claim.
- **security_check:** **MEASURED** — the reviewed diff adds no secret, token, credential, `.env`
  value, permission expansion, network target, redirect allowance, retry expansion, threshold
  change, or protection bypass.
- **known_gaps_update:** No owner-level gap is closed or relabeled by this patch. The live gate
  continues to expose all residual mismatches below. `docs/operations/known-gaps.md` is unchanged
  because the patch repairs a stale immutable evidence pin rather than an owning product surface.
- **proof_level:** `4` — Full Proof for a public evidence-contract correction; screenshot
  evidence is not applicable because no UI surface changed.
- **recorded_at:** `2026-10-03T10:07:34Z`
- **recorded_by:** Codex BuildWarden repair lane

## Source binding

- platform protected base: `f2f8df6f89056e9104587674ccec0855dd5b177a`
- failing exact-head workflow: `szl-holdings/platform` run `37104408373`
- Killinchu protected source: `47cbda9ead6548fb4cbf112ba47f1f39411ae6da`
- Killinchu deployment workflow: `szl-holdings/killinchu` run `37100152089`
- deployment manifest digest:
  `4622b60c4d9818c81ee6d73b470cc44a1597c20022b0d4fd86d2cbaf345d92d2`
- GitHub OIDC attestation:
  `https://github.com/szl-holdings/killinchu/attestations/52366835`

## Residual ownership and remediation boundary

| Failing surface | Owning source | Measured state | Owner-level remediation boundary |
|---|---|---|---|
| `a11oy-net-chat-gap` | `szl-holdings/a11oy-net` at `16c28a9cbf98e9f7037027a7448cb4e69cb51b0d` (`chat/index.html`) | `/chat` redirects to the committed `/chat/` page, which returns HTTP 200. | The owner must approve and publish the intended end state; only then may platform advance its approved-final contract. |
| `a11oy-net-code-gap` | `szl-holdings/a11oy-net` at `16c28a9cbf98e9f7037027a7448cb4e69cb51b0d` (`code/index.html`) | `/code` redirects to the committed `/code/` page, which returns HTTP 200. | The owner must approve and publish the intended end state; only then may platform advance its approved-final contract. |
| `a11oy-net-webmanifest-gap` | `szl-holdings/a11oy-net` at `16c28a9cbf98e9f7037027a7448cb4e69cb51b0d` (`manifest.webmanifest`) | Live and source metadata use lower-case product identity while the platform contract requires the reviewed identity. | Align the owning manifest or approve a doctrine-compatible successor contract with exact source evidence. |
| `killinchu-public-console` | `szl-holdings/a11oy` at `4d1c33105be603b6d694817c87001acb7a05857d` (`a11oy_command_center.py`, `pages/killinchu.html`) | `/killinchu` now serves an on-origin HTTP 200 page instead of the registry's approved redirect. | The owner must restore the approved redirect or provide a governed route-change successor before the registry can advance. |
| `legacy-command-route` | `szl-holdings/a11oy` at `4d1c33105be603b6d694817c87001acb7a05857d` (`a11oy_command_center.py`, `pages/command-center.html`) | `/command/` now serves HTTP 200 while the registry requires HTTP 404. | The owner must restore the retired-route behavior or provide a governed route-change successor before the registry can advance. |

## Authority boundary

This packet records a local source successor, read-only provider evidence, focused contract
execution, deterministic generated-evidence validation, and a live fail-closed probe. It does not
claim hosted exact-head CI success, merge, deployment by this platform commit, full green status,
or authority to change another repository's route or metadata contract. Required hosted checks,
review, protected merge, and post-merge readback remain separate future evidence states.
