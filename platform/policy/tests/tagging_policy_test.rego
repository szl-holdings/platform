package szl.tagging_test

# OPA unit tests for szl.tagging
# Run: opa test platform/policy/ -v

import data.szl.tagging
import future.keywords.if
import future.keywords.in
import future.keywords.contains

# Reusable base manifest with all required labels for production
base_production_manifest := {
    "kind": "Deployment",
    "metadata": {
        "name": "api-server",
        "namespace": "szl-platform",
        "labels": {
            "szl.io/domain": "platform",
            "szl.io/owner": "platform-team",
            "szl.io/environment": "production",
            "szl.io/tier": "tier-0",
            "szl.io/managed-by": "argo-cd",
        },
        "annotations": {
            "szl.io/cost-center": "CC-PLATFORM",
            "szl.io/runbook": "https://wiki.szl.io/runbooks/api-server",
        },
    },
}

# ──────────────────────────────────────────────────────────────────────────────
# Test: Fully compliant production deployment is allowed
# ──────────────────────────────────────────────────────────────────────────────
test_compliant_production_deployment_allowed if {
    deny := tagging.deny with input as base_production_manifest
    count(deny) == 0
}

# ──────────────────────────────────────────────────────────────────────────────
# Test: Missing required label is denied
# ──────────────────────────────────────────────────────────────────────────────
test_missing_owner_label_denied if {
    input_manifest := json.patch(base_production_manifest, [
        {"op": "remove", "path": "/metadata/labels/szl.io~1owner"},
    ])
    deny := tagging.deny with input as input_manifest
    count(deny) > 0
    some msg in deny
    contains(msg, "szl.io/owner")
}

# ──────────────────────────────────────────────────────────────────────────────
# Test: Unknown domain value is denied
# ──────────────────────────────────────────────────────────────────────────────
test_unknown_domain_denied if {
    deny := tagging.deny with input as {
        "kind": "Deployment",
        "metadata": {
            "name": "test-service",
            "labels": {
                "szl.io/domain": "my-unknown-domain",
                "szl.io/owner": "platform-team",
                "szl.io/environment": "development",
                "szl.io/tier": "tier-2",
                "szl.io/managed-by": "argo-cd",
            },
            "annotations": {},
        },
    }
    count(deny) > 0
    some msg in deny
    contains(msg, "unknown domain label")
}

# ──────────────────────────────────────────────────────────────────────────────
# Test: Invalid tier value is denied
# ──────────────────────────────────────────────────────────────────────────────
test_invalid_tier_denied if {
    deny := tagging.deny with input as {
        "kind": "ConfigMap",
        "metadata": {
            "name": "app-config",
            "labels": {
                "szl.io/domain": "platform",
                "szl.io/owner": "backend-team",
                "szl.io/environment": "staging",
                "szl.io/tier": "critical",  # Not an allowed tier
                "szl.io/managed-by": "helm",
            },
            "annotations": {},
        },
    }
    count(deny) > 0
    some msg in deny
    contains(msg, "unknown tier label")
}

# ──────────────────────────────────────────────────────────────────────────────
# Test: Production deployment without cost-center annotation is denied
# ──────────────────────────────────────────────────────────────────────────────
test_production_missing_cost_center_denied if {
    deny := tagging.deny with input as {
        "kind": "Deployment",
        "metadata": {
            "name": "api-server",
            "labels": {
                "szl.io/domain": "platform",
                "szl.io/owner": "platform-team",
                "szl.io/environment": "production",
                "szl.io/tier": "tier-0",
                "szl.io/managed-by": "argo-cd",
            },
            "annotations": {
                "szl.io/runbook": "https://wiki.szl.io/runbooks/api-server",
                # missing: szl.io/cost-center
            },
        },
    }
    count(deny) > 0
    some msg in deny
    contains(msg, "cost-center")
}

# ──────────────────────────────────────────────────────────────────────────────
# Test: Production Deployment without runbook annotation is denied
# ──────────────────────────────────────────────────────────────────────────────
test_production_deployment_missing_runbook_denied if {
    deny := tagging.deny with input as {
        "kind": "Deployment",
        "metadata": {
            "name": "api-server",
            "labels": {
                "szl.io/domain": "platform",
                "szl.io/owner": "platform-team",
                "szl.io/environment": "production",
                "szl.io/tier": "tier-0",
                "szl.io/managed-by": "argo-cd",
            },
            "annotations": {
                "szl.io/cost-center": "CC-PLATFORM",
                # missing: szl.io/runbook
            },
        },
    }
    count(deny) > 0
    some msg in deny
    contains(msg, "runbook")
}

# ──────────────────────────────────────────────────────────────────────────────
# Test: Unknown managed-by value is denied
# ──────────────────────────────────────────────────────────────────────────────
test_unknown_managed_by_denied if {
    deny := tagging.deny with input as {
        "kind": "Service",
        "metadata": {
            "name": "my-service",
            "labels": {
                "szl.io/domain": "platform",
                "szl.io/owner": "platform-team",
                "szl.io/environment": "staging",
                "szl.io/tier": "tier-1",
                "szl.io/managed-by": "ansible",  # Not an allowed manager
            },
            "annotations": {},
        },
    }
    count(deny) > 0
    some msg in deny
    contains(msg, "unknown managed-by")
}
