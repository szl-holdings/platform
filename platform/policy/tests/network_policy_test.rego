package szl.network_test

# OPA unit tests for szl.network
# Run: opa test platform/policy/ -v

import data.szl.network
import future.keywords.if
import future.keywords.in
import future.keywords.contains

# ──────────────────────────────────────────────────────────────────────────────
# Test: Internal service with public Ingress (no annotation) is denied
# ──────────────────────────────────────────────────────────────────────────────
test_internal_service_public_ingress_denied if {
    deny := network.deny with input as {
        "kind": "Ingress",
        "metadata": {
            "name": "alloy-api-ingress",
            "labels": {"szl.io/service": "alloy-fabric-api"},
            "annotations": {},
        },
        "spec": {},
    }
    count(deny) > 0
    some msg in deny
    contains(msg, "internal-only")
}

test_internal_service_with_annotation_allowed if {
    deny := network.deny with input as {
        "kind": "Ingress",
        "metadata": {
            "name": "alloy-api-ingress",
            "labels": {"szl.io/service": "alloy-fabric-api"},
            "annotations": {"szl.io/internal-only": "true"},
        },
        "spec": {},
    }
    not any_internal_deny(deny)
}

any_internal_deny(deny) if {
    some msg in deny
    contains(msg, "internal-only")
}

# ──────────────────────────────────────────────────────────────────────────────
# Test: LoadBalancer exposing prohibited admin port is denied
# ──────────────────────────────────────────────────────────────────────────────
test_loadbalancer_admin_port_denied if {
    deny := network.deny with input as {
        "kind": "Service",
        "metadata": {"name": "my-service"},
        "spec": {
            "type": "LoadBalancer",
            "ports": [{"port": 9090}],  # 9090 is in prohibited_external_ports
        },
    }
    count(deny) > 0
    some msg in deny
    contains(msg, "prohibited port")
}

# ──────────────────────────────────────────────────────────────────────────────
# Test: OTel ports (4317/4318) blocked on LoadBalancer
# ──────────────────────────────────────────────────────────────────────────────
test_otel_port_on_loadbalancer_denied if {
    deny := network.deny with input as {
        "kind": "Service",
        "metadata": {"name": "otel-collector"},
        "spec": {
            "type": "LoadBalancer",
            "ports": [{"port": 4317}],
        },
    }
    count(deny) > 0
    some msg in deny
    contains(msg, "OTel collector ports")
}

# ──────────────────────────────────────────────────────────────────────────────
# Test: Database port blocked when not ClusterIP
# ──────────────────────────────────────────────────────────────────────────────
test_database_port_on_nodeport_denied if {
    deny := network.deny with input as {
        "kind": "Service",
        "metadata": {"name": "postgres-svc"},
        "spec": {
            "type": "NodePort",
            "ports": [{"port": 5432}],
        },
    }
    count(deny) > 0
    some msg in deny
    contains(msg, "Database port")
}

test_database_port_on_clusterip_allowed if {
    deny := network.deny with input as {
        "kind": "Service",
        "metadata": {"name": "postgres-svc"},
        "spec": {
            "type": "ClusterIP",
            "ports": [{"port": 5432}],
        },
    }
    not any_db_port_deny(deny)
}

any_db_port_deny(deny) if {
    some msg in deny
    contains(msg, "Database port")
}

# ──────────────────────────────────────────────────────────────────────────────
# Test: hostNetwork=true is denied
# ──────────────────────────────────────────────────────────────────────────────
test_host_network_deployment_denied if {
    deny := network.deny with input as {
        "kind": "Deployment",
        "metadata": {"name": "risky-deployment"},
        "spec": {
            "template": {
                "spec": {
                    "hostNetwork": true,
                    "containers": [],
                },
            },
        },
    }
    count(deny) > 0
    some msg in deny
    contains(msg, "hostNetwork")
}
