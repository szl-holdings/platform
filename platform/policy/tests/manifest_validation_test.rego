package szl.manifest_test

# OPA unit tests for szl.manifest
# Run: opa test platform/policy/ -v

import data.szl.manifest
import future.keywords.if
import future.keywords.in
import future.keywords.contains

# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────
valid_deployment := {
    "kind": "Deployment",
    "apiVersion": "apps/v1",
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
            "szl.io/managed-by": "argo-cd",
            "szl.io/version": "2.1.0",
        },
    },
    "spec": {
        "template": {
            "spec": {
                "containers": [{
                    "name": "api-server",
                    "image": "szlholdingsacr.azurecr.io/api-server:2.1.0",
                    "securityContext": {
                        "runAsNonRoot": true,
                        "runAsUser": 1000,
                    },
                    "resources": {
                        "limits": {"cpu": "500m", "memory": "512Mi"},
                        "requests": {"cpu": "100m", "memory": "128Mi"},
                    },
                    "ports": [{"containerPort": 8080}],
                    "env": [],
                }],
            },
        },
    },
}

# ──────────────────────────────────────────────────────────────────────────────
# Test: Valid deployment passes
# ──────────────────────────────────────────────────────────────────────────────
test_valid_deployment_passes if {
    deny := manifest.deny with input as valid_deployment
    count(deny) == 0
}

# ──────────────────────────────────────────────────────────────────────────────
# Test: Missing required labels cause denial
# ──────────────────────────────────────────────────────────────────────────────
test_missing_owner_label_denied if {
    input_doc := object.remove(valid_deployment, [])
    labels_without_owner := object.remove(valid_deployment.metadata.labels, ["szl.io/owner"])
    modified := json.patch(valid_deployment, [{"op": "replace", "path": "/metadata/labels", "value": labels_without_owner}])
    deny := manifest.deny with input as modified
    count(deny) > 0
    some msg in deny
    contains(msg, "szl.io/owner")
}

# ──────────────────────────────────────────────────────────────────────────────
# Test: Container running as root is denied
# ──────────────────────────────────────────────────────────────────────────────
test_root_container_denied if {
    root_deployment := json.patch(valid_deployment, [
        {"op": "replace", "path": "/spec/template/spec/containers/0/securityContext", "value": {"runAsUser": 0, "runAsNonRoot": false}},
    ])
    deny := manifest.deny with input as root_deployment
    count(deny) > 0
    some msg in deny
    contains(msg, "root")
}

# ──────────────────────────────────────────────────────────────────────────────
# Test: Image with 'latest' tag is denied
# ──────────────────────────────────────────────────────────────────────────────
test_latest_image_tag_denied if {
    latest_deployment := json.patch(valid_deployment, [
        {"op": "replace", "path": "/spec/template/spec/containers/0/image", "value": "szlholdingsacr.azurecr.io/api-server:latest"},
    ])
    deny := manifest.deny with input as latest_deployment
    count(deny) > 0
    some msg in deny
    contains(msg, "latest")
}

# ──────────────────────────────────────────────────────────────────────────────
# Test: Image from unapproved registry is denied
# ──────────────────────────────────────────────────────────────────────────────
test_unapproved_registry_denied if {
    bad_registry := json.patch(valid_deployment, [
        {"op": "replace", "path": "/spec/template/spec/containers/0/image", "value": "docker.io/someuser/api-server:2.1.0"},
    ])
    deny := manifest.deny with input as bad_registry
    count(deny) > 0
    some msg in deny
    contains(msg, "unapproved registry")
}

# ──────────────────────────────────────────────────────────────────────────────
# Test: Missing memory limit is denied
# ──────────────────────────────────────────────────────────────────────────────
test_no_memory_limit_denied if {
    no_limit := json.patch(valid_deployment, [
        {"op": "replace", "path": "/spec/template/spec/containers/0/resources", "value": {"requests": {"cpu": "100m", "memory": "128Mi"}}},
    ])
    deny := manifest.deny with input as no_limit
    count(deny) > 0
    some msg in deny
    contains(msg, "memory limit")
}
