package szl.environment_test

# OPA unit tests for szl.environment
# Run: opa test platform/policy/ -v

import data.szl.environment
import future.keywords.if
import future.keywords.in
import future.keywords.contains

# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────
base_deploy_request := {
    "operation_type": "deploy",
    "environment": "production",
    "requestor_groups": ["platform-team"],
    "staging_health_verified": true,
    "in_change_window": true,
    "emergency_override_approved": false,
    "change_window_approved": true,
    "secret_scope": "production",
    "break_glass_approved": false,
    "image_registry": "szlholdingsacr.azurecr.io",
}

# ──────────────────────────────────────────────────────────────────────────────
# Test: Valid production deployment passes
# ──────────────────────────────────────────────────────────────────────────────
test_valid_production_deploy_allowed if {
    deny := environment.deny with input as base_deploy_request
    count(deny) == 0
}

# ──────────────────────────────────────────────────────────────────────────────
# Test: Deploy outside change window is denied
# ──────────────────────────────────────────────────────────────────────────────
test_deploy_outside_change_window_denied if {
    req := object.union(base_deploy_request, {"in_change_window": false})
    deny := environment.deny with input as req
    count(deny) > 0
    some msg in deny
    contains(msg, "change window")
}

# ──────────────────────────────────────────────────────────────────────────────
# Test: Emergency override allows deploy outside change window
# ──────────────────────────────────────────────────────────────────────────────
test_emergency_override_allows_outside_window if {
    req := object.union(base_deploy_request, {
        "in_change_window": false,
        "emergency_override_approved": true,
    })
    deny := environment.deny with input as req
    count(deny) == 0
}

# ──────────────────────────────────────────────────────────────────────────────
# Test: Non-platform-team cannot deploy to production
# ──────────────────────────────────────────────────────────────────────────────
test_non_platform_team_cannot_deploy_production if {
    req := object.union(base_deploy_request, {"requestor_groups": ["frontend-team"]})
    deny := environment.deny with input as req
    count(deny) > 0
    some msg in deny
    contains(msg, "Production deployments require")
}

# ──────────────────────────────────────────────────────────────────────────────
# Test: Staging health verification required for production
# ──────────────────────────────────────────────────────────────────────────────
test_production_requires_staging_health if {
    req := object.union(base_deploy_request, {"staging_health_verified": false})
    deny := environment.deny with input as req
    count(deny) > 0
    some msg in deny
    contains(msg, "staging health verification")
}

# ──────────────────────────────────────────────────────────────────────────────
# Test: Dev cannot access production secrets
# ──────────────────────────────────────────────────────────────────────────────
test_dev_cannot_access_production_secrets if {
    req := {
        "operation_type": "secret-read",
        "environment": "development",
        "secret_scope": "production",
        "requestor_groups": ["backend-team"],
    }
    deny := environment.deny with input as req
    count(deny) > 0
    some msg in deny
    contains(msg, "production-scoped secrets")
}

# ──────────────────────────────────────────────────────────────────────────────
# Test: Schema migration in staging requires change window approval
# ──────────────────────────────────────────────────────────────────────────────
test_schema_migration_requires_change_window if {
    req := {
        "operation_type": "database-schema-migration",
        "environment": "staging",
        "requestor_groups": ["platform-team"],
        "change_window_approved": false,
        "staging_health_verified": true,
        "in_change_window": true,
        "emergency_override_approved": false,
        "break_glass_approved": false,
        "image_registry": "szlholdingsacr.azurecr.io",
        "secret_scope": "staging",
    }
    deny := environment.deny with input as req
    count(deny) > 0
    some msg in deny
    contains(msg, "change window")
}
