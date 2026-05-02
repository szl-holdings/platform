package szl.mutation_test

# OPA unit tests for szl.mutation
# Run: opa test platform/policy/ -v

import data.szl.mutation
import future.keywords.if
import future.keywords.in
import future.keywords.contains

# ──────────────────────────────────────────────────────────────────────────────
# Test: Known resource kinds are allowed in production
# ──────────────────────────────────────────────────────────────────────────────
test_known_kind_allowed_in_production if {
    deny := mutation.deny with input as {
        "environment": "production",
        "resource_kind": "Deployment",
        "resource_name": "api-server",
        "operation": "update",
        "requestor_groups": ["platform-team"],
        "approvals": [{"state": "approved"}, {"state": "approved"}],
    }
    # Deployment is in the production allowlist; only check no deny about kind allowlist
    not any_allowlist_deny(deny)
}

any_allowlist_deny(deny) if {
    some msg in deny
    contains(msg, "not on the production allowlist")
}

# ──────────────────────────────────────────────────────────────────────────────
# Test: Unknown resource kind is denied in production
# ──────────────────────────────────────────────────────────────────────────────
test_unknown_kind_denied_in_production if {
    deny := mutation.deny with input as {
        "environment": "production",
        "resource_kind": "CustomExperimentalResource",
        "resource_name": "test-resource",
        "operation": "create",
        "requestor_groups": ["backend-team"],
        "approvals": [],
    }
    count(deny) > 0
    some msg in deny
    contains(msg, "not on the production allowlist")
}

# ──────────────────────────────────────────────────────────────────────────────
# Test: Deleting StatefulSet in production without 2 approvals is denied
# ──────────────────────────────────────────────────────────────────────────────
test_stateful_delete_without_2_approvals_denied if {
    deny := mutation.deny with input as {
        "environment": "production",
        "resource_kind": "StatefulSet",
        "resource_name": "db-primary",
        "operation": "delete",
        "requestor_groups": ["platform-team"],
        "approvals": [{"state": "approved"}],  # Only 1, needs 2
    }
    count(deny) > 0
    some msg in deny
    contains(msg, "requires 2 approvals")
}

test_stateful_delete_with_2_approvals_passes if {
    deny := mutation.deny with input as {
        "environment": "production",
        "resource_kind": "StatefulSet",
        "resource_name": "db-primary",
        "operation": "delete",
        "requestor_groups": ["platform-team"],
        "approvals": [{"state": "approved"}, {"state": "approved"}],
    }
    not any_stateful_deny(deny)
}

any_stateful_deny(deny) if {
    some msg in deny
    contains(msg, "requires 2 approvals")
}

# ──────────────────────────────────────────────────────────────────────────────
# Test: Namespace mutations require platform-team
# ──────────────────────────────────────────────────────────────────────────────
test_namespace_mutation_non_platform_denied if {
    deny := mutation.deny with input as {
        "environment": "production",
        "resource_kind": "Namespace",
        "resource_name": "szl-new-service",
        "operation": "create",
        "requestor_groups": ["backend-team"],
        "approvals": [],
    }
    count(deny) > 0
    some msg in deny
    contains(msg, "platform-team")
}

test_namespace_mutation_platform_team_allowed if {
    deny := mutation.deny with input as {
        "environment": "production",
        "resource_kind": "Namespace",
        "resource_name": "szl-new-service",
        "operation": "create",
        "requestor_groups": ["platform-team"],
        "approvals": [],
    }
    not any_cluster_scope_deny(deny)
}

any_cluster_scope_deny(deny) if {
    some msg in deny
    contains(msg, "platform-team")
}
