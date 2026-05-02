package szl.manifest

# SZL Holdings — Kubernetes / Crossplane Manifest Validation Policy
# Evaluates resource manifests before Argo CD sync or Crossplane apply.
# Input: Kubernetes or Crossplane resource manifest (single object)
#
# Usage:
#   opa eval -d platform/policy/ -i manifest.json "data.szl.manifest.deny"

import future.keywords.in
import future.keywords.if
import future.keywords.contains

default allow := false

allow if {
    count(deny) == 0
}

# ──────────────────────────────────────────────────────────────────────────────
# Rule 1: All resources must have required SZL labels
# ──────────────────────────────────────────────────────────────────────────────
required_labels := {
    "szl.io/domain",
    "szl.io/owner",
    "szl.io/environment",
    "szl.io/tier",
}

deny contains msg if {
    label := required_labels[_]
    not input.metadata.labels[label]
    msg := sprintf("Resource '%v' is missing required label '%v'.", [input.metadata.name, label])
}

# ──────────────────────────────────────────────────────────────────────────────
# Rule 2: All resources must have required SZL annotations
# ──────────────────────────────────────────────────────────────────────────────
required_annotations := {
    "szl.io/managed-by",
    "szl.io/version",
}

deny contains msg if {
    annotation := required_annotations[_]
    not input.metadata.annotations[annotation]
    msg := sprintf("Resource '%v' is missing required annotation '%v'.", [input.metadata.name, annotation])
}

# ──────────────────────────────────────────────────────────────────────────────
# Rule 3: Containers must not run as root
# ──────────────────────────────────────────────────────────────────────────────
deny contains msg if {
    input.kind in {"Deployment", "StatefulSet", "DaemonSet", "Job", "CronJob"}
    container := input.spec.template.spec.containers[_]
    security_context := container.securityContext
    security_context.runAsUser == 0
    msg := sprintf("Container '%v' in '%v' is configured to run as root (uid=0). Use a non-root user.", [container.name, input.metadata.name])
}

deny contains msg if {
    input.kind in {"Deployment", "StatefulSet", "DaemonSet", "Job", "CronJob"}
    container := input.spec.template.spec.containers[_]
    not container.securityContext.runAsNonRoot
    msg := sprintf("Container '%v' in '%v' does not set runAsNonRoot=true.", [container.name, input.metadata.name])
}

# ──────────────────────────────────────────────────────────────────────────────
# Rule 4: Containers must set resource limits
# ──────────────────────────────────────────────────────────────────────────────
deny contains msg if {
    input.kind in {"Deployment", "StatefulSet", "DaemonSet", "Job", "CronJob"}
    container := input.spec.template.spec.containers[_]
    not container.resources.limits.memory
    msg := sprintf("Container '%v' in '%v' has no memory limit. Memory limits are required.", [container.name, input.metadata.name])
}

deny contains msg if {
    input.kind in {"Deployment", "StatefulSet", "DaemonSet", "Job", "CronJob"}
    container := input.spec.template.spec.containers[_]
    not container.resources.limits.cpu
    msg := sprintf("Container '%v' in '%v' has no CPU limit. CPU limits are required.", [container.name, input.metadata.name])
}

# ──────────────────────────────────────────────────────────────────────────────
# Rule 5: Images must not use the 'latest' tag
# ──────────────────────────────────────────────────────────────────────────────
deny contains msg if {
    input.kind in {"Deployment", "StatefulSet", "DaemonSet", "Job", "CronJob"}
    container := input.spec.template.spec.containers[_]
    endswith(container.image, ":latest")
    msg := sprintf("Container '%v' uses the 'latest' image tag. Pin to a specific version or digest.", [container.name])
}

deny contains msg if {
    input.kind in {"Deployment", "StatefulSet", "DaemonSet", "Job", "CronJob"}
    container := input.spec.template.spec.containers[_]
    not contains(container.image, ":")
    msg := sprintf("Container '%v' has no image tag or digest. Pin to a specific version.", [container.name])
}

# ──────────────────────────────────────────────────────────────────────────────
# Rule 6: Images must come from approved registries
# ──────────────────────────────────────────────────────────────────────────────
approved_registries := {
    "szlholdingsacr.azurecr.io",
    "ghcr.io/szl-holdings",
    "otel/opentelemetry-collector-contrib",
}

deny contains msg if {
    input.kind in {"Deployment", "StatefulSet", "DaemonSet", "Job", "CronJob"}
    container := input.spec.template.spec.containers[_]
    not any_approved_registry(container.image, approved_registries)
    msg := sprintf("Container '%v' uses image '%v' from an unapproved registry. Use szlholdingsacr.azurecr.io or ghcr.io/szl-holdings.", [container.name, container.image])
}

any_approved_registry(image, registries) if {
    registry := registries[_]
    startswith(image, registry)
}

# ──────────────────────────────────────────────────────────────────────────────
# Rule 7: Crossplane XRs must reference the correct environment claim
# ──────────────────────────────────────────────────────────────────────────────
deny contains msg if {
    input.apiVersion == "platform.szl.io/v1alpha1"
    not input.spec.environment
    msg := sprintf("Crossplane resource '%v' has no spec.environment. Must declare target environment.", [input.metadata.name])
}

# ──────────────────────────────────────────────────────────────────────────────
# Rule 8: Argo Application sources must point to the canonical git repo
# ──────────────────────────────────────────────────────────────────────────────
allowed_source_repos := {
    "https://github.com/szl-holdings/monorepo",
    "https://github.com/szl-holdings/platform-config",
}

deny contains msg if {
    input.kind == "Application"
    input.apiVersion == "argoproj.io/v1alpha1"
    not any_allowed_repo(input.spec.source.repoURL, allowed_source_repos)
    msg := sprintf("Argo Application '%v' sources from an unrecognised repo '%v'. Only canonical repos are permitted.", [input.metadata.name, input.spec.source.repoURL])
}

any_allowed_repo(url, allowed) if {
    allowed_url := allowed[_]
    startswith(url, allowed_url)
}
