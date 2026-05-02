package szl.ci

# SZL Holdings — CI Policy
# Evaluates pull requests and CI job metadata to enforce platform standards.
# Input: CI context object (see docs/security-baseline.md §OPA for schema)
#
# Usage:
#   opa eval -d platform/policy/ -i <ci-context.json> "data.szl.ci.deny"

import future.keywords.in
import future.keywords.if
import future.keywords.contains

# Default: deny unless explicitly allowed
default allow := false

allow if {
    count(deny) == 0
}

# ──────────────────────────────────────────────────────────────────────────────
# Rule 1: Pull requests must target main or a release branch
# ──────────────────────────────────────────────────────────────────────────────
deny contains msg if {
    input.event_type == "pull_request"
    not regex.match("^(main|master|release/.+)$", input.target_branch)
    msg := sprintf("PR target branch '%v' is not permitted. Must target main, master, or a release/* branch.", [input.target_branch])
}

# ──────────────────────────────────────────────────────────────────────────────
# Rule 2: All GitHub Actions must be pinned to full SHA
# ──────────────────────────────────────────────────────────────────────────────
deny contains msg if {
    action := input.workflow_actions[_]
    not regex.match("^[^@]+@[0-9a-f]{40}$", action.ref)
    msg := sprintf("Action '%v' is not pinned to a full commit SHA. Pin to a specific SHA for supply-chain safety.", [action.name])
}

# ──────────────────────────────────────────────────────────────────────────────
# Rule 3: Direct pushes to main/master are blocked (PRs required)
# ──────────────────────────────────────────────────────────────────────────────
deny contains msg if {
    input.event_type == "push"
    input.ref in {"refs/heads/main", "refs/heads/master"}
    not input.is_merge_commit
    msg := "Direct pushes to main/master are not permitted. Use pull requests."
}

# ──────────────────────────────────────────────────────────────────────────────
# Rule 4: Warn when required status checks are not in the completed set
#
# NOTE: This rule is a WARN (not deny) because the CI workflow cannot reliably
# collect check completion status from the GitHub REST API within the same job
# run. Enforcement of required status checks is delegated to GitHub branch
# protection ("required status checks" on main/master). OPA warns to surface the
# requirement in policy evaluation output; the hard gate is at the branch level.
# ──────────────────────────────────────────────────────────────────────────────
required_checks := {"lint", "typecheck", "build", "secret-scan"}

warn contains msg if {
    input.event_type == "pull_request"
    check := required_checks[_]
    not check in input.completed_checks
    msg := sprintf("Required CI check '%v' not present in completed_checks. Verify GitHub branch protection enforces this check.", [check])
}

# ──────────────────────────────────────────────────────────────────────────────
# Rule 5: Deployments to production require approval from policy-approvers group
# ──────────────────────────────────────────────────────────────────────────────
deny contains msg if {
    input.event_type == "deployment"
    input.environment == "production"
    count(input.approvals) == 0
    msg := "Production deployments require at least one approval from the policy-approvers group."
}

deny contains msg if {
    input.event_type == "deployment"
    input.environment == "production"
    count(input.approvals) > 0
    not any_approver_in_group(input.approvals, "policy-approvers")
    msg := "Production deployments require approval from a member of the policy-approvers group."
}

any_approver_in_group(approvals, group) if {
    approval := approvals[_]
    approval.state == "approved"
    group in approval.approver_groups
}

# ──────────────────────────────────────────────────────────────────────────────
# Rule 6: pnpm audit must not have critical or high vulnerabilities
# ──────────────────────────────────────────────────────────────────────────────
deny contains msg if {
    input.audit_results.critical_count > 0
    msg := sprintf("pnpm audit reports %v critical vulnerabilities. Resolve before merging.", [input.audit_results.critical_count])
}

deny contains msg if {
    input.audit_results.high_count > 0
    msg := sprintf("pnpm audit reports %v high-severity vulnerabilities. Resolve before merging.", [input.audit_results.high_count])
}

# ──────────────────────────────────────────────────────────────────────────────
# Warnings (non-blocking)
# ──────────────────────────────────────────────────────────────────────────────
warn contains msg if {
    input.audit_results.moderate_count > 0
    msg := sprintf("pnpm audit reports %v moderate-severity vulnerabilities. Review before next release.", [input.audit_results.moderate_count])
}

warn contains msg if {
    input.event_type == "pull_request"
    count(input.changed_files) > 50
    msg := "PR changes more than 50 files. Consider breaking into smaller PRs for review quality."
}
