# GitHub Branch Protection Setup Report

Generated: 2026-04-01

## Repository

| Field | Value |
|---|---|
| Owner/Repo | `stephenlutar2-hash/szl-holdings-platform` |
| Default branch | `master` |
| Archived | `false` |

## Ruleset: "Protect default branch"

| Field | Value |
|---|---|
| Ruleset ID | `14609056` |
| Status | `ACTIVE` |
| Target | `branch` |
| Conditions | `~DEFAULT_BRANCH` (master) |
| Ruleset URL | https://github.com/stephenlutar2-hash/szl-holdings-platform/rules/14609056 |

### Rules Applied

| Rule | Details |
|---|---|
| `deletion` | Blocks branch deletion |
| `non_fast_forward` | Blocks force pushes |
| `pull_request` | Requires PR before merging; conversation resolution required; allows squash + rebase; 0 required approvals; no stale review dismissal; no code owner review required; no last-push approval |

### Bypass Actors

| Actor | Type | Mode |
|---|---|---|
| Repository Admin (ID: 5) | `RepositoryRole` | `always` |

## CI Status Check

| Field | Value |
|---|---|
| CI context included | `false` |
| Reason | GitHub API rejected `required_status_checks` for context `CI` because the check has not run against this repository yet (invalid integration IDs error) |

### Next Step: Re-add CI Status Check

Once the CI workflow (`.github/workflows/ci.yml`) has run at least once on a PR, add the `required_status_checks` rule to the ruleset:

```http
PATCH /repos/stephenlutar2-hash/szl-holdings-platform/rulesets/14609056
```

```json
{
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    {
      "type": "pull_request",
      "parameters": {
        "allowed_merge_methods": ["squash", "rebase"],
        "dismiss_stale_reviews_on_push": false,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_approving_review_count": 0,
        "required_review_thread_resolution": true
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": false,
        "required_status_checks": [
          { "context": "CI" }
        ]
      }
    }
  ]
}
```

## Changed Files

| File | Action |
|---|---|
| `.github/pull_request_template.md` | Added |
| `.github/PROTECTION_SETUP_REPORT.md` | Added (this file) |

## Branch & PR

| Field | Value |
|---|---|
| Branch | `chore/github-protection-bootstrap` |
| PR | https://github.com/stephenlutar2-hash/szl-holdings-platform/pull/12 |
