package szl.mutation

# SZL Holdings — Allowed Mutation Scope Policy
# Restricts what can be mutated (created, updated, deleted) in each environment.
# Input: mutation request (resource kind, operation, environment, requestor)

import future.keywords.in
import future.keywords.if
import future.keywords.contains

default allow := false

allow if {
    count(deny) == 0
}

# ──────────────────────────────────────────────────────────────────────────────
# Allowed resource kinds per environment tier
# ──────────────────────────────────────────────────────────────────────────────
dev_mutable_kinds := {
    "Deployment", "Service", "ConfigMap", "Secret",
    "Job", "CronJob", "ServiceAccount",
    "XDomainService", "XAgentWorker", "XInternalUI",
}

staging_mutable_kinds := dev_mutable_kinds | {
    "Ingress", "NetworkPolicy", "HorizontalPodAutoscaler",
}

production_mutable_kinds := staging_mutable_kinds

# ──────────────────────────────────────────────────────────────────────────────
# Rule 1: Mutation of unknown resource kinds is blocked in production
# ──────────────────────────────────────────────────────────────────────────────
deny contains msg if {
    input.environment == "production"
    not input.resource_kind in production_mutable_kinds
    msg := sprintf("Mutation of resource kind '%v' is not on the production allowlist. Submit a policy amendment to add it.", [input.resource_kind])
}

# ──────────────────────────────────────────────────────────────────────────────
# Rule 2: Deletion of stateful resources in production requires 2 approvals
# ──────────────────────────────────────────────────────────────────────────────
stateful_kinds := {"PersistentVolumeClaim", "StatefulSet", "XDomainService"}

deny contains msg if {
    input.environment == "production"
    input.operation == "delete"
    input.resource_kind in stateful_kinds
    count(input.approvals) < 2
    msg := sprintf("Deletion of stateful resource '%v/%v' in production requires 2 approvals. Got: %v", [input.resource_kind, input.resource_name, count(input.approvals)])
}

# ──────────────────────────────────────────────────────────────────────────────
# Rule 3: Namespace-level mutations are platform-team only
# ──────────────────────────────────────────────────────────────────────────────
deny contains msg if {
    input.resource_kind in {"Namespace", "ClusterRole", "ClusterRoleBinding"}
    not "platform-team" in input.requestor_groups
    msg := sprintf("Cluster-scoped resource '%v' can only be mutated by platform-team.", [input.resource_kind])
}

# ──────────────────────────────────────────────────────────────────────────────
# Rule 4: Secrets can only be created/updated, never read via this mutation path
# ──────────────────────────────────────────────────────────────────────────────
deny contains msg if {
    input.resource_kind == "Secret"
    input.operation in {"get", "list", "watch"}
    msg := "Secret read operations must go through the approved secret-access workflow, not the mutation API."
}

# ──────────────────────────────────────────────────────────────────────────────
# Rule 5: Platform infrastructure resources (Crossplane) require platform-team
# ──────────────────────────────────────────────────────────────────────────────
platform_infra_kinds := {
    "XDomainService", "XAgentWorker", "XInternalUI",
    "XEventPipeline", "XDataConnector",
    "Provider", "ProviderConfig", "Function",
}

deny contains msg if {
    input.resource_kind in platform_infra_kinds
    input.environment == "production"
    not "platform-team" in input.requestor_groups
    msg := sprintf("Platform infrastructure resource '%v' in production can only be mutated by platform-team.", [input.resource_kind])
}
