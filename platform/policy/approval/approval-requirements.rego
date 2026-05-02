package szl.approval

# SZL Holdings — Approval Requirements Policy
# Determines the approval requirements for operations across environments.
# Input: operation request object
#
# Returns: approval requirements that the Temporal approval workflow must satisfy.

import future.keywords.in
import future.keywords.if
import future.keywords.contains

# Default: no approval required (for low-risk ops in dev)
default required_approvals := 0
default required_groups := []

# ──────────────────────────────────────────────────────────────────────────────
# Production deployments: 1 approval from platform-team or release-managers
# ──────────────────────────────────────────────────────────────────────────────
required_approvals := 1 if {
    input.environment == "production"
    input.operation_type in {"deploy", "rollback"}
    input.tier in {"tier-0", "tier-1"}
}

required_groups := ["platform-team", "release-managers"] if {
    input.environment == "production"
    input.operation_type in {"deploy", "rollback"}
}

# ──────────────────────────────────────────────────────────────────────────────
# Schema migrations in staging: 2 approvals from platform-team
# Schema migrations in production: 2 approvals from platform-team AND policy-approvers
# ──────────────────────────────────────────────────────────────────────────────
required_approvals := 2 if {
    input.environment in {"staging", "production"}
    input.operation_type == "database-schema-migration"
}

required_groups := ["platform-team"] if {
    input.operation_type == "database-schema-migration"
    input.environment == "staging"
}

required_groups := ["platform-team", "policy-approvers"] if {
    input.operation_type == "database-schema-migration"
    input.environment == "production"
}

# ──────────────────────────────────────────────────────────────────────────────
# Emergency break-glass in production: 2 approvals, both from policy-approvers
# ──────────────────────────────────────────────────────────────────────────────
required_approvals := 2 if {
    input.operation_type == "break-glass"
    input.environment == "production"
}

required_groups := ["policy-approvers"] if {
    input.operation_type == "break-glass"
}

# ──────────────────────────────────────────────────────────────────────────────
# Policy exception grants: require security-team approval
# ──────────────────────────────────────────────────────────────────────────────
required_approvals := 1 if {
    input.operation_type == "policy-exception"
}

required_groups := ["security-team"] if {
    input.operation_type == "policy-exception"
}

# ──────────────────────────────────────────────────────────────────────────────
# Validation: check if current approvals satisfy requirements
# ──────────────────────────────────────────────────────────────────────────────
deny contains msg if {
    count(satisfied_approvals) < required_approvals
    msg := sprintf("Operation requires %v approvals from %v. Received %v.", [required_approvals, required_groups, count(satisfied_approvals)])
}

# Count by index so two identical approval objects are not deduplicated.
satisfied_approvals contains i if {
    approval := input.approvals[i]
    approval.state == "approved"
    any_group_matches(approval.approver_groups, required_groups)
}

# Per-group coverage: every required group must have at least one approved approver.
# Prevents satisfying a multi-group requirement with multiple same-group approvals.
deny contains msg if {
    g := required_groups[_]
    not group_has_approval(g)
    msg := sprintf("Required approver group '%v' has no approved approver.", [g])
}

group_has_approval(g) if {
    approval := input.approvals[_]
    approval.state == "approved"
    g in approval.approver_groups
}

any_group_matches(approver_groups, required) if {
    g := approver_groups[_]
    g in required
}

# ──────────────────────────────────────────────────────────────────────────────
# SLA: approval workflows must not exceed maximum wait time
# ──────────────────────────────────────────────────────────────────────────────
approval_sla_minutes := {
    "deploy": 240,
    "rollback": 30,
    "database-schema-migration": 480,
    "break-glass": 15,
    "policy-exception": 2880,  # 2 days
}

deny contains msg if {
    sla := approval_sla_minutes[input.operation_type]
    input.pending_minutes > sla
    msg := sprintf("Approval for '%v' has exceeded SLA of %v minutes (pending: %v min). Workflow will be expired.", [input.operation_type, sla, input.pending_minutes])
}
