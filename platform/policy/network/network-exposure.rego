package szl.network

# SZL Holdings — Prohibited Network Exposure Policy
# Prevents services from exposing ports or endpoints they should not.
# Input: service/ingress manifest or deployment context

import future.keywords.in
import future.keywords.if
import future.keywords.contains

default allow := false

allow if {
    count(deny) == 0
}

# ──────────────────────────────────────────────────────────────────────────────
# Rule 1: Internal services must not have public ingress
# ──────────────────────────────────────────────────────────────────────────────
internal_services := {
    "lyte-metrics-store",
    "alloy-fabric-api",
    "alloy-fabric-ingest-control",
    "substrate-mcp-gateway",
    "meridian-control-plane",
    "temporal-worker",
}

deny contains msg if {
    input.kind == "Ingress"
    input.metadata.labels["szl.io/service"] in internal_services
    not input.metadata.annotations["szl.io/internal-only"] == "true"
    msg := sprintf("Service '%v' is designated internal-only and must not have a public Ingress. Use internal service mesh or ClusterIP.", [input.metadata.labels["szl.io/service"]])
}

# ──────────────────────────────────────────────────────────────────────────────
# Rule 2: Admin and debug ports must not be exposed externally
# ──────────────────────────────────────────────────────────────────────────────
prohibited_external_ports := {2379, 2380, 6443, 8443, 9090, 9091, 9100, 15090}

deny contains msg if {
    input.kind in {"Service"}
    input.spec.type in {"LoadBalancer", "NodePort"}
    port := input.spec.ports[_]
    port.port in prohibited_external_ports
    msg := sprintf("Service '%v' exposes prohibited port %v externally. This port is for internal cluster use only.", [input.metadata.name, port.port])
}

# ──────────────────────────────────────────────────────────────────────────────
# Rule 3: OTel collector gRPC (4317) and HTTP (4318) must not be public
# ──────────────────────────────────────────────────────────────────────────────
deny contains msg if {
    input.kind == "Service"
    input.spec.type in {"LoadBalancer", "NodePort"}
    port := input.spec.ports[_]
    port.port in {4317, 4318}
    msg := "OTel collector ports (4317/4318) must not be publicly exposed. Use internal ClusterIP service."
}

# ──────────────────────────────────────────────────────────────────────────────
# Rule 4: Database ports must never be exposed via Service or Ingress
# ──────────────────────────────────────────────────────────────────────────────
database_ports := {5432, 3306, 1433, 27017, 6379}

deny contains msg if {
    input.kind == "Service"
    port := input.spec.ports[_]
    port.port in database_ports
    input.spec.type != "ClusterIP"
    msg := sprintf("Database port %v must only be exposed as ClusterIP. External exposure of database ports is prohibited.", [port.port])
}

# ──────────────────────────────────────────────────────────────────────────────
# Rule 5: hostNetwork and hostPort are prohibited
# ──────────────────────────────────────────────────────────────────────────────
deny contains msg if {
    input.kind in {"Deployment", "StatefulSet", "DaemonSet", "Pod"}
    input.spec.template.spec.hostNetwork == true
    msg := sprintf("Resource '%v' uses hostNetwork=true which is prohibited. Use pod networking.", [input.metadata.name])
}

deny contains msg if {
    input.kind in {"Deployment", "StatefulSet", "DaemonSet", "Pod"}
    container := input.spec.template.spec.containers[_]
    port := container.ports[_]
    port.hostPort
    msg := sprintf("Container '%v' in '%v' uses hostPort which is prohibited.", [container.name, input.metadata.name])
}

# ──────────────────────────────────────────────────────────────────────────────
# Rule 6: NetworkPolicy must exist for every namespace with workloads
# ──────────────────────────────────────────────────────────────────────────────
deny contains msg if {
    input.kind == "Namespace"
    input.metadata.labels["szl.io/has-workloads"] == "true"
    not input.metadata.annotations["szl.io/network-policy-applied"] == "true"
    msg := sprintf("Namespace '%v' has workloads but no NetworkPolicy annotation. Ensure a default-deny NetworkPolicy is applied.", [input.metadata.name])
}
