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
# Agent gateway actions (Phase 11)
#
# The agent gateway sends `operation_type = "agent_<capability>"` straight
# from the inbound request. The bundle is authoritative for agent approval
# requirements — the gateway does NOT translate capabilities to other Rego
# operation types before evaluation.
#
# Capability set (kept in sync with platform/agent-gateway/src/types.ts):
#   advisory     : agent_inspect_code, agent_inspect_manifests,
#                  agent_analyze_telemetry, agent_summarize_incidents,
#                  agent_draft_runbooks, agent_generate_documentation,
#                  agent_generate_test_plans
#   mutating     : agent_draft_prs, agent_propose_policy_fixes,
#                  agent_propose_architecture_diffs
#
# Rules (mutually exclusive on environment + actor_role to avoid conflicts):
#   1. Production target          → 1 approval, [platform-team, release-managers]
#   2. Non-prod, untrusted role   → 1 approval, [platform-team]
#   3. Staging + mutating + trusted role → 1 approval, [platform-team]
#   4. Otherwise (dev or trusted advisory) → 0 approvals (default)
# ──────────────────────────────────────────────────────────────────────────────
agent_mutating_operation_types := {
    "agent_draft_prs",
    "agent_propose_policy_fixes",
    "agent_propose_architecture_diffs",
}

agent_trusted_caller_roles := {"platform-engineer", "operator"}

is_agent_operation if {
    startswith(input.operation_type, "agent_")
}

# Rule 1 — Production target requires release-quality approvers
required_approvals := 1 if {
    is_agent_operation
    input.environment == "production"
}

required_groups := ["platform-team", "release-managers"] if {
    is_agent_operation
    input.environment == "production"
}

# Rule 2 — Non-prod call from an untrusted caller role
required_approvals := 1 if {
    is_agent_operation
    input.environment != "production"
    not input.actor_role in agent_trusted_caller_roles
}

required_groups := ["platform-team"] if {
    is_agent_operation
    input.environment != "production"
    not input.actor_role in agent_trusted_caller_roles
}

# Rule 3 — Mutating capability targeting staging by a trusted caller
required_approvals := 1 if {
    input.operation_type in agent_mutating_operation_types
    input.environment == "staging"
    input.actor_role in agent_trusted_caller_roles
}

required_groups := ["platform-team"] if {
    input.operation_type in agent_mutating_operation_types
    input.environment == "staging"
    input.actor_role in agent_trusted_caller_roles
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
