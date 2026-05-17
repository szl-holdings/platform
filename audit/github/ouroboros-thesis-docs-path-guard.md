# Ouroboros-thesis docs-only path guard — verification evidence

Task: #5092 ("Install the docs-only path guard so automation can't sneak in
code changes")

Verified: 2026-05-17 against `szl-holdings/ouroboros-thesis` via GitHub
REST API v2022-11-28.

## Result

`safeConfiguration: true` — the docs-automation bypass is active and the
path guard is enforced as a required status check, so the bypass cannot
land non-docs changes without review.

## Evidence

### 1. Guard workflow file present on `main`

- Path: `.github/workflows/docs-only-paths-guard.yml`
- Blob sha: `1b664ca3d76a677f38b3e2c361568d9aeb240482`
- Size: 4164 bytes
- Content matches the canonical `GUARD_WORKFLOW_YAML` exported from
  `scripts/github/configure-ouroboros-docs-bypass.ts` in this monorepo
  (single source of truth — allowlist regex cannot drift).

Fetched via:
`GET /repos/szl-holdings/ouroboros-thesis/contents/.github/workflows/docs-only-paths-guard.yml?ref=main`

### 2. Required status check wired into ruleset `16195489`

Ruleset name: `series-a-default-branch`.
`rules[].parameters.required_status_checks` now contains, in order:

1. `docs / Validate CITATION.cff`
2. `docs / Markdown lint`
3. `docs / Required files present`
4. `docs / External link check`
5. `secrets / TruffleHog Secret Scan`
6. `Docs-only paths guard / docs-only-paths`  ← installed by this task

Fetched via: `GET /repos/szl-holdings/ouroboros-thesis/rulesets/16195489`

### 3. Bypass actor present

`bypass_actors` on ruleset `16195489`:

```json
[
  { "actor_id": 5,        "actor_type": "RepositoryRole", "bypass_mode": "pull_request" },
  { "actor_id": 17573520, "actor_type": "Team",           "bypass_mode": "pull_request" }
]
```

Team id `17573520` = `@szl-holdings/docs-automation`.

### 4. Guard demonstrably enforces

`GET /repos/szl-holdings/ouroboros-thesis/actions/workflows/docs-only-paths-guard.yml/runs`
returned 20 total runs at verification time. Direct run URLs for the
two most recent enforcement failures (bypass-eligible PRs that touched
non-docs paths — exactly the scenario the guard is designed to block):

| # | branch | conclusion | head_sha | run URL |
|---|--------|------------|----------|---------|
| 20 | `doi-backfill/v13` (PR #52) | success | `906574f033dbcad6186874fe8a7a586654254d1e` | https://github.com/szl-holdings/ouroboros-thesis/actions/runs/26002605141 |
| 19 | `fix/doi-backfill-script-indent` | **failure** | `f2eca8c6a47bad18bc8b8817b9eb626c45321fea` | https://github.com/szl-holdings/ouroboros-thesis/actions/runs/26002549547 |
| 18 | `ci/doi-backfill-workflow` | **failure** | `3be8bf0600e21b0d25ad481d1bc8fe9a197c28de` | https://github.com/szl-holdings/ouroboros-thesis/actions/runs/26002448465 |
| 17 | `content/rollups-and-exhaustive` | success | `6c4452a4b07578889fcda01053145daa002ad45b` | https://github.com/szl-holdings/ouroboros-thesis/actions/runs/26001243474 |

17 prior runs completed successfully on docs-only PRs.

### 5. Raw ruleset payload (sanitized excerpt)

Captured from `GET /repos/szl-holdings/ouroboros-thesis/rulesets/16195489`
on 2026-05-17:

```json
{
  "id": 16195489,
  "name": "series-a-default-branch",
  "bypass_actors": [
    { "actor_id": 5,        "actor_type": "RepositoryRole", "bypass_mode": "pull_request" },
    { "actor_id": 17573520, "actor_type": "Team",           "bypass_mode": "pull_request" }
  ],
  "rules": [
    {
      "type": "required_status_checks",
      "parameters": {
        "required_status_checks": [
          { "context": "docs / Validate CITATION.cff" },
          { "context": "docs / Markdown lint" },
          { "context": "docs / Required files present" },
          { "context": "docs / External link check" },
          { "context": "secrets / TruffleHog Secret Scan" },
          { "context": "Docs-only paths guard / docs-only-paths" }
        ]
      }
    }
  ]
}
```

## Operational notes

- To re-verify at any time:
  `tsx scripts/github/configure-ouroboros-docs-bypass.ts verify`
  (the script returns `safeConfiguration: true` and exits non-zero
  otherwise).
- Emergency revoke:
  `tsx scripts/github/configure-ouroboros-docs-bypass.ts revoke`
- The workflow file was committed out-of-band (the standard automation
  token used by Replit Agent does not carry the `workflow` scope
  required by the GitHub API to push files under `.github/workflows/`).
  No code change in this monorepo was required to satisfy the task.
