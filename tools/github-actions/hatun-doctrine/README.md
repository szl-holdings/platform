# `hatun-doctrine` — PR Governance Check

A first-party GitHub Action that runs the PR-time governance subset of the [Hatun Doctrine Specification](../../../docs/a11oy/spec/hatun-doctrine-spec/README.md).

Drop it into any repo that touches A11oy artifacts. Per pull request it:

1. **Lints** Constitutions in the DSL (suggest-only; never blocks).
2. **Runs** a Petri-style behavioral-audit subset against the changed agent.
3. **Computes** the Adversarial Robustness delta vs. the most recent baseline snapshot.
4. **Comments** on the PR with a single structured table of findings, plus a link to the full results on the Public Trust Portal.

The action **never auto-merges and never auto-blocks** a PR. Doctrine remains a human decision.

## Inputs

| Input | Default | Purpose |
|:------|:--------|:--------|
| `spec-version` | `0.1.0` | Hatun Doctrine Specification version this run targets. |
| `agent-id` | (inferred from changed files) | Agent operator id (e.g. `op-cascade`). |
| `baseline-snapshot` | (latest tagged baseline) | Snapshot fingerprint id to compare against. |
| `audit-suite` | `petri-pr-subset@1.4.0` | Behavioral-audit subset to run. |
| `trust-portal-base` | `https://a11oy.io/trust` | Public Trust Portal base URL. |
| `comment-on-pr` | `true` | Post the comment on the PR. |
| `github-token` | `${{ github.token }}` | Token for posting the comment. |

## Outputs

| Output | Meaning |
|:-------|:--------|
| `composite-robustness` | Composite adversarial-robustness score (0–100) for the changed agent. |
| `robustness-delta` | Signed change vs. baseline snapshot. |
| `audit-findings-count` | Number of behavioral-audit findings produced. |
| `cavd-related` | CAVD advisory ids related to clauses changed in this PR. |

## Example workflow

```yaml
name: Doctrine
on: [pull_request]
permissions:
  contents: read
  pull-requests: write
jobs:
  hatun-doctrine:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: a11oy/hatun-doctrine@v0.1.0
        with:
          agent-id: op-cascade
          audit-suite: petri-pr-subset@1.4.0
```

## What gets commented

The action posts (or updates) a single comment on the PR with a structured table:

```
## Hatun Doctrine — PR Governance Check

Spec: 0.1.0 · Agent: op-cascade · Baseline: snap-cascade-2026-04-25-08-12

| Check                  | Result | Notes                                    |
|------------------------|--------|------------------------------------------|
| Constitution DSL lint  | OK     | 2 suggestions, 0 blocking                |
| Behavioral audit       | 1 flag | PETRI-EVAL-AWARE-014 (low)               |
| Robustness composite   | 93     | Δ +1.2 vs baseline                       |
| Indirect-injection     | 88     | Δ +3.4                                   |
| CAVD touched           | none   | —                                        |

Full results: https://a11oy.io/trust/pr/<run-id>
```

If a Constitution clause referenced by a published CAVD advisory is touched, the action surfaces the advisory id in the table without revealing embargoed content.

## License

CC-BY-4.0 (matches the Open Spec).

## Doctrine

This action is governed by [`A11OY_DOCTRINE.md`](../../../docs/a11oy/A11OY_DOCTRINE.md) §12. It does not bypass the Pre-Deployment Alignment Review Gate.
