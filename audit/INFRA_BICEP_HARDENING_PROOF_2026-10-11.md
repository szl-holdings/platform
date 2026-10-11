# Infrastructure Bicep Hardening Proof Packet

- **workcell_id:** `INFRA-P0-BICEP-20261011`
- **agent:** BuildWarden (Codex)
- **objective:** Make the checked-in Azure Bicep graph source-resolvable and require an immutable OCI digest for the API Container App without deploying resources or fabricating the absent substrate fleet.
- **recorded_at:** `2026-10-11T05:50:26Z`
- **recorded_by:** BuildWarden (Codex)
- **proof_level:** 4 — Full Proof, bounded to source and contract evidence

## Plan summary

1. Remove the optional substrate parameters, module declarations, and outputs whose referenced Bicep modules do not exist.
2. Replace the default API image tag with a required `sha256:` digest from the root template through the Container App module.
3. Add secret-free Node contract tests for local module resolution, removal of the incomplete substrate surface, required digest propagation, and mutable-tag rejection.
4. Update the Azure instructions to resolve a registry digest before deployment and retain an explicit production hold.
5. Run focused tests, formatting, secret scanning, and repository checks. Do not deploy or change database migrations.

## Patch summary

- `infra/main.bicep` removes the dead substrate deployment surface and requires `apiImageDigest` with fixed digest length and a `sha256:` assertion.
- `infra/modules/containerapp.bicep` accepts the required digest and renders the image as `registry/repository@sha256:...`.
- `infra/parameters.json` no longer embeds a mutable `latest` tag or a placeholder digest.
- `scripts/infra/bicep-contract.test.mjs` verifies all local module paths, the removed substrate surface, digest plumbing, and absence of mutable image tags.
- `infra/README.md` documents digest resolution and states that compilation, deployment, and production qualification remain unverified.
- `package.json` exposes the focused test as `pnpm test:infra-contract`.

## Test results

| Command | Exit | Evidence |
|---|---:|---|
| `pnpm typecheck` (pre-patch baseline) | 137 | 100 tasks passed before the kernel killed `@szl-holdings/db-repository` under default concurrency. |
| `pnpm exec turbo run typecheck --concurrency=2` (pre-patch baseline) | 1 | 158 tasks passed; the existing `@szl-holdings/ai-engine` package then failed because `zod` was not resolvable and one callback parameter was implicitly `any`. No infrastructure files had been edited. |
| `corepack pnpm test:infra-contract` | 0 | 4 tests passed. |
| `corepack pnpm exec biome check scripts/infra/bicep-contract.test.mjs package.json` | 0 | 2 files checked with no findings. |
| `node scripts/qa/scan-secrets.js` | 0 | `CLEAN — no secrets found.` |
| `corepack pnpm verify:claims:strict` | 1 | Existing estate state: 90 working, 12 partial, 3 dormant, and 1 mock Vessels/AIS row because `MARINETRAFFIC_API_KEY` is not set. This patch does not change that row. |
| `git diff --check` | 0 | No whitespace errors. |

The Azure CLI and standalone Bicep CLI were not installed in this environment. No Bicep compiler or live Azure deployment evidence is claimed. Deterministic source-contract tests provide the available verification boundary.

## Verification notes

- Every `.bicep` module path under `infra/` resolves inside the checked-in `infra/` tree.
- `infra/main.bicep` contains none of the retired substrate parameters, module symbols, or outputs.
- Both root and module digest parameters are required, constrained to 71 characters, and assert the `sha256:` prefix. The documented ACR resolution step separately rejects values whose remaining 64 characters are not lowercase hexadecimal.
- The Container App image reference uses OCI digest syntax (`@${imageDigest}`).
- The shared parameters file intentionally omits a digest so deployment fails closed until the caller supplies a registry-resolved value.
- No UI surface or route changed, so screenshot proof is not applicable.

## Public claim check

The changed README opens with a production hold and explicitly says the templates have not been compiled in the evidence environment, deployed to Azure, or production-qualified. No production-readiness claim was added.

## Security check

No secrets, tokens, credentials, `.env` data, or placeholder secret values were added. The focused test reads repository files only and performs no network or cloud action.

## Known gaps update

No canonical known-gap status was closed. Azure compilation, deployment, traffic qualification, secret provisioning, migrations, backup/restore validation, and rollback evidence remain open. The production hold is now stated directly in `infra/README.md`.

## Screenshot references

None. This work changes infrastructure source, tests, and documentation only.
