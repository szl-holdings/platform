package szl.approval_test

# OPA unit tests for szl.approval
# Run: opa test platform/policy/ -v

import data.szl.approval
import future.keywords.if
import future.keywords.in
import future.keywords.contains

# ──────────────────────────────────────────────────────────────────────────────
# Test: Production Tier-0 deploy requires 1 approval from platform-team
# ──────────────────────────────────────────────────────────────────────────────
test_production_tier0_deploy_requires_approval if {
    deny := approval.deny with input as {
        "environment": "production",
        "operation_type": "deploy",
        "tier": "tier-0",
        "approvals": [],
        "pending_minutes": 0,
    }
    count(deny) > 0
    some msg in deny
    contains(msg, "requires")
}

test_production_tier0_deploy_satisfied_with_approval if {
    deny := approval.deny with input as {
        "environment": "production",
        "operation_type": "deploy",
        "tier": "tier-0",
        "approvals": [{"state": "approved", "approver_groups": ["platform-team"]}],
        "pending_minutes": 0,
    }
    count(deny) == 0
}

# ──────────────────────────────────────────────────────────────────────────────
# Test: Schema migration in production requires 2 approvals
# ──────────────────────────────────────────────────────────────────────────────
test_production_schema_migration_requires_2_approvals if {
    deny := approval.deny with input as {
        "environment": "production",
        "operation_type": "database-schema-migration",
        "tier": "tier-1",
        "approvals": [{"state": "approved", "approver_groups": ["platform-team"]}],
        "pending_minutes": 0,
    }
    count(deny) > 0
    some msg in deny
    contains(msg, "2")
}

# ──────────────────────────────────────────────────────────────────────────────
# Test: Staging schema migration requires 2 approvals from platform-team
# ──────────────────────────────────────────────────────────────────────────────
test_staging_schema_migration_requires_platform_team if {
    req_groups := approval.required_groups with input as {
        "environment": "staging",
        "operation_type": "database-schema-migration",
        "approvals": [],
        "pending_minutes": 0,
        "tier": "tier-1",
    }
    "platform-team" in req_groups
}

test_staging_schema_migration_satisfied_by_2_platform_approvals if {
    deny := approval.deny with input as {
        "environment": "staging",
        "operation_type": "database-schema-migration",
        "tier": "tier-1",
        "approvals": [
            {"state": "approved", "approver_groups": ["platform-team"]},
            {"state": "approved", "approver_groups": ["platform-team"]},
        ],
        "pending_minutes": 0,
    }
    count(deny) == 0
}

# Production schema migration: 2 approvals from platform-team only must be denied
# (policy-approvers group has no representative — per-group coverage rule applies)
test_production_schema_migration_rejects_same_group_bypass if {
    deny := approval.deny with input as {
        "environment": "production",
        "operation_type": "database-schema-migration",
        "tier": "tier-1",
        "approvals": [
            {"state": "approved", "approver_groups": ["platform-team"]},
            {"state": "approved", "approver_groups": ["platform-team"]},
        ],
        "pending_minutes": 0,
    }
    count(deny) > 0
    some msg in deny
    contains(msg, "policy-approvers")
}

# ──────────────────────────────────────────────────────────────────────────────
# Test: Break-glass in production requires 2 approvals from policy-approvers
# ──────────────────────────────────────────────────────────────────────────────
test_production_break_glass_requires_policy_approvers if {
    req_groups := approval.required_groups with input as {
        "environment": "production",
        "operation_type": "break-glass",
        "approvals": [],
        "pending_minutes": 0,
        "tier": "tier-0",
    }
    "policy-approvers" in req_groups
}

# ──────────────────────────────────────────────────────────────────────────────
# Test: SLA breach triggers denial
# ──────────────────────────────────────────────────────────────────────────────
test_approval_sla_exceeded_for_rollback if {
    deny := approval.deny with input as {
        "environment": "production",
        "operation_type": "rollback",
        "tier": "tier-0",
        "approvals": [],
        "pending_minutes": 31,  # SLA is 30m for rollback
    }
    count(deny) > 0
    some msg in deny
    contains(msg, "SLA")
}

# ──────────────────────────────────────────────────────────────────────────────
# Test: Policy exception requires security-team approval
# ──────────────────────────────────────────────────────────────────────────────
test_policy_exception_requires_security_team if {
    req_groups := approval.required_groups with input as {
        "operation_type": "policy-exception",
        "environment": "production",
        "approvals": [],
        "pending_minutes": 0,
        "tier": "tier-1",
    }
    "security-team" in req_groups
}
