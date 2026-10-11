# Workflow security repair — 2026-10-05

Base: `f2f8df6f89056e9104587674ccec0855dd5b177a`. Workcell: SZL-SECURITY-WORKFLOWS-20261005.

Plan: query CodeQL on its actual pull-request merge ref and aggregate every alert page; resolve the post-deployment checkout SHA as an Actions expression. Preserve analyzer failure, unavailable-evidence and high/critical blocking behavior.

Changed sources: `.github/workflows/codeql.yml`, `.github/workflows/post-deploy-smoke.yml`, and `scripts/qa/workflow-security.test.mjs`.

Verification: six executable/source contracts passed with Node's built-in test runner. They execute the real severity-gate shell against a local paginated API fixture, including a high alert on page two, critical alerts, analyzer/API failures, a clean multi-page result, the PR ref, and the smoke checkout expression. Both changed workflows parse as YAML. External Actions remain immutable SHA pins.

The GitHub CLI currently forbids combining `--slurp` with `--jq`; aggregation therefore pipes complete pages into standalone jq under `set -euo pipefail`. API errors remain failures even if jq has partial output.

Full `pnpm typecheck` was attempted before and after in this connector-materialized workflow source and returned the same ERR_PNPM_NO_IMPORTER_MANIFEST_FOUND. No full checkout, dependencies or TypeScript sources are present in this local verification, so no workspace typecheck pass is claimed. No UI changed; screenshots do not apply.

Current protected-head hosted Security Audit and READINESS-SECURITY runs have failed separately. The prior protected commit described 3 high and 4 moderate dependency advisories; their current count is unverified. These source corrections do not dismiss alerts, qualify deployment, change branch enforcement, or establish production security.

Rollback: a reviewed revert of this bounded workflow/test/proof change.

