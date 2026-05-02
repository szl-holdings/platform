package szl.tagging

# SZL Holdings — Tagging & Ownership Enforcement Policy
# Every resource must declare an owner and the canonical required labels.
# Input: any resource manifest

import future.keywords.in
import future.keywords.if
import future.keywords.contains

default allow := false

allow if {
    count(deny) == 0
}

# ──────────────────────────────────────────────────────────────────────────────
# Required labels for ALL resources
# ──────────────────────────────────────────────────────────────────────────────
required_labels := {
    "szl.io/domain",
    "szl.io/owner",
    "szl.io/environment",
    "szl.io/tier",
    "szl.io/managed-by",
}

deny contains msg if {
    label := required_labels[_]
    not input.metadata.labels[label]
    msg := sprintf("Resource '%v/%v' is missing required label '%v'.", [input.kind, input.metadata.name, label])
}

# ──────────────────────────────────────────────────────────────────────────────
# Allowed domain values
# ──────────────────────────────────────────────────────────────────────────────
allowed_domains := {
    "platform", "intelligence", "data-platform",
    "governance", "products", "infrastructure", "security",
}

deny contains msg if {
    domain := input.metadata.labels["szl.io/domain"]
    not domain in allowed_domains
    msg := sprintf("Resource '%v' has unknown domain label '%v'. Must be one of: %v", [input.metadata.name, domain, allowed_domains])
}

# ──────────────────────────────────────────────────────────────────────────────
# Allowed tier values
# ──────────────────────────────────────────────────────────────────────────────
allowed_tiers := {"tier-0", "tier-1", "tier-2", "tier-3"}

deny contains msg if {
    tier := input.metadata.labels["szl.io/tier"]
    not tier in allowed_tiers
    msg := sprintf("Resource '%v' has unknown tier label '%v'. Must be one of: %v", [input.metadata.name, tier, allowed_tiers])
}

# ──────────────────────────────────────────────────────────────────────────────
# Owner must be a known team
# ──────────────────────────────────────────────────────────────────────────────
allowed_owners := {
    "platform-team", "data-team", "ai-ml-team",
    "security-team", "frontend-team", "backend-team",
    "mobile-team", "devops-team", "executive",
}

deny contains msg if {
    owner := input.metadata.labels["szl.io/owner"]
    not owner in allowed_owners
    msg := sprintf("Resource '%v' has unknown owner '%v'. Must be one of: %v", [input.metadata.name, owner, allowed_owners])
}

# ──────────────────────────────────────────────────────────────────────────────
# Production resources must also have cost-center and runbook annotations
# ──────────────────────────────────────────────────────────────────────────────
deny contains msg if {
    input.metadata.labels["szl.io/environment"] == "production"
    not input.metadata.annotations["szl.io/cost-center"]
    msg := sprintf("Production resource '%v' is missing cost-center annotation 'szl.io/cost-center'.", [input.metadata.name])
}

deny contains msg if {
    input.metadata.labels["szl.io/environment"] == "production"
    input.kind in {"Deployment", "StatefulSet", "Job", "CronJob"}
    not input.metadata.annotations["szl.io/runbook"]
    msg := sprintf("Production workload '%v' is missing runbook annotation 'szl.io/runbook'.", [input.metadata.name])
}

# ──────────────────────────────────────────────────────────────────────────────
# Managed-by must be a known orchestrator
# ──────────────────────────────────────────────────────────────────────────────
allowed_managers := {"argo-cd", "crossplane", "helm", "kustomize", "platform-team"}

deny contains msg if {
    manager := input.metadata.labels["szl.io/managed-by"]
    not manager in allowed_managers
    msg := sprintf("Resource '%v' has unknown managed-by value '%v'. Must be one of: %v", [input.metadata.name, manager, allowed_managers])
}
