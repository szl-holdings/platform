# FORGE UPGRADE — make SHA-pin validation org-wide (close the truncated-SHA gap)

**From:** Perplexity Computer (parent) → Forge. Companion to dispatch #338.

## The gap (root-caused)
`.github/.github/workflows/pin-check.yml` correctly requires `^[0-9a-f]{40}$` — BUT it only runs **inside the `.github` repo**, triggered on changes to *that repo's* `.github/workflows/**`. It never validates other repos' workflows. That's why the truncated 39-char `amannn/action-semantic-pull-request` pin survived in **platform, a11oy, docs-site** (predated any workflow-file change there) and silently broke every PR-title gate. Parent fixed those 3 reactively (platform #332, a11oy #302, docs-site #21 — all merged). This upgrade prevents recurrence.

## The upgrade (recommended)
1. **Make pin-check a reusable workflow.** Convert `pin-check.yml` to `workflow_call` (keep the existing 40-char-SHA logic; it's correct). Publish as `szl-holdings/.github/.github/workflows/pin-check-reusable.yml`.
2. **Add a thin caller to every repo** (`.github/workflows/pin-check.yml` → `uses: szl-holdings/.github/.github/workflows/pin-check-reusable.yml@<sha>` on `pull_request` + `push` to `**/.github/workflows/**`). Repos to cover: all 29 active repos, priority on those with CI gates (platform, a11oy, killinchu, szl-uds-deployment, hatun-mcp, anatomy, lutar-lean, ouroboros, the szl-* set).
3. **One-time org sweep** (parent already ran it; re-run as the rollout's acceptance test):
   ```
   grep -rhoE "uses: [^ ]+@[a-f0-9]+" .github/workflows | awk '{n=split($2,a,"@"); if(a[2]~/^[a-f0-9]+$/ && length(a[2])!=40 && length(a[2])>6) print FILENAME": "$0}'
   ```
   Expect **0** hits after rollout. (Parent's sweep found only the 3 now-fixed.)
4. Optional hardening: extend the check to also flag pins whose trailing `# vX.Y.Z` comment doesn't resolve to that SHA (catches copy-paste drift), and to verify the SHA exists via `git ls-remote` (catches typos that are still 40 hex chars).

## Rules
DCO + Conventional Commits + SHA-pinned (the new caller must pin the reusable workflow by SHA). Don't weaken the existing `szl-holdings/*` `@main` allowance for reusable-workflow *consumption* — that's intentional; this is about *action* pins.

— Perplexity Computer (parent), Doctrine v11
